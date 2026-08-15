import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import type { Context } from "hono";
import {
    insertMeal,
    getMealsByDate,
    getMealsInRange,
    searchMeals,
    deleteMeal,
    updateMeal,
    deleteAllUserData,
    upsertNutritionGoals,
    getNutritionGoals,
    insertWater,
    getWaterByDate,
    getWaterInRange,
    deleteWater,
    insertWeight,
    getWeightByDate,
    getWeightInRange,
    getLatestWeight,
    updateWeight,
    deleteWeight,
    getUserTimezone,
    getPreferredWeightUnit,
    getWidgetsEnabled,
    getAlcoholTrackingEnabled,
    getPreferredDrinkUnit,
    widgetsEnabledFromProfile,
    alcoholTrackingEnabledFromProfile,
    preferredDrinkUnitFromProfile,
    timezoneFromProfile,
    upsertProfile,
    getProfile,
    countMeals,
    existingIdempotencyKeys,
    existingMealIds,
    type Meal,
    type NutritionGoals,
    type WaterEntry,
    type WeightEntry,
} from "./supabase.js";
import { DELETED_ACCOUNT_ANALYTICS_ID, withAnalytics } from "./analytics.js";
import {
    todayInTz,
    validateTz,
    shiftLocalDate,
    dateInTz,
    formatLocalDateTime,
    weekdayInTz,
    LoggedAtError,
    resolveWriteLoggedAt,
} from "./tz.js";
import {
    buildDailyBuckets,
    computeTrends,
    computeMealPatterns,
    computeWeeklyDigest,
    computeWeightTrend,
    dayCarries,
    coveredDailyAverage,
    dateDiffDays,
    type DailyBucket,
} from "./insights.js";
import {
    toGrams,
    formatWeight,
    fromGrams,
    isWeightUnit,
    pickWriteUnit,
    isPlausibleWeightGrams,
    type WeightUnit,
} from "./units.js";
import { formatAlcohol, isDrinkUnit, type DrinkUnit } from "./alcohol.js";
import { exportMeals } from "./export.js";
import {
    runImport,
    buildSummaryText,
    serializeImportResult,
    BULK_IMPORT_OUTPUT_SCHEMA,
    MAX_ROWS_PER_CALL,
    MAX_CALORIES,
    MAX_MACRO_G,
    MAX_ALCOHOL_G,
    MAX_CAFFEINE_MG,
    type BulkImportArgs,
} from "./import.js";
import { normalizeBarcode, lookupBarcode, formatFoodResult } from "./foods.js";
import { formatMealSearchResults } from "./search.js";
import { getWidgetHtml } from "./widgets.js";

// MCP Apps UI (https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/):
// the get_nutrition_summary tool links to an HTML dashboard served as a ui://
// resource. Hosts (Claude, ChatGPT, VS Code, Goose) render it in a sandboxed
// iframe and hand it the tool's structuredContent. One MIME type / one resource
// works across all MCP Apps-capable clients.
// The widget HTML is assembled from shared source partials at startup (see
// widgets.ts / public/widgets/src). getWidgetHtml(key) returns the fully-inlined,
// self-contained document for each ui:// resource below.
const SUMMARY_WIDGET_URI = "ui://widget/nutrition-summary.html";
const APP_UI_MIME_TYPE = "text/html;profile=mcp-app";
const GOAL_PROGRESS_WIDGET_URI = "ui://widget/goal-progress.html";
const MEAL_LOGGED_WIDGET_URI = "ui://widget/meal-logged.html";
const TRENDS_WIDGET_URI = "ui://widget/trends.html";
const WEIGHT_TRENDS_WIDGET_URI = "ui://widget/weight-trends.html";
const IMPORT_MEALS_WIDGET_URI = "ui://widget/import-meals.html";

// The completeness rule for the three nutrients the model routinely forgets,
// declared once and spliced into SERVER_INSTRUCTIONS, log_meal and update_meal
// so the three cannot drift.
//
// Fiber and sugar are unconditional; caffeine deliberately is NOT. That
// asymmetry is the whole point of this block, and it is a read-side constraint
// rather than a stylistic one: caffeine's display gate is `!= null` everywhere
// (limitShown in shared/macros.js, recordedGoalLine and totalsPayloadOf here),
// so an explicit 0 on a sandwich is not a harmless extra data point — it puts a
// "0 mg / 400 mg limit" row on the dashboard of someone who has never had a
// coffee, and drags every caffeine average toward zero by joining the covered
// set (coveredDailyAverage in insights.ts). Fiber and sugar are typed as plain
// numbers in TOTALS_ITEM and already read as 0 when absent, so filling them in
// only ever adds fidelity.
//
// The reason omission is worse than an imperfect estimate: a NULL is not a
// zero, it excludes the entire DAY from that nutrient's averages and goal lines
// (dayCarries in insights.ts), so one forgotten fiber figure silently deletes a
// day from the user's fiber trend rather than making it slightly wrong.
const NUTRIENT_COVERAGE = `Fiber, sugar and caffeine are tracked here alongside the headline macros, and they are only worth tracking if they are actually filled in.
- fiber_g and sugar_g: send them on EVERY meal, exactly as you already send protein, carbs and fat. Not knowing the exact figure is not a reason to leave one out — you do not know the exact protein either. Work in this order: a nutrition label, a barcode lookup, or a chain's published per-item nutrition; then a web search for that product or dish; then your own estimate from the ingredients and the portion. A 0 is the right answer wherever 0 is true (a steak, eggs, oil, black coffee) — what is wrong is omitting the field, because a missing value is not a zero: it records "nobody measured this" and drops the whole day out of the user's fiber and sugar averages, goal lines and charts.
- caffeine_mg: decide it deliberately on every entry instead of defaulting to silence, but only send a number when the item really is a caffeine source — coffee of any kind (decaf included, about 2-5 mg), tea, matcha, yerba mate, cola and many other soft drinks, energy drinks, pre-workout, chocolate and cocoa, coffee ice cream, caffeine tablets. If it is one, get the figure from the label or the chain's nutrition, or search the web for the branded drink, or fall back to the typical amounts in the field description. If the item is plainly not a caffeine source, OMIT the field rather than sending 0 — an explicit 0 means "measured, and it was none", which turns on a caffeine row for a user who never consumes any.`;

// Sent to clients in the initialize response (SDK ServerOptions.instructions).
// Advisory — not every client surfaces it, so the enforcement rule ("interview
// the user one question at a time; never log from a photo until every open
// question is resolved") is repeated in log_meal's own description. Keep both
// in sync. Note this is guidance only: the client model decides whether to
// follow it, so the loop cannot be strictly enforced from here.
const SERVER_INSTRUCTIONS = `Nutrition tracking: meals, water, weight, goals, and trends, per-user with timezone support.

All nutrition figures are estimates and this server does not provide medical or dietary advice.

Knowing what time it is — some hosts put the current date and time in your context and some do not, but this server always knows both the clock and the user's timezone. Never ask the user what time it is.
- Logging something that just happened: omit logged_at entirely. The server stamps the entry with the current time, which is more accurate than any time you could reconstruct.
- Resolving a relative time ("this morning", "an hour ago", "last Monday") or working out what "today" means: call get_current_time, then pass the resolved local time as logged_at.
- Only ask the user for a time when the entry is for some other moment they have not told you.

Recording a complete meal — this applies to every write path (log_meal, update_meal, a barcode lookup you then log, a meal you copied from search_meals), not just to photos.
${NUTRIENT_COVERAGE}
When you notice after the fact that a meal went in without its fiber or sugar, do not leave it: fill it in with update_meal rather than mentioning it in prose.

Photo-based meal logging — when the user sends a photo of food, follow these steps in order:
1. Pick the flow. A packaged product with a visible barcode: transcribe the digits printed under the barcode and call lookup_barcode. A plate, bowl, or prepared meal: continue below.
2. Identify each distinct dish or food item in the photo.
3. Establish provenance: restaurant/takeout or homemade? It changes everything downstream, so settle it before asking anything else. Read the photo for cues — restaurant plating, branded packaging or cups, a table setting in a venue, a tray — versus home tableware and a domestic background. If the cues are clear, state your read and let the user correct it ("Looks like this is from a restaurant — right?"). If they are not, just ask. Homemade: skip to step 6. Restaurant: continue to step 4.
4. Restaurant path — ask which restaurant it is and where it's located (city, or neighbourhood for a chain with many branches). Ask both in one message; they are a single natural question. Then search the web for that restaurant's menu.
   - Chains and fast food (McDonald's, Starbucks, Pret, and similar) usually publish full per-item nutrition. Find the specific item and use those numbers; they beat any estimate.
   - Independent restaurants usually publish a menu with dish names and ingredient lists but NO macros. Use the menu to identify which dish the photo shows and what is actually in it (the ingredient list is the real value — it reveals butter, cream, oil, and sugar that the photo hides), then estimate macros from those ingredients and the visible portion.
   - If you cannot find the menu — or cannot tell which of several dishes it is — say so plainly, make your best assumption, and put it to the user as a question. Never present a guess as if it came from the menu.
   - Be honest about where each number came from. Published chain nutrition is reliable; a macro figure from a recipe aggregator or a random site is not, and a dish cooked in a restaurant kitchen is usually richer than the same dish cooked at home. Say which of these you are working from, and do not dress up an estimate as verified data.
5. Restaurant path, continued — also call search_meals for the dish and for the restaurant name. The user may have eaten there before, and a past log is better evidence than any web result.
6. Homemade path — call search_meals with a short keyword per dish, passing alternatives in both the conversation language and English (past logs may be in either). Past variations reveal ingredients invisible in the photo (raisins vs banana, milk vs water, added honey or oil). Offer them as options: "Is this the oatmeal with raisins like Monday, or with banana, or something else?"
7. Estimate portions in household measures the user can verify at a glance — "a glass of", "a handful of", "a tablespoon of", "half the plate" — never grams or ounces (nobody can weigh food from a photo). For a restaurant meal, what matters most is how much of the serving was actually eaten: ask whether they finished it, left some, or shared it.
8. Interview the user — this is a multi-turn conversation, not a single confirmation step. Build a checklist of every open question across all dishes: which variation or menu item each dish is, how much of each the user actually ate, and any ingredient the photo cannot show (oil, butter, sugar, dressing, sauce, what a drink was made with). On the restaurant path, any dish you could not pin down from the menu is a checklist item too. Then work through that checklist ONE question per message. Ask the single most impactful open question, wait for the answer, let it update your assumptions, and ask the next. Do NOT batch the whole checklist into one message and do NOT stop after the first answer — a single round-trip is not an interview.
9. Keep going until every item on the checklist is resolved. Before each question it helps to note what is already settled and what is still open ("Got it — oatmeal with raisins. Two things left: how much you ate, and whether there was honey"). When the checklist is empty, summarize the full meal as you understand it and ask for a final yes before logging. Never log straight from a photo, and never log while any checklist item is still open.
10. When logging, write the confirmed household-measure portions into the meal description itself (e.g. "Oatmeal (1 glass raw oats, 2 glasses milk) with banana and honey (1 tbsp)") so future search_meals results are self-describing. For a restaurant meal, name the venue and city in the description too (e.g. "Pad thai with chicken (1 plate, finished) at Thai Basil, Podil, Kyiv") — the next time the user eats there, search_meals surfaces this entry and its macros, which is better evidence than searching the web again. Put anything about sourcing that the user should be able to revisit in notes, e.g. whether macros came from published chain nutrition or from an estimate.

Keep the interview proportional: a single obvious item with one known past variation may need only one question, while a full plate with several dishes usually needs several. A restaurant meal you pinned down from published chain nutrition may need only the how-much-did-you-eat question. If the user says to just log it or otherwise signals impatience, stop asking, state your remaining assumptions plainly, and log.

For "log my usual X" requests, use search_meals the same way: search, then interview to confirm the variation and the amount before logging.

Importing history from another app — when the user wants to bring in past meals from MyFitnessPal, Cronometer, Lose It!, MacroFactor or a similar export:
1. If they have a FILE, call start_meal_import first and let them drive it. The importer reads and maps the file in the browser, so the rows never pass through you and cannot be mistranscribed, and it handles column mapping, batching and retries. Do not ask them to paste a file you could import properly.
2. Call bulk_import_meals directly only when the importer is not an option: the data is already pasted into the conversation, the user cannot use the panel, or the importer reports that this client will not let it save. Then parse the rows yourself and follow that tool's description exactly — in particular, compute the row count and calorie total from the source text with real counting rather than by re-reading what you just wrote, and dry-run first.
3. Never log a backfill by calling log_meal in a loop. It is rate-limited per call, so a single week of meals would exhaust the budget; one bulk_import_meals call carries up to 50 rows for the same cost.
4. Check get_timezone before any sizeable import and offer set_timezone if it is unset. Times without an explicit UTC offset are placed using the saved timezone, so correcting it afterwards moves every imported meal — onto an adjacent day for anything logged near midnight.
5. Show the user what was resolved before treating an import as done: the dry run echoes back the date, time and meal type for every row, and a misread date column shows up there rather than in the totals. Re-sending the same rows is safe — the server recognises them and skips them — so a retry after a failure or a timeout never duplicates anything.`;

// How alcohol should be rendered for the current user: the drink unit to gloss
// grams with, or null when alcohol tracking is OFF. Null is the gate, not a
// missing preference — an enabled user with no saved preference gets "us". See
// the alcohol opt-in note on registerTools: alcohol is always STORED, and this
// value decides only whether it is ever shown.
type AlcoholDisplay = DrinkUnit | null;

// ---------- Numeric bounds for the write tools ----------
//
// Why these live in the Zod schema and not in the handler: CLAUDE.md's rule
// ("bounds live in the handler, not in Zod") is specifically about
// bulk_import_meals, where a schema-level rejection fires BEFORE the handler and
// throws away the structured per-row report, the warnings and the analytics row
// — for what is that tool's single most common caller mistake. log_meal,
// update_meal and set_nutrition_goals have no such report to lose: their whole
// output is the one row they just wrote. There, rejecting in the schema is
// strictly better, because the alternative is a raw Postgres `check (fiber_g >=
// 0)` violation surfaced verbatim to the model.
//
// The upper bound is not cosmetic. zod 4's z.number() rejects Infinity but
// accepts 1e308 — and Math.round(1e308 * 10) / 10 IS Infinity, so a single
// absurd meal made every later get_nutrition_summary / get_goal_progress /
// log_meal for that date fail the SDK's outputSchema validation (those schemas
// are z.number(), which refuses Infinity) until the row was deleted by hand.
//
// The ceilings themselves live in src/import.ts and are re-exported here, so
// the same figure is accepted whichever way a meal arrives. They were briefly
// duplicated with a test that grepped the other file to catch drift; sharing
// one declaration removes the drift instead of detecting it.
export { MAX_CALORIES, MAX_MACRO_G, MAX_ALCOHOL_G, MAX_CAFFEINE_MG };
// nutrition_goals stores every gram target as numeric(6,2), so anything from
// 10000 up is a Postgres "numeric field overflow" rather than a saved goal.
export const MAX_GOAL_G = 9_999.99;
// daily_caffeine_mg is the one goal column that is numeric(7,2) — milligram
// figures run three orders larger than the gram targets, so it gets its own
// ceiling for the same overflow reason.
export const MAX_GOAL_MG = 99_999.99;

interface DailyTotals {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
    alcohol_g: number;
    // Milligrams, unlike every gram-valued field above it — the unit rides in
    // the name at every layer because caffeine is the one nutrient here whose
    // unit differs from its siblings. It carries no energy, so it never enters
    // a kcal derivation.
    caffeine_mg: number;
    water_ml: number;
}

function emptyTotals(): DailyTotals {
    return {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        alcohol_g: 0,
        caffeine_mg: 0,
        water_ml: 0,
    };
}

