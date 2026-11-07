// Typed UI copy for the signed-in web dashboard (public/dashboard.html and
// public/{locale}/dashboard.html, rendered by scripts/gen-dashboard.ts and
// driven by public/dashboard.js).
//
// UI text only, never model-facing: nothing here reaches a tool description,
// a tool result or SERVER_INSTRUCTIONS. Plain text throughout — the
// generator inlines the locale's whole object into the page as JSON
// (`<script type="application/json" id="dash-strings">`) and dashboard.js
// only ever sets it with textContent, so no field may carry markup or
// entities. `{name}` tokens are filled in by dashboard.js; a translation
// must keep every token verbatim. The few strings nav() needs at
// generation time (the tab labels, "Sign out") are read from here too, by
// scripts/site-partials.ts.
//
// Count-sensitive strings are PluralForms (src/copy/chrome.ts), picked in
// the browser with Intl.PluralRules; only `other` is required.
//
// DASHBOARD is a full Record<SiteLocale, DashboardDoc>, one
// src/copy/dashboard.<locale>.ts per locale, so typecheck refuses a locale
// that forgot the copy. dashboardFor() still falls back to English.
//
// Do not promise anything the server does not do: the dashboard only reads.

import type { SiteLocale } from "../routes.js";
import type { PluralForms } from "./chrome.js";
import { DASHBOARD_DE } from "./dashboard.de.js";
import { DASHBOARD_ES } from "./dashboard.es.js";
import { DASHBOARD_FR } from "./dashboard.fr.js";
import { DASHBOARD_NL } from "./dashboard.nl.js";
import { DASHBOARD_PL } from "./dashboard.pl.js";
import { DASHBOARD_IT } from "./dashboard.it.js";
import { DASHBOARD_UK } from "./dashboard.uk.js";
import { DASHBOARD_JA } from "./dashboard.ja.js";
import { DASHBOARD_TR } from "./dashboard.tr.js";

/** The four client-side views, in tab order. Ids are the URL hash. */
export const DASHBOARD_VIEWS = ["today", "history", "trends", "body"] as const;
export type DashboardView = (typeof DASHBOARD_VIEWS)[number];

/** BODY_MEASUREMENT_KINDS (src/units.ts), keyed for the labels below. */
export type DashboardMeasurementKind =
    | "waist"
    | "hips"
    | "neck"
    | "chest"
    | "shoulders"
    | "upper_arm"
    | "forearm"
    | "thigh"
    | "calf";

export interface DashboardDoc {
    meta: {
        /** `<title>`. */
        title: string;
        description: string;
    };
    /** Shown inside <noscript>: the page is built by dashboard.js. */
    noScript: string;
    tabs: Record<DashboardView, string>;
    /** aria-label on the header tab nav. */
    navAriaLabel: string;
    /** aria-label on the phone page switcher at the top of <main>. */
    pagesAriaLabel: string;
    signOut: string;
    /** Sign-out could not end the session on the server; the page offers
     * error.retry. */
    signOutFailed: string;

    sync: {
        /** Green dot. `{time}` is HH:MM in the user's timezone. */
        updated: string;
        /** Grey dot, while a refresh is in flight. */
        updating: string;
        /** Warn dot, after a failed refresh. */
        offline: string;
        /** Warn dot, when nothing has ever loaded. */
        offlineNever: string;
        /** Grey dot, an account with nothing logged. */
        empty: string;
    };
    error: {
        /** Bold lead-in of the banner after a failed refresh. */
        lead: string;
        /** Bold lead-in when the very first load failed. */
        leadFirst: string;
        /** After a failed refresh with older data still on screen. */
        stale: string;
        /** When the very first load failed. */
        first: string;
        retry: string;
    };
    /** Visually hidden, while a view's skeleton shows. */
    loading: string;

