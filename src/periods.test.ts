import { describe, expect, test } from "bun:test";
import {
    GOAL_COLUMNS,
    type GoalValues,
    type NutritionGoalsHistoryRow,
} from "./goals-history.js";
import { buildDailyBuckets } from "./insights.js";
import {
    buildPeriodAveragesMeta,
    buildPeriodRows,
    dayTotalsFromMeals,
    formatPeriodContent,
    GRANULARITIES,
    PERIOD_HEADER,
    PERIOD_HEADER_NO_TARGETS,
    PERIOD_ROW_COUNTS,
    periodBounds,
    periodKey,
    targetsRecordedFrom,
    withinBand,
    yearSpanStart,
    type DayTotals,
    type Granularity,
} from "./periods.js";
import type { Meal } from "./supabase.js";
import { shiftLocalDate } from "./tz.js";

function goals(partial: Partial<GoalValues>): GoalValues {
    const out = {} as GoalValues;
    for (const c of GOAL_COLUMNS) out[c] = partial[c] ?? null;
    return out;
}

function hist(
    effective_at: string,
    partial: Partial<GoalValues>,
): NutritionGoalsHistoryRow {
    return { effective_at, ...goals(partial) };
}

function day(
    date: string,
    calories: number,
    meal_count = 1,
    macros: Partial<Pick<DayTotals, "protein_g" | "carbs_g" | "fat_g">> = {},
): DayTotals {
    return {
        date,
        meal_count,
        calories,
        // An explicit null (no meal carried it) stays null.
        protein_g: "protein_g" in macros ? macros.protein_g! : 0,
        carbs_g: "carbs_g" in macros ? macros.carbs_g! : 0,
        fat_g: "fat_g" in macros ? macros.fat_g! : 0,
    };
}

let mealSeq = 0;
function meal(logged_at: string, calories: number | null, p = 0): Meal {
    return {
        id: `m${++mealSeq}`,
        user_id: "u1",
        logged_at,
        meal_type: "lunch",
        description: "x",
        calories,
        protein_g: p,
        carbs_g: null,
        fat_g: null,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        notes: null,
        idempotency_key: null,
    };
}

describe("periodKey / periodBounds", () => {
    test("ISO week across a year end", () => {
        // 2026-01-01 is a Thursday; its ISO week starts Mon 2025-12-29.
        expect(periodKey("2026-01-01", "week")).toBe("2025-12-29");
        expect(periodKey("2025-12-29", "week")).toBe("2025-12-29");
        expect(periodKey("2026-01-04", "week")).toBe("2025-12-29");
        expect(periodKey("2026-01-05", "week")).toBe("2026-01-05");
        expect(periodBounds("2025-12-29", "week")).toEqual({
            start: "2025-12-29",
            end: "2026-01-04",
        });
    });

    test("months, including February in a leap year", () => {
        expect(periodKey("2026-03-15", "month")).toBe("2026-03");
        expect(periodBounds("2026-03", "month")).toEqual({
            start: "2026-03-01",
            end: "2026-03-31",
        });
        expect(periodBounds("2028-02", "month").end).toBe("2028-02-29");
        expect(periodBounds("2026-02", "month").end).toBe("2026-02-28");
    });

    test("quarters, Q4 to Q1", () => {
        expect(periodKey("2025-12-31", "quarter")).toBe("2025-Q4");
        expect(periodKey("2026-01-01", "quarter")).toBe("2026-Q1");
        expect(periodKey("2026-06-30", "quarter")).toBe("2026-Q2");
        expect(periodBounds("2025-Q4", "quarter")).toEqual({
            start: "2025-10-01",
            end: "2025-12-31",
        });
        expect(periodBounds("2026-Q1", "quarter")).toEqual({
            start: "2026-01-01",
            end: "2026-03-31",
        });
    });

    test("years and the year span", () => {
        expect(periodKey("2026-07-04", "year")).toBe("2026");
        expect(periodBounds("2026", "year")).toEqual({
            start: "2026-01-01",
            end: "2026-12-31",
        });
        expect(yearSpanStart("2026-10-04")).toBe("2022-01-01");
    });

    test("every granularity's span fits inside the year span", () => {
        const end = "2026-10-04";
        for (const g of GRANULARITIES) {
            let key = periodKey(end, g);
            for (let i = 1; i < PERIOD_ROW_COUNTS[g]; i++)
                key = periodKey(
                    shiftLocalDate(periodBounds(key, g).start, -1),
                    g,
                );
            expect(periodBounds(key, g).start >= yearSpanStart(end)).toBe(true);
        }
    });
});

