import { describe, expect, test } from "bun:test";
import {
    androidFreeBaselineCapabilities,
    capabilitiesFromSubscription,
} from "./billing/capabilities.js";

/**
 * Amendment D (Michael, 2026-11-09): Free is fully featured on the
 * website and in the app. These tests replace the De-credit slice's
 * first-pass entitlement assertions (Amendment C: Free gated /
 * Premium works at AI call sites), which Amendment D superseded
 * before merge: there is no gate at any AI call site at all, so the
 * contract is reachability — Free works, Premium works, both
 * surfaces — plus the workspace capabilities that used to wall
 * Pantry / Recipes / Meal Plan / Groceries / history behind Premium.
 */

const AI_ROUTE_SOURCES = [
    "src/inventory/routes.ts",
    "src/app/guidance-routes.ts",
    "src/app/routes.ts",
] as const;

describe("AI features are free and ungated (Amendment D)", () => {
    test("no AI route carries a Premium gate, a credit meter, or a 402", async () => {
        for (const path of AI_ROUTE_SOURCES) {
            const source = await Bun.file(path).text();
            expect(source).not.toContain("requirePremiumAi");
            expect(source).not.toContain("ai-entitlement");
            expect(source).not.toContain("premium_required");
            expect(source).not.toContain("ai-credits");
            expect(source).not.toContain("requireAiCredits");
        }
    });

    test("every AI entry point still exists for every account", async () => {
        const inventory = await Bun.file("src/inventory/routes.ts").text();
        expect(inventory).toContain("/api/app/pantry/meal-ideas");
        expect(inventory).toContain("/api/app/pantry/scan-preview");
        expect(inventory).toContain("/api/app/purchases/receipt-preview");
        const app = await Bun.file("src/app/routes.ts").text();
        expect(app).toContain("/api/app/meal-photo");
        expect(app).toContain("/api/app/recipes/import-preview");
        const guidance = await Bun.file("src/app/guidance-routes.ts").text();
        expect(guidance).toContain("/api/app/planning/propose");
    });

    test("Free and Premium accounts alike hold the workspace capabilities on web", () => {
        for (const status of [null, "active", "trialing"] as const) {
            const capabilities = capabilitiesFromSubscription({ status });
            expect(capabilities.personalRecipesRead).toBe(true);
            expect(capabilities.personalRecipesWrite).toBe(true);
            expect(capabilities.personalPlanningRead).toBe(true);
            expect(capabilities.personalPlanningWrite).toBe(true);
            // Full history is free.
            expect(capabilities.historyDays).toBeNull();
        }
        // The one remaining free-tier quantity limit: saved foods.
        expect(
            capabilitiesFromSubscription({ status: null }).savedFoodLimit,
        ).toBe(25);
        expect(
            capabilitiesFromSubscription({ status: "active" }).savedFoodLimit,
        ).toBeNull();
    });

    test("the Android baseline holds the same fully featured floor", () => {
        const baseline = androidFreeBaselineCapabilities(null, "android-user");
        expect(baseline.personalRecipesWrite).toBe(true);
        expect(baseline.personalPlanningWrite).toBe(true);
        expect(baseline.historyDays).toBeNull();
    });

    test("Pantry routes and client carry no Premium wall", async () => {
        const routes = await Bun.file("src/inventory/routes.ts").text();
        expect(routes).not.toContain("premium_required");
        expect(routes).not.toContain("premiumContext");
        const pantryJs = await Bun.file("public/pantry.js").text();
        expect(pantryJs).not.toContain("premium-message");
        expect(pantryJs).not.toContain("premiumMessage");
        const pantryHtml = await Bun.file("public/pantry.html").text();
        expect(pantryHtml).not.toContain("premium-message");
        expect(pantryHtml).not.toContain("available with Munch Premium");
    });

    test("AI copy never frames AI features as Premium", async () => {
        const appJs = await Bun.file("public/app.js").text();
        expect(appJs).not.toContain("meal-photo-premium");
        expect(appJs).not.toContain("Meal-photo estimates are a Premium");
        const accountJs = await Bun.file("public/app-account.js").text();
        expect(accountJs).not.toContain("AI task credits");
        expect(accountJs).not.toContain("aiCredits");
        expect(accountJs).not.toContain("aiPremium");
    });
});
