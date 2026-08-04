import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withAnalytics } from "./analytics.js";
import type { MunchCapabilities } from "./billing/capabilities.js";
import {
    addGroceryItems,
    getGroceryList,
    getMealPlan,
    getRecipe,
    markGroceryItemPurchased,
    saveRecipe,
    saveRecipeAndPlan,
    scheduleRecipe,
    searchRecipes,
    type PlanningScope,
    type RecipeInput,
} from "./planning/repository.js";

const nutrientSchema = z.object({
    calories: z.number().nonnegative().optional(),
    protein_g: z.number().nonnegative().optional(),
    carbs_g: z.number().nonnegative().optional(),
    fat_g: z.number().nonnegative().optional(),
    fiber_g: z.number().nonnegative().optional(),
    sugar_g: z.number().nonnegative().optional(),
    sodium_mg: z.number().nonnegative().optional(),
});

const ingredientSchema = z.object({
    name: z.string().min(1).max(300),
    quantity: z.number().positive().optional(),
    unit: z.string().max(80).optional(),
    preparation: z.string().max(200).optional(),
    optional: z.boolean().optional(),
    gram_weight: z.number().positive().optional(),
    nutrients: nutrientSchema.optional(),
    provider: z.string().max(80).optional(),
    provider_food_id: z.string().max(300).optional(),
    source_type: z.enum([
        "usda",
        "open_food_facts",
        "published_restaurant",
        "saved_food",
        "past_meal",
        "user_supplied",
        "model_estimate",
    ]),
    source_url: z.string().url().max(2000).optional(),
    confidence: z.number().min(0).max(1).optional(),
    source_snapshot: z.record(z.string(), z.unknown()).optional(),
});

const recipeSchema = z.object({
    name: z.string().min(1).max(200),
    servings: z.number().positive(),
    description: z.string().max(2000).optional(),
    instructions: z.array(z.string().min(1).max(2000)).max(100),
    preparation_minutes: z.number().int().nonnegative().max(10_080).optional(),
    cooking_minutes: z.number().int().nonnegative().max(10_080).optional(),
    source_type: z.enum(["user_entered", "chatgpt_generated", "imported"]),
    source_title: z.string().max(500).optional(),
    source_url: z.string().url().max(2000).optional(),
    ingredients: z.array(ingredientSchema).min(1).max(200),
});

const groceryItemSchema = z.object({
    name: z.string().min(1).max(300),
    quantity: z.number().positive().optional(),
    unit: z.string().max(80).optional(),
    note: z.string().max(500).optional(),
    food_provider: z.string().max(80).optional(),
    provider_food_id: z.string().max(300).optional(),
});

function toRecipeInput(value: z.infer<typeof recipeSchema>): RecipeInput {
    return {
        name: value.name,
        servings: value.servings,
        description: value.description,
        instructions: value.instructions,
        preparationMinutes: value.preparation_minutes,
        cookingMinutes: value.cooking_minutes,
        sourceType: value.source_type,
        sourceTitle: value.source_title,
        sourceUrl: value.source_url,
        ingredients: value.ingredients.map((ingredient) => ({
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            preparation: ingredient.preparation,
            optional: ingredient.optional,
            gramWeight: ingredient.gram_weight,
            nutrients: ingredient.nutrients,
            provider: ingredient.provider,
            providerFoodId: ingredient.provider_food_id,
            sourceType: ingredient.source_type,
            sourceUrl: ingredient.source_url,
            confidence: ingredient.confidence,
            sourceSnapshot: ingredient.source_snapshot,
        })),
    };
}

function requestedScope(
    value: "personal" | "household",
    capabilities: MunchCapabilities,
    write: boolean,
): PlanningScope {
    if (value === "personal") {
        const allowed = write
            ? capabilities.personalRecipesWrite
            : capabilities.personalRecipesRead;
        if (!allowed)
            throw new Error("Personal recipe capability is unavailable");
        return { type: "personal" };
    }
    const allowed = write
        ? capabilities.householdWrite
        : capabilities.householdRead;
    if (!allowed || !capabilities.household) {
        throw new Error("Household recipe capability is unavailable");
    }
    return {
        type: "household",
        householdId: capabilities.household.householdId,
    };
}

function groceryInputs(items: z.infer<typeof groceryItemSchema>[]) {
    return items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        note: item.note,
        foodProvider: item.food_provider,
        providerFoodId: item.provider_food_id,
    }));
}

