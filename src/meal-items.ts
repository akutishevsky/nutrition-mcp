// Ingredients ("items") of a meal and of a saved meal: validation, summing into
// the meal's nutrient totals, scaling, the item-change rules log_saved_meal
// applies, and the model-facing lines.
//
// Pure on purpose: no Supabase, no Hono, no mcp.ts import, so the tools, the
// store and the listings all share one set of rules and the rules unit-test
// without the mock.module window. Every refusal is a ToolError in the
// "meal_items_invalid" category, except the added-sugar gate, which carries its
// own category (src/added-sugar.ts).
//
// Why the totals are summed here rather than in SQL: a meal with items stores
// the sum of its items in the ordinary nutrient columns, so every existing read
// path (daily totals, trends, the importer's dedupe, the export) keeps working
// unchanged. The items are only the detail behind those numbers.

import { ToolError, toolErrorWithUserText } from "./errors.js";
import { addedSugarError, addedSugarMissingError } from "./added-sugar.js";
import { decodeEscapeSequences } from "./normalize.js";
import {
    scaleSourceDetail,
    type FoodRef,
    type NutrientSources,
    type SourceDetail,
} from "./provenance.js";
import {
    MAX_ALCOHOL_G,
    MAX_CAFFEINE_MG,
    MAX_CALORIES,
    MAX_MACRO_G,
} from "./import.js";

export const MAX_ITEMS_PER_MEAL = 30;
export const MAX_ITEM_NAME_CHARS = 200;
export const MAX_ITEM_UNIT_CHARS = 20;
export const MAX_ITEM_AMOUNT = 100_000;
export const MAX_SAVED_MEALS_PER_USER = 200;
export const MAX_SAVED_MEAL_NAME_CHARS = 100;
export const MAX_SERVINGS = 20;

/** The eleven nutrient columns a meal row carries, in the order every CSV and
 * payload uses. */
export const MEAL_NUTRIENT_KEYS = [
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
] as const;

export type MealNutrientKey = (typeof MEAL_NUTRIENT_KEYS)[number];
/** The nutrient values of a meal, an item or a total. The two fat keys are
 * optional in the type so that a row or literal written before they existed
 * still type-checks; every value this module builds sets them. */
export type NutrientValues = Record<
    Exclude<MealNutrientKey, "saturated_fat_g" | "trans_fat_g">,
    number | null
> &
    Partial<Record<"saturated_fat_g" | "trans_fat_g", number | null>>;

/** One ingredient as the caller sends it. Nutrient fields are optional here so
 * the handler, not the schema, names the item that lacks one. */
export interface MealItemInput {
    name: string;
    amount?: number;
    unit?: string;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    saturated_fat_g?: number;
    trans_fat_g?: number;
    fiber_g?: number;
    sugar_g?: number;
    added_sugar_g?: number;
    alcohol_g?: number;
    caffeine_mg?: number;
    /** The USDA or Open Food Facts record the item's values were read from,
     * and the amount they are for. Verified against the stored record by
     * src/provenance.ts, which labels each nutrient; never trusted as a label. */
    food_ref?: FoodRef;
    /** Nutrients whose values the user gave themselves (read off a label, or
     * corrected). Labelled "user" unless a verified record matches them. */
    user_stated?: MealNutrientKey[];
}

/** A validated item: position is 1-based, name decoded and trimmed, and the
 * four required nutrients present. */
export interface MealItemValues extends NutrientValues {
    position: number;
    name: string;
    amount: number | null;
    unit: string | null;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    /** Per-nutrient labels (src/provenance.ts), set once the item's food_ref
     * has been looked up. Absent on items from before provenance existed. */
    nutrient_sources?: NutrientSources | null;
    source_detail?: SourceDetail | null;
}

const REQUIRED_ITEM_KEYS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
] as const satisfies readonly MealNutrientKey[];

/** Keys every item carries or none does (all-or-none). Saturated fat is here,
 * not optional: a total that counted only some items would read as a real,
 * too-low figure. */
