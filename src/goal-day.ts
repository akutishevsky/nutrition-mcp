import type { MealItemValues } from "./meal-items.js";
import type { Meal, WaterEntry } from "./supabase.js";
import { formatLocalDateTime } from "./tz.js";

/**
 * The goal-progress widget's day detail, under GOAL_DAY_META_KEY
 * (src/widgets.ts) in get_goal_progress's `_meta`: what the frozen
 * structuredContent cannot carry. Pure — no Supabase, no Hono, never imports
 * mcp.ts.
 *
 * - `now`: the account's local clock (HH:MM) when the request was answered,
 *   or null when the requested date is not today in the account's timezone.
 *   It is also how the widget tells "today" from a past day without trusting
 *   the device clock.
 * - `meals`: one slot per structuredContent.meals row, in the same order (the
 *   rows carry no id, so the widget joins by position, as it does every other
 *   per-meal `_meta`): the meal's local time and which of the row's nutrients
 *   were not recorded. The rows print an unrecorded fiber or sugar as 0, which
 *   the widget must not read as a measured zero.
 * - `water`: the day's water entries, local time and millilitres, oldest
 *   first.
 * - `foods`: foods and meals from the user's own log (the requested day and
 *   the GOAL_DAY_HISTORY_DAYS before it), only on today. The widget lists them
 *   as facts ("logged before, 17 g protein"); it never names a food the user
 *   did not log. Omitted on a past day and when the history read failed; an
 *   empty list means nothing qualified.
 */

/** How far back `foods` looks, in days before the requested date. */
export const GOAL_DAY_HISTORY_DAYS = 28;
/** At most this many foods per target nutrient, and in all. */
export const GOAL_DAY_FOODS_PER_NUTRIENT = 8;
export const GOAL_DAY_FOODS_MAX = 32;
/** Longer names read as a description, not a food, and are left out. */
export const GOAL_DAY_FOOD_NAME_CHARS = 60;
/** At most this many water entries are sent. */
export const GOAL_DAY_WATER_MAX = 60;

/** The row nutrients whose absence the widget needs to see. */
export const GOAL_DAY_ROW_NUTRIENTS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
] as const;
export type GoalDayRowNutrient = (typeof GOAL_DAY_ROW_NUTRIENTS)[number];

export interface GoalDayMeal {
    /** Local HH:MM. */
    time: string | null;
    /** Row nutrients this meal did not record (its row shows them as 0). */
    missing: GoalDayRowNutrient[];
}

export interface GoalDayWater {
    time: string | null;
    ml: number;
}

export interface GoalDayFood {
    name: string;
    amount: number | null;
    unit: string | null;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number | null;
    sugar_g: number | null;
    added_sugar_g: number | null;
    saturated_fat_g: number | null;
    sodium_mg: number | null;
    caffeine_mg: number | null;
}

export interface GoalDayMeta {
    v: 1;
    now: string | null;
    meals: GoalDayMeal[];
    water: GoalDayWater[];
    foods?: GoalDayFood[];
}

/** Local HH:MM of an instant. */
export function localClock(instant: Date | string, tz: string): string {
    return formatLocalDateTime(instant, tz).slice(11, 16);
}

const tenth = (v: number | null | undefined): number | null =>
    v == null || !Number.isFinite(v) ? null : Math.round(v * 10) / 10;

/** The target nutrients `foods` is ranked for, with the smallest amount a
 * food must carry to be listed for it. */
const FOOD_TARGETS = [
    ["protein_g", 10],
    ["fiber_g", 2],
    ["carbs_g", 10],
    ["fat_g", 5],
] as const;

type NutrientOf = Pick<
    Meal,
    | "calories"
    | "protein_g"
    | "carbs_g"
    | "fat_g"
    | "fiber_g"
    | "sugar_g"
    | "added_sugar_g"
    | "alcohol_g"
    | "caffeine_mg"
    | "saturated_fat_g"
    | "sodium_mg"
>;

interface Candidate extends NutrientOf {
    name: string;
    amount: number | null;
    unit: string | null;
    logged_at: string;
}

function candidateOf(
    v: NutrientOf,
    name: string,
    amount: number | null,
    unit: string | null,
    logged_at: string,
): Candidate {
    return {
        name: name.trim(),
        amount,
        unit,
        logged_at,
        calories: v.calories,
        protein_g: v.protein_g,
        carbs_g: v.carbs_g,
        fat_g: v.fat_g,
        fiber_g: v.fiber_g,
        sugar_g: v.sugar_g,
        added_sugar_g: v.added_sugar_g,
        alcohol_g: v.alcohol_g,
        caffeine_mg: v.caffeine_mg,
        saturated_fat_g: v.saturated_fat_g ?? null,
        sodium_mg: v.sodium_mg ?? null,
    };
}

