import type { Context, Hono } from "hono";
import { getBaseUrl } from "./url.js";

// The path component of this server's MCP endpoint. Discovery URLs are derived
// from it, so the two can never drift apart.
export const MCP_PATH = "/mcp";

// The canonical resource identifier clients authenticate against: the MCP
// endpoint *including* its path, not the bare origin. RFC 8707 §2 asks the
// client to send "the most specific URI that it can", and the MCP spec's
// canonical-server-URI rule says the same.
export function mcpResourceUrl(baseUrl: string): string {
    return `${baseUrl}${MCP_PATH}`;
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
        authorization_servers: [baseUrl],
        bearer_methods_supported: ["header"],
    };
}

// RFC 8414 authorization server metadata. Byte-identical on every route that
// serves it: the issuer is this origin with no path, so `issuer` must stay the
// bare origin or the RFC 8414 §3.3 issuer-match check fails and conformant
// clients discard the document.
export function authorizationServerMetadata(baseUrl: string) {
    return {
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/authorize`,
        token_endpoint: `${baseUrl}/token`,
        registration_endpoint: `${baseUrl}/register`,
        grant_types_supported: ["authorization_code", "refresh_token"],
        response_types_supported: ["code"],
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
//   /mcp/.well-known/<suffix>      path *appending* — spec-mandated only for
//                                  openid-configuration, but observed from
//                                  clients that hand-roll the OAuth suffix. A
//                                  tolerant alias; cheap, and it unsticks them.
//   /.well-known/<suffix>          the root fallback, kept for clients that
//                                  probe the origin. Unchanged.
//
// Deliberately NOT rate-limited (see #50, which scoped `rateLimitAuth` to the
// six OAuth paths): these are static JSON built from a request header, with no
// auth, no DB, and no per-caller state — nothing a limiter would protect. They
// are also the endpoints a stuck client hammers, and throttling discovery is a
// good way to keep it stuck.
export function registerDiscoveryRoutes(app: Hono): void {
    const protectedResource =
        (resource: (baseUrl: string) => string) => (c: Context) => {
            const baseUrl = getBaseUrl(c);
            return c.json(
                protectedResourceMetadata(baseUrl, resource(baseUrl)),
            );
        };
    const authorizationServer = (c: Context) =>
        c.json(authorizationServerMetadata(getBaseUrl(c)));

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
}
