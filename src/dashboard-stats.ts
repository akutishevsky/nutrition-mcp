// The dashboard's derived figures — per-day goals, burn and balance, and the
// weight-tracker stats. Pure (no Supabase) so it tests with fixtures; the
// routes in src/dashboard.ts only fetch and hand rows in.
//
// Per-day goals go through adjustGoalsForActivity, the same function every MCP
// progress tool uses, so the dashboard's "goal 1,805" and the assistant's
// "goal 1,805" cannot disagree.

import { adjustGoalsForActivity } from "./activity.js";
import {
    bmi,
    bmiCategory,
    bmrFor,
    balanceGrams,
    dailyBurn,
    healthyRangeG,
    projectTargetDate,
    weightOn,
    weightTrend,
    ageOn,
    TEF_FRACTION,
    breakEvenKcal,
    foodTef,
    type BmiCategory,
    type BodyDetails,
    type WeighIn,
} from "./body.js";
import type { EnergyStatus, EnergyWindow } from "./calibration.js";
import { resolveGoalMode } from "./goal-plan.js";
import type { DailyBucket } from "./insights.js";
import type { Meal, NutritionGoals } from "./supabase.js";

export interface DashboardDay {
    date: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
    waterMl: number;
    mealCount: number;
    /** Active kcal recorded for the day, or null. */
    active_kcal: number | null;
    /** The day's effective calorie goal (baseline + active), or null. */
    goal_calories: number | null;
    /** Derived goals only: the same goal on a day with no active kcal, the
     *  figure the stored macro targets are written against. */
    goal_base_calories: number | null;
    goal_protein_g: number | null;
    goal_carbs_g: number | null;
    goal_fat_g: number | null;
    /** That day's resting burn (Mifflin-St Jeor BMR from the weight in effect
     *  that day — so it moves as weight does), or null without body data. */
    bmr_kcal: number | null;
    /** Thermic effect of the day's food (digestion), kcal. */
    tef_kcal: number;
    /** Estimated total burn (resting + active + digestion), or null
     *  without body data. */
    burn_kcal: number | null;
    /** Estimated grams gained (+) / lost (−). Null on a day with no meals —
     *  an unlogged day is unknown, not a day of eating nothing. */
    balance_g: number | null;
    /** The same balance in kcal: eaten − est. burn (rounded). Null exactly
     *  when balance_g is. */
    balance_kcal: number | null;
    /** True for today: the day is still running, so its balance is partial. */
    in_progress: boolean;
    /** The user's manual choice for the calibration (true = count, false =
     *  exclude), or null to follow the automatic rule. */
    count_override?: boolean | null;
    /** Whether the day counts in the calibration, and why. */
    counts_in_calibration?: boolean;
    count_reason?: CountReason;
}

export type CountReason =
    | "auto_complete" // 2+ entries and at least half a typical day's kcal
    | "auto_few_entries" // fewer than 2 entries logged
    | "auto_low_kcal" // under half the typical logged day
    | "manual_on"
    | "manual_off"
    | "in_progress"
    | "no_meals"
    | "no_watch"; // the user has a watch, but this day did not sync

/** Entries a day needs before it looks completely logged. */
export const MIN_DAY_ENTRIES = 2;
/** ...and the share of a typical logged day's kcal it needs. */
export const MIN_DAY_SHARE = 0.5;
/** Logged days needed before "typical" means anything. */
const MIN_TYPICAL_DAYS = 7;

/**
 * The typical logged day: median kcal of the complete days with meals in
 * [from, to]. A median, so a feast or a half-logged day does not move it.
 * Null with fewer than 7 such days (the kcal test is then skipped).
 */
export function typicalDayKcal(
    rows: Pick<
        DashboardDay,
        "date" | "calories" | "mealCount" | "in_progress"
    >[],
    from: string,
    to: string,
): number | null {
    const kcal = rows
        .filter(
            (r) =>
                r.date >= from &&
                r.date <= to &&
                r.mealCount > 0 &&
                !r.in_progress,
        )
        .map((r) => r.calories)
        .sort((a, b) => a - b);
    if (kcal.length < MIN_TYPICAL_DAYS) return null;
    const mid = kcal.length >> 1;
    return Math.round(
        kcal.length % 2 ? kcal[mid]! : (kcal[mid - 1]! + kcal[mid]!) / 2,
    );
}

