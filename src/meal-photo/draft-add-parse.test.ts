import { describe, expect, test } from "bun:test";
import {
    draftAddParseJsonSchema,
    parseDraftAddTextWithModel,
    parsedItemsFromModelParse,
} from "./draft-add-parse.js";
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

const butterReply = JSON.stringify({
    items: [
        {
            name: "butter",
            quantity: 1,
            unit: "tbsp",
            assumptions: ['"a decent knob" interpreted as 1 tbsp'],
        },
    ],
    replaces: null,
    preparation: null,
});

describe("parseDraftAddTextWithModel", () => {
    test("one call: temp 0, strict schema with NO nutrient fields, healing plugin", async () => {
        let calls = 0;
        let body: Record<string, any> = {};
        const result = await parseDraftAddTextWithModel(
            "oh I totally forgot the butter, like a decent knob of it",
            config,
            {
                fetcher: async (_url, init) => {
                    calls += 1;
                    body = JSON.parse(String(init?.body ?? "{}"));
                    return envelope(butterReply);
                },
            },
        );
        expect(calls).toBe(1);
        expect(result.items).toHaveLength(1);
        expect(result.items[0]).toMatchObject({
            name: "butter",
            quantity: 1,
            unit: "tbsp",
            strongSignal: true,
        });
        expect(body.temperature).toBe(0);
        expect(body.response_format?.json_schema?.strict).toBe(true);
        expect(body.response_format?.json_schema?.name).toBe(
            "munch_meal_photo_draft_add_parse",
        );
        expect(body.plugins).toEqual([{ id: "response-healing" }]);
        expect(body.provider).toEqual({ data_collection: "deny" });
        const schemaText = JSON.stringify(draftAddParseJsonSchema);
        expect(schemaText).not.toContain("calories");
        expect(schemaText).not.toContain("protein");
    });

    test("an empty items array is a valid honest answer (no food stated)", async () => {
        const result = await parseDraftAddTextWithModel(
            "the weather is nice today",
            config,
            {
                fetcher: async () =>
                    envelope(
                        JSON.stringify({
                            items: [],
                            replaces: null,
                            preparation: null,
                        }),
                    ),
            },
        );
        expect(result.items).toEqual([]);
        expect(result.replaces).toBeNull();
    });

    test("a response carrying nutrition fields fails the strict schema and is retried once, then throws", async () => {
        let calls = 0;
        await expect(
            parseDraftAddTextWithModel("2 eggs and stuff", config, {
                fetcher: async () => {
                    calls += 1;
                    return envelope(
                        JSON.stringify({
                            items: [
                                {
                                    name: "egg",
                                    quantity: 2,
                                    unit: "piece",
                                    assumptions: [],
                                    calories: 140,
                                },
                            ],
                            replaces: null,
                            preparation: null,
                        }),
                    );
                },
            }),
        ).rejects.toThrow();
        expect(calls).toBe(2);
    });

    test("retries once on unparseable output, then succeeds; HTTP failures are not retried", async () => {
        let calls = 0;
        const result = await parseDraftAddTextWithModel("butter note", config, {
            fetcher: async () => {
                calls += 1;
                return envelope(calls === 1 ? "not json" : butterReply);
            },
        });
        expect(calls).toBe(2);
        expect(result.items[0]?.name).toBe("butter");

        let httpCalls = 0;
        await expect(
            parseDraftAddTextWithModel("butter note", config, {
                fetcher: async () => {
                    httpCalls += 1;
                    return new Response("nope", { status: 503 });
                },
            }),
        ).rejects.toThrow("HTTP 503");
        expect(httpCalls).toBe(1);
    });
});

describe("parseDraftAddTextWithModel — preparation statements (photo-flow P2)", () => {
    test("'i deep fried it' returns a preparation correction plus the implied oil as an item; draft items ride along as context", async () => {
        let body: Record<string, any> = {};
        const result = await parseDraftAddTextWithModel(
            "i deep fried it",
            config,
            {
                fetcher: async (_url, init) => {
                    body = JSON.parse(String(init?.body ?? "{}"));
                    return envelope(
                        JSON.stringify({
                            items: [
                                {
                                    name: "vegetable oil",
                                    quantity: 1,
                                    unit: "tbsp",
                                    assumptions: [
                                        "Oil absorbed in deep frying, assumed 1 tbsp",
                                    ],
                                },
                            ],
                            replaces: null,
                            preparation: {
                                target_item: "Corn On The Cob",
                                cooking_method: "deep fried",
                            },
                        }),
                    );
                },
            },
            {
                items: [{ name: "Corn On The Cob", cookingMethod: "steamed" }],
            },
        );
        expect(result.preparation).toEqual({
            targetItem: "Corn On The Cob",
            cookingMethod: "deep fried",
        });
        expect(result.items[0]).toMatchObject({
            name: "vegetable oil",
            quantity: 1,
            unit: "tbsp",
            strongSignal: true,
        });
        // The draft context is in the request so the model can name
        // its target; the schema carries the preparation key.
        expect(JSON.stringify(body.messages)).toContain("Corn On The Cob");
        expect(JSON.stringify(draftAddParseJsonSchema)).toContain(
            "preparation",
        );
    });

    test("a pure method correction returns preparation with empty items", async () => {
        const result = await parseDraftAddTextWithModel(
            "grilled instead",
            config,
            {
                fetcher: async () =>
                    envelope(
                        JSON.stringify({
                            items: [],
                            replaces: null,
                            preparation: {
                                target_item: null,
                                cooking_method: "grilled",
                            },
                        }),
                    ),
            },
            {
                items: [{ name: "Chicken breast", cookingMethod: "baked" }],
            },
        );
        expect(result.items).toEqual([]);
        expect(result.preparation).toEqual({
            targetItem: null,
            cookingMethod: "grilled",
        });
    });
});

describe("parsedItemsFromModelParse", () => {
    test("quantity-less model items get the stated default-portion assumption", () => {
        const result = parsedItemsFromModelParse({
            items: [
                { name: "butter", quantity: null, unit: null, assumptions: [] },
            ],
            replaces: null,
            preparation: null,
        });
        expect(result.items[0]).toMatchObject({
            name: "butter",
            quantity: 1,
            unit: "tbsp",
            quantityAssumed: true,
            strongSignal: false,
        });
        expect(result.items[0]?.assumptions[0]).toContain("default portion");
    });

    test("the replaces name passes through trimmed", () => {
        const result = parsedItemsFromModelParse({
            items: [
                {
                    name: "brown rice",
                    quantity: 1,
                    unit: "cup",
                    assumptions: [],
                },
            ],
            replaces: " white rice ",
            preparation: null,
        });
        expect(result.replaces).toBe("white rice");
    });
});
