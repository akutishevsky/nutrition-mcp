// The web dashboard's JSON API and widget route.
//
//   GET /api/dashboard/tool/:name?args=<json>   a widget payload, from the real tool
//   GET /api/dashboard/status                   profile basics and "has anything been logged"
//   GET /api/dashboard/calendar?from=&to=       per-day calories against the goal (≤ 42 days)
//   GET /api/dashboard/search?q=                meals and saved meals matching a query
//   GET /api/dashboard/saved-meals              every saved meal, one serving each
//   GET /api/dashboard/measurements             latest and first value per body site
//   GET /dashboard/widget/:key                  a widget's assembled HTML (public, no auth)
//
// Widget payloads come from running the REAL registered read tool in-process:
// buildMcpServer with surface "dashboard", a v2 Client over InMemoryTransport,
// one tools/call, and the result's structuredContent and _meta handed back
// (never `content`, which is model-facing text). So a widget on the dashboard
// renders exactly what it renders in a chat, from the same code, and the
// frozen output schemas are untouched. The "dashboard" surface tells
// withAnalytics to write no tool_analytics row and no `[analytics]` line: a
// page view is not a tool call, and must not move per-user usage, the
// legacy-era retirement query or anything health-related.
//
// Everything else is plain JSON built here from the src/supabase.ts readers
// (src/dashboard-queries.ts for the one that did not exist), each injectable
// through `deps.readers` so tests run without a database.
//
// Envelope: every body has `ok`; a failure is `{ ok:false, error, message,
// ref? }` with `error` from DashboardErrorCode. Every handler catches
// everything, so nothing here reaches app.onError, and every call writes
// exactly one `[dashboard] route=… result=…` line, which never carries a user
// id, email, date or query text (a failed tool read adds one
// `[dashboard] tool-error` line from withAnalytics, joined by ref).
//
// Mounted at "/" by src/index.ts, so — as in createOAuthRouter and
// createHealthSyncRouter — no middleware here is registered on "*": a sub-app's
// wildcard middleware would run on every path of the parent app.
import { Hono, type Context, type MiddlewareHandler, type Next } from "hono";
import { Client } from "@modelcontextprotocol/client";
import { InMemoryTransport } from "@modelcontextprotocol/server";
import {
    DASHBOARD_ERROR_META_KEY,
    type DashboardErrorMeta,
} from "./analytics.js";
import { newErrorRef } from "./errors.js";
import { goalsOnDate } from "./goals-history.js";
import { dateDiffDays } from "./insights.js";
import { isCalendarDate } from "./health-sync.js";
import { buildMcpServer, type RegistrationFilter } from "./mcp.js";
import { checkDashboardRateLimit, type RateLimitResult } from "./rate-limit.js";
import { tokenizeQuery, type SavedMealSummary } from "./search.js";
import {
    getAllBodyMeasurements,
    getMealItems,
    getMealsInRange,
    getNutritionGoals,
    getNutritionGoalsHistory,
    getProfile,
    getSavedMeals,
    getWaterInRange,
    localeFromProfile,
    preferredLengthUnitFromProfile,
    preferredWeightUnitFromProfile,
    searchMeals,
    searchSavedMeals,
    timezoneFromProfile,
    type BodyMeasurementEntry,
    type Meal,
    type NutritionGoals,
    type Profile,
    type SavedMealWithItems,
    type WaterEntry,
} from "./supabase.js";
import type { NutritionGoalsHistoryRow } from "./goals-history.js";
import type { MealItemValues } from "./meal-items.js";
import { getLastLoggedAt } from "./dashboard-queries.js";
import { dateInTz, formatLocalDateTime, shiftLocalDate } from "./tz.js";
import {
    BODY_MEASUREMENT_KINDS,
    fromMillimetres,
    isLengthUnit,
    type BodyMeasurementKind,
    type LengthUnit,
} from "./units.js";
import { getWidgetHtml } from "./widgets.js";

// ---------- Constants ----------

/** The read tools the dashboard may run: the ones with a widget. Nothing that
 *  writes, and nothing without a widget, is reachable from a browser. */
export const DASHBOARD_TOOLS = [
    "get_nutrition_summary",
    "get_goal_progress",
    "get_trends",
    "get_weight_trends",
    "get_digest",
] as const;
export type DashboardTool = (typeof DASHBOARD_TOOLS)[number];

export function isDashboardTool(name: string): name is DashboardTool {
    return (DASHBOARD_TOOLS as readonly string[]).includes(name);
}

