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
import { WIDGET_STRINGS_TR } from "./widgets.tr.js";

/** A count-sensitive string, selected at render time via Intl.PluralRules.
 * "one"/"other" are always carried; "few"/"many" are carried by Polish and
 * Ukrainian, whose integers land in one/few/many (never "other", which CLDR
 * keeps for fractions there). Their "other" repeats "many", because plural()
 * also falls back to "other" when Intl.PluralRules is unavailable, and the
 * genitive plural is the safest single form. plural() falls back to "other"
 * for any category a value doesn't have. A pragmatic simplification, consistent with the rest of
 * this codebase's translations being AI-generated with no human review pass
 * — see the TRANSLATION_NOTICE in src/routes.ts. Every form still receives
 * the actual {n}, so the number itself is always correct even where the
 * grammatical form is approximate. */
export interface PluralForms {
    one: string;
    other: string;
    /** Optional CLDR categories for languages that need them — Polish and
     *  Ukrainian put 2–4 in "few" ("3 posiłki", "3 страви"), which "other"
     *  (their 5+ genitive) gets wrong. plural() uses a category when present
     *  and falls back to "other" otherwise. */
    few?: string;
    many?: string;
}

/** One string per goal-progress metric (templates/goal-progress.html). */
export interface GoalProgressMetrics {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
    sugar: string;
    added_sugar: string;
    saturated: string;
    trans: string;
    sodium: string;
    caffeine: string;
    alcohol: string;
    water: string;
}

/** The weight-trends widget's range ids (its pills: 7d 30d 90d 1y All). */
export type WeightRangeId = "7" | "30" | "90" | "1y" | "all";

/** How one weight-trends range is named, in each place a range is named. */
export interface WeightRangeCopy {
    /** Pill label, e.g. "30d". */
    label: string;
    /** Pill aria-label, e.g. "Show last 30 days". */
    aria: string;
    /** After "in": "No weigh-ins in the last 30 days". A locale whose
     * preposition changes with the range ("in den letzten 30 Tagen", "im
     * letzten Jahr") carries it here and leaves it out of the templates that
     * use `word` (emptyRange, emptyRangeLast, oneTitle). */
    word: string;
    /** Trailing phrase: "12 weigh-ins in 30 days". */
    inRange: string;
    /** In the measurements heading: "Body measurements · last 30 days". */
    heading: string;
    /** In the change chip: "−1.2 kg · 30 d". */
    chip: string;
}

/** Stored body-measurement kinds (BODY_MEASUREMENT_KINDS in src/units.ts). */
export type WeightMeasurementSite =
    | "waist"
    | "hips"
    | "neck"
    | "chest"
    | "shoulders"
    | "upper_arm"
    | "forearm"
    | "thigh"
    | "calf";

/** Turns the English literal's shape into the type every locale fills: a
 * { one, other } pair becomes PluralForms (so Polish and Ukrainian may add
 * few/many), and every other leaf a plain string. */
type Widen<T> = T extends { one: string; other: string }
    ? PluralForms
    : T extends string
      ? string
      : { [K in keyof T]: Widen<T[K]> };

/**
 * public/widgets/src/templates/digest.html — the get_digest card. The server
 * sends codes and numbers (DigestMeta, src/digest.ts) and the widget builds
 * every sentence from these strings. Conventions: `{placeholders}` are filled
 * by tpl()/plural(); `{list}` is an Intl.ListFormat conjunction of `inline`
 * labels; `{x}`, `{g}`, `{v}` are already-formatted amounts with their unit;
 * strings ending or starting with a space or " — " are fragments joined to a
 * bold middle part, so keep that spacing. Arrows and emoji are not
 * translated. `labels` are sentence-start names, `inline` the same names as
 * they read mid-sentence.
 */
export const DIGEST_STRINGS_EN = {
    loading: "Loading your digest…",
    eyebrow: "Nutrition digest · {range}",
    daySoFar: "{date} · so far, {time}",
    rangeEnds: "{range} · ends yesterday",
    labels: {
        calories: "Calories",
        protein_g: "Protein",
        carbs_g: "Carbs",
        fat_g: "Fat",
        fiber_g: "Fiber",
        sugar_g: "Sugar",
        added_sugar_g: "Added sugar",
        saturated_fat_g: "Saturated fat",
        trans_fat_g: "Trans fat",
        sodium_mg: "Sodium",
        caffeine_mg: "Caffeine",
        alcohol_g: "Alcohol",
        water_ml: "Water",
        weight: "Weight",
    },
    inline: {
        calories: "calories",
        protein_g: "protein",
        carbs_g: "carbs",
        fat_g: "fat",
        fiber_g: "fiber",
        sugar_g: "sugar",
        added_sugar_g: "added sugar",
        saturated_fat_g: "saturated fat",
        trans_fat_g: "trans fat",
        sodium_mg: "sodium",
        caffeine_mg: "caffeine",
        alcohol_g: "alcohol",
        water_ml: "water",
        weight: "weight",
    },
    units: {
        kcal: "kcal",
        g: "g",
        mg: "mg",
        L: "L",
        kg: "kg",
        lb: "lb",
    },
    drinkLabels: { us: "US drinks", uk: "UK units" },
    sep: " · ",
    verdict: {
        calOverPast: "calories went over",
        calOverToday: "calories over budget",
        calOnTrack: "calories on track",
        calOnTarget: "calories on target",
        calJustUnder: "calories just under target",
        calUnder: "calories under target",
        calMostly: "calories mostly on target",
        calOverMost: "calories over most days",
        calUnderMost: "calories under target most days",
        calSome: "calories on target some days",
        overPast: "{list} went over",
        overToday: "{list} over",
        limitsOver: { one: "{n} limit over", other: "{n} limits over" },
        shortPast: "{list} fell short",
        shortToday: "{list} to go",
        targetsShortPast: {
            one: "{n} target fell short",
            other: "{n} targets fell short",
        },
        targetsShortToday: {
            one: "{n} target to go",
            other: "{n} targets to go",
        },
        allMetPast: "every goal met",
        allMetToday: "every goal on track",
        rising: "{label} rising",
        falling: "{label} falling",
        logged: "logged {n} of {of} days",
        missTarget: "{label} short most days",
        missLimit: "{label} often over",
        noMiss: "no goal missed most days",
    },
    emptyTitle: {
        today: "Nothing logged today yet",
        yesterday: "Nothing was logged yesterday",
        range: "Nothing logged in the last {n} days",
    },
    emptyText: {
        today: "Meals, water and weigh-ins you log today show up here, with goals and trends.",
        day: "Meals, water and weigh-ins you log for a day show up here, with goals and trends.",
        range: "Meals, water and weigh-ins you log over a period show up here, with goals and trends.",
    },
    intakeDay: "{kcal} kcal · {meals}",
    intakeRange: "{kcal} kcal a day · logged {n} of {of} days",
    mealCount: { one: "{n} meal", other: "{n} meals" },
    noGoals: "No goals set",
    // When a host drops `_meta`: only the frozen averages and goals are known.
    averagesOnly: "Only the averages and goals are available in this view.",
    score: {
        met: "{n} of {of} goals met",
        onTrack: "{n} of {of} goals on track",
        mostly: "{n} of {of} goals mostly met",
        partial: "{score} · partial logs",
    },
    sections: {
        calories: "Calories",
        goals: "Goals at a glance",
        trends: "Trends",
        nutrients: "Nutrients",
        cards: "Water & weight",
        cardsHidden: "Water and weight",
        meals: "Meals",
        highlights: "Highlights",
        rest: "For the rest of today",
    },
    meta: {
        final: "final",
        soFar: "so far",
        rightNow: "right now",
        daysMet: "days met / logged",
        dailyAvg: "Daily average, logged days",
        dayTotal: "Day total",
        soFarToday: "So far today",
        tapMeal: "tap a meal for items",
        habits: "logging habits",
        last14: "last 14 days",
        last14Today: "last 14 days · today so far",
        fewDays: "few days logged · read loosely",
        vsPrev: "vs previous {n} days (grey)",
        waterAvg: "water: daily avg",
    },
    fold: "Fold {section}",
    unfold: "Unfold {section}",
    showMore: "Show more",
    showLess: "Show less",
    collapseAll: "Collapse all",
    gauge: {
        ofGoal: "of {goal} kcal",
        kcal: "kcal",
        aria: "{kcal} of {goal} kcal {when}, {pct}% of goal.",
        ariaNoGoal: "{kcal} kcal {when}.",
        onDate: "on {date}",
        soFarToday: "so far today",
        ariaMeals: "Meals: {list}",
        ariaMeal: "{name} {kcal} kcal",
        segment: "{name}, {kcal} kcal",
        finished: "You finished {b} your goal",
        kcalUnder: "{x} kcal under",
        kcalOver: "{x} kcal over",
        kcalLeft: "{x} kcal left",
        todayLine: "{b} · {meals} so far",
        mealsOnly: "{meals}",
        hint: "Tap a meal piece for details",
        popMeta: "{meta} · {pct}% of the day’s goal",
        popMetaNoGoal: "{meta}",
        totalOnly: "Logged as a total, no items",
        closeMeal: "Close meal details",
    },
    range: {
        avg: "avg",
        kcalDay: "kcal/day",
        rightOn: "right on your {goal} kcal goal",
        overGoal: "{x} kcal over your {goal} kcal goal",
        underGoal: "{x} kcal under your {goal} kcal goal",
        footMet: "{met} of {n}",
        footRest: "logged days on target",
        footOver: "{n} over",
        footUnder: "{n} under",
        legendOn: "on target",
        legendUnder: "under",
        legendOver: "over",
        zone: "Target zone {lo}–{hi} kcal",
        prev: "Previous {n} days: {avg} kcal/day",
        barNone: "{date}: nothing logged",
        barOver: "{date}: {kcal} kcal, over goal",
        barOn: "{date}: {kcal} kcal, on target",
        barUnder: "{date}: {kcal} kcal, under target",
        barPlain: "{date}: {kcal} kcal",
        popSub: "{kcal} kcal · {meals}",
        popOver: "{x} over",
        nothingThisDay: "Nothing logged this day",
        closeDay: "Close day details",
    },
    groups: {
        over: "Over",
        near: "Near limit",
        short: "Short",
        togo: "To go",
        met: "Met",
        onTrack: "On track",
        mostlyMet: "Mostly met",
        mixed: "Mixed",
        mostlyMissed: "Mostly missed",
        days: { one: "day", other: "days" },
        nrDay: {
            one: "{list} wasn’t recorded — left out of the goals.",
            other: "{list} weren’t recorded — left out of the goals.",
        },
        nrRange: {
            one: "{list} wasn’t recorded on any day — left out of the goals.",
            other: "{list} weren’t recorded on any day — left out of the goals.",
        },
    },
    trends: {
        rising: "↑ rising",
        falling: "↓ falling",
        noClear: "→ no clear trend",
        steady: "→ steady",
        avg7: "7-day avg {a}, was {b}",
        todaySoFar: "Today so far {v}",
        noneToday: "None so far today",
        nothingToday: "Nothing logged yet today",
        dayAboutAvg: "Yesterday ≈ avg",
        dayVsAvg: "Yesterday {pct}% vs avg",
        noneDay: "None yesterday",
        notLoggedDay: "Not logged yesterday",
        perDay: "{d} a day",
        was: "was {b} a day",
        wasAvg: "was {b} avg",
        steadyNote: "Steady: {list}.",
        alsoNote: "Also moving: {list}.",
        mixedNote: "Up and down, no clear trend: {list}.",
        fewNote: "Too few logged days to tell: {list}.",
        none: "Not enough logged days yet to show trends.",
        aria: "{label}: {dir}, {l1}, {l2}",
        dirWord: {
            rising: "rising",
            falling: "falling",
            noClear: "no clear trend",
            steady: "steady",
        },
    },
    table: {
        noGoal: "no goal",
        notRecorded: "not recorded",
        notLogged: "not logged",
        over: "+{x} over",
        short: "{x} short",
        togo: "{x} to go",
        met: "met",
        done: "done",
        none: "none",
        under: "{x} under",
        left: "{x} left",
        onTarget: "on target",
        nearLimit: "near limit",
        atLimit: "at limit",
        target: "/ ≥ {g}",
        limit: "/ ≤ {g}",
        noGoalUnit: "{u} · no goal",
        sparse: "Only {n} of {of} days logged — averages cover logged days only.",
        partial: "Recorded on fewer days: {list}.",
        partialItem: "{label} {n} of {of}",
        ariaTarget: "{label}: {value}, target {goal}, {delta}",
        ariaLimit: "{label}: {value}, limit {goal}, {delta}",
        ariaPlain: "{label}: {value}",
    },
    water: {
        of: "of {goal}",
        aDay: "a day",
        metDays: "goal met {n} of {of} days",
        noneToday: "No water logged yet today",
        noneDay: "No water logged that day",
        noneRange: "No water logged in this period",
        dot: "{date}: {v}",
    },
    weight: {
        thisMorning: "Weighed in this morning",
        thatMorning: "Weighed in that day",
        last: "Last weigh-in {date}",
        noChange: "no change",
        vs: "vs {date}",
        first: "first weigh-in",
        latest: "Latest · {date}",
        since: {
            one: "since {date} · {n} weigh‑in",
            other: "since {date} · {n} weigh‑ins",
        },
        only1: "only 1 weigh‑in this period",
        goal: "Goal {v}",
        noneRecent: "No recent weigh-in · last {v} on {date}",
        noneYet: "No weigh-ins yet",
        nonePeriod: "No weigh-in this period · last {v} on {date}",
    },
    meals: {
        types: {
            breakfast: "Breakfast",
            lunch: "Lunch",
            dinner: "Dinner",
            snack: "Snack",
            drink: "Drink",
        },
        macro: "{x} {label}",
        totalOnly: "total only",
        daysLogged: "Days logged",
        mealsADay: "Meals a day",
        ofDays: "{n} of {of}",
        typical: "Typical times",
        typicalItem: "{type} {time}",
        topFoods: "Top foods by calories",
        times: "×{n}",
        best: "Best day",
        tough: "Toughest day",
        goalsMet: "{n} of {of} goals met",
        whyOver: "{list} over",
        whyLimits: { one: "{n} limit over", other: "{n} limits over" },
        whyShort: "{list} short",
        whyAll: "every recorded goal met",
    },
    highlights: {
        count: { one: "{n} highlight", other: "{n} highlights" },
        sugarA: "Biggest sugar source: ",
        sugarAToday: "Biggest sugar source so far: ",
        times: " (×{n})",
        sugarDay: " — {g}, {pct}% of the day’s sugar.",
        sugarToday: " — {g}, {pct}% of today’s sugar.",
        sugarRange: " — {g}, {pct}% of the period’s sugar.",
        streakA: "Calories in the target zone ",
        streakB: { one: "{n} day in a row", other: "{n} days in a row" },
        streakToday: " up to yesterday.",
        streakPast: " — the current streak.",
        gapsA: "Gaps in the log: ",
        gapsB: {
            one: "{n} day with nothing logged",
            other: "{n} days with nothing logged",
        },
        gapsC: " — averages cover logged days only.",
        overRange: {
            one: "{label} went over on {n} day",
            other: "{label} went over on {n} days",
        },
        overToday: "{label} is over so far",
        overPast: "{label} went over",
        overEach: " — largest source: {name}, {x} each time (×{n}).",
        overTotal: " — largest source: {name}, {x} in total (×{n}).",
        overOnce: " — largest source: {name}, {x}.",
        shortRange: {
            one: "{label} fell short on {n} day",
            other: "{label} fell short on {n} days",
        },
        shortToday: "{label} is still short",
        shortPast: "{label} fell short",
        shortFood: " — {name}, logged before, has {x} for {kcal} kcal.",
        allMetA: "Nothing missed: ",
        allMetRange: "every goal mostly met",
        allMetPast: "every goal met",
        allMetToday: "every goal on track",
        allMetC: ".",
    },
    rest: {
        kcalLeft: "Calories left",
        kcalOver: "Calories over",
        water: "Water still to drink",
        togo: "{label} still to go",
        foodLabel: "Logged before:",
        food: "{name} — {x} {label}, {kcal} kcal.",
        summary: {
            one: "{n} amount left",
            other: "{n} amounts left",
        },
        reached: "every target reached so far",
    },
    facts: {
        water: "Water {v}",
        waterOf: "Water {v} of {goal}",
        waterDay: "Water {v} a day",
        weight: "{v}",
        weightChg: "{v} ({chg})",
        trend: "{label} {dir}",
        biggest: "Biggest meal: {name}",
    },
    summaries: {
        over: "{n} over",
        near: "{n} near limit",
        short: "{n} short",
        togo: "{n} to go",
        met: "{n} met",
        onTrack: "{n} on track",
        mostlyMet: "{n} mostly met",
        mixed: "{n} mixed",
        mostlyMissed: "{n} mostly missed",
        noGoals: "no goals recorded",
        rising: "{n} rising",
        falling: "{n} falling",
        steady: "{n} steady",
        notEnough: "not enough data",
        metrics: { one: "{n} metric", other: "{n} metrics" },
        water: "Water {v}",
        noWater: "no water",
        weight: "Weight {v}",
        noWeigh: "no weigh-in",
        daysLogged: "{n} of {of} days logged",
        mealSpan: "{meals} · {from}–{to}",
    },
};