    today: {
        /** aria-label on the header section. */
        dateAriaLabel: string;
        titleToday: string;
        titleYesterday: string;
        prevDay: string;
        nextDay: string;
        /** aria-label of the date button. */
        pickDate: string;
        /** Visible label of the date button. */
        calendar: string;
    };
    empty: {
        title: string;
        body: string;
        trySaying: string;
        examples: [string, string, string];
        stepsTitle: string;
        steps: [string, string, string];
        connectCta: string;
    };
    history: {
        rangeAriaLabel: string;
        title: string;
        /** `{logged}` of `{total}` days in the window up to today. */
        loggedPill: PluralForms;
        searchPlaceholder: string;
        searchLabel: string;
        clearSearch: string;
        earlier: string;
        later: string;
        /** `{n}` results for `{q}`. */
        resultsTitle: PluralForms;
        resultsSub: string;
        ingredient: string;
        kcal: string;
        noResults: string;
        tooShort: string;
        searching: string;
        searchFailed: string;
        savedHit: string;
        calendarTitle: string;
        legendOn: string;
        legendUnder: string;
        legendOver: string;
        /** Group label, `{from}` / `{to}` long dates. */
        calendarAriaLabel: string;
        /** Tiny label on today's cell. */
        cellToday: string;
        cellTodaySuffix: string;
        cellNothing: string;
        cellKcal: string;
        summary: string;
        summaryNone: string;
        /** The selected day had nothing logged. */
        dayEmpty: string;
        /** The selected day's widgets could not be loaded. `{date}`. */
        dayFailed: string;
        savedTitle: string;
        /** `{name}` is the first saved meal's name. */
        savedSub: string;
        savedSubNone: string;
        perServing: string;
        protein: string;
        carbs: string;
        fat: string;
        items: PluralForms;
        savedNone: string;
    };
    trends: {
        eyebrow: string;
        title: string;
    };
    body: {
        eyebrow: string;
        title: string;
        measTitle: string;
        /** `{date}` is the latest measurement's date. */
        measSub: string;
        notMeasured: string;
        /** `{date}` is the earliest first entry. */
        hintCm: string;
        hintIn: string;
        sinceFirst: string;
        firstEntry: string;
        noMeasurements: string;
        /** Tile labels. */
        kinds: Record<DashboardMeasurementKind, string>;
        /** The same names mid-sentence (lower case where the language does). */
        kindsInline: Record<DashboardMeasurementKind, string>;
    };
    /** iframe titles, read by screen readers. */
    widgets: {
        summary: string;
        digest: string;
        goals: string;
        weight: string;
        trends: string;
    };
}

