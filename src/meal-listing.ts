// Model-facing meal text: the one-line compact form every listing defaults to,
// the field-per-line full form, and the listing renderer that keeps a response
// inside a fixed character budget.
//
// Pure on purpose. No import from mcp.ts or supabase.ts (the `Meal` import is
// type-only and erased), so this unit-tests without the mock.module window and
// cannot drag the server's side effects into anything that imports it. Every
// time is rendered by slicing tz.ts's formatLocalDateTime: timezone logic lives
// there and only there.
//
// Why compact is the default: a 30-day get_meals_by_date_range used to return
// ~257 KB — up to 12 lines per meal, always the uuid, the raw UTC ISO time and
// the full notes. A raw UTC time was also a correctness risk rather than just
// bulk: a Kyiv user's 21:00 dinner read as 19:00Z (compare #68).

import type { Meal } from "./supabase.js";
import { formatAlcohol, type DrinkUnit } from "./alcohol.js";
import {
    compactSugarFigure,
    formatItemsBlock,
    type MealItemValues,
} from "./meal-items.js";
import { dateInTz, formatLocalDateTime } from "./tz.js";

// How alcohol should be rendered for the current user: the drink unit to gloss
// grams with, or null when alcohol tracking is OFF. Null is the gate, not a
// missing preference — an enabled user with no saved preference gets "us". See
// the alcohol opt-in note on registerTools in mcp.ts: alcohol is always STORED,
// and this value decides only whether it is ever shown.
export type AlcoholDisplay = DrinkUnit | null;

// Caffeine is the one figure here rendered without decimals. A tenth of a
// milligram is below the precision of any label, database or export, and
// "95.5 mg" claims a measurement nobody made; the structured payloads keep the
// sibling `* 10 / 10` rounding, but the model-facing text is whole milligrams.
export function formatMg(mg: number): string {
    return `${Math.round(mg)} mg`;
}

// Hard ceiling on one listing response. Roughly 200 compact meal lines, so a
// realistic 31-day month (6 meals a day) fits whole; full mode, which runs
// about twice as long per meal, is what actually hits it.
export const MEAL_LISTING_MAX_CHARS = 40_000;

export type MealDetail = "compact" | "full";

// Compact listings and structured meal breakdowns only (full mode never
// clips), and never below 200: a description is what the user said
// they ate, and cutting it short loses the thing a later update_meal needs to
// match. Code points, not UTF-16 units, so an emoji is never split in half.
const DESCRIPTION_CLIP = 200;

function clip(text: string, max: number): string {
    const chars = Array.from(text);
    return chars.length > max ? `${chars.slice(0, max).join("")}…` : text;
}

/** A meal description as one line, clipped at DESCRIPTION_CLIP code points:
 *  what a compact listing shows, and what every structured meal breakdown
 *  (mealBreakdown: summary, meal progress, daily view) carries, since the
 *  model reads those too. A pasted multi-line
 *  description would otherwise break the "one meal per line" shape. */
export function clipDescription(text: string): string {
    return clip(text.replace(/\s*[\r\n]+\s*/g, " "), DESCRIPTION_CLIP);
}

// Added sugar is part of total sugar, so it rides on the sugar figure as a
// bracket ("sugar 18 g (12 added)") rather than as a field of its own: the
// listing stays one line per meal, and the two never read as separate amounts
// to add up. A meal with added sugar but no total (an import column the source
// filled only half of) still shows the figure it has. Null is "not recorded",
// so nothing is printed; 0 is data and is.
function compactAddedSugar(meal: Meal): string | null {
    // Without an added figure the sugar stays in the shared " g" run (see
    // formatMealCompact), so only the bracketed or added-only forms come here.
    if (meal.added_sugar_g == null) return null;
    return compactSugarFigure(meal.sugar_g, meal.added_sugar_g);
}

function fullSugar(meal: Meal): string | null {
    const added = meal.added_sugar_g;
    if (meal.sugar_g != null) {
        return added != null
            ? `Sugar: ${meal.sugar_g}g (${added}g added)`
            : `Sugar: ${meal.sugar_g}g`;
    }
    return added != null ? `Added sugar: ${added}g` : null;
}

/** Every field on its own line, notes included, time as local
 *  "YYYY-MM-DD HH:MM". Never clipped. `items`, when the meal has any, follow
 *  as an "Items:" block (see formatItemsBlock in meal-items.ts). */
