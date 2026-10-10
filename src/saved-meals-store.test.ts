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
    insertMeal,
    mealIdempotencyKey,
    updatedMealIdempotencyKey,
    replaceMealItems,
    getMealItems,
    countMealItems,
    createSavedMeal,
    getSavedMeals,
    getSavedMeal,
    findSavedMealsByName,
    countSavedMeals,
    updateSavedMeal,
    deleteSavedMeal,
    getMealById,
    searchMeals,
    searchSavedMeals,
    getAllMealItems,
    getAllSavedMeals,
    getAllSavedMealItems,
    SavedMealNameTaken,
    type Meal,
    type MealInput,
} from "./supabase.js";
import type { MealItemValues, NutrientValues } from "./meal-items.js";
import { ToolError } from "./errors.js";

// The write, read and search paths of the saved-meals store, run against an
// in-memory PostgREST stand-in on a stubbed global fetch (no mock.module; see
// CLAUDE.md). The stand-in implements just the query shapes these functions
// send, and it answers the rpc calls with the same effects the SQL in
// supabase/migrations/20261010120000_saved_meals.sql has.

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const LOGGED_AT = "2026-03-14T12:00:00.000Z";
const MISSING = "00000000-0000-4000-8000-00000000dead";

function nutrients(overrides: Partial<NutrientValues> = {}): NutrientValues {
    return {
        calories: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        saturated_fat_g: null,
        trans_fat_g: null,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        ...overrides,
    };
}

function item(
    position: number,
    overrides: Partial<MealItemValues> = {},
): MealItemValues {
    return {
        ...nutrients(),
        position,
        name: `item ${position}`,
        amount: null,
        unit: null,
        calories: 100,
        protein_g: 5,
        carbs_g: 10,
        fat_g: 2,
        ...overrides,
    };
}

type Row = Record<string, unknown> & { id: string };
type Rpc = { name: string; args: Record<string, unknown> };

// The fake's tables. Rows are stored as the write functions would store them.
let tables: Record<string, Row[]> = {};
let rpcCalls: Rpc[] = [];
let requests: { method: string; table: string; params: URLSearchParams }[] = [];
let nextId = 1;
let idSeq = 0;

/** PostgREST caps one response at this many rows (db-max-rows). */
const MAX_ROWS = 1000;

function freshId(): string {
    idSeq++;
    return `00000000-0000-4000-8000-${String(idSeq).padStart(12, "0")}`;
}

function json(
    body: unknown,
    status = 200,
    headers: Record<string, string> = {},
) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json", ...headers },
    });
}

function refuse(why: string): never {
    throw new Error(`saved-meals stub refused a request: ${why}`);
}

const RESERVED = new Set(["select", "order", "offset", "limit", "on_conflict"]);

/** A LIKE pattern as PostgREST reads it: % and _ are wildcards, a backslash
 *  escapes the next character, matching is case-insensitive. */
