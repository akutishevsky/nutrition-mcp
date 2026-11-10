import { getTodayWorkspace } from "../app/repository.js";
import { getNutritionGoals } from "../storage.js";
import { getProfile } from "../nutrition-platform/profiles.js";
import { dateInTz } from "../tz.js";

/**
 * Chat v2 slim static context (chat-v2 brief, decision 3).
 *
 * The ONLY facts baked into the agent's prompt are the user's goals
 * and today's totals — the two things nearly every exchange needs.
 * Everything else (today's meals in detail, pantry, plans, history,
 * recipes) is fetched live through the MCP tools the agent calls, so
 * the agent always works from current data instead of a snapshot
 * assembled at send time. (Chat v1 assembled pantry + recent history
 * + today's meal list into every prompt; v2 deliberately reduced this
 * surface — see the brief.)
 *
 * Assembly stays deterministic and code-side: every figure here
 * traces to a logged meal (provider-grounded at log time) or a
 * stated goal. Each gatherer fails soft (its section is simply
 * absent), and the summary records which sections were included.
 */

export interface ChatContextSummary {
    date: string;
    timezone: string;
    sections: string[];
    goals: {
        daily_calories: number | null;
        daily_protein_g: number | null;
        daily_carbs_g: number | null;
        daily_fat_g: number | null;
        daily_fiber_g: number | null;
    } | null;
    today: {
        totals: {
            calories: number;
            proteinG: number;
            carbsG: number;
            fatG: number;
            fiberG: number;
        };
    } | null;
}

export interface ChatContextData {
    date: string;
    timezone: string;
    goals: ChatContextSummary["goals"];
    today: {
        totals: {
            calories: number;
            proteinG: number;
            carbsG: number;
            fatG: number;
            fiberG: number;
        };
    } | null;
}

function round1(value: number): number {
    return Math.round(value * 10) / 10;
}

/** Pure summary of gathered context data (unit-tested). */
export function summarizeChatContext(
    data: ChatContextData,
): ChatContextSummary {
    const sections: string[] = [];
    if (data.goals) sections.push("goals");
    if (data.today) sections.push("today_totals");
    return {
        date: data.date,
        timezone: data.timezone,
        sections,
        goals: data.goals,
        today: data.today
            ? {
                  totals: {
                      calories: round1(data.today.totals.calories),
                      proteinG: round1(data.today.totals.proteinG),
                      carbsG: round1(data.today.totals.carbsG),
                      fatG: round1(data.today.totals.fatG),
                      fiberG: round1(data.today.totals.fiberG),
                  },
              }
            : null,
    };
}

export interface ChatContextDependencies {
    profile?: (userId: string) => Promise<{ timezone: string | null } | null>;
    goals?: typeof getNutritionGoals;
    today?: typeof getTodayWorkspace;
}

async function soft<T>(run: () => Promise<T>): Promise<T | null> {
    try {
        return await run();
    } catch (error) {
        console.warn("Chat context section failed; continuing without it", {
            errorName: error instanceof Error ? error.name : "unknown",
        });
        return null;
    }
}

/** Gather the slim static context deterministically and summarize it. */
export async function assembleChatContext(
    userId: string,
    dependencies: ChatContextDependencies = {},
): Promise<ChatContextSummary> {
    const profileOf = dependencies.profile ?? getProfile;
    const profile = await soft(() => profileOf(userId));
    const timezone = profile?.timezone ?? "UTC";
    const date = dateInTz(new Date(), timezone);

    const [goals, today] = await Promise.all([
        soft(() => (dependencies.goals ?? getNutritionGoals)(userId)),
        soft(() => (dependencies.today ?? getTodayWorkspace)(userId, date)),
    ]);

    return summarizeChatContext({
        date,
        timezone,
        goals: goals
            ? {
                  daily_calories: goals.daily_calories ?? null,
                  daily_protein_g: goals.daily_protein_g ?? null,
                  daily_carbs_g: goals.daily_carbs_g ?? null,
                  daily_fat_g: goals.daily_fat_g ?? null,
                  daily_fiber_g: goals.daily_fiber_g ?? null,
              }
            : null,
        today: today ? { totals: today.totals } : null,
    });
}
