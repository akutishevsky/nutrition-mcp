import {
    ADDED_SUGAR_REQUIRED_FROM_ENV,
    addedSugarError,
    addedSugarRequiredAt,
    buildAddedSugarMeta,
    parseAddedSugarRequiredFrom,
} from "../added-sugar.js";
import { newErrorRef, ToolError, toolErrorWithUserText } from "../errors.js";
import {
    buildGoalDayMeta,
    GOAL_DAY_HISTORY_DAYS,
    historyFoods,
    type GoalDayFood,
} from "../goal-day.js";
import { dateDiffDays } from "../insights.js";
import {
    buildMealItemsMeta,
    MEAL_NUTRIENT_KEYS,
    normalizeNameRef,
    validateItems,
    type MealItemsMeta,
    type MealItemValues,
    type MealNutrientKey,
    type NutrientValues,
} from "../meal-items.js";
import { type AlcoholDisplay } from "../meal-listing.js";
import { buildMealTimesMeta } from "../meal-times.js";
import {
    assertFoodRefPlacement,
    buildNutrientSourcesMeta,
    deriveMealProvenance,
    mergeProvenance,
    parseFoodRef,
    parseNutrientSources,
    parseSourceDetail,
    resolveNutrientSources,
    type LoggedValues,
    type NutrientSources,
    type NutrientSourcesMeta,
    type SourceDetail,
} from "../provenance.js";
import { buildSaturatedFatMeta } from "../saturated-fat.js";
import { buildSodiumMeta } from "../sodium.js";
import {
    countMealItems,
    createSavedMeal,
    findSavedMealsByName,
    getCachedFoodRecord,
    getMealById,
    getMealItems,
    getMealsByDate,
    getMealsInRange,
    getNutritionGoals,
    getPreferredLengthUnit,
    getPreferredWeightUnit,
    getProfile,
    getSavedMeal,
    getSavedMeals,
    getWaterByDate,
    isUuid,
    localeFromProfile,
    SavedMealNameTaken,
    SnapshotConflictError,
    snapshotGuardOf,
    timezoneFromProfile,
    updateMeal,
    updateSavedMealIfUnchanged,
    type Meal,
    type MealInput,
    type SavedMealInput,
    type SavedMealWithItems,
    type WaterEntry,
} from "../supabase.js";
import {
    dateInTz,
    LoggedAtError,
    resolveWriteLoggedAt,
    shiftLocalDate,
} from "../tz.js";
import {
    formatWeight,
    fromGrams,
    isPlausibleWeightGrams,
    pickLengthWriteUnit,
    pickWriteUnit,
    toGrams,
    type LengthUnit,
    type WeightUnit,
} from "../units.js";
import {
    ADDED_SUGAR_META_KEY,
    GOAL_DAY_META_KEY,
    MEAL_ITEMS_META_KEY,
    MEAL_TIMES_META_KEY,
    NUTRIENT_SOURCES_META_KEY,
    SATURATED_FAT_META_KEY,
    SODIUM_META_KEY,
} from "../widgets.js";
import { SNAPSHOT_WRITE_ATTEMPTS } from "./constants.js";
import {
    formatProgress,
    missingNutrientNote,
    missingNutrients,
    savedMealAddedSugarMissingError,
    savedMealNameTakenError,
    snapshotConflictError,
} from "./formatters.js";
import {
    goalsPayloadOf,
    totalsPayloadOf,
    type FoodRefArg,
    type MealItemArg,
} from "./schemas.js";
import {
    mealBreakdown,
    nutrientPresence,
    sumMeals,
    sumWater,
} from "./totals.js";

