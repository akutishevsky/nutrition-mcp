import { addedSugarMissingText } from "../added-sugar.js";
import { formatAlcohol, type DrinkUnit } from "../alcohol.js";
import { ToolError, toolErrorWithUserText } from "../errors.js";
import {
    type HealthActivityLinkStatus,
    type HealthSyncLinkStatus,
} from "../health-sync-store.js";
import { limitNotRecorded } from "../insights.js";
import {
    compactSugarFigure,
    formatItemsBlock,
    normalizeNameRef,
    type NutrientValues,
} from "../meal-items.js";
import {
    formatMealFull,
    formatMg,
    type AlcoholDisplay,
} from "../meal-listing.js";
import {
    formatItemSourcesBlock,
    formatSourcesLine,
    parseNutrientSources,
    parseSourceDetail,
    type ItemSourcesInput,
} from "../provenance.js";
import {
    type BodyMeasurementEntry,
    type Meal,
    type NutritionGoals,
    type SavedMealWithItems,
    type WeightEntry,
} from "../supabase.js";
import { dateInTz, formatLocalDateTime, weekdayInTz } from "../tz.js";
import {
    formatWeight,
    fromMillimetres,
    measurementLabel,
    type LengthUnit,
    type WeightUnit,
} from "../units.js";
import { MAX_SAVED_MEAL_DESCRIPTION_CHARS } from "./constants.js";
import { type DailyTotals, type NutrientPresence } from "./totals.js";

// Which way a target points. A floor is something to reach (calories, protein,
// carbs, fat, water, fiber); a ceiling is something to stay under (sugar,
// alcohol, caffeine). The distinction is not cosmetic: with the floor wording a
// 40 g sugar target and 0 g eaten reads "40g to go", which congratulates the
// user for having sugar left to consume.
export type GoalDirection = "floor" | "ceiling";

// Whether a stored target is a target at all. Zero splits by direction: a
// CEILING of 0 is a real limit — "none at all" is the single most likely
// alcohol goal anyone sets, and the old `target <= 0` guard let such a goal be
// stored, echoed back by get_nutrition_goals, and then silently ignored on
// every progress line, which is worse than refusing it. A FLOOR of 0 stays
// "unset": a 0 g protein target is meaningless. Negatives are rejected in both
// directions, and so is NaN (z.coerce turns "" into NaN).
export function hasActiveTarget(
    target: number | null | undefined,
    direction: GoalDirection = "floor",
): target is number {
    if (target == null || Number.isNaN(target)) return false;
    return direction === "ceiling" ? target >= 0 : target > 0;
}

// `actualText` overrides how the consumed amount is printed, for values whose
// natural rendering is not "<number><unit>" — alcohol, which always carries its
// drinks gloss (see formatAlcohol). Everything else passes it as undefined.
export function formatGoalLine(
    label: string,
    unit: string,
    actual: number,
    target: number | null,
    direction: GoalDirection = "floor",
    actualText?: string,
): string {
    const rounded = Math.round(actual * 10) / 10;
    if (!hasActiveTarget(target, direction)) {
        // Standalone, so the amount carries the unit itself.
        return `${label}: ${actualText ?? `${rounded}${unit}`}`;
    }
    const shown = actualText ?? String(rounded);
    const delta = Math.round((target - actual) * 10) / 10;
    if (direction === "ceiling") {
        // A limit is not a budget. "40g left" handed someone trying to drink or
        // sweeten less a daily permission slip, and on an averaged view
        // ("7-day average, 12.1 g left") it means nothing at all. Report the
        // position relative to the limit instead, matching the "Days over
        // limit" phrasing computeTrends already uses.
        //
        // A limit of 0 gets no percentage: every ratio against it is Infinity
        // or NaN. "clear" is the word computeWeeklyDigest uses for the same
        // case, so the two narratives read alike.
        const pct =
            target > 0 ? `${Math.round((actual / target) * 100)}%, ` : "";
        const state =
            delta < 0
                ? `${Math.abs(delta)}${unit} over`
                : target === 0
                  ? "clear"
                  : "under";
        return `${label}: ${shown} / ${target}${unit} limit (${pct}${state})`;
    }
    const pct = Math.round((actual / target) * 100);
    const deltaStr =
        delta > 0 ? `${delta}${unit} to go` : `${Math.abs(delta)}${unit} over`;
    // Against a target the unit sits on the target only ("1500 / 2000 kcal") —
    // unchanged from before this gained a direction.
    return `${label}: ${shown} / ${target}${unit} (${pct}%, ${deltaStr})`;
}