/** Whether a day counts in the calibration. Today, an empty day and (for a
 *  user who syncs a watch) an unsynced day never count: a null active kcal
 *  is unknown, not zero. Otherwise the manual choice wins over the rule:
 *  2+ entries and at least half of the typical logged day's kcal. */
export function countDay(
    row: Pick<
        DashboardDay,
        "in_progress" | "mealCount" | "active_kcal" | "calories"
    >,
    override: boolean | null,
    hasWatch: boolean,
    typicalKcal: number | null,
): { counted: boolean; reason: CountReason } {
    if (row.in_progress) return { counted: false, reason: "in_progress" };
    if (!row.mealCount) return { counted: false, reason: "no_meals" };
    // A manual choice beats a missing watch sync: the user may know the day
    // is fine (the burn then has no workout part).
    if (override === true) return { counted: true, reason: "manual_on" };
    if (override === false) return { counted: false, reason: "manual_off" };
    if (hasWatch && row.active_kcal == null)
        return { counted: false, reason: "no_watch" };
    if (row.mealCount < MIN_DAY_ENTRIES)
        return { counted: false, reason: "auto_few_entries" };
    if (typicalKcal != null && row.calories < typicalKcal * MIN_DAY_SHARE)
        return { counted: false, reason: "auto_low_kcal" };
    return { counted: true, reason: "auto_complete" };
}

/** The calorie goal the dashboard shows. A stored goal wins; with none set,
 *  the baseline is the break-even intake on a rest day — resting ÷ (1 − TEF),
 *  since eating I kcal also burns TEF_FRACTION × I digesting it — so the
 *  effective goal (baseline + active kcal) is about the estimated burn: eat
 *  to break even until the user picks a target. Without body details there
 *  is no burn to default to, so the goal stays unset. Also used by
 *  log_meal / update_meal / get_goal_progress (src/mcp.ts), so the
 *  assistant's progress matches the dashboard. */
export function withBurnDefault(
    goals: NutritionGoals | null,
    bmr: number | null,
): NutritionGoals | null {
    if (resolveGoalMode(goals) === "fixed") return goals;
    if (bmr == null) return goals;
    const blank: NutritionGoals = {
        user_id: "",
        daily_calories: null,
        daily_protein_g: null,
        daily_carbs_g: null,
        daily_fat_g: null,
        daily_fiber_g: null,
        daily_sugar_g: null,
        daily_alcohol_g: null,
        daily_caffeine_mg: null,
        daily_water_ml: null,
        target_weight_g: null,
        calorie_goal_mode: null,
        weight_rate_g_per_day: null,
        target_date: null,
        updated_at: "",
    };
    return {
        ...(goals ?? blank),
        daily_calories: Math.round(bmr / (1 - TEF_FRACTION)),
    };
}

export function buildDashboardDays(
    buckets: DailyBucket[],
    activeByDate: Map<string, number>,
    goals: NutritionGoals | null,
    body: BodyDetails,
    weighIns: WeighIn[],
    today: string,
): DashboardDay[] {
    const hasStoredGoal = resolveGoalMode(goals) === "fixed";
    return buckets.map((b) => {
        const active = activeByDate.get(b.date) ?? null;
        const bmr = bmrFor(body, weightOn(weighIns, b.date), b.date);
        const adj = adjustGoalsForActivity(withBurnDefault(goals, bmr), active);
        const g = adj.goals;
        const tef = Math.round(foodTef(b));
        const burn = bmr == null ? null : dailyBurn(bmr, active, tef);
        return {
            date: b.date,
            calories: b.calories,
            protein_g: b.protein_g,
            carbs_g: b.carbs_g,
            fat_g: b.fat_g,
            fiber_g: b.fiber_g,
            sugar_g: b.sugar_g,
            waterMl: b.waterMl,
            mealCount: b.meals.length,
            active_kcal: active,
            // No stored goal: the exact break-even intake (resting +
            // active, grossed up for digestion). adjustGoalsForActivity adds
            // active 1:1, which left the default ~11% of active kcal short.
            goal_calories:
                !hasStoredGoal && bmr != null
                    ? breakEvenKcal(bmr, active)
                    : g?.daily_calories || null,
            goal_base_calories: null,
            goal_protein_g: g?.daily_protein_g || null,
            goal_carbs_g: g?.daily_carbs_g || null,
            goal_fat_g: g?.daily_fat_g || null,
            bmr_kcal: bmr,
            tef_kcal: tef,
            burn_kcal: burn,
            balance_g:
                burn != null && b.meals.length > 0
                    ? balanceGrams(b.calories, burn)
                    : null,
            balance_kcal:
                burn != null && b.meals.length > 0
                    ? Math.round(b.calories - burn)
                    : null,
            in_progress: b.date === today,
        };
    });
}