// failed read never fails the tool — the rows are the product, the items only
// their detail — so it logs one ref line (no user id, no user text) and the
// widget simply shows no expanders.
//
// The same read carries each row's nutrient labels (NUTRIENT_SOURCES_META_KEY),
// with the same gate and the same drop-the-key behaviour. `itemsRead` is an
// items read for exactly `rowMeals` already in flight, for a caller that
// shares it with another consumer (get_goal_progress's goal-day entry).
export async function mealItemsMetaEntry(
    userId: string,
    rowMeals: readonly Meal[],
    alcohol: AlcoholDisplay,
    itemsRead?: Promise<Map<string, MealItemValues[]>>,
): Promise<{
    [MEAL_ITEMS_META_KEY]?: MealItemsMeta;
    [NUTRIENT_SOURCES_META_KEY]?: NutrientSourcesMeta;
}> {
    if (rowMeals.length === 0) return {};
    let items: Map<string, MealItemValues[]>;
    try {
        items = await (itemsRead ??
            getMealItems(
                userId,
                rowMeals.map((m) => m.id),
            ));
    } catch (err) {
        const ref = newErrorRef();
        console.warn(
            `[widget] meal-items read error ref=${ref}: ${JSON.stringify(err instanceof Error ? err.message : String(err))}`,
        );
        return {};
    }
    const payload = buildMealItemsMeta(rowMeals, items, alcohol != null);
    const mealSources = new Map(
        rowMeals.map((m) => [
            m.id,
            {
                sources: parseNutrientSources(m.nutrient_sources ?? null),
                detail: parseSourceDetail(m.source_detail ?? null),
            },
        ]),
    );
    const sources = buildNutrientSourcesMeta(
        rowMeals,
        mealSources,
        items,
        alcohol != null,
    );
    return {
        ...(payload ? { [MEAL_ITEMS_META_KEY]: payload } : {}),
        ...(sources ? { [NUTRIENT_SOURCES_META_KEY]: sources } : {}),
    };
}

// get_goal_progress's GOAL_DAY_META_KEY entry (src/goal-day.ts), with the rows'
// MEAL_TIMES_META_KEY beside it (src/meal-times.ts). On today it
// also reads the GOAL_DAY_HISTORY_DAYS before the date, and their ingredients,
// for the foods the widget may name; a failed read drops only `foods` (logged
// with a ref, never a user id), so the tool and the rest of the day detail
// still go out. `todayItems` is the items read for `meals` that
// mealItemsMetaEntry also awaits, so today's ingredients are read once; only
// the past days' items are read here.
export async function goalDayMetaEntry(
    userId: string,
    targetDate: string,
    tz: string,
    meals: Meal[],
    water: WaterEntry[],
    isToday: boolean,
    todayItems: Promise<Map<string, MealItemValues[]>>,
) {
    let foods: GoalDayFood[] | undefined;
    if (isToday) {
        try {
            const past = await getMealsInRange(
                userId,
                shiftLocalDate(targetDate, -GOAL_DAY_HISTORY_DAYS),
                shiftLocalDate(targetDate, -1),
                tz,
            );
            const [pastItems, dayItems] = await Promise.all([
                past.length
                    ? getMealItems(
                          userId,
                          past.map((m) => m.id),
                      )
                    : new Map<string, MealItemValues[]>(),
                todayItems,
            ]);
            foods = historyFoods(
                [...past, ...meals],
                new Map([...pastItems, ...dayItems]),
            );
        } catch (err) {
            const ref = newErrorRef();
            console.warn(
                `[widget] goal-day history read error ref=${ref}: ${JSON.stringify(err instanceof Error ? err.message : String(err))}`,
            );
        }
    }
    return {
        // Row times ride under the shared MEAL_TIMES_META_KEY, as on the other
        // meal tools; GOAL_DAY_META_KEY carries only what is goal-progress's own.
        [MEAL_TIMES_META_KEY]: buildMealTimesMeta(meals, tz),
        [GOAL_DAY_META_KEY]: buildGoalDayMeta({
            meals,
            water,
            tz,
            now: isToday ? new Date() : null,
            foods,
        }),
    };
}