// A nutrient nobody recorded is not a zero. Fiber, sugar and caffeine each
// arrived long after most of the history in this database, so "0g" on a day
// whose meals predate them is a fabricated figure — say nothing instead (the
// same instinct as hasAnyPositive() in insights.ts). The exception is a day
// with an active target, where a vanished line would read as tracking having
// broken; "not recorded" still refuses to invent the number.
export function recordedGoalLine(
    label: string,
    unit: string,
    actual: number,
    target: number | null,
    recorded: boolean,
    direction: GoalDirection,
): string | null {
    if (recorded) return formatGoalLine(label, unit, actual, target, direction);
    if (!hasActiveTarget(target, direction)) return null;
    const noun = direction === "ceiling" ? "limit" : "target";
    return `${label}: not recorded / ${target}${unit} ${noun}`;
}

// Everything recorded, for the callers that have no per-meal list to inspect.
export const ALL_RECORDED: NutrientPresence = {
    saturated_fat_g: true,
    trans_fat_g: true,
    fiber_g: true,
    sugar_g: true,
    added_sugar_g: true,
    alcohol_g: true,
    caffeine_mg: true,
    sodium_mg: true,
};

// `present` says which of the post-launch nutrients these meals actually carry,
// so a pre-feature day prints nothing for fiber rather than a made-up "0g".
// Fiber, sugar and caffeine consult it; alcohol does not, because it has its
// own explicit opt-in, and for a user who turned it ON a zero is the meaningful
// reading — that is exactly the "0 g against a 0 g limit" a recovery user set
// the limit to see. Caffeine leans on `present` hardest: it is the only gate it
// has, since there is deliberately no caffeine_tracking_enabled.
export function formatProgress(
    totals: DailyTotals,
    goals: NutritionGoals | null,
    alcohol: AlcoholDisplay,
    present: NutrientPresence = ALL_RECORDED,
): string {
    const lines: Array<string | null> = [
        formatGoalLine(
            "Calories",
            " kcal",
            totals.calories,
            goals?.daily_calories ?? null,
        ),
        formatGoalLine(
            "Protein",
            "g",
            totals.protein_g,
            goals?.daily_protein_g ?? null,
        ),
        formatGoalLine(
            "Carbs",
            "g",
            totals.carbs_g,
            goals?.daily_carbs_g ?? null,
        ),
        formatGoalLine("Fat", "g", totals.fat_g, goals?.daily_fat_g ?? null),
        // Saturated fat is part of the fat above and carries a ceiling, gated on
        // presence like sugar: a day that recorded none prints nothing unless a
        // limit is set, which then gets the shared not-recorded wording. Trans
        // fat has no goal, so it is a value only, shown when the day recorded it.
        present.saturated_fat_g
            ? formatGoalLine(
                  "Saturated fat",
                  "g",
                  totals.saturated_fat_g,
                  goals?.daily_saturated_fat_g ?? null,
                  "ceiling",
              )
            : hasActiveTarget(goals?.daily_saturated_fat_g, "ceiling")
              ? `Saturated fat: ${limitNotRecorded("day", goals.daily_saturated_fat_g)}`
              : null,
        present.trans_fat_g
            ? `Trans fat: ${Math.round(totals.trans_fat_g * 10) / 10}g`
            : null,
        recordedGoalLine(
            "Fiber",
            "g",
            totals.fiber_g,
            goals?.daily_fiber_g ?? null,
            present.fiber_g,
            "floor",
        ),
        recordedGoalLine(
            "Sugar",
            "g",
            totals.sugar_g,
            goals?.daily_sugar_g ?? null,
            present.sugar_g,
            "ceiling",
        ),
        // Its own ceiling, beside total sugar rather than instead of it: the
        // public guidance figures (WHO, AHA, DGA) limit added or free sugar,
        // and a 25 g total-sugar limit is spent by two bananas. Gated on
        // presence like sugar, so a pre-column day prints nothing without a
        // limit. With one, an unrecorded day gets the shared
        // limitNotRecorded wording rather than recordedGoalLine's terse
        // "not recorded / 29g limit", which a model read past to report total
        // sugar against the added-sugar limit.
        present.added_sugar_g
            ? formatGoalLine(
                  "Added sugar",
                  "g",
                  totals.added_sugar_g,
                  goals?.daily_added_sugar_g ?? null,
                  "ceiling",
              )
            : hasActiveTarget(goals?.daily_added_sugar_g, "ceiling")
              ? `Added sugar: ${limitNotRecorded("day", goals.daily_added_sugar_g)}`
              : null,
    ];
    // Alcohol is opt-in: stored either way, shown only when the user asked for
    // it (imported exports carry trace alcohol from recipes, and surfacing that
    // unbidden is actively harmful for someone in recovery).
    if (alcohol) {
        lines.push(
            formatGoalLine(
                "Alcohol",
                "g",
                totals.alcohol_g,
                goals?.daily_alcohol_g ?? null,
                "ceiling",
                formatAlcohol(totals.alcohol_g, alcohol),
            ),
        );
    }
    // No opt-in to consult — `present.caffeine_mg` is the whole gate. Rounded to
    // whole milligrams before the line is built (see formatMg) so both the
    // with-target and the standalone wording stay decimal-free.
    lines.push(
        recordedGoalLine(
            "Caffeine",
            " mg",
            Math.round(totals.caffeine_mg),
            goals?.daily_caffeine_mg ?? null,
            present.caffeine_mg,
            "ceiling",
        ),
    );
    // Sodium: a ceiling, gated on presence like saturated fat, with the shared
    // not-recorded wording when a limit is set and the day recorded none. Whole
    // milligrams, like caffeine above.
    lines.push(
        present.sodium_mg
            ? formatGoalLine(
                  "Sodium",
                  " mg",
                  Math.round(totals.sodium_mg),
                  goals?.daily_sodium_mg ?? null,
                  "ceiling",
              )
            : hasActiveTarget(goals?.daily_sodium_mg, "ceiling")
              ? `Sodium: ${limitNotRecorded("day", goals.daily_sodium_mg, " mg")}`
              : null,
    );
    lines.push(
        formatGoalLine(
            "Water",
            " ml",
            totals.water_ml,
            goals?.daily_water_ml ?? null,
        ),
    );
    return lines.filter((l): l is string => l !== null).join("\n");
}

