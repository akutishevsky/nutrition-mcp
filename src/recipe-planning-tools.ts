import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { dateOnlyString } from "./tz.js";
import { withAnalytics } from "./analytics.js";
import type { MunchCapabilities } from "./billing/capabilities.js";
import { rankSavedRecipesForPantry } from "./inventory/meal-planning.js";
import {
    requirePlanningAccess,
    requirePlanningScope,
    requireRecipeAccess,
    requireRecipeScope,
} from "./mcp-capability-guard.js";
import {
    addGroceryItems,
    archiveRecipe,
    getGroceryList,
    getMealPlan,
    getRecipe,
    logRecipe,
    markGroceryItemPurchased,
    saveRecipe,
    saveRecipeAndPlan,
    scheduleRecipe,
    searchRecipes,
    updateRecipe,
    type RecipeInput,
} from "./planning/repository.js";
import {
    WIDGET_RESOURCE_METADATA,
    widgetToolMeta,
} from "./openai-submission.js";
import { getWidgetHtml } from "./widgets.js";

const MEAL_PLAN_WIDGET_URI = "ui://widget/meal-plan.html";
const GROCERY_LIST_WIDGET_URI = "ui://widget/grocery-list.html";
const APP_UI_MIME_TYPE = "text/html;profile=mcp-app";

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

