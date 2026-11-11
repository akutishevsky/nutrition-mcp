import {
    remainingBudget,
    targetSlotFor,
    validateComposition,
    type NextUpComposition,
    type NextUpContext,
} from "../guidance/next-up.js";
import type { WebsiteGuidanceAiConfig } from "../website-ai-config.js";

/**
 * Next up composition call (guidance rework D4). ONE Ember call per
 * refresh: the model sees the deterministically assembled context
 * (the same facts the S8 chat agent's context layer works from) and
 * does exactly one job — pick ONE candidate and say why, in one
 * sentence. It never invents nutrition: the response schema carries
 * no numbers the server would trust, `validateComposition` checks
 * the pick and every number in the reason against the context, and
 * any failure resolves to null so the caller falls back to the
 * deterministic pick. Transport is injectable, matching the
 * guidance-ai.ts recorded-fixture seam.
 */

export interface NextUpAiDependencies {
    fetcher?: (
        input: RequestInfo | URL,
        init?: RequestInit,
    ) => Promise<Response>;
}

function safeLogValue(value: string): string {
    return value.replace(/[^a-zA-Z0-9._/-]+/g, "_").slice(0, 80) || "unknown";
}

function logNextUpPhase(
    status: "success" | "error",
    model: string,
    startedAt: number,
    callsUsed: number,
): void {
    console.info(
        `[next_up_ai] phase=compose status=${status} model=${safeLogValue(model)} duration_ms=${Math.max(0, Math.round(Date.now() - startedAt))} calls_used=${callsUsed}`,
    );
}

function responseText(value: unknown): string | null {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
        return value
            .map((item) =>
                item &&
                typeof item === "object" &&
                typeof (item as { text?: unknown }).text === "string"
                    ? (item as { text: string }).text
                    : "",
            )
            .join("\n");
    }
    return null;
}

/** The exact context the model may cite — ids and facts, nothing else. */
export function nextUpModelContext(context: NextUpContext) {
    return {
        date: context.date,
        day_part: context.day_part,
        target_slot: targetSlotFor(context),
        remaining_budget: remainingBudget(context),
        pantry_on_hand: context.pantry.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            stock_state: item.stock_state,
        })),
        planned_today: context.planned.map((meal) => ({
            meal_slot: meal.meal_slot,
            recipe_name: meal.recipe_name,
        })),
        grocery_list_open_items: context.grocery_names,
        candidates: context.candidates.map((candidate) => ({
            candidate_id: candidate.id,
            kind: candidate.kind,
            name: candidate.name,
            servings: candidate.servings,
            nutrition_for_suggested_amount: candidate.nutrition,
            uses_pantry_items: candidate.uses_pantry,
            last_logged_date: candidate.last_logged_date,
        })),
    };
}

export async function composeNextUpSuggestion(
    input: { config: WebsiteGuidanceAiConfig; context: NextUpContext },
    dependencies: NextUpAiDependencies = {},
): Promise<NextUpComposition | null> {
    const { config, context } = input;
    if (context.candidates.length === 0) return null;
    const startedAt = Date.now();
    const fetcher = dependencies.fetcher ?? fetch;
    const requestBody = JSON.stringify({
        model: config.model,
        temperature: 0.3,
        max_tokens: Math.min(config.maxTokens, 600),
        response_format: { type: "json_object" },
        plugins: [{ id: "response-healing" }],
        messages: [
            {
                role: "system",
                content:
                    "You choose the single best next meal for a nutrition tracker's home screen. Return only JSON: {candidate_id, servings, reason}. candidate_id must be one of the listed candidates; servings a number from 0.25 to 4. reason is ONE short sentence saying why this meal fits right now (pantry to use up, a macro gap it closes, the time of day). Never restate the user's logged totals — the screen already shows them. Never state a number that is not present in the provided context. Never make medical claims or prescribe targets. Prefer candidates that use pantry items, then candidates that close the largest remaining protein gap, then saved recipes over repeats.",
            },
            {
                role: "user",
                content: JSON.stringify(nextUpModelContext(context)),
            },
        ],
    });
    let callsUsed = 0;
    for (let attempt = 0; attempt < 2; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
        let response: Response;
        try {
            callsUsed += 1;
            response = await fetcher(`${config.baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${config.apiKey}`,
                    "Content-Type": "application/json",
                    ...(config.appUrl ? { "HTTP-Referer": config.appUrl } : {}),
                    "X-Title": "Munch Next Up",
                },
                body: requestBody,
                signal: controller.signal,
            });
        } catch {
            logNextUpPhase("error", config.model, startedAt, callsUsed);
            return null;
        } finally {
            clearTimeout(timeout);
        }
        if (!response.ok) {
            logNextUpPhase("error", config.model, startedAt, callsUsed);
            return null;
        }
        const payload: unknown = await response.json().catch(() => null);
        const choice =
            payload && typeof payload === "object"
                ? (payload as any).choices?.[0]?.message?.content
                : null;
        const content = responseText(choice);
        if (!content) continue;
        let parsed: unknown;
        try {
            parsed = JSON.parse(content);
        } catch {
            continue;
        }
        const composition = validateComposition(parsed, context);
        if (composition) {
            logNextUpPhase("success", config.model, startedAt, callsUsed);
            return composition;
        }
    }
    logNextUpPhase("error", config.model, startedAt, callsUsed);
    return null;
}
