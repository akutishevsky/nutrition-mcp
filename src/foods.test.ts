import { test, expect, mock, beforeEach, afterEach, describe } from "bun:test";
import {
    normalizeBarcode,
    fetchProductFromOFF,
    foodResultFromCandidate,
    formatFoodResult,
    lookupBarcode,
    type FoodResult,
} from "./foods.js";
import type { FoodCandidate } from "./food-providers/types.js";

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
        expect(normalizeBarcode("12345670")).toBe("12345670");
        expect(normalizeBarcode("12345678901231")).toBe("12345678901231");
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

    test("maps fiber and total sugars per serving", async () => {
        // Real shape from OFF barcode 3229820129488 (Muesli): OFF spells the key
        // "fiber" (American) and "sugars" (plural), both in grams, both scaled
        // to the serving alongside the other macros.
        mockFetch(() =>
            jsonResponse({
                status: 1,
                product: {
                    product_name: "Muesli Raisin, Figue, Datte, Abricot",
                    serving_size: "60g",
                    nutriments: {
                        "energy-kcal_serving": 220,
                        "energy-kcal_100g": 367,
                        fiber_100g: 10,
                        fiber_serving: 6,
                        fiber_unit: "g",
                        sugars_100g: 14,
                        sugars_serving: 8.4,
                        sugars_unit: "g",
                        // Present in OFF but deliberately ignored: we store
                        // TOTAL sugars, never added sugars.
                        "added-sugars_serving": 1.2,
                    },
                },
            }),
        );

        const food = await fetchProductFromOFF("3229820129488");
        expect(food!.serving).toBe("60g");
        expect(food!.fiber_g).toBe(6);
        expect(food!.sugar_g).toBe(8.4);
        expect(food!.alcohol_g).toBeNull();
    });

    test("falls back to per-100g fiber and sugars", async () => {
        mockFetch(() =>
            jsonResponse({
                status: 1,
                product: {
                    product_name: "Bran",
                    nutriments: {
                        "energy-kcal_100g": 250,
                        fiber_100g: 42.55,
                        sugars_100g: 0.7,
                    },
                },
            }),
        );

        const food = await fetchProductFromOFF("123456789");
        expect(food!.serving).toBe("100 g");
        expect(food!.fiber_g).toBe(42.6); // rounded to one decimal
        expect(food!.sugar_g).toBe(0.7);
    });

    test("leaves fiber and sugar null when OFF carries neither", async () => {
        mockFetch(() =>
            jsonResponse({
                status: 1,
                product: {
                    product_name: "Olive Oil",
                    nutriments: { "energy-kcal_100g": 884, fat_100g: 100 },
                },
            }),
        );

        const food = await fetchProductFromOFF("123456789");
        expect(food!.fiber_g).toBeNull();
        expect(food!.sugar_g).toBeNull();
    });
});

