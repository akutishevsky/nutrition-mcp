import { withUserDatabase } from "./platform/database.js";
import { createExportFile } from "./service-platform/repository.js";

const EXPORT_TTL_SECONDS = 60 * 60;

type JsonRecord = Record<string, unknown>;

function appBaseUrl(): string {
    const value = process.env.MUNCH_APP_BASE_URL?.trim();
    if (!value) throw new Error("MUNCH_APP_BASE_URL is required for exports");
    const url = new URL(value);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
        throw new Error("MUNCH_APP_BASE_URL must use HTTPS in production");
    }
    return url.origin;
}

function stripInternalFields(records: JsonRecord[]): JsonRecord[] {
    return records.map((record) => {
        const copy = { ...record };
        delete copy.user_id;
        delete copy.personal_owner_user_id;
        delete copy.owner_user_id;
        delete copy.created_by_user_id;
        delete copy.updated_by_user_id;
        delete copy.added_by_user_id;
        delete copy.purchased_by_user_id;
        delete copy.invited_by_user_id;
        delete copy.token_hash;
        return copy;
    });
}

export interface AccountExportResult {
    recordCount: number;
    url: string;
}

export async function exportAccountData(
    userId: string,
): Promise<AccountExportResult> {
    const data = await withUserDatabase(userId, async (tx) => {
        const [
            account,
            preferences,
            goals,
            meals,
            mealItems,
            waterLogs,
            weightLogs,
            savedFoods,
            household,
            householdMembers,
            recipes,
            recipeRevisions,
            recipeIngredients,
            plannedMeals,
            groceryLists,
            groceryItems,
        ] = await Promise.all([
            tx<JsonRecord[]>`
                select id, email, email_verified_at, status, created_at, updated_at
                from munch.users where id = ${userId}
            `,
            tx<JsonRecord[]>`
                select timezone, preferred_weight_unit, widgets_enabled,
                       alcohol_tracking_enabled, preferred_drink_unit,
                       created_at, updated_at
                from munch.account_preferences where user_id = ${userId}
            `,
            tx<JsonRecord[]>`
                select daily_calories, daily_protein_g, daily_carbs_g,
                       daily_fat_g, daily_fiber_g, daily_sugar_g,
                       daily_alcohol_g, daily_water_ml, target_weight_g, updated_at
                from munch.nutrition_goals where user_id = ${userId}
            `,
            tx<JsonRecord[]>`
                select * from munch.meals
                where user_id = ${userId}
                order by logged_at, id
            `,
            tx<JsonRecord[]>`
                select item.*
                from munch.meal_items item
                where item.user_id = ${userId}
                order by item.meal_id, item.position
            `,
            tx<JsonRecord[]>`
                select * from munch.water_logs
                where user_id = ${userId}
                order by logged_at, id
            `,
            tx<JsonRecord[]>`
                select * from munch.weight_logs
                where user_id = ${userId}
                order by logged_at, id
            `,
            tx<JsonRecord[]>`
                select * from munch.saved_foods
                where user_id = ${userId}
                order by created_at, id
            `,
            tx<JsonRecord[]>`
                select household.id, household.name, household.version,
                       household.created_at, household.updated_at,
                       membership.display_name as current_user_display_name,
                       membership.role as current_user_role,
                       membership.joined_at
                from munch.household_memberships membership
                join munch.households household on household.id = membership.household_id
                where membership.user_id = ${userId}
                  and membership.status = 'active'
                  and household.archived_at is null
            `,
            tx<JsonRecord[]>`
                select membership.household_id, membership.display_name,
                       membership.role, membership.status,
                       membership.joined_at, membership.updated_at
                from munch.household_memberships membership
                where membership.household_id in (
                    select active.household_id
                    from munch.household_memberships active
                    where active.user_id = ${userId}
                      and active.status = 'active'
                )
                order by membership.joined_at, membership.id
            `,
            tx<JsonRecord[]>`
                select * from munch.recipes
                where personal_owner_user_id = ${userId}
                   or household_id in (
                       select membership.household_id
                       from munch.household_memberships membership
                       where membership.user_id = ${userId}
                         and membership.status = 'active'
                   )
                order by created_at, id
            `,
            tx<JsonRecord[]>`
                select revision.*
                from munch.recipe_revisions revision
                join munch.recipes recipe on recipe.id = revision.recipe_id
                where recipe.personal_owner_user_id = ${userId}
                   or recipe.household_id in (
                       select membership.household_id
                       from munch.household_memberships membership
                       where membership.user_id = ${userId}
                         and membership.status = 'active'
                   )
                order by revision.recipe_id, revision.revision_number
            `,
            tx<JsonRecord[]>`
                select ingredient.*
                from munch.recipe_ingredients ingredient
                join munch.recipe_revisions revision
                  on revision.id = ingredient.recipe_revision_id
                join munch.recipes recipe on recipe.id = revision.recipe_id
                where recipe.personal_owner_user_id = ${userId}
                   or recipe.household_id in (
                       select membership.household_id
                       from munch.household_memberships membership
                       where membership.user_id = ${userId}
                         and membership.status = 'active'
                   )
                order by ingredient.recipe_revision_id, ingredient.position
            `,
            tx<JsonRecord[]>`
                select * from munch.planned_meals
                where personal_owner_user_id = ${userId}
                   or household_id in (
                       select membership.household_id
                       from munch.household_memberships membership
                       where membership.user_id = ${userId}
                         and membership.status = 'active'
                   )
                order by planned_date, meal_slot, id
            `,
            tx<JsonRecord[]>`
                select * from munch.grocery_lists
                where personal_owner_user_id = ${userId}
                   or household_id in (
                       select membership.household_id
                       from munch.household_memberships membership
                       where membership.user_id = ${userId}
                         and membership.status = 'active'
                   )
                order by created_at, id
            `,
            tx<JsonRecord[]>`
                select item.*
                from munch.grocery_items item
                join munch.grocery_lists list on list.id = item.grocery_list_id
                where list.personal_owner_user_id = ${userId}
                   or list.household_id in (
                       select membership.household_id
                       from munch.household_memberships membership
                       where membership.user_id = ${userId}
                         and membership.status = 'active'
                   )
                order by item.grocery_list_id, item.created_at, item.id
            `,
        ]);

        return {
            schema_version: 1,
            exported_at: new Date().toISOString(),
            account: account[0] ?? null,
            preferences: preferences[0] ?? null,
            nutrition_goals: goals[0] ?? null,
            meals: stripInternalFields(meals),
            meal_items: stripInternalFields(mealItems),
            water_logs: stripInternalFields(waterLogs),
            weight_logs: stripInternalFields(weightLogs),
            saved_foods: stripInternalFields(savedFoods),
            household: household[0] ?? null,
            household_members: stripInternalFields(householdMembers),
            recipes: stripInternalFields(recipes),
            recipe_revisions: stripInternalFields(recipeRevisions),
            recipe_ingredients: stripInternalFields(recipeIngredients),
            planned_meals: stripInternalFields(plannedMeals),
            grocery_lists: stripInternalFields(groceryLists),
            grocery_items: stripInternalFields(groceryItems),
        };
    });

    const recordCount = Object.values(data).reduce<number>(
        (count, value) => count + (Array.isArray(value) ? value.length : 0),
        0,
    );
    const created = await createExportFile({
        userId,
        fileName: `munch-account-${new Date().toISOString().slice(0, 10)}.json`,
        content: JSON.stringify(data, null, 2),
        contentType: "application/json; charset=utf-8",
        expiresAt: new Date(Date.now() + EXPORT_TTL_SECONDS * 1_000),
    });
    const url = new URL("/exports/download", appBaseUrl());
    url.searchParams.set("token", created.token);
    return { recordCount, url: url.toString() };
}
