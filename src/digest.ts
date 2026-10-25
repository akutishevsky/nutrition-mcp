// The nutrition digest behind get_digest and its widget (digest.html): one
// period — yesterday, today so far, the last 7 or the last 30 days — with the
// previous period beside it, goal statuses, trends, the nutrient table, water
// and weight, the day's meals or the period's logging habits, a few
// highlights, and (today only) what remains of the day's goals.
//
// Pure: no Supabase, no Hono, never imports mcp.ts. The handler reads one
// 61-day window of meals, water and weigh-ins and hands it here with the
// goals, the profile's units and the clock, so every rule below is unit-tested
// against fixtures (src/digest.test.ts).
//
// Translation-safe by construction. The widget assembles every visible string
// from WIDGET_STRINGS (the `digest` namespace in src/copy/widgets.ts), so this
// module sends codes, keys and numbers, never English sentences. The one
// English text it builds is `digestText`, the model-facing content.
//
// Descriptive only. Highlights and "the rest of today" state facts drawn from
// the user's own log — a food is named only when the user has logged it
// before — and never suggest what to do. No goal is ever invented: without a
// goal a metric carries no status, and without any goals the digest carries
// no verdict and no score.

import type { DrinkUnit } from "./alcohol.js";
import type { MealItemValues } from "./meal-items.js";
import type {
    Meal,
    NutritionGoals,
    WaterEntry,
    WeightEntry,
} from "./supabase.js";
import { localClock } from "./meal-times.js";
import { dateInTz, shiftLocalDate } from "./tz.js";
import { daysBetween } from "./weight-trend.js";
import { fromGrams, type WeightUnit } from "./units.js";

export const DIGEST_PERIODS = [
    "yesterday",
    "today",
    "last_7_days",
    "last_30_days",
] as const;
export type DigestPeriod = (typeof DIGEST_PERIODS)[number];

/** How far back the handler reads: the 30-day period plus the 30 days before
 * it, plus today. Also the horizon of the calorie streak and of the "logged
 * before" food lookups. */
export const DIGEST_HISTORY_DAYS = 60;

/** Meals listed per day in the range view's day popover, and per day in the
 * day view; items listed per meal. Caps, so a pathological day cannot make
 * the payload disproportionate to the request. */
export const DIGEST_MEALS_PER_DAY = 40;
export const DIGEST_ITEMS_PER_MEAL = 30;
/** Characters kept of a meal or item name in the payload. */
export const DIGEST_NAME_MAX = 200;

export const DIGEST_METRICS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "added_sugar_g",
    "saturated_fat_g",
    "trans_fat_g",
    "sodium_mg",
    "caffeine_mg",
    "alcohol_g",
    "water_ml",
] as const;
export type DigestMetric = (typeof DIGEST_METRICS)[number];

/** What a goal on a metric means. Calories is a budget (on target within 90 %
 * to 100 % of it); protein, carbs, fat, fiber and water are targets to reach,
 * as set_nutrition_goals describes them; the rest are limits to stay under.
 * Trans fat has no goal at all. */
export type DigestKind = "budget" | "target" | "limit" | "none";
const KIND: Record<DigestMetric, DigestKind> = {
    calories: "budget",
    protein_g: "target",
    carbs_g: "target",
    fat_g: "target",
    fiber_g: "target",
    sugar_g: "limit",
    added_sugar_g: "limit",
    saturated_fat_g: "limit",
    trans_fat_g: "none",
    sodium_mg: "limit",
    caffeine_mg: "limit",
    alcohol_g: "limit",
    water_ml: "target",
};

type Unit = "kcal" | "g" | "mg" | "ml";
const UNIT: Record<DigestMetric, Unit> = {
    calories: "kcal",
    protein_g: "g",
    carbs_g: "g",
    fat_g: "g",
    fiber_g: "g",
    sugar_g: "g",
    added_sugar_g: "g",
    saturated_fat_g: "g",
    trans_fat_g: "g",
    sodium_mg: "mg",
    caffeine_mg: "mg",
    alcohol_g: "g",
    water_ml: "ml",
};

/** Nutrients whose NULL means "not recorded" (dayCarries in insights.ts): a
 * day carries one only when some meal has a value for it. Calories, protein,
 * carbs and fat have always summed a missing value as zero. */
const PARTIAL = new Set<DigestMetric>([
    "fiber_g",
    "sugar_g",
    "added_sugar_g",
    "saturated_fat_g",
    "trans_fat_g",
    "sodium_mg",
    "caffeine_mg",
    "alcohol_g",
]);

const GOAL_COLUMN: Partial<Record<DigestMetric, keyof NutritionGoals>> = {
    calories: "daily_calories",
    protein_g: "daily_protein_g",
    carbs_g: "daily_carbs_g",
    fat_g: "daily_fat_g",
    fiber_g: "daily_fiber_g",
    sugar_g: "daily_sugar_g",
    added_sugar_g: "daily_added_sugar_g",
    saturated_fat_g: "daily_saturated_fat_g",
    sodium_mg: "daily_sodium_mg",
    caffeine_mg: "daily_caffeine_mg",
    alcohol_g: "daily_alcohol_g",
    water_ml: "daily_water_ml",
};

const EPS: Record<Unit, number> = { kcal: 0.5, g: 0.05, mg: 0.5, ml: 5 };

/** A metric's status for one value against its goal. `nr` = not recorded,
 * `none` = no goal set. */
export type DigestStatus = "over" | "near" | "togo" | "ok" | "nr" | "none";

export interface DigestInput {
    period: DigestPeriod;
    now: Date;
    tz: string;
    /** Every meal from DIGEST_HISTORY_DAYS before today through today. */
    meals: readonly Meal[];
    water: readonly WaterEntry[];
    weights: readonly WeightEntry[];
    /** The newest weigh-in overall, for "last 79.4 kg on 14 Aug" when the
     * window holds none. */
    latestWeight: WeightEntry | null;
    /** Ingredients of the reported day's meals, by meal id. */
    items: ReadonlyMap<string, readonly MealItemValues[]>;
    goals: NutritionGoals | null;
    /** The drink unit, or null when alcohol tracking is off — then alcohol
     * appears nowhere in the digest. */
    alcohol: DrinkUnit | null;
    weightUnit: WeightUnit;
    locale: string;
}

// ---------- small helpers ----------

const r0 = (n: number) => Math.round(n);
const r1 = (n: number) => Math.round(n * 10) / 10;
function rv(key: DigestMetric, n: number): number {
    const u = UNIT[key];
    return u === "kcal" || u === "ml" ? r0(n) : r1(n);
}
const rvn = (key: DigestMetric, n: number | null) =>
    n == null ? null : rv(key, n);

