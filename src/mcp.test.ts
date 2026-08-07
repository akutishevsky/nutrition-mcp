import { test, expect, describe, mock, beforeEach, afterAll } from "bun:test";
import { z } from "zod";
import {
    formatGoalLine,
    formatProgress,
    formatGoals,
    formatMeal,
    sumMeals,
    mealBreakdown,
    goalsPayloadOf,
    totalsPayloadOf,
    trendsDayPayloadOf,
    hasActiveTarget,
    nutrientPresence,
    rangeAverages,
    loggedDayAverageNote,
    startImportPayload,
    alcoholHiddenNote,
    registerTools,
    START_IMPORT_OUTPUT_SCHEMA,
    GOALS_ITEM,
    TOTALS_ITEM,
    TRENDS_DAY_ITEM,
    MEAL_BREAKDOWN_ITEM,
    MAX_CALORIES,
    MAX_MACRO_G,
    MAX_ALCOHOL_G,
    MAX_GOAL_G,
    gateAlcohol,
} from "./mcp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import * as actualSupabase from "./supabase.js";
import { DELETED_ACCOUNT_ANALYTICS_ID } from "./analytics.js";
import { formatFoodResult, type FoodResult } from "./foods.js";
import {
    buildDailyBuckets,
    computeTrends,
    computeWeeklyDigest,
    type DailyBucket,
} from "./insights.js";
import type { Meal, NutritionGoals, WaterEntry } from "./supabase.js";

function meal(over: Partial<Meal> = {}): Meal {
    return {
        id: "m1",
        user_id: "u1",
        logged_at: "2026-07-26T12:00:00.000Z",
        meal_type: "dinner",
        description: "Pasta and a beer",
        calories: 700,
        protein_g: 25,
        carbs_g: 90,
        fat_g: 20,
        fiber_g: 6,
        sugar_g: 12,
        alcohol_g: 14,
        notes: null,
        idempotency_key: null,
        ...over,
    };
}

function goals(over: Partial<NutritionGoals> = {}): NutritionGoals {
    return {
        user_id: "u1",
        daily_calories: 2000,
        daily_protein_g: 120,
        daily_carbs_g: 220,
        daily_fat_g: 70,
        daily_fiber_g: 30,
        daily_sugar_g: 40,
        daily_alcohol_g: 28,
        daily_water_ml: 2500,
        target_weight_g: null,
        updated_at: "2026-07-26T00:00:00.000Z",
        ...over,
    };
}

describe("formatGoalLine direction", () => {
    test("floor keeps the 'to go' wording", () => {
        expect(formatGoalLine("Fiber", "g", 18, 30)).toBe(
            "Fiber: 18 / 30g (60%, 12g to go)",
        );
    });

    // The bug this direction exists to prevent: a sugar LIMIT of 40 g with
    // nothing eaten must not read as headroom to use up. "40g left" is a
    // permission slip, and on an averaged view ("7-day average, 12.1g left") it
    // is not even meaningful.
    test("ceiling under the limit never offers the remainder", () => {
        const line = formatGoalLine("Sugar", "g", 0, 40, "ceiling");
        expect(line).toBe("Sugar: 0 / 40g limit (0%, under)");
        expect(line).not.toContain("to go");
        expect(line).not.toContain("left");
        expect(line).not.toContain("remaining");
    });

    test("ceiling over the limit says how far over", () => {
        expect(formatGoalLine("Sugar", "g", 52.5, 40, "ceiling")).toBe(
            "Sugar: 52.5 / 40g limit (131%, 12.5g over)",
        );
    });

    test("ceiling wording survives being read as an average", () => {
        // The same line has to make sense captioned "7-day average" — "under"
        // does, "12.1g left" does not.
        const line = formatGoalLine("Sugar", "g", 27.9, 40, "ceiling");
        expect(line).toBe("Sugar: 27.9 / 40g limit (70%, under)");
    });

    test("no target prints the bare amount in either direction", () => {
        expect(formatGoalLine("Sugar", "g", 12, null, "ceiling")).toBe(
            "Sugar: 12g",
        );
        // A FLOOR of 0 stays unset — a 0 g protein target says nothing.
        expect(formatGoalLine("Protein", "g", 12, 0)).toBe("Protein: 12g");
        // Negatives are rejected in both directions.
        expect(formatGoalLine("Sugar", "g", 12, -5, "ceiling")).toBe(
            "Sugar: 12g",
        );
        expect(formatGoalLine("Protein", "g", 12, -5)).toBe("Protein: 12g");
    });

    test("actualText overrides how the consumed amount is printed", () => {
        expect(
            formatGoalLine("Alcohol", "g", 14, 28, "ceiling", "14 g (1.0 US)"),
        ).toBe("Alcohol: 14 g (1.0 US) / 28g limit (50%, under)");
    });
});

// A limit of 0 was storable, was echoed by get_nutrition_goals, and was then
// treated as no goal at all by every progress line — for the single most likely
// alcohol goal there is.
describe("a zero ceiling is a real limit", () => {
    test("hasActiveTarget splits zero by direction", () => {
        expect(hasActiveTarget(0, "ceiling")).toBe(true);
        expect(hasActiveTarget(0, "floor")).toBe(false);
        expect(hasActiveTarget(-1, "ceiling")).toBe(false);
        expect(hasActiveTarget(null, "ceiling")).toBe(false);
        expect(hasActiveTarget(undefined, "ceiling")).toBe(false);
        expect(hasActiveTarget(NaN, "ceiling")).toBe(false);
        expect(hasActiveTarget(30, "floor")).toBe(true);
    });

    test("staying at zero is reported against the zero limit", () => {
        const line = formatGoalLine(
            "Alcohol",
            "g",
            0,
            0,
            "ceiling",
            "0 g (0.0 US drinks)",
        );
        expect(line).toBe("Alcohol: 0 g (0.0 US drinks) / 0g limit (clear)");
        // No Infinity and no NaN from dividing by the zero target.
        expect(line).not.toContain("Infinity");
        expect(line).not.toContain("NaN");
        expect(line).not.toContain("%");
    });

    test("anything at all is over a zero limit", () => {
        const line = formatGoalLine("Alcohol", "g", 14, 0, "ceiling");
        expect(line).toBe("Alcohol: 14 / 0g limit (14g over)");
        expect(line).not.toContain("NaN");
        expect(line).not.toContain("Infinity");
    });

    // End to end: stored -> echoed by get_nutrition_goals -> honoured on the
    // progress line. Before this fix the middle step happened and the last did
    // not.
    test("a zero alcohol limit is echoed and then honoured", () => {
        const zero = goals({ daily_alcohol_g: 0 });
        expect(formatGoals(zero, "kg", "us")).toContain(
            "- Alcohol (max): 0 g (0.0 US drinks)",
        );
        expect(formatProgress(sumMeals([meal()]), zero, "us")).toContain(
            "Alcohol: 14 g (1.0 US drinks) / 0g limit (14g over)",
        );
        expect(
            formatProgress(sumMeals([meal({ alcohol_g: 0 })]), zero, "us"),
        ).toContain("Alcohol: 0 g (0.0 US drinks) / 0g limit (clear)");
    });

    test("a zero sugar limit is honoured too", () => {
        expect(
            formatProgress(
                sumMeals([meal()]),
                goals({ daily_sugar_g: 0 }),
                null,
            ),
        ).toContain("Sugar: 12 / 0g limit (12g over)");
    });

    // The mirror image: the echo must not promise a floor that the progress
    // line will ignore.
    test("a zero floor is listed as not set, matching how it behaves", () => {
        const text = formatGoals(
            goals({ daily_protein_g: 0, daily_fiber_g: 0 }),
            "kg",
            "us",
        );
        expect(text).toContain("- Protein: not set");
        expect(text).toContain("- Fiber: not set");
    });
});

describe("sumMeals", () => {
    test("accumulates fiber, sugar and alcohol, treating nulls as zero", () => {
        const totals = sumMeals([
            meal(),
            meal({ fiber_g: 4, sugar_g: null, alcohol_g: null }),
        ]);
        expect(totals.fiber_g).toBe(10);
        expect(totals.sugar_g).toBe(12);
        expect(totals.alcohol_g).toBe(14);
    });
});

