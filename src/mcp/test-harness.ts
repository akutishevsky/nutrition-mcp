import {
    Client,
    StreamableHTTPClientTransport,
    type VersionNegotiationMode,
} from "@modelcontextprotocol/client";
import { InMemoryTransport, McpServer } from "@modelcontextprotocol/server";
import { Hono } from "hono";
import { ADDED_SUGAR_REQUIRED_FROM_ENV } from "../added-sugar.js";
import type { NutritionGoalsHistoryRow } from "../goals-history.js";
import { handleMcp, registerTools } from "../mcp.js";
import { type MealItemValues } from "../meal-items.js";
import type { ReferenceRecord } from "../provenance.js";
import type {
    BodyMeasurementEntry,
    Meal,
    NutritionGoals,
    SavedMealWithItems,
    WaterEntry,
    WeightEntry,
} from "../supabase.js";
import * as actualSupabase from "../supabase.js";

export type ConcurrentEdit<T> = Partial<T> | ((row: T) => Partial<T>);

// Real uuids, because the id tools check the shape before touching the
// database: a fixture like "m1" would never reach the stubs below.
export const MEAL_ID = "00000000-0000-4000-8000-000000000001";

export const WATER_ID = "00000000-0000-4000-8000-000000000002";

export const WEIGHT_ID = "00000000-0000-4000-8000-000000000003";

export const ACTIVE_ID = "00000000-0000-4000-8000-000000000009";

export const OTHER_ACTIVE_ID = "00000000-0000-4000-8000-00000000000a";

export const MEASUREMENT_ID = "00000000-0000-4000-8000-000000000004";

export function meal(over: Partial<Meal> = {}): Meal {
    return {
        id: MEAL_ID,
        user_id: "u1",
        logged_at: "2026-07-26T12:00:00.000Z",
        meal_type: "dinner",
        description: "Pasta and a beer",
        calories: 700,
        protein_g: 25,
        carbs_g: 90,
        fat_g: 20,
        fiber_g: 6,
        sugar_g: 12,
        added_sugar_g: null,
        alcohol_g: 14,
        // NULL on the base fixture on purpose: caffeine is the partial nutrient
        // where absence is the norm rather than a relic of pre-feature history,
        // and a pasta-and-beer dinner genuinely carries none. Giving every
        // fixture meal a milligram figure would hide the suppression this whole
        // feature turns on — the tests that want caffeine ask for it.
        caffeine_mg: null,
        notes: null,
        idempotency_key: null,
        saved_meal_id: null,
        ...over,
    };
}

export function goals(over: Partial<NutritionGoals> = {}): NutritionGoals {
    return {
        user_id: "u1",
        daily_calories: 2000,
        daily_protein_g: 120,
        daily_carbs_g: 220,
        daily_fat_g: 70,
        daily_fiber_g: 30,
        daily_sugar_g: 40,
        daily_added_sugar_g: null,
        daily_alcohol_g: 28,
        // Milligrams, and the EFSA/FDA figure the tool description offers.
        daily_caffeine_mg: 400,
        daily_water_ml: 2500,
        target_weight_g: null,
        updated_at: "2026-07-26T00:00:00.000Z",
        ...over,
    };
}

// ---------- Tool-level integration harness ----------
//
// Everything above exercises exported pure functions. Some things have no pure
// core to reach that way: set_alcohol_tracking and get_alcohol_tracking ARE
// their handler — read or write one profile column, then pick a sentence — and
// a mutation audit found that inverting either tool's enabled state failed
// nothing. So the tools below are registered on a real McpServer and driven
// through a real client over an in-memory transport, with only ./supabase.js
// stubbed. That also puts the input schemas under test end-to-end, which is the
// only way to prove a bad argument is rejected BEFORE the handler runs.
//
// mock.module swaps the module for the whole test *process*, not just this
// file, so the real exports are spread back in (replacing it wholesale would
// break every other suite) and restored in afterAll. Same pattern as
// middleware.test.ts.

