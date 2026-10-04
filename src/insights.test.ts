import { test, expect } from "bun:test";
import {
    buildDailyBuckets,
    computeTrends,
    computeWeeklyDigest,
    addedSugarNotRecorded,
    computeWeightTrend,
    type DailyBucket,
} from "./insights.js";
import type { Meal, NutritionGoals, WeightEntry } from "./supabase.js";
import { analyzeWeightHistory, rateForDisplay } from "./weight-trend.js";

function entry(logged_at: string, weight_g: number): WeightEntry {
    return {
        id: `id-${logged_at}-${weight_g}`,
        user_id: "u1",
        weight_g,
        logged_at,
        notes: null,
        created_at: logged_at,
        idempotency_key: null,
    };
}

test("computeWeightTrend reports latest, change, range, and goal in kg", () => {
    const entries = [
        entry("2026-06-01T08:00:00Z", 80000),
        entry("2026-06-08T08:00:00Z", 79000),
        entry("2026-06-15T08:00:00Z", 78500),
    ];
    const out = computeWeightTrend(
        entries,
        "2026-06-01",
        "2026-06-15",
        "UTC",
        75000, // target 75 kg
        "kg",
    );
    expect(out).toContain(
        "Weight trend — 2026-06-01 to 2026-06-15 (3 logged days)",
    );
    expect(out).toContain("Latest: 78.5 kg (on 2026-06-15)");
    expect(out).toContain(
        "Change over range: -1.5 kg (from 80 kg on 2026-06-01)",
    );
    expect(out).toContain("Min: 78.5 kg (on 2026-06-15)");
    expect(out).toContain("Max: 80 kg (on 2026-06-01)");
    expect(out).toContain("3.5 kg to lose to reach target of 75 kg");
    // Gap-corrected EWMA: 80 → 79.32 → 78.76 kg. Only 2 weigh-ins in the
    // last 21 days, so no rate, and the first weigh-in is inside the window,
    // so no history line.
    expect(out).toContain("Trend weight: 78.8 kg\n");
    expect(out).not.toContain("/week");
    expect(out).not.toContain("Since first weigh-in");
    expect(out).not.toContain("Moving averages");
});

test("computeWeightTrend averages multiple weigh-ins on the same day", () => {
    const entries = [
        entry("2026-06-01T07:00:00Z", 80000),
        entry("2026-06-01T20:00:00Z", 82000), // same day -> avg 81 kg
        entry("2026-06-02T07:00:00Z", 81000),
    ];
    const out = computeWeightTrend(
        entries,
        "2026-06-01",
        "2026-06-02",
        "UTC",
        null,
        "kg",
    );
    expect(out).toContain("(2 logged days)");
    expect(out).toContain("Max: 81 kg (on 2026-06-01)"); // averaged, not 82
    // The trend is seeded with the averaged 81 kg, not either raw reading.
    expect(out).toContain("Trend weight: 81 kg");
    expect(out).toContain("(Tip: set a target weight with set_nutrition_goals");
});

test("computeWeightTrend renders in lb and reports gaining toward target", () => {
    const entries = [
        entry("2026-06-01T08:00:00Z", 74843), // 165 lb
        entry("2026-06-10T08:00:00Z", 76203), // 168 lb
    ];
    const out = computeWeightTrend(
        entries,
        "2026-06-01",
        "2026-06-10",
        "UTC",
        79379, // ~175 lb target
        "lb",
    );
    expect(out).toContain("Latest: 168 lb (on 2026-06-10)");
    expect(out).toContain("Change over range: +3 lb");
    expect(out).toContain("to gain to reach target of 175 lb");
    // 165 lb + (1 − 0.85^9) · 3 lb ≈ 167.3 lb.
    expect(out).toContain("Trend weight: 167.3 lb");
});

test("computeWeightTrend handles an empty range", () => {
    expect(
        computeWeightTrend([], "2026-06-01", "2026-06-30", "UTC", null, "kg"),
    ).toBe("No weight logged between 2026-06-01 and 2026-06-30.");
    // History before the window does not count as a reading inside it.
    expect(
        computeWeightTrend(
            [entry("2026-05-01T08:00:00Z", 80000)],
            "2026-06-01",
            "2026-06-30",
            "UTC",
            null,
            "kg",
        ),
    ).toBe("No weight logged between 2026-06-01 and 2026-06-30.");
});

/** One weigh-in a day from 2026-01-01, losing 100 g a day from 92 kg. */
function linearLoss(days: number): WeightEntry[] {
    const start = Date.parse("2026-01-01T08:00:00Z");
    return Array.from({ length: days }, (_, i) =>
        entry(new Date(start + i * 86_400_000).toISOString(), 92000 - 100 * i),
    );
}

