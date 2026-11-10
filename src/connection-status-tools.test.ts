import { describe, expect, test } from "bun:test";
import type { MunchCapabilities } from "./billing/capabilities.js";
import { buildConnectionStatus } from "./connection-status-tools.js";

const premiumCapabilities = {
    tier: "premium",
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
    entitlementSource: "direct_subscription",
} as MunchCapabilities;

describe("MCP connection status", () => {
    test("identifies the connected Munch account without exposing internals", () => {
        const status = buildConnectionStatus({
            accountEmail: "person@example.com",
            capabilities: premiumCapabilities,
            capabilityResolution: "resolved",
        });
        expect(status).toEqual({
            connected: true,
            account_email: "person@example.com",
            capability_resolution: "available",
            features: {
                saved_foods: true,
                recipes: true,
                recipe_changes: true,
                recipe_logging: true,
                meal_planning: true,
                meal_planning_changes: true,
                grocery_lists: true,
                grocery_list_changes: true,
            },
        });
        expect(status).not.toHaveProperty("user_id");
        expect(status).not.toHaveProperty("entitlement_source");
    });

    test("reports a capability lookup outage separately from account access", () => {
        const status = buildConnectionStatus({
            accountEmail: null,
            capabilities: {
                ...premiumCapabilities,
                personalRecipesRead: false,
                personalRecipesWrite: false,
                personalPlanningRead: false,
                personalPlanningWrite: false,
            },
            capabilityResolution: "unavailable",
        });
        expect(status.connected).toBe(true);
        expect(status.capability_resolution).toBe("temporarily_unavailable");
        expect(status.account_email).toBeNull();
        expect(status.features.recipes).toBe(false);
    });
});
