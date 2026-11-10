import { describe, expect, test } from "bun:test";
import type {
    FoodCatalogRepository,
    CatalogHit,
} from "./catalog-repository.js";
import { FoodProviderError } from "./errors.js";
import { FoodProviderRegistry } from "./registry.js";
import { FoodSearchService } from "./service.js";
import type { FoodCandidate, FoodProvider } from "./types.js";

function candidate(overrides: Partial<FoodCandidate> = {}): FoodCandidate {
    return {
        provider: "usda",
        providerFoodId: "321358",
        name: "banana",
        dataKind: "generic",
        nutrientsPer100g: {
            calories: 89,
            protein_g: 1.09,
            carbs_g: 22.84,
            fat_g: 0.33,
        },
        portions: [
            {
                id: "100g",
                amount: 100,
                unit: "g",
                label: "100 g",
                gramWeight: 100,
                nutrients: { calories: 89 },
            },
        ],
        attribution: { label: "USDA FoodData Central" },
        confidence: 0.96,
        ...overrides,
    };
}

function fakeCatalog(
    overrides: Record<string, unknown> = {},
): FoodCatalogRepository {
    return {
        async findCachedSearch() {
            return null;
        },
        async searchLocal() {
            return [];
        },
        async upsertMany() {},
        async upsertAndRecordSearch() {},
        async recordSearch() {},
        async findByProviderId() {
            return null;
        },
        async findByBarcode() {
            return [];
        },
        async isNegative() {
            return false;
        },
        async recordNegative() {},
        async upsert() {},
        ...overrides,
    } as unknown as FoodCatalogRepository;
}

function hit(food: FoodCandidate, stale = false): CatalogHit {
    return { candidate: food, stale };
}