export type DigestStrings = Widen<typeof DIGEST_STRINGS_EN>;

export interface WidgetStrings {
    /** shared/macros.js — the macro strip every widget embeds. */
    macros: {
        labels: {
            calories: string;
            protein_g: string;
            carbs_g: string;
            fat_g: string;
            sugar_g: string;
            added_sugar_g: string;
            saturated_fat_g: string;
            trans_fat_g: string;
            alcohol_g: string;
            caffeine_mg: string;
            sodium_mg: string;
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
        /** Unit glyphs the strip prints, keyed by the MACROS entry's unit
         * code (shared/macros.js); "L" is the water line's litres. kg/lb are
         * the weight unit code the weight-trends and goal-progress widgets
         * print beside a body weight (weightUnit() in shared/i18n.js). */
        units: {
            kcal: string;
            g: string;
            mg: string;
            ml: string;
            L: string;
            kg: string;
            lb: string;
        };
        /** A limit metric with nothing recorded at all. */
        noneLogged: string;
        /** The figure of a limit cell with no recorded value against a limit
         * the user set (today only added sugar, whose null means "not
         * recorded", never 0). Distinct from noneLogged, which reads as
         * "nothing was eaten" rather than "the figure is unknown". */
        notRecorded: string;
        /** Default label above the calorie ring/figure when a widget doesn't
         * override it with its own calLabel. nutrition-summary and trends
         * always override; goal-progress and meal-logged rely on this
         * default only when data.date is the viewer's current local day —
         * otherwise they pass caloriesOn instead (#114). */
        caloriesToday: string;
        /** calLabel for a day-scoped widget (goal-progress, meal-logged)
         * showing a date other than the viewer's today. Placeholder: {date}
         * (pre-formatted via shared/date.js's shortDate). */
        caloriesOn: string;
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
        /**
         * The same line when {n} is only a lower bound: the summary's meal
         * list is trimmed server-side and the host dropped the true count
         * (the tool result's `_meta`), so there may be more. Placeholder: {n}.
         */
        moreMealsAtLeast: PluralForms;
        /**
         * The same line with no number at all: the list shows exactly its cap
         * of 8, the meals were trimmed server-side and the host dropped the
         * true count, so there may or may not be more. No placeholder.
         */
        moreMealsMaybe: string;
        /**
         * How many ingredients a meal row in a breakdown holds, read out as
         * the accessible text behind the row's small count badge (the badge
         * itself shows only the number). Placeholder: {n}.
         */
        ingredientCount: PluralForms;
        /** Source tag on a nutrient value (USDA / OFF / yours / est. / mixed) — shared/macros.js. */
        sourceUsda: string;
        sourceOff: string;
        sourceUser: string;
        sourceEst: string;
        sourceMixed: string;
        sourceRecordUsda: string;
        sourceRecordOff: string;
        sourceDataType: string;
        /** aria-label on a source tag; placeholder {source}, the tag's visible text. */
        sourceAria: string;
        /** aria-label on the source tag's reveal button. */
        sourceDetailsAria: string;
    };

    /** shared/bridge.js — text the host bridge itself paints, around
     * every widget rather than inside one. */
    bridge: {
        /** Footer under every painted widget. */
        settingsFooter: string;
        /** On-screen notice when ui/initialize never succeeds. Shown before
         * any payload locale is known, so picked from the browser language. */
        connectFailed: string;
    };

    /** templates/nutrition-summary.html, and the day view both it and
     * meal-logged draw (shared/gauge.js, shared/nutrients.js): the hero, the
     * nutrient rows, their status words and open bodies. meal-logged reads
     * these too; only its own eyebrow and stat labels are in `mealLogged`.
     * `months` is also shared/date.js's (shortDate). */
    nutritionSummary: {
        /** Panel header. */
        title: string;
        loading: string;
        /** Shown when the range has no meals or water logged. */
        empty: string;
        /** Trend chart title. */
        caloriesPerDay: string;
        /** "N day(s) logged", no wider window known. Placeholder: {n}. */
        daysLogged: PluralForms;
        /** "{logged} of {span} days logged", when days_in_range is wider. */
        daysOfLogged: string;
        /** Eyebrow period of a one-day summary of the viewer's today: "Nutrition summary · Today". */
        periodToday: string;
        /** Eyebrow period of a one-day summary of another day. */
        periodPastDay: string;
        /** The pill under the gauge that opens the nutrient rows (shared/gauge.js). */
        showMore: string;
        showLess: string;
        /** Button under the open rows that folds the card back. */
        collapseAll: string;
        /** Under the gauge's figure. Placeholder: {goal} (pre-formatted). */
        ofGoal: string;
        /** The same for a range's daily average. */
        avgOfGoal: string;
        /** Status of a ceiling (or calories) under its goal. Placeholder: {amount}, figure with unit. */
        left: string;
        /** Status past a ceiling. Placeholder: {amount}. */
        over: string;
        /** Status of a floor or target below its goal. Placeholder: {amount}. */
        toGo: string;
        /** Status of a target (protein, carbs, fat) more than 5% above it. Placeholder: {amount}. */
        above: string;
        /** A target within 5% of its goal. */
        onTarget: string;
        /** A floor (fiber, water) reached. */
        goalMet: string;
        /** A ceiling-type nutrient with no limit set (trans fat never has one). */
        noLimit: string;
        /** Alcohol at 0 against its limit. */
        none: string;
        /** A row's figure when no meal recorded the nutrient. */
        notRecorded: string;
        /** Delta line under the gauge. Placeholder: {amount} ("600 kcal"). */
        leftToday: string;
        overToday: string;
        leftThatDay: string;
        overThatDay: string;
        /** A range's daily average below its calorie goal. Placeholder: {amount}. */
        underGoal: string;
        overGoal: string;
        /** A range's highest day. Placeholder: {amount} ("2,410 kcal"). */
        peak: string;
        /** How many meals a day holds. */
        mealsCount: PluralForms;
        /** Under an empty gauge. */
        emptyToday: string;
        emptyThatDay: string;
        emptyRange: string;
        /** Desktop stat labels (uppercase via CSS). */
        statEatenSoFar: string;
        statEaten: string;
        statRemaining: string;
        statOverGoal: string;
        statMeals: string;
        /** Small text after the meal count stat: "5 logged". */
        statLogged: string;
        statAvgDay: string;
        statPeakDay: string;
        statLoggedDays: string;
        /** Small text after the logged-days stat. Placeholder: {n}. */
        statOfDays: string;
        /** aria-label of the gauge. Placeholders: {eaten}, {goal}, {pct}, {status} ("600 kcal left"). */
        gaugeAriaToday: string;
        gaugeAriaThatDay: string;
        gaugeAriaRange: string;
        /** The gauge with no calorie goal set. Placeholder: {eaten}. */
        gaugeAriaNoGoal: string;
        /** Appended to a day's gauge label. Placeholder: {list}, "name 420 kcal, …". */
        gaugeAriaMeals: string;
        /** Title of a range's calories panel (a day's uses macros.byMealTitle). */
        caloriesByDay: string;
        /** The four meal types log_meal offers; any other stored type is shown as typed. */
        mealTypes: {
            breakfast: string;
            lunch: string;
            dinner: string;
            snack: string;
        };
        /** Ingredient count on a meal row's meta line. */
        items: PluralForms;
        /** A meal row's meta line when the meal has no ingredients. */
        totalOnlyShort: string;
        totalOnly: string;
        /** Label on the dashed goal line of the by-day strip. */
        goalLine: string;
        /** Head of an open row in a range. */
        byDay: string;
        /** The same when not every logged day recorded the nutrient. Placeholders: {rec}, {logged}. */
        byDayPartial: string;
        /** Head of an open row on one day. */
        byMealCount: PluralForms;
        /** Appended to that head. */
        notRecordedCount: PluralForms;
        /** An open row with no recorded figure. Placeholder: {label}. */
        notRecordedToday: string;
        notRecordedThatDay: string;
        notRecordedRange: string;
        /** The open water row. Placeholder: {amount} ("1.6 L"). */
        waterToday: string;
        waterThatDay: string;
        waterRange: string;
        /** An open row whose meals carry none of it. Placeholder: {label}. */
        noneInToday: string;
        noneInThatDay: string;
        noneInRange: string;
        /** Sub-label over a range's ranked meal list. */
        topMeals: string;
        /** Label over a range's rows. */
        dailyAverages: PluralForms;
        /** Live-region text when a gauge segment is picked. Placeholder: {tip} ("Oats + Yogurt · 680 kcal"). */
        selected: string;
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

    /** templates/goal-progress.html: the goal-status view (counters, the
     * "rest of today" card, the goal accordion and the footer). Copy is
     * descriptive: it states what the day holds and never suggests what to
     * eat; the only foods it names are the user's own logged ones. */
    goalProgress: {
        /** Loading line shown before the first tool result arrives —
         * before the payload's locale is known, so shared/bridge.js picks
         * it from the browser language. */
        loading: string;
        /** Template. Placeholder: {when} (today / todayAt / a date). */
        eyebrow: string;
        today: string;
        /** Template. Placeholder: {time} (HH:MM). */
        todayAt: string;
        /** Each goal's label, as a heading ("Saturated fat"). */
        labels: GoalProgressMetrics;
        /** Each goal's name inside a sentence ("saturated fat"); German keeps
         * its capitals here. */
        names: GoalProgressMetrics;
        /** The saturated-fat label in a two-column chip. */
        satFatShort: string;
        kinds: { budget: string; target: string; limit: string };
        units: {
            kcal: string;
            g: string;
            mg: string;
            L: string;
            ml: string;
            kg: string;
            lb: string;
        };
        /** Templates for joining names: {a} {b}; {rest} {last}. */
        listPair: string;
        listMore: string;
        listSep: string;
        /** Between the parts of a verdict title. */
        titleSep: string;
        titleSepPast: string;
        nothingToday: string;
        nothingPast: string;
        allOnTrack: PluralForms;
        allMet: PluralForms;
        /** Templates. {a} one name; {list} joined names. */
        overOne: string;
        overNamed: string;
        overMany: PluralForms;
        nearNamed: string;
        nearMany: PluralForms;
        toGoNamed: string;
        toGoMany: PluralForms;
        /** Short verdict parts, used when the full title is too long. */
        briefOverOne: string;
        briefOverMany: PluralForms;
        briefNear: PluralForms;
        briefToGoOne: string;
        briefToGoMany: PluralForms;
        pastOverNamed: string;
        pastOverMany: PluralForms;
        pastShortNamed: string;
        pastShortMany: PluralForms;
        pastCloseNamed: string;
        pastBriefOver: PluralForms;
        pastBriefShort: PluralForms;
        pastBriefMet: PluralForms;
        noGoalsTitle: string;
        countersAria: string;
        counters: { over: string; near: string; togo: string; ok: string };
        countersPast: { over: string; near: string; togo: string; ok: string };
        /** Templates. Placeholders: {label}, {n}. */
        counterAria: string;
        counterAriaZero: string;
        /** Template. Placeholder: {list}. */
        nrNoteToday: string;
        nrNotePast: string;
        emptyToday: string;
        emptyPast: string;
        /** Template. Placeholder: {list}. */
        dailyGoals: string;
        /** Templates. Placeholders: {value} (with its unit), {name}. */
        goalItem: string;
        goalLimitItem: string;
        /** Templates. Placeholder: {list} (the day's totals). */
        noGoalsToday: string;
        noGoalsPast: string;
        sections: {
            over: string;
            near: string;
            togo: string;
            ok: string;
            nr: string;
        };
        sectionsPast: {
            over: string;
            near: string;
            togo: string;
            ok: string;
            nr: string;
        };
        showAll: string;
        showMore: string;
        showLess: string;
        collapseAll: string;
        done: string;
        met: string;
        toGo: string;
        short: string;
        over: string;
        left: string;
        under: string;
        ofLimit: string;
        notRecorded: string;
        noDayTotal: string;
        /** Template. Placeholders: {value}, {goal} (both with units). */
        ofGoal: string;
        /** Template for a goal row's aria-label. Placeholders: {label},
         * {kind}, {status}, {detail}. */
        rowAria: string;
        restTitle: string;
        cellCaloriesLeft: string;
        cellCalories: string;
        /** Templates: {label}; {value}; {pct}. */
        cellToGo: string;
        cellOver: string;
        cellPct: string;
        /** Template. Placeholders: {key}, {value}. */
        cellAria: string;
        hintOverK: string;
        /** Template. Placeholders: {over}, {goal}. */
        hintOver: string;
        /** Template. Placeholders: {over}, {goal}, {left}. */
        hintOverWater: string;
        hintFoodK: string;
        /** Template. Placeholders: {food} (name and amount), {facts}. */
        hintFood: string;
        hintToGoK: string;
        hintWaterK: string;
        hintOverLimitK: string;
        hintNearK: string;
        /** Template. Placeholder: {list}. */
        hintList: string;
        /** Placeholders: {left}, {n} (glasses of 250 ml). */
        waterLeft: PluralForms;
        hintAllK: string;
        hintAll: string;
        leadK: string;
        /** Template. Placeholders: {name} (food and amount), {value}, {nutrient} (lower-case goal name; empty for calories, whose value already reads "kcal"). */
        leadV: string;
        gapTitle: string;
        mealsTitle: string;
        waterToday: string;
        waterPast: string;
        totalOnly: string;
        mealFallback: string;
        mealTypes: {
            breakfast: string;
            lunch: string;
            dinner: string;
            snack: string;
        };
        noMealsToday: string;
        noMealsPast: string;
        noWaterToday: string;
        noWaterPast: string;
        otherMealsNone: PluralForms;
        missingNote: PluralForms;
        /** Templates. Placeholders: {label}, {meal}, {goal}, {kind}; nrMany
         * also {n}. */
        nrOne: string;
        nrMany: PluralForms;
        sources: {
            usda: string;
            openfoodfacts: string;
            user: string;
            estimate: string;
            mixed: string;
        };
        weight: string;
        /** Templates. Placeholders: {delta}, {target} (with units). */
        weightAbove: string;
        weightBelow: string;
        weightAt: string;
        weightNoGoal: string;
        /** Template. Placeholder: {date}. */
        weightLatest: string;
        weightNone: string;
        /** Template. Placeholder: {target}. */
        weightNoneGoal: string;
        transNote: string;
        /** Placeholder: {n} (one decimal). */
        drinks: { us: PluralForms; uk: PluralForms };
    };

    /** templates/meal-logged.html's own hero words (log_meal, update_meal,
     * log_saved_meal): the eyebrow's action word, the delta line and the
     * desktop stat labels. The rows below the gauge read `nutritionSummary`. */
    mealLogged: {
        /** Eyebrow word after the meal type: "Dinner · logged". */
        logged: string;
        /** The same after update_meal: "Dinner · edited". */
        edited: string;
        /** Delta line under the gauge. Placeholder: {amount} ("+520 kcal"). */
        thisMeal: string;
        /** Desktop stat labels. */
        statThisMeal: string;
        statToday: string;
        statLeftToday: string;
        statLeftThatDay: string;
    };

    /** templates/trends.html's own top matter (the toggle header and chart;
     * the strip below is shared/macros.js). */
    trends: {
        /** Loading line shown before the first tool result arrives —
         * before the payload's locale is known, so shared/bridge.js picks
         * it from the browser language. */
        loading: string;
        /** aria-label on the 7/14/30-day segmented control. */
        windowAriaLabel: string;
        /** Period view (get_trends with group_by, rows from the result's
         * `nutrition-mcp.com/period-averages` _meta). Short labels for the
         * five-button `.seg-sm` control — Week · Month · Quarter · Year ·
         * Days — which must fit a 320px card, so keep each to about six
         * characters where the language allows. segDays switches back to
         * the 7/14/30-day view. */
        segWeek: string;
        segMonth: string;
        segQuarter: string;
        segYear: string;
        segDays: string;
        /** Full-phrase aria-labels for the five buttons above. */
        segWeekAria: string;
        segMonthAria: string;
        segQuarterAria: string;
        segYearAria: string;
        segDaysAria: string;
        /** Card header in period mode, one per granularity. */
        periodTitleWeek: string;
        periodTitleMonth: string;
        periodTitleQuarter: string;
        periodTitleYear: string;
        /** Denominator caption for a period row's averages: they divide by
         * the days that have a log, not by calendar days. */
        perLoggedDay: string;
        /** Template for a period row's day count, right-aligned on its first
         * line. Placeholders: {logged}, {total}. */
        daysLogged: string;
        /** Template for how many logged days had every targeted nutrient
         * (calories, protein, carbs, fat) within its band. Placeholders: {k}
         * (days on target), {n} (logged days). */
        onTarget: string;
        /** Logged days under half of that day's calorie target, flagged but
         * kept in the average. Placeholder: {n}. Polish and Ukrainian carry
         * few/many. */
        possiblyIncomplete: PluralForms;
        /** Chip on the current, still-running period. */
        partial: string;
        /** The single dim line of a period with no logged day. */
        nothingLogged: string;
        /** Note on a row whose period spans a goal change. */
        targetsChanged: string;
        /** Note on a row with days that predate the recorded goals history,
         * so their targets are assumed. Placeholder: {date} (the first
         * recorded date, already formatted for the locale). */
        targetsAssumed: string;
        /** One line at the top of the period view when no targets are set. */
        noTargets: string;
        /** Template for a quarter's period label. Placeholders: {q} (1–4),
         * {year}. */
        quarter: string;
        /** Name of the still-running last day (x labels, chart header, day list). */
        today: string;
        /** A still-running day in the chart header. Placeholder: {day}. */
        daySoFar: string;
        /** Suffix on a still-running day's meta line in the day list. */
        soFar: string;
        /** Eyebrow when the window ends today. Placeholder: {n}. */
        lastNDays: string;
        /** Eyebrow when the window ends before today. Placeholder: {n}. */
        nDays: string;
        /** Card title. Placeholders: {n} (7/14/30), {metric} (a metricInTitle word). */
        titleMetric: string;
        /** Nutrient names on chips, cards, charts and day rows. */
        metricLabel: {
            calories: string;
            protein: string;
            carbs: string;
            fat: string;
            fiber: string;
            sugar: string;
            addedSugar: string;
            saturated: string;
            trans: string;
            sodium: string;
            caffeine: string;
            water: string;
            alcohol: string;
        };
        /** The nutrient word inside titleMetric (lower case in English). */
        metricInTitle: {
            calories: string;
            protein: string;
            carbs: string;
            fat: string;
            fiber: string;
            sugar: string;
            addedSugar: string;
            saturated: string;
            trans: string;
            sodium: string;
            caffeine: string;
            water: string;
            alcohol: string;
        };
        /** Range pill label. Placeholder: {n}. Keep it to about four characters. */
        pill: string;
        /** Range pill aria-label. Placeholder: {n}. */
        pillAria: string;
        /** aria-label on the nutrient chip strip. */
        metricsAria: string;
        /** aria-label on the chip strip's left arrow. */
        scrollLeft: string;
        /** aria-label on the chip strip's right arrow. */
        scrollRight: string;
        /** Word before the big average figure. */
        avgWord: string;
        /** Unit after the big average figure. Placeholder: {unit}. */
        perDay: string;
        /** Bar chart heading. Placeholder: {metric} (a metricLabel). */
        chartTitle: string;
        /** aria-label on a bar chart. Placeholders: {metric}, {n}. */
        chartAria: string;
        /** Bold part of the mobile delta line. Placeholders: {a}, {n}. */
        loggedOf: string;
        /** After loggedOf, for calories, protein, carbs, fat and water. */
        daysLoggedWord: string;
        /** After loggedOf, for nutrients averaged over the days that recorded them. */
        daysRecordedWord: string;
        /** After an amount under a goal. */
        belowGoal: string;
        /** After an amount over a goal. */
        overGoal: string;
        /** After an amount under a limit. */
        underLimit: string;
        /** After an amount over a limit. */
        overLimit: string;
        /** Delta line when no goal is set. */
        noGoalSet: string;
        /** Goal line under the average. Placeholders: {goal} (with unit), {pct} (bold). */
        heroGoal: string;
        /** The same line when the average is above the goal. */
        heroGoalOver: string;
        /** Goal line for a limit. Placeholders: {goal}, {pct}. */
        heroLimit: string;
        /** Goal line with no goal set. */
        heroNoGoal: string;
        /** Under the average while today is still running. */
        todayNote: string;
        /** Expand button (collapsed). */
        showMore: string;
        /** Expand button (expanded). */
        showLess: string;
        /** Button under the nutrient cards. */
        collapseAll: string;
        /** A day or nutrient with no recorded value. */
        notRecorded: string;
        /** Day meta. Placeholder: {pct} (formatted percent). */
        pctOfGoal: string;
        /** Day meta for a limit. Placeholder: {pct}. */
        pctOfLimit: string;
        /** Day meta. Placeholder: {amount} (with unit). */
        amountOverGoal: string;
        /** Day meta for a limit. Placeholder: {amount}. */
        amountOverLimit: string;
        /** Day meta within 10% of the goal. Placeholder: {pct}. */
        onTargetPct: string;
        /** Card trend tag when the second half of the window matches the first. */
        steady: string;
        /** Card and day meta with no goal. */
        noGoal: string;
        /** Open card of a nutrient with no value in the window. Placeholder: {metric}. */
        notRecordedInRange: string;
        /** Stat chip. Placeholders: {value} (bold, with unit), {day}. */
        chipHigh: string;
        /** Stat chip. Placeholders: {value}, {day}. */
        chipLow: string;
        /** Stat chip. Placeholders: {value} ("9 / 14", bold), {n} (the second number). */
        chipOnTarget: PluralForms;
        /** Stat chip for a limit. Placeholders: {value}, {n}. */
        chipOverLimit: PluralForms;
        /** Desktop stat label. */
        statDaysLogged: string;
        /** Desktop stat label for nutrients averaged over recorded days. */
        statDaysRecorded: string;
        /** Desktop stat label. */
        statOnTarget: string;
        /** Desktop stat label for a limit. */
        statDaysOverLimit: string;
        /** Desktop stat label. */
        statBelowGoal: string;
        /** Desktop stat label. */
        statOverGoal: string;
        /** Desktop stat label. */
        statUnderLimit: string;
        /** Desktop stat label. */
        statOverLimit: string;
        /** Desktop stat label with no goal. */
        statNoGoal: string;
        /** Small unit after "12 / 14". Placeholder: {n} (the second number). */
        daysUnit: PluralForms;
        /** Under a day list capped at 7. Placeholder: {n}. */
        showAllDays: string;
        /** Empty state heading. */
        emptyTitle: string;
        /** Empty state line: a fact, not a suggestion. */
        emptyBody: string;
        /** Alcohol's unit, per the account's drink unit. */
        drinkUnit: { us: string; uk: string };
        /** A bar's aria-label. Placeholders: {day}, {value}. */
        dayAria: string;
    };

    /** templates/weight-trends.html's own top matter. No macro strip here. */
    weightTrends: {
        /** Loading line shown before the first tool result arrives — before the payload's locale is known, so shared/bridge.js picks it from the browser language. */
        loading: string;
        /** No weigh-in anywhere in the payload. */
        empty: string;
        /** Eyebrow when the latest weigh-in is today. */
        eyebrowToday: string;
        /** Eyebrow otherwise. Placeholder: {date} (short date). */
        eyebrowLast: string;
        /** Title: only one weigh-in ever. */
        titleFirst: string;
        /** Title: fewer than 4 weigh-in days in the range. */
        titleFew: string;
        /** Title: enough points, but the server sent no weekly rate (too few weigh-ins in the last 3 weeks). */
        titleNoRate: string;
        /** Title, no goal set: rate under 0.03 a week either way. */
        titleSteady: string;
        /** Title, no goal set. */
        titleDown: string;
        /** Title, no goal set. */
        titleUp: string;
        /** Title: the latest weight is at or past the target. */
        titleGoalReached: string;
        /** Title: the rate points away from the target. */
        titleAway: string;
        /** Title: the rate points toward the target. */
        titleOnTrack: string;
        /** Title: flat, target not reached. */
        titleShortSteady: string;
        /** aria-label on the range pill group. */
        rangeGroupAriaLabel: string;
        /** Per range id: the pill's label and aria-label, plus the range named inside other strings — `word` after "in" ("No weigh-ins in {range}"), `inRange` as a trailing phrase ("12 weigh-ins in 30 days"), `heading` in the measurements heading, `chip` in the change chip. */
        ranges: Record<WeightRangeId, WeightRangeCopy>;
        /** Change chip beside the big number. Placeholders: {change} (signed, with unit), {range} (ranges.*.chip). */
        chip: string;
        /** Summary part. Placeholder: {amount} (signed, with unit; rendered bold). */
        perWeek: string;
        /** Summary part with no goal set. Placeholder: {amount}. */
        perWeekAvg: string;
        /** Summary part. Placeholder: {value} (weeksApprox or yearsPlus; rendered bold). */
        toGoal: string;
        /** Projected time to the goal at the current rate. */
        weeksApprox: PluralForms;
        /** Projected time to the goal beyond 104 weeks. */
        yearsPlus: string;
        /** Summary part. Placeholder: {date} (short date; rendered bold). */
        reachedOn: string;
        /** Summary part. */
        movingAway: string;
        /** Summary part. */
        tooFlat: string;
        /** Summary line when the range holds 2–3 weigh-in days. */
        hintFew: string;
        /** Summary line when the server sent no weekly rate. */
        hintNoRate: string;
        /** Desktop stat label. */
        statPerWeek: string;
        /** Desktop stat label. */
        statGoalPace: string;
        /** Desktop stat label. */
        statGoalReached: string;
        /** Desktop stat label. */
        statToGoal: string;
        /** Desktop stat label. Placeholder: {date} (short date, or month and year). */
        statSince: string;
        /** Unit beside the "Goal at this pace" figure. */
        unitWeeks: PluralForms;
        /** Unit beside "2+". */
        unitYears: string;
        /** Goal pill on the chart. Placeholders: {goal}, {left} (each with unit). */
        goalPill: string;
        /** Goal pill once reached. Placeholder: {goal}. */
        goalPillReached: string;
        /** Goal pill pinned under a chart whose range sits above the goal. Placeholders: {goal}, {left}. */
        goalBelow: string;
        /** Goal pill pinned over a chart whose range sits below the goal. Placeholders: {goal}, {left}. */
        goalAbove: string;
        /** Day name for the current date. */
        today: string;
        /** Day name for the day before. */
        yesterday: string;
        /** A date with a local time. Placeholders: {date}, {time} (HH:MM). */
        whenTime: string;
        /** Tooltip value for a day with several weigh-ins. Placeholders: {value}, {n}. */
        scrubAvg: string;
        /** aria-label of a chart point. Placeholders: {date}, {value}. */
        hitLabel: string;
        /** aria-label of a chart point averaging several weigh-ins. Placeholders: {date}, {value}, {n}. */
        hitLabelAvg: string;
        /** aria-label of the chart. Placeholders: {latest}; {goal} (chartAriaGoal or empty); {change} (chartAriaChange or empty). */
        chartAriaLabel: string;
        /** Optional part of chartAriaLabel. Placeholder: {goal}. */
        chartAriaGoal: string;
        /** Optional part of chartAriaLabel. Placeholders: {change}, {range} (ranges.*.inRange). */
        chartAriaChange: string;
        /** aria-label of the tooltip's close button. */
        close: string;
        /** Single-point card, first weigh-in ever. */
        oneTitleFirst: string;
        /** Single-point card. Placeholder: {range} (ranges.*.word). */
        oneTitle: string;
        /** Single-point card line. Placeholders: {when}, {value}. */
        oneFirst: string;
        /** Single-point card line. Placeholders: {when}, {value}. */
        oneLine: string;
        /** Single-point card hint, first weigh-in ever. */
        oneHintFirst: string;
        /** Single-point card hint: how many logged days the longer ranges add. */
        oneHintEarlier: PluralForms;
        /** Empty-range card. Placeholder: {range} (ranges.*.word). */
        emptyRange: string;
        /** Empty-range card when an earlier weigh-in is known. Placeholders: {range}, {date}. */
        emptyRangeLast: string;
        /** Details toggle, closed. */
        showMore: string;
        /** Details toggle, open. */
        showLess: string;
        /** aria-label of the details toggle; starts with its visible text. Placeholder: {action} (showMore or showLess). */
        detailsAria: string;
        /** The same without a measurements section. Placeholder: {action}. */
        detailsAriaWeighIns: string;
        /** Button closing the details. */
        collapseAll: string;
        /** Section heading (uppercased by CSS). */
        sectionWeighIns: string;
        /** Section heading. Placeholder: {range} (ranges.*.heading). */
        sectionMeasurements: string;
        /** Weigh-ins row. Placeholders: {n} (readings), {range} (ranges.*.inRange). */
        accLabel: PluralForms;
        /** Weigh-ins row with none in range. Placeholder: {range} (ranges.*.inRange). */
        accEmpty: string;
        /** Weigh-ins row sub-line. Placeholders: {avg} (with unit), {min}, {max}. */
        accAvgRange: string;
        /** Weigh-ins row sub-line for one reading. */
        loggedToday: string;
        /** Weigh-ins row sub-line for one reading. */
        loggedYesterday: string;
        /** Weigh-ins row sub-line for one reading. Placeholder: {date}. */
        loggedOn: string;
        /** Week group name. */
        weekThis: string;
        /** Week group name. */
        weekLast: string;
        /** Week group average. Placeholder: {value} (with unit). */
        weekAvg: string;
        /** Change of this week's average. Placeholder: {change}. */
        weekVsLast: string;
        /** Change of an older week's average. Placeholder: {change}. */
        weekVsBefore: string;
        /** Day row meta for a day with several readings. */
        dayMulti: PluralForms;
        /** Reveals the remaining week groups. */
        showEarlierWeeks: PluralForms;
        /** Body-measurement site names, keyed by the stored kind. */
        sites: Record<WeightMeasurementSite, string>;
        /** Card change line. Placeholders: {change} (changeDown/Up/Flat), {date}. */
        measSince: string;
        /** A decrease. Placeholder: {delta} (with unit). */
        changeDown: string;
        /** An increase. Placeholder: {delta} (with unit). */
        changeUp: string;
        /** No change. */
        changeFlat: string;
        /** Card change line for a site's only entry. Placeholder: {date}. */
        measFirst: string;
        /** History row with no earlier entry. */
        measFirstRow: string;
        /** Card change line for a site with nothing in range. Placeholder: {date}. */
        measStale: string;
        /** Open-card heading for a stale site. */
        measEarlier: string;
        /** Open-card heading. Placeholders: {site}, {range} (ranges.*.heading). */
        measHeading: string;
        /** Reveals a card's remaining history rows. */
        showMoreN: PluralForms;
        /** Measurements section with nothing logged in the last 365 days. */
        noMeasurements: string;
    };

    /** templates/import-meals.html's own strings — the file/map/preview/import
     * flow. Three deliberate exclusions, not a gap: FIELDS/ALIASES
     * column-matching data (matched against source-file headers, never shown
     * as prose); diagnosticsBlock()'s copy-paste support-email dump
     * (addressed to the English-speaking maintainer, not the widget's
     * audience); and api.updateModelContext's finished-import summary, which
     * is model-facing text like every tool's `content`, not UI. */
    importMeals: {
        /** Loading line shown before the first tool result arrives —
         * before the payload's locale is known, so shared/bridge.js picks
         * it from the browser language. */
        loading: string;
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
            added_sugar_g: string;
            saturated_fat_g: string;
            trans_fat_g: string;
            alcohol_g: string;
            caffeine_mg: string;
            sodium_mg: string;
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
        /** Template. Placeholders: {format}, {conversion}. */
        datesReadAs: string;
        energyConvertedNote: string;
        energyReadAsKcal: string;
        /** Placeholders: {n}, {format}, {sample}. */
        badDatesWarning: PluralForms;
        /** Template. Placeholders: {line}, {value}. */
        badDateSample: string;
        /** Placeholder: {n}. */
        noTimeWarning: PluralForms;
        /** "N date(s) have [too many meals]" — count of dates that had to be
         * split across import batches. Placeholder: {n}. */
        splitDatesCount: PluralForms;
        /** Template. Placeholders: {max}, {date}. */
        splitDatesWarning: string;
        /** Preview-table column headers for the nutrient columns, keyed by
         * the row field. Short on purpose (the table scrolls sideways); the
         * full name from macros.labels rides along as the header's title. */
        tableAbbr: {
            protein_g: string;
            carbs_g: string;
            fat_g: string;
            fiber_g: string;
            sugar_g: string;
            added_sugar_g: string;
            saturated_fat_g: string;
            trans_fat_g: string;
            alcohol_g: string;
            caffeine_mg: string;
            sodium_mg: string;
        };
        tableLine: string;
        tableWhen: string;
        tableMeal: string;
        tableFood: string;
        tableProblem: string;
        noNameFallback: string;
        /** Template. Placeholders: {shown}, {total}. */
        showingRows: string;
        /** Placeholder: {n}. */
        checkingRows: PluralForms;
        /** Placeholder: {n}. */
        importingRows: PluralForms;
        /** Template. Placeholders: {label}, {done}, {total}. */
        batchProgress: string;
        /** Template. Placeholders: {a}, {b}, {msg}. */
        rowsRange: string;
        preflightFailed: string;
        /** Placeholders: {n}, {line}, {message}. */
        rowsWouldFail: PluralForms;
        importingEllipsis: string;
        /** Placeholder: {n}. */
        importButton: PluralForms;
        backToMapping: string;
        importCompleteHeading: string;
        /** Placeholder: {n}. */
        resultMealsImported: PluralForms;
        /** Placeholder: {n}. */
        resultAlreadyLogged: PluralForms;
        /** Placeholder: {n}. */
        resultFailed: PluralForms;
        /** Placeholder: {n}. */
        resultSkipped: PluralForms;
        restartButton: string;
        /** Template. Placeholder: {msg}. */
        couldNotReadFile: string;
        noDataRows: string;
        /** Template. Placeholder: {email}. */
        emailNotice: string;
        /** Eyebrow line above the stepper. */
        eyebrow: string;
        /** Eyebrow once a file is loaded. Placeholder: {file}. */
        eyebrowWithFile: string;
        /** aria-label of the stepper list. */
        stepsLabel: string;
        /** Visually hidden step text. Placeholders: {i}, {name}. */
        stepAriaDone: string;
        /** Placeholders: {i}, {name}. */
        stepAriaCurrent: string;
        /** Placeholders: {i}, {name}. */
        stepAriaUpcoming: string;
        /** The green pill inside the drop zone. */
        browseFiles: string;
        /** Accepted file types, under the pill. */
        dropAccept: string;
        /** aria-label of the drop zone button. */
        dropAria: string;
        /** Privacy line under the drop zone. Names no host: the widget cannot reliably know which assistant it is in. */
        privacyNote: string;
        /** A spreadsheet or other binary file was chosen instead of CSV text. */
        binaryFile: string;
        /** Section label over the field rows. */
        columnsHeading: string;
        /** Chosen by {total}. Placeholders: {n}, {total}. */
        fieldsMatched: PluralForms;
        /** Desktop map header: the field column. */
        tableFieldHead: string;
        /** Desktop map header: the file column. */
        tableColumnHead: string;
        /** Desktop map header: first-row sample. */
        tableRow1Head: string;
        /** Badge on a newly supported field (sodium). */
        badgeNew: string;
        /** Placeholder: {n}. */
        colNumber: string;
        /** Column picked automatically. Placeholder: {n}. */
        colNumberAuto: string;
        /** Column the user picked. Placeholder: {n}. */
        colNumberManual: string;
        /** Option sample when the first row's cell is blank. */
        row1Empty: string;
        /** Tag on a column another field already uses. Placeholder: {field}. */
        alsoUsed: string;
        /** Warning under a row whose column feeds other fields too. Placeholder: {fields}. */
        sameColumn: string;
        /** aria-label of a row's column list. Placeholder: {field}. */
        columnForAria: string;
        /** aria-label of a field row. Placeholders: {field}, {required}, {column}, {sample} (filled from the strings below). */
        mapRowAria: string;
        /** Fills {required} in mapRowAria. */
        requiredAria: string;
        /** Fills {column} in mapRowAria. Placeholders: {n}, {name}. */
        columnAria: string;
        /** Fills {column} in mapRowAria, and liveMapped, when unmapped. */
        notInFileAria: string;
        /** Fills {sample} in mapRowAria. Placeholder: {sample} (already sampleValue). */
        sampleAria: string;
        /** Desktop sidebar heading (and its aria-label). */
        howRead: string;
        /** Chip naming the detected app. Placeholder: {app} (a brand name, never inflected). */
        appExport: string;
        /** Preview tile label under the meal count (the number is drawn separately). */
        tileMeals: PluralForms;
        /** Preview tile label under the kcal total. */
        tileKcal: string;
        /** Preview tile label under the skipped-row count. */
        tileSkipped: PluralForms;
        /** Preview tile label under the batch count. */
        tileBatches: PluralForms;
        /** Section label over the preview rows. */
        rowsHeading: string;
        /** aria-label. */
        scrollLeft: string;
        /** aria-label. */
        scrollRight: string;
        /** aria-label of the scrolling preview table. */
        previewRegionAria: string;
        expandAllDays: string;
        collapseAllDays: string;
        /** Day group summary. Placeholder: {n}. */
        dayRows: PluralForms;
        /** Day group summary with energy. Placeholders: {n}, {kcal}. */
        dayRowsKcal: PluralForms;
        /** A preview row with a date but no time. */
        noTimeShort: string;
        /** Source line of a preview row. Placeholder: {n}. */
        lineN: string;
        /** Screen-reader line for a phone preview row. Placeholders: {line}, {when}, {meal}, {food}, {kcal}. */
        rowCardAria: string;
        /** Fills {meal} in rowCardAria. */
        noMealAria: string;
        /** Fills {kcal} in rowCardAria. */
        noKcalAria: string;
        noRowsToImport: string;
        /** Why the import button is off. */
        importOff: string;
        /** Why Back is off during an import. */
        backBusy: string;
        /** aria-label of the progress bar. */
        progressAria: string;
        /** aria-label of the failed-rows table. */
        failedRowsAria: string;
        /** Under the result: the exact model-facing summary (English, quoted). Placeholder: {summary}. */
        toldOnly: string;
        /** Live announcement. Placeholders: {i}, {name}. */
        liveStep: string;
        /** Live announcement. Placeholders: {field}, {column}. */
        liveMapped: string;
        /** Live announcement. Placeholder: {n}. */
        liveImporting: PluralForms;
        /** Live announcement. Placeholder: {n}. */
        liveDone: PluralForms;
        /** Live announcement. */
        liveNoWrite: string;
        /** Live announcement. */
        liveFileError: string;
    };
    /** templates/digest.html — see DigestStrings above. */
    digest: DigestStrings;
}

export const WIDGET_STRINGS_EN: WidgetStrings = {
    macros: {
        labels: {
            calories: "Calories",
            protein_g: "Protein",
            saturated_fat_g: "Saturated fat",
            trans_fat_g: "Trans fat",
            carbs_g: "Carbs",
            fat_g: "Fat",
            sugar_g: "Sugar",
            added_sugar_g: "Added sugar",
            alcohol_g: "Alcohol",
            caffeine_mg: "Caffeine",
            sodium_mg: "Sodium",
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
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            ml: "ml",
            L: "L",
            kg: "kg",
            lb: "lb",
        },
        noneLogged: "none logged",
        notRecorded: "not recorded",
        caloriesToday: "Calories today",
        caloriesOn: "Calories · {date}",
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
        moreMealsAtLeast: {
            one: "+ {n} or more smaller meals",
            other: "+ {n} or more smaller meals",
        },
        moreMealsMaybe: "+ possibly more smaller meals",
        ingredientCount: {
            one: "{n} ingredient",
            other: "{n} ingredients",
        },
        sourceUsda: "USDA",
        sourceOff: "OFF",
        sourceUser: "yours",
        sourceEst: "est.",
        sourceMixed: "mixed",
        sourceRecordUsda: "FoodData Central",
        sourceRecordOff: "barcode",
        sourceDataType: "data type",
        sourceAria: "Source: {source}",
        sourceDetailsAria: "Show source details",
    },
    bridge: {
        settingsFooter:
            "You can enable or disable these widgets anytime — just ask to update your settings.",
        connectFailed: "This view could not connect to its host.",
    },
    nutritionSummary: {
        title: "Nutrition summary",
        loading: "Loading your nutrition summary…",
        empty: "No meals or water logged in this range.",
        caloriesPerDay: "Calories / day",
        daysLogged: {
            one: "{n} day logged",
            other: "{n} days logged",
        },
        daysOfLogged: "{logged} of {span} days logged",
        periodToday: "Today",
        periodPastDay: "Past day",
        showMore: "Show more",
        showLess: "Show less",
        collapseAll: "Collapse all",
        ofGoal: "of {goal} kcal",
        avgOfGoal: "avg/day of {goal} kcal",
        left: "{amount} left",
        over: "{amount} over",
        toGo: "{amount} to go",
        above: "{amount} above",
        onTarget: "on target",
        goalMet: "goal met",
        noLimit: "no limit",
        none: "none",
        notRecorded: "Not recorded",
        leftToday: "{amount} left today",
        overToday: "{amount} over today",
        leftThatDay: "{amount} left that day",
        overThatDay: "{amount} over that day",
        underGoal: "{amount} under goal",
        overGoal: "{amount} over goal",
        peak: "peak {amount}",
        mealsCount: {
            one: "{n} meal",
            other: "{n} meals",
        },
        emptyToday: "No meals logged today yet",
        emptyThatDay: "No meals logged that day",
        emptyRange: "No meals logged in this range",
        statEatenSoFar: "Eaten so far",
        statEaten: "Eaten",
        statRemaining: "Remaining",
        statOverGoal: "Over goal",
        statMeals: "Meals",
        statLogged: "logged",
        statAvgDay: "Avg / day",
        statPeakDay: "Peak day",
        statLoggedDays: "Logged",
        statOfDays: "of {n} days",
        gaugeAriaToday:
            "{eaten} of {goal} kcal today, {pct}% of goal, {status}.",
        gaugeAriaThatDay:
            "{eaten} of {goal} kcal that day, {pct}% of goal, {status}.",
        gaugeAriaRange:
            "Average {eaten} of {goal} kcal a day, {pct}% of goal, {status}.",
        gaugeAriaNoGoal: "{eaten} kcal.",
        gaugeAriaMeals: "Meals: {list}.",
        caloriesByDay: "Calories by day",
        mealTypes: {
            breakfast: "Breakfast",
            lunch: "Lunch",
            dinner: "Dinner",
            snack: "Snack",
        },
        items: {
            one: "{n} item",
            other: "{n} items",
        },
        totalOnlyShort: "total only",
        totalOnly: "Logged as a total, without ingredients.",
        goalLine: "goal",
        byDay: "By day",
        byDayPartial: "By day · recorded on {rec} of {logged} logged days",
        byMealCount: {
            one: "By meal · {n} meal",
            other: "By meal · {n} meals",
        },
        notRecordedCount: {
            one: "{n} not recorded",
            other: "{n} not recorded",
        },
        notRecordedToday: "{label} wasn't recorded for today's meals.",
        notRecordedThatDay: "{label} wasn't recorded for that day's meals.",
        notRecordedRange: "{label} wasn't recorded on any day in this range.",
        waterToday:
            "Water is logged on its own, not with meals: {amount} today.",
        waterThatDay:
            "Water is logged on its own, not with meals: {amount} that day.",
        waterRange: "Water is logged on its own, not with meals.",
        noneInToday: "{label}: none in today's meals.",
        noneInThatDay: "{label}: none in that day's meals.",
        noneInRange: "{label}: none in the listed meals.",
        topMeals: "Top meals",
        dailyAverages: {
            one: "Daily averages · {n} logged day",
            other: "Daily averages · {n} logged days",
        },
        selected: "Selected {tip}",
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
        loading: "Loading your goal progress…",
        eyebrow: "Goal progress · {when}",
        today: "Today",
        todayAt: "Today, {time}",
        labels: {
            calories: "Calories",
            protein: "Protein",
            carbs: "Carbs",
            fat: "Fat",
            fiber: "Fiber",
            sugar: "Sugar",
            added_sugar: "Added sugar",
            saturated: "Saturated fat",
            trans: "Trans fat",
            sodium: "Sodium",
            caffeine: "Caffeine",
            alcohol: "Alcohol",
            water: "Water",
        },
        names: {
            calories: "calories",
            protein: "protein",
            carbs: "carbs",
            fat: "fat",
            fiber: "fiber",
            sugar: "sugar",
            added_sugar: "added sugar",
            saturated: "saturated fat",
            trans: "trans fat",
            sodium: "sodium",
            caffeine: "caffeine",
            alcohol: "alcohol",
            water: "water",
        },
        satFatShort: "Sat. fat",
        kinds: { budget: "budget", target: "target", limit: "limit" },
        units: {
            kcal: "kcal",
            g: "g",
            mg: "mg",
            L: "L",
            ml: "ml",
            kg: "kg",
            lb: "lb",
        },
        listPair: "{a} and {b}",
        listMore: "{rest} and {last}",
        listSep: ", ",
        titleSep: " · ",
        titleSepPast: ", ",
        nothingToday: "Nothing logged today yet",
        nothingPast: "Nothing was logged that day",
        allOnTrack: {
            one: "Your {n} goal is on track",
            other: "All {n} goals on track",
        },
        allMet: { one: "Your {n} goal was met", other: "All {n} goals met" },
        overOne: "{a} is over",
        overNamed: "{list} are over",
        overMany: { one: "{n} limit is over", other: "{n} limits are over" },
        nearNamed: "{list} near the limit",
        nearMany: {
            one: "{n} goal near the limit",
            other: "{n} goals near the limit",
        },
        toGoNamed: "{list} still to go",
        toGoMany: { one: "{n} target to go", other: "{n} targets to go" },
        briefOverOne: "{a} over",
        briefOverMany: { one: "{n} over", other: "{n} over" },
        briefNear: { one: "{n} near the limit", other: "{n} near the limit" },
        briefToGoOne: "{a} to go",
        briefToGoMany: { one: "{n} target to go", other: "{n} targets to go" },
        pastOverNamed: "{list} went over",
        pastOverMany: {
            one: "{n} limit went over",
            other: "{n} limits went over",
        },
        pastShortNamed: "{list} fell short",
        pastShortMany: {
            one: "{n} target fell short",
            other: "{n} targets fell short",
        },
        pastCloseNamed: "{list} came close",
        pastBriefOver: { one: "{n} over", other: "{n} over" },
        pastBriefShort: { one: "{n} short", other: "{n} short" },
        pastBriefMet: { one: "{n} met", other: "{n} met" },
        noGoalsTitle: "No daily goals set",
        countersAria: "Goals by status",
        counters: {
            over: "Over",
            near: "Near limit",
            togo: "To go",
            ok: "On track",
        },
        countersPast: {
            over: "Over",
            near: "Near limit",
            togo: "Short",
            ok: "Met",
        },
        counterAria: "{label}: {n}. Show them",
        counterAriaZero: "{label}: {n}",
        nrNoteToday: "Not recorded today, so not counted: {list}",
        nrNotePast: "Not recorded that day, so not counted: {list}",
        emptyToday:
            "Once a meal or water is logged, this shows what is over, what is close and what is still to go.",
        emptyPast: "There is nothing to compare with the goals for that day.",
        dailyGoals: "Daily goals: {list}.",
        goalItem: "{value} {name}",
        goalLimitItem: "{value} {name} limit",
        noGoalsToday:
            "No daily goals are set, so there is nothing to compare with. Logged today: {list}.",
        noGoalsPast:
            "No daily goals are set, so there is nothing to compare with. Logged that day: {list}.",
        sections: {
            over: "Over the limit",
            near: "Near the limit",
            togo: "Still to go",
            ok: "On track",
            nr: "Not recorded",
        },
        sectionsPast: {
            over: "Went over",
            near: "Close to the limit",
            togo: "Fell short",
            ok: "Met",
            nr: "Not recorded",
        },
        showAll: "Show all goals",
        showMore: "Show more",
        showLess: "Show less",
        collapseAll: "Collapse all",
        done: "Done",
        met: "Met",
        toGo: "to go",
        short: "short",
        over: "over",
        left: "left",
        under: "under",
        ofLimit: "of limit",
        notRecorded: "not recorded",
        noDayTotal: "no day total",
        ofGoal: "{value} of {goal}",
        rowAria: "{label} {kind}: {status}, {detail}",
        restTitle: "For the rest of today",
        cellCaloriesLeft: "Calories left",
        cellCalories: "Calories",
        cellToGo: "{label} to go",
        cellOver: "+{value} over",
        cellPct: "{pct}% of limit",
        cellAria: "{key}: {value}",
        hintOverK: "Over budget:",
        hintOver: "{over} above the {goal} budget.",
        hintOverWater: "{over} above the {goal} budget; water {left} to go.",
        hintFoodK: "Logged before:",
        hintFood: "{food} — {facts}.",
        hintToGoK: "Still to go:",
        hintWaterK: "Water:",
        hintOverLimitK: "Over the limit:",
        hintNearK: "Close to the limit:",
        hintList: "{list}.",
        waterLeft: {
            one: "{left} to go, about {n} glass of 250 ml.",
            other: "{left} to go, about {n} glasses of 250 ml.",
        },
        hintAllK: "All set:",
        hintAll: "every goal is on track.",
        leadK: "Biggest source:",
        leadV: "{name} — {value} {nutrient}",
        gapTitle: "Foods you’ve logged before",
        mealsTitle: "Where it came from",
        waterToday: "Logged today",
        waterPast: "Logged that day",
        totalOnly: "total only",
        mealFallback: "Meal",
        mealTypes: {
            breakfast: "Breakfast",
            lunch: "Lunch",
            dinner: "Dinner",
            snack: "Snack",
        },
        noMealsToday: "No meals logged today.",
        noMealsPast: "No meals logged that day.",
        noWaterToday: "No water logged today.",
        noWaterPast: "No water logged that day.",
        otherMealsNone: {
            one: "{n} other meal had none.",
            other: "{n} other meals had none.",
        },
        missingNote: {
            one: "Not recorded for {n} meal; the total counts only the meals that had it.",
            other: "Not recorded for {n} meals; the total counts only the meals that had it.",
        },
        nrOne: "{label} wasn’t recorded for “{meal}”, so there is no day total to compare with the {goal} {kind}.",
        nrMany: {
            one: "{label} wasn’t recorded for {n} meal, so there is no day total to compare with the {goal} {kind}.",
            other: "{label} wasn’t recorded for {n} meals, so there is no day total to compare with the {goal} {kind}.",
        },
        sources: {
            usda: "USDA",
            openfoodfacts: "Open Food Facts",
            user: "your figure",
            estimate: "estimate",
            mixed: "mixed sources",
        },
        weight: "Weight",
        weightAbove: "{delta} above your {target} goal",
        weightBelow: "{delta} below your {target} goal",
        weightAt: "at your {target} goal",
        weightNoGoal: "no goal set",
        weightLatest: "latest reading, {date}",
        weightNone: "no reading yet",
        weightNoneGoal: "no reading yet · goal {target}",
        transNote: "no limit set, shown for reference",
        drinks: {
            us: { one: "{n} US drink", other: "{n} US drinks" },
            uk: { one: "{n} UK unit", other: "{n} UK units" },
        },
    },
    mealLogged: {
        logged: "logged",
        edited: "edited",
        thisMeal: "{amount} this meal",
        statThisMeal: "This meal",
        statToday: "Today",
        statLeftToday: "Left today",
        statLeftThatDay: "Left that day",
    },
    trends: {
        loading: "Loading your trends…",
        windowAriaLabel: "Trend window",
        segWeek: "Week",
        segMonth: "Month",
        segQuarter: "Qtr",
        segYear: "Year",
        segDays: "Days",
        segWeekAria: "Show weekly averages",
        segMonthAria: "Show monthly averages",
        segQuarterAria: "Show quarterly averages",
        segYearAria: "Show yearly averages",
        segDaysAria: "Show daily trends",
        periodTitleWeek: "Weekly averages",
        periodTitleMonth: "Monthly averages",
        periodTitleQuarter: "Quarterly averages",
        periodTitleYear: "Yearly averages",
        perLoggedDay: "per logged day",
        daysLogged: "{logged}/{total} days",
        onTarget: "on target {k}/{n}",
        possiblyIncomplete: {
            one: "{n} possibly incomplete",
            other: "{n} possibly incomplete",
        },
        partial: "partial",
        nothingLogged: "nothing logged",
        targetsChanged: "targets changed mid-period",
        targetsAssumed: "targets before {date} not recorded",
        noTargets: "No targets set — averages only.",
        quarter: "Q{q} {year}",
        today: "Today",
        daySoFar: "{day} (so far)",
        soFar: "so far",
        lastNDays: "Last {n} days",
        nDays: "{n} days",
        titleMetric: "{n}-day {metric} trend",
        metricLabel: {
            calories: "Calories",
            protein: "Protein",
            carbs: "Carbs",
            fat: "Fat",
            fiber: "Fiber",
            sugar: "Sugar",
            addedSugar: "Added sugar",
            saturated: "Saturated fat",
            trans: "Trans fat",
            sodium: "Sodium",
            caffeine: "Caffeine",
            water: "Water",
            alcohol: "Alcohol",
        },
        metricInTitle: {
            calories: "calorie",
            protein: "protein",
            carbs: "carb",
            fat: "fat",
            fiber: "fiber",
            sugar: "sugar",
            addedSugar: "added sugar",
            saturated: "saturated fat",
            trans: "trans fat",
            sodium: "sodium",
            caffeine: "caffeine",
            water: "water",
            alcohol: "alcohol",
        },
        pill: "{n}d",
        pillAria: "Show {n} days",
        metricsAria: "Choose a nutrient",
        scrollLeft: "Scroll left",
        scrollRight: "Scroll right",
        avgWord: "avg",
        perDay: "{unit}/day",
        chartTitle: "{metric} per day",
        chartAria: "{metric} per day over {n} days",
        loggedOf: "{a} of {n}",
        daysLoggedWord: "days logged",
        daysRecordedWord: "days recorded",
        belowGoal: "below goal",
        overGoal: "over goal",
        underLimit: "under limit",
        overLimit: "over limit",
        noGoalSet: "no goal set",
        heroGoal: "Goal {goal} · {pct} reached",
        heroGoalOver: "Goal {goal} · {pct} of goal",
        heroLimit: "Limit {goal} · {pct} used",
        heroNoGoal: "No goal set",
        todayNote: "Today is still in progress, so it isn’t averaged yet.",
        showMore: "Show more",
        showLess: "Show less",
        collapseAll: "Collapse all",
        notRecorded: "not recorded",
        pctOfGoal: "{pct} of goal",
        pctOfLimit: "{pct} of limit",
        amountOverGoal: "{amount} over goal",
        amountOverLimit: "{amount} over limit",
        onTargetPct: "on target · {pct}",
        steady: "steady",
        noGoal: "no goal",
        notRecordedInRange:
            "{metric} wasn’t recorded on any day in this range.",
        chipHigh: "High {value} {day}",
        chipLow: "Low {value} {day}",
        chipOnTarget: {
            one: "{value} day on target",
            other: "{value} days on target",
        },
        chipOverLimit: {
            one: "{value} day over limit",
            other: "{value} days over limit",
        },
        statDaysLogged: "Days logged",
        statDaysRecorded: "Days recorded",
        statOnTarget: "On target",
        statDaysOverLimit: "Days over limit",
        statBelowGoal: "Below goal",
        statOverGoal: "Over goal",
        statUnderLimit: "Under limit",
        statOverLimit: "Over limit",
        statNoGoal: "No goal set",
        daysUnit: {
            one: "day",
            other: "days",
        },
        showAllDays: "Show all {n} days",
        emptyTitle: "No meals logged in this period",
        emptyBody: "Your trend appears here once meals are logged.",
        drinkUnit: {
            us: "drinks",
            uk: "units",
        },
        dayAria: "{day}, {value}",
    },
    weightTrends: {
        loading: "Loading your weight trends…",
        empty: "No weight logged in this range yet.",
        eyebrowToday: "Weight · today",
        eyebrowLast: "Weight · last weigh-in {date}",
        titleFirst: "First weigh-in logged",
        titleFew: "A few weigh-ins so far",
        titleNoRate: "Not enough recent weigh-ins for a weekly rate",
        titleSteady: "Holding steady",
        titleDown: "Trending down",
        titleUp: "Trending up",
        titleGoalReached: "Goal reached",
        titleAway: "Drifting away from your goal",
        titleOnTrack: "On track for your goal",
        titleShortSteady: "Holding steady, short of your goal",
        rangeGroupAriaLabel: "Range",
        ranges: {
            "7": {
                label: "7d",
                aria: "Show last 7 days",
                word: "the last 7 days",
                inRange: "in 7 days",
                heading: "last 7 days",
                chip: "7 d",
            },
            "30": {
                label: "30d",
                aria: "Show last 30 days",
                word: "the last 30 days",
                inRange: "in 30 days",
                heading: "last 30 days",
                chip: "30 d",
            },
            "90": {
                label: "90d",
                aria: "Show last 90 days",
                word: "the last 90 days",
                inRange: "in 90 days",
                heading: "last 90 days",
                chip: "90 d",
            },
            "1y": {
                label: "1y",
                aria: "Show last year",
                word: "the last year",
                inRange: "in a year",
                heading: "last year",
                chip: "1 y",
            },
            all: {
                label: "All",
                aria: "Show all time",
                word: "all time",
                inRange: "overall",
                heading: "all time",
                chip: "All",
            },
        },
        chip: "{change} · {range}",
        perWeek: "{amount} per week",
        perWeekAvg: "{amount} per week on average",
        toGoal: "{value} to goal",
        weeksApprox: { one: "~{n} week", other: "~{n} weeks" },
        yearsPlus: "2+ years",
        reachedOn: "reached on {date}",
        movingAway: "moving away from goal",
        tooFlat: "too flat to project a goal date",
        hintFew: "A trend line needs at least 4 weigh-ins in the range",
        hintNoRate: "The weekly rate needs 4 weigh-ins in the last 3 weeks",
        statPerWeek: "Per week",
        statGoalPace: "Goal at this pace",
        statGoalReached: "Goal reached",
        statToGoal: "To goal",
        statSince: "Since {date}",
        unitWeeks: { one: "week", other: "weeks" },
        unitYears: "years",
        goalPill: "Goal {goal} · {left} to go",
        goalPillReached: "Goal {goal} ✓",
        goalBelow: "Goal {goal}  ↓ {left} below",
        goalAbove: "Goal {goal}  ↑ {left} above",
        today: "Today",
        yesterday: "Yesterday",
        whenTime: "{date}, {time}",
        scrubAvg: "{value} (avg of {n})",
        hitLabel: "{date}, {value}",
        hitLabelAvg: "{date}, {value}, average of {n}",
        chartAriaLabel:
            "Weight chart, latest {latest}{goal}{change}. Tap a day to read its value.",
        chartAriaGoal: ", goal {goal}",
        chartAriaChange: ", {change} {range}",
        close: "Close",
        oneTitleFirst: "Your trend starts here",
        oneTitle: "Only one weigh-in in {range}",
        oneFirst: "First weigh-in · {when} · {value}",
        oneLine: "{when} · {value}",
        oneHintFirst: "The chart starts with a second weigh-in",
        oneHintEarlier: {
            one: "{n} earlier weigh-in day in longer ranges",
            other: "{n} earlier weigh-in days in longer ranges",
        },
        emptyRange: "No weigh-ins in {range}.",
        emptyRangeLast: "No weigh-ins in {range}. The last one was on {date}.",
        showMore: "Show more",
        showLess: "Show less",
        detailsAria: "{action}: weigh-ins and measurements",
        detailsAriaWeighIns: "{action}: weigh-ins",
        collapseAll: "Collapse all",
        sectionWeighIns: "Weigh-ins",
        sectionMeasurements: "Body measurements · {range}",
        accLabel: {
            one: "{n} weigh-in {range}",
            other: "{n} weigh-ins {range}",
        },
        accEmpty: "No weigh-ins {range}",
        accAvgRange: "avg {avg} · range {min}–{max}",
        loggedToday: "logged today",
        loggedYesterday: "logged yesterday",
        loggedOn: "logged on {date}",
        weekThis: "This week",
        weekLast: "Last week",
        weekAvg: "avg {value}",
        weekVsLast: "{change} vs last week",
        weekVsBefore: "{change} vs week before",
        dayMulti: {
            one: "{n} weigh-in · averaged",
            other: "{n} weigh-ins · averaged",
        },
        showEarlierWeeks: {
            one: "Show {n} earlier week",
            other: "Show {n} earlier weeks",
        },
        sites: {
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
        measSince: "{change} since {date}",
        changeDown: "↓ {delta}",
        changeUp: "↑ {delta}",
        changeFlat: "→ no change",
        measFirst: "first measurement · {date}",
        measFirstRow: "first",
        measStale: "not measured in this range · last on {date}",
        measEarlier: "Earlier measurements",
        measHeading: "{site} · {range}",
        showMoreN: { one: "Show {n} more", other: "Show {n} more" },
        noMeasurements:
            "No body measurements in the last year. Waist, hips and seven other sites can be tracked in centimetres or inches.",
    },
    importMeals: {
        loading: "Preparing import…",
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
            saturated_fat_g: "Saturated fat (g)",
            trans_fat_g: "Trans fat (g)",
            sugar_g: "Sugar, total (g)",
            added_sugar_g: "Added sugar (g)",
            alcohol_g: "Alcohol (g)",
            caffeine_mg: "Caffeine (mg)",
            sodium_mg: "Sodium (mg)",
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
        datesReadAs: "Dates read as {format}; energy {conversion}.",
        energyConvertedNote: "converted from kJ to kcal",
        energyReadAsKcal: "read as kcal",
        badDatesWarning: {
            one: "{n} row was skipped because its date could not be read as {format}{sample}. Go back and set the date format that matches your file.",
            other: "{n} rows were skipped because their date could not be read as {format}{sample}. Go back and set the date format that matches your file.",
        },
        badDateSample: " (e.g. line {line}: {value})",
        noTimeWarning: {
            one: "{n} row has a date but no time — it will be logged at midday.",
            other: "{n} rows have a date but no time — they will be logged at midday.",
        },
        splitDatesCount: {
            one: "{n} date has",
            other: "{n} dates have",
        },
        splitDatesWarning:
            " more than {max} meals (e.g. {date}) and had to be split across separate import batches. If that date contains two entries with the exact same food, meal type and macros, one of them may be skipped as a duplicate instead of imported.",
        tableAbbr: {
            protein_g: "P",
            carbs_g: "C",
            fat_g: "F",
            fiber_g: "Fib",
            sugar_g: "Sug",
            added_sugar_g: "Add",
            saturated_fat_g: "Sat",
            trans_fat_g: "Trans",
            alcohol_g: "Alc",
            caffeine_mg: "Caf",
            sodium_mg: "Na",
        },
        tableLine: "Line",
        tableWhen: "When",
        tableMeal: "Meal",
        tableFood: "Food",
        tableProblem: "Problem",
        noNameFallback: "(no name — will be labelled by meal)",
        showingRows: "Showing {shown} of {total} rows",
        checkingRows: {
            one: "Checking {n} row…",
            other: "Checking {n} rows…",
        },
        importingRows: {
            one: "Importing {n} row…",
            other: "Importing {n} rows…",
        },
        batchProgress: "{label} (batch {done} of {total})",
        rowsRange: "Rows {a}–{b}: {msg}",
        preflightFailed: "Preflight check failed.",
        rowsWouldFail: {
            one: "{n} row would fail, e.g. line {line}: {message}",
            other: "{n} rows would fail, e.g. line {line}: {message}",
        },
        importingEllipsis: "Importing…",
        importButton: {
            one: "Import {n} meal",
            other: "Import {n} meals",
        },
        backToMapping: "Back to mapping",
        importCompleteHeading: "Import complete",
        resultMealsImported: {
            one: "{n} meal imported",
            other: "{n} meals imported",
        },
        resultAlreadyLogged: {
            one: ", {n} already logged",
            other: ", {n} already logged",
        },
        resultFailed: {
            one: ", {n} failed",
            other: ", {n} failed",
        },
        resultSkipped: {
            one: ", {n} skipped",
            other: ", {n} skipped",
        },
        restartButton: "Import another file",
        couldNotReadFile: "Could not read that file: {msg}",
        noDataRows: "No data rows found in that file.",
        emailNotice:
            "Not working as expected? Email {email} and include the lines below — that is everything needed to diagnose it.",
        eyebrow: "Import meals",
        eyebrowWithFile: "Import meals · {file}",
        stepsLabel: "Import steps",
        stepAriaDone: "Step {i} of 4: {name}, completed",
        stepAriaCurrent: "Step {i} of 4: {name}, current",
        stepAriaUpcoming: "Step {i} of 4: {name}",
        browseFiles: "Browse files",
        dropAccept: ".csv or tab-separated text",
        dropAria: "Choose a CSV file, or drag it here",
        privacyNote:
            "The file is read here, in this panel. Its rows never pass through the chat — the assistant only gets a one-line summary when the import finishes.",
        binaryFile:
            "Could not read that file: this looks like a binary file (an Excel workbook?), not CSV text. Export it as CSV and try again.",
        columnsHeading: "Columns",
        fieldsMatched: {
            one: "{n} of {total} field matched",
            other: "{n} of {total} fields matched",
        },
        tableFieldHead: "Field",
        tableColumnHead: "Column in your file",
        tableRow1Head: "Row 1 value",
        badgeNew: "new",
        colNumber: "Col {n}",
        colNumberAuto: "Col {n} · auto",
        colNumberManual: "Col {n} · set by you",
        row1Empty: "row 1 empty",
        alsoUsed: "also {field}",
        sameColumn: "Same column as {fields}",
        columnForAria: "Column for {field}",
        mapRowAria: "{field}{required}: {column}{sample}",
        requiredAria: ", required",
        columnAria: "column {n}, {name}",
        notInFileAria: "not in this file",
        sampleAria: ", {sample}",
        howRead: "How values are read",
        appExport: "{app} export",
        tileMeals: { one: "meal to import", other: "meals to import" },
        tileKcal: "kcal total",
        tileSkipped: { one: "row skipped", other: "rows skipped" },
        tileBatches: { one: "batch", other: "batches" },
        rowsHeading: "Rows",
        scrollLeft: "Scroll table left",
        scrollRight: "Scroll table right",
        previewRegionAria: "Preview of the rows to import",
        expandAllDays: "Expand all days",
        collapseAllDays: "Collapse all days",
        dayRows: { one: "{n} row", other: "{n} rows" },
        dayRowsKcal: {
            one: "{n} row · {kcal} kcal",
            other: "{n} rows · {kcal} kcal",
        },
        noTimeShort: "no time",
        lineN: "Line {n}",
        rowCardAria: "Line {line}, {when}, {meal}, {food}, {kcal}",
        noMealAria: "no meal",
        noKcalAria: "no calories",
        noRowsToImport: "No rows to import with the current mapping.",
        importOff:
            "Import is off: this host does not let this view write to your log. Ask Claude to import the file instead.",
        backBusy: "Back is unavailable while batches are being sent.",
        progressAria: "Import progress, batches",
        failedRowsAria: "Rows that failed",
        toldOnly: "The assistant was told only: {summary}",
        liveStep: "Step {i} of 4, {name}.",
        liveMapped: "{field}: {column}",
        liveImporting: {
            one: "Importing. {n} batch.",
            other: "Importing. {n} batches.",
        },
        liveDone: {
            one: "Import complete. {n} meal imported.",
            other: "Import complete. {n} meals imported.",
        },
        liveNoWrite: "Preflight check failed. Nothing was written.",
        liveFileError: "Could not use that file.",
    },
    digest: DIGEST_STRINGS_EN,
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
    tr: WIDGET_STRINGS_TR,
};

export function widgetStringsFor(locale: SiteLocale): WidgetStrings {
    return WIDGET_STRINGS[locale] ?? WIDGET_STRINGS_EN;
}
