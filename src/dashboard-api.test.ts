import {
    test,
    expect,
    describe,
    beforeEach,
    afterEach,
    afterAll,
    beforeAll,
    spyOn,
} from "bun:test";
import type { MiddlewareHandler } from "hono";
import {
    CALENDAR_MAX_DAYS,
    DASHBOARD_REGISTRATION,
    DASHBOARD_TOOLS,
    DASHBOARD_WIDGETS,
    SEARCH_MEAL_LIMIT,
    WIDGET_CSP,
    buildCalendarDays,
    buildMeasurementSites,
    createDashboardApiRouter,
    createDashboardWidgetRoute,
    createDashboardToolRunner,
    runDashboardTool,
    type DashboardApiDeps,
    type DashboardReaders,
    type ToolRunResult,
} from "./dashboard-api.js";
import {
    DASHBOARD_ERROR_META_KEY,
    withAnalytics,
    type AnalyticsRecord,
} from "./analytics.js";
import { ToolError } from "./errors.js";
import { buildMcpServer } from "./mcp.js";
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import type {
    BodyMeasurementEntry,
    Meal,
    Profile,
    SavedMealWithItems,
} from "./supabase.js";

// No mock.module (process-wide; see CLAUDE.md): the router takes its session,
// readers, tool runner, limiter and clock as deps, and the one end-to-end test
// of the real in-process tool path stubs global fetch, which supabase-js
// resolves per call.

const USER = "11111111-1111-4111-8111-111111111111";
const NOW = new Date("2026-11-07T10:00:00Z");

const fakeSession =
    (userId: string | null): MiddlewareHandler =>
    async (c, next) => {
        if (userId === null)
            return c.json(
                {
                    ok: false,
                    error: "unauthenticated",
                    message: "Sign in again.",
                },
                401,
            );
        c.set("dashboardUserId", userId);
        await next();
    };

const profile = (over: Partial<Profile> = {}): Profile => ({
    user_id: USER,
    timezone: "Europe/Kyiv",
    preferred_weight_unit: "kg",
    preferred_length_unit: "cm",
    widgets_enabled: true,
    alcohol_tracking_enabled: false,
    preferred_drink_unit: null,
    activity_credit_pct: null,
    locale: "de",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...over,
});

const meal = (over: Partial<Meal>): Meal => ({
    id: crypto.randomUUID(),
    user_id: USER,
    logged_at: "2026-11-05T09:00:00Z",
    meal_type: "breakfast",
    description: "Oats",
    calories: 400,
    protein_g: 10,
    carbs_g: 60,
    fat_g: 8,
    fiber_g: null,
    sugar_g: null,
    added_sugar_g: null,
    alcohol_g: null,
    caffeine_mg: null,
    notes: null,
    idempotency_key: null,
    saved_meal_id: null,
    ...over,
});

const notCalled = (name: string) => async () => {
    throw new Error(`${name} should not be called`);
};

function emptyReaders(): DashboardReaders {
    return {
        getProfile: async () => profile(),
        getLastLoggedAt: async () => null,
        getMealsInRange: async () => [],
        getWaterInRange: async () => [],
        getNutritionGoals: async () => null,
        getNutritionGoalsHistory: async () => [],
        searchMeals: async () => [],
        searchSavedMeals: async () => ({ saved: [], total: 0 }),
        getMealItems: async () => new Map(),
        getSavedMeals: async () => [],
        getAllBodyMeasurements: async () => [],
    };
}

function app(
    over: Partial<DashboardApiDeps> & { userId?: string | null } = {},
) {
    const { userId = USER, ...deps } = over;
    return createDashboardApiRouter({
        session: fakeSession(userId),
        readers: emptyReaders(),
        runTool: notCalled("runTool"),
        rateLimit: () => ({ allowed: true, remaining: 100, limit: 120 }),
        now: () => NOW,
        ...deps,
    });
}

let logs: string[] = [];
let logSpy: ReturnType<typeof spyOn>;
let warnSpy: ReturnType<typeof spyOn>;
beforeEach(() => {
    logs = [];
    logSpy = spyOn(console, "log").mockImplementation((...a: unknown[]) => {
        logs.push(a.map(String).join(" "));
    });
    warnSpy = spyOn(console, "warn").mockImplementation((...a: unknown[]) => {
        logs.push(a.map(String).join(" "));
    });
});
afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
});

