import type { Context, Next } from "hono";
import { resourceMetadataUrl } from "../discovery.js";
import { maskIp } from "../net.js";
import {
    clearAuthFailures,
    noteAuthFailure,
} from "../rate-limit.js";
import { resolveAccessToken } from "./repository.js";

function clientIp(c: Context): string {
    const forwardedFor = c.req.header("x-forwarded-for");
    if (forwardedFor) {
        const first = forwardedFor.split(",")[0]?.trim();
        if (first) return first;
    }
    return c.req.header("x-real-ip")?.trim() || "unknown";
}

function baseUrl(c: Context): string {
    const proto = c.req.header("x-forwarded-proto") || "http";
    const host = c.req.header("x-forwarded-host") || c.req.header("host");
    return host ? `${proto}://${host}` : new URL(c.req.url).origin;
}

function rejectToken(c: Context, error: "unauthorized" | "invalid_token") {
    const ip = clientIp(c);
    const ban = noteAuthFailure(ip);
    if (ban.banned) {
        console.log(
            `[ban] ${maskIp(c.req.header("x-forwarded-for"))} repeated auth failures on ${c.req.path} — shedding for ${ban.retryAfterSeconds}s`,
        );
    }

    c.header(
        "WWW-Authenticate",
        `Bearer resource_metadata="${resourceMetadataUrl(baseUrl(c))}"`,
    );
    return c.json(
        {
            error,
            error_description:
                error === "unauthorized"
                    ? "Bearer token required"
                    : "Token is invalid or expired",
        },
        401,
    );
}

export async function authenticatePlatformBearer(c: Context, next: Next) {
    const authorization = c.req.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
        return rejectToken(c, "unauthorized");
    }

    const token = authorization.slice(7);
    try {
        const lookup = await resolveAccessToken(token);
        if (lookup.status !== "valid") {
            return rejectToken(c, "invalid_token");
        }

        clearAuthFailures(clientIp(c));
        c.set("accessToken", token);
        c.set("userId", lookup.userId);
        await next();
    } catch {
        c.header("Retry-After", "5");
        return c.json(
            {
                error: "temporarily_unavailable",
                error_description: "Unable to verify token, try again",
            },
            503,
        );
    }
}
