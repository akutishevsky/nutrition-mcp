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
        /** Template for the strip's calorie caption. Placeholder: {range}.
         * Day view only; the period view labels its own denominator with
         * perLoggedDay, so each view names what it divides by. */
        avgAllDays: string;
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
    };

    /** templates/weight-trends.html's own top matter. No macro strip here. */
    weightTrends: {
        /** Loading line shown before the first tool result arrives —
         * before the payload's locale is known, so shared/bridge.js picks
         * it from the browser language. */
        loading: string;
        title: string;
        empty: string;
        /** A selected range with no weigh-ins in it. Placeholder: {range}. */
        rangeEmpty: string;
        /** aria-label on the 7/14/30-day segmented control. */
        windowAriaLabel: string;
        /** Template for a range button's aria-label. Placeholder: {n}. */
        rangeAriaLabel: string;
        /** Template for the chart's aria-label. Placeholders: {from}, {to},
         * {latest} (pre-formatted with unit). Names the smoothed trend line. */
        /** The raw-weight chart shown when the host dropped `_meta`. */
        chartAriaLabel: string;
        /** The trend chart (`_meta` present): raw dots plus the smoothed line. */
        trendChartAriaLabel: string;
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
        /** Label for the trend weight (the EWMA), shown as the big number. */
        trend: string;
        /** Template. Placeholder: {value} (pre-formatted with its unit) — the
         * latest raw scale reading, the small secondary figure. */
        scaleToday: string;
        /** Rate chip text. Placeholder: {amount} (signed, pre-formatted with
         * its unit), e.g. "−0.4 kg/wk". */
        perWeek: string;
        /** aria-label on the rate chip. Placeholder: {amount} (signed,
         * pre-formatted with its unit). */
        rateAriaLabel: string;
        /** Short label marking the chip as the 2-week rate, shown beside it
         * in the long ranges (90/1y/All) so the chip keeps one meaning. */
        rateTwoWeeks: string;
        /** Range button labels for the long ranges (the day ranges show bare
         * numbers; 90 uses rangeAriaLabel with {n} = 90 like 7/14/30). */
        range1y: string;
        rangeAll: string;
        range1yAriaLabel: string;
        rangeAllAriaLabel: string;
        /** Template for the 1y/All change line, where {date} is a month
         * (pre-formatted, e.g. "Mar 2024"). Placeholders: {change}
         * (pre-formatted with unit), {date}. */
        sinceMonth: string;
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
        mealsToImport: PluralForms;
        /** Template. Placeholder: {kcal}. */
        kcalTotal: string;
        /** Placeholder: {n}. */
        rowsSkipped: PluralForms;
        batchCount: PluralForms;
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
    };
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
        title: "Trends",
        empty: "No meals or water logged in this range yet.",
        avgUnder: "under",
        loggedOfTotal: "{logged}/{total} days logged",
        caloriesOverRange: "Calories per day over the last {range} days",
        windowAriaLabel: "Trend window",
        rangeDaysAriaLabel: "{n} days",
        avgAllDays: "{range}-day avg · all days",
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
    },
    weightTrends: {
        loading: "Loading your weight trends…",
        title: "Weight",
        empty: "No weight logged in this range yet.",
        rangeEmpty: "No weigh-ins in the last {range} days. Try a wider range.",
        windowAriaLabel: "Trend window",
        rangeAriaLabel: "Last {n} days",
        chartAriaLabel: "Weight from {from} to {to}, latest {latest}",
        trendChartAriaLabel:
            "Weight from {from} to {to} with a smoothed trend line, latest {latest}",
        latest: "Latest",
        needTwo: "need 2+ weigh-ins",
        sinceDate: "{change} since {date}",
        weighIns: { one: "{n} weigh-in", other: "{n} weigh-ins" },
        atTarget: "at target",
        toLose: "{amount} to lose",
        toGain: "{amount} to gain",
        target: "Target {value}",
        noTarget: "No target set",
        trend: "Trend",
        scaleToday: "Scale today {value}",
        perWeek: "{amount}/wk",
        rateAriaLabel: "Trend changing {amount} per week over the last 2 weeks",
        rateTwoWeeks: "2-wk rate",
        range1y: "1y",
        rangeAll: "All",
        range1yAriaLabel: "Last year",
        rangeAllAriaLabel: "All history",
        sinceMonth: "{change} since {date}",
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
        mealsToImport: {
            one: "{n} meal to import",
            other: "{n} meals to import",
        },
        kcalTotal: "{kcal} kcal total",
        rowsSkipped: {
            one: "{n} row skipped",
            other: "{n} rows skipped",
        },
        batchCount: { one: "{n} batch", other: "{n} batches" },
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
    tr: WIDGET_STRINGS_TR,
};

export function widgetStringsFor(locale: SiteLocale): WidgetStrings {
    return WIDGET_STRINGS[locale] ?? WIDGET_STRINGS_EN;
}
