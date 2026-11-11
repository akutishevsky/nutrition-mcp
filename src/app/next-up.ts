import { getMealHistoryWorkspace, getTodayWorkspace } from "./repository.js";
import {
    getGuidanceContext,
    getGuidancePreferences,
} from "../guidance-repository.js";
import {
    dayPartForHour,
    findRestatement,
    fingerprintNextUpContext,
    isDaySettled,
    landingFor,
    landingText,
    missingIngredientsFor,
    namesMatch,
    pickDeterministicCandidate,
    quietLineFor,
    scaleCandidateNutrition,
    secondaryLinesFor,
    targetSlotFor,
    validateComposition,
    type NextUpCandidate,
    type NextUpComposition,
    type NextUpContext,
    type NextUpNutrition,
    type NextUpSlot,
} from "../guidance/next-up.js";
import {
    DEFAULT_FEATURE_MODULES,
    type FeatureModules,
} from "../feature-modules.js";
import { getFeatureModules } from "../feature-modules-repository.js";
import { getPantry } from "../inventory/repository.js";
import { createMealDraft, upsertMealDraftItem } from "../meal-drafts/index.js";
import { getProfile } from "../nutrition-platform/profiles.js";
import {
    addGroceryItems,
    getGroceryList,
    getMealPlan,
    getRecipe,
    recipeMealItems,
    scheduleRecipe,
    searchRecipes,
    type PlanningScope,
} from "../planning/repository.js";
import { getNutritionGoals } from "../storage.js";
import type { StructuredMealItemInput } from "../structured-meals/types.js";
import { dateInTz, hourInTz } from "../tz.js";
import {
    websiteGuidanceAiConfig,
    type WebsiteGuidanceAiConfig,
} from "../website-ai-config.js";
import { composeNextUpSuggestion } from "./next-up-ai.js";
import {
    dismissGoalPrompt as dismissGoalPromptRow,
    getGoalPromptDismissed,
    readNextUpCache,
    writeNextUpCache,
} from "./next-up-repository.js";

/**
 * Next up service (guidance rework D1–D7). Assembles the day's
 * context deterministically from the same repositories the surfaces
 * and the S8 chat seeds read — budget vs goals, pantry, today's
 * plan, the grocery list, saved recipes + recent meals — honoring
 * the feature toggles (a disabled module contributes nothing and
 * its actions hide), then composes ONE suggestion through the
 * agent machinery: one Ember call per refresh, cached per day-part
 * behind a context fingerprint (D4). The suggestion card is free
 * for every account (Amendment D posture, per the brief's gating
 * recommendation); only the conversation stays Premium.
 *
 * Every action re-assembles the context server-side and re-derives
 * the candidate — the client names a candidate, it never supplies
 * nutrition the server would trust.
 */

export interface NextUpDependencies {
    profile?: (userId: string) => Promise<{ timezone: string | null } | null>;
    features?: (userId: string) => Promise<FeatureModules>;
    goals?: typeof getNutritionGoals;
    preferences?: typeof getGuidancePreferences;
    today?: typeof getTodayWorkspace;
    pantry?: typeof getPantry;
    plan?: typeof getMealPlan;
    groceries?: typeof getGroceryList;
    recipes?: typeof searchRecipes;
    guidanceContext?: typeof getGuidanceContext;
    history?: typeof getMealHistoryWorkspace;
    cacheRead?: typeof readNextUpCache;
    cacheWrite?: typeof writeNextUpCache;
    goalPromptDismissed?: (userId: string) => Promise<boolean>;
    aiConfig?: () => WebsiteGuidanceAiConfig | null;
    fetcher?: (
        input: RequestInfo | URL,
        init?: RequestInit,
    ) => Promise<Response>;
    now?: () => Date;
}

