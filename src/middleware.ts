import type { Context, Next } from "hono";
import { getUserIdByToken } from "./supabase.js";
import { checkRateLimit } from "./rate-limit.js";

function getBaseUrl(c: Context): string {
    const proto = c.req.header("x-forwarded-proto") || "http";
    const host = c.req.header("x-forwarded-host") || c.req.header("host");
    if (host) return `${proto}://${host}`;
    return new URL(c.req.url).origin;
}

export const authenticateBearer = async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        const baseUrl = getBaseUrl(c);
        const resourceMetadataUrl = `${baseUrl}/.well-known/oauth-protected-resource`;
        c.header(
            "WWW-Authenticate",
            `Bearer resource_metadata="${resourceMetadataUrl}"`,
        );
        return c.json(
            {
                error: "unauthorized",
                error_description: "Bearer token required",
            },
            401,
        );
    }

    const token = authHeader.substring(7);
    const userId = await getUserIdByToken(token);

    if (!userId) {
        const baseUrl = getBaseUrl(c);
        const resourceMetadataUrl = `${baseUrl}/.well-known/oauth-protected-resource`;
        c.header(
            "WWW-Authenticate",
            `Bearer resource_metadata="${resourceMetadataUrl}"`,
        );
        return c.json(
            {
                error: "invalid_token",
                error_description: "Token is invalid or expired",
            },
            401,
        );
    }

    c.set("accessToken", token);
    c.set("userId", userId);
    await next();
};

export const rateLimit = async (c: Context, next: Next) => {
    const userId = c.get("userId") as string | undefined;
    if (!userId) {
        await next();
        return;
    }
    const result = checkRateLimit(userId);
    c.header("X-RateLimit-Limit", String(result.limit));
    c.header("X-RateLimit-Remaining", String(result.remaining));
    if (!result.allowed) {
        c.header("Retry-After", String(result.retryAfterSeconds ?? 60));
        return c.json(
            {
                error: "rate_limited",
                error_description: `Rate limit exceeded (${result.limit} requests per minute). Retry after ${result.retryAfterSeconds}s.`,
            },
            429,
        );
    }
    await next();
};
