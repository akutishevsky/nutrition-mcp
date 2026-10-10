import { test, expect, describe, spyOn, beforeAll, afterAll } from "bun:test";
import {
    USDA_API_BASE,
    USDA_CACHE_TTL_MS,
    USDA_NUTRIENT_NUMBERS,
    USDA_PAUSE_MS,
    USDA_QUOTA_RESERVE,
    USDA_QUOTA_WINDOW_MS,
    USDA_USER_HOURLY_CAP,
    candidatesFrom,
    chargeUserCall,
    createUsdaState,
    extractPortions,
    fetchFoodDetail,
    getFoodRecord,
    mapNutrients,
    normalizeDetail,
    quotaBlock,
    sanitizeQuery,
    scaleValues,
    searchUsda,
    usdaLogLine,
    usdaUnavailableText,
    userCapBlock,
    type UsdaCacheStore,
    type UsdaDeps,
} from "./usda.js";
import { errorLogText, UpstreamError } from "./errors.js";
import { categorizeError } from "./analytics.js";
import { readUsdaFoodCache, writeUsdaFoodCache } from "./supabase.js";
import { formatUsdaRecord } from "./usda-text.js";
import {
    usdaRecordFromPayload,
    type UsdaRecord,
    type UsdaDataType,
} from "./usda-record.js";
import searchBanana from "./__fixtures__/usda/search-banana.json";
import detailSr from "./__fixtures__/usda/detail-SR_Legacy-173944-full.json";
import detailFoundation from "./__fixtures__/usda/detail-Foundation-1105073-filtered.json";
import detailFndds from "./__fixtures__/usda/detail-Survey_FNDDS_-2709224-filtered.json";

// The USDA client against injected fetch, clock, env and cache: no network, no
// database, no mock.module. The Supabase store is exercised once at the end,
// against a stubbed global fetch (supabase-js resolves it per call), like
// src/oauth-supabase-store.test.ts.

const KEY = "test-usda-key-123";
const USER_A = "aaaaaaaa-1111-4111-8111-111111111111";
const USER_B = "bbbbbbbb-2222-4222-8222-222222222222";
const T0 = Date.parse("2026-10-10T12:00:00Z");
const HOUR = 60 * 60 * 1000;

type Reply = () => Response | Error;

function usdaJson(
    body: unknown,
    status = 200,
    headers: Record<string, string> = {
        "x-ratelimit-limit": "3600",
        "x-ratelimit-remaining": "2999",
    },
): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json", ...headers },
    });
}

const replyJson =
    (body: unknown, status = 200, headers?: Record<string, string>): Reply =>
    () =>
        usdaJson(body, status, headers);

const replyHtml400: Reply = () =>
    new Response("<html><head><title>400 Bad Request</title></head></html>", {
        status: 400,
        headers: { "content-type": "text/html" },
    });

interface Call {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
}

function harness(
    replies: Reply[] = [],
    opts: { env?: Record<string, string | undefined>; now?: number } = {},
) {
    let clock = opts.now ?? T0;
    const calls: Call[] = [];
    const logs: string[] = [];
    const cacheRows = new Map<
        number,
        { record: UsdaRecord; fetchedAt: number }
    >();
    const cache: UsdaCacheStore = {
        get: async (id) => cacheRows.get(id) ?? null,
        put: async (record, fetchedAt) => {
            cacheRows.set(record.fdc_id, { record, fetchedAt });
        },
    };
    const state = createUsdaState();
    const deps: UsdaDeps = {
        fetch: async (url, init) => {
            calls.push({
                url,
                method: init.method,
                headers: init.headers,
                body: init.body,
            });
            const next = replies.shift();
            if (!next) throw new Error("test made an unexpected upstream call");
            const r = next();
            if (r instanceof Error) throw r;
            return r;
        },
        now: () => clock,
        env: opts.env ?? { USDA_API_KEY: KEY },
        cache,
        state,
        log: (line) => logs.push(line),
    };
    return {
        deps,
        calls,
        logs,
        cacheRows,
        state,
        advance: (ms: number) => {
            clock += ms;
        },
        now: () => clock,
    };
}

function freshRecord(): UsdaRecord {
    return normalizeDetail(detailSr)!;
}