function mean(a: readonly (number | null)[]): number | null {
    const v = a.filter((x): x is number => x != null);
    return v.length ? v.reduce((p, q) => p + q, 0) / v.length : null;
}
const count = (a: readonly (number | null)[]) =>
    a.filter((x) => x != null).length;

function slope(a: readonly (number | null)[]): number {
    const pts = a
        .map((y, x) => [x, y] as const)
        .filter((p): p is readonly [number, number] => p[1] != null);
    if (pts.length < 3) return 0;
    const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    let nu = 0;
    let de = 0;
    for (const [x, y] of pts) {
        nu += (x - mx) * (y - my);
        de += (x - mx) * (x - mx);
    }
    return de ? nu / de : 0;
}

const clip = (s: string, max = DIGEST_NAME_MAX) =>
    s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
const nameKey = (s: string) => s.trim().toLowerCase();

function metricValue(m: Meal, key: DigestMetric): number | null {
    if (key === "water_ml") return null;
    const v = (m as unknown as Record<string, number | null | undefined>)[key];
    if (PARTIAL.has(key)) return v ?? null;
    return v ?? 0;
}

function goalOf(
    goals: NutritionGoals | null,
    key: DigestMetric,
): number | null {
    const col = GOAL_COLUMN[key];
    if (!goals || !col) return null;
    const g = goals[col] as number | null | undefined;
    if (g == null || !Number.isFinite(g)) return null;
    // A floor of 0 says nothing; a ceiling of 0 is a real limit ("none").
    if (KIND[key] === "limit") return g >= 0 ? g : null;
    return g > 0 ? g : null;
}

export function digestStatus(
    key: DigestMetric,
    t: number | null,
    g: number | null,
): DigestStatus {
    if (t == null) return "nr";
    if (g == null || KIND[key] === "none") return "none";
    const eps = EPS[UNIT[key]];
    if (key === "calories") {
        if (t > g + eps) return "over";
        return t >= 0.9 * g ? "ok" : "togo";
    }
    if (KIND[key] === "target") return t >= g - eps ? "ok" : "togo";
    if (t > g + eps) return "over";
    return g - t < 0.1 * g ? "near" : "ok";
}

/** Whether one day's value meets the goal: calories in the 90–100 % zone, a
 * target reached, a limit not passed. */
export function digestMet(key: DigestMetric, t: number, g: number): boolean {
    const eps = EPS[UNIT[key]];
    if (key === "calories") return t >= 0.9 * g && t <= g + eps;
    if (KIND[key] === "target") return t >= g - eps;
    return t <= g + eps;
}

// ---------- days ----------

interface DayVals {
    date: string;
    meals: Meal[];
    logged: boolean;
    v: Record<DigestMetric, number | null>;
}

function dayVals(
    date: string,
    meals: Meal[],
    water: readonly WaterEntry[],
): DayVals {
    const v = {} as Record<DigestMetric, number | null>;
    for (const key of DIGEST_METRICS) {
        if (key === "water_ml") {
            v[key] = water.length
                ? water.reduce((s, w) => s + w.amount_ml, 0)
                : null;
            continue;
        }
        if (!meals.length) {
            v[key] = null;
            continue;
        }
        const vals = meals.map((m) => metricValue(m, key));
        v[key] = vals.every((x) => x == null)
            ? null
            : vals.reduce<number>((s, x) => s + (x ?? 0), 0);
    }
    return { date, meals, logged: meals.length > 0, v };
}

interface Agg {
    t: number | null;
    rec: number;
    met: number;
    over: number;
}

function aggregate(
    list: readonly DayVals[],
    key: DigestMetric,
    g: number | null,
): Agg {
    const rec = list.filter(
        (d) => (key === "water_ml" || d.logged) && d.v[key] != null,
    );
    const vals = rec.map((d) => d.v[key]!);
    const t = vals.length
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : null;
    if (g == null || KIND[key] === "none")
        return { t, rec: rec.length, met: 0, over: 0 };
    const eps = EPS[UNIT[key]];
    return {
        t,
        rec: rec.length,
        met: vals.filter((x) => digestMet(key, x, g)).length,
        over: vals.filter((x) => x > g + eps).length,
    };
}

// ---------- payload types ----------

export interface DigestMetricRow {
    key: DigestMetric;
    /** The metric's kind when a goal is set, "none" otherwise. */
    kind: DigestKind;
    /** Day total, or the per-day average over the days that record it. */
    value: number | null;
    goal: number | null;
    status: DigestStatus;
    recorded_days: number;
    met_days: number;
    over_days: number;
}

export type DigestVerdictPart =
    | {
          c:
              | "cal_over"
              | "cal_on_track"
              | "cal_on_target"
              | "cal_just_under"
              | "cal_under"
              | "cal_mostly_on_target"
              | "cal_over_most"
              | "cal_under_most"
              | "cal_some";
      }
    | { c: "over" | "short"; keys: DigestMetric[] }
    | { c: "all_met" | "no_miss" }
    | { c: "trend"; key: DigestMetric | "weight"; dir: "rising" | "falling" }
    | { c: "logged"; n: number; of: number }
    | { c: "miss"; key: DigestMetric; kind: "target" | "limit" };

export type DigestTrendDir = "rising" | "falling" | "no_clear" | "steady";

export interface DigestTrendCard {
    key: DigestMetric | "weight";
    dir: DigestTrendDir;
    /** good / bad against the goal's direction; neutral without a goal or a
     * move, and always neutral on sparse logs. */
    tone: "good" | "bad" | "neutral";
    /** Current and comparison means: the last 7 days vs the 7 before them in
     * the day view, the period vs the previous one in the range view. */
    a: number;
    b: number;
    /** The reported day's own value (day view), or null. */
    day_value: number | null;
    /** Daily values, oldest first: 14 days in the day view, the period in the
     * range view. Null = nothing logged that day. */
    series: (number | null)[];
    /** The previous period, aligned with `series` (range view only). */
    ghost: (number | null)[] | null;
    goal: number | null;
}

export interface DigestTrends {
    cards: DigestTrendCard[];
    also: { key: DigestMetric | "weight"; dir: "rising" | "falling" }[];
    mixed: (DigestMetric | "weight")[];
    steady: (DigestMetric | "weight")[];
    few: (DigestMetric | "weight")[];
}

export interface DigestMealItem {
    name: string;
    amount: number | null;
    unit: string | null;
    calories: number | null;
}

export interface DigestMeal {
    time: string;
    meal_type: string | null;
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    /** Null when the meal was logged as a total, without ingredients. */
    items: DigestMealItem[] | null;
}

export interface DigestDay {
    date: string;
    logged: boolean;
    meal_count: number;
    calories: number | null;
    /** Calorie status for the bar: on target, under, over, nothing logged, or
     * none when there is no calorie goal. */
    status: "on" | "under" | "over" | "nr" | "none";
    water_ml: number | null;
    meals: { time: string; name: string; calories: number }[];
}

