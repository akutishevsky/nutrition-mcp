import { describe, expect, test } from "bun:test";
import { MAX_TOOL_CALLS_PER_MESSAGE, requestChatReply } from "./agent.js";
import type { ChatAiConfig } from "./config.js";
import type { ChatContextSummary } from "./context.js";
import type { ChatToolExecution, ChatModelTool } from "./tools.js";

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
    sections: ["goals", "today_totals"],
    goals: null,
    today: {
        totals: {
            calories: 500,
            proteinG: 30,
            carbsG: 50,
            fatG: 15,
            fiberG: 4,
        },
    },
};

const tools: ChatModelTool[] = [
    {
        name: "search_foods",
        description: "Search foods",
        inputSchema: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"],
        },
    },
    {
        name: "prepare_meal_review",
        description: "Prepare a meal draft",
        inputSchema: { type: "object", properties: {} },
    },
];

function envelope(message: Record<string, unknown>, status = 200): Response {
    return new Response(
        JSON.stringify({
            id: "fixture-chat",
            model: "meta/muse-ember",
            choices: [{ message: { role: "assistant", ...message } }],
        }),
        { status, headers: { "content-type": "application/json" } },
    );
}

function textEnvelope(text: string, status = 200): Response {
    return envelope({ content: text }, status);
}

function toolCallEnvelope(
    calls: Array<{ id: string; name: string; arguments: string }>,
): Response {
    return envelope({
        content: null,
        tool_calls: calls.map((call) => ({
            id: call.id,
            type: "function",
            function: { name: call.name, arguments: call.arguments },
        })),
    });
}

interface RecordedRequest {
    url: string;
    body: Record<string, unknown>;
}

function scriptedFetcher(steps: Response[]) {
    const requests: RecordedRequest[] = [];
    const queue = [...steps];
    const fetcher = async (
        input: RequestInfo | URL,
        init?: RequestInit,
    ): Promise<Response> => {
        requests.push({
            url: String(input),
            body: JSON.parse(String(init?.body)),
        });
        const next = queue.shift();
        if (!next) throw new Error("scripted fetcher exhausted");
        return next;
    };
    return { fetcher, requests };
}

function recordingExecutor(
    handler?: (
        name: string,
        args: Record<string, unknown>,
    ) => ChatToolExecution,
) {
    const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
    const executeTool = async (
        name: string,
        args: Record<string, unknown>,
    ): Promise<ChatToolExecution> => {
        calls.push({ name, args });
        return (
            handler?.(name, args) ?? {
                text: `{"ok":true,"tool":"${name}"}`,
                isError: false,
                outcome: "ok" as const,
            }
        );
    };
    return { executeTool, calls };
}

const baseInput = {
    config,
    context,
    entrySeed: null,
    history: [],
    message: "How is today looking?",
    tools,
};

