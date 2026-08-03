import { asFoodProviderError, type FoodProviderErrorCode } from "./errors.js";
import { rankCandidates } from "./ranking.js";
import type {
    BarcodeLookupInput,
    FoodCandidate,
    FoodLookupInput,
    FoodProvider,
    FoodProviderName,
    FoodSearchInput,
} from "./types.js";

export interface FoodProviderFailure {
    provider: FoodProviderName;
    code: FoodProviderErrorCode;
    message: string;
    retryAfterSeconds?: number;
}

export interface AggregatedFoodSearchResult {
    candidates: FoodCandidate[];
    failures: FoodProviderFailure[];
}

interface ProviderCallResult<T> {
    provider: FoodProviderName;
    value: T;
}

export class FoodProviderRegistry {
    private readonly providers: Map<FoodProviderName, FoodProvider>;

    constructor(providers: FoodProvider[]) {
        this.providers = new Map();
        for (const provider of providers) {
            if (this.providers.has(provider.name)) {
                throw new Error(`Duplicate food provider: ${provider.name}`);
            }
            this.providers.set(provider.name, provider);
        }
    }

    listProviders(): FoodProviderName[] {
        return [...this.providers.keys()];
    }

    async search(input: FoodSearchInput): Promise<AggregatedFoodSearchResult> {
        const query = input.query.trim();
        if (!query) return { candidates: [], failures: [] };
        const limit = Math.max(1, Math.min(25, input.limit ?? 10));
        const providers = [...this.providers.values()];
        const settled = await Promise.allSettled(
            providers.map(async (provider): Promise<ProviderCallResult<FoodCandidate[]>> => {
                try {
                    return {
                        provider: provider.name,
                        value: await provider.search({ ...input, query, limit }),
                    };
                } catch (error) {
                    throw asFoodProviderError(error, provider.name);
                }
            }),
        );

        const candidates: FoodCandidate[] = [];
        const failures: FoodProviderFailure[] = [];
        for (const result of settled) {
            if (result.status === "fulfilled") {
                candidates.push(...result.value.value);
                continue;
            }
            const error = asFoodProviderError(result.reason);
            failures.push({
                provider: error.provider as FoodProviderName,
                code: error.code,
                message: error.message,
                retryAfterSeconds: error.retryAfterSeconds,
            });
        }

        return {
            candidates: rankCandidates({ query }, candidates).slice(0, limit),
            failures,
        };
    }

    async getDetails(
        providerName: FoodProviderName,
        input: FoodLookupInput,
    ): Promise<FoodCandidate | null> {
        const provider = this.providers.get(providerName);
        if (!provider?.getDetails) return null;
        try {
            return await provider.getDetails(input);
        } catch (error) {
            throw asFoodProviderError(error, provider.name);
        }
    }

    async lookupBarcode(
        input: BarcodeLookupInput,
    ): Promise<AggregatedFoodSearchResult> {
        const providers = [...this.providers.values()].filter(
            (provider) => provider.lookupBarcode,
        );
        const settled = await Promise.allSettled(
            providers.map(async (provider): Promise<ProviderCallResult<FoodCandidate | null>> => {
                try {
                    return {
                        provider: provider.name,
                        value: await provider.lookupBarcode!(input),
                    };
                } catch (error) {
                    throw asFoodProviderError(error, provider.name);
                }
            }),
        );
        const candidates: FoodCandidate[] = [];
        const failures: FoodProviderFailure[] = [];
        for (const result of settled) {
            if (result.status === "fulfilled") {
                if (result.value.value) candidates.push(result.value.value);
            } else {
                const error = asFoodProviderError(result.reason);
                failures.push({
                    provider: error.provider as FoodProviderName,
                    code: error.code,
                    message: error.message,
                    retryAfterSeconds: error.retryAfterSeconds,
                });
            }
        }
        return {
            candidates: rankCandidates({ query: input.barcode }, candidates),
            failures,
        };
    }
}
