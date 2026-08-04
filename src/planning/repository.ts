import type { DatabaseTransaction } from "../platform/database.js";
import { withUserDatabase } from "../platform/database.js";

export type PlanningScope =
    { type: "personal" } | { type: "household"; householdId: string };

export interface NutrientFacts {
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sugar_g?: number;
    sodium_mg?: number;
}

export interface RecipeIngredientInput {
    name: string;
    quantity?: number;
    unit?: string;
    preparation?: string;
    optional?: boolean;
    gramWeight?: number;
    nutrients?: NutrientFacts;
    provider?: string;
    providerFoodId?: string;
    sourceType:
        | "usda"
        | "open_food_facts"
        | "published_restaurant"
        | "saved_food"
        | "past_meal"
        | "user_supplied"
        | "model_estimate";
    sourceUrl?: string;
    confidence?: number;
    sourceSnapshot?: Record<string, unknown>;
}

export interface RecipeInput {
    name: string;
    servings: number;
    description?: string;
    instructions: string[];
    preparationMinutes?: number;
    cookingMinutes?: number;
    sourceType: "user_entered" | "chatgpt_generated" | "imported";
    sourceTitle?: string;
    sourceUrl?: string;
    ingredients: RecipeIngredientInput[];
}

export interface GroceryItemInput {
    name: string;
    quantity?: number;
    unit?: string;
    note?: string;
    foodProvider?: string;
    providerFoodId?: string;
    sourceRecipeId?: string;
    sourceRecipeRevisionId?: string;
    sourcePlannedMealId?: string;
    idempotencyKey?: string;
}

export interface SavedRecipeResult {
    recipeId: string;
    revisionId: string;
    revisionNumber: number;
    nutritionStatus: "complete" | "partial" | "unavailable";
    totals: NutrientFacts;
    perServing: NutrientFacts;
    deduplicated: boolean;
}

function normalizeName(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

function validateScope(scope: PlanningScope): void {
    if (
        scope.type === "household" &&
        !/^[0-9a-f-]{36}$/i.test(scope.householdId)
    ) {
        throw new Error("Invalid household ID");
    }
}

function ownerValues(scope: PlanningScope, userId: string) {
    validateScope(scope);
    return {
        personalOwnerUserId: scope.type === "personal" ? userId : null,
        householdId: scope.type === "household" ? scope.householdId : null,
    };
}

function validateRecipe(recipe: RecipeInput): void {
    if (!recipe.name.trim() || recipe.name.trim().length > 200) {
        throw new Error("Recipe name must be 1 to 200 characters");
    }
    if (!Number.isFinite(recipe.servings) || recipe.servings <= 0) {
        throw new Error("Recipe servings must be positive");
    }
    if (
        !Array.isArray(recipe.instructions) ||
        recipe.instructions.length > 100
    ) {
        throw new Error("Recipe instructions are invalid");
    }
    if (
        !Array.isArray(recipe.ingredients) ||
        recipe.ingredients.length < 1 ||
        recipe.ingredients.length > 200
    ) {
        throw new Error("Recipe must contain 1 to 200 ingredients");
    }
    for (const ingredient of recipe.ingredients) {
        if (!ingredient.name.trim() || ingredient.name.length > 300) {
            throw new Error("Recipe ingredient name is invalid");
        }
        if (ingredient.quantity !== undefined && ingredient.quantity <= 0) {
            throw new Error("Recipe ingredient quantity must be positive");
        }
    }
}

const nutrientKeys = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "sodium_mg",
] as const;