export interface WeightStats {
    latest_g: number | null;
    latest_date: string | null;
    height_cm: number | null;
    age: number | null;
    bmi: number | null;
    bmi_category: BmiCategory | null;
    healthy_min_g: number | null;
    healthy_max_g: number | null;
    change_g: number | null;
    weekly_rate_g: number | null;
    trend_days: number | null;
    target_g: number | null;
    to_target_g: number | null;
    projected_date: string | null;
    bmr_kcal: number | null;
    /** Today's estimated burn including today's active kcal. */
    burn_today_kcal: number | null;
    /** Which details are missing, so the page can ask for exactly those. */
    missing: Array<"height" | "birth_date" | "sex" | "weight">;
}

/**
 * `trendWeighIns` is the window the rate is measured over (sorted ascending);
 * `latest` is the most recent weigh-in overall, which may predate it.
 */
export function buildWeightStats(
    trendWeighIns: WeighIn[],
    latest: WeighIn | null,
    body: BodyDetails,
    goals: NutritionGoals | null,
    todayActiveKcal: number | null,
    today: string,
    todayTefKcal = 0,
): WeightStats {
    const missing: WeightStats["missing"] = [];
    if (body.height_cm == null) missing.push("height");
    if (body.birth_date == null) missing.push("birth_date");
    if (body.sex == null) missing.push("sex");
    if (!latest) missing.push("weight");

    const trend = weightTrend(trendWeighIns);
    const target = goals?.target_weight_g ?? null;
    const bmiValue =
        latest && body.height_cm != null
            ? bmi(latest.weight_g, body.height_cm)
            : null;
    const range = body.height_cm != null ? healthyRangeG(body.height_cm) : null;
    const bmr = bmrFor(body, latest?.weight_g ?? null, today);

    return {
        latest_g: latest?.weight_g ?? null,
        latest_date: latest?.date ?? null,
        height_cm: body.height_cm,
        age: body.birth_date ? ageOn(body.birth_date, today) : null,
        bmi: bmiValue,
        bmi_category: bmiValue == null ? null : bmiCategory(bmiValue),
        healthy_min_g: range?.min ?? null,
        healthy_max_g: range?.max ?? null,
        change_g: trend?.change_g ?? null,
        weekly_rate_g: trend?.weekly_rate_g ?? null,
        trend_days: trend?.span_days ?? null,
        target_g: target,
        to_target_g: latest && target != null ? target - latest.weight_g : null,
        projected_date:
            latest && target != null && trend
                ? projectTargetDate(latest, target, trend.weekly_rate_g)
                : null,
        bmr_kcal: bmr,
        burn_today_kcal:
            bmr == null ? null : dailyBurn(bmr, todayActiveKcal, todayTefKcal),
        missing,
    };
}

export interface EstimateVsScale {
    /**
     * "ok": both sides are known. "no_weighins": fewer than two weigh-in days
     * inside the window. "no_estimate": the scale moved, but no counted day
     * in the span has an estimate to compare it with.
     */
    status: "ok" | "no_weighins" | "no_estimate";
    first_date: string | null;
    last_date: string | null;
    /** last_date − first_date, in days. */
    span_days: number | null;
    /** Counted days in [first_date, last_date). */
    covered_days: number | null;
    /** Distinct weigh-in days the trend goes through. */
    weighin_days: number;
    /** What the scale did ALONG ITS TREND (least squares over every
     *  weigh-in, not last − first), grams. */
    actual_g: number | null;
    /** Formula-predicted change summed over the counted days. */
    est_logged_g: number | null;
    /** est_logged_g × span ÷ counted, only when some days are not counted. */
    est_scaled_g: number | null;
    /** actual − estimate (the scaled one when present, else the logged one). */
    gap_g: number | null;
    /** gap × KCAL_PER_GRAM ÷ span. POSITIVE means the burn estimate runs
     *  HIGH: the scale lost less (or gained more) than predicted. Identical to
     *  the calibration's offset — the same window, days and trend. */
    implied_kcal_per_day: number | null;
    /** ± kcal/day from the weigh-ins' scatter around the trend. */
    uncertainty_kcal: number | null;
    /** The calibration's verdict on the window (see EnergyStatus). */
    quality: EnergyStatus;
    /** True only when the window qualifies (quality "ok"). */
    calibrated: boolean;
}

