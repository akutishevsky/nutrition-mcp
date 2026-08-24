// Translatable strings for the in-chat MCP widgets (public/widgets/src/) —
// the dashboard/chart cards rendered inside the host's sandboxed iframe.
//
// Unlike every other copy/*.ts file, these strings are not read server-side
// by a page generator: src/widgets.ts inlines WIDGET_STRINGS (see the
// `/*@i18n@*/` marker there) as a plain-data object directly into each
// assembled widget's <script>, and the widget picks its own locale at
// runtime from structuredContent.locale (get_language / set_language) or
// the host's ui/initialize hostContext.locale — see
// public/widgets/src/shared/i18n.js. That inlining is why every value here
// must be plain, JSON-serializable data: no functions. The handful of
// count-sensitive strings (`PluralForms`) are picked at render time via
// `Intl.PluralRules`, a browser built-in, rather than shipping a
// pluralization function through the dictionary.
//
// Every non-dev widget (nutrition-summary, goal-progress, meal-logged,
// trends, weight-trends, import-meals) reads from this, alongside the shared
// macro strip (shared/macros.js). component-gallery is dev-only and unwired
// on purpose (see CLAUDE.md's widget section). Extending a widget template
// to use WIDGET_STRINGS only needs new keys added here (and to every
// WIDGET_STRINGS_<LOCALE> below); the inlining mechanism and
// locale-resolution bridge are already shared by every widget.
//
// One file per locale, like src/copy/chrome.ts, so a single translation pass
// is a self-contained diff instead of one shared file several agents would
// race on.

import type { SiteLocale } from "../routes.js";
import { WIDGET_STRINGS_DE } from "./widgets.de.js";
import { WIDGET_STRINGS_ES } from "./widgets.es.js";
import { WIDGET_STRINGS_FR } from "./widgets.fr.js";
import { WIDGET_STRINGS_NL } from "./widgets.nl.js";
import { WIDGET_STRINGS_PL } from "./widgets.pl.js";
import { WIDGET_STRINGS_IT } from "./widgets.it.js";
import { WIDGET_STRINGS_UK } from "./widgets.uk.js";
import { WIDGET_STRINGS_JA } from "./widgets.ja.js";

/** A count-sensitive string, selected at render time via Intl.PluralRules.
 * Only "one"/"other" are carried (not "few"/"many"/"zero"): the widget's
 * pluralize() helper falls back to "other" for any category this 2-form
 * data doesn't have. A pragmatic simplification, consistent with the rest of
 * this codebase's translations being AI-generated with no human review pass
 * — see the TRANSLATION_NOTICE in src/routes.ts. Every form still receives
 * the actual {n}, so the number itself is always correct even where the
 * grammatical form is approximate. */
export interface PluralForms {
    one: string;
    other: string;
}

export interface WidgetStrings {
    /** shared/macros.js — the macro strip every widget embeds. */
    macros: {
        labels: {
            calories: string;
            protein_g: string;
            carbs_g: string;
            fat_g: string;
            sugar_g: string;
            alcohol_g: string;
            caffeine_mg: string;
            fiber_g: string;
            water_ml: string;
        };
        /** A tile/ring with no goal set for that metric. */
        noGoalSet: string;
        /** Exactly at a ceiling (delta === 0). */
        atLimit: string;
        /** The word before a remaining amount on a FLOOR target, e.g. "20 g left". */
        floorUnder: string;
        /** The word before a remaining amount on a CEILING target, e.g. "20 g under". */
        ceilingUnder: string;
        /** The word after an amount past a target, e.g. "20 g over". */
        over: string;
        /** Prefix before a ceiling's figure, e.g. "limit 400 mg". */
        limitPrefix: string;
        /** Prefix before a floor's figure, e.g. "of 160 g". */
        ofPrefix: string;
        drinkLabels: { us: string; uk: string };
        /** A limit metric with nothing recorded at all. */
        noneLogged: string;
        /** Hint line under an interactive strip. */
        tapHint: string;
        /** Appended sentence in an interactive tile's aria-label, e.g.
         * "Protein 120 g, of 160 g · 40 g left. Show the meals that
         * contributed." */
        showMealsContributed: string;
        /** Template for the breakdown panel's title. Placeholder: {label}. */
        byMealTitle: string;
        /** aria-label on the breakdown panel's close button. */
        closeBreakdown: string;
        /** Empty state inside a breakdown panel. Placeholder: {label}. */
        noMealsContributed: string;
        /** Fallback name for a meal with no description. */
        untitledMeal: string;
        /** The "+ N more" line at the end of a capped meal list. Placeholder: {n}. */
        moreMeals: PluralForms;
    };

