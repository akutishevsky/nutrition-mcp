// HTTP half of Apple Health sync via an iOS Shortcut (the pure rules are in
// src/health-sync.ts, persistence in src/health-sync-store.ts):
//
//   POST /api/v1/health-sync/start     the shortcut starts pairing
//   GET  /health-sync/connect/:id      Safari, on the phone: into the sign-in
//   GET  /health-sync/callback         sign-in done: hand a claim code back
//   POST /api/v1/health-sync/claim     the shortcut trades it for a link token
//   GET  /api/v1/health-sync/pending   closed days to log into Apple Health
//   POST /api/v1/health-sync/ack       what the shortcut actually logged
//   POST /api/v1/health-sync/revoke    disconnect
//
// Pairing makes this server an OAuth client of itself (HEALTH_SYNC_CLIENT in
// src/oauth-store.ts): /connect sends the browser to the ordinary /authorize
// with a PKCE challenge whose verifier only the server holds, so the whole
// hardened sign-in — password, Google, the browser-binding cookie, the
// consent notice — is reused unchanged, and /callback redeems the code
// straight from the OAuth store rather than at /token.
//
// The API answers in one envelope: every body has `ok`, and a failure is
// `{ ok: false, error, message, ref? }` with `error` from a fixed vocabulary
// and `message` written for the person reading the shortcut's alert. Every
// handler catches its own errors, so nothing here reaches app.onError, and
// every call writes exactly one `[health-sync] route=… result=…` line, which
// never carries a user id, token, code, hash, connect id or email.
//
// Mounted at "/" by src/index.ts, so — exactly as in createOAuthRouter — no
// middleware here is registered on "*": a sub-app's wildcard middleware would
// run on every path of the parent app.
import { Hono, type Context, type Next } from "hono";
import {
    HEALTH_SYNC_CLAIM_TTL_MINUTES,
    HEALTH_SYNC_CONNECT_TTL_MINUTES,
    HEALTH_SYNC_LEASE_SECONDS,
    HEALTH_SYNC_SHORTCUT_NAME,
    HEALTH_SYNC_TOKEN_PREFIX,
    ackWindow,
    applyAck,
    computeDayTotals,
    effectiveTimezone,
    formatInstantWithOffset,
    isHealthSyncField,
    linkExpiresAt,
    looksLikeHealthSyncToken,
    offeringWindow,
    parseAckBody,
    parseClaimBody,
    parseStartBody,
    planPending,
    shouldTouchLink,
    syncStartDate,
    type DayValues,
    type HealthSyncField,
    type HealthSyncMeal,
    type HealthSyncWater,
    type LedgerRow,
} from "./health-sync.js";
import {
    createSupabaseHealthSyncStore,
    type HealthSyncDayRow,
    type HealthSyncLinkRow,
    type HealthSyncStore,
} from "./health-sync-store.js";
import {
    HEALTH_SYNC_CLIENT_ID,
    createSupabaseOAuthStore,
    healthSyncCallbackUrl,
    type OAuthStore,
} from "./oauth-store.js";
import { pkceS256, verifierMatchesChallenge } from "./oauth-validate.js";
import { issuerFor } from "./discovery.js";
import { getBaseUrl } from "./url.js";
import { newOpaqueToken } from "./token-hash.js";
import { newErrorRef } from "./errors.js";
import { getClientIp, recordAuthFailure } from "./middleware.js";
import {
    checkAuthRateLimit,
    checkHealthSyncRateLimit,
    checkHealthSyncStartGlobalLimit,
    clearAuthFailures,
    getBanState,
    noteHealthSyncClaimFailure,
    type RateLimitResult,
} from "./rate-limit.js";
import {
    getMealsInRange,
    getProfile,
    getWaterInRange,
    timezoneFromProfile,
} from "./supabase.js";
import {
    healthSyncCopyFor,
    type HealthSyncErrorKind,
} from "./copy/health-sync.js";
import { HTML_LANG, SITE, SITE_LOCALES, type SiteLocale } from "./routes.js";

const API = "/api/v1/health-sync";

/** Paths this router owns. src/index.ts keeps the global CORS middleware off
 *  them: the shortcut sends no Origin, and nothing in a browser should be
 *  able to read these responses cross-origin. */
export function isHealthSyncPath(path: string): boolean {
    return (
        path === API ||
        path.startsWith(`${API}/`) ||
        path === "/health-sync" ||
        path.startsWith("/health-sync/")
    );
}

/** The path the access log prints. A connect link's id is a live pairing
 *  secret for 30 minutes — whoever opens it first gets to sign in to it — so
 *  the runtime log never holds one; every other path is printed as is. */
export function accessLogPath(path: string): string {
    return path.startsWith("/health-sync/connect/")
        ? "/health-sync/connect/:id"
        : path;
}

/**
 * The origin /start's connect link and /claim's `site` name: where the
 * shortcut opens Safari, and where it sends its link token from then on.
 * Never the request's own host — getBaseUrl trusts x-forwarded-host, and the
 * token's destination must not be decided by a request header. The canonical
 * SITE, unless PUBLIC_BASE_URL names another origin (the dev deploy, local
 * development, a self-hosted fork); a value that is not a bare http(s)
 * origin is ignored.
 */
