import { describe, expect, test } from "bun:test";
import { requestChatReply } from "./agent.js";
import type { ChatAiConfig } from "./config.js";
import type { ChatContextSummary } from "./context.js";

const config: ChatAiConfig = {
    apiKey: "fixture-key",
    model: "meta/muse-ember",
    baseUrl: "https://openrouter.invalid/v1",
    timeoutMs: 1_000,
    maxTokens: 2_500,
};

const context: ChatContextSummary = {
    date: "2026-11-10",
    timezone: "America/New_York",
    sections: ["today"],
    goals: null,
    today: {
        totals: {
            calories: 500,
            proteinG: 30,
            carbsG: 50,
            fatG: 15,
            fiberG: 4,
        },
        meals: [],
    },
    pantry: null,
    recent: null,
};

function envelope(content: string, status = 200): Response {
    return new Response(
        JSON.stringify({
            id: "fixture-chat",
            model: "meta/muse-ember",
            choices: [{ message: { role: "assistant", content } }],
        }),
        { status, headers: { "content-type": "application/json" } },
    );
}

describe("S8 chat agent call", () => {
    test("parses a plain reply with no proposal", async () => {
        const result = await requestChatReply(
            { config, context, history: [], message: "How is today looking?" },
            {
                fetcher: async () =>
                    envelope(
                        JSON.stringify({
                            reply: "You are at 500 kcal so far today.",
                            proposed_log: null,
                        }),
                    ),
            },
        );
        expect(result.status).toBe("ok");
        if (result.status === "ok") {
            expect(result.response.reply).toContain("500 kcal");
            expect(result.response.proposed_log).toBeNull();
            expect(result.model).toBe("meta/muse-ember");
        }
    });

    test("parses a proposed log with items and NO nutrition fields", async () => {
        const result = await requestChatReply(
            { config, context, history: [], message: "Log a chicken sandwich" },
            {
                fetcher: async () =>
                    envelope(
                        JSON.stringify({
                            reply: "I will set that up as a draft for you to confirm.",
                            proposed_log: {
                                description: "Chicken sandwich",
                                meal_type: "lunch",
                                items: [
                                    {
                                        name: "Chicken sandwich",
                                        quantity: 1,
                                        unit: "sandwich",
                                        assumptions: ["Grilled chicken"],
                                    },
                                ],
                            },
                        }),
                    ),
            },
        );
        expect(result.status).toBe("ok");
        if (result.status === "ok") {
            expect(result.response.proposed_log?.items).toHaveLength(1);
            expect(JSON.stringify(result.response.proposed_log)).not.toContain(
                "calories",
            );
        }
    });

    test("a response smuggling nutrition into a proposal is rejected by the strict schema", async () => {
        const bad = JSON.stringify({
            reply: "Here you go.",
            proposed_log: {
                description: "Soup",
                meal_type: null,
                items: [
                    {
                        name: "Soup",
                        quantity: 1,
                        unit: "bowl",
                        assumptions: [],
                        calories: 300,
                    },
                ],
            },
        });
        const result = await requestChatReply(
            { config, context, history: [], message: "Log soup" },
            { fetcher: async () => envelope(bad) },
        );
        expect(result.status).toBe("unavailable");
        if (result.status === "unavailable") {
            expect(result.code).toBe("chat_ai_unusable_response");
        }
    });

    test("provider failure returns a typed failure, never fabricated text", async () => {
        const result = await requestChatReply(
            { config, context, history: [], message: "Hi" },
            { fetcher: async () => envelope("nope", 502) },
        );
        expect(result.status).toBe("unavailable");
        if (result.status === "unavailable") {
            expect(result.code).toBe("chat_ai_failed");
        }
    });

    test("the request goes to OpenRouter with the Ember slug and healing plugin", async () => {
        let seenUrl = "";
        let seenBody: Record<string, unknown> = {};
        await requestChatReply(
            { config, context, history: [], message: "Hi" },
            {
                fetcher: async (input, init) => {
                    seenUrl = String(input);
                    seenBody = JSON.parse(String(init?.body));
                    return envelope(
                        JSON.stringify({ reply: "Hello.", proposed_log: null }),
                    );
                },
            },
        );
        expect(seenUrl).toBe("https://openrouter.invalid/v1/chat/completions");
        expect(seenBody.model).toBe("meta/muse-ember");
        expect(seenBody.plugins).toEqual([{ id: "response-healing" }]);
        expect(seenBody.provider).toEqual({ data_collection: "deny" });
    });
});
