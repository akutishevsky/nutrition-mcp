import {
    getMealHistoryWorkspace,
    getTodayWorkspace,
} from "../app/repository.js";
import {
    CHAT_SURFACE_FEATURE_MODULES,
    DEFAULT_FEATURE_MODULES,
    type FeatureModules,
} from "../feature-modules.js";
import { getFeatureModules } from "../feature-modules-repository.js";
import { getPantry } from "../inventory/repository.js";
import { getProfile } from "../nutrition-platform/profiles.js";
import { getMealPlan } from "../planning/repository.js";
import { getNutritionGoals } from "../storage.js";
import { dateInTz } from "../tz.js";
import type { ChatEntrySurface } from "./repository.js";

/**
 * Chat v2 entry seeds (Contextual-only placement, brief Rulings
 * addendum 4; concept-2 pattern from the placement comparison book).
 *
 * A conversation opened from a surface entry starts already knowing
 * that surface's context: the client renders a CONTEXT ATTACHED
 * strip with this module's one-line summary, a deterministic opener
 * written from the same live data, and starters derived from it.
 * The structured `data` payload rides along on every send in the
 * conversation as the agent's entry_seed, re-assembled per send so
 * it never goes stale.
 *
 * Everything here is gathered by code from the same repositories the
 * surfaces themselves read — the model never assembles its own seed.
 * Each gatherer fails soft: a section that cannot be read produces a
 * plainer seed, never an error that blocks the conversation.
 */

export interface ChatEntrySeed {
    surface: ChatEntrySurface;
    summary: string;
    opener: string;
    starters: string[];
    data: Record<string, unknown>;
}

export interface ChatSeedDependencies {
    profile?: (userId: string) => Promise<{ timezone: string | null } | null>;
    today?: typeof getTodayWorkspace;
    goals?: typeof getNutritionGoals;
    history?: typeof getMealHistoryWorkspace;
    pantry?: typeof getPantry;
    plan?: typeof getMealPlan;
    features?: (userId: string) => Promise<FeatureModules>;
}

const MAX_SEED_MEALS = 12;
const MAX_SEED_PANTRY_ITEMS = 40;
const MAX_SEED_HISTORY_MEALS = 14;

async function soft<T>(run: () => Promise<T>): Promise<T | null> {
    try {
        return await run();
    } catch (error) {
        console.warn("Chat seed section failed; continuing without it", {
            errorName: error instanceof Error ? error.name : "unknown",
        });
        return null;
    }
}

function shiftDate(date: string, days: number): string {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
}

function weekdayName(date: string): string {
    return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "UTC",
    });
}

function kcal(value: number): string {
    return `${Math.round(value).toLocaleString("en-US")} kcal`;
}

const SURFACE_LABEL: Record<ChatEntrySurface, string> = {
    today: "Today",
    meal_plan: "Meal Plan",
    pantry: "Pantry",
    insights: "Insights",
};

export function entrySurfaceLabel(surface: ChatEntrySurface): string {
    return SURFACE_LABEL[surface];
}

async function todaySeed(
    userId: string,
    date: string,
    deps: ChatSeedDependencies,
): Promise<ChatEntrySeed> {
    const [today, goals] = await Promise.all([
        soft(() => (deps.today ?? getTodayWorkspace)(userId, date)),
        soft(() => (deps.goals ?? getNutritionGoals)(userId)),
    ]);
    const meals = (today?.meals ?? []).slice(0, MAX_SEED_MEALS).map((meal) => ({
        description: meal.description,
        meal_type: meal.meal_type ?? null,
        calories: meal.calories ?? null,
    }));
    const totals = today?.totals ?? null;
    const goalCalories = goals?.daily_calories ?? null;
    const mealCount = today?.meals.length ?? 0;
    const summary = totals
        ? `Today so far: ${kcal(totals.calories)} across ${mealCount} meal${mealCount === 1 ? "" : "s"}${goalCalories ? ` · goal ${kcal(goalCalories)}` : ""}.`
        : "Today's log could not be read just now.";
    const opener =
        mealCount === 0
            ? "Nothing is logged yet today. Tell me what you've eaten and I'll prepare it as a draft for you to confirm — or ask how to shape the rest of the day."
            : `You've logged ${mealCount} meal${mealCount === 1 ? "" : "s"} so far today${totals ? ` — ${kcal(totals.calories)}${goalCalories ? ` against a ${kcal(goalCalories)} goal` : ""}` : ""}. I can log something else, explain the day, or help land dinner.`;
    return {
        surface: "today",
        summary,
        opener,
        starters: [
            "How is today looking against my goals?",
            "What should dinner be to land the day well?",
            "Log what I just ate",
        ],
        data: {
            date,
            meals,
            totals,
            goal_calories: goalCalories,
        },
    };
}

