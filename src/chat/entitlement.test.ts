import { describe, expect, test } from "bun:test";
import {
    chatEntitlementFromSnapshot,
    resolveChatEntitlement,
} from "./entitlement.js";
import type { DirectSubscriptionSnapshot } from "../billing/subscription-sources.js";

const NOW = new Date("2026-11-10T12:00:00Z");

function snapshot(
    partial: Partial<DirectSubscriptionSnapshot>,
): DirectSubscriptionSnapshot {
    return { provider: null, status: null, ...partial };
}

describe("S8 chat entitlement — per-rail gate behaviour", () => {
    test("Stripe active counts as Premium", () => {
        const result = chatEntitlementFromSnapshot(
            snapshot({ provider: "stripe", status: "active" }),
            false,
            NOW,
        );
        expect(result.allowed).toBe(true);
        expect(result.provider).toBe("stripe");
        expect(result.source).toBe("direct_subscription");
    });

    test("Stripe trialing counts as Premium", () => {
        expect(
            chatEntitlementFromSnapshot(
                snapshot({ provider: "stripe", status: "trialing" }),
                false,
                NOW,
            ).allowed,
        ).toBe(true);
    });

    test("Google Play active counts as Premium (packaged rail)", () => {
        const result = chatEntitlementFromSnapshot(
            snapshot({ provider: "google_play", status: "active" }),
            false,
            NOW,
        );
        expect(result.allowed).toBe(true);
        expect(result.provider).toBe("google_play");
    });

    test("App Store trialing counts as Premium (iOS rail)", () => {
        const result = chatEntitlementFromSnapshot(
            snapshot({ provider: "apple_app_store", status: "trialing" }),
            false,
            NOW,
        );
        expect(result.allowed).toBe(true);
        expect(result.provider).toBe("apple_app_store");
    });

    test("past_due inside the grace window counts; past grace does not", () => {
        const inGrace = chatEntitlementFromSnapshot(
            snapshot({
                provider: "google_play",
                status: "past_due",
                graceExpiresAt: new Date("2026-11-12T00:00:00Z"),
            }),
            false,
            NOW,
        );
        expect(inGrace.allowed).toBe(true);
        const pastGrace = chatEntitlementFromSnapshot(
            snapshot({
                provider: "stripe",
                status: "past_due",
                graceExpiresAt: new Date("2026-11-09T00:00:00Z"),
            }),
            false,
            NOW,
        );
        expect(pastGrace.allowed).toBe(false);
    });

    test("no subscription on any rail is Free and refused", () => {
        const result = chatEntitlementFromSnapshot(snapshot({}), false, NOW);
        expect(result.allowed).toBe(false);
        expect(result.tier).toBe("free");
        expect(result.unavailable).toBe(false);
    });

    test("canceled subscription is refused", () => {
        expect(
            chatEntitlementFromSnapshot(
                snapshot({ provider: "stripe", status: "canceled" }),
                false,
                NOW,
            ).allowed,
        ).toBe(false);
    });

    test("explicit premium override counts, as in capability resolution", () => {
        const result = chatEntitlementFromSnapshot(snapshot({}), true, NOW);
        expect(result.allowed).toBe(true);
        expect(result.source).toBe("explicit_override");
    });

    test("snapshot lookup failure fails CLOSED (unavailable, not allowed)", async () => {
        const result = await resolveChatEntitlement("user-1", {
            loadSnapshot: async () => {
                throw new Error("store table down");
            },
            hasOverride: async () => false,
        });
        expect(result.allowed).toBe(false);
        expect(result.unavailable).toBe(true);
        expect(result.source).toBe("unavailable");
    });

    test("override lookup failure also fails closed", async () => {
        const result = await resolveChatEntitlement("user-1", {
            loadSnapshot: async () => snapshot({}),
            hasOverride: async () => {
                throw new Error("entitlements down");
            },
        });
        expect(result.allowed).toBe(false);
        expect(result.unavailable).toBe(true);
    });
});