function calculateNutrition(recipe: RecipeInput) {
    const totals: NutrientFacts = {};
    let ingredientsWithFacts = 0;
    let completeCore = true;
    for (const ingredient of recipe.ingredients) {
        const facts = ingredient.nutrients;
        if (
            facts &&
            Object.values(facts).some((value) => value !== undefined)
        ) {
            ingredientsWithFacts += 1;
        }
        for (const key of nutrientKeys) {
            const value = facts?.[key];
            if (value !== undefined) {
                if (!Number.isFinite(value) || value < 0) {
                    throw new Error(`Ingredient ${key} must be nonnegative`);
                }
                totals[key] = (totals[key] ?? 0) + value;
            }
        }
        for (const key of [
            "calories",
            "protein_g",
            "carbs_g",
            "fat_g",
        ] as const) {
            if (facts?.[key] === undefined) completeCore = false;
        }
    }
    const nutritionStatus =
        ingredientsWithFacts === 0
            ? "unavailable"
            : completeCore
              ? "complete"
              : "partial";
    const perServing: NutrientFacts = {};
    for (const key of nutrientKeys) {
        if (totals[key] !== undefined) {
            perServing[key] = Number(
                (totals[key]! / recipe.servings).toFixed(2),
            );
            totals[key] = Number(totals[key]!.toFixed(2));
        }
    }
    return { totals, perServing, nutritionStatus } as const;
}

async function existingRecipeByIdempotency(
    tx: DatabaseTransaction,
    userId: string,
    scope: PlanningScope,
    idempotencyKey: string | undefined,
): Promise<SavedRecipeResult | null> {
    if (!idempotencyKey) return null;
    const owner = ownerValues(scope, userId);
    const rows = await tx<Array<Record<string, unknown>>>`
        select
            recipe.id as recipe_id,
            revision.id as revision_id,
            revision.revision_number,
            revision.nutrition_status,
            revision.calories_total,
            revision.protein_g_total,
            revision.carbs_g_total,
            revision.fat_g_total,
            revision.fiber_g_total,
            revision.sugar_g_total,
            revision.sodium_mg_total,
            revision.calories_per_serving,
            revision.protein_g_per_serving,
            revision.carbs_g_per_serving,
            revision.fat_g_per_serving,
            revision.fiber_g_per_serving,
            revision.sugar_g_per_serving,
            revision.sodium_mg_per_serving
        from munch.recipes recipe
        join munch.recipe_revisions revision
          on revision.recipe_id = recipe.id
         and revision.revision_number = recipe.current_revision_number
        where recipe.idempotency_key = ${idempotencyKey}
          and recipe.personal_owner_user_id is not distinct from ${owner.personalOwnerUserId}
          and recipe.household_id is not distinct from ${owner.householdId}
        limit 1
    `;
    return rows[0] ? rowToSavedRecipe(rows[0], true) : null;
}

function nutrientsFromRow(
    row: Record<string, unknown>,
    suffix: string,
): NutrientFacts {
    const result: NutrientFacts = {};
    for (const key of nutrientKeys) {
        const value = row[`${key}${suffix}`];
        if (value != null) result[key] = Number(value);
    }
    return result;
}

function rowToSavedRecipe(
    row: Record<string, unknown>,
    deduplicated: boolean,
): SavedRecipeResult {
    return {
        recipeId: String(row.recipe_id),
        revisionId: String(row.revision_id),
        revisionNumber: Number(row.revision_number),
        nutritionStatus: String(
            row.nutrition_status,
        ) as SavedRecipeResult["nutritionStatus"],
        totals: nutrientsFromRow(row, "_total"),
        perServing: nutrientsFromRow(row, "_per_serving"),
        deduplicated,
    };
}

