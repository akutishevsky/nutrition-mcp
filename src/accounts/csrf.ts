import type { Context, Next } from "hono";
import { getBaseUrl } from "../url.js";

function normalizedSingleOrigin(value: string): string | null {
    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
}

function normalizedOrigin(value: string): string | null {
    const candidates = value
        .split(",")
        .map((candidate) => candidate.trim())
        .filter(Boolean);
    if (candidates.length === 0) return null;

    const origins = candidates.map(normalizedSingleOrigin);
    const first = origins[0];
    if (!first || origins.some((origin) => origin !== first)) return null;
    return first;
}

function originLogValue(value: string | undefined): string {
    if (!value) return "missing";
    if (value === "null") return "null";
    return normalizedOrigin(value) ?? "malformed";
}

export function requestOriginMatches(
    requestOrigin: string | undefined,
    ...allowedOrigins: string[]
): boolean {
    if (!requestOrigin) return false;

    const normalizedRequestOrigin = normalizedOrigin(requestOrigin);
    if (!normalizedRequestOrigin) return false;

    return allowedOrigins.some(
        (allowedOrigin) =>
            normalizedOrigin(allowedOrigin) === normalizedRequestOrigin,
    );
}

export function requestHasSameOriginEvidence(input: {
    requestOrigin: string | undefined;
    configuredBaseUrl: string;
    requestBaseUrl: string;
    secFetchSite: string | undefined;
}): boolean {
    if (
        requestOriginMatches(
            input.requestOrigin,
            input.configuredBaseUrl,
            input.requestBaseUrl,
        )
    ) {
        return true;
    }

    const requestOriginIsUnavailable =
        !input.requestOrigin || normalizedOrigin(input.requestOrigin) === null;
    return (
        requestOriginIsUnavailable &&
        input.secFetchSite?.toLowerCase() === "same-origin" &&
        requestOriginMatches(input.requestBaseUrl, input.configuredBaseUrl)
    );
}

export async function requireSameOrigin(c: Context, next: Next) {
    const configuredBaseUrl = process.env.MUNCH_APP_BASE_URL?.trim();
    if (!configuredBaseUrl) {
        return c.json({ error: "application_not_configured" }, 503);
    }

    const requestOrigin = c.req.header("origin");
    const secFetchSite = c.req.header("sec-fetch-site");
    const requestBaseUrl = getBaseUrl(c);
    if (
        !requestHasSameOriginEvidence({
            requestOrigin,
            configuredBaseUrl,
            requestBaseUrl,
            secFetchSite,
        })
    ) {
        console.warn("Rejected request with invalid origin", {
            requestOrigin: originLogValue(requestOrigin),
            configuredOrigin: normalizedOrigin(configuredBaseUrl) ?? "invalid",
            requestBaseUrl,
            secFetchSite: secFetchSite ?? "missing",
        });
        return c.json({ error: "invalid_request_origin" }, 403);
    }

    await next();
}
