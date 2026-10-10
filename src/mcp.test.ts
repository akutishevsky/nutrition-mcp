import {
    test,
    expect,
    describe,
    mock,
    beforeEach,
    afterAll,
    spyOn,
} from "bun:test";
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
    missingNutrientNote,
    offUnreachableText,
    offNotFoundText,
    registerTools,
    START_IMPORT_OUTPUT_SCHEMA,
    GOALS_ITEM,
    TOTALS_ITEM,
    TRENDS_DAY_ITEM,
    MEAL_BREAKDOWN_ITEM,
    MEAL_BREAKDOWN_TOP_N,
    MEAL_CONTRIBUTORS,
    MEAL_CONTRIBUTORS_META_KEY,
    WEIGHT_SERIES_META_KEY,
    PERIOD_AVERAGES_META_KEY,
    ADDED_SUGAR_META_KEY,
    topMealBreakdown,
    emptyMealContributors,
    MAX_CALORIES,
    MAX_MACRO_G,
    MAX_ALCOHOL_G,
    MAX_CAFFEINE_MG,
    MAX_GOAL_G,
    MAX_GOAL_MG,
    gateAlcohol,
    handleMcp,
    MEALS_RANGE_MAX_DAYS,
    SUMMARY_RANGE_MAX_DAYS,
    WEIGHT_RANGE_MAX_DAYS,
    BODY_MEASUREMENT_RANGE_MAX_DAYS,
    healthSyncProfileLine,
    updatedAddedSugarError,
    addedSugarAverageLine,
    addedSugarRequiredNow,
} from "./mcp.js";
import {
    ADDED_SUGAR_REQUIRED_FROM_ENV,
    addedSugarMissingText,
} from "./added-sugar.js";
import {
    Client,
    StreamableHTTPClientTransport,
    type VersionNegotiationMode,
} from "@modelcontextprotocol/client";
import { Hono } from "hono";
import {
    McpServer,
    InMemoryTransport,
    type JsonSchemaType,
} from "@modelcontextprotocol/server";
import { AjvJsonSchemaValidator } from "@modelcontextprotocol/server/validators/ajv";
import * as actualSupabase from "./supabase.js";

// Snapshot BEFORE mock.module runs: Bun patches a mocked module's namespace
// in place, so restoring from the live `actualSupabase` afterwards would hand
// the next file the mock again. Restore from this copy.
const realSupabase = { ...actualSupabase };
import { DELETED_ACCOUNT_ANALYTICS_ID } from "./analytics.js";
import { ToolError } from "./errors.js";
import { addedSugarExtra, type AddedSugarMeta } from "./added-sugar.js";
import { formatFoodResult, type FoodResult } from "./foods.js";
import {
    buildDailyBuckets,
    computeTrends,
    computeWeeklyDigest,
    type DailyBucket,
} from "./insights.js";
import type {
    Meal,
    MealInput,
    NutritionGoals,
    SavedMealWithItems,
    WaterEntry,
    WeightEntry,
    BodyMeasurementEntry,
} from "./supabase.js";
import { MEAL_NUTRIENT_KEYS, type MealItemValues } from "./meal-items.js";
import {
    dateInTz,
    formatLocalDateTime,
    weekdayInTz,
    todayInTz,
    shiftLocalDate,
} from "./tz.js";
import { getWidgetHtml } from "./widgets.js";
import { rateForDisplay } from "./weight-trend.js";
import {
    buildPeriodRows,
    dayTotalsFromMeals,
    PERIOD_ROW_COUNTS,
} from "./periods.js";
import type { NutritionGoalsHistoryRow } from "./goals-history.js";

// Real uuids, because the id tools check the shape before touching the
// database: a fixture like "m1" would never reach the stubs below.
const MEAL_ID = "00000000-0000-4000-8000-000000000001";
const WATER_ID = "00000000-0000-4000-8000-000000000002";
const WEIGHT_ID = "00000000-0000-4000-8000-000000000003";
const MEASUREMENT_ID = "00000000-0000-4000-8000-000000000004";

function meal(over: Partial<Meal> = {}): Meal {
    return {
        id: MEAL_ID,
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
        added_sugar_g: null,
        alcohol_g: 14,
        // NULL on the base fixture on purpose: caffeine is the partial nutrient
        // where absence is the norm rather than a relic of pre-feature history,
        // and a pasta-and-beer dinner genuinely carries none. Giving every
        // fixture meal a milligram figure would hide the suppression this whole
        // feature turns on — the tests that want caffeine ask for it.
        caffeine_mg: null,
        notes: null,
        idempotency_key: null,
        saved_meal_id: null,
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
        daily_added_sugar_g: null,
        daily_alcohol_g: 28,
        // Milligrams, and the EFSA/FDA figure the tool description offers.
        daily_caffeine_mg: 400,
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
    const blank = {
        fiber_g: null,
        sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
    };

    test("one non-null meal makes the day carry the nutrient", () => {
        expect(
            nutrientPresence([meal(blank), meal({ ...blank, fiber_g: 3 })]),
        ).toEqual({
            fiber_g: true,
            sugar_g: false,
            added_sugar_g: false,
            alcohol_g: false,
            caffeine_mg: false,
        });
    });

    test("an explicit zero is data — only null is absence", () => {
        expect(nutrientPresence([meal({ ...blank, fiber_g: 0 })])).toEqual({
            fiber_g: true,
            sugar_g: false,
            added_sugar_g: false,
            alcohol_g: false,
            caffeine_mg: false,
        });
        expect(nutrientPresence([])).toEqual({
            fiber_g: false,
            sugar_g: false,
            added_sugar_g: false,
            alcohol_g: false,
            caffeine_mg: false,
        });
    });

    // Caffeine is the flag with no profile setting behind it, so presence is
    // the ONLY thing standing between a NULL column and a fabricated "0 mg vs
    // 400 mg limit". A coffee among otherwise caffeine-free meals has to flip
    // it on its own, and a measured decaf 2 mg counts as much as a double
    // espresso.
    test("caffeine flips on its own, and a measured zero counts", () => {
        expect(
            nutrientPresence([
                meal(blank),
                meal({ ...blank, caffeine_mg: 95 }),
            ]),
        ).toEqual({
            fiber_g: false,
            sugar_g: false,
            added_sugar_g: false,
            alcohol_g: false,
            caffeine_mg: true,
        });
        expect(
            nutrientPresence([meal({ ...blank, caffeine_mg: 0 })]).caffeine_mg,
        ).toBe(true);
    });
});

describe("rangeAverages", () => {
    const day = (over: Partial<Meal>, water = 0) => {
        const meals = [meal(over)];
        const totals = sumMeals(meals);
        totals.water_ml = water;
        return { meals, totals };
    };
    const blank = {
        fiber_g: null,
        sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
    };

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
        expect(recordedDays.caffeine_mg).toBe(0);
        expect(averages.caffeine_mg).toBe(0);
        expect(Number.isFinite(averages.sugar_g)).toBe(true);
        expect(Number.isNaN(averages.alcohol_g)).toBe(false);
        expect(Number.isNaN(averages.caffeine_mg)).toBe(false);
    });

    // Caffeine's realistic shape, and the one that breaks a naive average: a
    // day is a coffee plus three meals that carry no caffeine figure at all.
    // The day CARRIES caffeine (95 mg of it) even though most of its meals are
    // NULL, and a day with no coffee carries none — so the divisor is days that
    // recorded it, never meals and never every logged day.
    test("a day mixing null and recorded caffeine meals still counts as one covered day", () => {
        const coffeeDay = (mg: number) => {
            const meals = [
                meal({ ...blank, caffeine_mg: mg }),
                meal(blank),
                meal(blank),
            ];
            return { meals, totals: sumMeals(meals) };
        };
        const { averages, recordedDays } = rangeAverages([
            coffeeDay(95),
            { meals: [meal(blank)], totals: sumMeals([meal(blank)]) },
            coffeeDay(105),
        ]);
        expect(recordedDays.caffeine_mg).toBe(2);
        expect(averages.caffeine_mg).toBe(100);
        // The wrong answers this pins out: 200/3 (every logged day) and
        // 200/7 (every meal).
        expect(averages.caffeine_mg).not.toBe(200 / 3);
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
    const blank = {
        fiber_g: null,
        sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
    };
    const present = nutrientPresence([meal(blank)]);
    const totals = sumMeals([meal(blank)]);

    test("no data and no target prints no line at all", () => {
        const text = formatProgress(
            totals,
            goals({
                daily_fiber_g: null,
                daily_sugar_g: null,
                daily_caffeine_mg: null,
            }),
            null,
            present,
        );
        expect(text).not.toContain("Fiber");
        expect(text).not.toContain("Sugar");
        expect(text).not.toContain("Caffeine");
        // The always-on macros are untouched.
        expect(text).toContain("Calories:");
        expect(text).toContain("Water:");
    });

    test("no data but a target set says so instead of claiming zero", () => {
        const text = formatProgress(totals, goals(), null, present);
        expect(text).toContain("Fiber: not recorded / 30g target");
        expect(text).toContain("Sugar: not recorded / 40g limit");
        expect(text).toContain("Caffeine: not recorded / 400 mg limit");
        expect(text).not.toContain("Fiber: 0");
        expect(text).not.toContain("Sugar: 0");
        expect(text).not.toContain("Caffeine: 0");
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
        expect(off).toContain("- Sugar, total (max): 40g");
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
        expect(totalsPayloadOf(totals, null, false).alcohol_g).toBeNull();
        expect(totalsPayloadOf(totals, "us", false).alcohol_g).toBe(14);
        expect(goalsPayloadOf(goals(), null)!.alcohol_g).toBeNull();
        expect(goalsPayloadOf(goals(), "us")!.alcohol_g).toBe(28);
        expect(mealBreakdown([meal()], null, null)[0]!.alcohol_g).toBeNull();
        expect(mealBreakdown([meal()], null, "us")[0]!.alcohol_g).toBe(14);
        // Never gated, either way.
        expect(totalsPayloadOf(totals, null, false).fiber_g).toBe(6);
        expect(goalsPayloadOf(goals(), null)!.sugar_g).toBe(40);
    });
});

// ---------- caffeine ----------
//
// Caffeine deliberately has NO profile flag: no caffeine_tracking_enabled, no
// tool pair, nothing an AlcoholDisplay-shaped argument could carry. Everything
// that decides whether a caffeine figure is shown is the DATA — dayCarries on
// the write side, hasAnyPositive in insights.ts on the narrative side. These
// pin that, and pin the unit, because caffeine is the one nutrient in this
// schema stored in milligrams and a silent grams/mg mix-up is a 1000x error
// that still looks like a plausible number.
describe("caffeine is suppressed by absence, never by a flag", () => {
    const coffee = { description: "Flat white", caffeine_mg: 95 };
    const recorded = [meal(coffee)];
    const none = [meal()]; // base fixture: caffeine_mg null

    /** The one line of the progress block this describe is about. */
    const caffeineLine = (
        meals: Meal[],
        g: NutritionGoals | null = goals(),
    ): string | undefined =>
        formatProgress(sumMeals(meals), g, null, nutrientPresence(meals))
            .split("\n")
            .find((l) => l.startsWith("Caffeine:"));

    test("a recorded figure is reported against the limit, as a ceiling", () => {
        const line = caffeineLine(recorded);
        expect(line).toBe("Caffeine: 95 / 400 mg limit (24%, under)");
        // A limit is not a budget — same wording rule as sugar and alcohol.
        // (Asserted on the caffeine line alone: the floor-directed macro lines
        // in the same block legitimately say "to go".)
        expect(line).not.toContain("to go");
        expect(line).not.toContain("left");
        expect(line).not.toContain("remaining");
    });

    test("over the limit says how far over, in whole milligrams", () => {
        expect(caffeineLine([meal({ ...coffee, caffeine_mg: 470 })])).toBe(
            "Caffeine: 470 / 400 mg limit (118%, 70 mg over)",
        );
    });

    // The trap this feature is not allowed to fall into (the same one as #78):
    // most meals carry NULL caffeine forever, so a user who has never logged a
    // coffee must never be shown a caffeine figure — not "0 mg", and not
    // "0 / 400 mg limit" either.
    test("a nutrient nobody ever recorded produces no line at all", () => {
        const text = formatProgress(
            sumMeals(none),
            goals({ daily_caffeine_mg: null }),
            null,
            nutrientPresence(none),
        );
        expect(text).not.toContain("Caffeine");
        expect(text).not.toContain("0 mg");
    });

    // With a limit set the line cannot simply vanish — that reads as tracking
    // having broken — but it still refuses to invent the number.
    test("a limit with nothing recorded says 'not recorded', never 0 mg", () => {
        const text = formatProgress(
            sumMeals(none),
            goals(),
            null,
            nutrientPresence(none),
        );
        expect(text).toContain("Caffeine: not recorded / 400 mg limit");
        expect(text).not.toContain("Caffeine: 0");
    });

    // A caffeine limit of 0 is the point of the ceiling direction: someone
    // cutting caffeine out entirely sets it, and it has to behave like a real
    // limit rather than like "unset" — stored, echoed AND honoured.
    test("a zero limit is a real limit in all three places", () => {
        const zero = goals({ daily_caffeine_mg: 0 });
        expect(formatGoals(zero, "kg", null)).toContain(
            "- Caffeine (max): 0 mg",
        );
        expect(goalsPayloadOf(zero, null)!.caffeine_mg).toBe(0);

        const over = formatProgress(
            sumMeals(recorded),
            zero,
            null,
            nutrientPresence(recorded),
        );
        expect(over).toContain("Caffeine: 95 / 0 mg limit (95 mg over)");
        expect(over).not.toContain("NaN");
        expect(over).not.toContain("Infinity");

        // A measured zero against a zero limit is the day the user set it to
        // see, so it reports "clear" rather than disappearing.
        const clearDay = [meal({ ...coffee, caffeine_mg: 0 })];
        expect(
            formatProgress(
                sumMeals(clearDay),
                zero,
                null,
                nutrientPresence(clearDay),
            ),
        ).toContain("Caffeine: 0 / 0 mg limit (clear)");
    });

    // A tenth of a milligram is below the precision of any label or export, so
    // the model-facing text rounds to whole mg — while the structured payload
    // keeps the sibling `* 10 / 10` rounding for the widgets.
    test("text is whole milligrams; the payload keeps one decimal", () => {
        const fussy = [meal({ ...coffee, caffeine_mg: 95.44 })];
        expect(
            formatProgress(
                sumMeals(fussy),
                goals({ daily_caffeine_mg: null }),
                null,
                nutrientPresence(fussy),
            ),
        ).toContain("Caffeine: 95 mg");
        expect(
            formatMeal(meal({ ...coffee, caffeine_mg: 95.44 }), null),
        ).toContain("Caffeine: 95 mg");
        expect(totalsPayloadOf(sumMeals(fussy), null, true).caffeine_mg).toBe(
            95.4,
        );
    });

    // The alcohol opt-in must not reach caffeine: a user with tracking off sees
    // their coffee, and a user with it on sees no extra caffeine line either.
    test("the alcohol opt-in changes nothing about caffeine", () => {
        for (const alcohol of ["us", "uk", null] as const) {
            const text = formatProgress(
                sumMeals(recorded),
                goals(),
                alcohol,
                nutrientPresence(recorded),
            );
            expect(text).toContain("Caffeine: 95 / 400 mg limit");
            expect(formatMeal(meal(coffee), alcohol)).toContain(
                "Caffeine: 95 mg",
            );
            expect(formatGoals(goals(), "kg", alcohol)).toContain(
                "- Caffeine (max): 400 mg",
            );
            expect(goalsPayloadOf(goals(), alcohol)!.caffeine_mg).toBe(400);
        }
    });

    test("formatGoals lists an unset caffeine limit as not set", () => {
        expect(
            formatGoals(goals({ daily_caffeine_mg: null }), "kg", null),
        ).toContain("- Caffeine (max): not set");
    });

    // Per-meal, absence is per-meal: the sandwich in a day that also had a
    // coffee shows no caffeine line of its own.
    test("formatMeal omits the line for a meal with no caffeine figure", () => {
        expect(formatMeal(meal(), null)).not.toContain("Caffeine");
        // ...but a measured zero — an explicitly decaf entry — is data.
        expect(formatMeal(meal({ caffeine_mg: 0 }), null)).toContain(
            "Caffeine: 0 mg",
        );
    });
});

// Caffeine carries no energy. Fiber, sugar and alcohol all do, which is exactly
// why this needs pinning: every one of its siblings is legitimately part of an
// energy or macro story and caffeine is not, so the easy mistake is to treat
// the fourth column like the first three.
describe("caffeine never reaches an energy figure", () => {
    const plain = meal({ caffeine_mg: null });
    const caffeinated = meal({ caffeine_mg: MAX_CAFFEINE_MG });

    test("5,000 mg of caffeine changes no calorie or macro figure", () => {
        const a = sumMeals([plain]);
        const b = sumMeals([caffeinated]);
        expect(b.calories).toBe(a.calories);
        expect(b.protein_g).toBe(a.protein_g);
        expect(b.carbs_g).toBe(a.carbs_g);
        expect(b.fat_g).toBe(a.fat_g);
        expect(b.caffeine_mg).toBe(MAX_CAFFEINE_MG);

        const pa = totalsPayloadOf(a, "us", false);
        const pb = totalsPayloadOf(b, "us", true);
        expect(pb.calories).toBe(pa.calories);
        expect(pb.protein_g).toBe(pa.protein_g);
        expect(pb.carbs_g).toBe(pa.carbs_g);
        expect(pb.fat_g).toBe(pa.fat_g);
    });

    test("the per-meal breakdown the macro rings read from is unchanged too", () => {
        const [a] = mealBreakdown([plain], null, "us");
        const [b] = mealBreakdown([caffeinated], null, "us");
        expect(b!.calories).toBe(a!.calories);
        expect(b!.protein_g).toBe(a!.protein_g);
        expect(b!.carbs_g).toBe(a!.carbs_g);
        expect(b!.fat_g).toBe(a!.fat_g);
        // Present as its own stat, in milligrams, not folded into anything.
        expect(b!.caffeine_mg).toBe(MAX_CAFFEINE_MG);
    });

    test("the calorie line of the progress text is byte-identical", () => {
        const line = (m: Meal) =>
            formatProgress(sumMeals([m]), goals(), "us", nutrientPresence([m]))
                .split("\n")
                .find((l) => l.startsWith("Calories:"));
        expect(line(caffeinated)).toBe(line(plain));
    });
});

// The insights module renders an alcohol line purely from the data, because it
// stays free of Supabase and so cannot see the per-user opt-in. gateAlcohol is
// where that flag reaches it, so these assert the end result rather than the
// zeroing: no alcohol wording in either narrative when tracking is off.
describe("gateAlcohol", () => {
    const buckets: DailyBucket[] = ["2026-07-20", "2026-07-21"].map((date) => ({
        date,
        meals: [meal({ caffeine_mg: 95 })],
        waterMl: 1000,
        calories: 700,
        protein_g: 25,
        carbs_g: 90,
        fat_g: 20,
        fiber_g: 6,
        sugar_g: 12,
        added_sugar_g: 0,
        alcohol_g: 14,
        caffeine_mg: 95,
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

    // The spread has to carry caffeine_mg through untouched. There is no
    // caffeine flag to reach insights.ts with, so zeroing it here — the one
    // mechanism that could — would silently delete the caffeine narrative for
    // every user who has alcohol tracking off, which is most of them.
    test("caffeine rides through the alcohol gate in both positions", () => {
        expect(gateAlcohol(buckets, "us")[0]!.caffeine_mg).toBe(95);
        expect(gateAlcohol(buckets, null)[0]!.caffeine_mg).toBe(95);
        expect(computeTrends(gateAlcohol(buckets, null), goals())).toContain(
            "Caffeine",
        );
        expect(
            computeWeeklyDigest(gateAlcohol(buckets, null), goals()),
        ).toContain("Caffeine");
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

    // get_trends' group_by rows divide by logged days, like the summary,
    // not by calendar days like the rolling averages above. Over the same
    // dates, with gaps and uneven days, the two must give the same figures.
    test("a period row's per-logged-day averages are the summary's", () => {
        const july = meals
            .filter((m) => m.logged_at.startsWith("2026-07"))
            .filter((_, i) => i % 4 !== 1)
            .map((m, i) =>
                meal({
                    ...m,
                    calories: 400 + 37 * i,
                    protein_g: 20 + i,
                    carbs_g: 50 + (i % 5),
                    fat_g: 15 + i / 7,
                }),
            );
        const byDay = new Map<string, Meal[]>();
        for (const m of july) {
            const date = m.logged_at.slice(0, 10);
            byDay.set(date, [...(byDay.get(date) ?? []), m]);
        }
        const summaryJuly = rangeAverages(
            [...byDay.values()].map((dayMeals) => ({
                meals: dayMeals,
                totals: sumMeals(dayMeals),
            })),
        );
        const [row] = buildPeriodRows(
            dayTotalsFromMeals(july, "2026-07-01", END, "UTC"),
            [],
            END,
            "month",
            "UTC",
        );
        expect(row!.key).toBe("2026-07");
        expect(row!.days).toBe(26);
        expect(row!.logged_days).toBe(byDay.size);
        expect(row!.logged_days).toBeLessThan(row!.days);
        expect(row!.avg!.calories).toBeCloseTo(
            summaryJuly.averages.calories,
            9,
        );
        expect(row!.avg!.protein).toBeCloseTo(
            summaryJuly.averages.protein_g,
            9,
        );
        expect(row!.avg!.carbs).toBeCloseTo(summaryJuly.averages.carbs_g, 9);
        expect(row!.avg!.fat).toBeCloseTo(summaryJuly.averages.fat_g, 9);
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
        locale: "en",
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
            const parsed = START_IMPORT_OUTPUT_SCHEMA.parse(
                startImportPayload({ ...base, alcohol }),
            );
            expect(parsed.import_tool_name).toBe("bulk_import_meals");
            expect(parsed.tz).toBe("Europe/Kyiv");
            expect(parsed.max_rows_per_call).toBeGreaterThan(0);
        }
    });
});

// #99: the pure startImportPayload/runImport functions above take
// tzConfigured as an already-computed boolean, so they can't catch a bug in
// HOW mcp.ts computes it. These drive the real tools to cover that
// derivation: a profile row (created by some other set_* tool) with no
// timezone must count as unconfigured, the same as no profile at all.
describe("start_meal_import and bulk_import_meals treat a timezone-less profile as unconfigured", () => {
    test("start_meal_import reports tz_configured=false and warns", async () => {
        db.profile = { ...PROFILE_BASE, timezone: null };
        await withTools(null, async (call) => {
            const r = await call("start_meal_import");
            const sc = r.structuredContent as unknown as {
                tz_configured: boolean;
            };
            expect(sc.tz_configured).toBe(false);
            expect(textOf(r)).toContain("this account has no timezone set");
        });
    });

    test("bulk_import_meals warns that the timezone is unset", async () => {
        db.profile = { ...PROFILE_BASE, timezone: null };
        await withTools(null, async (call) => {
            const r = await call("bulk_import_meals", {
                meals: [
                    {
                        source_line: 2,
                        description: "Oatmeal",
                        meal_type: "breakfast",
                        logged_at: "2026-07-20 08:30:00",
                    },
                ],
                expected_row_count: 1,
                dry_run: true,
            });
            const sc = r.structuredContent as unknown as {
                warnings: string[];
            };
            expect(sc.warnings.join(" ")).toContain("Your timezone is not set");
        });
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
        nutriscore_grade: "d",
        nova_group: 2,
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
                TOTALS_ITEM.parse(totalsPayloadOf(totals, alcohol, false)),
            ).not.toThrow();
            expect(() =>
                GOALS_ITEM.parse(goalsPayloadOf(goals(), alcohol)),
            ).not.toThrow();
            expect(() =>
                z
                    .array(MEAL_BREAKDOWN_ITEM)
                    .parse(mealBreakdown([meal()], "UTC", alcohol)),
            ).not.toThrow();
            const top = topMealBreakdown(
                mealBreakdown(
                    [meal(), meal({ caffeine_mg: 80 })],
                    "UTC",
                    alcohol,
                ),
                alcohol,
            );
            expect(() =>
                MEAL_CONTRIBUTORS.parse(top.contributors),
            ).not.toThrow();
            expect(() =>
                z.array(MEAL_BREAKDOWN_ITEM).parse(top.meals),
            ).not.toThrow();
            // The alcohol key is present either way: null when tracking is off.
            expect(Object.keys(top.contributors)).toContain("alcohol_g");
            expect(top.contributors.alcohol_g).toBe(alcohol ? 2 : null);
            const empty = emptyMealContributors(alcohol);
            expect(() => MEAL_CONTRIBUTORS.parse(empty)).not.toThrow();
            expect(empty.alcohol_g).toBe(alcohol ? 0 : null);
        }
    });

    test("goalsPayloadOf keeps every cleared target as an explicit null", () => {
        const parsed = GOALS_ITEM.parse(
            goalsPayloadOf(
                goals({
                    daily_fiber_g: null,
                    daily_sugar_g: null,
                    daily_alcohol_g: null,
                    daily_caffeine_mg: null,
                }),
                "us",
            ),
        );
        expect(parsed.fiber_g).toBeNull();
        expect(parsed.sugar_g).toBeNull();
        expect(parsed.alcohol_g).toBeNull();
        expect(parsed.caffeine_mg).toBeNull();
    });

    test("no goals at all is null, not a half-filled object", () => {
        expect(goalsPayloadOf(null, "us")).toBeNull();
    });

    // The specific failure mode of a .nullable() field: the emitted JSON Schema
    // marks it REQUIRED with an anyOf[number, null] value, so a builder that
    // OMITS the key on the "nothing to report" path fails validation instead of
    // quietly defaulting to null — and the host then drops the whole result.
    // Caffeine is the field most likely to hit that path, since a null is its
    // normal state rather than an edge case.
    test("an unrecorded caffeine emits an explicit null, with the key present", () => {
        const payload = totalsPayloadOf(sumMeals([meal()]), "us", false);
        expect(payload.caffeine_mg).toBeNull();
        expect(Object.keys(payload)).toContain("caffeine_mg");
        expect(TOTALS_ITEM.parse(payload).caffeine_mg).toBeNull();

        const [row] = mealBreakdown([meal()], null, "us");
        expect(row!.caffeine_mg).toBeNull();
        expect(Object.keys(row!)).toContain("caffeine_mg");
        expect(() => MEAL_BREAKDOWN_ITEM.parse(row)).not.toThrow();
    });

    // The mirror: a day that DID record caffeine, and recorded none of it, must
    // survive as 0 rather than being collapsed back into the null that means
    // "never recorded". `caffeineRecorded` is what tells the two apart.
    test("a recorded zero survives as 0, not as the absence null", () => {
        const decaf = [meal({ caffeine_mg: 0 })];
        const payload = totalsPayloadOf(
            sumMeals(decaf),
            "us",
            nutrientPresence(decaf).caffeine_mg,
        );
        expect(payload.caffeine_mg).toBe(0);
        expect(payload.caffeine_mg).not.toBeNull();
        expect(mealBreakdown(decaf, null, "us")[0]!.caffeine_mg).toBe(0);
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
        added_sugar_g: mealsForDay.reduce(
            (s, m) => s + (m.added_sugar_g ?? 0),
            0,
        ),
        alcohol_g: mealsForDay.reduce((s, m) => s + (m.alcohol_g ?? 0), 0),
        caffeine_mg: mealsForDay.reduce((s, m) => s + (m.caffeine_mg ?? 0), 0),
        mealTypes: new Set(["dinner"]),
    });

    test("nulls fiber/sugar/alcohol/caffeine on a day that never recorded them", () => {
        const bucket = bucketWith([
            meal({
                fiber_g: null,
                sugar_g: null,
                alcohol_g: null,
                caffeine_mg: null,
            }),
        ]);
        const payload = trendsDayPayloadOf(bucket, "us");
        expect(payload.fiber_g).toBeNull();
        expect(payload.sugar_g).toBeNull();
        expect(payload.alcohol_g).toBeNull();
        expect(payload.caffeine_mg).toBeNull();
        // Everything else sums normally — only the three partial nutrients
        // get the covered-days treatment.
        expect(payload.calories).toBe(bucket.calories);
        expect(() => TRENDS_DAY_ITEM.parse(payload)).not.toThrow();
    });

    test("keeps a real recorded zero as 0, not null", () => {
        const bucket = bucketWith([
            meal({ fiber_g: 0, sugar_g: 0, alcohol_g: 0, caffeine_mg: 0 }),
        ]);
        const payload = trendsDayPayloadOf(bucket, "us");
        expect(payload.fiber_g).toBe(0);
        expect(payload.sugar_g).toBe(0);
        expect(payload.alcohol_g).toBe(0);
        expect(payload.caffeine_mg).toBe(0);
    });

    // Caffeine gets the covered-days treatment one level down, inside
    // totalsPayloadOf, rather than through an override in the returned literal
    // — so it needs its own pin: a day whose coffee is one meal among several
    // NULL ones is covered and reports the day's total.
    test("a day with one coffee among null meals reports the day's total", () => {
        const bucket = bucketWith([
            meal({ caffeine_mg: 95 }),
            meal({ caffeine_mg: null }),
        ]);
        expect(trendsDayPayloadOf(bucket, "us").caffeine_mg).toBe(95);
        // And the alcohol opt-in has no say over it, in either position.
        expect(trendsDayPayloadOf(bucket, null).caffeine_mg).toBe(95);
    });

    test("alcohol tracking off nulls alcohol_g regardless of coverage", () => {
        const bucket = bucketWith([meal({ alcohol_g: 14 })]);
        expect(trendsDayPayloadOf(bucket, null).alcohol_g).toBeNull();
    });

    test("a day with no meals at all is null across every partial nutrient", () => {
        const payload = trendsDayPayloadOf(bucketWith([]), "us");
        expect(payload.fiber_g).toBeNull();
        expect(payload.sugar_g).toBeNull();
        expect(payload.alcohol_g).toBeNull();
        expect(payload.caffeine_mg).toBeNull();
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
    locale: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    preferred_length_unit: null,
};

/** A stored body measurement: waist 84.5 cm unless overridden. */
function measurementRow(
    over: Partial<BodyMeasurementEntry> = {},
): BodyMeasurementEntry {
    return {
        id: MEASUREMENT_ID,
        user_id: "u1",
        kind: "waist",
        value_mm: 845,
        value_entered: 84.5,
        entered_unit: "cm",
        logged_at: "2026-08-07T08:00:00.000Z",
        notes: null,
        created_at: "2026-08-07T08:00:00.000Z",
        idempotency_key: null,
        ...over,
    };
}

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
        caffeine_mg: null,
        ...defined,
    });
}

const db = {
    profile: null as actualSupabase.Profile | null,
    goals: null as NutritionGoals | null,
    meals: [] as Meal[],
    // Every getMealsInRange call's [start, end], in order: get_trends'
    // group_by widens its one meal read to the 5-year span, and must not
    // without group_by.
    mealRangeArgs: [] as [string, string][],
    // getNutritionGoalsHistory's rows, oldest first, and how often it ran.
    goalsHistory: [] as NutritionGoalsHistoryRow[],
    goalsHistoryReads: 0,
    // hasMealsBefore's answer, and the dates it was asked about.
    mealsBefore: false,
    mealsBeforeArgs: [] as string[],
    water: [] as WaterEntry[],
    // getWaterByDate's rows (get_water_today / _by_date and buildMealProgress);
    // `water` above feeds the range reader.
    waterByDate: [] as WaterEntry[],
    // getWeightInRange's and getAllWeight's rows.
    weights: [] as WeightEntry[],
    // Which weight reader ran, in order: "range" or "all".
    weightReads: [] as string[],
    inserted: [] as Record<string, unknown>[],
    // Same capture as `inserted`, for the non-meal write paths. Each one
    // resolves logged_at independently, so each needs its own witness.
    mealUpdates: [] as Record<string, unknown>[],
    waterInserted: [] as Record<string, unknown>[],
    weightInserted: [] as Record<string, unknown>[],
    weightUpdates: [] as Record<string, unknown>[],
    // Body measurements: the rows getBodyMeasurementsInRange and
    // getBodyMeasurement read, and the write/read witnesses.
    measurements: [] as BodyMeasurementEntry[],
    measurementInserted: [] as Record<string, unknown>[],
    measurementUpdates: [] as Record<string, unknown>[],
    measurementRangeArgs: [] as {
        s: string;
        e: string;
        tz: string;
        kind: string | undefined;
    }[],
    profilePatches: [] as Record<string, unknown>[],
    // Ids the delete stubs consider to exist. Deleting one removes it, so a
    // second delete of the same id reports "not found" like the real table.
    rowIds: new Set<string>(),
    analyticsRows: [] as Record<string, unknown>[],
    accountWipes: 0,
    profileReads: [] as string[],
    // Thrown by getMealsInRange/deleteMeal/updateMeal when set: stands in for
    // a raw Postgres/PostgREST failure, or for the real updateMeal's not-found
    // ToolError, neither of which the stubs otherwise produce.
    failWith: null as Error | null,
    goalsHistoryFailure: null as Error | null,
    // Every call to a delete stub, found or not: stays 0 when a tool refuses
    // an id before it reaches the database.
    deleteCalls: 0,
    // What the insert stubs report as `deduplicated`: true stands in for a
    // write whose key matched an existing row.
    dedupe: false,
    // get_profile's Apple Health sync status, as the health-sync store reads
    // it through getSupabase(): the link row, and the latest acked date.
    healthSyncLink: null as Record<string, unknown> | null,
    healthSyncSentThrough: null as string | null,
    // update_meal's reads of a stored meal's sugar pair: 0 when both sugar
    // fields were passed, so the check needed no read.
    storedMealReads: 0,
    // The sugar guard update_meal handed updateMeal on each call (undefined
    // when the write needed none), and a sugar edit the fake applies to the
    // stored meal between update_meal's read and its write.
    mealUpdateGuards: [] as (
        Partial<Pick<Meal, "sugar_g" | "added_sugar_g">> | undefined
    )[],
    concurrentMealEdit: null as Partial<Meal> | null,
    // Ingredients by meal id, as the store's meal_items rows read back.
    mealItems: new Map<string, MealItemValues[]>(),
    // replaceMealItems' witnesses: the fields and the full new list.
    itemReplacements: [] as {
        id: string;
        fields: Record<string, unknown>;
        items: MealItemValues[];
    }[],
    // Saved meals as the store holds them, one serving each with its items.
    savedMeals: [] as SavedMealWithItems[],
    // createSavedMeal's and updateSavedMeal's witnesses.
    savedMealWrites: [] as {
        input: Record<string, unknown>;
        items: MealItemValues[];
    }[],
    savedMealUpdates: [] as {
        id: string;
        fields: Record<string, unknown>;
        items: MealItemValues[] | null;
    }[],
    // searchMeals' rows, staged by the test.
    searchResults: [] as Meal[],
};

/** The two PostgREST reads behind HealthSyncStore.getLinkStatus, plus
 *  update_meal's stored-sugar read (`meals` by id), and nothing else: any
 *  other select through this stub has no chain to call. */
function healthSyncSelect(table: string) {
    let idFilter: string | null = null;
    const chain = {
        eq: (column: string, value: string) => {
            if (column === "id") idFilter = value;
            return chain;
        },
        gt: () => chain,
        not: () => chain,
        order: () => chain,
        limit: async () => ({
            data:
                table === "health_sync_days" && db.healthSyncSentThrough
                    ? [{ date: db.healthSyncSentThrough }]
                    : [],
            error: null,
        }),
        maybeSingle: async () => {
            db.storedMealReads += table === "meals" ? 1 : 0;
            return {
                data:
                    table === "health_sync_links"
                        ? db.healthSyncLink
                        : table === "meals"
                          ? (db.meals.find((m) => m.id === idFilter) ?? null)
                          : null,
                error: null,
            };
        },
    };
    return chain;
}

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
            select: () => healthSyncSelect(table),
        }),
    }),
    deleteAllUserData: async () => {
        db.accountWipes += 1;
    },
    getProfile: async (userId: string) => {
        db.profileReads.push(userId);
        return db.profile;
    },
    getUserTimezone: async () => db.profile?.timezone ?? "UTC",
    getNutritionGoals: async () => db.goals,
    getMealsByDate: async () => db.meals,
    getWaterByDate: async () => db.waterByDate,
    // The range readers behind get_nutrition_summary. They ignore the dates and
    // hand back whatever the test staged: the fixtures below already sit inside
    // the window they ask for, and filtering here would only re-implement the
    // query under test. Paging, ordering and the count reconcile belong to the
    // real reader, driven against a stubbed fetch in supabase-window.test.ts.
    getMealsInRange: async (_userId: string, s: string, e: string) => {
        db.mealRangeArgs.push([s, e]);
        if (db.failWith) throw db.failWith;
        return db.meals;
    },
    // get_trends' group_by: the goal in effect on each past day.
    getNutritionGoalsHistory: async () => {
        db.goalsHistoryReads += 1;
        return db.goalsHistory;
    },
    hasMealsBefore: async (_userId: string, date: string) => {
        db.mealsBeforeArgs.push(date);
        return db.mealsBefore;
    },
    getWaterInRange: async () => db.water,
    // get_weight_by_date_range's reader; its range guard is what is under test.
    getWeightInRange: async () => {
        db.weightReads.push("range");
        return db.weights;
    },
    // get_weight_trends' one full-history read.
    getAllWeight: async () => {
        db.weightReads.push("all");
        return db.weights;
    },
    // get_goal_progress's standing weight metric: the newest staged entry.
    getLatestWeight: async () => db.weights.at(-1) ?? null,
    insertMeal: async (_userId: string, input: Record<string, unknown>) => {
        db.inserted.push(input);
        const { items, ...row } = input;
        const saved = storedMeal(row);
        if (Array.isArray(items))
            db.mealItems.set(saved.id, items as MealItemValues[]);
        db.meals = [saved];
        return { meal: saved, deduplicated: db.dedupe };
    },
    updateMeal: async (
        _userId: string,
        id: string,
        fields: Record<string, unknown>,
        guard?: Partial<Pick<Meal, "sugar_g" | "added_sugar_g">>,
    ) => {
        if (db.failWith) throw db.failWith;
        db.mealUpdateGuards.push(guard);
        // Mirrors the real guarded write: a concurrent edit (staged in
        // db.concurrentMealEdit, applied between update_meal's read and this
        // write) that moves a guarded column makes it write nothing and throw
        // the conflict ToolError naming the values now stored.
        const current = db.meals.find((m) => m.id === id);
        if (current && db.concurrentMealEdit)
            Object.assign(current, db.concurrentMealEdit);
        if (current && guard) {
            for (const column of ["sugar_g", "added_sugar_g"] as const) {
                if (column in guard && guard[column] !== current[column])
                    throw new ToolError(
                        realSupabase.mealSugarConflictText(id, current),
                    );
            }
        }
        db.mealUpdates.push(fields);
        const saved = storedMeal({ ...fields, id });
        db.meals = [saved];
        return saved;
    },
    insertWater: async (_userId: string, input: Record<string, unknown>) => {
        db.waterInserted.push(input);
        return {
            entry: {
                id: WATER_ID,
                user_id: "u1",
                amount_ml: (input.amount_ml as number) ?? 0,
                logged_at:
                    (input.logged_at as string | undefined) ??
                    "2026-08-07T00:00:00.000Z",
                notes: (input.notes as string | undefined) ?? null,
                created_at: "2026-08-07T00:00:00.000Z",
                idempotency_key: null,
            } as WaterEntry,
            deduplicated: db.dedupe,
        };
    },
    insertWeight: async (_userId: string, input: Record<string, unknown>) => {
        db.weightInserted.push(input);
        return {
            entry: {
                id: WEIGHT_ID,
                user_id: "u1",
                weight_g: (input.weight_g as number) ?? 0,
                logged_at:
                    (input.logged_at as string | undefined) ??
                    "2026-08-07T00:00:00.000Z",
                notes: (input.notes as string | undefined) ?? null,
                created_at: "2026-08-07T00:00:00.000Z",
                idempotency_key: null,
            } as WeightEntry,
            deduplicated: db.dedupe,
        };
    },
    updateWeight: async (
        _userId: string,
        id: string,
        fields: Record<string, unknown>,
    ) => {
        db.weightUpdates.push(fields);
        return {
            id,
            user_id: "u1",
            weight_g: (fields.weight_g as number | undefined) ?? 70_000,
            logged_at:
                (fields.logged_at as string | undefined) ??
                "2026-08-07T00:00:00.000Z",
            notes: (fields.notes as string | undefined) ?? null,
            created_at: "2026-08-07T00:00:00.000Z",
            idempotency_key: null,
        } as WeightEntry;
    },
    deleteMeal: async (_userId: string, id: string) => {
        db.deleteCalls += 1;
        if (db.failWith) throw db.failWith;
        const before = db.meals.length;
        db.meals = db.meals.filter((m) => m.id !== id);
        return db.meals.length < before;
    },
    deleteWater: async (_userId: string, id: string) => {
        db.deleteCalls += 1;
        return db.rowIds.delete(id);
    },
    deleteWeight: async (_userId: string, id: string) => {
        db.deleteCalls += 1;
        return db.rowIds.delete(id);
    },
    insertBodyMeasurement: async (
        _userId: string,
        input: Record<string, unknown>,
    ) => {
        db.measurementInserted.push(input);
        const defined = Object.fromEntries(
            Object.entries(input).filter(([, v]) => v !== undefined),
        ) as Partial<BodyMeasurementEntry>;
        return {
            entry: measurementRow({ ...defined, idempotency_key: null }),
            deduplicated: db.dedupe,
        };
    },
    getBodyMeasurementsInRange: async (
        _userId: string,
        s: string,
        e: string,
        tz: string,
        kind?: string,
    ) => {
        db.measurementRangeArgs.push({ s, e, tz, kind });
        return kind
            ? db.measurements.filter((m) => m.kind === kind)
            : db.measurements;
    },
    getBodyMeasurement: async (_userId: string, id: string) =>
        db.measurements.find((m) => m.id === id) ?? null,
    updateBodyMeasurement: async (
        _userId: string,
        id: string,
        fields: Record<string, unknown>,
    ) => {
        db.measurementUpdates.push(fields);
        const current = db.measurements.find((m) => m.id === id);
        if (!current)
            throw new ToolError(`No body measurement found with id ${id}.`);
        const defined = Object.fromEntries(
            Object.entries(fields).filter(([, v]) => v !== undefined),
        ) as Partial<BodyMeasurementEntry>;
        return { ...current, ...defined };
    },
    deleteBodyMeasurement: async (_userId: string, id: string) => {
        db.deleteCalls += 1;
        return db.rowIds.delete(id);
    },
    getPreferredLengthUnit: async () =>
        db.profile?.preferred_length_unit ?? null,
    getAllBodyMeasurements: async () => [],
    countMeals: async () => db.meals.length,
    existingIdempotencyKeys: async () => new Set<string>(),
    existingMealIds: async (_userId: string, ids: string[]) =>
        new Set(ids.filter((id) => db.meals.some((m) => m.id === id))),
    getPreferredWeightUnit: async () =>
        db.profile?.preferred_weight_unit ?? null,
    upsertNutritionGoals: async (
        _userId: string,
        patch: Record<string, unknown>,
    ) => {
        db.goals = { ...goals(), ...patch } as NutritionGoals;
        // The real function throws its history ToolError after the goal is
        // saved, so the stub saves first too.
        if (db.goalsHistoryFailure) throw db.goalsHistoryFailure;
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
    // Ingredients and saved meals (the store functions behind the saved-meal
    // tools). Each mirrors the real contract: the name is unique per user,
    // deleting a saved meal unlinks the meals logged from it, and a missing
    // row is null or a ToolError the way the real functions report it.
    searchMeals: async () => db.searchResults,
    getMealItems: async (_userId: string, ids: string[]) =>
        new Map(
            ids
                .filter((id) => db.mealItems.has(id))
                .map((id) => [id, db.mealItems.get(id)!]),
        ),
    countMealItems: async (_userId: string, id: string) =>
        db.mealItems.get(id)?.length ?? 0,
    getMealById: async (_userId: string, id: string) =>
        db.meals.find((m) => m.id === id) ?? null,
    replaceMealItems: async (
        _userId: string,
        id: string,
        fields: Record<string, unknown>,
        items: MealItemValues[],
    ) => {
        const current = db.meals.find((m) => m.id === id);
        if (!current) throw new ToolError(`No meal found with id ${id}.`);
        db.itemReplacements.push({ id, fields, items });
        db.mealItems.set(id, items);
        const saved = storedMeal({ ...current, ...fields, id });
        db.meals = db.meals.map((m) => (m.id === id ? saved : m));
        return saved;
    },
    createSavedMeal: async (
        userId: string,
        input: Record<string, unknown>,
        items: MealItemValues[],
    ) => {
        const name = input.name as string;
        const taken = db.savedMeals.find(
            (s) => s.name.toLowerCase() === name.toLowerCase(),
        );
        if (taken) throw new realSupabase.SavedMealNameTaken(taken.id);
        db.savedMealWrites.push({ input, items });
        const row = savedMealRow({
            id: savedMealId(db.savedMeals.length + 1),
            user_id: userId,
            name,
            description: input.description as string,
            meal_type: (input.meal_type as string | null) ?? null,
            // Every nutrient, as insert_saved_meal stores it, so a handler
            // that dropped one on the way would show in the reply.
            ...Object.fromEntries(
                MEAL_NUTRIENT_KEYS.map((k) => [
                    k,
                    (input[k] as number | null | undefined) ?? null,
                ]),
            ),
            items,
        });
        db.savedMeals.push(row);
        return row;
    },
    getSavedMeals: async (
        _userId: string,
        opts: { nameContains?: string } = {},
    ) =>
        db.savedMeals
            .filter(
                (s) =>
                    !opts.nameContains ||
                    s.name
                        .toLowerCase()
                        .includes(opts.nameContains.trim().toLowerCase()),
            )
            .sort((a, b) =>
                a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
            ),
    getSavedMeal: async (_userId: string, id: string) =>
        db.savedMeals.find((s) => s.id === id) ?? null,
    findSavedMealsByName: async (_userId: string, name: string) =>
        db.savedMeals.filter(
            (s) => s.name.toLowerCase() === name.trim().toLowerCase(),
        ),
    countSavedMeals: async () => db.savedMeals.length,
    searchSavedMeals: async (_userId: string, queries: string[]) => {
        const saved = db.savedMeals
            .filter((s) =>
                queries.some((q) =>
                    [s.name, s.description, ...s.items.map((i) => i.name)].some(
                        (text) => text.toLowerCase().includes(q.toLowerCase()),
                    ),
                ),
            )
            .map((s) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                meal_type: s.meal_type,
                calories: s.calories,
                protein_g: s.protein_g,
                carbs_g: s.carbs_g,
                fat_g: s.fat_g,
                item_count: s.items.length,
            }));
        return { saved, total: saved.length };
    },
    updateSavedMeal: async (
        _userId: string,
        id: string,
        fields: Record<string, unknown>,
        items: MealItemValues[] | null,
    ) => {
        const current = db.savedMeals.find((s) => s.id === id);
        if (!current) return null;
        const name = fields.name as string | undefined;
        const clash =
            name !== undefined
                ? db.savedMeals.find(
                      (s) =>
                          s.id !== id &&
                          s.name.toLowerCase() === name.toLowerCase(),
                  )
                : undefined;
        if (clash) throw new realSupabase.SavedMealNameTaken(clash.id);
        db.savedMealUpdates.push({ id, fields, items });
        const defined = Object.fromEntries(
            Object.entries(fields).filter(([, v]) => v !== undefined),
        );
        const next = {
            ...current,
            ...defined,
            items: items ?? current.items,
        } as SavedMealWithItems;
        db.savedMeals = db.savedMeals.map((s) => (s.id === id ? next : s));
        return next;
    },
    deleteSavedMeal: async (_userId: string, id: string) => {
        const current = db.savedMeals.find((s) => s.id === id);
        if (!current) return null;
        db.savedMeals = db.savedMeals.filter((s) => s.id !== id);
        // Logged meals keep their values; only the link goes (the foreign key
        // is on delete set null).
        db.meals = db.meals.map((m) =>
            m.saved_meal_id === id ? { ...m, saved_meal_id: null } : m,
        );
        return current;
    },
}));

