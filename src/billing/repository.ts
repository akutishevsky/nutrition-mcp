import { createHash } from "node:crypto";
import { withBillingDatabase } from "../platform/database.js";
import type {
    SubscriptionSnapshot,
    SubscriptionStatus,
} from "./entitlements.js";

export interface StripeSubscriptionRecord {
    userId: string;
    stripeSubscriptionId: string;
    stripePriceId?: string | null;
    status: SubscriptionStatus;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    trialEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date | null;
    graceExpiresAt?: Date | null;
}

// Claim a Stripe event for processing. A successfully processed event is a
// duplicate and returns false. A previously failed event remains unprocessed and
// can be claimed again when Stripe retries it. The stored digest must match so a
// reused event ID cannot replace the original payload.
export async function recordStripeWebhookEvent(input: {
    eventId: string;
    eventType: string;
    livemode: boolean;
    rawPayload: string;
}): Promise<boolean> {
    const payloadSha256 = createHash("sha256")
        .update(input.rawPayload, "utf8")
        .digest("hex");

    return withBillingDatabase(async (tx) => {
        const rows = await tx<Array<{ stripe_event_id: string }>>`
            insert into munch.stripe_webhook_events as existing (
                stripe_event_id,
                event_type,
                livemode,
                payload_sha256,
                attempts
            ) values (
                ${input.eventId},
                ${input.eventType},
                ${input.livemode},
                ${payloadSha256},
                1
            )
            on conflict (stripe_event_id) do update
            set attempts = existing.attempts + 1,
                processing_error_code = null
            where existing.processed_at is null
              and existing.payload_sha256 = excluded.payload_sha256
              and existing.event_type = excluded.event_type
              and existing.livemode = excluded.livemode
            returning stripe_event_id
        `;
        return Boolean(rows[0]);
    });
}

export async function markStripeWebhookProcessed(
    eventId: string,
    errorCode?: string,
): Promise<void> {
    const normalizedErrorCode = errorCode ?? null;
    await withBillingDatabase(async (tx) => {
        await tx`
            update munch.stripe_webhook_events
            set processed_at = case
                    when ${normalizedErrorCode}::text is null then now()
                    else null
                end,
                processing_error_code = ${normalizedErrorCode}::text
            where stripe_event_id = ${eventId}
        `;
    });
}

export async function upsertStripeCustomer(
    userId: string,
    stripeCustomerId: string,
): Promise<void> {
    await withBillingDatabase(async (tx) => {
        await tx`
            insert into munch.stripe_customers (
                user_id,
                stripe_customer_id
            ) values (
                ${userId},
                ${stripeCustomerId}
            )
            on conflict (user_id) do update
            set stripe_customer_id = excluded.stripe_customer_id,
                updated_at = now()
        `;
    });
}

export async function findStripeCustomerId(
    userId: string,
): Promise<string | null> {
    return withBillingDatabase(async (tx) => {
        const rows = await tx<Array<{ stripe_customer_id: string }>>`
            select stripe_customer_id
            from munch.stripe_customers
            where user_id = ${userId}
        `;
        return rows[0]?.stripe_customer_id ?? null;
    });
}

export async function upsertSubscription(
    subscription: StripeSubscriptionRecord,
): Promise<void> {
    await withBillingDatabase(async (tx) => {
        await tx`
            insert into munch.subscriptions (
                user_id,
                stripe_subscription_id,
                stripe_price_id,
                status,
                current_period_start,
                current_period_end,
                trial_end,
                cancel_at_period_end,
                canceled_at,
                grace_expires_at
            ) values (
                ${subscription.userId},
                ${subscription.stripeSubscriptionId},
                ${subscription.stripePriceId ?? null},
                ${subscription.status}::munch.subscription_status,
                ${subscription.currentPeriodStart ?? null},
                ${subscription.currentPeriodEnd ?? null},
                ${subscription.trialEnd ?? null},
                ${subscription.cancelAtPeriodEnd ?? false},
                ${subscription.canceledAt ?? null},
                ${subscription.graceExpiresAt ?? null}
            )
            on conflict (stripe_subscription_id) do update
            set user_id = excluded.user_id,
                stripe_price_id = excluded.stripe_price_id,
                status = excluded.status,
                current_period_start = excluded.current_period_start,
                current_period_end = excluded.current_period_end,
                trial_end = excluded.trial_end,
                cancel_at_period_end = excluded.cancel_at_period_end,
                canceled_at = excluded.canceled_at,
                grace_expires_at = excluded.grace_expires_at,
                updated_at = now()
        `;
    });
}

export async function getSubscriptionSnapshot(
    userId: string,
): Promise<SubscriptionSnapshot> {
    return withBillingDatabase(async (tx) => {
        const rows = await tx<
            Array<{
                status: SubscriptionStatus;
                current_period_end: Date | null;
                grace_expires_at: Date | null;
            }>
        >`
            select
                status::text as status,
                current_period_end,
                grace_expires_at
            from munch.subscriptions
            where user_id = ${userId}
            order by updated_at desc
            limit 1
        `;
        const row = rows[0];
        return row
            ? {
                  status: row.status,
                  currentPeriodEnd: row.current_period_end,
                  graceExpiresAt: row.grace_expires_at,
              }
            : { status: null };
    });
}