test("computeWeightTrend reports the trend's weekly rate and the history line", () => {
    const out = computeWeightTrend(
        linearLoss(181), // through 2026-06-30
        "2026-06-01",
        "2026-06-30",
        "UTC",
        null,
        "kg",
    );
    // Window stats still use only the requested days.
    expect(out).toContain(
        "Weight trend — 2026-06-01 to 2026-06-30 (30 logged days)",
    );
    expect(out).toContain(
        "Change over range: -2.9 kg (from 76.9 kg on 2026-06-01)",
    );
    expect(out).toContain("Min: 74 kg (on 2026-06-30)");
    // A steady 100 g/day loss: the settled trend lags the scale by
    // 0.1 · 0.85 / 0.15 ≈ 0.57 kg and falls 0.7 kg a week.
    expect(out).toContain(
        "Trend weight: 74.6 kg (−0.7 kg/week over the last 2 weeks)\n",
    );
    // 74.6 − 92 = −17.4, from the two printed figures.
    expect(out).toContain(
        "Since first weigh-in (2026-01-01, 92 kg): −17.4 kg; trend now 74.6 kg.",
    );
});

test("computeWeightTrend's trend and rate match the widget's _meta", () => {
    for (const unit of ["kg", "lb"] as const) {
        const entries = linearLoss(181);
        const out = computeWeightTrend(
            entries,
            "2026-06-24",
            "2026-06-30",
            "UTC",
            null,
            unit,
        );
        const { meta } = analyzeWeightHistory(
            entries,
            "UTC",
            unit,
            "2026-06-30",
        );
        const rate = rateForDisplay(meta.weekly_rate!);
        expect(out).toContain(
            `Trend weight: ${meta.trend_latest} ${unit} (${rate > 0 ? "+" : rate < 0 ? "−" : ""}${Math.abs(rate).toFixed(1)} ${unit}/week over the last 2 weeks)`,
        );
        expect(out).toContain(`trend now ${meta.trend_latest} ${unit}.`);
    }
});

test("computeWeightTrend warms the trend up on history before the window", () => {
    // 90 kg for two months, then 80 kg inside the window: with the warm-up
    // the trend is still on its way down; without it, it would start at 80.
    const before = Array.from({ length: 60 }, (_, i) =>
        entry(
            new Date(
                Date.parse("2026-04-01T08:00:00Z") + i * 86_400_000,
            ).toISOString(),
            90000,
        ),
    );
    const inWindow = [
        entry("2026-06-01T08:00:00Z", 80000),
        entry("2026-06-02T08:00:00Z", 80000),
    ];
    const warm = computeWeightTrend(
        [...before, ...inWindow],
        "2026-06-01",
        "2026-06-02",
        "UTC",
        null,
        "kg",
    );
    // The last 90 kg day is 2026-05-30, so 80 kg arrives over 3 days of
    // gap-corrected steps: 90 − 10 · (1 − 0.85³) ≈ 86.1 kg.
    expect(warm).toContain("Trend weight: 86.1 kg");
    expect(warm).toContain(
        "Since first weigh-in (2026-04-01, 90 kg): −3.9 kg; trend now 86.1 kg.",
    );
    const cold = computeWeightTrend(
        inWindow,
        "2026-06-01",
        "2026-06-02",
        "UTC",
        null,
        "kg",
    );
    expect(cold).toContain("Trend weight: 80 kg");
    expect(cold).not.toContain("Since first weigh-in");
});

test("computeWeightTrend ignores weigh-ins after the window end", () => {
    const entries = [
        entry("2026-06-01T08:00:00Z", 80000),
        entry("2026-06-02T08:00:00Z", 80000),
        entry("2026-06-10T08:00:00Z", 70000), // after end_date
    ];
    const out = computeWeightTrend(
        entries,
        "2026-06-01",
        "2026-06-02",
        "UTC",
        null,
        "kg",
    );
    expect(out).toContain("Latest: 80 kg (on 2026-06-02)");
    expect(out).toContain("Trend weight: 80 kg");
    expect(out).not.toContain("70 kg");
});

// ---------- fiber / sugar / alcohol ----------

function meal(logged_at: string, fields: Partial<Meal> = {}): Meal {
    return {
        id: `m-${logged_at}-${Math.random()}`,
        user_id: "u1",
        logged_at,
        meal_type: "lunch",
        description: "test meal",
        calories: 500,
        protein_g: 30,
        carbs_g: 50,
        fat_g: 20,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        notes: null,
        idempotency_key: null,
        ...fields,
    };
}

function goals(fields: Partial<NutritionGoals> = {}): NutritionGoals {
    return {
        user_id: "u1",
        daily_calories: null,
        daily_protein_g: null,
        daily_carbs_g: null,
        daily_fat_g: null,
        daily_fiber_g: null,
        daily_sugar_g: null,
        daily_added_sugar_g: null,
        daily_alcohol_g: null,
        daily_caffeine_mg: null,
        daily_water_ml: null,
        target_weight_g: null,
        updated_at: "2026-06-02T00:00:00Z",
        ...fields,
    };
}

/** Two consecutive days, one meal each, with the new nutrients set. */
function twoDayBuckets(
    day1: Partial<Meal>,
    day2: Partial<Meal>,
): DailyBucket[] {
    return buildDailyBuckets(
        [
            meal("2026-06-01T12:00:00Z", day1),
            meal("2026-06-02T12:00:00Z", day2),
        ],
        [],
        "2026-06-01",
        "2026-06-02",
        "UTC",
    );
}

