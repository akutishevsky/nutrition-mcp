// Personal dashboard: a browser view of your own logs.
//
// This exists because the MCP widgets (goal rings, trends) only render in a
// host that implements MCP Apps UI. A terminal client gets text, so a
// local-only instance has no visual view of its own data at all. These routes
// serve one.
//
// OFF BY DEFAULT. Set DASHBOARD_ENABLED=true to turn it on. The login route
// below accepts an email and password directly, which is a materially
// different exposure from the rest of this server: every other authenticated
// path takes an OAuth bearer token the client already holds, and nothing else
// here will check a password for an anonymous caller. On loopback that is
// fine. Reachable from the internet it is a brute-force target, so enabling it
// is a deliberate act rather than something a deploy inherits.

import { Hono } from "hono";
import crypto from "node:crypto";
import {
    signInUser,
    storeToken,
    getMealsInRange,
    getWaterInRange,
    getWeightInRange,
    getNutritionGoals,
    upsertNutritionGoals,
    getProfile,
    getLatestWeight,
    getAllWeight,
    updateWeight,
    deleteWeight,
    getActivityInRange,
    getCalibrationDayOverrides,
    setCalibrationDayOverride,
    activityByDate,
    upsertProfile,
    insertWeight,
    insertMeal,
    updateMeal,
    deleteMeal,
    getMealById,
    timezoneFromProfile,
    preferredWeightUnitFromProfile,
    type ActivityDay,
    type Meal,
    type MealInput,
    type NutritionGoals,
    type Profile,
    type WaterEntry,
    type WeightEntry,
} from "./supabase.js";
import { buildDailyBuckets } from "./insights.js";
import {
    buildCalibration,
    calibratedBaseline,
    metabolismSeries,
    CLAMP,
    DEFAULT_PARAMS,
    MAX_WINDOW_DAYS,
    MIN_WINDOW_DAYS,
    MAX_UNCERTAINTY_KCAL,
    MIN_COVERAGE,
    MIN_SPAN,
    MIN_WEIGHIN_DAYS,
    type EnergyDay,
    type ModelParams,
} from "./calibration.js";
import {
    applyDerivedGoals,
    gramsPerDayToRate,
    rateToGramsPerDay,
    resolveGoalMode,
    type GoalMode,
    type RatePeriod,
} from "./goal-plan.js";
import {
    ageOn,
    balanceGrams,
    dailyBurn,
    KCAL_PER_GRAM,
    TEF_CARBS,
    TEF_FAT,
    TEF_FRACTION,
    TEF_PROTEIN,
} from "./body.js";
import {
    todayInTz,
    shiftLocalDate,
    dateInTz,
    resolveWriteLoggedAt,
    LoggedAtError,
} from "./tz.js";
import {
    isPlausibleWeightGrams,
    isWeightUnit,
    toGrams,
    MIN_PLAUSIBLE_WEIGHT_G,
    MAX_PLAUSIBLE_WEIGHT_G,
    type WeightUnit,
} from "./units.js";
import {
    MAX_ALCOHOL_G,
    MAX_CAFFEINE_MG,
    MAX_CALORIES,
    MAX_MACRO_G,
    MEAL_TYPE_VALUES,
} from "./import.js";
import { isLocalDate } from "./activity.js";
import { authenticateBearer, rateLimitAuth } from "./middleware.js";
import { checkBodyPatch, type BodyDetails, type WeighIn } from "./body.js";
import {
    buildDashboardDays,
    buildEstimateVsScale,
    buildLast7,
    buildWeightStats,
    countDay,
    MIN_DAY_ENTRIES,
    MIN_DAY_SHARE,
    typicalDayKcal,
    buildFrequentMeals,
    FREQUENT_DAYS,
    granularityFor,
    groupDays,
    LAST7_DAYS,
} from "./dashboard-stats.js";
import { listFoods, suggestFood } from "./simple-foods.js";

// The weight rate needs a span longer than a day or a week to mean anything,
// so the weight tracker always looks back at least this far, whatever range
// the calorie charts show.
const WEIGHT_WINDOW_DAYS = 90;

/** The inputs of today's Mifflin-St Jeor BMR, for the explanation panel:
 *  the weigh-in in effect today (the last one on or before it, else the
 *  first known), height, age that day and sex. */
function bmrInputs(body: BodyDetails, weighIns: WeighIn[], today: string) {
    const inEffect =
        weighIns.filter((w) => w.date <= today).at(-1) ?? weighIns[0] ?? null;
    return {
        weight_g: inEffect?.weight_g ?? null,
        weight_date: inEffect?.date ?? null,
        height_cm: body.height_cm,
        age: body.birth_date ? ageOn(body.birth_date, today) : null,
        sex: body.sex,
    };
}

export function bodyOf(profile: Profile | null): BodyDetails {
    return {
        height_cm:
            profile?.height_cm == null ? null : Number(profile.height_cm),
        birth_date: profile?.birth_date ?? null,
        sex: profile?.sex ?? null,
    };
}

/** The user's own model settings (kcal per gram, trend lookback), or the
 *  defaults where they have set none. The same params drive the calibration,
 *  the trend weight and the goal, so the three stay consistent. */
export function modelFromProfile(profile: Profile | null): ModelParams {
    const k = Number(profile?.energy_kcal_per_gram);
    const w = Number(profile?.trend_window_days);
    return {
        ...DEFAULT_PARAMS,
        kcalPerGram:
            Number.isFinite(k) && k > 0 ? k : DEFAULT_PARAMS.kcalPerGram,
        windowDays:
            Number.isInteger(w) && w >= MIN_WINDOW_DAYS && w <= MAX_WINDOW_DAYS
                ? w
                : DEFAULT_PARAMS.windowDays,
    };
}

export function dashboardEnabled(): boolean {
    return process.env.DASHBOARD_ENABLED === "true";
}

// Clamped so a hand-edited ?days= cannot ask for an unbounded scan of the
// meals table. 365 is already more than any chart here plots usefully.
const MIN_DAYS = 1;
const MAX_DAYS = 365;
const DEFAULT_DAYS = 30;

function clampDays(raw: string | undefined): number {
    const n = Number.parseInt(raw ?? "", 10);
    if (!Number.isFinite(n)) return DEFAULT_DAYS;
    return Math.min(MAX_DAYS, Math.max(MIN_DAYS, n));
}

/**
 * The local-date windows one request covers: the charts' [startDate, endDate],
 * the weight tracker's longer [weightStart, endDate], and [fetchStart,
 * endDate] for meals/water/activity — the chart range widened to cover the
 * Today tab's fixed 7-day figures (`last7`), so those never depend on the
 * range the Trends tab shows. One helper so the fetch, the payload and the
 * dev preview's fixture filter cannot disagree.
 */
export function dashboardWindow(
    today: string,
    days: number,
): {
    startDate: string;
    endDate: string;
    weightStart: string;
    fetchStart: string;
    weightFetchStart: string;
} {
    const startDate = shiftLocalDate(today, -(days - 1));
    const last7Start = shiftLocalDate(today, -LAST7_DAYS);
    return {
        startDate,
        endDate: today,
        weightStart: shiftLocalDate(
            today,
            -(Math.max(days, WEIGHT_WINDOW_DAYS) - 1),
        ),
        // Also the 28 calibration days before the range's first day: every
        // plotted day of the metabolism chart is calibrated from the 28 days
        // before it, and the latest of those windows is the Body tab's
        // figure, so neither depends on the chart range picked.
        fetchStart: [
            startDate,
            last7Start,
            shiftLocalDate(startDate, -MAX_WINDOW_DAYS),
        ].sort()[0]!,
        // Weigh-ins for the same calibration windows, and the weight tracker.
        weightFetchStart: [
            shiftLocalDate(today, -(Math.max(days, WEIGHT_WINDOW_DAYS) - 1)),
            shiftLocalDate(startDate, -MAX_WINDOW_DAYS),
        ].sort()[0]!,
    };
}

