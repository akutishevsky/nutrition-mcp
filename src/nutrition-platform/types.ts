import type { DrinkUnit } from "../alcohol.js";
import type { WeightUnit } from "../units.js";

export interface Meal {
    id: string;
    user_id: string;
    logged_at: string;
    meal_type: string | null;
    description: string;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    fiber_g: number | null;
    sugar_g: number | null;
    alcohol_g: number | null;
    notes: string | null;
    idempotency_key: string | null;
}

export interface MealInput {
    description: string;
    meal_type: "breakfast" | "lunch" | "dinner" | "snack";
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sugar_g?: number;
    alcohol_g?: number;
    logged_at?: string;
    notes?: string | null;
    idempotency_key?: string;
}

export interface MealInsertResult {
    meal: Meal;
    deduplicated: boolean;
}

export interface Profile {
    user_id: string;
    timezone: string;
    preferred_weight_unit: WeightUnit | null;
    widgets_enabled: boolean;
    alcohol_tracking_enabled: boolean;
    preferred_drink_unit: DrinkUnit | null;
    created_at: string;
    updated_at: string;
}

export interface ProfilePatch {
    timezone?: string;
    preferred_weight_unit?: WeightUnit | null;
    widgets_enabled?: boolean;
    alcohol_tracking_enabled?: boolean;
    preferred_drink_unit?: DrinkUnit | null;
}

export interface NutritionGoals {
    user_id: string;
    daily_calories: number | null;
    daily_protein_g: number | null;
    daily_carbs_g: number | null;
    daily_fat_g: number | null;
    daily_fiber_g: number | null;
    daily_sugar_g: number | null;
    daily_alcohol_g: number | null;
    daily_water_ml: number | null;
    target_weight_g: number | null;
    updated_at: string;
}

export interface NutritionGoalsInput {
    daily_calories?: number | null;
    daily_protein_g?: number | null;
    daily_carbs_g?: number | null;
    daily_fat_g?: number | null;
    daily_fiber_g?: number | null;
    daily_sugar_g?: number | null;
    daily_alcohol_g?: number | null;
    daily_water_ml?: number | null;
    target_weight_g?: number | null;
}

export interface WaterEntry {
    id: string;
    user_id: string;
    amount_ml: number;
    logged_at: string;
    notes: string | null;
    created_at: string;
    idempotency_key: string | null;
}

export interface WaterInput {
    amount_ml: number;
    logged_at?: string;
    notes?: string;
    idempotency_key?: string;
}

export interface WaterInsertResult {
    entry: WaterEntry;
    deduplicated: boolean;
}

export interface WeightEntry {
    id: string;
    user_id: string;
    weight_g: number;
    logged_at: string;
    notes: string | null;
    created_at: string;
    idempotency_key: string | null;
}

export interface WeightInput {
    weight_g: number;
    logged_at?: string;
    notes?: string;
    idempotency_key?: string;
}

export interface WeightInsertResult {
    entry: WeightEntry;
    deduplicated: boolean;
}
