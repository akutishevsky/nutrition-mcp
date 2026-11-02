/**
 * Active calories: energy burned in exercise, logged beside intake (issue #220).
 * Pure — no Supabase, no Hono, never imports mcp.ts. The rows come from
 * `active_calories_log` (supabase/migrations/20261102120000_active_calories.sql)
 * through supabase.ts; this module only decides what they add up to.
 *
 * Two rules are load-bearing:
 *
 * - The credit percentage is snapshotted on each row when it is written. A
 *   later change to the profile's activity_credit_pct does not rewrite past
 *   days, so every sum here reads `credit_pct` off the row, never the profile.
 * - Activity never changes the calorie goal. `netIntakeKcal` and
 *   `deficitVsGoal` report the difference beside the goal and nothing else.
 *
 * Activity is never called "earned" food anywhere in the text built from here.
 */

import { dateInTz } from "./tz.js";

/** Smallest and largest kcal a single entry may carry. */
export const ACTIVE_KCAL_MIN = 1;
export const ACTIVE_KCAL_MAX = 10_000;

/** Credit percentage used when the profile has none set. */
export const ACTIVITY_CREDIT_DEFAULT_PCT = 100;

/** Caller-facing message for a bad kcal value, or null when it is valid. The
 * handler throws it as a ToolError: bounds live in the handler, not in the
 * Zod schema, so a bad value keeps its own message. */
export function activeKcalError(kcal: number): string | null {
    if (!Number.isInteger(kcal)) {
        return `kcal must be a whole number of kilocalories, got ${kcal}.`;
    }
    if (kcal < ACTIVE_KCAL_MIN) {
        return `kcal must be between ${ACTIVE_KCAL_MIN} and ${ACTIVE_KCAL_MAX} (got ${kcal}).`;
    }
    if (kcal > ACTIVE_KCAL_MAX) {
        // Only an over-maximum value suggests a merged period: a small or
        // zero figure is just out of range.
        return `kcal must be between ${ACTIVE_KCAL_MIN} and ${ACTIVE_KCAL_MAX} (got ${kcal}). Log one workout or activity period per entry.`;
    }
    return null;
}

/** Caller-facing message for a bad credit percentage, or null when valid.
 * null is handled by the caller (it means "reset to the default"). */
export function creditPctError(pct: number): string | null {
    if (!Number.isInteger(pct) || pct < 0 || pct > 100) {
        return `percent must be a whole number from 0 to 100 (got ${pct}), or null to reset to the default of 100.`;
    }
    return null;
}

/** The credit percentage to apply: the stored value when it is a whole number
 * from 0 to 100, otherwise the default of 100. A null column is "never set". */
export function activityCreditPct(stored: number | null | undefined): number {
    if (
        typeof stored === "number" &&
        Number.isInteger(stored) &&
        stored >= 0 &&
        stored <= 100
    ) {
        return stored;
    }
    return ACTIVITY_CREDIT_DEFAULT_PCT;
}

/** kcal counted against intake for one entry: kcal × credit_pct / 100, rounded
 * to a whole kcal. */
export function creditedKcal(kcal: number, creditPct: number): number {
    return Math.round((kcal * creditPct) / 100);
}

export interface ActivityEntry {
    logged_at: string;
    kcal: number;
    credit_pct: number;
}

export interface ActivityTotals {
    burned_kcal: number;
    credited_kcal: number;
}

/** Burned and credited totals for a set of entries. Credit is summed exactly
 * and rounded once, so the day's figure is not the sum of rounded entries. */
export function sumActivity(entries: readonly ActivityEntry[]): ActivityTotals {
    let burned = 0;
    let credited = 0;
    for (const e of entries) {
        burned += e.kcal;
        credited += (e.kcal * e.credit_pct) / 100;
    }
    return { burned_kcal: burned, credited_kcal: Math.round(credited) };
}

/** Intake minus the credited activity: the net the day is judged on. */
export function netIntakeKcal(
    intakeKcal: number,
    creditedKcal: number,
): number {
    return intakeKcal - creditedKcal;
}

/** How far under the goal the net sits (positive) or over it (negative). Only
 * meaningful when a calorie goal exists; callers skip it otherwise. */
export function deficitVsGoal(goalKcal: number, netKcal: number): number {
    return goalKcal - netKcal;
}

/** Per-day totals keyed by local YYYY-MM-DD in `tz`, for the days that carry
 * at least one entry. Days without entries are absent, not zero. */
export function activityByDate(
    entries: readonly ActivityEntry[],
    tz: string,
): Map<string, ActivityTotals> {
    const byDay = new Map<string, ActivityEntry[]>();
    for (const e of entries) {
        const date = dateInTz(e.logged_at, tz);
        const bucket = byDay.get(date);
        if (bucket) bucket.push(e);
        else byDay.set(date, [e]);
    }
    const out = new Map<string, ActivityTotals>();
    for (const [date, list] of byDay) out.set(date, sumActivity(list));
    return out;
}

export interface ActivityMetaDay {
    /** Local date, YYYY-MM-DD, in the account's timezone. */
    date: string;
    burned_kcal: number;
    credited_kcal: number;
}

/** `_meta` payload under ACTIVITY_META_KEY (src/widgets.ts). Carried in the
 * result's `_meta`, never structuredContent, because output schemas are frozen. */
export interface ActivityMeta {
    v: 1;
    days: ActivityMetaDay[];
}

/**
 * The widget payload from per-day totals (the map activityByDate returns):
 * only days that carry activity, ascending by date. Callers that already
 * grouped the period by day pass that map, so `_meta` and the text cannot
 * drift apart. Returns undefined for an empty map, so the caller omits the key.
 */
