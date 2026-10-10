import { test, expect, describe } from "bun:test";
import {
    buildSaturatedFatMeta,
    dayTransFat,
    daySaturatedFat,
    roundedSaturatedFat,
    saturatedAboveFatNote,
    saturatedFatExtra,
    transFatExtra,
} from "./saturated-fat.js";
import type { Meal } from "./supabase.js";

function meal(over: Partial<Meal>): Meal {
    return {
        id: "00000000-0000-4000-8000-000000000001",
        user_id: "u1",
        logged_at: "2026-07-26T12:00:00.000Z",
        meal_type: "lunch",
        description: "Test",
        calories: 300,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        ...over,
    } as Meal;
}

describe("daySaturatedFat", () => {
    test("null when no meal recorded it, a sum when any did", () => {
        expect(daySaturatedFat([meal({})])).toBeNull();
        expect(
            daySaturatedFat([
                meal({ saturated_fat_g: 4 }),
                meal({ saturated_fat_g: null }),
                meal({ saturated_fat_g: 2.5 }),
            ]),
        ).toBe(6.5);
    });

    test("an explicit zero is data, not absence", () => {
        expect(daySaturatedFat([meal({ saturated_fat_g: 0 })])).toBe(0);
    });
});

test("roundedSaturatedFat rounds to one decimal and keeps null", () => {
    expect(roundedSaturatedFat(meal({ saturated_fat_g: 3.04 }))).toBe(3);
    expect(roundedSaturatedFat(meal({ saturated_fat_g: 3.06 }))).toBe(3.1);
    expect(roundedSaturatedFat(meal({ saturated_fat_g: null }))).toBeNull();
});

describe("dayTransFat", () => {
    test("null when no meal recorded it, a sum when any did", () => {
        expect(dayTransFat([meal({ trans_fat_g: null })])).toBeNull();
        expect(
            dayTransFat([
                meal({ trans_fat_g: 0.2 }),
                meal({ trans_fat_g: 0.1 }),
            ]),
        ).toBeCloseTo(0.3);
    });
});

describe("buildSaturatedFatMeta", () => {
    test("v1 with the goal, the days and the meals keyed by id", () => {
        const a = meal({ id: "a", saturated_fat_g: 5 });
        const b = meal({ id: "b", saturated_fat_g: null });
        expect(
            buildSaturatedFatMeta({
                goal: 20,
                days: { "2026-07-26": [a, b] },
                meals: [a, b],
            }),
        ).toEqual({
            v: 1,
            goal: 20,
            days: { "2026-07-26": 5 },
            meals: { a: 5, b: null },
            trans: {
                days: { "2026-07-26": null },
                meals: { a: null, b: null },
            },
        });
    });

    test("trans fat rides along with no goal, null when not recorded", () => {
        const a = meal({ id: "a", saturated_fat_g: 5, trans_fat_g: 0.34 });
        const b = meal({ id: "b", saturated_fat_g: 1, trans_fat_g: null });
        const meta = buildSaturatedFatMeta({
            goal: null,
            days: { "2026-07-26": [a, b] },
            meals: [a, b],
        });
        expect(meta.trans).toEqual({
            days: { "2026-07-26": 0.34 },
            meals: { a: 0.3, b: null },
        });
        expect(meta.trans).not.toHaveProperty("goal");
    });

    test("goal stays null when unset, and 0 is a real ceiling", () => {
        expect(buildSaturatedFatMeta({ goal: undefined }).goal).toBeNull();
        expect(buildSaturatedFatMeta({ goal: 0 }).goal).toBe(0);
    });
});

describe("saturatedAboveFatNote", () => {
    test("warns when saturated fat is above total fat beyond 0.1 g", () => {
        expect(
            saturatedAboveFatNote({ saturated_fat_g: 12, fat_g: 10 }),
        ).toContain("more than total fat");
    });

    test("the 0.1 g rounding tolerance and unrecorded values stay silent", () => {
        expect(
            saturatedAboveFatNote({ saturated_fat_g: 10.1, fat_g: 10 }),
        ).toBeNull();
        expect(
            saturatedAboveFatNote({ saturated_fat_g: 12, fat_g: null }),
        ).toBeNull();
        expect(
            saturatedAboveFatNote({ saturated_fat_g: null, fat_g: 10 }),
        ).toBeNull();
    });
});

describe("summary extras and contributors", () => {
    const ids = ["a", "b", "c", "d"].map(
        (c) => `00000000-0000-4000-8000-00000000000${c}`,
    );
    // Four meals; the kept rows are the first two, so the top saturated meal
    // ("d") is the one the kept rows miss.
    const meals = [
        meal({ id: ids[0], saturated_fat_g: 2, trans_fat_g: 0 }),
        meal({ id: ids[1], saturated_fat_g: 3, trans_fat_g: null }),
        meal({ id: ids[2], saturated_fat_g: null, trans_fat_g: 0.4 }),
        meal({ id: ids[3], saturated_fat_g: 9.04, trans_fat_g: 1.2 }),
    ];
    const rows = meals.map((m, i) => ({
        description: `meal ${i}`,
        meal_type: "lunch",
        date: "2026-07-26",
    }));
    const kept = [0, 1];

    test("extra lists the top meals the kept rows miss, rounded, > 0 only", () => {
        expect(saturatedFatExtra(meals, rows, kept, 8)).toEqual([
            {
                description: "meal 3",
                meal_type: "lunch",
                date: "2026-07-26",
                saturated_fat_g: 9,
            },
        ]);
        expect(transFatExtra(meals, rows, kept, 8)).toEqual([
            {
                description: "meal 3",
                meal_type: "lunch",
                date: "2026-07-26",
                trans_fat_g: 1.2,
            },
            {
                description: "meal 2",
                meal_type: "lunch",
                date: "2026-07-26",
                trans_fat_g: 0.4,
            },
        ]);
    });

    test("contributors count the meals with a positive value over the window", () => {
        const meta = buildSaturatedFatMeta({
            goal: 20,
            meals: [meals[0]!, meals[1]!],
            contributorsOf: meals,
            extra: saturatedFatExtra(meals, rows, kept, 8),
            transExtra: transFatExtra(meals, rows, kept, 8),
        });
        expect(meta.contributors).toBe(3);
        expect(meta.trans?.contributors).toBe(2);
        expect(meta.extra?.length).toBe(1);
        expect(meta.trans?.extra?.length).toBe(2);
    });

    test("without contributorsOf or extra the payload keeps its old shape", () => {
        const meta = buildSaturatedFatMeta({ goal: null, meals: [meals[0]!] });
        expect(meta).not.toHaveProperty("contributors");
        expect(meta).not.toHaveProperty("extra");
        expect(meta.trans).not.toHaveProperty("contributors");
        expect(meta.trans).not.toHaveProperty("extra");
    });
});
