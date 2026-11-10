import { describe, expect, test } from "bun:test";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MunchCapabilities } from "./billing/capabilities.js";
import { registerMealToRecipeTool } from "./meal-to-recipe.js";

const premiumPersonal = {
    tier: "premium",
    entitlementSource: "direct_subscription",
    coreNutrition: true,
    historyDays: null,
    personalRecipesRead: true,
    personalRecipesWrite: true,
    personalPlanningRead: true,
    personalPlanningWrite: true,
    householdRead: false,
    householdWrite: false,
    householdManage: false,
    household: null,
} satisfies MunchCapabilities;

describe("save_meal_as_recipe MCP contract", () => {
    test("exposes one direct semantic write with a lean idempotent schema", () => {
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

        registerMealToRecipeTool(
            server,
            "11111111-1111-4111-8111-111111111111",
            premiumPersonal,
        );

        expect([...tools.keys()]).toEqual(["save_meal_as_recipe"]);
        const tool = tools.get("save_meal_as_recipe")!;
        expect(tool.annotations).toEqual({
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false,
        });
        expect(tool.description).toContain(
            "do not search meal history or saved foods first",
        );
        expect(Object.keys(tool.inputSchema)).toEqual([
            "meal_id",
            "scope",
            "name",
            "servings",
            "description",
            "instructions",
        ]);
        expect(tool.inputSchema.meal_id.isOptional()).toBe(false);
        expect(tool.inputSchema.scope.isOptional()).toBe(true);
        expect(tool.inputSchema.servings.isOptional()).toBe(true);
        expect(tool.inputSchema).not.toHaveProperty("ingredients");
        expect(tool.inputSchema).not.toHaveProperty("idempotency_key");
    });
});
