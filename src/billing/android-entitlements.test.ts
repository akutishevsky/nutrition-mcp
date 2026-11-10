import { describe, expect, test } from "bun:test";
import {
    androidEntitlementsFromLegacyStripePremium,
    resolveAndroidEntitlements,
} from "./android-entitlements.js";
import { chooseDirectSubscription } from "./subscription-sources.js";

const now = new Date("2026-10-10T12:00:00.000Z");

describe("Android ad-free entitlement", () => {
    test("maps active and trialing legacy Stripe Premium to ad-free access", () => {
        expect(
            androidEntitlementsFromLegacyStripePremium(
                { status: "active" },
                now,
            ),
        ).toEqual({ adFree: true });
        expect(
            androidEntitlementsFromLegacyStripePremium(
                { status: "trialing" },
                now,
            ),
        ).toEqual({ adFree: true });
    });

    test("keeps ad-free access during the existing paid grace period", () => {
        expect(
            androidEntitlementsFromLegacyStripePremium(
                {
                    status: "past_due",
                    graceExpiresAt: new Date("2026-10-10T12:01:00.000Z"),
                },
                now,
            ),
        ).toEqual({ adFree: true });
    });

    test("does not grant ad-free access after Stripe Premium ends", () => {
        for (const status of [
            null,
            "canceled",
            "unpaid",
            "paused",
            "incomplete",
        ] as const) {
            expect(
                androidEntitlementsFromLegacyStripePremium({ status }, now),
            ).toEqual({ adFree: false });
        }
        expect(
            androidEntitlementsFromLegacyStripePremium(
                {
                    status: "past_due",
                    graceExpiresAt: new Date("2026-10-10T11:59:00.000Z"),
                },
                now,
            ),
        ).toEqual({ adFree: false });
    });

    test("fails closed without a verified Stripe subscription", () => {
        expect(androidEntitlementsFromLegacyStripePremium(null, now)).toEqual({
            adFree: false,
        });
    });
});

describe("resolveAndroidEntitlements (merged rail-neutral snapshot)", () => {
    test("(a) Stripe Premium resolves ad-free, unchanged", async () => {
        const result = await resolveAndroidEntitlements(
            "stripe-user",
            async () =>
                chooseDirectSubscription(
                    [{ provider: "stripe", status: "active" }],
                    now,
                ),
        );
        expect(result).toEqual({ adFree: true });
    });

    test("(b) store-rail-only Premium (google_play, no Stripe record) resolves ad-free", async () => {
        const result = await resolveAndroidEntitlements("play-user", async () =>
            chooseDirectSubscription(
                [
                    {
                        provider: "google_play",
                        productId: "munch_premium_monthly",
                        status: "active",
                        currentPeriodEnd: new Date("2026-11-10T12:00:00.000Z"),
                    },
                ],
                now,
            ),
        );
        expect(result).toEqual({ adFree: true });
    });

    test("merged snapshot prefers an active Play subscription over a canceled Stripe record", async () => {
        const result = await resolveAndroidEntitlements("play-user", async () =>
            chooseDirectSubscription(
                [
                    { provider: "stripe", status: "canceled" },
                    {
                        provider: "google_play",
                        productId: "munch_premium_monthly",
                        status: "trialing",
                    },
                ],
                now,
            ),
        );
        expect(result).toEqual({ adFree: true });
    });

    test("(c) no subscription resolves not ad-free", async () => {
        const result = await resolveAndroidEntitlements("free-user", async () =>
            chooseDirectSubscription([], now),
        );
        expect(result).toEqual({ adFree: false });
    });

    test("(d) a failing snapshot source fails soft to null, without throwing", async () => {
        const result = await resolveAndroidEntitlements(
            "unlucky-user",
            async () => {
                throw new Error("billing storage unavailable");
            },
        );
        expect(result).toEqual({ adFree: null });
    });
});
