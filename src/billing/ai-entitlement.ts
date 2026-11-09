import type { Context } from "hono";
import {
    resolveMunchCapabilities,
    type MunchCapabilities,
    type MunchCapabilitySurface,
} from "./capabilities.js";

/**
 * Premium-entitlement gate for Munch-supplied AI features (De-credit
 * slice, Full Parity App Program Amendment C, Michael 2026-11-09:
 * "We are ditching the credits. We are just doing subscription.").
 *
 * This replaces the S1 AI-task credit meter (PR #179) entirely. There is
 * no credit pool, no per-task cost, no balance and no 402: a Premium
 * subscriber uses every AI feature unmetered, and a Free user who hits
 * an AI action gets the established `premium_required` 403 gate. Manual
 * entry never goes through this gate and always works.
 *
 * CRITICAL surface rule: entitlement is the account's ACTUAL
 * subscription tier, resolved with the "web" capability rules on EVERY
 * surface — including Android bearer requests. The Android transport
 * resolves workspace capabilities through
 * `androidFreeBaselineCapabilities`, which grants the non-AI workspace
 * (recipes, planning, pantry) to every signed-in Android user by
 * design. That baseline must never wave an AI call through for a Free
 * account, so this gate deliberately ignores the request transport and
 * always resolves the subscription-backed tier (direct Stripe/store
 * subscription, explicit Premium override, or a covered household seat).
 *
 * Fail-closed: if the subscription lookup itself fails, the gate
 * treats the account as not Premium rather than letting the AI call
 * through (mirrors `failClosedMunchCapabilities`).
 */

export interface AiEntitlementDeps {
    resolveCapabilities: (
        userId: string,
        surface: MunchCapabilitySurface,
    ) => Promise<MunchCapabilities>;
}

const defaultDeps: AiEntitlementDeps = {
    resolveCapabilities: (userId, surface) =>
        resolveMunchCapabilities(userId, surface),
};

let depsOverride: Partial<AiEntitlementDeps> | null = null;

/** Test seam only; production always resolves the real subscription tier. */
export function _setAiEntitlementDepsForTests(
    deps: Partial<AiEntitlementDeps> | null,
): void {
    depsOverride = deps;
}

function entitlementDeps(): AiEntitlementDeps {
    return { ...defaultDeps, ...(depsOverride ?? {}) };
}

/**
 * True when the account's actual subscription tier is Premium. Always
 * resolved with the "web" rules — never the Android free baseline — so
 * the answer is the same on the website and in the packaged app.
 */
export async function hasPremiumAiEntitlement(
    userId: string,
): Promise<boolean> {
    try {
        const capabilities = await entitlementDeps().resolveCapabilities(
            userId,
            "web",
        );
        return capabilities.tier === "premium";
    } catch {
        return false;
    }
}

export type PremiumAiGateResult =
    { allowed: true } | { allowed: false; response: Response };

/**
 * Route gate for AI features on the website and in the app. Premium →
 * the handler runs its model call, unmetered. Free → the established
 * `premium_required` 403 shape, with the manual path named in the body:
 * never a surprise charge, never a dead end.
 */
export async function requirePremiumAi(
    c: Context,
    input: { userId: string },
): Promise<PremiumAiGateResult> {
    if (await hasPremiumAiEntitlement(input.userId)) {
        return { allowed: true };
    }
    return {
        allowed: false,
        response: c.json(
            {
                error: "premium_required",
                message:
                    "This AI feature is included with Munch Premium. You can keep going with manual entry — it always works.",
                manual_entry_available: true,
            },
            403,
        ),
    };
}
