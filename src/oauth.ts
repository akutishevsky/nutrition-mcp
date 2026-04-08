import { Hono } from "hono";
import crypto from "node:crypto";
import {
    storeToken,
    storeAuthCode,
    consumeAuthCode,
    signUpUser,
    signInUser,
    storeRefreshToken,
    consumeRefreshToken,
    registerClient,
} from "./supabase.js";

const SESSION_TTL_MS = 10 * 60 * 1000;

interface OAuthSession {
    state: string;
    redirectUri: string;
    codeChallenge?: string;
    clientId: string;
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

async function renderLoginPage(
    sessionId: string,
    error?: string,
): Promise<string> {
    const template = await Bun.file("./public/login.html").text();
    const errorHtml = error
        ? `<div class="error-banner">${escapeHtml(error)}</div>`
        : "";
    return template
        .replace("{{SESSION_ID}}", escapeHtml(sessionId))
        .replace("{{ERROR}}", errorHtml);
}

export function createOAuthRouter() {
    const oauth = new Hono();

    const clientId = process.env.OAUTH_CLIENT_ID;
    const clientSecret = process.env.OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Missing OAUTH_CLIENT_ID or OAUTH_CLIENT_SECRET");
    }

    // Dynamic client registration (required by MCP spec)
    oauth.post("/register", async (c) => {
        const body = await c.req.json();

        // Fire-and-forget: track who registers
        registerClient(
            body.client_name ?? null,
            body.redirect_uris ?? [],
        );

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

        const session = entry.session;
        sessions.delete(sessionId);

        // Generate authorization code linked to the authenticated user
        const authCode = crypto.randomUUID();
        await storeAuthCode(
            authCode,
            session.redirectUri,
            userId,
            session.codeChallenge,
        );

        // Redirect back to MCP client with code + state
        const redirectUrl = new URL(session.redirectUri);
        redirectUrl.searchParams.set("code", authCode);
        redirectUrl.searchParams.set("state", session.state);

        return c.redirect(redirectUrl.toString());
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
