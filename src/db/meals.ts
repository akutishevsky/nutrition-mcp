import { ToolError } from "../errors.js";
import type { MealItemValues, MealNutrientKey } from "../meal-items.js";
import type { MealType } from "../meal-types.js";
import { decodeEscapeSequences } from "../normalize.js";
import type { NutrientSources, SourceDetail } from "../provenance.js";
import { escapeLikePattern, tokenizeQuery } from "../search.js";
import { zonedDayStartUtc, zonedNextDayStartUtc } from "../tz.js";
import { toStoredInteger } from "../units.js";
import {
    deriveIdempotencyKey,
    fetchAllPages,
    getSupabase,
    isUuid,
    selectAllForUser,
    selectLoggedWindow,
} from "./client.js";
import {
    NUTRIENT_KEYS,
    SnapshotConflictError,
    guardedBy,
    itemPayload,
    selectItemsByParent,
    withProvenance,
    type MealSnapshotGuard,
} from "./meal-helpers.js";

export {
    SnapshotConflictError,
    snapshotGuardOf,
    type MealSnapshotGuard,
} from "./meal-helpers.js";

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
    // Sodium (not salt), MILLIGRAMS like caffeine. NULL means not recorded,
    // never 0: rows logged before the column existed stay NULL. Carries a
    // daily ceiling (see NutritionGoals.daily_sodium_mg).
    sodium_mg?: number | null;
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
    meal_type: MealType;
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
    // Milligrams — see Meal.sodium_mg.
    sodium_mg?: number;
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
    // saturated_fat_g, trans_fat_g, fiber_g, sugar_g, alcohol_g, caffeine_mg and
    // sodium_mg are EXCLUDED on purpose, and any future meal column must be too. The digest is positional over exactly
    // these values, so appending one changes the derived key of every future
    // write — a user re-logging or re-importing something they already have
    // would get a duplicate row instead of a clean no-op, and every "auto:" key
    // already stored would be orphaned. This repo has shipped that bug once
    // already (see CLAUDE.md, "Bulk meal import"); the mirror of this array is
    // rowContentDigest in src/import.ts, which carries the same warning.
    //
    // Accepted consequence: two meals identical except for their fat split (or
    // fiber, sugar, alcohol, caffeine or sodium) dedupe to one. Dedup stability beats
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
            sodium_mg: meal.sodium_mg ?? null,
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
    if (fields.sodium_mg !== undefined) update.sodium_mg = fields.sodium_mg;
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
            sodium_mg: meal.sodium_mg ?? null,
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
