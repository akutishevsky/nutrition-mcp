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
        });
    }
    variations.sort(
        (a, b) =>
            b.count - a.count || b.lastLoggedAt.localeCompare(a.lastLoggedAt),
    );
    return variations;
}

function formatVariation(v: MealVariation, index: number, tz: string): string {
    const parts: string[] = [
        `${index + 1}. ${v.label} — logged ${v.count}×, last on ${dateInTz(v.lastLoggedAt, tz)}`,
    ];
    if (v.typicalCalories !== null) {
        const macros = [
            v.typicalProteinG !== null ? `${v.typicalProteinG}g protein` : null,
            v.typicalCarbsG !== null ? `${v.typicalCarbsG}g carbs` : null,
            v.typicalFatG !== null ? `${v.typicalFatG}g fat` : null,
        ].filter(Boolean);
        parts.push(
            `typically ~${v.typicalCalories} kcal${macros.length > 0 ? ` (${macros.join(", ")})` : ""}`,
        );
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
        "When logging from a photo, present these variations to the user as options before logging.",
    ];
    return sections.join("\n\n");
}
