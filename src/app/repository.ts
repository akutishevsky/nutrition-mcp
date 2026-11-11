import {
    resolveMunchCapabilities,
    type MunchCapabilitySurface,
} from "../billing/capabilities.js";
import { resolveAndroidEntitlements } from "../billing/android-entitlements.js";
import {
    getActiveHouseholdContext,
    listHouseholdMembers,
} from "../households/repository.js";
import {
    buildNutritionRangeContract,
    inclusiveDateSpanDays,
    sumNutrition,
    validateLocalDate,
} from "../nutrition-contract.js";
import {
    buildDailyBuckets,
    computeMealPatterns,
    computeTrends,
    computeWeightTrend,
    computeWeeklyDigest,
} from "../insights.js";
import { getNutritionProvenanceAnalysis } from "../nutrition-provenance.js";
import { withUserDatabase } from "../platform/database.js";
import {
    getGroceryList,
    getMealPlan,
    getRecipe,
    searchRecipes,
} from "../planning/repository.js";
import { getAdsConfig } from "../ads-config.js";
import { getPublicProductPolicy } from "../product-config.js";
import { listSavedFoods } from "../saved-foods/repository.js";
import { groupMealVariations } from "../search.js";
import {
    getMealsByDate,
    getMealsInRange,
    getLatestWeight,
    getNutritionGoals,
    getProfile,
    getPreferredWeightUnit,
    searchMeals,
    getWaterByDate,
    getWaterInRange,
    getWeightInRange,
    getWeightByDate,
    type Meal,
} from "../storage.js";
import {
    dateInTz,
    shiftLocalDate,
    zonedDayStartUtc,
    zonedNextDayStartUtc,
} from "../tz.js";
import {
    buildTrendsCard,
    buildTrendsDays,
    rankDayContributors,
    rankPeriodContributors,
    trendsReferenceFor,
    TRENDS_CATALOG,
    TRENDS_NUTRIENT_BY_KEY,
    type TrendsMealInput,
} from "../trends.js";
import { getTrendsDashboardLayout } from "../trends-layout.js";
import { fromGrams } from "../units.js";

export interface AppMealItem {
    id: string;
    mealId: string;
    position: number;
    name: string;
    quantity: number | null;
    portionLabel: string | null;
    gramWeight: number | null;
    calories: number | null;
    proteinG: number | null;
    carbsG: number | null;
    fatG: number | null;
    fiberG: number | null;
    sugarG: number | null;
    alcoholG: number | null;
    sodiumMg: number | null;
    saturatedFatG: number | null;
    cholesterolMg: number | null;
    potassiumMg: number | null;
    sourceType: string;
    provider: string | null;
    providerFoodId: string | null;
    sourceUrl: string | null;
    sourceUpdatedAt: string | null;
    confidence: number | null;
    assumptions: string[];
}

export interface AppMeal extends Meal {
    items: AppMealItem[];
}

function numeric(value: unknown): number | null {
    return value == null ? null : Number(value);
}

