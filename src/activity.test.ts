import { describe, expect, test } from "bun:test";
import {
    activityDayLine,
    activityRangeLine,
    activityTrendsLine,
    formatKcal,
    ACTIVE_KCAL_MAX,
    ACTIVE_KCAL_MIN,
    ACTIVITY_CREDIT_DEFAULT_PCT,
    activeKcalError,
    activityByDate,
    activityCreditPct,
    activityIdempotencyKey,
    activityMetaFromDays,
    buildActivityMeta,
    countedActivity,
    creditPctError,
    creditedKcal,
    deficitVsGoal,
    netIntakeKcal,
    sumActivity,
    type ActivityEntry,
} from "./activity.js";

function entry(
    logged_at: string,
    kcal: number,
    credit_pct: number,
): ActivityEntry {
    return { logged_at, kcal, credit_pct };
}

describe("bounds", () => {
    test("kcal runs from 1 to 10000 as whole numbers", () => {
        expect(ACTIVE_KCAL_MIN).toBe(1);
        expect(ACTIVE_KCAL_MAX).toBe(10_000);
        expect(activeKcalError(1)).toBeNull();
        expect(activeKcalError(10_000)).toBeNull();
        expect(activeKcalError(0)).not.toBeNull();
        expect(activeKcalError(10_001)).not.toBeNull();
        expect(activeKcalError(12.5)).not.toBeNull();
        expect(activeKcalError(Number.NaN)).not.toBeNull();
    });

    test("a below-range kcal gets the range alone; an above-range one also gets the one-period hint", () => {
        expect(activeKcalError(0)).toBe(
            "kcal must be between 1 and 10000 (got 0).",
        );
        expect(activeKcalError(-5)).toBe(
            "kcal must be between 1 and 10000 (got -5).",
        );
        expect(activeKcalError(10_001)).toBe(
            "kcal must be between 1 and 10000 (got 10001). Log one workout or activity period per entry.",
        );
    });

    test("credit percentage runs from 0 to 100 as whole numbers", () => {
        expect(creditPctError(0)).toBeNull();
        expect(creditPctError(100)).toBeNull();
        expect(creditPctError(-1)).not.toBeNull();
        expect(creditPctError(101)).not.toBeNull();
        expect(creditPctError(50.5)).not.toBeNull();
    });
});

describe("credit share", () => {
    test("null, out of range and non-integer stored values read as the default 100", () => {
        expect(ACTIVITY_CREDIT_DEFAULT_PCT).toBe(100);
        expect(activityCreditPct(null)).toBe(100);
        expect(activityCreditPct(undefined)).toBe(100);
        expect(activityCreditPct(150)).toBe(100);
        expect(activityCreditPct(-3)).toBe(100);
        expect(activityCreditPct(40.5)).toBe(100);
    });

    test("a stored whole percentage is kept, including 0", () => {
        expect(activityCreditPct(0)).toBe(0);
        expect(activityCreditPct(80)).toBe(80);
    });

    test("credited kcal is kcal times the share, rounded once", () => {
        expect(creditedKcal(400, 80)).toBe(320);
        expect(creditedKcal(333, 50)).toBe(167);
        expect(creditedKcal(400, 0)).toBe(0);
        expect(creditedKcal(400, 100)).toBe(400);
    });
});

describe("day totals", () => {
    test("burned is the plain sum, credited is the exact sum rounded once", () => {
        // Each entry's credit is 1.5. Rounding each one first would give 2 + 2
        // = 4; the day's exact credit is 1.5 + 1.5 = 3, rounded once to 3.
        const totals = sumActivity([
            entry("2026-06-20T10:00:00Z", 3, 50),
            entry("2026-06-20T12:00:00Z", 3, 50),
        ]);
        expect(totals).toEqual({ burned_kcal: 6, credited_kcal: 3 });
    });

    test("an empty set is zero on both figures", () => {
        expect(sumActivity([])).toEqual({ burned_kcal: 0, credited_kcal: 0 });
    });

    test("net intake and the deficit against the goal", () => {
        expect(netIntakeKcal(2000, 320)).toBe(1680);
        expect(deficitVsGoal(2000, 1680)).toBe(320);
        expect(deficitVsGoal(2000, 2100)).toBe(-100);
    });

    test("activityByDate buckets by the local day in the given zone", () => {
        // 23:30 UTC is already the next day in Tokyo.
        const byDay = activityByDate(
            [
                entry("2026-06-20T23:30:00.000Z", 200, 100),
                entry("2026-06-20T08:00:00.000Z", 100, 50),
            ],
            "Asia/Tokyo",
        );
        expect(byDay.get("2026-06-21")).toEqual({
            burned_kcal: 200,
            credited_kcal: 200,
        });
        expect(byDay.get("2026-06-20")).toEqual({
            burned_kcal: 100,
            credited_kcal: 50,
        });
        expect(byDay.has("2026-06-22")).toBe(false);
    });
});

