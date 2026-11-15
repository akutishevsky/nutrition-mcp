import { test, expect, describe } from "bun:test";
import {
    buildDashboardDays,
    buildEstimateVsScale,
    buildLast7,
    buildWeightStats,
    granularityFor,
    groupDays,
} from "./dashboard-stats.js";
import { energyWindow } from "./calibration.js";
import { buildDailyBuckets } from "./insights.js";
import type { Meal, NutritionGoals } from "./supabase.js";

const goals = (over: Partial<NutritionGoals> = {}): NutritionGoals => ({
    user_id: "u1",
    daily_calories: 1800,
    daily_protein_g: 120,
    daily_carbs_g: 185,
    daily_fat_g: 65,
    daily_fiber_g: 30,
    daily_sugar_g: 50,
    daily_alcohol_g: null,
    daily_caffeine_mg: null,
    daily_water_ml: 3000,
    target_weight_g: 75_000,
    calorie_goal_mode: null,
    weight_rate_g_per_day: null,
    target_date: null,
    updated_at: "2026-11-01T00:00:00Z",
    ...over,
});

const meal = (logged_at: string, calories: number): Meal =>
    ({
        id: logged_at,
        user_id: "u1",
        description: "x",
        meal_type: "lunch",
        calories,
        protein_g: 10,
        carbs_g: 10,
        fat_g: 10,
        fiber_g: 1,
        sugar_g: 1,
        alcohol_g: null,
        caffeine_mg: null,
        notes: null,
        logged_at,
        created_at: logged_at,
        idempotency_key: null,
    }) as Meal;

const body = {
    height_cm: 178,
    birth_date: "1996-01-01",
    sex: "male" as const,
};

describe("buildDashboardDays", () => {
    const buckets = buildDailyBuckets(
        [meal("2026-11-08T12:00:00Z", 2000)],
        [],
        "2026-11-08",
        "2026-11-09",
        "UTC",
    );

    test("today's goal includes its active kcal (1800 + 5 = 1805)", () => {
        const days = buildDashboardDays(
            buckets,
            new Map([["2026-11-09", 5]]),
            goals(),
            body,
            [{ date: "2026-11-01", weight_g: 80_000 }],
            "2026-11-09",
        );
        const today = days[1]!;
        expect(today.goal_calories).toBe(1805);
        expect(today.active_kcal).toBe(5);
        expect(today.in_progress).toBe(true);
        expect(days[0]!.goal_calories).toBe(1800);
        expect(days[0]!.active_kcal).toBeNull();
    });

    test("burn and balance: BMR + active + 10% TEF, ÷ 6.0 kcal/g", () => {
        const days = buildDashboardDays(
            buckets,
            new Map([["2026-11-08", 300]]),
            goals(),
            body,
            [{ date: "2026-11-01", weight_g: 80_000 }],
            "2026-11-09",
        );
        // BMR 1768 (80 kg, 178 cm, 30 y, male) + 300 active + 10% of the
        // 2000 eaten (TEF) = 2268.
        expect(days[0]!.bmr_kcal).toBe(1768);
        expect(days[0]!.burn_kcal).toBe(2268);
        // 2000 eaten − 2268 burned = −268 kcal → −45 g at 6 kcal/g.
        expect(days[0]!.balance_g).toBe(-45);
    });

    test("no meals → balance unknown, not a full day's deficit", () => {
        const days = buildDashboardDays(
            buckets,
            new Map(),
            goals(),
            body,
            [{ date: "2026-11-01", weight_g: 80_000 }],
            "2026-11-09",
        );
        expect(days[1]!.mealCount).toBe(0);
        expect(days[1]!.burn_kcal).not.toBeNull();
        expect(days[1]!.balance_g).toBeNull();
    });

    test("missing body details → no burn, no balance, goals still shown", () => {
        const days = buildDashboardDays(
            buckets,
            new Map(),
            goals(),
            { height_cm: null, birth_date: null, sex: null },
            [{ date: "2026-11-01", weight_g: 80_000 }],
            "2026-11-09",
        );
        expect(days[0]!.burn_kcal).toBeNull();
        expect(days[0]!.balance_g).toBeNull();
        expect(days[0]!.goal_calories).toBe(1800);
    });
});

