// Strict local MCP Apps host for visual and interaction testing.
//
//   bun run scripts/widget-harness.ts
//
// It starts widgets inline, supports ui/request-display-mode, responds to
// ui/message/update-model-context, and exercises app-initiated tool calls.

import { getWidgetHtml, WIDGET_TEMPLATES } from "../src/widgets.js";

const PORT = Number(process.env.HARNESS_PORT ?? 8787);
const KEYS = Object.keys(WIDGET_TEMPLATES);

const goals = {
    calories: 2200,
    protein_g: 160,
    carbs_g: 220,
    fat_g: 70,
    fiber_g: 30,
    sugar_g: 45,
    alcohol_g: null,
    water_ml: 2500,
};
const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 6, 17 + index));
    const wave = Math.sin(index / 3);
    return {
        date: date.toISOString().slice(0, 10),
        meal_count: index % 8 === 0 ? 0 : 3,
        calories: index % 8 === 0 ? 0 : Math.round(2020 + wave * 240),
        protein_g: index % 8 === 0 ? 0 : Math.round(145 + wave * 18),
        carbs_g: index % 8 === 0 ? 0 : Math.round(210 + wave * 25),
        fat_g: index % 8 === 0 ? 0 : Math.round(68 + wave * 8),
        fiber_g: index % 8 === 0 ? 0 : Math.round((26 + wave * 4) * 10) / 10,
        sugar_g: index % 8 === 0 ? 0 : Math.round((48 + wave * 8) * 10) / 10,
        alcohol_g: null,
        water_ml: index % 8 === 0 ? 0 : Math.round(2050 + wave * 300),
    };
});
const meals = [
    {
        description: "Overnight oats with berries",
        meal_type: "breakfast",
        calories: 430,
        protein_g: 19,
        carbs_g: 63,
        fat_g: 12,
    },
    {
        description: "Grilled chicken and rice bowl",
        meal_type: "lunch",
        calories: 650,
        protein_g: 52,
        carbs_g: 78,
        fat_g: 16,
    },
    {
        description: "Salmon with vegetables",
        meal_type: "dinner",
        calories: 720,
        protein_g: 55,
        carbs_g: 44,
        fat_g: 34,
    },
];

const RESULTS: Record<string, unknown> = {
    "meal-logged": {
        action: "logged",
        date: "2026-08-18",
        logged_meal: {
            description: "Starbucks Medicine Ball Tea, Venti",
            meal_type: "snack",
            calories: 130,
            protein_g: 0,
            carbs_g: 33,
            fat_g: 0,
        },
        meal_items: [
            {
                id: "sample-starbucks-1",
                position: 0,
                name: "Starbucks Medicine Ball Tea",
                quantity: 1,
                portion_label: "Venti (20 fl oz)",
                gram_weight: null,
                nutrients: {
                    calories: 130,
                    protein_g: 0,
                    carbs_g: 33,
                    fat_g: 0,
                    fiber_g: 0,
                    sugar_g: 30,
                    alcohol_g: null,
                    sodium_mg: null,
                    saturated_fat_g: null,
                    cholesterol_mg: null,
                    potassium_mg: null,
                },
                source_type: "published_restaurant",
                provider: "starbucks",
                provider_food_id: "medicine-ball-venti",
                provider_revision: null,
                source_url: null,
                source_updated_at: null,
                confidence: 0.98,
                assumptions: [],
                source_snapshot: {
                    resolution_layer: "published_restaurant",
                },
            },
        ],
        has_goals: true,
        goals,
        totals: {
            calories: 1090,
            protein_g: 84,
            carbs_g: 126,
            fat_g: 33,
            fiber_g: 18,
            sugar_g: 42,
            alcohol_g: null,
            water_ml: 1600,
        },
    },
    "meal-review": {
        id: "review-123",
        version: 1,
        status: "awaiting_confirmation",
        source_mode: "photo",
        meal_type: "dinner",
        description: "Homemade chicken, rice, and vegetables",
        ready_for_confirmation: true,
        items: [
            {
                name: "Roasted chicken thigh",
                portion_label: "1 medium thigh",
                nutrients: {
                    calories: 285,
                    protein_g: 28,
                    carbs_g: 0,
                    fat_g: 19,
                },
                source_type: "model_estimate",
                confidence: 0.84,
                assumptions: ["Fork used as the scale reference"],
            },
            {
                name: "Rice",
                portion_label: "about 1 cup",
                nutrients: {
                    calories: 205,
                    protein_g: 4,
                    carbs_g: 45,
                    fat_g: 0.4,
                },
                source_type: "model_estimate",
                confidence: 0.58,
                assumptions: [],
            },
        ],
        totals: {
            calories: 490,
            protein_g: 32,
            carbs_g: 45,
            fat_g: 19.4,
        },
        assumptions: ["Fork used as the primary scale reference"],
    },
    "goal-progress": {
        date: "2026-08-05",
        meal_count: 4,
        water_entries: 6,
        goals,
        totals: {
            calories: 1980,
            protein_g: 148,
            carbs_g: 231,
            fat_g: 74,
            fiber_g: 24.6,
            sugar_g: 51,
            alcohol_g: null,
            water_ml: 2100,
        },
        weight: {
            current: 174.2,
            target: 165,
            unit: "lb",
            logged_on: "2026-08-05",
        },
    },
    "nutrition-summary": {
        start_date: days[days.length - 7]!.date,
        end_date: days[days.length - 1]!.date,
        logged_days: 6,
        goals,
        averages: {
            calories: 2055,
            protein_g: 148,
            carbs_g: 212,
            fat_g: 72,
            fiber_g: 26,
            sugar_g: 49,
            alcohol_g: null,
            water_ml: 2110,
        },
        days: days.slice(-7),
        meals,
    },
    trends: { end_date: days.at(-1)!.date, default_range: 14, goals, days },
    "weight-trends": {
        end_date: days.at(-1)!.date,
        unit: "lb",
        target: 165,
        default_range: 30,
        days: days
            .filter((_, index) => index % 2 === 0)
            .map((day, index) => ({
                date: day.date,
                weight: 178.4 - index * 0.22,
            })),
    },
    "import-meals": {
        tz: "America/New_York",
        tz_configured: true,
        max_rows_per_call: 50,
        import_tool_name: "bulk_import_meals",
        known_source_apps: [
            "MyFitnessPal",
            "Cronometer",
            "Lose It!",
            "MacroFactor",
        ],
        drink_unit: null,
    },
};

