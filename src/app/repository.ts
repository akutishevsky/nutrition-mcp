import { resolveMunchCapabilities } from "../billing/capabilities.js";
import {
    getActiveHouseholdContext,
    listHouseholdMembers,
} from "../households/repository.js";
import { withUserDatabase } from "../platform/database.js";
import {
    getGroceryList,
    getMealPlan,
    searchRecipes,
} from "../planning/repository.js";
import { listSavedFoods } from "../saved-foods/repository.js";
import {
    getMealsByDate,
    getMealsInRange,
    getNutritionGoals,
    getProfile,
    getWaterByDate,
    getWeightByDate,
    type Meal,
} from "../storage.js";
import { dateInTz } from "../tz.js";

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

function validateDate(value: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error("Invalid date");
    }
    return value;
}

function daysBetween(startDate: string, endDate: string): number {
    const start = Date.parse(`${startDate}T00:00:00Z`);
    const end = Date.parse(`${endDate}T00:00:00Z`);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
        throw new Error("Invalid date range");
    }
    return Math.floor((end - start) / 86_400_000) + 1;
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

function totals(meals: Meal[]) {
    return meals.reduce(
        (result, meal) => {
            result.calories += meal.calories ?? 0;
            result.proteinG += meal.protein_g ?? 0;
            result.carbsG += meal.carbs_g ?? 0;
            result.fatG += meal.fat_g ?? 0;
            result.fiberG += meal.fiber_g ?? 0;
            result.sugarG += meal.sugar_g ?? 0;
            result.alcoholG += meal.alcohol_g ?? 0;
            return result;
        },
        {
            calories: 0,
            proteinG: 0,
            carbsG: 0,
            fatG: 0,
            fiberG: 0,
            sugarG: 0,
            alcoholG: 0,
        },
    );
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

export async function getAppBootstrap(userId: string, email: string) {
    const [profile, capabilities, household] = await Promise.all([
        getProfile(userId),
        resolveMunchCapabilities(userId),
        getActiveHouseholdContext(userId),
    ]);
    return {
        user: { id: userId, email },
        profile,
        capabilities: {
            tier: capabilities.tier,
            historyDays: capabilities.historyDays,
            savedFoodLimit: capabilities.savedFoodLimit,
            recipes:
                capabilities.personalRecipesRead || capabilities.householdRead,
            planning:
                capabilities.personalPlanningRead || capabilities.householdRead,
            household: capabilities.householdRead,
            householdManage: capabilities.householdManage,
        },
        household,
    };
}

export async function getTodayWorkspace(userId: string, dateValue: string) {
    const date = validateDate(dateValue);
    const [profile, capabilities] = await Promise.all([
        getProfile(userId),
        resolveMunchCapabilities(userId),
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
        totals: totals(meals),
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
) {
    const startDate = validateDate(startValue);
    const endDate = validateDate(endValue);
    if (daysBetween(startDate, endDate) > 366) {
        throw new Error("Date range is too large");
    }
    const profile = await getProfile(userId);
    const timezone = profile?.timezone ?? "UTC";
    const meals = await getMealsInRange(userId, startDate, endDate, timezone);
    return {
        startDate,
        endDate,
        timezone,
        totals: totals(meals),
        meals: await attachItems(userId, meals),
    };
}

export async function getFoodsWorkspace(userId: string) {
    const capabilities = await resolveMunchCapabilities(userId);
    const foods = await listSavedFoods(userId, 200);
    return {
        limit: capabilities.savedFoodLimit,
        total: foods.length,
        foods,
    };
}

export async function getInsightsWorkspace(
    userId: string,
    startValue: string,
    endValue: string,
) {
    const startDate = validateDate(startValue);
    const endDate = validateDate(endValue);
    const dayCount = daysBetween(startDate, endDate);
    if (dayCount > 366) throw new Error("Date range is too large");
    const profile = await getProfile(userId);
    const timezone = profile?.timezone ?? "UTC";
    const meals = await getMealsInRange(userId, startDate, endDate, timezone);
    const byDate = new Map<string, Meal[]>();
    for (const meal of meals) {
        const localDate = dateInTz(meal.logged_at, timezone);
        const group = byDate.get(localDate) ?? [];
        group.push(meal);
        byDate.set(localDate, group);
    }
    const days = [...byDate.entries()]
        .map(([date, entries]) => ({
            date,
            totals: totals(entries),
            mealCount: entries.length,
        }))
        .sort((left, right) => left.date.localeCompare(right.date));
    const aggregate = totals(meals);
    const loggedDays = days.length;
    const averages = Object.fromEntries(
        Object.entries(aggregate).map(([key, value]) => [
            key,
            loggedDays === 0 ? 0 : Number((value / loggedDays).toFixed(1)),
        ]),
    );
    return {
        startDate,
        endDate,
        timezone,
        calendarDays: dayCount,
        loggedDays,
        mealCount: meals.length,
        totals: aggregate,
        averages,
        days,
    };
}

export async function getPlanningWorkspace(
    userId: string,
    startValue: string,
    endValue: string,
) {
    const startDate = validateDate(startValue);
    const endDate = validateDate(endValue);
    if (daysBetween(startDate, endDate) > 62) {
        throw new Error("Date range is too large");
    }
    const capabilities = await resolveMunchCapabilities(userId);
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

export async function getHouseholdWorkspace(userId: string) {
    const context = await getActiveHouseholdContext(userId);
    if (!context) return { household: null, members: [] };
    return {
        household: context,
        members: await listHouseholdMembers(userId, context.householdId),
    };
}
