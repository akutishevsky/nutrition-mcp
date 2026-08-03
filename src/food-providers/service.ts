import { cacheFood, getCachedFood } from "../supabase.js";
import {
    createCacheEnvelope,
    foodCacheKey,
    readCacheEnvelope,
} from "./cache.js";
import { OpenFoodFactsProvider } from "./open-food-facts.js";
import {
    FoodProviderRegistry,
    type AggregatedFoodSearchResult,
} from "./registry.js";
import type {
    FoodCandidate,
    FoodProviderName,
} from "./types.js";
import { UsdaFoodDataCentralProvider } from "./usda.js";

const CACHE_SOURCE = "normalized_food_provider_v1";
const SEARCH_TTL_MS = 6 * 60 * 60 * 1_000;
const DETAILS_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

export interface FoodCandidateSummary {
    candidate_id: string;
    name: string;
    brand: string | null;
    provider: FoodProviderName;
    provider_label: string;
    data_kind: FoodCandidate["dataKind"];
    barcode: string | null;
    confidence: number;
    default_portion: {
        id: string;
        label: string;
        calories: number | null;
        protein_g: number | null;
        carbs_g: number | null;
        fat_g: number | null;
    } | null;
}

function normalizedQuery(query: string): string {
    return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export function encodeFoodCandidateId(candidate: Pick<FoodCandidate, "provider" | "providerFoodId">): string {
    return `${candidate.provider}:${encodeURIComponent(candidate.providerFoodId)}`;
}

export function decodeFoodCandidateId(value: string): {
    provider: FoodProviderName;
    providerFoodId: string;
} | null {
    const separator = value.indexOf(":");
    if (separator <= 0) return null;
    const provider = value.slice(0, separator);
    if (provider !== "usda" && provider !== "open_food_facts") return null;
    try {
        const providerFoodId = decodeURIComponent(value.slice(separator + 1));
        if (!providerFoodId || providerFoodId.length > 255) return null;
        return { provider, providerFoodId };
    } catch {
        return null;
    }
}

export function summarizeFoodCandidate(
    candidate: FoodCandidate,
): FoodCandidateSummary {
    const portion = candidate.portions[0];
    return {
        candidate_id: encodeFoodCandidateId(candidate),
        name: candidate.name,
        brand: candidate.brand ?? null,
        provider: candidate.provider,
        provider_label: candidate.attribution.label,
        data_kind: candidate.dataKind,
        barcode: candidate.barcode ?? null,
        confidence: candidate.confidence,
        default_portion: portion
            ? {
                  id: portion.id,
                  label: portion.label,
                  calories: portion.nutrients.calories ?? null,
                  protein_g: portion.nutrients.protein_g ?? null,
                  carbs_g: portion.nutrients.carbs_g ?? null,
                  fat_g: portion.nutrients.fat_g ?? null,
              }
            : null,
    };
}

async function readCache<T>(key: string): Promise<T | null> {
    try {
        return readCacheEnvelope<T>(
            await getCachedFood(CACHE_SOURCE, key),
        );
    } catch {
        return null;
    }
}

async function writeCache<T>(
    key: string,
    value: T,
    ttlMs: number,
): Promise<void> {
    try {
        await cacheFood(
            CACHE_SOURCE,
            key,
            createCacheEnvelope(value, ttlMs),
        );
    } catch {
        // Provider cache is strictly best-effort.
    }
}

export class FoodSearchService {
    constructor(
        private readonly registry = new FoodProviderRegistry([
            new UsdaFoodDataCentralProvider(),
            new OpenFoodFactsProvider(),
        ]),
    ) {}

    async search(query: string, limit = 10): Promise<AggregatedFoodSearchResult> {
        const normalized = normalizedQuery(query);
        if (!normalized) return { candidates: [], failures: [] };
        const boundedLimit = Math.max(1, Math.min(25, limit));
        const key = foodCacheKey(
            "aggregate",
            "search",
            `${normalized}:${boundedLimit}`,
        );
        const cached = await readCache<FoodCandidate[]>(key);
        if (cached) return { candidates: cached, failures: [] };

        const result = await this.registry.search({
            query: normalized,
            limit: boundedLimit,
        });
        if (result.failures.length === 0) {
            await writeCache(key, result.candidates, SEARCH_TTL_MS);
        }
        return result;
    }

    async details(candidateId: string): Promise<FoodCandidate | null> {
        const decoded = decodeFoodCandidateId(candidateId);
        if (!decoded) return null;
        const key = foodCacheKey(
            decoded.provider,
            "details",
            decoded.providerFoodId,
        );
        const cached = await readCache<FoodCandidate>(key);
        if (cached) return cached;
        const candidate = await this.registry.getDetails(decoded.provider, {
            providerFoodId: decoded.providerFoodId,
        });
        if (candidate) await writeCache(key, candidate, DETAILS_TTL_MS);
        return candidate;
    }

    async barcode(barcode: string): Promise<AggregatedFoodSearchResult> {
        const digits = barcode.replace(/\D/g, "");
        if (digits.length < 8 || digits.length > 14) {
            return { candidates: [], failures: [] };
        }
        const key = foodCacheKey("aggregate", "barcode", digits);
        const cached = await readCache<FoodCandidate[]>(key);
        if (cached) return { candidates: cached, failures: [] };
        const result = await this.registry.lookupBarcode({ barcode: digits });
        if (result.failures.length === 0) {
            await writeCache(key, result.candidates, DETAILS_TTL_MS);
        }
        return result;
    }
}

let sharedService: FoodSearchService | null = null;

export function getFoodSearchService(): FoodSearchService {
    sharedService ??= new FoodSearchService();
    return sharedService;
}