describe("withinBand", () => {
    test("two-sided ±10%, unrounded", () => {
        expect(withinBand(90, 100)).toBe(true);
        expect(withinBand(110, 100)).toBe(true);
        expect(withinBand(89.99, 100)).toBe(false);
        expect(withinBand(110.01, 100)).toBe(false);
        expect(withinBand(115, 100)).toBe(false);
    });
    test("a zero or negative target is never hit", () => {
        expect(withinBand(0, 0)).toBe(false);
        expect(withinBand(0, -5)).toBe(false);
    });
});

describe("dayTotalsFromMeals", () => {
    test("every date in range, summed like buildDailyBuckets, meal_count is meals", () => {
        const meals = [
            meal("2026-03-01T08:00:00Z", 500, 20),
            meal("2026-03-01T19:00:00Z", null, 5),
            meal("2026-03-03T12:00:00Z", 700),
            // Kyiv: 22:30Z on Mar 3 is Mar 4 local.
            meal("2026-03-03T22:30:00Z", 100),
        ];
        const out = dayTotalsFromMeals(
            meals,
            "2026-03-01",
            "2026-03-04",
            "Europe/Kyiv",
        );
        expect(out.map((d) => d.date)).toEqual([
            "2026-03-01",
            "2026-03-02",
            "2026-03-03",
            "2026-03-04",
        ]);
        expect(out[0]).toEqual({
            date: "2026-03-01",
            meal_count: 2,
            calories: 500,
            protein_g: 25,
            // Every meal in the fixture has null carbs and fat: not carried.
            carbs_g: null,
            fat_g: null,
        });
        expect(out[1]!.meal_count).toBe(0);
        expect(out[3]!.calories).toBe(100);
        const buckets = buildDailyBuckets(
            meals,
            [],
            "2026-03-01",
            "2026-03-04",
            "Europe/Kyiv",
        );
        expect(out.map((d) => d.calories)).toEqual(
            buckets.map((b) => b.calories),
        );
    });
});

describe("dayTotalsFromMeals macro coverage", () => {
    test("a macro is null on a day no meal carries it, its sum when one does", () => {
        const calOnly = {
            ...meal("2026-03-01T08:00:00Z", 600),
            protein_g: null,
        };
        const withProtein = meal("2026-03-02T08:00:00Z", 500, 30);
        const out = dayTotalsFromMeals(
            [
                calOnly,
                withProtein,
                { ...meal("2026-03-02T12:00:00Z", 200), protein_g: null },
            ],
            "2026-03-01",
            "2026-03-02",
            "UTC",
        );
        expect(out[0]!.protein_g).toBeNull();
        expect(out[0]!.calories).toBe(600);
        // One carrying meal makes the day carry it; the other adds nothing.
        expect(out[1]!.protein_g).toBe(30);
    });
});