/** The Estimate-vs-reality card: the calibration window, as the card shows it. */
export function buildEstimateVsScale(w: EnergyWindow): EstimateVsScale {
    const status: EstimateVsScale["status"] =
        w.status === "no_weighins"
            ? "no_weighins"
            : w.gap_g == null
              ? "no_estimate"
              : "ok";
    return {
        status,
        first_date: w.first_date,
        last_date: w.last_date,
        span_days: w.span_days,
        covered_days: w.span_days == null ? null : w.counted_days,
        weighin_days: w.weighin_days,
        actual_g: w.trend_change_g,
        est_logged_g: w.est_logged_g,
        est_scaled_g: w.est_scaled_g,
        gap_g: w.gap_g,
        implied_kcal_per_day: status === "ok" ? w.offset_kcal : null,
        uncertainty_kcal: w.uncertainty_kcal,
        quality: w.status,
        calibrated: w.status === "ok",
    };
}

/** The Today tab's two 7-day figures. Fixed window, never the chart range. */
export interface Last7 {
    /** today − 7: a weekly weigh-in on the same weekday still lands inside. */
    from: string;
    /** today. */
    to: string;
    /** The scale: last − first weigh-in in [from, to]; null with fewer than
     *  two weigh-ins on different dates. */
    weight_change_g: number | null;
    weight_first_date: string | null;
    weight_last_date: string | null;
    /** Sum of balance_g over the complete logged days in [from, today − 1]
     *  — the Trends "Net est. change" definition over a fixed week. Null when
     *  no such day has a balance. */
    est_net_g: number | null;
    /** The same days' balance in kcal: the sum, and the average per day. */
    est_net_kcal: number | null;
    est_avg_kcal: number | null;
    /** How many complete days carried a balance (0–7). */
    est_days: number;
    /** Whether any day in the window has an estimated burn at all; false
     *  means body details are missing, not that nothing was eaten. */
    has_burn: boolean;
}

export const LAST7_DAYS = 7;

/**
 * `dayRows` must reach back to today − 7 (buildDashboardPayload widens its
 * internal window for this), so the figures do not depend on the range the
 * Trends tab happens to show.
 */
export function buildLast7(
    dayRows: Pick<
        DashboardDay,
        | "date"
        | "balance_g"
        | "balance_kcal"
        | "burn_kcal"
        | "in_progress"
        | "counts_in_calibration"
    >[],
    weighIns: WeighIn[],
    today: string,
): Last7 {
    const from = shiftDay(today, -LAST7_DAYS);
    // What the scale did this week: first and last weigh-in inside it. A
    // plain readout, not the calibration (that needs 3+ weeks and a trend).
    const inside = weighIns
        .filter((w) => w.date >= from && w.date <= today)
        .sort((a, b) => a.date.localeCompare(b.date));
    const first = inside[0],
        last = inside.at(-1);
    const moved = first && last && first.date < last.date;
    const scale = {
        actual_g: moved ? last.weight_g - first.weight_g : null,
        first_date: moved ? first.date : null,
        last_date: moved ? last.date : null,
    };
    // Complete days only — the same verdict (`counts_in_calibration`) the
    // Trends "Eaten vs burned" chart uses, so a half-logged day cannot show
    // as a huge deficit here while Trends leaves it out.
    const week = dayRows.filter(
        (r) =>
            r.date >= from &&
            r.date < today &&
            !r.in_progress &&
            r.counts_in_calibration === true,
    );
    const logged = week.filter((r) => r.balance_g != null);
    const netKcal = logged.reduce((a, r) => a + (r.balance_kcal ?? 0), 0);
    return {
        from,
        to: today,
        weight_change_g: scale.actual_g,
        weight_first_date: scale.first_date,
        weight_last_date: scale.last_date,
        est_net_g: logged.length
            ? logged.reduce((a, r) => a + r.balance_g!, 0)
            : null,
        est_net_kcal: logged.length ? netKcal : null,
        est_avg_kcal: logged.length
            ? Math.round(netKcal / logged.length)
            : null,
        est_days: logged.length,
        has_burn: dayRows.some(
            (r) => r.date >= from && r.date <= today && r.burn_kcal != null,
        ),
    };
}