async function get(router: ReturnType<typeof app>, path: string) {
    const res = await router.request(`http://localhost${path}`);
    return { res, body: (await res.json()) as Record<string, any> };
}

// ---------- envelope and auth ----------

describe("envelope", () => {
    test("a signed-out call is 401 unauthenticated and logs as such", async () => {
        const { res, body } = await get(
            app({ userId: null }),
            "/api/dashboard/status",
        );
        expect(res.status).toBe(401);
        expect(body).toEqual({
            ok: false,
            error: "unauthenticated",
            message: "Sign in again.",
        });
        expect(logs).toEqual([
            "[dashboard] route=status result=unauthenticated",
        ]);
    });

    test("a session-store outage answered by the middleware logs as unavailable", async () => {
        const router = createDashboardApiRouter({
            session: async (c) =>
                c.json({ ok: false, error: "unavailable", message: "x" }, 503),
            readers: emptyReaders(),
            runTool: notCalled("runTool"),
            rateLimit: () => ({ allowed: true, remaining: 100, limit: 120 }),
            now: () => NOW,
        });
        const { res } = await get(router, "/api/dashboard/status");
        expect(res.status).toBe(503);
        expect(logs).toEqual(["[dashboard] route=status result=unavailable"]);
    });

    test("over the per-user limit is 429 rate_limited with Retry-After", async () => {
        const { res, body } = await get(
            app({
                rateLimit: () => ({
                    allowed: false,
                    retryAfterSeconds: 17,
                    remaining: 0,
                    limit: 120,
                }),
            }),
            "/api/dashboard/status",
        );
        expect(res.status).toBe(429);
        expect(res.headers.get("retry-after")).toBe("17");
        expect(body.ok).toBe(false);
        expect(body.error).toBe("rate_limited");
        expect(typeof body.message).toBe("string");
    });

    test("a failed read is 503 unavailable with a ref; the log carries no user id or query", async () => {
        const { res, body } = await get(
            app({
                readers: {
                    ...emptyReaders(),
                    searchMeals: async () => {
                        throw new Error("Failed to search meals: boom");
                    },
                },
            }),
            "/api/dashboard/search?q=secret%20pancakes",
        );
        expect(res.status).toBe(503);
        expect(res.headers.get("cache-control")).toBe("private, no-store");
        expect(body.ok).toBe(false);
        expect(body.error).toBe("unavailable");
        expect(body.ref).toMatch(/^[0-9a-f]{8}$/);
        expect(body.message).toContain(body.ref);
        expect(logs).toHaveLength(1);
        expect(logs[0]).toStartWith(
            `[dashboard] route=search result=unavailable ref=${body.ref}`,
        );
        expect(logs[0]).not.toContain(USER);
        expect(logs[0]).not.toContain("pancakes");
    });

    test("a bug in a handler is 500 server_error with a ref", async () => {
        const { res, body } = await get(
            app({
                readers: {
                    ...emptyReaders(),
                    getSavedMeals: async () =>
                        [{ id: "x" }] as unknown as SavedMealWithItems[],
                },
            }),
            "/api/dashboard/saved-meals",
        );
        expect(res.status).toBe(500);
        expect(body.error).toBe("server_error");
        expect(body.ref).toMatch(/^[0-9a-f]{8}$/);
    });
});

// ---------- tool route ----------

