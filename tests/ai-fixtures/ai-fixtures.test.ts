import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { generateGuidanceProposals } from "../../src/app/guidance-ai.js";
import { previewInventoryImage } from "../../src/inventory/vision.js";
import { assertNoOpenBlockingQuestions } from "../../src/meal-drafts/blocking.js";
import type { MealDraft } from "../../src/meal-drafts/types.js";
import { estimateMealPhotoNutrients } from "../../src/meal-photo/estimate.js";
import {
    groundMealPhotoItems,
    mealPhotoItemIsComplete,
} from "../../src/meal-photo/grounding.js";
import { identifyMealPhoto } from "../../src/meal-photo/vision.js";
import type { FoodCandidate } from "../../src/food-providers/types.js";
import {
    requestPantryMealIdeas,
    validateMealIdeaGrounding,
    type PantryMealIdeasResponse,
} from "../../src/inventory/meal-ideas.js";
import { OpenRouterRecipeImportResolver } from "../../src/recipe-import/semantic-resolver.js";
import { websiteGuidanceAiConfig } from "../../src/website-ai-config.js";

/**
 * S0 ai-fixture lane: recorded OpenRouter responses (golden JSON in this
 * directory) replayed through the real AI modules with the transport
 * mocked. Deterministic, secret-free, zero live spend. The model slug in
 * every fixture is the program's target model; the modules under test do
 * not care which model "recorded" the envelope, only that the recorded
 * shape still parses, heals, and grounds.
 */

const fixtureDir = join(import.meta.dir);

async function loadFixture(name: string): Promise<Record<string, any>> {
    return JSON.parse(await readFile(join(fixtureDir, name), "utf8"));
}

function recordedFetcher(fixture: Record<string, any>, seen?: string[]) {
    return async (input: RequestInfo | URL) => {
        seen?.push(String(input));
        return new Response(JSON.stringify(fixture), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    };
}

function fixtureContent(fixture: Record<string, any>): string {
    const content = fixture.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
        throw new Error("Fixture is missing recorded message content");
    }
    return content;
}

const visionConfig = {
    apiKey: "fixture-key",
    model: "meta/muse-ember",
    baseUrl: "https://openrouter.invalid/v1",
    timeoutMs: 1_000,
};

describe("ai-fixture: pantry vision (recorded responses)", () => {
    test("receipt fixture parses through the strict preview schema", async () => {
        const fixture = await loadFixture("vision-receipt.response.json");
        const seen: string[] = [];
        const preview = await previewInventoryImage(
            {
                mode: "receipt",
                mimeType: "image/jpeg",
                bytes: new Uint8Array([1, 2, 3]),
            },
            visionConfig,
            { fetcher: recordedFetcher(fixture, seen) },
        );
        expect(seen).toEqual([
            "https://openrouter.invalid/v1/chat/completions",
        ]);
        expect(preview.lines).toHaveLength(3);
        expect(preview.lines[0]).toMatchObject({
            name: "Ground beef",
            is_food: true,
            location: "fridge",
        });
        expect(preview.lines[2]?.is_food).toBe(false);
    });

    test("pantry photo fixture parses and keeps review notes", async () => {
        const fixture = await loadFixture("vision-pantry-photo.response.json");
        const preview = await previewInventoryImage(
            {
                mode: "pantry_photo",
                mimeType: "image/png",
                bytes: new Uint8Array([4, 5]),
            },
            visionConfig,
            { fetcher: recordedFetcher(fixture) },
        );
        expect(preview.lines.map((line) => line.name)).toEqual([
            "Eggs",
            "Frozen peas",
        ]);
        expect(preview.lines[1]?.location).toBe("freezer");
        expect(preview.notes).toEqual(["Back row partially obscured."]);
    });
});