describe("buildPeriodRows", () => {
    const tz = "UTC";

    test("a macro no logged day carries averages to null, not 0", () => {
        const days = [
            day("2026-03-01", 2000, 1, {
                protein_g: null,
                carbs_g: null,
                fat_g: null,
            }),
            day("2026-03-02", 1800, 1, {
                protein_g: null,
                carbs_g: null,
                fat_g: null,
            }),
        ];
        const march = buildPeriodRows(days, [], "2026-04-15", "month", tz).find(
            (r) => r.key === "2026-03",
        )!;
        expect(march.avg).toEqual({
            calories: 1900,
            protein: null,
            carbs: null,
            fat: null,
        });
    });

    test("each macro averages over only the logged days that carry it", () => {
        const days = [
            day("2026-03-01", 2000, 1, {
                protein_g: 150,
                carbs_g: null,
                fat_g: 60,
            }),
            day("2026-03-02", 1000, 1, {
                protein_g: null,
                carbs_g: null,
                fat_g: 80,
            }),
            day("2026-03-03", 1500, 1, {
                protein_g: 90,
                carbs_g: 200,
                fat_g: 70,
            }),
        ];
        const march = buildPeriodRows(days, [], "2026-04-15", "month", tz).find(
            (r) => r.key === "2026-03",
        )!;
        expect(march.logged_days).toBe(3);
        // Calories over all 3 logged days; protein over 2, carbs over 1.
        expect(march.avg).toEqual({
            calories: 1500,
            protein: 120,
            carbs: 200,
            fat: 70,
        });
    });

    test("a day with a protein target but no protein logged is not on target", () => {
        const history = [
            hist("2026-01-01T00:00:00Z", {
                daily_calories: 2000,
                daily_protein_g: 150,
            }),
        ];
        const days = [
            day("2026-03-01", 2000, 1, { protein_g: null }),
            day("2026-03-02", 2000, 1, { protein_g: 150 }),
        ];
        const march = buildPeriodRows(
            days,
            history,
            "2026-04-15",
            "month",
            tz,
        ).find((r) => r.key === "2026-03")!;
        expect(march.on_target_days).toBe(1);
    });

    test("logged-day vs calendar-day denominators; a water-only day is not logged", () => {
        // March 2026, end date mid-April: March is complete.
        const days = [
            day("2026-03-01", 2000),
            day("2026-03-02", 1000),
            // meal_count 0 is a water-only (or empty) day: excluded.
            day("2026-03-03", 0, 0),
        ];
        const rows = buildPeriodRows(days, [], "2026-04-15", "month", tz);
        const march = rows.find((r) => r.key === "2026-03")!;
        expect(march.days).toBe(31);
        expect(march.logged_days).toBe(2);
        expect(march.avg!.calories).toBe(1500);
        expect(march.partial).toBe(false);
        expect(march.targets).toBeNull();
        expect(march.on_target_days).toBeNull();
        expect(march.incomplete_days).toBeNull();
    });

    test("partial current period and clipped day count", () => {
        const rows = buildPeriodRows(
            [day("2026-04-01", 1800)],
            [],
            "2026-04-10",
            "month",
            tz,
        );
        expect(rows[0]!.key).toBe("2026-04");
        expect(rows[0]!.partial).toBe(true);
        expect(rows[0]!.days).toBe(10);
        expect(rows[0]!.end).toBe("2026-04-30");
        // A period ending exactly on the end date is complete.
        const full = buildPeriodRows(
            [day("2026-04-01", 1800)],
            [],
            "2026-04-30",
            "month",
            tz,
        );
        expect(full[0]!.partial).toBe(false);
        expect(full[0]!.days).toBe(30);
    });

    test("newest first; leading empty periods dropped, inner empty kept", () => {
        const days = [day("2026-01-10", 2000), day("2026-04-02", 2000)];
        const rows = buildPeriodRows(days, [], "2026-04-10", "month", tz);
        expect(rows.map((r) => r.key)).toEqual([
            "2026-04",
            "2026-03",
            "2026-02",
            "2026-01",
        ]);
        expect(rows[1]!.logged_days).toBe(0);
        expect(rows[1]!.avg).toBeNull();
        expect(rows[2]!.logged_days).toBe(0);
    });

    test("history before the read span keeps its leading empty periods", () => {
        // The span starts 2026-01-01 but the user logged before it: the empty
        // months before the first meal inside the span are inner gaps.
        const days = [day("2026-03-05", 2000)];
        const cut = buildPeriodRows(days, [], "2026-04-10", "month", tz);
        expect(cut.map((r) => r.key)).toEqual(["2026-04", "2026-03"]);
        const kept = buildPeriodRows(
            days,
            [],
            "2026-04-10",
            "month",
            tz,
            "2026-01-01",
        );
        expect(kept.map((r) => r.key)).toEqual([
            "2026-04",
            "2026-03",
            "2026-02",
            "2026-01",
        ]);
        // Nothing logged inside the span at all still shows the empty span.
        expect(
            buildPeriodRows([], [], "2026-04-10", "month", tz, "2026-01-01")
                .length,
        ).toBe(4);
    });

    test("no logged day at all yields no rows", () => {
        expect(
            buildPeriodRows(
                [day("2026-04-01", 0, 0)],
                [],
                "2026-04-10",
                "week",
                tz,
            ),
        ).toEqual([]);
    });

    test("caps at PERIOD_ROW_COUNTS", () => {
        const days = [day("2015-01-01", 2000)];
        for (const g of GRANULARITIES) {
            const rows = buildPeriodRows(days, [], "2026-10-04", g, tz);
            expect(rows.length).toBe(PERIOD_ROW_COUNTS[g]);
            expect(rows[0]!.key).toBe(periodKey("2026-10-04", g));
        }
    });

    test("on target with a partial set of targets", () => {
        // Only calories and protein have targets; carbs/fat are ignored.
        const history = [
            hist("2026-01-01T00:00:00Z", {
                daily_calories: 2000,
                daily_protein_g: 100,
            }),
        ];
        const days = [
            day("2026-03-02", 2000, 1, { protein_g: 100, carbs_g: 900 }), // on
            day("2026-03-03", 2150, 1, { protein_g: 95 }), // on
            day("2026-03-04", 2000, 1, { protein_g: 115 }), // protein 115% off
            day("2026-03-05", 1700, 1, { protein_g: 100 }), // calories off
        ];
        const [row] = buildPeriodRows(days, history, "2026-03-08", "week", tz);
        expect(row!.key).toBe("2026-03-02");
        expect(row!.logged_days).toBe(4);
        expect(row!.on_target_days).toBe(2);
        expect(row!.targets).toEqual({
            calories: 2000,
            protein: 100,
            carbs: null,
            fat: null,
        });
        expect(row!.targets_changed).toBe(false);
        expect(row!.targets_assumed).toBe(false);
    });

    test("a target with no value that day counts as missed", () => {
        const history = [hist("2026-01-01T00:00:00Z", { daily_fat_g: 70 })];
        const [row] = buildPeriodRows(
            [day("2026-03-02", 2000)],
            history,
            "2026-03-08",
            "week",
            tz,
        );
        expect(row!.on_target_days).toBe(0);
        expect(row!.incomplete_days).toBeNull(); // no calorie target
    });

    test("each day is judged against its own goal when goals change mid-period", () => {
        const history = [
            hist("2026-01-01T00:00:00Z", { daily_calories: 2000 }),
            hist("2026-03-16T09:00:00Z", { daily_calories: 2500 }),
        ];
        const days = [
            day("2026-03-10", 2000), // on vs 2000
            day("2026-03-20", 2000), // off vs 2500
            day("2026-03-21", 2500), // on vs 2500
        ];
        const rows = buildPeriodRows(days, history, "2026-04-05", "month", tz);
        const march = rows.find((r) => r.key === "2026-03")!;
        expect(march.targets_changed).toBe(true);
        expect(march.on_target_days).toBe(2);
        // Target shown is the one in effect on the period's last day.
        expect(march.targets!.calories).toBe(2500);
        // The week of the change: Mon 16 is the change day itself, so the
        // whole week is on 2500 and unchanged.
        const weeks = buildPeriodRows(days, history, "2026-03-22", "week", tz);
        expect(weeks[0]!.key).toBe("2026-03-16");
        expect(weeks[0]!.targets_changed).toBe(false);
        expect(weeks[1]!.targets_changed).toBe(false);
    });

    test("a change to a goal outside the four macros is not a targets change", () => {
        const history = [
            hist("2026-01-01T00:00:00Z", { daily_calories: 2000 }),
            hist("2026-03-16T09:00:00Z", {
                daily_calories: 2000,
                daily_water_ml: 2500,
            }),
        ];
        const rows = buildPeriodRows(
            [day("2026-03-10", 2000)],
            history,
            "2026-03-31",
            "month",
            tz,
        );
        expect(rows[0]!.targets_changed).toBe(false);
    });

    test("the targets-assumed flag", () => {
        const history = [
            hist("2026-03-10T12:00:00Z", { daily_calories: 2000 }),
        ];
        const days = [day("2026-03-02", 2000), day("2026-03-12", 2000)];
        const rows = buildPeriodRows(days, history, "2026-03-31", "month", tz);
        expect(rows[0]!.targets_assumed).toBe(true);
        expect(rows[0]!.targets_changed).toBe(false);
        expect(rows[0]!.on_target_days).toBe(2);
        const weeks = buildPeriodRows(days, history, "2026-03-31", "week", tz);
        const wk = (k: string) => weeks.find((r) => r.key === k)!;
        expect(wk("2026-03-02").targets_assumed).toBe(true);
        // Mon 9th is assumed, the 10th onwards recorded — still assumed.
        expect(wk("2026-03-09").targets_assumed).toBe(true);
        expect(wk("2026-03-16").targets_assumed).toBe(false);
    });

    test("the incomplete_days threshold is strictly under 50% of the day's target", () => {
        const history = [
            hist("2026-01-01T00:00:00Z", { daily_calories: 2000 }),
        ];
        const days = [
            day("2026-03-02", 999.9), // incomplete
            day("2026-03-03", 1000), // exactly 50%: not incomplete
            day("2026-03-04", 300), // incomplete
            day("2026-03-05", 0, 0), // not logged, not counted
        ];
        const [row] = buildPeriodRows(days, history, "2026-03-08", "week", tz);
        expect(row!.incomplete_days).toBe(2);
        // Possibly incomplete days stay in the average.
        expect(row!.logged_days).toBe(3);
        expect(row!.avg!.calories).toBeCloseTo((999.9 + 1000 + 300) / 3, 9);
    });

    test("goal dates are read in the profile timezone", () => {
        // 23:30Z on Mar 1 is already Mar 2 in Kyiv. A month clipped to Mar 1
        // holds that single day.
        const history = [
            hist("2026-03-01T23:30:00Z", { daily_calories: 2000 }),
        ];
        const days = [day("2026-03-01", 2000)];
        const kyiv = buildPeriodRows(
            days,
            history,
            "2026-03-01",
            "month",
            "Europe/Kyiv",
        );
        expect(kyiv[0]!.targets_assumed).toBe(true);
        const utc = buildPeriodRows(
            days,
            history,
            "2026-03-01",
            "month",
            "UTC",
        );
        expect(utc[0]!.targets_assumed).toBe(false);
    });
});

