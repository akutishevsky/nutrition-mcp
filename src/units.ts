// Weight unit handling. Weight is stored canonically as integer grams; these
// pure helpers convert between grams and the user-facing units (kg / lb) so all
// conversion happens server-side rather than being delegated to the model.

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
