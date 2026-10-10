import {
    test,
    expect,
    describe,
    beforeAll,
    afterAll,
    beforeEach,
    spyOn,
} from "bun:test";
import {
    createSavedMeal,
    getCachedFoodRecord,
    getMealItems,
    insertMeal,
    updateMeal,
} from "./supabase.js";
import type { MealItemValues } from "./meal-items.js";
import type { NutrientSources, SourceDetail } from "./provenance.js";

// The provenance columns through the REAL src/supabase.ts functions, with
// global fetch stubbed (no mock.module; see src/oauth-supabase-store.test.ts).
// Covers what the write paths send, what the cache reader returns with no TTL,
// and how a legacy or malformed column reads back.

const USER = "11111111-1111-4111-8111-111111111111";
const MEAL_ID = "44444444-4444-4444-8444-444444444444";
const ITEM_ID = "55555555-5555-4555-8555-555555555555";

const SOURCES: NutrientSources = {
    calories: { s: "usda", ref: "171477" },
    fiber_g: { s: "estimate" },
};
const DETAIL: SourceDetail = {
    "usda:171477": {
        name: "Chicken, breast",
        data_type: "SR Legacy",
        amount_g: 150,
        fetched_at: "2026-10-01T00:00:00.000Z",
    },
};

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });
}

function eqParam(q: URLSearchParams, col: string): string | undefined {
    return q.get(col)?.replace(/^eq\./, "");
}

interface Recorded {
    method: string;
    path: string;
    query: URLSearchParams;
    body: Record<string, unknown> | null;
}

// Table contents the stub serves. Reset before each test.
let cacheRows: Record<string, { payload: unknown; fetched_at: string }>;
let mealRows: Record<string, unknown>[];
let itemRows: Record<string, unknown>[];
let failCache: boolean;
let calls: Recorded[];

async function fakeApi(
    input: string | URL | Request,
    init?: RequestInit,
): Promise<Response> {
    const req =
        input instanceof Request
            ? new Request(input, init)
            : new Request(input.toString(), init);
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/rest\/v1\//, "");
    const q = url.searchParams;
    const single = (req.headers.get("accept") ?? "").includes("object+json");
    const body =
        req.method === "GET"
            ? null
            : ((await req.json()) as Record<string, unknown>);
    calls.push({ method: req.method, path, query: q, body });

    if (req.method === "GET" && path === "food_cache") {
        if (failCache) return json({ message: "boom" }, 500);
        const source = eqParam(q, "source");
        const id = eqParam(q, "source_id");
        const row = cacheRows[`${source}:${id}`];
        if (!row) return json({ message: "no rows" }, 406);
        return single ? json(row) : json([row]);
    }
    if (req.method === "GET" && path === "meal_items") {
        return json(itemRows);
    }
    if (req.method === "GET" && path === "meals") {
        return json(single ? { message: "no rows" } : [], single ? 406 : 200);
    }
    if (req.method === "POST" && path === "meals") {
        const row = { id: MEAL_ID, ...body };
        return json(single ? row : [row], 201);
    }
    if (req.method === "POST" && path === "rpc/insert_meal_with_items") {
        const p = body as { p_meal: Record<string, unknown> };
        return json({
            meal: { id: MEAL_ID, ...p.p_meal },
            deduplicated: false,
        });
    }
    if (req.method === "POST" && path === "rpc/insert_saved_meal") {
        const p = body as { p_saved: Record<string, unknown> };
        return json({
            id: "66666666-6666-4666-8666-666666666666",
            user_id: USER,
            name: p.p_saved.name,
            description: p.p_saved.description,
            meal_type: null,
            created_at: "2026-10-10T00:00:00Z",
            updated_at: "2026-10-10T00:00:00Z",
            ...p.p_saved,
        });
    }
    if (req.method === "PATCH" && path === "meals") {
        const row = { id: MEAL_ID, user_id: USER, ...body };
        return json([row]);
    }
    throw new Error(`provenance stub refused ${req.method} ${req.url}`);
}