async function listMealItems(
    userId: string,
    mealIds: string[],
): Promise<AppMealItem[]> {
    if (mealIds.length === 0) return [];
    const idJson = JSON.stringify(mealIds);
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select
                id, meal_id, position, name, quantity, portion_label, gram_weight,
                calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, alcohol_g,
                sodium_mg, saturated_fat_g, cholesterol_mg, potassium_mg,
                source_type, provider, provider_food_id, source_url,
                source_updated_at, confidence, assumptions
            from munch.meal_items
            where meal_id in (
                select value::uuid
                from jsonb_array_elements_text((${idJson}::text)::jsonb)
            )
            order by meal_id, position
        `;
        return rows.map((row) => ({
            id: String(row.id),
            mealId: String(row.meal_id),
            position: Number(row.position),
            name: String(row.name),
            quantity: numeric(row.quantity),
            portionLabel:
                row.portion_label == null ? null : String(row.portion_label),
            gramWeight: numeric(row.gram_weight),
            calories: numeric(row.calories),
            proteinG: numeric(row.protein_g),
            carbsG: numeric(row.carbs_g),
            fatG: numeric(row.fat_g),
            fiberG: numeric(row.fiber_g),
            sugarG: numeric(row.sugar_g),
            alcoholG: numeric(row.alcohol_g),
            sodiumMg: numeric(row.sodium_mg),
            saturatedFatG: numeric(row.saturated_fat_g),
            cholesterolMg: numeric(row.cholesterol_mg),
            potassiumMg: numeric(row.potassium_mg),
            sourceType: String(row.source_type),
            provider: row.provider == null ? null : String(row.provider),
            providerFoodId:
                row.provider_food_id == null
                    ? null
                    : String(row.provider_food_id),
            sourceUrl: row.source_url == null ? null : String(row.source_url),
            sourceUpdatedAt:
                row.source_updated_at == null
                    ? null
                    : new Date(String(row.source_updated_at)).toISOString(),
            confidence: numeric(row.confidence),
            assumptions: Array.isArray(row.assumptions)
                ? row.assumptions.map(String)
                : [],
        }));
    });
}

async function attachItems(userId: string, meals: Meal[]): Promise<AppMeal[]> {
    const items = await listMealItems(
        userId,
        meals.map((meal) => meal.id),
    );
    const byMeal = new Map<string, AppMealItem[]>();
    for (const item of items) {
        const group = byMeal.get(item.mealId) ?? [];
        group.push(item);
        byMeal.set(item.mealId, group);
    }
    return meals.map((meal) => ({
        ...meal,
        items: byMeal.get(meal.id) ?? [],
    }));
}

async function listOpenDrafts(userId: string) {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select
                draft.id, draft.status, draft.source_mode, draft.meal_type,
                draft.description, draft.logged_at, draft.notes, draft.version,
                draft.expires_at, draft.updated_at,
                count(distinct item.id)::integer as item_count,
                count(distinct question.id)
                    filter (where question.status = 'open')::integer
                    as open_question_count
            from munch.meal_drafts draft
            left join munch.meal_draft_items item on item.draft_id = draft.id
            left join munch.meal_draft_questions question
                on question.draft_id = draft.id
            where draft.status in (
                'open',
                'awaiting_answers',
                'awaiting_confirmation'
            )
              and draft.expires_at > now()
            group by draft.id
            order by draft.updated_at desc
            limit 10
        `;
        return rows.map((row) => ({
            id: String(row.id),
            status: String(row.status),
            sourceMode: String(row.source_mode),
            mealType: row.meal_type == null ? null : String(row.meal_type),
            description:
                row.description == null ? null : String(row.description),
            loggedAt:
                row.logged_at == null
                    ? null
                    : new Date(String(row.logged_at)).toISOString(),
            notes: row.notes == null ? null : String(row.notes),
            version: Number(row.version),
            itemCount: Number(row.item_count),
            openQuestionCount: Number(row.open_question_count),
            expiresAt: new Date(String(row.expires_at)).toISOString(),
            updatedAt: new Date(String(row.updated_at)).toISOString(),
        }));
    });
}

