import { describe, expect, mock, test } from "bun:test";
import { FoodProviderError } from "./errors.js";
import {
    UsdaFoodDataCentralProvider,
    normalizeUsdaFoodDetails,
    normalizeUsdaSearchFood,
} from "./usda.js";

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json", ...headers },
    });
}

describe("USDA normalization", () => {
    test("normalizes generic search food and a gram serving", () => {
        const candidate = normalizeUsdaSearchFood({
            fdcId: 171688,
            description: "Apples, raw, with skin",
            dataType: "Foundation",
            servingSize: 182,
            servingSizeUnit: "g",
            householdServingFullText: "1 medium apple",
            foodNutrients: [
                { nutrientId: 1008, value: 52 },
                { nutrientId: 1003, value: 0.26 },
                { nutrientId: 1005, value: 13.81 },
                { nutrientId: 1079, value: 2.4 },
                { nutrientId: 1093, value: 1 },
            ],
        });
        expect(candidate).not.toBeNull();
        expect(candidate!.dataKind).toBe("generic");
        expect(candidate!.nutrientsPer100g?.calories).toBe(52);
        expect(candidate!.portions[0]?.label).toBe("1 medium apple");
        expect(candidate!.portions[0]?.nutrients.calories).toBe(94.64);
        expect(candidate!.attribution.label).toBe("USDA FoodData Central");
    });

    test("normalizes branded barcode food", () => {
        const candidate = normalizeUsdaSearchFood({
            fdcId: 12345,
            description: "NONFAT GREEK YOGURT",
            dataType: "Branded",
            brandOwner: "Example Dairy LLC",
            brandName: "Example",
            gtinUpc: "00012345678905",
            foodNutrients: [
                { nutrientNumber: "208", value: 59 },
                { nutrientNumber: "203", value: 10.2 },
                { nutrientNumber: "205", value: 3.6 },
                { nutrientNumber: "204", value: 0.4 },
            ],
        });
        expect(candidate?.dataKind).toBe("packaged");
        expect(candidate?.brand).toBe("Example");
        expect(candidate?.barcode).toBe("00012345678905");
    });

    test("normalizes detailed household portions", () => {
        const candidate = normalizeUsdaFoodDetails({
            fdcId: 555,
            description: "Chicken breast, roasted",
            dataType: "Foundation",
            foodNutrients: [
                {
                    amount: 165,
                    nutrient: { id: 1008, name: "Energy (Atwater General Factors)" },
                },
                {
                    amount: 31,
                    nutrient: { id: 1003, name: "Protein" },
                },
                {
                    amount: 3.6,
                    nutrient: { id: 1004, name: "Total lipid (fat)" },
                },
            ],
            foodPortions: [
                {
                    id: 1,
                    amount: 1,
                    gramWeight: 172,
                    modifier: "breast",
                    measureUnit: { name: "unit", abbreviation: "piece" },
                },
            ],
        });
        expect(candidate?.portions[0]?.gramWeight).toBe(172);
        expect(candidate?.portions[0]?.nutrients.protein_g).toBe(53.32);
    });

    test("rejects unusable records", () => {
        expect(
            normalizeUsdaSearchFood({
                fdcId: 1,
                description: "Empty record",
                foodNutrients: [],
            }),
        ).toBeNull();
    });
});

describe("USDA provider HTTP behavior", () => {
    test("search posts a bounded query and normalizes results", async () => {
        const seen: Array<{ url: string; init?: RequestInit }> = [];
        const provider = new UsdaFoodDataCentralProvider({
            apiKey: "test-key",
            fetchImpl: mock(async (input: string | URL | Request, init?: RequestInit) => {
                seen.push({ url: String(input), init });
                return jsonResponse({
                    foods: [
                        {
                            fdcId: 1,
                            description: "Banana, raw",
                            dataType: "Foundation",
                            foodNutrients: [
                                { nutrientId: 1008, value: 89 },
                                { nutrientId: 1005, value: 22.8 },
                            ],
                        },
                    ],
                });
            }) as unknown as typeof fetch,
        });
        const results = await provider.search({ query: " banana ", limit: 100 });
        expect(results).toHaveLength(1);
        expect(seen[0]?.url).toContain("api_key=test-key");
        const body = JSON.parse(String(seen[0]?.init?.body));
        expect(body.query).toBe("banana");
        expect(body.pageSize).toBe(25);
    });

    test("barcode lookup selects only an exact GTIN match", async () => {
        const provider = new UsdaFoodDataCentralProvider({
            apiKey: "test-key",
            fetchImpl: mock(async () =>
                jsonResponse({
                    foods: [
                        {
                            fdcId: 1,
                            description: "Wrong product",
                            dataType: "Branded",
                            gtinUpc: "111111111111",
                            foodNutrients: [{ nutrientId: 1008, value: 100 }],
                        },
                        {
                            fdcId: 2,
                            description: "Exact product",
                            dataType: "Branded",
                            gtinUpc: "012345678905",
                            foodNutrients: [{ nutrientId: 1008, value: 120 }],
                        },
                    ],
                }),
            ) as unknown as typeof fetch,
        });
        const result = await provider.lookupBarcode({ barcode: "012345678905" });
        expect(result?.providerFoodId).toBe("2");
    });

    test("returns null for a missing detail record", async () => {
        const provider = new UsdaFoodDataCentralProvider({
            apiKey: "test-key",
            fetchImpl: mock(async () => jsonResponse({}, 404)) as unknown as typeof fetch,
        });
        expect(await provider.getDetails({ providerFoodId: "123" })).toBeNull();
    });

    test("requires configuration without exposing a key", async () => {
        const provider = new UsdaFoodDataCentralProvider({ apiKey: "" });
        await expect(provider.search({ query: "apple" })).rejects.toMatchObject({
            code: "configuration_missing",
            provider: "usda",
        });
    });

    test("classifies rate limits with retry metadata", async () => {
        const provider = new UsdaFoodDataCentralProvider({
            apiKey: "test-key",
            fetchImpl: mock(async () =>
                jsonResponse({}, 429, { "retry-after": "30" }),
            ) as unknown as typeof fetch,
        });
        try {
            await provider.search({ query: "apple" });
            throw new Error("Expected rate limit");
        } catch (error) {
            expect(error).toBeInstanceOf(FoodProviderError);
            expect(error).toMatchObject({
                code: "rate_limited",
                retryAfterSeconds: 30,
            });
        }
    });

    test("classifies malformed JSON", async () => {
        const provider = new UsdaFoodDataCentralProvider({
            apiKey: "test-key",
            fetchImpl: mock(async () => new Response("not json")) as unknown as typeof fetch,
        });
        await expect(provider.search({ query: "apple" })).rejects.toMatchObject({
            code: "invalid_provider_response",
        });
    });
});