function likeRegex(pattern: string): RegExp {
    let re = "^";
    for (let i = 0; i < pattern.length; i++) {
        const c = pattern[i]!;
        if (c === "\\" && i + 1 < pattern.length) {
            re += pattern[++i]!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        } else if (c === "%") re += ".*";
        else if (c === "_") re += ".";
        else re += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    return new RegExp(`${re}$`, "is");
}

function matches(row: Row, column: string, raw: string): boolean {
    const value = row[column];
    if (raw.startsWith("eq.")) return String(value) === raw.slice(3);
    if (raw.startsWith("in.(")) {
        const list = raw
            .slice(4, -1)
            .split(",")
            .map((s) => s.replace(/^"|"$/g, ""));
        return list.includes(String(value));
    }
    if (raw.startsWith("ilike.")) {
        return likeRegex(raw.slice(6)).test(String(value ?? ""));
    }
    if (raw.startsWith("gte.")) return String(value) >= raw.slice(4);
    if (raw.startsWith("lt.")) return String(value) < raw.slice(3);
    return refuse(`filter ${column}=${raw}`);
}

function sortRows(rows: Row[], order: string | null): Row[] {
    if (!order) return rows;
    const keys = order.split(",").map((part) => {
        const [col, dir] = part.split(".");
        return { col: col!, desc: dir === "desc" };
    });
    return [...rows].sort((a, b) => {
        for (const { col, desc } of keys) {
            const x = String(a[col] ?? "");
            const y = String(b[col] ?? "");
            if (x !== y) {
                const cmp = x < y ? -1 : 1;
                return desc ? -cmp : cmp;
            }
        }
        return 0;
    });
}

/** The foreign key each embeddable child table holds to its parent. */
const EMBED_PARENT_KEY: Record<string, string> = {
    meal_items: "meal_id",
    saved_meal_items: "saved_meal_id",
};

/** `select=*,child!inner(cols)` as PostgREST reads it: filters named
 *  `child.col` apply to the child rows, every filter of one request to the
 *  same rows, and with `!inner` a parent with no remaining child row drops
 *  out. Any other select shape is refused, so a new one fails loudly. */
function parseSelect(select: string | null): { inner: string | null } {
    if (select === null || select === "*" || /^[a-z_,]+$/.test(select)) {
        return { inner: null };
    }
    const m = /^\*,([a-z_]+)!inner\(([a-z_,]+)\)$/.exec(select);
    if (!m || !(m[1]! in EMBED_PARENT_KEY)) return refuse(`select=${select}`);
    return { inner: m[1]! };
}

function filtered(table: string, params: URLSearchParams): Row[] {
    const { inner } = parseSelect(params.get("select"));
    let rows = tables[table] ?? [];
    let children = inner ? (tables[inner] ?? []) : [];
    for (const [key, raw] of params.entries()) {
        if (RESERVED.has(key)) continue;
        const dot = key.indexOf(".");
        if (dot >= 0) {
            if (key.slice(0, dot) !== inner) {
                return refuse(`filter ${key} without its !inner embed`);
            }
            const column = key.slice(dot + 1);
            children = children.filter((c) => matches(c, column, raw));
            continue;
        }
        rows = rows.filter((r) => matches(r, key, raw));
    }
    if (inner) {
        const parentKey = EMBED_PARENT_KEY[inner]!;
        rows = rows.flatMap((r) => {
            const own = children.filter((c) => c[parentKey] === r.id);
            return own.length > 0 ? [{ ...r, [inner]: own }] : [];
        });
    }
    return rows;
}

function cascadeDelete(table: string, removed: Row[]) {
    if (table === "saved_meals") {
        const ids = new Set(removed.map((r) => r.id));
        tables.saved_meal_items = (tables.saved_meal_items ?? []).filter(
            (r) => !ids.has(String(r.saved_meal_id)),
        );
        for (const meal of tables.meals ?? []) {
            if (ids.has(String(meal.saved_meal_id))) meal.saved_meal_id = null;
        }
    }
}

function uniqueSavedName(userId: string, name: string, exceptId?: string) {
    return (tables.saved_meals ?? []).some(
        (r) =>
            r.user_id === userId &&
            String(r.name).toLowerCase() === name.toLowerCase() &&
            r.id !== exceptId,
    );
}

function conflict(): Response {
    return json(
        {
            code: "23505",
            message: "duplicate key value violates unique constraint",
            details: null,
            hint: null,
        },
        409,
    );
}

/** The write functions, with the effects of the SQL in the migration. */
function rpc(name: string, a: Record<string, unknown>): Response {
    const now = new Date().toISOString();
    const writeItems = (
        table: "meal_items" | "saved_meal_items",
        parentKey: "meal_id" | "saved_meal_id",
        parentId: string,
        items: Record<string, unknown>[],
    ) => {
        for (const it of items) {
            (tables[table] ??= []).push({
                id: freshId(),
                [parentKey]: parentId,
                user_id: a.p_user_id,
                ...it,
            });
        }
    };

    if (name === "insert_meal_with_items") {
        const meal = a.p_meal as Record<string, unknown>;
        const existing = (tables.meals ?? []).find(
            (r) =>
                r.user_id === a.p_user_id &&
                r.idempotency_key === meal.idempotency_key,
        );
        if (existing) {
            return json({ meal: existing, deduplicated: true });
        }
        // meals.saved_meal_id references saved_meals.
        if (
            meal.saved_meal_id != null &&
            !(tables.saved_meals ?? []).some((r) => r.id === meal.saved_meal_id)
        ) {
            return json(
                {
                    code: "23503",
                    message:
                        'insert or update on table "meals" violates foreign key constraint "meals_saved_meal_id_fkey"',
                    details: null,
                    hint: null,
                },
                409,
            );
        }
        const row: Row = {
            id: freshId(),
            user_id: a.p_user_id as string,
            ...meal,
            saved_meal_id: meal.saved_meal_id ?? null,
        };
        (tables.meals ??= []).push(row);
        writeItems(
            "meal_items",
            "meal_id",
            row.id,
            a.p_items as Record<string, unknown>[],
        );
        return json({ meal: row, deduplicated: false });
    }

    if (name === "update_meal_with_items") {
        const row = (tables.meals ?? []).find(
            (r) => r.id === a.p_meal_id && r.user_id === a.p_user_id,
        );
        if (!row) return json(null);
        const fields = a.p_fields as Record<string, unknown>;
        for (const [k, v] of Object.entries(fields)) row[k] = v;
        tables.meal_items = (tables.meal_items ?? []).filter(
            (r) => r.meal_id !== row.id,
        );
        writeItems(
            "meal_items",
            "meal_id",
            row.id,
            a.p_items as Record<string, unknown>[],
        );
        return json(row);
    }

    if (name === "insert_saved_meal") {
        const saved = a.p_saved as Record<string, unknown>;
        if (uniqueSavedName(a.p_user_id as string, String(saved.name))) {
            return conflict();
        }
        const row: Row = {
            id: freshId(),
            user_id: a.p_user_id as string,
            created_at: now,
            updated_at: now,
            ...saved,
        };
        (tables.saved_meals ??= []).push(row);
        writeItems(
            "saved_meal_items",
            "saved_meal_id",
            row.id,
            a.p_items as Record<string, unknown>[],
        );
        return json(row);
    }

    if (name === "update_saved_meal") {
        const row = (tables.saved_meals ?? []).find(
            (r) => r.id === a.p_id && r.user_id === a.p_user_id,
        );
        if (!row) return json(null);
        const fields = a.p_fields as Record<string, unknown>;
        const nextName = fields.name ?? row.name;
        if (uniqueSavedName(a.p_user_id as string, String(nextName), row.id)) {
            return conflict();
        }
        for (const [k, v] of Object.entries(fields)) row[k] = v;
        row.updated_at = now;
        if (Array.isArray(a.p_items)) {
            tables.saved_meal_items = (tables.saved_meal_items ?? []).filter(
                (r) => r.saved_meal_id !== row.id,
            );
            writeItems(
                "saved_meal_items",
                "saved_meal_id",
                row.id,
                a.p_items as Record<string, unknown>[],
            );
        }
        return json(row);
    }

    return refuse(`rpc ${name}`);
}

async function fakePostgrest(
    input: string | URL | Request,
    init?: RequestInit,
): Promise<Response> {
    const req =
        input instanceof Request
            ? new Request(input, init)
            : new Request(input.toString(), init);
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/rest\/v1\//, "");
    const accept = req.headers.get("accept") ?? "";
    const wantsCount = (req.headers.get("prefer") ?? "").includes(
        "count=exact",
    );

    if (path.startsWith("rpc/")) {
        const body = (await req.json()) as Record<string, unknown>;
        const name = path.slice("rpc/".length);
        rpcCalls.push({ name, args: body });
        return rpc(name, body);
    }

    const table = path;
    if (!(table in tables)) tables[table] = [];
    requests.push({ method: req.method, table, params: url.searchParams });

    if (req.method === "POST") {
        const body = (await req.json()) as Record<string, unknown>;
        const row: Row = {
            id: freshId(),
            notes: null,
            idempotency_key: null,
            saved_meal_id: null,
            ...body,
        };
        tables[table]!.push(row);
        return accept.includes("object+json")
            ? json(row, 201)
            : json([row], 201);
    }

    if (req.method === "DELETE") {
        const removed = filtered(table, url.searchParams);
        const ids = new Set(removed.map((r) => r.id));
        tables[table] = (tables[table] ?? []).filter((r) => !ids.has(r.id));
        cascadeDelete(table, removed);
        return json(removed);
    }

    const all = filtered(table, url.searchParams);
    const sorted = sortRows(all, url.searchParams.get("order"));

    if (req.method === "HEAD") {
        return new Response(null, {
            status: 200,
            headers: { "content-range": `*/${all.length}` },
        });
    }

    if (req.method !== "GET") return refuse(`${req.method} ${table}`);

    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(
        limitParam === null ? MAX_ROWS : Number(limitParam),
        MAX_ROWS,
    );
    const page = sorted.slice(offset, offset + limit);

    if (accept.includes("object+json")) {
        return all.length === 1
            ? json(all[0])
            : json({ code: "PGRST116", message: "no rows" }, 406);
    }

    const range =
        page.length === 0
            ? `*/${all.length}`
            : `${offset}-${offset + page.length - 1}/${wantsCount ? all.length : "*"}`;
    return json(page, 200, { "content-range": range });
}

function seed(table: string, rows: Record<string, unknown>[]) {
    (tables[table] ??= []).push(
        ...rows.map((r) => ({ id: freshId(), ...r }) as Row),
    );
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
        fakePostgrest as typeof fetch,
    );
});

