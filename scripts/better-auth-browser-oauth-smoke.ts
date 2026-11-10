#!/usr/bin/env bun

import {
    constants as cryptoConstants,
    createHash,
    createSign,
    generateKeyPairSync,
} from "node:crypto";

process.env.MUNCH_REVIEWER_SEED_MODE = "true";

// A fixture Google web client so the connect sign-in page renders its
// Google control and the provider round trip below can run end to end.
// The token and JWKS endpoints are stubbed at the fetch layer; the
// secret is never exchanged with a real Google endpoint.
process.env.MUNCH_GOOGLE_WEB_CLIENT_ID =
    "smoke-google-web.apps.googleusercontent.com";
process.env.MUNCH_GOOGLE_CLIENT_SECRET = "smoke-google-secret-never-exchanged";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for browser OAuth smoke test");
}

const { Hono } = await import("hono");
const { registerBetterAuthRoutes } = await import("../src/auth/routes.js");
const { registerDiscoveryRoutes } = await import("../src/discovery.js");
const { handleMcp } = await import("../src/mcp-runtime.js");
const { createAccountRouter } = await import("../src/accounts/routes.js");
const { authenticateBearer, banRepeatAuthFailures, rateLimit } =
    await import("../src/middleware.js");

function cookieFrom(response: Response): string {
    const cookie = response.headers.get("set-cookie")?.split(";", 1)[0];
    if (!cookie) throw new Error("Better Auth issued no session cookie");
    return cookie;
}

function decodeHtml(value: string): string {
    return value
        .replaceAll("&amp;", "&")
        .replaceAll("&quot;", '"')
        .replaceAll("&#39;", "'")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">");
}

function hiddenValue(html: string, name: string): string {
    const match = html.match(
        new RegExp(`name=["']${name}["'][^>]*value=["']([^"']*)["']`),
    );
    if (!match?.[1]) throw new Error(`Consent page omitted ${name}`);
    return decodeHtml(match[1]);
}

async function codeChallenge(verifier: string): Promise<string> {
    const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(verifier),
    );
    return Buffer.from(digest)
        .toString("base64")
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");
}

