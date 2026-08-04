#!/usr/bin/env bun

const { consumeLoginChallenge, createLoginChallenge } =
    await import("../src/accounts/repository.js");
const { exportAccountData } = await import("../src/account-export.js");
const {
    acceptHouseholdInvitation,
    createHousehold,
    createHouseholdInvitation,
} = await import("../src/households/repository.js");
const { saveRecipeAndPlan } = await import("../src/planning/repository.js");
const { closePlatformDatabase } = await import("../src/platform/database.js");
const { consumeExportFile } =
    await import("../src/service-platform/repository.js");

if (!process.env.DATABASE_URL || !process.env.MUNCH_APP_BASE_URL) {
    throw new Error(
        "DATABASE_URL and MUNCH_APP_BASE_URL are required for account export smoke tests",
    );
}

async function createUser(prefix: string) {
    const email = `${prefix}-${crypto.randomUUID()}@example.test`;
    const challenge = await createLoginChallenge(email);
    if (!(await consumeLoginChallenge(challenge.token))) {
        throw new Error("Unable to activate account export smoke user");
    }
    return { userId: challenge.userId, email };
}

const owner = await createUser("export-owner");
const member = await createUser("export-member");
const household = await createHousehold({
    userId: owner.userId,
    name: "Export Household",
    displayName: "Mom",
});
const invitation = await createHouseholdInvitation({
    userId: owner.userId,
    householdId: household.householdId,
    email: member.email,
    role: "member",
});
await acceptHouseholdInvitation({
    userId: member.userId,
    token: invitation.rawToken,
    displayName: "Dad",
});

await saveRecipeAndPlan({
    userId: owner.userId,
    scope: { type: "household", householdId: household.householdId },
    recipe: {
        name: "Spaghetti",
        servings: 4,
        sourceType: "chatgpt_generated",
        instructions: ["Cook the spaghetti."],
        ingredients: [
            {
                name: "Spaghetti",
                quantity: 16,
                unit: "oz",
                sourceType: "user_supplied",
                nutrients: { calories: 1600, protein_g: 56 },
            },
            {
                name: "Yellow onion",
                quantity: 1,
                unit: "whole",
                sourceType: "usda",
                provider: "usda",
                providerFoodId: "170000",
                nutrients: { calories: 44, protein_g: 1.2 },
            },
        ],
    },
    plannedDate: "2026-08-10",
    mealSlot: "dinner",
    plannedServings: 4,
    groceryItems: [{ name: "Yellow onion", quantity: 1, unit: "whole" }],
    idempotencyKey: `export:${crypto.randomUUID()}`,
});

const exported = await exportAccountData(member.userId);
const token = new URL(exported.url).searchParams.get("token");
if (!token) throw new Error("Account export returned no download token");
const file = await consumeExportFile(token);
if (!file || file.contentType !== "application/json; charset=utf-8") {
    throw new Error("Account export file was unavailable or not JSON");
}
const document = JSON.parse(file.content) as Record<string, unknown>;
const serialized = JSON.stringify(document);
if (serialized.includes(owner.email)) {
    throw new Error("Account export leaked another household member's email");
}
if (serialized.includes(owner.userId)) {
    throw new Error("Account export leaked another household member's user ID");
}
if (!serialized.includes('"display_name":"Mom"')) {
    throw new Error(
        "Account export did not preserve household display attribution",
    );
}
if (!serialized.includes('"name":"Spaghetti"')) {
    throw new Error("Account export omitted accessible household recipes");
}
if (!serialized.includes('"name":"Yellow onion"')) {
    throw new Error("Account export omitted accessible household groceries");
}
if (exported.recordCount < 5) {
    throw new Error(
        "Account export did not include the expected shared records",
    );
}

await closePlatformDatabase();
console.log("Munch complete account export privacy smoke test passed.");