// Every meal logged before this feature has NULL fiber/sugar/alcohol. A sum can
// treat that as zero (it adds nothing); an average cannot, or a window spanning
// the deploy divides real data by every logged day.
describe("nutrientPresence", () => {
    const blank = { fiber_g: null, sugar_g: null, alcohol_g: null };

    test("one non-null meal makes the day carry the nutrient", () => {
        expect(
            nutrientPresence([meal(blank), meal({ ...blank, fiber_g: 3 })]),
        ).toEqual({
            fiber_g: true,
            sugar_g: false,
            alcohol_g: false,
        });
    });

    test("an explicit zero is data — only null is absence", () => {
        expect(nutrientPresence([meal({ ...blank, fiber_g: 0 })])).toEqual({
            fiber_g: true,
            sugar_g: false,
            alcohol_g: false,
        });
        expect(nutrientPresence([])).toEqual({
            fiber_g: false,
            sugar_g: false,
            alcohol_g: false,
        });
    });
});

describe("rangeAverages", () => {
    const day = (over: Partial<Meal>, water = 0) => {
        const meals = [meal(over)];
        const totals = sumMeals(meals);
        totals.water_ml = water;
        return { meals, totals };
    };
    const blank = { fiber_g: null, sugar_g: null, alcohol_g: null };

    // The measured regression: 30 g of fiber a day, but a window that reaches
    // back before the columns existed, reported "5g" against a 30g target.
    test("a partial window averages over the days that record the nutrient", () => {
        const perDay = [
            ...Array.from({ length: 25 }, () => day(blank)),
            ...Array.from({ length: 5 }, () => day({ fiber_g: 30 })),
        ];
        const { averages, recordedDays } = rangeAverages(perDay);
        expect(recordedDays.fiber_g).toBe(5);
        expect(averages.fiber_g).toBe(30);
        expect(averages.fiber_g).not.toBe(5);
    });

    test("a genuinely zero day counts in both numerator and denominator", () => {
        const { averages, recordedDays } = rangeAverages([
            day({ fiber_g: 0 }),
            day({ fiber_g: 30 }),
            day(blank),
        ]);
        expect(recordedDays.fiber_g).toBe(2);
        expect(averages.fiber_g).toBe(15);
    });

    test("calories, protein, carbs, fat and water still divide by every day", () => {
        const perDay = [
            day(
                { calories: 900, protein_g: 30, carbs_g: 100, fat_g: 10 },
                1000,
            ),
            day(
                {
                    ...blank,
                    calories: 300,
                    protein_g: 10,
                    carbs_g: 20,
                    fat_g: 0,
                },
                0,
            ),
        ];
        const { averages } = rangeAverages(perDay);
        expect(averages.calories).toBe(600);
        expect(averages.protein_g).toBe(20);
        expect(averages.carbs_g).toBe(60);
        expect(averages.fat_g).toBe(5);
        expect(averages.water_ml).toBe(500);
    });

    test("a nutrient nobody recorded averages to 0 over 0 days", () => {
        const { averages, recordedDays } = rangeAverages([
            day(blank),
            day(blank),
        ]);
        expect(recordedDays.fiber_g).toBe(0);
        expect(averages.fiber_g).toBe(0);
        expect(Number.isFinite(averages.sugar_g)).toBe(true);
        expect(Number.isNaN(averages.alcohol_g)).toBe(false);
    });

    test("an empty range divides nothing by zero", () => {
        const { averages } = rangeAverages([]);
        expect(averages.calories).toBe(0);
        expect(averages.water_ml).toBe(0);
    });
});

// A pre-feature day must not print a fabricated "Fiber: 0g" — but the line
// cannot just vanish when a target is set either, or tracking looks broken.
describe("formatProgress suppresses unrecorded nutrients", () => {
    const blank = { fiber_g: null, sugar_g: null, alcohol_g: null };
    const present = nutrientPresence([meal(blank)]);
    const totals = sumMeals([meal(blank)]);

    test("no data and no target prints no line at all", () => {
        const text = formatProgress(
            totals,
            goals({ daily_fiber_g: null, daily_sugar_g: null }),
            null,
            present,
        );
        expect(text).not.toContain("Fiber");
        expect(text).not.toContain("Sugar");
        // The always-on macros are untouched.
        expect(text).toContain("Calories:");
        expect(text).toContain("Water:");
    });

    test("no data but a target set says so instead of claiming zero", () => {
        const text = formatProgress(totals, goals(), null, present);
        expect(text).toContain("Fiber: not recorded / 30g target");
        expect(text).toContain("Sugar: not recorded / 40g limit");
        expect(text).not.toContain("Fiber: 0");
        expect(text).not.toContain("Sugar: 0");
    });

    test("recorded data is reported normally", () => {
        const recorded = [meal()];
        expect(
            formatProgress(
                sumMeals(recorded),
                goals(),
                null,
                nutrientPresence(recorded),
            ),
        ).toContain("Fiber: 6 / 30g (20%, 24g to go)");
    });

    // Alcohol keeps its own gate: an opted-IN user with a 0 g limit set it
    // precisely so that a quiet day still reports 0.
    test("alcohol is never suppressed by presence, only by the opt-in", () => {
        expect(formatProgress(totals, goals(), "us", present)).toContain(
            "Alcohol: 0 g (0.0 US drinks)",
        );
        expect(formatProgress(totals, goals(), null, present)).not.toContain(
            "Alcohol",
        );
    });
});

describe("alcohol opt-in gating", () => {
    const totals = sumMeals([meal()]);

    test("progress text shows alcohol in grams AND drinks when enabled", () => {
        const text = formatProgress(totals, goals(), "us");
        expect(text).toContain(
            "Alcohol: 14 g (1.0 US drinks) / 28g limit (50%, under)",
        );
        // Fiber is a floor, sugar a ceiling, in the same block.
        expect(text).toContain("Fiber: 6 / 30g (20%, 24g to go)");
        expect(text).toContain("Sugar: 12 / 40g limit (30%, under)");
        // Neither limit offers up its remainder.
        expect(text).not.toContain("left");
    });

    test("progress text uses UK units when that is the preference", () => {
        expect(formatProgress(totals, goals(), "uk")).toContain(
            "14 g (1.8 UK units)",
        );
    });

    test("progress text omits alcohol entirely when tracking is off", () => {
        const text = formatProgress(totals, goals(), null);
        expect(text).not.toContain("Alcohol");
        // ...but fiber and sugar are never gated.
        expect(text).toContain("Fiber:");
        expect(text).toContain("Sugar:");
    });

    test("goal list hides only the alcohol target when tracking is off", () => {
        expect(formatGoals(goals(), "kg", "us")).toContain(
            "- Alcohol (max): 28 g (2.0 US drinks)",
        );
        const off = formatGoals(goals(), "kg", null);
        expect(off).not.toContain("Alcohol");
        expect(off).toContain("- Fiber: 30g");
        expect(off).toContain("- Sugar (total, max): 40g");
    });

    test("meal text hides only the alcohol line when tracking is off", () => {
        expect(formatMeal(meal(), "us")).toContain(
            "Alcohol: 14 g (1.0 US drinks)",
        );
        const off = formatMeal(meal(), null);
        expect(off).not.toContain("Alcohol");
        expect(off).toContain("Fiber: 6g");
        expect(off).toContain("Sugar: 12g");
    });

    test("a meal with no alcohol logged shows no alcohol line even when enabled", () => {
        expect(formatMeal(meal({ alcohol_g: null }), "us")).not.toContain(
            "Alcohol",
        );
    });

    test("structured payloads null alcohol out when tracking is off", () => {
        expect(totalsPayloadOf(totals, null).alcohol_g).toBeNull();
        expect(totalsPayloadOf(totals, "us").alcohol_g).toBe(14);
        expect(goalsPayloadOf(goals(), null)!.alcohol_g).toBeNull();
        expect(goalsPayloadOf(goals(), "us")!.alcohol_g).toBe(28);
        expect(mealBreakdown([meal()], null, null)[0]!.alcohol_g).toBeNull();
        expect(mealBreakdown([meal()], null, "us")[0]!.alcohol_g).toBe(14);
        // Never gated, either way.
        expect(totalsPayloadOf(totals, null).fiber_g).toBe(6);
        expect(goalsPayloadOf(goals(), null)!.sugar_g).toBe(40);
    });
});

