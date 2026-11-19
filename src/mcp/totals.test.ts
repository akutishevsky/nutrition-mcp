import { describe, expect, test } from "bun:test";
import {
    buildDailyBuckets,
    computeTrends,
    computeWeeklyDigest,
    type DailyBucket,
} from "../insights.js";
import {
    formatProgress,
    gateAlcohol,
    loggedDayAverageNote,
    MAX_CAFFEINE_MG,
    mealBreakdown,
    nutrientPresence,
    rangeAverages,
    sumMeals,
    totalsPayloadOf,
} from "../mcp.js";
import { buildPeriodRows, dayTotalsFromMeals } from "../periods.js";
import type { Meal } from "../supabase.js";
import { goals, meal } from "./test-harness.js";

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
            saturated_fat_g: false,
            trans_fat_g: false,
            fiber_g: true,
            sugar_g: false,
            added_sugar_g: false,
            alcohol_g: false,
            caffeine_mg: false,
            sodium_mg: false,
        });
    });

    test("an explicit zero is data — only null is absence", () => {
        expect(nutrientPresence([meal({ ...blank, fiber_g: 0 })])).toEqual({
            saturated_fat_g: false,
            trans_fat_g: false,
            fiber_g: true,
            sugar_g: false,
            added_sugar_g: false,
            alcohol_g: false,
            caffeine_mg: false,
            sodium_mg: false,
        });
        expect(nutrientPresence([])).toEqual({
            saturated_fat_g: false,
            trans_fat_g: false,
            fiber_g: false,
            sugar_g: false,
            added_sugar_g: false,
            alcohol_g: false,
            caffeine_mg: false,
            sodium_mg: false,
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
            saturated_fat_g: false,
            trans_fat_g: false,
            fiber_g: false,
            sugar_g: false,
            added_sugar_g: false,
            alcohol_g: false,
            caffeine_mg: true,
            sodium_mg: false,
        });
        expect(
            nutrientPresence([meal({ ...blank, caffeine_mg: 0 })]).caffeine_mg,
        ).toBe(true);
    });
});

describe("rangeAverages", () => {
    test("the averages carry no trans fat: nothing reads one, so none is zero-filled", () => {
        const { averages } = rangeAverages([]);
        expect(averages).not.toHaveProperty("trans_fat_g");
    });

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
        saturated_fat_g: 0,
        trans_fat_g: 0,
        fiber_g: 6,
        sugar_g: 12,
        added_sugar_g: 0,
        alcohol_g: 14,
        caffeine_mg: 95,
        sodium_mg: 0,
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