export function formatGoals(
    goals: NutritionGoals | null,
    weightUnit: WeightUnit = "kg",
    alcohol: AlcoholDisplay = null,
): string {
    if (!goals) {
        return "No nutrition goals set. Use set_nutrition_goals to define daily targets.";
    }
    // "not set" must mean exactly what formatGoalLine ignores, or the echo
    // promises a target that no progress line will ever honour — which is how a
    // 0 g alcohol limit came to be stored, listed, and then quietly dropped.
    // Floors: 0 is unset. Ceilings: 0 is a real limit and is listed as one.
    const floor = (v: number | null, render: (n: number) => string) =>
        hasActiveTarget(v, "floor") ? render(v) : "not set";
    const ceiling = (v: number | null, render: (n: number) => string) =>
        hasActiveTarget(v, "ceiling") ? render(v) : "not set";
    const parts: string[] = ["Current daily goals:"];
    parts.push(
        `- Calories: ${floor(goals.daily_calories, (n) => `${n} kcal`)}`,
    );
    parts.push(`- Protein: ${floor(goals.daily_protein_g, (n) => `${n}g`)}`);
    parts.push(`- Carbs: ${floor(goals.daily_carbs_g, (n) => `${n}g`)}`);
    parts.push(`- Fat: ${floor(goals.daily_fat_g, (n) => `${n}g`)}`);
    parts.push(
        `- Saturated fat (max): ${ceiling(goals.daily_saturated_fat_g ?? null, (n) => `${n}g`)}`,
    );
    parts.push(`- Fiber: ${floor(goals.daily_fiber_g, (n) => `${n}g`)}`);
    // "total" leads so the two sugar limits read apart at a glance.
    parts.push(
        `- Sugar, total (max): ${ceiling(goals.daily_sugar_g, (n) => `${n}g`)}`,
    );
    parts.push(
        `- Added sugar (max): ${ceiling(goals.daily_added_sugar_g, (n) => `${n}g`)}`,
    );
    if (alcohol) {
        parts.push(
            `- Alcohol (max): ${ceiling(goals.daily_alcohol_g, (n) => formatAlcohol(n, alcohol))}`,
        );
    }
    // Always listed, unlike alcohol: the goal echo is where the model learns a
    // caffeine limit can be set at all, and there is no opt-in to hide it
    // behind. Data-driven suppression applies to recorded VALUES, not to the
    // list of targets the user could set.
    parts.push(
        `- Caffeine (max): ${ceiling(goals.daily_caffeine_mg, formatMg)}`,
    );
    parts.push(
        `- Sodium (max): ${ceiling(goals.daily_sodium_mg ?? null, formatMg)}`,
    );
    parts.push(`- Water: ${floor(goals.daily_water_ml, (n) => `${n} ml`)}`);
    parts.push(
        `- Target weight: ${goals.target_weight_g != null ? formatWeight(goals.target_weight_g, weightUnit) : "not set"}`,
    );
    return parts.join("\n");
}