// The insights module renders an alcohol line purely from the data, because it
// stays free of Supabase and so cannot see the per-user opt-in. gateAlcohol is
// where that flag reaches it, so these assert the end result rather than the
// zeroing: no alcohol wording in either narrative when tracking is off.
describe("gateAlcohol", () => {
    const buckets: DailyBucket[] = ["2026-07-20", "2026-07-21"].map((date) => ({
        date,
        meals: [meal()],
        waterMl: 1000,
        calories: 700,
        protein_g: 25,
        carbs_g: 90,
        fat_g: 20,
        fiber_g: 6,
        sugar_g: 12,
        alcohol_g: 14,
        mealTypes: new Set(["dinner"]),
    }));

    test("zeroes the alcohol series only when tracking is off", () => {
        expect(gateAlcohol(buckets, "us")[0]!.alcohol_g).toBe(14);
        const off = gateAlcohol(buckets, null);
        expect(off[0]!.alcohol_g).toBe(0);
        // Nothing else is touched, and the originals are left alone.
        expect(off[0]!.sugar_g).toBe(12);
        expect(off[0]!.calories).toBe(700);
        expect(buckets[0]!.alcohol_g).toBe(14);
    });

    test("keeps alcohol out of the trends narrative when tracking is off", () => {
        expect(computeTrends(gateAlcohol(buckets, "us"), goals())).toContain(
            "Alcohol",
        );
        expect(
            computeTrends(gateAlcohol(buckets, null), goals()),
        ).not.toContain("Alcohol");
    });

    test("keeps alcohol out of the weekly digest when tracking is off", () => {
        expect(
            computeWeeklyDigest(gateAlcohol(buckets, "us"), goals()),
        ).toContain("Alcohol");
        expect(
            computeWeeklyDigest(gateAlcohol(buckets, null), goals()),
        ).not.toContain("Alcohol");
    });
});

// THE CROSS-CHECK. get_trends and get_nutrition_summary aggregate the same
// meals in two different modules, and a user must not see one fiber average in
// one and a different one in the other. This test runs both halves over one
// window and asserts they agree; it fails if either side changes its rule
// without the other. The rule both must implement: fiber/sugar/alcohol average
// over the days that RECORD them, everything else over every logged day.
describe("summary and trends agree on the same window", () => {
    const END = "2026-07-26";
    const START = "2026-06-27"; // 30 days inclusive
    const dayAt = (i: number) => {
        const d = new Date(`${START}T00:00:00Z`);
        d.setUTCDate(d.getUTCDate() + i);
        return d.toISOString().slice(0, 10);
    };

    // 25 pre-feature days (NULL fiber/sugar), then one genuine zero day, then
    // four days at 30 g fiber / 20 g sugar. Fiber: 120 g over 4 recorded days
    // plus a recorded 0 => 24 g. The old `?? 0 / every logged day` rule gave 4.
    const meals: Meal[] = [];
    for (let i = 0; i < 25; i++) {
        meals.push(
            meal({
                id: `pre-${i}`,
                logged_at: `${dayAt(i)}T12:00:00.000Z`,
                calories: 600,
                fiber_g: null,
                sugar_g: null,
                alcohol_g: null,
            }),
        );
    }
    meals.push(
        meal({
            id: "zero",
            logged_at: `${dayAt(25)}T12:00:00.000Z`,
            calories: 600,
            fiber_g: 0,
            sugar_g: 0,
            alcohol_g: null,
        }),
    );
    for (let i = 26; i < 30; i++) {
        meals.push(
            meal({
                id: `post-${i}`,
                logged_at: `${dayAt(i)}T12:00:00.000Z`,
                calories: 600,
                fiber_g: 30,
                sugar_g: 20,
                alcohol_g: null,
            }),
        );
    }

    // What get_nutrition_summary does: group by local date, then rangeAverages.
    const byDate = new Map<string, Meal[]>();
    for (const m of meals) {
        const date = m.logged_at.slice(0, 10);
        byDate.set(date, [...(byDate.get(date) ?? []), m]);
    }
    const summary = rangeAverages(
        [...byDate.values()].map((dayMeals) => ({
            meals: dayMeals,
            totals: sumMeals(dayMeals),
        })),
    );

    const trendsText = computeTrends(
        buildDailyBuckets(meals, [], START, END, "UTC"),
        null,
    );

    // Pull "  30d avg: 24g" out of the "Fiber:" block of the trends narrative.
    const trendAvg = (label: string, window: string): number => {
        const section = trendsText
            .split("\n\n")
            .find((s) => s.startsWith(`${label}:`));
        if (!section) {
            throw new Error(
                `computeTrends printed no "${label}" section — if it was suppressed, the two halves disagree about what counts as no data.\n${trendsText}`,
            );
        }
        const m = section.match(
            new RegExp(`${window} avg: (-?[0-9]+(?:\\.[0-9]+)?)`),
        );
        if (!m) {
            throw new Error(
                `no "${window} avg" in the ${label} section:\n${section}`,
            );
        }
        return Number(m[1]);
    };
    const round1 = (n: number) => Math.round(n * 10) / 10;

    test("fiber: same number in both, over the recorded days only", () => {
        expect(summary.recordedDays.fiber_g).toBe(5);
        expect(round1(summary.averages.fiber_g)).toBe(24);
        expect(trendAvg("Fiber", "30d")).toBe(round1(summary.averages.fiber_g));
    });

    test("sugar: same number in both", () => {
        expect(summary.recordedDays.sugar_g).toBe(5);
        expect(round1(summary.averages.sugar_g)).toBe(16);
        expect(trendAvg("Sugar", "30d")).toBe(round1(summary.averages.sugar_g));
    });

    // NOT a test of the two calorie denominators — this fixture logs all 30 of
    // its 30 days, so "per logged day" and "per calendar day" are the same
    // divisor and the divergence issue #70 reported cannot appear here. What it
    // does prove is that a fully-logged window makes them coincide, and that
    // neither side then apologises for a gap it doesn't have. The gap case is
    // pinned in the next block.
    test("a fully-logged window: both denominators coincide, silently", () => {
        expect(byDate.size).toBe(30);
        expect(round1(summary.averages.calories)).toBe(600);
        expect(trendAvg("Calories", "30d")).toBe(600);
        expect(trendsText).not.toContain("calendar-day average");
        expect(loggedDayAverageNote(byDate.size, 30)).toBe("");
    });
});

