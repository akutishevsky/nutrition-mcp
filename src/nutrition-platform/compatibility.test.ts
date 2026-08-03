import { describe, expect, test } from "bun:test";
import {
    mealIdempotencyKey as upstreamMealIdempotencyKey,
    type MealInput as UpstreamMealInput,
} from "../supabase.js";
import { mealIdempotencyKey } from "./meals.js";

describe("Railway nutrition compatibility", () => {
    test("preserves inherited meal idempotency keys", () => {
        const userId = "b9a67566-3730-4f0f-96c4-d3936e145cb4";
        const loggedAt = "2026-08-03T12:30:00.000Z";
        const input: UpstreamMealInput = {
            description: "Peanut butter sandwich and green apple",
            meal_type: "lunch",
            calories: 515.6,
            protein_g: 18,
            carbs_g: 68,
            fat_g: 22,
            fiber_g: 10,
            sugar_g: 24,
            alcohol_g: 0,
            notes: "confirmed",
            logged_at: loggedAt,
        };

        expect(mealIdempotencyKey(userId, input, loggedAt)).toBe(
            upstreamMealIdempotencyKey(userId, input, loggedAt),
        );
    });
});
