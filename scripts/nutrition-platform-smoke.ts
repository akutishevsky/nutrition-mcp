#!/usr/bin/env bun

import {
    consumeLoginChallenge,
    createLoginChallenge,
} from "../src/accounts/repository.js";
import {
    countMeals,
    deleteAllUserData,
    deleteWeight,
    existingIdempotencyKeys,
    getMealsByDate,
    getNutritionGoals,
    getProfile,
    getWaterByDate,
    getWeightByDate,
    insertMeal,
    insertWater,
    insertWeight,
    searchMeals,
    updateMeal,
    updateWeight,
    upsertNutritionGoals,
    upsertProfile,
} from "../src/nutrition-platform/index.js";
import {
    closePlatformDatabase,
    withAuthDatabase,
    withUserDatabase,
} from "../src/platform/database.js";

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for the nutrition smoke test");
}

async function activeUser(label: string) {
    const challenge = await createLoginChallenge(
        `${label}-${crypto.randomUUID()}@example.test`,
    );
    const session = await consumeLoginChallenge(challenge.token);
    if (!session) throw new Error(`Unable to activate ${label}`);
    return { userId: challenge.userId, sessionToken: session.sessionToken };
}

const alpha = await activeUser("nutrition-alpha");
const beta = await activeUser("nutrition-beta");
const loggedAt = "2026-08-03T12:30:00.000Z";

const profile = await upsertProfile(alpha.userId, {
    timezone: "America/New_York",
    preferred_weight_unit: "lb",
    widgets_enabled: false,
    alcohol_tracking_enabled: true,
    preferred_drink_unit: "us",
});
if (
    profile.timezone !== "America/New_York" ||
    profile.preferred_weight_unit !== "lb" ||
    profile.widgets_enabled !== false ||
    profile.alcohol_tracking_enabled !== true
) {
    throw new Error("Profile compatibility mapping failed");
}
if ((await getProfile(alpha.userId))?.preferred_drink_unit !== "us") {
    throw new Error("Saved profile could not be read");
}

await upsertNutritionGoals(alpha.userId, {
    daily_calories: 2200.4,
    daily_protein_g: 160,
    daily_carbs_g: 210,
    daily_fat_g: 75,
    daily_fiber_g: 30,
    daily_sugar_g: 60,
    daily_alcohol_g: 0,
    daily_water_ml: 3000.4,
    target_weight_g: 86_000,
});
const goals = await getNutritionGoals(alpha.userId);
if (goals?.daily_calories !== 2200 || goals.daily_water_ml !== 3000) {
    throw new Error("Nutrition goal integer normalization failed");
}

const mealInput = {
    description: "Peanut butter sandwich and green apple",
    meal_type: "lunch" as const,
    calories: 515.6,
    protein_g: 18,
    carbs_g: 68,
    fat_g: 22,
    fiber_g: 10,
    sugar_g: 24,
    logged_at: loggedAt,
    notes: "Railway nutrition smoke",
};
const firstMeal = await insertMeal(alpha.userId, mealInput);
const duplicateMeal = await insertMeal(alpha.userId, mealInput);
if (firstMeal.deduplicated || !duplicateMeal.deduplicated) {
    throw new Error("Meal idempotency failed");
}
if (duplicateMeal.meal.id !== firstMeal.meal.id) {
    throw new Error("Idempotent meal returned a different record");
}
if (firstMeal.meal.calories !== 516) {
    throw new Error("Meal calories were not normalized to an integer");
}
if ((await countMeals(alpha.userId)) !== 1) {
    throw new Error("Meal count was incorrect");
}
if (
    !(await existingIdempotencyKeys(alpha.userId, [
        firstMeal.meal.idempotency_key!,
        "missing-key",
    ])).has(firstMeal.meal.idempotency_key!)
) {
    throw new Error("Existing idempotency-key lookup failed");
}

const dayMeals = await getMealsByDate(
    alpha.userId,
    "2026-08-03",
    "America/New_York",
);
if (dayMeals.length !== 1) {
    throw new Error("Timezone-aware meal retrieval failed");
}
const searched = await searchMeals(alpha.userId, ["peanut apple"]);
if (searched[0]?.id !== firstMeal.meal.id) {
    throw new Error("Meal keyword search failed");
}
const updatedMeal = await updateMeal(alpha.userId, firstMeal.meal.id, {
    notes: "confirmed portion",
    protein_g: 19,
});
if (updatedMeal.notes !== "confirmed portion" || updatedMeal.protein_g !== 19) {
    throw new Error("Meal update failed");
}

const waterInput = {
    amount_ml: 473,
    logged_at: loggedAt,
    notes: "one bottle",
};
const water = await insertWater(alpha.userId, waterInput);
const waterDuplicate = await insertWater(alpha.userId, waterInput);
if (water.entry.amount_ml !== 473 || !waterDuplicate.deduplicated) {
    throw new Error("Hydration persistence or idempotency failed");
}
if (
    (await getWaterByDate(alpha.userId, "2026-08-03", "America/New_York"))
        .length !== 1
) {
    throw new Error("Hydration date retrieval failed");
}

const weight = await insertWeight(alpha.userId, {
    weight_g: 91_625,
    logged_at: loggedAt,
    notes: "morning",
});
if (weight.entry.weight_g !== 91_625) {
    throw new Error("Weight persistence failed");
}
const updatedWeight = await updateWeight(alpha.userId, weight.entry.id, {
    weight_g: 91_500,
    notes: "corrected",
});
if (updatedWeight.weight_g !== 91_500 || updatedWeight.notes !== "corrected") {
    throw new Error("Weight update failed");
}
if (
    (await getWeightByDate(alpha.userId, "2026-08-03", "America/New_York"))
        .length !== 1
) {
    throw new Error("Weight date retrieval failed");
}
if (!(await deleteWeight(alpha.userId, weight.entry.id))) {
    throw new Error("Weight delete failed");
}

await insertMeal(beta.userId, {
    description: "Tenant B private meal",
    meal_type: "dinner",
    calories: 700,
    logged_at: loggedAt,
});

const leakedRows = await withUserDatabase(alpha.userId, async (tx) =>
    tx<Array<{ id: string }>>`
        select id
        from munch.meals
        where user_id = ${beta.userId}
    `,
);
if (leakedRows.length !== 0) {
    throw new Error("RLS allowed a cross-tenant meal read");
}

let crossTenantWriteDenied = false;
try {
    await withUserDatabase(alpha.userId, async (tx) => {
        await tx`
            insert into munch.meals (
                user_id,
                meal_type,
                description,
                calories
            ) values (
                ${beta.userId},
                'snack',
                'unauthorized cross-tenant write',
                100
            )
        `;
    });
} catch {
    crossTenantWriteDenied = true;
}
if (!crossTenantWriteDenied) {
    throw new Error("RLS allowed a cross-tenant meal write");
}

await deleteAllUserData(beta.userId);
const remainingBeta = await withAuthDatabase(async (tx) =>
    tx<Array<{ count: number | string }>>`
        select count(*)::bigint as count
        from munch.users
        where id = ${beta.userId}
    `,
);
if (Number(remainingBeta[0]?.count ?? 0) !== 0) {
    throw new Error("Permanent account deletion failed");
}

await closePlatformDatabase();
console.log("Munch Railway nutrition and RLS smoke test passed.");
