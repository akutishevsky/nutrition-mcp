import { decodeEscapeSequences } from "../normalize.js";
import { escapeLikePattern, tokenizeQuery } from "../search.js";
import { withUserDatabase } from "../platform/database.js";
import { zonedDayStartUtc, zonedNextDayStartUtc } from "../tz.js";
import { toStoredInteger } from "../units.js";
import {
    deriveIdempotencyKey,
    isoTimestamp,
    nullableNumber,
    stringOrNull,
} from "./shared.js";
import type { Meal, MealInput, MealInsertResult } from "./types.js";

interface MealRow {
    id: string;
    user_id: string;
    logged_at: Date | string;
    meal_type: string | null;
    description: string;
    calories: number | string | null;
    protein_g: number | string | null;
    carbs_g: number | string | null;
    fat_g: number | string | null;
    fiber_g: number | string | null;
    sugar_g: number | string | null;
    alcohol_g: number | string | null;
    notes: string | null;
    idempotency_key: string | null;
}

function mapMeal(row: MealRow): Meal {
    return {
        id: row.id,
        user_id: row.user_id,
        logged_at: isoTimestamp(row.logged_at),
        meal_type: stringOrNull(row.meal_type),
        description: row.description,
        calories: nullableNumber(row.calories),
        protein_g: nullableNumber(row.protein_g),
        carbs_g: nullableNumber(row.carbs_g),
        fat_g: nullableNumber(row.fat_g),
        fiber_g: nullableNumber(row.fiber_g),
        sugar_g: nullableNumber(row.sugar_g),
        alcohol_g: nullableNumber(row.alcohol_g),
        notes: stringOrNull(row.notes),
        idempotency_key: stringOrNull(row.idempotency_key),
    };
}

export function mealIdempotencyKey(
    userId: string,
    input: MealInput,
    loggedAt: string,
): string {
    // Keep this positional list aligned with the inherited project. Fiber,
    // sugar, alcohol, and future fields stay excluded to preserve historical
    // deduplication behavior.
    return deriveIdempotencyKey([
        userId,
        input.description,
        input.meal_type,
        input.calories,
        input.protein_g,
        input.carbs_g,
        input.fat_g,
        input.notes,
        loggedAt,
    ]);
}

export async function insertMeal(
    userId: string,
    input: MealInput,
): Promise<MealInsertResult> {
    const normalized: MealInput =
        input.calories == null
            ? input
            : { ...input, calories: toStoredInteger(input.calories) };
    const loggedAt = normalized.logged_at ?? new Date().toISOString();
    const idempotencyKey =
        normalized.idempotency_key ??
        mealIdempotencyKey(userId, normalized, loggedAt);

    return withUserDatabase(userId, async (tx) => {
        const inserted = await tx<Array<MealRow>>`
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
                ${normalized.meal_type},
                ${decodeEscapeSequences(normalized.description)},
                ${normalized.calories ?? null},
                ${normalized.protein_g ?? null},
                ${normalized.carbs_g ?? null},
                ${normalized.fat_g ?? null},
                ${normalized.fiber_g ?? null},
                ${normalized.sugar_g ?? null},
                ${normalized.alcohol_g ?? null},
                ${normalized.notes == null ? null : decodeEscapeSequences(normalized.notes)},
                ${idempotencyKey}
            )
            on conflict (user_id, idempotency_key)
                where idempotency_key is not null
            do nothing
            returning
                id, user_id, logged_at, meal_type, description, calories,
                protein_g, carbs_g, fat_g, fiber_g, sugar_g, alcohol_g,
                notes, idempotency_key
        `;

        if (inserted[0]) {
            return { meal: mapMeal(inserted[0]), deduplicated: false };
        }

        const existing = await tx<Array<MealRow>>`
            select
                id, user_id, logged_at, meal_type, description, calories,
                protein_g, carbs_g, fat_g, fiber_g, sugar_g, alcohol_g,
                notes, idempotency_key
            from munch.meals
            where user_id = ${userId}
              and idempotency_key = ${idempotencyKey}
        `;
        if (!existing[0]) {
            throw new Error("Failed to resolve idempotent meal insert");
        }
        return { meal: mapMeal(existing[0]), deduplicated: true };
    });
}

async function mealsBetween(
    userId: string,
    start: Date,
    end: Date,
): Promise<Meal[]> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<MealRow>>`
            select
                id, user_id, logged_at, meal_type, description, calories,
                protein_g, carbs_g, fat_g, fiber_g, sugar_g, alcohol_g,
                notes, idempotency_key
            from munch.meals
            where user_id = ${userId}
              and logged_at >= ${start}
              and logged_at < ${end}
            order by logged_at asc
        `;
        return rows.map(mapMeal);
    });
}

export function getMealsByDate(
    userId: string,
    date: string,
    tz = "UTC",
): Promise<Meal[]> {
    return mealsBetween(
        userId,
        zonedDayStartUtc(date, tz),
        zonedNextDayStartUtc(date, tz),
    );
}

export function getMealsInRange(
    userId: string,
    startDate: string,
    endDate: string,
    tz = "UTC",
): Promise<Meal[]> {
    return mealsBetween(
        userId,
        zonedDayStartUtc(startDate, tz),
        zonedNextDayStartUtc(endDate, tz),
    );
}

export async function countMeals(userId: string): Promise<number> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<{ count: number | string }>>`
            select count(*)::bigint as count
            from munch.meals
            where user_id = ${userId}
        `;
        return Number(rows[0]?.count ?? 0);
    });
}

