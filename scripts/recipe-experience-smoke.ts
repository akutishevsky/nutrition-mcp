#!/usr/bin/env bun

import type { FoodCandidate } from "../src/food-providers/types.js";
import {
    buildRecipeCookDish,
    createCook,
    getCook,
    updateCookDishProgress,
} from "../src/cooks/repository.js";
import {
    addRecipeToGroceryList,
    getRecipe,
    healRecipeNutrition,
} from "../src/planning/repository.js";
import {
    closePlatformDatabase,
    withUserDatabase,
} from "../src/platform/database.js";
import { createSmokeIdentity } from "./support/smoke-user.js";

// Recipe experience (R1–R3):
//  R1 — a recipe stored the pre-resolver way (plain user-supplied
//       lines, nutrition "unavailable") heals through
//       healRecipeNutrition: a NEW revision is written with provider
//       snapshots, the old revision is untouched, and an unmatchable
//       ingredient stays visibly unresolved — never zeroed.
//  R2 — Start cook pins a checklist session on the dish; progress
//       toggles persist server-side and read back through getCook
//       (the same serialization the MCP get_cook tool returns).
//  R3 — Add to grocery list merges by name+unit with provenance;
//       a second, scaled pass adds quantities instead of duplicating.

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for the recipe experience smoke");
}

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(message);
}

function candidate(input: {
    id: string;
    name: string;
    portionLabel: string;
    gramWeight: number;
    nutrients: FoodCandidate["portions"][number]["nutrients"];
}): FoodCandidate {
    return {
        provider: "usda",
        providerFoodId: input.id,
        name: input.name,
        dataKind: "generic",
        confidence: 0.98,
        attribution: {
            label: "USDA FoodData Central",
            url: `https://fdc.nal.usda.gov/food-details/${input.id}`,
        },
        portions: [
            {
                id: `${input.id}-portion`,
                amount: 1,
                unit: "cup",
                label: input.portionLabel,
                gramWeight: input.gramWeight,
                nutrients: input.nutrients,
            },
        ],
    };
}

const fixtureCandidates: Record<string, FoodCandidate[]> = {
    butter: [
        candidate({
            id: "2710154",
            name: "Butter, NFS",
            portionLabel: "1 cup",
            gramWeight: 224,
            nutrients: {
                calories: 1664.32,
                protein_g: 1.9,
                carbs_g: 0.13,
                fat_g: 184.13,
            },
        }),
    ],
    "milk whole": [
        candidate({
            id: "2705385",
            name: "Milk, whole",
            portionLabel: "1 cup",
            gramWeight: 244,
            nutrients: {
                calories: 148.84,
                protein_g: 7.98,
                carbs_g: 11.3,
                fat_g: 7.81,
            },
        }),
    ],
};

const foodSearch = {
    async search(query: string) {
        return { candidates: fixtureCandidates[query] ?? [], failures: [] };
    },
};

const owner = await createSmokeIdentity("recipe-experience");
const scope = { type: "personal" as const };
const recipeId = crypto.randomUUID();
const revisionId = crypto.randomUUID();

