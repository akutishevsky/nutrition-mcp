import { describe, expect, test } from "bun:test";
import type { DailyBucket } from "./insights.js";
import type { Meal, NutritionGoals, WeightEntry } from "./storage.js";
import {
    buildTrendsCard,
    buildTrendsDays,
    coveredAverage,
    describeTrendsLayout,
    ewmaSeries,
    isTrendsCardRef,
    largestRemainderShares,
    normalizeTrendsLayout,
    plotMaxFor,
    rankDayContributors,
    rankPeriodContributors,
    rollingAverage,
    slopePerWeek,
    trendsCatalogData,
    DEFAULT_TRENDS_LAYOUT,
    type TrendsCardContext,
    type TrendsCardRef,
    type TrendsDay,
    type TrendsMealInput,
} from "./trends.js";

// ------------------------------------------------------------ fixtures

function meal(partial: Partial<Meal>): Meal {
    return {
        id: "m",
        user_id: "u1",
        logged_at: "2026-11-03T12:00:00Z",
        meal_type: "lunch",
        description: "Meal",
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: null,
        sugar_g: null,
        alcohol_g: null,
        notes: null,
        idempotency_key: null,
        ...partial,
    };
}

function bucket(
    date: string,
    values: Partial<{
        calories: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
        fiber_g: number;
        sugar_g: number;
        alcohol_g: number;
        waterMl: number;
    }> = {},
    meals: Meal[] = [],
): DailyBucket {
    return {
        date,
        meals,
        waterMl: values.waterMl ?? 0,
        calories: values.calories ?? 0,
        protein_g: values.protein_g ?? 0,
        carbs_g: values.carbs_g ?? 0,
        fat_g: values.fat_g ?? 0,
        fiber_g: values.fiber_g ?? 0,
        sugar_g: values.sugar_g ?? 0,
        alcohol_g: values.alcohol_g ?? 0,
        mealTypes: new Set(meals.map((m) => m.meal_type ?? "")),
    };
}

function goals(partial: Partial<NutritionGoals>): NutritionGoals {
    return {
        user_id: "u1",
        daily_calories: null,
        daily_protein_g: null,
        daily_carbs_g: null,
        daily_fat_g: null,
        daily_fiber_g: null,
        daily_sugar_g: null,
        daily_alcohol_g: null,
        daily_water_ml: null,
        target_weight_g: null,
        updated_at: "2026-11-01T00:00:00Z",
        ...partial,
    };
}

function weightEntry(date: string, grams: number): WeightEntry {
    return {
        id: `w-${date}-${grams}`,
        user_id: "u1",
        weight_g: grams,
        logged_at: `${date}T08:00:00Z`,
        notes: null,
        created_at: `${date}T08:00:00Z`,
        idempotency_key: null,
    };
}

const DATES = [
    "2026-11-02",
    "2026-11-03",
    "2026-11-04",
    "2026-11-05",
    "2026-11-06",
    "2026-11-07",
    "2026-11-08",
];

function ctxFor(
    buckets: DailyBucket[],
    overrides: Partial<TrendsCardContext> = {},
): TrendsCardContext {
    const meals: TrendsMealInput[] = [];
    return {
        days: buildTrendsDays(buckets, meals, "UTC"),
        previousDays: buildTrendsDays([], [], "UTC"),
        buckets,
        previousBuckets: [],
        weightEntries: [],
        weightUnit: "lb",
        goals: null,
        rangeDays: buckets.length || 7,
        timezone: "UTC",
        alcoholTrackingEnabled: true,
        ...overrides,
    };
}

function card(
    ref: TrendsCardRef,
    buckets: DailyBucket[],
    overrides: Partial<TrendsCardContext> = {},
) {
    return buildTrendsCard(ref, ctxFor(buckets, overrides));
}

// ------------------------------------------------------------- catalog

describe("catalog guardrails (T4)", () => {
    test("the bar chart never offers weight; the trend line does", () => {
        expect(trendsCatalogData("bar").map((d) => d.key)).not.toContain(
            "weight",
        );
        expect(trendsCatalogData("line").map((d) => d.key)).toContain("weight");
    });

    test("every catalog data point is a valid card ref", () => {
        for (const shape of [
            "bar",
            "line",
            "consistency",
            "breakdown",
            "patterns",
        ] as const) {
            for (const point of trendsCatalogData(shape)) {
                expect(
                    isTrendsCardRef({
                        shape,
                        data: point.key,
                        size: point.defaultSize,
                    }),
                ).toBe(true);
            }
        }
    });

    test("the default dashboard is the brief's five cards plus nothing", () => {
        expect(DEFAULT_TRENDS_LAYOUT.cards).toEqual([
            { shape: "bar", data: "calories", size: "full" },
            { shape: "line", data: "weight", size: "full" },
            { shape: "bar", data: "protein_g", size: "full" },
            { shape: "consistency", data: "logging", size: "compact" },
            { shape: "bar", data: "water_ml", size: "compact" },
        ]);
    });
});