/** What dashboardPayload fetches, already filtered to dashboardWindow. */
export interface DashboardInputs {
    profile: Profile | null;
    meals: Meal[];
    water: WaterEntry[];
    weight: WeightEntry[];
    goals: NutritionGoals | null;
    latestWeight: WeightEntry | null;
    activityRows: ActivityDay[];
    /** Manual calibration choices by date: true = count, false = exclude. */
    dayOverrides?: Record<string, boolean>;
    /** Model parameters; omitted = the defaults. Only the what-if lab
     *  passes others. */
    model?: ModelParams;
    days: number;
    /** The user's local today, YYYY-MM-DD. */
    today: string;
}

/**
 * Everything the page charts, for one user and range. Separate from the route
 * so it is testable without a bearer token (src/mcp.test.ts drives it through
 * the shared Supabase mock).
 */
export async function dashboardPayload(userId: string, days: number) {
    return buildDashboardPayload(await loadDashboardInputs(userId, days));
}

/** Fetch everything one dashboard request needs (see dashboardWindow). */
export async function loadDashboardInputs(
    userId: string,
    days: number,
): Promise<DashboardInputs> {
    const profile = await getProfile(userId);
    const tz = timezoneFromProfile(profile) ?? "UTC";
    const today = todayInTz(tz);
    const { endDate, weightFetchStart, fetchStart } = dashboardWindow(
        today,
        days,
    );

    const [meals, water, weight, goals, latestWeight, activityRows] =
        await Promise.all([
            getMealsInRange(userId, fetchStart, endDate, tz),
            getWaterInRange(userId, fetchStart, endDate, tz),
            getWeightInRange(userId, weightFetchStart, endDate, tz),
            getNutritionGoals(userId),
            getLatestWeight(userId),
            // Optional enrichment: a missing activity table must not take
            // the whole dashboard down with it.
            getActivityInRange(userId, fetchStart, endDate).catch(() => []),
        ]);

    const dayOverrides = await getCalibrationDayOverrides(
        userId,
        fetchStart,
        endDate,
    ).catch(() => ({}));

    return {
        profile,
        meals,
        water,
        weight,
        goals,
        latestWeight,
        activityRows,
        dayOverrides,
        days,
        today,
    };
}

/**
 * The pure half of dashboardPayload: rows in, page JSON out. No Supabase, so
 * the dev preview (scripts/dashboard-preview.ts) renders the real page from
 * synthetic rows through exactly the code production runs.
 */