export const PROFILE_BASE: actualSupabase.Profile = {
    user_id: "u1",
    timezone: "UTC",
    preferred_weight_unit: null,
    widgets_enabled: true,
    alcohol_tracking_enabled: false,
    preferred_drink_unit: null,
    locale: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    preferred_length_unit: null,
    activity_credit_pct: null,
};

/** A stored body measurement: waist 84.5 cm unless overridden. */
export function measurementRow(
    over: Partial<BodyMeasurementEntry> = {},
): BodyMeasurementEntry {
    return {
        id: MEASUREMENT_ID,
        user_id: "u1",
        kind: "waist",
        value_mm: 845,
        value_entered: 84.5,
        entered_unit: "cm",
        logged_at: "2026-08-07T08:00:00.000Z",
        notes: null,
        created_at: "2026-08-07T08:00:00.000Z",
        idempotency_key: null,
        ...over,
    };
}

/** What the DB would hand back after a write: every nutrient absent unless the
 *  caller sent it. Building on the `meal()` fixture instead would silently give
 *  every write its 14 g of alcohol, hiding exactly the gating this tests. */
export function storedMeal(input: Record<string, unknown>): Meal {
    const defined = Object.fromEntries(
        Object.entries(input).filter(([, v]) => v !== undefined),
    ) as Partial<Meal>;
    return meal({
        calories: null,
        protein_g: null,
        carbs_g: null,
        fat_g: null,
        fiber_g: null,
        sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        ...defined,
    });
}

export const db = {
    profile: null as actualSupabase.Profile | null,
    goals: null as NutritionGoals | null,
    meals: [] as Meal[],
    // Other meals on the day getMealsByDate reads, kept apart from `meals`
    // because insertMeal/updateMeal replace that list with the written row.
    // Merged in logged_at order, like the real reader.
    sameDayMeals: [] as Meal[],
    // Every getMealsInRange call's [start, end], in order: get_trends'
    // group_by widens its one meal read to the 5-year span, and must not
    // without group_by.
    mealRangeArgs: [] as [string, string][],
    // getNutritionGoalsHistory's rows, oldest first, and how often it ran.
    goalsHistory: [] as NutritionGoalsHistoryRow[],
    goalsHistoryReads: 0,
    // hasMealsBefore's answer, and the dates it was asked about.
    mealsBefore: false,
    mealsBeforeArgs: [] as string[],
    water: [] as WaterEntry[],
    // getWaterByDate's rows (get_water_today / _by_date and buildMealProgress);
    // `water` above feeds the range reader.
    waterByDate: [] as WaterEntry[],
    // getWeightInRange's and getAllWeight's rows.
    weights: [] as WeightEntry[],
    // Which weight reader ran, in order: "range" or "all".
    weightReads: [] as string[],
    inserted: [] as Record<string, unknown>[],
    // Same capture as `inserted`, for the non-meal write paths. Each one
    // resolves logged_at independently, so each needs its own witness.
    mealUpdates: [] as Record<string, unknown>[],
    waterInserted: [] as Record<string, unknown>[],
    // Active calories: the rows getActivityInRange and getAllActiveCalories
    // return, and the writes insertActiveCalories saw (with their credit share).
    activeEntries: [] as actualSupabase.ActiveCaloriesEntry[],
    activeInserted: [] as Record<string, unknown>[],
    weightInserted: [] as Record<string, unknown>[],
    weightUpdates: [] as Record<string, unknown>[],
    // Body measurements: the rows getBodyMeasurementsInRange and
    // getBodyMeasurement read, and the write/read witnesses.
    measurements: [] as BodyMeasurementEntry[],
    measurementInserted: [] as Record<string, unknown>[],
    measurementUpdates: [] as Record<string, unknown>[],
    measurementRangeArgs: [] as {
        s: string;
        e: string;
        tz: string;
        kind: string | undefined;
    }[],
    profilePatches: [] as Record<string, unknown>[],
    // Ids the delete stubs consider to exist. Deleting one removes it, so a
    // second delete of the same id reports "not found" like the real table.
    rowIds: new Set<string>(),
    analyticsRows: [] as Record<string, unknown>[],
    accountWipes: 0,
    profileReads: [] as string[],
    // Thrown by getMealsInRange/deleteMeal/updateMeal when set: stands in for
    // a raw Postgres/PostgREST failure, or for the real updateMeal's not-found
    // ToolError, neither of which the stubs otherwise produce.
    failWith: null as Error | null,
    goalsHistoryFailure: null as Error | null,
    // Every call to a delete stub, found or not: stays 0 when a tool refuses
    // an id before it reaches the database.
    deleteCalls: 0,
    // What the insert stubs report as `deduplicated`: true stands in for a
    // write whose key matched an existing row.
    dedupe: false,
    // get_profile's Apple Health sync status, as the health-sync store reads
    // it through getSupabase(): the link row, and the latest acked date.
    healthSyncLink: null as Record<string, unknown> | null,
    healthSyncSentThrough: null as string | null,
    // update_meal's reads of a stored meal's sugar pair: 0 when both sugar
    // fields were passed, so the check needed no read.
    storedMealReads: 0,
    // The sugar guard update_meal handed updateMeal on each call (undefined
    // when the write needed none), and a sugar edit the fake applies to the
    // stored meal between update_meal's read and its write.
    mealUpdateGuards: [] as (Record<string, unknown> | undefined)[],
    // Applied between a write's read and its write. An object applies once
    // (then clears) unless concurrentEditPersists; a function computes the
    // change from the stored row, so a persisting edit moves it every time.
    concurrentMealEdit: null as ConcurrentEdit<Meal> | null,
    concurrentSavedMealEdit: null as ConcurrentEdit<SavedMealWithItems> | null,
    concurrentEditPersists: false,
    // Ingredients by meal id, as the store's meal_items rows read back.
    mealItems: new Map<string, MealItemValues[]>(),
    // When set, getMealItems throws it (the widget payload's read failing).
    mealItemsFailure: null as Error | null,
    // replaceMealItems' witnesses: the fields and the full new list.
    itemReplacements: [] as {
        id: string;
        fields: Record<string, unknown>;
        items: MealItemValues[];
    }[],
    // Saved meals as the store holds them, one serving each with its items.
    savedMeals: [] as SavedMealWithItems[],
    // createSavedMeal's and updateSavedMeal's witnesses.
    savedMealWrites: [] as {
        input: Record<string, unknown>;
        items: MealItemValues[];
    }[],
    savedMealUpdates: [] as {
        id: string;
        fields: Record<string, unknown>;
        items: MealItemValues[] | null;
    }[],
    // searchMeals' rows, staged by the test.
    searchResults: [] as Meal[],
    // food_cache rows the provenance reader finds, keyed "source:id", and the
    // lookups made (the verification tests read both).
    foodRecords: new Map<string, ReferenceRecord>(),
    foodCacheReads: [] as string[],
};

