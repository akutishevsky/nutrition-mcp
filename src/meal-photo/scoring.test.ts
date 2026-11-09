import { describe, expect, test } from "bun:test";
import type { GroundedMealPhotoItem } from "./grounding.js";
import { scoreFixture } from "./scoring.js";
import type { MealPhotoVisionItem } from "./vision.js";

const vision: MealPhotoVisionItem = {
    name: "cooked white rice",
    cooking_method: "steamed",
    quantity: 1,
    unit: "cup",
    portion_confidence: 0.8,
    assumptions: [],
};

function entry(
    overrides: Partial<GroundedMealPhotoItem>,
): GroundedMealPhotoItem {
    return {
        vision,
        draftItem: {
            name: "cooked white rice",
            quantity: 1,
            portionLabel: "1 cup",
            nutrients: { calories: 205 },
            sourceType: "model_estimate",
            assumptions: [],
            sourceSnapshot: {},
        },
        groundingSource: "model_estimate",
        grounded: false,
        estimated: true,
        candidateId: null,
        tieBreakUsed: false,
        needsQuestion: false,
        question: null,
        ...overrides,
    };
}

function score(grounded: GroundedMealPhotoItem[]) {
    return scoreFixture({
        fixtureId: "scoring-semantics",
        source: "synthetic",
        expected: [
            {
                name: "cooked white rice",
                portion: { min_quantity: 0.8, max_quantity: 1.2, unit: "cup" },
                expected_provider: "model_estimate",
            },
        ],
        grounded,
        returnedProviderIds: new Set(["171688"]),
        referenceCalories: 205,
    });
}

describe("photo-eval fabrication semantics (S3 hardening)", () => {
    test("a LABELLED model estimate carrying values is NOT a fabrication", () => {
        const result = score([entry({})]);
        expect(result.fabricatedNutrition).toBe(0);
        expect(result.fabricatedIds).toBe(0);
    });

    test("nutrition on an item that is neither grounded nor a labelled estimate IS fabricated nutrition", () => {
        const result = score([entry({ estimated: false })]);
        expect(result.fabricatedNutrition).toBe(1);
    });

    test("a provider food ID the search never returned is a fabricated ID, even on an estimate-labelled item", () => {
        const result = score([
            entry({
                draftItem: {
                    name: "cooked white rice",
                    quantity: 1,
                    portionLabel: "1 cup",
                    nutrients: { calories: 205 },
                    sourceType: "model_estimate",
                    provider: "usda",
                    providerFoodId: "999999-invented",
                    assumptions: [],
                    sourceSnapshot: {},
                },
            }),
        ]);
        expect(result.fabricatedIds).toBe(1);
    });
});
