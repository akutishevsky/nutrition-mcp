import { test, expect } from "bun:test";
import { Hono } from "hono";
import {
    BETTER_AUTH_ISSUER_PATH,
    MCP_PATH,
    registerDiscoveryRoutes,
    resourceMetadataUrl,
} from "./discovery.js";

const HOST = "munch.example";
const ORIGIN = `https://${HOST}`;

// Mirrors how src/index.ts wires discovery up. index.ts itself is never imported
// by tests — it boots a server and warms widgets on import.
function buildTestApp() {
    const app = new Hono();
    registerDiscoveryRoutes(app);
    return app;
}

// Production sits behind Railway's proxy, so getBaseUrl reads the forwarded
// headers rather than the request URL. Drive the routes the way the proxy does.
function fetchDiscovery(app: Hono, path: string) {
    return app.request(`http://localhost${path}`, {
        headers: { "x-forwarded-proto": "https", "x-forwarded-host": HOST },
    });
}

async function json(app: Hono, path: string): Promise<Record<string, unknown>> {
    const res = await fetchDiscovery(app, path);
    expect(res.status, `${path} should be served`).toBe(200);
    return (await res.json()) as Record<string, unknown>;
}

const PROTECTED_RESOURCE_PATHS = [
    "/.well-known/oauth-protected-resource/mcp",
    "/mcp/.well-known/oauth-protected-resource",
];
const AUTHORIZATION_SERVER_PATHS = [
    "/.well-known/oauth-authorization-server/mcp",
    "/mcp/.well-known/oauth-authorization-server",
];
const OPENID_COMPATIBILITY_PATHS = [
    "/.well-known/openid-configuration",
    "/.well-known/openid-configuration/mcp",
    "/mcp/.well-known/openid-configuration",
    `/.well-known/openid-configuration${BETTER_AUTH_ISSUER_PATH}`,
    `${BETTER_AUTH_ISSUER_PATH}/.well-known/openid-configuration`,
];

test("every discovery URL a client may derive from /mcp is served", async () => {
    const app = buildTestApp();
    for (const path of [
        "/.well-known/oauth-protected-resource",
        "/.well-known/oauth-authorization-server",
        ...PROTECTED_RESOURCE_PATHS,
        ...AUTHORIZATION_SERVER_PATHS,
        ...OPENID_COMPATIBILITY_PATHS,
    ]) {
        const res = await fetchDiscovery(app, path);
        expect(res.status, `${path} must not 404`).toBe(200);
        expect(res.headers.get("content-type")).toContain("application/json");
    }
});

test("protected-resource metadata echoes the identifier its URL was derived from", async () => {
    const app = buildTestApp();
    const root = await json(app, "/.well-known/oauth-protected-resource");
    expect(root.resource).toBe(ORIGIN);
    for (const path of PROTECTED_RESOURCE_PATHS) {
        const body = await json(app, path);
        expect(body.resource, `${path} identifies the MCP endpoint`).toBe(
            `${ORIGIN}${MCP_PATH}`,
        );
    }
});

test("protected-resource metadata always points at this origin as the auth server", async () => {
    const app = buildTestApp();
    for (const path of [
        "/.well-known/oauth-protected-resource",
        ...PROTECTED_RESOURCE_PATHS,
    ]) {
        const body = await json(app, path);
        expect(body.authorization_servers).toEqual([ORIGIN]);
    }
});

test("authorization-server metadata is identical on every route it is served from", async () => {
    const app = buildTestApp();
    const canonical = await json(
        app,
        "/.well-known/oauth-authorization-server",
    );
    expect(canonical.issuer).toBe(ORIGIN);
    expect(canonical.token_endpoint).toBe(`${ORIGIN}/token`);
    for (const path of [
        ...AUTHORIZATION_SERVER_PATHS,
        ...OPENID_COMPATIBILITY_PATHS,
    ]) {
        expect(
            await json(app, path),
            `${path} matches the canonical doc`,
        ).toEqual(canonical);
    }
});

test("the advertised resource_metadata URL serves a document naming /mcp", async () => {
    const app = buildTestApp();
    const advertised = resourceMetadataUrl(ORIGIN);
    expect(advertised.startsWith(ORIGIN)).toBe(true);
    const body = await json(app, advertised.slice(ORIGIN.length));
    expect(body.resource).toBe(`${ORIGIN}${MCP_PATH}`);
});

test("the authenticated /mcp route does not swallow its well-known aliases", async () => {
    const app = new Hono();
    registerDiscoveryRoutes(app);
    let mcpHits = 0;
    app.all(MCP_PATH, (c) => {
        mcpHits++;
        return c.json({ error: "unauthorized" }, 401);
    });
    for (const path of [
        `${MCP_PATH}/.well-known/oauth-protected-resource`,
        `${MCP_PATH}/.well-known/oauth-authorization-server`,
        `${MCP_PATH}/.well-known/openid-configuration`,
    ]) {
        const res = await fetchDiscovery(app, path);
        expect(
            res.status,
            `${path} is public metadata, not the MCP endpoint`,
        ).toBe(200);
    }
    expect(mcpHits, "no discovery request reached the MCP handler").toBe(0);
    expect((await fetchDiscovery(app, MCP_PATH)).status).toBe(401);
    expect(mcpHits).toBe(1);
});

test("discovery documents are built from the requesting host", async () => {
    const app = buildTestApp();
    const res = await app.request(
        "http://localhost:8080/.well-known/oauth-protected-resource/mcp",
        { headers: { host: "localhost:8080" } },
    );
    expect(await res.json()).toMatchObject({
        resource: "http://localhost:8080/mcp",
        authorization_servers: ["http://localhost:8080"],
    });
});
