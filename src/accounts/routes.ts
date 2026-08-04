import { Hono } from "hono";
import { betterAuthIsEnabled } from "../auth/config.js";
import { decideEntitlement } from "../billing/entitlements.js";
import { getSubscriptionSnapshot } from "../billing/repository.js";
import { createHouseholdLifecycleRouter } from "../households/lifecycle-routes.js";
import { createHouseholdRouter } from "../households/routes.js";
import { rateLimitAuth } from "../middleware.js";
import { createPortalRouter } from "../portal/routes.js";
import { requireSameOrigin } from "./csrf.js";
import { deliverLoginLink } from "./login-delivery.js";
import { safeLocalRedirectPath } from "./redirect.js";
import { consumeLoginChallenge, createLoginChallenge } from "./repository.js";
import {
    clearWebSession,
    requireWebSession,
    setWebSessionCookie,
} from "./session.js";

interface LoginRequestBody {
    email?: unknown;
    returnTo?: unknown;
}

function loginErrorPage(message: string): string {
    const safeMessage = message
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign-in problem — Munch</title><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/styles.css"></head>
<body class="auth-page"><main class="auth-main"><section class="auth-card"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">M</span><span>Munch</span></a><h1 class="spacer-top">This sign-in link cannot be used.</h1><p>${safeMessage}</p><div class="hero-actions"><a class="button button-primary" href="/account/login">Request a new link</a><a class="button button-secondary" href="/">Return home</a></div></section></main></body></html>`;
}

export function createAccountRouter(): Hono {
    const account = new Hono();

    account.use("/account/login/request", rateLimitAuth);
    account.use("/account/login/consume", rateLimitAuth);

    account.get("/account/login", async (c) => {
        if (betterAuthIsEnabled()) {
            const returnTo = safeLocalRedirectPath(
                c.req.query("return_to"),
                "/account/portal",
            );
            return c.redirect(
                `/connect/sign-in?return_to=${encodeURIComponent(returnTo)}`,
                302,
            );
        }
        return c.html(await Bun.file("./public/login.html").text());
    });

    account.post("/account/login/request", requireSameOrigin, async (c) => {
        if (betterAuthIsEnabled()) {
            return c.json(
                {
                    error: "legacy_login_disabled",
                    loginUrl: "/connect/sign-in",
                },
                410,
            );
        }

        let body: LoginRequestBody;
        try {
            body = (await c.req.json()) as LoginRequestBody;
        } catch {
            return c.json({ error: "invalid_json" }, 400);
        }

        if (typeof body.email !== "string") {
            return c.json({ error: "email_required" }, 400);
        }

        const returnTo =
            typeof body.returnTo === "string"
                ? safeLocalRedirectPath(body.returnTo)
                : undefined;

        try {
            const challenge = await createLoginChallenge(body.email);
            const delivery = await deliverLoginLink({
                ...challenge,
                returnTo,
            });

            return c.json({
                accepted: true,
                ...(delivery.mode === "development"
                    ? {
                          developmentLoginUrl: delivery.developmentLoginUrl,
                      }
                    : {}),
            });
        } catch (error) {
            const configurationFailure =
                error instanceof Error &&
                (error.message.includes("not configured") ||
                    error.message.includes("is required"));
            if (configurationFailure) {
                console.error("Passwordless login delivery is unavailable");
                return c.json({ error: "login_delivery_unavailable" }, 503);
            }

            return c.json({ accepted: true });
        }
    });

    account.get("/account/login/consume", async (c) => {
        if (betterAuthIsEnabled()) {
            return c.redirect("/connect/error", 302);
        }

        const token = c.req.query("token");
        if (!token) {
            return c.html(loginErrorPage("The sign-in token is missing."), 400);
        }

        const session = await consumeLoginChallenge(token);
        if (!session) {
            return c.html(
                loginErrorPage(
                    "The link may have expired or already been used. Request a new single-use link to continue.",
                ),
                400,
            );
        }

        setWebSessionCookie(c, session);
        return c.redirect(
            safeLocalRedirectPath(c.req.query("return_to"), "/account/portal"),
            303,
        );
    });

    account.get("/account", requireWebSession, async (c) => {
        const userId = c.get("munchUserId");
        const subscription = await getSubscriptionSnapshot(userId);
        const entitlement = decideEntitlement(subscription);

        return c.json({
            user: {
                id: userId,
                email: c.get("munchUserEmail"),
            },
            subscription,
            entitlement,
            portalUrl: "/account/portal",
        });
    });

    account.post(
        "/account/logout",
        requireSameOrigin,
        requireWebSession,
        async (c) => {
            await clearWebSession(c);
            return c.json({ signedOut: true });
        },
    );

    account.route("/", createPortalRouter());
    account.route("/", createHouseholdRouter());
    account.route("/", createHouseholdLifecycleRouter());
    return account;
}