afterAll(() => {
    mock.module("./supabase.js", () => realSupabase);
});

beforeEach(() => {
    db.profile = { ...PROFILE_BASE };
    db.goals = null;
    db.healthSyncLink = null;
    db.healthSyncSentThrough = null;
    db.storedMealReads = 0;
    db.mealUpdateGuards = [];
    db.concurrentMealEdit = null;
    db.mealItems = new Map();
    db.itemReplacements = [];
    db.savedMeals = [];
    db.savedMealWrites = [];
    db.savedMealUpdates = [];
    db.searchResults = [];
    db.meals = [];
    db.mealRangeArgs = [];
    db.goalsHistory = [];
    db.goalsHistoryReads = 0;
    db.mealsBefore = false;
    db.mealsBeforeArgs = [];
    db.water = [];
    db.waterByDate = [];
    db.weights = [];
    db.weightReads = [];
    db.inserted = [];
    db.mealUpdates = [];
    db.waterInserted = [];
    db.weightInserted = [];
    db.weightUpdates = [];
    db.measurements = [];
    db.measurementInserted = [];
    db.measurementUpdates = [];
    db.measurementRangeArgs = [];
    db.profilePatches = [];
    db.rowIds = new Set<string>();
    db.analyticsRows = [];
    db.accountWipes = 0;
    db.profileReads = [];
    db.failWith = null;
    db.goalsHistoryFailure = null;
    db.deleteCalls = 0;
    db.dedupe = false;
});

