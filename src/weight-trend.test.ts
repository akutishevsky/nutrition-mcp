import { describe, expect, test } from "bun:test";
import { shiftLocalDate } from "./tz.js";
import {
    MONTHLY_SERIES_CAP,
    TREND_ALPHA,
    TREND_WARMUP_DAYS,
    analyzeWeightHistory,
    dailyAverages,
    daysBetween,
    defaultRangeFor,
    isoWeekStart,
    monthlyBuckets,
    rateForDisplay,
    rateInUnit,
    trendSeries,
    weeklyBuckets,
    weeklyRate,
    type DailyWeight,
} from "./weight-trend.js";

/** Daily series of `n` consecutive days from `start`, weight from fn(i). */
function daysFrom(
    start: string,
    n: number,
    fn: (i: number) => number,
): DailyWeight[] {
    return Array.from({ length: n }, (_, i) => ({
        date: shiftLocalDate(start, i),
        weight_g: fn(i),
    }));
}

describe("constants", () => {
    test("alpha and warm-up", () => {
        expect(TREND_ALPHA).toBe(0.15);
        expect(TREND_WARMUP_DAYS).toBe(60);
        // 60 days at α = 0.15 leaves under 0.01% of the seed.
        expect(Math.pow(1 - TREND_ALPHA, TREND_WARMUP_DAYS)).toBeLessThan(1e-4);
    });
});

describe("dailyAverages", () => {
    test("multiple weigh-ins on one day are averaged", () => {
        const days = dailyAverages(
            [
                { weight_g: 80_000, logged_at: "2026-03-10T06:00:00Z" },
                { weight_g: 81_000, logged_at: "2026-03-10T20:00:00Z" },
                { weight_g: 79_000, logged_at: "2026-03-09T07:00:00Z" },
            ],
            "UTC",
        );
        expect(days).toEqual([
            { date: "2026-03-09", weight_g: 79_000 },
            { date: "2026-03-10", weight_g: 80_500 },
        ]);
    });

    test("empty input gives no days", () => {
        expect(dailyAverages([], "UTC")).toEqual([]);
    });

    test("buckets by local day across a DST change (Europe/Kyiv)", () => {
        // Kyiv springs forward 2026-03-29 03:00 local (UTC+2 → UTC+3).
        const days = dailyAverages(
            [
                // 2026-03-28 23:30 local (UTC+2) → 21:30Z
                { weight_g: 80_000, logged_at: "2026-03-28T21:30:00Z" },
                // 2026-03-29 00:30 local (UTC+2, before the jump) → 22:30Z on the 28th
                { weight_g: 81_000, logged_at: "2026-03-28T22:30:00Z" },
                // 2026-03-29 23:30 local (UTC+3) → 20:30Z
                { weight_g: 82_000, logged_at: "2026-03-29T20:30:00Z" },
                // 2026-03-30 00:30 local (UTC+3) → 21:30Z on the 29th
                { weight_g: 83_000, logged_at: "2026-03-29T21:30:00Z" },
            ],
            "Europe/Kyiv",
        );
        expect(days).toEqual([
            { date: "2026-03-28", weight_g: 80_000 },
            { date: "2026-03-29", weight_g: 81_500 },
            { date: "2026-03-30", weight_g: 83_000 },
        ]);
        // The same instants in UTC bucket differently.
        expect(
            dailyAverages(
                [
                    { weight_g: 80_000, logged_at: "2026-03-28T21:30:00Z" },
                    { weight_g: 81_000, logged_at: "2026-03-28T22:30:00Z" },
                ],
                "UTC",
            ),
        ).toEqual([{ date: "2026-03-28", weight_g: 80_500 }]);
    });
});