// Compute the day's running totals vs goals for a meal that was just logged or
// updated, packaging both the model-facing progress text and the meal-logged
// widget's structuredContent. Shared by log_meal and update_meal so the two
// tools stay in lockstep.
export async function buildMealProgress(
    userId: string,
    meal: Meal,
    action: "logged" | "updated",
    alcohol: AlcoholDisplay,
) {
    const profile = await getProfile(userId);
    const tz = timezoneFromProfile(profile) ?? "UTC";
    const locale = localeFromProfile(profile) ?? "en";
    const mealDate = dateInTz(meal.logged_at, tz);
    const [meals, waterEntries, goals] = await Promise.all([
        getMealsByDate(userId, mealDate, tz),
        getWaterByDate(userId, mealDate, tz),
        getNutritionGoals(userId),
    ]);
    const totals = sumMeals(meals);
    totals.water_ml = sumWater(waterEntries);
    const present = nutrientPresence(meals);

    const progressSection = goals
        ? `\n\nDaily progress (${mealDate}):\n${formatProgress(totals, goals, alcohol, present)}`
        : "\n\nNo nutrition goals set — use the set_nutrition_goals tool to track progress against daily targets.";

    const structuredContent = {
        action,
        date: mealDate,
        drink_unit: alcohol,
        locale,
        logged_meal: {
            description: meal.description,
            meal_type: meal.meal_type ?? null,
            calories: meal.calories ?? null,
            protein_g: meal.protein_g ?? null,
            carbs_g: meal.carbs_g ?? null,
            fat_g: meal.fat_g ?? null,
            fiber_g: meal.fiber_g ?? null,
            sugar_g: meal.sugar_g ?? null,
            alcohol_g: alcohol ? (meal.alcohol_g ?? null) : null,
            // Ungated, unlike alcohol_g directly above it: what was stored is
            // what is shown.
            caffeine_mg: meal.caffeine_mg ?? null,
        },
        has_goals: goals != null,
        goals: goalsPayloadOf(goals, alcohol),
        totals: totalsPayloadOf(totals, alcohol, present.caffeine_mg),
        // Single day → label rows by meal type in the widget, not by date.
        meals: mealBreakdown(meals, null, alcohol),
    };

    // The day's added sugar, for the widget only: structuredContent's schema
    // is frozen, so it rides in the result's _meta (ADDED_SUGAR_META_KEY).
    // `meals` is the same list, in the same order, as the rows above — the
    // widget joins the two by position.
    // The ingredients ride beside it, aligned with the same rows.
    const meta = {
        [ADDED_SUGAR_META_KEY]: buildAddedSugarMeta({
            goal: goals?.daily_added_sugar_g,
            days: { [mealDate]: meals },
            meals,
        }),
        [SATURATED_FAT_META_KEY]: buildSaturatedFatMeta({
            goal: goals?.daily_saturated_fat_g,
            days: { [mealDate]: meals },
            meals,
        }),
        [SODIUM_META_KEY]: buildSodiumMeta({
            goal: goals?.daily_sodium_mg,
            days: { [mealDate]: meals },
            meals,
        }),
        // Each row's local time, and which row is the meal this call wrote
        // (a backdated or edited meal is not necessarily the last one).
        [MEAL_TIMES_META_KEY]: buildMealTimesMeta(meals, tz, meal.id),
        ...(await mealItemsMetaEntry(userId, meals, alcohol)),
    };

    // tz goes back to the caller so its confirmation prints the meal's time
    // in the same zone this progress section bucketed it by.
    return { progressSection, structuredContent, meta, tz };
}