export function activityMetaFromDays(
    byDay: ReadonlyMap<string, ActivityTotals>,
): ActivityMeta | undefined {
    if (byDay.size === 0) return undefined;
    const days = [...byDay]
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([date, totals]) => ({
            date,
            burned_kcal: totals.burned_kcal,
            credited_kcal: totals.credited_kcal,
        }));
    return { v: 1, days };
}

/**
 * The widget payload for one tool's period, from its raw rows. `entries` must
 * already be the period's rows (the caller reads them through
 * selectLoggedWindow). Returns undefined when there is no activity at all.
 */
export function buildActivityMeta(
    entries: readonly ActivityEntry[],
    tz: string,
): ActivityMeta | undefined {
    if (entries.length === 0) return undefined;
    return activityMetaFromDays(activityByDate(entries, tz));
}

/**
 * Derived idempotency key for an activity write, in the same `auto:<sha256>`
 * shape deriveIdempotencyKey (supabase.ts) gives water. The credit percentage
 * is deliberately NOT a part: a retry after the preference changed is still the
 * same burn, and must dedupe rather than insert a second row.
 */
export function activityIdempotencyKey(
    parts: readonly (string | number | null | undefined)[],
): string {
    const digest = new Bun.CryptoHasher("sha256")
        .update(parts.map((p) => p ?? "").join("\u0000"))
        .digest("hex");
    return `auto:${digest}`;
}

/** Whole kilocalories with thousands separators, as every kcal figure reads. */
export function formatKcal(n: number): string {
    return Math.round(n).toLocaleString("en-US");
}

/** The credited share of what was burned, as a whole percentage. */
function creditShare(totals: ActivityTotals): number {
    if (totals.burned_kcal <= 0) return ACTIVITY_CREDIT_DEFAULT_PCT;
    return Math.round((totals.credited_kcal / totals.burned_kcal) * 100);
}

/**
 * One day's activity line for get_nutrition_summary (per day) and
 * get_goal_progress. `intakeKcal` is the day's intake, or null when no meal was
 * logged: there is then no net to report, and a negative "net" would read as a
 * real figure. `goalKcal` is the calorie goal in effect for that day, or null
 * when none is set; the goal is only ever compared with, never changed.
 */
export function activityDayLine(input: {
    totals: ActivityTotals;
    intakeKcal: number | null;
    goalKcal: number | null;
}): string {
    const { totals, intakeKcal, goalKcal } = input;
    const head = `Active calories: burned ${formatKcal(totals.burned_kcal)} kcal, credited ${formatKcal(totals.credited_kcal)} (${creditShare(totals)}%).`;
    if (intakeKcal === null) {
        return `${head} No meals logged, so there is no net intake to report.`;
    }
    const net = netIntakeKcal(intakeKcal, totals.credited_kcal);
    let goalPhrase = "";
    if (goalKcal !== null) {
        const diff = deficitVsGoal(goalKcal, net);
        const goal = formatKcal(goalKcal);
        goalPhrase =
            diff > 0
                ? ` (${formatKcal(diff)} under the ${goal} goal)`
                : diff < 0
                  ? ` (${formatKcal(-diff)} over the ${goal} goal)`
                  : ` (at the ${goal} goal)`;
    }
    return `${head} Net intake ${formatKcal(net)} kcal${goalPhrase}.`;
}

/**
 * The range line for get_nutrition_summary: the window's totals, the days that
 * carry activity, and a daily average over every calendar day in the range
 * (the same denominator get_trends uses for its averages).
 */
export function activityRangeLine(input: {
    totals: ActivityTotals;
    activeDays: number;
    daysInRange: number;
}): string {
    const { totals, activeDays, daysInRange } = input;
    const days = `${activeDays} day${activeDays === 1 ? "" : "s"}`;
    return `Active calories: burned ${formatKcal(totals.burned_kcal)} kcal, credited ${formatKcal(totals.credited_kcal)} (${creditShare(totals)}%) over ${days} with activity. Daily average over the ${daysInRange} days in range: burned ${formatKcal(totals.burned_kcal / daysInRange)} kcal, credited ${formatKcal(totals.credited_kcal / daysInRange)} kcal.`;
}

/**
 * The window line for get_trends. Burned and credited are averaged over every
 * calendar day of the window, the same denominator as the calorie average
 * beside it. Net intake is averaged over only the days that have a meal: a day
 * with no meal has no intake to net, so counting it as zero would pull the
 * average negative. `mealDays` lists those days, each with its intake and the
 * credit that day carried (0 when it had no activity). The net clause is
 * omitted when no day has a meal.
 */
export function activityTrendsLine(input: {
    totals: ActivityTotals;
    windowDays: number;
    mealDays: readonly { intakeKcal: number; creditedKcal: number }[];
}): string {
    const { totals, windowDays, mealDays } = input;
    const n = windowDays;
    const head = `Active calories over the last ${n} days, averaged over all ${n} calendar days: burned avg ${formatKcal(totals.burned_kcal / n)} kcal/day, credited avg ${formatKcal(totals.credited_kcal / n)} kcal/day.`;
    if (mealDays.length === 0) return head;
    let intake = 0;
    let credited = 0;
    for (const d of mealDays) {
        intake += d.intakeKcal;
        credited += d.creditedKcal;
    }
    const m = mealDays.length;
    const net = netIntakeKcal(intake, credited) / m;
    const dayWord = m === 1 ? "day" : "days";
    return `${head} Net intake avg ${formatKcal(net)} kcal/day over the ${m} ${dayWord} with a meal (intake minus that day's credited activity).`;
}
