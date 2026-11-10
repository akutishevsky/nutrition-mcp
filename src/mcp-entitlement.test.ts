import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import {
    capabilitiesFromSubscription,
    type MunchCapabilityResolution,
} from "./billing/capabilities.js";
import {
    MCP_PREMIUM_REQUIRED_CODE,
    MCP_PREMIUM_REQUIRED_MESSAGE,
    isMcpMethodEntitlementExempt,
    mcpAccessAllowed,
    mcpEntitlementRefusal,
} from "./mcp-entitlement.js";
import { createHandleMcp } from "./mcp-runtime.js";

// Generic fixture identities only. Entitlements come from the real web-side
// source of truth (capabilitiesFromSubscription), never a hand-rolled tier.
const freeCapabilities = capabilitiesFromSubscription({ status: null });
const premiumCapabilities = capabilitiesFromSubscription({
    status: "active",
});

const toolCallPayload = {
    jsonrpc: "2.0",
    id: 7,
    method: "tools/call",
    params: { name: "get_connection_status", arguments: {} },
};

describe("MCP Premium entitlement gate (Amendment D)", () => {
    test("fixtures resolve to the expected tiers", () => {
        expect(freeCapabilities.tier).toBe("free");
        expect(premiumCapabilities.tier).toBe("premium");
        expect(mcpAccessAllowed(freeCapabilities)).toBe(false);
        expect(mcpAccessAllowed(premiumCapabilities)).toBe(true);
    });

    test("(a) a Free entitlement is refused a tool call with the Premium explanation", () => {
        const refusal = mcpEntitlementRefusal(
            freeCapabilities,
            toolCallPayload,
        );
        expect(refusal).not.toBeNull();
        expect(refusal!.status).toBe(403);
        expect(refusal!.body.jsonrpc).toBe("2.0");
        expect(refusal!.body.id).toBe(7);
        expect(refusal!.body.error.code).toBe(MCP_PREMIUM_REQUIRED_CODE);
        expect(refusal!.body.error.message).toContain("Premium");
        expect(refusal!.body.error.message).toContain("$2.99/month");
        expect(refusal!.body.error.message).toContain("https://munch.business");
        // The refusal routes to the website; it initiates no purchase.
        expect(refusal!.body.error.message).not.toContain("checkout");
    });

    test("(a) a Free entitlement is also refused tools/list and batched calls", () => {
        expect(
            mcpEntitlementRefusal(freeCapabilities, {
                jsonrpc: "2.0",
                id: 1,
                method: "tools/list",
                params: {},
            }),
        ).not.toBeNull();
        expect(
            mcpEntitlementRefusal(freeCapabilities, [
                {
                    jsonrpc: "2.0",
                    id: 2,
                    method: "initialize",
                    params: {},
                },
                toolCallPayload,
            ]),
        ).not.toBeNull();
    });

    test("the initialize handshake, ping, and notifications stay open so a client can surface the refusal", () => {
        expect(isMcpMethodEntitlementExempt("initialize")).toBe(true);
        expect(isMcpMethodEntitlementExempt("ping")).toBe(true);
        expect(isMcpMethodEntitlementExempt("notifications/initialized")).toBe(
            true,
        );
        expect(isMcpMethodEntitlementExempt("tools/call")).toBe(false);
        expect(
            mcpEntitlementRefusal(freeCapabilities, {
                jsonrpc: "2.0",
                id: 3,
                method: "initialize",
                params: {},
            }),
        ).toBeNull();
    });

    test("(b) a Premium entitlement passes the gate for tool calls", () => {
        expect(
            mcpEntitlementRefusal(premiumCapabilities, toolCallPayload),
        ).toBeNull();
        expect(
            mcpEntitlementRefusal(premiumCapabilities, {
                jsonrpc: "2.0",
                id: 1,
                method: "tools/list",
                params: {},
            }),
        ).toBeNull();
    });

    test("the refusal message states the model plainly", () => {
        expect(MCP_PREMIUM_REQUIRED_MESSAGE).toContain(
            "MCP access is part of Munch Premium",
        );
        expect(MCP_PREMIUM_REQUIRED_MESSAGE).toContain(
            "website and app remain free",
        );
    });
});

function mcpApp(capabilities: typeof freeCapabilities) {
    const app = new Hono();
    app.use("*", async (c, next) => {
        c.set("userId", "fixture-user");
        await next();
    });
    app.post(
        "/mcp",
        createHandleMcp({
            resolveCapabilities:
                async (): Promise<MunchCapabilityResolution> => ({
                    capabilities,
                    status: "resolved",
                }),
        }),
    );
    return app;
}

function mcpRequest(payload: unknown): Request {
    return new Request("http://munch.test/mcp", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            accept: "application/json, text/event-stream",
        },
        body: JSON.stringify(payload),
    });
}

describe("handleMcp entitlement enforcement", () => {
    test("(a) a Free user's tool call is refused over HTTP with the Premium explanation", async () => {
        const response = await mcpApp(freeCapabilities).request(
            mcpRequest(toolCallPayload),
        );
        expect(response.status).toBe(403);
        const body = (await response.json()) as {
            error: { code: number; message: string };
        };
        expect(body.error.code).toBe(MCP_PREMIUM_REQUIRED_CODE);
        expect(body.error.message).toContain("Premium");
        expect(body.error.message).toContain("$2.99/month");
    });

    test("(b) a Premium user's tools/list passes the gate and returns the catalog", async () => {
        const response = await mcpApp(premiumCapabilities).request(
            mcpRequest({
                jsonrpc: "2.0",
                id: 11,
                method: "tools/list",
                params: {},
            }),
        );
        expect(response.status).toBe(200);
        const text = await response.text();
        expect(text).toContain('"tools"');
        expect(text).toContain("get_connection_status");
    });
});

describe("OAuth consent Premium statement", () => {
    test("(c) the consent experience carries the Premium statement and the entitlement check", async () => {
        const source = await Bun.file(
            new URL("./auth/connect-routes.ts", import.meta.url),
        ).text();
        expect(source).toContain("MCP access is part of Premium");
        expect(source).toContain("MCP access is part of Munch Premium");
        expect(source).toContain("this connection cannot be approved");
        expect(source).toContain("resolveMunchCapabilitiesSafe");
        // Consent explains and routes; it never starts a purchase.
        expect(source).not.toContain("createCheckoutForUser");
        expect(source).not.toContain("checkout-service");
    });

    test("(c2) the consent screen carries the Editorial Serif house theme (Amendment F)", async () => {
        const source = await Bun.file(
            new URL("./auth/connect-routes.ts", import.meta.url),
        ).text();
        // Before Amendment F the connect shell loaded public/styles.css —
        // the flagship flow's one unthemed stop. It now loads the same
        // editorial.css as the homepage and /connect (PR #181 mechanism).
        expect(source).toContain(
            '<link rel="stylesheet" href="/editorial.css">',
        );
        expect(source).not.toContain(
            '<link rel="stylesheet" href="/styles.css">',
        );
        const editorial = await Bun.file(
            new URL("../public/editorial.css", import.meta.url),
        ).text();
        for (const selector of [
            ".auth-card",
            ".consent-account",
            ".consent-scope-list",
            ".consent-actions",
        ]) {
            expect(editorial).toContain(selector);
        }
        expect(editorial).toContain("--paper: #f6f1e7");
        expect(editorial).toContain("--serif: Georgia");
    });
});