export async function getAppBootstrap(
    userId: string,
    email: string,
    surface: MunchCapabilitySurface = "web",
) {
    const [profile, capabilities, household, androidEntitlements] =
        await Promise.all([
            getProfile(userId),
            resolveMunchCapabilities(userId, surface),
            getActiveHouseholdContext(userId),
            resolveAndroidEntitlements(userId),
        ]);
    return {
        user: { id: userId, email },
        profile,
        productPolicy: getPublicProductPolicy(),
        capabilities: {
            tier: capabilities.tier,
            entitlementSource: capabilities.entitlementSource,
            historyDays: capabilities.historyDays,
            // Saved foods are uncapped for every tier (CAP-LIFT,
            // 2026-11-09); the key stays so existing clients keep
            // reading an explicit null limit.
            savedFoodLimit: null,
            recipes:
                capabilities.personalRecipesRead || capabilities.householdRead,
            recipeWrite: capabilities.personalRecipesWrite,
            householdRecipeWrite:
                Boolean(capabilities.household) && capabilities.householdWrite,
            householdCookWrite:
                Boolean(capabilities.household) && capabilities.householdWrite,
            planning:
                capabilities.personalPlanningRead || capabilities.householdRead,
            household: capabilities.householdRead,
            householdManage: capabilities.householdManage,
        },
        androidEntitlements,
        // ADS-FOUNDATION: the server-driven ads flag (env
        // MUNCH_ADS_ENABLED, DEFAULT OFF — see src/ads-config.ts).
        // The packaged app reads bootstrap.ads.enabled; the native
        // ads plugin additionally fail-closes on Premium (adFree).
        ads: getAdsConfig(),
        household,
    };
}

export async function getTodayWorkspace(
    userId: string,
    dateValue: string,
    surface: MunchCapabilitySurface = "web",
) {
    const date = validateLocalDate(dateValue);
    const [profile, capabilities] = await Promise.all([
        getProfile(userId),
        resolveMunchCapabilities(userId, surface),
    ]);
    const timezone = profile?.timezone ?? "UTC";
    const [meals, goals, water, weight, drafts, plannedMeals] =
        await Promise.all([
            getMealsByDate(userId, date, timezone),
            getNutritionGoals(userId),
            getWaterByDate(userId, date, timezone),
            getWeightByDate(userId, date, timezone),
            listOpenDrafts(userId),
            capabilities.personalPlanningRead || capabilities.householdRead
                ? getMealPlan({
                      userId,
                      startDate: date,
                      endDate: date,
                      scope: "all",
                  })
                : Promise.resolve([]),
        ]);
    return {
        date,
        timezone,
        totals: sumNutrition(meals),
        meals: await attachItems(userId, meals),
        goals,
        water: {
            totalMl: water.reduce((sum, entry) => sum + entry.amount_ml, 0),
            entries: water,
        },
        weight,
        drafts,
        plannedMeals,
    };
}

export async function getMealHistoryWorkspace(
    userId: string,
    startValue: string,
    endValue: string,
    options: { query?: string } = {},
) {
    const startDate = validateLocalDate(startValue);
    const endDate = validateLocalDate(endValue);
    if (inclusiveDateSpanDays(startDate, endDate) > 366) {
        throw new Error("Date range is too large");
    }
    const profile = await getProfile(userId);
    const timezone = profile?.timezone ?? "UTC";
    const query = options.query?.trim() ?? "";
    const meals = query
        ? await searchMeals(userId, [query], {
              limit: 200,
              sinceIso: zonedDayStartUtc(startDate, timezone).toISOString(),
              untilIso: zonedNextDayStartUtc(endDate, timezone).toISOString(),
          })
        : await getMealsInRange(userId, startDate, endDate, timezone);
    const variations = query
        ? groupMealVariations(meals).map((variation) => ({
              key: variation.key,
              label: variation.label,
              count: variation.count,
              lastLoggedAt: variation.lastLoggedAt,
              typicalCalories: variation.typicalCalories,
              typicalProteinG: variation.typicalProteinG,
              typicalCarbsG: variation.typicalCarbsG,
              typicalFatG: variation.typicalFatG,
          }))
        : [];
    return {
        startDate,
        endDate,
        timezone,
        totals: sumNutrition(meals),
        meals: await attachItems(userId, meals),
        search: query
            ? {
                  query,
                  resultCount: meals.length,
                  variations,
              }
            : null,
    };
}

/**
 * Personal saved-food workspace used by the website manager and legacy clients.
 * The old standalone /app/foods URL still redirects to the Food Log, but the
 * authenticated API remains the canonical saved-food read model.
 */