// Local wall-clock time of a stored instant: "HH:MM" inside a listing that
// already names its day and zone, "YYYY-MM-DD HH:MM" in a one-off confirmation.
// A raw UTC ISO string here put a Kyiv evening weigh-in on the wrong clock.
export function localTimeOf(
    iso: string,
    tz: string,
    withDate: boolean,
): string {
    const local = formatLocalDateTime(iso, tz);
    return withDate ? local.slice(0, 16) : local.slice(11, 16);
}

export function timesAreLocal(tz: string): string {
    return `Times are local (${tz}).`;
}

export function formatWeightEntry(
    entry: WeightEntry,
    unit: WeightUnit,
    tz: string,
    withDate = false,
): string {
    return `- ${formatWeight(entry.weight_g, unit)} at ${localTimeOf(entry.logged_at, tz, withDate)}${entry.notes ? ` (${entry.notes})` : ""} [id: ${entry.id}]`;
}

// In its own unit the value prints as typed (84.5 cm stays 84.5, not a mm round
// trip); in the other unit it is converted from value_mm. value_entered is a
// `numeric` column PostgREST may hand back as a string, hence Number().
export function formatMeasurementValue(
    e: BodyMeasurementEntry,
    unit: LengthUnit,
): string {
    return unit === e.entered_unit
        ? `${Number(e.value_entered)} ${unit}`
        : `${fromMillimetres(e.value_mm, unit)} ${unit}`;
}

// unit null = no saved preference: each row shows in the unit it was entered in.
export function formatMeasurementEntry(
    e: BodyMeasurementEntry,
    unit: LengthUnit | null,
    tz: string,
    withDate = false,
): string {
    return `- ${measurementLabel(e.kind)} ${formatMeasurementValue(e, unit ?? e.entered_unit)} at ${localTimeOf(e.logged_at, tz, withDate)}${e.notes ? ` (${e.notes})` : ""} [id: ${e.id}]`;
}