function decodeJwtPayload(token: string): Record<string, unknown> {
    const encoded = token.split(".")[1];
    if (!encoded) throw new Error("Resource-bound access token is not a JWT");
    return JSON.parse(
        Buffer.from(encoded, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
}

async function jsonRpcBody(
    response: Response,
): Promise<Record<string, unknown>> {
    const text = await response.text();
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/event-stream")) {
        const data = text
            .split(/\r?\n/)
            .filter((line) => line.startsWith("data:"))
            .map((line) => line.slice(5).trim())
            .find((line) => line.length > 0);
        if (!data)
            throw new Error(`MCP SSE response contained no data: ${text}`);
        return JSON.parse(data) as Record<string, unknown>;
    }
    return JSON.parse(text) as Record<string, unknown>;
}

const app = new Hono();
registerDiscoveryRoutes(app);
registerBetterAuthRoutes(app);
app.route("/", createAccountRouter());
app.all(
    "/mcp",
    banRepeatAuthFailures,
    authenticateBearer,
    rateLimit,
    handleMcp,
);

/**
 * A cookie jar for the browser journeys: each journey is a separate
 * browser profile that starts signed out and accumulates whatever the
 * responses set, exactly as a browser would carry them.
 */
class CookieJar {
    private readonly cookies = new Map<string, string>();

    absorb(response: Response): void {
        const headers = response.headers as Headers & {
            getSetCookie?: () => string[];
        };
        const entries =
            headers.getSetCookie?.() ??
            (headers.get("set-cookie") ? [headers.get("set-cookie")!] : []);
        for (const entry of entries) {
            const pair = entry.split(";", 1)[0]!;
            const separator = pair.indexOf("=");
            if (separator > 0) {
                this.cookies.set(
                    pair.slice(0, separator).trim(),
                    pair.slice(separator + 1).trim(),
                );
            }
        }
    }

    header(): string {
        return [...this.cookies.entries()]
            .map(([name, value]) => `${name}=${value}`)
            .join("; ");
    }
}

/** Top-level navigation headers, as a browser sends them. */
const browserNavHeaders = {
    accept: "text/html,application/xhtml+xml",
    "sec-fetch-mode": "navigate",
};

// The fixture Google identity: an RSA keypair standing in for Google's
// signing keys. The token endpoint stub mints ID tokens with it and the
// JWKS stub publishes the public half, so Better Auth's real Google
// provider verification runs unmodified against the fixture.
const googleKeyId = "smoke-google-key-1";
const googleKeyPair = generateKeyPairSync("rsa", { modulusLength: 2048 });
const googleJwk = {
    ...(googleKeyPair.publicKey.export({ format: "jwk" }) as Record<
        string,
        unknown
    >),
    kid: googleKeyId,
    alg: "RS256",
    use: "sig",
};
let googleProfileEmail = "";

function base64UrlJson(value: Record<string, unknown>): string {
    return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function googleIdToken(email: string): string {
    const now = Math.floor(Date.now() / 1000);
    const header = base64UrlJson({
        alg: "RS256",
        kid: googleKeyId,
        typ: "JWT",
    });
    const payload = base64UrlJson({
        iss: "https://accounts.google.com",
        aud: process.env.MUNCH_GOOGLE_WEB_CLIENT_ID,
        // One stable Google identity per profile email, as Google itself
        // keys accounts: reusing a single sub across journey emails would
        // sign every journey in as the first journey's user.
        sub: `smoke-${createHash("sha256").update(email).digest("hex").slice(0, 24)}`,
        email,
        email_verified: true,
        name: "Smoke Google User",
        iat: now - 10,
        exp: now + 3600,
    });
    const signer = createSign("RSA-SHA256");
    signer.update(`${header}.${payload}`);
    const signature = signer.sign({
        key: googleKeyPair.privateKey,
        padding: cryptoConstants.RSA_PKCS1_PADDING,
    });
    return `${header}.${payload}.${signature.toString("base64url")}`;
}

/** Magic-link emails "sent" during the journeys, captured at the Resend API. */
const capturedMagicLinks: { to: string; url: string }[] = [];

// Better Auth's resource client validates JWTs through the configured JWKS URL.
// Route that same-origin fetch back through this in-memory Hono application so
// the smoke test exercises the production verifier without opening a listener.
// The same interception stubs Google's token + JWKS endpoints and captures
// outgoing Resend email, so the first-time connect journeys below can run
// their full provider and email round trips without leaving the process.
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request =
        input instanceof Request ? input : new Request(input.toString(), init);
    const url = new URL(request.url);
    if (url.origin === "https://munch.example") {
        return app.fetch(request);
    }
    if (
        url.origin === "https://oauth2.googleapis.com" &&
        url.pathname === "/token"
    ) {
        return Response.json({
            access_token: "smoke-google-access-token",
            expires_in: 3600,
            token_type: "Bearer",
            scope: "openid email profile",
            id_token: googleIdToken(googleProfileEmail),
        });
    }
    if (
        url.origin === "https://www.googleapis.com" &&
        url.pathname === "/oauth2/v3/certs"
    ) {
        return Response.json({ keys: [googleJwk] });
    }
    if (url.origin === "https://api.resend.com") {
        const payload = (await request
            .clone()
            .json()
            .catch(() => null)) as {
            to?: string[];
            text?: string;
        } | null;
        const link = payload?.text
            ?.split("\n")
            .map((line) => line.trim())
            .find(
                (line) =>
                    line.startsWith("http") &&
                    line.includes("/connect/confirm?"),
            );
        if (link && payload?.to?.[0]) {
            capturedMagicLinks.push({ to: payload.to[0], url: link });
        }
        return Response.json({ id: "smoke-email-id" });
    }
    return originalFetch(input, init);
};

const suffix = crypto.randomUUID().replaceAll("-", "");
const email = `browser-oauth-${suffix}@example.test`;
const password = `Browser-${suffix}-Password!`;
const signup = await app.request(
    "https://munch.example/api/auth/sign-up/email",
    {
        method: "POST",
        headers: {
            "content-type": "application/json",
            origin: "https://munch.example",
        },
        body: JSON.stringify({
            name: "Browser OAuth smoke",
            email,
            password,
        }),
    },
);
if (!signup.ok) {
    throw new Error(
        `Reviewer-mode signup failed: ${signup.status} ${await signup.text()}`,
    );
}

const signIn = await app.request(
    "https://munch.example/api/auth/sign-in/email",
    {
        method: "POST",
        headers: {
            "content-type": "application/json",
            origin: "https://munch.example",
        },
        body: JSON.stringify({
            email,
            password,
            rememberMe: false,
            callbackURL: "/app",
        }),
    },
);
if (!signIn.ok) {
    throw new Error(
        `Reviewer-mode sign-in failed: ${signIn.status} ${await signIn.text()}`,
    );
}
const cookie = cookieFrom(signIn);

// Amendment D (2026-11-09): MCP access is a Premium entitlement, so this
// end-to-end OAuth + MCP flow needs a Premium fixture user. Grant the
// smoke user a short-lived reviewer premium override (the same mechanism
// reviewer accounts use) before it reaches consent; without it the
// consent page correctly refuses the connection and every MCP call 403s.
const signInBody = (await signIn.clone().json()) as {
    user?: { id?: string };
};
if (!signInBody.user?.id) {
    throw new Error("Sign-in returned no user id for the premium fixture");
}
const { grantPremiumOverride } = await import("../src/billing/override.js");
await grantPremiumOverride({
    userId: signInBody.user.id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    source: "reviewer",
    reason: "browser OAuth smoke premium fixture",
});

const redirectUri = "https://client.example/callback";
const resource = "https://munch.example/mcp";
// Connector frameworks (Meta's hosted custom-connector setup) register with
// the OIDC `openid` scope included; mirror that exact request here so the
// registration path that production connector setups hit stays covered.
const connectorScope = "openid nutrition.read nutrition.write offline_access";
const registration = await app.request(
    "https://munch.example/api/auth/oauth2/register",
    {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            client_name: "Munch browser OAuth smoke",
            redirect_uris: [redirectUri],
            token_endpoint_auth_method: "none",
            grant_types: ["authorization_code", "refresh_token"],
            response_types: ["code"],
            scope: connectorScope,
        }),
    },
);
if (!registration.ok) {
    throw new Error(
        `Dynamic registration failed: ${registration.status} ${await registration.text()}`,
    );
}
const client = (await registration.json()) as { client_id?: string };
if (!client.client_id) throw new Error("Registration returned no client_id");

