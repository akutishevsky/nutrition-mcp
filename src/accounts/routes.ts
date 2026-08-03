import { Hono } from "hono";
import { decideEntitlement } from "../billing/entitlements.js";
import { getSubscriptionSnapshot } from "../billing/repository.js";
import { rateLimitAuth } from "../middleware.js";
import { createPortalRouter } from "../portal/routes.js";
import { requireSameOrigin } from "./csrf.js";
import { deliverLoginLink } from "./login-delivery.js";
import { safeLocalRedirectPath } from "./redirect.js";
import {
    consumeLoginChallenge,
    createLoginChallenge,
} from "./repository.js";
import {
    clearWebSession,
    requireWebSession,
    setWebSessionCookie,
} from "./session.js";

interface LoginRequestBody {
    email?: unknown;
    returnTo?: unknown;
}

export function createAccountRouter(): Hono {
    const account = new Hono();

    account.use("/account/login/request", rateLimitAuth);
    account.use("/account/login/consume", rateLimitAuth);

    account.post(
        "/account/login/request",
        requireSameOrigin,
        async (c) => {
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
                              developmentLoginUrl:
                                  delivery.developmentLoginUrl,
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
                    return c.json(
                        { error: "login_delivery_unavailable" },
                        503,
                    );
                }

                return c.json({ accepted: true });
            }
        },
    );

    account.get("/account/login/consume", async (c) => {
        const token = c.req.query("token");
        if (!token) {
            return c.json({ error: "login_token_required" }, 400);
        }

        const session = await consumeLoginChallenge(token);
        if (!session) {
            return c.json(
                { error: "invalid_or_expired_login_token" },
                400,
            );
        }

        setWebSessionCookie(c, session);
        return c.redirect(
            safeLocalRedirectPath(c.req.query("return_to")),
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
    return account;
}