export async function getFoodsWorkspace(
    userId: string,
    surface: MunchCapabilitySurface = "web",
) {
    const foods = await listSavedFoods(userId, 200);
    return {
        deprecated: true,
        replacement: "/app/log",
        // Saved foods are uncapped for every tier (CAP-LIFT, 2026-11-09).
        limit: null,
        total: foods.length,
        foods,
    };
}

export async function getInsightsWorkspace(
    userId: string,
    startValue: string,
    endValue: string,
) {
    const startDate = validateLocalDate(startValue);
    const endDate = validateLocalDate(endValue);
    const dayCount = inclusiveDateSpanDays(startDate, endDate);
    if (dayCount > 366) throw new Error("Date range is too large");
    const [profile, goals] = await Promise.all([
        getProfile(userId),
        getNutritionGoals(userId),
    ]);
    const timezone = profile?.timezone ?? "UTC";
    const [meals, water, weightEntries, latestWeight, weightUnit] =
        await Promise.all([
            getMealsInRange(userId, startDate, endDate, timezone),
            getWaterInRange(userId, startDate, endDate, timezone),
            getWeightInRange(userId, startDate, endDate, timezone),
            getLatestWeight(userId),
            getPreferredWeightUnit(userId),
        ]);
    const displayMeals = profile?.alcohol_tracking_enabled
        ? meals
        : meals.map((meal) => ({ ...meal, alcohol_g: 0 }));
    const range = buildNutritionRangeContract({
        meals: displayMeals,
        startDate,
        endDate,
        timezone,
        goals,
    });
    const buckets = buildDailyBuckets(
        displayMeals,
        water,
        startDate,
        endDate,
        timezone,
    );
    const progressDay = buckets.find((bucket) => bucket.date === endDate) ?? {
        date: endDate,
        meals: [],
        waterMl: 0,
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        alcohol_g: 0,
        mealTypes: new Set<string>(),
    };
    const progressMeals = progressDay.meals.map((meal) => ({
        description: meal.description,
        meal_type: meal.meal_type,
        date: dateInTz(meal.logged_at, timezone),
        calories: Math.round(meal.calories ?? 0),
        protein_g: Math.round((meal.protein_g ?? 0) * 10) / 10,
        carbs_g: Math.round((meal.carbs_g ?? 0) * 10) / 10,
        fat_g: Math.round((meal.fat_g ?? 0) * 10) / 10,
        fiber_g: Math.round((meal.fiber_g ?? 0) * 10) / 10,
        sugar_g: Math.round((meal.sugar_g ?? 0) * 10) / 10,
        alcohol_g: Math.round((meal.alcohol_g ?? 0) * 10) / 10,
    }));
    const displayUnit = weightUnit ?? "kg";
    const weightDaysByDate = new Map<
        string,
        { total: number; count: number }
    >();
    for (const entry of weightEntries) {
        const date = dateInTz(entry.logged_at, timezone);
        const current = weightDaysByDate.get(date) ?? { total: 0, count: 0 };
        current.total += entry.weight_g;
        current.count += 1;
        weightDaysByDate.set(date, current);
    }
    const weightDays = [...weightDaysByDate.entries()]
        .map(([date, values]) => ({
            date,
            weight: fromGrams(values.total / values.count, displayUnit),
        }))
        .sort((left, right) => left.date.localeCompare(right.date));
    const weightHistory = weightEntries.map((entry) => ({
        id: entry.id,
        value: fromGrams(entry.weight_g, displayUnit),
        unit: displayUnit,
        loggedAt: entry.logged_at,
        loggedOn: dateInTz(entry.logged_at, timezone),
        notes: entry.notes,
    }));
    const weightTarget = goals?.target_weight_g ?? null;
    const weight =
        latestWeight || goals?.target_weight_g != null
            ? {
                  current: latestWeight
                      ? fromGrams(latestWeight.weight_g, displayUnit)
                      : null,
                  target:
                      goals?.target_weight_g != null
                          ? fromGrams(goals.target_weight_g, displayUnit)
                          : null,
                  unit: displayUnit,
                  loggedOn: latestWeight
                      ? dateInTz(latestWeight.logged_at, timezone)
                      : null,
              }
            : null;
    const provenance = await getNutritionProvenanceAnalysis(
        userId,
        startDate,
        endDate,
        timezone,
    );
    const trendDays = buckets.map((bucket) => ({
        date: bucket.date,
        mealCount: bucket.meals.length,
        hasLog: bucket.meals.length > 0 || bucket.waterMl > 0,
        mealTypes: [...bucket.mealTypes],
        totals: {
            calories: Math.round(bucket.calories),
            proteinG: Math.round(bucket.protein_g * 10) / 10,
            carbsG: Math.round(bucket.carbs_g * 10) / 10,
            fatG: Math.round(bucket.fat_g * 10) / 10,
            fiberG: Math.round(bucket.fiber_g * 10) / 10,
            sugarG: Math.round(bucket.sugar_g * 10) / 10,
            alcoholG: Math.round(bucket.alcohol_g * 10) / 10,
            waterMl: bucket.waterMl,
        },
    }));
    return {
        ...range,
        progress: {
            date: endDate,
            mealCount: progressMeals.length,
            waterEntries: water.filter(
                (entry) => dateInTz(entry.logged_at, timezone) === endDate,
            ).length,
            goals,
            totals: {
                calories: Math.round(progressDay.calories),
                proteinG: Math.round(progressDay.protein_g * 10) / 10,
                carbsG: Math.round(progressDay.carbs_g * 10) / 10,
                fatG: Math.round(progressDay.fat_g * 10) / 10,
                fiberG: Math.round(progressDay.fiber_g * 10) / 10,
                sugarG: Math.round(progressDay.sugar_g * 10) / 10,
                alcoholG: Math.round(progressDay.alcohol_g * 10) / 10,
                waterMl: progressDay.waterMl,
            },
            weight,
            meals: progressMeals,
        },
        trends: {
            endDate,
            defaultRange: [7, 14, 30].includes(dayCount) ? dayCount : 30,
            narrative: computeTrends(buckets, goals),
            days: trendDays,
        },
        patterns: {
            narrative: computeMealPatterns(buckets, timezone),
        },
        vitals: {
            water: {
                totalMl: water.reduce((sum, entry) => sum + entry.amount_ml, 0),
                entries: water.map((entry) => ({
                    id: entry.id,
                    amountMl: entry.amount_ml,
                    loggedAt: entry.logged_at,
                    loggedOn: dateInTz(entry.logged_at, timezone),
                    notes: entry.notes,
                })),
            },
            weight: {
                unit: displayUnit,
                target:
                    weightTarget == null
                        ? null
                        : fromGrams(weightTarget, displayUnit),
                defaultRange: [7, 14, 30].includes(dayCount) ? dayCount : 30,
                days: weightDays,
                entries: weightHistory,
                narrative: computeWeightTrend(
                    weightEntries,
                    startDate,
                    endDate,
                    timezone,
                    weightTarget,
                    displayUnit,
                ),
            },
        },
        provenance: {
            coverage: {
                mealCount: provenance.coverage.mealCount,
                structuredMealCount: provenance.coverage.structuredMealCount,
                legacyMealCount: provenance.coverage.legacyMealCount,
                itemCount: provenance.coverage.itemCount,
                totalCalories: provenance.coverage.totalCalories,
                itemizedCalories: provenance.coverage.itemizedCalories,
                itemizedCaloriePercent:
                    provenance.coverage.itemizedCaloriePercent,
            },
            sources: provenance.sources,
            confidence: provenance.confidence,
            contributors: provenance.contributors,
        },
    };
}