// ---------- Regression pin for issue #70 ----------
//
// The two tools report different daily figures for the same window, and BOTH
// are right: rangeAverages divides by the days the user actually logged ("what
// does a day I eat look like?"), computeTrends divides by every calendar day
// in the window ("what am I averaging this month?"). #70 was never that one of
// them miscounts — it was that neither said which it was, so 2000 kcal in the
// summary and 1000 kcal in trends read as a bug. The fix is disclosure on both
// sides, not one shared denominator: changing either divisor would rewrite the
// figures users' history is built on. So this block pins both numbers AND both
// notes; dropping either note, or quietly unifying the denominators, fails here.
describe("logged-day and calendar-day averages diverge, and both say so (#70)", () => {
    const END = "2026-07-26";
    const START = "2026-06-27"; // 30 calendar days inclusive
    const DAYS_IN_RANGE = 30;
    const LOGGED_DAYS = 15;
    const dayAt = (i: number) => {
        const d = new Date(`${START}T00:00:00Z`);
        d.setUTCDate(d.getUTCDate() + i);
        return d.toISOString().slice(0, 10);
    };

    // Every other day logged — 15 of 30 — at a flat 2000 kcal / 100 g protein /
    // 200 g carbs / 80 g fat / 2000 ml water. A flat value on exactly half the
    // days makes the divergence exactly 2x on every nutrient, which is the
    // widest it can be and the shape the issue described. fiber/sugar/alcohol
    // stay null: they have their own covered-days denominator (tested above)
    // and would only confuse this pin.
    const meals: Meal[] = [];
    const water: WaterEntry[] = [];
    for (let i = 0; i < DAYS_IN_RANGE; i += 2) {
        meals.push(
            meal({
                id: `d-${i}`,
                logged_at: `${dayAt(i)}T12:00:00.000Z`,
                calories: 2000,
                protein_g: 100,
                carbs_g: 200,
                fat_g: 80,
                fiber_g: null,
                sugar_g: null,
                alcohol_g: null,
            }),
        );
        water.push({
            id: `w-${i}`,
            user_id: "u1",
            amount_ml: 2000,
            logged_at: `${dayAt(i)}T12:00:00.000Z`,
            notes: null,
            created_at: `${dayAt(i)}T12:00:00.000Z`,
            idempotency_key: null,
        });
    }

    // The summary's own aggregation: group by local date, then rangeAverages
    // over only the dates that exist (byDate never holds an unlogged day).
    const byDate = new Map<string, Meal[]>();
    for (const m of meals) {
        const date = m.logged_at.slice(0, 10);
        byDate.set(date, [...(byDate.get(date) ?? []), m]);
    }
    const summary = rangeAverages(
        [...byDate.entries()].sort().map(([, dayMeals]) => {
            const totals = sumMeals(dayMeals);
            totals.water_ml = 2000;
            return { meals: dayMeals, totals };
        }),
    );

    const trendsText = computeTrends(
        buildDailyBuckets(meals, water, START, END, "UTC"),
        null,
    );

    test("the summary averages over the 15 logged days", () => {
        expect(byDate.size).toBe(LOGGED_DAYS);
        expect(summary.averages.calories).toBe(2000);
        expect(summary.averages.protein_g).toBe(100);
        expect(summary.averages.carbs_g).toBe(200);
        expect(summary.averages.fat_g).toBe(80);
        expect(summary.averages.water_ml).toBe(2000);
    });

    // Same data, half the figure, because the 15 unlogged days count as zeros.
    test("trends averages the same nutrients over all 30 calendar days", () => {
        expect(trendsText).toContain("30d avg: 1000 kcal");
        expect(trendsText).toContain("30d avg: 50g"); // protein
        expect(trendsText).toContain("30d avg: 100g"); // carbs
        expect(trendsText).toContain("30d avg: 40g"); // fat
        expect(trendsText).toContain("30d avg: 1000 ml");
    });

    test("every trends figure carries the calendar-day note", () => {
        for (const line of [
            "30d avg: 1000 kcal",
            "30d avg: 50g",
            "30d avg: 100g",
            "30d avg: 40g",
            "30d avg: 1000 ml",
        ]) {
            expect(trendsText).toContain(
                `${line} (calendar-day average; ${LOGGED_DAYS} of ${DAYS_IN_RANGE} days logged)`,
            );
        }
    });

    test("the summary note names the same two numbers, the other way round", () => {
        const note = loggedDayAverageNote(LOGGED_DAYS, DAYS_IN_RANGE);
        expect(note).toContain(`${LOGGED_DAYS} of the ${DAYS_IN_RANGE} days`);
        expect(note).toContain("per logged day");
        expect(note).toContain("get_trends");
    });
});

describe("start_meal_import payload", () => {
    const base = {
        tz: "Europe/Kyiv",
        tzConfigured: true,
        widgetsEnabled: true,
    };

    // drink_unit is the whole alcohol gate for this flow: non-null means the
    // importer may map, preview and send the file's alcohol column, in that
    // unit; null means it does none of the three (see startImportPayload).
    test("carries the drink unit when the user tracks alcohol", () => {
        expect(startImportPayload({ ...base, alcohol: "us" }).drink_unit).toBe(
            "us",
        );
        expect(startImportPayload({ ...base, alcohol: "uk" }).drink_unit).toBe(
            "uk",
        );
    });

    // The bug: with no drink_unit at all, the importer auto-mapped an alcohol
    // column and showed per-row ethanol to a user who had tracking off.
    test("drink_unit is null when alcohol tracking is off", () => {
        expect(
            startImportPayload({ ...base, alcohol: null }).drink_unit,
        ).toBeNull();
    });

    test("the payload satisfies the declared outputSchema either way", () => {
        for (const alcohol of ["us", null] as const) {
            const parsed = z
                .object(START_IMPORT_OUTPUT_SCHEMA)
                .parse(startImportPayload({ ...base, alcohol }));
            expect(parsed.import_tool_name).toBe("bulk_import_meals");
            expect(parsed.tz).toBe("Europe/Kyiv");
            expect(parsed.max_rows_per_call).toBeGreaterThan(0);
        }
    });
});

// formatFoodResult lives in foods.ts but its rendering is part of this pass, and
// its gate is fed by the same alcohol opt-in threaded through mcp.ts — so its
// gating cases are covered here rather than in the food-lookup suite.
describe("formatFoodResult", () => {
    const beer: FoodResult = {
        name: "Lager",
        brand: "Brewery",
        serving: "330 ml",
        calories: 140,
        protein_g: 1,
        carbs_g: 11,
        fat_g: 0,
        fiber_g: 0.5,
        sugar_g: 0.2,
        alcohol_g: 13,
        source: "off:1234567890123",
        source_name: "openfoodfacts",
        barcode: "1234567890123",
    };

    test("always shows fiber and total sugar", () => {
        const text = formatFoodResult(beer);
        expect(text).toContain("Fiber: 0.5 g");
        expect(text).toContain("Sugar (total): 0.2 g");
    });

    test("renders n/a rather than 0 for an absent fiber or sugar figure", () => {
        const text = formatFoodResult({
            ...beer,
            fiber_g: null,
            sugar_g: null,
        });
        expect(text).toContain("Fiber: n/a");
        expect(text).toContain("Sugar (total): n/a");
    });

    test("shows alcohol only when the user tracks it", () => {
        expect(formatFoodResult(beer, "us")).toContain(
            "Alcohol: 13 g (0.9 US drinks)",
        );
        expect(formatFoodResult(beer, "uk")).toContain("(1.6 UK units)");
        expect(formatFoodResult(beer)).not.toContain("Alcohol");
        expect(formatFoodResult(beer, null)).not.toContain("Alcohol");
    });

    test("omits alcohol when Open Food Facts could not resolve it", () => {
        expect(
            formatFoodResult({ ...beer, alcohol_g: null }, "us"),
        ).not.toContain("Alcohol");
    });
});

// A .nullable() field is emitted as REQUIRED with anyOf[type, null], so a
// payload that omits a key fails validation instead of defaulting to null.
// These parses are the guard that every builder emits a complete literal.
describe("structuredContent literals satisfy their schemas", () => {
    const totals = sumMeals([meal()]);

    test("totals, goals and breakdown parse with alcohol on and off", () => {
        for (const alcohol of ["us", null] as const) {
            expect(() =>
                TOTALS_ITEM.parse(totalsPayloadOf(totals, alcohol)),
            ).not.toThrow();
            expect(() =>
                GOALS_ITEM.parse(goalsPayloadOf(goals(), alcohol)),
            ).not.toThrow();
            expect(() =>
                z
                    .array(MEAL_BREAKDOWN_ITEM)
                    .parse(mealBreakdown([meal()], "UTC", alcohol)),
            ).not.toThrow();
        }
    });

    test("goalsPayloadOf keeps every cleared target as an explicit null", () => {
        const parsed = GOALS_ITEM.parse(
            goalsPayloadOf(
                goals({
                    daily_fiber_g: null,
                    daily_sugar_g: null,
                    daily_alcohol_g: null,
                }),
                "us",
            ),
        );
        expect(parsed.fiber_g).toBeNull();
        expect(parsed.sugar_g).toBeNull();
        expect(parsed.alcohol_g).toBeNull();
    });

    test("no goals at all is null, not a half-filled object", () => {
        expect(goalsPayloadOf(null, "us")).toBeNull();
    });
});