describe("tool route", () => {
    test("refuses every tool outside the allowlist without running anything", async () => {
        for (const name of [
            "log_meal",
            "delete_account",
            "export_all_data",
            "get_meals_today",
            "start_meal_import",
            "nope",
        ]) {
            const { res, body } = await get(
                app(),
                `/api/dashboard/tool/${name}`,
            );
            expect(res.status).toBe(400);
            expect(body.ok).toBe(false);
            expect(body.error).toBe("bad_request");
        }
        // Never a tool name the caller made up in the log.
        expect(logs.join("\n")).not.toContain("nope");
    });

    test("runs an allowlisted tool and returns structuredContent and _meta, never content", async () => {
        const calls: unknown[] = [];
        const { res, body } = await get(
            app({
                runTool: async (userId, name, args) => {
                    calls.push({ userId, name, args });
                    return {
                        content: [{ type: "text", text: "model text" }],
                        structuredContent: { date: "2026-11-07" },
                        _meta: { "nutrition-mcp.com/meal-times": { v: 1 } },
                    };
                },
            }),
            `/api/dashboard/tool/get_goal_progress?args=${encodeURIComponent(JSON.stringify({ date: "2026-11-07" }))}`,
        );
        expect(res.status).toBe(200);
        expect(res.headers.get("cache-control")).toBe("private, no-store");
        expect(body).toEqual({
            ok: true,
            structuredContent: { date: "2026-11-07" },
            _meta: { "nutrition-mcp.com/meal-times": { v: 1 } },
        });
        expect(calls).toEqual([
            {
                userId: USER,
                name: "get_goal_progress",
                args: { date: "2026-11-07" },
            },
        ]);
        expect(logs).toEqual([
            "[dashboard] route=tool result=ok tool=get_goal_progress",
        ]);
    });

    test("every allowlisted tool is accepted", async () => {
        for (const name of DASHBOARD_TOOLS) {
            const { res } = await get(
                app({ runTool: async () => ({ structuredContent: {} }) }),
                `/api/dashboard/tool/${name}`,
            );
            expect(res.status).toBe(200);
        }
    });

    test("args must be a JSON object", async () => {
        for (const args of ["not json", "[1,2]", "null", "3"]) {
            const { res, body } = await get(
                app(),
                `/api/dashboard/tool/get_trends?args=${encodeURIComponent(args)}`,
            );
            expect(res.status).toBe(400);
            expect(body.error).toBe("bad_request");
        }
        const { res } = await get(
            app(),
            `/api/dashboard/tool/get_trends?args=${"x".repeat(2001)}`,
        );
        expect(res.status).toBe(400);
    });

    const errorResult = (
        meta: Record<string, unknown> | null,
        text = "t",
    ): ToolRunResult => ({
        isError: true,
        content: [{ type: "text", text }],
        ...(meta ? { _meta: { [DASHBOARD_ERROR_META_KEY]: meta } } : {}),
    });

    test("a ToolError or a schema refusal is bad_request with the tool's text", async () => {
        for (const r of [
            errorResult(
                {
                    category: "invalid_date_format",
                    ref: "abcd1234",
                    toolError: true,
                },
                'Invalid date "x"',
            ),
            // The SDK's own refusals (McpServer tools/call handler).
            errorResult(
                null,
                "Input validation error: Invalid arguments for tool get_goal_progress: bad date",
            ),
            errorResult(
                null,
                "Invalid arguments for tool get_goal_progress: arguments contain more than the maximum of 1000 elements",
            ),
        ]) {
            const { res, body } = await get(
                app({ runTool: async () => r }),
                "/api/dashboard/tool/get_goal_progress",
            );
            expect(res.status).toBe(400);
            expect(body.error).toBe("bad_request");
            expect(body.message).toBe((r.content![0] as { text: string }).text);
        }
    });

    test("a read failure inside the tool is unavailable, anything else server_error, both under the tool's ref", async () => {
        const unavailable = await get(
            app({
                runTool: async () =>
                    errorResult({
                        category: "supabase_error",
                        ref: "deadbeef",
                        toolError: false,
                    }),
            }),
            "/api/dashboard/tool/get_trends",
        );
        expect(unavailable.res.status).toBe(503);
        expect(unavailable.body).toMatchObject({
            ok: false,
            error: "unavailable",
            ref: "deadbeef",
        });
        const broken = await get(
            app({
                runTool: async () =>
                    errorResult({
                        category: "unknown",
                        ref: "cafebabe",
                        toolError: false,
                    }),
            }),
            "/api/dashboard/tool/get_trends",
        );
        expect(broken.res.status).toBe(500);
        expect(broken.body).toMatchObject({
            ok: false,
            error: "server_error",
            ref: "cafebabe",
        });
        // The model-facing text never reaches the browser.
        expect(broken.body.message).not.toBe("t");
    });

    test("an SDK error after the handler (output schema) is a server_error under a fresh ref, not bad_request", async () => {
        const text =
            "Output validation error: Invalid structured content for tool get_trends: data must NOT have additional properties";
        const { res, body } = await get(
            app({ runTool: async () => errorResult(null, text) }),
            "/api/dashboard/tool/get_trends",
        );
        expect(res.status).toBe(500);
        expect(body.error).toBe("server_error");
        expect(body.ref).toMatch(/^[0-9a-f]{8}$/);
        expect(body.message).not.toContain("Output validation");
        expect(logs).toHaveLength(1);
        expect(logs[0]).toStartWith(
            `[dashboard] route=tool result=server_error tool=get_trends ref=${body.ref}:`,
        );
        expect(logs[0]).toContain("Output validation error");
    });

    test("a profile read failing while the server is built is 503 unavailable", async () => {
        const runTool = createDashboardToolRunner(async () => {
            throw new Error("Failed to get profile: connection refused");
        });
        const { res, body } = await get(
            app({ runTool }),
            "/api/dashboard/tool/get_trends",
        );
        expect(res.status).toBe(503);
        expect(res.headers.get("retry-after")).toBe("30");
        expect(body.error).toBe("unavailable");
        expect(body.ref).toMatch(/^[0-9a-f]{8}$/);
    });
});

