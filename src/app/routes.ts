import { Hono, type Context } from "hono";
import {
    capabilitySurfaceFromRequest,
    resolveMunchCapabilities,
    resolveRequestMunchCapabilities,
} from "../billing/capabilities.js";
import {
    getHouseholdSeatCoverage,
    ownerCanPurchaseHouseholdSeats,
} from "../billing/household-seats.js";
import {
    listHouseholdMembers,
    listPendingHouseholdInvitations,
} from "../households/repository.js";
import { requireSameOrigin } from "../accounts/csrf.js";
import { requireWebSession } from "../accounts/session.js";
import { getDirectSubscriptionSnapshot } from "../billing/subscription-sources.js";
import { requirePlanningScope } from "../mcp-capability-guard.js";
import { parseCsv } from "../csv.js";
import {
    serializeImportResult,
    MAX_ROWS_PER_CALL,
    type BulkImportArgs,
    type ImportRow,
} from "../import.js";
import { runUserImport } from "../import-service.js";
import {
    listOAuthConnections,
    revokeOAuthConnection,
} from "../portal/repository.js";
import {
    deleteMeal,
    deleteWater,
    deleteWeight,
    getPreferredWeightUnit,
    getNutritionGoals,
    insertWater,
    insertWeight,
    updateMeal,
    updateWater,
    updateWeight,
    upsertNutritionGoals,
    upsertProfile,
} from "../storage.js";
import { getFoodSearchService } from "../food-providers/service.js";
import {
    getChatState,
    sendChatMessage,
    startChatConversation,
} from "../chat/service.js";
import {
    isChatEntrySurface,
    type ChatEntrySurface,
} from "../chat/repository.js";
import { estimateMealPhotoNutrients } from "../meal-photo/estimate.js";
import { addTextToPhotoDraft } from "../meal-photo/draft-add.js";
import { parseDraftAddTextWithModel } from "../meal-photo/draft-add-parse.js";
import { createMealPhotoDraft } from "../meal-photo/pipeline.js";
import {
    chooseMealPhotoCandidates,
    identifyMealPhoto,
    mealPhotoVisionConfig,
    MealPhotoNoFoodError,
} from "../meal-photo/vision.js";
import { RecipeImportError } from "../recipe-import/fetch.js";
import { previewRecipeUrl } from "../recipe-import/service.js";
import { getWebsiteRecipeImportSemanticResolver } from "../recipe-import/semantic-resolver.js";
import {
    deleteSavedFood,
    markSavedFoodUsed,
    saveFood,
} from "../saved-foods/repository.js";
import { getStructuredMeal } from "../structured-meals/repository.js";
import {
    addGroceryItems,
    addRecipeToGroceryList,
    archiveRecipe,
    clearPurchasedGroceryItems,
    deleteGroceryItem,
    getRecipe,
    healRecipeNutrition,
    logRecipe,
    markGroceryItemPurchased,
    saveRecipe,
    saveRecipeAndPlan,
    scheduleRecipe,
    updateGroceryItem,
    updateRecipe,
    type GroceryItemInput,
    type PlanningScope,
    type RecipeInput,
} from "../planning/repository.js";
import { validateTz } from "../tz.js";
import { isPlausibleWeightGrams, isWeightUnit, toGrams } from "../units.js";
import {
    addStructuredMealItem,
    copyMeal,
    deleteStructuredMealItem,
    updateStructuredMealItem,
} from "./meal-mutations.js";
import {
    createAppMeal,
    getAppFoodDetails,
    lookupAppFoodBarcode,
    resolveWebMealItem,
    searchAppFoods,
    serializeSavedFood,
} from "./meal-entry.js";
import {
    draftItemInputFromBody,
    enrichMealDraftForApp,
    mealDraftInputFromBody,
    serializeMealDraftForApp,
} from "./meal-draft-review.js";
import {
    answerMealDraftQuestion,
    cancelMealDraft,
    confirmMealDraft,
    createMealDraft,
    deleteMealDraftItem,
    getMealDraft,
    prepareMealDraftConfirmation,
    updateMealDraftMetadata,
    upsertMealDraftItem,
} from "../meal-drafts/index.js";
import {
    getAppBootstrap,
    getFoodsWorkspace,
    getHouseholdWorkspace,
    getInsightsWorkspace,
    getMealHistoryWorkspace,
    getPlanningWorkspace,
    getRecipeWorkspace,
    getCalendarMonthSummary,
    getTodayWorkspace,
    getTrendsDayDetail,
    getTrendsPeriodContributors,
    getTrendsWorkspace,
} from "./repository.js";
import {
    getTrendsDashboardLayout,
    saveTrendsDashboardLayout,
} from "../trends-layout.js";
import {
    getFeatureModules,
    saveFeatureModules,
} from "../feature-modules-repository.js";
import { featureModulePatch } from "../feature-modules.js";
import {
    addCookUpdate,
    buildRecipeCookDish,
    compareCooks,
    correctCookEvent,
    createCook,
    deleteCook,
    finishCook,
    getCook,
    parseNaturalCookUpdate,
    prepareCookRecipeDraft,
    recordCookOutcome,
    reopenCook,
    repeatCook,
    saveCookAsRecipe,
    searchCooks,
    setPreferredCook,
    updateCook,
    updateCookDish,
    updateCookDishProgress,
    type CookDishInput,
    type CookEventInput,
    type CookMediaInput,
    type CookScope,
} from "../cooks/repository.js";
import {
    normalizeCookMediaMimeType,
    validateCookMediaUpload,
    type CookMediaFailure,
} from "../cooks/media.js";

function requiredQuery(value: string | undefined, name: string): string {
    if (!value) throw new Error(`${name} is required`);
    return value;
}

function optionalLimit(value: string | undefined): number | undefined {
    if (value === undefined || value === "") return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 25) {
        throw new Error("Invalid result limit");
    }
    return parsed;
}

function numberOrNull(value: unknown): number | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error("Invalid number");
    }
    return parsed;
}

function positiveInteger(value: unknown, label: string): number {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        throw new Error(`${label} must be a positive integer`);
    }
    return parsed;
}

function positiveNumber(value: unknown): number | undefined {
    if (value === undefined) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error("Invalid quantity");
    }
    return parsed;
}

function nonnegativeNumber(value: unknown): number | undefined {
    if (value === undefined) return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error("Invalid nonnegative number");
    }
    return parsed;
}

function privateJson(c: Context, data: unknown) {
    return c.json(data, 200, {
        "Cache-Control": "no-store, private",
        Pragma: "no-cache",
    });
}

function privateJsonStatus(
    c: Context,
    data: unknown,
    status: 400 | 403 | 422 | 502 | 503,
) {
    return c.json(data, status, {
        "Cache-Control": "no-store, private",
        Pragma: "no-cache",
    });
}

function cookScopeFromBody(
    body: Record<string, unknown>,
    capabilities: Awaited<ReturnType<typeof resolveMunchCapabilities>>,
): CookScope {
    if (body.scope === undefined || body.scope === "personal") {
        return { type: "personal" };
    }
    if (body.scope !== "household") throw new Error("Invalid cook scope");
    const household = capabilities.household;
    if (!capabilities.householdWrite || !household) {
        throw new Error("Household cook capability is unavailable");
    }
    return { type: "household", householdId: household.householdId };
}

function cookDateValue(value: unknown): string | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    if (typeof value !== "string") throw new Error("Cook date is invalid");
    return value;
}

function cookEventInput(value: unknown): CookEventInput {
    const body = recordValue(value, "Cook event");
    const temperature = (key: string): number | null | undefined => {
        if (body[key] === undefined || body[key] === null || body[key] === "") {
            return body[key] === null ? null : undefined;
        }
        const parsed = Number(body[key]);
        if (!Number.isFinite(parsed))
            throw new Error("Cook temperature is invalid");
        return parsed;
    };
    const unit = (key: string): "F" | "C" | null | undefined => {
        if (body[key] === undefined) return undefined;
        if (body[key] === null || body[key] === "") return null;
        if (body[key] !== "F" && body[key] !== "C")
            throw new Error("Cook temperature unit is invalid");
        return body[key] as "F" | "C";
    };
    if (typeof body.event_type !== "string")
        throw new Error("Cook event type is required");
    return {
        eventType: body.event_type as CookEventInput["eventType"],
        eventAt: typeof body.event_at === "string" ? body.event_at : undefined,
        eventTimezone:
            typeof body.event_timezone === "string"
                ? body.event_timezone
                : undefined,
        timePrecision: body.time_precision as CookEventInput["timePrecision"],
        relativePhrase:
            typeof body.relative_phrase === "string"
                ? body.relative_phrase
                : null,
        setpointTemperature: temperature("setpoint_temperature"),
        setpointUnit: unit("setpoint_unit"),
        ambientTemperature: temperature("ambient_temperature"),
        ambientUnit: unit("ambient_unit"),
        internalTemperature: temperature("internal_temperature"),
        internalUnit: unit("internal_unit"),
        note: typeof body.note === "string" ? body.note : null,
        originalMessage:
            typeof body.original_message === "string"
                ? body.original_message
                : null,
        dishId: typeof body.dish_id === "string" ? body.dish_id : null,
        idempotencyKey:
            typeof body.idempotency_key === "string"
                ? body.idempotency_key
                : undefined,
        correctionOfEventId:
            typeof body.correction_of_event_id === "string"
                ? body.correction_of_event_id
                : null,
    };
}

function cookDishInput(value: unknown): CookDishInput {
    const body = recordValue(value, "Cook dish");
    const name = typeof body.name === "string" ? body.name : "";
    if (!name.trim()) throw new Error("Dish name is required");
    const actualIngredients = body.actual_ingredients;
    if (actualIngredients !== undefined && !Array.isArray(actualIngredients)) {
        throw new Error("Actual ingredients must be an array");
    }
    return {
        name,
        ingredientOrCut:
            typeof body.ingredient_or_cut === "string"
                ? body.ingredient_or_cut
                : null,
        method: typeof body.method === "string" ? body.method : null,
        flavor: typeof body.flavor === "string" ? body.flavor : null,
        equipment: typeof body.equipment === "string" ? body.equipment : null,
        notes: typeof body.notes === "string" ? body.notes : null,
        actualIngredients: actualIngredients as unknown[] | undefined,
        dishId: typeof body.id === "string" ? body.id : undefined,
        recipeId: typeof body.recipe_id === "string" ? body.recipe_id : null,
        recipeRevisionId:
            typeof body.recipe_revision_id === "string"
                ? body.recipe_revision_id
                : null,
    };
}

function jsonField(body: Record<string, unknown>, key: string): unknown {
    const value = body[key];
    if (typeof value !== "string") return value;
    if (!value.trim()) return undefined;
    try {
        return JSON.parse(value);
    } catch {
        throw new Error(`${key} must be valid JSON`);
    }
}

export async function cookRequest(c: Context): Promise<{
    body: Record<string, unknown>;
    photos: CookMediaInput[];
    mediaFailures: CookMediaFailure[];
}> {
    const contentType = c.req.header("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
        return {
            body: recordValue(await c.req.json(), "Cook request"),
            photos: [],
            mediaFailures: [],
        };
    }
    const form = await c.req.raw.formData();
    const body: Record<string, unknown> = {};
    for (const [key, value] of form.entries()) {
        if (typeof value === "string") body[key] = value;
    }
    for (const key of [
        "dishes",
        "events",
        "setup_snapshot",
        "characteristics",
        "ai_suggestions",
        "recipe",
    ]) {
        if (body[key] !== undefined) body[key] = jsonField(body, key);
    }
    const photos: CookMediaInput[] = [];
    const mediaFailures: CookMediaFailure[] = [];
    for (const value of form.getAll("photos")) {
        if (!(value instanceof File)) continue;
        // Browsers include an unnamed empty File for an unselected file input.
        if (!value.name && value.size === 0) continue;
        try {
            const bytes = new Uint8Array(await value.arrayBuffer());
            const photo = validateCookMediaUpload({
                bytes,
                mimeType: normalizeCookMediaMimeType(value.type),
                fileName: value.name,
            });
            photos.push(photo);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Photo upload failed";
            mediaFailures.push({
                fileName: value.name || undefined,
                code: /too large/i.test(message)
                    ? "too_large"
                    : /empty/i.test(message)
                      ? "empty"
                      : "invalid_type",
                message,
            });
        }
    }
    return { body, photos, mediaFailures };
}

export function resolveCookUpdateTimezone(
    requestedTimezone: unknown,
    cookTimezone: string,
): string {
    return typeof requestedTimezone === "string" &&
        validateTz(requestedTimezone)
        ? requestedTimezone
        : cookTimezone;
}

function cookEventsFromBody(
    body: Record<string, unknown>,
    message: string | undefined,
    submittedAt: string | undefined,
    timezone: string,
): CookEventInput[] {
    const rawEvents = jsonField(body, "events");
    if (Array.isArray(rawEvents)) return rawEvents.map(cookEventInput);
    if (!message) return [];
    return parseNaturalCookUpdate(message, submittedAt, timezone).events;
}

function cookDishesFromBody(
    body: Record<string, unknown>,
): CookDishInput[] | undefined {
    const rawDishes = jsonField(body, "dishes");
    if (rawDishes === undefined || rawDishes === null || rawDishes === "")
        return undefined;
    if (!Array.isArray(rawDishes))
        throw new Error("Cook dishes must be an array");
    return rawDishes.map(cookDishInput);
}