afterAll(() => {
    fetchSpy.mockRestore();
    if (envBefore.url === undefined) delete process.env.SUPABASE_URL;
    if (envBefore.key === undefined) delete process.env.SUPABASE_SECRET_KEY;
});

beforeEach(() => {
    tables = {};
    rpcCalls = [];
    requests = [];
    nextId = 1;
});

function mealInput(overrides: Partial<MealInput> = {}): MealInput {
    return {
        description: "lunch bowl",
        meal_type: "lunch",
        calories: 388.54,
        protein_g: 30,
        carbs_g: 40,
        fat_g: 12,
        logged_at: LOGGED_AT,
        ...overrides,
    };
}

describe("insertMeal with items or a saved meal", () => {
    test("writes the meal and its items through one rpc and skips the meals table", async () => {
        const items = [
            item(1, { name: "rice", amount: 200, unit: "g", calories: 260 }),
            item(2, { name: "chicken", calories: 128.5 }),
        ];
        const result = await insertMeal(USER, mealInput({ items }));

        expect(rpcCalls).toHaveLength(1);
        expect(rpcCalls[0]!.name).toBe("insert_meal_with_items");
        const args = rpcCalls[0]!.args;
        expect(args.p_user_id).toBe(USER);
        const p_meal = args.p_meal as Record<string, unknown>;
        // calories is rounded before the digest and the row, as on the plain path.
        expect(p_meal.calories).toBe(389);
        expect(p_meal.logged_at).toBe(LOGGED_AT);
        expect(p_meal.meal_type).toBe("lunch");
        expect(p_meal.saved_meal_id).toBeNull();
        expect(p_meal.idempotency_key).toBe(
            mealIdempotencyKey(USER, mealInput({ calories: 389 }), LOGGED_AT),
        );
        expect(args.p_items).toEqual([
            expect.objectContaining({
                position: 1,
                name: "rice",
                amount: 200,
                unit: "g",
                calories: 260,
                fiber_g: null,
            }),
            expect.objectContaining({
                position: 2,
                name: "chicken",
                calories: 128.5,
            }),
        ]);

        expect(result.deduplicated).toBe(false);
        expect(result.meal.calories).toBe(389);
        expect(tables.meal_items).toHaveLength(2);
        // The meal is written by the rpc alone: no select or insert on meals.
        expect(requests.filter((r) => r.table === "meals")).toHaveLength(0);
    });

    test("saturated and trans fat reach the meal row and each item row through the rpc (#201)", async () => {
        const items = [
            item(1, { name: "cheese", saturated_fat_g: 21, trans_fat_g: null }),
            item(2, { name: "bread", saturated_fat_g: 0.5, trans_fat_g: 0.1 }),
        ];
        await insertMeal(
            USER,
            mealInput({ items, saturated_fat_g: 21.5, trans_fat_g: 0.1 }),
        );
        const p_meal = rpcCalls[0]!.args.p_meal as Record<string, unknown>;
        expect(p_meal).toMatchObject({
            saturated_fat_g: 21.5,
            trans_fat_g: 0.1,
        });
        expect(tables.meal_items).toEqual([
            expect.objectContaining({ name: "cheese", trans_fat_g: null }),
            expect.objectContaining({
                name: "bread",
                saturated_fat_g: 0.5,
                trans_fat_g: 0.1,
            }),
        ]);
    });

    test("items do not change the derived idempotency key", async () => {
        const withItems = await insertMeal(
            USER,
            mealInput({ items: [item(1), item(2, { name: "sauce" })] }),
        );
        // The same meal fields without items derive the same key.
        const expected = mealIdempotencyKey(
            USER,
            mealInput({ calories: 389 }),
            LOGGED_AT,
        );
        const args = rpcCalls[0]!.args.p_meal as Record<string, unknown>;
        expect(args.idempotency_key).toBe(expected);
        expect(withItems.meal.idempotency_key).toBe(expected);
    });

    test("a replay returns the existing meal with deduplicated true and writes no items", async () => {
        const items = [item(1), item(2)];
        await insertMeal(USER, mealInput({ items }));
        const replay = await insertMeal(USER, mealInput({ items }));

        expect(replay.deduplicated).toBe(true);
        expect(replay.meal.description).toBe("lunch bowl");
        expect(rpcCalls).toHaveLength(2);
        expect(tables.meals).toHaveLength(1);
        expect(tables.meal_items).toHaveLength(2);
    });

    test("a saved meal id alone takes the rpc branch with no items", async () => {
        const savedId = freshId();
        seed("saved_meals", [{ id: savedId, user_id: USER, name: "Oats" }]);
        await insertMeal(USER, mealInput({ saved_meal_id: savedId }));

        expect(rpcCalls).toHaveLength(1);
        const args = rpcCalls[0]!.args;
        expect(args.p_items).toEqual([]);
        expect((args.p_meal as Record<string, unknown>).saved_meal_id).toBe(
            savedId,
        );
    });

    test("a saved meal deleted before the write is a ToolError naming its id", async () => {
        const savedId = freshId();
        const err = await insertMeal(
            USER,
            mealInput({ saved_meal_id: savedId }),
        ).catch((e: unknown) => e);

        expect(err).toBeInstanceOf(ToolError);
        expect((err as ToolError).message).toBe(
            `No saved meal found with id ${savedId}; it may have just been deleted.`,
        );
        // categorizeError files it as record_not_found by this prefix.
        expect((err as ToolError).message.toLowerCase()).toStartWith(
            "no saved meal found",
        );
        expect(tables.meals ?? []).toHaveLength(0);
    });

    test("a foreign-key failure without a saved meal id stays a plain error", async () => {
        // No saved_meal_id: nothing for the caller to act on, so it is not
        // turned into a ToolError (the stub cannot fail this way, so the
        // check is on the branch condition through a fresh rpc stand-in).
        const before = fetchSpy.getMockImplementation();
        fetchSpy.mockImplementation((async () =>
            json(
                { code: "23503", message: "fk", details: null, hint: null },
                409,
            )) as unknown as typeof fetch);
        try {
            const err = await insertMeal(
                USER,
                mealInput({ items: [item(1)] }),
            ).catch((e: unknown) => e);
            expect(err).toBeInstanceOf(Error);
            expect(err).not.toBeInstanceOf(ToolError);
            expect((err as Error).message).toStartWith(
                "Failed to insert meal:",
            );
        } finally {
            fetchSpy.mockImplementation(before!);
        }
    });

    test("a plain insert keeps the existing select-then-insert path and sends no rpc", async () => {
        const result = await insertMeal(USER, mealInput());

        expect(rpcCalls).toHaveLength(0);
        const selects = requests.filter(
            (r) => r.table === "meals" && r.method === "GET",
        );
        expect(selects).toHaveLength(1);
        expect(selects[0]!.params.get("idempotency_key")).toBe(
            `eq.${mealIdempotencyKey(USER, mealInput({ calories: 389 }), LOGGED_AT)}`,
        );
        expect(result.deduplicated).toBe(false);
        const row = tables.meals![0]!;
        expect(row).not.toHaveProperty("saved_meal_id", undefined);
        expect(row.calories).toBe(389);
    });
});