// ---------- analytics surface ----------

describe("dashboard surface in withAnalytics", () => {
    test("a successful dashboard call writes no analytics row and no [analytics] line", async () => {
        const rows: AnalyticsRecord[] = [];
        const result = await withAnalytics(
            "get_trends",
            async () => ({ content: [], structuredContent: { a: 1 } }),
            { userId: USER, surface: "dashboard" },
            {},
            { persist: (r) => rows.push(r) },
        );
        expect(result.structuredContent).toEqual({ a: 1 });
        expect(rows).toEqual([]);
        expect(logs).toEqual([]);
    });

    test("a failing dashboard call writes no row, logs no [analytics] line, and carries its category in _meta", async () => {
        const rows: AnalyticsRecord[] = [];
        const result = (await withAnalytics(
            "get_trends",
            async () => {
                throw new Error("Failed to get meals: down");
            },
            { userId: USER, surface: "dashboard" },
            {},
            { persist: (r) => rows.push(r) },
        )) as ToolRunResult;
        expect(rows).toEqual([]);
        expect(logs.some((l) => l.startsWith("[analytics]"))).toBe(false);
        expect(logs).toHaveLength(1);
        expect(logs[0]).toStartWith(
            "[dashboard] tool-error tool=get_trends error=supabase_error ref=",
        );
        expect(logs[0]).not.toContain(USER);
        expect(result.isError).toBe(true);
        const meta = result._meta![DASHBOARD_ERROR_META_KEY] as {
            category: string;
            ref: string;
            toolError: boolean;
        };
        expect(meta.category).toBe("supabase_error");
        expect(meta.toolError).toBe(false);
        expect(logs[0]).toContain(`ref=${meta.ref}`);

        const refused = (await withAnalytics(
            "get_trends",
            async () => {
                throw new ToolError("Invalid date");
            },
            { userId: USER, surface: "dashboard" },
            {},
            { persist: (r) => rows.push(r) },
        )) as ToolRunResult;
        expect(
            (refused._meta![DASHBOARD_ERROR_META_KEY] as { toolError: boolean })
                .toolError,
        ).toBe(true);
        expect(rows).toEqual([]);
    });

    test("control: the same call over /mcp (no surface) does write the row and the line", async () => {
        const rows: AnalyticsRecord[] = [];
        await withAnalytics(
            "get_trends",
            async () => ({ content: [] }),
            { userId: USER },
            {},
            { persist: (r) => rows.push(r) },
        );
        expect(rows).toHaveLength(1);
        expect(logs.some((l) => l.startsWith("[analytics] get_trends"))).toBe(
            true,
        );
    });
});

// ---------- the real in-process tool path ----------

