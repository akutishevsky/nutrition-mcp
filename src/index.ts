import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { createOAuthRouter } from "./oauth.js";
import { authenticateBearer, rateLimit } from "./middleware.js";
import { handleMcp } from "./mcp.js";

const app = new Hono();

function getBaseUrl(c: {
    req: { header: (name: string) => string | undefined; url: string };
}): string {
    const proto = c.req.header("x-forwarded-proto") || "http";
    const host = c.req.header("x-forwarded-host") || c.req.header("host");
    if (host) return `${proto}://${host}`;
    return new URL(c.req.url).origin;
}

// Security headers
app.use("*", async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    if (!c.res.headers.get("Content-Security-Policy")) {
        c.header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https://www.googletagmanager.com; frame-ancestors 'none'",
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

// OAuth routes
app.route("/", createOAuthRouter());

// MCP endpoint (protected)
app.all("/mcp", authenticateBearer, rateLimit, handleMcp);

// Landing page
app.get("/", async (c) => {
    return c.html(await Bun.file("./public/index.html").text());
});

// Privacy & Terms
app.get("/privacy", async (c) => {
    return c.html(await Bun.file("./public/privacy.html").text());
});

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

export default {
    port,
    hostname: "0.0.0.0",
    fetch: app.fetch,
};
