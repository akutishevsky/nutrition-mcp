import { describe, expect, test } from "bun:test";
import { TEF_FRACTION, breakEvenKcal, type WeighIn } from "./body.js";
import { buildDashboardPayload } from "./dashboard.js";
import { buildScenario, previewInputs } from "./dashboard-fixture.js";
import type { NutritionGoals } from "./supabase.js";
import type { EnergyDay } from "./calibration.js";
import {
    goalFlags,
    goalKcal,
    gramsPerDayToRate,
    planRate,
    rateToGramsPerDay,
    resolveGoalMode,
    tefRatio,
    trendWeightToday,
    type FlagInput,
    type RatePlan,
    type TrendWeight,
} from "./goal-plan.js";

const iso = (n: number) =>
    new Date(Date.UTC(2026, 9, 1 + n)).toISOString().slice(0, 10);

/** A straight line of daily weigh-ins ending on day `last`. */
function line(last: number, count: number, startG: number, gPerDay: number) {
    const out: WeighIn[] = [];
    for (let i = 0; i < count; i++) {
        const d = last - count + 1 + i;
        out.push({ date: iso(d), weight_g: startG + gPerDay * i });
    }
    return out;
}

describe("goalKcal", () => {
    test("rate 0 at the default share is breakEvenKcal", () => {
        expect(goalKcal(1700, 300, 0)).toBe(breakEvenKcal(1700, 300));
        expect(goalKcal(1700, null, 0, 6, TEF_FRACTION)).toBe(
            breakEvenKcal(1700, null),
        );
    });

    test("-0.5 kg/week at f = 0.1: balance deficit 429, intake drops 476", () => {
        // -500 g / 7 d × 6 kcal/g = -428.6 kcal/day of balance; the gross-up
        // ÷0.9 turns it into -476 kcal of intake (eating less also digests less).
        const rate = rateToGramsPerDay(-0.5, "kg", "week");
        const even = goalKcal(1700, 300, 0);
        const plan = goalKcal(1700, 300, rate);
        expect(even - plan).toBe(476);
    });

    test("a gain goal raises the intake", () => {
        expect(goalKcal(1700, 0, 50)).toBeGreaterThan(goalKcal(1700, 0, 0));
    });

    test("k scales the delta", () => {
        const r = -70;
        expect(goalKcal(1700, 0, r, 7.7)).toBeLessThan(goalKcal(1700, 0, r, 6));
    });
});

describe("rate conversions", () => {
    test("week / month / year to g/day", () => {
        expect(rateToGramsPerDay(-0.7, "kg", "week")).toBeCloseTo(-100, 6);
        expect(rateToGramsPerDay(-1, "kg", "month")).toBeCloseTo(
            -1000 / 30.4375,
            6,
        );
        expect(rateToGramsPerDay(-12, "kg", "year")).toBeCloseTo(
            -12000 / 365.25,
            6,
        );
    });

    test("lb converts through 453.59237 g", () => {
        expect(rateToGramsPerDay(-1, "lb", "week")).toBeCloseTo(
            -453.59237 / 7,
            6,
        );
    });

    test("round trip to the display unit", () => {
        const g = rateToGramsPerDay(-1.5, "lb", "month");
        expect(gramsPerDayToRate(g, "lb", "month")).toBeCloseTo(-1.5, 9);
    });
});

describe("resolveGoalMode", () => {
    test("legacy rows follow their calorie number", () => {
        expect(resolveGoalMode(null)).toBe("burn");
        expect(resolveGoalMode({ daily_calories: null })).toBe("burn");
        expect(resolveGoalMode({ daily_calories: 0 })).toBe("burn");
        expect(resolveGoalMode({ daily_calories: 2000 })).toBe("fixed");
    });

    test("a stored mode wins", () => {
        expect(
            resolveGoalMode({
                calorie_goal_mode: "rate",
                daily_calories: 2000,
            }),
        ).toBe("rate");
    });
});

