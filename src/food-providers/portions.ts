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
        nutrients: scaleNutrients(input.nutrientsPer100g, input.gramWeight / 100),
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

export function scalePortion(portion: FoodPortion, quantity: number): FoodPortion {
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
