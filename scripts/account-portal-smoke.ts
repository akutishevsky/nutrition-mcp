#!/usr/bin/env bun

process.env.MUNCH_RAILWAY_DATA_ENABLED = "true";
process.env.MUNCH_RAILWAY_AUTH_ENABLED = "true";
process.env.MUNCH_APP_BASE_URL = "https://munch.example";

const { Hono } = await import("hono");
const { consumeLoginChallenge, createLoginChallenge } = await import(
    "../src/accounts/repository.js"
);
const { MUNCH_SESSION_COOKIE } = await import(
    "../src/accounts/session.js"
);
const { createPortalRouter } = await import("../src/portal/routes.js");
const {
    listOAuthConnections,
    revokeOAuthConnection,
} = await import("../src/portal/repository.js");
const {
    authorizeSession,
    createAuthorizationSession,
    exchangeAuthorizationCode,
    issueAuthorizationCode,
    registerOAuthClient,
} = await import("../src/oauth-platform/repository.js");
const { codeChallengeForVerifier } = await import(
    "../src/oauth-platform/pkce.js"
);
const storage = await import("../src/storage.js");
const { closePlatformDatabase } = await import(
    "../src/platform/database.js"
);

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for account portal smoke tests");
}

const challenge = await createLoginChallenge(
    `portal-${crypto.randomUUID()}@example.test`,
);
const session = await consumeLoginChallenge(challenge.token);
if (!session) throw new Error("Unable to activate portal smoke user");
const userId = challenge.userId;

const client = await registerOAuthClient({
    clientName: "Portal smoke client",
    redirectUris: ["http://127.0.0.1:4567/callback"],
    tokenEndpointAuthMethod: "none",
});
const verifier = "portal-smoke-verifier-abcdefghijklmnopqrstuvwxyz0123456789";
const authorization = await createAuthorizationSession({
    clientId: client.clientId,
    redirectUri: client.redirectUris[0]!,
    state: "portal-smoke-state",
    codeChallenge: codeChallengeForVerifier(verifier),
});
if (!(await authorizeSession(authorization.id, userId))) {
    throw new Error("Unable to authorize portal smoke connection");
}
const code = await issueAuthorizationCode(authorization.id, userId);
await exchangeAuthorizationCode({
    code: code.code,
    clientId: client.clientId,
    redirectUri: client.redirectUris[0]!,
    codeVerifier: verifier,
});

const connections = await listOAuthConnections(userId);
if (
    connections.length !== 1 ||
    connections[0]?.clientName !== "Portal smoke client" ||
    connections[0].activeRefreshTokens < 1
) {
    throw new Error("Portal did not list the active OAuth connection");
}
if (
    !(await revokeOAuthConnection(userId, connections[0].tokenFamilyId)) ||
    (await listOAuthConnections(userId)).length !== 0
) {
    throw new Error("Portal OAuth connection revocation failed");
}

await storage.upsertProfile(userId, {
    timezone: "UTC",
    preferred_weight_unit: "kg",
});
await storage.insertMeal(userId, {
    description: "Portal export smoke meal",
    meal_type: "lunch",
    calories: 500,
    protein_g: 30,
    carbs_g: 55,
    fat_g: 18,
    logged_at: "2026-08-03T18:00:00.000Z",
});

const app = new Hono();
app.route("/", createPortalRouter());
const cookie = `${MUNCH_SESSION_COOKIE}=${session.sessionToken}`;
const portalResponse = await app.request("https://munch.example/account/portal", {
    headers: { cookie },
});
if (portalResponse.status !== 200) {
    throw new Error(`Authenticated portal returned ${portalResponse.status}`);
}
const portalHtml = await portalResponse.text();
if (
    !portalHtml.includes("Munch account") ||
    !portalHtml.includes(challenge.email)
) {
    throw new Error("Portal HTML did not contain account identity");
}
if (portalResponse.headers.get("cache-control") !== "private, no-store") {
    throw new Error("Portal response was cacheable");
}

const unauthorized = await app.request(
    "https://munch.example/account/portal",
);
if (unauthorized.status !== 401) {
    throw new Error("Portal allowed access without a web session");
}

const preferences = await app.request(
    "https://munch.example/account/portal/preferences",
    {
        method: "POST",
        headers: {
            cookie,
            origin: "https://munch.example",
            "content-type": "application/json",
        },
        body: JSON.stringify({
            timezone: "America/New_York",
            preferred_weight_unit: "lb",
            widgets_enabled: false,
            alcohol_tracking_enabled: true,
            preferred_drink_unit: "us",
        }),
    },
);
if (preferences.status !== 200) {
    throw new Error(`Portal preference save returned ${preferences.status}`);
}
const profile = await storage.getProfile(userId);
if (
    profile?.timezone !== "America/New_York" ||
    profile.preferred_weight_unit !== "lb" ||
    profile.widgets_enabled !== false ||
    profile.alcohol_tracking_enabled !== true
) {
    throw new Error("Portal preferences were not persisted");
}

const exportResponse = await app.request(
    "https://munch.example/account/portal/export",
    {
        method: "POST",
        headers: {
            cookie,
            origin: "https://munch.example",
            "content-type": "application/json",
        },
        body: "{}",
    },
);
if (exportResponse.status !== 200) {
    throw new Error(`Portal export returned ${exportResponse.status}`);
}
const exported = (await exportResponse.json()) as { url?: string };
if (!exported.url) throw new Error("Portal export did not issue a URL");
const exportUrl = new URL(exported.url);
const downloadResponse = await app.request(exportUrl.toString());
if (
    downloadResponse.status !== 200 ||
    !downloadResponse.headers
        .get("content-disposition")
        ?.includes("munch-meals-") ||
    downloadResponse.headers.get("cache-control") !== "private, no-store" ||
    !(await downloadResponse.text()).includes("Portal export smoke meal")
) {
    throw new Error("Portal export download failed security or content checks");
}

await closePlatformDatabase();
console.log("Munch account portal, export, preferences, and OAuth connection smoke test passed.");