test("buildDailyBuckets sums fiber, sugar and alcohol per day", () => {
    const buckets = buildDailyBuckets(
        [
            meal("2026-06-01T08:00:00Z", {
                fiber_g: 5,
                sugar_g: 10,
                alcohol_g: 0,
            }),
            meal("2026-06-01T19:00:00Z", {
                fiber_g: 3,
                sugar_g: 12,
                alcohol_g: 14,
            }),
            meal("2026-06-02T12:00:00Z", { fiber_g: 7 }), // sugar/alcohol null
        ],
        [],
        "2026-06-01",
        "2026-06-02",
        "UTC",
    );
    expect(buckets[0]!.fiber_g).toBe(8);
    expect(buckets[0]!.sugar_g).toBe(22);
    expect(buckets[0]!.alcohol_g).toBe(14);
    // Nulls contribute 0 rather than NaN.
    expect(buckets[1]!.fiber_g).toBe(7);
    expect(buckets[1]!.sugar_g).toBe(0);
    expect(buckets[1]!.alcohol_g).toBe(0);
});

test("computeTrends treats fiber as a floor and sugar as a ceiling", () => {
    const buckets = twoDayBuckets(
        { fiber_g: 25, sugar_g: 50 },
        { fiber_g: 26, sugar_g: 30 },
    );
    const out = computeTrends(
        buckets,
        goals({ daily_fiber_g: 25, daily_sugar_g: 40 }),
    );

    expect(out).toContain("Fiber:");
    expect(out).toContain("  7d avg: 25.5g");
    expect(out).toContain("  Target: 25g");
    expect(out).toContain("  Days within ±10% of target: 2/2");

    expect(out).toContain("Sugar:");
    expect(out).toContain("  7d avg: 40g");
    // A limit is never described as a "target" to land on, and the count is of
    // misses, so it can never read as praise for consuming sugar.
    expect(out).toContain("  Limit: 40g");
    expect(out).toContain("  Days over limit: 1/2");
    expect(out).not.toContain("Days within ±10% of target: 1/2");
});

test("computeTrends suppresses the alcohol line when the window is all zero", () => {
    const buckets = twoDayBuckets(
        { alcohol_g: 0, sugar_g: 10, fiber_g: 8 },
        { alcohol_g: null, sugar_g: 10, fiber_g: 8 },
    );
    // Even with a limit configured, an all-zero series has nothing to trend.
    const out = computeTrends(buckets, goals({ daily_alcohol_g: 20 }));
    expect(out).not.toContain("Alcohol");
    // Fiber and sugar are always on, no toggle.
    expect(out).toContain("Fiber:");
    expect(out).toContain("Sugar:");
});

test("computeTrends shows alcohol once any day is non-zero", () => {
    const buckets = twoDayBuckets({ alcohol_g: 0 }, { alcohol_g: 14 });
    const out = computeTrends(buckets, goals({ daily_alcohol_g: 20 }));
    expect(out).toContain("Alcohol:");
    expect(out).toContain("  7d avg: 7g");
    expect(out).toContain("  Limit: 20g");
    expect(out).toContain("  Days over limit: 0/2");
});

test("computeWeeklyDigest reports fiber and sugar, calling a sugar goal a limit", () => {
    const buckets = twoDayBuckets(
        { fiber_g: 30, sugar_g: 50 },
        { fiber_g: 20, sugar_g: 70 },
    );
    const out = computeWeeklyDigest(
        buckets,
        goals({ daily_fiber_g: 30, daily_sugar_g: 40 }),
    );
    expect(out).toContain("  Fiber: 25g / 30g target (83%)");
    expect(out).toContain("  Sugar: 60g / 40g limit (150%)");
    // No alcohol logged -> no row at all.
    expect(out).not.toContain("Alcohol");
});

test("computeWeeklyDigest shows an alcohol row only when a drink was logged", () => {
    const buckets = twoDayBuckets({ alcohol_g: 0 }, { alcohol_g: 28 });
    const out = computeWeeklyDigest(buckets, goals({ daily_alcohol_g: 10 }));
    expect(out).toContain("  Alcohol: 14g / 10g limit (140%)");
});

// ---------- historical NULLs are not zeros ----------
//
// Every meal logged before fiber/sugar/alcohol shipped carries NULL for all
// three. Averaging those days as 0 reported a third of the truth against a
// target, and scored data-less days as days under a limit.

/** `days` consecutive days, one meal each, with `withData` days of nutrient
 * data at the END of the window (the shape of a mid-window deploy). */
function windowBuckets(
    days: number,
    withData: number,
    fields: Partial<Meal>,
): DailyBucket[] {
    const start = new Date("2026-06-01T00:00:00Z");
    const meals: Meal[] = [];
    for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setUTCDate(d.getUTCDate() + i);
        const date = d.toISOString().slice(0, 10);
        meals.push(
            meal(`${date}T12:00:00Z`, i >= days - withData ? fields : {}),
        );
    }
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + days - 1);
    return buildDailyBuckets(
        meals,
        [],
        "2026-06-01",
        end.toISOString().slice(0, 10),
        "UTC",
    );
}

