import { afterEach, beforeEach, expect, test } from "bun:test";
import {
    authorizationServerMetadata,
    protectedResourceMetadata,
} from "./discovery.js";

const ORIGIN = "https://munch.example";
let previousBackend: string | undefined;

beforeEach(() => {
    previousBackend = process.env.MUNCH_AUTH_BACKEND;
    process.env.MUNCH_AUTH_BACKEND = "better_auth";
});

afterEach(() => {
    if (previousBackend === undefined) {
        delete process.env.MUNCH_AUTH_BACKEND;
    } else {
        process.env.MUNCH_AUTH_BACKEND = previousBackend;
    }
});

test("Better Auth discovery advertises its path-qualified issuer", () => {
    expect(authorizationServerMetadata(ORIGIN)).toMatchObject({
        issuer: `${ORIGIN}/api/auth`,
        authorization_endpoint: `${ORIGIN}/api/auth/oauth2/authorize`,
        token_endpoint: `${ORIGIN}/api/auth/oauth2/token`,
        registration_endpoint: `${ORIGIN}/api/auth/oauth2/register`,
        revocation_endpoint: `${ORIGIN}/api/auth/oauth2/revoke`,
        introspection_endpoint: `${ORIGIN}/api/auth/oauth2/introspect`,
        jwks_uri: `${ORIGIN}/api/auth/jwks`,
        code_challenge_methods_supported: ["S256"],
    });
});

test("Better Auth protected-resource metadata identifies Munch scopes", () => {
    expect(protectedResourceMetadata(ORIGIN, `${ORIGIN}/mcp`)).toMatchObject({
        resource: `${ORIGIN}/mcp`,
        authorization_servers: [`${ORIGIN}/api/auth`],
        scopes_supported: [
            "nutrition.read",
            "nutrition.write",
            "offline_access",
        ],
    });
});