const ALL_OR_NONE_ITEM_KEYS = [
    "saturated_fat_g",
    "fiber_g",
    "sugar_g",
    "added_sugar_g",
] as const satisfies readonly MealNutrientKey[];

/** Optional keys summed over the items that carry them. Trans fat is here: it
 * is sparse in the sources (mostly absent from fresh foods), and a missing
 * value is not a zero. */
const OPTIONAL_ITEM_KEYS = [
    "trans_fat_g",
    "alcohol_g",
    "caffeine_mg",
] as const satisfies readonly MealNutrientKey[];

// Per-item ceilings, the same bounds log_meal applies to a whole meal, so an
// item can never be larger than a meal the tool would accept.
const ITEM_NUTRIENT_MAX: Record<MealNutrientKey, number> = {
    calories: MAX_CALORIES,
    protein_g: MAX_MACRO_G,
    carbs_g: MAX_MACRO_G,
    fat_g: MAX_MACRO_G,
    saturated_fat_g: MAX_MACRO_G,
    trans_fat_g: MAX_MACRO_G,
    fiber_g: MAX_MACRO_G,
    sugar_g: MAX_MACRO_G,
    added_sugar_g: MAX_MACRO_G,
    alcohol_g: MAX_ALCOHOL_G,
    caffeine_mg: MAX_CAFFEINE_MG,
};

const CATEGORY = "meal_items_invalid" as const;

function invalid(message: string): ToolError {
    return new ToolError(message, { category: CATEGORY });
}

/** How a refusal names an item: position plus name, or position alone. */
type Labeler = (position: number, name?: string) => string;

/** A refusal that names items. The caller's message labels them with their
 * names; the runtime-log text (ToolError.logText) labels them by position
 * only, so no item name reaches the log. */
function invalidNaming(render: (label: Labeler) => string): ToolError {
    return toolErrorWithUserText(
        render(itemLabel),
        render((position) => `item ${position}`),
        CATEGORY,
    );
}

function codePoints(s: string): number {
    return Array.from(s).length;
}

/** Round to two decimals, so sums of decimal grams carry no float noise. */
function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

/** A scaled amount: at most four decimals, but never 0 for a positive amount
 * (meal_items and saved_meal_items require amount > 0, and a pinch of saffron
 * at 0.004 g is a real amount). Factor 1 leaves the amount as it was. */
function scaleAmount(amount: number, factor: number): number {
    if (factor === 1) return amount;
    const exact = amount * factor;
    const rounded = Math.round(exact * 10_000) / 10_000;
    return rounded > 0 ? rounded : exact;
}

/** Sum the non-null values of one key; null when none carries it. */
function sumKey(items: NutrientValues[], key: MealNutrientKey): number | null {
    const values = items
        .map((i) => i[key])
        .filter((v): v is number => v !== null && v !== undefined);
    if (values.length === 0) return null;
    return round2(values.reduce((a, b) => a + b, 0));
}

function sumNutrients(items: NutrientValues[]): NutrientValues {
    const out = {} as NutrientValues;
    for (const key of MEAL_NUTRIENT_KEYS) out[key] = sumKey(items, key);
    return out;
}

/** How an item is named in a refusal: its position and decoded name. */
function itemLabel(position: number, name: string | undefined): string {
    return name ? `item ${position} ("${name}")` : `item ${position}`;
}

/** The decoded, trimmed name, or "" when it is blank or not text. */
function cleanName(raw: unknown): string {
    return typeof raw === "string" ? decodeEscapeSequences(raw).trim() : "";
}

/** A name reference as the stored names are kept: escape sequences decoded
 * (clients sometimes send literal \uXXXX), then trimmed. Item references
 * (findItem) and saved-meal name lookups both compare on this form. */
export function normalizeNameRef(raw: string): string {
    return cleanName(raw);
}

