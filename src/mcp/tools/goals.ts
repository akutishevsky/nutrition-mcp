import { z } from "zod";
import {
    activityByDate,
    activityDayLine,
    activityRangeLine,
    countedActivity,
    sumActivity,
} from "../../activity.js";
import { addedSugarExtra, buildAddedSugarMeta } from "../../added-sugar.js";
import { withAnalytics } from "../../analytics.js";
import { dateDiffDays } from "../../insights.js";
import { type MealItemValues } from "../../meal-items.js";
import { buildMealTimesMeta } from "../../meal-times.js";
import {
    buildSaturatedFatMeta,
    saturatedFatExtra,
    transFatExtra,
} from "../../saturated-fat.js";
import { buildSodiumMeta, sodiumExtra } from "../../sodium.js";
import {
    getActivityInRange,
    getLatestWeight,
    getMealItems,
    getMealsByDate,
    getMealsInRange,
    getNutritionGoals,
    getPreferredWeightUnit,
    getProfile,
    getUserLocale,
    getUserTimezone,
    getWaterByDate,
    getWaterInRange,
    localeFromProfile,
    preferredWeightUnitFromProfile,
    timezoneFromProfile,
    upsertNutritionGoals,
    type Meal,
} from "../../supabase.js";
import { dateInTz, todayInTz } from "../../tz.js";
import { formatWeight, fromGrams, toGrams } from "../../units.js";
import {
    GOAL_PROGRESS_WIDGET_URI,
    MAX_CALORIES,
    MAX_GOAL_G,
    MAX_GOAL_MG,
    SUMMARY_RANGE_MAX_DAYS,
    SUMMARY_WIDGET_URI,
} from "../constants.js";
import type { ToolContext } from "../context.js";
import {
    alcoholHiddenNote,
    ceilingAverageLine,
    formatGoals,
    formatProgress,
    loggedDayAverageNote,
} from "../formatters.js";
import {
    assertCalendarDate,
    assertDateRange,
    assertPlausibleWeight,
    goalDayMetaEntry,
    mealItemsMetaEntry,
    resolveWriteWeightUnit,
} from "../helpers.js";
import {
    DRINK_UNIT_FIELD,
    GOALS_ITEM,
    TOTALS_ITEM,
    goalsPayloadOf,
    totalsPayloadOf,
} from "../schemas.js";
import {
    ADDED_SUGAR_META_KEY,
    MEAL_BREAKDOWN_ITEM,
    MEAL_BREAKDOWN_TOP_N,
    MEAL_CONTRIBUTORS_META_KEY,
    MEAL_TIMES_META_KEY,
    SATURATED_FAT_META_KEY,
    SODIUM_META_KEY,
    activityMetaEntry,
    emptyMealContributors,
    emptyTotals,
    goalsForDate,
    mealBreakdown,
    nutrientPresence,
    pastDayGoalHistory,
    rangeAverages,
    sumMeals,
    sumWater,
    topMealBreakdown,
    type DailyTotals,
} from "../totals.js";

