import * as inherited from "./inherited-supabase.js";
import * as railwayNutrition from "./nutrition-platform/index.js";
import * as railwayService from "./service-platform/repository.js";

export const railwayDataEnabled =
    process.env.MUNCH_RAILWAY_DATA_ENABLED === "true";

// Nutrition repository functions. Casts are intentional: the Railway
// implementation is tested against the inherited public contracts while keeping
// its database-specific types isolated from the MCP layer.
export const insertMeal: typeof inherited.insertMeal = railwayDataEnabled
    ? (railwayNutrition.insertMeal as typeof inherited.insertMeal)
    : inherited.insertMeal;
export const getMealsByDate: typeof inherited.getMealsByDate =
    railwayDataEnabled
        ? (railwayNutrition.getMealsByDate as typeof inherited.getMealsByDate)
        : inherited.getMealsByDate;
export const getMealsInRange: typeof inherited.getMealsInRange =
    railwayDataEnabled
        ? (railwayNutrition.getMealsInRange as typeof inherited.getMealsInRange)
        : inherited.getMealsInRange;
export const searchMeals: typeof inherited.searchMeals = railwayDataEnabled
    ? (railwayNutrition.searchMeals as typeof inherited.searchMeals)
    : inherited.searchMeals;
export const deleteMeal: typeof inherited.deleteMeal = railwayDataEnabled
    ? (railwayNutrition.deleteMeal as typeof inherited.deleteMeal)
    : inherited.deleteMeal;
export const updateMeal: typeof inherited.updateMeal = railwayDataEnabled
    ? (railwayNutrition.updateMeal as typeof inherited.updateMeal)
    : inherited.updateMeal;
export const deleteAllUserData: typeof inherited.deleteAllUserData =
    railwayDataEnabled
        ? (railwayNutrition.deleteAllUserData as typeof inherited.deleteAllUserData)
        : inherited.deleteAllUserData;
export const upsertNutritionGoals: typeof inherited.upsertNutritionGoals =
    railwayDataEnabled
        ? (railwayNutrition.upsertNutritionGoals as typeof inherited.upsertNutritionGoals)
        : inherited.upsertNutritionGoals;
export const getNutritionGoals: typeof inherited.getNutritionGoals =
    railwayDataEnabled
        ? (railwayNutrition.getNutritionGoals as typeof inherited.getNutritionGoals)
        : inherited.getNutritionGoals;
export const insertWater: typeof inherited.insertWater = railwayDataEnabled
    ? (railwayNutrition.insertWater as typeof inherited.insertWater)
    : inherited.insertWater;
export const getWaterByDate: typeof inherited.getWaterByDate =
    railwayDataEnabled
        ? (railwayNutrition.getWaterByDate as typeof inherited.getWaterByDate)
        : inherited.getWaterByDate;
export const getWaterInRange: typeof inherited.getWaterInRange =
    railwayDataEnabled
        ? (railwayNutrition.getWaterInRange as typeof inherited.getWaterInRange)
        : inherited.getWaterInRange;
export const deleteWater: typeof inherited.deleteWater = railwayDataEnabled
    ? (railwayNutrition.deleteWater as typeof inherited.deleteWater)
    : inherited.deleteWater;
export const insertWeight: typeof inherited.insertWeight = railwayDataEnabled
    ? (railwayNutrition.insertWeight as typeof inherited.insertWeight)
    : inherited.insertWeight;
export const getWeightByDate: typeof inherited.getWeightByDate =
    railwayDataEnabled
        ? (railwayNutrition.getWeightByDate as typeof inherited.getWeightByDate)
        : inherited.getWeightByDate;
export const getWeightInRange: typeof inherited.getWeightInRange =
    railwayDataEnabled
        ? (railwayNutrition.getWeightInRange as typeof inherited.getWeightInRange)
        : inherited.getWeightInRange;
export const getLatestWeight: typeof inherited.getLatestWeight =
    railwayDataEnabled
        ? (railwayNutrition.getLatestWeight as typeof inherited.getLatestWeight)
        : inherited.getLatestWeight;
export const updateWeight: typeof inherited.updateWeight = railwayDataEnabled
    ? (railwayNutrition.updateWeight as typeof inherited.updateWeight)
    : inherited.updateWeight;
export const deleteWeight: typeof inherited.deleteWeight = railwayDataEnabled
    ? (railwayNutrition.deleteWeight as typeof inherited.deleteWeight)
    : inherited.deleteWeight;
export const getUserTimezone: typeof inherited.getUserTimezone =
    railwayDataEnabled
        ? (railwayNutrition.getUserTimezone as typeof inherited.getUserTimezone)
        : inherited.getUserTimezone;
