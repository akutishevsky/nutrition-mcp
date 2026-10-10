import { dayCarries } from "./insights.js";
import type { Meal } from "./supabase.js";

/**
 * Saturated fat: the widget payload under SATURATED_FAT_META_KEY
 * (src/widgets.ts), built the way added-sugar's is (added-sugar.ts). Pure — no
 * Supabase, no Hono, never imports mcp.ts. NULL is "not recorded", never zero.
 *
 * Saturated fat is part of fat_g and carries a daily ceiling (`goal`). Trans
 * fat rides in the same payload under `trans` with the same `days`/`meals`
 * shape and never a goal. Both sit in the result's `_meta` rather than
 * structuredContent because output schemas are frozen once deployed.
 */

/** Rounded to one decimal, as every gram figure on a breakdown row is, or null
 * when not recorded. */
export function roundedSaturatedFat(m: Meal): number | null {
    return m.saturated_fat_g == null
        ? null
        : Math.round(m.saturated_fat_g * 10) / 10;
}

/** A day's saturated-fat total, or null when no meal that day carries a value
 * (dayCarries: such a day is "not recorded", not 0). */
export function daySaturatedFat(meals: Meal[]): number | null {
    if (!dayCarries(meals, "saturated_fat_g")) return null;
    return meals.reduce((s, m) => s + (m.saturated_fat_g ?? 0), 0);
}

/** A day's trans-fat total, or null when no meal that day carries a value. */
export function dayTransFat(meals: Meal[]): number | null {
    if (!dayCarries(meals, "trans_fat_g")) return null;
    return meals.reduce((s, m) => s + (m.trans_fat_g ?? 0), 0);
}

/** Trans fat rounded to one decimal, or null when not recorded. */
export function roundedTransFat(m: Meal): number | null {
    return m.trans_fat_g == null ? null : Math.round(m.trans_fat_g * 10) / 10;
}

/** A row of the meals the summary's list did not keep for one fat: the same
 * three fields as added sugar's extra rows, plus the value. */
export interface NutrientExtraRow {
    description: string;
    meal_type: string | null;
    date: string | null;
}

export interface SaturatedFatExtraRow extends NutrientExtraRow {
    saturated_fat_g: number;
}

export interface TransFatExtraRow extends NutrientExtraRow {
    trans_fat_g: number;
}

/** Trans fat's part of the payload: the same shape as the saturated keys, but
 * never a goal (trans fat has no ceiling). */
export interface TransFatMeta {
    days?: Record<string, number | null>;
    meals?: Record<string, number | null>;
    /** Meals in the window with a positive trans fat (get_nutrition_summary). */
    contributors?: number;
    /** The top meals the kept rows miss (get_nutrition_summary only). */
    extra?: TransFatExtraRow[];
}

export interface SaturatedFatMeta {
    v: 1;
    /** nutrition_goals.daily_saturated_fat_g; 0 is a real ceiling. */
    goal: number | null;
    /** Per-day totals keyed by local YYYY-MM-DD; null = not recorded that day. */
    days?: Record<string, number | null>;
    /** Per-meal values keyed by meal id, grams to one decimal, null when not
     * recorded. */
    meals?: Record<string, number | null>;
    /** Meals in the window with a positive saturated fat (get_nutrition_summary). */
    contributors?: number;
    /** The top meals the kept rows miss (get_nutrition_summary only). */
    extra?: SaturatedFatExtraRow[];
    /** Trans fat, same days/meals shape, no goal. */
    trans?: TransFatMeta;
}

/**
 * The indices of the meals whose value ranks in the top `topN` but that the
 * kept rows miss: ranked by value (rounded, > 0 only, descending, ties to the
 * earlier meal — the rule addedSugarExtra uses), then filtered by `kept`.
 */
function extraIndices(
    meals: readonly Meal[],
    kept: readonly number[],
    topN: number,
    value: (m: Meal) => number | null,
): number[] {
    const isKept = new Set(kept);
    return meals
        .map((m, i) => ({ i, v: value(m) ?? 0 }))
        .filter((r) => r.v > 0)
        .sort((a, b) => b.v - a.v || a.i - b.i)
        .slice(0, topN)
        .map((r) => r.i)
        .filter((i) => !isKept.has(i));
}

