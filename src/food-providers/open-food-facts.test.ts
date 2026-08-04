import { describe, expect, mock, test } from "bun:test";
import {
    OpenFoodFactsProvider,
    normalizeOpenFoodFactsProduct,
} from "./open-food-facts.js";

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json", ...headers },
    });
}

describe("Open Food Facts normalization", () => {
    test("normalizes per-100g and declared serving nutrients", () => {
        const candidate = normalizeOpenFoodFactsProduct({
            code: "737628064502",
            product_name: "Coconut Milk",
            brands: "Thai Kitchen, Example",
            serving_size: "80 ml",
            serving_quantity: 80,
            serving_quantity_unit: "ml",
            nutriments: {
                "energy-kcal_100g": 150,
                proteins_100g: 1.5,
                carbohydrates_100g: 2.5,
                fat_100g: 15,
                sodium_100g: 0.02,
                "energy-kcal_serving": 120,
                proteins_serving: 1.2,
                carbohydrates_serving: 2,
                fat_serving: 12,
                sodium_serving: 0.016,
            },
        });
        expect(candidate?.brand).toBe("Thai Kitchen");
        expect(candidate?.nutrientsPer100g?.sodium_mg).toBe(20);
        expect(candidate?.portions[0]?.label).toBe("80 ml");
        expect(candidate?.portions[0]?.nutrients.sodium_mg).toBe(16);
        expect(candidate?.portions[0]?.gramWeight).toBeUndefined();
    });

    test("converts ABV only when a milliliter serving is known", () => {
        const candidate = normalizeOpenFoodFactsProduct({
            code: "75041670",
            product_name: "Beer",
            serving_size: "330 ml",
            serving_quantity: 330,
            serving_quantity_unit: "ml",
            nutriments: {
                "energy-kcal_100g": 42,
                "energy-kcal_serving": 139,
                alcohol: 5,
                alcohol_serving: 5,
                alcohol_unit: "% vol",
            },
        });
        expect(candidate?.portions[0]?.nutrients.alcohol_g).toBe(13.02);
        expect(candidate?.nutrientsPer100g?.alcohol_g).toBeUndefined();
    });

    test("does not convert ABV from a mass serving or unknown unit", () => {
        for (const product of [
            {
                serving_quantity: 330,
                serving_quantity_unit: "g",
                alcohol_unit: "% vol",
            },
            {
                serving_quantity: 330,
                serving_quantity_unit: "ml",
                alcohol_unit: "g",
            },
        ]) {
            const candidate = normalizeOpenFoodFactsProduct({
                code: "75041670",
                product_name: "Beer",
                serving_size: "330 serving",
                serving_quantity: product.serving_quantity,
                serving_quantity_unit: product.serving_quantity_unit,
                nutriments: {
                    "energy-kcal_100g": 42,
                    "energy-kcal_serving": 139,
                    alcohol: 5,
                    alcohol_serving: 5,
                    alcohol_unit: product.alcohol_unit,
                },
            });
            expect(candidate?.portions[0]?.nutrients.alcohol_g).toBeUndefined();
        }
    });

    test("rejects stubs without usable nutrition", () => {
        expect(
            normalizeOpenFoodFactsProduct({
                code: "737628064502",
                product_name: "Mystery product",
            }),
        ).toBeNull();
    });
});

describe("Open Food Facts HTTP behavior", () => {
    test("search requests only required fields and normalizes products", async () => {
        const seen: string[] = [];
        const provider = new OpenFoodFactsProvider({
            userAgent: "Munch tests (test@example.com)",
            fetchImpl: mock(async (input: string | URL | Request) => {
                seen.push(String(input));
                return jsonResponse({
                    products: [
                        {
                            code: "123456789012",
                            product_name: "Greek Yogurt",
                            brands: "Example",
                            nutriments: {
                                "energy-kcal_100g": 60,
                                proteins_100g: 10,
                            },
                        },
                    ],
                });
            }) as unknown as typeof fetch,
        });
        const results = await provider.search({
            query: "greek yogurt",
            limit: 5,
        });
        expect(results).toHaveLength(1);
        const url = new URL(seen[0]!);
        expect(url.pathname).toBe("/cgi/search.pl");
        expect(url.searchParams.get("search_terms")).toBe("greek yogurt");
        expect(url.searchParams.get("page_size")).toBe("5");
        expect(url.searchParams.get("fields")).toContain("nutriments");
    });

    test("looks up an exact barcode through the v2 product endpoint", async () => {
        const seen: string[] = [];
        const provider = new OpenFoodFactsProvider({
            userAgent: "Munch tests (test@example.com)",
            fetchImpl: mock(async (input: string | URL | Request) => {
                seen.push(String(input));
                return jsonResponse({
                    status: 1,
                    product: {
                        product_name: "Barcode Product",
                        nutriments: { "energy-kcal_100g": 200 },
                    },
                });
            }) as unknown as typeof fetch,
        });
        const result = await provider.lookupBarcode({
            barcode: "0123-4567-8905",
        });
        expect(result?.barcode).toBe("012345678905");
        expect(new URL(seen[0]!).pathname).toBe(
            "/api/v2/product/012345678905.json",
        );
    });

    test("returns null for status-zero and 404 barcode misses", async () => {
        const statusZero = new OpenFoodFactsProvider({
            userAgent: "Munch tests (test@example.com)",
            fetchImpl: mock(async () =>
                jsonResponse({ status: 0 }),
            ) as unknown as typeof fetch,
        });
        expect(
            await statusZero.lookupBarcode({ barcode: "012345678905" }),
        ).toBeNull();

        const notFound = new OpenFoodFactsProvider({
            userAgent: "Munch tests (test@example.com)",
            fetchImpl: mock(async () =>
                jsonResponse({}, 404),
            ) as unknown as typeof fetch,
        });
        expect(
            await notFound.lookupBarcode({ barcode: "012345678905" }),
        ).toBeNull();
    });

    test("requires an identifying user agent", async () => {
        const provider = new OpenFoodFactsProvider({ userAgent: "" });
        await expect(provider.search({ query: "apple" })).rejects.toMatchObject(
            {
                code: "configuration_missing",
                provider: "open_food_facts",
            },
        );
    });

    test("classifies provider outages and rate limits", async () => {
        const outage = new OpenFoodFactsProvider({
            userAgent: "Munch tests (test@example.com)",
            fetchImpl: mock(async () =>
                jsonResponse({}, 503),
            ) as unknown as typeof fetch,
        });
        await expect(outage.search({ query: "apple" })).rejects.toMatchObject({
            code: "provider_unavailable",
        });

        const limited = new OpenFoodFactsProvider({
            userAgent: "Munch tests (test@example.com)",
            fetchImpl: mock(async () =>
                jsonResponse({}, 429, { "retry-after": "60" }),
            ) as unknown as typeof fetch,
        });
        await expect(limited.search({ query: "apple" })).rejects.toMatchObject({
            code: "rate_limited",
            retryAfterSeconds: 60,
        });
    });
});
