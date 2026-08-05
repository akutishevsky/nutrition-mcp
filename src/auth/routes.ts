import type { Hono } from "hono";
import { createHouseholdRouter } from "../households/routes.js";
import { getMunchBetterAuth } from "./auth.js";
import { betterAuthIsEnabled } from "./config.js";
import { createBetterAuthConnectRouter } from "./connect-routes.js";
import { createOAuthContinuationRouter } from "./oauth-continuation-routes.js";
import { createReviewerRouter } from "./reviewer-routes.js";

export function registerBetterAuthRoutes(app: Hono): void {
    if (!betterAuthIsEnabled()) return;

    app.route("/", createOAuthContinuationRouter());
    app.route("/", createBetterAuthConnectRouter());
    app.route("/", createReviewerRouter());
    app.route("/", createHouseholdRouter());
    app.on(["GET", "POST"], "/api/auth/*", (c) =>
        getMunchBetterAuth().handler(c.req.raw),
    );
}