/** The widgets `/dashboard/widget/:key` serves: the five tools' widgets. */
export const DASHBOARD_WIDGETS = [
    "nutrition-summary",
    "goal-progress",
    "trends",
    "weight-trends",
    "digest",
] as const;

/** What a dashboard tool call's server registers: the allowlisted tools and
 *  the widget resource each of them links, nothing else. Every in-process call
 *  builds a server, so registering the other ~48 tools there was pure waste,
 *  and a tool that is not registered cannot be reached even by a bug in the
 *  route's isDashboardTool check. */
export const DASHBOARD_REGISTRATION: RegistrationFilter = {
    tools: new Set<string>(DASHBOARD_TOOLS),
    // mcp.ts registers each widget's resource as "<key>-widget".
    resources: new Set<string>(DASHBOARD_WIDGETS.map((key) => `${key}-widget`)),
};

/** Longest calendar window, inclusive: a 6-week month grid. */
export const CALENDAR_MAX_DAYS = 42;
/** Search query bounds, counted on the trimmed text. */
export const SEARCH_MIN_CHARS = 2;
export const SEARCH_MAX_CHARS = 100;
/** Most meals a search returns, newest first. */
export const SEARCH_MEAL_LIMIT = 50;
/** Longest `args` query value the tool route accepts, before parsing. */
export const TOOL_ARGS_MAX_CHARS = 2000;
/** A day is "on" target within this share of the calorie goal. */
export const CALENDAR_BAND = 0.05;

/** The widget iframe's own CSP: everything inline, nothing fetched, and
 *  framable only by this site (the dashboard page). */
export const WIDGET_CSP =
    "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; frame-ancestors 'self'";

// ---------- Envelope ----------

export type DashboardErrorCode =
    | "unauthenticated"
    | "bad_request"
    | "rate_limited"
    | "unavailable"
    | "server_error";

const STATUS: Record<DashboardErrorCode, 400 | 401 | 429 | 500 | 503> = {
    unauthenticated: 401,
    bad_request: 400,
    rate_limited: 429,
    unavailable: 503,
    server_error: 500,
};

const MESSAGES = {
    unavailable:
        "Nutrition MCP could not read your data just now. Try again in a minute.",
    server_error: "Something went wrong on the Nutrition MCP server.",
} as const;

// What a response the session middleware answered (without the note) means.
const SESSION_STATUS_RESULT: Record<number, DashboardErrorCode> = {
    401: "unauthenticated",
    429: "rate_limited",
    503: "unavailable",
};

const API_HEADERS = { "Cache-Control": "private, no-store" } as const;

type Route =
    "tool" | "status" | "calendar" | "search" | "saved-meals" | "measurements";

interface CallNote {
    result: string;
    tool?: DashboardTool;
    ref?: string;
    error?: string;
}

type Env = {
    Variables: {
        dashboardUserId: string;
        dashNote: CallNote;
    };
};

/** A query or argument the route refuses; its message goes to the caller. */
class BadRequest extends Error {}

/** Thrown around a data read, so a database failure (`unavailable`, retry
 *  later) is told apart from a bug (`server_error`). */
class Unavailable extends Error {
    constructor(readonly inner: unknown) {
        super(inner instanceof Error ? inner.message : String(inner));
    }
}

async function io<T>(p: Promise<T>): Promise<T> {
    try {
        return await p;
    } catch (err) {
        throw new Unavailable(err);
    }
}

export function dashboardLogLine(route: Route, note: CallNote): string {
    let line = `[dashboard] route=${route} result=${note.result}`;
    if (note.tool) line += ` tool=${note.tool}`;
    if (note.ref) line += ` ref=${note.ref}`;
    if (note.error !== undefined)
        line += `: ${JSON.stringify(note.error.slice(0, 500))}`;
    return line;
}

function fail(
    c: Context<Env>,
    error: DashboardErrorCode,
    message: string,
    extra: { ref?: string; headers?: Record<string, string> } = {},
) {
    const note = c.get("dashNote");
    if (note) note.result = error;
    const body: Record<string, unknown> = { ok: false, error, message };
    if (extra.ref) body.ref = extra.ref;
    return c.json(body, STATUS[error], { ...API_HEADERS, ...extra.headers });
}

function ok(c: Context<Env>, body: Record<string, unknown>) {
    c.get("dashNote").result = "ok";
    return c.json({ ok: true, ...body }, 200, API_HEADERS);
}