describe("sanitizeQuery", () => {
    test("strips USDA operators to spaces and keeps the words", () => {
        expect(sanitizeQuery('"banana" +raw -fried (cooked)')).toBe(
            "banana raw fried cooked",
        );
        expect(sanitizeQuery("low-fat  milk*: ~x ^y")).toBe("low fat milk x y");
    });

    test("adds no plus sign to plain queries", () => {
        expect(sanitizeQuery("steamed broccoli")).toBe("steamed broccoli");
        expect(sanitizeQuery("  banana   raw ")).toBe("banana raw");
    });
});

describe("nutrient mapping", () => {
    test("search rows and detail rows of one food agree on the shared values", () => {
        const searchRow = (
            searchBanana.foods as Array<{
                fdcId: number;
                foodNutrients: unknown;
            }>
        )[0]!;
        const fromSearch = mapNutrients(searchRow.foodNutrients);
        const fromDetail = mapNutrients(detailSr.foodNutrients);
        expect(fromSearch.calories).toBe(89);
        expect(fromDetail.calories).toBe(89);
        expect(fromSearch.protein_g).toBe(1.09);
        expect(fromDetail.protein_g).toBe(1.09);
        expect(fromDetail.saturated_fat_g).toBe(0.112);
        expect(fromDetail.trans_fat_g).toBe(0);
        expect(fromSearch.saturated_fat_g).toBe(0.112);
    });

    test("a Foundation food without 606 or 605 maps those to null, not 0", () => {
        const m = mapNutrients(detailFoundation.foodNutrients);
        expect(m.saturated_fat_g).toBeNull();
        expect(m.trans_fat_g).toBeNull();
        expect(m.added_sugar_g).toBeNull();
        expect(m.fiber_g).toBe(1.7);
    });

    test("an empty row list maps every key to null", () => {
        const m = mapNutrients([]);
        expect(Object.keys(m)).toHaveLength(11);
        expect(Object.values(m).every((v) => v === null)).toBe(true);
    });

    test("calories fall back to Atwater 958, then 957, only when 208 is absent", () => {
        const row = (number: string, value: number) => ({
            nutrientNumber: number,
            value,
        });
        expect(mapNutrients([row("957", 105)]).calories).toBe(105);
        expect(mapNutrients([row("958", 110), row("957", 105)]).calories).toBe(
            110,
        );
        expect(
            mapNutrients([row("208", 90), row("958", 110), row("957", 105)])
                .calories,
        ).toBe(90);
    });

    test("kilojoule rows are ignored", () => {
        expect(
            mapNutrients([{ nutrientNumber: "268", value: 371 }]).calories,
        ).toBeNull();
    });

    test("the requested numbers are the thirteen the mapping reads", () => {
        expect(USDA_NUTRIENT_NUMBERS).toHaveLength(13);
        expect(new Set(USDA_NUTRIENT_NUMBERS)).toEqual(
            new Set([
                "208",
                "203",
                "204",
                "205",
                "291",
                "269",
                "539",
                "221",
                "262",
                "957",
                "958",
                "606",
                "605",
            ]),
        );
    });
});

describe("portions", () => {
    test("SR Legacy labels come from the modifier, sorted, with grams", () => {
        const p = extractPortions("SR Legacy", detailSr.foodPortions);
        expect(p).toHaveLength(8);
        expect(p.map((x) => x.label)).toEqual(
            [...p.map((x) => x.label)].sort(),
        );
        expect(p).toContainEqual({ label: "1 cup, sliced", grams: 150 });
        expect(p.some((x) => x.label.includes("undetermined"))).toBe(false);
    });

    test("Foundation labels join the unit name and the modifier, RACC kept", () => {
        expect(
            extractPortions("Foundation", detailFoundation.foodPortions),
        ).toEqual([
            { label: "1 Banana, Peeled", grams: 110 },
            { label: "1 RACC", grams: 140 },
        ]);
    });

    test("FNDDS uses portionDescription, drops 'Quantity not specified' and ignores the numeric modifier", () => {
        expect(
            extractPortions("Survey (FNDDS)", detailFndds.foodPortions),
        ).toEqual([
            { label: "1 banana", grams: 126 },
            { label: "1 cup", grams: 150 },
            { label: "1 cup, mashed", grams: 225 },
            { label: "1 linear inch", grams: 15 },
            { label: "1 slice", grams: 6 },
        ]);
    });

    test("identical label and grams are deduped; a different weight is kept", () => {
        const row = (gramWeight: number) => ({
            amount: 1,
            modifier: "cup",
            gramWeight,
            measureUnit: { name: "undetermined" },
        });
        expect(
            extractPortions("SR Legacy", [row(150), row(150), row(160)]),
        ).toEqual([
            { label: "1 cup", grams: 150 },
            { label: "1 cup", grams: 160 },
        ]);
    });

    test("at most eight portions are kept, the first eight by label", () => {
        const rows = Array.from({ length: 10 }, (_, i) => ({
            amount: 1,
            modifier: `size ${String(i).padStart(2, "0")}`,
            gramWeight: 10 + i,
            measureUnit: { name: "undetermined" },
        }));
        const p = extractPortions("SR Legacy", rows);
        expect(p).toHaveLength(8);
        expect(p[0]!.label).toBe("1 size 00");
        expect(p[7]!.label).toBe("1 size 07");
    });

    test("rows without a usable weight or label are dropped", () => {
        expect(
            extractPortions("SR Legacy", [
                { amount: 1, modifier: "cup", gramWeight: 0 },
                {
                    amount: 1,
                    gramWeight: 50,
                    measureUnit: { name: "undetermined" },
                },
                {
                    amount: 0.5,
                    modifier: "cup",
                    gramWeight: 75,
                    measureUnit: { name: "undetermined" },
                },
            ]),
        ).toEqual([{ label: "0.5 cup", grams: 75 }]);
    });
});

