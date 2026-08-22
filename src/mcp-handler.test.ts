import { test, expect, describe, mock, afterAll } from "bun:test";
import * as actualSupabase from "./supabase.js";

// mock.module is process-wide (see mcp.test.ts) — spread the real module back
// in and restore it in afterAll so the other suites keep their real exports.
const profile: actualSupabase.Profile = {
    user_id: "u1",
    timezone: "Europe/Kyiv",
    preferred_weight_unit: null,
    widgets_enabled: true,
    alcohol_tracking_enabled: false,
    preferred_drink_unit: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
};
const seenUserIds: string[] = [];
mock.module("./supabase.js", () => ({
    ...actualSupabase,
    getProfile: async (userId: string) => {
        seenUserIds.push(userId);
        return profile;
    },
    getTimezone: async () => "Europe/Kyiv",
}));
afterAll(() => mock.module("./supabase.js", () => actualSupabase));

const { Hono } = await import("hono");
const { handleMcp } = await import("./mcp.js");
const { Client, StreamableHTTPClientTransport } =
    await import("@modelcontextprotocol/client");

// The production route minus auth: authenticateBearer's only output is the
// userId variable, which is what handleMcp hands to the server factory.
function appFor(userId: string) {
    const app = new Hono();
    app.all("/mcp", (c) => {
        c.set("userId", userId);
        c.set("accessToken", "tok");
        return handleMcp(c);
    });
    return app;
}

// Drive the real handler in-process: the URL is never dialled.
async function connect(
    userId: string,
    mode: "auto" | "legacy" | { pin: "2026-07-28" },
) {
    const app = appFor(userId);
    const transport = new StreamableHTTPClientTransport(
        new URL("http://test.local/mcp"),
        {
            fetch: async (url, init) =>
                app.request(new Request(String(url), init)),
        },
    );
    const client = new Client(
        { name: "t", version: "0" },
        { versionNegotiation: { mode } },
    );
    await client.connect(transport);
    return client;
}

describe("/mcp serves the 2026-07-28 revision", () => {
    test("a negotiating client lands on the modern era", async () => {
        const client = await connect("u1", "auto");
        expect(client.getProtocolEra()).toBe("modern");
        expect(client.getServerVersion()?.name).toBe("nutrition-mcp");
        await client.close();
    });

    test("list_changed is not advertised on either era — nothing could deliver it", async () => {
        for (const mode of ["legacy", { pin: "2026-07-28" }] as const) {
            const client = await connect("u1", mode);
            const caps = client.getServerCapabilities();
            expect(caps?.tools).toEqual({ listChanged: false });
            expect(caps?.resources).toEqual({ listChanged: false });
            await client.close();
        }
    });

    test("a pinned 2026-07-28 client connects without fallback", async () => {
        const client = await connect("u1", { pin: "2026-07-28" });
        expect(client.getProtocolEra()).toBe("modern");
        await client.close();
    });

    test("tools/list carries the MCP Apps links and output schemas", async () => {
        const client = await connect("u1", { pin: "2026-07-28" });
        const { tools } = await client.listTools();
        expect(tools.length).toBeGreaterThan(30);
        const logMeal = tools.find((t) => t.name === "log_meal");
        expect(logMeal?._meta?.ui).toEqual({
            resourceUri: "ui://widget/meal-logged.html",
        });
        expect(logMeal?.outputSchema?.type).toBe("object");
        await client.close();
    });

    test("tools/call returns content and widgets read as mcp-app HTML", async () => {
        const client = await connect("u1", { pin: "2026-07-28" });
        const r = await client.callTool({
            name: "get_timezone",
            arguments: {},
        });
        expect(r.isError).toBeFalsy();
        expect((r.content as { type: string }[])[0]?.type).toBe("text");
        const res = await client.readResource({
            uri: "ui://widget/meal-logged.html",
        });
        expect(res.contents[0]?.mimeType).toBe("text/html;profile=mcp-app");
        await client.close();
    });

    test("start_meal_import returns structuredContent the client validates", async () => {
        const client = await connect("u1", { pin: "2026-07-28" });
        const r = await client.callTool({
            name: "start_meal_import",
            arguments: {},
        });
        expect(r.isError).toBeFalsy();
        const sc = r.structuredContent as Record<string, unknown>;
        expect(sc.tz).toBe("Europe/Kyiv");
        expect(sc.import_tool_name).toBe("bulk_import_meals");
        await client.close();
    });

    test("input validation errors are in-band, not transport failures", async () => {
        const client = await connect("u1", { pin: "2026-07-28" });
        const r = await client.callTool({
            name: "log_meal",
            arguments: { description: "x", meal_type: "brunch" },
        });
        expect(r.isError).toBe(true);
        await client.close();
    });

    test("the server is built per request for the authenticated user", async () => {
        seenUserIds.length = 0;
        const a = await connect("user-a", { pin: "2026-07-28" });
        await a.listTools();
        await a.close();
        const b = await connect("user-b", { pin: "2026-07-28" });
        await b.listTools();
        await b.close();
        expect(seenUserIds).toContain("user-a");
        expect(seenUserIds).toContain("user-b");
    });
});

