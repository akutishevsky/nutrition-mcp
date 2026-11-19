import { z } from "zod";
import { isDrinkUnit, type DrinkUnit } from "../../alcohol.js";
import {
    DELETED_ACCOUNT_ANALYTICS_ID,
    withAnalytics,
} from "../../analytics.js";
import { newErrorRef, ToolError } from "../../errors.js";
import { exportAllData } from "../../export.js";
import {
    createSupabaseHealthActivityLinkStore,
    createSupabaseHealthSyncStore,
} from "../../health-sync-store.js";
import { LOCALE_NAMES, SITE_LOCALES, type SiteLocale } from "../../routes.js";
import {
    alcoholTrackingEnabledFromProfile,
    deleteAllUserData,
    getProfile,
    localeFromProfile,
    preferredDrinkUnitFromProfile,
    preferredLengthUnitFromProfile,
    preferredWeightUnitFromProfile,
    timezoneFromProfile,
    upsertProfile,
    widgetsEnabledFromProfile,
    widgetsExpandedFromProfile,
} from "../../supabase.js";
import { todayInTz, validateTz } from "../../tz.js";
import type { ToolContext } from "../context.js";
import {
    drinkUnitLabel,
    formatClockLine,
    healthActivityProfileLine,
    healthSyncProfileLine,
} from "../formatters.js";
import { activityCreditLine } from "../totals.js";

