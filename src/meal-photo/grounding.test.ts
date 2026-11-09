import { describe, expect, test } from "bun:test";
import type { FoodCandidate } from "../food-providers/types.js";
import {
    groundMealPhotoItems,
    isAmbiguous,
    mealPhotoItemIsComplete,
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

    test("unresolvable items with no estimate step carry NO nutrition and a BLOCKING question (regression: formerly silently empty)", async () => {
        const [entry] = await groundMealPhotoItems([chicken], {
            search: async () => ({ candidates: [], failures: [] }),
        });
        expect(entry?.grounded).toBe(false);
        expect(entry?.estimated).toBe(false);
        expect(entry?.groundingSource).toBe("model_estimate");
        expect(entry?.draftItem.sourceType).toBe("model_estimate");
        expect(entry?.draftItem.nutrients).toEqual({});
        expect(entry?.draftItem.providerFoodId).toBeUndefined();
        expect(entry?.draftItem.assumptions).toContain(
            "assumed skinless breast",
        );
        // The hardening: never silently empty — a blocking question
        // replaces the old confirm-as-is behaviour.
        expect(entry?.needsQuestion).toBe(true);
        expect(entry?.question?.blocking).toBe(true);
        expect(entry?.question?.questionKey).toBe("photo_estimate_missing_0");
        expect(entry?.question?.prompt).toContain("grilled chicken breast");
        expect(entry?.question?.prompt).toContain("remove the item");
        expect(entry?.draftItem.sourceSnapshot?.estimate_status).toBe(
            "unavailable",
        );
    });

    test("unresolvable items get LABELLED estimate values from the estimate step, auditable and never provider data", async () => {
        const [entry] = await groundMealPhotoItems([chicken], {
            search: async () => ({ candidates: [], failures: [] }),
            estimateNutrients: async (requests) => {
                expect(requests).toHaveLength(1);
                expect(requests[0]?.name).toBe("grilled chicken breast");
                expect(requests[0]?.quantity).toBe(160);
                return new Map([
                    [
                        "item:0",
                        { calories: 248, protein_g: 46, carbs_g: 0, fat_g: 5 },
                    ],
                ]);
            },
        });
        expect(entry?.grounded).toBe(false);
        expect(entry?.estimated).toBe(true);
        expect(entry?.draftItem.sourceType).toBe("model_estimate");
        expect(entry?.draftItem.nutrients.calories).toBe(248);
        expect(entry?.draftItem.provider).toBeUndefined();
        expect(entry?.draftItem.providerFoodId).toBeUndefined();
        expect(entry?.draftItem.sourceUrl).toBeUndefined();
        expect(entry?.draftItem.assumptions).toContain(
            "assumed skinless breast",
        );
        expect(entry?.draftItem.sourceSnapshot?.estimate_origin).toBe(
            "model_estimate",
        );
        expect(
            (entry?.draftItem.sourceSnapshot?.nutrition_snapshot as any)
                ?.calories,
        ).toBe(248);
        expect(entry?.question).toBeNull();
    });

    test("estimate step failure falls back to NO values + blocking question, never a throw or silent empty", async () => {
        const [entry] = await groundMealPhotoItems([chicken], {
            search: async () => ({ candidates: [], failures: [] }),
            estimateNutrients: async () => {
                throw new Error("provider down");
            },
        });
        expect(entry?.estimated).toBe(false);
        expect(entry?.draftItem.nutrients).toEqual({});
        expect(entry?.question?.blocking).toBe(true);
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

describe("production case: chicken / rice / broccoli plate (S3 hardening regression)", () => {
    const broccoli: MealPhotoVisionItem = {
        name: "steamed broccoli",
        cooking_method: "steamed",
        quantity: 100,
        unit: "g",
        portion_confidence: 0.9,
        assumptions: [],
    };
    const rice: MealPhotoVisionItem = {
        name: "cooked white rice",
        cooking_method: "steamed",
        quantity: 1,
        unit: "cup",
        portion_confidence: 0.8,
        assumptions: [],
    };
    const plate = [chicken, rice, broccoli];
    const search = async (query: string) => {
        if (query.includes("chicken")) {
            return { candidates: [candidate()], failures: [] };
        }
        if (query.includes("broccoli")) {
            return {
                candidates: [
                    candidate({
                        providerFoodId: "170379",
                        name: "Broccoli, cooked",
                        nutrientsPer100g: {
                            calories: 35,
                            protein_g: 2.4,
                            carbs_g: 7.2,
                            fat_g: 0.4,
                        },
                    }),
                ],
                failures: [],
            };
        }
        // Rice gets NO usable candidate — the production defect case.
        return { candidates: [], failures: [] };
    };

    test("rice carries labelled Model estimate values; chicken+broccoli stay provider-grounded; every item complete", async () => {
        let estimateCalls = 0;
        const grounded = await groundMealPhotoItems(plate, {
            search,
            estimateNutrients: async (requests) => {
                estimateCalls += 1;
                // Batched: exactly the ungrounded items, one call.
                expect(requests.map((request) => request.name)).toEqual([
                    "cooked white rice",
                ]);
                return new Map([
                    [
                        "item:1",
                        {
                            calories: 205,
                            protein_g: 4.3,
                            carbs_g: 44.5,
                            fat_g: 0.4,
                        },
                    ],
                ]);
            },
        });
        expect(estimateCalls).toBe(1);
        const [chickenEntry, riceEntry, broccoliEntry] = grounded;
        expect(chickenEntry?.grounded).toBe(true);
        expect(chickenEntry?.draftItem.nutrients.calories).toBe(264);
        expect(broccoliEntry?.grounded).toBe(true);
        expect(broccoliEntry?.draftItem.nutrients.calories).toBe(35);
        expect(riceEntry?.grounded).toBe(false);
        expect(riceEntry?.estimated).toBe(true);
        expect(riceEntry?.draftItem.sourceType).toBe("model_estimate");
        expect(riceEntry?.draftItem.nutrients.calories).toBe(205);
        expect(riceEntry?.draftItem.providerFoodId).toBeUndefined();
        expect(riceEntry?.question).toBeNull();
        // The draft total now INCLUDES the rice.
        const total = grounded.reduce(
            (sum, entry) => sum + (entry.draftItem.nutrients.calories ?? 0),
            0,
        );
        expect(total).toBe(264 + 205 + 35);
        for (const entry of grounded) {
            expect(mealPhotoItemIsComplete(entry)).toBe(true);
        }
    });

    test("estimate failure: rice has NO values and a blocking question; invariant still holds for every item", async () => {
        const grounded = await groundMealPhotoItems(plate, {
            search,
            estimateNutrients: async () => {
                throw new Error("estimate unavailable");
            },
        });
        const riceEntry = grounded[1]!;
        expect(riceEntry.draftItem.nutrients).toEqual({});
        expect(riceEntry.question?.blocking).toBe(true);
        expect(riceEntry.question?.questionKey).toBe(
            "photo_estimate_missing_1",
        );
        for (const entry of grounded) {
            expect(mealPhotoItemIsComplete(entry)).toBe(true);
        }
    });

    test("multiple ungrounded items are batched into a single estimate call", async () => {
        let calls = 0;
        const grounded = await groundMealPhotoItems(plate, {
            search: async () => ({ candidates: [], failures: [] }),
            estimateNutrients: async (requests) => {
                calls += 1;
                expect(requests).toHaveLength(3);
                return new Map(
                    requests.map((request) => [
                        request.key,
                        { calories: 100, protein_g: 5, carbs_g: 10, fat_g: 3 },
                    ]),
                );
            },
        });
        expect(calls).toBe(1);
        expect(grounded.every((entry) => entry.estimated)).toBe(true);
    });
});