export function sumMeals(meals: Meal[]): DailyTotals {
    const totals = emptyTotals();
    for (const m of meals) {
        totals.calories += m.calories ?? 0;
        totals.protein_g += m.protein_g ?? 0;
        totals.carbs_g += m.carbs_g ?? 0;
        totals.fat_g += m.fat_g ?? 0;
        // Summed regardless of the alcohol opt-in: the flag gates display, and
        // gating here would make the total depend on when it was computed.
        // The `?? 0` here is a SUM, which is fine — a missing value adds
        // nothing. It is only the AVERAGE that needs to know a null from a
        // zero, and that is what nutrientPresence below is for.
        totals.fiber_g += m.fiber_g ?? 0;
        totals.sugar_g += m.sugar_g ?? 0;
        totals.alcohol_g += m.alcohol_g ?? 0;
        totals.caffeine_mg += m.caffeine_mg ?? 0;
    }
    return totals;
}

// Which of the post-launch nutrients a day's meals actually carry. Every meal
// logged before each of them shipped has NULL fiber/sugar/alcohol/caffeine, and
// so does every row imported from an export whose file had no such column;
// `?? 0` cannot tell that apart from a genuine zero. A thin adapter over
// dayCarries in insights.ts — the rule itself lives there, once, so trends and
// the summary cannot drift apart (measured drift: 30 g/day of fiber shown as
// "30d avg: 5g" against a "Target: 30g").
//
// Caffeine is the sharpest case of the four: most meals legitimately never
// carry a value, so a day that recorded none is the norm rather than a relic of
// pre-feature history, and it is this flag — not any profile setting — that
// keeps a fabricated "0 mg" off the screen.
export interface NutrientPresence {
    fiber_g: boolean;
    sugar_g: boolean;
    alcohol_g: boolean;
    caffeine_mg: boolean;
}

export function nutrientPresence(meals: Meal[]): NutrientPresence {
    return {
        fiber_g: dayCarries(meals, "fiber_g"),
        sugar_g: dayCarries(meals, "sugar_g"),
        alcohol_g: dayCarries(meals, "alcohol_g"),
        caffeine_mg: dayCarries(meals, "caffeine_mg"),
    };
}

// Per-day means over a date range, and the denominator each one used.
//
// THE RULE, and it is insights.ts's rule rather than a second copy of it:
// calories, protein, carbs, fat and water divide by EVERY logged day, exactly
// as they always have (users have history built on those figures), while fiber,
// sugar, alcohol and caffeine go through coveredDailyAverage — a day carrying
// no value for a nutrient is excluded from both its numerator and its
// denominator. A nutrient nobody recorded reports 0 over 0 days, which callers
// must render as "not recorded" rather than as a genuine zero.
//
// LOGGED days, deliberately — and that is where this parts company with
// get_trends, which divides the same nutrients by every CALENDAR day in the
// window. Both are right for their own question ("what does a day I eat look
// like?" vs. "what am I averaging over the month?"), so issue #70 was closed by
// DISCLOSING the divergence rather than unifying it: a 15-of-30-days window
// legitimately reads 2000 kcal here and 1000 kcal there. Each side now names
// its own denominator in its text output (loggedDayAverageNote below, and the
// calendar-day note in insights.ts). Silently switching either one would
// rewrite the figures every existing user's history is built on.
export function rangeAverages(
    perDay: Array<{ meals: Meal[]; totals: DailyTotals }>,
): {
    averages: DailyTotals;
    recordedDays: {
        fiber_g: number;
        sugar_g: number;
        alcohol_g: number;
        caffeine_mg: number;
    };
} {
    const sum = emptyTotals();
    for (const { totals } of perDay) {
        sum.calories += totals.calories;
        sum.protein_g += totals.protein_g;
        sum.carbs_g += totals.carbs_g;
        sum.fat_g += totals.fat_g;
        sum.water_ml += totals.water_ml;
    }
    const mealsByDay = perDay.map((d) => d.meals);
    const fiber = coveredDailyAverage(mealsByDay, "fiber_g");
    const sugar = coveredDailyAverage(mealsByDay, "sugar_g");
    const alcohol = coveredDailyAverage(mealsByDay, "alcohol_g");
    const caffeine = coveredDailyAverage(mealsByDay, "caffeine_mg");
    const n = perDay.length || 1;
    return {
        averages: {
            calories: sum.calories / n,
            protein_g: sum.protein_g / n,
            carbs_g: sum.carbs_g / n,
            fat_g: sum.fat_g / n,
            fiber_g: fiber.avg ?? 0,
            sugar_g: sugar.avg ?? 0,
            alcohol_g: alcohol.avg ?? 0,
            caffeine_mg: caffeine.avg ?? 0,
            water_ml: Math.round(sum.water_ml / n),
        },
        recordedDays: {
            fiber_g: fiber.days,
            sugar_g: sugar.days,
            alcohol_g: alcohol.days,
            caffeine_mg: caffeine.days,
        },
    };
}

/** The model-facing half of the #70 fix: says out loud that these averages
 *  divide by logged days, and that get_trends will therefore print a smaller
 *  number for the same window. Empty when the window is fully logged — the two
 *  denominators coincide there, so the note would be pure noise on the common
 *  path. Pure and exported so the exact shipped wording is testable without
 *  standing up the whole tool. */
export function loggedDayAverageNote(
    loggedDays: number,
    daysInRange: number,
): string {
    if (loggedDays >= daysInRange) return "";
    return `\n\n(Daily averages are per logged day — ${loggedDays} of the ${daysInRange} days in range. get_trends averages over all ${daysInRange} calendar days instead, so its daily figures will be lower.)`;
}

// insights.ts is deliberately free of Supabase, so it cannot know about the
// per-user opt-in: it renders an alcohol line whenever the data contains any
// (see hasAnyPositive there). Zeroing the series is how the flag reaches it —
// both computeTrends and computeWeeklyDigest suppress alcohol on an all-zero
// series, and neither derives anything else from it. Cheap: the buckets are
// per-request and at most 365 shallow copies.
//
// Alcohol only. The spread copies caffeine_mg through untouched, which is the
// intent: caffeine has no opt-in flag to reach insights.ts with, and there
// hasAnyPositive alone decides whether its line is drawn.
export function gateAlcohol(
    buckets: DailyBucket[],
    alcohol: AlcoholDisplay,
): DailyBucket[] {
    if (alcohol) return buckets;
    return buckets.map((b) => ({ ...b, alcohol_g: 0 }));
}

function sumWater(entries: WaterEntry[]): number {
    let total = 0;
    for (const e of entries) total += e.amount_ml;
    return total;
}

// Per-meal macro breakdown handed to the widgets so tapping a macro ring can
// reveal which meals contributed to it. `date` is null for single-day views
// (the widget labels each row by meal type instead) and set to YYYY-MM-DD for
// multi-day ranges so the widget can tag each meal with its day.
export const MEAL_BREAKDOWN_ITEM = z.object({
    description: z.string(),
    meal_type: z.string().nullable(),
    date: z.string().nullable(),
    calories: z.number(),
    protein_g: z.number(),
    carbs_g: z.number(),
    fat_g: z.number(),
    fiber_g: z.number(),
    sugar_g: z.number(),
    // Nullable where the other macros are not: null is how every structured
    // payload says "this user does not track alcohol", which a 0 could not
    // distinguish from a genuinely alcohol-free day.
    alcohol_g: z.number().nullable(),
    // Nullable for the neighbouring reason with no flag behind it: this meal
    // simply has no caffeine figure. Most meals never will, so a 0 here would
    // claim the user measured a caffeine-free lunch. Milligrams.
    caffeine_mg: z.number().nullable(),
});

export function mealBreakdown(
    meals: Meal[],
    dateTz: string | null,
    alcohol: AlcoholDisplay,
) {
    return meals.map((m) => ({
        description: m.description,
        meal_type: m.meal_type ?? null,
        date: dateTz ? dateInTz(m.logged_at, dateTz) : null,
        calories: Math.round(m.calories ?? 0),
        protein_g: Math.round((m.protein_g ?? 0) * 10) / 10,
        carbs_g: Math.round((m.carbs_g ?? 0) * 10) / 10,
        fat_g: Math.round((m.fat_g ?? 0) * 10) / 10,
        fiber_g: Math.round((m.fiber_g ?? 0) * 10) / 10,
        sugar_g: Math.round((m.sugar_g ?? 0) * 10) / 10,
        alcohol_g: alcohol ? Math.round((m.alcohol_g ?? 0) * 10) / 10 : null,
        caffeine_mg:
            m.caffeine_mg == null ? null : Math.round(m.caffeine_mg * 10) / 10,
    }));
}

// Every goals / totals / averages payload in this file has the same shape, so
// they share one schema each (and one builder each, below) instead of four
// hand-maintained copies — which is what let three of them drift apart on the
// last field addition.
export const GOALS_ITEM = z.object({
    calories: z.number().nullable(),
    protein_g: z.number().nullable(),
    carbs_g: z.number().nullable(),
    fat_g: z.number().nullable(),
    fiber_g: z.number().nullable(),
    sugar_g: z.number().nullable(),
    alcohol_g: z.number().nullable(),
    // The stored daily_caffeine_mg, in milligrams. A ceiling like sugar and
    // alcohol, and 0 is a real one ("none at all") rather than "unset".
    caffeine_mg: z.number().nullable(),
    water_ml: z.number().nullable(),
});

export const TOTALS_ITEM = z.object({
    calories: z.number(),
    protein_g: z.number(),
    carbs_g: z.number(),
    fat_g: z.number(),
    fiber_g: z.number(),
    sugar_g: z.number(),
    alcohol_g: z.number().nullable(),
    // Nullable where fiber_g and sugar_g are not, and for a reason no other
    // total has: those two are shown as 0 on a day that never recorded them
    // (defensible — the day did happen), but a caffeine 0 against a limit is
    // the fabricated "0 mg vs goal" this feature is not allowed to invent. Null
    // means nothing on this day recorded caffeine; the widget then draws no
    // stat line at all. See totalsPayloadOf's caffeineRecorded argument.
    caffeine_mg: z.number().nullable(),
    water_ml: z.number(),
});

// get_trends' per-day series shape: like TOTALS_ITEM, but fiber_g/sugar_g are
// nullable too. Everywhere else a day's totals are a real sum for that one
// day, so 0 is unambiguous — but the trends widget re-averages this series
// CLIENT-SIDE across a slice of days (see trends.html's avgOf), and there a
// summed 0 on a day that never recorded fiber/sugar is indistinguishable from
// a real zero. Null is the "not recorded" signal, built by trendsDayPayloadOf.
export const TRENDS_DAY_ITEM = TOTALS_ITEM.extend({
    date: z.string(),
    fiber_g: z.number().nullable(),
    sugar_g: z.number().nullable(),
});

// Which standard-drink convention the widget should render alcohol_g in. The
// payloads carry canonical grams, so without this a UK user saw "US drinks" in
// the widget while the text output beside it said "UK units". Null doubles as
// the "user has alcohol tracking off" signal, matching AlcoholDisplay — the
// widget hides the stat line entirely rather than picking a default.
const DRINK_UNIT_FIELD = z.enum(["us", "uk"]).nullable();

// log_meal and update_meal share the same MCP Apps widget
// (public/widgets/meal-logged.html). Both declare this identical output shape
// and both build their payload via buildMealProgress() below, so the widget can
// render either result; `action` only changes the header wording.
const MEAL_PROGRESS_OUTPUT_SCHEMA = {
    action: z.enum(["logged", "updated"]),
    date: z.string(),
    drink_unit: DRINK_UNIT_FIELD,
    logged_meal: z.object({
        description: z.string(),
        meal_type: z.string().nullable(),
        calories: z.number().nullable(),
        protein_g: z.number().nullable(),
        carbs_g: z.number().nullable(),
        fat_g: z.number().nullable(),
        fiber_g: z.number().nullable(),
        sugar_g: z.number().nullable(),
        alcohol_g: z.number().nullable(),
        // Milligrams, and null whenever this meal carried no caffeine figure —
        // which is most meals, and is not the same as a measured zero.
        caffeine_mg: z.number().nullable(),
    }),
    has_goals: z.boolean(),
    goals: GOALS_ITEM.nullable(),
    totals: TOTALS_ITEM,
    meals: z.array(MEAL_BREAKDOWN_ITEM),
};

// Both payloads carry alcohol as a nullable number for the same reason
// MEAL_BREAKDOWN_ITEM does. These two builders are the only places a goals or
// totals literal is written: a .nullable() field is REQUIRED in the emitted JSON
// Schema, so an omitted key is a validation error rather than a null, and one
// builder per shape is what keeps every literal complete.
export function goalsPayloadOf(
    goals: NutritionGoals | null,
    alcohol: AlcoholDisplay,
) {
    if (!goals) return null;
    return {
        calories: goals.daily_calories ?? null,
        protein_g: goals.daily_protein_g ?? null,
        carbs_g: goals.daily_carbs_g ?? null,
        fat_g: goals.daily_fat_g ?? null,
        fiber_g: goals.daily_fiber_g ?? null,
        sugar_g: goals.daily_sugar_g ?? null,
        alcohol_g: alcohol ? (goals.daily_alcohol_g ?? null) : null,
        // No gate: caffeine has no alcohol_tracking_enabled equivalent, so the
        // stored limit is always handed over and the widget decides on the data
        // (a stat line appears only once some value is recorded).
        caffeine_mg: goals.daily_caffeine_mg ?? null,
        water_ml: goals.daily_water_ml ?? null,
    };
}

/** `caffeineRecorded` is dayCarries("caffeine_mg") for whatever meals produced
 *  these totals — or, for an average, whether ANY day in the window recorded
 *  caffeine. False emits null instead of the summed 0, because for caffeine
 *  those two mean genuinely different things and only one of them is true. It
 *  is a required argument rather than a defaulted one so that every call site
 *  has to answer the question; a caller that forgets it gets null, which is the
 *  safe answer (a hidden stat line) rather than an invented zero. */
export function totalsPayloadOf(
    totals: DailyTotals,
    alcohol: AlcoholDisplay,
    caffeineRecorded: boolean,
) {
    return {
        calories: Math.round(totals.calories),
        protein_g: Math.round(totals.protein_g * 10) / 10,
        carbs_g: Math.round(totals.carbs_g * 10) / 10,
        fat_g: Math.round(totals.fat_g * 10) / 10,
        fiber_g: Math.round(totals.fiber_g * 10) / 10,
        sugar_g: Math.round(totals.sugar_g * 10) / 10,
        alcohol_g: alcohol ? Math.round(totals.alcohol_g * 10) / 10 : null,
        caffeine_mg: caffeineRecorded
            ? Math.round(totals.caffeine_mg * 10) / 10
            : null,
        water_ml: totals.water_ml,
    };
}

// get_trends ships this per day in its `days` series, which the widget slices
// to 7/14/30 and re-averages CLIENT-SIDE (see trends.html's avgOf) instead of
// round-tripping to the server. totalsPayloadOf sums fiber/sugar/alcohol with
// `?? 0`, so a day that never recorded them is indistinguishable from a real
// zero — the widget's average then divides by every day in the slice instead
// of the covered ones, drifting from the text output's `coveredSeries` rule
// (src/insights.ts). Null here is that missing-vs-zero signal, mirroring
// dayCarries/coveredDailyAverage; alcohol_g can already be null for tracking
// being off, which takes precedence over the per-day coverage null. caffeine_mg
// needs no override below — TOTALS_ITEM already declares it nullable, so
// totalsPayloadOf applies the same rule for it one level down.
export function trendsDayPayloadOf(
    bucket: DailyBucket,
    alcohol: AlcoholDisplay,
) {
    const totals = totalsPayloadOf(
        {
            calories: bucket.calories,
            protein_g: bucket.protein_g,
            carbs_g: bucket.carbs_g,
            fat_g: bucket.fat_g,
            fiber_g: bucket.fiber_g,
            sugar_g: bucket.sugar_g,
            alcohol_g: bucket.alcohol_g,
            caffeine_mg: bucket.caffeine_mg,
            water_ml: bucket.waterMl,
        },
        alcohol,
        dayCarries(bucket.meals, "caffeine_mg"),
    );
    return {
        date: bucket.date,
        ...totals,
        fiber_g: dayCarries(bucket.meals, "fiber_g") ? totals.fiber_g : null,
        sugar_g: dayCarries(bucket.meals, "sugar_g") ? totals.sugar_g : null,
        alcohol_g:
            totals.alcohol_g == null
                ? null
                : dayCarries(bucket.meals, "alcohol_g")
                  ? totals.alcohol_g
                  : null,
    };
}