describe("replaceMealItems", () => {
    test("recomputes the idempotency key over the new totals, as updateMeal does", async () => {
        const created = await insertMeal(
            USER,
            mealInput({ items: [item(1, { calories: 300 })] }),
        );
        // A snapshot: the fake's rpc mutates the stored row in place.
        const before = {
            ...tables.meals!.find((r) => r.id === created.meal.id)!,
        };
        const fields = {
            calories: 420,
            protein_g: 31,
            carbs_g: null,
        };
        const newItems = [item(1, { calories: 420 })];

        const updated = await replaceMealItems(
            USER,
            created.meal.id,
            fields,
            newItems,
        );

        expect(rpcCalls.at(-1)!.name).toBe("update_meal_with_items");
        const args = rpcCalls.at(-1)!.args;
        expect(args.p_user_id).toBe(USER);
        expect(args.p_meal_id).toBe(created.meal.id);
        const p_fields = args.p_fields as Record<string, unknown>;
        expect(p_fields.calories).toBe(420);
        expect(p_fields.carbs_g).toBeNull();
        expect(p_fields.idempotency_key).toBe(
            updatedMealIdempotencyKey(
                USER,
                before as unknown as Meal,
                fields as unknown as Partial<MealInput>,
            ),
        );
        expect(args.p_items).toEqual([
            expect.objectContaining({ position: 1, calories: 420 }),
        ]);
        expect(updated.id).toBe(created.meal.id);
    });

    test("a meal that is not this user's is a ToolError naming the id", async () => {
        const error = await replaceMealItems(USER, MISSING, {}, []).catch(
            (e: unknown) => e,
        );
        expect(error).toBeInstanceOf(ToolError);
        expect((error as Error).message).toBe(
            `No meal found with id ${MISSING}.`,
        );
        expect(rpcCalls).toHaveLength(0);
    });
});