// ---------------------------------------------------------------------------
// First-time connect journeys (regression coverage for the 2026-11-10
// defect). Everything above and below this block historically started
// from an established session, which is exactly why the defect shipped:
// a first-time, signed-out user who chose Google on the connect sign-in
// page landed on the retired "/account/portal" 404, because the page
// never recovered the authorization continuation from the authorize
// endpoint's raw redirect and its fallback landing was the dead path.
// These journeys start with NO session anywhere and walk the real
// detours: authorize → sign-in page → provider/email round trip →
// consent → code → token → MCP.
// ---------------------------------------------------------------------------

function journeyAuthorizeUrl(input: { state: string; challenge: string }): URL {
    const url = new URL("https://munch.example/api/auth/oauth2/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", client.client_id!);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", connectorScope);
    url.searchParams.set("resource", resource);
    url.searchParams.set("state", input.state);
    url.searchParams.set("code_challenge", input.challenge);
    url.searchParams.set("code_challenge_method", "S256");
    return url;
}

async function authorizeDetour(
    jar: CookieJar,
    authorizeUrl: URL,
): Promise<string> {
    const response = await app.request(authorizeUrl, {
        headers: { ...browserNavHeaders },
        redirect: "manual",
    });
    jar.absorb(response);
    if (response.status !== 302 && response.status !== 303) {
        throw new Error(
            `Unauthenticated authorize did not detour to sign-in: ${response.status} ${await response.text()}`,
        );
    }
    const location = response.headers.get("location") ?? "";
    if (!location.includes("/connect/sign-in")) {
        throw new Error(
            `Authorize detour went somewhere other than the sign-in page: ${location}`,
        );
    }
    if (location.includes("/account/portal")) {
        throw new Error(
            `Authorize detour referenced the retired portal landing: ${location}`,
        );
    }
    return location;
}

async function journeySessionUserId(jar: CookieJar): Promise<string> {
    const response = await app.request(
        "https://munch.example/api/auth/get-session",
        { headers: { cookie: jar.header() } },
    );
    if (!response.ok) {
        throw new Error(`Journey get-session failed: ${response.status}`);
    }
    const body = (await response.json()) as {
        user?: { id?: string };
    } | null;
    if (!body?.user?.id) {
        throw new Error("Journey get-session returned no user");
    }
    return body.user.id;
}

async function expectJourneyMcpInitialize(
    accessToken: string,
    journey: string,
): Promise<void> {
    const response = await app.request("https://munch.example/mcp", {
        method: "POST",
        headers: {
            authorization: `Bearer ${accessToken}`,
            accept: "application/json, text/event-stream",
            "content-type": "application/json",
            "mcp-protocol-version": "2025-06-18",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
                protocolVersion: "2025-06-18",
                capabilities: {},
                clientInfo: {
                    name: "Munch connect journey smoke",
                    version: "1.0.0",
                },
            },
        }),
    });
    if (!response.ok) {
        throw new Error(
            `${journey}: MCP initialize failed: ${response.status} ${await response.text()}`,
        );
    }
    const body = await jsonRpcBody(response);
    if (
        (body.result as { serverInfo?: { name?: string } } | undefined)
            ?.serverInfo?.name !== "Munch"
    ) {
        throw new Error(
            `${journey}: MCP initialize returned an unexpected server`,
        );
    }
}

/**
 * Walk from a consent-page arrival to an exchanged token set. A brand-new
 * journey account is Free, so its first consent arrival correctly meets
 * the Premium refusal; grant the fixture override (the accounts here are
 * the smoke's own) and reload, mirroring a user who activates Premium
 * and chooses Connect again.
 */