export async function getPlanningWorkspace(
    userId: string,
    startValue: string,
    endValue: string,
    surface: MunchCapabilitySurface = "web",
) {
    const startDate = validateLocalDate(startValue);
    const endDate = validateLocalDate(endValue);
    if (inclusiveDateSpanDays(startDate, endDate) > 62) {
        throw new Error("Date range is too large");
    }
    const capabilities = await resolveMunchCapabilities(userId, surface);
    const household = capabilities.household;
    const canRead =
        capabilities.personalPlanningRead || capabilities.householdRead;
    if (!canRead) {
        return {
            available: false,
            recipes: [],
            plannedMeals: [],
            groceries: [],
        };
    }
    const [recipes, plannedMeals, personalGroceries, householdGroceries] =
        await Promise.all([
            searchRecipes({ userId, scope: "all", limit: 50 }),
            getMealPlan({
                userId,
                startDate,
                endDate,
                scope: "all",
            }),
            capabilities.personalPlanningRead
                ? getGroceryList({
                      userId,
                      scope: { type: "personal" },
                      includePurchased: true,
                  })
                : Promise.resolve({ groceryListId: null, items: [] }),
            capabilities.householdRead && household
                ? getGroceryList({
                      userId,
                      scope: {
                          type: "household",
                          householdId: household.householdId,
                      },
                      includePurchased: true,
                  })
                : Promise.resolve({ groceryListId: null, items: [] }),
        ]);
    return {
        available: true,
        permissions: {
            personal: capabilities.personalPlanningWrite,
            household: Boolean(household) && capabilities.householdWrite,
            householdRole: household?.role ?? null,
        },
        recipes,
        plannedMeals,
        groceries: [
            { scope: "personal", ...personalGroceries },
            ...(household
                ? [{ scope: "household", ...householdGroceries }]
                : []),
        ],
    };
}

