import { z } from "zod";
import {
    ACTIVE_KCAL_MAX,
    ACTIVE_KCAL_MIN,
    activeKcalError,
    countedActivity,
    creditPctError,
    creditedKcal,
    isHealthDayTotal,
    sumActivity,
} from "../../activity.js";
import { withAnalytics } from "../../analytics.js";
import { ToolError } from "../../errors.js";
import { computeWeightTrend } from "../../insights.js";
import { MEAL_LISTING_MAX_CHARS } from "../../meal-listing.js";
import {
    activityCreditPctFromProfile,
    deleteActiveCalories,
    deleteBodyMeasurement,
    deleteWater,
    deleteWeight,
    getActivityInRange,
    getAllWeight,
    getBodyMeasurement,
    getBodyMeasurementsInRange,
    getNutritionGoals,
    getPreferredWeightUnit,
    getProfile,
    getUserTimezone,
    getWaterByDate,
    getWeightByDate,
    getWeightInRange,
    insertActiveCalories,
    insertBodyMeasurement,
    insertWater,
    insertWeight,
    isUuid,
    localeFromProfile,
    preferredLengthUnitFromProfile,
    preferredWeightUnitFromProfile,
    timezoneFromProfile,
    updateBodyMeasurement,
    updateWeight,
    upsertProfile,
    type ActiveCaloriesEntry,
    type BodyMeasurementEntry,
    type WeightEntry,
} from "../../supabase.js";
import { dateInTz, shiftLocalDate, todayInTz } from "../../tz.js";
import {
    BODY_MEASUREMENT_KINDS,
    assertPlausibleLength,
    formatWeight,
    fromGrams,
    isLengthUnit,
    isWeightUnit,
    measurementLabel,
    toGrams,
    type BodyMeasurementKind,
    type LengthUnit,
    type WeightUnit,
} from "../../units.js";
import { analyzeWeightHistory, defaultRangeFor } from "../../weight-trend.js";
import {
    WIDGET_HISTORY_DAYS,
    buildBodyMeasurementsMeta,
    buildWeightEntriesMeta,
} from "../../weight-widget.js";
import {
    BODY_MEASUREMENTS_META_KEY,
    WEIGHT_ENTRIES_META_KEY,
} from "../../widgets.js";
import {
    ACTIVE_ID_SOURCES,
    BODY_MEASUREMENT_DEFAULT_DAYS,
    BODY_MEASUREMENT_RANGE_MAX_DAYS,
    MEALS_RANGE_MAX_DAYS,
    MEASUREMENT_ID_SOURCES,
    WATER_ID_SOURCES,
    WEIGHT_ID_SOURCES,
    WEIGHT_RANGE_MAX_DAYS,
    WEIGHT_TRENDS_WIDGET_URI,
} from "../constants.js";
import type { ToolContext } from "../context.js";
import {
    formatMeasurementEntry,
    formatMeasurementValue,
    formatWeightEntry,
    localTimeOf,
    notUuidText,
    timesAreLocal,
} from "../formatters.js";
import {
    assertCalendarDate,
    assertDateRange,
    assertPlausibleWeight,
    resolveWriteLengthUnit,
    resolveWriteTimestamp,
    resolveWriteWeightUnit,
} from "../helpers.js";
import {
    LOGGED_AT_FORMS,
    LOGGED_AT_FORMS_PLAIN,
    LOGGED_AT_OMITTED_PLAIN,
    LOGGED_AT_OMIT_IF_NOW,
    idempotencyKeyDescription,
    idempotencyKeyDescriptionPlain,
} from "../schemas.js";
import { WEIGHT_SERIES_META_KEY, dayCountOf, sumWater } from "../totals.js";

