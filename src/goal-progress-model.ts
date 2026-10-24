// The goal-progress widget's model: which goals are over, near, still to go or
// on track, and the facts its rows and its "rest of today" card show. Inlined
// into public/widgets/src/templates/goal-progress.html with the `@inlinets`
// marker (src/widgets.ts), so the widget runs this tested code rather than a
// hand-copied twin. That marker only works for a module with NO imports (type
// imports included) and turns every top-level name into a global of the
// widget's script, so everything here is self-contained and prefixed `gp`.
//
// Pure data in, pure data out: no DOM, no strings, no number formatting (the
// template does those, in the user's language). Every food it can name comes
// from the day's own items or the user's logged history (GOAL_DAY_META_KEY's
// `foods`), never from a list of its own.

export type GpKey =
    | "calories"
    | "protein"
    | "carbs"
    | "fat"
    | "fiber"
    | "sugar"
    | "added_sugar"
    | "saturated"
    | "trans"
    | "sodium"
    | "caffeine"
    | "alcohol"
    | "water";

/** budget: calories (over is flagged, under is what is left). target: a
 * floor — protein, carbs, fat, fiber and water, as the server's own text
 * treats them ("to go" until reached). limit: a ceiling, 0 included. none:
 * shown for reference only (trans fat has no goal). */
export type GpKind = "budget" | "target" | "limit" | "none";
export type GpStatus = "over" | "near" | "togo" | "ok" | "nr" | "none";
export type GpUnit = "kcal" | "g" | "mg" | "ml";

export interface GpMetric {
    key: GpKey;
    unit: GpUnit;
    kind: GpKind;
    emoji: string;
}

/** Display order, which is also the order within every status group. */
export const GP_METRICS: readonly GpMetric[] = [
    { key: "calories", unit: "kcal", kind: "budget", emoji: "🔥" },
    { key: "protein", unit: "g", kind: "target", emoji: "🥩" },
    { key: "carbs", unit: "g", kind: "target", emoji: "🍞" },
    { key: "fat", unit: "g", kind: "target", emoji: "🥑" },
    { key: "fiber", unit: "g", kind: "target", emoji: "🌾" },
    { key: "sugar", unit: "g", kind: "limit", emoji: "🍬" },
    { key: "added_sugar", unit: "g", kind: "limit", emoji: "🍭" },
    { key: "saturated", unit: "g", kind: "limit", emoji: "🧈" },
    { key: "trans", unit: "g", kind: "none", emoji: "🍟" },
    { key: "sodium", unit: "mg", kind: "limit", emoji: "🧂" },
    { key: "caffeine", unit: "mg", kind: "limit", emoji: "☕" },
    { key: "alcohol", unit: "g", kind: "limit", emoji: "🍷" },
    { key: "water", unit: "ml", kind: "target", emoji: "💧" },
];

/** Nutrients that most meals simply do not have: a meal without one is left
 * out of the breakdown and counted ("N other meals had none"), not listed as
 * "not recorded". */
export const GP_OPTIONAL: readonly GpKey[] = ["caffeine", "alcohol"];

export type GpValues = Partial<Record<GpKey, number | null>>;

export interface GpItem {
    name: string;
    amount: number | null;
    unit: string | null;
    v: GpValues;
    /** Source kind per nutrient ("usda", "openfoodfacts", "user",
     * "estimate", "mixed"), when the sources `_meta` named one. */
    src: Partial<Record<GpKey, string>>;
}

export interface GpMeal {
    name: string;
    type: string | null;
    time: string | null;
    /** null: logged as a total only. */
    items: GpItem[] | null;
    /** null: not recorded for this meal. */
    v: GpValues;
}

export interface GpFood {
    name: string;
    amount: number | null;
    unit: string | null;
    v: GpValues;
}

export interface GpWater {
    time: string | null;
    ml: number;
}

export interface GpDay {
    today: boolean;
    alcoholOn: boolean;
    goals: GpValues;
    /** A day total; null = not recorded that day, absent = no figure at all. */
    totals: GpValues;
    meals: GpMeal[];
    water: GpWater[] | null;
    /** Meals or water logged that day. */
    hasLog: boolean;
    /** The user's own logged foods (today only), or null. */
    foods: GpFood[] | null;
}

export interface GpRow extends GpMetric {
    t: number | null;
    g: number | null;
    st: GpStatus;
}

/** The tolerance a total is compared with, per unit: within it a target
 * counts as reached and a limit as not crossed. */
export function gpEps(unit: GpUnit): number {
    return unit === "g" ? 0.05 : unit === "ml" ? 5 : 0.5;
}

