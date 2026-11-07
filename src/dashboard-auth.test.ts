import { test, expect, describe, beforeEach } from "bun:test";
import { Hono } from "hono";
import {
    DASHBOARD_CLIENT_ID,
    DASHBOARD_SESSION_ABSOLUTE_MS,
    DASHBOARD_SESSION_IDLE_MS,
    DASHBOARD_SESSION_PREFIX,
    DASHBOARD_SIGN_IN_TTL_MS,
    createDashboardAuthRouter,
    dashboardCsrf,
    dashboardSession,
    isDashboardPath,
    readDashboardUserId,
    DashboardSessionThrottledError,
    DashboardSessionCache,
    DASHBOARD_SESSION_CACHE_TTL_MS,
    type DashboardAuthDeps,
} from "./dashboard-auth.js";
import type {
    DashboardSessionRow,
    DashboardSessionStore,
} from "./dashboard-session-store.js";
import {
    DASHBOARD_CLIENT,
    HEALTH_SYNC_CLIENT_ID,
    withFirstPartyClients,
    type AuthCodeData,
    type OAuthAuth,
    type OAuthStore,
} from "./oauth-store.js";
import {
    createOAuthRouter,
    renderLoginPage,
    type OAuthSession,
} from "./oauth.js";
import { pkceS256 } from "./oauth-validate.js";
import { hashSecret, newOpaqueToken } from "./token-hash.js";
import { authenticateBearer, banRepeatAuthFailures } from "./middleware.js";
import {
    DASHBOARD_LOOKUP_FAILURE_GLOBAL_LIMIT,
    DASHBOARD_LOOKUP_FAILURE_LIMIT,
    _resetBuckets,
} from "./rate-limit.js";
import { DASHBOARD } from "./copy/dashboard.js";
import { SITE_LOCALES } from "./routes.js";
import { LOGIN, LOGIN_CLIENT_NOTICE, LOGIN_DASHBOARD } from "./copy/login.js";
import { sweepDashboardSessions } from "./oauth-cleanup.js";

// Everything here runs against injected in-memory fakes (never mock.module):
// the session store, the OAuth store, the auth backend and the clock.

const HTTPS = { host: "nm.test", "x-forwarded-proto": "https" };
const HTTP = { host: "localhost:3000" };
const HTTPS_BASE = "https://nm.test";
const HTTP_BASE = "http://localhost:3000";
const T0 = Date.parse("2026-11-07T10:00:00.000Z");

beforeEach(() => _resetBuckets());

// ---------- fakes ----------

function fakeSessionStore() {
    const rows = new Map<
        string,
        DashboardSessionRow & { token_hash: string }
    >();
    const touches: { id: string; lastSeenAt: string; expiresAt: string }[] = [];
    let n = 0;
    let down = false;
    let deleteDown = false;
    const counts = { lookups: 0 };
    const store: DashboardSessionStore = {
        async create(rec) {
            const id = `s-${++n}`;
            rows.set(hashSecret(rec.token), {
                id,
                token_hash: hashSecret(rec.token),
                user_id: rec.userId,
                created_at: rec.createdAt,
                last_seen_at: rec.createdAt,
                expires_at: rec.expiresAt,
                absolute_expires_at: rec.absoluteExpiresAt,
            });
        },
        async lookup(token, nowIso) {
            counts.lookups++;
            if (down) return { status: "unavailable" };
            const row = rows.get(hashSecret(token));
            if (
                !row ||
                !(row.expires_at > nowIso) ||
                !(row.absolute_expires_at > nowIso)
            )
                return { status: "invalid" };
            return { status: "valid", session: { ...row } };
        },
        async touch(id, lastSeenAt, expiresAt) {
            touches.push({ id, lastSeenAt, expiresAt });
            for (const row of rows.values()) {
                if (row.id === id) {
                    row.last_seen_at = lastSeenAt;
                    row.expires_at = expiresAt;
                }
            }
        },
        async delete(token) {
            if (deleteDown) throw new Error("down");
            rows.delete(hashSecret(token));
        },
    };
    return {
        store,
        rows,
        touches,
        counts,
        setDown: (v: boolean) => {
            down = v;
        },
        setDeleteDown: (v: boolean) => {
            deleteDown = v;
        },
    };
}

function fakeOAuthStore() {
    const codes = new Map<string, AuthCodeData>();
    const store: OAuthStore = {
        async createClient() {},
        async getClient() {
            return null;
        },
        async touchClient() {},
        async isLegacyRedirect() {
            return false;
        },
        async storeAuthCode(rec) {
            codes.set(hashSecret(rec.code), {
                code: hashSecret(rec.code),
                redirect_uri: rec.redirectUri,
                user_id: rec.userId,
                code_challenge: rec.codeChallenge,
                client_id: rec.clientId,
                resource: rec.resource,
            });
        },
        async consumeAuthCode(code) {
            const key = hashSecret(code);
            const rec = codes.get(key) ?? null;
            codes.delete(key);
            return rec;
        },
        async storeToken() {
            throw new Error("no token is ever minted for the dashboard");
        },
        async storeRefreshToken() {
            throw new Error("no token is ever minted for the dashboard");
        },
        async consumeRefreshToken() {
            return null;
        },
    };
    return { store, codes };
}

const fakeAuth: OAuthAuth = {
    signIn: async () => "user-1",
    signUp: async () => "user-1",
    signInWithGoogleIdToken: async () => "user-1",
};

// A cookie jar for one browser: Set-Cookie in, Cookie out.
class Jar {
    cookies = new Map<string, string>();
    take(res: Response) {
        for (const line of res.headers.getSetCookie()) {
            const [pair] = line.split(";");
            const eq = pair!.indexOf("=");
            const name = pair!.slice(0, eq).trim();
            const value = pair!.slice(eq + 1).trim();
            if (/max-age=0/i.test(line) || value === "")
                this.cookies.delete(name);
            else this.cookies.set(name, value);
        }
    }
    header(): string {
        return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
    }
}

function setCookieLine(res: Response, name: RegExp): string | undefined {
    return res.headers.getSetCookie().find((l) => name.test(l.split("=")[0]!));
}

function build(
    opts: {
        now?: () => number;
        profile?: DashboardAuthDeps["profile"];
        rateLimit?: DashboardAuthDeps["rateLimit"];
    } = {},
) {
    const sessions = fakeSessionStore();
    const oauth = fakeOAuthStore();
    const now = opts.now ?? (() => T0);
    const deps: DashboardAuthDeps = {
        store: sessions.store,
        oauthStore: oauth.store,
        now,
        profile:
            opts.profile ??
            (async () => ({ locale: "de", timezone: "Europe/Kyiv" })),
        // One cache per app, so no test sees another's validated sessions.
        sessionCache: new DashboardSessionCache(),
        ...(opts.rateLimit ? { rateLimit: opts.rateLimit } : {}),
    };
    const app = new Hono();
    app.route(
        "/",
        createOAuthRouter({ store: oauth.store, auth: fakeAuth, now }),
    );
    app.route("/", createDashboardAuthRouter(deps));
    app.get("/api/dashboard/probe", dashboardSession(deps), (c) =>
        c.json({ userId: c.get("dashboardUserId") }),
    );
    app.get("/page", async (c) =>
        c.json({ userId: await readDashboardUserId(c, deps) }),
    );
    return { app, sessions, oauth, deps };
}

type App = ReturnType<typeof build>["app"];

async function startLogin(
    app: App,
    jar: Jar,
    headers: Record<string, string> = HTTPS,
    query = "",
) {
    const res = await app.request(`/dashboard/login${query}`, {
        headers: { ...headers, cookie: jar.header() },
    });
    jar.take(res);
    const location = new URL(res.headers.get("location")!, "http://x");
    return { res, location };
}

// Drives the whole flow: login -> /authorize page -> /approve -> callback.
async function signIn(
    app: App,
    jar: Jar,
    headers: Record<string, string> = HTTPS,
    query = "",
) {
    const { location } = await startLogin(app, jar, headers, query);
    const page = await app.request(location.pathname + location.search, {
        headers: { ...headers, cookie: jar.header() },
    });
    jar.take(page);
    const html = await page.text();
    const sessionId = /name="session_id"\s+value="([^"]+)"/.exec(html)![1]!;
    const approve = await app.request("/approve", {
        method: "POST",
        headers: {
            ...headers,
            cookie: jar.header(),
            "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            session_id: sessionId,
            email: "a@example.com",
            password: "pw",
            action: "signin",
        }).toString(),
    });
    jar.take(approve);
    const back = new URL(approve.headers.get("location")!);
    const callback = await app.request(back.pathname + back.search, {
        headers: { ...headers, cookie: jar.header() },
    });
    jar.take(callback);
    return { page, html, approve, back, callback };
}