export async function getRecipeWorkspace(
    userId: string,
    recipeId: string,
    revisionId?: string,
    surface: MunchCapabilitySurface = "web",
) {
    const capabilities = await resolveMunchCapabilities(userId, surface);
    const canRead =
        capabilities.personalRecipesRead || capabilities.householdRead;
    if (!canRead) return { available: false, recipe: null };
    return {
        available: true,
        recipe: await getRecipe(userId, recipeId, revisionId),
    };
}

export async function getHouseholdWorkspace(userId: string) {
    const context = await getActiveHouseholdContext(userId);
    if (!context) return { household: null, members: [] };
    return {
        household: context,
        members: await listHouseholdMembers(userId, context.householdId),
    };
}

// ------------------------------------------------------------- Trends
// The customizable analytics dashboard (trends-brief T1–T14). Card
// computation lives in src/trends.ts; this layer loads the doubled
// window (the selected range plus the equal-length period before it,
// which goal-less verdicts compare against), the stored layout, and
// the digest narratives the retired Insights view used to render —
// nothing Insights computed is lost (T8).

function trendsMealInput(
    meal: AppMeal,
    alcoholEnabled: boolean,
): TrendsMealInput {
    return {
        id: meal.id,
        description: meal.description,
        mealType: meal.meal_type,
        loggedAt: meal.logged_at,
        items: meal.items.map((item) => ({
            name: item.name,
            values: {
                calories: item.calories,
                protein_g: item.proteinG,
                carbs_g: item.carbsG,
                fat_g: item.fatG,
                fiber_g: item.fiberG,
                sugar_g: item.sugarG,
                alcohol_g: alcoholEnabled ? item.alcoholG : 0,
                saturated_fat_g: item.saturatedFatG,
                sodium_mg: item.sodiumMg,
                potassium_mg: item.potassiumMg,
                cholesterol_mg: item.cholesterolMg,
            },
        })),
    };
}