export function configuredSite(
    env: string | undefined = process.env.PUBLIC_BASE_URL,
): string {
    const raw = env?.trim().replace(/\/+$/, "");
    if (!raw) return SITE;
    try {
        const u = new URL(raw);
        if (
            (u.protocol === "https:" || u.protocol === "http:") &&
            u.origin === raw
        ) {
            return u.origin;
        }
    } catch {
        // fall through
    }
    return SITE;
}

// ---------- dependencies ----------

/** The user data /pending and /claim read. Injectable so the route tests run
 *  on fakes; the default is supabase.ts. */
export interface HealthSyncData {
    /** The profile's own timezone, null when never set (no row, or a row
     *  whose timezone is null). */
    getProfileTimezone(userId: string): Promise<string | null>;
    /** Meals in [from, to] (local dates in `tz`), reconciled: throws rather
     *  than return a truncated read. */
    getMeals(
        userId: string,
        from: string,
        to: string,
        tz: string,
    ): Promise<HealthSyncMeal[]>;
    getWater(
        userId: string,
        from: string,
        to: string,
        tz: string,
    ): Promise<HealthSyncWater[]>;
}

export const supabaseHealthSyncData: HealthSyncData = {
    async getProfileTimezone(userId) {
        return timezoneFromProfile(await getProfile(userId));
    },
    getMeals: getMealsInRange,
    getWater: getWaterInRange,
};

export interface HealthSyncRouterDeps {
    store?: HealthSyncStore;
    /** Only consumeAuthCode is used: the callback redeems its own codes. */
    oauthStore?: Pick<OAuthStore, "consumeAuthCode">;
    data?: HealthSyncData;
    now?: () => number;
    /** The origin named by /start and /claim; configuredSite() by default. */
    site?: string;
}

// ---------- envelope, logging ----------

export type HealthSyncErrorCode =
    | "invalid_token"
    | "invalid_code"
    | "expired"
    | "busy"
    | "rate_limited"
    | "unavailable"
    | "bad_request"
    | "server_error";

type Route =
    | "start"
    | "connect"
    | "callback"
    | "claim"
    | "pending"
    | "ack"
    | "revoke"
    | "unknown";

/** What a handler reports for its one log line. */
interface CallNote {
    result: string;
    entries?: number;
    notices?: number;
    /** Set for server_error / unavailable: the ref the caller was shown, and
     *  the raw error text, JSON-escaped and capped like analyticsLogLine. */
    ref?: string;
    error?: string;
    /** A process-wide signal worth an operator's eye (no per-user data). */
    alert?: string;
}

type Env = {
    Variables: {
        hsLink: HealthSyncLinkRow;
        hsNote: CallNote;
    };
};

/** Thrown around a store or data call, so a failure to read or write is
 *  told apart from a bug: the first is `unavailable` (retry later), the
 *  second `server_error`. */
class Unavailable extends Error {
    constructor(readonly inner: unknown) {
        super(inner instanceof Error ? inner.message : String(inner));
    }
}

async function io<T>(p: Promise<T>): Promise<T> {
    try {
        return await p;
    } catch (err) {
        throw new Unavailable(err);
    }
}

function errorText(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    return msg.slice(0, 500);
}

function logLine(route: Route, note: CallNote): string {
    let line = `[health-sync] route=${route} result=${note.result}`;
    if (note.entries !== undefined) line += ` entries=${note.entries}`;
    if (note.notices !== undefined) line += ` notices=${note.notices}`;
    if (note.alert) line += ` alert=${note.alert}`;
    if (note.ref) line += ` ref=${note.ref}`;
    if (note.error !== undefined) line += `: ${JSON.stringify(note.error)}`;
    return line;
}

const API_HEADERS = { "Cache-Control": "private, no-store" } as const;

const MESSAGES: Record<
    Exclude<HealthSyncErrorCode, "bad_request" | "rate_limited">,
    string
> = {
    invalid_token:
        "This shortcut is no longer connected to Nutrition MCP. Run the Nutrition MCP Health shortcut again to reconnect.",
    invalid_code:
        "This sign-in could not be matched to the shortcut that started it, or it was already used. Run the Nutrition MCP Health shortcut again to connect.",
    expired:
        "This connect request has expired. Run the Nutrition MCP Health shortcut again to connect.",
    busy: "Another sync is already running for this account. Try again in a couple of minutes.",
    unavailable:
        "Nutrition MCP could not reach its database, so nothing was read or changed. Try again in a few minutes.",
    server_error:
        "Something went wrong on the Nutrition MCP server, so nothing was changed. Try again later.",
};

function fail(
    c: Context<Env>,
    status: 400 | 401 | 404 | 405 | 409 | 429 | 500 | 503,
    error: HealthSyncErrorCode,
    message: string,
    extra: { ref?: string; headers?: Record<string, string> } = {},
) {
    const note = c.get("hsNote");
    if (note) note.result = error;
    const body: Record<string, unknown> = { ok: false, error, message };
    if (extra.ref) body.ref = extra.ref;
    return c.json(body, status, { ...API_HEADERS, ...extra.headers });
}

