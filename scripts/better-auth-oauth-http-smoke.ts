#!/usr/bin/env bun

import { Pool } from "pg";
import { getMunchBetterAuth } from "../src/auth/auth.js";

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
    if (!registration.client_id) {
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
        [registration.client_id],
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

    await database.query(
        `delete from munch."oauthClient" where "clientId" = $1`,
        [registration.client_id],
    );
    console.log("Better Auth dynamic client registration passed.");
    succeeded = true;
} finally {
    await database.end();
    process.exit(succeeded ? 0 : 1);
}