describe("candidates and the detail normalizer", () => {
    test("candidatesFrom returns the search rows with four macros each, trimmed to max", () => {
        const all = candidatesFrom(searchBanana);
        expect(all).toHaveLength(4);
        expect(all[0]).toEqual({
            fdc_id: 173944,
            description: "Bananas, raw",
            data_type: "SR Legacy",
            calories: 89,
            protein_g: 1.09,
            carbs_g: 22.8,
            fat_g: 0.33,
        });
        expect(candidatesFrom(searchBanana, 2)).toHaveLength(2);
    });

    test("candidatesFrom drops other data types and rows without a description", () => {
        const raw = {
            foods: [
                {
                    fdcId: 1,
                    description: "Brand",
                    dataType: "Branded",
                    foodNutrients: [],
                },
                {
                    fdcId: 2,
                    description: " ",
                    dataType: "SR Legacy",
                    foodNutrients: [],
                },
                {
                    fdcId: 3,
                    description: "Ok",
                    dataType: "Foundation",
                    foodNutrients: [],
                },
            ],
        };
        expect(candidatesFrom(raw).map((c) => c.fdc_id)).toEqual([3]);
    });

    test("normalizeDetail builds a UsdaRecord that survives the cache round trip", () => {
        const rec = normalizeDetail(detailSr)!;
        expect(rec.fdc_id).toBe(173944);
        expect(rec.name).toBe("Bananas, raw");
        expect(rec.data_type).toBe("SR Legacy");
        expect(rec.per100g.protein_g).toBe(1.09);
        expect(rec.per100g.saturated_fat_g).toBe(0.112);
        expect(rec.portions).toHaveLength(8);
        expect(usdaRecordFromPayload(JSON.parse(JSON.stringify(rec)))).toEqual(
            rec,
        );
    });

    test("a nutrient the record does not carry is absent from per100g, not 0", () => {
        const rec = normalizeDetail(detailFoundation)!;
        expect(rec.data_type).toBe("Foundation");
        expect("saturated_fat_g" in rec.per100g).toBe(false);
        expect("added_sugar_g" in rec.per100g).toBe(false);
        expect(rec.per100g.fiber_g).toBe(1.7);
    });

    test("normalizeDetail refuses a non-record and an out-of-scope data type", () => {
        expect(normalizeDetail({})).toBeNull();
        expect(normalizeDetail(null)).toBeNull();
        expect(
            normalizeDetail({
                fdcId: 9,
                description: "x",
                dataType: "Branded",
                foodNutrients: [],
            }),
        ).toBeNull();
    });

    test("scaleValues rounds to two decimals, calories to whole kcal", () => {
        expect(scaleValues({ protein_g: 1.09, calories: 89 }, 118)).toEqual({
            protein_g: 1.29,
            calories: 105,
        });
    });
});

