import { describe, expect, test } from "bun:test";
import {
    generatedRecipeSchema,
    guidancePreferencesSchema,
    planningPreferenceOverridesSchema,
    type GuidancePreferences,
} from "./contracts.js";
import {
    buildDailyGuidance,
    buildWeeklyCheckin,
    checkRecipeConstraints,
    dayTotalsAfterMealSwap,
    isNearDuplicate,
    objectiveLabel,
    recipeFingerprint,
    varietyScore,
} from "./domain.js";

function preferences(
    overrides: Partial<GuidancePreferences> = {},
): GuidancePreferences {
    return {
        objective: "track_only",
        suggestions_enabled: false,
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
        servings: 2,
        allow_repeats: false,
        repeat_window_days: 21,
        ...overrides,
    };
}

const recipe = (
    overrides: Partial<Parameters<typeof checkRecipeConstraints>[0]> = {},
) => ({
    name: "Lemon salmon bowl",
    ingredients: [
        { name: "salmon", quantity: 1, unit: "fillet", optional: false },
        { name: "rice", quantity: 1, unit: "cup", optional: false },
    ],
    difficulty: "easy" as const,
    preparation_minutes: 20,
    cooking_minutes: 15,
    required_equipment: ["oven"],
    primary_protein: "salmon",
    cuisine_tags: ["Japanese"],
    cooking_methods: ["baking"],
    ...overrides,
});

