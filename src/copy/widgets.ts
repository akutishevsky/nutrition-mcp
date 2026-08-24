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
// This is the pilot locale surface — only nutrition-summary.html and the
// shared macro strip (shared/macros.js) read from it so far. Extending
// another widget template to use WIDGET_STRINGS only needs new keys added
// here (and to every WIDGET_STRINGS_<LOCALE> below); the inlining mechanism
// and locale-resolution bridge are already shared by every widget.
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