// The one rendering of "what time is it for this user", shared by
// get_current_time and get_profile so the two can never disagree. The weekday
// is there to make "last Monday" resolvable without a second round trip, and
// the UTC instant so a caller can check its own clock against ours. Local time
// is the repo-standard "YYYY-MM-DD HH:mm:ss" wall clock — deliberately not an
// offset-less ISO string, which reads as a machine value a caller might echo
// straight back into logged_at without noticing it has gone stale.
export function formatClockLine(tz: string): string {
    const now = new Date();
    return `Local time now: ${weekdayInTz(now, tz)} ${formatLocalDateTime(now, tz)} (${tz}). UTC now: ${now.toISOString()}.`;
}

// The human-readable gloss for a standard-drink unit, shared by
// set_alcohol_tracking and get_profile so the wording can't drift between
// the tool that sets it and the one that reports it back.
export function drinkUnitLabel(unit: DrinkUnit): string {
    return unit === "us"
        ? "US standard drinks (14 g each)"
        : "UK units (7.9 g each)";
}

/** The one model line for a row's sources, with its leading newline, or "". */
export function sourcesNoteFor(
    row: { nutrient_sources?: unknown; source_detail?: unknown },
    refSent: boolean,
): string {
    const line = formatSourcesLine(
        parseNutrientSources(row.nutrient_sources ?? null),
        parseSourceDetail(row.source_detail ?? null),
        { refSent },
    );
    return line ? `\n${line}` : "";
}

/** The ingredient lines of an itemized write, with their leading newline, or "".
 *  Model text only: the item names are the caller's own, so nothing here is logged. */
export function itemSourcesNoteFor(
    items: readonly ItemSourcesInput[] | undefined,
): string {
    const block = formatItemSourcesBlock(items ?? []);
    return block ? `\n${block}` : "";
}

export function snapshotConflictError(noun: string): ToolError {
    return new ToolError(
        `The ${noun} changed while this edit was being saved, so nothing was written. Send the same edit again.`,
    );
}

/** One saved meal's per-serving figures on a line. The alcohol figure follows
 *  the opt-in, like every other listing. */
export function perServingLine(
    t: NutrientValues,
    alcohol: AlcoholDisplay,
): string {
    const parts = [
        t.calories !== null ? `${t.calories} kcal` : null,
        t.protein_g !== null ? `P ${t.protein_g} g` : null,
        t.carbs_g !== null ? `C ${t.carbs_g} g` : null,
        t.fat_g !== null ? `F ${t.fat_g} g` : null,
        t.saturated_fat_g != null
            ? `saturated fat ${t.saturated_fat_g} g`
            : null,
        t.trans_fat_g != null ? `trans fat ${t.trans_fat_g} g` : null,
        t.fiber_g !== null ? `fiber ${t.fiber_g} g` : null,
        // Added sugar rides on the sugar figure, as in every listing, so the
        // two never read as separate amounts.
        compactSugarFigure(t.sugar_g, t.added_sugar_g),
        alcohol !== null && t.alcohol_g !== null
            ? `alcohol ${formatAlcohol(t.alcohol_g, alcohol)}`
            : null,
        t.caffeine_mg !== null ? `caffeine ${formatMg(t.caffeine_mg)}` : null,
        t.sodium_mg != null ? `sodium ${formatMg(t.sodium_mg)}` : null,
    ].filter((x): x is string => x !== null);
    return parts.length > 0
        ? `Per serving: ${parts.join(" · ")}`
        : "Per serving: no figures recorded";
}

/** The refusal for a name already in use, naming the saved meal that holds it.
 *  The name is the user's own text, so the runtime log gets the refusal
 *  without it (logText). */
export function savedMealNameTakenError(
    name: string,
    existingId: string | null,
): ToolError {
    const holder = existingId ? ` [saved meal id: ${existingId}]` : "";
    return toolErrorWithUserText(
        `You already have a saved meal named "${name}"${holder}. update_saved_meal changes it; a different name saves another one.`,
        `The saved meal name given is already in use${holder}.`,
        "meal_items_invalid",
    );
}

