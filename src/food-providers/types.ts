export type FoodProviderName = "usda" | "open_food_facts";

export type FoodDataKind =
    | "generic"
    | "branded"
    | "packaged"
    | "restaurant"
    | "unknown";

export interface NutrientValues {
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sugar_g?: number;
    sodium_mg?: number;
    saturated_fat_g?: number;
    cholesterol_mg?: number;
    potassium_mg?: number;
}

export interface FoodPortion {
    id: string;
    amount: number;
    unit: string;
    label: string;
    gramWeight?: number;
    nutrients: NutrientValues;
}

export interface FoodAttribution {
    label: string;
    url?: string;
    license?: string;
}

export interface FoodCandidate {
    provider: FoodProviderName;
    providerFoodId: string;
    name: string;
    brand?: string;
    barcode?: string;
    dataKind: FoodDataKind;
    nutrientsPer100g?: NutrientValues;
    portions: FoodPortion[];
    sourceUpdatedAt?: string;
    attribution: FoodAttribution;
    confidence: number;
    raw?: Record<string, unknown>;
}

export interface FoodSearchInput {
    query: string;
    limit?: number;
    signal?: AbortSignal;
}

export interface FoodLookupInput {
    providerFoodId: string;
    signal?: AbortSignal;
}

export interface BarcodeLookupInput {
    barcode: string;
    signal?: AbortSignal;
}

export interface FoodProvider {
    readonly name: FoodProviderName;
    search(input: FoodSearchInput): Promise<FoodCandidate[]>;
    getDetails?(input: FoodLookupInput): Promise<FoodCandidate | null>;
    lookupBarcode?(input: BarcodeLookupInput): Promise<FoodCandidate | null>;
}