describe("buildPeriodAveragesMeta", () => {
    // Two years of mixed days: some unlogged, some water-only.
    const end = "2026-08-20";
    const days: DayTotals[] = [];
    for (let d = "2024-11-03"; d <= end; d = shiftLocalDate(d, 1)) {
        const n = Number(d.slice(8, 10));
        if (n % 5 === 0) days.push(day(d, 0, 0));
        else days.push(day(d, 1500 + n * 20, 1 + (n % 3)));
    }
    const history = [
        hist("2025-06-15T08:00:00Z", { daily_calories: 2000 }),
        hist("2026-02-10T08:00:00Z", {
            daily_calories: 1900,
            daily_protein_g: 120,
        }),
    ];
    const meta = buildPeriodAveragesMeta(days, history, end, "month", "UTC");

    test("envelope and all four granularities", () => {
        expect(meta.v).toBe(1);
        expect(meta.end_date).toBe(end);
        expect(meta.group_by).toBe("month");
        for (const g of GRANULARITIES)
            expect(meta.periods[g]).toEqual(
                buildPeriodRows(days, history, end, g, "UTC"),
            );
        expect(meta.periods.year.map((r) => r.key)).toEqual([
            "2026",
            "2025",
            "2024",
        ]);
    });

    test("the logged days of a quarter's months sum to the quarter's", () => {
        const months = new Map(meta.periods.month.map((r) => [r.key, r]));
        for (const q of meta.periods.quarter) {
            const { start } = periodBounds(q.key, "quarter");
            const keys = [0, 1, 2].map((i) => {
                const [y, m] = start.split("-").map(Number) as [number, number];
                return `${y}-${String(m + i).padStart(2, "0")}`;
            });
            const ms = keys.map((k) => months.get(k)).filter((r) => r);
            // The oldest quarter may start before the first logged month.
            const sumLogged = ms.reduce((s, r) => s + r!.logged_days, 0);
            const sumDays = ms.reduce((s, r) => s + r!.days, 0);
            expect(sumLogged).toBe(q.logged_days);
            if (ms.length === 3) expect(sumDays).toBe(q.days);
        }
    });

    test("years' logged days equal the sum of their quarters", () => {
        const byYear = new Map<string, number>();
        for (const q of meta.periods.quarter) {
            const y = q.key.slice(0, 4);
            byYear.set(y, (byYear.get(y) ?? 0) + q.logged_days);
        }
        for (const y of meta.periods.year)
            expect(byYear.get(y.key)).toBe(y.logged_days);
    });
});

