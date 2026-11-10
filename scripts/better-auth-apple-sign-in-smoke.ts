#!/usr/bin/env bun

/**
 * Apple social sign-in smoke (IOS-AUTH, Amendment H) — runs in the CI
 * database job against real Postgres, with FIXTURE Apple identifiers
 * only (no real Apple credentials exist yet, and none are needed).
 *
 * Proves the server wiring flips on by configuration alone:
 *
 * - Config discipline: a partial `MUNCH_APPLE_*` set refuses
 *   (`getBetterAuthRuntimeConfig` throws); the full set parses.
 * - Provider registration: with the fixture set present, the auth
 *   instance carries an `apple` social provider whose clientId is the
 *   fixture Services ID, whose audience list is exactly
 *   [Services ID, `business.munch.app`] (web tokens vs the packaged
 *   app's bundle-ID-audience tokens), and whose client secret is a
 *   server-GENERATED ES256 JWT (iss = team ID, sub = Services ID,
 *   aud = https://appleid.apple.com, bounded exp) — never the `.p8`
 *   key material itself.
 * - Initiation: `POST /api/auth/sign-in/social` for Apple returns
 *   Apple's authorization URL carrying the Services ID, the exact
 *   callback `https://munch.example/api/auth/callback/apple`,
 *   `response_mode=form_post`, and `response_type=code id_token`.
 * - Amendment I readiness: the sign-in-methods inventory flips Apple
 *   from `not_configured` to linkable (`not_linked`, `canLink: true`)
 *   with NO guardrail changes, and the session-bound link endpoint now
 *   initiates an Apple link (Apple consent URL) instead of the honest
 *   `provider_not_configured` refusal the unconfigured smoke asserts.
 * - Google on iOS (server side): with `MUNCH_GOOGLE_IOS_CLIENT_ID` set
 *   alongside the web client, the Google provider's ID-token audience
 *   list carries web + iOS (no Android entry invented), and
 *   `/mobile/auth/google-config` reports `platforms.ios.configured`.
 *
 * The fixture private key is a throwaway P-256 key generated in this
 * process; initiation never exchanges a code, so Apple never sees it.
 */

import { generateKeyPairSync } from "node:crypto";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for the Apple sign-in smoke");
}

const fixturePrivateKey = generateKeyPairSync("ec", {
    namedCurve: "P-256",
})
    .privateKey.export({ type: "pkcs8", format: "pem" })
    .toString();

const FIXTURE_SERVICES_ID = "business.munch.signin";
const FIXTURE_KEY_ID = "SMOKEKEY01";
const FIXTURE_TEAM_ID = "SMOKETEAM1";
const FIXTURE_WEB_CLIENT_ID =
    "890658789419-chqidgpgcpn3sr25u1p3c7aj0anljo9l.apps.googleusercontent.com";
const FIXTURE_IOS_CLIENT_ID =
    "890658789419-iosfixture00000000000000000000.apps.googleusercontent.com";

process.env.MUNCH_APP_BASE_URL = "https://munch.example";
process.env.MUNCH_GOOGLE_WEB_CLIENT_ID = FIXTURE_WEB_CLIENT_ID;
process.env.MUNCH_GOOGLE_IOS_CLIENT_ID = FIXTURE_IOS_CLIENT_ID;
process.env.MUNCH_GOOGLE_CLIENT_SECRET =
    "smoke-placeholder-secret-never-exchanged";
delete process.env.MUNCH_GOOGLE_ANDROID_CLIENT_ID;

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

const { getBetterAuthRuntimeConfig } = await import("../src/auth/config.js");

// ---- Config discipline: partial Apple set refuses --------------------
process.env.MUNCH_APPLE_SERVICES_ID = FIXTURE_SERVICES_ID;
process.env.MUNCH_APPLE_KEY_ID = FIXTURE_KEY_ID;
process.env.MUNCH_APPLE_TEAM_ID = FIXTURE_TEAM_ID;
delete process.env.MUNCH_APPLE_PRIVATE_KEY;
let partialRefused = false;
try {
    getBetterAuthRuntimeConfig();
} catch (error) {
    partialRefused =
        error instanceof Error &&
        error.message.includes("must be configured together");
}
assert(partialRefused, "A partial MUNCH_APPLE_* set must refuse to parse");

process.env.MUNCH_APPLE_PRIVATE_KEY = fixturePrivateKey;
const config = getBetterAuthRuntimeConfig();
assert(
    config.appleServicesId === FIXTURE_SERVICES_ID &&
        config.googleIosClientId === FIXTURE_IOS_CLIENT_ID,
    "The full fixture set must parse into the runtime config",
);