// ---------- bulk_import_meals ----------

// Ceiling on total rows per user. Rate limiting is per HTTP request, so one
// batched call writes up to MAX_ROWS_PER_CALL rows for a single limiter hit;
// without this there is no bound on table growth. Set far above any real user:
// 200k rows is ~180 years at three meals a day.
const MAX_MEALS_PER_USER = 200_000;

// Deliberately permissive: bounds live in validateRow so a single bad cell
// produces an identified per-row error instead of a Zod rejection that discards
// the whole batch (and the structured report with it). z.coerce mirrors
// log_meal, whose numbers are coerced because models emit "450" as a string.
const IMPORT_ROW_SCHEMA = z.object({
    source_line: z.coerce
        .number()
        .describe(
            "1-based line number of this row in the source file. Required: the server checks that line numbers are unique and increasing to detect dropped or duplicated rows.",
        ),
    description: z
        .string()
        .optional()
        .describe(
            "What was eaten. Include the portion in the text, e.g. 'Oatmeal (1 cup dry) with banana'. Omit only when the source has no food name at all.",
        ),
    logged_at: z
        .string()
        .optional()
        .describe(
            "When it was eaten. Accepts 'YYYY-MM-DD' (logged at local noon), 'YYYY-MM-DDTHH:mm' as LOCAL time in the user's timezone, or full ISO 8601 with an offset. Prefer local time straight from the file: do NOT compute UTC offsets yourself.",
        ),
    timezone: z
        .string()
        .optional()
        .describe(
            "IANA timezone (e.g. 'Europe/Kyiv') this row's logged_at should be read in, when logged_at carries no offset. Map it from a 'timezone' column when the file is an export from THIS server (export_meals writes one) — that column names the zone the meal was actually recorded in, which may no longer match the account's current timezone. Omit for files with no such column; the row then falls back to the account's configured timezone.",
        ),
    meal_type: z
        .string()
        .optional()
        .describe(
            "breakfast, lunch, dinner or snack. Case-insensitive; unrecognized values become snack. Omit when the source has no meal column and it will be inferred from the time.",
        ),
    calories: z.coerce.number().optional(),
    protein_g: z.coerce.number().optional(),
    carbs_g: z.coerce.number().optional(),
    fat_g: z.coerce.number().optional(),
    fiber_g: z.coerce.number().optional().describe("Dietary fiber in grams."),
    sugar_g: z.coerce
        .number()
        .optional()
        .describe(
            "TOTAL sugars in grams, including sugar naturally present in fruit and milk — not added sugar. Map the export's 'Sugars' column straight across; do not try to subtract naturally occurring sugar.",
        ),
    alcohol_g: z.coerce
        .number()
        .optional()
        .describe(
            "Grams of pure ethanol (NOT the volume of the drink and NOT its ABV). If the export gives a drink volume and strength instead, compute it: grams = millilitres x (ABV% / 100) x 0.789. Omit when the source has no alcohol column.",
        ),
    caffeine_mg: z.coerce
        .number()
        .optional()
        .describe(
            "Caffeine in MILLIGRAMS, not grams. Every export, label and guideline states caffeine in mg (a brewed coffee is about 95 mg, i.e. 0.095 g), so map an mg column straight across — and multiply by 1000 first if the source header says grams, or the whole history imports a thousand times too small. Omit when the source has no caffeine column.",
        ),
    notes: z
        .string()
        .optional()
        .describe(
            "Anything from the source worth keeping that has no column here (micronutrients, the original row text).",
        ),
    client_row_id: z
        .string()
        .optional()
        .describe(
            "Optional label echoed back in the result so you can match errors to your own rows.",
        ),
    source_id: z
        .string()
        .optional()
        .describe(
            "The value of the 'id' column when the file is an export from THIS server (export_meals writes it). Always pass it through: it is how a re-imported backup is recognized as the user's existing meals instead of being duplicated. Ignored for files from other apps.",
        ),
});

// ---------- start_meal_import ----------

// Real content: the import widget needs all of this. With no structuredContent
// the bridge never paints and the iframe sits on its loading state forever.
export const START_IMPORT_OUTPUT_SCHEMA = {
    tz: z.string(),
    tz_configured: z.boolean(),
    today: z.string(),
    max_rows_per_call: z.number(),
    import_tool_name: z.string(),
    known_source_apps: z.array(z.string()),
    widgets_enabled: z.boolean(),
    // The alcohol opt-in, reaching the importer the same way it reaches every
    // other widget-backed tool. Without it the widget auto-mapped an
    // `alcohol`/`ethanol` column and rendered a per-row ALC preview for a user
    // who had asked never to see alcohol — the exact scenario the opt-in
    // exists to prevent. What null makes the widget do: see startImportPayload.
    drink_unit: DRINK_UNIT_FIELD,
};

export function startImportPayload(opts: {
    tz: string;
    tzConfigured: boolean;
    widgetsEnabled: boolean;
    alcohol: AlcoholDisplay;
}) {
    return {
        // The widget must resolve dates the same way the server will, so it is
        // told the timezone rather than guessing.
        tz: opts.tz,
        tz_configured: opts.tzConfigured,
        today: todayInTz(opts.tz),
        max_rows_per_call: MAX_ROWS_PER_CALL,
        import_tool_name: "bulk_import_meals",
        known_source_apps: [
            "myfitnesspal",
            "cronometer",
            "loseit",
            "macrofactor",
        ],
        widgets_enabled: opts.widgetsEnabled,
        // Null = alcohol tracking is off. The importer then does not auto-map
        // an alcohol column, does not render the ALC preview column, and does
        // NOT send alcohol_g — the file's alcohol never reaches the screen and
        // never reaches the database by this route.
        //
        // Why this route drops it, when CONTRACT §7 says alcohol is stored
        // whenever it is explicitly passed: in this flow the preview IS the
        // contract. The whole reason start_meal_import is preferred over
        // bulk_import_meals is that the user reads and approves every row
        // themselves instead of a model transcribing it. Writing a column that
        // was deliberately never shown breaks that promise and leaves an
        // unverifiable number in the log — one the user cannot audit, because
        // the only surface that would display it is the one their opt-out
        // turned off. Note the gate is the widget's, not the write layer's:
        // bulk_import_meals stores alcohol_g for any caller that passes it,
        // tracking on or off, and that is unchanged.
        //
        // The cost, which is real and is why the widget says so out loud: the
        // loss is permanent, not merely deferred. alcohol_g is deliberately
        // excluded from the import digest (CONTRACT §2), so re-importing the
        // same file after turning tracking on dedupes to a clean no-op and
        // back-fills nothing. There is no second chance. The widget therefore
        // shows an explicit notice when the file HAS an alcohol column and
        // tracking is off — that it will not be imported, and that enabling
        // tracking before importing is how to keep it. Silent would be
        // indefensible; announced, it is the user's call to make.
        drink_unit: opts.alcohol,
    };
}

// Compute the day's running totals vs goals for a meal that was just logged or
// updated, packaging both the model-facing progress text and the meal-logged
// widget's structuredContent. Shared by log_meal and update_meal so the two
// tools stay in lockstep.
async function buildMealProgress(
    userId: string,
    meal: Meal,
    action: "logged" | "updated",
    alcohol: AlcoholDisplay,
) {
    const tz = await getUserTimezone(userId);
    const mealDate = dateInTz(meal.logged_at, tz);
    const [meals, waterEntries, goals] = await Promise.all([
        getMealsByDate(userId, mealDate, tz),
        getWaterByDate(userId, mealDate, tz),
        getNutritionGoals(userId),
    ]);
    const totals = sumMeals(meals);
    totals.water_ml = sumWater(waterEntries);
    const present = nutrientPresence(meals);

    const progressSection = goals
        ? `\n\nDaily progress (${mealDate}):\n${formatProgress(totals, goals, alcohol, present)}`
        : "\n\nNo nutrition goals set — use the set_nutrition_goals tool to track progress against daily targets.";

    const structuredContent = {
        action,
        date: mealDate,
        drink_unit: alcohol,
        logged_meal: {
            description: meal.description,
            meal_type: meal.meal_type ?? null,
            calories: meal.calories ?? null,
            protein_g: meal.protein_g ?? null,
            carbs_g: meal.carbs_g ?? null,
            fat_g: meal.fat_g ?? null,
            fiber_g: meal.fiber_g ?? null,
            sugar_g: meal.sugar_g ?? null,
            alcohol_g: alcohol ? (meal.alcohol_g ?? null) : null,
            // Ungated, unlike alcohol_g directly above it: what was stored is
            // what is shown.
            caffeine_mg: meal.caffeine_mg ?? null,
        },
        has_goals: goals != null,
        goals: goalsPayloadOf(goals, alcohol),
        totals: totalsPayloadOf(totals, alcohol, present.caffeine_mg),
        // Single day → label rows by meal type in the widget, not by date.
        meals: mealBreakdown(meals, null, alcohol),
    };

    return { progressSection, structuredContent };
}

// Which way a target points. A floor is something to reach (calories, protein,
// carbs, fat, water, fiber); a ceiling is something to stay under (sugar,
// alcohol, caffeine). The distinction is not cosmetic: with the floor wording a
// 40 g sugar target and 0 g eaten reads "40g to go", which congratulates the
// user for having sugar left to consume.
type GoalDirection = "floor" | "ceiling";

// Whether a stored target is a target at all. Zero splits by direction: a
// CEILING of 0 is a real limit — "none at all" is the single most likely
// alcohol goal anyone sets, and the old `target <= 0` guard let such a goal be
// stored, echoed back by get_nutrition_goals, and then silently ignored on
// every progress line, which is worse than refusing it. A FLOOR of 0 stays
// "unset": a 0 g protein target is meaningless. Negatives are rejected in both
// directions, and so is NaN (z.coerce turns "" into NaN).
export function hasActiveTarget(
    target: number | null | undefined,
    direction: GoalDirection = "floor",
): target is number {
    if (target == null || Number.isNaN(target)) return false;
    return direction === "ceiling" ? target >= 0 : target > 0;
}

// `actualText` overrides how the consumed amount is printed, for values whose
// natural rendering is not "<number><unit>" — alcohol, which always carries its
// drinks gloss (see formatAlcohol). Everything else passes it as undefined.
export function formatGoalLine(
    label: string,
    unit: string,
    actual: number,
    target: number | null,
    direction: GoalDirection = "floor",
    actualText?: string,
): string {
    const rounded = Math.round(actual * 10) / 10;
    if (!hasActiveTarget(target, direction)) {
        // Standalone, so the amount carries the unit itself.
        return `${label}: ${actualText ?? `${rounded}${unit}`}`;
    }
    const shown = actualText ?? String(rounded);
    const delta = Math.round((target - actual) * 10) / 10;
    if (direction === "ceiling") {
        // A limit is not a budget. "40g left" handed someone trying to drink or
        // sweeten less a daily permission slip, and on an averaged view
        // ("7-day average, 12.1 g left") it means nothing at all. Report the
        // position relative to the limit instead, matching the "Days over
        // limit" phrasing computeTrends already uses.
        //
        // A limit of 0 gets no percentage: every ratio against it is Infinity
        // or NaN. "clear" is the word computeWeeklyDigest uses for the same
        // case, so the two narratives read alike.
        const pct =
            target > 0 ? `${Math.round((actual / target) * 100)}%, ` : "";
        const state =
            delta < 0
                ? `${Math.abs(delta)}${unit} over`
                : target === 0
                  ? "clear"
                  : "under";
        return `${label}: ${shown} / ${target}${unit} limit (${pct}${state})`;
    }
    const pct = Math.round((actual / target) * 100);
    const deltaStr =
        delta > 0 ? `${delta}${unit} to go` : `${Math.abs(delta)}${unit} over`;
    // Against a target the unit sits on the target only ("1500 / 2000 kcal") —
    // unchanged from before this gained a direction.
    return `${label}: ${shown} / ${target}${unit} (${pct}%, ${deltaStr})`;
}

// A nutrient nobody recorded is not a zero. Fiber, sugar and caffeine each
// arrived long after most of the history in this database, so "0g" on a day
// whose meals predate them is a fabricated figure — say nothing instead (the
// same instinct as hasAnyPositive() in insights.ts). The exception is a day
// with an active target, where a vanished line would read as tracking having
// broken; "not recorded" still refuses to invent the number.
function recordedGoalLine(
    label: string,
    unit: string,
    actual: number,
    target: number | null,
    recorded: boolean,
    direction: GoalDirection,
): string | null {
    if (recorded) return formatGoalLine(label, unit, actual, target, direction);
    if (!hasActiveTarget(target, direction)) return null;
    const noun = direction === "ceiling" ? "limit" : "target";
    return `${label}: not recorded / ${target}${unit} ${noun}`;
}

// Everything recorded, for the callers that have no per-meal list to inspect.
const ALL_RECORDED: NutrientPresence = {
    fiber_g: true,
    sugar_g: true,
    alcohol_g: true,
    caffeine_mg: true,
};

// Caffeine is the one figure here rendered without decimals. A tenth of a
// milligram is below the precision of any label, database or export, and
// "95.5 mg" claims a measurement nobody made; the structured payloads keep the
// sibling `* 10 / 10` rounding, but the model-facing text is whole milligrams.
function formatMg(mg: number): string {
    return `${Math.round(mg)} mg`;
}

// `present` says which of the post-launch nutrients these meals actually carry,
// so a pre-feature day prints nothing for fiber rather than a made-up "0g".
// Fiber, sugar and caffeine consult it; alcohol does not, because it has its
// own explicit opt-in, and for a user who turned it ON a zero is the meaningful
// reading — that is exactly the "0 g against a 0 g limit" a recovery user set
// the limit to see. Caffeine leans on `present` hardest: it is the only gate it
// has, since there is deliberately no caffeine_tracking_enabled.
export function formatProgress(
    totals: DailyTotals,
    goals: NutritionGoals | null,
    alcohol: AlcoholDisplay,
    present: NutrientPresence = ALL_RECORDED,
): string {
    const lines: Array<string | null> = [
        formatGoalLine(
            "Calories",
            " kcal",
            totals.calories,
            goals?.daily_calories ?? null,
        ),
        formatGoalLine(
            "Protein",
            "g",
            totals.protein_g,
            goals?.daily_protein_g ?? null,
        ),
        formatGoalLine(
            "Carbs",
            "g",
            totals.carbs_g,
            goals?.daily_carbs_g ?? null,
        ),
        formatGoalLine("Fat", "g", totals.fat_g, goals?.daily_fat_g ?? null),
        recordedGoalLine(
            "Fiber",
            "g",
            totals.fiber_g,
            goals?.daily_fiber_g ?? null,
            present.fiber_g,
            "floor",
        ),
        recordedGoalLine(
            "Sugar",
            "g",
            totals.sugar_g,
            goals?.daily_sugar_g ?? null,
            present.sugar_g,
            "ceiling",
        ),
    ];
    // Alcohol is opt-in: stored either way, shown only when the user asked for
    // it (imported exports carry trace alcohol from recipes, and surfacing that
    // unbidden is actively harmful for someone in recovery).
    if (alcohol) {
        lines.push(
            formatGoalLine(
                "Alcohol",
                "g",
                totals.alcohol_g,
                goals?.daily_alcohol_g ?? null,
                "ceiling",
                formatAlcohol(totals.alcohol_g, alcohol),
            ),
        );
    }
    // No opt-in to consult — `present.caffeine_mg` is the whole gate. Rounded to
    // whole milligrams before the line is built (see formatMg) so both the
    // with-target and the standalone wording stay decimal-free.
    lines.push(
        recordedGoalLine(
            "Caffeine",
            " mg",
            Math.round(totals.caffeine_mg),
            goals?.daily_caffeine_mg ?? null,
            present.caffeine_mg,
            "ceiling",
        ),
    );
    lines.push(
        formatGoalLine(
            "Water",
            " ml",
            totals.water_ml,
            goals?.daily_water_ml ?? null,
        ),
    );
    return lines.filter((l): l is string => l !== null).join("\n");
}