describe("buildWeightStats", () => {
    const weighIns = [
        { date: "2026-10-01", weight_g: 82_000 },
        { date: "2026-10-15", weight_g: 81_000 },
        { date: "2026-10-29", weight_g: 80_000 },
    ];

    test("BMI, healthy range, rate, target and projection", () => {
        const s = buildWeightStats(
            weighIns,
            weighIns[2]!,
            body,
            goals(),
            200,
            "2026-11-09",
        );
        expect(s.bmi).toBe(25.2);
        expect(s.bmi_category).toBe("overweight");
        expect(s.healthy_min_g).toBe(58_615);
        expect(s.healthy_max_g).toBe(78_893);
        expect(s.change_g).toBe(-2_000);
        expect(s.weekly_rate_g).toBe(-500);
        expect(s.to_target_g).toBe(-5_000);
        // 5 kg at 500 g/week = 70 days after Oct 29.
        expect(s.projected_date).toBe("2027-01-07");
        expect(s.bmr_kcal).toBe(1768);
        // Resting 1768 + 200 active.
        expect(s.burn_today_kcal).toBe(1968);
        expect(s.missing).toEqual([]);
    });

    test("names exactly what is missing", () => {
        const s = buildWeightStats(
            [],
            null,
            { height_cm: null, birth_date: "1996-01-01", sex: null },
            goals(),
            null,
            "2026-11-09",
        );
        expect(s.missing).toEqual(["height", "sex", "weight"]);
        expect(s.bmi).toBeNull();
        expect(s.bmr_kcal).toBeNull();
        expect(s.projected_date).toBeNull();
    });
});

describe("buildEstimateVsScale", () => {
    const day = (i: number, counted = true) => {
        const d = new Date(Date.parse("2026-10-01T00:00:00Z") + i * 86_400_000)
            .toISOString()
            .slice(0, 10);
        return {
            date: d,
            calories: 2000,
            active_kcal: 300,
            bmr_kcal: 1700,
            tef_kcal: 200,
            counted,
        };
    };
    const iso = (i: number) => day(i).date;

    test("is the calibration window: same offset, trend change, days", () => {
        const days = Array.from({ length: 28 }, (_, i) => day(i));
        const weighIns = Array.from({ length: 8 }, (_, k) => ({
            date: iso(k * 3),
            weight_g: 80_000 - k * 60,
        }));
        const w = energyWindow(days, weighIns, iso(0), iso(27));
        const s = buildEstimateVsScale(w);
        expect(s.status).toBe("ok");
        expect(s.calibrated).toBe(true);
        expect(s.implied_kcal_per_day).toBe(w.offset_kcal);
        expect(s.actual_g).toBe(w.trend_change_g);
        expect(s.covered_days).toBe(21);
        expect(s.weighin_days).toBe(8);
    });

    test("no weigh-ins / no counted days map to the card's empty states", () => {
        const none = buildEstimateVsScale(
            energyWindow([], [], iso(0), iso(27)),
        );
        expect(none.status).toBe("no_weighins");
        const uncounted = buildEstimateVsScale(
            energyWindow(
                [day(1, false)],
                [
                    { date: iso(0), weight_g: 80_000 },
                    { date: iso(5), weight_g: 80_000 },
                ],
                iso(0),
                iso(27),
            ),
        );
        expect(uncounted.status).toBe("no_estimate");
        expect(uncounted.implied_kcal_per_day).toBeNull();
        expect(Object.keys(uncounted).sort()).toEqual(Object.keys(none).sort());
    });
});

