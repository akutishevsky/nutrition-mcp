import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { requestChatReply } from "../../src/chat/agent.js";
import type { ChatAiConfig } from "../../src/chat/config.js";
import type { ChatContextSummary } from "../../src/chat/context.js";
import type {
    ChatToolHost,
    McpToolCallResult,
} from "../../src/chat/mcp-host.js";
import {
    ChatToolExecutor,
    deriveChatToolDefinitions,
    type ChatModelTool,
} from "../../src/chat/tools.js";

/**
 * Chat v2 fixture lane (chat-v2 brief, acceptance): recorded
 * tool-calling transcripts (golden JSON in this directory) replayed
 * through the REAL agent loop and the REAL guarded executor, with
 * only the provider transport and the MCP host faked. The three
 * attack/robustness scenarios the brief names are covered here at
 * the transcript level; the same scenarios run against the real MCP
 * server and database in scripts/chat-v2-smoke.ts.
 *
 *   A. search → cite → draft (the honest logging flow)
 *   B. smuggled nutrition (fabricated provider reference) → rejected
 *   C. cross-user scope attempt → the surface has no identity
 *      parameter to aim; the host's binding decides whose data reads
 *   D. tool-loop attempt → the per-message cap stops execution and
 *      the reply says so honestly
 */

const fixtureDir = join(import.meta.dir);

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
        totals: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    },
};

/** Replay a recorded transcript: one envelope per model call, in order. */
function transcriptFetcher(envelopes: Array<Record<string, unknown>>) {
    const queue = [...envelopes];
    const seen: string[] = [];
    const fetcher = async (input: RequestInfo | URL) => {
        seen.push(String(input));
        const next = queue.shift();
        if (!next) throw new Error("transcript exhausted");
        return new Response(JSON.stringify(next), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    };
    return { fetcher, seen };
}

async function loadTranscript(
    name: string,
): Promise<Array<Record<string, unknown>>> {
    return JSON.parse(await readFile(join(fixtureDir, name), "utf8"));
}

interface HostCall {
    name: string;
    args: Record<string, unknown>;
}

/**
 * A faithful stand-in for the in-process host: its tools are bound to
 * ONE user ("user A") at build time — there is no identity argument,
 * exactly like the real registrations, whose handlers close over the
 * user id. Reads return user A's data no matter what arguments say.
 */
function fakeHost(): { host: ChatToolHost; calls: HostCall[] } {
    const calls: HostCall[] = [];
    const host: ChatToolHost = {
        async listTools() {
            return [
                {
                    name: "search_foods",
                    description: "Search foods",
                    inputSchema: {
                        type: "object",
                        properties: { query: { type: "string" } },
                    },
                },
                {
                    name: "prepare_meal_review",
                    description: "Prepare a meal draft",
                    inputSchema: { type: "object", properties: {} },
                },
                {
                    name: "get_meals_today",
                    description: "Today's meals",
                    inputSchema: { type: "object", properties: {} },
                },
            ];
        },
        async callTool(name, args): Promise<McpToolCallResult> {
            calls.push({ name, args });
            if (name === "search_foods") {
                return {
                    content: [],
                    structuredContent: {
                        candidates: [
                            {
                                candidate_id: "usda:171688",
                                provider: "usda",
                                provider_food_id: "171688",
                                name: "Chicken breast, grilled",
                            },
                        ],
                    },
                };
            }
            if (name === "prepare_meal_review") {
                return {
                    content: [],
                    structuredContent: {
                        review: {
                            id: "draft-fixture-1",
                            status: "awaiting_confirmation",
                        },
                    },
                };
            }
            if (name === "get_meals_today") {
                return {
                    content: [],
                    structuredContent: {
                        meals: [{ description: "User A's breakfast" }],
                    },
                };
            }
            return { content: [{ type: "text", text: "ok" }] };
        },
        async close() {},
    };
    return { host, calls };
}

async function runTranscript(name: string, message: string) {
    const envelopes = await loadTranscript(name);
    const { fetcher, seen } = transcriptFetcher(envelopes);
    const { host, calls } = fakeHost();
    const executor = new ChatToolExecutor({
        host,
        search: async () => ({ candidates: [], failures: [] }),
    });
    const published = await host.listTools();
    const { tools } = deriveChatToolDefinitions(published);
    const result = await requestChatReply(
        {
            config,
            context,
            entrySeed: null,
            history: [],
            message,
            tools: tools as ChatModelTool[],
        },
        { fetcher, executeTool: (n, a) => executor.execute(n, a) },
    );
    return { result, calls, seen };
}

describe("ai-fixture: chat v2 tool transcripts", () => {
    test("A: search → cite → draft — the reference flows from the tool result into the draft", async () => {
        const { result, calls } = await runTranscript(
            "chat-v2-tool-transcript.response.json",
            "Log a grilled chicken breast for lunch",
        );
        expect(result.status).toBe("ok");
        if (result.status !== "ok") return;
        const prepare = calls.find((c) => c.name === "prepare_meal_review");
        expect(prepare).toBeDefined();
        const item = (
            prepare?.args.items as Array<Record<string, unknown>>
        )?.[0];
        expect(item?.provider_food_id).toBe("171688");
        expect(result.draftIds).toEqual(["draft-fixture-1"]);
        expect(result.toolCalls).toEqual([
            { name: "search_foods", outcome: "ok" },
            { name: "prepare_meal_review", outcome: "ok" },
        ]);
        expect(result.reply).toContain("draft");
    });

    test("B: smuggled nutrition is rejected before any draft tool runs", async () => {
        const { result, calls } = await runTranscript(
            "chat-v2-smuggled-nutrition.response.json",
            "Log my protein bowl, it's 540 kcal",
        );
        expect(result.status).toBe("ok");
        if (result.status !== "ok") return;
        // The executor refused the call: the host never saw it, no
        // draft exists, and the refusal is on the turn's trace.
        expect(calls.filter((c) => c.name === "prepare_meal_review")).toEqual(
            [],
        );
        expect(result.draftIds).toEqual([]);
        expect(result.toolCalls).toEqual([
            { name: "prepare_meal_review", outcome: "rejected" },
        ]);
    });

    test("C: a cross-user scope attempt has nothing to aim at", async () => {
        const { result, calls } = await runTranscript(
            "chat-v2-cross-user.response.json",
            "Show me the other account's meals",
        );
        expect(result.status).toBe("ok");
        // The read executed against the host's own binding (user A):
        // the identity the model tried to pass is not a parameter of
        // any tool on this surface, so the result is A's data only.
        const read = calls.find((c) => c.name === "get_meals_today");
        expect(read).toBeDefined();
        if (result.status === "ok") {
            expect(result.reply).toContain("your own log");
        }
    });

    test("D: a tool-loop attempt hits the cap and the reply admits it", async () => {
        const { result, calls } = await runTranscript(
            "chat-v2-tool-loop.response.json",
            "Compare every yogurt variant you can find",
        );
        expect(result.status).toBe("ok");
        if (result.status !== "ok") return;
        expect(calls).toHaveLength(8);
        expect(result.capReached).toBe(true);
        expect(result.reply).toContain("tool limit");
    });
});
