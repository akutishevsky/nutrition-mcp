import { getPantry } from "../inventory/repository.js";
import {
    getMealHistoryWorkspace,
    getTodayWorkspace,
} from "../app/repository.js";
import { getNutritionGoals } from "../storage.js";
import { getProfile } from "../nutrition-platform/profiles.js";
import { dateInTz } from "../tz.js";

/**
 * S8 deterministic context assembly.
 *
 * The chat agent's awareness of the user — pantry contents, today's
 * log and goals/targets, recent history — is gathered HERE, by code,
 * from the same repositories the Operate surfaces read. The model
 * never fetches anything and never sees raw tables: it receives the
 * compact summary this module builds, and every nutrition figure in
 * that summary traces to a logged meal (itself provider-grounded at
 * log time) or a stated goal. Assembly is capped and ordered so the
 * prompt stays bounded no matter how large the account grows.
 *
 * Each gatherer fails soft (its section is simply absent), so a
 * pantry outage cannot take the whole conversation down; the summary
 * records which sections were included.
 */

export interface ChatContextData {
    date: string;
    timezone: string;
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
        meals: Array<{
            description: string;
            meal_type: string | null;
            calories: number | null;
        }>;
    } | null;
    pantry: Array<{
        name: string;
        quantity: number | null;
        unit: string | null;
        stock_state: string;
        location: string;
    }> | null;
    recent: {
        days: Array<{
            date: string;
            calories: number;
            proteinG: number;
            carbsG: number;
            fatG: number;
            mealCount: number;
        }>;
        meals: string[];
    } | null;
}

export interface ChatContextSummary {
    date: string;
    timezone: string;
    sections: string[];
    goals: ChatContextData["goals"];
    today: ChatContextData["today"];
    pantry: ChatContextData["pantry"];
    recent: ChatContextData["recent"];
}

const MAX_PANTRY_ITEMS = 40;
const MAX_TODAY_MEALS = 12;
const MAX_RECENT_MEALS = 14;

function round1(value: number): number {
    return Math.round(value * 10) / 10;
}

/** Pure, capped summary of gathered context data (unit-tested). */
export function summarizeChatContext(
    data: ChatContextData,
): ChatContextSummary {
    const sections: string[] = [];
    if (data.goals) sections.push("goals");
    if (data.today) sections.push("today");
    if (data.pantry) sections.push("pantry");
    if (data.recent) sections.push("recent_history");
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
                  meals: data.today.meals.slice(0, MAX_TODAY_MEALS),
              }
            : null,
        pantry: data.pantry ? data.pantry.slice(0, MAX_PANTRY_ITEMS) : null,
        recent: data.recent
            ? {
                  days: data.recent.days.slice(0, 7),
                  meals: data.recent.meals.slice(0, MAX_RECENT_MEALS),
              }
            : null,
    };
}

export interface ChatContextDependencies {
    profile?: (userId: string) => Promise<{ timezone: string | null } | null>;
    goals?: typeof getNutritionGoals;
    today?: typeof getTodayWorkspace;
    history?: typeof getMealHistoryWorkspace;
    pantry?: typeof getPantry;
}

function shiftDate(date: string, days: number): string {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
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

/** Gather the user's context deterministically and summarize it. */
export async function assembleChatContext(
    userId: string,
    dependencies: ChatContextDependencies = {},
): Promise<ChatContextSummary> {
    const profileOf = dependencies.profile ?? getProfile;
    const profile = await soft(() => profileOf(userId));
    const timezone = profile?.timezone ?? "UTC";
    const date = dateInTz(new Date(), timezone);

    const [goals, today, history, pantry] = await Promise.all([
        soft(() => (dependencies.goals ?? getNutritionGoals)(userId)),
        soft(() => (dependencies.today ?? getTodayWorkspace)(userId, date)),
        soft(() =>
            (dependencies.history ?? getMealHistoryWorkspace)(
                userId,
                shiftDate(date, -6),
                date,
            ),
        ),
        soft(() =>
            (dependencies.pantry ?? getPantry)({
                userId,
                scope: { type: "personal" },
                limit: MAX_PANTRY_ITEMS,
            }),
        ),
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
        today: today
            ? {
                  totals: today.totals,
                  meals: today.meals.map((meal) => ({
                      description: meal.description,
                      meal_type: meal.meal_type ?? null,
                      calories: meal.calories ?? null,
                  })),
              }
            : null,
        pantry: pantry
            ? pantry.items.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                  unit: item.unit,
                  stock_state: item.stock_state,
                  location: item.location,
              }))
            : null,
        recent: history
            ? {
                  // Per-day totals derived from the history workspace's
                  // own meals, grouped by its logged date bucket.
                  days: buildRecentDays(history),
                  meals: history.meals.map((meal) => meal.description),
              }
            : null,
    });
}

function buildRecentDays(
    history: Awaited<ReturnType<typeof getMealHistoryWorkspace>>,
): NonNullable<ChatContextData["recent"]>["days"] {
    // The history workspace returns range totals, not per-day buckets;
    // the honest summary is the range as a single aggregate row keyed
    // by its end date, plus the meal descriptions. Per-day fabrication
    // would invent data the gatherer did not return.
    return [
        {
            date: history.endDate,
            calories: round1(history.totals.calories ?? 0),
            proteinG: round1(history.totals.proteinG ?? 0),
            carbsG: round1(history.totals.carbsG ?? 0),
            fatG: round1(history.totals.fatG ?? 0),
            mealCount: history.meals.length,
        },
    ];
}
