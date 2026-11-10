import type { MunchCapabilities } from "./billing/capabilities.js";

/**
 * MCP access entitlement gate (Amendment D, Michael, 2026-11-09).
 *
 * MCP access is one of the three things Munch Premium covers — ad-free in
 * the app, the in-app AI chat agent, and MCP access — because a free MCP
 * would let savvy users bypass the ad-supported free tier entirely. The
 * website and the app stay free and fully featured for every account; only
 * the MCP channel is gated.
 *
 * Enforcement lives at the MCP transport layer (see handleMcp in
 * mcp-runtime.ts): every JSON-RPC request is checked against the caller's
 * CURRENT capabilities, resolved through the same source of truth as the
 * web side (resolveMunchCapabilitiesSafe → capabilitiesFromSubscription).
 * That closes the already-connected hole — a client that connected while
 * Premium and later lapses, or that connected before this gate existed, is
 * refused on its next gated request without any reconnect step. The OAuth
 * consent page is the connect-time half of the gate: it states the Premium
 * requirement plainly and offers no approval for a Free account, so no new
 * Free connection (and no new token) can be created either.
 *
 * Commerce boundary: this refusal explains the entitlement and routes the
 * user to the Munch website, where Premium is managed. It never initiates
 * checkout and carries no purchase mechanism — billing starts only on the
 * website, by the user's own action there.
 */
export const MCP_PREMIUM_REQUIRED_MESSAGE =
    "Munch MCP access is part of Munch Premium ($2.99/month), so this connection cannot use Munch tools on a Free account. The Munch website and app remain free and fully featured. Premium is managed on the Munch website — open https://munch.business and sign in with this same account to start Premium there, then reconnect. No purchase can be started from this MCP client.";

/** JSON-RPC server-error code used for entitlement refusals. */
export const MCP_PREMIUM_REQUIRED_CODE = -32001;

/**
 * JSON-RPC methods that stay open without Premium: the initialize
 * handshake (a client must be able to negotiate and surface the refusal
 * that follows), protocol pings, and fire-and-forget notifications, which
 * carry no Munch data and grant no access. Everything else — tools/list,
 * tools/call, resources, prompts — is MCP access and requires Premium.
 */
export function isMcpMethodEntitlementExempt(method: string): boolean {
    return (
        method === "initialize" ||
        method === "ping" ||
        method.startsWith("notifications/")
    );
}

export function mcpAccessAllowed(capabilities: MunchCapabilities): boolean {
    return capabilities.tier === "premium";
}

export interface McpEntitlementRefusal {
    status: 403;
    body: {
        jsonrpc: "2.0";
        id: unknown;
        error: { code: number; message: string };
    };
}

/**
 * Decide the refusal for one parsed JSON-RPC payload (a single request or
 * a batch). Returns null when the request may proceed: Premium account,
 * only exempt methods, or a payload that is not a JSON-RPC request at all
 * (the transport owns malformed-input handling).
 */
export function mcpEntitlementRefusal(
    capabilities: MunchCapabilities,
    payload: unknown,
): McpEntitlementRefusal | null {
    if (mcpAccessAllowed(capabilities)) return null;
    const requests = Array.isArray(payload) ? payload : [payload];
    let gatedId: unknown;
    let gated = false;
    for (const request of requests) {
        if (!request || typeof request !== "object") continue;
        const method = (request as { method?: unknown }).method;
        if (typeof method !== "string") continue;
        if (isMcpMethodEntitlementExempt(method)) continue;
        gated = true;
        gatedId = (request as { id?: unknown }).id ?? null;
        break;
    }
    if (!gated) return null;
    return {
        status: 403,
        body: {
            jsonrpc: "2.0",
            id: gatedId,
            error: {
                code: MCP_PREMIUM_REQUIRED_CODE,
                message: MCP_PREMIUM_REQUIRED_MESSAGE,
            },
        },
    };
}