describe("quota, reserve and per-user cap", () => {
    test("the reserve blocks until one window after the reading", () => {
        const state = createUsdaState();
        state.remaining = USDA_QUOTA_RESERVE;
        state.remainingAt = T0;
        expect(quotaBlock(state, T0)).toEqual({
            until: T0 + HOUR,
            reason: "reserve",
        });
        expect(quotaBlock(state, T0 + HOUR)).toBeNull();
        state.remaining = USDA_QUOTA_RESERVE + 1;
        expect(quotaBlock(state, T0)).toBeNull();
    });

    test("a pause blocks for its full length", () => {
        const state = createUsdaState();
        state.pausedUntil = T0 + USDA_PAUSE_MS;
        expect(quotaBlock(state, T0)).toEqual({
            until: T0 + USDA_PAUSE_MS,
            reason: "paused",
        });
        expect(quotaBlock(state, T0 + USDA_PAUSE_MS)).toBeNull();
    });

    test("the per-user cap counts calls in a rolling hour, per user", () => {
        const state = createUsdaState();
        for (let i = 0; i < USDA_USER_HOURLY_CAP; i++)
            chargeUserCall(state, USER_A, T0);
        expect(userCapBlock(state, USER_A, T0)).toBe(T0 + USDA_QUOTA_WINDOW_MS);
        expect(userCapBlock(state, USER_B, T0)).toBeNull();
        expect(userCapBlock(state, USER_A, T0 + HOUR)).toBeNull();
    });

    test("usdaUnavailableText names the profile zone, or UTC when none is usable", () => {
        const until = Date.parse("2026-10-10T18:30:00Z");
        expect(usdaUnavailableText(until, "Europe/Kyiv")).toBe(
            "USDA data is unavailable until 21:30 (Europe/Kyiv).",
        );
        expect(usdaUnavailableText(until, null)).toBe(
            "USDA data is unavailable until 18:30 (UTC).",
        );
        expect(usdaUnavailableText(until, "Not/AZone")).toBe(
            "USDA data is unavailable until 18:30 (UTC).",
        );
        expect(usdaUnavailableText(null)).toBe(
            "USDA data is not configured on this server.",
        );
    });

    test("the log line carries only the tool, the result and the quota", () => {
        expect(usdaLogLine("detail", "cache", null)).toBe(
            "[usda] tool=detail result=cache quota_remaining=unknown",
        );
        expect(usdaLogLine("search", "ok", 2999)).toBe(
            "[usda] tool=search result=ok quota_remaining=2999",
        );
    });
});

