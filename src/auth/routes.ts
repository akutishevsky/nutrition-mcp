import type { Hono } from "hono";
import { getMunchBetterAuth } from "./auth.js";
import { betterAuthIsEnabled } from "./config.js";
import { createBetterAuthConnectRouter } from "./connect-routes.js";

export function registerBetterAuthRoutes(app: Hono): void {
    if (!betterAuthIsEnabled()) return;

    app.route("/", createBetterAuthConnectRouter());
    app.on(["GET", "POST"], "/api/auth/*", (c) =>
        getMunchBetterAuth().handler(c.req.raw),
    );
}
