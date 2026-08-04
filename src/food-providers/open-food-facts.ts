import { gramsFromDrink } from "../alcohol.js";
import { FoodProviderError } from "./errors.js";
import {
    hasUsableNutrition,
    normalizeNutrients,
    nutrientCompleteness,
} from "./nutrients.js";
import { deduplicatePortions, per100gPortion } from "./portions.js";
import type {
    BarcodeLookupInput,
    FoodCandidate,
    FoodLookupInput,
    FoodPortion,
    FoodProvider,
    FoodSearchInput,
    NutrientValues,
} from "./types.js";

const DEFAULT_BASE_URL = "https://world.openfoodfacts.org";
const DEFAULT_TIMEOUT_MS = 8_000;
const ABV_UNIT = "% vol";

interface OpenFoodFactsProduct {
    code?: string;
    product_name?: string;
    generic_name?: string;
    brands?: string;
    serving_size?: string;
    serving_quantity?: unknown;
    serving_quantity_unit?: unknown;
    last_modified_t?: number | string;
    nutriments?: Record<string, unknown>;
}

interface OpenFoodFactsProductResponse {
    status?: number;
    product?: OpenFoodFactsProduct;
}

interface OpenFoodFactsSearchResponse {
    products?: OpenFoodFactsProduct[];
}

export interface OpenFoodFactsProviderOptions {
    userAgent?: string;
    baseUrl?: string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
}

function finite(value: unknown): number | undefined {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return undefined;
    return Math.round(parsed * 100) / 100;
}

