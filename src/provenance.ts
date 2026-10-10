// Where each nutrient value came from: verification of a claimed food record,
// precedence between sources, the merge and derivation rules the write paths
// apply, parsing of stored maps, and the model-facing and widget-facing shapes.
//
// Pure on purpose: no Supabase, no Hono, no mcp.ts import. The one runtime
// dependency is ToolError. The cache reads live in src/supabase.ts, and this
// module only receives the records they return. The server decides every label:
// a model's claim (food_ref) is checked against the stored record, and a value
// that does not match within tolerance is labelled "estimate", never the
// claimed source.
//
// Storage shape (supabase/migrations/20261010160000_nutrient_sources.sql):
//   nutrient_sources  { [nutrient]: { s, ref? } | { s: "mixed", parts } }
//   source_detail     { "usda:<id>" | "openfoodfacts:<barcode>": { name, ... } }
// Only nutrients that have a value get an entry. NULL means no provenance was
// recorded, and such a row is never back-labelled.

import { ToolError } from "./errors.js";
import type { FoodResult } from "./foods.js";
import type { MealNutrientKey } from "./meal-items.js";
import type { UsdaRecord } from "./usda-record.js";

/** The nutrient keys in storage order. Kept here rather than imported from
 * meal-items.ts so this module has no runtime edge into the import layer;
 * provenance.test.ts pins it equal to MEAL_NUTRIENT_KEYS. */
export const PROVENANCE_NUTRIENT_KEYS = [
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
] as const satisfies readonly MealNutrientKey[];

/** Tolerances for "the logged value matches the record for the amount given".
 * One formula per unit: the larger of the absolute figure and the relative
 * share of the expected value. Grams use 0.5 g, which is what a label rounds
 * to; calories and caffeine have their own absolute floors. */
export const TOLERANCE = {
    /** g: macros, fat parts, sugars, fiber, alcohol. */
    grams: 0.5,
    /** kcal. */
    kcal: 1,
    /** mg: caffeine. */
    mg: 1,
    /** Share of the expected value, applied when it exceeds the absolute floor. */
    relative: 0.01,
} as const;

/** Largest amount_g a food_ref may declare: the item ceiling in
 * src/meal-items.ts (MAX_ITEM_AMOUNT). */
export const MAX_FOOD_REF_GRAMS = 100_000;
/** Largest servings a food_ref may declare: MAX_SERVINGS in src/meal-items.ts. */
export const MAX_FOOD_REF_SERVINGS = 20;
/** Longest name kept in source_detail. */
export const MAX_SOURCE_NAME_CHARS = 200;
/** Longest name a widget receives in _meta (name truncated, nothing else). */
export const META_NAME_CHARS = 60;

/** A source a value can be verified against. */
export type RecordSource = "usda" | "openfoodfacts";
/** Every label a stored tag may carry. */
export type NutrientSource = RecordSource | "user" | "estimate";

/** One nutrient's label. `ref` is the fdcId or the barcode, for a verified
 * record. */
export interface SourceTag {
    s: NutrientSource;
    ref?: string;
}

/** A meal-level label derived from its items: the share of the total each
 * source contributed, in whole percent, summing to 100. */
export interface MixedTag {
    s: "mixed";
    parts: { s: NutrientSource; share: number }[];
}

export type NutrientTag = SourceTag | MixedTag;

/** A row's nutrient_sources: only nutrients that have a value appear. */
export type NutrientSources = Partial<Record<MealNutrientKey, NutrientTag>>;

/** What a stored tag points at. `amount_g` or `servings` is what the value was
 * scaled by, so the tag can be explained later (the export, the widget). */
export interface SourceDetailEntry {
    name: string;
    data_type?: string;
    amount_g?: number;
    servings?: number;
    fetched_at?: string;
}

/** A row's source_detail, keyed "usda:<fdcId>" or "openfoodfacts:<barcode>". */
export type SourceDetail = Record<string, SourceDetailEntry>;

/** A nutrient value set, as the write paths see it. */
export type LoggedValues = Partial<Record<MealNutrientKey, number | null>>;

/** What a caller claims a value came from: a record id and the amount it was
 * scaled by. `amount_g` for a per-100 g record, `servings` for a per-serving
 * one. Parsed by parseFoodRef, which is where its bounds are checked. */
export interface FoodRef {
    source: RecordSource;
    id: string;
    amount_g?: number;
    servings?: number;
}

/** A cached record in the shape verification needs, whichever source it came
 * from. `values` is in the record's own basis: per 100 g, or per serving. */
export interface ReferenceRecord {
    source: RecordSource;
    id: string;
    name: string;
    data_type: string | null;
    basis: "per_100g" | "per_serving";
    values: LoggedValues;
    /** OFF's "~" modifier: added sugar estimated from the ingredients, so it
     * can never verify as openfoodfacts. */
    added_sugar_estimated: boolean;
    /** True when the record's serving label is "100 g". Its values are per 100 g
     * whichever way they were normalized, so a servings declaration means
     * servings of 100 g each. */
    serving_is_100g?: boolean;
    fetched_at: string | null;
}

const CATEGORY = "food_ref_invalid" as const;

