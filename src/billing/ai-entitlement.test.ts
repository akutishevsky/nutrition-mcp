import { afterEach, describe, expect, test } from "bun:test";
import type { Context } from "hono";
import {
    _setAiEntitlementDepsForTests,
    hasPremiumAiEntitlement,
    requirePremiumAi,
} from "./ai-entitlement.js";
import {
    androidFreeBaselineCapabilities,
    capabilitiesFromSubscription,
    type MunchCapabilities,
    type MunchCapabilitySurface,
} from "./capabilities.js";

/**
 * De-credit slice (Amendment C): the meter tests that used to live in
 * ai-credits.test.ts / android-ai-credits.test.ts asserted reserve /
 * refund / balance / 402 behaviour. Those concepts no longer exist.
 * These tests assert the replacement contract instead: AI features gate
 * on the account's ACTUAL Premium entitlement, identically on the web
 * and Android surfaces, and the Android free baseline — which grants
 * the non-AI workspace to every Android user — never waves an AI call
 * through for a Free account.
 */

const FREE_USER = "11111111-1111-4111-8111-111111111111";
const PREMIUM_USER = "22222222-2222-4222-8222-222222222222";

function requestContext(transport: "web" | "android"): Context {
    return {
        get: (key: string) =>
            key === "munchAuthTransport"
                ? transport === "android"
                    ? "bearer"
                    : undefined
                : undefined,
        json: (body: unknown, status: number) =>
            new Response(JSON.stringify(body), {
                status,
                headers: { "Content-Type": "application/json" },
            }),
    } as unknown as Context;
}

/**
 * Simulates production capability resolution: the Android surface gets
 * the free baseline (tier "free", but personalPlanningRead/Write true),
 * while the web surface resolves the account's real subscription tier.
 * Records every surface the gate asks about.
 */
function installProductionLikeResolver() {
    const surfaces: MunchCapabilitySurface[] = [];
    _setAiEntitlementDepsForTests({
        resolveCapabilities: async (
            userId: string,
            surface: MunchCapabilitySurface,
        ): Promise<MunchCapabilities> => {
            surfaces.push(surface);
            if (surface === "android") {
                return androidFreeBaselineCapabilities(null, userId);
            }
            return capabilitiesFromSubscription({
                status: userId === PREMIUM_USER ? "active" : null,
            });
        },
    });
    return surfaces;
}

afterEach(() => _setAiEntitlementDepsForTests(null));

describe("Premium AI entitlement gate (subscription-only, Amendment C)", () => {
    test("Free web → gated with the premium_required 403 shape", async () => {
        installProductionLikeResolver();
        const gate = await requirePremiumAi(requestContext("web"), {
            userId: FREE_USER,
        });
        expect(gate.allowed).toBe(false);
        if (!gate.allowed) {
            expect(gate.response.status).toBe(403);
            const body = await gate.response.json();
            expect(body.error).toBe("premium_required");
            expect(body.manual_entry_available).toBe(true);
        }
    });

    test("Premium web → allowed, unmetered (no reservation, no balance)", async () => {
        installProductionLikeResolver();
        const gate = await requirePremiumAi(requestContext("web"), {
            userId: PREMIUM_USER,
        });
        expect(gate).toEqual({ allowed: true });
    });

    test("Free Android-surface → gated: the free baseline never waves AI through", async () => {
        const surfaces = installProductionLikeResolver();
        // The Android baseline itself grants planning access to this
        // Free account — that is exactly what must NOT decide AI access.
        const baseline = androidFreeBaselineCapabilities(null, FREE_USER);
        expect(baseline.personalPlanningRead).toBe(true);
        expect(baseline.tier).toBe("free");

        const gate = await requirePremiumAi(requestContext("android"), {
            userId: FREE_USER,
        });
        expect(gate.allowed).toBe(false);
        if (!gate.allowed) {
            expect(gate.response.status).toBe(403);
            const body = await gate.response.json();
            expect(body.error).toBe("premium_required");
        }
        // The gate resolved the real tier via the web rules, never the
        // Android surface.
        expect(surfaces).toEqual(["web"]);
    });

    test("Premium Android-surface → allowed on the real subscription tier", async () => {
        const surfaces = installProductionLikeResolver();
        const gate = await requirePremiumAi(requestContext("android"), {
            userId: PREMIUM_USER,
        });
        expect(gate).toEqual({ allowed: true });
        expect(surfaces).toEqual(["web"]);
    });

    test("hasPremiumAiEntitlement maps the resolved tier and fails closed", async () => {
        _setAiEntitlementDepsForTests({
            resolveCapabilities: async (userId: string) =>
                capabilitiesFromSubscription({
                    status: userId === PREMIUM_USER ? "trialing" : "canceled",
                }),
        });
        expect(await hasPremiumAiEntitlement(PREMIUM_USER)).toBe(true);
        expect(await hasPremiumAiEntitlement(FREE_USER)).toBe(false);

        _setAiEntitlementDepsForTests({
            resolveCapabilities: async () => {
                throw new Error("billing lookup down");
            },
        });
        // Fail-closed: an unreachable lookup gates the AI call instead
        // of letting it through; manual entry is unaffected.
        expect(await hasPremiumAiEntitlement(PREMIUM_USER)).toBe(false);
        const gate = await requirePremiumAi(requestContext("web"), {
            userId: PREMIUM_USER,
        });
        expect(gate.allowed).toBe(false);
        if (!gate.allowed) expect(gate.response.status).toBe(403);
    });

    test("the gate never returns the old meter outcomes (402 / exhausted / unavailable)", async () => {
        installProductionLikeResolver();
        for (const userId of [FREE_USER, PREMIUM_USER]) {
            for (const transport of ["web", "android"] as const) {
                const gate = await requirePremiumAi(requestContext(transport), {
                    userId,
                });
                if (!gate.allowed) {
                    expect(gate.response.status).toBe(403);
                    const body = await gate.response.json();
                    expect(body.error).toBe("premium_required");
                    expect(body.balance).toBeUndefined();
                    expect(body.cost).toBeUndefined();
                }
            }
        }
    });
});
