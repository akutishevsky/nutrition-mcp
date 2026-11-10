import { subscriptionProvidesPremium } from "./capabilities.js";
import type { SubscriptionSnapshot } from "./entitlements.js";
import {
    getDirectSubscriptionSnapshot,
    type DirectSubscriptionSnapshot,
} from "./subscription-sources.js";

export interface AndroidEntitlements {
    adFree: boolean | null;
}

export function androidEntitlementsFromSubscription(
    subscription: SubscriptionSnapshot | null,
    now = new Date(),
): AndroidEntitlements {
    return {
        adFree: Boolean(
            subscription && subscriptionProvidesPremium(subscription, now),
        ),
    };
}

/**
 * Backwards-compatible name for the original Stripe-only helper. The mapping
 * itself is rail-neutral: it only reads the snapshot's status/grace fields.
 */
export function androidEntitlementsFromLegacyStripePremium(
    subscription: SubscriptionSnapshot | null,
    now = new Date(),
): AndroidEntitlements {
    return androidEntitlementsFromSubscription(subscription, now);
}

export type AndroidSubscriptionSnapshotLoader = (
    userId: string,
) => Promise<DirectSubscriptionSnapshot>;

/**
 * Premium subscribers receive the Android ad-free benefit, on whichever rail
 * they subscribed through. The resolver reads the same merged rail-neutral
 * snapshot the rest of the system uses (`getDirectSubscriptionSnapshot`:
 * Stripe + store records merged by `subscription-sources.ts`), so a Google
 * Play Premium subscriber resolves ad-free exactly like a Stripe one.
 *
 * This remains a separate entitlement from the Munch feature tier: it reads
 * the DIRECT subscription only — household seat coverage and explicit
 * premium overrides (both part of capability resolution) do not grant
 * ad-free here, exactly as they did not under the Stripe-only resolver.
 * A lookup failure returns `{ adFree: null }` (fail-soft, no throw) so the
 * caller can leave the ad state undecided rather than guessing.
 */
export async function resolveAndroidEntitlements(
    userId: string,
    loadSnapshot: AndroidSubscriptionSnapshotLoader = getDirectSubscriptionSnapshot,
): Promise<AndroidEntitlements> {
    try {
        const subscription = await loadSnapshot(userId);
        return androidEntitlementsFromSubscription(subscription);
    } catch (error) {
        console.warn("Android ad-free entitlement lookup failed", {
            errorName: error instanceof Error ? error.name : "unknown",
        });
        return { adFree: null };
    }
}