async function saveRecipeInTransaction(
    tx: DatabaseTransaction,
    input: {
        userId: string;
        scope: PlanningScope;
        recipe: RecipeInput;
        idempotencyKey?: string;
    },
): Promise<SavedRecipeResult> {
    validateRecipe(input.recipe);
    const existing = await existingRecipeByIdempotency(
        tx,
        input.userId,
        input.scope,
        input.idempotencyKey,
    );
    if (existing) return existing;

    const owner = ownerValues(input.scope, input.userId);
    const calculation = calculateNutrition(input.recipe);
    const recipes = await tx<Array<{ id: string }>>`
        insert into munch.recipes (
            personal_owner_user_id,
            household_id,
            name,
            idempotency_key,
            created_by_user_id,
            updated_by_user_id
        ) values (
            ${owner.personalOwnerUserId},
            ${owner.householdId},
            ${input.recipe.name.trim()},
            ${input.idempotencyKey ?? null},
            ${input.userId},
            ${input.userId}
        )
        returning id
    `;
    const recipeId = recipes[0]?.id;
    if (!recipeId) throw new Error("Recipe creation returned no row");

    const revisions = await tx<Array<Record<string, unknown>>>`
        insert into munch.recipe_revisions (
            recipe_id,
            revision_number,
            servings,
            description,
            instructions,
            preparation_minutes,
            cooking_minutes,
            source_type,
            source_title,
            source_url,
            calories_total,
            protein_g_total,
            carbs_g_total,
            fat_g_total,
            fiber_g_total,
            sugar_g_total,
            sodium_mg_total,
            calories_per_serving,
            protein_g_per_serving,
            carbs_g_per_serving,
            fat_g_per_serving,
            fiber_g_per_serving,
            sugar_g_per_serving,
            sodium_mg_per_serving,
            nutrition_status,
            calculated_at,
            created_by_user_id
        ) values (
            ${recipeId}, 1, ${input.recipe.servings},
            ${input.recipe.description?.trim() || null},
            ${input.recipe.instructions}::jsonb,
            ${input.recipe.preparationMinutes ?? null},
            ${input.recipe.cookingMinutes ?? null},
            ${input.recipe.sourceType},
            ${input.recipe.sourceTitle?.trim() || null},
            ${input.recipe.sourceUrl?.trim() || null},
            ${calculation.totals.calories ?? null},
            ${calculation.totals.protein_g ?? null},
            ${calculation.totals.carbs_g ?? null},
            ${calculation.totals.fat_g ?? null},
            ${calculation.totals.fiber_g ?? null},
            ${calculation.totals.sugar_g ?? null},
            ${calculation.totals.sodium_mg ?? null},
            ${calculation.perServing.calories ?? null},
            ${calculation.perServing.protein_g ?? null},
            ${calculation.perServing.carbs_g ?? null},
            ${calculation.perServing.fat_g ?? null},
            ${calculation.perServing.fiber_g ?? null},
            ${calculation.perServing.sugar_g ?? null},
            ${calculation.perServing.sodium_mg ?? null},
            ${calculation.nutritionStatus},
            ${calculation.nutritionStatus === "unavailable" ? null : new Date()},
            ${input.userId}
        )
        returning id as revision_id, revision_number, nutrition_status,
                  calories_total, protein_g_total, carbs_g_total, fat_g_total,
                  fiber_g_total, sugar_g_total, sodium_mg_total,
                  calories_per_serving, protein_g_per_serving,
                  carbs_g_per_serving, fat_g_per_serving,
                  fiber_g_per_serving, sugar_g_per_serving,
                  sodium_mg_per_serving
    `;
    const revision = revisions[0];
    if (!revision) throw new Error("Recipe revision creation returned no row");

    for (const [position, ingredient] of input.recipe.ingredients.entries()) {
        const facts = ingredient.nutrients ?? {};
        await tx`
            insert into munch.recipe_ingredients (
                recipe_revision_id, position, name, quantity, unit,
                preparation, optional, gram_weight, calories, protein_g,
                carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, provider,
                provider_food_id, source_type, source_url, confidence,
                source_snapshot
            ) values (
                ${String(revision.revision_id)}, ${position},
                ${ingredient.name.trim()}, ${ingredient.quantity ?? null},
                ${ingredient.unit?.trim() || null},
                ${ingredient.preparation?.trim() || null},
                ${ingredient.optional ?? false}, ${ingredient.gramWeight ?? null},
                ${facts.calories ?? null}, ${facts.protein_g ?? null},
                ${facts.carbs_g ?? null}, ${facts.fat_g ?? null},
                ${facts.fiber_g ?? null}, ${facts.sugar_g ?? null},
                ${facts.sodium_mg ?? null}, ${ingredient.provider ?? null},
                ${ingredient.providerFoodId ?? null}, ${ingredient.sourceType},
                ${ingredient.sourceUrl ?? null}, ${ingredient.confidence ?? null},
                ${ingredient.sourceSnapshot ?? {}}::jsonb
            )
        `;
    }

    return rowToSavedRecipe({ ...revision, recipe_id: recipeId }, false);
}

