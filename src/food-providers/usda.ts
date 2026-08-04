import { FoodProviderError } from "./errors.js";
import {
    hasUsableNutrition,
    normalizeNutrients,
    nutrientCompleteness,
    type NutrientKey,
} from "./nutrients.js";
import {
    deduplicatePortions,
    per100gPortion,
    portionFromPer100g,
} from "./portions.js";
import type {
    BarcodeLookupInput,
    FoodCandidate,
    FoodDataKind,
    FoodLookupInput,
    FoodProvider,
    FoodSearchInput,
    NutrientValues,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const DEFAULT_TIMEOUT_MS = 8_000;

const NUTRIENT_ID_MAP: Record<number, NutrientKey> = {
    1008: "calories",
    1003: "protein_g",
    1005: "carbs_g",
    1004: "fat_g",
    1079: "fiber_g",
    2000: "sugar_g",
    1093: "sodium_mg",
    1258: "saturated_fat_g",
    1253: "cholesterol_mg",
    1092: "potassium_mg",
};

const NUTRIENT_NUMBER_MAP: Record<string, NutrientKey> = {
    "208": "calories",
    "203": "protein_g",
    "205": "carbs_g",
    "204": "fat_g",
    "291": "fiber_g",
    "269": "sugar_g",
    "307": "sodium_mg",
    "606": "saturated_fat_g",
    "601": "cholesterol_mg",
    "306": "potassium_mg",
};

interface UsdaSearchNutrient {
    nutrientId?: number;
    nutrientName?: string;
    nutrientNumber?: string;
    unitName?: string;
    value?: number;
}

interface UsdaSearchFood {
    fdcId?: number;
    description?: string;
    dataType?: string;
    brandOwner?: string;
    brandName?: string;
    gtinUpc?: string;
    publishedDate?: string;
    servingSize?: number;
    servingSizeUnit?: string;
    householdServingFullText?: string;
    foodNutrients?: UsdaSearchNutrient[];
}

interface UsdaDetailNutrient {
    amount?: number;
    nutrient?: {
        id?: number;
        number?: string;
        name?: string;
        unitName?: string;
    };
}

interface UsdaFoodPortion {
    id?: number;
    amount?: number;
    gramWeight?: number;
    modifier?: string;
    portionDescription?: string;
    measureUnit?: {
        name?: string;
        abbreviation?: string;
    };
}

interface UsdaFoodDetails {
    fdcId?: number;
    description?: string;
    dataType?: string;
    brandOwner?: string;
    brandName?: string;
    gtinUpc?: string;
    publishedDate?: string;
    foodNutrients?: UsdaDetailNutrient[];
    foodPortions?: UsdaFoodPortion[];
}

interface UsdaSearchResponse {
    foods?: UsdaSearchFood[];
}

export interface UsdaProviderOptions {
    apiKey?: string;
    baseUrl?: string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
}

function finiteNumber(value: unknown): number | undefined {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function nutrientKey(input: {
    id?: number;
    number?: string;
    name?: string;
}): NutrientKey | undefined {
    if (input.id !== undefined && NUTRIENT_ID_MAP[input.id]) {
        return NUTRIENT_ID_MAP[input.id];
    }
    if (input.number && NUTRIENT_NUMBER_MAP[input.number]) {
        return NUTRIENT_NUMBER_MAP[input.number];
    }
    const name = input.name?.toLowerCase() ?? "";
    if (name.includes("energy") && name.includes("kcal")) return "calories";
    if (name === "protein") return "protein_g";
    if (name.includes("carbohydrate")) return "carbs_g";
    if (name.includes("total lipid") || name === "total fat") return "fat_g";
    if (name.includes("fiber")) return "fiber_g";
    if (name.includes("sugars, total") || name === "total sugars")
        return "sugar_g";
    if (name === "sodium, na" || name === "sodium") return "sodium_mg";
    if (name.includes("fatty acids, total saturated")) return "saturated_fat_g";
    if (name === "cholesterol") return "cholesterol_mg";
    if (name === "potassium, k" || name === "potassium") return "potassium_mg";
    return undefined;
}

function normalizeSearchNutrients(
    nutrients: UsdaSearchNutrient[] | undefined,
): NutrientValues {
    const values: Partial<Record<NutrientKey, unknown>> = {};
    for (const nutrient of nutrients ?? []) {
        const key = nutrientKey({
            id: nutrient.nutrientId,
            number: nutrient.nutrientNumber,
            name: nutrient.nutrientName,
        });
        if (key && nutrient.value !== undefined) values[key] = nutrient.value;
    }
    return normalizeNutrients(values);
}

function normalizeDetailNutrients(
    nutrients: UsdaDetailNutrient[] | undefined,
): NutrientValues {
    const values: Partial<Record<NutrientKey, unknown>> = {};
    for (const item of nutrients ?? []) {
        const key = nutrientKey({
            id: item.nutrient?.id,
            number: item.nutrient?.number,
            name: item.nutrient?.name,
        });
        if (key && item.amount !== undefined) values[key] = item.amount;
    }
    return normalizeNutrients(values);
}

function dataKind(
    dataType: string | undefined,
    barcode?: string,
): FoodDataKind {
    const type = dataType?.toLowerCase() ?? "";
    if (type.includes("branded")) return barcode ? "packaged" : "branded";
    if (
        type.includes("foundation") ||
        type.includes("survey") ||
        type.includes("sr legacy")
    ) {
        return "generic";
    }
    return "unknown";
}

function confidenceFor(input: {
    kind: FoodDataKind;
    nutrients: NutrientValues;
    hasBrand: boolean;
    hasPortion: boolean;
}): number {
    const base =
        input.kind === "generic"
            ? 0.82
            : input.kind === "packaged"
              ? 0.78
              : 0.7;
    const score =
        base +
        nutrientCompleteness(input.nutrients) * 0.12 +
        (input.hasPortion ? 0.04 : 0) +
        (input.hasBrand ? 0.02 : 0);
    return Math.min(0.99, Math.round(score * 100) / 100);
}

function attribution(fdcId: string) {
    return {
        label: "USDA FoodData Central",
        url: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${encodeURIComponent(fdcId)}/nutrients`,
        license: "CC0 / public domain",
    };
}

function searchPortions(food: UsdaSearchFood, nutrients: NutrientValues) {
    const portions = [per100gPortion(nutrients)];
    const amount = finiteNumber(food.servingSize);
    const unit = food.servingSizeUnit?.trim().toLowerCase();
    if (amount && amount > 0 && unit === "g") {
        portions.unshift(
            portionFromPer100g({
                id: "declared-serving",
                amount: 1,
                unit: "serving",
                label:
                    food.householdServingFullText?.trim() ||
                    `${amount} g serving`,
                gramWeight: amount,
                nutrientsPer100g: nutrients,
            }),
        );
    }
    return deduplicatePortions(portions);
}

export function normalizeUsdaSearchFood(
    food: UsdaSearchFood,
): FoodCandidate | null {
    if (!food.fdcId || !food.description?.trim()) return null;
    const nutrients = normalizeSearchNutrients(food.foodNutrients);
    if (!hasUsableNutrition(nutrients)) return null;
    const providerFoodId = String(food.fdcId);
    const barcode = food.gtinUpc?.replace(/\D/g, "") || undefined;
    const kind = dataKind(food.dataType, barcode);
    const brand =
        food.brandName?.trim() || food.brandOwner?.trim() || undefined;
    const portions = searchPortions(food, nutrients);
    return {
        provider: "usda",
        providerFoodId,
        name: food.description.trim(),
        brand,
        barcode,
        dataKind: kind,
        nutrientsPer100g: nutrients,
        portions,
        sourceUpdatedAt: food.publishedDate,
        attribution: attribution(providerFoodId),
        confidence: confidenceFor({
            kind,
            nutrients,
            hasBrand: Boolean(brand),
            hasPortion: portions.length > 1,
        }),
    };
}

export function normalizeUsdaFoodDetails(
    food: UsdaFoodDetails,
): FoodCandidate | null {
    if (!food.fdcId || !food.description?.trim()) return null;
    const nutrients = normalizeDetailNutrients(food.foodNutrients);
    if (!hasUsableNutrition(nutrients)) return null;
    const providerFoodId = String(food.fdcId);
    const barcode = food.gtinUpc?.replace(/\D/g, "") || undefined;
    const kind = dataKind(food.dataType, barcode);
    const brand =
        food.brandName?.trim() || food.brandOwner?.trim() || undefined;
    const portions = [per100gPortion(nutrients)];
    for (const portion of food.foodPortions ?? []) {
        const gramWeight = finiteNumber(portion.gramWeight);
        const amount = finiteNumber(portion.amount) ?? 1;
        if (!gramWeight || gramWeight <= 0 || amount <= 0) continue;
        const unit =
            portion.measureUnit?.abbreviation?.trim() ||
            portion.measureUnit?.name?.trim() ||
            "serving";
        const label =
            portion.portionDescription?.trim() ||
            [amount, unit, portion.modifier?.trim()].filter(Boolean).join(" ");
        portions.unshift(
            portionFromPer100g({
                id: String(portion.id ?? `portion-${portions.length}`),
                amount,
                unit,
                label: label || `${amount} ${unit}`,
                gramWeight,
                nutrientsPer100g: nutrients,
            }),
        );
    }
    const normalizedPortions = deduplicatePortions(portions);
    return {
        provider: "usda",
        providerFoodId,
        name: food.description.trim(),
        brand,
        barcode,
        dataKind: kind,
        nutrientsPer100g: nutrients,
        portions: normalizedPortions,
        sourceUpdatedAt: food.publishedDate,
        attribution: attribution(providerFoodId),
        confidence: confidenceFor({
            kind,
            nutrients,
            hasBrand: Boolean(brand),
            hasPortion: normalizedPortions.length > 1,
        }),
    };
}

export class UsdaFoodDataCentralProvider implements FoodProvider {
    readonly name = "usda" as const;
    private readonly apiKey: string;
    private readonly baseUrl: string;
    private readonly fetchImpl: typeof fetch;
    private readonly timeoutMs: number;

    constructor(options: UsdaProviderOptions = {}) {
        this.apiKey =
            options.apiKey ?? process.env.USDA_FDC_API_KEY?.trim() ?? "";
        this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
        this.fetchImpl = options.fetchImpl ?? fetch;
        this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    }

    private requireApiKey(): string {
        if (!this.apiKey) {
            throw new FoodProviderError(
                "configuration_missing",
                "USDA_FDC_API_KEY is not configured",
                { provider: this.name },
            );
        }
        return this.apiKey;
    }

    private async requestJson<T>(path: string, init?: RequestInit): Promise<T> {
        const apiKey = this.requireApiKey();
        const separator = path.includes("?") ? "&" : "?";
        const response = await this.fetchImpl(
            `${this.baseUrl}${path}${separator}api_key=${encodeURIComponent(apiKey)}`,
            {
                ...init,
                headers: {
                    Accept: "application/json",
                    ...(init?.body
                        ? { "Content-Type": "application/json" }
                        : {}),
                    ...init?.headers,
                },
                signal: init?.signal ?? AbortSignal.timeout(this.timeoutMs),
            },
        );
        if (response.status === 404) {
            throw new FoodProviderError(
                "not_found",
                "USDA food was not found",
                {
                    provider: this.name,
                },
            );
        }
        if (response.status === 429) {
            const retryAfter = Number(response.headers.get("retry-after"));
            throw new FoodProviderError(
                "rate_limited",
                "USDA rate limit exceeded",
                {
                    provider: this.name,
                    retryAfterSeconds: Number.isFinite(retryAfter)
                        ? retryAfter
                        : undefined,
                },
            );
        }
        if (!response.ok) {
            throw new FoodProviderError(
                "provider_unavailable",
                `USDA request failed with status ${response.status}`,
                { provider: this.name },
            );
        }
        try {
            return (await response.json()) as T;
        } catch (error) {
            throw new FoodProviderError(
                "invalid_provider_response",
                "USDA returned invalid JSON",
                { provider: this.name, cause: error },
            );
        }
    }

    async search(input: FoodSearchInput): Promise<FoodCandidate[]> {
        const query = input.query.trim();
        if (!query) return [];
        const limit = Math.max(1, Math.min(25, input.limit ?? 10));
        const response = await this.requestJson<UsdaSearchResponse>(
            "/foods/search",
            {
                method: "POST",
                body: JSON.stringify({
                    query,
                    pageSize: limit,
                    pageNumber: 1,
                    sortBy: "dataType.keyword",
                    sortOrder: "asc",
                }),
                signal: input.signal,
            },
        );
        return (response.foods ?? [])
            .map(normalizeUsdaSearchFood)
            .filter((food): food is FoodCandidate => food !== null)
            .slice(0, limit);
    }

    async getDetails(input: FoodLookupInput): Promise<FoodCandidate | null> {
        const id = input.providerFoodId.trim();
        if (!/^\d+$/.test(id)) {
            throw new FoodProviderError(
                "invalid_request",
                "Invalid USDA food ID",
                {
                    provider: this.name,
                },
            );
        }
        try {
            const food = await this.requestJson<UsdaFoodDetails>(
                `/food/${encodeURIComponent(id)}`,
                { signal: input.signal },
            );
            return normalizeUsdaFoodDetails(food);
        } catch (error) {
            if (
                error instanceof FoodProviderError &&
                error.code === "not_found"
            ) {
                return null;
            }
            throw error;
        }
    }

    async lookupBarcode(
        input: BarcodeLookupInput,
    ): Promise<FoodCandidate | null> {
        const barcode = input.barcode.replace(/\D/g, "");
        if (barcode.length < 8 || barcode.length > 14) return null;
        const results = await this.search({
            query: barcode,
            limit: 10,
            signal: input.signal,
        });
        return (
            results.find((candidate) => candidate.barcode === barcode) ?? null
        );
    }
}
