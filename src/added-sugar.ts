import { dayCarries } from "./insights.js";
import type { Meal } from "./supabase.js";

/**
 * Added sugar: the shared rules every write path and every widget payload use.
 * Pure — no Supabase, no Hono, never imports mcp.ts — so the importer, the
 * tools and the widget harness all build from the same code.
 *
 * Definition (the US label one): sugars added during processing or
 * preparation. Part of total sugar (`sugar_g`) and never more than it. NULL is
 * "not recorded", never zero (see PartialNutrient in insights.ts).
 */

/**
 * The added ≤ total rule, as caller-facing text, or null when the pair is
 * consistent. Either side may be null/undefined (not recorded) — the rule only
 * binds when both are known. Never clamp: a mismatch is a real error the
 * caller has to resolve.
 */
export function addedSugarError(
    added: number | null | undefined,
    total: number | null | undefined,
): string | null {
    if (added == null || total == null) return null;
    if (added <= total) return null;
    // One decimal reads best, but 10.04 over 10 would then print as "10 g is
    // more than 10 g" — so widen the precision until the two figures differ.
    let places = 1;
    while (places < 6 && fmt(added, places) === fmt(total, places)) places++;
    return `added_sugar_g (${fmt(added, places)} g) is more than sugar_g (${fmt(total, places)} g); added sugars are part of total sugars.`;
}

function fmt(n: number, places: number): string {
    const f = 10 ** places;
    return String(Math.round(n * f) / f);
}

/** A day's added-sugar total, or null when no meal that day carries a value
 * (the dayCarries rule — such a day is "not recorded", not 0). */
export function dayAddedSugar(meals: Meal[]): number | null {
    if (!dayCarries(meals, "added_sugar_g")) return null;
    return meals.reduce((s, m) => s + (m.added_sugar_g ?? 0), 0);
}

/**
 * One meal's added sugar as every per-meal figure reports it: grams rounded to
 * one decimal, exactly as mealBreakdown (mcp.ts) rounds every other gram field
 * on a breakdown row, or null when not recorded. The widget lists a meal only
 * when this is > 0, so the per-meal values (`meals`), the `extra` ranking and
 * the `contributors` count all go through it — a 0.04 g meal reads 0.0, is
 * never listed, and must never be counted either, or the summary's "N more"
 * (contributors − shown) overcounts. Day totals (dayAddedSugar) sum the raw
 * values instead: rounding each meal first would drift a day's figure.
 */
export function roundedAddedSugar(m: Meal): number | null {
    return m.added_sugar_g == null
        ? null
        : Math.round(m.added_sugar_g * 10) / 10;
}

/**
 * The widget payload under ADDED_SUGAR_META_KEY (src/widgets.ts), v1. Every
 * field but `v` and `goal` is optional to the widget, which falls back to
 * today's strip (no added-sugar cell) when the whole key is missing.
 */
export interface AddedSugarMeta {
    v: 1;
    /** nutrition_goals.daily_added_sugar_g; 0 is a real ceiling. */
    goal: number | null;
    /** Per-day totals keyed by local YYYY-MM-DD; null = not recorded that day. */
    days?: Record<string, number | null>;
    /** Per-meal values for the breakdown rows, keyed by meal id: grams to one
     * decimal (roundedAddedSugar), null when not recorded. */
    meals?: Record<string, number | null>;
    /** Meals in the window whose rounded added sugar is above 0 (the
     * summary's "N more"), the same rule the listed rows pass. */
    contributors?: number;
    /**
     * get_nutrition_summary only: the window's top meals by added sugar that
     * are NOT among the rows `meals` describes, ranked (most first). The
     * summary's rows are the frozen-schema union of the other metrics' top N
     * (topMealBreakdown in mcp.ts), and added sugar deliberately ranks no rows
     * of its own there, so without these a 30 g sweetened drink that tops no
     * other metric would be missing from the added-sugar list while
     * `contributors` still counted it. Widget-only, never in structuredContent;
     * the widget lists these in the added-sugar cell alone, beside the kept
     * rows that carry a value. At most MEAL_BREAKDOWN_TOP_N rows. Optional and
     * additive, so `v` stays 1: older widgets ignore it. Single-day tools never
     * send it, since their rows are every meal of the day.
     */
    extra?: AddedSugarExtraRow[];
}

/** One `extra` row: the same description / meal_type / date mealBreakdown
 * gives a structuredContent row, plus the meal's added sugar. */
export interface AddedSugarExtraRow {
    description: string;
    meal_type: string | null;
    date: string | null;
    /** Grams, one decimal, always > 0. */
    added_sugar_g: number;
}

/**
 * The `extra` rows: rank every meal by added sugar (rounded to one decimal
 * like every gram field, > 0 only, descending, ties to the earlier meal — the
 * stable rule topMealBreakdown uses), take the top `topN`, and keep those
 * whose index is not in `kept`, in ranked order. `rows[i]` is meal i's
 * breakdown row (mealBreakdown's output, so the formatting is shared, not
 * repeated here); `meals` and `rows` are the same list in the same order.
 */
export function addedSugarExtra(
    meals: readonly Meal[],
    rows: readonly {
        description: string;
        meal_type: string | null;
        date: string | null;
    }[],
    kept: readonly number[],
    topN: number,
): AddedSugarExtraRow[] {
    const isKept = new Set(kept);
    return meals
        .map((m, i) => ({ i, v: roundedAddedSugar(m) ?? 0 }))
        .filter((r) => r.v > 0)
        .sort((a, b) => b.v - a.v || a.i - b.i)
        .slice(0, topN)
        .filter((r) => !isKept.has(r.i))
        .map(({ i, v }) => ({
            description: rows[i]!.description,
            meal_type: rows[i]!.meal_type,
            date: rows[i]!.date,
            added_sugar_g: v,
        }));
}

export function buildAddedSugarMeta(input: {
    goal: number | null | undefined;
    /** Meals grouped by local date. */
    days?: Record<string, Meal[]>;
    /** The meals whose rows the widget shows. */
    meals?: Meal[];
    /** Every meal in the window, to count contributors over. */
    contributorsOf?: Meal[];
    /** addedSugarExtra's rows (get_nutrition_summary only). */
    extra?: AddedSugarExtraRow[];
}): AddedSugarMeta {
    const meta: AddedSugarMeta = { v: 1, goal: input.goal ?? null };
    if (input.days) {
        meta.days = {};
        for (const [date, meals] of Object.entries(input.days)) {
            meta.days[date] = dayAddedSugar(meals);
        }
    }
    if (input.meals) {
        meta.meals = {};
        for (const m of input.meals) meta.meals[m.id] = roundedAddedSugar(m);
    }
    if (input.contributorsOf) {
        meta.contributors = input.contributorsOf.filter(
            (m) => (roundedAddedSugar(m) ?? 0) > 0,
        ).length;
    }
    if (input.extra) meta.extra = input.extra;
    return meta;
}
