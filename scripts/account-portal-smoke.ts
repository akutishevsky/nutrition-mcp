#!/usr/bin/env bun

process.env.MUNCH_RAILWAY_DATA_ENABLED = "true";
process.env.MUNCH_RAILWAY_AUTH_ENABLED = "true";
process.env.MUNCH_APP_BASE_URL = "https://munch.example";

const { Hono } = await import("hono");
const { createAccountExportRouter } =
    await import("../src/account-export-routes.js");
const { consumeLoginChallenge, createLoginChallenge } =
    await import("../src/accounts/repository.js");
const { MUNCH_SESSION_COOKIE } = await import("../src/accounts/session.js");
const { upsertSubscription } = await import("../src/billing/repository.js");
const {
    acceptHouseholdInvitation,
    createHousehold,
    createHouseholdInvitation,
} = await import("../src/households/repository.js");
const {
    authorizeSession,
    createAuthorizationSession,
    exchangeAuthorizationCode,
    issueAuthorizationCode,
    registerOAuthClient,
} = await import("../src/oauth-platform/repository.js");
const { codeChallengeForVerifier } =
    await import("../src/oauth-platform/pkce.js");
const { closePlatformDatabase } = await import("../src/platform/database.js");
const { createPortalRouter } = await import("../src/portal/routes.js");
const { listOAuthConnections, revokeOAuthConnection } =
    await import("../src/portal/repository.js");
const storage = await import("../src/storage.js");

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for account portal smoke tests");
}

async function createUser(prefix: string) {
    const challenge = await createLoginChallenge(
        `${prefix}-${crypto.randomUUID()}@example.test`,
    );
    const session = await consumeLoginChallenge(challenge.token);
    if (!session) throw new Error("Unable to activate portal smoke user");
    return { ...challenge, session };
}

const owner = await createUser("portal-owner");
const member = await createUser("portal-member");
const userId = owner.userId;

await upsertSubscription({
    userId,
    stripeSubscriptionId: `sub_portal_${crypto.randomUUID().replaceAll("-", "")}`,
    stripePriceId: "price_portal_smoke",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000),
});
const household = await createHousehold({
    userId,
    name: "Portal Household",
    displayName: "Mom",
});
const invitation = await createHouseholdInvitation({
    userId,
    householdId: household.householdId,
    email: member.email,
    role: "member",
});
await acceptHouseholdInvitation({
    userId: member.userId,
    token: invitation.rawToken,
    displayName: "Dad",
});

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
app.route("/", createAccountExportRouter());
app.route("/", createPortalRouter());
const cookie = `${MUNCH_SESSION_COOKIE}=${owner.session.sessionToken}`;
const portalResponse = await app.request(
    "https://munch.example/account/portal",
    {
        headers: { cookie },
    },
);
if (portalResponse.status !== 200) {
    throw new Error(`Authenticated portal returned ${portalResponse.status}`);
}
const portalHtml = await portalResponse.text();
if (
    !portalHtml.includes("Munch account") ||
    !portalHtml.includes(owner.email) ||
    !portalHtml.includes("Portal Household") ||
    !portalHtml.includes("Send invitation") ||
    !portalHtml.includes("Transfer ownership") ||
    !portalHtml.includes("Dissolve household") ||
    !portalHtml.includes("Export complete account data") ||
    !portalHtml.includes("Premium · ChatGPT access active")
) {
    throw new Error("Portal HTML omitted account or household controls");
}
if (portalResponse.headers.get("cache-control") !== "private, no-store") {
    throw new Error("Portal response was cacheable");
}

const unauthorized = await app.request("https://munch.example/account/portal");
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
const exportDocument = JSON.parse(await downloadResponse.text()) as {
    meals?: Array<{ description?: string }>;
};
if (
    downloadResponse.status !== 200 ||
    !downloadResponse.headers
        .get("content-disposition")
        ?.includes("munch-account-") ||
    downloadResponse.headers.get("content-type") !==
        "application/json; charset=utf-8" ||
    downloadResponse.headers.get("cache-control") !== "private, no-store" ||
    !exportDocument.meals?.some(
        (meal) => meal.description === "Portal export smoke meal",
    )
) {
    throw new Error("Portal account export failed security or content checks");
}

if (
    !(await revokeOAuthConnection(userId, connections[0].tokenFamilyId)) ||
    (await listOAuthConnections(userId)).length !== 0
) {
    throw new Error("Portal OAuth connection revocation failed");
}

await closePlatformDatabase();
console.log(
    "Munch account portal, household controls, complete export, preferences, and OAuth connection smoke test passed.",
);