/** A food_ref refusal. Messages that quote the caller's id go to the caller;
 * the runtime log gets `logText` instead, since an id is a record reference
 * that must not reach the log (src/log-privacy.test.ts). */
function refuse(message: string, logText?: string): ToolError {
    return new ToolError(message, { category: CATEGORY, logText });
}

const RECORD_SOURCES: readonly RecordSource[] = ["usda", "openfoodfacts"];
const NUTRIENT_SOURCES: readonly NutrientSource[] = [
    "usda",
    "openfoodfacts",
    "user",
    "estimate",
];

/**
 * Parse a caller's food_ref, or throw food_ref_invalid. Bounds live here, not
 * in the input schema, so a bad reference is named in the tool's text.
 *
 * usda takes `amount_g` alone. openfoodfacts takes exactly one of `servings`
 * (a per-serving product) or `amount_g` (a per-100 g product); which one fits is
 * only known from the stored record, so the basis check is in verifyFoodRef.
 */
export function parseFoodRef(raw: unknown): FoodRef {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        throw refuse(
            "food_ref needs a source (usda or openfoodfacts) and an id.",
        );
    }
    const r = raw as Record<string, unknown>;
    const source = r.source;
    if (!RECORD_SOURCES.includes(source as RecordSource)) {
        throw refuse("food_ref source must be usda or openfoodfacts.");
    }
    const id = typeof r.id === "number" ? String(r.id) : r.id;
    if (typeof id !== "string") {
        throw refuse(`food_ref ${source} needs an id.`);
    }
    if (source === "usda" && !/^[1-9]\d{0,9}$/.test(id)) {
        throw refuse(
            `food_ref usda id ${id} is not a FoodData Central id.`,
            "food_ref usda id is not a FoodData Central id.",
        );
    }
    if (source === "openfoodfacts" && !/^\d{8,14}$/.test(id)) {
        throw refuse(
            `food_ref openfoodfacts id ${id} is not a barcode (8 to 14 digits).`,
            "food_ref openfoodfacts id is not a barcode (8 to 14 digits).",
        );
    }

    const amount = r.amount_g;
    const servings = r.servings;
    if (amount !== undefined) {
        if (
            typeof amount !== "number" ||
            !Number.isFinite(amount) ||
            amount <= 0 ||
            amount > MAX_FOOD_REF_GRAMS
        ) {
            throw refuse(
                `food_ref amount_g must be above 0 and at most ${MAX_FOOD_REF_GRAMS}.`,
            );
        }
    }
    if (servings !== undefined) {
        if (
            typeof servings !== "number" ||
            !Number.isFinite(servings) ||
            servings <= 0 ||
            servings > MAX_FOOD_REF_SERVINGS
        ) {
            throw refuse(
                `food_ref servings must be above 0 and at most ${MAX_FOOD_REF_SERVINGS}.`,
            );
        }
    }

    if (source === "usda") {
        if (amount === undefined) {
            throw refuse(
                `food_ref usda ${id} needs amount_g, the grams the values are for.`,
                "food_ref usda needs amount_g, the grams the values are for.",
            );
        }
        if (servings !== undefined) {
            throw refuse(
                `food_ref usda ${id} takes amount_g, not servings.`,
                "food_ref usda takes amount_g, not servings.",
            );
        }
        return { source, id, amount_g: amount as number };
    }
    if ((amount === undefined) === (servings === undefined)) {
        throw refuse(
            `food_ref openfoodfacts ${id} needs exactly one of servings or amount_g.`,
            "food_ref openfoodfacts needs exactly one of servings or amount_g.",
        );
    }
    return {
        source: "openfoodfacts",
        id,
        ...(amount !== undefined ? { amount_g: amount as number } : {}),
        ...(servings !== undefined ? { servings: servings as number } : {}),
    };
}

/** A food_ref on a meal that also carries items is refused: the reference
 * belongs on each item, where its grams are. */
export function assertFoodRefPlacement(
    hasItems: boolean,
    hasRef: boolean,
): void {
    if (hasItems && hasRef) {
        throw refuse(
            "food_ref goes on each item when the meal has items; a meal-level food_ref cannot sit beside items.",
        );
    }
}

/** A record from an Open Food Facts FoodResult. The basis comes from the
 * serving label: "100 g" is what normalizeOFFProduct writes when the product
 * has no per-serving figures, and every other label means the values are per
 * serving. Null when there is no usable serving label (the record cannot say
 * what its values are for, so it cannot verify anything). */
export function referenceFromFood(
    food: FoodResult,
    barcode: string,
    fetchedAt: string | null,
): ReferenceRecord | null {
    if (typeof food.serving !== "string") return null;
    return {
        source: "openfoodfacts",
        id: barcode,
        name: food.name,
        data_type: null,
        basis: food.serving === "100 g" ? "per_100g" : "per_serving",
        serving_is_100g: food.serving === "100 g",
        values: {
            calories: food.calories,
            protein_g: food.protein_g,
            carbs_g: food.carbs_g,
            fat_g: food.fat_g,
            saturated_fat_g: food.saturated_fat_g ?? null,
            trans_fat_g: food.trans_fat_g ?? null,
            fiber_g: food.fiber_g,
            sugar_g: food.sugar_g,
            added_sugar_g: food.added_sugar_g ?? null,
            alcohol_g: food.alcohol_g,
        },
        added_sugar_estimated: food.added_sugar_estimated === true,
        fetched_at: fetchedAt,
    };
}