// ---------- paths ----------

describe("isDashboardPath", () => {
    test("covers the pages, the sign-in routes and the API", () => {
        for (const p of [
            "/dashboard",
            "/dashboard/login",
            "/dashboard/callback",
            "/dashboard/logout",
            "/dashboard/widget/trends",
            "/de/dashboard",
            "/ja/dashboard",
            "/api/dashboard/session",
            "/api/dashboard/tool/get_trends",
        ])
            expect(`${p}: ${isDashboardPath(p)}`).toBe(`${p}: true`);
    });
    test("nothing else", () => {
        for (const p of [
            "/",
            "/dashboard.js",
            "/dashboards",
            "/en/dashboard",
            "/xx/dashboard",
            "/de/dashboard/x",
            "/api/dashboards",
            "/mcp",
            "/authorize",
        ])
            expect(`${p}: ${isDashboardPath(p)}`).toBe(`${p}: false`);
    });
});

// ---------- /dashboard/login ----------

describe("GET /dashboard/login", () => {
    test("redirects to /authorize as the dashboard client with an S256 challenge", async () => {
        const { app } = build();
        const jar = new Jar();
        const { res, location } = await startLogin(
            app,
            jar,
            HTTPS,
            "?locale=pl",
        );
        expect(res.status).toBe(302);
        expect(res.headers.get("cache-control")).toBe("no-store");
        expect(location.pathname).toBe("/authorize");
        const q = location.searchParams;
        expect(q.get("response_type")).toBe("code");
        expect(q.get("client_id")).toBe(DASHBOARD_CLIENT_ID);
        expect(q.get("redirect_uri")).toBe(`${HTTPS_BASE}/dashboard/callback`);
        expect(q.get("state")).toMatch(/^[0-9a-f]{64}$/);
        expect(q.get("code_challenge")).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(q.get("code_challenge_method")).toBe("S256");
        expect(q.get("locale")).toBe("pl");
        // The verifier never leaves the server.
        expect(location.search).not.toContain("verifier");
    });

    test("an unknown locale falls back to English and is not passed on", async () => {
        const { app } = build();
        const { location } = await startLogin(
            app,
            new Jar(),
            HTTPS,
            "?locale=xx",
        );
        expect(location.searchParams.get("locale")).toBeNull();
    });

    test("each flow gets a fresh state, challenge and start cookie", async () => {
        const { app } = build();
        const jar = new Jar();
        const a = await startLogin(app, jar);
        const b = await startLogin(app, jar);
        expect(a.location.searchParams.get("state")).not.toBe(
            b.location.searchParams.get("state"),
        );
        expect(a.location.searchParams.get("code_challenge")).not.toBe(
            b.location.searchParams.get("code_challenge"),
        );
        const starts = [...jar.cookies.keys()].filter((k) =>
            k.startsWith("__Host-nm_dash_start_"),
        );
        expect(starts).toHaveLength(2);
    });

    test("start cookie: __Host-, Secure, HttpOnly, Lax, Path=/, 10 minutes on https", async () => {
        const { app } = build();
        const { res } = await startLogin(app, new Jar(), HTTPS);
        const line = setCookieLine(res, /nm_dash_start_/)!;
        expect(line).toMatch(/^__Host-nm_dash_start_[0-9a-f]{16}=/);
        expect(line).toContain("Secure");
        expect(line).toContain("HttpOnly");
        expect(line).toContain("SameSite=Lax");
        expect(line).toContain("Path=/");
        expect(line).toContain(`Max-Age=${DASHBOARD_SIGN_IN_TTL_MS / 1000}`);
        expect(line).not.toContain("Domain");
    });

    test("start cookie on plain-http dev: bare name, no Secure", async () => {
        const { app } = build();
        const { res, location } = await startLogin(app, new Jar(), HTTP);
        const line = setCookieLine(res, /nm_dash_start_/)!;
        expect(line).toMatch(/^nm_dash_start_[0-9a-f]{16}=/);
        expect(line).not.toContain("Secure");
        expect(line).toContain("HttpOnly");
        expect(location.searchParams.get("redirect_uri")).toBe(
            `${HTTP_BASE}/dashboard/callback`,
        );
    });

    test("already signed in: straight to the dashboard, no new flow", async () => {
        const { app } = build();
        const jar = new Jar();
        await signIn(app, jar);
        const res = await app.request("/dashboard/login?locale=de", {
            headers: { ...HTTPS, cookie: jar.header() },
        });
        expect(res.status).toBe(303);
        expect(res.headers.get("location")).toBe("/de/dashboard");
        expect(setCookieLine(res, /nm_dash_start_/)).toBeUndefined();
    });

    test("is throttled per IP with the auth limiter", async () => {
        const { app } = build();
        let last: Response | undefined;
        for (let i = 0; i < 31; i++) {
            last = await app.request("/dashboard/login", {
                headers: { ...HTTPS, "x-forwarded-for": "198.51.100.7" },
            });
        }
        expect(last!.status).toBe(429);
    });
});

// ---------- the login page variant ----------

describe("the login page for the dashboard client", () => {
    test("/authorize shows the dashboard heading and notice", async () => {
        const { app } = build();
        const jar = new Jar();
        const { html } = await signIn(app, jar);
        expect(html).toContain(LOGIN_DASHBOARD.en.title);
        expect(html).toContain(LOGIN_DASHBOARD.en.subtitle);
        expect(html).toContain(LOGIN_CLIENT_NOTICE.en.dashboard);
        expect(html).not.toContain(LOGIN.en.subtitle);
        // Both email actions stay: sign-up is explicit.
        expect(html).toMatch(/name="action"\s+value="signin"/);
        expect(html).toMatch(/name="action"\s+value="signup"/);
    });

    test("/authorize refuses the dashboard client with any other redirect", async () => {
        const { app } = build();
        for (const redirect of [
            "https://evil.test/dashboard/callback",
            `${HTTPS_BASE}/dashboard/callback/`,
            `${HTTPS_BASE}/health-sync/callback`,
            `${HTTP_BASE}/dashboard/callback`,
        ]) {
            const q = new URLSearchParams({
                response_type: "code",
                client_id: DASHBOARD_CLIENT_ID,
                redirect_uri: redirect,
                state: "s",
                code_challenge: pkceS256(newOpaqueToken()),
                code_challenge_method: "S256",
            });
            const res = await app.request(`/authorize?${q}`, {
                headers: HTTPS,
            });
            expect(`${redirect}: ${res.status}`).toBe(`${redirect}: 400`);
            expect(res.headers.get("location")).toBeNull();
        }
    });

    test("/token refuses the dashboard client", async () => {
        const { app } = build();
        const res = await app.request("/token", {
            method: "POST",
            headers: {
                ...HTTPS,
                "content-type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                client_id: DASHBOARD_CLIENT_ID,
                code: "x",
                redirect_uri: `${HTTPS_BASE}/dashboard/callback`,
                code_verifier: newOpaqueToken(),
            }).toString(),
        });
        expect(res.status).toBe(401);
        expect(((await res.json()) as { error: string }).error).toBe(
            "invalid_client",
        );
    });

    test("every locale renders its dashboard heading, subtitle and notice", async () => {
        for (const locale of SITE_LOCALES) {
            const session: OAuthSession = {
                state: "s",
                redirectUri: `${HTTPS_BASE}/dashboard/callback`,
                codeChallenge: pkceS256(newOpaqueToken()),
                codeChallengeMethod: "S256",
                redirectHost: "nm.test",
                redirectKind: "https",
                clientId: DASHBOARD_CLIENT_ID,
                locale,
                browserBinding: "x",
            };
            const html = await renderLoginPage("sid", session);
            const dash = LOGIN_DASHBOARD[locale];
            const doc = LOGIN[locale];
            const has = (s: string) => `${locale} [${s}]: ${html.includes(s)}`;
            expect(has(`>${dash.title}</h1>`)).toBe(
                `${locale} [>${dash.title}</h1>]: true`,
            );
            expect(has(`<p class="auth-sub">${dash.subtitle}</p>`)).toBe(
                `${locale} [<p class="auth-sub">${dash.subtitle}</p>]: true`,
            );
            expect(has(`<title>${doc.title} — ${dash.title}</title>`)).toBe(
                `${locale} [<title>${doc.title} — ${dash.title}</title>]: true`,
            );
            expect(has(LOGIN_CLIENT_NOTICE[locale].dashboard)).toBe(
                `${locale} [${LOGIN_CLIENT_NOTICE[locale].dashboard}]: true`,
            );
            // The default heading and the "close this tab" note are gone.
            expect(has(doc.subtitle)).toBe(
                `${locale} [${doc.subtitle}]: false`,
            );
            expect(has(doc.afterConnectNote)).toBe(
                `${locale} [${doc.afterConnectNote}]: false`,
            );
            // Translated, not English underneath.
            if (locale !== "en") {
                expect(dash.title).not.toBe(LOGIN_DASHBOARD.en.title);
                expect(dash.subtitle).not.toBe(LOGIN_DASHBOARD.en.subtitle);
                expect(LOGIN_CLIENT_NOTICE[locale].dashboard).not.toBe(
                    LOGIN_CLIENT_NOTICE.en.dashboard,
                );
            }
        }
    });

    test("other clients keep the default page", async () => {
        const session: OAuthSession = {
            state: "s",
            redirectUri: "https://claude.ai/api/mcp/auth_callback",
            codeChallenge: pkceS256(newOpaqueToken()),
            codeChallengeMethod: "S256",
            redirectHost: "claude.ai",
            redirectKind: "https",
            clientId: "some-client",
            locale: "en",
            browserBinding: "x",
        };
        const html = await renderLoginPage("sid", session);
        expect(html).toContain(LOGIN.en.subtitle);
        expect(html).toContain(LOGIN.en.afterConnectNote);
        expect(html).not.toContain(LOGIN_DASHBOARD.en.title);
        expect(html).not.toContain(LOGIN_CLIENT_NOTICE.en.dashboard);
    });

    test("the client resolves in memory like the health-sync one", async () => {
        const store = withFirstPartyClients(fakeOAuthStore().store);
        expect(await store.getClient(DASHBOARD_CLIENT_ID)).toBe(
            DASHBOARD_CLIENT,
        );
        expect(DASHBOARD_CLIENT.firstParty).toBe("dashboard");
        expect(DASHBOARD_CLIENT.authMethod).toBe("none");
        expect((await store.getClient(HEALTH_SYNC_CLIENT_ID))?.firstParty).toBe(
            "health-sync",
        );
    });
});

