import { withUserDatabase, type DatabaseTransaction } from "../platform/database.js";
import type { NutrientValues } from "../food-providers/types.js";
import type {
    StructuredMealInput,
    StructuredMealInsertResult,
    StructuredMealItemInput,
    StructuredMealItemRecord,
    StructuredMealRecord,
} from "./types.js";

const PARENT_NUTRIENTS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "alcohol_g",
] as const satisfies readonly (keyof NutrientValues)[];

function finiteNonnegative(value: number | undefined, label: string) {
    if (value === undefined) return undefined;
    if (!Number.isFinite(value) || value < 0) {
        throw new Error(`${label} must be finite and nonnegative`);
    }
    return Math.round(value * 100) / 100;
}

function validateItem(item: StructuredMealItemInput): StructuredMealItemInput {
    const name = item.name.trim();
    if (!name) throw new Error("Structured meal item name is required");
    if (name.length > 500) throw new Error("Structured meal item name is too long");
    if (
        item.quantity !== undefined &&
        (!Number.isFinite(item.quantity) || item.quantity <= 0)
    ) {
        throw new Error("Structured meal item quantity must be positive");
    }
    if (
        item.gramWeight !== undefined &&
        (!Number.isFinite(item.gramWeight) || item.gramWeight <= 0)
    ) {
        throw new Error("Structured meal item gram weight must be positive");
    }
    if (
        item.confidence !== undefined &&
        (!Number.isFinite(item.confidence) ||
            item.confidence < 0 ||
            item.confidence > 1)
    ) {
        throw new Error("Structured meal item confidence must be between 0 and 1");
    }
    const assumptions = (item.assumptions ?? []).map((value) => value.trim());
    if (assumptions.length > 20 || assumptions.some((value) => value.length > 500)) {
        throw new Error("Structured meal item assumptions exceed limits");
    }
    const snapshot = item.sourceSnapshot ?? {};
    if (JSON.stringify(snapshot).length > 50_000) {
        throw new Error("Structured meal source snapshot is too large");
    }
    const nutrients: NutrientValues = {};
    for (const [key, value] of Object.entries(item.nutrients) as Array<
        [keyof NutrientValues, number | undefined]
    >) {
        const normalized = finiteNonnegative(value, key);
        if (normalized !== undefined) nutrients[key] = normalized;
    }
    return {
        ...item,
        name,
        portionLabel: item.portionLabel?.trim() || undefined,
        assumptions,
        sourceSnapshot: snapshot,
        nutrients,
    };
}

export function aggregateStructuredMealItems(
    items: StructuredMealItemInput[],
): NutrientValues {
    const totals: NutrientValues = {};
    for (const key of PARENT_NUTRIENTS) {
        const values = items
            .map((item) => item.nutrients[key])
            .filter((value): value is number => value !== undefined);
        if (values.length > 0) {
            totals[key] =
                Math.round(values.reduce((sum, value) => sum + value, 0) * 100) /
                100;
        }
    }
    return totals;
}

