import { Hono } from "hono";
import { rateLimitAuth } from "../middleware.js";
import { getSubscriptionSnapshot } from "../billing/repository.js";
import { decideEntitlement } from "../billing/entitlements.js";
import { requireSameOrigin } from "./csrf.js";
import {
    consumeLoginChallenge,
    createLoginChallenge,
} from "./repository.js";
import { deliverLoginLink } from "./login-delivery.js";
import {
    clearWebSession,
    requireWebSession,
    setWebSessionCookie,
} from "./session.js";

interface LoginRequestBody {
    email?: unknown;
}

function safeRedirectPath(value: string | undefined): string {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
        return "/account";
    }
    return value;
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

            try {
                const challenge = await createLoginChallenge(body.email);
                const delivery = await deliverLoginLink(challenge);

                return c.json({
                    accepted: true,
                    ...(delivery.mode === "development"
                        ? { developmentLoginUrl: delivery.developmentLoginUrl }
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

                // Do not reveal whether an email already exists or whether an
                // account is suspended. The caller receives one generic result.
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
            return c.json({ error: "invalid_or_expired_login_token" }, 400);
        }

        setWebSessionCookie(c, session);
        const redirectTo = safeRedirectPath(c.req.query("return_to"));
        return c.redirect(redirectTo, 303);
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

    return account;
}
