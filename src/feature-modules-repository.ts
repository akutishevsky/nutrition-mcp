import { withUserDatabase } from "./platform/database.js";
import {
    normalizeFeatureModules,
    type FeatureModules,
} from "./feature-modules.js";

/**
 * Server-side storage for the feature toggles (T5): one account row
 * in munch.account_preferences (migration 0039), read and written
 * under the user's RLS context like every other per-user table, so
 * web, Android, and iOS — and the server-side chat/guidance context
 * assembly — all honor the same flags. The contract itself lives in
 * src/feature-modules.ts; a missing row reads as every module on.
 */

interface FeatureModuleRow {
    feature_plan_enabled: boolean | null;
    feature_recipes_enabled: boolean | null;
    feature_groceries_enabled: boolean | null;
    feature_pantry_enabled: boolean | null;
    feature_cooks_enabled: boolean | null;
}

function rowToFeatureModules(row: FeatureModuleRow | undefined) {
    if (!row) return normalizeFeatureModules(null);
    return normalizeFeatureModules({
        plan: row.feature_plan_enabled !== false,
        recipes: row.feature_recipes_enabled !== false,
        groceries: row.feature_groceries_enabled !== false,
        pantry: row.feature_pantry_enabled !== false,
        cooks: row.feature_cooks_enabled !== false,
    });
}

export async function getFeatureModules(
    userId: string,
): Promise<FeatureModules> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<FeatureModuleRow[]>`
            select feature_plan_enabled, feature_recipes_enabled,
                   feature_groceries_enabled, feature_pantry_enabled,
                   feature_cooks_enabled
            from munch.account_preferences
            where user_id = ${userId}
        `;
        return rowToFeatureModules(rows[0]);
    });
}

export async function saveFeatureModules(
    userId: string,
    patch: Partial<FeatureModules>,
): Promise<FeatureModules> {
    const current = await getFeatureModules(userId);
    const next = normalizeFeatureModules({ ...current, ...patch });
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<FeatureModuleRow[]>`
            insert into munch.account_preferences (
                user_id, feature_plan_enabled, feature_recipes_enabled,
                feature_groceries_enabled, feature_pantry_enabled,
                feature_cooks_enabled
            ) values (
                ${userId}, ${next.plan}, ${next.recipes}, ${next.groceries},
                ${next.pantry}, ${next.cooks}
            )
            on conflict (user_id) do update
                set feature_plan_enabled = excluded.feature_plan_enabled,
                    feature_recipes_enabled = excluded.feature_recipes_enabled,
                    feature_groceries_enabled = excluded.feature_groceries_enabled,
                    feature_pantry_enabled = excluded.feature_pantry_enabled,
                    feature_cooks_enabled = excluded.feature_cooks_enabled,
                    updated_at = now()
            returning feature_plan_enabled, feature_recipes_enabled,
                      feature_groceries_enabled, feature_pantry_enabled,
                      feature_cooks_enabled
        `;
        return rowToFeatureModules(rows[0]);
    });
}