export const DASHBOARD_EN: DashboardDoc = {
    meta: {
        title: "Nutrition MCP — Dashboard",
        description:
            "Your meals, goals, trends and body measurements from Nutrition MCP, on one page.",
    },
    noScript:
        "The dashboard needs JavaScript to load your data. Turn it on and reload the page.",
    tabs: {
        today: "Today",
        history: "History",
        trends: "Trends",
        body: "Body",
    },
    navAriaLabel: "Dashboard",
    pagesAriaLabel: "Dashboard pages",
    signOut: "Sign out",
    signOutFailed:
        "Couldn't sign you out just now, so this browser is still signed in. Try again in a moment.",

    sync: {
        updated: "Updated {time}",
        updating: "Updating…",
        offline: "Offline · last updated {time}",
        offlineNever: "Offline",
        empty: "No entries yet",
    },
    error: {
        lead: "Couldn't refresh.",
        leadFirst: "Couldn't load your data.",
        stale: "You're seeing what was saved at {time}; anything logged since then will appear once we reconnect.",
        first: "Check your connection, then try again.",
        retry: "Try again",
    },
    loading: "Loading your day",

    today: {
        dateAriaLabel: "Date",
        titleToday: "Today",
        titleYesterday: "Yesterday",
        prevDay: "Previous day",
        nextDay: "Next day",
        pickDate: "Pick a date",
        calendar: "Calendar",
    },
    empty: {
        title: "Nothing logged yet",
        body: "Tell your AI assistant what you ate or drank. Each entry shows up here within a minute, with totals, goals and trends.",
        trySaying: "Try saying",
        examples: [
            "“I had two eggs and toast for breakfast”",
            "“Set my calorie goal to 2,200 and protein to 150 g”",
            "“Log 500 ml of water”",
        ],
        stepsTitle: "Not connected yet?",
        steps: [
            "Add Nutrition MCP to Claude, ChatGPT or another MCP client.",
            "Sign in with this same account when it asks.",
            "Log your first meal in chat. This page updates on its own.",
        ],
        connectCta: "How to connect",
    },
    history: {
        rangeAriaLabel: "Range",
        title: "History",
        loggedPill: {
            one: "{logged} of {total} day logged",
            other: "{logged} of {total} days logged",
        },
        searchPlaceholder: "Search meals or ingredients",
        searchLabel: "Search meals and ingredients",
        clearSearch: "Clear search",
        earlier: "Earlier five weeks",
        later: "Later five weeks",
        resultsTitle: {
            one: "{n} meal matches “{q}”",
            other: "{n} meals match “{q}”",
        },
        resultsSub: "Names and ingredients, newest first",
        ingredient: "Ingredient: {item}",
        kcal: "kcal",
        noResults:
            "No meals or ingredients match. Try a shorter word, like “rice”.",
        tooShort: "Type at least two letters to search.",
        searching: "Searching…",
        searchFailed:
            "Search isn't available right now. Try again in a moment.",
        savedHit: "Also a saved meal: {name}, {kcal} kcal per serving",
        calendarTitle: "Calendar",
        legendOn: "On target ±5%",
        legendUnder: "Under",
        legendOver: "Over",
        calendarAriaLabel: "Daily calories, {from} to {to}",
        cellToday: "today",
        cellTodaySuffix: " (today)",
        cellNothing: ", nothing logged",
        cellKcal: ", {kcal} kcal",
        summary:
            "Average {avg} kcal over {n} full days · {on} on target · {over} over · {under} under · {missing} not logged",
        summaryNone: "No full days logged in these five weeks.",
        dayEmpty: "Nothing logged on {date}.",
        dayFailed: "Couldn't load {date}. Try again shortly.",
        savedTitle: "Saved meals",
        savedSub: "Log one by name in chat — “log my {name}”.",
        savedSubNone:
            "Meals you save in chat appear here, ready to log by name.",
        perServing: " kcal / serving",
        protein: "P {g} g",
        carbs: "C {g} g",
        fat: "F {g} g",
        items: { one: "{n} item", other: "{n} items" },
        savedNone: "No saved meals yet.",
    },
    trends: {
        eyebrow: "Calories, macros & nutrients over time",
        title: "Trends",
    },
    body: {
        eyebrow: "Weight & measurements",
        title: "Body",
        measTitle: "Measurements",
        measSub: "Circumferences as you logged them · last {date}",
        notMeasured: "Not measured yet:",
        hintCm: "To add one, tell your assistant “waist 83.5 cm”. Changes are measured from your first entry, {date}. Units can be switched to inches in chat.",
        hintIn: "To add one, tell your assistant “waist 33 in”. Changes are measured from your first entry, {date}. Units can be switched to centimetres in chat.",
        sinceFirst: "{delta} since first",
        firstEntry: "First entry",
        noMeasurements:
            "No body measurements yet. Waist, hips and seven other sites can be tracked in centimetres or inches.",
        kinds: {
            waist: "Waist",
            hips: "Hips",
            neck: "Neck",
            chest: "Chest",
            shoulders: "Shoulders",
            upper_arm: "Upper arm",
            forearm: "Forearm",
            thigh: "Thigh",
            calf: "Calf",
        },
        kindsInline: {
            waist: "waist",
            hips: "hips",
            neck: "neck",
            chest: "chest",
            shoulders: "shoulders",
            upper_arm: "upper arm",
            forearm: "forearm",
            thigh: "thigh",
            calf: "calf",
        },
    },
    widgets: {
        summary: "Nutrition summary",
        digest: "Nutrition digest",
        goals: "Goal progress",
        weight: "Weight trends",
        trends: "Trends",
    },
};

/**
 * Every locale. Each translation lives in its own `dashboard.<locale>.ts`
 * (importing only the type from here, so there is no runtime cycle).
 */
export const DASHBOARD: Record<SiteLocale, DashboardDoc> = {
    en: DASHBOARD_EN,
    de: DASHBOARD_DE,
    es: DASHBOARD_ES,
    fr: DASHBOARD_FR,
    nl: DASHBOARD_NL,
    pl: DASHBOARD_PL,
    it: DASHBOARD_IT,
    uk: DASHBOARD_UK,
    ja: DASHBOARD_JA,
    tr: DASHBOARD_TR,
};

export function dashboardFor(locale: SiteLocale): DashboardDoc {
    return DASHBOARD[locale] ?? DASHBOARD_EN;
}
