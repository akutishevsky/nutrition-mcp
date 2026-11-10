#!/usr/bin/env bun

import { createSmokeUser } from "./support/smoke-user.js";

const {
    deleteSavedFood,
    getSavedFood,
    listSavedFoods,
    markSavedFoodUsed,
    saveFood,
    searchRecentMealItems,
    searchSavedFoods,
} = await import("../src/saved-foods/repository.js");
const { insertStructuredMeal } =
    await import("../src/structured-meals/repository.js");
const { createAppMeal } = await import("../src/app/meal-entry.js");
const { closePlatformDatabase } = await import("../src/platform/database.js");

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for saved-food smoke tests");
}

const userA = await createSmokeUser("saved-a");
const userB = await createSmokeUser("saved-b");
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
if ((await getSavedFood(userA, saved.id))?.id !== saved.id) {
    throw new Error("Saved-food detail lookup failed");
}
if (await getSavedFood(userB, saved.id)) {
    throw new Error("Cross-tenant saved-food detail lookup was allowed");
}
const webMeal = await createAppMeal(userA, {
    description: "Web saved apple snack",
    mealType: "snack",
    idempotencyKey: `saved-web:${crypto.randomUUID()}`,
    items: [
        {
            saved_food_id: saved.id,
            portion_id: "medium",
            quantity: 1,
        },
    ],
});
if (
    webMeal.meal.items[0]?.sourceType !== "saved_food" ||
    (await getSavedFood(userA, saved.id))?.useCount !== 2
) {
    throw new Error(
        "Website saved-food reuse did not preserve provenance or usage",
    );
}
const search = await searchSavedFoods(userA, "usual green apple", 10);
if (search[0]?.id !== saved.id || search[0].useCount !== 2) {
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
const history = await searchRecentMealItems(userA, "apple", 10);
if (
    history.length !== 2 ||
    history.some((item) => item.sourceType !== "saved_food")
) {
    throw new Error("Recent structured meal-item memory was not searchable");
}
if ((await searchRecentMealItems(userB, "apple", 10)).length !== 0) {
    throw new Error("Cross-tenant recent item memory was allowed");
}

// CAP-LIFT (Michael, 2026-11-09): saved foods are uncapped for every
// tier. A fresh account with no subscription (Free) saves well beyond
// the former 25-food cap.
const userC = await createSmokeUser("saved-c");
for (let index = 1; index <= 30; index++) {
    await saveFood({
        userId: userC,
        label: `Fixture food ${index}`,
        food,
        defaultPortionId: "medium",
    });
}
if ((await listSavedFoods(userC, 100)).length !== 30) {
    throw new Error(
        "Free account could not save beyond the former 25-food cap",
    );
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