// Resolve a caller-supplied `logged_at` to an absolute instant before it
// reaches the timestamptz column. Without this an offset-less string is read in
// the database session's zone (UTC), so a Kyiv user's 21:00 lands at midnight
// on the NEXT day and the tool's own progress line contradicts itself.
// "Configured" is `timezoneFromProfile(profile) !== null`, not `profile !==
// null`: the other set_* tools upsert a profile that never touches timezone,
// so the row's mere existence is not evidence the user ever chose a zone
// (#99).
//
// The unset-timezone hint has to be attached on the failure path too: read as
// UTC, an offset-less local time from a user east of UTC can resolve to a
// future instant and be rejected, and "logged_at is in the future" on its own
// names the wrong cause and gives the caller nothing to act on.
//
// It also has to fire when `raw` is omitted entirely — by far the most common
// call shape, since "I just ate this" never carries a logged_at. The instant
// itself doesn't need the timezone (the DB stamps "now" either way), but every
// read path still buckets the entry into a local day using the same unset
// profile, so staying silent here left the migration's whole warning
// unreachable in practice (found live: a meal logged with no logged_at and no
// profile timezone produced no warning at all).
export async function resolveWriteTimestamp(
    userId: string,
    raw: string | undefined,
): Promise<{ iso: string | undefined; note: string; tz: string }> {
    const profile = await getProfile(userId);
    const tz = timezoneFromProfile(profile);
    // The zone a confirmation renders the stored instant in: the same one the
    // read paths bucket by, UTC when none is set.
    const displayTz = tz ?? "UTC";
    const unsetTzNote = (value: string) =>
        `${JSON.stringify(value)} carries no UTC offset and this account has no timezone set, so it was read as UTC. The user can set one with set_timezone.`;

    if (raw === undefined) {
        const note =
            tz === null
                ? "\n\nNote: this account has no timezone set, so today's date is being read in UTC — the user can set one with set_timezone."
                : "";
        return { iso: undefined, note, tz: displayTz };
    }

    let resolved;
    try {
        resolved = resolveWriteLoggedAt(raw, tz ?? "UTC", Date.now());
    } catch (err) {
        if (
            err instanceof LoggedAtError &&
            err.usedProfileTimezone &&
            tz === null
        ) {
            throw new ToolError(`${err.message} ${unsetTzNote(raw)}`);
        }
        throw err;
    }

    const note =
        resolved.usedProfileTimezone && tz === null
            ? `\n\nNote: ${unsetTzNote(raw)} If they do, this entry's time may need correcting.`
            : "";
    return { iso: resolved.instant.toISOString(), note, tz: displayTz };
}

// Resolve the unit to use when WRITING a weight value: an explicit unit wins,
// otherwise the user's saved preference. If neither exists, refuse rather than
// guess — silently assuming kg for someone who meant lb is exactly the mis-log
// this feature exists to prevent.
export async function resolveWriteWeightUnit(
    userId: string,
    explicit: WeightUnit | undefined,
): Promise<WeightUnit> {
    return pickWriteUnit(explicit, await getPreferredWeightUnit(userId));
}

// The same contract for a body measurement's length unit: explicit, then the
// saved length preference, then refuse. The weight unit is never consulted.
export async function resolveWriteLengthUnit(
    userId: string,
    explicit: LengthUnit | undefined,
): Promise<LengthUnit> {
    if (explicit) return explicit; // no profile read
    return pickLengthWriteUnit(undefined, await getPreferredLengthUnit(userId));
}

// Reject magnitude mistakes (value typed in grams, an extra digit, a sub-unit
// typo). Suggests the other unit when the same number would be plausible there.
export function assertPlausibleWeight(grams: number, unit: WeightUnit): void {
    if (isPlausibleWeightGrams(grams)) return;
    const other: WeightUnit = unit === "kg" ? "lb" : "kg";
    const asOther = toGrams(fromGrams(grams, unit), other);
    const hint = isPlausibleWeightGrams(asOther)
        ? ` If you meant ${fromGrams(grams, unit)} ${other}, pass unit: '${other}'.`
        : "";
    throw new ToolError(
        `${formatWeight(grams, unit)} is outside the plausible body-weight range (20–500 kg / 44–1102 lb). Double-check the number and unit.${hint}`,
    );
}

/** A row's nutrient values as the provenance module reads them: a key with no
 *  value is null, which labels nothing. */
export function loggedValuesOf(
    values: Partial<Record<MealNutrientKey, number | null | undefined>>,
): LoggedValues {
    return Object.fromEntries(
        MEAL_NUTRIENT_KEYS.map((key) => [key, values[key] ?? null]),
    ) as LoggedValues;
}

/** The labels of one row: the food_ref checked against its stored record (a
 *  cache miss verifies nothing, so the values stay estimates and the write
 *  still succeeds), then user_stated, then estimate. */
export async function labelRow(
    ref: FoodRefArg | undefined,
    values: LoggedValues,
    userStated: MealNutrientKey[] | undefined,
): Promise<{ sources: NutrientSources; detail: SourceDetail | null }> {
    if (ref === undefined)
        return resolveNutrientSources({ values, userStated });
    const parsed = parseFoodRef(ref);
    const record = await getCachedFoodRecord(parsed.source, parsed.id);
    return resolveNutrientSources({
        values,
        ref: { ref: parsed, record },
        userStated,
    });
}