/** A record from a normalized USDA payload. Values are per 100 g. */
export function referenceFromUsda(
    record: UsdaRecord,
    fetchedAt: string | null,
): ReferenceRecord {
    return {
        source: "usda",
        id: String(record.fdc_id),
        name: record.name,
        data_type: record.data_type,
        basis: "per_100g",
        values: { ...record.per100g },
        added_sugar_estimated: false,
        fetched_at: fetchedAt,
    };
}

/** The absolute floor and the relative share a logged value may differ from
 * the record by. max(floor, share × expected), so a large value gets room
 * proportional to its size and a small one keeps the label's rounding. */
export function toleranceFor(key: MealNutrientKey, expected: number): number {
    const floor =
        key === "calories"
            ? TOLERANCE.kcal
            : key === "caffeine_mg"
              ? TOLERANCE.mg
              : TOLERANCE.grams;
    return Math.max(floor, TOLERANCE.relative * Math.abs(expected));
}

/** The factor that turns a record's values into values for the amount the
 * caller declared. Throws food_ref_invalid when the declared basis does not
 * match the record's: a per-100 g record needs amount_g, a per-serving record
 * needs servings. */
export function basisFactor(ref: FoodRef, record: ReferenceRecord): number {
    if (record.basis === "per_100g") {
        if (ref.servings !== undefined) {
            // A "100 g" serving is 100 g, so servings count directly.
            if (record.serving_is_100g) return ref.servings;
            throw refuse(
                `${ref.source} ${ref.id} is stored per 100 g; give amount_g, not servings.`,
                `${ref.source} record is stored per 100 g; servings do not fit it.`,
            );
        }
        if (ref.amount_g === undefined) {
            throw refuse(
                `${ref.source} ${ref.id} is stored per 100 g; give amount_g.`,
                `${ref.source} record is stored per 100 g; amount_g is needed.`,
            );
        }
        return ref.amount_g / 100;
    }
    if (ref.amount_g !== undefined) {
        throw refuse(
            `${ref.source} ${ref.id} is stored per serving; give servings, not amount_g.`,
            `${ref.source} record is stored per serving; amount_g does not fit it.`,
        );
    }
    if (ref.servings === undefined) {
        throw refuse(
            `${ref.source} ${ref.id} is stored per serving; give servings.`,
            `${ref.source} record is stored per serving; servings is needed.`,
        );
    }
    return ref.servings;
}

/**
 * The nutrients a record verifies for the logged values. A key counts only when
 * the logged value is present, the record carries a value for that key, the
 * record's value scaled to the declared amount matches within toleranceFor, and
 * the key is not an estimated added-sugar figure. An absent or null record value
 * verifies nothing: a source that does not report a nutrient cannot be the
 * source of it.
 */
export function verifiedKeys(
    ref: FoodRef,
    record: ReferenceRecord,
    logged: LoggedValues,
): Set<MealNutrientKey> {
    const factor = basisFactor(ref, record);
    const out = new Set<MealNutrientKey>();
    for (const key of PROVENANCE_NUTRIENT_KEYS) {
        const value = logged[key];
        const per = record.values[key];
        if (value == null || per == null) continue;
        if (key === "added_sugar_g" && record.added_sugar_estimated) continue;
        const expected = per * factor;
        if (Math.abs(value - expected) <= toleranceFor(key, expected)) {
            out.add(key);
        }
    }
    return out;
}

/** The source_detail key a record's tags point at. */
export function detailKey(source: RecordSource, id: string): string {
    return `${source}:${id}`;
}

/** The detail entry for one record, names cut to the stored length. */
function detailEntry(ref: FoodRef, record: ReferenceRecord): SourceDetailEntry {
    const entry: SourceDetailEntry = {
        name: record.name.slice(0, MAX_SOURCE_NAME_CHARS),
    };
    if (record.data_type !== null) entry.data_type = record.data_type;
    if (ref.amount_g !== undefined) entry.amount_g = ref.amount_g;
    if (ref.servings !== undefined) entry.servings = ref.servings;
    if (record.fetched_at !== null) entry.fetched_at = record.fetched_at;
    return entry;
}

/** The inputs of one row's provenance: its logged values, the food_ref the
 * caller sent with them (and the record the caller's cache read found for it,
 * or null), and the nutrients the user said they stated. */
export interface ProvenanceInput {
    values: LoggedValues;
    ref?: { ref: FoodRef; record: ReferenceRecord | null };
    userStated?: readonly MealNutrientKey[];
}

/**
 * Labels every nutrient of one row, in precedence order: a verified record,
 * then the user's own figure (user_stated), then estimate. A nutrient with no
 * value gets no entry.
 *
 * Throws food_ref_invalid when a record is present and the declared basis does
 * not match it (verifiedKeys). With no record (a cache miss) nothing verifies
 * and the write still succeeds with estimates.
 */
