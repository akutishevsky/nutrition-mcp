#!/usr/bin/env bun

process.env.MUNCH_REVIEWER_SEED_MODE = "true";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for browser OAuth smoke test");
}

const { Hono } = await import("hono");
const { registerBetterAuthRoutes } = await import("../src/auth/routes.js");

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

const app = new Hono();
registerBetterAuthRoutes(app);

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
            callbackURL: "/account/portal",
        }),
    },
);
if (!signIn.ok) {
    throw new Error(
        `Reviewer-mode sign-in failed: ${signIn.status} ${await signIn.text()}`,
    );
}
const cookie = cookieFrom(signIn);

const redirectUri = "https://client.example/callback";
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

const verifier = `v-${suffix}-${"x".repeat(48)}`;
const state = `state-${suffix}`;
const authorize = new URL("https://munch.example/api/auth/oauth2/authorize");
authorize.searchParams.set("response_type", "code");
authorize.searchParams.set("client_id", client.client_id);
authorize.searchParams.set("redirect_uri", redirectUri);
authorize.searchParams.set(
    "scope",
    "nutrition.read nutrition.write offline_access",
);
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

const oauthQuery = hiddenValue(consentHtml, "oauth_query");
const scope = hiddenValue(consentHtml, "scope");
const clientId = hiddenValue(consentHtml, "client_id");
const consent = await app.request("https://munch.example/connect/consent", {
    method: "POST",
    headers: {
        cookie,
        origin: "https://munch.example",
        "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
        client_id: clientId,
        scope,
        oauth_query: oauthQuery,
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
    }),
});
const tokenText = await token.text();
if (!token.ok) {
    throw new Error(`Token exchange failed: ${token.status} ${tokenText}`);
}
const tokens = JSON.parse(tokenText) as {
    access_token?: string;
    refresh_token?: string;
};
if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Token exchange omitted access or refresh token");
}

console.log(
    "Better Auth browser authorize, consent, and token exchange passed.",
);
process.exit(0);