describe("getMealItems and countMealItems", () => {
    test("returns numbers for numeric columns PostgREST sent back as strings, in position order", async () => {
        const mealA = freshId();
        seed("meal_items", [
            {
                meal_id: mealA,
                user_id: USER,
                position: 2,
                name: "bun",
                amount: "1",
                unit: null,
                calories: "150.5",
                protein_g: "5",
                carbs_g: "28",
                fat_g: "2",
                fiber_g: "3.5",
                sugar_g: null,
                added_sugar_g: null,
                alcohol_g: null,
                caffeine_mg: null,
            },
            {
                meal_id: mealA,
                user_id: USER,
                position: 1,
                name: "patty",
                amount: null,
                unit: "piece",
                calories: 250,
                protein_g: 20,
                carbs_g: 0,
                fat_g: 18,
                fiber_g: null,
                sugar_g: null,
                added_sugar_g: null,
                alcohol_g: null,
                caffeine_mg: null,
            },
        ]);

        const map = await getMealItems(USER, [mealA]);
        const items = map.get(mealA)!;
        expect(items.map((i) => i.name)).toEqual(["patty", "bun"]);
        expect(items[1]).toMatchObject({
            position: 2,
            amount: 1,
            calories: 150.5,
            protein_g: 5,
            fiber_g: 3.5,
            sugar_g: null,
        });
        expect(typeof items[1]!.calories).toBe("number");
    });

    test("chunks parents in groups of 100 and drops other users' items", async () => {
        const ids = Array.from({ length: 250 }, () => freshId());
        seed(
            "meal_items",
            ids.map((id) => ({
                meal_id: id,
                user_id: USER,
                position: 1,
                name: "x",
                amount: null,
                unit: null,
                calories: 1,
                protein_g: 0,
                carbs_g: 0,
                fat_g: 0,
                fiber_g: null,
                sugar_g: null,
                added_sugar_g: null,
                alcohol_g: null,
                caffeine_mg: null,
            })),
        );
        seed("meal_items", [
            {
                meal_id: ids[0],
                user_id: OTHER,
                position: 2,
                name: "not yours",
                amount: null,
                unit: null,
                calories: 1,
                protein_g: 0,
                carbs_g: 0,
                fat_g: 0,
                fiber_g: null,
                sugar_g: null,
                added_sugar_g: null,
                alcohol_g: null,
                caffeine_mg: null,
            },
        ]);

        const map = await getMealItems(USER, ids);
        expect(map.size).toBe(250);
        expect(map.get(ids[0]!)!.map((i) => i.name)).toEqual(["x"]);
        const inRequests = requests.filter(
            (r) => r.table === "meal_items" && r.params.has("meal_id"),
        );
        expect(inRequests).toHaveLength(3);
    });

    test("pages past PostgREST's row cap within one meal", async () => {
        const meal = freshId();
        seed(
            "meal_items",
            Array.from({ length: 1100 }, (_, i) => ({
                meal_id: meal,
                user_id: USER,
                position: i + 1,
                name: `n${i + 1}`,
                amount: null,
                unit: null,
                calories: 1,
                protein_g: 0,
                carbs_g: 0,
                fat_g: 0,
                fiber_g: null,
                sugar_g: null,
                added_sugar_g: null,
                alcohol_g: null,
                caffeine_mg: null,
            })),
        );
        const map = await getMealItems(USER, [meal]);
        expect(map.get(meal)).toHaveLength(1100);
    });

    test("countMealItems counts one meal's rows", async () => {
        const meal = freshId();
        seed("meal_items", [
            { meal_id: meal, user_id: USER, position: 1 },
            { meal_id: meal, user_id: USER, position: 2 },
            { meal_id: freshId(), user_id: USER, position: 1 },
        ]);
        expect(await countMealItems(USER, meal)).toBe(2);
    });
});

