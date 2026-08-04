import { Hono, type Context } from "hono";
import { requireSameOrigin } from "../accounts/csrf.js";
import { getMunchBetterAuth } from "./auth.js";
import { safeMagicLinkReturnPath } from "./magic-link-url.js";

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
<body class="auth-page"><div class="auth-layout"><aside class="auth-brand-panel"><a class="brand" href="/"><img class="brand-logo" src="/brand/munch-mark-white.svg" alt=""><span>Munch</span></a><div class="auth-brand-copy"><p class="eyebrow">Secure ChatGPT connection</p><h1>Nutrition memory for <span>ChatGPT.</span></h1><p>Sign in once, approve the connection, and return to ChatGPT.</p></div></aside><main class="auth-main"><section class="auth-card">${body}</section></main></div></body></html>`;
}

function privateHtml(c: Context, html: string) {
    c.header("Cache-Control", "no-store, private");
    c.header("Pragma", "no-cache");
    c.header("Referrer-Policy", "no-referrer");
    return c.html(html);
}

export function createBetterAuthConnectRouter(): Hono {
    const connect = new Hono();

    connect.get("/connect/sign-in", async (c) => {
        const returnTo = safeMagicLinkReturnPath(c.req.query("return_to"));
        const session = await getMunchBetterAuth().api.getSession({
            headers: c.req.raw.headers,
        });
        if (session?.user) return c.redirect(returnTo, 303);

        return privateHtml(
            c,
            shell(
                "Sign in",
                `<p class="section-kicker">Munch account</p><h1>Sign in with your email</h1><p>We will send a single-use link. If this email is new, your Munch account will be created automatically.</p><form class="auth-form" method="post" action="/connect/request"><input type="hidden" name="return_to" value="${escapeHtml(returnTo)}"><div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required maxlength="320"></div><button class="button button-primary" type="submit">Send magic link</button></form><p class="auth-footnote">No password is created or stored.</p>`,
            ),
        );
    });

    connect.post("/connect/request", requireSameOrigin, async (c) => {
        const body = await c.req.parseBody();
        const email = typeof body.email === "string" ? body.email.trim() : "";
        const returnTo = safeMagicLinkReturnPath(body.return_to);
        if (!email || email.length > 320) {
            return privateHtml(
                c,
                shell(
                    "Sign-in problem",
                    `<h1>Enter a valid email address.</h1><div class="portal-actions"><a class="button button-primary" href="/connect/sign-in?return_to=${encodeURIComponent(returnTo)}">Try again</a></div>`,
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

    connect.get("/connect/error", (c) =>
        privateHtml(
            c,
            shell(
                "Sign-in problem",
                `<p class="section-kicker">Link unavailable</p><h1>This sign-in link cannot be used.</h1><p>It may have expired or already been consumed. Request another link to continue.</p><div class="portal-actions"><a class="button button-primary" href="/connect/sign-in">Request a new link</a></div>`,
            ),
        ),
    );

    return connect;
}
