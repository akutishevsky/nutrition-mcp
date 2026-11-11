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

describe("count-as-grams invariant (photo-flow P1 — the corn incident)", () => {
    // The production case, meal 46036558-a885-4df6-afc1-d49d34c4e359:
    // vision said "3 piece"; the picked Open Food Facts candidate
    // carried ONLY a "100 g" portion; grounding set gram_weight = 3
    // and logged the item at 2.4 kcal. Correct is ≈290–320 kcal.
    const cornVision: MealPhotoVisionItem = {
        name: "corn on the cob",
        cooking_method: "steamed",
        quantity: 3,
        unit: "piece",
        portion_confidence: 0.6,
        assumptions: [],
    };
    const cornPer100g = {
        calories: 86,
        protein_g: 3.2,
        carbs_g: 19,
        fat_g: 1.2,
    };
    function offCorn(overrides: Partial<FoodCandidate> = {}): FoodCandidate {
        return candidate({
            provider: "open_food_facts",
            providerFoodId: "00478915",
            name: "Corn On The Cob",
            nutrientsPer100g: cornPer100g,
            portions: [
                {
                    id: "100g",
                    amount: 100,
                    unit: "g",
                    label: "100 g",
                    gramWeight: 100,
                    nutrients: cornPer100g,
                },
            ],
            attribution: {
                label: "Open Food Facts",
                url: "https://world.openfoodfacts.org/product/00478915",
            },
            confidence: 0.6,
            ...overrides,
        });
    }
    function usdaCornWithEar(): FoodCandidate {
        return candidate({
            providerFoodId: "169998",
            name: "Corn, sweet, yellow, cooked",
            nutrientsPer100g: {
                calories: 96,
                protein_g: 3.4,
                carbs_g: 21,
                fat_g: 1.5,
            },
            portions: [
                {
                    id: "100g",
                    amount: 100,
                    unit: "g",
                    label: "100 g",
                    gramWeight: 100,
                    nutrients: {
                        calories: 96,
                        protein_g: 3.4,
                        carbs_g: 21,
                        fat_g: 1.5,
                    },
                },
                {
                    id: "ear-medium",
                    amount: 1,
                    unit: "ear",
                    label: "1 ear, medium",
                    gramWeight: 90,
                    nutrients: {
                        calories: 86,
                        protein_g: 3.1,
                        carbs_g: 19,
                        fat_g: 1.4,
                    },
                },
            ],
            confidence: 0.55,
        });
    }

    test("resolveGroundedPortion refuses to read a count as grams", () => {
        expect(resolveGroundedPortion(cornVision, offCorn())).toBeNull();
    });

    test("the pick's own count portion resolves the count even when the 100 g portion sorts first", () => {
        const resolved = resolveGroundedPortion(cornVision, usdaCornWithEar());
        expect(resolved?.gramWeight).toBe(270);
        expect(resolved?.nutrients.calories).toBe(258);
        expect(resolved?.countConversion?.gramsPerPiece).toBe(90);
    });

    test("corn case, donor path: grams-per-piece from another candidate's portion data, nutrients stay with the pick", async () => {
        const [entry] = await groundMealPhotoItems([cornVision], {
            search: async () => ({
                candidates: [offCorn(), usdaCornWithEar()],
                failures: [],
            }),
        });
        expect(entry?.grounded).toBe(true);
        expect(entry?.draftItem.sourceType).toBe("open_food_facts");
        expect(entry?.draftItem.providerFoodId).toBe("00478915");
        expect(entry?.draftItem.gramWeight).toBe(270);
        expect(entry?.draftItem.nutrients.calories).toBeGreaterThanOrEqual(200);
        expect(entry?.draftItem.nutrients.calories).toBeLessThanOrEqual(400);
        expect(
            entry?.draftItem.assumptions?.some((assumption) =>
                assumption.includes("90 g each"),
            ),
        ).toBe(true);
        expect(
            (entry?.draftItem.sourceSnapshot?.count_conversion as any)
                ?.gramsPerPiece,
        ).toBe(90);
        expect(mealPhotoItemIsComplete(entry!)).toBe(true);
    });

    test("corn case, estimate path: no donor anywhere → labelled estimate WITH a gram weight", async () => {
        const [entry] = await groundMealPhotoItems([cornVision], {
            search: async () => ({ candidates: [offCorn()], failures: [] }),
            estimateNutrients: async (requests) => {
                expect(requests).toHaveLength(1);
                expect(requests[0]?.gramWeightNeeded).toBe(true);
                return new Map([
                    [
                        "item:0",
                        {
                            nutrients: {
                                calories: 290,
                                protein_g: 9,
                                carbs_g: 56,
                                fat_g: 4,
                            },
                            gramWeight: 270,
                        },
                    ],
                ]);
            },
        });
        expect(entry?.grounded).toBe(false);
        expect(entry?.estimated).toBe(true);
        expect(entry?.draftItem.gramWeight).toBe(270);
        expect(entry?.draftItem.nutrients.calories).toBe(290);
        expect(
            entry?.draftItem.assumptions?.some((assumption) =>
                assumption.includes("Estimated weight"),
            ),
        ).toBe(true);
        expect(entry?.draftItem.sourceSnapshot?.count_mismatch).toBe(true);
    });

    test("corn case, estimate without a gram weight → values land but a question asks for the weight", async () => {
        const confidentCorn = { ...cornVision, portion_confidence: 0.95 };
        const [entry] = await groundMealPhotoItems([confidentCorn], {
            search: async () => ({ candidates: [offCorn()], failures: [] }),
            estimateNutrients: async () =>
                new Map([
                    [
                        "item:0",
                        {
                            nutrients: {
                                calories: 290,
                                protein_g: 9,
                                carbs_g: 56,
                                fat_g: 4,
                            },
                        },
                    ],
                ]),
        });
        expect(entry?.estimated).toBe(true);
        expect(entry?.draftItem.gramWeight).toBeUndefined();
        expect(entry?.question?.blocking).toBe(false);
        expect(entry?.question?.prompt).toContain("per-100 g");
    });

    test("corn case, no donor and no estimate step → blocking question, never 3 grams of values", async () => {
        const [entry] = await groundMealPhotoItems([cornVision], {
            search: async () => ({ candidates: [offCorn()], failures: [] }),
        });
        expect(entry?.grounded).toBe(false);
        expect(entry?.draftItem.nutrients).toEqual({});
        expect(entry?.draftItem.gramWeight).toBeUndefined();
        expect(entry?.question?.blocking).toBe(true);
        expect(mealPhotoItemIsComplete(entry!)).toBe(true);
    });

    test("donor switch: pick without a per-100 g panel yields to the donor candidate end to end", async () => {
        const paneless = offCorn({ nutrientsPer100g: undefined });
        const [entry] = await groundMealPhotoItems([cornVision], {
            search: async () => ({
                candidates: [paneless, usdaCornWithEar()],
                failures: [],
            }),
        });
        expect(entry?.grounded).toBe(true);
        expect(entry?.draftItem.providerFoodId).toBe("169998");
        expect(entry?.draftItem.gramWeight).toBe(270);
        expect(entry?.draftItem.nutrients.calories).toBe(258);
    });

    test("unit-mismatch sweep: no count unit ever becomes a gram weight against a weight-only candidate", async () => {
        for (const unit of ["piece", "slice", "whole", "bar", "ear"]) {
            const vision: MealPhotoVisionItem = {
                name: "corn on the cob",
                cooking_method: null,
                quantity: 2,
                unit,
                portion_confidence: 0.9,
                assumptions: [],
            };
            const [entry] = await groundMealPhotoItems([vision], {
                search: async () => ({
                    candidates: [offCorn()],
                    failures: [],
                }),
            });
            expect(entry?.draftItem.gramWeight).not.toBe(2);
            expect(entry?.draftItem.nutrients).toEqual({});
            expect(entry?.question?.blocking).toBe(true);
        }
    });

    test("'serving' is NOT a count unit: the per-100 g fallback still grounds it (chat adapter contract)", async () => {
        // The S8 chat grounding adapter passes name-only items with
        // unit "serving". A serving is a generic portion word, not a
        // counted object — it must resolve through the labelled
        // per-100 g fallback, never the count guard's question path.
        const vision: MealPhotoVisionItem = {
            name: "corn on the cob",
            cooking_method: null,
            quantity: 1,
            unit: "serving",
            portion_confidence: 0.8,
            assumptions: [],
        };
        const [entry] = await groundMealPhotoItems([vision], {
            search: async () => ({ candidates: [offCorn()], failures: [] }),
        });
        expect(entry?.grounded).toBe(true);
        expect(entry?.draftItem.sourceType).toBe("open_food_facts");
        expect(entry?.draftItem.nutrients.calories).toBeGreaterThan(0);
    });
});