const nutritionStatusOutputSchema = z.enum([
    "complete",
    "partial",
    "unavailable",
]);
const savedRecipeResultOutputSchema = z.object({
    recipeId: z.string().uuid(),
    revisionId: z.string().uuid(),
    revisionNumber: z.number().int().positive(),
    nutritionStatus: nutritionStatusOutputSchema,
    totals: nutrientSchema,
    perServing: nutrientSchema,
    deduplicated: z.boolean(),
});
const recipeSummaryOutputSchema = z.object({
    recipe_id: z.string().uuid(),
    revision_id: z.string().uuid(),
    name: z.string(),
    version: z.number().int().positive(),
    ownership: z.enum(["personal", "household"]),
    servings: z.number().positive(),
    nutrition_status: nutritionStatusOutputSchema,
    nutrition_per_serving: nutrientSchema,
    preparation_minutes: z.number().int().nonnegative().nullable(),
    cooking_minutes: z.number().int().nonnegative().nullable(),
    times_scheduled: z.number().int().nonnegative(),
    last_scheduled_date: z.string().nullable(),
    times_logged: z.number().int().nonnegative(),
    last_logged_at: z.string().nullable(),
    updated_at: z.string(),
});
const pantryRecipeCandidateOutputSchema = z.object({
    recipe_id: z.string().uuid(),
    revision_id: z.string().uuid(),
    name: z.string(),
    servings: z.number().positive(),
    nutrition_status: z.string(),
    nutrition_per_serving: z.object({
        calories: z.number().nullable(),
        protein_g: z.number().nullable(),
        carbs_g: z.number().nullable(),
        fat_g: z.number().nullable(),
        fiber_g: z.number().nullable(),
    }),
    preparation_minutes: z.number().int().nonnegative().nullable(),
    cooking_minutes: z.number().int().nonnegative().nullable(),
    total_minutes: z.number().int().nonnegative().nullable(),
    availability: z.object({
        readiness: z.enum([
            "ready_now",
            "likely_ready",
            "almost_there",
            "missing_core",
        ]),
        matched: z.array(
            z.object({
                ingredient: z.string(),
                inventory_item_id: z.string().uuid(),
                score: z.number(),
                sufficient: z.boolean().nullable(),
            }),
        ),
        missing_required: z.array(z.string()),
        missing_optional: z.array(z.string()),
        shortages: z.array(
            z.object({
                ingredient: z.string(),
                missing_quantity: z.number().nonnegative(),
                unit: z.string(),
            }),
        ),
    }),
    flavor_support: z.object({
        matched: z.array(z.string()),
        missing: z.array(z.string()),
        coverage: z.number().min(0).max(1).nullable(),
    }),
    score: z.number(),
    score_reasons: z.array(z.string()),
});
const recipeIngredientOutputSchema = z.object({
    id: z.string().uuid(),
    position: z.number().int().nonnegative(),
    name: z.string(),
    quantity: z.number().nullable(),
    unit: z.string().nullable(),
    preparation: z.string().nullable(),
    optional: z.boolean(),
    gram_weight: z.number().nullable(),
    nutrients: nutrientSchema,
    provider: z.string().nullable(),
    provider_food_id: z.string().nullable(),
    source_type: z.string(),
    source_url: z.string().nullable(),
    confidence: z.number().nullable(),
    source_snapshot: z.record(z.string(), z.unknown()),
});
const recipeDetailOutputSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    version: z.number().int().positive(),
    ownership: z.union([
        z.object({ type: z.literal("personal") }),
        z.object({
            type: z.literal("household"),
            household_id: z.string().uuid(),
        }),
    ]),
    revision_id: z.string().uuid(),
    revision_number: z.number().int().positive(),
    servings: z.number().positive(),
    description: z.string().nullable(),
    instructions: z.array(z.string()),
    preparation_minutes: z.number().int().nonnegative().nullable(),
    cooking_minutes: z.number().int().nonnegative().nullable(),
    source: z.object({
        type: z.string(),
        title: z.string().nullable(),
        url: z.string().nullable(),
    }),
    nutrition_status: nutritionStatusOutputSchema,
    nutrition_total: nutrientSchema,
    nutrition_per_serving: nutrientSchema,
    ingredients: z.array(recipeIngredientOutputSchema),
    created_at: z.string(),
    updated_at: z.string(),
});
const updatedRecipeOutputSchema = savedRecipeResultOutputSchema.extend({
    version: z.number().int().positive(),
});
const archivedRecipeOutputSchema = z.object({
    recipe_id: z.string().uuid(),
    version: z.number().int().positive(),
    archived_at: z.string(),
    already_archived: z.boolean(),
});
const recipeLogItemOutputSchema = z.object({
    id: z.string().uuid(),
    position: z.number().int().nonnegative(),
    name: z.string(),
    quantity: z.number().nullable(),
    portion_label: z.string().nullable(),
    gram_weight: z.number().nullable(),
    nutrients: z.record(z.string(), z.number()),
    source_type: z.string(),
    provider: z.string().nullable(),
    provider_food_id: z.string().nullable(),
    source_url: z.string().nullable(),
    confidence: z.number().nullable(),
    assumptions: z.array(z.string()),
    source_snapshot: z.record(z.string(), z.unknown()),
});
const recipeLogMealOutputSchema = z.object({
    id: z.string().uuid(),
    logged_at: z.string(),
    meal_type: z.string().nullable(),
    description: z.string(),
    calories: z.number().nullable(),
    protein_g: z.number().nullable(),
    carbs_g: z.number().nullable(),
    fat_g: z.number().nullable(),
    fiber_g: z.number().nullable(),
    sugar_g: z.number().nullable(),
    source_recipe_id: z.string().uuid().nullable(),
    source_recipe_revision_id: z.string().uuid().nullable(),
    source_planned_meal_id: z.string().uuid().nullable(),
    items: z.array(recipeLogItemOutputSchema),
});
const recipeLogOutputSchema = z.object({
    logged_meal: recipeLogMealOutputSchema,
    recipe_id: z.string().uuid(),
    recipe_revision_id: z.string().uuid(),
    recipe_revision_number: z.number().int().positive(),
    servings_consumed: z.number().positive(),
    deduplicated: z.boolean(),
});
const plannedMealOutputSchema = z.object({
    planned_meal_id: z.string().uuid(),
    planned_date: z.string(),
    meal_slot: z.enum(["breakfast", "lunch", "dinner", "snack"]).nullable(),
    recipe_id: z.string().uuid().optional(),
    recipe_revision_id: z.string().uuid().optional(),
    recipe_name: z.string().optional(),
    servings: z.number().positive(),
    note: z.string().nullable().optional(),
    ownership: z.enum(["personal", "household"]).optional(),
    created_by: z.string().nullable().optional(),
    nutrition_per_serving: nutrientSchema.optional(),
    version: z.number().int().positive().optional(),
});
const groceryListItemOutputSchema = z.object({
    grocery_item_id: z.string().uuid(),
    name: z.string(),
    quantity: z.number().nullable(),
    unit: z.string().nullable(),
    note: z.string().nullable(),
    purchased_at: z.string().nullable(),
    source_recipe_id: z.string().uuid().nullable(),
    source_planned_meal_id: z.string().uuid().nullable(),
    added_by: z.string().nullable(),
    version: z.number().int().positive(),
});
const groceryMutationItemOutputSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    quantity: z.union([z.number(), z.string()]).nullable(),
    unit: z.string().nullable(),
    purchased_at: z.string().nullable(),
    version: z.union([z.number(), z.string()]),
    merged: z.boolean(),
});
const groceryListOutputSchema = z.object({
    groceryListId: z.string().uuid().nullable(),
    items: z.array(groceryListItemOutputSchema),
});
const groceryMutationOutputSchema = z.object({
    groceryListId: z.string().uuid().nullable(),
    items: z.array(groceryMutationItemOutputSchema),
});
const groceryPurchasedOutputSchema = z.object({
    grocery_item_id: z.string().uuid(),
    purchased_at: z.string().nullable(),
    version: z.number().int().positive(),
});

