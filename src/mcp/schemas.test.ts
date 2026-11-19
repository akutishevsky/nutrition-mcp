import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { type DailyBucket } from "../insights.js";
import {
    emptyMealContributors,
    GOALS_ITEM,
    goalsPayloadOf,
    MEAL_BREAKDOWN_ITEM,
    MEAL_CONTRIBUTORS,
    mealBreakdown,
    nutrientPresence,
    START_IMPORT_OUTPUT_SCHEMA,
    startImportPayload,
    sumMeals,
    topMealBreakdown,
    TOTALS_ITEM,
    totalsPayloadOf,
    TRENDS_DAY_ITEM,
    trendsDayPayloadOf,
} from "../mcp.js";
import type { Meal } from "../supabase.js";
import { goals, meal } from "./test-harness.js";

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
        saturated_fat_g: 0,
        trans_fat_g: 0,
        fiber_g: mealsForDay.reduce((s, m) => s + (m.fiber_g ?? 0), 0),
        sugar_g: mealsForDay.reduce((s, m) => s + (m.sugar_g ?? 0), 0),
        added_sugar_g: mealsForDay.reduce(
            (s, m) => s + (m.added_sugar_g ?? 0),
            0,
        ),
        alcohol_g: mealsForDay.reduce((s, m) => s + (m.alcohol_g ?? 0), 0),
        caffeine_mg: mealsForDay.reduce((s, m) => s + (m.caffeine_mg ?? 0), 0),
        sodium_mg: mealsForDay.reduce((s, m) => s + (m.sodium_mg ?? 0), 0),
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