// ---------- /dashboard/callback ----------

describe("GET /dashboard/callback", () => {
    test("the full flow opens a session and lands on the locale's dashboard", async () => {
        const { app, sessions } = build();
        const jar = new Jar();
        const { back, callback } = await signIn(app, jar, HTTPS, "?locale=de");
        expect(back.origin + back.pathname).toBe(
            `${HTTPS_BASE}/dashboard/callback`,
        );
        expect(callback.status).toBe(303);
        expect(callback.headers.get("location")).toBe("/de/dashboard");
        expect(callback.headers.get("cache-control")).toBe("no-store");
        // One row, holding only the hash of the cookie value.
        expect(sessions.rows.size).toBe(1);
        const raw = jar.cookies.get("__Host-nm_dash")!;
        expect(raw).toMatch(/^nmds_[A-Za-z0-9_-]{43}$/);
        const row = [...sessions.rows.values()][0]!;
        expect(row.token_hash).toBe(hashSecret(raw));
        expect(row.user_id).toBe("user-1");
        expect(row.expires_at).toBe(
            new Date(T0 + DASHBOARD_SESSION_IDLE_MS).toISOString(),
        );
        expect(row.absolute_expires_at).toBe(
            new Date(T0 + DASHBOARD_SESSION_ABSOLUTE_MS).toISOString(),
        );
        // The start cookie is spent.
        expect(
            [...jar.cookies.keys()].some((k) => k.includes("nm_dash_start_")),
        ).toBe(false);
    });

    test("session cookie on https: __Host-nm_dash, Secure, HttpOnly, Lax, Path=/, 30 days", async () => {
        const { app } = build();
        const { callback } = await signIn(app, new Jar(), HTTPS);
        const line = setCookieLine(callback, /^(__Host-)?nm_dash$/)!;
        expect(line).toMatch(/^__Host-nm_dash=nmds_/);
        expect(line).toContain("Secure");
        expect(line).toContain("HttpOnly");
        expect(line).toContain("SameSite=Lax");
        expect(line).toContain("Path=/");
        expect(line).toContain(
            `Max-Age=${DASHBOARD_SESSION_ABSOLUTE_MS / 1000}`,
        );
        expect(line).not.toContain("Domain");
    });

    test("session cookie on plain http: nm_dash without Secure", async () => {
        const { app } = build();
        const { callback } = await signIn(app, new Jar(), HTTP);
        const line = setCookieLine(callback, /^(__Host-)?nm_dash$/)!;
        expect(line).toMatch(/^nm_dash=nmds_/);
        expect(line).not.toContain("Secure");
        expect(line).toContain("HttpOnly");
        expect(callback.headers.get("location")).toBe("/dashboard");
    });

    // Starts a flow and returns what a hand-built callback needs.
    async function started(app: App, jar: Jar) {
        const { location } = await startLogin(app, jar);
        return {
            state: location.searchParams.get("state")!,
            challenge: location.searchParams.get("code_challenge")!,
        };
    }

    async function seedCode(
        oauth: ReturnType<typeof fakeOAuthStore>,
        over: Partial<{
            clientId: string;
            redirectUri: string;
            codeChallenge: string;
            resource: string | null;
        }>,
        challenge: string,
    ) {
        const code = newOpaqueToken();
        await oauth.store.storeAuthCode({
            code,
            userId: "user-1",
            clientId: over.clientId ?? DASHBOARD_CLIENT_ID,
            redirectUri: over.redirectUri ?? `${HTTPS_BASE}/dashboard/callback`,
            codeChallenge: over.codeChallenge ?? challenge,
            resource: over.resource === undefined ? null : over.resource,
        });
        return code;
    }

    async function callback(app: App, jar: Jar, q: Record<string, string>) {
        const res = await app.request(
            `/dashboard/callback?${new URLSearchParams(q)}`,
            { headers: { ...HTTPS, cookie: jar.header() } },
        );
        jar.take(res);
        return res;
    }

    test("a correct hand-built callback succeeds (baseline for the refusals)", async () => {
        const { app, oauth } = build();
        const jar = new Jar();
        const { state, challenge } = await started(app, jar);
        const code = await seedCode(oauth, {}, challenge);
        const res = await callback(app, jar, { code, state });
        expect(res.status).toBe(303);
    });

    for (const [name, over] of [
        ["a code issued to another client", { clientId: "other-client" }],
        [
            "a code issued to the health-sync client",
            { clientId: HEALTH_SYNC_CLIENT_ID },
        ],
        [
            "a code for another redirect",
            { redirectUri: "https://evil.test/dashboard/callback" },
        ],
        [
            "a code whose challenge is not this flow's verifier",
            { codeChallenge: pkceS256(newOpaqueToken()) },
        ],
        ["a code bound to an MCP resource", { resource: `${HTTPS_BASE}/mcp` }],
    ] as const) {
        test(`refuses ${name}, and spends it`, async () => {
            const { app, oauth, sessions } = build();
            const jar = new Jar();
            const { state, challenge } = await started(app, jar);
            const code = await seedCode(oauth, over, challenge);
            const res = await callback(app, jar, { code, state });
            expect(res.status).toBe(400);
            expect(res.headers.get("content-security-policy")).toContain(
                "default-src 'none'",
            );
            expect(await res.text()).toContain('href="/dashboard/login"');
            expect(sessions.rows.size).toBe(0);
            expect(setCookieLine(res, /^(__Host-)?nm_dash$/)).toBeUndefined();
            expect(oauth.codes.size).toBe(0);
        });
    }

    test("refuses a callback without the start cookie and spends its code", async () => {
        const { app, oauth, sessions } = build();
        const owner = new Jar();
        const { state, challenge } = await started(app, owner);
        const code = await seedCode(oauth, {}, challenge);
        // A different browser (the victim of a forwarded link) has no cookie.
        const res = await callback(app, new Jar(), { code, state });
        expect(res.status).toBe(400);
        expect(sessions.rows.size).toBe(0);
        // Spent: carrying the callback URL to the browser that holds the
        // start cookie (login CSRF the other way round) opens nothing.
        expect(oauth.codes.size).toBe(0);
        const replay = await callback(app, owner, { code, state });
        expect(replay.status).toBe(400);
        expect(sessions.rows.size).toBe(0);
    });

    test("a flow needs no server memory: another router instance finishes it", async () => {
        const { app, oauth, deps, sessions } = build();
        const jar = new Jar();
        const { state, challenge } = await started(app, jar);
        // Other starts in between evict nothing: nothing is held.
        for (let i = 0; i < 20; i++) await started(app, new Jar());
        const replica = new Hono();
        replica.route("/", createDashboardAuthRouter(deps));
        const code = await seedCode(oauth, {}, challenge);
        const res = await callback(replica as unknown as App, jar, {
            code,
            state,
        });
        expect(res.status).toBe(303);
        expect(sessions.rows.size).toBe(1);
    });

    test("a start cookie edited in the browser no longer matches its state", async () => {
        const { app, oauth } = build();
        const jar = new Jar();
        const { state, challenge } = await started(app, jar);
        const name = [...jar.cookies.keys()].find((k) =>
            k.includes("nm_dash_start_"),
        )!;
        const value = jar.cookies.get(name)!;
        expect(value.split(".")).toHaveLength(3);
        jar.cookies.set(name, value.replace(/\.en\./, ".de."));
        const code = await seedCode(oauth, {}, challenge);
        const res = await callback(app, jar, { code, state });
        expect(res.status).toBe(400);
        expect(oauth.codes.size).toBe(0);
    });

    test("refuses another flow's start cookie", async () => {
        const { app, oauth } = build();
        const jar = new Jar();
        const a = await started(app, jar);
        const other = new Jar();
        await started(app, other);
        // Put the other browser's start cookie value under a's name.
        const aName = [...jar.cookies.keys()].find((k) =>
            k.includes("nm_dash_start_"),
        )!;
        const forged = new Jar();
        forged.cookies.set(aName, [...other.cookies.values()][0]!);
        const code = await seedCode(oauth, {}, a.challenge);
        const res = await callback(app, forged, { code, state: a.state });
        expect(res.status).toBe(400);
        expect(oauth.codes.size).toBe(0);
    });

    test("refuses an unknown or malformed state", async () => {
        const { app } = build();
        expect(
            (
                await callback(app, new Jar(), {
                    code: "c",
                    state: hashSecret(newOpaqueToken()),
                })
            ).status,
        ).toBe(400);
        expect(
            (await callback(app, new Jar(), { code: "c", state: "short" }))
                .status,
        ).toBe(400);
    });

    test("a finished flow clears its start cookie, and its code is spent", async () => {
        const { app, oauth, sessions } = build();
        const jar = new Jar();
        const { state, challenge } = await started(app, jar);
        const keep = new Map(jar.cookies);
        const code = await seedCode(oauth, {}, challenge);
        const done = await callback(app, jar, { code, state });
        expect(done.status).toBe(303);
        expect(
            [...jar.cookies.keys()].some((k) => k.includes("nm_dash_start_")),
        ).toBe(false);
        const replay = new Jar();
        replay.cookies = keep;
        expect((await callback(app, replay, { code, state })).status).toBe(400);
        expect(sessions.rows.size).toBe(1);
    });

    test("a flow expires after ten minutes", async () => {
        let t = T0;
        const { app, oauth } = build({ now: () => t });
        const jar = new Jar();
        const { state, challenge } = await started(app, jar);
        const code = await seedCode(oauth, {}, challenge);
        t = T0 + DASHBOARD_SIGN_IN_TTL_MS;
        expect((await callback(app, jar, { code, state })).status).toBe(410);
        expect(oauth.codes.size).toBe(0);
    });

    test("an error redirect from /authorize or a wrong iss is refused", async () => {
        const { app, oauth } = build();
        const jar = new Jar();
        const a = await started(app, jar);
        expect(
            (
                await callback(app, jar, {
                    state: a.state,
                    error: "invalid_request",
                })
            ).status,
        ).toBe(400);
        const b = await started(app, jar);
        const code = await seedCode(oauth, {}, b.challenge);
        expect(
            (
                await callback(app, jar, {
                    code,
                    state: b.state,
                    iss: "https://evil.test",
                })
            ).status,
        ).toBe(400);
    });
});