// The whole chain — buildMcpServer with surface "dashboard", the registered
// tool, withAnalytics, a v2 Client over InMemoryTransport — against a
// PostgREST stand-in that answers every read empty. The point is the write
// that must NOT happen: no POST to tool_analytics.
describe("runDashboardTool end to end", () => {
    const requests: { method: string; path: string }[] = [];
    const envBefore = {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_SECRET_KEY,
    };
    let fetchSpy: ReturnType<typeof spyOn>;

    beforeAll(() => {
        process.env.SUPABASE_URL ??= "http://supabase.test";
        process.env.SUPABASE_SECRET_KEY ??= "test-key";
        fetchSpy = spyOn(globalThis, "fetch").mockImplementation((async (
            input: string | URL | Request,
            init?: RequestInit,
        ) => {
            const req =
                input instanceof Request
                    ? new Request(input, init)
                    : new Request(input.toString(), init);
            const url = new URL(req.url);
            requests.push({ method: req.method, path: url.pathname });
            if (req.method === "GET" || req.method === "HEAD") {
                return new Response("[]", {
                    status: 200,
                    headers: {
                        "content-type": "application/json",
                        "content-range": "*/0",
                    },
                });
            }
            return new Response(null, { status: 201 });
        }) as typeof fetch);
    });

    afterAll(() => {
        fetchSpy.mockRestore();
        if (envBefore.url === undefined) delete process.env.SUPABASE_URL;
        if (envBefore.key === undefined) delete process.env.SUPABASE_SECRET_KEY;
    });

    test("get_goal_progress returns its payload and writes no tool_analytics row", async () => {
        const result = await runDashboardTool(
            USER,
            "get_goal_progress",
            {},
            "http://localhost",
        );
        expect(result.isError).toBeFalsy();
        expect(result.structuredContent).toBeDefined();
        // Reads happened (the stand-in was really used) ...
        expect(requests.some((r) => r.path.endsWith("/profiles"))).toBe(true);
        // ... and nothing was written, analytics least of all.
        expect(
            requests.filter((r) => r.path.endsWith("/tool_analytics")),
        ).toEqual([]);
        expect(requests.filter((r) => r.method !== "GET")).toEqual([]);
        expect(logs.some((l) => l.startsWith("[analytics]"))).toBe(false);
    });

    // List a server's tools and resources the way a host would.
    async function listed(server: Awaited<ReturnType<typeof buildMcpServer>>) {
        const [ct, st] = InMemoryTransport.createLinkedPair();
        const client = new Client({ name: "t", version: "1" });
        try {
            await Promise.all([server.connect(st), client.connect(ct)]);
            const { tools } = await client.listTools();
            const { resources } = await client.listResources();
            return { tools, resources };
        } finally {
            await Promise.allSettled([client.close(), server.close()]);
        }
    }

    test("the dashboard server registers exactly the five tools and their widgets", async () => {
        const dash = await listed(
            await buildMcpServer(
                "http://localhost",
                USER,
                undefined,
                "dashboard",
                DASHBOARD_REGISTRATION,
            ),
        );
        expect(dash.tools.map((t) => t.name).sort()).toEqual(
            [...DASHBOARD_TOOLS].sort(),
        );
        expect(dash.resources.map((r) => r.name).sort()).toEqual(
            DASHBOARD_WIDGETS.map((k) => `${k}-widget`).sort(),
        );

        // The same five, advertised byte for byte as /mcp advertises them
        // (schemas, annotations, widget links), and /mcp still has them all.
        const full = await listed(
            await buildMcpServer("http://localhost", USER),
        );
        expect(full.tools.length).toBeGreaterThan(DASHBOARD_TOOLS.length);
        for (const tool of dash.tools) {
            expect(tool).toEqual(full.tools.find((t) => t.name === tool.name)!);
        }
        for (const resource of dash.resources) {
            expect(resource).toEqual(
                full.resources.find((r) => r.uri === resource.uri)!,
            );
        }
    });

    test("one call reads the profile once to build the server, plus the tool's own read", async () => {
        requests.length = 0;
        await runDashboardTool(USER, "get_trends", {}, "http://localhost");
        const profileReads = requests.filter((r) =>
            r.path.endsWith("/profiles"),
        );
        // buildMcpServer's one read for the display preferences, and the
        // handler's own read in its Promise.all — unchanged from /mcp.
        expect(profileReads).toHaveLength(2);
    });

    test("the server is closed after every call, a failing one included", async () => {
        const closes: string[] = [];
        const runTool = createDashboardToolRunner(async (...args) => {
            const server = await buildMcpServer(...args);
            const close = server.close.bind(server);
            server.close = async () => {
                closes.push("server");
                await close();
            };
            return server;
        });
        await runTool(USER, "get_trends", {}, "http://localhost");
        expect(closes).toEqual(["server"]);
        // An argument the input schema refuses: still closed.
        await runTool(
            USER,
            "get_trends",
            { days: "not a number" },
            "http://localhost",
        ).catch(() => undefined);
        expect(closes).toEqual(["server", "server"]);
    });
});

// ---------- plain JSON routes ----------

