// Unit handling for the columns that are stored as whole numbers. Weight is
// stored canonically as integer grams; these pure helpers convert between grams
// and the user-facing units (kg / lb) so all conversion happens server-side
// rather than being delegated to the model. Energy is stored as whole kcal —
// see toStoredCalories at the bottom. Body measurements are stored as integer
// millimetres and converted to and from cm/in here.

import { ToolError } from "./errors.js";

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
        throw new ToolError(`Invalid weight value: ${value}`);
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
        throw new ToolError(
            "No weight unit given and no preference set. Pass unit ('kg' or 'lb'), or set a default first with set_weight_unit.",
        );
    }
    return unit;
}

// ---------- Length (body measurements) ----------

export type LengthUnit = "cm" | "in";

export const LENGTH_UNITS: readonly LengthUnit[] = ["cm", "in"];

const MM_PER_CM = 10;
const MM_PER_IN = 25.4; // international inch (exact)

/** Must equal body_measurement_log_kind_check in the migration (pinned by units.test.ts). */
export const BODY_MEASUREMENT_KINDS = [
    "waist",
    "hips",
    "neck",
    "chest",
    "shoulders",
    "upper_arm",
    "forearm",
    "thigh",
    "calf",
] as const;

export type BodyMeasurementKind = (typeof BODY_MEASUREMENT_KINDS)[number];

export function isBodyMeasurementKind(x: unknown): x is BodyMeasurementKind {
    return (BODY_MEASUREMENT_KINDS as readonly unknown[]).includes(x);
}

export function isLengthUnit(x: unknown): x is LengthUnit {
    return x === "cm" || x === "in";
}

/** "upper_arm" -> "Upper arm". Fixed vocabulary, never caller text. */
export function measurementLabel(kind: BodyMeasurementKind): string {
    const s = kind.replace("_", " ");
    return s[0]!.toUpperCase() + s.slice(1);
}

// Plausible adult circumference per site, in mm. These catch magnitude errors
// (mm typed as cm, an extra digit, cm/in swaps at the extremes), not unusual
// bodies: each minimum sits below the lowest documented real value (corseted
// waist, wasted arm, frail calf) and each maximum is >= ~1.25x the largest
// documented case (super obesity, lipedema, strongmen). Sources: ANSUR II raw
// data, NHANES 2015-18 (NCHS Series 3 No. 46), published extremes. Not health
// bands — nothing reads them as targets. Static ranges cannot catch a cm/in
// swap inside the overlap (e.g. upper_arm 12-39.4 is valid in both units).
export const PLAUSIBLE_LENGTH_MM: Record<
    BodyMeasurementKind,
    { min: number; max: number }
> = {
    waist: { min: 350, max: 2500 },
    hips: { min: 500, max: 3000 },
    neck: { min: 200, max: 900 },
    chest: { min: 500, max: 2500 },
    shoulders: { min: 600, max: 2500 },
    upper_arm: { min: 120, max: 1000 },
    forearm: { min: 120, max: 700 },
    thigh: { min: 250, max: 1500 },
    calf: { min: 150, max: 1200 },
};

export function isPlausibleLengthMm(
    kind: BodyMeasurementKind,
    mm: number,
): boolean {
    const r = PLAUSIBLE_LENGTH_MM[kind];
    return Number.isFinite(mm) && mm >= r.min && mm <= r.max;
}

/** Convert a value in the given unit to canonical integer millimetres (rounded). */
export function toMillimetres(value: number, unit: LengthUnit): number {
    if (!Number.isFinite(value)) {
        throw new ToolError(`Invalid length value: ${value}`);
    }
    return Math.round(unit === "cm" ? value * MM_PER_CM : value * MM_PER_IN);
}

/** 1-decimal display. 1 mm storage keeps inches within ±0.02 in. */
export function fromMillimetres(mm: number, unit: LengthUnit): number {
    const v = unit === "cm" ? mm / MM_PER_CM : mm / MM_PER_IN;
    return Math.round(v * 10) / 10;
}

/** Format canonical millimetres as a display string, e.g. "80 cm". */
export function formatLength(mm: number, unit: LengthUnit): string {
    return `${fromMillimetres(mm, unit)} ${unit}`;
}

/**
 * Convert to millimetres and check the site's plausible range. Throws a
 * ToolError; categorizeError matches "is outside the plausible range"
 * (invalid_numeric_value). The other-unit hint is only added when the same
 * number would be plausible in that unit, so it is never wrong.
 */
export function assertPlausibleLength(
    kind: BodyMeasurementKind,
    value: number,
    unit: LengthUnit,
): number {
    const mm = toMillimetres(value, unit);
    if (isPlausibleLengthMm(kind, mm)) return mm;
    const r = PLAUSIBLE_LENGTH_MM[kind];
    const other: LengthUnit = unit === "cm" ? "in" : "cm";
    const hint = isPlausibleLengthMm(kind, toMillimetres(value, other))
        ? ` As ${value} ${other} it would be in range; unit '${other}' records it that way.`
        : "";
    throw new ToolError(
        `${measurementLabel(kind)} ${value} ${unit} is outside the plausible range for this site ` +
            `(${fromMillimetres(r.min, "cm")}–${fromMillimetres(r.max, "cm")} cm / ` +
            `${fromMillimetres(r.min, "in")}–${fromMillimetres(r.max, "in")} in). Check the number and unit.${hint}`,
    );
}

/** Same contract as pickWriteUnit: explicit > saved preference > refuse. Takes no weight unit, by design. */
export function pickLengthWriteUnit(
    explicit: LengthUnit | undefined,
    preference: LengthUnit | null,
): LengthUnit {
    const unit = explicit ?? preference;
    if (!unit) {
        throw new ToolError(
            "No length unit given and no preference set. A unit ('cm' or 'in') is needed, either on this call or saved with set_length_unit.",
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
