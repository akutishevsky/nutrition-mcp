import { dayCarries } from "./insights.js";
import type { NutrientExtraRow } from "./saturated-fat.js";
import type { Meal } from "./supabase.js";

/**
 * Sodium: the widget payload under SODIUM_META_KEY (src/widgets.ts), built the
 * way saturated fat's is (saturated-fat.ts). Pure — no Supabase, no Hono, never
 * imports mcp.ts. NULL is "not recorded", never zero.
 *
 * Sodium is milligrams (not salt) and carries a daily ceiling (`goal`). It sits
 * in the result's `_meta` rather than structuredContent because output schemas
 * are frozen once deployed.
 *
 * The goal-progress widget reads it for its sodium goal row; the macro strip
 * has no sodium cell yet (see "Sodium" in CLAUDE.md).
 */

/** Rounded to one decimal, as every milligram figure on a breakdown row is, or
 * null when not recorded. */
export function roundedSodium(m: Meal): number | null {
    return m.sodium_mg == null ? null : Math.round(m.sodium_mg * 10) / 10;
}

/** A day's sodium total in mg, or null when no meal that day carries a value
 * (dayCarries: such a day is "not recorded", not 0). */
export function daySodium(meals: Meal[]): number | null {
    if (!dayCarries(meals, "sodium_mg")) return null;
    return meals.reduce((s, m) => s + (m.sodium_mg ?? 0), 0);
}

/** A row of the meals the summary's list did not keep for sodium: the same
 * three fields as the fat extra rows, plus the value. */
export interface SodiumExtraRow extends NutrientExtraRow {
    sodium_mg: number;
}

export interface SodiumMeta {
    v: 1;
    /** nutrition_goals.daily_sodium_mg; 0 is a real ceiling. */
    goal: number | null;
    /** Per-day totals keyed by local YYYY-MM-DD; null = not recorded that day. */
    days?: Record<string, number | null>;
    /** Per-meal values keyed by meal id, mg to one decimal, null when not
     * recorded. */
    meals?: Record<string, number | null>;
    /** Meals in the window with a positive sodium (get_nutrition_summary). */
    contributors?: number;
    /** The top meals the kept rows miss (get_nutrition_summary only). */
    extra?: SodiumExtraRow[];
}

/**
 * The summary's sodium `extra` rows; `rows[i]` is meal i's breakdown row, as
 * saturatedFatExtra takes it. Ranked by value (rounded, > 0 only, descending,
 * ties to the earlier meal — the rule addedSugarExtra uses), the top `topN`
 * kept, then those the kept rows already show dropped.
 */
export function sodiumExtra(
    meals: readonly Meal[],
    rows: readonly NutrientExtraRow[],
    kept: readonly number[],
    topN: number,
): SodiumExtraRow[] {
    const isKept = new Set(kept);
    return meals
        .map((m, i) => ({ i, v: roundedSodium(m) ?? 0 }))
        .filter((r) => r.v > 0)
        .sort((a, b) => b.v - a.v || a.i - b.i)
        .slice(0, topN)
        .map((r) => r.i)
        .filter((i) => !isKept.has(i))
        .map((i) => ({
            description: rows[i]!.description,
            meal_type: rows[i]!.meal_type,
            date: rows[i]!.date,
            sodium_mg: roundedSodium(meals[i]!)!,
        }));
}

export function buildSodiumMeta(input: {
    goal: number | null | undefined;
    /** Meals grouped by local date. */
    days?: Record<string, Meal[]>;
    /** The meals whose rows the widget shows. */
    meals?: Meal[];
    /** Every meal in the window, to count contributors over. */
    contributorsOf?: Meal[];
    /** sodiumExtra's rows (get_nutrition_summary only). */
    extra?: SodiumExtraRow[];
}): SodiumMeta {
    const meta: SodiumMeta = { v: 1, goal: input.goal ?? null };
    if (input.days) {
        meta.days = {};
        for (const [date, meals] of Object.entries(input.days)) {
            meta.days[date] = daySodium(meals);
        }
    }
    if (input.meals) {
        meta.meals = {};
        for (const m of input.meals) meta.meals[m.id] = roundedSodium(m);
    }
    if (input.contributorsOf) {
        meta.contributors = input.contributorsOf.filter(
            (m) => (roundedSodium(m) ?? 0) > 0,
        ).length;
    }
    if (input.extra) meta.extra = input.extra;
    return meta;
}