describe("status", () => {
    test("reports the profile's settings and today in its timezone", async () => {
        const { res, body } = await get(
            app({
                readers: {
                    ...emptyReaders(),
                    getProfile: async () =>
                        profile({ timezone: "Pacific/Auckland" }),
                    getLastLoggedAt: async () => "2026-11-06T20:00:00.000Z",
                },
            }),
            "/api/dashboard/status",
        );
        expect(res.status).toBe(200);
        expect(body).toEqual({
            ok: true,
            timezone: "Pacific/Auckland",
            locale: "de",
            // 10:00Z is 23:00 in Auckland on the same day.
            today: "2026-11-07",
            weightUnit: "kg",
            lengthUnit: "cm",
            lastLoggedAt: "2026-11-06T20:00:00.000Z",
            hasData: true,
        });
    });

    test("an unset profile falls back to UTC, en, kg and no length unit", async () => {
        const { body } = await get(
            app({
                readers: { ...emptyReaders(), getProfile: async () => null },
            }),
            "/api/dashboard/status",
        );
        expect(body).toMatchObject({
            timezone: "UTC",
            locale: "en",
            weightUnit: "kg",
            lengthUnit: null,
            lastLoggedAt: null,
            hasData: false,
        });
    });
});

describe("calendar", () => {
    test("validates from and to", async () => {
        for (const q of [
            "",
            "from=2026-11-01",
            "from=2026-02-30&to=2026-03-01",
            "from=2026-11-07&to=2026-11-01",
            "from=nov&to=2026-11-01",
            `from=2026-01-01&to=2026-02-12`, // 43 days
        ]) {
            const { res, body } = await get(
                app(),
                `/api/dashboard/calendar?${q}`,
            );
            expect(res.status).toBe(400);
            expect(body.error).toBe("bad_request");
        }
        // Exactly the cap is fine.
        const { res } = await get(
            app(),
            "/api/dashboard/calendar?from=2026-01-01&to=2026-02-11",
        );
        expect(res.status).toBe(200);
        expect(CALENDAR_MAX_DAYS).toBe(42);
    });

    test("one entry per day with totals, the day's goal and a band", async () => {
        const { body } = await get(
            app({
                readers: {
                    ...emptyReaders(),
                    getMealsInRange: async () => [
                        // 2026-11-05 in Kyiv: 2 meals, 2000 kcal.
                        meal({
                            logged_at: "2026-11-05T07:00:00Z",
                            calories: 1200,
                        }),
                        meal({
                            logged_at: "2026-11-05T18:00:00Z",
                            calories: 800.4,
                        }),
                        // 23:30Z on the 5th is the 6th in Kyiv.
                        meal({
                            logged_at: "2026-11-05T23:30:00Z",
                            calories: 2600,
                        }),
                        meal({
                            logged_at: "2026-11-07T08:00:00Z",
                            calories: 500,
                        }),
                    ],
                    getWaterInRange: async () => [
                        {
                            id: "w",
                            user_id: USER,
                            amount_ml: 250,
                            logged_at: "2026-11-05T09:00:00Z",
                            notes: null,
                            created_at: "",
                            idempotency_key: null,
                        },
                    ],
                    getNutritionGoals: async () =>
                        ({ daily_calories: 2200 }) as never,
                    // Until the 6th the goal was 2000.
                    getNutritionGoalsHistory: async () =>
                        [
                            {
                                effective_at: "2026-10-01T00:00:00Z",
                                daily_calories: 2000,
                            },
                            {
                                effective_at: "2026-11-06T12:00:00Z",
                                daily_calories: 2200,
                            },
                        ] as never,
                },
            }),
            "/api/dashboard/calendar?from=2026-11-04&to=2026-11-08",
        );
        expect(body.ok).toBe(true);
        expect(body.days).toEqual([
            {
                date: "2026-11-04",
                calories: null,
                goal: 2000,
                mealCount: 0,
                water_ml: 0,
                status: "none",
            },
            {
                date: "2026-11-05",
                calories: 2000,
                goal: 2000,
                mealCount: 2,
                water_ml: 250,
                status: "on",
            },
            {
                date: "2026-11-06",
                calories: 2600,
                goal: 2200,
                mealCount: 1,
                water_ml: 0,
                status: "over",
            },
            {
                date: "2026-11-07",
                calories: 500,
                goal: 2200,
                mealCount: 1,
                water_ml: 0,
                status: "under",
            },
            {
                date: "2026-11-08",
                calories: null,
                goal: 2200,
                mealCount: 0,
                water_ml: 0,
                status: "none",
            },
        ]);
    });

    test("no goal: logged days are not judged", () => {
        const days = buildCalendarDays({
            from: "2026-11-01",
            to: "2026-11-01",
            tz: "UTC",
            today: "2026-11-07",
            meals: [{ logged_at: "2026-11-01T12:00:00Z", calories: 900 }],
            water: [],
            goals: null,
            history: [],
        });
        expect(days[0]).toMatchObject({
            calories: 900,
            goal: null,
            status: "none",
        });
    });
});

