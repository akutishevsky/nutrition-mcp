import type { SubscriptionStatus } from "./entitlements.js";
import {
    markStripeWebhookProcessed,
    recordStripeWebhookEvent,
    upsertStripeCustomer,
    upsertSubscription,
} from "./repository.js";

interface StripeEventEnvelope {
    id: string;
    type: string;
    livemode: boolean;
    created: number;
    data: {
        object: unknown;
    };
}

interface StripeSubscriptionObject {
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
            price?: {
                id?: string;
            };
        }>;
    };
}

interface StripeCheckoutObject {
    id: string;
    customer?: string | null;
    client_reference_id?: string | null;
    metadata?: Record<string, string>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === "object" && value !== null
        ? (value as Record<string, unknown>)
        : null;
}

function parseEvent(rawPayload: string): StripeEventEnvelope {
    const parsed = JSON.parse(rawPayload) as unknown;
    const record = asRecord(parsed);
    const data = asRecord(record?.data);
    if (
        !record ||
        typeof record.id !== "string" ||
        typeof record.type !== "string" ||
        typeof record.livemode !== "boolean" ||
        typeof record.created !== "number" ||
        !data ||
        !("object" in data)
    ) {
        throw new Error("invalid_event_envelope");
    }

    return {
        id: record.id,
        type: record.type,
        livemode: record.livemode,
        created: record.created,
        data: { object: data.object },
    };
}

function subscriptionStatus(value: string): SubscriptionStatus {
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
        throw new Error("unsupported_subscription_status");
    }
    return value as SubscriptionStatus;
}

function optionalDate(timestamp: number | null | undefined): Date | null {
    return typeof timestamp === "number" && Number.isFinite(timestamp)
        ? new Date(timestamp * 1000)
        : null;
}

function userIdFromMetadata(
    metadata: Record<string, string> | undefined,
    fallback?: string | null,
): string {
    const value = metadata?.munch_user_id ?? fallback;
    if (
        !value ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            value,
        )
    ) {
        throw new Error("missing_user_mapping");
    }
    return value;
}

async function processCheckoutCompleted(value: unknown): Promise<void> {
    const checkout = value as StripeCheckoutObject;
    if (!checkout || typeof checkout.id !== "string") {
        throw new Error("invalid_checkout_object");
    }
    const userId = userIdFromMetadata(
        checkout.metadata,
        checkout.client_reference_id,
    );
    if (typeof checkout.customer === "string") {
        await upsertStripeCustomer(userId, checkout.customer);
    }
}

async function processSubscription(
    value: unknown,
    eventCreated: number,
): Promise<void> {
    const subscription = value as StripeSubscriptionObject;
    if (
        !subscription ||
        typeof subscription.id !== "string" ||
        typeof subscription.customer !== "string" ||
        typeof subscription.status !== "string"
    ) {
        throw new Error("invalid_subscription_object");
    }

    const userId = userIdFromMetadata(subscription.metadata);
    const status = subscriptionStatus(subscription.status);
    const graceExpiresAt =
        status === "past_due"
            ? new Date((eventCreated + 3 * 24 * 60 * 60) * 1000)
            : null;

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
        graceExpiresAt,
    });
}

function processingErrorCode(error: unknown): string {
    if (error instanceof SyntaxError) return "invalid_json";
    if (!(error instanceof Error)) return "unknown_error";

    const allowed = new Set([
        "invalid_event_envelope",
        "unsupported_subscription_status",
        "missing_user_mapping",
        "invalid_checkout_object",
        "invalid_subscription_object",
    ]);
    return allowed.has(error.message) ? error.message : "database_write_failed";
}

export async function processStripeWebhook(
    rawPayload: string,
): Promise<"processed" | "duplicate" | "ignored"> {
    const event = parseEvent(rawPayload);
    const claimed = await recordStripeWebhookEvent({
        eventId: event.id,
        eventType: event.type,
        livemode: event.livemode,
        rawPayload,
    });
    if (!claimed) return "duplicate";

    try {
        if (event.type === "checkout.session.completed") {
            await processCheckoutCompleted(event.data.object);
        } else if (event.type.startsWith("customer.subscription.")) {
            await processSubscription(event.data.object, event.created);
        } else {
            await markStripeWebhookProcessed(event.id);
            return "ignored";
        }

        await markStripeWebhookProcessed(event.id);
        return "processed";
    } catch (error) {
        await markStripeWebhookProcessed(event.id, processingErrorCode(error));
        throw error;
    }
}
