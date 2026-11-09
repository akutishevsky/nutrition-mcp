import { describe, expect, test } from "bun:test";
import type { FoodCandidate } from "../food-providers/types.js";
import {
    DEFAULT_RECIPE_IMPORT_AI_MODEL,
    OpenRouterRecipeImportResolver,
    recipeImportAiConfig,
} from "./semantic-resolver.js";

const recipe = {
    name: "Coq au Vin",
    description: "A slow-cooked chicken dinner.",
    servings: 6,
    instructions: ["Add the cream to the potatoes."],
    ingredients: [
        {
            rawText: "4-5 small Yukon gold potatoes",
            name: "small Yukon gold potatoes",
            quantity: 4,
            unit: "piece",
        },
    ],
};

function response(payload: unknown): Response {
    return new Response(
        JSON.stringify({
            choices: [{ message: { content: JSON.stringify(payload) } }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
    );
}

describe("recipe import website AI configuration", () => {
    test("uses the configurable OpenRouter model and disables cleanly without a key", () => {
        expect(
            recipeImportAiConfig({
                OPENROUTER_API_KEY: "or-test",
                MUNCH_AI_MODEL: "google/gemini-test",
                MUNCH_RECIPE_IMPORT_AI_MAX_CALLS_PER_IMPORT: "1",
            }),
        ).toMatchObject({
            model: "google/gemini-test",
            maxCallsPerImport: 1,
            responseFormat: "json_object",
            responseHealing: true,
        });
        expect(
            recipeImportAiConfig({
                OPENROUTER_API_KEY: "",
            }),
        ).toBeNull();
        expect(
            recipeImportAiConfig({
                OPENROUTER_API_KEY: "or-test",
            })?.model,
        ).toBe(DEFAULT_RECIPE_IMPORT_AI_MODEL);
        expect(DEFAULT_RECIPE_IMPORT_AI_MODEL).toBe("meta/muse-ember");
        expect(
            recipeImportAiConfig({
                OPENROUTER_API_KEY: "or-test",
                MUNCH_RECIPE_IMPORT_AI_RESPONSE_FORMAT: "json_object",
                MUNCH_RECIPE_IMPORT_AI_RESPONSE_HEALING: "false",
            }),
        ).toMatchObject({
            responseFormat: "json_object",
            responseHealing: false,
        });
    });
});

describe("OpenRouter recipe import resolver", () => {
    test("sends structured normalization requests without exposing a raw database or accepting invented IDs", async () => {
        const requests: Array<{ url: string; body: Record<string, unknown> }> =
            [];
        const resolver = new OpenRouterRecipeImportResolver(
            {
                apiKey: "or-test",
                baseUrl: "https://openrouter.example/api/v1",
                model: "openai/gpt-test",
                timeoutMs: 5_000,
                maxTokens: 2_000,
                maxCallsPerImport: 2,
                responseFormat: "json_schema",
                responseHealing: true,
            },
            {
                fetcher: async (input, init) => {
                    const body = JSON.parse(String(init?.body));
                    requests.push({ url: String(input), body });
                    return response({
                        ingredients: [
                            {
                                raw_index: 0,
                                components: [
                                    {
                                        name: "Yukon gold potato",
                                        quantity: 4.5,
                                        unit: "piece",
                                        preparation: null,
                                        optional: false,
                                        search_queries: [
                                            "Yukon gold potato",
                                            "potato",
                                        ],
                                        assumption:
                                            "Used the midpoint of the 4-5 potato range.",
                                        impact: "medium",
                                        confidence: 0.94,
                                    },
                                ],
                                notes: [],
                            },
                        ],
                    });
                },
            },
        );

        const intents = await resolver.normalizeRecipe(recipe);
        expect(intents[0]).toMatchObject({
            rawIndex: 0,
            name: "Yukon gold potato",
            quantity: 4.5,
            assumption: "Used the midpoint of the 4-5 potato range.",
        });
        expect(requests[0]?.url).toBe(
            "https://openrouter.example/api/v1/chat/completions",
        );
        expect(requests[0]?.body.model).toBe("openai/gpt-test");
        expect(requests[0]?.body.response_format).toBeDefined();
        expect(requests[0]?.body.plugins).toEqual([{ id: "response-healing" }]);
        expect(requests[0]?.body.stream).toBe(false);
        expect(requests[0]?.body.reasoning).toEqual({ enabled: false });
        const requestBody = JSON.stringify(requests[0]?.body);
        expect(requestBody).not.toContain("provider_food_id");
        expect(requestBody).toContain("leave quantity and unit unset");
        expect(requestBody).not.toContain("1/4 teaspoon salt");
        expect(requestBody).not.toContain("1/8 teaspoon pepper");
    });

    test("reranks only the supplied candidates and returns the selected choice", async () => {
        const candidate: FoodCandidate = {
            provider: "usda",
            providerFoodId: "100",
            name: "potato",
            dataKind: "generic",
            portions: [],
            attribution: { label: "USDA" },
            confidence: 0.9,
        };
        const resolver = new OpenRouterRecipeImportResolver(
            {
                apiKey: "or-test",
                baseUrl: "https://openrouter.example/api/v1",
                model: "openai/gpt-test",
                timeoutMs: 5_000,
                maxTokens: 2_000,
                maxCallsPerImport: 2,
                responseFormat: "json_schema",
                responseHealing: true,
            },
            {
                fetcher: async () =>
                    response({
                        selections: [
                            {
                                key: "0:0",
                                candidate_id: "usda:100",
                                confidence: 0.88,
                                rationale:
                                    "The candidate is the generic food identity.",
                            },
                        ],
                    }),
            },
        );
        const choices = await resolver.chooseCandidates?.([
            {
                key: "0:0",
                ingredient: recipe.ingredients[0],
                candidates: [candidate],
            },
        ]);
        expect(choices?.get("0:0")).toEqual({
            candidateId: "usda:100",
            confidence: 0.88,
            rationale: "The candidate is the generic food identity.",
        });
    });

    test("classifies a response-body abort as a timeout instead of invalid JSON", async () => {
        const resolver = new OpenRouterRecipeImportResolver(
            {
                apiKey: "or-test",
                baseUrl: "https://openrouter.example/api/v1",
                model: "openai/gpt-test",
                timeoutMs: 5,
                maxTokens: 2_000,
                maxCallsPerImport: 2,
                responseFormat: "json_schema",
                responseHealing: true,
            },
            {
                fetcher: async () =>
                    ({
                        ok: true,
                        status: 200,
                        json: async () => {
                            await new Promise((resolve) =>
                                setTimeout(resolve, 20),
                            );
                            throw new Error("simulated aborted body");
                        },
                    }) as Response,
            },
        );

        let error: unknown;
        try {
            await resolver.normalizeRecipe(recipe);
        } catch (caught) {
            error = caught;
        }
        expect(error).toMatchObject({ code: "timeout" });
    });
});
