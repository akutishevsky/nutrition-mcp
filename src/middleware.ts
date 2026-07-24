import type { Context, Next } from "hono";
import { getUserIdByToken } from "./supabase.js";
import { maskIp } from "./net.js";

// Declare the context variables this middleware sets. Without it, c.get/c.set on
// an untyped `new Hono()` app types its keys as `never`, so index.ts cannot read
// suppressAccessLog.
declare module "hono" {
    interface ContextVariableMap {
        userId: string;
        accessToken: string;
        suppressAccessLog: boolean;
    }
}
import {
    checkRateLimit,
    checkAuthRateLimit,
    noteAuthFailure,
    clearAuthFailures,
    getBanState,
} from "./rate-limit.js";

// Best-effort client IP for rate limiting. Behind DigitalOcean's proxy the real
// IP is the first entry of x-forwarded-for; fall back to x-real-ip. "unknown"
// only applies when no proxy header is present (e.g. direct local requests), in
// which case those callers share a single bucket — acceptable since production
// always sits behind the proxy.
function getClientIp(c: Context): string {
    const forwardedFor = c.req.header("x-forwarded-for");
    if (forwardedFor) {
        const first = forwardedFor.split(",")[0]?.trim();
        if (first) return first;
    }
    return c.req.header("x-real-ip")?.trim() || "unknown";
}

function getBaseUrl(c: Context): string {
    const proto = c.req.header("x-forwarded-proto") || "http";
    const host = c.req.header("x-forwarded-host") || c.req.header("host");
    if (host) return `${proto}://${host}`;
    return new URL(c.req.url).origin;
}

// Shared 401 path. Every rejection also counts a strike against the client IP so
// a client that never recovers eventually gets shed by banRepeatAuthFailures.
function rejectUnauthenticated(
    c: Context,
    error: "unauthorized" | "invalid_token",
    description: string,
) {
    const ip = getClientIp(c);
    const ban = noteAuthFailure(ip);
    // Reaching here means the ban guard let the request through, so a banned
    // result is necessarily a *newly* tripped ban — log the transition once
    // rather than on every suppressed request that follows.
    if (ban.banned) {
        console.log(
            `[ban] ${maskIp(c.req.header("x-forwarded-for"))} repeated auth failures on ${c.req.path} — shedding for ${ban.retryAfterSeconds}s`,
        );
    }

    const resourceMetadataUrl = `${getBaseUrl(c)}/.well-known/oauth-protected-resource`;
    c.header(
        "WWW-Authenticate",
        `Bearer resource_metadata="${resourceMetadataUrl}"`,
    );
    return c.json({ error, error_description: description }, 401);
}

export const authenticateBearer = async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return rejectUnauthenticated(
            c,
            "unauthorized",
            "Bearer token required",
        );
    }

    const token = authHeader.substring(7);
    const lookup = await getUserIdByToken(token);

    if (lookup.status === "unavailable") {
        // We could not verify the token, so this is not the client's fault:
        // answer 401 as before, but record no strike. Otherwise a Supabase
        // outage would ban every active user and outlast the outage itself.
        c.header(
            "WWW-Authenticate",
            `Bearer resource_metadata="${getBaseUrl(c)}/.well-known/oauth-protected-resource"`,
        );
        return c.json(
            {
                error: "invalid_token",
                error_description: "Unable to verify token, try again",
            },
            401,
        );
    }

    if (lookup.status === "invalid") {
        return rejectUnauthenticated(
            c,
            "invalid_token",
            "Token is invalid or expired",
        );
    }

    // A success clears the IP's strike count. This is what keeps a shared egress
    // IP — one broken client alongside working ones — from ever accumulating the
    // consecutive failures a ban requires.
    clearAuthFailures(getClientIp(c));

    c.set("accessToken", token);
    c.set("userId", lookup.userId);
    await next();
};

// Sheds clients that have failed authentication many times in a row — in
// practice an abandoned MCP client retrying a dead token indefinitely. Runs
// ahead of authenticateBearer so a banned IP costs one Map lookup instead of a
// token verification, and marks the request so the access log skips it: a single
// stuck client can otherwise outnumber real traffic in the logs by an order of
// magnitude and hide everything worth seeing.
export const banRepeatAuthFailures = async (c: Context, next: Next) => {
    const ban = getBanState(getClientIp(c));
    if (ban.banned) {
        c.set("suppressAccessLog", true);
        c.header("Retry-After", String(ban.retryAfterSeconds ?? 60));
        return c.json(
            {
                error: "rate_limited",
                error_description: `Too many failed authentication attempts. Retry after ${ban.retryAfterSeconds}s.`,
            },
            429,
        );
    }
    await next();
};

// Per-IP rate limiter for the unauthenticated OAuth endpoints, where there is
// no user id yet. Guards against bulk signups and credential stuffing.
export const rateLimitAuth = async (c: Context, next: Next) => {
    const result = checkAuthRateLimit(getClientIp(c));
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
