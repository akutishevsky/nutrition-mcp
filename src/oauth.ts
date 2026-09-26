import { Hono, type Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import crypto from "node:crypto";
import {
    createSupabaseOAuthStore,
    legacyClientFromEnv,
    sha256Hex,
    supabaseOAuthAuth,
    withLegacyClient,
    type OAuthAuth,
    type OAuthClient,
    type OAuthStore,
    type TokenEndpointAuthMethod,
} from "./oauth-store.js";
import {
    KNOWN_CLIENT_HOSTS,
    isLoopbackRedirect,
    isValidCodeChallenge,
    isValidCodeVerifier,
    normalizeResource,
    parseRedirectUri,
    pkceS256,
    redirectDisplay,
    redirectMatches,
    resourceAllowed,
    type RedirectKind,
} from "./oauth-validate.js";
import { getBaseUrl } from "./url.js";
import { issuerFor } from "./discovery.js";
import { rateLimitAuth } from "./middleware.js";
import {
    HTML_LANG,
    LOCALE_NAMES,
    SITE_LOCALES,
    TRANSLATION_NOTICE,
    type SiteLocale,
} from "./routes.js";
import {
    LOGIN_CLIENT_NOTICE,
    LOGIN_ERRORS,
    type LoginErrors,
} from "./copy/login.js";
import { chromeFor } from "./copy/chrome.js";

const SESSION_TTL_MS = 10 * 60 * 1000;

// Lifetime of an access token, in both its stored expires_at and the
// `expires_in` /token reports. Unchanged from before Phase A; Phase C
// shortens it.
export const ACCESS_TOKEN_TTL_SECONDS = 365 * 24 * 60 * 60;

export interface OAuthSession {
    state: string;
    redirectUri: string;
    // Validated at /authorize (isValidCodeChallenge) before a session exists.
    codeChallenge: string;
    // Always "S256": an absent method is accepted as S256 and normalized here,
    // so the switcher re-enters /authorize with it spelled out.
    codeChallengeMethod: "S256";
    // RFC 8707 resource exactly as the client sent it, when it sent one.
    resource?: string;
    // What the consent notice shows: the https host (with any port), the
    // loopback host:port, or "scheme://" for a private-use scheme. Derived
    // from the validated redirect_uri, never from client-supplied metadata.
    redirectHost: string;
    redirectKind: RedirectKind;
    clientId: string;
    // Raw nonce for an in-flight Google sign-in; the hashed form is sent to
    // Google and the raw value is handed to signInWithIdToken on callback.
    googleNonce?: string;
    // Chosen once when the session is created (or via the switcher, which
    // re-enters /authorize — see authorizeUrl) and reused for every
    // re-render of this same flow (a password or Google-sign-in failure)
    // so an error doesn't silently snap the page back to English.
    locale: SiteLocale;
    // sha256 hex of the binding cookie /authorize set for this session in
    // the browser that opened it (see bindingCookieName). /approve, /authorize/google and the Google
    // callback refuse to act on this session from any other browser.
    browserBinding: string;
}

// In-memory session store (sessions are short-lived, 10min TTL)
const sessions = new Map<
    string,
    { session: OAuthSession; expiresAt: number }
>();

function cleanExpiredSessions(now: number = Date.now()) {
    for (const [key, value] of sessions) {
        if (value.expiresAt < now) sessions.delete(key);
    }
}

setInterval(cleanExpiredSessions, 60 * 1000);

// Binds a sign-in session to the browser that started it. The session id is
// in the login page's HTML, so whoever fetched /authorize holds it — and with
// open registration that can be an attacker's server: it drives /authorize
// for its own client, starts the Google leg with the scraped id, and hands
// the victim only Google's genuine account chooser, which finishes the
// session in the victim's browser and sends the code to the attacker's
// redirect without the victim ever seeing the consent notice. The cookie is
// set only by /authorize, so a session can be finished only by the browser
// that was shown the login page for it.
//
// One cookie per session, named after it, not one per browser: a shared
// per-browser value had to be minted by whichever /authorize saw no cookie,
// so two first-time loads in flight at once (a double-clicked Connect, two
// servers connecting together) each minted their own, the browser kept
// whichever Set-Cookie landed last, and the other tab's sign-in failed the
// check. Named per session, both land and neither can overwrite the other;
// parallel sign-ins and the language switcher (which re-enters /authorize
// and mints a fresh session) each get their own. Max-Age is the session's
// own TTL and a finished sign-in deletes its cookie, so they don't pile up.
//
// SameSite=Lax, not Strict: Google's redirect back to /auth/google/callback
// is a cross-site top-level GET, and Strict would drop the cookie on exactly
// the request that has to carry it. __Host- on https (Secure, Path=/, no
// Domain, so no subdomain can plant one); plain-http local dev can't set a
// Secure cookie, so it gets the bare name.
//
// Read only by the three routes above — /mcp stays Bearer-only.
const BINDING_COOKIE_PREFIX = "nm_oauth_bind_";
// Matches a binding cookie's name as the request carries it, prefix and all.
const BINDING_COOKIE_NAME = /^(?:__Host-)?nm_oauth_bind_[0-9a-f]{16}$/;
// crypto.randomBytes(32) in base64url; anything else is ignored.
const BINDING_VALUE = /^[A-Za-z0-9_-]{43}$/;
// More live bindings than any real browser has sign-ins in flight. Past it,
// /authorize clears them all before adding its own, so a page that bounces a
// browser through /authorize over and over can't grow its Cookie header
// until this site starts refusing it.
const MAX_BINDING_COOKIES = 10;

function bindingIsSecure(c: Context): boolean {
    return getBaseUrl(c).startsWith("https:");
}

// Derived from the session id rather than equal to it, so the id itself never
// lands in a cookie jar or a Cookie header in some proxy's log.
function bindingCookieName(sessionId: string): string {
    return BINDING_COOKIE_PREFIX + sha256Hex(sessionId).slice(0, 16);
}

function bindingCookieOptions(c: Context) {
    return {
        httpOnly: true,
        sameSite: "Lax" as const,
        path: "/",
        ...(bindingIsSecure(c)
            ? { secure: true, prefix: "host" as const }
            : {}),
    };
}

function readBindingCookie(c: Context, sessionId: string): string | undefined {
    const name = bindingCookieName(sessionId);
    const value = bindingIsSecure(c)
        ? getCookie(c, name, "host")
        : getCookie(c, name);
    return value && BINDING_VALUE.test(value) ? value : undefined;
}

// Mints this session's binding, sets its cookie, and returns the hash to
// store on the session.
function setBindingCookie(c: Context, sessionId: string): string {
    const held = Object.keys(getCookie(c)).filter((name) =>
        BINDING_COOKIE_NAME.test(name),
    );
    if (held.length >= MAX_BINDING_COOKIES) {
        const opts = bindingCookieOptions(c);
        for (const name of held) {
            const bare = name.replace(/^__Host-/, "");
            deleteCookie(c, bare, opts);
        }
    }
    const value = crypto.randomBytes(32).toString("base64url");
    setCookie(c, bindingCookieName(sessionId), value, {
        ...bindingCookieOptions(c),
        maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });
    return sha256Hex(value);
}

// Once the session is consumed its cookie has nothing left to guard.
function clearBindingCookie(c: Context, sessionId: string): void {
    deleteCookie(c, bindingCookieName(sessionId), bindingCookieOptions(c));
}

// Does this request come from the browser the session was created in?
// Compared as hashes with timingSafeEqual, like secretMatches.
function bindingMatches(
    c: Context,
    sessionId: string,
    session: OAuthSession,
): boolean {
    const value = readBindingCookie(c, sessionId);
    if (!value) return false;
    const a = Buffer.from(sha256Hex(value), "utf8");
    const b = Buffer.from(session.browserBinding, "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// The answer to a request for a session this browser didn't start. Nothing
// about the session is touched and nothing identifying is logged: in the
// attack this refuses, the session belongs to someone else.
function sessionMismatch(c: Context, route: string): Response {
    console.warn(`[oauth] session-binding-mismatch route=${route}`);
    return c.json(
        {
            error: "session_mismatch",
            error_description:
                "Start signing in again from your AI app, in this browser.",
        },
        400,
    );
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Every locale (English implicit) whose translated login page actually
// exists on disk right now — checked here rather than importing
// src/copy/login.ts's LOGIN keys, matching how src/index.ts's locale
// routes work: a locale is "available" when its file is present, not when
// a data object claims it should be.
async function availableLoginLocales(): Promise<SiteLocale[]> {
    const checks = await Promise.all(
        SITE_LOCALES.map(async (l) => {
            const path =
                l === "en" ? "./public/login.html" : `./public/${l}/login.html`;
            return (await Bun.file(path).exists()) ? l : null;
        }),
    );
    return checks.filter((l): l is SiteLocale => l !== null);
}

// Reconstructs the /authorize URL that started this session, in a given
// locale, from the session's own stored fields — used both to re-enter the
// flow from the language switcher (a fresh GET /authorize mints a new
// session, which is fine: nothing has been submitted yet at the point
// someone is choosing a language) and nowhere else. Not exported: this is
// deliberately the *only* place a session's fields get serialized back
// into a URL, so a field added to OAuthSession later doesn't get forgotten
// in a second, drifting copy of this logic.
function authorizeUrl(session: OAuthSession, locale: SiteLocale): string {
    // Every parameter /authorize requires has to be carried here: the
    // switcher and the translation notice re-enter /authorize from this URL,
    // and a dropped code_challenge_method or resource would turn a language
    // change into an error redirect (or a token bound to the wrong resource).
    const params = new URLSearchParams({
        response_type: "code",
        client_id: session.clientId,
        redirect_uri: session.redirectUri,
        state: session.state,
        code_challenge: session.codeChallenge,
        code_challenge_method: session.codeChallengeMethod,
    });
    if (session.resource) params.set("resource", session.resource);
    if (locale !== "en") params.set("locale", locale);
    return `/authorize?${params.toString()}`;
}

async function renderLangSwitcher(
    session: OAuthSession,
    locale: SiteLocale,
): Promise<string> {
    const available = await availableLoginLocales();
    const items = available
        .map((l) => {
            const active = l === locale;
            return `                            <a
                                href="${escapeHtml(authorizeUrl(session, l))}"
                                lang="${HTML_LANG[l]}"
                                hreflang="${HTML_LANG[l]}"${active ? '\n                                aria-current="page"' : ""}
                                >${escapeHtml(LOCALE_NAMES[l])}</a
                            >`;
        })
        .join("\n");
    // Hand-written twin of the static switcher in scripts/site-partials.ts
    // (this one has to rebuild every href from the in-flight session, which
    // pathFor cannot do), so every fix there has to be repeated here — its
    // three labels sat in English on all nine locales until this, long after
    // the generated pages were translated. role="group" is load-bearing, not
    // decoration: an aria-label on a bare <div> is exposed to nothing, so
    // without it the menu's label is inert however well translated.
    const c = chromeFor(locale);
    return `<details class="lang-switch">
                        <summary
                            class="icon-btn"
                            aria-label="${escapeHtml(c.changeLanguageAriaLabel)}"
                            title="${escapeHtml(c.languageTitle)}"
                        >
                            <span class="lang-code">${HTML_LANG[locale].toUpperCase()}</span>
                        </summary>
                        <div class="lang-menu" role="group" aria-label="${escapeHtml(c.languageTitle)}">
${items}
                        </div>
                    </details>`;
}

// "This page is machine-translated" disclosure, linking back to THIS same
// in-flight flow in English (via authorizeUrl, same reasoning as the
// switcher above — a fixed site link would drop the user at the marketing
// homepage instead of back at their login attempt). Empty for English
// itself, and empty (not a half-translated banner) for a locale
// TRANSLATION_NOTICE hasn't reached yet.
function renderTranslationNotice(
    session: OAuthSession,
    locale: SiteLocale,
): string {
    if (locale === "en") return "";
    const notice = TRANSLATION_NOTICE[locale];
    if (!notice) return "";
    return `<div class="translation-notice">
                            <p>
                                ${escapeHtml(notice.text)}
                                <a href="${escapeHtml(authorizeUrl(session, "en"))}">${escapeHtml(notice.linkText)}</a>
                            </p>
                        </div>`;
}

// Where the browser goes after sign-in, shown on the consent page because the
// MCP spec requires the redirect host be displayed — and because registration
// is open, the host is the one thing the user can check: anyone can register
// a client whose redirect points at their own server, so a login page that
// shows nothing is a login page that hands codes to strangers (#148). The
// client's self-declared client_name is never rendered: it is attacker-chosen
// ("Claude") and would lend a lookalike the credibility the host denies it.
function renderClientNotice(session: OAuthSession): string {
    const copy = LOGIN_CLIENT_NOTICE[session.locale];
    let template: string;
    let warn: boolean;
    if (session.redirectKind === "loopback") {
        template = copy.loopback;
        warn = true;
    } else if (
        session.redirectKind === "https" &&
        KNOWN_CLIENT_HOSTS.has(session.redirectHost)
    ) {
        template = copy.returnTo;
        warn = false;
    } else {
        // Any other https host, and every private-use scheme (shown as the
        // whole URI minus its query — see redirectDisplay — since the scheme
        // alone would hide a browser launcher's web destination).
        template = copy.unknownHost;
        warn = true;
    }
    const host = `<strong>${escapeHtml(session.redirectHost)}</strong>`;
    const text = template
        .split("{host}")
        .map((part) => escapeHtml(part))
        .join(host);
    return `<p class="client-notice"${warn ? " data-warn" : ""}>${text}</p>`;
}

export async function renderLoginPage(
    sessionId: string,
    session: OAuthSession,
    error?: string,
): Promise<string> {
    const locale = session.locale;
    const file =
        locale === "en"
            ? "./public/login.html"
            : `./public/${locale}/login.html`;
    const template = await Bun.file(file).text();
    const errorHtml = error
        ? `<div class="error-banner">${escapeHtml(error)}</div>`
        : "";
    // Every replacement is passed as a function: a string replacement expands
    // "$'", "$&" and "$`" patterns, and the notice and error carry text the
    // caller controls (a registered host, a Supabase error message), which
    // could otherwise splice copies of the template into the page.
    const notice = renderClientNotice(session);
    const switcher = await renderLangSwitcher(session, locale);
    const translation = renderTranslationNotice(session, locale);
    return template
        .replaceAll("{{SESSION_ID}}", () => escapeHtml(sessionId))
        .replaceAll("{{ERROR}}", () => errorHtml)
        .replaceAll("{{CLIENT_NOTICE}}", () => notice)
        .replaceAll("{{LANG_SWITCHER}}", () => switcher)
        .replaceAll("{{TRANSLATION_NOTICE}}", () => translation);
}

// Mint an authorization code for the now-authenticated user and redirect back to
// the MCP client. Shared by the password (/approve) and Google callback paths so
// the two can't drift. Consumes the session.
async function finishAuthorization(
    c: Context,
    store: OAuthStore,
    sessionId: string,
    session: OAuthSession,
    userId: string,
): Promise<Response> {
    sessions.delete(sessionId);
    clearBindingCookie(c, sessionId);

    const authCode = crypto.randomUUID();
    await store.storeAuthCode({
        code: authCode,
        redirectUri: session.redirectUri,
        userId,
        codeChallenge: session.codeChallenge,
        clientId: session.clientId,
        resource: session.resource ?? null,
    });

    const redirectUrl = new URL(session.redirectUri);
    redirectUrl.searchParams.set("code", authCode);
    redirectUrl.searchParams.set("state", session.state);
    // RFC 9207: names the server that issued the code, so a client talking to
    // several authorization servers can't be fed another server's response.
    // From the same helper as the metadata `issuer`, which it must equal
    // byte for byte.
    redirectUrl.searchParams.set("iss", issuerFor(getBaseUrl(c)));

    return c.redirect(redirectUrl.toString());
}

// Every path this router serves. Kept in sync with the oauth.get/oauth.post
// registrations below — a route added there but missing here is unthrottled.
export const OAUTH_PATHS = [
    "/register",
    "/authorize",
    "/approve",
    "/authorize/google",
    "/auth/google/callback",
    "/token",
] as const;

// What a redirect URI may be written to a log as: its origin for http(s), its
// scheme for anything else. Never the path or query — per-connector callbacks
// carry per-user and per-connector ids there.
function logOrigin(uri: string | undefined): string {
    if (!uri) return "none";
    try {
        const url = new URL(uri);
        if (url.protocol === "https:" || url.protocol === "http:")
            return url.origin;
        return `${url.protocol}//`;
    } catch {
        return "unparseable";
    }
}

// A client id as it may be logged: ours are UUIDs (or the hex legacy id), so
// anything else is caller-controlled text and is not echoed into the log.
function logClientId(id: string | undefined): string {
    if (!id) return "none";
    return /^[A-Za-z0-9-]{1,64}$/.test(id) ? id : "malformed";
}

function oauthLog(event: string, clientId: string | undefined, uri?: string) {
    console.warn(
        `[oauth] ${event} client=${logClientId(clientId)} origin=${logOrigin(uri)}`,
    );
}

// RFC 7591 §2 values this server implements.
const TOKEN_ENDPOINT_AUTH_METHODS: readonly TokenEndpointAuthMethod[] = [
    "none",
    "client_secret_post",
    "client_secret_basic",
];
const GRANT_TYPES = ["authorization_code", "refresh_token"] as const;
const MAX_REDIRECT_URIS = 10;
const CLIENT_NAME_MAX_LENGTH = 255;

// Does a presented client secret match the stored sha256? Compared as hashes
// with timingSafeEqual so the comparison leaks nothing about the stored value.
function secretMatches(secret: string, storedHash: string | null): boolean {
    if (!storedHash) return false;
    const a = Buffer.from(sha256Hex(secret), "utf8");
    const b = Buffer.from(storedHash, "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// RFC 6749 §2.3.1: the client id and secret in an `Authorization: Basic`
// header are each application/x-www-form-urlencoded before being joined with
// ":" and base64-encoded, so both halves are form-decoded here ("+" is a
// space). The raw halves are kept too, and authentication accepts either: the
// MCP SDK builds the header as btoa(`${id}:${secret}`) with no form-encoding,
// and it switches a client that registered with no stored auth method (every
// client from before per-client registration) to Basic on its own once Basic
// is advertised. A legacy secret with a "+" or "%" in it would otherwise
// decode to something else and log that client out at its next refresh.
// Returns undefined when there is no Basic header, null when there is one but
// it does not decode — which is a failed authentication, not an absent one.
interface BasicCredentials {
    // Form-decoded, or the raw half when it does not form-decode.
    id: string;
    secret: string;
    raw: { id: string; secret: string };
}

function parseBasicAuth(
    header: string | undefined,
): BasicCredentials | null | undefined {
    if (!header) return undefined;
    const match = header.match(/^Basic\s+(\S+)\s*$/i);
    if (!match) {
        // Some other scheme (a Bearer token, say) is not an attempt at
        // client authentication; ignore it like any unknown header.
        return /^Basic\b/i.test(header) ? null : undefined;
    }
    const encoded = match[1]!;
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) return null;
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const colon = decoded.indexOf(":");
    if (colon < 0) return null;
    const raw = {
        id: decoded.slice(0, colon),
        secret: decoded.slice(colon + 1),
    };
    const formDecode = (v: string) => {
        try {
            return decodeURIComponent(v.replace(/\+/g, " "));
        } catch {
            return v;
        }
    };
    if (!raw.id) return null;
    return { id: formDecode(raw.id), secret: formDecode(raw.secret), raw };
}

type ClientAuthResult =
    // `client` is null only when the caller sent no client credentials at
    // all and the grant allows that (a refresh with a null-client token).
    | { ok: true; client: OAuthClient | null }
    | { ok: false; response: Response };

// Every /token response, success or error, must never be cached (RFC 6749
// §5.1). Set by middleware registered ahead of the rate limiter, so even its
// 429 carries them.
const NO_STORE_HEADERS = {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
} as const;

// A form field as a string, or undefined when absent or not a string (parseBody
// yields File for a multipart upload, and an array for a repeated key when
// asked; neither is a valid OAuth parameter).
function str(v: unknown): string | undefined {
    return typeof v === "string" ? v : undefined;
}

// pkceS256(verifier) against the stored challenge, in constant time.
function challengeMatches(computed: string, stored: string): boolean {
    const a = Buffer.from(computed, "utf8");
    const b = Buffer.from(stored, "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export interface OAuthRouterDeps {
    store?: OAuthStore;
    auth?: OAuthAuth;
    now?: () => number;
}

export function createOAuthRouter(deps: OAuthRouterDeps = {}) {
    const oauth = new Hono();
    // The legacy env client is read here, at construction, and resolved in
    // memory by whichever store is in use (see withLegacyClient).
    const legacy = legacyClientFromEnv();
    const store = withLegacyClient(
        deps.store ?? createSupabaseOAuthStore(),
        legacy,
    );
    const auth = deps.auth ?? supabaseOAuthAuth;
    const now = deps.now ?? Date.now;

    // Per-IP rate limit across all OAuth endpoints — these are unauthenticated,
    // so this is the only throttle standing between the internet and signup /
    // sign-in / token issuance.
    //
    // Deliberately NOT `oauth.use("*", ...)`: this router is mounted at the root
    // (`app.route("/", createOAuthRouter())`) because the OAuth paths are
    // spec-fixed there, and Hono applies a sub-app's wildcard middleware to
    // *every* path of the parent app — a wildcard here rate-limited /mcp too,
    // capping authenticated MCP traffic at the 30/min per-IP auth limit. Listing
    // the endpoints explicitly keeps the limiter from leaking beyond OAuth again.
    // Ahead of the limiter so its 429 is covered too; applied after next()
    // so it lands on whatever response the handler (or the limiter) built.
    oauth.use("/token", async (c, next) => {
        await next();
        for (const [name, value] of Object.entries(NO_STORE_HEADERS)) {
            c.res.headers.set(name, value);
        }
    });
    for (const path of OAUTH_PATHS) {
        oauth.use(path, rateLimitAuth);
    }

    // Dynamic client registration (RFC 7591). Every caller gets its own
    // client id bound to the redirect URIs it registers — this used to hand
    // every caller the same static env client and enforce no redirect at all,
    // which let anyone mint an /authorize link that delivered a victim's code
    // to their own server (#148).
    oauth.post("/register", async (c) => {
        const invalidMetadata = (description: string) =>
            c.json(
                {
                    error: "invalid_client_metadata",
                    error_description: description,
                },
                400,
            );

        let body: unknown;
        try {
            body = await c.req.json();
        } catch {
            return invalidMetadata("request body must be a JSON object");
        }
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return invalidMetadata("request body must be a JSON object");
        }
        const meta = body as Record<string, unknown>;

        const redirectUris = meta.redirect_uris;
        const invalidRedirect = (description: string, uri?: string) => {
            oauthLog(
                `register-rejected reason=invalid_redirect_uri`,
                undefined,
                uri,
            );
            return c.json(
                {
                    error: "invalid_redirect_uri",
                    error_description: description,
                },
                400,
            );
        };
        if (
            !Array.isArray(redirectUris) ||
            redirectUris.length < 1 ||
            redirectUris.length > MAX_REDIRECT_URIS
        ) {
            return invalidRedirect(
                `redirect_uris must list 1 to ${MAX_REDIRECT_URIS} URIs`,
            );
        }
        for (const uri of redirectUris) {
            if (typeof uri !== "string") {
                return invalidRedirect("redirect_uris must be strings");
            }
            const parsed = parseRedirectUri(uri);
            if (!parsed.ok) return invalidRedirect(parsed.reason, uri);
        }

        let grantTypes: string[] = [...GRANT_TYPES];
        if (meta.grant_types !== undefined) {
            if (
                !Array.isArray(meta.grant_types) ||
                meta.grant_types.length === 0 ||
                !meta.grant_types.every(
                    (g) =>
                        typeof g === "string" &&
                        (GRANT_TYPES as readonly string[]).includes(g),
                )
            ) {
                return invalidMetadata(
                    "grant_types may only contain authorization_code and refresh_token",
                );
            }
            grantTypes = [...new Set(meta.grant_types as string[])];
        }

        if (
            meta.response_types !== undefined &&
            !(
                Array.isArray(meta.response_types) &&
                meta.response_types.length === 1 &&
                meta.response_types[0] === "code"
            )
        ) {
            return invalidMetadata('response_types must be ["code"]');
        }

        // RFC 7591 §2: an omitted method means client_secret_basic.
        let authMethod: TokenEndpointAuthMethod = "client_secret_basic";
        if (meta.token_endpoint_auth_method !== undefined) {
            const m = meta.token_endpoint_auth_method;
            if (
                typeof m !== "string" ||
                !(TOKEN_ENDPOINT_AUTH_METHODS as readonly string[]).includes(m)
            ) {
                return invalidMetadata(
                    "token_endpoint_auth_method must be none, client_secret_post or client_secret_basic",
                );
            }
            authMethod = m as TokenEndpointAuthMethod;
        }

        const clientName =
            typeof meta.client_name === "string"
                ? meta.client_name.slice(0, CLIENT_NAME_MAX_LENGTH)
                : null;

        const clientId = crypto.randomUUID();
        // A confidential client's secret is returned once, here, and stored
        // only as its hash.
        const clientSecret =
            authMethod === "none"
                ? null
                : crypto.randomBytes(32).toString("base64url");

        await store.createClient({
            clientId,
            secretHash: clientSecret ? sha256Hex(clientSecret) : null,
            authMethod,
            redirectUris: redirectUris as string[],
            clientName,
            grantTypes,
        });

        return c.json(
            {
                client_id: clientId,
                client_id_issued_at: Math.floor(now() / 1000),
                ...(clientSecret
                    ? {
                          client_secret: clientSecret,
                          client_secret_expires_at: 0,
                      }
                    : {}),
                redirect_uris: redirectUris,
                token_endpoint_auth_method: authMethod,
                grant_types: grantTypes,
                response_types: ["code"],
                ...(clientName !== null ? { client_name: clientName } : {}),
            },
            201,
        );
    });

    // Is this redirect_uri one the client may use? A registered client must
    // present one of its registered URIs (loopback ignoring the port); the
    // legacy env client, which registered nothing, is held to loopback plus
    // the hand-reviewed snapshot.
    async function redirectAllowed(
        client: OAuthClient,
        redirectUri: string,
    ): Promise<boolean> {
        if (!client.legacy) {
            return client.redirectUris.some((r) =>
                redirectMatches(r, redirectUri),
            );
        }
        if (isLoopbackRedirect(redirectUri)) return true;
        if (!parseRedirectUri(redirectUri).ok) return false;
        return store.isLegacyRedirect(redirectUri);
    }

    // Authorization endpoint
    oauth.get("/authorize", async (c) => {
        const responseType = c.req.query("response_type");
        const reqClientId = c.req.query("client_id");
        const redirectUri = c.req.query("redirect_uri");
        const state = c.req.query("state");
        const codeChallenge = c.req.query("code_challenge");
        const codeChallengeMethod = c.req.query("code_challenge_method");
        const resource = c.req.query("resource");

        // Until the client and its redirect are validated, an error is a JSON
        // 400 and never a redirect: redirecting to an unvalidated URI is the
        // open redirector RFC 6749 §4.1.2.1 forbids.
        const rejectDirect = (
            error: string,
            description: string,
            event: string,
        ) => {
            oauthLog(
                `authorize-rejected reason=${event}`,
                reqClientId,
                redirectUri,
            );
            return c.json({ error, error_description: description }, 400);
        };
        if (!reqClientId) {
            return rejectDirect(
                "invalid_request",
                "client_id is required",
                "missing_client_id",
            );
        }
        if (!redirectUri) {
            return rejectDirect(
                "invalid_request",
                "redirect_uri is required",
                "missing_redirect_uri",
            );
        }
        const client = await store.getClient(reqClientId);
        if (!client) {
            return rejectDirect(
                "invalid_client",
                "unknown client_id",
                "unknown_client",
            );
        }
        if (!(await redirectAllowed(client, redirectUri))) {
            return rejectDirect(
                "invalid_request",
                "redirect_uri is not registered for this client",
                "unregistered_redirect_uri",
            );
        }
        if (client.legacy) {
            // Measures who still uses the static client before its sunset.
            console.warn(
                `[oauth] legacy-client authorize origin=${logOrigin(redirectUri)}`,
            );
        }
        // redirectAllowed only passes URIs that parse (redirectMatches and
        // isLoopbackRedirect both re-validate the presented one).
        const parsed = parseRedirectUri(redirectUri);
        if (!parsed.ok) {
            return rejectDirect(
                "invalid_request",
                parsed.reason,
                "invalid_redirect_uri",
            );
        }

        // From here the redirect is trusted, so errors go back to the client
        // (RFC 6749 §4.1.2.1). Built with URL + searchParams so an existing
        // query on the registered URI survives and custom schemes work too.
        const rejectRedirect = (error: string, description: string) => {
            oauthLog(
                `authorize-error error=${error}`,
                reqClientId,
                redirectUri,
            );
            const url = new URL(redirectUri);
            url.searchParams.set("error", error);
            url.searchParams.set("error_description", description);
            if (state) url.searchParams.set("state", state);
            // RFC 9207 applies to error responses too.
            url.searchParams.set("iss", issuerFor(getBaseUrl(c)));
            return c.redirect(url.toString());
        };
        if (responseType !== "code") {
            return rejectRedirect(
                "unsupported_response_type",
                'response_type must be "code"',
            );
        }
        if (!state) {
            return rejectRedirect("invalid_request", "state is required");
        }
        // PKCE is mandatory (MCP authorization spec), S256 only.
        if (!codeChallenge || !isValidCodeChallenge(codeChallenge)) {
            return rejectRedirect(
                "invalid_request",
                "code_challenge is required and must be an S256 challenge",
            );
        }
        if (codeChallengeMethod === undefined) {
            // Accepted as S256 (a 43-char base64url challenge can only be an
            // S256 one); logged to see which clients rely on the default.
            console.warn(
                `[oauth] pkce-method-absent client=${logClientId(reqClientId)}`,
            );
        } else if (codeChallengeMethod !== "S256") {
            return rejectRedirect(
                "invalid_request",
                "code_challenge_method must be S256",
            );
        }
        if (
            resource !== undefined &&
            !resourceAllowed(resource, getBaseUrl(c))
        ) {
            return rejectRedirect(
                "invalid_target",
                "resource is not this server",
            );
        }

        cleanExpiredSessions(now());

        // The language switcher re-enters here with ?locale=xx (see
        // authorizeUrl) — an unsupported or untranslated value falls back
        // to English rather than 400ing, since a client could in principle
        // send one too and this is display-only, not a security control.
        const requestedLocale = c.req.query("locale");
        const available = await availableLoginLocales();
        const locale: SiteLocale =
            available.find((l) => l === requestedLocale) ?? "en";

        // Store session and show login page
        const sessionId = crypto.randomUUID();
        const session: OAuthSession = {
            state,
            redirectUri,
            codeChallenge,
            codeChallengeMethod: "S256",
            ...(resource !== undefined ? { resource } : {}),
            redirectHost: redirectDisplay(parsed),
            redirectKind: parsed.kind,
            clientId: client.clientId,
            locale,
            browserBinding: setBindingCookie(c, sessionId),
        };
        sessions.set(sessionId, {
            session,
            expiresAt: now() + SESSION_TTL_MS,
        });

        return c.html(await renderLoginPage(sessionId, session));
    });

    // Login/register endpoint — user submits email + password
    oauth.post("/approve", async (c) => {
        const body = await c.req.parseBody();
        const sessionId = body.session_id as string;
        const email = (body.email as string)?.trim().toLowerCase();
        const password = body.password as string;
        const action = body.action as string;

        if (!sessionId || !email || !password) {
            return c.json({ error: "invalid_request" }, 400);
        }

        const entry = sessions.get(sessionId);
        if (!entry || entry.expiresAt < now()) {
            sessions.delete(sessionId);
            return c.json({ error: "session_expired" }, 400);
        }
        if (!bindingMatches(c, sessionId, entry.session)) {
            return sessionMismatch(c, "approve");
        }

        let userId: string;
        try {
            // Try sign-in first; if user doesn't exist, sign them up
            try {
                userId = await auth.signIn(email, password);
            } catch {
                userId = await auth.signUp(email, password);
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Authentication failed";
            return c.html(
                await renderLoginPage(sessionId, entry.session, message),
                400,
            );
        }

        return finishAuthorization(c, store, sessionId, entry.session, userId);
    });

    // Google sign-in — step 1: redirect the user to Google's consent screen.
    // We run the Google OAuth dance ourselves (rather than Supabase's PKCE
    // redirect flow) so nothing needs to persist across requests beyond the
    // existing in-memory session.
    //
    // A POST from the login page's form, never a link: a GET could be started
    // by anything holding the session id, and the Google leg would then skip
    // the page that carries the consent notice. The binding check below is
    // what actually enforces that; the POST keeps the only way in on the page.
    oauth.post("/authorize/google", async (c) => {
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!googleClientId || !googleClientSecret) {
            return c.json({ error: "google_not_configured" }, 500);
        }

        const body = await c.req.parseBody();
        const sessionId =
            typeof body.session_id === "string" ? body.session_id : undefined;
        if (!sessionId) {
            return c.json({ error: "invalid_request" }, 400);
        }

        cleanExpiredSessions(now());
        const entry = sessions.get(sessionId);
        if (!entry || entry.expiresAt < now()) {
            sessions.delete(sessionId);
            return c.json({ error: "session_expired" }, 400);
        }
        if (!bindingMatches(c, sessionId, entry.session)) {
            return sessionMismatch(c, "authorize-google");
        }

        // Fresh nonce per attempt. Supabase expects the SHA-256 *hex* digest sent
        // to the provider and the raw value handed to signInWithIdToken.
        const rawNonce = crypto.randomUUID();
        const hashedNonce = crypto
            .createHash("sha256")
            .update(rawNonce)
            .digest("hex");
        entry.session.googleNonce = rawNonce;

        const googleUrl = new URL(
            "https://accounts.google.com/o/oauth2/v2/auth",
        );
        googleUrl.searchParams.set("client_id", googleClientId);
        googleUrl.searchParams.set(
            "redirect_uri",
            `${getBaseUrl(c)}/auth/google/callback`,
        );
        googleUrl.searchParams.set("response_type", "code");
        googleUrl.searchParams.set("scope", "openid email profile");
        googleUrl.searchParams.set("state", sessionId);
        googleUrl.searchParams.set("nonce", hashedNonce);
        googleUrl.searchParams.set("prompt", "select_account");

        return c.redirect(googleUrl.toString());
    });

    // The old link-shaped entry point. Answered rather than left to 404 so a
    // login page cached from before the switch says what to do.
    oauth.get("/authorize/google", (c) =>
        c.json(
            {
                error: "method_not_allowed",
                error_description:
                    "Start signing in again from your AI app, in this browser.",
            },
            405,
            { Allow: "POST" },
        ),
    );

    // Google sign-in — step 2: Google redirects back here. Exchange the code for
    // an ID token (back-channel), trade it with Supabase for a user, then mint
    // our authorization code exactly like the password path.
    oauth.get("/auth/google/callback", async (c) => {
        const sessionId = c.req.query("state");
        if (!sessionId) {
            return c.json({ error: "invalid_request" }, 400);
        }

        cleanExpiredSessions(now());
        const entry = sessions.get(sessionId);
        if (!entry || entry.expiresAt < now()) {
            sessions.delete(sessionId);
            return c.json({ error: "session_expired" }, 400);
        }
        // Before anything reads or changes the session — renderError below
        // clears its nonce and would show its login page — and before any
        // call to Google. JSON, not the translated error page: the session
        // may be someone else's, and its page is not this browser's to see.
        if (!bindingMatches(c, sessionId, entry.session)) {
            return sessionMismatch(c, "google-callback");
        }

        // Surface user-cancelled / denied consent without treating it as a
        // crash. Translated via LOGIN_ERRORS in the session's own locale
        // rather than a raw message, so every call site below gets the
        // right language for free. No English fallback: LOGIN_ERRORS is a
        // total Record<SiteLocale, LoginErrors> now, so every locale a
        // session can carry has an entry and missing one is a typecheck
        // failure, not a runtime undefined.
        const renderError = async (kind: keyof LoginErrors) => {
            entry.session.googleNonce = undefined;
            const message = LOGIN_ERRORS[entry.session.locale][kind];
            return c.html(
                await renderLoginPage(sessionId, entry.session, message),
                400,
            );
        };

        if (c.req.query("error")) {
            return renderError("googleCancelled");
        }

        const code = c.req.query("code");
        const rawNonce = entry.session.googleNonce;
        // googleNonce is only set by POST /authorize/google, so its absence
        // means this callback didn't originate from a flow we started.
        if (!code || !rawNonce) {
            return renderError("googleFailed");
        }

        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
        if (!googleClientId || !googleClientSecret) {
            return c.json({ error: "google_not_configured" }, 500);
        }

        try {
            const tokenRes = await fetch(
                "https://oauth2.googleapis.com/token",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        code,
                        client_id: googleClientId,
                        client_secret: googleClientSecret,
                        // Must byte-match the redirect_uri sent in
                        // POST /authorize/google.
                        redirect_uri: `${getBaseUrl(c)}/auth/google/callback`,
                        grant_type: "authorization_code",
                    }),
                },
            );

            if (!tokenRes.ok) {
                return renderError("googleFailed");
            }

            const tokenData = (await tokenRes.json()) as { id_token?: string };
            if (!tokenData.id_token) {
                return renderError("googleFailed");
            }

            const userId = await auth.signInWithGoogleIdToken(
                tokenData.id_token,
                rawNonce,
            );

            return finishAuthorization(
                c,
                store,
                sessionId,
                entry.session,
                userId,
            );
        } catch {
            return renderError("googleFailed");
        }
    });

    // Who is calling /token? RFC 6749 §2.3 client authentication, from the
    // form body (client_secret_post, or a bare client_id for a public client)
    // or an `Authorization: Basic` header (client_secret_basic).
    //
    // Transport is not pinned to the registered method: a confidential client
    // registered as client_secret_basic may send its secret in the body and a
    // client_secret_post one may use Basic. What authenticates the client is
    // possession of the secret, delivered over TLS either way, so refusing the
    // other transport adds no security — and it would break real clients: the
    // MCP TypeScript SDK picks the transport from the server's advertised
    // methods rather than its own registration, and now that Basic is
    // advertised, clients holding the legacy secret (registered as post) may
    // switch to it. What *is* enforced is the one distinction that matters,
    // secret or no secret: a confidential client must prove its secret, and a
    // public ("none") client must not present one.
    //
    // `required`: whether a request with no client credentials at all is
    // refused. The authorization_code grant always requires them; a refresh
    // doesn't, so a null-client refresh token issued before refresh tokens
    // were bound to clients still refreshes for a caller that never sent a
    // client id (see the refresh_token grant).
    async function authenticateClient(
        c: Context,
        body: Record<string, unknown>,
        required: boolean,
    ): Promise<ClientAuthResult> {
        const basic = parseBasicAuth(c.req.header("Authorization"));
        const triedBasic = basic !== undefined;
        const fail = (description: string): ClientAuthResult => {
            oauthLog(
                "token-rejected reason=invalid_client",
                basic?.id ?? str(body.client_id),
            );
            return {
                ok: false,
                response: c.json(
                    { error: "invalid_client", error_description: description },
                    401,
                    // RFC 6749 §5.2: a client that tried Basic is told which
                    // scheme to retry with.
                    triedBasic
                        ? { "WWW-Authenticate": 'Basic realm="oauth"' }
                        : {},
                ),
            };
        };
        if (basic === null) return fail("malformed Basic credentials");

        const bodyId = str(body.client_id);
        // An empty secret is no secret, in the body as in Basic below.
        const bodySecret = str(body.client_secret) || undefined;
        if (basic && bodySecret !== undefined) {
            // RFC 6749 §2.3: at most one authentication method per request.
            return {
                ok: false,
                response: c.json(
                    {
                        error: "invalid_request",
                        error_description:
                            "send client credentials in the Authorization header or the body, not both",
                    },
                    400,
                ),
            };
        }
        // A client_id in the body beside Basic is allowed (§3.2.1 lets any
        // client identify itself that way), but it must name the same client.
        if (
            basic &&
            bodyId !== undefined &&
            bodyId !== basic.id &&
            bodyId !== basic.raw.id
        ) {
            return {
                ok: false,
                response: c.json(
                    {
                        error: "invalid_request",
                        error_description:
                            "client_id does not match the Authorization header",
                    },
                    400,
                ),
            };
        }

        // An empty Basic password is "no secret", as some public clients send.
        const secret = basic ? basic.secret || undefined : bodySecret;
        // Every form the secret may have been sent in (see parseBasicAuth);
        // matching any one of them authenticates.
        const secrets = basic
            ? [basic.secret, basic.raw.secret].filter(Boolean)
            : bodySecret !== undefined
              ? [bodySecret]
              : [];
        const secretOk = (hash: string | null) =>
            secrets.some((s) => secretMatches(s, hash));

        let client: OAuthClient | null;
        if (basic) {
            client = await store.getClient(basic.id);
            if (!client && basic.raw.id !== basic.id)
                client = await store.getClient(basic.raw.id);
        } else if (bodyId !== undefined) {
            client = await store.getClient(bodyId);
        } else if (secret !== undefined && legacy) {
            // A secret with no client_id can only have been meant for the
            // legacy client: before per-client registration it was the only
            // client, and the /token code of that era accepted exactly this.
            // Kept until the legacy client's sunset so a hand-configured
            // integration isn't logged out at its next refresh.
            client = legacy;
        } else {
            if (secret !== undefined) return fail("client_id is required");
            if (required) return fail("client authentication is required");
            return { ok: true, client: null };
        }
        if (!client) return fail("unknown client");

        if (client.legacy) {
            // The legacy env client's secret is optional (it was handed to
            // every caller, so it proves little), but a wrong one is refused.
            if (secret !== undefined && !secretOk(client.secretHash))
                return fail("client authentication failed");
        } else if (client.authMethod === "none") {
            if (secret !== undefined)
                return fail("a public client has no secret");
        } else {
            if (secret === undefined)
                return fail("client authentication is required");
            if (!secretOk(client.secretHash))
                return fail("client authentication failed");
        }

        // Fire-and-forget: last_used_at must never delay or fail /token.
        store.touchClient(client.clientId).catch(() => {});
        return { ok: true, client };
    }

    // Token endpoint (RFC 6749 §3.2). Form-encoded, like every OAuth client
    // sends it — /register is the JSON one; don't unify the parsers.
    oauth.post("/token", async (c) => {
        const body = (await c.req.parseBody()) as Record<string, unknown>;
        const grantType = str(body.grant_type);

        const tokenError = (
            error: string,
            description?: string,
            status: 400 | 401 = 400,
        ) =>
            c.json(
                {
                    error,
                    ...(description ? { error_description: description } : {}),
                },
                status,
            );

        if (grantType === undefined) {
            return tokenError("invalid_request", "grant_type is required");
        }

        if (grantType === "refresh_token") {
            const refreshToken = str(body.refresh_token);
            if (!refreshToken) {
                return tokenError(
                    "invalid_request",
                    "refresh_token is required",
                );
            }

            // Authenticate before consuming, so a caller that fails client
            // authentication can't burn someone's refresh token with it.
            const auth = await authenticateClient(c, body, false);
            if (!auth.ok) return auth.response;

            const consumed = await store.consumeRefreshToken(refreshToken);
            if (!consumed) {
                return tokenError("invalid_grant");
            }
            // Bound to the client it was issued to. A null client is a token
            // issued before refresh tokens carried one; it is accepted from any
            // caller so nobody connected before this is logged out. A token
            // presented by the wrong client stays consumed: someone else holds
            // it, and the rightful client has to reconnect either way.
            if (
                consumed.clientId !== null &&
                auth.client?.clientId !== consumed.clientId
            ) {
                oauthLog(
                    "token-rejected reason=refresh_client_mismatch",
                    auth.client?.clientId,
                );
                return tokenError("invalid_grant");
            }

            const newAccessToken = crypto.randomUUID();
            const newRefreshToken = crypto.randomUUID();
            await store.storeToken(
                newAccessToken,
                consumed.userId,
                ACCESS_TOKEN_TTL_SECONDS,
            );
            // Rotated, and returned in this same response (MCP spec: public
            // clients' refresh tokens MUST rotate). A null-client token picks
            // up the client that refreshed it, when that client identified
            // itself.
            await store.storeRefreshToken(
                newRefreshToken,
                consumed.userId,
                consumed.clientId ?? auth.client?.clientId ?? null,
            );

            return c.json({
                access_token: newAccessToken,
                token_type: "Bearer",
                expires_in: ACCESS_TOKEN_TTL_SECONDS,
                refresh_token: newRefreshToken,
            });
        }

        if (grantType !== "authorization_code") {
            return tokenError("unsupported_grant_type");
        }

        const code = str(body.code);
        if (!code) {
            return tokenError("invalid_request", "code is required");
        }

        const auth = await authenticateClient(c, body, true);
        if (!auth.ok) return auth.response;
        // required=true never yields a null client.
        const client = auth.client!;

        // Atomically consume the code before any check below: whatever fails
        // next, the code is spent, so a failed attempt can't be retried with
        // a guessed verifier or redirect.
        const authCodeData = await store.consumeAuthCode(code);
        if (!authCodeData) {
            return tokenError("invalid_grant");
        }
        const rejectGrant = (reason: string, description: string) => {
            oauthLog(`token-rejected reason=${reason}`, client.clientId);
            return tokenError("invalid_grant", description);
        };

        // Bound to the client it was issued to. A null client_id is a code
        // minted before auth_codes carried one; none of those outlive their
        // ten minutes past the deploy that added the column, but the check
        // spares them.
        if (
            authCodeData.client_id !== null &&
            authCodeData.client_id !== client.clientId
        ) {
            return rejectGrant(
                "code_client_mismatch",
                "code was not issued to this client",
            );
        }

        // Required, and exactly the string /authorize was given (RFC 6749
        // §4.1.3) — no loopback port leniency here: it is the same client
        // replaying the same value.
        const redirectUri = str(body.redirect_uri);
        if (redirectUri !== authCodeData.redirect_uri) {
            return rejectGrant(
                "redirect_uri_mismatch",
                "redirect_uri is required and must match the authorization request",
            );
        }

        // PKCE (RFC 7636 §4.6). A missing verifier is invalid_grant, not
        // invalid_request: the code is already spent at this point, and the
        // grant is exactly what a verifier-less request fails to prove — the
        // same answer as a wrong one, so the two can't be told apart. A code
        // with no challenge (only possible from before PKCE was mandatory) is
        // refused outright.
        const codeVerifier = str(body.code_verifier);
        if (
            !authCodeData.code_challenge ||
            codeVerifier === undefined ||
            !isValidCodeVerifier(codeVerifier) ||
            !challengeMatches(
                pkceS256(codeVerifier),
                authCodeData.code_challenge,
            )
        ) {
            return rejectGrant(
                "pkce_failed",
                "code_verifier is required and must match the code_challenge",
            );
        }

        // RFC 8707: a resource sent here must be this server and, when the
        // authorization request named one, the same one. Omitting it is fine
        // (§2.2: the token is then for what was authorized).
        const resource = str(body.resource);
        if (resource !== undefined) {
            const presented = normalizeResource(resource);
            const authorized =
                authCodeData.resource === null
                    ? null
                    : normalizeResource(authCodeData.resource);
            if (
                !resourceAllowed(resource, getBaseUrl(c)) ||
                (authorized !== null && presented !== authorized)
            ) {
                oauthLog(
                    "token-rejected reason=invalid_target",
                    client.clientId,
                );
                return tokenError(
                    "invalid_target",
                    "resource does not match the authorization request",
                );
            }
        }

        // Issue tokens linked to the authenticated user
        const accessToken = crypto.randomUUID();
        const refreshToken = crypto.randomUUID();
        await store.storeToken(
            accessToken,
            authCodeData.user_id,
            ACCESS_TOKEN_TTL_SECONDS,
        );
        await store.storeRefreshToken(
            refreshToken,
            authCodeData.user_id,
            client.clientId,
        );

        return c.json({
            access_token: accessToken,
            token_type: "Bearer",
            expires_in: ACCESS_TOKEN_TTL_SECONDS,
            refresh_token: refreshToken,
        });
    });

    return oauth;
}