describe("trendSeries", () => {
    test("empty in, empty out", () => {
        expect(trendSeries([])).toEqual([]);
    });

    test("a single point is its own trend", () => {
        expect(trendSeries([{ date: "2026-01-01", weight_g: 80_000 }])).toEqual(
            [{ date: "2026-01-01", weight_g: 80_000, trend_g: 80_000 }],
        );
    });

    test("a constant series stays constant", () => {
        const s = trendSeries(daysFrom("2026-01-01", 30, () => 75_000));
        for (const p of s) expect(p.trend_g).toBeCloseTo(75_000, 9);
    });

    test("a step change converges monotonically", () => {
        const s = trendSeries(
            daysFrom("2026-01-01", 61, (i) => (i === 0 ? 80_000 : 78_000)),
        );
        for (let i = 1; i < s.length; i++) {
            expect(s[i]!.trend_g).toBeLessThan(s[i - 1]!.trend_g);
            expect(s[i]!.trend_g).toBeGreaterThan(78_000);
        }
        // After one step: 80000 − 0.15 · 2000.
        expect(s[1]!.trend_g).toBeCloseTo(79_700, 6);
        // After 60 steps it is within 0.01% of the gap.
        expect(s[60]!.trend_g - 78_000).toBeLessThan(2000 * 1e-4);
    });

    test("a 5-day gap equals five daily steps at that value", () => {
        const gapped = trendSeries([
            { date: "2026-01-01", weight_g: 80_000 },
            { date: "2026-01-06", weight_g: 78_000 },
        ]);
        const daily = trendSeries([
            { date: "2026-01-01", weight_g: 80_000 },
            ...daysFrom("2026-01-02", 5, () => 78_000),
        ]);
        expect(gapped[1]!.date).toBe(daily[5]!.date);
        expect(gapped[1]!.trend_g).toBeCloseTo(daily[5]!.trend_g, 9);
    });

    test("values exist only on logged days", () => {
        const s = trendSeries([
            { date: "2026-01-01", weight_g: 80_000 },
            { date: "2026-01-10", weight_g: 79_000 },
        ]);
        expect(s.map((p) => p.date)).toEqual(["2026-01-01", "2026-01-10"]);
    });
});

describe("weeklyRate", () => {
    const END = "2026-06-30";

    test("negative when losing, positive when gaining", () => {
        // −100 g/day for 30 days, ending at END.
        const losing = trendSeries(
            daysFrom(shiftLocalDate(END, -29), 30, (i) => 80_000 - i * 100),
        );
        const r = weeklyRate(losing, END);
        expect(r).not.toBeNull();
        expect(r!).toBeLessThan(0);
        // A long linear ramp: the EWMA lags but tracks the slope (−700 g/wk).
        expect(r!).toBeCloseTo(-700, -2);

        const gaining = trendSeries(
            daysFrom(shiftLocalDate(END, -29), 30, (i) => 70_000 + i * 50),
        );
        expect(weeklyRate(gaining, END)!).toBeGreaterThan(0);
    });

    test("constant weight gives zero", () => {
        const s = trendSeries(
            daysFrom(shiftLocalDate(END, -29), 30, () => 80_000),
        );
        expect(weeklyRate(s, END)).toBeCloseTo(0, 9);
    });

    test("null with fewer than 4 weigh-ins in the last 21 days", () => {
        const s = trendSeries([
            ...daysFrom(shiftLocalDate(END, -60), 20, () => 80_000),
            { date: shiftLocalDate(END, -14), weight_g: 79_000 },
            { date: shiftLocalDate(END, -7), weight_g: 78_500 },
            { date: END, weight_g: 78_000 },
        ]);
        expect(weeklyRate(s, END)).toBeNull();
        // A fourth recent weigh-in makes it measurable.
        const s4 = trendSeries([
            ...daysFrom(shiftLocalDate(END, -60), 20, () => 80_000),
            { date: shiftLocalDate(END, -14), weight_g: 79_000 },
            { date: shiftLocalDate(END, -10), weight_g: 78_800 },
            { date: shiftLocalDate(END, -7), weight_g: 78_500 },
            { date: END, weight_g: 78_000 },
        ]);
        expect(weeklyRate(s4, END)).not.toBeNull();
    });

    test("null when there is no weigh-in 14 days back", () => {
        const s = trendSeries(
            daysFrom(shiftLocalDate(END, -12), 13, (i) => 80_000 - i * 100),
        );
        expect(weeklyRate(s, END)).toBeNull();
    });

    test("null when the measured span is under 10 days", () => {
        // Reference at END−14, but the last weigh-in is END−5 (span 9).
        const s = trendSeries([
            { date: shiftLocalDate(END, -14), weight_g: 80_000 },
            { date: shiftLocalDate(END, -8), weight_g: 79_800 },
            { date: shiftLocalDate(END, -7), weight_g: 79_700 },
            { date: shiftLocalDate(END, -6), weight_g: 79_600 },
            { date: shiftLocalDate(END, -5), weight_g: 79_500 },
        ]);
        expect(weeklyRate(s, END)).toBeNull();
        // Span of exactly 10 is enough.
        const s10 = trendSeries([
            { date: shiftLocalDate(END, -14), weight_g: 80_000 },
            { date: shiftLocalDate(END, -8), weight_g: 79_800 },
            { date: shiftLocalDate(END, -7), weight_g: 79_700 },
            { date: shiftLocalDate(END, -6), weight_g: 79_600 },
            { date: shiftLocalDate(END, -4), weight_g: 79_500 },
        ]);
        expect(weeklyRate(s10, END)).not.toBeNull();
    });

    test("null for an empty series; ignores points after endDate", () => {
        expect(weeklyRate([], END)).toBeNull();
        const s = trendSeries([
            ...daysFrom(shiftLocalDate(END, -29), 30, () => 80_000),
            { date: shiftLocalDate(END, 3), weight_g: 90_000 },
        ]);
        expect(weeklyRate(s, END)).toBeCloseTo(0, 9);
    });

    test("is measured from the last weigh-in at or before endDate − 14", () => {
        const s = trendSeries([
            { date: "2026-06-01", weight_g: 82_000 },
            { date: "2026-06-15", weight_g: 80_000 },
            { date: "2026-06-20", weight_g: 79_500 },
            { date: "2026-06-25", weight_g: 79_000 },
            { date: "2026-06-30", weight_g: 78_500 },
        ]);
        const ref = s.find((p) => p.date === "2026-06-15")!;
        const last = s[s.length - 1]!;
        expect(weeklyRate(s, END)).toBeCloseTo(
            ((last.trend_g - ref.trend_g) / 15) * 7,
            9,
        );
    });
});