describe("ai-fixture: pantry meal ideas (recorded response + grounding)", () => {
    test("grounding keeps the grounded candidate and drops the invented one", async () => {
        const fixture = await loadFixture("meal-ideas.response.json");
        const decoded = JSON.parse(
            fixtureContent(fixture),
        ) as PantryMealIdeasResponse;
        expect(decoded.candidates).toHaveLength(2);

        const context = {
            request: {
                goal: "high_protein",
                meal_type: "dinner",
                servings: 2,
                max_minutes: 45,
                allow_missing_items: 1,
                assumed_staples: ["salt", "black pepper"],
            },
            pantry: [{ name: "ground beef" }, { name: "smoked paprika" }],
            saved_recipe_candidates: [
                {
                    recipe_id: "11111111-1111-4111-8111-111111111111",
                    name: "Smoky beef bowl",
                },
            ],
        };
        const grounded = validateMealIdeaGrounding(decoded, context as any);
        expect(grounded.candidates).toHaveLength(1);
        expect(grounded.candidates[0]?.name).toBe("Smoky beef bowl");
        expect(grounded.candidates[0]?.source).toBe("saved_recipe");
    });

    test("recorded response replays through the real request path (schema, healing, grounding)", async () => {
        const fixture = await loadFixture("meal-ideas.response.json");
        const context = {
            request: {
                goal: "high_protein",
                meal_type: "dinner",
                servings: 2,
                max_minutes: 45,
                allow_missing_items: 1,
                assumed_staples: ["salt", "black pepper"],
            },
            pantry: [{ name: "ground beef" }, { name: "smoked paprika" }],
            pantry_enrichment: { resolved: 2, partial: 0, unresolved: 0 },
            saved_recipe_candidates: [
                {
                    recipe_id: "11111111-1111-4111-8111-111111111111",
                    name: "Smoky beef bowl",
                },
            ],
        };
        let requestBody: Record<string, any> = {};
        const result = await requestPantryMealIdeas(
            {
                apiKey: "fixture-key",
                model: "meta/muse-ember",
                baseUrl: "https://openrouter.invalid/v1",
                timeoutMs: 1_000,
                maxTokens: 2_000,
            },
            context as any,
            {
                fetcher: async (_input, init) => {
                    requestBody = JSON.parse(String(init?.body ?? "{}"));
                    return new Response(JSON.stringify(fixture), {
                        status: 200,
                        headers: { "content-type": "application/json" },
                    });
                },
            },
        );
        expect(result.candidates).toHaveLength(1);
        expect(result.candidates[0]?.name).toBe("Smoky beef bowl");
        expect(requestBody.model).toBe("meta/muse-ember");
        expect(requestBody.temperature).toBe(0);
        expect(requestBody.max_tokens).toBe(2_000);
        expect(requestBody.plugins).toEqual([{ id: "response-healing" }]);
        expect(requestBody.response_format?.type).toBe("json_schema");
    });
});

describe("ai-fixture: recipe import resolver (recorded response)", () => {
    test("normalize fixture resolves ingredient intents with no invented IDs", async () => {
        const fixture = await loadFixture(
            "recipe-import-normalize.response.json",
        );
        const resolver = new OpenRouterRecipeImportResolver(
            {
                apiKey: "fixture-key",
                baseUrl: "https://openrouter.invalid/v1",
                model: "meta/muse-ember",
                timeoutMs: 1_000,
                maxTokens: 2_000,
                maxCallsPerImport: 2,
                responseFormat: "json_schema",
                responseHealing: true,
            },
            { fetcher: recordedFetcher(fixture) },
        );
        const recipe = {
            name: "Fixture Stew",
            description: "A generic fixture recipe.",
            servings: 4,
            instructions: ["Add the potatoes."],
            ingredients: [
                {
                    rawText: "4-5 small Yukon gold potatoes",
                    name: "small Yukon gold potatoes",
                    quantity: 4,
                    unit: "piece",
                },
            ],
        };
        const intents = await resolver.normalizeRecipe(recipe as any);
        expect(intents).toHaveLength(1);
        expect(intents[0]).toMatchObject({
            rawIndex: 0,
            name: "Yukon gold potato",
            quantity: 4.5,
            assumption: "Used the midpoint of the 4-5 potato range.",
        });
        expect(JSON.stringify(intents)).not.toContain("provider_food_id");
        expect(JSON.stringify(intents)).not.toContain("providerFoodId");
    });
});

