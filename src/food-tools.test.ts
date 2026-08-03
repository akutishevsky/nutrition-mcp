import { describe, expect, test } from "bun:test";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerFoodTools, serializeFoodCandidate } from "./food-tools.js";
import type { FoodCandidate } from "./food-providers/types.js";

function candidate(): FoodCandidate {
    return {
        provider: "open_food_facts",
        providerFoodId: "012345678905",
        name: "Example Yogurt",
        brand: "Example",
        barcode: "012345678905",
        dataKind: "packaged",
        nutrientsPer100g: {
            calories: 60,
            protein_g: 10,
            sodium_mg: 40,
        },
        portions: [
            {
                id: "serving",
                amount: 1,
                unit: "container",
                label: "1 container",
                gramWeight: 170,
                nutrients: {
                    calories: 102,
                    protein_g: 17,
                    sodium_mg: 68,
                },
            },
        ],
        attribution: {
            label: "Open Food Facts",
            url: "https://world.openfoodfacts.org/product/012345678905",
            license: "Open Database License 1.0",
        },
        confidence: 0.9,
    };
}

describe("food tool serialization", () => {
    test("emits every nullable nutrient key required by the output schema", () => {
        const serialized = serializeFoodCandidate(candidate());
        expect(serialized.nutrients_per_100g).toEqual({
            calories: 60,
            protein_g: 10,
            carbs_g: null,
            fat_g: null,
            fiber_g: null,
            sugar_g: null,
            alcohol_g: null,
            sodium_mg: 40,
            saturated_fat_g: null,
            cholesterol_mg: null,
            potassium_mg: null,
        });
        expect(serialized.portions[0]?.nutrients.sodium_mg).toBe(68);
        expect(serialized.candidate_id).toBe(
            "open_food_facts:012345678905",
        );
    });

    test("registers three non-conflicting provider tools", () => {
        const server = new McpServer({ name: "test", version: "1" });
        expect(() => registerFoodTools(server, "user-test")).not.toThrow();
    });
});
