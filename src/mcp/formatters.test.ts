import { describe, expect, test } from "bun:test";
import { formatFoodResult, type FoodResult } from "../foods.js";
import { buildDailyBuckets, computeTrends } from "../insights.js";
import {
    alcoholHiddenNote,
    formatGoalLine,
    formatGoals,
    formatMeal,
    formatProgress,
    goalsPayloadOf,
    hasActiveTarget,
    healthSyncProfileLine,
    loggedDayAverageNote,
    mealBreakdown,
    missingNutrientNote,
    nutrientPresence,
    rangeAverages,
    sumMeals,
    totalsPayloadOf,
} from "../mcp.js";
import type { Meal, NutritionGoals, WaterEntry } from "../supabase.js";
import { goals, meal, MEAL_ID } from "./test-harness.js";

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
