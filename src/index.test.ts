import { test, expect, describe, afterEach } from "bun:test";

// index.ts calls createOAuthRouter() at module scope, and that throws when the
// OAuth env is unset (src/oauth.ts). Bun auto-loads .env, so a static import
// here passes on a dev machine and fails on CI, which has no .env — that is
// exactly how this file first went red on Linux while green on macOS.
//
// The defaults have to be set BEFORE index.js is evaluated, and a static import
// would hoist above these lines, so the import is dynamic. Same values as
// src/oauth.test.ts, and ||= so a real .env still wins.
process.env.OAUTH_CLIENT_ID ||= "test-client-id";
process.env.OAUTH_CLIENT_SECRET ||= "test-client-secret";

const { app, setShuttingDownForTest } = await import("./index.js");

// The shutdown gate (src/index.ts) exists because closing the MCP handler while
// Bun.serve keeps accepting turns every in-flight POST /mcp into a 500 that a
// connector reads as a tool failure. The fix is only worth anything if the gate
// sits in the right place in the middleware chain: AFTER cors (so a browser
// client sees the 503 instead of an opaque CORS error) and BEFORE
// authenticateBearer and the /mcp route (so it answers without doing work).
//
// Position is not something a unit test of the middleware in isolation can
// check, so these drive the real `app` — importing it is side-effect free
// because the boot block is guarded on import.meta.main.
//
// Every assertion below is about ORDER. If someone later moves the gate under
// app.route("/", createOAuthRouter()) or under the /mcp chain, the responses
// change from 503 to 401/200 and these fail.

afterEach(() => {
    setShuttingDownForTest(false);
});

describe("the shutdown gate", () => {
    test("is inert until shutdown begins", async () => {
        // Baseline: without the flag, /mcp reaches authenticateBearer and is
        // rejected for the missing token. This is what proves the 503s below
        // come from the gate and not from something else refusing the request.
        const r = await app.request("http://x/mcp", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
        });
        expect(r.status).toBe(401);
    });

    test("runs before authenticateBearer on /mcp", async () => {
        setShuttingDownForTest(true);
        const r = await app.request("http://x/mcp", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
        });
        // 503 rather than the 401 the same request gets above: the gate got
        // there first. A gate registered after the /mcp chain would 401.
        expect(r.status).toBe(503);
        expect(r.headers.get("Retry-After")).toBe("1");
    });

    test("answers /mcp in the JSON-RPC envelope a client can surface", async () => {
        setShuttingDownForTest(true);
        const r = await app.request("http://x/mcp", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
        });
        const body = (await r.json()) as {
            jsonrpc?: string;
            id?: unknown;
            error?: { code?: number; message?: string };
        };
        // The flat {"error": …} shape used elsewhere in index.ts is not
        // something an MCP client can surface — it reports a bare transport
        // failure with no reason.
        expect(body.jsonrpc).toBe("2.0");
        expect(body.id).toBeNull();
        expect(body.error?.code).toBe(-32000);
        expect(body.error?.message).toContain("shutting down");
    });

    test("runs before the OAuth router and the landing page", async () => {
        setShuttingDownForTest(true);
        for (const path of ["/", "/authorize", "/api/stats"]) {
            const r = await app.request(`http://x${path}`);
            expect({ path, status: r.status }).toEqual({ path, status: 503 });
            expect(r.headers.get("Retry-After")).toBe("1");
            expect(await r.json()).toEqual({ error: "shutting_down" });
        }
    });

    test("gates /health too, so the load balancer stops routing here", async () => {
        setShuttingDownForTest(true);
        const r = await app.request("http://x/health");
        // Deliberate: a health check that starts failing is how the platform
        // learns to drain this instance. If someone exempts /health to keep it
        // "green", the drain stops working and this test should stop them.
        expect(r.status).toBe(503);
    });

    test("sits after cors, so the refusal still carries Allow-Origin", async () => {
        setShuttingDownForTest(true);
        const r = await app.request("http://x/mcp", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                Origin: "http://localhost:3000",
            },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
        });
        expect(r.status).toBe(503);
        // Without this a browser client sees an opaque CORS error rather than
        // the reason it was refused.
        expect(r.headers.get("Access-Control-Allow-Origin")).toBe(
            "http://localhost:3000",
        );
    });

    test("lets cors answer preflights itself, gate or no gate", async () => {
        setShuttingDownForTest(true);
        const r = await app.request("http://x/mcp", {
            method: "OPTIONS",
            headers: {
                Origin: "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Mcp-Param-Foo",
            },
        });
        // cors() short-circuits OPTIONS without calling next(), so a preflight
        // never reaches the gate. This is what keeps the browser's preflight
        // from failing during a drain.
        expect(r.status).toBe(204);
    });
});

