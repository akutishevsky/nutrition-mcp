import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { createAccountRouter } from "./accounts/routes.js";
import { createProvenanceRouter } from "./app/provenance-routes.js";
import { createAppRouter } from "./app/routes.js";
import { createGuidanceRouter } from "./app/guidance-routes.js";
import { registerBetterAuthRoutes } from "./auth/routes.js";
import { createBillingRouter } from "./billing/routes.js";
import { registerDiscoveryRoutes } from "./discovery.js";
import { startExportCleanup } from "./export.js";
import { createInventoryRouter } from "./inventory/routes.js";
import { getCookMediaBytes, verifyCookMediaToken } from "./cooks/media.js";
import { handleMcp } from "./mcp-runtime.js";
import {
    authenticateBearer,
    banRepeatAuthFailures,
    rateLimit,
} from "./middleware.js";
import { isAllowedApplicationCorsOrigin } from "./mobile/origins.js";
import { maskIp } from "./net.js";
import { validateStartupConfiguration } from "./operations/config.js";
import { createOperationsRouter } from "./operations/routes.js";
import { getLandingStats, type LandingStats } from "./storage.js";
import { warmWidgets } from "./widgets.js";

validateStartupConfiguration();

const app = new Hono();

app.use("*", async (c, next) => {
    const path = new URL(c.req.url).pathname;
    const start = performance.now();
    await next();
    if (c.get("suppressAccessLog")) return;
    console.log(
        `[req] ${c.req.method} ${path} ${c.res.status} ${Math.round(performance.now() - start)}ms ip=${maskIp(c.req.header("x-forwarded-for"))}`,
    );
});

app.use("*", async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "no-referrer");
    if (!c.res.headers.get("Content-Security-Policy")) {
        c.header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; frame-ancestors 'none'",
        );
    }
});

app.use(
    "*",
    bodyLimit({
        // Receipt/Pantry images remain transient; Cook photos are validated and
        // persisted by the Cook media service. Individual handlers enforce
        // stricter 8 MB image limits.
        maxSize: 10 * 1024 * 1024,
        onError: (c) => c.json({ error: "payload_too_large" }, 413),
    }),
);

app.use(
    "*",
    cors({
        origin: (origin) => {
            if (!origin) return null;
            return isAllowedApplicationCorsOrigin(origin) ? origin : null;
        },
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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
            "WWW-Authenticate",
            "set-auth-token",
        ],
        credentials: false,
        maxAge: 86400,
    }),
);

app.route("/", createOperationsRouter());
registerDiscoveryRoutes(app);
registerBetterAuthRoutes(app);
app.route("/", createAccountRouter());
app.route("/", createBillingRouter());
// Pantry is mounted before the catch-all /app/* shell so /app/pantry can use a
// purpose-built premium inventory UI without changing the existing SPA bundle.
app.route("/", createInventoryRouter());
app.route("/", createAppRouter());
app.route("/", createGuidanceRouter());
app.route("/", createProvenanceRouter());
app.all(
    "/mcp",
    banRepeatAuthFailures,
    authenticateBearer,
    rateLimit,
    handleMcp,
);

app.get("/media/cooks/:id", async (c) => {
    const mediaId = c.req.param("id");
    const token = c.req.query("token");
    if (!token) return c.json({ error: "cook_media_token_required" }, 401);
    const verified = verifyCookMediaToken(token, mediaId);
    if (!verified) return c.json({ error: "cook_media_not_found" }, 404);
    const media = await getCookMediaBytes(verified.userId, mediaId);
    if (!media) return c.json({ error: "cook_media_not_found" }, 404);
    const body = media.bytes.buffer.slice(
        media.bytes.byteOffset,
        media.bytes.byteOffset + media.bytes.byteLength,
    ) as ArrayBuffer;
    return c.body(body, 200, {
        "Content-Type": media.mimeType,
        "Content-Disposition": media.fileName
            ? `inline; filename="${media.fileName.replace(/[^a-zA-Z0-9._ -]/g, "_")}"`
            : "inline",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
    });
});

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
    } catch {
        console.error("Failed to load landing stats");
        if (statsCache) return c.json(statsCache.data);
        return c.json({ error: "stats_unavailable" }, 503);
    }
});

app.get("/map-data.json", async (c) =>
    c.body(await Bun.file("./public/map-data.json").text(), 200, {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400",
    }),
);
app.get("/og.png", async (c) =>
    c.body(await Bun.file("./public/og.png").arrayBuffer(), 200, {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
    }),
);
app.get("/apple-touch-icon.png", async (c) =>
    c.body(await Bun.file("./public/apple-touch-icon.png").arrayBuffer(), 200, {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
    }),
);
const BRAND_ASSETS: Record<string, { file: string; contentType: string }> = {
    "/brand/munch-mark.svg": {
        file: "./public/brand/munch-mark.svg",
        contentType: "image/svg+xml",
    },
    "/brand/munch-mark-dark.svg": {
        file: "./public/brand/munch-mark-dark.svg",
        contentType: "image/svg+xml",
    },
    "/brand/munch-mark-white.svg": {
        file: "./public/brand/munch-mark-white.svg",
        contentType: "image/svg+xml",
    },
    "/brand/munch-mark-192.png": {
        file: "./public/brand/munch-mark-192.png",
        contentType: "image/png",
    },
    "/brand/munch-mark-512.png": {
        file: "./public/brand/munch-mark-512.png",
        contentType: "image/png",
    },
};
for (const [route, asset] of Object.entries(BRAND_ASSETS)) {
    app.get(route, async (c) =>
        c.body(await Bun.file(asset.file).arrayBuffer(), 200, {
            "Content-Type": asset.contentType,
            "Cache-Control": "public, max-age=86400",
        }),
    );
}