export function buildDashboardPayload(inputs: DashboardInputs) {
    const {
        profile,
        meals,
        water,
        weight,
        goals,
        latestWeight,
        activityRows,
        dayOverrides = {},
        days,
        today,
    } = inputs;
    const model = inputs.model ?? modelFromProfile(profile);
    const tz = timezoneFromProfile(profile) ?? "UTC";
    const weightUnit = preferredWeightUnitFromProfile(profile) ?? "kg";
    const { startDate, endDate, weightStart, fetchStart } = dashboardWindow(
        today,
        days,
    );

    // The same bucketing the MCP trend tools use, so a figure here and a
    // figure the assistant quotes cannot disagree. Bucketed from fetchStart
    // (the range, widened for `last7`); `daily` is then cut back to the range.
    const buckets = buildDailyBuckets(meals, water, fetchStart, endDate, tz);
    // Every fetched weigh-in feeds the calibration windows; the weight
    // tracker and the weights payload keep their own [weightStart, endDate].
    const allWeighIns: WeighIn[] = weight
        .map((w) => ({
            date: dateInTz(w.logged_at, tz),
            weight_g: w.weight_g,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    const weighIns = allWeighIns.filter((w) => w.date >= weightStart);
    const latest: WeighIn | null = latestWeight
        ? {
              date: dateInTz(latestWeight.logged_at, tz),
              weight_g: latestWeight.weight_g,
          }
        : null;
    // BMR needs a weight for every day, including days before the first
    // weigh-in in the window; the latest reading overall backs those.
    const weightsForBmr =
        allWeighIns.length || !latest ? allWeighIns : [latest];
    const body = bodyOf(profile);
    const activeByDate = activityByDate(activityRows);
    const allRows = buildDashboardDays(
        buckets,
        activeByDate,
        goals,
        body,
        weightsForBmr,
        endDate,
    );
    // Which days count in the calibration: automatic (breakfast, lunch and
    // dinner logged) unless the user chose otherwise for that day.
    const hasWatch = allRows.some((r) => r.active_kcal != null);
    // "Typical" is judged once, over the calibration window ending
    // yesterday, so a day's verdict does not depend on the chart range.
    const windowFrom = shiftLocalDate(endDate, -model.windowDays);
    const windowTo = shiftLocalDate(endDate, -1);
    const typicalKcal = typicalDayKcal(allRows, windowFrom, windowTo);
    for (const row of allRows) {
        const override = dayOverrides[row.date] ?? null;
        const c = countDay(row, override, hasWatch, typicalKcal);
        row.count_override = override;
        row.counts_in_calibration = c.counted;
        row.count_reason = c.reason;
    }
    // From the FORMULA rows, before any calibration is applied to them.
    const energyDays: EnergyDay[] = allRows.map((r) => ({
        date: r.date,
        calories: r.calories,
        active_kcal: r.active_kcal,
        bmr_kcal: r.bmr_kcal,
        tef_kcal: r.tef_kcal,
        counted: r.counts_in_calibration === true,
    }));
    const calibration = buildCalibration(
        energyDays,
        allWeighIns,
        endDate,
        profile?.resting_basis === "calibrated" ? "calibrated" : "formula",
        model,
    );
    const metabolism = metabolismSeries(
        energyDays,
        allWeighIns,
        allRows.filter((r) => r.date >= startDate).map((r) => r.date),
    );
    if (calibration.applied && calibration.implied_kcal_per_day != null) {
        for (const row of allRows) {
            if (row.bmr_kcal == null) continue;
            const baseline = calibratedBaseline(
                row.bmr_kcal,
                calibration.implied_kcal_per_day,
            ).kcal;
            row.bmr_kcal = baseline;
            row.burn_kcal = dailyBurn(baseline, row.active_kcal, row.tef_kcal);
            row.balance_g =
                row.mealCount > 0
                    ? balanceGrams(row.calories, row.burn_kcal)
                    : null;
            row.balance_kcal =
                row.mealCount > 0
                    ? Math.round(row.calories - row.burn_kcal)
                    : null;
        }
    }
    // Every goal that is not a typed number — the estimated burn, a rate or a
    // target date — is derived here from each day's (calibrated) resting burn
    // and active kcal, active counted once and grossed up for digestion.
    const goalPlan = applyDerivedGoals({
        rows: allRows,
        goals,
        weighIns: allWeighIns,
        energyDays,
        calibration,
        body,
        today: endDate,
        model,
    });
    // The balance in grams uses the same kcal per gram as the calibration and
    // the goal, so a user's own setting changes all three together.
    if (model.kcalPerGram !== KCAL_PER_GRAM)
        for (const row of allRows)
            if (row.balance_kcal != null)
                row.balance_g = Math.round(
                    row.balance_kcal / model.kcalPerGram,
                );
    const dayRows = allRows.filter((r) => r.date >= startDate);
    const inRange = (iso: string) => {
        const d = dateInTz(iso, tz);
        return d >= startDate && d <= endDate;
    };

    return {
        timezone: tz,
        weightUnit,
        startDate,
        endDate,
        days,
        calibration,
        // Everything the "How this is calculated" panel shows: the rules,
        // the constants, the BMR inputs and every day of the window with
        // its verdict, so each figure can be traced back to logged data.
        calibrationDetail: {
            constants: {
                window_days: model.windowDays,
                kcal_per_gram: model.kcalPerGram,
                // Digestion: per-macro shares of kcal (null tef_fraction),
                // with TEF_FRACTION for a day without macros.
                tef_fraction: model.tefFraction,
                tef_rates: {
                    protein: TEF_PROTEIN,
                    carbs: TEF_CARBS,
                    fat: TEF_FAT,
                    fallback: TEF_FRACTION,
                },
                min_span_days: MIN_SPAN,
                min_weighin_days: MIN_WEIGHIN_DAYS,
                min_coverage: MIN_COVERAGE,
                max_uncertainty_kcal: MAX_UNCERTAINTY_KCAL,
                clamp: CLAMP,
                min_day_entries: MIN_DAY_ENTRIES,
                min_day_share: MIN_DAY_SHARE,
            },
            typical_day_kcal: typicalKcal,
            min_day_kcal:
                typicalKcal == null
                    ? null
                    : Math.round(typicalKcal * MIN_DAY_SHARE),
            has_watch: hasWatch,
            bmr_inputs: bmrInputs(body, weightsForBmr, endDate),
            days: allRows
                .filter((r) => r.date >= windowFrom && r.date <= windowTo)
                .map((r) => ({
                    date: r.date,
                    calories: r.calories,
                    entries: r.mealCount,
                    active_kcal: r.active_kcal,
                    bmr_kcal: energyDays.find((d) => d.date === r.date)!
                        .bmr_kcal,
                    counted: r.counts_in_calibration === true,
                    reason: r.count_reason!,
                })),
        },
        body,
        weightStats: buildWeightStats(
            weighIns,
            latest,
            body,
            goals,
            activeByDate.get(endDate) ?? null,
            endDate,
            allRows.find((r) => r.date === endDate)?.tef_kcal ?? 0,
        ),
        weightWindowStart: weightStart,
        goals: goals
            ? {
                  calories: goals.daily_calories,
                  protein_g: goals.daily_protein_g,
                  carbs_g: goals.daily_carbs_g,
                  fat_g: goals.daily_fat_g,
                  fiber_g: goals.daily_fiber_g,
                  sugar_g: goals.daily_sugar_g,
                  water_ml: goals.daily_water_ml,
                  target_weight_g: goals.target_weight_g,
                  mode: resolveGoalMode(goals),
                  weight_rate_g_per_day: goals.weight_rate_g_per_day,
                  target_date: goals.target_date,
              }
            : null,
        // The plan behind today's derived goal: rate, trend weight, basis,
        // digestion share and the advisory flags (goal-plan.ts).
        goalPlan,
        // The user's own model settings (null = default), with the defaults
        // beside them so the form can say what "blank" means.
        modelSettings: {
            energy_kcal_per_gram:
                profile?.energy_kcal_per_gram == null
                    ? null
                    : Number(profile.energy_kcal_per_gram),
            trend_window_days: profile?.trend_window_days ?? null,
            default_kcal_per_gram: DEFAULT_PARAMS.kcalPerGram,
            default_window_days: DEFAULT_PARAMS.windowDays,
            min_window_days: MIN_WINDOW_DAYS,
            max_window_days: MAX_WINDOW_DAYS,
        },
        // Per-day rows carry that day's EFFECTIVE goal (baseline + active
        // kcal) next to its totals; `goals` above stays the baseline.
        // Built field by field (dashboard-stats.ts), so the bucket's
        // mealTypes Set — which JSON.stringify renders as {} — never ships.
        daily: dayRows,
        // The calibration window (28 days ending yesterday) as the
        // Estimate-vs-reality card shows it: the same days, trend and offset
        // as `calibration`, so the card and the Body tab cannot disagree.
        estimateVsScale: buildEstimateVsScale(calibration.window),
        // One point per day of the range: the formula BMR next to the
        // baseline the 28 days before it imply. The last point is exactly
        // the Body tab's calibrated figure.
        metabolism,
        // Today's two 7-day figures, from the widened rows: fixed to the
        // last week whatever the selected range.
        last7: buildLast7(allRows, weighIns, endDate),
        // The Trends charts' bars: daily for 7 days, weekly for 30, monthly
        // for a year — averages per logged day (dashboard-stats.ts).
        // `daily` above is unchanged and still feeds the tiles and Today.
        granularity: granularityFor(days),
        trendBuckets: groupDays(dayRows, granularityFor(days)),
        weights: weight
            .filter((w) => dateInTz(w.logged_at, tz) >= weightStart)
            .map((w) => ({
                // Local calendar day, resolved here: the page slicing the UTC
                // ISO string would file an evening weigh-in under tomorrow.
                date: dateInTz(w.logged_at, tz),
                logged_at: w.logged_at,
                weight_g: w.weight_g,
            })),
        // Only the range's meals: the fetch reaches back further for last7.
        meals: meals
            .filter((m) => inRange(m.logged_at))
            .sort((a, b) => b.logged_at.localeCompare(a.logged_at))
            .slice(0, 50)
            .map((m) => ({
                id: m.id,
                logged_at: m.logged_at,
                meal_type: m.meal_type,
                description: m.description,
                calories: m.calories,
                protein_g: m.protein_g,
                carbs_g: m.carbs_g,
                fat_g: m.fat_g,
                fiber_g: m.fiber_g,
                sugar_g: m.sugar_g,
            })),
    };
}

/** The what-if lab's query: window (21-56 days), k (5.0-7.7 kcal/g) and tef
 *  ("macros" or a share 0.05-0.15). Null when any value is out of range. */
export function parseModelParams(
    q: Record<string, string | undefined>,
): ModelParams | null {
    const windowDays =
        q.window == null ? DEFAULT_PARAMS.windowDays : Number(q.window);
    const kcalPerGram = q.k == null ? DEFAULT_PARAMS.kcalPerGram : Number(q.k);
    const tefFraction =
        q.tef == null || q.tef === "macros" ? null : Number(q.tef);
    if (
        !Number.isInteger(windowDays) ||
        windowDays < MIN_WINDOW_DAYS ||
        windowDays > MAX_WINDOW_DAYS ||
        !Number.isFinite(kcalPerGram) ||
        kcalPerGram < 5 ||
        kcalPerGram > 7.7 ||
        (tefFraction != null &&
            (!Number.isFinite(tefFraction) ||
                tefFraction < 0.05 ||
                tefFraction > 0.15))
    )
        return null;
    return { windowDays, kcalPerGram, tefFraction };
}

/** Default and custom calibrations side by side, for the what-if lab. */
export function whatIf(inputs: DashboardInputs, params: ModelParams) {
    const pick = (model: ModelParams) => {
        const p = buildDashboardPayload({ ...inputs, model });
        return { params: model, calibration: p.calibration };
    };
    return { default: pick(DEFAULT_PARAMS), custom: pick(params) };
}

/** Validate and save the Body form (same rules as set_body_profile). */
export async function saveBodyDetails(
    userId: string,
    input: Record<string, unknown>,
): Promise<{ status: 200 | 400; json: Record<string, unknown> }> {
    const profile = await getProfile(userId);
    const today = todayInTz(timezoneFromProfile(profile) ?? "UTC");
    const {
        resting_basis,
        energy_kcal_per_gram,
        trend_window_days,
        ...bodyInput
    } = input;
    const model = checkModelSettings({
        energy_kcal_per_gram,
        trend_window_days,
    });
    if (!model.ok)
        return {
            status: 400,
            json: { error: "invalid_request", error_description: model.error },
        };
    if (
        resting_basis !== undefined &&
        resting_basis !== "formula" &&
        resting_basis !== "calibrated"
    )
        return {
            status: 400,
            json: {
                error: "invalid_request",
                error_description:
                    "resting_basis must be formula or calibrated.",
            },
        };
    const checked = checkBodyPatch(bodyInput, today);
    if (!checked.ok)
        return {
            status: 400,
            json: {
                error: "invalid_request",
                error_description: checked.error,
            },
        };
    const saved = await upsertProfile(userId, {
        ...checked.patch,
        ...(resting_basis ? { resting_basis } : {}),
        ...model.patch,
    });
    return { status: 200, json: { ok: true, body: bodyOf(saved) } };
}

/** The Body form's two model settings: kcal per gram of weight change (3-9)
 *  and the trend lookback (whole days, 21-56). Undefined leaves a setting
 *  alone; null or "" clears it back to the default (6.0 and 42). */
export function checkModelSettings(input: {
    energy_kcal_per_gram?: unknown;
    trend_window_days?: unknown;
}):
    | {
          ok: true;
          patch: {
              energy_kcal_per_gram?: number | null;
              trend_window_days?: number | null;
          };
      }
    | { ok: false; error: string } {
    const patch: {
        energy_kcal_per_gram?: number | null;
        trend_window_days?: number | null;
    } = {};
    const k = input.energy_kcal_per_gram;
    if (k !== undefined) {
        if (k === null || k === "") patch.energy_kcal_per_gram = null;
        else {
            const n = toNumber(k);
            if (n == null || n < 3 || n > 9)
                return {
                    ok: false,
                    error: "Energy per gram must be between 3 and 9 kcal/g (the default is 6).",
                };
            patch.energy_kcal_per_gram = Math.round(n * 100) / 100;
        }
    }
    const w = input.trend_window_days;
    if (w !== undefined) {
        if (w === null || w === "") patch.trend_window_days = null;
        else {
            const n = toNumber(w);
            if (
                n == null ||
                !Number.isInteger(n) ||
                n < MIN_WINDOW_DAYS ||
                n > MAX_WINDOW_DAYS
            )
                return {
                    ok: false,
                    error: `The trend window must be a whole number of days between ${MIN_WINDOW_DAYS} and ${MAX_WINDOW_DAYS} (the default is 42).`,
                };
            patch.trend_window_days = n;
        }
    }
    return { ok: true, patch };
}

/** The "Calorie goal" form: a baseline kcal figure (the day's active kcal are
 *  added on top, as for every goal), or null to go back to the estimated
 *  burn. Same ceiling as set_nutrition_goals. */
export function checkCalorieGoal(
    input: Record<string, unknown>,
): { ok: true; value: number | null } | { ok: false; error: string } {
    if (!("calories" in input))
        return { ok: false, error: "calories is required (or null to reset)." };
    if (input.calories === null || input.calories === "")
        return { ok: true, value: null };
    const n = toNumber(input.calories);
    if (n == null || n < 500 || n > MAX_CALORIES)
        return {
            ok: false,
            error: `Calorie goal must be between 500 and ${MAX_CALORIES.toLocaleString("en-US")} kcal.`,
        };
    return { ok: true, value: Math.round(n) };
}

/** What the calorie-goal form saves: a mode and the figures that mode owns.
 *  Everything a mode does not own is cleared, so the modes are exclusive. */
export interface GoalPlanPatch {
    mode: GoalMode;
    daily_calories: number | null;
    weight_rate_g_per_day: number | null;
    target_date: string | null;
    /** Only a date goal sets the target weight; undefined keeps the stored one. */
    target_weight_g?: number;
}

/** Hard bound on a stored rate, g/day: well past every advisory flag, it only
 *  catches a typo (a unit slip) — nothing else about a plan is refused. */
const MAX_RATE_G_PER_DAY = 2000;

/**
 * The calorie-goal form's body. The old shape `{ calories: n | null }` still
 * means fixed / estimated burn. Only impossible input is refused (not a
 * number, a missing figure, a date that is not a real future date); the safety
 * rules of thumb are advisory flags, not validation (goal-plan.ts).
 */
export function checkGoalPlan(
    input: Record<string, unknown>,
    ctx: { today: string; unit: WeightUnit },
): { ok: true; value: GoalPlanPatch } | { ok: false; error: string } {
    const mode = input.mode;
    if (mode === undefined) {
        const legacy = checkCalorieGoal(input);
        if (!legacy.ok) return legacy;
        return {
            ok: true,
            value: {
                mode: legacy.value == null ? "burn" : "fixed",
                daily_calories: legacy.value,
                weight_rate_g_per_day: null,
                target_date: null,
            },
        };
    }
    if (mode === "burn")
        return {
            ok: true,
            value: {
                mode,
                daily_calories: null,
                weight_rate_g_per_day: null,
                target_date: null,
            },
        };
    if (mode === "fixed") {
        const fixed = checkCalorieGoal({ calories: input.calories ?? "x" });
        if (!fixed.ok || fixed.value == null)
            return {
                ok: false,
                error: fixed.ok
                    ? "A fixed goal needs a calorie figure."
                    : fixed.error,
            };
        return {
            ok: true,
            value: {
                mode,
                daily_calories: fixed.value,
                weight_rate_g_per_day: null,
                target_date: null,
            },
        };
    }
    const unit = input.unit === undefined ? ctx.unit : input.unit;
    if (!isWeightUnit(unit))
        return { ok: false, error: "unit must be kg or lb." };
    if (mode === "rate") {
        const amount = toNumber(input.rate);
        if (amount == null)
            return {
                ok: false,
                error: "rate is required, e.g. -0.5 (negative loses weight).",
            };
        const period = input.period ?? "week";
        if (period !== "week" && period !== "month" && period !== "year")
            return { ok: false, error: "period must be week, month or year." };
        const perDay = rateToGramsPerDay(amount, unit, period as RatePeriod);
        if (Math.abs(perDay) > MAX_RATE_G_PER_DAY)
            return {
                ok: false,
                error: `That rate is not plausible; check the unit and period.`,
            };
        return {
            ok: true,
            value: {
                mode,
                daily_calories: null,
                weight_rate_g_per_day: Math.round(perDay * 100) / 100,
                target_date: null,
            },
        };
    }
    if (mode === "date") {
        const weight = toNumber(input.target_weight);
        if (weight == null)
            return { ok: false, error: "target_weight is required." };
        const grams = toGrams(weight, unit);
        if (!isPlausibleWeightGrams(grams))
            return { ok: false, error: "That target weight is not plausible." };
        const date = input.target_date;
        if (typeof date !== "string" || !isLocalDate(date))
            return {
                ok: false,
                error: "target_date must be a real date, YYYY-MM-DD.",
            };
        if (date <= ctx.today)
            return { ok: false, error: "target_date must be in the future." };
        return {
            ok: true,
            value: {
                mode,
                daily_calories: null,
                weight_rate_g_per_day: null,
                target_date: date,
                target_weight_g: grams,
            },
        };
    }
    return { ok: false, error: "mode must be fixed, burn, rate or date." };
}

/** Save the calorie goal without touching the other targets (the upsert
 *  rewrites the whole row, so the existing one is carried over). */
export async function saveCalorieGoal(
    userId: string,
    input: Record<string, unknown>,
): Promise<{ status: 200 | 400 | 404; json: Record<string, unknown> }> {
    const profile = await getProfile(userId);
    const checked = checkGoalPlan(input, {
        today: todayInTz(timezoneFromProfile(profile) ?? "UTC"),
        unit: preferredWeightUnitFromProfile(profile) ?? "kg",
    });
    if (!checked.ok) return invalid(checked.error);
    const existing = await getNutritionGoals(userId);
    const plan = checked.value;
    const saved = await upsertNutritionGoals(userId, {
        daily_calories: plan.daily_calories,
        daily_protein_g: existing?.daily_protein_g,
        daily_carbs_g: existing?.daily_carbs_g,
        daily_fat_g: existing?.daily_fat_g,
        daily_fiber_g: existing?.daily_fiber_g,
        daily_sugar_g: existing?.daily_sugar_g,
        daily_alcohol_g: existing?.daily_alcohol_g,
        daily_caffeine_mg: existing?.daily_caffeine_mg,
        daily_water_ml: existing?.daily_water_ml,
        target_weight_g: plan.target_weight_g ?? existing?.target_weight_g,
        calorie_goal_mode: plan.mode,
        weight_rate_g_per_day: plan.weight_rate_g_per_day,
        target_date: plan.target_date,
    });
    return {
        status: 200,
        json: {
            ok: true,
            calories: saved.daily_calories,
            mode: plan.mode,
            rate: saved.weight_rate_g_per_day,
            target_date: saved.target_date,
        },
    };
}

type Checked<T> = { ok: true; value: T } | { ok: false; error: string };
type Reply = { status: 200 | 400 | 404; json: Record<string, unknown> };
const invalid = (error_description: string): Reply => ({
    status: 400,
    json: { error: "invalid_request", error_description },
});
const MAX_NOTE_CHARS = 1000;
const MAX_DESCRIPTION_CHARS = 2000;

/** A timestamp from the page: an offset-less local "YYYY-MM-DDTHH:MM" in the
 *  profile timezone, resolved by the same rules as log_weight / update_meal
 *  (no past bound, 5-minute future tolerance). */
function checkLoggedAt(
    raw: unknown,
    tz: string,
    nowMs: number,
): Checked<string> {
    if (typeof raw !== "string" || !raw.trim())
        return { ok: false, error: "logged_at must be a date and time." };
    try {
        return {
            ok: true,
            value: resolveWriteLoggedAt(
                raw.trim(),
                tz,
                nowMs,
            ).instant.toISOString(),
        };
    } catch (err) {
        if (err instanceof LoggedAtError)
            return { ok: false, error: err.message };
        throw err;
    }
}

function toNumber(raw: unknown): number | null {
    const n = typeof raw === "string" ? Number(raw.trim()) : raw;
    return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/**
 * Validate the page's "Log weight" form — the same conversions and bounds as
 * the log_weight tool (toGrams, isPlausibleWeightGrams, resolveWriteLoggedAt).
 * Pure, so the dev preview applies exactly these rules to its in-memory store.
 */
export function checkWeightEntry(
    input: Record<string, unknown>,
    opts: { tz: string; preferredUnit: WeightUnit | null; nowMs: number },
): Checked<{ weight_g: number; logged_at?: string; notes?: string }> {
    const value = toNumber(input.weight);
    if (value == null || value <= 0)
        return { ok: false, error: "weight must be a number above 0." };
    const unit = input.unit ?? opts.preferredUnit;
    if (!isWeightUnit(unit))
        return { ok: false, error: 'unit must be "kg" or "lb".' };
    const weight_g = toGrams(value, unit);
    if (!isPlausibleWeightGrams(weight_g))
        return {
            ok: false,
            error: `${value} ${unit} is outside ${MIN_PLAUSIBLE_WEIGHT_G / 1000}–${MAX_PLAUSIBLE_WEIGHT_G / 1000} kg — check the unit.`,
        };
    const out: { weight_g: number; logged_at?: string; notes?: string } = {
        weight_g,
    };
    // Omitted means "now", exactly like log_weight.
    if (input.logged_at !== undefined && input.logged_at !== "") {
        const at = checkLoggedAt(input.logged_at, opts.tz, opts.nowMs);
        if (!at.ok) return at;
        out.logged_at = at.value;
    }
    if (
        input.notes !== undefined &&
        input.notes !== null &&
        input.notes !== ""
    ) {
        if (typeof input.notes !== "string")
            return { ok: false, error: "notes must be text." };
        const notes = input.notes.trim();
        if (notes.length > MAX_NOTE_CHARS)
            return {
                ok: false,
                error: `notes is longer than ${MAX_NOTE_CHARS} characters.`,
            };
        if (notes) out.notes = notes;
    }
    return { ok: true, value: out };
}

/** Save a weigh-in from the page. insertWeight's idempotency is unchanged:
 *  resubmitting the identical entry returns the original row. */
export async function logWeightFromDashboard(
    userId: string,
    input: Record<string, unknown>,
): Promise<Reply> {
    const profile = await getProfile(userId);
    const tz = timezoneFromProfile(profile) ?? "UTC";
    const checked = checkWeightEntry(input, {
        tz,
        preferredUnit: preferredWeightUnitFromProfile(profile),
        nowMs: Date.now(),
    });
    if (!checked.ok) return invalid(checked.error);
    const { entry, deduplicated } = await insertWeight(userId, checked.value);
    return {
        status: 200,
        json: {
            ok: true,
            deduplicated,
            entry: {
                id: entry.id,
                logged_at: entry.logged_at,
                date: dateInTz(entry.logged_at, tz),
                weight_g: entry.weight_g,
                notes: entry.notes,
            },
        },
    };
}

type WeightRow = {
    id: string;
    logged_at: string;
    date: string;
    weight_g: number;
    notes: string | null;
};
const weightRow = (e: WeightEntry, tz: string): WeightRow => ({
    id: e.id,
    logged_at: e.logged_at,
    date: dateInTz(e.logged_at, tz),
    weight_g: e.weight_g,
    notes: e.notes,
});

/**
 * Validate a weigh-in edit from the Weigh-ins tab — update_weight's rules
 * (toGrams, isPlausibleWeightGrams, resolveWriteLoggedAt). The page sends only
 * the fields that changed. An empty `notes` clears the note (null); weight and
 * logged_at can't be cleared. Pure, so the dev preview applies the same rules.
 */
export function checkWeightPatch(
    input: Record<string, unknown>,
    opts: { tz: string; preferredUnit: WeightUnit | null; nowMs: number },
): Checked<{ weight_g?: number; logged_at?: string; notes?: string | null }> {
    const out: {
        weight_g?: number;
        logged_at?: string;
        notes?: string | null;
    } = {};
    for (const key of Object.keys(input)) {
        if (!["weight", "unit", "logged_at", "notes"].includes(key))
            return { ok: false, error: `${key} can't be edited here.` };
    }
    if (input.weight !== undefined) {
        const checked = checkWeightEntry(
            { weight: input.weight, unit: input.unit },
            opts,
        );
        if (!checked.ok) return checked;
        out.weight_g = checked.value.weight_g;
    }
    if (input.logged_at !== undefined) {
        const at = checkLoggedAt(input.logged_at, opts.tz, opts.nowMs);
        if (!at.ok) return at;
        out.logged_at = at.value;
    }
    if (input.notes !== undefined) {
        if (input.notes !== null && typeof input.notes !== "string")
            return { ok: false, error: "notes must be text." };
        const notes = (input.notes ?? "").trim();
        if (notes.length > MAX_NOTE_CHARS)
            return {
                ok: false,
                error: `notes is longer than ${MAX_NOTE_CHARS} characters.`,
            };
        out.notes = notes || null;
    }
    if (!Object.keys(out).length)
        return { ok: false, error: "Nothing to change." };
    return { ok: true, value: out };
}

/** Every weigh-in the user has, newest first, with ids — the Weigh-ins tab. */
export async function listWeightsFromDashboard(userId: string): Promise<Reply> {
    const tz = timezoneFromProfile(await getProfile(userId)) ?? "UTC";
    const all = await getAllWeight(userId);
    return {
        status: 200,
        json: {
            weights: all
                .map((e) => weightRow(e, tz))
                .sort((a, b) => b.logged_at.localeCompare(a.logged_at)),
        },
    };
}

export async function updateWeightFromDashboard(
    userId: string,
    id: string,
    input: Record<string, unknown>,
): Promise<Reply> {
    const notFound: Reply = { status: 404, json: { error: "not_found" } };
    if (!UUID_RE.test(id)) return notFound;
    const profile = await getProfile(userId);
    const tz = timezoneFromProfile(profile) ?? "UTC";
    const checked = checkWeightPatch(input, {
        tz,
        preferredUnit: preferredWeightUnitFromProfile(profile),
        nowMs: Date.now(),
    });
    if (!checked.ok) return invalid(checked.error);
    let saved: WeightEntry;
    try {
        saved = await updateWeight(userId, id, checked.value);
    } catch (err) {
        if (err instanceof Error && /entry not found/.test(err.message))
            return notFound;
        throw err;
    }
    return { status: 200, json: { ok: true, entry: weightRow(saved, tz) } };
}

export async function deleteWeightFromDashboard(
    userId: string,
    id: string,
): Promise<Reply> {
    if (!UUID_RE.test(id)) return { status: 404, json: { error: "not_found" } };
    return (await deleteWeight(userId, id))
        ? { status: 200, json: { ok: true } }
        : { status: 404, json: { error: "not_found" } };
}

// update_meal's own list (src/import.ts), "treat" included.
const MEAL_TYPES: readonly string[] = MEAL_TYPE_VALUES;
// update_meal's own bounds (src/import.ts, re-exported by src/mcp.ts).
const MEAL_NUMBER_BOUNDS: Record<string, number> = {
    calories: MAX_CALORIES,
    protein_g: MAX_MACRO_G,
    carbs_g: MAX_MACRO_G,
    fat_g: MAX_MACRO_G,
    fiber_g: MAX_MACRO_G,
    sugar_g: MAX_MACRO_G,
};
const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate the page's meal edit. The page sends ONLY the fields that changed,
 * and only those reach updateMeal, so anything it does not show (alcohol,
 * caffeine, notes) is left exactly as it was. Unknown keys are refused rather
 * than dropped, so a typo cannot look like a successful save.
 */
export function checkMealPatch(
    input: Record<string, unknown>,
    opts: { tz: string; nowMs: number },
): Checked<Partial<MealInput>> {
    const patch: Record<string, string | number> = {};
    for (const [key, raw] of Object.entries(input)) {
        if (key === "description") {
            if (typeof raw !== "string" || !raw.trim())
                return { ok: false, error: "description can't be empty." };
            if (raw.trim().length > MAX_DESCRIPTION_CHARS)
                return {
                    ok: false,
                    error: `description is longer than ${MAX_DESCRIPTION_CHARS} characters.`,
                };
            patch.description = raw.trim();
        } else if (key === "meal_type") {
            if (typeof raw !== "string" || !MEAL_TYPES.includes(raw))
                return {
                    ok: false,
                    error: `meal_type must be one of: ${MEAL_TYPES.join(", ")}.`,
                };
            patch.meal_type = raw as string;
        } else if (key in MEAL_NUMBER_BOUNDS) {
            // Clearing is refused, as update_meal cannot clear either:
            // updateMeal stores calories via toStoredInteger, where null
            // would round to a silent 0 — a fake measurement.
            if (raw === null || raw === "")
                return {
                    ok: false,
                    error: `${key} can't be cleared — enter 0 if there was none.`,
                };
            const n = toNumber(raw);
            const max = MEAL_NUMBER_BOUNDS[key]!;
            if (n == null || n < 0 || n > max)
                return {
                    ok: false,
                    error: `${key} must be a number from 0 to ${max.toLocaleString("en-US")}.`,
                };
            patch[key] = n;
        } else if (key === "logged_at") {
            const at = checkLoggedAt(raw, opts.tz, opts.nowMs);
            if (!at.ok) return at;
            patch.logged_at = at.value;
        } else {
            return { ok: false, error: `${key} can't be edited here.` };
        }
    }
    if (!Object.keys(patch).length)
        return { ok: false, error: "Nothing to change." };
    // Keys and value types were checked one by one above.
    return { ok: true, value: patch as Partial<MealInput> };
}

/** The page's meal edit. 404 for an id that is not one of this user's meals
 *  (updateMeal looks it up and writes it scoped by user_id). */
export async function updateMealFromDashboard(
    userId: string,
    id: string,
    input: Record<string, unknown>,
): Promise<Reply> {
    const notFound: Reply = { status: 404, json: { error: "not_found" } };
    // A non-uuid would fail the uuid column's cast as a 500; it can't be a
    // meal, so it is simply not found.
    if (!UUID_RE.test(id)) return notFound;
    const profile = await getProfile(userId);
    const checked = checkMealPatch(input, {
        tz: timezoneFromProfile(profile) ?? "UTC",
        nowMs: Date.now(),
    });
    if (!checked.ok) return invalid(checked.error);
    let saved: Meal;
    try {
        saved = await updateMeal(userId, id, checked.value);
    } catch (err) {
        if (err instanceof Error && /meal not found/.test(err.message))
            return notFound;
        throw err;
    }
    return {
        status: 200,
        json: {
            ok: true,
            meal: {
                id: saved.id,
                logged_at: saved.logged_at,
                meal_type: saved.meal_type,
                description: saved.description,
                calories: saved.calories,
                protein_g: saved.protein_g,
                carbs_g: saved.carbs_g,
                fat_g: saved.fat_g,
                fiber_g: saved.fiber_g,
                sugar_g: saved.sugar_g,
            },
        },
    };
}

// ---- Logging a meal from the page (no LLM) --------------------------------

// Every numeric a meal can carry, with its bound. Blank is NOT zero here: an
// omitted nutrient is stored as "nobody measured this", and a stored 0 would
// be a fake measurement (a caffeine 0 even switches the caffeine row on).
const MEAL_ENTRY_BOUNDS: Record<string, number> = {
    ...MEAL_NUMBER_BOUNDS,
    alcohol_g: MAX_ALCOHOL_G,
    caffeine_mg: MAX_CAFFEINE_MG,
};

// The page mints one uuid per form-open / tap and the server prefixes it, so
// the page can never forge an "auto:" or "import:" key. A double-click or a
// retried request lands on the same row; a second, separate tap is a new
// meal — the same coffee tomorrow, or twice today, is two meals.
function checkClientKey(raw: unknown): Checked<string | undefined> {
    if (raw === undefined || raw === null || raw === "")
        return { ok: true, value: undefined };
    if (typeof raw !== "string" || !UUID_RE.test(raw))
        return { ok: false, error: "client_key must be a uuid." };
    return { ok: true, value: `dash:${raw.toLowerCase()}` };
}

/**
 * Validate the page's "Log a meal" form. Pure, so the dev preview applies the
 * same rules to its in-memory store. description and meal_type are required;
 * every number is optional and a blank one is simply left out. Unknown keys
 * are refused so a typo cannot look like a successful save.
 */
export function checkMealEntry(
    input: Record<string, unknown>,
    opts: { tz: string; nowMs: number },
): Checked<MealInput> {
    const allowed = new Set([
        "description",
        "meal_type",
        "logged_at",
        "client_key",
        ...Object.keys(MEAL_ENTRY_BOUNDS),
    ]);
    for (const key of Object.keys(input))
        if (!allowed.has(key))
            return { ok: false, error: `${key} can't be set here.` };

    const description =
        typeof input.description === "string" ? input.description.trim() : "";
    if (!description) return { ok: false, error: "Describe what you ate." };
    if (description.length > MAX_DESCRIPTION_CHARS)
        return {
            ok: false,
            error: `description is longer than ${MAX_DESCRIPTION_CHARS} characters.`,
        };
    if (
        typeof input.meal_type !== "string" ||
        !MEAL_TYPES.includes(input.meal_type)
    )
        return {
            ok: false,
            error: `meal_type must be one of: ${MEAL_TYPES.join(", ")}.`,
        };

    const meal: Record<string, string | number> = {
        description,
        meal_type: input.meal_type,
    };
    for (const [key, max] of Object.entries(MEAL_ENTRY_BOUNDS)) {
        const raw = input[key];
        if (raw === undefined || raw === null || raw === "") continue;
        const n = toNumber(raw);
        if (n == null || n < 0 || n > max)
            return {
                ok: false,
                error: `${key} must be a number from 0 to ${max.toLocaleString("en-US")}.`,
            };
        meal[key] = n;
    }
    // Omitted means "now", exactly like log_meal.
    if (input.logged_at !== undefined && input.logged_at !== "") {
        const at = checkLoggedAt(input.logged_at, opts.tz, opts.nowMs);
        if (!at.ok) return at;
        meal.logged_at = at.value;
    }
    const key = checkClientKey(input.client_key);
    if (!key.ok) return key;
    if (key.value) meal.idempotency_key = key.value;
    // Keys and value types were checked one by one above.
    return { ok: true, value: meal as unknown as MealInput };
}

function mealSummary(m: Meal) {
    return {
        id: m.id,
        logged_at: m.logged_at,
        meal_type: m.meal_type,
        description: m.description,
        calories: m.calories,
        protein_g: m.protein_g,
        carbs_g: m.carbs_g,
        fat_g: m.fat_g,
        fiber_g: m.fiber_g,
        sugar_g: m.sugar_g,
    };
}

/** Save a meal typed into the page, through the same insertMeal every other
 *  path uses. */
export async function logMealFromDashboard(
    userId: string,
    input: Record<string, unknown>,
): Promise<Reply> {
    const profile = await getProfile(userId);
    const checked = checkMealEntry(input, {
        tz: timezoneFromProfile(profile) ?? "UTC",
        nowMs: Date.now(),
    });
    if (!checked.ok) return invalid(checked.error);
    const { meal, deduplicated } = await insertMeal(userId, checked.value);
    return {
        status: 200,
        json: { ok: true, deduplicated, meal: mealSummary(meal) },
    };
}

/**
 * The fields a repeat copies from a meal the user already has. Copied
 * server-side by id because the page's meal rows do not carry caffeine,
 * alcohol or notes — copying client-side would log the morning coffee with no
 * caffeine. Pure, shared with the preview.
 */
export function repeatFields(
    source: Meal,
    opts: { clientKey?: string; loggedAt?: string; mealType?: string },
): MealInput {
    const meal: Record<string, string | number> = {
        description: source.description,
        meal_type: opts.mealType ?? source.meal_type ?? "snack",
    };
    if (opts.loggedAt) meal.logged_at = opts.loggedAt;
    for (const key of [
        "calories",
        "protein_g",
        "carbs_g",
        "fat_g",
        "fiber_g",
        "sugar_g",
        "alcohol_g",
        "caffeine_mg",
        "notes",
    ] as const) {
        const v = source[key];
        if (v != null) meal[key] = v;
    }
    if (opts.clientKey) meal.idempotency_key = opts.clientKey;
    return meal as unknown as MealInput;
}

/**
 * Validate what a repeat may override: only client_key (always), plus an
 * optional logged_at ("Duplicate to…" on the Meals tab) and meal_type. Every
 * other field is copied from the source meal, so nothing else is accepted.
 * Pure, shared with the preview. Omitted logged_at means "now".
 */
export function checkRepeat(
    input: Record<string, unknown>,
    opts: { tz: string; nowMs: number },
): Checked<{ clientKey?: string; loggedAt?: string; mealType?: string }> {
    for (const key of Object.keys(input))
        if (!["client_key", "logged_at", "meal_type"].includes(key))
            return { ok: false, error: `${key} can't be set here.` };
    const key = checkClientKey(input.client_key);
    if (!key.ok) return key;
    const out: { clientKey?: string; loggedAt?: string; mealType?: string } = {
        clientKey: key.value,
    };
    if (input.meal_type !== undefined && input.meal_type !== "") {
        if (
            typeof input.meal_type !== "string" ||
            !MEAL_TYPES.includes(input.meal_type)
        )
            return {
                ok: false,
                error: `meal_type must be one of: ${MEAL_TYPES.join(", ")}.`,
            };
        out.mealType = input.meal_type;
    }
    if (input.logged_at !== undefined && input.logged_at !== "") {
        const at = checkLoggedAt(input.logged_at, opts.tz, opts.nowMs);
        if (!at.ok) return at;
        out.loggedAt = at.value;
    }
    return { ok: true, value: out };
}

/** "Log this again" (now, or at the chosen time): the one-tap path. 404 for an id that is not one of
 *  this user's meals. */
export async function repeatMealFromDashboard(
    userId: string,
    id: string,
    input: Record<string, unknown>,
): Promise<Reply> {
    const notFound: Reply = { status: 404, json: { error: "not_found" } };
    if (!UUID_RE.test(id)) return notFound;
    const profile = await getProfile(userId);
    const opts = checkRepeat(input, {
        tz: timezoneFromProfile(profile) ?? "UTC",
        nowMs: Date.now(),
    });
    if (!opts.ok) return invalid(opts.error);
    const source = await getMealById(userId, id);
    if (!source) return notFound;
    const { meal, deduplicated } = await insertMeal(
        userId,
        repeatFields(source, opts.value),
    );
    return {
        status: 200,
        json: { ok: true, deduplicated, meal: mealSummary(meal) },
    };
}

/** Delete one of the user's meals (the "Undo" after a one-tap log). 404 when
 *  nothing matched, so the page never claims a delete that did not happen. */
export async function deleteMealFromDashboard(
    userId: string,
    id: string,
): Promise<Reply> {
    if (!UUID_RE.test(id)) return { status: 404, json: { error: "not_found" } };
    return (await deleteMeal(userId, id))
        ? { status: 200, json: { ok: true } }
        : { status: 404, json: { error: "not_found" } };
}

async function readObject(c: {
    req: { json: () => Promise<unknown> };
}): Promise<Record<string, unknown> | null> {
    try {
        const parsed = await c.req.json();
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : null;
    } catch {
        return null;
    }
}

// The /dashboard page's CSP: the server default (src/index.ts) with font-src
// narrowed to 'self', because the page self-hosts its fonts and must make no
// third-party request. src/dashboard-fixture.test.ts checks it differs from
// the default only in font-src.
export const DASHBOARD_CSP =
    "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self'; img-src 'self'; frame-ancestors 'none'";

// Allowlist of the self-hosted dashboard fonts (public/dashboard-fonts/,
// OFL texts alongside). Versioned names: the bytes never change under a name,
// which is what makes the immutable cache safe.
export const DASHBOARD_FONTS: ReadonlySet<string> = new Set([
    "bricolage-grotesque-latin-v9.woff2",
    "instrument-sans-latin-v4.woff2",
    "geist-mono-latin-v6.woff2",
]);

// One implementation for production and the preview. null = not ours (404).
export function dashboardFontResponse(file: string): Response | null {
    if (!DASHBOARD_FONTS.has(file)) return null;
    return new Response(Bun.file(`./public/dashboard-fonts/${file}`), {
        headers: {
            "Content-Type": "font/woff2",
            "Cache-Control": "public, max-age=31536000, immutable",
        },
    });
}

export function createDashboardRouter(): Hono {
    const dash = new Hono();

    // Self-hosted fonts for the page. Unauthenticated (the login card needs
    // them, and font fetches carry no bearer); the allowlist lookup is the
    // only path check, so no path is ever built from unchecked input.
    dash.get(
        "/dashboard-fonts/:file",
        (c) => dashboardFontResponse(c.req.param("file")) ?? c.notFound(),
    );

    // Exchange email + password for an access token. Deliberately does NOT
    // sign anyone up: the account is created through the OAuth flow when the
    // MCP client first connects, and a dashboard that could mint accounts
    // would be a second, weaker door onto the same data.
    dash.post("/api/dashboard/login", rateLimitAuth, async (c) => {
        let body: { email?: unknown; password?: unknown };
        try {
            body = await c.req.json();
        } catch {
            return c.json({ error: "invalid_request" }, 400);
        }

        const email =
            typeof body.email === "string"
                ? body.email.trim().toLowerCase()
                : "";
        const password = typeof body.password === "string" ? body.password : "";
        if (!email || !password) {
            return c.json({ error: "invalid_request" }, 400);
        }

        let userId: string;
        try {
            userId = await signInUser(email, password);
        } catch {
            // One message for every failure mode. Distinguishing "no such
            // user" from "wrong password" would confirm which addresses have
            // accounts here.
            return c.json({ error: "invalid_credentials" }, 401);
        }

        const token = crypto.randomUUID();
        await storeToken(token, userId);
        return c.json({ access_token: token });
    });

    // Everything the page charts, in one call. One round trip keeps the page
    // from rendering half-populated while three fetches land.
    dash.get("/api/dashboard/data", authenticateBearer, async (c) => {
        const userId = c.get("userId") as string;
        return c.json(
            await dashboardPayload(userId, clampDays(c.req.query("days"))),
        );
    });

    // The what-if lab: the calibration under other model parameters, next
    // to the default. Read-only — nothing here reaches goals, balances or
    // the MCP tools, which always use the defaults.
    dash.get("/api/dashboard/whatif", authenticateBearer, async (c) => {
        const userId = c.get("userId") as string;
        const params = parseModelParams(c.req.query());
        if (!params) return c.json({ error: "invalid_request" }, 400);
        const inputs = await loadDashboardInputs(userId, 30);
        return c.json(whatIf(inputs, params));
    });

    // Save body details from the page's Body form. Same validation as the
    // set_body_profile tool (checkBodyPatch), so the two doors agree.
    dash.post("/api/dashboard/body", authenticateBearer, async (c) => {
        const userId = c.get("userId") as string;
        let body: Record<string, unknown>;
        try {
            const parsed = await c.req.json();
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
                throw new Error("not an object");
            body = parsed as Record<string, unknown>;
        } catch {
            return c.json({ error: "invalid_request" }, 400);
        }
        const res = await saveBodyDetails(userId, body);
        return c.json(res.json, res.status);
    });

    dash.post(
        "/api/dashboard/calibration/day",
        authenticateBearer,
        async (c) => {
            const body = await readObject(c);
            if (
                !body ||
                typeof body.date !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(body.date) ||
                !Number.isFinite(Date.parse(`${body.date}T00:00:00Z`)) ||
                new Date(`${body.date}T00:00:00Z`)
                    .toISOString()
                    .slice(0, 10) !== body.date ||
                // true = count, false = exclude, null = back to automatic.
                !(body.counted === null || typeof body.counted === "boolean")
            )
                return c.json({ error: "invalid_request" }, 400);
            const userId = c.get("userId") as string;
            const profile = await getProfile(userId);
            if (body.date > todayInTz(timezoneFromProfile(profile) ?? "UTC"))
                return c.json({ error: "invalid_request" }, 400);
            try {
                await setCalibrationDayOverride(
                    userId,
                    body.date,
                    body.counted as boolean | null,
                );
            } catch {
                return c.json({ error: "unavailable" }, 503);
            }
            return c.json({ ok: true });
        },
    );

    // Set (or reset to the estimated burn) the daily calorie goal.
    dash.post("/api/dashboard/goal", authenticateBearer, async (c) => {
        const body = await readObject(c);
        if (!body) return c.json({ error: "invalid_request" }, 400);
        const res = await saveCalorieGoal(c.get("userId") as string, body);
        return c.json(res.json, res.status);
    });

    // Log a weigh-in from the page — the log_weight tool's rules, no LLM.
    dash.post("/api/dashboard/weight", authenticateBearer, async (c) => {
        const body = await readObject(c);
        if (!body) return c.json({ error: "invalid_request" }, 400);
        const res = await logWeightFromDashboard(
            c.get("userId") as string,
            body,
        );
        return c.json(res.json, res.status);
    });

    // The Weigh-ins tab: every entry with its id, then edit / delete one.
    dash.get("/api/dashboard/weights", authenticateBearer, async (c) => {
        const res = await listWeightsFromDashboard(c.get("userId") as string);
        return c.json(res.json, res.status);
    });
    dash.patch("/api/dashboard/weights/:id", authenticateBearer, async (c) => {
        const body = await readObject(c);
        if (!body) return c.json({ error: "invalid_request" }, 400);
        const res = await updateWeightFromDashboard(
            c.get("userId") as string,
            c.req.param("id") ?? "",
            body,
        );
        return c.json(res.json, res.status);
    });
    dash.delete("/api/dashboard/weights/:id", authenticateBearer, async (c) => {
        const res = await deleteWeightFromDashboard(
            c.get("userId") as string,
            c.req.param("id") ?? "",
        );
        return c.json(res.json, res.status);
    });

    // Edit one of the user's meals from the Meals tab — update_meal's rules.
    dash.patch("/api/dashboard/meals/:id", authenticateBearer, async (c) => {
        const body = await readObject(c);
        if (!body) return c.json({ error: "invalid_request" }, 400);
        const res = await updateMealFromDashboard(
            c.get("userId") as string,
            c.req.param("id") ?? "",
            body,
        );
        return c.json(res.json, res.status);
    });

    // The meals this user logs most, from their own history — the "Log a
    // meal" block's one-tap list.
    dash.get("/api/dashboard/frequent", authenticateBearer, async (c) => {
        const userId = c.get("userId") as string;
        const tz = timezoneFromProfile(await getProfile(userId)) ?? "UTC";
        const end = todayInTz(tz);
        const meals = await getMealsInRange(
            userId,
            shiftLocalDate(end, -(FREQUENT_DAYS - 1)),
            end,
            tz,
        );
        return c.json({ meals: buildFrequentMeals(meals) });
    });

    // Typical nutrients for a simple item at a chosen amount, so the form
    // can fill them: either free text ("2 beers") or an item picked by id
    // with an amount and count. Pure lookups, no user data involved.
    dash.get("/api/dashboard/foods", authenticateBearer, (c) =>
        c.json({ foods: listFoods() }),
    );
    dash.get("/api/dashboard/foods/suggest", authenticateBearer, (c) =>
        c.json({
            match: suggestFood({
                q: c.req.query("q"),
                id: c.req.query("id"),
                amount: c.req.query("amount"),
                unit: c.req.query("unit"),
                count: c.req.query("count"),
            }),
        }),
    );

    // Log a meal typed into the page — log_meal's write path, no LLM.
    dash.post("/api/dashboard/meals", authenticateBearer, async (c) => {
        const body = await readObject(c);
        if (!body) return c.json({ error: "invalid_request" }, 400);
        const res = await logMealFromDashboard(c.get("userId") as string, body);
        return c.json(res.json, res.status);
    });

    // One tap: log a meal the user already has again, now.
    dash.post(
        "/api/dashboard/meals/:id/repeat",
        authenticateBearer,
        async (c) => {
            const body = await readObject(c);
            if (!body) return c.json({ error: "invalid_request" }, 400);
            const res = await repeatMealFromDashboard(
                c.get("userId") as string,
                c.req.param("id") ?? "",
                body,
            );
            return c.json(res.json, res.status);
        },
    );

    // Delete one meal ("Undo" after a one-tap log).
    dash.delete("/api/dashboard/meals/:id", authenticateBearer, async (c) => {
        const res = await deleteMealFromDashboard(
            c.get("userId") as string,
            c.req.param("id") ?? "",
        );
        return c.json(res.json, res.status);
    });

    return dash;
}