// Regression coverage for https://github.com/akutishevsky/nutrition-mcp/issues/67:
// the trends widget re-averaged fiber/sugar/alcohol over every day in a slice
// instead of only the days that recorded them, because a day's per-day payload
// summed those nutrients with `?? 0` just like every other totals payload — so
// the widget's client-side average (trends.html's avgOf) could never tell "not
// recorded" from "recorded zero". trendsDayPayloadOf is the fix: it nulls out
// fiber_g/sugar_g/alcohol_g on a day that dayCarries says didn't record them.
describe("trendsDayPayloadOf", () => {
    const bucketWith = (mealsForDay: Meal[]): DailyBucket => ({
        date: "2026-07-20",
        meals: mealsForDay,
        waterMl: 1000,
        calories: mealsForDay.reduce((s, m) => s + (m.calories ?? 0), 0),
        protein_g: 25,
        carbs_g: 90,
        fat_g: 20,
        fiber_g: mealsForDay.reduce((s, m) => s + (m.fiber_g ?? 0), 0),
        sugar_g: mealsForDay.reduce((s, m) => s + (m.sugar_g ?? 0), 0),
        alcohol_g: mealsForDay.reduce((s, m) => s + (m.alcohol_g ?? 0), 0),
        mealTypes: new Set(["dinner"]),
    });

    test("nulls fiber/sugar/alcohol on a day that never recorded them", () => {
        const bucket = bucketWith([
            meal({ fiber_g: null, sugar_g: null, alcohol_g: null }),
        ]);
        const payload = trendsDayPayloadOf(bucket, "us");
        expect(payload.fiber_g).toBeNull();
        expect(payload.sugar_g).toBeNull();
        expect(payload.alcohol_g).toBeNull();
        // Everything else sums normally — only the three partial nutrients
        // get the covered-days treatment.
        expect(payload.calories).toBe(bucket.calories);
        expect(() => TRENDS_DAY_ITEM.parse(payload)).not.toThrow();
    });

    test("keeps a real recorded zero as 0, not null", () => {
        const bucket = bucketWith([
            meal({ fiber_g: 0, sugar_g: 0, alcohol_g: 0 }),
        ]);
        const payload = trendsDayPayloadOf(bucket, "us");
        expect(payload.fiber_g).toBe(0);
        expect(payload.sugar_g).toBe(0);
        expect(payload.alcohol_g).toBe(0);
    });

    test("alcohol tracking off nulls alcohol_g regardless of coverage", () => {
        const bucket = bucketWith([meal({ alcohol_g: 14 })]);
        expect(trendsDayPayloadOf(bucket, null).alcohol_g).toBeNull();
    });

    test("a day with no meals at all is null across all three partial nutrients", () => {
        const payload = trendsDayPayloadOf(bucketWith([]), "us");
        expect(payload.fiber_g).toBeNull();
        expect(payload.sugar_g).toBeNull();
        expect(payload.alcohol_g).toBeNull();
        expect(() => TRENDS_DAY_ITEM.parse(payload)).not.toThrow();
    });

    // The exact drift the issue reported: fiber recorded on 5 of 30 days at
    // 30 g averaged out to 5 g/day in the widget (150 / 30) instead of 30
    // (150 / 5). Once uncovered days are null, filtering them out before
    // averaging — what the fixed client-side avgOf now does — recovers 30.
    test("covered-days average recovers the true figure once uncovered days are null", () => {
        const covered = Array.from({ length: 5 }, () =>
            trendsDayPayloadOf(bucketWith([meal({ fiber_g: 30 })]), "us"),
        );
        const uncovered = Array.from({ length: 25 }, () =>
            trendsDayPayloadOf(bucketWith([meal({ fiber_g: null })]), "us"),
        );
        const days = [...uncovered, ...covered];
        const seen = days.filter((d) => d.fiber_g != null);
        expect(seen).toHaveLength(5);
        const avg = seen.reduce((s, d) => s + d.fiber_g!, 0) / seen.length;
        expect(avg).toBe(30);
    });
});

// ---------- Tool-level integration harness ----------
//
// Everything above exercises exported pure functions. Some things have no pure
// core to reach that way: set_alcohol_tracking and get_alcohol_tracking ARE
// their handler — read or write one profile column, then pick a sentence — and
// a mutation audit found that inverting either tool's enabled state failed
// nothing. So the tools below are registered on a real McpServer and driven
// through a real client over an in-memory transport, with only ./supabase.js
// stubbed. That also puts the input schemas under test end-to-end, which is the
// only way to prove a bad argument is rejected BEFORE the handler runs.
//
// mock.module swaps the module for the whole test *process*, not just this
// file, so the real exports are spread back in (replacing it wholesale would
// break every other suite) and restored in afterAll. Same pattern as
// middleware.test.ts.

const PROFILE_BASE: actualSupabase.Profile = {
    user_id: "u1",
    timezone: "UTC",
    preferred_weight_unit: null,
    widgets_enabled: true,
    alcohol_tracking_enabled: false,
    preferred_drink_unit: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
};

/** What the DB would hand back after a write: every nutrient absent unless the
 *  caller sent it. Building on the `meal()` fixture instead would silently give
 *  every write its 14 g of alcohol, hiding exactly the gating this tests. */
function storedMeal(input: Record<string, unknown>): Meal {
    const defined = Object.fromEntries(
        Object.entries(input).filter(([, v]) => v !== undefined),
    ) as Partial<Meal>;
    return meal({
        calories: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        fiber_g: null,
        sugar_g: null,
        alcohol_g: null,
        ...defined,
    });
}

const db = {
    profile: null as actualSupabase.Profile | null,
    goals: null as NutritionGoals | null,
    meals: [] as Meal[],
    water: [] as WaterEntry[],
    inserted: [] as Record<string, unknown>[],
    profilePatches: [] as Record<string, unknown>[],
    // Ids the delete stubs consider to exist. Deleting one removes it, so a
    // second delete of the same id reports "not found" like the real table.
    rowIds: new Set<string>(),
    analyticsRows: [] as Record<string, unknown>[],
    accountWipes: 0,
};

mock.module("./supabase.js", () => ({
    ...actualSupabase,
    // analytics.ts persists every tool call through getSupabase(); intercept it
    // so a test never depends on Supabase env vars being present, and so the
    // rows it would have written can be asserted on.
    getSupabase: () => ({
        from: (table: string) => ({
            insert: async (row: Record<string, unknown>) => {
                if (table === "tool_analytics") db.analyticsRows.push(row);
                return { error: null };
            },
        }),
    }),
    deleteAllUserData: async () => {
        db.accountWipes += 1;
    },
    getProfile: async () => db.profile,
    getUserTimezone: async () => db.profile?.timezone ?? "UTC",
    getNutritionGoals: async () => db.goals,
    getMealsByDate: async () => db.meals,
    getWaterByDate: async () => [],
    // The range readers behind get_nutrition_summary. They ignore the dates and
    // hand back whatever the test staged: the fixtures below already sit inside
    // the window they ask for, and filtering here would only re-implement the
    // query under test.
    getMealsInRange: async () => db.meals,
    getWaterInRange: async () => db.water,
    insertMeal: async (_userId: string, input: Record<string, unknown>) => {
        db.inserted.push(input);
        const saved = storedMeal(input);
        db.meals = [saved];
        return { meal: saved, deduplicated: false };
    },
    updateMeal: async (
        _userId: string,
        id: string,
        fields: Record<string, unknown>,
    ) => {
        const saved = storedMeal({ ...fields, id });
        db.meals = [saved];
        return saved;
    },
    deleteMeal: async (_userId: string, id: string) => {
        const before = db.meals.length;
        db.meals = db.meals.filter((m) => m.id !== id);
        return db.meals.length < before;
    },
    deleteWater: async (_userId: string, id: string) => db.rowIds.delete(id),
    deleteWeight: async (_userId: string, id: string) => db.rowIds.delete(id),
    countMeals: async () => db.meals.length,
    existingIdempotencyKeys: async () => new Set<string>(),
    getPreferredWeightUnit: async () =>
        db.profile?.preferred_weight_unit ?? null,
    upsertNutritionGoals: async (
        _userId: string,
        patch: Record<string, unknown>,
    ) => {
        db.goals = { ...goals(), ...patch } as NutritionGoals;
        return db.goals;
    },
    upsertProfile: async (userId: string, patch: Record<string, unknown>) => {
        db.profilePatches.push(patch);
        db.profile = {
            ...(db.profile ?? { ...PROFILE_BASE, user_id: userId }),
            ...patch,
        } as actualSupabase.Profile;
        return db.profile;
    },
}));

afterAll(() => {
    mock.module("./supabase.js", () => actualSupabase);
});

beforeEach(() => {
    db.profile = { ...PROFILE_BASE };
    db.goals = null;
    db.meals = [];
    db.water = [];
    db.inserted = [];
    db.profilePatches = [];
    db.rowIds = new Set<string>();
    db.analyticsRows = [];
    db.accountWipes = 0;
});

