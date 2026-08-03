#!/usr/bin/env bun

import {
    consumeLoginChallenge,
    createLoginChallenge,
    resolveWebSession,
    revokeWebSession,
} from "../src/accounts/repository.js";
import { getSubscriptionSnapshot } from "../src/billing/repository.js";
import { processStripeWebhook } from "../src/billing/webhook-service.js";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for the platform smoke test");
}

const suffix = crypto.randomUUID();
const email = `smoke-${suffix}@example.test`;
const challenge = await createLoginChallenge(email);

const session = await consumeLoginChallenge(challenge.token);
if (!session) {
    throw new Error("Passwordless challenge could not be consumed");
}
if (session.userId !== challenge.userId || session.email !== email) {
    throw new Error("Passwordless challenge resolved to the wrong account");
}

const resolved = await resolveWebSession(session.sessionToken);
if (!resolved || resolved.userId !== challenge.userId) {
    throw new Error("Created web session could not be resolved");
}

const customerId = `cus_smoke_${suffix.replaceAll("-", "")}`;
const subscriptionId = `sub_smoke_${suffix.replaceAll("-", "")}`;
const checkoutEventId = `evt_checkout_${suffix.replaceAll("-", "")}`;
const subscriptionEventId = `evt_subscription_${suffix.replaceAll("-", "")}`;
const nowSeconds = Math.floor(Date.now() / 1000);

const checkoutPayload = JSON.stringify({
    id: checkoutEventId,
    type: "checkout.session.completed",
    livemode: false,
    created: nowSeconds,
    data: {
        object: {
            id: `cs_test_${suffix.replaceAll("-", "")}`,
            customer: customerId,
            client_reference_id: challenge.userId,
            metadata: { munch_user_id: challenge.userId },
        },
    },
});

if ((await processStripeWebhook(checkoutPayload)) !== "processed") {
    throw new Error("Checkout webhook was not processed");
}
if ((await processStripeWebhook(checkoutPayload)) !== "duplicate") {
    throw new Error("Checkout webhook idempotency failed");
}

const subscriptionPayload = JSON.stringify({
    id: subscriptionEventId,
    type: "customer.subscription.created",
    livemode: false,
    created: nowSeconds,
    data: {
        object: {
            id: subscriptionId,
            customer: customerId,
            status: "active",
            current_period_start: nowSeconds,
            current_period_end: nowSeconds + 30 * 24 * 60 * 60,
            cancel_at_period_end: false,
            metadata: { munch_user_id: challenge.userId },
            items: { data: [{ price: { id: "price_smoke" } }] },
        },
    },
});

if ((await processStripeWebhook(subscriptionPayload)) !== "processed") {
    throw new Error("Subscription webhook was not processed");
}

const subscription = await getSubscriptionSnapshot(challenge.userId);
if (subscription.status !== "active") {
    throw new Error("Active subscription was not persisted");
}

if (!(await revokeWebSession(session.sessionToken))) {
    throw new Error("Web session could not be revoked");
}
if (await resolveWebSession(session.sessionToken)) {
    throw new Error("Revoked web session remained valid");
}

console.log("Munch platform smoke test passed.");