describe("tefRatio", () => {
    const day = (cal: number, tef: number, counted = true): EnergyDay => ({
        date: iso(0),
        calories: cal,
        active_kcal: null,
        bmr_kcal: 1700,
        tef_kcal: tef,
        counted,
    });

    test("too few counted days falls back to the default share", () => {
        expect(tefRatio([day(2000, 300)])).toBe(TEF_FRACTION);
    });

    test("uses the user's own intake-weighted share", () => {
        const days = Array.from({ length: 10 }, () => day(2000, 300));
        expect(tefRatio(days)).toBeCloseTo(0.15, 9);
    });

    test("uncounted days are ignored and the share is bounded", () => {
        const days = [
            ...Array.from({ length: 7 }, () => day(2000, 2000)),
            day(2000, 0, false),
        ];
        expect(tefRatio(days)).toBe(0.2);
    });
});

describe("trendWeightToday", () => {
    test("extrapolates a clean line to today", () => {
        // 80 kg falling 50 g/day; the last weigh-in is today.
        const w = line(30, 30, 80_000, -50);
        const t = trendWeightToday(w, iso(30), 42)!;
        expect(t.source).toBe("trend");
        expect(t.weight_g).toBe(80_000 - 50 * 29);
    });

    test("a water-heavy latest reading barely moves the trend", () => {
        const w = line(30, 30, 80_000, -50);
        w[w.length - 1] = {
            ...w[w.length - 1]!,
            weight_g: 80_000 - 50 * 29 + 1500,
        };
        const t = trendWeightToday(w, iso(30), 42)!;
        expect(Math.abs(t.weight_g - (80_000 - 50 * 29))).toBeLessThan(400);
    });

    test("extrapolation stops after a week without a weigh-in", () => {
        const w = line(20, 20, 80_000, -50);
        const t = trendWeightToday(w, iso(40), 42)!;
        expect(t.weight_g).toBe(80_000 - 50 * 19 - 50 * 7);
    });

    test("few weigh-ins fall back to the recent mean, then the latest", () => {
        const two = [
            { date: iso(28), weight_g: 80_000 },
            { date: iso(30), weight_g: 81_000 },
        ];
        expect(trendWeightToday(two, iso(30), 42)).toMatchObject({
            source: "recent_mean",
            weight_g: 80_500,
        });
        expect(
            trendWeightToday(
                [{ date: iso(10), weight_g: 79_000 }],
                iso(30),
                42,
            ),
        ).toMatchObject({ source: "latest", weight_g: 79_000 });
        expect(trendWeightToday([], iso(30), 42)).toBeNull();
    });

    test("the lookback window is a parameter", () => {
        // 60 days: flat for 40, then falling. A 21-day window sees only the fall.
        const flat = line(39, 40, 90_000, 0);
        const fall = line(59, 20, 90_000, -100);
        const w = [...flat, ...fall];
        const short = trendWeightToday(w, iso(59), 21)!;
        const long = trendWeightToday(w, iso(59), 56)!;
        expect(short.weight_g).toBeLessThan(long.weight_g);
    });
});