/** A saved meal's description as it is stored: escape sequences decoded and
 *  trimmed. Refuses an empty one or one past
 *  MAX_SAVED_MEAL_DESCRIPTION_CHARS before the write, so the database check
 *  never turns it into an internal error. */
export function validateSavedMealDescription(raw: string): string {
    const text = normalizeNameRef(raw);
    const length = [...text].length;
    if (length === 0)
        throw new ToolError(
            "A saved meal's description holds 1 to 2000 characters; the one sent is empty. Without a description the saved meal takes its name as the description.",
            { category: "meal_items_invalid" },
        );
    if (length > MAX_SAVED_MEAL_DESCRIPTION_CHARS)
        throw new ToolError(
            `A saved meal's description holds 1 to ${MAX_SAVED_MEAL_DESCRIPTION_CHARS} characters; the one sent has ${length}.`,
            { category: "meal_items_invalid" },
        );
    return text;
}

/** The added-sugar refusal on update_saved_meal, naming the SAVED meal: the
 *  shared wording says "meal <id>", and a saved-meal id read as a logged
 *  meal's id leads to a not-found on update_meal. */
export function savedMealAddedSugarMissingError(id: string): ToolError {
    const rule = addedSugarMissingText()
        .replace(/^Not saved: /, "")
        .replace(
            "whenever sugar_g is given.",
            "whenever sugar_g is given and the saved meal has no added sugar recorded.",
        );
    return new ToolError(`Not saved, saved meal ${id} is unchanged: ${rule}`, {
        category: "added_sugar_missing",
    });
}

/** A saved meal's body text: its description, default meal type, the figures
 *  per serving and its ingredients. */
export function savedMealBody(
    s: SavedMealWithItems,
    alcohol: AlcoholDisplay,
): string {
    const lines = [`Description: ${s.description}`];
    if (s.meal_type) lines.push(`Default meal type: ${s.meal_type}`);
    lines.push(perServingLine(s, alcohol));
    const block = formatItemsBlock(s.items, alcohol !== null);
    if (block) lines.push(block);
    return lines.join("\n");
}

/** One saved meal in get_saved_meals: a header with its name and id, its body
 *  indented beneath. */
export function savedMealListing(
    s: SavedMealWithItems,
    alcohol: AlcoholDisplay,
): string {
    const body = savedMealBody(s, alcohol)
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n");
    return `- "${s.name}" [saved meal id: ${s.id}]\n${body}`;
}

// A non-uuid id would otherwise reach Postgres and come back as a uuid cast
// error. Echoed JSON-quoted and clipped: it is caller text. Worded like the
// not-found messages so categorizeError files it as record_not_found.
export function notUuidText(kind: string, id: string, sources: string): string {
    return `No ${kind} found with id ${JSON.stringify(id.slice(0, 64))}: ids are UUIDs like "3f2b9c1e-…". Get one from ${sources}.`;
}

// The full per-field rendering, kept under its old two-argument name for the
// unit tests that pin its suppression rules. tz "UTC" reproduces the old
// instant; every tool passes the user's timezone to formatMealFull instead.
export function formatMeal(meal: Meal, alcohol: AlcoholDisplay = null): string {
    return formatMealFull(meal, alcohol, "UTC");
}

// The one thing that keeps the alcohol opt-in from being a trapdoor. Alcohol
// written while tracking is off is stored but invisible everywhere — no meal
// line, no goal line, no widget stat — so a user who says "log 2 beers" gets a
// silent no-op as far as they can tell, and nothing in any tool output or in
// SERVER_INSTRUCTIONS would ever tell them the feature exists. This appends a
// one-line note to the text output whenever a write actually carried alcohol
// and this user has the gate off.
//
// It REPORTS ONLY. It must never flip alcohol_tracking_enabled: the flag exists
// because surfacing alcohol unbidden is harmful to users in recovery, and
// "they logged a beer" is not consent to start showing it.
//
// `subject` is the clause before the comma, so each call site can name what was
// saved while the advice stays identical everywhere.
export function alcoholHiddenNote(
    carriedAlcohol: boolean,
    alcohol: AlcoholDisplay,
    subject: string,
): string {
    if (!carriedAlcohol || alcohol !== null) return "";
    return `\n\n(${subject}, but alcohol tracking is off for this account so it is not shown. The user can turn it on with set_alcohol_tracking if they want it shown.)`;
}

