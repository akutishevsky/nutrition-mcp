export interface BetterAuthRuntimeConfig {
    baseUrl: string;
    databaseUrl: string;
    secret: string;
    production: boolean;
    publicPasswordSignup: boolean;
    magicLinkExpiresIn: number;
    databasePoolSize: number;
    googleWebClientId?: string;
    googleAndroidClientId?: string;
    googleIosClientId?: string;
    googleClientSecret?: string;
    appleServicesId?: string;
    appleKeyId?: string;
    appleTeamId?: string;
    applePrivateKey?: string;
}

function required(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`${name} is required`);
    return value;
}

function optional(name: string): string | undefined {
    const value = process.env[name]?.trim();
    return value || undefined;
}

export function getBetterAuthRuntimeConfig(): BetterAuthRuntimeConfig {
    const baseUrl = required("MUNCH_APP_BASE_URL");
    const parsedBaseUrl = new URL(baseUrl);
    if (
        process.env.NODE_ENV === "production" &&
        parsedBaseUrl.protocol !== "https:"
    ) {
        throw new Error("MUNCH_APP_BASE_URL must use HTTPS in production");
    }
    if (
        parsedBaseUrl.pathname !== "/" ||
        parsedBaseUrl.search ||
        parsedBaseUrl.hash
    ) {
        throw new Error(
            "MUNCH_APP_BASE_URL must be an origin without path, query, or fragment",
        );
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

    const googleWebClientId = optional("MUNCH_GOOGLE_WEB_CLIENT_ID");
    const googleAndroidClientId = optional("MUNCH_GOOGLE_ANDROID_CLIENT_ID");
    // The iOS OAuth client: a native iOS Google sign-in presents ID tokens
    // whose audience is this client ID, so the server must accept it as a
    // Google ID-token audience alongside the web/Android clients. It is a
    // public identifier with no secret of its own — the shared web client
    // secret stays the provider's only secret.
    const googleIosClientId = optional("MUNCH_GOOGLE_IOS_CLIENT_ID");
    const googleClientSecret = optional("MUNCH_GOOGLE_CLIENT_SECRET");
    if (Boolean(googleWebClientId) !== Boolean(googleClientSecret)) {
        throw new Error(
            "MUNCH_GOOGLE_WEB_CLIENT_ID and MUNCH_GOOGLE_CLIENT_SECRET must be configured together",
        );
    }
    if (googleAndroidClientId && !googleWebClientId) {
        throw new Error(
            "MUNCH_GOOGLE_ANDROID_CLIENT_ID requires Google web client credentials",
        );
    }
    if (googleIosClientId && !googleWebClientId) {
        throw new Error(
            "MUNCH_GOOGLE_IOS_CLIENT_ID requires Google web client credentials",
        );
    }

    // Sign in with Apple identifiers (Amendment H, IOS-AUTH): the Services
    // ID, key ID, team ID, and .p8 private key are configured together or
    // not at all — the server generates the expiring Apple client-secret
    // JWT from these, so a partial set can never configure the provider.
    // Parsing them here lets the account-linking read model report Apple
    // as configured exactly when IOS-AUTH's provider registration can run.
    const appleServicesId = optional("MUNCH_APPLE_SERVICES_ID");
    const appleKeyId = optional("MUNCH_APPLE_KEY_ID");
    const appleTeamId = optional("MUNCH_APPLE_TEAM_ID");
    const applePrivateKey = optional("MUNCH_APPLE_PRIVATE_KEY");
    const appleValues = [
        appleServicesId,
        appleKeyId,
        appleTeamId,
        applePrivateKey,
    ];
    if (appleValues.some(Boolean) && !appleValues.every(Boolean)) {
        throw new Error(
            "MUNCH_APPLE_SERVICES_ID, MUNCH_APPLE_KEY_ID, MUNCH_APPLE_TEAM_ID, and MUNCH_APPLE_PRIVATE_KEY must be configured together",
        );
    }

    return {
        baseUrl: parsedBaseUrl.origin,
        databaseUrl: required("DATABASE_URL"),
        secret,
        production: process.env.NODE_ENV === "production",
        publicPasswordSignup:
            process.env.MUNCH_PUBLIC_PASSWORD_SIGNUP === "true",
        magicLinkExpiresIn,
        databasePoolSize,
        googleWebClientId,
        googleAndroidClientId,
        googleIosClientId,
        googleClientSecret,
        appleServicesId,
        appleKeyId,
        appleTeamId,
        applePrivateKey,
    };
}