describe("isoWeekStart / daysBetween", () => {
    test("Monday start", () => {
        expect(isoWeekStart("2026-10-05")).toBe("2026-10-05"); // Monday
        expect(isoWeekStart("2026-10-04")).toBe("2026-09-28"); // Sunday
        expect(isoWeekStart("2026-10-07")).toBe("2026-10-05");
        // Across a year boundary.
        expect(isoWeekStart("2027-01-01")).toBe("2026-12-28");
    });

    test("daysBetween counts calendar days", () => {
        expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
        expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    });
});

describe("weeklyBuckets", () => {
    test("Sunday-night and Monday-morning weigh-ins split at the local week boundary", () => {
        // In America/New_York (UTC−4 in October), Sunday 2026-10-04 22:00
        // local is Monday 02:00Z: UTC would call it the next week.
        const series = trendSeries(
            dailyAverages(
                [
                    { weight_g: 80_000, logged_at: "2026-10-05T02:00:00Z" },
                    { weight_g: 79_000, logged_at: "2026-10-05T12:00:00Z" },
                ],
                "America/New_York",
            ),
        );
        const b = weeklyBuckets(series, "2026-10-05");
        expect(b.map((w) => w.start)).toEqual(["2026-09-28", "2026-10-05"]);
        expect(b[0]!.weight_g).toBe(80_000);
    });

    test("weight is the mean of daily averages; trend is the last weigh-in's", () => {
        const series = trendSeries([
            { date: "2026-09-28", weight_g: 80_000 },
            { date: "2026-09-30", weight_g: 79_000 },
            { date: "2026-10-04", weight_g: 78_000 },
        ]);
        const [w] = weeklyBuckets(series, "2026-10-04");
        expect(w!.start).toBe("2026-09-28");
        expect(w!.weight_g).toBeCloseTo(79_000, 9);
        expect(w!.trend_g).toBe(series[2]!.trend_g);
    });

    test("empty weeks are omitted and only the last 53 weeks are kept", () => {
        const end = "2026-10-04"; // Sunday; its week starts 2026-09-28
        const series = trendSeries([
            { date: "2025-01-01", weight_g: 90_000 }, // too old
            { date: "2025-09-29", weight_g: 85_000 }, // Monday, 52 weeks before
            { date: "2025-09-28", weight_g: 85_500 }, // Sunday, 53 weeks before → dropped
            { date: "2026-09-01", weight_g: 80_000 },
            { date: "2026-10-04", weight_g: 79_000 },
        ]);
        const b = weeklyBuckets(series, end);
        expect(b.map((w) => w.start)).toEqual([
            "2025-09-29",
            "2026-08-31",
            "2026-09-28",
        ]);
        expect(b.length).toBeLessThanOrEqual(53);
    });
});

