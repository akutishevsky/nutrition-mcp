import { test, expect, describe } from "bun:test";
import {
    adjustGoalsForActivity,
    checkActiveKcal,
    describeCalorieGoal,
    MAX_ACTIVE_KCAL,
} from "./activity.js";
import type { NutritionGoals } from "./supabase.js";

const goals = (over: Partial<NutritionGoals> = {}): NutritionGoals => ({
    user_id: "u1",
    daily_calories: 1800,
    daily_protein_g: 135,
    daily_carbs_g: 180,
    daily_fat_g: 60,
    daily_fiber_g: 30,
    daily_sugar_g: 50,
    daily_alcohol_g: null,
    daily_caffeine_mg: 400,
    daily_water_ml: 2500,
    target_weight_g: null,
    calorie_goal_mode: null,
    weight_rate_g_per_day: null,
    target_date: null,
    updated_at: "2026-11-01T00:00:00Z",
    ...over,
});

describe("adjustGoalsForActivity", () => {
    test("adds all active kcal and scales macros proportionally", () => {
        const adj = adjustGoalsForActivity(goals(), 300);
        expect(adj.goals!.daily_calories).toBe(2100);
        expect(adj.factor).toBeCloseTo(2100 / 1800);
        expect(adj.goals!.daily_protein_g).toBe(157.5);
        expect(adj.goals!.daily_carbs_g).toBe(210);
        expect(adj.goals!.daily_fat_g).toBe(70);
        expect(adj.activeKcal).toBe(300);
        expect(adj.base!.daily_calories).toBe(1800);
    });

    test("leaves non-energy targets alone", () => {
        const adj = adjustGoalsForActivity(goals(), 300);
        expect(adj.goals!.daily_fiber_g).toBe(30);
        expect(adj.goals!.daily_sugar_g).toBe(50);
        expect(adj.goals!.daily_caffeine_mg).toBe(400);
        expect(adj.goals!.daily_water_ml).toBe(2500);
    });

    test("unset macros stay unset", () => {
        const adj = adjustGoalsForActivity(goals({ daily_fat_g: null }), 300);
        expect(adj.goals!.daily_fat_g).toBeNull();
    });

    test("no activity, zero activity, or no goals → unchanged", () => {
        for (const a of [null, undefined, 0]) {
            const adj = adjustGoalsForActivity(goals(), a);
            expect(adj.goals!.daily_calories).toBe(1800);
            expect(adj.base).toBeNull();
            expect(adj.activeKcal).toBeNull();
            expect(adj.factor).toBe(1);
        }
        expect(adjustGoalsForActivity(null, 300).goals).toBeNull();
    });

    test("no calorie baseline → unchanged rather than dividing by zero", () => {
        for (const c of [null, 0]) {
            const adj = adjustGoalsForActivity(
                goals({ daily_calories: c }),
                300,
            );
            expect(adj.goals!.daily_protein_g).toBe(135);
            expect(adj.base).toBeNull();
        }
    });

    test("does not mutate the stored goals", () => {
        const g = goals();
        adjustGoalsForActivity(g, 300);
        expect(g.daily_calories).toBe(1800);
        expect(g.daily_protein_g).toBe(135);
    });
});

describe("checkActiveKcal", () => {
    test("accepts and rounds numbers and numeric strings", () => {
        expect(checkActiveKcal(312.4)).toEqual({ ok: true, value: 312 });
        expect(checkActiveKcal(" 250 ")).toEqual({ ok: true, value: 250 });
        expect(checkActiveKcal(0)).toEqual({ ok: true, value: 0 });
    });

    test("rejects junk, negatives and implausible values", () => {
        expect(checkActiveKcal("abc").ok).toBe(false);
        expect(checkActiveKcal(undefined).ok).toBe(false);
        expect(checkActiveKcal(-5).ok).toBe(false);
        expect(checkActiveKcal(MAX_ACTIVE_KCAL + 1).ok).toBe(false);
        expect(checkActiveKcal(MAX_ACTIVE_KCAL).ok).toBe(true);
    });

    test("refuses locale-formatted strings instead of misreading them", () => {
        expect(checkActiveKcal("312,4").ok).toBe(false);
        expect(checkActiveKcal("1.234.5").ok).toBe(false);
        expect(checkActiveKcal("1,234").ok).toBe(false);
        expect(checkActiveKcal("-5").ok).toBe(false);
    });
});

test("describeCalorieGoal", () => {
    expect(describeCalorieGoal(adjustGoalsForActivity(goals(), 300))).toBe(
        "2,100 kcal (1,800 + 300 active)",
    );
    expect(describeCalorieGoal(adjustGoalsForActivity(goals(), 0))).toBe(
        "1,800 kcal",
    );
    expect(
        describeCalorieGoal(
            adjustGoalsForActivity(goals({ daily_calories: null }), 300),
        ),
    ).toBeNull();
});

test("isLocalDate", async () => {
    const { isLocalDate } = await import("./activity.js");
    expect(isLocalDate("2026-11-09")).toBe(true);
    expect(isLocalDate("2026-02-30")).toBe(false);
    expect(isLocalDate("2026-11-9")).toBe(false);
    expect(isLocalDate("today")).toBe(false);
});