function rateLimited(c: Context<Env>, r: RateLimitResult) {
    const after = r.retryAfterSeconds ?? 60;
    return fail(
        c,
        "rate_limited",
        `Too many requests. Try again in ${after} seconds.`,
        { headers: { "Retry-After": String(after) } },
    );
}

/** The 400 / 503 / 500 for an error a handler caught; logs under the ref. */
function failFromError(c: Context<Env>, err: unknown) {
    if (err instanceof BadRequest) return fail(c, "bad_request", err.message);
    const ref = newErrorRef();
    const note = c.get("dashNote");
    note.ref = ref;
    const inner = err instanceof Unavailable ? err.inner : err;
    note.error = inner instanceof Error ? inner.message : String(inner);
    if (err instanceof Unavailable) {
        return fail(c, "unavailable", `${MESSAGES.unavailable} (ref ${ref})`, {
            ref,
            headers: { "Retry-After": "30" },
        });
    }
    return fail(c, "server_error", `${MESSAGES.server_error} (ref ${ref})`, {
        ref,
    });
}

// ---------- Tool runner ----------

/** What a tool call hands back to the route: the MCP CallToolResult fields
 *  the route reads. */
export interface ToolRunResult {
    structuredContent?: Record<string, unknown>;
    _meta?: Record<string, unknown>;
    content?: unknown[];
    isError?: boolean;
}

export type ToolRunner = (
    userId: string,
    name: DashboardTool,
    args: Record<string, unknown>,
    baseUrl: string,
) => Promise<ToolRunResult>;

/**
 * Run one registered tool in-process for this user, as the dashboard surface.
 * A fresh server per call, like /mcp's stateless leg: buildMcpServer reads the
 * profile once and registers the tools with this user's preferences, so the
 * result is byte-for-byte what a chat client gets for the same arguments. It
 * registers only DASHBOARD_REGISTRATION, not the whole /mcp tool set.
 *
 * A throw from building the server is reported as `unavailable`: its one
 * runtime failure is the profile read (registration is synchronous and
 * deterministic, so a bug there fails every test that builds the server), and
 * it happens before any tool handler, so withAnalytics never tags it. `build`
 * is injectable for that test.
 */
export function createDashboardToolRunner(
    build: typeof buildMcpServer = buildMcpServer,
): ToolRunner {
    return async (userId, name, args, baseUrl) => {
        let server: Awaited<ReturnType<typeof buildMcpServer>>;
        try {
            server = await build(
                baseUrl,
                userId,
                undefined,
                "dashboard",
                DASHBOARD_REGISTRATION,
            );
        } catch (err) {
            throw new Unavailable(err);
        }
        return callInProcess(server, name, args);
    };
}

async function callInProcess(
    server: Awaited<ReturnType<typeof buildMcpServer>>,
    name: DashboardTool,
    args: Record<string, unknown>,
): Promise<ToolRunResult> {
    const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
    const client = new Client({
        name: "nutrition-mcp-dashboard",
        version: "1.0.0",
    });
    try {
        await Promise.all([
            server.connect(serverTransport),
            client.connect(clientTransport),
        ]);
        return (await client.callTool({
            name,
            arguments: args,
        })) as ToolRunResult;
    } finally {
        // Both closes always run, and a failing close never masks the call's
        // own result or error: the linked transports and the server hold
        // nothing outside this call, so there is nothing to report.
        await Promise.allSettled([client.close(), server.close()]);
    }
}

export const runDashboardTool: ToolRunner = createDashboardToolRunner();

/** Parse the `args` query value: absent is `{}`, otherwise a JSON object. */
export function parseToolArgs(
    raw: string | undefined,
): Record<string, unknown> {
    if (raw === undefined || raw === "") return {};
    if (raw.length > TOOL_ARGS_MAX_CHARS)
        throw new BadRequest("The tool arguments are too long.");
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new BadRequest("The tool arguments are not valid JSON.");
    }
    if (
        parsed === null ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
    ) {
        throw new BadRequest("The tool arguments must be a JSON object.");
    }
    return parsed as Record<string, unknown>;
}

/** Categories that mean "the data could not be read right now". */
const UNAVAILABLE_CATEGORIES = new Set([
    "supabase_error",
    "read_truncated",
    "network_error",
]);

/** The SDK's own wording for arguments its input schema refused (see the
 *  McpServer tools/call handler); pinned by src/dashboard-api.test.ts. */