describe("buildActivityMeta", () => {
    test("returns undefined when there is no activity, so the key is omitted", () => {
        expect(buildActivityMeta([], "UTC")).toBeUndefined();
    });

    test("lists only days with activity, ascending by date, in the payload shape", () => {
        const meta = buildActivityMeta(
            [
                entry("2026-06-22T09:00:00Z", 300, 80),
                entry("2026-06-20T09:00:00Z", 400, 80),
                entry("2026-06-20T18:00:00Z", 100, 100),
            ],
            "UTC",
        );
        expect(meta).toEqual({
            v: 1,
            days: [
                { date: "2026-06-20", burned_kcal: 500, credited_kcal: 420 },
                { date: "2026-06-22", burned_kcal: 300, credited_kcal: 240 },
            ],
        });
    });

    test("uses the account timezone when deciding which day a row falls on", () => {
        const meta = buildActivityMeta(
            [entry("2026-06-20T23:30:00.000Z", 250, 100)],
            "Asia/Tokyo",
        );
        expect(meta?.days.map((d) => d.date)).toEqual(["2026-06-21"]);
    });
});

describe("activityMetaFromDays", () => {
    test("is undefined for an empty map, and otherwise matches buildActivityMeta on the same grouping", () => {
        expect(activityMetaFromDays(new Map())).toBeUndefined();
        const entries = [
            entry("2026-07-03T10:00:00.000Z", 300, 80),
            entry("2026-07-01T10:00:00.000Z", 200, 100),
            entry("2026-07-03T18:00:00.000Z", 100, 100),
        ];
        const byDay = activityByDate(entries, "UTC");
        expect(activityMetaFromDays(byDay)).toEqual(
            buildActivityMeta(entries, "UTC"),
        );
        expect(activityMetaFromDays(byDay)).toEqual({
            v: 1,
            days: [
                { date: "2026-07-01", burned_kcal: 200, credited_kcal: 200 },
                { date: "2026-07-03", burned_kcal: 400, credited_kcal: 340 },
            ],
        });
    });
});

describe("activityIdempotencyKey", () => {
    test("is an auto: key derived from the parts, stable across calls", () => {
        const a = activityIdempotencyKey([
            "u1",
            400,
            null,
            "2026-06-20T10:00:00Z",
        ]);
        const b = activityIdempotencyKey([
            "u1",
            400,
            null,
            "2026-06-20T10:00:00Z",
        ]);
        expect(a).toBe(b);
        expect(a).toMatch(/^auto:[0-9a-f]{64}$/);
    });

    test("differs when any part differs, including the note and the kcal", () => {
        const base = activityIdempotencyKey(["u1", 400, null, "t"]);
        expect(activityIdempotencyKey(["u1", 401, null, "t"])).not.toBe(base);
        expect(activityIdempotencyKey(["u1", 400, "run", "t"])).not.toBe(base);
        expect(activityIdempotencyKey(["u2", 400, null, "t"])).not.toBe(base);
    });
});

