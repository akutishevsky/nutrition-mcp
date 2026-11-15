// Weight-driven calorie goals: the pure maths, free of Supabase so it unit-tests
// with fixtures.
//
//   goal = (resting + active + rate × k) ÷ (1 − f)
//
// resting  the calibrated baseline when applied, else Mifflin BMR
// active   that day's watch kcal
// rate     g/day, negative = losing. A rate goal stores it; a date goal derives
//          it every day from the smoothed trend weight and the days left
// k        kcal per gram of scale-weight change (the calibration's own k, so
//          the two cancel — see body.ts)
// f        the share of intake that is burned digesting it. TEF scales with
//          intake, so I = R + A + f·I + Δ has the closed form above; with
//          rate 0 and f = TEF_FRACTION it is exactly breakEvenKcal.
//
// Safety limits are advisory: goalFlags() describes, it never changes a number.

import {
    KCAL_PER_GRAM,
    TEF_FRACTION,
    ageOn,
    healthyRangeG,
    weightSlope,
    type BodyDetails,
    type WeighIn,
} from "./body.js";
import type { Calibration, EnergyDay, ModelParams } from "./calibration.js";
import type { DashboardDay } from "./dashboard-stats.js";
import type { BodySex, NutritionGoals } from "./supabase.js";

export type GoalMode = "fixed" | "burn" | "rate" | "date";
export type RatePeriod = "week" | "month" | "year";

export const G_PER_LB = 453.59237;
/** Days in each rate period; a month and a year are the calendar averages. */
export const DAYS_PER_PERIOD: Record<RatePeriod, number> = {
    week: 7,
    month: 365.25 / 12,
    year: 365.25,
};
/** Within this much of the target, a date goal counts as reached. */
export const REACHED_TOLERANCE_G = 500;
/** The newest weigh-in may be this many days old before the trend stops
 *  being extrapolated to today. */
const MAX_EXTRAPOLATE_DAYS = 7;
/** Fewest weigh-in days (and days of span) for a fitted trend to be used. */
const MIN_TREND_DAYS = 3;
const MIN_TREND_SPAN = 7;
/** Fewest counted days before the user's own digestion share is trusted. */
const MIN_TEF_DAYS = 7;

function daysBetween(a: string, b: string): number {
    return Math.round(
        (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) /
            86_400_000,
    );
}

/** A signed amount per week/month/year, in kg or lb, as grams per day. */
export function rateToGramsPerDay(
    amount: number,
    unit: "kg" | "lb",
    period: RatePeriod,
): number {
    const grams = unit === "lb" ? amount * G_PER_LB : amount * 1000;
    return grams / DAYS_PER_PERIOD[period];
}

/** grams per day back to an amount in a period and unit (for display). */
export function gramsPerDayToRate(
    gPerDay: number,
    unit: "kg" | "lb",
    period: RatePeriod,
): number {
    const perPeriod = gPerDay * DAYS_PER_PERIOD[period];
    return unit === "lb" ? perPeriod / G_PER_LB : perPeriod / 1000;
}

/** The stored mode, or for a legacy row (no mode) what its calorie number
 *  implies: a number is a fixed goal, none follows the estimated burn. */
export function resolveGoalMode(
    goals: {
        calorie_goal_mode?: GoalMode | null;
        daily_calories: number | null;
    } | null,
): GoalMode {
    if (goals?.calorie_goal_mode) return goals.calorie_goal_mode;
    return goals?.daily_calories != null && goals.daily_calories > 0
        ? "fixed"
        : "burn";
}

/** The share of intake the user burns digesting it: their own counted days'
 *  per-macro TEF over their intake. TEF_FRACTION until there are enough days. */
export function tefRatio(days: EnergyDay[]): number {
    const counted = days.filter((d) => d.counted && d.calories > 0);
    if (counted.length < MIN_TEF_DAYS) return TEF_FRACTION;
    const intake = counted.reduce((s, d) => s + d.calories, 0);
    const tef = counted.reduce((s, d) => s + d.tef_kcal, 0);
    const ratio = tef / intake;
    // A guard rail on odd macro data, not a physiological claim.
    return Math.min(0.2, Math.max(0.05, ratio));
}

export interface TrendWeight {
    weight_g: number;
    /** trend: least-squares fit extrapolated to today; recent_mean: the last
     *  seven days' weigh-ins averaged; latest: the newest single reading. */
    source: "trend" | "recent_mean" | "latest";
    /** The lookback the fit used, days. */
    window_days: number;
    /** Weigh-in days the figure rests on. */
    weighin_days: number;
}

