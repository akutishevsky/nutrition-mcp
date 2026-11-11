import { describe, expect, test } from "bun:test";
import {
    draftItemInputFromBody,
    enrichMealDraftForApp,
    mealDraftInputFromBody,
    serializeMealDraftForApp,
} from "./meal-draft-review.js";

describe("web meal draft review", () => {
    test("normalizes a website draft creation request", () => {
        expect(
            mealDraftInputFromBody({
                description: "Chicken burrito",
                meal_type: "dinner",
                logged_at: "2026-08-21T23:00:00.000Z",
                notes: "Restaurant estimate",
            }),
        ).toEqual({
            sourceMode: "text",
            mealType: "dinner",
            description: "Chicken burrito",
            loggedAt: "2026-08-21T23:00:00.000Z",
            notes: "Restaurant estimate",
        });
    });

    test("rejects unsupported draft creation fields", () => {
        expect(() => mealDraftInputFromBody({ source_mode: "voice" })).toThrow(
            "Meal draft source mode is invalid",
        );
        expect(() => mealDraftInputFromBody({ meal_type: "brunch" })).toThrow(
            "Meal draft meal type is invalid",
        );
    });

    test("normalizes editable item fields without filling missing nutrients", () => {
        expect(
            draftItemInputFromBody({
                name: "Toast",
                quantity: "2",
                portion_label: "slices",
                nutrients: { calories: "180", protein_g: 6 },
                source_type: "user_supplied",
            }),
        ).toEqual({
            name: "Toast",
            quantity: 2,
            portionLabel: "slices",
            gramWeight: undefined,
            nutrients: { calories: 180, protein_g: 6 },
            sourceType: "user_supplied",
            provider: undefined,
            providerFoodId: undefined,
            providerRevision: undefined,
            sourceUrl: undefined,
            sourceUpdatedAt: undefined,
            confidence: undefined,
            assumptions: [],
            sourceSnapshot: {},
        });
    });

    test("serializes provenance, questions, and totals for the website", () => {
        const result = serializeMealDraftForApp({
            id: "draft-1",
            userId: "user-1",
            status: "awaiting_confirmation",
            sourceMode: "photo",
            mealType: "lunch",
            description: "Plate",
            loggedAt: "2026-08-20T12:00:00.000Z",
            notes: null,
            version: 3,
            expiresAt: "2026-08-21T12:00:00.000Z",
            confirmedMealId: null,
            createdAt: "2026-08-20T11:00:00.000Z",
            updatedAt: "2026-08-20T11:30:00.000Z",
            items: [
                {
                    id: "item-1",
                    position: 0,
                    item: {
                        name: "Chicken",
                        nutrients: { calories: 400, protein_g: 35 },
                        sourceType: "model_estimate",
                        assumptions: ["Skin-on estimate"],
                        sourceSnapshot: { resolution_layer: "photo" },
                    },
                    createdAt: "2026-08-20T11:00:00.000Z",
                    updatedAt: "2026-08-20T11:00:00.000Z",
                },
            ],
            questions: [],
        });

        expect(result.totals).toEqual({ calories: 400, protein_g: 35 });
        expect(result.items[0]).toMatchObject({
            name: "Chicken",
            source_type: "model_estimate",
            source_snapshot: { resolution_layer: "photo" },
        });
        expect(result.assumptions).toEqual(["Skin-on estimate"]);
        expect(result.ready_for_confirmation).toBe(true);
    });

    test("enriches provider items with natural-first portions and leaves manual items free-text", async () => {
        const draft = {
            id: "draft-2",
            userId: "user-1",
            status: "open",
            sourceMode: "text",
            mealType: "lunch",
            description: "Milk and toast",
            loggedAt: null,
            notes: null,
            version: 1,
            expiresAt: null,
            confirmedMealId: null,
            createdAt: "2026-08-20T11:00:00.000Z",
            updatedAt: "2026-08-20T11:00:00.000Z",
            items: [
                {
                    id: "item-milk",
                    position: 0,
                    item: {
                        name: "Milk, whole",
                        nutrients: { calories: 15 },
                        sourceType: "usda" as const,
                        assumptions: [],
                        sourceSnapshot: { candidate_id: "usda:milk-1" },
                    },
                    createdAt: "2026-08-20T11:00:00.000Z",
                    updatedAt: "2026-08-20T11:00:00.000Z",
                },
                {
                    id: "item-manual",
                    position: 1,
                    item: {
                        name: "Homemade jam",
                        nutrients: { calories: 50 },
                        sourceType: "user_supplied" as const,
                        assumptions: [],
                        sourceSnapshot: {},
                    },
                    createdAt: "2026-08-20T11:00:00.000Z",
                    updatedAt: "2026-08-20T11:00:00.000Z",
                },
            ],
            questions: [],
        };
        const result = await enrichMealDraftForApp(
            draft as never,
            async () => ({
                provider: "usda",
                providerFoodId: "milk-1",
                name: "Milk, whole",
                dataKind: "generic",
                nutrientsPer100g: { calories: 61 },
                portions: [
                    {
                        id: "fl-oz",
                        amount: 1,
                        unit: "fl oz",
                        label: "1 fl oz",
                        gramWeight: 30.5,
                        nutrients: { calories: 19 },
                    },
                    {
                        id: "cup",
                        amount: 1,
                        unit: "cup",
                        label: "1 cup",
                        gramWeight: 244,
                        nutrients: { calories: 149 },
                    },
                ],
                attribution: { label: "USDA FoodData Central" },
                confidence: 0.9,
            }),
        );
        expect(result.items[0]?.candidate_id).toBe("usda:milk-1");
        expect(result.items[0]?.portions.map((portion) => portion.id)).toEqual([
            "cup",
            "fl-oz",
        ]);
        expect(result.items[1]?.candidate_id).toBeNull();
        expect(result.items[1]?.portions).toEqual([]);
    });
});
