#!/usr/bin/env bun

const { consumeLoginChallenge, createLoginChallenge } = await import(
    "../src/accounts/repository.js"
);
const {
    deleteSavedFood,
    listSavedFoods,
    markSavedFoodUsed,
    saveFood,
    searchRecentMealItems,
    searchSavedFoods,
} = await import("../src/saved-foods/repository.js");
const { insertStructuredMeal } = await import(
    "../src/structured-meals/repository.js"
);
const { closePlatformDatabase } = await import(
    "../src/platform/database.js"
);

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for saved-food smoke tests");
}

async function createUser(prefix: string) {
    const challenge = await createLoginChallenge(
        `${prefix}-${crypto.randomUUID()}@example.test`,
    );
    if (!(await consumeLoginChallenge(challenge.token))) {
        throw new Error("Unable to activate saved-food smoke user");
    }
    return challenge.userId;
}

const userA = await createUser("saved-a");
const userB = await createUser("saved-b");
const food = {
    provider: "usda" as const,
    providerFoodId: "171688",
    name: "Apples, raw, with skin",
    dataKind: "generic" as const,
    nutrientsPer100g: { calories: 52, carbs_g: 13.8, fiber_g: 2.4 },
    portions: [
        {
            id: "medium",
            amount: 1,
            unit: "piece",
            label: "1 medium apple",
            gramWeight: 182,
            nutrients: { calories: 94.64, carbs_g: 25.12, fiber_g: 4.37 },
        },
    ],
    attribution: {
        label: "USDA FoodData Central",
        license: "CC0 / public domain",
    },
    confidence: 0.95,
};

const saved = await saveFood({
    userId: userA,
    label: "My usual green apple",
    food,
    defaultPortionId: "medium",
});
if (saved.defaultPortionId !== "medium") {
    throw new Error("Saved food default portion was not retained");
}

const updated = await saveFood({
    userId: userA,
    label: "my-usual green apple",
    food: { ...food, confidence: 0.97 },
    defaultPortionId: "medium",
});
if (updated.id !== saved.id || updated.food.confidence !== 0.97) {
    throw new Error("Normalized saved-food upsert did not update in place");
}

if (!(await markSavedFoodUsed(userA, saved.id))) {
    throw new Error("Saved-food usage could not be recorded");
}
const search = await searchSavedFoods(userA, "usual green apple", 10);
if (search[0]?.id !== saved.id || search[0].useCount !== 1) {
    throw new Error("Saved-food search or usage ranking failed");
}
if ((await searchSavedFoods(userB, "green apple", 10)).length !== 0) {
    throw new Error("Cross-tenant saved-food search was allowed");
}

await insertStructuredMeal(userA, {
    description: "Green apple snack",
    mealType: "snack",
    idempotencyKey: `saved-history:${crypto.randomUUID()}`,
    items: [
        {
            name: "Green apple",
            portionLabel: "1 medium apple",
            gramWeight: 182,
            nutrients: { calories: 94.64, carbs_g: 25.12, fiber_g: 4.37 },
            sourceType: "saved_food",
            provider: "usda",
            providerFoodId: "171688",
            confidence: 0.97,
            sourceSnapshot: food,
        },
    ],
});
const history = await searchRecentMealItems(userA, "green apple", 10);
if (history.length !== 1 || history[0]?.sourceType !== "saved_food") {
    throw new Error("Recent structured meal-item memory was not searchable");
}
if ((await searchRecentMealItems(userB, "green apple", 10)).length !== 0) {
    throw new Error("Cross-tenant recent item memory was allowed");
}

if ((await listSavedFoods(userA, 10)).length !== 1) {
    throw new Error("Saved-food listing returned an unexpected count");
}
if (!(await deleteSavedFood(userA, saved.id))) {
    throw new Error("Saved food could not be deleted");
}
if ((await listSavedFoods(userA, 10)).length !== 0) {
    throw new Error("Deleted saved food remained visible");
}

await closePlatformDatabase();
console.log("Munch saved foods, personal history, and RLS smoke test passed.");
