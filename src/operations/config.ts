export interface ConfigurationIssue {
    key: string;
    message: string;
}

function present(key: string): string {
    return process.env[key]?.trim() ?? "";
}

function requireValue(
    issues: ConfigurationIssue[],
    key: string,
    message = `${key} is required`,
): void {
    if (!present(key)) issues.push({ key, message });
}

export function configurationIssues(): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];
    const production = process.env.NODE_ENV === "production";
    const railwayAuth = present("MUNCH_RAILWAY_AUTH_ENABLED") === "true";
    const railwayData = present("MUNCH_RAILWAY_DATA_ENABLED") === "true";

    if (railwayAuth !== railwayData) {
        issues.push({
            key: "MUNCH_RAILWAY_AUTH_ENABLED",
            message:
                "Railway authentication and data flags must be enabled or disabled together",
        });
    }

    const baseUrl = present("MUNCH_APP_BASE_URL");
    requireValue(issues, "MUNCH_APP_BASE_URL");
    if (baseUrl) {
        try {
            const parsed = new URL(baseUrl);
            if (production && parsed.protocol !== "https:") {
                issues.push({
                    key: "MUNCH_APP_BASE_URL",
                    message: "Production application URL must use HTTPS",
                });
            }
            if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
                issues.push({
                    key: "MUNCH_APP_BASE_URL",
                    message:
                        "Application URL must be an origin without path, query, or fragment",
                });
            }
        } catch {
            issues.push({
                key: "MUNCH_APP_BASE_URL",
                message: "Application URL is invalid",
            });
        }
    }

    const sessionSecret = present("MUNCH_SESSION_SECRET");
    if (sessionSecret.length < 32) {
        issues.push({
            key: "MUNCH_SESSION_SECRET",
            message: "Session secret must contain at least 32 characters",
        });
    }

    if (production && present("MUNCH_DEV_EXPOSE_LOGIN_LINK") === "true") {
        issues.push({
            key: "MUNCH_DEV_EXPOSE_LOGIN_LINK",
            message:
                "Development login-link exposure cannot be enabled in production",
        });
    }

    requireValue(issues, "STRIPE_SECRET_KEY");
    requireValue(issues, "STRIPE_WEBHOOK_SECRET");
    requireValue(issues, "STRIPE_PRICE_ID");
    requireValue(issues, "OFF_USER_AGENT");

    if (production) {
        requireValue(issues, "MUNCH_LOGIN_DELIVERY_ENDPOINT");
        requireValue(issues, "MUNCH_LOGIN_DELIVERY_SECRET");
        const deliveryUrl = present("MUNCH_LOGIN_DELIVERY_ENDPOINT");
        if (deliveryUrl) {
            try {
                if (new URL(deliveryUrl).protocol !== "https:") {
                    issues.push({
                        key: "MUNCH_LOGIN_DELIVERY_ENDPOINT",
                        message:
                            "Production login delivery endpoint must use HTTPS",
                    });
                }
            } catch {
                issues.push({
                    key: "MUNCH_LOGIN_DELIVERY_ENDPOINT",
                    message: "Login delivery endpoint is invalid",
                });
            }
        }
    }

    if (railwayAuth && railwayData) {
        requireValue(issues, "DATABASE_URL");
        requireValue(
            issues,
            "USDA_FDC_API_KEY",
            "USDA_FDC_API_KEY is required because the USDA provider is enabled",
        );
        const pool = Number(present("MUNCH_DB_POOL_SIZE") || 10);
        if (!Number.isInteger(pool) || pool < 1 || pool > 50) {
            issues.push({
                key: "MUNCH_DB_POOL_SIZE",
                message: "Database pool size must be an integer from 1 to 50",
            });
        }
    } else {
        requireValue(issues, "SUPABASE_URL");
        requireValue(issues, "SUPABASE_SECRET_KEY");
        requireValue(issues, "OAUTH_CLIENT_ID");
        requireValue(issues, "OAUTH_CLIENT_SECRET");
    }

    return issues;
}

export function validateStartupConfiguration(): void {
    if (present("MUNCH_STRICT_STARTUP_VALIDATION") !== "true") return;
    const issues = configurationIssues();
    if (issues.length === 0) return;
    const summary = issues
        .map((issue) => `${issue.key}: ${issue.message}`)
        .join("; ");
    throw new Error(`Invalid Munch configuration: ${summary}`);
}