export async function saveRecipe(input: {
    userId: string;
    scope: PlanningScope;
    recipe: RecipeInput;
    idempotencyKey?: string;
}): Promise<SavedRecipeResult> {
    return withUserDatabase(input.userId, (tx) =>
        saveRecipeInTransaction(tx, input),
    );
}

export async function getRecipe(userId: string, recipeId: string) {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select
                recipe.id, recipe.name, recipe.personal_owner_user_id,
                recipe.household_id, recipe.current_revision_number,
                recipe.created_at, recipe.updated_at,
                revision.id as revision_id, revision.servings,
                revision.description, revision.instructions,
                revision.preparation_minutes, revision.cooking_minutes,
                revision.source_type, revision.source_title, revision.source_url,
                revision.nutrition_status,
                revision.calories_total, revision.protein_g_total,
                revision.carbs_g_total, revision.fat_g_total,
                revision.fiber_g_total, revision.sugar_g_total,
                revision.sodium_mg_total,
                revision.calories_per_serving,
                revision.protein_g_per_serving,
                revision.carbs_g_per_serving,
                revision.fat_g_per_serving,
                revision.fiber_g_per_serving,
                revision.sugar_g_per_serving,
                revision.sodium_mg_per_serving
            from munch.recipes recipe
            join munch.recipe_revisions revision
              on revision.recipe_id = recipe.id
             and revision.revision_number = recipe.current_revision_number
            where recipe.id = ${recipeId} and recipe.archived_at is null
            limit 1
        `;
        const recipe = rows[0];
        if (!recipe) return null;
        const ingredients = await tx<Array<Record<string, unknown>>>`
            select * from munch.recipe_ingredients
            where recipe_revision_id = ${String(recipe.revision_id)}
            order by position
        `;
        return {
            id: String(recipe.id),
            name: String(recipe.name),
            ownership:
                recipe.household_id == null
                    ? { type: "personal" as const }
                    : {
                          type: "household" as const,
                          household_id: String(recipe.household_id),
                      },
            revision_id: String(recipe.revision_id),
            revision_number: Number(recipe.current_revision_number),
            servings: Number(recipe.servings),
            description:
                recipe.description == null ? null : String(recipe.description),
            instructions: recipe.instructions,
            preparation_minutes:
                recipe.preparation_minutes == null
                    ? null
                    : Number(recipe.preparation_minutes),
            cooking_minutes:
                recipe.cooking_minutes == null
                    ? null
                    : Number(recipe.cooking_minutes),
            source: {
                type: String(recipe.source_type),
                title:
                    recipe.source_title == null
                        ? null
                        : String(recipe.source_title),
                url:
                    recipe.source_url == null
                        ? null
                        : String(recipe.source_url),
            },
            nutrition_status: String(recipe.nutrition_status),
            nutrition_total: nutrientsFromRow(recipe, "_total"),
            nutrition_per_serving: nutrientsFromRow(recipe, "_per_serving"),
            ingredients: ingredients.map((ingredient) => ({
                id: String(ingredient.id),
                position: Number(ingredient.position),
                name: String(ingredient.name),
                quantity:
                    ingredient.quantity == null
                        ? null
                        : Number(ingredient.quantity),
                unit: ingredient.unit == null ? null : String(ingredient.unit),
                preparation:
                    ingredient.preparation == null
                        ? null
                        : String(ingredient.preparation),
                optional: Boolean(ingredient.optional),
                gram_weight:
                    ingredient.gram_weight == null
                        ? null
                        : Number(ingredient.gram_weight),
                nutrients: nutrientsFromRow(ingredient, ""),
                provider:
                    ingredient.provider == null
                        ? null
                        : String(ingredient.provider),
                provider_food_id:
                    ingredient.provider_food_id == null
                        ? null
                        : String(ingredient.provider_food_id),
                source_type: String(ingredient.source_type),
                source_url:
                    ingredient.source_url == null
                        ? null
                        : String(ingredient.source_url),
                confidence:
                    ingredient.confidence == null
                        ? null
                        : Number(ingredient.confidence),
            })),
            created_at: new Date(String(recipe.created_at)).toISOString(),
            updated_at: new Date(String(recipe.updated_at)).toISOString(),
        };
    });
}

export async function searchRecipes(input: {
    userId: string;
    query?: string;
    scope?: "personal" | "household" | "all";
    limit?: number;
}) {
    const query = input.query?.trim().toLowerCase() || null;
    const pattern = query
        ? `%${query.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`
        : null;
    const limit = Math.max(1, Math.min(50, input.limit ?? 20));
    return withUserDatabase(input.userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select
                recipe.id, recipe.name, recipe.personal_owner_user_id,
                recipe.household_id, recipe.updated_at,
                revision.id as revision_id, revision.servings,
                revision.nutrition_status,
                revision.calories_per_serving,
                revision.protein_g_per_serving,
                revision.carbs_g_per_serving,
                revision.fat_g_per_serving,
                revision.preparation_minutes,
                revision.cooking_minutes,
                coalesce(usage.times_scheduled, 0) as times_scheduled,
                usage.last_scheduled_date,
                coalesce(usage.times_logged, 0) as times_logged,
                usage.last_logged_at
            from munch.recipes recipe
            join munch.recipe_revisions revision
              on revision.recipe_id = recipe.id
             and revision.revision_number = recipe.current_revision_number
            left join munch.recipe_usage_facts usage on usage.recipe_id = recipe.id
            where recipe.archived_at is null
              and (${input.scope ?? "all"} = 'all'
                   or (${input.scope ?? "all"} = 'personal' and recipe.personal_owner_user_id is not null)
                   or (${input.scope ?? "all"} = 'household' and recipe.household_id is not null))
              and (${pattern}::text is null
                   or lower(recipe.name) like ${pattern} escape '\\'
                   or exists (
                       select 1 from munch.recipe_ingredients ingredient
                       where ingredient.recipe_revision_id = revision.id
                         and lower(ingredient.name) like ${pattern} escape '\\'
                   ))
            order by recipe.updated_at desc
            limit ${limit}
        `;
        return rows.map((row) => ({
            recipe_id: String(row.id),
            revision_id: String(row.revision_id),
            name: String(row.name),
            ownership: row.household_id == null ? "personal" : "household",
            servings: Number(row.servings),
            nutrition_status: String(row.nutrition_status),
            nutrition_per_serving: nutrientsFromRow(row, "_per_serving"),
            preparation_minutes:
                row.preparation_minutes == null
                    ? null
                    : Number(row.preparation_minutes),
            cooking_minutes:
                row.cooking_minutes == null
                    ? null
                    : Number(row.cooking_minutes),
            times_scheduled: Number(row.times_scheduled),
            last_scheduled_date:
                row.last_scheduled_date == null
                    ? null
                    : String(row.last_scheduled_date),
            times_logged: Number(row.times_logged),
            last_logged_at:
                row.last_logged_at == null
                    ? null
                    : new Date(String(row.last_logged_at)).toISOString(),
            updated_at: new Date(String(row.updated_at)).toISOString(),
        }));
    });
}