// Slice-1 state/longest fixtures for the Facts Panel port. Selected with
// ?fixture=<name> on the host page; the default RESULT above stays the
// primary fixture for each widget.
function coveredAverage(
    series: typeof days,
    key:
        | "calories"
        | "protein_g"
        | "carbs_g"
        | "fat_g"
        | "fiber_g"
        | "sugar_g"
        | "water_ml",
): number {
    const logged = series.filter((day) => day.meal_count > 0);
    const mean =
        logged.reduce((sum, day) => sum + (day[key] ?? 0), 0) / logged.length;
    return key === "calories" || key === "water_ml"
        ? Math.round(mean)
        : Math.round(mean * 10) / 10;
}

const GOALS_TEXT = [
    "Current daily goals:",
    "- Calories: 2200 kcal",
    "- Protein: 160g",
    "- Carbs: 220g",
    "- Fat: 70g",
    "- Fiber: 30g",
    "- Sugar (total, max): 45g",
    "- Water: 2500 ml",
    "- Target weight: 165 lb",
].join("\n");

const FIXTURES: Record<string, Record<string, unknown>> = {
    "nutrition-summary": {
        // Longest realistic payload: the full 30-day series. Averages are
        // computed from the series here so fixture arithmetic is exact.
        long: {
            start_date: days[0]!.date,
            end_date: days[days.length - 1]!.date,
            logged_days: days.filter((day) => day.meal_count > 0).length,
            goals,
            averages: {
                calories: coveredAverage(days, "calories"),
                protein_g: coveredAverage(days, "protein_g"),
                carbs_g: coveredAverage(days, "carbs_g"),
                fat_g: coveredAverage(days, "fat_g"),
                fiber_g: coveredAverage(days, "fiber_g"),
                sugar_g: coveredAverage(days, "sugar_g"),
                alcohol_g: null,
                water_ml: coveredAverage(days, "water_ml"),
            },
            recorded_days: {
                fiber_g: days.filter((day) => day.meal_count > 0).length,
                sugar_g: days.filter((day) => day.meal_count > 0).length,
                alcohol_g: null,
            },
            days,
            meals,
        },
        empty: {
            start_date: days[0]!.date,
            end_date: days[6]!.date,
            logged_days: 0,
            goals,
            averages: {
                calories: 0,
                protein_g: 0,
                carbs_g: 0,
                fat_g: 0,
                fiber_g: 0,
                sugar_g: 0,
                alcohol_g: null,
                water_ml: 0,
            },
            days: [],
            meals: [],
        },
        error: { error: "The summary could not be read. Try again in chat." },
    },
    "goal-progress": {
        // The goals tools are text-output tools; this is the exact payload
        // shape their binding delivers ({ text } from formatGoals).
        targets: { text: GOALS_TEXT },
        "targets-updated": {
            text: `Goals updated.\n\n${GOALS_TEXT}`,
        },
        "targets-empty": {
            text: "No nutrition goals set. Use set_nutrition_goals to define daily targets.",
        },
        empty: {
            date: "2026-08-05",
            meal_count: 0,
            water_entries: 0,
            goals,
            totals: {
                calories: 0,
                protein_g: 0,
                carbs_g: 0,
                fat_g: 0,
                fiber_g: 0,
                sugar_g: 0,
                alcohol_g: null,
                water_ml: 0,
            },
            weight: null,
            meals: [],
        },
        error: { error: "Goal progress could not be read. Try again in chat." },
    },
    // Slice-2 fixtures: meal flow. Item nutrients below sum exactly to
    // each fixture's rendered total (the numbers acceptance check).
    "meal-review": {
        // Longest realistic payload for the height gate: a 12-item meal.
        // Totals: 916 kcal · P 64.7 · C 91.5 · F 31 (item sums).
        long12: {
            review: {
                id: "review-12",
                version: 2,
                status: "awaiting_confirmation",
                source_mode: "photo",
                meal_type: "dinner",
                description: "Chicken burrito bowl",
                ready_for_confirmation: true,
                items: [
                    {
                        position: 0,
                        name: "Grilled chicken breast",
                        portion_label: "6 oz",
                        nutrients: {
                            calories: 284,
                            protein_g: 46,
                            carbs_g: 0,
                            fat_g: 10,
                        },
                        source_type: "usda",
                        provider: "usda",
                        confidence: 0.98,
                        assumptions: [],
                    },
                    {
                        position: 1,
                        name: "Cilantro-lime rice",
                        portion_label: "1 cup, cooked",
                        nutrients: {
                            calories: 212,
                            protein_g: 4,
                            carbs_g: 45,
                            fat_g: 1,
                        },
                        source_type: "usda",
                        provider: "usda",
                        confidence: 0.97,
                        assumptions: [],
                    },
                    {
                        position: 2,
                        name: "Black beans",
                        portion_label: "1/2 cup",
                        nutrients: {
                            calories: 114,
                            protein_g: 7,
                            carbs_g: 20,
                            fat_g: 0.5,
                        },
                        source_type: "usda",
                        provider: "usda",
                        confidence: 0.96,
                        assumptions: [],
                    },
                    {
                        position: 3,
                        name: "Guacamole, store-bought",
                        portion_label: "1/4 cup",
                        nutrients: {
                            calories: 91,
                            protein_g: 1,
                            carbs_g: 5,
                            fat_g: 8,
                        },
                        source_type: "open_food_facts",
                        provider: "open_food_facts",
                        confidence: 0.9,
                        assumptions: [],
                    },
                    {
                        position: 4,
                        name: "Corn salsa",
                        portion_label: "1/3 cup",
                        nutrients: {
                            calories: 38,
                            protein_g: 1,
                            carbs_g: 8,
                            fat_g: 0.5,
                        },
                        source_type: "model_estimate",
                        confidence: 0.55,
                        assumptions: ["Portion estimated from the photo"],
                    },
                    {
                        position: 5,
                        name: "Shredded cheddar",
                        portion_label: "1/2 oz",
                        nutrients: {
                            calories: 56,
                            protein_g: 3.5,
                            carbs_g: 0,
                            fat_g: 4.5,
                        },
                        source_type: "usda",
                        provider: "usda",
                        confidence: 0.95,
                        assumptions: [],
                    },
                    {
                        position: 6,
                        name: "Sour cream",
                        portion_label: "1 tbsp",
                        nutrients: {
                            calories: 30,
                            protein_g: 0.5,
                            carbs_g: 1,
                            fat_g: 3,
                        },
                        source_type: "usda",
                        provider: "usda",
                        confidence: 0.94,
                        assumptions: [],
                    },
                    {
                        position: 7,
                        name: "Romaine lettuce",
                        portion_label: "1 cup",
                        nutrients: {
                            calories: 8,
                            protein_g: 0.5,
                            carbs_g: 1.5,
                            fat_g: 0,
                        },
                        source_type: "usda",
                        provider: "usda",
                        confidence: 0.97,
                        assumptions: [],
                    },
                    {
                        position: 8,
                        name: "Diced tomato",
                        portion_label: "1/4 cup",
                        nutrients: {
                            calories: 5,
                            protein_g: 0.2,
                            carbs_g: 1,
                            fat_g: 0,
                        },
                        source_type: "usda",
                        provider: "usda",
                        confidence: 0.97,
                        assumptions: [],
                    },
                    {
                        position: 9,
                        name: "Lime juice",
                        portion_label: "1 tbsp",
                        nutrients: {
                            calories: 4,
                            protein_g: 0,
                            carbs_g: 1,
                            fat_g: 0,
                        },
                        source_type: "usda",
                        provider: "usda",
                        confidence: 0.98,
                        assumptions: [],
                    },
                    {
                        position: 10,
                        name: "Hot sauce",
                        portion_label: "1 tsp",
                        nutrients: {
                            calories: 0,
                            protein_g: 0,
                            carbs_g: 0,
                            fat_g: 0,
                        },
                        source_type: "user_supplied",
                        confidence: 1,
                        assumptions: [],
                    },
                    {
                        position: 11,
                        name: "Tortilla chips",
                        portion_label: "6 chips",
                        nutrients: {
                            calories: 74,
                            protein_g: 1,
                            carbs_g: 9,
                            fat_g: 3.5,
                        },
                        source_type: "open_food_facts",
                        provider: "open_food_facts",
                        confidence: 0.88,
                        assumptions: [],
                    },
                ],
                totals: {
                    calories: 916,
                    protein_g: 64.7,
                    carbs_g: 91.5,
                    fat_g: 31,
                },
                assumptions: ["Portion estimated from the photo"],
                questions: [],
                next_question: null,
            },
        },
        // get_meal_draft shape: { found, draft } in serializeDraft form —
        // camelCase item fields, no totals, one open question, so the Log
        // meal action stays disabled until the round resolves.
        draft: {
            found: true,
            draft: {
                id: "draft-2",
                status: "collecting",
                source_mode: "photo",
                meal_type: "dinner",
                description: "Homemade chicken, rice, and vegetables",
                version: 3,
                items: [
                    {
                        id: "draft-item-1",
                        position: 0,
                        name: "Roasted chicken thigh",
                        quantity: 1,
                        portionLabel: "1 medium thigh",
                        nutrients: {
                            calories: 285,
                            protein_g: 28,
                            carbs_g: 0,
                            fat_g: 19,
                        },
                        sourceType: "model_estimate",
                        confidence: 0.82,
                        assumptions: ["Fork used as a scale reference"],
                    },
                    {
                        id: "draft-item-2",
                        position: 1,
                        name: "Rice",
                        quantity: 1,
                        portionLabel: "about 1 cup",
                        nutrients: {
                            calories: 205,
                            protein_g: 4,
                            carbs_g: 45,
                            fat_g: 0.4,
                        },
                        sourceType: "model_estimate",
                        confidence: 0.58,
                        assumptions: [],
                    },
                ],
                questions: [
                    {
                        id: "q-1",
                        item_id: "draft-item-2",
                        question_key: "rice-amount",
                        prompt: "How much rice was on the plate — about a cup, or closer to half a cup?",
                        impact_score: 60,
                        status: "open",
                        answer: null,
                    },
                ],
                next_question: {
                    id: "q-1",
                    itemId: "draft-item-2",
                    questionKey: "rice-amount",
                    prompt: "How much rice was on the plate — about a cup, or closer to half a cup?",
                    impactScore: 60,
                    status: "open",
                    answer: null,
                },
            },
        },
        // prepare_meal_confirmation shape: { draft } at awaiting_confirmation
        // with zero open questions — the widget derives totals (490 kcal)
        // and readiness from the draft itself.
        confirm: {
            draft: {
                id: "draft-3",
                status: "awaiting_confirmation",
                source_mode: "photo",
                meal_type: "dinner",
                description: "Homemade chicken, rice, and vegetables",
                version: 4,
                items: [
                    {
                        id: "draft-item-1",
                        position: 0,
                        name: "Roasted chicken thigh",
                        quantity: 1,
                        portionLabel: "1 medium thigh",
                        nutrients: {
                            calories: 285,
                            protein_g: 28,
                            carbs_g: 0,
                            fat_g: 19,
                        },
                        sourceType: "model_estimate",
                        confidence: 0.82,
                        assumptions: ["Fork used as a scale reference"],
                    },
                    {
                        id: "draft-item-2",
                        position: 1,
                        name: "Rice",
                        quantity: 1,
                        portionLabel: "about 1 cup",
                        nutrients: {
                            calories: 205,
                            protein_g: 4,
                            carbs_g: 45,
                            fat_g: 0.4,
                        },
                        sourceType: "model_estimate",
                        confidence: 0.58,
                        assumptions: [],
                    },
                ],
                questions: [],
                next_question: null,
            },
        },
        empty: { found: false, draft: null },
        error: {
            error: "The meal review could not be read. Try again in chat.",
        },
    },
    "meal-logged": {
        // log_recipe shape: items nest inside logged_meal; no day totals.
        // Item sums: 640 kcal · P 28 · C 84 · F 18 = the meal line.
        recipe: {
            logged_meal: {
                id: "meal-recipe-1",
                logged_at: "2026-08-18T18:30:00Z",
                meal_type: "dinner",
                description: "Lentil soup (2 servings)",
                calories: 640,
                protein_g: 28,
                carbs_g: 84,
                fat_g: 18,
                items: [
                    {
                        id: "recipe-item-1",
                        position: 0,
                        name: "Lentil soup",
                        quantity: 2,
                        portion_label: "2 servings",
                        gram_weight: null,
                        nutrients: {
                            calories: 380,
                            protein_g: 24,
                            carbs_g: 62,
                            fat_g: 8,
                        },
                        source_type: "saved_food",
                        provider: null,
                        provider_food_id: null,
                        source_url: null,
                        confidence: 0.92,
                        assumptions: [],
                        source_snapshot: {},
                    },
                    {
                        id: "recipe-item-2",
                        position: 1,
                        name: "Sourdough bread",
                        quantity: 1,
                        portion_label: "1 slice",
                        gram_weight: null,
                        nutrients: {
                            calories: 260,
                            protein_g: 4,
                            carbs_g: 22,
                            fat_g: 10,
                        },
                        source_type: "usda",
                        provider: "usda",
                        provider_food_id: null,
                        source_url: null,
                        confidence: 0.95,
                        assumptions: [],
                        source_snapshot: {},
                    },
                ],
            },
            recipe_id: "recipe-1",
            recipe_revision_id: "revision-3",
            recipe_revision_number: 3,
            servings_consumed: 2,
            deduplicated: false,
        },
        // log_cook_portion shape: the raw logRecipe result (camelCase
        // meal record) nested under `result`.
        "cook-portion": {
            result: {
                meal: {
                    id: "meal-cook-1",
                    loggedAt: "2026-08-18T13:00:00Z",
                    mealType: "lunch",
                    description: "Tomato pasta (1 serving)",
                    calories: 520,
                    proteinG: 18,
                    carbsG: 72,
                    fatG: 16,
                    items: [
                        {
                            id: "cook-item-1",
                            position: 0,
                            name: "Tomato pasta",
                            quantity: 1,
                            portionLabel: "1 serving",
                            nutrients: {
                                calories: 520,
                                protein_g: 18,
                                carbs_g: 72,
                                fat_g: 16,
                            },
                            sourceType: "saved_food",
                            provider: null,
                            confidence: 0.9,
                            assumptions: [],
                            sourceSnapshot: {},
                        },
                    ],
                },
                deduplicated: false,
                recipeId: "recipe-2",
                recipeRevisionId: "revision-1",
                recipeRevisionNumber: 1,
                servingsConsumed: 1,
            },
            source_cook_id: "cook-1",
            source_dish_id: "dish-1",
            recipe_id: "recipe-2",
            recipe_revision_id: "revision-1",
        },
        // get_meal_details shape: { meal: { ..., items } }, read mode.
        // Item sums: 720 kcal · P 55 · C 44 · F 34 = the meal line.
        details: {
            meal: {
                id: "meal-details-1",
                logged_at: "2026-08-18T18:30:00Z",
                meal_type: "dinner",
                description: "Salmon with vegetables",
                calories: 720,
                protein_g: 55,
                carbs_g: 44,
                fat_g: 34,
                fiber_g: 6,
                sugar_g: 8,
                alcohol_g: null,
                notes: null,
                source_recipe_id: null,
                source_recipe_revision_id: null,
                source_planned_meal_id: null,
                item_count: 2,
                items: [
                    {
                        id: "details-item-1",
                        position: 0,
                        name: "Atlantic salmon fillet",
                        quantity: 1,
                        portion_label: "6 oz",
                        gram_weight: null,
                        nutrients: {
                            calories: 480,
                            protein_g: 46,
                            carbs_g: 0,
                            fat_g: 28,
                            fiber_g: 0,
                            sugar_g: 0,
                            alcohol_g: null,
                            sodium_mg: null,
                            saturated_fat_g: null,
                            cholesterol_mg: null,
                            potassium_mg: null,
                        },
                        source_type: "usda",
                        provider: "usda",
                        provider_food_id: null,
                        provider_revision: null,
                        source_url: null,
                        source_updated_at: null,
                        confidence: 0.97,
                        assumptions: [],
                        source_snapshot: {},
                    },
                    {
                        id: "details-item-2",
                        position: 1,
                        name: "Roasted vegetables",
                        quantity: 1,
                        portion_label: "1 1/2 cups",
                        gram_weight: null,
                        nutrients: {
                            calories: 240,
                            protein_g: 9,
                            carbs_g: 44,
                            fat_g: 6,
                            fiber_g: 6,
                            sugar_g: 8,
                            alcohol_g: null,
                            sodium_mg: null,
                            saturated_fat_g: null,
                            cholesterol_mg: null,
                            potassium_mg: null,
                        },
                        source_type: "model_estimate",
                        provider: null,
                        provider_food_id: null,
                        provider_revision: null,
                        source_url: null,
                        source_updated_at: null,
                        confidence: 0.7,
                        assumptions: ["Oil amount estimated from sheen"],
                        source_snapshot: {},
                    },
                ],
                legacy_aggregate: false,
            },
        },
        // get_nutrition_provenance shape. Source rows sum to the coverage
        // line: 126 items · 64,200 itemized kcal of 68,400 (93.9%).
        provenance: {
            start_date: "2026-07-20",
            end_date: "2026-08-18",
            timezone: "America/New_York",
            coverage: {
                meal_count: 42,
                structured_meal_count: 38,
                legacy_meal_count: 4,
                item_count: 126,
                total_calories: 68400,
                itemized_calories: 64200,
                itemized_calorie_percent: 93.9,
            },
            sources: [
                {
                    source: "usda",
                    item_count: 74,
                    calories: 38100,
                    percent_of_items: 58.7,
                },
                {
                    source: "open_food_facts",
                    item_count: 22,
                    calories: 12400,
                    percent_of_items: 17.5,
                },
                {
                    source: "model_estimate",
                    item_count: 18,
                    calories: 8600,
                    percent_of_items: 14.3,
                },
                {
                    source: "published_restaurant",
                    item_count: 12,
                    calories: 5100,
                    percent_of_items: 9.5,
                },
            ],
            confidence: {
                recorded_item_count: 126,
                average: 0.91,
                high_confidence_item_count: 96,
                estimated_item_count: 18,
            },
            contributors: {
                calories: [
                    {
                        meal_id: "m-1",
                        item_id: "i-1",
                        name: "Grilled chicken breast",
                        value: 284,
                        source: "usda",
                        provider: "usda",
                    },
                    {
                        meal_id: "m-2",
                        item_id: "i-2",
                        name: "Atlantic salmon fillet",
                        value: 480,
                        source: "usda",
                        provider: "usda",
                    },
                ],
                protein_g: [
                    {
                        meal_id: "m-1",
                        item_id: "i-1",
                        name: "Grilled chicken breast",
                        value: 46,
                        source: "usda",
                        provider: "usda",
                    },
                ],
            },
        },
        // Long receipt: 8 items. Item sums: 760 kcal · P 53 · C 74 · F 15.5.
        long: {
            action: "logged",
            date: "2026-08-18",
            logged_meal: {
                description: "Big mixed lunch",
                meal_type: "lunch",
                calories: 760,
                protein_g: 53,
                carbs_g: 74,
                fat_g: 15.5,
            },
            meal_items: [
                {
                    id: "long-1",
                    position: 0,
                    name: "Turkey sandwich",
                    quantity: 1,
                    portion_label: "1 sandwich",
                    nutrients: {
                        calories: 200,
                        protein_g: 20,
                        carbs_g: 10,
                        fat_g: 5,
                    },
                    source_type: "usda",
                    provider: "usda",
                    confidence: 0.95,
                    assumptions: [],
                    source_snapshot: {},
                },
                {
                    id: "long-2",
                    position: 1,
                    name: "Potato soup",
                    quantity: 1,
                    portion_label: "1 cup",
                    nutrients: {
                        calories: 150,
                        protein_g: 10,
                        carbs_g: 15,
                        fat_g: 3,
                    },
                    source_type: "usda",
                    provider: "usda",
                    confidence: 0.93,
                    assumptions: [],
                    source_snapshot: {},
                },
                {
                    id: "long-3",
                    position: 2,
                    name: "Side salad",
                    quantity: 1,
                    portion_label: "1 bowl",
                    nutrients: {
                        calories: 120,
                        protein_g: 8,
                        carbs_g: 12,
                        fat_g: 2,
                    },
                    source_type: "model_estimate",
                    provider: null,
                    confidence: 0.66,
                    assumptions: [],
                    source_snapshot: {},
                },
                {
                    id: "long-4",
                    position: 3,
                    name: "Apple",
                    quantity: 1,
                    portion_label: "1 medium",
                    nutrients: {
                        calories: 90,
                        protein_g: 5,
                        carbs_g: 10,
                        fat_g: 2,
                    },
                    source_type: "usda",
                    provider: "usda",
                    confidence: 0.97,
                    assumptions: [],
                    source_snapshot: {},
                },
                {
                    id: "long-5",
                    position: 4,
                    name: "Greek yogurt",
                    quantity: 1,
                    portion_label: "3/4 cup",
                    nutrients: {
                        calories: 80,
                        protein_g: 4,
                        carbs_g: 9,
                        fat_g: 1.5,
                    },
                    source_type: "open_food_facts",
                    provider: "open_food_facts",
                    confidence: 0.91,
                    assumptions: [],
                    source_snapshot: {},
                },
                {
                    id: "long-6",
                    position: 5,
                    name: "Granola",
                    quantity: 1,
                    portion_label: "1/4 cup",
                    nutrients: {
                        calories: 60,
                        protein_g: 3,
                        carbs_g: 8,
                        fat_g: 1,
                    },
                    source_type: "open_food_facts",
                    provider: "open_food_facts",
                    confidence: 0.9,
                    assumptions: [],
                    source_snapshot: {},
                },
                {
                    id: "long-7",
                    position: 6,
                    name: "Orange juice",
                    quantity: 1,
                    portion_label: "1/2 cup",
                    nutrients: {
                        calories: 40,
                        protein_g: 2,
                        carbs_g: 6,
                        fat_g: 0.5,
                    },
                    source_type: "usda",
                    provider: "usda",
                    confidence: 0.96,
                    assumptions: [],
                    source_snapshot: {},
                },
                {
                    id: "long-8",
                    position: 7,
                    name: "Coffee with milk",
                    quantity: 1,
                    portion_label: "1 cup",
                    nutrients: {
                        calories: 20,
                        protein_g: 1,
                        carbs_g: 4,
                        fat_g: 0.5,
                    },
                    source_type: "model_estimate",
                    provider: null,
                    confidence: 0.74,
                    assumptions: [],
                    source_snapshot: {},
                },
            ],
            has_goals: false,
            goals: null,
            totals: null,
        },
        // Partial/legacy state: a meal with no item-level detail recorded.
        empty: {
            action: "logged",
            date: "2026-08-18",
            logged_meal: {
                description: "Restaurant meal (details not itemized)",
                meal_type: "dinner",
                calories: 850,
                protein_g: 38,
                carbs_g: 70,
                fat_g: 42,
            },
            meal_items: [],
            has_goals: false,
            goals: null,
            totals: null,
        },
        error: { error: "The meal could not be read. Try again in chat." },
    },
};