test("computeTrends averages a partial nutrient over its covered days only", () => {
    // 30 logged days, fiber recorded on the last 5 — exactly 30 g each.
    const buckets = windowBuckets(30, 5, { fiber_g: 30 });
    const out = computeTrends(buckets, goals({ daily_fiber_g: 30 }));

    // The reported bug: 150 g / 30 days = 5 g/day against a 30 g target.
    expect(out).not.toContain("30d avg: 5g");
    expect(out).toContain("  30d avg: 30g (5 of 30 days with data)");
    expect(out).toContain("  7d avg: 30g (5 of 7 days with data)");
    // Day counts and the spread use the same denominator.
    expect(out).toContain("  Days within ±10% of target: 5/5 days with data");
    expect(out).toContain("  Std dev: 0g (CV 0%)");
    // Calories keep counting every day, as they always have.
    expect(out).toContain("  30d avg: 500 kcal");
});

test("computeTrends counts limit misses over covered days, not the window", () => {
    // Sugar recorded on the last 4 days only, every one of them over the limit.
    const buckets = windowBuckets(30, 4, { sugar_g: 90 });
    const out = computeTrends(buckets, goals({ daily_sugar_g: 40 }));
    expect(out).toContain("  Days over limit: 4/4 days with data");
    // The old reading — a clean month — came from counting the silent days.
    expect(out).not.toContain("Days over limit: 4/30");
    expect(out).not.toContain("Days over limit: 0/30");
});

test("computeTrends drops a nutrient with no data anywhere in the window", () => {
    // A pre-feature history: meals every day, no fiber/sugar/alcohol on any.
    const buckets = windowBuckets(30, 0, {});
    const out = computeTrends(
        buckets,
        goals({ daily_fiber_g: 30, daily_sugar_g: 40, daily_alcohol_g: 0 }),
    );
    expect(out).not.toContain("Fiber");
    expect(out).not.toContain("Sugar");
    expect(out).not.toContain("Alcohol");
    // Nothing is invented for them, in particular not a zero.
    expect(out).not.toContain("0g (0 of 30");
    expect(out).toContain("Calories:");
    expect(out).toContain("Water:");
});

test("computeTrends says so when a trailing window has no data at all", () => {
    // Fiber only in the first days of the month: nothing in the last 7 or 14.
    const buckets = buildDailyBuckets(
        [
            meal("2026-06-01T12:00:00Z", { fiber_g: 20 }),
            meal("2026-06-02T12:00:00Z", { fiber_g: 20 }),
            ...Array.from({ length: 10 }, (_, i) =>
                meal(`2026-06-${String(i + 3).padStart(2, "0")}T12:00:00Z`),
            ),
        ],
        [],
        "2026-06-01",
        "2026-06-12",
        "UTC",
    );
    const out = computeTrends(buckets, goals());
    expect(out).toContain("  7d avg: no data");
    expect(out).toContain("  14d avg: 20g (2 of 12 days with data)");
});

test("computeTrends honours a limit of zero on a ceiling", () => {
    const buckets = twoDayBuckets({ alcohol_g: 14 }, { alcohol_g: 0 });
    const out = computeTrends(buckets, goals({ daily_alcohol_g: 0 }));
    // Zero is the most likely alcohol limit there is; it must not read as unset.
    expect(out).toContain("  Limit: 0g");
    expect(out).toContain("  Days over limit: 1/2 days with data");
});

test("computeTrends still treats a floor target of zero as unset", () => {
    const buckets = twoDayBuckets({ fiber_g: 20 }, { fiber_g: 30 });
    const out = computeTrends(buckets, goals({ daily_fiber_g: 0 }));
    expect(out).toContain("Fiber:");
    expect(out).not.toContain("Target: 0g");
    expect(out).not.toContain("Days within ±10%");
});

test("computeWeeklyDigest averages a partial nutrient over its covered days", () => {
    // A week logged, fiber on the last 2 days at 30 g.
    const buckets = windowBuckets(7, 2, { fiber_g: 30 });
    const out = computeWeeklyDigest(buckets, goals({ daily_fiber_g: 30 }));
    expect(out).toContain(
        "  Fiber: 30g / 30g target (100%) — over 2 of 7 days with data",
    );
    expect(out).not.toContain("Fiber: 8.6g");
});

test("computeWeeklyDigest drops rows for nutrients with no data at all", () => {
    const buckets = windowBuckets(7, 0, {});
    const out = computeWeeklyDigest(
        buckets,
        goals({ daily_fiber_g: 30, daily_sugar_g: 40 }),
    );
    expect(out).not.toContain("Fiber");
    expect(out).not.toContain("Sugar");
    expect(out).toContain("  Calories:");
});

test("computeWeeklyDigest honours a limit of zero without a percentage", () => {
    const buckets = twoDayBuckets({ alcohol_g: 14 }, { alcohol_g: 14 });
    const out = computeWeeklyDigest(buckets, goals({ daily_alcohol_g: 0 }));
    expect(out).toContain("  Alcohol: 14g / 0g limit (14g over)");
    // No Infinity/NaN percentage, and nothing that reads as budget left.
    expect(out).not.toContain("Infinity");
    expect(out).not.toContain("NaN");
    expect(out).not.toContain("left");
});

test("computeWeeklyDigest reports a zero-limit nutrient held at zero as clear", () => {
    const buckets = twoDayBuckets({ sugar_g: 0 }, { sugar_g: 0 });
    const out = computeWeeklyDigest(buckets, goals({ daily_sugar_g: 0 }));
    expect(out).toContain("  Sugar: 0g / 0g limit (clear)");
});