export function formatGoals(
    goals: NutritionGoals | null,
    weightUnit: WeightUnit = "kg",
    alcohol: AlcoholDisplay = null,
): string {
    if (!goals) {
        return "No nutrition goals set. Use set_nutrition_goals to define daily targets.";
    }
    // "not set" must mean exactly what formatGoalLine ignores, or the echo
    // promises a target that no progress line will ever honour — which is how a
    // 0 g alcohol limit came to be stored, listed, and then quietly dropped.
    // Floors: 0 is unset. Ceilings: 0 is a real limit and is listed as one.
    const floor = (v: number | null, render: (n: number) => string) =>
        hasActiveTarget(v, "floor") ? render(v) : "not set";
    const ceiling = (v: number | null, render: (n: number) => string) =>
        hasActiveTarget(v, "ceiling") ? render(v) : "not set";
    const parts: string[] = ["Current daily goals:"];
    parts.push(
        `- Calories: ${floor(goals.daily_calories, (n) => `${n} kcal`)}`,
    );
    parts.push(`- Protein: ${floor(goals.daily_protein_g, (n) => `${n}g`)}`);
    parts.push(`- Carbs: ${floor(goals.daily_carbs_g, (n) => `${n}g`)}`);
    parts.push(`- Fat: ${floor(goals.daily_fat_g, (n) => `${n}g`)}`);
    parts.push(`- Fiber: ${floor(goals.daily_fiber_g, (n) => `${n}g`)}`);
    parts.push(
        `- Sugar (total, max): ${ceiling(goals.daily_sugar_g, (n) => `${n}g`)}`,
    );
    if (alcohol) {
        parts.push(
            `- Alcohol (max): ${ceiling(goals.daily_alcohol_g, (n) => formatAlcohol(n, alcohol))}`,
        );
    }
    // Always listed, unlike alcohol: the goal echo is where the model learns a
    // caffeine limit can be set at all, and there is no opt-in to hide it
    // behind. Data-driven suppression applies to recorded VALUES, not to the
    // list of targets the user could set.
    parts.push(
        `- Caffeine (max): ${ceiling(goals.daily_caffeine_mg, formatMg)}`,
    );
    parts.push(`- Water: ${floor(goals.daily_water_ml, (n) => `${n} ml`)}`);
    parts.push(
        `- Target weight: ${goals.target_weight_g != null ? formatWeight(goals.target_weight_g, weightUnit) : "not set"}`,
    );
    return parts.join("\n");
}

function formatWeightEntry(entry: WeightEntry, unit: WeightUnit): string {
    return `- ${formatWeight(entry.weight_g, unit)} at ${entry.logged_at}${entry.notes ? ` (${entry.notes})` : ""} [id: ${entry.id}]`;
}

// Shared `logged_at` description for every manual write tool. The three forms
// and the "don't convert to UTC yourself" rule are the whole point: a model
// knows the wall-clock time the user just said, but not the zone's historical
// offset for that date, and guessing it lands the entry on the wrong day.
const LOGGED_AT_FORMS =
    'Accepts a full ISO 8601 timestamp with an offset or Z ("2026-01-05T08:30:00+02:00"), an offset-less local time ("2026-01-05T08:30"), or a bare date ("2026-01-05", anchored at local noon). Offset-less values are resolved in the user\'s saved timezone, so pass the local time exactly as the user gives it and do NOT convert it to UTC yourself.';

// Appended to `logged_at` on the three "log it now" tools. This used to say
// "ask the user" — which fired on every single log from any host that keeps the
// wall clock out of the model's context (Claude Desktop among them), turning
// "I just ate X" into an interrogation, or worse a guessed time on the wrong
// day (issue #102). Omitting the field is strictly better than guessing: the
// server stamps `new Date()` and it genuinely knows the time.
const LOGGED_AT_OMIT_IF_NOW =
    " Do NOT ask the user what time it is. If you don't know the current date or time, omit this field entirely and the server stamps the entry with the current time. Only supply it for an entry that happened at some other moment, and call get_current_time if you need the user's local clock to work that moment out.";

// The one rendering of "what time is it for this user", shared by
// get_current_time and get_timezone so the two can never disagree. The weekday
// is there to make "last Monday" resolvable without a second round trip, and
// the UTC instant so a caller can check its own clock against ours. Local time
// is the repo-standard "YYYY-MM-DD HH:mm:ss" wall clock — deliberately not an
// offset-less ISO string, which reads as a machine value a caller might echo
// straight back into logged_at without noticing it has gone stale.
function formatClockLine(tz: string): string {
    const now = new Date();
    return `Local time now: ${weekdayInTz(now, tz)} ${formatLocalDateTime(now, tz)} (${tz}). UTC now: ${now.toISOString()}.`;
}

// Resolve a caller-supplied `logged_at` to an absolute instant before it
// reaches the timestamptz column. Without this an offset-less string is read in
// the database session's zone (UTC), so a Kyiv user's 21:00 lands at midnight
// on the NEXT day and the tool's own progress line contradicts itself.
// "Configured" is `timezoneFromProfile(profile) !== null`, not `profile !==
// null`: the other set_* tools upsert a profile that never touches timezone,
// so the row's mere existence is not evidence the user ever chose a zone
// (#99).
//
// The unset-timezone hint has to be attached on the failure path too: read as
// UTC, an offset-less local time from a user east of UTC can resolve to a
// future instant and be rejected, and "logged_at is in the future" on its own
// names the wrong cause and gives the caller nothing to act on.
//
// It also has to fire when `raw` is omitted entirely — by far the most common
// call shape, since "I just ate this" never carries a logged_at. The instant
// itself doesn't need the timezone (the DB stamps "now" either way), but every
// read path still buckets the entry into a local day using the same unset
// profile, so staying silent here left the migration's whole warning
// unreachable in practice (found live: a meal logged with no logged_at and no
// profile timezone produced no warning at all).
async function resolveWriteTimestamp(
    userId: string,
    raw: string | undefined,
): Promise<{ iso: string | undefined; note: string }> {
    const profile = await getProfile(userId);
    const tz = timezoneFromProfile(profile);
    const unsetTzNote = (value: string) =>
        `${JSON.stringify(value)} carries no UTC offset and this account has no timezone set, so it was read as UTC. Set one with set_timezone.`;

    if (raw === undefined) {
        const note =
            tz === null
                ? "\n\nNote: this account has no timezone set, so today's date is being read in UTC — set one with set_timezone."
                : "";
        return { iso: undefined, note };
    }

    let resolved;
    try {
        resolved = resolveWriteLoggedAt(raw, tz ?? "UTC", Date.now());
    } catch (err) {
        if (
            err instanceof LoggedAtError &&
            err.usedProfileTimezone &&
            tz === null
        ) {
            throw new Error(`${err.message} ${unsetTzNote(raw)}`);
        }
        throw err;
    }

    const note =
        resolved.usedProfileTimezone && tz === null
            ? `\n\nNote: ${unsetTzNote(raw)} Then re-check this entry.`
            : "";
    return { iso: resolved.instant.toISOString(), note };
}

// Resolve the unit to use when WRITING a weight value: an explicit unit wins,
// otherwise the user's saved preference. If neither exists, refuse rather than
// guess — silently assuming kg for someone who meant lb is exactly the mis-log
// this feature exists to prevent.
async function resolveWriteWeightUnit(
    userId: string,
    explicit: WeightUnit | undefined,
): Promise<WeightUnit> {
    return pickWriteUnit(explicit, await getPreferredWeightUnit(userId));
}

// Reject magnitude mistakes (value typed in grams, an extra digit, a sub-unit
// typo). Suggests the other unit when the same number would be plausible there.
function assertPlausibleWeight(grams: number, unit: WeightUnit): void {
    if (isPlausibleWeightGrams(grams)) return;
    const other: WeightUnit = unit === "kg" ? "lb" : "kg";
    const asOther = toGrams(fromGrams(grams, unit), other);
    const hint = isPlausibleWeightGrams(asOther)
        ? ` If you meant ${fromGrams(grams, unit)} ${other}, pass unit: '${other}'.`
        : "";
    throw new Error(
        `${formatWeight(grams, unit)} is outside the plausible body-weight range (20–500 kg / 44–1102 lb). Double-check the number and unit.${hint}`,
    );
}

export function formatMeal(meal: Meal, alcohol: AlcoholDisplay = null): string {
    const parts = [
        `ID: ${meal.id}`,
        `Time: ${meal.logged_at}`,
        meal.meal_type ? `Type: ${meal.meal_type}` : null,
        `Description: ${meal.description}`,
        meal.calories != null ? `Calories: ${meal.calories}` : null,
        meal.protein_g != null ? `Protein: ${meal.protein_g}g` : null,
        meal.carbs_g != null ? `Carbs: ${meal.carbs_g}g` : null,
        meal.fat_g != null ? `Fat: ${meal.fat_g}g` : null,
        meal.fiber_g != null ? `Fiber: ${meal.fiber_g}g` : null,
        meal.sugar_g != null ? `Sugar: ${meal.sugar_g}g` : null,
        // Opt-in (see formatProgress): a stored value stays hidden until the
        // user turns alcohol tracking on.
        alcohol && meal.alcohol_g != null
            ? `Alcohol: ${formatAlcohol(meal.alcohol_g, alcohol)}`
            : null,
        // Not opt-in: a stored value is always echoed. The `!= null` is the
        // only suppression, and it is per-meal — a sandwich shows no caffeine
        // line, a measured 0 mg energy-free drink shows "Caffeine: 0 mg".
        meal.caffeine_mg != null
            ? `Caffeine: ${formatMg(meal.caffeine_mg)}`
            : null,
        meal.notes ? `Notes: ${meal.notes}` : null,
    ];
    return parts.filter(Boolean).join("\n");
}

// The one thing that keeps the alcohol opt-in from being a trapdoor. Alcohol
// written while tracking is off is stored but invisible everywhere — no meal
// line, no goal line, no widget stat — so a user who says "log 2 beers" gets a
// silent no-op as far as they can tell, and nothing in any tool output or in
// SERVER_INSTRUCTIONS would ever tell them the feature exists. This appends a
// one-line note to the text output whenever a write actually carried alcohol
// and this user has the gate off.
//
// It REPORTS ONLY. It must never flip alcohol_tracking_enabled: the flag exists
// because surfacing alcohol unbidden is harmful to users in recovery, and
// "they logged a beer" is not consent to start showing it.
//
// `subject` is the clause before the comma, so each call site can name what was
// saved while the advice stays identical everywhere.
export function alcoholHiddenNote(
    carriedAlcohol: boolean,
    alcohol: AlcoholDisplay,
    subject: string,
): string {
    if (!carriedAlcohol || alcohol !== null) return "";
    return `\n\n(${subject}, but alcohol tracking is off for this account so it is not shown. Turn it on with set_alcohol_tracking.)`;
}

// Tool descriptions and SERVER_INSTRUCTIONS are advisory and are read once, at
// the top of a session; this note lands in the model's context at the exact
// moment it left a nutrient out, which is the only feedback in the loop. Same
// report-only shape as alcoholHiddenNote above — it never writes anything.
//
// Deliberately limited to fiber_g and sugar_g. Both are estimable for every
// food that exists, so a NULL on a meal the model just wrote is an omission and
// not a fact, and the cost is not one imperfect number: a null excludes the
// whole DAY from that nutrient's averages, goal lines and charts (dayCarries in
// insights.ts), so a forgotten fiber figure deletes the day from the trend.
//
// Caffeine is NOT checked here, and adding it would undo the suppression the
// rest of this file is built around: most meals genuinely carry none, its
// display gate is `!= null` rather than `> 0` (limitShown, recordedGoalLine,
// totalsPayloadOf), so nagging until every sandwich carries a figure produces
// precisely the fabricated "0 mg / 400 mg limit" that null exists to prevent.
export function missingNutrientNote(meal: Meal): string {
    const missing = [
        meal.fiber_g == null ? "fiber_g" : null,
        meal.sugar_g == null ? "sugar_g" : null,
    ].filter((f): f is string => f !== null);
    if (missing.length === 0) return "";
    return `\n\n(Not recorded on this meal: ${missing.join(", ")}. A missing value is not a zero — it leaves the whole day out of that nutrient's totals, averages and goal line. Estimate the value from the ingredients (0 where the food genuinely has none) and fill it in with update_meal, id ${meal.id}.)`;
}

