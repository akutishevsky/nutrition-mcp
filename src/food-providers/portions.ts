import { scaleNutrients } from "./nutrients.js";
import type { FoodPortion, NutrientValues } from "./types.js";

export function normalizePortionUnit(unit: string): string {
    const normalized = unit.trim().toLowerCase().replace(/\s+/g, " ");
    const aliases: Record<string, string> = {
        grams: "g",
        gram: "g",
        milliliters: "ml",
        milliliter: "ml",
        millilitres: "ml",
        millilitre: "ml",
        ounces: "oz",
        ounce: "oz",
        cups: "cup",
        tablespoons: "tbsp",
        tablespoon: "tbsp",
        teaspoons: "tsp",
        teaspoon: "tsp",
    };
    return aliases[normalized] ?? normalized;
}

export function portionFromPer100g(input: {
    id: string;
    amount: number;
    unit: string;
    label: string;
    gramWeight: number;
    nutrientsPer100g: NutrientValues;
}): FoodPortion {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
        throw new RangeError("Portion amount must be positive");
    }
    if (!Number.isFinite(input.gramWeight) || input.gramWeight <= 0) {
        throw new RangeError("Portion gram weight must be positive");
    }
    return {
        id: input.id,
        amount: input.amount,
        unit: normalizePortionUnit(input.unit),
        label: input.label.trim() || `${input.amount} ${input.unit}`,
        gramWeight: Math.round(input.gramWeight * 100) / 100,
        nutrients: scaleNutrients(
            input.nutrientsPer100g,
            input.gramWeight / 100,
        ),
    };
}

export function per100gPortion(nutrients: NutrientValues): FoodPortion {
    return {
        id: "100g",
        amount: 100,
        unit: "g",
        label: "100 g",
        gramWeight: 100,
        nutrients: { ...nutrients },
    };
}

export function scalePortion(
    portion: FoodPortion,
    quantity: number,
): FoodPortion {
    if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new RangeError("Portion quantity must be positive");
    }
    return {
        ...portion,
        id: `${portion.id}:quantity:${quantity}`,
        amount: Math.round(portion.amount * quantity * 100) / 100,
        label: `${quantity} servings of ${portion.label}`,
        gramWeight:
            portion.gramWeight === undefined
                ? undefined
                : Math.round(portion.gramWeight * quantity * 100) / 100,
        nutrients: scaleNutrients(portion.nutrients, quantity),
    };
}

/**
 * Portions that must never be the headline/default portion: USDA
 * "guideline amount" rows and "quantity not specified" rows describe
 * reference amounts, not a portion anyone eats. Matched on the label
 * text only — data-driven, no per-food rules.
 */
const NON_HEADLINE_PORTION_PATTERN = /guideline amount|quantity not specified/i;

/**
 * Household units a person actually serves themselves with. Used only
 * to rank portions for display/defaults, never to filter them out.
 */
const HOUSEHOLD_PORTION_UNITS = new Set([
    "cup",
    "slice",
    "tbsp",
    "tsp",
    "piece",
    "scoop",
    "whole",
    "can",
    "container",
    "packet",
    "bottle",
    "bar",
    "serving",
]);

export function isNonHeadlinePortion(portion: FoodPortion): boolean {
    return NON_HEADLINE_PORTION_PATTERN.test(portion.label);
}

export function isPer100gPortion(portion: FoodPortion): boolean {
    if (portion.id === "100g") return true;
    return (
        portion.amount === 100 &&
        normalizePortionUnit(portion.unit) === "g" &&
        portion.gramWeight === 100
    );
}

function isHouseholdPortion(portion: FoodPortion): boolean {
    if (HOUSEHOLD_PORTION_UNITS.has(normalizePortionUnit(portion.unit))) {
        return true;
    }
    const labelTokens = portion.label
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter(Boolean);
    return labelTokens.some((token) => HOUSEHOLD_PORTION_UNITS.has(token));
}

/**
 * Display rank for a portion (lower sorts first):
 * 0 — one household unit (1 cup, 1 slice, 1 tbsp…), the natural way
 *     the food is served;
 * 1 — a household unit at another amount;
 * 2 — any other single real portion (1 medium apple, 1 fillet…);
 * 3 — any other real portion;
 * 4 — the per-100 g reference portion (fallback headline only);
 * 5 — non-headline portions (guideline amount / quantity not
 *     specified), which sort last and are never picked as the default
 *     while any real or per-100 g portion exists.
 */
export function portionNaturalRank(portion: FoodPortion): number {
    if (isNonHeadlinePortion(portion)) return 5;
    if (isPer100gPortion(portion)) return 4;
    if (isHouseholdPortion(portion)) return portion.amount === 1 ? 0 : 1;
    return portion.amount === 1 ? 2 : 3;
}

export function sortPortionsNaturalFirst(
    portions: FoodPortion[],
): FoodPortion[] {
    return portions
        .map((portion, index) => ({ portion, index }))
        .sort((a, b) => {
            const rankDelta =
                portionNaturalRank(a.portion) - portionNaturalRank(b.portion);
            if (rankDelta !== 0) return rankDelta;
            if (portionNaturalRank(a.portion) <= 3) {
                const weightDelta =
                    (b.portion.gramWeight ?? 0) - (a.portion.gramWeight ?? 0);
                if (weightDelta !== 0) return weightDelta;
            }
            return a.index - b.index;
        })
        .map(({ portion }) => portion);
}

/**
 * The portion to headline for a food: the most natural real portion
 * (see portionNaturalRank). Returns undefined when the list carries
 * only non-headline portions, so callers can fall back to a per-100 g
 * portion synthesized from the nutrient panel instead of headlining a
 * guideline/quantity-not-specified row.
 */
export function naturalPortion(
    portions: FoodPortion[],
): FoodPortion | undefined {
    return sortPortionsNaturalFirst(portions).find(
        (portion) => portionNaturalRank(portion) < 5,
    );
}

/** "1 cup · 244 g" — option label for portion pickers. */
export function portionOptionLabel(portion: FoodPortion): string {
    if (portion.gramWeight === undefined) return portion.label;
    if (/\d+(?:\.\d+)?\s*g\b/i.test(portion.label)) return portion.label;
    const grams =
        Math.round(portion.gramWeight * 10) / 10 === portion.gramWeight
            ? String(portion.gramWeight)
            : (Math.round(portion.gramWeight * 10) / 10).toFixed(1);
    return `${portion.label} · ${grams} g`;
}

export function deduplicatePortions(portions: FoodPortion[]): FoodPortion[] {
    const seen = new Set<string>();
    const result: FoodPortion[] = [];
    for (const portion of portions) {
        const key = [
            normalizePortionUnit(portion.unit),
            portion.amount,
            portion.gramWeight ?? "",
            portion.label.trim().toLowerCase(),
        ].join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(portion);
    }
    return result;
}
