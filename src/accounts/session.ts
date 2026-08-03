import type { Context, Next } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import {
    resolveWebSession,
    revokeWebSession,
    type AuthenticatedWebSession,
} from "./repository.js";

declare module "hono" {
    interface ContextVariableMap {
        munchUserId: string;
        munchUserEmail: string;
    }
}

export const MUNCH_SESSION_COOKIE = "munch_session";

export function setWebSessionCookie(
    c: Context,
    session: AuthenticatedWebSession,
): void {
    const maxAge = Math.max(
        0,
        Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
    );
    setCookie(c, MUNCH_SESSION_COOKIE, session.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/",
        maxAge,
    });
}

export async function requireWebSession(c: Context, next: Next) {
    const token = getCookie(c, MUNCH_SESSION_COOKIE);
    if (!token) {
        return c.json({ error: "authentication_required" }, 401);
    }

    const session = await resolveWebSession(token);
    if (!session) {
        deleteCookie(c, MUNCH_SESSION_COOKIE, { path: "/" });
        return c.json({ error: "invalid_session" }, 401);
    }

    c.set("munchUserId", session.userId);
    c.set("munchUserEmail", session.email);
    await next();
}

export async function clearWebSession(c: Context): Promise<void> {
    const token = getCookie(c, MUNCH_SESSION_COOKIE);
    if (token) {
        await revokeWebSession(token);
    }
    deleteCookie(c, MUNCH_SESSION_COOKIE, { path: "/" });
}
