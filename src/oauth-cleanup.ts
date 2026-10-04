// Hourly sweep of the OAuth tables: expired access tokens, refresh tokens and
// auth codes, and client registrations that were never used — and, on the
// same tick, of Apple Health sync's pending connects, links and 8-day record. Started once from
// the import.meta.main block of src/index.ts, never on import. The sweep itself
// takes an injectable store so src/oauth-cleanup.test.ts runs it against an
// in-memory fake; the Supabase queries live in src/supabase.ts.
import {
    deleteExpiredOAuthRows,
    deleteUnusedOAuthClients,
    listUnusedOAuthClientIds,
    oauthClientIdsWithGrants,
} from "./supabase.js";
import {
    HEALTH_SYNC_LINK_MAX_AGE_MS,
    supabaseHealthSyncCleanupStore,
    type HealthSyncCleanupStore,
} from "./health-sync-store.js";
import { HEALTH_SYNC_RETENTION_DAYS } from "./health-sync.js";

const SWEEP_INTERVAL_MS = 60 * 60 * 1000;

// A registration that has never authenticated at /token for this long is
// abandoned: every MCP client registers afresh on each new connection, so the
// table otherwise grows by one row per connect attempt forever.
export const UNUSED_CLIENT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Clients registered before this instant are never swept, however unused
// they look. Phase A (registration) reached production about four hours
// before Phase B (#157, merged 2026-09-26 13:15Z; dev had its own window
// just before), and a client that registered and redeemed its code in that
// window is invisible to both signals below: Phase A never stamped
// last_used_at, and refresh_tokens.client_id did not exist yet, so its
// refresh token carries client_id NULL and no `client_id in (…)` query finds
// it. Deleting such a client would still log its user out: the MCP SDK sends
// client_id on the refresh, authenticateClient finds no such client and
// answers 401 invalid_client before the null-client leniency is reached.
// Those refresh tokens were minted with a 365-day lifetime and rotate to
// null-client successors when refreshed without credentials, so this floor
// stays until `select count(*) from refresh_tokens where client_id is null`
// is 0. Rounded up past the later deploy, so it errs toward keeping.
export const CLIENT_SWEEP_FLOOR_ISO = "2026-09-26T14:00:00.000Z";

// Client ids per query. Ours are UUIDs, so a page of `in (…)` stays a few KB
// of URL; the page cap bounds one sweep's work however far behind it is.
const CLIENT_PAGE_SIZE = 100;
const MAX_CLIENT_PAGES = 50;

export interface OAuthCleanupStore {
    deleteExpired(
        table: "oauth_tokens" | "refresh_tokens" | "auth_codes",
        nowIso: string,
    ): Promise<number>;
    listUnusedClients(
        window: ClientSweepWindow,
        afterId: string | null,
        limit: number,
    ): Promise<string[]>;
    clientsWithGrants(ids: string[]): Promise<Set<string>>;
    deleteUnusedClients(
        ids: string[],
        window: ClientSweepWindow,
    ): Promise<number>;
}

// The created_at range a client must fall in to be swept: at or after
// CLIENT_SWEEP_FLOOR_ISO, and before now minus UNUSED_CLIENT_MAX_AGE_MS.
export interface ClientSweepWindow {
    createdAtOrAfterIso: string;
    createdBeforeIso: string;
}

export const supabaseOAuthCleanupStore: OAuthCleanupStore = {
    deleteExpired: deleteExpiredOAuthRows,
    listUnusedClients: listUnusedOAuthClientIds,
    clientsWithGrants: oauthClientIdsWithGrants,
    deleteUnusedClients: deleteUnusedOAuthClients,
};

export interface OAuthSweepResult {
    tokens: number;
    refreshTokens: number;
    codes: number;
    clients: number;
    // Unused and in the sweep window, but still named by a refresh token or
    // auth code.
    clientsKept: number;
}

// Of a page of unused clients in the sweep window, the ones safe to delete:
// those no refresh token or auth code names. Every client in the window
// registered after Phase B, so any refresh token it holds is bound to it by
// client_id — the pre-B null-client case is the floor's job, not this one's.
// What this covers is narrower: a client with an authorization in flight
// (a live auth code, not yet redeemed), and one whose fire-and-forget
// last_used_at stamp failed.
export function deletableClients(
    candidates: readonly string[],
    withGrants: ReadonlySet<string>,
): string[] {
    return candidates.filter((id) => !withGrants.has(id));
}

