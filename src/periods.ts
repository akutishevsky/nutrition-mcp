import type { Meal } from "./supabase.js";
import { buildDailyBuckets, withinBand } from "./insights.js";
import {
    goalsOnDate,
    type GoalValues,
    type NutritionGoalsHistoryRow,
} from "./goals-history.js";
import { dateInTz, shiftLocalDate } from "./tz.js";
import { isoWeekStart } from "./weight-trend.js";

/**
 * Period averages against goals: `get_trends`' `group_by` view. One row per
 * week / month / quarter / year, each the average PER LOGGED DAY (not per
 * calendar day, unlike the trailing 7/14/30 figures) set against the targets
 * that were in effect at the time, with how many days it rests on, how many of
 * them were on target and how many look incomplete — an average alone hides
 * alternating 1,500 and 2,900 kcal days.
 *
 * Pure: no Supabase, never imports mcp.ts. The handler reads one meal window
 * (`yearSpanStart` .. end date) and the goals history, and builds all four
 * granularities from it.
 */

export { withinBand };

export type Granularity = "week" | "month" | "quarter" | "year";

export const GRANULARITIES: readonly Granularity[] = [
    "week",
    "month",
    "quarter",
    "year",
];

/** Rows per granularity, ending with the period that contains the end date:
 * about 6 months of weeks, 2 years of months, 3 of quarters, 5 of years. */
export const PERIOD_ROW_COUNTS: Record<Granularity, number> = {
    week: 26,
    month: 24,
    quarter: 12,
    year: 5,
};

export const PERIOD_AVERAGES_META_VERSION = 1;

/** One local calendar day's meal totals. `meal_count` is the number of meals;
 * water is deliberately absent — it never makes a day "logged" here. */
export interface DayTotals {
    date: string;
    meal_count: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
}

