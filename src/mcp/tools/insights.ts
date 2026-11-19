import { z } from "zod";
import {
    activityByDate,
    activityTrendsLine,
    countedActivity,
    sumActivity,
} from "../../activity.js";
import { buildAddedSugarMeta } from "../../added-sugar.js";
import { withAnalytics } from "../../analytics.js";
import {
    DIGEST_HISTORY_DAYS,
    DIGEST_PERIODS,
    computeDigest,
    digestText,
} from "../../digest.js";
import { newErrorRef } from "../../errors.js";
import {
    buildDailyBuckets,
    computeMealPatterns,
    computeTrends,
} from "../../insights.js";
import { type MealItemValues } from "../../meal-items.js";
import {
    GRANULARITIES,
    buildPeriodAveragesMeta,
    dayTotalsFromMeals,
    formatPeriodContent,
    targetsRecordedFrom,
    yearSpanStart,
    type Granularity,
} from "../../periods.js";
import { buildSaturatedFatMeta } from "../../saturated-fat.js";
import { buildSodiumMeta } from "../../sodium.js";
import {
    getActivityInRange,
    getLatestWeight,
    getMealItems,
    getMealsInRange,
    getNutritionGoals,
    getNutritionGoalsHistory,
    getProfile,
    getUserTimezone,
    getWaterInRange,
    getWeightInRange,
    hasMealsBefore,
    localeFromProfile,
    preferredWeightUnitFromProfile,
    timezoneFromProfile,
    type Meal,
} from "../../supabase.js";
import { dateInTz, shiftLocalDate, todayInTz } from "../../tz.js";
import { DIGEST_META_KEY } from "../../widgets.js";
import { DIGEST_WIDGET_URI, TRENDS_WIDGET_URI } from "../constants.js";
import type { ToolContext } from "../context.js";
import { assertCalendarDate } from "../helpers.js";
import {
    DIGEST_NUTRIENTS_ITEM,
    DRINK_UNIT_FIELD,
    GOALS_ITEM,
    TRENDS_DAY_ITEM,
    goalsPayloadOf,
    trendsDayPayloadOf,
} from "../schemas.js";
import {
    ADDED_SUGAR_META_KEY,
    LOCAL_TODAY_META_KEY,
    PERIOD_AVERAGES_META_KEY,
    SATURATED_FAT_META_KEY,
    SODIUM_META_KEY,
    activityMetaEntry,
    gateAlcohol,
} from "../totals.js";

