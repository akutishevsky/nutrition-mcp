import { getPlatformConfig } from "../platform/config.js";
import { getBillableAccount } from "./account-query.js";
import {
    createStripeCheckoutSession,
    createStripePortalSession,
    retrieveStripeCheckoutSession,
} from "./stripe-client.js";

export async function createCheckoutForUser(input: {
    userId: string;
    pendingOAuthSessionId?: string | null;
}): Promise<{ checkoutSessionId: string; url: string }> {
    const account = await getBillableAccount(input.userId);
    if (!account) {
        throw new Error("Billable account not found");
    }

    const config = getPlatformConfig();
    const checkout = await createStripeCheckoutSession({
        userId: account.userId,
        customerId: account.stripeCustomerId,
        customerEmail: account.stripeCustomerId ? null : account.email,
        priceId: config.stripePriceId,
        successUrl: `${config.appBaseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${config.appBaseUrl}/billing/canceled`,
        pendingOAuthSessionId: input.pendingOAuthSessionId,
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
        returnUrl: `${config.appBaseUrl}/account/billing`,
    });
    return { url: portal.url };
}
