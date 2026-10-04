import type { Meal } from "./supabase.js";
import { dateInTz } from "./tz.js";

/**
 * Escape LIKE/ILIKE metacharacters so user input matches literally.
 * Backslash must be escaped first, then % and _.
 */
export function escapeLikePattern(s: string): string {
    return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Split a search query into lowercase word tokens (whitespace-separated,
 * empties removed), capped at 5 tokens to bound the query chain length.
 */
export function tokenizeQuery(query: string): string[] {
    return query
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 0)
        .slice(0, 5);
}

export interface MealVariation {
    /** Normalized description used as the grouping key. */
    key: string;
    /** Description of the most recent meal in the group (original casing). */
    label: string;
    count: number;
    /** ISO timestamp of the newest entry in the group. */
    lastLoggedAt: string;
    /** Median of non-null values; null when every entry lacks the field. */
    typicalCalories: number | null;
    typicalProteinG: number | null;
    typicalCarbsG: number | null;
    typicalFatG: number | null;
    /* Carried for the same reason as the macros above, and it is what makes
     * copying a recurring meal forward complete rather than four-fifths
     * complete: the model is told to search before logging a repeat, so
     * whatever this output omits is what it re-derives (or forgets) each time.
     * medianOf already drops nulls, so a history where only some entries
     * recorded fiber still yields the typical figure of the ones that did. */
    typicalFiberG: number | null;
    typicalSugarG: number | null;
    /* Part of typicalSugarG, rendered as a bracket on it. A median over the
     * entries that recorded it, so it can exceed typicalSugarG when the two
     * medians come from different entries; null when none did. */
    typicalAddedSugarG: number | null;
    /* Whole milligrams, matching every other caffeine figure the model is
     * shown. Null for the usual case of a food that never carried any. */
    typicalCaffeineMg: number | null;
}

/**
 * Grouping is by exact normalized description, deliberately not fuzzy:
 * fuzzy matching would merge exactly the variations this feature exists to
 * distinguish ("oatmeal with raisins" vs "oatmeal with banana").
 */
function normalizeDescription(description: string): string {
    return description
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[.,!]+$/, "");
}