export interface DigestBestDay {
    date: string;
    met: number;
    of: number;
    calories: number;
    over: DigestMetric[];
    short: DigestMetric[];
}

export type DigestHighlight =
    | {
          code: "sugar_source";
          name: string;
          count: number;
          grams: number;
          share: number;
      }
    | { code: "streak"; days: number }
    | { code: "gaps"; days: number }
    | {
          code: "over_source";
          key: DigestMetric;
          days: number | null;
          name: string;
          /** Per occurrence, when every occurrence carried the same value;
           * null when they differ (estimates vary), and `total` then is the
           * only true figure. */
          each: number | null;
          total: number;
          count: number;
      }
    | {
          code: "short_source";
          key: DigestMetric;
          days: number | null;
          name: string;
          amount: number;
          calories: number;
      }
    | { code: "all_met" };

export interface DigestWeightPoint {
    value: number;
    date: string;
}

export interface DigestMeta {
    v: 1;
    period: DigestPeriod;
    mode: "day" | "range";
    start_date: string;
    end_date: string;
    /** Local "HH:MM" of the reading (today only). */
    as_of: string | null;
    days_in_range: number;
    logged_days: number;
    has_data: boolean;
    has_goals: boolean;
    /** Fewer than 60 % of the period's days logged (range view only). */
    sparse: boolean;
    drink_unit: DrinkUnit | null;
    weight_unit: WeightUnit;
    metrics: DigestMetricRow[];
    score: { met: number; of: number } | null;
    verdict: DigestVerdictPart[] | null;
    /** Goal metrics (calories and water aside) never recorded in the period. */
    not_recorded: DigestMetric[];
    /** Recorded on some but not all logged days (range view). */
    partial: { key: DigestMetric; days: number }[];
    groups: {
        over: DigestMetric[];
        near: DigestMetric[];
        togo: DigestMetric[];
        ok: DigestMetric[];
        mostly_met: { key: DigestMetric; met: number; rec: number }[];
        mixed: { key: DigestMetric; met: number; rec: number }[];
        mostly_missed: { key: DigestMetric; met: number; rec: number }[];
    };
    calories: {
        value: number | null;
        goal: number | null;
        status: DigestStatus;
        met_days: number;
        over_days: number;
        under_days: number;
        /** The previous period's per-day average when it had 3+ logged days
         * (range view, not sparse), else null. */
        prev_avg: number | null;
        prev_days: number;
    };
    days: DigestDay[];
    trends: DigestTrends;
    water: {
        value_ml: number | null;
        goal_ml: number | null;
        met_days: number;
        rec_days: number;
    };
    weight: {
        unit: WeightUnit;
        goal: number | null;
        latest: DigestWeightPoint | null;
        /** Day view: the weigh-in before `latest`. Range view: the first one
         * in the period. */
        previous: DigestWeightPoint | null;
        count: number;
        /** Day view: `latest` is from the reported day itself. */
        on_day: boolean;
        /** The last weigh-in known when there is none to report. */
        last_known: DigestWeightPoint | null;
    };
    /** The reported day's meals (day view). */
    meals: DigestMeal[];
    /** Logging habits (range view, with data). */
    habits: {
        meals_per_day: number;
        times: { type: "breakfast" | "lunch" | "dinner"; time: string }[];
        top: { name: string; count: number; calories: number }[];
        best: DigestBestDay | null;
        tough: DigestBestDay | null;
    } | null;
    highlights: DigestHighlight[];
    /** Today only, with data: what remains of the day's goals. */
    rest: {
        kcal_left: number | null;
        kcal_over: number | null;
        water_left_ml: number | null;
        togo: { key: DigestMetric; amount: number }[];
        /** A food from the user's own log rich in the first target still to
         * go; null when nothing logged before fits. */
        food: {
            name: string;
            key: DigestMetric;
            amount: number;
            calories: number;
        } | null;
    } | null;
}

/** The output schema's averages / goals objects: every metric, nullable. */
export type DigestAverages = Record<DigestMetric, number | null>;
export type DigestGoals = Record<
    Exclude<DigestMetric, "trans_fat_g">,
    number | null
>;

export interface DigestStructured {
    period: DigestPeriod;
    start_date: string;
    end_date: string;
    days_in_range: number;
    logged_days: number;
    locale: string;
    averages: DigestAverages;
    goals: DigestGoals | null;
}

export interface DigestResult {
    structured: DigestStructured;
    meta: DigestMeta;
}

// ---------- the computation ----------