// `alcohol` is the whole alcohol opt-in, threaded once: the drink unit to render
// grams in, or null when this user has alcohol tracking off. It is resolved from
// the profile in buildMcpServer (like widgetsEnabled) rather than re-read inside
// every handler, because a per-request server means one read serves the whole
// request and every formatter can take it as a plain argument.
//
// At the write layer it gates DISPLAY only. Alcohol passed to log_meal /
// update_meal / bulk_import_meals is always stored — dropping a value the caller
// explicitly sent would be silent data loss, and the flag exists to keep trace
// alcohol from imported recipes out of sight, not out of the database.
//
// The one place a null `alcohol` changes what gets WRITTEN is the import widget,
// which then declines to map the file's alcohol column at all rather than write
// a number it was forbidden to show the user for review. That is the widget's
// choice, announced to the user on screen, not a rule this server enforces — see
// startImportPayload for the full trade-off.
// Exported for tests: the only way to exercise a tool handler end-to-end
// (schema coercion, handler, response text) is to register the tools on a real
// McpServer and call them through a client. Production still reaches this only
// via buildMcpServer.
export function registerTools(
    server: McpServer,
    userId: string,
    widgetsEnabled: boolean,
    alcohol: AlcoholDisplay,
) {
    // Link a tool to its widget only when this user has widgets enabled. Because
    // buildMcpServer registers tools per request, this makes widget display a
    // per-user setting: with widgets off, tools/list advertises no UI link, so
    // hosts render no widget. Spreads to nothing when disabled.
    // "openai/outputTemplate" mirrors ui.resourceUri for ChatGPT: it has honored
    // the MCP Apps standard since 2026-02-22, but still reads the pre-standard
    // Apps SDK alias on some surfaces, and hosts that know neither key ignore
    // both. The two values must stay identical — ChatGPT drops the widget
    // silently if the alias points at an unregistered URI.
    const uiMeta = (resourceUri: string) =>
        widgetsEnabled
            ? {
                  _meta: {
                      ui: { resourceUri },
                      "openai/outputTemplate": resourceUri,
                  },
              }
            : {};

    server.registerTool(
        "log_meal",
        {
            title: "Log Meal",
            description:
                // The nutrient-completeness rule is spliced in from the shared
                // NUTRIENT_COVERAGE rather than restated, because
                // SERVER_INSTRUCTIONS carries the same paragraph and many hosts
                // surface only one of the two.
                "Log a meal entry with nutritional information. If the user doesn't specify the quantity or portion size, ask how much they ate before estimating calories and macros. When the user gives a barcode — typed, or read from a photo of the package (transcribe the digits printed under the barcode) — call lookup_barcode first to get the product's label data, then scale it to the amount eaten. Fall back to web search or estimation only when no product is found. Use web search for branded products when no barcode is available. When logging from a photo of a plated or prepared meal (no package/barcode): first identify each dish, then establish whether it is a restaurant/takeout meal or homemade before anything else. If it is from a restaurant, ask which restaurant and where, then search the web for its menu — chains publish per-item nutrition worth using directly, independent places usually publish ingredient lists that reveal the butter, cream, and oil the photo hides; if you cannot find the menu or cannot tell which dish it is, say so and put your assumption to the user as a question rather than presenting a guess as menu data. Either way, estimate portions in household measures the user can eyeball (a glass of, a handful of, a tablespoon of — NOT grams; for restaurant servings ask how much of it they actually ate), call search_meals to see how similar meals were logged before and to surface ingredients that may be invisible in the photo, then interview the user across multiple turns — one question per message, covering which variation each dish is, how much they ate, and photo-invisible ingredients (oil, sugar, sauce, what a drink was made with) — until nothing is left open. Do NOT call this tool after a single question-and-answer round; a lone confirmation is not enough. Only call it once every open question is resolved and the user has approved a full summary of the meal (or has told you to stop asking and just log it). Write the confirmed household-measure portions into the description itself (e.g. 'Oatmeal (1 glass raw oats, 2 glasses milk) with banana') so future searches are self-describing, and for a restaurant meal name the venue and city too (e.g. 'Pad thai with chicken (1 plate, finished) at Thai Basil, Podil, Kyiv').\n\n" +
                NUTRIENT_COVERAGE +
                "\nPutting '180 mg caffeine' or '6 g fiber' in notes or in the description instead of in the field leaves it out of every total, goal and chart.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: {
                description: z.string().describe("What was eaten"),
                meal_type: z
                    .enum(["breakfast", "lunch", "dinner", "snack"])
                    .describe(
                        "Type of meal (breakfast, lunch, dinner, or snack). Always ask the user if not provided.",
                    ),
                // Bounded in the schema, not the handler — see the MAX_*
                // constants for why this tool differs from bulk_import_meals.
                calories: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_CALORIES)
                    .optional()
                    .describe("Total calories"),
                protein_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe("Protein in grams"),
                carbs_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe("Carbohydrates in grams"),
                fat_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe("Fat in grams"),
                // Fiber and sugar carry reference anchors for the same reason
                // caffeine_mg does: the field is optional in the schema but
                // effectively mandatory in practice, so the model needs a last
                // resort that is better than skipping the field. See
                // NUTRIENT_COVERAGE for why an omission costs the whole day.
                fiber_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Dietary fiber in grams. Send this on every meal — treat it as mandatory alongside protein, carbs and fat, and estimate it rather than omitting it, because a missing value is not a zero and excludes the whole day from the user's fiber average and goal. Prefer a label or a barcode lookup, then a web search, then these anchors per 100 g: cooked lentils or beans 5-8 g, dry rolled oats 10 g, wholemeal bread 7 g, white bread 2.7 g, cooked wholewheat pasta 4 g (white 2 g), cooked brown rice 1.8 g (white 0.4 g), potato with skin 2 g, most vegetables 2-3 g, apple or pear with skin 2.4-3 g, banana 2.6 g, berries 5-7 g, almonds 12 g, chia 34 g. Meat, fish, eggs, dairy, oil and sugar contain none: send 0 there, do not omit the field.",
                    ),
                sugar_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "TOTAL sugars in grams — including sugar naturally present in fruit, milk and juice, not just added sugar. Report the whole figure a nutrition label or database gives for 'Sugars'; do not try to separate out added sugar. Send this on every meal, estimating rather than omitting it: a missing value is not a zero and drops the whole day out of the sugar average and limit. Anchors per 100 g when you have nothing better: milk 5 g, plain yogurt 4.7 g, fruit yogurt 12 g, apple 10 g, banana 12 g, orange 9 g, berries 5-10 g, dried dates 63 g, cola 10.6 g, orange juice 8.4 g, ketchup 22 g, milk chocolate 52 g, bread 3-5 g. Meat, fish, eggs, cheese, oil, rice, pasta and most vegetables are ~0: send 0 there, do not omit the field.",
                    ),
                alcohol_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_ALCOHOL_G)
                    .optional()
                    .describe(
                        "Grams of pure ethanol — NOT the volume of the drink and NOT its ABV. Do not estimate this: compute it from the volume and strength, which the user can read off the bottle or the menu. grams = millilitres x (ABV% / 100) x 0.789. Worked examples: a 330 ml 5% beer = 330 x 0.05 x 0.789 = 13 g; a 150 ml glass of 13% wine = 15.4 g; a 44 ml (1.5 oz) shot of 40% spirit = 13.9 g. For US measures, 1 fl oz = 29.6 ml. Ask for the pour size and the ABV rather than guessing, and omit the field entirely for a non-alcoholic meal.",
                    ),
                caffeine_mg: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_CAFFEINE_MG)
                    .optional()
                    .describe(
                        "Caffeine in MILLIGRAMS (mg) — this field is the one that is not in grams, and a value under 1 almost certainly means grams were sent by mistake. Typical amounts: a 240 ml brewed coffee 95 mg, a single espresso 63 mg, instant coffee 62 mg, black tea 47 mg, green tea 28 mg, a 355 ml cola 34 mg, a 250 ml energy drink 80 mg, decaf 2 mg. Scale them to what was actually drunk (a double espresso is 126 mg), and for a branded drink prefer the figure on the label or the chain's published nutrition. Caffeine adds no calories, so it never changes the kcal figure. Unlike fiber_g and sugar_g, this field is conditional, so decide it on every entry rather than skipping it by default: if the item is a caffeine source at all — coffee including decaf, tea, matcha, yerba mate, cola and other soft drinks, energy drinks, pre-workout, chocolate and cocoa, coffee ice cream, caffeine tablets — send a figure, searching the web for a branded drink whose label you do not know and falling back to the amounts above. Omit the field for anything that is not a caffeine source rather than sending 0 — a 0 records 'measured, and it was none', and one on a sandwich puts a caffeine row on the dashboard of a user who never drinks any.",
                    ),
                logged_at: z
                    .string()
                    .optional()
                    .describe(
                        "When this actually happened (defaults to now). " +
                            LOGGED_AT_FORMS +
                            LOGGED_AT_OMIT_IF_NOW,
                    ),
                notes: z.string().optional().describe("Additional notes"),
                idempotency_key: z
                    .string()
                    .min(1)
                    .max(255)
                    .optional()
                    .describe(
                        "Optional stable key for safe retries. You normally don't need to set this: when omitted, the server derives a stable key from the meal content (including logged_at), so replaying the identical call returns the original meal instead of duplicating it. Pass a UUID only to force-override that behavior. Do NOT reuse a key for genuinely different meals.",
                    ),
            },
            outputSchema: MEAL_PROGRESS_OUTPUT_SCHEMA,
            // Link the tool to its progress UI (MCP Apps). update_meal reuses
            // the SAME widget; see buildMealProgress / meal-logged.html. The
            // widget renders nothing when no goals are set.
            ...uiMeta(MEAL_LOGGED_WIDGET_URI),
        },
        async (args) => {
            return withAnalytics(
                "log_meal",
                async () => {
                    const { iso, note } = await resolveWriteTimestamp(
                        userId,
                        args.logged_at,
                    );
                    const { meal, deduplicated } = await insertMeal(userId, {
                        ...args,
                        logged_at: iso,
                    });
                    const header = deduplicated
                        ? "Meal already logged (idempotent retry):"
                        : "Meal logged:";

                    const { progressSection, structuredContent } =
                        await buildMealProgress(
                            userId,
                            meal,
                            "logged",
                            alcohol,
                        );

                    return {
                        content: [
                            {
                                type: "text",
                                text: `${header}\n${formatMeal(meal, alcohol)}${progressSection}${alcoholHiddenNote(
                                    (meal.alcohol_g ?? 0) > 0,
                                    alcohol,
                                    "Alcohol saved with this meal",
                                )}${missingNutrientNote(meal)}${note}`,
                            },
                        ],
                        structuredContent,
                    };
                },
                { userId },
            );
        },
    );

    // UI resource for the import widget. Registered unconditionally, like every
    // other widget resource — only the tool's _meta.ui link is gated per user.
    server.registerResource(
        "import-meals-widget",
        IMPORT_MEALS_WIDGET_URI,
        {
            title: "Import Meals",
            description:
                "Interactive importer for a meal-history export: reads the file in the browser, maps its columns, previews the rows, then writes them via bulk_import_meals.",
            mimeType: APP_UI_MIME_TYPE,
        },
        async (uri) => {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: APP_UI_MIME_TYPE,
                        text: await getWidgetHtml("import-meals"),
                        _meta: { ui: { prefersBorder: true } },
                    },
                ],
            };
        },
    );

    server.registerTool(
        "start_meal_import",
        {
            title: "Import Meals from a File",
            description:
                "Open an importer the user can drive themselves to load a meal-history export (MyFitnessPal, Cronometer, Lose It!, MacroFactor). Prefer this over bulk_import_meals whenever the user has an actual file: the importer reads and maps it in the browser, so the rows never pass through you and cannot be mistranscribed, and it handles column mapping, batching and retries. Call it when the user says they want to import, upload, or bring in their history from another app. Fall back to bulk_import_meals if the user cannot use the importer, if they have already pasted the data into the conversation, or if the importer reports that this client will not let it save. If the user has alcohol tracking off but wants alcohol from the file, turn it on with set_alcohol_tracking BEFORE importing: the importer skips the alcohol column while tracking is off, and re-importing afterwards will not backfill it.",
            inputSchema: {},
            outputSchema: START_IMPORT_OUTPUT_SCHEMA,
            annotations: {
                title: "Import Meals from a File",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
            },
            ...uiMeta(IMPORT_MEALS_WIDGET_URI),
        },
        async () => {
            return withAnalytics(
                "start_meal_import",
                async () => {
                    const profile = await getProfile(userId);
                    const tz = timezoneFromProfile(profile);
                    const structuredContent = startImportPayload({
                        tz: tz ?? "UTC",
                        tzConfigured: tz !== null,
                        widgetsEnabled,
                        alcohol,
                    });
                    const text = widgetsEnabled
                        ? "Importer ready — pick your export file in the panel above. Nothing is saved until you confirm the preview." +
                          (tz === null
                              ? " Note: this account has no timezone set, so times will be read as UTC. Offer to set it first."
                              : "")
                        : "This account has widgets turned off, so the importer cannot be shown. Ask the user to paste their export (or enable widgets with set_widget_display), then import it yourself with bulk_import_meals.";
                    return {
                        content: [{ type: "text" as const, text }],
                        structuredContent,
                    };
                },
                { userId },
            );
        },
    );

    server.registerTool(
        "bulk_import_meals",
        {
            title: "Bulk Import Meals",
            description:
                "Import many past meals in one call, for backfilling history from a file the user exported from another app (MyFitnessPal, Cronometer, Lose It!, MacroFactor) or from a list they pasted. Parse the source yourself and map it to the row schema; the server validates every row and reports per-row results, so you can fix and re-send only the rows that failed. Prefer this over calling log_meal in a loop — log_meal is rate-limited per call, so a week of meals would exhaust the budget. Two rules matter for correctness. (1) Compute expected_row_count, and expected_total_kcal when every row has calories, FROM THE SOURCE FILE using deterministic tooling (a script, or counting the actual lines) — never by re-reading the JSON you just wrote, which would only compare your output against itself and catch nothing. (2) Call once with dry_run: true first whenever the rows came from parsing a CSV, a screenshot, or free text; check the resolved logged_at and meal_type echoed back for every row, show the user what will be imported, and only then call again with dry_run: false. Pass local times exactly as the file gives them and let the server apply the user's timezone; do not compute UTC offsets yourself, and do not guess a value you cannot find — omit the field and list the column in unmapped_columns instead. (3) Because those local times are placed using the user's saved timezone, check with get_timezone before a large import: if it is unset the server falls back to UTC, and correcting it afterwards moves every imported meal — including onto adjacent days for anything logged near midnight. Offer set_timezone first. Maximum " +
                MAX_ROWS_PER_CALL +
                " rows per call: split larger files by date range, keeping all rows for one calendar date in the same call. If a single calendar date alone has more than " +
                MAX_ROWS_PER_CALL +
                " rows, that date has to be split across more than one call — the row cap is a hard server-side limit and wins over the same-call grouping. Doing so loosens deduplication for that date only: two rows in it that are byte-identical (same description, meal_type, calories, protein_g, carbs_g, fat_g, notes and logged_at) may collapse into one if they land in different calls, so prefer keeping duplicate-looking rows together in one call when you have to split. If the file is an export from THIS server (its header starts with an id column), map that column to source_id on every row, and map its timezone column to timezone on every row too — source_id is what makes restoring a backup a no-op instead of doubling the user's history, and timezone is what makes a restored row resolve at the local time it was actually recorded rather than the account's current timezone.",
            inputSchema: {
                meals: z
                    .array(IMPORT_ROW_SCHEMA)
                    .describe(
                        `The rows to import, in source-file order. 1 to ${MAX_ROWS_PER_CALL} per call.`,
                    ),
                expected_row_count: z.coerce
                    .number()
                    .describe(
                        "How many rows THIS call carries, counted from the source file. The server rejects the batch if it disagrees, which is how a dropped or truncated row gets caught.",
                    ),
                expected_total_kcal: z.coerce
                    .number()
                    .optional()
                    .describe(
                        "Sum of calories across this call's rows, from the source file. Supply it whenever every row has calories; the server reconciles it within 0.5%.",
                    ),
                dry_run: z
                    .boolean()
                    .default(false)
                    .describe(
                        "Validate and report what would happen without writing anything.",
                    ),
                on_error: z
                    .enum(["continue", "abort"])
                    .default("continue")
                    .describe(
                        "continue: import the valid rows and report the rest. abort: if ANY row fails validation, write nothing. Note writes are not transactional — once writing starts, a database error leaves earlier rows saved.",
                    ),
                rows_skipped: z.coerce
                    .number()
                    .default(0)
                    .describe(
                        "How many source rows you deliberately did not send (deleted entries, totals rows, unparseable lines). Explains gaps in source_line so they are not reported as dropped rows.",
                    ),
                unmapped_columns: z
                    .array(z.string())
                    .default([])
                    .describe(
                        "Source columns you could not map to any field. Report them here rather than inventing a place for them.",
                    ),
                source_app: z
                    .string()
                    .optional()
                    .describe(
                        "Which app the file came from, e.g. myfitnesspal. Used to label rows that have no food name of their own.",
                    ),
            },
            outputSchema: BULK_IMPORT_OUTPUT_SCHEMA,
            annotations: {
                title: "Bulk Import Meals",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
            },
            // ChatGPT's legacy Apps SDK path only lets a widget call tools
            // flagged widgetAccessible; without it the import-meals panel there
            // cannot reach its write path. Other hosts ignore the key.
            _meta: { "openai/widgetAccessible": true },
        },
        async (args) => {
            return withAnalytics(
                "bulk_import_meals",
                async () => {
                    // One profile read serves both: the timezone, and whether the
                    // user ever configured one via timezoneFromProfile (null
                    // means never set — see the Profile.timezone doc comment in
                    // supabase.ts, #99). Rows without an explicit offset are
                    // placed with it, so the import warns rather than silently
                    // guessing.
                    const profile = await getProfile(userId);
                    const tz = timezoneFromProfile(profile);
                    const tzConfigured = tz !== null;

                    // Bound total growth before doing any work (see
                    // MAX_MEALS_PER_USER).
                    const existingCount = await countMeals(userId);
                    if (
                        existingCount + args.meals.length >
                        MAX_MEALS_PER_USER
                    ) {
                        const structuredContent = serializeImportResult({
                            status: "failed",
                            dry_run: args.dry_run ?? false,
                            summary: {
                                total: args.meals.length,
                                created: 0,
                                deduplicated: 0,
                                would_create: 0,
                                failed: 0,
                                not_attempted: 0,
                                duplicate_rows_in_file: 0,
                                rows_without_calories: 0,
                                skipped_by_caller: args.rows_skipped ?? 0,
                            },
                            warnings: [
                                `This import would exceed the maximum of ${MAX_MEALS_PER_USER} stored meals (you have ${existingCount}). Delete some history first.`,
                            ],
                            results: [],
                        });
                        return {
                            content: [
                                {
                                    type: "text" as const,
                                    text: structuredContent.warnings[0]!,
                                },
                            ],
                            structuredContent,
                        };
                    }

                    const result = await runImport(args as BulkImportArgs, {
                        userId,
                        tz: tz ?? "UTC",
                        tzConfigured,
                        nowMs: Date.now(),
                        insert: (input) => insertMeal(userId, input),
                        existingKeys: (keys) =>
                            existingIdempotencyKeys(userId, keys),
                        existingMealIds: (ids) => existingMealIds(userId, ids),
                    });

                    // Same discovery problem as log_meal, one rung louder: a
                    // backfill can carry alcohol on dozens of rows and, with
                    // the gate off, none of it shows up anywhere afterwards.
                    // Only rows that landed (or, on a dry run, would) count —
                    // a rejected row saved nothing to be told about. `index`
                    // is the 0-based position in args.meals.
                    const wrote = new Set([
                        "created",
                        "deduplicated",
                        "would_create",
                        "would_deduplicate",
                    ]);
                    const carriedAlcohol = result.results.some(
                        (r) =>
                            wrote.has(r.status) &&
                            (args.meals[r.index]?.alcohol_g ?? 0) > 0,
                    );

                    return {
                        content: [
                            {
                                type: "text" as const,
                                text:
                                    buildSummaryText(result) +
                                    alcoholHiddenNote(
                                        carriedAlcohol,
                                        alcohol,
                                        result.dry_run
                                            ? "These rows carry alcohol and it would be saved"
                                            : "Alcohol saved with these meals",
                                    ),
                            },
                        ],
                        structuredContent: serializeImportResult(result),
                    };
                },
                { userId },
                undefined,
                {
                    // Nothing landed means the call really failed, even though
                    // we return a normal result rather than isError.
                    outcome: (r) => {
                        const s = (
                            r as { structuredContent?: { status?: string } }
                        ).structuredContent;
                        return s?.status === "failed"
                            ? { success: false, errorCategory: "import_failed" }
                            : { success: true };
                    },
                },
            );
        },
    );

    server.registerTool(
        "lookup_barcode",
        {
            title: "Look Up Barcode",
            description:
                "Look up a packaged product's label nutrition by barcode via Open Food Facts. The figures come from the product's own label as transcribed by the Open Food Facts community, so they beat estimating — but they are not verified by this server and can be wrong, stale, or missing entirely. Pass the barcode digits (EAN/UPC, 8–14 digits). The user can type them, or you can read them from a photo of the package — transcribe the human-readable digits printed beneath the barcode. Returns the product name, serving, and macros, which you can then pass to log_meal scaled to the amount eaten. If no product is found, fall back to web search or estimation. Two gaps to close yourself before logging: a fiber or sugar figure shown as n/a is missing data rather than a zero, so estimate it and pass it anyway; and Open Food Facts carries no caffeine at all, so for a coffee, tea, cola, energy drink or other caffeinated product get caffeine_mg from the label or a web search.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: {
                barcode: z
                    .string()
                    .describe(
                        "Product barcode digits (EAN-8/13, UPC-A/E, or GTIN-14). Spaces and separators are ignored.",
                    ),
            },
        },
        async ({ barcode }) => {
            return withAnalytics(
                "lookup_barcode",
                async () => {
                    const normalized = normalizeBarcode(barcode);
                    if (!normalized) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `"${barcode}" is not a valid barcode (expected 8–14 digits). Double-check the number, or estimate the macros from the product description instead.`,
                                },
                            ],
                        };
                    }

                    let food;
                    try {
                        food = await lookupBarcode(normalized);
                    } catch (err) {
                        const msg =
                            err instanceof Error ? err.message : String(err);
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Couldn't reach Open Food Facts right now (${msg}). Estimate the macros from the product description or ask the user, then log the meal.`,
                                },
                            ],
                        };
                    }

                    if (!food) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `No product found in Open Food Facts for barcode ${normalized}. Ask the user what the product is, or estimate the macros, then log the meal.`,
                                },
                            ],
                        };
                    }

                    return {
                        content: [
                            {
                                type: "text",
                                text: formatFoodResult(food, alcohol),
                            },
                        ],
                    };
                },
                { userId },
                { barcode },
            );
        },
    );

    server.registerTool(
        "get_meals_today",
        {
            title: "Get Today's Meals",
            description: "Get all meals logged today",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async () => {
            return withAnalytics(
                "get_meals_today",
                async () => {
                    const tz = await getUserTimezone(userId);
                    const meals = await getMealsByDate(
                        userId,
                        todayInTz(tz),
                        tz,
                    );
                    if (meals.length === 0) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: "No meals logged today.",
                                },
                            ],
                        };
                    }
                    const text = meals
                        .map((m) => formatMeal(m, alcohol))
                        .join("\n\n---\n\n");
                    return { content: [{ type: "text", text }] };
                },
                { userId },
            );
        },
    );

    server.registerTool(
        "get_meals_by_date",
        {
            title: "Get Meals by Date",
            description: "Get all meals for a specific date",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                date: z.string().describe("Date in YYYY-MM-DD format"),
            },
        },
        async ({ date }) => {
            return withAnalytics(
                "get_meals_by_date",
                async () => {
                    const tz = await getUserTimezone(userId);
                    const meals = await getMealsByDate(userId, date, tz);
                    if (meals.length === 0) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `No meals logged on ${date}.`,
                                },
                            ],
                        };
                    }
                    const text = meals
                        .map((m) => formatMeal(m, alcohol))
                        .join("\n\n---\n\n");
                    return { content: [{ type: "text", text }] };
                },
                { userId },
                { date },
            );
        },
    );

    server.registerTool(
        "get_meals_by_date_range",
        {
            title: "Get Meals by Date Range",
            description:
                "Get all meals between two dates (inclusive). Use this instead of multiple get_meals_by_date calls when you need meals for more than one day.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                start_date: z.string().describe("Start date (YYYY-MM-DD)"),
                end_date: z.string().describe("End date (YYYY-MM-DD)"),
            },
        },
        async ({ start_date, end_date }) => {
            return withAnalytics(
                "get_meals_by_date_range",
                async () => {
                    const tz = await getUserTimezone(userId);
                    const meals = await getMealsInRange(
                        userId,
                        start_date,
                        end_date,
                        tz,
                    );
                    if (meals.length === 0) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `No meals found between ${start_date} and ${end_date}.`,
                                },
                            ],
                        };
                    }

                    // Group by date for readability (local to user timezone)
                    const byDate = new Map<string, Meal[]>();
                    for (const meal of meals) {
                        const date = dateInTz(meal.logged_at, tz);
                        const existing = byDate.get(date) ?? [];
                        existing.push(meal);
                        byDate.set(date, existing);
                    }

                    const sections: string[] = [];
                    for (const [date, dateMeals] of [
                        ...byDate.entries(),
                    ].sort()) {
                        const header = `## ${date} (${dateMeals.length} meal${dateMeals.length === 1 ? "" : "s"})`;
                        const formatted = dateMeals
                            .map((m) => formatMeal(m, alcohol))
                            .join("\n\n---\n\n");
                        sections.push(`${header}\n\n${formatted}`);
                    }

                    return {
                        content: [
                            {
                                type: "text",
                                text: sections.join("\n\n===\n\n"),
                            },
                        ],
                    };
                },
                { userId },
                { start_date, end_date },
            );
        },
    );

    server.registerTool(
        "search_meals",
        {
            title: "Search Past Meals",
            description:
                "Search the user's past logged meals by keyword (case-insensitive match on description and notes), newest first, grouped into recurring variations with counts, last-logged date, and typical macros. Use this BEFORE logging a meal from a photo: past variations reveal ingredients that aren't visible in the picture (raisins vs banana, milk vs water, added honey or oil) — turn each difference between variations into a question for the user rather than picking one silently, and ask those questions one at a time across several turns instead of batching them. Also use it for requests like 'log my usual breakfast': search, interview the user to pin down the variation and the amount, then log_meal. For a restaurant meal, search the restaurant name as well as the dish — a past visit to the same venue is stronger evidence than anything on the web. Pass short food keywords, not full sentences, and include the food name in every language the user may have logged in — always add an English alternative alongside the conversation language, e.g. [\"вівсянка\", \"oatmeal\"].",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                queries: z
                    .array(z.string().min(1))
                    .min(1)
                    .max(5)
                    .describe(
                        "Keyword alternatives, each a short food name like 'oatmeal' or 'chicken salad' (all words of one alternative must match; alternatives are OR'd). Include the food name in every language the user may have logged in — typically the conversation language plus English.",
                    ),
                days: z.coerce
                    .number()
                    .int()
                    .min(1)
                    .max(3650)
                    .optional()
                    .describe("How far back to search, in days (default 365)."),
                limit: z.coerce
                    .number()
                    .int()
                    .min(1)
                    .max(100)
                    .optional()
                    .describe("Max matching entries to analyze (default 50)."),
            },
        },
        async ({ queries, days, limit }) => {
            return withAnalytics(
                "search_meals",
                async () => {
                    const tz = await getUserTimezone(userId);
                    const windowDays = days ?? 365;
                    // A fuzzy lookback window needs no calendar-day precision,
                    // so a plain UTC offset from now is enough (tz is still
                    // used to render dates in the results).
                    const sinceIso = new Date(
                        Date.now() - windowDays * 24 * 60 * 60 * 1000,
                    ).toISOString();
                    const meals = await searchMeals(userId, queries, {
                        limit: limit ?? 50,
                        sinceIso,
                    });
                    if (meals.length === 0) {
                        const label = queries.map((q) => `"${q}"`).join(" / ");
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `No past meals matching ${label} in the last ${windowDays} days. If logging from a photo, proceed with your own portion assumptions — but with no past variations to draw on, you have MORE to ask about, not less. Interview the user one question per message about the amount eaten and about ingredients the photo cannot show (oil, butter, sugar, sauce, what a drink was made with) before calling log_meal.`,
                                },
                            ],
                        };
                    }
                    return {
                        content: [
                            {
                                type: "text",
                                text: formatMealSearchResults(
                                    meals,
                                    queries,
                                    tz,
                                ),
                            },
                        ],
                    };
                },
                { userId },
                { days: days ?? 365 },
            );
        },
    );

    // UI resource for the get_nutrition_summary dashboard widget. Served as an
    // MCP Apps resource; the host fetches it and renders it in a sandboxed
    // iframe. Self-contained HTML (inline CSS/JS) — the sandbox blocks external
    // hosts, so nothing may be loaded over the network.
    server.registerResource(
        "nutrition-summary-widget",
        SUMMARY_WIDGET_URI,
        {
            title: "Nutrition Summary Dashboard",
            description:
                "Interactive dashboard UI for get_nutrition_summary: macro tiles vs goals and a per-day breakdown, with automatic light/dark theming.",
            mimeType: APP_UI_MIME_TYPE,
        },
        async (uri) => {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: APP_UI_MIME_TYPE,
                        text: await getWidgetHtml("nutrition-summary"),
                        // Prefer a bordered container in hosts that honor it.
                        _meta: { ui: { prefersBorder: true } },
                    },
                ],
            };
        },
    );

    // UI resource for the get_goal_progress widget (single-day intake vs goal
    // rings + a weight card). Same self-contained-HTML contract as above.
    server.registerResource(
        "goal-progress-widget",
        GOAL_PROGRESS_WIDGET_URI,
        {
            title: "Goal Progress",
            description:
                "Interactive UI for get_goal_progress: intake-vs-goal rings for a single day plus body-weight progress, with automatic light/dark theming.",
            mimeType: APP_UI_MIME_TYPE,
        },
        async (uri) => {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: APP_UI_MIME_TYPE,
                        text: await getWidgetHtml("goal-progress"),
                        _meta: { ui: { prefersBorder: true } },
                    },
                ],
            };
        },
    );

    // UI resource for the log_meal widget (day's running totals vs goals as
    // rings; renders nothing when no goals are set). Same contract as above.
    server.registerResource(
        "meal-logged-widget",
        MEAL_LOGGED_WIDGET_URI,
        {
            title: "Meal Logged",
            description:
                "Interactive UI shown after log_meal: the day's running intake-vs-goal rings, with automatic light/dark theming. Shows nothing when no nutrition goals are set.",
            mimeType: APP_UI_MIME_TYPE,
        },
        async (uri) => {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: APP_UI_MIME_TYPE,
                        text: await getWidgetHtml("meal-logged"),
                        _meta: { ui: { prefersBorder: true } },
                    },
                ],
            };
        },
    );

    // UI resource for the get_trends widget (interactive 7/14/30-day toggle over
    // a daily calories chart + trailing-average rings). Same contract as above.
    server.registerResource(
        "trends-widget",
        TRENDS_WIDGET_URI,
        {
            title: "Trends",
            description:
                "Interactive UI for get_trends: a 7/14/30-day toggle over a daily calories chart and trailing-average-vs-goal rings, with automatic light/dark theming.",
            mimeType: APP_UI_MIME_TYPE,
        },
        async (uri) => {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: APP_UI_MIME_TYPE,
                        text: await getWidgetHtml("trends"),
                        _meta: { ui: { prefersBorder: true } },
                    },
                ],
            };
        },
    );

    // UI resource for the get_weight_trends widget (weight-over-time line chart
    // with a 7/14/30-day toggle and target line). Same contract as above.
    server.registerResource(
        "weight-trends-widget",
        WEIGHT_TRENDS_WIDGET_URI,
        {
            title: "Weight Trends",
            description:
                "Interactive UI for get_weight_trends: a 7/14/30-day toggle over a weight-over-time chart (data-scaled axis, target line) plus latest/change/target stats, with automatic light/dark theming.",
            mimeType: APP_UI_MIME_TYPE,
        },
        async (uri) => {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: APP_UI_MIME_TYPE,
                        text: await getWidgetHtml("weight-trends"),
                        _meta: { ui: { prefersBorder: true } },
                    },
                ],
            };
        },
    );

    server.registerTool(
        "get_nutrition_summary",
        {
            title: "Get Nutrition Summary",
            description:
                "Get daily nutrition totals for a date range. Renders an interactive dashboard (macro tiles vs. goals and a per-day breakdown) in clients that support MCP Apps UI, and returns the same data as text elsewhere. Figures are estimates, not medical or dietary advice.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                start_date: z.string().describe("Start date (YYYY-MM-DD)"),
                end_date: z.string().describe("End date (YYYY-MM-DD)"),
            },
            outputSchema: {
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
                meals: z.array(MEAL_BREAKDOWN_ITEM),
            },
            // Link the tool to its dashboard UI (MCP Apps).
            ...uiMeta(SUMMARY_WIDGET_URI),
        },
        async ({ start_date, end_date }) => {
            return withAnalytics(
                "get_nutrition_summary",
                async () => {
                    // Sized with insights.ts's own arithmetic (the function
                    // buildDailyBuckets lays its buckets out with), so the two
                    // tools cannot disagree about how long a window is. Clamped
                    // because a reversed range would otherwise report 0 or less
                    // days and make the note read as nonsense.
                    const daysInRange = Math.max(
                        1,
                        dateDiffDays(start_date, end_date) + 1,
                    );
                    const tz = await getUserTimezone(userId);
                    const [meals, water, goals] = await Promise.all([
                        getMealsInRange(userId, start_date, end_date, tz),
                        getWaterInRange(userId, start_date, end_date, tz),
                        getNutritionGoals(userId),
                    ]);

                    const goalsPayload = goalsPayloadOf(goals, alcohol);

                    if (meals.length === 0 && water.length === 0) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `No meals or water logged between ${start_date} and ${end_date}.`,
                                },
                            ],
                            structuredContent: {
                                start_date,
                                end_date,
                                logged_days: 0,
                                days_in_range: daysInRange,
                                drink_unit: alcohol,
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
                    for (const [date, dateMeals] of [
                        ...byDate.entries(),
                    ].sort()) {
                        const totals = sumMeals(dateMeals);
                        totals.water_ml = waterByDate.get(date) ?? 0;
                        // Which nutrients this day actually recorded, so a
                        // pre-feature day neither prints "Fiber: 0g" nor drags
                        // the range average down towards zero.
                        const present = nutrientPresence(dateMeals);
                        const header = `## ${date} (${dateMeals.length} meal${dateMeals.length === 1 ? "" : "s"})`;
                        sections.push(
                            `${header}\n${formatProgress(totals, goals, alcohol, present)}`,
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
                    ].filter((s): s is string => s !== null);
                    const coverageNote = partial.length
                        ? `\n\n(Averaged over the days that record each figure, not all ${days.length}: ${partial.join(", ")}.)`
                        : "";

                    const footer =
                        coverageNote +
                        loggedDayAverageNote(days.length, daysInRange) +
                        (goals
                            ? ""
                            : "\n\n(Tip: set daily targets with set_nutrition_goals to see progress percentages.)");

                    return {
                        content: [
                            {
                                type: "text",
                                text: sections.join("\n\n") + footer,
                            },
                        ],
                        structuredContent: {
                            start_date,
                            end_date,
                            logged_days: days.length,
                            days_in_range: daysInRange,
                            drink_unit: alcohol,
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
                            meals: mealBreakdown(meals, tz, alcohol),
                        },
                    };
                },
                { userId },
                { start_date, end_date },
            );
        },
    );

    server.registerTool(
        "set_nutrition_goals",
        {
            title: "Set Nutrition Goals",
            description:
                "Set the user's daily calorie and macro targets, and optionally a target body weight. Pass only the fields you want to update — omitted fields keep their previous value. Pass null explicitly to clear a target. Calories, protein, carbs, fat, fiber and water are targets to REACH; sugar, alcohol and caffeine are limits to STAY UNDER, and progress against them is worded accordingly. Every gram target is in grams and the caffeine limit is in MILLIGRAMS. For a limit, 0 is a real value meaning 'none at all' rather than 'unset'. Targets are the user's own choice; this server does not provide medical or dietary advice.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
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
                        "Daily TOTAL sugar limit (grams), treated as a maximum to stay under. Total sugars include sugar naturally present in fruit and milk, not only added sugar — say so when the user sets one, since public guidance figures usually refer to ADDED sugar and are therefore a much lower number. Null to clear.",
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
            },
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
                        daily_fiber_g:
                            args.daily_fiber_g === undefined
                                ? (existing?.daily_fiber_g ?? null)
                                : args.daily_fiber_g,
                        daily_sugar_g:
                            args.daily_sugar_g === undefined
                                ? (existing?.daily_sugar_g ?? null)
                                : args.daily_sugar_g,
                        daily_alcohol_g:
                            args.daily_alcohol_g === undefined
                                ? (existing?.daily_alcohol_g ?? null)
                                : args.daily_alcohol_g,
                        daily_caffeine_mg:
                            args.daily_caffeine_mg === undefined
                                ? (existing?.daily_caffeine_mg ?? null)
                                : args.daily_caffeine_mg,
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
                { userId },
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
                { userId },
            );
        },
    );

    server.registerTool(
        "get_goal_progress",
        {
            title: "Get Goal Progress",
            description:
                "Get progress against daily nutrition goals for a specific date (defaults to today). Renders intake-vs-goal rings plus body-weight progress in clients that support MCP Apps UI, and returns the same data as text elsewhere. Figures are estimates, not medical or dietary advice.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                date: z
                    .string()
                    .optional()
                    .describe("Date in YYYY-MM-DD format. Defaults to today."),
            },
            outputSchema: {
                date: z.string(),
                meal_count: z.number(),
                water_entries: z.number(),
                drink_unit: DRINK_UNIT_FIELD,
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
            },
            // Link the tool to its progress UI (MCP Apps).
            ...uiMeta(GOAL_PROGRESS_WIDGET_URI),
        },
        async ({ date }) => {
            return withAnalytics(
                "get_goal_progress",
                async () => {
                    const tz = await getUserTimezone(userId);
                    const targetDate = date ?? todayInTz(tz);
                    const [meals, water, goals, latestWeight, weightPref] =
                        await Promise.all([
                            getMealsByDate(userId, targetDate, tz),
                            getWaterByDate(userId, targetDate, tz),
                            getNutritionGoals(userId),
                            getLatestWeight(userId),
                            getPreferredWeightUnit(userId),
                        ]);
                    const unit = weightPref ?? "kg";
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
                        weightLine = `\nWeight: no entries yet (target ${formatWeight(goals.target_weight_g, unit)}). Log one with log_weight.`;
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

                    return {
                        content: [
                            {
                                type: "text",
                                text: `${header}\n${body}${weightLine}${footer}`,
                            },
                        ],
                        structuredContent: {
                            date: targetDate,
                            drink_unit: alcohol,
                            meal_count: meals.length,
                            water_entries: water.length,
                            goals: goalsPayload,
                            totals: totalsPayload,
                            weight: weightPayload,
                            // Single day → label rows by meal type in the widget.
                            meals: mealBreakdown(meals, null, alcohol),
                        },
                    };
                },
                { userId },
                { date: date ?? "today" },
            );
        },
    );

    server.registerTool(
        "delete_meal",
        {
            title: "Delete Meal",
            description: "Delete a meal entry by ID",
            annotations: {
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                id: z.string().describe("UUID of the meal to delete"),
            },
        },
        async ({ id }) => {
            return withAnalytics(
                "delete_meal",
                async () => {
                    const deleted = await deleteMeal(userId, id);
                    return {
                        content: [
                            {
                                type: "text",
                                text: deleted
                                    ? `Meal ${id} deleted.`
                                    : `No meal found with id ${id}.`,
                            },
                        ],
                    };
                },
                { userId },
            );
        },
    );

    server.registerTool(
        "update_meal",
        {
            title: "Update Meal",
            // Only the fields passed are written (see updateMeal), which is what
            // makes this the backfill path for a meal that went in without its
            // fiber or sugar — and what missingNutrientNote points the model at.
            description:
                "Update fields of an existing meal entry. Only the fields you pass are changed, which also makes this the way to BACKFILL nutrition a meal was logged without: if a past meal has no fiber_g, sugar_g or (where it applies) caffeine_mg, estimate the value and pass just that field rather than telling the user the figure in prose. Meal ids come from get_meals_today, get_meals_by_date or search_meals.\n\n" +
                NUTRIENT_COVERAGE,
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                id: z.string().describe("UUID of the meal to update"),
                description: z.string().optional(),
                meal_type: z
                    .enum(["breakfast", "lunch", "dinner", "snack"])
                    .optional(),
                // Same bounds, and the same reasoning, as log_meal.
                calories: z.coerce.number().min(0).max(MAX_CALORIES).optional(),
                protein_g: z.coerce.number().min(0).max(MAX_MACRO_G).optional(),
                carbs_g: z.coerce.number().min(0).max(MAX_MACRO_G).optional(),
                fat_g: z.coerce.number().min(0).max(MAX_MACRO_G).optional(),
                fiber_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Dietary fiber in grams. Every meal should carry one — pass it here for a meal logged without it, estimating from the ingredients if no label figure exists, and 0 for a food that genuinely has none (meat, fish, eggs, dairy, oil).",
                    ),
                sugar_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "TOTAL sugars in grams, including sugar naturally present in fruit and milk — not only added sugar. Every meal should carry one — pass it here for a meal logged without it, estimating if there is no label figure, and 0 for a food that genuinely has none.",
                    ),
                alcohol_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_ALCOHOL_G)
                    .optional()
                    .describe(
                        "Grams of pure ethanol — NOT the drink's volume and NOT its ABV. Compute it rather than estimating: grams = millilitres x (ABV% / 100) x 0.789 (a 330 ml 5% beer = 13 g).",
                    ),
                caffeine_mg: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_CAFFEINE_MG)
                    .optional()
                    .describe(
                        "Caffeine in MILLIGRAMS, not grams (a 240 ml brewed coffee is 95 mg, a single espresso 63 mg, black tea 47 mg, a 250 ml energy drink 80 mg). Adds no calories. Pass it only for a meal that is genuinely a caffeine source; a 0 here records 'measured, and it was none' and starts showing the user a caffeine row.",
                    ),
                logged_at: z
                    .string()
                    .optional()
                    .describe("When the meal was eaten. " + LOGGED_AT_FORMS),
                notes: z.string().optional(),
            },
            outputSchema: MEAL_PROGRESS_OUTPUT_SCHEMA,
            // Reuses the SAME meal-logged widget as log_meal (see
            // buildMealProgress / meal-logged.html); `action: "updated"` just
            // changes its header. Renders nothing when no goals are set.
            ...uiMeta(MEAL_LOGGED_WIDGET_URI),
        },
        async ({ id, ...fields }) => {
            return withAnalytics(
                "update_meal",
                async () => {
                    const { iso, note } = await resolveWriteTimestamp(
                        userId,
                        fields.logged_at,
                    );
                    const meal = await updateMeal(userId, id, {
                        ...fields,
                        logged_at: iso,
                    });
                    const { progressSection, structuredContent } =
                        await buildMealProgress(
                            userId,
                            meal,
                            "updated",
                            alcohol,
                        );
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Meal updated:\n${formatMeal(meal, alcohol)}${progressSection}${alcoholHiddenNote(
                                    (meal.alcohol_g ?? 0) > 0,
                                    alcohol,
                                    "Alcohol saved with this meal",
                                )}${missingNutrientNote(meal)}${note}`,
                            },
                        ],
                        structuredContent,
                    };
                },
                { userId },
            );
        },
    );
    server.registerTool(
        "log_water",
        {
            title: "Log Water",
            description:
                "Log a hydration entry in milliliters. If the user gives a volume in another unit (cups, oz, liters), convert it: 1 cup = 240 ml, 1 fl oz = 30 ml, 1 L = 1000 ml. If only 'a glass' is mentioned, ask for the size or assume 250 ml and confirm.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: {
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
                        "Optional stable key for safe retries. You normally don't need to set this: when omitted, the server derives a stable key from the entry content (including logged_at), so replaying the identical call returns the original entry instead of duplicating it. Pass a UUID only to force-override that behavior. Do NOT reuse a key for genuinely different sips.",
                    ),
            },
        },
        async (args) => {
            return withAnalytics(
                "log_water",
                async () => {
                    const { iso, note } = await resolveWriteTimestamp(
                        userId,
                        args.logged_at,
                    );
                    const { entry, deduplicated } = await insertWater(userId, {
                        ...args,
                        logged_at: iso,
                    });
                    const prefix = deduplicated
                        ? "Already logged (idempotent retry)"
                        : "Water logged";
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${prefix}: ${entry.amount_ml} ml at ${entry.logged_at}${entry.notes ? ` (${entry.notes})` : ""}. ID: ${entry.id}${note}`,
                            },
                        ],
                    };
                },
                { userId },
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
                            `- ${e.amount_ml} ml at ${e.logged_at}${e.notes ? ` (${e.notes})` : ""} [id: ${e.id}]`,
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Total: ${total} ml (${entries.length} entr${entries.length === 1 ? "y" : "ies"})\n\n${lines.join("\n")}`,
                            },
                        ],
                    };
                },
                { userId },
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
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                date: z.string().describe("Date in YYYY-MM-DD format"),
            },
        },
        async ({ date }) => {
            return withAnalytics(
                "get_water_by_date",
                async () => {
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
                            `- ${e.amount_ml} ml at ${e.logged_at}${e.notes ? ` (${e.notes})` : ""} [id: ${e.id}]`,
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Total on ${date}: ${total} ml (${entries.length} entr${entries.length === 1 ? "y" : "ies"})\n\n${lines.join("\n")}`,
                            },
                        ],
                    };
                },
                { userId },
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
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                id: z.string().describe("UUID of the water entry to delete"),
            },
        },
        async ({ id }) => {
            return withAnalytics(
                "delete_water",
                async () => {
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
                { userId },
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
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: {
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
                        "Optional stable key for safe retries. You normally don't need to set this: when omitted, the server derives a stable key from the entry content (including logged_at), so replaying the identical call returns the original entry instead of duplicating it. Pass a UUID only to force-override that behavior.",
                    ),
            },
        },
        async (args) => {
            return withAnalytics(
                "log_weight",
                async () => {
                    const { iso, note } = await resolveWriteTimestamp(
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
                        ? "Already logged (idempotent retry)"
                        : "Weight logged";
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${prefix}: ${formatWeight(entry.weight_g, unit)} at ${entry.logged_at}${entry.notes ? ` (${entry.notes})` : ""}. ID: ${entry.id}${note}`,
                            },
                        ],
                    };
                },
                { userId },
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
                        formatWeightEntry(e, unit),
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Today (${entries.length} entr${entries.length === 1 ? "y" : "ies"}):\n\n${lines.join("\n")}`,
                            },
                        ],
                    };
                },
                { userId },
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
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                date: z.string().describe("Date in YYYY-MM-DD format"),
            },
        },
        async ({ date }) => {
            return withAnalytics(
                "get_weight_by_date",
                async () => {
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
                        formatWeightEntry(e, unit),
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${date} (${entries.length} entr${entries.length === 1 ? "y" : "ies"}):\n\n${lines.join("\n")}`,
                            },
                        ],
                    };
                },
                { userId },
                { date },
            );
        },
    );

    server.registerTool(
        "get_weight_by_date_range",
        {
            title: "Get Weight by Date Range",
            description:
                "Get all weight entries between two dates (inclusive), grouped by day with each day's average. Use this instead of multiple get_weight_by_date calls.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                start_date: z.string().describe("Start date (YYYY-MM-DD)"),
                end_date: z.string().describe("End date (YYYY-MM-DD)"),
            },
        },
        async ({ start_date, end_date }) => {
            return withAnalytics(
                "get_weight_by_date_range",
                async () => {
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
                            .map((e) => formatWeightEntry(e, unit))
                            .join("\n");
                        sections.push(`${header}\n${formatted}`);
                    }

                    return {
                        content: [
                            {
                                type: "text",
                                text: sections.join("\n\n"),
                            },
                        ],
                    };
                },
                { userId },
                { start_date, end_date },
            );
        },
    );

    server.registerTool(
        "get_weight_trends",
        {
            title: "Get Weight Trends",
            description:
                "Weight trend over a window: latest reading, overall change, 7/14/30-day moving averages (to smooth day-to-day noise), min/max, and progress toward the target weight if one is set. Aggregates multiple weigh-ins per day by averaging. Defaults to the last 30 days ending today.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
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
            },
            outputSchema: {
                end_date: z.string(),
                unit: z.string(),
                target: z.number().nullable(),
                default_range: z.number(),
                // Per-day weight (same-day weigh-ins averaged) in display units,
                // for logged days within the last 30 days; widget slices 7/14/30.
                days: z.array(
                    z.object({
                        date: z.string(),
                        weight: z.number(),
                    }),
                ),
            },
            // Link the tool to its interactive weight-trends UI (MCP Apps).
            ...uiMeta(WEIGHT_TRENDS_WIDGET_URI),
        },
        async ({ days, end_date }) => {
            return withAnalytics(
                "get_weight_trends",
                async () => {
                    const [tz, weightPref] = await Promise.all([
                        getUserTimezone(userId),
                        getPreferredWeightUnit(userId),
                    ]);
                    const unit = weightPref ?? "kg";
                    const endDate = end_date ?? todayInTz(tz);
                    const windowDays = days ?? 30;
                    // The widget's toggle offers up to 30 days, so fetch at
                    // least 30 regardless of the requested text window.
                    const seriesDays = Math.max(windowDays, 30);
                    const fetchStart = shiftLocalDate(
                        endDate,
                        -(seriesDays - 1),
                    );
                    const requestedStart = shiftLocalDate(
                        endDate,
                        -(windowDays - 1),
                    );
                    const [entries, goals] = await Promise.all([
                        getWeightInRange(userId, fetchStart, endDate, tz),
                        getNutritionGoals(userId),
                    ]);
                    const targetG = goals?.target_weight_g ?? null;

                    // Text summary respects the requested window.
                    const textEntries =
                        windowDays >= 30
                            ? entries
                            : entries.filter(
                                  (e) =>
                                      dateInTz(e.logged_at, tz) >=
                                      requestedStart,
                              );

                    // Widget series: one value per logged day (same-day
                    // weigh-ins averaged), in display units, within 30 days.
                    const seriesCutoff = shiftLocalDate(endDate, -29);
                    const dailyG = new Map<
                        string,
                        { total: number; count: number }
                    >();
                    for (const e of entries) {
                        const date = dateInTz(e.logged_at, tz);
                        const cur = dailyG.get(date) ?? { total: 0, count: 0 };
                        cur.total += e.weight_g;
                        cur.count += 1;
                        dailyG.set(date, cur);
                    }
                    const widgetDays = [...dailyG.entries()]
                        .filter(([date]) => date >= seriesCutoff)
                        .map(([date, { total, count }]) => ({
                            date,
                            weight: fromGrams(total / count, unit),
                        }))
                        .sort((a, b) => (a.date < b.date ? -1 : 1));

                    return {
                        content: [
                            {
                                type: "text",
                                text: computeWeightTrend(
                                    textEntries,
                                    requestedStart,
                                    endDate,
                                    tz,
                                    targetG,
                                    unit,
                                ),
                            },
                        ],
                        structuredContent: {
                            end_date: endDate,
                            unit,
                            target:
                                targetG != null
                                    ? fromGrams(targetG, unit)
                                    : null,
                            default_range: [7, 14, 30].includes(windowDays)
                                ? windowDays
                                : 30,
                            days: widgetDays,
                        },
                    };
                },
                { userId },
                { days: days ?? 30 },
            );
        },
    );

    server.registerTool(
        "update_weight",
        {
            title: "Update Weight Entry",
            description:
                "Update fields of an existing weight entry. Provide `unit` alongside `weight` (defaults to the user's preferred unit); do NOT convert units yourself.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                id: z.string().describe("UUID of the weight entry to update"),
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
            },
        },
        async ({ id, weight, unit, logged_at, notes }) => {
            return withAnalytics(
                "update_weight",
                async () => {
                    const { iso, note } = await resolveWriteTimestamp(
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
                                text: `Weight updated:\n${formatWeightEntry(entry, displayUnit)}${note}`,
                            },
                        ],
                    };
                },
                { userId },
            );
        },
    );

    server.registerTool(
        "delete_weight",
        {
            title: "Delete Weight Entry",
            description: "Delete a weight log entry by ID.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                id: z.string().describe("UUID of the weight entry to delete"),
            },
        },
        async ({ id }) => {
            return withAnalytics(
                "delete_weight",
                async () => {
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
                { userId },
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
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                unit: z
                    .enum(["kg", "lb"])
                    .nullable()
                    .describe(
                        "Preferred weight unit: 'kg' or 'lb'. Pass null to clear the preference.",
                    ),
            },
        },
        async ({ unit }) => {
            return withAnalytics(
                "set_weight_unit",
                async () => {
                    if (unit !== null && !isWeightUnit(unit)) {
                        throw new Error(
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
                { userId },
            );
        },
    );

    server.registerTool(
        "get_weight_unit",
        {
            title: "Get Weight Unit",
            description:
                "Get the user's preferred weight unit. Reports if none is set.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async () => {
            return withAnalytics(
                "get_weight_unit",
                async () => {
                    const unit = await getPreferredWeightUnit(userId);
                    return {
                        content: [
                            {
                                type: "text",
                                text: unit
                                    ? `Preferred weight unit: ${unit}.`
                                    : "No preferred weight unit set. Weights display in kg by default, and logging requires an explicit unit ('kg' or 'lb').",
                            },
                        ],
                    };
                },
                { userId },
            );
        },
    );

    server.registerTool(
        "set_widget_display",
        {
            title: "Set Widget Display",
            description:
                "Enable or disable the in-chat visual widgets (nutrition dashboard, goal progress, meal-logged rings, trends, weight charts). When disabled, the same tools still return their full text and data — just no rendered widget. Widgets are enabled by default. Note: hosts read the widget list when a session connects, so the change takes effect in new conversations; an already-open chat may keep showing widgets until it reconnects.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                enabled: z
                    .boolean()
                    .describe(
                        "true to show widgets (default), false for text-only responses with no widget.",
                    ),
            },
        },
        async ({ enabled }) => {
            return withAnalytics(
                "set_widget_display",
                async () => {
                    const profile = await upsertProfile(userId, {
                        widgets_enabled: enabled,
                    });
                    return {
                        content: [
                            {
                                type: "text",
                                text: profile.widgets_enabled
                                    ? "Widgets enabled. Supported tools will show a visual widget alongside their text in new conversations."
                                    : "Widgets disabled. Supported tools will return text and data only, with no widget, in new conversations.",
                            },
                        ],
                    };
                },
                { userId },
            );
        },
    );

    server.registerTool(
        "get_widget_display",
        {
            title: "Get Widget Display",
            description:
                "Get whether the in-chat visual widgets are currently enabled for the user. Enabled by default.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async () => {
            return withAnalytics(
                "get_widget_display",
                async () => {
                    const enabled = await getWidgetsEnabled(userId);
                    return {
                        content: [
                            {
                                type: "text",
                                text: enabled
                                    ? "Widgets are enabled. Supported tools show a visual widget alongside their text."
                                    : "Widgets are disabled. Supported tools return text and data only.",
                            },
                        ],
                    };
                },
                { userId },
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
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
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
            },
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
                    const unitLabel =
                        unit === "us"
                            ? "US standard drinks (14 g each)"
                            : "UK units (7.9 g each)";
                    return {
                        content: [
                            {
                                type: "text",
                                text: profile.alcohol_tracking_enabled
                                    ? `Alcohol tracking enabled, shown in grams alongside ${unitLabel}. It appears in meals, goals and daily progress from your next tool call — no need to start a new chat.`
                                    : "Alcohol tracking disabled, effective immediately. Alcohol is no longer shown in meals, goals or progress; anything already logged is kept and reappears if you turn it back on.",
                            },
                        ],
                    };
                },
                { userId },
            );
        },
    );

    server.registerTool(
        "get_alcohol_tracking",
        {
            title: "Get Alcohol Tracking",
            description:
                "Get whether alcohol tracking is enabled for the user and which standard drink it is displayed in. Disabled by default.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async () => {
            return withAnalytics(
                "get_alcohol_tracking",
                async () => {
                    const [enabled, unit] = await Promise.all([
                        getAlcoholTrackingEnabled(userId),
                        getPreferredDrinkUnit(userId),
                    ]);
                    const unitLabel =
                        (unit ?? "us") === "us"
                            ? "US standard drinks (14 g each)"
                            : "UK units (7.9 g each)";
                    return {
                        content: [
                            {
                                type: "text",
                                text: enabled
                                    ? `Alcohol tracking is enabled, displayed in grams alongside ${unitLabel}${unit ? "" : " (the default — no preference saved)"}.`
                                    : "Alcohol tracking is disabled, so alcohol is hidden from meals, goals and progress. Alcohol already stored is kept, and anything logged with alcohol_g while it is off is still stored. The exception is the file importer, which skips a file's alcohol column while tracking is off and will not backfill it on a later re-import — so enable tracking before importing an export whose alcohol the user wants to keep. Enable it with set_alcohol_tracking.",
                            },
                        ],
                    };
                },
                { userId },
            );
        },
    );

    server.registerTool(
        "get_trends",
        {
            title: "Get Trends",
            description:
                "Rolling 7/14/30-day averages, standard deviation, coefficient of variation, logging streaks, day-of-week breakdowns, and best/worst day for calories and each macro. Pre-aggregated so you can narrate findings to the user without doing arithmetic. Defaults to the last 30 days ending today. Figures are estimates, not medical or dietary advice.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
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
            },
            outputSchema: {
                end_date: z.string(),
                // Which toggle the widget opens on (nearest of 7/14/30).
                default_range: z.number(),
                drink_unit: DRINK_UNIT_FIELD,
                goals: GOALS_ITEM.nullable(),
                // Up to 30 days of daily series; the widget slices to 7/14/30.
                days: z.array(TRENDS_DAY_ITEM),
            },
            // Link the tool to its interactive trends UI (MCP Apps).
            ...uiMeta(TRENDS_WIDGET_URI),
        },
        async ({ days, end_date }) => {
            return withAnalytics(
                "get_trends",
                async () => {
                    const tz = await getUserTimezone(userId);
                    const endDate = end_date ?? todayInTz(tz);
                    const windowDays = days ?? 30;
                    // The widget's toggle always offers up to 30 days, so build
                    // at least 30 days of series regardless of the text window.
                    const seriesDays = Math.max(windowDays, 30);
                    const startDate = shiftLocalDate(
                        endDate,
                        -(seriesDays - 1),
                    );
                    const [meals, water, goals] = await Promise.all([
                        getMealsInRange(userId, startDate, endDate, tz),
                        getWaterInRange(userId, startDate, endDate, tz),
                        getNutritionGoals(userId),
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

                    return {
                        content: [
                            {
                                type: "text",
                                text: computeTrends(
                                    gateAlcohol(textBuckets, alcohol),
                                    goals,
                                ),
                            },
                        ],
                        structuredContent: {
                            end_date: endDate,
                            default_range: [7, 14, 30].includes(windowDays)
                                ? windowDays
                                : 30,
                            drink_unit: alcohol,
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
                { userId },
                { days: days ?? 30 },
            );
        },
    );

    server.registerTool(
        "get_meal_patterns",
        {
            title: "Get Meal Patterns",
            description:
                "Pre-aggregated behavioural patterns across the logged window: meal-type presence rates, breakfast effect (days with vs without), high-calorie-lunch effect, late-dinner effect, weekday vs weekend, and outlier days. Narrate findings conversationally to the user. Defaults to the last 30 days. Patterns are descriptive estimates, not medical or dietary advice.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
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
            },
        },
        async ({ days, end_date }) => {
            return withAnalytics(
                "get_meal_patterns",
                async () => {
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
                { userId },
                { days: days ?? 30 },
            );
        },
    );

    server.registerTool(
        "export_meals",
        {
            title: "Export Meals",
            description:
                "Export all of the user's logged meals as a CSV file and return a private, time-limited download link (valid 60 minutes). Timestamps use the user's timezone if set, otherwise UTC. Share the link with the user so they can download their data.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
        },
        async () => {
            return withAnalytics(
                "export_meals",
                async () => {
                    const { count, url } = await exportMeals(userId);
                    if (count === 0) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: "No meals to export yet.",
                                },
                            ],
                        };
                    }
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Exported ${count} meal${count === 1 ? "" : "s"} to CSV.\nDownload (link valid for 60 minutes): ${url}`,
                            },
                        ],
                    };
                },
                { userId },
            );
        },
    );

    server.registerResource(
        "weekly-summary",
        "nutrition://weekly-summary",
        {
            title: "Weekly Nutrition Summary",
            description:
                "Rolling 7-day digest: logged-day count, daily averages vs targets, and the best/roughest day of the week. Good to pull at the start of a chat for proactive check-ins.",
            mimeType: "text/plain",
        },
        async (uri) => {
            const tz = await getUserTimezone(userId);
            const endDate = todayInTz(tz);
            const startDate = shiftLocalDate(endDate, -6);
            const [meals, water, goals] = await Promise.all([
                getMealsInRange(userId, startDate, endDate, tz),
                getWaterInRange(userId, startDate, endDate, tz),
                getNutritionGoals(userId),
            ]);
            const buckets = buildDailyBuckets(
                meals,
                water,
                startDate,
                endDate,
                tz,
            );
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: "text/plain",
                        text: computeWeeklyDigest(
                            gateAlcohol(buckets, alcohol),
                            goals,
                        ),
                    },
                ],
            };
        },
    );

    server.registerTool(
        "set_timezone",
        {
            title: "Set Timezone",
            description:
                "Set the user's IANA timezone (e.g. 'America/Los_Angeles', 'Europe/Berlin', 'Asia/Tokyo'). This controls which calendar day meals and water are grouped into — e.g. a meal logged at 11pm in LA counts on that LA day, not the next UTC day — and it is also how a logged_at with no UTC offset is placed on write, which is permanent: correcting the timezone later re-buckets nothing that is already stored. If the user hasn't set one yet and logs a meal or asks about 'today', offer to set it.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                timezone: z
                    .string()
                    .describe(
                        "IANA timezone identifier (e.g. 'America/New_York'). Must be a valid tzdata name.",
                    ),
            },
        },
        async ({ timezone }) => {
            return withAnalytics(
                "set_timezone",
                async () => {
                    if (!validateTz(timezone)) {
                        throw new Error(
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
                { userId },
            );
        },
    );

    server.registerTool(
        "get_timezone",
        {
            title: "Get Timezone",
            description:
                "Get the user's configured IANA timezone, along with their current local date and time. Returns UTC if no profile has been set.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async () => {
            return withAnalytics(
                "get_timezone",
                async () => {
                    const tz = timezoneFromProfile(await getProfile(userId));
                    if (tz === null) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `No timezone set yet (defaulting to UTC). ${formatClockLine("UTC")} Call set_timezone to configure one so 'today' matches the user's local calendar day.`,
                                },
                            ],
                        };
                    }
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Timezone: ${tz}. ${formatClockLine(tz)}`,
                            },
                        ],
                    };
                },
                { userId },
            );
        },
    );

    // The clock is the server's to give, not the user's: a host that keeps the
    // wall time out of the model's context otherwise leaves it with no way to
    // resolve "this morning" except asking or guessing (issue #102).
    // get_timezone answers this too, but only a model that already suspects a
    // timezone problem thinks to call it — the tool NAME is the discoverable
    // part, which is why this exists as well as the fuller line above.
    server.registerTool(
        "get_current_time",
        {
            title: "Get Current Time",
            description:
                "Get the current date and time in the user's timezone, plus the UTC instant. Call this whenever you need to know what time it is for this user — to resolve 'today', 'this morning', 'an hour ago' or 'last Monday' into a real timestamp — instead of asking the user or guessing. Not needed to log something that is happening now: omit logged_at and the server stamps the current time itself.",
            annotations: {
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
                            : " No timezone is set for this account, so this is UTC and may not be the user's actual local time — offer set_timezone.";
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${formatClockLine(configuredTz ?? "UTC")}${unset}`,
                            },
                        ],
                    };
                },
                { userId },
            );
        },
    );

    server.registerTool(
        "delete_account",
        {
            title: "Delete Account",
            description:
                "Permanently delete the user's account and all associated data (meals, tokens, auth). This action is irreversible. Always confirm with the user before calling this tool.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: {
                confirm: z
                    .boolean()
                    .describe(
                        "Must be true to confirm deletion. Always ask the user for explicit confirmation before setting this to true.",
                    ),
            },
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
                    userId: confirm ? DELETED_ACCOUNT_ANALYTICS_ID : userId,
                },
            );
        },
    );
}