async function finishJourneyFromConsent(input: {
    jar: CookieJar;
    consentUrl: string;
    email: string;
    verifier: string;
    state: string;
    journey: string;
}): Promise<{ access_token: string }> {
    const loadConsent = async (): Promise<string> => {
        const page = await app.request(
            new URL(input.consentUrl, "https://munch.example"),
            {
                headers: {
                    ...browserNavHeaders,
                    cookie: input.jar.header(),
                },
                redirect: "manual",
            },
        );
        input.jar.absorb(page);
        if (page.status !== 200) {
            throw new Error(
                `${input.journey}: consent page failed: ${page.status} ${await page.text()}`,
            );
        }
        return page.text();
    };

    let consentHtml = await loadConsent();
    if (!consentHtml.includes('name="csrf_token"')) {
        if (!consentHtml.includes("MCP access is part of Premium")) {
            throw new Error(
                `${input.journey}: consent arrival was neither the approval form nor the Premium refusal`,
            );
        }
        await grantPremiumOverride({
            userId: await journeySessionUserId(input.jar),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            source: "reviewer",
            reason: `${input.journey} premium fixture`,
        });
        consentHtml = await loadConsent();
    }
    if (
        !consentHtml.includes("Connected Munch account") ||
        !consentHtml.includes(input.email)
    ) {
        throw new Error(
            `${input.journey}: consent page omitted the connected account identity`,
        );
    }

    const consent = await app.request("https://munch.example/connect/consent", {
        method: "POST",
        headers: {
            cookie: input.jar.header(),
            "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: hiddenValue(consentHtml, "client_id"),
            scope: hiddenValue(consentHtml, "scope"),
            oauth_query: hiddenValue(consentHtml, "oauth_query"),
            csrf_token: hiddenValue(consentHtml, "csrf_token"),
            decision: "approve",
        }),
        redirect: "manual",
    });
    input.jar.absorb(consent);
    if (consent.status !== 302 && consent.status !== 303) {
        throw new Error(
            `${input.journey}: consent failed: ${consent.status} ${await consent.text()}`,
        );
    }
    const callback = new URL(
        consent.headers.get("location") ?? "",
        redirectUri,
    );
    if (callback.origin + callback.pathname !== redirectUri) {
        throw new Error(
            `${input.journey}: consent redirected to an unexpected URL: ${callback}`,
        );
    }
    if (callback.searchParams.get("state") !== input.state) {
        throw new Error(`${input.journey}: consent did not preserve state`);
    }
    const code = callback.searchParams.get("code");
    if (!code) {
        throw new Error(`${input.journey}: consent returned no code`);
    }

    const tokenResponse = await app.request(
        "https://munch.example/api/auth/oauth2/token",
        {
            method: "POST",
            headers: {
                "content-type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: client.client_id!,
                redirect_uri: redirectUri,
                code,
                code_verifier: input.verifier,
                resource,
            }),
        },
    );
    const tokenText = await tokenResponse.text();
    if (!tokenResponse.ok) {
        throw new Error(
            `${input.journey}: token exchange failed: ${tokenResponse.status} ${tokenText}`,
        );
    }
    const tokens = JSON.parse(tokenText) as {
        access_token?: string;
        refresh_token?: string;
        id_token?: string;
    };
    if (!tokens.access_token || !tokens.refresh_token || !tokens.id_token) {
        throw new Error(
            `${input.journey}: token exchange omitted a token: ${tokenText}`,
        );
    }
    return { access_token: tokens.access_token };
}

// The retired portal landing itself must resolve to the signed-in home;
// flows (and already-sent emails) carried it as a return target for a
// long time, so the path redirects instead of answering 404.
const portalLanding = await app.request(
    "https://munch.example/account/portal",
    { redirect: "manual" },
);
if (
    portalLanding.status !== 302 ||
    portalLanding.headers.get("location") !== "/app"
) {
    throw new Error(
        `Retired portal landing did not redirect to the signed-in home: ${portalLanding.status} ${portalLanding.headers.get("location")}`,
    );
}

// --- Journey A: first-time Google connect, no session anywhere ---------
const googleJourneyEmail = `browser-google-${suffix}@example.test`;
googleProfileEmail = googleJourneyEmail;
const googleJar = new CookieJar();
const googleVerifier = `v-google-${suffix}-${"z".repeat(40)}`;
const googleState = `state-google-${suffix}`;
const googleSignInLocation = await authorizeDetour(
    googleJar,
    journeyAuthorizeUrl({
        state: googleState,
        challenge: await codeChallenge(googleVerifier),
    }),
);

const googleSignInPage = await app.request(
    new URL(googleSignInLocation, "https://munch.example"),
    {
        headers: { ...browserNavHeaders, cookie: googleJar.header() },
        redirect: "manual",
    },
);
googleJar.absorb(googleSignInPage);
if (googleSignInPage.status !== 200) {
    throw new Error(
        `Google journey: sign-in page failed: ${googleSignInPage.status}`,
    );
}
const googleSignInHtml = await googleSignInPage.text();
if (!googleSignInHtml.includes("Continue with Google")) {
    throw new Error("Google journey: sign-in page omitted the Google control");
}
// The regression pin: arriving via the authorize endpoint's raw redirect,
// the page must recover the signed continuation — in the email form's
// hidden field and in the Google initiation body alike. Before the fix
// both were empty and the callback fell back to the default landing.
if (!googleSignInHtml.includes('name="oauth_query"')) {
    throw new Error(
        "Google journey: sign-in page lost the authorize detour continuation",
    );
}
const detourOAuthQuery = hiddenValue(googleSignInHtml, "oauth_query");
if (
    !detourOAuthQuery.includes(`client_id=${client.client_id}`) ||
    !detourOAuthQuery.includes("sig=")
) {
    throw new Error(
        "Google journey: recovered continuation is not the signed authorize query",
    );
}
const socialBodyAttribute = googleSignInHtml.match(
    /data-social-body="([^"]*)"/,
)?.[1];
if (!socialBodyAttribute) {
    throw new Error("Google journey: sign-in page omitted the social body");
}
const socialBody = JSON.parse(decodeHtml(socialBodyAttribute)) as {
    provider?: string;
    callbackURL?: string;
    oauth_query?: string;
};
if (socialBody.provider !== "google") {
    throw new Error("Google journey: social body names the wrong provider");
}
if (socialBody.oauth_query !== detourOAuthQuery) {
    throw new Error(
        "Google journey: initiation body does not carry the detour continuation",
    );
}
if (socialBody.callbackURL !== "/app") {
    throw new Error(
        `Google journey: initiation fallback landing is not the signed-in home: ${socialBody.callbackURL}`,
    );
}

