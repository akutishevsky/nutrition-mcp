// Sign-in and sessions for the web dashboard (/dashboard).
//
// There is no sign-in form here. GET /dashboard/login starts an OAuth flow as
// the built-in client DASHBOARD_CLIENT_ID through the ordinary /authorize, so
// the password and Google legs, the browser-binding cookie and the consent
// notice are the same hardened flow every MCP client goes through (exactly how
// the Apple Health pairing signs in; see src/health-sync-routes.ts). The
// server holds the PKCE verifier itself, and GET /dashboard/callback redeems
// the code straight from the OAuth store (never at /token, which refuses this
// client) and opens a dashboard session: a cookie, never an access token.
//
// Two cookies, never one value reused:
// - a start cookie per flow (nm_dash_start_<16 hex>), set by /dashboard/login
//   and required at /dashboard/callback. It IS the started flow: its value is
//   `<PKCE verifier>.<locale>.<expiry ms>`, and the flow's `state` is
//   hashSecret("dashboard-state:" + value), so the callback rebuilds the flow
//   from the cookie and checks it against the state, with nothing held in
//   server memory (a flood of starts cannot evict anyone's flow, and any
//   replica can finish it). No server secret seals it: the browser can only
//   hold values that hash to a state, and whoever could forge one could as
//   well start a real flow. The /authorize binding cookie is cleared before
//   its redirect, so it cannot guard the callback. Without this one, someone
//   who started a flow in their own browser could hand the callback link (with
//   their code) to a victim and sign the victim into the attacker's account
//   (login CSRF), or a victim sent the attacker's /authorize link would finish
//   it in their own browser. A callback that arrives without the matching
//   cookie spends its code, so a code that reached the wrong browser cannot
//   be replayed in the one that holds the cookie.
// - the session cookie (__Host-nm_dash on https, nm_dash on plain-http local
//   dev, which cannot hold a Secure cookie): `nmds_` + 32 random bytes,
//   HttpOnly, SameSite=Lax, Path=/. Only hashSecret(raw) is stored, in
//   dashboard_sessions. Idle expiry 7 days, slid at most hourly; absolute
//   expiry 30 days after sign-in.
//
// The CSRF value for POST /dashboard/logout is derived from the cookie, never
// stored: hashSecret("dashboard-csrf:" + raw). It is stable across tabs and
// unknowable without the HttpOnly cookie; GET /api/dashboard/session hands it
// to the page script, and logout also requires a same-origin Origin header.
//
// Failed cookie lookups are throttled (src/rate-limit.ts): a well-formed
// cookie no session matches costs a database read, so past
// DASHBOARD_LOOKUP_FAILURE_LIMIT of those in a minute from one IP, or
// DASHBOARD_LOOKUP_FAILURE_GLOBAL_LIMIT from every IP together, lookups answer
// 429 before the read. The per-IP key trusts a spoofable x-forwarded-for, so
// the process-wide budget is what actually bounds the reads. Each lookup is
// reserved against both budgets before its read and refunded once it proves
// valid, so a concurrent burst cannot overrun them and live sessions never
// spend them. So that a flood spending them cannot sign anyone out, a session
// this process has seen valid (DashboardSessionCache below: every successful
// lookup, and every session the callback creates) still passes while either
// gate is shut: within DASHBOARD_SESSION_CACHE_TTL_MS of its last validation
// with no read, and after that by a revalidating read outside the budget,
// which refreshes the entry. A forged cookie cannot reach that read (its hash
// is in no entry), so those reads are bounded by real sessions. Only cookies
// this process has never validated get the 429. Outside a throttle the cache
// is never consulted, so it changes nothing; inside one, a sign-out on another
// replica takes up to the TTL to reach this one.
//
// Logs: one `[dashboard] route=<login|callback|logout|session> result=<code>`
// line per call. Never a cookie, token, hash, state, verifier, code, user id
// or email.
import { Hono, type Context, type MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import crypto from "node:crypto";
import {
    DASHBOARD_CALLBACK_PATH,
    DASHBOARD_CLIENT_ID,
    DASHBOARD_SESSION_PREFIX,
    dashboardCallbackUrl,
} from "./dashboard-client.js";
import {
    supabaseDashboardSessionStore,
    type DashboardSessionStore,
} from "./dashboard-session-store.js";
import { createSupabaseOAuthStore, type OAuthStore } from "./oauth-store.js";
import { pkceS256, verifierMatchesChallenge } from "./oauth-validate.js";
import { hashSecret, newOpaqueToken } from "./token-hash.js";
import { getBaseUrl } from "./url.js";
import { issuerFor } from "./discovery.js";
import { getClientIp, rateLimitAuth } from "./middleware.js";
import {
    checkDashboardRateLimit,
    noteDashboardLookupFailure,
    refundDashboardLookup,
    reserveDashboardLookup,
} from "./rate-limit.js";
import { HTML_LANG, SITE_LOCALES, pathFor, type SiteLocale } from "./routes.js";
import { LOGIN, LOGIN_ERRORS } from "./copy/login.js";
import { DASHBOARD } from "./copy/dashboard.js";
import {
    getProfile,
    localeFromProfile,
    timezoneFromProfile,
} from "./supabase.js";
import { escapeHtml } from "./html-escape.js";

export {
    DASHBOARD_CALLBACK_PATH,
    DASHBOARD_CLIENT_ID,
    DASHBOARD_SESSION_PREFIX,
    dashboardCallbackUrl,
};

declare module "hono" {
    interface ContextVariableMap {
        // Set by dashboardSession() on a valid session cookie.
        dashboardUserId: string;
        // The one log line's result, filled in by this router's handlers.
        dashboardAuthNote: { result?: string };
    }
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** A session unused this long is over. Slid at most once an hour. */
export const DASHBOARD_SESSION_IDLE_MS = 7 * DAY_MS;
/** However often it is used, a session ends this long after sign-in. */
export const DASHBOARD_SESSION_ABSOLUTE_MS = 30 * DAY_MS;
/** last_seen_at / expires_at are rewritten at most this often. */
export const DASHBOARD_SESSION_TOUCH_MS = HOUR_MS;
/** How long a started sign-in may take, like the /authorize session. */
export const DASHBOARD_SIGN_IN_TTL_MS = 10 * MINUTE_MS;

// Live start cookies one browser may carry, as MAX_BINDING_COOKIES in
// src/oauth.ts: past it the login route clears them all before adding its own.
const MAX_START_COOKIES = 10;

const SESSION_COOKIE = "nm_dash";
const START_COOKIE_PREFIX = "nm_dash_start_";
const START_COOKIE_NAME = /^(?:__Host-)?nm_dash_start_[0-9a-f]{16}$/;
// The flow's state: hashSecret() of the start cookie's value.
const STATE = /^[0-9a-f]{64}$/;
// The start cookie: `<verifier>.<locale>.<expiry ms>`, the verifier being
// newOpaqueToken() (32 random bytes in base64url).
const START_VALUE = /^([A-Za-z0-9_-]{43})\.([a-z]{2})\.(\d{1,15})$/;
const SESSION_VALUE = new RegExp(
    `^${DASHBOARD_SESSION_PREFIX}[A-Za-z0-9_-]{43}$`,
);

const NO_STORE = "no-store";
const API_NO_STORE = "private, no-store";

export interface DashboardAuthDeps {
    store?: DashboardSessionStore;
    oauthStore?: OAuthStore;
    now?: () => number;
    /** Per-user limiter for GET /api/dashboard/session (the API's own
     * bucket). Defaults to checkDashboardRateLimit. */
    rateLimit?: (userId: string) => {
        allowed: boolean;
        retryAfterSeconds?: number;
    };
    /** The signed-in user's saved locale and timezone, for the session
     * endpoint. Defaults to the profiles row. */
    profile?: (
        userId: string,
    ) => Promise<{ locale: string | null; timezone: string | null }>;
    /** Recently validated sessions, consulted only while failed lookups are
     * throttled. Defaults to one cache shared by the whole process. */
    sessionCache?: DashboardSessionCache;
}

// ---------- paths ----------

const LOCALE_DASHBOARD_PATHS = new Set(
    SITE_LOCALES.filter((l) => l !== "en").map((l) => `/${l}/dashboard`),
);

/** Every path the dashboard owns: the pages, its sign-in routes and its JSON
 * API. src/index.ts keeps these out of the global CORS middleware. */
export function isDashboardPath(path: string): boolean {
    return (
        path === "/dashboard" ||
        path.startsWith("/dashboard/") ||
        LOCALE_DASHBOARD_PATHS.has(path) ||
        path === "/api/dashboard" ||
        path.startsWith("/api/dashboard/")
    );
}

/** The unauthenticated sign-in routes this router throttles per IP with
 * rateLimitAuth (the same 30/min bucket as the OAuth endpoints). */
export const DASHBOARD_AUTH_PATHS = [
    "/dashboard/login",
    DASHBOARD_CALLBACK_PATH,
    "/dashboard/logout",
] as const;

function localeParam(value: unknown): SiteLocale {
    return (SITE_LOCALES as readonly unknown[]).includes(value)
        ? (value as SiteLocale)
        : "en";
}

/** Where a signed-in browser lands: /dashboard, or /{locale}/dashboard. */
export function dashboardPath(locale: SiteLocale): string {
    return pathFor(locale, "/dashboard");
}

// ---------- cookies ----------

function isSecure(c: Context): boolean {
    return getBaseUrl(c).startsWith("https:");
}

function cookieOptions(c: Context) {
    return {
        httpOnly: true,
        sameSite: "Lax" as const,
        path: "/",
        ...(isSecure(c) ? { secure: true, prefix: "host" as const } : {}),
    };
}

function readSessionCookie(c: Context): string | undefined {
    const value = isSecure(c)
        ? getCookie(c, SESSION_COOKIE, "host")
        : getCookie(c, SESSION_COOKIE);
    return value && SESSION_VALUE.test(value) ? value : undefined;
}

function hasSessionCookie(c: Context): boolean {
    return (
        (isSecure(c)
            ? getCookie(c, SESSION_COOKIE, "host")
            : getCookie(c, SESSION_COOKIE)) !== undefined
    );
}

function setSessionCookie(c: Context, token: string): void {
    setCookie(c, SESSION_COOKIE, token, {
        ...cookieOptions(c),
        maxAge: Math.floor(DASHBOARD_SESSION_ABSOLUTE_MS / 1000),
    });
}

function clearSessionCookie(c: Context): void {
    deleteCookie(c, SESSION_COOKIE, cookieOptions(c));
}

// Named after the flow's state, hashed, so neither the state nor a value
// derived 1:1 from it lands in a cookie jar, and two flows started together
// (a double click) cannot overwrite each other's cookie.
function startCookieName(state: string): string {
    return START_COOKIE_PREFIX + hashSecret(state).slice(0, 16);
}

/** The state a start cookie's value stands for. */
export function dashboardStateFor(startValue: string): string {
    return hashSecret(`dashboard-state:${startValue}`);
}

interface StartedFlow {
    verifier: string;
    locale: SiteLocale;
    expiresAt: number;
}

/** Sets a new flow's start cookie and returns its state and verifier. */
function startFlow(
    c: Context,
    locale: SiteLocale,
    expiresAt: number,
): { state: string; verifier: string } {
    const held = Object.keys(getCookie(c)).filter((name) =>
        START_COOKIE_NAME.test(name),
    );
    if (held.length >= MAX_START_COOKIES) {
        for (const name of held) {
            deleteCookie(c, name.replace(/^__Host-/, ""), cookieOptions(c));
        }
    }
    const verifier = newOpaqueToken();
    const value = `${verifier}.${locale}.${expiresAt}`;
    const state = dashboardStateFor(value);
    setCookie(c, startCookieName(state), value, {
        ...cookieOptions(c),
        maxAge: Math.floor(DASHBOARD_SIGN_IN_TTL_MS / 1000),
    });
    return { state, verifier };
}

/** The flow this browser started for `state`, rebuilt from its start cookie;
 * undefined when it holds none, or one that does not hash to the state. */
function readStartedFlow(c: Context, state: string): StartedFlow | undefined {
    const name = startCookieName(state);
    const value = isSecure(c) ? getCookie(c, name, "host") : getCookie(c, name);
    if (!value) return undefined;
    const m = START_VALUE.exec(value);
    if (!m || !hashesEqual(dashboardStateFor(value), state)) return undefined;
    const locale = m[2]!;
    if (!(SITE_LOCALES as readonly string[]).includes(locale)) return undefined;
    return {
        verifier: m[1]!,
        locale: locale as SiteLocale,
        expiresAt: Number(m[3]),
    };
}

function clearStartCookie(c: Context, state: string): void {
    deleteCookie(c, startCookieName(state), cookieOptions(c));
}

function hashesEqual(a: string, b: string): boolean {
    const x = Buffer.from(a, "utf8");
    const y = Buffer.from(b, "utf8");
    return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// ---------- sessions ----------

/** The CSRF value for a session cookie: derived, never stored. */
export function dashboardCsrf(rawToken: string): string {
    return hashSecret(`dashboard-csrf:${rawToken}`);
}

/** How long a validated session may pass a throttled lookup without a read
 * (past it, a throttled lookup revalidates it with a read instead). Also the
 * longest a sign-out on another replica (or an account deletion) goes unseen
 * here, and only while lookups are throttled. */
export const DASHBOARD_SESSION_CACHE_TTL_MS = MINUTE_MS;
/** Entries held at most; past it the oldest goes first. */
export const DASHBOARD_SESSION_CACHE_MAX = 10_000;

interface CachedSession {
    userId: string;
    // When this process last read the row and found it valid.
    validatedAt: number;
    // The row's own expiries as of that read: never trusted past either.
    expiresAt: number;
    absoluteExpiresAt: number;
}

/** Sessions this process has seen valid, keyed by hashSecret(token), so that
 * a throttled lookup can still let a signed-in browser through: without a
 * database read within the TTL (`get`), and with a revalidating read outside
 * the failed-lookup budget after it (`known`). An entry is kept past the TTL
 * until the row's own cached expiries, or eviction. Positive entries only: an
 * invalid lookup caches nothing and drops the entry. Never holds the raw
 * token. */
export class DashboardSessionCache {
    private readonly entries = new Map<string, CachedSession>();

    constructor(
        private readonly ttlMs = DASHBOARD_SESSION_CACHE_TTL_MS,
        private readonly max = DASHBOARD_SESSION_CACHE_MAX,
    ) {}

    remember(token: string, entry: CachedSession): void {
        const key = hashSecret(token);
        this.entries.delete(key);
        while (this.entries.size >= this.max) {
            const oldest = this.entries.keys().next().value;
            if (oldest === undefined) break;
            this.entries.delete(oldest);
        }
        this.entries.set(key, entry);
    }

    /** The user id for a session validated within the TTL whose row had not
     * yet expired as of `now`; undefined otherwise. An entry past the TTL is
     * kept (see `known`); one past the row's expiry is dropped. */
    get(token: string, now: number): string | undefined {
        const e = this.live(token, now);
        if (!e) return undefined;
        if (!(now - e.validatedAt < this.ttlMs) || !(now >= e.validatedAt)) {
            return undefined;
        }
        return e.userId;
    }

    /** Whether this process has seen the session valid and the row's cached
     * expiries have not passed as of `now`, TTL or not: such a token may
     * spend a revalidating read while lookups are throttled. */
    known(token: string, now: number): boolean {
        return this.live(token, now) !== undefined;
    }

    private live(token: string, now: number): CachedSession | undefined {
        const key = hashSecret(token);
        const e = this.entries.get(key);
        if (!e) return undefined;
        if (!(e.expiresAt > now) || !(e.absoluteExpiresAt > now)) {
            this.entries.delete(key);
            return undefined;
        }
        return e;
    }

    forget(token: string): void {
        this.entries.delete(hashSecret(token));
    }

    get size(): number {
        return this.entries.size;
    }
}

const processSessionCache = new DashboardSessionCache();

type Resolved =
    | { status: "valid"; userId: string; token: string }
    | { status: "none" }
    | { status: "invalid" }
    | { status: "unavailable" }
    | { status: "throttled"; retryAfterSeconds: number };

async function resolveSession(
    c: Context,
    store: DashboardSessionStore,
    cache: DashboardSessionCache,
    now: number,
): Promise<Resolved> {
    const token = readSessionCookie(c);
    if (!token)
        return hasSessionCookie(c) ? { status: "invalid" } : { status: "none" };
    // Malformed cookies are refused above without a read; a well-formed one
    // spends a lookup. It is reserved against this IP's failed-lookup budget
    // and the process-wide one BEFORE the read, so a concurrent burst cannot
    // get past them, and handed back below unless it fails. While either is
    // spent, a session this process has seen valid still passes: within the
    // TTL with no read, past it with a read outside the budget (a forged
    // cookie's hash is in no entry, so it never gets that far).
    const ip = getClientIp(c);
    const reservation = reserveDashboardLookup(ip);
    if (!reservation.allowed) {
        const userId = cache.get(token, now);
        if (userId !== undefined) return { status: "valid", userId, token };
        if (!cache.known(token, now)) {
            return {
                status: "throttled",
                retryAfterSeconds: reservation.retryAfterSeconds ?? 60,
            };
        }
    }
    const reservedAt = reservation.at;
    // A lookup that did not fail gives its reservation back; one made without
    // a reservation (a throttled revalidation) is counted only if it fails.
    const settle = (failed: boolean) => {
        if (reservedAt !== undefined) {
            if (!failed) refundDashboardLookup(ip, reservedAt);
        } else if (failed) {
            noteDashboardLookupFailure(ip);
        }
    };
    let lookup;
    try {
        lookup = await store.lookup(token, new Date(now).toISOString());
    } catch {
        settle(false);
        return { status: "unavailable" };
    }
    if (lookup.status === "unavailable") {
        settle(false);
        return { status: "unavailable" };
    }
    if (lookup.status === "invalid") {
        cache.forget(token);
        settle(true);
        return { status: "invalid" };
    }
    const row = lookup.session;
    const absolute = Date.parse(row.absolute_expires_at);
    // The store's query already requires both expiries in the future; checked
    // again here so a store that forgot cannot extend a session.
    if (!(Date.parse(row.expires_at) > now) || !(absolute > now)) {
        cache.forget(token);
        settle(true);
        return { status: "invalid" };
    }
    settle(false);
    const lastSeen = Date.parse(row.last_seen_at);
    let expiresAt = Date.parse(row.expires_at);
    if (!(now - lastSeen < DASHBOARD_SESSION_TOUCH_MS)) {
        const slid = Math.min(now + DASHBOARD_SESSION_IDLE_MS, absolute);
        try {
            await store.touch(
                row.id,
                new Date(now).toISOString(),
                new Date(slid).toISOString(),
            );
            expiresAt = slid;
        } catch {
            // A missed slide costs at most an earlier expiry; the read itself
            // succeeded, so this request goes on.
        }
    }
    cache.remember(token, {
        userId: row.user_id,
        validatedAt: now,
        expiresAt,
        absoluteExpiresAt: absolute,
    });
    return { status: "valid", userId: row.user_id, token };
}

function defaults(deps: DashboardAuthDeps) {
    return {
        store: deps.store ?? supabaseDashboardSessionStore,
        cache: deps.sessionCache ?? processSessionCache,
        now: deps.now ?? Date.now,
    };
}

/** Thrown by readDashboardUserId when the session store cannot answer. */
export class DashboardSessionUnavailableError extends Error {
    constructor() {
        super("dashboard session store unavailable");
        this.name = "DashboardSessionUnavailableError";
    }
}

/** Thrown by readDashboardUserId when failed cookie lookups are over budget
 * (this IP's DASHBOARD_LOOKUP_FAILURE_LIMIT or the process-wide
 * DASHBOARD_LOOKUP_FAILURE_GLOBAL_LIMIT) and the session is not one this
 * process has seen valid (DashboardSessionCache): the page answers 429. */
export class DashboardSessionThrottledError extends Error {
    constructor(readonly retryAfterSeconds: number) {
        super("dashboard session lookups throttled");
        this.name = "DashboardSessionThrottledError";
    }
}

/** The signed-in user's id for this request's session cookie, or null (no
 * cookie, an unknown or expired one). Throws DashboardSessionUnavailableError
 * when the store cannot answer: an outage is not "signed out", so the page
 * route answers 503 instead of sending the browser to sign in; and
 * DashboardSessionThrottledError when the lookup was refused (see above).
 * Slides the idle expiry like every other read. For the page routes'
 * redirect decision. */
export async function readDashboardUserId(
    c: Context,
    deps: DashboardAuthDeps = {},
): Promise<string | null> {
    const { store, cache, now } = defaults(deps);
    const r = await resolveSession(c, store, cache, now());
    if (r.status === "unavailable")
        throw new DashboardSessionUnavailableError();
    if (r.status === "throttled")
        throw new DashboardSessionThrottledError(r.retryAfterSeconds);
    return r.status === "valid" ? r.userId : null;
}

function unauthenticated(c: Context): Response {
    if (hasSessionCookie(c)) clearSessionCookie(c);
    c.header("Cache-Control", API_NO_STORE);
    return c.json(
        { ok: false, error: "unauthenticated", message: "Sign in again." },
        401,
    );
}

function unavailable(
    c: Context,
    extra: Record<string, unknown> = {},
): Response {
    c.header("Cache-Control", API_NO_STORE);
    return c.json(
        {
            ok: false,
            error: "unavailable",
            message:
                "The dashboard can't be reached right now. Try again shortly.",
            ...extra,
        },
        503,
    );
}

function throttled(c: Context, retryAfterSeconds: number): Response {
    c.header("Cache-Control", API_NO_STORE);
    c.header("Retry-After", String(retryAfterSeconds));
    return c.json(
        {
            ok: false,
            error: "rate_limited",
            message: `Too many requests. Try again in ${retryAfterSeconds} seconds.`,
        },
        429,
    );
}

/** Cookie-only authentication for /api/dashboard/*. Never reads a Bearer
 * header. On a valid session sets c.var.dashboardUserId; on none answers 401
 * `unauthenticated` (clearing a dead cookie); when the store cannot answer,
 * 503 `unavailable` rather than a 401, so an outage does not sign anyone
 * out. Writes no log line: the route behind it writes the one line. */
export function dashboardSession(
    deps: DashboardAuthDeps = {},
): MiddlewareHandler {
    const { store, cache, now } = defaults(deps);
    return async (c, next) => {
        const r = await resolveSession(c, store, cache, now());
        if (r.status === "unavailable") return unavailable(c);
        if (r.status === "throttled") return throttled(c, r.retryAfterSeconds);
        if (r.status !== "valid") return unauthenticated(c);
        c.set("dashboardUserId", r.userId);
        await next();
    };
}

// ---------- router ----------

const FAILURE_CSP =
    "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

// One generic, translated page for every failed callback: the reason is in
// the log line, never on the page (it may be someone else's flow). The link
// starts a fresh sign-in.
function failurePage(
    c: Context,
    status: 400 | 410 | 500 | 503,
    locale: SiteLocale,
    result: string,
): Response {
    c.get("dashboardAuthNote").result = result;
    const doc = LOGIN[locale];
    const message = LOGIN_ERRORS[locale].signInFailed;
    const again = `/dashboard/login${locale === "en" ? "" : `?locale=${locale}`}`;
    const html = `<!doctype html>
<html lang="${HTML_LANG[locale]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(doc.title)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1.5rem;line-height:1.5}a{font-weight:700}</style>
</head>
<body>
<main>
<h1>${escapeHtml(doc.title)}</h1>
<p role="alert">${escapeHtml(message)}</p>
<p><a href="${escapeHtml(again)}">${escapeHtml(doc.signInButton)}</a></p>
</main>
</body>
</html>`;
    return c.html(html, status, {
        "Cache-Control": NO_STORE,
        "Content-Security-Policy": FAILURE_CSP,
        "X-Robots-Tag": "noindex, nofollow",
    });
}

const SIGN_OUT_FAILED_CSP =
    "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

// Sign-out did not end the session: say so, keep the cookie, and offer the
// same form again (same-origin Referrer-Policy, so the retry carries a real
// Origin). 503 when the row could not be deleted (or looked up); 403 when a
// same-origin form post carried a stale or missing csrf (a tab left open
// across a sign-in elsewhere), with a fresh one derived from the cookie the
// browser holds now, so one click signs out. Only ever rendered after the
// same-origin check: a page carrying a csrf never answers a cross-site post.
function signOutFailedPage(
    c: Context,
    locale: SiteLocale,
    csrf: string,
    status: 403 | 429 | 503 = 503,
    result = "unavailable",
    retryAfterSeconds = 30,
): Response {
    c.get("dashboardAuthNote").result = result;
    const doc = DASHBOARD[locale];
    const html = `<!doctype html>
<html lang="${HTML_LANG[locale]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(doc.meta.title)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1.5rem;line-height:1.5}button{font:inherit;font-weight:700}</style>
</head>
<body>
<main>
<h1>${escapeHtml(doc.signOut)}</h1>
<p role="alert">${escapeHtml(doc.signOutFailed)}</p>
<form method="post" action="/dashboard/logout">
<input type="hidden" name="csrf" value="${escapeHtml(csrf)}">
<input type="hidden" name="locale" value="${escapeHtml(locale)}">
<button type="submit">${escapeHtml(doc.error.retry)}</button>
</form>
</main>
</body>
</html>`;
    return c.html(html, status, {
        "Cache-Control": NO_STORE,
        "Content-Security-Policy": SIGN_OUT_FAILED_CSP,
        "Referrer-Policy": "same-origin",
        ...(status === 403 ? {} : { "Retry-After": String(retryAfterSeconds) }),
        "X-Robots-Tag": "noindex, nofollow",
    });
}

// Writes the route's one log line once the handler (or the rate limiter) has
// answered. A handler names its result; anything it did not name is read off
// the status.
function logged(route: string): MiddlewareHandler {
    return async (c, next) => {
        const note: { result?: string } = {};
        c.set("dashboardAuthNote", note);
        let threw = false;
        try {
            await next();
        } catch (err) {
            threw = true;
            throw err;
        } finally {
            const status = threw ? 500 : c.res.status;
            const result =
                note.result ??
                (status === 429
                    ? "rate_limited"
                    : status < 400
                      ? "ok"
                      : "server_error");
            const line = `[dashboard] route=${route} result=${result}`;
            if (result === "ok") console.log(line);
            else console.warn(line);
        }
    };
}

export function createDashboardAuthRouter(deps: DashboardAuthDeps = {}): Hono {
    const router = new Hono();
    const { store, cache, now } = defaults(deps);
    const oauthStore = deps.oauthStore ?? createSupabaseOAuthStore();
    const rateLimit = deps.rateLimit ?? checkDashboardRateLimit;
    const profile =
        deps.profile ??
        (async (userId: string) => {
            const p = await getProfile(userId);
            return {
                locale: localeFromProfile(p),
                timezone: timezoneFromProfile(p),
            };
        });

    // A code that reached a browser which cannot finish its flow is spent,
    // so it cannot be carried to the browser that can. Errors are ignored:
    // the request is refused either way.
    const spend = async (code: string | undefined) => {
        if (!code) return;
        try {
            await oauthStore.consumeAuthCode(code);
        } catch {
            // The code lapses on its own TTL.
        }
    };

    // Ahead of each route's limiter so its 429 is logged too.
    router.use("/dashboard/login", logged("login"));
    router.use(DASHBOARD_CALLBACK_PATH, logged("callback"));
    router.use("/dashboard/logout", logged("logout"));
    router.use("/api/dashboard/session", logged("session"));
    for (const path of DASHBOARD_AUTH_PATHS) {
        router.use(path, rateLimitAuth);
    }

    // ---- GET /dashboard/login ----
    // A link, not a form: the dashboard page's signed-out redirect lands
    // here, and so does the sign-in link on any page.
    router.get("/dashboard/login", async (c) => {
        const at = now();
        const locale = localeParam(c.req.query("locale"));
        c.header("Cache-Control", NO_STORE);

        // Already signed in: nothing to start.
        const current = await resolveSession(c, store, cache, at);
        if (current.status === "valid") {
            c.get("dashboardAuthNote").result = "already_signed_in";
            return c.redirect(dashboardPath(locale), 303);
        }

        const { state, verifier } = startFlow(
            c,
            locale,
            at + DASHBOARD_SIGN_IN_TTL_MS,
        );
        const params = new URLSearchParams({
            response_type: "code",
            client_id: DASHBOARD_CLIENT_ID,
            redirect_uri: dashboardCallbackUrl(getBaseUrl(c)),
            state,
            code_challenge: pkceS256(verifier),
            code_challenge_method: "S256",
        });
        // /authorize falls back to English for a locale whose login page is
        // not built, so any SITE_LOCALES value is safe to pass.
        if (locale !== "en") params.set("locale", locale);
        c.get("dashboardAuthNote").result = "ok";
        return c.redirect(`/authorize?${params.toString()}`, 302);
    });

    // ---- GET /dashboard/callback ----
    router.get(DASHBOARD_CALLBACK_PATH, async (c) => {
        const at = now();
        const state = c.req.query("state") ?? "";
        const code = c.req.query("code") ?? "";
        if (!STATE.test(state)) {
            await spend(code);
            return failurePage(c, 400, "en", "bad_request");
        }
        // Only the browser that started this flow may finish it: the flow
        // lives in that browser's start cookie. Without it (another browser,
        // or a cookie the browser already dropped at expiry) the code is
        // spent and nothing else is touched.
        const flow = readStartedFlow(c, state);
        if (!flow) {
            await spend(code);
            return failurePage(c, 400, "en", "session_mismatch");
        }
        // Single use from here, whatever happens next.
        clearStartCookie(c, state);
        if (flow.expiresAt <= at) {
            await spend(code);
            return failurePage(c, 410, flow.locale, "expired");
        }

        if (c.req.query("error") !== undefined || code === "") {
            return failurePage(c, 400, flow.locale, "sign_in_failed");
        }
        const base = getBaseUrl(c);
        const iss = c.req.query("iss");
        if (iss !== undefined && iss !== issuerFor(base)) {
            return failurePage(c, 400, flow.locale, "sign_in_failed");
        }

        let auth;
        try {
            // Spent whatever the checks below decide, exactly as at /token.
            auth = await oauthStore.consumeAuthCode(code);
        } catch {
            return failurePage(c, 503, flow.locale, "unavailable");
        }
        if (
            !auth ||
            auth.client_id !== DASHBOARD_CLIENT_ID ||
            auth.redirect_uri !== dashboardCallbackUrl(base) ||
            !verifierMatchesChallenge(flow.verifier, auth.code_challenge) ||
            // No MCP resource: a dashboard code must never be one a future
            // change could turn into an MCP credential.
            auth.resource !== null
        ) {
            return failurePage(c, 400, flow.locale, "sign_in_failed");
        }

        const token = DASHBOARD_SESSION_PREFIX + newOpaqueToken();
        try {
            await store.create({
                token,
                userId: auth.user_id,
                createdAt: new Date(at).toISOString(),
                expiresAt: new Date(
                    at + DASHBOARD_SESSION_IDLE_MS,
                ).toISOString(),
                absoluteExpiresAt: new Date(
                    at + DASHBOARD_SESSION_ABSOLUTE_MS,
                ).toISOString(),
            });
        } catch {
            return failurePage(c, 503, flow.locale, "unavailable");
        }
        // The server just wrote this row, so the session is known valid here:
        // cached, a sign-in that finishes while lookups are throttled still
        // reaches the dashboard instead of looping back to sign in.
        cache.remember(token, {
            userId: auth.user_id,
            validatedAt: at,
            expiresAt: at + DASHBOARD_SESSION_IDLE_MS,
            absoluteExpiresAt: at + DASHBOARD_SESSION_ABSOLUTE_MS,
        });
        setSessionCookie(c, token);
        c.get("dashboardAuthNote").result = "ok";
        c.header("Cache-Control", NO_STORE);
        return c.redirect(dashboardPath(flow.locale), 303);
    });

    // ---- POST /dashboard/logout ----
    // A same-origin form post (the header's Sign out button). Requires the
    // request to be same-origin and the body's `csrf` to be the value derived
    // from the session cookie. Same-origin is the Origin header naming this
    // site, or, when a browser sends `Origin: null` (a form post from a page
    // whose Referrer-Policy is no-referrer, as the Fetch spec requires),
    // `Sec-Fetch-Site: same-origin`. `locale` (body or query) picks the
    // landing page to return to. The session ends only once its row is
    // deleted: if that fails the cookie stays and a retry page answers 503.
    // A same-origin browser form post whose csrf does not match (a tab left
    // open across a sign-in in another tab) gets the same retry page, 403,
    // carrying the csrf for the cookie the browser holds now; a JSON caller
    // keeps the JSON 403.
    router.post("/dashboard/logout", async (c) => {
        c.header("Cache-Control", NO_STORE);
        const forbidden = (result: string) => {
            c.get("dashboardAuthNote").result = result;
            return c.json(
                {
                    ok: false,
                    error: "forbidden",
                    message: "Sign out from the dashboard page.",
                },
                403,
            );
        };
        const origin = c.req.header("origin");
        const sameOrigin =
            origin === getBaseUrl(c) ||
            (origin === "null" &&
                c.req.header("sec-fetch-site") === "same-origin");
        if (!sameOrigin) {
            return forbidden("origin_mismatch");
        }

        let csrf: unknown;
        let bodyLocale: unknown;
        const type = (c.req.header("content-type") ?? "").toLowerCase();
        const isJson = type.includes("application/json");
        // A browser's form submission, which should land on a page, never
        // on raw JSON.
        const isFormPost =
            !isJson &&
            (type.includes("application/x-www-form-urlencoded") ||
                type.includes("multipart/form-data") ||
                (c.req.header("accept") ?? "").includes("text/html"));
        try {
            const body: Record<string, unknown> = isJson
                ? await c.req.json()
                : await c.req.parseBody();
            csrf = body?.csrf;
            bodyLocale = body?.locale;
        } catch {
            csrf = undefined;
        }
        const locale = localeParam(bodyLocale ?? c.req.query("locale"));
        const landing = pathFor(locale, "");

        const token = readSessionCookie(c);
        if (!token) {
            // Nothing to end. Any malformed cookie goes too.
            if (hasSessionCookie(c)) clearSessionCookie(c);
            c.get("dashboardAuthNote").result = "no_session";
            return c.redirect(landing, 303);
        }
        if (
            typeof csrf !== "string" ||
            !hashesEqual(csrf, dashboardCsrf(token))
        ) {
            if (!isFormPost) return forbidden("csrf_mismatch");
            // Same-origin was checked above, so handing this browser the
            // csrf for its own cookie is what GET /api/dashboard/session
            // does too. Only for a session that is still live: a dead
            // cookie has nothing left to end.
            const current = await resolveSession(c, store, cache, now());
            if (current.status === "valid") {
                return signOutFailedPage(
                    c,
                    locale,
                    dashboardCsrf(token),
                    403,
                    "csrf_mismatch",
                );
            }
            if (current.status === "unavailable") {
                return signOutFailedPage(c, locale, dashboardCsrf(token));
            }
            if (current.status === "throttled") {
                return signOutFailedPage(
                    c,
                    locale,
                    dashboardCsrf(token),
                    429,
                    "rate_limited",
                    current.retryAfterSeconds,
                );
            }
            clearSessionCookie(c);
            c.get("dashboardAuthNote").result = "no_session";
            return c.redirect(landing, 303);
        }
        try {
            await store.delete(token);
        } catch {
            // Not signed out: the row still opens the dashboard, so the
            // cookie stays (a retry can find it) and the page says so.
            return signOutFailedPage(c, locale, dashboardCsrf(token));
        }
        cache.forget(token);
        clearSessionCookie(c);
        c.get("dashboardAuthNote").result = "ok";
        return c.redirect(landing, 303);
    });

    // ---- GET /api/dashboard/session ----
    router.get("/api/dashboard/session", async (c) => {
        const r = await resolveSession(c, store, cache, now());
        if (r.status === "unavailable") {
            c.get("dashboardAuthNote").result = "unavailable";
            return unavailable(c);
        }
        if (r.status === "throttled") {
            c.get("dashboardAuthNote").result = "rate_limited";
            return throttled(c, r.retryAfterSeconds);
        }
        if (r.status !== "valid") {
            c.get("dashboardAuthNote").result = "unauthenticated";
            return unauthenticated(c);
        }
        const limit = rateLimit(r.userId);
        if (!limit.allowed) {
            c.get("dashboardAuthNote").result = "rate_limited";
            return throttled(c, limit.retryAfterSeconds ?? 60);
        }
        let prefs;
        try {
            prefs = await profile(r.userId);
        } catch {
            // The CSRF value needs only the cookie, so Sign out keeps working
            // through a profile outage.
            c.get("dashboardAuthNote").result = "unavailable";
            return unavailable(c, { csrf: dashboardCsrf(r.token) });
        }
        c.get("dashboardAuthNote").result = "ok";
        c.header("Cache-Control", API_NO_STORE);
        return c.json({
            ok: true,
            csrf: dashboardCsrf(r.token),
            locale: prefs.locale ?? "en",
            timezone: prefs.timezone ?? "UTC",
        });
    });

    return router;
}
