import type {
    MealItemValues,
    MealNutrientKey,
    NutrientValues,
} from "../meal-items.js";
import {
    parseNutrientSources,
    parseSourceDetail,
    type NutrientSources,
    type SourceDetail,
} from "../provenance.js";
import { fetchAllPages, getSupabase, isUuid } from "./client.js";

/** Snapshot guard: a guarded update (guardedBy) only lands while the row still
 *  holds exactly what its checks and label merge read, so a concurrent edit
 *  makes the caller re-read and redo them instead of overwriting the other
 *  edit's labels or sugar. `null` means IS NULL; an object label compares as jsonb. */
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
export function guardedBy<Q>(query: Q, guard: MealSnapshotGuard): Q {
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

// ---------- Meal items and saved meals ----------

/** Nutrient columns, in MEAL_NUTRIENT_KEYS order. Listed here (type-only
 *  import from src/meal-items.ts) so this module keeps no runtime edge to the
 *  pure module, which imports the import/added-sugar layers. */
export const NUTRIENT_KEYS: readonly MealNutrientKey[] = [
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
    "sodium_mg",
];

/** PostgREST hands numeric columns back as numbers today; coerce anyway so a
 *  string never reaches a total or a line of text. */
function numOrNull(v: unknown): number | null {
    return v == null ? null : Number(v);
}

export function nutrientsFromRow(row: Record<string, unknown>): NutrientValues {
    const out = {} as NutrientValues;
    for (const key of NUTRIENT_KEYS) out[key] = numOrNull(row[key]);
    return out;
}

/** The provenance columns of a row, shape-checked (src/provenance.ts). A column
 *  that is null, or a value that does not parse, reads as null: never a label.
 *  A key is only present when the row carries its column, so a row selected
 *  without them keeps its old shape. */
export function provenanceFromRow(row: Record<string, unknown>): {
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
export function withProvenance<T extends object>(row: T): T {
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
export function itemPayload(item: MealItemValues): Record<string, unknown> {
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
        sodium_mg: item.sodium_mg ?? null,
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
export async function selectItemsByParent(
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