/** What each nutrient total of a meal may come to: the bounds log_meal's own
 * schema applies, so a meal built from items can never be larger than a meal
 * the tool would accept. */
const MEAL_TOTAL_MAX = ITEM_NUTRIENT_MAX;

/**
 * Refuse a meal whose summed (or scaled) totals exceed what a single meal can
 * hold: calories above MAX_CALORIES, a gram nutrient above MAX_MACRO_G,
 * alcohol_g above MAX_ALCOHOL_G or caffeine_mg above MAX_CAFFEINE_MG. These
 * are typo guards (an amount in the wrong unit, a servings slip), and checking
 * before the write also keeps calories inside the integer column. Throws a
 * meal_items_invalid ToolError naming the figure; the message carries numbers
 * only, no item text.
 */
export function assertMealTotals(totals: NutrientValues): void {
    for (const key of MEAL_NUTRIENT_KEYS) {
        const v = totals[key];
        if (v === null || v === undefined) continue;
        const max = MEAL_TOTAL_MAX[key];
        if (!Number.isFinite(v) || v > max) {
            throw invalid(
                `This meal comes to ${key} ${v}, above the most a single meal can hold (${max}). Check the items' amounts and units.`,
            );
        }
    }
}

/**
 * Validate an items list and sum it into the meal totals.
 *
 * Refuses (ToolError, meal_items_invalid): a count outside 1..MAX_ITEMS_PER_MEAL,
 * a missing required nutrient, a value outside its range, an amount that is not
 * positive, a partially given saturated-fat/fiber/sugar/added-sugar key, an item
 * whose added sugar exceeds its sugar, and, with the added-sugar gate on, an item with
 * sugar_g but no added_sugar_g (addedSugarMissingError, its own category).
 *
 * `opts.addedSugarRequired` is the gate state at the call (addedSugarRequiredNow
 * in src/mcp.ts). The totals returned are rounded to two decimals; calories are
 * not rounded to a whole number here, insertMeal does that.
 */