function cookPhotosFromBody(
    photos: CookMediaInput[],
    body: Record<string, unknown>,
): CookMediaInput[] {
    const dishId = typeof body.dish_id === "string" ? body.dish_id : null;
    const eventId = typeof body.event_id === "string" ? body.event_id : null;
    return photos.map((photo) => ({
        ...photo,
        dishId: photo.dishId ?? dishId,
        eventId: photo.eventId ?? eventId,
    }));
}

function mealType(value: unknown) {
    if (
        value === "breakfast" ||
        value === "lunch" ||
        value === "dinner" ||
        value === "snack"
    ) {
        return value;
    }
    throw new Error("Invalid meal type");
}

function structuredSourceType(value: unknown) {
    if (
        value === "usda" ||
        value === "open_food_facts" ||
        value === "published_restaurant" ||
        value === "saved_food" ||
        value === "past_meal" ||
        value === "user_supplied" ||
        value === "model_estimate" ||
        value === "legacy_aggregate"
    ) {
        return value;
    }
    throw new Error("Invalid food source type");
}

function recipeSourceType(value: unknown): RecipeInput["sourceType"] {
    if (
        value === "user_entered" ||
        value === "chatgpt_generated" ||
        value === "imported"
    ) {
        return value;
    }
    throw new Error("Invalid recipe source type");
}

function recipeIngredientSourceType(
    value: unknown,
): RecipeInput["ingredients"][number]["sourceType"] {
    if (
        value === "usda" ||
        value === "open_food_facts" ||
        value === "published_restaurant" ||
        value === "saved_food" ||
        value === "past_meal" ||
        value === "user_supplied" ||
        value === "model_estimate"
    ) {
        return value;
    }
    throw new Error("Invalid recipe ingredient source type");
}

function recordValue(value: unknown, label: string): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error(`${label} must be an object`);
    }
    return value as Record<string, unknown>;
}

function draftExpectedVersion(body: Record<string, unknown>): number {
    const value = Number(body.expected_version);
    if (!Number.isInteger(value) || value < 1) {
        throw new Error("Meal draft expected_version is required");
    }
    return value;
}

function draftText(
    body: Record<string, unknown>,
    key: string,
    maxLength: number,
): string | null | undefined {
    const value = body[key];
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== "string" || value.trim().length > maxLength) {
        throw new Error(`Meal draft ${key} is invalid`);
    }
    return value.trim() || null;
}

export function recipeInputFromBody(value: unknown): RecipeInput {
    const body = recordValue(value, "Recipe");
    const name = typeof body.name === "string" ? body.name : "";
    const servings = positiveNumber(body.servings);
    const instructions = Array.isArray(body.instructions)
        ? body.instructions.filter(
              (item): item is string => typeof item === "string",
          )
        : [];
    if (
        !servings ||
        !name.trim() ||
        instructions.length !==
            (body.instructions as unknown[] | undefined)?.length
    ) {
        throw new Error("Recipe name, servings, and instructions are required");
    }
    if (!Array.isArray(body.ingredients)) {
        throw new Error("Recipe ingredients are required");
    }
    return {
        name,
        servings,
        description:
            typeof body.description === "string" ? body.description : undefined,
        instructions,
        preparationMinutes:
            body.preparation_minutes === undefined
                ? undefined
                : nonnegativeNumber(body.preparation_minutes),
        cookingMinutes:
            body.cooking_minutes === undefined
                ? undefined
                : nonnegativeNumber(body.cooking_minutes),
        sourceType: recipeSourceType(body.source_type),
        sourceTitle:
            typeof body.source_title === "string"
                ? body.source_title
                : undefined,
        sourceUrl:
            typeof body.source_url === "string" ? body.source_url : undefined,
        ingredients: body.ingredients.map((raw) => {
            const ingredient = recordValue(raw, "Recipe ingredient");
            const quantity =
                ingredient.quantity === undefined
                    ? undefined
                    : positiveNumber(ingredient.quantity);
            const gramWeight =
                ingredient.gram_weight === undefined
                    ? undefined
                    : positiveNumber(ingredient.gram_weight);
            const confidence =
                ingredient.confidence === undefined
                    ? undefined
                    : Number(ingredient.confidence);
            if (
                typeof ingredient.name !== "string" ||
                (confidence !== undefined &&
                    (!Number.isFinite(confidence) ||
                        confidence < 0 ||
                        confidence > 1))
            ) {
                throw new Error("Recipe ingredient fields are invalid");
            }
            const sourceSnapshot =
                ingredient.source_snapshot &&
                typeof ingredient.source_snapshot === "object" &&
                !Array.isArray(ingredient.source_snapshot)
                    ? (ingredient.source_snapshot as Record<string, unknown>)
                    : undefined;
            const nutrients =
                ingredient.nutrients &&
                typeof ingredient.nutrients === "object" &&
                !Array.isArray(ingredient.nutrients)
                    ? (ingredient.nutrients as RecipeInput["ingredients"][number]["nutrients"])
                    : undefined;
            return {
                name: ingredient.name,
                quantity,
                unit:
                    typeof ingredient.unit === "string"
                        ? ingredient.unit
                        : undefined,
                preparation:
                    typeof ingredient.preparation === "string"
                        ? ingredient.preparation
                        : undefined,
                optional:
                    typeof ingredient.optional === "boolean"
                        ? ingredient.optional
                        : undefined,
                gramWeight,
                nutrients,
                provider:
                    typeof ingredient.provider === "string"
                        ? ingredient.provider
                        : undefined,
                providerFoodId:
                    typeof ingredient.provider_food_id === "string"
                        ? ingredient.provider_food_id
                        : undefined,
                sourceType: recipeIngredientSourceType(ingredient.source_type),
                sourceUrl:
                    typeof ingredient.source_url === "string"
                        ? ingredient.source_url
                        : undefined,
                confidence,
                sourceSnapshot,
            };
        }),
    };
}

export function recipeComposeInputFromBody(value: unknown): {
    recipe: RecipeInput;
    plannedDate: string;
    mealSlot?: "breakfast" | "lunch" | "dinner" | "snack";
    plannedServings: number;
    note?: string;
    groceryItems: GroceryItemInput[];
} {
    const body = recordValue(value, "Recipe compose");
    const plannedDate =
        typeof body.planned_date === "string" ? body.planned_date : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(plannedDate)) {
        throw new Error("Planned date is required");
    }
    const plannedServings = positiveNumber(body.planned_servings);
    if (!plannedServings) throw new Error("Planned servings are required");
    const mealSlot =
        body.meal_slot === undefined ||
        body.meal_slot === null ||
        body.meal_slot === ""
            ? undefined
            : mealType(body.meal_slot);
    const rawGroceryItems = body.grocery_items_needed;
    if (rawGroceryItems !== undefined && !Array.isArray(rawGroceryItems)) {
        throw new Error("Grocery items needed must be an array");
    }
    if (Array.isArray(rawGroceryItems) && rawGroceryItems.length > 100) {
        throw new Error("Too many grocery items needed");
    }
    return {
        recipe: recipeInputFromBody(body.recipe),
        plannedDate,
        mealSlot,
        plannedServings,
        note: groceryText(body.note, "Recipe planning note", 500),
        groceryItems: (rawGroceryItems ?? []).map(groceryItemInputFromBody),
    };
}

function recipeScopeForCapabilities(
    recipe: NonNullable<Awaited<ReturnType<typeof getRecipe>>>,
    capabilities: Awaited<ReturnType<typeof resolveMunchCapabilities>>,
    write: boolean,
    planning = false,
): PlanningScope {
    if (recipe.ownership.type === "personal") {
        const allowed = planning
            ? write
                ? capabilities.personalPlanningWrite
                : capabilities.personalPlanningRead
            : write
              ? capabilities.personalRecipesWrite
              : capabilities.personalRecipesRead;
        if (!allowed)
            throw new Error("Personal recipe capability is unavailable");
        return { type: "personal" };
    }
    const household = capabilities.household;
    const allowed = planning
        ? write
            ? capabilities.householdWrite
            : capabilities.householdRead
        : write
          ? capabilities.householdWrite
          : capabilities.householdRead;
    if (
        !allowed ||
        !household ||
        household.householdId !== recipe.ownership.household_id
    ) {
        throw new Error("Household recipe capability is unavailable");
    }
    return { type: "household", householdId: household.householdId };
}

function recipeScopeForCreation(
    body: Record<string, unknown>,
    capabilities: Awaited<ReturnType<typeof resolveMunchCapabilities>>,
): PlanningScope {
    const requestedScope = body.scope ?? "personal";
    if (requestedScope === "personal") {
        if (!capabilities.personalRecipesWrite) {
            throw new Error("Personal recipe capability is unavailable");
        }
        return { type: "personal" };
    }
    if (requestedScope !== "household") {
        throw new Error("Invalid recipe scope");
    }
    const household = capabilities.household;
    if (!capabilities.householdWrite || !household) {
        throw new Error("Household recipe capability is unavailable");
    }
    return { type: "household", householdId: household.householdId };
}

function groceryText(
    value: unknown,
    label: string,
    maxLength: number,
): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== "string" || value.trim().length > maxLength) {
        throw new Error(`${label} is invalid`);
    }
    return value.trim() || undefined;
}

function groceryQuantity(value: unknown): number | null {
    if (value === null || value === "") return null;
    const parsed = positiveNumber(value);
    if (parsed === undefined)
        throw new Error("Grocery item quantity is invalid");
    return parsed;
}

function groceryItemInputFromBody(value: unknown): GroceryItemInput {
    const body = recordValue(value, "Grocery item");
    const name = groceryText(body.name, "Grocery item name", 300);
    if (!name) throw new Error("Grocery item name is required");
    const quantity =
        body.quantity === undefined
            ? undefined
            : groceryQuantity(body.quantity);
    return {
        name,
        quantity: quantity === null ? undefined : quantity,
        unit: groceryText(body.unit, "Grocery item unit", 80),
        note: groceryText(body.note, "Grocery item note", 500),
        foodProvider: groceryText(
            body.food_provider,
            "Grocery food provider",
            80,
        ),
        providerFoodId: groceryText(
            body.provider_food_id,
            "Grocery provider food ID",
            300,
        ),
        sourceRecipeId: groceryText(
            body.source_recipe_id,
            "Grocery recipe source",
            100,
        ),
        sourceRecipeRevisionId: groceryText(
            body.source_recipe_revision_id,
            "Grocery recipe revision source",
            100,
        ),
        sourcePlannedMealId: groceryText(
            body.source_planned_meal_id,
            "Grocery plan source",
            100,
        ),
        idempotencyKey: groceryText(
            body.idempotency_key,
            "Grocery idempotency key",
            255,
        ),
    };
}

function planningScopeFromBody(
    body: Record<string, unknown>,
    capabilities: Awaited<ReturnType<typeof resolveMunchCapabilities>>,
    write: boolean,
): PlanningScope {
    if (body.scope !== "personal" && body.scope !== "household") {
        throw new Error("Grocery scope is required");
    }
    return requirePlanningScope(body.scope, capabilities, write);
}

function groceryExpectedVersion(body: Record<string, unknown>): number {
    const value = Number(body.expected_version);
    if (!Number.isInteger(value) || value < 1) {
        throw new Error("Grocery item expected_version is required");
    }
    return value;
}

const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;
const MAX_IMPORT_PARSED_ROWS = 50_000;

function importText(
    value: unknown,
    label: string,
    maxLength: number,
): string | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    if (typeof value !== "string" || value.length > maxLength) {
        throw new Error(`Import ${label} is invalid`);
    }
    return value;
}

function importNumber(value: unknown, label: string): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`Import ${label} is invalid`);
    return parsed;
}

function importRowFromBody(value: unknown): ImportRow {
    const body = recordValue(value, "Import row");
    const sourceLine = Number(body.source_line);
    if (!Number.isInteger(sourceLine) || sourceLine < 1) {
        throw new Error("Import source_line is invalid");
    }
    return {
        source_line: sourceLine,
        description: importText(body.description, "description", 2_000),
        logged_at: importText(body.logged_at, "logged_at", 100),
        meal_type: importText(body.meal_type, "meal_type", 80),
        calories: importNumber(body.calories, "calories"),
        protein_g: importNumber(body.protein_g, "protein_g"),
        carbs_g: importNumber(body.carbs_g, "carbs_g"),
        fat_g: importNumber(body.fat_g, "fat_g"),
        fiber_g: importNumber(body.fiber_g, "fiber_g"),
        sugar_g: importNumber(body.sugar_g, "sugar_g"),
        alcohol_g: importNumber(body.alcohol_g, "alcohol_g"),
        notes: importText(body.notes, "notes", 4_000),
        client_row_id: importText(body.client_row_id, "client_row_id", 255),
    };
}

