import { describe, expect, test } from "bun:test";
import type { FoodCandidate } from "../food-providers/types.js";
import {
    planPreparationUpdate,
    resolveDraftAdd,
    type DraftAddDeps,
} from "./draft-add.js";
import { mealPhotoItemIsComplete } from "./grounding.js";

/**
 * Recorded-fixture tests for the parse → ground → add chain
 * (Amendment E item 3). Every dependency is a stub replaying fixed
 * data — no live model calls, no database. The draft-side totals are
 * asserted the way the review computes them: the existing draft items'
 * calories plus the added item's.
 */

function candidate(overrides: Partial<FoodCandidate> = {}): FoodCandidate {
    return {
        provider: "usda",
        providerFoodId: "173430",
        name: "Butter, salted",
        dataKind: "generic",
        nutrientsPer100g: {
            calories: 717,
            protein_g: 0.85,
            carbs_g: 0.06,
            fat_g: 81.1,
        },
        portions: [
            {
                id: "tbsp",
                amount: 1,
                unit: "tbsp",
                label: "1 tbsp",
                gramWeight: 14.2,
                nutrients: {
                    calories: 102,
                    protein_g: 0.12,
                    carbs_g: 0.01,
                    fat_g: 11.5,
                },
            },
            {
                id: "100g",
                amount: 100,
                unit: "g",
                label: "100 g",
                gramWeight: 100,
                nutrients: {
                    calories: 717,
                    protein_g: 0.85,
                    carbs_g: 0.06,
                    fat_g: 81.1,
                },
            },
        ],
        attribution: {
            label: "USDA FoodData Central",
            url: "https://fdc.nal.usda.gov/food/173430",
        },
        confidence: 0.95,
        ...overrides,
    };
}

// The photo draft Michael's flow starts from: chicken + broccoli,
// provider-grounded at 264 + 35 kcal.
const EXISTING_DRAFT_CALORIES = 264 + 35;

const butterSearch: DraftAddDeps["search"] = async (query) => {
    if (query.includes("butter")) {
        return { candidates: [candidate()], failures: [] };
    }
    return { candidates: [], failures: [] };
};

describe("resolveDraftAdd — (a) 'I added a good bit of butter' on a chicken/broccoli photo draft", () => {
    test("butter is provider-grounded, its assumption is shown, totals recompute, and NO model parse is spent", async () => {
        let modelParseCalls = 0;
        const resolution = await resolveDraftAdd(
            "I added a good bit of butter",
            {
                search: butterSearch,
                parseWithModel: async () => {
                    modelParseCalls += 1;
                    throw new Error("fallback must not fire");
                },
            },
        );
        // (d) parser-first proof: the deterministic path handled this
        // WITHOUT a model call.
        expect(modelParseCalls).toBe(0);
        expect(resolution.kind).toBe("ready");
        if (resolution.kind !== "ready") return;
        expect(resolution.parseSource).toBe("deterministic");
        const [added] = resolution.grounded;
        expect(added?.grounded).toBe(true);
        expect(added?.groundingSource).toBe("USDA");
        expect(added?.draftItem.sourceType).toBe("usda");
        expect(added?.draftItem.providerFoodId).toBe("173430");
        expect(added?.draftItem.nutrients.calories).toBe(102);
        // The quantity assumption from the vague phrase is ON the item…
        expect(
            added?.draftItem.assumptions.some(
                (assumption) =>
                    assumption.includes("a good bit") &&
                    assumption.includes("1 tbsp"),
            ),
        ).toBe(true);
        // …and provenance marks it as user-added, in assumptions AND
        // the source snapshot.
        expect(added?.draftItem.assumptions[0]).toBe(
            'Added by you: "I added a good bit of butter"',
        );
        expect(added?.draftItem.sourceSnapshot?.draft_add_parse_source).toBe(
            "deterministic",
        );
        expect(
            added?.draftItem.sourceSnapshot?.draft_add_quantity_assumed,
        ).toBe(true);
        // Totals recompute across the whole draft.
        const total =
            EXISTING_DRAFT_CALORIES +
            resolution.grounded.reduce(
                (sum, entry) => sum + (entry.draftItem.nutrients.calories ?? 0),
                0,
            );
        expect(total).toBe(264 + 35 + 102);
        expect(mealPhotoItemIsComplete(added!)).toBe(true);
    });
});

