import type { Meal, NutritionGoals, WaterEntry } from "./supabase.js";
import { dateInTz, hourInTz } from "./tz.js";
import { formatWeight, fromGrams, type WeightUnit } from "./units.js";
import {
    dailyAverages,
    rateForDisplay,
    rateInUnit,
    trendSeries,
    weeklyRate,
    type WeightRow,
} from "./weight-trend.js";

export interface DailyBucket {
    date: string; // YYYY-MM-DD
    meals: Meal[];
    waterMl: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    /** Part of fat_g. Summed with `?? 0`; whether the day recorded it at all is
     * dayCarries(meals, "saturated_fat_g"). */
    saturated_fat_g: number;
    /** Not part of the fat or saturated figures: a separate fat type. Summed
     * with `?? 0`; whether the day recorded it is dayCarries(meals, "trans_fat_g"). */
    trans_fat_g: number;
    fiber_g: number;
    sugar_g: number;
    /** Part of sugar_g. Summed with `?? 0` like the other partial nutrients;
     * whether the day recorded it at all is dayCarries(meals, "added_sugar_g"). */
    added_sugar_g: number;
    alcohol_g: number;
    caffeine_mg: number;
    mealTypes: Set<string>;
}

function mean(values: number[]): number {
    if (values.length === 0) return 0;
    let sum = 0;
    for (const v of values) sum += v;
    return sum / values.length;
}

function stdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const m = mean(values);
    let sq = 0;
    for (const v of values) sq += (v - m) ** 2;
    return Math.sqrt(sq / (values.length - 1));
}

function round(n: number, places = 1): number {
    const f = 10 ** places;
    return Math.round(n * f) / f;
}

