import { websiteAiModel } from "../website-ai-config.js";

/**
 * S8 chat-agent model config. Follows the house AI seam exactly: all
 * traffic goes through OpenRouter only, the model is the program's
 * Ember slug via the shared `websiteAiModel()` selector
 * (`meta/muse-ember` by default; `MUNCH_AI_MODEL` remains the one
 * override), and the per-flow envs bound cost and latency the same
 * way the guidance flow's do. Returns null when the flow is disabled
 * or no OpenRouter key is configured — the route answers 503 with a
 * retryable state, never fabricated output.
 */

export interface ChatAiConfig {
    apiKey: string;
    baseUrl: string;
    model: string;
    timeoutMs: number;
    maxTokens: number;
    appUrl?: string;
}

function boundedInteger(
    value: string | undefined,
    fallback: number,
    min: number,
    max: number,
): number {
    const parsed = Number(value);
    return Number.isInteger(parsed)
        ? Math.max(min, Math.min(max, parsed))
        : fallback;
}

export function chatAiConfig(
    env: Record<string, string | undefined> = process.env,
): ChatAiConfig | null {
    const apiKey = env.OPENROUTER_API_KEY?.trim();
    const enabled = env.MUNCH_CHAT_AI_ENABLED?.trim().toLowerCase();
    if (!apiKey || enabled === "false" || enabled === "0") return null;
    let baseUrl =
        env.MUNCH_AI_BASE_URL?.trim() || "https://openrouter.ai/api/v1";
    try {
        const parsed = new URL(baseUrl);
        if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
            return null;
        }
        parsed.pathname = parsed.pathname.replace(/\/+$/, "");
        parsed.search = "";
        parsed.hash = "";
        baseUrl = parsed.toString().replace(/\/+$/, "");
    } catch {
        return null;
    }
    const appUrl = env.MUNCH_APP_BASE_URL?.trim();
    return {
        apiKey,
        baseUrl,
        model: websiteAiModel(env),
        timeoutMs: boundedInteger(
            env.MUNCH_CHAT_AI_TIMEOUT_MS,
            45_000,
            5_000,
            90_000,
        ),
        maxTokens: boundedInteger(
            env.MUNCH_CHAT_AI_MAX_TOKENS,
            2_500,
            500,
            8_000,
        ),
        ...(appUrl && /^https:\/\//.test(appUrl) ? { appUrl } : {}),
    };
}