function shiftDay(date: string, n: number): string {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}

// ---------- Trends grouping ----------

export type Granularity = "day" | "week" | "month";

/** The chart grouping for a range: 7 days → daily bars, 30 → weekly, a year
 *  → monthly. Hand-edited ?days= values fall into the nearest band. */
export function granularityFor(days: number): Granularity {
    if (days <= 14) return "day";
    if (days <= 60) return "week";
    return "month";
}

/**
 * One bar of the Trends charts. Every per-day figure is an AVERAGE PER LOGGED
 * DAY (a day with meals), so a week with two unlogged days is not dragged
 * toward zero. A bucket with no logged days has null figures and draws no bar.
 */
export interface TrendBucket {
    start: string;
    end: string;
    /** Calendar days in the bucket (within the range). */
    days: number;
    /** Days whose figures count: logged (mealCount > 0) and, for weekly and
     *  monthly bars, complete — today joins its bucket once it ends. */
    logged_days: number;
    /** The bucket contains today (still running); for months, the current
     *  month. Drawn dimmed and labelled "so far". */
    partial: boolean;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    fiber_g: number | null;
    /** Reference levels: averaged over the logged days; with none logged,
     *  over every day that has one, so the goal and burn lines stay
     *  continuous across an empty week. */
    goal_calories: number | null;
    bmr_kcal: number | null;
    active_kcal: number | null;
    burn_kcal: number | null;
    /** Average daily balance over the logged complete days that have one. */
    balance_kcal: number | null;
    balance_g: number | null;
    /** Sum of the balance over those days — the body-change band's bar. */
    balance_g_sum: number | null;
    balance_kcal_sum: number | null;
    /** How many days the balance figures cover. */
    balance_days: number;
}

type GroupRow = Pick<
    DashboardDay,
    | "date"
    | "calories"
    | "protein_g"
    | "carbs_g"
    | "fat_g"
    | "fiber_g"
    | "mealCount"
    | "goal_calories"
    | "bmr_kcal"
    | "active_kcal"
    | "burn_kcal"
    | "balance_g"
    | "balance_kcal"
    | "in_progress"
    | "counts_in_calibration"
>;

const avgOf = (xs: number[]): number | null =>
    xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;

function bucketOf(
    rows: GroupRow[],
    start: string,
    end: string,
    granularity: Granularity,
): TrendBucket {
    // A daily bar shows today as it stands (dimmed); a weekly or monthly
    // average would be dragged down by a half-eaten day, so there today
    // counts only once it has ended.
    const counted = rows.filter(
        (r) => r.mealCount > 0 && (granularity === "day" || !r.in_progress),
    );
    const ref = counted.length ? counted : rows;
    const pick = (list: GroupRow[], f: (r: GroupRow) => number | null) =>
        list.map(f).filter((v): v is number => v != null);
    const withBurn = (r: GroupRow) => r.burn_kcal != null;
    // Complete days only (the calibration verdict), like Eaten vs burned,
    // the Today panel and buildLast7: one rule for "a day that counts".
    const balanced = rows.filter(
        (r) =>
            !r.in_progress &&
            r.counts_in_calibration !== false &&
            r.balance_g != null,
    );
    const sumG = balanced.reduce((a, r) => a + r.balance_g!, 0);
    const sumK = balanced.reduce((a, r) => a + (r.balance_kcal ?? 0), 0);
    return {
        start,
        end,
        days: rows.length,
        logged_days: counted.length,
        partial: rows.some((r) => r.in_progress),
        calories: avgOf(pick(counted, (r) => r.calories)),
        protein_g: avgOf(pick(counted, (r) => r.protein_g)),
        carbs_g: avgOf(pick(counted, (r) => r.carbs_g)),
        fat_g: avgOf(pick(counted, (r) => r.fat_g)),
        fiber_g: avgOf(pick(counted, (r) => r.fiber_g)),
        goal_calories: avgOf(pick(ref, (r) => r.goal_calories)),
        bmr_kcal: avgOf(pick(ref, (r) => r.bmr_kcal)),
        // Active averaged over the same days as burn (no record = 0), so
        // resting + active adds up to the burn shown.
        active_kcal: avgOf(
            pick(ref.filter(withBurn), (r) => r.active_kcal ?? 0),
        ),
        burn_kcal: avgOf(pick(ref, (r) => r.burn_kcal)),
        balance_kcal: avgOf(pick(balanced, (r) => r.balance_kcal)),
        balance_g: avgOf(pick(balanced, (r) => r.balance_g)),
        balance_g_sum: balanced.length ? sumG : null,
        balance_kcal_sum: balanced.length ? sumK : null,
        balance_days: balanced.length,
    };
}