interface ToolResult {
    content: { type: string; text: string }[];
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
}

type CallTool = (
    name: string,
    args?: Record<string, unknown>,
) => Promise<ToolResult>;

/** Register the real tools for a user whose alcohol gate is `alcohol`, then
 *  drive them through a client. `alcohol` is the whole opt-in: null = off. */
async function withTools(
    alcohol: "us" | "uk" | null,
    run: (call: CallTool) => Promise<void>,
): Promise<void> {
    const server = new McpServer(
        { name: "nutrition-mcp-test", version: "0.0.0" },
        { capabilities: { tools: {}, resources: {} } },
    );
    registerTools(server, "u1", true, alcohol);
    const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
    ]);
    try {
        await run(
            (name, args = {}) =>
                client.callTool({
                    name,
                    arguments: args,
                }) as Promise<ToolResult>,
        );
    } finally {
        await client.close();
        await server.close();
    }
}

const textOf = (r: ToolResult) => r.content.map((c) => c.text).join("\n");

// ---------- (1) numeric bounds ----------

describe("write-tool numeric bounds", () => {
    // These bounds must equal the ones bulk_import_meals enforces, or the same
    // figure is accepted through one door and refused at the other. There is no
    // drift test because there is nothing to drift: src/import.ts owns the three
    // constants and src/mcp.ts re-exports them, so both doors read one value.

    // numeric(6,2) — one more digit is a Postgres "numeric field overflow",
    // which is not something a model should have to learn by hitting it.
    test("the goal ceiling is what numeric(6,2) can hold", () => {
        expect(MAX_GOAL_G).toBe(9999.99);
    });

    // Was: -1 sailed through Zod, hit the migration's `check (fiber_g >= 0)`
    // and surfaced a raw Postgres constraint error to the model.
    test("log_meal rejects a negative gram figure before touching the DB", async () => {
        await withTools(null, async (call) => {
            const r = await call("log_meal", {
                description: "Oatmeal",
                meal_type: "breakfast",
                fiber_g: -1,
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("fiber_g");
            expect(db.inserted).toHaveLength(0);
        });
    });

    // WHY the upper bound exists, demonstrated on the payload builder: zod 4
    // accepts 1e308 (it only refuses Infinity), and the rounding every totals
    // path does turns 1e308 into Infinity. One such row therefore broke every
    // LATER get_nutrition_summary / get_goal_progress / log_meal for that date
    // on outputSchema validation, until someone deleted it by hand.
    test("an unbounded 1e308 figure would poison every later read of that date", () => {
        const payload = totalsPayloadOf(
            sumMeals([meal({ fiber_g: 1e308 })]),
            null,
        );
        expect(payload.fiber_g).toBe(Infinity);
        expect(TOTALS_ITEM.safeParse(payload).success).toBe(false);
    });

    test("...and log_meal now refuses to create that row in the first place", async () => {
        await withTools(null, async (call) => {
            for (const field of [
                "calories",
                "protein_g",
                "carbs_g",
                "fat_g",
                "fiber_g",
                "sugar_g",
                "alcohol_g",
            ]) {
                const r = await call("log_meal", {
                    description: "Oatmeal",
                    meal_type: "breakfast",
                    [field]: 1e308,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain(field);
            }
            expect(db.inserted).toHaveLength(0);
        });
    });

    test("update_meal is bounded the same way", async () => {
        await withTools(null, async (call) => {
            expect(
                (await call("update_meal", { id: "m1", sugar_g: -0.5 }))
                    .isError,
            ).toBe(true);
            expect(
                (await call("update_meal", { id: "m1", alcohol_g: 1e308 }))
                    .isError,
            ).toBe(true);
        });
    });

    // 500 g of ethanol is already ~36 US drinks in one entry; the import path
    // has drawn the line there since it shipped.
    test("alcohol has a tighter ceiling than the other macros", async () => {
        await withTools("us", async (call) => {
            const ok = await call("log_meal", {
                description: "Wine",
                meal_type: "dinner",
                alcohol_g: MAX_ALCOHOL_G,
            });
            expect(ok.isError).toBeFalsy();
            const tooMuch = await call("log_meal", {
                description: "Wine",
                meal_type: "dinner",
                alcohol_g: MAX_ALCOHOL_G + 1,
            });
            expect(tooMuch.isError).toBe(true);
        });
    });

    test("the top of each range is still accepted", async () => {
        await withTools(null, async (call) => {
            const r = await call("log_meal", {
                description: "A very large day",
                meal_type: "dinner",
                calories: MAX_CALORIES,
                fiber_g: MAX_MACRO_G,
                sugar_g: 0,
            });
            expect(r.isError).toBeFalsy();
            expect(db.inserted).toHaveLength(1);
        });
    });

    test("set_nutrition_goals rejects negatives and numeric(6,2) overflow", async () => {
        await withTools(null, async (call) => {
            expect(
                (await call("set_nutrition_goals", { daily_fiber_g: -1 }))
                    .isError,
            ).toBe(true);
            expect(
                (
                    await call("set_nutrition_goals", {
                        daily_sugar_g: MAX_GOAL_G + 1,
                    })
                ).isError,
            ).toBe(true);
            expect(
                (await call("set_nutrition_goals", { daily_alcohol_g: 1e308 }))
                    .isError,
            ).toBe(true);
        });
    });

    // Clearing a target must survive the bounds: null is not a number and must
    // not be caught by .min(0).
    test("null still clears a goal", async () => {
        db.goals = null;
        await withTools(null, async (call) => {
            const r = await call("set_nutrition_goals", {
                daily_fiber_g: null,
            });
            expect(r.isError).toBeFalsy();
        });
    });
});

// ---------- (2) the alcohol discovery nudge ----------

describe("alcoholHiddenNote", () => {
    test("says nothing when the user already tracks alcohol", () => {
        expect(alcoholHiddenNote(true, "us", "Alcohol saved")).toBe("");
        expect(alcoholHiddenNote(true, "uk", "Alcohol saved")).toBe("");
    });

    test("says nothing when the write carried no alcohol", () => {
        expect(alcoholHiddenNote(false, null, "Alcohol saved")).toBe("");
    });

    test("names the setting only when both conditions hold", () => {
        const note = alcoholHiddenNote(true, null, "Alcohol target saved");
        expect(note).toContain("Alcohol target saved");
        expect(note).toContain("set_alcohol_tracking");
        expect(note).toContain("not shown");
    });
});

describe("log_meal / update_meal surface hidden alcohol", () => {
    const beer = {
        description: "Two beers",
        meal_type: "dinner",
        alcohol_g: 26,
    };

    // The whole point: with tracking off, alcohol is stored but appears in no
    // meal line, no goal line and no widget stat, so without this note the user
    // has no way to learn the feature exists.
    test("log_meal nudges when alcohol is stored but hidden", async () => {
        await withTools(null, async (call) => {
            const text = textOf(await call("log_meal", beer));
            expect(text).toContain("set_alcohol_tracking");
            expect(db.inserted[0]!.alcohol_g).toBe(26);
        });
    });

    // REPORT ONLY. Auto-enabling would surface alcohol to a user who never
    // asked for it — the exact harm the opt-in exists to prevent.
    test("the nudge never turns tracking on by itself", async () => {
        await withTools(null, async (call) => {
            await call("log_meal", beer);
            expect(db.profilePatches).toHaveLength(0);
            expect(db.profile!.alcohol_tracking_enabled).toBe(false);
        });
    });

    test("no nudge once the user tracks alcohol — it is already on screen", async () => {
        await withTools("us", async (call) => {
            const text = textOf(await call("log_meal", beer));
            expect(text).not.toContain("set_alcohol_tracking");
            expect(text).toContain("Alcohol:");
        });
    });

    test("no nudge for a meal with no alcohol, or with exactly zero", async () => {
        await withTools(null, async (call) => {
            const plain = textOf(
                await call("log_meal", {
                    description: "Oatmeal",
                    meal_type: "breakfast",
                    calories: 300,
                }),
            );
            expect(plain).not.toContain("set_alcohol_tracking");
            const zero = textOf(
                await call("log_meal", {
                    description: "Alcohol-free beer",
                    meal_type: "snack",
                    alcohol_g: 0,
                }),
            );
            expect(zero).not.toContain("set_alcohol_tracking");
        });
    });

    test("update_meal nudges on the same terms", async () => {
        await withTools(null, async (call) => {
            const text = textOf(
                await call("update_meal", { id: "m1", alcohol_g: 14 }),
            );
            expect(text).toContain("set_alcohol_tracking");
        });
        await withTools("uk", async (call) => {
            const text = textOf(
                await call("update_meal", { id: "m1", alcohol_g: 14 }),
            );
            expect(text).not.toContain("set_alcohol_tracking");
        });
    });
});

// ---------- (3) the two alcohol-setting tools ----------

describe("set_alcohol_tracking", () => {
    test("enabling writes the flag and confirms it", async () => {
        await withTools(null, async (call) => {
            const r = await call("set_alcohol_tracking", { enabled: true });
            expect(db.profilePatches[0]!.alcohol_tracking_enabled).toBe(true);
            expect(db.profile!.alcohol_tracking_enabled).toBe(true);
            const text = textOf(r);
            expect(text).toContain("enabled");
            expect(text).not.toContain("disabled");
            expect(text).toContain("US standard drinks");
        });
    });

    test("disabling writes false and says so", async () => {
        db.profile = { ...PROFILE_BASE, alcohol_tracking_enabled: true };
        await withTools("us", async (call) => {
            const r = await call("set_alcohol_tracking", { enabled: false });
            expect(db.profilePatches[0]!.alcohol_tracking_enabled).toBe(false);
            expect(db.profile!.alcohol_tracking_enabled).toBe(false);
            expect(textOf(r)).toContain("disabled");
            expect(textOf(r)).toContain("already logged is kept");
        });
    });

    test("drink_unit is stored when given and left alone when omitted", async () => {
        await withTools(null, async (call) => {
            await call("set_alcohol_tracking", {
                enabled: true,
                drink_unit: "uk",
            });
            expect(db.profile!.preferred_drink_unit).toBe("uk");
            // Toggling off and on again must not reset the saved unit, so the
            // patch may not carry preferred_drink_unit at all.
            await call("set_alcohol_tracking", { enabled: false });
            expect(db.profilePatches[1]).not.toHaveProperty(
                "preferred_drink_unit",
            );
            const r = await call("set_alcohol_tracking", { enabled: true });
            expect(textOf(r)).toContain("UK units");
        });
    });

    test("rejects a drink unit that is not us or uk", async () => {
        await withTools(null, async (call) => {
            const r = await call("set_alcohol_tracking", {
                enabled: true,
                drink_unit: "metric",
            });
            expect(r.isError).toBe(true);
            expect(db.profilePatches).toHaveLength(0);
        });
    });

    // The old copy told the user the change landed "from the next
    // conversation" and that an open chat might keep the previous setting.
    // Both were false: handleMcp builds a fresh McpServer per POST
    // (sessionIdGenerator: undefined) and buildMcpServer re-reads the profile
    // each time, and unlike widgets_enabled the gate touches no registration
    // metadata that a host would need a tools/list refresh to pick up.
    test("does not tell the user to start a new chat", async () => {
        await withTools(null, async (call) => {
            const on = textOf(
                await call("set_alcohol_tracking", { enabled: true }),
            );
            const off = textOf(
                await call("set_alcohol_tracking", { enabled: false }),
            );
            for (const text of [on, off]) {
                expect(text).not.toContain("next conversation");
                expect(text).not.toContain("reconnect");
                expect(text).not.toContain("new conversation");
            }
        });
    });

    test("its description does not repeat the reconnect caveat either", async () => {
        await withTools(null, async () => {});
        const server = new McpServer(
            { name: "t", version: "0.0.0" },
            { capabilities: { tools: {}, resources: {} } },
        );
        registerTools(server, "u1", true, null);
        const [ct, st] = InMemoryTransport.createLinkedPair();
        const client = new Client({ name: "c", version: "0.0.0" });
        await Promise.all([server.connect(st), client.connect(ct)]);
        const { tools } = await client.listTools();
        const setAlcohol = tools.find((t) => t.name === "set_alcohol_tracking");
        expect(setAlcohol?.description).not.toContain("until it reconnects");
        // set_widget_display KEEPS its caveat: widgets_enabled decides each
        // tool's _meta.ui link, which really does need a tools/list refresh.
        const setWidgets = tools.find((t) => t.name === "set_widget_display");
        expect(setWidgets?.description).toContain("reconnects");
        await client.close();
        await server.close();
    });
});

describe("get_alcohol_tracking", () => {
    test("reports enabled with the saved unit", async () => {
        db.profile = {
            ...PROFILE_BASE,
            alcohol_tracking_enabled: true,
            preferred_drink_unit: "uk",
        };
        await withTools("uk", async (call) => {
            const text = textOf(await call("get_alcohol_tracking", {}));
            expect(text).toContain("is enabled");
            expect(text).toContain("UK units");
            expect(text).not.toContain("no preference saved");
        });
    });

    test("flags the US fallback as a default, not a choice", async () => {
        db.profile = { ...PROFILE_BASE, alcohol_tracking_enabled: true };
        await withTools("us", async (call) => {
            const text = textOf(await call("get_alcohol_tracking", {}));
            expect(text).toContain("US standard drinks");
            expect(text).toContain("no preference saved");
        });
    });

    test("reports disabled, and that stored alcohol is kept", async () => {
        await withTools(null, async (call) => {
            const text = textOf(await call("get_alcohol_tracking", {}));
            expect(text).toContain("is disabled");
            expect(text).toContain("still stored");
            expect(text).toContain("set_alcohol_tracking");
        });
    });

    // A profile row that has never been touched must read as OFF: the fallback
    // is the opt-in itself.
    test("no profile row at all reads as disabled", async () => {
        db.profile = null;
        await withTools(null, async (call) => {
            expect(textOf(await call("get_alcohol_tracking", {}))).toContain(
                "is disabled",
            );
        });
    });
});

describe("bulk_import_meals surfaces hidden alcohol", () => {
    const oatmeal = {
        source_line: 1,
        description: "Oatmeal",
        logged_at: "2026-07-20",
        calories: 300,
    };
    const beer = {
        source_line: 2,
        description: "Beer",
        logged_at: "2026-07-20",
        calories: 140,
        alcohol_g: 13,
    };
    const call = (
        c: CallTool,
        meals: Record<string, unknown>[],
        extra: Record<string, unknown> = {},
    ) =>
        c("bulk_import_meals", {
            meals,
            expected_row_count: meals.length,
            dry_run: false,
            ...extra,
        });

    // A backfill is where this matters most: dozens of rows of alcohol can land
    // and, with the gate off, none of it appears anywhere afterwards.
    test("nudges once when an imported row carried alcohol", async () => {
        await withTools(null, async (c) => {
            const text = textOf(await call(c, [oatmeal, beer]));
            expect(text).toContain("Alcohol saved with these meals");
            expect(text).toContain("set_alcohol_tracking");
            expect(db.profilePatches).toHaveLength(0);
        });
    });

    test("stays quiet when no row carried alcohol", async () => {
        await withTools(null, async (c) => {
            const text = textOf(await call(c, [oatmeal]));
            expect(text).not.toContain("set_alcohol_tracking");
        });
    });

    test("stays quiet when the user already tracks alcohol", async () => {
        await withTools("us", async (c) => {
            const text = textOf(await call(c, [oatmeal, beer]));
            expect(text).not.toContain("set_alcohol_tracking");
        });
    });

    // The note reads args.meals by the result row's `index`, so it must follow
    // the ROW that landed, not just "some row in the batch had alcohol". A row
    // rejected by validateRow stored nothing to be told about — and an
    // off-by-one here would blame the wrong row's alcohol.
    test("a rejected alcohol row does not trigger it", async () => {
        await withTools(null, async (c) => {
            const text = textOf(
                await call(c, [oatmeal, { ...beer, alcohol_g: 10_000 }]),
            );
            expect(text).not.toContain("set_alcohol_tracking");
        });
    });

    // "saved" would be a lie on a dry run — nothing was written yet.
    test("a dry run says it would be saved, not that it was", async () => {
        await withTools(null, async (c) => {
            const text = textOf(
                await call(c, [oatmeal, beer], { dry_run: true }),
            );
            expect(text).toContain("would be saved");
            expect(text).not.toContain("Alcohol saved with these meals");
            expect(text).toContain("set_alcohol_tracking");
        });
    });
});

// ---------- delete tools report what actually happened ----------

// A delete that matched no row (stale id, typo, or an id belonging to another
// user — filtered out by the `user_id` eq) used to still print "deleted", so
// the model told the user the entry was gone while it kept showing up in every
// summary and total. Each handler must branch on whether a row matched.
describe("delete tools distinguish deleted from not-found", () => {
    const cases: {
        tool: string;
        id: string;
        seed: (id: string) => void;
        deleted: string;
        notFound: string;
    }[] = [
        {
            tool: "delete_meal",
            id: "m1",
            seed: (id) => {
                db.meals = [storedMeal({ id })];
            },
            deleted: "Meal m1 deleted.",
            notFound: "No meal found with id m1.",
        },
        {
            tool: "delete_water",
            id: "w1",
            seed: (id) => db.rowIds.add(id),
            deleted: "Water entry w1 deleted.",
            notFound: "No water entry found with id w1.",
        },
        {
            tool: "delete_weight",
            id: "k1",
            seed: (id) => db.rowIds.add(id),
            deleted: "Weight entry k1 deleted.",
            notFound: "No weight entry found with id k1.",
        },
    ];

    for (const c of cases) {
        test(`${c.tool} confirms a row it removed`, async () => {
            c.seed(c.id);
            await withTools(null, async (call) => {
                expect(textOf(await call(c.tool, { id: c.id }))).toBe(
                    c.deleted,
                );
            });
        });

        test(`${c.tool} does not claim success for an unknown id`, async () => {
            await withTools(null, async (call) => {
                const text = textOf(await call(c.tool, { id: c.id }));
                expect(text).toBe(c.notFound);
                expect(text).not.toContain("deleted.");
            });
        });
    }
});

// ---------- delete_account leaves no trace of the deleted user ----------

// deleteAllUserData deletes tool_analytics first, then withAnalytics inserts a
// fresh row once the handler resolves. tool_analytics.user_id is a plain
// varchar with no FK, so that insert succeeds and puts the just-deleted user's
// id straight back into the table the tool promised it had emptied. The row
// itself is still worth keeping — it must simply not be attributable.
describe("delete_account analytics", () => {
    const rowsFor = (tool: string) =>
        db.analyticsRows.filter((r) => r.tool_name === tool);

    test("a completed deletion is recorded under the sentinel, not the user", async () => {
        await withTools(null, async (call) => {
            expect(
                textOf(await call("delete_account", { confirm: true })),
            ).toContain("permanently deleted");
        });

        expect(db.accountWipes).toBe(1);
        const rows = rowsFor("delete_account");
        expect(rows).toHaveLength(1);
        expect(rows[0]!.user_id).toBe(DELETED_ACCOUNT_ANALYTICS_ID);
        expect(rows[0]!.success).toBe(true);
        expect(db.analyticsRows.some((r) => r.user_id === "u1")).toBe(false);
    });

    test("a cancelled deletion stays attributed to the user", async () => {
        await withTools(null, async (call) => {
            expect(
                textOf(await call("delete_account", { confirm: false })),
            ).toContain("cancelled");
        });

        expect(db.accountWipes).toBe(0);
        const rows = rowsFor("delete_account");
        expect(rows).toHaveLength(1);
        expect(rows[0]!.user_id).toBe("u1");
    });

    test("other tools still record the real user id", async () => {
        await withTools(null, async (call) => {
            await call("get_timezone");
        });

        const rows = rowsFor("get_timezone");
        expect(rows).toHaveLength(1);
        expect(rows[0]!.user_id).toBe("u1");
    });
});

// ---------- the summary states its own denominator (issue #70) ----------
//
// The unit-level pin above proves the two aggregations legitimately disagree.
// This proves get_nutrition_summary SAYS so, which is the actual fix: the
// calendar length of the window rides on the wire next to logged_days, and the
// text warns the model that get_trends will print a smaller figure for the same
// days. Neither is reachable from a pure function — both are assembled in the
// handler — so this goes through the real tool.
describe("get_nutrition_summary discloses its logged-day denominator", () => {
    const START = "2026-06-27";
    const END = "2026-07-26"; // 30 calendar days inclusive
    const dayAt = (i: number) => {
        const d = new Date(`${START}T00:00:00Z`);
        d.setUTCDate(d.getUTCDate() + i);
        return d.toISOString().slice(0, 10);
    };

    /** `step` 2 logs every other day (15 of 30), `step` 1 logs all 30. */
    function stage(step: number): void {
        db.meals = [];
        db.water = [];
        for (let i = 0; i < 30; i += step) {
            db.meals.push(
                meal({
                    id: `d-${i}`,
                    logged_at: `${dayAt(i)}T12:00:00.000Z`,
                    calories: 2000,
                    protein_g: 100,
                    carbs_g: 200,
                    fat_g: 80,
                    fiber_g: null,
                    sugar_g: null,
                    alcohol_g: null,
                }),
            );
            db.water.push({
                id: `w-${i}`,
                user_id: "u1",
                amount_ml: 2000,
                logged_at: `${dayAt(i)}T12:00:00.000Z`,
                notes: null,
                created_at: `${dayAt(i)}T12:00:00.000Z`,
                idempotency_key: null,
            });
        }
    }

    interface SummaryPayload {
        logged_days: number;
        days_in_range: number;
        averages: Record<string, number>;
    }

    const summarize = async (call: CallTool) =>
        call("get_nutrition_summary", { start_date: START, end_date: END });

    test("a half-logged window reports 15 logged days out of 30 in range", async () => {
        stage(2);
        await withTools(null, async (call) => {
            const r = await summarize(call);
            const sc = r.structuredContent as unknown as SummaryPayload;
            expect(sc.logged_days).toBe(15);
            expect(sc.days_in_range).toBe(30);
            // Per LOGGED day — the same 2000 kcal a user sees on any one of the
            // days they ate, not the 1000 get_trends reports for the month.
            expect(sc.averages.calories).toBe(2000);
            expect(sc.averages.protein_g).toBe(100);
            expect(sc.averages.carbs_g).toBe(200);
            expect(sc.averages.fat_g).toBe(80);
            expect(sc.averages.water_ml).toBe(2000);
        });
    });

    test("...and the text tells the model which denominator that was", async () => {
        stage(2);
        await withTools(null, async (call) => {
            const text = textOf(await summarize(call));
            expect(text).toContain(
                "Daily averages are per logged day — 15 of the 30 days in range.",
            );
            expect(text).toContain(
                "get_trends averages over all 30 calendar days instead",
            );
        });
    });

    // No gap, nothing to disclose: the note would be noise on what is the
    // common case for anyone logging daily.
    test("a fully-logged window stays silent about the denominator", async () => {
        stage(1);
        await withTools(null, async (call) => {
            const r = await summarize(call);
            const sc = r.structuredContent as unknown as SummaryPayload;
            expect(sc.logged_days).toBe(30);
            expect(sc.days_in_range).toBe(30);
            expect(sc.averages.calories).toBe(2000);
            expect(textOf(r)).not.toContain("per logged day");
        });
    });

    // days_in_range is a declared outputSchema field, so the early return for a
    // window with nothing in it has to carry it too or the SDK rejects the
    // result outright.
    test("an empty range still reports the size of the window", async () => {
        await withTools(null, async (call) => {
            const r = await summarize(call);
            const sc = r.structuredContent as unknown as SummaryPayload;
            expect(r.isError).toBeFalsy();
            expect(sc.logged_days).toBe(0);
            expect(sc.days_in_range).toBe(30);
        });
    });

    // A single-day range is 1 day, not 0 — an off-by-one here would make the
    // note read "1 of the 0 days in range" on the most ordinary query there is.
    test("a single-day range spans one day", async () => {
        stage(1);
        await withTools(null, async (call) => {
            const r = (await call("get_nutrition_summary", {
                start_date: START,
                end_date: START,
            })) as ToolResult;
            const sc = r.structuredContent as unknown as SummaryPayload;
            expect(sc.days_in_range).toBe(1);
        });
    });
});
