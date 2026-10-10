import {
    createClient,
    type SupabaseClient,
    type User,
} from "@supabase/supabase-js";
import { zonedDayStartUtc, zonedNextDayStartUtc } from "./tz.js";
import { decodeEscapeSequences } from "./normalize.js";
import {
    isWeightUnit,
    isLengthUnit,
    toStoredInteger,
    type WeightUnit,
    type LengthUnit,
    type BodyMeasurementKind,
} from "./units.js";
import { isDrinkUnit, type DrinkUnit } from "./alcohol.js";
import {
    escapeLikePattern,
    tokenizeQuery,
    type SavedMealSummary,
} from "./search.js";
import {
    MAX_SAVED_MEALS_PER_USER,
    type MealItemValues,
    type MealNutrientKey,
    type NutrientValues,
} from "./meal-items.js";
import {
    parseNutrientSources,
    parseSourceDetail,
    referenceFromFood,
    referenceFromUsda,
    type NutrientSources,
    type RecordSource,
    type ReferenceRecord,
    type SourceDetail,
} from "./provenance.js";
import {
    USDA_CACHE_SOURCE,
    usdaRecordFromPayload,
    usdaSourceId,
    type UsdaRecord,
} from "./usda-record.js";
import { fromCachedPayload, type FoodResult } from "./foods.js";
import type { PatreonTokens, PatreonTokenStore } from "./patreon.js";
import { hashSecret } from "./token-hash.js";
import { ToolError, newErrorRef } from "./errors.js";
import {
    GOAL_COLUMNS,
    pickGoals,
    sameGoals,
    withCurrentGoals,
    type NutritionGoalsHistoryRow,
} from "./goals-history.js";
import {
    SignInError,
    SignUpError,
    signInErrorCode,
    signUpErrorCode,
} from "./auth-errors.js";

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

// Supabase Auth only verifies the credential: access runs on this server's own
// OAuth tokens. GoTrue has no verify-only call, so every successful sign-in
// still creates an auth.sessions row and a refresh token that nothing uses,
// and by default they never expire. End it at once — scope "local" makes
// GoTrue delete just this session, its refresh tokens cascading with it (the
// privacy policy says so). Not awaited, never throws: sign-in must not wait
// on or fail because of it, and a missed one is caught by the project's
// session time-box. Logs the status only, never the user.
function discardAuthSession(
    client: SupabaseClient,
    session: { access_token: string } | null,
): void {
    if (!session) return; // signUp with email confirmation on returns none
    client.auth.admin
        .signOut(session.access_token, "local")
        .then(({ error }) => {
            if (error && error.status !== 404)
                console.warn(
                    `[auth] session-revoke-failed status=${error.status ?? "unknown"}`,
                );
        })
        .catch(() =>
            console.warn("[auth] session-revoke-failed status=network"),
        );
}

export async function signUpUser(
    email: string,
    password: string,
): Promise<string> {
    // Use a throw-away client so the session never lands on the shared singleton.
    const client = buildClient();
    const { data, error } = await client.auth.signUp({
        email,
        password,
    });

    // Only the code leaves this function: some GoTrue messages quote the
    // address, and none of them is shown to the user (src/auth-errors.ts).
    if (error) throw new SignUpError(signUpErrorCode(error.code));
    if (!data.user) throw new SignUpError("other");
    // No session means Supabase is holding the account for email
    // confirmation (Confirm email on). This server has no confirmation flow
    // yet, so it must not hand out an authorization code for an address
    // nobody has proved they own: refuse, and log it so the setting gets
    // noticed.
    if (!data.session) {
        console.warn("[auth] sign-up-unconfirmed");
        throw new SignUpError("other");
    }
    discardAuthSession(client, data.session);
    return data.user.id;
}

export async function signInUser(
    email: string,
    password: string,
): Promise<string> {
    const client = buildClient();
    const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw new SignInError(signInErrorCode(error.code));
    discardAuthSession(client, data.session);
    return data.user.id;
}

export async function signInWithGoogleIdToken(
    idToken: string,
    nonce: string,
): Promise<string> {
    // Use a throw-away client so the session never lands on the shared singleton.
    const client = buildClient();
    const { data, error } = await client.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
        nonce,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Google sign-in failed");
    discardAuthSession(client, data.session);
    return data.user.id;
}

// ---------- Idempotency ----------

// Derive a stable idempotency key from the request content so the column is
// always populated and retries dedupe even when the client omits a key. The
// resolved logged_at is part of the digest, so two genuinely separate but
// otherwise-identical entries (logged at different times) get distinct keys and
// are never wrongly merged. A retry replays the same args — including the same
// logged_at — and therefore lands on the same key, when the caller sent
// logged_at. An omitted logged_at resolves to the arrival instant below, so a
// replay of such a call derives a new key; only a caller-supplied
// idempotency_key makes it replay-safe (see idempotencyKeyDescription in
// src/mcp.ts). The "auto:" prefix marks
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
    // Saturated and trans fat, grams, both inside fat_g. NULL means not
    // recorded (rows logged before the columns existed, or a call that did not
    // give the value), never 0. Trans fat has no goal; saturated fat has a
    // daily ceiling (see NutritionGoals).
    saturated_fat_g?: number | null;
    trans_fat_g?: number | null;
    // Total sugars (not added sugar); alcohol is pure ethanol in grams.
    fiber_g: number | null;
    sugar_g: number | null;
    // Added sugars (US label definition), part of sugar_g and never more than
    // it. NULL means not recorded — rows logged before the column existed
    // stay NULL and read as "not recorded", never as 0.
    added_sugar_g: number | null;
    alcohol_g: number | null;
    // MILLIGRAMS, unlike every other nutrient here — labels and guidelines are
    // all stated in mg, so the unit rides in the name at every layer.
    // Contributes no energy: never feed this into a kcal derivation.
    caffeine_mg: number | null;
    notes: string | null;
    idempotency_key: string | null;
    // The saved meal this row was logged from (log_saved_meal), or null. Set
    // null again when that saved meal is deleted: the logged row keeps its
    // values, only the link goes.
    saved_meal_id: string | null;
    // Where each nutrient came from (src/provenance.ts) and the records those
    // labels point at. NULL on rows written before provenance existed; never
    // back-labelled.
    nutrient_sources?: NutrientSources | null;
    source_detail?: SourceDetail | null;
}

