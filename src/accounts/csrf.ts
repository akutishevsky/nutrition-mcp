import type { Context, Next } from "hono";

export function requestOriginMatches(
    requestOrigin: string | undefined,
    appBaseUrl: string,
): boolean {
    if (!requestOrigin) return false;

    try {
        return new URL(requestOrigin).origin === new URL(appBaseUrl).origin;
    } catch {
        return false;
    }
}

export async function requireSameOrigin(c: Context, next: Next) {
    const appBaseUrl = process.env.MUNCH_APP_BASE_URL?.trim();
    if (!appBaseUrl) {
        return c.json({ error: "application_not_configured" }, 503);
    }

    if (!requestOriginMatches(c.req.header("origin"), appBaseUrl)) {
        return c.json({ error: "invalid_request_origin" }, 403);
    }

    await next();
}
