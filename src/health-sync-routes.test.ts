import { test, expect, describe, beforeEach, afterEach, spyOn } from "bun:test";
import { Hono } from "hono";
import {
    accessLogPath,
    configuredSite,
    createHealthSyncRouter,
    isHealthSyncPath,
    localeFromAcceptLanguage,
    shortcutRunUrl,
    type HealthSyncData,
} from "./health-sync-routes.js";
import type {
    HealthSyncDayRow,
    HealthSyncLinkRow,
    HealthSyncPendingRow,
    HealthSyncStore,
} from "./health-sync-store.js";
import type { AuthCodeData } from "./oauth-store.js";
import { HEALTH_SYNC_CLIENT_ID } from "./oauth-store.js";
import type { HealthSyncMeal, HealthSyncWater } from "./health-sync.js";
import { HEALTH_SYNC_SHORTCUT_NAME } from "./health-sync.js";
import { _resetBuckets, getBanState } from "./rate-limit.js";
import { authenticateBearer, banRepeatAuthFailures } from "./middleware.js";

// Everything runs against in-memory fakes passed to createHealthSyncRouter —
// never mock.module, which is process-wide (see CLAUDE.md). The fakes keep
// the store's contract (secrets in raw, matched exactly; consumes single-use)
// without its hashing, which src/health-sync-store.test.ts pins on its own.

const NOW = Date.parse("2026-10-03T12:00:00Z"); // 15:00 in Kyiv
const KYIV = "Europe/Kyiv";
const BASE = "http://x";
const USER = "11111111-2222-3333-4444-555555555555";

interface PendingRec {
    row: HealthSyncPendingRow;
    connectId: string;
    deviceSecret: string;
    claimCode: string | null;
}

function fakeStore() {
    const pending: PendingRec[] = [];
    const links = new Map<string, { row: HealthSyncLinkRow; token: string }>();
    const days = new Map<string, HealthSyncDayRow>();
    const calls: string[] = [];
    const fail = new Set<string>();
    let lookupState: "normal" | "unavailable" = "normal";
    const maybeFail = (name: string) => {
        calls.push(name);
        if (fail.has(name)) throw new Error(`${name} failed`);
    };
    const live = (rec: PendingRec, now: Date) =>
        rec.row.claim_expires_at !== null
            ? Date.parse(rec.row.claim_expires_at) > now.getTime()
            : Date.parse(rec.row.expires_at) > now.getTime();

    const store: HealthSyncStore = {
        async createPending(input) {
            maybeFail("createPending");
            pending.push({
                connectId: input.connectId,
                deviceSecret: input.deviceSecret,
                claimCode: null,
                row: {
                    id: crypto.randomUUID(),
                    fields: input.fields,
                    tz: input.tz,
                    backfill_days: input.backfillDays,
                    pkce_verifier: input.pkceVerifier,
                    user_id: null,
                    claim_expires_at: null,
                    created_at: new Date(NOW).toISOString(),
                    expires_at: input.expiresAt,
                },
            });
        },
        async getPendingByConnectId(connectId, now) {
            maybeFail("getPendingByConnectId");
            const rec = pending.find((p) => p.connectId === connectId);
            if (!rec) return null;
            const at = now ?? new Date();
            return Date.parse(rec.row.expires_at) > at.getTime()
                ? { ...rec.row }
                : null;
        },
        async setPendingClaim(connectId, claimCode, userId, until, now) {
            maybeFail("setPendingClaim");
            const rec = pending.find((p) => p.connectId === connectId);
            const at = now ?? new Date();
            if (
                !rec ||
                rec.claimCode !== null ||
                Date.parse(rec.row.expires_at) <= at.getTime()
            )
                return false;
            rec.claimCode = claimCode;
            rec.row.user_id = userId;
            rec.row.claim_expires_at = until;
            rec.row.pkce_verifier = null;
            return true;
        },
        async consumeClaim(claimCode, deviceSecret, now) {
            maybeFail("consumeClaim");
            const at = now ?? new Date();
            const i = pending.findIndex(
                (p) =>
                    p.claimCode === claimCode &&
                    p.deviceSecret === deviceSecret &&
                    live(p, at),
            );
            if (i < 0) return null;
            const [rec] = pending.splice(i, 1);
            return rec!.row;
        },
        async replaceLink(userId, link, token) {
            maybeFail("replaceLink");
            links.set(userId, {
                token,
                row: {
                    id: crypto.randomUUID(),
                    user_id: userId,
                    kind: "shortcut",
                    fields: link.fields,
                    fallback_tz: link.fallbackTz,
                    sync_start_date: link.syncStartDate,
                    lease_until: null,
                    created_at: new Date(NOW).toISOString(),
                    last_used_at: null,
                    last_sync_at: null,
                    expires_at: link.expiresAt,
                },
            });
        },
        async lookupLink(token, now) {
            calls.push("lookupLink");
            if (lookupState === "unavailable") return { status: "unavailable" };
            const at = now ?? new Date();
            for (const l of links.values()) {
                if (
                    l.token === token &&
                    Date.parse(l.row.expires_at) > at.getTime()
                )
                    return { status: "valid", link: { ...l.row } };
            }
            return { status: "invalid" };
        },
        async touchLink(userId, lastUsedAt, expiresAt) {
            maybeFail("touchLink");
            const l = links.get(userId);
            if (l) {
                l.row.last_used_at = lastUsedAt;
                l.row.expires_at = expiresAt;
            }
        },
        async setLastSync(userId, at) {
            maybeFail("setLastSync");
            const l = links.get(userId);
            if (l) l.row.last_sync_at = at;
        },
        async acquireLease(userId, until, now) {
            maybeFail("acquireLease");
            const l = links.get(userId);
            const at = now ?? new Date();
            if (!l) return false;
            if (
                l.row.lease_until !== null &&
                Date.parse(l.row.lease_until) >= at.getTime()
            )
                return false;
            l.row.lease_until = until;
            return true;
        },
        async releaseLease(userId, heldUntil) {
            maybeFail("releaseLease");
            const l = links.get(userId);
            if (!l) return;
            if (heldUntil !== undefined && l.row.lease_until !== heldUntil)
                return;
            l.row.lease_until = null;
        },
        async getDays(userId, from, to) {
            maybeFail("getDays");
            return [...days.values()]
                .filter(
                    (d) =>
                        d.user_id === userId && d.date >= from && d.date <= to,
                )
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((d) => structuredClone(d));
        },
        async insertDays(rows) {
            maybeFail("insertDays");
            const inserted: string[] = [];
            for (const r of rows) {
                const k = `${r.user_id}|${r.date}`;
                if (days.has(k)) continue;
                days.set(k, structuredClone(r));
                inserted.push(r.date);
            }
            return inserted;
        },
        async updateDay(userId, date, patch, expect) {
            maybeFail("updateDay");
            const d = days.get(`${userId}|${date}`);
            if (
                !d ||
                d.topup_seq !== expect.topup_seq ||
                (d.sent_values === null) !== expect.sentNull
            )
                return false;
            Object.assign(d, structuredClone(patch));
            return true;
        },
        async deleteLink(userId) {
            maybeFail("deleteLink");
            links.delete(userId);
            for (const [k, d] of days) if (d.user_id === userId) days.delete(k);
        },
        async getLinkStatus() {
            return null;
        },
        async getDaysForExport() {
            return [];
        },
    };
    return {
        store,
        pending,
        links,
        days,
        calls,
        fail,
        setLookup(s: "normal" | "unavailable") {
            lookupState = s;
        },
    };
}

function fakeOAuth() {
    const codes = new Map<string, AuthCodeData>();
    const consumed: string[] = [];
    return {
        codes,
        consumed,
        oauthStore: {
            async consumeAuthCode(code: string) {
                consumed.push(code);
                const d = codes.get(code) ?? null;
                codes.delete(code);
                return d;
            },
        },
    };
}

