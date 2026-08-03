export interface PlatformConfig {
    databaseUrl: string;
    appBaseUrl: string;
    stripeSecretKey: string;
    stripeWebhookSecret: string;
    stripePriceId: string;
    sessionSecret: string;
}

function requiredEnvironmentVariable(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function normalizedBaseUrl(value: string): string {
    let url: URL;
    try {
        url = new URL(value);
    } catch {
        throw new Error("MUNCH_APP_BASE_URL must be an absolute URL");
    }

    if (url.protocol !== "https:" && url.hostname !== "localhost") {
        throw new Error(
            "MUNCH_APP_BASE_URL must use HTTPS outside local development",
        );
    }

    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
}

export function getPlatformConfig(): PlatformConfig {
    return {
        databaseUrl: requiredEnvironmentVariable("DATABASE_URL"),
        appBaseUrl: normalizedBaseUrl(
            requiredEnvironmentVariable("MUNCH_APP_BASE_URL"),
        ),
        stripeSecretKey: requiredEnvironmentVariable("STRIPE_SECRET_KEY"),
        stripeWebhookSecret: requiredEnvironmentVariable(
            "STRIPE_WEBHOOK_SECRET",
        ),
        stripePriceId: requiredEnvironmentVariable("STRIPE_PRICE_ID"),
        sessionSecret: requiredEnvironmentVariable("MUNCH_SESSION_SECRET"),
    };
}

export function platformConfigurationAvailable(): boolean {
    return [
        "DATABASE_URL",
        "MUNCH_APP_BASE_URL",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "STRIPE_PRICE_ID",
        "MUNCH_SESSION_SECRET",
    ].every((name) => Boolean(process.env[name]?.trim()));
}
