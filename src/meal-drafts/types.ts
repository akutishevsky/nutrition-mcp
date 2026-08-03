import type { StructuredMealItemInput } from "../structured-meals/types.js";

export type MealDraftStatus =
    | "open"
    | "awaiting_answers"
    | "awaiting_confirmation"
    | "confirmed"
    | "cancelled"
    | "expired";

export type MealDraftSourceMode =
    | "text"
    | "photo"
    | "barcode"
    | "restaurant"
    | "saved_food"
    | "history";

export interface MealDraftQuestion {
    id: string;
    itemId: string | null;
    questionKey: string;
    prompt: string;
    impactScore: number;
    status: "open" | "answered" | "accepted_assumption";
    answer: string | null;
    createdAt: string;
    answeredAt: string | null;
}

export interface MealDraftItem {
    id: string;
    position: number;
    item: StructuredMealItemInput;
    createdAt: string;
    updatedAt: string;
}

export interface MealDraft {
    id: string;
    userId: string;
    status: MealDraftStatus;
    sourceMode: MealDraftSourceMode;
    mealType: "breakfast" | "lunch" | "dinner" | "snack" | null;
    description: string | null;
    loggedAt: string | null;
    notes: string | null;
    version: number;
    expiresAt: string;
    confirmedMealId: string | null;
    createdAt: string;
    updatedAt: string;
    items: MealDraftItem[];
    questions: MealDraftQuestion[];
}
