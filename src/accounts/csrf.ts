import type { Context, Next } from "hono";
import { getBaseUrl } from "../url.js";

function normalizedOrigin(value: string): string | null {
    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
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

    return (
        !input.requestOrigin &&
        input.secFetchSite === "same-origin" &&
        requestOriginMatches(input.requestBaseUrl, input.configuredBaseUrl)
    );
}

export async function requireSameOrigin(c: Context, next: Next) {
    const configuredBaseUrl = process.env.MUNCH_APP_BASE_URL?.trim();
    if (!configuredBaseUrl) {
        return c.json({ error: "application_not_configured" }, 503);
    }

    const requestBaseUrl = getBaseUrl(c);
    if (
        !requestHasSameOriginEvidence({
            requestOrigin: c.req.header("origin"),
            configuredBaseUrl,
            requestBaseUrl,
            secFetchSite: c.req.header("sec-fetch-site"),
        })
    ) {
        console.warn("Rejected request with invalid origin", {
            requestOrigin: c.req.header("origin") ? "present" : "missing",
            requestBaseUrl,
        });
        return c.json({ error: "invalid_request_origin" }, 403);
    }

    await next();
}
