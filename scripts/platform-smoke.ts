#!/usr/bin/env bun

import {
    consumeLoginChallenge,
    createLoginChallenge,
    resolveWebSession,
    revokeWebSession,
} from "../src/accounts/repository.js";
import { getSubscriptionSnapshot } from "../src/billing/repository.js";
import { processStripeWebhook } from "../src/billing/webhook-service.js";
import { codeChallengeForVerifier } from "../src/oauth-platform/pkce.js";
import {
    authorizeSession,
    createAuthorizationSession,
    exchangeAuthorizationCode,
    issueAuthorizationCode,
    registerOAuthClient,
    resolveAccessToken,
    rotateRefreshToken,
} from "../src/oauth-platform/repository.js";
import { closePlatformDatabase } from "../src/platform/database.js";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for the platform smoke test");
}

const suffix = crypto.randomUUID();
const compactSuffix = suffix.replaceAll("-", "");
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

const customerId = `cus_smoke_${compactSuffix}`;
const subscriptionId = `sub_smoke_${compactSuffix}`;
const checkoutEventId = `evt_checkout_${compactSuffix}`;
const subscriptionEventId = `evt_subscription_${compactSuffix}`;
const nowSeconds = Math.floor(Date.now() / 1000);

const checkoutPayload = JSON.stringify({
    id: checkoutEventId,
    type: "checkout.session.completed",
    livemode: false,
    created: nowSeconds,
    data: {
        object: {
            id: `cs_test_${compactSuffix}`,
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

const redirectUri = "https://client.example/oauth/callback";
const client = await registerOAuthClient({
    clientName: "Munch smoke client",
    redirectUris: [redirectUri],
    tokenEndpointAuthMethod: "none",
});
const verifier = "V".repeat(64);
const authorization = await createAuthorizationSession({
    clientId: client.clientId,
    redirectUri,
    state: `state-${compactSuffix}`,
    codeChallenge: codeChallengeForVerifier(verifier),
});

if (!(await authorizeSession(authorization.id, challenge.userId))) {
    throw new Error(
        "OAuth authorization session could not be attached to user",
    );
}

const code = await issueAuthorizationCode(authorization.id, challenge.userId);
const tokens = await exchangeAuthorizationCode({
    code: code.code,
    clientId: client.clientId,
    redirectUri,
    codeVerifier: verifier,
});

const firstAccess = await resolveAccessToken(tokens.accessToken);
if (firstAccess.status !== "valid" || firstAccess.userId !== challenge.userId) {
    throw new Error("Issued OAuth access token was not valid");
}

const rotated = await rotateRefreshToken({
    refreshToken: tokens.refreshToken,
    clientId: client.clientId,
});
const rotatedAccess = await resolveAccessToken(rotated.accessToken);
if (rotatedAccess.status !== "valid") {
    throw new Error("Rotated OAuth access token was not valid");
}

let reuseDetected = false;
try {
    await rotateRefreshToken({
        refreshToken: tokens.refreshToken,
        clientId: client.clientId,
    });
} catch (error) {
    reuseDetected =
        error instanceof Error &&
        error.message === "refresh_token_reuse_detected";
}
if (!reuseDetected) {
    throw new Error("Refresh-token reuse was not detected");
}
if ((await resolveAccessToken(rotated.accessToken)).status !== "invalid") {
    throw new Error("Refresh-token reuse did not revoke the token family");
}

if (!(await revokeWebSession(session.sessionToken))) {
    throw new Error("Web session could not be revoked");
}
if (await resolveWebSession(session.sessionToken)) {
    throw new Error("Revoked web session remained valid");
}

await closePlatformDatabase();
console.log("Munch platform and OAuth smoke test passed.");