describe("search", () => {
    test("needs 2 to 100 characters after trimming", async () => {
        for (const q of ["", "a", "%20a%20", "x".repeat(101)]) {
            const { res, body } = await get(
                app(),
                `/api/dashboard/search?q=${q}`,
            );
            expect(res.status).toBe(400);
            expect(body.error).toBe("bad_request");
        }
    });

    test("meals newest first with local date and time, matching ingredients, and saved meals", async () => {
        const older = meal({
            logged_at: "2026-10-28T10:15:00Z",
            description: "Chicken & rice bowl",
            calories: 641.6,
            meal_type: "lunch",
        });
        const newer = meal({
            logged_at: "2026-11-06T22:30:00Z",
            description: "Dinner",
            calories: 700,
            meal_type: "dinner",
        });
        const queries: unknown[] = [];
        const { body } = await get(
            app({
                readers: {
                    ...emptyReaders(),
                    searchMeals: async (_u, qs, opts) => {
                        queries.push({ qs, opts });
                        return [older, newer];
                    },
                    getMealItems: async () =>
                        new Map([
                            [
                                newer.id,
                                [
                                    { name: "Grilled chicken breast" },
                                    { name: "Rice" },
                                ] as never,
                            ],
                        ]),
                    searchSavedMeals: async () => ({
                        saved: [
                            {
                                id: "s1",
                                name: "Chicken & rice bowl",
                                description: "",
                                meal_type: "lunch",
                                calories: 642.4,
                                protein_g: 48,
                                carbs_g: 72,
                                fat_g: 16,
                                item_count: 4,
                            },
                        ],
                        total: 1,
                    }),
                },
            }),
            "/api/dashboard/search?q=%20chicken%20",
        );
        expect(queries).toEqual([
            { qs: ["chicken"], opts: { limit: SEARCH_MEAL_LIMIT } },
        ]);
        expect(body).toEqual({
            ok: true,
            meals: [
                {
                    id: newer.id,
                    // 22:30Z is 00:30 the next day in Kyiv.
                    date: "2026-11-07",
                    time: "00:30",
                    description: "Dinner",
                    meal_type: "dinner",
                    calories: 700,
                    items: ["Grilled chicken breast"],
                },
                {
                    id: older.id,
                    date: "2026-10-28",
                    time: "12:15",
                    description: "Chicken & rice bowl",
                    meal_type: "lunch",
                    calories: 642,
                    items: [],
                },
            ],
            savedMeals: [
                { id: "s1", name: "Chicken & rice bowl", calories: 642 },
            ],
        });
    });
});

describe("saved meals", () => {
    test("one row per saved meal with per-serving macros and an item count", async () => {
        const { body } = await get(
            app({
                readers: {
                    ...emptyReaders(),
                    getSavedMeals: async () =>
                        [
                            {
                                id: "s1",
                                name: "Protein shake",
                                meal_type: "snack",
                                calories: 230.4,
                                protein_g: 32.04,
                                carbs_g: 14,
                                fat_g: 5,
                                items: [{}, {}, {}],
                            },
                        ] as unknown as SavedMealWithItems[],
                },
            }),
            "/api/dashboard/saved-meals",
        );
        expect(body).toEqual({
            ok: true,
            savedMeals: [
                {
                    id: "s1",
                    name: "Protein shake",
                    meal_type: "snack",
                    calories: 230,
                    protein_g: 32,
                    carbs_g: 14,
                    fat_g: 5,
                    itemCount: 3,
                },
            ],
        });
    });
});