export interface MealInput {
    description: string;
    meal_type: "breakfast" | "lunch" | "dinner" | "snack";
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    // See Meal.saturated_fat_g.
    saturated_fat_g?: number;
    trans_fat_g?: number;
    fiber_g?: number;
    sugar_g?: number;
    // See Meal.added_sugar_g.
    added_sugar_g?: number;
    alcohol_g?: number;
    // Milligrams — see Meal.caffeine_mg.
    caffeine_mg?: number;
    logged_at?: string;
    notes?: string;
    idempotency_key?: string;
    // Ingredients (src/meal-items.ts), already validated and summed: when
    // given, the nutrient fields above ARE their sum. Written as meal_items
    // rows in the same transaction as the meal.
    items?: MealItemValues[];
    // The saved meal this entry is copied from (log_saved_meal).
    saved_meal_id?: string;
    // Provenance of the nutrient fields above (see Meal.nutrient_sources).
    // Already verified and labelled by the caller; written as given. Not part
    // of the idempotency digest.
    nutrient_sources?: NutrientSources | null;
    source_detail?: SourceDetail | null;
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
    // saturated_fat_g, trans_fat_g, fiber_g, sugar_g, alcohol_g and caffeine_mg
    // are EXCLUDED on purpose, and any future meal column must be too. The digest is positional over exactly
    // these values, so appending one changes the derived key of every future
    // write — a user re-logging or re-importing something they already have
    // would get a duplicate row instead of a clean no-op, and every "auto:" key
    // already stored would be orphaned. This repo has shipped that bug once
    // already (see CLAUDE.md, "Bulk meal import"); the mirror of this array is
    // rowContentDigest in src/import.ts, which carries the same warning.
    //
    // Accepted consequence: two meals identical except for their fat split (or
    // fiber, sugar, alcohol, or caffeine) dedupe to one. Dedup stability beats
    // precision here, and a caller who needs distinct rows can pass an explicit
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

/**
 * The idempotency key updateMeal should persist for `fields` applied on top
 * of `existing`, or null when the row's current key must be left alone.
 *
 * mealIdempotencyKey derives a content digest so retries dedupe without a
 * client-supplied key — but updateMeal never recomputed it, so editing a
 * meal's content left the digest describing the pre-edit content (#84): a
 * replay of the ORIGINAL log_meal call then deduped onto the corrected row
 * ("Meal already logged"), while re-logging the CORRECTED content created a
 * duplicate. Recomputing over the merged (existing + changed) fields keeps
 * the key describing what the row now says.
 *
 * Only when the current key is "auto:"-prefixed: a caller-supplied key
 * encodes the caller's own request-level idempotency choice, which
 * updateMeal must not override.
 */
export function updatedMealIdempotencyKey(
    userId: string,
    existing: Meal,
    fields: Partial<MealInput>,
): string | null {
    if (!existing.idempotency_key?.startsWith("auto:")) return null;

    const merged: MealInput = {
        description: fields.description ?? existing.description,
        meal_type:
            (fields.meal_type as MealInput["meal_type"] | undefined) ??
            (existing.meal_type as MealInput["meal_type"]),
        calories:
            fields.calories !== undefined
                ? toStoredInteger(fields.calories)
                : (existing.calories ?? undefined),
        protein_g: fields.protein_g ?? existing.protein_g ?? undefined,
        carbs_g: fields.carbs_g ?? existing.carbs_g ?? undefined,
        fat_g: fields.fat_g ?? existing.fat_g ?? undefined,
        notes: fields.notes ?? existing.notes ?? undefined,
    };
    // existing.logged_at came back through PostgREST, which renders
    // timestamptz as "+00:00" (and drops an all-zero fractional part) —
    // never as the "Z"-suffixed, millisecond-padded form every write path
    // hashes (new Date().toISOString(), here and in insertMeal/importMeals).
    // Re-serializing through Date canonicalizes it back to that shared
    // format. Skipping this made every edit that leaves logged_at untouched
    // — the common case — persist a key a fresh, identical log_meal call
    // could never reproduce, silently reopening the "duplicate on re-log"
    // half of #84.
    const loggedAt =
        fields.logged_at ?? new Date(existing.logged_at).toISOString();

    return mealIdempotencyKey(userId, merged, loggedAt);
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

    // Resolve logged_at once so the digest and the persisted row agree — and,
    // when omitted, this is the arrival time, so the derived key does not
    // survive a retry.
    const loggedAt = meal.logged_at ?? new Date().toISOString();
    // Always populate the key: use the client's if given, otherwise derive a
    // stable one from the request content (see mealIdempotencyKey).
    const idempotencyKey =
        meal.idempotency_key ?? mealIdempotencyKey(userId, meal, loggedAt);

    // A meal with ingredients, or one copied from a saved meal, goes through
    // one transactional function that also writes its item rows. The
    // idempotency lookup happens inside it, so this branch makes no select of
    // its own. Items are not part of the digest above: a replay with the same
    // meal fields dedupes whatever its items say.
    if ((meal.items?.length ?? 0) > 0 || meal.saved_meal_id) {
        return insertMealWithItems(userId, meal, loggedAt, idempotencyKey);
    }

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
            saturated_fat_g: meal.saturated_fat_g ?? null,
            trans_fat_g: meal.trans_fat_g ?? null,
            fiber_g: meal.fiber_g ?? null,
            sugar_g: meal.sugar_g ?? null,
            added_sugar_g: meal.added_sugar_g ?? null,
            alcohol_g: meal.alcohol_g ?? null,
            caffeine_mg: meal.caffeine_mg ?? null,
            nutrient_sources: meal.nutrient_sources ?? null,
            source_detail: meal.source_detail ?? null,
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
    return getMealsInRange(userId, date, date, tz);
}

export async function getMealsInRange(
    userId: string,
    startDate: string,
    endDate: string,
    tz: string = "UTC",
): Promise<Meal[]> {
    const startUtc = zonedDayStartUtc(startDate, tz);
    const endUtc = zonedNextDayStartUtc(endDate, tz);

    return selectLoggedWindow<Meal>("meals", "meals", userId, startUtc, endUtc);
}

/**
 * Whether this user logged any meal before local `date` in `tz`. `get_trends`
 * with `group_by` reads only its 5-year span, so this is how it tells a
 * history that starts inside that span (empty periods before the first meal
 * are dropped) from one that runs past its start (they are inner gaps, kept).
 * One indexed row at most (`idx_meals_user_logged_at`).
 */
export async function hasMealsBefore(
    userId: string,
    date: string,
    tz: string = "UTC",
): Promise<boolean> {
    const { data, error } = await getSupabase()
        .from("meals")
        .select("id")
        .eq("user_id", userId)
        // ISO, never the Date itself: supabase-js stringifies a filter value
        // with String(), and Postgres rejects "Sat Jan 01 2022 00:00:00 GMT…".
        .lt("logged_at", zonedDayStartUtc(date, tz).toISOString())
        .limit(1);

    if (error) throw new Error(`Failed to get meals: ${error.message}`);
    return (data ?? []).length > 0;
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

/** Postgres casts every element of an `in (...)` list against the column type,
 *  so one non-uuid id would fail the entire lookup — and with it the whole
 *  import — rather than simply not matching. Filter before querying. */
const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A canonical 8-4-4-4-12 hex UUID, any case. The gate before any uuid-typed
 *  `eq`/`in` filter: Postgres rejects a non-uuid with a cast error instead of
 *  simply not matching. */
export function isUuid(v: string): boolean {
    return UUID_RE.test(v);
}

/**
 * Which of `ids` are meals this user already has. An export of this server's
 * own data carries each meal's id, so a re-import can recognize the meals it
 * describes instead of writing a second copy of every one of them.
 *
 * Scoped by user_id, so another user's id is reported as absent and the row
 * imports as a new meal — never as a match against a row they cannot see.
 */
export async function existingMealIds(
    userId: string,
    ids: string[],
): Promise<Set<string>> {
    const uuids = ids.filter(isUuid);
    if (uuids.length === 0) return new Set();

    const { data, error } = await getSupabase()
        .from("meals")
        .select("id")
        .eq("user_id", userId)
        .in("id", uuids);

    if (error) {
        throw new Error(`Failed to check existing meals: ${error.message}`);
    }
    return new Set(
        ((data as { id: string }[]) ?? []).map((r) => r.id.toLowerCase()),
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

type LoggedTable =
    "meals" | "water_log" | "weight_log" | "body_measurement_log";

/**
 * Every row with start <= logged_at < end, oldest first — the one path behind
 * the day and range readers. Paged because an unbounded select caps at
 * PostgREST's db-max-rows and kept the OLDEST 1000 rows (a 365-day get_trends
 * showed the latest 30 days as zeros; the export readers got the same fix in
 * #66). The `id` tie-break is required, not cosmetic: date-only imports all
 * anchor at local noon, so many rows share one `logged_at`, and without a total
 * order ties straddling a page edge could be skipped or returned twice.
 * Offset paging can still return a row twice when a backdated insert lands
 * between pages and shifts later rows forward — k inserts replay the last k
 * rows of the previous page, so the twins are not adjacent once k >= 2 (a bulk
 * import does exactly that). They are dropped here by id, keeping the first
 * copy, before any caller sums a meal twice. The first page's exact count then catches a server whose
 * max-rows is below the page size, whose short first page would otherwise end
 * the loop looking complete. The optional `filter` (body measurements by
 * kind) is applied in the database, so the exact count — and with it the
 * truncation check — covers only the filtered rows.
 */
async function selectLoggedWindow<T extends { id: string }>(
    table: LoggedTable,
    noun: string,
    userId: string,
    startUtc: Date,
    endUtc: Date,
    filter?: { kind: BodyMeasurementKind },
): Promise<T[]> {
    let expected: number | null = null;
    const fetched = await fetchAllPages<T>(async (from, to) => {
        let q = getSupabase()
            .from(table)
            .select("*", from === 0 ? { count: "exact" } : undefined)
            .eq("user_id", userId);
        if (filter) q = q.eq("kind", filter.kind);
        const { data, error, count } = await q
            .gte("logged_at", startUtc.toISOString())
            .lt("logged_at", endUtc.toISOString())
            .order("logged_at", { ascending: true })
            .order("id", { ascending: true })
            .range(from, to);

        if (error) throw new Error(`Failed to get ${noun}: ${error.message}`);
        if (from === 0) expected = count ?? null;
        return (data as T[]) ?? [];
    });
    const seen = new Set<string>();
    const rows = fetched.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
    });
    assertWindowComplete(noun, rows.length, expected);
    return rows;
}

/** Throws when a paged window read came back with fewer distinct rows than the
 *  first page's exact count. More than expected is fine: a concurrent insert. */
export function assertWindowComplete(
    noun: string,
    fetched: number,
    expected: number | null,
): void {
    if (expected !== null && fetched < expected) {
        throw new Error(
            `Failed to get ${noun}: fetched ${fetched} of ${expected} rows — result would be truncated`,
        );
    }
}

/**
 * All of a user's meals, oldest first — used by export_all_data. Pages through
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
    return meals.map(withProvenance);
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

    // Ingredient names: a meal logged with items matches when one of its
    // items holds every token. The meals are read through an inner embed of
    // their items, so the user scope, the window, the newest-first order and
    // the limit apply to the meals themselves. Every name filter lands on the
    // same embedded rows, so one item has to hold all the tokens, and a meal
    // with no such item drops out (`!inner`). The items are user-scoped too,
    // as every item read is.
    const buildItemQuery = (tokens: string[]) => {
        let q = getSupabase()
            .from("meals")
            .select("*, meal_items!inner(name)")
            .eq("user_id", userId)
            .eq("meal_items.user_id", userId);
        if (opts.sinceIso) q = q.gte("logged_at", opts.sinceIso);
        for (const token of tokens) {
            q = q.ilike("meal_items.name", `%${escapeLikePattern(token)}%`);
        }
        return q.order("logged_at", { ascending: false }).limit(limit);
    };

    const results = await Promise.all(
        tokenized.flatMap((tokens) => [
            buildQuery(tokens, "description"),
            buildQuery(tokens, "notes"),
            buildItemQuery(tokens),
        ]),
    );

    const seen = new Set<string>();
    const merged: Meal[] = [];
    for (const { data, error } of results) {
        if (error) {
            throw new Error(`Failed to search meals: ${error.message}`);
        }
        for (const row of (data as (Meal & { meal_items?: unknown })[]) ?? []) {
            // The ingredient query's embedded items are only a filter.
            const { meal_items: _items, ...meal } = row;
            if (!seen.has(meal.id)) {
                seen.add(meal.id);
                merged.push(meal);
            }
        }
    }
    merged.sort((a, b) => b.logged_at.localeCompare(a.logged_at));
    return merged.slice(0, limit);
}

/** True when a row matched and was deleted; false when the id is unknown or
 *  belongs to another user — the handler must not claim success either way. */
export async function deleteMeal(userId: string, id: string): Promise<boolean> {
    const { data, error } = await getSupabase()
        .from("meals")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id");

    if (error) throw new Error(`Failed to delete meal: ${error.message}`);
    return (data?.length ?? 0) > 0;
}

/** The stored values a write was computed from: every nutrient column of a
 *  meal or saved meal, and its two label columns. A write conditional on this
 *  snapshot (guardedBy) only lands while the row still holds exactly what its
 *  checks and label merge read, so a concurrent edit makes the caller re-read
 *  and redo them instead of overwriting the other edit's labels or sugar.
 *  `null` means IS NULL; an object label compares as jsonb. */
export type MealSnapshotGuard = Partial<
    Record<(typeof NUTRIENT_KEYS)[number], number | null>
> & {
    nutrient_sources?: unknown;
    source_detail?: unknown;
};

/** A guarded write found its row, but the row no longer holds the snapshot. */
export class SnapshotConflictError extends Error {
    override name = "SnapshotConflictError";
    constructor(readonly rowId: string) {
        super(`row ${rowId} changed since it was read`);
    }
}

/** The one filter shape guardedBy needs, so it works on any PostgREST builder
 *  of a table without the table's column typing getting in the way. */
interface GuardFilter {
    is(column: string, value: null): GuardFilter;
    eq(column: string, value: unknown): GuardFilter;
}

/** Adds one equality filter per guard entry to a PostgREST update. */
function guardedBy<Q>(query: Q, guard: MealSnapshotGuard): Q {
    let filter = query as unknown as GuardFilter;
    for (const [column, value] of Object.entries(guard)) {
        if (value === undefined) continue;
        if (value === null) filter = filter.is(column, null);
        // A label is compared by its jsonb value, which PostgREST casts from
        // the text; a number compares by its numeric value.
        else if (typeof value === "object")
            filter = filter.eq(column, JSON.stringify(value));
        else filter = filter.eq(column, value);
    }
    return filter as unknown as Q;
}

/** The snapshot of one row as a guard: all eleven nutrient columns and both
 *  label columns, with a missing column read as null. */
export function snapshotGuardOf(
    row: {
        nutrient_sources?: unknown;
        source_detail?: unknown;
    } & Partial<Record<(typeof NUTRIENT_KEYS)[number], number | null>>,
): MealSnapshotGuard {
    const guard: MealSnapshotGuard = {
        nutrient_sources: row.nutrient_sources ?? null,
        source_detail: row.source_detail ?? null,
    };
    for (const key of NUTRIENT_KEYS) guard[key] = row[key] ?? null;
    return guard;
}

/** Updates a logged meal. With `guard`, the write lands only while the row
 *  still holds that snapshot (see MealSnapshotGuard); otherwise it throws
 *  SnapshotConflictError and writes nothing. */
export async function updateMeal(
    userId: string,
    id: string,
    fields: Partial<MealInput>,
    guard?: MealSnapshotGuard,
): Promise<Meal> {
    const sb = getSupabase();

    const { data: existing, error: selErr } = await sb
        .from("meals")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
    if (selErr) throw new Error(`Failed to update meal: ${selErr.message}`);
    if (!existing) throw new ToolError(`No meal found with id ${id}.`);

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
    if (fields.saturated_fat_g !== undefined)
        update.saturated_fat_g = fields.saturated_fat_g;
    if (fields.trans_fat_g !== undefined)
        update.trans_fat_g = fields.trans_fat_g;
    if (fields.fiber_g !== undefined) update.fiber_g = fields.fiber_g;
    if (fields.sugar_g !== undefined) update.sugar_g = fields.sugar_g;
    if (fields.added_sugar_g !== undefined)
        update.added_sugar_g = fields.added_sugar_g;
    if (fields.alcohol_g !== undefined) update.alcohol_g = fields.alcohol_g;
    if (fields.caffeine_mg !== undefined)
        update.caffeine_mg = fields.caffeine_mg;
    if (fields.nutrient_sources !== undefined)
        update.nutrient_sources = fields.nutrient_sources;
    if (fields.source_detail !== undefined)
        update.source_detail = fields.source_detail;
    if (fields.logged_at !== undefined) update.logged_at = fields.logged_at;
    if (fields.notes !== undefined)
        update.notes =
            fields.notes != null
                ? decodeEscapeSequences(fields.notes)
                : fields.notes;

    const newKey = updatedMealIdempotencyKey(userId, existing as Meal, fields);
    if (newKey !== null) update.idempotency_key = newKey;

    let query = sb
        .from("meals")
        .update(update)
        .eq("id", id)
        .eq("user_id", userId);
    if (guard) query = guardedBy(query, guard);
    // No `.single()`: a guard that no longer matches leaves zero rows, which
    // must read as a conflict rather than a PostgREST coercion error.
    const { data, error } = await query.select();

    if (error) throw new Error(`Failed to update meal: ${error.message}`);
    const row = (data as Meal[] | null)?.[0];
    if (row) return row;

    // Nothing written. The row existed at the pre-check above, so either it
    // was deleted since or the guarded snapshot moved; tell them apart.
    const { data: now, error: nowErr } = await sb
        .from("meals")
        .select("id")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
    if (nowErr) throw new Error(`Failed to update meal: ${nowErr.message}`);
    if (!now) throw new ToolError(`No meal found with id ${id}.`);
    if (!guard)
        throw new Error("Failed to update meal: no row matched the write");
    throw new SnapshotConflictError(id);
}

// ---------- Food records (provenance) ----------

/**
 * A cached food record for provenance (src/provenance.ts), with no TTL. The
 * lookup cache (src/foods.ts) refetches a stale row; a provenance check never
 * fetches upstream, and a record past its TTL still verifies a logged value,
 * because the facts it holds do not expire with the cache. The row is
 * normalized the way the lookup normalizes it (fromCachedPayload for Open Food
 * Facts, usdaRecordFromPayload for USDA), so both read the same figures.
 *
 * Best-effort, like the lookup cache: any failure, or a row that does not
 * normalize or belongs to another id, is a miss. A miss labels the value
 * "estimate" and never fails the write.
 */
export async function getCachedFoodRecord(
    source: RecordSource,
    id: string,
): Promise<ReferenceRecord | null> {
    try {
        const { data, error } = await getSupabase()
            .from("food_cache")
            .select("payload, fetched_at")
            .eq("source", source)
            .eq("source_id", id)
            .maybeSingle();
        if (error || !data) return null;
        const fetchedAt =
            typeof data.fetched_at === "string" ? data.fetched_at : null;
        if (source === "openfoodfacts") {
            const cached = fromCachedPayload(data.payload as FoodResult);
            return cached
                ? referenceFromFood(cached.food, id, fetchedAt)
                : null;
        }
        const record = usdaRecordFromPayload(data.payload);
        if (!record || String(record.fdc_id) !== id) return null;
        return referenceFromUsda(record, fetchedAt);
    } catch {
        return null;
    }
}

/**
 * The USDA cache row for one FoodData Central id, with its fetch time in epoch
 * ms, for the lookup in src/usda.ts (which applies the 30-day TTL itself). Best
 * effort: any failure, or a row that is not a valid record for this id, is a
 * miss, so the caller fetches upstream or reports the record unavailable.
 */
export async function readUsdaFoodCache(
    fdcId: number,
): Promise<{ record: UsdaRecord; fetchedAt: number } | null> {
    try {
        const { data, error } = await getSupabase()
            .from("food_cache")
            .select("payload, fetched_at")
            .eq("source", USDA_CACHE_SOURCE)
            .eq("source_id", usdaSourceId(fdcId))
            .maybeSingle();
        if (error || !data) return null;
        const record = usdaRecordFromPayload(data.payload);
        if (!record || record.fdc_id !== fdcId) return null;
        const fetchedAt = Date.parse(String(data.fetched_at));
        if (!Number.isFinite(fetchedAt)) return null;
        return { record, fetchedAt };
    } catch {
        return null;
    }
}

/**
 * Writes one normalized USDA record to food_cache (src/usda-record.ts), keyed
 * by its FoodData Central id. Best effort, like putCachedFood: a failed write
 * only means the next call fetches again, so it never fails the tool.
 */
export async function writeUsdaFoodCache(
    record: UsdaRecord,
    fetchedAt: number,
): Promise<void> {
    try {
        await getSupabase()
            .from("food_cache")
            .upsert(
                {
                    source: USDA_CACHE_SOURCE,
                    source_id: usdaSourceId(record.fdc_id),
                    payload: record,
                    fetched_at: new Date(fetchedAt).toISOString(),
                },
                { onConflict: "source,source_id" },
            );
    } catch {
        // best-effort; ignore
    }
}

// ---------- Meal items and saved meals ----------

/** Nutrient columns, in MEAL_NUTRIENT_KEYS order. Listed here (type-only
 *  import from src/meal-items.ts) so this module keeps no runtime edge to the
 *  pure module, which imports the import/added-sugar layers. */
const NUTRIENT_KEYS: readonly MealNutrientKey[] = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "saturated_fat_g",
    "trans_fat_g",
    "fiber_g",
    "sugar_g",
    "added_sugar_g",
    "alcohol_g",
    "caffeine_mg",
];

/** PostgREST hands numeric columns back as numbers today; coerce anyway so a
 *  string never reaches a total or a line of text. */
function numOrNull(v: unknown): number | null {
    return v == null ? null : Number(v);
}

function nutrientsFromRow(row: Record<string, unknown>): NutrientValues {
    const out = {} as NutrientValues;
    for (const key of NUTRIENT_KEYS) out[key] = numOrNull(row[key]);
    return out;
}

/** The provenance columns of a row, shape-checked (src/provenance.ts). A column
 *  that is null, or a value that does not parse, reads as null: never a label.
 *  A key is only present when the row carries its column, so a row selected
 *  without them keeps its old shape. */
function provenanceFromRow(row: Record<string, unknown>): {
    nutrient_sources?: NutrientSources | null;
    source_detail?: SourceDetail | null;
} {
    const out: {
        nutrient_sources?: NutrientSources | null;
        source_detail?: SourceDetail | null;
    } = {};
    if ("nutrient_sources" in row)
        out.nutrient_sources = parseNutrientSources(row.nutrient_sources);
    if ("source_detail" in row)
        out.source_detail = parseSourceDetail(row.source_detail);
    return out;
}

/** A row read by a whole-table export reader, with its provenance parsed. */
function withProvenance<T extends object>(row: T): T {
    return { ...row, ...provenanceFromRow(row as Record<string, unknown>) };
}

/** One item row, as src/meal-items.ts values. */
function itemFromRow(row: Record<string, unknown>): MealItemValues {
    return {
        ...nutrientsFromRow(row),
        position: Number(row.position),
        name: String(row.name),
        amount: numOrNull(row.amount),
        unit: row.unit == null ? null : String(row.unit),
        calories: Number(row.calories),
        protein_g: Number(row.protein_g),
        carbs_g: Number(row.carbs_g),
        fat_g: Number(row.fat_g),
        ...provenanceFromRow(row),
    };
}

/** The jsonb object jsonb_to_recordset reads for one item. Every key is sent,
 *  null where absent, so the SQL side never sees a missing column. */
function itemPayload(item: MealItemValues): Record<string, unknown> {
    return {
        position: item.position,
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        calories: item.calories,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
        saturated_fat_g: item.saturated_fat_g ?? null,
        trans_fat_g: item.trans_fat_g ?? null,
        fiber_g: item.fiber_g ?? null,
        sugar_g: item.sugar_g ?? null,
        added_sugar_g: item.added_sugar_g ?? null,
        alcohol_g: item.alcohol_g ?? null,
        caffeine_mg: item.caffeine_mg ?? null,
        nutrient_sources: item.nutrient_sources ?? null,
        source_detail: item.source_detail ?? null,
    };
}

/** Items per `in (...)` request. Each request also pages (fetchAllPages), since
 *  100 parents with 30 items each is well past PostgREST's 1000-row cap. */
const ITEM_PARENT_CHUNK = 100;

/** Item rows of many parents, grouped by parent id and ordered by position.
 *  Scoped to the user; non-uuid parent ids are dropped before any query (a
 *  cast error would fail the whole lookup, see isUuid). */
async function selectItemsByParent(
    table: "meal_items" | "saved_meal_items",
    parentColumn: "meal_id" | "saved_meal_id",
    userId: string,
    parentIds: string[],
): Promise<Map<string, MealItemValues[]>> {
    const byParent = new Map<string, MealItemValues[]>();
    const ids = [...new Set(parentIds)].filter(isUuid);
    for (let i = 0; i < ids.length; i += ITEM_PARENT_CHUNK) {
        const chunk = ids.slice(i, i + ITEM_PARENT_CHUNK);
        const rows = await fetchAllPages<Record<string, unknown>>(
            async (from, to) => {
                const { data, error } = await getSupabase()
                    .from(table)
                    .select("*")
                    .eq("user_id", userId)
                    .in(parentColumn, chunk)
                    .order(parentColumn, { ascending: true })
                    .order("position", { ascending: true })
                    .order("id", { ascending: true })
                    .range(from, to);
                if (error)
                    throw new Error(`Failed to get ${table}: ${error.message}`);
                return (data as Record<string, unknown>[]) ?? [];
            },
        );
        for (const row of rows) {
            const parent = String(row[parentColumn]);
            const list = byParent.get(parent) ?? [];
            list.push(itemFromRow(row));
            byParent.set(parent, list);
        }
    }
    return byParent;
}

/** Ingredients of logged meals, grouped by meal id, in position order. Meals
 *  with no items have no entry. */
export function getMealItems(
    userId: string,
    mealIds: string[],
): Promise<Map<string, MealItemValues[]>> {
    return selectItemsByParent("meal_items", "meal_id", userId, mealIds);
}

/** How many ingredients one logged meal has. Used before an update: a meal
 *  whose totals are the sum of its items can only change through its items. */
export async function countMealItems(
    userId: string,
    mealId: string,
): Promise<number> {
    const { count, error } = await getSupabase()
        .from("meal_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("meal_id", mealId);
    if (error) throw new Error(`Failed to count meal items: ${error.message}`);
    return count ?? 0;
}

/** The fields update_meal may change. Totals may be null: a summed total is
 *  null when no item carries that nutrient. */
export type MealFieldUpdate = Partial<Omit<MealInput, MealNutrientKey>> &
    Partial<Record<MealNutrientKey, number | null>>;

/** Replaces a logged meal's ingredients and the meal fields in one write.
 *  `fields` holds the summed totals when the meal has items, plus any other
 *  field the caller changed; `items` is the full new list. The meal's
 *  idempotency key is recomputed exactly as updateMeal does. */
export async function replaceMealItems(
    userId: string,
    id: string,
    fields: MealFieldUpdate,
    items: MealItemValues[],
): Promise<Meal> {
    const sb = getSupabase();

    const { data: existing, error: selErr } = await sb
        .from("meals")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
    if (selErr) throw new Error(`Failed to update meal: ${selErr.message}`);
    if (!existing) throw new ToolError(`No meal found with id ${id}.`);

    const update: Record<string, unknown> = {};
    if (fields.description !== undefined)
        update.description = decodeEscapeSequences(fields.description);
    if (fields.meal_type !== undefined) update.meal_type = fields.meal_type;
    if (fields.calories !== undefined)
        update.calories =
            fields.calories == null ? null : toStoredInteger(fields.calories);
    for (const key of NUTRIENT_KEYS) {
        if (key === "calories" || fields[key] === undefined) continue;
        update[key] = fields[key];
    }
    if (fields.nutrient_sources !== undefined)
        update.nutrient_sources = fields.nutrient_sources;
    if (fields.source_detail !== undefined)
        update.source_detail = fields.source_detail;
    if (fields.logged_at !== undefined) update.logged_at = fields.logged_at;
    if (fields.notes !== undefined)
        update.notes =
            fields.notes != null ? decodeEscapeSequences(fields.notes) : null;

    const newKey = updatedMealIdempotencyKey(
        userId,
        existing as Meal,
        fields as Partial<MealInput>,
    );
    if (newKey !== null) update.idempotency_key = newKey;

    const { data, error } = await sb.rpc("update_meal_with_items", {
        p_user_id: userId,
        p_meal_id: id,
        p_fields: update,
        p_items: items.map(itemPayload),
    });
    if (error) throw new Error(`Failed to update meal: ${error.message}`);
    // jsonb null: the meal vanished between the read above and this write.
    if (data == null) throw new ToolError(`No meal found with id ${id}.`);
    return data as Meal;
}

/** Logs a meal with ingredients and/or from a saved meal: one rpc writes the
 *  meal and its item rows, and does the idempotency lookup itself. */
async function insertMealWithItems(
    userId: string,
    meal: MealInput,
    loggedAt: string,
    idempotencyKey: string,
): Promise<MealInsertResult> {
    const { data, error } = await getSupabase().rpc("insert_meal_with_items", {
        p_user_id: userId,
        p_meal: {
            description: decodeEscapeSequences(meal.description),
            meal_type: meal.meal_type,
            calories: meal.calories ?? null,
            protein_g: meal.protein_g ?? null,
            carbs_g: meal.carbs_g ?? null,
            fat_g: meal.fat_g ?? null,
            saturated_fat_g: meal.saturated_fat_g ?? null,
            trans_fat_g: meal.trans_fat_g ?? null,
            fiber_g: meal.fiber_g ?? null,
            sugar_g: meal.sugar_g ?? null,
            added_sugar_g: meal.added_sugar_g ?? null,
            alcohol_g: meal.alcohol_g ?? null,
            caffeine_mg: meal.caffeine_mg ?? null,
            nutrient_sources: meal.nutrient_sources ?? null,
            source_detail: meal.source_detail ?? null,
            logged_at: loggedAt,
            notes:
                meal.notes != null ? decodeEscapeSequences(meal.notes) : null,
            idempotency_key: idempotencyKey,
            saved_meal_id: meal.saved_meal_id ?? null,
        },
        p_items: (meal.items ?? []).map(itemPayload),
    });
    if (error) {
        // meals.saved_meal_id references saved_meals: a 23503 here means the
        // saved meal was deleted after the caller read it (a parallel
        // delete_saved_meal), which the caller can act on.
        if (error.code === "23503" && meal.saved_meal_id) {
            throw new ToolError(
                `No saved meal found with id ${meal.saved_meal_id}; it may have just been deleted.`,
            );
        }
        throw new Error(`Failed to insert meal: ${error.message}`);
    }
    return data as MealInsertResult;
}

export interface SavedMeal extends NutrientValues {
    id: string;
    user_id: string;
    name: string;
    description: string;
    meal_type: string | null;
    created_at: string;
    updated_at: string;
    // Provenance of the nutrient values (see Meal.nutrient_sources).
    nutrient_sources?: NutrientSources | null;
    source_detail?: SourceDetail | null;
}

export interface SavedMealWithItems extends SavedMeal {
    items: MealItemValues[];
}

export interface SavedMealInput extends Partial<NutrientValues> {
    name: string;
    description: string;
    meal_type: string | null;
    nutrient_sources?: NutrientSources | null;
    source_detail?: SourceDetail | null;
}

/** A saved meal with this name already exists for the user (case-insensitive).
 *  `existingId` names it so the caller can point at it. */
export class SavedMealNameTaken extends Error {
    readonly existingId: string | null;

    constructor(existingId: string | null) {
        super("A saved meal with this name already exists.");
        this.name = "SavedMealNameTaken";
        this.existingId = existingId;
    }
}

function savedMealFromRow(row: Record<string, unknown>): SavedMeal {
    return {
        id: String(row.id),
        user_id: String(row.user_id),
        name: String(row.name),
        description: String(row.description),
        meal_type: row.meal_type == null ? null : String(row.meal_type),
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
        ...nutrientsFromRow(row),
        ...provenanceFromRow(row),
    };
}

/** The jsonb object the saved-meal functions read. Only keys present in the
 *  input appear (so an update leaves the others alone); a present key with a
 *  null value clears its column. calories is an integer column. */
function savedMealFields(
    input: Partial<SavedMealInput>,
): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (input.name !== undefined) out.name = input.name;
    if (input.description !== undefined)
        out.description = decodeEscapeSequences(input.description);
    if (input.meal_type !== undefined) out.meal_type = input.meal_type;
    for (const key of NUTRIENT_KEYS) {
        const value = input[key];
        if (value === undefined) continue;
        out[key] =
            value === null
                ? null
                : key === "calories"
                  ? toStoredInteger(value)
                  : value;
    }
    if (input.nutrient_sources !== undefined)
        out.nutrient_sources = input.nutrient_sources;
    if (input.source_detail !== undefined)
        out.source_detail = input.source_detail;
    return out;
}

/** The saved meal named `name` (case-insensitive), by id, or null. */
async function savedMealIdByName(
    userId: string,
    name: string | undefined,
): Promise<string | null> {
    if (!name) return null;
    const [match] = await findSavedMealsByName(userId, name);
    return match?.id ?? null;
}

/** Creates a saved meal and its ingredients in one write. A taken name throws
 *  SavedMealNameTaken; nothing is written then. */
export async function createSavedMeal(
    userId: string,
    input: SavedMealInput,
    items: MealItemValues[],
): Promise<SavedMealWithItems> {
    const { data, error } = await getSupabase().rpc("insert_saved_meal", {
        p_user_id: userId,
        p_saved: savedMealFields(input),
        p_items: items.map(itemPayload),
    });
    if (error) {
        if (error.code === "23505")
            throw new SavedMealNameTaken(
                await savedMealIdByName(userId, input.name),
            );
        throw new Error(`Failed to save meal: ${error.message}`);
    }
    return {
        ...savedMealFromRow(data as Record<string, unknown>),
        items,
    };
}

/** Every saved meal of the user, by name, each with its ingredients. */
export async function getSavedMeals(
    userId: string,
    opts: { nameContains?: string } = {},
): Promise<SavedMealWithItems[]> {
    const needle = opts.nameContains?.trim();
    const rows = await fetchAllPages<Record<string, unknown>>(
        async (from, to) => {
            let q = getSupabase()
                .from("saved_meals")
                .select("*")
                .eq("user_id", userId);
            if (needle) q = q.ilike("name", `%${escapeLikePattern(needle)}%`);
            const { data, error } = await q
                .order("created_at", { ascending: true })
                .order("id", { ascending: true })
                .range(from, to);
            if (error)
                throw new Error(`Failed to get saved meals: ${error.message}`);
            return (data as Record<string, unknown>[]) ?? [];
        },
    );
    return withItems(userId, rows.map(savedMealFromRow));
}

/** Attaches each saved meal's items, then orders by name. */
async function withItems(
    userId: string,
    saved: SavedMeal[],
): Promise<SavedMealWithItems[]> {
    const items = await selectItemsByParent(
        "saved_meal_items",
        "saved_meal_id",
        userId,
        saved.map((s) => s.id),
    );
    return saved
        .map((s) => ({ ...s, items: items.get(s.id) ?? [] }))
        .sort((a, b) =>
            a.name.toLowerCase() < b.name.toLowerCase()
                ? -1
                : a.name.toLowerCase() > b.name.toLowerCase()
                  ? 1
                  : 0,
        );
}

/** One saved meal by id, or null (also for a non-uuid or another user's id). */
export async function getSavedMeal(
    userId: string,
    id: string,
): Promise<SavedMealWithItems | null> {
    if (!isUuid(id)) return null;
    const { data, error } = await getSupabase()
        .from("saved_meals")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
    if (error) throw new Error(`Failed to get saved meal: ${error.message}`);
    if (!data) return null;
    const [withItem] = await withItems(userId, [
        savedMealFromRow(data as Record<string, unknown>),
    ]);
    return withItem ?? null;
}

/** Saved meals whose name is `name`, ignoring case. The database pattern is
 *  the escaped name with no wildcards, so the exact comparison happens here. */
export async function findSavedMealsByName(
    userId: string,
    name: string,
): Promise<SavedMealWithItems[]> {
    const wanted = name.trim();
    if (!wanted) return [];
    const { data, error } = await getSupabase()
        .from("saved_meals")
        .select("*")
        .eq("user_id", userId)
        .ilike("name", escapeLikePattern(wanted));
    if (error) throw new Error(`Failed to find saved meals: ${error.message}`);
    const lower = wanted.toLowerCase();
    const matches = ((data as Record<string, unknown>[]) ?? [])
        .map(savedMealFromRow)
        .filter((s) => s.name.toLowerCase() === lower);
    return withItems(userId, matches);
}

/** How many saved meals the user has, for the per-user cap. */
export async function countSavedMeals(userId: string): Promise<number> {
    const { count, error } = await getSupabase()
        .from("saved_meals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
    if (error) throw new Error(`Failed to count saved meals: ${error.message}`);
    return count ?? 0;
}

/** Updates a saved meal's own figures and labels (no items) as one guarded
 *  row write: it lands only while the row still holds `guard`, else it throws
 *  SnapshotConflictError. A name taken by another saved meal throws
 *  SavedMealNameTaken. Null when this user has no saved meal with `id`. */
export async function updateSavedMealIfUnchanged(
    userId: string,
    id: string,
    fields: Partial<SavedMealInput>,
    guard: MealSnapshotGuard,
): Promise<SavedMealWithItems | null> {
    if (!isUuid(id)) return null;
    const sb = getSupabase();
    const query = sb
        .from("saved_meals")
        .update({
            ...savedMealFields(fields),
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId);
    const { data, error } = await guardedBy(query, guard).select("*");
    if (error) {
        if (error.code === "23505")
            throw new SavedMealNameTaken(
                await savedMealIdByName(userId, fields.name),
            );
        throw new Error(`Failed to update saved meal: ${error.message}`);
    }
    const row = (data as Record<string, unknown>[] | null)?.[0];
    if (row) {
        const [withItem] = await withItems(userId, [savedMealFromRow(row)]);
        return withItem ?? null;
    }
    // Nothing written: gone, or the guarded snapshot moved.
    const { data: still, error: stillErr } = await sb
        .from("saved_meals")
        .select("id")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
    if (stillErr)
        throw new Error(`Failed to update saved meal: ${stillErr.message}`);
    if (!still) return null;
    throw new SnapshotConflictError(id);
}

/** Updates a saved meal. `items` replaces its ingredients when given, and
 *  keeps them when null. A name taken by another saved meal throws
 *  SavedMealNameTaken. Null when this user has no saved meal with `id`. */
export async function updateSavedMeal(
    userId: string,
    id: string,
    fields: Partial<SavedMealInput>,
    items: MealItemValues[] | null,
): Promise<SavedMealWithItems | null> {
    if (!isUuid(id)) return null;
    const { data, error } = await getSupabase().rpc("update_saved_meal", {
        p_user_id: userId,
        p_id: id,
        p_fields: savedMealFields(fields),
        p_items: items === null ? null : items.map(itemPayload),
    });
    if (error) {
        if (error.code === "23505")
            throw new SavedMealNameTaken(
                await savedMealIdByName(userId, fields.name),
            );
        throw new Error(`Failed to update saved meal: ${error.message}`);
    }
    if (data == null) return null;
    const saved = savedMealFromRow(data as Record<string, unknown>);
    if (items !== null) return { ...saved, items };
    const [withItem] = await withItems(userId, [saved]);
    return withItem ?? null;
}

/** Deletes a saved meal and its ingredients. Logged meals copied from it keep
 *  their values (their saved_meal_id goes null). Returns the deleted row, or
 *  null when there was none. */
export async function deleteSavedMeal(
    userId: string,
    id: string,
): Promise<SavedMeal | null> {
    if (!isUuid(id)) return null;
    const { data, error } = await getSupabase()
        .from("saved_meals")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select();
    if (error) throw new Error(`Failed to delete saved meal: ${error.message}`);
    const row = (data as Record<string, unknown>[] | null)?.[0];
    return row ? savedMealFromRow(row) : null;
}

/** Saved meals matching any of `queries`: a name or a description that holds
 *  every token of a query, or an ingredient name that does. Summaries only,
 *  the first SAVED_MEAL_SEARCH_LIMIT by name, with `total` counting every
 *  match so the listing can say when it was cut. */
export const SAVED_MEAL_SEARCH_LIMIT = 20;

/** Orders saved meals by name ignoring case, then by id, so the cut to
 *  SAVED_MEAL_SEARCH_LIMIT never depends on the order rows arrived in. */
function bySavedMealName(a: SavedMeal, b: SavedMeal): number {
    const x = a.name.toLowerCase();
    const y = b.name.toLowerCase();
    if (x !== y) return x < y ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export async function searchSavedMeals(
    userId: string,
    queries: string[],
): Promise<{ saved: SavedMealSummary[]; total: number }> {
    const tokenized = queries
        .map(tokenizeQuery)
        .filter((tokens) => tokens.length > 0);
    if (tokenized.length === 0) return { saved: [], total: 0 };

    // Each query reads every match (a user holds at most
    // MAX_SAVED_MEALS_PER_USER saved meals), ordered by name and id, so the
    // first SAVED_MEAL_SEARCH_LIMIT by name are always among them, whatever
    // the database collation makes of letter case.
    const cap = MAX_SAVED_MEALS_PER_USER;
    const savedBy = (column: "name" | "description", tokens: string[]) => {
        let q = getSupabase()
            .from("saved_meals")
            .select("*")
            .eq("user_id", userId);
        for (const token of tokens) {
            q = q.ilike(column, `%${escapeLikePattern(token)}%`);
        }
        return q.order("name").order("id").limit(cap);
    };
    // Ingredient names, through an inner embed of the items as in searchMeals:
    // one item has to hold every token.
    const savedByItem = (tokens: string[]) => {
        let q = getSupabase()
            .from("saved_meals")
            .select("*, saved_meal_items!inner(name)")
            .eq("user_id", userId)
            .eq("saved_meal_items.user_id", userId);
        for (const token of tokens) {
            q = q.ilike(
                "saved_meal_items.name",
                `%${escapeLikePattern(token)}%`,
            );
        }
        return q.order("name").order("id").limit(cap);
    };

    const results = await Promise.all(
        tokenized.flatMap((tokens) => [
            savedBy("name", tokens),
            savedBy("description", tokens),
            savedByItem(tokens),
        ]),
    );

    const found = new Map<string, SavedMeal>();
    for (const { data, error } of results) {
        if (error)
            throw new Error(`Failed to search saved meals: ${error.message}`);
        for (const row of (data as Record<string, unknown>[]) ?? []) {
            // savedMealFromRow drops the ingredient query's embedded items.
            const saved = savedMealFromRow(row);
            found.set(saved.id, saved);
        }
    }

    const saved = [...found.values()]
        .sort(bySavedMealName)
        .slice(0, SAVED_MEAL_SEARCH_LIMIT);
    const items = await selectItemsByParent(
        "saved_meal_items",
        "saved_meal_id",
        userId,
        saved.map((s) => s.id),
    );
    return {
        saved: saved.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            meal_type: s.meal_type,
            calories: s.calories,
            protein_g: s.protein_g,
            carbs_g: s.carbs_g,
            fat_g: s.fat_g,
            item_count: items.get(s.id)?.length ?? 0,
        })),
        total: found.size,
    };
}

/** One logged meal by id, or null (also for a non-uuid or another user's id). */
export async function getMealById(
    userId: string,
    id: string,
): Promise<Meal | null> {
    if (!isUuid(id)) return null;
    const { data, error } = await getSupabase()
        .from("meals")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
    if (error) throw new Error(`Failed to get meal: ${error.message}`);
    return (data as Meal | null) ?? null;
}

// ---------- Export readers (see src/export.ts) ----------

/** One ingredient row as stored, ids included, for meal_items.csv. */
export interface MealItemRow extends MealItemValues {
    id: string;
    meal_id: string;
    user_id: string;
}

/** Every logged-meal ingredient of the user, in meal then position order. */
export function getAllMealItems(userId: string): Promise<MealItemRow[]> {
    return selectAllForUser<MealItemRow>(
        "meal_items",
        "*",
        "meal items",
        userId,
        ["meal_id", "position", "id"],
        "id",
    ).then((rows) => rows.map(withProvenance));
}

/** Every saved meal of the user, oldest first, as stored. */
export function getAllSavedMeals(userId: string): Promise<SavedMeal[]> {
    return selectAllForUser<SavedMeal>(
        "saved_meals",
        "*",
        "saved meals",
        userId,
        ["created_at", "id"],
        "id",
    ).then((rows) => rows.map(withProvenance));
}

/** One saved-meal ingredient row as stored, ids included. */
export interface SavedMealItemRow extends MealItemValues {
    id: string;
    saved_meal_id: string;
    user_id: string;
}

/** Every saved-meal ingredient of the user, as stored, for saved_meal_items.csv. */
export function getAllSavedMealItems(
    userId: string,
): Promise<SavedMealItemRow[]> {
    return selectAllForUser<SavedMealItemRow>(
        "saved_meal_items",
        "*",
        "saved meal items",
        userId,
        ["saved_meal_id", "position", "id"],
        "id",
    ).then((rows) => rows.map(withProvenance));
}

// ---------- Profiles ----------

export interface Profile {
    user_id: string;
    // null means "never set with set_timezone" — the column has no default
    // to fall back on that would be distinguishable from a deliberate
    // choice, so every reader must coalesce this explicitly (see
    // timezoneFromProfile / getUserTimezone below). Do not read this
    // directly to decide whether a timezone is "configured" outside those
    // two: that was #99 — a row can exist (any set_* tool creates one) with
    // this still null.
    timezone: string | null;
    preferred_weight_unit: WeightUnit | null;
    // null = never set with set_length_unit; same contract as preferred_weight_unit.
    // Coalesce through preferredLengthUnitFromProfile. Never derived from the weight unit.
    preferred_length_unit: LengthUnit | null;
    widgets_enabled: boolean;
    alcohol_tracking_enabled: boolean;
    preferred_drink_unit: DrinkUnit | null;
    // null means "never set with set_language" — same null-is-not-a-default
    // contract as timezone above. Always coalesce through localeFromProfile /
    // getUserLocale, never read this directly.
    locale: string | null;
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

// Returns the timezone the user actually chose with set_timezone, or null if
// they never have — regardless of whether a profile row exists. Callers that
// need to know whether the timezone is *configured* (as opposed to what to
// display) must use this, not `profile !== null`.
export function timezoneFromProfile(
    profile: Profile | null | undefined,
): string | null {
    return profile?.timezone ?? null;
}

export async function getUserTimezone(userId: string): Promise<string> {
    return timezoneFromProfile(await getProfile(userId)) ?? "UTC";
}

// Returns the locale the user actually chose with set_language, or null if
// they never have — regardless of whether a profile row exists. Mirrors
// timezoneFromProfile: callers that need to know whether a locale is
// *configured* must use this, not `profile !== null`.
export function localeFromProfile(
    profile: Profile | null | undefined,
): string | null {
    return profile?.locale ?? null;
}

export async function getUserLocale(userId: string): Promise<string> {
    return localeFromProfile(await getProfile(userId)) ?? "en";
}

// Returns the user's saved weight-unit preference, or null if they have never
// chosen one. Write paths use null to refuse guessing; display paths coalesce
// to "kg". Mirrors timezoneFromProfile/localeFromProfile — a caller that
// already has a fetched profile (get_profile needs all six preferences at
// once) should use this instead of the *FromProfile-less
// getPreferredWeightUnit, which was the one preference without a pure
// derivation until this existed.
export function preferredWeightUnitFromProfile(
    profile: Profile | null | undefined,
): WeightUnit | null {
    const unit = profile?.preferred_weight_unit;
    return isWeightUnit(unit) ? unit : null;
}

export async function getPreferredWeightUnit(
    userId: string,
): Promise<WeightUnit | null> {
    return preferredWeightUnitFromProfile(await getProfile(userId));
}

// Returns the user's saved length-unit preference (body measurements), or null
// if they have never chosen one. Same contract as preferredWeightUnitFromProfile:
// write paths refuse to guess on null; display paths show each entry in the
// unit it was entered in. Unknown column text degrades to null. Never derived
// from the weight unit.
export function preferredLengthUnitFromProfile(
    profile: Profile | null | undefined,
): LengthUnit | null {
    const unit = profile?.preferred_length_unit;
    return isLengthUnit(unit) ? unit : null;
}

export async function getPreferredLengthUnit(
    userId: string,
): Promise<LengthUnit | null> {
    return preferredLengthUnitFromProfile(await getProfile(userId));
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
// first insert, an omitted column falls back to its DB default where one
// exists (widgets_enabled: true, alcohol_tracking_enabled: false); timezone,
// preferred_weight_unit, preferred_length_unit and preferred_drink_unit have
// none and land as NULL, meaning "never chosen".
export async function upsertProfile(
    userId: string,
    patch: {
        timezone?: string;
        preferred_weight_unit?: WeightUnit | null;
        preferred_length_unit?: LengthUnit | null;
        widgets_enabled?: boolean;
        alcohol_tracking_enabled?: boolean;
        preferred_drink_unit?: DrinkUnit | null;
        locale?: string;
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
    if (patch.preferred_length_unit !== undefined)
        payload.preferred_length_unit = patch.preferred_length_unit;
    if (patch.widgets_enabled !== undefined)
        payload.widgets_enabled = patch.widgets_enabled;
    if (patch.alcohol_tracking_enabled !== undefined)
        payload.alcohol_tracking_enabled = patch.alcohol_tracking_enabled;
    // null is meaningful here too (clears the preference).
    if (patch.preferred_drink_unit !== undefined)
        payload.preferred_drink_unit = patch.preferred_drink_unit;
    if (patch.locale !== undefined) payload.locale = patch.locale;

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
    // Saturated fat is a ceiling like sugar (0 is a real limit, "none").
    // Trans fat has no goal.
    daily_saturated_fat_g?: number | null;
    daily_fiber_g: number | null;
    // Total sugars, and pure ethanol. Both are ceilings ("stay under"), unlike
    // every other goal here, which is a floor — see formatGoalLine in mcp.ts.
    daily_sugar_g: number | null;
    // Added sugars only (see Meal.added_sugar_g), a ceiling like sugar; 0 is a
    // real limit ("none").
    daily_added_sugar_g: number | null;
    daily_alcohol_g: number | null;
    // Milligrams, and a ceiling too — 0 means "none". numeric(7,2) in the DB,
    // since mg targets run three orders larger than the gram ones above.
    daily_caffeine_mg: number | null;
    daily_water_ml: number | null;
    target_weight_g: number | null;
    updated_at: string;
}

export interface NutritionGoalsInput {
    daily_calories?: number | null;
    daily_protein_g?: number | null;
    daily_carbs_g?: number | null;
    daily_fat_g?: number | null;
    daily_saturated_fat_g?: number | null;
    daily_fiber_g?: number | null;
    daily_sugar_g?: number | null;
    daily_added_sugar_g?: number | null;
    daily_alcohol_g?: number | null;
    daily_caffeine_mg?: number | null;
    daily_water_ml?: number | null;
    target_weight_g?: number | null;
}

export async function upsertNutritionGoals(
    userId: string,
    input: NutritionGoalsInput,
): Promise<NutritionGoals> {
    // The row as it was before this save, so recordGoalsHistory can date a
    // change history missed at the time it was actually made.
    const { data: priorData, error: priorErr } = await getSupabase()
        .from("nutrition_goals")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
    if (priorErr) throw new Error(`Failed to save goals: ${priorErr.message}`);
    const prior = (priorData as NutritionGoals | null) ?? null;

    const { data, error } = await getSupabase()
        .from("nutrition_goals")
        .upsert(
            {
                user_id: userId,
                // daily_calories and daily_water_ml are integer columns; the
                // gram targets are numeric(6,2) and daily_caffeine_mg is
                // numeric(7,2). See toStoredInteger — a water goal converted
                // from "half a gallon" arrives fractional.
                daily_calories:
                    input.daily_calories == null
                        ? null
                        : toStoredInteger(input.daily_calories),
                daily_protein_g: input.daily_protein_g ?? null,
                daily_carbs_g: input.daily_carbs_g ?? null,
                daily_fat_g: input.daily_fat_g ?? null,
                daily_saturated_fat_g: input.daily_saturated_fat_g ?? null,
                daily_fiber_g: input.daily_fiber_g ?? null,
                daily_sugar_g: input.daily_sugar_g ?? null,
                daily_added_sugar_g: input.daily_added_sugar_g ?? null,
                daily_alcohol_g: input.daily_alcohol_g ?? null,
                daily_caffeine_mg: input.daily_caffeine_mg ?? null,
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
    const saved = data as NutritionGoals;
    await recordGoalsHistory(userId, prior, saved);
    return saved;
}

/**
 * Brings `nutrition_goals_history` up to date with this save. The comparison
 * is against the user's latest history row, not against the `nutrition_goals`
 * row alone, and it runs in two steps:
 *
 * 1. If the row as it was before this save (`prior`) differs from the latest
 *    history row, history missed that change, and it is recorded at the
 *    prior row's own `updated_at`, i.e. when it was actually made. Two cases
 *    reach this: a history insert that failed earlier (the retry then dates
 *    the change to the original save, not to the retry), and a goal set by
 *    code that predates this table, between the migration's seed and the
 *    deploy.
 * 2. If the goals just saved differ from what history now ends with, they
 *    are recorded at this save's `updated_at`.
 *
 * Values come from the rows as stored (integer and numeric rounding applied),
 * and history's columns are typed the same, so an unchanged goal compares
 * equal. One limit: `updated_at` is bumped on every save, so if a retry also
 * fails, the next one dates the change to that failed retry rather than to
 * the original save.
 *
 * A failure throws after the goal is saved: the tool reports an error, and
 * calling it again with the same values heals the history. The raw cause is
 * logged under a ref with no user id; the thrown ToolError says what happened
 * without it.
 */
async function recordGoalsHistory(
    userId: string,
    prior: NutritionGoals | null,
    saved: NutritionGoals,
): Promise<void> {
    const goals = pickGoals(saved as unknown as Record<string, unknown>);
    try {
        const { data: latestData, error: readErr } = await getSupabase()
            .from("nutrition_goals_history")
            .select(["effective_at", ...GOAL_COLUMNS].join(","))
            .eq("user_id", userId)
            .order("effective_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (readErr) throw new Error(readErr.message);
        const latest = latestData as unknown as Record<string, unknown> | null;
        let tail = latest ? pickGoals(latest) : null;

        if (prior) {
            const priorGoals = pickGoals(
                prior as unknown as Record<string, unknown>,
            );
            const priorAt = Date.parse(prior.updated_at);
            const latestAt = latest
                ? Date.parse(String(latest.effective_at))
                : Number.NEGATIVE_INFINITY;
            if (
                !(tail && sameGoals(tail, priorGoals)) &&
                Number.isFinite(priorAt) &&
                priorAt > latestAt
            ) {
                const { error: missedErr } = await getSupabase()
                    .from("nutrition_goals_history")
                    .insert({
                        user_id: userId,
                        effective_at: prior.updated_at,
                        ...priorGoals,
                    });
                if (missedErr) throw new Error(missedErr.message);
                tail = priorGoals;
            }
        }

        if (tail && sameGoals(tail, goals)) return;

        const { error: insertErr } = await getSupabase()
            .from("nutrition_goals_history")
            .insert({
                user_id: userId,
                effective_at: saved.updated_at,
                ...goals,
            });
        if (insertErr) throw new Error(insertErr.message);
    } catch (err) {
        const ref = newErrorRef();
        console.warn(
            `[goals-history] record failed ref=${ref}: ${JSON.stringify((err instanceof Error ? err.message : String(err)).slice(0, 500))}`,
        );
        throw new ToolError(
            `Failed to record this change in the goals history (ref ${ref}). The new goals themselves were saved. Calling set_nutrition_goals again with the same values records the change, dated to when it was saved; it does not save anything twice.`,
        );
    }
}

/**
 * Every change to the user's goals, oldest first, as `goalsOnDate`
 * (src/goals-history.ts) expects: the stored history plus, through
 * `withCurrentGoals`, a change the current `nutrition_goals` row holds that
 * history does not yet (one saved by pre-history code after the migration
 * ran, which the next save backfills at the same instant). Both reads run in
 * parallel. This is the read path only (get_trends group_by, the export):
 * `recordGoalsHistory` compares against the stored history on its own query
 * and must keep doing so, or it would treat the merged entry as recorded.
 */
export async function getNutritionGoalsHistory(
    userId: string,
): Promise<NutritionGoalsHistoryRow[]> {
    const [stored, current] = await Promise.all([
        getStoredGoalsHistory(userId),
        getNutritionGoals(userId),
    ]);
    return withCurrentGoals(stored, current);
}

/**
 * The stored `nutrition_goals_history` rows, oldest first (`effective_at`,
 * then `id`). Paged past PostgREST's row cap and reconciled against the first
 * page's exact count like the window readers, throwing `result would be
 * truncated` (category `read_truncated`) when short; repeats from an insert
 * landing between pages are dropped by id first. A user changes goals rarely,
 * so this is almost always one page.
 */
async function getStoredGoalsHistory(
    userId: string,
): Promise<NutritionGoalsHistoryRow[]> {
    let expected: number | null = null;
    const fetched = await fetchAllPages<Record<string, unknown>>(
        async (from, to) => {
            const { data, error, count } = await getSupabase()
                .from("nutrition_goals_history")
                .select(
                    ["id", "effective_at", ...GOAL_COLUMNS].join(","),
                    from === 0 ? { count: "exact" } : undefined,
                )
                .eq("user_id", userId)
                .order("effective_at", { ascending: true })
                .order("id", { ascending: true })
                .range(from, to);
            if (error)
                throw new Error(
                    `Failed to get goals history: ${error.message}`,
                );
            if (from === 0) expected = count ?? null;
            return (data as unknown as Record<string, unknown>[]) ?? [];
        },
    );
    const seen = new Set<unknown>();
    const rows = fetched.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
    });
    assertWindowComplete("goals history", rows.length, expected);
    return rows.map((r) => ({
        effective_at: new Date(String(r.effective_at)).toISOString(),
        ...pickGoals(r),
    }));
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

// ---------- Export-only readers (account, telemetry, connections) ----------

/**
 * Every row of `table` belonging to the user, paged past PostgREST's row cap
 * and reconciled against the first page's exact count, throwing when short —
 * the same contract as getAllMeals, for the export's non-log tables. `order`
 * must be a total order (end on a unique column) or ties straddling a page
 * edge could be skipped or repeated. A stable order does not stop offset
 * paging from returning a row twice when a row is inserted between pages
 * ahead of the current offset, so a table with a unique selected column
 * passes it as `dedupeBy` and repeats are dropped (first copy kept) before
 * the count is reconciled. tool_analytics needs this: withAnalytics stamps
 * `invoked_at` when a call starts but inserts the row when it ends, so a
 * parallel tool call finishing mid-export lands behind rows already paged.
 */
async function selectAllForUser<T>(
    table: string,
    columns: string,
    noun: string,
    userId: string,
    order: string[],
    dedupeBy?: keyof T,
): Promise<T[]> {
    let expected: number | null = null;
    const paged = await fetchAllPages<T>(async (from, to) => {
        let q = getSupabase()
            .from(table)
            .select(columns, from === 0 ? { count: "exact" } : undefined)
            .eq("user_id", userId);
        for (const column of order) q = q.order(column, { ascending: true });
        const { data, error, count } = await q.range(from, to);
        if (error) throw new Error(`Failed to get ${noun}: ${error.message}`);
        if (from === 0) expected = count ?? null;
        return (data as T[]) ?? [];
    });
    let rows = paged;
    if (dedupeBy !== undefined) {
        const seen = new Set<unknown>();
        rows = paged.filter((r) => {
            const key = r[dedupeBy];
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
    if (expected === null) {
        throw new Error(
            `Failed to get ${noun}: no row count came back — export would be truncated`,
        );
    }
    if (rows.length < expected) {
        throw new Error(
            `Failed to get ${noun}: fetched ${rows.length} of ${expected} rows — export would be truncated`,
        );
    }
    return rows;
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

/** One tool_analytics row, as the export reads it back. */
export interface ToolAnalyticsRow {
    id: string;
    tool_name: string;
    success: boolean;
    duration_ms: number;
    error_category: string | null;
    date_range_days: number | null;
    mcp_session_id: string | null;
    protocol_era: string | null;
    client_name: string | null;
    invoked_at: string;
    created_at: string | null;
}

/**
 * Every tool-usage telemetry row recorded for the user, oldest first. A heavy
 * user has thousands, so this pages and reconciles like getAllMeals.
 * `tool_analytics.user_id` is varchar with no FK (it also holds the
 * "[deleted]" sentinel); the uuid string compares equal to it as text.
 */
export async function getAllToolAnalytics(
    userId: string,
): Promise<ToolAnalyticsRow[]> {
    return selectAllForUser<ToolAnalyticsRow>(
        "tool_analytics",
        "id, tool_name, success, duration_ms, error_category, date_range_days, mcp_session_id, protocol_era, client_name, invoked_at, created_at",
        "telemetry",
        userId,
        ["invoked_at", "id"],
        "id",
    );
}

/**
 * One OAuth grant held for the user: a live-or-not-yet-swept access token,
 * refresh token or pending authorization code. Deliberately carries no
 * `token` / `code` / `code_challenge`: those columns hold hashes of secrets
 * (or a PKCE challenge), and nothing a user does with an export needs them.
 */
export interface OAuthGrantRow {
    kind: "access_token" | "refresh_token" | "authorization_code";
    client_id: string | null;
    client_name: string | null;
    redirect_uri: string | null;
    created_at: string;
    expires_at: string;
}

/**
 * Every OAuth access token, refresh token and authorization code stored for
 * the user, each table read in full and reconciled, plus the registered
 * client_name for every client they name. Access tokens have no client_id
 * column, so theirs is always null. Rows past expiry that the hourly sweep
 * has not removed yet are included: they are still stored.
 *
 * Ordered by created_at then the secret's hash column. The hash is used only
 * as a unique tie-break in ORDER BY and is never selected.
 */
export async function getAllOAuthGrants(
    userId: string,
): Promise<OAuthGrantRow[]> {
    const [access, refresh, codes] = await Promise.all([
        selectAllForUser<{ created_at: string; expires_at: string }>(
            "oauth_tokens",
            "created_at, expires_at",
            "access tokens",
            userId,
            ["created_at", "token"],
        ),
        selectAllForUser<{
            client_id: string | null;
            created_at: string;
            expires_at: string;
        }>(
            "refresh_tokens",
            "client_id, created_at, expires_at",
            "refresh tokens",
            userId,
            ["created_at", "token"],
        ),
        selectAllForUser<{
            client_id: string | null;
            redirect_uri: string;
            created_at: string;
            expires_at: string;
        }>(
            "auth_codes",
            "client_id, redirect_uri, created_at, expires_at",
            "authorization codes",
            userId,
            ["created_at", "code"],
        ),
    ]);

    const clientIds = [
        ...new Set(
            [...refresh, ...codes]
                .map((r) => r.client_id)
                .filter((id): id is string => !!id),
        ),
    ];
    const names = new Map<string, string | null>();
    if (clientIds.length > 0) {
        const { data, error } = await getSupabase()
            .from("oauth_clients")
            .select("client_id, client_name")
            .in("client_id", clientIds);
        if (error)
            throw new Error(`Failed to get OAuth clients: ${error.message}`);
        for (const r of data ?? [])
            names.set(r.client_id as string, (r.client_name as string) ?? null);
    }
    const nameOf = (id: string | null) => (id ? (names.get(id) ?? null) : null);

    return [
        ...access.map((r): OAuthGrantRow => ({
            kind: "access_token",
            client_id: null,
            client_name: null,
            redirect_uri: null,
            created_at: r.created_at,
            expires_at: r.expires_at,
        })),
        ...refresh.map((r): OAuthGrantRow => ({
            kind: "refresh_token",
            client_id: r.client_id,
            client_name: nameOf(r.client_id),
            redirect_uri: null,
            created_at: r.created_at,
            expires_at: r.expires_at,
        })),
        ...codes.map((r): OAuthGrantRow => ({
            kind: "authorization_code",
            client_id: r.client_id,
            client_name: nameOf(r.client_id),
            redirect_uri: r.redirect_uri,
            created_at: r.created_at,
            expires_at: r.expires_at,
        })),
    ];
}

/**
 * The user's Supabase Auth record (email, sign-in timestamps, identities and
 * the profile claims a provider sent), via the service-role admin API. Null
 * when Auth has no such user. The admin API never returns a password hash.
 */
export async function getAuthAccount(userId: string): Promise<User | null> {
    const { data, error } = await getSupabase().auth.admin.getUserById(userId);
    if (error) {
        if (error.status === 404) return null;
        throw new Error(`Failed to get account: ${error.message}`);
    }
    return data.user ?? null;
}

// ---------- Delete all user data ----------

/**
 * Storage key the whole-account export archive is written to — one per user,
 * so each export overwrites the last. Lives here rather than in src/export.ts
 * because deletion needs it too and src/export.ts already imports from this
 * module; the other direction would be a cycle.
 */
export function exportArchivePath(userId: string): string {
    return `${userId}/nutrition-mcp-export.zip`;
}

/**
 * EVERY key an export may have left in the bucket for this user, current and
 * historical. `deleteAllUserData` removes all of them, and that is the whole
 * reason this list exists rather than a single inlined path: the archive holds
 * the user's complete meal, water, weight, body-measurement, goals and profile history, so a key
 * missed here survives the account that asked to be erased — and keeps
 * resolving through the signed URL the user was already handed, for the rest
 * of its hour. Renaming the archive without adding its old name to this list
 * is exactly that bug, and `remove` reports a missing path as success, so
 * nothing would surface it. Add, do not replace.
 */
export function exportStoragePaths(userId: string): string[] {
    return [
        exportArchivePath(userId),
        // Written by the meals-only export that the archive replaced. Nothing
        // creates it any more; it stays here to clean up files left behind by
        // exports taken before that change.
        `${userId}/meals.csv`,
    ];
}

export async function deleteAllUserData(userId: string): Promise<void> {
    const sb = getSupabase();

    // Apple Health sync first: removing the link stops the Shortcut syncing
    // (and writing another sent-values row) while the rest is being deleted.
    // Pending connects are only attributable once claimed; unclaimed ones
    // carry no user and lapse within 30 minutes.
    const { error: hsLinkErr } = await sb
        .from("health_sync_links")
        .delete()
        .eq("user_id", userId);
    if (hsLinkErr)
        throw new Error(
            `Failed to delete Apple Health sync link: ${hsLinkErr.message}`,
        );

    const { error: hsDaysErr } = await sb
        .from("health_sync_days")
        .delete()
        .eq("user_id", userId);
    if (hsDaysErr)
        throw new Error(
            `Failed to delete Apple Health sync record: ${hsDaysErr.message}`,
        );

    const { error: hsPendingErr } = await sb
        .from("health_sync_pending")
        .delete()
        .eq("user_id", userId);
    if (hsPendingErr)
        throw new Error(
            `Failed to delete pending Apple Health sync: ${hsPendingErr.message}`,
        );

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

    const { error: measurementsErr } = await sb
        .from("body_measurement_log")
        .delete()
        .eq("user_id", userId);
    if (measurementsErr)
        throw new Error(
            `Failed to delete body measurements: ${measurementsErr.message}`,
        );

    // Goals history, just before the current goals row it records changes to.
    const { error: goalsHistoryErr } = await sb
        .from("nutrition_goals_history")
        .delete()
        .eq("user_id", userId);
    if (goalsHistoryErr)
        throw new Error(
            `Failed to delete goals history: ${goalsHistoryErr.message}`,
        );

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

    // Remove any export file from the "exports" storage bucket. Missing paths
    // are not an error, so this is a no-op for users who never exported.
    const { error: exportErr } = await sb.storage
        .from("exports")
        .remove(exportStoragePaths(userId));
    if (exportErr)
        throw new Error(`Failed to delete exports: ${exportErr.message}`);

    // Ingredients and saved meals go before the logged meals. A logged meal's
    // saved_meal_id is set null by the database, so no other order is wrong,
    // but naming each table keeps every table's rows in the deletion record.
    const { error: mealItemsErr } = await sb
        .from("meal_items")
        .delete()
        .eq("user_id", userId);
    if (mealItemsErr)
        throw new Error(`Failed to delete meal items: ${mealItemsErr.message}`);

    const { error: savedItemsErr } = await sb
        .from("saved_meal_items")
        .delete()
        .eq("user_id", userId);
    if (savedItemsErr)
        throw new Error(
            `Failed to delete saved meal items: ${savedItemsErr.message}`,
        );

    const { error: savedMealsErr } = await sb
        .from("saved_meals")
        .delete()
        .eq("user_id", userId);
    if (savedMealsErr)
        throw new Error(
            `Failed to delete saved meals: ${savedMealsErr.message}`,
        );

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

// Access tokens, refresh tokens and auth codes are stored as hashSecret(raw)
// in their existing `token` / `code` columns; the raw value only ever exists
// in the response that hands it to the client. Every function here takes the
// raw value and hashes it itself, so no caller can store or look one up in the
// wrong form. Lookups match hashSecret(raw) exactly: every row is in hash form
// since the backfill (20260927120000_hash_oauth_secrets.sql), so a raw value —
// or a stored hash presented as if it were the token — matches nothing.

export async function storeToken(
    token: string,
    userId: string,
    ttlSeconds: number,
): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    const { error } = await getSupabase()
        .from("oauth_tokens")
        .upsert(
            {
                token: hashSecret(token),
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
            .eq("token", hashSecret(token))
            .gt("expires_at", new Date().toISOString())
            .maybeSingle();

        // maybeSingle reports no row as data: null, so any error is a real
        // failure to find out.
        if (error) return { status: "unavailable" };
        if (!data) return { status: "invalid" };
        return { status: "valid", userId: data.user_id as string };
    } catch {
        // Network-level failure never reaches the `error` field.
        return { status: "unavailable" };
    }
}

// ---------- Patreon tokens ----------

/**
 * Backed by the single `patreon_tokens` row (id = "default") — one campaign,
 * one token pair, server-only (RLS has no policy for anon/authenticated; see
 * the patreon_tokens migration). Simplified to a plain null return on any
 * lookup failure: unlike getUserIdByToken's valid/invalid/unavailable
 * TokenLookup, getRecentPosts already treats null as "nothing to show", so a
 * three-state return here would be unused precision for a landing-page
 * nicety with no auth/security stakes.
 */
export function getPatreonTokenStore(): PatreonTokenStore {
    return {
        async getTokens(): Promise<PatreonTokens | null> {
            const { data, error } = await getSupabase()
                .from("patreon_tokens")
                .select("access_token, refresh_token, expires_at")
                .eq("id", "default")
                .single();

            if (error && error.code !== PGRST_NO_ROWS) {
                console.error("getPatreonTokenStore.getTokens failed:", error);
            }
            if (error || !data) return null;
            return {
                accessToken: data.access_token as string,
                refreshToken: data.refresh_token as string,
                expiresAt: data.expires_at as string,
            };
        },

        async saveTokens(tokens: PatreonTokens): Promise<void> {
            const { error } = await getSupabase().from("patreon_tokens").upsert(
                {
                    id: "default",
                    access_token: tokens.accessToken,
                    refresh_token: tokens.refreshToken,
                    expires_at: tokens.expiresAt,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "id" },
            );

            if (error)
                throw new Error(
                    `Failed to save Patreon tokens: ${error.message}`,
                );
        },
    };
}

/**
 * One-time bootstrap. PATREON_ACCESS_TOKEN / PATREON_REFRESH_TOKEN are named
 * for exactly what Patreon's client-management page calls them ("Creator's
 * Access Token" / "Creator's Refresh Token") for a manually-registered OAuth
 * client — pasting them here lets a fresh deploy seed patreon_tokens without
 * a hand-run SQL insert. expires_at is seeded already-past (the epoch): these
 * env vars carry no expiry, so the very next call through getRecentPosts
 * refreshes immediately and replaces both with a freshly-minted pair. From
 * then on this is a permanent no-op (`ignoreDuplicates` = INSERT ... ON
 * CONFLICT DO NOTHING on the `id` row) — the env vars can be left in place
 * forever without ever clobbering a token pair that has since rotated past
 * them, and this can safely run on every boot of every replica.
 */
export async function seedPatreonTokensFromEnv(): Promise<void> {
    const accessToken = process.env.PATREON_ACCESS_TOKEN;
    const refreshToken = process.env.PATREON_REFRESH_TOKEN;
    if (!accessToken || !refreshToken) return;

    const { error } = await getSupabase()
        .from("patreon_tokens")
        .upsert(
            {
                id: "default",
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: new Date(0).toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: "id", ignoreDuplicates: true },
        );

    if (error) console.error("Failed to seed Patreon tokens:", error.message);
}

// ---------- Auth codes ----------

export interface AuthCodeRecord {
    code: string;
    redirectUri: string;
    userId: string;
    codeChallenge: string;
    // The client the code was issued to and the RFC 8707 resource it was
    // requested for (null when the client sent none). Both columns were added
    // with oauth_clients; /token refuses a code redeemed by any other client.
    clientId: string;
    resource: string | null;
}

export async function storeAuthCode(rec: AuthCodeRecord): Promise<void> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await getSupabase()
        .from("auth_codes")
        .insert({
            code: hashSecret(rec.code),
            redirect_uri: rec.redirectUri,
            user_id: rec.userId,
            code_challenge: rec.codeChallenge,
            client_id: rec.clientId,
            resource: rec.resource,
            expires_at: expiresAt,
        });

    if (error) throw new Error(`Failed to store auth code: ${error.message}`);
}

export interface AuthCodeData {
    // The at-rest form (hashSecret of the code), not the value the client
    // presented.
    code: string;
    redirect_uri: string;
    user_id: string;
    code_challenge: string | null;
    // Null on codes minted before the oauth_clients migration.
    client_id: string | null;
    resource: string | null;
}

export async function consumeAuthCode(
    code: string,
): Promise<AuthCodeData | null> {
    const now = new Date().toISOString();

    // delete … returning is what keeps a code single-use: two concurrent
    // redemptions can't both get the row back.
    const { data, error } = await getSupabase()
        .from("auth_codes")
        .delete()
        .eq("code", hashSecret(code))
        .gt("expires_at", now)
        .select();

    if (error || !data || data.length === 0) return null;
    return data[0] as AuthCodeData;
}

// ---------- Refresh tokens ----------

// clientId is the OAuth client the token was issued to (refresh_tokens.client_id);
// null only for a refresh that started from a pre-binding, null-client token
// presented without any client credentials.
// ttlSeconds is counted from now: each rotation gets a fresh lifetime
// (sliding), while the token itself stays strictly single-use.
export async function storeRefreshToken(
    token: string,
    userId: string,
    clientId: string | null,
    ttlSeconds: number,
): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    const { error } = await getSupabase()
        .from("refresh_tokens")
        .insert({
            token: hashSecret(token),
            user_id: userId,
            client_id: clientId,
            expires_at: expiresAt,
        });

    if (error)
        throw new Error(`Failed to store refresh token: ${error.message}`);
}

// Atomically deletes and returns the token's owner and client. clientId is null
// on rows written before refresh_tokens.client_id existed.
export async function consumeRefreshToken(
    token: string,
): Promise<{ userId: string; clientId: string | null } | null> {
    // Atomic single use, as in consumeAuthCode.
    const { data, error } = await getSupabase()
        .from("refresh_tokens")
        .delete()
        .eq("token", hashSecret(token))
        .gt("expires_at", new Date().toISOString())
        .select("user_id, client_id");

    const row = data?.[0];
    if (error || !row) return null;
    return {
        userId: row.user_id as string,
        clientId: (row.client_id as string | null) ?? null,
    };
}

// ---------- Public landing stats ----------

export interface LandingStats {
    food_logs: number;
    total_calories: number;
    total_protein_g: number;
    total_carbs_g: number;
    total_fat_g: number;
    // Every distinct timezone in use, counted once. A single site-wide number
    // that names no timezone, so it is not held to TZ_MIN_PROFILES; it can be
    // larger than timezone_list is long.
    timezones: number;
    // IANA names of the timezones at least TZ_MIN_PROFILES profiles use —
    // drives the landing-page world map. Aggregate-only; no per-user data.
    //
    // Expect this near-empty for a while after 2026-08-15: the
    // nullable_profile_timezone migration (#99) reset every profile's
    // timezone to NULL, and public_landing_stats() filters both this and
    // timezone_counts to `where timezone is not null`, so a nulled profile
    // drops out of the map entirely until its user calls set_timezone again.
    // The threshold empties it further. Not a map bug — see buildMap() in the
    // landing script (scripts/gen-index.ts) for the visible symptom.
    timezone_list: string[];
    // IANA name -> 1..5, that timezone's share of the profiles in published
    // timezones. Sizes each dot on the world map. Levels, never counts: see
    // timezoneLevels().
    timezone_levels: Record<string, number>;
}

// What the SQL function actually returns. `timezone_counts` is exact and stays
// inside the process — it is bucketed before anything is served.
export interface RawLandingStats extends Omit<LandingStats, "timezone_levels"> {
    timezone_counts?: Record<string, number>;
}

// Fewest profiles a timezone needs before /api/stats names it (brief 13). The
// privacy policy promises it: a timezone held by one or two profiles is a fact
// about one or two people. public_landing_stats() applies the same threshold
// (20260929130000_landing_stats_k_anonymity.sql); publicLandingStats() applies
// it again so a DB still on the older function can't leak through.
export const TZ_MIN_PROFILES = 3;

// Share of the profiles in published (>= TZ_MIN_PROFILES) timezones at which a
// timezone moves up a level. Geometric, not evenly spaced, because the real
// distribution is long-tailed: at 273 profiles, before the threshold existed,
// the largest timezone held 14% while 27 timezones held one profile each. Even
// cuts would drop most dots into level 1 and the map would show no gradient at
// all. Doubling at each step keeps every bucket populated.
export const TZ_LEVEL_THRESHOLDS = [0.01, 0.02, 0.04, 0.08] as const;

// Buckets exact per-timezone counts into 1..5 by share of the total.
//
// Half of the privacy boundary for the world map (TZ_MIN_PROFILES is the
// other). /api/stats is public and unauthenticated, so exact counts are never
// served: a level only narrows a timezone to a range. Pure over whatever it is
// given — publicLandingStats() decides which timezones reach it.
export function timezoneLevels(
    counts: Record<string, number>,
): Record<string, number> {
    const entries = Object.entries(counts).filter(
        ([, n]) => typeof n === "number" && n > 0,
    );
    const total = entries.reduce((sum, [, n]) => sum + n, 0);
    const levels: Record<string, number> = {};
    if (total <= 0) return levels;
    for (const [tz, n] of entries) {
        const share = n / total;
        let level = 1;
        for (const threshold of TZ_LEVEL_THRESHOLDS) {
            if (share >= threshold) level++;
        }
        levels[tz] = level;
    }
    return levels;
}

// Turns the SQL function's output into what /api/stats serves: drops the exact
// counts and every timezone with fewer than TZ_MIN_PROFILES profiles, from both
// the list and the levels.
//
// Levels are shares of the *published* timezones' profiles, not of all
// profiles. The newer SQL function no longer returns the suppressed counts, so
// this is the only total both it and the older function can produce — the map
// looks the same whichever side filtered.
//
// No counts at all (an empty object, or the key missing from a function older
// than 20260808120000_landing_stats_timezone_counts.sql, long since applied) serves an
// empty list: without counts nothing proves a timezone clears the threshold,
// and an unfiltered list is exactly the leak this exists to stop. The map then
// renders its land grid with no dots.
export function publicLandingStats(raw: RawLandingStats): LandingStats {
    const { timezone_counts, timezone_list, ...rest } = raw;
    const shared: Record<string, number> = {};
    for (const [tz, n] of Object.entries(timezone_counts ?? {})) {
        if (typeof n === "number" && n >= TZ_MIN_PROFILES) shared[tz] = n;
    }
    return {
        ...rest,
        timezone_list: (timezone_list ?? []).filter((tz) =>
            Object.hasOwn(shared, tz),
        ),
        timezone_levels: timezoneLevels(shared),
    };
}

// Aggregate-only totals for the public landing page. Backed by the
// `public_landing_stats` SQL function so the whole thing is one round trip and
// the database does the summing. Never returns per-user rows.
export async function getLandingStats(): Promise<LandingStats> {
    const { data, error } = await getSupabase().rpc("public_landing_stats");
    if (error) throw new Error(`Failed to get landing stats: ${error.message}`);
    return publicLandingStats(data as RawLandingStats);
}

// ---------- OAuth clients ----------

// One row per RFC 7591 registration (oauth_clients). The secret is stored only
// as its sha256 hex; the raw value is returned to the registrant once and never
// persisted. The legacy env client never has a row here — src/oauth-store.ts
// resolves it in memory.
export interface OAuthClientRow {
    client_id: string;
    client_secret_hash: string | null;
    token_endpoint_auth_method:
        "none" | "client_secret_post" | "client_secret_basic";
    redirect_uris: string[];
    client_name: string | null;
    grant_types: string[];
}

export async function insertOAuthClient(row: OAuthClientRow): Promise<void> {
    const { error } = await getSupabase().from("oauth_clients").insert(row);
    if (error)
        throw new Error(`Failed to register OAuth client: ${error.message}`);
}

// Null for an unknown client. A lookup failure throws rather than returning
// null: "the database is down" must not read as "this client doesn't exist",
// which /authorize would report to the user as invalid_client.
export async function getOAuthClient(
    clientId: string,
): Promise<OAuthClientRow | null> {
    const { data, error } = await getSupabase()
        .from("oauth_clients")
        .select(
            "client_id, client_secret_hash, token_endpoint_auth_method, redirect_uris, client_name, grant_types",
        )
        .eq("client_id", clientId)
        .maybeSingle();
    if (error)
        throw new Error(`Failed to look up OAuth client: ${error.message}`);
    return (data as OAuthClientRow | null) ?? null;
}

// Stamps oauth_clients.last_used_at when a client authenticates at /token, so
// a later cleanup can tell registrations that were never used from ones that
// were. Best effort: the caller does not await it, and a failure is logged
// rather than thrown, since it must never fail a token request.
export async function touchOAuthClient(clientId: string): Promise<void> {
    const { error } = await getSupabase()
        .from("oauth_clients")
        .update({ last_used_at: new Date().toISOString() })
        .eq("client_id", clientId);
    if (error)
        console.error(
            `[oauth] failed to update client last_used_at: ${error.message}`,
        );
}

// ---------- OAuth cleanup (src/oauth-cleanup.ts drives these) ----------

// Deletes every row of an OAuth token/code table whose expires_at has passed,
// returning how many went. All three tables expire on the same column.
export async function deleteExpiredOAuthRows(
    table: "oauth_tokens" | "refresh_tokens" | "auth_codes",
    nowIso: string,
): Promise<number> {
    const { count, error } = await getSupabase()
        .from(table)
        .delete({ count: "exact" })
        .lt("expires_at", nowIso);
    if (error)
        throw new Error(`Failed to delete expired ${table}: ${error.message}`);
    return count ?? 0;
}

// One page of registrations that never authenticated at /token and were
// created inside the sweep window (see CLIENT_SWEEP_FLOOR_ISO in
// src/oauth-cleanup.ts for why it has a lower bound), ordered by client_id so
// the caller can page with afterId.
export async function listUnusedOAuthClientIds(
    window: { createdAtOrAfterIso: string; createdBeforeIso: string },
    afterId: string | null,
    limit: number,
): Promise<string[]> {
    let q = getSupabase()
        .from("oauth_clients")
        .select("client_id")
        .is("last_used_at", null)
        .gte("created_at", window.createdAtOrAfterIso)
        .lt("created_at", window.createdBeforeIso);
    if (afterId !== null) q = q.gt("client_id", afterId);
    const { data, error } = await q.order("client_id").limit(limit);
    if (error)
        throw new Error(
            `Failed to list unused OAuth clients: ${error.message}`,
        );
    return (data ?? []).map((r) => r.client_id as string);
}

// Which of these client ids a refresh token or an auth code still names. This
// cannot see a pre-Phase-B refresh token, whose client_id is NULL; the sweep
// window's floor keeps those clients out of the candidates instead.
//
// A short answer here would delete a client that holds a grant, so the rows
// are reconciled against an exact count and the call throws when PostgREST's
// row cap (1000 by default, #66) truncated them; the sweep then skips client
// deletion for that run rather than guess.
export async function oauthClientIdsWithGrants(
    ids: string[],
): Promise<Set<string>> {
    const held = new Set<string>();
    if (ids.length === 0) return held;
    for (const table of ["refresh_tokens", "auth_codes"] as const) {
        const { data, error, count } = await getSupabase()
            .from(table)
            .select("client_id", { count: "exact" })
            .in("client_id", ids);
        if (error)
            throw new Error(
                `Failed to check ${table} for OAuth clients: ${error.message}`,
            );
        const rows = data ?? [];
        if (count === null || rows.length < count)
            throw new Error(
                `Checking ${table} for OAuth clients returned ${rows.length} of ${count ?? "?"} rows`,
            );
        for (const r of rows) held.add(r.client_id as string);
    }
    return held;
}

// Deletes these registrations, re-checking in the same statement that each is
// still unused and inside the sweep window, so a client that authenticated
// since it was listed survives. Returns how many rows went.
export async function deleteUnusedOAuthClients(
    ids: string[],
    window: { createdAtOrAfterIso: string; createdBeforeIso: string },
): Promise<number> {
    if (ids.length === 0) return 0;
    const { count, error } = await getSupabase()
        .from("oauth_clients")
        .delete({ count: "exact" })
        .in("client_id", ids)
        .is("last_used_at", null)
        .gte("created_at", window.createdAtOrAfterIso)
        .lt("created_at", window.createdBeforeIso);
    if (error)
        throw new Error(
            `Failed to delete unused OAuth clients: ${error.message}`,
        );
    return count ?? 0;
}

// Is this exact string in the hand-reviewed snapshot of redirects the legacy
// env client may still use (oauth_legacy_redirect_uris)? Exact equality only —
// the snapshot is a list of strings Anton approved, not a pattern.
export async function isLegacyRedirectUri(uri: string): Promise<boolean> {
    const { data, error } = await getSupabase()
        .from("oauth_legacy_redirect_uris")
        .select("redirect_uri")
        .eq("redirect_uri", uri)
        .maybeSingle();
    if (error)
        throw new Error(
            `Failed to look up legacy redirect URI: ${error.message}`,
        );
    return data !== null;
}