/**
 * The Trends bars for a range. `rows` are the range's daily rows (ascending,
 * ending today). Daily: one bucket per day. Weekly: consecutive 7-day blocks
 * ending today, as many whole weeks as the range holds (4 for 30 days).
 * Monthly: calendar months, newest = the current (partial) month, at most 12,
 * each only if the range reaches its first day.
 */
export function groupDays(
    rows: GroupRow[],
    granularity: Granularity,
): TrendBucket[] {
    if (!rows.length) return [];
    const end = rows[rows.length - 1]!.date;
    const between = (a: string, b: string) =>
        rows.filter((r) => r.date >= a && r.date <= b);
    if (granularity === "day")
        return rows.map((r) => bucketOf([r], r.date, r.date, "day"));
    if (granularity === "week") {
        const weeks = Math.max(1, Math.floor(rows.length / 7));
        const out: TrendBucket[] = [];
        for (let k = weeks - 1; k >= 0; k--) {
            const e = shiftDay(end, -7 * k);
            const s = shiftDay(e, -6);
            out.push(bucketOf(between(s, e), s, e, "week"));
        }
        return out;
    }
    const first = rows[0]!.date;
    const out: TrendBucket[] = [];
    let y = Number(end.slice(0, 4));
    let m = Number(end.slice(5, 7));
    for (let i = 0; i < 12; i++) {
        const s = `${y}-${String(m).padStart(2, "0")}-01`;
        if (i > 0 && s < first) break;
        const last = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
        const e = last < end ? last : end;
        out.unshift(bucketOf(between(s, e), s, e, "month"));
        m -= 1;
        if (m === 0) {
            m = 12;
            y -= 1;
        }
    }
    return out;
}

/** One entry in the "Log a meal" block's most-frequent list. */
export interface FrequentMeal {
    /** The newest meal with this description — the one a tap repeats, so the
     *  server copies its caffeine / alcohol / notes too. */
    id: string;
    description: string;
    meal_type: string | null;
    calories: number | null;
    count: number;
}

/** Look-back for "frequent": long enough to include what someone eats weekly. */
export const FREQUENT_DAYS = 90;

/**
 * The meals logged most often, built from the user's own history (nothing is
 * hardcoded). Grouped by trimmed, case-insensitive description; eaten at
 * least twice; most frequent first, ties newest first. Pure.
 */
export function buildFrequentMeals(meals: Meal[], limit = 8): FrequentMeal[] {
    const by = new Map<string, FrequentMeal & { at: string }>();
    for (const m of meals) {
        const key = (m.description ?? "").trim().toLowerCase();
        if (!key) continue;
        const cur = by.get(key);
        if (!cur) {
            by.set(key, {
                id: m.id,
                description: m.description.trim(),
                meal_type: m.meal_type,
                calories: m.calories,
                count: 1,
                at: m.logged_at,
            });
        } else {
            cur.count += 1;
            // Keep the newest instance as the one a tap repeats.
            if (m.logged_at > cur.at) {
                cur.id = m.id;
                cur.meal_type = m.meal_type;
                cur.calories = m.calories;
                cur.at = m.logged_at;
            }
        }
    }
    return [...by.values()]
        .filter((f) => f.count >= 2)
        .sort((a, b) => b.count - a.count || b.at.localeCompare(a.at))
        .slice(0, limit)
        .map(({ at: _at, ...f }) => f);
}
