#!/usr/bin/env bun

const { consumeLoginChallenge, createLoginChallenge } = await import(
    "../src/accounts/repository.js"
);
const {
    getStructuredMeal,
    insertStructuredMeal,
} = await import("../src/structured-meals/repository.js");
const { closePlatformDatabase } = await import(
    "../src/platform/database.js"
);

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for structured meal smoke tests");
}

async function createUser(prefix: string) {
    const challenge = await createLoginChallenge(
        `${prefix}-${crypto.randomUUID()}@example.test`,
    );
    const session = await consumeLoginChallenge(challenge.token);
    if (!session) throw new Error("Unable to activate smoke-test user");
    return challenge.userId;
}

const userA = await createUser("structured-a");
const userB = await createUser("structured-b");
const idempotencyKey = `structured-smoke:${crypto.randomUUID()}`;

const first = await insertStructuredMeal(userA, {
    description: "Chicken and rice bowl",
    mealType: "lunch",
    loggedAt: "2026-08-03T17:00:00.000Z",
    notes: "Verified provider snapshot smoke test",
    idempotencyKey,
    items: [
        {
            name: "Roasted chicken breast",
            quantity: 1,
            portionLabel: "1 breast",
            gramWeight: 172,
            nutrients: {
                calories: 283.8,
                protein_g: 53.32,
                fat_g: 6.19,
                sodium_mg: 127,
            },
            sourceType: "usda",
            provider: "usda",
            providerFoodId: "555",
            providerRevision: "2026-08-03",
            sourceUrl: "https://fdc.nal.usda.gov/fdc-app.html#/food-details/555/nutrients",
            confidence: 0.97,
            sourceSnapshot: {
                provider: "usda",
                providerFoodId: "555",
                portion: "1 breast",
            },
        },
        {
            name: "Cooked white rice",
            quantity: 1,
            portionLabel: "1 cup",
            gramWeight: 158,
            nutrients: {
                calories: 205.4,
                protein_g: 4.25,
                carbs_g: 44.5,
                fat_g: 0.44,
            },
            sourceType: "model_estimate",
            confidence: 0.75,
            assumptions: ["Portion treated as one level cup"],
            sourceSnapshot: { basis: "confirmed household portion" },
        },
    ],
});

if (first.deduplicated) throw new Error("Initial structured meal was deduplicated");
if (first.meal.items.length !== 2) throw new Error("Structured items were not inserted");
if (first.meal.calories !== 489) throw new Error("Parent calories were not rounded from item totals");
if (first.meal.proteinG !== 57.57) throw new Error("Parent protein total is incorrect");
if (first.meal.carbsG !== 44.5) throw new Error("Parent carbohydrate total is incorrect");
if (first.meal.items[0]?.sourceSnapshot.provider !== "usda") {
    throw new Error("Provider source snapshot was not preserved");
}
if (first.meal.items[1]?.assumptions[0] !== "Portion treated as one level cup") {
    throw new Error("Accepted assumptions were not preserved");
}

const retry = await insertStructuredMeal(userA, {
    description: "Ignored retry content",
    mealType: "dinner",
    idempotencyKey,
    items: [
        {
            name: "Ignored",
            nutrients: { calories: 1 },
            sourceType: "model_estimate",
        },
    ],
});
if (!retry.deduplicated || retry.meal.id !== first.meal.id) {
    throw new Error("Structured meal retry did not return the original meal");
}
if (retry.meal.items.length !== 2) {
    throw new Error("Idempotent retry changed structured items");
}

if (await getStructuredMeal(userB, first.meal.id)) {
    throw new Error("Cross-tenant structured meal read was allowed");
}
if (!(await getStructuredMeal(userA, first.meal.id))) {
    throw new Error("Structured meal owner could not reload the meal");
}

await closePlatformDatabase();
console.log("Munch structured meal items and RLS smoke test passed.");
