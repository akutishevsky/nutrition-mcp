import { describe, expect, test } from "bun:test";
import { aggregateStructuredMealItems } from "./repository.js";
import type { StructuredMealItemInput } from "./types.js";

function item(
    name: string,
    nutrients: StructuredMealItemInput["nutrients"],
): StructuredMealItemInput {
    return {
        name,
        nutrients,
        sourceType: "user_supplied",
    };
}

describe("structured meal aggregation", () => {
    test("sums reported parent nutrients and preserves unreported values", () => {
        expect(
            aggregateStructuredMealItems([
                item("Chicken", { calories: 200, protein_g: 35, fat_g: 5 }),
                item("Rice", { calories: 180, carbs_g: 40, protein_g: 4 }),
            ]),
        ).toEqual({
            calories: 380,
            protein_g: 39,
            carbs_g: 40,
            fat_g: 5,
        });
    });

    test("distinguishes a reported zero from an absent nutrient", () => {
        expect(
            aggregateStructuredMealItems([
                item("Zero-fat yogurt", { calories: 100, fat_g: 0 }),
            ]),
        ).toEqual({ calories: 100, fat_g: 0 });
    });

    test("rounds accumulated provider values deterministically", () => {
        expect(
            aggregateStructuredMealItems([
                item("A", { protein_g: 0.105 }),
                item("B", { protein_g: 0.105 }),
            ]).protein_g,
        ).toBe(0.21);
    });
});
