export type MunchAuthBackend = "custom" | "better_auth";

export interface BetterAuthRuntimeConfig {
    backend: MunchAuthBackend;
    baseUrl: string;
    databaseUrl: string;
    secret: string;
    production: boolean;
    magicLinkExpiresIn: number;
    databasePoolSize: number;
}

function required(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`${name} is required`);
    return value;
}

export function getMunchAuthBackend(): MunchAuthBackend {
    const value = process.env.MUNCH_AUTH_BACKEND?.trim() || "custom";
    if (value !== "custom" && value !== "better_auth") {
        throw new Error(
            "MUNCH_AUTH_BACKEND must be either custom or better_auth",
        );
    }
    return value;
}

export function betterAuthIsEnabled(): boolean {
    return getMunchAuthBackend() === "better_auth";
}

export function getBetterAuthRuntimeConfig(): BetterAuthRuntimeConfig {
    const backend = getMunchAuthBackend();
    const baseUrl = required("MUNCH_APP_BASE_URL");
    const parsedBaseUrl = new URL(baseUrl);
    if (
        process.env.NODE_ENV === "production" &&
        parsedBaseUrl.protocol !== "https:"
    ) {
        throw new Error("MUNCH_APP_BASE_URL must use HTTPS in production");
    }

    const secret = required("BETTER_AUTH_SECRET");
    if (secret.length < 32) {
        throw new Error(
            "BETTER_AUTH_SECRET must contain at least 32 characters",
        );
    }

    const magicLinkExpiresIn = Number(
        process.env.MUNCH_MAGIC_LINK_TTL_SECONDS || 600,
    );
    if (
        !Number.isInteger(magicLinkExpiresIn) ||
        magicLinkExpiresIn < 300 ||
        magicLinkExpiresIn > 3600
    ) {
        throw new Error(
            "MUNCH_MAGIC_LINK_TTL_SECONDS must be an integer from 300 to 3600",
        );
    }

    const databasePoolSize = Number(process.env.MUNCH_AUTH_DB_POOL_SIZE || 5);
    if (
        !Number.isInteger(databasePoolSize) ||
        databasePoolSize < 1 ||
        databasePoolSize > 20
    ) {
        throw new Error(
            "MUNCH_AUTH_DB_POOL_SIZE must be an integer from 1 to 20",
        );
    }

    return {
        backend,
        baseUrl: parsedBaseUrl.origin,
        databaseUrl: required("DATABASE_URL"),
        secret,
        production: process.env.NODE_ENV === "production",
        magicLinkExpiresIn,
        databasePoolSize,
    };
}