export function computeDigest(input: DigestInput): DigestResult {
    const { period, now, tz, goals, alcohol } = input;
    const today = dateInTz(now, tz);
    const asOfNow = localClock(now.toISOString(), tz);
    const dateAt = (i: number) => shiftLocalDate(today, -i);
    const isDay = period === "yesterday" || period === "today";
    const isToday = period === "today";
    const past = !isToday;
    const n = period === "last_7_days" ? 7 : period === "last_30_days" ? 30 : 1;
    // Indices are days ago (0 = today). Ranges end yesterday.
    const curIdx: number[] = isDay
        ? [isToday ? 0 : 1]
        : Array.from({ length: n }, (_, j) => n - j);
    const prvIdx: number[] = isDay
        ? [isToday ? 1 : 2]
        : curIdx.map((i) => i + n);

    const metrics = DIGEST_METRICS.filter(
        (k) => k !== "alcohol_g" || alcohol != null,
    );

    // Bucket the window by local day once. Rows are cut by local DAY, not by
    // instant: a bare-date entry for today is anchored at local noon, a
    // placeholder for an unknown time, so cutting at `now` would hide it
    // from "today so far" until 12:00. Every other read path (summary,
    // get_meals_today) buckets by `dateInTz` alone; this matches them and
    // drops only rows dated after today (the importer accepts 48 h ahead).
    const afterToday = (iso: string) => dateInTz(iso, tz) > today;
    const mealsBy = new Map<string, Meal[]>();
    for (const m of input.meals) {
        if (afterToday(m.logged_at)) continue;
        const d = dateInTz(m.logged_at, tz);
        const list = mealsBy.get(d) ?? [];
        list.push(m);
        mealsBy.set(d, list);
    }
    for (const list of mealsBy.values())
        list.sort((a, b) => a.logged_at.localeCompare(b.logged_at));
    const waterBy = new Map<string, WaterEntry[]>();
    for (const w of input.water) {
        if (afterToday(w.logged_at)) continue;
        const d = dateInTz(w.logged_at, tz);
        const list = waterBy.get(d) ?? [];
        list.push(w);
        waterBy.set(d, list);
    }
    // Weight: the day's last weigh-in, in the user's unit.
    const weightBy = new Map<string, number>();
    const weightsSorted = [...input.weights]
        .filter((w) => !afterToday(w.logged_at))
        .sort((a, b) => a.logged_at.localeCompare(b.logged_at));
    for (const w of weightsSorted)
        weightBy.set(
            dateInTz(w.logged_at, tz),
            fromGrams(w.weight_g, input.weightUnit),
        );

    // The previous day's "so far" cut for today: the same local clock time.
    const cutBefore = <T extends { logged_at: string }>(
        list: readonly T[],
        hhmm: string,
    ): T[] => list.filter((x) => localClock(x.logged_at, tz) <= hhmm);
    const dayAt = (i: number, cut: string | null = null): DayVals => {
        const date = dateAt(i);
        const ms = mealsBy.get(date) ?? [];
        const ws = waterBy.get(date) ?? [];
        return cut
            ? dayVals(date, cutBefore(ms, cut), cutBefore(ws, cut))
            : dayVals(date, ms, ws);
    };
    const cur = curIdx.map((i) => dayAt(i));
    const prv = prvIdx.map((i) => dayAt(i, isToday ? asOfNow : null));

    const G = {} as Record<DigestMetric, number | null>;
    for (const k of DIGEST_METRICS) G[k] = goalOf(goals, k);
    const hasGoals = metrics.some((k) => G[k] != null);

    const A = {} as Record<DigestMetric, Agg>;
    const AP = {} as Record<DigestMetric, Agg>;
    for (const k of metrics) {
        A[k] = aggregate(cur, k, G[k]);
        AP[k] = aggregate(prv, k, G[k]);
    }
    const loggedDays = cur.filter((d) => d.logged);
    const nLogged = loggedDays.length;
    const hasData = nLogged > 0;
    const sparse = !isDay && hasData && nLogged / n < 0.6;

    const rows: DigestMetricRow[] = metrics.map((k) => {
        const a = A[k];
        const g = G[k];
        return {
            key: k,
            kind: g == null ? "none" : KIND[k],
            value: rvn(k, a.t),
            goal: g == null ? null : rv(k, g),
            status: digestStatus(k, a.t, g),
            recorded_days: a.rec,
            met_days: a.met,
            over_days: a.over,
        };
    });
    const R = new Map(rows.map((r) => [r.key, r]));
    // Goal rows for the glance, the score and the verdict: calories and water
    // have their own blocks.
    const goalRows = rows.filter(
        (r) =>
            r.kind !== "none" && r.key !== "calories" && r.key !== "water_ml",
    );
    const scored = goalRows.filter((r) => r.status !== "nr");
    const notRecorded = hasData
        ? goalRows.filter((r) => r.status === "nr").map((r) => r.key)
        : [];

    // ---------- trends ----------
    const seriesOf = (
        key: DigestMetric | "weight",
        idx: number[],
    ): (number | null)[] =>
        idx.map((i) => {
            if (key === "weight") return weightBy.get(dateAt(i)) ?? null;
            if (i > DIGEST_HISTORY_DAYS) return null;
            const d = dayAt(i);
            if (key === "water_ml") return d.v.water_ml;
            return d.logged ? d.v[key] : null;
        });
    const trendKeys: (DigestMetric | "weight")[] = [
        ...metrics.filter((k) => k !== "trans_fat_g"),
        "weight",
    ];
    const tWin = isDay ? 14 : n;
    const tEnd = isDay ? curIdx[0]! : 1;
    const winIdx = Array.from({ length: tWin }, (_, j) => tEnd + tWin - 1 - j);
    const weightGoal =
        goals?.target_weight_g != null
            ? fromGrams(goals.target_weight_g, input.weightUnit)
            : null;
    const weightMove = input.weightUnit === "lb" ? 0.66 : 0.3;
    interface Cand extends DigestTrendCard {
        score: number;
        moving: boolean;
        mixedMove: boolean;
    }
    const cands: Cand[] = [];
    const few: (DigestMetric | "weight")[] = [];
    for (const key of trendKeys) {
        if (!isDay && key === "calories") continue;
        const ser = seriesOf(key, winIdx);
        const ghost = isDay
            ? null
            : seriesOf(
                  key,
                  winIdx.map((i) => i + n),
              );
        let a: number | null;
        let b: number | null;
        let nA: number;
        let nB: number;
        let both: (number | null)[];
        if (isDay) {
            const w1 = seriesOf(key, [1, 2, 3, 4, 5, 6, 7]);
            const w2 = seriesOf(key, [8, 9, 10, 11, 12, 13, 14]);
            a = mean(w1);
            b = mean(w2);
            nA = count(w1);
            nB = count(w2);
            both = [...w2.slice().reverse(), ...w1.slice().reverse()];
        } else {
            a = mean(ser);
            b = mean(ghost!);
            nA = count(ser);
            nB = count(ghost!);
            both = [...ghost!, ...ser];
        }
        const minN = key === "weight" ? 2 : 3;
        if (a == null || b == null || nA < minN || nB < minN) {
            if (count(ser) > 0 || key !== "weight") few.push(key);
            continue;
        }
        const g = key === "weight" ? weightGoal : G[key];
        const dv = a - b;
        const rel =
            key === "weight"
                ? Math.abs(dv) / weightMove
                : Math.abs(dv) / Math.max(g ?? 0, Math.abs(b), 1e-6) / 0.08;
        const sl = slope(both);
        const moving = rel >= 1 && Math.sign(sl) === Math.sign(dv);
        const up = dv > 0;
        let good: boolean | null = null;
        if (moving && g != null) {
            const kind = key === "weight" ? "weight" : KIND[key];
            if (kind === "target") good = up;
            else if (kind === "limit") good = !up;
            else if (kind === "budget") {
                const zd = (v: number) =>
                    v > g ? v - g : v < 0.9 * g ? 0.9 * g - v : 0;
                good = zd(a) < zd(b) ? true : zd(a) > zd(b) ? false : null;
            } else if (kind === "weight")
                good = Math.abs(a - g) < Math.abs(b - g);
        }
        const dir: DigestTrendDir = moving
            ? up
                ? "rising"
                : "falling"
            : rel >= 1
              ? "no_clear"
              : "steady";
        const rk = (x: number) =>
            key === "weight" ? r1(x) : rv(key as DigestMetric, x);
        cands.push({
            key,
            dir,
            tone:
                !moving || good === null || sparse
                    ? "neutral"
                    : good
                      ? "good"
                      : "bad",
            a: rk(a),
            b: rk(b),
            day_value: isDay
                ? (() => {
                      const v = ser[ser.length - 1];
                      return v == null ? null : rk(v);
                  })()
                : null,
            series: ser.map((v) => (v == null ? null : rk(v))),
            ghost: ghost ? ghost.map((v) => (v == null ? null : rk(v))) : null,
            goal: g == null ? null : rk(g),
            score: moving ? rel + 10 : rel,
            moving,
            mixedMove: !moving && rel >= 1,
        });
    }
    const must = cands.filter(
        (c) => c.key === "calories" || c.key === "weight",
    );
    const others = cands
        .filter((c) => c.key !== "calories" && c.key !== "weight")
        .sort((x, y) => y.score - x.score);
    const picked = [...must];
    for (const c of others) if (picked.length < 6) picked.push(c);
    picked.sort(
        (x, y) => Number(y.moving) - Number(x.moving) || y.score - x.score,
    );
    const notShown = others.filter((c) => !picked.includes(c));
    const strongest = picked.find((c) => c.moving && c.key !== "calories");
    const trends: DigestTrends = {
        cards: picked.map(
            ({ score: _s, moving: _m, mixedMove: _x, ...card }) => card,
        ),
        also: notShown
            .filter((c) => c.moving)
            .map((c) => ({ key: c.key, dir: c.dir as "rising" | "falling" })),
        mixed: notShown.filter((c) => c.mixedMove).map((c) => c.key),
        steady: notShown
            .filter((c) => !c.moving && !c.mixedMove)
            .map((c) => c.key),
        few,
    };

    // ---------- verdict and score ----------
    const cal = R.get("calories")!;
    let verdict: DigestVerdictPart[] | null = null;
    let score: DigestMeta["score"] = null;
    const trendPart = (): DigestVerdictPart | null =>
        strongest
            ? {
                  c: "trend",
                  key: strongest.key,
                  dir: strongest.dir as "rising" | "falling",
              }
            : null;
    if (hasData && hasGoals) {
        const parts: DigestVerdictPart[] = [];
        if (isDay) {
            if (cal.goal != null && cal.value != null) {
                parts.push({
                    c:
                        cal.status === "over"
                            ? "cal_over"
                            : !past
                              ? "cal_on_track"
                              : cal.status === "ok"
                                ? "cal_on_target"
                                : cal.value >= 0.85 * cal.goal
                                  ? "cal_just_under"
                                  : "cal_under",
                });
            }
            const over = scored
                .filter((r) => r.status === "over")
                .map((r) => r.key);
            const short = scored
                .filter((r) => r.status === "togo")
                .map((r) => r.key);
            if (over.length) parts.push({ c: "over", keys: over });
            if (short.length) parts.push({ c: "short", keys: short });
            if (!over.length && !short.length && scored.length)
                parts.push({ c: "all_met" });
            const tp = trendPart();
            if (tp && parts.length < 3) parts.push(tp);
        } else {
            if (sparse) parts.push({ c: "logged", n: nLogged, of: n });
            if (cal.goal != null && A.calories.rec) {
                const cs = A.calories.met / A.calories.rec;
                const co = A.calories.over / A.calories.rec;
                const cu = 1 - cs - co;
                parts.push({
                    c:
                        cs >= 0.7
                            ? "cal_mostly_on_target"
                            : co > 0.5
                              ? "cal_over_most"
                              : cu > 0.5
                                ? "cal_under_most"
                                : "cal_some",
                });
            }
            const miss = scored
                .filter(
                    (r) =>
                        r.recorded_days && r.met_days / r.recorded_days < 0.3,
                )
                .sort(
                    (x, y) =>
                        x.met_days / x.recorded_days -
                        y.met_days / y.recorded_days,
                );
            for (const r of miss.slice(0, sparse ? 1 : 2))
                parts.push({
                    c: "miss",
                    key: r.key,
                    kind: r.kind === "target" ? "target" : "limit",
                });
            if (!miss.length && scored.length) parts.push({ c: "no_miss" });
            const tp = trendPart();
            if (
                tp &&
                parts.length < 3 &&
                !miss.some((r) => r.key === strongest!.key)
            )
                parts.push(tp);
        }
        verdict = parts.length ? parts : null;
    }

    // Goal groups.
    const byShare = (r: DigestMetricRow) => r.met_days / r.recorded_days;
    const rangeItems = isDay
        ? []
        : scored
              .filter((r) => r.recorded_days > 0)
              .sort((x, y) => byShare(y) - byShare(x))
              .map((r) => ({
                  key: r.key,
                  met: r.met_days,
                  rec: r.recorded_days,
                  sh: byShare(r),
              }));
    const strip = (x: { key: DigestMetric; met: number; rec: number }) => ({
        key: x.key,
        met: x.met,
        rec: x.rec,
    });
    const groups: DigestMeta["groups"] = {
        over: isDay
            ? scored.filter((r) => r.status === "over").map((r) => r.key)
            : [],
        near: isDay
            ? scored.filter((r) => r.status === "near").map((r) => r.key)
            : [],
        togo: isDay
            ? scored.filter((r) => r.status === "togo").map((r) => r.key)
            : [],
        ok: isDay
            ? scored.filter((r) => r.status === "ok").map((r) => r.key)
            : [],
        mostly_met: rangeItems.filter((x) => x.sh >= 0.7).map(strip),
        mixed: rangeItems.filter((x) => x.sh >= 0.3 && x.sh < 0.7).map(strip),
        mostly_missed: rangeItems.filter((x) => x.sh < 0.3).map(strip),
    };
    if (hasData && scored.length) {
        score = isDay
            ? {
                  met: groups.ok.length + groups.near.length,
                  of: scored.length,
              }
            : { met: groups.mostly_met.length, of: scored.length };
    }

    const partial = isDay
        ? []
        : rows
              .filter(
                  (r) =>
                      r.key !== "calories" &&
                      r.key !== "water_ml" &&
                      r.status !== "nr" &&
                      r.recorded_days > 0 &&
                      r.recorded_days < nLogged,
              )
              .map((r) => ({ key: r.key, days: r.recorded_days }));

    // ---------- calories ----------
    const cG = G.calories;
    const prevLogged = prv.filter((d) => d.logged).length;
    const calories: DigestMeta["calories"] = {
        value: cal.value,
        goal: cal.goal,
        status: cal.status,
        met_days: A.calories.met,
        over_days: A.calories.over,
        under_days:
            cG == null
                ? 0
                : Math.max(nLogged - A.calories.met - A.calories.over, 0),
        prev_avg:
            !isDay && AP.calories.t != null && !sparse && prevLogged >= 3
                ? r0(AP.calories.t)
                : null,
        prev_days: prevLogged,
    };
    const dayMeals = (d: DayVals) =>
        d.meals.slice(0, DIGEST_MEALS_PER_DAY).map((m) => ({
            time: localClock(m.logged_at, tz),
            name: clip(m.description),
            calories: r0(m.calories ?? 0),
        }));
    const days: DigestDay[] = isDay
        ? []
        : cur.map((d) => {
              const kc = d.logged ? d.v.calories : null;
              return {
                  date: d.date,
                  logged: d.logged,
                  meal_count: d.meals.length,
                  calories: kc == null ? null : r0(kc),
                  status:
                      kc == null
                          ? "nr"
                          : cG == null
                            ? "none"
                            : kc > cG + 0.5
                              ? "over"
                              : digestMet("calories", kc, cG)
                                ? "on"
                                : "under",
                  water_ml: d.v.water_ml == null ? null : r0(d.v.water_ml),
                  meals: dayMeals(d),
              };
          });

    // ---------- water ----------
    const water: DigestMeta["water"] = {
        value_ml: rvn("water_ml", A.water_ml.t),
        goal_ml: G.water_ml == null ? null : r0(G.water_ml),
        met_days: A.water_ml.met,
        rec_days: A.water_ml.rec,
    };

    // ---------- weight ----------
    const weightPoints = (from: number, to: number) => {
        const out: DigestWeightPoint[] = [];
        for (let i = from; i >= to; i--) {
            const v = weightBy.get(dateAt(i));
            if (v != null) out.push({ value: v, date: dateAt(i) });
        }
        return out;
    };
    const lastOnOrBefore = (i: number): DigestWeightPoint | null => {
        for (let j = i; j <= DIGEST_HISTORY_DAYS; j++) {
            const v = weightBy.get(dateAt(j));
            if (v != null) return { value: v, date: dateAt(j) };
        }
        return null;
    };
    const overall: DigestWeightPoint | null = input.latestWeight
        ? {
              value: fromGrams(input.latestWeight.weight_g, input.weightUnit),
              date: dateInTz(input.latestWeight.logged_at, tz),
          }
        : null;
    const weight: DigestMeta["weight"] = {
        unit: input.weightUnit,
        goal: weightGoal,
        latest: null,
        previous: null,
        count: 0,
        on_day: false,
        last_known: null,
    };
    if (isDay) {
        const i0 = curIdx[0]!;
        const L0 = lastOnOrBefore(i0);
        const ago = L0 ? daysBetween(L0.date, dateAt(i0)) : Infinity;
        if (L0 && ago <= 7) {
            weight.latest = L0;
            weight.on_day = ago === 0;
            weight.count = 1;
            weight.previous = lastOnOrBefore(daysBetween(L0.date, today) + 1);
        } else {
            weight.last_known =
                L0 ?? (overall && overall.date <= dateAt(i0) ? overall : null);
        }
    } else {
        const pts = weightPoints(curIdx[0]!, curIdx[curIdx.length - 1]!);
        if (pts.length) {
            weight.latest = pts[pts.length - 1]!;
            weight.previous = pts.length > 1 ? pts[0]! : null;
            weight.count = pts.length;
        } else {
            weight.last_known =
                lastOnOrBefore(1) ??
                (overall && overall.date <= dateAt(1) ? overall : null);
        }
    }

    // ---------- meals (day view) ----------
    const day0 = cur[0]!;
    const meals: DigestMeal[] = isDay
        ? day0.meals.slice(0, DIGEST_MEALS_PER_DAY).map((m) => {
              const its = input.items.get(m.id);
              return {
                  time: localClock(m.logged_at, tz),
                  meal_type: m.meal_type,
                  name: clip(m.description),
                  calories: r0(m.calories ?? 0),
                  protein_g: r1(m.protein_g ?? 0),
                  carbs_g: r1(m.carbs_g ?? 0),
                  fat_g: r1(m.fat_g ?? 0),
                  items:
                      its && its.length
                          ? its.slice(0, DIGEST_ITEMS_PER_MEAL).map((it) => ({
                                name: clip(it.name),
                                amount: it.amount,
                                unit: it.unit,
                                calories:
                                    it.calories == null
                                        ? null
                                        : r0(it.calories),
                            }))
                          : null,
              };
          })
        : [];

    // ---------- habits (range view) ----------
    let habits: DigestMeta["habits"] = null;
    const allMeals = loggedDays.flatMap((d) => d.meals);
    if (!isDay && hasData) {
        const minutes = (m: Meal) => {
            const t = localClock(m.logged_at, tz);
            return Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
        };
        const fmtMin = (x: number) => {
            const r = Math.round(x / 5) * 5;
            const h = Math.floor(r / 60) % 24;
            return `${String(h).padStart(2, "0")}:${String(r % 60).padStart(2, "0")}`;
        };
        const times = (["breakfast", "lunch", "dinner"] as const)
            .map((type) => {
                const ts = allMeals
                    .filter((m) => (m.meal_type ?? "").toLowerCase() === type)
                    .map(minutes)
                    .sort((a, b) => a - b);
                return ts.length
                    ? { type, time: fmtMin(ts[Math.floor(ts.length / 2)]!) }
                    : null;
            })
            .filter(
                (
                    x,
                ): x is {
                    type: "breakfast" | "lunch" | "dinner";
                    time: string;
                } => x != null,
            );
        const byName = new Map<
            string,
            { name: string; count: number; calories: number }
        >();
        for (const m of allMeals) {
            const k = nameKey(m.description);
            const e = byName.get(k) ?? {
                name: clip(m.description),
                count: 0,
                calories: 0,
            };
            e.count += 1;
            e.calories += m.calories ?? 0;
            byName.set(k, e);
        }
        const top = [...byName.values()]
            .sort((a, b) => b.calories - a.calories)
            .slice(0, 3)
            .map((x) => ({ ...x, calories: r0(x.calories) }));
        // Best / toughest day: the glance's goals, calories and water aside.
        const dayGoals = goalRows.map((r) => r.key);
        const scoreDay = (d: DayVals) => {
            const rs = dayGoals.filter((k) => d.v[k] != null);
            return {
                s: rs.filter((k) => digestMet(k, d.v[k]!, G[k]!)).length,
                of: rs.length,
            };
        };
        const scoredDays = loggedDays
            .map((d) => ({ d, ...scoreDay(d) }))
            .filter((x) => x.of > 0);
        const kc = (d: DayVals) => d.v.calories ?? 0;
        const best = scoredDays
            .filter((x) => cG == null || kc(x.d) >= 0.85 * cG)
            .sort(
                (a, b) =>
                    b.s / b.of - a.s / a.of ||
                    (cG == null
                        ? 0
                        : Math.abs(kc(a.d) - cG) - Math.abs(kc(b.d) - cG)),
            )[0];
        const tough = scoredDays
            .slice()
            .sort((a, b) => a.s / a.of - b.s / b.of || kc(b.d) - kc(a.d))[0];
        const overList = (d: DayVals) =>
            dayGoals.filter(
                (k) =>
                    KIND[k] !== "target" &&
                    d.v[k] != null &&
                    d.v[k]! > G[k]! + EPS[UNIT[k]],
            );
        const shortList = (d: DayVals) =>
            dayGoals.filter(
                (k) =>
                    KIND[k] === "target" &&
                    d.v[k] != null &&
                    d.v[k]! < G[k]! - EPS[UNIT[k]],
            );
        const show =
            !sparse &&
            best &&
            tough &&
            best.d !== tough.d &&
            best.s - tough.s >= 2;
        const bd = (x: {
            d: DayVals;
            s: number;
            of: number;
        }): DigestBestDay => ({
            date: x.d.date,
            met: x.s,
            of: x.of,
            calories: r0(kc(x.d)),
            over: overList(x.d),
            short: shortList(x.d),
        });
        habits = {
            meals_per_day: r1(allMeals.length / nLogged),
            times,
            top,
            best: show ? bd(best!) : null,
            tough: show ? bd(tough!) : null,
        };
    }

    // ---------- highlights ----------
    const highlights: DigestHighlight[] = [];
    // The user's own log, for the "logged before" lookups. With alcohol
    // tracking off, a meal that carries alcohol is never offered as an
    // example.
    const history = [...mealsBy.values()]
        .flat()
        .filter((m) => alcohol != null || !((m.alcohol_g ?? 0) > 0));
    if (hasData) {
        const sugarBy = new Map<
            string,
            { name: string; v: number; c: number }
        >();
        let sugarTot = 0;
        for (const m of allMeals) {
            const v = m.sugar_g ?? 0;
            sugarTot += v;
            if (v > 0) {
                const k = nameKey(m.description);
                const e = sugarBy.get(k) ?? {
                    name: clip(m.description),
                    v: 0,
                    c: 0,
                };
                e.v += v;
                e.c += 1;
                sugarBy.set(k, e);
            }
        }
        let sugarFood: string | null = null;
        if (sugarTot > 0 && sugarBy.size > 1) {
            const top = [...sugarBy.entries()].sort(
                (a, b) => b[1].v - a[1].v,
            )[0]!;
            sugarFood = top[0];
            highlights.push({
                code: "sugar_source",
                name: top[1].name,
                count: top[1].c,
                grams: r1(top[1].v),
                share: Math.round((top[1].v / sugarTot) * 100),
            });
        }
        if (hasGoals) {
            // Calorie-zone streak up to the reported day (yesterday for today).
            let streak = 0;
            if (cG != null) {
                const endI = isDay ? (isToday ? 1 : curIdx[0]!) : 1;
                for (let i = endI; i <= DIGEST_HISTORY_DAYS; i++) {
                    const d = dayAt(i);
                    if (
                        d.logged &&
                        digestMet("calories", d.v.calories ?? 0, cG)
                    )
                        streak++;
                    else break;
                }
            }
            if (streak >= 3) highlights.push({ code: "streak", days: streak });
            else if (!isDay && nLogged < n && !sparse)
                highlights.push({ code: "gaps", days: n - nLogged });

            const misses = isDay
                ? scored
                      .filter(
                          (r) =>
                              r.status === "over" ||
                              (r.status === "togo" && !isToday),
                      )
                      .sort(
                          (a, b) =>
                              Number(b.status === "over") -
                                  Number(a.status === "over") ||
                              Math.abs(b.value! - b.goal!) / (b.goal || 1) -
                                  Math.abs(a.value! - a.goal!) / (a.goal || 1),
                      )
                : scored
                      .filter(
                          (r) =>
                              r.recorded_days &&
                              r.met_days / r.recorded_days < 0.7,
                      )
                      .sort(
                          (a, b) =>
                              a.met_days / a.recorded_days -
                              b.met_days / b.recorded_days,
                      );
            let source: DigestHighlight | null = null;
            for (const w of misses) {
                if (w.kind !== "target") {
                    const by = new Map<
                        string,
                        {
                            name: string;
                            v: number;
                            c: number;
                            one: number;
                            same: boolean;
                        }
                    >();
                    for (const m of allMeals) {
                        const v = metricValue(m, w.key);
                        if (!v) continue;
                        const k = nameKey(m.description);
                        const e = by.get(k) ?? {
                            name: clip(m.description),
                            v: 0,
                            c: 0,
                            one: v,
                            same: true,
                        };
                        if (v !== e.one) e.same = false;
                        e.v += v;
                        e.c += 1;
                        by.set(k, e);
                    }
                    const top = [...by.entries()].sort(
                        (a, b) => b[1].v - a[1].v,
                    )[0];
                    if (!top || (w.key === "sugar_g" && top[0] === sugarFood))
                        continue;
                    source = {
                        code: "over_source",
                        key: w.key,
                        days: isDay ? null : w.over_days,
                        name: top[1].name,
                        each: top[1].same ? rv(w.key, top[1].one) : null,
                        total: rv(w.key, top[1].v),
                        count: top[1].c,
                    };
                } else {
                    const fd = richestLogged(
                        history,
                        w.key,
                        Infinity,
                        [],
                        0.1 * (w.goal ?? 0),
                    );
                    if (!fd) continue;
                    source = {
                        code: "short_source",
                        key: w.key,
                        days: isDay ? null : w.recorded_days - w.met_days,
                        name: fd.name,
                        amount: rv(w.key, fd.amount),
                        calories: r0(fd.calories),
                    };
                }
                break;
            }
            // "Nothing missed" only when nothing is over or short at all
            // (a target still to go today is not a miss, but it is not met
            // either).
            const anyOpen = isDay
                ? scored.some((r) => r.status === "over" || r.status === "togo")
                : scored.some(
                      (r) =>
                          r.recorded_days && r.met_days / r.recorded_days < 0.7,
                  );
            if (source) highlights.push(source);
            else if (!anyOpen && scored.length)
                highlights.push({ code: "all_met" });
        }
    }

    // ---------- rest of today ----------
    let rest: DigestMeta["rest"] = null;
    if (isToday && hasData && hasGoals) {
        const calV = cal.value ?? 0;
        const kcalLeft =
            cal.goal != null && calV <= cal.goal ? r0(cal.goal - calV) : null;
        const kcalOver =
            cal.goal != null && calV > cal.goal + 0.5
                ? r0(calV - cal.goal)
                : null;
        const wr = R.get("water_ml")!;
        const waterLeft =
            wr.goal != null && (wr.value ?? 0) < wr.goal
                ? r0(wr.goal - (wr.value ?? 0))
                : null;
        const togo = scored
            .filter((r) => r.status === "togo" && r.kind === "target")
            .map((r) => ({
                key: r.key,
                amount: rv(r.key, r.goal! - r.value!),
            }));
        // A food from the user's own log, richest in the first target still
        // to go, that fits what is left of the calories and of every limit
        // already near or over.
        let food: NonNullable<DigestMeta["rest"]>["food"] = null;
        const want = togo.find(
            (t) => t.key === "protein_g" || t.key === "fiber_g",
        );
        if (want && kcalOver == null) {
            const tight = scored.filter(
                (r) =>
                    r.kind === "limit" &&
                    (r.status === "over" || r.status === "near"),
            );
            const room = tight.map((r) => ({
                key: r.key,
                room:
                    r.status === "over"
                        ? 0.1 * r.goal!
                        : Math.max(r.goal! - r.value!, 0),
            }));
            const fd = richestLogged(
                history,
                want.key,
                kcalLeft == null ? Infinity : kcalLeft * 1.05,
                room,
                0.15 * want.amount,
            );
            if (fd)
                food = {
                    name: fd.name,
                    key: want.key,
                    amount: rv(want.key, fd.amount),
                    calories: r0(fd.calories),
                };
        }
        rest = {
            kcal_left: kcalLeft,
            kcal_over: kcalOver,
            water_left_ml: waterLeft,
            togo,
            food,
        };
    }

    // ---------- structured content ----------
    const averages = {} as DigestAverages;
    for (const k of DIGEST_METRICS) {
        averages[k] =
            k === "alcohol_g" && alcohol == null
                ? null
                : rvn(k, A[k]?.t ?? null);
    }
    const goalsOut: DigestGoals | null = goals
        ? (Object.fromEntries(
              DIGEST_METRICS.filter((k) => k !== "trans_fat_g").map((k) => [
                  k,
                  k === "alcohol_g" && alcohol == null ? null : rvn(k, G[k]),
              ]),
          ) as DigestGoals)
        : null;
    const startDate = dateAt(curIdx[0]!);
    const endDate = dateAt(curIdx[curIdx.length - 1]!);

    const meta: DigestMeta = {
        v: 1,
        period,
        mode: isDay ? "day" : "range",
        start_date: startDate,
        end_date: endDate,
        as_of: isToday ? asOfNow : null,
        days_in_range: n,
        logged_days: nLogged,
        has_data: hasData,
        has_goals: hasGoals,
        sparse,
        drink_unit: alcohol,
        weight_unit: input.weightUnit,
        metrics: rows,
        score: hasGoals ? score : null,
        verdict,
        not_recorded: notRecorded,
        partial,
        groups,
        calories,
        days,
        trends,
        water,
        weight,
        meals,
        habits,
        highlights: highlights.slice(0, 3),
        rest,
    };
    return {
        structured: {
            period,
            start_date: startDate,
            end_date: endDate,
            days_in_range: n,
            logged_days: nLogged,
            locale: input.locale,
            averages,
            goals: goalsOut,
        },
        meta,
    };
}

