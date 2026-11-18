import { activityIdempotencyKey, type ActivityEntry } from "../activity.js";
import { ToolError } from "../errors.js";
import { decodeEscapeSequences } from "../normalize.js";
import { zonedDayStartUtc, zonedNextDayStartUtc } from "../tz.js";
import { type BodyMeasurementKind, type LengthUnit } from "../units.js";
import {
    deriveIdempotencyKey,
    fetchAllPages,
    getSupabase,
    selectAllForUser,
    selectLoggedWindow,
} from "./client.js";

// ---------- Water log ----------

export interface WaterEntry {
    id: string;
    user_id: string;
    amount_ml: number;
    logged_at: string;
    notes: string | null;
    created_at: string;
    idempotency_key: string | null;
}

export interface WaterInput {
    amount_ml: number;
    logged_at?: string;
    notes?: string;
    idempotency_key?: string;
}

export interface WaterInsertResult {
    entry: WaterEntry;
    deduplicated: boolean;
}

export async function insertWater(
    userId: string,
    input: WaterInput,
): Promise<WaterInsertResult> {
    const sb = getSupabase();

    // Resolve logged_at once so the digest and the persisted row agree — and,
    // when omitted, this is the arrival time, so the derived key does not
    // survive a retry.
    const loggedAt = input.logged_at ?? new Date().toISOString();
    // Always populate the key: use the client's if given, otherwise derive a
    // stable one from the request content (see deriveIdempotencyKey).
    const idempotencyKey =
        input.idempotency_key ??
        deriveIdempotencyKey([userId, input.amount_ml, input.notes, loggedAt]);

    const { data: existing, error: selErr } = await sb
        .from("water_log")
        .select("*")
        .eq("user_id", userId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
    if (selErr) throw new Error(`Failed to look up water: ${selErr.message}`);
    if (existing) return { entry: existing as WaterEntry, deduplicated: true };

    const { data, error } = await sb
        .from("water_log")
        .insert({
            user_id: userId,
            amount_ml: input.amount_ml,
            logged_at: loggedAt,
            notes: input.notes ?? null,
            idempotency_key: idempotencyKey,
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            const { data: existing, error: raceErr } = await sb
                .from("water_log")
                .select("*")
                .eq("user_id", userId)
                .eq("idempotency_key", idempotencyKey)
                .maybeSingle();
            if (raceErr)
                throw new Error(
                    `Failed to resolve idempotent water: ${raceErr.message}`,
                );
            if (existing)
                return {
                    entry: existing as WaterEntry,
                    deduplicated: true,
                };
        }
        throw new Error(`Failed to insert water: ${error.message}`);
    }
    return { entry: data as WaterEntry, deduplicated: false };
}

export async function getWaterByDate(
    userId: string,
    date: string,
    tz: string = "UTC",
): Promise<WaterEntry[]> {
    return getWaterInRange(userId, date, date, tz);
}

export async function getWaterInRange(
    userId: string,
    startDate: string,
    endDate: string,
    tz: string = "UTC",
): Promise<WaterEntry[]> {
    const startUtc = zonedDayStartUtc(startDate, tz);
    const endUtc = zonedNextDayStartUtc(endDate, tz);

    return selectLoggedWindow<WaterEntry>(
        "water_log",
        "water",
        userId,
        startUtc,
        endUtc,
    );
}

/**
 * How many water rows this user already has. Independent exact count, used by
 * `getAllWater` to prove the paged fetch came back whole.
 */
export async function countWater(userId: string): Promise<number> {
    const { count, error } = await getSupabase()
        .from("water_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

    if (error) throw new Error(`Failed to count water: ${error.message}`);
    return count ?? 0;
}

/**
 * All of a user's water entries, oldest first — used by export_all_data. Pages
 * through `.range()` (see `fetchAllPages`) rather than one unbounded select,
 * since a heavy logger blows past PostgREST's 1000-row cap. `id` is a secondary
 * sort key so rows sharing a `logged_at` timestamp still get a stable order
 * across page boundaries — without it, ties straddling a page edge could be
 * skipped or duplicated. Reconciles the fetched total against `countWater` so a
 * truncated result throws instead of silently exporting less than the user has.
 */
export async function getAllWater(userId: string): Promise<WaterEntry[]> {
    const expected = await countWater(userId);
    if (expected === 0) return [];

    const entries = await fetchAllPages<WaterEntry>(async (from, to) => {
        const { data, error } = await getSupabase()
            .from("water_log")
            .select("*")
            .eq("user_id", userId)
            .order("logged_at", { ascending: true })
            .order("id", { ascending: true })
            .range(from, to);

        if (error) throw new Error(`Failed to get water: ${error.message}`);
        return (data as WaterEntry[]) ?? [];
    });

    if (entries.length < expected) {
        throw new Error(
            `getAllWater: fetched ${entries.length} entries but countWater reported ${expected} — export would be truncated`,
        );
    }
    return entries;
}

/** True when a row matched and was deleted; see deleteMeal. */
export async function deleteWater(
    userId: string,
    id: string,
): Promise<boolean> {
    const { data, error } = await getSupabase()
        .from("water_log")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id");

    if (error) throw new Error(`Failed to delete water: ${error.message}`);
    return (data?.length ?? 0) > 0;
}

// ---------- Active calories ----------

export interface ActiveCaloriesEntry extends ActivityEntry {
    id: string;
    user_id: string;
    logged_at: string;
    kcal: number;
    /** Snapshot of the profile's credit percentage when this row was written. */
    credit_pct: number;
    notes: string | null;
    created_at: string;
    idempotency_key: string | null;
    /** "apple_health" for a day total the activity sync wrote; null when
     *  logged by hand. Absent on rows read before the column existed. */
    source?: string | null;
    /** The local date an Apple Health day total covers; null otherwise. */
    source_date?: string | null;
}

export interface ActiveCaloriesInput {
    kcal: number;
    credit_pct: number;
    logged_at?: string;
    notes?: string;
    idempotency_key?: string;
}

export interface ActiveCaloriesInsertResult {
    entry: ActiveCaloriesEntry;
    deduplicated: boolean;
}

/**
 * Write one burn. Mirrors insertWater: a derived `auto:` key dedupes a retry
 * that carries the same logged_at, notes and kcal. `credit_pct` is the caller's
 * snapshot (from the profile at write time) and is stored on the row as given.
 */
export async function insertActiveCalories(
    userId: string,
    input: ActiveCaloriesInput,
): Promise<ActiveCaloriesInsertResult> {
    const sb = getSupabase();

    const loggedAt = input.logged_at ?? new Date().toISOString();
    const idempotencyKey =
        input.idempotency_key ??
        activityIdempotencyKey([userId, input.kcal, input.notes, loggedAt]);

    const { data: existing, error: selErr } = await sb
        .from("active_calories_log")
        .select("*")
        .eq("user_id", userId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
    if (selErr)
        throw new Error(`Failed to look up active calories: ${selErr.message}`);
    if (existing)
        return { entry: existing as ActiveCaloriesEntry, deduplicated: true };

    const { data, error } = await sb
        .from("active_calories_log")
        .insert({
            user_id: userId,
            kcal: input.kcal,
            credit_pct: input.credit_pct,
            logged_at: loggedAt,
            notes: input.notes ?? null,
            idempotency_key: idempotencyKey,
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            const { data: raced, error: raceErr } = await sb
                .from("active_calories_log")
                .select("*")
                .eq("user_id", userId)
                .eq("idempotency_key", idempotencyKey)
                .maybeSingle();
            if (raceErr)
                throw new Error(
                    `Failed to resolve idempotent active calories: ${raceErr.message}`,
                );
            if (raced)
                return {
                    entry: raced as ActiveCaloriesEntry,
                    deduplicated: true,
                };
        }
        throw new Error(`Failed to insert active calories: ${error.message}`);
    }
    return { entry: data as ActiveCaloriesEntry, deduplicated: false };
}

/**
 * Every burn with start <= logged_at < end in `tz`'s local days, oldest first.
 * Paged and reconciled through selectLoggedWindow like every other window read.
 * Serves both the one-day and the range readers (a day is start == end).
 */
export async function getActivityInRange(
    userId: string,
    startDate: string,
    endDate: string,
    tz: string = "UTC",
): Promise<ActiveCaloriesEntry[]> {
    const startUtc = zonedDayStartUtc(startDate, tz);
    const endUtc = zonedNextDayStartUtc(endDate, tz);

    return selectLoggedWindow<ActiveCaloriesEntry>(
        "active_calories_log",
        "active calories",
        userId,
        startUtc,
        endUtc,
    );
}

/** How many active-calorie rows this user already has (export reconciliation). */
export async function countActiveCalories(userId: string): Promise<number> {
    const { count, error } = await getSupabase()
        .from("active_calories_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

    if (error)
        throw new Error(`Failed to count active calories: ${error.message}`);
    return count ?? 0;
}

/**
 * All of a user's active-calorie rows, oldest first, for export_all_data. Pages
 * like getAllWater and reconciles against countActiveCalories, so a truncated
 * read throws instead of exporting less than the user has.
 */
export async function getAllActiveCalories(
    userId: string,
): Promise<ActiveCaloriesEntry[]> {
    const expected = await countActiveCalories(userId);
    if (expected === 0) return [];

    const entries = await fetchAllPages<ActiveCaloriesEntry>(
        async (from, to) => {
            const { data, error } = await getSupabase()
                .from("active_calories_log")
                .select("*")
                .eq("user_id", userId)
                .order("logged_at", { ascending: true })
                .order("id", { ascending: true })
                .range(from, to);

            if (error)
                throw new Error(
                    `Failed to get active calories: ${error.message}`,
                );
            return (data as ActiveCaloriesEntry[]) ?? [];
        },
    );

    if (entries.length < expected) {
        throw new Error(
            `getAllActiveCalories: fetched ${entries.length} entries but countActiveCalories reported ${expected} — export would be truncated`,
        );
    }
    return entries;
}

/** True when a row matched and was deleted; see deleteWater. */
export async function deleteActiveCalories(
    userId: string,
    id: string,
): Promise<boolean> {
    const { data, error } = await getSupabase()
        .from("active_calories_log")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id");

    if (error)
        throw new Error(`Failed to delete active calories: ${error.message}`);
    return (data?.length ?? 0) > 0;
}

/** One Apple Health day total for syncHealthActiveCalories. */
export interface HealthActivityDayWrite {
    date: string;
    kcal: number;
    logged_at: string;
    credit_pct: number;
}

/**
 * Write the activity sync's day totals: one row per local date, inserted or
 * replaced (never added to), through the service-role-only
 * sync_health_active_calories function
 * (20261103120000_health_activity_sync.sql), which keeps an existing day's
 * credit_pct snapshot. The caller validates every value. Returns how many
 * rows were inserted or changed.
 */
export async function syncHealthActiveCalories(
    userId: string,
    days: readonly HealthActivityDayWrite[],
): Promise<number> {
    if (days.length === 0) return 0;
    const { data, error } = await getSupabase().rpc(
        "sync_health_active_calories",
        { p_user_id: userId, p_days: days },
    );
    if (error)
        throw new Error(
            `Failed to store Apple Health active calories: ${error.message}`,
        );
    return typeof data === "number" ? data : 0;
}

// ---------- Weight log ----------

export interface WeightEntry {
    id: string;
    user_id: string;
    weight_g: number;
    logged_at: string;
    notes: string | null;
    created_at: string;
    idempotency_key: string | null;
}

export interface WeightInput {
    weight_g: number;
    logged_at?: string;
    notes?: string;
    idempotency_key?: string;
}

export interface WeightInsertResult {
    entry: WeightEntry;
    deduplicated: boolean;
}

export async function insertWeight(
    userId: string,
    input: WeightInput,
): Promise<WeightInsertResult> {
    const sb = getSupabase();

    // Resolve logged_at once so the digest and the persisted row agree — and,
    // when omitted, this is the arrival time, so the derived key does not
    // survive a retry.
    const loggedAt = input.logged_at ?? new Date().toISOString();
    // Always populate the key: use the client's if given, otherwise derive a
    // stable one from the request content (see deriveIdempotencyKey).
    const idempotencyKey =
        input.idempotency_key ??
        deriveIdempotencyKey([userId, input.weight_g, input.notes, loggedAt]);

    const { data: existing, error: selErr } = await sb
        .from("weight_log")
        .select("*")
        .eq("user_id", userId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
    if (selErr) throw new Error(`Failed to look up weight: ${selErr.message}`);
    if (existing) return { entry: existing as WeightEntry, deduplicated: true };

    const { data, error } = await sb
        .from("weight_log")
        .insert({
            user_id: userId,
            weight_g: input.weight_g,
            logged_at: loggedAt,
            notes: input.notes ?? null,
            idempotency_key: idempotencyKey,
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            const { data: existing, error: raceErr } = await sb
                .from("weight_log")
                .select("*")
                .eq("user_id", userId)
                .eq("idempotency_key", idempotencyKey)
                .maybeSingle();
            if (raceErr)
                throw new Error(
                    `Failed to resolve idempotent weight: ${raceErr.message}`,
                );
            if (existing)
                return {
                    entry: existing as WeightEntry,
                    deduplicated: true,
                };
        }
        throw new Error(`Failed to insert weight: ${error.message}`);
    }
    return { entry: data as WeightEntry, deduplicated: false };
}

export async function getWeightByDate(
    userId: string,
    date: string,
    tz: string = "UTC",
): Promise<WeightEntry[]> {
    return getWeightInRange(userId, date, date, tz);
}

export async function getWeightInRange(
    userId: string,
    startDate: string,
    endDate: string,
    tz: string = "UTC",
): Promise<WeightEntry[]> {
    const startUtc = zonedDayStartUtc(startDate, tz);
    const endUtc = zonedNextDayStartUtc(endDate, tz);

    return selectLoggedWindow<WeightEntry>(
        "weight_log",
        "weight",
        userId,
        startUtc,
        endUtc,
    );
}

/**
 * How many weight rows this user already has. Independent exact count, used by
 * `getAllWeight` to prove the paged fetch came back whole.
 */
export async function countWeight(userId: string): Promise<number> {
    const { count, error } = await getSupabase()
        .from("weight_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

    if (error) throw new Error(`Failed to count weight: ${error.message}`);
    return count ?? 0;
}

/**
 * All of a user's weight entries, oldest first — used by export_all_data. Pages
 * through `.range()` (see `fetchAllPages`) rather than one unbounded select,
 * since years of daily weigh-ins outrun PostgREST's 1000-row cap. `id` is a
 * secondary sort key so rows sharing a `logged_at` timestamp still get a stable
 * order across page boundaries — without it, ties straddling a page edge could
 * be skipped or duplicated. Reconciles the fetched total against `countWeight`
 * so a truncated result throws instead of silently exporting less than the user
 * has.
 */
export async function getAllWeight(userId: string): Promise<WeightEntry[]> {
    const expected = await countWeight(userId);
    if (expected === 0) return [];

    const entries = await fetchAllPages<WeightEntry>(async (from, to) => {
        const { data, error } = await getSupabase()
            .from("weight_log")
            .select("*")
            .eq("user_id", userId)
            .order("logged_at", { ascending: true })
            .order("id", { ascending: true })
            .range(from, to);

        if (error) throw new Error(`Failed to get weight: ${error.message}`);
        return (data as WeightEntry[]) ?? [];
    });

    if (entries.length < expected) {
        throw new Error(
            `getAllWeight: fetched ${entries.length} entries but countWeight reported ${expected} — export would be truncated`,
        );
    }
    return entries;
}

/** Most recent weight entry overall, or null if none logged. */
export async function getLatestWeight(
    userId: string,
): Promise<WeightEntry | null> {
    const { data, error } = await getSupabase()
        .from("weight_log")
        .select("*")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw new Error(`Failed to get latest weight: ${error.message}`);
    return (data as WeightEntry | null) ?? null;
}

export async function updateWeight(
    userId: string,
    id: string,
    fields: { weight_g?: number; logged_at?: string; notes?: string | null },
): Promise<WeightEntry> {
    const update: Record<string, unknown> = {};
    if (fields.weight_g !== undefined) update.weight_g = fields.weight_g;
    if (fields.logged_at !== undefined) update.logged_at = fields.logged_at;
    if (fields.notes !== undefined)
        update.notes =
            fields.notes != null
                ? decodeEscapeSequences(fields.notes)
                : fields.notes;

    // No `.single()` here (unlike updateMeal, which pre-checks existence in a
    // separate query): a stale/wrong/other-user's id then matches zero rows,
    // which `.select()` reports as an empty array rather than PostgREST's
    // opaque "JSON object requested, multiple (or no) rows returned" — one
    // round trip, and no window between a check and the update itself where
    // a concurrent delete could reintroduce that same opaque error.
    const { data, error } = await getSupabase()
        .from("weight_log")
        .update(update)
        .eq("id", id)
        .eq("user_id", userId)
        .select();

    if (error) throw new Error(`Failed to update weight: ${error.message}`);
    if (!data || data.length === 0)
        throw new ToolError(`No weight entry found with id ${id}.`);
    return data[0] as WeightEntry;
}

/** Returns true if an entry was deleted, false if no matching row was found. */
export async function deleteWeight(
    userId: string,
    id: string,
): Promise<boolean> {
    const { data, error } = await getSupabase()
        .from("weight_log")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id");

    if (error) throw new Error(`Failed to delete weight: ${error.message}`);
    return (data?.length ?? 0) > 0;
}

// ---------- Body measurements ----------

export interface BodyMeasurementEntry {
    id: string;
    user_id: string;
    kind: BodyMeasurementKind;
    // Canonical value; every conversion and comparison reads this.
    value_mm: number;
    // Exactly what the user typed, in entered_unit — shown back verbatim when
    // displaying in that unit. A `numeric` column, which PostgREST may return
    // as a string, so readers wrap it in Number().
    value_entered: number;
    entered_unit: LengthUnit;
    logged_at: string;
    notes: string | null;
    created_at: string;
    idempotency_key: string | null;
}

export interface BodyMeasurementInput {
    kind: BodyMeasurementKind;
    value_mm: number;
    value_entered: number;
    entered_unit: LengthUnit;
    logged_at?: string;
    notes?: string;
    idempotency_key?: string;
}

export interface BodyMeasurementInsertResult {
    entry: BodyMeasurementEntry;
    deduplicated: boolean;
}

// The digest is POSITIONAL, so this field list is frozen once shipped (see
// deriveIdempotencyKey). `kind` keeps waist 80 cm and hips 80 cm logged at the
// same instant as two rows; value_mm (not value_entered/entered_unit) means
// 80 cm and 31.5 in of the same site and instant are one measurement.
export function bodyMeasurementIdempotencyKey(
    userId: string,
    input: Pick<BodyMeasurementInput, "kind" | "value_mm" | "notes">,
    loggedAt: string,
): string {
    return deriveIdempotencyKey([
        userId,
        input.kind,
        input.value_mm,
        input.notes,
        loggedAt,
    ]);
}

export async function insertBodyMeasurement(
    userId: string,
    input: BodyMeasurementInput,
): Promise<BodyMeasurementInsertResult> {
    const sb = getSupabase();

    // Resolve logged_at once so the digest and the persisted row agree — and,
    // when omitted, this is the arrival time, so the derived key does not
    // survive a retry.
    const loggedAt = input.logged_at ?? new Date().toISOString();
    // Decoded before hashing, unlike insertWeight/insertWater (issue #79),
    // which will be aligned there.
    const notes =
        input.notes != null ? decodeEscapeSequences(input.notes) : undefined;
    const idempotencyKey =
        input.idempotency_key ??
        bodyMeasurementIdempotencyKey(
            userId,
            { kind: input.kind, value_mm: input.value_mm, notes },
            loggedAt,
        );

    const { data: existing, error: selErr } = await sb
        .from("body_measurement_log")
        .select("*")
        .eq("user_id", userId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
    if (selErr)
        throw new Error(
            `Failed to look up body measurement: ${selErr.message}`,
        );
    if (existing)
        return { entry: existing as BodyMeasurementEntry, deduplicated: true };

    const { data, error } = await sb
        .from("body_measurement_log")
        .insert({
            user_id: userId,
            kind: input.kind,
            value_mm: input.value_mm,
            value_entered: input.value_entered,
            entered_unit: input.entered_unit,
            logged_at: loggedAt,
            notes: notes ?? null,
            idempotency_key: idempotencyKey,
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            const { data: existing, error: raceErr } = await sb
                .from("body_measurement_log")
                .select("*")
                .eq("user_id", userId)
                .eq("idempotency_key", idempotencyKey)
                .maybeSingle();
            if (raceErr)
                throw new Error(
                    `Failed to resolve idempotent body measurement: ${raceErr.message}`,
                );
            if (existing)
                return {
                    entry: existing as BodyMeasurementEntry,
                    deduplicated: true,
                };
        }
        throw new Error(`Failed to insert body measurement: ${error.message}`);
    }
    return { entry: data as BodyMeasurementEntry, deduplicated: false };
}

/** Every measurement in the local-date window, oldest first; `kind` narrows it in the database. */
export async function getBodyMeasurementsInRange(
    userId: string,
    startDate: string,
    endDate: string,
    tz: string = "UTC",
    kind?: BodyMeasurementKind,
): Promise<BodyMeasurementEntry[]> {
    return selectLoggedWindow<BodyMeasurementEntry>(
        "body_measurement_log",
        "body measurements",
        userId,
        zonedDayStartUtc(startDate, tz),
        zonedNextDayStartUtc(endDate, tz),
        kind ? { kind } : undefined,
    );
}

/** One of the user's measurements by id, or null. */
export async function getBodyMeasurement(
    userId: string,
    id: string,
): Promise<BodyMeasurementEntry | null> {
    const { data, error } = await getSupabase()
        .from("body_measurement_log")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();

    if (error)
        throw new Error(`Failed to look up body measurement: ${error.message}`);
    return (data as BodyMeasurementEntry | null) ?? null;
}

/**
 * Same shape as updateWeight. The three value fields describe one reading, so
 * they travel together or not at all; `kind` is not editable. The idempotency
 * key is not recomputed, as in weight.
 */
export async function updateBodyMeasurement(
    userId: string,
    id: string,
    fields: {
        value_mm?: number;
        value_entered?: number;
        entered_unit?: LengthUnit;
        logged_at?: string;
        notes?: string | null;
    },
): Promise<BodyMeasurementEntry> {
    const valueFields = [
        fields.value_mm,
        fields.value_entered,
        fields.entered_unit,
    ].filter((v) => v !== undefined).length;
    if (valueFields !== 0 && valueFields !== 3) {
        // A handler bug, not caller input: deliberately a plain Error.
        throw new Error(
            "updateBodyMeasurement: value fields must be passed together",
        );
    }

    const update: Record<string, unknown> = {};
    if (valueFields === 3) {
        update.value_mm = fields.value_mm;
        update.value_entered = fields.value_entered;
        update.entered_unit = fields.entered_unit;
    }
    if (fields.logged_at !== undefined) update.logged_at = fields.logged_at;
    if (fields.notes !== undefined)
        update.notes =
            fields.notes != null
                ? decodeEscapeSequences(fields.notes)
                : fields.notes;

    // No `.single()`: see updateWeight — a wrong id comes back as an empty
    // array, answered with a ToolError below.
    const { data, error } = await getSupabase()
        .from("body_measurement_log")
        .update(update)
        .eq("id", id)
        .eq("user_id", userId)
        .select();

    if (error)
        throw new Error(`Failed to update body measurement: ${error.message}`);
    if (!data || data.length === 0)
        throw new ToolError(`No body measurement found with id ${id}.`);
    return data[0] as BodyMeasurementEntry;
}

/** Returns true if an entry was deleted, false if no matching row was found. */
export async function deleteBodyMeasurement(
    userId: string,
    id: string,
): Promise<boolean> {
    const { data, error } = await getSupabase()
        .from("body_measurement_log")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id");

    if (error)
        throw new Error(`Failed to delete body measurement: ${error.message}`);
    return (data?.length ?? 0) > 0;
}

/**
 * All of a user's body measurements, oldest first — used by export_all_data.
 * Rides selectAllForUser, so it pages, dedupes by id and reconciles against
 * the first page's exact count without a separate count query.
 */
export function getAllBodyMeasurements(
    userId: string,
): Promise<BodyMeasurementEntry[]> {
    return selectAllForUser<BodyMeasurementEntry>(
        "body_measurement_log",
        "*",
        "body measurements",
        userId,
        ["logged_at", "id"],
        "id",
    );
}
