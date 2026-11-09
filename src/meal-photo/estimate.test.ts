import { describe, expect, test } from "bun:test";
import {
    estimateMealPhotoNutrients,
    mealPhotoEstimateJsonSchema,
    usableEstimateNutrients,
    type MealPhotoEstimateRequest,
} from "./estimate.js";
import type { MealPhotoVisionConfig } from "./vision.js";

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

const riceRequest: MealPhotoEstimateRequest = {
    key: "item:1",
    name: "cooked white rice",
    cookingMethod: "steamed",
    quantity: 1,
    unit: "cup",
    assumptions: [],
};

const riceEstimate = JSON.stringify({
    estimates: [
        {
            key: "item:1",
            nutrients: {
                calories: 205,
                protein_g: 4.3,
                carbs_g: 44.5,
                fat_g: 0.4,
                fiber_g: 0.6,
                sugar_g: 0.1,
                alcohol_g: null,
                sodium_mg: 1,
                saturated_fat_g: 0.1,
                cholesterol_mg: 0,
                potassium_mg: 55,
            },
        },
    ],
});

describe("estimateMealPhotoNutrients", () => {
    test("batches every request into ONE call: temp 0, strict schema WITH nutrient fields, healing plugin", async () => {
        let calls = 0;
        let body: Record<string, any> = {};
        const result = await estimateMealPhotoNutrients(
            [
                riceRequest,
                { ...riceRequest, key: "item:2", name: "side salad" },
            ],
            config,
            {
                fetcher: async (_url, init) => {
                    calls += 1;
                    body = JSON.parse(String(init?.body ?? "{}"));
                    return envelope(
                        JSON.stringify({
                            estimates: [
                                JSON.parse(riceEstimate).estimates[0],
                                {
                                    key: "item:2",
                                    nutrients: {
                                        calories: 35,
                                        protein_g: 1.5,
                                        carbs_g: 5,
                                        fat_g: 1,
                                        fiber_g: 2,
                                        sugar_g: null,
                                        alcohol_g: null,
                                        sodium_mg: null,
                                        saturated_fat_g: null,
                                        cholesterol_mg: null,
                                        potassium_mg: null,
                                    },
                                },
                            ],
                        }),
                    );
                },
            },
        );
        expect(calls).toBe(1);
        expect(result.get("item:1")?.calories).toBe(205);
        expect(result.get("item:2")?.calories).toBe(35);
        expect(body.temperature).toBe(0);
        expect(body.response_format?.json_schema?.strict).toBe(true);
        expect(body.response_format?.json_schema?.name).toBe(
            "munch_meal_photo_estimate",
        );
        expect(body.plugins).toEqual([{ id: "response-healing" }]);
        expect(body.provider).toEqual({ data_collection: "deny" });
        expect(typeof body.max_tokens).toBe("number");
        const schemaText = JSON.stringify(mealPhotoEstimateJsonSchema);
        expect(schemaText).toContain("calories");
        expect(schemaText).toContain("protein_g");
        // The request carries only the item + stated portion — no
        // provider data is requested or implied.
        expect(JSON.stringify(body.messages)).toContain("cooked white rice");
        expect(JSON.stringify(body.messages)).not.toContain("provider_food_id");
    });

    test("null optional nutrients are dropped, values rounded", async () => {
        const result = await estimateMealPhotoNutrients([riceRequest], config, {
            fetcher: async () => envelope(riceEstimate),
        });
        const nutrients = result.get("item:1")!;
        expect(nutrients.calories).toBe(205);
        expect(nutrients.alcohol_g).toBeUndefined();
        expect(nutrients.sodium_mg).toBe(1);
    });

    test("retries once on unparseable output, then succeeds", async () => {
        let calls = 0;
        const result = await estimateMealPhotoNutrients([riceRequest], config, {
            fetcher: async () => {
                calls += 1;
                return envelope(calls === 1 ? "not json" : riceEstimate);
            },
        });
        expect(calls).toBe(2);
        expect(result.get("item:1")?.calories).toBe(205);
    });

    test("throws after the bounded retry when output stays unusable", async () => {
        let calls = 0;
        await expect(
            estimateMealPhotoNutrients([riceRequest], config, {
                fetcher: async () => {
                    calls += 1;
                    return envelope("still not json");
                },
            }),
        ).rejects.toThrow();
        expect(calls).toBe(2);
    });

    test("does not retry HTTP failures", async () => {
        let calls = 0;
        await expect(
            estimateMealPhotoNutrients([riceRequest], config, {
                fetcher: async () => {
                    calls += 1;
                    return new Response("nope", { status: 503 });
                },
            }),
        ).rejects.toThrow("HTTP 503");
        expect(calls).toBe(1);
    });

    test("a zero-calorie or missing entry is unusable — key absent from the map", async () => {
        const result = await estimateMealPhotoNutrients(
            [riceRequest, { ...riceRequest, key: "item:9", name: "mystery" }],
            config,
            {
                fetcher: async () =>
                    envelope(
                        JSON.stringify({
                            estimates: [
                                {
                                    key: "item:1",
                                    nutrients: {
                                        calories: 0,
                                        protein_g: 0,
                                        carbs_g: 0,
                                        fat_g: 0,
                                        fiber_g: null,
                                        sugar_g: null,
                                        alcohol_g: null,
                                        sodium_mg: null,
                                        saturated_fat_g: null,
                                        cholesterol_mg: null,
                                        potassium_mg: null,
                                    },
                                },
                            ],
                        }),
                    ),
            },
        );
        expect(result.has("item:1")).toBe(false);
        expect(result.has("item:9")).toBe(false);
    });

    test("empty request list spends no call", async () => {
        const result = await estimateMealPhotoNutrients([], config, {
            fetcher: async () => {
                throw new Error("must not be called");
            },
        });
        expect(result.size).toBe(0);
    });
});

describe("usableEstimateNutrients", () => {
    test("rejects nonpositive calories", () => {
        expect(
            usableEstimateNutrients({
                calories: 0,
                protein_g: 1,
                carbs_g: 1,
                fat_g: 1,
                fiber_g: null,
                sugar_g: null,
                alcohol_g: null,
                sodium_mg: null,
                saturated_fat_g: null,
                cholesterol_mg: null,
                potassium_mg: null,
            }),
        ).toBeNull();
    });
});