    /** templates/nutrition-summary.html's own top matter. */
    nutritionSummary: {
        /** Panel header. */
        title: string;
        loading: string;
        /** Shown when the range has no meals or water logged. */
        empty: string;
        /** Trend chart title. */
        caloriesPerDay: string;
        /** Trend chart caption prefix, e.g. "avg 2,035". */
        avg: string;
        /** Trend chart caption prefix, e.g. "goal 2,200". */
        goal: string;
        /** calLabel for a multi-day range. */
        dailyAvgLoggedDays: string;
        /** calLabel for a single-day range. */
        total: string;
        /** "N day(s) logged", no wider window known. Placeholder: {n}. */
        daysLogged: PluralForms;
        /** "{logged} of {span} days logged", when days_in_range is wider. */
        daysOfLogged: string;
        /** Jan..Dec, in that order. */
        months: readonly [
            string,
            string,
            string,
            string,
            string,
            string,
            string,
            string,
            string,
            string,
            string,
            string,
        ];
    };

    /** templates/goal-progress.html's own top matter (the weight row; the
     * strip above it is shared/macros.js). */
    goalProgress: {
        title: string;
        /** No data at all for the requested date. */
        empty: string;
        /** Template. Placeholder: {date}. */
        nothingLoggedFor: string;
        /** Fallback when the date itself failed to format. */
        thisDay: string;
        mealsCount: PluralForms;
        /** Count of water entries — deliberately "N water(s)", matching the
         * source string's own count-the-entries phrasing. */
        waterCount: PluralForms;
        weightLabel: string;
        weightNoneNoTarget: string;
        /** Template. Placeholder: {target} (pre-formatted with its unit). */
        weightNoneWithTarget: string;
        /** Template. Placeholder: {reading} (pre-formatted "78.4 kg (9 Jul)"). */
        weightNoGoal: string;
        atTarget: string;
        /** Template. Placeholder: {amount} (pre-formatted with its unit). */
        toLose: string;
        /** Template. Placeholder: {amount} (pre-formatted with its unit). */
        toGain: string;
        /** Template. Placeholder: {date}. */
        lastLogged: string;
        /** Template for the weight track's aria-label. Placeholders: {current},
         * {target}, {state}, {metaSuffix} (all pre-formatted/pre-translated). */
        weightAria: string;
    };

    /** templates/meal-logged.html's own top matter (the header line; the
     * strip below it is shared/macros.js). Shared by log_meal and
     * update_meal — only `action` picks titleLogged vs titleUpdated. */
    mealLogged: {
        titleLogged: string;
        titleUpdated: string;
        /** Template. Placeholder: {kcal} (pre-formatted). */
        addedKcal: string;
    };

    /** templates/trends.html's own top matter (the toggle header and chart;
     * the strip below is shared/macros.js). */
    trends: {
        title: string;
        empty: string;
        /** The word after a floor-metric AVERAGE that fell short of its target, e.g. "124 kcal under". Distinct from macros.floorUnder (live "still left to eat today" framing, wrong for a historical average) and macros.ceilingUnder (safety-margin-before-a-limit framing in several locales, wrong for a shortfall). */
        avgUnder: string;
        /** Template for the calories chart's caption. Placeholders: {logged},
         * {total}. */
        loggedOfTotal: string;
        /** Template for the calories chart's aria-label. Placeholder: {range}. */
        caloriesOverRange: string;
        /** aria-label on the 7/14/30-day segmented control. */
        windowAriaLabel: string;
        /** Template for a range button's aria-label. Placeholder: {n}. */
        rangeDaysAriaLabel: string;
        /** Template for the strip's calorie caption. Placeholder: {range}. */
        avgAllDays: string;
    };

