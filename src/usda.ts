// USDA FoodData Central client: the two read-only lookups behind search_foods
// and get_food_macros, plus the pure rules they rest on.
//
// Pure (no Supabase, no HTTP, no mcp.ts import): sanitizeQuery, the nutrient
// mapping for both row shapes (search rows and detail rows), portion
// extraction per data type, candidate trimming and the detail normalizer
// (normalizeDetail, the UsdaNormalizer of src/usda-record.ts).
//
// Adapter: searchUsda, getFoodRecord and fetchFoodDetail, with fetch, clock,
// env, the food_cache store, quota state and the log line all injected, so the
// tests run with no network and no database.
//
// Quota state lives in process memory: the reserve, the 429 pause and the
// per-user hourly cap are per instance. A second replica keeps its own count,
// so a 429 on one instance does not pause the others, and the cap is a
// per-instance bound. The user id is only a Map key here; it is never logged or
// sent upstream. The API key is sent only in the X-Api-Key header, never in a
// URL, and the adapter never puts upstream text or URLs into an error.

import { UpstreamError } from "./errors.js";
import { readUsdaFoodCache, writeUsdaFoodCache } from "./supabase.js";
import {
    type UsdaDataType,
    type UsdaPortion,
    type UsdaRecord,
} from "./usda-record.js";
import type { MealNutrientKey } from "./meal-items.js";

export const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1";
export const USDA_REQUEST_TIMEOUT_MS = 8_000;
/** Upstream calls stop while the last-read x-ratelimit-remaining is at or
 * below this, so the key keeps headroom for other users. */
export const USDA_QUOTA_RESERVE = 300;
/** How long every upstream call pauses after a 429. */
export const USDA_PAUSE_MS = 60 * 60 * 1000;
/** The window a remaining-count reading is taken to refresh over. The key's
 * limit is hourly (x-ratelimit-limit), and the headers carry no reset time. */
export const USDA_QUOTA_WINDOW_MS = 60 * 60 * 1000;
/** Upstream calls one user may make in a rolling hour. Cache hits never count. */
export const USDA_USER_HOURLY_CAP = 30;
/** How long a food_cache record counts as fresh for get_food_macros. */
export const USDA_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const USDA_MAX_CANDIDATES = 10;
/** Portions kept per record, not counting the implicit "100 g". */
export const USDA_MAX_PORTIONS = 8;

/** The data types search covers. Branded foods are out of scope. */
export const USDA_SEARCH_DATA_TYPES: readonly UsdaDataType[] = [
    "Foundation",
    "SR Legacy",
    "Survey (FNDDS)",
];

/** The FoodData Central nutrient numbers this server reads, as strings (the
 * search rows and detail rows both carry the number as a string). */
export const USDA_NUTRIENT_NUMBERS: readonly string[] = [
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
];

/** Which FoodData Central number feeds each meal nutrient. Calories take the
 * first number present: 208 (Energy), else 958 and 957, the Atwater factors
 * that some Foundation foods carry alone. */
const NUTRIENT_SOURCES: ReadonlyArray<[MealNutrientKey, readonly string[]]> = [
    ["calories", ["208", "958", "957"]],
    ["protein_g", ["203"]],
    ["fat_g", ["204"]],
    ["carbs_g", ["205"]],
    ["saturated_fat_g", ["606"]],
    ["trans_fat_g", ["605"]],
    ["fiber_g", ["291"]],
    ["sugar_g", ["269"]],
    ["added_sugar_g", ["539"]],
    ["alcohol_g", ["221"]],
    ["caffeine_mg", ["262"]],
];

export const USDA_NOT_CONFIGURED_TEXT =
    "USDA data is not configured on this server.";
export const USDA_AUTH_FAILED_TEXT = "USDA data is unavailable right now.";
export const USDA_NO_MATCH_TEXT =
    "USDA FoodData Central has no generic food matching that search. Its names are in English.";