export function formatMealFull(
    meal: Meal,
    alcohol: AlcoholDisplay,
    tz: string,
    items?: MealItemValues[],
): string {
    const parts = [
        `ID: ${meal.id}`,
        `Time: ${formatLocalDateTime(meal.logged_at, tz).slice(0, 16)}`,
        meal.meal_type ? `Type: ${meal.meal_type}` : null,
        `Description: ${meal.description}`,
        meal.calories != null ? `Calories: ${meal.calories}` : null,
        meal.protein_g != null ? `Protein: ${meal.protein_g}g` : null,
        meal.carbs_g != null ? `Carbs: ${meal.carbs_g}g` : null,
        meal.fat_g != null ? `Fat: ${meal.fat_g}g` : null,
        meal.fiber_g != null ? `Fiber: ${meal.fiber_g}g` : null,
        fullSugar(meal),
        // Opt-in (see formatProgress in mcp.ts): a stored value stays hidden
        // until the user turns alcohol tracking on. It exists for users in
        // recovery, so the compact line below gates it identically.
        alcohol && meal.alcohol_g != null
            ? `Alcohol: ${formatAlcohol(meal.alcohol_g, alcohol)}`
            : null,
        // Not opt-in: a stored value is always echoed. The `!= null` is the
        // only suppression, and it is per-meal — a sandwich shows no caffeine
        // line, a measured 0 mg energy-free drink shows "Caffeine: 0 mg".
        meal.caffeine_mg != null
            ? `Caffeine: ${formatMg(meal.caffeine_mg)}`
            : null,
        meal.notes ? `Notes: ${meal.notes}` : null,
    ];
    const block =
        items && items.length > 0
            ? formatItemsBlock(items, alcohol !== null)
            : "";
    return [parts.filter(Boolean).join("\n"), block].filter(Boolean).join("\n");
}

/** One line per meal: local HH:MM, type, description (clipped at 200), the
 *  non-null figures, a "notes" flag in place of the note text, an item count
 *  when the meal was logged with ingredients, and the id update_meal /
 *  delete_meal take. `!= null` throughout — 0 is data. */
export function formatMealCompact(
    meal: Meal,
    alcohol: AlcoholDisplay,
    tz: string,
    itemCount?: number,
): string {
    const time = formatLocalDateTime(meal.logged_at, tz).slice(11, 16);
    const grams = [
        meal.protein_g != null ? `P ${meal.protein_g}` : null,
        meal.carbs_g != null ? `C ${meal.carbs_g}` : null,
        meal.fat_g != null ? `F ${meal.fat_g}` : null,
        meal.fiber_g != null ? `fiber ${meal.fiber_g}` : null,
        // Without an added figure, sugar stays inside the shared " g" run as
        // it always has; with one it needs its own unit before the bracket.
        meal.sugar_g != null && meal.added_sugar_g == null
            ? `sugar ${meal.sugar_g}`
            : null,
    ].filter(Boolean);
    const parts = [
        meal.calories != null ? `${meal.calories} kcal` : null,
        grams.length ? `${grams.join(" · ")} g` : null,
        compactAddedSugar(meal),
        // Same gate as formatMealFull.
        alcohol && meal.alcohol_g != null
            ? `alcohol ${formatAlcohol(meal.alcohol_g, alcohol)}`
            : null,
        meal.caffeine_mg != null
            ? `caffeine ${formatMg(meal.caffeine_mg)}`
            : null,
        meal.notes ? "notes" : null,
        itemCount && itemCount > 0
            ? `${itemCount} item${itemCount === 1 ? "" : "s"}`
            : null,
    ].filter(Boolean);
    const type = meal.meal_type ? ` ${meal.meal_type}` : "";
    const description = clipDescription(meal.description);
    return `- ${time}${type} — ${description}${parts.length ? ` · ${parts.join(" · ")}` : ""} [id: ${meal.id}]`;
}

interface Day {
    date: string;
    meals: Meal[];
}

/**
 * Render a meal listing that never exceeds `maxChars` (bar the one-meal
 * minimum). Whole days are added while the text plus the continuation notice
 * fits; only when not even the first day fits does it fall back to whole meals
 * of that day, and it always shows at least one. Ungrouped listings (one day's
 * meals) are a single unit, so they can only be cut at a meal boundary.
 *
 * The notice names a concrete next call on this server — never another
 * server's tool.
 */