describe("layout normalization (T3/T9)", () => {
    test("garbage falls back to the default dashboard", () => {
        expect(normalizeTrendsLayout(null)).toEqual(DEFAULT_TRENDS_LAYOUT);
        expect(normalizeTrendsLayout("junk")).toEqual(DEFAULT_TRENDS_LAYOUT);
        expect(normalizeTrendsLayout({})).toEqual(DEFAULT_TRENDS_LAYOUT);
    });

    test("an explicitly empty dashboard is honored", () => {
        expect(normalizeTrendsLayout({ cards: [] }).cards).toEqual([]);
    });

    test("unknown cards drop, duplicates collapse, sizes survive", () => {
        const layout = normalizeTrendsLayout({
            cards: [
                { shape: "bar", data: "fiber_g", size: "compact" },
                { shape: "bar", data: "fiber_g", size: "full" },
                { shape: "bar", data: "weight", size: "full" },
                { shape: "pie", data: "calories", size: "full" },
                { shape: "line", data: "weight", size: "full" },
            ],
        });
        expect(layout.cards).toEqual([
            { shape: "bar", data: "fiber_g", size: "compact" },
            { shape: "line", data: "weight", size: "full" },
        ]);
    });

    test("describeTrendsLayout names the cards for the agent (T9)", () => {
        const text = describeTrendsLayout(DEFAULT_TRENDS_LAYOUT);
        expect(text).toContain("5 cards");
        expect(text).toContain("Protein (Bar chart, full)");
        expect(text).toContain("Weight (Trend line, full)");
    });
});

// ---------------------------------------------------------------- math

describe("math fixtures (acceptance 2)", () => {
    test("rolling average skips gaps instead of zero-filling them", () => {
        const series = [
            { date: "2026-11-01", value: 10 },
            { date: "2026-11-02", value: null },
            { date: "2026-11-03", value: 20 },
            { date: "2026-11-04", value: 30 },
        ];
        const out = rollingAverage(series, 3);
        expect(out[0]!.value).toBe(10);
        expect(out[1]!.value).toBe(10);
        expect(out[2]!.value).toBe(15);
        expect(out[3]!.value).toBe(25);
    });

    test("largest-remainder shares always sum to exactly 100", () => {
        expect(largestRemainderShares([1, 1, 1])).toEqual([34, 33, 33]);
        expect(
            largestRemainderShares([456, 940, 522, 13]).reduce(
                (a, b) => a + b,
                0,
            ),
        ).toBe(100);
        expect(largestRemainderShares([0, 0, 0])).toEqual([0, 0, 0]);
        expect(largestRemainderShares([10, 0, 0])).toEqual([100, 0, 0]);
    });

    test("slopePerWeek reads a steady loss as about -1.4 lb/week", () => {
        const points = Array.from({ length: 15 }, (_, i) => {
            const date = new Date(Date.UTC(2026, 9, 18 + i))
                .toISOString()
                .slice(0, 10);
            return { date, value: 180 - i * 0.2 };
        });
        expect(Math.abs(slopePerWeek(points) - -1.4)).toBeLessThan(0.05);
    });

    test("plot domain always contains data and reference, with headroom (T14)", () => {
        expect(plotMaxFor([100], 50)).toBeCloseTo(115);
        expect(plotMaxFor([10], 200)).toBeCloseTo(230);
        expect(plotMaxFor([120], 60)).toBeCloseTo(138);
        expect(plotMaxFor([], 0)).toBe(1);
    });

    test("an EWMA trend shrugs off a single outlier spike (T14)", () => {
        const points = [
            ...Array.from({ length: 5 }, (_, i) => ({
                date: `2026-11-0${i + 1}`,
                value: 180,
            })),
            { date: "2026-11-06", value: 210 },
            { date: "2026-11-07", value: 180 },
            { date: "2026-11-08", value: 180 },
        ];
        const trend = ewmaSeries(points);
        // The spike moves the trend by a quarter of the gap, then it
        // settles back — the raw spike (210) never becomes the trend.
        expect(trend[5]!.value).toBeCloseTo(187.5);
        expect(trend[trend.length - 1]!.value).toBeLessThan(185);
    });
});