describe("unit-kind invariant (photo calorie blowup, 2026-11-10)", () => {
    // The eval case, verbatim: the full-pipeline model evaluation on
    // the real-photo fixtures produced a 48,590 kcal tomato-soup meal
    // under multiple identifier models. The draft item itself was
    // 48,450 kcal. Identification was innocent — the Wegmans candidate
    // below is the recorded live USDA payload (fdcId 1966887:
    // servingSize 425 g, Energy 38 kcal per 100 g, so its declared
    // serving carries 161.5 kcal), and the vision item priced it in
    // millilitres. The legacy portions[0] fallback scaled the serving
    // by 300 / 1 — "300 ml" read as 300 servings — and set a
    // 127,500 g gram weight. A chicken-soup item in the same run hit
    // 56,049 kcal by the same door.
    const wegmansSoup = candidate({
        providerFoodId: "1966887",
        name: "TOMATO SOUP",
        brand: "WEGMANS",
        dataKind: "branded",
        nutrientsPer100g: {
            calories: 38,
            protein_g: 0.71,
            carbs_g: 8.24,
            fat_g: 0.24,
        },
        portions: [
            {
                id: "declared-serving",
                amount: 1,
                unit: "serving",
                label: "1 CAN",
                gramWeight: 425,
                nutrients: {
                    calories: 161.5,
                    protein_g: 3.02,
                    carbs_g: 35.02,
                    fat_g: 1.02,
                },
            },
            {
                id: "100g",
                amount: 100,
                unit: "g",
                label: "100 g",
                gramWeight: 100,
                nutrients: {
                    calories: 38,
                    protein_g: 0.71,
                    carbs_g: 8.24,
                    fat_g: 0.24,
                },
            },
        ],
        confidence: 0.96,
    });
    const soupMl: MealPhotoVisionItem = {
        name: "tomato soup",
        cooking_method: null,
        quantity: 300,
        unit: "ml",
        portion_confidence: 0.85,
        assumptions: [],
    };

    test("a volume quantity is never read as a count of servings (the 48,450 kcal case)", () => {
        expect(resolveGroundedPortion(soupMl, wegmansSoup)).toBeNull();
        expect(
            resolveGroundedPortion({ ...soupMl, quantity: 240 }, wegmansSoup),
        ).toBeNull();
        expect(
            resolveGroundedPortion(
                { ...soupMl, unit: "l", quantity: 0.3 },
                wegmansSoup,
            ),
        ).toBeNull();
    });

    test("volume sweep: no volume unit resolves against a serving/weight-only candidate", async () => {
        for (const unit of ["ml", "l", "cup", "tbsp", "tsp", "fl oz"]) {
            const vision: MealPhotoVisionItem = {
                ...soupMl,
                quantity: unit === "ml" ? 300 : 2,
                unit,
            };
            const [entry] = await groundMealPhotoItems([vision], {
                search: async () => ({
                    candidates: [wegmansSoup],
                    failures: [],
                }),
            });
            // Never grounded values for the volume, never an absurd
            // gram weight: no estimate step in this lane, so the item
            // surfaces with a blocking question instead.
            expect(entry?.grounded).toBe(false);
            expect(entry?.draftItem.nutrients).toEqual({});
            expect(entry?.draftItem.gramWeight).toBeUndefined();
            expect(entry?.question?.blocking).toBe(true);
            expect(mealPhotoItemIsComplete(entry!)).toBe(true);
        }
    });

    test("the eval meal end to end: the soup falls to the labelled estimate and the meal total stays sane", async () => {
        const breadBowl: MealPhotoVisionItem = {
            name: "bread bowl",
            cooking_method: null,
            quantity: 1,
            unit: "bowl",
            portion_confidence: 0.85,
            assumptions: [],
        };
        const entries = await groundMealPhotoItems([soupMl, breadBowl], {
            search: async (query: string) =>
                query.includes("bread")
                    ? {
                          candidates: [
                              candidate({
                                  providerFoodId: "rustik",
                                  name: "SOURDOUGH BREAD BOWL, SOURDOUGH",
                                  brand: "THE RUSTIK OVEN",
                                  nutrientsPer100g: { calories: 264 },
                                  portions: [
                                      {
                                          id: "declared-serving",
                                          amount: 1,
                                          unit: "serving",
                                          label: "1 bowl",
                                          gramWeight: 140,
                                          nutrients: { calories: 369 },
                                      },
                                      {
                                          id: "100g",
                                          amount: 100,
                                          unit: "g",
                                          label: "100 g",
                                          gramWeight: 100,
                                          nutrients: { calories: 264 },
                                      },
                                  ],
                              }),
                          ],
                          failures: [],
                      }
                    : { candidates: [wegmansSoup], failures: [] },
            estimateNutrients: async (requests) => {
                // The estimate step prices the STATED portion (300 ml
                // of soup) directly — the honest route the refusal
                // exists to reach.
                expect(requests).toHaveLength(1);
                expect(requests[0]?.unit).toBe("ml");
                return new Map([
                    [
                        "item:0",
                        {
                            nutrients: {
                                calories: 120,
                                protein_g: 2,
                                carbs_g: 24,
                                fat_g: 1,
                            },
                        },
                    ],
                ]);
            },
        });
        const [soup, bread] = entries;
        expect(soup?.estimated).toBe(true);
        expect(soup?.draftItem.nutrients.calories).toBe(120);
        expect(bread?.grounded).toBe(true);
        const total = entries.reduce(
            (sum, entry) => sum + (entry.draftItem.nutrients.calories ?? 0),
            0,
        );
        // The eval reported 48,590.22 for this meal shape.
        expect(total).toBeLessThan(2_000);
        for (const entry of entries) {
            expect(entry.draftItem.gramWeight ?? 0).toBeLessThan(5_000);
            expect(mealPhotoItemIsComplete(entry)).toBe(true);
        }
    });

    test("generic portion words still resolve as servings — within the ceiling", () => {
        const one = resolveGroundedPortion(
            { ...soupMl, quantity: 1, unit: "bowl" },
            wegmansSoup,
        );
        expect(one?.nutrients.calories).toBe(161.5);
        expect(one?.gramWeight).toBe(425);
        const two = resolveGroundedPortion(
            { ...soupMl, quantity: 2, unit: "bowl" },
            wegmansSoup,
        );
        expect(two?.nutrients.calories).toBe(323);
    });

    test("an absurd generic quantity falls to the labelled per-100 g values, never a multiple", () => {
        const resolved = resolveGroundedPortion(
            { ...soupMl, quantity: 300, unit: "serving" },
            wegmansSoup,
        );
        expect(resolved?.nutrients.calories).toBe(38);
        expect(resolved?.portionId).toBe("100g");
        expect(resolved?.assumption).toContain("per 100 g");
        expect(resolved?.gramWeight).toBeUndefined();
    });

    test("the mirror defect: a generic serving against a 100 g-only candidate is no longer divided by 100", () => {
        const per100gOnly = candidate({
            providerFoodId: "2524019",
            name: "GOLDEN CURRY SAUCE WITH VEGETABLES",
            nutrientsPer100g: { calories: 109 },
            portions: [
                {
                    id: "100g",
                    amount: 100,
                    unit: "g",
                    label: "100 g",
                    gramWeight: 100,
                    nutrients: { calories: 109 },
                },
            ],
        });
        const resolved = resolveGroundedPortion(
            {
                ...soupMl,
                name: "vegetable curry",
                quantity: 1,
                unit: "serving",
            },
            per100gOnly,
        );
        // Legacy math produced 1.09 kcal at gram_weight 1.
        expect(resolved?.nutrients.calories).toBe(109);
        expect(resolved?.gramWeight).toBeUndefined();
        expect(resolved?.assumption).toContain("per 100 g");
    });

    test("the gram-weight ceiling refuses absurd resolutions even on dimensionally sound paths", () => {
        // 300 pieces against the candidate's own count portion: the
        // units are honest, the quantity is not — 27 kg of corn is a
        // data error, and the item must surface, not land.
        const earCandidate = candidate({
            nutrientsPer100g: { calories: 96 },
            portions: [
                {
                    id: "ear-medium",
                    amount: 1,
                    unit: "ear",
                    label: "1 ear, medium",
                    gramWeight: 90,
                    nutrients: { calories: 86 },
                },
            ],
        });
        expect(
            resolveGroundedPortion(
                {
                    ...soupMl,
                    name: "corn on the cob",
                    quantity: 300,
                    unit: "ear",
                },
                earCandidate,
            ),
        ).toBeNull();
        // A five-figure gram quantity against the per-100 g panel.
        expect(
            resolveGroundedPortion(
                {
                    ...soupMl,
                    name: "tomato soup",
                    quantity: 100_000,
                    unit: "g",
                },
                wegmansSoup,
            ),
        ).toBeNull();
        // …while a genuinely large but plausible item still resolves.
        const large = resolveGroundedPortion(
            { ...soupMl, name: "tomato soup", quantity: 4_000, unit: "g" },
            wegmansSoup,
        );
        expect(large?.gramWeight).toBe(4_000);
    });

    test("volume converts to a volume portion through exact ml ratios", () => {
        const juice = candidate({
            nutrientsPer100g: undefined,
            portions: [
                {
                    id: "cup",
                    amount: 1,
                    unit: "cup",
                    label: "1 cup",
                    gramWeight: 248,
                    nutrients: { calories: 112 },
                },
            ],
        });
        const resolved = resolveGroundedPortion(
            { ...soupMl, name: "orange juice", quantity: 480, unit: "ml" },
            juice,
        );
        // 480 ml = 2.0288 cups of the 1-cup portion.
        expect(resolved?.nutrients.calories).toBeCloseTo(227.23, 1);
        expect(resolved?.gramWeight).toBeCloseTo(503.15, 1);
        expect(resolved?.assumption).toContain("1 cup");
    });

    test("a weight quantity against a panel-less candidate resolves through the portion's gram weight", () => {
        const offStyle = candidate({
            provider: "open_food_facts",
            nutrientsPer100g: undefined,
            portions: [
                {
                    id: "declared-serving",
                    amount: 1,
                    unit: "serving",
                    label: "30 g",
                    gramWeight: 30,
                    nutrients: { calories: 160 },
                },
            ],
        });
        const resolved = resolveGroundedPortion(
            { ...soupMl, name: "cookies", quantity: 150, unit: "g" },
            offStyle,
        );
        // Legacy math read 150 g as 150 servings (24,000 kcal).
        expect(resolved?.nutrients.calories).toBe(800);
        expect(resolved?.gramWeight).toBe(150);
        // No gram weight anywhere on the candidate: refuse.
        const weightless = candidate({
            provider: "open_food_facts",
            nutrientsPer100g: undefined,
            portions: [
                {
                    id: "declared-serving",
                    amount: 1,
                    unit: "serving",
                    label: "1 serving",
                    nutrients: { calories: 160 },
                },
            ],
        });
        expect(
            resolveGroundedPortion(
                { ...soupMl, name: "cookies", quantity: 150, unit: "g" },
                weightless,
            ),
        ).toBeNull();
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
                        {
                            nutrients: {
                                calories: 248,
                                protein_g: 46,
                                carbs_g: 0,
                                fat_g: 5,
                            },
                        },
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
                            nutrients: {
                                calories: 205,
                                protein_g: 4.3,
                                carbs_g: 44.5,
                                fat_g: 0.4,
                            },
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
                        {
                            nutrients: {
                                calories: 100,
                                protein_g: 5,
                                carbs_g: 10,
                                fat_g: 3,
                            },
                        },
                    ]),
                );
            },
        });
        expect(calls).toBe(1);
        expect(grounded.every((entry) => entry.estimated)).toBe(true);
    });
});
