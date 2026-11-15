// Activity-adjusted daily goals. Pure: no Supabase, so it unit-tests with
// fixtures (the import.ts / insights.ts convention).
//
// The model, chosen to match how MyFitnessPal treats a wearable's burn: the
// stored calorie goal is the no-exercise baseline, and on a given day every
// active kilocalorie the watch recorded is added on top of it. Protein, carbs
// and fat scale by the same ratio (1800 + 300 → ×2100/1800), so the macro
// split the user chose survives a bigger day. Fiber, sugar, alcohol, caffeine
// and water are not energy targets and stay exactly as set.

import type { NutritionGoals } from "./supabase.js";

/** Upper bound on one day's active energy. A marathon is ~2,600 kcal of
 *  active burn; anything past this is a unit mix-up (kJ sent as kcal) or a
 *  broken Shortcut, and refusing it beats inflating the goal by thousands. */
export const MAX_ACTIVE_KCAL = 5000;

export interface ActivityAdjustment {
    /** Goals in effect for the day — the adjusted set when activity applied,
     *  otherwise the input unchanged. */
    goals: NutritionGoals | null;
    /** The stored (baseline) goals, or null when no adjustment was applied. */
    base: NutritionGoals | null;
    /** Active kcal that were added, or null when none applied. */
    activeKcal: number | null;
    /** (base + active) / base, or 1 when nothing applied. */
    factor: number;
    /** A derived goal (estimated burn, rate or date; goal-plan.ts): active
     *  kcal are already in the figure, and protein is held while carbs and
     *  fat follow the calories. */
    derived?: boolean;
}

/** The adjustment for a derived goal, from the day's row (the dashboard's own
 *  figures, so the assistant and the page cannot disagree). `base` is what
 *  the goal is without the day's active kcal, so "base + active" adds up. */
export function derivedAdjustment(
    stored: NutritionGoals | null,
    row: {
        goal_calories: number;
        active_kcal: number | null;
        goal_protein_g: number | null;
        goal_carbs_g: number | null;
        goal_fat_g: number | null;
    },
): ActivityAdjustment {
    const blank = {
        user_id: "",
        daily_calories: null,
        daily_protein_g: null,
        daily_carbs_g: null,
        daily_fat_g: null,
        daily_fiber_g: null,
        daily_sugar_g: null,
        daily_alcohol_g: null,
        daily_caffeine_mg: null,
        daily_water_ml: null,
        target_weight_g: null,
        calorie_goal_mode: null,
        weight_rate_g_per_day: null,
        target_date: null,
        updated_at: "",
    } satisfies NutritionGoals;
    const goals = {
        ...(stored ?? blank),
        daily_calories: row.goal_calories,
        daily_protein_g: row.goal_protein_g,
        daily_carbs_g: row.goal_carbs_g,
        daily_fat_g: row.goal_fat_g,
    };
    const active = Math.round(row.active_kcal ?? 0);
    if (!(active > 0))
        return {
            goals,
            base: null,
            activeKcal: null,
            factor: 1,
            derived: true,
        };
    const baseKcal = row.goal_calories - active;
    return {
        goals,
        base: { ...goals, daily_calories: baseKcal },
        activeKcal: active,
        factor: baseKcal > 0 ? row.goal_calories / baseKcal : 1,
        derived: true,
    };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function adjustGoalsForActivity(
    goals: NutritionGoals | null,
    activeKcal: number | null | undefined,
): ActivityAdjustment {
    const unchanged: ActivityAdjustment = {
        goals,
        base: null,
        activeKcal: null,
        factor: 1,
    };
    if (!goals || activeKcal == null || !(activeKcal > 0)) return unchanged;
    const base = goals.daily_calories;
    // A calorie goal of 0/null means "unset" (it is a floor): there is no
    // baseline to scale from, so the macros stay put rather than dividing by 0.
    if (base == null || !(base > 0)) return unchanged;

    const active = Math.round(activeKcal);
    const factor = (base + active) / base;
    const scale = (v: number | null) => (v == null ? null : round1(v * factor));
    return {
        goals: {
            ...goals,
            daily_calories: base + active,
            daily_protein_g: scale(goals.daily_protein_g),
            daily_carbs_g: scale(goals.daily_carbs_g),
            daily_fat_g: scale(goals.daily_fat_g),
        },
        base: goals,
        activeKcal: active,
        factor,
    };
}

/** Validates a caller-supplied active-kcal figure. Lives in the handler, not
 *  in Zod, so a bad value comes back as a readable message (the project's
 *  "bounds live in the handler" rule). */
export function checkActiveKcal(
    raw: unknown,
): { ok: true; value: number } | { ok: false; error: string } {
    // Strings only in plain "312" / "312.4" form. A locale-formatted "312,4"
    // or "1.234" (thousands dot) would otherwise be rejected or, worse,
    // silently read as 1 kcal — refuse anything that is not unambiguous.
    if (typeof raw === "string" && !/^\s*\d+(\.\d+)?\s*$/.test(raw))
        return {
            ok: false,
            error: `active_kcal "${raw.slice(0, 20)}" is not a plain number — send digits with an optional "." decimal (e.g. 312 or 312.4), no thousands separators.`,
        };
    const n = typeof raw === "string" ? Number(raw.trim()) : raw;
    if (typeof n !== "number" || !Number.isFinite(n))
        return { ok: false, error: "active_kcal must be a number." };
    if (n < 0) return { ok: false, error: "active_kcal cannot be negative." };
    if (n > MAX_ACTIVE_KCAL)
        return {
            ok: false,
            error: `active_kcal ${Math.round(n)} is above the ${MAX_ACTIVE_KCAL} kcal/day ceiling — check it is kilocalories, not kilojoules.`,
        };
    return { ok: true, value: Math.round(n) };
}

/** "2,100 kcal (1,800 + 300 active)" — or just "1,800 kcal". */
export function describeCalorieGoal(adj: ActivityAdjustment): string | null {
    const cal = adj.goals?.daily_calories;
    if (cal == null || !(cal > 0)) return null;
    const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
    if (adj.base && adj.activeKcal)
        return `${fmt(cal)} kcal (${fmt(adj.base.daily_calories!)} + ${fmt(adj.activeKcal)} active)`;
    return `${fmt(cal)} kcal`;
}

/** A real YYYY-MM-DD calendar date (rejects 2026-02-30). */
export function isLocalDate(s: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