// ---------- sessions ----------

describe("sessions", () => {
    async function signedIn(now: () => number) {
        const built = build({ now });
        const jar = new Jar();
        await signIn(built.app, jar);
        return { ...built, jar };
    }

    async function probe(app: App, jar: Jar) {
        return app.request("/api/dashboard/probe", {
            headers: { ...HTTPS, cookie: jar.header() },
        });
    }

    test("dashboardSession sets the user id on a valid cookie", async () => {
        const { app, jar } = await signedIn(() => T0);
        const res = await probe(app, jar);
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ userId: "user-1" });
    });

    test("dashboardSession never reads a Bearer header", async () => {
        const { app, jar } = await signedIn(() => T0);
        const raw = jar.cookies.get("__Host-nm_dash")!;
        const res = await app.request("/api/dashboard/probe", {
            headers: { ...HTTPS, Authorization: `Bearer ${raw}` },
        });
        expect(res.status).toBe(401);
    });

    test("the bare cookie name is ignored on https", async () => {
        const { app, jar } = await signedIn(() => T0);
        const raw = jar.cookies.get("__Host-nm_dash")!;
        const res = await app.request("/api/dashboard/probe", {
            headers: { ...HTTPS, cookie: `nm_dash=${raw}` },
        });
        expect(res.status).toBe(401);
    });

    test("idle expiry: a week without use ends the session", async () => {
        let t = T0;
        const { app, jar } = await signedIn(() => t);
        t = T0 + DASHBOARD_SESSION_IDLE_MS - 1;
        expect((await probe(app, jar)).status).toBe(200);
        // That use slid the idle expiry a week on.
        t = T0 + 2 * DASHBOARD_SESSION_IDLE_MS - 2;
        expect((await probe(app, jar)).status).toBe(200);
        t += DASHBOARD_SESSION_IDLE_MS;
        const res = await probe(app, jar);
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({
            ok: false,
            error: "unauthenticated",
            message: "Sign in again.",
        });
    });

    test("the idle expiry slides at most hourly", async () => {
        let t = T0;
        const { app, jar, sessions } = await signedIn(() => t);
        t = T0 + 30 * 60 * 1000;
        await probe(app, jar);
        expect(sessions.touches).toHaveLength(0);
        t = T0 + 60 * 60 * 1000;
        await probe(app, jar);
        expect(sessions.touches).toHaveLength(1);
        expect(sessions.touches[0]!.expiresAt).toBe(
            new Date(t + DASHBOARD_SESSION_IDLE_MS).toISOString(),
        );
        t += 10 * 60 * 1000;
        await probe(app, jar);
        expect(sessions.touches).toHaveLength(1);
    });

    test("absolute expiry: 30 days after sign-in, however often it is used", async () => {
        let t = T0;
        const { app, jar, sessions } = await signedIn(() => t);
        // Use it every day for 29 days.
        for (let d = 1; d < 30; d++) {
            t = T0 + d * 24 * 60 * 60 * 1000;
            expect((await probe(app, jar)).status).toBe(200);
        }
        // The slide never passes the absolute expiry.
        const last = sessions.touches.at(-1)!;
        expect(last.expiresAt).toBe(
            new Date(T0 + DASHBOARD_SESSION_ABSOLUTE_MS).toISOString(),
        );
        t = T0 + DASHBOARD_SESSION_ABSOLUTE_MS;
        expect((await probe(app, jar)).status).toBe(401);
    });

    test("a store that ignores expiry still cannot extend a session", async () => {
        let t = T0;
        const built = await signedIn(() => t);
        const lenient: DashboardSessionStore = {
            ...built.sessions.store,
            async lookup(token) {
                const row = built.sessions.rows.get(hashSecret(token));
                return row
                    ? { status: "valid", session: row }
                    : { status: "invalid" };
            },
        };
        const app = new Hono();
        app.get("/p", dashboardSession({ store: lenient, now: () => t }), (c) =>
            c.text("in"),
        );
        t = T0 + DASHBOARD_SESSION_ABSOLUTE_MS + 1;
        const res = await app.request("/p", {
            headers: { ...HTTPS, cookie: built.jar.header() },
        });
        expect(res.status).toBe(401);
    });

    test("an outage is 503 unavailable, not a sign-out", async () => {
        const { app, jar, sessions } = await signedIn(() => T0);
        sessions.setDown(true);
        const res = await probe(app, jar);
        expect(res.status).toBe(503);
        expect(((await res.json()) as { error: string }).error).toBe(
            "unavailable",
        );
        expect(setCookieLine(res, /^(__Host-)?nm_dash$/)).toBeUndefined();
    });

    test("readDashboardUserId: the user id, or null", async () => {
        const { app, jar } = await signedIn(() => T0);
        const ok = await app.request("/page", {
            headers: { ...HTTPS, cookie: jar.header() },
        });
        expect(await ok.json()).toEqual({ userId: "user-1" });
        const none = await app.request("/page", { headers: HTTPS });
        expect(await none.json()).toEqual({ userId: null });
        const bad = await app.request("/page", {
            headers: {
                ...HTTPS,
                cookie: `__Host-nm_dash=${DASHBOARD_SESSION_PREFIX}${newOpaqueToken()}`,
            },
        });
        expect(await bad.json()).toEqual({ userId: null });
    });

    test("readDashboardUserId throws on an outage instead of answering null", async () => {
        const { jar, sessions, deps } = await signedIn(() => T0);
        sessions.setDown(true);
        const app = new Hono();
        app.get("/page", async (c) => {
            try {
                await readDashboardUserId(c, deps);
                return c.text("answered");
            } catch (e) {
                return c.text((e as Error).name, 503);
            }
        });
        const res = await app.request("/page", {
            headers: { ...HTTPS, cookie: jar.header() },
        });
        expect(res.status).toBe(503);
        expect(await res.text()).toBe("DashboardSessionUnavailableError");
    });
});