/** The smoothed weight today. `weighIns` sorted ascending. Null with no
 *  weigh-in at all. */
export function trendWeightToday(
    weighIns: WeighIn[],
    today: string,
    windowDays: number,
): TrendWeight | null {
    const usable = weighIns.filter((w) => w.date <= today);
    if (!usable.length) return null;
    const from = new Date(`${today}T00:00:00Z`);
    from.setUTCDate(from.getUTCDate() - windowDays);
    const fromIso = from.toISOString().slice(0, 10);
    const inWindow = usable.filter((w) => w.date >= fromIso);
    const slope = weightSlope(inWindow);
    if (
        slope &&
        slope.days >= MIN_TREND_DAYS &&
        slope.span_days >= MIN_TREND_SPAN
    ) {
        const last = slope.points.at(-1)!;
        const ahead = Math.min(
            MAX_EXTRAPOLATE_DAYS,
            Math.max(0, daysBetween(last.date, today)),
        );
        return {
            weight_g: Math.round(last.fit_g + slope.g_per_day * ahead),
            source: "trend",
            window_days: windowDays,
            weighin_days: slope.days,
        };
    }
    const weekAgo = new Date(`${today}T00:00:00Z`);
    weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
    const weekIso = weekAgo.toISOString().slice(0, 10);
    const recent = usable.filter((w) => w.date >= weekIso);
    if (recent.length >= 2) {
        const mean = recent.reduce((s, w) => s + w.weight_g, 0) / recent.length;
        return {
            weight_g: Math.round(mean),
            source: "recent_mean",
            window_days: 7,
            weighin_days: new Set(recent.map((w) => w.date)).size,
        };
    }
    return {
        weight_g: usable.at(-1)!.weight_g,
        source: "latest",
        window_days: 0,
        weighin_days: 1,
    };
}

/** The intake that holds `rate` g/day of scale-weight change, kcal. A
 *  generalised breakEvenKcal: rate 0 and f = TEF_FRACTION give the same. */
export function goalKcal(
    restingKcal: number,
    activeKcal: number | null,
    rateGPerDay: number,
    kcalPerGram: number = KCAL_PER_GRAM,
    tefShare: number = TEF_FRACTION,
): number {
    return Math.round(
        (restingKcal + (activeKcal ?? 0) + rateGPerDay * kcalPerGram) /
            (1 - tefShare),
    );
}

export interface GoalSettings {
    mode: GoalMode;
    /** Signed g/day, for a rate goal. */
    rate_g_per_day: number | null;
    target_weight_g: number | null;
    target_date: string | null;
}

export interface RatePlan {
    mode: GoalMode;
    /** The rate in force today, g/day (0 for fixed/burn, or once reached). */
    rate_g_per_day: number;
    target_weight_g: number | null;
    target_date: string | null;
    /** Date goal only: days from today to the target date. */
    days_left: number | null;
    /** Date goal: within tolerance of the target (or past the date). */
    reached: boolean;
}

/** The rate in force today for a goal's settings and the trend weight. */
export function planRate(
    s: GoalSettings,
    trend: TrendWeight | null,
    today: string,
): RatePlan {
    const base: RatePlan = {
        mode: s.mode,
        rate_g_per_day: 0,
        target_weight_g: s.target_weight_g,
        target_date: s.target_date,
        days_left: null,
        reached: false,
    };
    if (s.mode === "rate") {
        return { ...base, rate_g_per_day: s.rate_g_per_day ?? 0 };
    }
    if (s.mode !== "date") return base;
    if (s.target_date == null || s.target_weight_g == null) return base;
    const daysLeft = daysBetween(today, s.target_date);
    if (trend == null) return { ...base, days_left: daysLeft };
    const diff = s.target_weight_g - trend.weight_g;
    if (daysLeft <= 0 || Math.abs(diff) <= REACHED_TOLERANCE_G) {
        return { ...base, days_left: daysLeft, reached: true };
    }
    return {
        ...base,
        days_left: daysLeft,
        rate_g_per_day: diff / daysLeft,
    };
}

export type FlagCode =
    | "fast_loss"
    | "fast_gain"
    | "big_deficit"
    | "low_intake"
    | "underweight_target"
    | "minor_loss"
    | "date_soon"
    | "date_far"
    | "date_passed"
    | "formula_basis"
    | "no_trend";

export interface GoalFlag {
    code: FlagCode;
    /** red: a rule of thumb is exceeded; info: the figure is less certain. */
    level: "red" | "info";
    message: string;
}