describe("formatPeriodContent", () => {
    const history = [
        hist("2026-03-10T12:00:00Z", {
            daily_calories: 2200,
            daily_protein_g: 160,
            daily_carbs_g: 250,
            daily_fat_g: 70,
        }),
    ];

    test("a macro no logged day carried reads 'not logged', never 0 g", () => {
        const days = [
            day("2026-03-02", 1950, 1, {
                protein_g: null,
                carbs_g: null,
                fat_g: 60,
            }),
        ];
        const rows = buildPeriodRows(
            days,
            history,
            "2026-03-31",
            "month",
            "UTC",
        );
        const text = formatPeriodContent(rows, "month", "2026-03-10");
        expect(text).toContain("P not logged · C not logged · F 60/70 g");
        expect(text).not.toContain("P 0");
    });

    test("the example line shape, partial and notes", () => {
        const days = [
            day("2026-03-02", 2140, 2, {
                protein_g: 148,
                carbs_g: 231,
                fat_g: 71,
            }),
            day("2026-03-03", 900, 1, {
                protein_g: 148,
                carbs_g: 231,
                fat_g: 71,
            }),
            day("2026-04-01", 2200, 1, {
                protein_g: 160,
                carbs_g: 250,
                fat_g: 70,
            }),
        ];
        const rows = buildPeriodRows(
            days,
            history,
            "2026-04-03",
            "month",
            "UTC",
        );
        const text = formatPeriodContent(
            rows,
            "month",
            targetsRecordedFrom(history, "UTC"),
        );
        const lines = text.split("\n");
        expect(lines[0]).toBe(PERIOD_HEADER);
        expect(lines[1]).toBe(
            "Apr 2026 (partial) · 1/3 days logged · 2,200 kcal (target 2,200) · P 160/160 g · C 250/250 g · F 70/70 g · on target 1/1",
        );
        expect(lines[2]).toBe(
            "Mar 2026 · 2/31 days logged · 1,520 kcal (target 2,200) · P 148/160 g · C 231/250 g · F 71/70 g · on target 1/2 · 1 possibly incomplete · targets before 2026-03-10 not recorded",
        );
        expect(lines.length).toBe(3);
    });

    test("targets changed mid-period, an empty period, and labels", () => {
        const h = [
            ...history,
            hist("2026-03-20T12:00:00Z", { daily_calories: 2000 }),
        ];
        const days = [day("2025-12-30", 2000), day("2026-03-25", 2000)];
        const months = buildPeriodRows(days, h, "2026-03-31", "month", "UTC");
        const text = formatPeriodContent(months, "month", "2026-03-10");
        expect(text).toContain(
            "Mar 2026 · 1/31 days logged · 2,000 kcal (target 2,000) · P 0 g · C 0 g · F 0 g · on target 1/1 · targets changed mid-period · targets before 2026-03-10 not recorded",
        );
        expect(text).toContain(
            "Feb 2026 · 0/28 days logged · targets before 2026-03-10 not recorded",
        );
        const weeks = buildPeriodRows(days, h, "2026-01-02", "week", "UTC");
        expect(formatPeriodContent(weeks, "week")).toContain(
            "Dec 29, 2025 – Jan 4, 2026 (partial) · 1/5 days logged",
        );
        const midWeek = buildPeriodRows(days, h, "2026-03-29", "week", "UTC");
        expect(formatPeriodContent(midWeek, "week")).toContain(
            "Mar 23 – Mar 29, 2026 · 1/7 days logged",
        );
        const q = buildPeriodRows(days, h, "2026-03-31", "quarter", "UTC");
        expect(formatPeriodContent(q, "quarter")).toContain("\nQ1 2026 · ");
        const y = buildPeriodRows(days, h, "2026-03-31", "year", "UTC");
        expect(formatPeriodContent(y, "year")).toContain(
            "\n2026 (partial) · 1/90 days logged",
        );
    });

    test("no-targets variant", () => {
        const rows = buildPeriodRows(
            [day("2026-03-02", 1800.6, 1, { protein_g: 90.4 })],
            [],
            "2026-03-08",
            "week",
            "UTC",
        );
        const text = formatPeriodContent(rows, "week");
        expect(text.split("\n")[0]).toBe(PERIOD_HEADER_NO_TARGETS);
        expect(text).toContain(
            "Mar 2 – Mar 8, 2026 · 1/7 days logged · 1,801 kcal · P 90 g · C 0 g · F 0 g",
        );
        expect(text).not.toContain(" · on target");
        expect(text).not.toContain("target ");
    });

    test("history holding no macro target reads as no targets", () => {
        // Only a water and fiber goal: none of the four macros has a target.
        const rows = buildPeriodRows(
            [day("2026-03-02", 1800)],
            [
                hist("2026-03-05T08:00:00Z", {
                    daily_water_ml: 2000,
                    daily_fiber_g: 30,
                }),
            ],
            "2026-03-08",
            "week",
            "UTC",
        );
        expect(rows[0]!.targets).toBeNull();
        expect(rows[0]!.targets_assumed).toBe(false);
        expect(rows[0]!.on_target_days).toBeNull();
        const text = formatPeriodContent(rows, "week", "2026-03-05");
        expect(text.split("\n")[0]).toBe(PERIOD_HEADER_NO_TARGETS);
        expect(text).not.toContain("not recorded");
    });

    test("nothing logged in the span", () => {
        const g: Granularity = "quarter";
        expect(formatPeriodContent([], g)).toBe(
            "Averages per logged day: no meals logged in the last 12 quarters.",
        );
    });
});
