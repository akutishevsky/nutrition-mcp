import { describe, expect, test } from "bun:test";
import { decideEntitlement } from "./entitlements.js";

describe("subscription entitlement policy", () => {
    const now = new Date("2026-08-03T17:00:00Z");

    test("allows active and trialing subscriptions", () => {
        expect(
            decideEntitlement({ status: "active" }, now).canWriteNutritionData,
        ).toBe(true);
        expect(
            decideEntitlement({ status: "trialing" }, now).canUseProtectedTools,
        ).toBe(true);
    });

    test("allows a past-due subscription only during its grace period", () => {
        const activeGrace = decideEntitlement(
            {
                status: "past_due",
                graceExpiresAt: new Date("2026-08-04T17:00:00Z"),
            },
            now,
        );
        const expiredGrace = decideEntitlement(
            {
                status: "past_due",
                graceExpiresAt: new Date("2026-08-02T17:00:00Z"),
            },
            now,
        );

        expect(activeGrace.reason).toBe("past_due_grace");
        expect(activeGrace.canWriteNutritionData).toBe(true);
        expect(expiredGrace.reason).toBe("payment_required");
        expect(expiredGrace.canWriteNutritionData).toBe(false);
    });

    test("retains export and deletion after commercial access ends", () => {
        const decision = decideEntitlement({ status: "canceled" }, now);

        expect(decision.canUseProtectedTools).toBe(false);
        expect(decision.canReadNutritionData).toBe(false);
        expect(decision.canExportData).toBe(true);
        expect(decision.canDeleteAccount).toBe(true);
    });

    test("denies protected access for non-entitled Stripe states", () => {
        for (const status of [
            "incomplete",
            "incomplete_expired",
            "paused",
            "canceled",
            "unpaid",
        ] as const) {
            const decision = decideEntitlement({ status }, now);
            expect(decision.allowMcp).toBe(false);
            expect(decision.canUseProtectedTools).toBe(false);
            expect(decision.canWriteNutritionData).toBe(false);
        }
    });
});
