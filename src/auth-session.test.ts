import { test, expect, beforeAll, afterAll, afterEach, spyOn } from "bun:test";
import { signInUser, signInWithGoogleIdToken, signUpUser } from "./supabase.js";

// Supabase Auth only verifies the credential; every sign-in still makes
// GoTrue create a session nothing uses, so supabase.ts ends it at once. The
// privacy policy says so. These call the real functions against a stubbed
// global fetch (no mock.module — it is process-wide; see CLAUDE.md), with a
// tiny GoTrue stand-in. Nothing reaches the network.

const USER_ID = "3f0c9a52-6c1e-4d0a-9b1f-2a7d8e5c4b10";
let logoutStatus = 204;
let signupReturnsSession = true;
const calls: { path: string; search: string; auth: string | null }[] = [];

function session(accessToken: string) {
    return {
        access_token: accessToken,
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: "supabase-refresh",
        user: { id: USER_ID, aud: "authenticated", email: "a@example.com" },
    };
}

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
    });

async function fakeGoTrue(
    input: string | URL | Request,
    init?: RequestInit,
): Promise<Response> {
    const req =
        input instanceof Request
            ? new Request(input, init)
            : new Request(input.toString(), init);
    const url = new URL(req.url);
    calls.push({
        path: url.pathname,
        search: url.search,
        auth: req.headers.get("authorization"),
    });
    switch (url.pathname) {
        case "/auth/v1/token":
            return json(
                session(`access-${url.searchParams.get("grant_type")}`),
            );
        case "/auth/v1/signup":
            return signupReturnsSession
                ? json(session("access-signup"))
                : json({ id: USER_ID, aud: "authenticated" });
        case "/auth/v1/logout":
            return logoutStatus === 204
                ? new Response(null, { status: 204 })
                : json({ msg: "boom" }, logoutStatus);
        default:
            throw new Error(`unexpected request ${req.method} ${req.url}`);
    }
}

const envBefore = {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SECRET_KEY,
};
let fetchSpy: ReturnType<typeof spyOn>;

beforeAll(() => {
    process.env.SUPABASE_URL ??= "http://supabase.test";
    process.env.SUPABASE_SECRET_KEY ??= "test-key";
    fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
        fakeGoTrue as typeof fetch,
    );
});

afterAll(() => {
    fetchSpy.mockRestore();
    if (envBefore.url === undefined) delete process.env.SUPABASE_URL;
    if (envBefore.key === undefined) delete process.env.SUPABASE_SECRET_KEY;
});

afterEach(() => {
    calls.length = 0;
    logoutStatus = 204;
    signupReturnsSession = true;
});

// The revoke is fire-and-forget, so wait for it to be sent.
async function logoutCalls() {
    for (let i = 0; i < 50; i++) {
        const found = calls.filter((c) => c.path === "/auth/v1/logout");
        if (found.length) return found;
        await Bun.sleep(2);
    }
    return [];
}

test.each([
    ["password", () => signInUser("a@example.com", "pw"), "access-password"],
    [
        "Google",
        () => signInWithGoogleIdToken("google-id-token", "nonce"),
        "access-id_token",
    ],
    ["sign-up", () => signUpUser("a@example.com", "pw"), "access-signup"],
] as const)(
    "a %s sign-in ends its own Supabase session",
    async (_name, run, token) => {
        expect(await run()).toBe(USER_ID);
        const logout = await logoutCalls();
        expect(logout).toHaveLength(1);
        // "local": this session only, by its own access token.
        expect(logout[0]!.search).toBe("?scope=local");
        expect(logout[0]!.auth).toBe(`Bearer ${token}`);
    },
);

test("a failed revoke neither fails the sign-in nor logs the user", async () => {
    logoutStatus = 500;
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    try {
        expect(await signInUser("a@example.com", "pw")).toBe(USER_ID);
        await logoutCalls();
        for (let i = 0; i < 50 && warn.mock.calls.length === 0; i++)
            await Bun.sleep(2);
        const lines = warn.mock.calls.map((c) => c.join(" "));
        expect(lines).toEqual(["[auth] session-revoke-failed status=500"]);
    } finally {
        warn.mockRestore();
    }
});

test("a sign-up that returns no session sends no logout", async () => {
    signupReturnsSession = false;
    expect(await signUpUser("a@example.com", "pw")).toBe(USER_ID);
    await Bun.sleep(20);
    expect(calls.filter((c) => c.path === "/auth/v1/logout")).toEqual([]);
});