    /** templates/weight-trends.html's own top matter. No macro strip here. */
    weightTrends: {
        title: string;
        empty: string;
        /** A selected range with no weigh-ins in it. Placeholder: {range}. */
        rangeEmpty: string;
        /** aria-label on the 7/14/30-day segmented control. */
        windowAriaLabel: string;
        /** Template for a range button's aria-label. Placeholder: {n}. */
        rangeAriaLabel: string;
        /** Template for the chart's aria-label. Placeholders: {from}, {to},
         * {latest} (pre-formatted with unit). */
        chartAriaLabel: string;
        latest: string;
        /** Fewer than 2 weigh-ins in the selected range. */
        needTwo: string;
        /** Template. Placeholders: {change} (pre-formatted with unit), {date}. */
        sinceDate: string;
        weighIns: PluralForms;
        atTarget: string;
        /** Template. Placeholder: {amount} (pre-formatted with its unit). */
        toLose: string;
        /** Template. Placeholder: {amount} (pre-formatted with its unit). */
        toGain: string;
        /** Template. Placeholder: {value} (pre-formatted with its unit). */
        target: string;
        noTarget: string;
    };

    /** templates/import-meals.html's own strings — the file/map/preview/import
     * flow. Three deliberate exclusions, not a gap: FIELDS/ALIASES
     * column-matching data (matched against source-file headers, never shown
     * as prose); diagnosticsBlock()'s copy-paste support-email dump
     * (addressed to the English-speaking maintainer, not the widget's
     * audience); and api.updateModelContext's finished-import summary, which
     * is model-facing text like every tool's `content`, not UI. */
    importMeals: {
        stepFile: string;
        stepMap: string;
        stepPreview: string;
        stepImport: string;
        /** Labels for the column-mapping UI, keyed exactly like FIELDS[].key
         * in import-meals.html — every key here must have a match there. */
        fieldLabels: {
            logged_at: string;
            description: string;
            meal_type: string;
            calories: string;
            protein_g: string;
            carbs_g: string;
            fat_g: string;
            fiber_g: string;
            sugar_g: string;
            alcohol_g: string;
            caffeine_mg: string;
            notes: string;
            time: string;
            deleted: string;
            source_id: string;
            timezone: string;
        };
        chooseExportHeading: string;
        noToolsWarning: string;
        /** Template. Placeholder: {email}. */
        emailFallback: string;
        tzWarning: string;
        dropChoose: string;
        dropOr: string;
        recognizedHint: string;
        dateMapHint: string;
        dateNoneHint: string;
        /** Template. Placeholders: {raw}, {format}. */
        dateUnreadable: string;
        /** Template. Placeholders: {raw}, {result}. */
        dateConverted: string;
        energyMapHint: string;
        energyNoneHint: string;
        /** Template. Placeholders: {v}, {kcal}. */
        energyConverted: string;
        /** Template. Placeholder: {v}. */
        energyNoConversion: string;
        dateAmbiguousWarning: string;
        dateFormatLabel: string;
        dateFormatYmd: string;
        dateFormatDmy: string;
        dateFormatMdy: string;
        energyUnitLabel: string;
        energyUnitKcal: string;
        energyUnitKj: string;
        mapColumnsHeading: string;
        rowsCount: PluralForms;
        columnsCount: PluralForms;
        delimiterLabel: string;
        tabLabel: string;
        notInFile: string;
        /** Template. Placeholder: {n}. */
        columnFallback: string;
        /** Template. Placeholder: {column}. */
        addedSugarNotice: string;
        /** Template. Placeholder: {column}. */
        caffeineGramsNotice: string;
        /** Template. Placeholder: {column}. */
        alcoholNotice: string;
        /** Template. Placeholder: {sample}. */
        sampleValue: string;
        sourceAppLabel: string;
        sourceAppHint: string;
        previewButton: string;
        chooseAnotherButton: string;
        previewHeading: string;
        mealsToImport: PluralForms;
        /** Template. Placeholder: {kcal}. */
        kcalTotal: string;
        /** Template. Placeholder: {n}. */
        rowsSkipped: string;
        batchCount: PluralForms;
        /** Template. Placeholders: {format}, {conversion}. */
        datesReadAs: string;
        energyConvertedNote: string;
        energyReadAsKcal: string;
        /** Template. Placeholders: {n}, {format}, {sample}. */
        badDatesWarning: string;
        /** Template. Placeholders: {line}, {value}. */
        badDateSample: string;
        /** Template. Placeholder: {n}. */
        noTimeWarning: string;
        /** "N date(s) have [too many meals]" — count of dates that had to be
         * split across import batches. Placeholder: {n}. */
        splitDatesCount: PluralForms;
        /** Template. Placeholders: {max}, {date}. */
        splitDatesWarning: string;
        tableLine: string;
        tableWhen: string;
        tableMeal: string;
        tableFood: string;
        tableProblem: string;
        noNameFallback: string;
        /** Template. Placeholders: {shown}, {total}. */
        showingRows: string;
        /** Template. Placeholder: {n}. */
        checkingRows: string;
        /** Template. Placeholder: {n}. */
        importingRows: string;
        /** Template. Placeholders: {label}, {done}, {total}. */
        batchProgress: string;
        /** Template. Placeholders: {a}, {b}, {msg}. */
        rowsRange: string;
        preflightFailed: string;
        /** Template. Placeholders: {n}, {line}, {message}. */
        rowsWouldFail: string;
        importingEllipsis: string;
        /** Template. Placeholder: {n}. */
        importButton: string;
        backToMapping: string;
        importCompleteHeading: string;
        /** Template. Placeholder: {n}. */
        resultMealsImported: string;
        /** Template. Placeholder: {n}. */
        resultAlreadyLogged: string;
        /** Template. Placeholder: {n}. */
        resultFailed: string;
        /** Template. Placeholder: {n}. */
        resultSkipped: string;
        restartButton: string;
        /** Template. Placeholder: {msg}. */
        couldNotReadFile: string;
        noDataRows: string;
        /** Template. Placeholder: {email}. */
        emailNotice: string;
    };
}