// ---------- GET /api/dashboard/session ----------

describe("GET /api/dashboard/session", () => {
    test("401 without a cookie", async () => {
        const { app } = build();
        const res = await app.request("/api/dashboard/session", {
            headers: HTTPS,
        });
        expect(res.status).toBe(401);
        expect(res.headers.get("cache-control")).toBe("private, no-store");
        expect(await res.json()).toEqual({
            ok: false,
            error: "unauthenticated",
            message: "Sign in again.",
        });
    });

    test("401 with an unknown or malformed cookie, which is cleared", async () => {
        const { app } = build();
        for (const value of [
            `${DASHBOARD_SESSION_PREFIX}${newOpaqueToken()}`,
            "garbage",
        ]) {
            const res = await app.request("/api/dashboard/session", {
                headers: { ...HTTPS, cookie: `__Host-nm_dash=${value}` },
            });
            expect(res.status).toBe(401);
            const line = setCookieLine(res, /^__Host-nm_dash$/)!;
            expect(line).toContain("Max-Age=0");
        }
    });

    test("200 with the derived csrf, the saved locale and timezone", async () => {
        const { app } = build();
        const jar = new Jar();
        await signIn(app, jar);
        const raw = jar.cookies.get("__Host-nm_dash")!;
        const res = await app.request("/api/dashboard/session", {
            headers: { ...HTTPS, cookie: jar.header() },
        });
        expect(res.status).toBe(200);
        expect(res.headers.get("cache-control")).toBe("private, no-store");
        const body = (await res.json()) as Record<string, unknown>;
        expect(body).toEqual({
            ok: true,
            csrf: hashSecret(`dashboard-csrf:${raw}`),
            locale: "de",
            timezone: "Europe/Kyiv",
        });
        // Stable across calls (and so across tabs).
        const again = await app.request("/api/dashboard/session", {
            headers: { ...HTTPS, cookie: jar.header() },
        });
        expect(((await again.json()) as { csrf: string }).csrf).toBe(
            body.csrf as string,
        );
    });

    test("defaults to en and UTC for a user with no preferences", async () => {
        const { app } = build({
            profile: async () => ({ locale: null, timezone: null }),
        });
        const jar = new Jar();
        await signIn(app, jar);
        const res = await app.request("/api/dashboard/session", {
            headers: { ...HTTPS, cookie: jar.header() },
        });
        expect(await res.json()).toMatchObject({
            locale: "en",
            timezone: "UTC",
        });
    });

    test("503 when the profile cannot be read", async () => {
        const { app } = build({
            profile: async () => {
                throw new Error("down");
            },
        });
        const jar = new Jar();
        await signIn(app, jar);
        const res = await app.request("/api/dashboard/session", {
            headers: { ...HTTPS, cookie: jar.header() },
        });
        expect(res.status).toBe(503);
        // Sign out still works: the csrf needs only the cookie.
        const raw = jar.cookies.get("__Host-nm_dash")!;
        expect(((await res.json()) as { csrf: string }).csrf).toBe(
            dashboardCsrf(raw),
        );
    });

    test("is on the per-user dashboard bucket", async () => {
        const seen: string[] = [];
        const { app } = build({
            rateLimit: (userId) => {
                seen.push(userId);
                return { allowed: false, retryAfterSeconds: 7 };
            },
        });
        const jar = new Jar();
        await signIn(app, jar);
        const res = await app.request("/api/dashboard/session", {
            headers: { ...HTTPS, cookie: jar.header() },
        });
        expect(res.status).toBe(429);
        expect(res.headers.get("retry-after")).toBe("7");
        expect(((await res.json()) as { error: string }).error).toBe(
            "rate_limited",
        );
        expect(seen).toEqual(["user-1"]);
    });
});

// ---------- cookie lookups per IP ----------

describe("failed cookie lookups are throttled per IP", () => {
    const forged = () =>
        `__Host-nm_dash=${DASHBOARD_SESSION_PREFIX}${newOpaqueToken()}`;

    test("past the limit a forged cookie is refused before any lookup", async () => {
        const { app, sessions } = build();
        const ip = { "x-forwarded-for": "203.0.113.9" };
        for (let i = 0; i < DASHBOARD_LOOKUP_FAILURE_LIMIT; i++) {
            const res = await app.request("/api/dashboard/session", {
                headers: { ...HTTPS, ...ip, cookie: forged() },
            });
            expect(res.status).toBe(401);
        }
        expect(sessions.counts.lookups).toBe(DASHBOARD_LOOKUP_FAILURE_LIMIT);
        for (const path of ["/api/dashboard/session", "/api/dashboard/probe"]) {
            const res = await app.request(path, {
                headers: { ...HTTPS, ...ip, cookie: forged() },
            });
            expect(res.status).toBe(429);
            expect(res.headers.get("retry-after")).toMatch(/^\d+$/);
            expect(((await res.json()) as { error: string }).error).toBe(
                "rate_limited",
            );
        }
        const page = await app.request("/page", {
            headers: { ...HTTPS, ...ip, cookie: forged() },
        });
        // readDashboardUserId throws (the next test), with no lookup either.
        expect(page.status).toBe(500);
        expect(sessions.counts.lookups).toBe(DASHBOARD_LOOKUP_FAILURE_LIMIT);
        // Another IP is unaffected.
        const other = await app.request("/api/dashboard/session", {
            headers: {
                ...HTTPS,
                "x-forwarded-for": "198.51.100.1",
                cookie: forged(),
            },
        });
        expect(other.status).toBe(401);
    });

    test("readDashboardUserId throws DashboardSessionThrottledError", async () => {
        const { deps } = build();
        const app = new Hono();
        app.get("/p", async (c) => {
            try {
                return c.json({ userId: await readDashboardUserId(c, deps) });
            } catch (err) {
                return c.json(
                    {
                        throttled:
                            err instanceof DashboardSessionThrottledError,
                    },
                    429,
                );
            }
        });
        const ip = { "x-forwarded-for": "203.0.113.10" };
        for (let i = 0; i < DASHBOARD_LOOKUP_FAILURE_LIMIT; i++) {
            await app.request("/p", {
                headers: { ...HTTPS, ...ip, cookie: forged() },
            });
        }
        const res = await app.request("/p", {
            headers: { ...HTTPS, ...ip, cookie: forged() },
        });
        expect(await res.json()).toEqual({ throttled: true });
    });

    test("valid sessions and malformed cookies are never charged", async () => {
        const { app, sessions } = build();
        const jar = new Jar();
        await signIn(app, jar);
        const ip = { "x-forwarded-for": "203.0.113.11" };
        for (let i = 0; i < DASHBOARD_LOOKUP_FAILURE_LIMIT + 5; i++) {
            const ok = await app.request("/api/dashboard/probe", {
                headers: { ...HTTPS, ...ip, cookie: jar.header() },
            });
            expect(ok.status).toBe(200);
            const bad = await app.request("/api/dashboard/probe", {
                headers: { ...HTTPS, ...ip, cookie: "__Host-nm_dash=junk" },
            });
            expect(bad.status).toBe(401);
        }
        expect(sessions.counts.lookups).toBe(
            DASHBOARD_LOOKUP_FAILURE_LIMIT + 5,
        );
    });
});