try {
    // Seed the pre-resolver shape directly: a revision whose
    // ingredients are plain user-supplied lines with no nutrition —
    // exactly how Michael's Chicken Pot Pie sits in production.
    await withUserDatabase(owner.userId, async (tx) => {
        await tx`
            insert into munch.recipes (
                id, personal_owner_user_id, name, current_revision_number,
                created_by_user_id, updated_by_user_id, version
            ) values (
                ${recipeId}, ${owner.userId}, 'Smoke Heal Pie', 1,
                ${owner.userId}, ${owner.userId}, 1
            )
        `;
        await tx`
            insert into munch.recipe_revisions (
                id, recipe_id, revision_number, servings, instructions,
                source_type, nutrition_status, created_by_user_id
            ) values (
                ${revisionId}, ${recipeId}, 1, 2,
                ${["Mix the filling.", "Bake until golden."]},
                'user_entered', 'unavailable', ${owner.userId}
            )
        `;
        const lines: Array<[string, number, string, boolean]> = [
            ["butter", 0.5, "cup", false],
            ["milk", 1, "cup", false],
            ["moon dust", 3, "cups", false],
            ["truffle oil", 1, "tbsp", true],
        ];
        for (const [
            index,
            [name, quantity, unit, optional],
        ] of lines.entries()) {
            await tx`
                insert into munch.recipe_ingredients (
                    recipe_revision_id, position, name, quantity, unit,
                    optional, source_type
                ) values (
                    ${revisionId}, ${index}, ${name}, ${quantity}, ${unit},
                    ${optional}, 'user_supplied'
                )
            `;
        }
    });

    const before = await getRecipe(owner.userId, recipeId);
    assert(
        before.nutrition_status === "unavailable",
        `seed should read unavailable, got ${before.nutrition_status}`,
    );
    assert(
        before.ingredients.every(
            (ingredient) => ingredient.nutrients.calories == null,
        ),
        "seed ingredients should carry no nutrition",
    );

    // ---- R1: heal writes a new revision; the old one is untouched.
    const healed = await healRecipeNutrition({
        userId: owner.userId,
        scope,
        recipeId,
        expectedVersion: before.version,
        idempotencyKey: "smoke-heal-1",
        resolutionDependencies: { foodSearch },
    });
    assert(healed.healed, "heal should report healed: true");
    assert(
        healed.revisionNumber === 2,
        `heal should write revision 2, got ${healed.revisionNumber}`,
    );
    assert(
        healed.nutritionStatus === "partial",
        `healed recipe should be partial (moon dust unresolved), got ${healed.nutritionStatus}`,
    );
    assert(
        JSON.stringify([...healed.resolvedIngredients].sort()) ===
            JSON.stringify(["butter", "milk"]),
        `resolved should be butter+milk, got ${JSON.stringify(healed.resolvedIngredients)}`,
    );
    assert(
        healed.unresolvedIngredients.includes("moon dust"),
        "moon dust must stay visibly unresolved",
    );

    const after = await getRecipe(owner.userId, recipeId);
    assert(
        after.revision_id === healed.revisionId,
        "current revision should be the healed one",
    );
    assert(
        Number(after.nutrition_per_serving?.calories ?? 0) > 0,
        "healed per-serving calories should be populated",
    );
    const butterAfter = after.ingredients.find(
        (ingredient) => ingredient.name === "butter",
    );
    assert(
        butterAfter?.source_type === "usda" &&
            butterAfter?.provider_food_id === "2710154",
        "butter should carry its provider snapshot after heal",
    );
    const moonAfter = after.ingredients.find(
        (ingredient) => ingredient.name === "moon dust",
    );
    assert(
        moonAfter?.nutrients.calories == null &&
            moonAfter?.source_type === "user_supplied",
        "moon dust must remain an unresolved user-supplied line, never estimated",
    );

    // The historical revision is immutable: still unavailable, still
    // nutrient-free.
    const oldRows = await withUserDatabase(owner.userId, async (tx) => {
        const revisions = await tx`
            select nutrition_status from munch.recipe_revisions
            where id = ${revisionId}
        `;
        const ingredients = await tx`
            select calories from munch.recipe_ingredients
            where recipe_revision_id = ${revisionId}
        `;
        return { revisions, ingredients };
    });
    assert(
        oldRows.revisions[0]?.nutrition_status === "unavailable",
        "old revision status must stay unavailable",
    );
    assert(
        oldRows.ingredients.every((row) => row.calories === null),
        "old revision ingredients must stay nutrient-free",
    );

    // A fully-resolved recipe heals as a no-op (no new revision).
    // Seeded resolved, the way a post-#142 save stores it.
    const noopRecipeId = crypto.randomUUID();
    const noopRevisionId = crypto.randomUUID();
    await withUserDatabase(owner.userId, async (tx) => {
        await tx`
            insert into munch.recipes (
                id, personal_owner_user_id, name, current_revision_number,
                created_by_user_id, updated_by_user_id, version
            ) values (
                ${noopRecipeId}, ${owner.userId}, 'Smoke Resolved', 1,
                ${owner.userId}, ${owner.userId}, 1
            )
        `;
        await tx`
            insert into munch.recipe_revisions (
                id, recipe_id, revision_number, servings, instructions,
                source_type, nutrition_status, calories_total,
                protein_g_total, carbs_g_total, fat_g_total,
                calories_per_serving, protein_g_per_serving,
                carbs_g_per_serving, fat_g_per_serving,
                created_by_user_id
            ) values (
                ${noopRevisionId}, ${noopRecipeId}, 1, 1, '["Stir."]'::jsonb,
                'user_entered', 'complete', 100, 5, 10, 4,
                100, 5, 10, 4, ${owner.userId}
            )
        `;
        await tx`
            insert into munch.recipe_ingredients (
                recipe_revision_id, position, name, quantity, unit,
                gram_weight, calories, protein_g, carbs_g, fat_g,
                provider, provider_food_id, source_type
            ) values (
                ${noopRevisionId}, 0, 'butter', 1, 'cup',
                224, 100, 5, 10, 4,
                'usda', '2710154', 'usda'
            )
        `;
    });
    const noop = await healRecipeNutrition({
        userId: owner.userId,
        scope,
        recipeId: noopRecipeId,
        expectedVersion: 1,
        idempotencyKey: "smoke-heal-noop",
        resolutionDependencies: { foodSearch },
    });
    assert(
        noop.healed === false && noop.revisionNumber === 1,
        "a fully-resolved recipe must heal as a no-op without a new revision",
    );

    // ---- R2: cook mode session persists checklist state.
    const current = await getRecipe(owner.userId, recipeId);
    const dish = buildRecipeCookDish({
        name: current.name,
        recipeId: current.id,
        revisionId: current.revision_id,
        instructions: current.instructions,
        ingredients: current.ingredients.map((ingredient) => ({
            name: ingredient.name,
            ...(ingredient.quantity != null
                ? { quantity: Number(ingredient.quantity) }
                : {}),
            ...(ingredient.unit ? { unit: ingredient.unit } : {}),
            ...(ingredient.preparation
                ? { preparation: ingredient.preparation }
                : {}),
            ...(ingredient.optional ? { optional: true } : {}),
        })),
    });
    const started = await createCook(owner.userId, {
        title: current.name,
        timezone: "UTC",
        source: "website",
        idempotencyKey: "smoke-cook-1",
        dishes: [dish],
    });
    let detail = await getCook(owner.userId, started.cookId);
    const sessionDish = detail.dishes[0];
    assert(sessionDish, "cook should carry the recipe dish");
    assert(
        sessionDish.recipe_progress?.steps.length === 2 &&
            sessionDish.recipe_progress.checked_steps.length === 0,
        "session should start with pinned steps and nothing checked",
    );

    await updateCookDishProgress(owner.userId, started.cookId, sessionDish.id, {
        checkedIngredients: [0, 2],
    });
    await updateCookDishProgress(owner.userId, started.cookId, sessionDish.id, {
        checkedSteps: [0],
    });
    detail = await getCook(owner.userId, started.cookId);
    const reread = detail.dishes[0];
    assert(
        JSON.stringify(reread.recipe_progress?.checked_ingredients) ===
            JSON.stringify([0, 2]),
        `ingredient checks should persist, got ${JSON.stringify(reread.recipe_progress?.checked_ingredients)}`,
    );
    assert(
        JSON.stringify(reread.recipe_progress?.checked_steps) ===
            JSON.stringify([0]),
        "step checks should persist",
    );
    assert(
        reread.recipe_id === recipeId &&
            reread.recipe_revision_id === current.revision_id,
        "the session dish must stay linked to the exact recipe revision",
    );

    let rejected = false;
    try {
        await updateCookDishProgress(
            owner.userId,
            started.cookId,
            sessionDish.id,
            { checkedSteps: [99] },
        );
    } catch {
        rejected = true;
    }
    assert(rejected, "out-of-range step positions must be rejected");

    // ---- R3: grocery add merges by name+unit with provenance.
    const first = await addRecipeToGroceryList({
        userId: owner.userId,
        scope,
        recipe: {
            id: current.id,
            revisionId: current.revision_id,
            name: current.name,
            servings: Number(current.servings),
            ingredients: current.ingredients,
        },
        idempotencyKey: "smoke-groceries-1",
    });
    assert(
        first.added === 3 && first.merged === 0,
        `first pass should add 3 (optional excluded), got added=${first.added} merged=${first.merged}`,
    );
    const second = await addRecipeToGroceryList({
        userId: owner.userId,
        scope,
        recipe: {
            id: current.id,
            revisionId: current.revision_id,
            name: current.name,
            servings: Number(current.servings),
            ingredients: current.ingredients,
        },
        servings: Number(current.servings) * 2,
        idempotencyKey: "smoke-groceries-2",
    });
    assert(
        second.added === 0 && second.merged === 3,
        `second pass should merge all 3, got added=${second.added} merged=${second.merged}`,
    );
    const groceryRows = await withUserDatabase(owner.userId, async (tx) => {
        return tx`
            select name, quantity::float8 as quantity, unit, note,
                   source_recipe_id
            from munch.grocery_items
            where deleted_at is null and purchased_at is null
            order by name
        `;
    });
    const byName = new Map(groceryRows.map((row) => [row.name, row]));
    assert(
        byName.size === 3,
        `list should hold exactly 3 rows after merging, got ${byName.size}`,
    );
    assert(
        byName.get("butter")?.quantity === 1.5,
        `butter should total 1.5 cups (0.5 + 2×0.5), got ${byName.get("butter")?.quantity}`,
    );
    assert(
        byName.get("milk")?.quantity === 3,
        `milk should total 3 cups (1 + 2×1), got ${byName.get("milk")?.quantity}`,
    );
    assert(
        byName.get("butter")?.source_recipe_id === recipeId &&
            byName.get("butter")?.note === "From Smoke Heal Pie",
        "merged rows must carry recipe provenance",
    );
    assert(
        !byName.has("truffle oil"),
        "optional ingredients never reach the grocery list",
    );

    console.log("Recipe experience smoke passed.");
} finally {
    await closePlatformDatabase();
}
