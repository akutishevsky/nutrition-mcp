#!/usr/bin/env bun

const { consumeLoginChallenge, createLoginChallenge } =
    await import("../src/accounts/repository.js");
const {
    acceptHouseholdInvitation,
    createHousehold,
    createHouseholdInvitation,
} = await import("../src/households/repository.js");
const {
    getGroceryList,
    getMealPlan,
    getRecipe,
    saveRecipeAndPlan,
    searchRecipes,
} = await import("../src/planning/repository.js");
const { closePlatformDatabase } = await import("../src/platform/database.js");

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for recipe planning smoke tests");
}

async function createUser(prefix: string) {
    const email = `${prefix}-${crypto.randomUUID()}@example.test`;
    const challenge = await createLoginChallenge(email);
    if (!(await consumeLoginChallenge(challenge.token))) {
        throw new Error("Unable to activate planning smoke user");
    }
    return { userId: challenge.userId, email };
}

const owner = await createUser("planning-owner");
const member = await createUser("planning-member");
const viewer = await createUser("planning-viewer");
const outsider = await createUser("planning-outsider");
const household = await createHousehold({
    userId: owner.userId,
    name: "Planning Household",
    displayName: "Mom",
});

for (const [person, role, displayName] of [
    [member, "member", "Dad"],
    [viewer, "viewer", "Guest"],
] as const) {
    const invitation = await createHouseholdInvitation({
        userId: owner.userId,
        householdId: household.householdId,
        email: person.email,
        role,
    });
    await acceptHouseholdInvitation({
        userId: person.userId,
        token: invitation.rawToken,
        displayName,
    });
}

const scope = {
    type: "household" as const,
    householdId: household.householdId,
};
const idempotencyKey = `recipe-plan:${crypto.randomUUID()}`;
const recipe = {
    name: "Spaghetti with Meat Sauce",
    servings: 4,
    description: "Household spaghetti",
    instructions: ["Brown the beef.", "Simmer the sauce.", "Cook the pasta."],
    preparationMinutes: 15,
    cookingMinutes: 30,
    sourceType: "chatgpt_generated" as const,
    ingredients: [
        {
            name: "Spaghetti",
            quantity: 16,
            unit: "oz",
            nutrients: {
                calories: 1600,
                protein_g: 56,
                carbs_g: 336,
                fat_g: 8,
            },
            sourceType: "user_supplied" as const,
        },
        {
            name: "Ground beef",
            quantity: 1,
            unit: "lb",
            nutrients: {
                calories: 1000,
                protein_g: 84,
                carbs_g: 0,
                fat_g: 72,
            },
            sourceType: "user_supplied" as const,
        },
        {
            name: "Yellow onion",
            quantity: 1,
            unit: "whole",
            nutrients: {
                calories: 44,
                protein_g: 1.2,
                carbs_g: 10.3,
                fat_g: 0.1,
            },
            sourceType: "usda" as const,
            provider: "usda",
            providerFoodId: "170000",
        },
    ],
};

const created = await saveRecipeAndPlan({
    userId: owner.userId,
    scope,
    recipe,
    plannedDate: "2026-08-10",
    mealSlot: "dinner",
    plannedServings: 4,
    groceryItems: [{ name: "Yellow onion", quantity: 1, unit: "whole" }],
    idempotencyKey,
});
if (created.recipe.nutritionStatus !== "complete") {
    throw new Error("Complete recipe nutrition was not calculated");
}
if (
    created.grocery.items.length !== 1 ||
    created.grocery.items[0]?.name !== "Yellow onion"
) {
    throw new Error(
        "Compound workflow persisted groceries beyond the explicitly missing onion",
    );
}

const replay = await saveRecipeAndPlan({
    userId: owner.userId,
    scope,
    recipe,
    plannedDate: "2026-08-10",
    mealSlot: "dinner",
    plannedServings: 4,
    groceryItems: [{ name: "Yellow onion", quantity: 1, unit: "whole" }],
    idempotencyKey,
});
if (!replay.recipe.deduplicated) {
    throw new Error("Compound workflow was not idempotent");
}

const memberPlan = await getMealPlan({
    userId: member.userId,
    startDate: "2026-08-10",
    endDate: "2026-08-10",
    scope: "household",
});
if (
    memberPlan.length !== 1 ||
    memberPlan[0]?.recipe_name !== "Spaghetti with Meat Sauce" ||
    memberPlan[0]?.created_by !== "Mom"
) {
    throw new Error(
        "Household member could not read Monday dinner with attribution",
    );
}

const memberGroceries = await getGroceryList({
    userId: member.userId,
    scope,
});
if (
    memberGroceries.items.length !== 1 ||
    memberGroceries.items[0]?.name !== "Yellow onion"
) {
    throw new Error("Household member could not read the shared grocery list");
}

const found = await searchRecipes({
    userId: member.userId,
    query: "spaghetti",
    scope: "household",
});
if (found.length !== 1 || found[0]?.times_scheduled !== 1) {
    throw new Error("Recipe search did not return factual scheduling usage");
}
if (!(await getRecipe(viewer.userId, created.recipe.recipeId))) {
    throw new Error("Viewer could not read the shared recipe");
}

let viewerWriteDenied = false;
try {
    await saveRecipeAndPlan({
        userId: viewer.userId,
        scope,
        recipe: { ...recipe, name: "Viewer Recipe" },
        plannedDate: "2026-08-11",
        mealSlot: "dinner",
        plannedServings: 4,
        groceryItems: [],
        idempotencyKey: `viewer:${crypto.randomUUID()}`,
    });
} catch {
    viewerWriteDenied = true;
}
if (!viewerWriteDenied)
    throw new Error("Viewer was allowed to write household data");

if (await getRecipe(outsider.userId, created.recipe.recipeId)) {
    throw new Error("Unrelated user read a household recipe");
}
if (
    (
        await getMealPlan({
            userId: outsider.userId,
            startDate: "2026-08-10",
            endDate: "2026-08-10",
            scope: "all",
        })
    ).length !== 0
) {
    throw new Error("Unrelated user read a household meal plan");
}

await closePlatformDatabase();
console.log(
    "Munch recipe, meal calendar, grocery, idempotency, and household RLS smoke test passed.",
);