function median(values: number[]): number | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1
        ? sorted[mid]!
        : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function medianOf(
    meals: Meal[],
    pick: (m: Meal) => number | null,
    round: (n: number) => number,
): number | null {
    const values = meals
        .map(pick)
        .filter((v): v is number => v !== null && v !== undefined);
    const m = median(values);
    return m === null ? null : round(m);
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Typical added sugar, never above the typical total. The two medians would
 * otherwise come from different entries: with sugar [10, 10, 30] and added
 * [null, null, 25] they are 10 and 25, which prints "10g sugar (25g added)"
 * and, copied into log_meal, fails its added <= total check. So the added
 * median is taken over the entries that carry both figures when any do, and
 * is then capped at the typical total.
 */
function typicalAddedSugar(group: Meal[]): number | null {
    const sugar = medianOf(group, (m) => m.sugar_g, round1);
    const paired = group.filter(
        (m) => m.sugar_g != null && m.added_sugar_g != null,
    );
    const added = medianOf(
        paired.length ? paired : group,
        (m) => m.added_sugar_g,
        round1,
    );
    if (added === null || sugar === null) return added;
    return Math.min(added, sugar);
}

/** Group meals into recurring variations, most frequent first. */
export function groupMealVariations(meals: Meal[]): MealVariation[] {
    const groups = new Map<string, Meal[]>();
    for (const meal of meals) {
        const key = normalizeDescription(meal.description);
        const group = groups.get(key);
        if (group) group.push(meal);
        else groups.set(key, [meal]);
    }
    const variations: MealVariation[] = [];
    for (const [key, group] of groups) {
        const newest = group.reduce((a, b) =>
            b.logged_at.localeCompare(a.logged_at) > 0 ? b : a,
        );
        variations.push({
            key,
            label: newest.description,
            count: group.length,
            lastLoggedAt: newest.logged_at,
            typicalCalories: medianOf(group, (m) => m.calories, Math.round),
            typicalProteinG: medianOf(group, (m) => m.protein_g, round1),
            typicalCarbsG: medianOf(group, (m) => m.carbs_g, round1),
            typicalFatG: medianOf(group, (m) => m.fat_g, round1),
            typicalFiberG: medianOf(group, (m) => m.fiber_g, round1),
            typicalSugarG: medianOf(group, (m) => m.sugar_g, round1),
            typicalAddedSugarG: typicalAddedSugar(group),
            typicalCaffeineMg: medianOf(
                group,
                (m) => m.caffeine_mg,
                Math.round,
            ),
        });
    }
    variations.sort(
        (a, b) =>
            b.count - a.count || b.lastLoggedAt.localeCompare(a.lastLoggedAt),
    );
    return variations;
}

// "18g sugar (12g added)": added sugar is part of the total, so it is a
// bracket on it rather than a separate amount (see compactAddedSugar in
// meal-listing.ts for the listing's equivalent).
function formatVariationSugar(v: MealVariation): string | null {
    const added = v.typicalAddedSugarG;
    if (v.typicalSugarG !== null) {
        return added !== null
            ? `${v.typicalSugarG}g sugar (${added}g added)`
            : `${v.typicalSugarG}g sugar`;
    }
    return added !== null ? `${added}g added sugar` : null;
}

function formatVariation(v: MealVariation, index: number, tz: string): string {
    const parts: string[] = [
        `${index + 1}. ${v.label} — logged ${v.count}×, last on ${dateInTz(v.lastLoggedAt, tz)}`,
    ];
    const macros = [
        v.typicalProteinG !== null ? `${v.typicalProteinG}g protein` : null,
        v.typicalCarbsG !== null ? `${v.typicalCarbsG}g carbs` : null,
        v.typicalFatG !== null ? `${v.typicalFatG}g fat` : null,
        v.typicalFiberG !== null ? `${v.typicalFiberG}g fiber` : null,
        formatVariationSugar(v),
        v.typicalCaffeineMg !== null
            ? `${v.typicalCaffeineMg} mg caffeine`
            : null,
    ].filter(Boolean);
    if (v.typicalCalories !== null) {
        parts.push(
            `typically ~${v.typicalCalories} kcal${macros.length > 0 ? ` (${macros.join(", ")})` : ""}`,
        );
    } else if (macros.length > 0) {
        // A group with nutrients but no calorie figure used to read "(no macros
        // logged)", which was false and told the model to re-derive numbers it
        // was already holding.
        parts.push(`typically ${macros.join(", ")}, no calorie figure logged`);
    } else {
        parts.push("(no macros logged)");
    }
    return parts.join(", ");
}

function formatRecentEntry(meal: Meal, tz: string): string {
    const date = dateInTz(meal.logged_at, tz);
    const type = meal.meal_type ? ` ${meal.meal_type}` : "";
    const kcal = meal.calories !== null ? ` — ${meal.calories} kcal` : "";
    return `- ${date}${type}: ${meal.description}${kcal} [id: ${meal.id}]`;
}

/**
 * Render search results as grouped variations plus the most recent raw
 * entries. Assumes meals is non-empty and pre-sorted newest first (the
 * tool handler handles the empty case, per repo convention).
 */
export function formatMealSearchResults(
    meals: Meal[],
    queries: string[],
    tz: string,
    opts: { maxVariations?: number; recentCount?: number } = {},
): string {
    const maxVariations = opts.maxVariations ?? 10;
    const recentCount = opts.recentCount ?? 5;

    const label = queries.map((q) => `"${q}"`).join(" / ");
    const variations = groupMealVariations(meals);
    const shown = variations.slice(0, maxVariations);
    const hidden = variations.length - shown.length;

    const sections = [
        `Found ${meals.length} past meal${meals.length === 1 ? "" : "s"} matching ${label}.`,
        [
            "Variations (by frequency):",
            ...shown.map((v, i) => formatVariation(v, i, tz)),
            ...(hidden > 0
                ? [`(…and ${hidden} more variation${hidden === 1 ? "" : "s"})`]
                : []),
        ].join("\n"),
        [
            "Most recent matching entries:",
            ...meals.slice(0, recentCount).map((m) => formatRecentEntry(m, tz)),
        ].join("\n"),
        "When logging from a photo, present these variations to the user as options before logging. Reuse the figures above for a repeat of the same meal — and where a variation shows no fiber or sugar, that is missing data rather than a zero, so estimate those two when you log the repeat instead of leaving them out again.",
    ];
    return sections.join("\n\n");
}