describe("monthlyBuckets", () => {
    test("month boundary follows the local date, not UTC", () => {
        // Tokyo (UTC+9): 2026-03-31T16:00Z is 2026-04-01 01:00 local.
        const series = trendSeries(
            dailyAverages(
                [
                    { weight_g: 80_000, logged_at: "2026-03-31T10:00:00Z" },
                    { weight_g: 79_000, logged_at: "2026-03-31T16:00:00Z" },
                ],
                "Asia/Tokyo",
            ),
        );
        expect(monthlyBuckets(series).map((m) => m.month)).toEqual([
            "2026-03",
            "2026-04",
        ]);
    });

    test("empty months omitted; mean of daily averages; trend at last weigh-in", () => {
        const series = trendSeries([
            { date: "2026-01-05", weight_g: 80_000 },
            { date: "2026-01-20", weight_g: 79_000 },
            { date: "2026-04-02", weight_g: 78_000 },
        ]);
        const m = monthlyBuckets(series);
        expect(m.map((x) => x.month)).toEqual(["2026-01", "2026-04"]);
        expect(m[0]!.weight_g).toBe(79_500);
        expect(m[0]!.trend_g).toBe(series[1]!.trend_g);
    });

    test("keeps the newest 240 months", () => {
        const days: DailyWeight[] = [];
        for (let i = 0; i < 300; i++) {
            const y = 2000 + Math.floor(i / 12);
            const mo = String((i % 12) + 1).padStart(2, "0");
            days.push({ date: `${y}-${mo}-15`, weight_g: 80_000 });
        }
        const m = monthlyBuckets(trendSeries(days));
        expect(m).toHaveLength(MONTHLY_SERIES_CAP);
        expect(m[0]!.month).toBe("2005-01");
        expect(m[m.length - 1]!.month).toBe("2024-12");
    });
});

describe("rate rounding", () => {
    test("2-decimal unit rate, 1-decimal display from it", () => {
        expect(rateInUnit(-437, "kg")).toBe(-0.44);
        expect(rateForDisplay(-0.44)).toBe(-0.4);
        expect(rateInUnit(453.59237, "lb")).toBe(1);
        expect(Object.is(rateInUnit(-1, "kg"), -0)).toBe(false);
        expect(Object.is(rateForDisplay(-0.04), -0)).toBe(false);
    });
});

describe("defaultRangeFor", () => {
    test("maps exact ranges, else 30", () => {
        expect(defaultRangeFor(7)).toBe(7);
        expect(defaultRangeFor(14)).toBe(14);
        expect(defaultRangeFor(30)).toBe(30);
        expect(defaultRangeFor(90)).toBe(90);
        expect(defaultRangeFor(365)).toBe(365);
        expect(defaultRangeFor(60)).toBe(30);
    });
});

describe("analyzeWeightHistory", () => {
    test("empty history", () => {
        const a = analyzeWeightHistory([], "UTC", "kg", "2026-10-04");
        expect(a.meta).toEqual({
            v: 1,
            unit: "kg",
            daily: [],
            weekly: [],
            monthly: [],
            first: null,
            trend_latest: null,
            trend_date: null,
            weekly_rate: null,
        });
    });

    test("three years of data: series shapes and display units", () => {
        const today = "2026-10-04";
        const start = shiftLocalDate(today, -(3 * 365 - 1));
        const entries = daysFrom(start, 3 * 365, (i) => 90_000 - i * 10).map(
            (d) => ({
                weight_g: d.weight_g,
                logged_at: `${d.date}T12:00:00Z`,
            }),
        );
        const a = analyzeWeightHistory(entries, "UTC", "kg", today);
        expect(a.meta.daily).toHaveLength(90);
        expect(a.meta.daily[0]!.date).toBe(shiftLocalDate(today, -89));
        expect(a.meta.daily[89]!.date).toBe(today);
        expect(a.meta.weekly).toHaveLength(53);
        expect(a.meta.weekly[52]!.start).toBe(isoWeekStart(today));
        // 2023-10 through 2026-10 inclusive.
        expect(a.meta.monthly).toHaveLength(37);
        expect(a.meta.first).toEqual({ date: start, weight: 90 });
        expect(a.meta.trend_date).toBe(today);
        expect(a.meta.trend_latest).toBe(
            Math.round(a.series[a.series.length - 1]!.trend_g / 100) / 10,
        );
        // −70 g/week ⇒ −0.07 kg/week.
        expect(a.meta.weekly_rate).toBeCloseTo(-0.07, 2);
        expect(a.meta.weekly_rate).toBe(rateInUnit(a.rate_g!, "kg"));
        for (const d of a.meta.daily) {
            expect(Math.round(d.weight * 10) / 10).toBe(d.weight);
        }
    });

    test("pounds", () => {
        const a = analyzeWeightHistory(
            [{ weight_g: 45_359.237, logged_at: "2026-10-01T08:00:00Z" }],
            "UTC",
            "lb",
            "2026-10-04",
        );
        expect(a.meta.unit).toBe("lb");
        expect(a.meta.daily).toEqual([
            { date: "2026-10-01", weight: 100, trend: 100 },
        ]);
        expect(a.meta.weekly_rate).toBeNull();
    });
});
