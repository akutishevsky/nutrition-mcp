import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BodyMeasurementKind } from "../units.js";

let supabase: SupabaseClient;

export function buildClient(): SupabaseClient {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
        throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
    }
    // persistSession: false keeps the client stateless — signIn/signUp on this
    // client won't attach a user JWT to future requests. Without this, the
    // singleton would silently downgrade from service-role to authenticated
    // after any auth call, making RLS fire on subsequent writes.
    return createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
}

export function getSupabase(): SupabaseClient {
    if (!supabase) supabase = buildClient();
    return supabase;
}

// ---------- Idempotency ----------

// Derive a stable idempotency key from the request content so the column is
// always populated and retries dedupe even when the client omits a key. The
// resolved logged_at is part of the digest, so two genuinely separate but
// otherwise-identical entries (logged at different times) get distinct keys and
// are never wrongly merged. A retry replays the same args — including the same
// logged_at — and therefore lands on the same key, when the caller sent
// logged_at. An omitted logged_at resolves to the arrival instant below, so a
// replay of such a call derives a new key; only a caller-supplied
// idempotency_key makes it replay-safe (see idempotencyKeyDescription in
// src/mcp.ts). The "auto:" prefix marks
// server-derived keys, distinguishing them from client-supplied ones.
//
// The digest is POSITIONAL over whatever the caller passes, so the field list
// at each call site is frozen: see the warning inside mealIdempotencyKey before
// touching one.
export function deriveIdempotencyKey(
    parts: (string | number | null | undefined)[],
): string {
    const digest = new Bun.CryptoHasher("sha256")
        .update(parts.map((p) => p ?? "").join("\u0000"))
        .digest("hex");
    return `auto:${digest}`;
}

// UUID shape check, exported so callers can skip database lookups on foreign ids.
const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A canonical 8-4-4-4-12 hex UUID, any case. The gate before any uuid-typed
 *  `eq`/`in` filter: Postgres rejects a non-uuid with a cast error instead of
 *  simply not matching. */
export function isUuid(v: string): boolean {
    return UUID_RE.test(v);
}

/**
 * Which of `ids` are meals this user already has. An export of this server's
 * own data carries each meal's id, so a re-import can recognize the meals it
 * describes instead of writing a second copy of every one of them.
 *
 * Scoped by user_id, so another user's id is reported as absent and the row
 * imports as a new meal — never as a match against a row they cannot see.

/**
 * Fetch pages via `fetchPage(from, to)` (inclusive, 0-indexed) until a page
 * comes back shorter than `pageSize`. A plain unbounded select silently caps
 * at PostgREST's `db-max-rows` (default 1000), so any query that can return
 * more rows than that must page through `.range()` instead of relying on one
 * request to return everything.
 */
export async function fetchAllPages<T>(
    fetchPage: (from: number, to: number) => Promise<T[]>,
    pageSize = 1000,
): Promise<T[]> {
    const all: T[] = [];
    for (let from = 0; ; from += pageSize) {
        const page = await fetchPage(from, from + pageSize - 1);
        all.push(...page);
        if (page.length < pageSize) break;
    }
    return all;
}

type LoggedTable =
    | "meals"
    | "water_log"
    | "weight_log"
    | "body_measurement_log"
    | "active_calories_log";

/**
 * Every row with start <= logged_at < end, oldest first — the one path behind
 * the day and range readers. Paged because an unbounded select caps at
 * PostgREST's db-max-rows and kept the OLDEST 1000 rows (a 365-day get_trends
 * showed the latest 30 days as zeros; the export readers got the same fix in
 * #66). The `id` tie-break is required, not cosmetic: date-only imports all
 * anchor at local noon, so many rows share one `logged_at`, and without a total
 * order ties straddling a page edge could be skipped or returned twice.
 * Offset paging can still return a row twice when a backdated insert lands
 * between pages and shifts later rows forward — k inserts replay the last k
 * rows of the previous page, so the twins are not adjacent once k >= 2 (a bulk
 * import does exactly that). They are dropped here by id, keeping the first
 * copy, before any caller sums a meal twice. The first page's exact count then catches a server whose
 * max-rows is below the page size, whose short first page would otherwise end
 * the loop looking complete. The optional `filter` (body measurements by
 * kind) is applied in the database, so the exact count — and with it the
 * truncation check — covers only the filtered rows.
 */