function indexPage(): string {
    return `<!doctype html><html><head><meta charset="utf-8"><title>Munch widget harness</title><style>body{font:14px/1.5 system-ui;margin:32px;max-width:760px}li{margin:6px 0}</style></head><body><h1>Munch widget harness</h1><ul>${KEYS.map((key) => `<li><a href="/host?widget=${encodeURIComponent(key)}">${key}</a></li>`).join("")}</ul></body></html>`;
}

function hostPage(widget: string, fixture?: string): string {
    const result = (fixture ? FIXTURES[widget]?.[fixture] : undefined) ??
        RESULTS[widget] ?? { probe: true };
    return `<!doctype html><html><head><meta charset="utf-8"><title>${widget}</title><style>
body{margin:0;background:#f3f3f3;font:13px/1.4 system-ui;color:#222}.bar{position:sticky;top:0;z-index:2;display:flex;gap:8px;align-items:center;padding:8px 12px;background:#fff;border-bottom:1px solid #ddd}.bar span{color:#666}.stage{padding:12px}.frame{display:block;width:100%;height:150px;border:0;background:transparent}.stage.fullscreen{position:fixed;inset:0;z-index:5;padding:0;background:#fff}.stage.fullscreen .frame{height:100vh}.log{position:fixed;right:8px;bottom:8px;z-index:8;width:min(440px,calc(100vw - 16px));max-height:140px;overflow:auto;padding:8px;border-radius:8px;background:#111;color:#b7ffbf;font:10px/1.4 ui-monospace,monospace;white-space:pre-wrap;opacity:.88}</style></head><body>
<div class="bar"><strong>${widget}</strong><span>strict MCP Apps host</span><button id="theme">Toggle theme</button></div>
<div class="stage" id="stage"><iframe class="frame" id="frame" sandbox="allow-scripts" src="/widget/${encodeURIComponent(widget)}"></iframe></div><div class="log" id="log">host ready</div>
<script>
const RESULT=${JSON.stringify(result)};const frame=document.getElementById("frame");const stage=document.getElementById("stage");const logEl=document.getElementById("log");let theme="light";let mode="inline";const log=(text)=>{logEl.textContent+="\\n"+text;logEl.scrollTop=logEl.scrollHeight};const send=(message)=>frame.contentWindow.postMessage(message,"*");
document.getElementById("theme").onclick=()=>{theme=theme==="light"?"dark":"light";send({jsonrpc:"2.0",method:"ui/notifications/host-context-changed",params:{hostContext:{theme,displayMode:mode,availableDisplayModes:["inline","fullscreen"]}}})};
window.addEventListener("message",async(event)=>{if(event.source!==frame.contentWindow)return;const data=event.data;if(!data||typeof data!=="object")return;
if(data.method==="ui/initialize"){log("initialize "+JSON.stringify({appInfo:data.params?.appInfo,appCapabilities:data.params?.appCapabilities}));send({jsonrpc:"2.0",id:data.id,result:{protocolVersion:"2026-01-26",hostInfo:{name:"munch-harness",version:"2.0.0"},hostCapabilities:{serverTools:{}},hostContext:{theme,displayMode:mode,availableDisplayModes:["inline","fullscreen"]}}});return}
if(data.method==="ui/notifications/initialized"){log("initialized; delivering result");send({jsonrpc:"2.0",method:"ui/notifications/tool-result",params:{structuredContent:RESULT}});return}
if(data.method==="ui/notifications/size-changed"){if(mode==="inline")frame.style.height=Math.max(80,data.params?.height||150)+"px";return}
if(data.method==="ui/request-display-mode"){mode=data.params?.mode==="fullscreen"?"fullscreen":"inline";stage.classList.toggle("fullscreen",mode==="fullscreen");if(mode==="fullscreen")frame.style.height="";log("display mode -> "+mode);send({jsonrpc:"2.0",id:data.id,result:{displayMode:mode}});send({jsonrpc:"2.0",method:"ui/notifications/host-context-changed",params:{hostContext:{theme,displayMode:mode,availableDisplayModes:["inline","fullscreen"]}}});return}
if(data.method==="ui/message"){log("message: "+(data.params?.content?.[0]?.text||""));send({jsonrpc:"2.0",id:data.id,result:{}});return}
if(data.method==="ui/update-model-context"){log("context: "+(data.params?.content?.[0]?.text||""));send({jsonrpc:"2.0",id:data.id,result:{}});return}
if(data.method==="tools/call"){const name=data.params?.name;log("tool call: "+name);let structuredContent={};if(name==="confirm_meal_draft")structuredContent={status:"confirmed"};else if(name==="bulk_import_meals"){const args=data.params?.arguments||{};structuredContent={status:"success",dry_run:!!args.dry_run,summary:{created:args.dry_run?0:(args.meals||[]).length,deduplicated:0,failed:0},results:(args.meals||[]).map((row,index)=>({index,source_line:row.source_line,status:args.dry_run?"would_create":"created"}))}}send({jsonrpc:"2.0",id:data.id,result:{content:[{type:"text",text:"ok"}],structuredContent}});return}
if(data.id!=null)send({jsonrpc:"2.0",id:data.id,result:{}})
});
</script></body></html>`;
}

Bun.serve({
    port: PORT,
    async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname === "/") {
            return new Response(indexPage(), {
                headers: { "content-type": "text/html; charset=utf-8" },
            });
        }
        if (url.pathname === "/host") {
            const widget = url.searchParams.get("widget") || KEYS[0]!;
            const fixture = url.searchParams.get("fixture") || undefined;
            return new Response(hostPage(widget, fixture), {
                headers: { "content-type": "text/html; charset=utf-8" },
            });
        }
        if (url.pathname.startsWith("/widget/")) {
            const widget = decodeURIComponent(url.pathname.slice(8));
            try {
                return new Response(await getWidgetHtml(widget), {
                    headers: { "content-type": "text/html; charset=utf-8" },
                });
            } catch (error) {
                return new Response(String(error), { status: 404 });
            }
        }
        return new Response("not found", { status: 404 });
    },
});

console.log(`Munch widget harness: http://localhost:${PORT}`);