function addDays(date: string, days: number): string {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

/** Whole calendar days from `start` to `end`, both YYYY-MM-DD. Exported so
 * mcp.ts can size a range in calendar days with the same arithmetic that
 * buildDailyBuckets uses to lay them out — the summary and trends must not
 * disagree about how long a window is. */
export function dateDiffDays(start: string, end: string): number {
    const a = new Date(`${start}T00:00:00Z`).getTime();
    const b = new Date(`${end}T00:00:00Z`).getTime();
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Build per-day buckets for every date in [startDate, endDate], including days with no logs.
 * Dates are interpreted in the given IANA timezone. */
export function buildDailyBuckets(
    meals: Meal[],
    water: WaterEntry[],
    startDate: string,
    endDate: string,
    tz: string = "UTC",
): DailyBucket[] {
    const buckets = new Map<string, DailyBucket>();
    const totalDays = dateDiffDays(startDate, endDate);
    for (let i = 0; i <= totalDays; i++) {
        const date = addDays(startDate, i);
        buckets.set(date, {
            date,
            meals: [],
            waterMl: 0,
            calories: 0,
            protein_g: 0,
            carbs_g: 0,
            fat_g: 0,
            saturated_fat_g: 0,
            trans_fat_g: 0,
            fiber_g: 0,
            sugar_g: 0,
            added_sugar_g: 0,
            alcohol_g: 0,
            caffeine_mg: 0,
            mealTypes: new Set(),
        });
    }

    for (const m of meals) {
        const date = dateInTz(m.logged_at, tz);
        const b = buckets.get(date);
        if (!b) continue;
        b.meals.push(m);
        b.calories += m.calories ?? 0;
        b.protein_g += m.protein_g ?? 0;
        b.carbs_g += m.carbs_g ?? 0;
        b.fat_g += m.fat_g ?? 0;
        b.saturated_fat_g += m.saturated_fat_g ?? 0;
        b.trans_fat_g += m.trans_fat_g ?? 0;
        b.fiber_g += m.fiber_g ?? 0;
        b.sugar_g += m.sugar_g ?? 0;
        b.added_sugar_g += m.added_sugar_g ?? 0;
        b.alcohol_g += m.alcohol_g ?? 0;
        b.caffeine_mg += m.caffeine_mg ?? 0;
        if (m.meal_type) b.mealTypes.add(m.meal_type);
    }

    for (const w of water) {
        const date = dateInTz(w.logged_at, tz);
        const b = buckets.get(date);
        if (!b) continue;
        b.waterMl += w.amount_ml;
    }

    return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** The nutrients added after the fact — fiber, sugar and alcohol in one pass,
 * caffeine and then added sugar in later ones. Every meal written before each pass shipped carries
 * NULL for its nutrients, so — unlike calories or protein, where a missing value
 * has always meant zero and users have history built on that — a null here means
 * "not recorded", not "ate none". Summing them as zero over every logged day
 * reported 5 g/day for a user eating 30 g, and scored 25 data-less days as days
 * under a sugar limit. Caffeine is the same story and then some: most meals will
 * legitimately never carry a value. */
export type PartialNutrient =
    | "saturated_fat_g"
    | "trans_fat_g"
    | "fiber_g"
    | "sugar_g"
    | "added_sugar_g"
    | "alcohol_g"
    | "caffeine_mg";

/** THE RULE, shared with mcp.ts: a day carries a nutrient when at least one of
 * that day's meals has a non-null value for it. Only carrying days count toward
 * an average, a day-count or a std dev — days with no data are excluded from
 * both numerator and denominator, so trends and the summary must agree. */
export function dayCarries(meals: Meal[], nutrient: PartialNutrient): boolean {
    return meals.some((m) => m[nutrient] != null);
}

/**
 * The "not recorded" figure when a ceiling is set and the day (or window) holds
 * no recorded value for that nutrient — "not recorded on this day (limit 29g)".
 * One wording for every model-facing place that reports a limited partial
 * nutrient against its limit (added sugar and saturated fat, in formatProgress
 * and the summary average in mcp.ts, computeTrends and computeWeeklyDigest
 * here), so a model reading two of them never sees two phrasings of the same
 * fact. It exists because dropping the line let a model read total sugar
 * against the added-sugar limit (a 330 ml cola logged with sugar_g 35 and no
 * added_sugar_g, reported as "6 g over your 29 g added-sugar limit"). The
 * wording names no nutrient: the caller's label does that. Describes only — it
 * states the gap, never what to do about it. Callers gate it on an active
 * ceiling (0 is a real one).
 */
export function limitNotRecorded(
    scope: "day" | "period",
    limit: number,
): string {
    const where = scope === "day" ? "on this day" : "in this period";
    return `not recorded ${where} (limit ${round(limit)}g)`;
}

/** Mean of a nutrient over only the days that carry it, given one Meal[] per
 * day. `avg` is null when no day in the range carries the nutrient — that is
 * the signal to suppress the figure entirely rather than print 0. Exported for
 * mcp.ts, which groups by date itself instead of building DailyBuckets. */
export function coveredDailyAverage(
    mealsByDay: Meal[][],
    nutrient: PartialNutrient,
): { avg: number | null; days: number } {
    const totals = mealsByDay
        .filter((meals) => dayCarries(meals, nutrient))
        .map((meals) => meals.reduce((s, m) => s + (m[nutrient] ?? 0), 0));
    return {
        avg: totals.length > 0 ? mean(totals) : null,
        days: totals.length,
    };
}

const WINDOWS = [7, 14, 30] as const;

interface Trailing {
    /** Window size asked for (7/14/30), before clamping to the data. */
    n: number;
    /** Mean over the counting days in the window; null when there are none. */
    avg: number | null;
    /** Days that counted, and calendar days the window actually spans. */
    days: number;
    window: number;
    /** Calendar days in the window carrying any log at all (nonEmpty). For a
     * full series this is what makes the denominator visible — `days` equals
     * `window` there by construction, so it is the only number that can tell a
     * 30-of-30 average apart from a 15-of-30 one. Informational for a covered
     * series, whose own note already names its narrower denominator. */
    loggedDays: number;
}

interface StatSeries {
    /** Daily values behind every figure on the line. */
    values: number[];
    trailing: Trailing[];
    /** True when a day can be absent from `values`, which changes the wording
     * from a bare "3/7" to "3/7 days with data". */
    partial: boolean;
}

/** A nutrient that has always been summed with `?? 0`: every day in the window
 * counts, exactly as before. The denominator is therefore CALENDAR days — an
 * unlogged day is a real zero, which is the right question for "how much am I
 * eating per day", and the wrong one for "how much do I eat on a day I eat".
 * mcp.ts's `rangeAverages` deliberately answers the second with a logged-day
 * denominator, so the same window can legitimately yield two figures 2x apart;
 * each side therefore has to say which it is. Ours is said by `loggedDays`,
 * which formatStatLine turns into a note whenever the window has gaps. */
function fullSeries(
    buckets: DailyBucket[],
    field: keyof DailyBucket,
): StatSeries {
    return {
        values: buckets.map((b) => b[field] as number),
        trailing: WINDOWS.map((n) => {
            const slice = buckets.slice(-n);
            const values = slice.map((b) => b[field] as number);
            return {
                n,
                avg: values.length > 0 ? mean(values) : null,
                days: values.length,
                window: slice.length,
                loggedDays: slice.filter(nonEmpty).length,
            };
        }),
        partial: false,
    };
}

/** A nutrient that may be missing: only carrying days count (see dayCarries). */
function coveredSeries(
    buckets: DailyBucket[],
    nutrient: PartialNutrient,
): StatSeries {
    const valuesOf = (bs: DailyBucket[]) =>
        bs.filter((b) => dayCarries(b.meals, nutrient)).map((b) => b[nutrient]);
    return {
        values: valuesOf(buckets),
        trailing: WINDOWS.map((n) => {
            const slice = buckets.slice(-n);
            const values = valuesOf(slice);
            return {
                n,
                avg: values.length > 0 ? mean(values) : null,
                days: values.length,
                window: slice.length,
                loggedDays: slice.filter(nonEmpty).length,
            };
        }),
        partial: true,
    };
}

function longestStreak(
    buckets: DailyBucket[],
    predicate: (b: DailyBucket) => boolean,
): number {
    let best = 0;
    let cur = 0;
    for (const b of buckets) {
        if (predicate(b)) {
            cur++;
            if (cur > best) best = cur;
        } else {
            cur = 0;
        }
    }
    return best;
}

function currentStreak(
    buckets: DailyBucket[],
    predicate: (b: DailyBucket) => boolean,
): number {
    let count = 0;
    for (let i = buckets.length - 1; i >= 0; i--) {
        if (predicate(buckets[i]!)) count++;
        else break;
    }
    return count;
}

function nonEmpty(b: DailyBucket): boolean {
    return b.meals.length > 0 || b.waterMl > 0;
}

/** Whether a suppressible series (alcohol, caffeine) is worth rendering at all.
 * For most users it is flat zero, and averages / a std dev / a CV over all-zero
 * data are noise — the same instinct as the widget hiding the water bar until
 * water is tracked.
 *
 * Note this is data-driven only. For alcohol it pairs with the per-user
 * alcohol_tracking_enabled flag, which lives in mcp.ts since this module stays
 * free of Supabase. Caffeine deliberately has NO such flag — the opt-in exists
 * for a specific harm (surfacing trace alcohol to a user in recovery) that has
 * no caffeine equivalent — so for caffeine this check is the whole gate. */
function hasAnyPositive(values: number[]): boolean {
    return values.some((v) => v > 0);
}

/** Whether a target is a real one. Zero is a genuine LIMIT — "no alcohol at
 * all" is the most likely limit anyone sets, and any consumption is over it —
 * but a zero FLOOR ("reach 0 g of protein") is meaningless, so there it still
 * reads as unset. Negatives are rejected either way. */
function targetApplies(target: number | null, direction: StatDirection) {
    if (target == null) return false;
    return direction === "ceiling" ? target >= 0 : target > 0;
}

/** Whether a value lands within ±10% of a floor target, judged on the
 * unrounded value. Two-sided on purpose: 115% of a protein target is off
 * target, exactly as "Days within ±10% of target" has always counted it. The
 * one definition behind both that line and the period on-target count in
 * periods.ts, so the two can never drift apart. A target of zero or less is
 * not a real floor (see targetApplies) and never counts as hit. */
export function withinBand(value: number, target: number): boolean {
    return target > 0 && value >= target * 0.9 && value <= target * 1.1;
}

/** Whether the goal is something to reach ("floor": calories, protein, fiber…)
 * or something to stay under ("ceiling": sugar, alcohol). Mirrors the
 * GoalDirection used by formatGoalLine in mcp.ts. */
type StatDirection = "floor" | "ceiling";

/** Renders one nutrient's block. Returns null when a partial nutrient has no
 * data anywhere in the window — the caller drops the section rather than
 * printing an average of nothing as "0g" next to a target.
 *
 * Every trailing average states its denominator whenever that denominator is
 * not the obvious one: a partial nutrient names the days it found data on, a
 * full nutrient names the days that were logged at all out of the calendar
 * window it divided by. Silence means "no gaps", so the common fully-logged
 * line is unchanged. This exists because get_nutrition_summary's rangeAverages
 * divides the same nutrients by LOGGED days on purpose (issue #70): a model
 * narrating both in one chat would otherwise report two contradictory "average
 * daily calories" with nothing to reconcile them. The fix is disclosure on
 * both sides, not one shared denominator — the two answer different questions. */
function formatStatLine(
    label: string,
    unit: string,
    series: StatSeries,
    target: number | null,
    direction: StatDirection = "floor",
    // Decimal places for every figure that carries `unit`. Caffeine passes 0:
    // mcp.ts renders it as whole milligrams everywhere (see formatMg there), and
    // a model narrating get_goal_progress and get_trends in one breath must not
    // report the same day as "165 mg" and "165.1 mg". The tenth is not real
    // precision either — no label, export or column in this database carries it.
    decimals = 1,
): string | null {
    const { values, trailing, partial } = series;
    if (partial && values.length === 0) return null;
    // A figure drawn from fewer days than the window is said to be, rather than
    // passed off as a full-window average.
    const of = partial
        ? `/${values.length} days with data`
        : `/${values.length}`;
    const parts = [`${label}:`];
    for (const t of trailing) {
        if (t.avg == null) {
            parts.push(`  ${t.n}d avg: no data`);
            continue;
        }
        // At most one note: the narrower denominator is the informative one, and
        // a partial nutrient's "days with data" already implies the gap.
        const note = partial
            ? t.days < t.window
                ? ` (${t.days} of ${t.window} days with data)`
                : ""
            : t.loggedDays < t.window
              ? ` (calendar-day average; ${t.loggedDays} of ${t.window} days logged)`
              : "";
        parts.push(`  ${t.n}d avg: ${round(t.avg, decimals)}${unit}${note}`);
    }
    if (targetApplies(target, direction)) {
        const limit = target!;
        // Displayed at the nutrient's own precision; the comparisons below stay
        // on the raw stored figure, so rounding the label can never move a day
        // across the line it is being judged against.
        const shownLimit = round(limit, decimals);
        if (direction === "ceiling") {
            // A limit is not something to land within ±10% of — hitting a sugar
            // cap dead-on is not the goal. Count the misses rather than the
            // wins: "Days under limit" would score every never-logged day as a
            // success, and a high hit-rate on a cap reads as praise for it.
            const daysOver = values.filter((v) => v > limit).length;
            parts.push(`  Limit: ${shownLimit}${unit}`);
            parts.push(`  Days over limit: ${daysOver}${of}`);
        } else {
            // targetApplies(…, "floor") above already requires limit > 0, so
            // withinBand's own `target > 0` guard changes nothing here.
            const daysOnTarget = values.filter((v) =>
                withinBand(v, limit),
            ).length;
            parts.push(`  Target: ${shownLimit}${unit}`);
            parts.push(`  Days within ±10% of target: ${daysOnTarget}${of}`);
        }
    }
    const sd = stdDev(values);
    const m = mean(values);
    const cv = m > 0 ? (sd / m) * 100 : 0;
    // The CV keeps a decimal whatever the nutrient: it is a ratio in percent,
    // not a quantity in `unit`, so the precision argument above does not apply.
    parts.push(`  Std dev: ${round(sd, decimals)}${unit} (CV ${round(cv)}%)`);
    return parts.join("\n");
}

export function computeTrends(
    buckets: DailyBucket[],
    goals: NutritionGoals | null,
): string {
    if (buckets.length === 0) return "No data in range.";

    const logged = buckets.filter(nonEmpty);
    // Calories/protein/carbs/fat/water: every day counts, as they always have.
    // Fiber/sugar/added sugar/alcohol/caffeine: only the days that carry them
    // (coveredSeries).
    const alcoholSeries = coveredSeries(buckets, "alcohol_g");
    const caffeineSeries = coveredSeries(buckets, "caffeine_mg");

    const sections: string[] = [];
    const push = (line: string | null) => {
        if (line != null) sections.push(line);
    };

    sections.push(
        `Trends — ${buckets[0]!.date} to ${buckets[buckets.length - 1]!.date} (${buckets.length} days)`,
    );

    // Logging activity
    sections.push(
        [
            "Logging activity:",
            `  Days with any log: ${logged.length}/${buckets.length} (${round((logged.length / buckets.length) * 100, 0)}%)`,
            `  Current logging streak: ${currentStreak(buckets, nonEmpty)} days`,
            `  Longest logging streak: ${longestStreak(buckets, nonEmpty)} days`,
        ].join("\n"),
    );

    // Macro/calorie stats
    push(
        formatStatLine(
            "Calories",
            " kcal",
            fullSeries(buckets, "calories"),
            goals?.daily_calories ?? null,
        ),
    );
    push(
        formatStatLine(
            "Protein",
            "g",
            fullSeries(buckets, "protein_g"),
            goals?.daily_protein_g ?? null,
        ),
    );
    push(
        formatStatLine(
            "Carbs",
            "g",
            fullSeries(buckets, "carbs_g"),
            goals?.daily_carbs_g ?? null,
        ),
    );
    push(
        formatStatLine(
            "Fat",
            "g",
            fullSeries(buckets, "fat_g"),
            goals?.daily_fat_g ?? null,
        ),
    );
    // Saturated fat is part of the fat above, with a daily ceiling (the
    // guidance figures are set on it). Trans fat is tracked with no limit.
    // Both follow the added-sugar pattern: a window with no recorded value
    // drops the block, except that a set ceiling says "not recorded" instead.
    const saturatedLimit = goals?.daily_saturated_fat_g ?? null;
    const saturatedStat = formatStatLine(
        "Saturated fat",
        "g",
        coveredSeries(buckets, "saturated_fat_g"),
        saturatedLimit,
        "ceiling",
    );
    push(
        saturatedStat ??
            (targetApplies(saturatedLimit, "ceiling")
                ? `Saturated fat: ${limitNotRecorded("period", saturatedLimit!)}`
                : null),
    );
    push(
        formatStatLine(
            "Trans fat",
            "g",
            coveredSeries(buckets, "trans_fat_g"),
            null,
        ),
    );
    // Fiber and sugar are never gated by a preference, but a window with no
    // fiber data at all has nothing to say — formatStatLine returns null and
    // the section disappears rather than reading "0g" against a 30g target.
    push(
        formatStatLine(
            "Fiber",
            "g",
            coveredSeries(buckets, "fiber_g"),
            goals?.daily_fiber_g ?? null,
        ),
    );
    push(
        formatStatLine(
            "Sugar",
            "g",
            coveredSeries(buckets, "sugar_g"),
            goals?.daily_sugar_g ?? null,
            "ceiling",
        ),
    );
    // Added sugar is part of the sugar above, with its own ceiling — the one
    // public guidance figures (AHA, DGA) actually set. Expected on every meal
    // like sugar, so no positive-only suppression: a window of recorded zeros
    // is a real "0g", and 0 is a real limit. Meals from before it shipped are
    // NULL, so their days drop out of the series (and the day count) rather
    // than reading as days under the limit.
    // A window with no recorded value at all drops the stat block like fiber
    // — unless a limit is set, where a vanished row lets total sugar be read
    // against the added-sugar limit; it then says "not recorded" instead.
    const addedSugarLimit = goals?.daily_added_sugar_g ?? null;
    const addedSugarStat = formatStatLine(
        "Added sugar",
        "g",
        coveredSeries(buckets, "added_sugar_g"),
        addedSugarLimit,
        "ceiling",
    );
    push(
        addedSugarStat ??
            (targetApplies(addedSugarLimit, "ceiling")
                ? `Added sugar: ${limitNotRecorded("period", addedSugarLimit!)}`
                : null),
    );
    // Alcohol only appears once there is alcohol to talk about — a recorded but
    // flat-zero series is suppressed too (that is also how mcp.ts's opt-in
    // reaches this module: it zeroes the series).
    if (hasAnyPositive(alcoholSeries.values)) {
        push(
            formatStatLine(
                "Alcohol",
                "g",
                alcoholSeries,
                goals?.daily_alcohol_g ?? null,
                "ceiling",
            ),
        );
    }
    // Caffeine is milligrams, and a ceiling: the guidelines people set against
    // it (EFSA's 400 mg/day) are limits, and 0 mg is a meaningful one. It is a
    // stat line and nothing more — it carries no energy, so it never enters the
    // calorie figures above or any macro split. Suppression is data-driven only:
    // there is no caffeine equivalent of alcohol_tracking_enabled in mcp.ts, so
    // this check is what keeps a pre-feature history from reading "0 mg". The
    // trailing 0 is the decimal count: whole milligrams, matching mcp.ts.
    if (hasAnyPositive(caffeineSeries.values)) {
        push(
            formatStatLine(
                "Caffeine",
                " mg",
                caffeineSeries,
                goals?.daily_caffeine_mg ?? null,
                "ceiling",
                0,
            ),
        );
    }
    push(
        formatStatLine(
            "Water",
            " ml",
            fullSeries(buckets, "waterMl"),
            goals?.daily_water_ml ?? null,
        ),
    );

    // Best / worst day (by calorie target proximity if goals set, else raw extremes on logged days)
    if (logged.length > 0) {
        let best: DailyBucket | null = null;
        let worst: DailyBucket | null = null;
        const target = goals?.daily_calories ?? null;
        if (target != null && target > 0) {
            let bestDist = Infinity;
            let worstDist = -Infinity;
            for (const b of logged) {
                const dist = Math.abs(b.calories - target);
                if (dist < bestDist) {
                    bestDist = dist;
                    best = b;
                }
                if (dist > worstDist) {
                    worstDist = dist;
                    worst = b;
                }
            }
        } else {
            best = logged.reduce((a, b) => (a.calories < b.calories ? a : b));
            worst = logged.reduce((a, b) => (a.calories > b.calories ? a : b));
        }
        if (best && worst) {
            sections.push(
                [
                    "Extremes (by calories):",
                    `  Closest to ${target != null ? "target" : "lowest"}: ${best.date} — ${best.calories} kcal, ${round(best.protein_g)}g P`,
                    `  Furthest / highest: ${worst.date} — ${worst.calories} kcal, ${round(worst.protein_g)}g P`,
                ].join("\n"),
            );
        }
    }

    // Day-of-week averages (calories)
    const dowTotals: number[] = [0, 0, 0, 0, 0, 0, 0];
    const dowCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
    for (const b of buckets) {
        if (!nonEmpty(b)) continue;
        const d = new Date(`${b.date}T00:00:00Z`).getUTCDay();
        dowTotals[d]! += b.calories;
        dowCounts[d]! += 1;
    }
    const dowLines = DOW.map((name, i) => {
        const count = dowCounts[i]!;
        if (count === 0) return `  ${name}: —`;
        return `  ${name}: ${Math.round(dowTotals[i]! / count)} kcal avg`;
    });
    sections.push(["Day-of-week calorie averages:", ...dowLines].join("\n"));

    return sections.join("\n\n");
}

/**
 * Weight is a point measurement (not a daily sum), and multiple weigh-ins per
 * day are allowed — so we aggregate to one value per day by averaging that day's
 * entries (`dailyAverages`), then smooth with the trend EWMA from
 * src/weight-trend.ts. All output is rendered in the user's preferred unit from
 * canonical grams.
 *
 * `entries` may (and from get_weight_trends does) reach back before
 * `startDate`: the trend runs over every day up to `endDate`, so it is settled
 * on the first day shown and equals the widget's `_meta` `trend_latest`. The
 * Latest / Change / Min / Max stats use only the days inside the window; days
 * after `endDate` are ignored.
 */
export function computeWeightTrend(
    entries: readonly WeightRow[],
    startDate: string,
    endDate: string,
    tz: string,
    targetWeightG: number | null,
    unit: WeightUnit,
): string {
    const history = dailyAverages(entries, tz).filter((d) => d.date <= endDate);
    const series = trendSeries(history);
    const days = series.filter((d) => d.date >= startDate);

    if (days.length === 0) {
        return `No weight logged between ${startDate} and ${endDate}.`;
    }

    const fmt = (g: number) => formatWeight(g, unit);
    // Same rule as the widget chip's signed(): a real minus sign (U+2212)
    // and always one decimal, so the text and the chip read identically.
    const signed = (v: number) =>
        `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`;
    // Signed delta rendered in display units.
    const fmtDelta = (g: number) => {
        const v = fromGrams(Math.abs(g), unit);
        const sign = g > 0 ? "+" : g < 0 ? "-" : "";
        return `${sign}${v} ${unit}`;
    };

    const first = days[0]!;
    const last = days[days.length - 1]!;

    const minDay = days.reduce((a, b) => (a.weight_g <= b.weight_g ? a : b));
    const maxDay = days.reduce((a, b) => (a.weight_g >= b.weight_g ? a : b));

    const sections: string[] = [];
    sections.push(
        `Weight trend — ${startDate} to ${endDate} (${days.length} logged day${days.length === 1 ? "" : "s"})`,
    );

    sections.push(
        [
            `Latest: ${fmt(last.weight_g)} (on ${last.date})`,
            `Change over range: ${fmtDelta(last.weight_g - first.weight_g)} (from ${fmt(first.weight_g)} on ${first.date})`,
        ].join("\n"),
    );

    // The rate goes through the same rounding as _meta.weekly_rate (2
    // decimals) and then the 1-decimal display step the widget's chip uses,
    // so the text and the chip cannot disagree.
    const rateG = weeklyRate(series, endDate);
    const rate =
        rateG === null
            ? ""
            : ` (${signed(rateForDisplay(rateInUnit(rateG, unit)))} ${unit}/week over the last 2 weeks)`;
    const trendLines = [`Trend weight: ${fmt(last.trend_g)}${rate}`];
    const origin = series[0]!;
    if (origin.date < startDate) {
        // Rounded display values on both sides, so the stated difference is
        // exactly the difference of the two figures printed beside it.
        const trendNow = fromGrams(last.trend_g, unit);
        const firstW = fromGrams(origin.weight_g, unit);
        const delta = Math.round((trendNow - firstW) * 10) / 10;
        trendLines.push(
            `Since first weigh-in (${origin.date}, ${firstW} ${unit}): ${signed(delta === 0 ? 0 : delta)} ${unit}; trend now ${trendNow} ${unit}.`,
        );
    }
    sections.push(trendLines.join("\n"));

    sections.push(
        [
            "Range:",
            `  Min: ${fmt(minDay.weight_g)} (on ${minDay.date})`,
            `  Max: ${fmt(maxDay.weight_g)} (on ${maxDay.date})`,
        ].join("\n"),
    );

    if (targetWeightG != null && targetWeightG > 0) {
        const delta = last.weight_g - targetWeightG; // positive = above target
        const remaining = fromGrams(Math.abs(delta), unit);
        let goalLine: string;
        if (remaining === 0) {
            goalLine = `At target (${fmt(targetWeightG)}).`;
        } else {
            const direction = delta > 0 ? "to lose" : "to gain";
            goalLine = `${remaining} ${unit} ${direction} to reach target of ${fmt(targetWeightG)}`;
        }
        sections.push(["Goal:", `  ${goalLine}`].join("\n"));
    } else {
        sections.push(
            "(Tip: set a target weight with set_nutrition_goals to track progress toward a goal.)",
        );
    }

    return sections.join("\n\n");
}

export function computeMealPatterns(
    buckets: DailyBucket[],
    tz: string = "UTC",
): string {
    const logged = buckets.filter(nonEmpty);
    if (logged.length === 0) return "No data in range.";

    const sections: string[] = [
        `Patterns — ${buckets[0]!.date} to ${buckets[buckets.length - 1]!.date} (${logged.length} logged days of ${buckets.length})`,
    ];

    // Meal-type presence rates (only counting logged days)
    const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
    const presenceLines: string[] = [];
    for (const t of mealTypes) {
        const withType = logged.filter((b) => b.mealTypes.has(t));
        const rate = (withType.length / logged.length) * 100;
        presenceLines.push(
            `  ${t}: ${withType.length}/${logged.length} days (${round(rate, 0)}%)`,
        );
    }
    sections.push(
        ["Meal-type presence (logged days):", ...presenceLines].join("\n"),
    );

    // Breakfast effect
    const withBreakfast = logged.filter((b) => b.mealTypes.has("breakfast"));
    const withoutBreakfast = logged.filter(
        (b) => !b.mealTypes.has("breakfast"),
    );
    if (withBreakfast.length > 0 && withoutBreakfast.length > 0) {
        const avg = (xs: DailyBucket[], f: keyof DailyBucket) =>
            round(mean(xs.map((b) => b[f] as number)));
        sections.push(
            [
                "Breakfast effect:",
                `  Days WITH breakfast: ${withBreakfast.length} — ${avg(withBreakfast, "calories")} kcal, ${avg(withBreakfast, "protein_g")}g P, ${avg(withBreakfast, "waterMl")} ml water`,
                `  Days WITHOUT breakfast: ${withoutBreakfast.length} — ${avg(withoutBreakfast, "calories")} kcal, ${avg(withoutBreakfast, "protein_g")}g P, ${avg(withoutBreakfast, "waterMl")} ml water`,
                `  Delta: ${round(mean(withBreakfast.map((b) => b.calories)) - mean(withoutBreakfast.map((b) => b.calories)))} kcal`,
            ].join("\n"),
        );
    }

    // High-calorie lunch days
    const lunchKcal = (b: DailyBucket) =>
        b.meals
            .filter((m) => m.meal_type === "lunch")
            .reduce((s, m) => s + (m.calories ?? 0), 0);
    const bigLunchDays = logged.filter((b) => lunchKcal(b) >= 900);
    const normalLunchDays = logged.filter(
        (b) => lunchKcal(b) > 0 && lunchKcal(b) < 900,
    );
    if (bigLunchDays.length > 0 && normalLunchDays.length > 0) {
        sections.push(
            [
                "High-calorie-lunch days (lunch ≥ 900 kcal):",
                `  Frequency: ${bigLunchDays.length}/${logged.length} days`,
                `  Avg daily total on big-lunch days: ${round(mean(bigLunchDays.map((b) => b.calories)))} kcal`,
                `  Avg daily total on normal-lunch days: ${round(mean(normalLunchDays.map((b) => b.calories)))} kcal`,
            ].join("\n"),
        );
    }

    // Late-dinner effect (dinner logged at or after 20:00 local time)
    const isLateDinner = (b: DailyBucket) =>
        b.meals.some((m) => {
            if (m.meal_type !== "dinner") return false;
            const h = hourInTz(m.logged_at, tz);
            return h >= 20 || h < 4;
        });
    const lateDinnerDays = logged.filter(isLateDinner);
    const earlyDinnerDays = logged.filter(
        (b) => b.mealTypes.has("dinner") && !isLateDinner(b),
    );
    if (lateDinnerDays.length > 0 && earlyDinnerDays.length > 0) {
        sections.push(
            [
                "Late-dinner effect (dinner ≥ 20:00 local):",
                `  Late-dinner days: ${lateDinnerDays.length} — avg ${round(mean(lateDinnerDays.map((b) => b.calories)))} kcal, ${round(mean(lateDinnerDays.map((b) => b.protein_g)))}g P`,
                `  Early-dinner days: ${earlyDinnerDays.length} — avg ${round(mean(earlyDinnerDays.map((b) => b.calories)))} kcal, ${round(mean(earlyDinnerDays.map((b) => b.protein_g)))}g P`,
            ].join("\n"),
        );
    }

    // Weekend vs weekday
    const isWeekend = (b: DailyBucket) => {
        const d = new Date(`${b.date}T00:00:00Z`).getUTCDay();
        return d === 0 || d === 6;
    };
    const weekendDays = logged.filter(isWeekend);
    const weekdayDays = logged.filter((b) => !isWeekend(b));
    if (weekendDays.length > 0 && weekdayDays.length > 0) {
        sections.push(
            [
                "Weekend vs weekday:",
                `  Weekday avg: ${round(mean(weekdayDays.map((b) => b.calories)))} kcal, ${round(mean(weekdayDays.map((b) => b.protein_g)))}g P`,
                `  Weekend avg: ${round(mean(weekendDays.map((b) => b.calories)))} kcal, ${round(mean(weekendDays.map((b) => b.protein_g)))}g P`,
            ].join("\n"),
        );
    }

    // Outlier days (> 2 std from mean calories)
    const m = mean(logged.map((b) => b.calories));
    const sd = stdDev(logged.map((b) => b.calories));
    const outliers = logged.filter((b) => Math.abs(b.calories - m) > 2 * sd);
    if (outliers.length > 0 && sd > 0) {
        const lines = outliers
            .sort((a, b) => Math.abs(b.calories - m) - Math.abs(a.calories - m))
            .slice(0, 5)
            .map(
                (b) =>
                    `  ${b.date}: ${b.calories} kcal (${b.calories > m ? "+" : ""}${round(b.calories - m)} vs avg)`,
            );
        sections.push(["Outlier days (>2σ from avg):", ...lines].join("\n"));
    }

    return sections.join("\n\n");
}

export function computeWeeklyDigest(
    buckets: DailyBucket[],
    goals: NutritionGoals | null,
): string {
    if (buckets.length === 0) return "No data in the past week.";

    const logged = buckets.filter(nonEmpty);
    const avgCals = round(mean(buckets.map((b) => b.calories)));
    const avgProtein = round(mean(buckets.map((b) => b.protein_g)));
    const avgCarbs = round(mean(buckets.map((b) => b.carbs_g)));
    const avgFat = round(mean(buckets.map((b) => b.fat_g)));
    // Same rule as computeTrends, so the two narratives cannot disagree: these
    // average over the days that carry them, not over the whole week.
    const covered = (nutrient: PartialNutrient) => {
        const days = buckets.filter((b) => dayCarries(b.meals, nutrient));
        return {
            avg:
                days.length > 0
                    ? round(mean(days.map((b) => b[nutrient])))
                    : null,
            days: days.length,
        };
    };
    const fiber = covered("fiber_g");
    const sugar = covered("sugar_g");
    const addedSugar = covered("added_sugar_g");
    const saturated = covered("saturated_fat_g");
    const trans = covered("trans_fat_g");
    const alcohol = covered("alcohol_g");
    const caffeine = covered("caffeine_mg");
    // Whole milligrams, like every other caffeine figure the model reads (see
    // formatMg in mcp.ts and the trends line's `decimals` argument). Rounded
    // here rather than at the call site so the suppression below is keyed on
    // the figure that would actually be printed.
    const caffeineAvg = caffeine.avg != null ? Math.round(caffeine.avg) : null;
    const avgWater = round(mean(buckets.map((b) => b.waterMl)));
    const totalMeals = buckets.reduce((s, b) => s + b.meals.length, 0);

    const lines: string[] = [];
    lines.push(
        `Weekly digest — ${buckets[0]!.date} to ${buckets[buckets.length - 1]!.date}`,
    );
    lines.push("");
    lines.push(
        `Logged ${logged.length}/${buckets.length} days, ${totalMeals} meals total.`,
    );
    lines.push("");
    // Calories/protein/carbs/fat/water below divide by every day in the week,
    // logged or not; only the partial nutrients carry their own "over N days"
    // note. On a week with gaps say so once in the header rather than on five
    // rows — the "Logged X/N days" line above supplies the count but does not
    // claim to be these averages' denominator. A fully-logged week has nothing
    // to disclose and keeps the original header.
    lines.push(
        logged.length < buckets.length
            ? `Daily averages (per calendar day; ${logged.length} of ${buckets.length} days logged):`
            : "Daily averages:",
    );
    // `noun` is "target" for a floor and "limit" for a ceiling (sugar, added
    // sugar, alcohol, caffeine);
    // calling a sugar cap a "target" invites reading the shortfall as a shortfall.
    const line = (
        label: string,
        val: number,
        unit: string,
        target: number | null,
        noun: "target" | "limit" = "target",
        // Days the figure was drawn from, when that can be fewer than the week.
        days?: number,
    ) => {
        const note =
            days != null && days < buckets.length
                ? ` — over ${days} of ${buckets.length} days with data`
                : "";
        const direction = noun === "limit" ? "ceiling" : "floor";
        if (!targetApplies(target, direction))
            return `  ${label}: ${val}${unit}${note}`;
        // A limit of zero is real (see targetApplies) but has no percentage to
        // take — and "left" wording would be a permission slip either way.
        if (target === 0) {
            const verdict = val > 0 ? `${val}${unit} over` : "clear";
            return `  ${label}: ${val}${unit} / 0${unit} limit (${verdict})${note}`;
        }
        const pct = round((val / target!) * 100, 0);
        return `  ${label}: ${val}${unit} / ${target}${unit} ${noun} (${pct}%)${note}`;
    };
    lines.push(
        line("Calories", avgCals, " kcal", goals?.daily_calories ?? null),
    );
    lines.push(
        line("Protein", avgProtein, "g", goals?.daily_protein_g ?? null),
    );
    lines.push(line("Carbs", avgCarbs, "g", goals?.daily_carbs_g ?? null));
    lines.push(line("Fat", avgFat, "g", goals?.daily_fat_g ?? null));
    // Saturated fat carries a ceiling, so a week with none recorded says so
    // rather than vanishing; trans fat has no limit and no row when unrecorded.
    if (saturated.avg != null) {
        lines.push(
            line(
                "Saturated fat",
                saturated.avg,
                "g",
                goals?.daily_saturated_fat_g ?? null,
                "limit",
                saturated.days,
            ),
        );
    } else if (targetApplies(goals?.daily_saturated_fat_g ?? null, "ceiling")) {
        lines.push(
            `  Saturated fat: ${limitNotRecorded("period", goals!.daily_saturated_fat_g!)}`,
        );
    }
    if (trans.avg != null) {
        lines.push(
            line("Trans fat", trans.avg, "g", null, "target", trans.days),
        );
    }
    // No fiber/sugar data anywhere in the week -> no row, rather than a "0g"
    // that a pre-feature history would make up out of nothing.
    if (fiber.avg != null) {
        lines.push(
            line(
                "Fiber",
                fiber.avg,
                "g",
                goals?.daily_fiber_g ?? null,
                "target",
                fiber.days,
            ),
        );
    }
    if (sugar.avg != null) {
        lines.push(
            line(
                "Sugar",
                sugar.avg,
                "g",
                goals?.daily_sugar_g ?? null,
                "limit",
                sugar.days,
            ),
        );
    }
    // Same gate as sugar: no added-sugar data in the week, no figure. Its days
    // can be fewer than sugar's (meals logged before it shipped carry sugar
    // only), and the "over N of 7 days with data" note says so. With a limit
    // set, a week with none recorded says so rather than vanishing (see
    // limitNotRecorded).
    if (addedSugar.avg != null) {
        lines.push(
            line(
                "Added sugar",
                addedSugar.avg,
                "g",
                goals?.daily_added_sugar_g ?? null,
                "limit",
                addedSugar.days,
            ),
        );
    } else if (targetApplies(goals?.daily_added_sugar_g ?? null, "ceiling")) {
        lines.push(
            `  Added sugar: ${limitNotRecorded("period", goals!.daily_added_sugar_g!)}`,
        );
    }
    // Suppressed for the same reason as the trends line (see hasAnyPositive), but
    // keyed on the rendered average rather than the raw series: a row reading
    // "Alcohol: 0g" is exactly the noise the suppression exists to avoid.
    if (alcohol.avg != null && alcohol.avg > 0) {
        lines.push(
            line(
                "Alcohol",
                alcohol.avg,
                "g",
                goals?.daily_alcohol_g ?? null,
                "limit",
                alcohol.days,
            ),
        );
    }
    // Same suppression, and for caffeine it is the only one there is (no profile
    // flag by design — see hasAnyPositive). A row reading "Caffeine: 0 mg" for
    // someone who has never recorded a cup is exactly what it exists to avoid.
    if (caffeineAvg != null && caffeineAvg > 0) {
        lines.push(
            line(
                "Caffeine",
                caffeineAvg,
                " mg",
                // The limit is rendered at the same whole-milligram precision
                // as the figure it is compared against, and as formatGoals in
                // mcp.ts already echoes it. daily_caffeine_mg is numeric(7,2),
                // so it is the one goal column that can carry a stray decimal.
                goals?.daily_caffeine_mg != null
                    ? Math.round(goals.daily_caffeine_mg)
                    : null,
                "limit",
                caffeine.days,
            ),
        );
    }
    lines.push(line("Water", avgWater, " ml", goals?.daily_water_ml ?? null));

    // Best and worst day this week (by calorie target if set)
    if (logged.length > 0) {
        const target = goals?.daily_calories ?? null;
        let best: DailyBucket;
        let worst: DailyBucket;
        if (target != null && target > 0) {
            best = logged.reduce((a, b) =>
                Math.abs(a.calories - target) <= Math.abs(b.calories - target)
                    ? a
                    : b,
            );
            worst = logged.reduce((a, b) =>
                Math.abs(a.calories - target) >= Math.abs(b.calories - target)
                    ? a
                    : b,
            );
        } else {
            best = logged.reduce((a, b) => (a.calories < b.calories ? a : b));
            worst = logged.reduce((a, b) => (a.calories > b.calories ? a : b));
        }
        lines.push("");
        lines.push(
            `Best day: ${best.date} (${best.calories} kcal, ${round(best.protein_g)}g P)`,
        );
        lines.push(
            `Roughest day: ${worst.date} (${worst.calories} kcal, ${round(worst.protein_g)}g P)`,
        );
    }

    if (!goals) {
        lines.push("");
        lines.push(
            "(Tip: with daily targets set via set_nutrition_goals, future digests include target-based coaching.)",
        );
    }

    return lines.join("\n");
}