/** The item-level labels, one per validated item, from its own food_ref and
 *  user_stated (items keep their order and positions). */
export async function labelItems(
    rawItems: readonly MealItemArg[],
    items: MealItemValues[],
): Promise<MealItemValues[]> {
    return Promise.all(
        items.map(async (item, i) => {
            const labelled = await labelRow(
                rawItems[i]?.food_ref,
                loggedValuesOf(item),
                rawItems[i]?.user_stated,
            );
            return {
                ...item,
                nutrient_sources: labelled.sources,
                source_detail: labelled.detail,
            };
        }),
    );
}

/** validateItems, then each item labelled, then the meal-level labels derived
 *  from the items. The items are validated as they were before provenance. */
export async function checkedItemsWithSources(
    rawItems: readonly MealItemArg[],
) {
    const checked = validateItems(
        rawItems.map(
            ({ food_ref: _ref, user_stated: _stated, ...item }) => item,
        ),
        { addedSugarRequired: addedSugarRequiredNow() },
    );
    const items = await labelItems(rawItems, checked.items);
    const derived = deriveFromItems(items);
    return {
        items,
        totals: checked.totals,
        sources: derived.sources,
        detail: derived.detail,
    };
}

/** The meal-level labels of a set of validated items (deriveMealProvenance). */
export function deriveFromItems(items: readonly MealItemValues[]) {
    return deriveMealProvenance(
        items.map((item) => ({
            values: item,
            sources: item.nutrient_sources ?? null,
            detail: item.source_detail ?? null,
        })),
    );
}

/** food_ref and user_stated label the nutrient values sent with them. A call
 *  that sends no values would drop them without a word, so it is refused. */
export function refuseLabelsWithoutValues(
    foodRef: FoodRefArg | undefined,
    userStated: MealNutrientKey[] | undefined,
    hasValues: boolean,
): void {
    if (hasValues) return;
    if (foodRef !== undefined || (userStated?.length ?? 0) > 0)
        throw new ToolError(
            "food_ref and user_stated label nutrient values, so send the values they describe (calories, protein_g and so on) with them.",
            { category: "food_ref_invalid" },
        );
}

/** A meal's own food_ref and user_stated are refused beside items: each item
 *  carries its own, and the meal's labels come from them. */
export function refuseMealLevelRefsWithItems(
    foodRef: FoodRefArg | undefined,
    userStated: MealNutrientKey[] | undefined,
): void {
    assertFoodRefPlacement(true, foodRef !== undefined);
    if (userStated && userStated.length > 0)
        throw new ToolError(
            "user_stated goes on each item when the meal has items, not on the meal.",
            { category: "food_ref_invalid" },
        );
}

/** The labels a plain-meal update gives the row, merged from the row as it was
 *  read (`old`): a nutrient whose value the call changes takes the fresh labels,
 *  the rest keep theirs (mergeProvenance). */
export async function plainLabelsFor(
    old: Meal,
    fields: Partial<MealInput>,
    foodRef: FoodRefArg | undefined,
    userStated: MealNutrientKey[] | undefined,
): Promise<{ sources: NutrientSources; detail: SourceDetail | null }> {
    const sent = MEAL_NUTRIENT_KEYS.filter((k) => fields[k] !== undefined);
    const oldValues = loggedValuesOf(old);
    const newValues: LoggedValues = { ...oldValues };
    for (const key of sent) newValues[key] = fields[key] ?? null;
    const changed = await labelRow(foodRef, newValues, userStated);
    return mergeProvenance({
        oldValues,
        newValues,
        oldSources: parseNutrientSources(old.nutrient_sources ?? null),
        oldDetail: parseSourceDetail(old.source_detail ?? null),
        changed,
        restated: restatedKeys(userStated, sent),
    });
}

/** The nutrients a call both sends a value for and names user_stated. A
 *  user_stated key the call does not send is not here: its stored label stays. */
export function restatedKeys(
    userStated: readonly MealNutrientKey[] | undefined,
    sent: readonly MealNutrientKey[],
): MealNutrientKey[] {
    return (userStated ?? []).filter((k) => sent.includes(k));
}

