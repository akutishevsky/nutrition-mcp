import { describe, expect, test } from "bun:test";
import { assembleEntrySeed, type ChatSeedDependencies } from "./seeds.js";

const totals = {
    calories: 640,
    proteinG: 41,
    carbsG: 70,
    fatG: 18,
    fiberG: 6,
};

function deps(
    partial: Partial<ChatSeedDependencies> = {},
): ChatSeedDependencies {
    return {
        profile: async () => ({ timezone: "UTC" }),
        today: async () =>
            ({
                totals,
                meals: [
                    {
                        description: "Eggs and toast",
                        meal_type: "breakfast",
                        calories: 320,
                    },
                    {
                        description: "Chicken salad",
                        meal_type: "lunch",
                        calories: 320,
                    },
                ],
            }) as never,
        goals: async () =>
            ({
                daily_calories: 2000,
                daily_protein_g: null,
                daily_carbs_g: null,
                daily_fat_g: null,
                daily_fiber_g: null,
            }) as never,
        history: async () =>
            ({
                totals: { ...totals, calories: 9100 },
                meals: [{ description: "Soup" }, { description: "Pasta" }],
                endDate: "2026-11-10",
            }) as never,
        pantry: async () =>
            ({
                items: [
                    {
                        name: "Chicken thighs",
                        quantity: 2,
                        unit: "lb",
                        stock_state: "in_stock",
                        location: "fridge",
                    },
                    {
                        name: "Spinach",
                        quantity: 1,
                        unit: "bag",
                        stock_state: "in_stock",
                        location: "fridge",
                    },
                ],
            }) as never,
        plan: async () => [] as never,
        ...partial,
    };
}

describe("chat v2 entry seeds", () => {
    test("today: summary, opener, and data come from the live workspace", async () => {
        const seed = await assembleEntrySeed("user-1", "today", deps());
        expect(seed.surface).toBe("today");
        expect(seed.summary).toContain("640 kcal");
        expect(seed.summary).toContain("2 meals");
        expect(seed.summary).toContain("2,000 kcal");
        expect(seed.opener).toContain("logged 2 meals");
        expect(seed.starters.length).toBeGreaterThan(0);
        const data = seed.data as { meals: unknown[]; totals: unknown };
        expect(data.meals).toHaveLength(2);
        expect(data.totals).toEqual(totals);
    });

    test("meal_plan: an empty week reports every day as a gap", async () => {
        const seed = await assembleEntrySeed("user-1", "meal_plan", deps());
        expect(seed.summary).toContain("0 of 7 days");
        expect(seed.opener.toLowerCase()).toContain("gap");
        const data = seed.data as {
            days: Array<{ entries: unknown[] }>;
        };
        expect(data.days).toHaveLength(7);
        expect(data.days.every((day) => day.entries.length === 0)).toBe(true);
    });

    test("pantry: names the items on hand", async () => {
        const seed = await assembleEntrySeed("user-1", "pantry", deps());
        expect(seed.summary).toContain("2 items on hand");
        expect(seed.summary).toContain("Chicken thighs");
        expect(seed.opener).toContain("Spinach");
        const data = seed.data as { items: Array<{ name: string }> };
        expect(data.items.map((item) => item.name)).toEqual([
            "Chicken thighs",
            "Spinach",
        ]);
    });

    test("insights: summarizes the last seven days", async () => {
        const seed = await assembleEntrySeed("user-1", "insights", deps());
        expect(seed.summary).toContain("Last 7 days");
        expect(seed.summary).toContain("9,100 kcal");
        expect(seed.summary).toContain("2 meals");
        expect(seed.starters).toContain("Explain my week");
    });

    test("a failing gatherer degrades the seed instead of throwing", async () => {
        const seed = await assembleEntrySeed(
            "user-1",
            "pantry",
            deps({
                pantry: async () => {
                    throw new Error("pantry unavailable");
                },
            }),
        );
        expect(seed.surface).toBe("pantry");
        expect(seed.summary).toContain("could not be read");
        expect(seed.starters.length).toBeGreaterThan(0);
    });
});
