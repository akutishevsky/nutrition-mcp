import {
    MAX_SAVED_MEALS_PER_USER,
    type MealItemValues,
    type NutrientValues,
} from "../meal-items.js";
import { decodeEscapeSequences } from "../normalize.js";
import type { NutrientSources, SourceDetail } from "../provenance.js";
import {
    escapeLikePattern,
    tokenizeQuery,
    type SavedMealSummary,
} from "../search.js";
import { toStoredInteger } from "../units.js";
import {
    fetchAllPages,
    getSupabase,
    isUuid,
    selectAllForUser,
} from "./client.js";
import {
    NUTRIENT_KEYS,
    SnapshotConflictError,
    guardedBy,
    itemPayload,
    nutrientsFromRow,
    provenanceFromRow,
    selectItemsByParent,
    withProvenance,
    type MealSnapshotGuard,
} from "./meal-helpers.js";

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