/** The plain-meal write of update_meal. The sugar checks, the label merge and
 *  the write all come from ONE read of the row, and the write is conditional on
 *  the row still holding that read (updateMeal's snapshot guard). A concurrent
 *  edit therefore makes this re-read and redo its checks and merge, so two edits
 *  to one meal can neither drop each other's labels nor leave a label that
 *  describes a value no longer stored. A call that sends no nutrient reads
 *  nothing and writes unguarded, since it changes no value or label. */
export async function writePlainMealUpdate(
    userId: string,
    id: string,
    fields: Partial<MealInput>,
    foodRef: FoodRefArg | undefined,
    userStated: MealNutrientKey[] | undefined,
    checkSugar: (stored: Meal | null) => void,
): Promise<{ meal: Meal; note: string }> {
    const sent = MEAL_NUTRIENT_KEYS.filter((k) => fields[k] !== undefined);
    for (let attempt = 1; ; attempt++) {
        const old = sent.length > 0 ? await getMealById(userId, id) : null;
        if (sent.length > 0) checkSugar(old);
        const labels = old
            ? await plainLabelsFor(old, fields, foodRef, userStated)
            : null;
        const { iso, note } = await resolveWriteTimestamp(
            userId,
            fields.logged_at,
        );
        try {
            const meal = await updateMeal(
                userId,
                id,
                {
                    ...fields,
                    logged_at: iso,
                    ...(labels
                        ? {
                              nutrient_sources: labels.sources,
                              source_detail: labels.detail,
                          }
                        : {}),
                },
                old ? snapshotGuardOf(old) : undefined,
            );
            return { meal, note };
        } catch (err) {
            if (!(err instanceof SnapshotConflictError)) throw err;
            if (attempt >= SNAPSHOT_WRITE_ATTEMPTS)
                throw snapshotConflictError("meal");
        }
    }
}

/** The totals path of update_saved_meal (no items: an itemized saved meal's
 *  totals change through its items, which are refused here). Its checks, label
 *  merge and guarded row write come from one read, retried like
 *  writePlainMealUpdate. Null when this user has no saved meal with `id`. */
export async function writeSavedMealTotals(
    userId: string,
    id: string,
    base: Partial<SavedMealInput>,
    sentTotals: MealNutrientKey[],
    totals: Partial<NutrientValues>,
    foodRef: FoodRefArg | undefined,
    userStated: MealNutrientKey[] | undefined,
): Promise<SavedMealWithItems | null> {
    for (let attempt = 1; ; attempt++) {
        const current = await getSavedMeal(userId, id);
        if (!current) return null;
        if (current.items.length > 0)
            throw new ToolError(
                `This saved meal's totals are the sum of its ${current.items.length} item${current.items.length === 1 ? "" : "s"}, so they change through items (the full new list) rather than directly.`,
                { category: "meal_items_invalid" },
            );
        // Checked against the stored partner of whichever sugar field is not
        // sent, as update_meal does.
        const addedNow =
            totals.added_sugar_g !== undefined
                ? totals.added_sugar_g
                : current.added_sugar_g;
        const sugarNow =
            totals.sugar_g !== undefined ? totals.sugar_g : current.sugar_g;
        const sugarError = addedSugarError(
            addedNow ?? undefined,
            sugarNow ?? undefined,
        );
        if (sugarError) throw new ToolError(sugarError);
        if (
            addedSugarRequiredNow() &&
            totals.sugar_g !== undefined &&
            totals.added_sugar_g === undefined &&
            current.added_sugar_g === null
        )
            throw savedMealAddedSugarMissingError(id);
        // The changed totals take the fresh labels; the rest keep theirs.
        const oldValues = loggedValuesOf(current);
        const newValues = loggedValuesOf({ ...current, ...totals });
        const labels = mergeProvenance({
            oldValues,
            newValues,
            oldSources: parseNutrientSources(current.nutrient_sources ?? null),
            oldDetail: parseSourceDetail(current.source_detail ?? null),
            changed: await labelRow(foodRef, newValues, userStated),
            restated: restatedKeys(userStated, sentTotals),
        });
        try {
            return await updateSavedMealIfUnchanged(
                userId,
                id,
                {
                    ...base,
                    ...totals,
                    nutrient_sources: labels.sources,
                    source_detail: labels.detail,
                },
                snapshotGuardOf(current),
            );
        } catch (err) {
            if (!(err instanceof SnapshotConflictError)) throw err;
            if (attempt >= SNAPSHOT_WRITE_ATTEMPTS)
                throw snapshotConflictError("saved meal");
        }
    }
}