export function resolveNutrientSources(input: ProvenanceInput): {
    sources: NutrientSources;
    detail: SourceDetail | null;
} {
    const verified =
        input.ref?.record != null
            ? verifiedKeys(input.ref.ref, input.ref.record, input.values)
            : new Set<MealNutrientKey>();
    const stated = new Set<MealNutrientKey>(input.userStated ?? []);
    const sources: NutrientSources = {};
    const detail: SourceDetail = {};
    for (const key of PROVENANCE_NUTRIENT_KEYS) {
        if (input.values[key] == null) continue;
        if (verified.has(key) && input.ref?.record) {
            const { ref, record } = input.ref;
            sources[key] = { s: ref.source, ref: ref.id };
            detail[detailKey(ref.source, ref.id)] = detailEntry(ref, record);
        } else if (stated.has(key)) {
            sources[key] = { s: "user" };
        } else {
            sources[key] = { s: "estimate" };
        }
    }
    return {
        sources,
        detail: Object.keys(detail).length > 0 ? detail : null,
    };
}

/** The detail keys the tags of a source map point at. */
function referencedDetailKeys(sources: NutrientSources): Set<string> {
    const keys = new Set<string>();
    for (const tag of Object.values(sources)) {
        if (!tag || tag.s === "mixed") continue;
        if (tag.s === "usda" || tag.s === "openfoodfacts") {
            if (tag.ref !== undefined) keys.add(detailKey(tag.s, tag.ref));
        }
    }
    return keys;
}

/** A row's source_detail after its amounts are scaled by `factor` (servings, or
 * the grams of an item whose amount changed). Scaling a row's values by the same
 * factor scales the amount each record-backed value was matched for, so the tag
 * still describes the stored values; the record and the name stay. Factor 1
 * returns the detail unchanged. */
export function scaleSourceDetail(
    detail: SourceDetail | null,
    factor: number,
): SourceDetail | null {
    if (!detail || factor === 1) return detail;
    const out: SourceDetail = {};
    for (const [k, entry] of Object.entries(detail)) {
        const scaled: SourceDetailEntry = { ...entry };
        if (entry.amount_g !== undefined)
            scaled.amount_g = round4(entry.amount_g * factor);
        if (entry.servings !== undefined)
            scaled.servings = round4(entry.servings * factor);
        out[k] = scaled;
    }
    return out;
}

const round4 = (v: number): number => Math.round(v * 10000) / 10000;

/** A detail map cut to the entries its tags reference, or null when none. */
function pruneDetail(
    detail: SourceDetail | null,
    sources: NutrientSources,
): SourceDetail | null {
    if (!detail) return null;
    const keep = referencedDetailKeys(sources);
    const out: SourceDetail = {};
    for (const key of keep) {
        if (detail[key]) out[key] = detail[key];
    }
    return Object.keys(out).length > 0 ? out : null;
}

/**
 * The per-nutrient merge an update_meal on a plain meal applies. A nutrient whose
 * value changed takes the fresh tag `changed` provides for it (from
 * resolveNutrientSources over the changed keys) or loses its label when none is
 * given. An unchanged nutrient keeps its stored tag, so a legacy row's untagged
 * nutrient stays untagged. A nutrient now null has no entry.
 *
 * source_detail is per record but the amount is per use: one record id carries
 * one amount. So when the fresh detail sets a record to a different amount than
 * an unchanged tag was checked against, that unchanged tag becomes estimate
 * rather than naming an amount it was never matched for.
 */
export function mergeProvenance(input: {
    oldValues: LoggedValues;
    newValues: LoggedValues;
    oldSources: NutrientSources | null;
    oldDetail: SourceDetail | null;
    changed: { sources: NutrientSources; detail: SourceDetail | null };
}): { sources: NutrientSources; detail: SourceDetail | null } {
    const oldDetail = input.oldDetail ?? {};
    const freshDetail = input.changed.detail ?? {};
    // True when an unchanged record tag's stored amount is replaced by the
    // fresh detail's amount for the same record.
    const amountReplaced = (tag: NutrientTag): boolean => {
        if (tag.s === "mixed" || tag.s === "user" || tag.s === "estimate")
            return false;
        if (tag.ref === undefined) return false;
        const k = detailKey(tag.s, tag.ref);
        const fresh = freshDetail[k];
        if (!fresh) return false;
        const old = oldDetail[k];
        return (
            !old ||
            old.amount_g !== fresh.amount_g ||
            old.servings !== fresh.servings
        );
    };
    const sources: NutrientSources = {};
    for (const key of PROVENANCE_NUTRIENT_KEYS) {
        if (input.newValues[key] == null) continue;
        const changed = (input.oldValues[key] ?? null) !== input.newValues[key];
        if (changed) {
            const tag = input.changed.sources[key];
            if (tag) sources[key] = tag;
        } else {
            const tag = input.oldSources?.[key];
            if (tag)
                sources[key] = amountReplaced(tag) ? { s: "estimate" } : tag;
        }
    }
    const detail = pruneDetail({ ...oldDetail, ...freshDetail }, sources);
    return { sources, detail };
}