export function validateItems(
    items: MealItemInput[],
    opts: { addedSugarRequired: boolean },
): { items: MealItemValues[]; totals: NutrientValues } {
    if (items.length < 1 || items.length > MAX_ITEMS_PER_MEAL) {
        throw invalid(
            `An items list holds between 1 and ${MAX_ITEMS_PER_MEAL} items; this one has ${items.length}.`,
        );
    }

    const names = items.map((item, i) => cleanName(item.name));
    // Refusals naming item i: the name for the caller, the position alone for
    // the runtime log (invalidNaming).
    const refuseAt = (i: number, rest: (label: string) => string) =>
        invalidNaming((l) => rest(l(i + 1, names[i])));

    names.forEach((name, i) => {
        const chars = codePoints(name);
        if (chars < 1 || chars > MAX_ITEM_NAME_CHARS) {
            throw refuseAt(
                i,
                (label) =>
                    `${label} needs a name of 1 to ${MAX_ITEM_NAME_CHARS} characters.`,
            );
        }
    });

    items.forEach((item, i) => {
        if (item.amount === undefined) return;
        const a = item.amount;
        if (!Number.isFinite(a) || a <= 0 || a > MAX_ITEM_AMOUNT) {
            throw refuseAt(
                i,
                (label) =>
                    `${label} has amount ${a}; an amount must be above 0 and at most ${MAX_ITEM_AMOUNT}.`,
            );
        }
    });

    // Required nutrients: every item carries all four.
    items.forEach((item, i) => {
        const lacks = REQUIRED_ITEM_KEYS.filter((k) => item[k] === undefined);
        if (lacks.length > 0) {
            throw refuseAt(
                i,
                (label) =>
                    `${label} needs calories, protein_g, carbs_g and fat_g on every item; it has no ${lacks.join(", ")}.`,
            );
        }
    });

    // Every nutrient value is a finite number inside its range, optional or not.
    const allKeys = [
        ...REQUIRED_ITEM_KEYS,
        ...ALL_OR_NONE_ITEM_KEYS,
        ...OPTIONAL_ITEM_KEYS,
    ];
    items.forEach((item, i) => {
        for (const key of allKeys) {
            const v = item[key];
            if (v === undefined) continue;
            if (!Number.isFinite(v) || v < 0 || v > ITEM_NUTRIENT_MAX[key]) {
                throw refuseAt(
                    i,
                    (label) =>
                        `${label} has ${key} ${v}; it must be between 0 and ${ITEM_NUTRIENT_MAX[key]}.`,
                );
            }
        }
    });

    // Saturated fat, fiber, sugar and added sugar: all items or none.
    for (const key of ALL_OR_NONE_ITEM_KEYS) {
        const withKey = items.flatMap((item, i) =>
            item[key] === undefined ? [] : [i],
        );
        if (withKey.length === 0 || withKey.length === items.length) continue;
        const without = items
            .map((_, i) => i)
            .filter((i) => !withKey.includes(i));
        throw invalidNaming(
            (l) =>
                `${key} is given for some items but not for ${without.map((i) => l(i + 1, names[i])).join(", ")}. Send ${key} on every item or on none.`,
        );
    }

    // Per item: added sugar cannot exceed sugar, and the gate.
    items.forEach((item, i) => {
        if (item.sugar_g !== undefined && item.added_sugar_g !== undefined) {
            const err = addedSugarError(item.added_sugar_g, item.sugar_g);
            if (err) throw refuseAt(i, (label) => `${label}: ${err}`);
        }
        if (
            opts.addedSugarRequired &&
            item.sugar_g !== undefined &&
            item.added_sugar_g === undefined
        ) {
            throw addedSugarMissingError();
        }
    });

    const validated: MealItemValues[] = items.map((item, i) => {
        const unit = cleanName(item.unit);
        const unitChars = codePoints(unit);
        return {
            position: i + 1,
            name: names[i]!,
            amount: item.amount ?? null,
            unit:
                unitChars >= 1 && unitChars <= MAX_ITEM_UNIT_CHARS
                    ? unit
                    : null,
            calories: item.calories!,
            protein_g: item.protein_g!,
            carbs_g: item.carbs_g!,
            fat_g: item.fat_g!,
            saturated_fat_g: item.saturated_fat_g ?? null,
            trans_fat_g: item.trans_fat_g ?? null,
            fiber_g: item.fiber_g ?? null,
            sugar_g: item.sugar_g ?? null,
            added_sugar_g: item.added_sugar_g ?? null,
            alcohol_g: item.alcohol_g ?? null,
            caffeine_mg: item.caffeine_mg ?? null,
        };
    });

    const totals = sumItems(validated);
    assertMealTotals(totals);
    return { items: validated, totals };
}

/** The nutrient totals of validated items: the sum the meal row stores. */
export function sumItems(items: MealItemValues[]): NutrientValues {
    return sumNutrients(items);
}

/** The totals keys a call sent alongside items. `!== undefined` so an explicit
 * null still counts as sent. */
export function totalsSentWithItems(
    args: Partial<Record<MealNutrientKey, unknown>>,
): MealNutrientKey[] {
    return MEAL_NUTRIENT_KEYS.filter((k) => args[k] !== undefined);
}

/** The refusal for totals sent beside items. */
export function totalsWithItemsError(keys: MealNutrientKey[]): ToolError {
    return invalid(
        `Send either items or the meal totals (${keys.join(", ")}), not both: with items the totals are the sum of the items.`,
    );
}

/** Round each non-null value of a nutrient set by a factor. Factor 1 returns
 * the values as they were. */
function scaleNutrients<T extends NutrientValues>(t: T, factor: number): T {
    const out = { ...t };
    if (factor === 1) return out;
    for (const key of MEAL_NUTRIENT_KEYS) {
        const v = t[key];
        out[key] = v == null ? null : round2(v * factor);
    }
    return out;
}

