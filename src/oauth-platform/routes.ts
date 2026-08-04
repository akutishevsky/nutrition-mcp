import { Hono, type Context } from "hono";
import { getCookie } from "hono/cookie";
import { requireSameOrigin } from "../accounts/csrf.js";
import { deliverLoginLink } from "../accounts/login-delivery.js";
import {
    createLoginChallenge,
    resolveWebSession,
} from "../accounts/repository.js";
import {
    MUNCH_SESSION_COOKIE,
    requireWebSession,
} from "../accounts/session.js";
import { createCheckoutForUser } from "../billing/checkout-service.js";
import { decideEntitlement } from "../billing/entitlements.js";
import { getSubscriptionSnapshot } from "../billing/repository.js";
import { rateLimitAuth } from "../middleware.js";
import { getRefreshTokenSubject } from "./refresh-subject.js";
import {
    authorizeSession,
    createAuthorizationSession,
    denyAuthorizationSession,
    exchangeAuthorizationCode,
    getAuthorizationSession,
    issueAuthorizationCode,
    registerOAuthClient,
    rotateRefreshToken,
} from "./repository.js";

export const PLATFORM_OAUTH_PATHS = [
    "/register",
    "/authorize",
    "/oauth/continue",
    "/oauth/request-login",
    "/oauth/decision",
    "/token",
] as const;

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function oauthError(
    c: Context,
    status: 400 | 401,
    error: string,
    description?: string,
) {
    return c.json(
        {
            error,
            ...(description ? { error_description: description } : {}),
        },
        status,
    );
}