describe("measurements", () => {
    const entry = (
        over: Partial<BodyMeasurementEntry>,
    ): BodyMeasurementEntry => ({
        id: crypto.randomUUID(),
        user_id: USER,
        kind: "waist",
        value_mm: 830,
        value_entered: 83,
        entered_unit: "cm",
        logged_at: "2026-11-03T08:00:00Z",
        notes: null,
        created_at: "",
        idempotency_key: null,
        ...over,
    });

    test("latest and first per site, first converted to the latest entry's unit, and the unmeasured sites", async () => {
        const { body } = await get(
            app({
                readers: {
                    ...emptyReaders(),
                    getAllBodyMeasurements: async () => [
                        entry({
                            logged_at: "2026-08-04T08:00:00Z",
                            value_mm: 864,
                            value_entered: 34,
                            entered_unit: "in",
                        }),
                        entry({
                            logged_at: "2026-11-03T08:00:00Z",
                            value_mm: 835,
                            // numeric columns can arrive as strings
                            value_entered: "83.5" as unknown as number,
                        }),
                        entry({
                            kind: "neck",
                            value_mm: 380,
                            value_entered: 38,
                        }),
                    ],
                },
            }),
            "/api/dashboard/measurements",
        );
        expect(body).toEqual({
            ok: true,
            unit: "cm",
            sites: [
                {
                    kind: "waist",
                    latest: { value: 83.5, unit: "cm", date: "2026-11-03" },
                    first: { value: 86.4, unit: "cm", date: "2026-08-04" },
                    entries: 2,
                },
                {
                    kind: "neck",
                    latest: { value: 38, unit: "cm", date: "2026-11-03" },
                    first: null,
                    entries: 1,
                },
            ],
            unmeasured: [
                "hips",
                "chest",
                "shoulders",
                "upper_arm",
                "forearm",
                "thigh",
                "calf",
            ],
        });
    });

    test("no entries at all lists every site as unmeasured", () => {
        const { sites, unmeasured } = buildMeasurementSites([], "UTC");
        expect(sites).toEqual([]);
        expect(unmeasured).toHaveLength(9);
    });
});

// ---------- widget route ----------

describe("widget route", () => {
    const route = () =>
        createDashboardWidgetRoute({
            getHtml: async (key) => `<!doctype html><p>${key}</p>`,
        });

    test("serves an allowlisted widget with its own CSP, framable by the site, cacheable with an ETag", async () => {
        const res = await route().request(
            "http://localhost/dashboard/widget/trends",
        );
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("text/html");
        expect(res.headers.get("content-security-policy")).toBe(WIDGET_CSP);
        expect(WIDGET_CSP).toContain("default-src 'none'");
        expect(WIDGET_CSP).toContain("frame-ancestors 'self'");
        expect(res.headers.get("x-frame-options")).toBeNull();
        expect(res.headers.get("cache-control")).toBe("public, max-age=300");
        const etag = res.headers.get("etag");
        expect(etag).toMatch(/^"[0-9a-f]{32}"$/);
        expect(await res.text()).toBe("<!doctype html><p>trends</p>");

        const again = await route().request(
            "http://localhost/dashboard/widget/trends",
            { headers: { "If-None-Match": etag! } },
        );
        expect(again.status).toBe(304);
        expect(again.headers.get("etag")).toBe(etag);
    });

    test("every widget the dashboard frames is served", async () => {
        for (const key of [
            "nutrition-summary",
            "goal-progress",
            "trends",
            "weight-trends",
            "digest",
        ]) {
            const res = await route().request(
                `http://localhost/dashboard/widget/${key}`,
            );
            expect(res.status).toBe(200);
        }
    });

    test("any other key is 404, including widgets that exist but are not on the dashboard", async () => {
        for (const key of [
            "import-meals",
            "component-gallery",
            "meal-logged",
            "nope",
        ]) {
            const res = await route().request(
                `http://localhost/dashboard/widget/${key}`,
            );
            expect(res.status).toBe(404);
        }
    });

    test("the real assembled widget is served", async () => {
        const res = await createDashboardWidgetRoute().request(
            "http://localhost/dashboard/widget/goal-progress",
        );
        expect(res.status).toBe(200);
        expect(await res.text()).toContain("<html");
    });

    test("every dashboard widget knows the host name dashboard.js announces", async () => {
        // bridge.js drops the chat-only settings footer and the widget's own
        // outer card (html.host-framed) only for this host name, so the two
        // literals must agree.
        const host = await Bun.file("public/dashboard.js").text();
        expect(host).toContain('name: "nutrition-mcp-dashboard"');
        for (const key of DASHBOARD_WIDGETS) {
            const res = await createDashboardWidgetRoute().request(
                `http://localhost/dashboard/widget/${key}`,
            );
            const html = await res.text();
            expect(html).toContain(
                'const DASHBOARD_HOST_NAME = "nutrition-mcp-dashboard";',
            );
            expect(html).toContain("html.host-framed .wrap > .panel");
        }
    });
});