/** The summary's saturated-fat `extra` rows; `rows[i]` is meal i's breakdown
 * row, as addedSugarExtra takes it. */
export function saturatedFatExtra(
    meals: readonly Meal[],
    rows: readonly NutrientExtraRow[],
    kept: readonly number[],
    topN: number,
): SaturatedFatExtraRow[] {
    return extraIndices(meals, kept, topN, roundedSaturatedFat).map((i) => ({
        description: rows[i]!.description,
        meal_type: rows[i]!.meal_type,
        date: rows[i]!.date,
        saturated_fat_g: roundedSaturatedFat(meals[i]!)!,
    }));
}

/** The summary's trans-fat `extra` rows, as saturatedFatExtra. */
export function transFatExtra(
    meals: readonly Meal[],
    rows: readonly NutrientExtraRow[],
    kept: readonly number[],
    topN: number,
): TransFatExtraRow[] {
    return extraIndices(meals, kept, topN, roundedTransFat).map((i) => ({
        description: rows[i]!.description,
        meal_type: rows[i]!.meal_type,
        date: rows[i]!.date,
        trans_fat_g: roundedTransFat(meals[i]!)!,
    }));
}

export function buildSaturatedFatMeta(input: {
    goal: number | null | undefined;
    /** Meals grouped by local date. */
    days?: Record<string, Meal[]>;
    /** The meals whose rows the widget shows. */
    meals?: Meal[];
    /** Every meal in the window, to count contributors over. */
    contributorsOf?: Meal[];
    /** saturatedFatExtra's rows (get_nutrition_summary only). */
    extra?: SaturatedFatExtraRow[];
    /** transFatExtra's rows (get_nutrition_summary only). */
    transExtra?: TransFatExtraRow[];
}): SaturatedFatMeta {
    const meta: SaturatedFatMeta = { v: 1, goal: input.goal ?? null };
    if (input.days) {
        meta.days = {};
        for (const [date, meals] of Object.entries(input.days)) {
            meta.days[date] = daySaturatedFat(meals);
        }
    }
    if (input.meals) {
        meta.meals = {};
        for (const m of input.meals) meta.meals[m.id] = roundedSaturatedFat(m);
    }
    if (input.contributorsOf) {
        meta.contributors = input.contributorsOf.filter(
            (m) => (roundedSaturatedFat(m) ?? 0) > 0,
        ).length;
    }
    if (input.extra) meta.extra = input.extra;
    const trans: TransFatMeta = {};
    if (input.days) {
        trans.days = {};
        for (const [date, meals] of Object.entries(input.days)) {
            trans.days[date] = dayTransFat(meals);
        }
    }
    if (input.meals) {
        trans.meals = {};
        for (const m of input.meals) trans.meals[m.id] = roundedTransFat(m);
    }
    if (input.contributorsOf) {
        trans.contributors = input.contributorsOf.filter(
            (m) => (roundedTransFat(m) ?? 0) > 0,
        ).length;
    }
    if (input.transExtra) trans.extra = input.transExtra;
    if (trans.days || trans.meals) meta.trans = trans;
    return meta;
}

/**
 * The content-only note when a stored meal's saturated fat is above its total
 * fat (0.1 g tolerance for rounding). It is text the model reads beside the
 * saved values, never a refusal: the figures are stored as sent. Null when
 * either figure is not recorded, or when the pair is consistent.
 */
export function saturatedAboveFatNote(m: {
    saturated_fat_g?: number | null;
    fat_g?: number | null;
}): string | null {
    if (m.saturated_fat_g == null || m.fat_g == null) return null;
    if (m.saturated_fat_g <= m.fat_g + 0.1) return null;
    return `\n\nNote: saturated fat (${m.saturated_fat_g} g) is more than total fat (${m.fat_g} g), and saturated fat is part of total fat. Both are stored as given.`;
}
