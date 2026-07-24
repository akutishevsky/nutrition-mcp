import { test, expect } from "bun:test";
import { Hono } from "hono";
import {
    MCP_PATH,
    registerDiscoveryRoutes,
    resourceMetadataUrl,
} from "./discovery.js";

const HOST = "nutrition-mcp.com";
const ORIGIN = `https://${HOST}`;

// Mirrors how src/index.ts wires discovery up. index.ts itself is never imported
// by tests — it boots a server and warms widgets on import.
function buildTestApp() {
    const app = new Hono();
    registerDiscoveryRoutes(app);
    return app;
}

// Production sits behind DigitalOcean's proxy, so getBaseUrl reads the forwarded
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

// The bug from #51: the MCP endpoint is https://host/mcp — it has a path — but
// metadata was served only at the root, so clients folding that path into the
// discovery URL got a 404, retried every 30 minutes, and never authenticated.
// Each of these is a shape a real client was observed requesting.
const PROTECTED_RESOURCE_PATHS = [
    "/.well-known/oauth-protected-resource/mcp",
    "/mcp/.well-known/oauth-protected-resource",
];
const AUTHORIZATION_SERVER_PATHS = [
    "/.well-known/oauth-authorization-server/mcp",
    "/mcp/.well-known/oauth-authorization-server",
];

test("every discovery URL a client may derive from /mcp is served", async () => {
    const app = buildTestApp();
    for (const path of [
        "/.well-known/oauth-protected-resource",
        "/.well-known/oauth-authorization-server",
        ...PROTECTED_RESOURCE_PATHS,
        ...AUTHORIZATION_SERVER_PATHS,
    ]) {
        const res = await fetchDiscovery(app, path);
        expect(res.status, `${path} must not 404`).toBe(200);
    }
});

// RFC 9728 §3.3: the `resource` returned MUST be identical to the identifier the
// requested well-known URL was derived from. So the root and path-aware
// documents cannot share a body — returning the origin from the /mcp variant
// would make a strict client discard it, which is the same dead end as a 404.
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

// RFC 8414 §3.3: a client checks that `issuer` matches the authorization server
// it asked about. Our issuer is the bare origin, so the /mcp aliases must not
// "helpfully" append the path — every copy has to be byte-identical or the
// aliases get discarded by exactly the conformant clients they exist for.
test("authorization-server metadata is identical on every route it is served from", async () => {
    const app = buildTestApp();
    const canonical = await json(
        app,
        "/.well-known/oauth-authorization-server",
    );
    expect(canonical.issuer).toBe(ORIGIN);
    expect(canonical.token_endpoint).toBe(`${ORIGIN}/token`);

    for (const path of AUTHORIZATION_SERVER_PATHS) {
        expect(
            await json(app, path),
            `${path} matches the canonical doc`,
        ).toEqual(canonical);
    }
});

// The 401 challenge must advertise the path-aware document. RFC 9728 §3.3 says a
// document fetched from a `resource_metadata` pointer MUST carry a `resource`
// identical to the URL the client requested — that is /mcp, so pointing at the
// root document (resource: the bare origin) hands strict clients a document they
// are required to reject.
test("the advertised resource_metadata URL serves a document naming /mcp", async () => {
    const app = buildTestApp();
    const advertised = resourceMetadataUrl(ORIGIN);
    expect(advertised.startsWith(ORIGIN)).toBe(true);

    const body = await json(app, advertised.slice(ORIGIN.length));
    expect(body.resource).toBe(`${ORIGIN}${MCP_PATH}`);
});

// The /mcp/.well-known/* aliases live under the path of the *authenticated* MCP
// endpoint. If that route ever widened to a prefix match (or the aliases were
// registered after it), discovery would be swallowed by authenticateBearer and
// answer 401 — leaving a client unable to discover how to authenticate because
// it is not authenticated. Mirrors index.ts's registration order.
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
    ]) {
        const res = await fetchDiscovery(app, path);
        expect(
            res.status,
            `${path} is public metadata, not the MCP endpoint`,
        ).toBe(200);
    }
    expect(mcpHits, "no discovery request reached the MCP handler").toBe(0);

    // ...and the MCP endpoint itself is still routed.
    expect((await fetchDiscovery(app, MCP_PATH)).status).toBe(401);
    expect(mcpHits).toBe(1);
});

// getBaseUrl derives everything from the request, so a preview deployment or a
// local run must never emit nutrition-mcp.com URLs.
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
