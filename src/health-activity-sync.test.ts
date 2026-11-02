import { describe, expect, test } from "bun:test";
import {
    HEALTH_ACTIVITY_SHORTCUT_NAME,
    HEALTH_ACTIVITY_WINDOW_DAYS,
    parseActivityBody,
    planActivityWrites,
} from "./health-activity-sync.js";

// 2026-11-02 23:30 in Kyiv (UTC+2 after the October change).
const NOW = new Date("2026-11-02T21:30:00Z");
const KYIV = "Europe/Kyiv";

describe("parseActivityBody", () => {
    test("reads the body the shortcut builds", () => {
        const r = parseActivityBody({
            tz: "Europe/Kyiv",
            days: [
                { date: "2026-11-02", active_kcal: 412 },
                { date: "2026-11-01", active_kcal: "380" },
                { date: "2026-10-31", active_kcal: 0 },
            ],
        });
        expect(r).toEqual({
            ok: true,
            value: {
                tz: "Europe/Kyiv",
                days: [
                    { date: "2026-11-02", kcal: 412 },
                    { date: "2026-11-01", kcal: 380 },
                    { date: "2026-10-31", kcal: 0 },
                ],
            },
        });
    });

    test("an unknown or missing zone is null, not a refusal", () => {
        for (const tz of [undefined, "", "Mars/Olympus", 42]) {
            const r = parseActivityBody({
                tz,
                days: [{ date: "2026-11-02", active_kcal: 1 }],
            });
            expect(r.ok && r.value.tz).toBeNull();
        }
    });

    test("rounds a fractional figure", () => {
        const r = parseActivityBody({
            days: [{ date: "2026-11-02", active_kcal: 99.5 }],
        });
        expect(r.ok && r.value.days[0]!.kcal).toBe(100);
    });

    test("refuses malformed shapes", () => {
        for (const body of [
            null,
            [],
            {},
            { days: "x" },
            { days: [] },
            { days: [null] },
            { days: [{ date: "2026-02-30", active_kcal: 1 }] },
            { days: [{ date: "2026-11-02" }] },
            { days: [{ date: "2026-11-02", active_kcal: "1,234" }] },
            { days: [{ date: "2026-11-02", active_kcal: -5 }] },
            { days: [{ date: "2026-11-02", active_kcal: Infinity }] },
        ]) {
            expect(parseActivityBody(body).ok).toBe(false);
        }
    });
});

describe("planActivityWrites", () => {
    test("accepts today and the 6 days before, in the account's zone", () => {
        const days = [
            "2026-10-26",
            "2026-10-27",
            "2026-10-28",
            "2026-10-29",
            "2026-10-30",
            "2026-10-31",
            "2026-11-01",
            "2026-11-02",
        ].map((date, i) => ({ date, kcal: 100 + i }));
        const plan = planActivityWrites({
            days,
            now: NOW,
            tz: KYIV,
            creditPct: 100,
        });
        expect(HEALTH_ACTIVITY_WINDOW_DAYS).toBe(7);
        expect(plan.writes.map((w) => w.date)).toEqual([
            "2026-10-27",
            "2026-10-28",
            "2026-10-29",
            "2026-10-30",
            "2026-10-31",
            "2026-11-01",
            "2026-11-02",
        ]);
        expect(plan.skipped).toEqual([
            { date: "2026-10-26", reason: "outside_window" },
        ]);
        expect(plan.through).toBe("2026-11-02");
    });

    test("stamps each day at local noon, across a DST change", () => {
        const plan = planActivityWrites({
            days: [
                { date: "2026-10-24", kcal: 1 },
                { date: "2026-10-26", kcal: 1 },
            ],
            now: new Date("2026-10-26T12:00:00Z"),
            tz: KYIV,
            creditPct: 80,
        });
        expect(plan.writes).toEqual([
            {
                date: "2026-10-24",
                kcal: 1,
                logged_at: "2026-10-24T09:00:00.000Z",
                credit_pct: 80,
            },
            {
                date: "2026-10-26",
                kcal: 1,
                logged_at: "2026-10-26T10:00:00.000Z",
                credit_pct: 80,
            },
        ]);
    });

    test("0 writes nothing; a date sent twice keeps its last value", () => {
        const plan = planActivityWrites({
            days: [
                { date: "2026-11-02", kcal: 50 },
                { date: "2026-11-01", kcal: 0 },
                { date: "2026-11-02", kcal: 75 },
            ],
            now: NOW,
            tz: KYIV,
            creditPct: 100,
        });
        expect(plan.writes.map((w) => [w.date, w.kcal])).toEqual([
            ["2026-11-02", 75],
        ]);
        expect(plan.skipped).toEqual([{ date: "2026-11-01", reason: "zero" }]);
    });

    test("an implausible day is skipped and the rest written", () => {
        const plan = planActivityWrites({
            days: [
                { date: "2026-11-02", kcal: 10_001 },
                { date: "2026-11-01", kcal: 10_000 },
            ],
            now: NOW,
            tz: KYIV,
            creditPct: 100,
        });
        expect(plan.writes.map((w) => w.date)).toEqual(["2026-11-01"]);
        expect(plan.skipped).toEqual([
            { date: "2026-11-02", reason: "too_high" },
        ]);
    });

    test("through is null when nothing fell in the window", () => {
        const plan = planActivityWrites({
            days: [{ date: "2027-01-01", kcal: 5 }],
            now: NOW,
            tz: KYIV,
            creditPct: 100,
        });
        expect(plan.writes).toEqual([]);
        expect(plan.through).toBeNull();
    });

    test("the shortcut name the callback reopens", () => {
        expect(HEALTH_ACTIVITY_SHORTCUT_NAME).toBe("Nutrition MCP Activity");
    });
});
