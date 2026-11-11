import { describe, expect, test } from "bun:test";
import {
    assembleCalendarMonthDays,
    parseCalendarMonth,
} from "./calendar-summary.js";

describe("parseCalendarMonth", () => {
    test("computes first/last/next boundaries, including leap years", () => {
        expect(parseCalendarMonth("2026-11")).toEqual({
            month: "2026-11",
            firstDate: "2026-11-01",
            lastDate: "2026-11-30",
            nextMonthFirstDate: "2026-12-01",
        });
        expect(parseCalendarMonth("2028-02").lastDate).toBe("2028-02-29");
        expect(parseCalendarMonth("2026-12").nextMonthFirstDate).toBe(
            "2027-01-01",
        );
    });

    test("rejects malformed months", () => {
        for (const bad of ["", "2026-13", "2026-00", "2026-1", "Nov 2026"]) {
            expect(() => parseCalendarMonth(bad)).toThrow(
                "Month must use YYYY-MM format",
            );
        }
    });
});

describe("assembleCalendarMonthDays", () => {
    test("merges per-kind counts into one sparse sorted day list", () => {
        const days = assembleCalendarMonthDays({
            meals: [
                { date: "2026-11-03", count: 2 },
                { date: "2026-11-01", count: 1 },
            ],
            water: [{ date: "2026-11-03", count: 3 }],
            weight: [{ date: "2026-11-09", count: 1 }],
        });
        expect(days).toEqual([
            { date: "2026-11-01", meals: 1, water: 0, weight: 0 },
            { date: "2026-11-03", meals: 2, water: 3, weight: 0 },
            { date: "2026-11-09", meals: 0, water: 0, weight: 1 },
        ]);
    });

    test("drops zero-count rows and empty input stays empty", () => {
        expect(
            assembleCalendarMonthDays({
                meals: [{ date: "2026-11-03", count: 0 }],
                water: [],
                weight: [],
            }),
        ).toEqual([]);
    });
});