async function mealPlanSeed(
    userId: string,
    date: string,
    deps: ChatSeedDependencies,
    features: FeatureModules,
): Promise<ChatEntrySeed> {
    const endDate = shiftDate(date, 6);
    const plan = await soft(() =>
        (deps.plan ?? getMealPlan)({
            userId,
            startDate: date,
            endDate,
            scope: "all",
        }),
    );
    const days: Array<{
        date: string;
        entries: Array<{ meal_slot: string | null; recipe_name: string }>;
    }> = [];
    for (let offset = 0; offset < 7; offset++) {
        const day = shiftDate(date, offset);
        const entries = (plan ?? [])
            .filter((entry) => entry.planned_date === day)
            .map((entry) => ({
                meal_slot: entry.meal_slot,
                recipe_name: entry.recipe_name,
            }));
        days.push({ date: day, entries });
    }
    const plannedDays = days.filter((day) => day.entries.length > 0).length;
    const firstGap = days.find((day) => day.entries.length === 0);
    const summary = plan
        ? `${plannedDays} of 7 days have something planned${firstGap ? ` · ${weekdayName(firstGap.date)} is empty` : ""}.`
        : "This week's plan could not be read just now.";
    // Feature toggles (T3): the seed never offers a disabled module —
    // no pantry suggestions to a Pantry-off user, no grocery action to
    // a Groceries-off user, no recipe source to a Recipes-off user.
    const fillSources = [
        features.recipes ? "your recipes" : null,
        features.pantry ? "what's in the pantry" : null,
    ].filter((source): source is string => source !== null);
    const opener = firstGap
        ? `This week has a gap on ${weekdayName(firstGap.date)}.${fillSources.length ? ` I can suggest filling it from ${fillSources.join(" or ")} — or explain or adjust any day's plan.` : " I can explain or adjust any day's plan."}`
        : `Every day this week has something planned. I can adjust a day or explain the plan${features.groceries ? ", or build the grocery list from it" : ""}.`;
    return {
        surface: "meal_plan",
        summary,
        opener,
        starters: [
            "Fill the gaps in this plan",
            "Explain this week's plan",
            ...(features.groceries
                ? ["Build the grocery list from this plan"]
                : []),
        ],
        data: { start_date: date, end_date: endDate, days },
    };
}

async function pantrySeed(
    userId: string,
    deps: ChatSeedDependencies,
): Promise<ChatEntrySeed> {
    const pantry = await soft(() =>
        (deps.pantry ?? getPantry)({
            userId,
            scope: { type: "personal" },
            limit: MAX_SEED_PANTRY_ITEMS,
        }),
    );
    const items = (pantry?.items ?? []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        stock_state: item.stock_state,
        location: item.location,
    }));
    const names = items.slice(0, 3).map((item) => item.name);
    const summary = pantry
        ? `${items.length} item${items.length === 1 ? "" : "s"} on hand${names.length ? ` — including ${names.join(", ")}` : ""}.`
        : "Your pantry could not be read just now.";
    const opener =
        items.length === 0
            ? "Your pantry is empty right now, so cooking from it is a short conversation — but I can help you plan a first shop, or log a meal instead."
            : `You have ${items.length} item${items.length === 1 ? "" : "s"} on hand${names.length ? ` — ${names.join(", ")} among them` : ""}. Ask what to cook tonight, what to use up first, or what's missing for a full meal.`;
    return {
        surface: "pantry",
        summary,
        opener,
        starters: [
            "What can I cook tonight from this?",
            "What should I use up first?",
            "What am I missing for a full meal?",
        ],
        data: { items },
    };
}

async function insightsSeed(
    userId: string,
    date: string,
    deps: ChatSeedDependencies,
): Promise<ChatEntrySeed> {
    const startDate = shiftDate(date, -6);
    const history = await soft(() =>
        (deps.history ?? getMealHistoryWorkspace)(userId, startDate, date),
    );
    const meals = (history?.meals ?? [])
        .slice(0, MAX_SEED_HISTORY_MEALS)
        .map((meal) => meal.description);
    const totals = history?.totals ?? null;
    const summary = totals
        ? `Last 7 days: ${kcal(totals.calories ?? 0)} logged across ${history?.meals.length ?? 0} meals.`
        : "Last week's log could not be read just now.";
    return {
        surface: "insights",
        summary,
        opener: "Here's your last seven days. Ask me to explain the pattern, find where protein dipped, or suggest one change for next week.",
        starters: [
            "Explain my week",
            "Where did my protein dip?",
            "What one change helps most next week?",
        ],
        data: {
            start_date: startDate,
            end_date: date,
            totals,
            meals,
        },
    };
}

/**
 * Assemble the live seed for one entry surface. Never throws.
 *
 * Feature toggles (T3): a surface owned by a disabled module has no
 * seed at all — the conversation opens unseeded and the agent's
 * context contains nothing from that module. Returns null only for
 * that case; every enabled surface assembles as before.
 */
export async function assembleEntrySeed(
    userId: string,
    surface: ChatEntrySurface,
    dependencies: ChatSeedDependencies = {},
): Promise<ChatEntrySeed | null> {
    const features =
        (await soft(() =>
            (dependencies.features ?? getFeatureModules)(userId),
        )) ?? DEFAULT_FEATURE_MODULES;
    const surfaceModule = CHAT_SURFACE_FEATURE_MODULES[surface];
    if (surfaceModule && !features[surfaceModule]) return null;
    const profileOf = dependencies.profile ?? getProfile;
    const profile = await soft(() => profileOf(userId));
    const timezone = profile?.timezone ?? "UTC";
    const date = dateInTz(new Date(), timezone);
    switch (surface) {
        case "today":
            return todaySeed(userId, date, dependencies);
        case "meal_plan":
            return mealPlanSeed(userId, date, dependencies, features);
        case "pantry":
            return pantrySeed(userId, dependencies);
        case "insights":
            return insightsSeed(userId, date, dependencies);
    }
}