describe("saved meals", () => {
    const porridge = {
        name: "Porridge",
        description: "oats with milk",
        meal_type: "breakfast" as string | null,
        calories: 300.4,
        protein_g: 12,
    };

    test("a name already used, ignoring case, throws SavedMealNameTaken naming the existing meal", async () => {
        const first = await createSavedMeal(USER, porridge, [item(1)]);

        const error = await createSavedMeal(
            USER,
            { ...porridge, name: "porridge" },
            [],
        ).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(SavedMealNameTaken);
        expect((error as SavedMealNameTaken).existingId).toBe(first.id);
        expect(tables.saved_meals).toHaveLength(1);
    });

    test("the same name for another user is a different saved meal", async () => {
        await createSavedMeal(USER, porridge, []);
        const other = await createSavedMeal(OTHER, porridge, []);
        expect(other.user_id).toBe(OTHER);
    });

    test("create sends both fats on the saved meal and on each ingredient (#201)", async () => {
        await createSavedMeal(
            USER,
            { ...porridge, saturated_fat_g: 2, trans_fat_g: null },
            [item(1, { saturated_fat_g: 2, trans_fat_g: 0.05 })],
        );
        const p_saved = rpcCalls[0]!.args.p_saved as Record<string, unknown>;
        expect(p_saved).toMatchObject({
            saturated_fat_g: 2,
            trans_fat_g: null,
        });
        const p_items = rpcCalls[0]!.args.p_items as Record<string, unknown>[];
        expect(p_items[0]).toMatchObject({
            saturated_fat_g: 2,
            trans_fat_g: 0.05,
        });
    });

    test("create rounds calories to an integer and returns the items it was given", async () => {
        const saved = await createSavedMeal(USER, porridge, [item(1)]);
        const p_saved = rpcCalls[0]!.args.p_saved as Record<string, unknown>;
        expect(p_saved.calories).toBe(300);
        expect(saved.calories).toBe(300);
        expect(saved.items.map((i) => i.position)).toEqual([1]);
    });

    test("getSavedMeals lists by name with items, and getSavedMeal scopes to the user", async () => {
        const oats = await createSavedMeal(
            USER,
            { ...porridge, name: "Oats" },
            [item(1), item(2)],
        );
        await createSavedMeal(USER, { ...porridge, name: "bagel" }, []);

        const all = await getSavedMeals(USER);
        expect(all.map((s) => s.name)).toEqual(["bagel", "Oats"]);
        expect(all[1]!.items).toHaveLength(2);
        expect(await getSavedMeal(USER, oats.id)).toMatchObject({
            id: oats.id,
        });
        expect(await getSavedMeal(OTHER, oats.id)).toBeNull();
        expect(await getSavedMeal(USER, "not-a-uuid")).toBeNull();
        expect(await countSavedMeals(USER)).toBe(2);
    });

    test("findSavedMealsByName matches exactly, ignoring case, and never treats % as a wildcard", async () => {
        await createSavedMeal(USER, { ...porridge, name: "Oat porridge" }, []);
        expect(await findSavedMealsByName(USER, "oat PORRIDGE")).toHaveLength(
            1,
        );
        expect(await findSavedMealsByName(USER, "oat")).toHaveLength(0);
        expect(await findSavedMealsByName(USER, "%")).toHaveLength(0);
    });

    test("updateSavedMeal keeps the items when none are given and replaces them when they are", async () => {
        const saved = await createSavedMeal(USER, porridge, [item(1), item(2)]);

        const kept = await updateSavedMeal(
            USER,
            saved.id,
            { description: "oats, milk and honey" },
            null,
        );
        expect(kept!.description).toBe("oats, milk and honey");
        expect(kept!.items).toHaveLength(2);

        const replaced = await updateSavedMeal(USER, saved.id, {}, [item(1)]);
        expect(replaced!.items).toHaveLength(1);
        expect(tables.saved_meal_items).toHaveLength(1);
    });

    test("updateSavedMeal to a name another saved meal holds throws SavedMealNameTaken", async () => {
        await createSavedMeal(USER, { ...porridge, name: "Eggs" }, []);
        const oats = await createSavedMeal(USER, porridge, []);
        const error = await updateSavedMeal(
            USER,
            oats.id,
            { name: "EGGS" },
            null,
        ).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(SavedMealNameTaken);
    });

    test("updateSavedMeal for an id this user does not hold returns null", async () => {
        expect(
            await updateSavedMeal(USER, MISSING, { description: "x" }, null),
        ).toBeNull();
    });

    test("deleteSavedMeal returns the deleted row and leaves logged meals with a null link", async () => {
        const saved = await createSavedMeal(USER, porridge, [item(1)]);
        await insertMeal(
            USER,
            mealInput({ items: [item(1)], saved_meal_id: saved.id }),
        );

        const deleted = await deleteSavedMeal(USER, saved.id);
        expect(deleted).toMatchObject({ id: saved.id, name: "Porridge" });
        expect(tables.saved_meal_items).toHaveLength(0);
        const meal = tables.meals![0]!;
        expect(meal.saved_meal_id).toBeNull();
        expect(meal.description).toBe("lunch bowl");
        expect(await deleteSavedMeal(USER, saved.id)).toBeNull();
    });

    test("getMealById reads one logged meal of the user, and nothing for another user", async () => {
        const created = await insertMeal(USER, mealInput());
        expect((await getMealById(USER, created.meal.id))?.id).toBe(
            created.meal.id,
        );
        expect(await getMealById(OTHER, created.meal.id)).toBeNull();
    });
});