describe("resolveDraftAdd — (b) an ungrounded add gets labelled Model estimate values", () => {
    test("strong parse + no candidate → estimate step values, source model_estimate, no provider fields", async () => {
        const resolution = await resolveDraftAdd(
            "I added a good bit of durian",
            {
                search: async () => ({ candidates: [], failures: [] }),
                estimateNutrients: async (requests) => {
                    expect(requests).toHaveLength(1);
                    expect(requests[0]?.name).toBe("durian");
                    return new Map([
                        [
                            "item:0",
                            {
                                nutrients: {
                                    calories: 21,
                                    protein_g: 0.2,
                                    carbs_g: 3.3,
                                    fat_g: 0.8,
                                },
                            },
                        ],
                    ]);
                },
            },
        );
        expect(resolution.kind).toBe("ready");
        if (resolution.kind !== "ready") return;
        const [added] = resolution.grounded;
        expect(added?.grounded).toBe(false);
        expect(added?.estimated).toBe(true);
        expect(added?.groundingSource).toBe("model_estimate");
        expect(added?.draftItem.sourceType).toBe("model_estimate");
        expect(added?.draftItem.nutrients.calories).toBe(21);
        expect(added?.draftItem.providerFoodId).toBeUndefined();
        expect(added?.draftItem.provider).toBeUndefined();
        expect(added?.draftItem.sourceSnapshot?.estimate_origin).toBe(
            "model_estimate",
        );
    });

    test("strong parse + no candidate + estimate failure → item with NO values and a BLOCKING question (invariant holds)", async () => {
        const resolution = await resolveDraftAdd("2 tbsp qwixle spread", {
            search: async () => ({ candidates: [], failures: [] }),
            estimateNutrients: async () => {
                throw new Error("estimate unavailable");
            },
        });
        expect(resolution.kind).toBe("ready");
        if (resolution.kind !== "ready") return;
        const [added] = resolution.grounded;
        expect(added?.draftItem.nutrients).toEqual({});
        expect(added?.question?.blocking).toBe(true);
        expect(mealPhotoItemIsComplete(added!)).toBe(true);
    });
});

describe("resolveDraftAdd — (c) ambiguous/unparseable adds never silently add", () => {
    test("weak parse (bare name) that cannot ground → question outcome, even when an estimate exists", async () => {
        const resolution = await resolveDraftAdd("added qwixle", {
            search: async () => ({ candidates: [], failures: [] }),
            estimateNutrients: async () =>
                new Map([
                    [
                        "item:0",
                        {
                            nutrients: {
                                calories: 50,
                                protein_g: 1,
                                carbs_g: 5,
                                fat_g: 3,
                            },
                        },
                    ],
                ]),
        });
        expect(resolution.kind).toBe("question");
        if (resolution.kind !== "question") return;
        expect(resolution.unresolvedNames).toEqual(["qwixle"]);
    });

    test("a grounded pick sharing no name token with the typed food → question outcome", async () => {
        const resolution = await resolveDraftAdd("1 tbsp butter", {
            search: async () => ({
                candidates: [
                    candidate({
                        providerFoodId: "999",
                        name: "Chocolate hazelnut spread",
                    }),
                ],
                failures: [],
            }),
        });
        expect(resolution.kind).toBe("question");
        if (resolution.kind !== "question") return;
        expect(resolution.unresolvedNames).toEqual(["butter"]);
    });

    test("unparseable text: deterministic fails, the model fallback says no food → no_parse", async () => {
        let modelParseCalls = 0;
        const resolution = await resolveDraftAdd("the weather is nice today", {
            search: butterSearch,
            parseWithModel: async () => {
                modelParseCalls += 1;
                return { items: [], replaces: null, preparation: null };
            },
        });
        expect(modelParseCalls).toBe(1);
        expect(resolution.kind).toBe("no_parse");
    });

    test("unparseable text with the fallback failing → no_parse, not a throw and not an add", async () => {
        const resolution = await resolveDraftAdd("the weather is nice today", {
            search: butterSearch,
            parseWithModel: async () => {
                throw new Error("provider down");
            },
        });
        expect(resolution.kind).toBe("no_parse");
    });

    test("'nothing' short-circuits: no search, no model call", async () => {
        let calls = 0;
        const resolution = await resolveDraftAdd("nothing", {
            search: async () => {
                calls += 1;
                return { candidates: [], failures: [] };
            },
            parseWithModel: async () => {
                calls += 1;
                return { items: [], replaces: null, preparation: null };
            },
        });
        expect(resolution.kind).toBe("none");
        expect(calls).toBe(0);
    });
});