export const USDA_NO_RECORD_TEXT = "No USDA record with that id.";
export const USDA_BAD_QUERY_TEXT = "USDA could not process that search.";

// ---------- Pure rules ----------

/** Turns the user's query into the text sent upstream: the operators USDA
 * reads as syntax become spaces, runs of spaces collapse, and no "+" is
 * added (requiring every word cut the hit rate; ranking experiment). */
export function sanitizeQuery(query: string): string {
    return query
        .replace(/[+\-"*():~^]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/** The nutrient numbers and values of a row list, from either row shape: a
 * search row `{ nutrientNumber, value }` or a detail row `{ nutrient: { number },
 * amount }`. The first row for a number wins; a non-finite value is dropped. */
function nutrientValues(foodNutrients: unknown): Map<string, number> {
    const out = new Map<string, number>();
    if (!Array.isArray(foodNutrients)) return out;
    for (const row of foodNutrients) {
        if (!row || typeof row !== "object") continue;
        const r = row as Record<string, unknown>;
        const nutrient =
            r.nutrient && typeof r.nutrient === "object"
                ? (r.nutrient as Record<string, unknown>)
                : null;
        const number = String(r.nutrientNumber ?? nutrient?.number ?? "");
        const value = typeof r.value === "number" ? r.value : r.amount;
        if (number === "" || typeof value !== "number") continue;
        if (!Number.isFinite(value) || out.has(number)) continue;
        out.set(number, value);
    }
    return out;
}

/** Every meal nutrient key, mapped from a row list. A nutrient the record does
 * not carry is null, never 0. */
export function mapNutrients(
    foodNutrients: unknown,
): Record<MealNutrientKey, number | null> {
    const values = nutrientValues(foodNutrients);
    const out = {} as Record<MealNutrientKey, number | null>;
    for (const [key, numbers] of NUTRIENT_SOURCES) {
        out[key] = null;
        for (const number of numbers) {
            const v = values.get(number);
            if (v !== undefined) {
                out[key] = v;
                break;
            }
        }
    }
    return out;
}

function fmtAmount(amount: number): string {
    return String(Math.round(amount * 100) / 100);
}

/** One portion's label and weight, or null when the row cannot name a serving
 * for this data type. */
function portionOf(dataType: UsdaDataType, raw: unknown): UsdaPortion | null {
    if (!raw || typeof raw !== "object") return null;
    const p = raw as Record<string, unknown>;
    const grams = p.gramWeight;
    if (typeof grams !== "number" || !(grams > 0)) return null;
    let label: string;
    if (dataType === "Survey (FNDDS)") {
        // portionDescription is already "1 banana"; the numeric modifier is a
        // code and is ignored.
        label =
            typeof p.portionDescription === "string"
                ? p.portionDescription.trim()
                : "";
    } else {
        const unit =
            p.measureUnit && typeof p.measureUnit === "object"
                ? (p.measureUnit as Record<string, unknown>).name
                : undefined;
        const parts: string[] = [];
        // SR Legacy has no real unit ("undetermined"); the modifier is the
        // whole description. Foundation names its unit, then the modifier.
        if (
            dataType === "Foundation" &&
            typeof unit === "string" &&
            unit.trim() !== "" &&
            unit.toLowerCase() !== "undetermined"
        )
            parts.push(unit.trim());
        if (typeof p.modifier === "string" && p.modifier.trim() !== "")
            parts.push(p.modifier.trim());
        const amount =
            typeof p.amount === "number" && p.amount > 0 ? p.amount : 1;
        label =
            parts.length > 0 ? `${fmtAmount(amount)} ${parts.join(", ")}` : "";
    }
    if (label === "" || /quantity not specified/i.test(label)) return null;
    return { label, grams };
}

/** The portions of a record: labelled, weighted, sorted by label, deduped on
 * label and weight, capped at USDA_MAX_PORTIONS. A record with none returns []. */
export function extractPortions(
    dataType: UsdaDataType,
    foodPortions: unknown,
): UsdaPortion[] {
    if (!Array.isArray(foodPortions)) return [];
    const portions = foodPortions
        .map((p) => portionOf(dataType, p))
        .filter((p): p is UsdaPortion => p !== null)
        .sort((a, b) =>
            a.label < b.label ? -1 : a.label > b.label ? 1 : a.grams - b.grams,
        );
    const out: UsdaPortion[] = [];
    for (const p of portions) {
        const dup = out.some((q) => q.label === p.label && q.grams === p.grams);
        if (!dup) out.push(p);
        if (out.length === USDA_MAX_PORTIONS) break;
    }
    return out;
}

/** The values of one record scaled to `amountG` grams, rounded to 2 decimals
 * like meal items, except calories, which meals store as whole kcal.
 * Nutrients the record does not carry stay absent. */
export function scaleValues(
    per100g: Partial<Record<MealNutrientKey, number>>,
    amountG: number,
): Partial<Record<MealNutrientKey, number>> {
    const out: Partial<Record<MealNutrientKey, number>> = {};
    for (const [key, v] of Object.entries(per100g) as Array<
        [MealNutrientKey, number]
    >) {
        const scaled = (v * amountG) / 100;
        out[key] =
            key === "calories"
                ? Math.round(scaled)
                : Math.round(scaled * 100) / 100;
    }
    return out;
}

export interface UsdaCandidate {
    fdc_id: number;
    description: string;
    data_type: UsdaDataType;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
}

function isDataType(v: unknown): v is UsdaDataType {
    return (
        typeof v === "string" &&
        (USDA_SEARCH_DATA_TYPES as readonly string[]).includes(v)
    );
}

/** The candidate list of a search response: the foods of the three data types,
 * each with its id, description and the four macros per 100 g, trimmed to
 * `max`. Every other row (and every nutrient but these four) is dropped. */
export function candidatesFrom(
    raw: unknown,
    max: number = USDA_MAX_CANDIDATES,
): UsdaCandidate[] {
    if (!raw || typeof raw !== "object") return [];
    const foods = (raw as Record<string, unknown>).foods;
    if (!Array.isArray(foods)) return [];
    const out: UsdaCandidate[] = [];
    for (const f of foods) {
        if (out.length >= max) break;
        if (!f || typeof f !== "object") continue;
        const r = f as Record<string, unknown>;
        const description =
            typeof r.description === "string" ? r.description.trim() : "";
        if (
            !Number.isSafeInteger(r.fdcId) ||
            (r.fdcId as number) <= 0 ||
            description === "" ||
            !isDataType(r.dataType)
        )
            continue;
        const n = mapNutrients(r.foodNutrients);
        out.push({
            fdc_id: r.fdcId as number,
            description,
            data_type: r.dataType,
            calories: n.calories,
            protein_g: n.protein_g,
            carbs_g: n.carbs_g,
            fat_g: n.fat_g,
        });
    }
    return out;
}

/** A FoodData Central detail response as the cache stores it (UsdaRecord), or
 * null when the response is not a usable record. Nutrients a record does not
 * carry are left out of per100g, so absent means "not recorded". */
export function normalizeDetail(raw: unknown): UsdaRecord | null {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const description =
        typeof r.description === "string" ? r.description.trim() : "";
    if (
        !Number.isSafeInteger(r.fdcId) ||
        (r.fdcId as number) <= 0 ||
        description === "" ||
        !isDataType(r.dataType)
    )
        return null;
    const values = mapNutrients(r.foodNutrients);
    const per100g: UsdaRecord["per100g"] = {};
    for (const [key, v] of Object.entries(values) as Array<
        [MealNutrientKey, number | null]
    >) {
        if (v !== null) per100g[key] = v;
    }
    return {
        fdc_id: r.fdcId as number,
        name: description,
        data_type: r.dataType,
        per100g,
        portions: extractPortions(r.dataType, r.foodPortions),
    };
}

// ---------- Quota, reserve and per-user cap (in-process state) ----------

export interface UsdaQuotaState {
    /** The last x-ratelimit-remaining read, or null when the last response had
     * no such header (unknown: calls continue). */
    remaining: number | null;
    /** Clock ms when `remaining` was read. */
    remainingAt: number;
    /** Clock ms until which every upstream call pauses after a 429; 0 when not. */
    pausedUntil: number;
    /** Upstream call times per user id, for the rolling hourly cap. */
    userCalls: Map<string, number[]>;
    /** Upstream calls sent and not yet answered. Each will spend one unit of the
     * key's quota that the last reading does not include yet, so the reserve
     * check subtracts them; without this a burst admitted in one tick all passes. */
    inFlight: number;
}

export function createUsdaState(): UsdaQuotaState {
    return {
        remaining: null,
        remainingAt: 0,
        pausedUntil: 0,
        userCalls: new Map(),
        inFlight: 0,
    };
}

/** The time until which upstream calls are blocked, and why, or null. */
export function quotaBlock(
    state: UsdaQuotaState,
    now: number,
): { until: number; reason: "paused" | "reserve" } | null {
    if (state.pausedUntil > now)
        return { until: state.pausedUntil, reason: "paused" };
    if (
        state.remaining !== null &&
        state.remaining - state.inFlight <= USDA_QUOTA_RESERVE
    ) {
        const until = state.remainingAt + USDA_QUOTA_WINDOW_MS;
        if (until > now) return { until, reason: "reserve" };
    }
    return null;
}

/** The time when this user's hourly cap next frees a call, or null while the
 * user still has calls left. Prunes the user's expired calls as it reads. */
export function userCapBlock(
    state: UsdaQuotaState,
    userId: string,
    now: number,
): number | null {
    const calls = (state.userCalls.get(userId) ?? []).filter(
        (t) => t > now - USDA_QUOTA_WINDOW_MS,
    );
    if (calls.length === 0) state.userCalls.delete(userId);
    else state.userCalls.set(userId, calls);
    if (calls.length < USDA_USER_HOURLY_CAP) return null;
    return Math.min(...calls) + USDA_QUOTA_WINDOW_MS;
}

/** Counts one upstream call against the user. Sweeps other users' expired
 * entries once the map grows, so idle users do not accumulate. */
export function chargeUserCall(
    state: UsdaQuotaState,
    userId: string,
    now: number,
): void {
    const calls = state.userCalls.get(userId) ?? [];
    calls.push(now);
    state.userCalls.set(userId, calls);
    if (state.userCalls.size > 1_000) {
        for (const [id, times] of state.userCalls) {
            if (times.every((t) => t <= now - USDA_QUOTA_WINDOW_MS))
                state.userCalls.delete(id);
        }
    }
}

/** The quota reading of one response, or null when the header is absent, blank
 * or not a count. A blank value must not parse as 0, which would trip the
 * reserve for an hour. */
function readRemaining(headers: Headers): number | null {
    const v = headers.get("x-ratelimit-remaining")?.trim();
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

// ---------- Text helpers for the tools ----------

/** "21:30 (Europe/Kyiv)", or "21:30 (UTC)" when no usable zone is given. */
export function usdaUntilLabel(
    until: number,
    timeZone?: string | null,
): string {
    let zone = "UTC";
    if (timeZone) {
        try {
            new Intl.DateTimeFormat("en-GB", { timeZone });
            zone = timeZone;
        } catch {
            zone = "UTC";
        }
    }
    const hhmm = new Intl.DateTimeFormat("en-GB", {
        timeZone: zone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).format(new Date(until));
    return `${hhmm} (${zone})`;
}

/** The normal (non-error) result text while USDA cannot be called. */
export function usdaUnavailableText(
    until: number | null,
    timeZone?: string | null,
): string {
    if (until === null) return USDA_NOT_CONFIGURED_TEXT;
    return `USDA data is unavailable until ${usdaUntilLabel(until, timeZone)}.`;
}

// ---------- Logging ----------

export type UsdaLogTool = "search" | "detail";
export type UsdaLogResult =
    | "ok"
    | "cache"
    | "no_match"
    | "bad_query"
    | "unavailable"
    | "auth_failed"
    | "upstream_error";

/** The one runtime-log line per USDA tool call. Carries no query text, id, key
 * or user id. */
export function usdaLogLine(
    tool: UsdaLogTool,
    result: UsdaLogResult,
    quotaRemaining: number | null,
): string {
    return `[usda] tool=${tool} result=${result} quota_remaining=${quotaRemaining ?? "unknown"}`;
}

// ---------- Adapter ----------

export interface UsdaCacheStore {
    get(
        fdcId: number,
    ): Promise<{ record: UsdaRecord; fetchedAt: number } | null>;
    put(record: UsdaRecord, fetchedAt: number): Promise<void>;
}

// Delegates at call time, not at module load, so a test that swaps the
// Supabase functions still takes effect for the production store.
export const supabaseUsdaCache: UsdaCacheStore = {
    get: (fdcId) => readUsdaFoodCache(fdcId),
    put: (record, fetchedAt) => writeUsdaFoodCache(record, fetchedAt),
};

export type UsdaFetch = (
    url: string,
    init: {
        method: "GET" | "POST";
        headers: Record<string, string>;
        body?: string;
        signal: AbortSignal;
    },
) => Promise<Response>;

export interface UsdaDeps {
    fetch: UsdaFetch;
    now: () => number;
    env: Record<string, string | undefined>;
    cache: UsdaCacheStore;
    state: UsdaQuotaState;
    log: (line: string) => void;
}

const processState = createUsdaState();

export function usdaDeps(overrides: Partial<UsdaDeps> = {}): UsdaDeps {
    return {
        fetch: (url, init) => fetch(url, init),
        now: () => Date.now(),
        env: process.env,
        cache: supabaseUsdaCache,
        state: processState,
        log: (line) => console.log(line),
        ...overrides,
    };
}

type UpstreamReply =
    | { kind: "ok"; body: unknown }
    | { kind: "bad_request" }
    | { kind: "not_found" }
    | { kind: "auth_failed" }
    | { kind: "rate_limited" };

/** One upstream call. A 429 pauses every call for USDA_PAUSE_MS. A body that is
 * not JSON (an HTML page from the edge happens, whatever the status) and a 5xx
 * are retried once, as are network errors and timeouts; the retry's failure is
 * thrown as UpstreamError. A JSON 400, 403 (invalid key) and 404 are answers.
 * Any other status is not retried: it would not change on a second call. A
 * response without the quota header keeps the last known reading. */
async function send(
    d: UsdaDeps,
    key: string,
    method: "GET" | "POST",
    path: string,
    body?: unknown,
): Promise<UpstreamReply> {
    d.state.inFlight++;
    try {
        for (let attempt = 1; attempt <= 2; attempt++) {
            let res: Response;
            try {
                res = await d.fetch(`${USDA_API_BASE}${path}`, {
                    method,
                    headers: {
                        "X-Api-Key": key,
                        Accept: "application/json",
                        ...(body !== undefined
                            ? { "Content-Type": "application/json" }
                            : {}),
                    },
                    body: body === undefined ? undefined : JSON.stringify(body),
                    signal: AbortSignal.timeout(USDA_REQUEST_TIMEOUT_MS),
                });
            } catch {
                continue;
            }
            const remaining = readRemaining(res.headers);
            if (remaining !== null) {
                d.state.remaining = remaining;
                d.state.remainingAt = d.now();
            }
            if (res.status === 429) {
                d.state.pausedUntil = d.now() + USDA_PAUSE_MS;
                return { kind: "rate_limited" };
            }
            let json: unknown;
            try {
                json = JSON.parse(await res.text());
            } catch {
                continue;
            }
            if (res.status >= 200 && res.status < 300)
                return { kind: "ok", body: json };
            if (res.status === 400) return { kind: "bad_request" };
            if (res.status === 403) return { kind: "auth_failed" };
            if (res.status === 404) return { kind: "not_found" };
            if (res.status < 500)
                throw new UpstreamError(
                    "usda_unavailable",
                    "USDA returned an unexpected status",
                );
        }
        throw new UpstreamError(
            "usda_unavailable",
            "USDA request failed after one retry",
        );
    } finally {
        d.state.inFlight--;
    }
}

function apiKey(d: UsdaDeps): string | null {
    const key = d.env.USDA_API_KEY?.trim();
    return key ? key : null;
}

/** The gate every upstream call passes: the pause and reserve, then the user's
 * hourly cap. Returns the refusal, or null after charging the call. */
function gate(
    d: UsdaDeps,
    userId: string,
): { reason: UsdaUnavailableReason; until: number } | null {
    const now = d.now();
    const block = quotaBlock(d.state, now);
    if (block) return { reason: block.reason, until: block.until };
    const capUntil = userCapBlock(d.state, userId, now);
    if (capUntil !== null) return { reason: "user_cap", until: capUntil };
    chargeUserCall(d.state, userId, now);
    return null;
}

export type UsdaUnavailableReason =
    "not_configured" | "paused" | "reserve" | "user_cap";

export type UsdaSearchOutcome =
    | { status: "ok"; candidates: UsdaCandidate[] }
    | { status: "no_match" }
    | { status: "bad_query" }
    | { status: "auth_failed" }
    | {
          status: "unavailable";
          reason: UsdaUnavailableReason;
          until: number | null;
      };

export type UsdaRecordOutcome =
    | { status: "ok" | "cache"; record: UsdaRecord; fetchedAt: number }
    | { status: "no_match" }
    | { status: "auth_failed" }
    | {
          status: "unavailable";
          reason: UsdaUnavailableReason;
          until: number | null;
      };

/** Searches the three generic data types with a POST and returns the trimmed
 * candidates. Search results are not cached. Charges the user's hourly cap. */
export async function searchUsda(
    query: string,
    userId: string,
    overrides: Partial<UsdaDeps> = {},
): Promise<UsdaSearchOutcome> {
    const d = usdaDeps(overrides);
    const key = apiKey(d);
    if (!key) {
        d.log(usdaLogLine("search", "unavailable", d.state.remaining));
        return { status: "unavailable", reason: "not_configured", until: null };
    }
    const refused = gate(d, userId);
    if (refused) {
        d.log(usdaLogLine("search", "unavailable", d.state.remaining));
        return { status: "unavailable", ...refused };
    }
    let outcome: UsdaSearchOutcome;
    try {
        const reply = await send(d, key, "POST", "/foods/search", {
            query: sanitizeQuery(query),
            dataType: [...USDA_SEARCH_DATA_TYPES],
            pageSize: USDA_MAX_CANDIDATES,
        });
        outcome = searchOutcomeOf(reply, d);
    } catch (err) {
        d.log(usdaLogLine("search", "upstream_error", d.state.remaining));
        throw err;
    }
    const result: UsdaLogResult =
        outcome.status === "ok"
            ? "ok"
            : outcome.status === "unavailable"
              ? "unavailable"
              : outcome.status;
    d.log(usdaLogLine("search", result, d.state.remaining));
    return outcome;
}

function searchOutcomeOf(reply: UpstreamReply, d: UsdaDeps): UsdaSearchOutcome {
    switch (reply.kind) {
        case "ok": {
            const candidates = candidatesFrom(reply.body);
            return candidates.length > 0
                ? { status: "ok", candidates }
                : { status: "no_match" };
        }
        case "bad_request":
            return { status: "bad_query" };
        case "not_found":
            return { status: "no_match" };
        case "auth_failed":
            return { status: "auth_failed" };
        case "rate_limited":
            return {
                status: "unavailable",
                reason: "paused",
                until: d.state.pausedUntil,
            };
    }
}

export type UsdaDetailFetch =
    | { kind: "ok"; record: UsdaRecord }
    | { kind: "no_match" }
    | { kind: "auth_failed" }
    | { kind: "rate_limited"; until: number };

/** One upstream detail call, no cache and no quota gate: the raw result of
 * GET /food/{id}. A usable record of an out-of-scope data type is no_match; a
 * response that is not a record at all is UpstreamError. */
export async function fetchFoodDetail(
    fdcId: number,
    overrides: Partial<UsdaDeps> = {},
): Promise<UsdaDetailFetch> {
    const d = usdaDeps(overrides);
    const key = apiKey(d);
    if (!key) throw new UpstreamError("usda_unavailable", "USDA key not set");
    const nutrients = USDA_NUTRIENT_NUMBERS.join(",");
    const reply = await send(
        d,
        key,
        "GET",
        `/food/${fdcId}?format=full&nutrients=${nutrients}`,
    );
    switch (reply.kind) {
        case "ok": {
            const record = normalizeDetail(reply.body);
            if (record) return { kind: "ok", record };
            const dataType = (reply.body as Record<string, unknown> | null)
                ?.dataType;
            if (typeof dataType === "string" && !isDataType(dataType))
                return { kind: "no_match" };
            throw new UpstreamError(
                "usda_unavailable",
                "USDA returned a response that is not a food record",
            );
        }
        case "bad_request":
            // The id is the only caller-supplied part of a detail request, and
            // the nutrient list is fixed, so a JSON 400 means no such record.
            return { kind: "no_match" };
        case "not_found":
            return { kind: "no_match" };
        case "auth_failed":
            return { kind: "auth_failed" };
        case "rate_limited":
            return { kind: "rate_limited", until: d.state.pausedUntil };
    }
}

/** The normalized record for one FoodData Central id: a fresh food_cache row
 * is served without any upstream call, cache hits never count against the
 * user's cap, and a miss fetches, stores the record and returns it. While
 * upstream is paused, at the reserve or over the user's cap, only a fresh
 * cached record is served; anything else is unavailable. Charges the cap. */
export async function getFoodRecord(
    fdcId: number,
    userId: string,
    overrides: Partial<UsdaDeps> = {},
): Promise<UsdaRecordOutcome> {
    const d = usdaDeps(overrides);
    const cached = await d.cache.get(fdcId);
    const fresh =
        cached !== null && d.now() - cached.fetchedAt <= USDA_CACHE_TTL_MS;
    if (fresh) {
        d.log(usdaLogLine("detail", "cache", d.state.remaining));
        return {
            status: "cache",
            record: cached.record,
            fetchedAt: cached.fetchedAt,
        };
    }
    const finish = (outcome: UsdaRecordOutcome): UsdaRecordOutcome => {
        const result: UsdaLogResult =
            outcome.status === "ok" || outcome.status === "cache"
                ? "ok"
                : outcome.status === "unavailable"
                  ? "unavailable"
                  : outcome.status;
        d.log(usdaLogLine("detail", result, d.state.remaining));
        return outcome;
    };
    if (!apiKey(d))
        return finish({
            status: "unavailable",
            reason: "not_configured",
            until: null,
        });
    const refused = gate(d, userId);
    if (refused) return finish({ status: "unavailable", ...refused });
    let detail: UsdaDetailFetch;
    try {
        detail = await fetchFoodDetail(fdcId, d);
    } catch (err) {
        d.log(usdaLogLine("detail", "upstream_error", d.state.remaining));
        throw err;
    }
    switch (detail.kind) {
        case "ok":
            await d.cache.put(detail.record, d.now());
            return finish({
                status: "ok",
                record: detail.record,
                fetchedAt: d.now(),
            });
        case "no_match":
            return finish({ status: "no_match" });
        case "auth_failed":
            return finish({ status: "auth_failed" });
        case "rate_limited":
            return finish({
                status: "unavailable",
                reason: "paused",
                until: detail.until,
            });
    }
}