function gpActive(kind: GpKind, g: number | null | undefined): g is number {
    if (g == null || !Number.isFinite(g)) return false;
    return kind === "limit" ? g >= 0 : g > 0;
}

/** A goal's status for a recorded total. Near is the last 5% of the calorie
 * budget and the last 10% of a limit (a limit of 0 has no "near"). */
export function gpStatus(
    kind: GpKind,
    unit: GpUnit,
    t: number,
    g: number,
): GpStatus {
    const eps = gpEps(unit);
    if (kind === "target") return t >= g - eps ? "ok" : "togo";
    if (t > g + eps) return "over";
    const frac = kind === "budget" ? 0.05 : 0.1;
    return g > 0 && g - t < frac * g ? "near" : "ok";
}

/**
 * One row per metric the view shows: every goal that is set (scored, or "nr"
 * when the day has no total for it), plus trans fat for reference when the day
 * recorded some. Alcohol only with tracking on (an untracked day's alcohol is
 * never shown); caffeine only once something carried a figure.
 */
export function gpRows(day: GpDay): GpRow[] {
    const rows: GpRow[] = [];
    const noMeals = day.meals.length === 0;
    for (const m of GP_METRICS) {
        if (m.key === "alcohol" && !day.alcoholOn) continue;
        let t = day.totals[m.key];
        if (t !== null && (t === undefined || !Number.isFinite(t)))
            t = undefined;
        // A day with no meals has no meal nutrient at all: 0, not "not
        // recorded" (water is its own total).
        if (noMeals && m.key !== "water") t = 0;
        if (m.key === "alcohol" && t == null) t = 0;
        if (m.key === "caffeine" && t == null) continue;
        if (m.kind === "none") {
            if (t != null && t > 0) {
                rows.push({ ...m, t, g: null, st: "none" });
            }
            continue;
        }
        const g = day.goals[m.key];
        if (!gpActive(m.kind, g)) continue;
        if (t === undefined) continue;
        if (t === null) {
            rows.push({ ...m, t: null, g, st: "nr" });
            continue;
        }
        rows.push({ ...m, t, g, st: gpStatus(m.kind, m.unit, t, g) });
    }
    return rows;
}

export interface GpGroups {
    over: GpRow[];
    near: GpRow[];
    togo: GpRow[];
    ok: GpRow[];
    nr: GpRow[];
    /** Goals with a total to compare (everything but nr). */
    scored: GpRow[];
    /** Trans fat, for reference, or null. */
    trans: GpRow | null;
}

export function gpGroups(rows: readonly GpRow[]): GpGroups {
    const by = (st: GpStatus) => rows.filter((r) => r.st === st);
    return {
        over: by("over"),
        near: by("near"),
        togo: by("togo"),
        ok: by("ok"),
        nr: by("nr"),
        scored: rows.filter((r) => r.st !== "nr" && r.st !== "none"),
        trans: rows.find((r) => r.st === "none") ?? null,
    };
}

/** How the "rest of today" card states one goal: calories left or over, a
 * target still to go, a limit crossed, or how much of a limit is used. A
 * limit is never stated as an allowance ("12 g left"): that reads as
 * permission, which is why the server's text says "under" instead. */
export type GpCellKind = "calLeft" | "calOver" | "toGo" | "over" | "pct";

export interface GpCell {
    row: GpRow;
    kind: GpCellKind;
}

export function gpRestCells(rows: readonly GpRow[], max: number): GpCell[] {
    const g = gpGroups(rows);
    const out: GpCell[] = [];
    const push = (row: GpRow | undefined, kind: GpCellKind) => {
        if (row && !out.some((c) => c.row === row)) out.push({ row, kind });
    };
    const cal = g.scored.find((r) => r.key === "calories");
    if (cal) push(cal, cal.st === "over" ? "calOver" : "calLeft");
    g.togo.forEach((r) => push(r, "toGo"));
    g.over.forEach((r) => push(r, "over"));
    g.near.forEach((r) => push(r, "pct"));
    g.ok
        .filter((r) => r.kind === "limit" && (r.g ?? 0) > 0)
        .sort((a, b) => b.t! / b.g! - a.t! / a.g!)
        .forEach((r) => {
            if (out.length < 4) push(r, "pct");
        });
    return out.slice(0, max);
}

/** The smallest amount a logged food must carry to be named for a target. */
export const GP_FOOD_MIN: Partial<Record<GpKey, number>> = {
    protein: 10,
    fiber: 2,
    carbs: 10,
    fat: 5,
};

/** Whether a food's figures stay inside every limit that is over or near:
 * at most 2% of a crossed limit, and at most what is left of a near one (or
 * 1% of it). A figure the food did not record does not rule it out. */
