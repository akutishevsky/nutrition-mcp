import { describe, expect, test } from "bun:test";
import {
    buildGoalDayMeta,
    GOAL_DAY_FOODS_PER_NUTRIENT,
    historyFoods,
    localClock,
} from "./goal-day.js";
import type { MealItemValues } from "./meal-items.js";
import type { Meal } from "./supabase.js";

let seq = 0;
function meal(over: Partial<Meal> = {}): Meal {
    seq += 1;
    return {
        id: `00000000-0000-4000-8000-${String(seq).padStart(12, "0")}`,
        user_id: "u1",
        logged_at: "2026-10-20T12:00:00Z",
        meal_type: "lunch",
        description: "Lunch",
        calories: 500,
        protein_g: 30,
        carbs_g: 50,
        fat_g: 15,
        fiber_g: 5,
        sugar_g: 5,
        added_sugar_g: 0,
        alcohol_g: null,
        caffeine_mg: null,
        notes: null,
        idempotency_key: null,
        saved_meal_id: null,
        ...over,
    };
}

function item(name: string, over: Partial<MealItemValues> = {}) {
    return {
        position: 1,
        name,
        amount: 100,
        unit: "g",
        calories: 150,
        protein_g: 20,
        carbs_g: 5,
        fat_g: 4,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        ...over,
    } as MealItemValues;
}

describe("historyFoods", () => {
    test("names a meal's ingredients when it has them, else the meal", () => {
        const withItems = meal({ description: "Bowl" });
        const plain = meal({ description: "Leftovers" });
        const foods = historyFoods(
            [withItems, plain],
            new Map([[withItems.id, [item("Chicken breast")]]]),
        );
        expect(foods.map((f) => f.name).sort()).toEqual([
            "Chicken breast",
            "Leftovers",
        ]);
        expect(foods.find((f) => f.name === "Chicken breast")).toMatchObject({
            amount: 100,
            unit: "g",
            protein_g: 20,
        });
    });

    test("never anything with alcohol, nor an overlong or nameless entry", () => {
        const foods = historyFoods(
            [
                meal({ description: "Beer", alcohol_g: 14, protein_g: 12 }),
                meal({ description: "x".repeat(61) }),
                meal({ description: "  " }),
            ],
            new Map(),
        );
        expect(foods).toEqual([]);
    });

    test("one entry per name, from its latest log", () => {
        const foods = historyFoods(
            [
                meal({
                    description: "Oats",
                    protein_g: 10,
                    logged_at: "2026-10-01T08:00:00Z",
                }),
                meal({
                    description: "oats",
                    protein_g: 14,
                    logged_at: "2026-10-20T08:00:00Z",
                }),
            ],
            new Map(),
        );
        expect(foods).toHaveLength(1);
        expect(foods[0]).toMatchObject({ name: "oats", protein_g: 14 });
    });

    test("capped per target nutrient", () => {
        const many = Array.from({ length: 20 }, (_, i) =>
            meal({
                description: `Food ${i}`,
                protein_g: 20 + i,
                fiber_g: 0,
                carbs_g: 0,
                fat_g: 0,
            }),
        );
        expect(historyFoods(many, new Map())).toHaveLength(
            GOAL_DAY_FOODS_PER_NUTRIENT,
        );
    });
});

describe("buildGoalDayMeta", () => {
    test("local clock, rows in order, water oldest first, foods only when given", () => {
        const meta = buildGoalDayMeta({
            meals: [meal({ logged_at: "2026-10-24T18:30:00Z", sugar_g: null })],
            water: [
                {
                    id: "w2",
                    user_id: "u1",
                    amount_ml: 250,
                    logged_at: "2026-10-24T12:00:00Z",
                    notes: null,
                    created_at: "",
                    idempotency_key: null,
                },
                {
                    id: "w1",
                    user_id: "u1",
                    amount_ml: 300,
                    logged_at: "2026-10-24T06:00:00Z",
                    notes: null,
                    created_at: "",
                    idempotency_key: null,
                },
            ],
            tz: "Europe/Kyiv",
            now: new Date("2026-10-24T19:05:00Z"),
        });
        expect(meta).toEqual({
            v: 1,
            now: "22:05",
            meals: [{ time: "21:30", missing: ["sugar_g"] }],
            water: [
                { time: "09:00", ml: 300 },
                { time: "15:00", ml: 250 },
            ],
        });
        expect(localClock("2026-10-24T21:00:00Z", "UTC")).toBe("21:00");
    });
});
