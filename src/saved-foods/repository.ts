import type { FoodCandidate } from "../food-providers/types.js";
import { withUserDatabase } from "../platform/database.js";
import { escapeLikePattern } from "../search.js";

export interface SavedFoodRecord {
    id: string;
    userId: string;
    label: string;
    provider: string | null;
    providerFoodId: string | null;
    defaultPortionId: string | null;
    food: FoodCandidate;
    useCount: number;
    lastUsedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface RecentMealItemMemory {
    mealId: string;
    itemId: string;
    name: string;
    portionLabel: string | null;
    nutrients: Record<string, number>;
    sourceType: string;
    provider: string | null;
    providerFoodId: string | null;
    confidence: number | null;
    loggedAt: string;
}

export function normalizeSavedFoodLabel(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");
}

function rowToSavedFood(row: Record<string, unknown>): SavedFoodRecord {
    const snapshot = row.food_snapshot;
    if (!snapshot || typeof snapshot !== "object") {
        throw new Error("Saved food snapshot is invalid");
    }
    return {
        id: String(row.id),
        userId: String(row.user_id),
        label: String(row.label),
        provider: row.provider == null ? null : String(row.provider),
        providerFoodId:
            row.provider_food_id == null ? null : String(row.provider_food_id),
        defaultPortionId:
            row.default_portion_id == null
                ? null
                : String(row.default_portion_id),
        food: snapshot as FoodCandidate,
        useCount: Number(row.use_count),
        lastUsedAt:
            row.last_used_at == null
                ? null
                : new Date(String(row.last_used_at)).toISOString(),
        createdAt: new Date(String(row.created_at)).toISOString(),
        updatedAt: new Date(String(row.updated_at)).toISOString(),
    };
}

function validateFoodSnapshot(food: FoodCandidate): void {
    if (
        (food.provider !== "usda" && food.provider !== "open_food_facts") ||
        !food.providerFoodId?.trim() ||
        !food.name?.trim() ||
        !Array.isArray(food.portions)
    ) {
        throw new Error("Saved food snapshot is incomplete");
    }
    if (JSON.stringify(food).length > 100_000) {
        throw new Error("Saved food snapshot is too large");
    }
}

export async function saveFood(input: {
    userId: string;
    label: string;
    food: FoodCandidate;
    defaultPortionId?: string;
}): Promise<SavedFoodRecord> {
    const label = input.label.trim();
    const normalizedLabel = normalizeSavedFoodLabel(label);
    if (!label || label.length > 200 || !normalizedLabel) {
        throw new Error("Saved food label is invalid");
    }
    validateFoodSnapshot(input.food);
    const defaultPortionId = input.defaultPortionId?.trim() || null;
    if (
        defaultPortionId &&
        !input.food.portions.some((portion) => portion.id === defaultPortionId)
    ) {
        throw new Error("Default portion does not exist on the food snapshot");
    }

    return withUserDatabase(input.userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            insert into munch.saved_foods (
                user_id,
                label,
                normalized_label,
                provider,
                provider_food_id,
                default_portion_id,
                food_snapshot,
                updated_at
            ) values (
                ${input.userId},
                ${label},
                ${normalizedLabel},
                ${input.food.provider},
                ${input.food.providerFoodId},
                ${defaultPortionId},
                ${input.food}::jsonb,
                now()
            )
            on conflict (user_id, normalized_label) do update
            set label = excluded.label,
                provider = excluded.provider,
                provider_food_id = excluded.provider_food_id,
                default_portion_id = excluded.default_portion_id,
                food_snapshot = excluded.food_snapshot,
                updated_at = now()
            returning *
        `;
        if (!rows[0]) throw new Error("Saved food write returned no row");
        return rowToSavedFood(rows[0]);
    });
}

export async function searchSavedFoods(
    userId: string,
    query: string,
    limit = 10,
): Promise<SavedFoodRecord[]> {
    const normalized = normalizeSavedFoodLabel(query);
    if (!normalized) return [];
    const pattern = `%${escapeLikePattern(normalized)}%`;
    const boundedLimit = Math.max(1, Math.min(50, limit));
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select *
            from munch.saved_foods
            where normalized_label ilike ${pattern} escape '\\'
            order by
                case when normalized_label = ${normalized} then 0 else 1 end,
                use_count desc,
                last_used_at desc nulls last,
                updated_at desc
            limit ${boundedLimit}
        `;
        return rows.map(rowToSavedFood);
    });
}

export async function listSavedFoods(
    userId: string,
    limit = 50,
): Promise<SavedFoodRecord[]> {
    const boundedLimit = Math.max(1, Math.min(200, limit));
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select *
            from munch.saved_foods
            order by use_count desc, last_used_at desc nulls last, updated_at desc
            limit ${boundedLimit}
        `;
        return rows.map(rowToSavedFood);
    });
}

export async function markSavedFoodUsed(
    userId: string,
    savedFoodId: string,
): Promise<boolean> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            update munch.saved_foods
            set use_count = use_count + 1,
                last_used_at = now(),
                updated_at = now()
            where id = ${savedFoodId}
            returning id
        `;
        return rows.length > 0;
    });
}

export async function deleteSavedFood(
    userId: string,
    savedFoodId: string,
): Promise<boolean> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            delete from munch.saved_foods
            where id = ${savedFoodId}
            returning id
        `;
        return rows.length > 0;
    });
}

export async function searchRecentMealItems(
    userId: string,
    query: string,
    limit = 10,
): Promise<RecentMealItemMemory[]> {
    const normalized = normalizeSavedFoodLabel(query);
    if (!normalized) return [];
    const pattern = `%${escapeLikePattern(normalized)}%`;
    const boundedLimit = Math.max(1, Math.min(25, limit));
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select
                i.id as item_id,
                i.meal_id,
                i.name,
                i.portion_label,
                i.calories,
                i.protein_g,
                i.carbs_g,
                i.fat_g,
                i.fiber_g,
                i.sugar_g,
                i.alcohol_g,
                i.sodium_mg,
                i.source_type,
                i.provider,
                i.provider_food_id,
                i.confidence,
                m.logged_at
            from munch.meal_items i
            join munch.meals m on m.id = i.meal_id
            where lower(i.name) ilike ${pattern} escape '\\'
            order by m.logged_at desc
            limit ${boundedLimit}
        `;
        return rows.map((row) => {
            const nutrients: Record<string, number> = {};
            for (const column of [
                "calories",
                "protein_g",
                "carbs_g",
                "fat_g",
                "fiber_g",
                "sugar_g",
                "alcohol_g",
                "sodium_mg",
            ]) {
                if (row[column] != null)
                    nutrients[column] = Number(row[column]);
            }
            return {
                mealId: String(row.meal_id),
                itemId: String(row.item_id),
                name: String(row.name),
                portionLabel:
                    row.portion_label == null
                        ? null
                        : String(row.portion_label),
                nutrients,
                sourceType: String(row.source_type),
                provider: row.provider == null ? null : String(row.provider),
                providerFoodId:
                    row.provider_food_id == null
                        ? null
                        : String(row.provider_food_id),
                confidence:
                    row.confidence == null ? null : Number(row.confidence),
                loggedAt: new Date(String(row.logged_at)).toISOString(),
            };
        });
    });
}
