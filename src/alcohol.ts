// Alcohol unit handling. Alcohol is stored canonically as grams of pure
// ethanol; these pure helpers convert between grams and the user-facing
// "standard drink" so all conversion happens server-side rather than being
// delegated to the model.
//
// Grams are canonical because a standard drink is not portable: the US and the
// UK disagree about its size by nearly a factor of two, so the same 330 mL 5%
// beer is 0.93 US drinks or 1.65 UK units. Storing drinks would bake one
// country's definition into the database; storing grams keeps the choice a
// render-time concern.

import { ToolError } from "./errors.js";

export type DrinkUnit = "us" | "uk";

export const DRINK_UNITS: readonly DrinkUnit[] = ["us", "uk"];

// Density of ethanol at 20 °C (CRC Handbook). Deliberately not the 0.8 that
// circulates in blog posts and calculator apps — that inflates every figure by
// 1.4%, and it fails to reproduce the NIAAA standard drink. At 0.789 all three
// NIAAA definitions (12 fl oz @ 5%, 5 fl oz @ 12%, 1.5 fl oz @ 40%) land on
// exactly 14.00 g, which is the check src/alcohol.test.ts pins down.
export const ETHANOL_DENSITY_G_PER_ML = 0.789;

// NIAAA: one US standard drink is 0.6 fl oz (14 g) of pure ethanol.
export const US_STANDARD_DRINK_G = 14;

// NHS: one UK unit is 10 mL of pure ethanol. 10 mL x 0.78933 g/mL = 7.893 g.
// Carrying the extra digit of the density here (rather than 7.89) is what makes
// grams / UK_UNIT_G reproduce the NHS volumetric shortcut, units = ABV x mL /
// 1000, to within a hundredth of a unit across the realistic drink range.
export const UK_UNIT_G = 7.893;

export const ML_PER_US_FL_OZ = 29.5735;

const GRAMS_PER_DRINK: Record<DrinkUnit, number> = {
    us: US_STANDARD_DRINK_G,
    uk: UK_UNIT_G,
};

const DRINK_UNIT_LABEL: Record<DrinkUnit, string> = {
    us: "US drinks",
    uk: "UK units",
};

export function isDrinkUnit(x: unknown): x is DrinkUnit {
    return x === "us" || x === "uk";
}

/** Convert US fluid ounces to millilitres, for callers working from a US label. */
export function mlFromFlOz(flOz: number): number {
    return flOz * ML_PER_US_FL_OZ;
}

/**
 * Grams of pure ethanol in a drink of the given volume and strength, rounded to
 * 2 decimals. ABV is a percentage (5, not 0.05) because that is how every label
 * and every export prints it; taking a fraction here would silently turn a 40%
 * spirit into a 0.4% near-beer.
 */
export function gramsFromDrink(volumeMl: number, abvPercent: number): number {
    if (!Number.isFinite(volumeMl) || volumeMl < 0) {
        throw new ToolError(`Invalid drink volume (mL): ${volumeMl}`);
    }
    if (!Number.isFinite(abvPercent) || abvPercent < 0 || abvPercent > 100) {
        throw new ToolError(
            `Invalid ABV (expected a percentage between 0 and 100): ${abvPercent}`,
        );
    }
    const ethanolMl = volumeMl * (abvPercent / 100);
    return Math.round(ethanolMl * ETHANOL_DENSITY_G_PER_ML * 100) / 100;
}

/**
 * Convert canonical grams to standard drinks in the given unit, rounded to 2
 * decimals. Two decimals rather than one because a single drink is a large
 * quantum: rounding 13 g to "0.9" throws away more than a tenth of a beer.
 *
 * Unvalidated on purpose, matching the read side of src/units.ts — bad values
 * are rejected where they enter (gramsFromDrink, the tool schemas), not on
 * every display path.
 */
export function toDrinks(grams: number, unit: DrinkUnit): number {
    return Math.round((grams / GRAMS_PER_DRINK[unit]) * 100) / 100;
}

/** Inverse of toDrinks: grams of ethanol in N standard drinks, to 2 decimals. */
export function fromDrinks(drinks: number, unit: DrinkUnit): number {
    return Math.round(drinks * GRAMS_PER_DRINK[unit] * 100) / 100;
}

/**
 * Format canonical grams for display, e.g. "28 g (2.0 US drinks)". Grams lead
 * because they are what we actually stored and what a goal is set against; the
 * drink count trails as the intuitive gloss. Drinks show 1 decimal here even
 * though toDrinks carries 2 — "2.0 drinks" is a quantity a person can picture,
 * "1.96" reads like a measurement error.
 *
 * The 1-decimal figure comes off the raw ratio rather than off toDrinks, so a
 * value near a boundary is not rounded twice (3.549 -> 3.55 -> "3.6", a tenth
 * of a drink invented by the formatter).
 */
export function formatAlcohol(grams: number, unit: DrinkUnit): string {
    const rounded = Math.round(grams * 10) / 10;
    const drinks = (grams / GRAMS_PER_DRINK[unit]).toFixed(1);
    return `${rounded} g (${drinks} ${DRINK_UNIT_LABEL[unit]})`;
}
