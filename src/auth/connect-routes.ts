import { Hono, type Context } from "hono";
import { requireSameOrigin } from "../accounts/csrf.js";
import { createCheckoutForUser } from "../billing/checkout-service.js";
import { decideEntitlement } from "../billing/entitlements.js";
import { getSubscriptionSnapshot } from "../billing/repository.js";
import { getMunchBetterAuth } from "./auth.js";
import { safeMagicLinkReturnPath } from "./magic-link-url.js";
import { describeOAuthScope } from "./oauth-scopes.js";

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function shell(title: string, body: string): string {
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)} — Munch</title><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/styles.css"></head>
<body class="auth-page"><div class="auth-layout"><aside class="auth-brand-panel"><a class="brand" href="/"><img class="brand-logo" src="/brand/munch-mark-white.svg" alt=""><span>Munch</span></a><div class="auth-brand-copy"><p class="eyebrow">Secure ChatGPT connection</p><h1>Nutrition memory for <span>ChatGPT.</span></h1><p>Sign in once, activate Premium, approve the connection, and return to ChatGPT.</p></div></aside><main class="auth-main"><section class="auth-card">${body}</section></main></div></body></html>`;
}

function privateHtml(c: Context, html: string) {
    c.header("Cache-Control", "no-store, private");
    c.header("Pragma", "no-cache");
    c.header("Referrer-Policy", "no-referrer");
    return c.html(html);
}

function boundedOAuthQuery(value: unknown): string | undefined {
    return typeof value === "string" && value.length <= 12_000
        ? value
        : undefined;
}

function consentPath(input: {
    clientId: string;
    scope: string;
    oauthQuery?: string;
}): string {
    const query = new URLSearchParams({
        client_id: input.clientId,
        scope: input.scope,
    });
    if (input.oauthQuery) query.set("oauth_query", input.oauthQuery);
    return `/connect/consent?${query.toString()}`;
}

function publicClientName(value: unknown): string {
    const record = value as Record<string, unknown> | null;
    const candidate = record?.client_name ?? record?.name;
    return typeof candidate === "string" && candidate.trim()
        ? candidate.trim()
        : "ChatGPT or this MCP client";
}

async function premiumCheckoutRedirect(
    c: Context,
    userId: string,
    returnPath: string,
): Promise<Response | null> {
    const entitlement = decideEntitlement(
        await getSubscriptionSnapshot(userId),
    );
    if (entitlement.canUseProtectedTools) return null;

    const checkout = await createCheckoutForUser({
        userId,
        successReturnTo: returnPath,
        cancelReturnTo: returnPath,
    });
    return c.redirect(checkout.url, 303);
}

export function createBetterAuthConnectRouter(): Hono {
    const connect = new Hono();

    connect.get("/connect/sign-in", async (c) => {
        const returnTo = safeMagicLinkReturnPath(c.req.query("return_to"));
        const oauthQuery = boundedOAuthQuery(c.req.query("oauth_query"));
        const session = await getMunchBetterAuth().api.getSession({
            headers: c.req.raw.headers,
        });
        if (session?.user && !oauthQuery) return c.redirect(returnTo, 303);

        return privateHtml(
            c,
            shell(
                "Sign in",
                `<p class="section-kicker">Munch account</p><h1>Sign in with your email</h1><p>We will send a single-use link. If this email is new, your Munch account will be created automatically.</p><form class="auth-form" method="post" action="/connect/request"><input type="hidden" name="return_to" value="${escapeHtml(returnTo)}">${oauthQuery ? `<input type="hidden" name="oauth_query" value="${escapeHtml(oauthQuery)}">` : ""}<div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required maxlength="320"></div><button class="button button-primary" type="submit">Send magic link</button></form><p class="auth-footnote">No password is created or stored.</p>`,
            ),
        );
    });

    connect.post("/connect/request", requireSameOrigin, async (c) => {
        const body = await c.req.parseBody();
        const email = typeof body.email === "string" ? body.email.trim() : "";
        const returnTo = safeMagicLinkReturnPath(body.return_to);
        const oauthQuery = boundedOAuthQuery(body.oauth_query);
        if (!email || email.length > 320) {
            const retry = new URLSearchParams({ return_to: returnTo });
            if (oauthQuery) retry.set("oauth_query", oauthQuery);
            return privateHtml(
                c,
                shell(
                    "Sign-in problem",
                    `<h1>Enter a valid email address.</h1><div class="portal-actions"><a class="button button-primary" href="/connect/sign-in?${retry.toString()}">Try again</a></div>`,
                ),
            );
        }

        try {
            await getMunchBetterAuth().api.signInMagicLink({
                headers: c.req.raw.headers,
                body: {
                    email,
                    name: "Munch user",
                    callbackURL: returnTo,
                    newUserCallbackURL: returnTo,
                    errorCallbackURL: "/connect/error",
                    ...(oauthQuery ? { oauth_query: oauthQuery } : {}),
                },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "";
            if (
                message.includes("required") ||
                message.includes("rejected") ||
                message.includes("unavailable")
            ) {
                console.error("Better Auth magic-link delivery is unavailable");
                return c.json({ error: "login_delivery_unavailable" }, 503);
            }
        }

        return privateHtml(
            c,
            shell(
                "Check your email",
                `<p class="section-kicker">Magic link sent</p><h1>Check your email</h1><p>If the address can receive Munch email, a single-use sign-in link is on the way. It expires automatically.</p><div class="portal-actions"><a class="button button-secondary" href="/">Return home</a></div>`,
            ),
        );
    });

    connect.get("/connect/confirm", (c) => {
        const token = c.req.query("token");
        const returnTo = safeMagicLinkReturnPath(c.req.query("return_to"));
        if (!token) return c.redirect("/connect/error", 303);

        return privateHtml(
            c,
            shell(
                "Confirm sign in",
                `<p class="section-kicker">One final step</p><h1>Continue signing in</h1><p>Press the button below to use this single-use link. This confirmation prevents automated email scanners from consuming it.</p><form class="auth-form" method="post" action="/connect/confirm"><input type="hidden" name="token" value="${escapeHtml(token)}"><input type="hidden" name="return_to" value="${escapeHtml(returnTo)}"><button class="button button-primary" type="submit">Continue signing in</button></form>`,
            ),
        );
    });

    connect.post("/connect/confirm", requireSameOrigin, async (c) => {
        const body = await c.req.parseBody();
        const token = typeof body.token === "string" ? body.token : "";
        const returnTo = safeMagicLinkReturnPath(body.return_to);
        if (!token) return c.redirect("/connect/error", 303);

        try {
            return await getMunchBetterAuth().api.magicLinkVerify({
                headers: c.req.raw.headers,
                query: {
                    token,
                    callbackURL: returnTo,
                },
                asResponse: true,
            });
        } catch {
            return c.redirect("/connect/error", 303);
        }
    });

    connect.get("/connect/consent", async (c) => {
        const clientId = c.req.query("client_id") ?? "";
        const scope = c.req.query("scope") ?? "";
        const oauthQuery = boundedOAuthQuery(c.req.query("oauth_query"));
        if (!clientId || !scope) return c.redirect("/connect/error", 303);

        const auth = getMunchBetterAuth();
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        });
        if (!session?.user) {
            const loginQuery = new URLSearchParams();
            if (oauthQuery) loginQuery.set("oauth_query", oauthQuery);
            return c.redirect(`/connect/sign-in?${loginQuery.toString()}`, 303);
        }

        const returnPath = consentPath({ clientId, scope, oauthQuery });
        const checkout = await premiumCheckoutRedirect(
            c,
            session.user.id,
            returnPath,
        );
        if (checkout) return checkout;

        let clientName = "ChatGPT or this MCP client";
        try {
            clientName = publicClientName(
                await auth.api.getOAuthClientPublic({
                    headers: c.req.raw.headers,
                    query: { client_id: clientId },
                }),
            );
        } catch {
            // Keep the generic client description. Authorization still remains
            // bound to Better Auth's signed OAuth transaction.
        }

        const scopes = scope
            .split(/\s+/)
            .map((item) => item.trim())
            .filter(Boolean);
        const scopeItems = scopes
            .map(
                (item) =>
                    `<li><strong>${escapeHtml(item)}</strong><span>${escapeHtml(describeOAuthScope(item))}</span></li>`,
            )
            .join("");

        return privateHtml(
            c,
            shell(
                "Authorize Munch",
                `<p class="section-kicker">Approve ChatGPT access</p><h1>Connect ${escapeHtml(clientName)}</h1><p>This client is requesting access to your Munch account. It will not receive billing credentials or unrelated ChatGPT conversations.</p><ul class="consent-scope-list">${scopeItems}</ul><form class="consent-actions" method="post" action="/connect/consent"><input type="hidden" name="client_id" value="${escapeHtml(clientId)}"><input type="hidden" name="scope" value="${escapeHtml(scope)}">${oauthQuery ? `<input type="hidden" name="oauth_query" value="${escapeHtml(oauthQuery)}">` : ""}<button class="button button-primary" type="submit" name="decision" value="approve">Approve connection</button><button class="button button-quiet" type="submit" name="decision" value="deny">Deny</button></form><p class="auth-footnote">You can revoke this connection later from your Munch account.</p>`,
            ),
        );
    });

    connect.post("/connect/consent", requireSameOrigin, async (c) => {
        const body = await c.req.parseBody();
        const clientId =
            typeof body.client_id === "string" ? body.client_id : "";
        const scope = typeof body.scope === "string" ? body.scope : "";
        const oauthQuery = boundedOAuthQuery(body.oauth_query);
        const accept = body.decision === "approve";
        if (!clientId || !scope) return c.redirect("/connect/error", 303);

        const auth = getMunchBetterAuth();
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        });
        if (!session?.user) return c.redirect("/connect/sign-in", 303);

        const returnPath = consentPath({ clientId, scope, oauthQuery });
        if (accept) {
            const checkout = await premiumCheckoutRedirect(
                c,
                session.user.id,
                returnPath,
            );
            if (checkout) return checkout;
        }

        try {
            return await auth.api.oauth2Consent({
                headers: c.req.raw.headers,
                body: {
                    accept,
                    scope,
                    ...(oauthQuery ? { oauth_query: oauthQuery } : {}),
                },
                asResponse: true,
            });
        } catch {
            return c.redirect("/connect/error", 303);
        }
    });

    connect.get("/connect/error", (c) =>
        privateHtml(
            c,
            shell(
                "Connection problem",
                `<p class="section-kicker">Connection unavailable</p><h1>This Munch connection cannot be completed.</h1><p>The sign-in or authorization request may have expired. Return to ChatGPT and press Connect again.</p><div class="portal-actions"><a class="button button-primary" href="/connect/sign-in">Sign in to Munch</a><a class="button button-secondary" href="/">Return home</a></div>`,
            ),
        ),
    );

    return connect;
}