/** One item with its nutrients scaled by `factor` and its amount set to
 * `amount`. Each nutrient's label stays (scaling keeps a value matched to its
 * record), and the record's amount is scaled with the values
 * (scaleSourceDetail), so the label still describes what the values are for. */
function scaledItem(
    item: MealItemValues,
    factor: number,
    amount: number | null,
): MealItemValues {
    const n = scaleNutrients(item, factor);
    return {
        ...n,
        position: item.position,
        name: item.name,
        unit: item.unit,
        amount,
        calories: n.calories,
        protein_g: n.protein_g,
        carbs_g: n.carbs_g,
        fat_g: n.fat_g,
        ...(item.source_detail !== undefined
            ? { source_detail: scaleSourceDetail(item.source_detail, factor) }
            : {}),
    };
}

/** Scale a set of items by a factor: amounts and every nutrient. Amounts keep
 * up to four decimals and never become 0 (scaleAmount); factor 1 returns the
 * items unchanged. */
export function scaleItems(
    items: MealItemValues[],
    factor: number,
): MealItemValues[] {
    return items.map((item) =>
        scaledItem(
            item,
            factor,
            item.amount === null ? null : scaleAmount(item.amount, factor),
        ),
    );
}

/** Scale a totals set by a factor. */
export function scaleTotals(t: NutrientValues, factor: number): NutrientValues {
    return scaleNutrients(t, factor);
}

function itemsList(items: MealItemValues[]): string {
    return items.map((i) => `${i.position}. ${i.name}`).join("\n");
}

/**
 * Resolve an item reference: a position number, or an exact name compared
 * case-insensitively. Throws when nothing matches or more than one item does,
 * listing the items so the caller can pick one by position.
 */
export function findItem(items: MealItemValues[], ref: string): MealItemValues {
    const q = normalizeNameRef(ref);
    const byPosition = /^\d+$/.test(q);
    const matches = byPosition
        ? items.filter((i) => i.position === Number(q))
        : items.filter((i) => i.name.toLowerCase() === q.toLowerCase());
    if (matches.length === 1) return matches[0]!;
    const listing = `Items:\n${itemsList(items)}`;
    if (matches.length === 0) {
        throw toolErrorWithUserText(
            `No item matches "${q}". ${listing}`,
            `No item matches the reference (${items.length} items).`,
            CATEGORY,
        );
    }
    throw toolErrorWithUserText(
        `"${q}" matches ${matches.length} items; give the position number instead. ${listing}`,
        `The reference matches ${matches.length} items.`,
        CATEGORY,
    );
}

/**
 * Apply a log_saved_meal item change to a saved meal's items:
 *
 * - `leave_out` removes items; it cannot name every item.
 * - `item_amounts` sets a new amount on an item that has one, scaling that
 *   item's nutrients by new/old. An item with no amount can only be left out.
 *
 * References resolve against the saved list, so positions stay stable within
 * one call. Positions are renumbered 1..n afterwards.
 */
