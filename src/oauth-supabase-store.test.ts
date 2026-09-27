import { test, expect, describe, beforeAll, afterAll, spyOn } from "bun:test";
import {
    consumeAuthCode,
    consumeRefreshToken,
    getUserIdByToken,
    storeAuthCode,
    storeRefreshToken,
    storeToken,
} from "./supabase.js";
import { hashSecret, newOpaqueToken } from "./token-hash.js";

// The hash-at-rest contract of the REAL src/supabase.ts token functions.
// src/oauth.test.ts drives the router against an in-memory fake store that
// re-implements the same contract, so its hashing assertions prove nothing
// about what production writes or looks up — a supabase.ts that stored raw
// tokens, or looked them up with .eq(raw), would pass there and log every
// newly issued token out here.
//
// No mock.module (it is process-wide; see CLAUDE.md): these call the real
// functions and stub global fetch, which supabase-js resolves at call time,
// with a tiny PostgREST stand-in holding rows in memory. Nothing reaches the
// network or a database.

type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {
    oauth_tokens: [],
    refresh_tokens: [],
    auth_codes: [],
};
const requests: { method: string; table: string; url: URL; body: unknown }[] =
    [];

// Parses an `eq.<value>` filter.
function eqValue(filter: string | null): string | null {
    const m = filter?.match(/^eq\.(.*)$/);
    return m ? m[1]! : null;
}

function matching(table: string, url: URL): Row[] {
    const column = table === "auth_codes" ? "code" : "token";
    const value = eqValue(url.searchParams.get(column));
    if (value === null) throw new Error(`expected an eq. filter on ${column}`);
    return tables[table]!.filter((r) => r[column] === value);
}

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
    const json = (rows: Row[]) =>
        new Response(JSON.stringify(rows), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    switch (req.method) {
        case "POST":
            tables[table]!.push(...(Array.isArray(body) ? body : [body]));
            return new Response(null, { status: 201 });
        case "GET":
            return json(matching(table, url));
        case "DELETE": {
            const gone = matching(table, url);
            tables[table] = tables[table]!.filter((r) => !gone.includes(r));
            return json(gone);
        }
        default:
            throw new Error(`unexpected ${req.method}`);
    }
}

const FUTURE = "2999-01-01T00:00:00.000Z";
const USER = "11111111-1111-4111-8111-111111111111";
const envBefore = {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SECRET_KEY,
};
let fetchSpy: ReturnType<typeof spyOn>;

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

describe("access tokens", () => {
    test("are written as hashSecret(raw) and found again by the raw value", async () => {
        const raw = newOpaqueToken();
        await storeToken(raw, USER, 3600);
        const stored = tables.oauth_tokens!.at(-1)!;
        expect(stored.token).toBe(hashSecret(raw));
        expect(JSON.stringify(tables.oauth_tokens)).not.toContain(raw);

        expect(await getUserIdByToken(raw)).toEqual({
            status: "valid",
            userId: USER,
        });
        // Looked up by its hash alone.
        const lookup = requests.at(-1)!;
        expect(eqValue(lookup.url.searchParams.get("token"))).toBe(
            hashSecret(raw),
        );
    });

    // Every row has been in hash form since the backfill; a raw row is not
    // looked up at all.
    test("a row stored as a raw UUID no longer resolves", async () => {
        const raw = crypto.randomUUID();
        tables.oauth_tokens!.push({
            token: raw,
            user_id: USER,
            expires_at: FUTURE,
        });
        expect(await getUserIdByToken(raw)).toEqual({ status: "invalid" });
    });

    test("a stored hash presented as the token does not match its own row", async () => {
        const raw = newOpaqueToken();
        await storeToken(raw, USER, 3600);
        expect(await getUserIdByToken(hashSecret(raw))).toEqual({
            status: "invalid",
        });
    });
});

describe("refresh tokens", () => {
    test("are written hashed and consumed once by the raw value", async () => {
        const raw = newOpaqueToken();
        await storeRefreshToken(raw, USER, "client-1", 90 * 86400);
        expect(tables.refresh_tokens!.at(-1)!.token).toBe(hashSecret(raw));

        expect(await consumeRefreshToken(raw)).toEqual({
            userId: USER,
            clientId: "client-1",
        });
        expect(requests.at(-1)!.method).toBe("DELETE");
        expect(await consumeRefreshToken(raw)).toBeNull();
    });

    test("a row stored as a raw UUID is no longer consumed", async () => {
        const raw = crypto.randomUUID();
        tables.refresh_tokens!.push({
            token: raw,
            user_id: USER,
            client_id: null,
            expires_at: FUTURE,
        });
        expect(await consumeRefreshToken(raw)).toBeNull();
        expect(tables.refresh_tokens!.some((r) => r.token === raw)).toBe(true);
    });
});

describe("auth codes", () => {
    test("are written hashed and consumed once by the raw value", async () => {
        const raw = newOpaqueToken();
        await storeAuthCode({
            code: raw,
            redirectUri: "https://claude.ai/cb",
            userId: USER,
            codeChallenge: "c".repeat(43),
            clientId: "client-1",
            resource: null,
        });
        expect(tables.auth_codes!.at(-1)!.code).toBe(hashSecret(raw));

        const row = await consumeAuthCode(raw);
        expect(row?.user_id).toBe(USER);
        expect(row?.code).toBe(hashSecret(raw));
        expect(await consumeAuthCode(raw)).toBeNull();
    });

    test("a code stored as a raw UUID is no longer consumed", async () => {
        const raw = crypto.randomUUID();
        tables.auth_codes!.push({
            code: raw,
            redirect_uri: "https://claude.ai/cb",
            user_id: USER,
            code_challenge: null,
            client_id: null,
            resource: null,
            expires_at: FUTURE,
        });
        expect(await consumeAuthCode(raw)).toBeNull();
    });
});