describe("/mcp still serves 2025-era clients unchanged", () => {
    test("a legacy client completes initialize and lists tools", async () => {
        const client = await connect("u1", "legacy");
        expect(client.getProtocolEra()).toBe("legacy");
        expect(client.getServerVersion()?.name).toBe("nutrition-mcp");
        expect(client.getServerCapabilities()?.tools).toBeDefined();
        const { tools } = await client.listTools();
        expect(tools.find((t) => t.name === "log_meal")?._meta?.ui).toEqual({
            resourceUri: "ui://widget/meal-logged.html",
        });
        await client.close();
    });

    test("legacy initialize issues no session id", async () => {
        const r = await appFor("u1").request("http://x/mcp", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                accept: "application/json, text/event-stream",
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "initialize",
                params: {
                    protocolVersion: "2025-11-25",
                    capabilities: {},
                    clientInfo: { name: "c", version: "0" },
                },
            }),
        });
        expect(r.status).toBe(200);
        expect(r.headers.get("mcp-session-id")).toBeNull();
    });
});

describe("/mcp transport posture", () => {
    test("GET and DELETE are refused with 405 and no SSE stream", async () => {
        for (const method of ["GET", "DELETE"]) {
            const r = await appFor("u1").request("http://x/mcp", { method });
            expect(r.status).toBe(405);
            expect(r.headers.get("allow")).toBe("POST");
        }
    });

    test("subscriptions/listen is refused without opening a stream", async () => {
        const envelope = {
            "io.modelcontextprotocol/protocolVersion": "2026-07-28",
            "io.modelcontextprotocol/clientCapabilities": {},
        };
        const r = await appFor("u1").request("http://x/mcp", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                accept: "application/json, text/event-stream",
                "mcp-protocol-version": "2026-07-28",
                "mcp-method": "subscriptions/listen",
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 7,
                method: "subscriptions/listen",
                params: { notifications: { tools: true }, _meta: envelope },
            }),
        });
        expect(r.headers.get("content-type")).not.toContain(
            "text/event-stream",
        );
        const body = (await r.json()) as { error?: { code: number } };
        expect(body.error?.code).toBe(-32601);
    });

    test("the icon URL follows the forwarding headers", async () => {
        const app = appFor("u1");
        const transport = new StreamableHTTPClientTransport(
            new URL("http://test.local/mcp"),
            {
                fetch: async (url, init) => {
                    const req = new Request(String(url), init);
                    req.headers.set("x-forwarded-proto", "https");
                    req.headers.set("x-forwarded-host", "nutrition-mcp.com");
                    return app.request(req);
                },
            },
        );
        const client = new Client(
            { name: "t", version: "0" },
            { versionNegotiation: { mode: { pin: "2026-07-28" } } },
        );
        await client.connect(transport);
        expect(client.getServerVersion()?.icons?.[0]?.src).toBe(
            "https://nutrition-mcp.com/favicon.ico",
        );
        await client.close();
    });
});
