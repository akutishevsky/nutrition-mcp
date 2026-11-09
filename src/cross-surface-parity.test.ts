import { describe, expect, test } from "bun:test";
import { calculateDateRangeDays } from "./analytics.js";
import { CAPABILITY_MANIFEST } from "./capability-manifest.js";
import { rangeAverages, sumMeals } from "./mcp.js";
import {
    buildNutritionRangeContract,
    inclusiveDateSpanDays,
    sumNutrition,
} from "./nutrition-contract.js";
import type { Meal, NutritionGoals } from "./storage.js";

function meal(id: string, loggedAt: string, values: Partial<Meal> = {}): Meal {
    return {
        id,
        user_id: "00000000-0000-0000-0000-000000000001",
        logged_at: loggedAt,
        meal_type: "lunch",
        description: id,
        calories: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        fiber_g: null,
        sugar_g: null,
        alcohol_g: null,
        notes: null,
        idempotency_key: null,
        ...values,
    };
}

const goals: NutritionGoals = {
    user_id: "00000000-0000-0000-0000-000000000001",
    daily_calories: 2200,
    daily_protein_g: 180,
    daily_carbs_g: 200,
    daily_fat_g: 75,
    daily_fiber_g: 30,
    daily_sugar_g: 50,
    daily_alcohol_g: null,
    daily_water_ml: 2500,
    target_weight_g: 86183,
    updated_at: "2026-08-19T00:00:00.000Z",
};

describe("cross-surface nutrition parity", () => {
    test("web and MCP meal totals stay identical", () => {
        const meals = [
            meal("a", "2026-08-18T12:00:00.000Z", {
                calories: 650,
                protein_g: 44,
                carbs_g: 70,
                fat_g: 21,
                fiber_g: 9,
                sugar_g: 12,
                alcohol_g: 0,
            }),
            meal("b", "2026-08-18T18:00:00.000Z", {
                calories: 550,
                protein_g: 38,
                carbs_g: 45,
                fat_g: 24,
                fiber_g: 7,
                sugar_g: 8,
                alcohol_g: 3,
            }),
        ];
        const web = sumNutrition(meals);
        const mcp = sumMeals(meals);
        expect(mcp).toMatchObject({
            calories: web.calories,
            protein_g: web.proteinG,
            carbs_g: web.carbsG,
            fat_g: web.fatG,
            fiber_g: web.fiberG,
            sugar_g: web.sugarG,
            alcohol_g: web.alcoholG,
        });
    });

    test("web and MCP averages share missing-nutrient semantics", () => {
        const dayOne = [
            meal("legacy", "2026-08-17T12:00:00.000Z", {
                calories: 1000,
                protein_g: 100,
            }),
        ];
        const dayTwo = [
            meal("modern", "2026-08-18T12:00:00.000Z", {
                calories: 1200,
                protein_g: 120,
                fiber_g: 30,
                sugar_g: 20,
                alcohol_g: 0,
            }),
        ];
        const allMeals = [...dayOne, ...dayTwo];
        const web = buildNutritionRangeContract({
            meals: allMeals,
            startDate: "2026-08-17",
            endDate: "2026-08-18",
            timezone: "UTC",
            goals,
        });
        const mcp = rangeAverages([
            { meals: dayOne, totals: sumMeals(dayOne) },
            { meals: dayTwo, totals: sumMeals(dayTwo) },
        ]);
        expect(mcp.averages.calories).toBe(web.averages.calories);
        expect(mcp.averages.protein_g).toBe(web.averages.proteinG);
        expect(mcp.averages.fiber_g).toBe(web.averages.fiberG);
        expect(mcp.averages.sugar_g).toBe(web.averages.sugarG);
        expect(mcp.averages.alcohol_g).toBe(web.averages.alcoholG);
        expect(mcp.recordedDays.fiber_g).toBe(web.nutrientCoverage.fiberDays);
        expect(mcp.recordedDays.sugar_g).toBe(web.nutrientCoverage.sugarDays);
        expect(mcp.recordedDays.alcohol_g).toBe(
            web.nutrientCoverage.alcoholDays,
        );
    });

    test("MCP, web, and app entry points stay in parity per capability", () => {
        // S0 (Full Parity App Program): the manifest's explicit `app`
        // channel replaces the old assumption that "web" meant "app".
        // Every MCP-complete outcome must be reachable on web, and in the
        // packaged app too — unless the row carries an explicit exception
        // (website-only by design) or a documented gap with a target slice.
        for (const capability of CAPABILITY_MANIFEST) {
            if (capability.mcp.coverage !== "complete") continue;
            expect(capability.web.coverage).toBe("complete");
            if (capability.app.coverage !== "complete") {
                const explained =
                    capability.intentionalChannelException !== null ||
                    (capability.gap !== null && capability.targetPr !== null);
                expect(explained).toBe(true);
            }
            if (capability.app.coverage === "complete") {
                expect(capability.app.entryPoints.length).toBeGreaterThan(0);
                expect(capability.app.entryPoints).toEqual(
                    capability.web.entryPoints,
                );
            }
        }
        const appComplete = CAPABILITY_MANIFEST.filter(
            (capability) => capability.app.coverage === "complete",
        );
        // The packaged app is the portal bundle: nearly every row is
        // app-complete today; the known exceptions are the website-only
        // rows and the Android AI-credit block (mealPlan.recipeGenerate).
        expect(appComplete.length).toBeGreaterThanOrEqual(
            CAPABILITY_MANIFEST.length - 6,
        );
    });

    test("analytics and web date ranges stay inclusive", () => {
        const ranges = [
            ["2026-08-01", "2026-08-01"],
            ["2026-08-01", "2026-08-07"],
            ["2026-07-31", "2026-08-19"],
        ] as const;
        for (const [start, end] of ranges) {
            expect(calculateDateRangeDays(start, end)).toBe(
                inclusiveDateSpanDays(start, end),
            );
        }
    });
});
