import { safeLocalRedirectPath } from "./redirect.js";

export interface LoginDeliveryResult {
    mode: "external" | "development";
    developmentLoginUrl?: string;
}

function applicationBaseUrl(): string {
    const value = process.env.MUNCH_APP_BASE_URL?.trim();
    if (!value) {
        throw new Error("MUNCH_APP_BASE_URL is required");
    }
    return value;
}

export function buildLoginUrl(token: string, returnTo?: string): string {
    const url = new URL("/account/login/consume", applicationBaseUrl());
    url.searchParams.set("token", token);
    if (returnTo) {
        url.searchParams.set("return_to", safeLocalRedirectPath(returnTo));
    }
    return url.toString();
}

function developmentDeliveryEnabled(): boolean {
    return (
        process.env.NODE_ENV !== "production" &&
        process.env.MUNCH_DEV_EXPOSE_LOGIN_LINK === "true"
    );
}

function deliveryEndpoint(): URL | null {
    const value = process.env.MUNCH_LOGIN_DELIVERY_ENDPOINT?.trim();
    if (!value) return null;

    const url = new URL(value);
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
        throw new Error(
            "MUNCH_LOGIN_DELIVERY_ENDPOINT must use HTTPS outside local development",
        );
    }
    return url;
}

export async function deliverLoginLink(input: {
    email: string;
    token: string;
    expiresAt: Date;
    returnTo?: string;
}): Promise<LoginDeliveryResult> {
    const loginUrl = buildLoginUrl(input.token, input.returnTo);
    const endpoint = deliveryEndpoint();

    if (endpoint) {
        const secret = process.env.MUNCH_LOGIN_DELIVERY_SECRET?.trim();
        if (!secret) {
            throw new Error("MUNCH_LOGIN_DELIVERY_SECRET is required");
        }

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${secret}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: input.email,
                loginUrl,
                expiresAt: input.expiresAt.toISOString(),
                product: "Munch",
            }),
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            throw new Error("Login delivery provider rejected the request");
        }

        return { mode: "external" };
    }

    if (developmentDeliveryEnabled()) {
        return {
            mode: "development",
            developmentLoginUrl: loginUrl,
        };
    }

    throw new Error("Passwordless login delivery is not configured");
}