/** Totals as MealInput nutrient fields: a null total (no item carries that
 *  nutrient) is left unset rather than sent as a value. */
export function totalsAsInput(
    t: NutrientValues,
): Partial<Record<MealNutrientKey, number>> {
    const out: Partial<Record<MealNutrientKey, number>> = {};
    for (const key of MEAL_NUTRIENT_KEYS) {
        const v = t[key];
        if (v !== null) out[key] = v;
    }
    return out;
}

/** The saved meal's own nutrient values as the NutrientValues shape: a value
 *  the source does not carry is null. */
export function nutrientsFrom(
    src: Partial<Record<MealNutrientKey, number | null | undefined>>,
): NutrientValues {
    const out = {} as NutrientValues;
    for (const key of MEAL_NUTRIENT_KEYS) out[key] = src[key] ?? null;
    return out;
}

/** Writes a new saved meal. A name already in use is refused with its own
 *  wording, naming the saved meal that holds it. */
export async function savedMealWrite(
    userId: string,
    name: string,
    input: SavedMealInput,
    items: MealItemValues[],
): Promise<SavedMealWithItems> {
    try {
        return await createSavedMeal(userId, input, items);
    } catch (err) {
        if (err instanceof SavedMealNameTaken)
            throw savedMealNameTakenError(name, err.existingId);
        throw err;
    }
}

/** The saved meal a log_saved_meal call names: its id, or its exact name
 *  (case-insensitive). Throws a ToolError when none or several match. */
export async function resolveSavedMeal(
    userId: string,
    ref: string,
): Promise<SavedMealWithItems> {
    // Decoded like the stored names (validateSavedMealName), so a name a
    // client escaped when saving it still matches when it is escaped again.
    const q = normalizeNameRef(ref);
    if (isUuid(q)) {
        const byId = await getSavedMeal(userId, q);
        if (byId) return byId;
        throw new ToolError(
            `No saved meal found with id ${JSON.stringify(q.slice(0, 64))}.`,
        );
    }
    const matches = await findSavedMealsByName(userId, q);
    if (matches.length === 1) return matches[0]!;
    if (matches.length === 0) {
        const names = (await getSavedMeals(userId))
            .slice(0, 10)
            .map((s) => `"${s.name}"`);
        const known =
            names.length > 0
                ? ` Saved meals: ${names.join(", ")}.`
                : " This account has no saved meals yet.";
        // No category: "No saved meal found" is categorizeError's
        // record_not_found wording. The names stay out of the runtime log.
        throw toolErrorWithUserText(
            `No saved meal found named ${JSON.stringify(q.slice(0, 100))}.${known}`,
            `No saved meal found by the name given (${names.length} saved meal name${names.length === 1 ? "" : "s"} listed).`,
        );
    }
    throw toolErrorWithUserText(
        `More than one saved meal is named "${q}"; each id identifies one: ${matches
            .map((m) => `${m.name} [saved meal id: ${m.id}]`)
            .join(", ")}.`,
        `More than one saved meal has the name given (${matches.length} matches).`,
        "meal_items_invalid",
    );
}

export const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// A YYYY-MM-DD string naming a date that exists. The Date.UTC round trip is
// what rejects "2026-02-30": Date rolls it over to March 2nd instead of
// failing, so the parts are compared back rather than trusting the parse.
export function isCalendarDate(value: string): boolean {
    const m = ISO_DATE.exec(value);
    if (!m) return false;
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const date = new Date(Date.UTC(y, mo - 1, d));
    return (
        date.getUTCFullYear() === y &&
        date.getUTCMonth() === mo - 1 &&
        date.getUTCDate() === d
    );
}