describe("buildLast7", () => {
    // Nov 1 … Nov 9 (today, in progress). `balances` per day; burn present
    // unless noBurn.
    const days = (balances: (number | null)[], noBurn = false) =>
        balances.map((balance_g, i) => ({
            date: `2026-11-0${i + 1}`,
            balance_g,
            // 10 kcal per gram here, so the kcal sums are easy to read.
            balance_kcal: balance_g == null ? null : balance_g * 10,
            burn_kcal: noBurn ? null : 2000,
            in_progress: i === balances.length - 1,
            counts_in_calibration: true,
        }));

    test("a day the calibration leaves out (partly logged) is not counted", () => {
        const rows = days([-10, -20, -30, -40, -50, -60, -70, -80, -500]);
        rows[3]!.counts_in_calibration = false; // Nov 4: looks partial
        const r = buildLast7(rows, [], "2026-11-09");
        // Nov 2 … Nov 8 is 7 complete days; Nov 4 is left out → 6.
        expect(r.est_days).toBe(6);
        expect(r.est_net_g).toBe(-310);
    });

    test("scale change in grams and the net estimate over the 7 complete days", () => {
        // Window Nov 2 … Nov 9; complete days Nov 2 … Nov 8.
        const r = buildLast7(
            days([-999, -10, -20, null, -30, -40, -50, -60, -500]),
            [
                { date: "2026-10-30", weight_g: 85_000 }, // before the window
                { date: "2026-11-02", weight_g: 84_000 },
                { date: "2026-11-09", weight_g: 83_650 },
            ],
            "2026-11-09",
        );
        expect(r.from).toBe("2026-11-02");
        expect(r.to).toBe("2026-11-09");
        expect(r.weight_change_g).toBe(-350);
        expect(r.weight_first_date).toBe("2026-11-02");
        // Nov 1 is outside, Nov 5 unlogged, today in progress → 6 days.
        expect(r.est_days).toBe(6);
        expect(r.est_net_g).toBe(-210);
        // Same 6 days in kcal: the net, and the average per day.
        expect(r.est_net_kcal).toBe(-2100);
        expect(r.est_avg_kcal).toBe(-350);
        expect(r.has_burn).toBe(true);
    });

    test("one weigh-in (or two on one day) → no scale figure", () => {
        for (const w of [
            [{ date: "2026-11-05", weight_g: 84_000 }],
            [
                { date: "2026-11-05", weight_g: 84_000 },
                { date: "2026-11-05", weight_g: 83_800 },
            ],
        ]) {
            const r = buildLast7(
                days([0, 0, 0, 0, 0, 0, 0, 0, 0]),
                w,
                "2026-11-09",
            );
            expect(r.weight_change_g).toBeNull();
            expect(r.weight_first_date).toBeNull();
        }
    });

    test("no body details → no estimate, and has_burn says why", () => {
        const r = buildLast7(
            days([null, null, null, null, null, null, null, null, null], true),
            [],
            "2026-11-09",
        );
        expect(r.est_net_g).toBeNull();
        expect(r.est_days).toBe(0);
        expect(r.has_burn).toBe(false);
        expect(r.est_net_kcal).toBeNull();
        expect(r.est_avg_kcal).toBeNull();
    });
});

describe("balance_kcal on each day", () => {
    test("eaten − burn in kcal, null exactly when balance_g is", () => {
        const buckets = buildDailyBuckets(
            [meal("2026-11-08T12:00:00Z", 2000)],
            [],
            "2026-11-08",
            "2026-11-09",
            "UTC",
        );
        const days = buildDashboardDays(
            buckets,
            new Map([["2026-11-08", 300]]),
            goals(),
            body,
            [{ date: "2026-11-01", weight_g: 80_000 }],
            "2026-11-09",
        );
        // 2000 eaten − (1768 + 300 + 200 TEF) = −268 kcal → −45 g.
        expect(days[0]!.balance_kcal).toBe(-268);
        expect(days[0]!.balance_g).toBe(-45);
        // Nov 9: nothing eaten → both unknown.
        expect(days[1]!.balance_kcal).toBeNull();
        expect(days[1]!.balance_g).toBeNull();
    });
});

