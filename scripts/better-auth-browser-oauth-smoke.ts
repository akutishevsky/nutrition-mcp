#!/usr/bin/env bun

process.env.MUNCH_REVIEWER_SEED_MODE = "true";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for browser OAuth smoke test");
}

const { Hono } = await import("hono");
const { registerBetterAuthRoutes } = await import("../src/auth/routes.js");
const { registerDiscoveryRoutes } = await import("../src/discovery.js");
const { handleMcp } = await import("../src/mcp-runtime.js");
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
app.all(
    "/mcp",
    banRepeatAuthFailures,
    authenticateBearer,
    rateLimit,
    handleMcp,
);

// Better Auth's resource client validates JWTs through the configured JWKS URL.
// Route that same-origin fetch back through this in-memory Hono application so
// the smoke test exercises the production verifier without opening a listener.
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request =
        input instanceof Request ? input : new Request(input.toString(), init);
    if (new URL(request.url).origin === "https://munch.example") {
        return app.fetch(request);
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
};
if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Token exchange omitted access or refresh token");
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

console.log(
    `Better Auth browser authorization and MCP discovery passed with ${tools.length} tools.`,
);
process.exit(0);