describe("planRate", () => {
    const trend = (g: number): TrendWeight => ({
        weight_g: g,
        source: "trend",
        window_days: 42,
        weighin_days: 20,
    });
    const date = (target: number, on: string) => ({
        mode: "date" as const,
        rate_g_per_day: null,
        target_weight_g: target,
        target_date: on,
    });

    test("fixed and burn carry no rate", () => {
        for (const mode of ["fixed", "burn"] as const) {
            expect(
                planRate(
                    {
                        mode,
                        rate_g_per_day: -50,
                        target_weight_g: null,
                        target_date: null,
                    },
                    trend(80_000),
                    iso(0),
                ).rate_g_per_day,
            ).toBe(0);
        }
    });

    test("a rate goal keeps its stored rate", () => {
        expect(
            planRate(
                {
                    mode: "rate",
                    rate_g_per_day: -71.4,
                    target_weight_g: null,
                    target_date: null,
                },
                null,
                iso(0),
            ).rate_g_per_day,
        ).toBe(-71.4);
    });

    test("a date goal spreads the remaining distance over the days left", () => {
        // 80 kg -> 76 kg in 40 days: -100 g/day.
        const p = planRate(date(76_000, iso(40)), trend(80_000), iso(0));
        expect(p.rate_g_per_day).toBeCloseTo(-100, 9);
        expect(p.days_left).toBe(40);
        expect(p.reached).toBe(false);
    });

    test("the rate re-derives as the trend moves", () => {
        const a = planRate(date(76_000, iso(40)), trend(80_000), iso(0));
        const b = planRate(date(76_000, iso(40)), trend(79_000), iso(10));
        expect(a.rate_g_per_day).toBeCloseTo(-100, 9);
        expect(b.rate_g_per_day).toBeCloseTo(-3000 / 30, 9);
    });

    test("reached, or past the date, falls back to break-even", () => {
        expect(
            planRate(date(80_000, iso(40)), trend(80_300), iso(0)),
        ).toMatchObject({ rate_g_per_day: 0, reached: true });
        expect(
            planRate(date(76_000, iso(0)), trend(80_000), iso(5)),
        ).toMatchObject({ rate_g_per_day: 0, reached: true });
    });

    test("a gain target gives a positive rate", () => {
        expect(
            planRate(date(84_000, iso(40)), trend(80_000), iso(0))
                .rate_g_per_day,
        ).toBeCloseTo(100, 9);
    });

    test("no trend yet: no rate rather than a guess", () => {
        expect(
            planRate(date(76_000, iso(40)), null, iso(0)).rate_g_per_day,
        ).toBe(0);
    });
});

describe("goalFlags", () => {
    const plan = (over: Partial<RatePlan> = {}): RatePlan => ({
        mode: "rate",
        rate_g_per_day: -70,
        target_weight_g: null,
        target_date: null,
        days_left: null,
        reached: false,
        ...over,
    });
    const input = (over: Partial<FlagInput> = {}): FlagInput => ({
        plan: plan(),
        trend: {
            weight_g: 80_000,
            source: "trend",
            window_days: 42,
            weighin_days: 20,
        },
        restingKcal: 1700,
        activeKcal: 300,
        goalKcal: 1756, // (1700 + 300 - 420) / 0.9
        kcalPerGram: 6,
        sex: "male",
        age: 35,
        heightCm: 180,
        calibrated: true,
        today: iso(0),
        ...over,
    });
    const codes = (i: FlagInput) => goalFlags(i).map((f) => f.code);

    test("a moderate plan raises nothing", () => {
        expect(goalFlags(input())).toEqual([]);
    });

    test("fixed and burn modes are never flagged", () => {
        expect(
            goalFlags(
                input({ plan: plan({ mode: "fixed", rate_g_per_day: -400 }) }),
            ),
        ).toEqual([]);
    });

    test("fast loss: over 1% of weight per week", () => {
        // 80 kg: 800 g/week is the line; -120 g/day = 840 g/week.
        expect(
            codes(input({ plan: plan({ rate_g_per_day: -120 }) })),
        ).toContain("fast_loss");
        expect(
            codes(input({ plan: plan({ rate_g_per_day: -110 }) })),
        ).not.toContain("fast_loss");
    });

    test("fast gain: over 0.5% of weight per week", () => {
        expect(codes(input({ plan: plan({ rate_g_per_day: 70 }) }))).toContain(
            "fast_gain",
        );
        expect(
            codes(input({ plan: plan({ rate_g_per_day: 50 }) })),
        ).not.toContain("fast_gain");
    });

    test("big deficit: over 25% of burn or 1000 kcal", () => {
        // -70 g/d × 6 = 420 vs 25% of 2000 = 500: fine; -90 -> 540: flagged.
        expect(codes(input({ plan: plan({ rate_g_per_day: -90 }) }))).toContain(
            "big_deficit",
        );
        expect(codes(input())).not.toContain("big_deficit");
    });

    test("low intake: below max(resting, 1200/1500)", () => {
        expect(codes(input())).not.toContain("low_intake");
        expect(codes(input({ goalKcal: 1650 }))).toContain("low_intake");
        expect(
            codes(input({ goalKcal: 1300, sex: "female", restingKcal: 1100 })),
        ).not.toContain("low_intake");
    });

    test("underweight target and minors", () => {
        // 180 cm: BMI 18.5 at 59.9 kg.
        expect(
            codes(input({ plan: plan({ target_weight_g: 58_000 }) })),
        ).toContain("underweight_target");
        expect(codes(input({ age: 16 }))).toContain("minor_loss");
    });

    test("date windows", () => {
        const d = (days_left: number) =>
            input({ plan: plan({ mode: "date", days_left }) });
        expect(codes(d(10))).toContain("date_soon");
        expect(codes(d(0))).toContain("date_passed");
        expect(codes(d(800))).toContain("date_far");
        expect(codes(d(60))).not.toContain("date_soon");
    });

    test("uncertainty is info, not red", () => {
        const flags = goalFlags(input({ calibrated: false, trend: null }));
        expect(flags.map((f) => f.code)).toEqual(["formula_basis", "no_trend"]);
        expect(flags.every((f) => f.level === "info")).toBe(true);
    });
});