describe("food locality and cache behavior", () => {
    test("a fresh exact local match makes zero provider calls", async () => {
        let providerCalls = 0;
        const provider: FoodProvider = {
            name: "usda",
            async search() {
                providerCalls += 1;
                return [candidate({ providerFoodId: "remote" })];
            },
        };
        const service = new FoodSearchService(
            new FoodProviderRegistry([provider]),
            fakeCatalog({
                async searchLocal() {
                    return [hit(candidate())];
                },
            }),
        );
        const result = await service.search("banana", 10);
        expect(result.candidates[0]?.providerFoodId).toBe("321358");
        expect(providerCalls).toBe(0);
    });

    test("a fresh exact query-cache hit avoids both local fuzzy search and providers", async () => {
        let localCalls = 0;
        let providerCalls = 0;
        const provider: FoodProvider = {
            name: "usda",
            async search() {
                providerCalls += 1;
                return [];
            },
        };
        const service = new FoodSearchService(
            new FoodProviderRegistry([provider]),
            fakeCatalog({
                async findCachedSearch() {
                    return [hit(candidate())];
                },
                async searchLocal() {
                    localCalls += 1;
                    return [];
                },
            }),
        );
        const result = await service.search("banana", 10);
        expect(result.candidates).toHaveLength(1);
        expect(localCalls).toBe(0);
        expect(providerCalls).toBe(0);
    });

    test("a stale exact match cannot short-circuit a provider refresh", async () => {
        let providerCalls = 0;
        const refreshed = candidate({
            providerFoodId: "321358",
            confidence: 0.97,
        });
        const provider: FoodProvider = {
            name: "usda",
            async search() {
                providerCalls += 1;
                return [refreshed];
            },
        };
        const service = new FoodSearchService(
            new FoodProviderRegistry([provider]),
            fakeCatalog({
                async searchLocal() {
                    return [hit(candidate(), true)];
                },
            }),
        );
        const result = await service.search("banana", 10);
        expect(result.candidates[0]?.confidence).toBe(0.97);
        expect(providerCalls).toBe(1);
    });

    test("stale verified data is retained when every upstream provider fails", async () => {
        const provider: FoodProvider = {
            name: "usda",
            async search() {
                throw new FoodProviderError(
                    "provider_unavailable",
                    "temporary USDA outage",
                    { provider: "usda" },
                );
            },
        };
        const service = new FoodSearchService(
            new FoodProviderRegistry([provider]),
            fakeCatalog({
                async searchLocal() {
                    return [hit(candidate(), true)];
                },
            }),
        );
        const result = await service.search("banana", 10);
        expect(result.candidates[0]?.providerFoodId).toBe("321358");
        expect(result.failures).toHaveLength(1);
    });

    test("search negative caching: a verified no-result query makes ~0 provider calls on repeat", async () => {
        let providerCalls = 0;
        let negative = false;
        const recorded: string[] = [];
        const provider: FoodProvider = {
            name: "usda",
            async search() {
                providerCalls += 1;
                return [];
            },
        };
        const service = new FoodSearchService(
            new FoodProviderRegistry([provider]),
            fakeCatalog({
                async isNegative() {
                    return negative;
                },
                async recordNegative(operation: string) {
                    recorded.push(operation);
                    negative = true;
                },
            }),
        );
        const first = await service.search("zzznoresult flakes", 10);
        expect(first.candidates).toHaveLength(0);
        expect(providerCalls).toBe(1);
        expect(recorded).toEqual(["search"]);
        const second = await service.search("zzznoresult flakes", 10);
        expect(second.candidates).toHaveLength(0);
        expect(providerCalls).toBe(1); // negative hit: no new provider call
    });

    test("search negative caching is NOT recorded when providers fail", async () => {
        const recorded: string[] = [];
        const provider: FoodProvider = {
            name: "usda",
            async search() {
                throw new FoodProviderError(
                    "provider_unavailable",
                    "temporary USDA outage",
                    { provider: "usda" },
                );
            },
        };
        const service = new FoodSearchService(
            new FoodProviderRegistry([provider]),
            fakeCatalog({
                async recordNegative(operation: string) {
                    recorded.push(operation);
                },
            }),
        );
        const result = await service.search("banana", 10);
        expect(result.failures).toHaveLength(1);
        expect(recorded).toEqual([]);
    });

    test("provider write-back on a miss uses the single-transaction path", async () => {
        let combinedCalls = 0;
        let separateCalls = 0;
        const provider: FoodProvider = {
            name: "usda",
            async search() {
                return [candidate({ providerFoodId: "remote-1" })];
            },
        };
        const service = new FoodSearchService(
            new FoodProviderRegistry([provider]),
            fakeCatalog({
                async upsertAndRecordSearch() {
                    combinedCalls += 1;
                },
                async upsertMany() {
                    separateCalls += 1;
                },
                async recordSearch() {
                    separateCalls += 1;
                },
            }),
        );
        const result = await service.search("banana", 10);
        expect(result.candidates).toHaveLength(1);
        expect(combinedCalls).toBe(1);
        expect(separateCalls).toBe(0);
    });

    test("a stale row touched by search is refreshed in the background, without the search waiting", async () => {
        const upserted: FoodCandidate[] = [];
        let detailsCalls = 0;
        const refreshed = candidate({ confidence: 0.97 });
        const provider: FoodProvider = {
            name: "usda",
            async search() {
                return [];
            },
            async getDetails() {
                detailsCalls += 1;
                await Bun.sleep(20);
                return refreshed;
            },
        };
        const service = new FoodSearchService(
            new FoodProviderRegistry([provider]),
            fakeCatalog({
                async searchLocal() {
                    return [hit(candidate(), true)];
                },
                async upsert(food: FoodCandidate) {
                    upserted.push(food);
                },
            }),
        );
        const result = await service.search("banana", 10);
        expect(result.candidates).toHaveLength(0);
        // The refresh lands after the search has already resolved.
        for (let i = 0; i < 50 && upserted.length === 0; i += 1) {
            await Bun.sleep(10);
        }
        expect(detailsCalls).toBe(1);
        expect(upserted).toEqual([refreshed]);
    });

    test("twenty concurrent cold searches collapse into one upstream request", async () => {
        let providerCalls = 0;
        const provider: FoodProvider = {
            name: "usda",
            async search() {
                providerCalls += 1;
                await Bun.sleep(15);
                return [candidate()];
            },
        };
        const service = new FoodSearchService(
            new FoodProviderRegistry([provider]),
            fakeCatalog(),
        );
        const results = await Promise.all(
            Array.from({ length: 20 }, () => service.search("banana", 10)),
        );
        expect(results.every((result) => result.candidates.length === 1)).toBe(
            true,
        );
        expect(providerCalls).toBe(1);
    });
});

describe("provider circuit breaker", () => {
    test("stops hammering a provider after repeated transient failures and probes after cooldown", async () => {
        let providerCalls = 0;
        let now = 1_000;
        const provider: FoodProvider = {
            name: "open_food_facts",
            async search() {
                providerCalls += 1;
                throw new FoodProviderError(
                    "provider_unavailable",
                    "OFF unavailable",
                    { provider: "open_food_facts" },
                );
            },
        };
        const registry = new FoodProviderRegistry([provider], {
            failureThreshold: 2,
            cooldownMs: 60_000,
            now: () => now,
        });

        await registry.search({ query: "rare branded food" });
        await registry.search({ query: "rare branded food" });
        const openResult = await registry.search({
            query: "rare branded food",
        });
        expect(providerCalls).toBe(2);
        expect(openResult.failures[0]).toMatchObject({
            provider: "open_food_facts",
            code: "provider_unavailable",
        });

        now += 60_001;
        await registry.search({ query: "rare branded food" });
        expect(providerCalls).toBe(3);
    });
});
