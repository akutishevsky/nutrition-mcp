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
};

// Slice-6 fixtures (meal-plan, grocery-list, pantry, day-meals). Longest
// realistic payloads per the brief: a full 7-day plan, a 20-item grocery
// list, a 15-item pantry plus reconcile/purchase diffs, a 3-meal day and a
// 7-day range. All totals below are exact sums of the entry figures.
const uuid = (n: number) =>
    `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function mealBlock(
    id: string,
    time: string,
    type: string,
    description: string,
    kcal: number | null,
    protein?: number,
    carbs?: number,
    fat?: number,
): string {
    return [
        `ID: ${id}`,
        `Time: ${time}`,
        `Type: ${type}`,
        `Description: ${description}`,
        ...(kcal == null
            ? []
            : [
                  `Calories: ${kcal}`,
                  `Protein: ${protein}g`,
                  `Carbs: ${carbs}g`,
                  `Fat: ${fat}g`,
              ]),
    ].join("\n");
}
const dayTextAug5 = [
    mealBlock(
        "m-1",
        "2026-08-05T07:30:00.000Z",
        "breakfast",
        "Overnight oats with berries",
        430,
        19,
        63,
        12,
    ),
    mealBlock(
        "m-2",
        "2026-08-05T12:15:00.000Z",
        "lunch",
        "Grilled chicken and rice bowl",
        650,
        52,
        78,
        16,
    ),
    mealBlock(
        "m-3",
        "2026-08-05T18:45:00.000Z",
        "dinner",
        "Salmon with vegetables",
        720,
        55,
        44,
        34,
    ),
].join("\n\n---\n\n");
function rangeSection(date: string, blocks: string[]): string {
    return `## ${date} (${blocks.length} meal${blocks.length === 1 ? "" : "s"})\n\n${blocks.join("\n\n---\n\n")}`;
}
const rangeText3Days = [
    rangeSection("2026-08-03", [
        mealBlock(
            "m-11",
            "2026-08-03T07:30:00.000Z",
            "breakfast",
            "Overnight oats with berries",
            430,
            19,
            63,
            12,
        ),
        mealBlock(
            "m-12",
            "2026-08-03T12:15:00.000Z",
            "lunch",
            "Grilled chicken and rice bowl",
            650,
            52,
            78,
            16,
        ),
    ]),
    rangeSection("2026-08-04", [
        mealBlock(
            "m-13",
            "2026-08-04T08:00:00.000Z",
            "breakfast",
            "Buttermilk pancakes",
            480,
            9,
            72,
            16,
        ),
        mealBlock(
            "m-14",
            "2026-08-04T18:30:00.000Z",
            "dinner",
            "Beef chili",
            690,
            38,
            54,
            30,
        ),
        mealBlock(
            "m-15",
            "2026-08-04T20:00:00.000Z",
            "snack",
            "Greek yogurt cup",
            180,
            15,
            14,
            6,
        ),
    ]),
    rangeSection("2026-08-05", [
        mealBlock(
            "m-16",
            "2026-08-05T07:30:00.000Z",
            "breakfast",
            "Overnight oats with berries",
            430,
            19,
            63,
            12,
        ),
        mealBlock(
            "m-17",
            "2026-08-05T18:45:00.000Z",
            "dinner",
            "Salmon with vegetables",
            720,
            55,
            44,
            34,
        ),
    ]),
].join("\n\n===\n\n");
const rangeText7Days = Array.from({ length: 7 }, (_, i) => {
    const iso = new Date(Date.UTC(2026, 6, 30 + i)).toISOString().slice(0, 10);
    return rangeSection(iso, [
        mealBlock(
            `m-l${i}a`,
            `${iso}T07:30:00.000Z`,
            "breakfast",
            "Oats with milk",
            500,
            20,
            60,
            15,
        ),
        mealBlock(
            `m-l${i}b`,
            `${iso}T18:30:00.000Z`,
            "dinner",
            "Rice bowl with chicken",
            500,
            30,
            55,
            18,
        ),
    ]);
}).join("\n\n===\n\n");
const searchText = [
    'Found 12 past meals matching "oatmeal".',
    [
        "Variations (by frequency):",
        "1. Oatmeal with banana and honey — logged 5×, last on 2026-08-04, typically ~450 kcal (19g protein, 68g carbs, 11g fat)",
        "2. Oatmeal with raisins — logged 4×, last on 2026-07-29, typically ~410 kcal (16g protein, 62g carbs, 10g fat)",
        "3. Overnight oats with berries — logged 3×, last on 2026-07-21, typically ~430 kcal (19g protein, 63g carbs, 12g fat)",
    ].join("\n"),
    [
        "Most recent matching entries:",
        "- 2026-08-04 breakfast: Oatmeal with banana and honey — 455 kcal [id: m-101]",
        "- 2026-07-30 breakfast: Oatmeal with banana and honey — 448 kcal [id: m-102]",
        "- 2026-07-29 breakfast: Oatmeal with raisins — 405 kcal [id: m-103]",
    ].join("\n"),
    "When logging from a photo, present these variations to the user as options before logging.",
].join("\n\n");
const plannedMeal = (
    n: number,
    date: string,
    slot: string,
    name: string,
    servings: number,
    per: Record<string, number> | null,
) => ({
    planned_meal_id: uuid(n),
    planned_date: date,
    meal_slot: slot,
    recipe_id: uuid(100 + n),
    recipe_revision_id: uuid(200 + n),
    recipe_name: name,
    servings,
    note: null,
    nutrition_per_serving: per ?? {},
});
const mealPlanWeek = [
    plannedMeal(
        1,
        "2026-08-10",
        "breakfast",
        "Overnight oats with berries",
        1,
        { calories: 430, protein_g: 19, carbs_g: 63, fat_g: 12 },
    ),
    plannedMeal(2, "2026-08-10", "lunch", "Grilled chicken and rice bowl", 1, {
        calories: 650,
        protein_g: 52,
        carbs_g: 78,
        fat_g: 16,
    }),
    plannedMeal(3, "2026-08-11", "breakfast", "Greek yogurt bowl", 1, {
        calories: 320,
        protein_g: 18,
        carbs_g: 28,
        fat_g: 9,
    }),
    plannedMeal(4, "2026-08-11", "dinner", "Salmon with vegetables", 2, {
        calories: 360,
        protein_g: 34,
        carbs_g: 12,
        fat_g: 21,
    }),
    plannedMeal(5, "2026-08-12", "dinner", "Veggie stir fry with tofu", 1, {
        calories: 540,
        protein_g: 24,
        carbs_g: 58,
        fat_g: 22,
    }),
    plannedMeal(6, "2026-08-13", "breakfast", "Buttermilk pancakes", 1, {
        calories: 480,
        protein_g: 9,
        carbs_g: 72,
        fat_g: 16,
    }),
    plannedMeal(7, "2026-08-13", "dinner", "Beef chili", 1, {
        calories: 690,
        protein_g: 38,
        carbs_g: 54,
        fat_g: 30,
    }),
    plannedMeal(8, "2026-08-14", "lunch", "Tuna salad sandwich", 1, {
        calories: 410,
        protein_g: 26,
        carbs_g: 38,
        fat_g: 16,
    }),
    plannedMeal(9, "2026-08-14", "dinner", "Homemade pasta bake", 1, null),
    plannedMeal(10, "2026-08-15", "breakfast", "Green smoothie", 1, {
        calories: 280,
        protein_g: 8,
        carbs_g: 44,
        fat_g: 7,
    }),
    plannedMeal(11, "2026-08-16", "dinner", "Roast chicken", 1, {
        calories: 720,
        protein_g: 58,
        carbs_g: 0,
        fat_g: 38,
    }),
    plannedMeal(12, "2026-08-16", "dinner", "Garden side salad", 1, {
        calories: 150,
        protein_g: 4,
        carbs_g: 12,
        fat_g: 9,
    }),
];
const groceryItem = (
    n: number,
    name: string,
    quantity: number | null,
    unit: string | null,
    opts: { note?: string; purchased?: boolean; recipe?: boolean } = {},
) => ({
    grocery_item_id: uuid(n),
    name,
    quantity,
    unit,
    note: opts.note ?? null,
    purchased_at: opts.purchased ? "2026-08-05T09:12:00.000Z" : null,
    source_recipe_id: opts.recipe ? uuid(500) : null,
    source_planned_meal_id: null,
    added_by: null,
    version: 1,
});
const grocery20 = [
    groceryItem(1, "Rolled oats", 1, "bag", { recipe: true }),
    groceryItem(2, "Chicken breast", 800, "g", { recipe: true }),
    groceryItem(3, "Jasmine rice", 1, "kg", { recipe: true }),
    groceryItem(4, "Black beans", 2, "cans", { recipe: true }),
    groceryItem(5, "Tortillas", 8, "count", { recipe: true }),
    groceryItem(6, "Eggs", 12, null),
    groceryItem(7, "Milk", 1, "L"),
    groceryItem(8, "Greek yogurt", 500, "g"),
    groceryItem(9, "Spinach", 200, "g"),
    groceryItem(10, "Tomatoes", 4, null),
    groceryItem(11, "Avocados", 3, null),
    groceryItem(12, "Coffee beans", 340, "g"),
    groceryItem(13, "Olive oil", 500, "ml", { note: "Refill — running low" }),
    groceryItem(14, "Peanut butter", 1, "jar"),
    groceryItem(15, "Butter", 250, "g", { purchased: true }),
    groceryItem(16, "Cheddar", 200, "g", { purchased: true }),
    groceryItem(17, "Apples", 6, null, { purchased: true }),
    groceryItem(18, "Pasta", 500, "g", { purchased: true }),
    groceryItem(19, "Canned tomatoes", 2, "cans", { purchased: true }),
    groceryItem(20, "Honey", 1, "jar", { purchased: true, note: "For tea" }),
];
const pantryItem = (
    n: number,
    name: string,
    quantity: number | null,
    unit: string | null,
    mode: string,
    state: string,
    location: string,
    provider: string | null = null,
) => ({
    id: uuid(n),
    name,
    normalized_name: name.toLowerCase(),
    quantity,
    unit,
    quantity_mode: mode,
    stock_state: state,
    location,
    food_provider: provider,
    provider_food_id: null,
    barcode: null,
    note: null,
    version: 1,
    updated_at: "2026-08-05T08:00:00.000Z",
});
const pantry15 = [
    pantryItem(
        1,
        "Rolled oats",
        900,
        "g",
        "exact",
        "available",
        "pantry",
        "usda",
    ),
    pantryItem(
        2,
        "Jasmine rice",
        2,
        "kg",
        "exact",
        "available",
        "pantry",
        "usda",
    ),
    pantryItem(3, "Black beans", 3, "cans", "exact", "available", "pantry"),
    pantryItem(
        4,
        "Olive oil",
        0.5,
        "bottle",
        "approximate",
        "available",
        "pantry",
    ),
    pantryItem(5, "Eggs", 6, null, "exact", "low", "fridge"),
    pantryItem(6, "Milk", 1, "L", "exact", "available", "fridge"),
    pantryItem(7, "Greek yogurt", 500, "g", "exact", "available", "fridge"),
    pantryItem(8, "Chicken breast", 800, "g", "exact", "available", "freezer"),
    pantryItem(9, "Frozen peas", 500, "g", "exact", "available", "freezer"),
    pantryItem(10, "Cheddar", 200, "g", "exact", "available", "fridge"),
    pantryItem(11, "Peanut butter", 1, "jar", "exact", "available", "pantry"),
    pantryItem(12, "Honey", 0.25, "jar", "approximate", "available", "pantry"),
    pantryItem(13, "Flour", 750, "g", "exact", "available", "pantry"),
    pantryItem(
        14,
        "Canned tomatoes",
        4,
        "cans",
        "exact",
        "available",
        "pantry",
        "open_food_facts",
    ),
    pantryItem(
        15,
        "Fresh basil",
        null,
        null,
        "presence_only",
        "available",
        "fridge",
    ),
];
const reconcileOps = [
    {
        action: "acquire",
        item: pantryItem(
            21,
            "Brown rice",
            2,
            "kg",
            "exact",
            "available",
            "pantry",
        ),
        deduplicated: false,
    },
    {
        action: "acquire",
        item: pantryItem(
            22,
            "Olive oil",
            500,
            "ml",
            "exact",
            "available",
            "pantry",
        ),
        deduplicated: false,
    },
    {
        action: "consume",
        item: pantryItem(23, "Eggs", 6, null, "exact", "low", "fridge"),
        deduplicated: false,
    },
    {
        action: "consume_all",
        item: pantryItem(24, "Milk", 0, "L", "exact", "depleted", "fridge"),
        deduplicated: false,
    },
    {
        action: "discard",
        item: pantryItem(
            25,
            "Greek yogurt",
            0,
            "g",
            "exact",
            "depleted",
            "fridge",
        ),
        deduplicated: false,
    },
    {
        action: "correct",
        item: pantryItem(26, "Flour", 750, "g", "exact", "available", "pantry"),
        deduplicated: false,
    },
    {
        action: "move",
        item: pantryItem(
            27,
            "Chicken breast",
            800,
            "g",
            "exact",
            "available",
            "freezer",
        ),
        deduplicated: false,
    },
];
Object.assign(RESULTS, {
    "meal-plan": { planned_meals: mealPlanWeek },
    "grocery-list": {
        grocery: { groceryListId: uuid(900), items: grocery20 },
    },
    pantry: {
        enabled: true,
        inventorySpaceId: uuid(901),
        items: pantry15,
    },
    "day-meals": { text: dayTextAug5 },
});
Object.assign(FIXTURES, {
    "meal-plan": {
        empty: { planned_meals: [] },
        partial: {
            planned_meals: [
                plannedMeal(
                    31,
                    "2026-08-10",
                    "lunch",
                    "Tuna salad sandwich",
                    1,
                    { calories: 410, protein_g: 26, carbs_g: 38, fat_g: 16 },
                ),
                plannedMeal(
                    32,
                    "2026-08-10",
                    "dinner",
                    "Homemade pasta bake",
                    1,
                    null,
                ),
            ],
        },
        error: { error: "The meal plan could not be read. Try again in chat." },
    },
    "grocery-list": {
        empty: { grocery: { groceryListId: null, items: [] } },
        partial: {
            grocery: {
                groceryListId: uuid(902),
                items: [
                    groceryItem(41, "Eggs", 12, null),
                    groceryItem(42, "Milk", 1, "L"),
                    groceryItem(43, "Butter", 250, "g", { purchased: true }),
                    groceryItem(44, "Apples", 6, null, { purchased: true }),
                ],
            },
        },
        error: {
            error: "The grocery list could not be read. Try again in chat.",
        },
    },
    pantry: {
        reconcile: {
            enabled: true,
            inventorySpaceId: uuid(901),
            operations: reconcileOps,
        },
        purchase: {
            purchaseReconciliationId: uuid(903),
            deduplicated: false,
            lines: [
                {
                    position: 0,
                    name: "Rolled oats",
                    quantity: 1,
                    unit: "bag",
                    confidence: 0.97,
                    action: "grocery_matched",
                    grocery_item_id: uuid(1),
                    inventory_item_id: uuid(51),
                },
                {
                    position: 1,
                    name: "Chicken breast",
                    quantity: 800,
                    unit: "g",
                    confidence: 0.93,
                    action: "grocery_matched",
                    grocery_item_id: uuid(2),
                    inventory_item_id: uuid(52),
                },
                {
                    position: 2,
                    name: "Jasmine rice",
                    quantity: 1,
                    unit: "kg",
                    confidence: 0.9,
                    action: "inventory_added",
                    grocery_item_id: null,
                    inventory_item_id: uuid(53),
                },
                {
                    position: 3,
                    name: "Avocados",
                    quantity: 3,
                    unit: null,
                    confidence: 0.88,
                    action: "inventory_added",
                    grocery_item_id: null,
                    inventory_item_id: uuid(54),
                },
                {
                    position: 4,
                    name: "Mystery sauce",
                    quantity: 1,
                    unit: "bottle",
                    confidence: 0.42,
                    action: "needs_review",
                    grocery_item_id: null,
                    inventory_item_id: null,
                },
                {
                    position: 5,
                    name: "Paper towels",
                    quantity: 1,
                    unit: "pack",
                    confidence: null,
                    action: "ignored_non_food",
                    grocery_item_id: null,
                    inventory_item_id: null,
                },
            ],
            summary: {
                groceryMatched: 2,
                inventoryAdded: 2,
                ignoredNonFood: 1,
                needsReview: 1,
            },
        },
        empty: { enabled: true, inventorySpaceId: uuid(901), items: [] },
        disabled: { enabled: false, inventorySpaceId: null, items: [] },
        partial: {
            enabled: true,
            inventorySpaceId: uuid(901),
            items: [
                pantryItem(
                    61,
                    "Olive oil",
                    0.5,
                    "bottle",
                    "approximate",
                    "available",
                    "pantry",
                ),
                pantryItem(62, "Eggs", 6, null, "exact", "low", "fridge"),
                pantryItem(
                    63,
                    "Rolled oats",
                    900,
                    "g",
                    "exact",
                    "available",
                    "pantry",
                    "usda",
                ),
            ],
        },
        error: { error: "The pantry could not be read. Try again in chat." },
    },
    "day-meals": {
        range: { text: rangeText3Days },
        search: { text: searchText },
        long: { text: rangeText7Days },
        empty: { text: "No meals logged today." },
        partial: {
            text: [
                mealBlock(
                    "m-21",
                    "2026-08-05T12:15:00.000Z",
                    "lunch",
                    "Grilled chicken and rice bowl",
                    650,
                    52,
                    78,
                    16,
                ),
                mealBlock(
                    "m-22",
                    "2026-08-05T15:00:00.000Z",
                    "snack",
                    "Garden salad",
                    null,
                ),
            ].join("\n\n---\n\n"),
        },
        error: { error: "These meals could not be read. Try again in chat." },
    },
});

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