interface ToolResult {
    content: { type: string; text: string }[];
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
    _meta?: Record<string, unknown>;
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
        // listTools arms the client's own check of every structuredContent
        // against the ADVERTISED (strict, additionalProperties:false) JSON
        // Schema, as a host does. Without it the only check is the server's
        // Zod parse, which ignores unknown keys — so a handler that returned
        // an extra field would pass every test here and fail in production
        // for each host holding a cached tools/list.
        await client.listTools();
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
            false,
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
                "caffeine_mg",
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
                (await call("update_meal", { id: MEAL_ID, sugar_g: -0.5 }))
                    .isError,
            ).toBe(true);
            expect(
                (await call("update_meal", { id: MEAL_ID, alcohol_g: 1e308 }))
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

    // 5,000 mg is ~50 espressos and well past a lethal single dose, so anything
    // above it is a unit slip (grams read as mg, or a coffee-bean weight) rather
    // than a drink. The rejection has to name the field, because the useful
    // correction is "you sent grams" and only `caffeine_mg` says so.
    test("caffeine has its own milligram ceiling, named in the rejection", async () => {
        await withTools(null, async (call) => {
            const ok = await call("log_meal", {
                description: "A pot of coffee",
                meal_type: "snack",
                caffeine_mg: MAX_CAFFEINE_MG,
            });
            expect(ok.isError).toBeFalsy();
            expect(db.inserted[0]!.caffeine_mg).toBe(MAX_CAFFEINE_MG);

            const tooMuch = await call("log_meal", {
                description: "Coffee",
                meal_type: "snack",
                caffeine_mg: MAX_CAFFEINE_MG + 1,
            });
            expect(tooMuch.isError).toBe(true);
            expect(textOf(tooMuch)).toContain("caffeine_mg");
            expect(db.inserted).toHaveLength(1);
        });
    });

    test("a negative caffeine figure is refused before the DB check fires", async () => {
        await withTools(null, async (call) => {
            const r = await call("log_meal", {
                description: "Coffee",
                meal_type: "snack",
                caffeine_mg: -1,
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("caffeine_mg");
            expect(db.inserted).toHaveLength(0);
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

    // daily_caffeine_mg is numeric(7,2), not the (6,2) every gram target uses —
    // milligram figures run three orders larger, so it needs a ceiling of its
    // own or a legitimate limit would be refused by a bound sized for grams.
    test("the caffeine goal ceiling is what numeric(7,2) can hold", async () => {
        expect(MAX_GOAL_MG).toBe(99999.99);
        expect(MAX_GOAL_MG).toBeGreaterThan(MAX_GOAL_G);
        await withTools(null, async (call) => {
            expect(
                (
                    await call("set_nutrition_goals", {
                        daily_caffeine_mg: MAX_GOAL_MG,
                    })
                ).isError,
            ).toBeFalsy();
            expect(
                (
                    await call("set_nutrition_goals", {
                        daily_caffeine_mg: MAX_GOAL_MG + 1,
                    })
                ).isError,
            ).toBe(true);
            expect(
                (await call("set_nutrition_goals", { daily_caffeine_mg: -1 }))
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
        // Report-only and an offer: the user decides, the model doesn't flip it.
        expect(note).toContain("The user can turn it on");
        expect(note).not.toContain("Turn it on with");
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
                await call("update_meal", { id: MEAL_ID, alcohol_g: 14 }),
            );
            expect(text).toContain("set_alcohol_tracking");
        });
        await withTools("uk", async (call) => {
            const text = textOf(
                await call("update_meal", { id: MEAL_ID, alcohol_g: 14 }),
            );
            expect(text).not.toContain("set_alcohol_tracking");
        });
    });
});

// ---------- (3) the fiber/sugar completeness nudge ----------
//
// The asymmetry under test is the whole design: fiber and sugar are chased
// because they are estimable for every food and a null costs the whole DAY in
// every average, while caffeine is deliberately left alone because most meals
// really do carry none and its display gate is `!= null`, so chasing it would
// manufacture the "0 mg / 400 mg limit" row the suppression exists to avoid.

describe("missingNutrientNote", () => {
    const base = {
        id: MEAL_ID,
        user_id: "u1",
        logged_at: "2026-08-07T12:00:00.000Z",
        meal_type: "lunch" as const,
        description: "Chicken salad",
        calories: 400,
        protein_g: 30,
        carbs_g: 10,
        fat_g: 20,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        notes: null,
        idempotency_key: null,
        saved_meal_id: null,
    } satisfies Meal;

    test("names every missing field and the meal id to repair", () => {
        const note = missingNutrientNote(base);
        expect(note).toContain("fiber_g, sugar_g, added_sugar_g");
        expect(note).toContain("update_meal");
        expect(note).toContain(MEAL_ID);
        // The sentence that stops the model "fixing" it by sending 0s blindly.
        expect(note).toContain("A missing value is not a zero");
        // Directory policy: the note describes the gap, never directs the
        // assistant (#190, #213).
        expect(note).not.toContain("fill it in with update_meal");
        expect(note).not.toMatch(
            /\bmention\b|\bestimate\b|\boffer\b|\bask\b|\btell\b/i,
        );
        expect(note).toContain("update_meal can add the value");
    });

    test("names only the field that is actually missing", () => {
        const note = missingNutrientNote({ ...base, fiber_g: 6 });
        expect(note).toContain("sugar_g");
        expect(note).not.toContain("fiber_g");
    });

    // Added sugar is expected beside sugar, so a meal carrying total sugar
    // but no added figure is still a gap — and only that field is named.
    test("names added_sugar_g alone when only it is missing", () => {
        const note = missingNutrientNote({ ...base, fiber_g: 6, sugar_g: 4 });
        expect(note).toContain("Not recorded on this meal: added_sugar_g.");
    });

    // An explicit 0 is a measurement — the point of the nudge is to turn
    // omissions into values, and 0 is a perfectly good value for a steak.
    test("an explicit zero satisfies it", () => {
        expect(
            missingNutrientNote({
                ...base,
                fiber_g: 0,
                sugar_g: 0,
                added_sugar_g: 0,
            }),
        ).toBe("");
    });

    // If this ever starts asking for caffeine, the read side has to change
    // first — see limitShown in shared/macros.js and recordedGoalLine.
    test("never asks for caffeine, however complete the rest is", () => {
        const note = missingNutrientNote({
            ...base,
            fiber_g: 6,
            sugar_g: 4,
            added_sugar_g: 0,
            caffeine_mg: null,
        });
        expect(note).toBe("");
    });
});

describe("log_meal / update_meal chase missing fiber and sugar", () => {
    test("log_meal without them says so and points at update_meal", async () => {
        await withTools(null, async (call) => {
            const text = textOf(
                await call("log_meal", {
                    description: "Chicken salad",
                    meal_type: "lunch",
                    calories: 400,
                }),
            );
            expect(text).toContain("fiber_g, sugar_g");
            expect(text).toContain("update_meal");
        });
    });

    test("log_meal with both — including zeros — says nothing", async () => {
        await withTools(null, async (call) => {
            const text = textOf(
                await call("log_meal", {
                    description: "Ribeye steak",
                    meal_type: "dinner",
                    calories: 700,
                    fiber_g: 0,
                    sugar_g: 0,
                    added_sugar_g: 0,
                }),
            );
            expect(text).not.toContain("update_meal");
        });
    });

    test("a caffeine-free meal is never nagged about caffeine", async () => {
        await withTools(null, async (call) => {
            const text = textOf(
                await call("log_meal", {
                    description: "Ribeye steak",
                    meal_type: "dinner",
                    fiber_g: 0,
                    sugar_g: 0,
                }),
            );
            expect(text).not.toContain("caffeine");
            expect(text).not.toContain("Caffeine");
        });
    });

    // The repair loop has to converge: backfilling one field must leave a note
    // naming only the other, not the same pair again.
    test("update_meal re-checks the meal it just wrote", async () => {
        await withTools(null, async (call) => {
            const text = textOf(
                await call("update_meal", { id: MEAL_ID, fiber_g: 6 }),
            );
            expect(text).toContain("sugar_g");
            expect(text).not.toContain("fiber_g");
        });
    });
});

// ---------- caffeine, end to end through the real tools ----------

describe("log_meal and update_meal round-trip caffeine_mg", () => {
    const coffee = {
        description: "Flat white",
        meal_type: "snack",
        calories: 120,
        caffeine_mg: 95,
    };

    test("the milligram figure reaches the DB layer, the text and the widget", async () => {
        await withTools(null, async (call) => {
            const r = await call("log_meal", coffee);
            expect(r.isError).toBeFalsy();
            expect(db.inserted[0]!.caffeine_mg).toBe(95);
            expect(textOf(r)).toContain("Caffeine: 95 mg");
            const sc = r.structuredContent as unknown as {
                logged_meal: { caffeine_mg: number | null };
                totals: { caffeine_mg: number | null };
            };
            expect(sc.logged_meal.caffeine_mg).toBe(95);
            expect(sc.totals.caffeine_mg).toBe(95);
        });
    });

    // z.coerce, for the same reason log_meal's other numbers have it: models
    // emit "95" as a string often enough that refusing it is a worse failure
    // than coercing it.
    test("a stringified figure is coerced like every other number", async () => {
        await withTools(null, async (call) => {
            await call("log_meal", { ...coffee, caffeine_mg: "95" });
            expect(db.inserted[0]!.caffeine_mg).toBe(95);
        });
    });

    test("omitting it stores nothing at all, rather than a 0", async () => {
        await withTools(null, async (call) => {
            const r = await call("log_meal", {
                description: "Oatmeal",
                meal_type: "breakfast",
                calories: 300,
            });
            expect(db.inserted[0]).not.toHaveProperty("caffeine_mg");
            expect(textOf(r)).not.toContain("Caffeine");
            const sc = r.structuredContent as unknown as {
                logged_meal: { caffeine_mg: number | null };
                totals: { caffeine_mg: number | null };
            };
            // The key is present and null — a .nullable() outputSchema field is
            // REQUIRED, so omitting it would fail validation, not default.
            expect(sc.logged_meal.caffeine_mg).toBeNull();
            expect(sc.totals.caffeine_mg).toBeNull();
        });
    });

    test("update_meal passes a corrected figure through", async () => {
        await withTools(null, async (call) => {
            const r = await call("update_meal", {
                id: MEAL_ID,
                caffeine_mg: 126,
            });
            expect(r.isError).toBeFalsy();
            expect(db.mealUpdates[0]!.caffeine_mg).toBe(126);
            expect(textOf(r)).toContain("Caffeine: 126 mg");
        });

        await withTools(null, async (call) => {
            const r = await call("update_meal", {
                id: MEAL_ID,
                caffeine_mg: MAX_CAFFEINE_MG + 1,
            });
            expect(r.isError).toBe(true);
            // Still just the accepted write above — the rejection never
            // reached the DB layer.
            expect(db.mealUpdates).toHaveLength(1);
        });
    });

    // CONTRACT: no caffeine_tracking_enabled, no tool pair, no nudge. Alcohol
    // has all three because surfacing trace alcohol to someone in recovery is a
    // real harm; caffeine has no equivalent, and inventing a settings surface
    // for it would be a second thing to keep in sync forever.
    test("there is no caffeine opt-in anywhere on the tool surface", async () => {
        const server = new McpServer(
            { name: "t", version: "0.0.0" },
            { capabilities: { tools: {}, resources: {} } },
        );
        registerTools(server, "u1", true, null);
        const [ct, st] = InMemoryTransport.createLinkedPair();
        const client = new Client({ name: "c", version: "0.0.0" });
        await Promise.all([server.connect(st), client.connect(ct)]);
        const { tools } = await client.listTools();
        expect(
            tools.map((t) => t.name).filter((n) => n.includes("caffeine")),
        ).toEqual([]);
        await client.close();
        await server.close();

        await withTools(null, async (call) => {
            const text = textOf(await call("log_meal", coffee));
            expect(text).not.toContain("caffeine_tracking");
            expect(text).not.toContain("set_caffeine_tracking");
        });
    });

    // The digest is frozen (CONTRACT, and the "DO NOT ADD" comments in
    // src/supabase.ts and src/import.ts). Adding caffeine_mg to it would orphan
    // every `auto:` key already stored, so the same meal logged with and
    // without a caffeine figure must still derive one key — and that key must
    // still be the literal value the pre-caffeine code produced.
    test("caffeine does not enter the derived idempotency key", async () => {
        const PRE_CAFFEINE_KEY =
            "auto:ce32507d8d98f40ce37b9dcd4161d18dfb5628f1c97316342dda1f0d02ce95c6";
        const at = "2026-07-20T12:00:00.000Z";
        await withTools(null, async (call) => {
            await call("log_meal", { ...coffee, logged_at: at });
            await call("log_meal", {
                ...coffee,
                caffeine_mg: undefined,
                logged_at: at,
            });
        });
        const keys = db.inserted.map((input) =>
            actualSupabase.mealIdempotencyKey(
                "u1",
                input as unknown as MealInput,
                at,
            ),
        );
        expect(keys[0]).toBe(keys[1]!);
        expect(keys[0]).toBe(PRE_CAFFEINE_KEY);
    });
});

describe("set_nutrition_goals accepts a caffeine limit", () => {
    test("the limit is stored in milligrams and echoed back", async () => {
        await withTools(null, async (call) => {
            const r = await call("set_nutrition_goals", {
                daily_caffeine_mg: 400,
            });
            expect(r.isError).toBeFalsy();
            expect(db.goals!.daily_caffeine_mg).toBe(400);
            expect(textOf(r)).toContain("- Caffeine (max): 400 mg");
            expect(textOf(await call("get_nutrition_goals"))).toContain(
                "- Caffeine (max): 400 mg",
            );
        });
    });

    // The whole reason caffeine is a ceiling rather than a floor: 0 is the goal
    // someone cutting it out entirely sets, and a floor would file that as
    // "unset" — stored, echoed, then silently ignored, which is how the 0 g
    // alcohol limit bug went.
    test("a limit of 0 is stored, echoed and honoured", async () => {
        await withTools(null, async (call) => {
            const r = await call("set_nutrition_goals", {
                daily_caffeine_mg: 0,
            });
            expect(db.goals!.daily_caffeine_mg).toBe(0);
            expect(textOf(r)).toContain("- Caffeine (max): 0 mg");
            expect(textOf(r)).not.toContain("Caffeine (max): not set");
        });
        // ...and the progress line then reports anything at all as over it.
        expect(
            formatProgress(
                sumMeals([meal({ caffeine_mg: 95 })]),
                goals({ daily_caffeine_mg: 0 }),
                null,
                nutrientPresence([meal({ caffeine_mg: 95 })]),
            ),
        ).toContain("Caffeine: 95 / 0 mg limit (95 mg over)");
    });

    test("null clears it, and an omitted field keeps the stored value", async () => {
        await withTools(null, async (call) => {
            await call("set_nutrition_goals", { daily_caffeine_mg: 400 });
            await call("set_nutrition_goals", { daily_protein_g: 130 });
            expect(db.goals!.daily_caffeine_mg).toBe(400);
            await call("set_nutrition_goals", { daily_caffeine_mg: null });
            expect(db.goals!.daily_caffeine_mg).toBeNull();
        });
    });
});

// IMPORT_ROW_SCHEMA is a plain z.object, so zod STRIPS any key it does not
// declare — exactly the silent failure the source_id block below pins. Drop
// caffeine_mg from that schema and src/import.ts's unit tests all still pass
// while every imported milligram is discarded on the way in.
describe("bulk_import_meals carries caffeine_mg through the row schema", () => {
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

    test("an imported milligram figure reaches insertMeal", async () => {
        await withTools(null, async (c) => {
            const r = await call(c, [
                {
                    source_line: 2,
                    description: "Cold brew",
                    logged_at: "2026-07-20",
                    calories: 5,
                    caffeine_mg: 200,
                },
            ]);
            expect(r.isError).toBeFalsy();
            expect(db.inserted[0]!.caffeine_mg).toBe(200);
        });
    });

    // Bounds live in validateRow, not in Zod: a schema-level rejection happens
    // before the handler runs and discards the structured report, the warnings
    // and the analytics row — for what will be the caller's most common
    // mistake (a grams column mapped straight across).
    test("an out-of-range figure is a per-row error, not a lost batch", async () => {
        await withTools(null, async (c) => {
            const r = await call(c, [
                {
                    source_line: 2,
                    description: "Oatmeal",
                    logged_at: "2026-07-20",
                    calories: 300,
                },
                {
                    source_line: 3,
                    description: "Coffee",
                    logged_at: "2026-07-20",
                    caffeine_mg: MAX_CAFFEINE_MG + 1,
                },
            ]);
            expect(r.isError).toBeFalsy();
            const sc = r.structuredContent as unknown as {
                status: string;
                summary: { created: number; failed: number };
                results: {
                    source_line: number;
                    status: string;
                    error: { field: string; message: string } | null;
                }[];
            };
            // The good row still landed and the bad one is named — the whole
            // point of validating in the handler rather than in Zod.
            expect(sc.status).toBe("partial_success");
            expect(sc.summary.created).toBe(1);
            expect(sc.summary.failed).toBe(1);
            const bad = sc.results.find((row) => row.source_line === 3)!;
            expect(bad.status).toBe("failed");
            expect(bad.error!.field).toBe("caffeine_mg");
            // Milligrams in the message — reporting a gram bound here would
            // send the caller off correcting the wrong thing.
            expect(bad.error!.message).toContain(`${MAX_CAFFEINE_MG} mg`);
            expect(bad.error!.message).not.toContain(" g;");
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

// The completeness rule is only as good as its reach: it has to be on the two
// tools that write nutrition, and it must not contradict itself between the
// tool-level paragraph and the per-field text (a model reading a specific
// field's description will follow that one).
describe("the nutrient-completeness rule reaches the write tools", () => {
    async function toolsOf() {
        const server = new McpServer(
            { name: "t", version: "0.0.0" },
            { capabilities: { tools: {}, resources: {} } },
        );
        registerTools(server, "u1", true, null);
        const [ct, st] = InMemoryTransport.createLinkedPair();
        const client = new Client({ name: "c", version: "0.0.0" });
        await Promise.all([server.connect(st), client.connect(ct)]);
        const { tools } = await client.listTools();
        await client.close();
        await server.close();
        return tools;
    }

    test("log_meal and update_meal both carry it", async () => {
        const tools = await toolsOf();
        for (const name of ["log_meal", "update_meal"]) {
            const desc = tools.find((t) => t.name === name)?.description ?? "";
            expect(desc, name).toContain("are read on every meal");
            expect(desc, name).toContain("not as zero");
        }
    });

    test("fiber and sugar are described as expected, with reference values", async () => {
        const tools = await toolsOf();
        const props = tools.find((t) => t.name === "log_meal")?.inputSchema
            .properties as Record<string, { description?: string }>;
        for (const key of ["fiber_g", "sugar_g", "added_sugar_g"]) {
            const d = props[key]?.description ?? "";
            expect(d, key).toContain("every meal");
            // The last-resort anchors: without them an estimate has nothing
            // behind it.
            expect(d, key).toContain("per 100 g");
            expect(d, key).toContain("0 is the correct value");
            // Describes the field; never directs the assistant (#190).
            expect(d, key).not.toMatch(/send (this|0)|do not omit|say so/i);
        }
    });

    // #213's guard, extended to every added-sugar text the model reads: the
    // two meal fields, the import row, the goal and the coverage block.
    test("added sugar is described, never directed, wherever it appears", async () => {
        const tools = await toolsOf();
        const prop = (tool: string, key: string, nested?: string) => {
            const schema = tools.find((t) => t.name === tool)?.inputSchema as {
                properties: Record<
                    string,
                    {
                        description?: string;
                        items?: {
                            properties: Record<
                                string,
                                { description?: string }
                            >;
                        };
                    }
                >;
            };
            return nested
                ? (schema.properties[nested]?.items?.properties[key]
                      ?.description ?? "")
                : (schema.properties[key]?.description ?? "");
        };
        const texts: Record<string, string> = {
            log_meal: prop("log_meal", "added_sugar_g"),
            update_meal: prop("update_meal", "added_sugar_g"),
            import_row: prop("bulk_import_meals", "added_sugar_g", "meals"),
            goal: prop("set_nutrition_goals", "daily_added_sugar_g"),
        };
        for (const [where, d] of Object.entries(texts)) {
            expect(d.toLowerCase(), where).toContain("added");
            expect(d, where).not.toMatch(
                /send (this|0)|do not omit|say so|\boffer\b|ask the user|you should|\balways\b|\bmust\b/i,
            );
        }
        // The definition the brief settled on, on both meal tools.
        for (const where of ["log_meal", "update_meal"]) {
            expect(texts[where], where).toContain("100% fruit juice");
            expect(texts[where], where).toContain("never more than it");
        }
        expect(texts.import_row).toContain("'Added sugars' column");
        expect(texts.goal).toContain("0 means none");
        // The added_sugar_g-accompanies-sugar_g sentence, true whether or
        // not the ADDED_SUGAR_REQUIRED_FROM gate is on ("may be refused").
        for (const where of ["log_meal", "update_meal"]) {
            expect(texts[where], where).toContain("It accompanies sugar_g");
            expect(texts[where], where).toContain("may be refused");
        }
        const coverage =
            tools.find((t) => t.name === "log_meal")?.description ?? "";
        expect(coverage).toContain("added_sugar_g is read on every meal");
        const accompanies =
            coverage.match(/It accompanies sugar_g[^.]*\./)?.[0] ?? "";
        expect(accompanies).toContain("may be refused");
        expect(accompanies).not.toMatch(
            /\bplease\b|\bmust\b|ask the user|\bretry\b|call again|you should|\balways\b/i,
        );
        const goalsTool =
            tools.find((t) => t.name === "set_nutrition_goals")?.description ??
            "";
        expect(goalsTool).toContain("total sugar, added sugar, alcohol");
    });

    // The one field that must keep saying the opposite.
    test("caffeine still says omit rather than zero, on both tools", async () => {
        const tools = await toolsOf();
        for (const name of ["log_meal", "update_meal"]) {
            const props = tools.find((t) => t.name === name)?.inputSchema
                .properties as Record<string, { description?: string }>;
            const d = props.caffeine_mg?.description ?? "";
            expect(d, name).toContain("measured, and it was none");
            expect(d.toLowerCase(), name).not.toContain(
                "send it on every meal",
            );
        }
    });
});

// ---------- added sugar ----------
//
// Tracked beside total sugar with its own ceiling, never inside any frozen
// structuredContent shape: every figure here reaches the model through
// `content`. withTools arms the client's strict schema check, so each tool
// call below also proves no structuredContent object gained a field.

describe("added sugar", () => {
    const banana = (id: string) =>
        meal({
            id,
            description: "Banana (120 g)",
            meal_type: "snack",
            calories: 107,
            protein_g: 1.3,
            carbs_g: 27.4,
            fat_g: 0.4,
            fiber_g: 3.1,
            sugar_g: 14.7,
            added_sugar_g: 0,
            alcohol_g: null,
        });
    const cola = meal({
        id: "00000000-0000-4000-8000-0000000000c0",
        description: "Cola (330 ml)",
        meal_type: "snack",
        calories: 139,
        protein_g: 0,
        carbs_g: 35,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 35,
        added_sugar_g: 35,
        alcohol_g: null,
    });

    describe("added ≤ total is a ToolError, never clamped", () => {
        test("log_meal refuses added above total in the same call", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Sweetened yogurt",
                    meal_type: "snack",
                    sugar_g: 10,
                    added_sugar_g: 12,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain(
                    "added_sugar_g (12 g) is more than sugar_g (10 g); added sugars are part of total sugars.",
                );
                expect(db.inserted).toHaveLength(0);
            });
        });

        test("log_meal stores a consistent pair, and added sugar alone", async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Cola (330 ml)",
                    meal_type: "snack",
                    sugar_g: 35,
                    added_sugar_g: "35",
                });
                expect(r.isError).toBeFalsy();
                expect(db.inserted[0]!.added_sugar_g).toBe(35);
                const alone = await call("log_meal", {
                    description: "Honey (1 tbsp)",
                    meal_type: "snack",
                    added_sugar_g: 17,
                });
                expect(alone.isError).toBeFalsy();
                expect(db.inserted[1]!.added_sugar_g).toBe(17);
            });
        });

        test("update_meal checks added_sugar_g alone against the stored sugar_g", async () => {
            db.meals = [meal({ sugar_g: 10, added_sugar_g: null })];
            await withTools(null, async (call) => {
                const r = await call("update_meal", {
                    id: MEAL_ID,
                    added_sugar_g: 12,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain(
                    "added_sugar_g (12 g) is more than sugar_g (10 g)",
                );
                expect(db.mealUpdates).toHaveLength(0);
                expect(db.storedMealReads).toBe(1);

                const ok = await call("update_meal", {
                    id: MEAL_ID,
                    added_sugar_g: 8,
                });
                expect(ok.isError).toBeFalsy();
                expect(db.mealUpdates[0]!.added_sugar_g).toBe(8);
            });
        });

        test("update_meal checks sugar_g alone against the stored added_sugar_g", async () => {
            db.meals = [meal({ sugar_g: 40, added_sugar_g: 30 })];
            await withTools(null, async (call) => {
                const r = await call("update_meal", {
                    id: MEAL_ID,
                    sugar_g: 20,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain(
                    "added_sugar_g (30 g) is more than sugar_g (20 g)",
                );
                expect(db.mealUpdates).toHaveLength(0);
            });
        });

        test("update_meal conditions a one-sided write on the stored value it checked", async () => {
            db.meals = [meal({ sugar_g: 10, added_sugar_g: null })];
            await withTools(null, async (call) => {
                const added = await call("update_meal", {
                    id: MEAL_ID,
                    added_sugar_g: 8,
                });
                expect(added.isError).toBeFalsy();
                expect(db.mealUpdateGuards[0]).toEqual({ sugar_g: 10 });
            });
            db.meals = [meal({ sugar_g: 40, added_sugar_g: null })];
            await withTools(null, async (call) => {
                const sugar = await call("update_meal", {
                    id: MEAL_ID,
                    sugar_g: 20,
                });
                expect(sugar.isError).toBeFalsy();
                // A null stored value is guarded as null (IS NULL).
                expect(db.mealUpdateGuards[1]).toEqual({ added_sugar_g: null });
            });
        });

        test("update_meal writes nothing when the checked value moved before the write", async () => {
            db.meals = [meal({ sugar_g: 40, added_sugar_g: null })];
            // Another update_meal lowers sugar_g after this call's check read
            // sugar_g 40 and accepted added_sugar_g 30.
            db.concurrentMealEdit = { sugar_g: 20 };
            await withTools(null, async (call) => {
                const r = await call("update_meal", {
                    id: MEAL_ID,
                    added_sugar_g: 30,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toBe(
                    `The sugar values stored on meal ${MEAL_ID} changed while this edit was being applied, so nothing was written. Stored now: sugar_g 20 g, added_sugar_g not recorded.`,
                );
                expect(db.mealUpdates).toHaveLength(0);
            });
            const row = db.analyticsRows.find(
                (r) => r.tool_name === "update_meal",
            );
            expect(row?.error_category).not.toBe("record_not_found");
        });

        test("update_meal passing both checks the pair without reading the row", async () => {
            db.meals = [meal({ sugar_g: 5, added_sugar_g: 5 })];
            await withTools(null, async (call) => {
                const bad = await call("update_meal", {
                    id: MEAL_ID,
                    sugar_g: 20,
                    added_sugar_g: 25,
                });
                expect(bad.isError).toBe(true);
                const ok = await call("update_meal", {
                    id: MEAL_ID,
                    sugar_g: 20,
                    added_sugar_g: 15,
                });
                expect(ok.isError).toBeFalsy();
                expect(db.storedMealReads).toBe(0);
                // Both values come from this call: nothing to condition on.
                expect(db.mealUpdateGuards).toEqual([undefined]);
            });
        });

        test("updatedAddedSugarError merges the passed value over the stored one", () => {
            const stored = { sugar_g: 10, added_sugar_g: 4 };
            expect(updatedAddedSugarError({ added_sugar_g: 10 }, stored)).toBe(
                null,
            );
            expect(
                updatedAddedSugarError({ added_sugar_g: 11 }, stored),
            ).toContain("is more than sugar_g (10 g)");
            expect(updatedAddedSugarError({ sugar_g: 3 }, stored)).toContain(
                "added_sugar_g (4 g)",
            );
            // A side not recorded anywhere leaves nothing to compare against.
            expect(
                updatedAddedSugarError(
                    { added_sugar_g: 50 },
                    { sugar_g: null, added_sugar_g: null },
                ),
            ).toBe(null);
            expect(updatedAddedSugarError({ added_sugar_g: 50 }, null)).toBe(
                null,
            );
        });
    });

    // The rollout-gated refusal: sugar_g without added_sugar_g. The gate is an
    // env var read per call, so these set and restore it rather than mock a
    // module (see "Server wiring" in CLAUDE.md for why the gate exists).
    describe("sugar_g without added_sugar_g (ADDED_SUGAR_REQUIRED_FROM)", () => {
        const PAST = "2000-01-01T00:00:00Z";
        const FUTURE = "2999-01-01T00:00:00Z";
        async function withGate(
            value: string | undefined,
            run: () => Promise<void>,
        ): Promise<void> {
            const before = process.env[ADDED_SUGAR_REQUIRED_FROM_ENV];
            if (value === undefined)
                delete process.env[ADDED_SUGAR_REQUIRED_FROM_ENV];
            else process.env[ADDED_SUGAR_REQUIRED_FROM_ENV] = value;
            try {
                await run();
            } finally {
                if (before === undefined)
                    delete process.env[ADDED_SUGAR_REQUIRED_FROM_ENV];
                else process.env[ADDED_SUGAR_REQUIRED_FROM_ENV] = before;
            }
        }
        const colaArgs = {
            description: "Cola (330 ml)",
            meal_type: "snack",
            sugar_g: 35,
        };

        test.each([
            ["unset", undefined],
            ["empty", ""],
            ["garbage", "next tuesday"],
            ["offset-less time", "2000-01-01T00:00"],
            ["in the future", FUTURE],
        ])("gate %s: sugar alone is still saved", async (_label, value) => {
            const warn = spyOn(console, "warn").mockImplementation(() => {});
            try {
                await withGate(value, async () => {
                    expect(addedSugarRequiredNow()).toBe(false);
                    await withTools(null, async (call) => {
                        const r = await call("log_meal", colaArgs);
                        expect(r.isError).toBeFalsy();
                        expect(db.inserted).toHaveLength(1);
                        expect(db.inserted[0]!.added_sugar_g).toBeUndefined();
                    });
                });
            } finally {
                warn.mockRestore();
            }
        });

        test("an unparseable gate warns once, naming only the variable", () => {
            const warn = spyOn(console, "warn").mockImplementation(() => {});
            try {
                return withGate("not-a-date-xyz", async () => {
                    addedSugarRequiredNow();
                    addedSugarRequiredNow();
                    const lines = warn.mock.calls
                        .map((c) => String(c[0]))
                        .filter((l) =>
                            l.includes(ADDED_SUGAR_REQUIRED_FROM_ENV),
                        );
                    expect(lines).toHaveLength(1);
                    expect(lines[0]).not.toContain("not-a-date-xyz");
                });
            } finally {
                warn.mockRestore();
            }
        });

        test("the gate switches on at its instant", () =>
            withGate("2026-10-05T00:00:00+03:00", async () => {
                const at = Date.parse("2026-10-04T21:00:00Z");
                expect(addedSugarRequiredNow(at - 1)).toBe(false);
                expect(addedSugarRequiredNow(at)).toBe(true);
            }));

        test("gate past: log_meal refuses sugar without added sugar, writing nothing", () =>
            withGate(PAST, async () => {
                await withTools(null, async (call) => {
                    for (const sugar_g of [35, 0]) {
                        const r = await call("log_meal", {
                            ...colaArgs,
                            sugar_g,
                        });
                        expect(r.isError).toBe(true);
                        expect(textOf(r)).toBe(addedSugarMissingText());
                    }
                });
                expect(db.inserted).toHaveLength(0);
                // Refused before the profile read behind the timestamp.
                expect(db.profileReads).toHaveLength(0);
                const rows = db.analyticsRows.filter(
                    (r) => r.tool_name === "log_meal",
                );
                expect(rows).toHaveLength(2);
                for (const row of rows) {
                    expect(row.success).toBe(false);
                    expect(row.error_category).toBe("added_sugar_missing");
                }
            }));

        test("gate past: added sugar 0, or no sugar at all, is saved", () =>
            withGate(PAST, async () => {
                await withTools(null, async (call) => {
                    const zero = await call("log_meal", {
                        description: "Apple",
                        meal_type: "snack",
                        sugar_g: 10,
                        added_sugar_g: 0,
                    });
                    expect(zero.isError).toBeFalsy();
                    const none = await call("log_meal", {
                        description: "Eggs",
                        meal_type: "breakfast",
                        calories: 150,
                    });
                    expect(none.isError).toBeFalsy();
                    // The missing-nutrient note still names the gap.
                    expect(textOf(none)).toContain("sugar_g, added_sugar_g");
                });
                expect(db.inserted).toHaveLength(2);
            }));

        test("gate past: the pair check still applies when both are given", () =>
            withGate(PAST, async () => {
                await withTools(null, async (call) => {
                    const r = await call("log_meal", {
                        ...colaArgs,
                        sugar_g: 10,
                        added_sugar_g: 12,
                    });
                    expect(r.isError).toBe(true);
                    expect(textOf(r)).toContain(
                        "added_sugar_g (12 g) is more than sugar_g (10 g)",
                    );
                });
            }));

        test("gate past: update_meal refuses sugar_g on a meal with no added sugar stored", () =>
            withGate(PAST, async () => {
                db.meals = [meal({ sugar_g: 10, added_sugar_g: null })];
                await withTools(null, async (call) => {
                    const r = await call("update_meal", {
                        id: MEAL_ID,
                        sugar_g: 35,
                    });
                    expect(r.isError).toBe(true);
                    expect(textOf(r)).toBe(addedSugarMissingText(MEAL_ID));
                    expect(textOf(r)).toContain(`meal ${MEAL_ID} is unchanged`);
                    expect(db.mealUpdates).toHaveLength(0);
                    // Both given: saved.
                    const both = await call("update_meal", {
                        id: MEAL_ID,
                        sugar_g: 35,
                        added_sugar_g: 35,
                    });
                    expect(both.isError).toBeFalsy();
                });
                expect(db.mealUpdates).toHaveLength(1);
                const refused = db.analyticsRows.find(
                    (r) => r.tool_name === "update_meal" && !r.success,
                );
                expect(refused?.error_category).toBe("added_sugar_missing");
            }));

        test("gate past: update_meal accepts sugar_g when added sugar is already stored", () =>
            withGate(PAST, async () => {
                db.meals = [meal({ sugar_g: 40, added_sugar_g: 30 })];
                await withTools(null, async (call) => {
                    const ok = await call("update_meal", {
                        id: MEAL_ID,
                        sugar_g: 35,
                    });
                    expect(ok.isError).toBeFalsy();
                    // The existing added ≤ total check is untouched. (The
                    // stub's updateMeal stores only the fields passed, so
                    // re-stage the stored pair.)
                    db.meals = [meal({ sugar_g: 40, added_sugar_g: 30 })];
                    const low = await call("update_meal", {
                        id: MEAL_ID,
                        sugar_g: 20,
                    });
                    expect(low.isError).toBe(true);
                    expect(textOf(low)).toContain(
                        "added_sugar_g (30 g) is more than sugar_g (20 g)",
                    );
                });
            }));

        test("gate past: update_meal without sugar_g, and a missing meal, are unaffected", () =>
            withGate(PAST, async () => {
                db.meals = [meal({ sugar_g: null, added_sugar_g: null })];
                await withTools(null, async (call) => {
                    const r = await call("update_meal", {
                        id: MEAL_ID,
                        calories: 300,
                    });
                    expect(r.isError).toBeFalsy();
                    const added = await call("update_meal", {
                        id: MEAL_ID,
                        added_sugar_g: 5,
                    });
                    expect(added.isError).toBeFalsy();
                });
                expect(db.mealUpdates).toHaveLength(2);
                // No such meal: not the added-sugar refusal (the stub's
                // updateMeal stands in for the real not-found check).
                db.meals = [];
                await withTools(null, async (call) => {
                    const r = await call("update_meal", {
                        id: MEAL_ID,
                        sugar_g: 5,
                    });
                    expect(textOf(r)).not.toContain(
                        "added_sugar_g is required",
                    );
                });
            }));

        test("gate past: bulk_import_meals is unaffected", () =>
            withGate(PAST, async () => {
                await withTools(null, async (call) => {
                    const r = await call("bulk_import_meals", {
                        meals: [
                            {
                                source_line: 2,
                                description: "Cola",
                                logged_at: "2026-07-20",
                                calories: 139,
                                sugar_g: 35,
                            },
                        ],
                        expected_row_count: 1,
                        dry_run: false,
                    });
                    expect(r.isError).toBeFalsy();
                    expect(
                        (r.structuredContent as { status: string }).status,
                    ).toBe("success");
                });
                expect(db.inserted).toHaveLength(1);
                expect(db.inserted[0]!.sugar_g).toBe(35);
            }));

        test("the refusal text describes, never directs", () => {
            for (const text of [
                addedSugarMissingText(),
                addedSugarMissingText(MEAL_ID),
            ]) {
                expect(text).toContain("100% fruit juice");
                expect(text).not.toMatch(
                    /\bplease\b|you must|\bmust\b|ask the user|\bretry\b|call again|you should|\boffer\b/i,
                );
            }
        });
    });

    describe("formatProgress / formatGoals", () => {
        test("an added-sugar ceiling line follows Sugar", () => {
            const day = [banana("b1"), banana("b2"), cola];
            const text = formatProgress(
                sumMeals(day),
                goals({ daily_sugar_g: null, daily_added_sugar_g: 25 }),
                null,
                nutrientPresence(day),
            );
            const lines = text.split("\n");
            const sugarAt = lines.findIndex((l) => l.startsWith("Sugar:"));
            expect(lines[sugarAt]).toBe("Sugar: 64.4g");
            expect(lines[sugarAt + 1]).toBe(
                "Added sugar: 35 / 25g limit (140%, 10g over)",
            );
        });

        test("0 is a real added-sugar ceiling", () => {
            const zero = goals({ daily_added_sugar_g: 0 });
            const clear = [meal({ added_sugar_g: 0 })];
            expect(
                formatProgress(
                    sumMeals(clear),
                    zero,
                    null,
                    nutrientPresence(clear),
                ),
            ).toContain("Added sugar: 0 / 0g limit (clear)");
            const over = [meal({ added_sugar_g: 5 })];
            expect(
                formatProgress(
                    sumMeals(over),
                    zero,
                    null,
                    nutrientPresence(over),
                ),
            ).toContain("Added sugar: 5 / 0g limit (5g over)");
            expect(formatGoals(zero)).toContain("- Added sugar (max): 0g");
        });

        // A meal logged before the column existed is NULL: "not recorded"
        // when a limit is set, nothing at all otherwise — never "0g".
        test("an unrecorded day is not recorded, not zero", () => {
            const old = [meal({ added_sugar_g: null })];
            const present = nutrientPresence(old);
            expect(present.added_sugar_g).toBe(false);
            expect(
                formatProgress(
                    sumMeals(old),
                    goals({ daily_added_sugar_g: 25 }),
                    null,
                    present,
                ),
            ).toContain("Added sugar: not recorded on this day (limit 25g)");
            const noLimit = formatProgress(
                sumMeals(old),
                goals(),
                null,
                present,
            );
            expect(noLimit).not.toContain("Added sugar");
            // Total sugar is untouched by the missing added figure.
            expect(noLimit).toContain("Sugar: 12 / 40g limit");
        });

        // The ChatGPT report: a cola logged with sugar_g 35 and no
        // added_sugar_g. The added-sugar line must still be there, saying it
        // was not recorded, so total sugar is never read against the
        // added-sugar limit. 0 is a real ceiling, so it gets the line too.
        test("a limit with nothing recorded prints the gap, 0 included", () => {
            const cola = [meal({ sugar_g: 35, added_sugar_g: null })];
            const present = nutrientPresence(cola);
            for (const [limit, shown] of [
                [29, "29"],
                [0, "0"],
                [27.5, "27.5"],
            ] as const) {
                const text = formatProgress(
                    sumMeals(cola),
                    goals({ daily_sugar_g: null, daily_added_sugar_g: limit }),
                    null,
                    present,
                );
                const lines = text.split("\n");
                const sugarAt = lines.findIndex((l) => l.startsWith("Sugar:"));
                expect(lines[sugarAt]).toBe("Sugar: 35g");
                expect(lines[sugarAt + 1]).toBe(
                    `Added sugar: not recorded on this day (limit ${shown}g)`,
                );
                expect(text).not.toMatch(/Added sugar: 35/);
                // Describes the gap, never directs (#190's guard).
                expect(lines[sugarAt + 1]).not.toMatch(
                    /\b(ask|offer|should|estimate|call|tell|suggest|please|must)\b/i,
                );
            }
            // No limit and nothing recorded: exactly as before, no line.
            const none = formatProgress(
                sumMeals(cola),
                goals({ daily_sugar_g: null, daily_added_sugar_g: null }),
                null,
                present,
            );
            expect(none).not.toContain("Added sugar");
            expect(none.split("\n")).toHaveLength(
                formatProgress(
                    sumMeals(cola),
                    goals({ daily_sugar_g: null, daily_added_sugar_g: null }),
                    null,
                    { ...present, added_sugar_g: false },
                ).split("\n").length,
            );
        });

        test("goals list both sugar limits, labelled apart", () => {
            const text = formatGoals(
                goals({ daily_sugar_g: 50, daily_added_sugar_g: 25 }),
            );
            expect(text).toContain("- Sugar, total (max): 50g");
            expect(text).toContain("- Added sugar (max): 25g");
            expect(text.indexOf("Sugar, total")).toBeLessThan(
                text.indexOf("Added sugar"),
            );
            expect(formatGoals(goals())).toContain(
                "- Added sugar (max): not set",
            );
        });
    });

    describe("coverage", () => {
        const day = (over: Partial<Meal>) => {
            const meals = [meal(over)];
            return { meals, totals: sumMeals(meals) };
        };

        test("a day with sugar but no added sugar drops out of the added-sugar average only", () => {
            const { averages, recordedDays } = rangeAverages([
                day({ sugar_g: 20, added_sugar_g: 10 }),
                day({ sugar_g: 30, added_sugar_g: null }),
            ]);
            expect(recordedDays.sugar_g).toBe(2);
            expect(averages.sugar_g).toBe(25);
            expect(recordedDays.added_sugar_g).toBe(1);
            expect(averages.added_sugar_g).toBe(10);
        });

        test("addedSugarAverageLine reads against the limit, and stays quiet when it has nothing to add", () => {
            expect(addedSugarAverageLine(10, 1, 2, 25)).toBe(
                "\n\nAdded sugar, daily average: 10 / 25g limit (40%, under)",
            );
            expect(addedSugarAverageLine(10, 2, 2, null)).toBe(
                "\n\nAdded sugar, daily average: 10g",
            );
            // A single day already prints its own line.
            expect(addedSugarAverageLine(10, 1, 1, 25)).toBe("");
            // Nothing recorded is not an average of 0: silent without a
            // limit, the gap stated with one (0 is a real limit).
            expect(addedSugarAverageLine(0, 0, 3, null)).toBe("");
            expect(addedSugarAverageLine(0, 0, 3, 25)).toBe(
                "\n\nAdded sugar, daily average: not recorded in this period (limit 25g)",
            );
            expect(addedSugarAverageLine(0, 0, 3, 0)).toBe(
                "\n\nAdded sugar, daily average: not recorded in this period (limit 0g)",
            );
            // A single day still defers to its own section.
            expect(addedSugarAverageLine(0, 0, 1, 25)).toBe("");
        });

        test("get_nutrition_summary states an unrecorded range against the limit", async () => {
            db.goals = goals({ daily_added_sugar_g: 29 });
            db.meals = [
                meal({
                    logged_at: "2026-07-25T12:00:00.000Z",
                    sugar_g: 35,
                    added_sugar_g: null,
                }),
                meal({
                    id: "00000000-0000-4000-8000-0000000000d3",
                    logged_at: "2026-07-26T12:00:00.000Z",
                    sugar_g: 20,
                    added_sugar_g: null,
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("get_nutrition_summary", {
                    start_date: "2026-07-25",
                    end_date: "2026-07-26",
                });
                expect(r.isError).toBeFalsy();
                const text = textOf(r);
                expect(text).toContain(
                    "Added sugar, daily average: not recorded in this period (limit 29g)",
                );
                expect(
                    text.match(
                        /Added sugar: not recorded on this day \(limit 29g\)/g,
                    ),
                ).toHaveLength(2);
                // None recorded is not partial coverage: no coverage note.
                expect(text).not.toContain("added sugar 0");
                const meta = r._meta?.[ADDED_SUGAR_META_KEY] as AddedSugarMeta;
                expect(meta.goal).toBe(29);
                expect(meta.days).toEqual({
                    "2026-07-25": null,
                    "2026-07-26": null,
                });
            });
            // Without a limit the text is exactly what it was.
            db.goals = goals({ daily_added_sugar_g: null });
            await withTools(null, async (call) => {
                const text = textOf(
                    await call("get_nutrition_summary", {
                        start_date: "2026-07-25",
                        end_date: "2026-07-26",
                    }),
                );
                expect(text).not.toContain("Added sugar");
            });
        });

        test("get_nutrition_summary averages added sugar in text over the days that record it", async () => {
            db.goals = goals({ daily_added_sugar_g: 25 });
            db.meals = [
                meal({
                    logged_at: "2026-07-25T12:00:00.000Z",
                    sugar_g: 20,
                    added_sugar_g: 10,
                }),
                meal({
                    id: "00000000-0000-4000-8000-0000000000d2",
                    logged_at: "2026-07-26T12:00:00.000Z",
                    sugar_g: 30,
                    added_sugar_g: null,
                }),
            ];
            await withTools(null, async (call) => {
                const r = await call("get_nutrition_summary", {
                    start_date: "2026-07-25",
                    end_date: "2026-07-26",
                });
                expect(r.isError).toBeFalsy();
                const text = textOf(r);
                expect(text).toContain(
                    "Added sugar, daily average: 10 / 25g limit (40%, under)",
                );
                expect(text).toContain(
                    "(Averaged over the days that record each figure, not all 2: added sugar 1.)",
                );
                expect(text).toContain(
                    "Added sugar: not recorded on this day (limit 25g)",
                );
            });
        });
    });

    describe("set_nutrition_goals", () => {
        test("stores, keeps, clears and echoes the added-sugar limit", async () => {
            await withTools(null, async (call) => {
                const set = await call("set_nutrition_goals", {
                    daily_added_sugar_g: 25,
                });
                expect(set.isError).toBeFalsy();
                expect(db.goals!.daily_added_sugar_g).toBe(25);
                expect(textOf(set)).toContain("- Added sugar (max): 25g");

                await call("set_nutrition_goals", { daily_protein_g: 130 });
                expect(db.goals!.daily_added_sugar_g).toBe(25);

                const zero = await call("set_nutrition_goals", {
                    daily_added_sugar_g: 0,
                });
                expect(textOf(zero)).toContain("- Added sugar (max): 0g");

                await call("set_nutrition_goals", {
                    daily_added_sugar_g: null,
                });
                expect(db.goals!.daily_added_sugar_g).toBeNull();

                const bad = await call("set_nutrition_goals", {
                    daily_added_sugar_g: MAX_GOAL_G + 1,
                });
                expect(bad.isError).toBe(true);
            });
        });
    });

    // The brief's acceptance day: two ~120 g bananas and a 330 ml cola.
    test("acceptance: bananas and a cola against a 25 g added-sugar limit", async () => {
        db.meals = [banana("b1"), banana("b2"), cola];
        db.goals = goals({ daily_sugar_g: null, daily_added_sugar_g: 25 });
        await withTools(null, async (call) => {
            const r = await call("get_goal_progress", { date: "2026-07-26" });
            expect(r.isError).toBeFalsy();
            const text = textOf(r);
            expect(text).toContain("Sugar: 64.4g");
            expect(text).toContain(
                "Added sugar: 35 / 25g limit (140%, 10g over)",
            );
        });
        // With the old 25 g total limit kept as well, both lines show.
        db.goals = goals({ daily_sugar_g: 25, daily_added_sugar_g: 25 });
        await withTools(null, async (call) => {
            const text = textOf(
                await call("get_goal_progress", { date: "2026-07-26" }),
            );
            expect(text).toContain(
                "Sugar: 64.4 / 25g limit (258%, 39.4g over)",
            );
            expect(text).toContain(
                "Added sugar: 35 / 25g limit (140%, 10g over)",
            );
        });
    });
});

describe("get_profile > alcohol tracking section", () => {
    test("reports enabled with the saved unit", async () => {
        db.profile = {
            ...PROFILE_BASE,
            alcohol_tracking_enabled: true,
            preferred_drink_unit: "uk",
        };
        await withTools("uk", async (call) => {
            const text = textOf(await call("get_profile", {}));
            expect(text).toContain("Alcohol tracking: enabled");
            expect(text).toContain("UK units");
            expect(text).not.toContain("no preference saved");
        });
    });

    test("flags the US fallback as a default, not a choice", async () => {
        db.profile = { ...PROFILE_BASE, alcohol_tracking_enabled: true };
        await withTools("us", async (call) => {
            const text = textOf(await call("get_profile", {}));
            expect(text).toContain("US standard drinks");
            expect(text).toContain("no preference saved");
        });
    });

    test("reports disabled, and that stored alcohol is kept", async () => {
        await withTools(null, async (call) => {
            const text = textOf(await call("get_profile", {}));
            expect(text).toContain("Alcohol tracking: disabled");
            expect(text).toContain("still stored");
            expect(text).toContain("set_alcohol_tracking");
        });
    });

    // A profile row that has never been touched must read as OFF: the fallback
    // is the opt-in itself.
    test("no profile row at all reads as disabled", async () => {
        db.profile = null;
        await withTools(null, async (call) => {
            expect(textOf(await call("get_profile", {}))).toContain(
                "Alcohol tracking: disabled",
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

// ---------- restoring an export is a no-op, not a second copy ----------

// Issue #69. The server-side dedup is unit-tested in import.test.ts; what this
// pins is the wiring, and specifically the one link that fails SILENTLY:
// IMPORT_ROW_SCHEMA is a plain z.object, so zod strips any key it does not
// declare. Drop source_id from that schema and every test in import.test.ts
// still passes while the fix stops working in production.
describe("bulk_import_meals honours the id column of our own export", () => {
    const EXPORTED_ID = "aaaaaaaa-1111-4111-8111-000000000001";

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

    const exportedRow = {
        source_line: 2,
        source_id: EXPORTED_ID,
        description: "Oatmeal",
        // Wall-clock form, exactly as export.ts renders it.
        logged_at: "2026-07-20 08:30:00",
        meal_type: "breakfast",
        calories: 300,
    };

    test("a row naming an existing meal is deduplicated, not inserted", async () => {
        db.meals = [meal({ id: EXPORTED_ID })];
        await withTools(null, async (c) => {
            const r = await call(c, [exportedRow]);
            const sc = r.structuredContent as unknown as {
                summary: { created: number; deduplicated: number };
                results: { status: string; meal_id: string | null }[];
            };
            expect(sc.summary.created).toBe(0);
            expect(sc.summary.deduplicated).toBe(1);
            expect(sc.results[0]!.status).toBe("deduplicated");
            expect(sc.results[0]!.meal_id).toBe(EXPORTED_ID);
            expect(db.inserted).toHaveLength(0);
        });
    });

    test("a dry run says so up front", async () => {
        db.meals = [meal({ id: EXPORTED_ID })];
        await withTools(null, async (c) => {
            const r = await call(c, [exportedRow], { dry_run: true });
            const sc = r.structuredContent as unknown as {
                summary: { would_create: number; deduplicated: number };
            };
            expect(sc.summary.would_create).toBe(0);
            expect(sc.summary.deduplicated).toBe(1);
        });
    });

    test("an id the user does not have imports normally", async () => {
        await withTools(null, async (c) => {
            const r = await call(c, [exportedRow]);
            const sc = r.structuredContent as unknown as {
                summary: { created: number };
            };
            expect(sc.summary.created).toBe(1);
            expect(db.inserted).toHaveLength(1);
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
            id: MEAL_ID,
            seed: (id) => {
                db.meals = [storedMeal({ id })];
            },
            deleted: `Meal ${MEAL_ID} deleted.`,
            notFound: `No meal found with id ${MEAL_ID}.`,
        },
        {
            tool: "delete_water",
            id: WATER_ID,
            seed: (id) => db.rowIds.add(id),
            deleted: `Water entry ${WATER_ID} deleted.`,
            notFound: `No water entry found with id ${WATER_ID}.`,
        },
        {
            tool: "delete_weight",
            id: WEIGHT_ID,
            seed: (id) => db.rowIds.add(id),
            deleted: `Weight entry ${WEIGHT_ID} deleted.`,
            notFound: `No weight entry found with id ${WEIGHT_ID}.`,
        },
        {
            tool: "delete_body_measurement",
            id: MEASUREMENT_ID,
            seed: (id) => db.rowIds.add(id),
            deleted: `Body measurement ${MEASUREMENT_ID} deleted.`,
            notFound: `No body measurement found with id ${MEASUREMENT_ID}.`,
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

// ---------- id params are checked before the database ----------
//
// A non-uuid id used to reach Postgres and come back as a uuid cast error. The
// delete tools answer it like any other missing row; the update tools throw a
// ToolError, which categorizeError files as record_not_found.
describe("id params are validated before the database", () => {
    const rowFor = (tool: string) =>
        db.analyticsRows.find((r) => r.tool_name === tool)!;

    test.each([
        ["delete_meal", "meal", "get_meals_today"],
        ["delete_water", "water entry", "get_water_today"],
        ["delete_weight", "weight entry", "get_weight_today"],
        [
            "delete_body_measurement",
            "body measurement",
            "get_body_measurements",
        ],
    ])(
        "%s answers a non-uuid id without touching the database",
        async (tool, kind, source) => {
            await withTools(null, async (call) => {
                const r = await call(tool, { id: "not-a-uuid" });
                expect(r.isError).toBeFalsy();
                const text = textOf(r);
                expect(
                    text.startsWith(`No ${kind} found with id "not-a-uuid"`),
                ).toBe(true);
                expect(text).toContain("ids are UUIDs");
                expect(text).toContain(source);
            });
            expect(db.deleteCalls).toBe(0);
            // Nothing matched, as with a well-formed id that names no row:
            // an answer, not a failure.
            expect(rowFor(tool).success).toBe(true);
        },
    );

    test("the echoed id is clipped to 64 characters", async () => {
        await withTools(null, async (call) => {
            const text = textOf(
                await call("delete_meal", { id: "x".repeat(200) }),
            );
            expect(text).toContain(`"${"x".repeat(64)}"`);
            expect(text).not.toContain("x".repeat(65));
        });
    });

    test.each([
        ["update_meal", "meal", "mealUpdates"],
        ["update_weight", "weight entry", "weightUpdates"],
        ["update_body_measurement", "body measurement", "measurementUpdates"],
    ] as const)(
        "%s refuses a non-uuid id as record_not_found",
        async (tool, kind, updates) => {
            await withTools(null, async (call) => {
                const r = await call(tool, { id: "not-a-uuid", notes: "x" });
                expect(r.isError).toBe(true);
                expect(
                    textOf(r).startsWith(
                        `No ${kind} found with id "not-a-uuid"`,
                    ),
                ).toBe(true);
            });
            expect(db[updates]).toHaveLength(0);
            // resolveWriteTimestamp reads the profile; the id check runs first.
            expect(db.profileReads).toHaveLength(0);
            expect(rowFor(tool).error_category).toBe("record_not_found");
        },
    );
});

// ---------- raw errors are sanitized at the exit ----------
//
// withAnalytics hands the model a ToolError's text verbatim and replaces every
// other error with a category message plus a ref, so Postgres/PostgREST text
// (table names, casts, constraint names) never reaches the conversation.
describe("raw database errors never reach the model", () => {
    const rowFor = (tool: string) =>
        db.analyticsRows.find((r) => r.tool_name === tool)!;

    test("a read failure becomes a category message with a ref", async () => {
        db.failWith = new Error(
            'Failed to get meals: relation "public.meals" does not exist',
        );
        await withTools(null, async (call) => {
            const r = await call("get_nutrition_summary", {
                start_date: "2026-07-01",
                end_date: "2026-07-07",
            });
            expect(r.isError).toBe(true);
            const text = textOf(r);
            expect(text).toContain("get_nutrition_summary could not finish");
            expect(text).toMatch(/\(ref [0-9a-f]{8}\)/);
            expect(text).not.toContain("relation");
            expect(text).not.toContain("Failed to");
            expect(text.startsWith("Error:")).toBe(false);
        });
        expect(rowFor("get_nutrition_summary").error_category).toBe(
            "supabase_error",
        );
    });

    test("a rejected value is reported as one, without the cast text", async () => {
        db.failWith = new Error(
            'Failed to delete meal: invalid input syntax for type uuid: "abc"',
        );
        await withTools(null, async (call) => {
            const r = await call("delete_meal", { id: MEAL_ID });
            expect(r.isError).toBe(true);
            const text = textOf(r);
            expect(text).toContain("rejected one of the values");
            expect(text).not.toContain("invalid input syntax");
            expect(text).not.toContain("uuid");
        });
        expect(rowFor("delete_meal").error_category).toBe("db_rejected_value");
    });

    // The real updateMeal pre-checks the row and throws this ToolError for a
    // well-formed id the user doesn't have; its text is written for the model.
    test("update_meal's not-found ToolError passes through verbatim", async () => {
        db.failWith = new ToolError(`No meal found with id ${MEAL_ID}.`);
        await withTools(null, async (call) => {
            const r = await call("update_meal", { id: MEAL_ID, notes: "x" });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toBe(`No meal found with id ${MEAL_ID}.`);
        });
        expect(rowFor("update_meal").error_category).toBe("record_not_found");
    });

    // upsertNutritionGoals throws this ToolError when the goal saved but its
    // history row did not; the tool must report it as written, not as a
    // per-category message that would hide that the goal itself went through.
    test("set_nutrition_goals reports a failed history insert verbatim", async () => {
        const message =
            "Failed to record this change in the goals history (ref 0123abcd). The new goals themselves were saved. Calling set_nutrition_goals again with the same values records the change, dated to when it was saved; it does not save anything twice.";
        db.goalsHistoryFailure = new ToolError(message);
        await withTools(null, async (call) => {
            const r = await call("set_nutrition_goals", {
                daily_calories: 1800,
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toBe(message);
        });
        expect(db.goals?.daily_calories).toBe(1800);
    });

    // Resources bypass withAnalytics, and the SDK forwards a thrown message to
    // the client verbatim, so the weekly summary carries its own catch.
    test("the weekly-summary resource hides the raw text behind a ref", async () => {
        db.failWith = new Error(
            'Failed to get meals: relation "public.meals" does not exist',
        );
        const warn = spyOn(console, "warn").mockImplementation(() => {});
        try {
            const message = await withHttpClient("u1", "legacy", (client) =>
                client.readResource({ uri: "nutrition://weekly-summary" }).then(
                    () => "resolved",
                    (e: unknown) =>
                        e instanceof Error ? e.message : String(e),
                ),
            );
            expect(message).toContain("Couldn't build the weekly summary");
            const ref = message.match(/\(ref ([0-9a-f]{8})\)/)?.[1];
            expect(ref).toBeDefined();
            expect(message).not.toContain("relation");
            expect(message).not.toContain("Failed to");
            const line = warn.mock.calls
                .map((c) => String(c[0]))
                .find((l) => l.startsWith("[resource] weekly-summary"));
            expect(line).toBe(
                `[resource] weekly-summary error ref=${ref}: ${JSON.stringify('Failed to get meals: relation "public.meals" does not exist')}`,
            );
        } finally {
            warn.mockRestore();
        }
    });
});

// ---------- range listings are bounded ----------
//
// get_meals_by_date_range returns every meal as full text, so an unbounded
// range dumped the whole diary into one response; get_nutrition_summary has
// the same guard at a quarter. The readers page, so the caps are about
// response size, not truncation. The guard runs inside withAnalytics, so each
// rejection is an isError result with an analytics row, not a schema-level
// refusal.
describe("date-range listings reject bad and oversized ranges", () => {
    const rowsFor = (tool: string) =>
        db.analyticsRows.filter((r) => r.tool_name === tool);

    test("the meal cap is a month", () => {
        expect(MEALS_RANGE_MAX_DAYS).toBe(31);
    });

    test("a range one day over the cap is refused with the way forward", async () => {
        await withTools(null, async (call) => {
            const r = await call("get_meals_by_date_range", {
                start_date: "2026-01-01",
                end_date: "2026-02-01",
            });
            expect(r.isError).toBe(true);
            const text = textOf(r);
            expect(text).toContain("spans 32 days");
            expect(text).toContain(`at most ${MEALS_RANGE_MAX_DAYS} days`);
            expect(text).toContain("get_trends");
            // Not get_nutrition_summary: it is capped itself (at
            // SUMMARY_RANGE_MAX_DAYS), so it is no route to a longer period.
            expect(text).not.toContain("get_nutrition_summary");
            expect(text).toContain("monthly calls");
        });
        const rows = rowsFor("get_meals_by_date_range");
        expect(rows).toHaveLength(1);
        expect(rows[0]!.success).toBe(false);
        expect(rows[0]!.error_category).toBe("date_range_too_long");
    });

    test("exactly 31 days inclusive is accepted", async () => {
        db.meals = [meal({ logged_at: "2026-01-15T12:00:00.000Z" })];
        await withTools(null, async (call) => {
            const r = await call("get_meals_by_date_range", {
                start_date: "2026-01-01",
                end_date: "2026-01-31",
            });
            expect(r.isError).toBeFalsy();
            expect(textOf(r)).toContain("## 2026-01-15 (1 meal)");
        });
        expect(rowsFor("get_meals_by_date_range")[0]!.success).toBe(true);
    });

    test("a reversed range is refused", async () => {
        await withTools(null, async (call) => {
            const r = await call("get_meals_by_date_range", {
                start_date: "2026-02-01",
                end_date: "2026-01-01",
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("is after end_date");
        });
        expect(rowsFor("get_meals_by_date_range")[0]!.error_category).toBe(
            "invalid_date_format",
        );
    });

    test.each(["2026-02-30", "2026-1-5", "yesterday", "2026-01-01T00:00"])(
        "a non-calendar date %p is refused",
        async (bad) => {
            await withTools(null, async (call) => {
                const r = await call("get_meals_by_date_range", {
                    start_date: "2026-01-01",
                    end_date: bad,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain(
                    `Invalid end_date "${bad}": not a real calendar date`,
                );
            });
            expect(rowsFor("get_meals_by_date_range")[0]!.error_category).toBe(
                "invalid_date_format",
            );
        },
    );

    test("get_weight_by_date_range has the same guard with a year's cap", async () => {
        await withTools(null, async (call) => {
            const ok = await call("get_weight_by_date_range", {
                start_date: "2024-01-01",
                end_date: "2024-12-31",
            });
            expect(ok.isError).toBeFalsy();
            expect(textOf(ok)).toContain("No weight found");

            const over = await call("get_weight_by_date_range", {
                start_date: "2024-01-01",
                end_date: "2025-01-01",
            });
            expect(over.isError).toBe(true);
            expect(textOf(over)).toContain(
                `at most ${WEIGHT_RANGE_MAX_DAYS} days`,
            );
            expect(textOf(over)).toContain("get_weight_trends");
        });
    });

    test("get_body_measurements has the same guard with a year's cap", async () => {
        expect(BODY_MEASUREMENT_RANGE_MAX_DAYS).toBe(366);
        await withTools(null, async (call) => {
            const ok = await call("get_body_measurements", {
                start_date: "2024-01-01",
                end_date: "2024-12-31",
            });
            expect(ok.isError).toBeFalsy();
            expect(textOf(ok)).toContain("No body measurements found");

            const over = await call("get_body_measurements", {
                start_date: "2024-01-01",
                end_date: "2025-01-01",
            });
            expect(over.isError).toBe(true);
            expect(textOf(over)).toContain(
                `at most ${BODY_MEASUREMENT_RANGE_MAX_DAYS} days`,
            );
        });
        expect(rowsFor("get_body_measurements")[1]!.error_category).toBe(
            "date_range_too_long",
        );
    });

    test("the summary cap is a quarter", () => {
        expect(SUMMARY_RANGE_MAX_DAYS).toBe(92);
    });

    test("get_nutrition_summary refuses a range one day over its cap", async () => {
        await withTools(null, async (call) => {
            const r = await call("get_nutrition_summary", {
                start_date: "2026-01-01",
                end_date: "2026-04-03",
            });
            expect(r.isError).toBe(true);
            const text = textOf(r);
            expect(text).toContain("spans 93 days");
            expect(text).toContain(`at most ${SUMMARY_RANGE_MAX_DAYS} days`);
            expect(text).toContain("get_trends");
        });
        const rows = rowsFor("get_nutrition_summary");
        expect(rows).toHaveLength(1);
        expect(rows[0]!.error_category).toBe("date_range_too_long");
    });

    test("get_nutrition_summary accepts exactly 92 days", async () => {
        await withTools(null, async (call) => {
            const r = await call("get_nutrition_summary", {
                start_date: "2026-01-01",
                end_date: "2026-04-02",
            });
            expect(r.isError).toBeFalsy();
        });
        expect(rowsFor("get_nutrition_summary")[0]!.success).toBe(true);
    });

    test("get_nutrition_summary refuses a reversed range", async () => {
        await withTools(null, async (call) => {
            const r = await call("get_nutrition_summary", {
                start_date: "2026-02-01",
                end_date: "2026-01-01",
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("is after end_date");
        });
        expect(rowsFor("get_nutrition_summary")[0]!.error_category).toBe(
            "invalid_date_format",
        );
    });

    test("get_nutrition_summary refuses a non-calendar date", async () => {
        await withTools(null, async (call) => {
            const r = await call("get_nutrition_summary", {
                start_date: "2026-02-01",
                end_date: "2026-02-30",
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain(
                `Invalid end_date "2026-02-30": not a real calendar date`,
            );
        });
    });
});

// ---------- meal listings are compact, local-time and bounded ----------
//
// A 30-day get_meals_by_date_range used to return ~257 KB: every meal as a
// dozen lines with its raw UTC instant and full notes. The listings now default
// to one line per meal (src/meal-listing.ts carries the unit tests); these
// drive the real tools to prove the wiring, the schema and the descriptions.
describe("meal listings are compact by default", () => {
    const KYIV_ISO = "2026-01-15T19:05:00.000Z";

    test("get_meals_today: one line with the id, local time, no note text", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        db.meals = [meal({ logged_at: KYIV_ISO, notes: "long note" })];
        await withTools(null, async (call) => {
            const r = await call("get_meals_today");
            expect(r.isError).toBeFalsy();
            const text = textOf(r);
            expect(text).toContain(`[id: ${MEAL_ID}]`);
            expect(text).toContain("Times are local (Europe/Kyiv)");
            expect(text).toContain("21:05");
            expect(text).not.toContain("long note");
            expect(text).not.toContain(KYIV_ISO);
            expect(text).not.toContain("T19:05");

            const full = textOf(
                await call("get_meals_today", { detail: "full" }),
            );
            expect(full).toContain("Notes: long note");
            expect(full).toContain("Time: 2026-01-15 21:05");
            expect(full).not.toContain(KYIV_ISO);
        });
    });

    // Pinned form: the v2 SDK answers an input-schema violation with an
    // isError tool result naming the field (the same form the write-tool
    // bounds above get), not a rejected callTool promise. The handler never
    // runs, so no analytics row is written.
    test("get_meals_by_date rejects an unknown detail at the schema", async () => {
        db.meals = [meal()];
        await withTools(null, async (call) => {
            const r = await call("get_meals_by_date", {
                date: "2026-07-26",
                detail: "bogus",
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("detail");
        });
        expect(
            db.analyticsRows.filter((r) => r.tool_name === "get_meals_by_date"),
        ).toHaveLength(0);
    });

    test("the range listing keeps its day headers in both modes", async () => {
        db.meals = [meal({ logged_at: "2026-01-15T12:00:00.000Z" })];
        await withTools(null, async (call) => {
            for (const detail of [undefined, "compact", "full"]) {
                const r = await call("get_meals_by_date_range", {
                    start_date: "2026-01-01",
                    end_date: "2026-01-31",
                    ...(detail ? { detail } : {}),
                });
                expect(r.isError).toBeFalsy();
                expect(textOf(r)).toContain("## 2026-01-15 (1 meal)");
                expect(textOf(r)).toContain("Times are local (UTC)");
            }
        });
    });

    test("detail is not sent to analytics", async () => {
        db.meals = [meal()];
        await withTools(null, async (call) => {
            await call("get_meals_by_date", {
                date: "2026-07-26",
                detail: "full",
            });
        });
        const row = db.analyticsRows.find(
            (r) => r.tool_name === "get_meals_by_date",
        )!;
        expect(JSON.stringify(row)).not.toContain("detail");
    });

    test("listTools shows detail on all three listings, and the id sources name the range tool", async () => {
        const server = new McpServer(
            { name: "t", version: "0.0.0" },
            { capabilities: { tools: {}, resources: {} } },
        );
        registerTools(server, "u1", true, null);
        const [ct, st] = InMemoryTransport.createLinkedPair();
        const client = new Client({ name: "c", version: "0.0.0" });
        await Promise.all([server.connect(st), client.connect(ct)]);
        const { tools } = await client.listTools();
        await client.close();
        await server.close();

        for (const name of [
            "get_meals_today",
            "get_meals_by_date",
            "get_meals_by_date_range",
        ]) {
            const schema = tools.find((t) => t.name === name)?.inputSchema as {
                properties?: Record<string, { enum?: string[] }>;
                required?: string[];
            };
            expect(schema.properties?.detail?.enum).toEqual([
                "compact",
                "full",
            ]);
            expect(schema.required ?? []).not.toContain("detail");
        }
        for (const name of ["update_meal", "delete_meal"]) {
            expect(tools.find((t) => t.name === name)?.description).toContain(
                "get_meals_by_date_range",
            );
        }
    });

    test("get_water_today prints local HH:MM, not the stored instant", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        db.waterByDate = [
            {
                id: WATER_ID,
                user_id: "u1",
                amount_ml: 250,
                logged_at: KYIV_ISO,
                notes: null,
                created_at: KYIV_ISO,
                idempotency_key: null,
            },
        ];
        await withTools(null, async (call) => {
            const text = textOf(await call("get_water_today"));
            expect(text).toContain("Times are local (Europe/Kyiv)");
            expect(text).toContain("- 250 ml at 21:05");
            expect(text).not.toContain("T19:05");
        });
    });

    test("get_weight_by_date_range prints local HH:MM, not the stored instant", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        db.weights = [
            {
                id: WEIGHT_ID,
                user_id: "u1",
                weight_g: 70_000,
                logged_at: KYIV_ISO,
                notes: null,
                created_at: KYIV_ISO,
                idempotency_key: null,
            },
        ];
        await withTools(null, async (call) => {
            const text = textOf(
                await call("get_weight_by_date_range", {
                    start_date: "2026-01-01",
                    end_date: "2026-01-31",
                }),
            );
            expect(text).toContain("Times are local (Europe/Kyiv)");
            expect(text).toContain("## 2026-01-15");
            expect(text).toContain("at 21:05");
            expect(text).not.toContain("T19:05");
        });
    });

    test("get_body_measurements prints local HH:MM, not the stored instant", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        db.measurements = [
            measurementRow({ logged_at: KYIV_ISO, created_at: KYIV_ISO }),
        ];
        await withTools(null, async (call) => {
            const text = textOf(
                await call("get_body_measurements", {
                    start_date: "2026-01-01",
                    end_date: "2026-01-31",
                }),
            );
            expect(text).toContain("Times are local (Europe/Kyiv)");
            expect(text).toContain("## 2026-01-15");
            expect(text).toContain("- Waist 84.5 cm at 21:05");
            expect(text).not.toContain("T19:05");
        });
    });

    test("write confirmations show local time", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        await withTools(null, async (call) => {
            const logged = textOf(
                await call("log_meal", {
                    description: "Soup",
                    meal_type: "dinner",
                    logged_at: "2026-01-15T21:05",
                }),
            );
            expect(logged).toContain("Time: 2026-01-15 21:05");
            expect(logged).toContain("Meal logged (Europe/Kyiv time):");
            expect(logged).not.toContain("T19:05");

            const mealUpdated = textOf(
                await call("update_meal", {
                    id: MEAL_ID,
                    logged_at: "2026-01-15T21:05",
                }),
            );
            expect(mealUpdated).toContain("Meal updated (Europe/Kyiv time):");

            const weight = textOf(
                await call("log_weight", {
                    weight: 70,
                    unit: "kg",
                    logged_at: "2026-01-15T21:05",
                }),
            );
            expect(weight).toContain("at 2026-01-15 21:05 (Europe/Kyiv)");
            expect(weight).not.toContain("T19:05");

            const updated = textOf(
                await call("update_weight", {
                    id: WEIGHT_ID,
                    logged_at: "2026-01-15T21:05",
                }),
            );
            expect(updated).toContain("at 2026-01-15 21:05");
            expect(updated).not.toContain("T19:05");
        });
    });
});

/**
 * The added-sugar gap topMealBreakdown leaves: 8 fruit-and-yogurt bowls lead
 * every ranked metric (total sugar included) with little or no added sugar,
 * and one sweetened drink carries the most added sugar of all while topping
 * nothing that ranks rows — so it is not among structuredContent.meals.
 */
function addedSugarGapMeals(): Meal[] {
    const bowls = Array.from({ length: 8 }, (_, i) =>
        meal({
            id: `00000000-0000-4000-8000-1000000000${String(i).padStart(2, "0")}`,
            logged_at: `2026-01-${String(i + 2).padStart(2, "0")}T08:00:00.000Z`,
            meal_type: "breakfast",
            description: `fruit and yogurt bowl ${i}`,
            calories: 400,
            protein_g: 20,
            carbs_g: 60,
            fat_g: 10,
            fiber_g: 8,
            sugar_g: 40,
            // One bowl has a little added sugar: it is kept already, so it
            // must not come back in `extra`.
            added_sugar_g: i === 3 ? 2 : 0,
            alcohol_g: 5,
            caffeine_mg: 60,
        }),
    );
    const drink = meal({
        id: "00000000-0000-4000-8000-200000000000",
        logged_at: "2026-01-20T15:00:00.000Z",
        meal_type: "snack",
        description: "sweetened iced tea",
        calories: 120,
        protein_g: 0,
        carbs_g: 30,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 30,
        added_sugar_g: 30,
        alcohol_g: 0,
        caffeine_mg: null,
    });
    return [...bowls, drink];
}

// ---------- the summary ships only the meals its widget can show ----------
//
// structuredContent.meals used to be one row per meal: 186 meals came to
// ~47 KB, of which the widget draws the top MEAL_BREAKDOWN_TOP_N per metric.
describe("get_nutrition_summary bounds its meal breakdown", () => {
    const METRICS = [
        "calories",
        "protein_g",
        "carbs_g",
        "fat_g",
        "fiber_g",
        "sugar_g",
        "alcohol_g",
        "caffeine_mg",
    ] as const;

    type Row = Record<string, unknown> & { description: string };
    interface SummaryPayload {
        meals: Row[];
    }
    /** The per-metric counts ride in the result's _meta, never in
     *  structuredContent, whose schema is frozen (see the output-schema
     *  freeze guard below). */
    const contributorsOf = (r: ToolResult) =>
        r._meta?.[MEAL_CONTRIBUTORS_META_KEY] as Record<string, number | null>;

    /** The widget's own mealList ranking: v > 0, descending, stable. */
    const topOf = (rows: Row[], key: string) =>
        rows
            .map((row) => ({ row, v: Number(row[key] ?? 0) || 0 }))
            .filter((r) => r.v > 0)
            .sort((a, b) => b.v - a.v)
            .slice(0, MEAL_BREAKDOWN_TOP_N)
            .map((r) => r.row.description);

    // 31 days × 6 meals with metrics that peak on different meals, so the
    // union is genuinely wider than any single metric's top 8.
    function month(): Meal[] {
        const out: Meal[] = [];
        for (let d = 1; d <= 31; d++) {
            for (let i = 0; i < 6; i++) {
                const n = (d - 1) * 6 + i;
                out.push(
                    meal({
                        id: `m-${n}`,
                        logged_at: `2026-01-${String(d).padStart(2, "0")}T${String(6 + i * 2).padStart(2, "0")}:00:00.000Z`,
                        description: `meal ${n}`,
                        calories: 200 + ((n * 37) % 500),
                        protein_g: (n * 13) % 60,
                        carbs_g: (n * 29) % 90,
                        fat_g: (n * 7) % 40,
                        fiber_g: (n * 11) % 15,
                        sugar_g: (n * 17) % 30,
                        alcohol_g: n % 10 === 0 ? 14 : 0,
                        caffeine_mg: i === 0 ? 50 + d : null,
                    }),
                );
            }
        }
        return out;
    }

    const summarize = (call: CallTool) =>
        call("get_nutrition_summary", {
            start_date: "2026-01-01",
            end_date: "2026-01-31",
        });

    test("a long meal description is clipped in structuredContent.meals, like a listing", async () => {
        const long = "x".repeat(500);
        db.meals = [
            meal({ description: long, logged_at: "2026-01-10T12:00:00Z" }),
        ];
        await withTools(null, async (call) => {
            const r = await summarize(call);
            expect(r.isError).toBeFalsy();
            const sc = r.structuredContent as unknown as SummaryPayload;
            expect(sc.meals).toHaveLength(1);
            expect(sc.meals[0]!.description).toBe(`${"x".repeat(200)}…`);
        });
    });

    test("a 186-meal month ships only the per-metric top N, with true counts", async () => {
        const meals = month();
        db.meals = meals;
        for (const alcohol of ["us", null] as const) {
            await withTools(alcohol, async (call) => {
                const r = await summarize(call);
                expect(r.isError).toBeFalsy();
                const sc = r.structuredContent as unknown as SummaryPayload;
                expect(sc.meals.length).toBeLessThanOrEqual(
                    METRICS.length * MEAL_BREAKDOWN_TOP_N,
                );
                expect(sc.meals.length).toBeGreaterThan(MEAL_BREAKDOWN_TOP_N);
                expect(sc).not.toHaveProperty("meal_contributors");
                const contributors = contributorsOf(r);
                expect(() =>
                    MEAL_CONTRIBUTORS.parse(contributors),
                ).not.toThrow();
                expect(contributors.calories).toBe(186);
                expect(contributors.caffeine_mg).toBe(31);
                expect(contributors.alcohol_g).toBe(alcohol ? 19 : null);

                // What the full breakdown would have been, ranked the widget's
                // way: every metric's top N survives the cut unchanged, and
                // nothing outside every top N is shipped.
                const all = mealBreakdown(meals, "UTC", alcohol) as Row[];
                const tops = new Set<string>();
                for (const key of METRICS) {
                    const expected = topOf(all, key);
                    expect(topOf(sc.meals, key)).toEqual(expected);
                    for (const d of expected) tops.add(d);
                }
                for (const row of sc.meals) {
                    expect(tops.has(row.description)).toBe(true);
                }
                expect(sc.meals.length).toBe(tops.size);
                // Logged order is kept.
                const order = sc.meals.map((m) =>
                    Number(m.description.slice(5)),
                );
                expect([...order].sort((a, b) => a - b)).toEqual(order);
            });
        }
    });

    test("the added-sugar list gets its top meals via _meta.extra, structuredContent.meals unchanged", async () => {
        const meals = addedSugarGapMeals();
        db.meals = meals;
        for (const alcohol of ["us", null] as const) {
            await withTools(alcohol, async (call) => {
                const r = await summarize(call);
                expect(r.isError).toBeFalsy();
                const sc = r.structuredContent as unknown as SummaryPayload;
                // Exactly what topMealBreakdown kept before `extra` existed:
                // the drink tops nothing that ranks rows, so it is absent.
                const before = topMealBreakdown(
                    mealBreakdown(meals, "UTC", alcohol),
                    alcohol,
                ).meals;
                expect(sc.meals).toEqual(before as Row[]);
                expect(
                    sc.meals.some(
                        (m) => m.description === "sweetened iced tea",
                    ),
                ).toBe(false);

                const meta = r._meta?.[ADDED_SUGAR_META_KEY] as AddedSugarMeta;
                expect(meta.v).toBe(1);
                expect(meta.contributors).toBe(2);
                // The kept bowl with 2 g is in `meals`, so not in `extra`.
                expect(meta.extra).toEqual([
                    {
                        description: "sweetened iced tea",
                        meal_type: "snack",
                        date: "2026-01-20",
                        added_sugar_g: 30,
                    },
                ]);
            });
        }
    });

    test("extra rows are formatted exactly like breakdown rows", () => {
        const meals = [
            meal({
                id: "00000000-0000-4000-8000-300000000000",
                description: "y".repeat(500),
                meal_type: null,
                // 00:30 on the 11th in Kyiv, still the 10th in UTC.
                logged_at: "2026-01-10T22:30:00.000Z",
                added_sugar_g: 12.345,
            }),
        ];
        const rows = mealBreakdown(meals, "Europe/Kyiv", null);
        expect(addedSugarExtra(meals, rows, [], MEAL_BREAKDOWN_TOP_N)).toEqual([
            {
                description: `${"y".repeat(200)}…`,
                meal_type: null,
                date: "2026-01-11",
                added_sugar_g: 12.3,
            },
        ]);
    });

    test("the empty path carries zero contributors in _meta", async () => {
        for (const alcohol of ["us", null] as const) {
            await withTools(alcohol, async (call) => {
                const r = await summarize(call);
                const sc = r.structuredContent as unknown as SummaryPayload;
                expect(sc.meals).toEqual([]);
                expect(sc).not.toHaveProperty("meal_contributors");
                expect(contributorsOf(r)).toEqual({
                    calories: 0,
                    protein_g: 0,
                    carbs_g: 0,
                    fat_g: 0,
                    fiber_g: 0,
                    sugar_g: 0,
                    alcohol_g: alcohol ? expect.any(Number) : null,
                    caffeine_mg: 0,
                });
            });
        }
    });
});

// ---------- single dates are validated before they are read ----------
//
// shiftLocalDate and zonedDayStartUtc roll "2026-99-99" over to 2034 instead of
// failing, and throw their own internal wording for "yesterday", so each
// date-taking read tool checks its date first and answers with the
// caller-facing message.
describe("date params are real calendar dates", () => {
    const rowFor = (tool: string) =>
        db.analyticsRows.find((r) => r.tool_name === tool)!;

    test.each([
        ["get_trends", "end_date", "yesterday"],
        ["get_meal_patterns", "end_date", "yesterday"],
        ["get_weight_trends", "end_date", "yesterday"],
        ["get_trends", "end_date", "2026-aa-01"],
        ["get_meals_by_date", "date", "2026-99-99"],
        ["get_goal_progress", "date", "2026-99-99"],
        ["get_water_by_date", "date", "2026-99-99"],
        ["get_weight_by_date", "date", "2026-99-99"],
        ["get_meals_by_date", "date", "2026-02-30"],
        ["get_body_measurements", "start_date", "2026-02-30"],
        ["get_body_measurements", "end_date", "yesterday"],
    ])("%s refuses %s %p", async (tool, param, bad) => {
        await withTools(null, async (call) => {
            const r = await call(tool, { [param]: bad });
            expect(r.isError).toBe(true);
            const text = textOf(r);
            expect(text).toContain(
                `Invalid ${param} "${bad}": not a real calendar date`,
            );
            expect(text).not.toContain("Invalid Date");
            expect(text).not.toContain("Invalid date string");
        });
        expect(rowFor(tool).error_category).toBe("invalid_date_format");
    });
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
            await call("get_profile");
        });

        const rows = rowsFor("get_profile");
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
        locale: string;
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
            // The empty-range branch has its own structuredContent literal,
            // separate from the populated one below — both must carry the
            // widget's resolved locale, not just the common case.
            expect(sc.locale).toBe("en");
        });
    });

    // The dashboard widget reads structuredContent.locale (get_language /
    // set_language) to render its own strings — not the language of `content`,
    // which stays whatever the model uses.
    test("structuredContent carries the profile's saved widget language", async () => {
        stage(1);
        db.profile = { ...PROFILE_BASE, locale: "de" };
        await withTools(null, async (call) => {
            const sc = (await summarize(call))
                .structuredContent as unknown as SummaryPayload;
            expect(sc.locale).toBe("de");
        });
    });

    test("structuredContent defaults locale to English when never set", async () => {
        stage(1);
        db.profile = { ...PROFILE_BASE, locale: null };
        await withTools(null, async (call) => {
            const sc = (await summarize(call))
                .structuredContent as unknown as SummaryPayload;
            expect(sc.locale).toBe("en");
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

// The same covered-days rule as fiber and sugar, but with no opt-in above it
// and with the "never recorded" case as the norm rather than the exception —
// so the summary is where a fabricated "0 mg average" would be most visible.
describe("get_nutrition_summary reports caffeine over its covered days only", () => {
    const START = "2026-07-20";
    const END = "2026-07-24"; // 5 calendar days inclusive

    interface SummaryPayload {
        averages: Record<string, number | null>;
        recorded_days: Record<string, number | null>;
        days: { date: string; caffeine_mg: number | null }[];
    }

    /** One meal a day for five days; `caffeine` gives each day's figure, with
     *  null meaning that day recorded no caffeine at all. */
    function stage(caffeine: (number | null)[]): void {
        db.meals = caffeine.map((mg, i) =>
            meal({
                id: `d-${i}`,
                logged_at: `2026-07-2${i}T12:00:00.000Z`,
                calories: 600,
                fiber_g: null,
                sugar_g: null,
                alcohol_g: null,
                caffeine_mg: mg,
            }),
        );
    }

    const summarize = (call: CallTool) =>
        call("get_nutrition_summary", { start_date: START, end_date: END });

    test("two coffee days out of five average over the two", async () => {
        stage([95, null, null, 105, null]);
        await withTools(null, async (call) => {
            const r = await summarize(call);
            const sc = r.structuredContent as unknown as SummaryPayload;
            expect(sc.recorded_days.caffeine_mg).toBe(2);
            expect(sc.averages.caffeine_mg).toBe(100);
            // The wrong answer: 200 / 5 logged days.
            expect(sc.averages.caffeine_mg).not.toBe(40);
            // Per-day, an uncovered day is null rather than a summed 0, so the
            // widget's client-side re-average can tell them apart.
            expect(sc.days.map((d) => d.caffeine_mg)).toEqual([
                95,
                null,
                null,
                105,
                null,
            ]);
            // And the text says which days the figure came from.
            expect(textOf(r)).toContain("caffeine 2");
        });
    });

    // The #78 trap in its most likely form: five logged days, none of them a
    // coffee. Nothing may claim a caffeine figure — not an average, not a
    // per-day zero, not a line in the text.
    test("a window with no caffeine at all reports null, not 0", async () => {
        stage([null, null, null, null, null]);
        await withTools(null, async (call) => {
            const r = await summarize(call);
            const sc = r.structuredContent as unknown as SummaryPayload;
            expect(sc.recorded_days.caffeine_mg).toBe(0);
            expect(sc.averages.caffeine_mg).toBeNull();
            expect(sc.days.every((d) => d.caffeine_mg === null)).toBe(true);
            expect(textOf(r)).not.toContain("Caffeine");
            expect(textOf(r)).not.toContain("caffeine");
        });
    });

    // recorded_days.caffeine_mg is a non-nullable declared field and averages
    // is a TOTALS_ITEM, so the empty-window early return has to build both — an
    // omitted key there is a validation error, not a null.
    test("an empty window still emits a complete, valid payload", async () => {
        await withTools(null, async (call) => {
            const r = await summarize(call);
            const sc = r.structuredContent as unknown as SummaryPayload;
            expect(r.isError).toBeFalsy();
            expect(sc.recorded_days.caffeine_mg).toBe(0);
            expect(sc.averages.caffeine_mg).toBeNull();
            expect(Object.keys(sc.averages)).toContain("caffeine_mg");
        });
    });

    // Every day covered: the coverage note is for PARTIAL coverage only, so
    // naming caffeine here would be noise on the case of a daily coffee
    // drinker, which is the most common caffeine user there is.
    test("a fully-covered window stays silent about caffeine coverage", async () => {
        stage([95, 95, 95, 95, 95]);
        await withTools(null, async (call) => {
            const r = await summarize(call);
            const sc = r.structuredContent as unknown as SummaryPayload;
            expect(sc.recorded_days.caffeine_mg).toBe(5);
            expect(sc.averages.caffeine_mg).toBe(95);
            expect(textOf(r)).not.toContain("caffeine 5");
        });
    });
});

// ---------- every write path places logged_at in the user's timezone ----------

// Issue #68. Before this, an offset-less `logged_at` went straight into a
// timestamptz column, where Postgres reads it in the session zone (UTC). A Kyiv
// user's 21:00 dinner landed at 21:00Z — midnight the NEXT day locally — so the
// meal vanished from "today" and reappeared on tomorrow's summary, and a bare
// date became UTC midnight, which for every negative-offset zone is the
// PREVIOUS local day. bulk_import_meals had resolved these correctly for
// months; the manual tools had no resolution at all. These tests drive the real
// tools end-to-end and assert on the value handed to the DB layer, because the
// echoed text alone cannot tell a correct instant from a mislabelled one.
describe("manual write tools resolve logged_at in the profile timezone", () => {
    const oatmeal = {
        description: "Oatmeal",
        meal_type: "breakfast",
        calories: 300,
    };
    const loggedAtOf = (row: Record<string, unknown> | undefined) =>
        row?.logged_at as string | undefined;

    // The core case: 08:30 in Kyiv is 05:30Z in July (UTC+3). Storing the raw
    // string instead files the meal three hours late.
    test("an offset-less local time is read as wall-clock time in the saved zone", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        await withTools(null, async (call) => {
            await call("log_meal", {
                ...oatmeal,
                logged_at: "2026-07-20T08:30:00",
            });
            expect(loggedAtOf(db.inserted[0])).toBe("2026-07-20T05:30:00.000Z");
        });
    });

    // The offset must come from the DATE being logged, not from today. Kyiv is
    // UTC+2 in January and UTC+3 in July, so a backfilled winter meal resolved
    // with the current offset would sit an hour off — enough to cross midnight
    // for anything logged late in the evening.
    test("a backfilled winter date uses that date's offset, not today's", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        await withTools(null, async (call) => {
            await call("log_meal", {
                ...oatmeal,
                logged_at: "2026-01-15T08:30",
            });
            expect(loggedAtOf(db.inserted[0])).toBe("2026-01-15T06:30:00.000Z");
        });
    });

    // A date with no time is anchored at local NOON, not local midnight: noon
    // leaves ~12 hours of slack before any offset change could drag the row
    // onto an adjacent calendar day.
    test("a bare date anchors at local noon and reads back as the same day", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        await withTools(null, async (call) => {
            await call("log_meal", { ...oatmeal, logged_at: "2026-07-20" });
            const stored = loggedAtOf(db.inserted[0])!;
            expect(stored).toBe("2026-07-20T09:00:00.000Z");
            expect(dateInTz(stored, "Europe/Kyiv")).toBe("2026-07-20");
        });
    });

    // The exact shape of the bug, in the zone that shows it: UTC midnight on
    // 2026-07-20 is 17:00 on 2026-07-19 in Los Angeles, so the old behaviour
    // filed a bare date one day EARLY for every user west of Greenwich.
    test("a bare date in a negative-offset zone does not slip to the previous day", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "America/Los_Angeles" };
        await withTools(null, async (call) => {
            await call("log_meal", { ...oatmeal, logged_at: "2026-07-20" });
            const stored = loggedAtOf(db.inserted[0])!;
            expect(stored).toBe("2026-07-20T19:00:00.000Z");
            expect(dateInTz(stored, "America/Los_Angeles")).toBe("2026-07-20");
            // The value the old code would have written, for contrast.
            expect(
                dateInTz("2026-07-20T00:00:00.000Z", "America/Los_Angeles"),
            ).toBe("2026-07-19");
        });
    });

    // A value that carries its own offset already names an instant. Applying
    // the profile zone on top of it would shift a correct timestamp.
    test("a value carrying its own offset is untouched by the profile timezone", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        await withTools(null, async (call) => {
            await call("log_meal", {
                ...oatmeal,
                logged_at: "2026-07-20T08:30:00Z",
            });
            await call("log_meal", {
                ...oatmeal,
                logged_at: "2026-07-20T08:30:00+05:00",
            });
            expect(loggedAtOf(db.inserted[0])).toBe("2026-07-20T08:30:00.000Z");
            expect(loggedAtOf(db.inserted[1])).toBe("2026-07-20T03:30:00.000Z");
        });
    });

    // Same offset-carrying string, opposite hemisphere of the prime meridian:
    // the profile zone must make no difference at all.
    test("two profiles resolve the same offset-carrying value identically", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        await withTools(null, async (call) => {
            await call("log_meal", {
                ...oatmeal,
                logged_at: "2026-07-20T08:30:00+05:00",
            });
        });
        const kyiv = loggedAtOf(db.inserted[0]);
        db.inserted = [];
        db.profile = { ...PROFILE_BASE, timezone: "America/Los_Angeles" };
        await withTools(null, async (call) => {
            await call("log_meal", {
                ...oatmeal,
                logged_at: "2026-07-20T08:30:00+05:00",
            });
        });
        expect(loggedAtOf(db.inserted[0])).toBe(kyiv!);
    });

    // The resolver must stay out of the way when the caller said nothing:
    // insertMeal derives its own "now" AND folds logged_at into the content
    // digest, so substituting a value here would change the idempotency key.
    test("an omitted logged_at reaches the DB layer as undefined", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        await withTools(null, async (call) => {
            const r = await call("log_meal", oatmeal);
            expect(r.isError).toBeFalsy();
            expect(db.inserted).toHaveLength(1);
            expect(loggedAtOf(db.inserted[0])).toBeUndefined();
            expect(textOf(r)).not.toContain("set_timezone");
        });
    });

    // log_meal, update_meal and log_water validated logged_at not at all, so
    // junk was handed to Postgres and came back as a raw cast error (or, worse,
    // parsed into something plausible). The handler throws, and withAnalytics
    // turns that into an isError result rather than rejecting the call.
    test("log_meal rejects a logged_at it cannot place on the timeline", async () => {
        await withTools(null, async (call) => {
            const r = await call("log_meal", {
                ...oatmeal,
                logged_at: "yesterday evening",
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("logged_at is invalid");
            expect(db.inserted).toHaveLength(0);
        });
    });

    // Read as UTC, an ordinary same-day local time from a user east of UTC
    // resolves into the future and is rejected — a call that used to succeed.
    // "logged_at is in the future" alone names the wrong cause, so the failure
    // path has to carry the same unset-timezone hint the success path does.
    test("a future-looking local time on an unconfigured account blames the timezone", async () => {
        db.profile = null;
        await withTools(null, async (call) => {
            const soon = new Date(Date.now() + 2 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 19);
            const r = await call("log_meal", { ...oatmeal, logged_at: soon });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("in the future");
            expect(textOf(r)).toContain("set_timezone");
            expect(db.inserted).toHaveLength(0);
        });
    });

    // An unparseable value was never placed anywhere, so the timezone had
    // nothing to do with it and the hint would only misdirect.
    test("an unparseable value on an unconfigured account does not blame the timezone", async () => {
        db.profile = null;
        await withTools(null, async (call) => {
            const r = await call("log_meal", {
                ...oatmeal,
                logged_at: "yesterday evening",
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).not.toContain("set_timezone");
        });
    });

    // A day/month swap ("20/07" mapped to month 20) is the realistic version of
    // the same mistake, and it must not roll over into a valid 2027 date.
    test("log_water rejects a calendar date that does not exist", async () => {
        await withTools(null, async (call) => {
            const r = await call("log_water", {
                amount_ml: 250,
                logged_at: "2026-20-07",
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("logged_at is invalid");
            expect(db.waterInserted).toHaveLength(0);
        });
    });

    // update_meal took the third route with no validation at all, and it can
    // move an already-correct entry, so a bad value there is a silent
    // corruption rather than a failed write.
    test("update_meal resolves a moved timestamp in the saved zone", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        await withTools(null, async (call) => {
            const r = await call("update_meal", {
                id: MEAL_ID,
                logged_at: "2026-07-20T08:30:00",
            });
            expect(r.isError).toBeFalsy();
            expect(loggedAtOf(db.mealUpdates[0])).toBe(
                "2026-07-20T05:30:00.000Z",
            );
        });
    });

    // No profiles row is the only reliable "timezone was never configured"
    // signal — a defaulted "UTC" column is indistinguishable from a user who
    // genuinely chose UTC. Falling back silently would file the entry hours off
    // with nothing on screen to explain it, so the tool has to say so.
    test("a never-configured timezone warns that the value was read as UTC", async () => {
        db.profile = null;
        await withTools(null, async (call) => {
            const text = textOf(
                await call("log_meal", {
                    ...oatmeal,
                    logged_at: "2026-07-20T08:30:00",
                }),
            );
            expect(text).toContain("set_timezone");
            expect(text).toContain("no timezone set");
            expect(loggedAtOf(db.inserted[0])).toBe("2026-07-20T08:30:00.000Z");
        });
    });

    // #99: a profile row can exist — any of set_weight_unit, set_widget_display
    // or set_alcohol_tracking creates one — without the user ever having called
    // set_timezone. `profile !== null` alone must not read as "configured".
    test("a profile row with no timezone still warns, even though it exists", async () => {
        db.profile = { ...PROFILE_BASE, timezone: null };
        await withTools(null, async (call) => {
            const text = textOf(
                await call("log_meal", {
                    ...oatmeal,
                    logged_at: "2026-07-20T08:30:00",
                }),
            );
            expect(text).toContain("set_timezone");
            expect(text).toContain("no timezone set");
            expect(loggedAtOf(db.inserted[0])).toBe("2026-07-20T08:30:00.000Z");
        });
    });

    // The warning is about a missing setting, not about the timestamp form: a
    // value carrying its own offset never consulted the timezone, so nagging
    // about it would be noise on every single call.
    test("no warning when the value carried its own offset, even with no profile", async () => {
        db.profile = null;
        await withTools(null, async (call) => {
            const text = textOf(
                await call("log_meal", {
                    ...oatmeal,
                    logged_at: "2026-07-20T08:30:00Z",
                }),
            );
            expect(text).not.toContain("set_timezone");
        });
    });

    // And a configured profile must stay quiet, or the note fires on every
    // ordinary log for every user who has done nothing wrong.
    test("no warning when the profile has a timezone", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        await withTools(null, async (call) => {
            const text = textOf(
                await call("log_meal", {
                    ...oatmeal,
                    logged_at: "2026-07-20T08:30:00",
                }),
            );
            expect(text).not.toContain("set_timezone");
        });
    });

    // The most common call shape of all: no logged_at, because "I just ate
    // this" never carries one. Found live — a meal logged this way with no
    // profile timezone produced no warning, silently defeating #99's entire
    // point for the overwhelming majority of real calls.
    test("still warns when logged_at is omitted entirely and the timezone is unset", async () => {
        db.profile = { ...PROFILE_BASE, timezone: null };
        await withTools(null, async (call) => {
            const text = textOf(await call("log_meal", oatmeal));
            expect(text).toContain("set_timezone");
            expect(text).toContain("no timezone set");
            expect(loggedAtOf(db.inserted[0])).toBeUndefined();
        });
    });

    test("no warning when logged_at is omitted and the timezone is configured", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        await withTools(null, async (call) => {
            const text = textOf(await call("log_meal", oatmeal));
            expect(text).not.toContain("set_timezone");
        });
    });

    // Water is bucketed into local days the same way meals are, so an
    // unresolved offset-less time moves a late-evening glass onto tomorrow's
    // hydration total.
    test("log_water resolves an offset-less time the same way", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        await withTools(null, async (call) => {
            const r = await call("log_water", {
                amount_ml: 250,
                logged_at: "2026-07-20T08:30:00",
            });
            expect(r.isError).toBeFalsy();
            expect(loggedAtOf(db.waterInserted[0])).toBe(
                "2026-07-20T05:30:00.000Z",
            );
        });
    });

    // Weight is ordered by logged_at to pick "latest", so a few hours of drift
    // can reorder two readings taken on the same day.
    test("log_weight resolves an offset-less time the same way", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        await withTools(null, async (call) => {
            const r = await call("log_weight", {
                weight: 70,
                unit: "kg",
                logged_at: "2026-07-20T08:30:00",
            });
            expect(r.isError).toBeFalsy();
            expect(loggedAtOf(db.weightInserted[0])).toBe(
                "2026-07-20T05:30:00.000Z",
            );
        });
    });

    // update_weight builds a patch object, and only a defined logged_at may
    // appear in it — resolving must not smuggle an undefined key into an update
    // that was only meant to change the notes.
    test("update_weight resolves an offset-less time and omits an absent one", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        await withTools(null, async (call) => {
            await call("update_weight", {
                id: WEIGHT_ID,
                logged_at: "2026-07-20T08:30:00",
            });
            expect(loggedAtOf(db.weightUpdates[0])).toBe(
                "2026-07-20T05:30:00.000Z",
            );
            await call("update_weight", { id: WEIGHT_ID, notes: "morning" });
            expect(db.weightUpdates[1]).not.toHaveProperty("logged_at");
        });
    });

    test("log_body_measurement resolves an offset-less time the same way", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        await withTools(null, async (call) => {
            const r = await call("log_body_measurement", {
                kind: "waist",
                value: 84.5,
                unit: "cm",
                logged_at: "2026-07-20T08:30:00",
            });
            expect(r.isError).toBeFalsy();
            expect(loggedAtOf(db.measurementInserted[0])).toBe(
                "2026-07-20T05:30:00.000Z",
            );
        });
    });

    test("update_body_measurement resolves an offset-less time and omits an absent one", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        db.measurements = [measurementRow()];
        await withTools(null, async (call) => {
            await call("update_body_measurement", {
                id: MEASUREMENT_ID,
                logged_at: "2026-07-20T08:30:00",
            });
            expect(loggedAtOf(db.measurementUpdates[0])).toBe(
                "2026-07-20T05:30:00.000Z",
            );
            await call("update_body_measurement", {
                id: MEASUREMENT_ID,
                notes: "morning",
            });
            expect(db.measurementUpdates[1]).not.toHaveProperty("logged_at");
        });
    });

    // The point of the whole change. The two routes do NOT dedupe against each
    // other — the importer stamps `import:` keys and log_meal derives `auto:`
    // ones — so both copies are stored either way. What must not differ is
    // where they land: before the fix the same string went in hours apart, so
    // the hand-logged meal and the imported one could sit on different local
    // days and every read path disagreed with itself.
    test("log_meal and bulk_import_meals resolve the same string identically", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        const LOCAL = "2026-07-20T08:30:00";
        await withTools(null, async (call) => {
            await call("log_meal", { ...oatmeal, logged_at: LOCAL });
            await call("bulk_import_meals", {
                meals: [
                    {
                        source_line: 1,
                        description: "Oatmeal",
                        logged_at: LOCAL,
                        calories: 300,
                    },
                ],
                expected_row_count: 1,
                dry_run: false,
            });
            expect(db.inserted).toHaveLength(2);
            expect(loggedAtOf(db.inserted[1])).toBe(
                loggedAtOf(db.inserted[0])!,
            );
            expect(loggedAtOf(db.inserted[0])).toBe("2026-07-20T05:30:00.000Z");
        });
    });

    // Same invariant for the bare-date form, where the two routes could most
    // easily disagree: one anchoring at noon and the other at midnight would
    // put the manual entry and the imported one on different local days.
    test("log_meal and bulk_import_meals anchor a bare date identically", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "America/Los_Angeles" };
        await withTools(null, async (call) => {
            await call("log_meal", { ...oatmeal, logged_at: "2026-07-20" });
            await call("bulk_import_meals", {
                meals: [
                    {
                        source_line: 1,
                        description: "Oatmeal",
                        logged_at: "2026-07-20",
                        calories: 300,
                    },
                ],
                expected_row_count: 1,
                dry_run: false,
            });
            expect(loggedAtOf(db.inserted[1])).toBe(
                loggedAtOf(db.inserted[0])!,
            );
            expect(loggedAtOf(db.inserted[0])).toBe("2026-07-20T19:00:00.000Z");
        });
    });
});

// ---------- body measurements ----------
//
// Five tools over body_measurement_log. What is pinned here is the handler
// logic: the unit rule (explicit, then the saved length unit, then refuse —
// never the weight unit), the per-site plausibility check, the kind filter and
// default window of the read, display in the preferred unit, and the update
// path that re-reads a stored number in a corrected unit. The SQL side is in
// supabase.test.ts / supabase-window.test.ts.
describe("body measurements", () => {
    const rowsFor = (tool: string) =>
        db.analyticsRows.filter((r) => r.tool_name === tool);

    test("an explicit unit is stored as entered, plus its millimetres", async () => {
        await withTools(null, async (call) => {
            const r = await call("log_body_measurement", {
                kind: "hips",
                value: 40,
                unit: "in",
            });
            expect(r.isError).toBeFalsy();
            const text = textOf(r);
            expect(text).toContain("Body measurement logged: Hips 40 in");
            expect(text).toContain(`ID: ${MEASUREMENT_ID}`);
        });
        expect(db.measurementInserted).toHaveLength(1);
        expect(db.measurementInserted[0]).toMatchObject({
            kind: "hips",
            value_mm: 1016,
            value_entered: 40,
            entered_unit: "in",
        });
    });

    test("a saved length unit fills in a missing unit", async () => {
        db.profile = { ...PROFILE_BASE, preferred_length_unit: "cm" };
        await withTools(null, async (call) => {
            const r = await call("log_body_measurement", {
                kind: "waist",
                value: 84.5,
            });
            expect(r.isError).toBeFalsy();
            expect(textOf(r)).toContain("Waist 84.5 cm");
        });
        expect(db.measurementInserted[0]).toMatchObject({
            value_mm: 845,
            entered_unit: "cm",
        });
    });

    test("no unit and no saved length unit is refused", async () => {
        await withTools(null, async (call) => {
            const r = await call("log_body_measurement", {
                kind: "waist",
                value: 84.5,
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("No length unit given");
            expect(textOf(r)).toContain("set_length_unit");
        });
        expect(db.measurementInserted).toHaveLength(0);
        expect(rowsFor("log_body_measurement")[0]!.error_category).toBe(
            "missing_required_param",
        );
    });

    test("the weight unit is never used as a length unit", async () => {
        db.profile = { ...PROFILE_BASE, preferred_weight_unit: "lb" };
        await withTools(null, async (call) => {
            const r = await call("log_body_measurement", {
                kind: "waist",
                value: 33,
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("No length unit given");
        });
        expect(db.measurementInserted).toHaveLength(0);
    });

    test("an implausible value is refused, with the other unit only when it fits", async () => {
        await withTools(null, async (call) => {
            const mm = await call("log_body_measurement", {
                kind: "waist",
                value: 845,
                unit: "cm",
            });
            expect(mm.isError).toBe(true);
            expect(textOf(mm)).toContain("is outside the plausible range");

            const swapped = await call("log_body_measurement", {
                kind: "calf",
                value: 10,
                unit: "cm",
            });
            expect(swapped.isError).toBe(true);
            expect(textOf(swapped)).toContain("As 10 in it would be in range");
            // No hint when the number fits neither unit.
            expect(textOf(mm)).not.toContain(" As ");
        });
        expect(db.measurementInserted).toHaveLength(0);
        expect(rowsFor("log_body_measurement")[0]!.error_category).toBe(
            "invalid_numeric_value",
        );
    });

    test("the kind filter reaches the reader and only that site is listed", async () => {
        db.measurements = [
            measurementRow({ kind: "waist" }),
            measurementRow({
                id: "00000000-0000-4000-8000-000000000005",
                kind: "neck",
                value_mm: 380,
                value_entered: 38,
            }),
        ];
        await withTools(null, async (call) => {
            const text = textOf(
                await call("get_body_measurements", {
                    kind: "neck",
                    start_date: "2026-08-01",
                    end_date: "2026-08-31",
                }),
            );
            expect(text).toContain("- Neck 38 cm");
            expect(text).not.toContain("Waist");
        });
        expect(db.measurementRangeArgs[0]!.kind).toBe("neck");
    });

    test("the default window is the 30 days ending today in the user's zone", async () => {
        const tz = "Pacific/Auckland";
        db.profile = { ...PROFILE_BASE, timezone: tz };
        db.measurements = [measurementRow()];
        await withTools(null, async (call) => {
            const r = await call("get_body_measurements", {});
            expect(textOf(r)).toContain(`Times are local (${tz})`);
            await call("get_body_measurements", {
                start_date: "2026-01-01",
            });
            await call("get_body_measurements", { end_date: "2026-03-31" });
        });
        const today = todayInTz(tz);
        expect(db.measurementRangeArgs[0]).toEqual({
            s: shiftLocalDate(today, -29),
            e: today,
            tz,
            kind: undefined,
        });
        expect(db.measurementRangeArgs[1]!.s).toBe("2026-01-01");
        expect(db.measurementRangeArgs[1]!.e).toBe(today);
        expect(db.measurementRangeArgs[2]!.s).toBe("2026-03-02");
        expect(db.measurementRangeArgs[2]!.e).toBe("2026-03-31");
        expect(
            rowsFor("get_body_measurements")[0]!.date_range_days,
        ).toBeUndefined();
    });

    test("a saved length unit converts the display; without one each row keeps its own", async () => {
        db.measurements = [measurementRow()];
        const range = { start_date: "2026-08-01", end_date: "2026-08-31" };
        await withTools(null, async (call) => {
            expect(
                textOf(await call("get_body_measurements", range)),
            ).toContain("- Waist 84.5 cm");
            db.profile = { ...PROFILE_BASE, preferred_length_unit: "in" };
            expect(
                textOf(await call("get_body_measurements", range)),
            ).toContain("- Waist 33.3 in");
        });
    });

    test("a new value is read in the entry's own unit, not the preference", async () => {
        db.profile = { ...PROFILE_BASE, preferred_length_unit: "cm" };
        db.measurements = [
            measurementRow({
                value_mm: 813,
                value_entered: 32,
                entered_unit: "in",
            }),
        ];
        await withTools(null, async (call) => {
            const r = await call("update_body_measurement", {
                id: MEASUREMENT_ID,
                value: 33,
            });
            expect(r.isError).toBeFalsy();
            expect(textOf(r)).toContain("Waist 33 in");
        });
        expect(db.measurementUpdates[0]).toMatchObject({
            value_mm: 838,
            value_entered: 33,
            entered_unit: "in",
        });
    });

    test("a unit alone re-reads the stored number in that unit", async () => {
        db.measurements = [
            measurementRow({
                kind: "neck",
                value_mm: 320,
                value_entered: 32,
                entered_unit: "cm",
            }),
        ];
        await withTools(null, async (call) => {
            const r = await call("update_body_measurement", {
                id: MEASUREMENT_ID,
                unit: "in",
            });
            expect(r.isError).toBeFalsy();
            expect(textOf(r)).toContain("Neck 32 in");
        });
        expect(db.measurementUpdates[0]).toMatchObject({
            value_mm: 813,
            value_entered: 32,
            entered_unit: "in",
        });
    });

    test("update_body_measurement takes no kind", async () => {
        const server = new McpServer(
            { name: "nutrition-mcp-test", version: "0.0.0" },
            { capabilities: { tools: {}, resources: {} } },
        );
        registerTools(server, "u1", true, null);
        const [clientTransport, serverTransport] =
            InMemoryTransport.createLinkedPair();
        const client = new Client({ name: "test-client", version: "0.0.0" });
        await Promise.all([
            server.connect(serverTransport),
            client.connect(clientTransport),
        ]);
        try {
            const { tools } = await client.listTools();
            const update = tools.find(
                (t) => t.name === "update_body_measurement",
            )!;
            expect(
                Object.keys(update.inputSchema.properties ?? {}),
            ).not.toContain("kind");
            expect(
                tools.find((t) => t.name === "log_body_measurement")!
                    .inputSchema.properties,
            ).toHaveProperty("kind");
        } finally {
            await client.close();
            await server.close();
        }
    });

    test("an update with nothing to change is refused before any write", async () => {
        db.measurements = [measurementRow()];
        await withTools(null, async (call) => {
            const r = await call("update_body_measurement", {
                id: MEASUREMENT_ID,
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("Nothing to change");
        });
        expect(db.measurementUpdates).toHaveLength(0);
        expect(rowsFor("update_body_measurement")[0]!.error_category).toBe(
            "missing_required_param",
        );
    });

    test("updating the value of a missing row is record_not_found", async () => {
        await withTools(null, async (call) => {
            const r = await call("update_body_measurement", {
                id: MEASUREMENT_ID,
                value: 80,
            });
            expect(r.isError).toBe(true);
            expect(
                textOf(r).startsWith("No body measurement found with id"),
            ).toBe(true);
        });
        expect(db.measurementUpdates).toHaveLength(0);
        expect(rowsFor("update_body_measurement")[0]!.error_category).toBe(
            "record_not_found",
        );
    });

    test("set_length_unit saves, clears and refuses an unknown unit", async () => {
        await withTools(null, async (call) => {
            const set = await call("set_length_unit", { unit: "in" });
            expect(textOf(set)).toContain("set to in");
            expect(db.profilePatches[0]).toEqual({
                preferred_length_unit: "in",
            });

            const cleared = await call("set_length_unit", { unit: null });
            expect(textOf(cleared)).toContain("cleared");
            expect(db.profilePatches[1]).toEqual({
                preferred_length_unit: null,
            });

            const bad = await call("set_length_unit", { unit: "mm" });
            expect(bad.isError).toBe(true);
        });
        expect(db.profilePatches).toHaveLength(2);
    });

    test("a long listing stops on a whole day and names where to continue", async () => {
        const notes = "n".repeat(1000);
        db.measurements = Array.from({ length: 50 }, (_, i) => {
            const date = shiftLocalDate("2026-01-01", i);
            return measurementRow({
                id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
                logged_at: `${date}T08:00:00.000Z`,
                notes,
            });
        });
        await withTools(null, async (call) => {
            const text = textOf(
                await call("get_body_measurements", {
                    start_date: "2026-01-01",
                    end_date: "2026-02-28",
                    kind: "waist",
                }),
            );
            const m = text.match(
                /\(Listing stops after (\d{4}-\d{2}-\d{2}) to keep the response short; get_body_measurements with start_date (\d{4}-\d{2}-\d{2}), end_date 2026-02-28 and kind waist returns the rest\.\)$/,
            );
            expect(m).not.toBeNull();
            expect(m![2]).toBe(shiftLocalDate(m![1]!, 1));
            // The notice is the only thing past the budget, and the last day
            // listed is complete.
            const body = text.slice(0, text.lastIndexOf("\n\n(Listing"));
            expect(body.length).toBeLessThanOrEqual(40_000);
            expect(body).toContain(`## ${m![1]}`);
            expect(body).not.toContain(`## ${m![2]}`);
        });
    });

    test("notes reach the data layer as sent", async () => {
        await withTools(null, async (call) => {
            await call("log_body_measurement", {
                kind: "upper_arm",
                value: 34,
                unit: "cm",
                notes: "left\\nside",
            });
        });
        expect(db.measurementInserted[0]!.notes).toBe("left\\nside");
    });

    test("a deduplicated log is rendered from the stored row", async () => {
        db.dedupe = true;
        await withTools(null, async (call) => {
            const text = textOf(
                await call("log_body_measurement", {
                    kind: "waist",
                    value: 84.5,
                    unit: "cm",
                    logged_at: "2026-08-07T08:00:00Z",
                }),
            );
            expect(text.startsWith("Already logged")).toBe(true);
            expect(text).toContain("Waist 84.5 cm");
            expect(text).toContain(`ID: ${MEASUREMENT_ID}`);
        });
    });
});

// ---------- the server is the clock (issue #102) ----------
//
// Several hosts (Claude Desktop among them) keep the wall clock out of the
// model's context. With no clock the model either interrogated the user ("what
// time is it?") on every single log, or guessed — and a guessed time lands on
// the wrong local day for anyone far from UTC. The server always knows both the
// instant and the user's zone, so it says so.
//
// These read the real clock, so they assert SHAPE and ZONE, never a pinned
// value: the date is compared against dateInTz sampled around the call, which
// is both zone-sensitive and immune to a midnight rollover mid-test.
describe("current-time disclosure", () => {
    /** "Local time now: Sunday 2026-08-09 15:04:22 (Europe/Kyiv)." */
    const clockRe = (tz: string) =>
        new RegExp(
            `Local time now: ([A-Z][a-z]+day) (\\d{4}-\\d{2}-\\d{2}) (\\d{2}:\\d{2}:\\d{2}) \\(${tz}\\)\\.`,
        );
    const UTC_NOW_RE =
        /UTC now: (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\./;

    /** Assert the clock line names `tz`'s local day and weekday right now. */
    function expectClockIn(text: string, tz: string, sampled: string[]): void {
        const m = text.match(clockRe(tz));
        expect(m).not.toBeNull();
        const utc = text.match(UTC_NOW_RE);
        expect(utc).not.toBeNull();
        const instant = utc![1]!;
        // The two halves are one instant rendered twice, so the zone is
        // genuinely applied and not merely printed in the label — this holds at
        // every hour, including the ones where tz and UTC share a date.
        expect(`${m![2]} ${m![3]}`).toBe(formatLocalDateTime(instant, tz));
        expect(m![1]).toBe(weekdayInTz(instant, tz));
        // ...and that instant is now, not a fixture.
        expect(sampled).toContain(dateInTz(instant, tz));
    }

    /** Local dates in `tz` before and after the call, to absorb a rollover. */
    async function around(
        tz: string,
        run: () => Promise<string>,
    ): Promise<{ text: string; sampled: string[] }> {
        const before = dateInTz(new Date(), tz);
        const text = await run();
        const after = dateInTz(new Date(), tz);
        return { text, sampled: [...new Set([before, after])] };
    }

    test("get_profile reports the zone AND the user's current wall clock", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        await withTools(null, async (call) => {
            const { text, sampled } = await around("Europe/Kyiv", async () =>
                textOf(await call("get_profile")),
            );
            expect(text).toContain("Timezone: Europe/Kyiv.");
            expectClockIn(text, "Europe/Kyiv", sampled);
        });
    });

    test("get_profile still gives a clock when no timezone is set", async () => {
        db.profile = null;
        await withTools(null, async (call) => {
            const { text, sampled } = await around("UTC", async () =>
                textOf(await call("get_profile")),
            );
            expect(text).toContain("Timezone: not set (defaulting to UTC).");
            expectClockIn(text, "UTC", sampled);
            // Knowing the time must not cost the caller the nudge to configure
            // a zone — UTC is a fallback, not the user's clock.
            expect(text).toContain("set_timezone");
            // …but it is the user's setting to choose, not a call to make.
            expect(text).not.toContain("Call set_");
            expect(text).toContain("The user can");
        });
    });

    // #99: a profile row created by some other set_* tool, with timezone still
    // null, must read the same as no profile at all.
    test("get_profile treats a profile with no timezone as unset", async () => {
        db.profile = { ...PROFILE_BASE, timezone: null };
        await withTools(null, async (call) => {
            const { text, sampled } = await around("UTC", async () =>
                textOf(await call("get_profile")),
            );
            expect(text).toContain("Timezone: not set (defaulting to UTC).");
            expectClockIn(text, "UTC", sampled);
            expect(text).toContain("set_timezone");
            expect(text).not.toContain("Call set_");
            expect(text).toContain("The user can");
        });
    });

    test("set_language rejects a code outside the supported set", async () => {
        await withTools(null, async (call) => {
            const r = await call("set_language", { locale: "xx" });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("Unsupported language");
            expect(db.profilePatches).toHaveLength(0);
        });
    });

    test("set_language persists a supported locale", async () => {
        await withTools(null, async (call) => {
            const r = await call("set_language", { locale: "de" });
            expect(textOf(r)).toContain("Deutsch");
            expect(textOf(r)).toContain("de");
            expect(db.profilePatches).toContainEqual({ locale: "de" });
            expect(db.profile?.locale).toBe("de");
        });
    });

    test("get_profile defaults language to English when never set", async () => {
        db.profile = { ...PROFILE_BASE, locale: null };
        await withTools(null, async (call) => {
            const text = textOf(await call("get_profile"));
            expect(text).toContain(
                "Language: not set (defaulting to English).",
            );
            expect(text).toContain("set_language");
            expect(text).not.toContain("Call set_");
            expect(text).toContain("The user can");
        });
    });

    // #99-shaped case, same as timezone: a profile row created by some other
    // set_* tool with locale still null must read the same as no profile at all.
    test("get_profile treats a profile with no locale as unset", async () => {
        db.profile = { ...PROFILE_BASE, locale: null, timezone: "UTC" };
        await withTools(null, async (call) => {
            const text = textOf(await call("get_profile"));
            expect(text).toContain(
                "Language: not set (defaulting to English).",
            );
        });
    });

    test("get_profile reports a saved locale", async () => {
        db.profile = { ...PROFILE_BASE, locale: "fr" };
        await withTools(null, async (call) => {
            const text = textOf(await call("get_profile"));
            expect(text).toContain("Français");
            expect(text).toContain("fr");
        });
    });

    test("get_profile reports weight unit and widget display together", async () => {
        db.profile = {
            ...PROFILE_BASE,
            preferred_weight_unit: "lb",
            widgets_enabled: false,
        };
        await withTools(null, async (call) => {
            const text = textOf(await call("get_profile"));
            expect(text).toContain("Weight unit: lb.");
            expect(text).toContain("Widgets: disabled.");
        });
    });

    test("get_profile flags weight unit as unset and widgets as enabled by default", async () => {
        db.profile = null;
        await withTools(null, async (call) => {
            const text = textOf(await call("get_profile"));
            expect(text).toContain("Weight unit: not set.");
            expect(text).toContain("Widgets: enabled.");
        });
    });

    test("get_profile reports a saved length unit", async () => {
        db.profile = { ...PROFILE_BASE, preferred_length_unit: "in" };
        await withTools(null, async (call) => {
            expect(textOf(await call("get_profile"))).toContain(
                "Length unit: in.",
            );
        });
    });

    test("get_profile flags the length unit as unset without directing a call", async () => {
        db.profile = null;
        await withTools(null, async (call) => {
            const text = textOf(await call("get_profile"));
            expect(text).toContain("Length unit: not set.");
            expect(text).not.toContain("Call set_");
        });
    });

    test("get_profile reports Apple Health sync as not connected", async () => {
        await withTools(null, async (call) => {
            expect(textOf(await call("get_profile"))).toContain(
                "Apple Health sync: not connected.",
            );
        });
    });

    test("get_profile reports a connected Apple Health sync in local time", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        db.healthSyncLink = {
            kind: "shortcut",
            fields: ["energy_kcal"],
            fallback_tz: "Europe/Kyiv",
            sync_start_date: "2026-09-26",
            created_at: "2026-09-26T22:30:00.000Z",
            last_used_at: "2026-10-02T05:10:00.000Z",
            last_sync_at: "2026-10-02T05:10:30.000Z",
            expires_at: "2026-12-31T05:10:00.000Z",
        };
        db.healthSyncSentThrough = "2026-10-01";
        await withTools(null, async (call) => {
            const text = textOf(await call("get_profile"));
            // 22:30Z on the 26th is already the 27th in Kyiv.
            expect(text).toContain(
                "Apple Health sync: connected 2026-09-27, sent through 2026-10-01, last sync 2026-10-02 08:10.",
            );
        });
    });

    test("get_current_time answers in the profile's zone, and is measured", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Asia/Tokyo" };
        await withTools(null, async (call) => {
            const { text, sampled } = await around("Asia/Tokyo", async () =>
                textOf(await call("get_current_time")),
            );
            expectClockIn(text, "Asia/Tokyo", sampled);
            expect(text).not.toContain("No timezone is set");
        });

        const rows = db.analyticsRows.filter(
            (r) => r.tool_name === "get_current_time",
        );
        expect(rows).toHaveLength(1);
        expect(rows[0]!.user_id).toBe("u1");
        expect(rows[0]!.success).toBe(true);
    });

    // Without this the UTC fallback reads as the user's real local time, and a
    // model would resolve "this morning" against a clock up to 14 hours off.
    test("get_current_time flags that an unset zone means UTC, not local", async () => {
        db.profile = null;
        await withTools(null, async (call) => {
            const { text, sampled } = await around("UTC", async () =>
                textOf(await call("get_current_time")),
            );
            expectClockIn(text, "UTC", sampled);
            expect(text).toContain("No timezone is set for this account");
            expect(text).toContain("set_timezone");
        });
    });

    // #99: same as above, but via a profile row an unrelated set_* tool
    // created — this is the case that used to go quiet forever.
    test("get_current_time flags an unset zone even when the profile row exists", async () => {
        db.profile = { ...PROFILE_BASE, timezone: null };
        await withTools(null, async (call) => {
            const { text, sampled } = await around("UTC", async () =>
                textOf(await call("get_current_time")),
            );
            expectClockIn(text, "UTC", sampled);
            expect(text).toContain("No timezone is set for this account");
            expect(text).toContain("set_timezone");
        });
    });

    // The shipped guidance is the actual fix: the three "log it now" tools used
    // to tell the model to ask the user for the time before calling them. Now
    // they tell it to omit the field and let the server stamp now.
    test("log_meal, log_water, log_weight and log_body_measurement tell the model to omit logged_at, not to ask", async () => {
        const server = new McpServer(
            { name: "t", version: "0.0.0" },
            { capabilities: { tools: {}, resources: {} } },
        );
        registerTools(server, "u1", true, null);
        const [ct, st] = InMemoryTransport.createLinkedPair();
        const client = new Client({ name: "c", version: "0.0.0" });
        await Promise.all([server.connect(st), client.connect(ct)]);
        try {
            const { tools } = await client.listTools();
            const propsOf = (name: string) =>
                (
                    tools.find((t) => t.name === name)?.inputSchema as {
                        properties?: Record<string, { description?: string }>;
                    }
                )?.properties;
            for (const name of [
                "log_meal",
                "log_water",
                "log_weight",
                "log_body_measurement",
            ]) {
                const desc = propsOf(name)?.logged_at?.description ?? "";
                expect(desc).not.toBe("");
                expect(desc).not.toContain(
                    "ask the user before calling this tool",
                );
                expect(desc).not.toMatch(/\b(?:do not|don't) ask the user\b/i);
                expect(desc).toContain("get_current_time");
            }
            // The three older tools still carry the inherited wording: the
            // server knows the time, so there is no need to ask (#102). They
            // move to the descriptive form under #198.
            for (const name of ["log_meal", "log_water", "log_weight"]) {
                const desc = propsOf(name)?.logged_at?.description ?? "";
                expect(desc).toContain("The server knows the current time");
                expect(desc).toContain("no need to ask the user");
                expect(desc).toContain("omit this field entirely");
            }
            // log_body_measurement, added after the directory review, only
            // describes what an omitted value means and what the key does.
            const body = propsOf("log_body_measurement");
            const bodyLoggedAt = body?.logged_at?.description ?? "";
            expect(bodyLoggedAt).toContain(
                "Omitted, the server stamps the entry with the current time",
            );
            for (const text of [
                bodyLoggedAt,
                body?.idempotency_key?.description ?? "",
            ]) {
                expect(text).not.toBe("");
                expect(text).not.toMatch(
                    /\b(?:never|do not|don't|no need to|omit this|only supply|pass any|send the same)\b/i,
                );
            }
            // ...and the tool that replaces the question is actually reachable.
            expect(tools.map((t) => t.name)).toContain("get_current_time");
        } finally {
            await client.close();
            await server.close();
        }
    });
});

// The whole-account archive is the server's ONLY export path — the meals-only
// export_meals tool it replaced is gone, and its meals.csv now lives inside the
// ZIP. So the description has to carry two things a user would otherwise be
// stranded by: where the meal history went, and the asymmetry that five of the
// six files have no way back in.
describe("export_all_data is on the tool surface", () => {
    async function toolsOf() {
        const server = new McpServer(
            { name: "t", version: "0.0.0" },
            { capabilities: { tools: {}, resources: {} } },
        );
        registerTools(server, "u1", true, null);
        const [ct, st] = InMemoryTransport.createLinkedPair();
        const client = new Client({ name: "c", version: "0.0.0" });
        await Promise.all([server.connect(st), client.connect(ct)]);
        const { tools } = await client.listTools();
        await client.close();
        await server.close();
        return tools;
    }

    test("it is the only export tool — export_meals is gone", async () => {
        const names = (await toolsOf()).map((t) => t.name);
        expect(names).toContain("export_all_data");
        // Not merely renamed away: leaving the old tool registered beside this
        // one is the thing this decision rejected, so a re-added meals-only
        // export should fail here rather than quietly double the surface.
        expect(names).not.toContain("export_meals");
    });

    test("its description names every file and the import asymmetry", async () => {
        const desc =
            (await toolsOf()).find((t) => t.name === "export_all_data")
                ?.description ?? "";
        for (const file of [
            "meals.csv",
            "water.csv",
            "weight.csv",
            "body_measurements.csv",
            "goals.csv",
            "goals_history.csv",
            "profile.csv",
            "account.csv",
            "telemetry.csv",
            "connections.csv",
            "README.txt",
        ]) {
            expect(desc, file).toContain(file);
        }
        expect(desc).toContain("60 minutes");
        expect(desc).toContain("export-only");
        // With no meals-only tool left, "export my meals" lands here. The
        // description has to say so, or the model reads a tool named
        // export_all_data and decides it is the wrong one.
        expect(desc).toContain("meals.csv inside the archive");
    });

    // The archive is a write — it uploads to the exports bucket — and the
    // signed link differs on every call, so despite reading like a query none
    // of this is read-only or idempotent.
    test("it is annotated as the write it is", async () => {
        const all = (await toolsOf()).find((t) => t.name === "export_all_data");
        expect(all?.annotations).toEqual({
            title: "Export All Data",
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
        });
    });
});

// The connector directory's review criteria require a `title` and the
// applicable hints in every tool's annotations — Claude derives auto-permissions
// from them (read-only tools run unprompted, destructive ones always prompt).
// The top-level `title` alone does not satisfy it, which is how 34 of 36 tools
// shipped without one.
describe("every tool carries directory-ready annotations", () => {
    test("title and hints are present and consistent", async () => {
        const server = new McpServer(
            { name: "t", version: "0.0.0" },
            { capabilities: { tools: {}, resources: {} } },
        );
        registerTools(server, "u1", true, null);
        const [ct, st] = InMemoryTransport.createLinkedPair();
        const client = new Client({ name: "c", version: "0.0.0" });
        await Promise.all([server.connect(st), client.connect(ct)]);
        const { tools } = await client.listTools();
        await client.close();
        await server.close();

        // destructiveHint is true exactly for tools that overwrite or remove a
        // user record — "false" means "only additive updates" in the spec, so
        // the update_* tools and set_nutrition_goals belong here. The six
        // preference setters stay out on purpose: each replaces one visible
        // preference that get_profile shows and the user can set back.
        const DESTRUCTIVE = new Set([
            "delete_meal",
            "delete_water",
            "delete_weight",
            "delete_body_measurement",
            "delete_account",
            "update_meal",
            "update_weight",
            "update_body_measurement",
            "set_nutrition_goals",
            "update_saved_meal",
            "delete_saved_meal",
        ]);
        const OPEN_WORLD = new Set(["lookup_barcode"]);
        expect(tools.length).toBe(46);
        for (const t of tools) {
            const a = t.annotations;
            expect(a?.title, t.name).toBeTruthy();
            expect(a?.title, t.name).toBe(t.title);
            // An omitted hint is absent in v2, not false, and clients then
            // apply the spec default (openWorldHint defaults to true) — so
            // presence is checked, not just the value.
            for (const hint of [
                "readOnlyHint",
                "destructiveHint",
                "idempotentHint",
                "openWorldHint",
            ] as const)
                expect(typeof a?.[hint], `${t.name}.${hint}`).toBe("boolean");
            if (a?.readOnlyHint) expect(a.destructiveHint, t.name).toBe(false);
            expect(a?.destructiveHint, t.name).toBe(DESTRUCTIVE.has(t.name));
            expect(a?.openWorldHint, t.name).toBe(OPEN_WORLD.has(t.name));
        }
    });

    // The two import tools once omitted openWorldHint, which a client reads
    // as the spec default `true` — wrong for both: neither reaches outside
    // this server.
    test("the import tools pin their full annotation objects", async () => {
        const server = new McpServer(
            { name: "t", version: "0.0.0" },
            { capabilities: { tools: {}, resources: {} } },
        );
        registerTools(server, "u1", true, null);
        const [ct, st] = InMemoryTransport.createLinkedPair();
        const client = new Client({ name: "c", version: "0.0.0" });
        await Promise.all([server.connect(st), client.connect(ct)]);
        const { tools } = await client.listTools();
        await client.close();
        await server.close();

        const byName = new Map(tools.map((t) => [t.name, t.annotations]));
        expect(byName.get("start_meal_import")).toEqual({
            title: "Import Meals from a File",
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        });
        expect(byName.get("bulk_import_meals")).toEqual({
            title: "Bulk Import Meals",
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        });
    });
});

// ---------- /mcp over HTTP: both protocol eras ----------
//
// Kept in this file rather than its own: mock.module is process-wide, and a
// separate file with its own mock/restore of ./supabase.js broke
// middleware.test.ts's mock on Linux CI even with a snapshot-based restore.
// Sharing this file's single mock window is what proved green; see the
// restore note on the afterAll above for the mechanism.

// The production route minus auth: authenticateBearer's only output is the
// userId variable, which is what handleMcp hands to the server factory.
function appFor(userId: string) {
    const app = new Hono();
    app.all("/mcp", (c) => {
        c.set("userId", userId);
        return handleMcp(c);
    });
    return app;
}

// The SDK's mode is wider ({ pin: string }); this endpoint only ever serves the
// one modern revision, so narrow the pin rather than hand-writing a twin of the
// exported union.
type EraMode = Extract<VersionNegotiationMode, string> | { pin: "2026-07-28" };

// One factory backs both legs, so everything a tool call touches — the tool
// surface, the ui:// resources, the structuredContent, the authInfo the factory
// reads the user out of — must answer identically whichever era asked. The
// legacy leg is the one every production client (the Claude connector included)
// is on today, so a test that only ever pins the modern revision leaves the
// deployed path uncovered.
const ERAS: EraMode[] = ["legacy", { pin: "2026-07-28" }];

// Drive the real handler in-process: the URL is never dialled. Extra headers
// stand in for what a proxy in front of us would add.
async function withHttpClient<T>(
    userId: string,
    mode: EraMode,
    run: (client: Client) => Promise<T>,
    headers: Record<string, string> = {},
): Promise<T> {
    const app = appFor(userId);
    const transport = new StreamableHTTPClientTransport(
        new URL("http://test.local/mcp"),
        {
            fetch: async (url, init) => {
                const req = new Request(String(url), init);
                for (const [k, v] of Object.entries(headers))
                    req.headers.set(k, v);
                return app.request(req);
            },
        },
    );
    const client = new Client(
        { name: "t", version: "0" },
        { versionNegotiation: { mode } },
    );
    await client.connect(transport);
    try {
        // Same reason as withTools: arm the client's advertised-schema check
        // before the first callTool. Lazily, so a test that counts requests
        // or profile reads without calling a tool sees no extra tools/list.
        const callTool = client.callTool.bind(client);
        let armed = false;
        client.callTool = (async (...args: Parameters<typeof callTool>) => {
            if (!armed) {
                armed = true;
                await client.listTools();
            }
            return callTool(...args);
        }) as typeof client.callTool;
        return await run(client);
    } finally {
        await client.close();
    }
}

// A raw JSON-RPC POST with the headers the v2 entry is strict about.
function rpc(
    app: Hono,
    body: Record<string, unknown>,
    headers: Record<string, string> = {},
) {
    return app.request("http://x/mcp", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            accept: "application/json, text/event-stream",
            ...headers,
        },
        body: JSON.stringify({ jsonrpc: "2.0", ...body }),
    });
}

// The legacy leg answers over SSE; pull the single JSON-RPC frame out.
async function sseFrame(r: Response): Promise<Record<string, unknown>> {
    const line = (await r.text())
        .split("\n")
        .find((l) => l.startsWith("data:"));
    return JSON.parse(line?.slice(5) ?? "{}") as Record<string, unknown>;
}

describe("/mcp serves the 2026-07-28 revision", () => {
    test("a negotiating client lands on the modern era", async () => {
        await withHttpClient("u1", "auto", async (client) => {
            expect(client.getProtocolEra()).toBe("modern");
            expect(client.getServerVersion()?.name).toBe("nutrition-mcp");
        });
    });

    test("a pinned 2026-07-28 client connects without fallback", async () => {
        await withHttpClient("u1", { pin: "2026-07-28" }, async (client) => {
            expect(client.getProtocolEra()).toBe("modern");
        });
    });

    test("the server is built per request for the authenticated user", async () => {
        // Two users, then the first again: a per-user cache would read each
        // profile once, so the third read is what proves per-request.
        for (const user of ["user-a", "user-b", "user-a"]) {
            await withHttpClient(user, { pin: "2026-07-28" }, (client) =>
                client.listTools(),
            );
        }
        // One read per user per connection, from the tools/list alone:
        // connect()'s server/discover probe is answered from the bare server,
        // which never touches the profile.
        expect(db.profileReads).toEqual(["user-a", "user-b", "user-a"]);
    });

    // server/discover is the first request every negotiating client sends and
    // its response — supportedVersions, capabilities, instructions — contains
    // nothing a tool registration produces. Paying a Supabase round-trip for it
    // made the probe the request that failed first under rate pressure.
    test("server/discover costs no profile read and still answers in full", async () => {
        const r = await rpc(
            appFor("u1"),
            {
                id: 3,
                method: "server/discover",
                params: {
                    _meta: {
                        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
                        "io.modelcontextprotocol/clientCapabilities": {},
                    },
                },
            },
            {
                "mcp-protocol-version": "2026-07-28",
                "mcp-method": "server/discover",
            },
        );
        expect(r.status).toBe(200);
        expect(db.profileReads).toEqual([]);
        const body = (await r.json()) as {
            result?: {
                supportedVersions?: string[];
                capabilities?: Record<string, unknown>;
                instructions?: string;
            };
        };
        expect(body.result?.supportedVersions).toContain("2026-07-28");

        // ...and advertises exactly what the fully-registered server does. Both
        // paths build from one literal; this is the assertion that would catch
        // them drifting apart.
        const init = await sseFrame(
            await rpc(appFor("u1"), {
                id: 4,
                method: "initialize",
                params: {
                    protocolVersion: "2025-11-25",
                    capabilities: {},
                    clientInfo: { name: "c", version: "0" },
                },
            }),
        );
        const full = init.result as {
            capabilities: Record<string, unknown>;
            instructions: string;
        };
        expect(body.result?.capabilities).toEqual(full.capabilities);
        expect(body.result?.instructions).toBe(full.instructions);
        expect(full.instructions.length).toBeGreaterThan(0);
    });
});

// Directory policy: tool text must not direct Claude to external software the
// user did not ask for. "search the web" used to appear in the nutrient rule,
// the photo-logging steps, lookup_barcode and several field descriptions, so
// this sweeps every surface the model reads — the server instructions, every
// tool description and every input-field description — rather than pinning
// the sites that happened to carry it.
describe("tool text names no external tool", () => {
    const WEB = /web search|search the web|searching the web/i;

    test.each(ERAS)(
        "no instructions, tool or field description mentions web search (%p)",
        async (mode) => {
            await withHttpClient("u1", mode, async (client) => {
                const instructions = client.getInstructions() ?? "";
                expect(instructions.length).toBeGreaterThan(0);
                expect(instructions).not.toMatch(WEB);
                // Rewording for the policy kept the issue #102 default: the
                // instructions still say to omit logged_at for "just now".
                expect(instructions).toContain("omit logged_at");
                expect(instructions).toContain("get_current_time");
                const { tools } = await client.listTools();
                expect(tools.length).toBeGreaterThan(30);
                for (const tool of tools) {
                    expect(tool.description ?? "", tool.name).not.toMatch(WEB);
                    const props = (tool.inputSchema.properties ?? {}) as Record<
                        string,
                        { description?: string }
                    >;
                    for (const [key, prop] of Object.entries(props)) {
                        expect(
                            prop.description ?? "",
                            `${tool.name}.${key}`,
                        ).not.toMatch(WEB);
                    }
                }
            });
        },
    );
});

// Policy 1.D and 2.D: tool text must not push the model to collect a location
// the user never gave, nor to write something the user did not ask for. The
// instructions and log_meal once asked for "the venue and city" of every
// restaurant meal, and several strings told the model to backfill or log on
// its own; each assertion pins one of those sites.
describe("tool text leaves writes and location to the user", () => {
    const LOCATION = "do not infer a location the user did not state";

    test.each(ERAS)(
        "instructions and descriptions offer rather than direct (%p)",
        async (mode) => {
            await withHttpClient("u1", mode, async (client) => {
                const instructions = client.getInstructions() ?? "";
                expect(instructions.length).toBeGreaterThan(0);
                expect(instructions).not.toContain(
                    "rather than mentioning it in prose",
                );
                expect(instructions).not.toContain("Podil");
                expect(instructions).not.toMatch(/venue and city/);
                expect(instructions).toContain(LOCATION);
                expect(instructions).toContain(
                    "once the user wants it filled in",
                );

                const { tools } = await client.listTools();
                const desc = (name: string) =>
                    tools.find((t) => t.name === name)?.description ?? "";

                const logMeal = desc("log_meal");
                expect(logMeal).not.toMatch(/Podil|Kyiv/);
                expect(logMeal).not.toContain("venue and city");
                expect(logMeal).toContain(LOCATION);

                expect(desc("search_meals")).toContain(
                    "When the user has named the restaurant",
                );

                // Directory review, 2026-10-01: these described when to offer a
                // setting or how to phrase a reply, not what the tool does.
                expect(instructions).not.toMatch(/\boffer\b/i);
                for (const name of [
                    "set_language",
                    "set_timezone",
                    "get_meal_patterns",
                    "get_trends",
                ]) {
                    expect(desc(name), name).not.toMatch(/\boffer\b/i);
                    expect(desc(name), name).not.toMatch(/narrate/i);
                }

                const updateMeal = desc("update_meal");
                expect(updateMeal).not.toContain(
                    "rather than telling the user",
                );
                expect(updateMeal).toContain("the user asks or agrees");

                for (const tool of tools) {
                    expect(tool.description ?? "", tool.name).not.toMatch(
                        /\bCall set_/,
                    );
                    const props = (tool.inputSchema.properties ?? {}) as Record<
                        string,
                        { description?: string }
                    >;
                    for (const [key, prop] of Object.entries(props)) {
                        expect(
                            prop.description ?? "",
                            `${tool.name}.${key}`,
                        ).not.toMatch(/\bCall set_/);
                    }
                }
            });
        },
    );

    // A target weight with nothing logged is a fact to report, not a prompt
    // to go log a weight the user never mentioned (policy 2.D).
    test("get_goal_progress leaves logging a weight to the user", async () => {
        db.goals = goals({ target_weight_g: 70000 });
        await withTools(null, async (call) => {
            const text = textOf(
                await call("get_goal_progress", { date: "2026-07-20" }),
            );
            expect(text).toContain("Weight: no entries yet (target");
            expect(text).not.toContain("Log one with");
            expect(text).toContain("The user can log one with log_weight.");
        });
    });

    // An offset-less time on an account with no timezone: the note says what
    // happened and what the user could do, not what the model should do next.
    test("the unset-timezone note does not direct a follow-up write", async () => {
        db.profile = null;
        await withTools(null, async (call) => {
            const text = textOf(
                await call("log_meal", {
                    description: "Oatmeal",
                    meal_type: "breakfast",
                    calories: 300,
                    logged_at: "2026-07-20T08:30:00",
                }),
            );
            expect(text).toContain("no timezone set");
            expect(text).toContain("set_timezone");
            expect(text).not.toContain("Then re-check this entry");
        });
    });
});

// A barcode lookup is often only a question about the product, so neither
// fallback may presume the meal gets logged.
describe("lookup_barcode fallbacks do not presume a log", () => {
    test("unreachable and not-found texts stop short of a write", () => {
        for (const text of [
            offUnreachableText(),
            offNotFoundText("5449000000996"),
        ]) {
            expect(text).not.toContain("log the meal");
            expect(text).not.toMatch(/then log/);
        }
        expect(offNotFoundText("5449000000996")).toContain("5449000000996");
    });
});

// Policy 2.B: descriptions must describe behaviour, not over-claim it. Each
// assertion pins one claim that was once false: the derived idempotency key
// only survives a replay that carries logged_at, the rate limit is per HTTP
// request (not a "budget" a week of meals exhausts), get_trends ranks days by
// calories only, and a timezone change regroups reads.
describe("tool text makes only claims the code keeps", () => {
    test.each(ERAS)(
        "idempotency, rate-limit, trends and timezone text (%p)",
        async (mode) => {
            await withHttpClient("u1", mode, async (client) => {
                const instructions = client.getInstructions() ?? "";
                expect(instructions).not.toMatch(/exhaust/i);
                expect(instructions).toContain("omit logged_at");
                expect(instructions).toContain("get_current_time");
                const { tools } = await client.listTools();
                const byName = new Map(tools.map((t) => [t.name, t]));
                const keyDescription = (name: string) =>
                    (
                        (byName.get(name)!.inputSchema.properties ??
                            {}) as Record<string, { description?: string }>
                    ).idempotency_key?.description ?? "";
                for (const name of [
                    "log_meal",
                    "log_water",
                    "log_weight",
                    "log_body_measurement",
                ]) {
                    const d = keyDescription(name);
                    expect(d, name).toContain("omits logged_at");
                    expect(d, name).toContain("adds a new");
                    expect(d, name).not.toContain(
                        "You normally don't need to set this",
                    );
                }
                expect(keyDescription("log_water")).toContain("500 ml");
                expect(
                    byName.get("bulk_import_meals")!.description ?? "",
                ).not.toMatch(/exhaust/i);
                const trends = byName.get("get_trends")!.description ?? "";
                expect(trends).not.toMatch(/each macro/);
                expect(trends).toContain("best and worst day by calories");
                const tz = byName.get("set_timezone")!.description ?? "";
                expect(tz).not.toContain("re-buckets nothing");
                expect(tz).toContain("regroups existing entries");
                // An import retry dedupes only while the timezone is
                // unchanged: the key hashes the instant the row resolves to.
                expect(instructions).toContain(
                    "as long as the timezone hasn't changed",
                );
                expect(instructions).not.toContain("never duplicates");
                // Scoped to this service, so they don't attract calls meant
                // for another connector (policy 2.C).
                expect(
                    byName.get("get_current_time")!.description ?? "",
                ).toContain("nutrition tracker");
                const del = byName.get("delete_account")!;
                expect(del.title).toBe("Delete Nutrition Account");
                expect(del.annotations?.title).toBe("Delete Nutrition Account");
                expect(del.description ?? "").toContain(
                    "Nutrition MCP account",
                );
                for (const tool of tools) {
                    expect(JSON.stringify(tool), tool.name).not.toContain(
                        "idempotent retry",
                    );
                }
            });
        },
    );
});

describe("dedupe headers do not claim a retry", () => {
    const WRITES: [string, Record<string, unknown>, string][] = [
        [
            "log_meal",
            { description: "Oatmeal", meal_type: "breakfast", calories: 300 },
            "Meal logged",
        ],
        ["log_water", { amount_ml: 250 }, "Water logged"],
        ["log_weight", { weight: 70, unit: "kg" }, "Weight logged"],
        [
            "log_body_measurement",
            { kind: "waist", value: 84.5, unit: "cm" },
            "Body measurement logged",
        ],
    ];

    test.each(WRITES)(
        "%s says nothing new was added when the key matched",
        async (name, args) => {
            db.dedupe = true;
            await withTools(null, async (call) => {
                const text = textOf(await call(name, args));
                expect(text).not.toContain("idempotent retry");
                expect(text).toContain("nothing new was added");
            });
        },
    );

    test.each(WRITES)(
        "%s keeps its plain header for a new entry",
        async (name, args, header) => {
            await withTools(null, async (call) => {
                const text = textOf(await call(name, args));
                expect(text).toContain(header);
                expect(text).not.toContain("nothing new was added");
            });
        },
    );
});

// The product surface, driven end to end over BOTH legs. Everything in here is
// era-agnostic by construction (one server factory), so a difference between
// the two columns is a bug in the handler, not in the tools.
describe("/mcp serves one tool surface on both protocol eras", () => {
    test.each(ERAS)(
        "list_changed is not advertised (%p) — nothing could deliver it",
        async (mode) => {
            await withHttpClient("u1", mode, async (client) => {
                const caps = client.getServerCapabilities();
                expect(caps?.tools).toEqual({ listChanged: false });
                expect(caps?.resources).toEqual({ listChanged: false });
            });
        },
    );

    test.each(ERAS)(
        "tools/list carries the MCP Apps links and output schemas (%p)",
        async (mode) => {
            await withHttpClient("u1", mode, async (client) => {
                const { tools } = await client.listTools();
                expect(tools.length).toBeGreaterThan(30);
                const logMeal = tools.find((t) => t.name === "log_meal");
                expect(logMeal?._meta?.ui).toEqual({
                    resourceUri: "ui://widget/meal-logged.html",
                });
                expect(logMeal?.outputSchema?.type).toBe("object");
            });
        },
    );

    test.each(ERAS)("tools/call returns text content (%p)", async (mode) => {
        await withHttpClient("u1", mode, async (client) => {
            const r = await client.callTool({
                name: "get_profile",
                arguments: {},
            });
            expect(r.isError).toBeFalsy();
            expect((r.content as { type: string }[])[0]?.type).toBe("text");
        });
    });

    // structuredContent is what every widget paints from, and start_meal_import
    // is the tool where an empty one leaves the iframe stuck on its loading
    // state. Parsing the exported schema (rather than eyeballing a field) is
    // what proves the payload the wire carried still satisfies what the tool
    // declares — including the nullable fields that must be present-and-null.
    test.each(ERAS)(
        "structuredContent satisfies the declared outputSchema (%p)",
        async (mode) => {
            // Not UTC: that is both PROFILE_BASE's zone and the null-profile
            // fallback, so only a distinct zone proves the profile was read
            // for THIS user on this leg.
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            await withHttpClient("u1", mode, async (client) => {
                const r = await client.callTool({
                    name: "start_meal_import",
                    arguments: {},
                });
                expect(r.isError).toBeFalsy();
                const sc = START_IMPORT_OUTPUT_SCHEMA.parse(
                    r.structuredContent,
                );
                expect(sc.tz).toBe("Europe/Kyiv");
                expect(sc.tz_configured).toBe(true);
                expect(sc.import_tool_name).toBe("bulk_import_meals");
            });
        },
    );

    // The summary widget's "N more meals" counts ride in the result's _meta
    // (the frozen outputSchema has no room for them), so _meta has to survive
    // the wire on both legs — and the call has to pass the client's own
    // outputSchema check, which listTools arms.
    test.each(ERAS)(
        "get_nutrition_summary's contributor counts survive in _meta (%p)",
        async (mode) => {
            db.meals = [meal()];
            await withHttpClient("u1", mode, async (client) => {
                await client.listTools();
                const r = await client.callTool({
                    name: "get_nutrition_summary",
                    arguments: {
                        start_date: "2026-01-01",
                        end_date: "2026-01-31",
                    },
                });
                expect(r.isError).toBeFalsy();
                expect(r.structuredContent).not.toHaveProperty(
                    "meal_contributors",
                );
                expect(
                    MEAL_CONTRIBUTORS.parse(
                        r._meta?.[MEAL_CONTRIBUTORS_META_KEY],
                    ).calories,
                ).toBe(1);
            });
        },
    );

    // `extra` rides in _meta beside the frozen structuredContent: the client's
    // outputSchema check (armed by listTools) must still pass on both legs.
    test.each(ERAS)(
        "get_nutrition_summary's added-sugar extra rows survive in _meta (%p)",
        async (mode) => {
            db.meals = addedSugarGapMeals();
            await withHttpClient("u1", mode, async (client) => {
                await client.listTools();
                const r = await client.callTool({
                    name: "get_nutrition_summary",
                    arguments: {
                        start_date: "2026-01-01",
                        end_date: "2026-01-31",
                    },
                });
                expect(r.isError).toBeFalsy();
                const meta = r._meta?.[ADDED_SUGAR_META_KEY] as AddedSugarMeta;
                expect(meta.extra?.map((e) => e.description)).toEqual([
                    "sweetened iced tea",
                ]);
                expect(
                    (
                        r.structuredContent as {
                            meals: { description: string }[];
                        }
                    ).meals.map((m) => m.description),
                ).not.toContain("sweetened iced tea");
            });
        },
    );

    // A widget is only usable if the resource read hands back the assembled,
    // fully-inlined document under the mcp-app mime type: the iframe CSP is
    // deny-all, so anything left un-inlined simply never loads.
    test.each(ERAS)(
        "ui:// widgets read as the assembled mcp-app document (%p)",
        async (mode) => {
            const assembled = await getWidgetHtml("meal-logged");
            await withHttpClient("u1", mode, async (client) => {
                const res = await client.readResource({
                    uri: "ui://widget/meal-logged.html",
                });
                const c = res.contents[0] as {
                    mimeType?: string;
                    text?: string;
                };
                expect(c.mimeType).toBe("text/html;profile=mcp-app");
                expect(c.text).toBe(assembled);
                // Spot-check the served bytes directly too, so a resource that
                // starts serving a template instead of the assembly fails here
                // and not only in widgets.test.ts.
                expect(c.text?.trimStart().startsWith("<!doctype html>")).toBe(
                    true,
                );
                expect(c.text).toContain("function initWidget(config)");
                expect(c.text).not.toMatch(/\/\*@include/);
                expect(c.text).not.toMatch(/<script[^>]+src=/);
            });
        },
    );

    test.each(ERAS)(
        "input validation errors are in-band, not transport failures (%p)",
        async (mode) => {
            await withHttpClient("u1", mode, async (client) => {
                const r = await client.callTool({
                    name: "log_meal",
                    arguments: { description: "x", meal_type: "brunch" },
                });
                expect(r.isError).toBe(true);
            });
        },
    );

    // The tool that writes: a legacy tools/call has to reach insertMeal with
    // the user the bearer middleware authenticated, not with whoever the
    // previous request was for.
    test.each(ERAS)(
        "a write reaches the DB for the authenticated user (%p)",
        async (mode) => {
            await withHttpClient("mode-user", mode, async (client) => {
                const r = await client.callTool({
                    name: "log_meal",
                    arguments: {
                        description: "eggs",
                        meal_type: "breakfast",
                        calories: 200,
                    },
                });
                expect(r.isError).toBeFalsy();
            });
            expect(db.inserted).toHaveLength(1);
            expect(db.inserted[0]?.description).toBe("eggs");
            // authInfo.extra.userId is the single identity carrier on both
            // legs; every profile read of this exchange must name that user.
            expect(new Set(db.profileReads)).toEqual(new Set(["mode-user"]));
        },
    );
});

// The added-sugar refusal reaches both eras as an isError result carrying the
// text, and a gated-on success still validates against the frozen schema
// (withHttpClient arms the client's advertised-schema check).
describe("/mcp: the added-sugar refusal on both eras", () => {
    test.each(ERAS)("refused and saved (%p)", async (mode) => {
        const before = process.env.ADDED_SUGAR_REQUIRED_FROM;
        process.env.ADDED_SUGAR_REQUIRED_FROM = "2000-01-01";
        try {
            await withHttpClient("u1", mode, async (client) => {
                const refused = (await client.callTool({
                    name: "log_meal",
                    arguments: {
                        description: "Cola",
                        meal_type: "snack",
                        sugar_g: 35,
                    },
                })) as ToolResult;
                expect(refused.isError).toBe(true);
                expect(textOf(refused)).toBe(addedSugarMissingText());
                expect(db.inserted).toHaveLength(0);
                const saved = (await client.callTool({
                    name: "log_meal",
                    arguments: {
                        description: "Cola",
                        meal_type: "snack",
                        sugar_g: 35,
                        added_sugar_g: 35,
                    },
                })) as ToolResult;
                expect(saved.isError).toBeFalsy();
                expect(saved.structuredContent).toBeDefined();
            });
            expect(db.inserted).toHaveLength(1);
        } finally {
            if (before === undefined)
                delete process.env.ADDED_SUGAR_REQUIRED_FROM;
            else process.env.ADDED_SUGAR_REQUIRED_FROM = before;
        }
    });
});

describe("/mcp still serves 2025-era clients unchanged", () => {
    test("a legacy client completes initialize and lists tools", async () => {
        await withHttpClient("u1", "legacy", async (client) => {
            expect(client.getProtocolEra()).toBe("legacy");
            expect(client.getServerVersion()?.name).toBe("nutrition-mcp");
            expect(client.getServerCapabilities()?.tools).toBeDefined();
            const { tools } = await client.listTools();
            expect(tools.find((t) => t.name === "log_meal")?._meta?.ui).toEqual(
                { resourceUri: "ui://widget/meal-logged.html" },
            );
        });
    });

    // The legacy leg keeps nothing between requests either: a fresh transport
    // and a fresh server per POST is what makes a deploy invisible to the
    // connector clients that are all on this leg today.
    test("every legacy request builds its own server", async () => {
        await withHttpClient("legacy-user", "legacy", async (client) => {
            const before = db.profileReads.length;
            await client.listTools();
            await client.listTools();
            expect(db.profileReads.length).toBe(before + 2);
        });
        expect(new Set(db.profileReads)).toEqual(new Set(["legacy-user"]));
    });

    // The factory serves the tool-less bare server for the two identity-only
    // methods, gated on `ctx.era === "modern"` because the legacy fallback
    // ignores Mcp-Method entirely. Without that gate a legacy client whose
    // proxy (or whose own header bug) sent a stray Mcp-Method would have been
    // answered by a server with no tools registered at all.
    test("a stray Mcp-Method header cannot strip the tools off a legacy request", async () => {
        await withHttpClient(
            "u1",
            "legacy",
            async (client) => {
                expect(client.getProtocolEra()).toBe("legacy");
                const { tools } = await client.listTools();
                expect(tools.length).toBeGreaterThan(30);
                // The bare server reads no profile, so a profile read is the
                // direct witness that the full-server branch was taken —
                // dropping the era guard makes this the first assertion to go.
                expect(db.profileReads.length).toBeGreaterThan(0);
            },
            { "mcp-method": "server/discover" },
        );
    });

    test("legacy initialize answers in-band and issues no session id", async () => {
        const r = await rpc(appFor("u1"), {
            id: 1,
            method: "initialize",
            params: {
                protocolVersion: "2025-11-25",
                capabilities: {},
                clientInfo: { name: "c", version: "0" },
            },
        });
        expect(r.status).toBe(200);
        expect(r.headers.get("mcp-session-id")).toBeNull();
        const frame = await sseFrame(r);
        expect(frame.error).toBeUndefined();
        expect(
            (frame.result as { protocolVersion: string }).protocolVersion,
        ).toBe("2025-11-25");
    });
});

describe("/mcp transport posture", () => {
    test.each(["GET", "DELETE"])(
        "%s is refused with 405 and no SSE stream",
        async (method) => {
            const r = await appFor("u1").request("http://x/mcp", { method });
            expect(r.status).toBe(405);
            expect(r.headers.get("allow")).toBe("POST");
        },
    );

    test("subscriptions/listen is refused without opening a stream", async () => {
        const r = await rpc(
            appFor("u1"),
            {
                id: 7,
                method: "subscriptions/listen",
                params: {
                    notifications: { tools: true },
                    _meta: {
                        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
                        "io.modelcontextprotocol/clientCapabilities": {},
                    },
                },
            },
            {
                "mcp-protocol-version": "2026-07-28",
                "mcp-method": "subscriptions/listen",
            },
        );
        expect(r.headers.get("content-type")).not.toContain(
            "text/event-stream",
        );
        const body = (await r.json()) as {
            id?: unknown;
            error?: { code: number };
        };
        expect(body.id).toBe(7);
        // -32603 "Subscription limit reached" is the SDK's own maxSubscriptions
        // refusal, and it is now the only one: a hand-rolled -32601 pre-check
        // used to answer first off the Mcp-Method header alone, so the endpoint
        // reported two different codes for one condition.
        expect(body.error?.code).toBe(-32603);
    });

    // What the pre-check got wrong. A client that puts the listen method in the
    // header but calls a tool in the body has a header bug, and the SDK says so
    // (-32020, HTTP 400). The pre-check answered 200 "Method not found" echoing
    // the tools/call id, which reads as "this tool does not exist".
    test("a Mcp-Method that disagrees with the body is a header error, not a missing method", async () => {
        const r = await rpc(
            appFor("u1"),
            {
                id: 8,
                method: "tools/call",
                params: {
                    name: "get_profile",
                    arguments: {},
                    _meta: {
                        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
                        "io.modelcontextprotocol/clientCapabilities": {},
                    },
                },
            },
            {
                "mcp-protocol-version": "2026-07-28",
                "mcp-method": "subscriptions/listen",
                "mcp-name": "get_profile",
            },
        );
        expect(r.status).toBe(400);
        const body = (await r.json()) as {
            error?: { code: number; message: string };
        };
        expect(body.error?.code).toBe(-32020);
        expect(body.error?.message).toContain("headers and body disagree");
    });

    // The SDK's 415 gate runs before the body is read; the pre-check sat in
    // front of it and answered 200 to a POST that never had a valid body.
    test("a non-JSON Content-Type is refused 415 before anything is parsed", async () => {
        const r = await appFor("u1").request("http://x/mcp", {
            method: "POST",
            headers: {
                "content-type": "text/plain",
                "mcp-method": "subscriptions/listen",
            },
            body: "not json",
        });
        expect(r.status).toBe(415);
    });

    test("the icon URL follows the forwarding headers", async () => {
        await withHttpClient(
            "u1",
            { pin: "2026-07-28" },
            async (client) => {
                const icons = client.getServerVersion()?.icons ?? [];
                expect(icons.map((i) => i.src)).toEqual([
                    "https://nutrition-mcp.com/favicon.ico",
                    "https://nutrition-mcp.com/icon-192.png",
                    "https://nutrition-mcp.com/icon-512.png",
                ]);
            },
            {
                "x-forwarded-proto": "https",
                "x-forwarded-host": "nutrition-mcp.com",
            },
        );
    });

    // With no forwarding headers the icon falls back to the request's own
    // origin — the same fallback getBaseUrl gives the OAuth metadata URLs. It
    // used to be a hardcoded "http://localhost", so one request could advertise
    // an icon on one host and its resource metadata on another.
    test("with no forwarding headers the icon URL is the request origin", async () => {
        await withHttpClient("u1", { pin: "2026-07-28" }, async (client) => {
            expect(client.getServerVersion()?.icons?.[0]?.src).toBe(
                "http://test.local/favicon.ico",
            );
        });
    });
});

// The access log in src/index.ts prints `era=…` from what handleMcp publishes on
// the Hono context. It is the instrument for retiring the 2025-11-25 leg: when
// nothing has logged era=legacy for a sustained window, flipping the SDK's
// `legacy: "reject"` is safe. A guess derived from request headers would not be
// trustworthy enough to make that call, so this asserts the value comes from the
// era the SDK actually negotiated.
describe("/mcp records the negotiated era for the access log", () => {
    // Same wiring as appFor, plus the read the access log performs after the
    // route resolves.
    function recordingApp(userId: string, seen: (entry: string) => void) {
        const app = new Hono();
        app.all("/mcp", async (c) => {
            c.set("userId", userId);
            const res = await handleMcp(c);
            seen(
                `${c.req.method}:${c.get("mcpEra") ?? "-"}:${c.get("mcpClient") ?? "-"}`,
            );
            return res;
        });
        return app;
    }

    // Each entry is "METHOD:era" so the assertions can distinguish a request
    // the SDK served from one this endpoint refused before the SDK saw it.
    async function traceFor(
        mode: EraMode,
        identity: { name: string; version: string } = {
            name: "t",
            version: "0",
        },
    ): Promise<string[]> {
        const seen: string[] = [];
        const app = recordingApp("era-user", (era) => seen.push(era));
        const transport = new StreamableHTTPClientTransport(
            new URL("http://test.local/mcp"),
            { fetch: async (url, init) => app.request(String(url), init) },
        );
        const client = new Client(identity, {
            versionNegotiation: { mode },
        });
        await client.connect(transport);
        try {
            await client.listTools();
        } finally {
            await client.close();
        }
        return seen;
    }

    test("every served 2025-era request is recorded as legacy", async () => {
        const seen = await traceFor("legacy");
        const eras = seen
            .filter((s) => s.startsWith("POST:"))
            .map((s) => s.split(":")[1]);
        // initialize, notifications/initialized (the 202) and tools/list. The
        // 202 matters most: it is the marker that identifies a legacy client in
        // the log, so it must carry the era like any other request.
        expect(eras.length).toBeGreaterThanOrEqual(3);
        expect(new Set(eras)).toEqual(new Set(["legacy"]));
    });

    test("every served 2026-era request is recorded as modern", async () => {
        const seen = await traceFor({ pin: "2026-07-28" });
        const eras = seen
            .filter((s) => s.startsWith("POST:"))
            .map((s) => s.split(":")[1]);
        expect(eras.length).toBeGreaterThan(0);
        expect(new Set(eras)).toEqual(new Set(["modern"]));
    });

    test("the refused GET stream carries no era, not a guessed one", async () => {
        // A 2025-era client opens the standalone SSE stream with GET, which
        // handleMcp answers 405 before the SDK runs — so nothing negotiates an
        // era and the access log must omit the field.
        const seen = await traceFor("legacy");
        const gets = seen
            .filter((s) => s.startsWith("GET:"))
            .map((s) => s.split(":")[1]);
        expect(gets.length).toBeGreaterThan(0);
        expect(new Set(gets)).toEqual(new Set(["-"]));
    });

    test("a 2026-era client is named on every request, from the envelope", async () => {
        const seen = await traceFor(
            { pin: "2026-07-28" },
            {
                name: "acme-client",
                version: "9.9.9",
            },
        );
        const clients = seen
            .filter((s) => s.startsWith("POST:"))
            .map((s) => s.split(":")[2]);
        expect(clients.length).toBeGreaterThan(0);
        // The modern envelope carries clientInfo on every request, so unlike the
        // legacy leg there is no request that knows the era but not the client.
        expect(new Set(clients)).toEqual(new Set(["acme-client/9.9.9"]));
    });

    test("a 2025-era client is named on initialize, the only request that carries it", async () => {
        const seen = await traceFor("legacy", {
            name: "acme-client",
            version: "9.9.9",
        });
        const clients = seen
            .filter((s) => s.startsWith("POST:"))
            .map((s) => s.split(":")[2]);
        // Documents a real limitation rather than papering over it: on the
        // stateless legacy leg every request builds a fresh server and only
        // `initialize` carries clientInfo, so the rest log no client. One named
        // request per connection is still enough to answer who is on this leg.
        expect(clients).toContain("acme-client/9.9.9");
        expect(clients).toContain("-");
    });

    test("a client name cannot forge a log line", async () => {
        // Same injection surface as the SDK error messages: this value is
        // client-supplied and goes straight into the access line.
        const seen = await traceFor(
            { pin: "2026-07-28" },
            {
                name: "evil\n[req] POST /mcp 200 1ms ip=9.9.9.9",
                version: "1.0",
            },
        );
        const clients = seen
            .filter((s) => s.startsWith("POST:"))
            .map((s) => s.split(":")[2]);
        for (const c of clients) {
            expect(c).not.toContain("\n");
            expect(c).not.toContain(" ");
        }
        expect(clients[0]).toBe("evil_[req]_POST_/mcp_200_1ms_ip=9.9.9.9/1.0");
    });

    test("an over-long client name cannot push the real fields off the line", async () => {
        const seen = await traceFor(
            { pin: "2026-07-28" },
            {
                name: "x".repeat(500),
                version: "y".repeat(500),
            },
        );
        const client = seen
            .filter((s) => s.startsWith("POST:"))
            .map((s) => s.split(":")[2])[0];
        expect(client).toBe(`${"x".repeat(40)}/${"y".repeat(40)}`);
    });

    // The access log is a ring buffer holding well under an hour at production
    // volume, so it cannot answer "has anyone used legacy in the last 30 days".
    // tool_analytics can, and only if the era actually reaches the row.
    test.each(ERAS)(
        "the era reaches the tool_analytics row (%p)",
        async (mode) => {
            db.analyticsRows = [];
            await withHttpClient("u1", mode, (client) =>
                client.callTool({ name: "get_current_time", arguments: {} }),
            );
            const rows = db.analyticsRows.filter(
                (r) => r.tool_name === "get_current_time",
            );
            expect(rows.length).toBe(1);
            expect(rows[0]?.protocol_era).toBe(
                mode === "legacy" ? "legacy" : "modern",
            );
        },
    );

    test("a modern tool call records the client that made it", async () => {
        db.analyticsRows = [];
        await withHttpClient("u1", { pin: "2026-07-28" }, (client) =>
            client.callTool({ name: "get_current_time", arguments: {} }),
        );
        const row = db.analyticsRows.find(
            (r) => r.tool_name === "get_current_time",
        );
        // withHttpClient's client identifies itself as { name: "t", version: "0" }.
        expect(row?.client_name).toBe("t/0");
    });

    test("a legacy tool call records the era but not the client", async () => {
        db.analyticsRows = [];
        await withHttpClient("u1", "legacy", (client) =>
            client.callTool({ name: "get_current_time", arguments: {} }),
        );
        const row = db.analyticsRows.find(
            (r) => r.tool_name === "get_current_time",
        );
        // Documents the limitation instead of hiding it: on the stateless legacy
        // leg a tool call is a separate request from `initialize`, and only
        // `initialize` carries clientInfo. The era — the field the retirement
        // decision actually rests on — is still recorded.
        expect(row?.protocol_era).toBe("legacy");
        expect(row?.client_name).toBeUndefined();
    });

    test("a request refused before the factory carries no era", async () => {
        // 415: the SDK rejects on Content-Type before reading the body, so no
        // server is built and nothing stamps the trace. Inventing an era here
        // would corrupt the very count the legacy retirement decision rests on.
        const seen: string[] = [];
        const app = recordingApp("era-user", (era) => seen.push(era));
        const r = await app.request("http://test.local/mcp", {
            method: "POST",
            headers: { "content-type": "text/plain" },
            body: "not json",
        });
        expect(r.status).toBe(415);
        expect(seen).toEqual(["POST:-:-"]);
    });
});

// ---------- output schemas are frozen once deployed ----------
//
// Hosts (claude.ai, Claude Desktop) cache tools/list for an unknown, possibly
// multi-day period and validate every structuredContent against the CACHED
// outputSchema. Zod 4 emits `additionalProperties: false` on every object, so
// adding a structuredContent field — even an optional one — fails the whole
// call ("Structured content does not match the tool's output schema: data must
// NOT have additional properties") for every client still holding the old
// list. That happened on dev when get_nutrition_summary grew
// `meal_contributors`. Removing or narrowing a field breaks the same clients
// the other way round. So an advertised outputSchema never changes once it
// ships: new widget-only data goes in the CallToolResult's `_meta` (not
// validated against outputSchema, and handed to MCP Apps views in full — see
// MEAL_CONTRIBUTORS_META_KEY), and new model-facing data goes in `content`.
//
// src/output-schemas.frozen.json pins what production advertises, per tool
// (null = no outputSchema). Changing it is a deliberate act that needs a
// compatibility plan for stale host caches — not a snapshot refresh to make
// this test pass. A new tool's schema is added the same way, and is frozen
// from its first deploy. To rewrite the file after such a decision:
//   UPDATE_OUTPUT_SCHEMAS=1 bun test src/mcp.test.ts -t "output schemas"
// (which also runs prettier on the file, so format:check stays green).
describe("output schemas are frozen once deployed", () => {
    const FROZEN_PATH = new URL(
        "./output-schemas.frozen.json",
        import.meta.url,
    );

    async function advertised(
        widgetsEnabled: boolean,
        alcohol: "us" | "uk" | null,
    ): Promise<Record<string, unknown>> {
        const server = new McpServer(
            { name: "t", version: "0.0.0" },
            { capabilities: { tools: {}, resources: {} } },
        );
        registerTools(server, "u1", widgetsEnabled, alcohol);
        const [ct, st] = InMemoryTransport.createLinkedPair();
        const client = new Client({ name: "c", version: "0.0.0" });
        await Promise.all([server.connect(st), client.connect(ct)]);
        const { tools } = await client.listTools();
        await client.close();
        await server.close();
        const out: Record<string, unknown> = {};
        for (const t of [...tools].sort((a, b) =>
            a.name.localeCompare(b.name),
        )) {
            out[t.name] = t.outputSchema ?? null;
        }
        return out;
    }

    test("every tool's advertised outputSchema matches the frozen copy", async () => {
        const current = await advertised(true, null);
        if (process.env.UPDATE_OUTPUT_SCHEMAS === "1") {
            await Bun.write(
                FROZEN_PATH,
                JSON.stringify(current, null, 4) + "\n",
            );
            // The committed copy is prettier-clean (CI's format:check).
            await Bun.$`bunx prettier --write ${Bun.fileURLToPath(FROZEN_PATH)}`.quiet();
        }
        const frozen = (await Bun.file(FROZEN_PATH).json()) as Record<
            string,
            unknown
        >;
        // Same tool set, then each schema on its own so a failure names it.
        expect(Object.keys(current)).toEqual(Object.keys(frozen));
        for (const name of Object.keys(frozen)) {
            expect(current[name], name).toEqual(frozen[name]);
            // Key order too: compare the serialized form, whitespace aside.
            expect(JSON.stringify(current[name]), name).toBe(
                JSON.stringify(frozen[name]),
            );
        }
        // The schema must not depend on per-user settings either: every
        // user's host caches the same list shape.
        for (const [w, a] of [
            [true, "us"],
            [false, null],
            [false, "uk"],
        ] as const) {
            expect(JSON.stringify(await advertised(w, a))).toBe(
                JSON.stringify(current),
            );
        }
    });

    // Compiles the committed frozen copy itself (not the live server's
    // schema) with the SDK's own ajv provider — the JSON Schema 2020-12
    // engine a host runs — so this holds even if the test above were skipped.
    test("the summary validates against the frozen JSON, and the counts arrive in _meta", async () => {
        db.meals = [meal(), meal({ id: "m-2", caffeine_mg: 80 })];
        const frozen = (await Bun.file(FROZEN_PATH).json()) as Record<
            string,
            JsonSchemaType
        >;
        const validate = new AjvJsonSchemaValidator().getValidator(
            frozen.get_nutrition_summary!,
        );
        for (const alcohol of ["us", null] as const) {
            await withTools(alcohol, async (call) => {
                const r = await call("get_nutrition_summary", {
                    start_date: "2026-01-01",
                    end_date: "2026-01-31",
                });
                expect(r.isError).toBeFalsy();
                const result = validate(r.structuredContent);
                expect(result.errorMessage).toBeUndefined();
                expect(result.valid).toBe(true);
                expect(r._meta?.[MEAL_CONTRIBUTORS_META_KEY]).toMatchObject({
                    calories: 2,
                    caffeine_mg: 1,
                    alcohol_g: alcohol ? expect.any(Number) : null,
                });
            });
        }
        // The frozen schema really is strict: one extra field fails it, which
        // is the live failure this guard exists for.
        await withTools(null, async (call) => {
            const r = await call("get_nutrition_summary", {
                start_date: "2026-01-01",
                end_date: "2026-01-31",
            });
            expect(
                validate({ ...r.structuredContent, meal_contributors: {} })
                    .valid,
            ).toBe(false);
        });
    });

    // The widget cannot import the key, so it carries the literal; a rename
    // on the server would otherwise pass every server test while every host
    // silently lost the exact counts.
    test("the summary widget reads _meta under MEAL_CONTRIBUTORS_META_KEY", async () => {
        const html = await getWidgetHtml("nutrition-summary");
        expect(html).toContain(JSON.stringify(MEAL_CONTRIBUTORS_META_KEY));
    });
});

// ---------- get_weight_trends: trend weight and long-range series ----------

/** A stored weigh-in at an exact instant. */
function weighIn(logged_at: string, weight_g: number): WeightEntry {
    return {
        id: WEIGHT_ID,
        user_id: "u1",
        weight_g,
        logged_at,
        notes: null,
        created_at: logged_at,
        idempotency_key: null,
    };
}

/** One 08:00 UTC weigh-in a day for `days` days from `from`, losing
 *  `lossPerDay` grams a day from `startG`. */
function dailyWeighIns(
    from: string,
    days: number,
    startG: number,
    lossPerDay = 0,
): WeightEntry[] {
    return Array.from({ length: days }, (_, i) =>
        weighIn(
            `${shiftLocalDate(from, i)}T08:00:00.000Z`,
            startG - lossPerDay * i,
        ),
    );
}

/** The `_meta[WEIGHT_SERIES_META_KEY]` contract the widget reads (v1). Strict,
 *  so a stray field fails here before it surprises the template. */
const POINT = { weight: z.number(), trend: z.number() };
const WEIGHT_SERIES = z.strictObject({
    v: z.literal(1),
    unit: z.string(),
    daily: z.array(z.strictObject({ date: z.iso.date(), ...POINT })),
    weekly: z.array(z.strictObject({ start: z.iso.date(), ...POINT })),
    monthly: z.array(
        z.strictObject({ month: z.string().regex(/^\d{4}-\d{2}$/), ...POINT }),
    ),
    first: z
        .strictObject({ date: z.iso.date(), weight: z.number() })
        .nullable(),
    trend_latest: z.number().nullable(),
    trend_date: z.iso.date().nullable(),
    weekly_rate: z.number().nullable(),
});

describe("get_weight_trends", () => {
    // Kyiv is UTC+3 in summer, so the day bucketing is visibly local: the
    // 21:30Z weigh-in on May 31 is June 1 there, the 20:00Z one is not.
    const FIXTURE = [
        weighIn("2024-02-10T08:00:00.000Z", 92_000), // history only
        weighIn("2026-05-31T20:00:00.000Z", 85_000), // May 31 local: warm-up
        weighIn("2026-05-31T21:30:00.000Z", 80_000), // June 1 local
        weighIn("2026-06-01T06:00:00.000Z", 81_000), // June 1 local
        weighIn("2026-06-15T08:00:00.000Z", 79_940),
        weighIn("2026-06-29T22:30:00.000Z", 79_000), // June 30 local
        weighIn("2026-07-01T08:00:00.000Z", 70_000), // after end_date
    ];

    // The 30-day structuredContent the pre-trend handler produced for this
    // fixture, written out by hand: same keys, same order, same values. It
    // is frozen, so the full-history read must not change one byte of it.
    const EXPECTED_STRUCTURED = {
        end_date: "2026-06-30",
        unit: "kg",
        target: null,
        default_range: 30,
        locale: "en",
        days: [
            { date: "2026-06-01", weight: 80.5 },
            { date: "2026-06-15", weight: 79.9 },
            { date: "2026-06-30", weight: 79 },
        ],
    };

    test.each(ERAS)(
        "structuredContent validates against the frozen schema and the series rides in _meta (%p)",
        async (mode) => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            db.weights = FIXTURE;
            const frozen = (await Bun.file(
                new URL("./output-schemas.frozen.json", import.meta.url),
            ).json()) as Record<string, JsonSchemaType>;
            const validate = new AjvJsonSchemaValidator().getValidator(
                frozen.get_weight_trends!,
            );
            await withHttpClient("u1", mode, async (client) => {
                await client.listTools();
                const r = await client.callTool({
                    name: "get_weight_trends",
                    arguments: { end_date: "2026-06-30" },
                });
                expect(r.isError).toBeFalsy();
                const result = validate(r.structuredContent);
                expect(result.errorMessage).toBeUndefined();
                expect(result.valid).toBe(true);
                const meta = WEIGHT_SERIES.parse(
                    r._meta?.[WEIGHT_SERIES_META_KEY],
                );
                expect(meta.unit).toBe("kg");
                expect(meta.first).toEqual({ date: "2024-02-10", weight: 92 });
                expect(meta.trend_date).toBe("2026-06-30");
                // Nothing in _meta leaked into the frozen payload.
                expect(Object.keys(r.structuredContent ?? {})).toEqual(
                    Object.keys(EXPECTED_STRUCTURED),
                );
            });
        },
    );

    test("structuredContent.days is byte for byte the pre-trend 30-day payload", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        db.weights = FIXTURE;
        await withTools(null, async (call) => {
            const r = await call("get_weight_trends", {
                end_date: "2026-06-30",
            });
            expect(r.isError).toBeFalsy();
            expect(JSON.stringify(r.structuredContent)).toBe(
                JSON.stringify(EXPECTED_STRUCTURED),
            );
        });
    });

    test("one full-history read; warm-up and history days stay out of structuredContent", async () => {
        db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
        db.weights = FIXTURE;
        await withTools(null, async (call) => {
            const r = await call("get_weight_trends", {
                end_date: "2026-06-30",
            });
            expect(db.weightReads).toEqual(["all"]);
            const days = (
                r.structuredContent as { days: { date: string }[] }
            ).days.map((d) => d.date);
            expect(days).not.toContain("2026-05-31");
            expect(days).not.toContain("2024-02-10");
            expect(days).not.toContain("2026-07-01");
            const meta = WEIGHT_SERIES.parse(r._meta?.[WEIGHT_SERIES_META_KEY]);
            // The warm-up day was read and fed the trend: it is in the
            // 90-day series, and the trend on June 1 is pulled toward 85 kg
            // rather than seeded at 80.5.
            expect(meta.daily.map((d) => d.date)).toEqual([
                "2026-05-31",
                "2026-06-01",
                "2026-06-15",
                "2026-06-30",
            ]);
            expect(meta.daily[1]!.trend).toBeGreaterThan(80.5);
            // Weigh-ins after end_date never reach any series.
            expect(meta.monthly.map((m) => m.month)).toEqual([
                "2024-02",
                "2026-05",
                "2026-06",
            ]);
            // The text names the history the window does not show.
            expect(textOf(r)).toContain(
                `Since first weigh-in (2024-02-10, 92 kg): `,
            );
            expect(textOf(r)).toContain(`trend now ${meta.trend_latest} kg.`);
        });
    });

    test("a 3-year user gets a monthly series of every month, and the text rate equals the chip's", async () => {
        // 2023-07-01 … 2026-06-30: 1096 daily weigh-ins over 36 months.
        db.weights = dailyWeighIns("2023-07-01", 1096, 100_000, 20);
        await withTools(null, async (call) => {
            const r = await call("get_weight_trends", {
                end_date: "2026-06-30",
            });
            expect(r.isError).toBeFalsy();
            const meta = WEIGHT_SERIES.parse(r._meta?.[WEIGHT_SERIES_META_KEY]);
            expect(meta.monthly).toHaveLength(36);
            expect(meta.monthly[0]!.month).toBe("2023-07");
            expect(meta.monthly.at(-1)!.month).toBe("2026-06");
            expect(meta.weekly).toHaveLength(53);
            expect(meta.daily).toHaveLength(90);
            expect(meta.first).toEqual({ date: "2023-07-01", weight: 100 });
            // 20 g a day is 0.14 kg a week: 2 decimals in _meta, and the
            // 1 decimal both the text and the chip show.
            expect(meta.weekly_rate).toBe(-0.14);
            expect(rateForDisplay(meta.weekly_rate!)).toBe(-0.1);
            // Exact glyphs: a real minus (U+2212) and one decimal, the same
            // rule as the widget chip's signed().
            expect(textOf(r)).toContain(
                `Trend weight: ${meta.trend_latest} kg (−0.1 kg/week over the last 2 weeks)`,
            );
            expect(textOf(r)).not.toMatch(/\(-\d/);
            // structuredContent still holds only the last 30 days.
            expect(
                (r.structuredContent as { days: unknown[] }).days,
            ).toHaveLength(30);
        });
    });

    test("default_range maps days to the widget's ranges", async () => {
        db.weights = dailyWeighIns("2026-06-01", 30, 80_000);
        const cases: [number, number][] = [
            [7, 7],
            [14, 14],
            [30, 30],
            [90, 90],
            [365, 365],
            [2, 30],
            [45, 30],
        ];
        await withTools(null, async (call) => {
            for (const [days, expected] of cases) {
                const r = await call("get_weight_trends", {
                    days,
                    end_date: "2026-06-30",
                });
                expect(
                    (r.structuredContent as { default_range: number })
                        .default_range,
                    `days=${days}`,
                ).toBe(expected);
            }
        });
    });

    test("the text names the 30-day span of the structured series when the window differs", async () => {
        db.weights = dailyWeighIns("2026-03-01", 122, 80_000);
        const note = "The structured daily series covers the last 30 days only";
        await withTools(null, async (call) => {
            const r93 = await call("get_weight_trends", {
                days: 93,
                end_date: "2026-06-30",
            });
            expect(textOf(r93)).toContain(
                `${note} (2026-06-01 to 2026-06-30); the figures above cover the requested 93-day window.`,
            );
            const r7 = await call("get_weight_trends", {
                days: 7,
                end_date: "2026-06-30",
            });
            expect(textOf(r7)).toContain(note);
            const r30 = await call("get_weight_trends", {
                end_date: "2026-06-30",
            });
            expect(textOf(r30)).not.toContain(note);
        });
    });

    test("no weigh-ins at all still returns the frozen payload and an empty series", async () => {
        await withTools(null, async (call) => {
            const r = await call("get_weight_trends", {
                end_date: "2026-06-30",
            });
            expect(r.isError).toBeFalsy();
            expect(r.structuredContent).toMatchObject({ days: [] });
            expect(
                WEIGHT_SERIES.parse(r._meta?.[WEIGHT_SERIES_META_KEY]),
            ).toMatchObject({
                daily: [],
                weekly: [],
                monthly: [],
                first: null,
                trend_latest: null,
                weekly_rate: null,
            });
        });
    });

    // The widget cannot import the key, so it carries the literal; a rename
    // on the server would otherwise pass every server test while every host
    // silently fell back to the raw 7/14/30-day chart.
    test("the weight-trends widget reads _meta under WEIGHT_SERIES_META_KEY", async () => {
        expect(WEIGHT_SERIES_META_KEY).toBe("nutrition-mcp.com/weight-series");
        const html = await getWidgetHtml("weight-trends");
        expect(html).toContain(JSON.stringify(WEIGHT_SERIES_META_KEY));
    });
});

// ---------- get_trends group_by: per-period averages in _meta ----------

const PERIOD_TARGETS = z
    .strictObject({
        calories: z.number().nullable(),
        protein: z.number().nullable(),
        carbs: z.number().nullable(),
        fat: z.number().nullable(),
    })
    .nullable();
const PERIOD_ROW = z.strictObject({
    key: z.string(),
    start: z.iso.date(),
    end: z.iso.date(),
    days: z.number().int(),
    partial: z.boolean(),
    logged_days: z.number().int(),
    avg: z
        .strictObject({
            calories: z.number(),
            protein: z.number(),
            carbs: z.number(),
            fat: z.number(),
        })
        .nullable(),
    targets: PERIOD_TARGETS,
    targets_changed: z.boolean(),
    targets_assumed: z.boolean(),
    on_target_days: z.number().int().nullable(),
    incomplete_days: z.number().int().nullable(),
});
const PERIOD_META = z.strictObject({
    v: z.literal(1),
    end_date: z.iso.date(),
    group_by: z.enum(["week", "month", "quarter", "year"]),
    targets_from: z.iso.date().nullable(),
    periods: z.strictObject({
        week: z.array(PERIOD_ROW),
        month: z.array(PERIOD_ROW),
        quarter: z.array(PERIOD_ROW),
        year: z.array(PERIOD_ROW),
    }),
});

/** A goals-history row: every column null unless given. */
function historyRow(
    effective_at: string,
    over: Partial<NutritionGoalsHistoryRow> = {},
): NutritionGoalsHistoryRow {
    return {
        effective_at,
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
        ...over,
    };
}

describe("get_trends group_by", () => {
    const END = "2026-07-31";
    // One meal in late December 2025 (the first logged day, so every period
    // before it is dropped), nothing from January to June (kept: the gap is
    // the information), then most of July with varied totals.
    const JULY_GAPS = new Set([5, 6, 12]);
    const julyMeals = (): Meal[] => {
        const out: Meal[] = [];
        for (let d = 1; d <= 20; d++) {
            if (JULY_GAPS.has(d)) continue;
            const date = `2026-07-${String(d).padStart(2, "0")}`;
            out.push(
                meal({
                    id: `jul-${d}-a`,
                    logged_at: `${date}T08:00:00.000Z`,
                    calories: 600 + 13 * d,
                    protein_g: 30 + d,
                    carbs_g: 70.5,
                    fat_g: 20 + d / 3,
                }),
            );
            if (d % 3 === 0) {
                out.push(
                    meal({
                        id: `jul-${d}-b`,
                        logged_at: `${date}T19:00:00.000Z`,
                        calories: 1100,
                        protein_g: 60,
                        carbs_g: 120,
                        fat_g: 41,
                    }),
                );
            }
        }
        return out;
    };
    const FIXTURE = (): Meal[] => [
        meal({
            id: "dec",
            logged_at: "2025-12-30T12:00:00.000Z",
            calories: 1800,
        }),
        ...julyMeals(),
    ];
    // Goals recorded from July 10 (so July 1–9 assume them), raised on
    // July 20 — a change inside July.
    const HISTORY = [
        historyRow("2026-07-10T09:00:00.000Z", {
            daily_calories: 2000,
            daily_protein_g: 120,
            daily_carbs_g: 220,
            daily_fat_g: 70,
        }),
        historyRow("2026-07-20T18:00:00.000Z", {
            daily_calories: 2200,
            daily_protein_g: 140,
            daily_carbs_g: 240,
            daily_fat_g: 70,
        }),
    ];

    test.each(ERAS)(
        "structuredContent validates against the frozen schema and the periods ride in _meta (%p)",
        async (mode) => {
            db.meals = FIXTURE();
            db.goals = goals();
            db.goalsHistory = HISTORY;
            const frozen = (await Bun.file(
                new URL("./output-schemas.frozen.json", import.meta.url),
            ).json()) as Record<string, JsonSchemaType>;
            const validate = new AjvJsonSchemaValidator().getValidator(
                frozen.get_trends!,
            );
            await withHttpClient("u1", mode, async (client) => {
                await client.listTools();
                const r = await client.callTool({
                    name: "get_trends",
                    arguments: { end_date: END, group_by: "month" },
                });
                expect(r.isError).toBeFalsy();
                const result = validate(r.structuredContent);
                expect(result.errorMessage).toBeUndefined();
                expect(result.valid).toBe(true);
                const meta = PERIOD_META.parse(
                    r._meta?.[PERIOD_AVERAGES_META_KEY],
                );
                expect(meta.end_date).toBe(END);
                expect(meta.group_by).toBe("month");
                // The widget's "targets before {date} not recorded" date:
                // the first history row's local day.
                expect(meta.targets_from).toBe("2026-07-10");
                // Dec 2025 … Jul 2026, newest first: leading empty months
                // dropped, the empty months inside the history kept.
                expect(meta.periods.month.map((p) => p.key)).toEqual([
                    "2026-07",
                    "2026-06",
                    "2026-05",
                    "2026-04",
                    "2026-03",
                    "2026-02",
                    "2026-01",
                    "2025-12",
                ]);
                const feb = meta.periods.month.find(
                    (p) => p.key === "2026-02",
                )!;
                expect(feb).toMatchObject({
                    days: 28,
                    logged_days: 0,
                    avg: null,
                });
                expect(meta.periods.year.map((p) => p.key)).toEqual([
                    "2026",
                    "2025",
                ]);
                // Nothing in _meta leaked into the frozen payload.
                expect(Object.keys(r.structuredContent ?? {})).toEqual([
                    "end_date",
                    "default_range",
                    "drink_unit",
                    "locale",
                    "goals",
                    "days",
                ]);
            });
        },
    );

    test("without group_by: no _meta key, no history read, and today's read window and structuredContent", async () => {
        db.meals = FIXTURE();
        db.goals = goals();
        db.goalsHistory = HISTORY;
        await withTools(null, async (call) => {
            const plain = await call("get_trends", { end_date: END });
            expect(plain.isError).toBeFalsy();
            expect(plain._meta?.[PERIOD_AVERAGES_META_KEY]).toBeUndefined();
            expect(db.goalsHistoryReads).toBe(0);
            expect(db.mealRangeArgs).toEqual([["2026-07-02", END]]);
            // The pre-group_by payload, rebuilt from the same helpers the
            // handler always used: same keys, same order, same values.
            const start = shiftLocalDate(END, -29);
            const expected = {
                end_date: END,
                default_range: 30,
                drink_unit: null,
                locale: "en",
                goals: goalsPayloadOf(db.goals, null),
                days: buildDailyBuckets(db.meals, [], start, END, "UTC").map(
                    (b) => trendsDayPayloadOf(b, null),
                ),
            };
            expect(JSON.stringify(plain.structuredContent)).toBe(
                JSON.stringify(expected),
            );
            expect(textOf(plain)).not.toContain("per logged day");

            // group_by leaves structuredContent alone and only appends text.
            const grouped = await call("get_trends", {
                end_date: END,
                group_by: "month",
            });
            expect(JSON.stringify(grouped.structuredContent)).toBe(
                JSON.stringify(expected),
            );
            expect(textOf(grouped).startsWith(textOf(plain))).toBe(true);
            expect(db.goalsHistoryReads).toBe(1);
            // One meal read, widened to the 5-year span.
            expect(db.mealRangeArgs).toEqual([
                ["2026-07-02", END],
                ["2022-01-01", END],
            ]);
        });
    });

    test("days still sets the structured window when group_by is set", async () => {
        db.meals = FIXTURE();
        await withTools(null, async (call) => {
            const plain = await call("get_trends", { end_date: END, days: 7 });
            const grouped = await call("get_trends", {
                end_date: END,
                days: 7,
                group_by: "week",
            });
            expect(JSON.stringify(grouped.structuredContent)).toBe(
                JSON.stringify(plain.structuredContent),
            );
            expect(
                (grouped.structuredContent as { default_range: number })
                    .default_range,
            ).toBe(7);
        });
    });

    test("the text lists the requested granularity per logged day, with the goal notes", async () => {
        db.meals = FIXTURE();
        db.goalsHistory = HISTORY;
        await withTools(null, async (call) => {
            const month = textOf(
                await call("get_trends", { end_date: END, group_by: "month" }),
            );
            expect(month).toContain(
                "Averages per logged day (days with no meals are excluded), vs the targets in effect at the time.",
            );
            const july = month
                .split("\n")
                .find((l) => l.startsWith("Jul 2026 · "));
            expect(july).toBeDefined();
            expect(july).toContain("17/31 days logged");
            expect(july).toContain("(target 2,200)");
            expect(july).toContain("targets changed mid-period");
            expect(july).toContain("targets before 2026-07-10 not recorded");
            expect(month).toContain("Feb 2026 · 0/28 days logged");
            // Newest first.
            expect(month.indexOf("Jul 2026")).toBeLessThan(
                month.indexOf("Dec 2025"),
            );

            const week = textOf(
                await call("get_trends", { end_date: END, group_by: "week" }),
            );
            expect(week).toContain("Jul 27 – Aug 2, 2026 (partial)");
            expect(week).not.toContain("Jul 2026 ·");
        });
    });

    test("meals before the 5-year span keep its empty early periods as inner gaps", async () => {
        db.meals = FIXTURE();
        const years = async () => {
            let rows: { key: string; logged_days: number }[] = [];
            await withTools(null, async (call) => {
                const r = await call("get_trends", {
                    end_date: END,
                    group_by: "year",
                });
                rows = PERIOD_META.parse(r._meta?.[PERIOD_AVERAGES_META_KEY])
                    .periods.year;
            });
            return rows;
        };
        const cut = await years();
        expect(cut.map((r) => r.key)).not.toContain("2022");
        expect(db.mealsBeforeArgs).toEqual(["2022-01-01"]);

        db.mealsBefore = true;
        const kept = await years();
        expect(kept.map((r) => r.key)).toEqual([
            "2026",
            "2025",
            "2024",
            "2023",
            "2022",
        ]);
        expect(kept.at(-1)?.logged_days).toBe(0);
    });

    test("no goals history: averages only, no targets anywhere", async () => {
        db.meals = FIXTURE();
        db.goals = goals();
        await withTools(null, async (call) => {
            const r = await call("get_trends", {
                end_date: END,
                group_by: "quarter",
            });
            expect(r.isError).toBeFalsy();
            const meta = PERIOD_META.parse(r._meta?.[PERIOD_AVERAGES_META_KEY]);
            for (const g of ["week", "month", "quarter", "year"] as const) {
                for (const row of meta.periods[g]) {
                    expect(row.targets).toBeNull();
                    expect(row.on_target_days).toBeNull();
                    expect(row.incomplete_days).toBeNull();
                }
            }
            expect(textOf(r)).toContain("No nutrition targets are set.");
            expect(textOf(r)).not.toContain("(target");
        });
    });

    test("nothing logged in the span still validates and returns empty periods", async () => {
        await withTools(null, async (call) => {
            const r = await call("get_trends", {
                end_date: END,
                group_by: "year",
            });
            expect(r.isError).toBeFalsy();
            const meta = PERIOD_META.parse(r._meta?.[PERIOD_AVERAGES_META_KEY]);
            expect(meta.targets_from).toBeNull();
            expect(meta.periods).toEqual({
                week: [],
                month: [],
                quarter: [],
                year: [],
            });
            expect(textOf(r)).toContain(
                `no meals logged in the last ${PERIOD_ROW_COUNTS.year} years`,
            );
        });
    });

    test("an unknown granularity is refused before the database", async () => {
        await withTools(null, async (call) => {
            const r = await call("get_trends", {
                end_date: END,
                group_by: "day",
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("group_by");
            expect(db.mealRangeArgs).toEqual([]);
        });
    });

    test("logged days add up across granularities", async () => {
        db.meals = FIXTURE();
        db.goalsHistory = HISTORY;
        await withTools(null, async (call) => {
            const r = await call("get_trends", {
                end_date: END,
                group_by: "year",
            });
            const meta = PERIOD_META.parse(r._meta?.[PERIOD_AVERAGES_META_KEY]);
            const logged = (g: "month" | "quarter" | "year") =>
                meta.periods[g].reduce((n, p) => n + p.logged_days, 0);
            // All 18 logged days sit inside every span but the 26 weeks'.
            expect(logged("year")).toBe(18);
            expect(logged("quarter")).toBe(18);
            expect(logged("month")).toBe(18);
            const q3 = meta.periods.quarter.find((p) => p.key === "2026-Q3")!;
            const julyToSep = meta.periods.month.filter((p) =>
                ["2026-07", "2026-08", "2026-09"].includes(p.key),
            );
            expect(julyToSep.reduce((n, p) => n + p.logged_days, 0)).toBe(
                q3.logged_days,
            );
        });
    });

    // The acceptance cross-check: for a month inside get_nutrition_summary's
    // 92-day cap, the month's per-logged-day averages are the summary's
    // logged-day averages over the same dates. No water-only day here: the
    // summary counts one as logged, a period row deliberately does not.
    test("a month's per-logged-day averages equal get_nutrition_summary's over the same dates", async () => {
        db.meals = julyMeals();
        db.goalsHistory = HISTORY;
        await withTools(null, async (call) => {
            const summary = (
                await call("get_nutrition_summary", {
                    start_date: "2026-07-01",
                    end_date: END,
                })
            ).structuredContent as {
                logged_days: number;
                averages: {
                    calories: number;
                    protein_g: number;
                    carbs_g: number;
                    fat_g: number;
                };
            };
            const r = await call("get_trends", {
                end_date: END,
                group_by: "month",
            });
            const july = PERIOD_META.parse(r._meta?.[PERIOD_AVERAGES_META_KEY])
                .periods.month[0]!;
            expect(july.key).toBe("2026-07");
            expect(july.partial).toBe(false);
            expect(july.logged_days).toBe(summary.logged_days);
            const r1 = (n: number) => Math.round(n * 10) / 10;
            expect(Math.round(july.avg!.calories)).toBe(
                summary.averages.calories,
            );
            expect(r1(july.avg!.protein)).toBe(summary.averages.protein_g);
            expect(r1(july.avg!.carbs)).toBe(summary.averages.carbs_g);
            expect(r1(july.avg!.fat)).toBe(summary.averages.fat_g);
        });
    });

    // The widget cannot import the key, so it carries the literal; a rename
    // on the server would otherwise pass every server test while every host
    // silently stayed on the 7/14/30-day view.
    test("the trends widget reads _meta under PERIOD_AVERAGES_META_KEY", async () => {
        expect(PERIOD_AVERAGES_META_KEY).toBe(
            "nutrition-mcp.com/period-averages",
        );
        const html = await getWidgetHtml("trends");
        expect(html).toContain(JSON.stringify(PERIOD_AVERAGES_META_KEY));
    });
});

// ---------- get_profile's Apple Health sync line, and the delete text ----------

describe("healthSyncProfileLine", () => {
    const link = {
        kind: "shortcut" as const,
        fields: ["energy_kcal"],
        fallback_tz: null,
        sync_start_date: "2026-09-26",
        created_at: "2026-09-27T06:00:00.000Z",
        last_used_at: null,
        last_sync_at: null,
        expires_at: "2026-12-26T06:00:00.000Z",
        sent_through: null,
    };

    test("says plainly when nothing is connected or the status is unreadable", () => {
        expect(healthSyncProfileLine(null, "UTC")).toBe(
            "Apple Health sync: not connected.",
        );
        expect(healthSyncProfileLine(undefined, "UTC")).toBe(
            "Apple Health sync: status unavailable right now.",
        );
    });

    test("a link that has not synced yet says so instead of inventing dates", () => {
        expect(healthSyncProfileLine(link, "America/New_York")).toBe(
            "Apple Health sync: connected 2026-09-27, sent through nothing yet, last sync never.",
        );
    });

    test("describes, never directs", () => {
        for (const line of [
            healthSyncProfileLine(null, "UTC"),
            healthSyncProfileLine(undefined, "UTC"),
            healthSyncProfileLine(link, "UTC"),
        ])
            expect(line).not.toMatch(/\b(call|offer|ask|tell|suggest)\b/i);
    });
});

test("delete_account names the Apple Health sync connection and its record", async () => {
    const server = new McpServer(
        { name: "t", version: "0.0.0" },
        { capabilities: { tools: {}, resources: {} } },
    );
    registerTools(server, "u1", true, null);
    const [ct, st] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "c", version: "0.0.0" });
    await Promise.all([server.connect(st), client.connect(ct)]);
    const { tools } = await client.listTools();
    await client.close();
    await server.close();
    const desc =
        tools.find((t) => t.name === "delete_account")?.description ?? "";
    expect(desc).toContain("Apple Health sync connection");
    expect(desc).toContain("record of values sent");
});

// ---------- added sugar reaches the widgets through _meta ----------
//
// No structuredContent object may gain a field (the schemas are frozen), so
// the five widget tools carry an AddedSugarMeta under ADDED_SUGAR_META_KEY in
// the result's _meta instead. Driven over HTTP on both eras: withHttpClient
// arms the client's advertised-schema check, so every call below also proves
// structuredContent still validates against the frozen schema.
describe("added sugar rides in _meta on every widget tool", () => {
    // The payload's whole v1 contract, strictly: a stray key would mean the
    // widget is reading something the server never promised.
    const ADDED_SUGAR_META = z
        .object({
            v: z.literal(1),
            goal: z.number().nullable(),
            days: z.record(z.string(), z.number().nullable()).optional(),
            meals: z.record(z.string(), z.number().nullable()).optional(),
            contributors: z.number().int().min(0).optional(),
            extra: z
                .array(
                    z.strictObject({
                        description: z.string(),
                        meal_type: z.string().nullable(),
                        date: z.string().nullable(),
                        added_sugar_g: z.number().positive(),
                    }),
                )
                .max(MEAL_BREAKDOWN_TOP_N)
                .optional(),
        })
        .strict();
    type AddedSugarPayload = z.infer<typeof ADDED_SUGAR_META>;

    const DAY = "2026-07-26";
    const BANANA_1 = "00000000-0000-4000-8000-0000000000b1";
    const BANANA_2 = "00000000-0000-4000-8000-0000000000b2";
    const COLA = "00000000-0000-4000-8000-0000000000c1";

    // The brief's acceptance day: two bananas (~120 g each) and a 330 ml
    // cola — about 64 g total sugar, 35 g of it added, all from the cola.
    function bananasAndCola(): Meal[] {
        return [
            meal({
                id: BANANA_1,
                logged_at: `${DAY}T08:00:00.000Z`,
                description: "Banana",
                calories: 107,
                sugar_g: 14.7,
                added_sugar_g: 0,
                alcohol_g: 0,
            }),
            meal({
                id: BANANA_2,
                logged_at: `${DAY}T11:00:00.000Z`,
                description: "Banana",
                calories: 107,
                sugar_g: 14.7,
                added_sugar_g: 0,
                alcohol_g: 0,
            }),
            meal({
                id: COLA,
                logged_at: `${DAY}T15:00:00.000Z`,
                description: "Cola 330 ml",
                calories: 139,
                sugar_g: 35,
                added_sugar_g: 35,
                alcohol_g: 0,
            }),
        ];
    }

    async function call(
        client: Client,
        name: string,
        args: Record<string, unknown>,
    ): Promise<{ r: ToolResult; meta: AddedSugarPayload }> {
        const r = (await client.callTool({
            name,
            arguments: args,
        })) as unknown as ToolResult;
        expect(r.isError).toBeFalsy();
        expect(r.structuredContent).toBeDefined();
        // Nothing added sugar touches may leak into structuredContent.
        expect(JSON.stringify(r.structuredContent)).not.toContain(
            "added_sugar",
        );
        const meta = ADDED_SUGAR_META.parse(r._meta?.[ADDED_SUGAR_META_KEY]);
        return { r, meta };
    }

    // The widget joins meta.meals to the breakdown rows BY POSITION (the rows
    // carry no id), so the two must have one length and one order.
    function expectJoinable(r: ToolResult, meta: AddedSugarPayload) {
        const rows = (r.structuredContent as { meals: unknown[] }).meals;
        expect(Object.keys(meta.meals ?? {})).toHaveLength(rows.length);
    }

    describe.each(ERAS)("%p", (mode) => {
        test("log_meal: goal, the day, and the shown meals", async () => {
            db.goals = goals({ daily_added_sugar_g: 25 });
            await withHttpClient("u1", mode, async (client) => {
                const { r, meta } = await call(client, "log_meal", {
                    description: "Cola 330 ml",
                    meal_type: "snack",
                    calories: 139,
                    sugar_g: 35,
                    added_sugar_g: 35,
                    logged_at: `${DAY}T15:00:00Z`,
                });
                expect(meta.goal).toBe(25);
                expect(meta.days).toEqual({ [DAY]: 35 });
                expect(meta.meals).toEqual({ [MEAL_ID]: 35 });
                expect(meta).not.toHaveProperty("contributors");
                expectJoinable(r, meta);
            });
        });

        // The ChatGPT report, end to end: a 330 ml cola logged with sugar_g
        // 35 and no added_sugar_g against a 29 g limit. The text states the
        // gap instead of leaving total sugar to be read against the limit,
        // and _meta still carries the goal beside a null (not recorded) day,
        // which is what lets the widget show its "not recorded" cell.
        test("log_meal without added_sugar_g: not recorded, goal kept", async () => {
            db.goals = goals({ daily_sugar_g: null, daily_added_sugar_g: 29 });
            await withHttpClient("u1", mode, async (client) => {
                const { r, meta } = await call(client, "log_meal", {
                    description: "Cola 330 ml",
                    meal_type: "snack",
                    calories: 139,
                    sugar_g: 35,
                    logged_at: `${DAY}T15:00:00Z`,
                });
                const text = textOf(r);
                expect(text).toContain("Sugar: 35g");
                expect(text).toContain(
                    "Added sugar: not recorded on this day (limit 29g)",
                );
                expect(text).not.toMatch(/Added sugar: 35|6g over/);
                expect(meta).toEqual({
                    v: 1,
                    goal: 29,
                    days: { [DAY]: null },
                    meals: { [MEAL_ID]: null },
                });
            });
        });

        test("get_trends with a limit and nothing recorded keeps the goal", async () => {
            db.goals = goals({ daily_added_sugar_g: 29 });
            db.meals = [
                meal({
                    logged_at: `${DAY}T15:00:00.000Z`,
                    sugar_g: 35,
                    added_sugar_g: null,
                }),
            ];
            await withHttpClient("u1", mode, async (client) => {
                const { r, meta } = await call(client, "get_trends", {
                    days: 7,
                    end_date: DAY,
                });
                expect(textOf(r)).toContain(
                    "Added sugar: not recorded in this period (limit 29g)",
                );
                expect(meta.goal).toBe(29);
                expect(meta.days?.[DAY]).toBeNull();
                expect(
                    Object.values(meta.days ?? {}).every((v) => v === null),
                ).toBe(true);
            });
        });

        test("log_meal with no goals and no added sugar still carries it", async () => {
            await withHttpClient("u1", mode, async (client) => {
                const { meta } = await call(client, "log_meal", {
                    description: "Toast",
                    meal_type: "snack",
                    calories: 80,
                    logged_at: `${DAY}T08:00:00Z`,
                });
                // Not recorded: a null day and a null meal, never 0.
                expect(meta).toEqual({
                    v: 1,
                    goal: null,
                    days: { [DAY]: null },
                    meals: { [MEAL_ID]: null },
                });
            });
        });

        test("update_meal: the same payload as log_meal", async () => {
            db.goals = goals({ daily_added_sugar_g: 0 });
            await withHttpClient("u1", mode, async (client) => {
                const { r, meta } = await call(client, "update_meal", {
                    id: MEAL_ID,
                    sugar_g: 20,
                    added_sugar_g: 12,
                    logged_at: `${DAY}T12:00:00Z`,
                });
                // 0 is a real ceiling, not "unset".
                expect(meta.goal).toBe(0);
                expect(meta.days).toEqual({ [DAY]: 12 });
                expect(meta.meals).toEqual({ [MEAL_ID]: 12 });
                expectJoinable(r, meta);
            });
        });

        test("get_goal_progress: the acceptance day", async () => {
            db.goals = goals({ daily_sugar_g: null, daily_added_sugar_g: 25 });
            db.meals = bananasAndCola();
            await withHttpClient("u1", mode, async (client) => {
                const { r, meta } = await call(client, "get_goal_progress", {
                    date: DAY,
                });
                expect(meta.goal).toBe(25);
                expect(meta.days).toEqual({ [DAY]: 35 });
                expect(meta.meals).toEqual({
                    [BANANA_1]: 0,
                    [BANANA_2]: 0,
                    [COLA]: 35,
                });
                expect(Object.keys(meta.meals!)).toEqual([
                    BANANA_1,
                    BANANA_2,
                    COLA,
                ]);
                // A single day lists every meal; nothing to add.
                expect(meta).not.toHaveProperty("extra");
                expectJoinable(r, meta);
            });
        });

        test("get_goal_progress: an empty day", async () => {
            await withHttpClient("u1", mode, async (client) => {
                const { meta } = await call(client, "get_goal_progress", {
                    date: DAY,
                });
                expect(meta).toEqual({
                    v: 1,
                    goal: null,
                    days: { [DAY]: null },
                    meals: {},
                });
            });
        });

        test("get_nutrition_summary: merged beside the contributors", async () => {
            db.goals = goals({ daily_added_sugar_g: 25 });
            // A pre-feature day (no added sugar recorded) beside the
            // acceptance day: it is null, never 0.
            db.meals = [
                meal({
                    id: "00000000-0000-4000-8000-0000000000a1",
                    logged_at: "2026-07-25T12:00:00.000Z",
                    added_sugar_g: null,
                }),
                ...bananasAndCola(),
            ];
            await withHttpClient("u1", mode, async (client) => {
                const { r, meta } = await call(
                    client,
                    "get_nutrition_summary",
                    { start_date: "2026-07-20", end_date: DAY },
                );
                expect(meta.goal).toBe(25);
                expect(meta.days).toEqual({
                    "2026-07-25": null,
                    [DAY]: 35,
                });
                expect(meta.contributors).toBe(1);
                expect(meta.meals?.[COLA]).toBe(35);
                // Every meal is kept here, so nothing is left for `extra`.
                expect(meta.extra).toEqual([]);
                expectJoinable(r, meta);
                // The contributors key is still there, in the same object.
                expect(
                    MEAL_CONTRIBUTORS.parse(
                        r._meta?.[MEAL_CONTRIBUTORS_META_KEY],
                    ).calories,
                ).toBe(4);
            });
        });

        test("get_nutrition_summary: the empty path", async () => {
            await withHttpClient("u1", mode, async (client) => {
                const { r, meta } = await call(
                    client,
                    "get_nutrition_summary",
                    { start_date: "2026-07-20", end_date: DAY },
                );
                expect(meta).toEqual({
                    v: 1,
                    goal: null,
                    days: {},
                    meals: {},
                    contributors: 0,
                });
                expect(
                    MEAL_CONTRIBUTORS.parse(
                        r._meta?.[MEAL_CONTRIBUTORS_META_KEY],
                    ).calories,
                ).toBe(0);
            });
        });

        test("get_trends: goal and the 30-day series", async () => {
            db.goals = goals({ daily_added_sugar_g: 25 });
            db.meals = bananasAndCola();
            await withHttpClient("u1", mode, async (client) => {
                const { r, meta } = await call(client, "get_trends", {
                    days: 7,
                    end_date: DAY,
                });
                expect(meta.goal).toBe(25);
                const days = meta.days!;
                // Every day of the series the widget can toggle across, so
                // it can re-average 7/14/30 on its own.
                const series = (
                    r.structuredContent as { days: { date: string }[] }
                ).days.map((d) => d.date);
                expect(Object.keys(days).sort()).toEqual([...series].sort());
                expect(series).toHaveLength(30);
                expect(days[DAY]).toBe(35);
                expect(days["2026-07-25"]).toBeNull();
                expect(meta).not.toHaveProperty("meals");
                expect(r._meta).not.toHaveProperty(PERIOD_AVERAGES_META_KEY);
            });
        });

        test("get_trends: the empty series, and merged with period averages", async () => {
            await withHttpClient("u1", mode, async (client) => {
                const { r, meta } = await call(client, "get_trends", {
                    end_date: DAY,
                    group_by: "month",
                });
                expect(meta.goal).toBeNull();
                expect(Object.values(meta.days!)).toHaveLength(30);
                expect(Object.values(meta.days!).every((v) => v === null)).toBe(
                    true,
                );
                expect(r._meta?.[PERIOD_AVERAGES_META_KEY]).toBeDefined();
            });
        });
    });

    test("added sugar never changes which rows the summary keeps", () => {
        // Eight meals lead every row metric; a ninth is last on all of them
        // but first on added sugar. Ranking by added sugar would add it to
        // structuredContent.meals for every host, _meta or not, so it stays
        // out: the added-sugar list draws from the kept rows only.
        const meals = [
            meal({
                id: "x0",
                description: "sweet",
                calories: 1,
                protein_g: 0.1,
                carbs_g: 0.1,
                fat_g: 0.1,
                fiber_g: 0.1,
                sugar_g: 40,
                added_sugar_g: 40,
                alcohol_g: 0,
            }),
            ...Array.from({ length: 8 }, (_, i) =>
                meal({
                    id: `x${i + 1}`,
                    description: `big ${i}`,
                    sugar_g: 50 + i,
                    added_sugar_g: 0,
                    caffeine_mg: 80,
                }),
            ),
        ];
        const rows = mealBreakdown(meals, "UTC", "us");
        const top = topMealBreakdown(rows, "us");
        expect(top.kept).not.toContain(0);
        expect(top.kept).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        expect(top.meals).toEqual(top.kept.map((i) => rows[i]!));
        expect(() => MEAL_CONTRIBUTORS.parse(top.contributors)).not.toThrow();
    });

    // Each widget repeats the key as a literal (it cannot import), so a
    // rename on one side would silently drop the cell.
    test.each(["nutrition-summary", "goal-progress", "meal-logged", "trends"])(
        "the assembled %s widget reads the key",
        async (key) => {
            expect(await getWidgetHtml(key)).toContain(ADDED_SUGAR_META_KEY);
        },
    );
});

// ---------- ingredients and saved meals ----------

function savedMealId(n: number): string {
    return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

const SAVED_ID = savedMealId(0xa1);
const OTHER_SAVED_ID = savedMealId(0xa2);

/** One validated ingredient: the four required nutrients, the rest unset. */
function ingredient(
    position: number,
    name: string,
    over: Partial<MealItemValues> = {},
): MealItemValues {
    return {
        position,
        name,
        amount: null,
        unit: null,
        calories: 100,
        protein_g: 5,
        carbs_g: 10,
        fat_g: 3,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        ...over,
    };
}

/** A saved meal as the store returns it: one serving, with its ingredients. */
function savedMealRow(
    over: Partial<SavedMealWithItems> = {},
): SavedMealWithItems {
    return {
        id: SAVED_ID,
        user_id: "u1",
        name: "Oatmeal bowl",
        description: "Oatmeal with banana",
        meal_type: "breakfast",
        calories: 300,
        protein_g: 12,
        carbs_g: 60,
        fat_g: 6,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        created_at: "2026-10-01T00:00:00.000Z",
        updated_at: "2026-10-01T00:00:00.000Z",
        items: [],
        ...over,
    };
}

/** Runs `run` with the added-sugar requirement on or off, restoring the env. */
async function withAddedSugarGate(on: boolean, run: () => Promise<void>) {
    const previous = process.env[ADDED_SUGAR_REQUIRED_FROM_ENV];
    if (on) process.env[ADDED_SUGAR_REQUIRED_FROM_ENV] = "2000-01-01T00:00:00Z";
    else delete process.env[ADDED_SUGAR_REQUIRED_FROM_ENV];
    try {
        await run();
    } finally {
        if (previous === undefined)
            delete process.env[ADDED_SUGAR_REQUIRED_FROM_ENV];
        else process.env[ADDED_SUGAR_REQUIRED_FROM_ENV] = previous;
    }
}

const BURGER_ITEMS = [
    {
        name: "Булка",
        amount: 1,
        unit: "pcs",
        calories: 150,
        protein_g: 5,
        carbs_g: 28,
        fat_g: 2,
        fiber_g: 1,
        sugar_g: 4,
        added_sugar_g: 1,
    },
    {
        name: "Котлета",
        amount: 120,
        unit: "g",
        calories: 300.5,
        protein_g: 25,
        carbs_g: 0,
        fat_g: 22,
        fiber_g: 0,
        sugar_g: 0,
        added_sugar_g: 0,
    },
];

describe("log_meal with items", () => {
    test("sums the items into the meal totals and stores the items", async () => {
        await withTools(null, async (call) => {
            const r = await call("log_meal", {
                description: "Burger",
                meal_type: "lunch",
                items: BURGER_ITEMS,
            });
            expect(r.isError).toBeFalsy();
            const row = db.inserted[0]!;
            expect(row.calories).toBeCloseTo(450.5);
            expect(row.protein_g).toBe(30);
            expect(row.fiber_g).toBe(1);
            const stored = row.items as MealItemValues[];
            expect(stored.map((i) => i.position)).toEqual([1, 2]);
            expect(stored[1]!.amount).toBe(120);
            expect(textOf(r)).toContain("Items:");
            expect(textOf(r)).toContain("2. Котлета — 120 g");
        });
    });

    test("refuses totals sent beside items", async () => {
        await withTools(null, async (call) => {
            const r = await call("log_meal", {
                description: "Burger",
                meal_type: "lunch",
                calories: 500,
                items: BURGER_ITEMS,
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("not both");
            expect(db.inserted).toHaveLength(0);
        });
    });

    test("names the item that lacks a required nutrient", async () => {
        await withTools(null, async (call) => {
            const r = await call("log_meal", {
                description: "Burger",
                meal_type: "lunch",
                items: [
                    BURGER_ITEMS[0],
                    { name: "Соус", calories: 40, protein_g: 0, fat_g: 4 },
                ],
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain('item 2 ("Соус")');
            expect(textOf(r)).toContain("carbs_g");
            expect(db.inserted).toHaveLength(0);
        });
    });

    test("the added-sugar gate applies to each item", async () => {
        await withAddedSugarGate(true, async () => {
            await withTools(null, async (call) => {
                const r = await call("log_meal", {
                    description: "Burger",
                    meal_type: "lunch",
                    items: [{ ...BURGER_ITEMS[0], added_sugar_g: undefined }],
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain(addedSugarMissingText());
                expect(db.inserted).toHaveLength(0);
            });
        });
    });
});

describe("update_meal on a meal with items", () => {
    test("refuses a direct total change, and replaces the items when given", async () => {
        db.meals = [storedMeal({ id: MEAL_ID, calories: 100 })];
        db.mealItems.set(MEAL_ID, [ingredient(1, "Булка")]);
        await withTools(null, async (call) => {
            const refused = await call("update_meal", {
                id: MEAL_ID,
                calories: 500,
            });
            expect(refused.isError).toBe(true);
            expect(textOf(refused)).toContain("sum of its 1 item");
            expect(db.mealUpdates).toHaveLength(0);

            const described = await call("update_meal", {
                id: MEAL_ID,
                notes: "Burger, eaten at home",
            });
            expect(described.isError).toBeFalsy();

            const replaced = await call("update_meal", {
                id: MEAL_ID,
                items: BURGER_ITEMS,
            });
            expect(replaced.isError).toBeFalsy();
            const write = db.itemReplacements[0]!;
            expect(write.items).toHaveLength(2);
            expect(write.fields.calories).toBeCloseTo(450.5);
        });
    });
});

describe("save_meal", () => {
    test("saves a named meal from items and writes no meal entry", async () => {
        await withTools(null, async (call) => {
            const r = await call("save_meal", {
                name: "Burger",
                meal_type: "lunch",
                items: BURGER_ITEMS,
            });
            expect(r.isError).toBeFalsy();
            expect(db.savedMealWrites).toHaveLength(1);
            expect(db.savedMealWrites[0]!.input.calories).toBeCloseTo(450.5);
            expect(db.inserted).toHaveLength(0);
            expect(textOf(r)).toContain(`Saved meal "Burger" [saved meal id:`);
        });
    });

    test("refuses a name already in use and names the saved meal holding it", async () => {
        db.savedMeals = [savedMealRow()];
        await withTools(null, async (call) => {
            const r = await call("save_meal", {
                name: "oatmeal BOWL",
                calories: 400,
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain(
                `already have a saved meal named "oatmeal BOWL" [saved meal id: ${SAVED_ID}]`,
            );
        });
    });

    test("copies a logged meal, its ingredients included", async () => {
        db.meals = [
            storedMeal({ id: MEAL_ID, calories: 300, description: "Pasta" }),
        ];
        db.mealItems.set(MEAL_ID, [
            ingredient(1, "Паста", { amount: 100, unit: "g" }),
        ]);
        await withTools(null, async (call) => {
            const r = await call("save_meal", {
                name: "Pasta",
                from_meal_id: MEAL_ID,
            });
            expect(r.isError).toBeFalsy();
            const write = db.savedMealWrites[0]!;
            expect(write.input.calories).toBe(300);
            expect(write.items).toHaveLength(1);
            expect(write.input.description).toBe("Pasta");
        });
    });

    test("refuses items or totals sent with from_meal_id", async () => {
        db.meals = [storedMeal({ id: MEAL_ID })];
        await withTools(null, async (call) => {
            const r = await call("save_meal", {
                name: "Pasta",
                from_meal_id: MEAL_ID,
                calories: 5,
            });
            expect(r.isError).toBe(true);
            expect(db.savedMealWrites).toHaveLength(0);
        });
    });

    test("refuses a saved meal with neither items nor calories", async () => {
        await withTools(null, async (call) => {
            const none = await call("save_meal", { name: "Tea" });
            expect(none.isError).toBe(true);
            expect(textOf(none)).toContain("either items or its totals");
            const noCalories = await call("save_meal", {
                name: "Tea",
                protein_g: 1,
            });
            expect(noCalories.isError).toBe(true);
            expect(db.savedMealWrites).toHaveLength(0);
        });
    });
});

describe("get_saved_meals", () => {
    test("lists each saved meal with its items, and says when there are none", async () => {
        await withTools(null, async (call) => {
            const empty = await call("get_saved_meals");
            expect(textOf(empty)).toBe("No saved meals yet.");
        });
        db.savedMeals = [
            savedMealRow({
                items: [ingredient(1, "Вівсянка", { amount: 60, unit: "g" })],
            }),
        ];
        await withTools(null, async (call) => {
            const all = await call("get_saved_meals");
            expect(textOf(all)).toContain(
                `"Oatmeal bowl" [saved meal id: ${SAVED_ID}]`,
            );
            expect(textOf(all)).toContain("1. Вівсянка — 60 g");
            const none = await call("get_saved_meals", {
                name_contains: "pancake",
            });
            expect(textOf(none)).toBe('No saved meals matching "pancake".');
        });
    });
});

describe("log_saved_meal", () => {
    test("scales by servings, then applies item amounts and leave_out", async () => {
        db.savedMeals = [
            savedMealRow({
                calories: 300,
                items: [
                    ingredient(1, "Вівсянка", {
                        amount: 100,
                        unit: "g",
                        calories: 200,
                        protein_g: 10,
                        carbs_g: 30,
                        fat_g: 4,
                    }),
                    ingredient(2, "Банан", {
                        amount: 1,
                        unit: "pcs",
                        calories: 100,
                        protein_g: 2,
                        carbs_g: 30,
                        fat_g: 2,
                    }),
                ],
            }),
        ];
        await withTools(null, async (call) => {
            const r = await call("log_saved_meal", {
                saved_meal: "oatmeal bowl",
                servings: 2,
                item_amounts: [{ item: "Вівсянка", amount: 50 }],
                leave_out: ["2"],
            });
            expect(r.isError).toBeFalsy();
            const row = db.inserted[0]!;
            // Two servings make 200 g at 400 kcal; item_amounts then sets the
            // oats to the 50 g actually eaten in this entry: 100 kcal, not
            // multiplied by servings again.
            expect(row.calories).toBe(100);
            expect(row.saved_meal_id).toBe(SAVED_ID);
            expect(row.description).toBe("Oatmeal with banana (2 servings)");
            expect(row.meal_type).toBe("breakfast");
            const stored = row.items as MealItemValues[];
            expect(stored).toHaveLength(1);
            expect(stored[0]!.amount).toBe(50);
            expect(textOf(r)).toContain(`From saved meal "Oatmeal bowl".`);
        });
    });

    test("names the saved meals when the name matches none", async () => {
        db.savedMeals = [savedMealRow()];
        await withTools(null, async (call) => {
            const r = await call("log_saved_meal", { saved_meal: "Pancakes" });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain(
                'No saved meal found named "Pancakes".',
            );
            expect(textOf(r)).toContain('"Oatmeal bowl"');
        });
    });

    test("needs a meal type when the saved meal has no default", async () => {
        db.savedMeals = [savedMealRow({ meal_type: null })];
        await withTools(null, async (call) => {
            const r = await call("log_saved_meal", {
                saved_meal: "Oatmeal bowl",
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("no default meal type");
            expect(db.inserted).toHaveLength(0);
        });
    });

    test("refuses item changes on a saved meal without items", async () => {
        db.savedMeals = [savedMealRow()];
        await withTools(null, async (call) => {
            const r = await call("log_saved_meal", {
                saved_meal: SAVED_ID,
                leave_out: ["1"],
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("has no items");
        });
    });
});

describe("update_saved_meal and delete_saved_meal", () => {
    test("refuses an empty change, a direct total on an itemized meal, a taken name and an unknown id", async () => {
        db.savedMeals = [
            savedMealRow({ items: [ingredient(1, "Вівсянка")] }),
            savedMealRow({ id: OTHER_SAVED_ID, name: "Pancakes" }),
        ];
        await withTools(null, async (call) => {
            const empty = await call("update_saved_meal", { id: SAVED_ID });
            expect(empty.isError).toBe(true);
            expect(textOf(empty)).toContain("Nothing to change");

            const totals = await call("update_saved_meal", {
                id: SAVED_ID,
                calories: 5,
            });
            expect(totals.isError).toBe(true);
            expect(textOf(totals)).toContain("sum of its 1 item");

            const taken = await call("update_saved_meal", {
                id: OTHER_SAVED_ID,
                name: "oatmeal bowl",
            });
            expect(taken.isError).toBe(true);
            expect(textOf(taken)).toContain(`[saved meal id: ${SAVED_ID}]`);

            const unknown = await call("update_saved_meal", {
                id: savedMealId(0xff),
                description: "x",
            });
            expect(unknown.isError).toBe(true);
            expect(textOf(unknown)).toContain("No saved meal found with id");
        });
    });

    test("deleting a saved meal leaves the meals logged from it as they were", async () => {
        db.savedMeals = [savedMealRow()];
        db.meals = [
            storedMeal({
                id: MEAL_ID,
                description: "Oatmeal with banana",
                saved_meal_id: SAVED_ID,
            }),
        ];
        await withTools(null, async (call) => {
            const r = await call("delete_saved_meal", { id: SAVED_ID });
            expect(textOf(r)).toBe(
                'Saved meal "Oatmeal bowl" deleted. Meals already logged from it keep their values.',
            );
            expect(db.savedMeals).toHaveLength(0);
            expect(db.meals[0]!.description).toBe("Oatmeal with banana");
            expect(db.meals[0]!.saved_meal_id).toBeNull();
        });
    });
});

describe("saved meals and ingredients in reads", () => {
    test("search_meals lists the saved meals that match", async () => {
        db.savedMeals = [savedMealRow({ items: [ingredient(1, "Вівсянка")] })];
        await withTools(null, async (call) => {
            const r = await call("search_meals", { queries: ["oatmeal"] });
            expect(textOf(r)).toContain("No past meals matching");
            expect(textOf(r)).toContain("Saved meals matching: 1 found.");
            expect(textOf(r)).toContain(`[saved meal id: ${SAVED_ID}]`);
        });
    });

    test("get_meals_today shows an ingredient count, and the list in full detail", async () => {
        db.meals = [storedMeal({ id: MEAL_ID, description: "Burger" })];
        db.mealItems.set(MEAL_ID, [
            ingredient(1, "Булка"),
            ingredient(2, "Котлета"),
        ]);
        await withTools(null, async (call) => {
            const compact = await call("get_meals_today");
            expect(textOf(compact)).toContain("2 items");
            const full = await call("get_meals_today", { detail: "full" });
            expect(textOf(full)).toContain("Items:");
            expect(textOf(full)).toContain("2. Котлета");
        });
    });
});

describe("saved meals: review fixes", () => {
    test("the name-taken refusal describes update_saved_meal and keeps the name out of the log", async () => {
        db.savedMeals = [savedMealRow({ name: "Grated carrot salad" })];
        const warn = spyOn(console, "warn").mockImplementation(() => {});
        const log = spyOn(console, "log").mockImplementation(() => {});
        try {
            await withTools(null, async (call) => {
                const r = await call("save_meal", {
                    name: "grated carrot SALAD",
                    calories: 120,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toBe(
                    `You already have a saved meal named "grated carrot SALAD" [saved meal id: ${SAVED_ID}]. update_saved_meal changes it; a different name saves another one.`,
                );
            });
            const logged = [...warn.mock.calls, ...log.mock.calls]
                .flat()
                .map(String)
                .join("\n");
            expect(logged).toContain("save_meal");
            // Filed under its own category, not rate_limited by "Grated".
            expect(logged).toContain("meal_items_invalid");
            expect(logged.toLowerCase()).not.toContain("carrot");
        } finally {
            warn.mockRestore();
            log.mockRestore();
        }
    });

    test("a saved-meal name that matches none never reaches the runtime log", async () => {
        db.savedMeals = [
            savedMealRow({ name: "Insulin-day oats" }),
            savedMealRow({ id: OTHER_SAVED_ID, name: "Mom's borscht" }),
        ];
        const warn = spyOn(console, "warn").mockImplementation(() => {});
        const log = spyOn(console, "log").mockImplementation(() => {});
        try {
            await withTools(null, async (call) => {
                const r = await call("log_saved_meal", {
                    saved_meal: "borsch",
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain('"Mom\'s borscht"');
            });
            const logged = [...warn.mock.calls, ...log.mock.calls]
                .flat()
                .map(String)
                .join("\n");
            expect(logged).toContain("record_not_found");
            expect(logged).not.toContain("borsch");
            expect(logged).not.toContain("Insulin");
        } finally {
            warn.mockRestore();
            log.mockRestore();
        }
    });

    test("an escaped saved-meal name resolves to the stored one", async () => {
        db.savedMeals = [savedMealRow({ name: "Сніданок" })];
        await withTools(null, async (call) => {
            const r = await call("log_saved_meal", {
                saved_meal:
                    "\\u0421\\u043d\\u0456\\u0434\\u0430\\u043d\\u043e\\u043a",
            });
            expect(r.isError).toBeFalsy();
            expect(db.inserted[0]!.saved_meal_id).toBe(SAVED_ID);
        });
    });

    test("log_saved_meal refuses totals past what a single meal holds, before writing", async () => {
        db.savedMeals = [
            savedMealRow({ calories: 15_000 }),
            savedMealRow({
                id: OTHER_SAVED_ID,
                name: "Feast",
                items: [ingredient(1, "Торт", { calories: 12_000 })],
            }),
        ];
        await withTools(null, async (call) => {
            const totalsOnly = await call("log_saved_meal", {
                saved_meal: SAVED_ID,
                servings: 2,
            });
            expect(totalsOnly.isError).toBe(true);
            expect(textOf(totalsOnly)).toContain("calories 30000");
            const itemized = await call("log_saved_meal", {
                saved_meal: "Feast",
                servings: 2,
            });
            expect(itemized.isError).toBe(true);
            expect(textOf(itemized)).toContain("calories 24000");
            expect(db.inserted).toHaveLength(0);
        });
    });

    test("a saved meal without items scales its totals by servings", async () => {
        db.savedMeals = [savedMealRow({ calories: 301, protein_g: 12.5 })];
        await withTools(null, async (call) => {
            const r = await call("log_saved_meal", {
                saved_meal: SAVED_ID,
                servings: 0.5,
            });
            expect(r.isError).toBeFalsy();
            const row = db.inserted[0]!;
            expect(row.calories).toBeCloseTo(150.5);
            expect(row.protein_g).toBeCloseTo(6.25);
            expect(row.description).toBe("Oatmeal with banana (0.5 servings)");
            expect(row.items).toBeUndefined();
        });
    });

    test("save_meal bounds the description, and from_meal_id refuses an over-long copied one", async () => {
        db.meals = [
            storedMeal({
                id: MEAL_ID,
                calories: 300,
                description: "x".repeat(2500),
            }),
        ];
        await withTools(null, async (call) => {
            const empty = await call("save_meal", {
                name: "Tea",
                calories: 2,
                description: "   ",
            });
            expect(empty.isError).toBe(true);
            expect(textOf(empty)).toContain("1 to 2000 characters");

            const long = await call("save_meal", {
                name: "Tea",
                calories: 2,
                description: "y".repeat(2001),
            });
            expect(long.isError).toBe(true);
            expect(textOf(long)).toContain("has 2001");

            const copied = await call("save_meal", {
                name: "Big dinner",
                from_meal_id: MEAL_ID,
            });
            expect(copied.isError).toBe(true);
            expect(textOf(copied)).toContain("2500 characters");
            expect(db.savedMealWrites).toHaveLength(0);

            const replaced = await call("save_meal", {
                name: "Big dinner",
                from_meal_id: MEAL_ID,
                description: "  Big dinner, short  ",
            });
            expect(replaced.isError).toBeFalsy();
            expect(db.savedMealWrites[0]!.input.description).toBe(
                "Big dinner, short",
            );
        });
    });

    test("save_meal refuses past the saved-meal cap and an unknown from_meal_id", async () => {
        await withTools(null, async (call) => {
            const unknown = await call("save_meal", {
                name: "Pasta",
                from_meal_id: savedMealId(0xfe),
            });
            expect(unknown.isError).toBe(true);
            expect(textOf(unknown)).toContain("No meal found with id");
        });
        db.savedMeals = Array.from({ length: 200 }, (_, i) =>
            savedMealRow({ id: savedMealId(0x1000 + i), name: `Meal ${i}` }),
        );
        await withTools(null, async (call) => {
            const r = await call("save_meal", {
                name: "One more",
                calories: 5,
            });
            expect(r.isError).toBe(true);
            expect(textOf(r)).toContain("already holds 200 saved meals");
            expect(db.savedMealWrites).toHaveLength(0);
        });
    });

    test("save_meal keeps every nutrient and shows added sugar on the sugar figure", async () => {
        await withTools(null, async (call) => {
            const r = await call("save_meal", {
                name: "Cola",
                calories: 140,
                protein_g: 0,
                carbs_g: 35,
                fat_g: 0,
                sugar_g: 35,
                added_sugar_g: 35,
                caffeine_mg: 34,
            });
            expect(r.isError).toBeFalsy();
            expect(textOf(r)).toContain("sugar 35 g (35 added)");
            expect(textOf(r)).not.toContain("added sugar 35 g");
            expect(textOf(r)).toContain("caffeine");
        });
    });

    test("update_saved_meal renames, replaces items with summed totals, and updates totals alone", async () => {
        db.savedMeals = [
            savedMealRow({
                calories: 300,
                fiber_g: 4,
                alcohol_g: 10,
                items: [ingredient(1, "Вівсянка", { alcohol_g: 10 })],
            }),
            savedMealRow({
                id: OTHER_SAVED_ID,
                name: "Tea",
                calories: 2,
                fiber_g: 0,
                sugar_g: 10,
                added_sugar_g: 5,
            }),
        ];
        await withTools(null, async (call) => {
            const renamed = await call("update_saved_meal", {
                id: SAVED_ID,
                name: "Porridge",
                description: "\\u041a\\u0430\\u0448\\u0430",
            });
            expect(renamed.isError).toBeFalsy();
            expect(textOf(renamed)).toContain(
                'Saved meal "Porridge" updated. Meals already logged from it keep their values.',
            );
            expect(db.savedMealUpdates[0]!.fields).toEqual({
                name: "Porridge",
                description: "Каша",
            });
            expect(db.savedMealUpdates[0]!.items).toBeNull();

            const replaced = await call("update_saved_meal", {
                id: SAVED_ID,
                items: BURGER_ITEMS,
            });
            expect(replaced.isError).toBeFalsy();
            const write = db.savedMealUpdates[1]!;
            expect(write.items).toHaveLength(2);
            expect(write.fields.calories).toBeCloseTo(450.5);
            expect(write.fields.fiber_g).toBe(1);
            // No item carries alcohol any more: the stale total is cleared.
            expect(write.fields.alcohol_g).toBeNull();
            expect(db.savedMeals[0]!.alcohol_g).toBeNull();

            const totals = await call("update_saved_meal", {
                id: OTHER_SAVED_ID,
                calories: 4,
            });
            expect(totals.isError).toBeFalsy();
            expect(db.savedMealUpdates[2]!.fields).toEqual({ calories: 4 });
            const tea = db.savedMeals.find((s) => s.id === OTHER_SAVED_ID)!;
            expect(tea.calories).toBe(4);
            expect(tea.sugar_g).toBe(10);
            expect(tea.added_sugar_g).toBe(5);
            expect(tea.fiber_g).toBe(0);

            const emptyDescription = await call("update_saved_meal", {
                id: OTHER_SAVED_ID,
                description: "",
            });
            expect(emptyDescription.isError).toBe(true);
            expect(textOf(emptyDescription)).toContain("1 to 2000 characters");
            expect(db.savedMealUpdates).toHaveLength(3);
        });
    });

    test("update_saved_meal checks the sugar pair against the stored partner and names the saved meal under the gate", async () => {
        db.savedMeals = [
            savedMealRow({ sugar_g: 10, added_sugar_g: null }),
            savedMealRow({ id: OTHER_SAVED_ID, name: "Tea", sugar_g: 10 }),
        ];
        await withTools(null, async (call) => {
            const over = await call("update_saved_meal", {
                id: SAVED_ID,
                added_sugar_g: 30,
            });
            expect(over.isError).toBe(true);
            expect(db.savedMealUpdates).toHaveLength(0);
        });
        await withAddedSugarGate(true, async () => {
            await withTools(null, async (call) => {
                const r = await call("update_saved_meal", {
                    id: OTHER_SAVED_ID,
                    sugar_g: 12,
                });
                expect(r.isError).toBe(true);
                expect(textOf(r)).toContain(
                    `Not saved, saved meal ${OTHER_SAVED_ID} is unchanged`,
                );
                expect(textOf(r)).toContain(
                    "the saved meal has no added sugar recorded",
                );
                expect(textOf(r)).not.toMatch(/Not saved, meal /);
                expect(db.savedMealUpdates).toHaveLength(0);
            });
        });
    });

    test("the missing-nutrient note on an itemized meal points at items, not a totals field", async () => {
        await withTools(null, async (call) => {
            const r = await call("log_meal", {
                description: "Rice",
                meal_type: "lunch",
                items: [
                    {
                        name: "Rice",
                        calories: 200,
                        protein_g: 4,
                        carbs_g: 44,
                        fat_g: 0,
                    },
                ],
            });
            expect(r.isError).toBeFalsy();
            const text = textOf(r);
            expect(text).toContain("Not recorded on this meal: fiber_g");
            expect(text).toContain("sum of its 1 item, so update_meal adds");
            expect(text).toContain("with the value on each item");
            expect(text).not.toContain("update_meal can add the value");
        });
    });

    test("missingNutrientNote names the items path only for an itemized meal", () => {
        const meal = storedMeal({ id: MEAL_ID, calories: 100 });
        expect(missingNutrientNote(meal)).toContain(
            `update_meal can add the value to id ${MEAL_ID}`,
        );
        const itemized = missingNutrientNote(meal, 3);
        expect(itemized).toContain("sum of its 3 items");
        expect(itemized).not.toContain("update_meal can add the value");
    });
});