// ---------- added sugar ----------
//
// Part of total sugar, with its own ceiling. Like sugar it is expected on every
// meal, so a recorded 0 is real — but meals logged before it shipped are NULL
// and their days drop out of the added-sugar figures only.

test("buildDailyBuckets sums added sugar per day, nulls contributing 0", () => {
    const buckets = buildDailyBuckets(
        [
            meal("2026-06-01T08:00:00Z", { sugar_g: 30, added_sugar_g: 0 }),
            meal("2026-06-01T19:00:00Z", { sugar_g: 35, added_sugar_g: 35 }),
            meal("2026-06-02T12:00:00Z", { sugar_g: 12 }), // added null
        ],
        [],
        "2026-06-01",
        "2026-06-02",
        "UTC",
    );
    expect(buckets[0]!.added_sugar_g).toBe(35);
    expect(buckets[0]!.sugar_g).toBe(65);
    expect(buckets[1]!.added_sugar_g).toBe(0);
});

test("computeTrends adds an added-sugar ceiling row beside sugar", () => {
    // Two bananas and a cola, then a lighter day.
    const buckets = twoDayBuckets(
        { sugar_g: 64, added_sugar_g: 35 },
        { sugar_g: 20, added_sugar_g: 10 },
    );
    const out = computeTrends(
        buckets,
        goals({ daily_sugar_g: 50, daily_added_sugar_g: 25 }),
    );
    const section = out.split("\n\n").find((s) => s.startsWith("Added sugar:"));
    expect(section).toBeDefined();
    expect(section).toContain("  7d avg: 22.5g");
    expect(section).toContain("  Limit: 25g");
    expect(section).toContain("  Days over limit: 1/2 days with data");
    // Sugar keeps its own line and its own limit.
    const sugar = out.split("\n\n").find((s) => s.startsWith("Sugar:"));
    expect(sugar).toContain("  Limit: 50g");
    expect(sugar).toContain("  Days over limit: 1/2 days with data");
    // Order: sugar, then added sugar.
    expect(out.indexOf("Sugar:")).toBeLessThan(out.indexOf("Added sugar:"));
});

test("computeTrends honours an added-sugar limit of zero", () => {
    const buckets = twoDayBuckets(
        { sugar_g: 20, added_sugar_g: 0 },
        { sugar_g: 30, added_sugar_g: 5 },
    );
    const out = computeTrends(buckets, goals({ daily_added_sugar_g: 0 }));
    const section = out
        .split("\n\n")
        .find((s) => s.startsWith("Added sugar:"))!;
    expect(section).toContain("  Limit: 0g");
    expect(section).toContain("  Days over limit: 1/2 days with data");
});

test("computeTrends shows a recorded all-zero added-sugar series", () => {
    // Unlike alcohol/caffeine, a recorded 0 is the expected answer for most
    // meals (fruit, meat, rice), so it is not suppressed.
    const buckets = twoDayBuckets(
        { sugar_g: 20, added_sugar_g: 0 },
        { sugar_g: 15, added_sugar_g: 0 },
    );
    const out = computeTrends(buckets, goals({ daily_added_sugar_g: 25 }));
    expect(out).toContain("Added sugar:");
    expect(out).toContain("  Days over limit: 0/2 days with data");
});

test("computeTrends leaves days without added sugar out of its row only", () => {
    // Sugar on all 30 days; added sugar only on the last 3 (logged after the
    // change), each over the limit.
    const start = new Date("2026-06-01T00:00:00Z");
    const meals: Meal[] = [];
    for (let i = 0; i < 30; i++) {
        const d = new Date(start);
        d.setUTCDate(d.getUTCDate() + i);
        const date = d.toISOString().slice(0, 10);
        meals.push(
            meal(
                `${date}T12:00:00Z`,
                i >= 27 ? { sugar_g: 60, added_sugar_g: 40 } : { sugar_g: 60 },
            ),
        );
    }
    const buckets = buildDailyBuckets(
        meals,
        [],
        "2026-06-01",
        "2026-06-30",
        "UTC",
    );
    const out = computeTrends(
        buckets,
        goals({ daily_sugar_g: 50, daily_added_sugar_g: 25 }),
    );
    const sections = out.split("\n\n");
    const added = sections.find((s) => s.startsWith("Added sugar:"))!;
    const sugar = sections.find((s) => s.startsWith("Sugar:"))!;
    expect(added).toContain("  30d avg: 40g (3 of 30 days with data)");
    expect(added).toContain("  Days over limit: 3/3 days with data");
    // Not scored as 27 clean days under the limit, and not averaged as zeros.
    expect(added).not.toContain("/30 days with data");
    expect(added).not.toContain("30d avg: 4g");
    // Sugar is untouched by the gap.
    expect(sugar).toContain("  30d avg: 60g");
    expect(sugar).toContain("  Days over limit: 30/30 days with data");
});

test("computeTrends drops the added-sugar row when no day carries it and no limit is set", () => {
    const buckets = twoDayBuckets({ sugar_g: 20 }, { sugar_g: 30 });
    const out = computeTrends(buckets, goals());
    expect(out).toContain("Sugar:");
    expect(out).not.toContain("Added sugar");
});