/** Whole-percent shares of the weights that sum to exactly 100 (largest
 * remainder), zero shares dropped, largest first. */
function wholeShares(
    weights: Map<NutrientSource, number>,
): { s: NutrientSource; share: number }[] {
    const total = [...weights.values()].reduce((a, b) => a + b, 0);
    const exact = [...weights.entries()].map(([s, w]) => ({
        s,
        raw: total === 0 ? 0 : (w / total) * 100,
    }));
    const floors = exact.map((e) => ({ ...e, share: Math.floor(e.raw) }));
    let left = 100 - floors.reduce((a, e) => a + e.share, 0);
    const byRemainder = [...floors].sort(
        (a, b) => b.raw - Math.floor(b.raw) - (a.raw - Math.floor(a.raw)),
    );
    for (const e of byRemainder) {
        if (left <= 0) break;
        e.share += 1;
        left -= 1;
    }
    return floors
        .filter((e) => e.share > 0)
        .sort((a, b) => b.share - a.share)
        .map(({ s, share }) => ({ s, share }));
}

/**
 * Meal-level labels derived from its items. For each nutrient that any item
 * carries, the items that carry it (values null are skipped) are weighted by
 * their value. A single source and reference across them is that label;
 * otherwise the label is "mixed" with whole-percent parts. A carrying item with
 * no label for the nutrient leaves the meal's total unlabelled, since its
 * share of the total cannot be named.
 */
export function deriveMealProvenance(
    items: {
        values: LoggedValues;
        sources: NutrientSources | null;
        detail?: SourceDetail | null;
    }[],
): { sources: NutrientSources; detail: SourceDetail | null } {
    const sources: NutrientSources = {};
    for (const key of PROVENANCE_NUTRIENT_KEYS) {
        const carriers = items.filter((i) => i.values[key] != null);
        if (carriers.length === 0) continue;
        const tags = carriers.map((i) => i.sources?.[key]);
        if (tags.some((t) => t === undefined || t.s === "mixed")) continue;
        const plain = tags as SourceTag[];
        const first = plain[0]!;
        const sameSource = plain.every((t) => t.s === first.s);
        if (sameSource) {
            // One source. The record is named only when every carrier names
            // the same one; two USDA foods still make a single USDA label.
            const sharedRef = plain.every((t) => t.ref === first.ref)
                ? first.ref
                : undefined;
            sources[key] =
                sharedRef !== undefined
                    ? { s: first.s, ref: sharedRef }
                    : { s: first.s };
            continue;
        }
        const weights = new Map<NutrientSource, number>();
        carriers.forEach((c, idx) => {
            const w = Math.abs(c.values[key] as number);
            const s = plain[idx]!.s;
            weights.set(s, (weights.get(s) ?? 0) + w);
        });
        const totalWeight = [...weights.values()].reduce((a, b) => a + b, 0);
        if (totalWeight === 0) {
            // Every carrier is zero: count them equally.
            weights.clear();
            plain.forEach((t) => weights.set(t.s, (weights.get(t.s) ?? 0) + 1));
        }
        sources[key] = { s: "mixed", parts: wholeShares(weights) };
    }
    // A record's amount belongs to one item's values. When several items name
    // the same record, the meal's total is the sum over them, which no single
    // amount describes, so the amount is dropped; the record still names it.
    const referencing = new Map<string, number>();
    for (const item of items) {
        const keys = new Set<string>();
        for (const tag of Object.values(item.sources ?? {})) {
            if (tag && tag.s !== "mixed" && tag.ref !== undefined)
                keys.add(detailKey(tag.s as RecordSource, tag.ref));
        }
        for (const k of keys) referencing.set(k, (referencing.get(k) ?? 0) + 1);
    }
    const merged: SourceDetail = {};
    for (const item of items) {
        for (const [k, entry] of Object.entries(item.detail ?? {})) {
            if (merged[k]) continue;
            merged[k] =
                (referencing.get(k) ?? 0) > 1 ? withoutAmount(entry) : entry;
        }
    }
    return { sources, detail: pruneDetail(merged, sources) };
}

const isObject = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === "object" && !Array.isArray(v);

/** A detail entry with its amount removed: the record and its metadata stay. */
function withoutAmount(entry: SourceDetailEntry): SourceDetailEntry {
    const { amount_g: _grams, servings: _servings, ...rest } = entry;
    return rest;
}

/** Shape-checks one stored tag, or null. */
function parseTag(raw: unknown): NutrientTag | null {
    if (!isObject(raw)) return null;
    if (raw.s === "mixed") {
        if (!Array.isArray(raw.parts) || raw.parts.length < 1) return null;
        const parts: { s: NutrientSource; share: number }[] = [];
        for (const p of raw.parts) {
            if (!isObject(p)) return null;
            if (!NUTRIENT_SOURCES.includes(p.s as NutrientSource)) return null;
            const share = p.share;
            if (
                typeof share !== "number" ||
                !Number.isInteger(share) ||
                share < 1 ||
                share > 100
            )
                return null;
            parts.push({ s: p.s as NutrientSource, share });
        }
        const total = parts.reduce((a, p) => a + p.share, 0);
        return total === 100 ? { s: "mixed", parts } : null;
    }
    if (!NUTRIENT_SOURCES.includes(raw.s as NutrientSource)) return null;
    const s = raw.s as NutrientSource;
    if (s === "usda" || s === "openfoodfacts") {
        // A record-backed tag may name no record when the item records it
        // came from differ (deriveMealProvenance); its ref is then absent.
        if (raw.ref === undefined) return { s };
        if (typeof raw.ref !== "string" || !/^\d{1,14}$/.test(raw.ref))
            return null;
        return { s, ref: raw.ref };
    }
    if (raw.ref !== undefined) return null;
    return { s };
}