const INPUT_REFUSAL_PREFIXES = [
    "Input validation error:",
    "Invalid arguments for tool",
];

function isInputRefusal(text: string): boolean {
    return INPUT_REFUSAL_PREFIXES.some((p) => text.startsWith(p));
}

function textOf(result: ToolRunResult): string {
    const parts = (result.content ?? [])
        .map((c) =>
            c && typeof c === "object" && "text" in c
                ? String((c as { text: unknown }).text)
                : "",
        )
        .filter((t) => t.length > 0);
    return parts.join("\n");
}

// ---------- Pure builders (exported for tests) ----------

export interface CalendarDay {
    date: string;
    calories: number | null;
    goal: number | null;
    mealCount: number;
    water_ml: number;
    status: "none" | "under" | "on" | "over";
}

/**
 * Where a day's calories sit against its goal. "none" when nothing was logged
 * or there is no positive calorie goal to judge against (the day's `goal` is
 * then null and `mealCount` tells the two apart). Within CALENDAR_BAND of the
 * goal is "on".
 */
export function calendarStatus(
    calories: number | null,
    mealCount: number,
    goal: number | null,
): CalendarDay["status"] {
    if (mealCount === 0 || calories === null) return "none";
    if (goal === null || !(goal > 0)) return "none";
    const band = goal * CALENDAR_BAND;
    if (calories - goal > band) return "over";
    if (goal - calories > band) return "under";
    return "on";
}

/**
 * One entry per date from `from` to `to` inclusive. Meals and water are
 * bucketed by their local date in `tz`, as every tool buckets them. A past
 * date is judged against the calorie goal in effect that day (goals history,
 * as get_nutrition_summary and get_goal_progress do for a past single day);
 * today and later use the current goal.
 */
export function buildCalendarDays(input: {
    from: string;
    to: string;
    tz: string;
    today: string;
    meals: readonly Pick<Meal, "logged_at" | "calories">[];
    water: readonly Pick<WaterEntry, "logged_at" | "amount_ml">[];
    goals: Pick<NutritionGoals, "daily_calories"> | null;
    history: readonly NutritionGoalsHistoryRow[] | null;
}): CalendarDay[] {
    const kcal = new Map<string, number>();
    const count = new Map<string, number>();
    for (const m of input.meals) {
        const d = dateInTz(m.logged_at, input.tz);
        count.set(d, (count.get(d) ?? 0) + 1);
        kcal.set(d, (kcal.get(d) ?? 0) + (Number(m.calories) || 0));
    }
    const water = new Map<string, number>();
    for (const w of input.water) {
        const d = dateInTz(w.logged_at, input.tz);
        water.set(d, (water.get(d) ?? 0) + (Number(w.amount_ml) || 0));
    }
    const currentGoal = positiveOrNull(input.goals?.daily_calories);

    const days: CalendarDay[] = [];
    for (let d = input.from; d <= input.to; d = shiftLocalDate(d, 1)) {
        const mealCount = count.get(d) ?? 0;
        const calories = mealCount > 0 ? Math.round(kcal.get(d)!) : null;
        let goal = currentGoal;
        if (d < input.today && input.history && input.history.length > 0) {
            const on = goalsOnDate(input.history, d, input.tz);
            if (on) goal = positiveOrNull(on.goals.daily_calories);
        }
        days.push({
            date: d,
            calories,
            goal,
            mealCount,
            water_ml: Math.round(water.get(d) ?? 0),
            status: calendarStatus(calories, mealCount, goal),
        });
    }
    return days;
}

function positiveOrNull(v: unknown): number | null {
    const n = typeof v === "string" ? Number(v) : v;
    return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null;
}

export interface SearchMealRow {
    id: string;
    date: string;
    time: string;
    description: string;
    meal_type: string | null;
    calories: number | null;
    /** Names of this meal's ingredients that match the query (every query
     *  word), in item order; empty when the match was on the description. */
    items: string[];
}