const socialResponse = await app.request(
    "https://munch.example/api/auth/sign-in/social",
    {
        method: "POST",
        headers: {
            "content-type": "application/json",
            origin: "https://munch.example",
            cookie: googleJar.header(),
        },
        body: JSON.stringify(socialBody),
    },
);
googleJar.absorb(socialResponse);
if (!socialResponse.ok) {
    throw new Error(
        `Google journey: social initiation failed: ${socialResponse.status} ${await socialResponse.text()}`,
    );
}
const socialPayload = (await socialResponse.json()) as { url?: string };
const googleConsentUrl = new URL(socialPayload.url ?? "");
if (googleConsentUrl.hostname !== "accounts.google.com") {
    throw new Error(
        `Google journey: initiation did not address Google: ${googleConsentUrl}`,
    );
}
const googleRoundTripState = googleConsentUrl.searchParams.get("state");
if (!googleRoundTripState) {
    throw new Error("Google journey: consent URL carries no state");
}

// The browser's return from the provider: Better Auth verifies the code
// against the stubbed token/JWKS endpoints, creates the session, and —
// because the initiation carried the continuation — the OAuth plugin
// resumes the authorization instead of dropping the browser on the
// initiation's fallback landing.
const googleCallback = await app.request(
    `https://munch.example/api/auth/callback/google?code=smoke-google-code&state=${encodeURIComponent(googleRoundTripState)}`,
    {
        headers: { ...browserNavHeaders, cookie: googleJar.header() },
        redirect: "manual",
    },
);
googleJar.absorb(googleCallback);
if (googleCallback.status !== 302 && googleCallback.status !== 303) {
    throw new Error(
        `Google journey: provider callback did not redirect: ${googleCallback.status} ${await googleCallback.text()}`,
    );
}
const googleConsentLocation = googleCallback.headers.get("location") ?? "";
if (!googleConsentLocation.includes("/connect/consent")) {
    throw new Error(
        `Google journey: provider callback landed on ${googleConsentLocation} instead of resuming to consent`,
    );
}
if (googleConsentLocation.includes("/account/portal")) {
    throw new Error(
        "Google journey: provider callback landed on the retired portal path",
    );
}
const googleTokens = await finishJourneyFromConsent({
    jar: googleJar,
    consentUrl: googleConsentLocation,
    email: googleJourneyEmail,
    verifier: googleVerifier,
    state: googleState,
    journey: "Google journey",
});
await expectJourneyMcpInitialize(googleTokens.access_token, "Google journey");

// --- Journey B: first-time magic-link connect, no session anywhere -----
const magicJourneyEmail = `browser-magic-${suffix}@example.test`;
const magicJar = new CookieJar();
const magicVerifier = `v-magic-${suffix}-${"w".repeat(41)}`;
const magicState = `state-magic-${suffix}`;
const magicSignInLocation = await authorizeDetour(
    magicJar,
    journeyAuthorizeUrl({
        state: magicState,
        challenge: await codeChallenge(magicVerifier),
    }),
);

const magicSignInPage = await app.request(
    new URL(magicSignInLocation, "https://munch.example"),
    {
        headers: { ...browserNavHeaders, cookie: magicJar.header() },
        redirect: "manual",
    },
);
magicJar.absorb(magicSignInPage);
if (magicSignInPage.status !== 200) {
    throw new Error(
        `Magic-link journey: sign-in page failed: ${magicSignInPage.status}`,
    );
}
const magicSignInHtml = await magicSignInPage.text();
if (!magicSignInHtml.includes('name="oauth_query"')) {
    throw new Error(
        "Magic-link journey: sign-in page lost the authorize detour continuation",
    );
}
const magicReturnTo = hiddenValue(magicSignInHtml, "return_to");
const magicOAuthQuery = hiddenValue(magicSignInHtml, "oauth_query");

const magicRequest = await app.request(
    "https://munch.example/connect/request",
    {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            origin: "https://munch.example",
            cookie: magicJar.header(),
        },
        body: new URLSearchParams({
            email: magicJourneyEmail,
            return_to: magicReturnTo,
            oauth_query: magicOAuthQuery,
        }),
    },
);
magicJar.absorb(magicRequest);
if (magicRequest.status !== 200) {
    throw new Error(
        `Magic-link journey: sign-in request failed: ${magicRequest.status} ${await magicRequest.text()}`,
    );
}
const capturedMagicLink = capturedMagicLinks.find(
    (entry) => entry.to === magicJourneyEmail,
);
if (!capturedMagicLink) {
    throw new Error("Magic-link journey: the sign-in email was not captured");
}

const magicConfirmPage = await app.request(capturedMagicLink.url, {
    headers: { ...browserNavHeaders, cookie: magicJar.header() },
    redirect: "manual",
});
magicJar.absorb(magicConfirmPage);
if (magicConfirmPage.status !== 200) {
    throw new Error(
        `Magic-link journey: confirm page failed: ${magicConfirmPage.status}`,
    );
}
const magicConfirmHtml = await magicConfirmPage.text();
const magicToken = hiddenValue(magicConfirmHtml, "token");
const magicConfirmReturnTo = hiddenValue(magicConfirmHtml, "return_to");
// The verified link's landing is the continuation carrier for the email
// round trip: it must address the consent page, not a plain landing.
if (!magicConfirmReturnTo.startsWith("/connect/consent")) {
    throw new Error(
        `Magic-link journey: verified-link landing is not the consent continuation: ${magicConfirmReturnTo}`,
    );
}

