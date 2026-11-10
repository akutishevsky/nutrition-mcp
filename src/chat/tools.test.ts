import { describe, expect, test } from "bun:test";
import { MCP_TOOL_CAPABILITY_MAP } from "../capability-manifest.js";
import type { FoodCandidate } from "../food-providers/types.js";
import { CONDITIONAL_PREMIUM_MCP_TOOL_CAPABILITY_MAP } from "../inventory/capabilities.js";
import { MCP_INFRASTRUCTURE_TOOLS } from "../mcp-infrastructure.js";
import type { ChatToolHost, McpToolDefinition } from "./mcp-host.js";
import {
    CHAT_EXCLUDED_TOOL_NAMES,
    CHAT_TOOL_EXCLUSIONS,
    ChatToolExecutor,
    deriveChatToolDefinitions,
    harvestGroundedReferences,
} from "./tools.js";

/**
 * The full published catalog, from the same three maps the wave-6
 * inventory cross-checked against the registerTool call sites:
 * 110 + 3 conditional Pantry + 2 gateway = 115 tools.
 */
const FULL_CATALOG: string[] = [
    ...Object.keys(MCP_TOOL_CAPABILITY_MAP),
    ...Object.keys(CONDITIONAL_PREMIUM_MCP_TOOL_CAPABILITY_MAP),
    ...MCP_INFRASTRUCTURE_TOOLS,
];

function published(names: string[]): McpToolDefinition[] {
    return names.map((name) => ({
        name,
        description: `${name} description`,
        inputSchema: { type: "object", properties: {} },
    }));
}

describe("chat tool parity derivation", () => {
    test("the catalog maps name 115 distinct tools", () => {
        expect(new Set(FULL_CATALOG).size).toBe(115);
    });

    test("every exclusion names a real published tool, exactly once", () => {
        const catalog = new Set(FULL_CATALOG);
        const seen = new Set<string>();
        for (const exclusion of CHAT_TOOL_EXCLUSIONS) {
            expect(catalog.has(exclusion.name)).toBe(true);
            expect(seen.has(exclusion.name)).toBe(false);
            seen.add(exclusion.name);
            expect(exclusion.reason.length).toBeGreaterThan(10);
        }
        expect(CHAT_TOOL_EXCLUSIONS).toHaveLength(50);
    });

    test("derivation subtracts exactly the exclusions and nothing else", () => {
        const { tools, excludedPresent } = deriveChatToolDefinitions(
            published(FULL_CATALOG),
        );
        expect(excludedPresent.sort()).toEqual(
            CHAT_TOOL_EXCLUSIONS.map((entry) => entry.name).sort(),
        );
        expect(tools).toHaveLength(115 - 50);
        const derivedNames = new Set(tools.map((tool) => tool.name));
        for (const name of FULL_CATALOG) {
            expect(derivedNames.has(name)).toBe(
                !CHAT_EXCLUDED_TOOL_NAMES.has(name),
            );
        }
    });

    test("the draft-class core survives derivation", () => {
        const { tools } = deriveChatToolDefinitions(published(FULL_CATALOG));
        const names = new Set(tools.map((tool) => tool.name));
        for (const draftTool of [
            "prepare_meal_review",
            "resolve_meal_review",
            "start_meal_draft",
            "upsert_meal_draft_item",
            "create_meal_plan_draft",
            "update_meal_plan_draft",
            "preview_goal_change",
            "cancel_meal_draft",
            "get_pantry",
            "search_foods",
            "get_meals_today",
        ]) {
            expect(names.has(draftTool)).toBe(true);
        }
        // The brief's scoped grocery carve-out (decision 2).
        expect(names.has("add_grocery_items")).toBe(true);
        // And the fences hold.
        for (const fenced of [
            "log_meal",
            "confirm_meal_draft",
            "delete_account",
            "run_munch_action",
            "commit_meal_plan_draft",
        ]) {
            expect(names.has(fenced)).toBe(false);
        }
    });
});

