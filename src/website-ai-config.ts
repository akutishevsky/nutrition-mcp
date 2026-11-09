export const DEFAULT_WEBSITE_AI_MODEL = "meta/muse-ember";

export function websiteAiModel(
    env: Record<string, string | undefined> = process.env,
): string {
    return env.MUNCH_AI_MODEL?.trim() || DEFAULT_WEBSITE_AI_MODEL;
}

/**
 * Reasoning parameter for an OpenRouter chat-completions request.
 *
 * Some models cannot disable reasoning: the OpenRouter catalog marks
 * them `reasoning.mandatory` (the whole meta/muse-* family, including
 * the default meta/muse-ember), and their endpoints reject
 * `reasoning: { enabled: false }` with HTTP 400 ("Reasoning is
 * mandatory for this endpoint and cannot be disabled"). For those
 * models, request the floor effort instead — "minimal" is in
 * muse-ember's supported efforts and keeps these extraction calls
 * behaving like reasoning-off: fast, cheap, JSON-focused. Every other
 * model keeps the explicit disable.
 */
export function openRouterReasoningParam(model: string): {
    reasoning: { enabled: false } | { effort: "minimal" };
} {
    if (model.startsWith("meta/muse-")) {
        return { reasoning: { effort: "minimal" } };
    }
    return { reasoning: { enabled: false } };
}

/**
 * Bounded single-line excerpt of a provider error body, for error
 * messages and logs. Provider rejections used to be undiagnosable
 * because call sites threw the body away; OpenRouter error bodies are
 * JSON like {"error":{"message":"...","code":400}} and never contain
 * the caller's credentials. Returns "" when there is nothing readable.
 */
export async function providerErrorDetail(response: Response): Promise<string> {
    try {
        const text = await response.text();
        const excerpt = text.replace(/\s+/g, " ").trim().slice(0, 500);
        return excerpt ? `: ${excerpt}` : "";
    } catch {
        return "";
    }
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
