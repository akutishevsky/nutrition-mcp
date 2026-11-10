#!/usr/bin/env bun

import { Pool } from "pg";
import { getMunchBetterAuth } from "../src/auth/auth.js";
import { recoverMissingChatGptOAuthClient } from "../src/auth/chatgpt-client-recovery.js";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
    throw new Error(
        "DATABASE_URL is required for Better Auth OAuth smoke test",
    );
}

function expectJsonArray(
    value: unknown,
    expected: string[],
    field: string,
): void {
    if (typeof value !== "string") {
        throw new Error(`${field} was not persisted as JSON text`);
    }
    const parsed = JSON.parse(value) as unknown;
    if (
        !Array.isArray(parsed) ||
        JSON.stringify(parsed) !== JSON.stringify(expected)
    ) {
        throw new Error(`${field} did not preserve the registered list`);
    }
}

const redirectUri = "https://client.example/callback";
const grantTypes = ["authorization_code", "refresh_token"];
const responseTypes = ["code"];
const auth = getMunchBetterAuth();
const database = new Pool({ connectionString: databaseUrl, max: 1 });
const recoveredClientId = `ChatGptRecoverySmoke${crypto.randomUUID().replaceAll("-", "")}`;
let registeredClientId: string | undefined;
let openidClientId: string | undefined;
let succeeded = false;