describe("resolveDraftAdd — (d) the Ember fallback fires ONLY on deterministic failure", () => {
    test("fallback items ground through the same path and are marked model-parsed", async () => {
        let modelParseCalls = 0;
        const resolution = await resolveDraftAdd(
            "oh I totally forgot the butter, like a decent knob of it",
            {
                search: butterSearch,
                parseWithModel: async (text) => {
                    modelParseCalls += 1;
                    expect(text).toContain("butter");
                    return {
                        items: [
                            {
                                name: "butter",
                                quantity: 1,
                                unit: "tbsp",
                                portionConfidence: 0.85,
                                assumptions: [
                                    'Quantity assumed: "a decent knob" interpreted as 1 tbsp.',
                                ],
                                quantityAssumed: true,
                                strongSignal: true,
                            },
                        ],
                        replaces: null,
                        preparation: null,
                    };
                },
            },
        );
        expect(modelParseCalls).toBe(1);
        expect(resolution.kind).toBe("ready");
        if (resolution.kind !== "ready") return;
        expect(resolution.parseSource).toBe("model");
        const [added] = resolution.grounded;
        expect(added?.grounded).toBe(true);
        expect(added?.draftItem.nutrients.calories).toBe(102);
        expect(added?.draftItem.sourceSnapshot?.draft_add_parse_source).toBe(
            "model",
        );
    });

    test("replacement phrasing carries the remove target through resolution", async () => {
        const resolution = await resolveDraftAdd(
            "actually brown rice, not white rice",
            {
                search: async () => ({
                    candidates: [
                        candidate({
                            providerFoodId: "200",
                            name: "Rice, brown, cooked",
                            nutrientsPer100g: {
                                calories: 112,
                                protein_g: 2.3,
                                carbs_g: 23.5,
                                fat_g: 0.8,
                            },
                        }),
                    ],
                    failures: [],
                }),
            },
        );
        expect(resolution.kind).toBe("ready");
        if (resolution.kind !== "ready") return;
        expect(resolution.removeName).toBe("white rice");
        expect(resolution.grounded[0]?.grounded).toBe(true);
    });
});