describe("searchUsda", () => {
    test("POSTs the sanitized query with the three data types and the key only in the header", async () => {
        const h = harness([replyJson(searchBanana)]);
        const out = await searchUsda('+banana "raw"', USER_A, h.deps);
        expect(out.status).toBe("ok");
        expect(h.calls).toHaveLength(1);
        const call = h.calls[0]!;
        expect(call.url).toBe(`${USDA_API_BASE}/foods/search`);
        expect(call.method).toBe("POST");
        expect(call.headers["X-Api-Key"]).toBe(KEY);
        expect(call.headers["Content-Type"]).toBe("application/json");
        expect(JSON.parse(call.body!)).toEqual({
            query: "banana raw",
            dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"],
            pageSize: 10,
        });
        expect(
            h.calls.every(
                (c) => !c.url.includes(KEY) && !c.url.includes("api_key"),
            ),
        ).toBe(true);
        expect(h.logs).toEqual([
            "[usda] tool=search result=ok quota_remaining=2999",
        ]);
    });

    test("search results are never written to the cache", async () => {
        const h = harness([replyJson(searchBanana)]);
        await searchUsda("banana", USER_A, h.deps);
        expect(h.cacheRows.size).toBe(0);
    });

    test("zero candidates is a plain no-match, not an error", async () => {
        const h = harness([replyJson({ totalHits: 0, foods: [] })]);
        expect(await searchUsda("zzzz", USER_A, h.deps)).toEqual({
            status: "no_match",
        });
        expect(h.logs[0]).toContain("result=no_match");
    });

    test("a JSON 400 is a bad query, a plain result", async () => {
        const h = harness([replyJson({ error: { code: "BAD_REQUEST" } }, 400)]);
        expect(await searchUsda("x", USER_A, h.deps)).toEqual({
            status: "bad_query",
        });
        expect(h.logs).toEqual([
            "[usda] tool=search result=bad_query quota_remaining=2999",
        ]);
    });

    test("a blank quota header is unknown, not a reading of 0 that trips the reserve", async () => {
        const h = harness([
            replyJson(searchBanana, 200, { "x-ratelimit-remaining": "  " }),
            replyJson(searchBanana),
        ]);
        expect((await searchUsda("banana", USER_A, h.deps)).status).toBe("ok");
        expect(h.state.remaining).toBeNull();
        expect((await searchUsda("banana", USER_B, h.deps)).status).toBe("ok");
        expect(h.calls).toHaveLength(2);
    });

    test("a response without the quota header keeps the last known reading", async () => {
        const h = harness([
            replyJson({ oops: 1 }, 500, {}),
            replyJson(detailSr, 200, {}),
        ]);
        h.state.remaining = USDA_QUOTA_RESERVE - 1;
        h.state.remainingAt = T0;
        await fetchFoodDetail(173944, h.deps);
        expect(h.state.remaining).toBe(USDA_QUOTA_RESERVE - 1);
        expect(quotaBlock(h.state, T0)).toEqual({
            until: T0 + HOUR,
            reason: "reserve",
        });
    });

    test("calls already in flight count against the reserve, so a burst cannot pass it", async () => {
        const h = harness([
            replyJson(searchBanana, 200, { "x-ratelimit-remaining": "5000" }),
        ]);
        h.state.remaining = USDA_QUOTA_RESERVE + 1;
        h.state.remainingAt = T0;
        const [first, second] = await Promise.all([
            searchUsda("banana", USER_A, h.deps),
            searchUsda("banana", USER_B, h.deps),
        ]);
        expect(first.status).toBe("ok");
        expect(second).toEqual({
            status: "unavailable",
            reason: "reserve",
            until: T0 + HOUR,
        });
        expect(h.calls).toHaveLength(1);
        expect(h.state.inFlight).toBe(0);
    });

    test("an unexpected status such as 401 is thrown at once, not retried", async () => {
        const h = harness([replyJson({ error: "nope" }, 401)]);
        await expect(
            searchUsda("banana", USER_A, h.deps),
        ).rejects.toBeInstanceOf(UpstreamError);
        expect(h.calls).toHaveLength(1);
    });

    test("a non-JSON 400 from the edge is retried once and the retry answers", async () => {
        const h = harness([replyHtml400, replyJson(searchBanana)]);
        const out = await searchUsda("banana", USER_A, h.deps);
        expect(out.status).toBe("ok");
        expect(h.calls).toHaveLength(2);
        expect(h.logs).toHaveLength(1);
    });

    test("a network error is retried once and the retry answers", async () => {
        const h = harness([
            () => new TypeError("socket reset"),
            replyJson(searchBanana),
        ]);
        expect((await searchUsda("banana", USER_A, h.deps)).status).toBe("ok");
        expect(h.calls).toHaveLength(2);
    });

    test("two 5xx answers throw an UpstreamError with a fixed message and no URL or key", async () => {
        const h = harness([
            replyJson({ oops: 1 }, 500),
            replyJson({ oops: 2 }, 503),
        ]);
        const err = await searchUsda("banana", USER_A, h.deps).catch((e) => e);
        expect(err).toBeInstanceOf(UpstreamError);
        expect(categorizeError(err)).toBe("usda_unavailable");
        expect(errorLogText(err)).not.toContain("api.nal.usda.gov");
        expect(errorLogText(err)).not.toContain(KEY);
        expect(h.calls).toHaveLength(2);
        expect(h.logs).toEqual([
            "[usda] tool=search result=upstream_error quota_remaining=2999",
        ]);
    });

    test("two timeouts throw an UpstreamError", async () => {
        const timeout = () => new DOMException("timed out", "TimeoutError");
        const h = harness([() => timeout(), () => timeout()]);
        await expect(
            searchUsda("banana", USER_A, h.deps),
        ).rejects.toBeInstanceOf(UpstreamError);
        expect(h.calls).toHaveLength(2);
    });

    test("a non-JSON 403 from the edge is retried once and the retry answers", async () => {
        const html403: Reply = () =>
            new Response("<html>403 Forbidden</html>", {
                status: 403,
                headers: { "content-type": "text/html" },
            });
        const h = harness([html403, replyJson(searchBanana)]);
        expect((await searchUsda("banana", USER_A, h.deps)).status).toBe("ok");
        expect(h.calls).toHaveLength(2);
    });

    test("a 403 is auth_failed and the log says so", async () => {
        const h = harness([
            replyJson({ error: { code: "API_KEY_INVALID" } }, 403),
        ]);
        expect(await searchUsda("banana", USER_A, h.deps)).toEqual({
            status: "auth_failed",
        });
        expect(h.logs[0]).toContain("result=auth_failed");
    });

    test("without a key nothing is sent and the result says so", async () => {
        const h = harness([], { env: {} });
        expect(await searchUsda("banana", USER_A, h.deps)).toEqual({
            status: "unavailable",
            reason: "not_configured",
            until: null,
        });
        expect(h.calls).toHaveLength(0);
        expect(h.logs).toEqual([
            "[usda] tool=search result=unavailable quota_remaining=unknown",
        ]);
    });

    test("a 429 pauses every upstream call for an hour, cached records still serve", async () => {
        const h = harness([
            replyJson({ error: "slow down" }, 429, {
                "x-ratelimit-remaining": "0",
            }),
        ]);
        const first = await searchUsda("banana", USER_A, h.deps);
        expect(first).toEqual({
            status: "unavailable",
            reason: "paused",
            until: T0 + USDA_PAUSE_MS,
        });
        expect(h.calls).toHaveLength(1);

        h.advance(30 * 60 * 1000);
        expect(await searchUsda("banana", USER_B, h.deps)).toMatchObject({
            status: "unavailable",
            reason: "paused",
        });
        expect(h.calls).toHaveLength(1);

        // A fresh cached record still answers while the pause holds.
        h.cacheRows.set(173944, { record: freshRecord(), fetchedAt: h.now() });
        const cached = await getFoodRecord(173944, USER_B, h.deps);
        expect(cached.status).toBe("cache");
        expect(h.calls).toHaveLength(1);
    });

    test("a pause that has run out lets calls through again", async () => {
        const h = harness([
            replyJson({ error: "slow" }, 429, { "x-ratelimit-remaining": "0" }),
            replyJson(searchBanana),
        ]);
        await searchUsda("banana", USER_A, h.deps);
        h.advance(USDA_PAUSE_MS);
        expect((await searchUsda("banana", USER_A, h.deps)).status).toBe("ok");
        expect(h.calls).toHaveLength(2);
    });

    test("at the reserve, calls stop until one window after the reading", async () => {
        const h = harness([
            replyJson(searchBanana, 200, {
                "x-ratelimit-remaining": String(USDA_QUOTA_RESERVE),
            }),
            replyJson(searchBanana),
        ]);
        expect((await searchUsda("banana", USER_A, h.deps)).status).toBe("ok");
        expect(await searchUsda("banana", USER_B, h.deps)).toEqual({
            status: "unavailable",
            reason: "reserve",
            until: T0 + HOUR,
        });
        expect(h.calls).toHaveLength(1);
        h.advance(HOUR);
        expect((await searchUsda("banana", USER_B, h.deps)).status).toBe("ok");
        expect(h.calls).toHaveLength(2);
    });

    test("a response without the quota header leaves the remaining count unknown and calls continue", async () => {
        const h = harness([
            replyJson(searchBanana, 200, {}),
            replyJson(searchBanana, 200, {}),
        ]);
        await searchUsda("banana", USER_A, h.deps);
        expect(h.state.remaining).toBeNull();
        expect((await searchUsda("banana", USER_A, h.deps)).status).toBe("ok");
        expect(h.calls).toHaveLength(2);
        expect(h.logs[1]).toContain("quota_remaining=unknown");
    });

    test("the per-user cap refuses the 31st call for that user only, as a normal result", async () => {
        // 30 for user A, 1 for user B, 1 for user A after the window.
        const replies = Array.from({ length: USDA_USER_HOURLY_CAP + 2 }, () =>
            replyJson(searchBanana),
        );
        const h = harness(replies);
        for (let i = 0; i < USDA_USER_HOURLY_CAP; i++) {
            expect((await searchUsda("banana", USER_A, h.deps)).status).toBe(
                "ok",
            );
        }
        expect(await searchUsda("banana", USER_A, h.deps)).toEqual({
            status: "unavailable",
            reason: "user_cap",
            until: T0 + USDA_QUOTA_WINDOW_MS,
        });
        expect(h.calls).toHaveLength(USDA_USER_HOURLY_CAP);
        expect((await searchUsda("banana", USER_B, h.deps)).status).toBe("ok");
        h.advance(USDA_QUOTA_WINDOW_MS);
        expect((await searchUsda("banana", USER_A, h.deps)).status).toBe("ok");
        expect(
            h.logs.every((l) => !l.includes(USER_A) && !l.includes(USER_B)),
        ).toBe(true);
    });
});