export function gpFits(food: GpFood, rows: readonly GpRow[]): boolean {
    return rows
        .filter((r) => (r.st === "over" || r.st === "near") && r.g != null)
        .every((r) => {
            const v = food.v[r.key];
            if (v == null) return true;
            const room = Math.max(r.g! - (r.t ?? 0), 0);
            const allowed =
                r.st === "over" ? r.g! * 0.02 : Math.max(room, r.g! * 0.01);
            return v <= allowed;
        });
}

/** Up to `n` of the user's own logged foods richest in `row`'s nutrient (per
 * kcal) that also fit every crossed or near limit. Empty when there is no
 * history: then no food is named at all. */
export function gpFoodsFor(
    row: GpRow,
    rows: readonly GpRow[],
    foods: readonly GpFood[] | null,
    n: number,
): GpFood[] {
    const min = GP_FOOD_MIN[row.key];
    if (!foods || min == null) return [];
    const dense = (f: GpFood) =>
        (f.v[row.key] ?? 0) / ((f.v.calories ?? 0) + 40);
    return foods
        .filter((f) => (f.v[row.key] ?? 0) >= min && gpFits(f, rows))
        .sort((a, b) => dense(b) - dense(a))
        .slice(0, n);
}

export type GpHint =
    | { kind: "over"; cal: GpRow; water: GpRow | null }
    | { kind: "food"; row: GpRow; food: GpFood }
    | { kind: "toGo"; rows: GpRow[] }
    | { kind: "water"; row: GpRow }
    | { kind: "limits"; over: GpRow[]; near: GpRow[] }
    | { kind: "all" };

/** The card's one-line fact, today only: calories over the budget; else a
 * logged food rich in a target still to go (protein first, then fiber, carbs,
 * fat); else what is still to go; else the water left; else the limits that
 * are crossed or close; else that everything is on track. */
export function gpHint(rows: readonly GpRow[], day: GpDay): GpHint | null {
    if (!day.today || !day.hasLog) return null;
    const g = gpGroups(rows);
    const water = g.togo.find((r) => r.key === "water") ?? null;
    const cal = g.over.find((r) => r.key === "calories");
    if (cal) return { kind: "over", cal, water };
    const foodRows = (["protein", "fiber", "carbs", "fat"] as GpKey[])
        .map((k) => g.togo.find((r) => r.key === k))
        .filter((r): r is GpRow => !!r);
    for (const row of foodRows) {
        const food = gpFoodsFor(row, rows, day.foods, 1)[0];
        if (food) return { kind: "food", row, food };
    }
    if (foodRows.length) return { kind: "toGo", rows: foodRows };
    if (water) return { kind: "water", row: water };
    const over = g.over;
    const near = g.near;
    if (over.length || near.length) return { kind: "limits", over, near };
    return { kind: "all" };
}

export interface GpSource {
    name: string;
    amount: number | null;
    unit: string | null;
    v: number;
}

/** The largest single source of `row`'s nutrient: an ingredient when its meal
 * lists them, else the meal itself. Null when nothing carried a positive
 * figure. Ties go to the earlier one. */
export function gpBiggest(
    row: GpRow,
    meals: readonly GpMeal[],
): GpSource | null {
    let best: GpSource | null = null;
    const offer = (
        name: string,
        amount: number | null,
        unit: string | null,
        v: number | null | undefined,
    ) => {
        if (v == null || !(v > 0)) return;
        if (!best || v > best.v) best = { name, amount, unit, v };
    };
    for (const m of meals) {
        if (m.items && m.items.length) {
            for (const it of m.items) {
                offer(it.name, it.amount, it.unit, it.v[row.key]);
            }
        } else {
            offer(m.name, null, null, m.v[row.key]);
        }
    }
    return best;
}

export interface GpShare {
    /** Index into day.meals. */
    i: number;
    v: number | null;
    /** Whole-percent share of the shown total, or null for no value. */
    share: number | null;
}

export interface GpBreakdown {
    rows: GpShare[];
    /** Optional nutrients: meals left out for having none. */
    none: number;
    /** Meals listed as "not recorded". */
    missing: number;
}

/** Where a goal's total came from, largest first. A meal that did not record
 * the nutrient is listed last as "not recorded", so a partial total reads as
 * partial; for caffeine and alcohol a meal without any is left out and
 * counted instead. */