async function scheduleRecipeInTransaction(
    tx: DatabaseTransaction,
    input: {
        userId: string;
        scope: PlanningScope;
        recipeId: string;
        recipeRevisionId: string;
        plannedDate: string;
        mealSlot?: "breakfast" | "lunch" | "dinner" | "snack";
        servings: number;
        note?: string;
        idempotencyKey?: string;
    },
) {
    const owner = ownerValues(input.scope, input.userId);
    const rows = await tx<Array<Record<string, unknown>>>`
        insert into munch.planned_meals (
            personal_owner_user_id, household_id, planned_date, meal_slot,
            recipe_id, recipe_revision_id, servings, note, idempotency_key,
            created_by_user_id, updated_by_user_id
        ) values (
            ${owner.personalOwnerUserId}, ${owner.householdId},
            ${input.plannedDate}::date, ${input.mealSlot ?? null},
            ${input.recipeId}, ${input.recipeRevisionId}, ${input.servings},
            ${input.note?.trim() || null}, ${input.idempotencyKey ?? null},
            ${input.userId}, ${input.userId}
        )
        on conflict do nothing
        returning id, planned_date, meal_slot, servings
    `;
    if (rows[0]) return rows[0];
    if (!input.idempotencyKey)
        throw new Error("Planned meal creation returned no row");
    const existing = await tx<Array<Record<string, unknown>>>`
        select id, planned_date, meal_slot, servings
        from munch.planned_meals
        where idempotency_key = ${input.idempotencyKey}
          and personal_owner_user_id is not distinct from ${owner.personalOwnerUserId}
          and household_id is not distinct from ${owner.householdId}
        limit 1
    `;
    if (!existing[0]) throw new Error("Planned meal creation returned no row");
    return existing[0];
}