export async function existingIdempotencyKeys(
    userId: string,
    keys: string[],
): Promise<Set<string>> {
    if (keys.length === 0) return new Set();
    const keyJson = JSON.stringify(keys);

    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<{ idempotency_key: string }>>`
            select idempotency_key
            from munch.meals
            where user_id = ${userId}
              and idempotency_key in (
                  select value
                  from jsonb_array_elements_text((${keyJson}::text)::jsonb)
              )
        `;
        return new Set(rows.map((row) => row.idempotency_key));
    });
}

export async function getAllMeals(userId: string): Promise<Meal[]> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<MealRow>>`
            select
                id, user_id, logged_at, meal_type, description, calories,
                protein_g, carbs_g, fat_g, fiber_g, sugar_g, alcohol_g,
                notes, idempotency_key
            from munch.meals
            where user_id = ${userId}
            order by logged_at asc
        `;
        return rows.map(mapMeal);
    });
}

export async function searchMeals(
    userId: string,
    queries: string[],
    opts: { limit?: number; sinceIso?: string } = {},
): Promise<Meal[]> {
    const limit = opts.limit ?? 50;
    if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
        throw new Error("Meal search limit must be between 1 and 200");
    }

    const alternatives = queries
        .map(tokenizeQuery)
        .filter((tokens) => tokens.length > 0);
    if (alternatives.length === 0) return [];

    return withUserDatabase(userId, async (tx) => {
        const merged = new Map<string, Meal>();
        for (const tokens of alternatives) {
            const patterns = JSON.stringify(
                tokens.map((token) => `%${escapeLikePattern(token)}%`),
            );
            const rows = await tx<Array<MealRow>>`
                select
                    id, user_id, logged_at, meal_type, description, calories,
                    protein_g, carbs_g, fat_g, fiber_g, sugar_g, alcohol_g,
                    notes, idempotency_key
                from munch.meals
                where user_id = ${userId}
                  and (
                    ${opts.sinceIso ?? null}::timestamptz is null
                    or logged_at >= ${opts.sinceIso ?? null}::timestamptz
                  )
                  and (
                    not exists (
                        select 1
                        from jsonb_array_elements_text((${patterns}::text)::jsonb) pattern
                        where description not ilike pattern.value
                    )
                    or not exists (
                        select 1
                        from jsonb_array_elements_text((${patterns}::text)::jsonb) pattern
                        where coalesce(notes, '') not ilike pattern.value
                    )
                  )
                order by logged_at desc
                limit ${limit}
            `;
            for (const row of rows) {
                merged.set(row.id, mapMeal(row));
            }
        }

        return [...merged.values()]
            .sort((left, right) =>
                right.logged_at.localeCompare(left.logged_at),
            )
            .slice(0, limit);
    });
}

export async function deleteMeal(userId: string, id: string): Promise<void> {
    await withUserDatabase(userId, async (tx) => {
        await tx`
            delete from munch.meals
            where id = ${id}
              and user_id = ${userId}
        `;
    });
}

export async function updateMeal(
    userId: string,
    id: string,
    fields: Partial<MealInput>,
): Promise<Meal> {
    const descriptionProvided = fields.description !== undefined;
    const mealTypeProvided = fields.meal_type !== undefined;
    const caloriesProvided = fields.calories !== undefined;
    const proteinProvided = fields.protein_g !== undefined;
    const carbsProvided = fields.carbs_g !== undefined;
    const fatProvided = fields.fat_g !== undefined;
    const fiberProvided = fields.fiber_g !== undefined;
    const sugarProvided = fields.sugar_g !== undefined;
    const alcoholProvided = fields.alcohol_g !== undefined;
    const loggedAtProvided = fields.logged_at !== undefined;
    const notesProvided = fields.notes !== undefined;

    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<MealRow>>`
            update munch.meals
            set description = case
                    when ${descriptionProvided} then ${descriptionProvided ? decodeEscapeSequences(fields.description!) : ""}
                    else description
                end,
                meal_type = case
                    when ${mealTypeProvided} then ${fields.meal_type ?? null}
                    else meal_type
                end,
                calories = case
                    when ${caloriesProvided} then ${caloriesProvided ? toStoredInteger(fields.calories!) : null}
                    else calories
                end,
                protein_g = case when ${proteinProvided} then ${fields.protein_g ?? null} else protein_g end,
                carbs_g = case when ${carbsProvided} then ${fields.carbs_g ?? null} else carbs_g end,
                fat_g = case when ${fatProvided} then ${fields.fat_g ?? null} else fat_g end,
                fiber_g = case when ${fiberProvided} then ${fields.fiber_g ?? null} else fiber_g end,
                sugar_g = case when ${sugarProvided} then ${fields.sugar_g ?? null} else sugar_g end,
                alcohol_g = case when ${alcoholProvided} then ${fields.alcohol_g ?? null} else alcohol_g end,
                logged_at = case when ${loggedAtProvided} then ${fields.logged_at ?? null}::timestamptz else logged_at end,
                notes = case
                    when ${notesProvided} then ${fields.notes == null ? null : decodeEscapeSequences(fields.notes)}
                    else notes
                end,
                updated_at = now()
            where id = ${id}
              and user_id = ${userId}
            returning
                id, user_id, logged_at, meal_type, description, calories,
                protein_g, carbs_g, fat_g, fiber_g, sugar_g, alcohol_g,
                notes, idempotency_key
        `;
        if (!rows[0]) throw new Error("Meal not found");
        return mapMeal(rows[0]);
    });
}
