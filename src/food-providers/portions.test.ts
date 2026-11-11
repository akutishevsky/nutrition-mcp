import { describe, expect, test } from "bun:test";
import {
    isNonHeadlinePortion,
    naturalPortion,
    portionOptionLabel,
    sortPortionsNaturalFirst,
} from "./portions.js";
import type { FoodPortion } from "./types.js";

function portion(overrides: Partial<FoodPortion> = {}): FoodPortion {
    return {
        id: "portion",
        amount: 1,
        unit: "serving",
        label: "1 serving",
        gramWeight: 100,
        nutrients: { calories: 100 },
        ...overrides,
    };
}

/** Milk-shaped portion list, in the order USDA detail payloads carry. */
function milkPortions(): FoodPortion[] {
    return [
        portion({
            id: "100g",
            amount: 100,
            unit: "g",
            label: "100 g",
            gramWeight: 100,
        }),
        portion({
            id: "fl-oz",
            amount: 1,
            unit: "fl oz",
            label: "1 fl oz",
            gramWeight: 30.5,
        }),
        portion({
            id: "guideline",
            amount: 1,
            unit: "serving",
            label: "Guideline amount per fl oz of beverage",
            gramWeight: 30.5,
        }),
        portion({
            id: "cup",
            amount: 1,
            unit: "cup",
            label: "1 cup",
            gramWeight: 244,
        }),
        portion({
            id: "quantity-not-specified",
            amount: 1,
            unit: "serving",
            label: "Quantity not specified",
            gramWeight: 244,
        }),
    ];
}

describe("natural portion selection", () => {
    test("prefers a cup over fl oz, per-100g, and non-headline portions for milk-shaped data", () => {
        expect(naturalPortion(milkPortions())?.id).toBe("cup");
    });

    test("never headlines a guideline amount or quantity-not-specified portion", () => {
        for (const bad of ["guideline", "quantity-not-specified"]) {
            const picked = naturalPortion(
                milkPortions().filter((item) => item.id !== "cup"),
            );
            expect(picked?.id).not.toBe(bad);
        }
        expect(isNonHeadlinePortion(milkPortions()[2]!)).toBe(true);
        expect(isNonHeadlinePortion(milkPortions()[4]!)).toBe(true);
        expect(isNonHeadlinePortion(milkPortions()[3]!)).toBe(false);
    });

    test("returns undefined when only non-headline portions exist, so callers fall back to per-100g", () => {
        const onlyBad = milkPortions().filter(
            (item) =>
                item.id === "guideline" || item.id === "quantity-not-specified",
        );
        expect(naturalPortion(onlyBad)).toBeUndefined();
    });

    test("falls back to the per-100g portion when it is the only usable portion", () => {
        const only100 = milkPortions().filter((item) => item.id === "100g");
        expect(naturalPortion(only100)?.id).toBe("100g");
    });

    test("prefers the largest amount-1 household portion (cup before tbsp)", () => {
        const ranked = sortPortionsNaturalFirst([
            portion({
                id: "tbsp",
                unit: "tbsp",
                label: "1 tbsp",
                gramWeight: 15,
            }),
            portion({
                id: "cup",
                unit: "cup",
                label: "1 cup",
                gramWeight: 240,
            }),
        ]);
        expect(ranked.map((item) => item.id)).toEqual(["cup", "tbsp"]);
    });

    test("orders natural-first and keeps every portion (ordering only, nothing removed)", () => {
        const ranked = sortPortionsNaturalFirst(milkPortions());
        expect(ranked.map((item) => item.id)).toEqual([
            "cup",
            "fl-oz",
            "100g",
            "guideline",
            "quantity-not-specified",
        ]);
        expect(ranked).toHaveLength(milkPortions().length);
    });

    test("labels picker options with gram weight unless the label already carries it", () => {
        expect(
            portionOptionLabel(portion({ label: "1 cup", gramWeight: 244 })),
        ).toBe("1 cup · 244 g");
        expect(
            portionOptionLabel(portion({ label: "100 g", gramWeight: 100 })),
        ).toBe("100 g");
        expect(
            portionOptionLabel(
                portion({ label: "1 slice", gramWeight: undefined }),
            ),
        ).toBe("1 slice");
    });
});