describe("failed cookie lookups are bounded process-wide", () => {
    const forged = () =>
        `__Host-nm_dash=${DASHBOARD_SESSION_PREFIX}${newOpaqueToken()}`;
    let ipSeq = 0;
    // A fresh x-forwarded-for per request, as a caller rotating it would send.
    const rotatedIp = () => {
        ipSeq++;
        return `10.${(ipSeq >> 16) & 255}.${(ipSeq >> 8) & 255}.${ipSeq & 255}`;
    };

    async function exhaust(app: App) {
        for (let i = 0; i < DASHBOARD_LOOKUP_FAILURE_GLOBAL_LIMIT; i++) {
            const res = await app.request("/api/dashboard/probe", {
                headers: {
                    ...HTTPS,
                    "x-forwarded-for": rotatedIp(),
                    cookie: forged(),
                },
            });
            expect(res.status).toBe(401);
        }
    }

    function probe(app: App, cookie: string, ip = rotatedIp()) {
        return app.request("/api/dashboard/probe", {
            headers: { ...HTTPS, "x-forwarded-for": ip, cookie },
        });
    }

    test("a rotated x-forwarded-for still hits the global cap, before any read", async () => {
        expect(DASHBOARD_LOOKUP_FAILURE_GLOBAL_LIMIT).toBeGreaterThan(
            DASHBOARD_LOOKUP_FAILURE_LIMIT,
        );
        const { app, sessions } = build();
        await exhaust(app);
        expect(sessions.counts.lookups).toBe(
            DASHBOARD_LOOKUP_FAILURE_GLOBAL_LIMIT,
        );
        for (const path of ["/api/dashboard/probe", "/api/dashboard/session"]) {
            const res = await app.request(path, {
                headers: {
                    ...HTTPS,
                    "x-forwarded-for": rotatedIp(),
                    cookie: forged(),
                },
            });
            expect(res.status).toBe(429);
            expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
        }
        expect(sessions.counts.lookups).toBe(
            DASHBOARD_LOOKUP_FAILURE_GLOBAL_LIMIT,
        );
    });

    test("a session validated here still passes while the cap is spent, with no read", async () => {
        const { app, sessions, deps } = build();
        const jar = new Jar();
        await signIn(app, jar);
        // A live session this process has never seen valid (as one created
        // on another replica): nothing cached for this one.
        const other = new Jar();
        await signIn(app, other);
        deps.sessionCache!.forget(other.cookies.get("__Host-nm_dash")!);
        expect((await probe(app, jar.header())).status).toBe(200);
        await exhaust(app);
        const before = sessions.counts.lookups;
        const res = await probe(app, jar.header());
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ userId: "user-1" });
        // The session endpoint and the page path pass too.
        const session = await app.request("/api/dashboard/session", {
            headers: { ...HTTPS, cookie: jar.header() },
        });
        expect(session.status).toBe(200);
        const page = await app.request("/page", {
            headers: { ...HTTPS, cookie: jar.header() },
        });
        expect(await page.json()).toEqual({ userId: "user-1" });
        // An uncached cookie, even a live one, is refused without a read.
        expect((await probe(app, other.header())).status).toBe(429);
        expect(sessions.counts.lookups).toBe(before);
    });

    test("the cache is not consulted outside a throttle", async () => {
        const { app, sessions } = build();
        const jar = new Jar();
        await signIn(app, jar);
        expect((await probe(app, jar.header())).status).toBe(200);
        // Deleted behind this process's back (another replica's sign-out):
        // the next unthrottled request reads the row and is refused.
        sessions.rows.clear();
        expect((await probe(app, jar.header())).status).toBe(401);
        expect(sessions.counts.lookups).toBe(2);
    });

    test("a per-IP refusal lets a cached session through too", async () => {
        const { app } = build();
        const jar = new Jar();
        await signIn(app, jar);
        const ip = "203.0.113.77";
        expect((await probe(app, jar.header(), ip)).status).toBe(200);
        for (let i = 0; i < DASHBOARD_LOOKUP_FAILURE_LIMIT; i++) {
            await probe(app, forged(), ip);
        }
        expect((await probe(app, forged(), ip)).status).toBe(429);
        expect((await probe(app, jar.header(), ip)).status).toBe(200);
    });

    test("sign-out evicts the session from the cache", async () => {
        const { app, sessions } = build();
        const jar = new Jar();
        await signIn(app, jar);
        const raw = jar.cookies.get("__Host-nm_dash")!;
        const cookie = jar.header();
        expect((await probe(app, cookie)).status).toBe(200);
        const out = await app.request("/dashboard/logout", {
            method: "POST",
            headers: {
                ...HTTPS,
                origin: HTTPS_BASE,
                cookie,
                "content-type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ csrf: dashboardCsrf(raw) }).toString(),
        });
        expect(out.status).toBe(303);
        expect(sessions.rows.size).toBe(0);
        await exhaust(app);
        // The old cookie replayed under the throttle is not let through.
        expect((await probe(app, cookie)).status).toBe(429);
    });

    test("past its TTL a cached entry is revalidated by a read, never answered from the cache", async () => {
        let t = T0;
        const { app, sessions } = build({ now: () => t });
        const jar = new Jar();
        await signIn(app, jar);
        expect((await probe(app, jar.header())).status).toBe(200);
        await exhaust(app);
        const before = sessions.counts.lookups;
        t = T0 + DASHBOARD_SESSION_CACHE_TTL_MS - 1;
        expect((await probe(app, jar.header())).status).toBe(200);
        expect(sessions.counts.lookups).toBe(before);
        t = T0 + DASHBOARD_SESSION_CACHE_TTL_MS;
        expect((await probe(app, jar.header())).status).toBe(200);
        expect(sessions.counts.lookups).toBe(before + 1);
        // Deleted behind this process's back: the revalidation sees it.
        sessions.rows.clear();
        t = T0 + 2 * DASHBOARD_SESSION_CACHE_TTL_MS;
        expect((await probe(app, jar.header())).status).toBe(401);
        expect(sessions.counts.lookups).toBe(before + 2);
        // And the entry is gone: the next replay is refused with no read.
        expect((await probe(app, jar.header())).status).toBe(429);
        expect(sessions.counts.lookups).toBe(before + 2);
    });

    test("a flood longer than the TTL never locks out a session validated here", async () => {
        let t = T0;
        const { app, sessions } = build({ now: () => t });
        const jar = new Jar();
        await signIn(app, jar);
        expect((await probe(app, jar.header())).status).toBe(200);
        await exhaust(app);
        // The cap stays spent (the rate-limit window runs on the real clock)
        // while the injected clock walks well past several TTLs, as a page
        // refetching once a minute would.
        for (let i = 1; i <= 5; i++) {
            t = T0 + i * (DASHBOARD_SESSION_CACHE_TTL_MS + 1_000);
            const before = sessions.counts.lookups;
            const res = await probe(app, jar.header());
            expect(res.status).toBe(200);
            expect(await res.json()).toEqual({ userId: "user-1" });
            // One revalidating read per TTL, then cache hits again.
            expect(sessions.counts.lookups).toBe(before + 1);
            expect((await probe(app, jar.header())).status).toBe(200);
            expect(sessions.counts.lookups).toBe(before + 1);
            // A forged cookie is still refused, with no read.
            expect((await probe(app, forged())).status).toBe(429);
            expect(sessions.counts.lookups).toBe(before + 1);
        }
    });

    test("a sign-in that finishes while the cap is spent reaches the dashboard", async () => {
        const { app, sessions } = build();
        await exhaust(app);
        expect((await probe(app, forged())).status).toBe(429);
        const jar = new Jar();
        const { callback } = await signIn(app, jar);
        expect(callback.status).toBe(303);
        const before = sessions.counts.lookups;
        const res = await probe(app, jar.header());
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ userId: "user-1" });
        const session = await app.request("/api/dashboard/session", {
            headers: { ...HTTPS, cookie: jar.header() },
        });
        expect(session.status).toBe(200);
        const page = await app.request("/page", {
            headers: { ...HTTPS, cookie: jar.header() },
        });
        expect(await page.json()).toEqual({ userId: "user-1" });
        expect(sessions.counts.lookups).toBe(before);
    });

    // A store whose lookups all come back invalid, but only once released:
    // every request in the burst is in flight before any read returns.
    function holdLookups(sessions: ReturnType<typeof fakeSessionStore>) {
        let release!: () => void;
        const gate = new Promise<void>((r) => (release = r));
        sessions.store.lookup = async () => {
            sessions.counts.lookups++;
            await gate;
            return { status: "invalid" };
        };
        return release;
    }

    test("a concurrent burst of forged cookies cannot overrun the global cap", async () => {
        const { app, sessions } = build();
        const release = holdLookups(sessions);
        const burst = DASHBOARD_LOOKUP_FAILURE_GLOBAL_LIMIT + 200;
        const pending = Array.from({ length: burst }, () =>
            probe(app, forged()),
        );
        await new Promise((r) => setTimeout(r, 20));
        release();
        const statuses = (await Promise.all(pending)).map((r) => r.status);
        expect(sessions.counts.lookups).toBeLessThanOrEqual(
            DASHBOARD_LOOKUP_FAILURE_GLOBAL_LIMIT,
        );
        expect(statuses.filter((s) => s === 429).length).toBe(
            burst - sessions.counts.lookups,
        );
    });

    test("a concurrent burst from one IP cannot overrun the per-IP cap", async () => {
        const { app, sessions } = build();
        const release = holdLookups(sessions);
        const ip = "203.0.113.200";
        const pending = Array.from(
            { length: DASHBOARD_LOOKUP_FAILURE_LIMIT + 50 },
            () => probe(app, forged(), ip),
        );
        await new Promise((r) => setTimeout(r, 20));
        release();
        await Promise.all(pending);
        expect(sessions.counts.lookups).toBe(DASHBOARD_LOOKUP_FAILURE_LIMIT);
    });

    test("valid lookups give their reservation back, even concurrently", async () => {
        const { app, sessions } = build();
        const jar = new Jar();
        await signIn(app, jar);
        const pending = Array.from(
            { length: DASHBOARD_LOOKUP_FAILURE_GLOBAL_LIMIT + 50 },
            () => probe(app, jar.header()),
        );
        const statuses = (await Promise.all(pending)).map((r) => r.status);
        // Whatever was briefly reserved, none of it stayed counted: a full
        // budget of forged lookups still gets its reads.
        expect(statuses.every((s) => s === 200)).toBe(true);
        const before = sessions.counts.lookups;
        await exhaust(app);
        expect(sessions.counts.lookups).toBe(
            before + DASHBOARD_LOOKUP_FAILURE_GLOBAL_LIMIT,
        );
    });

    test("a cached entry is never trusted past the row's own expiry", async () => {
        let t = T0;
        const { app, sessions } = build({ now: () => t });
        const jar = new Jar();
        await signIn(app, jar);
        const row = [...sessions.rows.values()][0]!;
        row.expires_at = new Date(T0 + 30_000).toISOString();
        expect((await probe(app, jar.header())).status).toBe(200);
        await exhaust(app);
        t = T0 + 29_000;
        expect((await probe(app, jar.header())).status).toBe(200);
        t = T0 + 30_000;
        expect((await probe(app, jar.header())).status).toBe(429);
    });

    test("DashboardSessionCache is bounded, oldest first, and keyed by hash", () => {
        const cache = new DashboardSessionCache(60_000, 2);
        const entry = (userId: string) => ({
            userId,
            validatedAt: T0,
            expiresAt: T0 + DASHBOARD_SESSION_IDLE_MS,
            absoluteExpiresAt: T0 + DASHBOARD_SESSION_IDLE_MS,
        });
        cache.remember("tok-a", entry("a"));
        cache.remember("tok-b", entry("b"));
        cache.remember("tok-c", entry("c"));
        expect(cache.size).toBe(2);
        expect(cache.get("tok-a", T0)).toBeUndefined();
        expect(cache.get("tok-b", T0)).toBe("b");
        expect(cache.get("tok-c", T0)).toBe("c");
        // The hash of a token is not the token.
        expect(cache.get(hashSecret("tok-c"), T0)).toBeUndefined();
        cache.forget("tok-c");
        expect(cache.get("tok-c", T0)).toBeUndefined();
    });

    test("DashboardSessionCache keeps an entry past its TTL as known, until the row expires", () => {
        const cache = new DashboardSessionCache(60_000);
        cache.remember("tok", {
            userId: "u",
            validatedAt: T0,
            expiresAt: T0 + 120_000,
            absoluteExpiresAt: T0 + DASHBOARD_SESSION_ABSOLUTE_MS,
        });
        expect(cache.get("tok", T0 + 59_999)).toBe("u");
        expect(cache.get("tok", T0 + 60_000)).toBeUndefined();
        expect(cache.known("tok", T0 + 60_000)).toBe(true);
        expect(cache.known("tok", T0 + 120_000)).toBe(false);
        // Dropped once past the row's expiry, not just hidden.
        expect(cache.size).toBe(0);
        expect(cache.known("never-seen", T0)).toBe(false);
    });
});

