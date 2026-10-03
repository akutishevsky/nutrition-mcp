import { test, expect, describe, spyOn } from "bun:test";
import {
    CLIENT_SWEEP_FLOOR_ISO,
    HEALTH_SYNC_DAYS_KEPT,
    sweepHealthSync,
    UNUSED_CLIENT_MAX_AGE_MS,
    deletableClients,
    sweepOAuth,
    type ClientSweepWindow,
    type OAuthCleanupStore,
} from "./oauth-cleanup.js";
import {
    HEALTH_SYNC_LINK_MAX_AGE_MS,
    type HealthSyncCleanupStore,
} from "./health-sync-store.js";

// In-memory stand-in for the four queries in src/supabase.ts, applying the
// same filters they do. Injected, never mock.module (see CLAUDE.md).
interface FakeClient {
    id: string;
    createdAt: number;
    lastUsedAt: number | null;
}

function fakeCleanupStore(init: {
    clients: FakeClient[];
    // refresh_tokens.client_id / auth_codes.client_id of each live row. A
    // refresh token issued before Phase B has client_id null.
    refreshClients?: (string | null)[];
    codeClients?: string[];
    expired?: {
        oauth_tokens?: number;
        refresh_tokens?: number;
        auth_codes?: number;
    };
}) {
    const clients = new Map(init.clients.map((c) => [c.id, c]));
    const expired = {
        oauth_tokens: 0,
        refresh_tokens: 0,
        auth_codes: 0,
        ...init.expired,
    };
    const calls = { listed: 0, deleteBatches: [] as string[][] };
    const store: OAuthCleanupStore = {
        async deleteExpired(table) {
            const n = expired[table];
            expired[table] = 0;
            return n;
        },
        async listUnusedClients(window, afterId, limit) {
            calls.listed++;
            return [...clients.values()]
                .filter(
                    (c) =>
                        c.lastUsedAt === null &&
                        inWindow(c, window) &&
                        (afterId === null || c.id > afterId),
                )
                .map((c) => c.id)
                .sort()
                .slice(0, limit);
        },
        async clientsWithGrants(ids) {
            // `client_id in (…)`: a null client_id matches nothing.
            const named = new Set([
                ...(init.refreshClients ?? []),
                ...(init.codeClients ?? []),
            ]);
            return new Set(ids.filter((id) => named.has(id)));
        },
        async deleteUnusedClients(ids, window) {
            calls.deleteBatches.push(ids);
            let n = 0;
            for (const id of ids) {
                const c = clients.get(id);
                if (c && c.lastUsedAt === null && inWindow(c, window)) {
                    clients.delete(id);
                    n++;
                }
            }
            return n;
        },
    };
    return { store, clients, calls };
}

function inWindow(c: FakeClient, window: ClientSweepWindow): boolean {
    return (
        c.createdAt >= Date.parse(window.createdAtOrAfterIso) &&
        c.createdAt < Date.parse(window.createdBeforeIso)
    );
}

// Well past the floor, so an 8-day-old client is a post-Phase-B one.
const NOW = Date.parse("2026-10-20T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const old = (id: string, lastUsedAt: number | null = null): FakeClient => ({
    id,
    createdAt: NOW - 8 * DAY,
    lastUsedAt,
});

test("the unused-client window is seven days", () => {
    expect(UNUSED_CLIENT_MAX_AGE_MS).toBe(7 * DAY);
});

test("deletableClients drops every client a grant still names", () => {
    expect(deletableClients(["a", "b", "c"], new Set(["b"]))).toEqual([
        "a",
        "c",
    ]);
    expect(deletableClients([], new Set(["b"]))).toEqual([]);
});

