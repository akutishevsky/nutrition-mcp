const STRIPE_API_BASE = "https://api.stripe.com/v1";

interface StripeErrorEnvelope {
    error?: {
        type?: string;
        code?: string;
        message?: string;
        param?: string;
        request_log_url?: string;
    };
}

export class StripeRequestError extends Error {
    constructor(
        public readonly code: string,
        public readonly status: number,
        public readonly stripeMessage?: string,
        public readonly param?: string,
        public readonly requestId?: string,
        public readonly requestLogUrl?: string,
    ) {
        super(`Stripe request failed: ${code}`);
        this.name = "StripeRequestError";
    }
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

export interface StripeSubscriptionItem {
    id: string;
    quantity?: number | null;
    price?: { id?: string };
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
        data?: StripeSubscriptionItem[];
    };
}

export interface StripePrice {
    id: string;
    active: boolean;
    livemode: boolean;
    type: "one_time" | "recurring";
    recurring: {
        interval: string;
        interval_count: number;
    } | null;
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
    if (!key?.startsWith("sk_") && !key?.startsWith("rk_")) {
        throw new Error("STRIPE_SECRET_KEY is missing or invalid");
    }
    return key;
}

async function stripeRequest<T>(
    path: string,
    method: "GET" | "POST",
    parameters?: URLSearchParams,
    idempotencyKey?: string,
): Promise<T> {
    const response = await fetch(`${STRIPE_API_BASE}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${stripeSecretKey()}`,
            ...(method === "POST"
                ? { "Content-Type": "application/x-www-form-urlencoded" }
                : {}),
            ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        },
        body: method === "POST" ? parameters?.toString() : undefined,
        signal: AbortSignal.timeout(10_000),
    });

    const payload = (await response.json()) as T & StripeErrorEnvelope;
    if (!response.ok) {
        const code =
            payload.error?.code ?? payload.error?.type ?? "stripe_error";
        throw new StripeRequestError(
            code,
            response.status,
            payload.error?.message,
            payload.error?.param,
            response.headers.get("request-id") ?? undefined,
            payload.error?.request_log_url,
        );
    }
    return payload;
}

export async function retrieveStripePrice(
    priceId: string,
): Promise<StripePrice> {
    if (!/^price_[A-Za-z0-9_]+$/.test(priceId)) {
        throw new Error("STRIPE_PRICE_ID is missing or invalid");
    }
    return stripeRequest<StripePrice>(
        `/prices/${encodeURIComponent(priceId)}`,
        "GET",
    );
}

export async function createStripeCheckoutSession(
    input: CreateCheckoutInput,
): Promise<StripeCheckoutSession> {
    if (!input.customerId && !input.customerEmail) {
        throw new Error(
            "Checkout requires an existing customer or customer email",
        );
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
        payment_method_collection: "always",
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

export function subscriptionItemQuantity(
    subscription: StripeSubscription,
    priceId: string,
): number {
    const item = subscription.items?.data?.find(
        (candidate) => candidate.price?.id === priceId,
    );
    const quantity = Number(item?.quantity ?? 0);
    return Number.isInteger(quantity) && quantity > 0 ? quantity : 0;
}

export async function setStripeSubscriptionItemQuantity(input: {
    subscriptionId: string;
    priceId: string;
    quantity: number;
    idempotencyKey: string;
}): Promise<StripeSubscription> {
    if (
        !Number.isInteger(input.quantity) ||
        input.quantity < 0 ||
        input.quantity > 5
    ) {
        throw new Error("Household seat quantity must be between 0 and 5");
    }
    if (!/^price_[A-Za-z0-9_]+$/.test(input.priceId)) {
        throw new Error(
            "STRIPE_HOUSEHOLD_MEMBER_PRICE_ID is missing or invalid",
        );
    }
    if (!input.idempotencyKey.trim()) {
        throw new Error(
            "Stripe subscription update requires an idempotency key",
        );
    }

    const current = await retrieveStripeSubscription(input.subscriptionId);
    const existingItem = current.items?.data?.find(
        (candidate) => candidate.price?.id === input.priceId,
    );
    const currentQuantity = subscriptionItemQuantity(current, input.priceId);
    if (currentQuantity === input.quantity) return current;

    const body = new URLSearchParams();
    body.set(
        "proration_behavior",
        input.quantity > currentQuantity
            ? "always_invoice"
            : "create_prorations",
    );
    // A paid seat is not considered provisioned unless Stripe can apply the
    // subscription update. If an immediate upgrade invoice cannot be paid,
    // Stripe returns an error and Munch leaves the membership unprovisioned.
    body.set("payment_behavior", "error_if_incomplete");
    body.set("off_session", "true");

    if (existingItem?.id) {
        body.set("items[0][id]", existingItem.id);
        if (input.quantity === 0) {
            body.set("items[0][deleted]", "true");
        } else {
            body.set("items[0][quantity]", String(input.quantity));
        }
    } else if (input.quantity > 0) {
        body.set("items[0][price]", input.priceId);
        body.set("items[0][quantity]", String(input.quantity));
    } else {
        return current;
    }

    return stripeRequest<StripeSubscription>(
        `/subscriptions/${encodeURIComponent(input.subscriptionId)}`,
        "POST",
        body,
        input.idempotencyKey,
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
