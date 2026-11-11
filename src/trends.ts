import { dayCarries, type DailyBucket } from "./insights.js";
import type { NutritionGoals, WeightEntry } from "./storage.js";
import { dateInTz, hourInTz } from "./tz.js";
import { fromGrams, type WeightUnit } from "./units.js";

/**
 * Trends — the customizable analytics dashboard (brief: trends-brief.md,
 * T1–T14). This module is the pure engine: the card catalog, the layout
 * contract, and every computation a card renders (series, verdicts,
 * coverage). It consumes the DailyBuckets the Insights engine already
 * builds plus item-level nutrients aggregated here, so Trends and the
 * narratives can never disagree about the underlying days.
 */

// ---------------------------------------------------------------- layout

export type TrendsShape =
    "bar" | "line" | "consistency" | "breakdown" | "patterns";

export type TrendsCardSize = "full" | "compact";

export interface TrendsCardRef {
    shape: TrendsShape;
    data: string;
    size: TrendsCardSize;
}

export interface TrendsLayout {
    version: 1;
    cards: TrendsCardRef[];
}

export interface TrendsCatalogDataPoint {
    key: string;
    label: string;
    note: string;
    defaultSize: TrendsCardSize;
}

export interface TrendsCatalogShape {
    shape: TrendsShape;
    label: string;
    blurb: string;
    data: TrendsCatalogDataPoint[];
}

// ------------------------------------------------------------- nutrients

export type TrendsDirection = "reach" | "under";

export interface TrendsNutrient {
    /** Canonical key — also the drill-down metric key. */
    key: string;
    label: string;
    unit: "g" | "mg" | "kcal" | "ml";
    direction: TrendsDirection;
    /** Goal column on NutritionGoals, when one exists. */
    goalField: keyof NutritionGoals | null;
    /** Labeled fallback reference when no goal slot exists (T5/T6: never
     * an unlabeled invented target — the label always renders). */
    reference: { value: number; label: string } | null;
    /** Partial-coverage nutrient: averages and counts run only over the
     * days that carry it (the dayCarries rule from insights.ts). */
    partial: boolean;
}

export const TRENDS_NUTRIENTS: TrendsNutrient[] = [
    {
        key: "calories",
        label: "Calories",
        unit: "kcal",
        direction: "reach",
        goalField: "daily_calories",
        reference: null,
        partial: false,
    },
    {
        key: "protein_g",
        label: "Protein",
        unit: "g",
        direction: "reach",
        goalField: "daily_protein_g",
        reference: null,
        partial: false,
    },
    {
        key: "carbs_g",
        label: "Carbohydrates",
        unit: "g",
        direction: "reach",
        goalField: "daily_carbs_g",
        reference: null,
        partial: false,
    },
    {
        key: "fat_g",
        label: "Fat",
        unit: "g",
        direction: "under",
        goalField: "daily_fat_g",
        reference: null,
        partial: false,
    },
    {
        key: "saturated_fat_g",
        label: "Saturated fat",
        unit: "g",
        direction: "under",
        goalField: null,
        reference: { value: 20, label: "FDA daily value" },
        partial: true,
    },
    {
        key: "fiber_g",
        label: "Fiber",
        unit: "g",
        direction: "reach",
        goalField: "daily_fiber_g",
        reference: null,
        partial: true,
    },
    {
        key: "sugar_g",
        label: "Sugar",
        unit: "g",
        direction: "under",
        goalField: "daily_sugar_g",
        reference: null,
        partial: true,
    },
    {
        key: "sodium_mg",
        label: "Sodium",
        unit: "mg",
        direction: "under",
        goalField: null,
        reference: { value: 2300, label: "FDA daily limit" },
        partial: true,
    },
    {
        key: "potassium_mg",
        label: "Potassium",
        unit: "mg",
        direction: "reach",
        goalField: null,
        reference: { value: 3500, label: "FDA daily value" },
        partial: true,
    },
    {
        key: "cholesterol_mg",
        label: "Cholesterol",
        unit: "mg",
        direction: "under",
        goalField: null,
        reference: { value: 300, label: "FDA daily value" },
        partial: true,
    },
    {
        key: "alcohol_g",
        label: "Alcohol",
        unit: "g",
        direction: "under",
        goalField: "daily_alcohol_g",
        reference: null,
        partial: true,
    },
    {
        key: "water_ml",
        label: "Water",
        unit: "ml",
        direction: "reach",
        goalField: "daily_water_ml",
        reference: null,
        partial: false,
    },
];

export const TRENDS_NUTRIENT_BY_KEY = new Map(
    TRENDS_NUTRIENTS.map((n) => [n.key, n]),
);

/** Item-level nutrient keys a meal item can carry (the micros live only
 * on items — the meal row carries the seven headline nutrients). */
export const TRENDS_ITEM_NUTRIENT_KEYS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "alcohol_g",
    "saturated_fat_g",
    "sodium_mg",
    "potassium_mg",
    "cholesterol_mg",
] as const;

const barData: TrendsCatalogDataPoint[] = TRENDS_NUTRIENTS.map((n) => ({
    key: n.key,
    label: n.label,
    note:
        n.direction === "reach"
            ? `${n.unit} · reach a target`
            : `${n.unit} · stay under a limit`,
    defaultSize: "full" as TrendsCardSize,
}));