describe("ai-fixture: guidance proposals (recorded response)", () => {
    test("propose fixture validates against the requested slots through the real module", async () => {
        const fixture = await loadFixture("guidance-propose.response.json");
        const config = websiteGuidanceAiConfig({
            OPENROUTER_API_KEY: "fixture-key",
        });
        // The guidance selector must resolve to Ember with no overrides.
        expect(config?.model).toBe("meta/muse-ember");
        const seen: string[] = [];
        const result = await generateGuidanceProposals(
            {
                config: config!,
                slots: [
                    { date: "2026-11-10", meal_slot: "dinner", servings: 2 },
                ],
                safeContext: {
                    preferences: {},
                    saved_recipe_names: [],
                    recent_plan_history: [],
                },
            },
            { fetcher: recordedFetcher(fixture, seen) },
        );
        expect(seen).toEqual(["https://openrouter.ai/api/v1/chat/completions"]);
        expect(result.status).toBe("proposed");
        if (result.status === "proposed") {
            expect(result.model).toBe("meta/muse-ember");
            expect(result.items).toHaveLength(1);
            expect(result.items[0]?.date).toBe("2026-11-10");
            expect(result.items[0]?.meal_slot).toBe("dinner");
            expect(result.items[0]?.generated_recipe?.name).toBe(
                "Fixture Herb Chicken",
            );
        }
    });
});

describe("ai-fixture: meal photo identify (recorded response)", () => {
    test("recorded Ember envelope parses through the strict stage-2 schema with no nutrition", async () => {
        const fixture = await loadFixture("meal-photo.response.json");
        expect(fixture.model).toBe("meta/muse-ember");
        const result = await identifyMealPhoto(
            {
                mimeType: "image/jpeg",
                bytes: new Uint8Array([7, 8, 9]),
            },
            visionConfig,
            { fetcher: recordedFetcher(fixture) },
        );
        expect(result.items).toHaveLength(2);
        expect(result.items[0]).toMatchObject({
            name: "grilled chicken breast",
            cooking_method: "grilled",
            quantity: 160,
            unit: "g",
            portion_confidence: 0.85,
        });
        expect(JSON.stringify(result)).not.toMatch(
            /calories|protein_g|carbs_g|fat_g/,
        );
    });
});

