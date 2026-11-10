import { Hono, type Context } from "hono";
import {
    createOAuthConsentCsrfToken,
    requireSameOrigin,
} from "../accounts/csrf.js";
import { resolveMunchCapabilitiesSafe } from "../billing/capabilities.js";
import { getMunchBetterAuth } from "./auth.js";
import { getBetterAuthRuntimeConfig } from "./config.js";
import { safeMagicLinkReturnPath } from "./magic-link-url.js";
import { describeOAuthScope } from "./oauth-scopes.js";
import {
    appleSignInButtonHtml,
    appleSignInConfigured,
    googleSignInButtonHtml,
    googleWebSignInConfigured,
    socialProviderScript,
} from "./social-sign-in.js";

function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function shell(title: string, body: string, step?: string): string {
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#f6f1e7"><title>${escapeHtml(title)} — Munch</title><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/editorial.css"></head>
<body class="auth-page"><main class="auth-main"><section class="auth-card"><a class="brand" href="/" aria-label="Munch home"><img class="brand-logo" src="/brand/munch-mark.svg" alt=""><span>Munch</span></a>${step ? `<p class="section-kicker spacer-top">${escapeHtml(step)}</p>` : ""}${body}</section></main></body></html>`;
}

function privateHtml(c: Context, html: string) {
    c.header("Cache-Control", "no-store, private");
    c.header("Pragma", "no-cache");
    c.header("Referrer-Policy", "no-referrer");
    c.header("X-Robots-Tag", "noindex, nofollow");
    return c.html(html);
}

export function boundedOAuthQuery(value: unknown): string | undefined {
    return typeof value === "string" &&
        value.length > 0 &&
        value.length <= 12_000
        ? value
        : undefined;
}

/**
 * Better Auth signs the authorization transaction exactly as received. Preserve
 * the query byte-for-byte; rebuilding URLSearchParams can reorder repeated
 * values or change the signature representation.
 */
export function signedOAuthQuery(requestUrl: string): string | undefined {
    const url = new URL(requestUrl);
    const nested = boundedOAuthQuery(url.searchParams.get("oauth_query"));
    if (nested) return nested;
    return boundedOAuthQuery(
        url.search.startsWith("?") ? url.search.slice(1) : "",
    );
}

function publicClientName(value: unknown): string {
    const record = value as Record<string, unknown> | null;
    const candidate = record?.client_name ?? record?.name;
    return typeof candidate === "string" && candidate.trim()
        ? candidate.trim()
        : "ChatGPT or this MCP client";
}

function connectionError(c: Context, stage: string, error?: unknown) {
    console.error("Better Auth connection stage failed", {
        stage,
        errorName: error instanceof Error ? error.name : "unknown",
    });
    return c.redirect("/connect/error", 303);
}

/**
 * The connect shell's sign-in page. Pure so the configured-gating is
 * testable without a database: Google renders only when the web OAuth
 * client is configured (the same condition that registers the Better Auth
 * provider), so unconfigured deployments keep the exact page they had.
 * Initiation is shared with the Amendment I link flow through
 * src/auth/social-sign-in.ts.
 */
export function signInPageHtml(input: {
    returnTo: string;
    oauthQuery?: string;
    googleConfigured: boolean;
    /** S6 slice 10: Apple renders only when the full Apple identifier
     * set is configured (the provider-registration condition) — honest
     * absence until then, never a dead button. Optional so existing
     * callers/tests that predate the Apple control keep their shape. */
    appleConfigured?: boolean;
}): string {
    const { returnTo, oauthQuery } = input;
    const passwordParams = new URLSearchParams({ return_to: returnTo });
    if (oauthQuery) passwordParams.set("oauth_query", oauthQuery);
    const passwordHref = `/account/password?${passwordParams.toString()}`;

    const socialButtons = [
        input.googleConfigured
            ? googleSignInButtonHtml({
                  callbackURL: returnTo,
                  errorCallbackURL: "/connect/error",
                  oauthQuery,
              })
            : "",
        input.appleConfigured
            ? appleSignInButtonHtml({
                  callbackURL: returnTo,
                  errorCallbackURL: "/connect/error",
                  oauthQuery,
              })
            : "",
    ].join("");
    const googleBlock = socialButtons
        ? `<p class="auth-divider" aria-hidden="true"><span>or</span></p><div class="auth-social">${socialButtons}${socialProviderScript()}</div><p class="auth-footnote auth-social-error" data-social-error role="alert"></p>`
        : "";

    return shell(
        "Sign in",
        `<h1>Connect Munch to ChatGPT</h1><p>Use your email to continue. We will send a secure, single-use sign-in link.</p><form class="auth-form" method="post" action="/connect/request"><input type="hidden" name="return_to" value="${escapeHtml(returnTo)}">${oauthQuery ? `<input type="hidden" name="oauth_query" value="${escapeHtml(oauthQuery)}">` : ""}<label class="field" for="email"><span>Email address</span><input id="email" name="email" type="email" inputmode="email" autocomplete="email" required maxlength="320"></label><button class="button button-primary" type="submit">Send sign-in link</button></form>${googleBlock}<p class="auth-footnote">No password is created or stored.</p><p class="auth-footnote"><a href="${escapeHtml(passwordHref)}">Use a username and password instead</a></p>${oauthQuery ? `<p class="auth-footnote">Connecting Munch to an AI app uses MCP access, which is part of Munch Premium.</p>` : ""}`,
        "Secure connection",
    );
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
            signInPageHtml({
                returnTo,
                oauthQuery,
                googleConfigured: googleWebSignInConfigured(
                    getBetterAuthRuntimeConfig(),
                ),
                appleConfigured: appleSignInConfigured(
                    getBetterAuthRuntimeConfig(),
                ),
            }),
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
                    `<h1>Enter a valid email address.</h1><p>Check the address and try again.</p><div class="auth-actions"><a class="button button-primary" href="/connect/sign-in?${retry.toString()}">Try again</a></div>`,
                    "Email needed",
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
                `<h1>Check your email</h1><p>If the address can receive Munch email, a single-use sign-in link is on the way. It expires automatically.</p><div class="auth-status" role="status"><span aria-hidden="true">✓</span><span>You can close this tab after opening the email.</span></div>`,
                "Magic link sent",
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
                `<h1>Continue signing in</h1><p>Confirm this single-use link to continue. This extra step prevents automated email scanners from using it first.</p><form class="auth-form" method="post" action="/connect/confirm"><input type="hidden" name="token" value="${escapeHtml(token)}"><input type="hidden" name="return_to" value="${escapeHtml(returnTo)}"><button class="button button-primary" type="submit">Continue signing in</button></form>`,
                "One final step",
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
                query: { token, callbackURL: returnTo },
                asResponse: true,
            });
        } catch (error) {
            return connectionError(c, "magic_link_verify", error);
        }
    });

    connect.get("/connect/consent", async (c) => {
        const clientId = c.req.query("client_id") ?? "";
        const scope = c.req.query("scope") ?? "";
        const oauthQuery = signedOAuthQuery(c.req.url);
        if (!clientId || !scope || !oauthQuery) {
            return connectionError(c, "consent_query");
        }

        const auth = getMunchBetterAuth();
        let session;
        try {
            session = await auth.api.getSession({ headers: c.req.raw.headers });
        } catch (error) {
            return connectionError(c, "consent_session", error);
        }
        if (!session?.user) {
            return c.redirect(
                `/connect/sign-in?oauth_query=${encodeURIComponent(oauthQuery)}`,
                303,
            );
        }

        const csrfToken = createOAuthConsentCsrfToken({
            userId: session.user.id,
            clientId,
            scope,
            oauthQuery,
        });

        let clientName = "ChatGPT or this MCP client";
        try {
            clientName = publicClientName(
                await auth.api.getOAuthClientPublic({
                    headers: c.req.raw.headers,
                    query: { client_id: clientId },
                }),
            );
        } catch {
            // Authorization remains bound to Better Auth's signed transaction.
        }

        // MCP entitlement gate (Amendment D, 2026-11-09): MCP access is part
        // of Premium, so a Free account cannot approve a new connection —
        // and therefore cannot mint a new token. Already-issued tokens are
        // covered at the MCP tool layer, where every request re-resolves
        // the current entitlement. Premium itself is started and managed
        // only on the Munch website; this page explains and routes, it
        // never starts a purchase.
        const capabilityResolution = await resolveMunchCapabilitiesSafe(
            session.user.id,
        );
        if (capabilityResolution.capabilities.tier !== "premium") {
            return privateHtml(
                c,
                shell(
                    "MCP access is part of Premium",
                    `<h1>MCP access is part of Premium</h1><div class="consent-account"><span>Connected Munch account</span><strong>${escapeHtml(session.user.email)}</strong></div><p>Connecting ${escapeHtml(clientName)} to Munch uses Munch's MCP tools, and MCP access is one of the things Munch Premium covers ($3/month). This account does not have Premium, so this connection cannot be approved.</p><p>The Munch website and app stay free and fully featured on this account. Premium is started and managed on the Munch website, never inside an AI app.</p><div class="auth-actions"><a class="button button-primary" href="/app/settings/billing">Go to Plan &amp; billing on Munch</a><a class="button button-quiet" href="/">Munch home</a></div><p class="auth-footnote">Once Premium is active on this account, return to your AI app and choose Connect again.</p>`,
                    "About MCP access",
                ),
            );
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
                `<h1>Connect ${escapeHtml(clientName)}</h1><div class="consent-account"><span>Connected Munch account</span><strong>${escapeHtml(session.user.email)}</strong></div><p>ChatGPT is requesting the permissions listed below. It does not receive unrelated ChatGPT conversations.</p><p>MCP access is part of Munch Premium, which is active on this account.</p><ul class="consent-scope-list">${scopeItems}</ul><form class="consent-actions" method="post" action="/connect/consent"><input type="hidden" name="client_id" value="${escapeHtml(clientId)}"><input type="hidden" name="scope" value="${escapeHtml(scope)}"><input type="hidden" name="oauth_query" value="${escapeHtml(oauthQuery)}"><input type="hidden" name="csrf_token" value="${escapeHtml(csrfToken)}"><button class="button button-primary" type="submit" name="decision" value="approve">Approve connection</button><button class="button button-quiet" type="submit" name="decision" value="deny">Deny</button></form><p class="auth-footnote">You can revoke this connection later from your Munch account.</p>`,
                "Review permissions",
            ),
        );
    });

    connect.get("/connect/error", (c) =>
        privateHtml(
            c,
            shell(
                "Connection problem",
                `<h1>This connection could not be completed.</h1><p>The sign-in or authorization request may have expired. Return to ChatGPT and choose Connect again.</p><div class="auth-actions"><a class="button button-primary" href="/connect/sign-in">Try signing in again</a></div>`,
                "Connection unavailable",
            ),
        ),
    );

    return connect;
}