export function applyItemChanges(
    items: MealItemValues[],
    changes: {
        item_amounts?: { item: string; amount: number }[];
        leave_out?: string[];
    },
): MealItemValues[] {
    const leaveOut = new Set<number>();
    for (const ref of changes.leave_out ?? []) {
        leaveOut.add(findItem(items, ref).position);
    }
    if (leaveOut.size >= items.length) {
        throw invalid(
            "leave_out names every item, which would leave the meal with nothing in it. Leave at least one item in.",
        );
    }

    const changed = new Map<number, number>();
    for (const change of changes.item_amounts ?? []) {
        const target = findItem(items, change.item);
        if (changed.has(target.position)) {
            throw invalidNaming(
                (l) =>
                    `${l(target.position, target.name)} is listed more than once in item_amounts.`,
            );
        }
        if (leaveOut.has(target.position)) {
            throw invalidNaming(
                (l) =>
                    `${l(target.position, target.name)} is both left out and given an amount.`,
            );
        }
        if (target.amount === null) {
            throw invalidNaming(
                (l) =>
                    `${l(target.position, target.name)} has no amount to change. Leave it out, or scale the whole meal with servings.`,
            );
        }
        const a = change.amount;
        if (!Number.isFinite(a) || a <= 0 || a > MAX_ITEM_AMOUNT) {
            throw invalidNaming(
                (l) =>
                    `${l(target.position, target.name)} has amount ${a}; an amount must be above 0 and at most ${MAX_ITEM_AMOUNT}.`,
            );
        }
        changed.set(target.position, a);
    }

    const kept: MealItemValues[] = [];
    for (const item of items) {
        if (leaveOut.has(item.position)) continue;
        const newAmount = changed.get(item.position);
        if (newAmount === undefined) {
            kept.push({ ...item });
            continue;
        }
        const factor = newAmount / item.amount!;
        const scaled = scaledItem(item, factor, newAmount);
        assertScaledItem(scaled, item);
        kept.push(scaled);
    }
    return kept.map((item, i) => ({ ...item, position: i + 1 }));
}

/** Refuse an item whose new amount takes a nutrient past what a single meal
 * can hold, naming the unit the amount is counted in: the usual cause is an
 * amount given in another unit (150 meant as grams on an item saved as 1 pcs). */
function assertScaledItem(scaled: MealItemValues, saved: MealItemValues): void {
    for (const key of MEAL_NUTRIENT_KEYS) {
        const v = scaled[key];
        if (v == null) continue;
        const max = ITEM_NUTRIENT_MAX[key];
        if (Number.isFinite(v) && v <= max) continue;
        // The unit is user text too, so the log line leaves it out with the
        // name.
        const render = (label: string, unit: string) =>
            `${label} at ${scaled.amount}${unit} comes to ${key} ${v}, above the most a single meal can hold (${max}). Its amount counts in the unit it was saved with (${saved.amount}${unit}); check the amount and unit.`;
        throw toolErrorWithUserText(
            render(
                itemLabel(saved.position, saved.name),
                saved.unit ? ` ${saved.unit}` : "",
            ),
            render(`item ${saved.position}`, ""),
            CATEGORY,
        );
    }
}

/**
 * The sugar figure of a meal or an item, compact form. Added sugar is part of
 * total sugar, so it rides on the sugar figure as a bracket ("sugar 18 g (12
 * added)") and the two never read as separate amounts to add up. With no
 * total, the added figure alone ("added sugar 12 g"); null when neither is
 * recorded. Shared by the meal listing (src/meal-listing.ts) and item lines.
 */
export function compactSugarFigure(
    sugar: number | null | undefined,
    added: number | null | undefined,
): string | null {
    if (sugar != null) {
        return added != null
            ? `sugar ${sugar} g (${added} added)`
            : `sugar ${sugar} g`;
    }
    return added != null ? `added sugar ${added} g` : null;
}

/**
 * One item as a line: position, name, amount and unit, then the figures. The
 * alcohol figure is printed in grams, and only when `alcohol` is true, the same
 * opt-in every listing applies.
 */
export function formatItemLine(item: MealItemValues, alcohol: boolean): string {
    const amount =
        item.amount !== null
            ? ` — ${item.amount}${item.unit ? ` ${item.unit}` : ""}`
            : "";
    const macros = [
        `${item.calories} kcal`,
        `P ${item.protein_g} g`,
        `C ${item.carbs_g} g`,
        `F ${item.fat_g} g`,
    ];
    const extras = [
        item.saturated_fat_g !== null
            ? `saturated fat ${item.saturated_fat_g} g`
            : null,
        item.trans_fat_g !== null ? `trans fat ${item.trans_fat_g} g` : null,
        item.fiber_g !== null ? `fiber ${item.fiber_g} g` : null,
        compactSugarFigure(item.sugar_g, item.added_sugar_g),
        alcohol && item.alcohol_g !== null
            ? `alcohol ${item.alcohol_g} g`
            : null,
        item.caffeine_mg !== null
            ? `caffeine ${Math.round(item.caffeine_mg)} mg`
            : null,
    ].filter((x): x is string => x !== null);
    return `${item.position}. ${item.name}${amount} — ${[...macros, ...extras].join(" · ")}`;
}