// Build a fresh McpServer with this user's tools registered.
async function buildMcpServer(c: Context, userId: string): Promise<McpServer> {
    const proto = c.req.header("x-forwarded-proto") || "http";
    const host =
        c.req.header("x-forwarded-host") || c.req.header("host") || "localhost";
    const baseUrl = `${proto}://${host}`;

    const server = new McpServer(
        {
            name: "nutrition-mcp",
            version: "1.24.2",
            icons: [
                {
                    src: `${baseUrl}/favicon.ico`,
                    mimeType: "image/x-icon",
                },
            ],
        },
        {
            capabilities: { tools: {}, resources: {} },
            instructions: SERVER_INSTRUCTIONS,
        },
    );

    // ONE `select * from profiles` for all three display preferences. The
    // getWidgetsEnabled / getAlcoholTrackingEnabled / getPreferredDrinkUnit
    // wrappers each run that identical query themselves, so calling all three
    // tripled it on the hot path of every single tool call; the *FromProfile
    // derivations are the pure halves, exported for exactly this. Alcohol
    // resolves to a drink unit only when tracking is on — null is what every
    // display path treats as "this user does not track alcohol" (storage is
    // never affected).
    const profile = await getProfile(userId);
    const drinkUnit = preferredDrinkUnitFromProfile(profile);

    registerTools(
        server,
        userId,
        widgetsEnabledFromProfile(profile),
        alcoholTrackingEnabledFromProfile(profile) ? (drinkUnit ?? "us") : null,
    );
    return server;
}