export const TRENDS_CATALOG: TrendsCatalogShape[] = [
    {
        shape: "bar",
        label: "Bar chart",
        blurb: "A bar per day against its target or limit",
        data: barData,
    },
    {
        shape: "line",
        label: "Trend line",
        blurb: "The smoothed line and its rate of change",
        data: [
            {
                key: "weight",
                label: "Weight",
                note: "smoothed trend · rate per week",
                defaultSize: "full",
            },
            {
                key: "water_ml",
                label: "Water",
                note: "7-day rolling average",
                defaultSize: "full",
            },
            {
                key: "calories",
                label: "Calories",
                note: "7-day rolling average",
                defaultSize: "full",
            },
            {
                key: "protein_g",
                label: "Protein",
                note: "7-day rolling average",
                defaultSize: "full",
            },
        ],
    },
    {
        shape: "consistency",
        label: "Consistency",
        blurb: "Dots and heatmaps of showing up",
        data: [
            {
                key: "logging",
                label: "Logging consistency",
                note: "days with anything logged",
                defaultSize: "compact",
            },
            {
                key: "weigh_ins",
                label: "Weigh-in consistency",
                note: "days with a weigh-in",
                defaultSize: "compact",
            },
        ],
    },
    {
        shape: "breakdown",
        label: "Breakdown",
        blurb: "Shares of a whole — where the calories came from",
        data: [
            {
                key: "macro_split",
                label: "Macro split",
                note: "calorie share by macro · snapshot or over time",
                defaultSize: "full",
            },
            {
                key: "meal_type_split",
                label: "Meal-type split",
                note: "calorie share by meal of the day",
                defaultSize: "full",
            },
        ],
    },
    {
        shape: "patterns",
        label: "Patterns",
        blurb: "When things happen",
        data: [
            {
                key: "weekday",
                label: "Weekday averages",
                note: "average calories by day of week",
                defaultSize: "full",
            },
            {
                key: "eating_window",
                label: "Eating window",
                note: "first to last meal, per day",
                defaultSize: "full",
            },
            {
                key: "meal_rhythm",
                label: "Meal rhythm",
                note: "how often each meal shows up",
                defaultSize: "full",
            },
        ],
    },
];

/** The guardrail (T4): a shape only offers data it can honestly draw —
 * weight is a trend line, never a daily bar chart. */
export function trendsCatalogData(
    shape: TrendsShape,
): TrendsCatalogDataPoint[] {
    return TRENDS_CATALOG.find((entry) => entry.shape === shape)?.data ?? [];
}

export function isTrendsCardRef(value: unknown): value is TrendsCardRef {
    if (typeof value !== "object" || value === null) return false;
    const card = value as Record<string, unknown>;
    if (
        card.shape !== "bar" &&
        card.shape !== "line" &&
        card.shape !== "consistency" &&
        card.shape !== "breakdown" &&
        card.shape !== "patterns"
    ) {
        return false;
    }
    if (card.size !== "full" && card.size !== "compact") return false;
    if (typeof card.data !== "string") return false;
    return trendsCatalogData(card.shape as TrendsShape).some(
        (point) => point.key === card.data,
    );
}

export const DEFAULT_TRENDS_LAYOUT: TrendsLayout = {
    version: 1,
    cards: [
        { shape: "bar", data: "calories", size: "full" },
        { shape: "line", data: "weight", size: "full" },
        { shape: "bar", data: "protein_g", size: "full" },
        { shape: "consistency", data: "logging", size: "compact" },
        { shape: "bar", data: "water_ml", size: "compact" },
    ],
};

const MAX_TRENDS_CARDS = 24;

/** Parse an untrusted layout (stored jsonb, PUT body) into a valid one.
 * Unknown shapes/data points are dropped, duplicates collapse, and a
 * wholly unusable payload falls back to the default dashboard — a bad
 * layout can never break the surface. An explicitly empty card list is
 * honored (T3: removing every card is allowed). */
export function normalizeTrendsLayout(input: unknown): TrendsLayout {
    if (typeof input !== "object" || input === null) {
        return structuredClone(DEFAULT_TRENDS_LAYOUT);
    }
    const raw = (input as Record<string, unknown>).cards;
    if (!Array.isArray(raw)) return structuredClone(DEFAULT_TRENDS_LAYOUT);
    const seen = new Set<string>();
    const cards: TrendsCardRef[] = [];
    for (const entry of raw) {
        if (!isTrendsCardRef(entry)) continue;
        const key = `${entry.shape}:${entry.data}`;
        if (seen.has(key)) continue;
        seen.add(key);
        cards.push({ shape: entry.shape, data: entry.data, size: entry.size });
        if (cards.length >= MAX_TRENDS_CARDS) break;
    }
    return { version: 1, cards };
}

// ------------------------------------------------------------ day series

/** A meal with its items' nutrient values, flattened for aggregation.
 * Values are keyed by the canonical nutrient keys; null = not recorded. */
export interface TrendsMealInput {
    id: string;
    description: string;
    mealType: string | null;
    loggedAt: string;
    items: { name: string; values: Record<string, number | null> }[];
}

export interface TrendsDay {
    date: string;
    hasLog: boolean;
    mealCount: number;
    /** Nutrient totals for the day; null when the day does not carry the
     * nutrient (partial coverage — never read a null as zero). */
    values: Record<string, number | null>;
}

/** The day-bucket extension the brief calls for: headline nutrients come
 * from the Insights buckets; the item-only micros (sodium, potassium,
 * cholesterol, saturated fat) aggregate from meal items with the same
 * partial-coverage rule as fiber/sugar/alcohol — a day carries one when
 * at least one of its items records it. */
export function buildTrendsDays(
    buckets: DailyBucket[],
    meals: TrendsMealInput[],
    tz: string,
): TrendsDay[] {
    const microByDate = new Map<string, Record<string, number | null>>();
    const microKeys = [
        "saturated_fat_g",
        "sodium_mg",
        "potassium_mg",
        "cholesterol_mg",
    ];
    for (const meal of meals) {
        const date = dateInTz(meal.loggedAt, tz);
        let day = microByDate.get(date);
        if (!day) {
            day = Object.fromEntries(microKeys.map((k) => [k, null]));
            microByDate.set(date, day);
        }
        for (const item of meal.items) {
            for (const key of microKeys) {
                const value = item.values[key];
                if (value != null) {
                    day[key] = (day[key] ?? 0) + value;
                }
            }
        }
    }
    return buckets.map((bucket) => {
        const micro = microByDate.get(bucket.date);
        const values: Record<string, number | null> = {
            calories: bucket.calories,
            protein_g: bucket.protein_g,
            carbs_g: bucket.carbs_g,
            fat_g: bucket.fat_g,
            water_ml: bucket.waterMl,
            fiber_g: dayCarries(bucket.meals, "fiber_g")
                ? bucket.fiber_g
                : null,
            sugar_g: dayCarries(bucket.meals, "sugar_g")
                ? bucket.sugar_g
                : null,
            alcohol_g: dayCarries(bucket.meals, "alcohol_g")
                ? bucket.alcohol_g
                : null,
            saturated_fat_g: micro?.saturated_fat_g ?? null,
            sodium_mg: micro?.sodium_mg ?? null,
            potassium_mg: micro?.potassium_mg ?? null,
            cholesterol_mg: micro?.cholesterol_mg ?? null,
        };
        return {
            date: bucket.date,
            hasLog: bucket.meals.length > 0 || bucket.waterMl > 0,
            mealCount: bucket.meals.length,
            values,
        };
    });
}

