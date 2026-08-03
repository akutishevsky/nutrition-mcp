import type { NutrientValues } from "../food-providers/types.js";

export type MealSourceType =
    | "usda"
    | "open_food_facts"
    | "published_restaurant"
    | "saved_food"
    | "past_meal"
    | "user_supplied"
    | "model_estimate"
    | "legacy_aggregate";

export interface StructuredMealItemInput {
    name: string;
    quantity?: number;
    portionLabel?: string;
    gramWeight?: number;
    nutrients: NutrientValues;
    sourceType: MealSourceType;
    provider?: string;
    providerFoodId?: string;
    providerRevision?: string;
    sourceUrl?: string;
    sourceUpdatedAt?: string;
    confidence?: number;
    assumptions?: string[];
    sourceSnapshot?: Record<string, unknown>;
}

export interface StructuredMealInput {
    description: string;
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    loggedAt?: string;
    notes?: string;
    idempotencyKey: string;
    items: StructuredMealItemInput[];
}

export interface StructuredMealItemRecord {
    id: string;
    mealId: string;
    userId: string;
    position: number;
    name: string;
    quantity: number | null;
    portionLabel: string | null;
    gramWeight: number | null;
    nutrients: NutrientValues;
    sourceType: MealSourceType;
    provider: string | null;
    providerFoodId: string | null;
    providerRevision: string | null;
    sourceUrl: string | null;
    sourceUpdatedAt: string | null;
    confidence: number | null;
    assumptions: string[];
    sourceSnapshot: Record<string, unknown>;
    createdAt: string;
}

export interface StructuredMealRecord {
    id: string;
    userId: string;
    loggedAt: string;
    mealType: string | null;
    description: string;
    calories: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
    fiberG: number | null;
    sugarG: number | null;
    alcoholG: number | null;
    notes: string | null;
    idempotencyKey: string | null;
    items: StructuredMealItemRecord[];
}

export interface StructuredMealInsertResult {
    meal: StructuredMealRecord;
    deduplicated: boolean;
}
