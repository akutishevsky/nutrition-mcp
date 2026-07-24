import { Hono, type Context } from "hono";
import crypto from "node:crypto";
import {
    storeToken,
    storeAuthCode,
    consumeAuthCode,
    signUpUser,
    signInUser,
    signInWithGoogleIdToken,
    storeRefreshToken,
    consumeRefreshToken,
    registerClient,
} from "./supabase.js";
import { getBaseUrl } from "./url.js";
import { rateLimitAuth } from "./middleware.js";

const SESSION_TTL_MS = 10 * 60 * 1000;

interface OAuthSession {
    state: string;
    redirectUri: string;
    codeChallenge?: string;
    clientId: string;
    // Raw nonce for an in-flight Google sign-in; the hashed form is sent to
    // Google and the raw value is handed to signInWithIdToken on callback.
    googleNonce?: string;
}

// In-memory session store (sessions are short-lived, 10min TTL)
const sessions = new Map<
    string,
    { session: OAuthSession; expiresAt: number }
>();

function cleanExpiredSessions() {
    const now = Date.now();
    for (const [key, value] of sessions) {
        if (value.expiresAt < now) sessions.delete(key);
    }
}

setInterval(cleanExpiredSessions, 60 * 1000);

function base64URLEncode(buffer: Buffer): string {
    return buffer
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export async function renderLoginPage(
    sessionId: string,
    error?: string,
): Promise<string> {
    const template = await Bun.file("./public/login.html").text();
    const errorHtml = error
        ? `<div class="error-banner">${escapeHtml(error)}</div>`
        : "";
    return template
        .replaceAll("{{SESSION_ID}}", escapeHtml(sessionId))
        .replaceAll("{{ERROR}}", errorHtml);
}

// Mint an authorization code for the now-authenticated user and redirect back to
// the MCP client. Shared by the password (/approve) and Google callback paths so
// the two can't drift. Consumes the session.
async function finishAuthorization(
    c: Context,
    sessionId: string,
    session: OAuthSession,
    userId: string,
): Promise<Response> {
    sessions.delete(sessionId);

    const authCode = crypto.randomUUID();
    await storeAuthCode(
        authCode,
        session.redirectUri,
        userId,
        session.codeChallenge,
    );

    const redirectUrl = new URL(session.redirectUri);
    redirectUrl.searchParams.set("code", authCode);
    redirectUrl.searchParams.set("state", session.state);

    return c.redirect(redirectUrl.toString());
}

// Every path this router serves. Kept in sync with the oauth.get/oauth.post
// registrations below — a route added there but missing here is unthrottled.
export const OAUTH_PATHS = [
    "/register",
    "/authorize",
    "/approve",
    "/authorize/google",
    "/auth/google/callback",
    "/token",
] as const;

export function createOAuthRouter() {
    const oauth = new Hono();

    // Per-IP rate limit across all OAuth endpoints — these are unauthenticated,
    // so this is the only throttle standing between the internet and signup /
    // sign-in / token issuance.
    //
    // Deliberately NOT `oauth.use("*", ...)`: this router is mounted at the root
    // (`app.route("/", createOAuthRouter())`) because the OAuth paths are
    // spec-fixed there, and Hono applies a sub-app's wildcard middleware to
    // *every* path of the parent app — a wildcard here rate-limited /mcp too,
    // capping authenticated MCP traffic at the 30/min per-IP auth limit. Listing
    // the endpoints explicitly keeps the limiter from leaking beyond OAuth again.
    for (const path of OAUTH_PATHS) {
        oauth.use(path, rateLimitAuth);
    }

    const clientId = process.env.OAUTH_CLIENT_ID;
    const clientSecret = process.env.OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Missing OAUTH_CLIENT_ID or OAUTH_CLIENT_SECRET");
    }

    // Dynamic client registration (required by MCP spec)
    oauth.post("/register", async (c) => {
        const body = await c.req.json();

        // Fire-and-forget: track who registers
        registerClient(body.client_name ?? null, body.redirect_uris ?? []);

        return c.json({
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uris: body.redirect_uris || [],
        });
    });

    // Authorization endpoint
    oauth.get("/authorize", async (c) => {
        const responseType = c.req.query("response_type");
        const reqClientId = c.req.query("client_id");
        const redirectUri = c.req.query("redirect_uri");
        const state = c.req.query("state");
        const codeChallenge = c.req.query("code_challenge");

        if (responseType !== "code") {
            return c.json({ error: "unsupported_response_type" }, 400);
        }
        if (!redirectUri || !state || !reqClientId) {
            return c.json(
                {
                    error: "invalid_request",
                    error_description:
                        "client_id, redirect_uri, and state are required",
                },
                400,
            );
        }
        if (reqClientId !== clientId) {
            return c.json({ error: "invalid_client" }, 400);
        }

        cleanExpiredSessions();

        // Store session and show login page
        const sessionId = crypto.randomUUID();
        sessions.set(sessionId, {
            session: {
                state,
                redirectUri,
                codeChallenge,
                clientId: reqClientId,
            },
            expiresAt: Date.now() + SESSION_TTL_MS,
        });

        return c.html(await renderLoginPage(sessionId));
    });

    // Login/register endpoint — user submits email + password
    oauth.post("/approve", async (c) => {
        const body = await c.req.parseBody();
        const sessionId = body.session_id as string;
        const email = (body.email as string)?.trim().toLowerCase();
        const password = body.password as string;
        const action = body.action as string;

        if (!sessionId || !email || !password) {
            return c.json({ error: "invalid_request" }, 400);
        }

        const entry = sessions.get(sessionId);
        if (!entry || entry.expiresAt < Date.now()) {
            sessions.delete(sessionId);
            return c.json({ error: "session_expired" }, 400);
        }

        let userId: string;
        try {
            // Try sign-in first; if user doesn't exist, sign them up
            try {
                userId = await signInUser(email, password);
            } catch {
                userId = await signUpUser(email, password);
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Authentication failed";
            return c.html(await renderLoginPage(sessionId, message), 400);
        }

        return finishAuthorization(c, sessionId, entry.session, userId);
    });

    // Google sign-in — step 1: redirect the user to Google's consent screen.
    // We run the Google OAuth dance ourselves (rather than Supabase's PKCE
    // redirect flow) so nothing needs to persist across requests beyond the
    // existing in-memory session.
    oauth.get("/authorize/google", async (c) => {
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!googleClientId || !googleClientSecret) {
            return c.json({ error: "google_not_configured" }, 500);
        }

        const sessionId = c.req.query("session_id");
        if (!sessionId) {
            return c.json({ error: "invalid_request" }, 400);
        }

        cleanExpiredSessions();
        const entry = sessions.get(sessionId);
        if (!entry || entry.expiresAt < Date.now()) {
            sessions.delete(sessionId);
            return c.json({ error: "session_expired" }, 400);
        }

        // Fresh nonce per attempt. Supabase expects the SHA-256 *hex* digest sent
        // to the provider and the raw value handed to signInWithIdToken.
        const rawNonce = crypto.randomUUID();
        const hashedNonce = crypto
            .createHash("sha256")
            .update(rawNonce)
            .digest("hex");
        entry.session.googleNonce = rawNonce;

        const googleUrl = new URL(
            "https://accounts.google.com/o/oauth2/v2/auth",
        );
        googleUrl.searchParams.set("client_id", googleClientId);
        googleUrl.searchParams.set(
            "redirect_uri",
            `${getBaseUrl(c)}/auth/google/callback`,
        );
        googleUrl.searchParams.set("response_type", "code");
        googleUrl.searchParams.set("scope", "openid email profile");
        googleUrl.searchParams.set("state", sessionId);
        googleUrl.searchParams.set("nonce", hashedNonce);
        googleUrl.searchParams.set("prompt", "select_account");

        return c.redirect(googleUrl.toString());
    });

    // Google sign-in — step 2: Google redirects back here. Exchange the code for
    // an ID token (back-channel), trade it with Supabase for a user, then mint
    // our authorization code exactly like the password path.
    oauth.get("/auth/google/callback", async (c) => {
        const sessionId = c.req.query("state");
        if (!sessionId) {
            return c.json({ error: "invalid_request" }, 400);
        }

        cleanExpiredSessions();
        const entry = sessions.get(sessionId);
        if (!entry || entry.expiresAt < Date.now()) {
            sessions.delete(sessionId);
            return c.json({ error: "session_expired" }, 400);
        }

        // Surface user-cancelled / denied consent without treating it as a crash.
        const renderError = async (message: string) => {
            entry.session.googleNonce = undefined;
            return c.html(await renderLoginPage(sessionId, message), 400);
        };

        if (c.req.query("error")) {
            return renderError(
                "Google sign-in was cancelled. Please try again.",
            );
        }

        const code = c.req.query("code");
        const rawNonce = entry.session.googleNonce;
        // googleNonce is only set by /authorize/google, so its absence means this
        // callback didn't originate from a flow we started.
        if (!code || !rawNonce) {
            return renderError("Google sign-in failed. Please try again.");
        }

        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!googleClientId || !googleClientSecret) {
            return c.json({ error: "google_not_configured" }, 500);
        }

        try {
            const tokenRes = await fetch(
                "https://oauth2.googleapis.com/token",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        code,
                        client_id: googleClientId,
                        client_secret: googleClientSecret,
                        // Must byte-match the redirect_uri sent in /authorize/google.
                        redirect_uri: `${getBaseUrl(c)}/auth/google/callback`,
                        grant_type: "authorization_code",
                    }),
                },
            );

            if (!tokenRes.ok) {
                return renderError("Google sign-in failed. Please try again.");
            }

            const tokenData = (await tokenRes.json()) as { id_token?: string };
            if (!tokenData.id_token) {
                return renderError("Google sign-in failed. Please try again.");
            }

            const userId = await signInWithGoogleIdToken(
                tokenData.id_token,
                rawNonce,
            );

            return finishAuthorization(c, sessionId, entry.session, userId);
        } catch {
            return renderError("Google sign-in failed. Please try again.");
        }
    });

    // Token endpoint
    oauth.post("/token", async (c) => {
        const body = await c.req.parseBody();
        const grantType = body.grant_type as string;
        const code = body.code as string;
        const codeVerifier = body.code_verifier as string | undefined;
        const redirectUri = body.redirect_uri as string;
        const reqClientId = body.client_id as string | undefined;
        const reqClientSecret = body.client_secret as string | undefined;

        if (grantType === "refresh_token") {
            const refreshToken = body.refresh_token as string;
            if (!refreshToken) {
                return c.json({ error: "invalid_request" }, 400);
            }

            // Look up the existing user from the refresh token
            const userId = await consumeRefreshToken(refreshToken);
            if (!userId) {
                return c.json({ error: "invalid_grant" }, 400);
            }

            const newAccessToken = crypto.randomUUID();
            const newRefreshToken = crypto.randomUUID();
            await storeToken(newAccessToken, userId);
            await storeRefreshToken(newRefreshToken, userId);

            return c.json({
                access_token: newAccessToken,
                token_type: "Bearer",
                expires_in: 365 * 24 * 60 * 60,
                refresh_token: newRefreshToken,
            });
        }

        if (grantType !== "authorization_code") {
            return c.json({ error: "unsupported_grant_type" }, 400);
        }

        if (!code) {
            return c.json({ error: "invalid_request" }, 400);
        }

        // Validate client credentials if provided
        if (reqClientId && reqClientId !== clientId) {
            return c.json({ error: "invalid_client" }, 401);
        }
        if (reqClientSecret && reqClientSecret !== clientSecret) {
            return c.json({ error: "invalid_client" }, 401);
        }

        // Atomically consume the auth code
        const authCodeData = await consumeAuthCode(code);
        if (!authCodeData) {
            return c.json({ error: "invalid_grant" }, 400);
        }

        // Validate redirect_uri
        if (redirectUri && redirectUri !== authCodeData.redirect_uri) {
            return c.json({ error: "invalid_grant" }, 400);
        }

        // Validate PKCE
        if (authCodeData.code_challenge) {
            if (!codeVerifier) {
                return c.json(
                    {
                        error: "invalid_request",
                        error_description: "code_verifier required",
                    },
                    400,
                );
            }
            const hash = base64URLEncode(
                Buffer.from(
                    crypto.createHash("sha256").update(codeVerifier).digest(),
                ),
            );
            if (hash !== authCodeData.code_challenge) {
                return c.json({ error: "invalid_grant" }, 400);
            }
        }

        // Issue tokens linked to the authenticated user
        const accessToken = crypto.randomUUID();
        const refreshToken = crypto.randomUUID();
        await storeToken(accessToken, authCodeData.user_id);
        await storeRefreshToken(refreshToken, authCodeData.user_id);

        return c.json({
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: 365 * 24 * 60 * 60,
            refresh_token: refreshToken,
        });
    });

    return oauth;
}
