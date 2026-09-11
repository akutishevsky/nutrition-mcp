// Unit handling for the columns that are stored as whole numbers. Weight is
// stored canonically as integer grams; these pure helpers convert between grams
// and the user-facing units (kg / lb) so all conversion happens server-side
// rather than being delegated to the model. Energy is stored as whole kcal —
// see toStoredCalories at the bottom.

import type { DrinkUnit } from "./alcohol.js";

export type WeightUnit = "kg" | "lb";

export const WEIGHT_UNITS: readonly WeightUnit[] = ["kg", "lb"];

const GRAMS_PER_KG = 1000;
const GRAMS_PER_LB = 453.59237; // international avoirdupois pound (exact)

// Plausible human body-weight range, used to reject gross entry errors (values
// typed in grams, an extra digit, or a sub-unit typo). Note this cannot catch a
// kg/lb swap within the human overlap (e.g. 80 kg vs 80 lb are both plausible) —
// the unit preference / explicit-unit rules guard that; this is the backstop for
// magnitude mistakes.
export const MIN_PLAUSIBLE_WEIGHT_G = 20_000; // 20 kg / ~44 lb
export const MAX_PLAUSIBLE_WEIGHT_G = 500_000; // 500 kg / ~1102 lb

export function isPlausibleWeightGrams(grams: number): boolean {
    return (
        Number.isFinite(grams) &&
        grams >= MIN_PLAUSIBLE_WEIGHT_G &&
        grams <= MAX_PLAUSIBLE_WEIGHT_G
    );
}

export function isWeightUnit(x: unknown): x is WeightUnit {
    return x === "kg" || x === "lb";
}

/** Convert a value in the given unit to canonical integer grams (rounded). */
export function toGrams(value: number, unit: WeightUnit): number {
    if (!Number.isFinite(value)) {
        throw new Error(`Invalid weight value: ${value}`);
    }
    const grams = unit === "kg" ? value * GRAMS_PER_KG : value * GRAMS_PER_LB;
    return Math.round(grams);
}

/** Convert canonical grams to the given unit, rounded to 1 decimal place. */
export function fromGrams(grams: number, unit: WeightUnit): number {
    const value = unit === "kg" ? grams / GRAMS_PER_KG : grams / GRAMS_PER_LB;
    return Math.round(value * 10) / 10;
}

/** Format canonical grams as a display string in the given unit, e.g. "75.5 kg". */
export function formatWeight(grams: number, unit: WeightUnit): string {
    return `${fromGrams(grams, unit)} ${unit}`;
}

/**
 * Choose the unit for a WRITE (logging/updating a weight, setting a target):
 * an explicit unit wins, otherwise the user's saved preference. Throws if
 * neither exists rather than guessing — silently assuming kg for someone who
 * meant lb is exactly the mis-log this module exists to prevent. Display paths
 * should instead coalesce a missing preference to "kg".
 */
export function pickWriteUnit(
    explicit: WeightUnit | undefined,
    preference: WeightUnit | null,
): WeightUnit {
    const unit = explicit ?? preference;
    if (!unit) {
        throw new Error(
            "No weight unit given and no preference set. Pass unit ('kg' or 'lb'), or set a default first with set_weight_unit.",
        );
    }
    return unit;
}

/**
 * Round an energy or volume value to what its column can actually hold.
 *
 * `meals.calories`, `nutrition_goals.daily_calories` and
 * `nutrition_goals.daily_water_ml` are `integer` columns, so Postgres rejects a
 * fractional value outright — `22P02 invalid input syntax for type integer:
 * "388.54"` — and the whole write fails. Fractional values are not exotic: Open
 * Food Facts returns decimal kcal from lookup_barcode, and Cronometer's
 * "Energy (kcal)" column is decimal in every export, so a Cronometer backfill
 * used to fail on most of its rows.
 *
 * Every write path rounds rather than rejecting. A tenth of a kcal is noise
 * against numbers that are estimates to begin with, so losing it is strictly
 * better than losing the row — and a schema-level `.int()` would reject the
 * caller's most common input for no benefit.
 *
 * Callers must round BEFORE deriving an idempotency key, so that the key and
 * the stored row describe the same meal.
 */
export function toStoredInteger(value: number): number {
    return Math.round(value);
}

/**
 * The unit the widgets read water in. Storage is millilitres either way; this
 * is display only.
 *
 * There is no volume preference on the profile, so it follows the body-weight
 * one: someone who weighs themselves in pounds reads a day's water in fluid
 * ounces, everyone else in litres. The US and UK fluid ounce differ by 4%
 * (29.57 vs 28.41 ml), so the size comes from the drink-unit preference — the
 * one setting that already says which of the two measuring systems the user
 * lives in — and defaults to US, as that preference does. Read the RAW
 * preference, not the alcohol-display gate: the size of an ounce has nothing
 * to do with whether alcohol is shown.
 *
 * Nutrients stay in grams for everyone: nutrition labels print grams in the US
 * as well.
 */
export type WaterUnit = "l" | "us_fl_oz" | "uk_fl_oz";

export const WATER_UNITS = ["l", "us_fl_oz", "uk_fl_oz"] as const;

export function waterUnitFor(
    weightUnit: WeightUnit | null,
    drinkUnit: DrinkUnit | null,
): WaterUnit {
    if (weightUnit !== "lb") return "l";
    return drinkUnit === "uk" ? "uk_fl_oz" : "us_fl_oz";
}
