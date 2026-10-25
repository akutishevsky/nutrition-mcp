import { test, expect, describe } from "bun:test";
import {
    buildSodiumMeta,
    daySodium,
    roundedSodium,
    sodiumExtra,
} from "./sodium.js";
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

describe("daySodium", () => {
    test("null when no meal recorded it, a sum when any did", () => {
        expect(daySodium([meal({})])).toBeNull();
        expect(
            daySodium([
                meal({ sodium_mg: 400 }),
                meal({ sodium_mg: null }),
                meal({ sodium_mg: 250.5 }),
            ]),
        ).toBe(650.5);
    });

    test("an explicit zero is data, not absence", () => {
        expect(daySodium([meal({ sodium_mg: 0 })])).toBe(0);
    });
});

test("roundedSodium rounds to one decimal and keeps null", () => {
    expect(roundedSodium(meal({ sodium_mg: 410.04 }))).toBe(410);
    expect(roundedSodium(meal({ sodium_mg: 410.06 }))).toBe(410.1);
    expect(roundedSodium(meal({ sodium_mg: null }))).toBeNull();
    expect(roundedSodium(meal({}))).toBeNull();
});

describe("buildSodiumMeta", () => {
    test("days and meals keyed as saturated fat's are, null when not recorded", () => {
        const a = meal({ id: "a", sodium_mg: 800 });
        const b = meal({ id: "b", sodium_mg: null });
        expect(
            buildSodiumMeta({
                goal: 2300,
                days: { "2026-07-26": [a, b], "2026-07-27": [b] },
                meals: [a, b],
            }),
        ).toEqual({
            v: 1,
            goal: 2300,
            days: { "2026-07-26": 800, "2026-07-27": null },
            meals: { a: 800, b: null },
        });
    });

    test("goal stays null when unset, and 0 is a real ceiling", () => {
        expect(buildSodiumMeta({ goal: undefined }).goal).toBeNull();
        expect(buildSodiumMeta({ goal: null }).goal).toBeNull();
        expect(buildSodiumMeta({ goal: 0 }).goal).toBe(0);
    });

    test("only the requested parts are present", () => {
        expect(buildSodiumMeta({ goal: 1500 })).toEqual({ v: 1, goal: 1500 });
        expect(buildSodiumMeta({ goal: null, days: {}, meals: [] })).toEqual({
            v: 1,
            goal: null,
            days: {},
            meals: {},
        });
    });
});

describe("summary extras and contributors", () => {
    const ids = ["a", "b", "c", "d"].map(
        (c) => `00000000-0000-4000-8000-00000000000${c}`,
    );
    // Four meals; the kept rows are the first two, so the two saltiest meals
    // past them ("d", then "c") are the ones the kept rows miss.
    const meals = [
        meal({ id: ids[0], sodium_mg: 120 }),
        meal({ id: ids[1], sodium_mg: null }),
        meal({ id: ids[2], sodium_mg: 640 }),
        meal({ id: ids[3], sodium_mg: 1820.04 }),
    ];
    const rows = meals.map((m, i) => ({
        description: `meal ${i}`,
        meal_type: "lunch",
        date: "2026-07-26",
    }));
    const kept = [0, 1];

    test("extra lists the top meals the kept rows miss, rounded, > 0 only", () => {
        expect(sodiumExtra(meals, rows, kept, 8)).toEqual([
            {
                description: "meal 3",
                meal_type: "lunch",
                date: "2026-07-26",
                sodium_mg: 1820,
            },
            {
                description: "meal 2",
                meal_type: "lunch",
                date: "2026-07-26",
                sodium_mg: 640,
            },
        ]);
    });

    test("topN cuts before the kept rows are removed", () => {
        // Top 1 is meal 3, which is not kept: one extra row.
        expect(sodiumExtra(meals, rows, kept, 1)).toHaveLength(1);
        // Top 1 is meal 3 and it is kept: nothing extra.
        expect(sodiumExtra(meals, rows, [3], 1)).toEqual([]);
    });

    test("ties go to the earlier meal", () => {
        const tied = [meal({ sodium_mg: 300 }), meal({ sodium_mg: 300 })];
        const tiedRows = tied.map((_, i) => ({
            description: `t${i}`,
            meal_type: null,
            date: null,
        }));
        expect(
            sodiumExtra(tied, tiedRows, [], 1).map((r) => r.description),
        ).toEqual(["t0"]);
    });

    test("contributors count the meals with a positive value over the window", () => {
        const meta = buildSodiumMeta({
            goal: 2300,
            meals: [meals[0]!, meals[1]!],
            contributorsOf: meals,
            extra: sodiumExtra(meals, rows, kept, 8),
        });
        expect(meta.contributors).toBe(3);
        expect(meta.extra?.length).toBe(2);
    });

    test("without contributorsOf or extra the payload keeps its plain shape", () => {
        const meta = buildSodiumMeta({ goal: null, meals: [meals[0]!] });
        expect(meta).not.toHaveProperty("contributors");
        expect(meta).not.toHaveProperty("extra");
    });
});