// ---------- POST /dashboard/logout ----------

describe("POST /dashboard/logout", () => {
    async function signedIn() {
        const built = build();
        const jar = new Jar();
        await signIn(built.app, jar);
        const raw = jar.cookies.get("__Host-nm_dash")!;
        return { ...built, jar, raw };
    }

    function logout(
        app: App,
        jar: Jar,
        body: Record<string, string>,
        headers: Record<string, string> = { origin: HTTPS_BASE },
    ) {
        return app.request("/dashboard/logout", {
            method: "POST",
            headers: {
                ...HTTPS,
                ...headers,
                cookie: jar.header(),
                "content-type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(body).toString(),
        });
    }

    test("signs out: deletes the row, clears the cookie, 303 to the landing page", async () => {
        const { app, jar, raw, sessions } = await signedIn();
        const res = await logout(app, jar, {
            csrf: dashboardCsrf(raw),
            locale: "fr",
        });
        expect(res.status).toBe(303);
        expect(res.headers.get("location")).toBe("/fr");
        expect(sessions.rows.size).toBe(0);
        const line = setCookieLine(res, /^__Host-nm_dash$/)!;
        expect(line).toContain("Max-Age=0");
        jar.take(res);
        const after = await app.request("/api/dashboard/session", {
            headers: { ...HTTPS, cookie: `__Host-nm_dash=${raw}` },
        });
        expect(after.status).toBe(401);
    });

    test("English lands on /", async () => {
        const { app, jar, raw } = await signedIn();
        const res = await logout(app, jar, { csrf: dashboardCsrf(raw) });
        expect(res.headers.get("location")).toBe("/");
    });

    test("accepts a JSON body too", async () => {
        const { app, jar, raw, sessions } = await signedIn();
        const res = await app.request("/dashboard/logout", {
            method: "POST",
            headers: {
                ...HTTPS,
                origin: HTTPS_BASE,
                cookie: jar.header(),
                "content-type": "application/json",
            },
            body: JSON.stringify({ csrf: dashboardCsrf(raw) }),
        });
        expect(res.status).toBe(303);
        expect(sessions.rows.size).toBe(0);
    });

    for (const [name, headers] of [
        ["no Origin", {}],
        ["a cross-site Origin", { origin: "https://evil.test" }],
        ["an http Origin on an https site", { origin: "http://nm.test" }],
        ["Origin null", { origin: "null" }],
        [
            "Origin null from a cross-site page",
            { origin: "null", "sec-fetch-site": "cross-site" },
        ],
        [
            "a same-origin Sec-Fetch-Site beside a foreign Origin",
            { origin: "https://evil.test", "sec-fetch-site": "same-origin" },
        ],
    ] as const) {
        test(`refuses ${name}, even with the right csrf`, async () => {
            const { app, jar, raw, sessions } = await signedIn();
            const res = await logout(
                app,
                jar,
                { csrf: dashboardCsrf(raw) },
                headers,
            );
            expect(res.status).toBe(403);
            expect(sessions.rows.size).toBe(1);
            expect(setCookieLine(res, /^__Host-nm_dash$/)).toBeUndefined();
        });
    }

    for (const [name, body] of [
        ["no csrf", {}],
        ["a wrong csrf", { csrf: hashSecret("dashboard-csrf:other") }],
        ["the raw cookie as csrf", { csrf: "RAW" }],
        ["the cookie's hash as csrf", { csrf: "HASH" }],
    ] as const) {
        test(`refuses ${name}`, async () => {
            const { app, jar, raw, sessions } = await signedIn();
            const csrf =
                "csrf" in body
                    ? body.csrf === "RAW"
                        ? raw
                        : body.csrf === "HASH"
                          ? hashSecret(raw)
                          : body.csrf
                    : undefined;
            const res = await logout(
                app,
                jar,
                csrf === undefined ? {} : { csrf },
            );
            expect(res.status).toBe(403);
            expect(sessions.rows.size).toBe(1);
        });
    }

    test("a stale tab's form post gets the retry page with a fresh csrf, which signs out", async () => {
        const { app, jar, raw, sessions } = await signedIn();
        const staleCsrf = dashboardCsrf(raw);
        // Signed out and back in from another tab: a new cookie.
        jar.take(await logout(app, jar, { csrf: staleCsrf }));
        await signIn(app, jar);
        const fresh = jar.cookies.get("__Host-nm_dash")!;
        expect(fresh).not.toBe(raw);
        const res = await logout(app, jar, { csrf: staleCsrf, locale: "fr" });
        expect(res.status).toBe(403);
        expect(res.headers.get("content-type")).toContain("text/html");
        expect(res.headers.get("referrer-policy")).toBe("same-origin");
        expect(res.headers.get("retry-after")).toBeNull();
        expect(setCookieLine(res, /^__Host-nm_dash$/)).toBeUndefined();
        expect(sessions.rows.size).toBe(1);
        const html = await res.text();
        expect(html).toContain('lang="fr"');
        expect(html).toContain(DASHBOARD.fr.signOutFailed.slice(0, 20));
        const posted = /name="csrf" value="([^"]+)"/.exec(html)![1]!;
        expect(posted).toBe(dashboardCsrf(fresh));
        expect(posted).not.toBe(staleCsrf);
        // One click on the page's button.
        const again = await logout(app, jar, { csrf: posted, locale: "fr" });
        expect(again.status).toBe(303);
        expect(again.headers.get("location")).toBe("/fr");
        expect(sessions.rows.size).toBe(0);
    });

    test("a missing csrf on a form post gets the page too; a JSON caller keeps JSON", async () => {
        const { app, jar, raw } = await signedIn();
        const page = await logout(app, jar, {});
        expect(page.status).toBe(403);
        expect(await page.text()).toContain(`value="${dashboardCsrf(raw)}"`);
        const json = await app.request("/dashboard/logout", {
            method: "POST",
            headers: {
                ...HTTPS,
                origin: HTTPS_BASE,
                cookie: jar.header(),
                "content-type": "application/json",
                accept: "text/html",
            },
            body: JSON.stringify({ csrf: "wrong" }),
        });
        expect(json.status).toBe(403);
        expect(await json.json()).toMatchObject({ error: "forbidden" });
    });

    test("a stale form post whose session is already gone just lands signed out", async () => {
        const { app, jar, sessions } = await signedIn();
        sessions.rows.clear();
        const res = await logout(app, jar, { csrf: "stale" });
        expect(res.status).toBe(303);
        expect(setCookieLine(res, /^__Host-nm_dash$/)).toContain("Max-Age=0");
    });

    test("a cross-origin form post never gets a page carrying a csrf", async () => {
        const { app, jar, raw, sessions } = await signedIn();
        const variants: Record<string, string>[] = [
            { origin: "https://evil.test", accept: "text/html" },
            {
                origin: "null",
                "sec-fetch-site": "cross-site",
                accept: "text/html",
            },
            { accept: "text/html" },
        ];
        for (const headers of variants) {
            const res = await logout(app, jar, { csrf: "stale" }, headers);
            expect(res.status).toBe(403);
            expect(res.headers.get("content-type")).toContain(
                "application/json",
            );
            const body = await res.text();
            expect(body).not.toContain(dashboardCsrf(raw));
            expect(body).not.toContain("csrf");
        }
        expect(sessions.rows.size).toBe(1);
    });

    test("a browser's Origin null form post is accepted when Sec-Fetch-Site is same-origin", async () => {
        // What a real browser sends for the Sign out form on a page whose
        // Referrer-Policy is no-referrer (Fetch spec: the serialized origin
        // becomes null for a non-CORS non-GET request).
        const { app, jar, raw, sessions } = await signedIn();
        const res = await logout(
            app,
            jar,
            { csrf: dashboardCsrf(raw) },
            { origin: "null", "sec-fetch-site": "same-origin" },
        );
        expect(res.status).toBe(303);
        expect(sessions.rows.size).toBe(0);
    });

    test("a failed delete is not reported as a sign-out", async () => {
        const { app, jar, raw, sessions } = await signedIn();
        sessions.setDeleteDown(true);
        const res = await logout(app, jar, {
            csrf: dashboardCsrf(raw),
            locale: "de",
        });
        expect(res.status).toBe(503);
        expect(res.headers.get("referrer-policy")).toBe("same-origin");
        expect(res.headers.get("content-security-policy")).toContain(
            "form-action 'self'",
        );
        // The cookie stays, so the retry can find the row.
        expect(setCookieLine(res, /^__Host-nm_dash$/)).toBeUndefined();
        expect(sessions.rows.size).toBe(1);
        const html = await res.text();
        expect(html).toContain('lang="de"');
        expect(html).toContain('action="/dashboard/logout"');
        expect(html).toContain(`value="${dashboardCsrf(raw)}"`);
        // The retry works once the store is back.
        sessions.setDeleteDown(false);
        const retry = await logout(app, jar, {
            csrf: dashboardCsrf(raw),
            locale: "de",
        });
        expect(retry.status).toBe(303);
        expect(sessions.rows.size).toBe(0);
    });

    test("without a session cookie there is nothing to end", async () => {
        const { app } = build();
        const res = await logout(app, new Jar(), { csrf: "x" });
        expect(res.status).toBe(303);
    });
});

