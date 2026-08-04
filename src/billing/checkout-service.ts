import { safeLocalRedirectPath } from "../accounts/redirect.js";
import { getPlatformConfig } from "../platform/config.js";
import { getBillableAccount } from "./account-query.js";
import type { SubscriptionStatus } from "./entitlements.js";
import { upsertStripeCustomer, upsertSubscription } from "./repository.js";
import {
    createStripeCheckoutSession,
    createStripePortalSession,
    retrieveStripeCheckoutSession,
    retrieveStripeSubscription,
    type StripeSubscription,
} from "./stripe-client.js";

function stripeSubscriptionStatus(value: string): SubscriptionStatus {
    const allowed: SubscriptionStatus[] = [
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
    ];
    if (!allowed.includes(value as SubscriptionStatus)) {
        throw new Error("Unsupported Stripe subscription status");
    }
    return value as SubscriptionStatus;
}

function optionalDate(timestamp: number | null | undefined): Date | null {
    return typeof timestamp === "number" && Number.isFinite(timestamp)
        ? new Date(timestamp * 1000)
        : null;
}

async function persistStripeSubscription(
    userId: string,
    subscription: StripeSubscription,
): Promise<void> {
    if (subscription.metadata?.munch_user_id !== userId) {
        throw new Error("Stripe subscription does not belong to this account");
    }

    const status = stripeSubscriptionStatus(subscription.status);
    await upsertStripeCustomer(userId, subscription.customer);
    await upsertSubscription({
        userId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items?.data?.[0]?.price?.id ?? null,
        status,
        currentPeriodStart: optionalDate(subscription.current_period_start),
        currentPeriodEnd: optionalDate(subscription.current_period_end),
        trialEnd: optionalDate(subscription.trial_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
        canceledAt: optionalDate(subscription.canceled_at),
        graceExpiresAt:
            status === "past_due"
                ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                : null,
    });
}

export async function createCheckoutForUser(input: {
    userId: string;
    pendingOAuthSessionId?: string | null;
    successReturnTo?: string;
    cancelReturnTo?: string;
}): Promise<{ checkoutSessionId: string; url: string }> {
    const account = await getBillableAccount(input.userId);
    if (!account) {
        throw new Error("Billable account not found");
    }

    const config = getPlatformConfig();
    const successReturnTo = encodeURIComponent(
        safeLocalRedirectPath(input.successReturnTo, "/account"),
    );
    const cancelReturnTo = encodeURIComponent(
        safeLocalRedirectPath(input.cancelReturnTo, "/account"),
    );
    const checkout = await createStripeCheckoutSession({
        userId: account.userId,
        customerId: account.stripeCustomerId,
        customerEmail: account.stripeCustomerId ? null : account.email,
        priceId: config.stripePriceId,
        successUrl: `${config.appBaseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}&return_to=${successReturnTo}`,
        cancelUrl: `${config.appBaseUrl}/billing/canceled?return_to=${cancelReturnTo}`,
        pendingOAuthSessionId: input.pendingOAuthSessionId,
        trialDays: account.hasPriorSubscription ? null : undefined,
    });

    if (!checkout.url) {
        throw new Error("Stripe Checkout Session did not include a URL");
    }

    return {
        checkoutSessionId: checkout.id,
        url: checkout.url,
    };
}

export async function verifyCheckoutForUser(
    userId: string,
    checkoutSessionId: string,
): Promise<{ customerId: string | null; subscriptionId: string | null }> {
    const checkout = await retrieveStripeCheckoutSession(checkoutSessionId);
    if (checkout.client_reference_id !== userId) {
        throw new Error("Checkout Session does not belong to this account");
    }
    if (checkout.status !== "complete") {
        throw new Error("Checkout Session is not complete");
    }

    if (checkout.customer) {
        await upsertStripeCustomer(userId, checkout.customer);
    }
    if (checkout.subscription) {
        await persistStripeSubscription(
            userId,
            await retrieveStripeSubscription(checkout.subscription),
        );
    }

    return {
        customerId: checkout.customer,
        subscriptionId: checkout.subscription,
    };
}

export async function createCustomerPortalForUser(
    userId: string,
): Promise<{ url: string }> {
    const account = await getBillableAccount(userId);
    if (!account?.stripeCustomerId) {
        throw new Error("Stripe customer not found");
    }

    const config = getPlatformConfig();
    const portal = await createStripePortalSession({
        customerId: account.stripeCustomerId,
        returnUrl: `${config.appBaseUrl}/account`,
    });
    return { url: portal.url };
}
