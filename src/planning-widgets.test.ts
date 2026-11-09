import { describe, expect, test } from "bun:test";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerRecipePlanningTools } from "./recipe-planning-tools.js";
import { registerInventoryTools } from "./inventory/tools.js";
import type { MunchCapabilities } from "./billing/capabilities.js";
import { USER_WIDGET_TEMPLATES } from "./widgets.js";

const premium = {
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

function fakeServer() {
    const tools = new Map<string, Record<string, any>>();
    const resources = new Map<string, string>();
    const server = {
        registerTool(
            name: string,
            config: Record<string, any>,
            _handler: (...args: any[]) => unknown,
        ) {
            tools.set(name, config);
            return {};
        },
        registerResource(name: string, uri: string) {
            resources.set(name, uri);
            return {};
        },
    } as unknown as McpServer;
    return { server, tools, resources };
}

describe("slice-6 planning widgets", () => {
    test("the four widgets are production user widgets", () => {
        for (const key of [
            "meal-plan",
            "grocery-list",
            "pantry",
            "day-meals",
        ]) {
            expect(USER_WIDGET_TEMPLATES).toHaveProperty(key);
        }
    });

    test("planning tools advertise their widgets only when enabled", () => {
        const enabled = fakeServer();
        registerRecipePlanningTools(
            enabled.server,
            "11111111-1111-4111-8111-111111111111",
            premium,
            true,
        );
        expect(enabled.tools.get("get_meal_plan")?._meta?.ui?.resourceUri).toBe(
            "ui://widget/meal-plan.html",
        );
        expect(
            enabled.tools.get("get_grocery_list")?._meta?.ui?.resourceUri,
        ).toBe("ui://widget/grocery-list.html");
        expect(enabled.resources.get("meal-plan-widget")).toBe(
            "ui://widget/meal-plan.html",
        );
        expect(enabled.resources.get("grocery-list-widget")).toBe(
            "ui://widget/grocery-list.html",
        );
        // Bindings are UI meta only: annotations stay exactly as declared.
        expect(
            enabled.tools.get("get_meal_plan")?.annotations?.readOnlyHint,
        ).toBe(true);
        expect(
            enabled.tools.get("get_grocery_list")?.annotations?.readOnlyHint,
        ).toBe(true);

        const disabled = fakeServer();
        registerRecipePlanningTools(
            disabled.server,
            "11111111-1111-4111-8111-111111111111",
            premium,
            false,
        );
        expect(disabled.tools.get("get_meal_plan")?._meta?.ui).toBeUndefined();
        expect(
            disabled.tools.get("get_grocery_list")?._meta?.ui,
        ).toBeUndefined();
    });

    test("pantry tools advertise the pantry widget only when enabled", () => {
        const enabled = fakeServer();
        registerInventoryTools(
            enabled.server,
            "11111111-1111-4111-8111-111111111111",
            premium,
            true,
        );
        for (const name of [
            "get_pantry",
            "reconcile_pantry",
            "reconcile_purchase",
        ]) {
            expect(enabled.tools.get(name)?._meta?.ui?.resourceUri).toBe(
                "ui://widget/pantry.html",
            );
        }
        expect(enabled.resources.get("pantry-widget")).toBe(
            "ui://widget/pantry.html",
        );
        expect(
            enabled.tools.get("reconcile_pantry")?.annotations?.destructiveHint,
        ).toBe(true);

        const disabled = fakeServer();
        registerInventoryTools(
            disabled.server,
            "11111111-1111-4111-8111-111111111111",
            premium,
            false,
        );
        for (const name of [
            "get_pantry",
            "reconcile_pantry",
            "reconcile_purchase",
        ]) {
            expect(disabled.tools.get(name)?._meta?.ui).toBeUndefined();
        }
    });

    test("day-meals tools are bound in mcp.ts via UI meta only", async () => {
        const source = await Bun.file("src/mcp.ts").text();
        expect(source).toContain(
            'const DAY_MEALS_WIDGET_URI = "ui://widget/day-meals.html"',
        );
        expect(
            source.match(/\.\.\.uiMeta\(DAY_MEALS_WIDGET_URI\)/g)?.length,
        ).toBe(4);
        expect(source).toContain('getWidgetHtml("day-meals")');
        for (const name of [
            "get_meals_today",
            "get_meals_by_date",
            "get_meals_by_date_range",
            "search_meals",
        ]) {
            expect(source).toContain(`"${name}"`);
        }
    });
});
