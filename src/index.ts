import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { createOAuthRouter } from "./oauth.js";
import { authenticateBearer, rateLimit } from "./middleware.js";
import { handleMcp } from "./mcp.js";
import { startExportCleanup } from "./export.js";
import { getLandingStats, type LandingStats } from "./supabase.js";
import { getBaseUrl } from "./url.js";
import { maskIp } from "./net.js";
import { warmWidgets } from "./widgets.js";

const app = new Hono();

// Access log — records every non-health HTTP request (method, path, status,
// duration, masked client subnet) so traffic that never reaches a tool handler
// — and is therefore invisible to tool analytics — is still attributable in the
// runtime logs: unauthenticated /mcp probes (401), rate-limited hits (429),
// OAuth discovery crawls, vuln scanners. Registered first so it runs outermost
// and observes the final response status. /health is skipped to keep the
// platform's frequent health checks from evicting real traffic from the buffer.
app.use("*", async (c, next) => {
    const path = new URL(c.req.url).pathname;
    if (path === "/health") return next();
    const start = performance.now();
    await next();
    const ms = Math.round(performance.now() - start);
    const ip = maskIp(c.req.header("x-forwarded-for"));
    console.log(
        `[req] ${c.req.method} ${path} ${c.res.status} ${ms}ms ip=${ip}`,
    );
});

// Security headers
app.use("*", async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    if (!c.res.headers.get("Content-Security-Policy")) {
        c.header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://api.github.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' https://www.googletagmanager.com https://api.producthunt.com; frame-ancestors 'none'",
        );
    }
    c.header("Referrer-Policy", "no-referrer");
});

// Body limit
app.use(
    "*",
    bodyLimit({
        maxSize: 1024 * 1024,
        onError: (c) => c.json({ error: "payload_too_large" }, 413),
    }),
);

// CORS
app.use(
    "*",
    cors({
        origin: (origin) => {
            if (!origin) return null;
            if (
                origin.match(/^https?:\/\/localhost(:\d+)?$/) ||
                origin.match(/^https?:\/\/127\.0\.0\.1(:\d+)?$/)
            ) {
                return origin;
            }
            const allowed =
                process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) ??
                [];
            return allowed.includes(origin) ? origin : null;
        },
        allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
        allowHeaders: [
            "Content-Type",
            "Authorization",
            "Mcp-Session-Id",
            "Mcp-Protocol-Version",
            "Last-Event-ID",
            "Accept",
        ],
        exposeHeaders: [
            "Mcp-Session-Id",
            "Mcp-Protocol-Version",
            "Content-Type",
        ],
        credentials: false,
        maxAge: 86400,
    }),
);

// Protected resource metadata (MCP spec requirement)
app.get("/.well-known/oauth-protected-resource", (c) => {
    const baseUrl = getBaseUrl(c);
    return c.json({
        resource: baseUrl,
        authorization_servers: [baseUrl],
    });
});

