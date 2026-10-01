import { test, expect, describe, spyOn } from "bun:test";
import crypto from "node:crypto";
import { Hono } from "hono";
import {
    ACCESS_TOKEN_TTL_SECONDS,
    OAUTH_PATHS,
    REFRESH_TOKEN_TTL_SECONDS,
    createOAuthRouter,
    renderLoginPage,
    type OAuthRouterDeps,
    type OAuthSession,
} from "./oauth.js";
import type {
    AuthCodeData,
    NewOAuthClient,
    OAuthAuth,
    OAuthStore,
} from "./oauth-store.js";
import { pkceS256 } from "./oauth-validate.js";
import { hashSecret } from "./token-hash.js";
import { authorizationServerMetadata } from "./discovery.js";
import { _resetBuckets } from "./rate-limit.js";
import { SITE_LOCALES } from "./routes.js";
import { SignInError, SignUpError } from "./auth-errors.js";
import { LOGIN_ERRORS } from "./copy/login.js";

// No env client is set up here: createOAuthRouter() no longer requires one,
// and every test below registers its own client through POST /register. The
// legacy-client block sets and restores OAUTH_CLIENT_ID/SECRET around its own
// createOAuthRouter() call. Bun auto-loads the project's env file, so a
// developer machine may still have a legacy client configured — nothing here
// depends on it either way.