export async function getTrendsWorkspace(
    userId: string,
    startValue: string,
    endValue: string,
) {
    const startDate = validateLocalDate(startValue);
    const endDate = validateLocalDate(endValue);
    const rangeDays = inclusiveDateSpanDays(startDate, endDate);
    if (rangeDays > 366) throw new Error("Date range is too large");
    const previousStart = shiftLocalDate(startDate, -rangeDays);
    const previousEnd = shiftLocalDate(startDate, -1);
    const [profile, goals] = await Promise.all([
        getProfile(userId),
        getNutritionGoals(userId),
    ]);
    const timezone = profile?.timezone ?? "UTC";
    const alcoholEnabled = profile?.alcohol_tracking_enabled ?? false;
    const [meals, water, weightEntries, weightUnit, layout] = await Promise.all(
        [
            getMealsInRange(userId, previousStart, endDate, timezone),
            getWaterInRange(userId, previousStart, endDate, timezone),
            getWeightInRange(userId, startDate, endDate, timezone),
            getPreferredWeightUnit(userId),
            getTrendsDashboardLayout(userId),
        ],
    );
    const displayMeals = alcoholEnabled
        ? meals
        : meals.map((meal) => ({ ...meal, alcohol_g: 0 }));
    const mealsWithItems = await attachItems(userId, displayMeals);
    const allBuckets = buildDailyBuckets(
        displayMeals,
        water,
        previousStart,
        endDate,
        timezone,
    );
    const buckets = allBuckets.filter((bucket) => bucket.date >= startDate);
    const previousBuckets = allBuckets.filter(
        (bucket) => bucket.date < startDate,
    );
    const trendsInputs = mealsWithItems.map((meal) =>
        trendsMealInput(meal, alcoholEnabled),
    );
    const inWindow = (meal: TrendsMealInput, start: string, end: string) => {
        const date = dateInTz(meal.loggedAt, timezone);
        return date >= start && date <= end;
    };
    const days = buildTrendsDays(
        buckets,
        trendsInputs.filter((meal) => inWindow(meal, startDate, endDate)),
        timezone,
    );
    const previousDays = buildTrendsDays(
        previousBuckets,
        trendsInputs.filter((meal) =>
            inWindow(meal, previousStart, previousEnd),
        ),
        timezone,
    );
    const ctx = {
        days,
        previousDays,
        buckets,
        previousBuckets,
        weightEntries,
        weightUnit: weightUnit ?? "kg",
        goals,
        rangeDays,
        timezone,
        alcoholTrackingEnabled: alcoholEnabled,
    };
    return {
        startDate,
        endDate,
        rangeDays,
        timezone,
        weightUnit: weightUnit ?? "kg",
        alcoholTrackingEnabled: alcoholEnabled,
        layout,
        catalog: TRENDS_CATALOG,
        cards: layout.cards.map((ref) => buildTrendsCard(ref, ctx)),
        digest: {
            weekly: computeWeeklyDigest(buckets.slice(-7), goals),
            trends: computeTrends(buckets, goals),
            patterns: computeMealPatterns(buckets, timezone),
        },
    };
}

/** One day's drill-down (T11): the day's meals → items ranked by their
 * contribution to the tapped metric, plus the reference the card judged
 * against and a plain day summary for the consistency/weight sheets. */