export function registerGoalsTools(ctx: ToolContext): void {
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
        "get_nutrition_summary",
        {
            title: "Get Nutrition Summary",
            description: `Get daily nutrition totals for a date range. Renders an interactive dashboard (macro tiles vs. goals and a per-day breakdown) in clients that support MCP Apps UI, and returns the same data as text elsewhere. The range can span at most ${SUMMARY_RANGE_MAX_DAYS} days; get_trends covers longer periods. Figures are estimates, not medical or dietary advice.`,
            annotations: {
                title: "Get Nutrition Summary",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                start_date: z.string().describe("Start date (YYYY-MM-DD)"),
                end_date: z
                    .string()
                    .describe(
                        `End date (YYYY-MM-DD). The range spans at most ${SUMMARY_RANGE_MAX_DAYS} days, both ends included.`,
                    ),
            }),
            outputSchema: z.object({
                start_date: z.string(),
                end_date: z.string(),
                logged_days: z.number(),
                // The calendar length of the window, so a consumer can see the
                // denominator behind `averages` for itself: these are per
                // LOGGED day, while get_trends divides the same nutrients by
                // all `days_in_range` days (issue #70). Without both numbers a
                // client cannot tell a full month from a fortnight of gaps.
                days_in_range: z.number(),
                drink_unit: DRINK_UNIT_FIELD,
                // The widget's UI language (get_language / set_language),
                // resolved server-side so the dashboard renders its own
                // labels in it without a second round trip. Not the language
                // of `content` above — that stays whatever the model uses.
                // z.string(), not z.enum(SITE_LOCALES): SITE_LOCALES is a
                // `readonly SiteLocale[]`, not a literal tuple, and this is
                // an output-only field — getUserLocale's own fallback is
                // what actually guarantees a known code.
                locale: z.string(),
                goals: GOALS_ITEM.nullable(),
                averages: TOTALS_ITEM,
                // How many of `logged_days` actually record each of the
                // post-launch nutrients — the denominator behind `averages` for
                // them, so a consumer can say "5 of 30 days" instead of passing
                // a partial average off as a full one. 0 means the window has no
                // data for it at all and its average is not a figure. Alcohol is
                // null when tracking is off, like every other alcohol field;
                // caffeine has no such flag, so its count is always a number
                // (0 being how a consumer sees "never recorded").
                recorded_days: z.object({
                    fiber_g: z.number(),
                    sugar_g: z.number(),
                    alcohol_g: z.number().nullable(),
                    caffeine_mg: z.number(),
                }),
                days: z.array(
                    TOTALS_ITEM.extend({
                        date: z.string(),
                        meal_count: z.number(),
                    }),
                ),
                // The top MEAL_BREAKDOWN_TOP_N meals per metric (their union,
                // in logged order), not every meal in the window — see
                // topMealBreakdown. The true per-metric counts travel in the
                // result's _meta under MEAL_CONTRIBUTORS_META_KEY, NOT here:
                // this schema is frozen (pinned by src/output-schemas.frozen.json,
                // checked by the "output schemas are frozen once deployed"
                // tests in src/mcp.test.ts), because hosts validate
                // structuredContent against a cached copy of it and every Zod
                // object is additionalProperties:false.
                meals: z.array(MEAL_BREAKDOWN_ITEM),
            }),
            // Link the tool to its dashboard UI (MCP Apps).
            ...uiMeta(SUMMARY_WIDGET_URI),
        },
        withWidgetPrefs(async ({ start_date, end_date }) => {
            return withAnalytics(
                "get_nutrition_summary",
                async () => {
                    assertDateRange(
                        start_date,
                        end_date,
                        SUMMARY_RANGE_MAX_DAYS,
                        "For a longer period use get_trends (rolling averages and streaks over up to 365 days), or split the range into quarterly calls.",
                    );
                    // Sized with insights.ts's own arithmetic (the function
                    // buildDailyBuckets lays its buckets out with), so the two
                    // tools cannot disagree about how long a window is.
                    // assertDateRange above guarantees start <= end.
                    const daysInRange = dateDiffDays(start_date, end_date) + 1;
                    const tz = await getUserTimezone(userId);
                    const locale = await getUserLocale(userId);
                    const [meals, water, activity, currentGoals, goalHistory] =
                        await Promise.all([
                            getMealsInRange(userId, start_date, end_date, tz),
                            getWaterInRange(userId, start_date, end_date, tz),
                            getActivityInRange(
                                userId,
                                start_date,
                                end_date,
                                tz,
                            ).then((rows) => countedActivity(rows, tz)),
                            getNutritionGoals(userId),
                            pastDayGoalHistory(
                                userId,
                                start_date === end_date ? start_date : null,
                                tz,
                            ),
                        ]);
                    // A single past day is judged against the goal in effect on
                    // that day; a range keeps the current goal, as it always has.
                    const goals = goalsForDate(
                        userId,
                        start_date,
                        tz,
                        currentGoals,
                        goalHistory,
                    );
                    const activityByDay = activityByDate(activity, tz);

                    const goalsPayload = goalsPayloadOf(goals, alcohol);

                    // Activity alone never makes a day logged: logged_days and
                    // the averages count meal or water days only, as before
                    // active calories existed. Activity-only days get a text
                    // section (and the range activity line), not a day entry.
                    const activityOnlySection = (date: string): string => {
                        const dayActivity = activityByDay.get(date);
                        return `## ${date} (0 meals)${
                            dayActivity
                                ? `\n${activityDayLine({
                                      totals: dayActivity,
                                      intakeKcal: null,
                                      goalKcal: goals?.daily_calories ?? null,
                                  })}`
                                : ""
                        }`;
                    };
                    // Across a range, the window's activity totals and the daily
                    // average; a single day already has its own line above.
                    const activityNote =
                        activity.length > 0 && start_date !== end_date
                            ? `\n\n${activityRangeLine({
                                  totals: sumActivity(activity),
                                  activeDays: activityByDay.size,
                                  daysInRange,
                              })}`
                            : "";

                    if (meals.length === 0 && water.length === 0) {
                        const activityDates = [...activityByDay.keys()].sort();
                        const emptyText = `No meals or water logged between ${start_date} and ${end_date}.`;
                        return {
                            content: [
                                {
                                    type: "text",
                                    text:
                                        activityDates.length > 0
                                            ? `${emptyText}\n\n${activityDates.map(activityOnlySection).join("\n\n")}${activityNote}`
                                            : emptyText,
                                },
                            ],
                            structuredContent: {
                                start_date,
                                end_date,
                                logged_days: 0,
                                days_in_range: daysInRange,
                                drink_unit: alcohol,
                                locale,
                                goals: goalsPayload,
                                averages: totalsPayloadOf(
                                    emptyTotals(),
                                    alcohol,
                                    // Nothing logged, so nothing recorded
                                    // caffeine: null, not a 0 mg average.
                                    false,
                                ),
                                recorded_days: {
                                    fiber_g: 0,
                                    sugar_g: 0,
                                    alcohol_g: alcohol ? 0 : null,
                                    caffeine_mg: 0,
                                },
                                days: [],
                                meals: [],
                            },
                            _meta: {
                                [MEAL_CONTRIBUTORS_META_KEY]:
                                    emptyMealContributors(alcohol),
                                [ADDED_SUGAR_META_KEY]: buildAddedSugarMeta({
                                    goal: goals?.daily_added_sugar_g,
                                    days: {},
                                    meals: [],
                                    contributorsOf: [],
                                }),
                                [SATURATED_FAT_META_KEY]: buildSaturatedFatMeta(
                                    {
                                        goal: goals?.daily_saturated_fat_g,
                                        days: {},
                                        meals: [],
                                    },
                                ),
                                [SODIUM_META_KEY]: buildSodiumMeta({
                                    goal: goals?.daily_sodium_mg,
                                    days: {},
                                    meals: [],
                                }),
                                [MEAL_TIMES_META_KEY]: buildMealTimesMeta(
                                    [],
                                    tz,
                                ),
                                // No activity can reach this path, so this is
                                // empty; it keeps every return path alike.
                                ...activityMetaEntry(activityByDay),
                            },
                        };
                    }

                    // Group by date (local to user timezone)
                    const byDate = new Map<string, Meal[]>();
                    for (const meal of meals) {
                        const date = dateInTz(meal.logged_at, tz);
                        const existing = byDate.get(date) ?? [];
                        existing.push(meal);
                        byDate.set(date, existing);
                    }
                    const waterByDate = new Map<string, number>();
                    for (const entry of water) {
                        const date = dateInTz(entry.logged_at, tz);
                        waterByDate.set(
                            date,
                            (waterByDate.get(date) ?? 0) + entry.amount_ml,
                        );
                        if (!byDate.has(date)) byDate.set(date, []);
                    }
                    const sections: string[] = [];
                    const days: Array<
                        ReturnType<typeof totalsPayloadOf> & {
                            date: string;
                            meal_count: number;
                        }
                    > = [];
                    const perDay: Array<{
                        meals: Meal[];
                        totals: DailyTotals;
                    }> = [];
                    // Every logged day, plus the activity-only days, which
                    // get a text section but no entry in days or logged_days.
                    const sectionDates = [
                        ...new Set([...byDate.keys(), ...activityByDay.keys()]),
                    ].sort();
                    for (const date of sectionDates) {
                        const dateMeals = byDate.get(date);
                        if (!dateMeals) {
                            sections.push(activityOnlySection(date));
                            continue;
                        }
                        const totals = sumMeals(dateMeals);
                        totals.water_ml = waterByDate.get(date) ?? 0;
                        // Which nutrients this day actually recorded, so a
                        // pre-feature day neither prints "Fiber: 0g" nor drags
                        // the range average down towards zero.
                        const present = nutrientPresence(dateMeals);
                        const header = `## ${date} (${dateMeals.length} meal${dateMeals.length === 1 ? "" : "s"})`;
                        const dayActivity = activityByDay.get(date);
                        const activityText = dayActivity
                            ? `\n${activityDayLine({
                                  totals: dayActivity,
                                  intakeKcal:
                                      dateMeals.length > 0
                                          ? totals.calories
                                          : null,
                                  goalKcal: goals?.daily_calories ?? null,
                              })}`
                            : "";
                        sections.push(
                            `${header}\n${formatProgress(totals, goals, alcohol, present)}${activityText}`,
                        );
                        days.push({
                            date,
                            meal_count: dateMeals.length,
                            ...totalsPayloadOf(
                                totals,
                                alcohol,
                                present.caffeine_mg,
                            ),
                        });
                        perDay.push({ meals: dateMeals, totals });
                    }

                    // Per-day means, rounded by totalsPayloadOf like every other
                    // payload (water stays whole millilitres there). See
                    // rangeAverages for which denominator each nutrient uses.
                    const { averages: rawAverages, recordedDays } =
                        rangeAverages(perDay);
                    const averages = totalsPayloadOf(
                        rawAverages,
                        alcohol,
                        // A window where no day recorded caffeine has no
                        // caffeine average to report — coveredDailyAverage
                        // returns 0 over 0 days, which is not a figure.
                        recordedDays.caffeine_mg > 0,
                    );

                    // Don't pass a partial average off as a full one. Terse:
                    // only nutrients that were recorded on SOME but not all of
                    // the logged days get a mention (none at all is already
                    // silent, since those lines are suppressed per day).
                    const partial = [
                        recordedDays.fiber_g > 0 &&
                        recordedDays.fiber_g < days.length
                            ? `fiber ${recordedDays.fiber_g}`
                            : null,
                        recordedDays.sugar_g > 0 &&
                        recordedDays.sugar_g < days.length
                            ? `sugar ${recordedDays.sugar_g}`
                            : null,
                        recordedDays.added_sugar_g > 0 &&
                        recordedDays.added_sugar_g < days.length
                            ? `added sugar ${recordedDays.added_sugar_g}`
                            : null,
                        recordedDays.saturated_fat_g > 0 &&
                        recordedDays.saturated_fat_g < days.length
                            ? `saturated fat ${recordedDays.saturated_fat_g}`
                            : null,
                        alcohol &&
                        recordedDays.alcohol_g > 0 &&
                        recordedDays.alcohol_g < days.length
                            ? `alcohol ${recordedDays.alcohol_g}`
                            : null,
                        // Unconditional: no opt-in to check, only the data.
                        recordedDays.caffeine_mg > 0 &&
                        recordedDays.caffeine_mg < days.length
                            ? `caffeine ${recordedDays.caffeine_mg}`
                            : null,
                        recordedDays.sodium_mg > 0 &&
                        recordedDays.sodium_mg < days.length
                            ? `sodium ${recordedDays.sodium_mg}`
                            : null,
                    ].filter((s): s is string => s !== null);
                    const coverageNote = partial.length
                        ? `\n\n(Averaged over the days that record each figure, not all ${days.length}: ${partial.join(", ")}.)`
                        : "";
                    // Added sugar does not rank rows of its own: that would
                    // change structuredContent.meals for every host, _meta or
                    // not. Its list draws from the kept rows that carry a
                    // value plus _meta's `extra` — its own top N that the
                    // kept rows miss (addedSugarExtra) — and its exact
                    // "N more" comes from _meta's contributors.
                    const rows = mealBreakdown(meals, tz, alcohol);
                    const breakdown = topMealBreakdown(rows, alcohol);
                    const keptMeals = breakdown.kept.map((i) => meals[i]!);
                    // Items only for the kept rows (at most 64), never the
                    // whole window; the added-sugar `extra` rows get none.
                    const itemsEntry = await mealItemsMetaEntry(
                        userId,
                        keptMeals,
                        alcohol,
                    );

                    const footer =
                        ceilingAverageLine(
                            "Added sugar",
                            rawAverages.added_sugar_g,
                            recordedDays.added_sugar_g,
                            days.length,
                            goals?.daily_added_sugar_g ?? null,
                        ) +
                        ceilingAverageLine(
                            "Saturated fat",
                            rawAverages.saturated_fat_g,
                            recordedDays.saturated_fat_g,
                            days.length,
                            goals?.daily_saturated_fat_g ?? null,
                        ) +
                        // Whole milligrams, like every mg figure in the text.
                        ceilingAverageLine(
                            "Sodium",
                            Math.round(rawAverages.sodium_mg),
                            recordedDays.sodium_mg,
                            days.length,
                            goals?.daily_sodium_mg ?? null,
                            " mg",
                        ) +
                        coverageNote +
                        loggedDayAverageNote(days.length, daysInRange) +
                        (goals
                            ? ""
                            : "\n\n(Tip: set daily targets with set_nutrition_goals to see progress percentages.)");

                    return {
                        content: [
                            {
                                type: "text",
                                text:
                                    sections.join("\n\n") +
                                    activityNote +
                                    footer,
                            },
                        ],
                        structuredContent: {
                            start_date,
                            end_date,
                            logged_days: days.length,
                            days_in_range: daysInRange,
                            drink_unit: alcohol,
                            locale,
                            goals: goalsPayload,
                            averages,
                            recorded_days: {
                                fiber_g: recordedDays.fiber_g,
                                sugar_g: recordedDays.sugar_g,
                                alcohol_g: alcohol
                                    ? recordedDays.alcohol_g
                                    : null,
                                caffeine_mg: recordedDays.caffeine_mg,
                            },
                            days,
                            // Multi-day range → tag each meal with its date.
                            meals: breakdown.meals,
                        },
                        _meta: {
                            [MEAL_CONTRIBUTORS_META_KEY]:
                                breakdown.contributors,
                            // Same object, beside the contributors: `meals`
                            // follows the kept rows' order exactly (the
                            // widget joins by position), and `contributors`
                            // counts over every meal in the range.
                            [ADDED_SUGAR_META_KEY]: buildAddedSugarMeta({
                                goal: goals?.daily_added_sugar_g,
                                days: Object.fromEntries(byDate),
                                meals: keptMeals,
                                contributorsOf: meals,
                                extra: addedSugarExtra(
                                    meals,
                                    rows,
                                    breakdown.kept,
                                    MEAL_BREAKDOWN_TOP_N,
                                ),
                            }),
                            // Same arrangement as added sugar: `extra` is
                            // the top meals the kept rows miss, and the
                            // contributors count over the whole window.
                            [SATURATED_FAT_META_KEY]: buildSaturatedFatMeta({
                                goal: goals?.daily_saturated_fat_g,
                                days: Object.fromEntries(byDate),
                                meals: keptMeals,
                                contributorsOf: meals,
                                extra: saturatedFatExtra(
                                    meals,
                                    rows,
                                    breakdown.kept,
                                    MEAL_BREAKDOWN_TOP_N,
                                ),
                                transExtra: transFatExtra(
                                    meals,
                                    rows,
                                    breakdown.kept,
                                    MEAL_BREAKDOWN_TOP_N,
                                ),
                            }),
                            // Same arrangement as saturated fat.
                            [SODIUM_META_KEY]: buildSodiumMeta({
                                goal: goals?.daily_sodium_mg,
                                days: Object.fromEntries(byDate),
                                meals: keptMeals,
                                contributorsOf: meals,
                                extra: sodiumExtra(
                                    meals,
                                    rows,
                                    breakdown.kept,
                                    MEAL_BREAKDOWN_TOP_N,
                                ),
                            }),
                            // The kept rows' local times, in row order.
                            [MEAL_TIMES_META_KEY]: buildMealTimesMeta(
                                keptMeals,
                                tz,
                            ),
                            ...itemsEntry,
                            // Only the days that carry activity; omitted when none.
                            ...activityMetaEntry(activityByDay),
                        },
                    };
                },
                analytics,
                { start_date, end_date },
            );
        }),
    );

    // One period at a glance: get_digest and its widget (digest.html). The
    // computation is src/digest.ts (pure, unit-tested); this adapter reads one
    server.registerTool(
        "set_nutrition_goals",
        {
            title: "Set Nutrition Goals",
            description:
                "Set the user's daily calorie and macro targets, and optionally a target body weight. Pass only the fields you want to update — omitted fields keep their previous value. Pass null explicitly to clear a target. Calories, protein, carbs, fat, fiber and water are targets to REACH; total sugar, added sugar, alcohol and caffeine are limits to STAY UNDER, and progress against them is worded accordingly. Every gram target is in grams and the caffeine limit is in MILLIGRAMS. For a limit, 0 is a real value meaning 'none at all' rather than 'unset'. Targets are the user's own choice; this server does not provide medical or dietary advice.",
            annotations: {
                title: "Set Nutrition Goals",
                readOnlyHint: false,
                // Overwrites a stored record with no undo — "false" would mean
                // "only additive updates", which this is not.
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                // Bounded in the schema for the same reason as log_meal, with
                // the gram ceiling set by the numeric(6,2) goal columns rather
                // than by what a plausible meal carries.
                daily_calories: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_CALORIES)
                    .nullable()
                    .optional()
                    .describe("Daily calorie target (kcal). Null to clear."),
                daily_protein_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_GOAL_G)
                    .nullable()
                    .optional()
                    .describe("Daily protein target (grams). Null to clear."),
                daily_carbs_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_GOAL_G)
                    .nullable()
                    .optional()
                    .describe("Daily carbs target (grams). Null to clear."),
                daily_fat_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_GOAL_G)
                    .nullable()
                    .optional()
                    .describe("Daily fat target (grams). Null to clear."),
                daily_saturated_fat_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_GOAL_G)
                    .nullable()
                    .optional()
                    .describe(
                        "Daily saturated fat limit (grams), a maximum to stay under. Saturated fat is part of total fat, so it is limited separately from it. Null to clear.",
                    ),
                daily_fiber_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_GOAL_G)
                    .nullable()
                    .optional()
                    .describe(
                        "Daily fiber target (grams), treated as a minimum to reach. Null to clear.",
                    ),
                daily_sugar_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_GOAL_G)
                    .nullable()
                    .optional()
                    .describe(
                        "Daily TOTAL sugar limit (grams), treated as a maximum to stay under. Total sugars include sugar naturally present in fruit and milk as well as added sugar, so a total-sugar limit is reached sooner than the same number would be as an added-sugar limit; public guidance figures usually refer to added sugar, which daily_added_sugar_g limits. Null to clear.",
                    ),
                daily_added_sugar_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_GOAL_G)
                    .nullable()
                    .optional()
                    .describe(
                        "Daily added-sugar limit (grams), a maximum to stay under. Counts only added sugars, not sugar naturally present in fruit and milk; public guidance figures for sugar usually refer to this measure. 0 means none. Null to clear.",
                    ),
                daily_alcohol_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_GOAL_G)
                    .nullable()
                    .optional()
                    .describe(
                        "Daily alcohol limit in grams of pure ethanol, treated as a maximum to stay under. One US standard drink is 14 g, one UK unit is 7.9 g. Null to clear.",
                    ),
                daily_caffeine_mg: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_GOAL_MG)
                    .nullable()
                    .optional()
                    .describe(
                        "Daily caffeine limit in MILLIGRAMS, treated as a maximum to stay under. Reference points to offer when the user has no figure in mind: the EFSA and FDA ceiling for healthy adults is 400 mg/day and 200 mg in pregnancy, and a 240 ml brewed coffee is about 95 mg — so 400 mg is roughly four cups. 0 is a real limit meaning none at all, not 'unset'. Null to clear.",
                    ),
                daily_sodium_mg: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_GOAL_MG)
                    .nullable()
                    .optional()
                    .describe(
                        "Daily sodium limit in MILLIGRAMS (sodium, not salt), a maximum to stay under. For reference, the WHO figure for adults is under 2000 mg/day and the US Dietary Guidelines figure is under 2300 mg/day. 0 is a real limit, not 'unset'. Null to clear.",
                    ),
                daily_water_ml: z.coerce
                    .number()
                    .nullable()
                    .optional()
                    .describe(
                        "Daily water target (milliliters). Null to clear.",
                    ),
                target_weight: z.coerce
                    .number()
                    .positive()
                    .nullable()
                    .optional()
                    .describe(
                        "Target body weight in `unit` (defaults to the user's preferred weight unit). Null to clear.",
                    ),
                unit: z
                    .enum(["kg", "lb"])
                    .optional()
                    .describe(
                        "Unit for target_weight. Defaults to the user's preferred weight unit.",
                    ),
            }),
        },
        async (args) => {
            return withAnalytics(
                "set_nutrition_goals",
                async () => {
                    const [existing, preferredUnit] = await Promise.all([
                        getNutritionGoals(userId),
                        getPreferredWeightUnit(userId),
                    ]);
                    // Only demand a unit when actually writing a numeric target.
                    let target_weight_g: number | null;
                    if (args.target_weight === undefined) {
                        target_weight_g = existing?.target_weight_g ?? null;
                    } else if (args.target_weight === null) {
                        target_weight_g = null;
                    } else {
                        const writeUnit = await resolveWriteWeightUnit(
                            userId,
                            args.unit,
                        );
                        target_weight_g = toGrams(
                            args.target_weight,
                            writeUnit,
                        );
                        assertPlausibleWeight(target_weight_g, writeUnit);
                    }
                    const displayUnit = args.unit ?? preferredUnit ?? "kg";
                    const merged = {
                        daily_calories:
                            args.daily_calories === undefined
                                ? (existing?.daily_calories ?? null)
                                : args.daily_calories,
                        daily_protein_g:
                            args.daily_protein_g === undefined
                                ? (existing?.daily_protein_g ?? null)
                                : args.daily_protein_g,
                        daily_carbs_g:
                            args.daily_carbs_g === undefined
                                ? (existing?.daily_carbs_g ?? null)
                                : args.daily_carbs_g,
                        daily_fat_g:
                            args.daily_fat_g === undefined
                                ? (existing?.daily_fat_g ?? null)
                                : args.daily_fat_g,
                        daily_saturated_fat_g:
                            args.daily_saturated_fat_g === undefined
                                ? (existing?.daily_saturated_fat_g ?? null)
                                : args.daily_saturated_fat_g,
                        daily_fiber_g:
                            args.daily_fiber_g === undefined
                                ? (existing?.daily_fiber_g ?? null)
                                : args.daily_fiber_g,
                        daily_sugar_g:
                            args.daily_sugar_g === undefined
                                ? (existing?.daily_sugar_g ?? null)
                                : args.daily_sugar_g,
                        daily_added_sugar_g:
                            args.daily_added_sugar_g === undefined
                                ? (existing?.daily_added_sugar_g ?? null)
                                : args.daily_added_sugar_g,
                        daily_alcohol_g:
                            args.daily_alcohol_g === undefined
                                ? (existing?.daily_alcohol_g ?? null)
                                : args.daily_alcohol_g,
                        daily_caffeine_mg:
                            args.daily_caffeine_mg === undefined
                                ? (existing?.daily_caffeine_mg ?? null)
                                : args.daily_caffeine_mg,
                        daily_sodium_mg:
                            args.daily_sodium_mg === undefined
                                ? (existing?.daily_sodium_mg ?? null)
                                : args.daily_sodium_mg,
                        daily_water_ml:
                            args.daily_water_ml === undefined
                                ? (existing?.daily_water_ml ?? null)
                                : args.daily_water_ml,
                        target_weight_g,
                    };
                    const goals = await upsertNutritionGoals(userId, merged);
                    // An alcohol target set by someone who has alcohol tracking
                    // off is saved but invisible everywhere else, so say so here
                    // rather than let the goal silently vanish from the list.
                    const alcoholNote = alcoholHiddenNote(
                        args.daily_alcohol_g != null,
                        alcohol,
                        "Alcohol target saved",
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Goals updated.\n\n${formatGoals(goals, displayUnit, alcohol)}${alcoholNote}`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "get_nutrition_goals",
        {
            title: "Get Nutrition Goals",
            description:
                "Get the user's current daily calorie and macro targets.",
            annotations: {
                title: "Get Nutrition Goals",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async () => {
            return withAnalytics(
                "get_nutrition_goals",
                async () => {
                    const [goals, unit] = await Promise.all([
                        getNutritionGoals(userId),
                        getPreferredWeightUnit(userId),
                    ]);
                    return {
                        content: [
                            {
                                type: "text",
                                text: formatGoals(goals, unit ?? "kg", alcohol),
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "get_goal_progress",
        {
            title: "Get Goal Progress",
            description:
                "Get progress against daily nutrition goals for a specific date (defaults to today). Renders a goal-status view (which goals are over, near the limit, still to go or on track, with per-meal sources and the latest weight) in clients that support MCP Apps UI, and returns the same data as text elsewhere. Figures are estimates, not medical or dietary advice.",
            annotations: {
                title: "Get Goal Progress",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                date: z
                    .string()
                    .optional()
                    .describe("Date in YYYY-MM-DD format. Defaults to today."),
            }),
            outputSchema: z.object({
                date: z.string(),
                meal_count: z.number(),
                water_entries: z.number(),
                drink_unit: DRINK_UNIT_FIELD,
                // The widget's UI language — see the identical field on
                // get_nutrition_summary's outputSchema for why this is
                // z.string() and resolved server-side via getUserLocale.
                locale: z.string(),
                goals: GOALS_ITEM.nullable(),
                totals: TOTALS_ITEM,
                weight: z
                    .object({
                        current: z.number().nullable(),
                        target: z.number().nullable(),
                        unit: z.string(),
                        logged_on: z.string().nullable(),
                    })
                    .nullable(),
                meals: z.array(MEAL_BREAKDOWN_ITEM),
            }),
            // Link the tool to its progress UI (MCP Apps).
            ...uiMeta(GOAL_PROGRESS_WIDGET_URI),
        },
        withWidgetPrefs(async ({ date }) => {
            return withAnalytics(
                "get_goal_progress",
                async () => {
                    if (date !== undefined) assertCalendarDate("date", date);
                    const profile = await getProfile(userId);
                    const tz = timezoneFromProfile(profile) ?? "UTC";
                    const targetDate = date ?? todayInTz(tz);
                    const [
                        meals,
                        water,
                        activity,
                        currentGoals,
                        latestWeight,
                        goalHistory,
                    ] = await Promise.all([
                        getMealsByDate(userId, targetDate, tz),
                        getWaterByDate(userId, targetDate, tz),
                        getActivityInRange(
                            userId,
                            targetDate,
                            targetDate,
                            tz,
                        ).then((rows) => countedActivity(rows, tz)),
                        getNutritionGoals(userId),
                        getLatestWeight(userId),
                        pastDayGoalHistory(userId, targetDate, tz),
                    ]);
                    // The goal in effect on targetDate (today: the current row).
                    const goals = goalsForDate(
                        userId,
                        targetDate,
                        tz,
                        currentGoals,
                        goalHistory,
                    );
                    const unit =
                        preferredWeightUnitFromProfile(profile) ?? "kg";
                    const locale = localeFromProfile(profile) ?? "en";
                    const totals = sumMeals(meals);
                    totals.water_ml = sumWater(water);
                    const present = nutrientPresence(meals);
                    const header = `Progress for ${targetDate} (${meals.length} meal${meals.length === 1 ? "" : "s"}, ${water.length} water entr${water.length === 1 ? "y" : "ies"})`;
                    const body = formatProgress(
                        totals,
                        goals,
                        alcohol,
                        present,
                    );
                    // One line for the day's activity, beside intake and the
                    // goal; absent when the day has none.
                    const activityText =
                        activity.length > 0
                            ? `\n${activityDayLine({
                                  totals: sumActivity(activity),
                                  intakeKcal:
                                      meals.length > 0 ? totals.calories : null,
                                  goalKcal: goals?.daily_calories ?? null,
                              })}`
                            : "";

                    // Weight is a standing metric (latest overall), not per-date.
                    let weightLine = "";
                    if (latestWeight) {
                        const loggedOn = dateInTz(latestWeight.logged_at, tz);
                        if (goals?.target_weight_g != null) {
                            const delta =
                                latestWeight.weight_g - goals.target_weight_g;
                            const remaining = fromGrams(Math.abs(delta), unit);
                            const goalStr =
                                remaining === 0
                                    ? "at target"
                                    : `${remaining} ${unit} ${delta > 0 ? "to lose" : "to gain"}`;
                            weightLine = `\nWeight: ${formatWeight(latestWeight.weight_g, unit)} / ${formatWeight(goals.target_weight_g, unit)} target (${goalStr}, last logged ${loggedOn})`;
                        } else {
                            weightLine = `\nWeight: ${formatWeight(latestWeight.weight_g, unit)} (last logged ${loggedOn})`;
                        }
                    } else if (goals?.target_weight_g != null) {
                        weightLine = `\nWeight: no entries yet (target ${formatWeight(goals.target_weight_g, unit)}). The user can log one with log_weight.`;
                    }

                    const footer = goals
                        ? ""
                        : "\n\n(Tip: set daily targets with set_nutrition_goals to see progress percentages.)";

                    // Payload for the goal-progress widget (MCP Apps). Mirrors
                    // the text above: per-macro intake vs goal for the day, plus
                    // the standing weight metric converted to display units.
                    const goalsPayload = goalsPayloadOf(goals, alcohol);
                    const totalsPayload = totalsPayloadOf(
                        totals,
                        alcohol,
                        present.caffeine_mg,
                    );
                    const weightPayload =
                        latestWeight || goals?.target_weight_g != null
                            ? {
                                  current: latestWeight
                                      ? fromGrams(latestWeight.weight_g, unit)
                                      : null,
                                  target:
                                      goals?.target_weight_g != null
                                          ? fromGrams(
                                                goals.target_weight_g,
                                                unit,
                                            )
                                          : null,
                                  unit,
                                  logged_on: latestWeight
                                      ? dateInTz(latestWeight.logged_at, tz)
                                      : null,
                              }
                            : null;

                    // Independent reads, so in parallel. Today's items are
                    // read once and shared: both entries await this promise
                    // (so a rejection is always handled), and each drops only
                    // its own part when it fails.
                    const todayItems: Promise<Map<string, MealItemValues[]>> =
                        meals.length
                            ? getMealItems(
                                  userId,
                                  meals.map((m) => m.id),
                              )
                            : Promise.resolve(new Map());
                    const [itemsEntry, dayEntry] = await Promise.all([
                        mealItemsMetaEntry(userId, meals, alcohol, todayItems),
                        goalDayMetaEntry(
                            userId,
                            targetDate,
                            tz,
                            meals,
                            water,
                            targetDate === todayInTz(tz),
                            todayItems,
                        ),
                    ]);

                    return {
                        content: [
                            {
                                type: "text",
                                text: `${header}\n${body}${activityText}${weightLine}${footer}`,
                            },
                        ],
                        structuredContent: {
                            date: targetDate,
                            drink_unit: alcohol,
                            locale,
                            meal_count: meals.length,
                            water_entries: water.length,
                            goals: goalsPayload,
                            totals: totalsPayload,
                            weight: weightPayload,
                            // Single day → label rows by meal type in the widget.
                            meals: mealBreakdown(meals, null, alcohol),
                        },
                        // Rows and meta.meals share one list and one order;
                        // the widget joins them by position.
                        _meta: {
                            [ADDED_SUGAR_META_KEY]: buildAddedSugarMeta({
                                goal: goals?.daily_added_sugar_g,
                                days: { [targetDate]: meals },
                                meals,
                            }),
                            [SATURATED_FAT_META_KEY]: buildSaturatedFatMeta({
                                goal: goals?.daily_saturated_fat_g,
                                days: { [targetDate]: meals },
                                meals,
                            }),
                            [SODIUM_META_KEY]: buildSodiumMeta({
                                goal: goals?.daily_sodium_mg,
                                days: { [targetDate]: meals },
                                meals,
                            }),
                            ...itemsEntry,
                            ...dayEntry,
                        },
                    };
                },
                analytics,
                { date: date ?? "today" },
            );
        }),
    );
}