export function registerMetricsTools(ctx: ToolContext): void {
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
        "log_water",
        {
            title: "Log Water",
            description:
                "Log a hydration entry in milliliters. If the user gives a volume in another unit (cups, oz, liters), convert it: 1 cup = 240 ml, 1 fl oz = 30 ml, 1 L = 1000 ml. If only 'a glass' is mentioned, ask for the size or assume 250 ml and confirm.",
            annotations: {
                title: "Log Water",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: z.object({
                amount_ml: z.coerce
                    .number()
                    .int()
                    .positive()
                    .describe("Amount in milliliters (integer, > 0)."),
                logged_at: z
                    .string()
                    .optional()
                    .describe(
                        "When this actually happened (defaults to now). " +
                            LOGGED_AT_FORMS +
                            LOGGED_AT_OMIT_IF_NOW,
                    ),
                notes: z
                    .string()
                    .optional()
                    .describe("Optional notes (e.g. 'tea', 'post-workout')."),
                idempotency_key: z
                    .string()
                    .min(1)
                    .max(255)
                    .optional()
                    .describe(
                        idempotencyKeyDescription(
                            "entry",
                            "log them as one combined amount (two 250 ml glasses as 500 ml) or give each its own key",
                        ),
                    ),
            }),
        },
        async (args) => {
            return withAnalytics(
                "log_water",
                async () => {
                    const { iso, note, tz } = await resolveWriteTimestamp(
                        userId,
                        args.logged_at,
                    );
                    const { entry, deduplicated } = await insertWater(userId, {
                        ...args,
                        logged_at: iso,
                    });
                    const prefix = deduplicated
                        ? "Already logged — this matched an existing entry, so nothing new was added"
                        : "Water logged";
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${prefix}: ${entry.amount_ml} ml at ${localTimeOf(entry.logged_at, tz, true)} (${tz})${entry.notes ? ` (${entry.notes})` : ""}. ID: ${entry.id}${note}`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "get_water_today",
        {
            title: "Get Today's Water",
            description:
                "Get today's total water intake (ml) and the list of entries.",
            annotations: {
                title: "Get Today's Water",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async () => {
            return withAnalytics(
                "get_water_today",
                async () => {
                    const tz = await getUserTimezone(userId);
                    const entries = await getWaterByDate(
                        userId,
                        todayInTz(tz),
                        tz,
                    );
                    if (entries.length === 0) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: "No water logged today.",
                                },
                            ],
                        };
                    }
                    const total = sumWater(entries);
                    const lines = entries.map(
                        (e) =>
                            `- ${e.amount_ml} ml at ${localTimeOf(e.logged_at, tz, false)}${e.notes ? ` (${e.notes})` : ""} [id: ${e.id}]`,
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Total: ${total} ml (${entries.length} entr${entries.length === 1 ? "y" : "ies"}). ${timesAreLocal(tz)}\n\n${lines.join("\n")}`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "get_water_by_date",
        {
            title: "Get Water by Date",
            description:
                "Get water intake total and entries for a specific date.",
            annotations: {
                title: "Get Water by Date",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                date: z.string().describe("Date in YYYY-MM-DD format"),
            }),
        },
        async ({ date }) => {
            return withAnalytics(
                "get_water_by_date",
                async () => {
                    assertCalendarDate("date", date);
                    const tz = await getUserTimezone(userId);
                    const entries = await getWaterByDate(userId, date, tz);
                    if (entries.length === 0) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `No water logged on ${date}.`,
                                },
                            ],
                        };
                    }
                    const total = sumWater(entries);
                    const lines = entries.map(
                        (e) =>
                            `- ${e.amount_ml} ml at ${localTimeOf(e.logged_at, tz, false)}${e.notes ? ` (${e.notes})` : ""} [id: ${e.id}]`,
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Total on ${date}: ${total} ml (${entries.length} entr${entries.length === 1 ? "y" : "ies"}). ${timesAreLocal(tz)}\n\n${lines.join("\n")}`,
                            },
                        ],
                    };
                },
                analytics,
                { date },
            );
        },
    );

    server.registerTool(
        "delete_water",
        {
            title: "Delete Water Entry",
            description: "Delete a water log entry by ID.",
            annotations: {
                title: "Delete Water Entry",
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                id: z
                    .string()
                    .describe(
                        `UUID of the water entry to delete, from ${WATER_ID_SOURCES}.`,
                    ),
            }),
        },
        async ({ id }) => {
            return withAnalytics(
                "delete_water",
                async () => {
                    // Answered, not thrown: nothing with that id exists, the
                    // same as a well-formed id that matches no row.
                    if (!isUuid(id)) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: notUuidText(
                                        "water entry",
                                        id,
                                        WATER_ID_SOURCES,
                                    ),
                                },
                            ],
                        };
                    }
                    const deleted = await deleteWater(userId, id);
                    return {
                        content: [
                            {
                                type: "text",
                                text: deleted
                                    ? `Water entry ${id} deleted.`
                                    : `No water entry found with id ${id}.`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "log_active_calories",
        {
            title: "Log Active Calories",
            description:
                "Log energy burned in exercise, in kilocalories (kcal), as reported by a watch or fitness app (the 'active calories' figure is the usual source). It is shown beside calorie intake and never changes the calorie goal. Only the share set with set_activity_credit counts against intake, and each entry keeps the share in effect when it is logged. Entries are energy totals, not workout details: no sets, durations or exercise types are stored, and a short note is the only extra field. Burned energy is not food and does not add to intake.",
            annotations: {
                title: "Log Active Calories",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: z.object({
                kcal: z.coerce
                    .number()
                    .describe(
                        `Energy burned in kilocalories: a whole number from ${ACTIVE_KCAL_MIN} to ${ACTIVE_KCAL_MAX}.`,
                    ),
                logged_at: z
                    .string()
                    .optional()
                    .describe(
                        "When the activity happened (defaults to now). " +
                            LOGGED_AT_FORMS +
                            LOGGED_AT_OMIT_IF_NOW,
                    ),
                notes: z
                    .string()
                    .optional()
                    .describe("Optional short note (e.g. 'morning run')."),
                idempotency_key: z
                    .string()
                    .min(1)
                    .max(255)
                    .optional()
                    .describe(
                        idempotencyKeyDescription(
                            "entry",
                            "log them as one combined total (two walks as one figure) or give each its own key",
                        ),
                    ),
            }),
        },
        async (args) => {
            return withAnalytics(
                "log_active_calories",
                async () => {
                    const problem = activeKcalError(args.kcal);
                    if (problem !== null) throw new ToolError(problem);
                    const { iso, note, tz } = await resolveWriteTimestamp(
                        userId,
                        args.logged_at,
                    );
                    // The credit share is snapshotted onto the row now, so a
                    // later set_activity_credit leaves this entry as it was.
                    const creditPct = activityCreditPctFromProfile(
                        await getProfile(userId),
                    );
                    const { entry, deduplicated } = await insertActiveCalories(
                        userId,
                        {
                            kcal: args.kcal,
                            credit_pct: creditPct,
                            logged_at: iso,
                            notes: args.notes,
                            idempotency_key: args.idempotency_key,
                        },
                    );
                    const day = dateInTz(entry.logged_at, tz);
                    const dayRows = await getActivityInRange(
                        userId,
                        day,
                        day,
                        tz,
                    );
                    const dayTotals = sumActivity(countedActivity(dayRows, tz));
                    // A day the Apple Health activity sync totals already
                    // includes this burn, so the entry is kept but not added.
                    const healthDay = dayRows.find(isHealthDayTotal);
                    const healthNote = healthDay
                        ? ` ${day} has an Apple Health day total (${healthDay.kcal} kcal), which already includes the day's workouts, so this entry is kept but not added to the day's total.`
                        : "";
                    const prefix = deduplicated
                        ? "Already logged — this matched an existing entry, so nothing new was added"
                        : "Active calories logged";
                    const counted = creditedKcal(entry.kcal, entry.credit_pct);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${prefix}: ${entry.kcal} kcal burned at ${localTimeOf(entry.logged_at, tz, true)} (${tz})${entry.notes ? ` (${entry.notes})` : ""}. ${counted} kcal of it counts against intake at ${entry.credit_pct}%. Day ${day}: ${dayTotals.burned_kcal} kcal burned, ${dayTotals.credited_kcal} kcal counted against intake. The calorie goal is unchanged.${healthNote} ID: ${entry.id}${note}`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "get_active_calories",
        {
            title: "Get Active Calories",
            description:
                "List energy burned in exercise (active calories) for one date or a date range, with each entry's local time, kcal, the share that counted against intake, and its id, plus the burned and counted-against-intake totals for each day. Defaults to today when no date is given. A range spans at most 31 days; get_trends covers longer periods with daily averages.",
            annotations: {
                title: "Get Active Calories",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                date: z
                    .string()
                    .optional()
                    .describe(
                        "One date (YYYY-MM-DD). Pass this, or start_date and end_date, not both.",
                    ),
                start_date: z
                    .string()
                    .optional()
                    .describe(
                        "First date of the range (YYYY-MM-DD), inclusive.",
                    ),
                end_date: z
                    .string()
                    .optional()
                    .describe(
                        "Last date of the range (YYYY-MM-DD), inclusive.",
                    ),
            }),
        },
        async ({ date, start_date, end_date }) => {
            return withAnalytics(
                "get_active_calories",
                async () => {
                    const rangeGiven =
                        start_date !== undefined || end_date !== undefined;
                    if (date !== undefined && rangeGiven) {
                        throw new ToolError(
                            "Pass either date, or start_date and end_date, not both.",
                        );
                    }
                    if (
                        rangeGiven &&
                        (start_date === undefined || end_date === undefined)
                    ) {
                        throw new ToolError(
                            "A date range needs both start_date and end_date.",
                        );
                    }
                    const tz = await getUserTimezone(userId);
                    const startDate = start_date ?? date ?? todayInTz(tz);
                    const endDate = end_date ?? date ?? todayInTz(tz);
                    assertDateRange(
                        startDate,
                        endDate,
                        MEALS_RANGE_MAX_DAYS,
                        "get_trends covers longer periods with daily averages.",
                    );
                    const entries = await getActivityInRange(
                        userId,
                        startDate,
                        endDate,
                        tz,
                    );
                    if (entries.length === 0) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text:
                                        startDate === endDate
                                            ? `No active calories logged on ${startDate}.`
                                            : `No active calories logged between ${startDate} and ${endDate}.`,
                                },
                            ],
                        };
                    }

                    // selectLoggedWindow returns oldest first, so grouping by
                    // first appearance keeps the days in order.
                    const byDay = new Map<string, ActiveCaloriesEntry[]>();
                    for (const e of entries) {
                        const day = dateInTz(e.logged_at, tz);
                        const bucket = byDay.get(day);
                        if (bucket) bucket.push(e);
                        else byDay.set(day, [e]);
                    }
                    const blocks: string[] = [];
                    for (const [day, list] of byDay) {
                        const counted = countedActivity(list, tz);
                        const totals = sumActivity(counted);
                        const hasHealth = list.some(isHealthDayTotal);
                        const lines = list.map((e) =>
                            isHealthDayTotal(e)
                                ? `- Apple Health day total · ${e.kcal} kcal · ${e.credit_pct}% counted [id: ${e.id}]`
                                : `- ${localTimeOf(e.logged_at, tz, false)} · ${e.kcal} kcal · ${e.credit_pct}% counted${e.notes ? ` (${e.notes})` : ""}${hasHealth ? " · not added: the Apple Health total includes it" : ""} [id: ${e.id}]`,
                        );
                        blocks.push(
                            `${day}: ${totals.burned_kcal} kcal burned, ${totals.credited_kcal} kcal counted against intake (${list.length} entr${list.length === 1 ? "y" : "ies"})\n${lines.join("\n")}`,
                        );
                    }
                    const header =
                        startDate === endDate
                            ? timesAreLocal(tz)
                            : `${timesAreLocal(tz)} ${byDay.size} of ${dayCountOf(startDate, endDate)} days have entries.`;
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${header}\n\n${blocks.join("\n\n")}`,
                            },
                        ],
                    };
                },
                analytics,
                date !== undefined
                    ? { date }
                    : {
                          start_date: start_date ?? null,
                          end_date: end_date ?? null,
                      },
            );
        },
    );

    server.registerTool(
        "delete_active_calories",
        {
            title: "Delete Active Calories Entry",
            description:
                "Delete one active-calories entry by ID. It is removed from its day's totals; intake and the calorie goal are not affected. An Apple Health day total is written again by the next activity sync while the Nutrition MCP Activity shortcut is connected.",
            annotations: {
                title: "Delete Active Calories Entry",
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                id: z
                    .string()
                    .describe(
                        `UUID of the active-calories entry to delete, from ${ACTIVE_ID_SOURCES}.`,
                    ),
            }),
        },
        async ({ id }) => {
            return withAnalytics(
                "delete_active_calories",
                async () => {
                    if (!isUuid(id)) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: notUuidText(
                                        "active-calories entry",
                                        id,
                                        ACTIVE_ID_SOURCES,
                                    ),
                                },
                            ],
                        };
                    }
                    const deleted = await deleteActiveCalories(userId, id);
                    return {
                        content: [
                            {
                                type: "text",
                                text: deleted
                                    ? `Active calories entry ${id} deleted.`
                                    : `No active calories entry found with id ${id}.`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "set_activity_credit",
        {
            title: "Set Activity Credit",
            description:
                "Choose what share of active calories (energy burned in exercise) counts against calorie intake, from 0 to 100 percent, or pass null to reset to the default of 100 percent. The share applies to active-calories entries logged from now on; entries already logged keep the share they were logged with, so changing it never rewrites past days. It changes only how burned energy is netted against intake in the display: the calorie goal is never changed by activity.",
            annotations: {
                title: "Set Activity Credit",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                percent: z
                    .union([z.null(), z.coerce.number()])
                    .describe(
                        "Share of active calories that counts against intake, a whole number from 0 to 100; null resets it to the default of 100.",
                    ),
            }),
        },
        async ({ percent }) => {
            return withAnalytics(
                "set_activity_credit",
                async () => {
                    if (percent !== null) {
                        const problem = creditPctError(percent);
                        if (problem !== null) throw new ToolError(problem);
                    }
                    const profile = await upsertProfile(userId, {
                        activity_credit_pct: percent,
                    });
                    const pct = activityCreditPctFromProfile(profile);
                    return {
                        content: [
                            {
                                type: "text",
                                text:
                                    percent === null
                                        ? "Activity credit reset to the default of 100%. Active calories logged from now on count fully against intake; entries logged before keep the share they were logged with. The calorie goal is unchanged."
                                        : `Activity credit set to ${pct}%. Active calories logged from now on count ${pct}% against intake; entries logged before keep the share they were logged with. The calorie goal is unchanged.`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "log_weight",
        {
            title: "Log Weight",
            description:
                "Log a body-weight measurement. Provide the number in `weight` and its `unit` ('kg' or 'lb'); if you omit the unit, the user's saved preference is used, and if they have no preference set yet the call fails asking you to specify one. IMPORTANT: do NOT convert units yourself — pass the value in whatever unit the user stated and set `unit` accordingly. The server stores weight canonically and converts as needed. Multiple weigh-ins per day are allowed.",
            annotations: {
                title: "Log Weight",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: z.object({
                weight: z.coerce
                    .number()
                    .positive()
                    .describe("Body weight value, in `unit` (> 0)."),
                unit: z
                    .enum(["kg", "lb"])
                    .optional()
                    .describe(
                        "Unit of the weight value. Defaults to the user's preferred weight unit.",
                    ),
                logged_at: z
                    .string()
                    .optional()
                    .describe(
                        "When this actually happened (defaults to now). " +
                            LOGGED_AT_FORMS +
                            LOGGED_AT_OMIT_IF_NOW,
                    ),
                notes: z
                    .string()
                    .optional()
                    .describe(
                        "Optional notes (e.g. 'morning, fasted', 'after workout').",
                    ),
                idempotency_key: z
                    .string()
                    .min(1)
                    .max(255)
                    .optional()
                    .describe(
                        idempotencyKeyDescription(
                            "entry",
                            "give each its own time or its own key",
                        ),
                    ),
            }),
        },
        async (args) => {
            return withAnalytics(
                "log_weight",
                async () => {
                    const { iso, note, tz } = await resolveWriteTimestamp(
                        userId,
                        args.logged_at,
                    );
                    const unit = await resolveWriteWeightUnit(
                        userId,
                        args.unit,
                    );
                    const weight_g = toGrams(args.weight, unit);
                    assertPlausibleWeight(weight_g, unit);
                    const { entry, deduplicated } = await insertWeight(userId, {
                        weight_g,
                        logged_at: iso,
                        notes: args.notes,
                        idempotency_key: args.idempotency_key,
                    });
                    const prefix = deduplicated
                        ? "Already logged — this matched an existing entry, so nothing new was added"
                        : "Weight logged";
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${prefix}: ${formatWeight(entry.weight_g, unit)} at ${localTimeOf(entry.logged_at, tz, true)} (${tz})${entry.notes ? ` (${entry.notes})` : ""}. ID: ${entry.id}${note}`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "get_weight_today",
        {
            title: "Get Today's Weight",
            description:
                "Get today's weight entries, shown in the user's preferred unit.",
            annotations: {
                title: "Get Today's Weight",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async () => {
            return withAnalytics(
                "get_weight_today",
                async () => {
                    const [tz, weightPref] = await Promise.all([
                        getUserTimezone(userId),
                        getPreferredWeightUnit(userId),
                    ]);
                    const unit = weightPref ?? "kg";
                    const entries = await getWeightByDate(
                        userId,
                        todayInTz(tz),
                        tz,
                    );
                    if (entries.length === 0) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: "No weight logged today.",
                                },
                            ],
                        };
                    }
                    const lines = entries.map((e) =>
                        formatWeightEntry(e, unit, tz),
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Today (${entries.length} entr${entries.length === 1 ? "y" : "ies"}). ${timesAreLocal(tz)}\n\n${lines.join("\n")}`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "get_weight_by_date",
        {
            title: "Get Weight by Date",
            description:
                "Get weight entries for a specific date, in the user's preferred unit.",
            annotations: {
                title: "Get Weight by Date",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                date: z.string().describe("Date in YYYY-MM-DD format"),
            }),
        },
        async ({ date }) => {
            return withAnalytics(
                "get_weight_by_date",
                async () => {
                    assertCalendarDate("date", date);
                    const [tz, weightPref] = await Promise.all([
                        getUserTimezone(userId),
                        getPreferredWeightUnit(userId),
                    ]);
                    const unit = weightPref ?? "kg";
                    const entries = await getWeightByDate(userId, date, tz);
                    if (entries.length === 0) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `No weight logged on ${date}.`,
                                },
                            ],
                        };
                    }
                    const lines = entries.map((e) =>
                        formatWeightEntry(e, unit, tz),
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${date} (${entries.length} entr${entries.length === 1 ? "y" : "ies"}). ${timesAreLocal(tz)}\n\n${lines.join("\n")}`,
                            },
                        ],
                    };
                },
                analytics,
                { date },
            );
        },
    );

    server.registerTool(
        "get_weight_by_date_range",
        {
            title: "Get Weight by Date Range",
            description: `Get all weight entries between two dates (inclusive), grouped by day with each day's average. Use this instead of multiple get_weight_by_date calls. The range can span at most ${WEIGHT_RANGE_MAX_DAYS} days.`,
            annotations: {
                title: "Get Weight by Date Range",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                start_date: z.string().describe("Start date (YYYY-MM-DD)"),
                end_date: z.string().describe("End date (YYYY-MM-DD)"),
            }),
        },
        async ({ start_date, end_date }) => {
            return withAnalytics(
                "get_weight_by_date_range",
                async () => {
                    assertDateRange(
                        start_date,
                        end_date,
                        WEIGHT_RANGE_MAX_DAYS,
                        "For a longer trend use get_weight_trends, or split the range into yearly calls.",
                    );
                    const [tz, weightPref] = await Promise.all([
                        getUserTimezone(userId),
                        getPreferredWeightUnit(userId),
                    ]);
                    const unit = weightPref ?? "kg";
                    const entries = await getWeightInRange(
                        userId,
                        start_date,
                        end_date,
                        tz,
                    );
                    if (entries.length === 0) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `No weight found between ${start_date} and ${end_date}.`,
                                },
                            ],
                        };
                    }

                    const byDate = new Map<string, WeightEntry[]>();
                    for (const e of entries) {
                        const date = dateInTz(e.logged_at, tz);
                        const existing = byDate.get(date) ?? [];
                        existing.push(e);
                        byDate.set(date, existing);
                    }

                    const sections: string[] = [];
                    for (const [date, dayEntries] of [
                        ...byDate.entries(),
                    ].sort()) {
                        const avgG =
                            dayEntries.reduce((s, e) => s + e.weight_g, 0) /
                            dayEntries.length;
                        const header =
                            dayEntries.length === 1
                                ? `## ${date}`
                                : `## ${date} (avg ${formatWeight(avgG, unit)}, ${dayEntries.length} entries)`;
                        const formatted = dayEntries
                            .map((e) => formatWeightEntry(e, unit, tz))
                            .join("\n");
                        sections.push(`${header}\n${formatted}`);
                    }

                    return {
                        content: [
                            {
                                type: "text",
                                text: `${timesAreLocal(tz)}\n\n${sections.join("\n\n")}`,
                            },
                        ],
                    };
                },
                analytics,
                { start_date, end_date },
            );
        },
    );

    server.registerTool(
        "get_weight_trends",
        {
            title: "Get Weight Trends",
            description:
                "Weight trend over a window: latest reading, overall change, a smoothed trend weight with its weekly rate over the last 2 weeks (which filters out day-to-day water swings), min/max, and progress toward the target weight if one is set. Aggregates multiple weigh-ins per day by averaging. Defaults to the last 30 days ending today.",
            annotations: {
                title: "Get Weight Trends",
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
            }),
            outputSchema: z.object({
                end_date: z.string(),
                unit: z.string(),
                target: z.number().nullable(),
                default_range: z.number(),
                // The widget's UI language — see the identical field on
                // get_nutrition_summary's outputSchema for why this is
                // z.string() and resolved server-side via getUserLocale.
                locale: z.string(),
                // Per-day weight (same-day weigh-ins averaged) in display units,
                // for logged days within the last 30 days; widget slices 7/14/30.
                days: z.array(
                    z.object({
                        date: z.string(),
                        weight: z.number(),
                    }),
                ),
            }),
            // Link the tool to its interactive weight-trends UI (MCP Apps).
            ...uiMeta(WEIGHT_TRENDS_WIDGET_URI),
        },
        withWidgetPrefs(async ({ days, end_date }) => {
            return withAnalytics(
                "get_weight_trends",
                async () => {
                    if (end_date !== undefined)
                        assertCalendarDate("end_date", end_date);
                    const profile = await getProfile(userId);
                    const tz = timezoneFromProfile(profile) ?? "UTC";
                    const unit =
                        preferredWeightUnitFromProfile(profile) ?? "kg";
                    const locale = localeFromProfile(profile) ?? "en";
                    const endDate = end_date ?? todayInTz(tz);
                    const windowDays = days ?? 30;
                    const requestedStart = shiftLocalDate(
                        endDate,
                        -(windowDays - 1),
                    );
                    // One full-history read feeds everything: the trend's
                    // warm-up (the EWMA runs from the first weigh-in ever, so
                    // it is settled on the first day shown), the text window,
                    // the 30-day structuredContent and the long-range series
                    // in _meta. getAllWeight pages and reconciles against an
                    // exact count, so a long history throws rather than
                    // silently starting the trend late.
                    // Body measurements feed only the widget's details
                    // view: a failed read drops that `_meta` key (the widget
                    // then hides the section) instead of failing the tool.
                    const [entries, goals, measurements] = await Promise.all([
                        getAllWeight(userId),
                        getNutritionGoals(userId),
                        getBodyMeasurementsInRange(
                            userId,
                            shiftLocalDate(endDate, -(WIDGET_HISTORY_DAYS - 1)),
                            endDate,
                            tz,
                        ).catch((err: unknown) => {
                            console.warn(
                                `[get_weight_trends] body-measurements read failed; widget key dropped (${err instanceof Error ? err.name : "error"})`,
                            );
                            return null;
                        }),
                    ]);
                    const targetG = goals?.target_weight_g ?? null;
                    const analysis = analyzeWeightHistory(
                        entries,
                        tz,
                        unit,
                        endDate,
                    );

                    // structuredContent is frozen (output-schemas.frozen.json):
                    // one value per logged day (same-day weigh-ins averaged),
                    // raw, in display units, within the last 30 days. Older
                    // history only ever reaches the widget through _meta.
                    const seriesCutoff = shiftLocalDate(endDate, -29);
                    const widgetDays = analysis.days
                        .filter((d) => d.date >= seriesCutoff)
                        .map((d) => ({
                            date: d.date,
                            weight: fromGrams(d.weight_g, unit),
                        }));

                    let text = computeWeightTrend(
                        entries,
                        requestedStart,
                        endDate,
                        tz,
                        targetG,
                        unit,
                    );
                    // The structured `days` series is always the last 30 days
                    // whatever window was asked for; say so, or a host that
                    // charts it labels a 30-day chart with the text's window.
                    if (windowDays !== 30 && widgetDays.length > 0) {
                        text += `\n\nThe structured daily series covers the last 30 days only (${seriesCutoff} to ${endDate}); the figures above cover the requested ${windowDays}-day window.`;
                    }

                    return {
                        content: [{ type: "text", text }],
                        structuredContent: {
                            end_date: endDate,
                            unit,
                            target:
                                targetG != null
                                    ? fromGrams(targetG, unit)
                                    : null,
                            default_range: defaultRangeFor(windowDays),
                            locale,
                            days: widgetDays,
                        },
                        // Trend, rate and the 90-day / weekly / monthly
                        // series: _meta, not structuredContent, because the
                        // output schema is frozen (see WEIGHT_SERIES_META_KEY).
                        // The per-reading list and the measurements are
                        // widget-only details for the same reason.
                        _meta: {
                            [WEIGHT_SERIES_META_KEY]: analysis.meta,
                            [WEIGHT_ENTRIES_META_KEY]: buildWeightEntriesMeta(
                                entries,
                                tz,
                                unit,
                                endDate,
                                todayInTz(tz),
                            ),
                            ...(measurements
                                ? {
                                      [BODY_MEASUREMENTS_META_KEY]:
                                          buildBodyMeasurementsMeta(
                                              measurements,
                                              tz,
                                              preferredLengthUnitFromProfile(
                                                  profile,
                                              ),
                                              endDate,
                                          ),
                                  }
                                : {}),
                        },
                    };
                },
                analytics,
                { days: days ?? 30 },
            );
        }),
    );

    server.registerTool(
        "update_weight",
        {
            title: "Update Weight Entry",
            description:
                "Update fields of an existing weight entry. Provide `unit` alongside `weight` (defaults to the user's preferred unit); do NOT convert units yourself.",
            annotations: {
                title: "Update Weight Entry",
                readOnlyHint: false,
                // Overwrites a stored record with no undo — "false" would mean
                // "only additive updates", which this is not.
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                id: z
                    .string()
                    .describe(
                        `UUID of the weight entry to update, from ${WEIGHT_ID_SOURCES}.`,
                    ),
                weight: z.coerce
                    .number()
                    .positive()
                    .optional()
                    .describe("New weight value, in `unit`."),
                unit: z
                    .enum(["kg", "lb"])
                    .optional()
                    .describe(
                        "Unit of the weight value. Defaults to the user's preferred weight unit.",
                    ),
                logged_at: z
                    .string()
                    .optional()
                    .describe(
                        "When the weight was measured. " + LOGGED_AT_FORMS,
                    ),
                notes: z.string().optional(),
            }),
        },
        async ({ id, weight, unit, logged_at, notes }) => {
            return withAnalytics(
                "update_weight",
                async () => {
                    // Before resolveWriteTimestamp, which reads the profile.
                    if (!isUuid(id))
                        throw new ToolError(
                            notUuidText("weight entry", id, WEIGHT_ID_SOURCES),
                        );
                    const { iso, note, tz } = await resolveWriteTimestamp(
                        userId,
                        logged_at,
                    );
                    const patch: {
                        weight_g?: number;
                        logged_at?: string;
                        notes?: string | null;
                    } = {};
                    // Only require a unit when a new weight value is supplied;
                    // otherwise fall back to kg purely for formatting the result.
                    let displayUnit: WeightUnit;
                    if (weight !== undefined) {
                        displayUnit = await resolveWriteWeightUnit(
                            userId,
                            unit,
                        );
                        patch.weight_g = toGrams(weight, displayUnit);
                        assertPlausibleWeight(patch.weight_g, displayUnit);
                    } else {
                        displayUnit =
                            unit ??
                            (await getPreferredWeightUnit(userId)) ??
                            "kg";
                    }
                    if (iso !== undefined) patch.logged_at = iso;
                    if (notes !== undefined) patch.notes = notes;
                    const entry = await updateWeight(userId, id, patch);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Weight updated (${tz} time):\n${formatWeightEntry(entry, displayUnit, tz, true)}${note}`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "delete_weight",
        {
            title: "Delete Weight Entry",
            description: "Delete a weight log entry by ID.",
            annotations: {
                title: "Delete Weight Entry",
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                id: z
                    .string()
                    .describe(
                        `UUID of the weight entry to delete, from ${WEIGHT_ID_SOURCES}.`,
                    ),
            }),
        },
        async ({ id }) => {
            return withAnalytics(
                "delete_weight",
                async () => {
                    // Answered, not thrown: nothing with that id exists, the
                    // same as a well-formed id that matches no row.
                    if (!isUuid(id)) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: notUuidText(
                                        "weight entry",
                                        id,
                                        WEIGHT_ID_SOURCES,
                                    ),
                                },
                            ],
                        };
                    }
                    const deleted = await deleteWeight(userId, id);
                    return {
                        content: [
                            {
                                type: "text",
                                text: deleted
                                    ? `Weight entry ${id} deleted.`
                                    : `No weight entry found with id ${id}.`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "set_weight_unit",
        {
            title: "Set Weight Unit",
            description:
                "Set the user's preferred weight unit ('kg' or 'lb'), or pass null to clear it. This controls how weights are shown and how a bare number is interpreted when logging without an explicit unit. Stored weights are unaffected (they are canonical) — only display and default parsing change. While unset, logging requires an explicit unit and weights display in kg.",
            annotations: {
                title: "Set Weight Unit",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                unit: z
                    .enum(["kg", "lb"])
                    .nullable()
                    .describe(
                        "Preferred weight unit: 'kg' or 'lb'. Pass null to clear the preference.",
                    ),
            }),
        },
        async ({ unit }) => {
            return withAnalytics(
                "set_weight_unit",
                async () => {
                    if (unit !== null && !isWeightUnit(unit)) {
                        throw new ToolError(
                            `Invalid weight unit: ${unit}. Use 'kg', 'lb', or null to clear.`,
                        );
                    }
                    const profile = await upsertProfile(userId, {
                        preferred_weight_unit: unit,
                    });
                    return {
                        content: [
                            {
                                type: "text",
                                text: profile.preferred_weight_unit
                                    ? `Preferred weight unit set to ${profile.preferred_weight_unit}.`
                                    : "Preferred weight unit cleared. Logging will require an explicit unit until you set one, and weights display in kg.",
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "log_body_measurement",
        {
            title: "Log Body Measurement",
            description:
                "Log one body circumference measurement — waist, hips, neck, chest, shoulders, upper arm, forearm, thigh or calf — in centimetres or inches. Without `unit`, the user's saved length unit (set_length_unit) applies; with neither, the call fails and says a unit is needed. The server stores the number and unit exactly as given and does any cm/in conversion itself. Each entry is one site with no left/right field; a side or other detail goes in notes. A site can be measured several times a day. A number far outside a realistic range for the site is refused as a likely typo. Measurements are recorded as given, without targets or interpretation, and this server does not provide medical advice.",
            annotations: {
                title: "Log Body Measurement",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: z.object({
                kind: z
                    .enum(BODY_MEASUREMENT_KINDS)
                    .describe(
                        "Body site measured: waist, hips, neck, chest, shoulders, upper_arm (upper arm / biceps), forearm, thigh or calf.",
                    ),
                value: z.coerce
                    .number()
                    .positive()
                    .describe(
                        "Circumference in `unit` (> 0), as the user stated it.",
                    ),
                unit: z
                    .enum(["cm", "in"])
                    .optional()
                    .describe(
                        "Unit of the value: 'cm' or 'in'. Defaults to the user's saved length unit; with neither, the call fails.",
                    ),
                logged_at: z
                    .string()
                    .optional()
                    .describe(
                        "When the measurement was taken (defaults to now). " +
                            LOGGED_AT_FORMS_PLAIN +
                            LOGGED_AT_OMITTED_PLAIN,
                    ),
                notes: z
                    .string()
                    .optional()
                    .describe(
                        "Optional notes (e.g. 'left side', 'at the navel', 'morning, relaxed').",
                    ),
                idempotency_key: z
                    .string()
                    .min(1)
                    .max(255)
                    .optional()
                    .describe(idempotencyKeyDescriptionPlain("measurement")),
            }),
        },
        async (args) => {
            return withAnalytics(
                "log_body_measurement",
                async () => {
                    const { iso, note, tz } = await resolveWriteTimestamp(
                        userId,
                        args.logged_at,
                    );
                    const unit = await resolveWriteLengthUnit(
                        userId,
                        args.unit,
                    );
                    const value_mm = assertPlausibleLength(
                        args.kind,
                        args.value,
                        unit,
                    );
                    const { entry, deduplicated } = await insertBodyMeasurement(
                        userId,
                        {
                            kind: args.kind,
                            value_mm,
                            value_entered: args.value,
                            entered_unit: unit,
                            logged_at: iso,
                            notes: args.notes,
                            idempotency_key: args.idempotency_key,
                        },
                    );
                    const prefix = deduplicated
                        ? "Already logged — this matched an existing entry, so nothing new was added"
                        : "Body measurement logged";
                    // Rendered from the stored row, so a deduplicated call
                    // shows the entry that already exists.
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${prefix}: ${measurementLabel(entry.kind)} ${formatMeasurementValue(entry, entry.entered_unit)} at ${localTimeOf(entry.logged_at, tz, true)} (${tz})${entry.notes ? ` (${entry.notes})` : ""}. ID: ${entry.id}${note}`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "get_body_measurements",
        {
            title: "Get Body Measurements",
            description: `Get body measurements between two dates (inclusive), optionally for one site, oldest first and grouped by local day, each with the id that update_body_measurement and delete_body_measurement take. Defaults to the 30 days ending today; a range spans at most ${BODY_MEASUREMENT_RANGE_MAX_DAYS} days, and a long listing stops at a whole day and names the date to continue from. Values are shown in the user's saved length unit, or in the unit each was entered in when none is saved.`,
            annotations: {
                title: "Get Body Measurements",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                kind: z
                    .enum(BODY_MEASUREMENT_KINDS)
                    .optional()
                    .describe("Only this site. Omitted: every site."),
                start_date: z
                    .string()
                    .optional()
                    .describe(
                        "Start date YYYY-MM-DD (default: 29 days before end_date).",
                    ),
                end_date: z
                    .string()
                    .optional()
                    .describe(
                        "End date YYYY-MM-DD (default: today in the user's timezone).",
                    ),
            }),
        },
        async ({ kind, start_date, end_date }) => {
            return withAnalytics(
                "get_body_measurements",
                async () => {
                    // Before shiftLocalDate, which rolls bad dates over.
                    if (start_date !== undefined)
                        assertCalendarDate("start_date", start_date);
                    if (end_date !== undefined)
                        assertCalendarDate("end_date", end_date);
                    const profile = await getProfile(userId);
                    const tz = timezoneFromProfile(profile) ?? "UTC";
                    const pref = preferredLengthUnitFromProfile(profile);
                    const end = end_date ?? todayInTz(tz);
                    const start =
                        start_date ??
                        shiftLocalDate(
                            end,
                            -(BODY_MEASUREMENT_DEFAULT_DAYS - 1),
                        );
                    assertDateRange(
                        start,
                        end,
                        BODY_MEASUREMENT_RANGE_MAX_DAYS,
                        "Split the range into yearly calls.",
                    );
                    const entries = await getBodyMeasurementsInRange(
                        userId,
                        start,
                        end,
                        tz,
                        kind,
                    );
                    if (entries.length === 0) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `No ${kind ? `${measurementLabel(kind).toLowerCase()} measurements` : "body measurements"} found between ${start} and ${end}.`,
                                },
                            ],
                        };
                    }

                    const byDate = new Map<string, BodyMeasurementEntry[]>();
                    for (const e of entries) {
                        const date = dateInTz(e.logged_at, tz);
                        const existing = byDate.get(date) ?? [];
                        existing.push(e);
                        byDate.set(date, existing);
                    }

                    // Whole days while they fit the budget; the first day is
                    // always shown, however long.
                    const header = timesAreLocal(tz);
                    const sections: string[] = [];
                    let length = header.length;
                    let lastDate = "";
                    let truncated = false;
                    for (const [date, dayEntries] of [
                        ...byDate.entries(),
                    ].sort()) {
                        const section = `## ${date}\n${dayEntries
                            .map((e) => formatMeasurementEntry(e, pref, tz))
                            .join("\n")}`;
                        if (
                            sections.length > 0 &&
                            length + 2 + section.length > MEAL_LISTING_MAX_CHARS
                        ) {
                            truncated = true;
                            break;
                        }
                        sections.push(section);
                        length += 2 + section.length;
                        lastDate = date;
                    }
                    const notice = truncated
                        ? `\n\n(Listing stops after ${lastDate} to keep the response short; get_body_measurements with start_date ${shiftLocalDate(lastDate, 1)}, end_date ${end}${kind ? ` and kind ${kind}` : ""} returns the rest.)`
                        : "";

                    return {
                        content: [
                            {
                                type: "text",
                                text: `${header}\n\n${sections.join("\n\n")}${notice}`,
                            },
                        ],
                    };
                },
                analytics,
                { start_date, end_date },
            );
        },
    );

    server.registerTool(
        "update_body_measurement",
        {
            title: "Update Body Measurement",
            description:
                "Update an existing body measurement's value, unit, time or notes. The site (kind) cannot be changed; a measurement of a different site is a new entry. A new `value` is read in `unit`, which defaults to the unit the entry was originally entered in, not the saved preference. Passing `unit` without `value` re-reads the stored number in that unit, which corrects an entry logged with the wrong unit. A value far outside a realistic range for the site is refused.",
            annotations: {
                title: "Update Body Measurement",
                readOnlyHint: false,
                // Overwrites a stored record with no undo — "false" would mean
                // "only additive updates", which this is not.
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                id: z
                    .string()
                    .describe(
                        `UUID of the body measurement to update, from ${MEASUREMENT_ID_SOURCES}.`,
                    ),
                value: z.coerce
                    .number()
                    .positive()
                    .optional()
                    .describe("New circumference value, in `unit`."),
                unit: z
                    .enum(["cm", "in"])
                    .optional()
                    .describe(
                        "Unit of the value. Defaults to the unit this entry was entered in.",
                    ),
                logged_at: z
                    .string()
                    .optional()
                    .describe(
                        "When the measurement was taken. " +
                            LOGGED_AT_FORMS_PLAIN,
                    ),
                notes: z.string().optional(),
            }),
        },
        async ({ id, value, unit, logged_at, notes }) => {
            return withAnalytics(
                "update_body_measurement",
                async () => {
                    // Before resolveWriteTimestamp, which reads the profile.
                    if (!isUuid(id))
                        throw new ToolError(
                            notUuidText(
                                "body measurement",
                                id,
                                MEASUREMENT_ID_SOURCES,
                            ),
                        );
                    // Worded without "update": categorizeError's tier 3 reads
                    // any "date" substring as invalid_date_format.
                    if (
                        value === undefined &&
                        unit === undefined &&
                        logged_at === undefined &&
                        notes === undefined
                    )
                        throw new ToolError(
                            "Nothing to change: value, unit, logged_at or notes is needed.",
                        );
                    const { iso, note, tz } = await resolveWriteTimestamp(
                        userId,
                        logged_at,
                    );
                    const patch: {
                        value_mm?: number;
                        value_entered?: number;
                        entered_unit?: LengthUnit;
                        logged_at?: string;
                        notes?: string | null;
                    } = {};
                    if (value !== undefined || unit !== undefined) {
                        // Always read: the plausible range depends on the
                        // row's kind, and a missing half comes from the row.
                        const current = await getBodyMeasurement(userId, id);
                        if (!current)
                            throw new ToolError(
                                `No body measurement found with id ${id}.`,
                            );
                        const u: LengthUnit = unit ?? current.entered_unit;
                        const v = value ?? Number(current.value_entered);
                        const kindOf: BodyMeasurementKind = current.kind;
                        patch.value_mm = assertPlausibleLength(kindOf, v, u);
                        patch.value_entered = v;
                        patch.entered_unit = u;
                    }
                    if (iso !== undefined) patch.logged_at = iso;
                    if (notes !== undefined) patch.notes = notes;
                    const entry = await updateBodyMeasurement(
                        userId,
                        id,
                        patch,
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Body measurement updated (${tz} time):\n${formatMeasurementEntry(entry, entry.entered_unit, tz, true)}${note}`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "delete_body_measurement",
        {
            title: "Delete Body Measurement",
            description: "Delete a body measurement by ID.",
            annotations: {
                title: "Delete Body Measurement",
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                id: z
                    .string()
                    .describe(
                        `UUID of the body measurement to delete, from ${MEASUREMENT_ID_SOURCES}.`,
                    ),
            }),
        },
        async ({ id }) => {
            return withAnalytics(
                "delete_body_measurement",
                async () => {
                    // Answered, not thrown: nothing with that id exists, the
                    // same as a well-formed id that matches no row.
                    if (!isUuid(id)) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: notUuidText(
                                        "body measurement",
                                        id,
                                        MEASUREMENT_ID_SOURCES,
                                    ),
                                },
                            ],
                        };
                    }
                    const deleted = await deleteBodyMeasurement(userId, id);
                    return {
                        content: [
                            {
                                type: "text",
                                text: deleted
                                    ? `Body measurement ${id} deleted.`
                                    : `No body measurement found with id ${id}.`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "set_length_unit",
        {
            title: "Set Length Unit",
            description:
                "Set the user's preferred length unit for body measurements ('cm' or 'in'), or pass null to clear it. It decides how measurements are shown and which unit a number logged without `unit` is read in. Stored measurements keep the number and unit they were entered with; only display and default parsing change. It is independent of the weight unit. While unset, logging a measurement needs an explicit unit and each one is shown in the unit it was entered in.",
            annotations: {
                title: "Set Length Unit",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                unit: z
                    .enum(["cm", "in"])
                    .nullable()
                    .describe(
                        "Preferred length unit: 'cm' or 'in'. null clears the preference.",
                    ),
            }),
        },
        async ({ unit }) => {
            return withAnalytics(
                "set_length_unit",
                async () => {
                    if (unit !== null && !isLengthUnit(unit)) {
                        throw new ToolError(
                            `Invalid length unit: ${unit}. Valid values are 'cm', 'in', or null to clear.`,
                        );
                    }
                    const profile = await upsertProfile(userId, {
                        preferred_length_unit: unit,
                    });
                    const saved = preferredLengthUnitFromProfile(profile);
                    return {
                        content: [
                            {
                                type: "text",
                                text: saved
                                    ? `Preferred length unit set to ${saved}.`
                                    : "Preferred length unit cleared. Logging a measurement now needs an explicit unit, and each measurement is shown in the unit it was entered in.",
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );
}
