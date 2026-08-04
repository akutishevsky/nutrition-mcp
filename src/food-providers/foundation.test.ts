import { describe, expect, test } from "bun:test";
import {
    FoodProviderError,
    FoodProviderRegistry,
    createCacheEnvelope,
    deduplicateCandidates,
    foodCacheKey,
    normalizeNutrients,
    per100gPortion,
    portionFromPer100g,
    rankCandidates,
    readCacheEnvelope,
    scaleNutrients,
    scalePortion,
    type FoodCandidate,
    type FoodProvider,
} from "./index.js";

function candidate(overrides: Partial<FoodCandidate> = {}): FoodCandidate {
    return {
        provider: "usda",
        providerFoodId: "1",
        name: "Apple, raw, with skin",
        dataKind: "generic",
        nutrientsPer100g: { calories: 52, carbs_g: 13.8, fiber_g: 2.4 },
        portions: [],
        attribution: { label: "USDA FoodData Central" },
        confidence: 0.9,
        ...overrides,
    };
}

describe("nutrient normalization", () => {
    test("keeps finite nonnegative values and omits invalid values", () => {
        expect(
            normalizeNutrients({
                calories: "52",
                protein_g: 0.3,
                carbs_g: Number.POSITIVE_INFINITY,
                fat_g: -1,
            }),
        ).toEqual({ calories: 52, protein_g: 0.3 });
    });

    test("scales only nutrients that were actually reported", () => {
        expect(scaleNutrients({ calories: 100, protein_g: 3 }, 0.5)).toEqual({
            calories: 50,
            protein_g: 1.5,
        });
    });
});

describe("portion normalization", () => {
    test("derives household portion nutrition from per-100g values", () => {
        const portion = portionFromPer100g({
            id: "medium",
            amount: 1,
            unit: "piece",
            label: "1 medium apple",
            gramWeight: 182,
            nutrientsPer100g: { calories: 52, carbs_g: 13.8 },
        });
        expect(portion.nutrients.calories).toBe(94.64);
        expect(portion.nutrients.carbs_g).toBe(25.12);
    });

    test("scales a selected portion without mutating the original", () => {
        const original = per100gPortion({ calories: 52 });
        const doubled = scalePortion(original, 2);
        expect(doubled.nutrients.calories).toBe(104);
        expect(original.nutrients.calories).toBe(52);
    });
});

describe("ranking and duplicate collapse", () => {
    test("prefers exact branded matches over weaker provider confidence", () => {
        const ranked = rankCandidates({ query: "Fage Total 0" }, [
            candidate({
                providerFoodId: "generic",
                name: "Greek yogurt, nonfat",
                confidence: 0.99,
            }),
            candidate({
                provider: "open_food_facts",
                providerFoodId: "fage",
                name: "Total 0",
                brand: "Fage",
                dataKind: "packaged",
                confidence: 0.85,
            }),
        ]);
        expect(ranked[0]?.providerFoodId).toBe("fage");
    });

    test("deduplicates identical barcodes and keeps the strongest candidate", () => {
        const deduped = deduplicateCandidates([
            candidate({ providerFoodId: "a", barcode: "123", confidence: 0.5 }),
            candidate({
                provider: "open_food_facts",
                providerFoodId: "b",
                barcode: "123",
                confidence: 0.95,
            }),
        ]);
        expect(deduped).toHaveLength(1);
        expect(deduped[0]?.providerFoodId).toBe("b");
    });
});

describe("versioned cache envelopes", () => {
    test("expires and rejects stale schema values", () => {
        const now = new Date("2026-08-03T18:00:00.000Z");
        const envelope = createCacheEnvelope({ ok: true }, 1_000, now);
        expect(
            readCacheEnvelope(envelope, new Date(now.getTime() + 500)),
        ).toEqual({
            ok: true,
        });
        expect(
            readCacheEnvelope(envelope, new Date(now.getTime() + 1_001)),
        ).toBeNull();
        expect(
            readCacheEnvelope({ ...envelope, schemaVersion: 999 }, now),
        ).toBeNull();
    });

    test("builds deterministic provider cache keys", () => {
        expect(foodCacheKey("USDA", "Search", "Green Apple")).toBe(
            "food:v1:usda:search:green apple",
        );
    });
});

describe("provider registry", () => {
    test("returns successful results when another provider fails", async () => {
        const good: FoodProvider = {
            name: "usda",
            async search() {
                return [candidate()];
            },
        };
        const bad: FoodProvider = {
            name: "open_food_facts",
            async search() {
                throw new FoodProviderError(
                    "provider_unavailable",
                    "temporary outage",
                );
            },
        };
        const result = await new FoodProviderRegistry([good, bad]).search({
            query: "apple",
        });
        expect(result.candidates).toHaveLength(1);
        expect(result.failures).toEqual([
            expect.objectContaining({
                provider: "open_food_facts",
                code: "provider_unavailable",
            }),
        ]);
    });

    test("rejects duplicate provider registrations", () => {
        const provider: FoodProvider = {
            name: "usda",
            async search() {
                return [];
            },
        };
        expect(() => new FoodProviderRegistry([provider, provider])).toThrow(
            /Duplicate food provider/,
        );
    });
});
