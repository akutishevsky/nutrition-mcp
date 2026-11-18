import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport, McpServer } from "@modelcontextprotocol/server";
import { describe, expect, test } from "bun:test";
import usdaFoundationBananaFx from "../../__fixtures__/usda/detail-Foundation-1105073-filtered.json";
import usdaSrBananaFx from "../../__fixtures__/usda/detail-SR_Legacy-173944-full.json";
import searchBananaFx from "../../__fixtures__/usda/search-banana.json";
import {
    offNotFoundText,
    offUnreachableText,
    registerTools,
} from "../../mcp.js";
import type { MealNutrientKey as UsdaMealNutrientKey } from "../../meal-items.js";
import { referenceFromUsda } from "../../provenance.js";
import type { UsdaRecord } from "../../usda-record.js";
import {
    createUsdaState,
    normalizeDetail,
    scaleValues,
    type UsdaDeps,
} from "../../usda.js";
import {
    type CallTool,
    db,
    PROFILE_BASE,
    textOf,
    type ToolResult,
} from "../test-harness.js";

export function registerFoodSuites(): void {
    // A barcode lookup is often only a question about the product, so neither
    // fallback may presume the meal gets logged.
    describe("lookup_barcode fallbacks do not presume a log", () => {
        test("unreachable and not-found texts stop short of a write", () => {
            for (const text of [
                offUnreachableText(),
                offNotFoundText("5449000000996"),
            ]) {
                expect(text).not.toContain("log the meal");
                expect(text).not.toMatch(/then log/);
            }
            expect(offNotFoundText("5449000000996")).toContain("5449000000996");
        });
    });

    // ---------- USDA tools: search_foods and get_food_macros ----------
    //
    // Driven through a real client, against a fake FoodData Central injected as the
    // tools' fetch seam (registerTools' last parameter) and a fresh quota state per
    // case. No global fetch and no network; the cache is in memory, and the
    // end-to-end case routes the cache write into the db.foodRecords fixture that
    // log_meal's getCachedFoodRecord reads, as the real reader would.

    const USDA_KEY = "usda-test-key-9f2";

    const USDA_T0 = Date.parse("2026-10-10T12:00:00Z");

    const USDA_HEADERS = {
        "x-ratelimit-limit": "3600",
        "x-ratelimit-remaining": "2999",
    };

    const usdaSearchFx = searchBananaFx as unknown as Record<string, unknown>;

    const usdaSrFx = usdaSrBananaFx as unknown as Record<string, unknown>;

    const usdaFoundationFx = usdaFoundationBananaFx as unknown as Record<
        string,
        unknown
    >;

    interface UsdaCall {
        url: string;
        method: string;
        headers: Record<string, string>;
        body?: string;
    }

    function usdaReply(
        body: unknown,
        status = 200,
        headers: Record<string, string> = USDA_HEADERS,
    ): Response {
        return new Response(JSON.stringify(body), {
            status,
            headers: { "content-type": "application/json", ...headers },
        });
    }

    /** The default upstream: search answers the banana fixture; a detail id answers
     * the SR Legacy banana re-labelled with that id, or 404 for id 0. */
    function defaultUsdaRoute(call: UsdaCall): Response {
        if (call.method === "POST") return usdaReply(usdaSearchFx);
        const id = Number(call.url.match(/\/food\/(\d+)/)?.[1]);
        if (!Number.isSafeInteger(id) || id === 0) {
            return usdaReply({ error: { code: "NOT_FOUND" } }, 404);
        }
        return usdaReply({ ...usdaSrFx, fdcId: id });
    }

    function fakeUsda(route: (call: UsdaCall) => Response = defaultUsdaRoute) {
        const calls: UsdaCall[] = [];
        const fetch = async (
            url: string,
            init: {
                method: "GET" | "POST";
                headers: Record<string, string>;
                body?: string;
            },
        ) => {
            const call = {
                url,
                method: init.method,
                headers: init.headers,
                body: init.body,
            };
            calls.push(call);
            return route(call);
        };
        return { calls, fetch };
    }

    function memoryUsdaCache() {
        const rows = new Map<
            number,
            { record: UsdaRecord; fetchedAt: number }
        >();
        return {
            rows,
            get: async (fdcId: number) => rows.get(fdcId) ?? null,
            put: async (record: UsdaRecord, fetchedAt: number) => {
                rows.set(record.fdc_id, { record, fetchedAt });
            },
        };
    }

    async function withUsda(
        usda: Partial<UsdaDeps>,
        run: (call: CallTool) => Promise<void>,
        userId = "u1",
    ): Promise<void> {
        const server = new McpServer(
            { name: "nutrition-mcp-test", version: "0.0.0" },
            { capabilities: { tools: {}, resources: {} } },
        );
        registerTools(server, userId, true, null, undefined, usda);
        const [clientTransport, serverTransport] =
            InMemoryTransport.createLinkedPair();
        const client = new Client({ name: "test-client", version: "0.0.0" });
        await Promise.all([
            server.connect(serverTransport),
            client.connect(clientTransport),
        ]);
        try {
            await client.listTools();
            await run(
                (name, args = {}) =>
                    client.callTool({
                        name,
                        arguments: args,
                    }) as Promise<ToolResult>,
            );
        } finally {
            await client.close();
            await server.close();
        }
    }

    /** The deps every case shares: the key, a fixed clock, a fresh quota state. */
    function usdaDepsFor(
        fake: ReturnType<typeof fakeUsda>,
        extra: Partial<UsdaDeps> = {},
    ): Partial<UsdaDeps> {
        return {
            fetch: fake.fetch,
            env: { USDA_API_KEY: USDA_KEY },
            now: () => USDA_T0,
            state: createUsdaState(),
            cache: memoryUsdaCache(),
            log: () => {},
            ...extra,
        };
    }

    const lastAnalytics = () => db.analyticsRows.at(-1)!;

    describe("USDA tools: listing and annotations", () => {
        test("both tools are read-only, open-world and carry a title", async () => {
            const server = new McpServer(
                { name: "t", version: "0.0.0" },
                { capabilities: { tools: {}, resources: {} } },
            );
            registerTools(server, "u1", true, null);
            const [ct, st] = InMemoryTransport.createLinkedPair();
            const client = new Client({ name: "c", version: "0.0.0" });
            await Promise.all([server.connect(st), client.connect(ct)]);
            const { tools } = await client.listTools();
            await client.close();
            await server.close();

            const byName = new Map(tools.map((t) => [t.name, t]));
            for (const name of ["search_foods", "get_food_macros"]) {
                const t = byName.get(name);
                expect(t?.title, name).toBe(t?.annotations?.title);
                expect(t?.annotations).toEqual({
                    title: t?.annotations?.title,
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                });
                // Text output only: no structured content to validate.
                expect(t?.outputSchema, name).toBeUndefined();
            }
            expect(byName.get("search_foods")?.annotations?.title).toBe(
                "Search Generic Foods",
            );
            expect(byName.get("get_food_macros")?.annotations?.title).toBe(
                "Get Food Macros",
            );
        });
    });

    describe("USDA tools: search_foods", () => {
        test("posts the sanitized query with the key only in X-Api-Key, and lists candidates", async () => {
            const fake = fakeUsda();
            await withUsda(usdaDepsFor(fake), async (call) => {
                const r = await call("search_foods", {
                    query: '  "banana" +split*  ',
                });
                expect(r.isError).toBeFalsy();
                const text = textOf(r);
                expect(text).toContain(
                    "173944 · Bananas, raw · SR Legacy · calories 89 kcal · protein 1.09 g · carbs 22.8 g · fat 0.33 g",
                );
                expect(text).toContain("Values are per 100 g.");
            });
            expect(fake.calls).toHaveLength(1);
            const [call] = fake.calls;
            expect(call!.method).toBe("POST");
            expect(call!.url).toBe(
                "https://api.nal.usda.gov/fdc/v1/foods/search",
            );
            expect(call!.headers["X-Api-Key"]).toBe(USDA_KEY);
            expect(call!.url).not.toContain(USDA_KEY);
            expect(JSON.parse(call!.body!)).toEqual({
                query: "banana split",
                dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"],
                pageSize: 10,
            });
            expect(lastAnalytics()).toMatchObject({
                tool_name: "search_foods",
                success: true,
            });
        });

        test("a search with no candidates is a normal no-match result", async () => {
            const fake = fakeUsda(() => usdaReply({ foods: [] }));
            await withUsda(usdaDepsFor(fake), async (call) => {
                const r = await call("search_foods", { query: "zzqqxx" });
                expect(r.isError).toBeFalsy();
                expect(textOf(r)).toContain(
                    "USDA FoodData Central has no generic food matching that search.",
                );
            });
        });

        test("a search query outside 1 to 200 characters, or with only symbols, is refused before any upstream call", async () => {
            const fake = fakeUsda();
            await withUsda(usdaDepsFor(fake), async (call) => {
                for (const query of ["   ", "x".repeat(201), "+-*"]) {
                    const r = await call("search_foods", { query });
                    expect(r.isError, JSON.stringify(query.slice(0, 5))).toBe(
                        true,
                    );
                }
            });
            expect(fake.calls).toHaveLength(0);
        });

        test("an upstream 400 on search is a normal result", async () => {
            const fake = fakeUsda(() =>
                usdaReply({ error: { code: "BAD" } }, 400),
            );
            await withUsda(usdaDepsFor(fake), async (call) => {
                const r = await call("search_foods", { query: "banana" });
                expect(r.isError).toBeFalsy();
                expect(textOf(r)).toBe("USDA could not process that search.");
            });
        });
    });

    describe("USDA tools: get_food_macros", () => {
        test("values per 100 g, scaled to amount_g, with not-recorded nutrients and the food_ref", async () => {
            const fake = fakeUsda();
            await withUsda(usdaDepsFor(fake), async (call) => {
                const r = await call("get_food_macros", {
                    fdc_id: 173944,
                    amount_g: 150,
                });
                expect(r.isError).toBeFalsy();
                const lines = textOf(r).split("\n");
                expect(lines[0]).toBe("Bananas, raw");
                expect(lines[1]).toBe(
                    "USDA FoodData Central 173944 · SR Legacy",
                );
                expect(lines[2]).toBe(
                    "Per 100 g: calories 89 kcal · protein 1.09 g · carbs 22.84 g · fat 0.33 g · saturated fat 0.112 g · trans fat 0 g · fiber 2.6 g · sugar 12.23 g · alcohol 0 g · caffeine 0 mg",
                );
                expect(lines[3]).toMatch(/^For 150 g: calories 134 kcal · /);
                expect(lines[4]).toBe(
                    "Not in this record (not zero): added sugar, sodium.",
                );
                expect(lines[5]).toBe(
                    'Portions: 100 g · 1 NLEA serving (126 g) · 1 cup, mashed (225 g) · 1 cup, sliced (150 g) · 1 extra large (9" or longer) (152 g) · 1 extra small (less than 6" long) (81 g) · 1 large (8" to 8-7/8" long) (136 g) · 1 medium (7" to 7-7/8" long) (118 g) · 1 small (6" to 6-7/8" long) (101 g)',
                );
                expect(lines[6]).toBe(
                    'food_ref: {"source":"usda","id":"173944","amount_g":150} · sent with the values above, the meal tools record values that match this record as USDA.',
                );
            });
            expect(fake.calls).toHaveLength(1);
            expect(fake.calls[0]!.method).toBe("GET");
            const detail = new URL(fake.calls[0]!.url);
            expect(detail.pathname).toBe("/fdc/v1/food/173944");
            expect(detail.searchParams.get("format")).toBe("full");
            expect(
                detail.searchParams.get("nutrients")!.split(",").sort(),
            ).toEqual(
                "208,203,204,205,606,605,291,269,539,221,262,957,958,307"
                    .split(",")
                    .sort(),
            );
            expect(fake.calls[0]!.url).not.toContain(USDA_KEY);
            expect(fake.calls[0]!.headers["X-Api-Key"]).toBe(USDA_KEY);
            expect(lastAnalytics()).toMatchObject({
                tool_name: "get_food_macros",
                success: true,
            });
        });

        test("without amount_g there is no scaled line and no food_ref, and a Foundation record names what it lacks", async () => {
            const fake = fakeUsda((call) =>
                call.method === "POST"
                    ? usdaReply(usdaSearchFx)
                    : usdaReply(usdaFoundationFx),
            );
            await withUsda(usdaDepsFor(fake), async (call) => {
                const r = await call("get_food_macros", { fdc_id: 1105073 });
                const text = textOf(r);
                expect(text).not.toContain("For ");
                expect(text).not.toContain("food_ref:");
                expect(text).toContain(
                    "Scaled values and a food_ref come with amount_g.",
                );
                expect(text).toContain(
                    "Not in this record (not zero): saturated fat, trans fat, sugar, added sugar, alcohol, caffeine, sodium.",
                );
                expect(text).toContain("Per 100 g: calories 85 kcal");
            });
        });

        test("an id that is not a whole positive number, or an amount outside 0 to 5000, is refused before any upstream call", async () => {
            const fake = fakeUsda();
            await withUsda(usdaDepsFor(fake), async (call) => {
                for (const args of [
                    { fdc_id: 0 },
                    { fdc_id: 1.5 },
                    { fdc_id: 173944, amount_g: 0 },
                    { fdc_id: 173944, amount_g: 5001 },
                ]) {
                    const r = await call("get_food_macros", args);
                    expect(r.isError, JSON.stringify(args)).toBe(true);
                }
            });
            expect(fake.calls).toHaveLength(0);
        });

        test("an unknown id is a normal no-record result", async () => {
            const missing = fakeUsda(() =>
                usdaReply({ error: { code: "NOT_FOUND" } }, 404),
            );
            await withUsda(usdaDepsFor(missing), async (call) => {
                const r = await call("get_food_macros", { fdc_id: 424242 });
                expect(r.isError).toBeFalsy();
                expect(textOf(r)).toBe("No USDA record with that id.");
            });
        });

        test("a served cache row needs no key and no upstream call", async () => {
            const fake = fakeUsda();
            const cache = memoryUsdaCache();
            const record = normalizeDetail({ ...usdaSrFx, fdcId: 173944 })!;
            cache.rows.set(173944, { record, fetchedAt: USDA_T0 - 1000 });
            await withUsda(
                usdaDepsFor(fake, { cache, env: {} }),
                async (call) => {
                    const r = await call("get_food_macros", { fdc_id: 173944 });
                    expect(textOf(r)).toContain("Bananas, raw");
                },
            );
            expect(fake.calls).toHaveLength(0);
        });
    });

    describe("USDA tools: unavailable paths", () => {
        test("with no key set, both tools say so as a normal result and call nothing", async () => {
            const fake = fakeUsda();
            await withUsda(usdaDepsFor(fake, { env: {} }), async (call) => {
                const search = await call("search_foods", { query: "banana" });
                const macros = await call("get_food_macros", {
                    fdc_id: 173944,
                });
                for (const r of [search, macros]) {
                    expect(r.isError).toBeFalsy();
                    expect(textOf(r)).toBe(
                        "USDA data is not configured on this server.",
                    );
                }
            });
            expect(fake.calls).toHaveLength(0);
        });

        test("a 403 is a normal unavailable result, logged as an analytics failure", async () => {
            const fake = fakeUsda(() =>
                usdaReply({ error: { code: "API_KEY_INVALID" } }, 403),
            );
            await withUsda(usdaDepsFor(fake), async (call) => {
                const r = await call("get_food_macros", { fdc_id: 173944 });
                expect(r.isError).toBeFalsy();
                expect(textOf(r)).toBe("USDA data is unavailable right now.");
            });
            expect(lastAnalytics()).toMatchObject({
                tool_name: "get_food_macros",
                success: false,
                error_category: "usda_unavailable",
            });
        });

        test("a repeated 500 is a temporary failure with a ref, and no URL or key reaches the caller", async () => {
            const fake = fakeUsda(() => usdaReply({ message: "boom" }, 500));
            await withUsda(usdaDepsFor(fake), async (call) => {
                const r = await call("get_food_macros", { fdc_id: 173944 });
                expect(r.isError).toBe(true);
                const text = textOf(r);
                expect(text).toContain(
                    "get_food_macros could not finish: the USDA FoodData Central service did not answer (ref ",
                );
                expect(text).not.toContain("api.nal.usda.gov");
                expect(text).not.toContain(USDA_KEY);
            });
            expect(fake.calls).toHaveLength(2);
            expect(lastAnalytics()).toMatchObject({
                tool_name: "get_food_macros",
                success: false,
                error_category: "usda_unavailable",
            });
        });

        test("a 429 pauses USDA, the reply names the time in the profile timezone, and cached records still answer", async () => {
            db.profile = { ...PROFILE_BASE, timezone: "Europe/Kyiv" };
            const fake = fakeUsda((call) =>
                call.url.includes("/food/173944")
                    ? usdaReply({ error: "rate" }, 429)
                    : defaultUsdaRoute(call),
            );
            const cache = memoryUsdaCache();
            const cached = normalizeDetail({
                ...usdaFoundationFx,
                fdcId: 1105073,
            })!;
            cache.rows.set(1105073, { record: cached, fetchedAt: USDA_T0 });
            await withUsda(usdaDepsFor(fake, { cache }), async (call) => {
                const first = await call("get_food_macros", { fdc_id: 173944 });
                // 13:00 UTC is 16:00 in Kyiv (UTC+3 in October).
                expect(first.isError).toBeFalsy();
                expect(textOf(first)).toBe(
                    "USDA data is unavailable until 16:00 (Europe/Kyiv).",
                );
                const again = await call("get_food_macros", { fdc_id: 173944 });
                expect(textOf(again)).toBe(
                    "USDA data is unavailable until 16:00 (Europe/Kyiv).",
                );
                const served = await call("get_food_macros", {
                    fdc_id: 1105073,
                });
                expect(textOf(served)).toContain("Bananas, overripe, raw");
            });
            // One upstream call: the pause holds the second one back.
            expect(fake.calls.filter((c) => c.method === "GET")).toHaveLength(
                1,
            );
        });

        test("at the reserve, USDA is paused until an hour after the reading", async () => {
            db.profile = { ...PROFILE_BASE, timezone: null };
            const fake = fakeUsda(() =>
                usdaReply(usdaSearchFx, 200, {
                    "x-ratelimit-limit": "3600",
                    "x-ratelimit-remaining": "300",
                }),
            );
            await withUsda(usdaDepsFor(fake), async (call) => {
                await call("search_foods", { query: "banana" });
                const r = await call("search_foods", { query: "banana" });
                // 12:00 UTC plus an hour is 13:00 UTC, the profile's zone being unset.
                expect(textOf(r)).toBe(
                    "USDA data is unavailable until 13:00 (UTC).",
                );
            });
            expect(fake.calls).toHaveLength(1);
        });

        test("the per-user cap counts upstream calls per user, and cache hits are free", async () => {
            db.profile = { ...PROFILE_BASE, timezone: null };
            const fake = fakeUsda();
            const usda = usdaDepsFor(fake);
            await withUsda(
                usda,
                async (call) => {
                    for (let i = 0; i < 30; i++) {
                        const r = await call("get_food_macros", {
                            fdc_id: 2000 + i,
                        });
                        expect(textOf(r)).toContain("Bananas, raw");
                    }
                    // The thirty-first upstream call of the hour is refused.
                    const refused = await call("get_food_macros", {
                        fdc_id: 3000,
                    });
                    expect(textOf(refused)).toMatch(
                        /^USDA data is unavailable until \d{2}:\d{2} \(UTC\)\.$/,
                    );
                    // A row already cached is served, and does not count.
                    const hit = await call("get_food_macros", { fdc_id: 2000 });
                    expect(textOf(hit)).toContain("Bananas, raw");
                },
                "u-capped",
            );
            expect(fake.calls.filter((c) => c.method === "GET")).toHaveLength(
                30,
            );

            // The cap is per user: a second user is not held back by the first.
            const other = fakeUsda();
            await withUsda(
                usdaDepsFor(other, { state: usda.state }),
                async (call) => {
                    const r = await call("get_food_macros", { fdc_id: 4000 });
                    expect(textOf(r)).toContain("Bananas, raw");
                },
                "u-other",
            );
            expect(other.calls).toHaveLength(1);
        });
    });

    describe("USDA end to end: get_food_macros then log_meal", () => {
        test("the values get_food_macros returned, logged with its food_ref, are recorded as USDA", async () => {
            const record = normalizeDetail({ ...usdaSrFx, fdcId: 173944 })!;
            const fake = fakeUsda();
            const cache = {
                get: async () => null,
                put: async (rec: UsdaRecord, fetchedAt: number) => {
                    // What getCachedFoodRecord returns for this row: the record as
                    // a ReferenceRecord, dated to the fetch.
                    db.foodRecords.set(
                        `usda:${rec.fdc_id}`,
                        referenceFromUsda(
                            rec,
                            new Date(fetchedAt).toISOString(),
                        ),
                    );
                },
            };
            await withUsda(usdaDepsFor(fake, { cache }), async (call) => {
                const r = await call("get_food_macros", {
                    fdc_id: 173944,
                    amount_g: 150,
                });
                expect(textOf(r)).toContain(
                    'food_ref: {"source":"usda","id":"173944","amount_g":150}',
                );
                const scaled = scaleValues(
                    record.per100g as Partial<
                        Record<UsdaMealNutrientKey, number>
                    >,
                    150,
                );
                const r2 = await call("log_meal", {
                    description: "Bananas, raw",
                    meal_type: "snack",
                    calories: scaled.calories,
                    protein_g: scaled.protein_g,
                    carbs_g: scaled.carbs_g,
                    fat_g: scaled.fat_g,
                    saturated_fat_g: scaled.saturated_fat_g,
                    trans_fat_g: scaled.trans_fat_g,
                    fiber_g: scaled.fiber_g,
                    sugar_g: scaled.sugar_g,
                    food_ref: { source: "usda", id: "173944", amount_g: 150 },
                });
                expect(r2.isError).toBeFalsy();
                const row = db.inserted.at(-1)!;
                const tag = { s: "usda", ref: "173944" } as const;
                expect(row.nutrient_sources).toEqual({
                    calories: tag,
                    protein_g: tag,
                    carbs_g: tag,
                    fat_g: tag,
                    saturated_fat_g: tag,
                    trans_fat_g: tag,
                    fiber_g: tag,
                    sugar_g: tag,
                });
                expect(textOf(r2)).toContain(
                    "match USDA FoodData Central 173944 for 150 g",
                );
            });
            db.foodRecords.clear();
        });
    });
}