describe("groupDays", () => {
    // A row per day from `start`, the last one today (in progress).
    // `eaten` null = an unlogged day.
    const row = (date: string, eaten: number | null, inProgress = false) => ({
        date,
        calories: eaten ?? 0,
        protein_g: eaten == null ? 0 : 100,
        carbs_g: eaten == null ? 0 : 200,
        fat_g: eaten == null ? 0 : 60,
        fiber_g: eaten == null ? 0 : 25,
        mealCount: eaten == null ? 0 : 3,
        goal_calories: 2000,
        bmr_kcal: 1700,
        active_kcal: 300,
        burn_kcal: 2000,
        balance_g:
            eaten == null || inProgress
                ? eaten == null
                    ? null
                    : -100
                : Math.round((eaten - 2000) / 7.7),
        balance_kcal: eaten == null ? null : eaten - 2000,
        in_progress: inProgress,
    });
    const range = (start: string, eats: (number | null)[]) =>
        eats.map((e, i) => {
            const d = new Date(`${start}T00:00:00Z`);
            d.setUTCDate(d.getUTCDate() + i);
            return row(d.toISOString().slice(0, 10), e, i === eats.length - 1);
        });

    test("granularity follows the range: 7 → day, 30 → week, 365 → month", () => {
        expect(granularityFor(7)).toBe("day");
        expect(granularityFor(30)).toBe("week");
        expect(granularityFor(365)).toBe("month");
    });

    test("daily: one bar per day, today included as it stands", () => {
        const b = groupDays(
            range("2026-11-03", [1800, null, 2200, 1500, 1900, 2100, 900]),
            "day",
        );
        expect(b).toHaveLength(7);
        expect(b[1]!.calories).toBeNull(); // unlogged: no bar, not zero
        expect(b[1]!.goal_calories).toBe(2000); // the goal line stays
        expect(b[6]!.calories).toBe(900);
        expect(b[6]!.partial).toBe(true);
        // Today's balance is never counted while it runs.
        expect(b[6]!.balance_g_sum).toBeNull();
    });

    test("weekly: 4 blocks of 7 ending today, averages per logged day", () => {
        // 30 days Oct 12 … Nov 10; weeks Oct 14–20, 21–27, Oct 28–Nov 3, Nov 4–10.
        const eats: (number | null)[] = Array(30).fill(2100);
        eats[8] = null; // Oct 20 unlogged, inside week 1
        for (let i = 9; i < 16; i++) eats[i] = null; // Oct 21–27: an empty week
        eats[29] = 500; // today, in progress
        const b = groupDays(range("2026-10-12", eats), "week");
        expect(b.map((x) => [x.start, x.end])).toEqual([
            ["2026-10-14", "2026-10-20"],
            ["2026-10-21", "2026-10-27"],
            ["2026-10-28", "2026-11-03"],
            ["2026-11-04", "2026-11-10"],
        ]);
        // Week 1: 6 of 7 days logged; the unlogged day does not drag the avg.
        expect(b[0]!.days).toBe(7);
        expect(b[0]!.logged_days).toBe(6);
        expect(b[0]!.calories).toBe(2100);
        // The sum over the logged complete days, and the per-day average.
        expect(b[0]!.balance_kcal_sum).toBe(600);
        expect(b[0]!.balance_kcal).toBe(100);
        expect(b[0]!.balance_days).toBe(6);
        // An empty week draws no bar but keeps its reference lines.
        expect(b[1]!.logged_days).toBe(0);
        expect(b[1]!.calories).toBeNull();
        expect(b[1]!.balance_g_sum).toBeNull();
        expect(b[1]!.burn_kcal).toBe(2000);
        expect(b[1]!.bmr_kcal! + b[1]!.active_kcal!).toBe(b[1]!.burn_kcal!);
        // The current week: today's 500 kcal does not drag the average.
        expect(b[3]!.partial).toBe(true);
        expect(b[3]!.logged_days).toBe(6);
        expect(b[3]!.calories).toBe(2100);
    });

    test("monthly: the last 12 calendar months, the current one partial", () => {
        // 365 days ending 2026-11-10 start 2025-11-11: Dec 2025 … Nov 2026.
        const eats: (number | null)[] = Array(365).fill(2000);
        const b = groupDays(range("2025-11-11", eats), "month");
        expect(b).toHaveLength(12);
        expect(b[0]!.start).toBe("2025-12-01");
        expect(b[0]!.end).toBe("2025-12-31");
        expect(b[0]!.days).toBe(31);
        expect(b[11]!.start).toBe("2026-11-01");
        expect(b[11]!.end).toBe("2026-11-10");
        expect(b[11]!.partial).toBe(true);
        expect(b[10]!.partial).toBe(false);
        // February 2026 has 28 days.
        expect(b[2]!.days).toBe(28);
    });

    test("no rows → no bars", () => {
        expect(groupDays([], "week")).toEqual([]);
    });
});

describe("calorie goal default and editor", () => {
    const blank = (cal: number | null): NutritionGoals => ({
        user_id: "u",
        daily_calories: cal,
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
    });

    test("a stored goal wins over the burn default", async () => {
        const { withBurnDefault } = await import("./dashboard-stats.js");
        const g = blank(1800);
        expect(withBurnDefault(g, 1740)).toBe(g);
    });

    test("no goal defaults the baseline to break-even (resting ÷ 0.9 for TEF); no body data leaves it unset", async () => {
        const { withBurnDefault } = await import("./dashboard-stats.js");
        expect(withBurnDefault(null, 1739.6)?.daily_calories).toBe(1933);
        expect(withBurnDefault(blank(null), 1740)?.daily_calories).toBe(1933);
        expect(withBurnDefault(blank(0), 1740)?.daily_calories).toBe(1933);
        expect(withBurnDefault(null, null)).toBeNull();
    });

    test("checkCalorieGoal accepts a number or null and rejects the rest", async () => {
        const { checkCalorieGoal } = await import("./dashboard.js");
        expect(checkCalorieGoal({ calories: 1800 })).toEqual({
            ok: true,
            value: 1800,
        });
        expect(checkCalorieGoal({ calories: "2000" })).toEqual({
            ok: true,
            value: 2000,
        });
        expect(checkCalorieGoal({ calories: null })).toEqual({
            ok: true,
            value: null,
        });
        expect(checkCalorieGoal({}).ok).toBe(false);
        expect(checkCalorieGoal({ calories: 100 }).ok).toBe(false);
        expect(checkCalorieGoal({ calories: 99999 }).ok).toBe(false);
        expect(checkCalorieGoal({ calories: "abc" }).ok).toBe(false);
    });
});