const envBefore = {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SECRET_KEY,
};
let fetchSpy: ReturnType<typeof spyOn>;

beforeAll(() => {
    process.env.SUPABASE_URL ??= "http://supabase.test";
    process.env.SUPABASE_SECRET_KEY ??= "test-key";
    fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
        fakeApi as typeof fetch,
    );
});

afterAll(() => {
    fetchSpy.mockRestore();
    if (envBefore.url === undefined) delete process.env.SUPABASE_URL;
    if (envBefore.key === undefined) delete process.env.SUPABASE_SECRET_KEY;
});

beforeEach(() => {
    cacheRows = {};
    mealRows = [];
    itemRows = [];
    failCache = false;
    calls = [];
});

const offPayload = (over: Record<string, unknown> = {}) => ({
    name: "Cola",
    brand: null,
    serving: "100 g",
    calories: 42,
    protein_g: 0,
    carbs_g: 10.6,
    fat_g: 0,
    fiber_g: 0,
    sugar_g: 10.6,
    alcohol_g: null,
    nutriscore_grade: null,
    nova_group: null,
    source: "off:5449000000996",
    source_name: "openfoodfacts",
    barcode: "5449000000996",
    ...over,
});

describe("getCachedFoodRecord: no TTL, normalized like the lookup", () => {
    test("a record fetched two years ago still reads back", async () => {
        cacheRows["openfoodfacts:5449000000996"] = {
            payload: offPayload(),
            fetched_at: "2024-01-01T00:00:00.000Z",
        };
        const rec = await getCachedFoodRecord("openfoodfacts", "5449000000996");
        expect(rec).toMatchObject({
            source: "openfoodfacts",
            id: "5449000000996",
            basis: "per_100g",
            fetched_at: "2024-01-01T00:00:00.000Z",
        });
        expect(rec?.values.calories).toBe(42);
    });

    test("a pre-added-sugar payload reads with added sugar as not recorded", async () => {
        cacheRows["openfoodfacts:5449000000996"] = {
            payload: offPayload(),
            fetched_at: "2026-01-01T00:00:00.000Z",
        };
        const rec = await getCachedFoodRecord("openfoodfacts", "5449000000996");
        expect(rec?.values.added_sugar_g).toBeNull();
        expect(rec?.added_sugar_estimated).toBe(false);
    });

    test("an OFF added-sugar '~' record is flagged estimated", async () => {
        cacheRows["openfoodfacts:5449000000996"] = {
            payload: offPayload({
                added_sugar_g: 9,
                added_sugar_estimated: true,
            }),
            fetched_at: "2026-01-01T00:00:00.000Z",
        };
        const rec = await getCachedFoodRecord("openfoodfacts", "5449000000996");
        expect(rec?.added_sugar_estimated).toBe(true);
    });

    test("a USDA row reads back per 100 g with its data type", async () => {
        cacheRows["usda:171477"] = {
            payload: {
                fdc_id: 171477,
                name: "Chicken, breast",
                data_type: "SR Legacy",
                per100g: { calories: 165, protein_g: 31 },
                portions: [],
            },
            fetched_at: "2026-10-01T00:00:00.000Z",
        };
        const rec = await getCachedFoodRecord("usda", "171477");
        expect(rec).toMatchObject({
            source: "usda",
            id: "171477",
            data_type: "SR Legacy",
            basis: "per_100g",
        });
        expect(rec?.values.protein_g).toBe(31);
    });

    test("a USDA row whose fdc id is not the one asked for is a miss", async () => {
        cacheRows["usda:171477"] = {
            payload: {
                fdc_id: 999,
                name: "Other",
                data_type: "SR Legacy",
                per100g: {},
                portions: [],
            },
            fetched_at: "2026-10-01T00:00:00.000Z",
        };
        expect(await getCachedFoodRecord("usda", "171477")).toBeNull();
    });

    test("a missing row, a row that does not normalize, and a failed read are all misses", async () => {
        expect(await getCachedFoodRecord("usda", "170000")).toBeNull();
        cacheRows["openfoodfacts:5449000000996"] = {
            payload: "not a food",
            fetched_at: "2026-10-01T00:00:00.000Z",
        };
        expect(
            await getCachedFoodRecord("openfoodfacts", "5449000000996"),
        ).toBeNull();
        failCache = true;
        expect(await getCachedFoodRecord("usda", "171477")).toBeNull();
    });
});

