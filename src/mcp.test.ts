import { afterAll, beforeEach, mock } from "bun:test";
import { ToolError } from "./errors.js";
import { registerFoodSuites } from "./mcp/suites/foods.js";
import { registerGoalSuites } from "./mcp/suites/goals.js";
import { registerInsightSuites } from "./mcp/suites/insights.js";
import { registerMealSuites } from "./mcp/suites/meals.js";
import { registerMetricSuites } from "./mcp/suites/metrics.js";
import { registerNutrientSuites } from "./mcp/suites/nutrients.js";
import { registerProtocolSuites } from "./mcp/suites/protocol.js";
import { registerSavedMealSuites } from "./mcp/suites/saved-meals.js";
import {
    ACTIVE_ID,
    PROFILE_BASE,
    WATER_ID,
    WEIGHT_ID,
    db,
    goals,
    measurementRow,
    savedMealId,
    savedMealRow,
    storedMeal,
} from "./mcp/test-harness.js";
import { MEAL_NUTRIENT_KEYS, type MealItemValues } from "./meal-items.js";
import type {
    BodyMeasurementEntry,
    NutritionGoals,
    SavedMealWithItems,
    WaterEntry,
    WeightEntry,
} from "./supabase.js";
import * as actualSupabase from "./supabase.js";

// Snapshot BEFORE mock.module runs: Bun patches a mocked module's namespace
// in place, so restoring from the live `actualSupabase` afterwards would hand
// the next file the mock again. Restore from this copy.
const realSupabase = { ...actualSupabase };

/** A stored row no longer holds a write's guard (the fake's SnapshotConflictError
 *  test): compares every guarded column the way the real jsonb / IS NULL filter does. */
function storedMoved(row: object, guard: object): boolean {
    return Object.entries(guard).some(
        ([column, value]) =>
            JSON.stringify(value ?? null) !==
            JSON.stringify((row as Record<string, unknown>)[column] ?? null),
    );
}

function fakeUpdateSavedMeal(
    id: string,
    fields: Record<string, unknown>,
    items: MealItemValues[] | null,
) {
    const current = db.savedMeals.find((s) => s.id === id);
    if (!current) return null;
    const name = fields.name as string | undefined;
    const clash =
        name !== undefined
            ? db.savedMeals.find(
                  (s) =>
                      s.id !== id &&
                      s.name.toLowerCase() === name.toLowerCase(),
              )
            : undefined;
    if (clash) throw new realSupabase.SavedMealNameTaken(clash.id);
    db.savedMealUpdates.push({ id, fields, items });
    const defined = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined),
    );
    const next = {
        ...current,
        ...defined,
        items: items ?? current.items,
    } as SavedMealWithItems;
    db.savedMeals = db.savedMeals.map((s) => (s.id === id ? next : s));
    return next;
}

/** The two PostgREST reads behind HealthSyncStore.getLinkStatus, plus
 *  update_meal's stored-sugar read (`meals` by id), and nothing else: any
 *  other select through this stub has no chain to call. */
function healthSyncSelect(table: string) {
    let idFilter: string | null = null;
    const chain = {
        eq: (column: string, value: string) => {
            if (column === "id") idFilter = value;
            return chain;
        },
        gt: () => chain,
        not: () => chain,
        order: () => chain,
        limit: async () => ({
            data:
                table === "health_sync_days" && db.healthSyncSentThrough
                    ? [{ date: db.healthSyncSentThrough }]
                    : [],
            error: null,
        }),
        maybeSingle: async () => {
            db.storedMealReads += table === "meals" ? 1 : 0;
            return {
                data:
                    table === "health_sync_links"
                        ? db.healthSyncLink
                        : table === "meals"
                          ? (db.meals.find((m) => m.id === idFilter) ?? null)
                          : null,
                error: null,
            };
        },
    };
    return chain;
}