// ------------------------------------------------------------------ math

export function meanOf(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function roundTo(n: number, places = 1): number {
    const f = 10 ** places;
    return Math.round(n * f) / f;
}

/** Trailing rolling average over the carried values inside each window;
 * null where the window carries nothing (a gap in the line, not a zero). */
export function rollingAverage(
    series: { date: string; value: number | null }[],
    window = 7,
): { date: string; value: number | null }[] {
    return series.map((point, index) => {
        const windowValues: number[] = [];
        for (let i = Math.max(0, index - window + 1); i <= index; i++) {
            const value = series[i]!.value;
            if (value != null) windowValues.push(value);
        }
        return {
            date: point.date,
            value: windowValues.length > 0 ? meanOf(windowValues) : null,
        };
    });
}

/** Exponentially-weighted moving average over weigh-in days. A single
 * outlier spike moves the trend by alpha of the gap — it cannot flatten
 * or hijack the line (T14). */
export function ewmaSeries(
    points: { date: string; value: number }[],
    alpha = 0.25,
): { date: string; value: number }[] {
    const out: { date: string; value: number }[] = [];
    let current: number | null = null;
    for (const point of points) {
        current =
            current == null
                ? point.value
                : current + alpha * (point.value - current);
        out.push({ date: point.date, value: current });
    }
    return out;
}

/** Least-squares slope of value over calendar days, expressed per week. */
export function slopePerWeek(
    points: { date: string; value: number }[],
): number {
    if (points.length < 2) return 0;
    const dayMs = 86_400_000;
    const t0 = Date.parse(`${points[0]!.date}T00:00:00Z`);
    const xs = points.map(
        (p) => (Date.parse(`${p.date}T00:00:00Z`) - t0) / dayMs,
    );
    const ys = points.map((p) => p.value);
    const mx = meanOf(xs);
    const my = meanOf(ys);
    let num = 0;
    let den = 0;
    for (let i = 0; i < xs.length; i++) {
        num += (xs[i]! - mx) * (ys[i]! - my);
        den += (xs[i]! - mx) ** 2;
    }
    if (den === 0) return 0;
    return (num / den) * 7;
}

/** Integer percentage shares that always sum to exactly 100
 * (largest-remainder — T14's awkward-rounding rule). Zeros when the
 * total is zero. */
export function largestRemainderShares(parts: number[]): number[] {
    const total = parts.reduce((sum, v) => sum + Math.max(0, v), 0);
    if (total <= 0) return parts.map(() => 0);
    const exact = parts.map((v) => (Math.max(0, v) / total) * 100);
    const shares = exact.map((v) => Math.floor(v));
    let remainder = 100 - shares.reduce((sum, v) => sum + v, 0);
    const order = exact
        .map((v, i) => ({ i, frac: v - Math.floor(v) }))
        .sort((a, b) => b.frac - a.frac);
    for (const { i } of order) {
        if (remainder <= 0) break;
        shares[i] = shares[i]! + 1;
        remainder--;
    }
    return shares;
}

/** The T14 scale rule, shared by every chart: the plot domain always
 * contains the data and the reference, with headroom, so an over-limit
 * day never clips and a reference line never leaves the plot. */
export function plotMaxFor(values: number[], referenceHigh = 0): number {
    const max = Math.max(0, ...values, referenceHigh);
    return max > 0 ? max * 1.15 : 1;
}

/** Average over the days that carry a nutrient (partial) or over logged
 * days (headline nutrients) — the T7 coverage rule. */
export function coveredAverage(
    days: TrendsDay[],
    key: string,
    partial: boolean,
): { avg: number | null; carriedDays: number; totalDays: number } {
    const carried = days.filter((d) =>
        partial ? d.values[key] != null : d.hasLog,
    );
    const values = carried
        .map((d) => d.values[key])
        .filter((v): v is number => v != null);
    return {
        avg: values.length > 0 ? meanOf(values) : null,
        carriedDays: values.length,
        totalDays: days.length,
    };
}

// -------------------------------------------------------------- verdicts

export interface TrendsVerdict {
    lead: string;
    strong: string;
}

export interface TrendsReference {
    /** "line" renders one dashed line; "band" a shaded range. */
    type: "line" | "band";
    value: number;
    value2: number | null;
    /** The on-chart label — always carries the value (T13). */
    label: string;
    /** Where the reference came from: the user's goal or a named
     * reference value. Null when it is the goal. */
    source: string | null;
}

function formatValue(value: number, unit: string): string {
    const rounded =
        Math.abs(value) >= 100 ? Math.round(value) : roundTo(value, 1);
    const text = Number.isInteger(rounded)
        ? Math.round(rounded).toLocaleString("en-US")
        : String(rounded);
    return unit === "kcal" ? `${text} kcal` : `${text} ${unit}`;
}

/** The reference a nutrient card judges against: the user's goal when
 * one exists, else the nutrient's labeled reference value. Exported for
 * the drill-down day sheet, which shows the same reference. */
export function trendsReferenceFor(
    nutrient: TrendsNutrient,
    goals: NutritionGoals | null,
): { value: number; source: string | null } | null {
    if (nutrient.goalField && goals) {
        const goal = goals[nutrient.goalField] as number | null;
        if (
            goal != null &&
            (nutrient.direction === "under" ? goal >= 0 : goal > 0)
        ) {
            return { value: goal, source: null };
        }
    }
    if (nutrient.reference) {
        return {
            value: nutrient.reference.value,
            source: nutrient.reference.label,
        };
    }
    return null;
}

function previousPeriodDelta(
    currentAvg: number | null,
    previousAvg: number | null,
): TrendsVerdict | null {
    if (currentAvg == null || previousAvg == null || previousAvg === 0) {
        return null;
    }
    const pct = ((currentAvg - previousAvg) / previousAvg) * 100;
    if (Math.abs(pct) < 2) {
        return { lead: "", strong: "Much the same as the period before" };
    }
    const direction = pct > 0 ? "Up" : "Down";
    return {
        lead: "",
        strong: `${direction} ${Math.abs(Math.round(pct))}% on the period before`,
    };
}

// ------------------------------------------------------------ card types

export interface TrendsCardPayload {
    shape: TrendsShape;
    data: string;
    size: TrendsCardSize;
    title: string;
    subtitle: string;
    headline: { value: string; unit: string; note: string } | null;
    verdict: TrendsVerdict | null;
    coverage: { carriedDays: number; totalDays: number } | null;
    empty: { title: string; message: string } | null;
    chart: Record<string, unknown> | null;
}

export interface TrendsCardContext {
    /** Days inside the selected range, oldest first. */
    days: TrendsDay[];
    /** The equal-length period immediately before the range (verdicts
     * compare against it when no goal reference exists). */
    previousDays: TrendsDay[];
    buckets: DailyBucket[];
    previousBuckets: DailyBucket[];
    /** Raw weight entries inside the range. */
    weightEntries: WeightEntry[];
    weightUnit: WeightUnit;
    goals: NutritionGoals | null;
    rangeDays: number;
    timezone: string;
    alcoholTrackingEnabled: boolean;
}

function rangeNoun(rangeDays: number): string {
    if (rangeDays <= 7) return "last 7 days";
    if (rangeDays <= 30) return "last 30 days";
    return "last 3 months";
}

function basePayload(
    ref: TrendsCardRef,
    title: string,
    subtitle: string,
): TrendsCardPayload {
    return {
        shape: ref.shape,
        data: ref.data,
        size: ref.size,
        title,
        subtitle,
        headline: null,
        verdict: null,
        coverage: null,
        empty: null,
        chart: null,
    };
}

function emptyPayload(
    ref: TrendsCardRef,
    title: string,
    subtitle: string,
    message: string,
): TrendsCardPayload {
    const payload = basePayload(ref, title, subtitle);
    payload.empty = { title: `No ${title.toLowerCase()} yet`, message };
    return payload;
}

// ------------------------------------------------------------------ bars

function barCard(
    ref: TrendsCardRef,
    ctx: TrendsCardContext,
): TrendsCardPayload {
    const nutrient = TRENDS_NUTRIENT_BY_KEY.get(ref.data)!;
    const subtitle = rangeNoun(ctx.rangeDays);
    if (nutrient.key === "alcohol_g" && !ctx.alcoholTrackingEnabled) {
        return emptyPayload(
            ref,
            nutrient.label,
            subtitle,
            "Alcohol tracking is off for this account, so there is nothing to chart.",
        );
    }
    const { avg, carriedDays, totalDays } = coveredAverage(
        ctx.days,
        nutrient.key,
        nutrient.partial,
    );
    const previous = coveredAverage(
        ctx.previousDays,
        nutrient.key,
        nutrient.partial,
    );
    const totalValue = ctx.days.reduce(
        (sum, d) => sum + (d.values[nutrient.key] ?? 0),
        0,
    );
    if (carriedDays === 0 || totalValue <= 0) {
        return emptyPayload(
            ref,
            nutrient.label,
            subtitle,
            nutrient.partial
                ? `No ${nutrient.label.toLowerCase()} was recorded in this range — it only appears on days whose foods carry it.`
                : `Nothing logged in this range yet. Log a meal and this chart starts.`,
        );
    }
    const payload = basePayload(ref, nutrient.label, subtitle);
    const unit = nutrient.unit;
    payload.headline = {
        value:
            unit === "ml" && (avg ?? 0) >= 1000
                ? String(roundTo((avg ?? 0) / 1000, 1))
                : String(Math.round(avg ?? 0)),
        unit: unit === "ml" && (avg ?? 0) >= 1000 ? "L" : unit,
        note: "avg",
    };
    if (nutrient.partial && carriedDays < totalDays * 0.9) {
        payload.coverage = { carriedDays, totalDays };
    }
    const reference = trendsReferenceFor(nutrient, ctx.goals);
    let referencePayload: TrendsReference | null = null;
    if (reference) {
        if (nutrient.key === "calories") {
            const low = Math.round(reference.value * 0.95);
            const high = Math.round(reference.value * 1.05);
            referencePayload = {
                type: "band",
                value: low,
                value2: high,
                label: `target ${low.toLocaleString("en-US")}–${high.toLocaleString("en-US")}`,
                source: reference.source,
            };
        } else {
            referencePayload = {
                type: "line",
                value: reference.value,
                value2: null,
                label:
                    nutrient.direction === "under"
                        ? `limit ${formatValue(reference.value, unit)}`
                        : formatValue(reference.value, unit),
                source: reference.source,
            };
        }
    }
    // Verdict: against the reference when one exists (count of days on
    // the right side of it), else against the previous period.
    if (reference) {
        const counted = ctx.days.filter((d) =>
            nutrient.partial ? d.values[nutrient.key] != null : d.hasLog,
        );
        const inBand = (v: number) =>
            nutrient.key === "calories"
                ? v >= reference.value * 0.95 && v <= reference.value * 1.05
                : nutrient.direction === "under"
                  ? v <= reference.value
                  : v >= reference.value;
        const hits = counted.filter((d) =>
            inBand(d.values[nutrient.key] ?? 0),
        ).length;
        const sourceNote = reference.source ? ` (${reference.source})` : "";
        if (nutrient.key === "calories") {
            payload.verdict = {
                lead: `Target ${formatValue(reference.value, unit)}${sourceNote} — `,
                strong: `in range ${hits} of ${counted.length} days`,
            };
        } else if (nutrient.direction === "under") {
            payload.verdict = {
                lead: `Limit ${formatValue(reference.value, unit)}${sourceNote} — `,
                strong: `under it ${hits} of ${counted.length} days`,
            };
        } else {
            payload.verdict = {
                lead: `Target ${formatValue(reference.value, unit)}${sourceNote} — `,
                strong: `hit it ${hits} of ${counted.length} days`,
            };
        }
    } else {
        payload.verdict = previousPeriodDelta(avg, previous.avg) ?? {
            lead: "",
            strong: `Averaging ${formatValue(avg ?? 0, unit)} a day`,
        };
    }
    const series = ctx.days.map((d) => ({
        date: d.date,
        value: d.values[nutrient.key] ?? null,
        hasLog: d.hasLog,
    }));
    payload.chart = {
        kind: "bars",
        metric: nutrient.key,
        unit,
        days: series,
        reference: referencePayload,
        rolling:
            nutrient.key === "calories"
                ? rollingAverage(
                      series.map((d) => ({
                          date: d.date,
                          value: d.hasLog ? (d.value ?? null) : null,
                      })),
                  )
                : null,
    };
    return payload;
}

// ----------------------------------------------------------------- lines

function weightCard(
    ref: TrendsCardRef,
    ctx: TrendsCardContext,
): TrendsCardPayload {
    const subtitle = rangeNoun(ctx.rangeDays);
    // One value per day: the mean of that day's weigh-ins.
    const byDate = new Map<string, { total: number; count: number }>();
    for (const entry of ctx.weightEntries) {
        const date = dateInTz(entry.logged_at, ctx.timezone);
        const current = byDate.get(date) ?? { total: 0, count: 0 };
        current.total += entry.weight_g;
        current.count += 1;
        byDate.set(date, current);
    }
    const points = [...byDate.entries()]
        .map(([date, { total, count }]) => ({
            date,
            value: fromGrams(total / count, ctx.weightUnit),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    if (points.length < 3) {
        return emptyPayload(
            ref,
            "Weight trend",
            subtitle,
            `Weigh in on 3 or more days and this becomes your trend line — it follows the smoothed trend, not single noisy readings. So far: ${points.length} ${points.length === 1 ? "day" : "days"}.`,
        );
    }
    const payload = basePayload(ref, "Weight trend", subtitle);
    const trend = ewmaSeries(points);
    const latest = trend[trend.length - 1]!;
    const rate = slopePerWeek(trend);
    payload.headline = {
        value: String(roundTo(latest.value, 1)),
        unit: ctx.weightUnit,
        note: "trend",
    };
    const target =
        ctx.goals?.target_weight_g != null
            ? fromGrams(ctx.goals.target_weight_g, ctx.weightUnit)
            : null;
    const rateText =
        Math.abs(rate) < 0.05
            ? "holding steady"
            : rate < 0
              ? `down ${Math.abs(roundTo(rate, 1))} ${ctx.weightUnit} a week`
              : `up ${roundTo(rate, 1)} ${ctx.weightUnit} a week`;
    payload.verdict = {
        lead: "Trend is ",
        strong: rateText,
    };
    if (target != null) {
        const remaining = roundTo(Math.abs(latest.value - target), 1);
        payload.verdict = {
            lead: "Trend is ",
            strong: `${rateText} · ${remaining} ${ctx.weightUnit} from your target`,
        };
    }
    payload.chart = {
        kind: "line",
        metric: "weight",
        unit: ctx.weightUnit,
        points,
        trend,
        target,
        startLabel: points[0]!.date,
        endLabel: points[points.length - 1]!.date,
    };
    return payload;
}

function lineCard(
    ref: TrendsCardRef,
    ctx: TrendsCardContext,
): TrendsCardPayload {
    if (ref.data === "weight") return weightCard(ref, ctx);
    const nutrient = TRENDS_NUTRIENT_BY_KEY.get(ref.data)!;
    const subtitle = `${rangeNoun(ctx.rangeDays)} · 7-day average`;
    const { avg, carriedDays } = coveredAverage(
        ctx.days,
        nutrient.key,
        nutrient.partial,
    );
    const totalValue = ctx.days.reduce(
        (sum, d) => sum + (d.values[nutrient.key] ?? 0),
        0,
    );
    if (carriedDays === 0 || totalValue <= 0) {
        return emptyPayload(
            ref,
            nutrient.label,
            subtitle,
            `Nothing logged in this range yet. Log a meal and this line starts.`,
        );
    }
    const payload = basePayload(ref, nutrient.label, subtitle);
    payload.headline = {
        value:
            nutrient.unit === "ml" && (avg ?? 0) >= 1000
                ? String(roundTo((avg ?? 0) / 1000, 1))
                : String(Math.round(avg ?? 0)),
        unit:
            nutrient.unit === "ml" && (avg ?? 0) >= 1000 ? "L" : nutrient.unit,
        note: "avg",
    };
    const previous = coveredAverage(
        ctx.previousDays,
        nutrient.key,
        nutrient.partial,
    );
    payload.verdict = previousPeriodDelta(avg, previous.avg) ?? {
        lead: "",
        strong: `Averaging ${formatValue(avg ?? 0, nutrient.unit)} a day`,
    };
    const series = ctx.days.map((d) => ({
        date: d.date,
        value:
            d.hasLog || nutrient.partial
                ? (d.values[nutrient.key] ?? null)
                : null,
    }));
    payload.chart = {
        kind: "line",
        metric: nutrient.key,
        unit: nutrient.unit,
        points: series.filter((p) => p.value != null),
        trend: rollingAverage(series),
        target: null,
        startLabel: ctx.days[0]?.date ?? "",
        endLabel: ctx.days[ctx.days.length - 1]?.date ?? "",
        area: nutrient.key === "water_ml",
    };
    return payload;
}

// ----------------------------------------------------------- consistency

function consistencyCard(
    ref: TrendsCardRef,
    ctx: TrendsCardContext,
): TrendsCardPayload {
    const subtitle = rangeNoun(ctx.rangeDays);
    const isWeighIns = ref.data === "weigh_ins";
    const title = isWeighIns ? "Weigh-ins" : "Logging";
    const weightDates = new Set(
        ctx.weightEntries.map((e) => dateInTz(e.logged_at, ctx.timezone)),
    );
    const cells = ctx.days.map((d) => {
        if (isWeighIns) {
            const on = weightDates.has(d.date);
            return { date: d.date, level: on ? 3 : 0, active: on };
        }
        const level =
            d.mealCount >= 2 ? 3 : d.mealCount === 1 ? 2 : d.hasLog ? 1 : 0;
        return { date: d.date, level, active: d.hasLog };
    });
    const activeDays = cells.filter((c) => c.active).length;
    if (activeDays === 0) {
        return emptyPayload(
            ref,
            title,
            subtitle,
            isWeighIns
                ? "No weigh-ins in this range. Add a weight entry and the grid starts."
                : "Nothing logged in this range yet — the grid fills in as you log.",
        );
    }
    const payload = basePayload(ref, title, subtitle);
    payload.headline = {
        value: String(activeDays),
        unit: "",
        note: isWeighIns
            ? `weigh-ins in ${ctx.rangeDays} days`
            : `of ${ctx.days.length} days logged`,
    };
    // Current streak, counting back from the last day in range.
    let streak = 0;
    for (let i = cells.length - 1; i >= 0; i--) {
        if (cells[i]!.active) streak++;
        else break;
    }
    if (isWeighIns) {
        const perWeek = roundTo((activeDays / ctx.rangeDays) * 7, 1);
        payload.verdict = {
            lead: "",
            strong: `about ${perWeek} weigh-ins a week`,
        };
    } else {
        payload.verdict =
            streak >= 2
                ? { lead: "", strong: `on a ${streak}-day streak` }
                : {
                      lead: "",
                      strong: `${Math.round((activeDays / ctx.days.length) * 100)}% of days logged`,
                  };
    }
    payload.chart = {
        kind: "consistency",
        metric: isWeighIns ? "weight" : "calories",
        cells,
        full: ref.size === "full",
    };
    return payload;
}

// ------------------------------------------------------------- breakdown

const MACRO_SEGMENTS = [
    { key: "protein_g", label: "Protein", kcalPerGram: 4 },
    { key: "carbs_g", label: "Carbs", kcalPerGram: 4 },
    { key: "fat_g", label: "Fat", kcalPerGram: 9 },
    { key: "alcohol_g", label: "Alcohol", kcalPerGram: 7 },
] as const;

function macroTotals(days: TrendsDay[]): Map<string, number> {
    const totals = new Map<string, number>();
    for (const segment of MACRO_SEGMENTS) {
        totals.set(
            segment.key,
            days.reduce((sum, d) => sum + (d.values[segment.key] ?? 0), 0) *
                segment.kcalPerGram,
        );
    }
    return totals;
}

function macroSplitCard(
    ref: TrendsCardRef,
    ctx: TrendsCardContext,
): TrendsCardPayload {
    const subtitle = `${rangeNoun(ctx.rangeDays)} · share of calories`;
    const totals = macroTotals(ctx.days);
    const parts = MACRO_SEGMENTS.map((s) => totals.get(s.key) ?? 0);
    const totalKcal = parts.reduce((sum, v) => sum + v, 0);
    if (totalKcal <= 0) {
        return emptyPayload(
            ref,
            "Macro split",
            subtitle,
            "No macro data in this range yet. Log meals with protein, carbs or fat and the split appears.",
        );
    }
    const payload = basePayload(ref, "Macro split", subtitle);
    const shares = largestRemainderShares(parts);
    const segments = MACRO_SEGMENTS.map((segment, i) => ({
        key: segment.key,
        label: segment.label,
        grams: Math.round(
            ctx.days.reduce((sum, d) => sum + (d.values[segment.key] ?? 0), 0) /
                Math.max(1, ctx.days.filter((d) => d.hasLog).length),
        ),
        share: shares[i]!,
    })).filter((segment) => segment.share > 0 || segment.grams > 0);
    // Weekly share columns, oldest first, built from 7-day chunks
    // ending at the range end.
    const columns: { label: string; shares: Record<string, number> }[] = [];
    for (let end = ctx.days.length; end > 0; end -= 7) {
        const chunk = ctx.days.slice(Math.max(0, end - 7), end);
        const chunkTotals = macroTotals(chunk);
        const chunkParts = MACRO_SEGMENTS.map(
            (s) => chunkTotals.get(s.key) ?? 0,
        );
        if (chunkParts.reduce((a, b) => a + b, 0) <= 0) continue;
        const chunkShares = largestRemainderShares(chunkParts);
        const sharesByKey: Record<string, number> = {};
        MACRO_SEGMENTS.forEach((s, i) => {
            sharesByKey[s.key] = chunkShares[i]!;
        });
        columns.unshift({ label: chunk[0]!.date, shares: sharesByKey });
    }
    const avgDailyKcal =
        ctx.days.length > 0
            ? Math.round(
                  ctx.days.reduce((sum, d) => sum + d.values.calories!, 0) /
                      ctx.days.length,
              )
            : 0;
    payload.headline = {
        value: avgDailyKcal.toLocaleString("en-US"),
        unit: "kcal",
        note: "per day",
    };
    const prevTotals = macroTotals(ctx.previousDays);
    const prevParts = MACRO_SEGMENTS.map((s) => prevTotals.get(s.key) ?? 0);
    const prevShares = largestRemainderShares(prevParts);
    const proteinDelta = (shares[0] ?? 0) - (prevShares[0] ?? 0);
    if (prevParts.reduce((a, b) => a + b, 0) > 0 && proteinDelta !== 0) {
        payload.verdict = {
            lead: "",
            strong: `Protein share is ${proteinDelta > 0 ? "up" : "down"} ${Math.abs(proteinDelta)} points on the period before`,
        };
    } else {
        const top = segments.reduce((a, b) => (b.share > a.share ? b : a));
        payload.verdict = {
            lead: "",
            strong: `${top.label} carries ${top.share}% of calories`,
        };
    }
    payload.chart = {
        kind: "donut",
        metric: "macro_split",
        segments,
        columns,
        centerValue: avgDailyKcal,
    };
    return payload;
}

function mealTypeSplitCard(
    ref: TrendsCardRef,
    ctx: TrendsCardContext,
): TrendsCardPayload {
    const subtitle = `${rangeNoun(ctx.rangeDays)} · share of calories`;
    const order = ["breakfast", "lunch", "dinner", "snack"];
    const totals = new Map<string, number>();
    for (const bucket of ctx.buckets) {
        for (const meal of bucket.meals) {
            const key = order.includes(meal.meal_type ?? "")
                ? meal.meal_type!
                : "other";
            totals.set(key, (totals.get(key) ?? 0) + (meal.calories ?? 0));
        }
    }
    const keys = [...order, "other"].filter((k) => (totals.get(k) ?? 0) > 0);
    const parts = keys.map((k) => totals.get(k) ?? 0);
    if (parts.reduce((a, b) => a + b, 0) <= 0) {
        return emptyPayload(
            ref,
            "Meal-type split",
            subtitle,
            "No meals in this range yet, so there is no split to show.",
        );
    }
    const payload = basePayload(ref, "Meal-type split", subtitle);
    const shares = largestRemainderShares(parts);
    const segments = keys.map((key, i) => ({
        key,
        label: key === "other" ? "Other" : key[0]!.toUpperCase() + key.slice(1),
        share: shares[i]!,
        kcal: Math.round(parts[i]!),
    }));
    const top = segments.reduce((a, b) => (b.share > a.share ? b : a));
    payload.verdict = {
        lead: "",
        strong: `${top.label} carries ${top.share}% of your calories`,
    };
    payload.headline = {
        value: `${top.share}%`,
        unit: "",
        note: `from ${top.label.toLowerCase()}`,
    };
    payload.chart = { kind: "stacked", metric: "meal_type_split", segments };
    return payload;
}

// -------------------------------------------------------------- patterns

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function weekdayCard(
    ref: TrendsCardRef,
    ctx: TrendsCardContext,
): TrendsCardPayload {
    const subtitle = `${rangeNoun(ctx.rangeDays)} · average calories`;
    const logged = ctx.days.filter((d) => d.hasLog);
    if (logged.length < 2) {
        return emptyPayload(
            ref,
            "Weekday averages",
            subtitle,
            "Log on a few different days and the weekday pattern appears.",
        );
    }
    const payload = basePayload(ref, "Weekday averages", subtitle);
    const byDow = DOW_LABELS.map((label, dow) => {
        const days = logged.filter(
            (d) => new Date(`${d.date}T00:00:00Z`).getUTCDay() === dow,
        );
        const recent = [...ctx.days]
            .reverse()
            .filter((d) => new Date(`${d.date}T00:00:00Z`).getUTCDay() === dow)
            .slice(0, 4)
            .map((d) => ({
                date: d.date,
                value: Math.round(d.values.calories ?? 0),
            }));
        return {
            dow,
            label,
            avg:
                days.length > 0
                    ? Math.round(
                          meanOf(days.map((d) => d.values.calories ?? 0)),
                      )
                    : null,
            count: days.length,
            weekend: dow === 0 || dow === 6,
            dates: recent,
        };
    });
    // Render Monday-first, as the eye reads a week.
    const ordered = [...byDow.slice(1), byDow[0]!];
    const weekdayDays = logged.filter((d) => {
        const dow = new Date(`${d.date}T00:00:00Z`).getUTCDay();
        return dow >= 1 && dow <= 5;
    });
    const weekendDays = logged.filter((d) => {
        const dow = new Date(`${d.date}T00:00:00Z`).getUTCDay();
        return dow === 0 || dow === 6;
    });
    const overallAvg = Math.round(
        meanOf(logged.map((d) => d.values.calories ?? 0)),
    );
    payload.headline = {
        value: overallAvg.toLocaleString("en-US"),
        unit: "kcal",
        note: "avg",
    };
    if (weekdayDays.length > 0 && weekendDays.length > 0) {
        const delta = Math.round(
            meanOf(weekendDays.map((d) => d.values.calories ?? 0)) -
                meanOf(weekdayDays.map((d) => d.values.calories ?? 0)),
        );
        payload.verdict =
            Math.abs(delta) < 25
                ? { lead: "", strong: "Weekdays and weekends run about level" }
                : {
                      lead: "",
                      strong:
                          delta > 0
                              ? `Weekends run +${delta.toLocaleString("en-US")} kcal over weekdays`
                              : `Weekdays run +${Math.abs(delta).toLocaleString("en-US")} kcal over weekends`,
                  };
    } else {
        payload.verdict = {
            lead: "",
            strong: `Averaging ${overallAvg.toLocaleString("en-US")} kcal on logged days`,
        };
    }
    payload.chart = {
        kind: "weekday",
        metric: "calories",
        days: ordered,
        reference: {
            type: "line",
            value: overallAvg,
            value2: null,
            label: `avg ${overallAvg.toLocaleString("en-US")}`,
            source: null,
        },
    };
    return payload;
}

function eatingWindowCard(
    ref: TrendsCardRef,
    ctx: TrendsCardContext,
): TrendsCardPayload {
    const subtitle = `${rangeNoun(ctx.rangeDays)} · first to last meal`;
    const rows: { date: string; first: number; last: number }[] = [];
    for (const bucket of ctx.buckets) {
        if (bucket.meals.length === 0) continue;
        const hours = bucket.meals.map((m) =>
            hourInTz(m.logged_at, ctx.timezone),
        );
        rows.push({
            date: bucket.date,
            first: Math.min(...hours),
            last: Math.max(...hours),
        });
    }
    if (rows.length < 2) {
        return emptyPayload(
            ref,
            "Eating window",
            subtitle,
            "Log meals on a couple of days and your eating window appears.",
        );
    }
    const payload = basePayload(ref, "Eating window", subtitle);
    const avgFirst = meanOf(rows.map((r) => r.first));
    const avgLast = meanOf(rows.map((r) => r.last));
    const avgSpan = avgLast - avgFirst;
    const formatHour = (h: number) => {
        const hour = Math.floor(h);
        const minutes = Math.round((h - hour) * 60);
        const suffix = hour >= 12 ? "PM" : "AM";
        const display = hour % 12 === 0 ? 12 : hour % 12;
        return `${display}:${String(minutes).padStart(2, "0")} ${suffix}`;
    };
    payload.headline = {
        value: `${roundTo(avgSpan, 1)} h`,
        unit: "",
        note: "average window",
    };
    payload.verdict = {
        lead: "",
        strong: `First meal about ${formatHour(avgFirst)}, last about ${formatHour(avgLast)}`,
    };
    payload.chart = {
        kind: "window",
        metric: "eating_window",
        rows,
        avgFirst: roundTo(avgFirst, 2),
        avgLast: roundTo(avgLast, 2),
    };
    return payload;
}

function mealRhythmCard(
    ref: TrendsCardRef,
    ctx: TrendsCardContext,
): TrendsCardPayload {
    const subtitle = `${rangeNoun(ctx.rangeDays)} · days each meal shows up`;
    const logged = ctx.buckets.filter((b) => b.meals.length > 0);
    if (logged.length === 0) {
        return emptyPayload(
            ref,
            "Meal rhythm",
            subtitle,
            "No meals logged in this range yet.",
        );
    }
    const payload = basePayload(ref, "Meal rhythm", subtitle);
    const rows = ["breakfast", "lunch", "dinner", "snack"].map((type) => {
        const present = logged.filter((b) => b.mealTypes.has(type)).length;
        return {
            mealType: type,
            label: type[0]!.toUpperCase() + type.slice(1),
            present,
            loggedDays: logged.length,
            rate: Math.round((present / logged.length) * 100),
        };
    });
    const top = rows.reduce((a, b) => (b.rate > a.rate ? b : a));
    payload.headline = {
        value: `${top.rate}%`,
        unit: "",
        note: `${top.label.toLowerCase()} shows up most`,
    };
    payload.verdict = {
        lead: "",
        strong: `${top.label} is your most consistent meal — ${top.present} of ${logged.length} days`,
    };
    payload.chart = { kind: "rhythm", metric: "meal_rhythm", rows };
    return payload;
}

// -------------------------------------------------------------- assembly

/** One-line-per-card description of a saved dashboard, for the MCP /
 * chat surface (T9): an agent asked "how's my fiber trending" can see
 * the user actually has a fiber card and answer from it. */
export function describeTrendsLayout(layout: TrendsLayout): string {
    if (layout.cards.length === 0) {
        return "The user's Trends dashboard currently has no cards.";
    }
    const lines = layout.cards.map((card, index) => {
        const point = trendsCatalogData(card.shape).find(
            (p) => p.key === card.data,
        );
        const shapeLabel =
            TRENDS_CATALOG.find((s) => s.shape === card.shape)?.label ??
            card.shape;
        return `${index + 1}. ${point?.label ?? card.data} (${shapeLabel}, ${card.size})`;
    });
    return `The user's Trends dashboard has ${layout.cards.length} cards:\n${lines.join("\n")}`;
}

export function buildTrendsCard(
    ref: TrendsCardRef,
    ctx: TrendsCardContext,
): TrendsCardPayload {
    switch (ref.shape) {
        case "bar":
            return barCard(ref, ctx);
        case "line":
            return lineCard(ref, ctx);
        case "consistency":
            return consistencyCard(ref, ctx);
        case "breakdown":
            return ref.data === "meal_type_split"
                ? mealTypeSplitCard(ref, ctx)
                : macroSplitCard(ref, ctx);
        case "patterns":
            if (ref.data === "eating_window") return eatingWindowCard(ref, ctx);
            if (ref.data === "meal_rhythm") return mealRhythmCard(ref, ctx);
            return weekdayCard(ref, ctx);
    }
}

// ------------------------------------------------------------ drill-down

export interface TrendsContributorMeal {
    mealId: string;
    description: string;
    mealType: string | null;
    total: number;
    items: { name: string; value: number }[];
}

/** One day's meals → items ranked by their contribution to a metric
 * (T11). Only items that record the metric contribute; a meal whose
 * items carry none of it ranks by its recorded total of zero and is
 * included only when it has at least one contributing item. */
export function rankDayContributors(
    meals: TrendsMealInput[],
    metric: string,
): TrendsContributorMeal[] {
    const ranked: TrendsContributorMeal[] = [];
    for (const meal of meals) {
        const items = meal.items
            .map((item) => ({
                name: item.name,
                value: item.values[metric] ?? null,
            }))
            .filter(
                (item): item is { name: string; value: number } =>
                    item.value != null && item.value > 0,
            )
            .sort((a, b) => b.value - a.value);
        if (items.length === 0) continue;
        ranked.push({
            mealId: meal.id,
            description: meal.description,
            mealType: meal.mealType,
            total: items.reduce((sum, item) => sum + item.value, 0),
            items,
        });
    }
    return ranked.sort((a, b) => b.total - a.total);
}

/** A whole period's top foods for one metric (the donut-segment drill):
 * aggregated by food name, with the most recent day each appears on. */
export function rankPeriodContributors(
    meals: (TrendsMealInput & { date: string })[],
    metric: string,
    limit = 12,
): { name: string; value: number; lastDate: string }[] {
    const byName = new Map<string, { value: number; lastDate: string }>();
    for (const meal of meals) {
        for (const item of meal.items) {
            const value = item.values[metric];
            if (value == null || value <= 0) continue;
            const key = item.name.trim().toLowerCase();
            if (!key) continue;
            const current = byName.get(key) ?? {
                value: 0,
                lastDate: meal.date,
            };
            current.value += value;
            if (meal.date > current.lastDate) current.lastDate = meal.date;
            byName.set(key, current);
        }
    }
    return [...byName.entries()]
        .map(([name, { value, lastDate }]) => ({
            name: name.replace(/\b\w/g, (c) => c.toUpperCase()),
            value,
            lastDate,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
}
