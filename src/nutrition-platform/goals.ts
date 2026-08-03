import { withUserDatabase } from "../platform/database.js";
import { toStoredInteger } from "../units.js";
import { isoTimestamp, nullableNumber } from "./shared.js";
import type {
    NutritionGoals,
    NutritionGoalsInput,
} from "./types.js";

interface NutritionGoalsRow {
    user_id: string;
    daily_calories: number | string | null;
    daily_protein_g: number | string | null;
    daily_carbs_g: number | string | null;
    daily_fat_g: number | string | null;
    daily_fiber_g: number | string | null;
    daily_sugar_g: number | string | null;
    daily_alcohol_g: number | string | null;
    daily_water_ml: number | string | null;
    target_weight_g: number | string | null;
    updated_at: Date | string;
}

function mapGoals(row: NutritionGoalsRow): NutritionGoals {
    return {
        user_id: row.user_id,
        daily_calories: nullableNumber(row.daily_calories),
        daily_protein_g: nullableNumber(row.daily_protein_g),
        daily_carbs_g: nullableNumber(row.daily_carbs_g),
        daily_fat_g: nullableNumber(row.daily_fat_g),
        daily_fiber_g: nullableNumber(row.daily_fiber_g),
        daily_sugar_g: nullableNumber(row.daily_sugar_g),
        daily_alcohol_g: nullableNumber(row.daily_alcohol_g),
        daily_water_ml: nullableNumber(row.daily_water_ml),
        target_weight_g: nullableNumber(row.target_weight_g),
        updated_at: isoTimestamp(row.updated_at),
    };
}

export async function upsertNutritionGoals(
    userId: string,
    input: NutritionGoalsInput,
): Promise<NutritionGoals> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<NutritionGoalsRow>>`
            insert into munch.nutrition_goals (
                user_id,
                daily_calories,
                daily_protein_g,
                daily_carbs_g,
                daily_fat_g,
                daily_fiber_g,
                daily_sugar_g,
                daily_alcohol_g,
                daily_water_ml,
                target_weight_g,
                updated_at
            ) values (
                ${userId},
                ${input.daily_calories == null ? null : toStoredInteger(input.daily_calories)},
                ${input.daily_protein_g ?? null},
                ${input.daily_carbs_g ?? null},
                ${input.daily_fat_g ?? null},
                ${input.daily_fiber_g ?? null},
                ${input.daily_sugar_g ?? null},
                ${input.daily_alcohol_g ?? null},
                ${input.daily_water_ml == null ? null : toStoredInteger(input.daily_water_ml)},
                ${input.target_weight_g ?? null},
                now()
            )
            on conflict (user_id) do update
            set daily_calories = excluded.daily_calories,
                daily_protein_g = excluded.daily_protein_g,
                daily_carbs_g = excluded.daily_carbs_g,
                daily_fat_g = excluded.daily_fat_g,
                daily_fiber_g = excluded.daily_fiber_g,
                daily_sugar_g = excluded.daily_sugar_g,
                daily_alcohol_g = excluded.daily_alcohol_g,
                daily_water_ml = excluded.daily_water_ml,
                target_weight_g = excluded.target_weight_g,
                updated_at = now()
            returning
                user_id,
                daily_calories,
                daily_protein_g,
                daily_carbs_g,
                daily_fat_g,
                daily_fiber_g,
                daily_sugar_g,
                daily_alcohol_g,
                daily_water_ml,
                target_weight_g,
                updated_at
        `;
        if (!rows[0]) throw new Error("Failed to save nutrition goals");
        return mapGoals(rows[0]);
    });
}

export async function getNutritionGoals(
    userId: string,
): Promise<NutritionGoals | null> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<NutritionGoalsRow>>`
            select
                user_id,
                daily_calories,
                daily_protein_g,
                daily_carbs_g,
                daily_fat_g,
                daily_fiber_g,
                daily_sugar_g,
                daily_alcohol_g,
                daily_water_ml,
                target_weight_g,
                updated_at
            from munch.nutrition_goals
            where user_id = ${userId}
        `;
        return rows[0] ? mapGoals(rows[0]) : null;
    });
}
