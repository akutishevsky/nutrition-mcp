import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { createAccountRouter } from "./accounts/routes.js";
import { createBillingRouter } from "./billing/routes.js";
import { registerDiscoveryRoutes } from "./discovery.js";
import { startExportCleanup } from "./export.js";
import { handleMcp } from "./mcp.js";
import {
    authenticateBearer,
    banRepeatAuthFailures,
    rateLimit,
} from "./middleware.js";
import { maskIp } from "./net.js";
import { createOAuthRouter } from "./oauth.js";
import { authenticatePlatformBearer } from "./oauth-platform/middleware.js";
import { createPlatformOAuthRouter } from "./oauth-platform/routes.js";
import { getLandingStats, type LandingStats } from "./supabase.js";
import { warmWidgets } from "./widgets.js";

const app = new Hono();
const railwayAuthEnabled =
    process.env.MUNCH_RAILWAY_AUTH_ENABLED === "true";

app.use("*", async (c, next) => {
    const path = new URL(c.req.url).pathname;
    if (path === "/health") return next();

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
            "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self'; frame-ancestors 'none'",
        );
    }
});

app.use(
    "*",
    bodyLimit({
        maxSize: 1024 * 1024,
        onError: (c) => c.json({ error: "payload_too_large" }, 413),
    }),
);

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
                process.env.ALLOWED_ORIGINS?.split(",").map((value) =>
                    value.trim(),
                ) ?? [];
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

registerDiscoveryRoutes(app);
app.route("/", createAccountRouter());
app.route("/", createBillingRouter());

if (railwayAuthEnabled) {
    app.use("/token", async (c, next) => {
        await next();
        c.header("Cache-Control", "no-store");
        c.header("Pragma", "no-cache");
    });
    app.route("/", createPlatformOAuthRouter());
} else {
    app.route("/", createOAuthRouter());
}

app.all(
    "/mcp",
    banRepeatAuthFailures,
    railwayAuthEnabled ? authenticatePlatformBearer : authenticateBearer,
    rateLimit,
    handleMcp,
);

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

app.get("/", async (c) => c.html(await Bun.file("./public/index.html").text()));
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

const ALT_PAGES: Record<string, string> = {
    "/alternatives": "alternatives/index.html",
    "/myfitnesspal-mcp": "alternatives/myfitnesspal.html",
    "/cronometer-mcp": "alternatives/cronometer.html",
    "/lose-it-mcp": "alternatives/lose-it.html",
    "/macrofactor-mcp": "alternatives/macrofactor.html",
    "/yazio-mcp": "alternatives/yazio.html",
    "/lifesum-mcp": "alternatives/lifesum.html",
};
for (const [route, file] of Object.entries(ALT_PAGES)) {
    app.get(route, async (c) =>
        c.html(await Bun.file(`./public/${file}`).text()),
    );
    app.get(`${route}/`, (c) => c.redirect(route, 301));
}

app.get("/styles.css", async (c) =>
    c.body(await Bun.file("./public/styles.css").text(), 200, {
        "Content-Type": "text/css",
    }),
);
app.get("/favicon.ico", async (c) => {
    try {
        return c.body(await Bun.file("./public/favicon.ico").arrayBuffer(), 200, {
            "Content-Type": "image/x-icon",
            "Cache-Control": "public, max-age=86400",
        });
    } catch {
        return c.notFound();
    }
});

app.get("/health", (c) => c.text("ok"));
app.onError((_error, c) => {
    console.error("Unhandled application error");
    return c.json({ error: "internal_server_error" }, 500);
});

const port = parseInt(process.env.PORT || "8080");
console.log(
    `Munch server listening on 0.0.0.0:${port} auth=${railwayAuthEnabled ? "railway" : "inherited"}`,
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
