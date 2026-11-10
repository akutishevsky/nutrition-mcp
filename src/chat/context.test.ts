import { describe, expect, test } from "bun:test";
import { summarizeChatContext, type ChatContextData } from "./context.js";

function data(partial: Partial<ChatContextData> = {}): ChatContextData {
    return {
        date: "2026-11-10",
        timezone: "America/New_York",
        goals: {
            daily_calories: 2100,
            daily_protein_g: 140,
            daily_carbs_g: null,
            daily_fat_g: null,
            daily_fiber_g: null,
        },
        today: {
            totals: {
                calories: 640.25,
                proteinG: 41,
                carbsG: 70,
                fatG: 18,
                fiberG: 6,
            },
            meals: [
                { description: "Eggs", meal_type: "breakfast", calories: 320 },
            ],
        },
        pantry: [
            {
                name: "Rice",
                quantity: 2,
                unit: "lb",
                stock_state: "in_stock",
                location: "pantry",
            },
        ],
        recent: {
            days: [
                {
                    date: "2026-11-10",
                    calories: 1900,
                    proteinG: 120,
                    carbsG: 200,
                    fatG: 60,
                    mealCount: 9,
                },
            ],
            meals: ["Soup"],
        },
        ...partial,
    };
}

describe("S8 chat context summary", () => {
    test("includes every gathered section and rounds totals", () => {
        const summary = summarizeChatContext(data());
        expect(summary.sections).toEqual([
            "goals",
            "today",
            "pantry",
            "recent_history",
        ]);
        expect(summary.today?.totals.calories).toBe(640.3);
        expect(summary.goals?.daily_calories).toBe(2100);
    });

    test("absent sections are omitted, never fabricated", () => {
        const summary = summarizeChatContext(
            data({ pantry: null, recent: null, goals: null }),
        );
        expect(summary.sections).toEqual(["today"]);
        expect(summary.pantry).toBeNull();
        expect(summary.recent).toBeNull();
        expect(summary.goals).toBeNull();
    });

    test("caps pantry, today's meals, and recent meals at the bounds", () => {
        const big = data({
            pantry: Array.from({ length: 90 }, (_, i) => ({
                name: `Item ${i}`,
                quantity: 1,
                unit: "ct",
                stock_state: "in_stock",
                location: "pantry",
            })),
            today: {
                totals: {
                    calories: 0,
                    proteinG: 0,
                    carbsG: 0,
                    fatG: 0,
                    fiberG: 0,
                },
                meals: Array.from({ length: 30 }, (_, i) => ({
                    description: `Meal ${i}`,
                    meal_type: "lunch",
                    calories: 100,
                })),
            },
            recent: {
                days: [],
                meals: Array.from({ length: 40 }, (_, i) => `Old ${i}`),
            },
        });
        const summary = summarizeChatContext(big);
        expect(summary.pantry).toHaveLength(40);
        expect(summary.today?.meals).toHaveLength(12);
        expect(summary.recent?.meals).toHaveLength(14);
    });
});
