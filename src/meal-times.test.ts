import { describe, expect, test } from "bun:test";
import { buildMealTimesMeta, mealClockTime } from "./meal-times.js";

const meal = (id: string, logged_at: string) => ({ id, logged_at });

describe("buildMealTimesMeta", () => {
    test("times are local HH:MM in the given zone, in row order", () => {
        const rows = [
            meal("a", "2026-10-24T05:10:00Z"),
            meal("b", "2026-10-24T18:05:00Z"),
        ];
        expect(buildMealTimesMeta(rows, "Europe/Kyiv")).toEqual({
            v: 1,
            times: ["08:10", "21:05"],
        });
    });

    test("a late-evening meal keeps its local hour, never the UTC one", () => {
        // 21:00 in Kyiv is 18:00Z; the issue #68 shape.
        expect(
            mealClockTime(meal("a", "2026-10-24T18:00:00Z"), "Europe/Kyiv"),
        ).toBe("21:00");
        expect(mealClockTime(meal("a", "2026-10-24T00:30:00Z"), "UTC")).toBe(
            "00:30",
        );
    });

    test("current is the written meal's position, or null when absent", () => {
        const rows = [
            meal("a", "2026-10-24T08:00:00Z"),
            meal("b", "2026-10-24T09:00:00Z"),
            meal("c", "2026-10-24T07:00:00Z"),
        ];
        expect(buildMealTimesMeta(rows, "UTC", "b").current).toBe(1);
        expect(buildMealTimesMeta(rows, "UTC", "zzz").current).toBeNull();
        expect("current" in buildMealTimesMeta(rows, "UTC")).toBe(false);
    });

    test("no rows is an empty list", () => {
        expect(buildMealTimesMeta([], "UTC")).toEqual({ v: 1, times: [] });
    });
});
