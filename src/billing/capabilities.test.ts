import { describe, expect, test } from "bun:test";
import {
    capabilitiesFromSubscription,
    FREE_HISTORY_DAYS,
    FREE_SAVED_FOOD_LIMIT,
} from "./capabilities.js";

const now = new Date("2026-08-04T17:00:00.000Z");

describe("Munch capability resolution", () => {
    test("gives permanent core access without a subscription", () => {
        const result = capabilitiesFromSubscription({ status: null }, now);
        expect(result.tier).toBe("free");
        expect(result.coreNutrition).toBe(true);
        expect(result.historyDays).toBe(FREE_HISTORY_DAYS);
        expect(result.savedFoodLimit).toBe(FREE_SAVED_FOOD_LIMIT);
        expect(result.personalRecipesWrite).toBe(false);
        expect(result.householdWrite).toBe(false);
    });

    test("gives direct premium capabilities to active and trialing users", () => {
        for (const status of ["active", "trialing"] as const) {
            const result = capabilitiesFromSubscription({ status }, now);
            expect(result.tier).toBe("premium");
            expect(result.historyDays).toBeNull();
            expect(result.savedFoodLimit).toBeNull();
            expect(result.personalRecipesWrite).toBe(true);
            expect(result.personalPlanningWrite).toBe(true);
        }
    });

    test("honors only an unexpired past-due grace period", () => {
        expect(
            capabilitiesFromSubscription(
                {
                    status: "past_due",
                    graceExpiresAt: new Date("2026-08-05T00:00:00.000Z"),
                },
                now,
            ).tier,
        ).toBe("premium");
        expect(
            capabilitiesFromSubscription(
                {
                    status: "past_due",
                    graceExpiresAt: new Date("2026-08-03T00:00:00.000Z"),
                },
                now,
            ).tier,
        ).toBe("free");
    });

    test("never removes core access for ended Stripe states", () => {
        for (const status of [
            "incomplete",
            "incomplete_expired",
            "past_due",
            "canceled",
            "unpaid",
            "paused",
        ] as const) {
            const result = capabilitiesFromSubscription({ status }, now);
            expect(result.coreNutrition).toBe(true);
            expect(result.tier).toBe("free");
        }
    });
});