export const getPreferredWeightUnit: typeof inherited.getPreferredWeightUnit =
    railwayDataEnabled
        ? (railwayNutrition.getPreferredWeightUnit as typeof inherited.getPreferredWeightUnit)
        : inherited.getPreferredWeightUnit;
export const getWidgetsEnabled: typeof inherited.getWidgetsEnabled =
    railwayDataEnabled
        ? (railwayNutrition.getWidgetsEnabled as typeof inherited.getWidgetsEnabled)
        : inherited.getWidgetsEnabled;
export const getAlcoholTrackingEnabled: typeof inherited.getAlcoholTrackingEnabled =
    railwayDataEnabled
        ? (railwayNutrition.getAlcoholTrackingEnabled as typeof inherited.getAlcoholTrackingEnabled)
        : inherited.getAlcoholTrackingEnabled;
export const getPreferredDrinkUnit: typeof inherited.getPreferredDrinkUnit =
    railwayDataEnabled
        ? (railwayNutrition.getPreferredDrinkUnit as typeof inherited.getPreferredDrinkUnit)
        : inherited.getPreferredDrinkUnit;
export const widgetsEnabledFromProfile: typeof inherited.widgetsEnabledFromProfile =
    railwayDataEnabled
        ? (railwayNutrition.widgetsEnabledFromProfile as typeof inherited.widgetsEnabledFromProfile)
        : inherited.widgetsEnabledFromProfile;
export const alcoholTrackingEnabledFromProfile: typeof inherited.alcoholTrackingEnabledFromProfile =
    railwayDataEnabled
        ? (railwayNutrition.alcoholTrackingEnabledFromProfile as typeof inherited.alcoholTrackingEnabledFromProfile)
        : inherited.alcoholTrackingEnabledFromProfile;
export const preferredDrinkUnitFromProfile: typeof inherited.preferredDrinkUnitFromProfile =
    railwayDataEnabled
        ? (railwayNutrition.preferredDrinkUnitFromProfile as typeof inherited.preferredDrinkUnitFromProfile)
        : inherited.preferredDrinkUnitFromProfile;
export const upsertProfile: typeof inherited.upsertProfile = railwayDataEnabled
    ? (railwayNutrition.upsertProfile as typeof inherited.upsertProfile)
    : inherited.upsertProfile;
export const getProfile: typeof inherited.getProfile = railwayDataEnabled
    ? (railwayNutrition.getProfile as typeof inherited.getProfile)
    : inherited.getProfile;
export const countMeals: typeof inherited.countMeals = railwayDataEnabled
    ? (railwayNutrition.countMeals as typeof inherited.countMeals)
    : inherited.countMeals;
export const existingIdempotencyKeys: typeof inherited.existingIdempotencyKeys =
    railwayDataEnabled
        ? (railwayNutrition.existingIdempotencyKeys as typeof inherited.existingIdempotencyKeys)
        : inherited.existingIdempotencyKeys;
export const getAllMeals: typeof inherited.getAllMeals = railwayDataEnabled
    ? (railwayNutrition.getAllMeals as typeof inherited.getAllMeals)
    : inherited.getAllMeals;

// Global service facilities.
export async function getCachedFood<T>(
    source: string,
    sourceId: string,
): Promise<T | null> {
    if (railwayDataEnabled) {
        return (await railwayService.getCachedFood(
            source,
            sourceId,
        )) as T | null;
    }
    return inherited.getCachedFood(source, sourceId) as Promise<T | null>;
}

export function cacheFood(
    source: string,
    sourceId: string,
    payload: unknown,
): Promise<void> {
    return railwayDataEnabled
        ? railwayService.cacheFood(source, sourceId, payload)
        : inherited.cacheFood(source, sourceId, payload);
}

export function insertToolAnalytics(row: {
    user_id: string;
    tool_name: string;
    success: boolean;
    duration_ms: number;
    error_category?: string;
    date_range_days?: number;
    mcp_session_id?: string;
}): Promise<void> {
    return railwayDataEnabled
        ? railwayService.insertToolAnalytics(row)
        : inherited.insertToolAnalytics(row);
}

export async function getLandingStats(): Promise<inherited.LandingStats> {
    return railwayDataEnabled
        ? ((await railwayService.getLandingStats()) as unknown as inherited.LandingStats)
        : inherited.getLandingStats();
}

export type {
    LandingStats,
    Meal,
    MealInput,
    NutritionGoals,
    Profile,
    WaterEntry,
    WeightEntry,
} from "./inherited-supabase.js";

export type { CountryStat } from "./service-platform/repository.js";