/** The logged meal (by name, from the user's own history) richest in `key`
 * per calorie, carrying at least `minAmount` of it, within `maxKcal` and
 * within every `room` left on a tight limit. Null when nothing logged qualifies — the digest never names a food
 * the user has not logged. */
function richestLogged(
    history: readonly Meal[],
    key: DigestMetric,
    maxKcal: number,
    room: readonly { key: DigestMetric; room: number }[],
    minAmount: number,
): { name: string; amount: number; calories: number } | null {
    const seen = new Set<string>();
    let best: {
        name: string;
        amount: number;
        calories: number;
        s: number;
    } | null = null;
    for (const m of history) {
        const k = nameKey(m.description);
        if (seen.has(k)) continue;
        const v = metricValue(m, key) ?? 0;
        const kc = m.calories ?? 0;
        if (v <= 0 || v < minAmount || kc <= 0 || kc > maxKcal) continue;
        if (room.some((r) => (metricValue(m, r.key) ?? 0) > r.room)) continue;
        seen.add(k);
        const s = v / (kc + 40);
        if (!best || s > best.s)
            best = { name: clip(m.description), amount: v, calories: kc, s };
    }
    return best
        ? { name: best.name, amount: best.amount, calories: best.calories }
        : null;
}

// ---------- model-facing text ----------