describe("read-path activity lines", () => {
    const burned = { burned_kcal: 400, credited_kcal: 320 };

    test("a day line reads under, over and at the goal", () => {
        expect(
            activityDayLine({
                totals: burned,
                intakeKcal: 2100,
                goalKcal: 2000,
            }),
        ).toBe(
            "Active calories: burned 400 kcal, credited 320 (80%). Net intake 1,780 kcal (220 under the 2,000 goal).",
        );
        expect(
            activityDayLine({
                totals: burned,
                intakeKcal: 2400,
                goalKcal: 2000,
            }),
        ).toContain("Net intake 2,080 kcal (80 over the 2,000 goal).");
        expect(
            activityDayLine({
                totals: burned,
                intakeKcal: 2320,
                goalKcal: 2000,
            }),
        ).toContain("Net intake 2,000 kcal (at the 2,000 goal).");
    });

    test("a day line without a goal names no goal, and without meals names no net", () => {
        expect(
            activityDayLine({
                totals: burned,
                intakeKcal: 1500,
                goalKcal: null,
            }),
        ).toBe(
            "Active calories: burned 400 kcal, credited 320 (80%). Net intake 1,180 kcal.",
        );
        const none = activityDayLine({
            totals: burned,
            intakeKcal: null,
            goalKcal: 2000,
        });
        expect(none).toBe(
            "Active calories: burned 400 kcal, credited 320 (80%). No meals logged, so there is no net intake to report.",
        );
        expect(none).not.toMatch(/net intake \d/i);
    });

    test("nothing in the lines says 'earned'", () => {
        const lines = [
            activityDayLine({ totals: burned, intakeKcal: 1, goalKcal: 2 }),
            activityRangeLine({
                totals: burned,
                activeDays: 1,
                daysInRange: 1,
            }),
            activityTrendsLine({
                totals: burned,
                windowDays: 2,
                mealDays: [{ intakeKcal: 1, creditedKcal: 1 }],
            }),
        ];
        for (const line of lines) expect(line).not.toMatch(/earn/i);
    });

    test("a range line counts days in the singular and averages over every day in range", () => {
        expect(
            activityRangeLine({
                totals: burned,
                activeDays: 1,
                daysInRange: 4,
            }),
        ).toBe(
            "Active calories: burned 400 kcal, credited 320 (80%) over 1 day with activity. Daily average over the 4 days in range: burned 100 kcal, credited 80 kcal.",
        );
    });

    test("a trends line averages burned and credited over every calendar day, and net over the meal days only", () => {
        // Three meal days out of seven. Intake 2000 + 2400 + 1600 = 6000, and
        // credited on those days 300 + 0 + 50 = 350 (the 400 on the day with
        // no meal is not netted). Net = (6000 - 350) / 3 = 1,883.
        expect(
            activityTrendsLine({
                totals: { burned_kcal: 700, credited_kcal: 750 },
                windowDays: 7,
                mealDays: [
                    { intakeKcal: 2000, creditedKcal: 300 },
                    { intakeKcal: 2400, creditedKcal: 0 },
                    { intakeKcal: 1600, creditedKcal: 50 },
                ],
            }),
        ).toBe(
            "Active calories over the last 7 days, averaged over all 7 calendar days: burned avg 100 kcal/day, credited avg 107 kcal/day. Net intake avg 1,883 kcal/day over the 3 days with a meal (intake minus that day's credited activity).",
        );
    });

    test("a trends line with no meal day omits the net clause, and says 'day' in the singular", () => {
        const none = activityTrendsLine({
            totals: { burned_kcal: 200, credited_kcal: 100 },
            windowDays: 4,
            mealDays: [],
        });
        expect(none).toBe(
            "Active calories over the last 4 days, averaged over all 4 calendar days: burned avg 50 kcal/day, credited avg 25 kcal/day.",
        );
        expect(none).not.toMatch(/net/i);
        const one = activityTrendsLine({
            totals: { burned_kcal: 200, credited_kcal: 100 },
            windowDays: 4,
            mealDays: [{ intakeKcal: 1500, creditedKcal: 100 }],
        });
        expect(one).toContain(
            "Net intake avg 1,400 kcal/day over the 1 day with a meal",
        );
    });

    test("formatKcal rounds and groups thousands", () => {
        expect(formatKcal(1780.4)).toBe("1,780");
        expect(formatKcal(12345.6)).toBe("12,346");
        expect(formatKcal(0)).toBe("0");
    });
});

describe("countedActivity", () => {
    const tz = "Europe/Kyiv";
    const manual = (logged_at: string, kcal: number) => ({
        logged_at,
        kcal,
        credit_pct: 100,
        source: null,
    });
    const health = (logged_at: string, kcal: number) => ({
        logged_at,
        kcal,
        credit_pct: 100,
        source: "apple_health",
    });

    test("an Apple Health day total stands for its whole local day", () => {
        const rows = [
            manual("2026-11-01T06:00:00Z", 300),
            health("2026-11-01T10:00:00Z", 520),
            manual("2026-11-01T18:00:00Z", 120),
            manual("2026-11-02T06:00:00Z", 250),
        ];
        const counted = countedActivity(rows, tz);
        expect(counted).toEqual([rows[1]!, rows[3]!]);
        expect(activityByDate(counted, tz)).toEqual(
            new Map([
                ["2026-11-01", { burned_kcal: 520, credited_kcal: 520 }],
                ["2026-11-02", { burned_kcal: 250, credited_kcal: 250 }],
            ]),
        );
    });

    test("days are local: a manual entry late on the day before still counts", () => {
        // 23:30 on 2026-10-31 in Kyiv is 21:30Z.
        const rows = [
            manual("2026-10-31T21:30:00Z", 200),
            health("2026-11-01T10:00:00Z", 400),
        ];
        expect(countedActivity(rows, tz)).toEqual(rows);
    });

    test("without Health rows everything counts, and rows without source too", () => {
        const rows = [
            manual("2026-11-01T06:00:00Z", 300),
            { logged_at: "2026-11-01T07:00:00Z", kcal: 5, credit_pct: 50 },
        ];
        expect(countedActivity(rows, tz)).toEqual(rows);
    });
});
