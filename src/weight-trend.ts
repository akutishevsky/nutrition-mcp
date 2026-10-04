// Trend weight: pure helpers behind get_weight_trends' smoothed line, weekly
// rate and long-range series. No Supabase, no mcp.ts — everything here works
// on plain { weight_g, logged_at } rows and local YYYY-MM-DD dates, so it unit
// tests with fixtures.
//
// Everything is computed in grams; display-unit conversion happens only in
// buildWeightSeriesMeta (and the handler's text), so the EWMA never sees a
// rounded value.

import { dateInTz, shiftLocalDate } from "./tz.js";
import { fromGrams, type WeightUnit } from "./units.js";

/** EWMA smoothing per day (Hacker's Diet method at 15% instead of 10%). */
export const TREND_ALPHA = 0.15;

/**
 * Extra days read before a display window so the trend is settled on the
 * first day shown: at α = 0.15, 60 days leaves under 0.01% of the seed.
 */
export const TREND_WARMUP_DAYS = 60;

/** `daily` in the _meta payload covers the last this-many days. */
export const DAILY_SERIES_DAYS = 90;
/** `weekly` keeps the last this-many ISO weeks (the current one included). */
export const WEEKLY_SERIES_WEEKS = 53;
/** `monthly` keeps at most this many months, newest first kept. */
export const MONTHLY_SERIES_CAP = 240;

/** `weeklyRate` measures the trend over this many days back from endDate. */
export const RATE_LOOKBACK_DAYS = 14;
/** …needs at least RATE_MIN_WEIGHINS logged days within RATE_DENSITY_DAYS… */
export const RATE_MIN_WEIGHINS = 4;
export const RATE_DENSITY_DAYS = 21;
/** …and a measured span of at least this many days. */
export const RATE_MIN_SPAN_DAYS = 10;

/** `v` of the _meta payload; fields are additive within a version. */
export const WEIGHT_SERIES_META_VERSION = 1;

const GRAMS_PER_UNIT: Record<WeightUnit, number> = {
    kg: 1000,
    lb: 453.59237,
};

export interface WeightRow {
    weight_g: number;
    logged_at: string;
}

export interface DailyWeight {
    /** Local date (YYYY-MM-DD) in the user's timezone. */
    date: string;
    /** Mean of that day's weigh-ins, grams (unrounded). */
    weight_g: number;
}

export interface TrendPoint extends DailyWeight {
    /** EWMA trend at this weigh-in, grams (unrounded). */
    trend_g: number;
}

export interface WeeklyBucket {
    /** Local Monday (YYYY-MM-DD) the ISO week starts on. */
    start: string;
    weight_g: number;
    trend_g: number;
}

export interface MonthlyBucket {
    /** Local month, YYYY-MM. */
    month: string;
    weight_g: number;
    trend_g: number;
}

/** Whole days from date a to date b (both YYYY-MM-DD); b − a. */
export function daysBetween(a: string, b: string): number {
    const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
    return Math.round(ms / 86_400_000);
}

/**
 * One row per local day that has at least one weigh-in: the mean of that
 * day's weights, ascending by date. Days are bucketed with `dateInTz`, so a
 * weigh-in shortly after local midnight lands on the local day, DST included.
 */
