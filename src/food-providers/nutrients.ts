import type { NutrientValues } from "./types.js";

export const NUTRIENT_KEYS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "alcohol_g",
    "sodium_mg",
    "saturated_fat_g",
    "cholesterol_mg",
    "potassium_mg",
] as const satisfies readonly (keyof NutrientValues)[];

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];

function finiteNonnegative(value: unknown): number | undefined {
    const parsed =
        typeof value === "number"
            ? value
            : typeof value === "string" && value.trim() !== ""
              ? Number(value)
              : Number.NaN;
    if (!Number.isFinite(parsed) || parsed < 0) return undefined;
    return Math.round(parsed * 100) / 100;
}

export function normalizeNutrients(
    input: Partial<Record<NutrientKey, unknown>>,
): NutrientValues {
    const normalized: NutrientValues = {};
    for (const key of NUTRIENT_KEYS) {
        const value = finiteNonnegative(input[key]);
        if (value !== undefined) normalized[key] = value;
    }
    return normalized;
}

export function scaleNutrients(
    nutrients: NutrientValues,
    factor: number,
): NutrientValues {
    if (!Number.isFinite(factor) || factor < 0) {
        throw new RangeError(
            "Nutrient scale factor must be finite and nonnegative",
        );
    }
    const scaled: NutrientValues = {};
    for (const key of NUTRIENT_KEYS) {
        const value = nutrients[key];
        if (value !== undefined) {
            scaled[key] = Math.round(value * factor * 100) / 100;
        }
    }
    return scaled;
}

export function addNutrients(values: NutrientValues[]): NutrientValues {
    const totals: NutrientValues = {};
    for (const nutrients of values) {
        for (const key of NUTRIENT_KEYS) {
            const value = nutrients[key];
            if (value !== undefined) {
                totals[key] =
                    Math.round(((totals[key] ?? 0) + value) * 100) / 100;
            }
        }
    }
    return totals;
}

export function nutrientCompleteness(nutrients: NutrientValues): number {
    const core: NutrientKey[] = ["calories", "protein_g", "carbs_g", "fat_g"];
    const corePresent = core.filter(
        (key) => nutrients[key] !== undefined,
    ).length;
    const optionalKeys = NUTRIENT_KEYS.filter((key) => !core.includes(key));
    const optionalPresent = optionalKeys.filter(
        (key) => nutrients[key] !== undefined,
    ).length;
    return Math.min(
        1,
        (corePresent / core.length) * 0.8 +
            (optionalPresent / optionalKeys.length) * 0.2,
    );
}

export function hasUsableNutrition(nutrients: NutrientValues): boolean {
    return ["calories", "protein_g", "carbs_g", "fat_g"].some(
        (key) => nutrients[key as NutrientKey] !== undefined,
    );
}
