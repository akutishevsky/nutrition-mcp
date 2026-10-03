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
    createSupabaseHealthSyncStore,
    supabaseHealthSyncCleanupStore,
    type HealthSyncDayRow,
} from "./health-sync-store.js";
import { hashSecret, newOpaqueToken } from "./token-hash.js";

// The hash-at-rest contract of the REAL Supabase health-sync store, in the
// style of src/oauth-supabase-store.test.ts: the routes' tests run against an
// in-memory fake, which proves nothing about what production writes or looks
// up. No mock.module (process-wide; see CLAUDE.md): global fetch is stubbed —
// supabase-js resolves it per call — with a small PostgREST stand-in that
// evaluates the filters the store sends. Nothing reaches a network or a
// database.

type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {
    health_sync_pending: [],
    health_sync_links: [],
    health_sync_days: [],
};
const requests: { method: string; table: string; url: URL; body: unknown }[] =
    [];
// While set, every request answers 500. (A network-level failure is not
// exercised: postgrest-js retries a rejected GET three times with 1-2-4 s
// backoff and then reports it in `error`, the same branch a 500 takes.)
let failNext: "500" | null = null;

const RESERVED = new Set([
    "select",
    "order",
    "limit",
    "offset",
    "on_conflict",
    "columns",
]);

// Splits on commas outside parentheses: `a.eq.1,and(b.is.null,c.lt.2)`.
function splitTopLevel(s: string): string[] {
    const out: string[] = [];
    let depth = 0;
    let cur = "";
    for (const ch of s) {
        if (ch === "(") depth++;
        if (ch === ")") depth--;
        if (ch === "," && depth === 0) {
            out.push(cur);
            cur = "";
        } else cur += ch;
    }
    if (cur) out.push(cur);
    return out;
}

function compare(op: string, actual: unknown, raw: string): boolean {
    if (op === "is") return raw === "null" ? actual == null : false;
    if (actual == null) return false;
    const a = String(actual);
    switch (op) {
        case "eq":
            return a === raw;
        case "gt":
            return a > raw;
        case "gte":
            return a >= raw;
        case "lt":
            return a < raw;
        case "lte":
            return a <= raw;
        default:
            throw new Error(`unsupported operator ${op}`);
    }
}

// One `op.value` (or `not.op.value`) condition against a column.
function condition(row: Row, column: string, expr: string): boolean {
    if (expr.startsWith("not.")) return !condition(row, column, expr.slice(4));
    const dot = expr.indexOf(".");
    return compare(expr.slice(0, dot), row[column], expr.slice(dot + 1));
}

// An `or=(…)` / `and(…)` group of `column.op.value` terms.
function group(row: Row, kind: "or" | "and", inner: string): boolean {
    const terms = splitTopLevel(inner).map((t) => {
        if (t.startsWith("and(")) return group(row, "and", t.slice(4, -1));
        if (t.startsWith("or(")) return group(row, "or", t.slice(3, -1));
        const dot = t.indexOf(".");
        return condition(row, t.slice(0, dot), t.slice(dot + 1));
    });
    return kind === "or" ? terms.some(Boolean) : terms.every(Boolean);
}

function matches(row: Row, url: URL): boolean {
    for (const [key, value] of url.searchParams) {
        if (RESERVED.has(key)) continue;
        if (key === "or") {
            if (!group(row, "or", value.slice(1, -1))) return false;
        } else if (!condition(row, key, value)) return false;
    }
    return true;
}

function project(rows: Row[], url: URL): Row[] {
    const select = url.searchParams.get("select");
    if (!select || select === "*") return rows;
    const cols = select.split(",").map((c) => c.trim());
    return rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c]])));
}

function ordered(rows: Row[], url: URL): Row[] {
    const order = url.searchParams.get("order");
    let out = [...rows];
    if (order) {
        const [col, dir] = order.split(".");
        out.sort((a, b) => String(a[col!]).localeCompare(String(b[col!])));
        if (dir === "desc") out.reverse();
    }
    const limit = url.searchParams.get("limit");
    if (limit) out = out.slice(0, Number(limit));
    return out;
}

