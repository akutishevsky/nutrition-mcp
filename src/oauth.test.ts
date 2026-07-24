import { test, expect } from "bun:test";
import crypto from "node:crypto";
import { Hono } from "hono";
import { OAUTH_PATHS, createOAuthRouter, renderLoginPage } from "./oauth.js";
import { _resetBuckets } from "./rate-limit.js";

// createOAuthRouter() refuses to build without these; the values are never
// exercised by the rate-limit tests below.
process.env.OAUTH_CLIENT_ID ||= "test-client-id";
process.env.OAUTH_CLIENT_SECRET ||= "test-client-secret";

// Guards the nonce representation: Supabase expects the SHA-256 *hex* digest sent
// to Google (not base64url). A regression to base64URLEncode would break sign-in.
test("nonce is hashed as lowercase hex SHA-256", () => {
    const hashed = crypto.createHash("sha256").update("abc").digest("hex");
    expect(hashed).toBe(
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(hashed).toHaveLength(64);
    expect(hashed).toMatch(/^[0-9a-f]{64}$/);
});

test("renderLoginPage substitutes every {{SESSION_ID}} occurrence", async () => {
    const sessionId = "session-abc-123";
    const html = await renderLoginPage(sessionId);

    // The password form's hidden field and the Google button's href both use the
    // placeholder, so a single .replace() (first-match only) would leave one
    // behind and break the Google link.
    expect(html).not.toContain("{{SESSION_ID}}");
    expect(html).toContain(`value="${sessionId}"`);
    expect(html).toContain(`/authorize/google?session_id=${sessionId}`);
});

test("renderLoginPage renders the error banner only when given an error", async () => {
    const clean = await renderLoginPage("s1");
    expect(clean).not.toContain("{{ERROR}}");
    expect(clean).not.toContain("error-banner");

    const withError = await renderLoginPage("s1", "Bad <stuff> & things");
    expect(withError).toContain("error-banner");
    // Error text is HTML-escaped.
    expect(withError).toContain("Bad &lt;stuff&gt; &amp; things");
});

// ---------- OAuth rate-limit scoping ----------

// The HTTP method each OAuth path is registered with, so the table-driven test
// drives the route the router actually serves rather than a 404.
const OAUTH_METHODS: Record<(typeof OAUTH_PATHS)[number], string> = {
    "/register": "POST",
    "/authorize": "GET",
    "/approve": "POST",
    "/authorize/google": "GET",
    "/auth/google/callback": "GET",
    "/token": "POST",
};

// Mirrors how src/index.ts wires things up: the OAuth router is mounted at the
// root (the OAuth paths are spec-fixed there) with /mcp as a sibling route.
function buildTestApp() {
    let mcpHits = 0;
    const app = new Hono();
    app.route("/", createOAuthRouter());
    app.all("/mcp", (c) => {
        mcpHits++;
        return c.text("ok");
    });
    // These tests send deliberately malformed bodies so handlers bail out before
    // touching Supabase; swallow the resulting throws instead of logging 30 of
    // them per path. Status codes are what the assertions look at.
    app.onError((_err, c) => c.text("handler error", 500));
    return { app, mcpHits: () => mcpHits };
}

function fire(app: Hono, method: string, path: string, ip: string) {
    return app.request(`http://localhost${path}`, {
        method,
        headers: { "x-forwarded-for": ip },
    });
}

// The bug this guards: `oauth.use("*", rateLimitAuth)` inside the router. Hono
// applies a sub-app's wildcard middleware to every path of the parent app, so
// the 30/min per-IP OAuth limiter also governed /mcp — capping all authenticated
// MCP traffic behind a shared egress IP well below the intended 60/min per-user
// limit. A structural assertion on OAUTH_PATHS would not have caught this;
// only actually driving /mcp past the auth limit does.
test("the OAuth rate limiter does not leak onto /mcp", async () => {
    _resetBuckets();
    const { app, mcpHits } = buildTestApp();

    // Read the per-IP auth limit off a real OAuth response instead of hardcoding
    // it, so this stays correct if the limit is retuned.
    const probe = await fire(app, "GET", "/authorize", "203.0.113.9");
    const authLimit = Number(probe.headers.get("X-RateLimit-Limit"));
    expect(authLimit).toBeGreaterThan(0);
    _resetBuckets();

    const total = authLimit * 3;
    for (let i = 0; i < total; i++) {
        const res = await fire(app, "POST", "/mcp", "198.51.100.7");
        expect(res.status).not.toBe(429);
        // rateLimitAuth always stamps these; their absence proves it never ran.
        expect(res.headers.get("X-RateLimit-Limit")).toBeNull();
    }
    // Every request reached the handler — none were short-circuited.
    expect(mcpHits()).toBe(total);
});

// Table-driven so a route added to the router but left out of OAUTH_PATHS fails
// here: dropping the limiter from an unauthenticated endpoint is a security
// regression, and it is the main risk of scoping the middleware by path.
test("every OAuth endpoint is still rate-limited", async () => {
    for (const [i, path] of OAUTH_PATHS.entries()) {
        _resetBuckets();
        const { app } = buildTestApp();
        const method = OAUTH_METHODS[path]!;
        // Distinct IP per path so the buckets can't bleed into each other.
        const ip = `192.0.2.${i + 1}`;

        let limit = 0;
        let saw429 = false;
        for (let n = 0; n <= 200; n++) {
            const res = await fire(app, method, path, ip);
            if (n === 0) {
                limit = Number(res.headers.get("X-RateLimit-Limit"));
                expect(limit).toBeGreaterThan(0);
            }
            if (n < limit) {
                // Within the window: whatever the handler does, it isn't a 429.
                expect(res.status).not.toBe(429);
                continue;
            }
            expect(res.status).toBe(429);
            expect(res.headers.get("Retry-After")).toBeTruthy();
            saw429 = true;
            break;
        }
        expect(saw429).toBe(true);
    }
});

// OAUTH_PATHS is now the list the limiter is attached to, so it must stay in
// sync with the routes the router registers, including their methods.
test("OAUTH_PATHS covers exactly the router's registered routes", () => {
    const registered = new Set(
        createOAuthRouter()
            .routes.filter((r) => r.method !== "ALL")
            .map((r) => r.path),
    );
    expect([...registered].sort()).toEqual([...OAUTH_PATHS].sort());
    expect(Object.keys(OAUTH_METHODS).sort()).toEqual([...OAUTH_PATHS].sort());
});
