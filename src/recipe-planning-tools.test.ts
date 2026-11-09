import { describe, expect, test } from "bun:test";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerRecipePlanningTools } from "./recipe-planning-tools.js";
import type { MunchCapabilities } from "./billing/capabilities.js";

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
        registerResource() {
            return {};
        },
    } as unknown as McpServer;
    registerRecipePlanningTools(
        server,
        "11111111-1111-4111-8111-111111111111",
        capabilities,
    );
    return tools;
}

const premiumPersonal = {
    tier: "premium",
    entitlementSource: "subscription",
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
    savedFoodLimit: null,
} as unknown as MunchCapabilities;

describe("recipe MCP surface", () => {
    test("exposes the complete lifecycle for a recipe-capable account", () => {
        const tools = captureTools(premiumPersonal);
        expect([...tools.keys()]).toEqual(
            expect.arrayContaining([
                "search_recipes",
                "get_recipe",
                "save_recipe",
                "update_recipe",
                "delete_recipe",
                "log_recipe",
                "schedule_recipe",
            ]),
        );
        expect(tools.get("delete_recipe")?.annotations.destructiveHint).toBe(
            true,
        );
        expect(tools.get("log_recipe")?.annotations.idempotentHint).toBe(true);
    });

    test("normalizes blank optional recipe queries instead of forcing a retry", () => {
        const tools = captureTools(premiumPersonal);
        const querySchema = tools.get("search_recipes")?.inputSchema.query;
        expect(querySchema.parse("")).toBeUndefined();
        expect(querySchema.parse("   ")).toBeUndefined();
        expect(querySchema.parse("  pasta  ")).toBe("pasta");
    });

    test("keeps the catalog when an account lacks recipe read access", () => {
        const tools = captureTools({
            ...premiumPersonal,
            personalRecipesRead: false,
            personalRecipesWrite: false,
        });
        expect([...tools.keys()]).toEqual(
            expect.arrayContaining([
                "search_recipes",
                "get_recipe",
                "save_recipe",
                "update_recipe",
                "delete_recipe",
                "log_recipe",
                "schedule_recipe",
                "get_meal_plan",
                "get_grocery_list",
                "add_grocery_items",
                "mark_grocery_item_purchased",
                "save_recipe_and_plan",
            ]),
        );
    });

    test("keeps the complete catalog for a free account and defers access checks", () => {
        const tools = captureTools({
            ...premiumPersonal,
            tier: "free",
            personalRecipesRead: false,
            personalRecipesWrite: false,
            personalPlanningRead: false,
            personalPlanningWrite: false,
            householdRead: false,
            householdWrite: false,
            household: null,
        });
        expect(tools.size).toBe(12);
    });
});
