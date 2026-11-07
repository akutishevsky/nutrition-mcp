import { test, expect, beforeAll, afterAll, beforeEach, spyOn } from "bun:test";
import { getDashboardSessionsForExport } from "./supabase.js";
import { categorizeError } from "./analytics.js";

// The REAL getDashboardSessionsForExport against a stubbed global fetch (no
// mock.module, which is process-wide; see CLAUDE.md). The stand-in mimics
// PostgREST: it honours offset/limit, caps a page at MAX_ROWS like
// db-max-rows, and reports `Content-Range: from-to/total` when the request
// asks for `count=exact`. Nothing reaches the network.

type Row = {
    id: string;
    user_id: string;
    created_at: string;
    last_seen_at: string | null;
    expires_at: string;
    token_hash: string;
};

const USER = "22222222-2222-4222-8222-222222222222";
const MAX_ROWS = 1000;
let rows: Row[] = [];
/** Rows the stand-in hides from every page (a short read), still counted. */
let hidden = 0;
const requests: URL[] = [];

async function fakePostgrest(
    input: string | URL | Request,
    init?: RequestInit,
): Promise<Response> {
    const req =
        input instanceof Request
            ? new Request(input, init)
            : new Request(input.toString(), init);
    const url = new URL(req.url);
    if (url.pathname !== "/rest/v1/dashboard_sessions" || req.method !== "GET")
        throw new Error(`unexpected request ${req.method} ${req.url}`);
    requests.push(url);
    const user = url.searchParams.get("user_id")?.replace(/^eq\./, "");
    const mine = rows
        .filter((r) => r.user_id === user)
        .sort(
            (a, b) =>
                a.created_at.localeCompare(b.created_at) ||
                a.id.localeCompare(b.id),
        );
    const visible = mine.slice(0, mine.length - hidden);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Math.min(
        Number(url.searchParams.get("limit") ?? MAX_ROWS),
        MAX_ROWS,
    );
    const page = visible.slice(offset, offset + limit);
    const columns = (url.searchParams.get("select") ?? "*")
        .split(",")
        .map((c) => c.trim());
    const body = page.map((r) =>
        Object.fromEntries(
            columns.map((c) => [c, (r as Record<string, unknown>)[c]]),
        ),
    );
    const headers: Record<string, string> = {
        "content-type": "application/json",
    };
    const wantsCount = (req.headers.get("prefer") ?? "").includes(
        "count=exact",
    );
    const end = page.length ? offset + page.length - 1 : offset;
    headers["content-range"] =
        `${offset}-${end}/${wantsCount ? mine.length : "*"}`;
    return new Response(JSON.stringify(body), { status: 200, headers });
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
    rows = [];
    hidden = 0;
    requests.length = 0;
});

function seed(n: number, user = USER): void {
    for (let i = 0; i < n; i++) {
        // Every row shares a created_at in groups of 7, so the id tie-break
        // is what keeps the order total across page edges.
        const created = new Date(
            Date.UTC(2026, 10, 1) + Math.floor(i / 7) * 60_000,
        ).toISOString();
        rows.push({
            id: crypto.randomUUID(),
            user_id: user,
            created_at: created,
            last_seen_at: i % 2 ? created : null,
            expires_at: "2026-12-01T00:00:00.000Z",
            token_hash: `hash-${i}`,
        });
    }
}

test("pages past the row cap, oldest first, and never returns the hash or id", async () => {
    seed(2345);
    seed(3, "33333333-3333-4333-8333-333333333333");
    const got = await getDashboardSessionsForExport(USER);
    expect(got).toHaveLength(2345);
    // Three pages, each ordered by created_at then id, the first asking for
    // the exact count.
    expect(requests).toHaveLength(3);
    for (const url of requests) {
        expect(url.searchParams.get("order")).toBe("created_at.asc,id.asc");
        expect(url.searchParams.get("select")).not.toContain("token_hash");
    }
    for (let i = 1; i < got.length; i++) {
        expect(
            got[i - 1]!.created_at.localeCompare(got[i]!.created_at),
        ).toBeLessThanOrEqual(0);
    }
    expect(Object.keys(got[0]!).sort()).toEqual([
        "created_at",
        "expires_at",
        "last_seen_at",
    ]);
    expect(JSON.stringify(got)).not.toContain("hash-");
});

test("a short read throws, categorized like every export reader (export_error)", async () => {
    seed(1500);
    hidden = 2;
    const err = await getDashboardSessionsForExport(USER).then(
        () => null,
        (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toContain("export would be truncated");
    expect(categorizeError(err)).toBe("export_error");
});

test("no rows is an empty list, not an error", async () => {
    expect(await getDashboardSessionsForExport(USER)).toEqual([]);
});
