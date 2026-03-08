import { Hono } from "hono";
import crypto from "node:crypto";
import {
    storeToken,
    storeAuthCode,
    consumeAuthCode,
    createUser,
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

function base64URLEncode(buffer: Buffer): string {
    return buffer
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
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

        // Store session and show approval page
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

        // Return a simple HTML approval page
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Authorize Nutrition MCP</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: system-ui, sans-serif; max-width: 400px; margin: 80px auto; padding: 0 20px; text-align: center; }
        h1 { font-size: 1.5rem; }
        p { color: #666; margin: 1rem 0 2rem; }
        button { background: #2563eb; color: white; border: none; padding: 12px 32px; border-radius: 8px; font-size: 1rem; cursor: pointer; }
        button:hover { background: #1d4ed8; }
    </style>
</head>
<body>
    <h1>Nutrition MCP</h1>
    <p>Allow Claude to access your nutrition tracking data?</p>
    <form method="POST" action="/approve">
        <input type="hidden" name="session_id" value="${sessionId}" />
        <button type="submit">Approve</button>
    </form>
</body>
</html>`;

        return c.html(html);
    });

    // Approval endpoint — user clicks "Approve"
    oauth.post("/approve", async (c) => {
        const body = await c.req.parseBody();
        const sessionId = body.session_id as string;

        if (!sessionId) {
            return c.json({ error: "invalid_request" }, 400);
        }

        const entry = sessions.get(sessionId);
        if (!entry || entry.expiresAt < Date.now()) {
            sessions.delete(sessionId);
            return c.json({ error: "session_expired" }, 400);
        }

        const session = entry.session;
        sessions.delete(sessionId);

        // Generate authorization code
        const authCode = crypto.randomUUID();
        await storeAuthCode(
            authCode,
            session.redirectUri,
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
            // For refresh_token grant, create a new user + token
            const refreshToken = body.refresh_token as string;
            if (!refreshToken) {
                return c.json({ error: "invalid_request" }, 400);
            }

            const userId = await createUser();
            const newToken = crypto.randomUUID();
            await storeToken(newToken, userId);

            return c.json({
                access_token: newToken,
                token_type: "Bearer",
                expires_in: 365 * 24 * 60 * 60,
                refresh_token: crypto.randomUUID(),
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

        // Create user and issue access token
        const userId = await createUser();
        const accessToken = crypto.randomUUID();
        await storeToken(accessToken, userId);

        const refreshToken = crypto.randomUUID();

        return c.json({
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: 365 * 24 * 60 * 60,
            refresh_token: refreshToken,
        });
    });

    return oauth;
}
