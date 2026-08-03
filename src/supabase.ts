// Compatibility facade for inherited imports.
//
// Existing MCP, food lookup, analytics, and landing-page modules import from
// `./supabase.js`. Keep that stable import path while selecting all data-plane
// operations coherently through `storage.ts`. Legacy Supabase authentication
// helpers remain available only for rollback mode until the final removal PR.
export * from "./inherited-supabase.js";

export {
    railwayDataEnabled,
    insertMeal,
    getMealsByDate,
    getMealsInRange,
    searchMeals,
    deleteMeal,
    updateMeal,
    deleteAllUserData,
    upsertNutritionGoals,
    getNutritionGoals,
    insertWater,
    getWaterByDate,
    getWaterInRange,
    deleteWater,
    insertWeight,
    getWeightByDate,
    getWeightInRange,
    getLatestWeight,
    updateWeight,
    deleteWeight,
    getUserTimezone,
    getPreferredWeightUnit,
    getWidgetsEnabled,
    getAlcoholTrackingEnabled,
    getPreferredDrinkUnit,
    widgetsEnabledFromProfile,
    alcoholTrackingEnabledFromProfile,
    preferredDrinkUnitFromProfile,
    upsertProfile,
    getProfile,
    countMeals,
    existingIdempotencyKeys,
    getAllMeals,
    getCachedFood,
    cacheFood,
    insertToolAnalytics,
    getLandingStats,
} from "./storage.js";
