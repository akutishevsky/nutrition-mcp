// The USDA FoodData Central record as the food cache stores it. Pure: no
// Supabase, no HTTP, no mcp.ts import, so src/provenance.ts can verify a logged
// value against it and the USDA client (a later part) can fill it.
//
// src/usda.ts writes a row of this shape (normalizeDetail, then the cache
// store) and reads it back through usdaRecordFromPayload. A usda reference with
// no cache row, or a row that fails the shape check, finds nothing and every
// value it names is an estimate (src/provenance.ts). One payload per FoodData
// Central id, nutrients per 100 g; a nutrient the record does not carry is
// absent from per100g, which means "not recorded", never 0.

import { MEAL_NUTRIENT_KEYS, type MealNutrientKey } from "./meal-items.js";

/** The food_cache `source` value of a USDA record. */
export const USDA_CACHE_SOURCE = "usda" as const;

/** FoodData Central data types this server reads. Branded foods are out of
 * scope; a record of any other type is never cached. */
export type UsdaDataType = "Foundation" | "SR Legacy" | "Survey (FNDDS)";

/** A portion the record names: a label ("1 banana", "1 cup, sliced") and its
 * weight in grams. Only used to describe a serving in a later part. */
export interface UsdaPortion {
    label: string;
    grams: number;
}

/** The normalized USDA payload stored in food_cache.payload. `per100g` holds
 * the nutrient values for 100 g of the food, keyed by the meal nutrient they
 * map to; a nutrient the record does not carry is absent or null, never 0. */
export interface UsdaRecord {
    fdc_id: number;
    name: string;
    data_type: UsdaDataType;
    per100g: Partial<Record<MealNutrientKey, number | null>>;
    portions: UsdaPortion[];
}

/** The food_cache source_id of a FoodData Central id: the id as a decimal
 * string. */
export function usdaSourceId(fdcId: number): string {
    return String(fdcId);
}

/** Turns a raw food_cache payload into a UsdaRecord, or null when it is not one.
 * Shape checks only: a nutrient value is kept only as a finite non-negative
 * number, and any key that is not a meal nutrient key is dropped. A row that
 * fails here reads as a miss, so a bad row can never label a value. */
export function usdaRecordFromPayload(payload: unknown): UsdaRecord | null {
    if (!payload || typeof payload !== "object") return null;
    const p = payload as Record<string, unknown>;
    if (
        typeof p.fdc_id !== "number" ||
        !Number.isInteger(p.fdc_id) ||
        p.fdc_id <= 0
    )
        return null;
    if (typeof p.name !== "string" || p.name.length === 0) return null;
    if (
        p.data_type !== "Foundation" &&
        p.data_type !== "SR Legacy" &&
        p.data_type !== "Survey (FNDDS)"
    )
        return null;
    if (!p.per100g || typeof p.per100g !== "object") return null;
    const raw = p.per100g as Record<string, unknown>;
    const per100g: UsdaRecord["per100g"] = {};
    // Only the meal nutrient keys are kept: a key we do not map (an unknown or
    // a future nutrient in the cached payload) is dropped, never copied through.
    for (const key of MEAL_NUTRIENT_KEYS) {
        const value = raw[key];
        if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
            per100g[key] = value;
        }
    }
    const portions = Array.isArray(p.portions)
        ? p.portions.flatMap((x): UsdaPortion[] => {
              if (!x || typeof x !== "object") return [];
              const o = x as Record<string, unknown>;
              if (typeof o.label !== "string") return [];
              if (typeof o.grams !== "number" || !(o.grams > 0)) return [];
              return [{ label: o.label, grams: o.grams }];
          })
        : [];
    return {
        fdc_id: p.fdc_id,
        name: p.name,
        data_type: p.data_type,
        per100g,
        portions,
    };
}

/** The signature of the USDA normalizer (normalizeDetail in src/usda.ts): a raw
 * FoodData Central detail response in, the cache payload out, null when the
 * record is unusable. */
export type UsdaNormalizer = (raw: unknown) => UsdaRecord | null;