function importArgsFromBody(value: unknown): BulkImportArgs {
    const body = recordValue(value, "Import");
    if (!Array.isArray(body.meals)) {
        throw new Error("Import meals are required");
    }
    if (body.meals.length === 0 || body.meals.length > MAX_ROWS_PER_CALL) {
        throw new Error(
            `Import requests must carry 1 to ${MAX_ROWS_PER_CALL} rows`,
        );
    }
    const expectedRowCount = Number(body.expected_row_count);
    if (!Number.isInteger(expectedRowCount) || expectedRowCount < 0) {
        throw new Error("Import expected_row_count is invalid");
    }
    const onError = body.on_error ?? "continue";
    if (onError !== "continue" && onError !== "abort") {
        throw new Error("Import on_error is invalid");
    }
    const unmapped = Array.isArray(body.unmapped_columns)
        ? body.unmapped_columns.map((column) =>
              importText(column, "unmapped column", 120),
          )
        : [];
    if (unmapped.some((column) => column === undefined)) {
        throw new Error("Import unmapped column is invalid");
    }
    const rowsSkipped = importNumber(body.rows_skipped, "rows_skipped");
    if (
        rowsSkipped !== undefined &&
        (!Number.isInteger(rowsSkipped) || rowsSkipped < 0)
    ) {
        throw new Error("Import rows_skipped is invalid");
    }
    return {
        meals: body.meals.map(importRowFromBody),
        expected_row_count: expectedRowCount,
        expected_total_kcal: importNumber(
            body.expected_total_kcal,
            "expected_total_kcal",
        ),
        dry_run: body.dry_run === true,
        on_error: onError,
        rows_skipped: rowsSkipped,
        unmapped_columns: unmapped as string[],
        source_app: importText(body.source_app, "source_app", 120),
    };
}

const STRUCTURED_NUTRIENT_FIELDS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "alcohol_g",
] as const;