const { SQL } = await import("bun");
const { Hono } = await import("hono");
const { getMunchBetterAuth } = await import("../src/auth/auth.js");
const { listSignInMethods } = await import("../src/auth/sign-in-methods.js");
const { createSignInMethodsRouter } =
    await import("../src/auth/sign-in-methods-routes.js");
const { createMobileAuthRouter } = await import("../src/auth/mobile-routes.js");
const { closePlatformDatabase } = await import("../src/platform/database.js");

const sql = new SQL({ url: databaseUrl, max: 1 });
const auth = getMunchBetterAuth();
const userIds: string[] = [];
let succeeded = false;

function decodeJwtClaims(token: string): Record<string, unknown> {
    const parts = token.split(".");
    assert(parts.length === 3, "Client secret must be a three-part JWT");
    return JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8"));
}
function decodeJwtHeader(token: string): Record<string, unknown> {
    return JSON.parse(
        Buffer.from(token.split(".")[0]!, "base64url").toString("utf8"),
    );
}

try {
    // ---- Provider registration ---------------------------------------
    // `auth.options.socialProviders` carries the provider registrations
    // as passed to Better Auth — for a plain-object registration that IS
    // the provider options object.
    const providers = (
        auth as unknown as {
            options: {
                socialProviders?: Record<
                    string,
                    {
                        clientId?: unknown;
                        clientSecret?: unknown;
                        audience?: unknown;
                        appBundleIdentifier?: unknown;
                    }
                >;
            };
        }
    ).options.socialProviders;
    assert(providers, "socialProviders must be registered");
    const apple = providers.apple;
    assert(apple, "Apple provider must be registered with fixture envs set");
    assert(
        apple.clientId === FIXTURE_SERVICES_ID,
        `Apple clientId must be the Services ID, got ${String(apple.clientId)}`,
    );
    assert(
        JSON.stringify(apple.audience) ===
            JSON.stringify([FIXTURE_SERVICES_ID, "business.munch.app"]),
        `Apple audience must be [Services ID, bundle ID], got ${JSON.stringify(apple.audience)}`,
    );
    assert(
        apple.appBundleIdentifier === "business.munch.app",
        "Apple appBundleIdentifier must be the packaged app's bundle ID",
    );
    const secret = apple.clientSecret;
    assert(typeof secret === "string", "Apple client secret must be generated");
    assert(
        !secret.includes("PRIVATE KEY") && secret !== fixturePrivateKey,
        "The client secret must be a generated JWT, never the key material",
    );
    assert(
        decodeJwtHeader(secret).alg === "ES256" &&
            decodeJwtHeader(secret).kid === FIXTURE_KEY_ID,
        "Generated secret header must be ES256 with the fixture key ID",
    );
    const claims = decodeJwtClaims(secret);
    assert(
        claims.iss === FIXTURE_TEAM_ID &&
            claims.sub === FIXTURE_SERVICES_ID &&
            claims.aud === "https://appleid.apple.com" &&
            typeof claims.exp === "number" &&
            typeof claims.iat === "number" &&
            claims.exp > claims.iat &&
            claims.exp - claims.iat <= 15_777_000,
        `Generated secret claims are wrong: ${JSON.stringify(claims)}`,
    );

    // Google's ID-token audience list carries web + iOS (item: the iOS
    // client when it exists) and does not invent an Android entry.
    const google = providers.google;
    assert(google, "Google provider must still be registered");
    assert(
        JSON.stringify(google.clientId) ===
            JSON.stringify([FIXTURE_WEB_CLIENT_ID, FIXTURE_IOS_CLIENT_ID]),
        `Google audience list must be [web, iOS], got ${JSON.stringify(google.clientId)}`,
    );

    // ---- Sign-in initiation -------------------------------------------
    const initiation = await auth.handler(
        new Request("https://munch.example/api/auth/sign-in/social", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                origin: "https://munch.example",
            },
            body: JSON.stringify({
                provider: "apple",
                callbackURL: "/app",
                errorCallbackURL: "/connect/error",
            }),
        }),
    );
    const initiationText = await initiation.text();
    assert(
        initiation.status === 200,
        `Apple initiation failed: ${initiation.status} ${initiationText}`,
    );
    const initiationPayload = JSON.parse(initiationText) as {
        url?: unknown;
        redirect?: unknown;
    };
    assert(
        initiationPayload.redirect === true &&
            typeof initiationPayload.url === "string",
        `Apple initiation must return a redirect URL, got ${initiationText}`,
    );
    const authorize = new URL(initiationPayload.url);
    assert(
        authorize.hostname === "appleid.apple.com" &&
            authorize.pathname === "/auth/authorize",
        `Initiation URL is not Apple's authorize endpoint: ${authorize.origin}${authorize.pathname}`,
    );
    assert(
        authorize.searchParams.get("client_id") === FIXTURE_SERVICES_ID,
        "Authorize URL must carry the Services ID as client_id",
    );
    assert(
        authorize.searchParams.get("redirect_uri") ===
            "https://munch.example/api/auth/callback/apple",
        `Authorize URL redirect_uri mismatch: ${authorize.searchParams.get("redirect_uri")}`,
    );
    assert(
        authorize.searchParams.get("response_mode") === "form_post" &&
            (authorize.searchParams.get("response_type") ?? "").includes(
                "code",
            ) &&
            (authorize.searchParams.get("response_type") ?? "").includes(
                "id_token",
            ),
        "Authorize URL must use Apple's form_post code id_token flow",
    );

    // ---- Amendment I readiness: inventory + link flip ------------------
    const userId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const bearer = `smoke-${crypto.randomUUID()}`;
    const email = `apple-smoke-${crypto.randomUUID()}@example.test`;
    userIds.push(userId);
    await sql`
        insert into munch.users (id, email, name, email_verified, status)
        values (${userId}, ${email}, 'Apple smoke', true, 'active')
    `;
    await sql`
        insert into munch.auth_sessions (id, user_id, token, expires_at)
        values (${sessionId}, ${userId}, ${bearer}, now() + interval '1 hour')
    `;

    const methods = await listSignInMethods(userId, config);
    const appleMethod = methods.find((method) => method.id === "apple")!;
    assert(
        appleMethod.state === "not_linked" &&
            appleMethod.configured === true &&
            appleMethod.canLink === true,
        `With fixture envs, Apple must flip to linkable, got ${JSON.stringify(appleMethod)}`,
    );

    const app = new Hono();
    app.route("/", createSignInMethodsRouter());
    const link = await app.request(
        "https://munch.example/api/app/sign-in-methods/apple/link",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${bearer}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({ callbackURL: "/app/settings" }),
        },
    );
    const linkText = await link.text();
    assert(
        link.status === 200,
        `Apple link initiation must succeed once configured, got ${link.status} ${linkText}`,
    );
    const linkPayload = JSON.parse(linkText) as {
        url?: string;
        redirect?: boolean;
    };
    assert(
        linkPayload.redirect === true &&
            typeof linkPayload.url === "string" &&
            new URL(linkPayload.url).hostname === "appleid.apple.com",
        `Apple link must return Apple's consent URL, got ${linkText}`,
    );

    // ---- Google iOS config reporting -----------------------------------
    const mobileApp = new Hono();
    mobileApp.route("/", createMobileAuthRouter());
    const googleConfig = await mobileApp.request(
        "https://munch.example/mobile/auth/google-config",
    );
    assert(googleConfig.status === 200, "google-config must respond");
    const googleConfigBody = (await googleConfig.json()) as {
        platforms?: {
            ios?: { configured?: boolean; clientId?: string | null };
            android?: { configured?: boolean };
        };
    };
    assert(
        googleConfigBody.platforms?.ios?.configured === true &&
            googleConfigBody.platforms.ios.clientId === FIXTURE_IOS_CLIENT_ID &&
            googleConfigBody.platforms.android?.configured === false,
        `google-config must report iOS configured / Android not, got ${JSON.stringify(googleConfigBody)}`,
    );

    succeeded = true;
    console.log(
        "Apple sign-in smoke passed: partial env set refused; provider registered by fixture envs alone " +
            "with a generated ES256 client secret and the [Services ID, bundle ID] audience pair; " +
            "sign-in initiation returns Apple's form_post authorize URL; the Amendment I inventory flips " +
            "Apple to linkable and the link endpoint initiates; Google's audience list and google-config " +
            "report the iOS client.",
    );
} catch (error) {
    console.error("Apple sign-in smoke failed:", error);
} finally {
    for (const id of userIds) {
        await sql`delete from munch.users where id = ${id}`;
    }
    await sql.close();
    await closePlatformDatabase();
    process.exit(succeeded ? 0 : 1);
}