export interface ToolResult {
    content: { type: string; text: string }[];
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
    _meta?: Record<string, unknown>;
}

export type CallTool = (
    name: string,
    args?: Record<string, unknown>,
) => Promise<ToolResult>;

/** Register the real tools for a user whose alcohol gate is `alcohol`, then
 *  drive them through a client. `alcohol` is the whole opt-in: null = off. */
export async function withTools(
    alcohol: "us" | "uk" | null,
    run: (call: CallTool) => Promise<void>,
    opts: { widgetsEnabled?: boolean; widgetsExpanded?: boolean } = {},
): Promise<void> {
    const server = new McpServer(
        { name: "nutrition-mcp-test", version: "0.0.0" },
        { capabilities: { tools: {}, resources: {} } },
    );
    registerTools(
        server,
        "u1",
        opts.widgetsEnabled ?? true,
        alcohol,
        undefined,
        {},
        opts.widgetsExpanded ?? false,
    );
    const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.0" });
    await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
    ]);
    try {
        // listTools arms the client's own check of every structuredContent
        // against the ADVERTISED (strict, additionalProperties:false) JSON
        // Schema, as a host does. Without it the only check is the server's
        // Zod parse, which ignores unknown keys — so a handler that returned
        // an extra field would pass every test here and fail in production
        // for each host holding a cached tools/list.
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

export const textOf = (r: ToolResult) =>
    r.content.map((c) => c.text).join("\n");

/**
 * The added-sugar gap topMealBreakdown leaves: 8 fruit-and-yogurt bowls lead
 * every ranked metric (total sugar included) with little or no added sugar,
 * and one sweetened drink carries the most added sugar of all while topping
 * nothing that ranks rows — so it is not among structuredContent.meals.
 */
export function addedSugarGapMeals(): Meal[] {
    const bowls = Array.from({ length: 8 }, (_, i) =>
        meal({
            id: `00000000-0000-4000-8000-1000000000${String(i).padStart(2, "0")}`,
            logged_at: `2026-01-${String(i + 2).padStart(2, "0")}T08:00:00.000Z`,
            meal_type: "breakfast",
            description: `fruit and yogurt bowl ${i}`,
            calories: 400,
            protein_g: 20,
            carbs_g: 60,
            fat_g: 10,
            fiber_g: 8,
            sugar_g: 40,
            // One bowl has a little added sugar: it is kept already, so it
            // must not come back in `extra`.
            added_sugar_g: i === 3 ? 2 : 0,
            alcohol_g: 5,
            caffeine_mg: 60,
        }),
    );
    const drink = meal({
        id: "00000000-0000-4000-8000-200000000000",
        logged_at: "2026-01-20T15:00:00.000Z",
        meal_type: "snack",
        description: "sweetened iced tea",
        calories: 120,
        protein_g: 0,
        carbs_g: 30,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 30,
        added_sugar_g: 30,
        alcohol_g: 0,
        caffeine_mg: null,
    });
    return [...bowls, drink];
}

// ---------- /mcp over HTTP: both protocol eras ----------
//
// Kept in this file rather than its own: mock.module is process-wide, and a
// separate file with its own mock/restore of ./supabase.js broke
// middleware.test.ts's mock on Linux CI even with a snapshot-based restore.
// Sharing this file's single mock window is what proved green; see the
// restore note on the afterAll above for the mechanism.

// The production route minus auth: authenticateBearer's only output is the
// userId variable, which is what handleMcp hands to the server factory.
export function appFor(userId: string) {
    const app = new Hono();
    app.all("/mcp", (c) => {
        c.set("userId", userId);
        return handleMcp(c);
    });
    return app;
}

// The SDK's mode is wider ({ pin: string }); this endpoint only ever serves the
// one modern revision, so narrow the pin rather than hand-writing a twin of the
// exported union.
export type EraMode =
    Extract<VersionNegotiationMode, string> | { pin: "2026-07-28" };

// One factory backs both legs, so everything a tool call touches — the tool
// surface, the ui:// resources, the structuredContent, the authInfo the factory
// reads the user out of — must answer identically whichever era asked. The
// legacy leg is the one every production client (the Claude connector included)
// is on today, so a test that only ever pins the modern revision leaves the
// deployed path uncovered.
export const ERAS: EraMode[] = ["legacy", { pin: "2026-07-28" }];

// Drive the real handler in-process: the URL is never dialled. Extra headers
// stand in for what a proxy in front of us would add.
export async function withHttpClient<T>(
    userId: string,
    mode: EraMode,
    run: (client: Client) => Promise<T>,
    headers: Record<string, string> = {},
): Promise<T> {
    const app = appFor(userId);
    const transport = new StreamableHTTPClientTransport(
        new URL("http://test.local/mcp"),
        {
            fetch: async (url, init) => {
                const req = new Request(String(url), init);
                for (const [k, v] of Object.entries(headers))
                    req.headers.set(k, v);
                return app.request(req);
            },
        },
    );
    const client = new Client(
        { name: "t", version: "0" },
        { versionNegotiation: { mode } },
    );
    await client.connect(transport);
    try {
        // Same reason as withTools: arm the client's advertised-schema check
        // before the first callTool. Lazily, so a test that counts requests
        // or profile reads without calling a tool sees no extra tools/list.
        const callTool = client.callTool.bind(client);
        let armed = false;
        client.callTool = (async (...args: Parameters<typeof callTool>) => {
            if (!armed) {
                armed = true;
                await client.listTools();
            }
            return callTool(...args);
        }) as typeof client.callTool;
        return await run(client);
    } finally {
        await client.close();
    }
}

// A raw JSON-RPC POST with the headers the v2 entry is strict about.
export function rpc(
    app: Hono,
    body: Record<string, unknown>,
    headers: Record<string, string> = {},
) {
    return app.request("http://x/mcp", {
        method: "POST",
        headers: {
            "content-type": "application/json",
            accept: "application/json, text/event-stream",
            ...headers,
        },
        body: JSON.stringify({ jsonrpc: "2.0", ...body }),
    });
}

// The legacy leg answers over SSE; pull the single JSON-RPC frame out.
export async function sseFrame(r: Response): Promise<Record<string, unknown>> {
    const line = (await r.text())
        .split("\n")
        .find((l) => l.startsWith("data:"));
    return JSON.parse(line?.slice(5) ?? "{}") as Record<string, unknown>;
}

/** A goals-history row: every column null unless given. */
export function historyRow(
    effective_at: string,
    over: Partial<NutritionGoalsHistoryRow> = {},
): NutritionGoalsHistoryRow {
    return {
        effective_at,
        daily_calories: null,
        daily_protein_g: null,
        daily_carbs_g: null,
        daily_fat_g: null,
        daily_fiber_g: null,
        daily_sugar_g: null,
        daily_added_sugar_g: null,
        daily_alcohol_g: null,
        daily_caffeine_mg: null,
        daily_water_ml: null,
        target_weight_g: null,
        ...over,
    };
}

// ---------- ingredients and saved meals ----------

export function savedMealId(n: number): string {
    return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

export const SAVED_ID = savedMealId(0xa1);

export const OTHER_SAVED_ID = savedMealId(0xa2);

/** One validated ingredient: the four required nutrients, the rest unset. */
export function ingredient(
    position: number,
    name: string,
    over: Partial<MealItemValues> = {},
): MealItemValues {
    return {
        position,
        name,
        amount: null,
        unit: null,
        calories: 100,
        protein_g: 5,
        carbs_g: 10,
        fat_g: 3,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        ...over,
    };
}

/** A saved meal as the store returns it: one serving, with its ingredients. */
export function savedMealRow(
    over: Partial<SavedMealWithItems> = {},
): SavedMealWithItems {
    return {
        id: SAVED_ID,
        user_id: "u1",
        name: "Oatmeal bowl",
        description: "Oatmeal with banana",
        meal_type: "breakfast",
        calories: 300,
        protein_g: 12,
        carbs_g: 60,
        fat_g: 6,
        fiber_g: null,
        sugar_g: null,
        added_sugar_g: null,
        alcohol_g: null,
        caffeine_mg: null,
        created_at: "2026-10-01T00:00:00.000Z",
        updated_at: "2026-10-01T00:00:00.000Z",
        items: [],
        ...over,
    };
}

/** Runs `run` with the added-sugar requirement on or off, restoring the env. */
export async function withAddedSugarGate(
    on: boolean,
    run: () => Promise<void>,
) {
    const previous = process.env[ADDED_SUGAR_REQUIRED_FROM_ENV];
    if (on) process.env[ADDED_SUGAR_REQUIRED_FROM_ENV] = "2000-01-01T00:00:00Z";
    else delete process.env[ADDED_SUGAR_REQUIRED_FROM_ENV];
    try {
        await run();
    } finally {
        if (previous === undefined)
            delete process.env[ADDED_SUGAR_REQUIRED_FROM_ENV];
        else process.env[ADDED_SUGAR_REQUIRED_FROM_ENV] = previous;
    }
}

export const BURGER_ITEMS = [
    {
        name: "Булка",
        amount: 1,
        unit: "pcs",
        calories: 150,
        protein_g: 5,
        carbs_g: 28,
        fat_g: 2,
        fiber_g: 1,
        sugar_g: 4,
        added_sugar_g: 1,
    },
    {
        name: "Котлета",
        amount: 120,
        unit: "g",
        calories: 300.5,
        protein_g: 25,
        carbs_g: 0,
        fat_g: 22,
        fiber_g: 0,
        sugar_g: 0,
        added_sugar_g: 0,
    },
];
