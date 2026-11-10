#!/usr/bin/env bun

/**
 * Google social sign-in initiation smoke (Amendment G).
 *
 * Proves the verified Better Auth route contract end to end at the HTTP
 * layer, against the migrated test database (initiation persists OAuth
 * state, so a database is required):
 *
 * - `POST /api/auth/sign-in/social` is the initiation contract; a GET on
 *   the same path is a 404 by design (the endpoint is POST-only).
 * - With the Google web client configured, initiation returns Google's
 *   consent URL carrying the production web client ID and the exact
 *   production callback `https://munch.business/api/auth/callback/google`.
 *
 * The client secret below is a placeholder: initiation never exchanges a
 * code, so the secret is never used. The client ID is the real production
 * web client ID — a public identifier, printed on every consent URL.
 */

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
    throw new Error(
        "DATABASE_URL is required for the Google sign-in smoke test",
    );
}

process.env.MUNCH_APP_BASE_URL = "https://munch.business";
process.env.MUNCH_GOOGLE_WEB_CLIENT_ID =
    "890658789419-chqidgpgcpn3sr25u1p3c7aj0anljo9l.apps.googleusercontent.com";
process.env.MUNCH_GOOGLE_CLIENT_SECRET =
    "smoke-placeholder-secret-never-exchanged";
delete process.env.MUNCH_GOOGLE_ANDROID_CLIENT_ID;

const { getMunchBetterAuth } = await import("../src/auth/auth.js");

const auth = getMunchBetterAuth();
let succeeded = false;

try {
    const getResponse = await auth.handler(
        new Request("https://munch.business/api/auth/sign-in/social", {
            method: "GET",
            headers: { origin: "https://munch.business" },
        }),
    );
    if (getResponse.status !== 404) {
        throw new Error(
            `GET /api/auth/sign-in/social should be 404 (POST-only contract), got ${getResponse.status}`,
        );
    }

    const response = await auth.handler(
        new Request("https://munch.business/api/auth/sign-in/social", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                origin: "https://munch.business",
            },
            body: JSON.stringify({
                provider: "google",
                callbackURL: "/app",
                errorCallbackURL: "/connect/error",
            }),
        }),
    );
    const responseText = await response.text();
    if (response.status !== 200) {
        throw new Error(
            `Google sign-in initiation failed: ${response.status} ${responseText}`,
        );
    }
    const payload = JSON.parse(responseText) as {
        url?: unknown;
        redirect?: unknown;
    };
    if (payload.redirect !== true || typeof payload.url !== "string") {
        throw new Error(
            `Initiation did not return a redirect URL: ${responseText}`,
        );
    }

    const consent = new URL(payload.url);
    if (
        consent.protocol !== "https:" ||
        consent.hostname !== "accounts.google.com"
    ) {
        throw new Error(`Consent URL is not Google's: ${consent.origin}`);
    }
    if (
        consent.searchParams.get("client_id") !==
        process.env.MUNCH_GOOGLE_WEB_CLIENT_ID
    ) {
        throw new Error(
            `Consent URL client_id mismatch: ${consent.searchParams.get("client_id")}`,
        );
    }
    if (
        consent.searchParams.get("redirect_uri") !==
        "https://munch.business/api/auth/callback/google"
    ) {
        throw new Error(
            `Consent URL redirect_uri mismatch: ${consent.searchParams.get("redirect_uri")}`,
        );
    }
    if (consent.searchParams.get("response_type") !== "code") {
        throw new Error("Consent URL is not an authorization-code request");
    }
    if (!consent.searchParams.get("scope")?.includes("openid")) {
        throw new Error("Consent URL does not request the openid scope");
    }

    console.log(
        "Google social sign-in initiation passed: POST-only contract, " +
            "consent URL carries the production web client ID and the " +
            "https://munch.business/api/auth/callback/google redirect.",
    );
    succeeded = true;
} finally {
    process.exit(succeeded ? 0 : 1);
}