describe("search across ingredients and saved meals", () => {
    test("searchMeals finds a meal through one of its item names, inside the window", async () => {
        const plain = freshId();
        const syrup = freshId();
        const old = freshId();
        seed("meals", [
            {
                id: plain,
                user_id: USER,
                description: "pancakes",
                logged_at: "2026-03-10T08:00:00.000Z",
                notes: null,
            },
            {
                id: syrup,
                user_id: USER,
                description: "breakfast",
                logged_at: "2026-03-12T08:00:00.000Z",
                notes: null,
            },
            {
                id: old,
                user_id: USER,
                description: "breakfast",
                logged_at: "2025-01-01T08:00:00.000Z",
                notes: null,
            },
        ]);
        seed("meal_items", [
            { meal_id: syrup, user_id: USER, position: 1, name: "Maple Syrup" },
            { meal_id: old, user_id: USER, position: 1, name: "maple syrup" },
            {
                meal_id: plain,
                user_id: OTHER,
                position: 1,
                name: "maple syrup",
            },
        ]);

        const found = await searchMeals(USER, ["maple"], {
            sinceIso: "2026-01-01T00:00:00.000Z",
        });
        expect(found.map((m) => m.id)).toEqual([syrup]);

        const everything = await searchMeals(USER, ["maple syrup"]);
        expect(everything.map((m) => m.id).sort()).toEqual([old, syrup].sort());
    });

    test("searchMeals' ingredient match is windowed, ordered and limited in the database", async () => {
        // 120 old meals with a matching item, more than any item-row cap,
        // and one recent one: the recent one has to come back.
        const old: Record<string, unknown>[] = [];
        const oldItems: Record<string, unknown>[] = [];
        for (let i = 0; i < 120; i++) {
            const id = freshId();
            old.push({
                id,
                user_id: USER,
                description: "bowl",
                logged_at: new Date(
                    Date.UTC(2025, 0, 1) + i * 86_400_000,
                ).toISOString(),
                notes: null,
            });
            oldItems.push({
                meal_id: id,
                user_id: USER,
                position: 1,
                name: "rice",
            });
        }
        const recent = freshId();
        seed("meals", [
            ...old,
            {
                id: recent,
                user_id: USER,
                description: "bowl",
                logged_at: "2026-03-12T08:00:00.000Z",
                notes: null,
            },
        ]);
        seed("meal_items", [
            ...oldItems,
            {
                meal_id: recent,
                user_id: USER,
                position: 1,
                name: "Jasmine Rice",
            },
        ]);

        const found = await searchMeals(USER, ["rice"], {
            sinceIso: "2026-01-01T00:00:00.000Z",
        });
        expect(found.map((m) => m.id)).toEqual([recent]);
        // The embedded items are a filter only; the rows are plain meals.
        expect(found[0]).not.toHaveProperty("meal_items");

        const itemQuery = requests.find(
            (r) => r.params.get("select") === "*,meal_items!inner(name)",
        );
        expect(itemQuery).toBeDefined();
        expect(itemQuery!.table).toBe("meals");
        const params = itemQuery!.params;
        expect(params.get("user_id")).toBe(`eq.${USER}`);
        expect(params.get("meal_items.user_id")).toBe(`eq.${USER}`);
        expect(params.get("logged_at")).toBe("gte.2026-01-01T00:00:00.000Z");
        expect(params.getAll("meal_items.name")).toEqual(["ilike.%rice%"]);
        expect(params.get("order")).toBe("logged_at.desc");
        expect(params.get("limit")).toBe("50");
        // No separate read of item rows.
        expect(requests.some((r) => r.table === "meal_items")).toBe(false);

        // Newest first and capped at the limit, across the whole history.
        const latest = await searchMeals(USER, ["rice"], { limit: 3 });
        expect(latest.map((m) => m.id)).toEqual([
            recent,
            old[119]!.id as string,
            old[118]!.id as string,
        ]);
    });

    test("searchMeals needs one item to hold every token of a query", async () => {
        const split = freshId();
        const together = freshId();
        seed("meals", [
            {
                id: split,
                user_id: USER,
                description: "plate",
                logged_at: "2026-03-10T08:00:00.000Z",
                notes: null,
            },
            {
                id: together,
                user_id: USER,
                description: "plate",
                logged_at: "2026-03-11T08:00:00.000Z",
                notes: null,
            },
        ]);
        seed("meal_items", [
            { meal_id: split, user_id: USER, position: 1, name: "brown bread" },
            { meal_id: split, user_id: USER, position: 2, name: "white rice" },
            {
                meal_id: together,
                user_id: USER,
                position: 1,
                name: "brown rice",
            },
        ]);

        const found = await searchMeals(USER, ["brown rice"]);
        expect(found.map((m) => m.id)).toEqual([together]);
        const itemQuery = requests.find(
            (r) => r.params.get("select") === "*,meal_items!inner(name)",
        );
        expect(itemQuery!.params.getAll("meal_items.name")).toEqual([
            "ilike.%brown%",
            "ilike.%rice%",
        ]);
    });

    test("searchSavedMeals keeps the first 20 by name, ignoring case, however rows arrive", async () => {
        // Created in reverse name order, so physical order is the opposite of
        // the wanted one; mixed case so a case-sensitive order would differ.
        const names = Array.from(
            { length: 30 },
            (_, i) =>
                `${i % 2 ? "chicken" : "Chicken"} ${String(i).padStart(2, "0")}`,
        );
        for (const name of [...names].reverse()) {
            await createSavedMeal(
                USER,
                { name, description: "dinner", meal_type: null },
                [],
            );
        }
        requests = [];

        const { saved: found, total } = await searchSavedMeals(USER, [
            "chicken",
        ]);
        expect(found.map((s) => s.name)).toEqual(names.slice(0, 20));
        // Every match is counted, so the listing can say it was cut.
        expect(total).toBe(30);

        const nameQuery = requests.find(
            (r) => r.table === "saved_meals" && r.params.has("name"),
        );
        expect(nameQuery!.params.get("order")).toBe("name.asc,id.asc");
        expect(nameQuery!.params.get("limit")).toBe("200");
    });

    test("searchSavedMeals reads ingredient matches through an inner embed", async () => {
        for (let i = 0; i < 25; i++) {
            await createSavedMeal(
                USER,
                {
                    name: `Bowl ${String(25 - i).padStart(2, "0")}`,
                    description: "lunch",
                    meal_type: null,
                },
                [item(1, { name: "Tofu" })],
            );
        }
        await createSavedMeal(
            USER,
            { name: "Aaa salad", description: "lunch", meal_type: null },
            [item(1, { name: "smoked tofu" }), item(2, { name: "kale" })],
        );
        requests = [];

        const { saved: found, total } = await searchSavedMeals(USER, ["tofu"]);
        expect(found).toHaveLength(20);
        expect(total).toBe(26);
        expect(found[0]).toEqual(
            expect.objectContaining({ name: "Aaa salad", item_count: 2 }),
        );
        expect(found.map((s) => s.name).slice(1, 4)).toEqual([
            "Bowl 01",
            "Bowl 02",
            "Bowl 03",
        ]);

        const itemQuery = requests.find(
            (r) => r.params.get("select") === "*,saved_meal_items!inner(name)",
        );
        expect(itemQuery!.table).toBe("saved_meals");
        expect(itemQuery!.params.get("user_id")).toBe(`eq.${USER}`);
        expect(itemQuery!.params.get("saved_meal_items.user_id")).toBe(
            `eq.${USER}`,
        );
        expect(itemQuery!.params.getAll("saved_meal_items.name")).toEqual([
            "ilike.%tofu%",
        ]);
        expect(itemQuery!.params.get("order")).toBe("name.asc,id.asc");
        expect(itemQuery!.params.get("limit")).toBe("200");
    });

    test("searchSavedMeals matches by name, by description and by ingredient, with item counts", async () => {
        await createSavedMeal(
            USER,
            {
                name: "Chicken wrap",
                description: "lunch on the go",
                meal_type: "lunch",
                calories: 500,
            },
            [item(1, { name: "Tortilla" }), item(2, { name: "Chicken" })],
        );
        await createSavedMeal(
            USER,
            { name: "Oats", description: "warm breakfast", meal_type: null },
            [item(1, { name: "Oat milk" })],
        );
        await createSavedMeal(
            USER,
            { name: "Bagel", description: "plain", meal_type: null },
            [],
        );

        const { saved: byIngredient, total: ingredientTotal } =
            await searchSavedMeals(USER, ["tortilla"]);
        expect(ingredientTotal).toBe(1);
        expect(byIngredient).toEqual([
            expect.objectContaining({
                name: "Chicken wrap",
                item_count: 2,
                calories: 500,
            }),
        ]);

        const { saved: byName } = await searchSavedMeals(USER, ["oats"]);
        expect(byName.map((s) => s.name)).toEqual(["Oats"]);
        expect(byName[0]!.item_count).toBe(1);

        const { saved: byDescription } = await searchSavedMeals(USER, [
            "lunch go",
        ]);
        expect(byDescription.map((s) => s.name)).toEqual(["Chicken wrap"]);

        const { saved: twoTokens } = await searchSavedMeals(USER, ["oat milk"]);
        expect(twoTokens.map((s) => s.name)).toEqual(["Oats"]);

        expect(await searchSavedMeals(USER, ["nothing like this"])).toEqual({
            saved: [],
            total: 0,
        });
        expect(await searchSavedMeals(USER, [])).toEqual({
            saved: [],
            total: 0,
        });
    });
});

describe("export readers", () => {
    test("return ids with the rows, in the export's order", async () => {
        const saved = await createSavedMeal(
            USER,
            {
                name: "Oats",
                description: "warm",
                meal_type: null,
            },
            [item(1), item(2)],
        );
        const created = await insertMeal(
            USER,
            mealInput({ items: [item(1)], saved_meal_id: saved.id }),
        );

        const meals = await getAllSavedMeals(USER);
        expect(meals.map((m) => m.id)).toEqual([saved.id]);

        const savedItems = await getAllSavedMealItems(USER);
        expect(savedItems.map((i) => i.position)).toEqual([1, 2]);
        expect(savedItems[0]).toHaveProperty("saved_meal_id", saved.id);
        expect(savedItems[0]).toHaveProperty("id");

        const mealItems = await getAllMealItems(USER);
        expect(mealItems).toHaveLength(1);
        expect(mealItems[0]).toHaveProperty("meal_id", created.meal.id);
        expect(mealItems[0]).toHaveProperty("user_id", USER);
    });
});