export async function selectLoggedWindow<T extends { id: string }>(
    table: LoggedTable,
    noun: string,
    userId: string,
    startUtc: Date,
    endUtc: Date,
    filter?: { kind: BodyMeasurementKind },
): Promise<T[]> {
    let expected: number | null = null;
    const fetched = await fetchAllPages<T>(async (from, to) => {
        let q = getSupabase()
            .from(table)
            .select("*", from === 0 ? { count: "exact" } : undefined)
            .eq("user_id", userId);
        if (filter) q = q.eq("kind", filter.kind);
        const { data, error, count } = await q
            .gte("logged_at", startUtc.toISOString())
            .lt("logged_at", endUtc.toISOString())
            .order("logged_at", { ascending: true })
            .order("id", { ascending: true })
            .range(from, to);

        if (error) throw new Error(`Failed to get ${noun}: ${error.message}`);
        if (from === 0) expected = count ?? null;
        return (data as T[]) ?? [];
    });
    const seen = new Set<string>();
    const rows = fetched.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
    });
    assertWindowComplete(noun, rows.length, expected);
    return rows;
}

/** Throws when a paged window read came back with fewer distinct rows than the
 *  first page's exact count. More than expected is fine: a concurrent insert. */
export function assertWindowComplete(
    noun: string,
    fetched: number,
    expected: number | null,
): void {
    if (expected !== null && fetched < expected) {
        throw new Error(
            `Failed to get ${noun}: fetched ${fetched} of ${expected} rows — result would be truncated`,
        );
    }
}

// ---------- Export-only readers (account, telemetry, connections) ----------

/**
 * Every row of `table` belonging to the user, paged past PostgREST's row cap
 * and reconciled against the first page's exact count, throwing when short —
 * the same contract as getAllMeals, for the export's non-log tables. `order`
 * must be a total order (end on a unique column) or ties straddling a page
 * edge could be skipped or repeated. A stable order does not stop offset
 * paging from returning a row twice when a row is inserted between pages
 * ahead of the current offset, so a table with a unique selected column
 * passes it as `dedupeBy` and repeats are dropped (first copy kept) before
 * the count is reconciled. tool_analytics needs this: withAnalytics stamps
 * `invoked_at` when a call starts but inserts the row when it ends, so a
 * parallel tool call finishing mid-export lands behind rows already paged.
 */
export async function selectAllForUser<T>(
    table: string,
    columns: string,
    noun: string,
    userId: string,
    order: string[],
    dedupeBy?: keyof T,
): Promise<T[]> {
    let expected: number | null = null;
    const paged = await fetchAllPages<T>(async (from, to) => {
        let q = getSupabase()
            .from(table)
            .select(columns, from === 0 ? { count: "exact" } : undefined)
            .eq("user_id", userId);
        for (const column of order) q = q.order(column, { ascending: true });
        const { data, error, count } = await q.range(from, to);
        if (error) throw new Error(`Failed to get ${noun}: ${error.message}`);
        if (from === 0) expected = count ?? null;
        return (data as T[]) ?? [];
    });
    let rows = paged;
    if (dedupeBy !== undefined) {
        const seen = new Set<unknown>();
        rows = paged.filter((r) => {
            const key = r[dedupeBy];
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
    if (expected === null) {
        throw new Error(
            `Failed to get ${noun}: no row count came back — export would be truncated`,
        );
    }
    if (rows.length < expected) {
        throw new Error(
            `Failed to get ${noun}: fetched ${rows.length} of ${expected} rows — export would be truncated`,
        );
    }
    return rows;
}

// PostgREST's code for "no rows returned" from .single() — a real answer (this
// token does not exist), not a transport or availability failure.
export const PGRST_NO_ROWS = "PGRST116";
