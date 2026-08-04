#!/usr/bin/env bun

process.env.MUNCH_REVIEWER_SEED_MODE = "true";

const email = process.env.MUNCH_REVIEWER_EMAIL?.trim().toLowerCase();
const password = process.env.MUNCH_REVIEWER_PASSWORD;
const name = process.env.MUNCH_REVIEWER_NAME?.trim() || "Munch reviewer";
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl || !email || !password) {
    throw new Error(
        "DATABASE_URL, MUNCH_REVIEWER_EMAIL, and MUNCH_REVIEWER_PASSWORD are required",
    );
}
if (!email.includes("@") || email.length > 320) {
    throw new Error("MUNCH_REVIEWER_EMAIL is invalid");
}
if (password.length < 16 || password.length > 128) {
    throw new Error("MUNCH_REVIEWER_PASSWORD must be 16 to 128 characters");
}

const expiresAt = process.env.MUNCH_REVIEWER_EXPIRES_AT
    ? new Date(process.env.MUNCH_REVIEWER_EXPIRES_AT)
    : new Date(Date.now() + 180 * 24 * 60 * 60 * 1_000);
if (
    !Number.isFinite(expiresAt.getTime()) ||
    expiresAt.getTime() <= Date.now()
) {
    throw new Error("MUNCH_REVIEWER_EXPIRES_AT must be a future ISO date");
}

const { Pool } = await import("pg");
const { getMunchBetterAuth } = await import("../src/auth/auth.js");
const { grantPremiumOverride } = await import("../src/billing/override.js");
const { createHousehold, getActiveHouseholdContext } =
    await import("../src/households/repository.js");
const { saveRecipeAndPlan } = await import("../src/planning/repository.js");
const { closePlatformDatabase } = await import("../src/platform/database.js");

const pool = new Pool({
    connectionString: databaseUrl,
    max: 2,
    application_name: "munch-reviewer-provision",
});
const auth = getMunchBetterAuth();

async function findUserId(): Promise<string | null> {
    const result = await pool.query<{ id: string }>(
        "select id from munch.users where email = $1 limit 1",
        [email],
    );
    return result.rows[0]?.id ?? null;
}

let userId = await findUserId();
if (!userId) {
    await auth.api.signUpEmail({
        body: {
            email,
            password,
            name,
            callbackURL: "/account/portal",
        },
    });
    userId = await findUserId();
    if (!userId) throw new Error("Reviewer account creation returned no user");
} else {
    try {
        await auth.api.signInEmail({
            body: {
                email,
                password,
                rememberMe: false,
                callbackURL: "/account/portal",
            },
        });
    } catch {
        throw new Error(
            "Reviewer account already exists but the supplied password does not match; use a new reviewer email or the original password",
        );
    }
}

await pool.query(
    `update munch.users
     set name = $2,
         status = 'active',
         email_verified = true,
         email_verified_at = coalesce(email_verified_at, now()),
         updated_at = now()
     where id = $1`,
    [userId, name],
);

await grantPremiumOverride({
    userId,
    expiresAt,
    source: "reviewer",
    reason: "OpenAI marketplace review account",
});

let household = await getActiveHouseholdContext(userId);
if (!household) {
    household = await createHousehold({
        userId,
        name: "Munch Review Household",
        displayName: "Reviewer",
    });
}

await saveRecipeAndPlan({
    userId,
    scope: { type: "personal" },
    recipe: {
        name: "Greek Yogurt Breakfast Bowl",
        description: "Reviewer sample personal recipe",
        servings: 1,
        sourceType: "user_entered",
        preparationMinutes: 5,
        instructions: [
            "Add Greek yogurt to a bowl.",
            "Top with blueberries and granola.",
        ],
        ingredients: [
            {
                name: "Plain Greek yogurt",
                quantity: 1,
                unit: "cup",
                sourceType: "user_supplied",
                nutrients: {
                    calories: 150,
                    protein_g: 23,
                    carbs_g: 9,
                    fat_g: 0,
                },
            },
            {
                name: "Blueberries",
                quantity: 0.5,
                unit: "cup",
                sourceType: "usda",
                provider: "usda",
                providerFoodId: "171711",
                nutrients: {
                    calories: 42,
                    protein_g: 0.5,
                    carbs_g: 10.7,
                    fat_g: 0.2,
                },
            },
            {
                name: "Granola",
                quantity: 0.25,
                unit: "cup",
                sourceType: "user_supplied",
                nutrients: {
                    calories: 130,
                    protein_g: 3,
                    carbs_g: 22,
                    fat_g: 4,
                },
            },
        ],
    },
    plannedDate: "2026-08-06",
    mealSlot: "breakfast",
    plannedServings: 1,
    groceryItems: [{ name: "Blueberries", quantity: 1, unit: "pint" }],
    idempotencyKey: "reviewer-seed-personal-v1",
});

await saveRecipeAndPlan({
    userId,
    scope: {
        type: "household",
        householdId: household.householdId,
    },
    recipe: {
        name: "Spaghetti with Meat Sauce",
        description: "Reviewer sample shared household dinner",
        servings: 4,
        sourceType: "chatgpt_generated",
        preparationMinutes: 15,
        cookingMinutes: 30,
        instructions: [
            "Brown the ground beef.",
            "Simmer the tomato sauce.",
            "Cook the spaghetti and combine.",
        ],
        ingredients: [
            {
                name: "Spaghetti",
                quantity: 16,
                unit: "oz",
                sourceType: "user_supplied",
                nutrients: {
                    calories: 1600,
                    protein_g: 56,
                    carbs_g: 336,
                    fat_g: 8,
                },
            },
            {
                name: "Ground beef",
                quantity: 1,
                unit: "lb",
                sourceType: "user_supplied",
                nutrients: {
                    calories: 1000,
                    protein_g: 84,
                    carbs_g: 0,
                    fat_g: 72,
                },
            },
            {
                name: "Yellow onion",
                quantity: 1,
                unit: "whole",
                sourceType: "usda",
                provider: "usda",
                providerFoodId: "170000",
                nutrients: {
                    calories: 44,
                    protein_g: 1.2,
                    carbs_g: 10.3,
                    fat_g: 0.1,
                },
            },
        ],
    },
    plannedDate: "2026-08-10",
    mealSlot: "dinner",
    plannedServings: 4,
    groceryItems: [{ name: "Yellow onion", quantity: 1, unit: "whole" }],
    idempotencyKey: "reviewer-seed-household-v1",
});

await pool.query(
    `insert into munch.audit_events (
        actor_type,
        subject_user_id,
        action,
        outcome,
        metadata
     ) values (
        'system', $1, 'reviewer_sample_data_provisioned', 'success',
        jsonb_build_object('expiresAt', $2::text)
     )`,
    [userId, expiresAt.toISOString()],
);

console.log(
    JSON.stringify(
        {
            provisioned: true,
            email,
            reviewerSignInUrl: `${process.env.MUNCH_APP_BASE_URL ?? "https://munch.business"}/review/sign-in`,
            expiresAt: expiresAt.toISOString(),
            householdId: household.householdId,
        },
        null,
        2,
    ),
);

await pool.end();
await closePlatformDatabase();
