import { describe, expect, test } from "bun:test";
import { deduplicateCandidates, rankCandidates } from "./ranking.js";
import type { FoodCandidate } from "./types.js";

function food(
    name: string,
    overrides: Partial<FoodCandidate> = {},
): FoodCandidate {
    return {
        provider: "usda",
        providerFoodId: name,
        name,
        dataKind: "generic",
        nutrientsPer100g: { calories: 100, protein_g: 5 },
        portions: [
            {
                id: "100g",
                amount: 100,
                unit: "g",
                label: "100 g",
                gramWeight: 100,
                nutrients: { calories: 100, protein_g: 5 },
            },
        ],
        attribution: { label: "USDA FoodData Central" },
        confidence: 0.9,
        ...overrides,
    };
}

describe("food candidate ranking", () => {
    test("prioritizes exact text and brand matches without food-specific rules", () => {
        const ranked = rankCandidates(
            { query: "Simply Nature Creamy Peanut Butter" },
            [
                food("Peanut butter"),
                food("Creamy Peanut Butter", {
                    provider: "open_food_facts",
                    providerFoodId: "4099100316896",
                    dataKind: "packaged",
                    brand: "Simply Nature",
                    barcode: "4099100316896",
                    confidence: 0.96,
                }),
            ],
        );
        expect(ranked[0]?.name).toBe("Creamy Peanut Butter");
    });

    test("keeps ambiguous semantic alternatives available for the model", () => {
        const ranked = rankCandidates({ query: "bacon" }, [
            food("Bacon bits"),
            food("Bacon, cooked"),
            food("Canadian bacon"),
        ]);
        expect(ranked.map((candidate) => candidate.name)).toEqual([
            "Bacon bits",
            "Bacon, cooked",
            "Canadian bacon",
        ]);
    });

    test("deduplicates identical provider identities and keeps higher confidence", () => {
        const candidates = deduplicateCandidates([
            food("Milk", { providerFoodId: "milk", confidence: 0.7 }),
            food("Milk", { providerFoodId: "milk", confidence: 0.95 }),
        ]);
        expect(candidates).toHaveLength(1);
        expect(candidates[0]?.confidence).toBe(0.95);
    });
});

const FULL_PANEL = {
    calories: 100,
    protein_g: 5,
    carbs_g: 10,
    fat_g: 4,
    fiber_g: 2,
    sugar_g: 3,
    alcohol_g: 0,
    sodium_mg: 50,
    saturated_fat_g: 1,
    cholesterol_mg: 10,
    potassium_mg: 200,
};

function panelFood(
    name: string,
    nutrients: Record<string, number>,
    overrides: Partial<FoodCandidate> = {},
): FoodCandidate {
    return food(name, {
        nutrientsPer100g: nutrients,
        portions: [
            {
                id: "100g",
                amount: 100,
                unit: "g",
                label: "100 g",
                gramWeight: 100,
                nutrients,
            },
        ],
        ...overrides,
    });
}

describe("completeness-dominant ranking", () => {
    test("a full-panel generic beats a sparse branded entry of equal relevance", () => {
        const ranked = rankCandidates({ query: "peanut butter" }, [
            panelFood(
                "Peanut Butter",
                { calories: 190 },
                {
                    provider: "open_food_facts",
                    providerFoodId: "sparse-branded",
                    dataKind: "packaged",
                    brand: "SparseCo",
                    barcode: "123456789012",
                    confidence: 0.99,
                },
            ),
            panelFood("Peanut butter", FULL_PANEL, { confidence: 0.7 }),
        ]);
        expect(ranked[0]?.providerFoodId).not.toBe("sparse-branded");
        expect(ranked[0]?.name).toBe("Peanut butter");
    });

    test("a sparse exact-name match does not beat a complete gated-in near-match", () => {
        const ranked = rankCandidates({ query: "whole milk" }, [
            panelFood("Whole milk", { calories: 61 }),
            panelFood("Milk, whole", FULL_PANEL),
        ]);
        expect(ranked.map((candidate) => candidate.name)).toEqual([
            "Milk, whole",
            "Whole milk",
        ]);
    });

    test("the relevance gate keeps a sparse exact match ahead of a complete non-match, and nothing is removed", () => {
        const ranked = rankCandidates({ query: "whole milk" }, [
            panelFood("Chocolate bar", FULL_PANEL, {
                providerFoodId: "choc",
            }),
            panelFood("Whole milk", { calories: 61 }),
        ]);
        expect(ranked).toHaveLength(2);
        expect(ranked.map((candidate) => candidate.name)).toEqual([
            "Whole milk",
            "Chocolate bar",
        ]);
    });

    test("gated-out candidates sort strictly after gated-in ones regardless of completeness", () => {
        const ranked = rankCandidates({ query: "cheddar cheese" }, [
            panelFood("Yogurt, plain, whole milk", FULL_PANEL, {
                providerFoodId: "yogurt",
            }),
            panelFood("Cheese, cheddar", { calories: 400, protein_g: 25 }),
        ]);
        expect(ranked.map((candidate) => candidate.name)).toEqual([
            "Cheese, cheddar",
            "Yogurt, plain, whole milk",
        ]);
    });
});