export function buildSearchRows(input: {
    q: string;
    tz: string;
    meals: readonly Meal[];
    items: ReadonlyMap<string, readonly Pick<MealItemValues, "name">[]>;
}): SearchMealRow[] {
    const tokens = tokenizeQuery(input.q);
    return [...input.meals]
        .sort((a, b) => b.logged_at.localeCompare(a.logged_at))
        .slice(0, SEARCH_MEAL_LIMIT)
        .map((m) => {
            const local = formatLocalDateTime(m.logged_at, input.tz);
            const matched = (input.items.get(m.id) ?? [])
                .map((i) => i.name)
                .filter((name) => {
                    const lower = name.toLowerCase();
                    return tokens.every((t) => lower.includes(t));
                });
            return {
                id: m.id,
                date: local.slice(0, 10),
                time: local.slice(11, 16),
                description: m.description,
                meal_type: m.meal_type,
                calories: roundOrNull(m.calories),
                items: matched,
            };
        });
}

export function buildSavedMealRows(saved: readonly SavedMealWithItems[]) {
    return saved.map((s) => ({
        id: s.id,
        name: s.name,
        meal_type: s.meal_type,
        calories: roundOrNull(s.calories),
        protein_g: round1OrNull(s.protein_g),
        carbs_g: round1OrNull(s.carbs_g),
        fat_g: round1OrNull(s.fat_g),
        itemCount: s.items.length,
    }));
}

function roundOrNull(v: unknown): number | null {
    const n = typeof v === "string" ? Number(v) : v;
    return typeof n === "number" && Number.isFinite(n) ? Math.round(n) : null;
}

function round1OrNull(v: unknown): number | null {
    const n = typeof v === "string" ? Number(v) : v;
    return typeof n === "number" && Number.isFinite(n)
        ? Math.round(n * 10) / 10
        : null;
}

export interface MeasurementValue {
    value: number;
    unit: LengthUnit;
    date: string;
}

export interface MeasurementSite {
    kind: BodyMeasurementKind;
    latest: MeasurementValue;
    /** The site's first entry, in the LATEST entry's unit so the change reads
     *  directly; null when the site has a single entry. */
    first: MeasurementValue | null;
    entries: number;
}

/**
 * Per site, in BODY_MEASUREMENT_KINDS order: the latest entry as the user
 * typed it (value_entered in entered_unit), the first entry converted to that
 * unit when it was entered in the other one, and the entry count. Sites with
 * no entry are listed in `unmeasured`, in the same order.
 */
export function buildMeasurementSites(
    entries: readonly BodyMeasurementEntry[],
    tz: string,
): { sites: MeasurementSite[]; unmeasured: BodyMeasurementKind[] } {
    const byKind = new Map<BodyMeasurementKind, BodyMeasurementEntry[]>();
    for (const e of entries) {
        const list = byKind.get(e.kind) ?? [];
        list.push(e);
        byKind.set(e.kind, list);
    }
    const sites: MeasurementSite[] = [];
    const unmeasured: BodyMeasurementKind[] = [];
    for (const kind of BODY_MEASUREMENT_KINDS) {
        const list = (byKind.get(kind) ?? [])
            .slice()
            .sort(
                (a, b) =>
                    a.logged_at.localeCompare(b.logged_at) ||
                    a.id.localeCompare(b.id),
            );
        if (list.length === 0) {
            unmeasured.push(kind);
            continue;
        }
        const last = list[list.length - 1]!;
        const unit: LengthUnit = isLengthUnit(last.entered_unit)
            ? last.entered_unit
            : "cm";
        const valueIn = (e: BodyMeasurementEntry): number =>
            e.entered_unit === unit && Number.isFinite(Number(e.value_entered))
                ? Number(e.value_entered)
                : fromMillimetres(Number(e.value_mm), unit);
        const firstEntry = list.length > 1 ? list[0]! : null;
        sites.push({
            kind,
            latest: {
                value: valueIn(last),
                unit,
                date: dateInTz(last.logged_at, tz),
            },
            first: firstEntry
                ? {
                      value: valueIn(firstEntry),
                      unit,
                      date: dateInTz(firstEntry.logged_at, tz),
                  }
                : null,
            entries: list.length,
        });
    }
    return { sites, unmeasured };
}

// ---------- Query validation ----------

function requireDate(name: string, value: string | undefined): string {
    if (value === undefined || !isCalendarDate(value))
        throw new BadRequest(`${name} must be a date written YYYY-MM-DD.`);
    return value;
}

/** Validates a from/to pair: real dates, in order, at most `maxDays`. */
export function parseDateRange(
    from: string | undefined,
    to: string | undefined,
    maxDays: number,
): { from: string; to: string } {
    const f = requireDate("from", from);
    const t = requireDate("to", to);
    if (f > t) throw new BadRequest("from must not be after to.");
    if (dateDiffDays(f, t) + 1 > maxDays)
        throw new BadRequest(`At most ${maxDays} days can be read at once.`);
    return { from: f, to: t };
}

