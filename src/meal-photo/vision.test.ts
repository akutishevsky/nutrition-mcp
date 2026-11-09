import { describe, expect, test } from "bun:test";
import {
    chooseMealPhotoCandidates,
    identifyMealPhoto,
    mealPhotoVisionConfig,
    MealPhotoNoFoodError,
    type MealPhotoVisionConfig,
} from "./vision.js";

const config: MealPhotoVisionConfig = {
    apiKey: "test-key",
    model: "meta/muse-ember",
    baseUrl: "https://example.test/v1",
    timeoutMs: 1_000,
};

function envelope(content: string) {
    return new Response(
        JSON.stringify({ choices: [{ message: { content } }] }),
        { status: 200, headers: { "content-type": "application/json" } },
    );
}

const oneItem = JSON.stringify({
    items: [
        {
            name: "grilled chicken breast",
            cooking_method: "grilled",
            quantity: 160,
            unit: "g",
            portion_confidence: 0.85,
            assumptions: ["assumed skinless breast"],
        },
    ],
});

describe("meal photo vision config", () => {
    test("requires an OpenRouter key and honours the kill switch", () => {
        expect(mealPhotoVisionConfig({})).toBeNull();
        expect(
            mealPhotoVisionConfig({
                OPENROUTER_API_KEY: "k",
                MUNCH_MEAL_PHOTO_ENABLED: "false",
            }),
        ).toBeNull();
        expect(mealPhotoVisionConfig({ OPENROUTER_API_KEY: "k" })?.model).toBe(
            "meta/muse-ember",
        );
    });
});

describe("identifyMealPhoto", () => {
    test("sends the strict schema, healing plugin, temp 0, and no-nutrition instruction", async () => {
        let body: Record<string, any> = {};
        const result = await identifyMealPhoto(
            { mimeType: "image/jpeg", bytes: new Uint8Array([1, 2, 3]) },
            config,
            {
                fetcher: async (_url, init) => {
                    body = JSON.parse(String(init?.body ?? "{}"));
                    return envelope(oneItem);
                },
            },
        );
        expect(result.items).toHaveLength(1);
        expect(result.items[0]?.name).toBe("grilled chicken breast");
        expect(body.temperature).toBe(0);
        expect(body.response_format?.json_schema?.strict).toBe(true);
        expect(body.plugins).toEqual([{ id: "response-healing" }]);
        expect(body.provider).toEqual({ data_collection: "deny" });
        expect(JSON.stringify(body.response_format)).not.toMatch(/calories/);
    });

    test("rejects a response carrying nutrition numbers (strict schema)", async () => {
        const withNutrition = JSON.stringify({
            items: [
                {
                    name: "rice",
                    cooking_method: null,
                    quantity: 1,
                    unit: "cup",
                    portion_confidence: 0.8,
                    assumptions: [],
                    calories: 200,
                },
            ],
        });
        let calls = 0;
        await expect(
            identifyMealPhoto(
                { mimeType: "image/jpeg", bytes: new Uint8Array([1]) },
                config,
                {
                    fetcher: async () => {
                        calls += 1;
                        return envelope(withNutrition);
                    },
                },
            ),
        ).rejects.toThrow();
        expect(calls).toBe(2);
    });

    test("retries once on unparseable output, then succeeds", async () => {
        let calls = 0;
        const result = await identifyMealPhoto(
            { mimeType: "image/png", bytes: new Uint8Array([1]) },
            config,
            {
                fetcher: async () => {
                    calls += 1;
                    return envelope(calls === 1 ? "not json" : oneItem);
                },
            },
        );
        expect(calls).toBe(2);
        expect(result.items).toHaveLength(1);
    });

    test("empty items means no food (no draft, no charge upstream)", async () => {
        await expect(
            identifyMealPhoto(
                { mimeType: "image/jpeg", bytes: new Uint8Array([1]) },
                config,
                {
                    fetcher: async () =>
                        envelope(JSON.stringify({ items: [] })),
                },
            ),
        ).rejects.toBeInstanceOf(MealPhotoNoFoodError);
    });

    test("does not retry HTTP failures", async () => {
        let calls = 0;
        await expect(
            identifyMealPhoto(
                { mimeType: "image/jpeg", bytes: new Uint8Array([1]) },
                config,
                {
                    fetcher: async () => {
                        calls += 1;
                        return new Response("nope", { status: 401 });
                    },
                },
            ),
        ).rejects.toThrow("HTTP 401");
        expect(calls).toBe(1);
    });
});

describe("chooseMealPhotoCandidates", () => {
    test("discards hallucinated candidate IDs", async () => {
        const choices = await chooseMealPhotoCandidates(
            [
                {
                    key: "item:0",
                    itemName: "rice",
                    cookingMethod: null,
                    candidates: [
                        {
                            candidateId: "usda:1",
                            name: "Rice, cooked",
                            brand: null,
                            provider: "usda",
                        },
                    ],
                },
                {
                    key: "item:1",
                    itemName: "beans",
                    cookingMethod: null,
                    candidates: [
                        {
                            candidateId: "usda:2",
                            name: "Beans",
                            brand: null,
                            provider: "usda",
                        },
                    ],
                },
            ],
            config,
            {
                fetcher: async () =>
                    envelope(
                        JSON.stringify({
                            selections: [
                                {
                                    key: "item:0",
                                    candidate_id: "usda:999-invented",
                                    confidence: 0.9,
                                    rationale: null,
                                },
                                {
                                    key: "item:1",
                                    candidate_id: "usda:2",
                                    confidence: 0.9,
                                    rationale: "exact",
                                },
                            ],
                        }),
                    ),
            },
        );
        expect(choices.has("item:0")).toBe(false);
        expect(choices.get("item:1")?.candidateId).toBe("usda:2");
    });
});