export interface FlagInput {
    plan: RatePlan;
    trend: TrendWeight | null;
    restingKcal: number | null;
    activeKcal: number | null;
    goalKcal: number | null;
    kcalPerGram: number;
    sex: BodySex | null;
    age: number | null;
    heightCm: number | null;
    /** The resting figure is the calibrated baseline. */
    calibrated: boolean;
    today: string;
}

const LOSS_PCT_PER_WEEK = 0.01;
const LOSS_G_PER_WEEK = 1000;
const GAIN_PCT_PER_WEEK = 0.005;
const DEFICIT_SHARE = 0.25;
const DEFICIT_KCAL = 1000;
const FLOOR_FEMALE = 1200;
const FLOOR_MALE = 1500;
const DATE_MIN_DAYS = 21;
const DATE_MAX_DAYS = 730;

/** Conventional rules of thumb, not medical advice and not a limit: they
 *  describe a plan, they never change it. Only rate and date goals raise them. */
export function goalFlags(i: FlagInput): GoalFlag[] {
    const out: GoalFlag[] = [];
    const { plan } = i;
    if (plan.mode !== "rate" && plan.mode !== "date") return out;
    const w = i.trend?.weight_g ?? null;
    const perWeek = plan.rate_g_per_day * 7;
    if (plan.mode === "date" && plan.days_left != null) {
        if (plan.days_left <= 0)
            out.push({
                code: "date_passed",
                level: "red",
                message: "The target date has passed; the goal is break-even.",
            });
        else if (plan.days_left < DATE_MIN_DAYS)
            out.push({
                code: "date_soon",
                level: "red",
                message: `Only ${plan.days_left} days left: water swings dominate a short span.`,
            });
        else if (plan.days_left > DATE_MAX_DAYS)
            out.push({
                code: "date_far",
                level: "red",
                message:
                    "The target is over two years away; the daily rate will be tiny and the plan not a forecast.",
            });
    }
    if (perWeek < 0) {
        const lossG = -perWeek;
        if (
            lossG > LOSS_G_PER_WEEK ||
            (w != null && lossG > w * LOSS_PCT_PER_WEEK)
        )
            out.push({
                code: "fast_loss",
                level: "red",
                message: `Losing ${(lossG / 1000).toFixed(2)} kg/week is above the usual 1% of body weight (max 1 kg) per week.`,
            });
        if (i.age != null && i.age < 18)
            out.push({
                code: "minor_loss",
                level: "red",
                message: "A weight-loss goal is not advised under 18.",
            });
    } else if (perWeek > 0 && w != null && perWeek > w * GAIN_PCT_PER_WEEK) {
        out.push({
            code: "fast_gain",
            level: "red",
            message: `Gaining ${(perWeek / 1000).toFixed(2)} kg/week is above the usual 0.5% of body weight per week.`,
        });
    }
    const deficit = -plan.rate_g_per_day * i.kcalPerGram;
    const burn = (i.restingKcal ?? 0) + (i.activeKcal ?? 0);
    if (deficit > DEFICIT_KCAL || (burn > 0 && deficit > burn * DEFICIT_SHARE))
        out.push({
            code: "big_deficit",
            level: "red",
            message: `A ${Math.round(deficit).toLocaleString("en-US")} kcal/day deficit is above 25% of your burn (or 1,000 kcal).`,
        });
    if (i.goalKcal != null && plan.rate_g_per_day < 0) {
        const floor = Math.max(
            i.restingKcal ?? 0,
            i.sex === "male" ? FLOOR_MALE : FLOOR_FEMALE,
        );
        if (i.goalKcal < floor)
            out.push({
                code: "low_intake",
                level: "red",
                message: `${i.goalKcal.toLocaleString("en-US")} kcal is below ${Math.round(floor).toLocaleString("en-US")} kcal (your resting burn or the usual minimum).`,
            });
    }
    if (plan.target_weight_g != null && i.heightCm != null) {
        const { min } = healthyRangeG(i.heightCm);
        if (plan.target_weight_g < min)
            out.push({
                code: "underweight_target",
                level: "red",
                message:
                    "The target weight is below a BMI of 18.5 for your height.",
            });
    }
    if (!i.calibrated)
        out.push({
            code: "formula_basis",
            level: "info",
            message:
                "Resting burn is the formula estimate, not calibrated to you, so the real deficit can differ.",
        });
    if (i.trend == null || i.trend.source === "latest")
        out.push({
            code: "no_trend",
            level: "info",
            message:
                "Not enough weigh-ins for a smoothed trend; the latest reading is used.",
        });
    return out;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** The macro targets for a day under a derived calorie goal. The stored
 *  targets are for an inactive day at the planned rate (`baseKcal`, active 0);
 *  protein stays put and carbs and fat follow the day's calories, so a deficit
 *  or an active day never silently cuts protein. */
export function scaleDerivedMacros(
    macros: {
        protein_g: number | null;
        carbs_g: number | null;
        fat_g: number | null;
    },
    totalKcal: number,
    baseKcal: number,
): {
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
} {
    const factor = baseKcal > 0 ? totalKcal / baseKcal : 1;
    const scale = (v: number | null) => (v == null ? null : round1(v * factor));
    return {
        protein_g: macros.protein_g,
        carbs_g: scale(macros.carbs_g),
        fat_g: scale(macros.fat_g),
    };
}

/** Everything the page and the tools say about the plan behind today's goal. */
export interface GoalPlanView extends RatePlan {
    trend: TrendWeight | null;
    /** The share of intake burned digesting it that the goal grosses up by. */
    tef_share: number;
    kcal_per_gram: number;
    /** Today's resting burn and whether it is the calibrated baseline. */
    resting_kcal: number | null;
    resting_basis: "calibrated" | "formula";
    /** Today's goal, kcal (resting + active + rate, grossed up). */
    goal_kcal: number | null;
    flags: GoalFlag[];
}

export interface DeriveInput {
    /** Dashboard rows, oldest first, ending today; mutated in place. */
    rows: DashboardDay[];
    goals: NutritionGoals | null;
    weighIns: WeighIn[];
    energyDays: EnergyDay[];
    calibration: Calibration;
    body: BodyDetails;
    today: string;
    model: ModelParams;
}

function shift(date: string, n: number): string {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}

/**
 * Sets every row's goal for a derived mode (burn, rate, date) from that day's
 * resting burn and active kcal, and returns the plan for the page. Fixed goals
 * are left exactly as buildDashboardDays made them. The rate is today's,
 * applied to every row, so a date goal re-derives daily and history follows it.
 */
export function applyDerivedGoals(i: DeriveInput): GoalPlanView {
    const mode = resolveGoalMode(i.goals);
    const k = i.model.kcalPerGram;
    const from = shift(i.today, -i.model.windowDays);
    const to = shift(i.today, -1);
    const f = tefRatio(
        i.energyDays.filter((d) => d.date >= from && d.date <= to),
    );
    const trend = trendWeightToday(i.weighIns, i.today, i.model.windowDays);
    const plan = planRate(
        {
            mode,
            rate_g_per_day: i.goals?.weight_rate_g_per_day ?? null,
            target_weight_g: i.goals?.target_weight_g ?? null,
            target_date: i.goals?.target_date ?? null,
        },
        trend,
        i.today,
    );
    if (mode !== "fixed") {
        for (const row of i.rows) {
            if (row.bmr_kcal == null) continue;
            const total = goalKcal(
                row.bmr_kcal,
                row.active_kcal,
                plan.rate_g_per_day,
                k,
                f,
            );
            const base = goalKcal(row.bmr_kcal, 0, plan.rate_g_per_day, k, f);
            const macros = scaleDerivedMacros(
                {
                    protein_g: i.goals?.daily_protein_g ?? null,
                    carbs_g: i.goals?.daily_carbs_g ?? null,
                    fat_g: i.goals?.daily_fat_g ?? null,
                },
                total,
                base,
            );
            row.goal_calories = total;
            row.goal_base_calories = base;
            row.goal_protein_g = macros.protein_g || null;
            row.goal_carbs_g = macros.carbs_g || null;
            row.goal_fat_g = macros.fat_g || null;
        }
    }
    const row = i.rows.find((r) => r.date === i.today);
    const calibrated = i.calibration.applied;
    const goalToday = mode === "fixed" ? null : (row?.goal_calories ?? null);
    return {
        ...plan,
        trend,
        tef_share: f,
        kcal_per_gram: k,
        resting_kcal: row?.bmr_kcal ?? null,
        resting_basis: calibrated ? "calibrated" : "formula",
        goal_kcal: goalToday,
        flags: goalFlags({
            plan,
            trend,
            restingKcal: row?.bmr_kcal ?? null,
            activeKcal: row?.active_kcal ?? null,
            goalKcal: goalToday,
            kcalPerGram: k,
            sex: i.body.sex,
            age: i.body.birth_date ? ageOn(i.body.birth_date, i.today) : null,
            heightCm: i.body.height_cm,
            calibrated,
            today: i.today,
        }),
    };
}