describe("write paths send the provenance columns", () => {
    test("a plain insert writes nutrient_sources and source_detail", async () => {
        await insertMeal(USER, {
            description: "chicken",
            meal_type: "lunch",
            calories: 165,
            logged_at: "2026-10-10T12:00:00.000Z",
            nutrient_sources: SOURCES,
            source_detail: DETAIL,
        });
        const post = calls.find(
            (c) => c.method === "POST" && c.path === "meals",
        );
        expect(post?.body).toMatchObject({
            nutrient_sources: SOURCES,
            source_detail: DETAIL,
        });
    });

    test("a plain insert without provenance writes explicit nulls", async () => {
        await insertMeal(USER, {
            description: "water",
            meal_type: "snack",
            logged_at: "2026-10-10T12:00:00.000Z",
        });
        const post = calls.find(
            (c) => c.method === "POST" && c.path === "meals",
        );
        expect(post?.body?.nutrient_sources).toBeNull();
        expect(post?.body?.source_detail).toBeNull();
    });

    test("the rpc path sends them on the meal and on each item", async () => {
        const item: MealItemValues = {
            position: 1,
            name: "Chicken",
            amount: 150,
            unit: "g",
            calories: 165,
            protein_g: 31,
            carbs_g: 0,
            fat_g: 3.6,
            fiber_g: 0,
            sugar_g: 0,
            added_sugar_g: 0,
            saturated_fat_g: 1,
            trans_fat_g: null,
            alcohol_g: null,
            caffeine_mg: null,
            nutrient_sources: SOURCES,
            source_detail: DETAIL,
        };
        await insertMeal(USER, {
            description: "chicken",
            meal_type: "lunch",
            logged_at: "2026-10-10T12:00:00.000Z",
            items: [item],
            nutrient_sources: SOURCES,
            source_detail: DETAIL,
        });
        const rpc = calls.find((c) => c.path === "rpc/insert_meal_with_items");
        const p = rpc?.body as {
            p_meal: Record<string, unknown>;
            p_items: Record<string, unknown>[];
        };
        expect(p.p_meal).toMatchObject({
            nutrient_sources: SOURCES,
            source_detail: DETAIL,
        });
        expect(p.p_items[0]).toMatchObject({
            nutrient_sources: SOURCES,
            source_detail: DETAIL,
        });
    });

    test("a saved meal's items carry their own sources through the rpc", async () => {
        const item = {
            position: 1,
            name: "Oats",
            amount: 40,
            unit: "g",
            calories: 150,
            protein_g: 5,
            carbs_g: 27,
            fat_g: 3,
            fiber_g: 4,
            sugar_g: 1,
            added_sugar_g: 0,
            saturated_fat_g: 0.5,
            trans_fat_g: null,
            alcohol_g: null,
            caffeine_mg: null,
            nutrient_sources: { calories: { s: "estimate" as const } },
            source_detail: null,
        } as MealItemValues;
        await createSavedMeal(
            USER,
            { name: "Porridge", description: "porridge", meal_type: null },
            [item],
        );
        const rpc = calls.find((c) => c.path === "rpc/insert_saved_meal");
        const p = rpc?.body as { p_items: Record<string, unknown>[] };
        expect(p.p_items[0]).toMatchObject({
            nutrient_sources: { calories: { s: "estimate" } },
            source_detail: null,
        });
    });

    test("a plain update writes the provenance it is given and leaves others alone", async () => {
        // updateMeal reads the existing row first; serve it.
        const existing = {
            id: MEAL_ID,
            user_id: USER,
            logged_at: "2026-10-10T12:00:00.000Z",
            meal_type: "lunch",
            description: "chicken",
            calories: 165,
            protein_g: 31,
            carbs_g: 0,
            fat_g: 3.6,
            idempotency_key: "import:abc:1",
        };
        // Serve the existing row for the single read; everything else is the
        // shared stub.
        fetchSpy.mockImplementation((async (
            input: string | URL | Request,
            init?: RequestInit,
        ) => {
            const url = new URL(
                input instanceof Request ? input.url : input.toString(),
            );
            if (
                url.pathname.endsWith("/meals") &&
                (init?.method ?? "GET") === "GET"
            ) {
                return json(existing);
            }
            return fakeApi(input, init);
        }) as typeof fetch);
        try {
            await updateMeal(USER, MEAL_ID, {
                nutrient_sources: SOURCES,
                source_detail: DETAIL,
            });
        } finally {
            fetchSpy.mockImplementation(fakeApi as typeof fetch);
        }
        const patch = calls.find((c) => c.method === "PATCH");
        expect(patch?.body).toEqual({
            nutrient_sources: SOURCES,
            source_detail: DETAIL,
        });
    });
});

