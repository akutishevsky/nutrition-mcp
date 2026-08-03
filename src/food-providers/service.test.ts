import { describe, expect, test } from "bun:test";
import { FoodProviderError } from "./errors.js";
import { FoodProviderRegistry } from "./registry.js";
import {
    FoodSearchService,
    decodeFoodCandidateId,
    encodeFoodCandidateId,
    summarizeFoodCandidate,
} from "./service.js";
import type { FoodCandidate, FoodProvider } from "./types.js";

function candidate(overrides: Partial<FoodCandidate> = {}): FoodCandidate {
    return {
        provider: "usda",
        providerFoodId: "171688",
        name: "Apples, raw, with skin",
        dataKind: "generic",
        nutrientsPer100g: { calories: 52 },
        portions: [
            {
                id: "medium",
                amount: 1,
                unit: "piece",
                label: "1 medium apple",
                gramWeight: 182,
                nutrients: {
                    calories: 94.64,
                    protein_g: 0.47,
                    carbs_g: 25.13,
                    fat_g: 0.31,
                },
            },
        ],
        attribution: { label: "USDA FoodData Central" },
        confidence: 0.95,
        ...overrides,
    };
}

describe("food candidate IDs", () => {
    test("round-trips provider IDs with reserved characters", () => {
        const id = encodeFoodCandidateId({
            provider: "open_food_facts",
            providerFoodId: "abc/123:variant",
        });
        expect(decodeFoodCandidateId(id)).toEqual({
            provider: "open_food_facts",
            providerFoodId: "abc/123:variant",
        });
    });

    test("rejects unsupported and malformed IDs", () => {
        expect(decodeFoodCandidateId("other:123")).toBeNull();
        expect(decodeFoodCandidateId("usda:")).toBeNull();
        expect(decodeFoodCandidateId("missing-separator")).toBeNull();
    });
});

describe("food candidate summaries", () => {
    test("returns compact default-portion values", () => {
        expect(summarizeFoodCandidate(candidate())).toEqual(
            expect.objectContaining({
                candidate_id: "usda:171688",
                provider_label: "USDA FoodData Central",
                default_portion: {
                    id: "medium",
                    label: "1 medium apple",
                    calories: 94.64,
                    protein_g: 0.47,
                    carbs_g: 25.13,
                    fat_g: 0.31,
                },
            }),
        );
    });
});

describe("aggregated food service", () => {
    test("preserves usable results when another source is unavailable", async () => {
        const usda: FoodProvider = {
            name: "usda",
            async search() {
                return [candidate()];
            },
            async getDetails() {
                return candidate();
            },
        };
        const off: FoodProvider = {
            name: "open_food_facts",
            async search() {
                throw new FoodProviderError(
                    "provider_unavailable",
                    "OFF unavailable",
                );
            },
        };
        const service = new FoodSearchService(
            new FoodProviderRegistry([usda, off]),
        );
        const result = await service.search("apple", 5);
        expect(result.candidates).toHaveLength(1);
        expect(result.failures[0]).toMatchObject({
            provider: "open_food_facts",
            code: "provider_unavailable",
        });
        expect(await service.details("usda:171688")).toMatchObject({
            providerFoodId: "171688",
        });
    });

    test("returns no result for invalid detail IDs or barcodes", async () => {
        const service = new FoodSearchService(new FoodProviderRegistry([]));
        expect(await service.details("invalid")).toBeNull();
        expect(await service.barcode("abc")).toEqual({
            candidates: [],
            failures: [],
        });
    });
});
