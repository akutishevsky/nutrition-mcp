import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { zonedDayStartUtc, zonedNextDayStartUtc } from "./tz.js";
import { decodeEscapeSequences } from "./normalize.js";
import { isWeightUnit, toStoredInteger, type WeightUnit } from "./units.js";
import { isDrinkUnit, type DrinkUnit } from "./alcohol.js";
import { escapeLikePattern, tokenizeQuery } from "./search.js";

let supabase: SupabaseClient;

function buildClient(): SupabaseClient {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
        throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
    }
    // persistSession: false keeps the client stateless — signIn/signUp on this
    // client won't attach a user JWT to future requests. Without this, the
    // singleton would silently downgrade from service-role to authenticated
    // after any auth call, making RLS fire on subsequent writes.
    return createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
}

export function getSupabase(): SupabaseClient {
    if (!supabase) supabase = buildClient();
    return supabase;
}

// ---------- Auth ----------

export async function signUpUser(
    email: string,
    password: string,
): Promise<string> {
    // Use a throw-away client so the session never lands on the shared singleton.
    const { data, error } = await buildClient().auth.signUp({
        email,
        password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Sign-up failed");
    return data.user.id;
}

export async function signInUser(
    email: string,
    password: string,
): Promise<string> {
    const { data, error } = await buildClient().auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw new Error(error.message);
    return data.user.id;
}

export async function signInWithGoogleIdToken(
    idToken: string,
    nonce: string,
): Promise<string> {
    // Use a throw-away client so the session never lands on the shared singleton.
    const { data, error } = await buildClient().auth.signInWithIdToken({
        provider: "google",
        token: idToken,
        nonce,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Google sign-in failed");
    return data.user.id;
}

// ---------- Idempotency ----------

// Derive a stable idempotency key from the request content so the column is
// always populated and retries dedupe even when the client omits a key. The
// resolved logged_at is part of the digest, so two genuinely separate but
// otherwise-identical entries (logged at different times) get distinct keys and
// are never wrongly merged. A retry replays the same args — including the same
// logged_at — and therefore lands on the same key. The "auto:" prefix marks
// server-derived keys, distinguishing them from client-supplied ones.
//
// The digest is POSITIONAL over whatever the caller passes, so the field list
// at each call site is frozen: see the warning inside mealIdempotencyKey before
// touching one.
function deriveIdempotencyKey(
    parts: (string | number | null | undefined)[],
): string {
    const digest = new Bun.CryptoHasher("sha256")
        .update(parts.map((p) => p ?? "").join("\u0000"))
        .digest("hex");
    return `auto:${digest}`;
}

// ---------- Meals ----------

export interface Meal {
    id: string;
    user_id: string;
    logged_at: string;
    meal_type: string | null;
    description: string;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    // Total sugars (not added sugar); alcohol is pure ethanol in grams.
    fiber_g: number | null;
    sugar_g: number | null;
    alcohol_g: number | null;
    notes: string | null;
    idempotency_key: string | null;
}

export interface MealInput {
    description: string;
    meal_type: "breakfast" | "lunch" | "dinner" | "snack";
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    fiber_g?: number;
    sugar_g?: number;
    alcohol_g?: number;
    logged_at?: string;
    notes?: string;
    idempotency_key?: string;
}

export interface MealInsertResult {
    meal: Meal;
    deduplicated: boolean;
}

/**
 * The server-derived idempotency key for a meal write, over the resolved
 * logged_at (so the digest and the persisted row agree). Exported and pure so
 * the frozen field list below is testable directly — see
 * src/supabase.test.ts — exactly as rowContentDigest is in src/import.ts.
 */
export function mealIdempotencyKey(
    userId: string,
    input: MealInput,
    loggedAt: string,
): string {
    // DO NOT ADD FIELDS TO THIS ARRAY. It is deliberately incomplete:
    // fiber_g, sugar_g and alcohol_g are EXCLUDED on purpose, and any future
    // meal column must be too. The digest is positional over exactly these
    // values, so appending one changes the derived key of every future write —
    // a user re-logging or re-importing something they already have would get a
    // duplicate row instead of a clean no-op. This repo has shipped that bug
    // once already (see CLAUDE.md, "Bulk meal import"); the mirror of this array
    // is rowContentDigest in src/import.ts, which carries the same warning.
    //
    // Accepted consequence: two meals identical except for their fiber (or
    // sugar, or alcohol) dedupe to one. Dedup stability beats precision here,
    // and a caller who needs distinct rows can pass an explicit
    // idempotency_key.
    return deriveIdempotencyKey([
        userId,
        input.description,
        input.meal_type,
        input.calories,
        input.protein_g,
        input.carbs_g,
        input.fat_g,
        input.notes,
        loggedAt,
    ]);
}

export async function insertMeal(
    userId: string,
    input: MealInput,
): Promise<MealInsertResult> {
    const sb = getSupabase();

    // calories is an integer column and Postgres rejects a fractional value
    // outright (22P02), so round before anything else reads the input — the
    // digest below included, or re-logging the same meal would derive a key
    // from 388.54 while the stored row said 389 and the dedup would miss.
    const meal: MealInput =
        input.calories == null
            ? input
            : { ...input, calories: toStoredInteger(input.calories) };

    // Resolve logged_at once so the digest and the persisted row agree.
    const loggedAt = meal.logged_at ?? new Date().toISOString();
    // Always populate the key: use the client's if given, otherwise derive a
    // stable one from the request content (see mealIdempotencyKey).
    const idempotencyKey =
        meal.idempotency_key ?? mealIdempotencyKey(userId, meal, loggedAt);

    const { data: existing, error: selErr } = await sb
        .from("meals")
        .select("*")
        .eq("user_id", userId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
    if (selErr) throw new Error(`Failed to look up meal: ${selErr.message}`);
    if (existing) return { meal: existing as Meal, deduplicated: true };

    const { data, error } = await sb
        .from("meals")
        .insert({
            user_id: userId,
            description: decodeEscapeSequences(meal.description),
            meal_type: meal.meal_type,
            calories: meal.calories ?? null,
            protein_g: meal.protein_g ?? null,
            carbs_g: meal.carbs_g ?? null,
            fat_g: meal.fat_g ?? null,
            fiber_g: meal.fiber_g ?? null,
            sugar_g: meal.sugar_g ?? null,
            alcohol_g: meal.alcohol_g ?? null,
            logged_at: loggedAt,
            notes:
                meal.notes != null ? decodeEscapeSequences(meal.notes) : null,
            idempotency_key: idempotencyKey,
        })
        .select()
        .single();

    if (error) {
        // Concurrent retry with the same idempotency key — the other request
        // already inserted the row. Fetch and return it instead of failing.
        if (error.code === "23505") {
            const { data: existing, error: raceErr } = await sb
                .from("meals")
                .select("*")
                .eq("user_id", userId)
                .eq("idempotency_key", idempotencyKey)
                .maybeSingle();
            if (raceErr)
                throw new Error(
                    `Failed to resolve idempotent meal: ${raceErr.message}`,
                );
            if (existing) return { meal: existing as Meal, deduplicated: true };
        }
        throw new Error(`Failed to insert meal: ${error.message}`);
    }
    return { meal: data as Meal, deduplicated: false };
}

export async function getMealsByDate(
    userId: string,
    date: string,
    tz: string = "UTC",
): Promise<Meal[]> {
    const startUtc = zonedDayStartUtc(date, tz);
    const endUtc = zonedNextDayStartUtc(date, tz);

    const { data, error } = await getSupabase()
        .from("meals")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", startUtc.toISOString())
        .lt("logged_at", endUtc.toISOString())
        .order("logged_at", { ascending: true });

    if (error) throw new Error(`Failed to get meals: ${error.message}`);
    return (data as Meal[]) ?? [];
}

export async function getMealsInRange(
    userId: string,
    startDate: string,
    endDate: string,
    tz: string = "UTC",
): Promise<Meal[]> {
    const startUtc = zonedDayStartUtc(startDate, tz);
    const endUtc = zonedNextDayStartUtc(endDate, tz);

    const { data, error } = await getSupabase()
        .from("meals")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", startUtc.toISOString())
        .lt("logged_at", endUtc.toISOString())
        .order("logged_at", { ascending: true });

    if (error) throw new Error(`Failed to get meals: ${error.message}`);
    return (data as Meal[]) ?? [];
}

/**
 * How many meal rows this user already has. Used by bulk import to bound total
 * growth: rate limiting is per HTTP request, so one batched call writes many
 * rows for a single limiter hit.
 */
export async function countMeals(userId: string): Promise<number> {
    const { count, error } = await getSupabase()
        .from("meals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

    if (error) throw new Error(`Failed to count meals: ${error.message}`);
    return count ?? 0;
}

/**
 * Which of `keys` are already present for this user. Lets a dry-run import
 * predict deduplication instead of promising creates that will not happen.
 */
export async function existingIdempotencyKeys(
    userId: string,
    keys: string[],
): Promise<Set<string>> {
    if (keys.length === 0) return new Set();

    const { data, error } = await getSupabase()
        .from("meals")
        .select("idempotency_key")
        .eq("user_id", userId)
        .in("idempotency_key", keys);

    if (error) {
        throw new Error(`Failed to check existing meals: ${error.message}`);
    }
    return new Set(
        ((data as { idempotency_key: string | null }[]) ?? [])
            .map((r) => r.idempotency_key)
            .filter((k): k is string => k !== null),
    );
}

/**
 * Fetch pages via `fetchPage(from, to)` (inclusive, 0-indexed) until a page
 * comes back shorter than `pageSize`. A plain unbounded select silently caps
 * at PostgREST's `db-max-rows` (default 1000), so any query that can return
 * more rows than that must page through `.range()` instead of relying on one
 * request to return everything.
 */
export async function fetchAllPages<T>(
    fetchPage: (from: number, to: number) => Promise<T[]>,
    pageSize = 1000,
): Promise<T[]> {
    const all: T[] = [];
    for (let from = 0; ; from += pageSize) {
        const page = await fetchPage(from, from + pageSize - 1);
        all.push(...page);
        if (page.length < pageSize) break;
    }
    return all;
}

/**
 * All of a user's meals, oldest first — used by export_meals. Pages through
 * `.range()` (see `fetchAllPages`) rather than one unbounded select, since a
 * user can have up to MAX_MEALS_PER_USER (200,000) meals, far past the
 * PostgREST row cap. `id` is a secondary sort key so rows sharing a
 * `logged_at` timestamp still get a stable order across page boundaries —
 * without it, ties straddling a page edge could be skipped or duplicated.
 * Reconciles the fetched total against `countMeals` (an independent exact
 * count) so a truncated result throws instead of silently exporting less
 * than the user has.
 */
export async function getAllMeals(userId: string): Promise<Meal[]> {
    const expected = await countMeals(userId);
    if (expected === 0) return [];

    const meals = await fetchAllPages<Meal>(async (from, to) => {
        const { data, error } = await getSupabase()
            .from("meals")
            .select("*")
            .eq("user_id", userId)
            .order("logged_at", { ascending: true })
            .order("id", { ascending: true })
            .range(from, to);

        if (error) throw new Error(`Failed to get meals: ${error.message}`);
        return (data as Meal[]) ?? [];
    });

    if (meals.length < expected) {
        throw new Error(
            `getAllMeals: fetched ${meals.length} meals but countMeals reported ${expected} — export would be truncated`,
        );
    }
    return meals;
}

// Keyword search over past meals. Each query string is an alternative (OR'd
// across, e.g. the same food in two languages); within one alternative every
// word token must match the column (AND'd via chained .ilike). We deliberately
// avoid PostgREST's .or() — its logic-tree grammar treats commas/parens inside
// values as structure and supabase-js does not quote them — and instead run
// one cheap per-user query per (alternative × column) and merge in code.
export async function searchMeals(
    userId: string,
    queries: string[],
    opts: { limit?: number; sinceIso?: string } = {},
): Promise<Meal[]> {
    const limit = opts.limit ?? 50;
    const tokenized = queries
        .map(tokenizeQuery)
        .filter((tokens) => tokens.length > 0);
    if (tokenized.length === 0) return [];

    const buildQuery = (tokens: string[], column: "description" | "notes") => {
        let q = getSupabase().from("meals").select("*").eq("user_id", userId);
        if (opts.sinceIso) q = q.gte("logged_at", opts.sinceIso);
        for (const token of tokens) {
            q = q.ilike(column, `%${escapeLikePattern(token)}%`);
        }
        return q.order("logged_at", { ascending: false }).limit(limit);
    };

    const results = await Promise.all(
        tokenized.flatMap((tokens) => [
            buildQuery(tokens, "description"),
            buildQuery(tokens, "notes"),
        ]),
    );

    const seen = new Set<string>();
    const merged: Meal[] = [];
    for (const { data, error } of results) {
        if (error) {
            throw new Error(`Failed to search meals: ${error.message}`);
        }
        for (const meal of (data as Meal[]) ?? []) {
            if (!seen.has(meal.id)) {
                seen.add(meal.id);
                merged.push(meal);
            }
        }
    }
    merged.sort((a, b) => b.logged_at.localeCompare(a.logged_at));
    return merged.slice(0, limit);
}

export async function deleteMeal(userId: string, id: string): Promise<void> {
    const { error } = await getSupabase()
        .from("meals")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) throw new Error(`Failed to delete meal: ${error.message}`);
}

export async function updateMeal(
    userId: string,
    id: string,
    fields: Partial<MealInput>,
): Promise<Meal> {
    const update: Record<string, unknown> = {};
    if (fields.description !== undefined)
        update.description = decodeEscapeSequences(fields.description);
    if (fields.meal_type !== undefined) update.meal_type = fields.meal_type;
    // Integer column — see toStoredInteger.
    if (fields.calories !== undefined)
        update.calories = toStoredInteger(fields.calories);
    if (fields.protein_g !== undefined) update.protein_g = fields.protein_g;
    if (fields.carbs_g !== undefined) update.carbs_g = fields.carbs_g;
    if (fields.fat_g !== undefined) update.fat_g = fields.fat_g;
    if (fields.fiber_g !== undefined) update.fiber_g = fields.fiber_g;
    if (fields.sugar_g !== undefined) update.sugar_g = fields.sugar_g;
    if (fields.alcohol_g !== undefined) update.alcohol_g = fields.alcohol_g;
    if (fields.logged_at !== undefined) update.logged_at = fields.logged_at;
    if (fields.notes !== undefined)
        update.notes =
            fields.notes != null
                ? decodeEscapeSequences(fields.notes)
                : fields.notes;

    const { data, error } = await getSupabase()
        .from("meals")
        .update(update)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) throw new Error(`Failed to update meal: ${error.message}`);
    return data as Meal;
}

// ---------- Profiles ----------

export interface Profile {
    user_id: string;
    timezone: string;
    preferred_weight_unit: WeightUnit | null;
    widgets_enabled: boolean;
    alcohol_tracking_enabled: boolean;
    preferred_drink_unit: DrinkUnit | null;
    created_at: string;
    updated_at: string;
}

export async function getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await getSupabase()
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw new Error(`Failed to get profile: ${error.message}`);
    return (data as Profile | null) ?? null;
}

export async function getUserTimezone(userId: string): Promise<string> {
    const profile = await getProfile(userId);
    return profile?.timezone ?? "UTC";
}

// Returns the user's saved weight-unit preference, or null if they have never
// chosen one. Write paths use null to refuse guessing; display paths coalesce
// to "kg".
export async function getPreferredWeightUnit(
    userId: string,
): Promise<WeightUnit | null> {
    const profile = await getProfile(userId);
    const unit = profile?.preferred_weight_unit;
    return isWeightUnit(unit) ? unit : null;
}

// The three display preferences below come in two halves: a pure
// *FromProfile derivation over an already-fetched row, and a thin fetching
// wrapper kept for existing call sites. A caller that needs more than one of
// them (buildMcpServer needs all three) should call getProfile once and derive
// locally — each wrapper is its own `select * from profiles` round trip, so
// chaining them multiplies an identical query by the number of preferences
// read.

// Whether in-chat widgets should be shown for this user. Defaults to true when
// no profile exists yet, or (for backward compatibility) when the column is
// absent — widgets are on for everyone until a user explicitly opts out.
export function widgetsEnabledFromProfile(
    profile: Profile | null | undefined,
): boolean {
    return profile?.widgets_enabled ?? true;
}

export async function getWidgetsEnabled(userId: string): Promise<boolean> {
    return widgetsEnabledFromProfile(await getProfile(userId));
}

// Whether alcohol should be surfaced for this user. Defaults to false when no
// profile exists yet, or when the column is absent — alcohol tracking is opt-in,
// so the fallback must be "off". Storage is unaffected: alcohol explicitly
// passed is always persisted, this only gates display.
//
// The `?? false` is not a stylistic default: flipping it turns the opt-in into
// an opt-out and starts surfacing alcohol — including the trace alcohol that
// third-party recipe exports carry — to users who never asked to see it, which
// is the documented harm this toggle exists to prevent.
export function alcoholTrackingEnabledFromProfile(
    profile: Profile | null | undefined,
): boolean {
    return profile?.alcohol_tracking_enabled ?? false;
}

export async function getAlcoholTrackingEnabled(
    userId: string,
): Promise<boolean> {
    return alcoholTrackingEnabledFromProfile(await getProfile(userId));
}

// Returns the user's saved drink-unit preference, or null if they have never
// chosen one. Display paths coalesce null to "us"; storage stays in grams of
// ethanol either way. The isDrinkUnit guard is load-bearing: the column is
// free-form text to the client, so anything unrecognised must degrade to "no
// preference" rather than flow into a Record<DrinkUnit, …> lookup as undefined.
export function preferredDrinkUnitFromProfile(
    profile: Profile | null | undefined,
): DrinkUnit | null {
    const unit = profile?.preferred_drink_unit;
    return isDrinkUnit(unit) ? unit : null;
}

export async function getPreferredDrinkUnit(
    userId: string,
): Promise<DrinkUnit | null> {
    return preferredDrinkUnitFromProfile(await getProfile(userId));
}

// Upsert the fields provided in `patch`, leaving other columns untouched. On
// first insert, omitted columns fall back to their DB defaults (UTC / kg).
export async function upsertProfile(
    userId: string,
    patch: {
        timezone?: string;
        preferred_weight_unit?: WeightUnit | null;
        widgets_enabled?: boolean;
        alcohol_tracking_enabled?: boolean;
        preferred_drink_unit?: DrinkUnit | null;
    },
): Promise<Profile> {
    const payload: Record<string, unknown> = {
        user_id: userId,
        updated_at: new Date().toISOString(),
    };
    if (patch.timezone !== undefined) payload.timezone = patch.timezone;
    // null is meaningful here (clears the preference), so only skip `undefined`.
    if (patch.preferred_weight_unit !== undefined)
        payload.preferred_weight_unit = patch.preferred_weight_unit;
    if (patch.widgets_enabled !== undefined)
        payload.widgets_enabled = patch.widgets_enabled;
    if (patch.alcohol_tracking_enabled !== undefined)
        payload.alcohol_tracking_enabled = patch.alcohol_tracking_enabled;
    // null is meaningful here too (clears the preference).
    if (patch.preferred_drink_unit !== undefined)
        payload.preferred_drink_unit = patch.preferred_drink_unit;

    const { data, error } = await getSupabase()
        .from("profiles")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();

    if (error) throw new Error(`Failed to save profile: ${error.message}`);
    return data as Profile;
}

// ---------- Nutrition goals ----------

export interface NutritionGoals {
    user_id: string;
    daily_calories: number | null;
    daily_protein_g: number | null;
    daily_carbs_g: number | null;
    daily_fat_g: number | null;
    daily_fiber_g: number | null;
    // Total sugars, and pure ethanol. Both are ceilings ("stay under"), unlike
    // every other goal here, which is a floor — see formatGoalLine in mcp.ts.
    daily_sugar_g: number | null;
    daily_alcohol_g: number | null;
    daily_water_ml: number | null;
    target_weight_g: number | null;
    updated_at: string;
}

export interface NutritionGoalsInput {
    daily_calories?: number | null;
    daily_protein_g?: number | null;
    daily_carbs_g?: number | null;
    daily_fat_g?: number | null;
    daily_fiber_g?: number | null;
    daily_sugar_g?: number | null;
    daily_alcohol_g?: number | null;
    daily_water_ml?: number | null;
    target_weight_g?: number | null;
}

export async function upsertNutritionGoals(
    userId: string,
    input: NutritionGoalsInput,
): Promise<NutritionGoals> {
    const { data, error } = await getSupabase()
        .from("nutrition_goals")
        .upsert(
            {
                user_id: userId,
                // daily_calories and daily_water_ml are integer columns; the
                // gram targets are numeric(6,2). See toStoredInteger — a water
                // goal converted from "half a gallon" arrives fractional.
                daily_calories:
                    input.daily_calories == null
                        ? null
                        : toStoredInteger(input.daily_calories),
                daily_protein_g: input.daily_protein_g ?? null,
                daily_carbs_g: input.daily_carbs_g ?? null,
                daily_fat_g: input.daily_fat_g ?? null,
                daily_fiber_g: input.daily_fiber_g ?? null,
                daily_sugar_g: input.daily_sugar_g ?? null,
                daily_alcohol_g: input.daily_alcohol_g ?? null,
                daily_water_ml:
                    input.daily_water_ml == null
                        ? null
                        : toStoredInteger(input.daily_water_ml),
                target_weight_g: input.target_weight_g ?? null,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
        )
        .select()
        .single();

    if (error) throw new Error(`Failed to save goals: ${error.message}`);
    return data as NutritionGoals;
}

export async function getNutritionGoals(
    userId: string,
): Promise<NutritionGoals | null> {
    const { data, error } = await getSupabase()
        .from("nutrition_goals")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw new Error(`Failed to get goals: ${error.message}`);
    return (data as NutritionGoals | null) ?? null;
}

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

    // Resolve logged_at once so the digest and the persisted row agree.
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
    const startUtc = zonedDayStartUtc(date, tz);
    const endUtc = zonedNextDayStartUtc(date, tz);

    const { data, error } = await getSupabase()
        .from("water_log")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", startUtc.toISOString())
        .lt("logged_at", endUtc.toISOString())
        .order("logged_at", { ascending: true });

    if (error) throw new Error(`Failed to get water: ${error.message}`);
    return (data as WaterEntry[]) ?? [];
}

export async function getWaterInRange(
    userId: string,
    startDate: string,
    endDate: string,
    tz: string = "UTC",
): Promise<WaterEntry[]> {
    const startUtc = zonedDayStartUtc(startDate, tz);
    const endUtc = zonedNextDayStartUtc(endDate, tz);

    const { data, error } = await getSupabase()
        .from("water_log")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", startUtc.toISOString())
        .lt("logged_at", endUtc.toISOString())
        .order("logged_at", { ascending: true });

    if (error) throw new Error(`Failed to get water: ${error.message}`);
    return (data as WaterEntry[]) ?? [];
}

export async function deleteWater(userId: string, id: string): Promise<void> {
    const { error } = await getSupabase()
        .from("water_log")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) throw new Error(`Failed to delete water: ${error.message}`);
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

    // Resolve logged_at once so the digest and the persisted row agree.
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
    const startUtc = zonedDayStartUtc(date, tz);
    const endUtc = zonedNextDayStartUtc(date, tz);

    const { data, error } = await getSupabase()
        .from("weight_log")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", startUtc.toISOString())
        .lt("logged_at", endUtc.toISOString())
        .order("logged_at", { ascending: true });

    if (error) throw new Error(`Failed to get weight: ${error.message}`);
    return (data as WeightEntry[]) ?? [];
}

export async function getWeightInRange(
    userId: string,
    startDate: string,
    endDate: string,
    tz: string = "UTC",
): Promise<WeightEntry[]> {
    const startUtc = zonedDayStartUtc(startDate, tz);
    const endUtc = zonedNextDayStartUtc(endDate, tz);

    const { data, error } = await getSupabase()
        .from("weight_log")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", startUtc.toISOString())
        .lt("logged_at", endUtc.toISOString())
        .order("logged_at", { ascending: true });

    if (error) throw new Error(`Failed to get weight: ${error.message}`);
    return (data as WeightEntry[]) ?? [];
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

    const { data, error } = await getSupabase()
        .from("weight_log")
        .update(update)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) throw new Error(`Failed to update weight: ${error.message}`);
    return data as WeightEntry;
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

// ---------- Delete all user data ----------

export async function deleteAllUserData(userId: string): Promise<void> {
    const sb = getSupabase();

    const { error: analyticsErr } = await sb
        .from("tool_analytics")
        .delete()
        .eq("user_id", userId);
    if (analyticsErr)
        throw new Error(`Failed to delete analytics: ${analyticsErr.message}`);

    const { error: waterErr } = await sb
        .from("water_log")
        .delete()
        .eq("user_id", userId);
    if (waterErr)
        throw new Error(`Failed to delete water log: ${waterErr.message}`);

    const { error: weightErr } = await sb
        .from("weight_log")
        .delete()
        .eq("user_id", userId);
    if (weightErr)
        throw new Error(`Failed to delete weight log: ${weightErr.message}`);

    const { error: goalsErr } = await sb
        .from("nutrition_goals")
        .delete()
        .eq("user_id", userId);
    if (goalsErr)
        throw new Error(`Failed to delete goals: ${goalsErr.message}`);

    const { error: profileErr } = await sb
        .from("profiles")
        .delete()
        .eq("user_id", userId);
    if (profileErr)
        throw new Error(`Failed to delete profile: ${profileErr.message}`);

    // Remove any meal-export file from the "exports" storage bucket. Missing
    // paths are not an error, so this is a no-op for users who never exported.
    const { error: exportErr } = await sb.storage
        .from("exports")
        .remove([`${userId}/meals.csv`]);
    if (exportErr)
        throw new Error(`Failed to delete exports: ${exportErr.message}`);

    const { error: mealsErr } = await sb
        .from("meals")
        .delete()
        .eq("user_id", userId);
    if (mealsErr)
        throw new Error(`Failed to delete meals: ${mealsErr.message}`);

    const { error: tokensErr } = await sb
        .from("oauth_tokens")
        .delete()
        .eq("user_id", userId);
    if (tokensErr)
        throw new Error(`Failed to delete tokens: ${tokensErr.message}`);

    const { error: refreshErr } = await sb
        .from("refresh_tokens")
        .delete()
        .eq("user_id", userId);
    if (refreshErr)
        throw new Error(
            `Failed to delete refresh tokens: ${refreshErr.message}`,
        );

    const { error: authErr } = await sb
        .from("auth_codes")
        .delete()
        .eq("user_id", userId);
    if (authErr)
        throw new Error(`Failed to delete auth codes: ${authErr.message}`);

    const { error: userErr } = await sb.auth.admin.deleteUser(userId);
    if (userErr) throw new Error(`Failed to delete user: ${userErr.message}`);
}

// ---------- OAuth tokens ----------

export async function storeToken(token: string, userId: string): Promise<void> {
    const expiresAt = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error } = await getSupabase().from("oauth_tokens").upsert(
        {
            token,
            user_id: userId,
            expires_at: expiresAt,
        },
        { onConflict: "token" },
    );

    if (error) throw new Error(`Failed to store token: ${error.message}`);
}

// "invalid" means the token definitively isn't valid; "unavailable" means we
// could not find out. Callers must not treat the two alike: counting an
// unavailable lookup as a failed auth attempt would let a brief Supabase outage
// — during which *every* token looks invalid — trip the repeat-failure bans in
// rate-limit.ts and keep clients shed long after the database recovered.
export type TokenLookup =
    | { status: "valid"; userId: string }
    | { status: "invalid" }
    | { status: "unavailable" };

// PostgREST's code for "no rows returned" from .single() — a real answer (this
// token does not exist), not a transport or availability failure.
const PGRST_NO_ROWS = "PGRST116";

export async function getUserIdByToken(token: string): Promise<TokenLookup> {
    try {
        const { data, error } = await getSupabase()
            .from("oauth_tokens")
            .select("user_id")
            .eq("token", token)
            .gt("expires_at", new Date().toISOString())
            .single();

        if (error) {
            return error.code === PGRST_NO_ROWS
                ? { status: "invalid" }
                : { status: "unavailable" };
        }
        if (!data) return { status: "invalid" };
        return { status: "valid", userId: data.user_id as string };
    } catch {
        // Network-level failure never reaches the `error` field.
        return { status: "unavailable" };
    }
}

// ---------- Auth codes ----------

export async function storeAuthCode(
    code: string,
    redirectUri: string,
    userId: string,
    codeChallenge?: string,
): Promise<void> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await getSupabase()
        .from("auth_codes")
        .insert({
            code,
            redirect_uri: redirectUri,
            user_id: userId,
            code_challenge: codeChallenge ?? null,
            expires_at: expiresAt,
        });

    if (error) throw new Error(`Failed to store auth code: ${error.message}`);
}