const magicConfirm = await app.request(
    "https://munch.example/connect/confirm",
    {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            origin: "https://munch.example",
            cookie: magicJar.header(),
        },
        body: new URLSearchParams({
            token: magicToken,
            return_to: magicConfirmReturnTo,
        }),
        redirect: "manual",
    },
);
magicJar.absorb(magicConfirm);
if (magicConfirm.status !== 302 && magicConfirm.status !== 303) {
    throw new Error(
        `Magic-link journey: confirm did not redirect: ${magicConfirm.status} ${await magicConfirm.text()}`,
    );
}
const magicConsentLocation = magicConfirm.headers.get("location") ?? "";
if (!magicConsentLocation.includes("/connect/consent")) {
    throw new Error(
        `Magic-link journey: verified sign-in landed on ${magicConsentLocation} instead of consent`,
    );
}
if (magicConsentLocation.includes("/account/portal")) {
    throw new Error(
        "Magic-link journey: verified sign-in landed on the retired portal path",
    );
}
const magicTokens = await finishJourneyFromConsent({
    jar: magicJar,
    consentUrl: magicConsentLocation,
    email: magicJourneyEmail,
    verifier: magicVerifier,
    state: magicState,
    journey: "Magic-link journey",
});
await expectJourneyMcpInitialize(
    magicTokens.access_token,
    "Magic-link journey",
);

const verifier = `v-${suffix}-${"x".repeat(48)}`;
const state = `state-${suffix}`;
const authorize = new URL("https://munch.example/api/auth/oauth2/authorize");
authorize.searchParams.set("response_type", "code");
authorize.searchParams.set("client_id", client.client_id);
authorize.searchParams.set("redirect_uri", redirectUri);
authorize.searchParams.set("scope", connectorScope);
authorize.searchParams.set("resource", resource);
authorize.searchParams.set("state", state);
authorize.searchParams.set("code_challenge", await codeChallenge(verifier));
authorize.searchParams.set("code_challenge_method", "S256");

const authorization = await app.request(authorize, {
    headers: { cookie },
    redirect: "manual",
});
if (authorization.status !== 302) {
    throw new Error(
        `Authorization did not redirect: ${authorization.status} ${await authorization.text()}`,
    );
}
const consentLocation = authorization.headers.get("location");
if (!consentLocation?.includes("/connect/consent")) {
    throw new Error(`Authorization did not reach consent: ${consentLocation}`);
}

const consentPage = await app.request(
    new URL(consentLocation, "https://munch.example"),
    { headers: { cookie } },
);
const consentHtml = await consentPage.text();
if (consentPage.status !== 200) {
    throw new Error(`Consent page failed: ${consentPage.status}`);
}
if (
    !consentHtml.includes("Connected Munch account") ||
    !consentHtml.includes(email)
) {
    throw new Error(
        "Consent page omitted the connected Munch account identity",
    );
}
if (
    !consentHtml.includes("<strong>openid</strong>") ||
    !consentHtml.includes("Confirm your identity with Munch")
) {
    throw new Error(
        "Consent page did not render the openid scope with its human-readable label",
    );
}

const oauthQuery = hiddenValue(consentHtml, "oauth_query");
const scope = hiddenValue(consentHtml, "scope");
const clientId = hiddenValue(consentHtml, "client_id");
const csrfToken = hiddenValue(consentHtml, "csrf_token");
const consent = await app.request("https://munch.example/connect/consent", {
    method: "POST",
    headers: {
        cookie,
        "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
        client_id: clientId,
        scope,
        oauth_query: oauthQuery,
        csrf_token: csrfToken,
        decision: "approve",
    }),
    redirect: "manual",
});
if (consent.status !== 302 && consent.status !== 303) {
    throw new Error(
        `Consent failed: ${consent.status} ${await consent.text()}`,
    );
}
const callbackLocation = consent.headers.get("location");
if (!callbackLocation) throw new Error("Consent returned no callback");
const callback = new URL(callbackLocation, redirectUri);
if (callback.origin + callback.pathname !== redirectUri) {
    throw new Error(`Consent redirected to unexpected URL: ${callback}`);
}
if (callback.searchParams.get("state") !== state) {
    throw new Error("Consent did not preserve OAuth state");
}
const code = callback.searchParams.get("code");
if (!code) throw new Error(`Consent returned no code: ${callback}`);

const token = await app.request("https://munch.example/api/auth/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: client.client_id,
        redirect_uri: redirectUri,
        code,
        code_verifier: verifier,
        resource,
    }),
});
const tokenText = await token.text();
if (!token.ok) {
    throw new Error(`Token exchange failed: ${token.status} ${tokenText}`);
}
const tokens = JSON.parse(tokenText) as {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
};
if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Token exchange omitted access or refresh token");
}
if (!tokens.id_token) {
    throw new Error(
        "Token exchange omitted the id_token for the granted openid scope",
    );
}
const idPayload = decodeJwtPayload(tokens.id_token);
if (idPayload.aud !== client.client_id) {
    throw new Error(`ID token has unexpected audience: ${idPayload.aud}`);
}
if (idPayload.iss !== "https://munch.example/api/auth") {
    throw new Error(`ID token has unexpected issuer: ${idPayload.iss}`);
}
if (tokens.access_token.split(".").length !== 3) {
    throw new Error(
        "MCP resource token was opaque instead of audience-bound JWT",
    );
}
const accessPayload = decodeJwtPayload(tokens.access_token);
const audiences = Array.isArray(accessPayload.aud)
    ? accessPayload.aud
    : [accessPayload.aud];