describe("day-bucket extension: micros from items, coverage rule (T7)", () => {
    test("sodium aggregates from items; a day with no sodium item does not carry it", () => {
        const buckets = [
            bucket("2026-11-03", { calories: 500 }, [meal({ fiber_g: 12 })]),
            bucket("2026-11-04", { calories: 400 }, [meal({})]),
        ];
        const meals: TrendsMealInput[] = [
            {
                id: "m1",
                description: "Soup",
                mealType: "lunch",
                loggedAt: "2026-11-03T12:00:00Z",
                items: [
                    { name: "Soup", values: { sodium_mg: 900 } },
                    { name: "Bread", values: { sodium_mg: null } },
                ],
            },
            {
                id: "m2",
                description: "Salad",
                mealType: "lunch",
                loggedAt: "2026-11-04T12:00:00Z",
                items: [{ name: "Salad", values: { sodium_mg: null } }],
            },
        ];
        const days = buildTrendsDays(buckets, meals, "UTC");
        expect(days[0]!.values.sodium_mg).toBe(900);
        expect(days[1]!.values.sodium_mg).toBeNull();
        // Fiber follows dayCarries: the first day's meal records it, the
        // second day's does not (its bucket sum is a legacy 0).
        expect(days[0]!.values.fiber_g).toBe(0);
        expect(days[1]!.values.fiber_g).toBeNull();
    });

    test("coveredAverage runs partial nutrients over carrying days only", () => {
        const days: TrendsDay[] = [
            {
                date: "2026-11-01",
                hasLog: true,
                mealCount: 1,
                values: { fiber_g: 30 },
            },
            {
                date: "2026-11-02",
                hasLog: true,
                mealCount: 1,
                values: { fiber_g: null },
            },
            {
                date: "2026-11-03",
                hasLog: true,
                mealCount: 1,
                values: { fiber_g: 10 },
            },
        ];
        const result = coveredAverage(days, "fiber_g", true);
        expect(result.avg).toBe(20);
        expect(result.carriedDays).toBe(2);
    });
});

// ------------------------------------------------------- hostile cards