describe("ai-fixture: meal photo production case — chicken/rice/broccoli (S3 hardening)", () => {
    function usdaCandidate(
        name: string,
        id: string,
        per100: FoodCandidate["nutrientsPer100g"],
    ): FoodCandidate {
        return {
            provider: "usda",
            providerFoodId: id,
            name,
            dataKind: "generic",
            nutrientsPer100g: per100,
            portions: [
                {
                    id: "100g",
                    amount: 100,
                    unit: "g",
                    label: "100 g",
                    gramWeight: 100,
                    nutrients: per100!,
                },
            ],
            attribution: {
                label: "USDA FoodData Central",
                url: `https://fdc.nal.usda.gov/food/${id}`,
            },
            confidence: 0.95,
        };
    }

    // Grounding seam mirroring production: chicken + broccoli resolve
    // to USDA candidates; rice gets NO usable candidate.
    const search = async (query: string) => {
        if (query.includes("chicken")) {
            return {
                candidates: [
                    usdaCandidate("Chicken breast, grilled", "171688", {
                        calories: 165,
                        protein_g: 31,
                        carbs_g: 0,
                        fat_g: 3.6,
                    }),
                ],
                failures: [],
            };
        }
        if (query.includes("broccoli")) {
            return {
                candidates: [
                    usdaCandidate("Broccoli, cooked", "170379", {
                        calories: 35,
                        protein_g: 2.4,
                        carbs_g: 7.2,
                        fat_g: 0.4,
                    }),
                ],
                failures: [],
            };
        }
        return { candidates: [], failures: [] };
    };

    test("recorded vision + grounding + estimate: rice carries values labelled Model estimate, total includes rice", async () => {
        const visionFixture = await loadFixture(
            "meal-photo-chicken-rice-broccoli.response.json",
        );
        const vision = await identifyMealPhoto(
            { mimeType: "image/jpeg", bytes: new Uint8Array([7, 8, 9]) },
            visionConfig,
            { fetcher: recordedFetcher(visionFixture) },
        );
        expect(vision.items.map((item) => item.name)).toEqual([
            "grilled chicken breast",
            "cooked white rice",
            "steamed broccoli",
        ]);

        const estimateFixture = await loadFixture(
            "meal-photo-estimate-rice.response.json",
        );
        const grounded = await groundMealPhotoItems(vision.items, {
            search: search as never,
            estimateNutrients: (requests) =>
                estimateMealPhotoNutrients(requests, visionConfig, {
                    fetcher: recordedFetcher(estimateFixture),
                }),
        });

        const [chicken, rice, broccoli] = grounded;
        expect(chicken?.grounded).toBe(true);
        expect(chicken?.draftItem.sourceType).toBe("usda");
        expect(chicken?.draftItem.nutrients.calories).toBe(264);
        expect(broccoli?.grounded).toBe(true);
        expect(broccoli?.draftItem.nutrients.calories).toBe(35);

        // The regression assertion (inverted from the pre-fix repro,
        // where this item arrived with nutrients {} and no question):
        expect(rice?.grounded).toBe(false);
        expect(rice?.estimated).toBe(true);
        expect(rice?.draftItem.sourceType).toBe("model_estimate");
        expect(rice?.draftItem.nutrients).toMatchObject({
            calories: 205,
            protein_g: 4.3,
            carbs_g: 44.5,
            fat_g: 0.4,
        });
        expect(rice?.draftItem.providerFoodId).toBeUndefined();
        expect(rice?.draftItem.provider).toBeUndefined();
        expect(rice?.draftItem.sourceSnapshot?.estimate_origin).toBe(
            "model_estimate",
        );
        expect(rice?.question).toBeNull();

        const total = grounded.reduce(
            (sum, entry) => sum + (entry.draftItem.nutrients.calories ?? 0),
            0,
        );
        expect(total).toBe(264 + 205 + 35);
        for (const entry of grounded) {
            expect(mealPhotoItemIsComplete(entry)).toBe(true);
        }
    });

    test("estimate-failure variant: rice gets a BLOCKING question and the shared confirm guard refuses, naming the rice", async () => {
        const visionFixture = await loadFixture(
            "meal-photo-chicken-rice-broccoli.response.json",
        );
        const vision = await identifyMealPhoto(
            { mimeType: "image/jpeg", bytes: new Uint8Array([7, 8, 9]) },
            visionConfig,
            { fetcher: recordedFetcher(visionFixture) },
        );
        const grounded = await groundMealPhotoItems(vision.items, {
            search: search as never,
            estimateNutrients: (requests) =>
                estimateMealPhotoNutrients(requests, visionConfig, {
                    // Unusable output on both bounded attempts.
                    fetcher: async () =>
                        new Response(
                            JSON.stringify({
                                choices: [{ message: { content: "not json" } }],
                            }),
                            {
                                status: 200,
                                headers: {
                                    "content-type": "application/json",
                                },
                            },
                        ),
                }),
        });
        const rice = grounded[1]!;
        expect(rice.draftItem.nutrients).toEqual({});
        expect(rice.question?.blocking).toBe(true);
        expect(rice.question?.questionKey).toBe("photo_estimate_missing_1");
        for (const entry of grounded) {
            expect(mealPhotoItemIsComplete(entry)).toBe(true);
        }

        // The same guard the shared confirm path enforces
        // (prepareMealDraftConfirmation / confirmMealDraft call
        // assertNoOpenBlockingQuestions): refusal names the item.
        const draftLike = {
            items: grounded.map((entry, index) => ({
                id: `item-${index}`,
                item: entry.draftItem,
            })),
            questions: grounded
                .filter((entry) => entry.question)
                .map((entry, index) => ({
                    id: `question-${index}`,
                    itemId: `item-${grounded.indexOf(entry)}`,
                    questionKey: entry.question!.questionKey,
                    prompt: entry.question!.prompt,
                    status: "open" as const,
                })),
        } as unknown as MealDraft;
        let message = "";
        try {
            assertNoOpenBlockingQuestions(draftLike);
        } catch (error) {
            message = String(error);
        }
        expect(message).toContain("cooked white rice");
        expect(message).toContain("cannot be confirmed");
    });
});