describe("derived goals in the dashboard payload", () => {
    const TODAY = "2026-12-01";
    const fx = buildScenario("offset", TODAY);
    const payloadFor = (goals: Partial<NutritionGoals> | null) =>
        buildDashboardPayload(
            previewInputs(
                {
                    ...fx,
                    goals: goals
                        ? {
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
                              ...goals,
                          }
                        : null,
                },
                30,
                TODAY,
            ),
        );

    test("a rate goal lowers every day's goal by the grossed-up deficit", () => {
        const burn = payloadFor(null);
        const rate = payloadFor({
            calorie_goal_mode: "rate",
            weight_rate_g_per_day: rateToGramsPerDay(-0.5, "kg", "week"),
        });
        const f = rate.goalPlan.tef_share;
        const want = Math.round(((500 / 7) * 6) / (1 - f));
        for (const r of rate.daily.filter((r) => r.bmr_kcal != null)) {
            const b = burn.daily.find((d) => d.date === r.date)!;
            expect(
                Math.abs(b.goal_calories! - r.goal_calories! - want),
            ).toBeLessThanOrEqual(1);
        }
        expect(rate.goalPlan.mode).toBe("rate");
        expect(rate.goalPlan.goal_kcal).toBe(
            rate.daily.find((d) => d.date === TODAY)!.goal_calories,
        );
    });

    test("a date goal derives today's rate from the trend weight", () => {
        const probe = payloadFor({ calorie_goal_mode: "date" });
        const trend = probe.goalPlan.trend!;
        const p = payloadFor({
            calorie_goal_mode: "date",
            target_weight_g: trend.weight_g - 4000,
            target_date: "2027-01-10", // 40 days out
        });
        expect(p.goalPlan.days_left).toBe(40);
        expect(p.goalPlan.rate_g_per_day).toBeCloseTo(-100, 6);
        expect(p.goalPlan.trend!.source).toBe("trend");
    });

    test("a fixed goal is untouched and raises no plan flags", () => {
        const p = payloadFor({ daily_calories: 2100 });
        expect(p.goalPlan.mode).toBe("fixed");
        expect(p.goalPlan.flags).toEqual([]);
        expect(
            p.daily.every(
                (r) => r.goal_calories === 2100 + (r.active_kcal ?? 0),
            ),
        ).toBe(true);
    });

    test("an aggressive rate is flagged but still applied", () => {
        const p = payloadFor({
            calorie_goal_mode: "rate",
            weight_rate_g_per_day: -200,
        });
        expect(p.goalPlan.flags.map((f) => f.code)).toContain("fast_loss");
        expect(p.goalPlan.goal_kcal).not.toBeNull();
    });

    test("protein holds while carbs and fat follow the day's calories", () => {
        const p = payloadFor({
            calorie_goal_mode: "rate",
            weight_rate_g_per_day: -70,
            daily_protein_g: 150,
            daily_carbs_g: 200,
            daily_fat_g: 60,
        });
        const row = p.daily.find((r) => (r.active_kcal ?? 0) > 0)!;
        expect(row.goal_protein_g).toBe(150);
        const factor = row.goal_calories! / row.goal_base_calories!;
        expect(row.goal_carbs_g).toBeCloseTo(200 * factor, 0);
        expect(row.goal_fat_g).toBeCloseTo(60 * factor, 0);
    });
});