// Reject anything but a real YYYY-MM-DD date with the caller-facing message.
// Every date-taking read tool calls this (directly or via assertDateRange)
// before the value reaches shiftLocalDate/zonedDayStartUtc, which roll
// "2026-99-99" over to 2034 instead of failing. Matched in categorizeError
// by "not a real calendar date" → invalid_date_format.
export function assertCalendarDate(name: string, value: string): void {
    if (!isCalendarDate(value)) {
        throw new ToolError(
            `Invalid ${name} "${value}": not a real calendar date. Use YYYY-MM-DD, e.g. "2026-01-31".`,
        );
    }
}

// Validate a start_date/end_date pair for a range tool (the *_by_date_range
// listings and get_nutrition_summary), throwing the caller-facing message. Throwing (rather than returning text) is what routes
// the rejection through withAnalytics as a failure with an error category,
// the same as every other bad-argument path here. The wording is matched in
// categorizeError (src/analytics.ts): the over-limit message deliberately
// avoids "limit", which tier 3 would otherwise read as rate_limited.
export function assertDateRange(
    start: string,
    end: string,
    maxDays: number,
    longerHint: string,
): void {
    assertCalendarDate("start_date", start);
    assertCalendarDate("end_date", end);
    if (start > end) {
        throw new ToolError(
            `Invalid date range: start_date (${start}) is after end_date (${end}). Swap them.`,
        );
    }
    const days = dateDiffDays(start, end) + 1;
    if (days > maxDays) {
        throw new ToolError(
            `Date range too long: ${start} to ${end} spans ${days} days, and at most ${maxDays} days (inclusive) can be listed at once. ${longerHint}`,
        );
    }
}

/** missingNutrientNote for a meal just written. `itemCount` is the number of
 *  items the call wrote when it knows it; otherwise (a deduplicated insert, an
 *  update without items) the stored count is read, and only when the note has
 *  something to say. */
export async function missingNutrientNoteFor(
    userId: string,
    meal: Meal,
    itemCount?: number,
): Promise<string> {
    if (missingNutrients(meal).length === 0) return "";
    const count = itemCount ?? (await countMealItems(userId, meal.id));
    return missingNutrientNote(meal, count);
}

// Whether log_meal / update_meal refuse sugar_g without added_sugar_g right
// now. Read from the environment on every call, not once at import, so a test
// (or an operator restarting with a new value) controls it without
// mock.module; the clock is per call too, so the rule switches on by itself at
// the configured instant. Why it is gated at all: see
// ADDED_SUGAR_REQUIRED_FROM_ENV in added-sugar.ts — hosts cache tools/list
// for days, and a client on a list from before added_sugar_g existed cannot
// send the field.
let warnedAddedSugarGate: string | null = null;
export function addedSugarRequiredNow(nowMs: number = Date.now()): boolean {
    const raw = process.env[ADDED_SUGAR_REQUIRED_FROM_ENV];
    // One warning per bad value, carrying nothing but the variable's name: an
    // unparseable instant leaves the rule off, which is the safe direction.
    if (
        parseAddedSugarRequiredFrom(raw) === "invalid" &&
        warnedAddedSugarGate !== raw
    ) {
        warnedAddedSugarGate = raw ?? null;
        console.warn(
            `[config] ${ADDED_SUGAR_REQUIRED_FROM_ENV} is not an ISO-8601 date or offset date-time; the added-sugar requirement stays off.`,
        );
    }
    return addedSugarRequiredAt(raw, nowMs);
}
// At import, so a bad value is reported when the server starts rather than on
// the first sugared meal.
addedSugarRequiredNow();

// update_meal's half of the added ≤ total rule (addedSugarError). A field the
// call leaves out keeps its stored value, so the pair that ends up in the row
// is the passed value merged over the stored one — backfilling only
// added_sugar_g on a meal whose sugar_g is already stored has to be checked
// against that sugar_g. `stored` is null when both were passed (no read
// needed) or the meal does not exist (updateMeal reports that). Never clamps.
export function updatedAddedSugarError(
    fields: { sugar_g?: number; added_sugar_g?: number },
    stored: Pick<Meal, "sugar_g" | "added_sugar_g"> | null,
): string | null {
    return addedSugarError(
        fields.added_sugar_g !== undefined
            ? fields.added_sugar_g
            : stored?.added_sugar_g,
        fields.sugar_g !== undefined ? fields.sugar_g : stored?.sugar_g,
    );
}