/** A stored nutrient_sources value, shape-checked. Entries that do not parse,
 * or name a nutrient the map does not know, are dropped (an unknown label
 * stays unknown). Null when the value is not an object or nothing survives. */
export function parseNutrientSources(raw: unknown): NutrientSources | null {
    if (!isObject(raw)) return null;
    const out: NutrientSources = {};
    for (const key of PROVENANCE_NUTRIENT_KEYS) {
        if (!(key in raw)) continue;
        const tag = parseTag(raw[key]);
        if (tag) out[key] = tag;
    }
    return Object.keys(out).length > 0 ? out : null;
}

/** A stored source_detail value, shape-checked. Keys must be "usda:<digits>" or
 * "openfoodfacts:<digits>"; bad entries are dropped. Null when nothing
 * survives. */
export function parseSourceDetail(raw: unknown): SourceDetail | null {
    if (!isObject(raw)) return null;
    const out: SourceDetail = {};
    for (const [key, value] of Object.entries(raw)) {
        if (!/^(usda|openfoodfacts):\d{1,14}$/.test(key)) continue;
        if (!isObject(value)) continue;
        if (typeof value.name !== "string" || value.name.length === 0) continue;
        const entry: SourceDetailEntry = {
            name: value.name.slice(0, MAX_SOURCE_NAME_CHARS),
        };
        if (typeof value.data_type === "string" && value.data_type.length <= 40)
            entry.data_type = value.data_type;
        if (isPositive(value.amount_g)) entry.amount_g = value.amount_g;
        if (isPositive(value.servings)) entry.servings = value.servings;
        if (
            typeof value.fetched_at === "string" &&
            value.fetched_at.length <= 40
        )
            entry.fetched_at = value.fetched_at;
        out[key] = entry;
    }
    return Object.keys(out).length > 0 ? out : null;
}

const isPositive = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v) && v > 0;

/** The widget-facing form of one tag, as it appears in _meta. Names come from
 * the row's detail and are cut to META_NAME_CHARS; amounts are never sent. */
export interface SourceMeta {
    s: NutrientSource | "mixed";
    ref?: string;
    name?: string;
    data_type?: string;
    parts?: { s: NutrientSource; share: number }[];
}

/** One row's labels for the widget, keyed by nutrient. */
export type SourcesMeta = Partial<Record<MealNutrientKey, SourceMeta>>;

/** The widget payload under NUTRIENT_SOURCES_META_KEY (src/widgets.ts): `meals`
 * is aligned by position with structuredContent.meals; each slot holds that
 * meal's labels and its items' labels in stored position order (items aligned
 * with the meal-items payload). */
export interface NutrientSourcesMeta {
    v: 1;
    meals: ({
        meal: SourcesMeta | null;
        items: (SourcesMeta | null)[] | null;
    } | null)[];
}

/** Labels for the widget from one row's sources and detail. The alcohol gate
 * applies exactly as it does to the meal-items payload: with tracking off,
 * alcohol_g carries no label. Null when nothing is left to send. */
export function metaFor(
    sources: NutrientSources | null,
    detail: SourceDetail | null,
    alcoholOn: boolean,
): SourcesMeta | null {
    if (!sources) return null;
    const out: SourcesMeta = {};
    for (const key of PROVENANCE_NUTRIENT_KEYS) {
        const tag = sources[key];
        if (!tag) continue;
        if (key === "alcohol_g" && !alcoholOn) continue;
        if (tag.s === "mixed") {
            out[key] = { s: "mixed", parts: tag.parts };
            continue;
        }
        const meta: SourceMeta = { s: tag.s };
        if (tag.ref !== undefined) {
            meta.ref = tag.ref;
            const entry = detail?.[detailKey(tag.s as RecordSource, tag.ref)];
            if (entry) {
                meta.name = entry.name.slice(0, META_NAME_CHARS);
                if (entry.data_type !== undefined)
                    meta.data_type = entry.data_type;
            }
        }
        out[key] = meta;
    }
    return Object.keys(out).length > 0 ? out : null;
}

/**
 * The _meta payload for a tool result. `rowMeals` are the meals behind the
 * tool's breakdown rows, in row order (the same list buildMealItemsMeta takes).
 * `mealSources` maps each meal id to its own labels and detail; `items` maps a
 * meal id to its items, in position order, each carrying its own labels. Returns
 * null when nothing has a label, so the caller omits the key.
 */