/**
 * The foods `foods` may name: each meal's ingredients when it has them, else
 * the meal itself. A food with any alcohol is never listed (the alcohol
 * opt-in exists for users in recovery, and naming a drink as a source of
 * anything is not this widget's business). One entry per name, ignoring case,
 * from its most recent log; then, per target nutrient, the foods densest in it
 * (amount per kcal, +40 so a near-zero-kcal item does not win on a trace), at
 * most GOAL_DAY_FOODS_PER_NUTRIENT each and GOAL_DAY_FOODS_MAX in all.
 */
export function historyFoods(
    meals: readonly Meal[],
    items: ReadonlyMap<string, readonly MealItemValues[]>,
): GoalDayFood[] {
    const sources: Candidate[] = [];
    for (const m of meals) {
        const list = items.get(m.id);
        if (list && list.length) {
            for (const it of list) {
                sources.push(
                    candidateOf(it, it.name, it.amount, it.unit, m.logged_at),
                );
            }
        } else {
            sources.push(
                candidateOf(m, m.description, null, null, m.logged_at),
            );
        }
    }
    const latest = new Map<string, Candidate>();
    for (const s of sources) {
        if (!s.name || s.name.length > GOAL_DAY_FOOD_NAME_CHARS) continue;
        if ((s.alcohol_g ?? 0) > 0) continue;
        if (s.calories == null || s.protein_g == null) continue;
        if (s.carbs_g == null || s.fat_g == null) continue;
        const key = s.name.toLowerCase();
        const had = latest.get(key);
        if (!had || had.logged_at < s.logged_at) latest.set(key, s);
    }
    const pool = [...latest.values()];
    const picked = new Set<Candidate>();
    for (const [k, min] of FOOD_TARGETS) {
        const dense = (s: Candidate) => (s[k] ?? 0) / ((s.calories ?? 0) + 40);
        pool.filter((s) => (s[k] ?? 0) >= min)
            .sort((a, b) => dense(b) - dense(a) || a.name.localeCompare(b.name))
            .slice(0, GOAL_DAY_FOODS_PER_NUTRIENT)
            .forEach((s) => picked.add(s));
    }
    return [...picked].slice(0, GOAL_DAY_FOODS_MAX).map((s) => ({
        name: s.name,
        amount: s.amount,
        unit: s.unit,
        calories: Math.round(s.calories ?? 0),
        protein_g: tenth(s.protein_g) ?? 0,
        carbs_g: tenth(s.carbs_g) ?? 0,
        fat_g: tenth(s.fat_g) ?? 0,
        fiber_g: tenth(s.fiber_g),
        sugar_g: tenth(s.sugar_g),
        added_sugar_g: tenth(s.added_sugar_g),
        saturated_fat_g: tenth(s.saturated_fat_g),
        sodium_mg: tenth(s.sodium_mg),
        caffeine_mg: tenth(s.caffeine_mg),
    }));
}

export function buildGoalDayMeta(input: {
    /** The meals behind structuredContent.meals, in the same order. */
    meals: readonly Meal[];
    water: readonly WaterEntry[];
    tz: string;
    /** The request instant when the date is today, else null. */
    now: Date | null;
    /** historyFoods' list; undefined omits the key (past day, failed read). */
    foods?: GoalDayFood[];
}): GoalDayMeta {
    const meta: GoalDayMeta = {
        v: 1,
        now: input.now ? localClock(input.now, input.tz) : null,
        meals: input.meals.map((m) => ({
            time: localClock(m.logged_at, input.tz),
            missing: GOAL_DAY_ROW_NUTRIENTS.filter((k) => m[k] == null),
        })),
        water: [...input.water]
            .sort((a, b) =>
                a.logged_at < b.logged_at
                    ? -1
                    : a.logged_at > b.logged_at
                      ? 1
                      : 0,
            )
            .slice(0, GOAL_DAY_WATER_MAX)
            .map((w) => ({
                time: localClock(w.logged_at, input.tz),
                ml: Math.round(w.amount_ml),
            })),
    };
    if (input.foods) meta.foods = input.foods;
    return meta;
}