export function parseSearchQuery(raw: string | undefined): string {
    const q = (raw ?? "").trim();
    if (q.length < SEARCH_MIN_CHARS || q.length > SEARCH_MAX_CHARS)
        throw new BadRequest(
            `The search needs ${SEARCH_MIN_CHARS} to ${SEARCH_MAX_CHARS} characters.`,
        );
    return q;
}

// ---------- Router ----------

/** The reads the plain-JSON routes use; every one injectable for tests. */
export interface DashboardReaders {
    getProfile: (userId: string) => Promise<Profile | null>;
    getLastLoggedAt: (userId: string) => Promise<string | null>;
    getMealsInRange: (
        userId: string,
        from: string,
        to: string,
        tz: string,
    ) => Promise<Meal[]>;
    getWaterInRange: (
        userId: string,
        from: string,
        to: string,
        tz: string,
    ) => Promise<WaterEntry[]>;
    getNutritionGoals: (userId: string) => Promise<NutritionGoals | null>;
    getNutritionGoalsHistory: (
        userId: string,
    ) => Promise<NutritionGoalsHistoryRow[]>;
    searchMeals: (
        userId: string,
        queries: string[],
        opts: { limit?: number },
    ) => Promise<Meal[]>;
    searchSavedMeals: (
        userId: string,
        queries: string[],
    ) => Promise<{ saved: SavedMealSummary[]; total: number }>;
    getMealItems: (
        userId: string,
        mealIds: string[],
    ) => Promise<Map<string, MealItemValues[]>>;
    getSavedMeals: (userId: string) => Promise<SavedMealWithItems[]>;
    getAllBodyMeasurements: (userId: string) => Promise<BodyMeasurementEntry[]>;
}

const supabaseReaders: DashboardReaders = {
    getProfile,
    getLastLoggedAt,
    getMealsInRange,
    getWaterInRange,
    getNutritionGoals,
    getNutritionGoalsHistory,
    searchMeals,
    searchSavedMeals,
    getMealItems,
    getSavedMeals: (userId) => getSavedMeals(userId),
    getAllBodyMeasurements,
};

export interface DashboardApiDeps {
    /** The session check (W1's dashboardSession): sets `dashboardUserId` or
     *  answers 401 itself. Defaults to the real cookie session. */
    session?: MiddlewareHandler;
    readers?: Partial<DashboardReaders>;
    runTool?: ToolRunner;
    rateLimit?: (userId: string) => RateLimitResult;
    /** Clock for "today"; the profile timezone decides the date. */
    now?: () => Date;
}

/** The real cookie session, loaded on first use so a router built with an
 *  injected session never touches the session store. */
function defaultSession(): MiddlewareHandler {
    let real: MiddlewareHandler | undefined;
    return async (c, next) => {
        const mw: MiddlewareHandler = (real ??= (
            await import("./dashboard-auth.js")
        ).dashboardSession());
        return mw(c, next);
    };
}