// Tool descriptions and SERVER_INSTRUCTIONS are advisory and are read once, at
// the top of a session; this note lands in the model's context at the exact
// moment it left a nutrient out, which is the only feedback in the loop. Same
// report-only shape as alcoholHiddenNote above — it never writes anything, and
// it describes rather than directs: it names the gap, what a gap does to the
// totals, and that update_meal can fill it — never what the assistant should
// say or do (directory policy; see #190, #213).
//
// Deliberately limited to fiber_g, sugar_g and added_sugar_g. All three are
// estimable for every food that exists (added sugar is a classification more
// than a measurement: 0 for whole foods, all of it for a soft drink), so a
// NULL on a meal the model just wrote is an omission and not a fact, and the
// cost is not one imperfect number: a null excludes the whole DAY from that
// nutrient's averages, goal lines and charts (dayCarries in insights.ts), so a forgotten fiber figure deletes the day from the trend.
//
// Caffeine is NOT checked here, and adding it would undo the suppression the
// rest of this file is built around: most meals genuinely carry none, its
// display gate is `!= null` rather than `> 0` (limitShown, recordedGoalLine,
// totalsPayloadOf), so nagging until every sandwich carries a figure produces
// precisely the fabricated "0 mg / 400 mg limit" that null exists to prevent.
//
// A meal logged with items has totals that are the sum of its items, and
// update_meal refuses a direct total on such a meal, so for one the note names
// the path that works: the full items list with the value on each item.
export function missingNutrients(meal: Meal): string[] {
    return [
        meal.fiber_g == null ? "fiber_g" : null,
        meal.sugar_g == null ? "sugar_g" : null,
        meal.added_sugar_g == null ? "added_sugar_g" : null,
    ].filter((f): f is string => f !== null);
}

export function missingNutrientNote(meal: Meal, itemCount = 0): string {
    const missing = missingNutrients(meal);
    if (missing.length === 0) return "";
    const fill =
        itemCount > 0
            ? `This meal's totals are the sum of its ${itemCount} item${itemCount === 1 ? "" : "s"}, so update_meal adds the value to id ${meal.id} through items: the full list again, with the value on each item`
            : `update_meal can add the value to id ${meal.id}`;
    return `\n\n(Not recorded on this meal: ${missing.join(", ")}. A missing value is not a zero — it leaves the whole day out of that nutrient's totals, averages and goal line. ${fill}; 0 records a food that genuinely has none.)`;
}

// lookup_barcode's two Open Food Facts fallbacks. A lookup is often only a
// question about the product, so neither text presumes the meal gets logged:
// they say what evidence is left, not what to write (directory policy 2.D).
// No OFF error text is interpolated — it is third-party text the model can't
// act on, and it stays in the server log.
export function offUnreachableText(): string {
    return "Couldn't reach Open Food Facts right now. Nutrition for this product can come from the product description, or from a label the user shares.";
}

export function offNotFoundText(barcode: string): string {
    return `No product found in Open Food Facts for barcode ${barcode}. The user may be able to say what the product is or share its label; otherwise its nutrition is an estimate.`;
}