export interface PeriodMacros {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

/** A field is null when that goal is unset (null, or a zero floor, which
 * insights.ts's targetApplies also treats as unset). */
export interface PeriodTargets {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
}

export interface PeriodRow {
    key: string;
    /** First local date of the period. */
    start: string;
    /** Last local date of the period — NOT clipped to the end date; `days`
     * and `partial` say how much of it has happened. */
    end: string;
    /** Calendar days in the period, clipped to the end date. */
    days: number;
    /** The period is not over as of the end date. */
    partial: boolean;
    /** Days with at least one meal. */
    logged_days: number;
    /** Unrounded means per logged day; null when nothing was logged. */
    avg: PeriodMacros | null;
    /** The goal in effect on the period's last (clipped) day; null when there
     * is no goals history at all. */
    targets: PeriodTargets | null;
    /** The four macro goals differ between some days of the (clipped) period. */
    targets_changed: boolean;
    /** Some (clipped) day predates the goals history, so the earliest
     * recorded goal was assumed for it. */
    targets_assumed: boolean;
    /** Logged days on which every macro with a target that day is within
     * ±10% of it; null when no day of the period has any of the four targets. */
    on_target_days: number | null;
    /** Logged days under 50% of that day's calorie target; null when no
     * calorie target applies anywhere in the period. */
    incomplete_days: number | null;
}

export interface PeriodAveragesMeta {
    v: 1;
    end_date: string;
    group_by: Granularity;
    /** First local date goals history covers (`targetsRecordedFrom`) — the
     * {date} of "targets before {date} not recorded". Null without history. */
    targets_from: string | null;
    periods: Record<Granularity, PeriodRow[]>;
}

/** Below this share of the day's calorie target a logged day is flagged as
 * possibly incomplete. It stays in the average either way: guessing which
 * days are real would make the average unexplainable. */
const INCOMPLETE_SHARE = 0.5;

function pad2(n: number): string {
    return String(n).padStart(2, "0");
}

function ymd(date: string): [number, number, number] {
    const [y, m, d] = date.split("-").map(Number);
    return [y!, m!, d!];
}

function lastDayOfMonth(y: number, m: number): number {
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** The key of the period containing a local `YYYY-MM-DD` date: the ISO week's
 * Monday (`YYYY-MM-DD`), `YYYY-MM`, `YYYY-Qn` or `YYYY`. */
export function periodKey(date: string, g: Granularity): string {
    const [y, m] = ymd(date);
    switch (g) {
        case "week":
            return isoWeekStart(date);
        case "month":
            return `${y}-${pad2(m)}`;
        case "quarter":
            return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
        case "year":
            return String(y);
    }
}

/** First and last local date of a period, both inclusive. */
export function periodBounds(
    key: string,
    g: Granularity,
): { start: string; end: string } {
    switch (g) {
        case "week":
            return { start: key, end: shiftLocalDate(key, 6) };
        case "month": {
            const [y, m] = key.split("-").map(Number) as [number, number];
            return {
                start: `${key}-01`,
                end: `${key}-${pad2(lastDayOfMonth(y, m))}`,
            };
        }
        case "quarter": {
            const [ys, qs] = key.split("-Q");
            const y = Number(ys);
            const q = Number(qs);
            const firstMonth = (q - 1) * 3 + 1;
            const lastMonth = firstMonth + 2;
            return {
                start: `${y}-${pad2(firstMonth)}-01`,
                end: `${y}-${pad2(lastMonth)}-${pad2(lastDayOfMonth(y, lastMonth))}`,
            };
        }
        case "year":
            return { start: `${key}-01-01`, end: `${key}-12-31` };
    }
}

/** Jan 1 of the fourth year before the end date's: the one read window that
 * covers every granularity (5 years is the longest span; 26 weeks, 24 months
 * and 12 quarters all fit inside it). */
export function yearSpanStart(endDate: string): string {
    const [y] = ymd(endDate);
    return `${y - 4}-01-01`;
}

/** Per-day meal totals for every date in [startDate, endDate], summed by
 * buildDailyBuckets — the very summation `get_trends` and, meal for meal,
 * `get_nutrition_summary` use — so a period average and the summary's
 * logged-day average agree on a shared window. */
export function dayTotalsFromMeals(
    meals: Meal[],
    startDate: string,
    endDate: string,
    tz: string,
): DayTotals[] {
    return buildDailyBuckets(meals, [], startDate, endDate, tz).map((b) => ({
        date: b.date,
        meal_count: b.meals.length,
        calories: b.calories,
        protein_g: b.protein_g,
        carbs_g: b.carbs_g,
        fat_g: b.fat_g,
    }));
}

/** A floor target as `PeriodTargets` reports it: null unless positive. */
function floorTarget(v: number | null): number | null {
    return v != null && v > 0 ? v : null;
}

function targetsOf(goals: GoalValues): PeriodTargets {
    return {
        calories: floorTarget(goals.daily_calories),
        protein: floorTarget(goals.daily_protein_g),
        carbs: floorTarget(goals.daily_carbs_g),
        fat: floorTarget(goals.daily_fat_g),
    };
}

function sameTargets(a: PeriodTargets, b: PeriodTargets): boolean {
    return (
        a.calories === b.calories &&
        a.protein === b.protein &&
        a.carbs === b.carbs &&
        a.fat === b.fat
    );
}

function hasAnyTarget(t: PeriodTargets): boolean {
    return (
        t.calories != null ||
        t.protein != null ||
        t.carbs != null ||
        t.fat != null
    );
}

/** A logged day is on target when each of the four macros that has a target
 * that day is within ±10% of that day's own goal. A macro with a target but
 * no value that day sums to 0 and so counts as missed. */
function dayOnTarget(day: DayTotals, t: PeriodTargets): boolean {
    const pairs: [number, number | null][] = [
        [day.calories, t.calories],
        [day.protein_g, t.protein],
        [day.carbs_g, t.carbs],
        [day.fat_g, t.fat],
    ];
    return pairs.every(
        ([v, target]) => target == null || withinBand(v, target),
    );
}

/** A logged day is one with at least one MEAL. Deliberately stricter than
 * insights.ts's `nonEmpty`, which also counts a water-only day: a day with
 * water and no food is not a day whose eating can be averaged, and counting
 * it would drag the per-logged-day average towards zero. */
function isLogged(day: DayTotals | undefined): day is DayTotals {
    return day !== undefined && day.meal_count >= 1;
}

interface DayGoals {
    targets: PeriodTargets;
    assumed: boolean;
}

function buildRow(
    key: string,
    g: Granularity,
    byDate: ReadonlyMap<string, DayTotals>,
    goalsFor: (date: string) => DayGoals | null,
    endDate: string,
): PeriodRow {
    const { start, end } = periodBounds(key, g);
    const lastDay = end < endDate ? end : endDate;
    const partial = end > endDate;

    let days = 0;
    let loggedDays = 0;
    // Summed in ascending date order over day totals, then divided once — the
    // same order and arithmetic as get_nutrition_summary's rangeAverages.
    let cal = 0;
    let pro = 0;
    let carb = 0;
    let fat = 0;
    let onTarget = 0;
    let incomplete = 0;
    let anyTarget = false;
    let anyCalorieTarget = false;
    let assumed = false;
    let changed = false;
    let firstTargets: PeriodTargets | null = null;
    let lastGoals: DayGoals | null = null;

    for (let d = start; d <= lastDay; d = shiftLocalDate(d, 1)) {
        days++;
        const goals = goalsFor(d);
        lastGoals = goals;
        if (goals) {
            // An assumption about targets matters only where there are any.
            if (goals.assumed && hasAnyTarget(goals.targets)) assumed = true;
            if (firstTargets === null) firstTargets = goals.targets;
            else if (!sameTargets(firstTargets, goals.targets)) changed = true;
            if (hasAnyTarget(goals.targets)) anyTarget = true;
            if (goals.targets.calories != null) anyCalorieTarget = true;
        }
        const day = byDate.get(d);
        if (!isLogged(day)) continue;
        loggedDays++;
        cal += day.calories;
        pro += day.protein_g;
        carb += day.carbs_g;
        fat += day.fat_g;
        if (goals) {
            if (hasAnyTarget(goals.targets) && dayOnTarget(day, goals.targets))
                onTarget++;
            const calTarget = goals.targets.calories;
            if (
                calTarget != null &&
                day.calories < calTarget * INCOMPLETE_SHARE
            )
                incomplete++;
        }
    }

    return {
        key,
        start,
        end,
        days,
        partial,
        logged_days: loggedDays,
        avg:
            loggedDays === 0
                ? null
                : {
                      calories: cal / loggedDays,
                      protein: pro / loggedDays,
                      carbs: carb / loggedDays,
                      fat: fat / loggedDays,
                  },
        // Null, not an all-null object, when none of the four macros has a
        // target (history holding only water, fiber or a target weight), so
        // "no targets" is one test for every reader.
        targets:
            lastGoals && hasAnyTarget(lastGoals.targets)
                ? lastGoals.targets
                : null,
        targets_changed: changed,
        targets_assumed: assumed,
        on_target_days: anyTarget ? onTarget : null,
        incomplete_days: anyCalorieTarget ? incomplete : null,
    };
}

function goalsResolver(
    history: readonly NutritionGoalsHistoryRow[],
    tz: string,
): (date: string) => DayGoals | null {
    const cache = new Map<string, DayGoals | null>();
    return (date) => {
        if (cache.has(date)) return cache.get(date)!;
        const found = goalsOnDate(history, date, tz);
        const out = found
            ? { targets: targetsOf(found.goals), assumed: found.assumed }
            : null;
        cache.set(date, out);
        return out;
    };
}

function rowsFor(
    byDate: ReadonlyMap<string, DayTotals>,
    firstLogged: string | null,
    goalsFor: (date: string) => DayGoals | null,
    endDate: string,
    g: Granularity,
): PeriodRow[] {
    if (firstLogged === null) return [];
    const firstKey = periodKey(firstLogged, g);
    const rows: PeriodRow[] = [];
    let key = periodKey(endDate, g);
    for (let i = 0; i < PERIOD_ROW_COUNTS[g]; i++) {
        // Periods before the first logged meal are dropped; an empty period
        // after it is kept — the gap is the information.
        if (periodBounds(key, g).end < periodBounds(firstKey, g).start) break;
        rows.push(buildRow(key, g, byDate, goalsFor, endDate));
        key = periodKey(shiftLocalDate(periodBounds(key, g).start, -1), g);
    }
    return rows;
}

/** `loggedFrom`, when given, is a date at or before the user's first logged
 * day — the start of the read span when meals exist before it — so empty
 * periods between that history and the first meal inside the span stay inner
 * gaps rather than being cut as leading ones. */
function indexDays(
    days: readonly DayTotals[],
    endDate: string,
    loggedFrom: string | null = null,
) {
    const byDate = new Map<string, DayTotals>();
    let firstLogged: string | null =
        loggedFrom !== null && loggedFrom <= endDate ? loggedFrom : null;
    for (const d of days) {
        byDate.set(d.date, d);
        if (
            isLogged(d) &&
            d.date <= endDate &&
            (firstLogged === null || d.date < firstLogged)
        )
            firstLogged = d.date;
    }
    return { byDate, firstLogged };
}

/** Period rows NEWEST FIRST: at most `PERIOD_ROW_COUNTS[g]`, ending with the
 * period containing `endDate`. Periods before the first logged day are
 * dropped; empty periods after it are kept. Days missing from `days` count as
 * unlogged. `history` must be ascending by `effective_at`. `loggedFrom`: see
 * `indexDays` — pass the span start when meals exist before `days` begins. */
export function buildPeriodRows(
    days: readonly DayTotals[],
    history: readonly NutritionGoalsHistoryRow[],
    endDate: string,
    g: Granularity,
    tz: string,
    loggedFrom: string | null = null,
): PeriodRow[] {
    const { byDate, firstLogged } = indexDays(days, endDate, loggedFrom);
    return rowsFor(byDate, firstLogged, goalsResolver(history, tz), endDate, g);
}

/** All four granularities from one read, for the result's `_meta`. */
export function buildPeriodAveragesMeta(
    days: readonly DayTotals[],
    history: readonly NutritionGoalsHistoryRow[],
    endDate: string,
    groupBy: Granularity,
    tz: string,
    loggedFrom: string | null = null,
): PeriodAveragesMeta {
    const { byDate, firstLogged } = indexDays(days, endDate, loggedFrom);
    const goalsFor = goalsResolver(history, tz);
    const periods = {} as Record<Granularity, PeriodRow[]>;
    for (const g of GRANULARITIES) {
        periods[g] = rowsFor(byDate, firstLogged, goalsFor, endDate, g);
    }
    return {
        v: 1,
        end_date: endDate,
        group_by: groupBy,
        targets_from: targetsRecordedFrom(history, tz),
        periods,
    };
}

/** The local date from which goals are recorded — what "targets before
 * <date> not recorded" names. Null without history. */
export function targetsRecordedFrom(
    history: readonly NutritionGoalsHistoryRow[],
    tz: string,
): string | null {
    const first = history[0];
    return first ? dateInTz(first.effective_at, tz) : null;
}

const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

function shortDate(date: string, withYear: boolean): string {
    const [y, m, d] = ymd(date);
    return `${MONTHS[m - 1]} ${d}${withYear ? `, ${y}` : ""}`;
}

/** English period label for model-facing text: "Mar 30 – Apr 5, 2026",
 * "Dec 29, 2025 – Jan 4, 2026", "Mar 2026", "Q1 2026", "2026". */
export function periodLabel(
    row: Pick<PeriodRow, "key" | "start" | "end">,
    g: Granularity,
): string {
    switch (g) {
        case "week": {
            const crosses = row.start.slice(0, 4) !== row.end.slice(0, 4);
            return `${shortDate(row.start, crosses)} – ${shortDate(row.end, true)}`;
        }
        case "month": {
            const [y, m] = ymd(row.start);
            return `${MONTHS[m - 1]} ${y}`;
        }
        case "quarter": {
            const [y, q] = row.key.split("-");
            return `${q} ${y}`;
        }
        case "year":
            return row.key;
    }
}

function whole(n: number): string {
    return Math.round(n).toLocaleString("en-US");
}

const NOUN: Record<Granularity, string> = {
    week: "weeks",
    month: "months",
    quarter: "quarters",
    year: "years",
};

/** The header line of the period block. */
export const PERIOD_HEADER =
    "Averages per logged day (days with no meals are excluded), vs the targets in effect at the time.";
export const PERIOD_HEADER_NO_TARGETS =
    "Averages per logged day (days with no meals are excluded). No nutrition targets are set.";

function formatRow(
    row: PeriodRow,
    g: Granularity,
    recordedFrom: string | null,
): string {
    const parts = [
        `${periodLabel(row, g)}${row.partial ? " (partial)" : ""}`,
        `${row.logged_days}/${row.days} days logged`,
    ];
    const avg = row.avg;
    if (avg) {
        const t = row.targets;
        parts.push(
            `${whole(avg.calories)} kcal${t?.calories != null ? ` (target ${whole(t.calories)})` : ""}`,
        );
        const macro = (label: string, v: number, target: number | null) =>
            `${label} ${whole(v)}${target != null ? `/${whole(target)}` : ""} g`;
        parts.push(macro("P", avg.protein, t?.protein ?? null));
        parts.push(macro("C", avg.carbs, t?.carbs ?? null));
        parts.push(macro("F", avg.fat, t?.fat ?? null));
        if (row.on_target_days != null)
            parts.push(`on target ${row.on_target_days}/${row.logged_days}`);
        if (row.incomplete_days != null && row.incomplete_days > 0)
            parts.push(`${row.incomplete_days} possibly incomplete`);
    }
    if (row.targets != null || row.targets_changed) {
        if (row.targets_changed) parts.push("targets changed mid-period");
        if (row.targets_assumed)
            parts.push(
                recordedFrom
                    ? `targets before ${recordedFrom} not recorded`
                    : "targets before the first recorded goal not recorded",
            );
    }
    return parts.join(" · ");
}

/** The model-facing period block: a header line, then one line per row,
 * newest first. `recordedFrom` (see `targetsRecordedFrom`) names the date in
 * "targets before <date> not recorded". */
export function formatPeriodContent(
    rows: PeriodRow[],
    g: Granularity,
    recordedFrom: string | null = null,
): string {
    if (rows.length === 0)
        return `Averages per logged day: no meals logged in the last ${PERIOD_ROW_COUNTS[g]} ${NOUN[g]}.`;
    const anyTargets = rows.some((r) => r.targets != null);
    const header = anyTargets ? PERIOD_HEADER : PERIOD_HEADER_NO_TARGETS;
    return [header, ...rows.map((r) => formatRow(r, g, recordedFrom))].join(
        "\n",
    );
}