export interface AuthCodeData {
    code: string;
    redirect_uri: string;
    user_id: string;
    code_challenge: string | null;
}

export async function consumeAuthCode(
    code: string,
): Promise<AuthCodeData | null> {
    const now = new Date().toISOString();

    const { data, error } = await getSupabase()
        .from("auth_codes")
        .delete()
        .eq("code", code)
        .gt("expires_at", now)
        .select()
        .single();

    if (error || !data) return null;
    return data as AuthCodeData;
}

// ---------- Refresh tokens ----------

export async function storeRefreshToken(
    token: string,
    userId: string,
): Promise<void> {
    const expiresAt = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error } = await getSupabase().from("refresh_tokens").insert({
        token,
        user_id: userId,
        expires_at: expiresAt,
    });

    if (error)
        throw new Error(`Failed to store refresh token: ${error.message}`);
}

export async function consumeRefreshToken(
    token: string,
): Promise<string | null> {
    const { data, error } = await getSupabase()
        .from("refresh_tokens")
        .delete()
        .eq("token", token)
        .gt("expires_at", new Date().toISOString())
        .select("user_id")
        .single();

    if (error || !data) return null;
    return data.user_id as string;
}

// ---------- Public landing stats ----------

export interface LandingStats {
    food_logs: number;
    total_calories: number;
    total_protein_g: number;
    total_carbs_g: number;
    total_fat_g: number;
    timezones: number;
    // IANA names of every distinct timezone in use — drives the landing-page
    // world map. Aggregate-only; no per-user data.
    timezone_list: string[];
}

// Aggregate-only totals for the public landing page. Backed by the
// `public_landing_stats` SQL function so the whole thing is one round trip and
// the database does the summing. Never returns per-user rows.
export async function getLandingStats(): Promise<LandingStats> {
    const { data, error } = await getSupabase().rpc("public_landing_stats");
    if (error) throw new Error(`Failed to get landing stats: ${error.message}`);
    return data as LandingStats;
}

// ---------- Registered clients ----------

export function registerClient(
    clientName: string | null,
    redirectUris: string[],
): void {
    getSupabase()
        .from("registered_clients")
        .insert({
            client_name: clientName,
            redirect_uris: redirectUris,
        })
        .then(({ error }) => {
            if (error) {
                console.warn(
                    "Failed to persist client registration:",
                    error.message,
                );
            }
        });
}