if (!audiences.includes(resource)) {
    throw new Error(
        `MCP access token has unexpected audience: ${accessPayload.aud}`,
    );
}
if (accessPayload.iss !== "https://munch.example/api/auth") {
    throw new Error(
        `MCP access token has unexpected issuer: ${accessPayload.iss}`,
    );
}
const grantedScopes = new Set(
    String(accessPayload.scope ?? "")
        .split(" ")
        .filter(Boolean),
);
for (const expected of connectorScope.split(" ")) {
    if (!grantedScopes.has(expected)) {
        throw new Error(
            `MCP access token omitted granted scope ${expected}: ${accessPayload.scope}`,
        );
    }
}

const mcpHeaders = {
    authorization: `Bearer ${tokens.access_token}`,
    accept: "application/json, text/event-stream",
    "content-type": "application/json",
    "mcp-protocol-version": "2025-06-18",
};
const initialize = await app.request("https://munch.example/mcp", {
    method: "POST",
    headers: mcpHeaders,
    body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
            protocolVersion: "2025-06-18",
            capabilities: {},
            clientInfo: {
                name: "Munch OAuth discovery smoke",
                version: "1.0.0",
            },
        },
    }),
});
if (!initialize.ok) {
    throw new Error(
        `Authenticated MCP initialize failed: ${initialize.status} ${await initialize.text()}`,
    );
}
const initializeBody = await jsonRpcBody(initialize);
if (
    (initializeBody.result as { serverInfo?: { name?: string } } | undefined)
        ?.serverInfo?.name !== "Munch"
) {
    throw new Error(
        `MCP initialize returned unexpected server: ${JSON.stringify(initializeBody)}`,
    );
}

const initialized = await app.request("https://munch.example/mcp", {
    method: "POST",
    headers: mcpHeaders,
    body: JSON.stringify({
        jsonrpc: "2.0",
        method: "notifications/initialized",
    }),
});
if (![200, 202, 204].includes(initialized.status)) {
    throw new Error(
        `MCP initialized notification failed: ${initialized.status} ${await initialized.text()}`,
    );
}

const toolsResponse = await app.request("https://munch.example/mcp", {
    method: "POST",
    headers: mcpHeaders,
    body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
    }),
});
if (!toolsResponse.ok) {
    throw new Error(
        `Authenticated MCP tools/list failed: ${toolsResponse.status} ${await toolsResponse.text()}`,
    );
}
const toolsBody = await jsonRpcBody(toolsResponse);
const tools = (toolsBody.result as { tools?: unknown[] } | undefined)?.tools;
if (!Array.isArray(tools) || tools.length === 0) {
    throw new Error(`MCP returned no tools: ${JSON.stringify(toolsBody)}`);
}
const toolNames = new Set<string>();
for (const candidate of tools) {
    const tool = candidate as {
        name?: unknown;
        description?: unknown;
        inputSchema?: unknown;
    };
    if (typeof tool.name !== "string" || tool.name.length === 0) {
        throw new Error(
            `MCP exposed a tool without a name: ${JSON.stringify(tool)}`,
        );
    }
    if (toolNames.has(tool.name)) {
        throw new Error(`MCP exposed duplicate tool name ${tool.name}`);
    }
    toolNames.add(tool.name);
    if (typeof tool.description !== "string" || tool.description.length === 0) {
        throw new Error(`MCP tool ${tool.name} has no description`);
    }
    if (
        typeof tool.inputSchema !== "object" ||
        tool.inputSchema === null ||
        (tool.inputSchema as { type?: unknown }).type !== "object"
    ) {
        throw new Error(`MCP tool ${tool.name} has an invalid input schema`);
    }
}
if (!toolNames.has("search_foods")) {
    throw new Error("MCP tool discovery omitted search_foods");
}
const requiredStableTools = [
    "search_recipes",
    "get_recipe",
    "save_recipe",
    "update_recipe",
    "delete_recipe",
    "log_recipe",
    "get_meal_plan",
    "get_grocery_list",
    "schedule_recipe",
    "add_grocery_items",
    "mark_grocery_item_purchased",
    "save_recipe_and_plan",
    "get_connection_status",
];
for (const requiredTool of requiredStableTools) {
    if (!toolNames.has(requiredTool)) {
        throw new Error(`MCP tool discovery omitted ${requiredTool}`);
    }
}

const rejected = await app.request("https://munch.example/mcp", {
    method: "POST",
    headers: {
        ...mcpHeaders,
        authorization: `${mcpHeaders.authorization}tampered`,
    },
    body: JSON.stringify({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/list",
        params: {},
    }),
});
if (rejected.status !== 401) {
    throw new Error(`Tampered MCP token was not rejected: ${rejected.status}`);
}
if (
    !rejected.headers
        .get("www-authenticate")
        ?.includes("oauth-protected-resource/mcp")
) {
    throw new Error("MCP 401 omitted path-aware protected-resource metadata");
}