describe("sweepOAuth", () => {
    test("deletes expired rows in all three tables and reports counts only", async () => {
        const { store } = fakeCleanupStore({
            clients: [],
            expired: { oauth_tokens: 3, refresh_tokens: 2, auth_codes: 1 },
        });
        const log = spyOn(console, "log").mockImplementation(() => {});
        try {
            const r = await sweepOAuth(store, NOW);
            expect(r).toEqual({
                tokens: 3,
                refreshTokens: 2,
                codes: 1,
                clients: 0,
                clientsKept: 0,
            });
            expect(log.mock.calls.map((c) => String(c[0]))).toEqual([
                "[oauth] cleanup tokens=3 refresh_tokens=2 codes=1 clients=0 clients_kept=0",
            ]);
        } finally {
            log.mockRestore();
        }
    });

    test("deletes only old, never-used clients no refresh token or code names", async () => {
        const { store, clients } = fakeCleanupStore({
            clients: [
                old("stale"),
                // Its last_used_at stamp failed, but it holds a refresh token.
                old("with-refresh"),
                old("mid-authorization"),
                old("used", NOW - DAY),
                { id: "young", createdAt: NOW - 6 * DAY, lastUsedAt: null },
            ],
            refreshClients: ["with-refresh"],
            codeClients: ["mid-authorization"],
        });
        const log = spyOn(console, "log").mockImplementation(() => {});
        try {
            const r = await sweepOAuth(store, NOW);
            expect(r.clients).toBe(1);
            expect(r.clientsKept).toBe(2);
            expect([...clients.keys()].sort()).toEqual([
                "mid-authorization",
                "used",
                "with-refresh",
                "young",
            ]);
        } finally {
            log.mockRestore();
        }
    });

    test("keeps a client registered between the Phase A and B deploys, whose refresh token has no client_id", async () => {
        // Phase A never stamped last_used_at and refresh_tokens.client_id
        // didn't exist yet, so nothing names this client — yet deleting it
        // turns its user's next refresh into invalid_client, a logout.
        const preB = Date.parse("2026-09-26T12:30:00Z");
        const floor = Date.parse(CLIENT_SWEEP_FLOOR_ISO);
        expect(preB).toBeLessThan(floor);
        const { store, clients } = fakeCleanupStore({
            clients: [
                { id: "pre-b", createdAt: preB, lastUsedAt: null },
                { id: "at-floor", createdAt: floor, lastUsedAt: null },
            ],
            refreshClients: [null],
        });
        const log = spyOn(console, "log").mockImplementation(() => {});
        try {
            const r = await sweepOAuth(store, NOW);
            expect(clients.has("pre-b")).toBe(true);
            expect(clients.has("at-floor")).toBe(false);
            expect(r.clients).toBe(1);
        } finally {
            log.mockRestore();
        }
    });

    test("deletes no client when the grant check fails", async () => {
        const { store, clients, calls } = fakeCleanupStore({
            clients: [old("stale")],
        });
        store.clientsWithGrants = async () => {
            throw new Error("returned 1000 of 1200 rows");
        };
        const warn = spyOn(console, "warn").mockImplementation(() => {});
        try {
            const r = await sweepOAuth(store, NOW);
            expect(r.clients).toBe(0);
            expect(clients.has("stale")).toBe(true);
            expect(calls.deleteBatches).toEqual([]);
            expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([
                "[oauth] cleanup failed table=oauth_clients: returned 1000 of 1200 rows",
            ]);
        } finally {
            warn.mockRestore();
        }
    });

    test("the floor is past the later Phase B deploy (#157, 2026-09-26 13:15Z)", () => {
        expect(Date.parse(CLIENT_SWEEP_FLOOR_ISO)).toBeGreaterThan(
            Date.parse("2026-09-26T13:15:20Z"),
        );
    });

    test("pages past a full page of kept clients instead of stalling on it", async () => {
        const kept = Array.from({ length: 100 }, (_, i) =>
            old(`a-${String(i).padStart(3, "0")}`),
        );
        const { store, clients, calls } = fakeCleanupStore({
            clients: [...kept, old("z-stale")],
            refreshClients: kept.map((c) => c.id),
        });
        const log = spyOn(console, "log").mockImplementation(() => {});
        try {
            const r = await sweepOAuth(store, NOW);
            expect(r.clients).toBe(1);
            expect(r.clientsKept).toBe(100);
            expect(clients.has("z-stale")).toBe(false);
            expect(calls.listed).toBe(2);
            expect(calls.deleteBatches).toEqual([["z-stale"]]);
        } finally {
            log.mockRestore();
        }
    });

    test("one failing table doesn't stop the rest, and nothing is logged when nothing went", async () => {
        const { store } = fakeCleanupStore({
            clients: [],
            expired: { auth_codes: 0 },
        });
        store.deleteExpired = async (table) => {
            if (table === "oauth_tokens") throw new Error("boom");
            return 0;
        };
        const warn = spyOn(console, "warn").mockImplementation(() => {});
        const log = spyOn(console, "log").mockImplementation(() => {});
        try {
            const r = await sweepOAuth(store, NOW);
            expect(r.tokens).toBe(0);
            expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([
                "[oauth] cleanup failed table=oauth_tokens: boom",
            ]);
            expect(log).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
            log.mockRestore();
        }
    });
});

// ---------- Apple Health sync ----------

interface FakePending {
    id: string;
    expiresAt: number;
    claimExpiresAt: number | null;
}
interface FakeLink {
    id: string;
    createdAt: number;
    expiresAt: number;
}