describe("getFoodRecord", () => {
    test("a fresh cached record is served with no upstream call, and cache hits never use the cap", async () => {
        const h = harness([replyJson(detailSr)]);
        h.cacheRows.set(173944, {
            record: freshRecord(),
            fetchedAt: T0 - HOUR,
        });
        for (let i = 0; i < USDA_USER_HOURLY_CAP + 5; i++) {
            const out = await getFoodRecord(173944, USER_A, h.deps);
            expect(out.status).toBe("cache");
        }
        expect(h.calls).toHaveLength(0);
        expect(h.logs.at(-1)).toBe(
            "[usda] tool=detail result=cache quota_remaining=unknown",
        );

        // The cap is untouched, so one real call still goes upstream.
        expect(
            (
                await getFoodRecord(173944, USER_A, {
                    ...h.deps,
                    cache: { get: async () => null, put: async () => {} },
                })
            ).status,
        ).toBe("ok");
        expect(h.calls).toHaveLength(1);
    });

    test("a stale record is refetched, stored with the new fetch time, and the GET carries the nutrient numbers and key header", async () => {
        const h = harness([replyJson(detailSr)]);
        h.cacheRows.set(173944, {
            record: freshRecord(),
            fetchedAt: T0 - USDA_CACHE_TTL_MS - HOUR,
        });
        const out = await getFoodRecord(173944, USER_A, h.deps);
        expect(out.status).toBe("ok");
        expect(out.status === "ok" && out.record.name).toBe("Bananas, raw");
        const call = h.calls[0]!;
        expect(call.method).toBe("GET");
        expect(call.body).toBeUndefined();
        expect(call.url).toBe(
            `${USDA_API_BASE}/food/173944?format=full&nutrients=${USDA_NUTRIENT_NUMBERS.join(",")}`,
        );
        expect(call.headers["X-Api-Key"]).toBe(KEY);
        expect(call.url.includes(KEY)).toBe(false);
        expect(h.cacheRows.get(173944)!.fetchedAt).toBe(T0);
        expect(h.logs).toEqual([
            "[usda] tool=detail result=ok quota_remaining=2999",
        ]);
    });

    test("a JSON 400 on the detail call is no_match, not a failure", async () => {
        const h = harness([replyJson({ error: { code: "BAD_REQUEST" } }, 400)]);
        expect(await getFoodRecord(1, USER_A, h.deps)).toEqual({
            status: "no_match",
        });
        expect(h.logs).toEqual([
            "[usda] tool=detail result=no_match quota_remaining=2999",
        ]);
    });

    test("a 404 is no_match, a 403 is auth_failed, a Branded record is no_match", async () => {
        const h404 = harness([replyJson({ error: "not found" }, 404)]);
        expect(await getFoodRecord(1, USER_A, h404.deps)).toEqual({
            status: "no_match",
        });
        const h403 = harness([
            replyJson({ error: { code: "API_KEY_INVALID" } }, 403),
        ]);
        expect(await getFoodRecord(1, USER_A, h403.deps)).toEqual({
            status: "auth_failed",
        });
        const hBranded = harness([
            replyJson({
                fdcId: 1,
                description: "Brand",
                dataType: "Branded",
                foodNutrients: [],
            }),
        ]);
        expect(await getFoodRecord(1, USER_A, hBranded.deps)).toEqual({
            status: "no_match",
        });
        expect(hBranded.cacheRows.size).toBe(0);
    });

    test("an unusable upstream body throws an UpstreamError and caches nothing", async () => {
        const h = harness([replyJson({ unexpected: true })]);
        await expect(
            getFoodRecord(173944, USER_A, h.deps),
        ).rejects.toBeInstanceOf(UpstreamError);
        expect(h.cacheRows.size).toBe(0);
    });

    test("a 429 while paused: a fresh record still serves, a stale one does not", async () => {
        const h = harness([
            replyJson({ error: "slow" }, 429, { "x-ratelimit-remaining": "0" }),
        ]);
        expect(await getFoodRecord(173944, USER_A, h.deps)).toEqual({
            status: "unavailable",
            reason: "paused",
            until: T0 + USDA_PAUSE_MS,
        });
        h.cacheRows.set(999, {
            record: { ...freshRecord(), fdc_id: 999 },
            fetchedAt: T0 - 31 * 24 * HOUR,
        });
        expect((await getFoodRecord(999, USER_A, h.deps)).status).toBe(
            "unavailable",
        );
        expect(h.calls).toHaveLength(1);
    });

    test("with no key a fresh cached record still serves; a miss says not configured", async () => {
        const h = harness([], { env: {} });
        h.cacheRows.set(173944, { record: freshRecord(), fetchedAt: T0 });
        expect((await getFoodRecord(173944, USER_A, h.deps)).status).toBe(
            "cache",
        );
        expect(await getFoodRecord(5, USER_A, h.deps)).toEqual({
            status: "unavailable",
            reason: "not_configured",
            until: null,
        });
        expect(h.calls).toHaveLength(0);
    });
});