async function soft<T>(run: () => Promise<T>): Promise<T | null> {
    try {
        return await run();
    } catch (error) {
        console.warn("Next up context section failed; continuing without it", {
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

function nutritionOf(
    source:
        | {
              calories?: number | null;
              protein_g?: number | null;
              proteinG?: number | null;
              carbs_g?: number | null;
              carbsG?: number | null;
              fat_g?: number | null;
              fatG?: number | null;
          }
        | null
        | undefined,
): NextUpNutrition {
    return {
        calories: source?.calories ?? null,
        protein_g: source?.protein_g ?? source?.proteinG ?? null,
        carbs_g: source?.carbs_g ?? source?.carbsG ?? null,
        fat_g: source?.fat_g ?? source?.fatG ?? null,
    };
}

export async function assembleNextUpContext(
    userId: string,
    date: string,
    dependencies: NextUpDependencies = {},
): Promise<{ context: NextUpContext; timezone: string; isToday: boolean }> {
    const profile = await soft(() =>
        (dependencies.profile ?? getProfile)(userId),
    );
    const timezone = profile?.timezone ?? "UTC";
    const now = (dependencies.now ?? (() => new Date()))();
    const isToday = dateInTz(now, timezone) === date;
    const dayPart = dayPartForHour(hourInTz(now, timezone));

    const features =
        (await soft(() =>
            (dependencies.features ?? getFeatureModules)(userId),
        )) ?? DEFAULT_FEATURE_MODULES;

    const [goals, preferences, today] = await Promise.all([
        soft(() => (dependencies.goals ?? getNutritionGoals)(userId)),
        soft(() =>
            (dependencies.preferences ?? getGuidancePreferences)(userId),
        ),
        soft(() => (dependencies.today ?? getTodayWorkspace)(userId, date)),
    ]);

    const totals: NextUpNutrition = today
        ? {
              calories: today.totals.calories ?? 0,
              protein_g: today.totals.proteinG ?? 0,
              carbs_g: today.totals.carbsG ?? 0,
              fat_g: today.totals.fatG ?? 0,
          }
        : { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
    const filledSlots = [
        ...new Set(
            (today?.meals ?? [])
                .map((meal) => meal.meal_type)
                .filter((slot): slot is string => Boolean(slot)),
        ),
    ];

    const [pantryResult, planResult, groceryResult] = await Promise.all([
        features.pantry
            ? soft(() =>
                  (dependencies.pantry ?? getPantry)({
                      userId,
                      scope: { type: "personal" },
                      limit: 60,
                  }),
              )
            : Promise.resolve(null),
        features.plan
            ? soft(() =>
                  (dependencies.plan ?? getMealPlan)({
                      userId,
                      startDate: date,
                      endDate: date,
                      scope: "all",
                  }),
              )
            : Promise.resolve(null),
        features.groceries
            ? soft(() =>
                  (dependencies.groceries ?? getGroceryList)({
                      userId,
                      scope: { type: "personal" },
                  }),
              )
            : Promise.resolve(null),
    ]);

    // Use-first order: the product records no expiry dates, so the
    // honest proxy for "use it before it goes off" is low stock
    // first, then the item that has sat untouched longest.
    const pantry = (pantryResult?.items ?? [])
        .filter((item) => item.stock_state !== "depleted")
        .sort((a, b) => {
            const lowDelta =
                (a.stock_state === "low" ? 0 : 1) -
                (b.stock_state === "low" ? 0 : 1);
            if (lowDelta !== 0) return lowDelta;
            return a.updated_at.localeCompare(b.updated_at);
        })
        .map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            stock_state: item.stock_state,
            updated_at: item.updated_at,
        }));

    const planned = (planResult ?? [])
        .filter((entry) => entry.planned_date === date)
        .map((entry) => ({
            meal_slot: entry.meal_slot,
            recipe_name: entry.recipe_name,
            recipe_id: entry.recipe_id,
            recipe_revision_id: entry.recipe_revision_id,
            servings: entry.servings,
            nutrition_per_serving: entry.nutrition_per_serving
                ? nutritionOf(entry.nutrition_per_serving)
                : null,
        }));

    const groceryNames = (groceryResult?.items ?? [])
        .filter((item) => item.purchased_at == null)
        .map((item) => item.name);

    const banned = [
        ...(preferences?.allergies ?? []),
        ...(preferences?.excluded_ingredients ?? []),
    ];
    const isBanned = (names: string[]) =>
        banned.some((bannedName) =>
            names.some((name) => namesMatch(name, bannedName)),
        );

    const candidates: NextUpCandidate[] = [];
    if (features.recipes) {
        const [recipes, guidance] = await Promise.all([
            soft(() =>
                (dependencies.recipes ?? searchRecipes)({
                    userId,
                    scope: "all",
                    limit: 24,
                }),
            ),
            soft(() =>
                (dependencies.guidanceContext ?? getGuidanceContext)({
                    userId,
                    scope: { type: "personal" },
                    startDate: date,
                    endDate: date,
                }),
            ),
        ]);
        const ingredientsByRecipe = new Map<string, string[]>();
        for (const saved of guidance?.saved_recipes ?? []) {
            const id = String((saved as Record<string, unknown>).id ?? "");
            const ingredients = (saved as Record<string, unknown>).ingredients;
            if (id && Array.isArray(ingredients)) {
                ingredientsByRecipe.set(id, ingredients.map(String));
            }
        }
        for (const recipe of recipes ?? []) {
            const perServing = nutritionOf(recipe.nutrition_per_serving);
            if (perServing.calories == null) continue;
            const ingredientNames =
                ingredientsByRecipe.get(recipe.recipe_id) ?? [];
            if (isBanned([recipe.name, ...ingredientNames])) continue;
            candidates.push({
                id: `recipe:${recipe.recipe_id}`,
                kind: "recipe",
                name: recipe.name,
                recipe_id: recipe.recipe_id,
                recipe_revision_id: recipe.revision_id,
                servings: 1,
                nutrition: perServing,
                ingredient_names: ingredientNames,
                uses_pantry: pantry
                    .filter((item) =>
                        ingredientNames.some((name) =>
                            namesMatch(name, item.name),
                        ),
                    )
                    .map((item) => item.name),
                last_logged_date: null,
            });
        }
    }

    const history = await soft(() =>
        (dependencies.history ?? getMealHistoryWorkspace)(
            userId,
            shiftDate(date, -7),
            shiftDate(date, -1),
        ),
    );
    const todaysDescriptions = new Set(
        (today?.meals ?? []).map((meal) => meal.description.toLowerCase()),
    );
    const seenRecent = new Set<string>();
    for (const meal of history?.meals ?? []) {
        if (candidates.length >= 32) break;
        const key = meal.description.toLowerCase();
        if (seenRecent.has(key) || todaysDescriptions.has(key)) continue;
        seenRecent.add(key);
        const nutrition = nutritionOf(meal);
        if (nutrition.calories == null) continue;
        const ingredientNames = (meal.items ?? []).map((item) => item.name);
        if (isBanned([meal.description, ...ingredientNames])) continue;
        candidates.push({
            id: `recent:${meal.id}`,
            kind: "recent",
            name: meal.description,
            recipe_id: null,
            recipe_revision_id: null,
            servings: 1,
            nutrition,
            ingredient_names: ingredientNames,
            uses_pantry: pantry
                .filter((item) =>
                    ingredientNames.some((name) => namesMatch(name, item.name)),
                )
                .map((item) => item.name),
            last_logged_date: meal.logged_at.slice(0, 10),
        });
        if (
            candidates.filter((candidate) => candidate.kind === "recent")
                .length >= 8
        ) {
            break;
        }
    }

    const context: NextUpContext = {
        date,
        day_part: dayPart,
        objective: preferences?.objective ?? "track_only",
        goals: {
            calories: goals?.daily_calories ?? null,
            protein_g: goals?.daily_protein_g ?? null,
            carbs_g: goals?.daily_carbs_g ?? null,
            fat_g: goals?.daily_fat_g ?? null,
        },
        totals,
        filled_slots: filledSlots,
        planned,
        pantry,
        grocery_names: groceryNames,
        candidates,
        features: {
            plan: features.plan,
            recipes: features.recipes,
            groceries: features.groceries,
            pantry: features.pantry,
        },
    };
    return { context, timezone, isToday };
}

export interface NextUpResponse {
    date: string;
    day_part: NextUpContext["day_part"];
    is_today: boolean;
    state: "suggestion" | "quiet";
    objective_set: boolean;
    goal_prompt: { show: boolean };
    quiet_line: string | null;
    primary: {
        candidate_id: string;
        kind: NextUpCandidate["kind"];
        name: string;
        servings: number;
        slot: NextUpSlot;
        nutrition: NextUpNutrition;
        landing: ReturnType<typeof landingFor>;
        landing_text: string;
        reason: string;
        composition_source: NextUpComposition["source"];
        uses_pantry: string[];
        missing_ingredients: string[];
        actions: {
            plan: boolean;
            log: boolean;
            groceries: boolean;
            ask_agent: boolean;
        };
    } | null;
    secondary: Array<{ kind: string; text: string }>;
}

async function composeForContext(
    userId: string,
    context: NextUpContext,
    dependencies: NextUpDependencies,
): Promise<NextUpComposition | null> {
    const fingerprint = fingerprintNextUpContext(context);
    const cacheRead = dependencies.cacheRead ?? readNextUpCache;
    const cached = await soft(() =>
        cacheRead(userId, context.date, context.day_part),
    );
    if (cached && cached.fingerprint === fingerprint) {
        const candidate = context.candidates.find(
            (entry) => entry.id === cached.composition.candidate_id,
        );
        if (candidate) {
            if (cached.composition.source === "deterministic") {
                return cached.composition;
            }
            const revalidated = validateComposition(
                cached.composition,
                context,
            );
            if (revalidated) return revalidated;
        }
    }
    let composition: NextUpComposition | null = null;
    const config = (dependencies.aiConfig ?? websiteGuidanceAiConfig)();
    if (config) {
        composition = await composeNextUpSuggestion(
            { config, context },
            { fetcher: dependencies.fetcher },
        );
    }
    composition ??= pickDeterministicCandidate(context);
    if (composition) {
        const cacheWrite = dependencies.cacheWrite ?? writeNextUpCache;
        await soft(() =>
            cacheWrite(
                userId,
                context.date,
                context.day_part,
                fingerprint,
                composition,
            ),
        );
    }
    return composition;
}

/**
 * The Today panel payload. Free for every account — the gating line
 * holds at the chat conversation, not at this card (brief decision).
 */
export async function getNextUp(
    userId: string,
    date: string,
    dependencies: NextUpDependencies = {},
): Promise<NextUpResponse> {
    const { context, isToday } = await assembleNextUpContext(
        userId,
        date,
        dependencies,
    );
    const objectiveSet = context.objective !== "track_only";
    const dismissed =
        (await soft(() =>
            (dependencies.goalPromptDismissed ?? getGoalPromptDismissed)(
                userId,
            ),
        )) ?? false;
    const base: NextUpResponse = {
        date,
        day_part: context.day_part,
        is_today: isToday,
        state: "quiet",
        objective_set: objectiveSet,
        goal_prompt: { show: isToday && !objectiveSet && !dismissed },
        quiet_line: null,
        primary: null,
        secondary: [],
    };
    if (!isToday) return base;
    if (isDaySettled(context) || context.candidates.length === 0) {
        return { ...base, quiet_line: quietLineFor(context) };
    }
    const composition = await composeForContext(userId, context, dependencies);
    if (!composition) {
        return { ...base, quiet_line: quietLineFor(context) };
    }
    const candidate = context.candidates.find(
        (entry) => entry.id === composition.candidate_id,
    );
    if (!candidate) {
        return { ...base, quiet_line: quietLineFor(context) };
    }
    const landing = landingFor(context, candidate, composition.servings);
    const missing = missingIngredientsFor(candidate, context);
    const secondary = secondaryLinesFor(context, candidate).filter(
        (line) => !findRestatement(line.text),
    );
    return {
        ...base,
        state: "suggestion",
        primary: {
            candidate_id: candidate.id,
            kind: candidate.kind,
            name: candidate.name,
            servings: composition.servings,
            slot: targetSlotFor(context),
            nutrition: scaleCandidateNutrition(candidate, composition.servings),
            landing,
            landing_text: landingText(context, landing),
            reason: composition.reason,
            composition_source: composition.source,
            uses_pantry: candidate.uses_pantry,
            missing_ingredients: missing,
            actions: {
                plan:
                    context.features.plan &&
                    candidate.kind === "recipe" &&
                    candidate.recipe_id != null,
                log: true,
                groceries: context.features.groceries && missing.length > 0,
                ask_agent: true,
            },
        },
        secondary,
    };
}

const VALID_SLOTS: NextUpSlot[] = ["breakfast", "lunch", "dinner", "snack"];

function requestedSlot(value: unknown, context: NextUpContext): NextUpSlot {
    return typeof value === "string" &&
        (VALID_SLOTS as string[]).includes(value)
        ? (value as NextUpSlot)
        : targetSlotFor(context);
}

function requestedServings(value: unknown, fallback: number): number {
    return typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0.25 &&
        value <= 50
        ? value
        : fallback;
}

/** Re-derive the named candidate from a fresh context (actions never trust the client). */
export async function resolveNextUpCandidate(
    userId: string,
    date: string,
    candidateId: unknown,
    dependencies: NextUpDependencies = {},
): Promise<{ context: NextUpContext; candidate: NextUpCandidate }> {
    if (typeof candidateId !== "string" || candidateId.length === 0) {
        throw new Error("A suggestion candidate is required");
    }
    const { context } = await assembleNextUpContext(userId, date, dependencies);
    const candidate = context.candidates.find(
        (entry) => entry.id === candidateId,
    );
    if (!candidate) {
        throw new Error("That suggestion is no longer available");
    }
    return { context, candidate };
}

/** D3 — Plan it: schedule the suggested recipe for the target slot today. */
export async function planNextUpSuggestion(
    userId: string,
    input: {
        date: string;
        candidate_id: unknown;
        slot?: unknown;
        servings?: unknown;
    },
    dependencies: NextUpDependencies = {},
): Promise<{ planned_meal: unknown; slot: NextUpSlot }> {
    const { context, candidate } = await resolveNextUpCandidate(
        userId,
        input.date,
        input.candidate_id,
        dependencies,
    );
    if (!context.features.plan) {
        throw new Error("Meal Plan is turned off in Settings");
    }
    if (candidate.kind !== "recipe" || !candidate.recipe_id) {
        throw new Error("Only a saved recipe can be planned from here");
    }
    const recipe = await getRecipe(
        userId,
        candidate.recipe_id,
        candidate.recipe_revision_id ?? undefined,
    );
    if (!recipe) throw new Error("Recipe was not found or is unavailable");
    const slot = requestedSlot(input.slot, context);
    const scope: PlanningScope =
        recipe.ownership.type === "personal"
            ? { type: "personal" }
            : {
                  type: "household",
                  householdId: recipe.ownership.household_id,
              };
    const planned = await scheduleRecipe({
        userId,
        scope,
        recipeId: recipe.id,
        recipeRevisionId: recipe.revision_id,
        plannedDate: input.date,
        mealSlot: slot,
        servings: requestedServings(input.servings, candidate.servings),
        idempotencyKey: crypto.randomUUID(),
    });
    return { planned_meal: planned, slot };
}

/**
 * D3 — Log it: open a pre-filled meal draft through the existing
 * confirm-before-save flow. Nothing is logged by this call; the
 * draft lands in Today's Pending drafts and the review screen, and
 * only the user's confirmation there creates the meal.
 */
export async function logNextUpSuggestion(
    userId: string,
    input: {
        date: string;
        candidate_id: unknown;
        slot?: unknown;
        servings?: unknown;
    },
    dependencies: NextUpDependencies = {},
): Promise<{ draft_id: string }> {
    const { context, candidate } = await resolveNextUpCandidate(
        userId,
        input.date,
        input.candidate_id,
        dependencies,
    );
    const slot = requestedSlot(input.slot, context);
    const servings = requestedServings(input.servings, candidate.servings);
    let items: StructuredMealItemInput[] = [];
    let description = candidate.name;
    if (candidate.kind === "recipe" && candidate.recipe_id) {
        const recipe = await getRecipe(
            userId,
            candidate.recipe_id,
            candidate.recipe_revision_id ?? undefined,
        );
        if (!recipe) throw new Error("Recipe was not found or is unavailable");
        items = recipeMealItems(recipe, servings);
        description = recipe.name;
    } else {
        const mealId = candidate.id.replace(/^recent:/, "");
        const history = await (dependencies.history ?? getMealHistoryWorkspace)(
            userId,
            shiftDate(input.date, -7),
            shiftDate(input.date, -1),
        );
        const meal = history.meals.find((entry) => entry.id === mealId);
        if (!meal) throw new Error("That meal is no longer available");
        items = (meal.items ?? []).map((item) => ({
            name: item.name,
            quantity: item.quantity ?? undefined,
            portionLabel: item.portionLabel ?? undefined,
            gramWeight: item.gramWeight ?? undefined,
            nutrients: {
                calories: item.calories ?? undefined,
                protein_g: item.proteinG ?? undefined,
                carbs_g: item.carbsG ?? undefined,
                fat_g: item.fatG ?? undefined,
                fiber_g: item.fiberG ?? undefined,
                sugar_g: item.sugarG ?? undefined,
                alcohol_g: item.alcoholG ?? undefined,
                sodium_mg: item.sodiumMg ?? undefined,
                saturated_fat_g: item.saturatedFatG ?? undefined,
                cholesterol_mg: item.cholesterolMg ?? undefined,
                potassium_mg: item.potassiumMg ?? undefined,
            },
            sourceType: "past_meal",
            provider: item.provider ?? undefined,
            providerFoodId: item.providerFoodId ?? undefined,
            sourceUrl: item.sourceUrl ?? undefined,
            confidence: item.confidence ?? undefined,
            assumptions: item.assumptions,
        }));
    }
    if (items.length === 0) {
        throw new Error("That suggestion has no foods to pre-fill");
    }
    const draft = await createMealDraft({
        userId,
        sourceMode: candidate.kind === "recipe" ? "saved_food" : "history",
        mealType: slot,
        description,
        loggedAt: new Date().toISOString(),
        notes: "Suggested by Next up on Today.",
    });
    let current = draft;
    for (const [index, item] of items.entries()) {
        current = await upsertMealDraftItem({
            userId,
            draftId: draft.id,
            expectedVersion: current.version,
            position: index,
            item,
        });
    }
    return { draft_id: draft.id };
}

/**
 * D3 — Add missing to groceries: the candidate's uncovered
 * ingredients merge into the active list through the same
 * merge + provenance rules as the recipe slice's R3
 * (addGroceryItems: name+unit match adds quantities, source recipe
 * recorded). Returns the counts the toast reports.
 */
export async function addNextUpGroceries(
    userId: string,
    input: { date: string; candidate_id: unknown },
    dependencies: NextUpDependencies = {},
): Promise<{ added: number; merged: number; names: string[] }> {
    const { context, candidate } = await resolveNextUpCandidate(
        userId,
        input.date,
        input.candidate_id,
        dependencies,
    );
    if (!context.features.groceries) {
        throw new Error("Groceries is turned off in Settings");
    }
    const missing = missingIngredientsFor(candidate, context);
    if (missing.length === 0) {
        return { added: 0, merged: 0, names: [] };
    }
    const result = await addGroceryItems({
        userId,
        scope: { type: "personal" },
        items: missing.map((name) => ({
            name,
            note: `For ${candidate.name} (Next up)`,
            sourceRecipeId: candidate.recipe_id ?? undefined,
            sourceRecipeRevisionId: candidate.recipe_revision_id ?? undefined,
        })),
    });
    const entries = (result.items ?? []) as Array<{ merged?: boolean }>;
    return {
        added: entries.filter((entry) => !entry.merged).length,
        merged: entries.filter((entry) => entry.merged).length,
        names: missing,
    };
}

/** D6 — retire the one-time goal prompt for this account. */
export async function dismissNextUpGoalPrompt(
    userId: string,
): Promise<{ dismissed: true }> {
    await dismissGoalPromptRow(userId);
    return { dismissed: true };
}