// OAuth authorization server metadata
app.get("/.well-known/oauth-authorization-server", (c) => {
    const baseUrl = getBaseUrl(c);
    return c.json({
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/authorize`,
        token_endpoint: `${baseUrl}/token`,
        registration_endpoint: `${baseUrl}/register`,
        grant_types_supported: ["authorization_code", "refresh_token"],
        response_types_supported: ["code"],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
    });
});

// Glama connector ownership verification. Glama polls this file and matches the
// maintainer email against the Glama account email to claim the listing.
app.get("/.well-known/glama.json", (c) => {
    return c.json({
        $schema: "https://glama.ai/mcp/schemas/connector.json",
        maintainers: [{ email: "akutishevsky@gmail.com" }],
    });
});

// OAuth routes
app.route("/", createOAuthRouter());

// MCP endpoint (protected)
app.all("/mcp", authenticateBearer, rateLimit, handleMcp);

// Aggregate landing-page stats, cached in-memory so page views don't each hit
// the DB. The numbers move slowly, so a stale value for a few minutes is fine.
const STATS_TTL_MS = 5 * 60 * 1000;
let statsCache: { data: LandingStats; expiresAt: number } | null = null;

app.get("/api/stats", async (c) => {
    try {
        if (!statsCache || statsCache.expiresAt < Date.now()) {
            statsCache = {
                data: await getLandingStats(),
                expiresAt: Date.now() + STATS_TTL_MS,
            };
        }
        return c.json(statsCache.data, 200, {
            "Cache-Control": "public, max-age=300",
        });
    } catch (err) {
        console.error("Failed to load landing stats:", err);
        // Serve the last good value if we have one, even if expired.
        if (statsCache) return c.json(statsCache.data);
        return c.json({ error: "stats_unavailable" }, 503);
    }
});

// Static world-map data (land dot-matrix + projected timezone coords) for the
// landing page. Generated offline; safe to cache aggressively.
app.get("/map-data.json", async (c) => {
    return c.body(await Bun.file("./public/map-data.json").text(), 200, {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
    });
});

// Static images (social card + touch icon)
app.get("/og.png", async (c) => {
    return c.body(await Bun.file("./public/og.png").arrayBuffer(), 200, {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
    });
});
app.get("/apple-touch-icon.png", async (c) => {
    return c.body(
        await Bun.file("./public/apple-touch-icon.png").arrayBuffer(),
        200,
        {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400",
        },
    );
});

// SEO crawl files
app.get("/robots.txt", async (c) => {
    return c.body(await Bun.file("./public/robots.txt").text(), 200, {
        "Content-Type": "text/plain",
    });
});
app.get("/sitemap.xml", async (c) => {
    return c.body(await Bun.file("./public/sitemap.xml").text(), 200, {
        "Content-Type": "application/xml",
    });
});
// llms.txt — curated site map for LLMs / AI agents (llmstxt.org). Relevant here
// because this is an MCP server: Anthropic and OpenAI agents are a real referrer.
app.get("/llms.txt", async (c) => {
    return c.body(await Bun.file("./public/llms.txt").text(), 200, {
        "Content-Type": "text/plain; charset=utf-8",
    });
});

// Landing page
app.get("/", async (c) => {
    return c.html(await Bun.file("./public/index.html").text());
});

// Privacy & Terms
app.get("/privacy", async (c) => {
    return c.html(await Bun.file("./public/privacy.html").text());
});

// Tools reference — the full list of MCP tools with descriptions and examples.
app.get("/tools", async (c) => {
    return c.html(await Bun.file("./public/tools.html").text());
});
app.get("/tools/", (c) => c.redirect("/tools", 301));

// SEO comparison / "alternative to X" landing pages. Each targets long-tail
// queries like "myfitnesspal mcp" or "connect myfitnesspal to claude" and is a
// static HTML file under public/alternatives. Kept data-driven so adding a page
// is one entry here plus the file and a sitemap.xml line.
const ALT_PAGES: Record<string, string> = {
    "/alternatives": "alternatives/index.html",
    "/myfitnesspal-mcp": "alternatives/myfitnesspal.html",
    "/cronometer-mcp": "alternatives/cronometer.html",
    "/lose-it-mcp": "alternatives/lose-it.html",
    "/macrofactor-mcp": "alternatives/macrofactor.html",
    "/yazio-mcp": "alternatives/yazio.html",
    "/lifesum-mcp": "alternatives/lifesum.html",
};
for (const [path, file] of Object.entries(ALT_PAGES)) {
    app.get(path, async (c) =>
        c.html(await Bun.file(`./public/${file}`).text()),
    );
    // Redirect the trailing-slash variant to the canonical no-slash URL so a
    // stray "/myfitnesspal-mcp/" link doesn't 404.
    app.get(`${path}/`, (c) => c.redirect(path, 301));
}

// CSS
app.get("/styles.css", async (c) => {
    const file = Bun.file("./public/styles.css");
    return c.body(await file.text(), 200, { "Content-Type": "text/css" });
});

// Favicon endpoint
app.get("/favicon.ico", async (c) => {
    try {
        const file = Bun.file("./public/favicon.ico");
        return c.body(await file.arrayBuffer(), 200, {
            "Content-Type": "image/x-icon",
        });
    } catch {
        return c.notFound();
    }
});

// Health check
app.get("/health", (c) => c.text("ok"));

// Error handler
app.onError((_err, c) => {
    console.error("Unhandled error:", _err);
    return c.json({ error: "internal_server_error" }, 500);
});

const port = parseInt(process.env.PORT || "8080");

console.log(`Nutrition MCP server listening on 0.0.0.0:${port}`);

// Assemble every MCP Apps widget from its source partials up front, so a broken
// @include/partial fails fast at boot rather than on a client's first tool call.
await warmWidgets();

// Periodically delete expired meal-export files from the storage bucket.
startExportCleanup();

// Exit cleanly on shutdown signals (e.g. deploys). /mcp is stateless — no
// server-side sessions are held, so there is nothing to tear down; just exit.
let shuttingDown = false;
function shutdown(signal: string): void {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}, shutting down...`);
    process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default {
    port,
    hostname: "0.0.0.0",
    // Long-lived MCP streams (StreamableHTTP GET/SSE) can idle between events;
    // Bun's 10s default closes them and logs "request timed out after 10
    // seconds". Raise it so legitimate streaming connections aren't severed.
    idleTimeout: 120,
    fetch: app.fetch,
};
