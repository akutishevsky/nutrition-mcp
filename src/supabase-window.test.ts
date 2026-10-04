import { test, expect, describe, beforeAll, afterAll, spyOn } from "bun:test";
import {
    getMealsByDate,
    getMealsInRange,
    getWaterInRange,
    getWeightInRange,
    getBodyMeasurementsInRange,
    hasMealsBefore,
} from "./supabase.js";

// The paged window reader behind every day and range read, driven for real.
// Before it existed these readers sorted logged_at ASC with no .range(), so
// past PostgREST's 1000-row cap they kept the OLDEST rows and a 365-day
// get_trends showed the latest 30 days as zeros (the export readers had hit the
// same cap in #66). src/supabase.test.ts only pins the reconcile rule and that
// the readers route through selectLoggedWindow; this proves the paging itself.
//
// No mock.module (it is process-wide; see CLAUDE.md): the real functions run
// against a stubbed global fetch, which supabase-js resolves at call time,
// holding rows in memory and honouring offset/limit like PostgREST does. Any
// request it does not recognise is refused, never passed through — Bun
// auto-loads .env, so the client may point at a real project.

type Row = { id: string; user_id: string; logged_at: string; kind?: string };

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER_USER = "22222222-2222-4222-8222-222222222222";
const TABLES = [
    "meals",
    "water_log",
    "weight_log",
    "body_measurement_log",
] as const;
type Table = (typeof TABLES)[number];
const WINDOW_ROWS = 2500;

const tables: Record<Table, Row[]> = {
    meals: [],
    water_log: [],
    weight_log: [],
    body_measurement_log: [],
};
const requests: { table: Table; url: URL; prefer: string | null }[] = [];
// The server's db-max-rows: a page asks for 1000 and gets at most this many.
let maxRows = 1000;
// Runs once, after the first page is served: a write landing mid-read.
let afterFirstPage: (() => void) | null = null;

// Three rows per timestamp, so rows 999, 1000 and 1001 share one logged_at and
// straddle the first page edge. All inside 2026-01-01 .. 2026-03-01 UTC, plus
// rows the filters must drop: another user's, and one either side of the window.
// Body-measurement rows alternate waist/hips, so a kind filter halves the window
// (1,250 rows, still past one page).
function seed(): void {
    for (const table of TABLES) {
        const body = table === "body_measurement_log";
        const kindOf = (i: number) =>
            body ? { kind: i % 2 ? "waist" : "hips" } : {};
        const rows: Row[] = [];
        for (let i = 0; i < WINDOW_ROWS; i++) {
            const minute = Math.floor(i / 3);
            rows.push({
                id: crypto.randomUUID(),
                user_id: USER,
                logged_at: new Date(
                    Date.UTC(2026, 0, 1, 0, minute),
                ).toISOString(),
                ...kindOf(i),
            });
        }
        rows.push(
            {
                id: crypto.randomUUID(),
                user_id: OTHER_USER,
                logged_at: "2026-01-15T12:00:00.000Z",
                ...kindOf(1),
            },
            {
                id: crypto.randomUUID(),
                user_id: USER,
                logged_at: "2025-12-31T23:59:59.000Z",
                ...kindOf(1),
            },
            {
                id: crypto.randomUUID(),
                user_id: USER,
                logged_at: "2026-03-01T00:00:00.000Z",
                ...kindOf(1),
            },
        );
        // Stored unordered: ordering is the query's job.
        tables[table] = rows.sort(() => Math.random() - 0.5);
    }
}

function reset(): void {
    seed();
    requests.length = 0;
    maxRows = 1000;
    afterFirstPage = null;
}

const byLoggedAtThenId = (a: Row, b: Row) =>
    a.logged_at < b.logged_at
        ? -1
        : a.logged_at > b.logged_at
          ? 1
          : a.id < b.id
            ? -1
            : a.id > b.id
              ? 1
              : 0;

function expectedWindow(table: Table): Row[] {
    return tables[table]
        .filter(
            (r) =>
                r.user_id === USER &&
                r.logged_at >= "2026-01-01T00:00:00.000Z" &&
                r.logged_at < "2026-03-01T00:00:00.000Z",
        )
        .sort(byLoggedAtThenId);
}