function fakeData(
    opts: {
        tz?: string | null;
        meals?: Partial<HealthSyncMeal>[];
        water?: HealthSyncWater[];
    } = {},
) {
    const fail = new Set<string>();
    const reads: string[] = [];
    const data: HealthSyncData = {
        async getProfileTimezone() {
            reads.push("profile");
            if (fail.has("profile")) throw new Error("profile down");
            return opts.tz === undefined ? KYIV : opts.tz;
        },
        async getMeals() {
            reads.push("meals");
            if (fail.has("meals"))
                throw new Error("meals: result would be truncated (1 of 2)");
            return (opts.meals ?? []) as HealthSyncMeal[];
        },
        async getWater() {
            reads.push("water");
            if (fail.has("water")) throw new Error("water down");
            return opts.water ?? [];
        },
    };
    return { data, fail, reads };
}

function setup(dataOpts: Parameters<typeof fakeData>[0] = {}) {
    const s = fakeStore();
    const o = fakeOAuth();
    const d = fakeData(dataOpts);
    let clock = NOW;
    const router = createHealthSyncRouter({
        store: s.store,
        oauthStore: o.oauthStore,
        data: d.data,
        now: () => clock,
        site: BASE,
    });
    const app = new Hono();
    app.route("/", router);
    app.onError((err, c) => {
        // Nothing may fall through to the app's error handler.
        throw new Error(`reached onError: ${err.message}`);
        return c.text("x", 500);
    });
    const req = (
        path: string,
        init: {
            method?: string;
            body?: unknown;
            token?: string;
            ip?: string;
            headers?: Record<string, string>;
        } = {},
    ) =>
        app.request(`${BASE}${path}`, {
            method: init.method ?? "GET",
            headers: {
                "x-forwarded-for": init.ip ?? "203.0.113.7",
                ...(init.body !== undefined
                    ? { "content-type": "application/json" }
                    : {}),
                ...(init.token
                    ? { Authorization: `Bearer ${init.token}` }
                    : {}),
                ...init.headers,
            },
            ...(init.body !== undefined
                ? {
                      body:
                          typeof init.body === "string"
                              ? init.body
                              : JSON.stringify(init.body),
                  }
                : {}),
        });
    return {
        ...s,
        ...o,
        dataFail: d.fail,
        reads: d.reads,
        req,
        setClock: (t: number) => {
            clock = t;
        },
    };
}

type Ctx = ReturnType<typeof setup>;

/** Seed a link directly, as /claim would have written it. */
function seedLink(
    ctx: Ctx,
    over: Partial<HealthSyncLinkRow> = {},
    token = `nmhs_${"a".repeat(43)}`,
) {
    ctx.links.set(USER, {
        token,
        row: {
            id: "link-1",
            user_id: USER,
            kind: "shortcut",
            fields: [
                "energy_kcal",
                "protein_g",
                "carbohydrates_g",
                "fat_g",
                "fiber_g",
                "sugar_g",
                "caffeine_mg",
            ],
            fallback_tz: null,
            sync_start_date: "2026-09-25",
            lease_until: null,
            created_at: "2026-09-25T10:00:00.000Z",
            last_used_at: null,
            last_sync_at: null,
            expires_at: "2026-12-25T10:00:00.000Z",
            ...over,
        },
    });
    return token;
}

/** A day row as /pending leaves it once it has offered the initial entry. */
function offeredRow(date: string): HealthSyncDayRow {
    return {
        user_id: USER,
        date,
        timezone: KYIV,
        sent_values: null,
        topup_seq: 0,
        offer_count: 1,
        notified: {},
        first_sent_at: null,
        last_sent_at: null,
    };
}

/** Runs /start and /connect, and returns what the browser would carry. */
async function startAndConnect(
    ctx: Ctx,
    body: unknown = { tz: KYIV, backfill_days: 0 },
) {
    const start = await ctx.req("/api/v1/health-sync/start", {
        method: "POST",
        body,
    });
    expect(start.status).toBe(200);
    const s = (await start.json()) as {
        connect_url: string;
        device_secret: string;
    };
    const connectPath = new URL(s.connect_url).pathname;
    const connectId = connectPath.split("/").pop()!;
    const r = await ctx.req(connectPath);
    expect(r.status).toBe(302);
    const loc = new URL(r.headers.get("location")!, BASE);
    return {
        deviceSecret: s.device_secret,
        connectId,
        challenge: loc.searchParams.get("code_challenge")!,
        location: loc,
    };
}

/** Mints the code /authorize would have issued to the health-sync client. */
function issueCode(
    ctx: Ctx,
    challenge: string,
    over: Partial<AuthCodeData> = {},
): string {
    const code = `code-${crypto.randomUUID()}`;
    ctx.codes.set(code, {
        code: "hashed",
        redirect_uri: `${BASE}/health-sync/callback`,
        user_id: USER,
        code_challenge: challenge,
        client_id: HEALTH_SYNC_CLIENT_ID,
        resource: null,
        ...over,
    });
    return code;
}

async function pairToClaimCode(ctx: Ctx, body?: unknown) {
    const c = await startAndConnect(ctx, body);
    const code = issueCode(ctx, c.challenge);
    const r = await ctx.req(
        `/health-sync/callback?code=${code}&state=${c.connectId}&iss=${encodeURIComponent(BASE)}`,
    );
    expect(r.status).toBe(200);
    const html = await r.text();
    const m = /shortcuts:\/\/run-shortcut\?[^"]*text=([A-Za-z0-9_-]+)/.exec(
        html,
    );
    return { ...c, claimCode: m![1]!, html, res: r };
}

let logSpy: ReturnType<typeof spyOn>;
let warnSpy: ReturnType<typeof spyOn>;
const lines = () =>
    [...logSpy.mock.calls, ...warnSpy.mock.calls]
        .map((args) => args.map(String).join(" "))
        .filter((l) => l.startsWith("[health-sync]"));

beforeEach(() => {
    _resetBuckets();
    logSpy = spyOn(console, "log").mockImplementation(() => {});
    warnSpy = spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    _resetBuckets();
});

describe("helpers", () => {
    test("isHealthSyncPath covers the API and the two pages only", () => {
        expect(isHealthSyncPath("/api/v1/health-sync/pending")).toBe(true);
        expect(isHealthSyncPath("/health-sync/connect/abc")).toBe(true);
        expect(isHealthSyncPath("/health-sync/callback")).toBe(true);
        expect(isHealthSyncPath("/health-syncx")).toBe(false);
        expect(isHealthSyncPath("/api/v1/health-syncx")).toBe(false);
        expect(isHealthSyncPath("/mcp")).toBe(false);
        expect(isHealthSyncPath("/authorize")).toBe(false);
    });

    test("localeFromAcceptLanguage picks the best supported base language", () => {
        expect(localeFromAcceptLanguage(undefined)).toBe("en");
        expect(localeFromAcceptLanguage("de-DE,de;q=0.9,en;q=0.8")).toBe("de");
        expect(localeFromAcceptLanguage("ru-RU,uk;q=0.8,en;q=0.5")).toBe("uk");
        expect(localeFromAcceptLanguage("en;q=0.4,ja;q=0.9")).toBe("ja");
        expect(localeFromAcceptLanguage("pt-BR,ru;q=0.9")).toBe("en");
        expect(localeFromAcceptLanguage("fr;q=0")).toBe("en");
    });

    test("accessLogPath hides a connect link's id and nothing else", () => {
        expect(accessLogPath(`/health-sync/connect/${"k".repeat(43)}`)).toBe(
            "/health-sync/connect/:id",
        );
        expect(accessLogPath("/health-sync/callback")).toBe(
            "/health-sync/callback",
        );
        expect(accessLogPath("/mcp")).toBe("/mcp");
    });

    test("configuredSite is SITE unless a bare http(s) origin is configured", () => {
        expect(configuredSite(undefined)).toBe("https://nutrition-mcp.com");
        expect(configuredSite("")).toBe("https://nutrition-mcp.com");
        expect(configuredSite("https://dev.example.com/")).toBe(
            "https://dev.example.com",
        );
        expect(configuredSite("http://localhost:3000")).toBe(
            "http://localhost:3000",
        );
        for (const bad of [
            "dev.example.com",
            "https://dev.example.com/path",
            "javascript:alert(1)",
            "ftp://x.example",
        ]) {
            expect(configuredSite(bad)).toBe("https://nutrition-mcp.com");
        }
    });

    test("shortcutRunUrl names the shortcut and passes the code as text", () => {
        const u = shortcutRunUrl("abc_DEF-123");
        expect(u).toBe(
            `shortcuts://run-shortcut?name=${encodeURIComponent(HEALTH_SYNC_SHORTCUT_NAME)}&input=text&text=abc_DEF-123`,
        );
        expect(u).toContain("name=Nutrition%20MCP%20Health");
    });
});