function rateLimited(c: Context<Env>, r: RateLimitResult) {
    const after = r.retryAfterSeconds ?? 60;
    return fail(
        c,
        429,
        "rate_limited",
        `Too many requests. Try again in ${after} seconds.`,
        { headers: { "Retry-After": String(after) } },
    );
}

/** The 503/500 for an error a handler caught; logs under the same ref. */
function failFromError(c: Context<Env>, err: unknown) {
    const ref = newErrorRef();
    const note = c.get("hsNote");
    note.ref = ref;
    note.error = errorText(err instanceof Unavailable ? err.inner : err);
    if (err instanceof Unavailable) {
        return fail(
            c,
            503,
            "unavailable",
            `${MESSAGES.unavailable} (ref ${ref})`,
            { ref, headers: { "Retry-After": "60" } },
        );
    }
    return fail(
        c,
        500,
        "server_error",
        `${MESSAGES.server_error} (ref ${ref})`,
        { ref },
    );
}

function ok(c: Context<Env>, body: Record<string, unknown>) {
    c.get("hsNote").result = "ok";
    return c.json({ ok: true, ...body }, 200, API_HEADERS);
}

/** A JSON body, or `undefined` for an empty one; null when it is not JSON. */
async function readJson(c: Context<Env>): Promise<{ value: unknown } | null> {
    const text = await c.req.text();
    if (text.trim() === "") return { value: undefined };
    try {
        return { value: JSON.parse(text) };
    } catch {
        return null;
    }
}

// ---------- HTML pages (connect error, callback) ----------

