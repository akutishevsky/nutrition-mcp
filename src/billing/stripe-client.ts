const STRIPE_API_BASE = "https://api.stripe.com/v1";

interface StripeErrorEnvelope {
    error?: {
        type?: string;
        code?: string;
        message?: string;
    };
}

export interface StripeCheckoutSession {
    id: string;
    url: string | null;
    customer: string | null;
    subscription: string | null;
    payment_status: string;
    status: string | null;
    client_reference_id: string | null;
}

export interface StripeSubscription {
    id: string;
    customer: string;
    status: string;
    current_period_start?: number;
    current_period_end?: number;
    trial_end?: number | null;
    cancel_at_period_end?: boolean;
    canceled_at?: number | null;
    metadata?: Record<string, string>;
    items?: {
        data?: Array<{
            price?: { id?: string };
        }>;
    };
}

export interface StripePortalSession {
    id: string;
    url: string;
}

export interface CreateCheckoutInput {
    userId: string;
    customerId?: string | null;
    customerEmail?: string | null;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    pendingOAuthSessionId?: string | null;
}

function stripeSecretKey(): string {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key?.startsWith("sk_")) {
        throw new Error("STRIPE_SECRET_KEY is missing or invalid");
    }
    return key;
}

async function stripeRequest<T>(
    path: string,
    method: "GET" | "POST",
    parameters?: URLSearchParams,
): Promise<T> {
    const response = await fetch(`${STRIPE_API_BASE}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${stripeSecretKey()}`,
            ...(method === "POST"
                ? { "Content-Type": "application/x-www-form-urlencoded" }
                : {}),
        },
        body: method === "POST" ? parameters?.toString() : undefined,
        signal: AbortSignal.timeout(10_000),
    });

    const payload = (await response.json()) as T & StripeErrorEnvelope;
    if (!response.ok) {
        const code = payload.error?.code ?? payload.error?.type ?? "stripe_error";
        throw new Error(`Stripe request failed: ${code}`);
    }
    return payload;
}

export async function createStripeCheckoutSession(
    input: CreateCheckoutInput,
): Promise<StripeCheckoutSession> {
    if (!input.customerId && !input.customerEmail) {
        throw new Error("Checkout requires an existing customer or customer email");
    }

    const body = new URLSearchParams({
        mode: "subscription",
        "line_items[0][price]": input.priceId,
        "line_items[0][quantity]": "1",
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        client_reference_id: input.userId,
        "metadata[munch_user_id]": input.userId,
        "subscription_data[metadata][munch_user_id]": input.userId,
        allow_promotion_codes: "true",
    });

    if (input.customerId) {
        body.set("customer", input.customerId);
    } else if (input.customerEmail) {
        body.set("customer_email", input.customerEmail);
    }

    if (input.pendingOAuthSessionId) {
        body.set(
            "metadata[pending_oauth_session_id]",
            input.pendingOAuthSessionId,
        );
    }

    return stripeRequest<StripeCheckoutSession>(
        "/checkout/sessions",
        "POST",
        body,
    );
}

export async function retrieveStripeCheckoutSession(
    sessionId: string,
): Promise<StripeCheckoutSession> {
    if (!/^cs_(test_|live_)?[A-Za-z0-9_]+$/.test(sessionId)) {
        throw new Error("Invalid Stripe Checkout Session ID");
    }
    return stripeRequest<StripeCheckoutSession>(
        `/checkout/sessions/${encodeURIComponent(sessionId)}`,
        "GET",
    );
}

export async function retrieveStripeSubscription(
    subscriptionId: string,
): Promise<StripeSubscription> {
    if (!/^sub_[A-Za-z0-9_]+$/.test(subscriptionId)) {
        throw new Error("Invalid Stripe Subscription ID");
    }
    return stripeRequest<StripeSubscription>(
        `/subscriptions/${encodeURIComponent(subscriptionId)}`,
        "GET",
    );
}

export async function createStripePortalSession(input: {
    customerId: string;
    returnUrl: string;
}): Promise<StripePortalSession> {
    const body = new URLSearchParams({
        customer: input.customerId,
        return_url: input.returnUrl,
    });
    return stripeRequest<StripePortalSession>(
        "/billing_portal/sessions",
        "POST",
        body,
    );
}