describe("POST /start", () => {
    test("creates a pending connection and returns the connect link once", async () => {
        const ctx = setup();
        const r = await ctx.req("/api/v1/health-sync/start", {
            method: "POST",
            body: {
                tz: "America/New_York",
                include_water: true,
                backfill_days: 3,
            },
        });
        expect(r.status).toBe(200);
        expect(r.headers.get("cache-control")).toBe("private, no-store");
        const body = (await r.json()) as Record<string, unknown>;
        expect(body.ok).toBe(true);
        expect(body.expires_in).toBe(1800);
        expect(String(body.connect_url)).toMatch(
            /^http:\/\/x\/health-sync\/connect\/[A-Za-z0-9_-]{43}$/,
        );
        expect(String(body.device_secret)).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(ctx.pending).toHaveLength(1);
        const p = ctx.pending[0]!;
        expect(p.row.tz).toBe("America/New_York");
        expect(p.row.backfill_days).toBe(3);
        expect(p.row.fields).toContain("water_ml");
        expect(p.row.user_id).toBeNull();
        expect(Date.parse(p.row.expires_at)).toBe(NOW + 30 * 60_000);
        expect(p.deviceSecret).toBe(String(body.device_secret));
    });

    test("an empty body takes the defaults: no water, no backfill", async () => {
        const ctx = setup();
        const r = await ctx.req("/api/v1/health-sync/start", {
            method: "POST",
        });
        expect(r.status).toBe(200);
        const p = ctx.pending[0]!;
        expect(p.row.fields).not.toContain("water_ml");
        expect(p.row.fields).not.toContain("alcohol_g");
        expect(p.row.backfill_days).toBe(0);
        expect(p.row.tz).toBeNull();
    });

    test("an unknown timezone is ignored, not refused", async () => {
        const ctx = setup();
        const r = await ctx.req("/api/v1/health-sync/start", {
            method: "POST",
            body: { tz: "Mars/Olympus" },
        });
        expect(r.status).toBe(200);
        expect(ctx.pending[0]!.row.tz).toBeNull();
    });

    test("bad bodies are a 400 bad_request in the envelope", async () => {
        const ctx = setup();
        for (const body of [
            { backfill_days: 8 },
            { backfill_days: -1 },
            { include_water: "yes" },
            "not json",
            [1, 2],
        ]) {
            const r = await ctx.req("/api/v1/health-sync/start", {
                method: "POST",
                body,
            });
            expect(r.status).toBe(400);
            const b = (await r.json()) as Record<string, unknown>;
            expect(b.ok).toBe(false);
            expect(b.error).toBe("bad_request");
            expect(typeof b.message).toBe("string");
            expect(b.ref).toBeUndefined();
        }
        expect(ctx.pending).toHaveLength(0);
    });

    test("a store failure is a 503 unavailable with a ref, not onError", async () => {
        const ctx = setup();
        ctx.fail.add("createPending");
        const r = await ctx.req("/api/v1/health-sync/start", {
            method: "POST",
            body: {},
        });
        expect(r.status).toBe(503);
        const b = (await r.json()) as Record<string, string>;
        expect(b.error).toBe("unavailable");
        expect(b.ref).toMatch(/^[0-9a-f]{8}$/);
        expect(b.message).toContain(b.ref!);
        expect(lines()).toEqual([
            expect.stringContaining(
                `[health-sync] route=start result=unavailable ref=${b.ref}`,
            ),
        ]);
    });

    test("a process-wide cap holds however the client IP is spoofed", async () => {
        const ctx = setup();
        for (let i = 0; i < 60; i++) {
            const r = await ctx.req("/api/v1/health-sync/start", {
                method: "POST",
                body: {},
                ip: `198.51.100.${i}`,
            });
            expect(r.status).toBe(200);
        }
        const r = await ctx.req("/api/v1/health-sync/start", {
            method: "POST",
            body: {},
            ip: "192.0.2.200",
        });
        expect(r.status).toBe(429);
        expect(Number(r.headers.get("retry-after"))).toBeGreaterThan(0);
        const b = (await r.json()) as Record<string, unknown>;
        expect(b).toMatchObject({ ok: false, error: "rate_limited" });
    });

    test("the per-IP auth limit applies too", async () => {
        const ctx = setup();
        let last: Response | null = null;
        for (let i = 0; i < 31; i++) {
            last = await ctx.req("/api/v1/health-sync/start", {
                method: "POST",
                body: {},
            });
        }
        expect(last!.status).toBe(429);
        expect(((await last!.json()) as { error: string }).error).toBe(
            "rate_limited",
        );
    });
});

describe("GET /health-sync/connect/:id", () => {
    test("redirects into /authorize as the health-sync client with S256 PKCE", async () => {
        const ctx = setup();
        const c = await startAndConnect(ctx);
        expect(c.location.pathname).toBe("/authorize");
        const q = c.location.searchParams;
        expect(q.get("response_type")).toBe("code");
        expect(q.get("client_id")).toBe(HEALTH_SYNC_CLIENT_ID);
        expect(q.get("redirect_uri")).toBe(`${BASE}/health-sync/callback`);
        expect(q.get("state")).toBe(c.connectId);
        expect(q.get("code_challenge_method")).toBe("S256");
        expect(q.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/);
        // The verifier never leaves the server.
        expect(c.location.toString()).not.toContain(
            ctx.pending[0]!.row.pkce_verifier!,
        );
        expect(q.has("locale")).toBe(false);
    });

    test("passes the phone's language on as ?locale", async () => {
        const ctx = setup();
        await ctx.req("/api/v1/health-sync/start", {
            method: "POST",
            body: {},
        });
        const id = ctx.pending[0]!.connectId;
        const r = await ctx.req(`/health-sync/connect/${id}`, {
            headers: { "accept-language": "de-DE,de;q=0.9" },
        });
        const loc = new URL(r.headers.get("location")!, BASE);
        expect(loc.searchParams.get("locale")).toBe("de");
    });

    test("follows a forwarded https base URL", async () => {
        const ctx = setup();
        await ctx.req("/api/v1/health-sync/start", {
            method: "POST",
            body: {},
        });
        const id = ctx.pending[0]!.connectId;
        const r = await ctx.req(`/health-sync/connect/${id}`, {
            headers: {
                "x-forwarded-proto": "https",
                "x-forwarded-host": "nutrition-mcp.com",
            },
        });
        const loc = new URL(r.headers.get("location")!, BASE);
        expect(loc.searchParams.get("redirect_uri")).toBe(
            "https://nutrition-mcp.com/health-sync/callback",
        );
    });

    test("an unknown, expired or used link gets a localized noindex page", async () => {
        const ctx = setup();
        const unknown = await ctx.req(
            `/health-sync/connect/${"z".repeat(43)}`,
            {
                headers: { "accept-language": "de" },
            },
        );
        expect(unknown.status).toBe(410);
        expect(unknown.headers.get("content-type")).toContain("text/html");
        expect(unknown.headers.get("x-robots-tag")).toBe("noindex, nofollow");
        const csp = unknown.headers.get("content-security-policy")!;
        expect(csp).toContain("default-src 'none'");
        expect(csp).not.toContain("googletagmanager");
        const html = await unknown.text();
        expect(html).toContain('<html lang="de"');
        expect(html).toContain('name="robots" content="noindex, nofollow"');
        expect(html).not.toContain("<script");

        const malformed = await ctx.req("/health-sync/connect/short");
        expect(malformed.status).toBe(404);

        // Expired.
        await ctx.req("/api/v1/health-sync/start", {
            method: "POST",
            body: {},
        });
        const id = ctx.pending[0]!.connectId;
        ctx.setClock(NOW + 31 * 60_000);
        expect((await ctx.req(`/health-sync/connect/${id}`)).status).toBe(410);
        expect(lines().every((l) => !l.includes(id))).toBe(true);
    });

    test("a link already through sign-in does not start another", async () => {
        const ctx = setup();
        const p = await pairToClaimCode(ctx);
        const r = await ctx.req(`/health-sync/connect/${p.connectId}`);
        expect(r.status).toBe(410);
    });
});