function refuse(why: string): never {
    throw new Error(`supabase-window stub refused a request: ${why}`);
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
    const table = url.pathname.replace(/^\/rest\/v1\//, "") as Table;
    if (req.method !== "GET" || !TABLES.includes(table)) refuse(req.url);
    const q = url.searchParams;
    // Only body measurements have a kind column; PostgREST would 400 a kind
    // filter anywhere else.
    const kind = q.get("kind")?.replace(/^eq\./, "");
    if (q.has("kind") && table !== "body_measurement_log") {
        refuse(`kind filter on ${table}`);
    }
    // hasMealsBefore: one id below a bound, no order, no paging.
    if (table === "meals" && q.get("select") === "id") {
        const userId = q.get("user_id")?.replace(/^eq\./, "");
        const bounds = q.getAll("logged_at");
        const lt = bounds[0]?.startsWith("lt.") ? bounds[0].slice(3) : null;
        if (!userId || bounds.length !== 1 || !lt || q.get("limit") !== "1") {
            refuse(`unexpected existence probe ${url.search}`);
        }
        requests.push({ table, url, prefer: req.headers.get("prefer") });
        // Postgres refuses anything it cannot read as a timestamp, which is
        // what a Date's String() form is.
        if (!/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(lt)) {
            return new Response(
                JSON.stringify({
                    code: "22007",
                    message: `invalid input syntax for type timestamp with time zone: "${lt}"`,
                }),
                {
                    status: 400,
                    headers: { "content-type": "application/json" },
                },
            );
        }
        const hit = tables.meals.find(
            (r) => r.user_id === userId && r.logged_at < lt,
        );
        return new Response(JSON.stringify(hit ? [{ id: hit.id }] : []), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    }
    if (q.get("select") !== "*") refuse(`select=${q.get("select")}`);
    if (q.get("order") !== "logged_at.asc,id.asc") {
        refuse(`order=${q.get("order")}`);
    }
    const userId = q.get("user_id")?.replace(/^eq\./, "");
    const bounds = q.getAll("logged_at");
    const gte = bounds.find((b) => b.startsWith("gte."))?.slice(4);
    const lt = bounds.find((b) => b.startsWith("lt."))?.slice(3);
    const offset = Number(q.get("offset"));
    const limit = Number(q.get("limit"));
    if (!userId || !gte || !lt || !q.has("offset") || !q.has("limit")) {
        refuse(`unbounded query ${url.search}`);
    }
    const prefer = req.headers.get("prefer");
    requests.push({ table, url, prefer });

    // Postgres compares timestamps; ISO strings in one format sort the same.
    const matched = tables[table]
        .filter(
            (r) =>
                r.user_id === userId &&
                r.logged_at >= gte &&
                r.logged_at < lt &&
                (kind === undefined || r.kind === kind),
        )
        .sort(byLoggedAtThenId);
    const page = matched.slice(offset, offset + Math.min(limit, maxRows));
    const total = prefer?.includes("count=exact")
        ? String(matched.length)
        : "*";
    const range =
        page.length === 0 ? "*" : `${offset}-${offset + page.length - 1}`;
    const res = new Response(JSON.stringify(page), {
        status: 200,
        headers: {
            "content-type": "application/json",
            "content-range": `${range}/${total}`,
        },
    });
    if (afterFirstPage) {
        const hook = afterFirstPage;
        afterFirstPage = null;
        hook();
    }
    return res;
}

const envBefore = {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SECRET_KEY,
};
let fetchSpy: ReturnType<typeof spyOn>;

beforeAll(() => {
    // Only consulted if no earlier suite built the client; with a real .env
    // the client points at the real project, and the stub still answers
    // every request before it leaves the process.
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

const READERS = [
    ["getMealsInRange", "meals", getMealsInRange],
    ["getWaterInRange", "water_log", getWaterInRange],
    ["getWeightInRange", "weight_log", getWeightInRange],
    [
        "getBodyMeasurementsInRange",
        "body_measurement_log",
        getBodyMeasurementsInRange,
    ],
] as const;

describe("window readers page past the 1000-row cap", () => {
    test.each(READERS)(
        "%s returns every row of a 2,500-row window, in (logged_at, id) order",
        async (_name, table, read) => {
            reset();
            const rows = (await read(
                USER,
                "2026-01-01",
                "2026-02-28",
                "UTC",
            )) as unknown as Row[];

            expect(rows.map((r) => r.id)).toEqual(
                expectedWindow(table).map((r) => r.id),
            );
            expect(rows).toHaveLength(WINDOW_ROWS);
            expect(new Set(rows.map((r) => r.id)).size).toBe(WINDOW_ROWS);
            // Ties straddle the first page edge and are all still there once.
            expect(rows[999]!.logged_at).toBe(rows[1000]!.logged_at);
            expect(rows[1000]!.logged_at).toBe(rows[1001]!.logged_at);

            expect(
                requests.map((r) => r.url.searchParams.get("offset")),
            ).toEqual(["0", "1000", "2000"]);
            expect(requests.every((r) => r.table === table)).toBe(true);
        },
    );

    // Offset 0 can never be out of range; a later page asking for a count
    // could be, and only the first page's count is ever read.
    test("asks for an exact count on the first page only", async () => {
        reset();
        await getMealsInRange(USER, "2026-01-01", "2026-02-28", "UTC");
        expect(
            requests.map((r) => [
                r.url.searchParams.get("offset"),
                r.prefer?.includes("count=exact") ?? false,
            ]),
        ).toEqual([
            ["0", true],
            ["1000", false],
            ["2000", false],
        ]);
    });

    // A server whose max-rows is below the page size answers page 0 short,
    // which ends the loop looking complete; only the count catches it.
    test("a server capped at 500 rows throws instead of returning 500", async () => {
        reset();
        maxRows = 500;
        await expect(
            getMealsInRange(USER, "2026-01-01", "2026-02-28", "UTC"),
        ).rejects.toThrow("result would be truncated");
        expect(requests).toHaveLength(1);
    });

    // k backdated inserts between pages shift every later row forward by k,
    // so page 2 starts by replaying the last k rows of page 1. Summed twice,
    // those meals would inflate a day's calories. k >= 2 (a bulk import) puts
    // the twins out of adjacency, which a neighbour-only dedupe misses.
    test.each([1, 3])(
        "rows shifted across a page edge by %d mid-read insert(s) come back once",
        async (k) => {
            reset();
            const before = expectedWindow("meals").map((r) => r.id);
            afterFirstPage = () => {
                for (let i = 0; i < k; i++) {
                    tables.meals.push({
                        id: crypto.randomUUID(),
                        user_id: USER,
                        logged_at: "2026-01-01T00:00:00.000Z",
                    });
                }
            };
            const rows = await getMealsInRange(
                USER,
                "2026-01-01",
                "2026-02-28",
                "UTC",
            );
            expect(rows.map((r) => r.id)).toEqual(before);
        },
    );

    test("getMealsByDate issues the same query as a one-day getMealsInRange", async () => {
        reset();
        await getMealsByDate(USER, "2026-01-02", "Europe/Kyiv");
        const byDate = requests.map((r) => r.url.search);
        requests.length = 0;
        await getMealsInRange(USER, "2026-01-02", "2026-01-02", "Europe/Kyiv");
        const inRange = requests.map((r) => r.url.search);

        expect(byDate).toEqual(inRange);
        expect(byDate).toHaveLength(1);
        const q = new URLSearchParams(byDate[0]);
        expect(q.getAll("logged_at")).toEqual([
            "gte.2026-01-01T22:00:00.000Z",
            "lt.2026-01-02T22:00:00.000Z",
        ]);
    });
});

describe("hasMealsBefore", () => {
    // Its bound was once handed to .lt() as a Date, which supabase-js
    // stringifies with String() — a value Postgres refuses, so every
    // get_trends call with group_by failed.
    test("filters on the ISO instant of local midnight and answers from the rows", async () => {
        reset();
        expect(await hasMealsBefore(USER, "2026-01-02", "Europe/Kyiv")).toBe(
            true,
        );
        expect(requests).toHaveLength(1);
        const q = new URLSearchParams(requests[0]!.url.search);
        expect(q.getAll("logged_at")).toEqual(["lt.2026-01-01T22:00:00.000Z"]);

        reset();
        expect(await hasMealsBefore(USER, "2025-12-31", "UTC")).toBe(false);
    });
});

describe("body measurements filter by kind in the database", () => {
    test("a kind filter returns only that site, in (logged_at, id) order", async () => {
        reset();
        const rows = await getBodyMeasurementsInRange(
            USER,
            "2026-01-01",
            "2026-02-28",
            "UTC",
            "waist",
        );
        const expected = expectedWindow("body_measurement_log").filter(
            (r) => r.kind === "waist",
        );
        expect(expected).toHaveLength(WINDOW_ROWS / 2);
        expect(rows.map((r) => r.id)).toEqual(expected.map((r) => r.id));
        expect(rows.every((r) => r.kind === "waist")).toBe(true);
        expect(requests.every((r) => r.url.searchParams.get("kind"))).toBe(
            true,
        );
        expect(requests.map((r) => r.url.searchParams.get("kind"))).toEqual([
            "eq.waist",
            "eq.waist",
        ]);
        expect(requests.map((r) => r.url.searchParams.get("offset"))).toEqual([
            "0",
            "1000",
        ]);
    });

    // The exact count is of the filtered rows, so the truncation guard still
    // holds under a filter.
    test("a filtered read on a server capped at 500 rows throws", async () => {
        reset();
        maxRows = 500;
        await expect(
            getBodyMeasurementsInRange(
                USER,
                "2026-01-01",
                "2026-02-28",
                "UTC",
                "waist",
            ),
        ).rejects.toThrow("result would be truncated");
        expect(requests).toHaveLength(1);
    });

    test("the meal and weight readers send no kind parameter", async () => {
        reset();
        await getMealsInRange(USER, "2026-01-01", "2026-02-28", "UTC");
        await getWeightInRange(USER, "2026-01-01", "2026-02-28", "UTC");
        expect(requests.length).toBeGreaterThan(0);
        expect(requests.some((r) => r.url.searchParams.has("kind"))).toBe(
            false,
        );
    });
});
