import { describe, expect, test } from "bun:test";
import type { FoodCandidate } from "../food-providers/types.js";
import {
    groundMealPhotoItems,
    isAmbiguous,
    resolveGroundedPortion,
    LOW_PORTION_CONFIDENCE,
} from "./grounding.js";
import type { MealPhotoVisionItem } from "./vision.js";

function candidate(overrides: Partial<FoodCandidate> = {}): FoodCandidate {
    return {
        provider: "usda",
        providerFoodId: "171688",
        name: "Chicken breast, grilled",
        dataKind: "generic",
        nutrientsPer100g: {
            calories: 165,
            protein_g: 31,
            carbs_g: 0,
            fat_g: 3.6,
        },
        portions: [
            {
                id: "100g",
                amount: 100,
                unit: "g",
                label: "100 g",
                gramWeight: 100,
                nutrients: {
                    calories: 165,
                    protein_g: 31,
                    carbs_g: 0,
                    fat_g: 3.6,
                },
            },
        ],
        attribution: {
            label: "USDA FoodData Central",
            url: "https://fdc.nal.usda.gov/food/171688",
        },
        confidence: 0.95,
        ...overrides,
    };
}

const chicken: MealPhotoVisionItem = {
    name: "grilled chicken breast",
    cooking_method: "grilled",
    quantity: 160,
    unit: "g",
    portion_confidence: 0.85,
    assumptions: ["assumed skinless breast"],
};

describe("resolveGroundedPortion", () => {
    test("scales per-100g nutrition by the photographed grams", () => {
        const resolved = resolveGroundedPortion(chicken, candidate());
        expect(resolved?.nutrients.calories).toBe(264);
        expect(resolved?.gramWeight).toBe(160);
    });

    test("scales a matching household portion by quantity / amount", () => {
        const rice = candidate({
            nutrientsPer100g: undefined,
            portions: [
                {
                    id: "cup",
                    amount: 1,
                    unit: "cup",
                    label: "1 cup",
                    gramWeight: 186,
                    nutrients: { calories: 242 },
                },
            ],
        });
        const resolved = resolveGroundedPortion(
            {
                ...chicken,
                name: "cooked white rice",
                quantity: 1.5,
                unit: "cup",
            },
            rice,
        );
        expect(resolved?.nutrients.calories).toBe(363);
        expect(resolved?.gramWeight).toBe(279);
    });
});

describe("groundMealPhotoItems", () => {
    test("grounds nutrition from the provider only and snapshots provenance", async () => {
        const [entry] = await groundMealPhotoItems([chicken], {
            search: async () => ({ candidates: [candidate()], failures: [] }),
        });
        expect(entry?.grounded).toBe(true);
        expect(entry?.groundingSource).toBe("USDA");
        expect(entry?.draftItem.sourceType).toBe("usda");
        expect(entry?.draftItem.providerFoodId).toBe("171688");
        expect(entry?.draftItem.nutrients.calories).toBe(264);
        expect(entry?.draftItem.assumptions).toContain(
            "assumed skinless breast",
        );
        expect(entry?.question).toBeNull();
    });

    test("unresolvable items become labelled estimates with EMPTY nutrition", async () => {
        const [entry] = await groundMealPhotoItems([chicken], {
            search: async () => ({ candidates: [], failures: [] }),
        });
        expect(entry?.grounded).toBe(false);
        expect(entry?.groundingSource).toBe("model_estimate");
        expect(entry?.draftItem.sourceType).toBe("model_estimate");
        expect(entry?.draftItem.nutrients).toEqual({});
        expect(entry?.draftItem.providerFoodId).toBeUndefined();
        expect(entry?.draftItem.assumptions).toContain(
            "assumed skinless breast",
        );
    });

    test("low portion confidence becomes a draft question, not a silent guess", async () => {
        const low: MealPhotoVisionItem = {
            ...chicken,
            portion_confidence: LOW_PORTION_CONFIDENCE - 0.15,
        };
        const [entry] = await groundMealPhotoItems([low], {
            search: async () => ({ candidates: [candidate()], failures: [] }),
        });
        expect(entry?.needsQuestion).toBe(true);
        expect(entry?.question?.prompt).toContain("160 g");
    });

    test("spends the tie-break only inside the ambiguity band", async () => {
        let tieBreakCalls = 0;
        const strong = candidate();
        const weakTwin = candidate({
            providerFoodId: "999",
            name: "Chicken breast, grilled",
            confidence: 0.4,
        });
        // Strong deterministic match: confidence high, margin wide.
        await groundMealPhotoItems([chicken], {
            search: async () => ({
                candidates: [strong, weakTwin],
                failures: [],
            }),
            chooseCandidates: async () => {
                tieBreakCalls += 1;
                return new Map();
            },
        });
        // isAmbiguous is the gate: two near-identical high-overlap
        // candidates with a thin margin are ambiguous.
        expect(
            isAmbiguous("grilled chicken breast", [
                candidate({ confidence: 0.8 }),
                candidate({ providerFoodId: "998", confidence: 0.79 }),
            ]),
        ).toBe(true);
        expect(tieBreakCalls).toBe(0);
    });

    test("a tie-break pick overrides the deterministic order; a null pick ungrounds", async () => {
        const first = candidate({ providerFoodId: "111", name: "Rice, white" });
        const second = candidate({
            providerFoodId: "222",
            name: "Rice, white, cooked",
            confidence: 0.8,
        });
        const vision: MealPhotoVisionItem = {
            name: "cooked white rice",
            cooking_method: null,
            quantity: 100,
            unit: "g",
            portion_confidence: 0.9,
            assumptions: [],
        };
        const [picked] = await groundMealPhotoItems([vision], {
            search: async () => ({ candidates: [first, second], failures: [] }),
            chooseCandidates: async () =>
                new Map([
                    [
                        "item:0",
                        {
                            candidateId: "usda:222",
                            confidence: 0.9,
                            rationale: null,
                        },
                    ],
                ]),
        });
        expect(picked?.tieBreakUsed).toBe(true);
        expect(picked?.draftItem.providerFoodId).toBe("222");

        const [nulled] = await groundMealPhotoItems([vision], {
            search: async () => ({ candidates: [first, second], failures: [] }),
            chooseCandidates: async () =>
                new Map([
                    [
                        "item:0",
                        { candidateId: null, confidence: 0.2, rationale: null },
                    ],
                ]),
        });
        expect(nulled?.grounded).toBe(false);
        expect(nulled?.draftItem.sourceType).toBe("model_estimate");
    });
});