export function gpBreakdown(row: GpRow, meals: readonly GpMeal[]): GpBreakdown {
    const list = meals.map((m, i) => {
        const v = m.v[row.key];
        return { i, v: v == null || !Number.isFinite(v) ? null : v };
    });
    let shown = list;
    let none = 0;
    if (GP_OPTIONAL.includes(row.key)) {
        shown = list.filter((x) => x.v != null && x.v > 0);
        none = list.length - shown.length;
    }
    shown = [...shown].sort((a, b) => (b.v ?? -1) - (a.v ?? -1) || a.i - b.i);
    const total = shown.reduce((s, x) => s + (x.v ?? 0), 0);
    return {
        rows: shown.map((x) => ({
            i: x.i,
            v: x.v,
            share:
                x.v == null || row.st === "nr" || total <= 0
                    ? null
                    : Math.round((x.v / total) * 100),
        })),
        none,
        missing: shown.filter((x) => x.v == null).length,
    };
}

/** A meal's ingredients for `key`, largest first; for caffeine and alcohol
 * only the ones that carry some. */
export function gpItemsFor(key: GpKey, items: readonly GpItem[]): GpItem[] {
    const opt = GP_OPTIONAL.includes(key);
    return items
        .filter((it) => !opt || (it.v[key] ?? 0) > 0)
        .map((it, k) => ({ it, k }))
        .sort((a, b) => (b.it.v[key] ?? -1) - (a.it.v[key] ?? -1) || a.k - b.k)
        .map((x) => x.it);
}

// ---- GOAL_DAY_META_KEY, validated ----------------------------------------
// It arrives from the host, so it is untrusted: every field is rebuilt from
// the shape src/goal-day.ts writes, anything else dropped. A payload that is
// not an object with v === 1 is null, and the widget then renders without
// meal times, water entries or logged foods.

export interface GpDayMeal {
    time: string | null;
    missing: string[];
}

export interface GpDayMeta {
    now: string | null;
    meals: GpDayMeal[];
    water: GpWater[];
    /** null: not sent (past day, failed read) — no food is ever named. */
    foods: GpFood[] | null;
}

const GP_CLOCK_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const GP_ROW_FIELDS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
];
/** GoalDayFood's fields, by the key the model reads them under. */
const GP_FOOD_FIELDS: [GpKey, string][] = [
    ["calories", "calories"],
    ["protein", "protein_g"],
    ["carbs", "carbs_g"],
    ["fat", "fat_g"],
    ["fiber", "fiber_g"],
    ["sugar", "sugar_g"],
    ["added_sugar", "added_sugar_g"],
    ["saturated", "saturated_fat_g"],
    ["sodium", "sodium_mg"],
    ["caffeine", "caffeine_mg"],
];
/** Caps matching src/goal-day.ts: the server never sends more. */
const GP_FOODS_CAP = 32;
const GP_WATER_CAP = 60;
const GP_NAME_CHARS = 60;

function gpClock(v: unknown): string | null {
    return typeof v === "string" && GP_CLOCK_RE.test(v) ? v : null;
}

function gpNum(v: unknown): number | null {
    return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
}

export function gpDayMetaOf(raw: unknown): GpDayMeta | null {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const r = raw as Record<string, unknown>;
    if (r.v !== 1) return null;
    const meals: GpDayMeal[] = Array.isArray(r.meals)
        ? r.meals.map((m) => {
              const o =
                  m && typeof m === "object"
                      ? (m as Record<string, unknown>)
                      : {};
              return {
                  time: gpClock(o.time),
                  missing: Array.isArray(o.missing)
                      ? o.missing.filter(
                            (k): k is string =>
                                typeof k === "string" &&
                                GP_ROW_FIELDS.includes(k),
                        )
                      : [],
              };
          })
        : [];
    const water: GpWater[] = [];
    if (Array.isArray(r.water)) {
        for (const w of r.water) {
            if (water.length >= GP_WATER_CAP) break;
            if (!w || typeof w !== "object") continue;
            const o = w as Record<string, unknown>;
            const ml = gpNum(o.ml);
            if (ml == null || ml <= 0) continue;
            water.push({ time: gpClock(o.time), ml });
        }
    }
    let foods: GpFood[] | null = null;
    if (Array.isArray(r.foods)) {
        foods = [];
        for (const f of r.foods) {
            if (foods.length >= GP_FOODS_CAP) break;
            if (!f || typeof f !== "object") continue;
            const o = f as Record<string, unknown>;
            if (typeof o.name !== "string") continue;
            const name = o.name.trim();
            if (!name || name.length > GP_NAME_CHARS) continue;
            const v: GpValues = {};
            for (const [key, field] of GP_FOOD_FIELDS) v[key] = gpNum(o[field]);
            if (v.calories == null) continue;
            foods.push({
                name,
                amount: gpNum(o.amount),
                unit:
                    typeof o.unit === "string" && o.unit.length <= 16
                        ? o.unit
                        : null,
                v,
            });
        }
    }
    return { now: gpClock(r.now), meals, water, foods };
}