describe("fetchFoodDetail", () => {
    test("returns the normalized record of the upstream body", async () => {
        const h = harness([replyJson(detailFndds)]);
        const out = await fetchFoodDetail(2709224, h.deps);
        expect(out.kind).toBe("ok");
        if (out.kind === "ok") {
            expect(out.record.data_type satisfies UsdaDataType);
            expect(out.record.portions[0]).toEqual({
                label: "1 banana",
                grams: 126,
            });
        }
    });
});

describe("the Supabase food_cache store", () => {
    const rows: Array<Record<string, unknown>> = [];
    let spy: ReturnType<typeof spyOn>;
    const envBefore = {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_SECRET_KEY,
    };

    beforeAll(() => {
        process.env.SUPABASE_URL ??= "http://supabase.test";
        process.env.SUPABASE_SECRET_KEY ??= "test-key";
        spy = spyOn(globalThis, "fetch").mockImplementation((async (
            input: string | URL | Request,
            init?: RequestInit,
        ) => {
            const req =
                input instanceof Request
                    ? new Request(input, init)
                    : new Request(input.toString(), init);
            const url = new URL(req.url);
            if (url.pathname !== "/rest/v1/food_cache") {
                throw new Error(`unexpected request ${req.url}`);
            }
            if (req.method === "POST") {
                const body = JSON.parse(await req.text()) as Record<
                    string,
                    unknown
                >;
                const i = rows.findIndex(
                    (r) =>
                        r.source === body.source &&
                        r.source_id === body.source_id,
                );
                if (i >= 0) rows[i] = body;
                else rows.push(body);
                return new Response(null, { status: 201 });
            }
            if (req.method === "GET") {
                const eq = (k: string) =>
                    url.searchParams.get(k)?.replace(/^eq\./, "");
                const found = rows.filter(
                    (r) =>
                        r.source === eq("source") &&
                        r.source_id === eq("source_id"),
                );
                return new Response(JSON.stringify(found), {
                    status: 200,
                    headers: { "content-type": "application/json" },
                });
            }
            throw new Error(`unexpected ${req.method}`);
        }) as typeof fetch);
    });

    afterAll(() => {
        spy.mockRestore();
        if (envBefore.url === undefined) delete process.env.SUPABASE_URL;
        if (envBefore.key === undefined) delete process.env.SUPABASE_SECRET_KEY;
    });

    test("a written record reads back with its fetch time, under source usda and the id as text", async () => {
        const record = freshRecord();
        const at = Date.parse("2026-10-09T08:00:00.000Z");
        await writeUsdaFoodCache(record, at);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ source: "usda", source_id: "173944" });
        const back = await readUsdaFoodCache(173944);
        expect(back).toEqual({ record, fetchedAt: at });
    });

    test("an absent id reads as a miss", async () => {
        expect(await readUsdaFoodCache(424242)).toBeNull();
    });
});

describe("formatUsdaRecord", () => {
    test("a record with no nutrient values says so on both the per 100 g and the scaled line", () => {
        const record: UsdaRecord = {
            fdc_id: 9,
            name: "Empty food",
            data_type: "SR Legacy",
            per100g: {},
            portions: [],
        };
        const text = formatUsdaRecord(record, 150);
        expect(text).toContain("Per 100 g: no nutrient values in this record");
        expect(text).toContain("For 150 g: no nutrient values in this record");
        expect(text).not.toMatch(/For 150 g: \n/);
    });
});
