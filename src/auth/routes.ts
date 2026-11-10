import type { Hono } from "hono";
import { createHouseholdRouter } from "../households/routes.js";
import { getMunchBetterAuth } from "./auth.js";
import { recoverMissingChatGptOAuthClient } from "./chatgpt-client-recovery.js";
import { createBetterAuthConnectRouter } from "./connect-routes.js";
import { createMobileAuthRouter } from "./mobile-routes.js";
import { createOAuthContinuationRouter } from "./oauth-continuation-routes.js";
import { createPasswordRouter } from "./password-routes.js";
import { createReviewerRouter } from "./reviewer-routes.js";
import { createSignInMethodsRouter } from "./sign-in-methods-routes.js";

export function registerBetterAuthRoutes(app: Hono): void {
    app.route("/", createOAuthContinuationRouter());
    app.route("/", createBetterAuthConnectRouter());
    app.route("/", createSignInMethodsRouter());
    app.route("/", createMobileAuthRouter());
    app.route("/", createPasswordRouter());
    app.route("/", createReviewerRouter());
    app.route("/", createHouseholdRouter());
    app.get("/api/auth/oauth2/authorize", async (c) => {
        await recoverMissingChatGptOAuthClient(c.req.raw);
        return getMunchBetterAuth().handler(c.req.raw);
    });
    app.on(["GET", "POST"], "/api/auth/*", (c) =>
        getMunchBetterAuth().handler(c.req.raw),
    );
}