describe("guided nutrition domain rules", () => {
    test("blocks listed allergens, unknown ingredients when allergies exist, exclusions and unavailable equipment", () => {
        const check = checkRecipeConstraints(
            recipe({
                ingredients: [
                    {
                        name: "butter",
                        quantity: 1,
                        unit: "tbsp",
                        optional: false,
                    },
                    {
                        name: "mystery spice blend",
                        quantity: 1,
                        unit: "tsp",
                        optional: false,
                    },
                    {
                        name: "chicken breast",
                        quantity: 1,
                        unit: "piece",
                        optional: false,
                    },
                ],
                required_equipment: ["oven"],
            }),
            preferences({
                allergies: ["dairy"],
                excluded_ingredients: ["chicken"],
                equipment: ["stovetop"],
            }),
        );
        expect(check.blockers).toContain(
            "Possible allergy match (milk): butter",
        );
        expect(check.blockers).toContain(
            "Allergen status is unknown for: mystery spice blend",
        );
        expect(check.blockers).toContain("Excluded ingredient: chicken breast");
        expect(check.blockers).toContain(
            "Unavailable required equipment: oven",
        );
    });

    test("reports preference mismatches without turning dislikes and time into hard blockers", () => {
        const check = checkRecipeConstraints(
            recipe({
                ingredients: [
                    {
                        name: "salmon",
                        quantity: 1,
                        unit: "piece",
                        optional: false,
                    },
                ],
                difficulty: "easy",
            }),
            preferences({
                disliked_ingredients: ["salmon"],
                liked_ingredients: ["broccoli"],
                cuisines: ["Mexican"],
                preferred_methods: ["grilling"],
                difficulty: "advanced",
                max_prep_minutes: 10,
                max_total_minutes: 25,
            }),
        );
        expect(check.blockers).toEqual([]);
        expect(check.warnings).toContain(
            "Disliked ingredient included: salmon",
        );
        expect(check.warnings).toContain(
            "Recipe difficulty (easy) differs from preference (advanced)",
        );
        expect(check.warnings).toContain(
            "Preparation time is above 10 minutes",
        );
        expect(check.warnings).toContain("Total time is above 25 minutes");
        expect(check.warnings).toContain(
            "Recipe does not use a preferred cooking method",
        );
        expect(check.warnings).toContain(
            "Recipe does not include a listed liked ingredient",
        );
        expect(check.warnings).toContain(
            "Recipe does not match a listed cuisine preference",
        );
    });

    test("blocks avoided methods and recognizes normalized terms", () => {
        const check = checkRecipeConstraints(
            recipe({ cooking_methods: ["deep-frying"] }),
            preferences({
                avoided_methods: ["frying"],
                preferred_methods: ["deep frying"],
            }),
        );
        expect(check.blockers).toContain(
            "Recipe uses an avoided cooking method",
        );
        expect(check.warnings).not.toContain(
            "Recipe does not use a preferred cooking method",
        );
    });

    test("fingerprints normalize accents and identify exact and near duplicates", () => {
        const first = recipeFingerprint({
            name: "Crème Salmon Bowl",
            ingredients: ["Rice", "Salmon", "Rice"],
            cuisineTags: ["Japanese"],
        });
        const same = recipeFingerprint({
            name: "creme salmon bowl",
            ingredients: ["salmon", "rice"],
            cuisineTags: ["japanese"],
        });
        const similar = recipeFingerprint({
            name: "Salmon dinner",
            ingredients: ["salmon", "rice"],
        });
        const different = recipeFingerprint({
            name: "Bean Chili",
            ingredients: ["beans", "tomato"],
        });
        expect(first).toEqual(same);
        expect(isNearDuplicate(first, same)).toBe(true);
        expect(isNearDuplicate(first, similar)).toBe(true);
        expect(isNearDuplicate(first, different)).toBe(false);
    });

    test("scores variety against recent meals and gives a stable first-choice baseline", () => {
        const salmon = {
            name: "Lemon salmon",
            ingredients: ["salmon", "rice"],
            cuisineTags: ["Japanese"],
            primaryProtein: "salmon",
            cookingMethods: ["baking"],
        };
        const beef = {
            name: "Beef tacos",
            ingredients: ["beef", "corn", "lime"],
            cuisineTags: ["Mexican"],
            primaryProtein: "beef",
            cookingMethods: ["grilling"],
        };
        expect(varietyScore(salmon, [])).toBe(100);
        expect(varietyScore(beef, [salmon])).toBeGreaterThan(
            varietyScore(salmon, [salmon]),
        );
    });

    test("meal swap day totals scale per-serving nutrients by planned servings", () => {
        expect(
            dayTotalsAfterMealSwap({
                dayTotals: { calories: 1600, protein_g: 120 },
                currentPerServing: { calories: 400, protein_g: 30 },
                replacementPerServing: { calories: 500, protein_g: 35 },
                servings: 2,
            }),
        ).toEqual({ calories: 1800, protein_g: 130 });
        expect(
            dayTotalsAfterMealSwap({
                dayTotals: { calories: 1600, protein_g: null },
                currentPerServing: { calories: 400, protein_g: 30 },
                replacementPerServing: { calories: 500, protein_g: 35 },
                servings: 2,
            }),
        ).toEqual({ calories: 1800, protein_g: null });
    });

    test("weekly check-in reports coverage, uncertainty and absence without assuming zero intake", () => {
        const empty = buildWeeklyCheckin({
            startDate: "2026-10-05",
            endDate: "2026-10-06",
            timezone: "UTC",
            days: [
                {
                    date: "2026-10-05",
                    meals: [],
                    waterMl: 0,
                    plannedMeals: 1,
                    loggedPlannedMeals: 0,
                },
                {
                    date: "2026-10-06",
                    meals: [],
                    waterMl: 0,
                    plannedMeals: 0,
                    loggedPlannedMeals: 0,
                },
            ],
            goals: { calories: 2000, protein_g: 100, water_ml: 2000 },
        });
        expect(empty.coverage_percent).toBe(0);
        expect(empty.averages_on_recorded_days.calories).toBeNull();
        expect(empty.observations[0]).toContain("No meals were recorded");
        expect(empty.planned_meals).toBe(1);

        const observed = buildWeeklyCheckin({
            startDate: "2026-10-05",
            endDate: "2026-10-06",
            timezone: "America/New_York",
            days: [
                {
                    date: "2026-10-05",
                    meals: [
                        {
                            calories: 900,
                            protein_g: 45,
                            nutrition_status: "complete",
                        },
                    ],
                    waterMl: 500,
                    plannedMeals: 2,
                    loggedPlannedMeals: 1,
                },
                {
                    date: "2026-10-06",
                    meals: [
                        {
                            calories: null,
                            protein_g: 10,
                            nutrition_status: "partial",
                        },
                    ],
                    waterMl: 0,
                    plannedMeals: 1,
                    loggedPlannedMeals: 0,
                },
            ],
            goals: {
                calories: 2000,
                protein_g: 100,
                water_ml: 2000,
                revision_id: "rev-2",
            },
        });
        expect(observed.coverage_percent).toBe(100);
        expect(observed.averages_on_recorded_days.calories?.value).toBe(900);
        expect(observed.uncertain_nutrition_meals).toBe(1);
        expect(observed.missing_core_nutrient_meals).toBe(1);
        expect(observed.goal_revision_id).toBe("rev-2");
        expect(observed.planned_meals_logged).toBe(1);
    });

    test("daily guidance separates planned meals from recorded intake and surfaces only known next steps", () => {
        const sparse = buildDailyGuidance({
            date: "2026-10-09",
            objective: "track_only",
            calories: null,
            protein_g: null,
            water_ml: null,
            goals: { calories: 2000, protein_g: 90, water_ml: 1500 },
            plannedMeals: [
                { meal_slot: "dinner", recipe_name: "Planned soup" },
            ],
        });
        expect(sparse.source_status).toBe("sparse_data");
        expect(sparse.actions[0]).toContain(
            "not evidence that you have eaten nothing",
        );
        expect(sparse.actions[1]).toContain(
            "planning does not mean the meal was eaten",
        );

        const recorded = buildDailyGuidance({
            date: "2026-10-09",
            objective: "lose",
            calories: 1200,
            protein_g: 40,
            water_ml: 500,
            goals: { calories: 2000, protein_g: 90, water_ml: 1500 },
            plannedMeals: [],
        });
        expect(recorded.source_status).toBe("recorded_data");
        expect(recorded.actions[0]).toContain("Protein recorded so far");
        expect(recorded.actions[1]).toContain("Water recorded");
        // Feature toggles (T3): the Plan-off assembly passes no planned
        // meals, so no plan-derived action or payload can appear.
        expect(recorded.planned_meals).toEqual([]);
        expect(
            recorded.actions.some((action) =>
                action.toLowerCase().includes("planned"),
            ),
        ).toBe(false);
        expect(objectiveLabel("maintain")).toBe("maintain weight");
        expect(objectiveLabel("gain")).toBe("gain weight");
        expect(objectiveLabel("lose")).toBe("lose weight");
        expect(objectiveLabel("track_only")).toBe("track without an objective");
    });
});

describe("guidance request contracts", () => {
    test("accepts bounded preferences and partial planning overrides", () => {
        expect(
            guidancePreferencesSchema.parse(
                preferences({ allergies: ["milk"] }),
            ),
        ).toMatchObject({ allergies: ["milk"] });
        expect(
            guidancePreferencesSchema.safeParse({
                ...preferences(),
                undocumented: true,
            }).success,
        ).toBe(false);
        expect(
            planningPreferenceOverridesSchema.parse({ allergies: ["milk"] }),
        ).toEqual({ allergies: ["milk"] });
    });

    test("keeps generated recipe proposals strict and excludes model nutrition claims", () => {
        const candidate = {
            ...recipe(),
            description: "A simple meal",
            instructions: ["Cook the salmon and serve it with rice."],
            servings: 2,
        };
        expect(generatedRecipeSchema.parse(candidate).name).toBe(
            "Lemon salmon bowl",
        );
        expect(
            generatedRecipeSchema.safeParse({ ...candidate, calories: 900 })
                .success,
        ).toBe(false);
    });
});