// With a limit, a vanished row let total sugar be read against the
// added-sugar limit (the ChatGPT cola report), so the gap is stated instead.
test("computeTrends states an unrecorded window against the limit, 0 included", () => {
    const buckets = twoDayBuckets({ sugar_g: 35 }, { sugar_g: 30 });
    for (const [limit, shown] of [
        [25, "25"],
        [0, "0"],
    ] as const) {
        const out = computeTrends(
            buckets,
            goals({ daily_added_sugar_g: limit }),
        );
        const section = out
            .split("\n\n")
            .find((s) => s.startsWith("Added sugar"));
        expect(section).toBe(
            `Added sugar: not recorded in this period (limit ${shown}g)`,
        );
        expect(out.indexOf("Sugar:")).toBeLessThan(out.indexOf("Added sugar:"));
    }
});

test("computeTrends keeps per-window 'no data' when some day records added sugar", () => {
    const buckets = twoDayBuckets(
        { sugar_g: 20, added_sugar_g: 5 },
        {
            sugar_g: 30,
        },
    );
    const out = computeTrends(buckets, goals({ daily_added_sugar_g: 25 }));
    expect(out).not.toContain("not recorded in this period");
    expect(out).toContain("Added sugar:\n");
});

test("computeWeeklyDigest reports added sugar against its limit", () => {
    const buckets = twoDayBuckets(
        { sugar_g: 64, added_sugar_g: 35 },
        { sugar_g: 20, added_sugar_g: 15 },
    );
    const out = computeWeeklyDigest(
        buckets,
        goals({ daily_sugar_g: 50, daily_added_sugar_g: 25 }),
    );
    expect(out).toContain("  Sugar: 42g / 50g limit (84%)");
    expect(out).toContain("  Added sugar: 25g / 25g limit (100%)");
    expect(out.indexOf("  Sugar:")).toBeLessThan(out.indexOf("  Added sugar:"));
});

test("computeWeeklyDigest averages added sugar over its covered days", () => {
    // Sugar every day; added sugar on the last 2 only.
    const start = new Date("2026-06-01T00:00:00Z");
    const meals: Meal[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setUTCDate(d.getUTCDate() + i);
        const date = d.toISOString().slice(0, 10);
        meals.push(
            meal(
                `${date}T12:00:00Z`,
                i >= 5 ? { sugar_g: 40, added_sugar_g: 30 } : { sugar_g: 40 },
            ),
        );
    }
    const buckets = buildDailyBuckets(
        meals,
        [],
        "2026-06-01",
        "2026-06-07",
        "UTC",
    );
    const out = computeWeeklyDigest(
        buckets,
        goals({ daily_added_sugar_g: 25 }),
    );
    expect(out).toContain(
        "  Added sugar: 30g / 25g limit (120%) — over 2 of 7 days with data",
    );
    expect(out).toContain("  Sugar: 40g");
    expect(out).not.toContain("Sugar: 40g — over");
});

test("computeWeeklyDigest honours an added-sugar limit of zero", () => {
    const clear = computeWeeklyDigest(
        twoDayBuckets(
            { sugar_g: 20, added_sugar_g: 0 },
            { sugar_g: 10, added_sugar_g: 0 },
        ),
        goals({ daily_added_sugar_g: 0 }),
    );
    expect(clear).toContain("  Added sugar: 0g / 0g limit (clear)");
    const over = computeWeeklyDigest(
        twoDayBuckets(
            { sugar_g: 20, added_sugar_g: 6 },
            { sugar_g: 10, added_sugar_g: 0 },
        ),
        goals({ daily_added_sugar_g: 0 }),
    );
    expect(over).toContain("  Added sugar: 3g / 0g limit (3g over)");
});

test("computeWeeklyDigest drops the added-sugar row with no data and no limit", () => {
    const out = computeWeeklyDigest(
        twoDayBuckets({ sugar_g: 20 }, { sugar_g: 30 }),
        goals(),
    );
    expect(out).toContain("  Sugar: 25g");
    expect(out).not.toContain("Added sugar");
});

test("computeWeeklyDigest states an unrecorded week against the limit", () => {
    for (const limit of [25, 0]) {
        const out = computeWeeklyDigest(
            twoDayBuckets({ sugar_g: 20 }, { sugar_g: 30 }),
            goals({ daily_added_sugar_g: limit }),
        );
        expect(out).toContain(
            `  Sugar: 25g\n  Added sugar: not recorded in this period (limit ${limit}g)`,
        );
    }
});

test("addedSugarNotRecorded: one wording, rounded like every gram figure", () => {
    expect(addedSugarNotRecorded("day", 29)).toBe(
        "not recorded on this day (limit 29g)",
    );
    expect(addedSugarNotRecorded("period", 27.46)).toBe(
        "not recorded in this period (limit 27.5g)",
    );
    // Describes the gap, never directs the reader.
    for (const t of [
        addedSugarNotRecorded("day", 0),
        addedSugarNotRecorded("period", 25),
    ])
        expect(t).not.toMatch(
            /\b(ask|offer|should|estimate|call|tell|suggest|please|must)\b/i,
        );
});

// ---------- caffeine ----------
//
// The partial-nutrient problem in its sharpest form: caffeine shipped long after
// the meals table, so every historical row is NULL and most future rows will be
// too. It is also the one nutrient here that carries no energy — it must never
// reach a calorie figure — and the one with no per-user opt-in flag, so the
// data-driven suppression below is the entire gate on rendering it.

