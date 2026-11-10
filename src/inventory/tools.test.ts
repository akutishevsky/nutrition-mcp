import { describe, expect, test } from "bun:test";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MunchCapabilities } from "../billing/capabilities.js";
import { registerInventoryTools } from "./tools.js";

function captureTools(capabilities: MunchCapabilities) {
    const tools = new Map<string, Record<string, any>>();
    const server = {
        registerTool(
            name: string,
            config: Record<string, any>,
            _handler: (...args: any[]) => unknown,
        ) {
            tools.set(name, config);
            return {};
        },
    } as unknown as McpServer;
    registerInventoryTools(
        server,
        "11111111-1111-4111-8111-111111111111",
        capabilities,
    );
    return tools;
}

const premium = {
    tier: "premium",
    entitlementSource: "direct_subscription",
    coreNutrition: true,
    personalRecipesRead: true,
    personalRecipesWrite: true,
    personalPlanningRead: true,
    personalPlanningWrite: true,
    householdRead: false,
    householdWrite: false,
    householdManage: false,
    household: null,
    historyDays: null,
} as unknown as MunchCapabilities;

describe("premium Pantry MCP surface", () => {
    test("contains exactly the three intentional Pantry operations", () => {
        const tools = captureTools(premium);
        expect([...tools.keys()]).toEqual([
            "get_pantry",
            "reconcile_pantry",
            "reconcile_purchase",
        ]);
    });

    test("keeps read and mutation autonomy boundaries explicit", () => {
        const tools = captureTools(premium);
        expect(tools.get("get_pantry")?.annotations).toMatchObject({
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        });
        expect(tools.get("reconcile_pantry")?.annotations).toMatchObject({
            readOnlyHint: false,
            destructiveHint: true,
            idempotentHint: true,
            openWorldHint: false,
        });
        expect(tools.get("reconcile_purchase")?.annotations).toMatchObject({
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        });
        expect(tools.get("reconcile_pantry")?.description).toContain(
            "Never infer meal consumption and silently subtract it",
        );
    });

    test("bounds candidate queries and batch mutation shapes", () => {
        const tools = captureTools(premium);
        const pantrySchema = tools.get("get_pantry")?.inputSchema;
        const reconcileSchema = tools.get("reconcile_pantry")?.inputSchema;
        const purchaseSchema = tools.get("reconcile_purchase")?.inputSchema;
        expect(pantrySchema?.candidate_names).toBeDefined();
        expect(pantrySchema?.detail_level).toBeDefined();
        expect(tools.has("recommend_meal_from_pantry")).toBe(false);
        expect(reconcileSchema?.idempotency_key).toBeDefined();
        expect(reconcileSchema?.operations).toBeDefined();
        expect(purchaseSchema?.idempotency_key).toBeDefined();
        expect(purchaseSchema?.lines).toBeDefined();
    });
});
