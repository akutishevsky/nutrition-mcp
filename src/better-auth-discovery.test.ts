import { expect, test } from "bun:test";
import {
    authorizationServerMetadata,
    protectedResourceMetadata,
} from "./discovery.js";

const ORIGIN = "https://munch.example";

test("discovery advertises the canonical Better Auth issuer", () => {
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

test("protected-resource metadata identifies Munch scopes", () => {
    expect(protectedResourceMetadata(ORIGIN, `${ORIGIN}/mcp`)).toMatchObject({
        resource: `${ORIGIN}/mcp`,
        authorization_servers: [`${ORIGIN}/api/auth`],
        scopes_supported: [
            "openid",
            "nutrition.read",
            "nutrition.write",
            "offline_access",
        ],
    });
});

test("authorization-server discovery advertises the openid scope", () => {
    // Connector frameworks (Meta's custom-connector setup included) request
    // the OIDC `openid` scope at dynamic client registration; discovery must
    // advertise it or those registrations are rejected as invalid_scope.
    expect(authorizationServerMetadata(ORIGIN).scopes_supported).toEqual([
        "openid",
        "nutrition.read",
        "nutrition.write",
        "offline_access",
    ]);
});