export function renderMealListing(opts: {
    meals: Meal[];
    tz: string;
    alcohol: AlcoholDisplay;
    detail: MealDetail;
    grouped: boolean;
    maxChars?: number;
    /** Ingredients keyed by meal id. A meal with no entry is listed as before. */
    items?: Map<string, MealItemValues[]>;
}): { text: string; truncated: boolean; shownMeals: number } {
    const { tz, alcohol, detail, grouped } = opts;
    const itemsOf = (m: Meal) => opts.items?.get(m.id);
    const maxChars = opts.maxChars ?? MEAL_LISTING_MAX_CHARS;
    const compact = detail === "compact";

    // Defensive: the readers already order by logged_at, but the budget cut
    // and the "through <date>" notice both assume chronological order.
    const meals = [...opts.meals].sort(
        (a, b) => Date.parse(a.logged_at) - Date.parse(b.logged_at),
    );

    const format = (m: Meal, a: AlcoholDisplay, z: string): string =>
        compact
            ? formatMealCompact(m, a, z, itemsOf(m)?.length)
            : formatMealFull(m, a, z, itemsOf(m));
    const mealSep = compact ? "\n" : "\n\n---\n\n";
    const daySep = compact ? "\n\n" : "\n\n===\n\n";

    let header = `Times are local (${tz}).`;
    if (compact && meals.some((m) => m.notes)) {
        header +=
            ' P/C/F = protein/carbs/fat in grams. Pass detail: "full" for notes and full timestamps.';
    }

    // Grouped listings budget by calendar day; an ungrouped one is one unit.
    const days: Day[] = [];
    if (grouped) {
        for (const meal of meals) {
            const date = dateInTz(meal.logged_at, tz);
            const last = days[days.length - 1];
            if (last && last.date === date) last.meals.push(meal);
            else days.push({ date, meals: [meal] });
        }
    } else if (meals.length) {
        days.push({ date: dateInTz(meals[0]!.logged_at, tz), meals });
    }

    const renderDay = (day: Day, shown: Meal[] = day.meals): string => {
        const body = shown.map((m) => format(m, alcohol, tz)).join(mealSep);
        if (!grouped) return body;
        const n = day.meals.length;
        const dayHeader = `## ${day.date} (${n} meal${n === 1 ? "" : "s"})`;
        return `${dayHeader}${compact ? "\n" : "\n\n"}${body}`;
    };
    const assemble = (blocks: string[]) =>
        `${header}\n\n${blocks.join(daySep)}`;

    const rendered = days.map((d) => renderDay(d));
    const whole = assemble(rendered);
    if (whole.length <= maxChars || days.length === 0) {
        return { text: whole, truncated: false, shownMeals: meals.length };
    }

    const notice = (
        shownMeals: number,
        lastShownDate: string,
        nextHint: string,
    ) =>
        `\n\n(Output truncated to stay within the response budget: ${shownMeals} of ${meals.length} meals shown, through ${lastShownDate}.${nextHint}${detail === "full" ? ' detail: "compact" fits far more per call.' : ""})`;

    // Day boundary: the most whole days that fit together with their notice.
    let best: { text: string; shownMeals: number } | null = null;
    let shownMeals = 0;
    for (let k = 1; k < days.length; k++) {
        shownMeals += days[k - 1]!.meals.length;
        const text =
            assemble(rendered.slice(0, k)) +
            notice(
                shownMeals,
                days[k - 1]!.date,
                ` Call get_meals_by_date_range again with start_date ${days[k]!.date} for the rest.`,
            );
        if (text.length > maxChars) break;
        best = { text, shownMeals };
    }
    if (best) return { ...best, truncated: true };

    // Fallback: whole meals of the first day, and always at least one. The
    // hint depends on what was left out. The rest of a partly shown first day
    // is reachable only in full mode (compact already is the densest form, so
    // re-fetching that day compact would cut at the same place); the days
    // after it are always reachable with the next start_date, and a grouped
    // notice that omitted that would strand the whole remaining range.
    const first = days[0]!;
    const restOfRange =
        grouped && days.length > 1
            ? ` Call get_meals_by_date_range again with start_date ${days[1]!.date} for the rest.`
            : "";
    const hintFor = (n: number) => {
        const restOfDay =
            n < first.meals.length && detail === "full"
                ? ` Call get_meals_by_date for ${first.date} with detail: "compact".`
                : "";
        return restOfDay + restOfRange;
    };
    const partial = (n: number) =>
        assemble([renderDay(first, first.meals.slice(0, n))]) +
        notice(n, first.date, hintFor(n));
    let j = 1;
    let text = partial(1);
    // Up to the whole day inclusive: in a grouped listing the whole first day
    // is tried again here, so a one-meal day gets the day-boundary hint rather
    // than a mid-day one pointing back at a day already shown in full.
    for (let n = 2; n <= first.meals.length; n++) {
        const next = partial(n);
        if (next.length > maxChars) break;
        j = n;
        text = next;
    }
    return { text, truncated: true, shownMeals: j };
}