// An openid-only grant must NOT unlock MCP data: the MCP bearer layer
// requires the nutrition.read scope, so a token whose only scope is openid
// is refused even though it is a genuine, correctly-signed Munch token.
const openidRegistration = await app.request(
    "https://munch.example/api/auth/oauth2/register",
    {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            client_name: "Munch browser OAuth openid-only smoke",
            redirect_uris: [redirectUri],
            token_endpoint_auth_method: "none",
            grant_types: ["authorization_code", "refresh_token"],
            response_types: ["code"],
            scope: "openid",
        }),
    },
);
if (!openidRegistration.ok) {
    throw new Error(
        `Openid-only registration failed: ${openidRegistration.status} ${await openidRegistration.text()}`,
    );
}
const openidClient = (await openidRegistration.json()) as {
    client_id?: string;
};
if (!openidClient.client_id) {
    throw new Error("Openid-only registration returned no client_id");
}

const openidVerifier = `v-openid-${suffix}-${"y".repeat(40)}`;
const openidState = `state-openid-${suffix}`;
const openidAuthorize = new URL(
    "https://munch.example/api/auth/oauth2/authorize",
);
openidAuthorize.searchParams.set("response_type", "code");
openidAuthorize.searchParams.set("client_id", openidClient.client_id);
openidAuthorize.searchParams.set("redirect_uri", redirectUri);
openidAuthorize.searchParams.set("scope", "openid");
openidAuthorize.searchParams.set("resource", resource);
openidAuthorize.searchParams.set("state", openidState);
openidAuthorize.searchParams.set(
    "code_challenge",
    await codeChallenge(openidVerifier),
);
openidAuthorize.searchParams.set("code_challenge_method", "S256");

const openidAuthorization = await app.request(openidAuthorize, {
    headers: { cookie },
    redirect: "manual",
});
if (openidAuthorization.status !== 302) {
    throw new Error(
        `Openid-only authorization did not redirect: ${openidAuthorization.status} ${await openidAuthorization.text()}`,
    );
}
const openidConsentLocation = openidAuthorization.headers.get("location");
if (!openidConsentLocation?.includes("/connect/consent")) {
    throw new Error(
        `Openid-only authorization did not reach consent: ${openidConsentLocation}`,
    );
}
const openidConsentPage = await app.request(
    new URL(openidConsentLocation, "https://munch.example"),
    { headers: { cookie } },
);
const openidConsentHtml = await openidConsentPage.text();
if (openidConsentPage.status !== 200) {
    throw new Error(
        `Openid-only consent page failed: ${openidConsentPage.status}`,
    );
}
const openidConsent = await app.request(
    "https://munch.example/connect/consent",
    {
        method: "POST",
        headers: {
            cookie,
            "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: hiddenValue(openidConsentHtml, "client_id"),
            scope: hiddenValue(openidConsentHtml, "scope"),
            oauth_query: hiddenValue(openidConsentHtml, "oauth_query"),
            csrf_token: hiddenValue(openidConsentHtml, "csrf_token"),
            decision: "approve",
        }),
        redirect: "manual",
    },
);
if (openidConsent.status !== 302 && openidConsent.status !== 303) {
    throw new Error(
        `Openid-only consent failed: ${openidConsent.status} ${await openidConsent.text()}`,
    );
}
const openidCallback = new URL(
    openidConsent.headers.get("location") ?? "",
    redirectUri,
);
const openidCode = openidCallback.searchParams.get("code");
if (!openidCode) {
    throw new Error(`Openid-only consent returned no code: ${openidCallback}`);
}
const openidToken = await app.request(
    "https://munch.example/api/auth/oauth2/token",
    {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: openidClient.client_id,
            redirect_uri: redirectUri,
            code: openidCode,
            code_verifier: openidVerifier,
            resource,
        }),
    },
);
const openidTokenText = await openidToken.text();
if (!openidToken.ok) {
    throw new Error(
        `Openid-only token exchange failed: ${openidToken.status} ${openidTokenText}`,
    );
}
const openidTokens = JSON.parse(openidTokenText) as {
    access_token?: string;
};
if (!openidTokens.access_token) {
    throw new Error("Openid-only token exchange omitted the access token");
}
const openidAccessPayload = decodeJwtPayload(openidTokens.access_token);
if (openidAccessPayload.scope !== "openid") {
    throw new Error(
        `Openid-only access token carried unexpected scope: ${openidAccessPayload.scope}`,
    );
}
const openidMcp = await app.request("https://munch.example/mcp", {
    method: "POST",
    headers: {
        ...mcpHeaders,
        authorization: `Bearer ${openidTokens.access_token}`,
    },
    body: JSON.stringify({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/list",
        params: {},
    }),
});
if (openidMcp.status !== 401) {
    throw new Error(
        `Openid-only token was not refused at the MCP layer: ${openidMcp.status} ${await openidMcp.text()}`,
    );
}

console.log(
    `Better Auth browser authorization and MCP discovery passed with ${tools.length} tools.`,
);
process.exit(0);
