import { dayCarries } from "./insights.js";
import type { Meal } from "./supabase.js";
import { ToolError, type ToolErrorCategory } from "./errors.js";

/**
 * Added sugar: the shared rules every write path and every widget payload use.
 * Pure — no Supabase, no Hono, never imports mcp.ts — so the importer, the
 * tools and the widget harness all build from the same code.
 *
 * Definition (the US label one): sugars added during processing or
 * preparation. Part of total sugar (`sugar_g`) and never more than it. NULL is
 * "not recorded", never zero (see PartialNutrient in insights.ts).
 */

/**
 * The added ≤ total rule, as caller-facing text, or null when the pair is
 * consistent. Either side may be null/undefined (not recorded) — the rule only
 * binds when both are known. Never clamp: a mismatch is a real error the
 * caller has to resolve.
 */
export function addedSugarError(
    added: number | null | undefined,
    total: number | null | undefined,
): string | null {
    if (added == null || total == null) return null;
    if (added <= total) return null;
    // One decimal reads best, but 10.04 over 10 would then print as "10 g is
    // more than 10 g" — so widen the precision until the two figures differ.
    let places = 1;
    while (places < 6 && fmt(added, places) === fmt(total, places)) places++;
    return `added_sugar_g (${fmt(added, places)} g) is more than sugar_g (${fmt(total, places)} g); added sugars are part of total sugars.`;
}

/**
 * The "sugar_g needs added_sugar_g" rule for log_meal and update_meal.
 *
 * Gated by ADDED_SUGAR_REQUIRED_FROM, an ISO-8601 instant: unset, empty or
 * unparseable means off, and once the clock passes it the rule is on. The
 * gate exists because hosts cache tools/list for days (see "Server wiring" in
 * CLAUDE.md): a client still holding a list from before added_sugar_g existed
 * cannot send the field at all, so enforcing the rule before those lists have
 * expired would refuse every sugared meal those users log, and each refusal is
 * an isError result counted against the directory listing's health badge. Set
 * the instant comfortably after the deploy that advertised the field.
 *
 * bulk_import_meals and the import widget never apply it: third-party exports
 * rarely carry an added-sugar column.
 */
export const ADDED_SUGAR_REQUIRED_FROM_ENV = "ADDED_SUGAR_REQUIRED_FROM";

/** tool_analytics.error_category of the refusal. */
export const ADDED_SUGAR_MISSING_CATEGORY: ToolErrorCategory =
    "added_sugar_missing";

// A date, or a date and time WITH an offset: an offset-less time would be read
// in the host's zone, which is not something a deploy setting should depend on.
const ISO_INSTANT =
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-](\d{2}):(\d{2})))?$/;

/** The gate's instant in epoch ms, null when unset or empty, "invalid" when
 * set to something that is not an ISO-8601 date or offset date-time. */
export function parseAddedSugarRequiredFrom(
    raw: string | undefined,
): number | null | "invalid" {
    const value = raw?.trim() ?? "";
    if (value === "") return null;
    const m = ISO_INSTANT.exec(value);
    if (!m) return "invalid";
    // Every field is range-checked here rather than left to Date.parse, which
    // (in Bun/JSC) rolls an impossible date forward instead of failing:
    // 2026-02-30 parses as 2026-03-02 and T24:00 as the next midnight, so a
    // mistyped rollout date would switch the rule on silently on another day.
    const [y, mo, d, h, mi, s, oh, om] = m
        .slice(1)
        .map((g) => (g === undefined ? 0 : Number(g)));
    const daysInMonth = new Date(Date.UTC(y!, mo!, 0)).getUTCDate();
    if (mo! < 1 || mo! > 12 || d! < 1 || d! > daysInMonth) return "invalid";
    if (h! > 23 || mi! > 59 || s! > 59 || oh! > 23 || om! > 59) {
        return "invalid";
    }
    const ms = Date.parse(value);
    return Number.isNaN(ms) ? "invalid" : ms;
}

/** Whether the rule is on at `nowMs` for the raw env value. */
export function addedSugarRequiredAt(
    raw: string | undefined,
    nowMs: number,
): boolean {
    const from = parseAddedSugarRequiredFrom(raw);
    return typeof from === "number" && nowMs >= from;
}

/**
 * Whether a write would leave the meal with total sugar but no added sugar:
 * sugar_g passed (0 included), added_sugar_g not passed, and nothing already
 * stored for it. `storedAdded` is the meal's current added_sugar_g for an
 * update, undefined for a new meal.
 */
export function addedSugarMissing(
    fields: { sugar_g?: number; added_sugar_g?: number },
    storedAdded?: number | null,
): boolean {
    return (
        fields.sugar_g !== undefined &&
        fields.added_sugar_g === undefined &&
        storedAdded == null
    );
}

const ADDED_SUGAR_DEFINITION =
    "It is the part of sugar_g added during processing or preparation: 0 for whole fruit, vegetables, plain milk, plain yogurt, meat, fish, eggs, rice and 100% fruit juice; all of a soft drink's sugar (cola 10.6 g per 100 g).";

/** The refusal's caller-facing text. Describes, never directs (directory
 * policy): what was not saved, the rule, and what the field holds. */
export function addedSugarMissingText(mealId?: string): string {
    return mealId === undefined
        ? `Not saved: added_sugar_g is required whenever sugar_g is given. ${ADDED_SUGAR_DEFINITION}`
        : `Not saved, meal ${mealId} is unchanged: added_sugar_g is required whenever sugar_g is given and the meal has no added sugar recorded. ${ADDED_SUGAR_DEFINITION}`;
}

/** The refusal as a ToolError carrying its own analytics category. */
export function addedSugarMissingError(mealId?: string): ToolError {
    return new ToolError(addedSugarMissingText(mealId), {
        category: ADDED_SUGAR_MISSING_CATEGORY,
    });
}