mock.module("./supabase.js", () => ({
    ...actualSupabase,
    // analytics.ts persists every tool call through getSupabase(); intercept it
    // so a test never depends on Supabase env vars being present, and so the
    // rows it would have written can be asserted on.
    getSupabase: () => ({
        from: (table: string) => ({
            insert: async (row: Record<string, unknown>) => {
                if (table === "tool_analytics") db.analyticsRows.push(row);
                return { error: null };
            },
            select: () => healthSyncSelect(table),
        }),
    }),
    deleteAllUserData: async () => {
        db.accountWipes += 1;
    },
    getProfile: async (userId: string) => {
        db.profileReads.push(userId);
        return db.profile;
    },
    getUserTimezone: async () => db.profile?.timezone ?? "UTC",
    getNutritionGoals: async () => db.goals,
    getMealsByDate: async () =>
        db.sameDayMeals.length
            ? [...db.meals, ...db.sameDayMeals].sort((a, b) =>
                  a.logged_at < b.logged_at ? -1 : 1,
              )
            : db.meals,
    getWaterByDate: async () => db.waterByDate,
    // The range readers behind get_nutrition_summary. They ignore the dates and
    // hand back whatever the test staged: the fixtures below already sit inside
    // the window they ask for, and filtering here would only re-implement the
    // query under test. Paging, ordering and the count reconcile belong to the
    // real reader, driven against a stubbed fetch in supabase-window.test.ts.
    getMealsInRange: async (_userId: string, s: string, e: string) => {
        db.mealRangeArgs.push([s, e]);
        if (db.failWith) throw db.failWith;
        return db.meals;
    },
    // get_trends' group_by: the goal in effect on each past day.
    getNutritionGoalsHistory: async () => {
        db.goalsHistoryReads += 1;
        return db.goalsHistory;
    },
    hasMealsBefore: async (_userId: string, date: string) => {
        db.mealsBeforeArgs.push(date);
        return db.mealsBefore;
    },
    getWaterInRange: async () => db.water,
    // get_weight_by_date_range's reader; its range guard is what is under test.
    getWeightInRange: async () => {
        db.weightReads.push("range");
        return db.weights;
    },
    // get_weight_trends' one full-history read.
    getAllWeight: async () => {
        db.weightReads.push("all");
        return db.weights;
    },
    // get_goal_progress's standing weight metric: the newest staged entry.
    getLatestWeight: async () => db.weights.at(-1) ?? null,
    insertMeal: async (_userId: string, input: Record<string, unknown>) => {
        db.inserted.push(input);
        const { items, ...row } = input;
        const saved = storedMeal(row);
        if (Array.isArray(items))
            db.mealItems.set(saved.id, items as MealItemValues[]);
        db.meals = [saved];
        return { meal: saved, deduplicated: db.dedupe };
    },
    updateMeal: async (
        _userId: string,
        id: string,
        fields: Record<string, unknown>,
        guard?: Record<string, unknown>,
    ) => {
        if (db.failWith) throw db.failWith;
        db.mealUpdateGuards.push(guard);
        // Mirrors the real guarded write: a concurrent edit (staged in
        // db.concurrentMealEdit, applied between the caller's read and this
        // write) that moves any guarded column or label makes it write nothing
        // and throw SnapshotConflictError.
        const current = db.meals.find((m) => m.id === id);
        if (current && db.concurrentMealEdit) {
            const edit = db.concurrentMealEdit;
            Object.assign(
                current,
                typeof edit === "function" ? edit(current) : edit,
            );
            if (!db.concurrentEditPersists) db.concurrentMealEdit = null;
        }
        if (current && guard && storedMoved(current, guard))
            throw new realSupabase.SnapshotConflictError(id);
        db.mealUpdates.push(fields);
        const saved = storedMeal({ ...fields, id });
        db.meals = [saved];
        return saved;
    },
    insertWater: async (_userId: string, input: Record<string, unknown>) => {
        db.waterInserted.push(input);
        return {
            entry: {
                id: WATER_ID,
                user_id: "u1",
                amount_ml: (input.amount_ml as number) ?? 0,
                logged_at:
                    (input.logged_at as string | undefined) ??
                    "2026-08-07T00:00:00.000Z",
                notes: (input.notes as string | undefined) ?? null,
                created_at: "2026-08-07T00:00:00.000Z",
                idempotency_key: null,
            } as WaterEntry,
            deduplicated: db.dedupe,
        };
    },
    insertWeight: async (_userId: string, input: Record<string, unknown>) => {
        db.weightInserted.push(input);
        return {
            entry: {
                id: WEIGHT_ID,
                user_id: "u1",
                weight_g: (input.weight_g as number) ?? 0,
                logged_at:
                    (input.logged_at as string | undefined) ??
                    "2026-08-07T00:00:00.000Z",
                notes: (input.notes as string | undefined) ?? null,
                created_at: "2026-08-07T00:00:00.000Z",
                idempotency_key: null,
            } as WeightEntry,
            deduplicated: db.dedupe,
        };
    },
    updateWeight: async (
        _userId: string,
        id: string,
        fields: Record<string, unknown>,
    ) => {
        db.weightUpdates.push(fields);
        return {
            id,
            user_id: "u1",
            weight_g: (fields.weight_g as number | undefined) ?? 70_000,
            logged_at:
                (fields.logged_at as string | undefined) ??
                "2026-08-07T00:00:00.000Z",
            notes: (fields.notes as string | undefined) ?? null,
            created_at: "2026-08-07T00:00:00.000Z",
            idempotency_key: null,
        } as WeightEntry;
    },
    deleteMeal: async (_userId: string, id: string) => {
        db.deleteCalls += 1;
        if (db.failWith) throw db.failWith;
        const before = db.meals.length;
        db.meals = db.meals.filter((m) => m.id !== id);
        return db.meals.length < before;
    },
    deleteWater: async (_userId: string, id: string) => {
        db.deleteCalls += 1;
        return db.rowIds.delete(id);
    },
    insertActiveCalories: async (
        _userId: string,
        input: Record<string, unknown>,
    ) => {
        db.activeInserted.push(input);
        return {
            entry: {
                id: ACTIVE_ID,
                user_id: "u1",
                kcal: input.kcal as number,
                credit_pct: input.credit_pct as number,
                logged_at:
                    (input.logged_at as string | undefined) ??
                    "2026-08-07T00:00:00.000Z",
                notes: (input.notes as string | undefined) ?? null,
                created_at: "2026-08-07T00:00:00.000Z",
                idempotency_key: null,
            } as actualSupabase.ActiveCaloriesEntry,
            deduplicated: db.dedupe,
        };
    },
    getActivityInRange: async () => db.activeEntries,
    getAllActiveCalories: async () => db.activeEntries,
    deleteActiveCalories: async (_userId: string, id: string) => {
        db.deleteCalls += 1;
        return db.rowIds.delete(id);
    },
    activityCreditPctFromProfile: (profile: actualSupabase.Profile | null) =>
        realSupabase.activityCreditPctFromProfile(profile),
    deleteWeight: async (_userId: string, id: string) => {
        db.deleteCalls += 1;
        return db.rowIds.delete(id);
    },
    insertBodyMeasurement: async (
        _userId: string,
        input: Record<string, unknown>,
    ) => {
        db.measurementInserted.push(input);
        const defined = Object.fromEntries(
            Object.entries(input).filter(([, v]) => v !== undefined),
        ) as Partial<BodyMeasurementEntry>;
        return {
            entry: measurementRow({ ...defined, idempotency_key: null }),
            deduplicated: db.dedupe,
        };
    },
    getBodyMeasurementsInRange: async (
        _userId: string,
        s: string,
        e: string,
        tz: string,
        kind?: string,
    ) => {
        db.measurementRangeArgs.push({ s, e, tz, kind });
        return kind
            ? db.measurements.filter((m) => m.kind === kind)
            : db.measurements;
    },
    getBodyMeasurement: async (_userId: string, id: string) =>
        db.measurements.find((m) => m.id === id) ?? null,
    updateBodyMeasurement: async (
        _userId: string,
        id: string,
        fields: Record<string, unknown>,
    ) => {
        db.measurementUpdates.push(fields);
        const current = db.measurements.find((m) => m.id === id);
        if (!current)
            throw new ToolError(`No body measurement found with id ${id}.`);
        const defined = Object.fromEntries(
            Object.entries(fields).filter(([, v]) => v !== undefined),
        ) as Partial<BodyMeasurementEntry>;
        return { ...current, ...defined };
    },
    deleteBodyMeasurement: async (_userId: string, id: string) => {
        db.deleteCalls += 1;
        return db.rowIds.delete(id);
    },
    getPreferredLengthUnit: async () =>
        db.profile?.preferred_length_unit ?? null,
    getAllBodyMeasurements: async () => [],
    countMeals: async () => db.meals.length,
    existingIdempotencyKeys: async () => new Set<string>(),
    existingMealIds: async (_userId: string, ids: string[]) =>
        new Set(ids.filter((id) => db.meals.some((m) => m.id === id))),
    getPreferredWeightUnit: async () =>
        db.profile?.preferred_weight_unit ?? null,
    upsertNutritionGoals: async (
        _userId: string,
        patch: Record<string, unknown>,
    ) => {
        db.goals = { ...goals(), ...patch } as NutritionGoals;
        // The real function throws its history ToolError after the goal is
        // saved, so the stub saves first too.
        if (db.goalsHistoryFailure) throw db.goalsHistoryFailure;
        return db.goals;
    },
    upsertProfile: async (userId: string, patch: Record<string, unknown>) => {
        db.profilePatches.push(patch);
        db.profile = {
            ...(db.profile ?? { ...PROFILE_BASE, user_id: userId }),
            ...patch,
        } as actualSupabase.Profile;
        return db.profile;
    },
    // Ingredients and saved meals (the store functions behind the saved-meal
    // tools). Each mirrors the real contract: the name is unique per user,
    // deleting a saved meal unlinks the meals logged from it, and a missing
    // row is null or a ToolError the way the real functions report it.
    searchMeals: async () => db.searchResults,
    getMealItems: async (_userId: string, ids: string[]) => {
        if (db.mealItemsFailure) throw db.mealItemsFailure;
        return new Map(
            ids
                .filter((id) => db.mealItems.has(id))
                .map((id) => [id, db.mealItems.get(id)!]),
        );
    },
    countMealItems: async (_userId: string, id: string) =>
        db.mealItems.get(id)?.length ?? 0,
    // The provenance reader, served from the staged food_cache rows: a miss is
    // null, as the real reader reports it.
    getCachedFoodRecord: async (source: string, id: string) => {
        db.foodCacheReads.push(`${source}:${id}`);
        return db.foodRecords.get(`${source}:${id}`) ?? null;
    },
    getMealById: async (_userId: string, id: string) => {
        db.storedMealReads += 1;
        return db.meals.find((m) => m.id === id) ?? null;
    },
    replaceMealItems: async (
        _userId: string,
        id: string,
        fields: Record<string, unknown>,
        items: MealItemValues[],
    ) => {
        const current = db.meals.find((m) => m.id === id);
        if (!current) throw new ToolError(`No meal found with id ${id}.`);
        db.itemReplacements.push({ id, fields, items });
        db.mealItems.set(id, items);
        const saved = storedMeal({ ...current, ...fields, id });
        db.meals = db.meals.map((m) => (m.id === id ? saved : m));
        return saved;
    },
    createSavedMeal: async (
        userId: string,
        input: Record<string, unknown>,
        items: MealItemValues[],
    ) => {
        const name = input.name as string;
        const taken = db.savedMeals.find(
            (s) => s.name.toLowerCase() === name.toLowerCase(),
        );
        if (taken) throw new realSupabase.SavedMealNameTaken(taken.id);
        db.savedMealWrites.push({ input, items });
        const row = savedMealRow({
            id: savedMealId(db.savedMeals.length + 1),
            user_id: userId,
            name,
            description: input.description as string,
            meal_type: (input.meal_type as string | null) ?? null,
            // Every nutrient, as insert_saved_meal stores it, so a handler
            // that dropped one on the way would show in the reply.
            ...Object.fromEntries(
                MEAL_NUTRIENT_KEYS.map((k) => [
                    k,
                    (input[k] as number | null | undefined) ?? null,
                ]),
            ),
            nutrient_sources:
                (input.nutrient_sources as SavedMealWithItems["nutrient_sources"]) ??
                null,
            source_detail:
                (input.source_detail as SavedMealWithItems["source_detail"]) ??
                null,
            items,
        });
        db.savedMeals.push(row);
        return row;
    },
    getSavedMeals: async (
        _userId: string,
        opts: { nameContains?: string } = {},
    ) =>
        db.savedMeals
            .filter(
                (s) =>
                    !opts.nameContains ||
                    s.name
                        .toLowerCase()
                        .includes(opts.nameContains.trim().toLowerCase()),
            )
            .sort((a, b) =>
                a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
            ),
    getSavedMeal: async (_userId: string, id: string) =>
        db.savedMeals.find((s) => s.id === id) ?? null,
    findSavedMealsByName: async (_userId: string, name: string) =>
        db.savedMeals.filter(
            (s) => s.name.toLowerCase() === name.trim().toLowerCase(),
        ),
    countSavedMeals: async () => db.savedMeals.length,
    searchSavedMeals: async (_userId: string, queries: string[]) => {
        const saved = db.savedMeals
            .filter((s) =>
                queries.some((q) =>
                    [s.name, s.description, ...s.items.map((i) => i.name)].some(
                        (text) => text.toLowerCase().includes(q.toLowerCase()),
                    ),
                ),
            )
            .map((s) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                meal_type: s.meal_type,
                calories: s.calories,
                protein_g: s.protein_g,
                carbs_g: s.carbs_g,
                fat_g: s.fat_g,
                item_count: s.items.length,
            }));
        return { saved, total: saved.length };
    },
    updateSavedMeal: async (
        _userId: string,
        id: string,
        fields: Record<string, unknown>,
        items: MealItemValues[] | null,
    ) => fakeUpdateSavedMeal(id, fields, items),
    // The totals path's guarded write: the same row update, refused (as the
    // real one is) when the stored row no longer holds the guard.
    updateSavedMealIfUnchanged: async (
        _userId: string,
        id: string,
        fields: Record<string, unknown>,
        guard: Record<string, unknown>,
    ) => {
        const current = db.savedMeals.find((s) => s.id === id);
        if (!current) return null;
        if (db.concurrentSavedMealEdit) {
            const edit = db.concurrentSavedMealEdit;
            Object.assign(
                current,
                typeof edit === "function" ? edit(current) : edit,
            );
            if (!db.concurrentEditPersists) db.concurrentSavedMealEdit = null;
        }
        if (storedMoved(current, guard))
            throw new realSupabase.SnapshotConflictError(id);
        return fakeUpdateSavedMeal(id, fields, null);
    },
    deleteSavedMeal: async (_userId: string, id: string) => {
        const current = db.savedMeals.find((s) => s.id === id);
        if (!current) return null;
        db.savedMeals = db.savedMeals.filter((s) => s.id !== id);
        // Logged meals keep their values; only the link goes (the foreign key
        // is on delete set null).
        db.meals = db.meals.map((m) =>
            m.saved_meal_id === id ? { ...m, saved_meal_id: null } : m,
        );
        return current;
    },
}));

