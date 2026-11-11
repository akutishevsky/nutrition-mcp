import { describe, expect, test } from "bun:test";
import { getNextUp, type NextUpDependencies } from "./next-up.js";
import type { NextUpComposition } from "../guidance/next-up.js";

/**
 * Next up service fixtures (guidance rework acceptance 1): the
 * brief's scenarios (a)–(d) plus the D4 cache contract, driven
 * entirely through injected dependencies — no database, no network.
 * The model is a counting fake fetcher; the deterministic fallback
 * is what composes when no AI config is injected.
 */

const DATE = "2026-11-10";
const RECIPE_ID = "11111111-1111-4111-8111-111111111111";
const REVISION_ID = "22222222-2222-4222-8222-222222222222";

interface FakeState {
    fetchCalls: number;
    planCalls: number;
    cache: Map<string, { fingerprint: string; composition: NextUpComposition }>;
}

function makeDeps(
    state: FakeState,
    overrides: Record<string, unknown> = {},
): NextUpDependencies {
    const base: Record<string, unknown> = {
        profile: async () => ({ timezone: "UTC" }),
        features: async () => ({
            plan: true,
            recipes: true,
            groceries: true,
            pantry: true,
            cooks: true,
        }),
        goals: async () => ({
            daily_calories: 2000,
            daily_protein_g: 120,
            daily_carbs_g: 220,
            daily_fat_g: 65,
        }),
        preferences: async () => ({
            objective: "maintain",
            suggestions_enabled: true,
            allergies: [],
            excluded_ingredients: [],
            disliked_ingredients: [],
            liked_ingredients: [],
            cuisines: [],
            flavors: [],
            equipment: [],
            preferred_methods: [],
            avoided_methods: [],
            difficulty: "any",
            max_prep_minutes: null,
            max_total_minutes: null,
            servings: 1,
            allow_repeats: true,
            repeat_window_days: 7,
        }),
        today: async () => ({
            totals: { calories: 900, proteinG: 55, carbsG: 100, fatG: 30 },
            meals: [
                {
                    id: "meal-breakfast",
                    description: "Oats",
                    meal_type: "breakfast",
                    calories: 900,
                    protein_g: 55,
                    carbs_g: 100,
                    fat_g: 30,
                    items: [],
                },
            ],
        }),
        pantry: async () => ({
            enabled: true,
            inventorySpaceId: "space-1",
            items: [
                {
                    id: "p1",
                    name: "Chicken breast",
                    normalized_name: "chicken breast",
                    quantity: 2,
                    unit: "pieces",
                    quantity_mode: "count",
                    stock_state: "low",
                    location: "fridge",
                    food_provider: null,
                    provider_food_id: null,
                    barcode: null,
                    note: null,
                    version: 1,
                    updated_at: "2026-11-07T10:00:00.000Z",
                },
                {
                    id: "p2",
                    name: "Rice",
                    normalized_name: "rice",
                    quantity: 1,
                    unit: "bag",
                    quantity_mode: "package",
                    stock_state: "available",
                    location: "pantry",
                    food_provider: null,
                    provider_food_id: null,
                    barcode: null,
                    note: null,
                    version: 1,
                    updated_at: "2026-11-09T10:00:00.000Z",
                },
            ],
        }),
        plan: async () => {
            state.planCalls += 1;
            return [];
        },
        groceries: async () => ({ groceryListId: "list-1", items: [] }),
        recipes: async () => [
            {
                recipe_id: RECIPE_ID,
                revision_id: REVISION_ID,
                name: "Chicken rice bowl",
                version: 1,
                ownership: "personal",
                servings: 2,
                nutrition_status: "complete",
                nutrition_per_serving: {
                    calories: 520,
                    protein_g: 42,
                    carbs_g: 48,
                    fat_g: 16,
                },
                preparation_minutes: 10,
                cooking_minutes: 20,
                times_scheduled: 0,
                last_scheduled_date: null,
                times_logged: 0,
                last_logged_at: null,
                updated_at: "2026-11-09T10:00:00.000Z",
            },
        ],
        guidanceContext: async () => ({
            saved_recipes: [
                {
                    id: RECIPE_ID,
                    ingredients: ["Chicken breast", "Rice", "Broccoli"],
                },
            ],
        }),
        history: async () => ({ meals: [], totals: null }),
        cacheRead: async (_userId: string, date: string, dayPart: string) =>
            state.cache.get(`${date}:${dayPart}`) ?? null,
        cacheWrite: async (
            _userId: string,
            date: string,
            dayPart: string,
            fingerprint: string,
            composition: NextUpComposition,
        ) => {
            state.cache.set(`${date}:${dayPart}`, {
                fingerprint,
                composition,
            });
        },
        goalPromptDismissed: async () => false,
        aiConfig: () => null,
        now: () => new Date("2026-11-10T15:00:00.000Z"),
    };
    return { ...base, ...overrides } as unknown as NextUpDependencies;
}