function fmt(n: number, places: number): string {
    const f = 10 ** places;
    return String(Math.round(n * f) / f);
}

/** A day's added-sugar total, or null when no meal that day carries a value
 * (the dayCarries rule — such a day is "not recorded", not 0). */
export function dayAddedSugar(meals: Meal[]): number | null {
    if (!dayCarries(meals, "added_sugar_g")) return null;
    return meals.reduce((s, m) => s + (m.added_sugar_g ?? 0), 0);
}

/**
 * One meal's added sugar as every per-meal figure reports it: grams rounded to
 * one decimal, exactly as mealBreakdown (mcp.ts) rounds every other gram field
 * on a breakdown row, or null when not recorded. The widget lists a meal only
 * when this is > 0, so the per-meal values (`meals`), the `extra` ranking and
 * the `contributors` count all go through it — a 0.04 g meal reads 0.0, is
 * never listed, and must never be counted either, or the summary's "N more"
 * (contributors − shown) overcounts. Day totals (dayAddedSugar) sum the raw
 * values instead: rounding each meal first would drift a day's figure.
 */
export function roundedAddedSugar(m: Meal): number | null {
    return m.added_sugar_g == null
        ? null
        : Math.round(m.added_sugar_g * 10) / 10;
}

/**
 * The widget payload under ADDED_SUGAR_META_KEY (src/widgets.ts), v1. Every
 * field but `v` and `goal` is optional to the widget, which falls back to
 * today's strip (no added-sugar cell) when the whole key is missing.
 */
export interface AddedSugarMeta {
    v: 1;
    /** nutrition_goals.daily_added_sugar_g; 0 is a real ceiling. */
    goal: number | null;
    /** Per-day totals keyed by local YYYY-MM-DD; null = not recorded that day. */
    days?: Record<string, number | null>;
    /** Per-meal values for the breakdown rows, keyed by meal id: grams to one
     * decimal (roundedAddedSugar), null when not recorded. */
    meals?: Record<string, number | null>;
    /** Meals in the window whose rounded added sugar is above 0 (the
     * summary's "N more"), the same rule the listed rows pass. */
    contributors?: number;
    /**
     * get_nutrition_summary only: the window's top meals by added sugar that
     * are NOT among the rows `meals` describes, ranked (most first). The
     * summary's rows are the frozen-schema union of the other metrics' top N
     * (topMealBreakdown in mcp.ts), and added sugar deliberately ranks no rows
     * of its own there, so without these a 30 g sweetened drink that tops no
     * other metric would be missing from the added-sugar list while
     * `contributors` still counted it. Widget-only, never in structuredContent;
     * the widget lists these in the added-sugar cell alone, beside the kept
     * rows that carry a value. At most MEAL_BREAKDOWN_TOP_N rows. Optional and
     * additive, so `v` stays 1: older widgets ignore it. Single-day tools never
     * send it, since their rows are every meal of the day.
     */
    extra?: AddedSugarExtraRow[];
}

/** One `extra` row: the same description / meal_type / date mealBreakdown
 * gives a structuredContent row, plus the meal's added sugar. */
export interface AddedSugarExtraRow {
    description: string;
    meal_type: string | null;
    date: string | null;
    /** Grams, one decimal, always > 0. */
    added_sugar_g: number;
}

/**
 * The `extra` rows: rank every meal by added sugar (rounded to one decimal
 * like every gram field, > 0 only, descending, ties to the earlier meal — the
 * stable rule topMealBreakdown uses), take the top `topN`, and keep those
 * whose index is not in `kept`, in ranked order. `rows[i]` is meal i's
 * breakdown row (mealBreakdown's output, so the formatting is shared, not
 * repeated here); `meals` and `rows` are the same list in the same order.
 */
export function addedSugarExtra(
    meals: readonly Meal[],
    rows: readonly {
        description: string;
        meal_type: string | null;
        date: string | null;
    }[],
    kept: readonly number[],
    topN: number,
): AddedSugarExtraRow[] {
    const isKept = new Set(kept);
    return meals
        .map((m, i) => ({ i, v: roundedAddedSugar(m) ?? 0 }))
        .filter((r) => r.v > 0)
        .sort((a, b) => b.v - a.v || a.i - b.i)
        .slice(0, topN)
        .filter((r) => !isKept.has(r.i))
        .map(({ i, v }) => ({
            description: rows[i]!.description,
            meal_type: rows[i]!.meal_type,
            date: rows[i]!.date,
            added_sugar_g: v,
        }));
}

export function buildAddedSugarMeta(input: {
    goal: number | null | undefined;
    /** Meals grouped by local date. */
    days?: Record<string, Meal[]>;
    /** The meals whose rows the widget shows. */
    meals?: Meal[];
    /** Every meal in the window, to count contributors over. */
    contributorsOf?: Meal[];
    /** addedSugarExtra's rows (get_nutrition_summary only). */
    extra?: AddedSugarExtraRow[];
}): AddedSugarMeta {
    const meta: AddedSugarMeta = { v: 1, goal: input.goal ?? null };
    if (input.days) {
        meta.days = {};
        for (const [date, meals] of Object.entries(input.days)) {
            meta.days[date] = dayAddedSugar(meals);
        }
    }
    if (input.meals) {
        meta.meals = {};
        for (const m of input.meals) meta.meals[m.id] = roundedAddedSugar(m);
    }
    if (input.contributorsOf) {
        meta.contributors = input.contributorsOf.filter(
            (m) => (roundedAddedSugar(m) ?? 0) > 0,
        ).length;
    }
    if (input.extra) meta.extra = input.extra;
    return meta;
}
