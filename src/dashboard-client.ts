// The web dashboard's identity constants, in a module with no imports so the
// OAuth store, the bearer middleware and the dashboard router can all read
// them without an import cycle (src/dashboard-auth.ts imports the middleware
// and the OAuth store, which both need these). Re-exported from
// src/dashboard-auth.ts, which is where callers should import them from.

// The dashboard signs a browser in by acting as an OAuth client of this
// server, exactly like the Apple Health sync pairing (HEALTH_SYNC_CLIENT_ID).
// Resolved in memory by withFirstPartyClients (src/oauth-store.ts); never a
// row in oauth_clients, and /token refuses it.
export const DASHBOARD_CLIENT_ID = "nutrition-mcp-dashboard";

// Every dashboard session cookie value starts with this. /mcp refuses a
// Bearer token carrying it before any lookup (src/middleware.ts).
export const DASHBOARD_SESSION_PREFIX = "nmds_";

// The one redirect the dashboard client may use, on the request's own base
// URL, byte for byte (redirectAllowed in src/oauth.ts).
export const DASHBOARD_CALLBACK_PATH = "/dashboard/callback";

export function dashboardCallbackUrl(baseUrl: string): string {
    return `${baseUrl}${DASHBOARD_CALLBACK_PATH}`;
}