// Guards the nonce representation: Supabase expects the SHA-256 *hex* digest sent
// to Google (not base64url). A regression to base64URLEncode would break sign-in.
test("nonce is hashed as lowercase hex SHA-256", () => {
    const hashed = crypto.createHash("sha256").update("abc").digest("hex");
    expect(hashed).toBe(
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(hashed).toHaveLength(64);
    expect(hashed).toMatch(/^[0-9a-f]{64}$/);
});

// ---------- Fakes (D11: injected, never mock.module) ----------

// In-memory OAuthStore. Plain Maps, not a mock: the router's behaviour against
// it is what is under test, and dump() lets a test inspect what was stored —
// e.g. that only a secret's hash ever reaches storage.
//
// It keeps the same at-rest contract as the Supabase store (see OAuthStore):
// codes, access tokens and refresh tokens are keyed by hashSecret(raw), and a
// consume matches that hash exactly — so a row a test seeds under a raw value
// is never found.
//
// That contract is re-implemented here, so the hashing tests in this file
// prove the router hands the store raw values and returns the raw one to the
// client — not that src/supabase.ts hashes. The real store functions are
// pinned by src/oauth-supabase-store.test.ts.
function fakeStore(opts: { legacyRedirects?: string[] } = {}) {
    const state = {
        clients: new Map<string, NewOAuthClient>(),
        codes: new Map<string, AuthCodeData>(),
        tokens: new Map<string, { userId: string; ttlSeconds: number }>(),
        refresh: new Map<
            string,
            { userId: string; clientId: string | null; ttlSeconds?: number }
        >(),
        // Client ids touchClient was called with, in order.
        touched: [] as string[],
    };
    const legacyRedirects = new Set(opts.legacyRedirects ?? []);
    const store: OAuthStore & { dump(): typeof state } = {
        async createClient(c) {
            state.clients.set(c.clientId, c);
        },
        async getClient(clientId) {
            const c = state.clients.get(clientId);
            if (!c) return null;
            return {
                clientId: c.clientId,
                secretHash: c.secretHash,
                authMethod: c.authMethod,
                redirectUris: c.redirectUris,
                legacy: false,
            };
        },
        async touchClient(clientId) {
            state.touched.push(clientId);
        },
        async isLegacyRedirect(uri) {
            return legacyRedirects.has(uri);
        },
        async storeAuthCode(rec) {
            state.codes.set(hashSecret(rec.code), {
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
            const rec = state.codes.get(key);
            if (!rec) return null;
            state.codes.delete(key);
            return rec;
        },
        async storeToken(token, userId, ttlSeconds) {
            state.tokens.set(hashSecret(token), { userId, ttlSeconds });
        },
        async storeRefreshToken(token, userId, clientId, ttlSeconds) {
            state.refresh.set(hashSecret(token), {
                userId,
                clientId,
                ttlSeconds,
            });
        },
        async consumeRefreshToken(token) {
            const key = hashSecret(token);
            const rec = state.refresh.get(key);
            if (!rec) return null;
            state.refresh.delete(key);
            return { userId: rec.userId, clientId: rec.clientId };
        },
        dump: () => state,
    };
    return store;
}

type FakeStore = ReturnType<typeof fakeStore>;

const fakeAuth: OAuthAuth = {
    signIn: async () => "user-1",
    signUp: async () => "user-1",
    signInWithGoogleIdToken: async () => "user-1",
};

// Mirrors how src/index.ts wires things up: the OAuth router is mounted at the
// root (the OAuth paths are spec-fixed there) with /mcp as a sibling route.
function buildTestApp(
    deps: Omit<OAuthRouterDeps, "store"> & { store?: FakeStore } = {},
) {
    let mcpHits = 0;
    const store = deps.store ?? fakeStore();
    const app = new Hono();
    app.route("/", createOAuthRouter({ auth: fakeAuth, ...deps, store }));
    app.all("/mcp", (c) => {
        mcpHits++;
        return c.text("ok");
    });
    // These tests send deliberately malformed bodies so handlers bail out
    // early; swallow any resulting throws instead of logging 30 of them per
    // path. Status codes are what the assertions look at.
    app.onError((_err, c) => c.text("handler error", 500));
    return { app, store, mcpHits: () => mcpHits };
}

function fire(
    app: Hono,
    method: string,
    path: string,
    ip: string,
    init: { body?: string; headers?: Record<string, string> } = {},
) {
    return app.request(`http://localhost${path}`, {
        method,
        headers: { "x-forwarded-for": ip, ...init.headers },
        body: init.body,
    });
}

function postJson(app: Hono, path: string, ip: string, body: unknown) {
    return fire(app, "POST", path, ip, {
        body: typeof body === "string" ? body : JSON.stringify(body),
        headers: { "content-type": "application/json" },
    });
}

function postForm(
    app: Hono,
    path: string,
    ip: string,
    fields: Record<string, string>,
    headers: Record<string, string> = {},
) {
    return fire(app, "POST", path, ip, {
        body: new URLSearchParams(fields).toString(),
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            ...headers,
        },
    });
}

// The browser-binding cookie /authorize sets, as a request `cookie` header
// ("name=value") — what the same browser sends back on its next request.
function bindingCookie(res: Response): string {
    const set = res.headers.get("Set-Cookie");
    expect(set).toBeTruthy();
    return set!.split(";")[0]!;
}

const CLAUDE_CALLBACK = "https://claude.ai/api/mcp/auth_callback";
// RFC 7636 Appendix B's verifier. The brief's copy of it is mistyped; this is
// the value that actually hashes to E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM.
const VERIFIER = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const CHALLENGE = pkceS256(VERIFIER);

interface Registration {
    client_id: string;
    client_secret?: string;
    client_secret_expires_at?: number;
    token_endpoint_auth_method: string;
    redirect_uris: string[];
    client_name?: string;
}

async function registerClient(
    app: Hono,
    ip: string,
    meta: Record<string, unknown> = {},
): Promise<Registration> {
    const res = await postJson(app, "/register", ip, {
        redirect_uris: [CLAUDE_CALLBACK],
        ...meta,
    });
    expect(res.status).toBe(201);
    return (await res.json()) as Registration;
}

// A complete, valid /authorize query. Override any field, or pass undefined
// to drop it.
function authorizePath(
    params: Record<string, string | undefined> & { client_id: string },
) {
    const all: Record<string, string | undefined> = {
        response_type: "code",
        redirect_uri: CLAUDE_CALLBACK,
        state: "xyz",
        code_challenge: CHALLENGE,
        code_challenge_method: "S256",
        ...params,
    };
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(all)) if (v !== undefined) q.set(k, v);
    return `/authorize?${q.toString()}`;
}

// The authorization code an /approve redirect carries — the only place the
// raw code exists; the store holds just its hash.
function codeFrom(approve: Response): string {
    expect(approve.status).toBe(302);
    return new URL(approve.headers.get("Location")!).searchParams.get("code")!;
}

function sessionIdFrom(html: string): string | undefined {
    return html.match(/name="session_id"\s+value="([0-9a-f-]+)"/)?.[1];
}

function clientNotice(html: string): string | undefined {
    return html.match(/<p class="client-notice"[^>]*>[\s\S]*?<\/p>/)?.[0];
}

// ---------- renderLoginPage ----------

// Minimal fake session — every renderLoginPage call needs one now that the
// language switcher's links and the client notice are built from its fields.
function fakeSession(
    locale: "en" | "de" = "en",
    overrides: Partial<OAuthSession> = {},
): OAuthSession {
    return {
        state: "state-xyz",
        redirectUri: CLAUDE_CALLBACK,
        codeChallenge: CHALLENGE,
        codeChallengeMethod: "S256",
        redirectHost: "claude.ai",
        redirectKind: "https",
        clientId: "test-client-id",
        locale,
        browserBinding: "0".repeat(64),
        ...overrides,
    };
}

test("renderLoginPage substitutes every {{SESSION_ID}} occurrence", async () => {
    const sessionId = "session-abc-123";
    const html = await renderLoginPage(sessionId, fakeSession());

    // The password form and the Google form each carry the id in a hidden
    // field, so a single .replace() (first-match only) would leave one
    // behind and break whichever form comes second.
    expect(html).not.toContain("{{SESSION_ID}}");
    expect(html.split(`value="${sessionId}"`)).toHaveLength(3);
});

test("renderLoginPage renders the error banner only when given an error", async () => {
    const clean = await renderLoginPage("s1", fakeSession());
    expect(clean).not.toContain("{{ERROR}}");
    expect(clean).not.toContain('class="error-banner"');

    const withError = await renderLoginPage(
        "s1",
        fakeSession(),
        "Bad <stuff> & things",
    );
    expect(withError).toContain('class="error-banner"');
    // Error text is HTML-escaped.
    expect(withError).toContain("Bad &lt;stuff&gt; &amp; things");
});

test("renderLoginPage substitutes {{LANG_SWITCHER}} and reflects the session's locale", async () => {
    const html = await renderLoginPage("s1", fakeSession());
    expect(html).not.toContain("{{LANG_SWITCHER}}");
    expect(html).not.toContain("{{LANG_SWITCHER_MENU}}");
    expect(html).toContain('class="lang-switch"');
    // The sheet menu's grid is the only switcher below 700px.
    expect(html).toContain('class="menu-langs"');

    // The switcher's links carry the session's own OAuth params (state,
    // client_id, redirect_uri) so switching language re-enters the same
    // flow rather than losing it.
    expect(html).toContain("state=state-xyz");
    expect(html).toContain("client_id=test-client-id");
    // Every parameter /authorize now requires rides along too — a switcher
    // link that dropped the PKCE method or the resource would turn a
    // language change into an error redirect.
    expect(html).toContain(`code_challenge=${CHALLENGE}`);
    expect(html).toContain("code_challenge_method=S256");
    expect(html).not.toContain("resource=");

    const withResource = await renderLoginPage(
        "s1",
        fakeSession("en", { resource: "https://nutrition-mcp.com/mcp" }),
    );
    expect(withResource).toContain(
        `resource=${encodeURIComponent("https://nutrition-mcp.com/mcp")}`,
    );
});

test("renderLoginPage substitutes {{TRANSLATION_NOTICE}}: present in translated locales, empty on English", async () => {
    const en = await renderLoginPage("s1", fakeSession("en"));
    expect(en).not.toContain("{{TRANSLATION_NOTICE}}");
    // Nothing to disclose on the original-language page.
    expect(en).not.toContain('class="translation-notice"');

    const de = await renderLoginPage("s1", fakeSession("de"));
    expect(de).not.toContain("{{TRANSLATION_NOTICE}}");
    expect(de).toContain('class="translation-notice"');
    // Links back to the SAME in-flight flow in English (authorizeUrl), not
    // a fixed site URL — losing session/state here would strand a user who
    // just wants to read the original mid sign-in.
    expect(de).toContain('href="/authorize?response_type=code');
    expect(de).toContain("state=state-xyz");
    expect(de).not.toContain('href="/"');
});

test("renderLoginPage serves the requested locale's template when it exists", async () => {
    const en = await renderLoginPage("s1", fakeSession("en"));
    expect(en).toContain('<html lang="en">');

    const de = await renderLoginPage("s1", fakeSession("de"));
    expect(de).toContain('<html lang="de">');
});

test("renderLoginPage substitutes {{CLIENT_NOTICE}} and escapes the host", async () => {
    const html = await renderLoginPage(
        "s1",
        fakeSession("en", { redirectHost: "a<b>.example" }),
    );
    expect(html).not.toContain("{{CLIENT_NOTICE}}");
    const notice = clientNotice(html)!;
    expect(notice).toContain("a&lt;b&gt;.example");
    expect(notice).not.toContain("a<b>");
});

// String.replaceAll expands "$'", "$&" and "$`" in a string replacement; the
// notice and the error carry caller-controlled text, so a "$'" in either used
// to splice the rest of the template (a second sign-in form) into the page.
test("renderLoginPage never expands $ patterns in substituted text", async () => {
    const plain = await renderLoginPage("s1", fakeSession("en"));
    const forms = (h: string) => (h.match(/<form\b/g) ?? []).length;
    for (const pattern of ["$'", "$&", "$`", "$$"]) {
        const html = await renderLoginPage(
            "s1",
            fakeSession("en", { redirectHost: `x${pattern}y.example` }),
            `bad ${pattern} error`,
        );
        expect(forms(html)).toBe(forms(plain));
        expect(html).not.toContain("{{");
        expect(clientNotice(html)).toContain(
            `<strong>x${pattern.replace("&", "&amp;")}y.example</strong>`,
        );
        expect(html).toContain(`bad ${pattern.replace("&", "&amp;")} error`);
    }
});

// A Google-callback failure re-renders the login page in the session's own
// locale, with a translated error message (LOGIN_ERRORS in
// src/copy/login.ts) — not just a translated page around an English error.
// Driven through the real router (not a direct renderLoginPage call) so it
// also exercises /authorize's locale selection and the session lookup, the
// two things that have to work together for this to be true end to end.
test("a Google sign-in failure re-renders the error in the session's locale", async () => {
    _resetBuckets();
    const { app } = buildTestApp();
    const ip = "198.51.100.1";
    const client = await registerClient(app, ip, {
        token_endpoint_auth_method: "none",
    });

    const authorizeRes = await fire(
        app,
        "GET",
        authorizePath({ client_id: client.client_id, locale: "de" }),
        ip,
    );
    expect(authorizeRes.status).toBe(200);
    const cookie = bindingCookie(authorizeRes);
    const sessionId = sessionIdFrom(await authorizeRes.text());
    expect(sessionId).toBeTruthy();

    // No `code` param — the callback's own "didn't originate from a flow we
    // started" guard fires without needing to mock Google's token endpoint.
    // Sent from the browser that opened /authorize, or the binding check
    // would answer first.
    const callbackRes = await fire(
        app,
        "GET",
        `/auth/google/callback?state=${sessionId}`,
        ip,
        { headers: { cookie } },
    );
    expect(callbackRes.status).toBe(400);
    const errorHtml = await callbackRes.text();
    expect(errorHtml).toContain("error-banner");
    expect(errorHtml).toContain(
        "Die Anmeldung mit Google ist fehlgeschlagen. Bitte versuche es erneut.",
    );
    expect(errorHtml).not.toContain("Google sign-in failed");
});

// ---------- POST /register ----------

describe("POST /register", () => {
    test("returns 201 with a fresh per-client id, never the env id", async () => {
        _resetBuckets();
        const { app } = buildTestApp();
        const a = await registerClient(app, "198.51.100.10");
        const b = await registerClient(app, "198.51.100.10");
        expect(a.client_id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );
        expect(a.client_id).not.toBe(b.client_id);
        expect(a.client_id).not.toBe(process.env.OAUTH_CLIENT_ID);
        expect(a.client_secret).not.toBe(process.env.OAUTH_CLIENT_SECRET);
        expect(a.redirect_uris).toEqual([CLAUDE_CALLBACK]);
    });

    test("a public ('none') client gets no secret fields", async () => {
        _resetBuckets();
        const { app, store } = buildTestApp();
        const reg = await registerClient(app, "198.51.100.11", {
            token_endpoint_auth_method: "none",
        });
        expect(reg.token_endpoint_auth_method).toBe("none");
        expect("client_secret" in reg).toBe(false);
        expect("client_secret_expires_at" in reg).toBe(false);
        expect(store.dump().clients.get(reg.client_id)!.secretHash).toBeNull();
    });

    test("an omitted auth method defaults to client_secret_basic with a secret", async () => {
        _resetBuckets();
        const { app } = buildTestApp();
        const reg = await registerClient(app, "198.51.100.12");
        expect(reg.token_endpoint_auth_method).toBe("client_secret_basic");
        expect(reg.client_secret).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(reg.client_secret_expires_at).toBe(0);
    });

    test("the store holds only the secret's hash", async () => {
        _resetBuckets();
        const { app, store } = buildTestApp();
        const reg = await registerClient(app, "198.51.100.13", {
            token_endpoint_auth_method: "client_secret_post",
        });
        const stored = store.dump().clients.get(reg.client_id)!;
        expect(stored.secretHash).toBe(
            crypto
                .createHash("sha256")
                .update(reg.client_secret!)
                .digest("hex"),
        );
        expect(JSON.stringify(stored)).not.toContain(reg.client_secret!);
    });

    test("client_name is stored truncated to 255 characters", async () => {
        _resetBuckets();
        const { app, store } = buildTestApp();
        const reg = await registerClient(app, "198.51.100.14", {
            client_name: "x".repeat(300),
        });
        expect(reg.client_name).toHaveLength(255);
        expect(
            store.dump().clients.get(reg.client_id)!.clientName,
        ).toHaveLength(255);
    });

    for (const [label, redirect_uris] of [
        ["empty", []],
        ["missing", undefined],
        ["javascript:", ["javascript:alert(1)"]],
        ["non-loopback http", ["http://evil.example/cb"]],
        [
            "more than 10",
            Array.from({ length: 11 }, (_, i) => `https://a.example/${i}`),
        ],
    ] as const) {
        test(`rejects ${label} redirect_uris with 400 invalid_redirect_uri`, async () => {
            _resetBuckets();
            const { app, store } = buildTestApp();
            const res = await postJson(app, "/register", "198.51.100.15", {
                redirect_uris,
            });
            expect(res.status).toBe(400);
            expect(((await res.json()) as { error: string }).error).toBe(
                "invalid_redirect_uri",
            );
            expect(store.dump().clients.size).toBe(0);
        });
    }

    test("a non-JSON body is a 400, not a 500", async () => {
        _resetBuckets();
        const { app } = buildTestApp();
        const res = await postJson(
            app,
            "/register",
            "198.51.100.16",
            "{not json",
        );
        expect(res.status).toBe(400);
        expect(((await res.json()) as { error: string }).error).toBe(
            "invalid_client_metadata",
        );
    });

    test("bad grant_types, response_types or auth method are invalid_client_metadata", async () => {
        _resetBuckets();
        const { app } = buildTestApp();
        for (const meta of [
            { grant_types: ["implicit"] },
            { response_types: ["token"] },
            { token_endpoint_auth_method: "private_key_jwt" },
        ]) {
            const res = await postJson(app, "/register", "198.51.100.17", {
                redirect_uris: [CLAUDE_CALLBACK],
                ...meta,
            });
            expect(res.status).toBe(400);
            expect(((await res.json()) as { error: string }).error).toBe(
                "invalid_client_metadata",
            );
        }
    });
});

// ---------- GET /authorize ----------

describe("GET /authorize", () => {
    async function setup(ip: string, meta: Record<string, unknown> = {}) {
        _resetBuckets();
        const built = buildTestApp();
        const client = await registerClient(built.app, ip, {
            token_endpoint_auth_method: "none",
            ...meta,
        });
        return { ...built, client };
    }

    test("the registered URI renders the login page with the host notice", async () => {
        const ip = "198.51.100.20";
        const { app, client } = await setup(ip);
        const res = await fire(
            app,
            "GET",
            authorizePath({ client_id: client.client_id }),
            ip,
        );
        expect(res.status).toBe(200);
        const notice = clientNotice(await res.text());
        expect(notice).toContain("<strong>claude.ai</strong>");
    });

    test("an unregistered URI is a JSON 400 with no Location header", async () => {
        const ip = "198.51.100.21";
        const { app, client } = await setup(ip);
        const res = await fire(
            app,
            "GET",
            authorizePath({
                client_id: client.client_id,
                redirect_uri: "https://evil.example/cb",
            }),
            ip,
        );
        expect(res.status).toBe(400);
        expect(res.headers.get("Location")).toBeNull();
        const body = (await res.json()) as {
            error: string;
            error_description: string;
        };
        expect(body.error).toBe("invalid_request");
        expect(body.error_description).toBe(
            "redirect_uri is not registered for this client",
        );
    });

    test("another client's registered URI is rejected", async () => {
        const ip = "198.51.100.22";
        const { app, client } = await setup(ip);
        const other = await registerClient(app, ip, {
            redirect_uris: ["https://other.example/cb"],
        });
        expect(other.client_id).not.toBe(client.client_id);
        const res = await fire(
            app,
            "GET",
            authorizePath({
                client_id: client.client_id,
                redirect_uri: "https://other.example/cb",
            }),
            ip,
        );
        expect(res.status).toBe(400);
        expect(res.headers.get("Location")).toBeNull();
    });

    test("an unknown client is a JSON 400 invalid_client", async () => {
        const ip = "198.51.100.23";
        const { app } = await setup(ip);
        const res = await fire(
            app,
            "GET",
            authorizePath({ client_id: crypto.randomUUID() }),
            ip,
        );
        expect(res.status).toBe(400);
        expect(res.headers.get("Location")).toBeNull();
        expect(((await res.json()) as { error: string }).error).toBe(
            "invalid_client",
        );
    });

    async function expectErrorRedirect(
        res: Response,
        error: string,
        state?: string,
    ) {
        expect(res.status).toBe(302);
        const location = new URL(res.headers.get("Location")!);
        expect(`${location.origin}${location.pathname}`).toBe(CLAUDE_CALLBACK);
        expect(location.searchParams.get("error")).toBe(error);
        expect(location.searchParams.get("error_description")).toBeTruthy();
        expect(location.searchParams.get("state")).toBe(state ?? null);
        // RFC 9207: error responses carry iss too.
        expect(location.searchParams.get("iss")).toBe(
            authorizationServerMetadata("http://localhost").issuer,
        );
    }

    test("a missing code_challenge redirects with invalid_request and state", async () => {
        const ip = "198.51.100.24";
        const { app, client } = await setup(ip);
        const res = await fire(
            app,
            "GET",
            authorizePath({
                client_id: client.client_id,
                code_challenge: undefined,
            }),
            ip,
        );
        await expectErrorRedirect(res, "invalid_request", "xyz");
    });

    test("a malformed code_challenge redirects with invalid_request", async () => {
        const ip = "198.51.100.25";
        const { app, client } = await setup(ip);
        const res = await fire(
            app,
            "GET",
            authorizePath({
                client_id: client.client_id,
                code_challenge: "short",
            }),
            ip,
        );
        await expectErrorRedirect(res, "invalid_request", "xyz");
    });

    test("code_challenge_method=plain redirects with invalid_request", async () => {
        const ip = "198.51.100.26";
        const { app, client } = await setup(ip);
        const res = await fire(
            app,
            "GET",
            authorizePath({
                client_id: client.client_id,
                code_challenge_method: "plain",
            }),
            ip,
        );
        await expectErrorRedirect(res, "invalid_request", "xyz");
    });

    test("an absent code_challenge_method is accepted as S256", async () => {
        const ip = "198.51.100.27";
        const { app, client } = await setup(ip);
        const res = await fire(
            app,
            "GET",
            authorizePath({
                client_id: client.client_id,
                code_challenge_method: undefined,
            }),
            ip,
        );
        expect(res.status).toBe(200);
        // Normalized in the session, so the switcher re-enters with it set.
        expect(await res.text()).toContain("code_challenge_method=S256");
    });

    test("a wrong response_type redirects with unsupported_response_type", async () => {
        const ip = "198.51.100.28";
        const { app, client } = await setup(ip);
        const res = await fire(
            app,
            "GET",
            authorizePath({
                client_id: client.client_id,
                response_type: "token",
            }),
            ip,
        );
        await expectErrorRedirect(res, "unsupported_response_type", "xyz");
    });

    test("a missing state redirects with invalid_request", async () => {
        const ip = "198.51.100.29";
        const { app, client } = await setup(ip);
        const res = await fire(
            app,
            "GET",
            authorizePath({ client_id: client.client_id, state: undefined }),
            ip,
        );
        await expectErrorRedirect(res, "invalid_request");
    });

    test("a foreign resource redirects with invalid_target; this server's is accepted", async () => {
        const ip = "198.51.100.30";
        const { app, client } = await setup(ip);
        const bad = await fire(
            app,
            "GET",
            authorizePath({
                client_id: client.client_id,
                resource: "https://evil.example/mcp",
            }),
            ip,
        );
        await expectErrorRedirect(bad, "invalid_target", "xyz");

        const good = await fire(
            app,
            "GET",
            authorizePath({
                client_id: client.client_id,
                resource: "http://localhost/mcp",
            }),
            ip,
        );
        expect(good.status).toBe(200);
        // Carried by the switcher links so a language change keeps it.
        expect(await good.text()).toContain(
            `resource=${encodeURIComponent("http://localhost/mcp")}`,
        );
    });

    test("a loopback URI registered without a port matches one presented with a port", async () => {
        const ip = "198.51.100.31";
        const { app, client } = await setup(ip, {
            redirect_uris: ["http://127.0.0.1/callback"],
        });
        const ok = await fire(
            app,
            "GET",
            authorizePath({
                client_id: client.client_id,
                redirect_uri: "http://127.0.0.1:51789/callback",
            }),
            ip,
        );
        expect(ok.status).toBe(200);

        // localhost is not interchangeable with 127.0.0.1.
        const other = await fire(
            app,
            "GET",
            authorizePath({
                client_id: client.client_id,
                redirect_uri: "http://localhost:51789/callback",
            }),
            ip,
        );
        expect(other.status).toBe(400);
    });
});

// ---------- Legacy env client ----------

describe("legacy env client", () => {
    const LEGACY_ID = "legacy-test-client";
    const LEGACY_SECRET = "legacy-test-secret";
    const SNAPSHOT_URI = "https://legacy.example/oauth/cb";

    // createOAuthRouter() reads the env client at construction, so the env
    // only has to be set around building the app, then restored at once.
    function buildLegacyApp(secret = LEGACY_SECRET) {
        const saved = {
            id: process.env.OAUTH_CLIENT_ID,
            secret: process.env.OAUTH_CLIENT_SECRET,
        };
        process.env.OAUTH_CLIENT_ID = LEGACY_ID;
        process.env.OAUTH_CLIENT_SECRET = secret;
        try {
            return buildTestApp({
                store: fakeStore({ legacyRedirects: [SNAPSHOT_URI] }),
            });
        } finally {
            if (saved.id === undefined) delete process.env.OAUTH_CLIENT_ID;
            else process.env.OAUTH_CLIENT_ID = saved.id;
            if (saved.secret === undefined)
                delete process.env.OAUTH_CLIENT_SECRET;
            else process.env.OAUTH_CLIENT_SECRET = saved.secret;
        }
    }

    test("a snapshot URI is accepted", async () => {
        _resetBuckets();
        const { app } = buildLegacyApp();
        const res = await fire(
            app,
            "GET",
            authorizePath({ client_id: LEGACY_ID, redirect_uri: SNAPSHOT_URI }),
            "198.51.100.40",
        );
        expect(res.status).toBe(200);
    });

    test("a loopback URI is accepted", async () => {
        _resetBuckets();
        const { app } = buildLegacyApp();
        const res = await fire(
            app,
            "GET",
            authorizePath({
                client_id: LEGACY_ID,
                redirect_uri: "http://localhost:6274/oauth/callback",
            }),
            "198.51.100.41",
        );
        expect(res.status).toBe(200);
    });

    test("any other URI is a JSON 400 with no Location header", async () => {
        _resetBuckets();
        const { app } = buildLegacyApp();
        const res = await fire(
            app,
            "GET",
            authorizePath({
                client_id: LEGACY_ID,
                redirect_uri: "https://evil.example/cb",
            }),
            "198.51.100.42",
        );
        expect(res.status).toBe(400);
        expect(res.headers.get("Location")).toBeNull();
    });

    test("/register never hands out the legacy client", async () => {
        _resetBuckets();
        const { app } = buildLegacyApp();
        const reg = await registerClient(app, "198.51.100.43");
        expect(reg.client_id).not.toBe(LEGACY_ID);
        expect(reg.client_secret).not.toBe(LEGACY_SECRET);
    });

    test("/token accepts the legacy client's id and secret", async () => {
        _resetBuckets();
        const { app } = buildLegacyApp();
        const ip = "198.51.100.44";
        const authorize = await fire(
            app,
            "GET",
            authorizePath({ client_id: LEGACY_ID, redirect_uri: SNAPSHOT_URI }),
            ip,
        );
        const sessionId = sessionIdFrom(await authorize.text())!;
        const code = codeFrom(
            await postForm(
                app,
                "/approve",
                ip,
                {
                    session_id: sessionId,
                    email: "a@example.com",
                    password: "pw",
                },
                { cookie: bindingCookie(authorize) },
            ),
        );
        const res = await postForm(app, "/token", ip, {
            grant_type: "authorization_code",
            code: code!,
            redirect_uri: SNAPSHOT_URI,
            code_verifier: VERIFIER,
            client_id: LEGACY_ID,
            client_secret: LEGACY_SECRET,
        });
        expect(res.status).toBe(200);
    });

    // Its secret was handed to every caller, so it stays optional — but a
    // wrong one is still refused, and Basic works now that it's advertised
    // (the MCP SDK may switch to it on its own).
    test("/token: legacy secret optional, must match if sent, Basic accepted", async () => {
        _resetBuckets();
        const { app, store } = buildLegacyApp();
        const ip = "198.51.100.45";
        async function code() {
            const authorize = await fire(
                app,
                "GET",
                authorizePath({
                    client_id: LEGACY_ID,
                    redirect_uri: SNAPSHOT_URI,
                }),
                ip,
            );
            return codeFrom(
                await postForm(
                    app,
                    "/approve",
                    ip,
                    {
                        session_id: sessionIdFrom(await authorize.text())!,
                        email: "a@example.com",
                        password: "pw",
                    },
                    { cookie: bindingCookie(authorize) },
                ),
            );
        }
        const grant = (c: string) => ({
            grant_type: "authorization_code",
            code: c,
            redirect_uri: SNAPSHOT_URI,
            code_verifier: VERIFIER,
        });

        const noSecret = await postForm(app, "/token", ip, {
            ...grant(await code()),
            client_id: LEGACY_ID,
        });
        expect(noSecret.status).toBe(200);

        const wrong = await postForm(app, "/token", ip, {
            ...grant(await code()),
            client_id: LEGACY_ID,
            client_secret: "wrong",
        });
        expect(wrong.status).toBe(401);

        const viaBasic = await postForm(
            app,
            "/token",
            ip,
            grant(await code()),
            {
                authorization: `Basic ${Buffer.from(`${LEGACY_ID}:${LEGACY_SECRET}`).toString("base64")}`,
            },
        );
        expect(viaBasic.status).toBe(200);
        // No oauth_clients row to stamp for the legacy client.
        expect(store.dump().touched).not.toContain(LEGACY_ID);
    });

    // Runs authorize -> approve for the legacy client and returns the code.
    async function legacyCode(app: Hono, ip: string) {
        const authorize = await fire(
            app,
            "GET",
            authorizePath({ client_id: LEGACY_ID, redirect_uri: SNAPSHOT_URI }),
            ip,
        );
        return codeFrom(
            await postForm(
                app,
                "/approve",
                ip,
                {
                    session_id: sessionIdFrom(await authorize.text())!,
                    email: "a@example.com",
                    password: "pw",
                },
                { cookie: bindingCookie(authorize) },
            ),
        );
    }

    // The MCP SDK builds Basic as btoa(`${id}:${secret}`) with no
    // form-encoding, and switches a pre-registration client to Basic on its
    // own once Basic is advertised. A "+" in the secret must not decode to a
    // space and log that client out.
    test("/token: raw (not form-encoded) Basic with a '+' or '%' in the secret", async () => {
        for (const [i, secret] of [
            "abc+def/ghi=",
            "abc%2Bdef",
            "abc%zz",
        ].entries()) {
            _resetBuckets();
            const { app } = buildLegacyApp(secret);
            const ip = `198.51.100.${46 + i}`;
            const res = await postForm(
                app,
                "/token",
                ip,
                {
                    grant_type: "authorization_code",
                    code: await legacyCode(app, ip),
                    redirect_uri: SNAPSHOT_URI,
                    code_verifier: VERIFIER,
                },
                {
                    authorization: `Basic ${btoa(`${LEGACY_ID}:${secret}`)}`,
                },
            );
            expect({ secret, status: res.status }).toEqual({
                secret,
                status: 200,
            });
        }
    });

    // Before per-client registration the legacy client was the only one, and
    // /token accepted its secret with no client_id; kept until the sunset.
    test("/token: a legacy secret with no client_id is the legacy client", async () => {
        _resetBuckets();
        const { app } = buildLegacyApp();
        const ip = "198.51.100.49";
        const grant = async () => ({
            grant_type: "authorization_code",
            code: await legacyCode(app, ip),
            redirect_uri: SNAPSHOT_URI,
            code_verifier: VERIFIER,
        });
        const ok = await postForm(app, "/token", ip, {
            ...(await grant()),
            client_secret: LEGACY_SECRET,
        });
        expect(ok.status).toBe(200);
        const { refresh_token } = (await ok.json()) as {
            refresh_token: string;
        };
        // The refresh token is bound to the legacy client, and the same
        // secret-only request refreshes it.
        const refreshed = await postForm(app, "/token", ip, {
            grant_type: "refresh_token",
            refresh_token,
            client_secret: LEGACY_SECRET,
        });
        expect(refreshed.status).toBe(200);

        const wrong = await postForm(app, "/token", ip, {
            ...(await grant()),
            client_secret: "wrong",
        });
        expect(wrong.status).toBe(401);
    });
});

// ---------- Consent notice ----------

describe("consent notice", () => {
    async function noticeFor(
        ip: string,
        redirectUri: string,
        extra: Record<string, unknown> = {},
        locale?: string,
    ) {
        _resetBuckets();
        const { app } = buildTestApp();
        const client = await registerClient(app, ip, {
            redirect_uris: [redirectUri],
            token_endpoint_auth_method: "none",
            ...extra,
        });
        const res = await fire(
            app,
            "GET",
            authorizePath({
                client_id: client.client_id,
                redirect_uri: redirectUri,
                locale,
            }),
            ip,
        );
        expect(res.status).toBe(200);
        const html = await res.text();
        return { html, notice: clientNotice(html)! };
    }

    test("Claude's callback gets the plain notice, no warning", async () => {
        const { notice } = await noticeFor("198.51.100.50", CLAUDE_CALLBACK);
        expect(notice).not.toContain("data-warn");
        expect(notice).toContain("After you sign in, you'll be sent back to");
        expect(notice).toContain("<strong>claude.ai</strong>");
    });

    test("an unknown https host is warned about", async () => {
        const { notice } = await noticeFor(
            "198.51.100.51",
            "https://claude.ai.evil.example/cb",
        );
        expect(notice).toContain("data-warn");
        expect(notice).toContain("<strong>claude.ai.evil.example</strong>");
        expect(notice).toContain("isn't an assistant we recognise");
    });

    test("a loopback redirect gets the loopback warning", async () => {
        const { notice } = await noticeFor(
            "198.51.100.52",
            "http://localhost:6274/callback",
        );
        expect(notice).toContain("data-warn");
        expect(notice).toContain("<strong>localhost:6274</strong>");
        expect(notice).toContain("a program running on this computer");
    });

    // The whole URI minus its query, not just "cursor://": for a browser
    // launcher the denylist misses, the scheme alone would hide the web
    // origin the code is actually delivered to.
    test("a custom scheme is shown in full with the unknown-host warning", async () => {
        const { notice } = await noticeFor(
            "198.51.100.53",
            "cursor://anysphere.cursor-retrieval/oauth/cb?x=1",
        );
        expect(notice).toContain("data-warn");
        expect(notice).toContain(
            "<strong>cursor://anysphere.cursor-retrieval/oauth/cb</strong>",
        );
        expect(notice).not.toContain("x=1");
    });

    test("a browser-launcher scheme cannot be registered", async () => {
        _resetBuckets();
        const { app } = buildTestApp();
        const res = await postJson(app, "/register", "198.51.100.56", {
            redirect_uris: ["x-safari-https://evil.example/cb"],
            token_endpoint_auth_method: "none",
        });
        expect(res.status).toBe(400);
    });

    test("the de notice is German", async () => {
        const { notice } = await noticeFor(
            "198.51.100.54",
            CLAUDE_CALLBACK,
            {},
            "de",
        );
        expect(notice).toContain("Nach der Anmeldung wirst du zu");
        expect(notice).not.toContain("After you sign in");
    });

    test("client_name is never rendered", async () => {
        const { html } = await noticeFor(
            "198.51.100.55",
            "https://evil.example/cb",
            { client_name: "<script>Claude</script>" },
        );
        expect(html).not.toContain("<script>Claude");
        expect(html).not.toContain("&lt;script&gt;Claude");
    });
});

// ---------- Browser binding ----------

// The login page's session id is in its HTML, so anyone who fetched
// /authorize holds it. Without a binding, an attacker's server could open a
// session for its own client, start the Google leg with the scraped id, and
// send the victim straight to Google's account chooser: the callback would
// then finish the attacker's session in the victim's browser and deliver the
// code to the attacker's redirect, the consent notice never shown. These pin
// that a session can only be advanced by the browser /authorize handed its
// cookie to.
describe("browser binding", () => {
    const GOOGLE_ENV = {
        GOOGLE_CLIENT_ID: "google-test-client",
        GOOGLE_CLIENT_SECRET: "google-test-secret",
    };

    // The Google routes read their env per request, so it is set only around
    // the body of each test that needs it, then restored.
    async function withGoogleEnv<T>(fn: () => Promise<T>): Promise<T> {
        const saved = {
            id: process.env.GOOGLE_CLIENT_ID,
            secret: process.env.GOOGLE_CLIENT_SECRET,
        };
        process.env.GOOGLE_CLIENT_ID = GOOGLE_ENV.GOOGLE_CLIENT_ID;
        process.env.GOOGLE_CLIENT_SECRET = GOOGLE_ENV.GOOGLE_CLIENT_SECRET;
        try {
            return await fn();
        } finally {
            if (saved.id === undefined) delete process.env.GOOGLE_CLIENT_ID;
            else process.env.GOOGLE_CLIENT_ID = saved.id;
            if (saved.secret === undefined)
                delete process.env.GOOGLE_CLIENT_SECRET;
            else process.env.GOOGLE_CLIENT_SECRET = saved.secret;
        }
    }

    // Replaces the global fetch the Google callback posts to, counting calls,
    // for the duration of fn.
    async function withGoogleTokenEndpoint<T>(
        fn: (calls: () => number) => Promise<T>,
    ): Promise<T> {
        const original = globalThis.fetch;
        let calls = 0;
        globalThis.fetch = (async () => {
            calls++;
            return Response.json({ id_token: "google-id-token" });
        }) as unknown as typeof fetch;
        try {
            return await fn(() => calls);
        } finally {
            globalThis.fetch = original;
        }
    }

    // An auth fake that records whether sign-in was ever attempted.
    function countingAuth() {
        const calls = { signIn: 0, signUp: 0, google: 0 };
        const auth: OAuthAuth = {
            signIn: async () => {
                calls.signIn++;
                return "user-1";
            },
            signUp: async () => {
                calls.signUp++;
                return "user-1";
            },
            signInWithGoogleIdToken: async () => {
                calls.google++;
                return "user-1";
            },
        };
        return { auth, calls };
    }

    async function setup(ip: string, deps: Pick<OAuthRouterDeps, "auth"> = {}) {
        _resetBuckets();
        const built = buildTestApp(deps);
        const client = await registerClient(built.app, ip, {
            token_endpoint_auth_method: "none",
        });
        return { ...built, client };
    }

    // Opens a session the way a browser (or an attacker's server) does, and
    // returns what that caller walks away with: the session id and cookie.
    async function openSession(
        app: Hono,
        ip: string,
        clientId: string,
        headers: Record<string, string> = {},
    ) {
        const res = await fire(
            app,
            "GET",
            authorizePath({ client_id: clientId }),
            ip,
            { headers },
        );
        expect(res.status).toBe(200);
        const setCookie = res.headers.get("Set-Cookie")!;
        return {
            res,
            setCookie,
            cookie: bindingCookie(res),
            sessionId: sessionIdFrom(await res.text())!,
        };
    }

    function startGoogle(
        app: Hono,
        ip: string,
        sessionId: string,
        cookie?: string,
    ) {
        return postForm(
            app,
            "/authorize/google",
            ip,
            { session_id: sessionId },
            cookie ? { cookie } : {},
        );
    }

    // The session's own cookie name carrying a value some other browser
    // would hold — the name is derivable from the session id, the value is
    // not.
    const otherBrowser = (cookie: string) =>
        `${cookie.split("=")[0]}=${"A".repeat(43)}`;

    // Every binding cookie a response sets, as "name=value" pairs, plus the
    // full Set-Cookie lines for attribute checks.
    function setCookies(res: Response) {
        const lines = res.headers.getSetCookie();
        return { lines, pairs: lines.map((l) => l.split(";")[0]!) };
    }

    async function expectMismatch(res: Response) {
        expect(res.status).toBe(400);
        expect(res.headers.get("Location")).toBeNull();
        expect(((await res.json()) as { error: string }).error).toBe(
            "session_mismatch",
        );
    }

    test("/authorize sets an HttpOnly, SameSite=Lax, Path=/ binding cookie", async () => {
        const ip = "198.51.100.80";
        const { app, client } = await setup(ip);
        const { setCookie, cookie } = await openSession(
            app,
            ip,
            client.client_id,
        );
        expect(cookie).toMatch(
            /^nm_oauth_bind_[0-9a-f]{16}=[A-Za-z0-9_-]{43}$/,
        );
        expect(setCookie).toContain("HttpOnly");
        expect(setCookie).toContain("SameSite=Lax");
        expect(setCookie).toContain("Path=/");
        // Lives exactly as long as the ten-minute session it guards.
        expect(setCookie).toContain(`Max-Age=${10 * 60}`);
        // Plain http (local dev) can't hold a Secure cookie, so no prefix.
        expect(setCookie).not.toContain("Secure");
        expect(setCookie).not.toContain("__Host-");
    });

    test("behind https it is a Secure __Host- cookie", async () => {
        const ip = "198.51.100.81";
        const { app, client } = await setup(ip);
        // What DigitalOcean's proxy sends. getBaseUrl, which decides
        // http vs https here, only reads the proto alongside a host.
        const https = {
            "x-forwarded-proto": "https",
            host: "nutrition-mcp.com",
        };
        const first = await openSession(app, ip, client.client_id, https);
        expect(first.cookie).toMatch(
            /^__Host-nm_oauth_bind_[0-9a-f]{16}=[A-Za-z0-9_-]{43}$/,
        );
        expect(first.setCookie).toContain("Secure");
        expect(first.setCookie).toContain("Path=/");
        expect(first.setCookie).not.toContain("Domain");

        // And it is the __Host- name that is read back: the same browser
        // finishes its sign-in.
        const approve = await postForm(
            app,
            "/approve",
            ip,
            {
                session_id: first.sessionId,
                email: "a@example.com",
                password: "pw",
            },
            { ...https, cookie: first.cookie },
        );
        expect(approve.status).toBe(302);
    });

    // Regression: the cookie used to be one per browser, minted by whichever
    // /authorize saw none. Two first-time loads in flight together each
    // minted their own value under the same name, the browser kept the last
    // Set-Cookie, and the other tab's sign-in failed the binding check. Named
    // per session, both land and both tabs finish.
    test("two concurrent first-time /authorize loads can both finish", async () => {
        const ip = "198.51.100.82";
        const { app, client } = await setup(ip);
        const [a, b] = await Promise.all([
            openSession(app, ip, client.client_id),
            openSession(app, ip, client.client_id),
        ]);
        const nameOf = (cookie: string) => cookie.split("=")[0];
        expect(nameOf(a.cookie)).not.toBe(nameOf(b.cookie));

        // The jar after both responses, in either order: neither overwrote
        // the other.
        const jar = `${a.cookie}; ${b.cookie}`;
        for (const { sessionId } of [a, b]) {
            const approve = await postForm(
                app,
                "/approve",
                ip,
                {
                    session_id: sessionId,
                    email: "a@example.com",
                    password: "pw",
                },
                { cookie: jar },
            );
            expect(approve.status).toBe(302);
        }
    });

    test("a finished sign-in deletes its own cookie and no other", async () => {
        const ip = "198.51.100.90";
        const { app, client } = await setup(ip);
        const a = await openSession(app, ip, client.client_id);
        const b = await openSession(app, ip, client.client_id);
        const approve = await postForm(
            app,
            "/approve",
            ip,
            { session_id: a.sessionId, email: "a@example.com", password: "pw" },
            { cookie: `${a.cookie}; ${b.cookie}` },
        );
        expect(approve.status).toBe(302);
        const { lines } = setCookies(approve);
        expect(lines).toHaveLength(1);
        expect(lines[0]).toStartWith(`${a.cookie.split("=")[0]}=;`);
        expect(lines[0]).toContain("Max-Age=0");
    });

    // A page that bounces a browser through /authorize over and over would
    // otherwise grow its Cookie header by one binding per visit for ten
    // minutes. Past the cap, /authorize clears the lot before adding its own.
    test("/authorize clears a pile-up of binding cookies", async () => {
        const ip = "198.51.100.91";
        const { app, client } = await setup(ip);
        const held = Array.from(
            { length: 10 },
            (_, i) =>
                `nm_oauth_bind_${i.toString(16).padStart(16, "0")}=${"B".repeat(43)}`,
        );
        const res = await fire(
            app,
            "GET",
            authorizePath({ client_id: client.client_id }),
            ip,
            { headers: { cookie: [...held, "unrelated=1"].join("; ") } },
        );
        expect(res.status).toBe(200);
        const { lines, pairs } = setCookies(res);
        const cleared = lines.filter((l) => l.includes("Max-Age=0"));
        expect(cleared.map((l) => l.split("=")[0]).sort()).toEqual(
            held.map((h) => h.split("=")[0]).sort(),
        );
        // Plus the new session's own, live cookie; nothing else is touched.
        expect(pairs).toHaveLength(held.length + 1);
        expect(lines.some((l) => l.startsWith("unrelated"))).toBe(false);

        // Below the cap nothing is cleared.
        const few = await fire(
            app,
            "GET",
            authorizePath({ client_id: client.client_id }),
            ip,
            { headers: { cookie: held.slice(0, 9).join("; ") } },
        );
        expect(setCookies(few).lines).toHaveLength(1);
    });

    // The attack itself: the attacker's server opened the session (and got
    // its own cookie); the victim's browser starts the Google leg with the
    // scraped id and either no cookie or its own.
    test("POST /authorize/google from another browser is refused and leaves the session intact", async () => {
        await withGoogleEnv(async () => {
            const ip = "198.51.100.83";
            const { app, client } = await setup(ip);
            const attacker = await openSession(app, ip, client.client_id);

            await expectMismatch(
                await startGoogle(app, ip, attacker.sessionId),
            );
            await expectMismatch(
                await startGoogle(
                    app,
                    ip,
                    attacker.sessionId,
                    otherBrowser(attacker.cookie),
                ),
            );

            // Neither refusal consumed the session: its own browser can
            // still start the Google leg.
            const own = await startGoogle(
                app,
                ip,
                attacker.sessionId,
                attacker.cookie,
            );
            expect(own.status).toBe(302);
        });
    });

    test("the Google callback from another browser is refused before any call to Google", async () => {
        await withGoogleEnv(() =>
            withGoogleTokenEndpoint(async (googleCalls) => {
                const ip = "198.51.100.84";
                const { auth, calls } = countingAuth();
                const { app, client, store } = await setup(ip, { auth });
                const attacker = await openSession(app, ip, client.client_id);
                // The attacker's server starts the Google leg itself, so the
                // session holds a nonce — as it would in the real attack.
                const start = await startGoogle(
                    app,
                    ip,
                    attacker.sessionId,
                    attacker.cookie,
                );
                expect(start.status).toBe(302);

                const callback = `/auth/google/callback?state=${attacker.sessionId}&code=google-code`;
                const browsers: Record<string, string>[] = [
                    {},
                    { cookie: otherBrowser(attacker.cookie) },
                ];
                for (const headers of browsers) {
                    await expectMismatch(
                        await fire(app, "GET", callback, ip, { headers }),
                    );
                }
                expect(googleCalls()).toBe(0);
                expect(calls.google).toBe(0);
                expect(store.dump().codes.size).toBe(0);

                // Untouched: the nonce is still there, so the browser that
                // started it completes normally.
                const own = await fire(app, "GET", callback, ip, {
                    headers: { cookie: attacker.cookie },
                });
                expect(own.status).toBe(302);
                expect(googleCalls()).toBe(1);
                const location = new URL(own.headers.get("Location")!);
                expect(`${location.origin}${location.pathname}`).toBe(
                    CLAUDE_CALLBACK,
                );
                expect(location.searchParams.get("code")).toBeTruthy();
            }),
        );
    });

    test("POST /approve from another browser is refused without attempting sign-in", async () => {
        const ip = "198.51.100.85";
        const { auth, calls } = countingAuth();
        const { app, client, store } = await setup(ip, { auth });
        const attacker = await openSession(app, ip, client.client_id);
        const fields = {
            session_id: attacker.sessionId,
            email: "victim@example.com",
            password: "pw",
        };

        await expectMismatch(await postForm(app, "/approve", ip, fields));
        await expectMismatch(
            await postForm(app, "/approve", ip, fields, {
                cookie: otherBrowser(attacker.cookie),
            }),
        );
        expect(calls.signIn).toBe(0);
        expect(calls.signUp).toBe(0);
        expect(store.dump().codes.size).toBe(0);

        // Not consumed: its own browser still signs in.
        const own = await postForm(app, "/approve", ip, fields, {
            cookie: attacker.cookie,
        });
        expect(own.status).toBe(302);
    });

    test("the Google leg starts with a POST carrying the cookie", async () => {
        await withGoogleEnv(async () => {
            const ip = "198.51.100.86";
            const { app, client } = await setup(ip);
            const browser = await openSession(app, ip, client.client_id);
            const res = await startGoogle(
                app,
                ip,
                browser.sessionId,
                browser.cookie,
            );
            expect(res.status).toBe(302);
            const google = new URL(res.headers.get("Location")!);
            expect(google.origin).toBe("https://accounts.google.com");
            expect(google.searchParams.get("state")).toBe(browser.sessionId);
            expect(google.searchParams.get("client_id")).toBe(
                GOOGLE_ENV.GOOGLE_CLIENT_ID,
            );
            expect(google.searchParams.get("nonce")).toMatch(/^[0-9a-f]{64}$/);
        });
    });

    // Directory policy 1.C: nothing reads the name or picture, and asking
    // for them makes Supabase Auth store them.
    test("Google sign-in requests only openid and email", async () => {
        await withGoogleEnv(async () => {
            const ip = "198.51.100.100";
            const { app, client } = await setup(ip);
            const browser = await openSession(app, ip, client.client_id);
            const res = await startGoogle(
                app,
                ip,
                browser.sessionId,
                browser.cookie,
            );
            expect(res.status).toBe(302);
            const google = new URL(res.headers.get("Location")!);
            expect(google.searchParams.get("scope")).toBe("openid email");
        });
    });

    // The link-shaped entry point is gone: a GET with a session id — even
    // from the right browser — no longer reaches Google.
    test("GET /authorize/google no longer starts the Google leg", async () => {
        await withGoogleEnv(async () => {
            const ip = "198.51.100.87";
            const { app, client } = await setup(ip);
            const browser = await openSession(app, ip, client.client_id);
            const res = await fire(
                app,
                "GET",
                `/authorize/google?session_id=${browser.sessionId}`,
                ip,
                { headers: { cookie: browser.cookie } },
            );
            expect(res.status).toBe(405);
            expect(res.headers.get("Allow")).toBe("POST");
            expect(res.headers.get("Location")).toBeNull();
        });
    });

    // The switcher re-enters /authorize and mints a fresh session, which
    // gets its own cookie beside the first; the browser sends both back.
    test("the language switcher binds the new session to its own cookie", async () => {
        const ip = "198.51.100.88";
        const { app, client } = await setup(ip);
        const first = await openSession(app, ip, client.client_id);
        const switched = await fire(
            app,
            "GET",
            authorizePath({ client_id: client.client_id, locale: "de" }),
            ip,
            { headers: { cookie: first.cookie } },
        );
        expect(switched.status).toBe(200);
        const second = bindingCookie(switched);
        expect(second.split("=")[0]).not.toBe(first.cookie.split("=")[0]);
        const html = await switched.text();
        expect(html).toContain('<html lang="de">');
        const sessionId = sessionIdFrom(html)!;
        expect(sessionId).not.toBe(first.sessionId);

        const approve = await postForm(
            app,
            "/approve",
            ip,
            { session_id: sessionId, email: "a@example.com", password: "pw" },
            { cookie: `${first.cookie}; ${second}` },
        );
        expect(approve.status).toBe(302);
    });

    // A rejected /authorize never creates a session, so it has nothing to
    // bind and sets no cookie.
    test("a rejected /authorize sets no cookie", async () => {
        const ip = "198.51.100.89";
        const { app, client } = await setup(ip);
        const res = await fire(
            app,
            "GET",
            authorizePath({
                client_id: client.client_id,
                redirect_uri: "https://evil.example/cb",
            }),
            ip,
        );
        expect(res.status).toBe(400);
        expect(res.headers.get("Set-Cookie")).toBeNull();
    });
});

// Every locale's login template starts the Google leg with a POST form that
// carries the session id in a hidden field — never a link, which is what let
// anything holding the id start it. Read from the generated files (run
// `bun run gen:all` first), since they, not the generator, are what is served.
test("every login template's Google control is a POST form with the hidden session_id", async () => {
    for (const locale of SITE_LOCALES) {
        const path =
            locale === "en"
                ? "./public/login.html"
                : `./public/${locale}/login.html`;
        const html = await Bun.file(path).text();
        const form = html.match(
            /<form\b[^>]*action="\/authorize\/google"[^>]*>[\s\S]*?<\/form>/,
        )?.[0];
        expect(`${path}: ${form !== undefined}`).toBe(`${path}: true`);
        expect(form).toMatch(/method="post"/i);
        expect(form).toMatch(
            /<input\s+type="hidden"\s+name="session_id"\s+value="\{\{SESSION_ID\}\}"/,
        );
        expect(form).toMatch(/<button\s+type="submit"/);
        expect(html).not.toContain("/authorize/google?");
        // No page-level CSP of its own that could block the form's redirect
        // to Google (see the form-action test in src/index.test.ts).
        expect(html).not.toMatch(/http-equiv="Content-Security-Policy"/i);
    }
});

// ---------- End to end ----------

test("register -> authorize -> approve -> token -> refresh", async () => {
    _resetBuckets();
    const { app, store } = buildTestApp();
    const ip = "198.51.100.60";

    const client = await registerClient(app, ip, {
        token_endpoint_auth_method: "none",
    });

    const authorize = await fire(
        app,
        "GET",
        authorizePath({ client_id: client.client_id, state: "st-1" }),
        ip,
    );
    expect(authorize.status).toBe(200);
    const sessionId = sessionIdFrom(await authorize.text());
    expect(sessionId).toBeTruthy();

    const approve = await postForm(
        app,
        "/approve",
        ip,
        {
            session_id: sessionId!,
            email: "someone@example.com",
            password: "pw",
            action: "login",
        },
        { cookie: bindingCookie(authorize) },
    );
    expect(approve.status).toBe(302);
    const location = new URL(approve.headers.get("Location")!);
    expect(`${location.origin}${location.pathname}`).toBe(CLAUDE_CALLBACK);
    expect(location.searchParams.get("state")).toBe("st-1");
    // RFC 9207: iss is this server's issuer, byte-identical to the metadata.
    expect(location.searchParams.get("iss")).toBe(
        authorizationServerMetadata("http://localhost").issuer,
    );
    const code = location.searchParams.get("code");
    expect(code).toBeTruthy();

    // The code is bound to the client and challenge it was issued for.
    const stored = store.dump().codes.get(hashSecret(code!))!;
    expect(stored.client_id).toBe(client.client_id);
    expect(stored.code_challenge).toBe(CHALLENGE);
    expect(stored.resource).toBeNull();

    const token = await postForm(app, "/token", ip, {
        grant_type: "authorization_code",
        code: code!,
        redirect_uri: CLAUDE_CALLBACK,
        code_verifier: VERIFIER,
        client_id: client.client_id,
    });
    expect(token.status).toBe(200);
    expect(token.headers.get("Cache-Control")).toBe("no-store");
    expect(token.headers.get("Pragma")).toBe("no-cache");
    const pair = (await token.json()) as {
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    };
    expect(pair.token_type).toBe("Bearer");
    expect(pair.expires_in).toBe(ACCESS_TOKEN_TTL_SECONDS);
    expect(pair.access_token).toBeTruthy();
    expect(pair.refresh_token).toBeTruthy();
    expect(store.dump().tokens.get(hashSecret(pair.access_token))?.userId).toBe(
        "user-1",
    );
    // The refresh token is bound to the client that redeemed the code.
    expect(
        store.dump().refresh.get(hashSecret(pair.refresh_token))?.clientId,
    ).toBe(client.client_id);
    expect(store.dump().touched).toContain(client.client_id);

    // A code is single-use.
    const replay = await postForm(app, "/token", ip, {
        grant_type: "authorization_code",
        code: code!,
        redirect_uri: CLAUDE_CALLBACK,
        code_verifier: VERIFIER,
        client_id: client.client_id,
    });
    expect(replay.status).toBe(400);
    expect(((await replay.json()) as { error: string }).error).toBe(
        "invalid_grant",
    );
    expect(replay.headers.get("Cache-Control")).toBe("no-store");

    const refreshed = await postForm(app, "/token", ip, {
        grant_type: "refresh_token",
        refresh_token: pair.refresh_token,
        client_id: client.client_id,
    });
    expect(refreshed.status).toBe(200);
    expect(refreshed.headers.get("Cache-Control")).toBe("no-store");
    const next = (await refreshed.json()) as {
        access_token: string;
        refresh_token: string;
    };
    expect(next.access_token).not.toBe(pair.access_token);
    expect(next.refresh_token).not.toBe(pair.refresh_token);

    // The old refresh token was consumed by the rotation.
    const stale = await postForm(app, "/token", ip, {
        grant_type: "refresh_token",
        refresh_token: pair.refresh_token,
        client_id: client.client_id,
    });
    expect(stale.status).toBe(400);
    expect(stale.headers.get("Cache-Control")).toBe("no-store");
    expect(stale.headers.get("Pragma")).toBe("no-cache");
    expect(((await stale.json()) as { error: string }).error).toBe(
        "invalid_grant",
    );
});

// ---------- POST /approve: explicit sign-up (brief 11) ----------

describe("POST /approve sign-in and sign-up", () => {
    const EN = LOGIN_ERRORS.en;
    // Supabase's own wording for the failures below. None of it may reach
    // the page: it is untranslated, and "already registered" would confirm
    // that an address has an account.
    const SUPABASE_TEXT = [
        "Invalid login credentials",
        "User already registered",
        "Password should be",
        "sign-in failed",
        "sign-up failed",
    ];

    // A fake whose accounts are a Map of email -> password, answering the
    // way GoTrue does with Confirm email off. `signUpFails` forces a
    // sign-up refusal; `signInFails` forces a non-credentials sign-in error.
    function accountsAuth(
        opts: {
            accounts?: Record<string, string>;
            signUpFails?: SignUpError;
            signInFails?: SignInError;
        } = {},
    ) {
        const accounts = new Map(Object.entries(opts.accounts ?? {}));
        const calls = { signIn: 0, signUp: 0 };
        const auth: OAuthAuth = {
            signIn: async (email, password) => {
                calls.signIn++;
                if (opts.signInFails) throw opts.signInFails;
                if (accounts.get(email) !== password) {
                    throw new SignInError("invalid_credentials");
                }
                return `user:${email}`;
            },
            signUp: async (email, password) => {
                calls.signUp++;
                if (opts.signUpFails) throw opts.signUpFails;
                if (accounts.has(email)) throw new SignUpError("user_exists");
                accounts.set(email, password);
                return `user:${email}`;
            },
            signInWithGoogleIdToken: async () => "user-google",
        };
        return { auth, calls, accounts };
    }

    async function submit(
        auth: OAuthAuth,
        fields: { email: string; password: string; action?: string },
        query: Record<string, string> = {},
    ) {
        _resetBuckets();
        const { app, store } = buildTestApp({ auth });
        const ip = "198.51.100.90";
        const client = await registerClient(app, ip, {
            token_endpoint_auth_method: "none",
        });
        const authorize = await fire(
            app,
            "GET",
            authorizePath({ client_id: client.client_id, ...query }),
            ip,
        );
        expect(authorize.status).toBe(200);
        const res = await postForm(
            app,
            "/approve",
            ip,
            {
                session_id: sessionIdFrom(await authorize.text())!,
                ...fields,
            },
            { cookie: bindingCookie(authorize) },
        );
        return { res, store };
    }

    async function expectRefused(
        res: Response,
        store: FakeStore,
        message: string,
    ) {
        expect(res.status).toBe(400);
        expect(res.headers.get("Location")).toBeNull();
        expect(store.dump().codes.size).toBe(0);
        const html = await res.text();
        expect(html).toContain(message);
        for (const text of SUPABASE_TEXT) expect(html).not.toContain(text);
    }

    test("a wrong password on Sign in never signs up and says so generically", async () => {
        const { auth, calls, accounts } = accountsAuth({
            accounts: { "a@example.com": "right-pw" },
        });
        const { res, store } = await submit(auth, {
            email: "a@example.com",
            password: "wrong-pw",
            action: "signin",
        });
        await expectRefused(res, store, EN.invalidCredentials);
        expect(calls.signUp).toBe(0);
        expect(accounts.get("a@example.com")).toBe("right-pw");
    });

    // The regression itself: an unknown address on Sign in used to become
    // an account with whatever password was typed.
    test("an unknown address on Sign in creates no account", async () => {
        const { auth, calls, accounts } = accountsAuth();
        const { res, store } = await submit(auth, {
            email: "new@example.com",
            password: "pw-123456",
            action: "signin",
        });
        await expectRefused(res, store, EN.invalidCredentials);
        expect(calls.signUp).toBe(0);
        expect(accounts.size).toBe(0);
    });

    // Old cached login pages post action=login, and a missing or unknown
    // action must never be read as a sign-up.
    for (const action of ["login", "", "SIGNUP", undefined]) {
        test(`action=${JSON.stringify(action)} is treated as Sign in`, async () => {
            const { auth, calls } = accountsAuth();
            const { res, store } = await submit(auth, {
                email: "new@example.com",
                password: "pw-123456",
                ...(action === undefined ? {} : { action }),
            });
            await expectRefused(res, store, EN.invalidCredentials);
            expect(calls.signUp).toBe(0);
        });
    }

    test("the right password on Sign in finishes authorization", async () => {
        const { auth } = accountsAuth({
            accounts: { "a@example.com": "right-pw" },
        });
        const { res, store } = await submit(auth, {
            email: "a@example.com",
            password: "right-pw",
            action: "signin",
        });
        expect(res.status).toBe(302);
        expect(codeFrom(res)).toBeTruthy();
        expect([...store.dump().codes.values()][0]!.user_id).toBe(
            "user:a@example.com",
        );
    });

    test("Create account for a new address creates it and finishes authorization", async () => {
        const { auth, calls, accounts } = accountsAuth();
        const { res } = await submit(auth, {
            email: "new@example.com",
            password: "pw-123456",
            action: "signup",
        });
        expect(res.status).toBe(302);
        expect(calls).toEqual({ signIn: 1, signUp: 1 });
        expect(accounts.get("new@example.com")).toBe("pw-123456");
    });

    test("Create account with an existing account's right password just signs in", async () => {
        const { auth, calls } = accountsAuth({
            accounts: { "a@example.com": "right-pw" },
        });
        const { res } = await submit(auth, {
            email: "a@example.com",
            password: "right-pw",
            action: "signup",
        });
        expect(res.status).toBe(302);
        expect(calls.signUp).toBe(0);
    });

    test("Create account with an existing account's wrong password reads as a wrong password", async () => {
        const { auth, accounts } = accountsAuth({
            accounts: { "a@example.com": "right-pw" },
        });
        const { res, store } = await submit(auth, {
            email: "a@example.com",
            password: "wrong-pw",
            action: "signup",
        });
        await expectRefused(res, store, EN.invalidCredentials);
        expect(accounts.get("a@example.com")).toBe("right-pw");
    });

    for (const [code, message] of [
        ["weak_password", EN.weakPassword],
        ["email_invalid", EN.emailInvalid],
        ["rate_limited", EN.signInFailed],
        ["other", EN.signUpFailed],
    ] as const) {
        test(`a sign-up refused as ${code} shows its own message`, async () => {
            const { auth } = accountsAuth({
                signUpFails: new SignUpError(code),
            });
            const { res, store } = await submit(auth, {
                email: "new@example.com",
                password: "pw-123456",
                action: "signup",
            });
            await expectRefused(res, store, message);
        });
    }

    // GoTrue refuses a password over bcrypt's 72 bytes with the same
    // validation_failed a malformed email gets, so /approve checks it first
    // and names the right field. Counted in bytes: 25 three-byte characters
    // are 75 bytes.
    for (const password of ["x".repeat(73), "€".repeat(25)]) {
        test(`Create account with a ${Buffer.byteLength(password)}-byte password asks for a shorter one without calling sign-up`, async () => {
            const { auth, calls } = accountsAuth();
            const { res, store } = await submit(auth, {
                email: "new@example.com",
                password,
                action: "signup",
            });
            await expectRefused(res, store, EN.passwordTooLong);
            expect(calls.signUp).toBe(0);
        });
    }

    test("a 72-byte password still signs up", async () => {
        const { auth } = accountsAuth();
        const { res } = await submit(auth, {
            email: "new@example.com",
            password: "x".repeat(72),
            action: "signup",
        });
        expect(res.status).toBe(302);
    });

    // A sign-in that couldn't be judged (a 429, an outage) says so on both
    // buttons, and Create account doesn't take it as "no such account".
    for (const action of ["signin", "signup"]) {
        test(`a sign-in that fails for another reason on ${action} is signInFailed, never a sign-up`, async () => {
            const { auth, calls } = accountsAuth({
                signInFails: new SignInError("rate_limited"),
            });
            const { res, store } = await submit(auth, {
                email: "new@example.com",
                password: "pw-123456",
                action,
            });
            await expectRefused(res, store, EN.signInFailed);
            expect(calls.signUp).toBe(0);
        });
    }

    // Anything that isn't one of our typed errors (a bug, a thrown string)
    // still shows only translated text.
    test("an untyped error never leaks its message", async () => {
        const auth: OAuthAuth = {
            signIn: async () => {
                throw new Error("Invalid login credentials");
            },
            signUp: async () => {
                throw new Error("User already registered");
            },
            signInWithGoogleIdToken: async () => "user-google",
        };
        const { res, store } = await submit(auth, {
            email: "a@example.com",
            password: "pw-123456",
            action: "signup",
        });
        await expectRefused(res, store, EN.signInFailed);
    });

    test("the message is in the session's locale", async () => {
        const { auth } = accountsAuth();
        const { res, store } = await submit(
            auth,
            {
                email: "new@example.com",
                password: "pw-123456",
                action: "signin",
            },
            { locale: "de" },
        );
        await expectRefused(res, store, LOGIN_ERRORS.de.invalidCredentials);
    });
});

// ---------- POST /token (Phase B) ----------

describe("POST /token", () => {
    const SECOND_CALLBACK = "https://other-client.example/cb";

    // Registers a client, runs authorize -> approve for it, and returns the
    // code the redirect carried. `app`/`store` can be passed in so two
    // clients share one server.
    async function codeFor(
        ip: string,
        meta: Record<string, unknown>,
        shared?: { app: Hono; store: FakeStore },
        authorize: Record<string, string> = {},
    ) {
        if (!shared) _resetBuckets();
        const { app, store } = shared ?? buildTestApp();
        const client = await registerClient(app, ip, meta);
        const redirect = client.redirect_uris[0]!;
        const res = await fire(
            app,
            "GET",
            authorizePath({
                client_id: client.client_id,
                redirect_uri: redirect,
                ...authorize,
            }),
            ip,
        );
        expect(res.status).toBe(200);
        const approve = await postForm(
            app,
            "/approve",
            ip,
            {
                session_id: sessionIdFrom(await res.text())!,
                email: "a@example.com",
                password: "pw",
            },
            { cookie: bindingCookie(res) },
        );
        expect(approve.status).toBe(302);
        const code = new URL(approve.headers.get("Location")!).searchParams.get(
            "code",
        )!;
        return { app, store, client, code, redirect };
    }

    function redeem(
        app: Hono,
        ip: string,
        fields: Record<string, string | undefined>,
        headers: Record<string, string> = {},
    ) {
        const all: Record<string, string> = {};
        const merged: Record<string, string | undefined> = {
            grant_type: "authorization_code",
            redirect_uri: CLAUDE_CALLBACK,
            code_verifier: VERIFIER,
            ...fields,
        };
        for (const [k, v] of Object.entries(merged))
            if (v !== undefined) all[k] = v;
        return postForm(app, "/token", ip, all, headers);
    }

    // RFC 6749 §2.3.1: each half form-encoded, then base64 of "id:secret".
    function basic(id: string, secret: string) {
        const enc = (v: string) =>
            new URLSearchParams({ v }).toString().slice(2);
        return `Basic ${Buffer.from(`${enc(id)}:${enc(secret)}`).toString("base64")}`;
    }

    async function expectError(res: Response, status: number, error: string) {
        expect(res.status).toBe(status);
        expect(res.headers.get("Cache-Control")).toBe("no-store");
        expect(res.headers.get("Pragma")).toBe("no-cache");
        expect(((await res.json()) as { error: string }).error).toBe(error);
    }

    // ----- authorization_code: client authentication -----

    test("a confidential client's secret is accepted in the body", async () => {
        const ip = "198.51.100.70";
        const { app, client, code } = await codeFor(ip, {
            token_endpoint_auth_method: "client_secret_post",
        });
        const res = await redeem(app, ip, {
            code,
            client_id: client.client_id,
            client_secret: client.client_secret!,
        });
        expect(res.status).toBe(200);
    });

    test("Basic auth with the right secret is accepted", async () => {
        const ip = "198.51.100.71";
        const { app, client, code } = await codeFor(ip, {});
        expect(client.token_endpoint_auth_method).toBe("client_secret_basic");
        const res = await redeem(
            app,
            ip,
            { code },
            { authorization: basic(client.client_id, client.client_secret!) },
        );
        expect(res.status).toBe(200);
        expect(res.headers.get("Cache-Control")).toBe("no-store");
    });

    // Either transport proves the same secret; see authenticateClient.
    test("a confidential client may use either secret transport", async () => {
        const ip = "198.51.100.72";
        const post = await codeFor(ip, {});
        expect(
            (
                await redeem(post.app, ip, {
                    code: post.code,
                    client_id: post.client.client_id,
                    client_secret: post.client.client_secret!,
                })
            ).status,
        ).toBe(200);

        const viaBasic = await codeFor(ip, {
            token_endpoint_auth_method: "client_secret_post",
        });
        expect(
            (
                await redeem(
                    viaBasic.app,
                    ip,
                    { code: viaBasic.code },
                    {
                        authorization: basic(
                            viaBasic.client.client_id,
                            viaBasic.client.client_secret!,
                        ),
                    },
                )
            ).status,
        ).toBe(200);
    });

    test("Basic auth with a wrong secret is 401 with WWW-Authenticate: Basic", async () => {
        const ip = "198.51.100.73";
        const { app, client, code, store } = await codeFor(ip, {});
        const res = await redeem(
            app,
            ip,
            { code },
            { authorization: basic(client.client_id, "wrong") },
        );
        expect(res.headers.get("WWW-Authenticate")).toStartWith("Basic");
        await expectError(res, 401, "invalid_client");
        // Refused before the code was touched.
        expect(store.dump().codes.has(hashSecret(code))).toBe(true);
    });

    test("a malformed Basic header is 401 with WWW-Authenticate: Basic", async () => {
        const ip = "198.51.100.74";
        const { app, code } = await codeFor(ip, {});
        for (const authorization of [
            "Basic !!!",
            `Basic ${Buffer.from("no-colon").toString("base64")}`,
            `Basic ${Buffer.from("%zz:secret").toString("base64")}`,
        ]) {
            const res = await redeem(app, ip, { code }, { authorization });
            expect(res.headers.get("WWW-Authenticate")).toStartWith("Basic");
            await expectError(res, 401, "invalid_client");
        }
    });

    test("Basic credentials are form-decoded", async () => {
        const ip = "198.51.100.75";
        const { app, client, code, store } = await codeFor(ip, {});
        // Swap in a secret that needs encoding, as the store would hold it.
        store.dump().clients.get(client.client_id)!.secretHash = crypto
            .createHash("sha256")
            .update("s3cret with+plus:colon")
            .digest("hex");
        const res = await redeem(
            app,
            ip,
            { code },
            {
                authorization: basic(
                    client.client_id,
                    "s3cret with+plus:colon",
                ),
            },
        );
        expect(res.status).toBe(200);
    });

    // The MCP SDK sends btoa(`${id}:${secret}`) without form-encoding; the
    // raw halves are accepted as well as the decoded ones.
    test("raw (not form-encoded) Basic credentials are accepted", async () => {
        const ip = "198.51.100.69";
        const { app, client, code, store } = await codeFor(ip, {});
        store.dump().clients.get(client.client_id)!.secretHash = crypto
            .createHash("sha256")
            .update("abc+def/ghi%zz=")
            .digest("hex");
        const res = await redeem(
            app,
            ip,
            { code },
            {
                authorization: `Basic ${btoa(`${client.client_id}:abc+def/ghi%zz=`)}`,
            },
        );
        expect(res.status).toBe(200);
    });

    test("a secret with no client_id is 401 when there is no legacy client", async () => {
        const ip = "198.51.100.68";
        const { app, code } = await codeFor(ip, {});
        await expectError(
            await redeem(app, ip, { code, client_secret: "anything" }),
            401,
            "invalid_client",
        );
    });

    test("a confidential client with no secret is 401", async () => {
        const ip = "198.51.100.76";
        const { app, client, code } = await codeFor(ip, {
            token_endpoint_auth_method: "client_secret_post",
        });
        const res = await redeem(app, ip, {
            code,
            client_id: client.client_id,
        });
        // Body-only attempt: no Basic challenge.
        expect(res.headers.get("WWW-Authenticate")).toBeNull();
        await expectError(res, 401, "invalid_client");
    });

    test("a wrong body secret is 401 invalid_client", async () => {
        const ip = "198.51.100.77";
        const { app, client, code } = await codeFor(ip, {
            token_endpoint_auth_method: "client_secret_post",
        });
        await expectError(
            await redeem(app, ip, {
                code,
                client_id: client.client_id,
                client_secret: "wrong",
            }),
            401,
            "invalid_client",
        );
    });

    test("credentials in both the header and the body are invalid_request", async () => {
        const ip = "198.51.100.78";
        const { app, client, code } = await codeFor(ip, {});
        await expectError(
            await redeem(
                app,
                ip,
                {
                    code,
                    client_id: client.client_id,
                    client_secret: client.client_secret!,
                },
                {
                    authorization: basic(
                        client.client_id,
                        client.client_secret!,
                    ),
                },
            ),
            400,
            "invalid_request",
        );
    });

    test("a public client must send its client_id", async () => {
        const ip = "198.51.100.79";
        const { app, client, code } = await codeFor(ip, {
            token_endpoint_auth_method: "none",
        });
        await expectError(
            await redeem(app, ip, { code }),
            401,
            "invalid_client",
        );
        // A public client presenting a secret is refused too.
        await expectError(
            await redeem(app, ip, {
                code,
                client_id: client.client_id,
                client_secret: "anything",
            }),
            401,
            "invalid_client",
        );
    });

    test("an unknown client_id is 401 invalid_client", async () => {
        const ip = "198.51.100.110";
        const { app, code } = await codeFor(ip, {
            token_endpoint_auth_method: "none",
        });
        await expectError(
            await redeem(app, ip, { code, client_id: crypto.randomUUID() }),
            401,
            "invalid_client",
        );
    });

    // ----- authorization_code: the grant -----

    test("a code issued to client A cannot be redeemed by client B", async () => {
        const ip = "198.51.100.111";
        const a = await codeFor(ip, { token_endpoint_auth_method: "none" });
        const b = await registerClient(a.app, ip, {
            token_endpoint_auth_method: "none",
            redirect_uris: [CLAUDE_CALLBACK],
        });
        await expectError(
            await redeem(a.app, ip, { code: a.code, client_id: b.client_id }),
            400,
            "invalid_grant",
        );
        // Spent by the failed attempt: A can't redeem it afterwards either.
        await expectError(
            await redeem(a.app, ip, {
                code: a.code,
                client_id: a.client.client_id,
            }),
            400,
            "invalid_grant",
        );
    });

    // A code minted before auth_codes carried a client_id is not bound.
    test("a null-client code is redeemable by any authenticated client", async () => {
        const ip = "198.51.100.112";
        const { app, store, client, code } = await codeFor(ip, {
            token_endpoint_auth_method: "none",
        });
        store.dump().codes.get(hashSecret(code))!.client_id = null;
        const res = await redeem(app, ip, {
            code,
            client_id: client.client_id,
        });
        expect(res.status).toBe(200);
    });

    for (const [label, fields] of [
        ["a missing redirect_uri", { redirect_uri: undefined }],
        ["a mismatched redirect_uri", { redirect_uri: SECOND_CALLBACK }],
        [
            "a redirect_uri differing only by port and trailing slash",
            { redirect_uri: "https://claude.ai:443/api/mcp/auth_callback/" },
        ],
        ["a wrong code_verifier", { code_verifier: "x".repeat(43) }],
        // Documented choice: invalid_grant, like a wrong verifier.
        ["a missing code_verifier", { code_verifier: undefined }],
        ["a too-short code_verifier", { code_verifier: "x".repeat(42) }],
        [
            "a code_verifier with invalid characters",
            { code_verifier: `${VERIFIER}!` },
        ],
    ] as const) {
        test(`${label} is invalid_grant`, async () => {
            const ip = "198.51.100.113";
            const { app, client, code } = await codeFor(ip, {
                token_endpoint_auth_method: "none",
            });
            await expectError(
                await redeem(app, ip, {
                    code,
                    client_id: client.client_id,
                    ...fields,
                }),
                400,
                "invalid_grant",
            );
        });
    }

    test("a code with no challenge is always rejected", async () => {
        const ip = "198.51.100.114";
        const { app, store, client, code } = await codeFor(ip, {
            token_endpoint_auth_method: "none",
        });
        store.dump().codes.get(hashSecret(code))!.code_challenge = null;
        await expectError(
            await redeem(app, ip, { code, client_id: client.client_id }),
            400,
            "invalid_grant",
        );
    });

    test("a replayed code is invalid_grant", async () => {
        const ip = "198.51.100.115";
        const { app, client, code } = await codeFor(ip, {
            token_endpoint_auth_method: "none",
        });
        const fields = { code, client_id: client.client_id };
        expect((await redeem(app, ip, fields)).status).toBe(200);
        await expectError(await redeem(app, ip, fields), 400, "invalid_grant");
    });

    test("a missing code is invalid_request", async () => {
        const ip = "198.51.100.116";
        const { app, client } = await codeFor(ip, {
            token_endpoint_auth_method: "none",
        });
        await expectError(
            await redeem(app, ip, { client_id: client.client_id }),
            400,
            "invalid_request",
        );
    });

    test("resource must match the one the code was issued for", async () => {
        const ip = "198.51.100.117";
        const RESOURCE = "http://localhost/mcp";
        const bound = await codeFor(
            ip,
            { token_endpoint_auth_method: "none" },
            undefined,
            { resource: RESOURCE },
        );
        expect(
            bound.store.dump().codes.get(hashSecret(bound.code))!.resource,
        ).toBe(RESOURCE);
        // The bare origin is this server too, but not what was authorized.
        await expectError(
            await redeem(bound.app, ip, {
                code: bound.code,
                client_id: bound.client.client_id,
                resource: "http://localhost",
            }),
            400,
            "invalid_target",
        );

        const again = await codeFor(
            ip,
            { token_endpoint_auth_method: "none" },
            { app: bound.app, store: bound.store },
            { resource: RESOURCE },
        );
        // Same resource, normalized (trailing slash) — accepted.
        expect(
            (
                await redeem(again.app, ip, {
                    code: again.code,
                    client_id: again.client.client_id,
                    resource: `${RESOURCE}/`,
                })
            ).status,
        ).toBe(200);
    });

    test("a foreign resource is invalid_target; omitting it is fine", async () => {
        const ip = "198.51.100.118";
        const first = await codeFor(ip, { token_endpoint_auth_method: "none" });
        await expectError(
            await redeem(first.app, ip, {
                code: first.code,
                client_id: first.client.client_id,
                resource: "https://evil.example/mcp",
            }),
            400,
            "invalid_target",
        );
        const second = await codeFor(
            ip,
            { token_endpoint_auth_method: "none" },
            { app: first.app, store: first.store },
        );
        expect(
            (
                await redeem(second.app, ip, {
                    code: second.code,
                    client_id: second.client.client_id,
                })
            ).status,
        ).toBe(200);
    });

    test("a missing or unknown grant_type is rejected", async () => {
        _resetBuckets();
        const { app } = buildTestApp();
        const ip = "198.51.100.119";
        await expectError(
            await postForm(app, "/token", ip, {}),
            400,
            "invalid_request",
        );
        await expectError(
            await postForm(app, "/token", ip, { grant_type: "password" }),
            400,
            "unsupported_grant_type",
        );
    });

    // ----- refresh_token -----

    async function tokensFor(
        ip: string,
        meta: Record<string, unknown>,
        shared?: { app: Hono; store: FakeStore },
    ) {
        const got = await codeFor(ip, meta, shared);
        const res = await redeem(got.app, ip, {
            code: got.code,
            client_id: got.client.client_id,
            ...(got.client.client_secret
                ? { client_secret: got.client.client_secret }
                : {}),
        });
        expect(res.status).toBe(200);
        const pair = (await res.json()) as { refresh_token: string };
        return { ...got, refreshToken: pair.refresh_token };
    }

    function refresh(
        app: Hono,
        ip: string,
        fields: Record<string, string>,
        headers: Record<string, string> = {},
    ) {
        return postForm(
            app,
            "/token",
            ip,
            { grant_type: "refresh_token", ...fields },
            headers,
        );
    }

    test("a refresh token from client A presented by client B is invalid_grant", async () => {
        const ip = "198.51.100.120";
        const a = await tokensFor(ip, { token_endpoint_auth_method: "none" });
        const b = await registerClient(a.app, ip, {
            token_endpoint_auth_method: "none",
        });
        await expectError(
            await refresh(a.app, ip, {
                refresh_token: a.refreshToken,
                client_id: b.client_id,
            }),
            400,
            "invalid_grant",
        );
        // Nor with no client at all.
        const again = await tokensFor(
            ip,
            { token_endpoint_auth_method: "none" },
            { app: a.app, store: a.store },
        );
        await expectError(
            await refresh(a.app, ip, { refresh_token: again.refreshToken }),
            400,
            "invalid_grant",
        );
    });

    // Written before refresh_tokens.client_id existed: accepted from anyone,
    // including a caller that sends no client credentials, so nobody already
    // connected is logged out.
    test("a null-client refresh token is accepted from any client", async () => {
        const ip = "198.51.100.121";
        _resetBuckets();
        const { app, store } = buildTestApp();
        // UUIDs, as every pre-binding token was, stored under their hash as
        // the backfill left them.
        const OLD = "3b241101-e2bb-4255-8caf-4136c566a962";
        const OLD_2 = "3b241101-e2bb-4255-8caf-4136c566a963";
        store
            .dump()
            .refresh.set(hashSecret(OLD), { userId: "user-9", clientId: null });
        store.dump().refresh.set(hashSecret(OLD_2), {
            userId: "user-9",
            clientId: null,
        });
        const client = await registerClient(app, ip, {
            token_endpoint_auth_method: "none",
        });

        const anonymous = await refresh(app, ip, {
            refresh_token: OLD,
        });
        expect(anonymous.status).toBe(200);
        const anon = (await anonymous.json()) as { refresh_token: string };
        // Still unbound: nobody identified themselves.
        expect(
            store.dump().refresh.get(hashSecret(anon.refresh_token))?.clientId,
        ).toBe(null);

        const named = await refresh(app, ip, {
            refresh_token: OLD_2,
            client_id: client.client_id,
        });
        expect(named.status).toBe(200);
        const next = (await named.json()) as { refresh_token: string };
        // The rotated token picks up the client that refreshed it.
        expect(
            store.dump().refresh.get(hashSecret(next.refresh_token)),
        ).toEqual({
            userId: "user-9",
            clientId: client.client_id,
            ttlSeconds: REFRESH_TOKEN_TTL_SECONDS,
        });
    });

    test("a confidential client must authenticate to refresh", async () => {
        const ip = "198.51.100.122";
        const got = await tokensFor(ip, {});
        await expectError(
            await refresh(got.app, ip, {
                refresh_token: got.refreshToken,
                client_id: got.client.client_id,
            }),
            401,
            "invalid_client",
        );
        // The failed authentication didn't burn the token.
        const ok = await refresh(
            got.app,
            ip,
            { refresh_token: got.refreshToken },
            {
                authorization: basic(
                    got.client.client_id,
                    got.client.client_secret!,
                ),
            },
        );
        expect(ok.status).toBe(200);
        const body = (await ok.json()) as { refresh_token: string };
        expect(body.refresh_token).not.toBe(got.refreshToken);
    });

    test("refresh errors: missing token is invalid_request, unknown is invalid_grant", async () => {
        _resetBuckets();
        const { app } = buildTestApp();
        const ip = "198.51.100.123";
        await expectError(await refresh(app, ip, {}), 400, "invalid_request");
        await expectError(
            await refresh(app, ip, { refresh_token: "nope" }),
            400,
            "invalid_grant",
        );
    });

    // ----- Phase C: hash at rest, lifetimes, the /token log line -----

    test("codes, access tokens and refresh tokens are stored only as their hash", async () => {
        const ip = "198.51.100.130";
        const { app, store, client, code } = await codeFor(ip, {
            token_endpoint_auth_method: "none",
        });
        expect(code).toMatch(/^[A-Za-z0-9_-]{43}$/);
        const codes = store.dump().codes;
        expect(codes.has(code)).toBe(false);
        expect(codes.get(hashSecret(code))?.code).toBe(hashSecret(code));

        const res = await redeem(app, ip, {
            code,
            client_id: client.client_id,
        });
        expect(res.status).toBe(200);
        const pair = (await res.json()) as {
            access_token: string;
            refresh_token: string;
            expires_in: number;
        };
        for (const raw of [pair.access_token, pair.refresh_token]) {
            expect(raw).toMatch(/^[A-Za-z0-9_-]{43}$/);
        }
        const { tokens, refresh } = store.dump();
        expect(tokens.has(pair.access_token)).toBe(false);
        expect(refresh.has(pair.refresh_token)).toBe(false);
        expect(tokens.get(hashSecret(pair.access_token))).toEqual({
            userId: "user-1",
            ttlSeconds: ACCESS_TOKEN_TTL_SECONDS,
        });
        expect(refresh.get(hashSecret(pair.refresh_token))).toEqual({
            userId: "user-1",
            clientId: client.client_id,
            ttlSeconds: REFRESH_TOKEN_TTL_SECONDS,
        });
    });

    test("an access token lasts 24 hours and a refresh token 90 days, renewed on every rotation", async () => {
        expect(ACCESS_TOKEN_TTL_SECONDS).toBe(24 * 60 * 60);
        expect(REFRESH_TOKEN_TTL_SECONDS).toBe(90 * 24 * 60 * 60);
        const ip = "198.51.100.131";
        const got = await tokensFor(ip, { token_endpoint_auth_method: "none" });
        const res = await refresh(got.app, ip, {
            refresh_token: got.refreshToken,
            client_id: got.client.client_id,
        });
        expect(res.status).toBe(200);
        const next = (await res.json()) as {
            access_token: string;
            refresh_token: string;
            expires_in: number;
        };
        expect(next.expires_in).toBe(ACCESS_TOKEN_TTL_SECONDS);
        const { tokens, refresh: refreshRows } = got.store.dump();
        expect(tokens.get(hashSecret(next.access_token))?.ttlSeconds).toBe(
            ACCESS_TOKEN_TTL_SECONDS,
        );
        // Sliding: the rotated token gets a fresh 90 days of its own.
        expect(
            refreshRows.get(hashSecret(next.refresh_token))?.ttlSeconds,
        ).toBe(REFRESH_TOKEN_TTL_SECONDS);
    });

    // Every row has been in hash form since the backfill, so a value stored
    // raw is not a token any more: nothing looks it up in that form.
    test("an auth code stored raw no longer redeems", async () => {
        const ip = "198.51.100.132";
        const { app, store, client, code } = await codeFor(ip, {
            token_endpoint_auth_method: "none",
        });
        const codes = store.dump().codes;
        const row = codes.get(hashSecret(code))!;
        codes.delete(hashSecret(code));
        const raw = "9b2e5c1a-7d4f-4e3a-8c6b-1f0a2d3e4b5c";
        codes.set(raw, { ...row, code: raw });

        await expectError(
            await redeem(app, ip, { code: raw, client_id: client.client_id }),
            400,
            "invalid_grant",
        );
    });

    test("a refresh token stored raw no longer refreshes", async () => {
        const ip = "198.51.100.133";
        _resetBuckets();
        const { app, store } = buildTestApp();
        const client = await registerClient(app, ip, {
            token_endpoint_auth_method: "none",
        });
        const raw = "c7d1f3a2-5b6e-4f8a-9d0c-2e4f6a8b0c1d";
        store.dump().refresh.set(raw, {
            userId: "user-7",
            clientId: client.client_id,
        });
        await expectError(
            await refresh(app, ip, {
                refresh_token: raw,
                client_id: client.client_id,
            }),
            400,
            "invalid_grant",
        );
        expect(store.dump().refresh.has(raw)).toBe(true);
    });

    // What storing hashes protects against: a leaked row must not be usable.
    test("presenting a stored hash is invalid_grant, for a code and a refresh token", async () => {
        const ip = "198.51.100.134";
        const got = await tokensFor(ip, { token_endpoint_auth_method: "none" });
        await expectError(
            await refresh(got.app, ip, {
                refresh_token: hashSecret(got.refreshToken),
                client_id: got.client.client_id,
            }),
            400,
            "invalid_grant",
        );
        const again = await codeFor(
            ip,
            { token_endpoint_auth_method: "none" },
            { app: got.app, store: got.store },
        );
        await expectError(
            await redeem(got.app, ip, {
                code: hashSecret(again.code),
                client_id: again.client.client_id,
            }),
            400,
            "invalid_grant",
        );
    });

    // Every console line containing "[oauth] token grant=" that fn produced.
    async function tokenLogLines(fn: () => unknown) {
        const log = spyOn(console, "log").mockImplementation(() => {});
        const warn = spyOn(console, "warn").mockImplementation(() => {});
        try {
            await fn();
            return [...log.mock.calls, ...warn.mock.calls]
                .map((args) => args.map(String).join(" "))
                .filter((line) => line.includes("[oauth] token grant="));
        } finally {
            log.mockRestore();
            warn.mockRestore();
        }
    }

    test("every /token call logs exactly one line, never a token, code, secret or user id", async () => {
        const ip = "198.51.100.135";
        const pub = await codeFor(ip, { token_endpoint_auth_method: "none" });
        const { app, store } = pub;
        const conf = await codeFor(ip, {}, { app, store });
        const id = pub.client.client_id;

        let pair = { access_token: "", refresh_token: "" };
        const cases: [string, () => Response | Promise<Response>][] = [
            [
                `[oauth] token grant=authorization_code result=ok client=${id}`,
                async () => {
                    const res = await redeem(app, ip, {
                        code: pub.code,
                        client_id: id,
                    });
                    pair = (await res.clone().json()) as typeof pair;
                    return res;
                },
            ],
            [
                `[oauth] token grant=authorization_code result=invalid_grant client=${id}`,
                () => redeem(app, ip, { code: pub.code, client_id: id }),
            ],
            [
                `[oauth] token grant=refresh_token result=ok client=${id}`,
                () =>
                    refresh(app, ip, {
                        refresh_token: pair.refresh_token,
                        client_id: id,
                    }),
            ],
            [
                `[oauth] token grant=authorization_code result=invalid_client client=${conf.client.client_id}`,
                () =>
                    redeem(app, ip, {
                        code: conf.code,
                        client_id: conf.client.client_id,
                        client_secret: "wrong",
                    }),
            ],
            [
                `[oauth] token grant=authorization_code result=invalid_grant client=${conf.client.client_id} reason=pkce_failed`,
                () =>
                    redeem(app, ip, {
                        code: conf.code,
                        client_id: conf.client.client_id,
                        client_secret: conf.client.client_secret!,
                        code_verifier: "x".repeat(43),
                    }),
            ],
            [
                "[oauth] token grant=missing result=invalid_request client=none",
                () => postForm(app, "/token", ip, {}),
            ],
            [
                // The caller's own grant_type text is never echoed.
                "[oauth] token grant=unsupported result=unsupported_grant_type client=none",
                () =>
                    postForm(app, "/token", ip, { grant_type: "pass word\n" }),
            ],
        ];
        const logged: string[] = [];
        for (const [expected, call] of cases) {
            const lines = await tokenLogLines(call);
            expect(lines).toEqual([expected]);
            logged.push(...lines);
        }

        const secrets = [
            pub.code,
            conf.code,
            pair.access_token,
            pair.refresh_token,
            conf.client.client_secret!,
            "user-1",
        ];
        expect(pair.refresh_token).toBeTruthy();
        for (const line of logged) {
            for (const secret of secrets) expect(line).not.toContain(secret);
        }
    });

    test("a /token call that throws still logs one line, as server_error", async () => {
        _resetBuckets();
        const store = fakeStore();
        store.storeToken = async () => {
            throw new Error("database down");
        };
        const { app } = buildTestApp({ store });
        const ip = "198.51.100.136";
        const got = await codeFor(
            ip,
            { token_endpoint_auth_method: "none" },
            { app, store },
        );
        const lines = await tokenLogLines(async () => {
            const res = await redeem(app, ip, {
                code: got.code,
                client_id: got.client.client_id,
            });
            expect(res.status).toBe(500);
        });
        expect(lines).toEqual([
            `[oauth] token grant=authorization_code result=server_error client=${got.client.client_id}`,
        ]);
    });

    test("a rate-limited /token answer is not cacheable either", async () => {
        _resetBuckets();
        const { app } = buildTestApp();
        const ip = "198.51.100.124";
        let res: Response;
        do {
            res = await postForm(app, "/token", ip, {});
        } while (res.status !== 429);
        expect(res.headers.get("Cache-Control")).toBe("no-store");
        expect(res.headers.get("Pragma")).toBe("no-cache");
        // The limiter answered before the handler ran, so the grant was never
        // read — but the call still logs its one line.
        expect(
            await tokenLogLines(() => postForm(app, "/token", ip, {})),
        ).toEqual([
            "[oauth] token grant=unknown result=rate_limited client=none",
        ]);
    });
});

// ---------- OAuth rate-limit scoping ----------

// The HTTP method each OAuth path is registered with, so the table-driven test
// drives the route the router actually serves rather than a 404.
const OAUTH_METHODS: Record<(typeof OAUTH_PATHS)[number], string> = {
    "/register": "POST",
    "/authorize": "GET",
    "/approve": "POST",
    "/authorize/google": "POST",
    "/auth/google/callback": "GET",
    "/token": "POST",
};

// The bug this guards: `oauth.use("*", rateLimitAuth)` inside the router. Hono
// applies a sub-app's wildcard middleware to every path of the parent app, so
// the 30/min per-IP OAuth limiter also governed /mcp — capping all authenticated
// MCP traffic behind a shared egress IP well below the intended 60/min per-user
// limit. A structural assertion on OAUTH_PATHS would not have caught this;
// only actually driving /mcp past the auth limit does.
test("the OAuth rate limiter does not leak onto /mcp", async () => {
    _resetBuckets();
    const { app, mcpHits } = buildTestApp();

    // Read the per-IP auth limit off a real OAuth response instead of hardcoding
    // it, so this stays correct if the limit is retuned.
    const probe = await fire(app, "GET", "/authorize", "203.0.113.9");
    const authLimit = Number(probe.headers.get("X-RateLimit-Limit"));
    expect(authLimit).toBeGreaterThan(0);
    _resetBuckets();

    const total = authLimit * 3;
    for (let i = 0; i < total; i++) {
        const res = await fire(app, "POST", "/mcp", "198.51.100.7");
        expect(res.status).not.toBe(429);
        // rateLimitAuth always stamps these; their absence proves it never ran.
        expect(res.headers.get("X-RateLimit-Limit")).toBeNull();
    }
    // Every request reached the handler — none were short-circuited.
    expect(mcpHits()).toBe(total);
});

// Table-driven so a route added to the router but left out of OAUTH_PATHS fails
// here: dropping the limiter from an unauthenticated endpoint is a security
// regression, and it is the main risk of scoping the middleware by path.
test("every OAuth endpoint is still rate-limited", async () => {
    for (const [i, path] of OAUTH_PATHS.entries()) {
        _resetBuckets();
        const { app } = buildTestApp();
        const method = OAUTH_METHODS[path]!;
        // Distinct IP per path so the buckets can't bleed into each other.
        const ip = `192.0.2.${i + 1}`;

        let limit = 0;
        let saw429 = false;
        for (let n = 0; n <= 200; n++) {
            const res = await fire(app, method, path, ip);
            if (n === 0) {
                limit = Number(res.headers.get("X-RateLimit-Limit"));
                expect(limit).toBeGreaterThan(0);
            }
            if (n < limit) {
                // Within the window: whatever the handler does, it isn't a 429.
                expect(res.status).not.toBe(429);
                continue;
            }
            expect(res.status).toBe(429);
            expect(res.headers.get("Retry-After")).toBeTruthy();
            saw429 = true;
            break;
        }
        expect(saw429).toBe(true);
    }
});

// OAUTH_PATHS is now the list the limiter is attached to, so it must stay in
// sync with the routes the router registers, including their methods.
test("OAUTH_PATHS covers exactly the router's registered routes", () => {
    const registered = new Set(
        createOAuthRouter({ store: fakeStore(), auth: fakeAuth })
            .routes.filter((r) => r.method !== "ALL")
            .map((r) => r.path),
    );
    expect([...registered].sort()).toEqual([...OAUTH_PATHS].sort());
    expect(Object.keys(OAUTH_METHODS).sort()).toEqual([...OAUTH_PATHS].sort());
});