// ---------- /mcp ----------

describe("nmds_ at /mcp", () => {
    test("is refused by authenticateBearer before any lookup", async () => {
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
                    Authorization: `Bearer ${DASHBOARD_SESSION_PREFIX}${newOpaqueToken()}`,
                    "x-forwarded-for": "203.0.113.51",
                },
            });
            expect(r.status).toBe(401);
            expect(((await r.json()) as { error: string }).error).toBe(
                "invalid_token",
            );
            expect(fetches).toBe(0);
        } finally {
            globalThis.fetch = realFetch;
        }
    });
});

// ---------- sweep ----------

describe("sweepDashboardSessions", () => {
    test("deletes expired rows as of now and reports the count", async () => {
        const seen: string[] = [];
        const n = await sweepDashboardSessions(
            {
                async deleteExpired(nowIso) {
                    seen.push(nowIso);
                    return 3;
                },
            },
            T0,
        );
        expect(n).toBe(3);
        expect(seen).toEqual([new Date(T0).toISOString()]);
    });

    test("a failure is logged, not thrown", async () => {
        const n = await sweepDashboardSessions(
            {
                async deleteExpired() {
                    throw new Error("down");
                },
            },
            T0,
        );
        expect(n).toBe(0);
    });
});

// ---------- the real Supabase store ----------

// The fake above re-implements the hash-at-rest contract, so it proves
// nothing about src/supabase.ts. These call the real functions with global
// fetch stubbed (supabase-js resolves it per call; no mock.module) and check
// what would reach PostgREST.
describe("supabaseDashboardSessionStore", () => {
    test("writes, looks up and deletes by hashSecret(raw) only", async () => {
        const { supabaseDashboardSessionStore: real } =
            await import("./dashboard-session-store.js");
        const envBefore = {
            url: process.env.SUPABASE_URL,
            key: process.env.SUPABASE_SECRET_KEY,
        };
        process.env.SUPABASE_URL ??= "http://supabase.test";
        process.env.SUPABASE_SECRET_KEY ??= "test-key";
        const seen: { method: string; url: URL; body: string }[] = [];
        const realFetch = globalThis.fetch;
        globalThis.fetch = (async (
            input: string | URL | Request,
            init?: RequestInit,
        ) => {
            const req =
                input instanceof Request
                    ? new Request(input, init)
                    : new Request(input.toString(), init);
            const body = await req.text();
            seen.push({ method: req.method, url: new URL(req.url), body });
            return new Response(req.method === "GET" ? "[]" : null, {
                status: req.method === "POST" ? 201 : 200,
                headers: { "content-type": "application/json" },
            });
        }) as unknown as typeof fetch;
        try {
            const raw = `${DASHBOARD_SESSION_PREFIX}${newOpaqueToken()}`;
            await real.create({
                token: raw,
                userId: "11111111-1111-4111-8111-111111111111",
                createdAt: new Date(T0).toISOString(),
                expiresAt: new Date(
                    T0 + DASHBOARD_SESSION_IDLE_MS,
                ).toISOString(),
                absoluteExpiresAt: new Date(
                    T0 + DASHBOARD_SESSION_ABSOLUTE_MS,
                ).toISOString(),
            });
            const insert = seen.at(-1)!;
            expect(insert.method).toBe("POST");
            expect(insert.url.pathname).toBe("/rest/v1/dashboard_sessions");
            expect(JSON.parse(insert.body).token_hash).toBe(hashSecret(raw));
            expect(insert.body).not.toContain(raw);

            expect(await real.lookup(raw, new Date(T0).toISOString())).toEqual({
                status: "invalid",
            });
            const lookup = seen.at(-1)!;
            expect(lookup.url.searchParams.get("token_hash")).toBe(
                `eq.${hashSecret(raw)}`,
            );
            expect(lookup.url.searchParams.get("expires_at")).toMatch(/^gt\./);
            expect(lookup.url.searchParams.get("absolute_expires_at")).toMatch(
                /^gt\./,
            );
            expect(lookup.url.toString()).not.toContain(raw);

            await real.delete(raw);
            const del = seen.at(-1)!;
            expect(del.method).toBe("DELETE");
            expect(del.url.searchParams.get("token_hash")).toBe(
                `eq.${hashSecret(raw)}`,
            );
        } finally {
            globalThis.fetch = realFetch;
            if (envBefore.url === undefined) delete process.env.SUPABASE_URL;
            if (envBefore.key === undefined)
                delete process.env.SUPABASE_SECRET_KEY;
        }
    });
});