function oauthShell(title: string, content: string): string {
    return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0B8F4D"><title>${escapeHtml(title)} — Munch</title><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/styles.css"></head>
<body class="auth-page"><div class="auth-layout"><aside class="auth-brand-panel"><a class="brand" href="/"><img class="brand-logo" src="/brand/munch-mark-white.svg" alt=""><span>Munch</span></a><div class="auth-brand-copy"><p class="eyebrow">Secure ChatGPT connection</p><h1>Nutrition memory for <span>ChatGPT.</span></h1><p>Munch stores your structured nutrition history and exposes only the tools you authorize.</p></div><p class="tiny">Munch does not train models on your nutrition records. ChatGPT data handling is governed by OpenAI and your ChatGPT settings.</p></aside><main class="auth-main"><section class="auth-card">${content}</section></main></div></body></html>`;
}

function signInPage(sessionId: string): string {
    return oauthShell(
        "Connect Munch",
        `<p class="section-kicker">Step 1 of 2</p><h1>Sign in to Munch</h1><p>Enter your email and use the single-use link we send. You will return here to approve ChatGPT access.</p><form class="auth-form" method="post" action="/oauth/request-login"><input type="hidden" name="session_id" value="${escapeHtml(sessionId)}"><div class="field"><label for="email">Email</label><input id="email" type="email" name="email" autocomplete="email" required maxlength="320"></div><button class="button button-primary" type="submit">Send secure sign-in link</button></form><p class="auth-footnote">By continuing, you agree to the <a href="/terms">Terms</a> and acknowledge the <a href="/privacy">Privacy Policy</a>.</p>`,
    );
}

function checkEmailPage(developmentLoginUrl?: string): string {
    return oauthShell(
        "Check your email",
        `<p class="section-kicker">Secure sign-in</p><h1>Check your email</h1><p>Open the single-use Munch link to continue connecting ChatGPT. The link expires automatically.</p>${
            developmentLoginUrl
                ? `<p class="notice spacer-top">Development only: <a href="${escapeHtml(developmentLoginUrl)}">open sign-in link</a></p>`
                : ""
        }<div class="portal-actions"><a class="button button-secondary" href="/">Return home</a></div>`,
    );
}

function consentPage(input: {
    sessionId: string;
    clientName: string | null;
    redirectUri: string;
}): string {
    const client = input.clientName ?? "ChatGPT or this MCP client";
    return oauthShell(
        "Authorize Munch",
        `<p class="section-kicker">Step 2 of 2</p><h1>Authorize this connection</h1><div class="consent-client"><strong>${escapeHtml(client)}</strong><p>Return destination: ${escapeHtml(new URL(input.redirectUri).origin)}</p></div><p>Approval lets this client call Munch tools to read and write nutrition records on your behalf. It does not grant access to billing credentials or unrelated conversations.</p><form class="consent-actions" method="post" action="/oauth/decision"><input type="hidden" name="session_id" value="${escapeHtml(input.sessionId)}"><button class="button button-primary" type="submit" name="decision" value="approve">Approve connection</button><button class="button button-quiet" type="submit" name="decision" value="deny">Deny</button></form><p class="auth-footnote">You can revoke this connection later from the Munch account portal.</p>`,
    );
}

function tokenResponse(
    pair: Awaited<ReturnType<typeof exchangeAuthorizationCode>>,
) {
    const now = Date.now();
    return {
        access_token: pair.accessToken,
        token_type: pair.tokenType,
        expires_in: Math.max(
            1,
            Math.floor((pair.accessTokenExpiresAt.getTime() - now) / 1000),
        ),
        refresh_token: pair.refreshToken,
    };
}

function redirectWithOAuthError(
    redirectUri: string,
    state: string,
    error: string,
): string {
    const url = new URL(redirectUri);
    url.searchParams.set("error", error);
    url.searchParams.set("state", state);
    return url.toString();
}

async function currentWebUser(c: Context) {
    const token = getCookie(c, MUNCH_SESSION_COOKIE);
    return token ? resolveWebSession(token) : null;
}

export function createPlatformOAuthRouter(): Hono {
    const oauth = new Hono();

    for (const path of PLATFORM_OAUTH_PATHS) {
        oauth.use(path, rateLimitAuth);
    }

    oauth.post("/register", async (c) => {
        let body: Record<string, unknown>;
        try {
            body = (await c.req.json()) as Record<string, unknown>;
        } catch {
            return oauthError(c, 400, "invalid_client_metadata");
        }

        try {
            const client = await registerOAuthClient({
                clientName: body.client_name,
                redirectUris: body.redirect_uris,
                tokenEndpointAuthMethod: body.token_endpoint_auth_method,
            });
            return c.json(
                {
                    client_id: client.clientId,
                    ...(client.clientSecret
                        ? { client_secret: client.clientSecret }
                        : {}),
                    client_name: client.clientName,
                    redirect_uris: client.redirectUris,
                    token_endpoint_auth_method: client.tokenEndpointAuthMethod,
                    client_id_issued_at: Math.floor(Date.now() / 1000),
                },
                201,
            );
        } catch (error) {
            return oauthError(
                c,
                400,
                "invalid_client_metadata",
                error instanceof Error ? error.message : undefined,
            );
        }
    });

    oauth.get("/authorize", async (c) => {
        const responseType = c.req.query("response_type");
        const clientId = c.req.query("client_id");
        const redirectUri = c.req.query("redirect_uri");
        const state = c.req.query("state");
        const codeChallenge = c.req.query("code_challenge");
        const challengeMethod = c.req.query("code_challenge_method");

        if (responseType !== "code") {
            return oauthError(c, 400, "unsupported_response_type");
        }
        if (
            !clientId ||
            !redirectUri ||
            !state ||
            !codeChallenge ||
            challengeMethod !== "S256"
        ) {
            return oauthError(
                c,
                400,
                "invalid_request",
                "client_id, redirect_uri, state, and PKCE S256 are required",
            );
        }

        try {
            const session = await createAuthorizationSession({
                clientId,
                redirectUri,
                state,
                codeChallenge,
            });
            return c.redirect(
                `/oauth/continue?session_id=${encodeURIComponent(session.id)}`,
                303,
            );
        } catch (error) {
            const code =
                error instanceof Error && error.message === "invalid_client"
                    ? "invalid_client"
                    : "invalid_request";
            return oauthError(c, 400, code);
        }
    });

    oauth.get("/oauth/continue", async (c) => {
        const sessionId = c.req.query("session_id");
        if (!sessionId) return oauthError(c, 400, "invalid_request");

        const authorization = await getAuthorizationSession(sessionId);
        if (!authorization) {
            return oauthError(c, 400, "invalid_request", "Session expired");
        }

        const user = await currentWebUser(c);
        if (!user) {
            return c.html(signInPage(sessionId));
        }
        if (!(await authorizeSession(sessionId, user.userId))) {
            return oauthError(c, 400, "invalid_request", "Session unavailable");
        }

        const entitlement = decideEntitlement(
            await getSubscriptionSnapshot(user.userId),
        );
        if (!entitlement.canUseProtectedTools) {
            const returnTo = `/oauth/continue?session_id=${encodeURIComponent(sessionId)}`;
            const checkout = await createCheckoutForUser({
                userId: user.userId,
                pendingOAuthSessionId: sessionId,
                successReturnTo: returnTo,
                cancelReturnTo: returnTo,
            });
            return c.redirect(checkout.url, 303);
        }

        return c.html(
            consentPage({
                sessionId,
                clientName: authorization.clientName,
                redirectUri: authorization.redirectUri,
            }),
        );
    });

    oauth.post("/oauth/request-login", requireSameOrigin, async (c) => {
        const body = await c.req.parseBody();
        const sessionId = body.session_id;
        const email = body.email;
        if (typeof sessionId !== "string" || typeof email !== "string") {
            return oauthError(c, 400, "invalid_request");
        }
        if (!(await getAuthorizationSession(sessionId))) {
            return oauthError(c, 400, "invalid_request", "Session expired");
        }

        try {
            const challenge = await createLoginChallenge(email);
            const delivery = await deliverLoginLink({
                ...challenge,
                returnTo: `/oauth/continue?session_id=${encodeURIComponent(sessionId)}`,
            });
            return c.html(checkEmailPage(delivery.developmentLoginUrl));
        } catch {
            return c.json({ error: "login_delivery_unavailable" }, 503);
        }
    });

    oauth.post(
        "/oauth/decision",
        requireSameOrigin,
        requireWebSession,
        async (c) => {
            const body = await c.req.parseBody();
            const sessionId = body.session_id;
            const decision = body.decision;
            if (
                typeof sessionId !== "string" ||
                (decision !== "approve" && decision !== "deny")
            ) {
                return oauthError(c, 400, "invalid_request");
            }

            const userId = c.get("munchUserId");
            if (!(await authorizeSession(sessionId, userId))) {
                return oauthError(c, 400, "invalid_request");
            }

            if (decision === "deny") {
                const denied = await denyAuthorizationSession(
                    sessionId,
                    userId,
                );
                if (!denied) return oauthError(c, 400, "invalid_request");
                return c.redirect(
                    redirectWithOAuthError(
                        denied.redirectUri,
                        denied.state,
                        "access_denied",
                    ),
                    303,
                );
            }

            const entitlement = decideEntitlement(
                await getSubscriptionSnapshot(userId),
            );
            if (!entitlement.canUseProtectedTools) {
                return oauthError(
                    c,
                    400,
                    "access_denied",
                    "Subscription required",
                );
            }

            const code = await issueAuthorizationCode(sessionId, userId);
            const redirect = new URL(code.redirectUri);
            redirect.searchParams.set("code", code.code);
            redirect.searchParams.set("state", code.state);
            return c.redirect(redirect.toString(), 303);
        },
    );

    oauth.post("/token", async (c) => {
        const body = await c.req.parseBody();
        const grantType = body.grant_type;
        const clientId = body.client_id;
        const clientSecret =
            typeof body.client_secret === "string"
                ? body.client_secret
                : undefined;

        if (typeof clientId !== "string") {
            return oauthError(c, 401, "invalid_client");
        }

        try {
            if (grantType === "authorization_code") {
                if (
                    typeof body.code !== "string" ||
                    typeof body.redirect_uri !== "string" ||
                    typeof body.code_verifier !== "string"
                ) {
                    return oauthError(c, 400, "invalid_request");
                }
                const pair = await exchangeAuthorizationCode({
                    code: body.code,
                    clientId,
                    redirectUri: body.redirect_uri,
                    codeVerifier: body.code_verifier,
                    clientSecret,
                });
                return c.json(tokenResponse(pair));
            }

            if (grantType === "refresh_token") {
                if (typeof body.refresh_token !== "string") {
                    return oauthError(c, 400, "invalid_request");
                }

                const userId = await getRefreshTokenSubject({
                    refreshToken: body.refresh_token,
                    clientId,
                    clientSecret,
                });
                const entitlement = decideEntitlement(
                    await getSubscriptionSnapshot(userId),
                );
                if (!entitlement.canUseProtectedTools) {
                    return oauthError(
                        c,
                        400,
                        "invalid_grant",
                        "Subscription required",
                    );
                }

                const pair = await rotateRefreshToken({
                    refreshToken: body.refresh_token,
                    clientId,
                    clientSecret,
                });
                return c.json(tokenResponse(pair));
            }

            return oauthError(c, 400, "unsupported_grant_type");
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "invalid_grant";
            if (message === "invalid_client") {
                return oauthError(c, 401, "invalid_client");
            }
            return oauthError(c, 400, "invalid_grant");
        }
    });

    return oauth;
}