describe("row mapping: legacy, null and malformed columns", () => {
    test("an item row with provenance parses it", async () => {
        itemRows = [
            {
                id: ITEM_ID,
                meal_id: MEAL_ID,
                user_id: USER,
                position: 1,
                name: "Chicken",
                amount: 150,
                unit: "g",
                calories: 165,
                protein_g: 31,
                carbs_g: 0,
                fat_g: 3.6,
                nutrient_sources: SOURCES,
                source_detail: DETAIL,
            },
        ];
        const items = await getMealItems(USER, [MEAL_ID]);
        const [item] = items.get(MEAL_ID)!;
        expect(item!.nutrient_sources).toEqual(SOURCES);
        expect(item!.source_detail).toEqual(DETAIL);
    });

    test("a legacy item row (null columns) reads as null, never a label", async () => {
        itemRows = [
            {
                id: ITEM_ID,
                meal_id: MEAL_ID,
                user_id: USER,
                position: 1,
                name: "Chicken",
                amount: 150,
                unit: "g",
                calories: 165,
                protein_g: 31,
                carbs_g: 0,
                fat_g: 3.6,
                nutrient_sources: null,
                source_detail: null,
            },
        ];
        const [item] = (await getMealItems(USER, [MEAL_ID])).get(MEAL_ID)!;
        expect(item!.nutrient_sources).toBeNull();
        expect(item!.source_detail).toBeNull();
    });

    test("a malformed column value parses to null rather than a label", async () => {
        itemRows = [
            {
                id: ITEM_ID,
                meal_id: MEAL_ID,
                user_id: USER,
                position: 1,
                name: "Chicken",
                amount: 150,
                unit: "g",
                calories: 165,
                protein_g: 31,
                carbs_g: 0,
                fat_g: 3.6,
                nutrient_sources: { calories: { s: "web" } },
                source_detail: ["not", "an", "object"],
            },
        ];
        const [item] = (await getMealItems(USER, [MEAL_ID])).get(MEAL_ID)!;
        expect(item!.nutrient_sources).toBeNull();
        expect(item!.source_detail).toBeNull();
    });

    test("a row selected without the columns keeps its old shape", async () => {
        itemRows = [
            {
                id: ITEM_ID,
                meal_id: MEAL_ID,
                user_id: USER,
                position: 1,
                name: "Chicken",
                amount: 150,
                unit: "g",
                calories: 165,
                protein_g: 31,
                carbs_g: 0,
                fat_g: 3.6,
            },
        ];
        const [item] = (await getMealItems(USER, [MEAL_ID])).get(MEAL_ID)!;
        expect("nutrient_sources" in item!).toBe(false);
    });
});