test("buildDailyBuckets sums caffeine per day in mg without touching calories", () => {
    const buckets = buildDailyBuckets(
        [
            meal("2026-06-01T08:00:00Z", { caffeine_mg: 95 }),
            meal("2026-06-01T14:00:00Z", { caffeine_mg: 63 }),
            meal("2026-06-02T12:00:00Z"), // caffeine null
        ],
        [],
        "2026-06-01",
        "2026-06-02",
        "UTC",
    );
    expect(buckets[0]!.caffeine_mg).toBe(158);
    // Nulls contribute 0 rather than NaN, and caffeine adds no kcal to either day.
    expect(buckets[1]!.caffeine_mg).toBe(0);
    expect(buckets[0]!.calories).toBe(1000);
    expect(buckets[1]!.calories).toBe(500);
});

test("computeTrends averages caffeine over its covered days, never a null as zero", () => {
    // 30 logged days, caffeine recorded on the last 5 — 200 mg each.
    const buckets = windowBuckets(30, 5, { caffeine_mg: 200 });
    const out = computeTrends(buckets, goals({ daily_caffeine_mg: 400 }));

    // The null days are out of the denominator: 1000/30 = 33.3 mg would be the
    // pre-feature history answering a question it has no data for.
    expect(out).not.toContain("30d avg: 33.3 mg");
    expect(out).toContain("  30d avg: 200 mg (5 of 30 days with data)");
    expect(out).toContain("  Limit: 400 mg");
    expect(out).toContain("  Days over limit: 0/5 days with data");
    // Zero energy: the calorie line is untouched by 200 mg of caffeine.
    expect(out).toContain("  30d avg: 500 kcal");
});

test("computeTrends renders no caffeine line for a history that never recorded any", () => {
    const buckets = windowBuckets(30, 0, {});
    const out = computeTrends(buckets, goals({ daily_caffeine_mg: 400 }));
    expect(out).not.toContain("Caffeine");
    expect(out).not.toContain("0 mg");
    expect(out).toContain("Calories:");
});

test("computeTrends suppresses a recorded but flat-zero caffeine series", () => {
    // Recorded zeroes are data, but a trend over them is noise — and there is no
    // profile flag to fall back on, so this check has to catch it.
    const buckets = twoDayBuckets({ caffeine_mg: 0 }, { caffeine_mg: 0 });
    const out = computeTrends(buckets, goals({ daily_caffeine_mg: 400 }));
    expect(out).not.toContain("Caffeine");
});

test("computeTrends honours a caffeine limit of zero", () => {
    const buckets = twoDayBuckets({ caffeine_mg: 95 }, { caffeine_mg: 0 });
    const out = computeTrends(buckets, goals({ daily_caffeine_mg: 0 }));
    // "None at all" is a real limit for caffeine as much as for alcohol.
    expect(out).toContain("Caffeine:");
    expect(out).toContain("  7d avg: 48 mg");
    expect(out).toContain("  Limit: 0 mg");
    expect(out).toContain("  Days over limit: 1/2 days with data");
});

// Every other nutrient here reads to one decimal, and caffeine used to as well
// — so one chat could carry "Caffeine: 165 mg" from get_goal_progress and
// "165.1 mg" from get_trends for the same day, with nothing to reconcile them.
// mcp.ts renders whole milligrams (formatMg); this is the other half of that.
// Three consecutive days whose caffeine figures do not land on a whole number.
function awkwardCaffeineBuckets(): DailyBucket[] {
    return buildDailyBuckets(
        [
            meal("2026-06-01T08:00:00Z", { caffeine_mg: 95.4, fiber_g: 4.44 }),
            meal("2026-06-02T08:00:00Z", { caffeine_mg: 212.3, fiber_g: 7.77 }),
            meal("2026-06-03T08:00:00Z", {
                caffeine_mg: 187.55,
                fiber_g: 2.22,
            }),
        ],
        [],
        "2026-06-01",
        "2026-06-03",
        "UTC",
    );
}

test("computeTrends renders caffeine in whole milligrams, siblings unchanged", () => {
    const out = computeTrends(
        awkwardCaffeineBuckets(),
        goals({ daily_caffeine_mg: 399.6 }),
    );
    // 495.25 / 3 = 165.083…
    expect(out).toContain("  7d avg: 165 mg");
    expect(out).not.toContain("165.1 mg");
    // The std dev and the limit take the same precision — a decimal on any one
    // of them reintroduces a tenth the database, the labels and the export all
    // lack. numeric(7,2) is why the limit can carry one at all.
    expect(out).toContain("  Std dev: 62 mg (CV 37.3%)");
    expect(out).toContain("  Limit: 400 mg");
    expect(out).not.toContain("399.6");
    // Sibling nutrients keep their tenth: 14.43 / 3 = 4.81.
    expect(out).toContain("  7d avg: 4.8g");
});

test("computeWeeklyDigest rounds caffeine and its limit to whole milligrams", () => {
    const out = computeWeeklyDigest(
        awkwardCaffeineBuckets(),
        goals({ daily_caffeine_mg: 400 }),
    );
    expect(out).toContain("  Caffeine: 165 mg / 400 mg limit (41%)");
    expect(out).not.toContain("165.1");
});