export function registerRecipePlanningTools(
    server: McpServer,
    userId: string,
    capabilities: MunchCapabilities,
): void {
    if (!capabilities.personalRecipesRead && !capabilities.householdRead) {
        return;
    }
    const toolServer = server as unknown as {
        registerTool: (
            name: string,
            config: unknown,
            handler: (...args: any[]) => unknown,
        ) => unknown;
    };

    toolServer.registerTool(
        "search_recipes",
        {
            title: "Search Recipes",
            description:
                "Search accessible structured recipes and return factual ingredients, nutrition, timing, scheduling frequency, and logging frequency. Use these facts to satisfy the user's explicit filters. Do not treat Munch as supplying health advice or unstored labels such as favorite or healthy.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                query: z.string().min(1).max(200).optional(),
                scope: z.enum(["personal", "household", "all"]).optional(),
                limit: z.number().int().min(1).max(50).optional(),
            },
        },
        async ({ query, scope, limit }) =>
            withAnalytics(
                "search_recipes",
                async () => {
                    const recipes = await searchRecipes({
                        userId,
                        query,
                        scope,
                        limit,
                    });
                    return {
                        content: [
                            {
                                type: "text",
                                text:
                                    recipes.length === 0
                                        ? "No matching recipes were found."
                                        : `Found ${recipes.length} structured recipe${recipes.length === 1 ? "" : "s"}.`,
                            },
                        ],
                        structuredContent: { recipes },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "get_recipe",
        {
            title: "Get Recipe",
            description:
                "Retrieve one saved recipe revision with ordered ingredients, instructions, serving count, nutrition arithmetic, and source provenance.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: { recipe_id: z.string().uuid() },
        },
        async ({ recipe_id }) =>
            withAnalytics(
                "get_recipe",
                async () => {
                    const recipe = await getRecipe(userId, recipe_id);
                    return {
                        content: [
                            {
                                type: "text",
                                text: recipe
                                    ? `${recipe.name}: ${recipe.servings} servings; nutrition status ${recipe.nutrition_status}.`
                                    : "Recipe was not found.",
                            },
                        ],
                        structuredContent: { recipe },
                    };
                },
                { userId },
            ),
    );

    const canWriteRecipe =
        capabilities.personalRecipesWrite || capabilities.householdWrite;
    if (canWriteRecipe) {
        toolServer.registerTool(
            "save_recipe",
            {
                title: "Save Recipe",
                description:
                    "Save the complete recipe currently established in the conversation as factual structured data. Include ingredients, quantities, servings, instructions, source type, and any available nutrient facts. Do not invent classification tags.",
                annotations: {
                    readOnlyHint: false,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: false,
                },
                inputSchema: {
                    scope: z.enum(["personal", "household"]),
                    recipe: recipeSchema,
                    idempotency_key: z.string().min(1).max(255),
                },
            },
            async ({ scope, recipe, idempotency_key }) =>
                withAnalytics(
                    "save_recipe",
                    async () => {
                        const result = await saveRecipe({
                            userId,
                            scope: requestedScope(scope, capabilities, true),
                            recipe: toRecipeInput(recipe),
                            idempotencyKey: idempotency_key,
                        });
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: result.deduplicated
                                        ? "Recipe was already saved; returned the existing revision."
                                        : "Recipe saved.",
                                },
                            ],
                            structuredContent: { recipe: result },
                        };
                    },
                    { userId },
                ),
        );
    }

    const canReadPlanning =
        capabilities.personalPlanningRead || capabilities.householdRead;
    if (canReadPlanning) {
        toolServer.registerTool(
            "get_meal_plan",
            {
                title: "Get Meal Plan",
                description:
                    "Get factual personal or household planned meals for a date range, including recipe revision, servings, nutrition per serving, and household planner attribution when available.",
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: false,
                },
                inputSchema: {
                    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                    scope: z.enum(["personal", "household", "all"]).optional(),
                },
            },
            async ({ start_date, end_date, scope }) =>
                withAnalytics(
                    "get_meal_plan",
                    async () => {
                        const planned_meals = await getMealPlan({
                            userId,
                            startDate: start_date,
                            endDate: end_date,
                            scope,
                        });
                        return {
                            content: [
                                {
                                    type: "text",
                                    text:
                                        planned_meals.length === 0
                                            ? "No meals are planned in that date range."
                                            : `${planned_meals.length} meal${planned_meals.length === 1 ? " is" : "s are"} planned.`,
                                },
                            ],
                            structuredContent: { planned_meals },
                        };
                    },
                    { userId },
                ),
        );

        toolServer.registerTool(
            "get_grocery_list",
            {
                title: "Get Grocery List",
                description:
                    "Retrieve the active personal or household grocery list. This is an explicit shopping list, not pantry inventory.",
                annotations: {
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: false,
                },
                inputSchema: {
                    scope: z.enum(["personal", "household"]),
                    include_purchased: z.boolean().optional(),
                },
            },
            async ({ scope, include_purchased }) =>
                withAnalytics(
                    "get_grocery_list",
                    async () => {
                        const grocery = await getGroceryList({
                            userId,
                            scope: requestedScope(scope, capabilities, false),
                            includePurchased: include_purchased,
                        });
                        return {
                            content: [
                                {
                                    type: "text",
                                    text:
                                        grocery.items.length === 0
                                            ? "The grocery list is empty."
                                            : `${grocery.items.length} item${grocery.items.length === 1 ? " remains" : "s remain"} on the grocery list.`,
                                },
                            ],
                            structuredContent: { grocery },
                        };
                    },
                    { userId },
                ),
        );
    }

    const canWritePlanning =
        capabilities.personalPlanningWrite || capabilities.householdWrite;
    if (!canWritePlanning) return;

    toolServer.registerTool(
        "schedule_recipe",
        {
            title: "Schedule Recipe",
            description:
                "Schedule an existing immutable recipe revision on a personal or household meal calendar. Scheduling does not claim anyone ate the meal and does not assign a cook.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                scope: z.enum(["personal", "household"]),
                recipe_id: z.string().uuid(),
                recipe_revision_id: z.string().uuid(),
                planned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                meal_slot: z
                    .enum(["breakfast", "lunch", "dinner", "snack"])
                    .optional(),
                servings: z.number().positive(),
                note: z.string().max(500).optional(),
                idempotency_key: z.string().min(1).max(255),
            },
        },
        async (args) =>
            withAnalytics(
                "schedule_recipe",
                async () => {
                    const planned = await scheduleRecipe({
                        userId,
                        scope: requestedScope(args.scope, capabilities, true),
                        recipeId: args.recipe_id,
                        recipeRevisionId: args.recipe_revision_id,
                        plannedDate: args.planned_date,
                        mealSlot: args.meal_slot,
                        servings: args.servings,
                        note: args.note,
                        idempotencyKey: args.idempotency_key,
                    });
                    return {
                        content: [{ type: "text", text: "Recipe scheduled." }],
                        structuredContent: { planned_meal: planned },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "add_grocery_items",
        {
            title: "Add Grocery Items",
            description:
                "Add only the groceries the user explicitly says are needed. When the user says they already have everything except onions, pass onions only; do not infer or store pantry inventory.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                scope: z.enum(["personal", "household"]),
                items: z.array(groceryItemSchema).min(1).max(100),
            },
        },
        async ({ scope, items }) =>
            withAnalytics(
                "add_grocery_items",
                async () => {
                    const grocery = await addGroceryItems({
                        userId,
                        scope: requestedScope(scope, capabilities, true),
                        items: groceryInputs(items),
                    });
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${grocery.items.length} grocery item${grocery.items.length === 1 ? " was" : "s were"} added or consolidated.`,
                            },
                        ],
                        structuredContent: { grocery },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "mark_grocery_item_purchased",
        {
            title: "Mark Grocery Item Purchased",
            description:
                "Mark or unmark one grocery-list item as purchased using optimistic version control.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                grocery_item_id: z.string().uuid(),
                purchased: z.boolean(),
                expected_version: z.number().int().positive(),
            },
        },
        async ({ grocery_item_id, purchased, expected_version }) =>
            withAnalytics(
                "mark_grocery_item_purchased",
                async () => {
                    const grocery_item = await markGroceryItemPurchased({
                        userId,
                        groceryItemId: grocery_item_id,
                        purchased,
                        expectedVersion: expected_version,
                    });
                    return {
                        content: [
                            {
                                type: "text",
                                text: purchased
                                    ? "Grocery item marked purchased."
                                    : "Grocery item restored to the active list.",
                            },
                        ],
                        structuredContent: { grocery_item },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "save_recipe_and_plan",
        {
            title: "Save Recipe, Plan Meal, and Add Groceries",
            description:
                "Atomically save the complete structured recipe discussed with the user, schedule it for a date, and add only explicitly missing grocery items. Use this for requests such as: save this recipe, plan it for Monday, and add onions because everything else is already available.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                scope: z.enum(["personal", "household"]),
                recipe: recipeSchema,
                planned_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                meal_slot: z
                    .enum(["breakfast", "lunch", "dinner", "snack"])
                    .optional(),
                planned_servings: z.number().positive(),
                note: z.string().max(500).optional(),
                grocery_items_needed: z.array(groceryItemSchema).max(100),
                idempotency_key: z.string().min(1).max(200),
            },
        },
        async (args) =>
            withAnalytics(
                "save_recipe_and_plan",
                async () => {
                    const result = await saveRecipeAndPlan({
                        userId,
                        scope: requestedScope(args.scope, capabilities, true),
                        recipe: toRecipeInput(args.recipe),
                        plannedDate: args.planned_date,
                        mealSlot: args.meal_slot,
                        plannedServings: args.planned_servings,
                        note: args.note,
                        groceryItems: groceryInputs(args.grocery_items_needed),
                        idempotencyKey: args.idempotency_key,
                    });
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Recipe saved and planned for ${args.planned_date}; ${result.grocery.items.length} explicitly needed grocery item${result.grocery.items.length === 1 ? " was" : "s were"} added.`,
                            },
                        ],
                        structuredContent: result,
                    };
                },
                { userId },
            ),
    );
}
