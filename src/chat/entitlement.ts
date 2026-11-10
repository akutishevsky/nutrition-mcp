import {
    subscriptionProvidesPremium,
    type MunchCapabilities,
} from "../billing/capabilities.js";
import type { SubscriptionSnapshot } from "../billing/entitlements.js";
import { hasActivePremiumOverride } from "../billing/override.js";
import {
    getDirectSubscriptionSnapshot,
    type DirectSubscriptionSnapshot,
} from "../billing/subscription-sources.js";

/**
 * S8 chat-agent entitlement gate (Amendment D, Michael, 2026-11-09).
 *
 * The conversational AI chat agent is one of exactly three things
 * Munch Premium covers — ad-free in the app, MCP access, and this
 * agent. Every one-shot AI flow (photo logging, meal ideas, plans,
 * recipe import) is FREE and unmetered; only this conversational
 * surface is Premium-gated, and Premium use of it is unmetered too
 * (subscription-only — the credit ledger was removed by PR #188 and
 * nothing here resurrects it).
 *
 * The gate reads the SAME merged rail-neutral snapshot the Settings
 * and Household surfaces render from
 * (`getDirectSubscriptionSnapshot`: Stripe + Google Play + App Store
 * records merged by `subscription-sources.ts`), so Premium counts on
 * whichever rail sold it. It deliberately does NOT use the
 * transport-derived capability surface: the Android surface resolves
 * to the free baseline by design, which would wrongly refuse a Play
 * subscriber in the packaged app. Explicit premium overrides (the
 * trusted review/test mechanism) count exactly as they do in
 * capability resolution.
 *
 * Fail-closed: a snapshot/override lookup failure resolves to
 * `unavailable` and the surface refuses — an entitlement error never
 * opens a Premium feature.
 */

export const CHAT_PREMIUM_REQUIRED_MESSAGE =
    "The Munch chat agent is part of Munch Premium ($3/month) — one of three Premium features, alongside ad-free in the app and MCP access. Every other Munch feature, including photo logging, meal ideas, meal plans, and recipe import, is free. Premium is managed on the Munch website: open https://munch.business, sign in with this same account, and manage Premium from Settings → Plan & billing there. No purchase can be started from this chat surface.";

export interface ChatEntitlement {
    allowed: boolean;
    /** True when the lookup itself failed; the gate fails closed. */
    unavailable: boolean;
    tier: "free" | "premium";
    source:
        "direct_subscription" | "explicit_override" | "free" | "unavailable";
    /** The rail that sold the Premium subscription, when there is one. */
    provider: DirectSubscriptionSnapshot["provider"];
    status: SubscriptionSnapshot["status"];
}

const FREE_ENTITLEMENT: ChatEntitlement = {
    allowed: false,
    unavailable: false,
    tier: "free",
    source: "free",
    provider: null,
    status: null,
};

const UNAVAILABLE_ENTITLEMENT: ChatEntitlement = {
    allowed: false,
    unavailable: true,
    tier: "free",
    source: "unavailable",
    provider: null,
    status: null,
};

/** Pure decision over a merged snapshot + override flag. */
export function chatEntitlementFromSnapshot(
    snapshot: DirectSubscriptionSnapshot,
    overrideActive: boolean,
    now = new Date(),
): ChatEntitlement {
    if (subscriptionProvidesPremium(snapshot, now)) {
        return {
            allowed: true,
            unavailable: false,
            tier: "premium",
            source: "direct_subscription",
            provider: snapshot.provider,
            status: snapshot.status,
        };
    }
    if (overrideActive) {
        return {
            allowed: true,
            unavailable: false,
            tier: "premium",
            source: "explicit_override",
            provider: snapshot.provider,
            status: snapshot.status,
        };
    }
    return {
        ...FREE_ENTITLEMENT,
        provider: snapshot.provider,
        status: snapshot.status,
    };
}

export interface ChatEntitlementDependencies {
    loadSnapshot?: (userId: string) => Promise<DirectSubscriptionSnapshot>;
    hasOverride?: (userId: string) => Promise<boolean>;
}

/**
 * Resolve the gate for one user. Never throws: any lookup failure is
 * the fail-closed `unavailable` entitlement.
 */
export async function resolveChatEntitlement(
    userId: string,
    dependencies: ChatEntitlementDependencies = {},
): Promise<ChatEntitlement> {
    const loadSnapshot =
        dependencies.loadSnapshot ?? getDirectSubscriptionSnapshot;
    const hasOverride = dependencies.hasOverride ?? hasActivePremiumOverride;
    try {
        const [snapshot, overrideActive] = await Promise.all([
            loadSnapshot(userId),
            hasOverride(userId),
        ]);
        return chatEntitlementFromSnapshot(snapshot, overrideActive);
    } catch (error) {
        console.warn("Chat entitlement lookup failed; failing closed", {
            userId,
            errorName: error instanceof Error ? error.name : "unknown",
        });
        return UNAVAILABLE_ENTITLEMENT;
    }
}

/** Shape guard for callers that already resolved capabilities. */
export function chatAllowedForCapabilities(
    capabilities: MunchCapabilities,
): boolean {
    return capabilities.tier === "premium";
}