/** The "Items:" block a meal or saved meal carries in its text. "" when none. */
export function formatItemsBlock(
    items: MealItemValues[],
    alcohol: boolean,
): string {
    if (items.length === 0) return "";
    const lines = items.map((i) => `  ${formatItemLine(i, alcohol)}`);
    return ["Items:", ...lines].join("\n");
}

/**
 * A saved meal's name: decoded and trimmed, 1 to MAX_SAVED_MEAL_NAME_CHARS
 * characters. Throws a ToolError otherwise.
 */
export function validateSavedMealName(raw: string): string {
    const name = cleanName(raw);
    const chars = codePoints(name);
    if (chars < 1 || chars > MAX_SAVED_MEAL_NAME_CHARS) {
        throw new ToolError(
            `A saved meal name is 1 to ${MAX_SAVED_MEAL_NAME_CHARS} characters, after trimming spaces.`,
            { category: CATEGORY },
        );
    }
    return name;
}

/**
 * One ingredient as the widgets receive it, in the result's `_meta` under
 * MEAL_ITEMS_META_KEY (src/widgets.ts). Rounded like the breakdown row it sits
 * under (mealBreakdown in src/mcp.ts): kcal whole, grams and mg to a tenth.
 * `null` is a value the item does not carry, never a 0.
 */
export interface MealItemMeta extends NutrientValues {
    name: string;
    amount: number | null;
    unit: string | null;
}

/**
 * The widgets' ingredient payload: `meals` is a plain array aligned by position
 * with the tool's structuredContent.meals (same order, same length), each slot
 * that meal's items in stored position order, or null when it has none. An
 * array rather than an id-keyed object because the rows carry no id and the
 * widget joins by position.
 */
export interface MealItemsMeta {
    v: 1;
    meals: (MealItemMeta[] | null)[];
}

const tenth = (n: number | null): number | null =>
    n == null ? null : Math.round(n * 10) / 10;

/**
 * Build MealItemsMeta for `rowMeals` — exactly the meals behind the tool's
 * breakdown rows, in row order — from getMealItems' map. Returns null when no
 * row has items, so the caller omits the key and a result for a user without
 * ingredients is byte-identical to one from before items existed. Alcohol is
 * gated like the rows: with tracking off every item's `alcohol_g` is null,
 * whatever was stored (the opt-in exists for users in recovery).
 */
export function buildMealItemsMeta(
    rowMeals: readonly { id: string }[],
    items: ReadonlyMap<string, readonly MealItemValues[]>,
    alcoholOn: boolean,
): MealItemsMeta | null {
    let any = false;
    const meals = rowMeals.map((m) => {
        const list = items.get(m.id);
        if (!list || list.length === 0) return null;
        any = true;
        return list.map((i): MealItemMeta => ({
            name: i.name,
            amount: i.amount,
            unit: i.unit,
            calories: i.calories == null ? null : Math.round(i.calories),
            protein_g: tenth(i.protein_g),
            carbs_g: tenth(i.carbs_g),
            fat_g: tenth(i.fat_g),
            saturated_fat_g: tenth(i.saturated_fat_g ?? null),
            trans_fat_g: tenth(i.trans_fat_g ?? null),
            fiber_g: tenth(i.fiber_g),
            sugar_g: tenth(i.sugar_g),
            added_sugar_g: tenth(i.added_sugar_g),
            alcohol_g: alcoholOn ? tenth(i.alcohol_g) : null,
            caffeine_mg: tenth(i.caffeine_mg),
        }));
    });
    return any ? { v: 1, meals } : null;
}