export function createDashboardApiRouter(deps: DashboardApiDeps = {}) {
    const router = new Hono<Env>();
    const session = deps.session ?? defaultSession();
    const readers: DashboardReaders = { ...supabaseReaders, ...deps.readers };
    const runTool = deps.runTool ?? runDashboardTool;
    const rateLimit = deps.rateLimit ?? checkDashboardRateLimit;
    const now = deps.now ?? (() => new Date());

    // One log line per call, written after the response is built. A throw
    // that escaped a handler (none should) still logs, as server_error.
    const logged = (route: Route) => async (c: Context<Env>, next: Next) => {
        const note: CallNote = { result: "server_error" };
        c.set("dashNote", note);
        try {
            await next();
        } finally {
            // The session middleware answers 401, 503 and 429 itself,
            // without the note: read its code off the status.
            if (note.result === "server_error") {
                const fromStatus = SESSION_STATUS_RESULT[c.res.status];
                if (fromStatus) note.result = fromStatus;
            }
            const line = dashboardLogLine(route, note);
            if (note.result === "ok") console.log(line);
            else console.warn(line);
        }
    };

    const limited = async (c: Context<Env>, next: Next) => {
        const userId = c.get("dashboardUserId");
        if (typeof userId !== "string" || userId.length === 0)
            return fail(c, "unauthenticated", "Sign in again.");
        const r = rateLimit(userId);
        if (!r.allowed) return rateLimited(c, r);
        await next();
    };

    const auth = session as MiddlewareHandler<Env>;

    // The profile's timezone, decided once per request like every tool.
    const profileTz = (p: Profile | null) => timezoneFromProfile(p) ?? "UTC";

    router.get(
        "/api/dashboard/tool/:name",
        logged("tool"),
        auth,
        limited,
        async (c) => {
            try {
                const name = c.req.param("name");
                if (!isDashboardTool(name))
                    throw new BadRequest("This tool is not available here.");
                c.get("dashNote").tool = name;
                const args = parseToolArgs(c.req.query("args"));
                const result = await runTool(
                    c.get("dashboardUserId"),
                    name,
                    args,
                    new URL(c.req.url).origin,
                );
                if (result.isError) {
                    const meta = result._meta?.[DASHBOARD_ERROR_META_KEY] as
                        DashboardErrorMeta | undefined;
                    const text = textOf(result);
                    // A ToolError is text written for the caller about its own
                    // input. With no meta the SDK answered before or after the
                    // handler: an input-schema refusal is a bad request, but
                    // anything else (an output-schema failure, a missing
                    // structuredContent) is a server bug, logged under a ref.
                    if (meta?.toolError || (!meta && isInputRefusal(text))) {
                        return fail(
                            c,
                            "bad_request",
                            text.slice(0, 300) ||
                                "The tool arguments were not accepted.",
                        );
                    }
                    const note = c.get("dashNote");
                    if (!meta) {
                        const ref = newErrorRef();
                        note.ref = ref;
                        note.error = text;
                        return fail(
                            c,
                            "server_error",
                            `${MESSAGES.server_error} (ref ${ref})`,
                            { ref },
                        );
                    }
                    note.ref = meta.ref;
                    if (UNAVAILABLE_CATEGORIES.has(meta.category)) {
                        return fail(
                            c,
                            "unavailable",
                            `${MESSAGES.unavailable} (ref ${meta.ref})`,
                            { ref: meta.ref, headers: { "Retry-After": "30" } },
                        );
                    }
                    return fail(
                        c,
                        "server_error",
                        `${MESSAGES.server_error} (ref ${meta.ref})`,
                        { ref: meta.ref },
                    );
                }
                return ok(c, {
                    structuredContent: result.structuredContent ?? null,
                    _meta: result._meta ?? {},
                });
            } catch (err) {
                return failFromError(c, err);
            }
        },
    );

    router.get(
        "/api/dashboard/status",
        logged("status"),
        auth,
        limited,
        async (c) => {
            try {
                const userId = c.get("dashboardUserId");
                const [profile, lastLoggedAt] = await io(
                    Promise.all([
                        readers.getProfile(userId),
                        readers.getLastLoggedAt(userId),
                    ]),
                );
                const tz = profileTz(profile);
                return ok(c, {
                    timezone: tz,
                    locale: localeFromProfile(profile) ?? "en",
                    today: dateInTz(now(), tz),
                    weightUnit: preferredWeightUnitFromProfile(profile) ?? "kg",
                    lengthUnit: preferredLengthUnitFromProfile(profile),
                    lastLoggedAt,
                    hasData: lastLoggedAt !== null,
                });
            } catch (err) {
                return failFromError(c, err);
            }
        },
    );

    router.get(
        "/api/dashboard/calendar",
        logged("calendar"),
        auth,
        limited,
        async (c) => {
            try {
                const { from, to } = parseDateRange(
                    c.req.query("from"),
                    c.req.query("to"),
                    CALENDAR_MAX_DAYS,
                );
                const userId = c.get("dashboardUserId");
                const profile = await io(readers.getProfile(userId));
                const tz = profileTz(profile);
                const today = dateInTz(now(), tz);
                const [meals, water, goals, history] = await io(
                    Promise.all([
                        readers.getMealsInRange(userId, from, to, tz),
                        readers.getWaterInRange(userId, from, to, tz),
                        readers.getNutritionGoals(userId),
                        // Only a window reaching into the past needs history.
                        from < today
                            ? readers.getNutritionGoalsHistory(userId)
                            : Promise.resolve(null),
                    ]),
                );
                return ok(c, {
                    days: buildCalendarDays({
                        from,
                        to,
                        tz,
                        today,
                        meals,
                        water,
                        goals,
                        history,
                    }),
                });
            } catch (err) {
                return failFromError(c, err);
            }
        },
    );

    router.get(
        "/api/dashboard/search",
        logged("search"),
        auth,
        limited,
        async (c) => {
            try {
                const q = parseSearchQuery(c.req.query("q"));
                const userId = c.get("dashboardUserId");
                const [profile, meals, saved] = await io(
                    Promise.all([
                        readers.getProfile(userId),
                        readers.searchMeals(userId, [q], {
                            limit: SEARCH_MEAL_LIMIT,
                        }),
                        readers.searchSavedMeals(userId, [q]),
                    ]),
                );
                const kept = meals.slice(0, SEARCH_MEAL_LIMIT);
                const items =
                    kept.length > 0
                        ? await io(
                              readers.getMealItems(
                                  userId,
                                  kept.map((m) => m.id),
                              ),
                          )
                        : new Map<string, MealItemValues[]>();
                return ok(c, {
                    meals: buildSearchRows({
                        q,
                        tz: profileTz(profile),
                        meals: kept,
                        items,
                    }),
                    savedMeals: saved.saved.map((s) => ({
                        id: s.id,
                        name: s.name,
                        calories: roundOrNull(s.calories),
                    })),
                });
            } catch (err) {
                return failFromError(c, err);
            }
        },
    );

    router.get(
        "/api/dashboard/saved-meals",
        logged("saved-meals"),
        auth,
        limited,
        async (c) => {
            try {
                const saved = await io(
                    readers.getSavedMeals(c.get("dashboardUserId")),
                );
                return ok(c, { savedMeals: buildSavedMealRows(saved) });
            } catch (err) {
                return failFromError(c, err);
            }
        },
    );

    router.get(
        "/api/dashboard/measurements",
        logged("measurements"),
        auth,
        limited,
        async (c) => {
            try {
                const userId = c.get("dashboardUserId");
                const [profile, entries] = await io(
                    Promise.all([
                        readers.getProfile(userId),
                        readers.getAllBodyMeasurements(userId),
                    ]),
                );
                const { sites, unmeasured } = buildMeasurementSites(
                    entries,
                    profileTz(profile),
                );
                return ok(c, {
                    unit: preferredLengthUnitFromProfile(profile),
                    sites,
                    unmeasured,
                });
            } catch (err) {
                return failFromError(c, err);
            }
        },
    );

    return router;
}