export function registerProfileTools(ctx: ToolContext): void {
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
        "set_widget_display",
        {
            title: "Set Widget Display",
            description:
                "Turns the in-chat visual widgets (nutrition dashboard, goal progress, meal-logged rings, trends, weight charts) on or off, and sets whether they open expanded, with their Show more detail already open, or collapsed. When disabled, the same tools still return their full text and data — just no rendered widget. Widgets are enabled and collapsed by default. Either field can be given alone; an omitted one keeps its current value. Note: hosts read the widget list when a session connects, so turning widgets on or off takes effect in new conversations, and an already-open chat may keep showing widgets until it reconnects; the expanded choice applies from the next widget shown.",
            annotations: {
                title: "Set Widget Display",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                enabled: z
                    .boolean()
                    .optional()
                    .describe(
                        "true to show widgets (default), false for text-only responses with no widget. Omit to leave it unchanged.",
                    ),
                expanded: z
                    .boolean()
                    .optional()
                    .describe(
                        "true to open widgets with their detail (Show more) already expanded, false to open them collapsed (default). Omit to leave it unchanged.",
                    ),
            }),
        },
        async ({ enabled, expanded }) => {
            return withAnalytics(
                "set_widget_display",
                async () => {
                    // Refused in the handler, not with a Zod refine, so the
                    // caller gets this sentence instead of a schema error.
                    if (enabled === undefined && expanded === undefined)
                        throw new ToolError(
                            "Nothing to change: give enabled, expanded or both.",
                        );
                    const profile = await upsertProfile(userId, {
                        ...(enabled !== undefined
                            ? { widgets_enabled: enabled }
                            : {}),
                        ...(expanded !== undefined
                            ? { widgets_expanded: expanded }
                            : {}),
                    });
                    const lines: string[] = [];
                    if (enabled !== undefined)
                        lines.push(
                            profile.widgets_enabled
                                ? "Widgets enabled. Supported tools will show a visual widget alongside their text in new conversations."
                                : "Widgets disabled. Supported tools will return text and data only, with no widget, in new conversations.",
                        );
                    if (expanded !== undefined)
                        lines.push(
                            widgetsExpandedFromProfile(profile)
                                ? "Widgets will open expanded, with their detail already shown, from the next widget on."
                                : "Widgets will open collapsed, from the next widget on.",
                        );
                    return {
                        content: [
                            {
                                type: "text",
                                text: lines.join(" "),
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "set_alcohol_tracking",
        {
            title: "Set Alcohol Tracking",
            description:
                "Turn alcohol tracking on or off for the user, and optionally choose whether drinks are counted in US standard drinks (14 g of ethanol) or UK units (7.9 g). Off by default. Alcohol grams passed to log_meal, update_meal or bulk_import_meals are stored either way — this setting controls whether alcohol is shown in meals, goals and progress. One exception, which matters BEFORE a backfill: the file importer (start_meal_import) skips the file's alcohol column entirely while tracking is off, because it will not write a figure the user was never shown for review — and re-importing the same file later does not backfill it. So if the user wants alcohol from an export, turn this on first. Offer it when the user asks to track drinking; do not enable it on your own initiative, and if they ask to stop seeing alcohol, disable it here rather than deleting their meals. The change is live immediately — the next tool call in this same conversation already honours it, with nothing to reconnect or restart.",
            annotations: {
                title: "Set Alcohol Tracking",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                enabled: z
                    .boolean()
                    .describe(
                        "true to show alcohol in meals, goals and progress; false to hide it (stored values are kept either way).",
                    ),
                drink_unit: z
                    // `satisfies` keeps this in step with DrinkUnit at compile
                    // time; z.enum needs the literal tuple, not the exported
                    // readonly array.
                    .enum(["us", "uk"] as const satisfies readonly DrinkUnit[])
                    .optional()
                    .describe(
                        "Which standard drink to show alongside grams: 'us' (14 g per drink) or 'uk' (7.9 g per unit). Defaults to 'us' when never set. Ask the user rather than inferring it from their language.",
                    ),
            }),
        },
        // No "takes effect next conversation" caveat here, unlike
        // set_widget_display. That caveat is true for widgets because
        // widgets_enabled decides each tool's _meta.ui link, which a host only
        // re-reads on tools/list. Alcohol touches no registration metadata: it
        // is threaded into handlers as `alcohol`, and handleMcp builds a fresh
        // McpServer per POST (sessionIdGenerator: undefined) with buildMcpServer
        // re-reading the profile every time — so the very next tool call, in the
        // same open chat, already sees the new setting.
        async ({ enabled, drink_unit }) => {
            return withAnalytics(
                "set_alcohol_tracking",
                async () => {
                    const profile = await upsertProfile(userId, {
                        alcohol_tracking_enabled: enabled,
                        // Left untouched when omitted, so toggling tracking off
                        // and on again does not reset the unit.
                        ...(drink_unit !== undefined
                            ? { preferred_drink_unit: drink_unit }
                            : {}),
                    });
                    const unit = isDrinkUnit(profile.preferred_drink_unit)
                        ? profile.preferred_drink_unit
                        : "us";
                    return {
                        content: [
                            {
                                type: "text",
                                text: profile.alcohol_tracking_enabled
                                    ? `Alcohol tracking enabled, shown in grams alongside ${drinkUnitLabel(unit)}. It appears in meals, goals and daily progress from your next tool call — no need to start a new chat.`
                                    : "Alcohol tracking disabled, effective immediately. Alcohol is no longer shown in meals, goals or progress; anything already logged is kept and reappears if you turn it back on.",
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "export_all_data",
        {
            title: "Export All Data",
            description:
                "Export EVERYTHING this server stores about the user — meals with their ingredients and the source of each nutrient value (a food record, a value the user gave, or an estimate), saved meals with their ingredients, water, active calories, weight, body measurements, nutrition goals and every dated change to them, profile settings, the sign-in account (email, sign-in methods and dates), tool-usage telemetry, the AI-app connections (OAuth grants, without the tokens) and the Apple Health sync connection with its 8-day record of what was sent — as a single ZIP archive (meals.csv, meal_items.csv, saved_meals.csv, saved_meal_items.csv, water.csv, active_calories.csv, weight.csv, body_measurements.csv, goals.csv, goals_history.csv, profile.csv, account.csv, telemetry.csv, connections.csv, health_sync.csv, plus a README.txt describing the columns, the units they are in, and what is not included) and return a private, time-limited download link (valid 60 minutes). Timestamps use the user's timezone if set, otherwise UTC; health_sync.csv rows use the timezone each day was counted in. Only meals.csv can be read back in; every other file is export-only. This is the server's only export path: it covers a full backup, an account takeout, and a request for the meal history alone, which is meals.csv inside the archive. The link is for the user to download the archive.",
            annotations: {
                title: "Export All Data",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
        },
        async () => {
            return withAnalytics(
                "export_all_data",
                async () => {
                    const { counts, goals, profile, account, url } =
                        await exportAllData(userId);
                    // No link means the account had nothing at all — not even a
                    // profile row — so there is no archive to hand over.
                    if (!url) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: "No data to export yet.",
                                },
                            ],
                        };
                    }
                    // Name every file's row count, zeros included: the archive
                    // always ships every file, so "0 weight entries" is what
                    // tells the user weight.csv is headers-only because they
                    // never logged weight — not because the export lost it.
                    const contents = [
                        `${counts.meals} meal${counts.meals === 1 ? "" : "s"}`,
                        `${counts.water} water ${counts.water === 1 ? "entry" : "entries"}`,
                        `${counts.weight} weight ${counts.weight === 1 ? "entry" : "entries"}`,
                        `${counts.bodyMeasurements} body measurement${counts.bodyMeasurements === 1 ? "" : "s"}`,
                        goals ? "nutrition goals" : "no nutrition goals set",
                        `${counts.goalsHistory} goal ${counts.goalsHistory === 1 ? "change" : "changes"}`,
                        profile ? "profile settings" : "no profile settings",
                        account ? "account details" : "no account record",
                        `${counts.telemetry} tool-usage telemetry ${counts.telemetry === 1 ? "row" : "rows"}`,
                        `${counts.connections} app connection ${counts.connections === 1 ? "record" : "records"}`,
                        `${counts.healthSync} Apple Health sync ${counts.healthSync === 1 ? "day" : "days"}`,
                    ].join(", ");
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Exported all data to a ZIP archive: ${contents}.\nDownload (link valid for 60 minutes): ${url}`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "get_profile",
        {
            title: "Get Profile",
            description:
                "Get the user's current settings in one call: timezone (plus local date and time), widget language, preferred weight unit, preferred length unit, whether in-chat widgets are shown, and whether alcohol tracking is on and what share of active calories counts against intake — everything set_timezone, set_language, set_weight_unit, set_length_unit, set_widget_display, set_alcohol_tracking and set_activity_credit each control. Prefer this over guessing a setting from context, and use it once instead of calling several separate settings tools when you need more than one.",
            annotations: {
                title: "Get Profile",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async () => {
            return withAnalytics(
                "get_profile",
                async () => {
                    const [profile, healthSync, activitySync] =
                        await Promise.all([
                            getProfile(userId),
                            // Read beside the profile, and never allowed to fail
                            // it: the sync status is one line of many, and the
                            // rest of the profile is what this tool is for.
                            createSupabaseHealthSyncStore()
                                .getLinkStatus(userId)
                                .catch((err: unknown) => {
                                    const ref = newErrorRef();
                                    console.warn(
                                        `[get_profile] health-sync status error ref=${ref}: ${JSON.stringify(err instanceof Error ? err.message : String(err))}`,
                                    );
                                    return undefined;
                                }),
                            createSupabaseHealthActivityLinkStore()
                                .getActivityLinkStatus(userId)
                                .catch(() => undefined),
                        ]);
                    const tz = timezoneFromProfile(profile);
                    const locale = localeFromProfile(profile);
                    const weightUnit = preferredWeightUnitFromProfile(profile);
                    const lengthUnit = preferredLengthUnitFromProfile(profile);
                    const widgetsEnabled = widgetsEnabledFromProfile(profile);
                    const alcoholEnabled =
                        alcoholTrackingEnabledFromProfile(profile);
                    const drinkUnit =
                        preferredDrinkUnitFromProfile(profile) ?? "us";

                    const lines = [
                        tz === null
                            ? `Timezone: not set (defaulting to UTC). ${formatClockLine("UTC")} The user can set one with set_timezone so 'today' matches their local calendar day.`
                            : `Timezone: ${tz}. ${formatClockLine(tz)}`,
                        locale === null
                            ? "Language: not set (defaulting to English). The user can choose one with set_language."
                            : `Language: ${LOCALE_NAMES[locale as SiteLocale] ?? locale} (${locale}).`,
                        weightUnit
                            ? `Weight unit: ${weightUnit}.`
                            : "Weight unit: not set. Weights display in kg by default, and logging requires an explicit unit ('kg' or 'lb').",
                        lengthUnit
                            ? `Length unit: ${lengthUnit}.`
                            : "Length unit: not set. Body measurements display in the unit each was entered in, and logging one needs an explicit unit ('cm' or 'in').",
                        widgetsEnabled
                            ? `Widgets: enabled, opening ${widgetsExpandedFromProfile(profile) ? "expanded" : "collapsed"}. Supported tools show a visual widget alongside their text.`
                            : "Widgets: disabled. Supported tools return text and data only.",
                        alcoholEnabled
                            ? `Alcohol tracking: enabled, displayed in grams alongside ${drinkUnitLabel(drinkUnit)}${preferredDrinkUnitFromProfile(profile) ? "" : " (the default — no preference saved)"}.`
                            : "Alcohol tracking: disabled, so alcohol is hidden from meals, goals and progress. Alcohol already stored is kept, and anything logged with alcohol_g while it is off is still stored. The exception is the file importer, which skips a file's alcohol column while tracking is off and will not backfill it on a later re-import — so tracking has to be on before importing an export whose alcohol the user wants to keep. The user can enable it with set_alcohol_tracking.",
                        activityCreditLine(profile),
                        healthSyncProfileLine(healthSync, tz ?? "UTC"),
                        healthActivityProfileLine(activitySync, tz ?? "UTC"),
                    ].filter((l): l is string => l !== null);

                    return {
                        content: [
                            {
                                type: "text",
                                text: lines.join("\n"),
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "set_timezone",
        {
            title: "Set Timezone",
            description:
                "Set the user's IANA timezone (e.g. 'America/Los_Angeles', 'Europe/Berlin', 'Asia/Tokyo'). It decides which calendar day meals, water, active calories, weight and body measurements are grouped into when they are read — a meal logged at 11pm in LA counts on that LA day, not the next UTC day — and how a logged_at with no UTC offset is turned into an exact moment when it is written. That second part is permanent: an entry keeps the moment it was resolved to, so correcting the timezone later regroups existing entries under the new zone's days but does not re-read their original local times (a meal entered as 21:00 while the account was on UTC shows as 00:00 the next day once Europe/Kyiv is set in summer). Until one is set, the account uses UTC.",
            annotations: {
                title: "Set Timezone",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                timezone: z
                    .string()
                    .describe(
                        "IANA timezone identifier (e.g. 'America/New_York'). Must be a valid tzdata name.",
                    ),
            }),
        },
        async ({ timezone }) => {
            return withAnalytics(
                "set_timezone",
                async () => {
                    if (!validateTz(timezone)) {
                        throw new ToolError(
                            `Invalid timezone: ${timezone}. Use an IANA identifier like 'America/Los_Angeles' or 'Europe/London'.`,
                        );
                    }
                    await upsertProfile(userId, { timezone });
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Timezone set to ${timezone}. Local today is ${todayInTz(timezone)}.`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "set_language",
        {
            title: "Set Language",
            description: `Set the user's UI language for in-chat widgets (dashboards, charts). Supported: ${SITE_LOCALES.map((l) => `'${l}' (${LOCALE_NAMES[l]})`).join(", ")}. This does not change what language the model replies in — only the text rendered inside widget cards. Until one is set, widgets follow the host's language where it reports one, otherwise English.`,
            annotations: {
                title: "Set Language",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                locale: z
                    .string()
                    .describe(
                        `One of: ${SITE_LOCALES.join(", ")} (ISO 639-1 code).`,
                    ),
            }),
        },
        async ({ locale }) => {
            return withAnalytics(
                "set_language",
                async () => {
                    if (!SITE_LOCALES.includes(locale as SiteLocale)) {
                        throw new ToolError(
                            `Unsupported language: ${locale}. Use one of: ${SITE_LOCALES.join(", ")}.`,
                        );
                    }
                    await upsertProfile(userId, { locale });
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Widget language set to ${LOCALE_NAMES[locale as SiteLocale]} (${locale}).`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    // The clock is the server's to give, not the user's: a host that keeps the
    // wall time out of the model's context otherwise leaves it with no way to
    // resolve "this morning" except asking or guessing (issue #102).
    // get_profile answers this too, but only a model that already suspects a
    // timezone problem thinks to call it — the tool NAME is the discoverable
    // part, which is why this exists as well as the fuller line above.

    server.registerTool(
        "get_current_time",
        {
            title: "Get Current Time",
            description:
                "Get the current date and time in the user's timezone as saved in this nutrition tracker, plus the UTC instant. Use it to resolve 'today', 'this morning', 'an hour ago' or 'last Monday' into a timestamp for entries logged here, instead of asking the user or guessing. Not needed to log something that is happening now: omit logged_at and the server stamps the current time itself.",
            annotations: {
                title: "Get Current Time",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
        },
        async () => {
            return withAnalytics(
                "get_current_time",
                async () => {
                    const configuredTz = timezoneFromProfile(
                        await getProfile(userId),
                    );
                    const unset =
                        configuredTz !== null
                            ? ""
                            : " No timezone is set for this account, so this is UTC and may not be the user's actual local time — set_timezone sets it.";
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${formatClockLine(configuredTz ?? "UTC")}${unset}`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "delete_account",
        {
            title: "Delete Nutrition Account",
            description:
                "Permanently delete the user's Nutrition MCP account and all data this service stores about them (meals and their ingredients, saved meals and their ingredients, water, active calories, weight, body measurements, goals, settings, exports, usage records, sign-in tokens, and the Apple Health sync connection with its record of values sent). Totals already written to Apple Health stay on the user's iPhone. Irreversible. Always confirm with the user before calling this tool.",
            annotations: {
                title: "Delete Nutrition Account",
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: z.object({
                confirm: z
                    .boolean()
                    .describe(
                        "Must be true to confirm deletion. Always ask the user for explicit confirmation before setting this to true.",
                    ),
            }),
        },
        async ({ confirm }) => {
            return withAnalytics(
                "delete_account",
                async () => {
                    if (!confirm) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: "Account deletion cancelled. No data was removed.",
                                },
                            ],
                        };
                    }
                    await deleteAllUserData(userId);
                    return {
                        content: [
                            {
                                type: "text",
                                text: "Your account and all associated data have been permanently deleted.",
                            },
                        ],
                    };
                },
                // deleteAllUserData wipes tool_analytics before anything else,
                // so the row withAnalytics writes once this handler settles
                // must not carry the id it just erased. Only the cancelled path
                // (nothing deleted) still belongs to the real user.
                {
                    ...analytics,
                    userId: confirm ? DELETED_ACCOUNT_ANALYTICS_ID : userId,
                },
            );
        },
    );
}