export async function scheduleRecipe(
    input: Parameters<typeof scheduleRecipeInTransaction>[1],
) {
    return withUserDatabase(input.userId, (tx) =>
        scheduleRecipeInTransaction(tx, input),
    );
}

export async function getMealPlan(input: {
    userId: string;
    startDate: string;
    endDate: string;
    scope?: "personal" | "household" | "all";
}) {
    return withUserDatabase(input.userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select
                planned.id, planned.planned_date, planned.meal_slot,
                planned.servings, planned.note, planned.version,
                planned.recipe_id, planned.recipe_revision_id,
                recipe.name as recipe_name,
                planned.household_id,
                coalesce(membership.display_name, planned.created_by_display_name) as created_by_display_name,
                revision.calories_per_serving,
                revision.protein_g_per_serving,
                revision.carbs_g_per_serving,
                revision.fat_g_per_serving,
                revision.fiber_g_per_serving,
                revision.sugar_g_per_serving,
                revision.sodium_mg_per_serving
            from munch.planned_meals planned
            join munch.recipes recipe on recipe.id = planned.recipe_id
            join munch.recipe_revisions revision on revision.id = planned.recipe_revision_id
            left join munch.household_memberships membership
              on membership.household_id = planned.household_id
             and membership.user_id = planned.created_by_user_id
            where planned.deleted_at is null
              and planned.planned_date between ${input.startDate}::date and ${input.endDate}::date
              and (${input.scope ?? "all"} = 'all'
                   or (${input.scope ?? "all"} = 'personal' and planned.personal_owner_user_id is not null)
                   or (${input.scope ?? "all"} = 'household' and planned.household_id is not null))
            order by planned.planned_date, planned.meal_slot nulls last, planned.created_at
        `;
        return rows.map((row) => ({
            planned_meal_id: String(row.id),
            planned_date: String(row.planned_date),
            meal_slot: row.meal_slot == null ? null : String(row.meal_slot),
            recipe_id: String(row.recipe_id),
            recipe_revision_id: String(row.recipe_revision_id),
            recipe_name: String(row.recipe_name),
            servings: Number(row.servings),
            note: row.note == null ? null : String(row.note),
            ownership: row.household_id == null ? "personal" : "household",
            created_by:
                row.created_by_display_name == null
                    ? null
                    : String(row.created_by_display_name),
            nutrition_per_serving: nutrientsFromRow(row, "_per_serving"),
            version: Number(row.version),
        }));
    });
}

async function getOrCreateGroceryListInTransaction(
    tx: DatabaseTransaction,
    userId: string,
    scope: PlanningScope,
): Promise<string> {
    const owner = ownerValues(scope, userId);
    const existing = await tx<Array<{ id: string }>>`
        select id from munch.grocery_lists
        where status = 'active'
          and personal_owner_user_id is not distinct from ${owner.personalOwnerUserId}
          and household_id is not distinct from ${owner.householdId}
        limit 1
    `;
    if (existing[0]) return existing[0].id;
    const rows = await tx<Array<{ id: string }>>`
        insert into munch.grocery_lists (
            personal_owner_user_id, household_id, created_by_user_id
        ) values (
            ${owner.personalOwnerUserId}, ${owner.householdId}, ${userId}
        ) returning id
    `;
    if (!rows[0]) throw new Error("Grocery list creation returned no row");
    return rows[0].id;
}

async function addGroceryItemsInTransaction(
    tx: DatabaseTransaction,
    input: {
        userId: string;
        scope: PlanningScope;
        items: GroceryItemInput[];
    },
) {
    if (input.items.length < 1 || input.items.length > 100) {
        throw new Error("Add 1 to 100 grocery items at a time");
    }
    const listId = await getOrCreateGroceryListInTransaction(
        tx,
        input.userId,
        input.scope,
    );
    const results: Array<Record<string, unknown>> = [];
    for (const item of input.items) {
        const name = item.name.trim();
        const normalized = normalizeName(name);
        if (!name || !normalized)
            throw new Error("Grocery item name is invalid");
        const unit = item.unit?.trim() || null;
        let existing: Array<Record<string, unknown>> = [];
        if (item.quantity !== undefined) {
            existing = await tx<Array<Record<string, unknown>>>`
                select id, quantity, version
                from munch.grocery_items
                where grocery_list_id = ${listId}
                  and normalized_name = ${normalized}
                  and unit is not distinct from ${unit}
                  and food_provider is not distinct from ${item.foodProvider ?? null}
                  and provider_food_id is not distinct from ${item.providerFoodId ?? null}
                  and purchased_at is null and deleted_at is null
                limit 1
                for update
            `;
        }
        if (existing[0]) {
            const updated = await tx<Array<Record<string, unknown>>>`
                update munch.grocery_items
                set quantity = coalesce(quantity, 0) + ${item.quantity ?? 0},
                    updated_by_user_id = ${input.userId},
                    updated_at = now(), version = version + 1
                where id = ${String(existing[0].id)}
                returning id, name, quantity, unit, purchased_at, version
            `;
            results.push({ ...updated[0], merged: true });
            continue;
        }
        const inserted = await tx<Array<Record<string, unknown>>>`
            insert into munch.grocery_items (
                grocery_list_id, name, normalized_name, quantity, unit, note,
                food_provider, provider_food_id, source_recipe_id,
                source_recipe_revision_id, source_planned_meal_id,
                idempotency_key, added_by_user_id, updated_by_user_id
            ) values (
                ${listId}, ${name}, ${normalized}, ${item.quantity ?? null},
                ${unit}, ${item.note?.trim() || null},
                ${item.foodProvider ?? null}, ${item.providerFoodId ?? null},
                ${item.sourceRecipeId ?? null},
                ${item.sourceRecipeRevisionId ?? null},
                ${item.sourcePlannedMealId ?? null},
                ${item.idempotencyKey ?? null}, ${input.userId}, ${input.userId}
            )
            on conflict do nothing
            returning id, name, quantity, unit, purchased_at, version
        `;
        if (inserted[0]) results.push({ ...inserted[0], merged: false });
    }
    return { groceryListId: listId, items: results };
}

export async function addGroceryItems(input: {
    userId: string;
    scope: PlanningScope;
    items: GroceryItemInput[];
}) {
    return withUserDatabase(input.userId, (tx) =>
        addGroceryItemsInTransaction(tx, input),
    );
}

export async function getGroceryList(input: {
    userId: string;
    scope: PlanningScope;
    includePurchased?: boolean;
}) {
    return withUserDatabase(input.userId, async (tx) => {
        const owner = ownerValues(input.scope, input.userId);
        const lists = await tx<Array<{ id: string }>>`
            select id from munch.grocery_lists
            where status = 'active'
              and personal_owner_user_id is not distinct from ${owner.personalOwnerUserId}
              and household_id is not distinct from ${owner.householdId}
            limit 1
        `;
        if (!lists[0]) return { groceryListId: null, items: [] };
        const rows = await tx<Array<Record<string, unknown>>>`
            select
                item.id, item.name, item.quantity, item.unit, item.note,
                item.purchased_at, item.source_recipe_id,
                item.source_planned_meal_id, item.version,
                coalesce(membership.display_name, item.added_by_display_name) as added_by
            from munch.grocery_items item
            left join munch.household_memberships membership
              on membership.household_id = ${owner.householdId}
             and membership.user_id = item.added_by_user_id
            where item.grocery_list_id = ${lists[0].id}
              and item.deleted_at is null
              and (${input.includePurchased ?? false} or item.purchased_at is null)
            order by item.purchased_at nulls first, item.created_at
        `;
        return {
            groceryListId: lists[0].id,
            items: rows.map((row) => ({
                grocery_item_id: String(row.id),
                name: String(row.name),
                quantity: row.quantity == null ? null : Number(row.quantity),
                unit: row.unit == null ? null : String(row.unit),
                note: row.note == null ? null : String(row.note),
                purchased_at:
                    row.purchased_at == null
                        ? null
                        : new Date(String(row.purchased_at)).toISOString(),
                source_recipe_id:
                    row.source_recipe_id == null
                        ? null
                        : String(row.source_recipe_id),
                source_planned_meal_id:
                    row.source_planned_meal_id == null
                        ? null
                        : String(row.source_planned_meal_id),
                added_by: row.added_by == null ? null : String(row.added_by),
                version: Number(row.version),
            })),
        };
    });
}

export async function markGroceryItemPurchased(input: {
    userId: string;
    groceryItemId: string;
    purchased: boolean;
    expectedVersion: number;
}) {
    return withUserDatabase(input.userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            update munch.grocery_items
            set purchased_at = case when ${input.purchased} then now() else null end,
                purchased_by_user_id = case when ${input.purchased} then ${input.userId} else null end,
                updated_by_user_id = ${input.userId},
                updated_at = now(), version = version + 1
            where id = ${input.groceryItemId}
              and version = ${input.expectedVersion}
              and deleted_at is null
            returning id, purchased_at, version
        `;
        if (!rows[0]) throw new Error("Grocery item changed or is unavailable");
        return {
            grocery_item_id: String(rows[0].id),
            purchased_at:
                rows[0].purchased_at == null
                    ? null
                    : new Date(String(rows[0].purchased_at)).toISOString(),
            version: Number(rows[0].version),
        };
    });
}