export function dailyAverages(
    entries: readonly WeightRow[],
    tz: string,
): DailyWeight[] {
    const sums = new Map<string, { total: number; count: number }>();
    for (const e of entries) {
        const date = dateInTz(e.logged_at, tz);
        const cur = sums.get(date) ?? { total: 0, count: 0 };
        cur.total += e.weight_g;
        cur.count += 1;
        sums.set(date, cur);
    }
    return [...sums.entries()]
        .map(([date, { total, count }]) => ({ date, weight_g: total / count }))
        .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Time-aware EWMA over daily averages (must be ascending, one per date).
 * Seeded with the first day; for a gap of Δ days since the previous weigh-in
 * the step is a = 1 − (1 − α)^Δ, so a 5-day gap moves the trend exactly as
 * five daily steps at the new value would. Values exist only on logged days.
 */
export function trendSeries(
    days: readonly DailyWeight[],
    alpha: number = TREND_ALPHA,
): TrendPoint[] {
    const out: TrendPoint[] = [];
    let prev: TrendPoint | null = null;
    for (const d of days) {
        let trend: number;
        if (prev === null) {
            trend = d.weight_g;
        } else {
            const gap = Math.max(1, daysBetween(prev.date, d.date));
            const a = 1 - Math.pow(1 - alpha, gap);
            trend = prev.trend_g + a * (d.weight_g - prev.trend_g);
        }
        const point = { date: d.date, weight_g: d.weight_g, trend_g: trend };
        out.push(point);
        prev = point;
    }
    return out;
}

/**
 * Trend change per week in grams, measured from the last weigh-in on or
 * before endDate − 14 days to the last weigh-in on or before endDate.
 * Null when fewer than 4 days in the last 21 (ending at endDate) have a
 * weigh-in, when there is no reference point that far back, or when the
 * measured span is under 10 days — a shaky rate is worse than none.
 */
export function weeklyRate(
    series: readonly TrendPoint[],
    endDate: string,
): number | null {
    const upTo = series.filter((p) => p.date <= endDate);
    if (upTo.length === 0) return null;

    const densityFrom = shiftLocalDate(endDate, -(RATE_DENSITY_DAYS - 1));
    const recent = upTo.filter((p) => p.date >= densityFrom).length;
    if (recent < RATE_MIN_WEIGHINS) return null;

    const last = upTo[upTo.length - 1]!;
    const refCutoff = shiftLocalDate(endDate, -RATE_LOOKBACK_DAYS);
    let ref: TrendPoint | null = null;
    for (const p of upTo) {
        if (p.date <= refCutoff) ref = p;
        else break;
    }
    if (ref === null) return null;

    const span = daysBetween(ref.date, last.date);
    if (span < RATE_MIN_SPAN_DAYS) return null;
    return ((last.trend_g - ref.trend_g) / span) * 7;
}

/** Local Monday (YYYY-MM-DD) of the ISO week containing a local date. */
export function isoWeekStart(date: string): string {
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
    return shiftLocalDate(date, -((dow + 6) % 7));
}

function bucketize(
    series: readonly TrendPoint[],
    keyOf: (date: string) => string,
): { key: string; weight_g: number; trend_g: number }[] {
    const buckets = new Map<
        string,
        { total: number; count: number; trend: number; last: string }
    >();
    for (const p of series) {
        const key = keyOf(p.date);
        const cur = buckets.get(key);
        if (cur === undefined) {
            buckets.set(key, {
                total: p.weight_g,
                count: 1,
                trend: p.trend_g,
                last: p.date,
            });
        } else {
            cur.total += p.weight_g;
            cur.count += 1;
            if (p.date >= cur.last) {
                cur.trend = p.trend_g;
                cur.last = p.date;
            }
        }
    }
    return [...buckets.entries()]
        .map(([key, b]) => ({
            key,
            weight_g: b.total / b.count,
            trend_g: b.trend,
        }))
        .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

/**
 * ISO-week buckets (Monday start, on the local dates the series already
 * carries), ascending. `weight_g` is the mean of the week's daily averages,
 * `trend_g` the trend at its last weigh-in. Weeks with no weigh-in are
 * omitted. Only the `weeks` most recent ISO weeks ending with the week that
 * contains `endDate` are kept.
 */
export function weeklyBuckets(
    series: readonly TrendPoint[],
    endDate: string,
    weeks: number = WEEKLY_SERIES_WEEKS,
): WeeklyBucket[] {
    const lastStart = isoWeekStart(endDate);
    const firstStart = shiftLocalDate(lastStart, -7 * (weeks - 1));
    const inRange = series.filter(
        (p) => p.date >= firstStart && p.date <= shiftLocalDate(lastStart, 6),
    );
    return bucketize(inRange, isoWeekStart).map((b) => ({
        start: b.key,
        weight_g: b.weight_g,
        trend_g: b.trend_g,
    }));
}

/**
 * Calendar-month buckets (YYYY-MM of the local date), ascending, over the
 * whole series. Months with no weigh-in are omitted; at most `cap` are kept,
 * the newest.
 */
export function monthlyBuckets(
    series: readonly TrendPoint[],
    cap: number = MONTHLY_SERIES_CAP,
): MonthlyBucket[] {
    const all = bucketize(series, (d) => d.slice(0, 7)).map((b) => ({
        month: b.key,
        weight_g: b.weight_g,
        trend_g: b.trend_g,
    }));
    return all.length > cap ? all.slice(all.length - cap) : all;
}

/** Grams per week → display unit per week, rounded to 2 decimals. */
export function rateInUnit(gramsPerWeek: number, unit: WeightUnit): number {
    const v = Math.round((gramsPerWeek / GRAMS_PER_UNIT[unit]) * 100) / 100;
    return v === 0 ? 0 : v; // no -0
}

/**
 * The 1-decimal figure both the text content and the widget chip show,
 * derived from the 2-decimal `weekly_rate` so the two always agree.
 */
export function rateForDisplay(weeklyRate2dp: number): number {
    const v = Math.round(weeklyRate2dp * 10) / 10;
    return v === 0 ? 0 : v; // no -0
}

export interface WeightSeriesMeta {
    v: 1;
    unit: string;
    daily: { date: string; weight: number; trend: number }[];
    weekly: { start: string; weight: number; trend: number }[];
    monthly: { month: string; weight: number; trend: number }[];
    first: { date: string; weight: number } | null;
    trend_latest: number | null;
    trend_date: string | null;
    weekly_rate: number | null;
}

export interface WeightTrendAnalysis {
    days: DailyWeight[];
    series: TrendPoint[];
    /** Grams per week, unrounded; null per `weeklyRate`'s rules. */
    rate_g: number | null;
    meta: WeightSeriesMeta;
}

/**
 * Everything get_weight_trends needs from one full-history read: the daily
 * averages, the EWMA over all of them, the 2-week rate at `today`, and the
 * `_meta` payload in display units (weights at 1 decimal via `fromGrams`,
 * the rate at 2). `unit` is copied verbatim into the payload.
 */
export function analyzeWeightHistory(
    entries: readonly WeightRow[],
    tz: string,
    unit: WeightUnit,
    today: string,
): WeightTrendAnalysis {
    const days = dailyAverages(entries, tz).filter((d) => d.date <= today);
    const series = trendSeries(days);
    const rate_g = weeklyRate(series, today);

    const dailyFrom = shiftLocalDate(today, -(DAILY_SERIES_DAYS - 1));
    const conv = (g: number) => fromGrams(g, unit);
    const last = series.length > 0 ? series[series.length - 1]! : null;
    const firstDay = series.length > 0 ? series[0]! : null;

    const meta: WeightSeriesMeta = {
        v: WEIGHT_SERIES_META_VERSION,
        unit,
        daily: series
            .filter((p) => p.date >= dailyFrom)
            .map((p) => ({
                date: p.date,
                weight: conv(p.weight_g),
                trend: conv(p.trend_g),
            })),
        weekly: weeklyBuckets(series, today).map((b) => ({
            start: b.start,
            weight: conv(b.weight_g),
            trend: conv(b.trend_g),
        })),
        monthly: monthlyBuckets(series).map((b) => ({
            month: b.month,
            weight: conv(b.weight_g),
            trend: conv(b.trend_g),
        })),
        first: firstDay
            ? { date: firstDay.date, weight: conv(firstDay.weight_g) }
            : null,
        trend_latest: last ? conv(last.trend_g) : null,
        trend_date: last ? last.date : null,
        weekly_rate: rate_g === null ? null : rateInUnit(rate_g, unit),
    };
    return { days, series, rate_g, meta };
}

/**
 * `default_range` for the frozen structuredContent: the widget's own range
 * when `days` names one exactly, else 30.
 */
export function defaultRangeFor(days: number): 7 | 14 | 30 | 90 | 365 {
    // 14 stays 14: a host that drops `_meta` still shows the 7/14/30 toggle
    // and honours it, exactly as before. Trend mode has no 14 button and
    // falls back to 30 on its own (initialTrendRange).
    return days === 7 || days === 14 || days === 90 || days === 365 ? days : 30;
}
