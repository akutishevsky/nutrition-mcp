import { describe, expect, test } from "bun:test";
import type { MunchCapabilities } from "./billing/capabilities.js";
import {
    MUNCH_FEATURE_UNAVAILABLE_MESSAGE,
    requirePlanningAccess,
    requirePlanningScope,
    requireRecipeAccess,
    requireRecipeScope,
} from "./mcp-capability-guard.js";

const freeCapabilities = {
    tier: "free",
    coreNutrition: true,
    historyDays: 30,
    personalRecipesRead: false,
    personalRecipesWrite: false,
    personalPlanningRead: false,
    personalPlanningWrite: false,
    householdRead: false,
    householdWrite: false,
    householdManage: false,
    household: null,
    entitlementSource: "free",
} as MunchCapabilities;

const householdCapabilities = {
    ...freeCapabilities,
    householdRead: true,
    householdWrite: true,
    household: {
        householdId: "11111111-1111-4111-8111-111111111111",
        householdName: "Test household",
        ownerUserId: "22222222-2222-4222-8222-222222222222",
        role: "member",
        displayName: "Test member",
    },
} as MunchCapabilities;

describe("MCP capability guards", () => {
    test("uses a neutral message for unavailable feature actions", () => {
        expect(() => requireRecipeAccess(freeCapabilities)).toThrow(
            MUNCH_FEATURE_UNAVAILABLE_MESSAGE,
        );
        expect(MUNCH_FEATURE_UNAVAILABLE_MESSAGE.toLowerCase()).not.toContain(
            "subscription",
        );
        expect(MUNCH_FEATURE_UNAVAILABLE_MESSAGE.toLowerCase()).not.toContain(
            "checkout",
        );
    });

    test("checks the requested ownership scope", () => {
        expect(() =>
            requireRecipeScope("personal", householdCapabilities, false),
        ).toThrow(MUNCH_FEATURE_UNAVAILABLE_MESSAGE);
        expect(
            requireRecipeScope("household", householdCapabilities, false),
        ).toEqual({
            type: "household",
            householdId: "11111111-1111-4111-8111-111111111111",
        });
        expect(() =>
            requirePlanningScope("personal", freeCapabilities, true),
        ).toThrow(MUNCH_FEATURE_UNAVAILABLE_MESSAGE);
    });

    test("allows household reads without granting household writes", () => {
        const readOnlyHousehold = {
            ...householdCapabilities,
            householdWrite: false,
        } as MunchCapabilities;
        expect(() =>
            requirePlanningAccess(readOnlyHousehold, "household", false),
        ).not.toThrow();
        expect(() =>
            requirePlanningAccess(readOnlyHousehold, "household", true),
        ).toThrow(MUNCH_FEATURE_UNAVAILABLE_MESSAGE);
    });
});