describe("bar cards under hostile data (T14)", () => {
    const fatRef: TrendsCardRef = { shape: "bar", data: "fat_g", size: "full" };

    test("a day at 2x the limit renders in full and the verdict counts it as over", () => {
        const buckets = DATES.map((date, i) =>
            bucket(
                date,
                {
                    fat_g: [40, 55, 120, 50, 45, 58, 52][i],
                    calories: 2000,
                },
                [meal({})],
            ),
        );
        const payload = card(fatRef, buckets, {
            goals: goals({ daily_fat_g: 60 }),
        });
        expect(payload.empty).toBeNull();
        const chart = payload.chart as {
            days: { value: number | null }[];
            reference: { value: number; label: string } | null;
        };
        expect(chart.days[2]!.value).toBe(120);
        expect(chart.reference?.label).toBe("limit 60 g");
        expect(payload.verdict?.strong).toBe("under it 6 of 7 days");
        // Domain contains the spike with headroom — never clipped.
        expect(plotMaxFor([40, 55, 120, 50, 45, 58, 52], 60)).toBeGreaterThan(
            120,
        );
    });

    test("a zero-intake day beside normal days is a real bar, not an empty state", () => {
        const buckets = DATES.map((date, i) =>
            bucket(date, { protein_g: [100, 0, 120, 110, 90, 130, 105][i] }, [
                meal({}),
            ]),
        );
        const payload = card(
            { shape: "bar", data: "protein_g", size: "full" },
            buckets,
            { goals: goals({ daily_protein_g: 120 }) },
        );
        expect(payload.empty).toBeNull();
        const chart = payload.chart as { days: { value: number | null }[] };
        expect(chart.days[1]!.value).toBe(0);
    });

    test("an all-zero range is an empty state, never a chart of nothing", () => {
        const buckets = DATES.map((date) => bucket(date));
        const payload = card(
            { shape: "bar", data: "protein_g", size: "full" },
            buckets,
        );
        expect(payload.empty).not.toBeNull();
        expect(payload.chart).toBeNull();
    });

    test("a single logged day still renders", () => {
        const buckets = DATES.map((date, i) =>
            i === 3
                ? bucket(date, { protein_g: 95 }, [meal({})])
                : bucket(date),
        );
        const payload = card(
            { shape: "bar", data: "protein_g", size: "full" },
            buckets,
        );
        expect(payload.empty).toBeNull();
        expect(payload.headline?.value).toBe("95");
    });

    test("sodium at 8,000 mg judges against the labeled FDA limit", () => {
        const buckets = DATES.map((date) =>
            bucket(date, { calories: 2000 }, [meal({})]),
        );
        const days = buildTrendsDays(
            buckets,
            DATES.map((date) => ({
                id: `m-${date}`,
                description: "Feast",
                mealType: "dinner",
                loggedAt: `${date}T19:00:00Z`,
                items: [{ name: "Feast", values: { sodium_mg: 8000 } }],
            })),
            "UTC",
        );
        const payload = buildTrendsCard(
            { shape: "bar", data: "sodium_mg", size: "full" },
            ctxFor(buckets, { days }),
        );
        expect(payload.empty).toBeNull();
        expect(payload.headline?.value).toBe("8000");
        expect(payload.verdict?.lead).toContain("FDA daily limit");
        expect(payload.verdict?.strong).toBe("under it 0 of 7 days");
    });

    test("water at 0 and at 6 L both render; an all-zero water range is empty", () => {
        const mixed = DATES.map((date, i) =>
            bucket(date, { waterMl: i === 2 ? 6000 : 0 }, [meal({})]),
        );
        const payload = card(
            { shape: "bar", data: "water_ml", size: "compact" },
            mixed,
        );
        expect(payload.empty).toBeNull();
        const chart = payload.chart as { days: { value: number | null }[] };
        expect(chart.days[2]!.value).toBe(6000);
        expect(chart.days[0]!.value).toBe(0);

        const dry = DATES.map((date) => bucket(date, {}, [meal({})]));
        expect(
            card({ shape: "bar", data: "water_ml", size: "compact" }, dry)
                .empty,
        ).not.toBeNull();
    });

    test("an alcohol-heavy day renders only when tracking is on", () => {
        const buckets = DATES.map((date, i) =>
            bucket(date, { alcohol_g: i === 4 ? 56 : 0, calories: 2000 }, [
                meal({ alcohol_g: i === 4 ? 56 : 0 }),
            ]),
        );
        const on = card(
            { shape: "bar", data: "alcohol_g", size: "full" },
            buckets,
            { alcoholTrackingEnabled: true },
        );
        expect(on.empty).toBeNull();
        const off = card(
            { shape: "bar", data: "alcohol_g", size: "full" },
            buckets,
            { alcoholTrackingEnabled: false },
        );
        expect(off.empty?.message).toContain("Alcohol tracking is off");
    });

    test("fiber coverage below 90% is stated on the card (T7)", () => {
        const buckets = DATES.map((date, i) =>
            bucket(date, { calories: 2000, fiber_g: i < 2 ? 25 : 0 }, [
                meal({ fiber_g: i < 2 ? 25 : null }),
            ]),
        );
        const payload = card(
            { shape: "bar", data: "fiber_g", size: "full" },
            buckets,
        );
        expect(payload.coverage).toEqual({ carriedDays: 2, totalDays: 7 });
    });
});

describe("weight card (T5/T10/T14)", () => {
    test("an outlier spike does not become the headline", () => {
        const entries = [
            weightEntry("2026-11-02", 81_649), // 180 lb
            weightEntry("2026-11-03", 81_649),
            weightEntry("2026-11-04", 81_649),
            weightEntry("2026-11-05", 95_254), // 210 lb spike
            weightEntry("2026-11-06", 81_193), // 179 lb
            weightEntry("2026-11-07", 81_193),
            weightEntry("2026-11-08", 81_193),
        ];
        const payload = buildTrendsCard(
            { shape: "line", data: "weight", size: "full" },
            ctxFor([], { weightEntries: entries, rangeDays: 7 }),
        );
        expect(payload.empty).toBeNull();
        const headline = Number(payload.headline?.value);
        expect(headline).toBeGreaterThan(178);
        expect(headline).toBeLessThan(186);
    });

    test("fewer than three weigh-in days is an honest empty state", () => {
        const payload = buildTrendsCard(
            { shape: "line", data: "weight", size: "full" },
            ctxFor([], {
                weightEntries: [
                    weightEntry("2026-11-07", 81_649),
                    weightEntry("2026-11-08", 81_193),
                ],
            }),
        );
        expect(payload.empty?.message).toContain("3 or more days");
    });
});

