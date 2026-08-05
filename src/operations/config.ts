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

function validateHttpsUrl(
    issues: ConfigurationIssue[],
    key: string,
    message: string,
): void {
    const value = present(key);
    if (!value) return;
    try {
        if (new URL(value).protocol !== "https:") {
            issues.push({ key, message });
        }
    } catch {
        issues.push({ key, message: `${key} is invalid` });
    }
}

export function configurationIssues(): ConfigurationIssue[] {
    const issues: ConfigurationIssue[] = [];
    const production = process.env.NODE_ENV === "production";
    const railwayAuth = present("MUNCH_RAILWAY_AUTH_ENABLED") === "true";
    const authBackend = present("MUNCH_AUTH_BACKEND") || "custom";
    if (authBackend !== "custom" && authBackend !== "better_auth") {
        issues.push({
            key: "MUNCH_AUTH_BACKEND",
            message: "Authentication backend must be custom or better_auth",
        });
    }
    if (authBackend === "custom" && !railwayAuth) {
        issues.push({
            key: "MUNCH_RAILWAY_AUTH_ENABLED",
            message: "Custom authentication requires Railway OAuth",
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

    if (authBackend === "better_auth") {
        requireValue(issues, "BETTER_AUTH_SECRET");
        const secret = present("BETTER_AUTH_SECRET");
        if (secret && secret.length < 32) {
            issues.push({
                key: "BETTER_AUTH_SECRET",
                message:
                    "Better Auth secret must contain at least 32 characters",
            });
        }
        requireValue(issues, "RESEND_API_KEY");
        requireValue(issues, "MUNCH_EMAIL_FROM");
    } else {
        const sessionSecret = present("MUNCH_SESSION_SECRET");
        if (sessionSecret.length < 32) {
            issues.push({
                key: "MUNCH_SESSION_SECRET",
                message: "Session secret must contain at least 32 characters",
            });
        }
        if (production) {
            requireValue(issues, "MUNCH_LOGIN_DELIVERY_ENDPOINT");
            requireValue(issues, "MUNCH_LOGIN_DELIVERY_SECRET");
            validateHttpsUrl(
                issues,
                "MUNCH_LOGIN_DELIVERY_ENDPOINT",
                "Production login delivery endpoint must use HTTPS",
            );
        }
    }

    if (production && present("MUNCH_DEV_EXPOSE_LOGIN_LINK") === "true") {
        issues.push({
            key: "MUNCH_DEV_EXPOSE_LOGIN_LINK",
            message:
                "Development login-link exposure cannot be enabled in production",
        });
    }

    requireValue(issues, "DATABASE_URL");
    requireValue(issues, "STRIPE_SECRET_KEY");
    requireValue(issues, "STRIPE_WEBHOOK_SECRET");
    requireValue(issues, "STRIPE_PRICE_ID");
    requireValue(issues, "OFF_USER_AGENT");
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