// ---------- Widget route ----------

export interface DashboardWidgetDeps {
    getHtml?: (key: string) => Promise<string>;
}

/**
 * `GET /dashboard/widget/:key`: one widget's assembled HTML, for the
 * dashboard's sandboxed iframes. Public: a widget is a static template with
 * no user data in it (the payload arrives by postMessage from the page). Its
 * own CSP replaces the site's — everything inline, nothing fetched — and
 * `frame-ancestors 'self'` lets the dashboard frame it, so src/index.ts must
 * not add `X-Frame-Options: DENY` or the site CSP to this path.
 */
export function createDashboardWidgetRoute(deps: DashboardWidgetDeps = {}) {
    const router = new Hono();
    const getHtml = deps.getHtml ?? getWidgetHtml;
    const etags = new Map<string, string>();

    router.get("/dashboard/widget/:key", async (c) => {
        const key = c.req.param("key");
        if (!(DASHBOARD_WIDGETS as readonly string[]).includes(key)) {
            return c.text("Not found", 404, {
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
            });
        }
        let html: string;
        try {
            html = await getHtml(key);
        } catch (err) {
            const ref = newErrorRef();
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(
                `[dashboard] route=widget result=server_error ref=${ref}: ${JSON.stringify(msg.slice(0, 500))}`,
            );
            return c.text(`Widget unavailable (ref ${ref})`, 500, {
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
            });
        }
        let etag = etags.get(key);
        if (etag === undefined) {
            const digest = new Bun.CryptoHasher("sha256")
                .update(html)
                .digest("hex")
                .slice(0, 32);
            etag = `"${digest}"`;
            etags.set(key, etag);
        }
        const headers = {
            "Content-Security-Policy": WIDGET_CSP,
            "Cache-Control": "public, max-age=300",
            ETag: etag,
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer",
            "X-Robots-Tag": "noindex, nofollow",
        };
        const inm = c.req.header("if-none-match");
        if (inm && inm.split(",").some((t) => t.trim() === etag)) {
            return c.body(null, 304, headers);
        }
        return c.html(html, 200, headers);
    });

    return router;
}
