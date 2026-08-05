import type { Context, Hono } from "hono";
import { betterAuthIsEnabled } from "./auth/config.js";
import { MUNCH_OAUTH_SCOPES } from "./auth/oauth-scopes.js";
import { getBaseUrl } from "./url.js";

// The path component of this server's MCP endpoint. Discovery URLs are derived
// from it, so the two can never drift apart.
export const MCP_PATH = "/mcp";
export const BETTER_AUTH_ISSUER_PATH = "/api/auth";

// The canonical resource identifier clients authenticate against: the MCP
// endpoint *including* its path, not the bare origin. RFC 8707 §2 asks the
// client to send "the most specific URI that it can", and the MCP spec's
// canonical-server-URI rule says the same.
export function mcpResourceUrl(baseUrl: string): string {
    return `${baseUrl}${MCP_PATH}`;
}

export function oauthIssuerUrl(baseUrl: string): string {
    return betterAuthIsEnabled()
        ? `${baseUrl}${BETTER_AUTH_ISSUER_PATH}`
        : baseUrl;
}

// The resource-metadata URL a 401 should advertise via WWW-Authenticate. This is
// the path-aware document, because RFC 9728 §3.3 requires the `resource` of a
// document fetched from a `resource_metadata` pointer to be *identical* to the
// URL the client requested — that is `https://host/mcp`, so the root document
// (whose `resource` is the bare origin) is one a strict client MUST reject.
export function resourceMetadataUrl(baseUrl: string): string {
    return `${baseUrl}/.well-known/oauth-protected-resource${MCP_PATH}`;
}

// RFC 9728 protected-resource metadata.
//
// `resource` is NOT a free choice: §3.3 requires it to equal the identifier the
// requested well-known URL was derived from, so the root document and the
// path-aware document must carry *different* values and cannot share a body.
export function protectedResourceMetadata(baseUrl: string, resource: string) {
    return {
        resource,
        authorization_servers: [oauthIssuerUrl(baseUrl)],
        bearer_methods_supported: ["header"],
        scopes_supported: betterAuthIsEnabled()
            ? [...MUNCH_OAUTH_SCOPES]
            : undefined,
        resource_name: "Munch nutrition MCP",
    };
}

// RFC 8414 authorization server metadata. The custom rollback issuer is the
// bare origin. Better Auth uses its mounted `/api/auth` path as the issuer.
export function authorizationServerMetadata(baseUrl: string) {
    if (betterAuthIsEnabled()) {
        const issuer = oauthIssuerUrl(baseUrl);
        return {
            issuer,
            authorization_endpoint: `${issuer}/oauth2/authorize`,
            token_endpoint: `${issuer}/oauth2/token`,
            registration_endpoint: `${issuer}/oauth2/register`,
            revocation_endpoint: `${issuer}/oauth2/revoke`,
            introspection_endpoint: `${issuer}/oauth2/introspect`,
            jwks_uri: `${baseUrl}/api/auth/jwks`,
            grant_types_supported: ["authorization_code", "refresh_token"],
            response_types_supported: ["code"],
            response_modes_supported: ["query"],
            code_challenge_methods_supported: ["S256"],
            token_endpoint_auth_methods_supported: [
                "none",
                "client_secret_basic",
                "client_secret_post",
            ],
            scopes_supported: [...MUNCH_OAUTH_SCOPES],
        };
    }

    return {
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/authorize`,
        token_endpoint: `${baseUrl}/token`,
        registration_endpoint: `${baseUrl}/register`,
        grant_types_supported: ["authorization_code", "refresh_token"],
        response_types_supported: ["code"],
        response_modes_supported: ["query"],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    };
}

// Every discovery URL we answer, and why.
//
// The MCP endpoint is `https://host/mcp` — it has a path — and the well-known
// conventions fold that path into the discovery URL. Serving metadata only at
// the root left real clients looping every 30 minutes on 404s and never
// authenticating (#51). The shapes:
//
//   .../.well-known/<suffix>/mcp   path *insertion* — RFC 8414 §3.1, RFC 9728
//                                  §3.1, and what the MCP spec and the TS SDK
//                                  actually request first.
//   /mcp/.well-known/<suffix>      path *appending* — observed from clients that
//                                  hand-roll the OAuth suffix. A tolerant alias;
//                                  cheap, and it unsticks them.
//   /.well-known/<suffix>          the root fallback, kept for clients that
//                                  probe the origin.
//
// Better Auth mounts its authorization server under `/api/auth`, so OAuth
// clients may also derive `/.well-known/oauth-authorization-server/api/auth`
// from the advertised issuer. Better Auth itself probes that URL and warns when
// it is absent. Serve both insertion and appending variants.
//
// ChatGPT also probes OpenID Connect discovery paths while negotiating an OAuth
// connector, even though Munch only relies on OAuth authorization semantics.
// Return the same endpoint metadata at those compatibility aliases so discovery
// cannot fail before dynamic client registration or tool listing begins.
//
// Deliberately NOT rate-limited: these are static JSON documents with no user
// data and are required to bootstrap OAuth before a client has credentials.
export function registerDiscoveryRoutes(app: Hono): void {
    const protectedResource =
        (resource: (baseUrl: string) => string) => (c: Context) => {
            const baseUrl = getBaseUrl(c);
            return c.json(
                protectedResourceMetadata(baseUrl, resource(baseUrl)),
                200,
                {
                    "Cache-Control":
                        "public, max-age=15, stale-while-revalidate=15, stale-if-error=86400",
                },
            );
        };
    const authorizationServer = (c: Context) =>
        c.json(authorizationServerMetadata(getBaseUrl(c)), 200, {
            "Cache-Control":
                "public, max-age=15, stale-while-revalidate=15, stale-if-error=86400",
        });

    app.get(
        "/.well-known/oauth-protected-resource",
        protectedResource((baseUrl) => baseUrl),
    );
    app.get(
        `/.well-known/oauth-protected-resource${MCP_PATH}`,
        protectedResource(mcpResourceUrl),
    );
    app.get(
        `${MCP_PATH}/.well-known/oauth-protected-resource`,
        protectedResource(mcpResourceUrl),
    );

    app.get("/.well-known/oauth-authorization-server", authorizationServer);
    app.get(
        `/.well-known/oauth-authorization-server${MCP_PATH}`,
        authorizationServer,
    );
    app.get(
        `${MCP_PATH}/.well-known/oauth-authorization-server`,
        authorizationServer,
    );
    app.get(
        `/.well-known/oauth-authorization-server${BETTER_AUTH_ISSUER_PATH}`,
        authorizationServer,
    );
    app.get(
        `${BETTER_AUTH_ISSUER_PATH}/.well-known/oauth-authorization-server`,
        authorizationServer,
    );

    app.get("/.well-known/openid-configuration", authorizationServer);
    app.get(
        `/.well-known/openid-configuration${MCP_PATH}`,
        authorizationServer,
    );
    app.get(
        `${MCP_PATH}/.well-known/openid-configuration`,
        authorizationServer,
    );
    app.get(
        `/.well-known/openid-configuration${BETTER_AUTH_ISSUER_PATH}`,
        authorizationServer,
    );
    app.get(
        `${BETTER_AUTH_ISSUER_PATH}/.well-known/openid-configuration`,
        authorizationServer,
    );
}