afterAll(() => {
    mock.module("./supabase.js", () => realSupabase);
});

beforeEach(() => {
    db.profile = { ...PROFILE_BASE };
    db.sameDayMeals = [];
    db.goals = null;
    db.healthSyncLink = null;
    db.healthSyncSentThrough = null;
    db.storedMealReads = 0;
    db.mealUpdateGuards = [];
    db.concurrentMealEdit = null;
    db.concurrentSavedMealEdit = null;
    db.concurrentEditPersists = false;
    db.mealItems = new Map();
    db.mealItemsFailure = null;
    db.itemReplacements = [];
    db.savedMeals = [];
    db.savedMealWrites = [];
    db.savedMealUpdates = [];
    db.searchResults = [];
    db.foodRecords = new Map();
    db.foodCacheReads = [];
    db.meals = [];
    db.mealRangeArgs = [];
    db.goalsHistory = [];
    db.goalsHistoryReads = 0;
    db.mealsBefore = false;
    db.mealsBeforeArgs = [];
    db.water = [];
    db.waterByDate = [];
    db.weights = [];
    db.weightReads = [];
    db.inserted = [];
    db.mealUpdates = [];
    db.waterInserted = [];
    db.activeEntries = [];
    db.activeInserted = [];
    db.weightInserted = [];
    db.weightUpdates = [];
    db.measurements = [];
    db.measurementInserted = [];
    db.measurementUpdates = [];
    db.measurementRangeArgs = [];
    db.profilePatches = [];
    db.rowIds = new Set<string>();
    db.analyticsRows = [];
    db.accountWipes = 0;
    db.profileReads = [];
    db.failWith = null;
    db.goalsHistoryFailure = null;
    db.deleteCalls = 0;
    db.dedupe = false;
});

registerMealSuites();
registerNutrientSuites();
registerSavedMealSuites();
registerGoalSuites();
registerMetricSuites();
registerInsightSuites();
registerFoodSuites();
registerProtocolSuites();
