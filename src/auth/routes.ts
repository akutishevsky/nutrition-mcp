import type { Hono } from "hono";
import { betterAuthIsEnabled } from "./config.js";
import { getMunchBetterAuth } from "./auth.js";

export function registerBetterAuthRoutes(app: Hono): void {
    if (!betterAuthIsEnabled()) return;

    app.on(["GET", "POST"], "/api/auth/*", (c) =>
        getMunchBetterAuth().handler(c.req.raw),
    );
}