/** The best SITE_LOCALES match for an Accept-Language header, else "en". */
export function localeFromAcceptLanguage(
    header: string | undefined,
): SiteLocale {
    if (!header) return "en";
    const ranked = header
        .split(",")
        .map((part, i) => {
            const [tag, ...params] = part.trim().split(";");
            const qParam = params.find((p) => p.trim().startsWith("q="));
            const q = qParam ? Number(qParam.trim().slice(2)) : 1;
            return {
                base: (tag ?? "").trim().toLowerCase().split("-")[0] ?? "",
                q: Number.isFinite(q) ? q : 0,
                i,
            };
        })
        .filter((x) => x.q > 0 && x.base !== "")
        .sort((a, b) => b.q - a.q || a.i - b.i);
    for (const { base } of ranked) {
        const hit = SITE_LOCALES.find((l) => l === base);
        if (hit) return hit;
    }
    return "en";
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// These pages load nothing: no script, no font, no analytics, no image. The
// site-wide CSP in src/index.ts allows far more (analytics, Google Fonts), so
// each page carries its own and the security-headers middleware, which only
// fills a missing one, leaves it alone.
const PAGE_CSP =
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

const PAGE_STYLE = `
:root{color-scheme:light dark;--bg:#eef2f6;--card:#ffffffd9;--ink:#1d2733;--muted:#5b6878;--accent:#2f9e5b;--accent-ink:#fff;--line:#d8e0ea}
@media (prefers-color-scheme:dark){:root{--bg:#10151b;--card:#1a222bd9;--ink:#e6edf4;--muted:#9aa8b8;--accent:#46c27a;--accent-ink:#08130c;--line:#2a3542}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px 16px;background:var(--bg);color:var(--ink);font:500 17px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}
main{width:100%;max-width:440px;background:var(--card);border:1px solid var(--line);border-radius:28px;padding:32px 28px;text-align:center}
h1{font-size:24px;line-height:1.25;margin:0 0 12px;font-weight:750}
p{margin:0 0 16px;color:var(--muted)}
.btn{display:inline-block;margin:8px 0 16px;padding:14px 28px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font-weight:700;text-decoration:none}
.note{font-size:14px;margin:0}
`;

function renderPage(
    locale: SiteLocale,
    page: {
        title: string;
        heading: string;
        body: string;
        /** A same-href button, and an immediate meta-refresh to it. */
        go?: { href: string; label: string; note: string };
    },
): string {
    const go = page.go;
    const refresh = go
        ? `\n<meta http-equiv="refresh" content="0;url=${escapeHtml(go.href)}">`
        : "";
    const action = go
        ? `\n<a class="btn" href="${escapeHtml(go.href)}">${escapeHtml(go.label)}</a>\n<p class="note">${escapeHtml(go.note)}</p>`
        : "";
    return `<!doctype html>
<html lang="${HTML_LANG[locale]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">${refresh}
<title>${escapeHtml(page.title)} — Nutrition MCP</title>
<style>${PAGE_STYLE}</style>
</head>
<body>
<main>
<h1>${escapeHtml(page.heading)}</h1>
<p>${escapeHtml(page.body)}</p>${action}
</main>
</body>
</html>
`;
}

const PAGE_HEADERS = {
    "Content-Security-Policy": PAGE_CSP,
    "Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
} as const;

function errorPage(
    c: Context<Env>,
    status: 404 | 410 | 429 | 400 | 500 | 503,
    kind: HealthSyncErrorKind,
    result: string,
) {
    c.get("hsNote").result = result;
    const locale = localeFromAcceptLanguage(c.req.header("accept-language"));
    const msg = healthSyncCopyFor(locale).errors[kind];
    return c.html(renderPage(locale, msg), status, PAGE_HEADERS);
}

/** The URL that runs the shortcut with the claim code as its text input. */
export function shortcutRunUrl(claimCode: string): string {
    return `shortcuts://run-shortcut?name=${encodeURIComponent(HEALTH_SYNC_SHORTCUT_NAME)}&input=text&text=${encodeURIComponent(claimCode)}`;
}

// ---------- router ----------

const OPAQUE_ID = /^[A-Za-z0-9_-]{20,200}$/;
const MINUTE_MS = 60_000;

function toLedger(row: HealthSyncDayRow): LedgerRow {
    return {
        date: row.date,
        timezone: row.timezone,
        sent_values: row.sent_values as DayValues | null,
        topup_seq: row.topup_seq,
        offer_count: row.offer_count,
        notified: row.notified as LedgerRow["notified"],
        first_sent_at: row.first_sent_at,
        last_sent_at: row.last_sent_at,
    };
}

function toDayRow(userId: string, row: LedgerRow): HealthSyncDayRow {
    return {
        user_id: userId,
        date: row.date,
        timezone: row.timezone,
        sent_values: (row.sent_values as Record<string, number> | null) ?? null,
        topup_seq: row.topup_seq,
        offer_count: row.offer_count,
        notified: row.notified,
        first_sent_at: row.first_sent_at,
        last_sent_at: row.last_sent_at,
    };
}

function linkFields(link: HealthSyncLinkRow): HealthSyncField[] {
    return link.fields.filter(isHealthSyncField);
}

/**
 * Write what /pending decided — offer counts, notices, a re-adopted zone —
 * without touching `sent_values` or `topup_seq`, which only an ack sets. New
 * rows are inserted (a date that gained a row in between keeps it); existing
 * ones are updated only if still as `ledger` read them. Returns the dates
 * written, which are the only ones whose entries may be offered.
 */
async function recordOffers(
    store: HealthSyncStore,
    userId: string,
    ledger: readonly LedgerRow[],
    updates: readonly LedgerRow[],
): Promise<Set<string>> {
    const before = new Map(ledger.map((r) => [r.date, r]));
    const fresh = updates.filter((r) => !before.has(r.date));
    const [inserted, updated] = await Promise.all([
        store.insertDays(fresh.map((r) => toDayRow(userId, r))),
        Promise.all(
            updates
                .filter((r) => before.has(r.date))
                .map(async (r) => {
                    const b = before.get(r.date)!;
                    const ok = await store.updateDay(
                        userId,
                        r.date,
                        {
                            timezone: r.timezone,
                            offer_count: r.offer_count,
                            notified: r.notified,
                        },
                        {
                            topup_seq: b.topup_seq,
                            sentNull: b.sent_values === null,
                        },
                    );
                    return ok ? r.date : null;
                }),
        ),
    ]);
    return new Set([
        ...inserted,
        ...updated.filter((d): d is string => d !== null),
    ]);
}

export function createHealthSyncRouter(deps: HealthSyncRouterDeps = {}) {
    const router = new Hono<Env>();
    const store = deps.store ?? createSupabaseHealthSyncStore();
    const oauthStore = deps.oauthStore ?? createSupabaseOAuthStore();
    const data = deps.data ?? supabaseHealthSyncData;
    const now = deps.now ?? Date.now;
    const site = deps.site ?? configuredSite();

    // One log line per call, written after the response is built. The note is
    // filled in by whichever branch answered; a throw that escaped a handler
    // (none should) still logs, as server_error, before propagating.
    const logged = (route: Route) => async (c: Context<Env>, next: Next) => {
        const note: CallNote = { result: "server_error" };
        c.set("hsNote", note);
        try {
            await next();
        } finally {
            const line = logLine(route, note);
            if (note.result === "ok") console.log(line);
            else console.warn(line);
        }
    };

    // Per-IP limit for the unauthenticated JSON calls, on the same bucket as
    // the OAuth endpoints, in the envelope.
    const perIpLimit = async (c: Context<Env>, next: Next) => {
        const r = checkAuthRateLimit(getClientIp(c));
        if (!r.allowed) return rateLimited(c, r);
        await next();
    };

    // The same per-IP limit for the two browser pages, answered as a page.
    const perIpLimitPage = async (c: Context<Env>, next: Next) => {
        const r = checkAuthRateLimit(getClientIp(c));
        if (!r.allowed) {
            c.header("Retry-After", String(r.retryAfterSeconds ?? 60));
            return errorPage(c, 429, "generic", "rate_limited");
        }
        await next();
    };

    // An IP banned for repeated auth failures (here or at /mcp — the strikes
    // are shared) is refused before any lookup, in the envelope. Its access
    // log line is suppressed exactly as banRepeatAuthFailures does for /mcp.
    const banGuard = async (c: Context<Env>, next: Next) => {
        const ban = getBanState(getClientIp(c));
        if (ban.banned) {
            c.set("suppressAccessLog", true);
            return rateLimited(c, {
                allowed: false,
                retryAfterSeconds: ban.retryAfterSeconds,
                remaining: 0,
                limit: 0,
            });
        }
        await next();
    };

    // Link-token auth for /pending, /ack and /revoke. Three outcomes, like
    // authenticateBearer: unavailable (we could not check) is a 503 with no
    // strike, so a database outage never bans a phone; invalid is a 401 and a
    // strike. Anything without the nmhs_ shape — an OAuth access token
    // included — is refused without a database call, and still strikes.
    const linkAuth = async (c: Context<Env>, next: Next) => {
        const header = c.req.header("Authorization") ?? "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : "";
        const invalid = () => {
            recordAuthFailure(c);
            return fail(c, 401, "invalid_token", MESSAGES.invalid_token, {
                headers: {
                    "WWW-Authenticate":
                        'Bearer realm="nutrition-mcp", error="invalid_token"',
                },
            });
        };
        if (
            !token.startsWith(HEALTH_SYNC_TOKEN_PREFIX) ||
            !looksLikeHealthSyncToken(token)
        ) {
            return invalid();
        }
        const at = new Date(now());
        // The store answers "unavailable" rather than throwing; a throw is
        // treated the same, since it equally means we could not check.
        const lookup = await store
            .lookupLink(token, at)
            .catch(() => ({ status: "unavailable" }) as const);
        if (lookup.status === "unavailable") {
            const ref = newErrorRef();
            c.get("hsNote").ref = ref;
            return fail(
                c,
                503,
                "unavailable",
                `${MESSAGES.unavailable} (ref ${ref})`,
                { ref, headers: { "Retry-After": "60" } },
            );
        }
        if (lookup.status === "invalid") return invalid();

        clearAuthFailures(getClientIp(c));
        const link = lookup.link;

        const limit = checkHealthSyncRateLimit(link.user_id);
        if (!limit.allowed) return rateLimited(c, limit);

        // Slide the expiry at most once an hour, against the value just
        // read. Fire-and-forget: a missed touch only means the next call
        // tries again, and must not fail or slow the sync.
        const lastUsed = link.last_used_at ? new Date(link.last_used_at) : null;
        if (shouldTouchLink(lastUsed, at)) {
            const expires = linkExpiresAt(new Date(link.created_at), at);
            void store
                .touchLink(
                    link.user_id,
                    at.toISOString(),
                    expires.toISOString(),
                )
                .catch(() => {});
        }

        c.set("hsLink", link);
        await next();
    };

    // ---- POST /start ----
    //
    // The process-wide cap is a trade-off, kept on purpose: it bounds the
    // pending rows a caller rotating x-forwarded-for can make the database
    // write, at the price that such a caller can hold off NEW pairings while
    // it keeps the cap full. Nothing else is affected — existing links sync
    // through their own per-user bucket, and a refused /start is simply
    // retried by the user — and pairing is rare, so the price is small.
    router.post(`${API}/start`, logged("start"), perIpLimit, async (c) => {
        try {
            const global = checkHealthSyncStartGlobalLimit();
            if (!global.allowed) return rateLimited(c, global);

            const json = await readJson(c);
            if (!json) {
                return fail(
                    c,
                    400,
                    "bad_request",
                    "The request body must be JSON.",
                );
            }
            const parsed = parseStartBody(json.value);
            if (!parsed.ok) {
                return fail(c, 400, "bad_request", parsed.message);
            }

            const connectId = newOpaqueToken();
            const deviceSecret = newOpaqueToken();
            // A verifier only this server ever holds: /connect sends its S256
            // challenge to /authorize, and /callback checks the code against
            // it. Stored as-is (see the migration header) — a hash could not
            // be turned back into the challenge.
            const pkceVerifier = newOpaqueToken();
            const ttlSeconds = HEALTH_SYNC_CONNECT_TTL_MINUTES * 60;
            await io(
                store.createPending({
                    connectId,
                    deviceSecret,
                    pkceVerifier,
                    fields: parsed.value.fields,
                    tz: parsed.value.tz,
                    backfillDays: parsed.value.backfill_days,
                    expiresAt: new Date(
                        now() + ttlSeconds * 1000,
                    ).toISOString(),
                }),
            );
            return ok(c, {
                connect_url: `${site}/health-sync/connect/${connectId}`,
                device_secret: deviceSecret,
                expires_in: ttlSeconds,
            });
        } catch (err) {
            return failFromError(c, err);
        }
    });

    // ---- GET /health-sync/connect/:id ----
    router.get(
        "/health-sync/connect/:id",
        logged("connect"),
        perIpLimitPage,
        async (c) => {
            try {
                const connectId = c.req.param("id") ?? "";
                if (!OPAQUE_ID.test(connectId)) {
                    return errorPage(c, 404, "expired", "expired");
                }
                const pending = await io(
                    store.getPendingByConnectId(connectId, new Date(now())),
                );
                // Unknown, lapsed, or already through sign-in once (its
                // verifier is cleared when the claim code is minted): the
                // link works once.
                if (
                    !pending ||
                    pending.claim_expires_at !== null ||
                    !pending.pkce_verifier
                ) {
                    return errorPage(c, 410, "expired", "expired");
                }
                const base = getBaseUrl(c);
                const params = new URLSearchParams({
                    response_type: "code",
                    client_id: HEALTH_SYNC_CLIENT_ID,
                    redirect_uri: healthSyncCallbackUrl(base),
                    state: connectId,
                    code_challenge: pkceS256(pending.pkce_verifier),
                    code_challenge_method: "S256",
                });
                // /authorize itself falls back to English for a locale whose
                // login page is not built, so any SITE_LOCALES match is safe
                // to pass; English is the default and is omitted.
                const locale = localeFromAcceptLanguage(
                    c.req.header("accept-language"),
                );
                if (locale !== "en") params.set("locale", locale);
                c.get("hsNote").result = "ok";
                c.header("Cache-Control", "no-store");
                return c.redirect(`/authorize?${params.toString()}`, 302);
            } catch (err) {
                const ref = newErrorRef();
                const note = c.get("hsNote");
                note.ref = ref;
                note.error = errorText(
                    err instanceof Unavailable ? err.inner : err,
                );
                return errorPage(
                    c,
                    err instanceof Unavailable ? 503 : 500,
                    "generic",
                    err instanceof Unavailable ? "unavailable" : "server_error",
                );
            }
        },
    );

    // ---- GET /health-sync/callback ----
    //
    // Why a claim code, and why it is only ever inside the shortcuts:// URL:
    // whoever started the flow holds the device secret /start returned, and
    // whoever finished sign-in in this browser gets the claim code — /claim
    // needs both. If an attacker starts pairing and tricks someone into
    // signing in on the connect link, the attacker holds the device secret
    // but never sees the claim code (it goes only to the victim's browser,
    // which hands it to the victim's own shortcut); the victim's phone holds
    // the claim code but not the attacker's device secret. Neither half
    // alone gets a link token. So the code is never printed on the page,
    // never logged, and the response is no-store.
    router.get(
        "/health-sync/callback",
        logged("callback"),
        perIpLimitPage,
        async (c) => {
            try {
                const state = c.req.query("state") ?? "";
                const code = c.req.query("code") ?? "";
                if (!OPAQUE_ID.test(state)) {
                    return errorPage(c, 400, "signInFailed", "bad_request");
                }
                const at = new Date(now());
                const pending = await io(
                    store.getPendingByConnectId(state, at),
                );
                if (
                    !pending ||
                    pending.claim_expires_at !== null ||
                    !pending.pkce_verifier
                ) {
                    return errorPage(c, 410, "expired", "expired");
                }
                // An error redirect from /authorize (e.g. a refused
                // resource), or no code at all: sign-in did not finish.
                if (c.req.query("error") !== undefined || code === "") {
                    return errorPage(c, 400, "signInFailed", "sign_in_failed");
                }
                const base = getBaseUrl(c);
                const iss = c.req.query("iss");
                if (iss !== undefined && iss !== issuerFor(base)) {
                    return errorPage(c, 400, "signInFailed", "sign_in_failed");
                }

                // Single-use whatever happens next: a code that fails a check
                // below is spent, exactly as at /token.
                const auth = await io(oauthStore.consumeAuthCode(code));
                if (
                    !auth ||
                    auth.client_id !== HEALTH_SYNC_CLIENT_ID ||
                    auth.redirect_uri !== healthSyncCallbackUrl(base) ||
                    !verifierMatchesChallenge(
                        pending.pkce_verifier,
                        auth.code_challenge,
                    )
                ) {
                    return errorPage(c, 400, "signInFailed", "sign_in_failed");
                }

                const claimCode = newOpaqueToken();
                const claimed = await io(
                    store.setPendingClaim(
                        state,
                        claimCode,
                        auth.user_id,
                        new Date(
                            at.getTime() +
                                HEALTH_SYNC_CLAIM_TTL_MINUTES * MINUTE_MS,
                        ).toISOString(),
                        at,
                    ),
                );
                if (!claimed) {
                    return errorPage(c, 410, "expired", "expired");
                }

                c.get("hsNote").result = "ok";
                const locale = localeFromAcceptLanguage(
                    c.req.header("accept-language"),
                );
                const copy = healthSyncCopyFor(locale).opening;
                return c.html(
                    renderPage(locale, {
                        title: copy.title,
                        heading: copy.heading,
                        body: copy.body,
                        go: {
                            href: shortcutRunUrl(claimCode),
                            label: copy.button,
                            note: copy.note,
                        },
                    }),
                    200,
                    PAGE_HEADERS,
                );
            } catch (err) {
                const ref = newErrorRef();
                const note = c.get("hsNote");
                note.ref = ref;
                note.error = errorText(
                    err instanceof Unavailable ? err.inner : err,
                );
                return errorPage(
                    c,
                    err instanceof Unavailable ? 503 : 500,
                    "generic",
                    err instanceof Unavailable ? "unavailable" : "server_error",
                );
            }
        },
    );

    // ---- POST /claim ----
    router.post(
        `${API}/claim`,
        logged("claim"),
        banGuard,
        perIpLimit,
        async (c) => {
            try {
                const json = await readJson(c);
                if (!json) {
                    return fail(
                        c,
                        400,
                        "bad_request",
                        "The request body must be JSON.",
                    );
                }
                const parsed = parseClaimBody(json.value);
                if (!parsed.ok) {
                    return fail(c, 400, "bad_request", parsed.message);
                }

                const at = new Date(now());
                const pending = await io(
                    store.consumeClaim(
                        parsed.value.claim_code,
                        parsed.value.device_secret,
                        at,
                    ),
                );
                if (!pending || !pending.user_id) {
                    // A guess at the pair: a strike for this IP. Failures are
                    // also counted process-wide, as an alert in the log line
                    // rather than a gate: a gate any caller rotating
                    // x-forwarded-for could fill would switch pairing off for
                    // everyone, and it would buy nothing — a claim needs two
                    // independent 256-bit secrets, which no volume of guesses
                    // finds.
                    recordAuthFailure(c);
                    if (!noteHealthSyncClaimFailure().allowed) {
                        c.get("hsNote").alert = "claim_failures_high";
                    }
                    return fail(c, 400, "invalid_code", MESSAGES.invalid_code);
                }
                clearAuthFailures(getClientIp(c));
                const userId = pending.user_id;

                // The start date only: which zone each day is bucketed in is
                // decided again on every /pending. A profile read failing
                // here would otherwise throw away a claim already spent, so
                // it falls back to the phone's zone, at worst one day off.
                let profileTz: string | null = null;
                try {
                    profileTz = await data.getProfileTimezone(userId);
                } catch {
                    profileTz = null;
                }
                const { tz } = effectiveTimezone(profileTz, pending.tz);
                const token = `${HEALTH_SYNC_TOKEN_PREFIX}${newOpaqueToken()}`;
                await io(
                    store.replaceLink(
                        userId,
                        {
                            fields: pending.fields,
                            fallbackTz: pending.tz,
                            syncStartDate: syncStartDate(
                                at,
                                tz,
                                pending.backfill_days,
                            ),
                            expiresAt: linkExpiresAt(at, at).toISOString(),
                        },
                        token,
                    ),
                );
                // Where the shortcut sends the token from now on: the
                // configured origin, never one a request header named.
                return ok(c, { token, site });
            } catch (err) {
                return failFromError(c, err);
            }
        },
    );

    // ---- GET /pending ----
    router.get(
        `${API}/pending`,
        logged("pending"),
        banGuard,
        linkAuth,
        async (c) => {
            const link = c.get("hsLink");
            const userId = link.user_id;
            const at = new Date(now());
            let leaseUntil: string | null = null;
            try {
                const profileTz = await io(data.getProfileTimezone(userId));
                const { tz, source } = effectiveTimezone(
                    profileTz,
                    link.fallback_tz,
                );

                leaseUntil = new Date(
                    at.getTime() + HEALTH_SYNC_LEASE_SECONDS * 1000,
                ).toISOString();
                const leased = await io(
                    store.acquireLease(userId, leaseUntil, at),
                );
                if (!leased) {
                    leaseUntil = null;
                    return fail(c, 409, "busy", MESSAGES.busy);
                }

                const fields = linkFields(link);
                // Sync now, run by hand: stuck entries get a fresh set of
                // offers (see PendingInput.retryStuck).
                const manual = c.req.query("mode") === "manual";
                const win = offeringWindow(at, tz, link.sync_start_date);
                let plan = {
                    entries: [] as ReturnType<typeof planPending>["entries"],
                    notices: [] as string[],
                    syncedThrough: null as string | null,
                };
                if (win.from !== null) {
                    const from = win.from;
                    // Fail closed: if any read fails, nothing is computed,
                    // offered or written — a partial read would offer a day's
                    // total that is too low, and Health cannot lower it.
                    const [meals, water, days] = await Promise.all([
                        io(data.getMeals(userId, from, win.to, tz)),
                        fields.includes("water_ml")
                            ? io(data.getWater(userId, from, win.to, tz))
                            : Promise.resolve([] as HealthSyncWater[]),
                        io(store.getDays(userId, from, win.to)),
                    ]);
                    const totals = computeDayTotals(
                        meals,
                        water,
                        tz,
                        win.dates,
                    );
                    const ledger = days.map(toLedger);
                    const p = planPending({
                        dates: win.dates,
                        totals,
                        ledger,
                        fields,
                        tz,
                        retryStuck: manual,
                    });
                    // Offer counts and notices are recorded before anything
                    // is offered, so a notice is shown once and a stuck
                    // entry stops being offered. Only those columns, and
                    // only onto a row still as it was read: an ack landing
                    // in between (from a run whose lease lapsed) must not be
                    // undone, and a day whose row moved on is not offered.
                    const written = await io(
                        recordOffers(store, userId, ledger, p.ledgerUpdates),
                    );
                    plan = {
                        ...p,
                        entries: p.entries.filter((e) => written.has(e.date)),
                    };
                }

                const note = c.get("hsNote");
                note.entries = plan.entries.length;
                note.notices = plan.notices.length;
                return ok(c, {
                    version: 1,
                    complete: true,
                    timezone: tz,
                    timezone_source: source,
                    lease_until: leaseUntil,
                    entries: plan.entries,
                    notices: plan.notices,
                    status: {
                        synced_through: plan.syncedThrough,
                        next_day_ready_at: formatInstantWithOffset(
                            win.nextDayReadyAt,
                            tz,
                        ),
                    },
                });
            } catch (err) {
                // Hand the lease back so the retry the message suggests is
                // not refused as busy. Only this run's lease.
                if (leaseUntil !== null) {
                    void store.releaseLease(userId, leaseUntil).catch(() => {});
                }
                return failFromError(c, err);
            }
        },
    );

    // ---- POST /ack ----
    router.post(`${API}/ack`, logged("ack"), banGuard, linkAuth, async (c) => {
        const link = c.get("hsLink");
        const userId = link.user_id;
        try {
            const json = await readJson(c);
            if (!json) {
                return fail(
                    c,
                    400,
                    "bad_request",
                    "The request body must be JSON.",
                );
            }
            const parsed = parseAckBody(json.value, linkFields(link));
            if (!parsed.ok) {
                return fail(c, 400, "bad_request", parsed.message);
            }
            const { entries, done } = parsed.value;
            const at = new Date(now());

            let applied = 0;
            if (entries.length > 0) {
                const profileTz = await io(data.getProfileTimezone(userId));
                const { tz } = effectiveTimezone(profileTz, link.fallback_tz);
                // Only dates /pending can have offered: anything else (a
                // future date, a day long gone) is skipped, so no ledger row
                // ever lands outside what the 8-day sweep removes.
                const win = ackWindow(at, tz, link.sync_start_date);
                const eligible = win
                    ? entries.filter(
                          (e) => e.date >= win.from && e.date <= win.to,
                      )
                    : [];
                const dates = eligible.map((e) => e.date).sort();
                const existing =
                    dates.length > 0
                        ? await io(
                              store.getDays(
                                  userId,
                                  dates[0]!,
                                  dates[dates.length - 1]!,
                              ),
                          )
                        : [];
                // As read: the state each guarded write below requires.
                const before = new Map(
                    existing.map((r) => [r.date, toLedger(r)]),
                );
                const rows = new Map(before);
                const appliedByDate = new Map<string, number>();
                // In order, against the row as each earlier entry left
                // it, so t1 and t2 for one day in one batch both apply. A
                // day with no row was never offered, so its ack is skipped.
                for (const entry of eligible) {
                    const row = rows.get(entry.date);
                    if (!row) continue;
                    const r = applyAck(row, entry, tz, at);
                    if (r.applied && r.row) {
                        rows.set(entry.date, r.row);
                        appliedByDate.set(
                            entry.date,
                            (appliedByDate.get(entry.date) ?? 0) + 1,
                        );
                    }
                }
                // One conditional write per day, onto the row as it was
                // read; a day another run changed in between counts as
                // skipped, and the next /pending re-offers what is missing.
                // `notified` is /pending's and is never written here.
                const results = await Promise.all(
                    [...appliedByDate].map(async ([date, n]) => {
                        const r = rows.get(date)!;
                        const b = before.get(date)!;
                        const ok = await io(
                            store.updateDay(
                                userId,
                                date,
                                {
                                    timezone: r.timezone,
                                    sent_values: r.sent_values as Record<
                                        string,
                                        number
                                    >,
                                    topup_seq: r.topup_seq,
                                    offer_count: r.offer_count,
                                    first_sent_at: r.first_sent_at,
                                    last_sent_at: r.last_sent_at,
                                },
                                {
                                    topup_seq: b.topup_seq,
                                    sentNull: b.sent_values === null,
                                },
                            ),
                        );
                        return ok ? n : 0;
                    }),
                );
                applied = results.reduce((a, n) => a + n, 0);
                if (applied > 0) {
                    await io(store.setLastSync(userId, at.toISOString()));
                }
            }
            // Only the lease this run took: a late ack from a run whose
            // lease lapsed must not free the one a newer run now holds.
            if (done && parsed.value.lease_until !== undefined) {
                await io(store.releaseLease(userId, parsed.value.lease_until));
            }

            c.get("hsNote").entries = entries.length;
            return ok(c, { applied, skipped: entries.length - applied });
        } catch (err) {
            return failFromError(c, err);
        }
    });

    // ---- POST /revoke ----
    router.post(
        `${API}/revoke`,
        logged("revoke"),
        banGuard,
        linkAuth,
        async (c) => {
            try {
                await io(store.deleteLink(c.get("hsLink").user_id));
                return ok(c, {});
            } catch (err) {
                return failFromError(c, err);
            }
        },
    );

    // ---- anything else under the API ----
    //
    // A wrong method or a mistyped path still answers in the envelope, so the
    // shortcut's `ok` branch can show the message rather than a bare 404.
    const unknownApi = async (c: Context<Env>) => {
        const known = API_METHODS[c.req.path];
        if (known) {
            return fail(
                c,
                405,
                "bad_request",
                `${c.req.path} takes ${known}, not ${c.req.method}.`,
                { headers: { Allow: known } },
            );
        }
        return fail(c, 404, "bad_request", "Unknown endpoint.");
    };
    router.all(API, logged("unknown"), unknownApi);
    router.all(`${API}/*`, logged("unknown"), unknownApi);

    return router;
}

/** Each API path's one method, for the catch-all's 405. */
const API_METHODS: Record<string, string> = {
    [`${API}/start`]: "POST",
    [`${API}/claim`]: "POST",
    [`${API}/pending`]: "GET",
    [`${API}/ack`]: "POST",
    [`${API}/revoke`]: "POST",
};