// ---------------------------------------------------------------------------
// Executor + grounding guard, against a fake in-process host.
// ---------------------------------------------------------------------------

function candidate(overrides: Partial<FoodCandidate> = {}): FoodCandidate {
    return {
        provider: "usda",
        providerFoodId: "171688",
        name: "Chicken breast, grilled",
        dataKind: "generic",
        nutrientsPer100g: {
            calories: 165,
            protein_g: 31,
            carbs_g: 0,
            fat_g: 3.6,
        },
        portions: [
            {
                id: "100g",
                amount: 100,
                unit: "g",
                label: "100 g",
                gramWeight: 100,
                nutrients: {
                    calories: 165,
                    protein_g: 31,
                    carbs_g: 0,
                    fat_g: 3.6,
                },
            },
        ],
        attribution: {
            label: "USDA FoodData Central",
            url: "https://fdc.nal.usda.gov/food/171688",
        },
        confidence: 0.95,
        ...overrides,
    };
}

interface HostCall {
    name: string;
    args: Record<string, unknown>;
}

function fakeHost(handlers: {
    searchResult?: Record<string, unknown>;
    reviewResult?: Record<string, unknown>;
}): { host: ChatToolHost; calls: HostCall[] } {
    const calls: HostCall[] = [];
    const host: ChatToolHost = {
        async listTools() {
            return [];
        },
        async callTool(name, args) {
            calls.push({ name, args });
            if (name === "search_foods") {
                return {
                    content: [],
                    structuredContent: handlers.searchResult ?? {
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
                    structuredContent: handlers.reviewResult ?? {
                        review: {
                            id: "draft-42",
                            status: "awaiting_confirmation",
                        },
                    },
                };
            }
            return { content: [{ type: "text", text: "ok" }] };
        },
        async close() {},
    };
    return { host, calls };
}

function executorFor(host: ChatToolHost, searchFinds: boolean) {
    return new ChatToolExecutor({
        host,
        search: async () => ({
            candidates: searchFinds ? [candidate()] : [],
            failures: [],
        }),
    });
}

describe("chat tool executor fence", () => {
    test("an excluded tool is rejected before the host is touched", async () => {
        const { host, calls } = fakeHost({});
        const executor = executorFor(host, true);
        const result = await executor.execute("delete_account", {
            confirm: true,
        });
        expect(result.outcome).toBe("rejected");
        expect(result.isError).toBe(true);
        expect(calls).toEqual([]);
    });

    test("the gateway dispatcher is rejected by name as well", async () => {
        const { host, calls } = fakeHost({});
        const executor = executorFor(host, true);
        const result = await executor.execute("run_munch_action", {
            action: "get_meals_today",
            args: {},
        });
        expect(result.outcome).toBe("rejected");
        expect(calls).toEqual([]);
    });

    test("a read tool passes through and its result text is returned", async () => {
        const { host, calls } = fakeHost({});
        const executor = executorFor(host, true);
        const result = await executor.execute("search_foods", {
            query: "chicken breast",
        });
        expect(result.outcome).toBe("ok");
        expect(result.text).toContain("171688");
        expect(calls).toHaveLength(1);
    });
});

describe("chat grounding guard", () => {
    test("smuggled nutrition: a fabricated provider reference is rejected, no draft created", async () => {
        const { host, calls } = fakeHost({});
        const executor = executorFor(host, true);
        const result = await executor.execute("prepare_meal_review", {
            description: "Chicken bowl",
            items: [
                {
                    name: "Chicken breast",
                    quantity: 1,
                    portion_label: "1 breast",
                    nutrients: { calories: 999, protein_g: 99 },
                    source_type: "usda",
                    provider: "usda",
                    provider_food_id: "000000",
                },
            ],
        });
        expect(result.outcome).toBe("rejected");
        expect(result.text).toContain("did not come from a tool result");
        // The draft tool was never invoked.
        expect(calls.filter((c) => c.name === "prepare_meal_review")).toEqual(
            [],
        );
    });

    test("smuggled nutrition: model-estimate values with no source are rejected", async () => {
        const { host, calls } = fakeHost({});
        const executor = executorFor(host, true);
        const result = await executor.execute("prepare_meal_review", {
            description: "Soup",
            items: [
                {
                    name: "Soup",
                    quantity: 1,
                    portion_label: "1 bowl",
                    nutrients: { calories: 300 },
                    source_type: "model_estimate",
                },
            ],
        });
        expect(result.outcome).toBe("rejected");
        expect(calls.filter((c) => c.name === "prepare_meal_review")).toEqual(
            [],
        );
    });

    test("a reference harvested from a search result in the same turn is honored", async () => {
        const { host, calls } = fakeHost({});
        const executor = executorFor(host, true);
        await executor.execute("search_foods", { query: "chicken breast" });
        const result = await executor.execute("prepare_meal_review", {
            description: "Chicken",
            items: [
                {
                    name: "Chicken breast, grilled",
                    quantity: 1,
                    portion_label: "100 g",
                    nutrients: { calories: 165, protein_g: 31 },
                    source_type: "usda",
                    provider: "usda",
                    provider_food_id: "171688",
                },
            ],
        });
        expect(result.outcome).toBe("ok");
        expect(result.draftId).toBe("draft-42");
        expect(
            calls.filter((c) => c.name === "prepare_meal_review"),
        ).toHaveLength(1);
    });

    test("a name-only item is grounded server-side before the draft tool runs", async () => {
        const { host, calls } = fakeHost({});
        const executor = executorFor(host, true);
        const result = await executor.execute("prepare_meal_review", {
            description: "Chicken",
            items: [
                {
                    name: "Chicken breast",
                    quantity: 1,
                    portion_label: "serving",
                    nutrients: {},
                    assumptions: [],
                },
            ],
        });
        expect(result.outcome).toBe("ok");
        const prepare = calls.find((c) => c.name === "prepare_meal_review");
        const item = (
            prepare?.args.items as Array<Record<string, unknown>>
        )?.[0];
        expect(item?.source_type).toBe("usda");
        expect(item?.provider_food_id).toBe("171688");
        expect(
            (item?.nutrients as Record<string, unknown>)?.calories,
        ).toBeGreaterThan(0);
    });

    test("an item that cannot be grounded enters valueless with a blocking question", async () => {
        const { host, calls } = fakeHost({});
        const executor = executorFor(host, false);
        const result = await executor.execute("prepare_meal_review", {
            description: "Mystery stew",
            items: [
                {
                    name: "Mystery stew",
                    quantity: 1,
                    portion_label: "1 bowl",
                    nutrients: {},
                    assumptions: [],
                },
            ],
        });
        expect(result.outcome).toBe("ok");
        const prepare = calls.find((c) => c.name === "prepare_meal_review");
        const item = (
            prepare?.args.items as Array<Record<string, unknown>>
        )?.[0];
        expect(item?.nutrients).toEqual({});
        const questions = prepare?.args.questions as Array<
            Record<string, unknown>
        >;
        expect(questions?.length).toBe(1);
        expect(String(questions?.[0]?.question_key)).toMatch(
            /^photo_estimate_missing_/,
        );
    });
});

describe("grounded reference harvesting", () => {
    test("collects candidate ids and provider pairs from nested results", () => {
        const providerRefs = new Set<string>();
        const candidateIds = new Set<string>();
        harvestGroundedReferences(
            {
                candidates: [
                    {
                        candidate_id: "usda:171688",
                        provider: "usda",
                        provider_food_id: "171688",
                    },
                ],
                meal: {
                    items: [
                        {
                            provider: "open_food_facts",
                            provider_food_id: "3017620422003",
                        },
                    ],
                },
            },
            providerRefs,
            candidateIds,
        );
        expect(candidateIds.has("usda:171688")).toBe(true);
        expect(providerRefs.has("usda171688")).toBe(true);
        expect(providerRefs.has("open_food_facts3017620422003")).toBe(true);
    });
});