function finiteRaw(value: unknown): number | undefined {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function normalizedBarcode(value: unknown): string | undefined {
    const digits = String(value ?? "").replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 14 ? digits : undefined;
}

function firstBrand(value: string | undefined): string | undefined {
    return value?.split(",")[0]?.trim() || undefined;
}

function per100gNutrients(nutriments: Record<string, unknown>): NutrientValues {
    const sodiumG = finiteRaw(nutriments.sodium_100g);
    const cholesterolG = finiteRaw(nutriments.cholesterol_100g);
    const potassiumG = finiteRaw(nutriments.potassium_100g);
    return normalizeNutrients({
        calories: nutriments["energy-kcal_100g"],
        protein_g: nutriments.proteins_100g,
        carbs_g: nutriments.carbohydrates_100g,
        fat_g: nutriments.fat_100g,
        fiber_g: nutriments.fiber_100g,
        sugar_g: nutriments.sugars_100g,
        saturated_fat_g: nutriments["saturated-fat_100g"],
        sodium_mg: sodiumG === undefined ? undefined : sodiumG * 1_000,
        cholesterol_mg:
            cholesterolG === undefined ? undefined : cholesterolG * 1_000,
        potassium_mg: potassiumG === undefined ? undefined : potassiumG * 1_000,
    });
}

function servingVolumeMl(product: OpenFoodFactsProduct): number | undefined {
    const unit = String(product.serving_quantity_unit ?? "")
        .trim()
        .toLowerCase();
    if (unit !== "ml") return undefined;
    const amount = finite(product.serving_quantity);
    return amount && amount > 0 ? amount : undefined;
}

function alcoholPerServing(
    product: OpenFoodFactsProduct,
    nutriments: Record<string, unknown>,
): number | undefined {
    const unit = String(nutriments.alcohol_unit ?? "")
        .trim()
        .toLowerCase();
    if (unit !== ABV_UNIT) return undefined;
    const abv = finite(
        nutriments.alcohol_serving ??
            nutriments.alcohol_100g ??
            nutriments.alcohol,
    );
    const milliliters = servingVolumeMl(product);
    if (abv === undefined || abv > 100 || milliliters === undefined) {
        return undefined;
    }
    return Math.round(gramsFromDrink(milliliters, abv) * 100) / 100;
}

function servingNutrients(
    product: OpenFoodFactsProduct,
    nutriments: Record<string, unknown>,
): NutrientValues | undefined {
    if (
        !product.serving_size?.trim() ||
        nutriments["energy-kcal_serving"] === undefined
    ) {
        return undefined;
    }
    const sodiumG = finiteRaw(nutriments.sodium_serving);
    const cholesterolG = finiteRaw(nutriments.cholesterol_serving);
    const potassiumG = finiteRaw(nutriments.potassium_serving);
    return normalizeNutrients({
        calories: nutriments["energy-kcal_serving"],
        protein_g: nutriments.proteins_serving,
        carbs_g: nutriments.carbohydrates_serving,
        fat_g: nutriments.fat_serving,
        fiber_g: nutriments.fiber_serving,
        sugar_g: nutriments.sugars_serving,
        saturated_fat_g: nutriments["saturated-fat_serving"],
        alcohol_g: alcoholPerServing(product, nutriments),
        sodium_mg: sodiumG === undefined ? undefined : sodiumG * 1_000,
        cholesterol_mg:
            cholesterolG === undefined ? undefined : cholesterolG * 1_000,
        potassium_mg: potassiumG === undefined ? undefined : potassiumG * 1_000,
    });
}

function declaredServing(
    product: OpenFoodFactsProduct,
    nutrients: NutrientValues,
): FoodPortion {
    const quantity = finite(product.serving_quantity);
    const unit = String(product.serving_quantity_unit ?? "")
        .trim()
        .toLowerCase();
    return {
        id: "declared-serving",
        amount: 1,
        unit: "serving",
        label: product.serving_size?.trim() || "1 serving",
        gramWeight:
            quantity !== undefined && unit === "g" ? quantity : undefined,
        nutrients,
    };
}

function sourceUpdatedAt(
    value: number | string | undefined,
): string | undefined {
    const seconds = finite(value);
    if (seconds === undefined) return undefined;
    const date = new Date(seconds * 1_000);
    return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

export function normalizeOpenFoodFactsProduct(
    product: OpenFoodFactsProduct,
): FoodCandidate | null {
    const barcode = normalizedBarcode(product.code);
    const name = product.product_name?.trim() || product.generic_name?.trim();
    if (!barcode || !name) return null;
    const nutriments = product.nutriments ?? {};
    const nutrients100g = per100gNutrients(nutriments);
    const serving = servingNutrients(product, nutriments);
    if (!hasUsableNutrition(nutrients100g) && !serving) return null;
    const portions: FoodPortion[] = [];
    if (serving) portions.push(declaredServing(product, serving));
    if (hasUsableNutrition(nutrients100g)) {
        portions.push(per100gPortion(nutrients100g));
    }
    const normalizedPortions = deduplicatePortions(portions);
    const completeness = nutrientCompleteness(serving ?? nutrients100g);
    const confidence = Math.min(
        0.97,
        Math.round(
            (0.68 +
                completeness * 0.18 +
                (serving ? 0.06 : 0) +
                (firstBrand(product.brands) ? 0.03 : 0)) *
                100,
        ) / 100,
    );
    return {
        provider: "open_food_facts",
        providerFoodId: barcode,
        name,
        brand: firstBrand(product.brands),
        barcode,
        dataKind: "packaged",
        nutrientsPer100g: hasUsableNutrition(nutrients100g)
            ? nutrients100g
            : undefined,
        portions: normalizedPortions,
        sourceUpdatedAt: sourceUpdatedAt(product.last_modified_t),
        attribution: {
            label: "Open Food Facts",
            url: `https://world.openfoodfacts.org/product/${encodeURIComponent(barcode)}`,
            license: "Open Database License 1.0",
        },
        confidence,
    };
}

export class OpenFoodFactsProvider implements FoodProvider {
    readonly name = "open_food_facts" as const;
    private readonly userAgent: string;
    private readonly baseUrl: string;
    private readonly fetchImpl: typeof fetch;
    private readonly timeoutMs: number;

    constructor(options: OpenFoodFactsProviderOptions = {}) {
        this.userAgent =
            options.userAgent ?? process.env.OFF_USER_AGENT?.trim() ?? "";
        this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
        this.fetchImpl = options.fetchImpl ?? fetch;
        this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    }

    private requireUserAgent(): string {
        if (!this.userAgent) {
            throw new FoodProviderError(
                "configuration_missing",
                "OFF_USER_AGENT is not configured",
                { provider: this.name },
            );
        }
        return this.userAgent;
    }

    private async requestJson<T>(url: URL, signal?: AbortSignal): Promise<T> {
        const response = await this.fetchImpl(url, {
            headers: {
                Accept: "application/json",
                "User-Agent": this.requireUserAgent(),
            },
            signal: signal ?? AbortSignal.timeout(this.timeoutMs),
        });
        if (response.status === 404) {
            throw new FoodProviderError(
                "not_found",
                "Open Food Facts product was not found",
                { provider: this.name },
            );
        }
        if (response.status === 429) {
            const retryAfter = Number(response.headers.get("retry-after"));
            throw new FoodProviderError(
                "rate_limited",
                "Open Food Facts rate limit exceeded",
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
                `Open Food Facts request failed with status ${response.status}`,
                { provider: this.name },
            );
        }
        try {
            return (await response.json()) as T;
        } catch (error) {
            throw new FoodProviderError(
                "invalid_provider_response",
                "Open Food Facts returned invalid JSON",
                { provider: this.name, cause: error },
            );
        }
    }

    async search(input: FoodSearchInput): Promise<FoodCandidate[]> {
        const query = input.query.trim();
        if (!query) return [];
        const limit = Math.max(1, Math.min(25, input.limit ?? 10));
        const url = new URL("/cgi/search.pl", this.baseUrl);
        url.searchParams.set("search_terms", query);
        url.searchParams.set("search_simple", "1");
        url.searchParams.set("action", "process");
        url.searchParams.set("json", "1");
        url.searchParams.set("page_size", String(limit));
        url.searchParams.set(
            "fields",
            "code,product_name,generic_name,brands,serving_size,serving_quantity,serving_quantity_unit,last_modified_t,nutriments",
        );
        const response = await this.requestJson<OpenFoodFactsSearchResponse>(
            url,
            input.signal,
        );
        return (response.products ?? [])
            .map(normalizeOpenFoodFactsProduct)
            .filter((food): food is FoodCandidate => food !== null)
            .slice(0, limit);
    }

    async getDetails(input: FoodLookupInput): Promise<FoodCandidate | null> {
        return this.lookupBarcode({
            barcode: input.providerFoodId,
            signal: input.signal,
        });
    }

    async lookupBarcode(
        input: BarcodeLookupInput,
    ): Promise<FoodCandidate | null> {
        const barcode = normalizedBarcode(input.barcode);
        if (!barcode) return null;
        const url = new URL(
            `/api/v2/product/${encodeURIComponent(barcode)}.json`,
            this.baseUrl,
        );
        url.searchParams.set(
            "fields",
            "code,product_name,generic_name,brands,serving_size,serving_quantity,serving_quantity_unit,last_modified_t,nutriments",
        );
        try {
            const response =
                await this.requestJson<OpenFoodFactsProductResponse>(
                    url,
                    input.signal,
                );
            if (response.status === 0 || !response.product) return null;
            return normalizeOpenFoodFactsProduct({
                ...response.product,
                code: response.product.code ?? barcode,
            });
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
}