// Open Food Facts reports alcohol as ABV ("% vol"), never as grams — the raw
// value must never be copied into alcohol_g. See resolveAlcoholGrams in
// src/foods.ts for the evidence behind these rules.
describe("fetchProductFromOFF alcohol (ABV, not grams)", () => {
    // Shape copied from a real OFF beer record: note that alcohol does NOT
    // scale with the serving the way carbohydrates does — that is what proves
    // it is a percentage rather than a mass.
    function beer(over: Record<string, unknown> = {}) {
        return {
            status: 1,
            product: {
                product_name: "Cerveza Heineken",
                serving_size: "330ml",
                serving_quantity: 330,
                serving_quantity_unit: "ml",
                nutriments: {
                    "energy-kcal_serving": 139,
                    "energy-kcal_100g": 42,
                    carbohydrates_100g: 3,
                    carbohydrates_serving: 9.9,
                    alcohol: 5,
                    alcohol_100g: 5,
                    alcohol_serving: 5,
                    alcohol_unit: "% vol",
                },
                ...over,
            },
        };
    }

    test("converts ABV to grams of ethanol using the mL serving volume", async () => {
        mockFetch(() => jsonResponse(beer()));

        const food = await fetchProductFromOFF("75041670");
        // 330 mL x 5% = 16.5 mL ethanol x 0.789 g/mL = 13.02 g.
        expect(food!.alcohol_g).toBe(13);
        // The raw ABV must never leak through as if it were grams.
        expect(food!.alcohol_g).not.toBe(5);
    });

    test("keeps a genuine 0% ABV as 0 g, distinct from unknown", async () => {
        mockFetch(() =>
            jsonResponse(
                beer({
                    product_name: "Bière Blonde sans alcool 1664",
                    nutriments: {
                        "energy-kcal_serving": 60,
                        alcohol: 0,
                        alcohol_serving: 0,
                        alcohol_100g: 0,
                        alcohol_unit: "% vol",
                    },
                }),
            ),
        );

        const food = await fetchProductFromOFF("3080216055428");
        expect(food!.alcohol_g).toBe(0);
    });

    test("is null when OFF parsed no serving quantity", async () => {
        // Corona Extra is exactly this: a real ABV, but no serving volume at
        // all, so there is nothing to multiply by.
        mockFetch(() =>
            jsonResponse(
                beer({ serving_quantity: null, serving_quantity_unit: "ml" }),
            ),
        );

        expect((await fetchProductFromOFF("75041670"))!.alcohol_g).toBeNull();
    });

    test("is null when the serving quantity is a mass, not a volume", async () => {
        // ABV is per unit volume; converting from grams would need the
        // beverage's density, which OFF does not publish.
        mockFetch(() =>
            jsonResponse(
                beer({ serving_quantity: 330, serving_quantity_unit: "g" }),
            ),
        );

        expect((await fetchProductFromOFF("75041670"))!.alcohol_g).toBeNull();
    });

    test("is null on the per-100g basis, which would mix bases", async () => {
        // No serving_size / no per-serving energy => the 100 g fallback. Every
        // other field is then per 100 GRAMS, so a volume-derived alcohol figure
        // would not belong to the same basis.
        mockFetch(() =>
            jsonResponse({
                status: 1,
                product: {
                    product_name: "Vin blanc sec",
                    serving_quantity: 250,
                    serving_quantity_unit: "ml",
                    nutriments: {
                        "energy-kcal_100g": 73,
                        alcohol: 11,
                        alcohol_100g: 11,
                        alcohol_unit: "% vol",
                    },
                },
            }),
        );

        const food = await fetchProductFromOFF("3175520036338");
        expect(food!.serving).toBe("100 g");
        expect(food!.alcohol_g).toBeNull();
    });

    test("is null when the unit is not '% vol'", async () => {
        // If OFF ever changes the unit we must not silently reinterpret it.
        mockFetch(() =>
            jsonResponse(
                beer({ nutriments: { ...beer().product.nutriments } }),
            ),
        );
        // sanity: the shared fixture does convert
        expect((await fetchProductFromOFF("75041670"))!.alcohol_g).toBe(13);

        mockFetch(() =>
            jsonResponse(
                beer({
                    nutriments: {
                        "energy-kcal_serving": 139,
                        alcohol: 5,
                        alcohol_serving: 5,
                        alcohol_unit: "g",
                    },
                }),
            ),
        );
        expect((await fetchProductFromOFF("75041670"))!.alcohol_g).toBeNull();

        mockFetch(() =>
            jsonResponse(
                beer({
                    nutriments: {
                        "energy-kcal_serving": 139,
                        alcohol: 5,
                        alcohol_serving: 5,
                    },
                }),
            ),
        );
        expect((await fetchProductFromOFF("75041670"))!.alcohol_g).toBeNull();
    });

    test("is null for an out-of-range ABV instead of throwing", async () => {
        // gramsFromDrink throws on nonsense; a corrupt community-edited value
        // must degrade to null rather than break the whole lookup.
        for (const bad of [120, -1, "not a number"]) {
            mockFetch(() =>
                jsonResponse(
                    beer({
                        nutriments: {
                            "energy-kcal_serving": 139,
                            alcohol: bad,
                            alcohol_serving: bad,
                            alcohol_unit: "% vol",
                        },
                    }),
                ),
            );
            const food = await fetchProductFromOFF("75041670");
            expect(food!.alcohol_g).toBeNull();
        }
    });

    test("a spirit's ABV is never mistaken for grams", async () => {
        // The failure this whole design exists to prevent: 40 would be a
        // plausible-looking gram figure, and it is wrong by 3.5x for a 40 mL
        // measure.
        mockFetch(() =>
            jsonResponse(
                beer({
                    product_name: "Vodka",
                    serving_size: "40 ml",
                    serving_quantity: 40,
                    serving_quantity_unit: "ml",
                    nutriments: {
                        "energy-kcal_serving": 90,
                        alcohol: 40,
                        alcohol_serving: 40,
                        alcohol_100g: 40,
                        alcohol_unit: "% vol",
                    },
                }),
            ),
        );

        const food = await fetchProductFromOFF("75041670");
        // 40 mL x 40% x 0.789 = 12.62 g -> 12.6
        expect(food!.alcohol_g).toBe(12.6);
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

// Phase 2 (data-layer item 2): the legacy lookup_barcode path resolves
// through the canonical FoodSearchService, so OFF hits land in
// food_catalog_entries with provenance instead of the siloed food_cache.
describe("canonical barcode routing (lookupBarcode via FoodSearchService)", () => {
    function offCandidate(
        overrides: Partial<FoodCandidate> = {},
    ): FoodCandidate {
        return {
            provider: "open_food_facts",
            providerFoodId: "737628064502",
            name: "Coconut Milk",
            brand: "Thai Kitchen",
            barcode: "737628064502",
            dataKind: "packaged",
            nutrientsPer100g: { calories: 150, fat_g: 15 },
            portions: [
                {
                    id: "declared-serving",
                    amount: 1,
                    unit: "serving",
                    label: "80 ml",
                    nutrients: {
                        calories: 120,
                        protein_g: 1.24,
                        carbs_g: 2,
                        fat_g: 12.34,
                        alcohol_g: 13.02,
                    },
                },
                {
                    id: "100g",
                    amount: 100,
                    unit: "g",
                    label: "100 g",
                    gramWeight: 100,
                    nutrients: { calories: 150, fat_g: 15 },
                },
            ],
            attribution: { label: "Open Food Facts" },
            confidence: 0.9,
            ...overrides,
        };
    }

    test("foodResultFromCandidate prefers the declared serving and rounds to one decimal", () => {
        const food = foodResultFromCandidate(offCandidate(), "737628064502");
        expect(food).toMatchObject({
            name: "Coconut Milk",
            brand: "Thai Kitchen",
            serving: "80 ml",
            calories: 120,
            protein_g: 1.2,
            fat_g: 12.3,
            alcohol_g: 13,
            source: "off:737628064502",
            source_name: "openfoodfacts",
            barcode: "737628064502",
        });
    });

    test("foodResultFromCandidate rejects non-OFF candidates and stub records", () => {
        expect(
            foodResultFromCandidate(
                offCandidate({ provider: "usda" }),
                "737628064502",
            ),
        ).toBeNull();
        const stub = offCandidate();
        stub.portions = [
            {
                id: "100g",
                amount: 100,
                unit: "g",
                label: "100 g",
                gramWeight: 100,
                nutrients: { fiber_g: 3 },
            },
        ];
        expect(foodResultFromCandidate(stub, "737628064502")).toBeNull();
    });

    test("lookupBarcode returns the canonical OFF hit without any direct OFF fetch", async () => {
        let fetches = 0;
        globalThis.fetch = mock(() => {
            fetches += 1;
            return Promise.resolve(jsonResponse({ status: 0 }));
        }) as unknown as typeof fetch;
        const food = await lookupBarcode("737628064502", {
            async barcode() {
                return { candidates: [offCandidate()], failures: [] };
            },
        });
        expect(food?.name).toBe("Coconut Milk");
        expect(fetches).toBe(0);
    });

    test("lookupBarcode asks OFF directly when canonical surfaces only a USDA record for the barcode", async () => {
        mockFetch(() =>
            jsonResponse({
                status: 1,
                product: {
                    product_name: "Coconut Milk",
                    brands: "Thai Kitchen",
                    serving_size: "80 ml",
                    nutriments: { "energy-kcal_serving": 120 },
                },
            }),
        );
        const food = await lookupBarcode("737628064502", {
            async barcode() {
                return {
                    candidates: [offCandidate({ provider: "usda" })],
                    failures: [],
                };
            },
        });
        expect(food?.name).toBe("Coconut Milk");
        expect(food?.source_name).toBe("openfoodfacts");
    });

    test("lookupBarcode returns null on a verified canonical miss", async () => {
        const food = await lookupBarcode("737628064502", {
            async barcode() {
                return { candidates: [], failures: [] };
            },
        });
        expect(food).toBeNull();
    });

    test("lookupBarcode throws when the canonical result reports an OFF failure", async () => {
        expect(
            lookupBarcode("737628064502", {
                async barcode() {
                    return {
                        candidates: [],
                        failures: [
                            {
                                provider: "open_food_facts" as const,
                                code: "provider_unavailable" as const,
                                message: "OFF unavailable",
                            },
                        ],
                    };
                },
            }),
        ).rejects.toThrow(/Open Food Facts request failed/);
    });

    test("lookupBarcode falls back to the direct OFF fetch when the canonical layer throws", async () => {
        mockFetch(() =>
            jsonResponse({
                status: 1,
                product: {
                    product_name: "Coconut Milk",
                    serving_size: "80 ml",
                    nutriments: { "energy-kcal_serving": 120 },
                },
            }),
        );
        const food = await lookupBarcode("737628064502", {
            async barcode() {
                throw new Error("database unavailable");
            },
        });
        expect(food?.name).toBe("Coconut Milk");
        expect(food?.calories).toBe(120);
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
        fiber_g: 0.5,
        sugar_g: 1.8,
        alcohol_g: null,
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
