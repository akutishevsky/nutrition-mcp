export const DEFAULT_WEBSITE_AI_MODEL = "meta/muse-ember";

export function websiteAiModel(
    env: Record<string, string | undefined> = process.env,
): string {
    return env.MUNCH_AI_MODEL?.trim() || DEFAULT_WEBSITE_AI_MODEL;
}

export interface WebsiteGuidanceAiConfig {
    apiKey: string;
    baseUrl: string;
    model: string;
    timeoutMs: number;
    maxTokens: number;
    appUrl?: string;
}

export function websiteGuidanceAiConfig(
    env: Record<string, string | undefined> = process.env,
): WebsiteGuidanceAiConfig | null {
    const apiKey = env.OPENROUTER_API_KEY?.trim();
    const enabled = env.MUNCH_GUIDANCE_AI_ENABLED?.trim().toLowerCase();
    if (!apiKey || enabled === "false" || enabled === "0") return null;
    let baseUrl =
        env.MUNCH_AI_BASE_URL?.trim() || "https://openrouter.ai/api/v1";
    try {
        const parsed = new URL(baseUrl);
        if (parsed.protocol !== "https:" && parsed.hostname !== "localhost")
            return null;
        parsed.pathname = parsed.pathname.replace(/\/+$/, "");
        parsed.search = "";
        parsed.hash = "";
        baseUrl = parsed.toString().replace(/\/+$/, "");
    } catch {
        return null;
    }
    const boundedInteger = (
        value: string | undefined,
        fallback: number,
        min: number,
        max: number,
    ) => {
        const parsed = Number(value);
        return Number.isInteger(parsed)
            ? Math.max(min, Math.min(max, parsed))
            : fallback;
    };
    const appUrl = env.MUNCH_APP_BASE_URL?.trim();
    return {
        apiKey,
        baseUrl,
        model: websiteAiModel(env),
        timeoutMs: boundedInteger(
            env.MUNCH_GUIDANCE_AI_TIMEOUT_MS,
            25_000,
            5_000,
            60_000,
        ),
        maxTokens: boundedInteger(
            env.MUNCH_GUIDANCE_AI_MAX_TOKENS,
            3_500,
            500,
            8_000,
        ),
        ...(appUrl && /^https:\/\//.test(appUrl) ? { appUrl } : {}),
    };
}
