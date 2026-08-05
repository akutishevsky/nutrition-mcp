#!/usr/bin/env bun

process.env.MUNCH_RAILWAY_DATA_ENABLED = "true";
process.env.MUNCH_RAILWAY_AUTH_ENABLED = "true";
process.env.MUNCH_APP_BASE_URL = "https://munch.example";

const { Hono } = await import("hono");
const { createAccountRouter } = await import("../src/accounts/routes.js");
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
    timezone: "America/New_York",
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
await storage.insertMeal(userId, {
    description: "Portal zero calorie boundary meal",
    meal_type: "snack",
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    logged_at: "2026-08-05T03:30:00.000Z",
    notes: "This instant is August 4 at 11:30 p.m. in America/New_York.",
});

const app = new Hono();
app.route("/", createAccountRouter());
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
    !portalHtml.includes("Premium · ChatGPT access active") ||
    !portalHtml.includes('id="meal-history-card"') ||
    !portalHtml.includes("Zero-calorie entries are included")
) {
    throw new Error("Portal HTML omitted account, household, or meal controls");
}
if (portalResponse.headers.get("cache-control") !== "private, no-store") {
    throw new Error("Portal response was cacheable");
}

const boundaryResponse = await app.request(
    "https://munch.example/account/portal/meals?date=2026-08-04",
    { headers: { cookie } },
);
if (boundaryResponse.status !== 200) {
    throw new Error(`Portal meal history returned ${boundaryResponse.status}`);
}
const boundary = (await boundaryResponse.json()) as {
    date: string;
    timezone: string;
    meals: Array<{
        description: string;
        calories: number | null;
        logged_at: string;
    }>;
};
const zeroMeal = boundary.meals.find(
    (meal) => meal.description === "Portal zero calorie boundary meal",
);
if (
    boundary.date !== "2026-08-04" ||
    boundary.timezone !== "America/New_York" ||
    zeroMeal?.calories !== 0 ||
    zeroMeal.logged_at !== "2026-08-05T03:30:00.000Z"
) {
    throw new Error(
        "Portal meal history changed timestamps, lost zero calories, or used the wrong local day",
    );
}
const adjacentResponse = await app.request(
    "https://munch.example/account/portal/meals?date=2026-08-05",
    { headers: { cookie } },
);
const adjacent = (await adjacentResponse.json()) as {
    meals: Array<{ description: string }>;
};
if (
    adjacent.meals.some(
        (meal) => meal.description === "Portal zero calorie boundary meal",
    )
) {
    throw new Error(
        "Timezone grouping duplicated the meal onto an adjacent day",
    );
}
if (
    boundaryResponse.headers.get("cache-control") !== "private, no-store" ||
    (
        await app.request(
            "https://munch.example/account/portal/meals?date=2026-02-30",
            { headers: { cookie } },
        )
    ).status !== 400
) {
    throw new Error("Portal meal endpoint caching or date validation failed");
}

const stylesheet = await app.request(
    "https://munch.example/portal-controls.css",
);
if (
    stylesheet.status !== 200 ||
    !stylesheet.headers.get("content-type")?.includes("text/css")
) {
    throw new Error("Portal controls stylesheet is not publicly reachable");
}

const unauthorized = await app.request("https://munch.example/account/portal");
const unauthorizedMeals = await app.request(
    "https://munch.example/account/portal/meals?date=2026-08-04",
);
if (unauthorized.status !== 401 || unauthorizedMeals.status !== 401) {
    throw new Error(
        "Portal or meal history allowed access without a web session",
    );
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
    "Munch account portal, timezone-aware zero-calorie meal history, household controls, complete export, preferences, and OAuth connection smoke test passed.",
);
process.exit(0);