const TEXT_LABEL: Record<DigestMetric, string> = {
    calories: "Calories",
    protein_g: "Protein",
    carbs_g: "Carbs",
    fat_g: "Fat",
    fiber_g: "Fiber",
    sugar_g: "Sugar",
    added_sugar_g: "Added sugar",
    saturated_fat_g: "Saturated fat",
    trans_fat_g: "Trans fat",
    sodium_mg: "Sodium",
    caffeine_mg: "Caffeine",
    alcohol_g: "Alcohol",
    water_ml: "Water",
};
const TEXT_UNIT: Record<Unit, string> = {
    kcal: " kcal",
    g: " g",
    mg: " mg",
    ml: " ml",
};
const STATUS_TEXT: Record<DigestStatus, string> = {
    over: "over",
    near: "near the limit",
    togo: "under",
    ok: "met",
    nr: "not recorded",
    none: "",
};

/** The model-facing content: a compact factual summary of the same figures
 * the widget draws. Describes only. */
export function digestText(r: DigestResult): string {
    const m = r.meta;
    const head =
        m.mode === "day"
            ? `Nutrition digest for ${m.start_date}${m.as_of ? ` (today, as of ${m.as_of})` : ""}`
            : `Nutrition digest for ${m.start_date} to ${m.end_date} (${m.days_in_range} days, ${m.logged_days} logged)`;
    if (!m.has_data) {
        const lines = [`${head}: nothing logged.`];
        if (m.water.value_ml != null)
            lines.push(
                `Water: ${m.water.value_ml} ml${m.mode === "range" ? " a day" : ""}.`,
            );
        return lines.join("\n");
    }
    const avg =
        m.mode === "range"
            ? " a day (average over the logged days that record it)"
            : "";
    const lines = [`${head}.`];
    for (const row of m.metrics) {
        if (row.value == null && row.goal == null) continue;
        const u = TEXT_UNIT[UNIT[row.key]];
        const value = row.value == null ? "not recorded" : `${row.value}${u}`;
        const goal =
            row.goal == null
                ? ""
                : ` / ${row.kind === "limit" ? "limit " : row.kind === "budget" ? "goal " : "target "}${row.goal}${u}`;
        const st =
            row.goal == null || row.value == null
                ? ""
                : m.mode === "range"
                  ? ` (met on ${row.met_days} of ${row.recorded_days} days)`
                  : row.status === "togo" && row.kind === "budget"
                    ? " (under)"
                    : ` (${STATUS_TEXT[row.status]})`;
        lines.push(`- ${TEXT_LABEL[row.key]}: ${value}${goal}${st}`);
    }
    if (avg) lines.splice(1, 0, `Figures are per day${avg}.`);
    if (!m.has_goals) lines.push("No goals are set.");
    const w = m.weight;
    if (w.latest)
        lines.push(
            `Weight: ${w.latest.value} ${w.unit} on ${w.latest.date}${w.goal != null ? ` (target ${w.goal} ${w.unit})` : ""}.`,
        );
    if (m.mode === "day") lines.push(`Meals logged: ${m.meals.length}.`);
    return lines.join("\n");
}