export async function getTrendsDayDetail(
    userId: string,
    dateValue: string,
    metric: string,
) {
    const date = validateLocalDate(dateValue);
    const [profile, goals] = await Promise.all([
        getProfile(userId),
        getNutritionGoals(userId),
    ]);
    const timezone = profile?.timezone ?? "UTC";
    const alcoholEnabled = profile?.alcohol_tracking_enabled ?? false;
    const [meals, water, weightEntries, weightUnit] = await Promise.all([
        getMealsByDate(userId, date, timezone),
        getWaterByDate(userId, date, timezone),
        getWeightByDate(userId, date, timezone),
        getPreferredWeightUnit(userId),
    ]);
    const displayMeals = alcoholEnabled
        ? meals
        : meals.map((meal) => ({ ...meal, alcohol_g: 0 }));
    const mealsWithItems = await attachItems(userId, displayMeals);
    const summary = {
        calories: Math.round(
            displayMeals.reduce((sum, meal) => sum + (meal.calories ?? 0), 0),
        ),
        proteinG:
            Math.round(
                displayMeals.reduce(
                    (sum, meal) => sum + (meal.protein_g ?? 0),
                    0,
                ) * 10,
            ) / 10,
        mealCount: displayMeals.length,
        waterMl: water.reduce((sum, entry) => sum + entry.amount_ml, 0),
    };
    if (metric === "weight") {
        return {
            date,
            metric,
            kind: "weight" as const,
            summary,
            weight: {
                unit: weightUnit ?? "kg",
                entries: weightEntries.map((entry) => ({
                    value: fromGrams(entry.weight_g, weightUnit ?? "kg"),
                    loggedAt: entry.logged_at,
                    notes: entry.notes,
                })),
            },
            meals: [],
            total: null,
            reference: null,
        };
    }
    const nutrient = TRENDS_NUTRIENT_BY_KEY.get(metric);
    if (!nutrient) throw new Error(`Unknown trends metric: ${metric}`);
    const inputs = mealsWithItems.map((meal) =>
        trendsMealInput(meal, alcoholEnabled),
    );
    const ranked = rankDayContributors(inputs, metric);
    const headlineKeys = new Set([
        "calories",
        "protein_g",
        "carbs_g",
        "fat_g",
        "fiber_g",
        "sugar_g",
        "alcohol_g",
        "water_ml",
    ]);
    let total: number;
    if (metric === "water_ml") {
        total = summary.waterMl;
    } else if (headlineKeys.has(metric)) {
        total = displayMeals.reduce(
            (sum, meal) =>
                sum +
                ((meal as unknown as Record<string, number | null>)[metric] ??
                    0),
            0,
        );
    } else {
        total = ranked.reduce((sum, meal) => sum + meal.total, 0);
    }
    const reference = trendsReferenceFor(nutrient, goals);
    return {
        date,
        metric,
        kind: "nutrient" as const,
        label: nutrient.label,
        unit: nutrient.unit,
        direction: nutrient.direction,
        summary,
        total: Math.round(total * 10) / 10,
        reference: reference
            ? {
                  value: reference.value,
                  source: reference.source,
                  label:
                      nutrient.direction === "under"
                          ? `Limit ${reference.value}`
                          : `Target ${reference.value}`,
              }
            : null,
        meals: ranked.map((meal) => ({
            ...meal,
            total: Math.round(meal.total * 10) / 10,
            items: meal.items.map((item) => ({
                ...item,
                value: Math.round(item.value * 10) / 10,
            })),
        })),
    };
}

/** A period's top foods for one metric (the donut-segment drill, T11). */
export async function getTrendsPeriodContributors(
    userId: string,
    metric: string,
    startValue: string,
    endValue: string,
) {
    const nutrient = TRENDS_NUTRIENT_BY_KEY.get(metric);
    if (!nutrient) throw new Error(`Unknown trends metric: ${metric}`);
    const startDate = validateLocalDate(startValue);
    const endDate = validateLocalDate(endValue);
    if (inclusiveDateSpanDays(startDate, endDate) > 366) {
        throw new Error("Date range is too large");
    }
    const profile = await getProfile(userId);
    const timezone = profile?.timezone ?? "UTC";
    const alcoholEnabled = profile?.alcohol_tracking_enabled ?? false;
    const meals = await getMealsInRange(userId, startDate, endDate, timezone);
    const displayMeals = alcoholEnabled
        ? meals
        : meals.map((meal) => ({ ...meal, alcohol_g: 0 }));
    const mealsWithItems = await attachItems(userId, displayMeals);
    const inputs = mealsWithItems.map((meal) => ({
        ...trendsMealInput(meal, alcoholEnabled),
        date: dateInTz(meal.logged_at, timezone),
    }));
    return {
        metric,
        label: nutrient.label,
        unit: nutrient.unit,
        startDate,
        endDate,
        foods: rankPeriodContributors(inputs, metric).map((food) => ({
            ...food,
            value: Math.round(food.value * 10) / 10,
        })),
    };
}