export function registerInsightsTools(ctx: ToolContext): void {
    const {
        server,
        userId,
        widgetsEnabled,
        alcohol,
        analytics,
        usdaOverrides,
        uiMeta,
        withWidgetPrefs,
    } = ctx;
    server.registerTool(
        "get_digest",
        {
            title: "Get Nutrition Digest",
            description: `A digest of one period: yesterday, today so far, the last 7 days or the last 30 days (both ranges end yesterday). Returns calories and every tracked nutrient against the user's goals (for a range, per logged day with the number of days each goal was met), the latest weight, and for a day the number of meals logged. In clients that support MCP Apps UI it also renders an interactive digest card, which adds a comparison with the previous period, trends, logging habits and highlights. Figures are estimates, not medical or dietary advice.`,
            annotations: {
                title: "Get Nutrition Digest",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                period: z
                    .enum(DIGEST_PERIODS)
                    .optional()
                    .describe(
                        "yesterday (the default), today (so far), last_7_days or last_30_days. Both ranges end yesterday.",
                    ),
            }),
            outputSchema: z.object({
                period: z.enum(DIGEST_PERIODS),
                start_date: z.string(),
                end_date: z.string(),
                days_in_range: z.number(),
                logged_days: z.number(),
                // The widget's UI language, as on get_nutrition_summary.
                locale: z.string(),
                // The day's totals, or per-day averages over the logged days
                // that record each figure. Null = not recorded; alcohol is
                // null when tracking is off.
                averages: DIGEST_NUTRIENTS_ITEM,
                goals: DIGEST_NUTRIENTS_ITEM.omit({
                    trans_fat_g: true,
                }).nullable(),
            }),
            ...uiMeta(DIGEST_WIDGET_URI),
        },
        withWidgetPrefs(async ({ period }) => {
            const which = period ?? "yesterday";
            return withAnalytics(
                "get_digest",
                async () => {
                    const now = new Date();
                    const profile = await getProfile(userId);
                    const tz = timezoneFromProfile(profile) ?? "UTC";
                    const today = dateInTz(now, tz);
                    const start = shiftLocalDate(today, -DIGEST_HISTORY_DAYS);
                    const [meals, water, weights, goals, latestWeight] =
                        await Promise.all([
                            getMealsInRange(userId, start, today, tz),
                            getWaterInRange(userId, start, today, tz),
                            getWeightInRange(userId, start, today, tz),
                            getNutritionGoals(userId),
                            getLatestWeight(userId),
                        ]);
                    // Ingredients for the reported day's meals only (the
                    // meal list); a failed read drops them, never the tool.
                    let items = new Map<string, MealItemValues[]>();
                    if (which === "today" || which === "yesterday") {
                        const day =
                            which === "today"
                                ? today
                                : shiftLocalDate(today, -1);
                        const ids = meals
                            .filter((m) => dateInTz(m.logged_at, tz) === day)
                            .map((m) => m.id);
                        if (ids.length) {
                            try {
                                items = await getMealItems(userId, ids);
                            } catch (err) {
                                const ref = newErrorRef();
                                console.warn(
                                    `[widget] digest meal-items read error ref=${ref}: ${JSON.stringify(err instanceof Error ? err.message : String(err))}`,
                                );
                            }
                        }
                    }
                    const result = computeDigest({
                        period: which,
                        now,
                        tz,
                        meals,
                        water,
                        weights,
                        latestWeight,
                        items,
                        goals,
                        alcohol,
                        weightUnit:
                            preferredWeightUnitFromProfile(profile) ?? "kg",
                        locale: localeFromProfile(profile) ?? "en",
                    });
                    return {
                        content: [{ type: "text", text: digestText(result) }],
                        structuredContent: result.structured,
                        _meta: { [DIGEST_META_KEY]: result.meta },
                    };
                },
                analytics,
                { period: which },
            );
        }),
    );

    server.registerTool(
        "get_trends",
        {
            title: "Get Trends",
            description:
                "Rolling 7/14/30-day averages, standard deviation and coefficient of variation for calories, protein, carbs, fat, fiber, sugar, added sugar, alcohol (when tracking is on), caffeine and water, with days within ±10% of each target or over each limit when goals are set; logging streaks; day-of-week calorie averages; and the best and worst day by calories (closest to and furthest from the calorie target when one is set, otherwise the lowest and highest). Every figure arrives pre-computed. Defaults to the last 30 days ending today. With group_by (week, month, quarter or year) the result also lists calorie, protein, carb and fat averages per calendar period over a fixed span (26 weeks, 24 months, 12 quarters or 5 years), each divided by the days in that period with at least one meal logged rather than by calendar days, beside the targets in effect at the time, the days logged and the days on target. Figures are estimates, not medical or dietary advice.",
            annotations: {
                title: "Get Trends",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                days: z.coerce
                    .number()
                    .int()
                    .min(2)
                    .max(365)
                    .optional()
                    .describe("Window size in days (default 30, max 365)."),
                end_date: z
                    .string()
                    .optional()
                    .describe("Window end date YYYY-MM-DD (default today)."),
                group_by: z
                    .enum(GRANULARITIES as [Granularity, ...Granularity[]])
                    .optional()
                    .describe(
                        "Adds per-period averages per logged day (days with no meals are excluded) against the targets in effect at the time: ISO weeks starting Monday (26 rows), months (24), quarters (12) or years (5), in the profile timezone, ending with the period that contains end_date. The span is fixed per granularity; `days` still sets the rolling-average window.",
                    ),
            }),
            outputSchema: z.object({
                end_date: z.string(),
                // Which toggle the widget opens on (nearest of 7/14/30).
                default_range: z.number(),
                drink_unit: DRINK_UNIT_FIELD,
                // The widget's UI language — see the identical field on
                // get_nutrition_summary's outputSchema for why this is
                // z.string() and resolved server-side via getUserLocale.
                locale: z.string(),
                goals: GOALS_ITEM.nullable(),
                // Up to 30 days of daily series; the widget slices to 7/14/30.
                days: z.array(TRENDS_DAY_ITEM),
            }),
            // Link the tool to its interactive trends UI (MCP Apps).
            ...uiMeta(TRENDS_WIDGET_URI),
        },
        withWidgetPrefs(async ({ days, end_date, group_by }) => {
            return withAnalytics(
                "get_trends",
                async () => {
                    if (end_date !== undefined)
                        assertCalendarDate("end_date", end_date);
                    const profile = await getProfile(userId);
                    const tz = timezoneFromProfile(profile) ?? "UTC";
                    const locale = localeFromProfile(profile) ?? "en";
                    const today = todayInTz(tz);
                    const endDate = end_date ?? today;
                    const windowDays = days ?? 30;
                    // The widget's toggle always offers up to 30 days, so build
                    // at least 30 days of series regardless of the text window.
                    const seriesDays = Math.max(windowDays, 30);
                    const startDate = shiftLocalDate(
                        endDate,
                        -(seriesDays - 1),
                    );
                    // With group_by, one meal read covers every granularity's
                    // span (5 calendar years) and the rolling window too: the
                    // window is at most 365 days, always inside it, and
                    // buildDailyBuckets drops meals outside its own range.
                    // Without group_by, the reads are exactly what they were.
                    const mealStart = group_by
                        ? yearSpanStart(endDate) < startDate
                            ? yearSpanStart(endDate)
                            : startDate
                        : startDate;
                    // hasMealsBefore: meals before the span make its empty
                    // early periods inner gaps (kept), not a lead-in
                    // (dropped).
                    const [
                        meals,
                        water,
                        activity,
                        goals,
                        history,
                        loggedBefore,
                    ] = await Promise.all([
                        getMealsInRange(userId, mealStart, endDate, tz),
                        getWaterInRange(userId, startDate, endDate, tz),
                        // max(days, 30) back: the text reads its own window
                        // out of it, and _meta only the last 30 days.
                        getActivityInRange(userId, startDate, endDate, tz).then(
                            (rows) => countedActivity(rows, tz),
                        ),
                        getNutritionGoals(userId),
                        group_by
                            ? getNutritionGoalsHistory(userId)
                            : Promise.resolve(null),
                        group_by
                            ? hasMealsBefore(userId, yearSpanStart(endDate), tz)
                            : Promise.resolve(false),
                    ]);
                    const allBuckets = buildDailyBuckets(
                        meals,
                        water,
                        startDate,
                        endDate,
                        tz,
                    );
                    // Text summary respects the requested window; the widget
                    // gets the last 30 days for its 7/14/30 toggle.
                    const textBuckets = allBuckets.slice(-windowDays);
                    const seriesBuckets = allBuckets.slice(-30);

                    const goalsPayload = goalsPayloadOf(goals, alcohol);

                    let text = computeTrends(
                        gateAlcohol(textBuckets, alcohol),
                        goals,
                    );
                    // Activity over the text's own window. Burned and credited
                    // are averaged over every calendar day of it; net intake is
                    // averaged over the days that have a meal only.
                    const textStart = textBuckets[0]?.date ?? startDate;
                    const textActivity = activity.filter(
                        (e) => dateInTz(e.logged_at, tz) >= textStart,
                    );
                    if (textActivity.length > 0) {
                        const creditedByDay = activityByDate(textActivity, tz);
                        text += `\n\n${activityTrendsLine({
                            totals: sumActivity(textActivity),
                            windowDays: textBuckets.length,
                            mealDays: textBuckets
                                .filter((b) => b.meals.length > 0)
                                .map((b) => ({
                                    intakeKcal: b.calories,
                                    creditedKcal:
                                        creditedByDay.get(b.date)
                                            ?.credited_kcal ?? 0,
                                })),
                        })}`;
                    }
                    // Per-period averages: only with group_by, and then in
                    // `content` and the result's `_meta`, never in
                    // structuredContent — the output schema is frozen (see
                    // PERIOD_AVERAGES_META_KEY). structuredContent stays
                    // exactly what the `days` window gives without it.
                    const periodMeta: Record<string, unknown> = {};
                    if (group_by && history) {
                        const spanStart = yearSpanStart(endDate);
                        const meta = buildPeriodAveragesMeta(
                            dayTotalsFromMeals(meals, spanStart, endDate, tz),
                            history,
                            endDate,
                            group_by,
                            tz,
                            loggedBefore ? spanStart : null,
                        );
                        text += `\n\n${formatPeriodContent(
                            meta.periods[group_by],
                            group_by,
                            targetsRecordedFrom(history, tz),
                        )}`;
                        periodMeta[PERIOD_AVERAGES_META_KEY] = meta;
                    }

                    // Added sugar per day of the 30-day series, for the
                    // widget's own 7/14/30 re-average. Meals are grouped
                    // here rather than read off the buckets, and only the
                    // series' dates are keyed (with group_by the meal read
                    // reaches years further back).
                    // Activity over the same 30-day series, for _meta. The text
                    // above reads its own shorter window out of `activity`.
                    const seriesStart = seriesBuckets[0]?.date ?? startDate;
                    const seriesActivity = activity.filter(
                        (e) => dateInTz(e.logged_at, tz) >= seriesStart,
                    );
                    const seriesMeals: Record<string, Meal[]> = {};
                    for (const b of seriesBuckets) seriesMeals[b.date] = [];
                    for (const meal of meals) {
                        seriesMeals[dateInTz(meal.logged_at, tz)]?.push(meal);
                    }

                    return {
                        content: [{ type: "text", text }],
                        _meta: {
                            ...periodMeta,
                            [ADDED_SUGAR_META_KEY]: buildAddedSugarMeta({
                                goal: goals?.daily_added_sugar_g,
                                days: seriesMeals,
                            }),
                            [SATURATED_FAT_META_KEY]: buildSaturatedFatMeta({
                                goal: goals?.daily_saturated_fat_g,
                                days: seriesMeals,
                            }),
                            [SODIUM_META_KEY]: buildSodiumMeta({
                                goal: goals?.daily_sodium_mg,
                                days: seriesMeals,
                            }),
                            // Which day is still running in the profile
                            // timezone, so the widget can tell a partial
                            // today from a past window.
                            [LOCAL_TODAY_META_KEY]: { v: 1, today },
                            // The series' days that carry activity (the same
                            // 30-day window the widget re-averages), ascending.
                            ...activityMetaEntry(
                                activityByDate(seriesActivity, tz),
                            ),
                        },
                        structuredContent: {
                            end_date: endDate,
                            default_range: [7, 14, 30].includes(windowDays)
                                ? windowDays
                                : 30,
                            drink_unit: alcohol,
                            locale,
                            goals: goalsPayload,
                            // Rounded through trendsDayPayloadOf, which nulls
                            // out fiber/sugar/alcohol on days that didn't
                            // record them so the widget's client-side average
                            // (avgOf in trends.html) can skip them instead of
                            // counting a no-data day as a real zero.
                            days: seriesBuckets.map((b) =>
                                trendsDayPayloadOf(b, alcohol),
                            ),
                        },
                    };
                },
                analytics,
                { days: days ?? 30 },
            );
        }),
    );

    server.registerTool(
        "get_meal_patterns",
        {
            title: "Get Meal Patterns",
            description:
                "Pre-aggregated behavioural patterns across the logged window: meal-type presence rates, breakfast effect (days with vs without), high-calorie-lunch effect, late-dinner effect, weekday vs weekend, and outlier days. Defaults to the last 30 days. Patterns are descriptive estimates, not medical or dietary advice.",
            annotations: {
                title: "Get Meal Patterns",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                days: z.coerce
                    .number()
                    .int()
                    .min(7)
                    .max(365)
                    .optional()
                    .describe(
                        "Window size in days (default 30, min 7, max 365).",
                    ),
                end_date: z
                    .string()
                    .optional()
                    .describe("Window end date YYYY-MM-DD (default today)."),
            }),
        },
        async ({ days, end_date }) => {
            return withAnalytics(
                "get_meal_patterns",
                async () => {
                    if (end_date !== undefined)
                        assertCalendarDate("end_date", end_date);
                    const tz = await getUserTimezone(userId);
                    const endDate = end_date ?? todayInTz(tz);
                    const windowDays = days ?? 30;
                    const startDate = shiftLocalDate(
                        endDate,
                        -(windowDays - 1),
                    );
                    const [meals, water] = await Promise.all([
                        getMealsInRange(userId, startDate, endDate, tz),
                        getWaterInRange(userId, startDate, endDate, tz),
                    ]);
                    const buckets = buildDailyBuckets(
                        meals,
                        water,
                        startDate,
                        endDate,
                        tz,
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: computeMealPatterns(buckets, tz),
                            },
                        ],
                    };
                },
                analytics,
                { days: days ?? 30 },
            );
        },
    );
}