// `alcohol` is the whole alcohol opt-in, threaded once: the drink unit to render
// grams in, or null when this user has alcohol tracking off. It is resolved from
// the profile in buildMcpServer (like widgetsEnabled) rather than re-read inside
// every handler, because a per-request server means one read serves the whole
// request and every formatter can take it as a plain argument.
//
// At the write layer it gates DISPLAY only. Alcohol passed to log_meal /
// update_meal / bulk_import_meals is always stored — dropping a value the caller
// explicitly sent would be silent data loss, and the flag exists to keep trace
// alcohol from imported recipes out of sight, not out of the database.
//
// The one place a null `alcohol` changes what gets WRITTEN is the import widget,
// which then declines to map the file's alcohol column at all rather than write
// a number it was forbidden to show the user for review. That is the widget's
// choice, announced to the user on screen, not a rule this server enforces — see
// startImportPayload for the full trade-off.
/**
 * get_profile's Apple Health sync line. `undefined` means the status could not
 * be read (the line says so rather than failing the whole profile), `null`
 * means no link. Dates and times are local to `tz`, like the rest of the
 * profile. Describes only: connecting happens from the iPhone shortcut, not
 * through any tool, so there is nothing here to offer.
 */
export function healthSyncProfileLine(
    status: HealthSyncLinkStatus | null | undefined,
    tz: string,
): string {
    if (status === undefined)
        return "Apple Health sync: status unavailable right now.";
    if (status === null) return "Apple Health sync: not connected.";
    const connected = dateInTz(status.created_at, tz);
    const sentThrough = status.sent_through ?? "nothing yet";
    const lastSync = status.last_sync_at
        ? formatLocalDateTime(status.last_sync_at, tz).slice(0, 16)
        : "never";
    return `Apple Health sync: connected ${connected}, sent through ${sentThrough}, last sync ${lastSync}.`;
}

/**
 * get_profile's line for the opt-in activity shortcut, or null when it is not
 * connected or its status could not be read: the profile then reads exactly
 * as it did before the activity shortcut existed.
 */
export function healthActivityProfileLine(
    status: HealthActivityLinkStatus | null | undefined,
    tz: string,
): string | null {
    if (!status) return null;
    const connected = dateInTz(status.created_at, tz);
    const lastSync = status.last_sync_at
        ? formatLocalDateTime(status.last_sync_at, tz).slice(0, 16)
        : "never";
    return `Apple Health activity sync: connected ${connected}, reads the daily Active Energy total, last sync ${lastSync}.`;
}

// The summary's daily-average line for a limited partial nutrient (added sugar,
// saturated fat, sodium): the same rule for each, so only the label and unit
// differ. Text,
// because no structuredContent shape may carry it (the summary's `averages`
// schema is frozen). Covered days only, like sugar (rangeAverages), against the
// limit when one is set. Empty for a single day, whose section already prints
// the figure. When no logged day recorded the nutrient it is empty without a
// limit, and "not recorded in this period" with one.
export function ceilingAverageLine(
    label: string,
    average: number,
    recordedDays: number,
    loggedDays: number,
    limit: number | null,
    unit: "g" | " mg" = "g",
): string {
    if (loggedDays < 2) return "";
    if (recordedDays === 0) {
        // With a limit set, the gap is stated rather than dropped (see
        // limitNotRecorded); without one there is nothing to report.
        return hasActiveTarget(limit, "ceiling")
            ? `\n\n${label}, daily average: ${limitNotRecorded("period", limit, unit)}`
            : "";
    }
    return `\n\n${formatGoalLine(
        `${label}, daily average`,
        unit,
        average,
        limit,
        "ceiling",
    )}`;
}

/** The model-facing half of the #70 fix: says out loud that these averages
 *  divide by logged days, and that get_trends will therefore print a smaller
 *  number for the same window. Empty when the window is fully logged — the two
 *  denominators coincide there, so the note would be pure noise on the common
 *  path. Pure and exported so the exact shipped wording is testable without
 *  standing up the whole tool. */
export function loggedDayAverageNote(
    loggedDays: number,
    daysInRange: number,
): string {
    if (loggedDays >= daysInRange) return "";
    return `\n\n(Daily averages are per logged day — ${loggedDays} of the ${daysInRange} days in range. get_trends averages over all ${daysInRange} calendar days instead, so its daily figures will be lower.)`;
}