export function buildNutrientSourcesMeta(
    rowMeals: readonly { id: string }[],
    mealSources: ReadonlyMap<
        string,
        { sources: NutrientSources | null; detail: SourceDetail | null }
    >,
    items: ReadonlyMap<
        string,
        readonly {
            nutrient_sources?: NutrientSources | null;
            source_detail?: SourceDetail | null;
        }[]
    >,
    alcoholOn: boolean,
): NutrientSourcesMeta | null {
    let any = false;
    const meals = rowMeals.map((row) => {
        const own = mealSources.get(row.id);
        const meal = metaFor(
            own?.sources ?? null,
            own?.detail ?? null,
            alcoholOn,
        );
        const itemList = items.get(row.id);
        const itemMetas = itemList?.length
            ? itemList.map((i) =>
                  metaFor(
                      i.nutrient_sources ?? null,
                      i.source_detail ?? null,
                      alcoholOn,
                  ),
              )
            : null;
        const itemsAny = itemMetas?.some((m) => m !== null) ?? false;
        if (!meal && !itemsAny) return null;
        any = true;
        return { meal, items: itemMetas };
    });
    return any ? { v: 1, meals } : null;
}

const SOURCE_WORDS: Record<NutrientSource, string> = {
    usda: "USDA FoodData Central",
    openfoodfacts: "Open Food Facts",
    user: "your figures",
    estimate: "estimated",
};

const NUTRIENT_WORDS: Record<MealNutrientKey, string> = {
    calories: "calories",
    protein_g: "protein",
    carbs_g: "carbs",
    fat_g: "fat",
    saturated_fat_g: "saturated fat",
    trans_fat_g: "trans fat",
    fiber_g: "fiber",
    sugar_g: "sugar",
    added_sugar_g: "added sugar",
    alcohol_g: "alcohol",
    caffeine_mg: "caffeine",
};

/**
 * The one model-facing line for a write's provenance (`content` only), or null
 * when there is nothing to say. Wording says a value matches the record for the
 * amount given. It does not say the value is verified: the model supplies the
 * grams. An all-estimate row says so only when the caller sent a food_ref (the
 * caller tells us with `refSent`), since without one "estimated" is the default
 * and the line would be noise.
 *
 * Example: "Sources: calories, protein, carbs, fat match USDA FoodData Central
 * 171477 for 150 g; fiber, sugar estimated."
 */
export function formatSourcesLine(
    sources: NutrientSources | null,
    detail: SourceDetail | null,
    opts: { refSent: boolean },
): string | null {
    if (!sources) return null;
    const groups = new Map<string, { label: string; keys: string[] }>();
    for (const key of PROVENANCE_NUTRIENT_KEYS) {
        const tag = sources[key];
        if (!tag) continue;
        const word = NUTRIENT_WORDS[key];
        if (tag.s === "mixed") {
            const label = `a mix (${tag.parts
                .map((p) => `${SOURCE_WORDS[p.s]} ${p.share}%`)
                .join(", ")})`;
            pushGroup(
                groups,
                `mixed:${tag.parts.map((p) => p.s + p.share).join("")}`,
                label,
                word,
            );
            continue;
        }
        if (tag.s === "estimate") {
            pushGroup(groups, "estimate", "estimated", word);
            continue;
        }
        if (tag.s === "user") {
            pushGroup(groups, "user", "from your figures", word);
            continue;
        }
        const entry = tag.ref ? detail?.[detailKey(tag.s, tag.ref)] : undefined;
        const amount =
            entry?.amount_g !== undefined
                ? ` for ${entry.amount_g} g`
                : entry?.servings !== undefined
                  ? ` for ${entry.servings} ${entry.servings === 1 ? "serving" : "servings"}`
                  : "";
        const id = tag.ref
            ? ` ${tag.s === "usda" ? "" : "barcode "}${tag.ref}`
            : "";
        pushGroup(
            groups,
            `${tag.s}:${tag.ref ?? ""}`,
            `match ${SOURCE_WORDS[tag.s]}${id}${amount}`,
            word,
        );
    }
    if (groups.size === 0) return null;
    const onlyEstimates = groups.size === 1 && groups.has("estimate");
    if (onlyEstimates && !opts.refSent) return null;
    if (onlyEstimates) return "Sources: all values estimated.";
    const parts = [...groups.values()].map(
        (g) => `${g.keys.join(", ")} ${g.label}`,
    );
    return `Sources: ${parts.join("; ")}.`;
}

function pushGroup(
    groups: Map<string, { label: string; keys: string[] }>,
    id: string,
    label: string,
    word: string,
): void {
    const group = groups.get(id) ?? { label, keys: [] };
    group.keys.push(word);
    groups.set(id, group);
}

// ---------- Export and import ----------

/** The provenance_version value every row of this server's own export carries.
 * A file whose rows say so wrote its nutrient_sources and source_detail cells
 * itself. Any other file (a foreign app, a hand-made sheet) has no marker, so
 * its provenance is never read. */
export const PROVENANCE_EXPORT_VERSION = "1";

/** True when a row's provenance_version marks it as this server's own export.
 * Accepts the string the CSV carries and the number a JSON caller may send. */