function freshState(): FakeState {
    return { fetchCalls: 0, planCalls: 0, cache: new Map() };
}

const AI_CONFIG = {
    apiKey: "<redacted>",
    baseUrl: "https://openrouter.test/api/v1",
    model: "meta/muse-ember",
    timeoutMs: 5000,
    maxTokens: 2000,
};

function modelFetcher(state: FakeState, payload: unknown) {
    return async () => {
        state.fetchCalls += 1;
        return new Response(
            JSON.stringify({
                choices: [{ message: { content: JSON.stringify(payload) } }],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
        );
    };
}

describe("next-up service", () => {
    test("(a) expiring chicken + protein gap → primary uses the chicken, landing stated", async () => {
        const state = freshState();
        const response = await getNextUp("user-1", DATE, makeDeps(state));
        expect(response.state).toBe("suggestion");
        expect(response.primary?.name).toBe("Chicken rice bowl");
        expect(response.primary?.uses_pantry).toContain("Chicken breast");
        // 900 + 520 = 1,420 kcal; protein 55 + 42 = 97 of 120.
        expect(response.primary?.landing.calories).toBe(1420);
        expect(response.primary?.landing_text).toContain("1,420 kcal");
        expect(response.primary?.slot).toBe("lunch");
        // Broccoli is neither in the pantry nor on the list.
        expect(response.primary?.missing_ingredients).toEqual(["Broccoli"]);
        expect(response.primary?.actions.groceries).toBe(true);
        expect(response.primary?.actions.plan).toBe(true);
        expect(response.primary?.actions.log).toBe(true);
    });

    test("(b) planned dinner and nothing else actionable → one quiet line, no other text", async () => {
        const state = freshState();
        const deps = makeDeps(state, {
            today: async () => ({
                totals: {
                    calories: 1900,
                    proteinG: 115,
                    carbsG: 200,
                    fatG: 60,
                },
                meals: [
                    {
                        id: "m1",
                        description: "Big breakfast",
                        meal_type: "breakfast",
                        calories: 1000,
                        protein_g: 60,
                        carbs_g: 110,
                        fat_g: 35,
                        items: [],
                    },
                    {
                        id: "m2",
                        description: "Lunch bowl",
                        meal_type: "lunch",
                        calories: 900,
                        protein_g: 55,
                        carbs_g: 90,
                        fat_g: 25,
                        items: [],
                    },
                ],
            }),
            pantry: async () => ({
                enabled: true,
                inventorySpaceId: "space-1",
                items: [],
            }),
            plan: async () => [
                {
                    planned_meal_id: "pm-1",
                    planned_date: DATE,
                    meal_slot: "dinner",
                    recipe_id: RECIPE_ID,
                    recipe_revision_id: REVISION_ID,
                    recipe_name: "Tomato soup",
                    servings: 1,
                    ownership: "personal",
                    created_by: null,
                    nutrition_per_serving: {
                        calories: 300,
                        protein_g: 9,
                        carbs_g: 40,
                        fat_g: 10,
                    },
                    version: 1,
                },
            ],
        });
        const response = await getNextUp("user-1", DATE, deps);
        expect(response.state).toBe("quiet");
        expect(response.primary).toBeNull();
        expect(response.secondary).toEqual([]);
        expect(response.quiet_line).toBe(
            "You're set for today — dinner is planned and nothing in the pantry needs using up.",
        );
    });

    test("(c) objective unset → no raw enum anywhere, suggestions still produced, goal prompt shows", async () => {
        const state = freshState();
        const deps = makeDeps(state, {
            preferences: async () => ({
                objective: "track_only",
                suggestions_enabled: false,
                allergies: [],
                excluded_ingredients: [],
            }),
        });
        const response = await getNextUp("user-1", DATE, deps);
        expect(JSON.stringify(response)).not.toContain("track_only");
        expect(response.state).toBe("suggestion");
        expect(response.objective_set).toBe(false);
        expect(response.goal_prompt.show).toBe(true);
    });

    test("(d) model citing an invented number is rejected; deterministic pick ships instead", async () => {
        const state = freshState();
        const deps = makeDeps(state, {
            aiConfig: () => AI_CONFIG,
            fetcher: modelFetcher(state, {
                candidate_id: `recipe:${RECIPE_ID}`,
                servings: 1,
                reason: "It packs 999 g of protein into lunch.",
            }),
        });
        const response = await getNextUp("user-1", DATE, deps);
        expect(response.state).toBe("suggestion");
        expect(response.primary?.composition_source).toBe("deterministic");
        expect(response.primary?.reason).not.toContain("999");
    });

    test("(d2) a grounded model pick ships as the composition", async () => {
        const state = freshState();
        const deps = makeDeps(state, {
            aiConfig: () => AI_CONFIG,
            fetcher: modelFetcher(state, {
                candidate_id: `recipe:${RECIPE_ID}`,
                servings: 1,
                reason: "It uses the chicken breast before it goes off.",
            }),
        });
        const response = await getNextUp("user-1", DATE, deps);
        expect(response.primary?.composition_source).toBe("model");
        expect(response.primary?.reason).toContain("chicken breast");
        expect(state.fetchCalls).toBe(1);
    });

    test("cache: two consecutive loads compose once (one model call)", async () => {
        const state = freshState();
        const deps = makeDeps(state, {
            aiConfig: () => AI_CONFIG,
            fetcher: modelFetcher(state, {
                candidate_id: `recipe:${RECIPE_ID}`,
                servings: 1,
                reason: "It uses the chicken breast before it goes off.",
            }),
        });
        await getNextUp("user-1", DATE, deps);
        await getNextUp("user-1", DATE, deps);
        expect(state.fetchCalls).toBe(1);
    });

    test("invalidation: logging a meal moves the fingerprint and recomposes", async () => {
        const state = freshState();
        let logged = false;
        const deps = makeDeps(state, {
            aiConfig: () => AI_CONFIG,
            fetcher: modelFetcher(state, {
                candidate_id: `recipe:${RECIPE_ID}`,
                servings: 1,
                reason: "It uses the chicken breast before it goes off.",
            }),
            today: async () =>
                logged
                    ? {
                          totals: {
                              calories: 1420,
                              proteinG: 97,
                              carbsG: 148,
                              fatG: 46,
                          },
                          meals: [
                              {
                                  id: "m1",
                                  description: "Oats",
                                  meal_type: "breakfast",
                                  calories: 900,
                                  protein_g: 55,
                                  carbs_g: 100,
                                  fat_g: 30,
                                  items: [],
                              },
                              {
                                  id: "m2",
                                  description: "Chicken rice bowl",
                                  meal_type: "lunch",
                                  calories: 520,
                                  protein_g: 42,
                                  carbs_g: 48,
                                  fat_g: 16,
                                  items: [],
                              },
                          ],
                      }
                    : {
                          totals: {
                              calories: 900,
                              proteinG: 55,
                              carbsG: 100,
                              fatG: 30,
                          },
                          meals: [
                              {
                                  id: "m1",
                                  description: "Oats",
                                  meal_type: "breakfast",
                                  calories: 900,
                                  protein_g: 55,
                                  carbs_g: 100,
                                  fat_g: 30,
                                  items: [],
                              },
                          ],
                      },
        });
        await getNextUp("user-1", DATE, deps);
        logged = true;
        await getNextUp("user-1", DATE, deps);
        expect(state.fetchCalls).toBe(2);
    });

    test("toggles: Pantry off contributes nothing; Plan off is never even read; Groceries off hides its action", async () => {
        const state = freshState();
        const deps = makeDeps(state, {
            features: async () => ({
                plan: false,
                recipes: true,
                groceries: false,
                pantry: false,
                cooks: true,
            }),
        });
        const response = await getNextUp("user-1", DATE, deps);
        expect(state.planCalls).toBe(0);
        expect(response.primary?.uses_pantry).toEqual([]);
        expect(response.primary?.actions.plan).toBe(false);
        expect(response.primary?.actions.groceries).toBe(false);
        // With the pantry dark, every ingredient reads as missing —
        // but the grocery action stays hidden because Groceries is off.
        expect(response.primary?.missing_ingredients).toContain(
            "Chicken breast",
        );
    });

    test("a past date renders no suggestion and no goal prompt", async () => {
        const state = freshState();
        const response = await getNextUp(
            "user-1",
            "2026-11-09",
            makeDeps(state),
        );
        expect(response.state).toBe("quiet");
        expect(response.quiet_line).toBeNull();
        expect(response.primary).toBeNull();
        expect(response.goal_prompt.show).toBe(false);
    });

    test("allergy exclusions remove candidates outright", async () => {
        const state = freshState();
        const deps = makeDeps(state, {
            preferences: async () => ({
                objective: "maintain",
                suggestions_enabled: true,
                allergies: ["Chicken"],
                excluded_ingredients: [],
            }),
        });
        const response = await getNextUp("user-1", DATE, deps);
        expect(response.state).toBe("quiet");
        expect(response.primary).toBeNull();
    });
});