const planningOutputSchemas = {
    search_recipes: {
        recipes: z.array(recipeSummaryOutputSchema),
        pantry_candidates: z
            .array(pantryRecipeCandidateOutputSchema)
            .optional(),
    },
    get_recipe: { recipe: recipeDetailOutputSchema.nullable() },
    save_recipe: { recipe: savedRecipeResultOutputSchema },
    update_recipe: { recipe: updatedRecipeOutputSchema },
    delete_recipe: { recipe: archivedRecipeOutputSchema },
    log_recipe: recipeLogOutputSchema,
    get_meal_plan: { planned_meals: z.array(plannedMealOutputSchema) },
    get_grocery_list: { grocery: groceryListOutputSchema },
    schedule_recipe: { planned_meal: plannedMealOutputSchema },
    add_grocery_items: { grocery: groceryMutationOutputSchema },
    mark_grocery_item_purchased: {
        grocery_item: groceryPurchasedOutputSchema,
    },
    save_recipe_and_plan: {
        recipe: savedRecipeResultOutputSchema,
        plannedMeal: plannedMealOutputSchema,
        grocery: groceryMutationOutputSchema,
    },
} as const;

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

function serializeScheduledMeal(planned: Record<string, unknown>) {
    return {
        planned_meal_id: String(planned.id),
        planned_date: dateOnlyString(planned.planned_date),
        meal_slot: planned.meal_slot == null ? null : String(planned.meal_slot),
        servings: Number(planned.servings),
    };
}

function serializeLoggedRecipe(result: Awaited<ReturnType<typeof logRecipe>>) {
    return {
        logged_meal: {
            id: result.meal.id,
            logged_at: result.meal.loggedAt,
            meal_type: result.meal.mealType,
            description: result.meal.description,
            calories: result.meal.calories,
            protein_g: result.meal.proteinG,
            carbs_g: result.meal.carbsG,
            fat_g: result.meal.fatG,
            fiber_g: result.meal.fiberG,
            sugar_g: result.meal.sugarG,
            source_recipe_id: result.meal.sourceRecipeId,
            source_recipe_revision_id: result.meal.sourceRecipeRevisionId,
            source_planned_meal_id: result.meal.sourcePlannedMealId,
            items: result.meal.items.map((item) => ({
                id: item.id,
                position: item.position,
                name: item.name,
                quantity: item.quantity,
                portion_label: item.portionLabel,
                gram_weight: item.gramWeight,
                nutrients: item.nutrients,
                source_type: item.sourceType,
                provider: item.provider,
                provider_food_id: item.providerFoodId,
                source_url: item.sourceUrl,
                confidence: item.confidence,
                assumptions: item.assumptions,
                source_snapshot: item.sourceSnapshot,
            })),
        },
        recipe_id: result.recipeId,
        recipe_revision_id: result.recipeRevisionId,
        recipe_revision_number: result.recipeRevisionNumber,
        servings_consumed: result.servingsConsumed,
        deduplicated: result.deduplicated,
    };
}