export function isOwnProvenanceExport(version: unknown): boolean {
    return version === PROVENANCE_EXPORT_VERSION || version === 1;
}

/** A JSON cell from an import row: parsed when it is text, passed through when
 * it is already a value, undefined when the text is not JSON. */
export function parseJsonCell(raw: unknown): unknown {
    if (typeof raw !== "string") return raw;
    try {
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
}

/** An import row's provenance, shape-checked but NOT yet verified (see
 * reverifyImported). Null when the row is not from our own export, or its
 * nutrient_sources does not parse to anything. */
export function importedProvenance(row: {
    provenance_version?: unknown;
    nutrient_sources?: unknown;
    source_detail?: unknown;
}): { sources: NutrientSources; detail: SourceDetail | null } | null {
    if (!isOwnProvenanceExport(row.provenance_version)) return null;
    const sources = parseNutrientSources(parseJsonCell(row.nutrient_sources));
    if (!sources) return null;
    return {
        sources,
        detail: parseSourceDetail(parseJsonCell(row.source_detail)),
    };
}

/** Looks up the cached record for one source and id, ignoring TTL, or null. */
export type RecordLookup = (
    source: RecordSource,
    id: string,
) => Promise<ReferenceRecord | null>;

export interface ReverifyResult {
    sources: NutrientSources | null;
    detail: SourceDetail | null;
    /** Record-backed tags that did not re-verify and became estimate. */
    downgraded: number;
}

/** A detail entry for a re-verified record: the record's name and type, with
 * the file's amount and fetch time. */
function refreshedEntry(
    entry: SourceDetailEntry,
    record: ReferenceRecord,
): SourceDetailEntry {
    const out: SourceDetailEntry = {
        name: record.name.slice(0, MAX_SOURCE_NAME_CHARS),
    };
    if (record.data_type !== null) out.data_type = record.data_type;
    if (entry.amount_g !== undefined) out.amount_g = entry.amount_g;
    if (entry.servings !== undefined) out.servings = entry.servings;
    if (entry.fetched_at !== undefined) out.fetched_at = entry.fetched_at;
    return out;
}

/**
 * Re-checks an imported file's record-backed tags. A usda or openfoodfacts tag
 * keeps its source only when the record is still cached and the imported value
 * matches it for the amount source_detail names; every other one becomes
 * estimate. user and estimate tags are kept as they are. A meal-level mixed tag
 * names no record, so it cannot be re-checked: it stays only when no part is
 * record-backed. Values that are null in the row lose their tag. Never throws:
 * a failed lookup is a miss.
 */
export async function reverifyImported(input: {
    sources: NutrientSources;
    detail: SourceDetail | null;
    values: LoggedValues;
    lookup: RecordLookup;
}): Promise<ReverifyResult> {
    const out: NutrientSources = {};
    // The detail of each record that re-verified, rebuilt from the cached
    // record so its name is the record's, not the file's (which may carry an
    // export's formula-defusing apostrophe). The amount and fetch time are the
    // file's: they describe the use, not the record.
    const refreshed = new Map<string, SourceDetailEntry>();
    let downgraded = 0;
    const lookups = new Map<string, Promise<ReferenceRecord | null>>();
    const lookupOnce = (source: RecordSource, id: string) => {
        const k = detailKey(source, id);
        let found = lookups.get(k);
        if (!found) {
            found = input.lookup(source, id).catch(() => null);
            lookups.set(k, found);
        }
        return found;
    };

    for (const key of PROVENANCE_NUTRIENT_KEYS) {
        const tag = input.sources[key];
        if (!tag || input.values[key] == null) continue;
        if (tag.s === "user" || tag.s === "estimate") {
            out[key] = tag;
            continue;
        }
        if (tag.s === "mixed") {
            const recordBacked = tag.parts.some(
                (p) => p.s === "usda" || p.s === "openfoodfacts",
            );
            if (recordBacked) {
                out[key] = { s: "estimate" };
                downgraded++;
            } else {
                out[key] = tag;
            }
            continue;
        }

        const id = tag.ref;
        const entry =
            id !== undefined && input.detail
                ? input.detail[detailKey(tag.s, id)]
                : undefined;
        let record: ReferenceRecord | null = null;
        let verified = false;
        if (id !== undefined && entry) {
            try {
                const ref = parseFoodRef({
                    source: tag.s,
                    id,
                    amount_g: entry.amount_g,
                    servings: entry.servings,
                });
                record = await lookupOnce(tag.s, id);
                verified =
                    record !== null &&
                    verifiedKeys(ref, record, input.values).has(key);
            } catch {
                verified = false;
            }
        }
        if (verified && id !== undefined && entry && record) {
            out[key] = { s: tag.s, ref: id };
            refreshed.set(detailKey(tag.s, id), refreshedEntry(entry, record));
        } else {
            out[key] = { s: "estimate" };
            downgraded++;
        }
    }

    const detail: SourceDetail = Object.fromEntries(refreshed);
    return {
        sources: Object.keys(out).length > 0 ? out : null,
        detail: Object.keys(detail).length > 0 ? detail : null,
        downgraded,
    };
}