describe("breakdown cards (T5/T14)", () => {
    test("macro shares sum to 100 in the donut and in every weekly column", () => {
        const buckets = DATES.map((date) =>
            bucket(
                date,
                {
                    calories: 1931,
                    protein_g: 114,
                    carbs_g: 235,
                    fat_g: 58,
                    alcohol_g: 13,
                },
                [meal({ alcohol_g: 13 })],
            ),
        );
        const payload = card(
            { shape: "breakdown", data: "macro_split", size: "full" },
            buckets,
        );
        const chart = payload.chart as {
            segments: { share: number }[];
            columns: { shares: Record<string, number> }[];
        };
        expect(chart.segments.reduce((sum, s) => sum + s.share, 0)).toBe(100);
        for (const column of chart.columns) {
            expect(
                Object.values(column.shares).reduce((a, b) => a + b, 0),
            ).toBe(100);
        }
    });

    test("meal-type split shares sum to 100 and name the leader", () => {
        const buckets = DATES.map((date) => {
            const lunch = meal({ meal_type: "lunch", calories: 900 });
            const dinner = meal({ meal_type: "dinner", calories: 700 });
            return bucket(date, { calories: 1600 }, [lunch, dinner]);
        });
        const payload = card(
            { shape: "breakdown", data: "meal_type_split", size: "full" },
            buckets,
        );
        const chart = payload.chart as {
            segments: { share: number; label: string }[];
        };
        expect(chart.segments.reduce((sum, s) => sum + s.share, 0)).toBe(100);
        expect(payload.verdict?.strong).toContain("Lunch carries");
    });
});

describe("patterns + consistency cards", () => {
    test("weekday card calls out the weekend delta and keeps recent dates per weekday", () => {
        // 2026-11-02 is a Monday; 07/08 are Sat/Sun.
        const buckets = DATES.map((date, i) =>
            bucket(
                date,
                { calories: [1800, 1900, 2000, 2100, 2200, 2600, 2500][i] },
                [meal({})],
            ),
        );
        const payload = card(
            { shape: "patterns", data: "weekday", size: "full" },
            buckets,
        );
        expect(payload.verdict?.strong).toContain("Weekends run +");
        const chart = payload.chart as {
            days: { label: string; dates: { date: string }[] }[];
            reference: { label: string };
        };
        expect(chart.days.map((d) => d.label)).toEqual([
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
            "Sun",
        ]);
        expect(chart.days[5]!.dates[0]!.date).toBe("2026-11-07");
        expect(chart.reference.label).toContain("avg");
    });

    test("logging consistency counts days and reads the streak", () => {
        const buckets = DATES.map((date, i) =>
            i < 2
                ? bucket(date)
                : bucket(date, { calories: 1000 }, [meal({}), meal({})]),
        );
        const payload = card(
            { shape: "consistency", data: "logging", size: "compact" },
            buckets,
        );
        expect(payload.headline?.value).toBe("5");
        expect(payload.verdict?.strong).toBe("on a 5-day streak");
    });
});

describe("drill-down ranking (T11)", () => {
    const dayMeals: TrendsMealInput[] = [
        {
            id: "m1",
            description: "Burger & fries",
            mealType: "lunch",
            loggedAt: "2026-11-08T13:00:00Z",
            items: [
                { name: "Beef patty", values: { fat_g: 19 } },
                { name: "Fries", values: { fat_g: 9 } },
                { name: "Lettuce", values: { fat_g: null } },
            ],
        },
        {
            id: "m2",
            description: "Eggs & bacon",
            mealType: "breakfast",
            loggedAt: "2026-11-08T08:00:00Z",
            items: [
                { name: "Bacon", values: { fat_g: 12 } },
                { name: "Eggs", values: { fat_g: 9 } },
            ],
        },
    ];

    test("day contributors rank meals and items by the tapped metric", () => {
        const ranked = rankDayContributors(dayMeals, "fat_g");
        expect(ranked.map((m) => m.description)).toEqual([
            "Burger & fries",
            "Eggs & bacon",
        ]);
        expect(ranked[0]!.total).toBe(28);
        expect(ranked[0]!.items.map((i) => i.name)).toEqual([
            "Beef patty",
            "Fries",
        ]);
    });

    test("period contributors aggregate by food and keep the latest day", () => {
        const foods = rankPeriodContributors(
            [
                { ...dayMeals[0]!, date: "2026-11-08" },
                {
                    id: "m3",
                    description: "Burger again",
                    mealType: "lunch",
                    loggedAt: "2026-11-05T13:00:00Z",
                    date: "2026-11-05",
                    items: [{ name: "Beef patty", values: { fat_g: 19 } }],
                },
            ],
            "fat_g",
        );
        expect(foods[0]).toEqual({
            name: "Beef Patty",
            value: 38,
            lastDate: "2026-11-08",
        });
    });
});