describe("CORS allow-headers", () => {
    test("reflects the requested headers, covering the Mcp-Param-* family", async () => {
        // A static allowHeaders list cannot cover Mcp-Param-*, which is
        // open-ended by protocol. Reflection is safe here only because `origin`
        // is a strict allowlist and credentials is false — if someone adds
        // credentials:true, that pairing becomes unsafe and this test's comment
        // is the warning.
        const r = await app.request("http://x/mcp", {
            method: "OPTIONS",
            headers: {
                Origin: "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers":
                    "Mcp-Param-Foo, Mcp-Method, Authorization",
            },
        });
        expect(r.status).toBe(204);
        expect(r.headers.get("Access-Control-Allow-Headers")).toBe(
            "Mcp-Param-Foo,Mcp-Method,Authorization",
        );
    });

    test("refuses an origin outside the allowlist", async () => {
        const r = await app.request("http://x/mcp", {
            method: "OPTIONS",
            headers: {
                Origin: "https://evil.example",
                "Access-Control-Request-Method": "POST",
            },
        });
        expect(r.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
});

describe("GET /api/patreon-posts", () => {
    test("returns [] when Patreon credentials are not configured", async () => {
        const saved = {
            id: process.env.PATREON_CLIENT_ID,
            secret: process.env.PATREON_CLIENT_SECRET,
            campaign: process.env.PATREON_CAMPAIGN_ID,
        };
        delete process.env.PATREON_CLIENT_ID;
        delete process.env.PATREON_CLIENT_SECRET;
        delete process.env.PATREON_CAMPAIGN_ID;
        try {
            const r = await app.request("http://x/api/patreon-posts");
            expect(r.status).toBe(200);
            expect(await r.json()).toEqual([]);
        } finally {
            if (saved.id !== undefined)
                process.env.PATREON_CLIENT_ID = saved.id;
            if (saved.secret !== undefined)
                process.env.PATREON_CLIENT_SECRET = saved.secret;
            if (saved.campaign !== undefined)
                process.env.PATREON_CAMPAIGN_ID = saved.campaign;
        }
    });
});

// dev.nutrition-mcp.com runs this same image and serves a byte-for-byte copy of
// the public site. Nothing about that is visible in normal development, so the
// three layers that keep it out of search results are easy to drop by accident
// -- and the failure is silent until the staging hostname starts appearing in
// search results next to the real one.
describe("staging is never indexable", () => {
    afterEach(() => {
        delete process.env.APP_ENV;
    });

    test("production sends no robots header and the real robots.txt", async () => {
        const header = await app.request("http://x/health");
        expect(header.headers.get("X-Robots-Tag")).toBeNull();

        const robots = await app.request("http://x/robots.txt");
        expect(await robots.text()).toContain("Allow: /");
    });

    test("staging sends noindex on every response", async () => {
        process.env.APP_ENV = "staging";
        const r = await app.request("http://x/health");
        expect(r.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    });

    test("staging serves a disallow-all robots.txt", async () => {
        process.env.APP_ENV = "staging";
        const r = await app.request("http://x/robots.txt");
        const body = await r.text();
        expect(body).toContain("Disallow: /");
        expect(body).not.toContain("Allow: /");
    });

    // The generated pages are the build-time half: APP_ENV is read when
    // site-partials.ts is evaluated, which happens once per `bun run gen:all`
    // inside the Docker build. A subprocess is the only way to observe that
    // from here, since the module is already loaded with the ambient value.
    test("a staging build drops both analytics tags from every page", () => {
        const probe =
            'const m = await import("./scripts/site-partials.ts");' +
            "console.log(JSON.stringify({" +
            '  ga: m.HEAD_ASSETS.includes("G-1K4HRB2R8X"),' +
            '  clarity: m.HEAD_ASSETS.includes("clarity"),' +
            '  noindex: m.HEAD_ASSETS.includes("noindex"),' +
            "}));";

        const staging = Bun.spawnSync(["bun", "-e", probe], {
            env: { ...process.env, APP_ENV: "staging" },
        });
        expect(JSON.parse(staging.stdout.toString())).toEqual({
            ga: false,
            clarity: false,
            noindex: true,
        });

        const production = Bun.spawnSync(["bun", "-e", probe], {
            env: { ...process.env, APP_ENV: "production" },
        });
        expect(JSON.parse(production.stdout.toString())).toEqual({
            ga: true,
            clarity: true,
            noindex: false,
        });
    });
});