export function registerRecipePlanningTools(
    server: McpServer,
    userId: string,
    capabilities: MunchCapabilities,
    widgetsEnabled = true,
): void {
    const toolServer = server as unknown as {
        registerTool: (
            name: string,
            config: unknown,
            handler: (...args: any[]) => unknown,
        ) => unknown;
        registerResource?: (
            name: string,
            uri: string,
            config: unknown,
            handler: (...args: any[]) => unknown,
        ) => unknown;
    };
    // Link a tool to its widget only when this user has widgets enabled
    // (UI meta only; annotations, behavior, and payloads are unchanged).
    const uiMeta = (resourceUri: string) =>
        widgetsEnabled ? widgetToolMeta(resourceUri) : {};
    if (typeof toolServer.registerResource === "function") {
        toolServer.registerResource(
            "meal-plan-widget",
            MEAL_PLAN_WIDGET_URI,
            {
                title: "Meal Plan",
                description:
                    "Interactive UI for get_meal_plan: planned recipes day by day with per-day totals, with automatic light/dark theming.",
                mimeType: APP_UI_MIME_TYPE,
            },
            async (uri: URL | string) => ({
                contents: [
                    {
                        uri: typeof uri === "string" ? uri : uri.href,
                        mimeType: APP_UI_MIME_TYPE,
                        text: await getWidgetHtml("meal-plan"),
                        _meta: WIDGET_RESOURCE_METADATA,
                    },
                ],
            }),
        );
        toolServer.registerResource(
            "grocery-list-widget",
            GROCERY_LIST_WIDGET_URI,
            {
                title: "Grocery List",
                description:
                    "Interactive UI for get_grocery_list: a read-only checklist of what is still to buy and what is already purchased, with automatic light/dark theming.",
                mimeType: APP_UI_MIME_TYPE,
            },
            async (uri: URL | string) => ({
                contents: [
                    {
                        uri: typeof uri === "string" ? uri : uri.href,
                        mimeType: APP_UI_MIME_TYPE,
                        text: await getWidgetHtml("grocery-list"),
                        _meta: WIDGET_RESOURCE_METADATA,
                    },
                ],
            }),
        );
    }

    toolServer.registerTool(
        "search_recipes",
        {
            title: "Search Recipes",
            description:
                "Search accessible structured recipes and return factual nutrition, timing, and usage. For a Pantry meal-planning request, set pantry_match=true and provide pantry_scope/goal so Munch also ranks saved recipes against the full on-hand kitchen, including spices, sauces, aromatics, optional ingredients, shortages, and flavor support. Do not reduce meal planning to protein/starch matching.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                query: z.preprocess(
                    (value) =>
                        typeof value === "string"
                            ? value.trim() || undefined
                            : value,
                    z.string().min(1).max(200).optional(),
                ),
                scope: z.enum(["personal", "household", "all"]).optional(),
                limit: z.number().int().min(1).max(50).optional(),
                pantry_match: z.boolean().optional(),
                pantry_scope: z.enum(["personal", "household"]).optional(),
                pantry_goal: z
                    .enum([
                        "high_protein",
                        "low_calorie",
                        "high_fiber",
                        "use_what_i_have",
                        "balanced",
                    ])
                    .optional(),
                assumed_staples: z
                    .array(z.string().min(1).max(100))
                    .max(20)
                    .optional(),
                max_minutes: z.number().int().positive().max(1440).optional(),
            },
            outputSchema: planningOutputSchemas.search_recipes,
        },
        async ({
            query,
            scope,
            limit,
            pantry_match,
            pantry_scope,
            pantry_goal,
            assumed_staples,
            max_minutes,
        }) =>
            withAnalytics(
                "search_recipes",
                async () => {
                    requireRecipeAccess(capabilities, scope ?? "all", false);
                    const recipes = await searchRecipes({
                        userId,
                        query,
                        scope,
                        limit,
                    });
                    let pantryCandidates;
                    if (pantry_match) {
                        if (capabilities.tier !== "premium") {
                            throw new Error(
                                "Pantry-aware recipe ranking requires Munch Premium",
                            );
                        }
                        const requestedPantryScope =
                            pantry_scope ??
                            (scope === "household" ? "household" : "personal");
                        const pantryScope = requireRecipeScope(
                            requestedPantryScope,
                            capabilities,
                            false,
                        );
                        pantryCandidates = await rankSavedRecipesForPantry({
                            userId,
                            scope: pantryScope,
                            goal: pantry_goal ?? "balanced",
                            assumedStaples: assumed_staples,
                            maxMinutes: max_minutes,
                            limit: Math.min(limit ?? 6, 12),
                        });
                        if (query) {
                            const normalizedQuery = query.toLowerCase();
                            pantryCandidates = pantryCandidates.filter(
                                (candidate) =>
                                    candidate.name
                                        .toLowerCase()
                                        .includes(normalizedQuery),
                            );
                        }
                    }
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
                        structuredContent: {
                            recipes,
                            ...(pantryCandidates
                                ? { pantry_candidates: pantryCandidates }
                                : {}),
                        },
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
            inputSchema: {
                recipe_id: z.string().uuid(),
                recipe_revision_id: z.string().uuid().optional(),
            },
            outputSchema: planningOutputSchemas.get_recipe,
        },
        async ({ recipe_id, recipe_revision_id }) =>
            withAnalytics(
                "get_recipe",
                async () => {
                    requireRecipeAccess(capabilities);
                    const recipe = await getRecipe(
                        userId,
                        recipe_id,
                        recipe_revision_id,
                    );
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
            outputSchema: planningOutputSchemas.save_recipe,
        },
        async ({ scope, recipe, idempotency_key }) =>
            withAnalytics(
                "save_recipe",
                async () => {
                    const result = await saveRecipe({
                        userId,
                        scope: requireRecipeScope(scope, capabilities, true),
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

    toolServer.registerTool(
        "update_recipe",
        {
            title: "Update Recipe",
            description:
                "Replace the current recipe definition with a new immutable revision. Read the current recipe first, preserve its source facts, and send the complete replacement recipe with the current expected_version. Historical meal logs remain pinned to the revision used when they were logged.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                scope: z.enum(["personal", "household"]),
                recipe_id: z.string().uuid(),
                expected_version: z.number().int().positive(),
                recipe: recipeSchema,
                idempotency_key: z.string().min(1).max(255),
            },
            outputSchema: planningOutputSchemas.update_recipe,
        },
        async (args) =>
            withAnalytics(
                "update_recipe",
                async () => {
                    const result = await updateRecipe({
                        userId,
                        scope: requireRecipeScope(
                            args.scope,
                            capabilities,
                            true,
                        ),
                        recipeId: args.recipe_id,
                        recipe: toRecipeInput(args.recipe),
                        expectedVersion: args.expected_version,
                        idempotencyKey: args.idempotency_key,
                    });
                    return {
                        content: [
                            {
                                type: "text",
                                text: result.deduplicated
                                    ? "Recipe update was already applied; returned the existing revision."
                                    : `Recipe updated to revision ${result.revisionNumber}.`,
                            },
                        ],
                        structuredContent: { recipe: result },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "delete_recipe",
        {
            title: "Delete Recipe",
            description:
                "Archive a saved recipe after explicit user confirmation. This removes it from active recipe search and planning while preserving immutable revisions and historical meal logs.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                scope: z.enum(["personal", "household"]),
                recipe_id: z.string().uuid(),
                expected_version: z.number().int().positive().optional(),
                confirm: z.literal(true),
            },
            outputSchema: planningOutputSchemas.delete_recipe,
        },
        async (args) =>
            withAnalytics(
                "delete_recipe",
                async () => {
                    const result = await archiveRecipe({
                        userId,
                        scope: requireRecipeScope(
                            args.scope,
                            capabilities,
                            true,
                        ),
                        recipeId: args.recipe_id,
                        expectedVersion: args.expected_version,
                    });
                    return {
                        content: [
                            {
                                type: "text",
                                text: result.alreadyArchived
                                    ? "Recipe was already archived."
                                    : "Recipe archived; historical logs were preserved.",
                            },
                        ],
                        structuredContent: {
                            recipe: {
                                recipe_id: result.recipeId,
                                version: result.version,
                                archived_at: result.archivedAt,
                                already_archived: result.alreadyArchived,
                            },
                        },
                    };
                },
                { userId },
            ),
    );
    toolServer.registerTool(
        "log_recipe",
        {
            title: "Log Recipe",
            description:
                "Log an explicit serving amount of a saved recipe without re-estimating its ingredients. Ask for the serving amount and meal type first when either is missing. Munch scales the saved ingredient quantities and nutrition, records the exact recipe revision, and stores source snapshots on every historical meal item. Use recipe_revision_id to intentionally log an older revision.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                recipe_id: z.string().uuid(),
                recipe_revision_id: z.string().uuid().optional(),
                servings_consumed: z.number().positive(),
                meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
                logged_at: z.string().optional(),
                notes: z.string().max(4_000).optional(),
                planned_meal_id: z.string().uuid().optional(),
                idempotency_key: z.string().min(1).max(255),
            },
            outputSchema: planningOutputSchemas.log_recipe,
        },
        async (args) =>
            withAnalytics(
                "log_recipe",
                async () => {
                    requireRecipeAccess(capabilities);
                    const result = await logRecipe({
                        userId,
                        recipeId: args.recipe_id,
                        recipeRevisionId: args.recipe_revision_id,
                        servingsConsumed: args.servings_consumed,
                        mealType: args.meal_type,
                        loggedAt: args.logged_at,
                        notes: args.notes,
                        plannedMealId: args.planned_meal_id,
                        idempotencyKey: args.idempotency_key,
                    });
                    const serialized = serializeLoggedRecipe(result);
                    return {
                        content: [
                            {
                                type: "text",
                                text: result.deduplicated
                                    ? "Recipe meal log was already recorded; returned the existing meal."
                                    : `Logged ${args.servings_consumed} serving${args.servings_consumed === 1 ? "" : "s"} of the saved recipe without re-estimating its ingredients.`,
                            },
                        ],
                        structuredContent: serialized,
                    };
                },
                { userId },
            ),
    );

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
            outputSchema: planningOutputSchemas.get_meal_plan,
            ...uiMeta(MEAL_PLAN_WIDGET_URI),
        },
        async ({ start_date, end_date, scope }) =>
            withAnalytics(
                "get_meal_plan",
                async () => {
                    requirePlanningAccess(capabilities, scope ?? "all", false);
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
            outputSchema: planningOutputSchemas.get_grocery_list,
            ...uiMeta(GROCERY_LIST_WIDGET_URI),
        },
        async ({ scope, include_purchased }) =>
            withAnalytics(
                "get_grocery_list",
                async () => {
                    const grocery = await getGroceryList({
                        userId,
                        scope: requirePlanningScope(scope, capabilities, false),
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
            outputSchema: planningOutputSchemas.schedule_recipe,
        },
        async (args) =>
            withAnalytics(
                "schedule_recipe",
                async () => {
                    requireRecipeAccess(capabilities, args.scope, false);
                    const planned = await scheduleRecipe({
                        userId,
                        scope: requirePlanningScope(
                            args.scope,
                            capabilities,
                            true,
                        ),
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
                        structuredContent: {
                            planned_meal: serializeScheduledMeal(planned),
                        },
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
            outputSchema: planningOutputSchemas.add_grocery_items,
        },
        async ({ scope, items }) =>
            withAnalytics(
                "add_grocery_items",
                async () => {
                    const grocery = await addGroceryItems({
                        userId,
                        scope: requirePlanningScope(scope, capabilities, true),
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
            outputSchema: planningOutputSchemas.mark_grocery_item_purchased,
        },
        async ({ grocery_item_id, purchased, expected_version }) =>
            withAnalytics(
                "mark_grocery_item_purchased",
                async () => {
                    requirePlanningAccess(capabilities, "all", true);
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
            outputSchema: planningOutputSchemas.save_recipe_and_plan,
        },
        async (args) =>
            withAnalytics(
                "save_recipe_and_plan",
                async () => {
                    requireRecipeScope(args.scope, capabilities, true);
                    const result = await saveRecipeAndPlan({
                        userId,
                        scope: requirePlanningScope(
                            args.scope,
                            capabilities,
                            true,
                        ),
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