describe("GET /health-sync/callback", () => {
    test("mints a claim code that only appears inside the shortcuts:// URL", async () => {
        const ctx = setup();
        const p = await pairToClaimCode(ctx);
        expect(p.res.headers.get("cache-control")).toBe("no-store");
        expect(p.res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
        const href = shortcutRunUrl(p.claimCode).replace(/&/g, "&amp;");
        // Twice: the meta refresh and the button. Nowhere else.
        expect(p.html.split(p.claimCode).length - 1).toBe(2);
        expect(p.html).toContain(
            `<meta http-equiv="refresh" content="0;url=${href}">`,
        );
        expect(p.html).toContain(`<a class="btn" href="${href}">`);
        expect(p.html).not.toContain("<script");
        expect(p.html).not.toContain("googletagmanager");
        const rec = ctx.pending[0]!;
        expect(rec.claimCode).toBe(p.claimCode);
        expect(rec.row.user_id).toBe(USER);
        expect(rec.row.pkce_verifier).toBeNull();
        expect(Date.parse(rec.row.claim_expires_at!)).toBe(NOW + 10 * 60_000);
        // The log line names neither the code, the connect id nor the user.
        for (const l of lines()) {
            expect(l).not.toContain(p.claimCode);
            expect(l).not.toContain(p.connectId);
            expect(l).not.toContain(USER);
        }
        expect(lines()).toContain("[health-sync] route=callback result=ok");
    });

    test("the opening page is localized", async () => {
        const ctx = setup();
        const c = await startAndConnect(ctx);
        const code = issueCode(ctx, c.challenge);
        const r = await ctx.req(
            `/health-sync/callback?code=${code}&state=${c.connectId}`,
            { headers: { "accept-language": "ja" } },
        );
        expect(r.status).toBe(200);
        expect(await r.text()).toContain('<html lang="ja"');
    });

    const refusals: [string, (ctx: Ctx, challenge: string) => string][] = [
        [
            "a code issued to another client",
            (ctx, ch) => issueCode(ctx, ch, { client_id: "someone-else" }),
        ],
        [
            "a code for another redirect",
            (ctx, ch) =>
                issueCode(ctx, ch, {
                    redirect_uri: "https://evil.example/health-sync/callback",
                }),
        ],
        [
            "a code whose challenge is not this connection's verifier",
            (ctx) => issueCode(ctx, "A".repeat(43)),
        ],
        [
            "a code with no challenge",
            (ctx, ch) => issueCode(ctx, ch, { code_challenge: null }),
        ],
        ["an unknown code", () => "code-unknown"],
    ];
    for (const [name, mint] of refusals) {
        test(`refuses ${name}, leaving the connection unclaimed`, async () => {
            const ctx = setup();
            const c = await startAndConnect(ctx);
            const code = mint(ctx, c.challenge);
            const r = await ctx.req(
                `/health-sync/callback?code=${code}&state=${c.connectId}`,
            );
            expect(r.status).toBe(400);
            const html = await r.text();
            expect(html).not.toContain("shortcuts://");
            expect(ctx.consumed).toEqual([code]);
            expect(ctx.pending[0]!.claimCode).toBeNull();
            expect(ctx.calls).not.toContain("setPendingClaim");
            expect(lines()).toContain(
                "[health-sync] route=callback result=sign_in_failed",
            );
        });
    }

    test("refuses an error redirect, a missing code and a foreign iss without spending anything", async () => {
        const ctx = setup();
        const c = await startAndConnect(ctx);
        for (const q of [
            `error=access_denied&state=${c.connectId}`,
            `state=${c.connectId}`,
            `code=x&state=${c.connectId}&iss=${encodeURIComponent("https://evil.example")}`,
        ]) {
            const r = await ctx.req(`/health-sync/callback?${q}`);
            expect(r.status).toBe(400);
        }
        expect(ctx.consumed).toEqual([]);
    });

    test("an unknown or expired state is the expired page", async () => {
        const ctx = setup();
        const c = await startAndConnect(ctx);
        const code = issueCode(ctx, c.challenge);
        const r1 = await ctx.req(
            `/health-sync/callback?code=${code}&state=${"q".repeat(43)}`,
        );
        expect(r1.status).toBe(410);
        ctx.setClock(NOW + 31 * 60_000);
        const r2 = await ctx.req(
            `/health-sync/callback?code=${code}&state=${c.connectId}`,
        );
        expect(r2.status).toBe(410);
        // Neither looked at the code.
        expect(ctx.consumed).toEqual([]);
    });

    test("a second callback for the same connection is refused", async () => {
        const ctx = setup();
        const p = await pairToClaimCode(ctx);
        const code = issueCode(ctx, p.challenge);
        const r = await ctx.req(
            `/health-sync/callback?code=${code}&state=${p.connectId}`,
        );
        expect(r.status).toBe(410);
        expect(ctx.pending[0]!.claimCode).toBe(p.claimCode);
    });
});

describe("POST /claim", () => {
    test("needs both the claim code and the device secret, once", async () => {
        const ctx = setup();
        const p = await pairToClaimCode(ctx);

        // The claim code alone (an attacker's device secret) gets nothing,
        // and does not burn the victim's claim.
        const other = await ctx.req("/api/v1/health-sync/claim", {
            method: "POST",
            body: { claim_code: p.claimCode, device_secret: "b".repeat(43) },
        });
        expect(other.status).toBe(400);
        expect(await other.json()).toMatchObject({
            ok: false,
            error: "invalid_code",
        });
        // The device secret with a guessed code, likewise.
        const guess = await ctx.req("/api/v1/health-sync/claim", {
            method: "POST",
            body: { claim_code: "c".repeat(43), device_secret: p.deviceSecret },
        });
        expect(guess.status).toBe(400);

        const good = await ctx.req("/api/v1/health-sync/claim", {
            method: "POST",
            body: {
                claim_code: `${p.claimCode}\n`,
                device_secret: p.deviceSecret,
            },
        });
        expect(good.status).toBe(200);
        expect(good.headers.get("cache-control")).toBe("private, no-store");
        const b = (await good.json()) as {
            ok: boolean;
            token: string;
            site: string;
        };
        expect(b.ok).toBe(true);
        expect(b.token).toMatch(/^nmhs_[A-Za-z0-9_-]{43}$/);
        expect(b.site).toBe(BASE);
        expect(ctx.links.get(USER)!.token).toBe(b.token);

        const again = await ctx.req("/api/v1/health-sync/claim", {
            method: "POST",
            body: { claim_code: p.claimCode, device_secret: p.deviceSecret },
        });
        expect(again.status).toBe(400);
        expect(((await again.json()) as { error: string }).error).toBe(
            "invalid_code",
        );
        for (const l of lines()) {
            expect(l).not.toContain(b.token);
            expect(l).not.toContain(p.deviceSecret);
            expect(l).not.toContain(USER);
        }
    });

    test("writes the link: fields, phone zone, start date from the profile zone", async () => {
        const ctx = setup({ tz: "Asia/Tokyo" });
        const p = await pairToClaimCode(ctx, {
            tz: "America/New_York",
            include_water: true,
            backfill_days: 2,
        });
        await ctx.req("/api/v1/health-sync/claim", {
            method: "POST",
            body: { claim_code: p.claimCode, device_secret: p.deviceSecret },
        });
        const link = ctx.links.get(USER)!.row;
        expect(link.fields).toContain("water_ml");
        expect(link.fallback_tz).toBe("America/New_York");
        // 2026-10-03T12:00Z is Oct 3 in Tokyo; minus two days.
        expect(link.sync_start_date).toBe("2026-10-01");
        expect(Date.parse(link.expires_at)).toBe(NOW + 90 * 86_400_000);
    });

    test("without a profile zone the phone's zone sets the start date", async () => {
        const ctx = setup({ tz: null });
        const p = await pairToClaimCode(ctx, {
            tz: "Pacific/Kiritimati", // UTC+14: already Oct 4 there
            backfill_days: 0,
        });
        await ctx.req("/api/v1/health-sync/claim", {
            method: "POST",
            body: { claim_code: p.claimCode, device_secret: p.deviceSecret },
        });
        expect(ctx.links.get(USER)!.row.sync_start_date).toBe("2026-10-04");
    });

    test("pairing again replaces the old link, whose token stops working", async () => {
        const ctx = setup();
        const claim = async () => {
            const p = await pairToClaimCode(ctx);
            const r = await ctx.req("/api/v1/health-sync/claim", {
                method: "POST",
                body: {
                    claim_code: p.claimCode,
                    device_secret: p.deviceSecret,
                },
            });
            return ((await r.json()) as { token: string }).token;
        };
        const first = await claim();
        const second = await claim();
        expect(second).not.toBe(first);
        expect(ctx.links.size).toBe(1);
        const old = await ctx.req("/api/v1/health-sync/pending", {
            token: first,
        });
        expect(old.status).toBe(401);
        const cur = await ctx.req("/api/v1/health-sync/pending", {
            token: second,
        });
        expect(cur.status).toBe(200);
    });

    test("failed claims strike the IP, and a flood of them never shuts pairing off", async () => {
        const ctx = setup();
        // Paired up to the claim code first, then a flood of guesses from
        // rotated IPs lands before the shortcut redeems it.
        const p = await pairToClaimCode(ctx);
        const bad = (ip: string) =>
            ctx.req("/api/v1/health-sync/claim", {
                method: "POST",
                ip,
                body: {
                    claim_code: "c".repeat(43),
                    device_secret: "d".repeat(43),
                },
            });
        for (let i = 0; i < 40; i++) {
            expect((await bad(`198.51.100.${i}`)).status).toBe(400);
        }
        // Each guess is looked up and refused on its own merits...
        expect(ctx.calls.filter((c) => c === "consumeClaim")).toHaveLength(40);
        // ...and once over the process-wide count, flagged in the log.
        const claimLines = lines().filter((l) => l.includes("route=claim"));
        expect(claimLines.at(-1)).toBe(
            "[health-sync] route=claim result=invalid_code alert=claim_failures_high",
        );
        expect(claimLines[0]).toBe(
            "[health-sync] route=claim result=invalid_code",
        );
        // The real claim still goes through.
        const r = await ctx.req("/api/v1/health-sync/claim", {
            method: "POST",
            ip: "192.0.2.99",
            body: { claim_code: p.claimCode, device_secret: p.deviceSecret },
        });
        expect(r.status).toBe(200);
        expect(((await r.json()) as { ok: boolean }).ok).toBe(true);
    });

    test("names the configured site, never a forwarded host", async () => {
        const ctx = setup();
        const start = await ctx.req("/api/v1/health-sync/start", {
            method: "POST",
            body: {},
            headers: {
                "x-forwarded-proto": "https",
                "x-forwarded-host": "evil.example",
            },
        });
        const s = (await start.json()) as { connect_url: string };
        expect(s.connect_url).toStartWith(`${BASE}/health-sync/connect/`);
        const p = await pairToClaimCode(ctx);
        const r = await ctx.req("/api/v1/health-sync/claim", {
            method: "POST",
            body: { claim_code: p.claimCode, device_secret: p.deviceSecret },
            headers: {
                "x-forwarded-proto": "https",
                "x-forwarded-host": "evil.example",
            },
        });
        expect(((await r.json()) as { site: string }).site).toBe(BASE);
    });

    test("a malformed body is bad_request and no strike", async () => {
        const ctx = setup();
        const r = await ctx.req("/api/v1/health-sync/claim", {
            method: "POST",
            body: { claim_code: "x" },
        });
        expect(r.status).toBe(400);
        expect(((await r.json()) as { error: string }).error).toBe(
            "bad_request",
        );
        expect(ctx.calls).not.toContain("consumeClaim");
    });
});

describe("link-token auth", () => {
    test("a missing token is a 401 invalid_token with a realm challenge", async () => {
        const ctx = setup();
        const r = await ctx.req("/api/v1/health-sync/pending");
        expect(r.status).toBe(401);
        expect(r.headers.get("www-authenticate")).toBe(
            'Bearer realm="nutrition-mcp", error="invalid_token"',
        );
        const b = (await r.json()) as Record<string, string>;
        expect(b).toMatchObject({ ok: false, error: "invalid_token" });
        expect(b.message).toContain("Nutrition MCP Health");
    });

    test("an OAuth access token is refused here without a lookup", async () => {
        const ctx = setup();
        seedLink(ctx);
        // The shape newOpaqueToken() mints for /token.
        const oauthToken = "Q".repeat(43);
        const r = await ctx.req("/api/v1/health-sync/pending", {
            token: oauthToken,
        });
        expect(r.status).toBe(401);
        expect(ctx.calls).not.toContain("lookupLink");
    });

    test("an unknown nmhs_ token is looked up and refused", async () => {
        const ctx = setup();
        seedLink(ctx);
        const r = await ctx.req("/api/v1/health-sync/pending", {
            token: `nmhs_${"z".repeat(43)}`,
        });
        expect(r.status).toBe(401);
        expect(ctx.calls).toContain("lookupLink");
    });

    test("an expired link is refused", async () => {
        const ctx = setup();
        const token = seedLink(ctx, {
            expires_at: "2026-10-01T00:00:00.000Z",
        });
        const r = await ctx.req("/api/v1/health-sync/pending", { token });
        expect(r.status).toBe(401);
    });

    test("unavailable is a 503 with no strike, so an outage never bans", async () => {
        const ctx = setup();
        const token = seedLink(ctx);
        ctx.setLookup("unavailable");
        for (let i = 0; i < 25; i++) {
            const r = await ctx.req("/api/v1/health-sync/pending", { token });
            expect(r.status).toBe(503);
            const b = (await r.json()) as Record<string, string>;
            expect(b.error).toBe("unavailable");
            expect(b.ref).toMatch(/^[0-9a-f]{8}$/);
        }
        expect(getBanState("203.0.113.7").banned).toBe(false);
        ctx.setLookup("normal");
        expect(
            (await ctx.req("/api/v1/health-sync/pending", { token })).status,
        ).toBe(200);
    });

    test("invalid tokens strike, and a banned IP is shed in the envelope", async () => {
        const ctx = setup();
        for (let i = 0; i < 20; i++) {
            const r = await ctx.req("/api/v1/health-sync/pending", {
                token: `nmhs_${"y".repeat(43)}`,
            });
            expect(r.status).toBe(401);
        }
        expect(getBanState("203.0.113.7").banned).toBe(true);
        const lookups = ctx.calls.filter((c) => c === "lookupLink").length;
        const r = await ctx.req("/api/v1/health-sync/pending", {
            token: `nmhs_${"y".repeat(43)}`,
        });
        expect(r.status).toBe(429);
        expect(await r.json()).toMatchObject({
            ok: false,
            error: "rate_limited",
        });
        expect(ctx.calls.filter((c) => c === "lookupLink").length).toBe(
            lookups,
        );
    });

    test("last use is stamped at most once an hour", async () => {
        const ctx = setup();
        const token = seedLink(ctx);
        await ctx.req("/api/v1/health-sync/ack", {
            method: "POST",
            token,
            body: { entries: [], done: true },
        });
        await new Promise((r) => setTimeout(r, 0));
        expect(ctx.calls.filter((c) => c === "touchLink")).toHaveLength(1);
        const row = ctx.links.get(USER)!.row;
        expect(row.last_used_at).toBe(new Date(NOW).toISOString());
        expect(Date.parse(row.expires_at)).toBe(NOW + 90 * 86_400_000);
        ctx.setClock(NOW + 30 * 60_000);
        await ctx.req("/api/v1/health-sync/ack", {
            method: "POST",
            token,
            body: { entries: [], done: true },
        });
        await new Promise((r) => setTimeout(r, 0));
        expect(ctx.calls.filter((c) => c === "touchLink")).toHaveLength(1);
    });

    test("the per-user bucket is 40 a minute, answered in the envelope", async () => {
        const ctx = setup();
        const token = seedLink(ctx);
        for (let i = 0; i < 40; i++) {
            const r = await ctx.req("/api/v1/health-sync/ack", {
                method: "POST",
                token,
                body: { entries: [], done: true },
            });
            expect(r.status).toBe(200);
        }
        const r = await ctx.req("/api/v1/health-sync/pending", { token });
        expect(r.status).toBe(429);
        expect(r.headers.get("retry-after")).toBeTruthy();
        expect(await r.json()).toMatchObject({
            ok: false,
            error: "rate_limited",
        });
    });
});

describe("nmhs_ tokens at /mcp", () => {
    test("are refused by authenticateBearer without a database call", async () => {
        const app = new Hono();
        app.all("/mcp", banRepeatAuthFailures, authenticateBearer, (c) =>
            c.json({ reached: true }),
        );
        // supabase-js resolves the global fetch per call: any token lookup
        // would show up here.
        const realFetch = globalThis.fetch;
        let fetches = 0;
        globalThis.fetch = (async () => {
            fetches++;
            return new Response("[]", { status: 200 });
        }) as unknown as typeof fetch;
        try {
            const r = await app.request("http://x/mcp", {
                method: "POST",
                headers: {
                    Authorization: `Bearer nmhs_${"a".repeat(43)}`,
                    "x-forwarded-for": "203.0.113.50",
                },
            });
            expect(r.status).toBe(401);
            expect(((await r.json()) as { error: string }).error).toBe(
                "invalid_token",
            );
            expect(r.headers.get("www-authenticate")).toContain(
                "resource_metadata",
            );
            expect(fetches).toBe(0);
        } finally {
            globalThis.fetch = realFetch;
        }
    });
});

describe("GET /pending", () => {
    const meals = [
        // Oct 2 in Kyiv (UTC+3).
        {
            logged_at: "2026-10-02T06:00:00Z",
            calories: 600,
            protein_g: 30.04,
            carbs_g: null,
            fat_g: 20,
            fiber_g: null,
            sugar_g: null,
            caffeine_mg: 95,
        },
        {
            logged_at: "2026-10-02T18:30:00Z",
            calories: 900,
            protein_g: 40,
            carbs_g: null,
            fat_g: null,
            fiber_g: null,
            sugar_g: 0,
            caffeine_mg: null,
        },
        // Oct 3 in Kyiv: not closed yet at 15:00 local.
        {
            logged_at: "2026-10-03T08:00:00Z",
            calories: 400,
            protein_g: 10,
            carbs_g: 50,
            fat_g: 10,
            fiber_g: 5,
            sugar_g: 5,
            caffeine_mg: 0,
        },
    ] as unknown as Partial<HealthSyncMeal>[];

    test("offers closed days only, omitting nulls, and records the offer", async () => {
        const ctx = setup({ meals });
        const token = seedLink(ctx);
        const r = await ctx.req("/api/v1/health-sync/pending", { token });
        expect(r.status).toBe(200);
        expect(r.headers.get("cache-control")).toBe("private, no-store");
        const b = (await r.json()) as Record<string, any>;
        expect(b).toMatchObject({
            ok: true,
            version: 1,
            complete: true,
            timezone: KYIV,
            timezone_source: "profile",
            notices: [],
        });
        expect(b.lease_until).toBe(new Date(NOW + 120_000).toISOString());
        expect(b.entries).toEqual([
            {
                entry_id: "2026-10-02:i",
                date: "2026-10-02",
                kind: "initial",
                sample_local: "2026-10-02 12:00:00",
                values: {
                    energy_kcal: 1500,
                    protein_g: 70,
                    fat_g: 20,
                    sugar_g: 0,
                    caffeine_mg: 95,
                },
            },
        ]);
        expect(b.status).toEqual({
            synced_through: "2026-10-01",
            next_day_ready_at: "2026-10-04T05:00:00+03:00",
        });
        // Water is off for this link: never read.
        expect(ctx.reads).not.toContain("water");
        const day = ctx.days.get(`${USER}|2026-10-02`)!;
        expect(day.offer_count).toBe(1);
        expect(day.sent_values).toBeNull();
        expect(lines()).toEqual([
            "[health-sync] route=pending result=ok entries=1 notices=0",
        ]);
    });

    test("a second run inside the lease is busy", async () => {
        const ctx = setup({ meals });
        const token = seedLink(ctx);
        expect(
            (await ctx.req("/api/v1/health-sync/pending", { token })).status,
        ).toBe(200);
        const r = await ctx.req("/api/v1/health-sync/pending", { token });
        expect(r.status).toBe(409);
        expect(await r.json()).toMatchObject({ ok: false, error: "busy" });
        // Once it lapses, a run goes through again.
        ctx.setClock(NOW + 121_000);
        expect(
            (await ctx.req("/api/v1/health-sync/pending", { token })).status,
        ).toBe(200);
    });

    test("fails closed: a read failure computes and writes nothing, and frees the lease", async () => {
        for (const which of ["meals", "water", "profile"]) {
            const ctx = setup({ meals });
            const token = seedLink(ctx, {
                fields: ["energy_kcal", "water_ml"],
            });
            ctx.dataFail.add(which);
            const r = await ctx.req("/api/v1/health-sync/pending", { token });
            expect(r.status).toBe(503);
            const b = (await r.json()) as Record<string, unknown>;
            expect(b.ok).toBe(false);
            expect(b.error).toBe("unavailable");
            expect(b.entries).toBeUndefined();
            expect(ctx.calls).not.toContain("insertDays");
            expect(ctx.calls).not.toContain("updateDay");
            expect(ctx.days.size).toBe(0);
            await new Promise((res) => setTimeout(res, 0));
            expect(ctx.links.get(USER)!.row.lease_until).toBeNull();
            const line = lines()[0]!;
            expect(line).toContain("route=pending result=unavailable ref=");
            expect(line).not.toContain(USER);
        }
    });

    test("a ledger read failure fails closed too", async () => {
        const ctx = setup({ meals });
        const token = seedLink(ctx);
        ctx.fail.add("getDays");
        const r = await ctx.req("/api/v1/health-sync/pending", { token });
        expect(r.status).toBe(503);
        expect(ctx.calls).not.toContain("insertDays");
        expect(ctx.calls).not.toContain("updateDay");
    });

    test("an empty window answers without reading meals", async () => {
        const ctx = setup({ meals });
        // Paired today with no backfill: nothing has closed yet.
        const token = seedLink(ctx, { sync_start_date: "2026-10-03" });
        const r = await ctx.req("/api/v1/health-sync/pending", { token });
        const b = (await r.json()) as Record<string, any>;
        expect(b.entries).toEqual([]);
        expect(b.status.synced_through).toBeNull();
        expect(ctx.reads).not.toContain("meals");
    });

    test("falls back to the phone's zone, then UTC", async () => {
        const phone = setup({ tz: null });
        const t1 = seedLink(phone, { fallback_tz: "Asia/Tokyo" });
        const b1 = (await (
            await phone.req("/api/v1/health-sync/pending", { token: t1 })
        ).json()) as Record<string, any>;
        expect(b1.timezone).toBe("Asia/Tokyo");
        expect(b1.timezone_source).toBe("phone");

        const utc = setup({ tz: null });
        const t2 = seedLink(utc);
        const b2 = (await (
            await utc.req("/api/v1/health-sync/pending", { token: t2 })
        ).json()) as Record<string, any>;
        expect(b2.timezone).toBe("UTC");
        expect(b2.timezone_source).toBe("utc");
    });
});

describe("POST /ack", () => {
    const meals = [
        { logged_at: "2026-10-02T06:00:00Z", calories: 600, protein_g: 30 },
    ] as unknown as Partial<HealthSyncMeal>[];

    test("is idempotent, and done releases the lease", async () => {
        const ctx = setup({ meals });
        const token = seedLink(ctx);
        const p = (await (
            await ctx.req("/api/v1/health-sync/pending", { token })
        ).json()) as {
            lease_until: string;
            entries: { entry_id: string; date: string; values: object }[];
        };
        const entry = p.entries[0]!;
        expect(ctx.links.get(USER)!.row.lease_until).not.toBeNull();

        const ack = (done: boolean) =>
            ctx.req("/api/v1/health-sync/ack", {
                method: "POST",
                token,
                body: {
                    entries: [
                        {
                            entry_id: entry.entry_id,
                            date: entry.date,
                            values: entry.values,
                        },
                    ],
                    done,
                    lease_until: p.lease_until,
                },
            });
        const first = await ack(false);
        expect(first.status).toBe(200);
        expect(await first.json()).toEqual({
            ok: true,
            applied: 1,
            skipped: 0,
        });
        // Not done: the lease is still held.
        expect(ctx.links.get(USER)!.row.lease_until).not.toBeNull();
        const day = ctx.days.get(`${USER}|2026-10-02`)!;
        expect(day.sent_values).toEqual({ energy_kcal: 600, protein_g: 30 });
        expect(day.offer_count).toBe(0);
        expect(day.timezone).toBe(KYIV);
        expect(ctx.links.get(USER)!.row.last_sync_at).toBe(
            new Date(NOW).toISOString(),
        );

        const second = await ack(true);
        expect(await second.json()).toEqual({
            ok: true,
            applied: 0,
            skipped: 1,
        });
        expect(ctx.links.get(USER)!.row.lease_until).toBeNull();

        // Nothing left to offer.
        const again = (await (
            await ctx.req("/api/v1/health-sync/pending", { token })
        ).json()) as { entries: unknown[]; status: { synced_through: string } };
        expect(again.entries).toEqual([]);
        expect(again.status.synced_through).toBe("2026-10-02");
    });

    test("applies two top-ups for one day from one batch, in order", async () => {
        const ctx = setup();
        const token = seedLink(ctx);
        ctx.days.set(`${USER}|2026-10-02`, {
            user_id: USER,
            date: "2026-10-02",
            timezone: KYIV,
            sent_values: { energy_kcal: 500 },
            topup_seq: 0,
            offer_count: 0,
            notified: {},
            first_sent_at: "2026-10-03T03:00:00.000Z",
            last_sent_at: "2026-10-03T03:00:00.000Z",
        });
        const r = await ctx.req("/api/v1/health-sync/ack", {
            method: "POST",
            token,
            body: {
                entries: [
                    {
                        entry_id: "2026-10-02:t1",
                        date: "2026-10-02",
                        values: { energy_kcal: 100 },
                    },
                    {
                        entry_id: "2026-10-02:t2",
                        date: "2026-10-02",
                        values: { energy_kcal: 50 },
                    },
                ],
            },
        });
        expect(await r.json()).toEqual({ ok: true, applied: 2, skipped: 0 });
        const day = ctx.days.get(`${USER}|2026-10-02`)!;
        expect(day.sent_values).toEqual({ energy_kcal: 650 });
        expect(day.topup_seq).toBe(2);
    });

    test("refuses a field the link does not send, and other bad bodies", async () => {
        const ctx = setup();
        const token = seedLink(ctx);
        for (const body of [
            {
                entries: [
                    {
                        entry_id: "2026-10-02:i",
                        date: "2026-10-02",
                        values: { water_ml: 500 },
                    },
                ],
            },
            {
                entries: [
                    {
                        entry_id: "2026-10-02:i",
                        date: "2026-10-02",
                        values: { energy_kcal: -1 },
                    },
                ],
            },
            {
                entries: Array.from({ length: 21 }, () => ({
                    entry_id: "2026-10-02:i",
                    date: "2026-10-02",
                    values: { energy_kcal: 1 },
                })),
            },
            "{",
        ]) {
            const r = await ctx.req("/api/v1/health-sync/ack", {
                method: "POST",
                token,
                body,
            });
            expect(r.status).toBe(400);
            expect(((await r.json()) as { error: string }).error).toBe(
                "bad_request",
            );
        }
        expect(ctx.calls).not.toContain("insertDays");
        expect(ctx.calls).not.toContain("updateDay");
    });

    test("a store failure is unavailable with a ref", async () => {
        const ctx = setup();
        const token = seedLink(ctx);
        ctx.days.set(`${USER}|2026-10-02`, offeredRow("2026-10-02"));
        ctx.fail.add("updateDay");
        const r = await ctx.req("/api/v1/health-sync/ack", {
            method: "POST",
            token,
            body: {
                entries: [
                    {
                        entry_id: "2026-10-02:i",
                        date: "2026-10-02",
                        values: { energy_kcal: 10 },
                    },
                ],
            },
        });
        expect(r.status).toBe(503);
        expect(((await r.json()) as { error: string }).error).toBe(
            "unavailable",
        );
    });
});

describe("POST /ack: bounds and concurrency", () => {
    const meals = [
        { logged_at: "2026-10-02T06:00:00Z", calories: 600, protein_g: 30 },
    ] as unknown as Partial<HealthSyncMeal>[];
    const ack = (ctx: Ctx, token: string, body: unknown) =>
        ctx.req("/api/v1/health-sync/ack", { method: "POST", token, body });
    const initial = (date: string) => ({
        entry_id: `${date}:i`,
        date,
        values: { energy_kcal: 1 },
    });

    test("only dates /pending could have offered are applied", async () => {
        const ctx = setup();
        const token = seedLink(ctx);
        // Even a row that exists (however it got there) outside the window
        // is not written: future days, and days older than the window.
        for (const d of ["2030-01-01", "2026-10-03", "2026-09-20"]) {
            ctx.days.set(`${USER}|${d}`, offeredRow(d));
        }
        const r = await ack(ctx, token, {
            entries: [
                initial("2030-01-01"),
                initial("2030-01-02"),
                // Today: not closed yet.
                initial("2026-10-03"),
                // Before the window (lastClosed − 7 is 2026-09-25).
                initial("2026-09-20"),
            ],
        });
        expect(await r.json()).toEqual({ ok: true, applied: 0, skipped: 4 });
        expect(ctx.days.has(`${USER}|2030-01-02`)).toBe(false);
        for (const d of ["2030-01-01", "2026-10-03", "2026-09-20"]) {
            expect(ctx.days.get(`${USER}|${d}`)!.sent_values).toBeNull();
        }
        expect(ctx.calls).not.toContain("updateDay");
    });

    test("a day that was never offered (no row) is skipped", async () => {
        const ctx = setup();
        const token = seedLink(ctx);
        const r = await ack(ctx, token, { entries: [initial("2026-10-01")] });
        expect(await r.json()).toEqual({ ok: true, applied: 0, skipped: 1 });
        expect(ctx.days.size).toBe(0);
    });

    test("the day that slid out of the window at 05:00 is still taken", async () => {
        const ctx = setup();
        const token = seedLink(ctx, { sync_start_date: "2026-09-01" });
        // At 12:00Z on Oct 3 the window is Sep 26 – Oct 2; Sep 25 was its
        // first day until 05:00 this morning.
        ctx.days.set(`${USER}|2026-09-25`, offeredRow("2026-09-25"));
        const r = await ack(ctx, token, { entries: [initial("2026-09-25")] });
        expect(await r.json()).toEqual({ ok: true, applied: 1, skipped: 0 });
    });

    test("nothing before the link's start date", async () => {
        const ctx = setup();
        const token = seedLink(ctx, { sync_start_date: "2026-10-02" });
        ctx.days.set(`${USER}|2026-10-01`, offeredRow("2026-10-01"));
        const r = await ack(ctx, token, { entries: [initial("2026-10-01")] });
        expect(await r.json()).toEqual({ ok: true, applied: 0, skipped: 1 });
    });

    test("done frees only the lease this run holds", async () => {
        const ctx = setup({ meals });
        const token = seedLink(ctx);
        const a = (await (
            await ctx.req("/api/v1/health-sync/pending", { token })
        ).json()) as { lease_until: string };
        // Run A's lease lapses; run B takes a new one.
        ctx.setClock(NOW + 150_000);
        const b = (await (
            await ctx.req("/api/v1/health-sync/pending", { token })
        ).json()) as { lease_until: string };
        expect(b.lease_until).not.toBe(a.lease_until);
        // A's late done does not free B's lease...
        await ack(ctx, token, {
            entries: [],
            done: true,
            lease_until: a.lease_until,
        });
        expect(ctx.links.get(USER)!.row.lease_until).toBe(b.lease_until);
        // ...and neither does a done that names no lease.
        await ack(ctx, token, { entries: [], done: true });
        expect(ctx.links.get(USER)!.row.lease_until).toBe(b.lease_until);
        const busy = await ctx.req("/api/v1/health-sync/pending", { token });
        expect(busy.status).toBe(409);
        // B's own done does.
        await ack(ctx, token, {
            entries: [],
            done: true,
            lease_until: b.lease_until,
        });
        expect(ctx.links.get(USER)!.row.lease_until).toBeNull();
    });

    test("an ack landing between /pending's read and write is not undone", async () => {
        const ctx = setup({ meals });
        const token = seedLink(ctx);
        // Run A was offered Oct 2 and its lease lapsed before it acked.
        await ctx.req("/api/v1/health-sync/pending", { token });
        ctx.setClock(NOW + 150_000);
        // Run B reads the ledger; A's ack lands before B writes.
        const realGetDays = ctx.store.getDays.bind(ctx.store);
        let fired = false;
        ctx.store.getDays = async (u, f, t) => {
            const rows = await realGetDays(u, f, t);
            if (!fired) {
                fired = true;
                const r = await ack(ctx, token, {
                    entries: [
                        {
                            entry_id: "2026-10-02:i",
                            date: "2026-10-02",
                            values: { energy_kcal: 600, protein_g: 30 },
                        },
                    ],
                });
                expect(await r.json()).toMatchObject({ applied: 1 });
            }
            return rows;
        };
        const b = (await (
            await ctx.req("/api/v1/health-sync/pending", { token })
        ).json()) as { entries: unknown[] };
        // B does not offer the day again, and A's ack stands.
        expect(b.entries).toEqual([]);
        const day = ctx.days.get(`${USER}|2026-10-02`)!;
        expect(day.sent_values).toEqual({ energy_kcal: 600, protein_g: 30 });
        expect(day.offer_count).toBe(0);
    });

    test("an ack whose day moved on in between counts as skipped", async () => {
        const ctx = setup();
        const token = seedLink(ctx);
        ctx.days.set(`${USER}|2026-10-02`, offeredRow("2026-10-02"));
        const realGetDays = ctx.store.getDays.bind(ctx.store);
        ctx.store.getDays = async (u, f, t) => {
            const rows = await realGetDays(u, f, t);
            // Another run's ack of the same initial lands first.
            ctx.days.get(`${USER}|2026-10-02`)!.sent_values = {
                energy_kcal: 5,
            };
            return rows;
        };
        const r = await ack(ctx, token, { entries: [initial("2026-10-02")] });
        expect(await r.json()).toEqual({ ok: true, applied: 0, skipped: 1 });
        expect(ctx.days.get(`${USER}|2026-10-02`)!.sent_values).toEqual({
            energy_kcal: 5,
        });
        expect(ctx.calls).not.toContain("setLastSync");
    });
});

describe("GET /pending: stuck days", () => {
    const meals = [
        { logged_at: "2026-10-02T06:00:00Z", calories: 600 },
    ] as unknown as Partial<HealthSyncMeal>[];
    const pending = async (ctx: Ctx, token: string, query = "") =>
        (await (
            await ctx.req(`/api/v1/health-sync/pending${query}`, { token })
        ).json()) as {
            entries: { entry_id: string }[];
            notices: string[];
            lease_until: string;
        };

    test("a stuck day comes back on a run started by hand", async () => {
        const ctx = setup({ meals });
        const token = seedLink(ctx);
        // Three automation runs whose writes Health refused: nothing acked.
        let clock = NOW;
        for (let i = 0; i < 3; i++) {
            const p = await pending(ctx, token);
            expect(p.entries.map((e) => e.entry_id)).toEqual(["2026-10-02:i"]);
            clock += 150_000;
            ctx.setClock(clock);
        }
        const stuck = await pending(ctx, token);
        expect(stuck.entries).toEqual([]);
        expect(stuck.notices).toHaveLength(1);
        expect(stuck.notices[0]).toContain("Sharing → Apps → Shortcuts");
        clock += 150_000;
        ctx.setClock(clock);
        // Automations stay quiet about it.
        const auto = await pending(ctx, token);
        expect(auto.entries).toEqual([]);
        expect(auto.notices).toEqual([]);
        clock += 150_000;
        ctx.setClock(clock);
        // The user fixes the permission and runs Sync now.
        const manual = await pending(ctx, token, "?mode=manual");
        expect(manual.entries.map((e) => e.entry_id)).toEqual(["2026-10-02:i"]);
        const r = await ctx.req("/api/v1/health-sync/ack", {
            method: "POST",
            token,
            body: {
                entries: [
                    {
                        entry_id: "2026-10-02:i",
                        date: "2026-10-02",
                        values: { energy_kcal: 600 },
                    },
                ],
                done: true,
                lease_until: manual.lease_until,
            },
        });
        expect(await r.json()).toMatchObject({ applied: 1 });
        const day = ctx.days.get(`${USER}|2026-10-02`)!;
        expect(day.sent_values).toEqual({ energy_kcal: 600 });
        expect(day.offer_count).toBe(0);
        expect(day.notified).toEqual({});
    });
});

describe("unknown API paths", () => {
    test("a wrong method or path answers in the envelope", async () => {
        const ctx = setup();
        const wrong = await ctx.req("/api/v1/health-sync/ack");
        expect(wrong.status).toBe(405);
        expect(wrong.headers.get("allow")).toBe("POST");
        expect(wrong.headers.get("cache-control")).toBe("private, no-store");
        expect(await wrong.json()).toMatchObject({
            ok: false,
            error: "bad_request",
        });
        const typo = await ctx.req("/api/v1/health-sync/pendng");
        expect(typo.status).toBe(404);
        expect(await typo.json()).toMatchObject({
            ok: false,
            error: "bad_request",
            message: "Unknown endpoint.",
        });
        const root = await ctx.req("/api/v1/health-sync", { method: "POST" });
        expect(root.status).toBe(404);
        expect(lines()).toEqual([
            "[health-sync] route=unknown result=bad_request",
            "[health-sync] route=unknown result=bad_request",
            "[health-sync] route=unknown result=bad_request",
        ]);
    });

    test("the real routes still win", async () => {
        const ctx = setup();
        const r = await ctx.req("/api/v1/health-sync/pending");
        expect(r.status).toBe(401);
    });
});

describe("POST /revoke", () => {
    test("deletes the link and its sent record", async () => {
        const ctx = setup();
        const token = seedLink(ctx);
        ctx.days.set(`${USER}|2026-10-02`, {
            user_id: USER,
            date: "2026-10-02",
            timezone: KYIV,
            sent_values: { energy_kcal: 500 },
            topup_seq: 0,
            offer_count: 0,
            notified: {},
            first_sent_at: null,
            last_sent_at: null,
        });
        const r = await ctx.req("/api/v1/health-sync/revoke", {
            method: "POST",
            token,
        });
        expect(r.status).toBe(200);
        expect(await r.json()).toEqual({ ok: true });
        expect(ctx.links.size).toBe(0);
        expect(ctx.days.size).toBe(0);
        const after = await ctx.req("/api/v1/health-sync/pending", { token });
        expect(after.status).toBe(401);
    });
});

describe("logging", () => {
    test("one line per call, never an id, token or secret", async () => {
        const ctx = setup();
        const p = await pairToClaimCode(ctx);
        const claim = await ctx.req("/api/v1/health-sync/claim", {
            method: "POST",
            body: { claim_code: p.claimCode, device_secret: p.deviceSecret },
        });
        const { token } = (await claim.json()) as { token: string };
        await ctx.req("/api/v1/health-sync/pending", { token });
        await ctx.req("/api/v1/health-sync/ack", {
            method: "POST",
            token,
            body: { entries: [], done: true },
        });
        await ctx.req("/api/v1/health-sync/revoke", {
            method: "POST",
            token,
        });
        const out = lines();
        expect(out.map((l) => l.split(" ")[1])).toEqual([
            "route=start",
            "route=connect",
            "route=callback",
            "route=claim",
            "route=pending",
            "route=ack",
            "route=revoke",
        ]);
        for (const l of out) {
            expect(l).toMatch(/^\[health-sync\] route=\w+ result=ok( |$)/);
            for (const secret of [
                USER,
                token,
                p.claimCode,
                p.connectId,
                p.deviceSecret,
                p.challenge,
            ]) {
                expect(l).not.toContain(secret);
            }
        }
    });
});