export async function sweepOAuth(
    store: OAuthCleanupStore = supabaseOAuthCleanupStore,
    now: number = Date.now(),
): Promise<OAuthSweepResult> {
    const result: OAuthSweepResult = {
        tokens: 0,
        refreshTokens: 0,
        codes: 0,
        clients: 0,
        clientsKept: 0,
    };
    const nowIso = new Date(now).toISOString();

    // Expired rows first: an expired refresh token or code no longer protects
    // its client below. Each table on its own, so one failure doesn't stop
    // the rest.
    const tables = [
        ["oauth_tokens", "tokens"],
        ["refresh_tokens", "refreshTokens"],
        ["auth_codes", "codes"],
    ] as const;
    for (const [table, key] of tables) {
        try {
            result[key] = await store.deleteExpired(table, nowIso);
        } catch (err) {
            console.warn(
                `[oauth] cleanup failed table=${table}: ${(err as Error).message}`,
            );
        }
    }

    const window: ClientSweepWindow = {
        createdAtOrAfterIso: CLIENT_SWEEP_FLOOR_ISO,
        createdBeforeIso: new Date(
            now - UNUSED_CLIENT_MAX_AGE_MS,
        ).toISOString(),
    };
    try {
        let afterId: string | null = null;
        for (let page = 0; page < MAX_CLIENT_PAGES; page++) {
            const ids = await store.listUnusedClients(
                window,
                afterId,
                CLIENT_PAGE_SIZE,
            );
            if (ids.length === 0) break;
            const doomed = deletableClients(
                ids,
                await store.clientsWithGrants(ids),
            );
            result.clientsKept += ids.length - doomed.length;
            if (doomed.length > 0)
                result.clients += await store.deleteUnusedClients(
                    doomed,
                    window,
                );
            if (ids.length < CLIENT_PAGE_SIZE) break;
            // Paged by id, not by offset: deleting rows shifts offsets, and
            // kept clients would otherwise be listed again every page.
            afterId = ids[ids.length - 1]!;
        }
    } catch (err) {
        console.warn(
            `[oauth] cleanup failed table=oauth_clients: ${(err as Error).message}`,
        );
    }

    // Counts only — never a token, code, client id or user id.
    if (result.tokens + result.refreshTokens + result.codes + result.clients) {
        console.log(
            `[oauth] cleanup tokens=${result.tokens} refresh_tokens=${result.refreshTokens} codes=${result.codes} clients=${result.clients} clients_kept=${result.clientsKept}`,
        );
    }
    return result;
}

// How many days of Apple Health sync's sent-values record are kept: rows
// dated before today (UTC) minus this many days go. The privacy policy and
// /tools say 8 days.
export const HEALTH_SYNC_DAYS_KEPT = HEALTH_SYNC_RETENTION_DAYS;

export interface HealthSyncSweepResult {
    pending: number;
    links: number;
    days: number;
}

// Apple Health sync's three tables, on the same hourly tick: lapsed pending
// connects (30 minutes, or 10 more once a claim code is minted), links past
// their sliding 90-day expiry or 365 days old, and sent-values rows past the
// 8-day record. Each table on its own, like the OAuth tables above.
export async function sweepHealthSync(
    store: HealthSyncCleanupStore = supabaseHealthSyncCleanupStore,
    now: number = Date.now(),
): Promise<HealthSyncSweepResult> {
    const result: HealthSyncSweepResult = { pending: 0, links: 0, days: 0 };
    const nowIso = new Date(now).toISOString();
    // The calendar date in UTC, as the database's current_date reads it.
    const beforeDate = new Date(
        now - HEALTH_SYNC_DAYS_KEPT * 24 * 60 * 60 * 1000,
    )
        .toISOString()
        .slice(0, 10);
    const steps = [
        [
            "health_sync_pending",
            "pending",
            () => store.deleteExpiredPending(nowIso),
        ],
        [
            "health_sync_links",
            "links",
            () =>
                store.deleteExpiredLinks(
                    nowIso,
                    new Date(now - HEALTH_SYNC_LINK_MAX_AGE_MS).toISOString(),
                ),
        ],
        ["health_sync_days", "days", () => store.deleteDaysBefore(beforeDate)],
    ] as const;
    for (const [table, key, run] of steps) {
        try {
            result[key] = await run();
        } catch (err) {
            console.warn(
                `[health-sync] cleanup failed table=${table}: ${(err as Error).message}`,
            );
        }
    }
    // Counts only.
    if (result.pending + result.links + result.days) {
        console.log(
            `[health-sync] cleanup pending=${result.pending} links=${result.links} days=${result.days}`,
        );
    }
    return result;
}

let sweepRunning = false;

/**
 * Start the hourly OAuth and Apple Health sync cleanup sweep. Call once at
 * server startup.
 */
export function startOAuthCleanup(): void {
    const tick = () => {
        if (sweepRunning) return;
        sweepRunning = true;
        sweepOAuth()
            .catch((err) =>
                console.warn(
                    `[oauth] cleanup failed: ${(err as Error).message}`,
                ),
            )
            // Runs whatever happened above: one sweep failing must not keep
            // the other's rows past what the privacy policy promises.
            .then(() => sweepHealthSync())
            .catch((err) =>
                console.warn(
                    `[health-sync] cleanup failed: ${(err as Error).message}`,
                ),
            )
            .finally(() => {
                sweepRunning = false;
            });
    };
    // Once at boot too: every deploy restarts the process and the interval
    // with it, and the privacy policy promises expired tokens and codes are
    // gone "within an hour".
    tick();
    setInterval(tick, SWEEP_INTERVAL_MS);
}