describe("chat v2 agent loop", () => {
    test("a plain reply with no tool calls returns directly", async () => {
        const { fetcher } = scriptedFetcher([
            textEnvelope("You are at 500 kcal so far today."),
        ]);
        const { executeTool, calls } = recordingExecutor();
        const result = await requestChatReply(baseInput, {
            fetcher,
            executeTool,
        });
        expect(result.status).toBe("ok");
        if (result.status === "ok") {
            expect(result.reply).toContain("500 kcal");
            expect(result.toolCalls).toEqual([]);
            expect(result.draftIds).toEqual([]);
            expect(result.capReached).toBe(false);
        }
        expect(calls).toEqual([]);
    });

    test("a tool round-trip feeds the result back and collects draft ids", async () => {
        const { fetcher, requests } = scriptedFetcher([
            toolCallEnvelope([
                {
                    id: "call-1",
                    name: "search_foods",
                    arguments: JSON.stringify({ query: "greek yogurt" }),
                },
            ]),
            toolCallEnvelope([
                {
                    id: "call-2",
                    name: "prepare_meal_review",
                    arguments: JSON.stringify({ items: [] }),
                },
            ]),
            textEnvelope("I prepared that as a draft for you to confirm."),
        ]);
        const { executeTool, calls } = recordingExecutor((name) =>
            name === "prepare_meal_review"
                ? {
                      text: '{"review":{"id":"draft-1"}}',
                      isError: false,
                      outcome: "ok" as const,
                      draftId: "draft-1",
                  }
                : {
                      text: '{"candidates":[]}',
                      isError: false,
                      outcome: "ok" as const,
                  },
        );
        const result = await requestChatReply(
            { ...baseInput, message: "Log greek yogurt" },
            { fetcher, executeTool },
        );
        expect(result.status).toBe("ok");
        expect(calls.map((call) => call.name)).toEqual([
            "search_foods",
            "prepare_meal_review",
        ]);
        expect(calls[0]?.args).toEqual({ query: "greek yogurt" });
        if (result.status === "ok") {
            expect(result.draftIds).toEqual(["draft-1"]);
            expect(result.toolCalls).toEqual([
                { name: "search_foods", outcome: "ok" },
                { name: "prepare_meal_review", outcome: "ok" },
            ]);
        }
        // The second model request must carry the tool result.
        const secondMessages = JSON.stringify(requests[1]?.body.messages);
        expect(secondMessages).toContain('"role":"tool"');
        expect(secondMessages).toContain("candidates");
    });

    test("the tool cap stops execution at 8 and forces an honest final reply", async () => {
        let counter = 0;
        const loopStep = () =>
            toolCallEnvelope([
                {
                    id: `call-${counter++}`,
                    name: "search_foods",
                    arguments: JSON.stringify({ query: "x" }),
                },
            ]);
        // 9 tool-call steps: the first 8 execute, the 9th is refused
        // by the cap, then the tool-less final call answers.
        const { fetcher, requests } = scriptedFetcher([
            ...Array.from({ length: 9 }, loopStep),
            textEnvelope(
                "I hit the tool limit, so I could not finish checking everything.",
            ),
        ]);
        const { executeTool, calls } = recordingExecutor();
        const result = await requestChatReply(baseInput, {
            fetcher,
            executeTool,
        });
        expect(result.status).toBe("ok");
        expect(calls.length).toBe(MAX_TOOL_CALLS_PER_MESSAGE);
        if (result.status === "ok") {
            expect(result.capReached).toBe(true);
            expect(result.reply).toContain("tool limit");
        }
        // The final (cap) request must not offer tools.
        const last = requests[requests.length - 1];
        expect(last?.body.tools).toBeUndefined();
    });

    test("bad tool-call arguments become a tool error, not a crash", async () => {
        const { fetcher, requests } = scriptedFetcher([
            toolCallEnvelope([
                {
                    id: "call-1",
                    name: "search_foods",
                    arguments: "{not json",
                },
            ]),
            textEnvelope("That search did not run; let me answer plainly."),
        ]);
        const { executeTool, calls } = recordingExecutor();
        const result = await requestChatReply(baseInput, {
            fetcher,
            executeTool,
        });
        expect(result.status).toBe("ok");
        expect(calls).toEqual([]);
        const secondMessages = JSON.stringify(requests[1]?.body.messages);
        expect(secondMessages).toContain("not valid JSON");
    });

    test("provider failure returns a typed failure, never fabricated text", async () => {
        const { fetcher } = scriptedFetcher([textEnvelope("nope", 502)]);
        const { executeTool } = recordingExecutor();
        const result = await requestChatReply(baseInput, {
            fetcher,
            executeTool,
        });
        expect(result.status).toBe("unavailable");
        if (result.status === "unavailable") {
            expect(result.code).toBe("chat_ai_failed");
        }
    });

    test("an empty reply with no tool calls is unusable", async () => {
        const { fetcher } = scriptedFetcher([textEnvelope("")]);
        const { executeTool } = recordingExecutor();
        const result = await requestChatReply(baseInput, {
            fetcher,
            executeTool,
        });
        expect(result.status).toBe("unavailable");
        if (result.status === "unavailable") {
            expect(result.code).toBe("chat_ai_unusable_response");
        }
    });

    test("the request goes to OpenRouter with the Ember slug, healing plugin, and derived tools", async () => {
        const { fetcher, requests } = scriptedFetcher([textEnvelope("Hello.")]);
        const { executeTool } = recordingExecutor();
        await requestChatReply(baseInput, { fetcher, executeTool });
        const request = requests[0];
        expect(request?.url).toBe(
            "https://openrouter.invalid/v1/chat/completions",
        );
        expect(request?.body.model).toBe("meta/muse-ember");
        expect(request?.body.plugins).toEqual([{ id: "response-healing" }]);
        expect(request?.body.provider).toEqual({ data_collection: "deny" });
        const sentTools = request?.body.tools as Array<{
            function: { name: string };
        }>;
        expect(sentTools.map((tool) => tool.function.name)).toEqual([
            "search_foods",
            "prepare_meal_review",
        ]);
        // No JSON response-format lock in v2: the loop needs native
        // tool calling and a plain-text final reply.
        expect(request?.body.response_format).toBeUndefined();
    });
});