export async function saveRecipeAndPlan(input: {
    userId: string;
    scope: PlanningScope;
    recipe: RecipeInput;
    plannedDate: string;
    mealSlot?: "breakfast" | "lunch" | "dinner" | "snack";
    plannedServings: number;
    note?: string;
    groceryItems: GroceryItemInput[];
    idempotencyKey: string;
}) {
    return withUserDatabase(input.userId, async (tx) => {
        const recipe = await saveRecipeInTransaction(tx, {
            userId: input.userId,
            scope: input.scope,
            recipe: input.recipe,
            idempotencyKey: `${input.idempotencyKey}:recipe`,
        });
        const planned = await scheduleRecipeInTransaction(tx, {
            userId: input.userId,
            scope: input.scope,
            recipeId: recipe.recipeId,
            recipeRevisionId: recipe.revisionId,
            plannedDate: input.plannedDate,
            mealSlot: input.mealSlot,
            servings: input.plannedServings,
            note: input.note,
            idempotencyKey: `${input.idempotencyKey}:planned`,
        });
        const grocery =
            input.groceryItems.length === 0
                ? { groceryListId: null, items: [] }
                : await addGroceryItemsInTransaction(tx, {
                      userId: input.userId,
                      scope: input.scope,
                      items: input.groceryItems.map((item, index) => ({
                          ...item,
                          sourceRecipeId: recipe.recipeId,
                          sourceRecipeRevisionId: recipe.revisionId,
                          sourcePlannedMealId: String(planned.id),
                          idempotencyKey: `${input.idempotencyKey}:grocery:${index}`,
                      })),
                  });
        return {
            recipe,
            plannedMeal: {
                planned_meal_id: String(planned.id),
                planned_date: String(planned.planned_date),
                meal_slot:
                    planned.meal_slot == null
                        ? null
                        : String(planned.meal_slot),
                servings: Number(planned.servings),
            },
            grocery,
        };
    });
}
