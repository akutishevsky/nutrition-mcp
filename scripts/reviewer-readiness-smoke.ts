#!/usr/bin/env bun

const email = process.env.MUNCH_REVIEWER_EMAIL?.trim().toLowerCase();
const password = process.env.MUNCH_REVIEWER_PASSWORD;
if (!email || !password || !process.env.DATABASE_URL) {
    throw new Error(
        "MUNCH_REVIEWER_EMAIL, MUNCH_REVIEWER_PASSWORD, and DATABASE_URL are required",
    );
}

const { Hono } = await import("hono");
const { Pool } = await import("pg");
const { getMunchBetterAuth } = await import("../src/auth/auth.js");
const { createReviewerRouter } = await import("../src/auth/reviewer-routes.js");
const { resolveMunchCapabilities } =
    await import("../src/billing/capabilities.js");
const { getActiveHouseholdContext } =
    await import("../src/households/repository.js");
const { getGroceryList, getMealPlan, searchRecipes } =
    await import("../src/planning/repository.js");
const { closePlatformDatabase } = await import("../src/platform/database.js");

const auth = getMunchBetterAuth();
const signIn = await auth.api.signInEmail({
    body: {
        email,
        password,
        rememberMe: false,
        callbackURL: "/account/portal",
    },
    returnHeaders: true,
});
if (!signIn.headers.get("set-cookie")) {
    throw new Error("Reviewer password sign-in did not issue a session cookie");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    application_name: "munch-reviewer-smoke",
});
const userResult = await pool.query<{ id: string }>(
    "select id from munch.users where email = $1 and status = 'active' limit 1",
    [email],
);
const userId = userResult.rows[0]?.id;
if (!userId) throw new Error("Provisioned reviewer account was not active");

const capabilities = await resolveMunchCapabilities(userId);
if (
    capabilities.tier !== "premium" ||
    capabilities.entitlementSource !== "explicit_override" ||
    !capabilities.personalRecipesWrite ||
    !capabilities.personalPlanningWrite ||
    !capabilities.householdManage
) {
    throw new Error(
        "Reviewer Premium override did not resolve full capabilities",
    );
}

const household = await getActiveHouseholdContext(userId);
if (!household || household.role !== "owner") {
    throw new Error("Reviewer sample household was unavailable");
}
const recipes = await searchRecipes({
    userId,
    query: "",
    scope: "all",
});
if (
    !recipes.some((recipe) => recipe.name === "Greek Yogurt Breakfast Bowl") ||
    !recipes.some((recipe) => recipe.name === "Spaghetti with Meat Sauce")
) {
    throw new Error("Reviewer personal or household sample recipe was missing");
}
const plan = await getMealPlan({
    userId,
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    scope: "all",
});
if (plan.length < 2) {
    throw new Error("Reviewer sample meal plan was incomplete");
}
const groceries = await getGroceryList({
    userId,
    scope: { type: "household", householdId: household.householdId },
});
if (!groceries.items.some((item) => item.name === "Yellow onion")) {
    throw new Error("Reviewer shared grocery sample was missing");
}

const app = new Hono();
app.route("/", createReviewerRouter());
const page = await app.request("https://munch.example/review/sign-in");
const html = await page.text();
if (
    page.status !== 200 ||
    page.headers.get("cache-control") !== "private, no-store" ||
    page.headers.get("x-robots-tag") !== "noindex, nofollow" ||
    !html.includes("Reviewer sign in") ||
    !html.includes("Public password registration is disabled")
) {
    throw new Error("Reviewer sign-in page security contract failed");
}

const publicSignup = await auth.handler(
    new Request("https://munch.example/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            name: "Unauthorized signup",
            email: `blocked-${crypto.randomUUID()}@example.test`,
            password: "not-allowed-password-12345",
        }),
    }),
);
if (publicSignup.status < 400) {
    throw new Error("Public password signup was not disabled");
}

await pool.end();
await closePlatformDatabase();
console.log(
    "Munch reviewer credentials, expiring Premium override, sample data, and disabled public password signup smoke test passed.",
);