// Stateless: /mcp holds no per-session state. Every request builds a brand-new
// transport + McpServer and tears it down when the response completes (the SDK
// forbids reusing a stateless transport). Because nothing is kept in-process, a
// restart/deploy can never strand a connected client — there is no session to
// lose, and therefore no reconnect step for a client to wedge on.
//
// Only POST (JSON-RPC request/response) is served. We reject GET and DELETE
// with 405 instead of delegating to the transport, because a GET would open a
// long-lived standalone SSE stream — and that stream is the one piece of state
// a deploy still severs. Since stateless mode never pushes server-initiated
// messages, that stream carries nothing; the only thing it does is die on every
// restart and leave some clients (observed: a Claude connector) wedged in a
// "connected but no tools" state. Refusing the stream (spec-allowed: a server
// MAY return 405 when it offers no SSE stream at this endpoint) means the client
// holds nothing that a deploy can break, so updates become truly invisible.
export const handleMcp = async (c: Context) => {
    if (c.req.method !== "POST") {
        return c.json(
            {
                jsonrpc: "2.0",
                id: null,
                error: {
                    code: -32000,
                    message:
                        "Method Not Allowed: this endpoint serves POST only and offers no SSE stream",
                },
            },
            405,
            { Allow: "POST" },
        );
    }

    const userId = c.get("userId") as string;

    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
    const server = await buildMcpServer(c, userId);
    await server.connect(transport);

    return transport.handleRequest(c.req.raw);
};