export const WIDGET_STRINGS_EN: WidgetStrings = {
    macros: {
        labels: {
            calories: "Calories",
            protein_g: "Protein",
            carbs_g: "Carbs",
            fat_g: "Fat",
            sugar_g: "Sugar",
            alcohol_g: "Alcohol",
            caffeine_mg: "Caffeine",
            fiber_g: "Fiber",
            water_ml: "Water",
        },
        noGoalSet: "no goal set",
        atLimit: "at limit",
        floorUnder: "left",
        ceilingUnder: "under",
        over: "over",
        limitPrefix: "limit",
        ofPrefix: "of",
        drinkLabels: { us: "US drinks", uk: "UK units" },
        noneLogged: "none logged",
        tapHint: "Tap a metric for the meals behind it",
        showMealsContributed: "Show the meals that contributed.",
        byMealTitle: "{label} by meal",
        closeBreakdown: "Close breakdown",
        noMealsContributed: "No logged meals contributed {label}.",
        untitledMeal: "Untitled meal",
        moreMeals: {
            one: "+ {n} smaller meal",
            other: "+ {n} smaller meals",
        },
    },
    nutritionSummary: {
        title: "Nutrition summary",
        loading: "Loading your nutrition summary…",
        empty: "No meals or water logged in this range.",
        caloriesPerDay: "Calories / day",
        avg: "avg",
        goal: "goal",
        dailyAvgLoggedDays: "Daily avg · logged days",
        total: "Total",
        daysLogged: {
            one: "{n} day logged",
            other: "{n} days logged",
        },
        daysOfLogged: "{logged} of {span} days logged",
        months: [
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
        ],
    },
    goalProgress: {
        title: "Goal progress",
        empty: "No goal progress to show.",
        nothingLoggedFor: "Nothing logged yet for {date}.",
        thisDay: "this day",
        mealsCount: { one: "{n} meal", other: "{n} meals" },
        waterCount: { one: "{n} water", other: "{n} waters" },
        weightLabel: "Weight",
        weightNoneNoTarget:
            "No weight logged yet. Log one with log_weight to track progress.",
        weightNoneWithTarget:
            "No weight logged yet. Log one with log_weight to track progress toward your {target} target.",
        weightNoGoal:
            "Weight {reading} — no goal set. Set one with set_nutrition_goals to see progress here.",
        atTarget: "at target",
        toLose: "{amount} to lose",
        toGain: "{amount} to gain",
        lastLogged: "last logged {date}",
        weightAria: "Weight {current}, target {target}, {state}{metaSuffix}",
    },
    mealLogged: {
        titleLogged: "Meal logged",
        titleUpdated: "Meal updated",
        addedKcal: "+{kcal} kcal",
    },
    trends: {
        title: "Trends",
        empty: "No meals or water logged in this range yet.",
        avgUnder: "under",
        loggedOfTotal: "{logged}/{total} days logged",
        caloriesOverRange: "Calories per day over the last {range} days",
        windowAriaLabel: "Trend window",
        rangeDaysAriaLabel: "{n} days",
        avgAllDays: "{range}-day avg · all days",
    },
    weightTrends: {
        title: "Weight",
        empty: "No weight logged in this range yet.",
        rangeEmpty: "No weigh-ins in the last {range} days. Try a wider range.",
        windowAriaLabel: "Trend window",
        rangeAriaLabel: "Last {n} days",
        chartAriaLabel: "Weight from {from} to {to}, latest {latest}",
        latest: "Latest",
        needTwo: "need 2+ weigh-ins",
        sinceDate: "{change} since {date}",
        weighIns: { one: "{n} weigh-in", other: "{n} weigh-ins" },
        atTarget: "at target",
        toLose: "{amount} to lose",
        toGain: "{amount} to gain",
        target: "Target {value}",
        noTarget: "No target set",
    },
    importMeals: {
        stepFile: "File",
        stepMap: "Map columns",
        stepPreview: "Preview",
        stepImport: "Import",
        fieldLabels: {
            logged_at: "Date / time",
            description: "Food name",
            meal_type: "Meal",
            calories: "Calories",
            protein_g: "Protein (g)",
            carbs_g: "Carbs (g)",
            fat_g: "Fat (g)",
            fiber_g: "Fiber (g)",
            sugar_g: "Sugar, total (g)",
            alcohol_g: "Alcohol (g)",
            caffeine_mg: "Caffeine (mg)",
            notes: "Notes",
            time: "Time (separate column)",
            deleted: "Deleted flag",
            source_id: "Meal id (from our export)",
            timezone: "Timezone (from our export)",
        },
        chooseExportHeading: "Choose your export",
        noToolsWarning:
            "This host does not let this view write to your log. Ask Claude to import the file instead — it can do it directly.",
        emailFallback: "If asking Claude does not work either, email {email}.",
        tzWarning:
            "Your timezone is not set, so times will be read as UTC and may land on the wrong day. Ask Claude to set your timezone first.",
        dropChoose: "Choose a CSV file",
        dropOr: "or drag it here",
        recognizedHint:
            "Exports from MyFitnessPal, Cronometer, Lose It! and MacroFactor are recognised automatically. Nothing is saved until you confirm.",
        dateMapHint:
            "Map a date column above to see how a value from your file converts.",
        dateNoneHint: "That column has no dates in it.",
        dateUnreadable:
            "{raw} → cannot be read as {format}, so rows like it will be skipped",
        dateConverted: "{raw} → {result}",
        energyMapHint:
            "Map a calories column above to see how a value from your file converts.",
        energyNoneHint: "That column has no numbers in it.",
        energyConverted: "{v} kJ → {kcal} kcal",
        energyNoConversion: "{v} kcal → {v} kcal (no conversion)",
        dateAmbiguousWarning:
            "The date format could not be determined from this file — its dates read equally well as day-first or month-first. Please confirm which one your app exports: the wrong choice files meals on the wrong day with no error.",
        dateFormatLabel: "Date format in this file",
        dateFormatYmd: "Year-Month-Day",
        dateFormatDmy: "Day/Month/Year",
        dateFormatMdy: "Month/Day/Year",
        energyUnitLabel: "Energy unit of the calories column",
        energyUnitKcal: "Calories",
        energyUnitKj: "Kilojoules",
        mapColumnsHeading: "Map columns",
        rowsCount: { one: "{n} row", other: "{n} rows" },
        columnsCount: { one: "{n} column", other: "{n} columns" },
        delimiterLabel: "delimiter",
        tabLabel: "tab",
        notInFile: "(not in this file)",
        columnFallback: "column {n}",
        addedSugarNotice:
            "This file has an added-sugar column ({column}) but no total-sugar column, so Sugar was left unmapped. Sugar is stored as TOTAL sugars, including what occurs naturally in fruit and milk, so mapping added sugar into it would under-report every row.",
        caffeineGramsNotice:
            "This file's caffeine column ({column}) is in grams, but caffeine is stored in milligrams, so Caffeine was left unmapped. Mapping it would record 0.18 where the label says 180 mg. Re-importing the same file later will not fill it in — those rows will already be logged and will be skipped as duplicates. If the header is mislabelled and the values really are milligrams, pick it above; if they really are grams, multiply them by 1000 in the file before importing, not after.",
        alcoholNotice:
            "This file has an alcohol column ({column}), but alcohol tracking is off for this account, so it will not be imported. Re-importing the same file later will not fill it in — those rows will already be logged and will be skipped as duplicates. To keep this data, ask Claude to turn on alcohol tracking (set_alcohol_tracking) before importing.",
        sampleValue: "e.g. {sample}",
        sourceAppLabel: "Source app (optional)",
        sourceAppHint:
            "Used to label rows that have no food name of their own.",
        previewButton: "Preview import",
        chooseAnotherButton: "Choose another file",
        previewHeading: "Preview",
        mealsToImport: {
            one: "{n} meal to import",
            other: "{n} meals to import",
        },
        kcalTotal: "{kcal} kcal total",
        rowsSkipped: "{n} rows skipped",
        batchCount: { one: "{n} batch", other: "{n} batches" },
        datesReadAs: "Dates read as {format}; energy {conversion}.",
        energyConvertedNote: "converted from kJ to kcal",
        energyReadAsKcal: "read as kcal",
        badDatesWarning:
            "{n} row(s) were skipped because their date could not be read as {format}{sample}. Go back and set the date format that matches your file.",
        badDateSample: " (e.g. line {line}: {value})",
        noTimeWarning:
            "{n} row(s) have a date but no time — they will be logged at midday.",
        splitDatesCount: {
            one: "{n} date has",
            other: "{n} dates have",
        },
        splitDatesWarning:
            " more than {max} meals (e.g. {date}) and had to be split across separate import batches. If that date contains two entries with the exact same food, meal type and macros, one of them may be skipped as a duplicate instead of imported.",
        tableLine: "Line",
        tableWhen: "When",
        tableMeal: "Meal",
        tableFood: "Food",
        tableProblem: "Problem",
        noNameFallback: "(no name — will be labelled by meal)",
        showingRows: "Showing {shown} of {total} rows",
        checkingRows: "Checking {n} rows…",
        importingRows: "Importing {n} rows…",
        batchProgress: "{label} (batch {done} of {total})",
        rowsRange: "Rows {a}–{b}: {msg}",
        preflightFailed: "Preflight check failed.",
        rowsWouldFail: "{n} row(s) would fail, e.g. line {line}: {message}",
        importingEllipsis: "Importing…",
        importButton: "Import {n} meals",
        backToMapping: "Back to mapping",
        importCompleteHeading: "Import complete",
        resultMealsImported: "{n} meals imported",
        resultAlreadyLogged: ", {n} already logged",
        resultFailed: ", {n} failed",
        resultSkipped: ", {n} skipped",
        restartButton: "Import another file",
        couldNotReadFile: "Could not read that file: {msg}",
        noDataRows: "No data rows found in that file.",
        emailNotice:
            "Not working as expected? Email {email} and include the lines below — that is everything needed to diagnose it.",
    },
};

export const WIDGET_STRINGS: Partial<Record<SiteLocale, WidgetStrings>> = {
    en: WIDGET_STRINGS_EN,
    de: WIDGET_STRINGS_DE,
    es: WIDGET_STRINGS_ES,
    fr: WIDGET_STRINGS_FR,
    nl: WIDGET_STRINGS_NL,
    pl: WIDGET_STRINGS_PL,
    it: WIDGET_STRINGS_IT,
    uk: WIDGET_STRINGS_UK,
    ja: WIDGET_STRINGS_JA,
};

export function widgetStringsFor(locale: SiteLocale): WidgetStrings {
    return WIDGET_STRINGS[locale] ?? WIDGET_STRINGS_EN;
}