export function createAppRouter(): Hono {
    const app = new Hono();

    app.get("/app.js", async (c) =>
        c.body(await Bun.file("./public/app.js").text(), 200, {
            "Content-Type": "text/javascript; charset=utf-8",
            "Cache-Control": "no-cache",
        }),
    );
    app.get("/ads-policy.js", async (c) =>
        c.body(await Bun.file("./public/ads-policy.js").text(), 200, {
            "Content-Type": "text/javascript; charset=utf-8",
            "Cache-Control": "no-cache",
        }),
    );
    app.get("/app-api.js", async (c) =>
        c.body(await Bun.file("./public/app-api.js").text(), 200, {
            "Content-Type": "text/javascript; charset=utf-8",
            "Cache-Control": "no-cache",
        }),
    );
    app.get("/weight-display.js", async (c) =>
        c.body(await Bun.file("./public/weight-display.js").text(), 200, {
            "Content-Type": "text/javascript; charset=utf-8",
            "Cache-Control": "no-cache",
        }),
    );
    app.get("/app-account.js", async (c) =>
        c.body(await Bun.file("./public/app-account.js").text(), 200, {
            "Content-Type": "text/javascript; charset=utf-8",
            "Cache-Control": "no-cache",
        }),
    );
    app.get("/photo-capture.js", async (c) =>
        c.body(await Bun.file("./public/photo-capture.js").text(), 200, {
            "Content-Type": "text/javascript; charset=utf-8",
            "Cache-Control": "no-cache",
        }),
    );
    app.get("/feature-nav.js", async (c) =>
        c.body(await Bun.file("./public/feature-nav.js").text(), 200, {
            "Content-Type": "text/javascript; charset=utf-8",
            "Cache-Control": "no-cache",
        }),
    );
    app.get("/account-settings.css", async (c) =>
        c.body(await Bun.file("./public/account-settings.css").text(), 200, {
            "Content-Type": "text/css; charset=utf-8",
            "Cache-Control": "no-cache",
        }),
    );
    app.get("/app", async (c) =>
        c.html(await Bun.file("./public/app.html").text(), 200, {
            "Cache-Control": "no-store, private",
        }),
    );
    app.get("/app/*", async (c) =>
        c.html(await Bun.file("./public/app.html").text(), 200, {
            "Cache-Control": "no-store, private",
        }),
    );

    app.use("/api/app/*", requireWebSession);

    app.get("/api/app/bootstrap", async (c) =>
        privateJson(
            c,
            await getAppBootstrap(
                c.get("munchUserId"),
                c.get("munchUserEmail"),
                capabilitySurfaceFromRequest(c),
            ),
        ),
    );

    app.get("/api/app/today", async (c) =>
        privateJson(
            c,
            await getTodayWorkspace(
                c.get("munchUserId"),
                requiredQuery(c.req.query("date"), "date"),
                capabilitySurfaceFromRequest(c),
            ),
        ),
    );

    // Today-navigation calendar: the month summary behind the header
    // calendar's data dots — one request per visible month.
    app.get("/api/app/calendar/month", async (c) =>
        privateJson(
            c,
            await getCalendarMonthSummary(
                c.get("munchUserId"),
                requiredQuery(c.req.query("month"), "month"),
            ),
        ),
    );

    app.get("/api/app/meals", async (c) =>
        privateJson(
            c,
            await getMealHistoryWorkspace(
                c.get("munchUserId"),
                requiredQuery(c.req.query("start"), "start"),
                requiredQuery(c.req.query("end"), "end"),
                { query: c.req.query("q") },
            ),
        ),
    );

    app.post("/api/app/meals", requireSameOrigin, async (c) => {
        const body = recordValue(await c.req.json(), "Meal");
        if (!Array.isArray(body.items)) {
            throw new Error("Meal items are required");
        }
        const result = await createAppMeal(c.get("munchUserId"), {
            description: body.description,
            mealType: body.meal_type,
            loggedAt: body.logged_at,
            notes: body.notes,
            idempotencyKey: body.idempotency_key,
            items: body.items.map((item) => recordValue(item, "Meal item")),
        });
        return privateJson(c, {
            meal: result.meal,
            deduplicated: result.deduplicated,
        });
    });

    app.post("/api/app/import/parse", requireSameOrigin, async (c) => {
        const form = await c.req.parseBody();
        const uploaded = form.file;
        if (
            !uploaded ||
            typeof uploaded !== "object" ||
            typeof (uploaded as File).arrayBuffer !== "function"
        ) {
            throw new Error("Import CSV file is required");
        }
        const file = uploaded as File;
        if (file.size > MAX_IMPORT_FILE_BYTES) {
            throw new Error("Import file is too large (maximum 10 MB)");
        }
        const table = parseCsv(new Uint8Array(await file.arrayBuffer()));
        if (!table.headers.length || !table.rows.length) {
            throw new Error("Import file does not contain any meal rows");
        }
        if (table.rows.length > MAX_IMPORT_PARSED_ROWS) {
            throw new Error(
                `Import file contains too many rows (maximum ${MAX_IMPORT_PARSED_ROWS.toLocaleString()})`,
            );
        }
        return privateJson(c, {
            fileName: file.name,
            table: {
                headers: table.headers,
                rows: table.rows,
                sourceLines: table.sourceLines,
                delimiter: table.delimiter,
                decimalSeparator: table.decimalSeparator,
                encoding: table.encoding,
                skippedTotalsRows: table.skippedTotalsRows,
                skippedBlankRows: table.skippedBlankRows,
                warnings: table.warnings,
            },
        });
    });

    app.post("/api/app/import", requireSameOrigin, async (c) => {
        const result = await runUserImport(
            c.get("munchUserId"),
            importArgsFromBody(await c.req.json()),
        );
        return privateJson(c, serializeImportResult(result));
    });

    app.get("/api/app/meals/:id", async (c) => {
        const meal = await getStructuredMeal(
            c.get("munchUserId"),
            c.req.param("id")!,
        );
        if (!meal) throw new Error("Meal not found");
        return privateJson(c, { meal });
    });

    app.get("/api/app/foods", async (c) =>
        privateJson(
            c,
            await getFoodsWorkspace(
                c.get("munchUserId"),
                capabilitySurfaceFromRequest(c),
            ),
        ),
    );

    app.post("/api/app/foods", requireSameOrigin, async (c) => {
        const body = recordValue(await c.req.json(), "Saved food");
        const candidateId =
            typeof body.candidate_id === "string"
                ? body.candidate_id.trim()
                : "";
        const label = typeof body.label === "string" ? body.label.trim() : "";
        if (!candidateId || candidateId.length > 300) {
            throw new Error("Food candidate ID is required");
        }
        if (!label || label.length > 200) {
            throw new Error("Saved food label is required");
        }
        let defaultPortionId: string | undefined;
        if (
            body.default_portion_id !== undefined &&
            body.default_portion_id !== null &&
            body.default_portion_id !== ""
        ) {
            if (
                typeof body.default_portion_id !== "string" ||
                body.default_portion_id.length > 200
            ) {
                throw new Error("Saved food portion is invalid");
            }
            defaultPortionId = body.default_portion_id;
        }
        const userId = c.get("munchUserId");
        const candidate = await getFoodSearchService().details(candidateId);
        if (!candidate) {
            throw new Error(
                "Food candidate is invalid or expired; search again before saving",
            );
        }
        const saved = await saveFood({
            userId,
            label,
            food: candidate,
            defaultPortionId,
        });
        return privateJson(c, {
            saved_food: serializeSavedFood(saved),
        });
    });

    app.delete("/api/app/foods/:id", requireSameOrigin, async (c) => {
        const deleted = await deleteSavedFood(
            c.get("munchUserId"),
            c.req.param("id")!,
        );
        return privateJson(c, { deleted });
    });

    app.post("/api/app/foods/:id/used", requireSameOrigin, async (c) => {
        const updated = await markSavedFoodUsed(
            c.get("munchUserId"),
            c.req.param("id")!,
        );
        return privateJson(c, { updated });
    });

    app.get("/api/app/food-search", async (c) =>
        privateJson(
            c,
            await searchAppFoods(
                c.get("munchUserId"),
                c.req.query("query") ?? c.req.query("q") ?? "",
                optionalLimit(c.req.query("limit")),
            ),
        ),
    );

    app.get("/api/app/food-details", async (c) => {
        const candidateId = requiredQuery(
            c.req.query("candidate_id"),
            "candidate_id",
        );
        const food = await getAppFoodDetails(candidateId);
        if (!food) throw new Error("Food candidate not found");
        return privateJson(c, { food });
    });

    app.get("/api/app/food-barcode", async (c) =>
        privateJson(
            c,
            await lookupAppFoodBarcode(
                requiredQuery(c.req.query("barcode"), "barcode"),
            ),
        ),
    );

    app.post("/api/app/meal-drafts", requireSameOrigin, async (c) => {
        const draft = await createMealDraft({
            userId: c.get("munchUserId"),
            ...mealDraftInputFromBody(await c.req.json()),
        });
        return privateJson(c, {
            draft: serializeMealDraftForApp(draft),
        });
    });

    app.get("/api/app/meal-drafts/:id", async (c) => {
        const draft = await getMealDraft(
            c.get("munchUserId"),
            c.req.param("id")!,
        );
        if (!draft) throw new Error("Meal draft not found");
        return privateJson(c, { draft: await enrichMealDraftForApp(draft) });
    });

    app.patch("/api/app/meal-drafts/:id", requireSameOrigin, async (c) => {
        const body = recordValue(await c.req.json(), "Meal draft");
        const draft = await updateMealDraftMetadata({
            userId: c.get("munchUserId"),
            draftId: c.req.param("id")!,
            expectedVersion: draftExpectedVersion(body),
            mealType:
                body.meal_type === undefined
                    ? undefined
                    : body.meal_type === null
                      ? null
                      : mealType(body.meal_type),
            description: draftText(body, "description", 2_000),
            loggedAt: draftText(body, "logged_at", 100),
            notes: draftText(body, "notes", 4_000),
        });
        return privateJson(c, {
            draft: serializeMealDraftForApp(draft),
        });
    });

    app.post("/api/app/meal-drafts/:id/items", requireSameOrigin, async (c) => {
        const body = recordValue(await c.req.json(), "Meal draft item");
        const userId = c.get("munchUserId");
        const draftId = c.req.param("id")!;
        const current = await getMealDraft(userId, draftId);
        if (!current) throw new Error("Meal draft not found");
        const rawItem = body.item === undefined ? body : body.item;
        const item =
            rawItem &&
            typeof rawItem === "object" &&
            !Array.isArray(rawItem) &&
            ("candidate_id" in rawItem || "saved_food_id" in rawItem)
                ? await resolveWebMealItem(userId, rawItem)
                : draftItemInputFromBody(rawItem);
        const draft = await upsertMealDraftItem({
            userId,
            draftId,
            expectedVersion: draftExpectedVersion(body),
            position: current.items.length,
            item,
        });
        return privateJson(c, {
            draft: await enrichMealDraftForApp(draft),
        });
    });

    app.patch(
        "/api/app/meal-drafts/:draftId/items/:itemId",
        requireSameOrigin,
        async (c) => {
            const body = recordValue(await c.req.json(), "Meal draft item");
            const userId = c.get("munchUserId");
            const draftId = c.req.param("draftId")!;
            const current = await getMealDraft(userId, draftId);
            if (!current) throw new Error("Meal draft not found");
            const currentItem = current.items.find(
                (item) => item.id === c.req.param("itemId"),
            );
            if (!currentItem) throw new Error("Meal draft item not found");
            const rawItem = body.item === undefined ? body : body.item;
            const item = draftItemInputFromBody(rawItem);
            const draft = await upsertMealDraftItem({
                userId,
                draftId,
                expectedVersion: draftExpectedVersion(body),
                position: currentItem.position,
                item,
            });
            return privateJson(c, {
                draft: await enrichMealDraftForApp(draft),
            });
        },
    );

    app.delete(
        "/api/app/meal-drafts/:draftId/items/:itemId",
        requireSameOrigin,
        async (c) => {
            const body = recordValue(
                await c.req.json().catch(() => ({})),
                "Meal draft item delete",
            );
            const draft = await deleteMealDraftItem({
                userId: c.get("munchUserId"),
                draftId: c.req.param("draftId")!,
                itemId: c.req.param("itemId")!,
                expectedVersion: draftExpectedVersion(body),
            });
            return privateJson(c, {
                draft: serializeMealDraftForApp(draft),
            });
        },
    );

    // Conversational add-to-draft for the photo flow (Amendment E
    // item 3): one free-text field on the photo draft's review —
    // "Anything else to add?" Deterministic parse first, Ember
    // fallback second, then the SAME grounding path as photo items;
    // low confidence becomes a draft question or an honest no-add,
    // never a silent add. Confirm-before-save is untouched.
    app.post(
        "/api/app/meal-drafts/:id/add-text",
        requireSameOrigin,
        async (c) => {
            const body = recordValue(await c.req.json(), "Meal draft add text");
            if (typeof body.text !== "string" || !body.text.trim()) {
                throw new Error("Meal draft add text is required");
            }
            const userId = c.get("munchUserId");
            const draftId = c.req.param("id")!;
            const current = await getMealDraft(userId, draftId);
            if (!current) throw new Error("Meal draft not found");
            if (current.sourceMode !== "photo") {
                return privateJsonStatus(
                    c,
                    {
                        error: "draft_add_text_photo_only",
                        message:
                            "This quick add is only for photo drafts. Use the structured add for other drafts.",
                        draft: serializeMealDraftForApp(current),
                    },
                    400,
                );
            }
            if (current.version !== draftExpectedVersion(body)) {
                throw new Error(
                    `Meal draft changed: expected version ${draftExpectedVersion(body)}, current version ${current.version}`,
                );
            }
            const visionConfig = mealPhotoVisionConfig();
            const foodSearch = getFoodSearchService();
            const outcome = await addTextToPhotoDraft({
                userId,
                draft: current,
                text: body.text,
                deps: {
                    search: (query, limit) => foodSearch.search(query, limit),
                    ...(visionConfig
                        ? {
                              chooseCandidates: (requests) =>
                                  chooseMealPhotoCandidates(
                                      requests,
                                      visionConfig,
                                  ),
                              estimateNutrients: (requests) =>
                                  estimateMealPhotoNutrients(
                                      requests,
                                      visionConfig,
                                  ),
                              parseWithModel: (text, context) =>
                                  parseDraftAddTextWithModel(
                                      text,
                                      visionConfig,
                                      {},
                                      context,
                                  ),
                          }
                        : {}),
                },
            });
            return privateJson(c, {
                draft: serializeMealDraftForApp(outcome.draft),
                add: {
                    status: outcome.status,
                    message: outcome.message,
                    ...(outcome.status === "added"
                        ? {
                              parse_source: outcome.parseSource,
                              added_items: outcome.added.map((entry) => ({
                                  name: entry.draftItem.name,
                                  source_type: entry.draftItem.sourceType,
                                  grounding_source: entry.groundingSource,
                                  assumptions: entry.draftItem.assumptions,
                              })),
                              replaced_item: outcome.replacedItemName,
                              preparation: outcome.preparation,
                          }
                        : outcome.status === "updated"
                          ? {
                                parse_source: outcome.parseSource,
                                preparation: outcome.preparation,
                            }
                          : outcome.status === "question"
                            ? { parse_source: outcome.parseSource }
                            : {}),
                },
            });
        },
    );

    app.post(
        "/api/app/meal-drafts/:draftId/questions/:questionId/answer",
        requireSameOrigin,
        async (c) => {
            const body = recordValue(
                await c.req.json(),
                "Meal draft question answer",
            );
            if (typeof body.answer !== "string" || !body.answer.trim()) {
                throw new Error("Meal draft answer is required");
            }
            const draft = await answerMealDraftQuestion({
                userId: c.get("munchUserId"),
                draftId: c.req.param("draftId")!,
                expectedVersion: draftExpectedVersion(body),
                questionId: c.req.param("questionId")!,
                answer: body.answer,
            });
            return privateJson(c, {
                draft: serializeMealDraftForApp(draft),
            });
        },
    );

    app.post(
        "/api/app/meal-drafts/:id/prepare",
        requireSameOrigin,
        async (c) => {
            const body = recordValue(await c.req.json(), "Meal draft prepare");
            const draft = await prepareMealDraftConfirmation({
                userId: c.get("munchUserId"),
                draftId: c.req.param("id")!,
                expectedVersion: draftExpectedVersion(body),
                acceptRemainingAssumptions:
                    body.accept_remaining_assumptions === true,
            });
            return privateJson(c, {
                draft: serializeMealDraftForApp(draft),
            });
        },
    );

    app.post(
        "/api/app/meal-drafts/:id/confirm",
        requireSameOrigin,
        async (c) => {
            const body = recordValue(await c.req.json(), "Meal draft confirm");
            if (body.confirmed !== true) {
                throw new Error("Meal draft confirmation is required");
            }
            const userId = c.get("munchUserId");
            const draftId = c.req.param("id")!;
            let current = await getMealDraft(userId, draftId);
            if (!current) throw new Error("Meal draft not found");
            if (
                current.status !== "awaiting_confirmation" ||
                current.questions.some((question) => question.status === "open")
            ) {
                current = await prepareMealDraftConfirmation({
                    userId,
                    draftId,
                    expectedVersion: draftExpectedVersion(body),
                    acceptRemainingAssumptions:
                        body.accept_remaining_assumptions === true,
                });
            } else if (current.version !== draftExpectedVersion(body)) {
                throw new Error(
                    `Meal draft changed: expected version ${draftExpectedVersion(body)}, current version ${current.version}`,
                );
            }
            const draft = await confirmMealDraft({
                userId,
                draftId,
                expectedVersion: current.version,
                confirmed: true,
            });
            return privateJson(c, {
                draft: serializeMealDraftForApp(draft),
                meal_id: draft.confirmedMealId,
            });
        },
    );

    app.post(
        "/api/app/meal-drafts/:id/cancel",
        requireSameOrigin,
        async (c) => {
            const body = recordValue(await c.req.json(), "Meal draft cancel");
            if (body.confirm !== true) {
                throw new Error("Meal draft cancellation is required");
            }
            const draft = await cancelMealDraft({
                userId: c.get("munchUserId"),
                draftId: c.req.param("id")!,
                expectedVersion: draftExpectedVersion(body),
            });
            return privateJson(c, {
                draft: serializeMealDraftForApp(draft),
            });
        },
    );

    // S8 chat agent (Amendment D; v2 per the chat-v2 brief): the ONE
    // Premium-gated AI surface. The gate is enforced server-side in
    // src/chat/service.ts against the merged rail-neutral Premium
    // snapshot (Stripe / Google Play / App Store), fail-closed on
    // lookup errors. Free accounts get the honest Premium explanation
    // and the website subscribe door — no pricing or purchase UI is
    // initiated from this surface, and packaged builds manage billing
    // through their rail's own door (Settings → Plan & billing)
    // exactly like S6 slice 9. v2: the agent works through the MCP
    // tool surface in-process (src/chat/), writes are draft-class
    // only, and conversations are reached from the four contextual
    // surface entries — there is no global chat entry.
    app.get("/api/app/chat", async (c) => {
        const conversationId = c.req.query("conversation_id");
        const state = await getChatState(c.get("munchUserId"), {
            conversationId: conversationId || undefined,
        });
        if (!state.premium) {
            return privateJsonStatus(c, state.body, state.status);
        }
        return privateJson(c, {
            premium: true,
            conversation: state.conversation,
            messages: state.messages,
            seed: state.seed,
        });
    });

    app.post("/api/app/chat/conversations", requireSameOrigin, async (c) => {
        // Chat v2 placement: a conversation may be opened from one of
        // the four contextual entry surfaces; the surface seeds it.
        const rawBody: unknown = await c.req.json().catch(() => null);
        const surfaceValue =
            rawBody && typeof rawBody === "object"
                ? (rawBody as { surface?: unknown }).surface
                : undefined;
        const surface: ChatEntrySurface | undefined = isChatEntrySurface(
            surfaceValue,
        )
            ? surfaceValue
            : undefined;
        const started = await startChatConversation(c.get("munchUserId"), {
            surface,
        });
        if (!started.premium) {
            return privateJsonStatus(c, started.body, started.status);
        }
        return privateJson(c, {
            premium: true,
            conversation: started.conversation,
            messages: [],
            seed: started.seed,
        });
    });

    app.post("/api/app/chat/messages", requireSameOrigin, async (c) => {
        const body = recordValue(await c.req.json(), "Chat message");
        const message =
            typeof body.message === "string" ? body.message.trim() : "";
        if (!message || message.length > 4_000) {
            return privateJsonStatus(
                c,
                {
                    error: "chat_message_invalid",
                    message:
                        "Write a message between 1 and 4,000 characters first.",
                },
                400,
            );
        }
        const result = await sendChatMessage({
            userId: c.get("munchUserId"),
            conversationId:
                typeof body.conversation_id === "string"
                    ? body.conversation_id
                    : undefined,
            surface: isChatEntrySurface(body.surface)
                ? body.surface
                : undefined,
            message,
        });
        if (result.status !== "ok") {
            return privateJsonStatus(c, result.body, result.httpStatus);
        }
        return privateJson(c, {
            premium: true,
            conversation: result.conversation,
            user_message: result.userMessage,
            assistant_message: result.assistantMessage,
            draft: result.draft ? serializeMealDraftForApp(result.draft) : null,
        });
    });

    // S3 photo-logging decider pipeline (brief §3). AI features are
    // free for every account (Amendment D): no credits, no meter, no
    // entitlement check at this call site. The photo is processed
    // transiently and never retained, and nothing is logged until the
    // user confirms the draft through the existing confirm path.
    app.post("/api/app/meal-photo", requireSameOrigin, async (c) => {
        // Photo-flow P7: the request is timed phase by phase so the
        // end-to-end latency is attributable — receive (upload +
        // body parse), identify (vision.ts), grounding + draft build
        // (here), request total (here). Before this instrumentation a
        // 15.8 s request showed ~5 s of identified phases and ~10.7 s
        // of unexplained pre-identify time.
        const requestStartedAt = Date.now();
        const userId = c.get("munchUserId");
        const visionConfig = mealPhotoVisionConfig();
        if (!visionConfig) {
            return privateJsonStatus(
                c,
                {
                    error: "meal_photo_unavailable",
                    message:
                        "Photo logging is unavailable right now. Manual entry always works.",
                    manual_entry_available: true,
                },
                503,
            );
        }
        const form = await c.req.parseBody();
        const uploaded = form.file;
        if (
            !uploaded ||
            typeof uploaded !== "object" ||
            typeof (uploaded as File).arrayBuffer !== "function"
        ) {
            return privateJsonStatus(
                c,
                {
                    error: "meal_photo_invalid_image",
                    message: "Choose a meal photo first.",
                    manual_entry_available: true,
                },
                400,
            );
        }
        const file = uploaded as File;
        if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
            return privateJsonStatus(
                c,
                {
                    error: "meal_photo_invalid_image",
                    message: "Meal photo must be JPEG, PNG, or WebP.",
                    manual_entry_available: true,
                },
                400,
            );
        }
        if (file.size < 1 || file.size > 8 * 1024 * 1024) {
            return privateJsonStatus(
                c,
                {
                    error: "meal_photo_invalid_image",
                    message: "Meal photo must be between 1 byte and 8 MB.",
                    manual_entry_available: true,
                },
                400,
            );
        }
        const mealTypeValue =
            typeof form.meal_type === "string" ? form.meal_type : undefined;
        const mealType =
            mealTypeValue === "breakfast" ||
            mealTypeValue === "lunch" ||
            mealTypeValue === "dinner" ||
            mealTypeValue === "snack"
                ? mealTypeValue
                : undefined;
        try {
            const bytes = new Uint8Array(await file.arrayBuffer());
            console.info(
                `[meal_photo] phase=receive status=success bytes=${bytes.byteLength} duration_ms=${Math.max(0, Date.now() - requestStartedAt)}`,
            );
            const vision = await identifyMealPhoto(
                {
                    mimeType: file.type,
                    bytes,
                },
                visionConfig,
            );
            const draftStartedAt = Date.now();
            const foodSearch = getFoodSearchService();
            const result = await createMealPhotoDraft({
                userId,
                vision,
                mealType,
                loggedAt:
                    typeof form.logged_at === "string"
                        ? form.logged_at
                        : undefined,
                groundingDeps: {
                    search: (query, limit) => foodSearch.search(query, limit),
                    chooseCandidates: (requests) =>
                        chooseMealPhotoCandidates(requests, visionConfig),
                    estimateNutrients: (requests) =>
                        estimateMealPhotoNutrients(requests, visionConfig),
                },
            });
            console.info(
                `[meal_photo] phase=draft_build status=success duration_ms=${Math.max(0, Date.now() - draftStartedAt)}`,
            );
            console.info(
                `[meal_photo] phase=request status=success duration_ms=${Math.max(0, Date.now() - requestStartedAt)}`,
            );
            return privateJson(c, {
                draft: serializeMealDraftForApp(result.draft),
                transient_media: true,
                photo_retained: false,
                grounding: {
                    items: result.grounded.length,
                    provider_grounded: result.groundedCount,
                    questions: result.questionCount,
                },
            });
        } catch (error) {
            if (error instanceof MealPhotoNoFoodError) {
                return privateJsonStatus(
                    c,
                    {
                        error: "meal_photo_no_food",
                        message:
                            "We couldn't find food in that photo — it may be too blurry or too dark. Try retaking it closer, or log the meal manually.",
                        retake_available: true,
                        manual_entry_available: true,
                        transient_media: true,
                    },
                    422,
                );
            }
            return privateJsonStatus(
                c,
                {
                    error: "meal_photo_failed",
                    message:
                        "The photo estimate couldn't be completed and nothing was logged. You can try again or log the meal manually.",
                    manual_entry_available: true,
                    transient_media: true,
                },
                502,
            );
        }
    });

    app.get("/api/app/insights", async (c) =>
        privateJson(
            c,
            await getInsightsWorkspace(
                c.get("munchUserId"),
                requiredQuery(c.req.query("start"), "start"),
                requiredQuery(c.req.query("end"), "end"),
            ),
        ),
    );

    // Trends (T1–T14): the dashboard workspace, the per-account layout,
    // and the two drill-down reads (one day's contributors; a period's
    // top foods for a breakdown segment).
    app.get("/api/app/trends", async (c) =>
        privateJson(
            c,
            await getTrendsWorkspace(
                c.get("munchUserId"),
                requiredQuery(c.req.query("start"), "start"),
                requiredQuery(c.req.query("end"), "end"),
            ),
        ),
    );

    app.get("/api/app/trends/layout", async (c) =>
        privateJson(c, {
            layout: await getTrendsDashboardLayout(c.get("munchUserId")),
        }),
    );

    app.put("/api/app/trends/layout", requireSameOrigin, async (c) => {
        const body = recordValue(await c.req.json(), "Trends layout");
        const layout = recordValue(body.layout, "Trends layout");
        if (!Array.isArray(layout.cards)) {
            throw new Error("Trends layout requires a cards array");
        }
        return privateJson(c, {
            layout: await saveTrendsDashboardLayout(
                c.get("munchUserId"),
                layout,
            ),
        });
    });

    // Feature toggles (addendum 10, T1/T5): the account-level module
    // flags. PUT accepts a partial patch of the five module booleans;
    // the "Just logging" preset is simply all five set false.
    app.get("/api/app/features", async (c) =>
        privateJson(c, {
            features: await getFeatureModules(c.get("munchUserId")),
        }),
    );

    app.put("/api/app/features", requireSameOrigin, async (c) => {
        const body = recordValue(await c.req.json(), "Features");
        const patch = featureModulePatch(body.features ?? body);
        if (!patch) {
            throw new Error(
                "Features update requires at least one module flag",
            );
        }
        return privateJson(c, {
            features: await saveFeatureModules(c.get("munchUserId"), patch),
        });
    });

    app.get("/api/app/trends/day", async (c) =>
        privateJson(
            c,
            await getTrendsDayDetail(
                c.get("munchUserId"),
                requiredQuery(c.req.query("date"), "date"),
                requiredQuery(c.req.query("metric"), "metric"),
            ),
        ),
    );

    app.get("/api/app/trends/contributors", async (c) =>
        privateJson(
            c,
            await getTrendsPeriodContributors(
                c.get("munchUserId"),
                requiredQuery(c.req.query("metric"), "metric"),
                requiredQuery(c.req.query("start"), "start"),
                requiredQuery(c.req.query("end"), "end"),
            ),
        ),
    );

    app.get("/api/app/planning", async (c) =>
        privateJson(
            c,
            await getPlanningWorkspace(
                c.get("munchUserId"),
                requiredQuery(c.req.query("start"), "start"),
                requiredQuery(c.req.query("end"), "end"),
                capabilitySurfaceFromRequest(c),
            ),
        ),
    );

    app.post("/api/app/recipes", requireSameOrigin, async (c) => {
        const userId = c.get("munchUserId");
        const body = recordValue(await c.req.json(), "Recipe create");
        const capabilities = await resolveRequestMunchCapabilities(c, userId);
        const result = await saveRecipe({
            userId,
            scope: recipeScopeForCreation(body, capabilities),
            recipe: recipeInputFromBody(body.recipe),
            idempotencyKey:
                typeof body.idempotency_key === "string"
                    ? body.idempotency_key
                    : crypto.randomUUID(),
        });
        return privateJson(c, {
            result,
            recipe: await getRecipe(userId, result.recipeId),
        });
    });

    app.post(
        "/api/app/recipes/import-preview",
        requireSameOrigin,
        async (c) => {
            const userId = c.get("munchUserId");
            const body = recordValue(
                await c.req.json(),
                "Recipe import preview",
            );
            const capabilities = await resolveRequestMunchCapabilities(
                c,
                userId,
            );
            if (
                !capabilities.personalRecipesRead &&
                !capabilities.householdRead
            ) {
                throw new Error("Recipe capability is unavailable");
            }
            const semanticResolver =
                capabilitySurfaceFromRequest(c) === "android"
                    ? undefined
                    : getWebsiteRecipeImportSemanticResolver();
            // The semantic (model) resolver is an AI feature and —
            // like every AI feature — free for every account
            // (Amendment D): no entitlement check and no meter here.
            // When the resolver's normalize call fails the preview
            // service falls back to deterministic matching with a
            // `semantic_ai_unavailable` warning.
            const draft = await previewRecipeUrl(
                typeof body.url === "string" ? body.url : "",
                {
                    rateLimitKey: userId,
                    semanticResolver,
                },
            );
            return privateJson(c, { draft });
        },
    );

    app.post("/api/app/recipes/compose", requireSameOrigin, async (c) => {
        const userId = c.get("munchUserId");
        const body = recordValue(await c.req.json(), "Recipe compose");
        const capabilities = await resolveRequestMunchCapabilities(c, userId);
        const recipeScope = recipeScopeForCreation(body, capabilities);
        const scope = requirePlanningScope(
            recipeScope.type,
            capabilities,
            true,
        );
        const input = recipeComposeInputFromBody(body);
        const result = await saveRecipeAndPlan({
            userId,
            scope,
            ...input,
            idempotencyKey:
                typeof body.idempotency_key === "string"
                    ? body.idempotency_key
                    : crypto.randomUUID(),
        });
        return privateJson(c, {
            result,
            recipe: await getRecipe(userId, result.recipe.recipeId),
        });
    });

    app.get("/api/app/recipes/:id", async (c) => {
        const workspace = await getRecipeWorkspace(
            c.get("munchUserId"),
            c.req.param("id")!,
            c.req.query("revision_id") || undefined,
            capabilitySurfaceFromRequest(c),
        );
        if (!workspace.available || !workspace.recipe) {
            throw new Error("Recipe not found");
        }
        return privateJson(c, { recipe: workspace.recipe });
    });

    app.patch("/api/app/recipes/:id", requireSameOrigin, async (c) => {
        const userId = c.get("munchUserId");
        const current = await getRecipe(userId, c.req.param("id")!);
        if (!current) throw new Error("Recipe not found");
        const body = recordValue(await c.req.json(), "Recipe update");
        const capabilities = await resolveRequestMunchCapabilities(c, userId);
        const expectedVersion = Number(body.expected_version);
        if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
            throw new Error("Recipe expected_version is required");
        }
        const result = await updateRecipe({
            userId,
            scope: recipeScopeForCapabilities(current, capabilities, true),
            recipeId: current.id,
            recipe: recipeInputFromBody(body.recipe),
            expectedVersion,
            idempotencyKey:
                typeof body.idempotency_key === "string"
                    ? body.idempotency_key
                    : crypto.randomUUID(),
        });
        return privateJson(c, {
            result,
            recipe: await getRecipe(userId, current.id),
        });
    });

    app.delete("/api/app/recipes/:id", requireSameOrigin, async (c) => {
        const userId = c.get("munchUserId");
        const current = await getRecipe(userId, c.req.param("id")!);
        if (!current) throw new Error("Recipe not found");
        const body = recordValue(
            await c.req.json().catch(() => ({})),
            "Recipe delete",
        );
        const expectedVersion =
            body.expected_version === undefined
                ? undefined
                : Number(body.expected_version);
        const capabilities = await resolveRequestMunchCapabilities(c, userId);
        const result = await archiveRecipe({
            userId,
            scope: recipeScopeForCapabilities(current, capabilities, true),
            recipeId: current.id,
            expectedVersion,
        });
        return privateJson(c, { recipe: result });
    });

    app.post("/api/app/recipes/:id/log", requireSameOrigin, async (c) => {
        const userId = c.get("munchUserId");
        const current = await getRecipe(userId, c.req.param("id")!);
        if (!current) throw new Error("Recipe not found");
        const body = recordValue(await c.req.json(), "Recipe log");
        const servingsConsumed = positiveNumber(body.servings_consumed);
        if (!servingsConsumed) throw new Error("Serving amount is required");
        const capabilities = await resolveRequestMunchCapabilities(c, userId);
        recipeScopeForCapabilities(current, capabilities, false);
        const result = await logRecipe({
            userId,
            recipeId: current.id,
            recipeRevisionId:
                typeof body.recipe_revision_id === "string"
                    ? body.recipe_revision_id
                    : undefined,
            servingsConsumed,
            mealType: mealType(body.meal_type),
            loggedAt:
                typeof body.logged_at === "string" ? body.logged_at : undefined,
            notes: typeof body.notes === "string" ? body.notes : undefined,
            plannedMealId:
                typeof body.planned_meal_id === "string"
                    ? body.planned_meal_id
                    : undefined,
            idempotencyKey:
                typeof body.idempotency_key === "string"
                    ? body.idempotency_key
                    : crypto.randomUUID(),
        });
        return privateJson(c, { result });
    });

    app.post("/api/app/recipes/:id/plan", requireSameOrigin, async (c) => {
        const userId = c.get("munchUserId");
        const current = await getRecipe(userId, c.req.param("id")!);
        if (!current) throw new Error("Recipe not found");
        const body = recordValue(await c.req.json(), "Recipe plan");
        const plannedDate =
            typeof body.planned_date === "string" ? body.planned_date : "";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(plannedDate)) {
            throw new Error("Planned date is required");
        }
        const servings = positiveNumber(body.servings);
        if (!servings) throw new Error("Planned servings are required");
        const capabilities = await resolveRequestMunchCapabilities(c, userId);
        const result = await scheduleRecipe({
            userId,
            scope: recipeScopeForCapabilities(
                current,
                capabilities,
                true,
                true,
            ),
            recipeId: current.id,
            recipeRevisionId: current.revision_id,
            plannedDate,
            mealSlot:
                body.meal_slot === undefined
                    ? undefined
                    : mealType(body.meal_slot),
            servings,
            note: typeof body.note === "string" ? body.note : undefined,
            idempotencyKey:
                typeof body.idempotency_key === "string"
                    ? body.idempotency_key
                    : crypto.randomUUID(),
        });
        return privateJson(c, { planned_meal: result });
    });

    // Recipe experience R1: heal a stored recipe whose nutrition never
    // resolved (saved before save-time resolution existed, or through
    // a non-resolving path). Re-runs the current revision through the
    // same resolver every save path uses and persists a NEW revision;
    // the stored revision is never mutated. Unmatchable ingredients
    // come back named in unresolved_ingredients — flagged, not zeroed.
    app.post(
        "/api/app/recipes/:id/calculate-nutrition",
        requireSameOrigin,
        async (c) => {
            const userId = c.get("munchUserId");
            const current = await getRecipe(userId, c.req.param("id")!);
            if (!current) throw new Error("Recipe not found");
            const body = recordValue(
                await c.req.json().catch(() => ({})),
                "Recipe nutrition calculation",
            );
            const capabilities = await resolveRequestMunchCapabilities(
                c,
                userId,
            );
            const expectedVersion =
                body.expected_version === undefined
                    ? current.version
                    : Number(body.expected_version);
            if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
                throw new Error("Recipe expected_version is invalid");
            }
            const result = await healRecipeNutrition({
                userId,
                scope: recipeScopeForCapabilities(current, capabilities, true),
                recipeId: current.id,
                expectedVersion,
                // One heal per stored revision: a double-tap or retry
                // replays the same update instead of stacking revisions.
                idempotencyKey:
                    typeof body.idempotency_key === "string"
                        ? body.idempotency_key
                        : `heal:${current.id}:${current.revision_id}`,
            });
            return privateJson(c, {
                result: {
                    healed: result.healed,
                    revision_id: result.revisionId,
                    revision_number: result.revisionNumber,
                    nutrition_status: result.nutritionStatus,
                    nutrition_per_serving: result.perServing,
                    resolved_ingredients: result.resolvedIngredients,
                    unresolved_ingredients: result.unresolvedIngredients,
                },
                recipe: await getRecipe(userId, current.id),
            });
        },
    );

    // Recipe experience R2: "Start cook" — a cook session on the
    // existing cooks machinery, its dish linked to the recipe's exact
    // current revision with cook-mode progress pinned from it.
    app.post(
        "/api/app/recipes/:id/start-cook",
        requireSameOrigin,
        async (c) => {
            const userId = c.get("munchUserId");
            const current = await getRecipe(userId, c.req.param("id")!);
            if (!current) throw new Error("Recipe not found");
            const body = recordValue(
                await c.req.json().catch(() => ({})),
                "Recipe cook start",
            );
            const capabilities = await resolveRequestMunchCapabilities(
                c,
                userId,
            );
            const scope = recipeScopeForCapabilities(
                current,
                capabilities,
                true,
            );
            const result = await createCook(userId, {
                scope,
                title: current.name,
                timezone:
                    typeof body.timezone === "string" ? body.timezone : "UTC",
                dishes: [
                    buildRecipeCookDish({
                        name: current.name,
                        recipeId: current.id,
                        revisionId: current.revision_id,
                        instructions: Array.isArray(current.instructions)
                            ? (current.instructions as string[])
                            : [],
                        ingredients: current.ingredients,
                    }),
                ],
                idempotencyKey:
                    typeof body.idempotency_key === "string"
                        ? body.idempotency_key
                        : crypto.randomUUID(),
                source: "website",
            });
            return privateJson(c, {
                cook_id: result.cookId,
                deduplicated: result.deduplicated,
                cook: await getCook(userId, result.cookId),
            });
        },
    );

    // Recipe experience R3: "Add to grocery list" — every non-optional
    // ingredient, scaled by the servings the user is cooking for
    // (default: the recipe as written), merged by name+unit into the
    // recipe scope's existing grocery list.
    app.post("/api/app/recipes/:id/groceries", requireSameOrigin, async (c) => {
        const userId = c.get("munchUserId");
        const current = await getRecipe(userId, c.req.param("id")!);
        if (!current) throw new Error("Recipe not found");
        const body = recordValue(
            await c.req.json().catch(() => ({})),
            "Recipe grocery add",
        );
        const capabilities = await resolveRequestMunchCapabilities(c, userId);
        const servings =
            body.servings === undefined
                ? undefined
                : positiveNumber(body.servings);
        if (body.servings !== undefined && !servings) {
            throw new Error("Grocery servings are invalid");
        }
        const result = await addRecipeToGroceryList({
            userId,
            scope: recipeScopeForCapabilities(current, capabilities, true),
            recipe: {
                id: current.id,
                revisionId: current.revision_id,
                name: current.name,
                servings: current.servings,
                ingredients: current.ingredients,
            },
            servings,
            idempotencyKey:
                typeof body.idempotency_key === "string"
                    ? body.idempotency_key
                    : crypto.randomUUID(),
        });
        return privateJson(c, { result });
    });

    app.get("/api/app/cooks", async (c) =>
        privateJson(c, {
            cooks: await searchCooks(c.get("munchUserId"), {
                query: c.req.query("q"),
                dish: c.req.query("dish"),
                method: c.req.query("method"),
                flavor: c.req.query("flavor"),
                dateFrom: c.req.query("from"),
                dateTo: c.req.query("to"),
                status:
                    (c.req.query("status") as
                        "active" | "finished" | "all" | undefined) ?? "all",
                limit: optionalLimit(c.req.query("limit")),
            }),
        }),
    );

    app.get("/api/app/cooks/compare", async (c) => {
        const ids = (c.req.query("ids") ?? "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);
        return privateJson(c, {
            comparison: await compareCooks(c.get("munchUserId"), ids),
        });
    });

    app.post("/api/app/cooks", requireSameOrigin, async (c) => {
        const userId = c.get("munchUserId");
        const request = await cookRequest(c);
        const body = request.body;
        const timezone =
            typeof body.timezone === "string" ? body.timezone : "UTC";
        const submittedAt =
            typeof body.started_at === "string" ? body.started_at : undefined;
        const message =
            typeof body.message === "string" ? body.message.trim() : undefined;
        const parsed = message
            ? parseNaturalCookUpdate(
                  message,
                  submittedAt
                      ? new Date(submittedAt).toISOString()
                      : new Date().toISOString(),
                  timezone,
              )
            : null;
        const dishes =
            cookDishesFromBody(body) ??
            (parsed?.suggestions.dish
                ? [
                      {
                          name: parsed.suggestions.dish,
                          method: parsed.suggestions.method,
                          flavor: parsed.suggestions.flavor,
                          equipment: parsed.suggestions.equipment,
                          ingredientOrCut: parsed.suggestions.ingredientOrCut,
                      },
                  ]
                : undefined);
        const capabilities = await resolveRequestMunchCapabilities(c, userId);
        const result = await createCook(userId, {
            scope: cookScopeFromBody(body, capabilities),
            title:
                typeof body.title === "string"
                    ? body.title
                    : parsed?.suggestions.dish,
            cookDate: cookDateValue(body.cook_date),
            timezone,
            startedAt: submittedAt,
            status: body.status === "finished" ? "finished" : "active",
            notes: typeof body.notes === "string" ? body.notes : null,
            setupSnapshot:
                body.setup_snapshot &&
                typeof body.setup_snapshot === "object" &&
                !Array.isArray(body.setup_snapshot)
                    ? (body.setup_snapshot as Record<string, unknown>)
                    : undefined,
            sourceCookId:
                typeof body.source_cook_id === "string"
                    ? body.source_cook_id
                    : null,
            originalMessage: message,
            message,
            events: Array.isArray(jsonField(body, "events"))
                ? (jsonField(body, "events") as unknown[]).map(cookEventInput)
                : parsed?.events,
            photos: cookPhotosFromBody(request.photos, body),
            mediaFailures: request.mediaFailures,
            idempotencyKey:
                typeof body.idempotency_key === "string"
                    ? body.idempotency_key
                    : crypto.randomUUID(),
            source: "website",
            dishes,
        });
        return privateJson(c, {
            ...result,
            cook: await getCook(userId, result.cookId),
        });
    });

    app.get("/api/app/cooks/:id", async (c) => {
        const cook = await getCook(c.get("munchUserId"), c.req.param("id")!);
        if (!cook) throw new Error("Cook not found");
        return privateJson(c, cook);
    });

    app.patch("/api/app/cooks/:id", requireSameOrigin, async (c) => {
        const body = recordValue(await c.req.json(), "Cook update");
        const result = await updateCook(
            c.get("munchUserId"),
            c.req.param("id")!,
            {
                title: typeof body.title === "string" ? body.title : undefined,
                cookDate: cookDateValue(body.cook_date),
                timezone:
                    typeof body.timezone === "string"
                        ? body.timezone
                        : undefined,
                status:
                    body.status === "active" || body.status === "finished"
                        ? body.status
                        : undefined,
                notes:
                    body.notes === null || typeof body.notes === "string"
                        ? body.notes
                        : undefined,
                setupSnapshot:
                    body.setup_snapshot &&
                    typeof body.setup_snapshot === "object" &&
                    !Array.isArray(body.setup_snapshot)
                        ? (body.setup_snapshot as Record<string, unknown>)
                        : undefined,
                expectedVersion:
                    body.expected_version === undefined
                        ? undefined
                        : positiveInteger(
                              body.expected_version,
                              "Cook expected_version",
                          ),
            },
        );
        return privateJson(c, {
            cook: await getCook(c.get("munchUserId"), result.id),
        });
    });

    app.patch(
        "/api/app/cooks/:cookId/dishes/:dishId",
        requireSameOrigin,
        async (c) => {
            const body = recordValue(await c.req.json(), "Cook dish update");
            const actualIngredients = body.actual_ingredients;
            if (
                actualIngredients !== undefined &&
                !Array.isArray(actualIngredients)
            ) {
                throw new Error("Actual ingredients must be an array");
            }
            const result = await updateCookDish(
                c.get("munchUserId"),
                c.req.param("cookId")!,
                c.req.param("dishId")!,
                {
                    name: typeof body.name === "string" ? body.name : undefined,
                    ingredientOrCut:
                        body.ingredient_or_cut === null ||
                        typeof body.ingredient_or_cut === "string"
                            ? body.ingredient_or_cut
                            : undefined,
                    method:
                        body.method === null || typeof body.method === "string"
                            ? body.method
                            : undefined,
                    flavor:
                        body.flavor === null || typeof body.flavor === "string"
                            ? body.flavor
                            : undefined,
                    equipment:
                        body.equipment === null ||
                        typeof body.equipment === "string"
                            ? body.equipment
                            : undefined,
                    notes:
                        body.notes === null || typeof body.notes === "string"
                            ? body.notes
                            : undefined,
                    actualIngredients: actualIngredients as
                        unknown[] | undefined,
                    expectedVersion:
                        body.expected_version === undefined
                            ? undefined
                            : positiveInteger(
                                  body.expected_version,
                                  "Cook expected_version",
                              ),
                },
            );
            return privateJson(c, {
                ...result,
                cook: await getCook(
                    c.get("munchUserId"),
                    c.req.param("cookId")!,
                ),
            });
        },
    );

    // Recipe experience R2: cook-mode checklist state. The client sends
    // the full checked-position arrays for the dish's pinned steps /
    // actual ingredients; the state persists on the cook session's dish
    // and reads back through getCook (and the MCP get_cook tool).
    app.patch(
        "/api/app/cooks/:cookId/dishes/:dishId/progress",
        requireSameOrigin,
        async (c) => {
            const body = recordValue(await c.req.json(), "Cook progress");
            const positions = (
                value: unknown,
                label: string,
            ): number[] | undefined => {
                if (value === undefined) return undefined;
                if (
                    !Array.isArray(value) ||
                    value.some(
                        (entry) =>
                            !Number.isInteger(entry) || Number(entry) < 0,
                    )
                ) {
                    throw new Error(`${label} must be an array of positions`);
                }
                return value.map(Number);
            };
            const result = await updateCookDishProgress(
                c.get("munchUserId"),
                c.req.param("cookId")!,
                c.req.param("dishId")!,
                {
                    checkedIngredients: positions(
                        body.checked_ingredients,
                        "Checked ingredients",
                    ),
                    checkedSteps: positions(
                        body.checked_steps,
                        "Checked steps",
                    ),
                },
            );
            return privateJson(c, {
                ...result,
                cook: await getCook(
                    c.get("munchUserId"),
                    c.req.param("cookId")!,
                ),
            });
        },
    );

    app.delete("/api/app/cooks/:id", requireSameOrigin, async (c) => {
        const deleted = await deleteCook(
            c.get("munchUserId"),
            c.req.param("id")!,
        );
        if (!deleted) throw new Error("Cook not found");
        return privateJson(c, { deleted: true });
    });

    app.post("/api/app/cooks/:id/updates", requireSameOrigin, async (c) => {
        const userId = c.get("munchUserId");
        const request = await cookRequest(c);
        const body = request.body;
        const detail = await getCook(userId, c.req.param("id")!);
        if (!detail) throw new Error("Cook not found");
        const timezone = resolveCookUpdateTimezone(
            body.timezone,
            detail.cook.timezone,
        );
        const submittedAt =
            typeof body.submitted_at === "string"
                ? body.submitted_at
                : undefined;
        const message =
            typeof body.message === "string" ? body.message.trim() : undefined;
        const explicitEvents = jsonField(body, "events");
        const events = Array.isArray(explicitEvents)
            ? explicitEvents.map(cookEventInput)
            : cookEventsFromBody(
                  body,
                  message,
                  submittedAt ? new Date(submittedAt).toISOString() : undefined,
                  timezone,
              );
        const update = await addCookUpdate(userId, c.req.param("id")!, {
            source: "website",
            message,
            dishId: typeof body.dish_id === "string" ? body.dish_id : null,
            timezone,
            submittedAt,
            events,
            photos: cookPhotosFromBody(request.photos, body),
            mediaFailures: request.mediaFailures,
            idempotencyKey:
                typeof body.idempotency_key === "string"
                    ? body.idempotency_key
                    : crypto.randomUUID(),
        });
        return privateJson(c, {
            update,
            cook: await getCook(userId, c.req.param("id")!),
        });
    });

    app.patch(
        "/api/app/cooks/:cookId/events/:eventId",
        requireSameOrigin,
        async (c) => {
            const body = recordValue(
                await c.req.json(),
                "Cook event correction",
            );
            const event = await correctCookEvent(
                c.get("munchUserId"),
                c.req.param("cookId")!,
                c.req.param("eventId")!,
                cookEventInput(body),
                positiveInteger(
                    body.expected_version,
                    "Cook event expected_version",
                ),
            );
            return privateJson(c, { event });
        },
    );

    app.post("/api/app/cooks/:id/finish", requireSameOrigin, async (c) => {
        const body = recordValue(
            await c.req.json().catch(() => ({})),
            "Finish cook",
        );
        return privateJson(c, {
            cook: await finishCook(
                c.get("munchUserId"),
                c.req.param("id")!,
                body.expected_version === undefined
                    ? undefined
                    : positiveInteger(
                          body.expected_version,
                          "Cook expected_version",
                      ),
            ),
        });
    });

    app.post("/api/app/cooks/:id/reopen", requireSameOrigin, async (c) => {
        const body = recordValue(
            await c.req.json().catch(() => ({})),
            "Reopen cook",
        );
        return privateJson(c, {
            cook: await reopenCook(
                c.get("munchUserId"),
                c.req.param("id")!,
                body.expected_version === undefined
                    ? undefined
                    : positiveInteger(
                          body.expected_version,
                          "Cook expected_version",
                      ),
            ),
        });
    });

    app.post("/api/app/cooks/:id/repeat", requireSameOrigin, async (c) => {
        const body = recordValue(
            await c.req.json().catch(() => ({})),
            "Repeat cook",
        );
        const result = await repeatCook(
            c.get("munchUserId"),
            c.req.param("id")!,
            typeof body.idempotency_key === "string"
                ? body.idempotency_key
                : crypto.randomUUID(),
        );
        return privateJson(c, {
            ...result,
            cook: await getCook(c.get("munchUserId"), result.cookId),
        });
    });

    app.post("/api/app/cooks/:id/outcome", requireSameOrigin, async (c) => {
        const body = recordValue(await c.req.json(), "Cook result");
        const result = await recordCookOutcome(
            c.get("munchUserId"),
            c.req.param("id")!,
            {
                dishId: typeof body.dish_id === "string" ? body.dish_id : null,
                writtenFeedback:
                    typeof body.written_feedback === "string"
                        ? body.written_feedback
                        : null,
                overallAssessment:
                    body.overall_assessment === undefined ||
                    body.overall_assessment === ""
                        ? null
                        : Number(body.overall_assessment),
                characteristics:
                    body.characteristics &&
                    typeof body.characteristics === "object" &&
                    !Array.isArray(body.characteristics)
                        ? (body.characteristics as Record<string, unknown>)
                        : {},
                worked: typeof body.worked === "string" ? body.worked : null,
                disappointed:
                    typeof body.disappointed === "string"
                        ? body.disappointed
                        : null,
                nextTimeNotes:
                    typeof body.next_time_notes === "string"
                        ? body.next_time_notes
                        : null,
                aiSuggestions: Array.isArray(body.ai_suggestions)
                    ? body.ai_suggestions
                    : [],
                isPreferred: body.is_preferred === true,
                expectedVersion:
                    body.expected_version === undefined
                        ? undefined
                        : positiveInteger(
                              body.expected_version,
                              "Cook result expected_version",
                          ),
            },
        );
        return privateJson(c, {
            outcome: result,
            cook: await getCook(c.get("munchUserId"), c.req.param("id")!),
        });
    });

    app.post("/api/app/cooks/:id/preferred", requireSameOrigin, async (c) =>
        privateJson(
            c,
            await setPreferredCook(c.get("munchUserId"), c.req.param("id")!),
        ),
    );

    app.post(
        "/api/app/cooks/:id/recipe-draft",
        requireSameOrigin,
        async (c) => {
            const body = recordValue(
                await c.req.json().catch(() => ({})),
                "Cook recipe draft",
            );
            return privateJson(c, {
                draft: await prepareCookRecipeDraft(
                    c.get("munchUserId"),
                    c.req.param("id")!,
                    typeof body.dish_id === "string" ? body.dish_id : undefined,
                ),
            });
        },
    );

    app.post("/api/app/cooks/:id/save-recipe", requireSameOrigin, async (c) => {
        const userId = c.get("munchUserId");
        const body = recordValue(await c.req.json(), "Cook recipe save");
        const capabilities = await resolveRequestMunchCapabilities(c, userId);
        const result = await saveCookAsRecipe({
            userId,
            cookId: c.req.param("id")!,
            dishId: typeof body.dish_id === "string" ? body.dish_id : undefined,
            scope: recipeScopeForCreation(body, capabilities),
            recipe: recipeInputFromBody(body.recipe),
            idempotencyKey:
                typeof body.idempotency_key === "string"
                    ? body.idempotency_key
                    : crypto.randomUUID(),
        });
        return privateJson(c, {
            ...result,
            cook: await getCook(userId, c.req.param("id")!),
        });
    });

    app.post("/api/app/groceries/items", requireSameOrigin, async (c) => {
        const body = recordValue(await c.req.json(), "Grocery items");
        const capabilities = await resolveRequestMunchCapabilities(
            c,
            c.get("munchUserId"),
        );
        const scope = planningScopeFromBody(body, capabilities, true);
        const rawItems = Array.isArray(body.items)
            ? body.items
            : [body.item === undefined ? body : body.item];
        const items = rawItems.map(groceryItemInputFromBody);
        const grocery = await addGroceryItems({
            userId: c.get("munchUserId"),
            scope,
            items: items.map((item) => ({
                ...item,
                idempotencyKey: item.idempotencyKey ?? crypto.randomUUID(),
            })),
        });
        return privateJson(c, { grocery });
    });

    app.patch("/api/app/groceries/items/:id", requireSameOrigin, async (c) => {
        const body = recordValue(await c.req.json(), "Grocery item update");
        const capabilities = await resolveRequestMunchCapabilities(
            c,
            c.get("munchUserId"),
        );
        const scope = planningScopeFromBody(body, capabilities, true);
        const input = groceryItemInputFromBody(body.item ?? body);
        const groceryItem = await updateGroceryItem({
            userId: c.get("munchUserId"),
            scope,
            groceryItemId: c.req.param("id")!,
            name: input.name,
            quantity: input.quantity ?? null,
            unit: input.unit,
            note: input.note,
            expectedVersion: groceryExpectedVersion(body),
        });
        return privateJson(c, { grocery_item: groceryItem });
    });

    app.delete("/api/app/groceries/items/:id", requireSameOrigin, async (c) => {
        const body = recordValue(
            await c.req.json().catch(() => ({})),
            "Grocery item delete",
        );
        const capabilities = await resolveRequestMunchCapabilities(
            c,
            c.get("munchUserId"),
        );
        const scope = planningScopeFromBody(body, capabilities, true);
        const groceryItem = await deleteGroceryItem({
            userId: c.get("munchUserId"),
            scope,
            groceryItemId: c.req.param("id")!,
            expectedVersion: groceryExpectedVersion(body),
        });
        return privateJson(c, { grocery_item: groceryItem });
    });

    app.post(
        "/api/app/groceries/items/:id/purchased",
        requireSameOrigin,
        async (c) => {
            const body = recordValue(
                await c.req.json(),
                "Grocery purchase update",
            );
            if (typeof body.purchased !== "boolean") {
                throw new Error("Grocery purchased state is required");
            }
            const capabilities = await resolveRequestMunchCapabilities(
                c,
                c.get("munchUserId"),
            );
            planningScopeFromBody(body, capabilities, true);
            const groceryItem = await markGroceryItemPurchased({
                userId: c.get("munchUserId"),
                groceryItemId: c.req.param("id")!,
                purchased: body.purchased,
                expectedVersion: groceryExpectedVersion(body),
            });
            return privateJson(c, { grocery_item: groceryItem });
        },
    );

    app.post(
        "/api/app/groceries/clear-purchased",
        requireSameOrigin,
        async (c) => {
            const body = recordValue(
                await c.req.json(),
                "Clear purchased groceries",
            );
            const capabilities = await resolveRequestMunchCapabilities(
                c,
                c.get("munchUserId"),
            );
            const scope = planningScopeFromBody(body, capabilities, true);
            const result = await clearPurchasedGroceryItems({
                userId: c.get("munchUserId"),
                scope,
            });
            return privateJson(c, result);
        },
    );

    app.get("/api/app/household", async (c) =>
        privateJson(c, await getHouseholdWorkspace(c.get("munchUserId"))),
    );

    app.get("/api/app/household/manage", async (c) => {
        const userId = c.get("munchUserId");
        const capabilities = await resolveRequestMunchCapabilities(c, userId);
        const androidFreeAccess =
            capabilities.entitlementSource === "android_free_baseline";
        const household = capabilities.household;
        if (!household) {
            return privateJson(c, {
                household: null,
                members: [],
                pendingInvitations: [],
                tier: capabilities.tier,
                entitlementSource: capabilities.entitlementSource,
                canCreateHousehold:
                    androidFreeAccess ||
                    (await ownerCanPurchaseHouseholdSeats(userId)),
                canInvite: false,
                canWrite: false,
                activeNonOwnerCount: 0,
                billedSeatQuantity: 0,
                seatCoverage: true,
            });
        }

        const owner = household.role === "owner";
        const [members, coverage, pendingInvitations, canInvite] =
            await Promise.all([
                listHouseholdMembers(userId, household.householdId),
                getHouseholdSeatCoverage({
                    ownerUserId: household.ownerUserId,
                    householdId: household.householdId,
                }),
                owner
                    ? listPendingHouseholdInvitations(
                          userId,
                          household.householdId,
                      )
                    : Promise.resolve([]),
                owner
                    ? androidFreeAccess
                        ? Promise.resolve(true)
                        : ownerCanPurchaseHouseholdSeats(userId)
                    : Promise.resolve(false),
            ]);

        return privateJson(c, {
            household: {
                householdId: household.householdId,
                householdName: household.householdName,
                role: household.role,
                displayName: household.displayName,
            },
            members: members.map((member) => ({
                membershipId: member.membershipId,
                displayName: member.displayName,
                role: member.role,
                joinedAt: member.joinedAt,
                androidFreeAccess: member.androidFreeAccess,
            })),
            pendingInvitations,
            tier: capabilities.tier,
            entitlementSource: capabilities.entitlementSource,
            canCreateHousehold: false,
            canInvite,
            canWrite: capabilities.householdWrite,
            activeNonOwnerCount: androidFreeAccess
                ? members.filter((member) => member.role !== "owner").length
                : coverage.activeNonOwnerCount,
            billedSeatQuantity: coverage.billedSeatQuantity,
            seatCoverage: androidFreeAccess ? true : coverage.covered,
        });
    });

    app.get("/api/app/settings", async (c) => {
        const userId = c.get("munchUserId");
        const [bootstrap, goals, subscription, connections] = await Promise.all(
            [
                getAppBootstrap(
                    userId,
                    c.get("munchUserEmail"),
                    capabilitySurfaceFromRequest(c),
                ),
                getNutritionGoals(userId),
                getDirectSubscriptionSnapshot(userId),
                listOAuthConnections(userId),
            ],
        );
        return privateJson(c, {
            ...bootstrap,
            goals,
            subscription,
            connections,
        });
    });

    app.patch("/api/app/meals/:id", requireSameOrigin, async (c) => {
        const body = (await c.req.json()) as Record<string, unknown>;
        const userId = c.get("munchUserId");
        if (
            STRUCTURED_NUTRIENT_FIELDS.some(
                (field) => body[field] !== undefined,
            )
        ) {
            const structured = await getStructuredMeal(
                userId,
                c.req.param("id")!,
            );
            if (structured?.items.length) {
                throw new Error(
                    "Structured meal nutrition must be edited by item",
                );
            }
        }
        const meal = await updateMeal(userId, c.req.param("id")!, {
            ...(typeof body.description === "string"
                ? { description: body.description }
                : {}),
            ...(body.meal_type !== undefined
                ? { meal_type: mealType(body.meal_type) }
                : {}),
            ...(body.calories !== undefined
                ? { calories: numberOrNull(body.calories) ?? undefined }
                : {}),
            ...(body.protein_g !== undefined
                ? { protein_g: numberOrNull(body.protein_g) ?? undefined }
                : {}),
            ...(body.carbs_g !== undefined
                ? { carbs_g: numberOrNull(body.carbs_g) ?? undefined }
                : {}),
            ...(body.fat_g !== undefined
                ? { fat_g: numberOrNull(body.fat_g) ?? undefined }
                : {}),
            ...(body.fiber_g !== undefined
                ? { fiber_g: numberOrNull(body.fiber_g) ?? undefined }
                : {}),
            ...(body.sugar_g !== undefined
                ? { sugar_g: numberOrNull(body.sugar_g) ?? undefined }
                : {}),
            ...(body.alcohol_g !== undefined
                ? { alcohol_g: numberOrNull(body.alcohol_g) ?? undefined }
                : {}),
            ...(typeof body.logged_at === "string"
                ? { logged_at: body.logged_at }
                : {}),
            ...(body.notes === null || typeof body.notes === "string"
                ? { notes: body.notes as string | null }
                : {}),
        });
        return privateJson(c, { meal });
    });

    app.patch(
        "/api/app/meals/:mealId/items/:itemId",
        requireSameOrigin,
        async (c) => {
            const body = (await c.req.json()) as Record<string, unknown>;
            const userId = c.get("munchUserId");
            if (
                body.candidate_id !== undefined ||
                body.saved_food_id !== undefined ||
                body.replace_item === true
            ) {
                const replacement = await resolveWebMealItem(userId, body);
                const meal = await updateStructuredMealItem(
                    userId,
                    c.req.param("mealId")!,
                    c.req.param("itemId")!,
                    { replacement },
                );
                if (typeof body.saved_food_id === "string") {
                    await markSavedFoodUsed(userId, body.saved_food_id);
                }
                return privateJson(c, { meal });
            }
            const nutrientBody =
                body.nutrients && typeof body.nutrients === "object"
                    ? (body.nutrients as Record<string, unknown>)
                    : {};
            const nutrients: Record<string, number | null> = {};
            for (const field of [
                "calories",
                "protein_g",
                "carbs_g",
                "fat_g",
                "fiber_g",
                "sugar_g",
                "alcohol_g",
                "sodium_mg",
                "saturated_fat_g",
                "cholesterol_mg",
                "potassium_mg",
            ]) {
                const value = numberOrNull(nutrientBody[field]);
                if (value !== undefined) nutrients[field] = value;
            }
            const meal = await updateStructuredMealItem(
                userId,
                c.req.param("mealId")!,
                c.req.param("itemId")!,
                {
                    ...(body.quantity !== undefined
                        ? { quantity: positiveNumber(body.quantity) }
                        : {}),
                    ...(typeof body.portion_label === "string"
                        ? { portionLabel: body.portion_label }
                        : {}),
                    ...(Object.keys(nutrients).length ? { nutrients } : {}),
                },
            );
            return privateJson(c, { meal });
        },
    );

    app.post("/api/app/meals/:mealId/items", requireSameOrigin, async (c) => {
        const body = (await c.req.json()) as Record<string, unknown>;
        const userId = c.get("munchUserId");
        if (
            body.candidate_id !== undefined ||
            body.saved_food_id !== undefined
        ) {
            const item = await resolveWebMealItem(userId, body);
            const meal = await addStructuredMealItem(
                userId,
                c.req.param("mealId")!,
                item,
            );
            if (typeof body.saved_food_id === "string") {
                await markSavedFoodUsed(userId, body.saved_food_id);
            }
            return privateJson(c, { meal });
        }
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (!name) throw new Error("Meal item name is required");
        const nutrientBody =
            body.nutrients && typeof body.nutrients === "object"
                ? (body.nutrients as Record<string, unknown>)
                : {};
        const nutrients: Record<string, number> = {};
        for (const field of [
            "calories",
            "protein_g",
            "carbs_g",
            "fat_g",
            "fiber_g",
            "sugar_g",
            "alcohol_g",
            "sodium_mg",
            "saturated_fat_g",
            "cholesterol_mg",
            "potassium_mg",
        ]) {
            const value = numberOrNull(nutrientBody[field]);
            if (typeof value === "number") nutrients[field] = value;
        }
        const assumptions = Array.isArray(body.assumptions)
            ? body.assumptions.filter(
                  (value): value is string =>
                      typeof value === "string" && value.trim().length > 0,
              )
            : [];
        const sourceSnapshot =
            body.source_snapshot && typeof body.source_snapshot === "object"
                ? (body.source_snapshot as Record<string, unknown>)
                : {};
        const meal = await addStructuredMealItem(
            userId,
            c.req.param("mealId")!,
            {
                name,
                ...(body.quantity !== undefined
                    ? { quantity: positiveNumber(body.quantity) }
                    : {}),
                ...(typeof body.portion_label === "string"
                    ? { portionLabel: body.portion_label }
                    : {}),
                ...(body.gram_weight !== undefined
                    ? { gramWeight: nonnegativeNumber(body.gram_weight) }
                    : {}),
                nutrients,
                sourceType: structuredSourceType(body.source_type),
                ...(typeof body.provider === "string"
                    ? { provider: body.provider }
                    : {}),
                ...(typeof body.provider_food_id === "string"
                    ? { providerFoodId: body.provider_food_id }
                    : {}),
                ...(typeof body.provider_revision === "string"
                    ? { providerRevision: body.provider_revision }
                    : {}),
                ...(typeof body.source_url === "string"
                    ? { sourceUrl: body.source_url }
                    : {}),
                ...(typeof body.source_updated_at === "string"
                    ? { sourceUpdatedAt: body.source_updated_at }
                    : {}),
                ...(typeof body.confidence === "number"
                    ? { confidence: body.confidence }
                    : {}),
                assumptions,
                sourceSnapshot,
            },
        );
        return privateJson(c, { meal });
    });

    app.delete(
        "/api/app/meals/:mealId/items/:itemId",
        requireSameOrigin,
        async (c) => {
            const meal = await deleteStructuredMealItem(
                c.get("munchUserId"),
                c.req.param("mealId")!,
                c.req.param("itemId")!,
            );
            return privateJson(c, { meal });
        },
    );

    app.post("/api/app/meals/:id/copy", requireSameOrigin, async (c) => {
        const body = (await c.req.json()) as Record<string, unknown>;
        const copied = await copyMeal(
            c.get("munchUserId"),
            c.req.param("id")!,
            {
                ...(typeof body.logged_at === "string"
                    ? { loggedAt: body.logged_at }
                    : {}),
                ...(body.meal_type !== undefined
                    ? { mealType: mealType(body.meal_type) }
                    : {}),
            },
        );
        return privateJson(c, copied);
    });

    app.delete("/api/app/meals/:id", requireSameOrigin, async (c) => {
        await deleteMeal(c.get("munchUserId"), c.req.param("id")!);
        return privateJson(c, { deleted: true });
    });

    app.post("/api/app/water", requireSameOrigin, async (c) => {
        const body = (await c.req.json()) as Record<string, unknown>;
        const amountMl = Number(body.amount_ml);
        if (!Number.isInteger(amountMl) || amountMl <= 0 || amountMl > 20_000) {
            throw new Error("Invalid water amount");
        }
        const result = await insertWater(c.get("munchUserId"), {
            amount_ml: amountMl,
            ...(typeof body.logged_at === "string"
                ? { logged_at: body.logged_at }
                : {}),
            ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
        });
        return privateJson(c, result);
    });

    app.patch("/api/app/water/:id", requireSameOrigin, async (c) => {
        const body = (await c.req.json()) as Record<string, unknown>;
        const patch: Parameters<typeof updateWater>[2] = {};
        if (body.amount_ml !== undefined) {
            const amountMl = Number(body.amount_ml);
            if (
                !Number.isInteger(amountMl) ||
                amountMl <= 0 ||
                amountMl > 20_000
            ) {
                throw new Error("Invalid water amount");
            }
            patch.amount_ml = amountMl;
        }
        if (body.logged_at !== undefined) {
            if (typeof body.logged_at !== "string" || !body.logged_at) {
                throw new Error("Invalid water timestamp");
            }
            patch.logged_at = body.logged_at;
        }
        if (body.notes !== undefined) {
            if (body.notes !== null && typeof body.notes !== "string") {
                throw new Error("Invalid water notes");
            }
            patch.notes = body.notes as string | null;
        }
        if (!Object.keys(patch).length) {
            throw new Error("Water update requires a field");
        }
        const entry = await updateWater(
            c.get("munchUserId"),
            c.req.param("id")!,
            patch,
        );
        return privateJson(c, { entry });
    });

    app.delete("/api/app/water/:id", requireSameOrigin, async (c) => {
        await deleteWater(c.get("munchUserId"), c.req.param("id")!);
        return privateJson(c, { deleted: true });
    });

    app.post("/api/app/weight", requireSameOrigin, async (c) => {
        const body = (await c.req.json()) as Record<string, unknown>;
        const value = Number(body.weight);
        if (!Number.isFinite(value) || value <= 0 || !isWeightUnit(body.unit)) {
            throw new Error("Invalid weight");
        }
        const weightG = toGrams(value, body.unit);
        if (!isPlausibleWeightGrams(weightG)) {
            throw new Error("Weight is outside the supported range");
        }
        const result = await insertWeight(c.get("munchUserId"), {
            weight_g: weightG,
            ...(typeof body.logged_at === "string"
                ? { logged_at: body.logged_at }
                : {}),
            ...(typeof body.notes === "string" ? { notes: body.notes } : {}),
        });
        return privateJson(c, result);
    });

    app.patch("/api/app/weight/:id", requireSameOrigin, async (c) => {
        const body = (await c.req.json()) as Record<string, unknown>;
        const patch: Parameters<typeof updateWeight>[2] = {};
        if (body.weight !== undefined) {
            const value = Number(body.weight);
            if (!Number.isFinite(value) || value <= 0) {
                throw new Error("Invalid weight");
            }
            const unit = isWeightUnit(body.unit)
                ? body.unit
                : await getPreferredWeightUnit(c.get("munchUserId"));
            if (!unit) throw new Error("Weight unit is required");
            const weightG = toGrams(value, unit);
            if (!isPlausibleWeightGrams(weightG)) {
                throw new Error("Weight is outside the supported range");
            }
            patch.weight_g = weightG;
        }
        if (body.logged_at !== undefined) {
            if (typeof body.logged_at !== "string" || !body.logged_at) {
                throw new Error("Invalid weight timestamp");
            }
            patch.logged_at = body.logged_at;
        }
        if (body.notes !== undefined) {
            if (body.notes !== null && typeof body.notes !== "string") {
                throw new Error("Invalid weight notes");
            }
            patch.notes = body.notes as string | null;
        }
        if (!Object.keys(patch).length) {
            throw new Error("Weight update requires a field");
        }
        const entry = await updateWeight(
            c.get("munchUserId"),
            c.req.param("id")!,
            patch,
        );
        return privateJson(c, { entry });
    });

    app.delete("/api/app/weight/:id", requireSameOrigin, async (c) => {
        await deleteWeight(c.get("munchUserId"), c.req.param("id")!);
        return privateJson(c, { deleted: true });
    });

    app.put("/api/app/goals", requireSameOrigin, async (c) => {
        const body = (await c.req.json()) as Record<string, unknown>;
        if (body.confirm !== true) {
            throw new Error(
                "Explicit confirmation is required to update nutrition goals",
            );
        }
        const unit = isWeightUnit(body.unit) ? body.unit : null;
        const targetWeight = numberOrNull(body.target_weight);
        if (targetWeight !== undefined && targetWeight !== null && !unit) {
            throw new Error("Weight unit is required");
        }
        const targetWeightG =
            targetWeight == null || unit == null
                ? targetWeight
                : toGrams(targetWeight, unit);
        if (
            typeof targetWeightG === "number" &&
            !isPlausibleWeightGrams(targetWeightG)
        ) {
            throw new Error("Target weight is outside the supported range");
        }
        const goals = await upsertNutritionGoals(
            c.get("munchUserId"),
            {
                daily_calories: numberOrNull(body.daily_calories),
                daily_protein_g: numberOrNull(body.daily_protein_g),
                daily_carbs_g: numberOrNull(body.daily_carbs_g),
                daily_fat_g: numberOrNull(body.daily_fat_g),
                daily_fiber_g: numberOrNull(body.daily_fiber_g),
                daily_sugar_g: numberOrNull(body.daily_sugar_g),
                daily_alcohol_g: numberOrNull(body.daily_alcohol_g),
                daily_water_ml: numberOrNull(body.daily_water_ml),
                target_weight_g: targetWeightG,
            },
            {
                origin: "website",
                idempotencyKey:
                    typeof body.idempotency_key === "string"
                        ? body.idempotency_key
                        : crypto.randomUUID(),
            },
        );
        return privateJson(c, { goals });
    });

    app.put("/api/app/preferences", requireSameOrigin, async (c) => {
        const body = (await c.req.json()) as Record<string, unknown>;
        const patch: Parameters<typeof upsertProfile>[1] = {};
        if (typeof body.timezone === "string") {
            if (!validateTz(body.timezone)) {
                throw new Error("Invalid timezone");
            }
            patch.timezone = body.timezone;
        }
        if (
            body.preferred_weight_unit === null ||
            isWeightUnit(body.preferred_weight_unit)
        ) {
            patch.preferred_weight_unit = body.preferred_weight_unit;
        }
        if (typeof body.widgets_enabled === "boolean") {
            patch.widgets_enabled = body.widgets_enabled;
        }
        if (typeof body.alcohol_tracking_enabled === "boolean") {
            patch.alcohol_tracking_enabled = body.alcohol_tracking_enabled;
        }
        if (
            body.preferred_drink_unit === null ||
            body.preferred_drink_unit === "us" ||
            body.preferred_drink_unit === "uk"
        ) {
            patch.preferred_drink_unit = body.preferred_drink_unit;
        }
        const profile = await upsertProfile(c.get("munchUserId"), patch);
        return privateJson(c, { profile });
    });

    app.delete(
        "/api/app/connections/:tokenFamilyId",
        requireSameOrigin,
        async (c) => {
            const revoked = await revokeOAuthConnection(
                c.get("munchUserId"),
                c.req.param("tokenFamilyId")!,
            );
            if (!revoked) throw new Error("Connection not found");
            return privateJson(c, { revoked: true });
        },
    );

    app.onError((error, c) => {
        console.error("App route failed", { name: error.name });
        const recipeImportError =
            error instanceof RecipeImportError ? error : null;
        const knownMessage =
            error instanceof Error &&
            (recipeImportError !== null ||
                /^(Invalid|Connection not found|Date range|Weight|Water|Target weight|Meal item|Meal |Meal$|Meal not found|Food |Nutrition|Add at least|A meal|Structured meal|A structured meal|Draft |Grocery |Import |Recipe import|Recipe capability|Cook|Dish|Cook event|Cook photo|Source cook|Recipe saved)/.test(
                    error.message,
                ))
                ? error.message
                : "The request could not be completed.";
        const status = recipeImportError
            ? [400, 413, 415, 429, 502].includes(recipeImportError.status)
                ? (recipeImportError.status as 400 | 413 | 415 | 429 | 502)
                : 400
            : knownMessage.includes("not found")
              ? 404
              : 400;
        return c.json(
            { error: "app_request_failed", message: knownMessage },
            status,
            { "Cache-Control": "no-store, private" },
        );
    });

    return app;
}