const DEFAULTS: Record<string, () => Row> = {
    health_sync_pending: () => ({
        id: crypto.randomUUID(),
        user_id: null,
        claim_code_hash: null,
        claim_expires_at: null,
        created_at: new Date().toISOString(),
    }),
    health_sync_links: () => ({
        id: crypto.randomUUID(),
        kind: "shortcut",
        lease_until: null,
        created_at: new Date().toISOString(),
        last_used_at: null,
        last_sync_at: null,
    }),
    health_sync_days: () => ({
        sent_values: null,
        topup_seq: 0,
        offer_count: 0,
        notified: {},
        first_sent_at: null,
        last_sent_at: null,
    }),
};

async function fakePostgrest(
    input: string | URL | Request,
    init?: RequestInit,
): Promise<Response> {
    const req =
        input instanceof Request
            ? new Request(input, init)
            : new Request(input.toString(), init);
    const url = new URL(req.url);
    const table = url.pathname.replace(/^\/rest\/v1\//, "");
    if (!(table in tables)) throw new Error(`unexpected request ${req.url}`);
    const text = await req.text();
    const body = text ? JSON.parse(text) : null;
    requests.push({ method: req.method, table, url, body });
    if (failNext === "500") {
        return new Response(JSON.stringify({ message: "boom" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }
    const json = (rows: Row[], total = rows.length) =>
        new Response(JSON.stringify(rows), {
            status: 200,
            headers: {
                "content-type": "application/json",
                "content-range": `0-${Math.max(rows.length - 1, 0)}/${total}`,
            },
        });
    const all = tables[table]!;
    switch (req.method) {
        case "POST": {
            const incoming = (Array.isArray(body) ? body : [body]) as Row[];
            const conflict = url.searchParams.get("on_conflict")?.split(",");
            const prefer = req.headers.get("prefer") ?? "";
            const ignore = prefer.includes("resolution=ignore-duplicates");
            const written: Row[] = [];
            for (const row of incoming) {
                const existing = conflict
                    ? all.find((r) => conflict.every((c) => r[c] === row[c]))
                    : undefined;
                if (existing) {
                    if (ignore) continue;
                    Object.assign(existing, row);
                    written.push(existing);
                } else {
                    const fresh = { ...DEFAULTS[table]!(), ...row };
                    all.push(fresh);
                    written.push(fresh);
                }
            }
            if (prefer.includes("return=representation"))
                return json(project(written, url));
            return new Response(null, { status: 201 });
        }
        case "GET": {
            const hit = all.filter((r) => matches(r, url));
            return json(project(ordered(hit, url), url), hit.length);
        }
        case "PATCH": {
            const hit = all.filter((r) => matches(r, url));
            for (const r of hit) Object.assign(r, body);
            return json(project(hit, url));
        }
        case "DELETE": {
            const gone = all.filter((r) => matches(r, url));
            tables[table] = all.filter((r) => !gone.includes(r));
            return json(project(gone, url));
        }
        default:
            throw new Error(`unexpected ${req.method}`);
    }
}

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const NOW = new Date("2026-10-03T09:00:00.000Z");
const at = (minutes: number) =>
    new Date(NOW.getTime() + minutes * 60_000).toISOString();
const FIELDS = ["energy_kcal", "protein_g"];

const envBefore = {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SECRET_KEY,
};
let fetchSpy: ReturnType<typeof spyOn>;
const store = createSupabaseHealthSyncStore();

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

beforeEach(() => {
    for (const t of Object.keys(tables)) tables[t] = [];
    requests.length = 0;
    failNext = null;
});

async function pending(minutesLeft = 30) {
    const connectId = newOpaqueToken();
    const deviceSecret = newOpaqueToken();
    await store.createPending({
        connectId,
        deviceSecret,
        pkceVerifier: "v".repeat(43),
        fields: FIELDS,
        tz: "Europe/Kyiv",
        backfillDays: 2,
        expiresAt: at(minutesLeft),
    });
    return { connectId, deviceSecret };
}

describe("pending connects", () => {
    test("are written with hashed connect id and device secret only", async () => {
        const { connectId, deviceSecret } = await pending();
        const row = tables.health_sync_pending![0]!;
        expect(row.connect_id_hash).toBe(hashSecret(connectId));
        expect(row.device_secret_hash).toBe(hashSecret(deviceSecret));
        expect(row.pkce_verifier).toBe("v".repeat(43));
        expect(row.backfill_days).toBe(2);
        const dump = JSON.stringify(tables.health_sync_pending);
        expect(dump).not.toContain(connectId);
        expect(dump).not.toContain(deviceSecret);
    });

    test("are found by the raw connect id, filtered on its hash alone, without hash columns", async () => {
        const { connectId } = await pending();
        const row = await store.getPendingByConnectId(connectId, NOW);
        expect(row?.fields).toEqual(FIELDS);
        expect(row?.user_id).toBeNull();
        expect(row).not.toHaveProperty("connect_id_hash");
        expect(row).not.toHaveProperty("device_secret_hash");
        const lookup = requests.at(-1)!;
        expect(lookup.url.searchParams.get("connect_id_hash")).toBe(
            `eq.${hashSecret(connectId)}`,
        );
        expect(
            await store.getPendingByConnectId(hashSecret(connectId), NOW),
        ).toBeNull();
    });

    test("are not found once expired", async () => {
        const { connectId } = await pending(-1);
        expect(await store.getPendingByConnectId(connectId, NOW)).toBeNull();
    });

    test("are claimed once: claim code hashed, user set, verifier cleared", async () => {
        const { connectId } = await pending();
        const code = newOpaqueToken();
        expect(
            await store.setPendingClaim(connectId, code, USER, at(10), NOW),
        ).toBe(true);
        const row = tables.health_sync_pending![0]!;
        expect(row.claim_code_hash).toBe(hashSecret(code));
        expect(row.user_id).toBe(USER);
        expect(row.claim_expires_at).toBe(at(10));
        expect(row.pkce_verifier).toBeNull();
        expect(JSON.stringify(row)).not.toContain(code);
        // A second callback for the same connect gets nothing.
        expect(
            await store.setPendingClaim(
                connectId,
                newOpaqueToken(),
                OTHER,
                at(10),
                NOW,
            ),
        ).toBe(false);
        expect(row.user_id).toBe(USER);
    });

    test("can't be claimed once expired", async () => {
        const { connectId } = await pending(-1);
        expect(
            await store.setPendingClaim(
                connectId,
                newOpaqueToken(),
                USER,
                at(10),
                NOW,
            ),
        ).toBe(false);
    });
});

describe("claims", () => {
    async function claimed(claimMinutes = 10) {
        const p = await pending();
        const code = newOpaqueToken();
        await store.setPendingClaim(
            p.connectId,
            code,
            USER,
            at(claimMinutes),
            NOW,
        );
        return { ...p, code };
    }

    test("need the claim code AND the device secret, and redeem once", async () => {
        const { code, deviceSecret } = await claimed();
        expect(
            await store.consumeClaim(code, newOpaqueToken(), NOW),
        ).toBeNull();
        expect(
            await store.consumeClaim(newOpaqueToken(), deviceSecret, NOW),
        ).toBeNull();
        expect(tables.health_sync_pending).toHaveLength(1);

        const row = await store.consumeClaim(code, deviceSecret, NOW);
        expect(row?.user_id).toBe(USER);
        expect(row?.fields).toEqual(FIELDS);
        expect(row?.tz).toBe("Europe/Kyiv");
        expect(row?.backfill_days).toBe(2);
        expect(tables.health_sync_pending).toHaveLength(0);
        const del = requests.at(-1)!;
        expect(del.method).toBe("DELETE");
        expect(del.url.searchParams.get("claim_code_hash")).toBe(
            `eq.${hashSecret(code)}`,
        );
        expect(del.url.searchParams.get("device_secret_hash")).toBe(
            `eq.${hashSecret(deviceSecret)}`,
        );

        expect(await store.consumeClaim(code, deviceSecret, NOW)).toBeNull();
    });

    test("a lapsed claim code is not redeemed", async () => {
        const { code, deviceSecret } = await claimed(-1);
        expect(await store.consumeClaim(code, deviceSecret, NOW)).toBeNull();
    });

    test("the hashes themselves are not accepted as the secrets", async () => {
        const { code, deviceSecret } = await claimed();
        expect(
            await store.consumeClaim(
                hashSecret(code),
                hashSecret(deviceSecret),
                NOW,
            ),
        ).toBeNull();
    });
});

describe("links", () => {
    const link = (expiresAt = "2999-01-01T00:00:00.000Z") => ({
        fields: FIELDS,
        fallbackTz: "Europe/Kyiv",
        syncStartDate: "2026-10-01",
        expiresAt,
    });

    test("are written with the token hashed and looked up by the raw token", async () => {
        const token = `nmhs_${newOpaqueToken()}`;
        await store.replaceLink(USER, link(), token);
        const row = tables.health_sync_links![0]!;
        expect(row.token_hash).toBe(hashSecret(token));
        expect(JSON.stringify(tables.health_sync_links)).not.toContain(token);

        const found = await store.lookupLink(token);
        expect(found.status).toBe("valid");
        if (found.status !== "valid") throw new Error("unreachable");
        expect(found.link.user_id).toBe(USER);
        expect(found.link.sync_start_date).toBe("2026-10-01");
        expect(found.link).not.toHaveProperty("token_hash");
        expect(requests.at(-1)!.url.searchParams.get("token_hash")).toBe(
            `eq.${hashSecret(token)}`,
        );

        expect(await store.lookupLink(hashSecret(token))).toEqual({
            status: "invalid",
        });
        expect(await store.lookupLink(`nmhs_${newOpaqueToken()}`)).toEqual({
            status: "invalid",
        });
    });

    test("one per user: replacing retires the old token and resets the row", async () => {
        const first = `nmhs_${newOpaqueToken()}`;
        await store.replaceLink(USER, link(), first);
        tables.health_sync_links![0]!.lease_until = "2999-01-01T00:00:00Z";
        tables.health_sync_links![0]!.last_sync_at = "2026-10-02T05:00:00Z";
        const second = `nmhs_${newOpaqueToken()}`;
        await store.replaceLink(USER, link(), second);

        expect(tables.health_sync_links).toHaveLength(1);
        expect(requests.at(-1)!.url.searchParams.get("on_conflict")).toBe(
            "user_id",
        );
        const row = tables.health_sync_links![0]!;
        expect(row.lease_until).toBeNull();
        expect(row.last_sync_at).toBeNull();
        expect(await store.lookupLink(first)).toEqual({ status: "invalid" });
        expect((await store.lookupLink(second)).status).toBe("valid");
    });

    test("an expired or year-old link is invalid", async () => {
        const expired = `nmhs_${newOpaqueToken()}`;
        await store.replaceLink(USER, link(at(-1)), expired);
        expect(await store.lookupLink(expired, NOW)).toEqual({
            status: "invalid",
        });

        const old = `nmhs_${newOpaqueToken()}`;
        await store.replaceLink(OTHER, link(), old);
        tables.health_sync_links!.find((r) => r.user_id === OTHER)!.created_at =
            "2025-10-01T00:00:00.000Z";
        expect(await store.lookupLink(old, NOW)).toEqual({ status: "invalid" });
    });

    test("a failed lookup is unavailable, never invalid", async () => {
        const token = `nmhs_${newOpaqueToken()}`;
        await store.replaceLink(USER, link(), token);
        failNext = "500";
        expect(await store.lookupLink(token)).toEqual({
            status: "unavailable",
        });
        failNext = null;
    });

    test("touch and last-sync stamps land on the user's link", async () => {
        await store.replaceLink(USER, link(), `nmhs_${newOpaqueToken()}`);
        await store.touchLink(USER, at(0), at(90 * 24 * 60));
        await store.setLastSync(USER, at(1));
        const row = tables.health_sync_links![0]!;
        expect(row.last_used_at).toBe(at(0));
        expect(row.expires_at).toBe(at(90 * 24 * 60));
        expect(row.last_sync_at).toBe(at(1));
    });

    test("the lease goes to one caller until it lapses or is released", async () => {
        await store.replaceLink(USER, link(), `nmhs_${newOpaqueToken()}`);
        expect(await store.acquireLease(USER, at(2), NOW)).toBe(true);
        expect(await store.acquireLease(USER, at(2), NOW)).toBe(false);
        // Releasing someone else's lease is a no-op.
        await store.releaseLease(USER, at(5));
        expect(await store.acquireLease(USER, at(2), NOW)).toBe(false);
        // After it lapses, a later caller takes it.
        expect(await store.acquireLease(USER, at(5), new Date(at(3)))).toBe(
            true,
        );
        await store.releaseLease(USER, at(5));
        expect(tables.health_sync_links![0]!.lease_until).toBeNull();
        expect(await store.acquireLease(USER, at(2), NOW)).toBe(true);
        await store.releaseLease(USER);
        expect(tables.health_sync_links![0]!.lease_until).toBeNull();
    });
});

describe("sent-values days", () => {
    const day = (date: string, sent: Record<string, number> | null) =>
        ({
            user_id: USER,
            date,
            timezone: "Europe/Kyiv",
            sent_values: sent,
            topup_seq: 0,
            offer_count: sent ? 0 : 1,
            notified: {},
            first_sent_at: sent ? at(0) : null,
            last_sent_at: sent ? at(0) : null,
        }) satisfies HealthSyncDayRow;

    test("insert only new (user, date) rows and read back by range in date order", async () => {
        expect(
            await store.insertDays([
                day("2026-10-02", null),
                day("2026-09-30", { energy_kcal: 2000 }),
                day("2026-10-01", { energy_kcal: 1800 }),
            ]),
        ).toEqual(["2026-10-02", "2026-09-30", "2026-10-01"]);
        // A row that exists is left alone, and not reported as inserted.
        expect(
            await store.insertDays([
                { ...day("2026-10-02", { energy_kcal: 9999 }), topup_seq: 5 },
            ]),
        ).toEqual([]);
        expect(tables.health_sync_days).toHaveLength(3);
        expect(requests.at(-1)!.url.searchParams.get("on_conflict")).toBe(
            "user_id,date",
        );
        const got = await store.getDays(USER, "2026-10-01", "2026-10-02");
        expect(got.map((d) => d.date)).toEqual(["2026-10-01", "2026-10-02"]);
        expect(got[1]!.sent_values).toBeNull();
        expect(got[1]!.topup_seq).toBe(0);
        expect(await store.getDays(OTHER, "2026-01-01", "2026-12-31")).toEqual(
            [],
        );
    });

    test("an empty insert sends nothing", async () => {
        expect(await store.insertDays([])).toEqual([]);
        expect(requests).toHaveLength(0);
    });

    test("updateDay writes only onto the row as the caller read it", async () => {
        await store.insertDays([
            day("2026-10-02", null),
            { ...day("2026-10-01", { energy_kcal: 1800 }), topup_seq: 1 },
        ]);
        // Initial ack: still unsent at seq 0 → applies.
        expect(
            await store.updateDay(
                USER,
                "2026-10-02",
                { sent_values: { energy_kcal: 2000 }, offer_count: 0 },
                { topup_seq: 0, sentNull: true },
            ),
        ).toBe(true);
        const req = requests.at(-1)!;
        expect(req.method).toBe("PATCH");
        expect(req.url.searchParams.get("sent_values")).toBe("is.null");
        expect(req.url.searchParams.get("topup_seq")).toBe("eq.0");
        // A second writer that read it unsent now matches nothing.
        expect(
            await store.updateDay(
                USER,
                "2026-10-02",
                { sent_values: null, offer_count: 7 },
                { topup_seq: 0, sentNull: true },
            ),
        ).toBe(false);
        const d2 = tables.health_sync_days!.find(
            (r) => r.date === "2026-10-02",
        )!;
        expect(d2.sent_values).toEqual({ energy_kcal: 2000 });
        expect(d2.offer_count).toBe(0);
        // A stale topup_seq matches nothing either; the right one does.
        expect(
            await store.updateDay(
                USER,
                "2026-10-01",
                { topup_seq: 2 },
                { topup_seq: 0, sentNull: false },
            ),
        ).toBe(false);
        expect(
            await store.updateDay(
                USER,
                "2026-10-01",
                { topup_seq: 2 },
                { topup_seq: 1, sentNull: false },
            ),
        ).toBe(true);
        expect(requests.at(-1)!.url.searchParams.get("sent_values")).toBe(
            "not.is.null",
        );
        // Another user's row is never touched.
        expect(
            await store.updateDay(
                OTHER,
                "2026-10-01",
                { topup_seq: 3 },
                { topup_seq: 2, sentNull: false },
            ),
        ).toBe(false);
    });

    test("link status reports the latest acknowledged date and no token hash", async () => {
        expect(await store.getLinkStatus(USER)).toBeNull();
        await store.replaceLink(
            USER,
            {
                fields: FIELDS,
                fallbackTz: null,
                syncStartDate: "2026-09-29",
                expiresAt: "2999-01-01T00:00:00.000Z",
            },
            `nmhs_${newOpaqueToken()}`,
        );
        expect((await store.getLinkStatus(USER))?.sent_through).toBeNull();
        await store.insertDays([
            day("2026-09-30", { energy_kcal: 2000 }),
            day("2026-10-01", { energy_kcal: 1800 }),
            // Offered but never acknowledged: not "sent".
            day("2026-10-02", null),
        ]);
        const status = await store.getLinkStatus(USER);
        expect(status?.sent_through).toBe("2026-10-01");
        expect(status?.sync_start_date).toBe("2026-09-29");
        expect(status?.kind).toBe("shortcut");
        expect(status).not.toHaveProperty("token_hash");
        expect(status).not.toHaveProperty("id");
    });

    test("link status is none once the link is past its expiry or its cap", async () => {
        await store.replaceLink(
            USER,
            {
                fields: FIELDS,
                fallbackTz: null,
                syncStartDate: "2026-09-29",
                expiresAt: at(60),
            },
            `nmhs_${newOpaqueToken()}`,
        );
        expect(await store.getLinkStatus(USER, NOW)).not.toBeNull();
        // Idle past expires_at, before any sweep.
        expect(await store.getLinkStatus(USER, new Date(at(61)))).toBeNull();
        // Created over 365 days ago, however recently used.
        tables.health_sync_links![0]!.created_at = "2025-10-01T00:00:00.000Z";
        tables.health_sync_links![0]!.expires_at = "2999-01-01T00:00:00.000Z";
        expect(await store.getLinkStatus(USER, NOW)).toBeNull();
    });

    test("the export reads every row of the user in date order", async () => {
        await store.insertDays([
            day("2026-10-01", { energy_kcal: 1800 }),
            day("2026-09-30", { energy_kcal: 2000 }),
            { ...day("2026-10-01", null), user_id: OTHER },
        ]);
        const rows = await store.getDaysForExport(USER);
        expect(rows.map((d) => d.date)).toEqual(["2026-09-30", "2026-10-01"]);
        expect(rows.every((d) => d.user_id === USER)).toBe(true);
    });

    test("deleteLink removes the user's link and days, nobody else's", async () => {
        await store.replaceLink(
            USER,
            {
                fields: FIELDS,
                fallbackTz: null,
                syncStartDate: "2026-09-29",
                expiresAt: "2999-01-01T00:00:00.000Z",
            },
            `nmhs_${newOpaqueToken()}`,
        );
        await store.replaceLink(
            OTHER,
            {
                fields: FIELDS,
                fallbackTz: null,
                syncStartDate: "2026-09-29",
                expiresAt: "2999-01-01T00:00:00.000Z",
            },
            `nmhs_${newOpaqueToken()}`,
        );
        await store.insertDays([
            day("2026-10-01", { energy_kcal: 1800 }),
            { ...day("2026-10-01", null), user_id: OTHER },
        ]);
        await store.deleteLink(USER);
        expect(tables.health_sync_links!.map((r) => r.user_id)).toEqual([
            OTHER,
        ]);
        expect(tables.health_sync_days!.map((r) => r.user_id)).toEqual([OTHER]);
    });
});

describe("retention sweeps", () => {
    test("pending rows go by expires_at until claimed, then by claim_expires_at", async () => {
        const nowIso = NOW.toISOString();
        tables.health_sync_pending = [
            { id: "lapsed", expires_at: at(-1), claim_expires_at: null },
            { id: "open", expires_at: at(1), claim_expires_at: null },
            { id: "claimed-live", expires_at: at(-1), claim_expires_at: at(5) },
            {
                id: "claimed-lapsed",
                expires_at: at(1),
                claim_expires_at: at(-1),
            },
        ];
        expect(
            await supabaseHealthSyncCleanupStore.deleteExpiredPending(nowIso),
        ).toBe(2);
        expect(tables.health_sync_pending!.map((r) => r.id)).toEqual([
            "open",
            "claimed-live",
        ]);
    });

    test("links go past their expiry or their hard cap", async () => {
        tables.health_sync_links = [
            { id: "live", expires_at: at(60), created_at: at(-60) },
            { id: "idle", expires_at: at(-1), created_at: at(-60) },
            {
                id: "old",
                expires_at: at(60),
                created_at: "2025-01-01T00:00:00.000Z",
            },
        ];
        expect(
            await supabaseHealthSyncCleanupStore.deleteExpiredLinks(
                NOW.toISOString(),
                "2025-10-03T09:00:00.000Z",
            ),
        ).toBe(2);
        expect(tables.health_sync_links!.map((r) => r.id)).toEqual(["live"]);
    });

    test("days go strictly before the cutoff date", async () => {
        tables.health_sync_days = [
            { user_id: USER, date: "2026-09-24" },
            { user_id: USER, date: "2026-09-25" },
        ];
        expect(
            await supabaseHealthSyncCleanupStore.deleteDaysBefore("2026-09-25"),
        ).toBe(1);
        expect(tables.health_sync_days!.map((r) => r.date)).toEqual([
            "2026-09-25",
        ]);
    });
});