test("computeWeeklyDigest reports caffeine in mg against a limit", () => {
    const buckets = windowBuckets(7, 2, { caffeine_mg: 300 });
    const out = computeWeeklyDigest(buckets, goals({ daily_caffeine_mg: 400 }));
    expect(out).toContain(
        "  Caffeine: 300 mg / 400 mg limit (75%) — over 2 of 7 days with data",
    );
    // Not 600/7 = 85.7 mg: the five null days are not zeroes.
    expect(out).not.toContain("Caffeine: 85.7 mg");
});

test("computeWeeklyDigest drops the caffeine row when there is no caffeine", () => {
    const none = computeWeeklyDigest(
        windowBuckets(7, 0, {}),
        goals({ daily_caffeine_mg: 400 }),
    );
    expect(none).not.toContain("Caffeine");
    // Recorded zeroes are suppressed too — "Caffeine: 0 mg" is the noise.
    const zeroes = computeWeeklyDigest(
        twoDayBuckets({ caffeine_mg: 0 }, { caffeine_mg: 0 }),
        goals({ daily_caffeine_mg: 400 }),
    );
    expect(zeroes).not.toContain("Caffeine");
});

// ---------- the calendar-day denominator is stated (issue #70) ----------
//
// get_trends divides calories/protein/carbs/fat/water by every day in the
// window; get_nutrition_summary divides the same nutrients by logged days.
// Both are right for their own question, so the trends side must say which one
// it answered — otherwise the two figures differ 2x with nothing to reconcile.

/** `days` consecutive days from 2026-06-01 where only the LAST `loggedDays`
 * carry a meal; the rest are genuine gaps (no meals, no water). */
function gappyBuckets(
    days: number,
    loggedDays: number,
    fields: Partial<Meal> = {},
): DailyBucket[] {
    const start = new Date("2026-06-01T00:00:00Z");
    const meals: Meal[] = [];
    for (let i = days - loggedDays; i < days; i++) {
        const d = new Date(start);
        d.setUTCDate(d.getUTCDate() + i);
        meals.push(meal(`${d.toISOString().slice(0, 10)}T12:00:00Z`, fields));
    }
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + days - 1);
    return buildDailyBuckets(
        meals,
        [],
        "2026-06-01",
        end.toISOString().slice(0, 10),
        "UTC",
    );
}

test("computeTrends states the calendar-day denominator when the window has gaps", () => {
    // 30 calendar days, 15 of them logged at 2000 kcal: 30000/30 = 1000.
    const buckets = gappyBuckets(30, 15, { calories: 2000 });
    const out = computeTrends(buckets, goals());
    expect(out).toContain(
        "  30d avg: 1000 kcal (calendar-day average; 15 of 30 days logged)",
    );
    // The summary's logged-day figure for the same window would be 2000; the
    // note is the only thing that keeps the two from reading as a contradiction.
    expect(out).not.toContain("  30d avg: 1000 kcal\n");
});

test("computeTrends adds no denominator note when every day is logged", () => {
    const buckets = gappyBuckets(30, 30, { calories: 2000 });
    const out = computeTrends(buckets, goals());
    expect(out).toContain("  30d avg: 2000 kcal");
    expect(out).not.toContain("calendar-day average");
    expect(out).not.toContain("days logged)");
});

test("computeTrends notes the gap only on the windows that have one", () => {
    // Last 7 days solid, nothing before them: 7d is clean, 30d is 7 of 30.
    const buckets = gappyBuckets(30, 7, { calories: 2100 });
    const out = computeTrends(buckets, goals());
    expect(out).toContain("  7d avg: 2100 kcal\n");
    expect(out).not.toContain("7d avg: 2100 kcal (calendar-day average");
    expect(out).toContain(
        "  14d avg: 1050 kcal (calendar-day average; 7 of 14 days logged)",
    );
    expect(out).toContain(
        "  30d avg: 490 kcal (calendar-day average; 7 of 30 days logged)",
    );
});

test("computeTrends keeps the partial-nutrient note when the window also has gaps", () => {
    // Only one note per line, and for fiber it is the narrower "days with data".
    const buckets = gappyBuckets(30, 10, { fiber_g: 30 });
    const out = computeTrends(buckets, goals());
    expect(out).toContain("  30d avg: 30g (10 of 30 days with data)");
    expect(out).not.toContain("30g (10 of 30 days with data) (calendar-day");
    expect(out).not.toContain("30d avg: 30g (calendar-day average");
});

test("computeWeeklyDigest states the calendar-day denominator on a gappy week", () => {
    const buckets = gappyBuckets(7, 3, { calories: 2100 });
    const out = computeWeeklyDigest(buckets, goals());
    expect(out).toContain(
        "Daily averages (per calendar day; 3 of 7 days logged):",
    );
    expect(out).toContain("  Calories: 900 kcal");
});

test("computeWeeklyDigest keeps the plain header on a fully logged week", () => {
    const buckets = gappyBuckets(7, 7, { calories: 2100 });
    const out = computeWeeklyDigest(buckets, goals());
    expect(out).toContain("Daily averages:");
    expect(out).not.toContain("per calendar day");
});