try {
    const response = await auth.handler(
        new Request("https://munch.example/api/auth/oauth2/register", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-forwarded-for": "127.0.0.1",
                "x-forwarded-proto": "https",
                "x-forwarded-host": "munch.example",
            },
            body: JSON.stringify({
                client_name: "Munch Better Auth smoke client",
                redirect_uris: [redirectUri],
                token_endpoint_auth_method: "none",
                grant_types: grantTypes,
                response_types: responseTypes,
            }),
        }),
    );

    const responseText = await response.text();
    if (response.status !== 200 && response.status !== 201) {
        throw new Error(
            `Better Auth dynamic registration failed: ${response.status} ${responseText}`,
        );
    }

    const registration = JSON.parse(responseText) as {
        client_id?: string;
        client_secret?: string;
        redirect_uris?: string[];
        token_endpoint_auth_method?: string;
    };
    registeredClientId = registration.client_id;
    if (!registeredClientId) {
        throw new Error("Dynamic registration returned no client_id");
    }
    if (registration.client_secret) {
        throw new Error("Public dynamic registration returned a client secret");
    }
    if (registration.token_endpoint_auth_method !== "none") {
        throw new Error("Dynamic registration did not preserve public auth");
    }
    if (
        JSON.stringify(registration.redirect_uris) !==
        JSON.stringify([redirectUri])
    ) {
        throw new Error(
            "Dynamic registration returned unexpected redirect_uris",
        );
    }

    const stored = await database.query<{
        scopes: string;
        redirectUris: string;
        grantTypes: string;
        responseTypes: string;
    }>(
        `select scopes,
                "redirectUris" as "redirectUris",
                "grantTypes" as "grantTypes",
                "responseTypes" as "responseTypes"
         from munch."oauthClient"
         where "clientId" = $1`,
        [registeredClientId],
    );
    const client = stored.rows[0];
    if (!client) throw new Error("Registered OAuth client was not persisted");

    expectJsonArray(
        client.scopes,
        ["nutrition.read", "nutrition.write", "offline_access"],
        "oauthClient.scopes",
    );
    expectJsonArray(
        client.redirectUris,
        [redirectUri],
        "oauthClient.redirectUris",
    );
    expectJsonArray(client.grantTypes, grantTypes, "oauthClient.grantTypes");
    expectJsonArray(
        client.responseTypes,
        responseTypes,
        "oauthClient.responseTypes",
    );

    // Regression (2026-11-10): connector frameworks such as Meta's hosted
    // custom-connector setup request the OIDC `openid` scope at dynamic
    // client registration. Registration must accept it alongside the
    // nutrition scopes instead of failing with invalid_scope
    // ("cannot request scope openid").
    const openidScope = "openid nutrition.read nutrition.write offline_access";
    const openidResponse = await auth.handler(
        new Request("https://munch.example/api/auth/oauth2/register", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-forwarded-for": "127.0.0.1",
                "x-forwarded-proto": "https",
                "x-forwarded-host": "munch.example",
            },
            body: JSON.stringify({
                client_name: "Munch Better Auth openid smoke client",
                redirect_uris: [redirectUri],
                token_endpoint_auth_method: "none",
                grant_types: grantTypes,
                response_types: responseTypes,
                scope: openidScope,
            }),
        }),
    );
    const openidResponseText = await openidResponse.text();
    if (openidResponse.status !== 200 && openidResponse.status !== 201) {
        throw new Error(
            `Dynamic registration with openid scope failed: ${openidResponse.status} ${openidResponseText}`,
        );
    }
    const openidRegistration = JSON.parse(openidResponseText) as {
        client_id?: string;
        scope?: string;
    };
    openidClientId = openidRegistration.client_id;
    if (!openidClientId) {
        throw new Error("Openid registration returned no client_id");
    }
    const grantedScopes = new Set(
        (openidRegistration.scope ?? "").split(" ").filter(Boolean),
    );
    for (const expected of openidScope.split(" ")) {
        if (!grantedScopes.has(expected)) {
            throw new Error(
                `Openid registration did not grant scope ${expected}: ${openidRegistration.scope}`,
            );
        }
    }
    const openidStored = await database.query<{ scopes: string }>(
        `select scopes from munch."oauthClient" where "clientId" = $1`,
        [openidClientId],
    );
    const storedScopes = openidStored.rows[0]?.scopes;
    if (typeof storedScopes !== "string") {
        throw new Error("Openid OAuth client was not persisted");
    }
    const storedScopeSet = new Set(JSON.parse(storedScopes) as string[]);
    if (
        storedScopeSet.size !== grantedScopes.size ||
        ![...grantedScopes].every((scope) => storedScopeSet.has(scope))
    ) {
        throw new Error(
            `Openid client scopes were not persisted: ${storedScopes}`,
        );
    }

    // Discovery must advertise openid in scopes_supported on the
    // authorization-server metadata the connector setup reads.
    const { Hono } = await import("hono");
    const { registerDiscoveryRoutes } = await import("../src/discovery.js");
    const discoveryApp = new Hono();
    registerDiscoveryRoutes(discoveryApp);
    const discoveryResponse = await discoveryApp.request(
        "http://localhost/.well-known/oauth-authorization-server/api/auth",
        {
            headers: {
                "x-forwarded-proto": "https",
                "x-forwarded-host": "munch.example",
            },
        },
    );
    if (discoveryResponse.status !== 200) {
        throw new Error(
            `Authorization-server discovery failed: ${discoveryResponse.status}`,
        );
    }
    const discovery = (await discoveryResponse.json()) as {
        scopes_supported?: string[];
    };
    if (!discovery.scopes_supported?.includes("openid")) {
        throw new Error(
            `Discovery scopes_supported omitted openid: ${JSON.stringify(discovery.scopes_supported)}`,
        );
    }

    const chatGptRedirect =
        "https://chatgpt.com/connector/oauth/munch-recovery-smoke";
    const authorizeUrl = new URL(
        "https://munch.example/api/auth/oauth2/authorize",
    );
    authorizeUrl.searchParams.set("client_id", recoveredClientId);
    authorizeUrl.searchParams.set("redirect_uri", chatGptRedirect);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set(
        "scope",
        "nutrition.read nutrition.write offline_access",
    );
    authorizeUrl.searchParams.set(
        "code_challenge",
        "abcdefghijklmnopqrstuvwxyzABCDEFGH0123456789-._~",
    );
    authorizeUrl.searchParams.set("code_challenge_method", "S256");
    authorizeUrl.searchParams.set("state", "recovery-smoke-state");

    const recoveryRequest = new Request(authorizeUrl);
    if (!(await recoverMissingChatGptOAuthClient(recoveryRequest))) {
        throw new Error("Missing ChatGPT OAuth client was not recovered");
    }

    const recovered = await database.query<{
        clientSecret: string | null;
        redirectUris: string;
        tokenEndpointAuthMethod: string | null;
        requirePKCE: boolean;
        public: boolean;
    }>(
        `select "clientSecret" as "clientSecret",
                "redirectUris" as "redirectUris",
                "tokenEndpointAuthMethod" as "tokenEndpointAuthMethod",
                "requirePKCE" as "requirePKCE",
                public
         from munch."oauthClient"
         where "clientId" = $1`,
        [recoveredClientId],
    );
    const recoveredClient = recovered.rows[0];
    if (!recoveredClient) {
        throw new Error("Recovered ChatGPT client was not persisted");
    }
    if (
        recoveredClient.clientSecret !== null ||
        recoveredClient.tokenEndpointAuthMethod !== "none" ||
        !recoveredClient.requirePKCE ||
        !recoveredClient.public
    ) {
        throw new Error("Recovered ChatGPT client is not a public PKCE client");
    }
    expectJsonArray(
        recoveredClient.redirectUris,
        [chatGptRedirect],
        "recovered oauthClient.redirectUris",
    );

    const authorizeResponse = await auth.handler(new Request(authorizeUrl));
    const authorizeLocation = authorizeResponse.headers.get("location") ?? "";
    if (authorizeLocation.includes("/api/auth/error")) {
        throw new Error(
            `Recovered client still failed authorization: ${authorizeLocation}`,
        );
    }
    if (authorizeResponse.status < 300 || authorizeResponse.status >= 400) {
        throw new Error(
            `Recovered client did not enter the OAuth browser flow: ${authorizeResponse.status}`,
        );
    }

    console.log(
        "Better Auth dynamic registration and ChatGPT client recovery passed.",
    );
    succeeded = true;
} finally {
    if (registeredClientId) {
        await database.query(
            `delete from munch."oauthClient" where "clientId" = $1`,
            [registeredClientId],
        );
    }
    if (openidClientId) {
        await database.query(
            `delete from munch."oauthClient" where "clientId" = $1`,
            [openidClientId],
        );
    }
    await database.query(
        `delete from munch."oauthClient" where "clientId" = $1`,
        [recoveredClientId],
    );
    await database.end();
    process.exit(succeeded ? 0 : 1);
}