// In-memory stand-in for supabaseHealthSyncCleanupStore, applying the same
// filters its three deletes do.
function fakeHealthSyncStore(init: {
    pending?: FakePending[];
    links?: FakeLink[];
    days?: string[];
}) {
    let pending = [...(init.pending ?? [])];
    let links = [...(init.links ?? [])];
    let days = [...(init.days ?? [])];
    const args: Record<string, string[]> = {};
    const store: HealthSyncCleanupStore = {
        async deleteExpiredPending(nowIso) {
            args.pending = [nowIso];
            const now = Date.parse(nowIso);
            const before = pending.length;
            pending = pending.filter((p) =>
                p.claimExpiresAt === null
                    ? p.expiresAt >= now
                    : p.claimExpiresAt >= now,
            );
            return before - pending.length;
        },
        async deleteExpiredLinks(nowIso, createdBeforeIso) {
            args.links = [nowIso, createdBeforeIso];
            const now = Date.parse(nowIso);
            const floor = Date.parse(createdBeforeIso);
            const before = links.length;
            links = links.filter(
                (l) => l.expiresAt >= now && l.createdAt >= floor,
            );
            return before - links.length;
        },
        async deleteDaysBefore(beforeDate) {
            args.days = [beforeDate];
            const before = days.length;
            days = days.filter((d) => d >= beforeDate);
            return before - days.length;
        },
    };
    return {
        store,
        args,
        left: () => ({
            pending: pending.map((p) => p.id),
            links: links.map((l) => l.id),
            days,
        }),
    };
}

describe("sweepHealthSync", () => {
    const MIN = 60 * 1000;

    test("the sent-values record is kept for 8 days and links for at most 365", () => {
        expect(HEALTH_SYNC_DAYS_KEPT).toBe(8);
        expect(HEALTH_SYNC_LINK_MAX_AGE_MS).toBe(365 * DAY);
    });

    test("drops lapsed pending connects, by claim expiry once claimed", async () => {
        const { store, left } = fakeHealthSyncStore({
            pending: [
                { id: "lapsed", expiresAt: NOW - MIN, claimExpiresAt: null },
                { id: "open", expiresAt: NOW + MIN, claimExpiresAt: null },
                // Claimed at minute 25: its claim outlives expires_at.
                {
                    id: "claimed-live",
                    expiresAt: NOW - MIN,
                    claimExpiresAt: NOW + 5 * MIN,
                },
                {
                    id: "claimed-lapsed",
                    expiresAt: NOW + MIN,
                    claimExpiresAt: NOW - MIN,
                },
            ],
        });
        const log = spyOn(console, "log").mockImplementation(() => {});
        try {
            const r = await sweepHealthSync(store, NOW);
            expect(r.pending).toBe(2);
            expect(left().pending).toEqual(["open", "claimed-live"]);
        } finally {
            log.mockRestore();
        }
    });

    test("drops links past their sliding expiry or 365 days old", async () => {
        const { store, args, left } = fakeHealthSyncStore({
            links: [
                { id: "live", createdAt: NOW - DAY, expiresAt: NOW + DAY },
                { id: "idle", createdAt: NOW - DAY, expiresAt: NOW - 1 },
                {
                    id: "too-old",
                    createdAt: NOW - 366 * DAY,
                    expiresAt: NOW + DAY,
                },
            ],
        });
        const log = spyOn(console, "log").mockImplementation(() => {});
        try {
            const r = await sweepHealthSync(store, NOW);
            expect(r.links).toBe(2);
            expect(left().links).toEqual(["live"]);
            expect(args.links).toEqual([
                new Date(NOW).toISOString(),
                new Date(NOW - 365 * DAY).toISOString(),
            ]);
        } finally {
            log.mockRestore();
        }
    });

    test("keeps sent-values rows from today minus 8 days on", async () => {
        // NOW is 2026-10-20 (UTC): 2026-10-12 is the oldest date kept.
        const { store, args, left } = fakeHealthSyncStore({
            days: ["2026-10-11", "2026-10-12", "2026-10-19"],
        });
        const log = spyOn(console, "log").mockImplementation(() => {});
        try {
            const r = await sweepHealthSync(store, NOW);
            expect(args.days).toEqual(["2026-10-12"]);
            expect(r.days).toBe(1);
            expect(left().days).toEqual(["2026-10-12", "2026-10-19"]);
            expect(log.mock.calls.map((c) => String(c[0]))).toEqual([
                "[health-sync] cleanup pending=0 links=0 days=1",
            ]);
        } finally {
            log.mockRestore();
        }
    });

    test("one failing table doesn't stop the rest, and nothing is logged when nothing went", async () => {
        const { store } = fakeHealthSyncStore({});
        store.deleteExpiredPending = async () => {
            throw new Error("boom");
        };
        const warn = spyOn(console, "warn").mockImplementation(() => {});
        const log = spyOn(console, "log").mockImplementation(() => {});
        try {
            const r = await sweepHealthSync(store, NOW);
            expect(r).toEqual({ pending: 0, links: 0, days: 0 });
            expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([
                "[health-sync] cleanup failed table=health_sync_pending: boom",
            ]);
            expect(log).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
            log.mockRestore();
        }
    });
});