app.get("/robots.txt", async (c) =>
    c.body(await Bun.file("./public/robots.txt").text(), 200, {
        "Content-Type": "text/plain",
    }),
);
app.get("/sitemap.xml", async (c) =>
    c.body(await Bun.file("./public/sitemap.xml").text(), 200, {
        "Content-Type": "application/xml",
    }),
);
app.get("/llms.txt", async (c) =>
    c.body(await Bun.file("./public/llms.txt").text(), 200, {
        "Content-Type": "text/plain; charset=utf-8",
    }),
);
app.get("/.well-known/security.txt", async (c) =>
    c.body(await Bun.file("./public/security.txt").text(), 200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
    }),
);

app.get("/", async (c) => c.html(await Bun.file("./public/index.html").text()));
// Bare /connect is the public connect-instructions page. It is an exact
// route only: the OAuth namespace below it (/connect/sign-in,
// /connect/consent, /connect/request, /connect/confirm) is registered by
// the auth router and must keep reaching auth untouched. The regression
// check in scripts/connect-route-smoke.ts pins this.
app.get("/connect", async (c) =>
    c.html(await Bun.file("./public/connect.html").text()),
);
app.get("/connect/", (c) => c.redirect("/connect", 301));
app.get("/privacy", async (c) =>
    c.html(await Bun.file("./public/privacy.html").text()),
);
app.get("/privacy/", (c) => c.redirect("/privacy", 301));
app.get("/terms", async (c) =>
    c.html(await Bun.file("./public/terms.html").text()),
);
app.get("/terms/", (c) => c.redirect("/terms", 301));
app.get("/tools", async (c) =>
    c.html(await Bun.file("./public/tools.html").text()),
);
app.get("/tools/", (c) => c.redirect("/tools", 301));
app.get("/help", async (c) =>
    c.html(await Bun.file("./public/help.html").text()),
);
app.get("/help/", (c) => c.redirect("/help", 301));
app.get("/help/connect-chatgpt", (c) => c.redirect("/connect", 301));
app.get("/help/connect-chatgpt/", (c) => c.redirect("/connect", 301));
app.get("/security", async (c) =>
    c.html(await Bun.file("./public/security.html").text()),
);
app.get("/security/", (c) => c.redirect("/security", 301));
app.get("/open-source", async (c) =>
    c.html(await Bun.file("./public/open-source.html").text()),
);
app.get("/open-source/", (c) => c.redirect("/open-source", 301));

const LEGACY_PUBLIC_ROUTES = [
    "/alternatives",
    "/myfitnesspal-mcp",
    "/cronometer-mcp",
    "/lose-it-mcp",
    "/macrofactor-mcp",
    "/yazio-mcp",
    "/lifesum-mcp",
];
for (const route of LEGACY_PUBLIC_ROUTES) {
    app.get(route, (c) => c.redirect("/tools", 301));
    app.get(`${route}/`, (c) => c.redirect("/tools", 301));
}

app.get("/styles.css", async (c) =>
    c.body(await Bun.file("./public/styles.css").text(), 200, {
        "Content-Type": "text/css",
    }),
);
app.get("/editorial.css", async (c) =>
    c.body(await Bun.file("./public/editorial.css").text(), 200, {
        "Content-Type": "text/css",
    }),
);
app.get("/app-overrides.css", async (c) =>
    c.body(await Bun.file("./public/app-overrides.css").text(), 200, {
        "Content-Type": "text/css",
        "Cache-Control": "no-cache",
    }),
);
app.get("/app-integrity.js", async (c) =>
    c.body(await Bun.file("./public/app-integrity.js").text(), 200, {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "no-cache",
    }),
);
app.get("/app-patches.js", async (c) =>
    c.body(await Bun.file("./public/app-patches.js").text(), 200, {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "no-cache",
    }),
);
app.get("/app-provenance.js", async (c) =>
    c.body(await Bun.file("./public/app-provenance.js").text(), 200, {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "no-cache",
    }),
);
app.get("/favicon.ico", async (c) => {
    try {
        return c.body(
            await Bun.file("./public/favicon.ico").arrayBuffer(),
            200,
            {
                "Content-Type": "image/x-icon",
                "Cache-Control": "public, max-age=86400",
            },
        );
    } catch {
        return c.notFound();
    }
});

app.onError((_error, c) => {
    console.error("Unhandled application error");
    return c.json({ error: "internal_server_error" }, 500);
});

const port = parseInt(process.env.PORT || "8080");
console.log(
    `Munch server listening on 0.0.0.0:${port} auth=better_auth database=railway_postgresql`,
);
await warmWidgets();
startExportCleanup();

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
    idleTimeout: 120,
    fetch: app.fetch,
};