describe("resolveDraftAdd — preparation statements (photo-flow P2)", () => {
    const cornContext = [{ name: "Corn On The Cob", cookingMethod: "steamed" }];
    const oilSearch: DraftAddDeps["search"] = async (query) => {
        if (query.includes("oil")) {
            return {
                candidates: [
                    candidate({
                        providerFoodId: "171001",
                        name: "Oil, vegetable",
                        nutrientsPer100g: {
                            calories: 884,
                            protein_g: 0,
                            carbs_g: 0,
                            fat_g: 100,
                        },
                        portions: [
                            {
                                id: "tbsp",
                                amount: 1,
                                unit: "tbsp",
                                label: "1 tbsp",
                                gramWeight: 13.6,
                                nutrients: {
                                    calories: 120,
                                    protein_g: 0,
                                    carbs_g: 0,
                                    fat_g: 13.6,
                                },
                            },
                            {
                                id: "100g",
                                amount: 100,
                                unit: "g",
                                label: "100 g",
                                gramWeight: 100,
                                nutrients: {
                                    calories: 884,
                                    protein_g: 0,
                                    carbs_g: 0,
                                    fat_g: 100,
                                },
                            },
                        ],
                    }),
                ],
                failures: [],
            };
        }
        return { candidates: [], failures: [] };
    };

    test("'i deep fried it' on a steamed item → method correction targeted + implied oil grounded as an added item", async () => {
        const resolution = await resolveDraftAdd(
            "i deep fried it",
            {
                search: oilSearch,
                parseWithModel: async (text, context) => {
                    expect(text).toBe("i deep fried it");
                    // The draft context reached the parse.
                    expect(context.items).toEqual(cornContext);
                    return {
                        items: [
                            {
                                name: "vegetable oil",
                                quantity: 1,
                                unit: "tbsp",
                                portionConfidence: 0.85,
                                assumptions: [
                                    "Oil absorbed in deep frying, assumed 1 tbsp",
                                ],
                                quantityAssumed: true,
                                strongSignal: true,
                            },
                        ],
                        replaces: null,
                        preparation: {
                            targetItem: "Corn On The Cob",
                            cookingMethod: "deep fried",
                        },
                    };
                },
            },
            cornContext,
        );
        expect(resolution.kind).toBe("ready");
        if (resolution.kind !== "ready") return;
        expect(resolution.preparation).toEqual({
            targetItem: "Corn On The Cob",
            cookingMethod: "deep fried",
        });
        expect(resolution.preparationTargetName).toBe("Corn On The Cob");
        const [oil] = resolution.grounded;
        expect(oil?.grounded).toBe(true);
        expect(oil?.draftItem.name).toContain("Oil, vegetable");
        expect(oil?.draftItem.nutrients.calories).toBe(120);
        expect(oil?.draftItem.assumptions[0]).toBe(
            'Added by you: "i deep fried it"',
        );
        expect(mealPhotoItemIsComplete(oil!)).toBe(true);
    });

    test("'grilled instead' → method only: ready with no additions", async () => {
        const resolution = await resolveDraftAdd(
            "grilled instead",
            {
                search: oilSearch,
                parseWithModel: async () => ({
                    items: [],
                    replaces: null,
                    preparation: {
                        targetItem: null,
                        cookingMethod: "grilled",
                    },
                }),
            },
            [{ name: "Chicken breast", cookingMethod: "baked" }],
        );
        expect(resolution.kind).toBe("ready");
        if (resolution.kind !== "ready") return;
        expect(resolution.grounded).toEqual([]);
        expect(resolution.preparation?.cookingMethod).toBe("grilled");
        expect(resolution.preparationTargetName).toBe("Chicken breast");
    });

    test("an unnamed target on a multi-item draft → preparation_question, nothing guessed", async () => {
        const resolution = await resolveDraftAdd(
            "i deep fried it",
            {
                search: oilSearch,
                parseWithModel: async () => ({
                    items: [],
                    replaces: null,
                    preparation: {
                        targetItem: null,
                        cookingMethod: "deep fried",
                    },
                }),
            },
            [
                { name: "Corn On The Cob", cookingMethod: "steamed" },
                { name: "Chicken breast", cookingMethod: "baked" },
            ],
        );
        expect(resolution.kind).toBe("preparation_question");
    });

    test("a named target that matches no draft item → preparation_question", async () => {
        const resolution = await resolveDraftAdd(
            "the tofu was deep fried",
            {
                search: oilSearch,
                parseWithModel: async () => ({
                    items: [],
                    replaces: null,
                    preparation: {
                        targetItem: "Tofu",
                        cookingMethod: "deep fried",
                    },
                }),
            },
            cornContext,
        );
        expect(resolution.kind).toBe("preparation_question");
    });
});

describe("planPreparationUpdate (photo-flow P2)", () => {
    test("the corrected method lands in assumptions + snapshot, with the original preserved", () => {
        const planned = planPreparationUpdate(
            {
                name: "Corn On The Cob",
                quantity: 3,
                portionLabel: "3 piece",
                gramWeight: 270,
                nutrients: { calories: 232 },
                sourceType: "open_food_facts",
                assumptions: ["Counted 3 piece at about 90 g each."],
                sourceSnapshot: {
                    resolution_layer: "meal_photo_grounding",
                    cooking_method: "steamed",
                },
            } as never,
            { targetItem: "Corn On The Cob", cookingMethod: "deep fried" },
        );
        expect(planned.previousMethod).toBe("steamed");
        expect(planned.item.assumptions[0]).toContain(
            'Cooking method corrected by you: "deep fried"',
        );
        expect(planned.item.assumptions[0]).toContain('"steamed"');
        expect(planned.item.sourceSnapshot?.cooking_method).toBe("deep fried");
        expect(planned.item.sourceSnapshot?.cooking_method_corrected_from).toBe(
            "steamed",
        );
        // The grounded nutrition is NOT silently rewritten.
        expect(planned.item.nutrients.calories).toBe(232);
        expect(planned.item.gramWeight).toBe(270);
    });
});
