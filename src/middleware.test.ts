import {
    test,
    expect,
    mock,
    beforeEach,
    afterEach,
    afterAll,
    spyOn,
} from "bun:test";
import { Hono } from "hono";
import * as actualSupabase from "./supabase.js";

// middleware.ts only reaches Supabase to resolve a bearer token, so stubbing
// that one export is enough to exercise the whole auth path offline. Counting
// the calls also lets us prove a banned IP is shed *before* any token lookup.
//
// mock.module swaps the module for the whole test *process*, not just this
// file, so the real exports must be spread back in — replacing the module
// wholesale breaks every other suite that imports getSupabase/signInUser — and
// restored afterwards so no later file sees the stub.
let tokenLookups = 0;
let supabaseAvailable = true;
mock.module("./supabase.js", () => ({
    ...actualSupabase,
    getUserIdByToken: async (token: string) => {
        tokenLookups++;
        if (!supabaseAvailable) return { status: "unavailable" };
        return token === "valid-token"
            ? { status: "valid", userId: "user-1" }
            : { status: "invalid" };
    },
}));
afterAll(() => {
    mock.module("./supabase.js", () => actualSupabase);
});

const { authenticateBearer, banRepeatAuthFailures, rateLimit } =
    await import("./middleware.js");
const { _resetBuckets } = await import("./rate-limit.js");

// Mirrors the /mcp wiring in index.ts: the ban guard runs ahead of the bearer
// check, and the outermost access log honours the suppression flag. Replicated
// rather than importing index.ts, which boots a server and warms widgets on
// import; the ordering asserted here is the thing that matters.
function buildApp() {
    const app = new Hono();
    const logs: string[] = [];
    app.use("*", async (c, next) => {
        await next();
        if (c.get("suppressAccessLog")) return;
        logs.push(`[req] ${c.req.method} ${c.req.path} ${c.res.status}`);
    });
    app.all("/mcp", banRepeatAuthFailures, authenticateBearer, rateLimit, (c) =>
        c.json({ ok: true }),
    );
    return { app, logs };
}

const from = (ip: string, token?: string) =>
    new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
            "x-forwarded-for": ip,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

beforeEach(() => {
    _resetBuckets();
    tokenLookups = 0;
    supabaseAvailable = true;
});
afterEach(() => _resetBuckets());

test("unauthenticated /mcp is shed with 429 after the strike threshold", async () => {
    const { app } = buildApp();

    // The 20th failure trips the ban, but that request is already past the
    // guard, so it still answers 401. Only the next one is shed.
    for (let i = 0; i < 20; i++) {
        expect((await app.fetch(from("1.2.3.4"))).status).toBe(401);
    }

    const shed = await app.fetch(from("1.2.3.4"));
    expect(shed.status).toBe(429);
    expect(Number(shed.headers.get("Retry-After"))).toBeGreaterThan(0);
});

test("shed requests are kept out of the access log", async () => {
    const { app, logs } = buildApp();
    for (let i = 0; i < 20; i++) await app.fetch(from("5.6.7.8"));
    const beforeShedding = logs.length;

    for (let i = 0; i < 50; i++) await app.fetch(from("5.6.7.8"));

    // All 20 pre-ban 401s are logged; none of the 50 shed requests are. This is
    // the whole point of the change — one stuck client must not drown the log.
    expect(beforeShedding).toBe(20);
    expect(logs.length).toBe(20);
});

test("a newly tripped ban is announced exactly once", async () => {
    const { app } = buildApp();
    const logSpy = spyOn(console, "log").mockImplementation(() => {});
    try {
        for (let i = 0; i < 60; i++) await app.fetch(from("9.9.9.9"));
        const banLines = logSpy.mock.calls
            .map((args) => String(args[0]))
            .filter((line) => line.startsWith("[ban]"));
        expect(banLines).toHaveLength(1);
        // Masked to the same subnet granularity as the [req] access log.
        expect(banLines[0]).toContain("9.9.9.x");
    } finally {
        logSpy.mockRestore();
    }
});

test("a banned IP is shed without a token lookup", async () => {
    const { app } = buildApp();
    for (let i = 0; i < 20; i++) await app.fetch(from("4.4.4.4", "bad-token"));
    const lookupsBeforeBan = tokenLookups;

    for (let i = 0; i < 25; i++) await app.fetch(from("4.4.4.4", "bad-token"));

    // Shedding happens ahead of authenticateBearer, so the Supabase round trip
    // the ban is meant to save is genuinely never made.
    expect(lookupsBeforeBan).toBe(20);
    expect(tokenLookups).toBe(20);
});

test("a success resets strikes, so a shared IP is never banned", async () => {
    const { app } = buildApp();

    // The NAT case end-to-end: one broken client failing repeatedly alongside a
    // working one. Total failures far exceed the threshold, but never 20 in a
    // row, so the healthy users behind that egress IP keep working.
    for (let round = 0; round < 5; round++) {
        for (let i = 0; i < 19; i++) {
            expect((await app.fetch(from("7.7.7.7"))).status).toBe(401);
        }
        expect((await app.fetch(from("7.7.7.7", "valid-token"))).status).toBe(
            200,
        );
    }

    expect((await app.fetch(from("7.7.7.7"))).status).toBe(401);
});

test("a token lookup outage never bans anyone", async () => {
    const { app } = buildApp();
    supabaseAvailable = false;

    // Every token looks unverifiable while the database is down. If those
    // counted as strikes, the outage would ban the entire active user base and
    // keep them shed for 5-60 minutes after recovery.
    for (let i = 0; i < 100; i++) {
        expect((await app.fetch(from("3.3.3.3", "valid-token"))).status).toBe(
            401,
        );
    }

    supabaseAvailable = true;
    expect((await app.fetch(from("3.3.3.3", "valid-token"))).status).toBe(200);
});

test("bans are per-IP and do not affect other clients", async () => {
    const { app } = buildApp();
    for (let i = 0; i < 21; i++) await app.fetch(from("8.8.8.8"));

    expect((await app.fetch(from("8.8.8.8"))).status).toBe(429);
    expect((await app.fetch(from("8.8.4.4"))).status).toBe(401);
    expect((await app.fetch(from("8.8.4.4", "valid-token"))).status).toBe(200);
});
