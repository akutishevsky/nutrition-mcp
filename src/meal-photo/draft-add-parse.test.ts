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
                    envelope(JSON.stringify({ items: [], replaces: null })),
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

describe("parsedItemsFromModelParse", () => {
    test("quantity-less model items get the stated default-portion assumption", () => {
        const result = parsedItemsFromModelParse({
            items: [
                { name: "butter", quantity: null, unit: null, assumptions: [] },
            ],
            replaces: null,
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
        });
        expect(result.replaces).toBe("white rice");
    });
});
