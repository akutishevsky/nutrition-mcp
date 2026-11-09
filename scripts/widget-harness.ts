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
    "food-label": {
        query: "greek yogurt",
        candidates: [
            {
                candidate_id: "usda:171284",
                name: "Greek Yogurt, Plain, Nonfat",
                brand: null,
                provider: "usda",
                provider_label: "USDA FoodData Central",
                data_kind: "generic",
                confidence: 0.94,
                default_portion: {
                    id: "container",
                    label: "1 container (170 g)",
                    calories: 100,
                    protein_g: 17,
                    carbs_g: 6,
                    fat_g: 0.7,
                },
            },
            {
                candidate_id: "open_food_facts:3017620422003",
                name: "Greek Yogurt 0%",
                brand: "Fage",
                provider: "open_food_facts",
                provider_label: "Open Food Facts",
                data_kind: "packaged",
                confidence: 0.88,
                default_portion: {
                    id: "serving",
                    label: "1 serving (150 g)",
                    calories: 82,
                    protein_g: 15,
                    carbs_g: 5,
                    fat_g: 0,
                },
            },
            {
                candidate_id: "usda:170903",
                name: "Yogurt, Greek, whole milk",
                brand: null,
                provider: "usda",
                provider_label: "USDA FoodData Central",
                data_kind: "generic",
                confidence: 0.81,
                default_portion: {
                    id: "container",
                    label: "1 container (170 g)",
                    calories: 146,
                    protein_g: 15,
                    carbs_g: 7,
                    fat_g: 6.7,
                },
            },
        ],
        provider_failures: [],
    },
    recipe: {
        recipes: [
            {
                recipe_id: "11111111-1111-4111-8111-111111111111",
                revision_id: "11111111-1111-4111-8111-111111111112",
                name: "Lemon Herb Chicken and Rice",
                version: 1,
                ownership: "personal",
                servings: 4,
                nutrition_status: "complete",
                nutrition_per_serving: {
                    calories: 512,
                    protein_g: 38,
                    carbs_g: 46,
                    fat_g: 18,
                    fiber_g: 3,
                    sugar_g: 2,
                    sodium_mg: 420,
                },
                preparation_minutes: 15,
                cooking_minutes: 30,
                times_scheduled: 3,
                last_scheduled_date: "2026-08-01",
                times_logged: 2,
                last_logged_at: "2026-08-02",
                updated_at: "2026-08-02",
            },
            {
                recipe_id: "22222222-2222-4222-8222-222222222222",
                revision_id: "22222222-2222-4222-8222-222222222223",
                name: "Black Bean Soup",
                version: 2,
                ownership: "personal",
                servings: 6,
                nutrition_status: "partial",
                nutrition_per_serving: {
                    calories: 288,
                    protein_g: 14,
                    carbs_g: 48,
                    fat_g: 5,
                    fiber_g: 12,
                    sugar_g: 4,
                    sodium_mg: 610,
                },
                preparation_minutes: 10,
                cooking_minutes: 40,
                times_scheduled: 1,
                last_scheduled_date: null,
                times_logged: 0,
                last_logged_at: null,
                updated_at: "2026-07-28",
            },
            {
                recipe_id: "33333333-3333-4333-8333-333333333333",
                revision_id: "33333333-3333-4333-8333-333333333334",
                name: "Overnight Oats with Berries",
                version: 1,
                ownership: "household",
                servings: 2,
                nutrition_status: "complete",
                nutrition_per_serving: {
                    calories: 430,
                    protein_g: 19,
                    carbs_g: 63,
                    fat_g: 12,
                    fiber_g: 9,
                    sugar_g: 18,
                    sodium_mg: 95,
                },
                preparation_minutes: 10,
                cooking_minutes: null,
                times_scheduled: 5,
                last_scheduled_date: "2026-08-04",
                times_logged: 4,
                last_logged_at: "2026-08-04",
                updated_at: "2026-08-04",
            },
        ],
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
    "food-label": {
        // Longest realistic payload: a 14-result search. Inline must fold
        // to the first 5 compact rows plus the "…and 9 more" row.
        long: {
            query: "chicken",
            candidates: Array.from({ length: 14 }, (_, index) => ({
                candidate_id: `usda:${170000 + index}`,
                name: `Chicken preparation ${index + 1}`,
                brand: index % 3 === 0 ? "Farm Brand" : null,
                provider: index % 2 === 0 ? "usda" : "open_food_facts",
                provider_label:
                    index % 2 === 0
                        ? "USDA FoodData Central"
                        : "Open Food Facts",
                data_kind: index % 2 === 0 ? "generic" : "packaged",
                confidence: 0.9,
                default_portion: {
                    id: "serving",
                    label: "1 serving (140 g)",
                    calories: 220 + index * 7,
                    protein_g: 26,
                    carbs_g: 0,
                    fat_g: 12,
                },
            })),
            provider_failures: [],
        },
        single: {
            found: true,
            food: {
                candidate_id: "open_food_facts:3017620422003",
                name: "Greek Yogurt 0%",
                brand: "Fage",
                provider: "open_food_facts",
                provider_food_id: "3017620422003",
                provider_label: "Open Food Facts",
                source_url:
                    "https://world.openfoodfacts.org/product/3017620422003",
                source_license: "Open Database License 1.0",
                source_updated_at: "2026-07-15",
                data_kind: "packaged",
                barcode: "3017620422003",
                confidence: 0.88,
                nutrients_per_100g: {
                    calories: 55,
                    protein_g: 10,
                    carbs_g: 3.3,
                    fat_g: 0,
                    fiber_g: 0,
                    sugar_g: 3.3,
                    alcohol_g: null,
                    sodium_mg: 40,
                    saturated_fat_g: 0,
                    cholesterol_mg: 5,
                    potassium_mg: 150,
                },
                portions: [
                    {
                        id: "serving",
                        amount: 1,
                        unit: "serving",
                        label: "1 serving (150 g)",
                        gram_weight: 150,
                        nutrients: {
                            calories: 82,
                            protein_g: 15,
                            carbs_g: 5,
                            fat_g: 0,
                            fiber_g: 0,
                            sugar_g: 5,
                            alcohol_g: null,
                            sodium_mg: 60,
                            saturated_fat_g: 0,
                            cholesterol_mg: 8,
                            potassium_mg: 225,
                        },
                    },
                    {
                        id: "container",
                        amount: 1,
                        unit: "container",
                        label: "1 container (170 g)",
                        gram_weight: 170,
                        nutrients: {
                            calories: 94,
                            protein_g: 17,
                            carbs_g: 5.6,
                            fat_g: 0,
                            fiber_g: 0,
                            sugar_g: 5.6,
                            alcohol_g: null,
                            sodium_mg: 68,
                            saturated_fat_g: 0,
                            cholesterol_mg: 9,
                            potassium_mg: 255,
                        },
                    },
                ],
            },
        },
        barcode: {
            barcode: "3017620422003",
            candidates: [
                {
                    candidate_id: "open_food_facts:3017620422003",
                    name: "Greek Yogurt 0%",
                    brand: "Fage",
                    provider: "open_food_facts",
                    provider_food_id: "3017620422003",
                    provider_label: "Open Food Facts",
                    source_url:
                        "https://world.openfoodfacts.org/product/3017620422003",
                    source_license: "Open Database License 1.0",
                    source_updated_at: "2026-07-15",
                    data_kind: "packaged",
                    barcode: "3017620422003",
                    confidence: 0.88,
                    nutrients_per_100g: {
                        calories: 55,
                        protein_g: 10,
                        carbs_g: 3.3,
                        fat_g: 0,
                        fiber_g: 0,
                        sugar_g: 3.3,
                        alcohol_g: null,
                        sodium_mg: 40,
                        saturated_fat_g: 0,
                        cholesterol_mg: 5,
                        potassium_mg: 150,
                    },
                    portions: [
                        {
                            id: "serving",
                            amount: 1,
                            unit: "serving",
                            label: "1 serving (150 g)",
                            gram_weight: 150,
                            nutrients: {
                                calories: 82,
                                protein_g: 15,
                                carbs_g: 5,
                                fat_g: 0,
                                fiber_g: 0,
                                sugar_g: 5,
                                alcohol_g: null,
                                sodium_mg: 60,
                                saturated_fat_g: 0,
                                cholesterol_mg: 8,
                                potassium_mg: 225,
                            },
                        },
                    ],
                },
            ],
            provider_failures: [],
        },
        saved: {
            saved_foods: [
                {
                    id: "44444444-4444-4444-8444-444444444444",
                    label: "My usual Greek yogurt",
                    default_portion_id: "container",
                    use_count: 9,
                    last_used_at: "2026-08-03",
                    food: {
                        candidate_id: "open_food_facts:3017620422003",
                        name: "Greek Yogurt 0%",
                        brand: "Fage",
                        provider: "open_food_facts",
                        provider_food_id: "3017620422003",
                        provider_label: "Open Food Facts",
                        source_url: null,
                        source_license: null,
                        source_updated_at: null,
                        data_kind: "packaged",
                        barcode: "3017620422003",
                        confidence: 0.88,
                        nutrients_per_100g: null,
                        portions: [
                            {
                                id: "container",
                                amount: 1,
                                unit: "container",
                                label: "1 container (170 g)",
                                gram_weight: 170,
                                nutrients: {
                                    calories: 94,
                                    protein_g: 17,
                                    carbs_g: 5.6,
                                    fat_g: 0,
                                    fiber_g: 0,
                                    sugar_g: 5.6,
                                    alcohol_g: null,
                                    sodium_mg: 68,
                                    saturated_fat_g: 0,
                                    cholesterol_mg: 9,
                                    potassium_mg: 255,
                                },
                            },
                        ],
                    },
                },
                {
                    id: "55555555-5555-4555-8555-555555555555",
                    label: "Rolled oats",
                    default_portion_id: null,
                    use_count: 4,
                    last_used_at: "2026-07-30",
                    food: {
                        candidate_id: "usda:169705",
                        name: "Oats, rolled, dry",
                        brand: null,
                        provider: "usda",
                        provider_food_id: "169705",
                        provider_label: "USDA FoodData Central",
                        source_url: null,
                        source_license: null,
                        source_updated_at: null,
                        data_kind: "generic",
                        barcode: null,
                        confidence: 0.95,
                        nutrients_per_100g: null,
                        portions: [
                            {
                                id: "cup",
                                amount: 1,
                                unit: "cup",
                                label: "1 cup (81 g)",
                                gram_weight: 81,
                                nutrients: {
                                    calories: 307,
                                    protein_g: 10.7,
                                    carbs_g: 55,
                                    fat_g: 5.3,
                                    fiber_g: 8.2,
                                    sugar_g: 0.8,
                                    alcohol_g: null,
                                    sodium_mg: 5,
                                    saturated_fat_g: 0.9,
                                    cholesterol_mg: 0,
                                    potassium_mg: 350,
                                },
                            },
                        ],
                    },
                },
            ],
        },
        "barcode-text": {
            text: "Greek Yogurt 0% (Fage)\nServing: 1 serving (150 g)\nCalories: 82 kcal · Protein: 15 g · Carbs: 5 g · Fat: 0 g\nFiber: 0 g · Sugar (total): 5 g\nSource: Open Food Facts (barcode 3017620422003)",
        },
        empty: { query: "zzzz", candidates: [], provider_failures: [] },
        partial: {
            query: "yogurt",
            candidates: [
                {
                    candidate_id: "usda:171284",
                    name: "Greek Yogurt, Plain, Nonfat",
                    brand: null,
                    provider: "usda",
                    provider_label: "USDA FoodData Central",
                    data_kind: "generic",
                    confidence: 0.94,
                    default_portion: {
                        id: "container",
                        label: "1 container (170 g)",
                        calories: 100,
                        protein_g: 17,
                        carbs_g: 6,
                        fat_g: 0.7,
                    },
                },
            ],
            provider_failures: [
                {
                    provider: "open_food_facts",
                    code: "provider_unavailable",
                    message: "Open Food Facts did not respond.",
                    retry_after_seconds: null,
                },
            ],
        },
        error: { error: "Food search could not be read. Try again in chat." },
    },
    recipe: {
        view: {
            recipe: {
                id: "11111111-1111-4111-8111-111111111111",
                name: "Lemon Herb Chicken and Rice",
                version: 1,
                ownership: { type: "personal" },
                revision_id: "11111111-1111-4111-8111-111111111112",
                revision_number: 1,
                servings: 4,
                description:
                    "A weeknight chicken and rice with lemon and herbs.",
                instructions: [
                    "Pat the chicken dry and season with salt and pepper.",
                    "Sear the chicken in olive oil until golden, about 6 minutes per side.",
                    "Stir in the garlic and rice and toast for 1 minute.",
                    "Add the broth, cover, and simmer 18 minutes.",
                    "Rest 5 minutes, then finish with lemon juice and parsley.",
                ],
                preparation_minutes: 15,
                cooking_minutes: 30,
                source: { type: "user_entered", title: null, url: null },
                nutrition_status: "complete",
                nutrition_total: {
                    calories: 2048,
                    protein_g: 152,
                    carbs_g: 184,
                    fat_g: 72,
                    fiber_g: 12,
                    sugar_g: 8,
                    sodium_mg: 1680,
                },
                nutrition_per_serving: {
                    calories: 512,
                    protein_g: 38,
                    carbs_g: 46,
                    fat_g: 18,
                    fiber_g: 3,
                    sugar_g: 2,
                    sodium_mg: 420,
                },
                ingredients: [
                    {
                        id: "a1",
                        position: 0,
                        name: "Chicken breast",
                        quantity: 600,
                        unit: "g",
                        preparation: null,
                        optional: false,
                        gram_weight: 600,
                        nutrients: {
                            calories: 990,
                            protein_g: 132,
                            carbs_g: 0,
                            fat_g: 21,
                        },
                        provider: "usda",
                        provider_food_id: "171077",
                        source_type: "usda",
                        source_url: null,
                        confidence: 0.95,
                        source_snapshot: {},
                    },
                    {
                        id: "a2",
                        position: 1,
                        name: "Long grain rice",
                        quantity: 280,
                        unit: "g",
                        preparation: "rinsed",
                        optional: false,
                        gram_weight: 280,
                        nutrients: {
                            calories: 1010,
                            protein_g: 19,
                            carbs_g: 220,
                            fat_g: 2,
                        },
                        provider: "usda",
                        provider_food_id: "169760",
                        source_type: "usda",
                        source_url: null,
                        confidence: 0.93,
                        source_snapshot: {},
                    },
                    {
                        id: "a3",
                        position: 2,
                        name: "Olive oil",
                        quantity: 2,
                        unit: "tbsp",
                        preparation: null,
                        optional: false,
                        gram_weight: 27,
                        nutrients: {
                            calories: 239,
                            protein_g: 0,
                            carbs_g: 0,
                            fat_g: 27,
                        },
                        provider: "usda",
                        provider_food_id: "171413",
                        source_type: "usda",
                        source_url: null,
                        confidence: 0.9,
                        source_snapshot: {},
                    },
                    {
                        id: "a4",
                        position: 3,
                        name: "Chicken broth",
                        quantity: 480,
                        unit: "ml",
                        preparation: null,
                        optional: false,
                        gram_weight: 480,
                        nutrients: {
                            calories: 29,
                            protein_g: 3,
                            carbs_g: 2,
                            fat_g: 1,
                        },
                        provider: "usda",
                        provider_food_id: "174529",
                        source_type: "usda",
                        source_url: null,
                        confidence: 0.85,
                        source_snapshot: {},
                    },
                    {
                        id: "a5",
                        position: 4,
                        name: "Garlic",
                        quantity: 3,
                        unit: "cloves",
                        preparation: "minced",
                        optional: false,
                        gram_weight: 9,
                        nutrients: {
                            calories: 13,
                            protein_g: 0.6,
                            carbs_g: 3,
                            fat_g: 0,
                        },
                        provider: "usda",
                        provider_food_id: "169230",
                        source_type: "usda",
                        source_url: null,
                        confidence: 0.9,
                        source_snapshot: {},
                    },
                    {
                        id: "a6",
                        position: 5,
                        name: "Lemon",
                        quantity: 1,
                        unit: "whole",
                        preparation: "juiced",
                        optional: false,
                        gram_weight: 58,
                        nutrients: {
                            calories: 17,
                            protein_g: 0.6,
                            carbs_g: 5,
                            fat_g: 0.2,
                        },
                        provider: "usda",
                        provider_food_id: "167746",
                        source_type: "usda",
                        source_url: null,
                        confidence: 0.9,
                        source_snapshot: {},
                    },
                    {
                        id: "a7",
                        position: 6,
                        name: "Parsley",
                        quantity: 0.25,
                        unit: "cup",
                        preparation: "chopped",
                        optional: true,
                        gram_weight: 15,
                        nutrients: {
                            calories: 5,
                            protein_g: 0.4,
                            carbs_g: 1,
                            fat_g: 0.1,
                        },
                        provider: "usda",
                        provider_food_id: "170389",
                        source_type: "usda",
                        source_url: null,
                        confidence: 0.88,
                        source_snapshot: {},
                    },
                    {
                        id: "a8",
                        position: 7,
                        name: "Salt",
                        quantity: 1,
                        unit: "tsp",
                        preparation: null,
                        optional: false,
                        gram_weight: 6,
                        nutrients: {
                            calories: 0,
                            protein_g: 0,
                            carbs_g: 0,
                            fat_g: 0,
                        },
                        provider: null,
                        provider_food_id: null,
                        source_type: "user_supplied",
                        source_url: null,
                        confidence: null,
                        source_snapshot: {},
                    },
                ],
                created_at: "2026-07-20",
                updated_at: "2026-08-02",
            },
        },
        review: {
            draft: {
                schema_version: 2,
                status: "ready",
                requires_review: true,
                parser: { strategy: "schema_org_json_ld", version: "1" },
                source: {
                    submitted_url: "https://example.com/tomato-pasta",
                    final_url: "https://example.com/tomato-pasta",
                    canonical_url: "https://example.com/tomato-pasta",
                    title: "Weeknight Tomato Pasta",
                    site_name: "Example Kitchen",
                    author: null,
                },
                recipe: {
                    name: "Weeknight Tomato Pasta",
                    servings: 4,
                    description: "A pantry tomato pasta.",
                    instructions: [
                        "Boil the pasta in well-salted water until al dente.",
                        "Soften the onion and garlic in olive oil.",
                        "Add the tomatoes and simmer 15 minutes.",
                        "Toss the pasta through the sauce with a splash of pasta water.",
                        "Serve with basil and grated cheese.",
                    ],
                    preparation_minutes: 10,
                    cooking_minutes: 25,
                    source_type: "imported",
                    source_title: "Weeknight Tomato Pasta",
                    source_url: "https://example.com/tomato-pasta",
                    ingredients: Array.from({ length: 13 }, (_, index) => ({
                        name: [
                            "Spaghetti",
                            "Crushed tomatoes",
                            "Olive oil",
                            "Yellow onion",
                            "Garlic",
                            "Tomato paste",
                            "Dried oregano",
                            "Chili flakes",
                            "Sugar",
                            "Salt",
                            "Black pepper",
                            "Fresh basil",
                            "Parmesan",
                        ][index]!,
                        quantity: [
                            400, 800, 3, 1, 3, 2, 1, 0.5, 1, 1, 0.5, 0.5, 30,
                        ][index],
                        unit: [
                            "g",
                            "g",
                            "tbsp",
                            "whole",
                            "cloves",
                            "tbsp",
                            "tsp",
                            "tsp",
                            "tsp",
                            "tsp",
                            "tsp",
                            "cup",
                            "g",
                        ][index],
                        nutrients: {
                            calories: [
                                1404, 208, 358, 44, 13, 26, 5, 2, 16, 0, 3, 1,
                                118,
                            ][index],
                            protein_g: [
                                49, 10, 0, 1.2, 0.6, 1.8, 0.2, 0.1, 0, 0, 0.2,
                                0.1, 11,
                            ][index],
                            carbs_g: [
                                296, 36, 0, 10, 3, 5, 1, 0.3, 4, 0, 0.8, 0.2, 1,
                            ][index],
                            fat_g: [
                                6, 3, 40, 0.2, 0, 0.4, 0.1, 0.1, 0, 0, 0.1, 0,
                                8,
                            ][index],
                        },
                        source_type: "usda",
                        provider: "usda",
                        confidence: 0.9,
                        source_snapshot: {},
                    })),
                },
                nutrition: {
                    status: "complete",
                    total: {
                        calories: 2198,
                        protein_g: 74,
                        carbs_g: 346,
                        fat_g: 58,
                        fiber_g: 22,
                        sugar_g: 30,
                        sodium_mg: 2440,
                    },
                    per_serving: {
                        calories: 550,
                        protein_g: 18.5,
                        carbs_g: 86.5,
                        fat_g: 14.5,
                        fiber_g: 5.5,
                        sugar_g: 7.5,
                        sodium_mg: 610,
                    },
                },
                ingredient_review: Array.from({ length: 13 }, (_, index) => ({
                    position: index,
                    raw_text: `ingredient ${index + 1} as written`,
                    resolution: index === 11 ? "assumed" : "matched",
                    candidates: [],
                })),
                assumptions: [
                    {
                        position: 11,
                        raw_text: "Fresh basil",
                        message: "Matched to USDA basil, fresh.",
                        impact: "low",
                    },
                ],
                warnings: [],
            },
        },
        "review-partial": {
            draft: {
                schema_version: 2,
                status: "partial",
                requires_review: true,
                parser: { strategy: "recipe_card_html", version: "1" },
                source: {
                    submitted_url: "https://example.com/mystery-stew",
                    final_url: "https://example.com/mystery-stew",
                    canonical_url: null,
                    title: "Mystery Stew",
                    site_name: "Example Kitchen",
                    author: null,
                },
                recipe: {
                    name: "Mystery Stew",
                    servings: 4,
                    instructions: [
                        "Brown the beef in a heavy pot.",
                        "Add everything else and simmer 1 hour.",
                    ],
                    source_type: "imported",
                    source_url: "https://example.com/mystery-stew",
                    ingredients: [
                        {
                            name: "Beef chuck",
                            quantity: 500,
                            unit: "g",
                            nutrients: {
                                calories: 1250,
                                protein_g: 130,
                                carbs_g: 0,
                                fat_g: 78,
                            },
                            source_type: "usda",
                            provider: "usda",
                            confidence: 0.9,
                            source_snapshot: {},
                        },
                        {
                            name: "Potatoes",
                            quantity: 600,
                            unit: "g",
                            nutrients: {
                                calories: 462,
                                protein_g: 12,
                                carbs_g: 105,
                                fat_g: 0.6,
                            },
                            source_type: "usda",
                            provider: "usda",
                            confidence: 0.92,
                            source_snapshot: {},
                        },
                        {
                            name: "Smoked paprika",
                            quantity: 2,
                            unit: "tsp",
                            source_type: "model_estimate",
                            confidence: 0.5,
                            source_snapshot: {},
                        },
                        {
                            name: "House spice blend",
                            quantity: 1,
                            unit: "tbsp",
                            source_type: "model_estimate",
                            source_snapshot: {},
                        },
                        {
                            name: "Stock concentrate",
                            quantity: 2,
                            unit: "tbsp",
                            source_type: "model_estimate",
                            source_snapshot: {},
                        },
                    ],
                },
                nutrition: {
                    status: "partial",
                    total: {
                        calories: 1712,
                        protein_g: 142,
                        carbs_g: 105,
                        fat_g: 78.6,
                    },
                    per_serving: {
                        calories: 428,
                        protein_g: 35.5,
                        carbs_g: 26.3,
                        fat_g: 19.7,
                    },
                },
                ingredient_review: [
                    {
                        position: 0,
                        raw_text: "500 g beef chuck",
                        resolution: "matched",
                        candidates: [],
                    },
                    {
                        position: 1,
                        raw_text: "600 g potatoes",
                        resolution: "matched",
                        candidates: [],
                    },
                    {
                        position: 2,
                        raw_text: "2 tsp smoked paprika",
                        resolution: "assumed",
                        candidates: [],
                    },
                    {
                        position: 3,
                        raw_text: "1 tbsp house spice blend",
                        resolution: "unresolved",
                        candidates: [],
                    },
                    {
                        position: 4,
                        raw_text: "2 tbsp stock concentrate",
                        resolution: "ambiguous",
                        candidates: [],
                    },
                ],
                assumptions: [
                    {
                        position: 2,
                        raw_text: "2 tsp smoked paprika",
                        message: "Matched to USDA paprika.",
                        impact: "low",
                    },
                ],
                warnings: [
                    {
                        code: "unresolved_ingredients",
                        message:
                            "2 ingredients could not be matched to a food record.",
                        severity: "warning",
                    },
                ],
            },
        },
        "list-long": {
            recipes: Array.from({ length: 8 }, (_, index) => ({
                recipe_id: `66666666-6666-4666-8666-66666666666${index}`,
                revision_id: `66666666-6666-4666-8666-66666666667${index}`,
                name: `Saved recipe ${index + 1}`,
                version: 1,
                ownership: "personal",
                servings: 4,
                nutrition_status: "complete",
                nutrition_per_serving: {
                    calories: 400 + index * 15,
                    protein_g: 25,
                    carbs_g: 40,
                    fat_g: 14,
                },
                preparation_minutes: 10,
                cooking_minutes: 20,
                times_scheduled: 0,
                last_scheduled_date: null,
                times_logged: 0,
                last_logged_at: null,
                updated_at: "2026-08-01",
            })),
        },
        empty: { recipes: [] },
        error: { error: "Recipes could not be read. Try again in chat." },
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
if(data.method==="tools/call"){const name=data.params?.name;log("tool call: "+name);let structuredContent={};if(name==="confirm_meal_draft")structuredContent={status:"confirmed"};else if(name==="save_recipe")structuredContent={recipe:{recipeId:"77777777-7777-4777-8777-777777777777",revisionId:"77777777-7777-4777-8777-777777777778",revisionNumber:1,nutritionStatus:"complete",totals:{},perServing:{},deduplicated:false}};else if(name==="bulk_import_meals"){const args=data.params?.arguments||{};structuredContent={status:"success",dry_run:!!args.dry_run,summary:{created:args.dry_run?0:(args.meals||[]).length,deduplicated:0,failed:0},results:(args.meals||[]).map((row,index)=>({index,source_line:row.source_line,status:args.dry_run?"would_create":"created"}))}}send({jsonrpc:"2.0",id:data.id,result:{content:[{type:"text",text:"ok"}],structuredContent}});return}
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
