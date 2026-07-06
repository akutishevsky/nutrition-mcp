import { test, expect, mock, beforeEach, afterEach, describe } from "bun:test";
import {
    normalizeBarcode,
    fetchProductFromOFF,
    formatFoodResult,
    type FoodResult,
} from "./foods.js";

const realFetch = globalThis.fetch;

function mockFetch(impl: (url: string) => Response | Promise<Response>) {
    globalThis.fetch = mock((input: string | URL | Request) =>
        Promise.resolve(impl(String(input))),
    ) as unknown as typeof fetch;
}

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

beforeEach(() => {
    process.env.OFF_USER_AGENT = "nutrition-mcp-test (test@example.com)";
});

afterEach(() => {
    globalThis.fetch = realFetch;
});

describe("normalizeBarcode", () => {
    test("keeps valid digit strings", () => {
        expect(normalizeBarcode("737628064502")).toBe("737628064502");
    });

    test("strips spaces and separators", () => {
        expect(normalizeBarcode(" 7376-2806 4502 ")).toBe("737628064502");
    });

    test("accepts EAN-8 lower bound and GTIN-14 upper bound", () => {
        expect(normalizeBarcode("12345678")).toBe("12345678");
        expect(normalizeBarcode("12345678901234")).toBe("12345678901234");
    });

    test("rejects too-short and too-long inputs", () => {
        expect(normalizeBarcode("1234567")).toBeNull();
        expect(normalizeBarcode("123456789012345")).toBeNull();
    });

    test("rejects non-numeric junk", () => {
        expect(normalizeBarcode("abc")).toBeNull();
        expect(normalizeBarcode("")).toBeNull();
    });
});

describe("fetchProductFromOFF", () => {
    test("normalizes per-serving values when a serving size is present", async () => {
        mockFetch(() =>
            jsonResponse({
                status: 1,
                product: {
                    product_name: "Coconut Milk",
                    brands: "Thai Kitchen, Simply Asia",
                    serving_size: "80 ml",
                    nutriments: {
                        "energy-kcal_serving": 120,
                        "energy-kcal_100g": 150,
                        proteins_serving: 1.2,
                        carbohydrates_serving: 2,
                        fat_serving: 12.34,
                    },
                },
            }),
        );

        const food = await fetchProductFromOFF("737628064502");
        expect(food).not.toBeNull();
        expect(food!.name).toBe("Coconut Milk");
        expect(food!.brand).toBe("Thai Kitchen"); // first brand only
        expect(food!.serving).toBe("80 ml");
        expect(food!.calories).toBe(120);
        expect(food!.protein_g).toBe(1.2);
        expect(food!.carbs_g).toBe(2);
        expect(food!.fat_g).toBe(12.3); // rounded to one decimal
        expect(food!.source).toBe("off:737628064502");
    });

    test("falls back to per-100g basis when no serving energy", async () => {
        mockFetch(() =>
            jsonResponse({
                status: 1,
                product: {
                    product_name: "Olive Oil",
                    nutriments: {
                        "energy-kcal_100g": 884,
                        proteins_100g: 0,
                        carbohydrates_100g: 0,
                        fat_100g: 100,
                    },
                },
            }),
        );

        const food = await fetchProductFromOFF("123456789");
        expect(food!.serving).toBe("100 g");
        expect(food!.calories).toBe(884);
        expect(food!.fat_g).toBe(100);
        expect(food!.brand).toBeNull();
    });

    test("returns null when OFF reports status 0", async () => {
        mockFetch(() => jsonResponse({ status: 0 }));
        expect(await fetchProductFromOFF("000000000000")).toBeNull();
    });

    test("returns null on HTTP 404", async () => {
        mockFetch(() => jsonResponse({ status: 0 }, 404));
        expect(await fetchProductFromOFF("000000000000")).toBeNull();
    });

    test("throws on unexpected HTTP error so the caller can degrade", async () => {
        mockFetch(() => jsonResponse({}, 500));
        expect(fetchProductFromOFF("737628064502")).rejects.toThrow(
            /Open Food Facts request failed: 500/,
        );
    });

    test("treats a stub product with no macros as not found (no empty cache)", async () => {
        // OFF returns status 1 for entries that exist but carry no nutriments.
        // We must report a miss so the caller can fall back to estimation and
        // no empty record is cached.
        mockFetch(() =>
            jsonResponse({
                status: 1,
                product: { product_name: "Mystery Snack" },
            }),
        );
        expect(await fetchProductFromOFF("737628064502")).toBeNull();
    });

    test("keeps a product that has at least one macro even if others are null", async () => {
        mockFetch(() =>
            jsonResponse({
                status: 1,
                product: {
                    product_name: "Just Calories",
                    nutriments: { "energy-kcal_100g": 250 },
                },
            }),
        );
        const food = await fetchProductFromOFF("737628064502");
        expect(food!.name).toBe("Just Calories");
        expect(food!.calories).toBe(250);
        expect(food!.protein_g).toBeNull();
    });

    test("sends the configured User-Agent and throws when it is unset", async () => {
        const seen: { ua: string | null } = { ua: null };
        globalThis.fetch = mock(
            (_input: string | URL | Request, init?: RequestInit) => {
                seen.ua = new Headers(init?.headers).get("User-Agent");
                return Promise.resolve(jsonResponse({ status: 0 }));
            },
        ) as unknown as typeof fetch;

        await fetchProductFromOFF("737628064502");
        expect(seen.ua).toBe("nutrition-mcp-test (test@example.com)");

        delete process.env.OFF_USER_AGENT;
        expect(fetchProductFromOFF("737628064502")).rejects.toThrow(
            /OFF_USER_AGENT is not configured/,
        );
    });
});

describe("formatFoodResult", () => {
    const base: FoodResult = {
        name: "Coconut Milk",
        brand: "Thai Kitchen",
        serving: "80 ml",
        calories: 120,
        protein_g: 1.2,
        carbs_g: 2,
        fat_g: 12,
        source: "off:737628064502",
        source_name: "openfoodfacts",
        barcode: "737628064502",
    };

    test("includes brand, serving, macros, and source", () => {
        const text = formatFoodResult(base);
        expect(text).toContain("Coconut Milk (Thai Kitchen)");
        expect(text).toContain("Serving: 80 ml");
        expect(text).toContain("120 kcal");
        expect(text).toContain("barcode 737628064502");
    });

    test("renders n/a for missing macros and omits empty brand", () => {
        const text = formatFoodResult({
            ...base,
            brand: null,
            calories: null,
        });
        expect(text).toContain("Coconut Milk\n");
        expect(text).not.toContain("()");
        expect(text).toContain("Calories: n/a");
    });
});