function numberOrNull(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function mealFromRow(row: Record<string, unknown>): Omit<StructuredMealRecord, "items"> {
    return {
        id: String(row.id),
        userId: String(row.user_id),
        loggedAt: new Date(String(row.logged_at)).toISOString(),
        mealType: row.meal_type == null ? null : String(row.meal_type),
        description: String(row.description),
        calories: numberOrNull(row.calories),
        proteinG: numberOrNull(row.protein_g),
        carbsG: numberOrNull(row.carbs_g),
        fatG: numberOrNull(row.fat_g),
        fiberG: numberOrNull(row.fiber_g),
        sugarG: numberOrNull(row.sugar_g),
        alcoholG: numberOrNull(row.alcohol_g),
        notes: row.notes == null ? null : String(row.notes),
        idempotencyKey:
            row.idempotency_key == null ? null : String(row.idempotency_key),
    };
}

function itemFromRow(row: Record<string, unknown>): StructuredMealItemRecord {
    const assumptions = Array.isArray(row.assumptions)
        ? row.assumptions.filter((value): value is string => typeof value === "string")
        : [];
    const sourceSnapshot =
        row.source_snapshot && typeof row.source_snapshot === "object"
            ? (row.source_snapshot as Record<string, unknown>)
            : {};
    const nutrients: NutrientValues = {};
    const nutrientColumns: Array<[keyof NutrientValues, string]> = [
        ["calories", "calories"],
        ["protein_g", "protein_g"],
        ["carbs_g", "carbs_g"],
        ["fat_g", "fat_g"],
        ["fiber_g", "fiber_g"],
        ["sugar_g", "sugar_g"],
        ["alcohol_g", "alcohol_g"],
        ["sodium_mg", "sodium_mg"],
        ["saturated_fat_g", "saturated_fat_g"],
        ["cholesterol_mg", "cholesterol_mg"],
        ["potassium_mg", "potassium_mg"],
    ];
    for (const [key, column] of nutrientColumns) {
        const value = numberOrNull(row[column]);
        if (value !== null) nutrients[key] = value;
    }
    return {
        id: String(row.id),
        mealId: String(row.meal_id),
        userId: String(row.user_id),
        position: Number(row.position),
        name: String(row.name),
        quantity: numberOrNull(row.quantity),
        portionLabel: row.portion_label == null ? null : String(row.portion_label),
        gramWeight: numberOrNull(row.gram_weight),
        nutrients,
        sourceType: row.source_type as StructuredMealItemRecord["sourceType"],
        provider: row.provider == null ? null : String(row.provider),
        providerFoodId:
            row.provider_food_id == null ? null : String(row.provider_food_id),
        providerRevision:
            row.provider_revision == null ? null : String(row.provider_revision),
        sourceUrl: row.source_url == null ? null : String(row.source_url),
        sourceUpdatedAt:
            row.source_updated_at == null
                ? null
                : new Date(String(row.source_updated_at)).toISOString(),
        confidence: numberOrNull(row.confidence),
        assumptions,
        sourceSnapshot,
        createdAt: new Date(String(row.created_at)).toISOString(),
    };
}

async function loadItems(
    tx: DatabaseTransaction,
    mealId: string,
): Promise<StructuredMealItemRecord[]> {
    const rows = await tx<Array<Record<string, unknown>>>`
        select *
        from munch.meal_items
        where meal_id = ${mealId}
        order by position asc
    `;
    return rows.map(itemFromRow);
}

async function loadMeal(
    tx: DatabaseTransaction,
    mealId: string,
): Promise<StructuredMealRecord | null> {
    const rows = await tx<Array<Record<string, unknown>>>`
        select *
        from munch.meals
        where id = ${mealId}
        limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    return { ...mealFromRow(row), items: await loadItems(tx, mealId) };
}

export async function insertStructuredMeal(
    userId: string,
    input: StructuredMealInput,
): Promise<StructuredMealInsertResult> {
    const description = input.description.trim();
    const idempotencyKey = input.idempotencyKey.trim();
    if (!description) throw new Error("Structured meal description is required");
    if (!idempotencyKey || idempotencyKey.length > 255) {
        throw new Error("Structured meal idempotency key is invalid");
    }
    if (input.items.length === 0 || input.items.length > 100) {
        throw new Error("Structured meal must contain between 1 and 100 items");
    }
    const items = input.items.map(validateItem);
    const totals = aggregateStructuredMealItems(items);
    const loggedAt = input.loggedAt ? new Date(input.loggedAt) : new Date();
    if (!Number.isFinite(loggedAt.getTime())) {
        throw new Error("Structured meal loggedAt is invalid");
    }

    return withUserDatabase(userId, async (tx) => {
        const existingRows = await tx<Array<{ id: string }>>`
            select id
            from munch.meals
            where user_id = ${userId}
              and idempotency_key = ${idempotencyKey}
            limit 1
        `;
        if (existingRows[0]) {
            const existing = await loadMeal(tx, existingRows[0].id);
            if (!existing) throw new Error("Idempotent meal could not be reloaded");
            return { meal: existing, deduplicated: true };
        }

        const mealRows = await tx<Array<Record<string, unknown>>>`
            insert into munch.meals (
                user_id,
                logged_at,
                meal_type,
                description,
                calories,
                protein_g,
                carbs_g,
                fat_g,
                fiber_g,
                sugar_g,
                alcohol_g,
                notes,
                idempotency_key
            ) values (
                ${userId},
                ${loggedAt},
                ${input.mealType},
                ${description},
                ${totals.calories === undefined ? null : Math.round(totals.calories)},
                ${totals.protein_g ?? null},
                ${totals.carbs_g ?? null},
                ${totals.fat_g ?? null},
                ${totals.fiber_g ?? null},
                ${totals.sugar_g ?? null},
                ${totals.alcohol_g ?? null},
                ${input.notes?.trim() || null},
                ${idempotencyKey}
            )
            returning *
        `;
        const mealRow = mealRows[0];
        if (!mealRow) throw new Error("Structured meal insert returned no row");
        const mealId = String(mealRow.id);

        for (const [position, item] of items.entries()) {
            await tx`
                insert into munch.meal_items (
                    meal_id,
                    user_id,
                    position,
                    name,
                    quantity,
                    portion_label,
                    gram_weight,
                    calories,
                    protein_g,
                    carbs_g,
                    fat_g,
                    fiber_g,
                    sugar_g,
                    alcohol_g,
                    sodium_mg,
                    saturated_fat_g,
                    cholesterol_mg,
                    potassium_mg,
                    source_type,
                    provider,
                    provider_food_id,
                    provider_revision,
                    source_url,
                    source_updated_at,
                    confidence,
                    assumptions,
                    source_snapshot
                ) values (
                    ${mealId},
                    ${userId},
                    ${position},
                    ${item.name},
                    ${item.quantity ?? null},
                    ${item.portionLabel ?? null},
                    ${item.gramWeight ?? null},
                    ${item.nutrients.calories ?? null},
                    ${item.nutrients.protein_g ?? null},
                    ${item.nutrients.carbs_g ?? null},
                    ${item.nutrients.fat_g ?? null},
                    ${item.nutrients.fiber_g ?? null},
                    ${item.nutrients.sugar_g ?? null},
                    ${item.nutrients.alcohol_g ?? null},
                    ${item.nutrients.sodium_mg ?? null},
                    ${item.nutrients.saturated_fat_g ?? null},
                    ${item.nutrients.cholesterol_mg ?? null},
                    ${item.nutrients.potassium_mg ?? null},
                    ${item.sourceType},
                    ${item.provider ?? null},
                    ${item.providerFoodId ?? null},
                    ${item.providerRevision ?? null},
                    ${item.sourceUrl ?? null},
                    ${item.sourceUpdatedAt ? new Date(item.sourceUpdatedAt) : null},
                    ${item.confidence ?? null},
                    ${JSON.stringify(item.assumptions ?? [])}::jsonb,
                    ${JSON.stringify(item.sourceSnapshot ?? {})}::jsonb
                )
            `;
        }

        return {
            meal: {
                ...mealFromRow(mealRow),
                items: await loadItems(tx, mealId),
            },
            deduplicated: false,
        };
    });
}

export async function getStructuredMeal(
    userId: string,
    mealId: string,
): Promise<StructuredMealRecord | null> {
    return withUserDatabase(userId, (tx) => loadMeal(tx, mealId));
}
