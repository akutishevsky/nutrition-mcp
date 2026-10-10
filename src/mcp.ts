import {
    createMcpHandler,
    McpServer,
    ProtocolError,
    JSONRPC_VERSION,
    type McpRequestContext,
} from "@modelcontextprotocol/server";
import { getBaseUrl } from "./url.js";
import { formatClientId } from "./client-id.js";
import { z } from "zod";
import type { Context } from "hono";
import {
    insertMeal,
    getMealsByDate,
    getMealsInRange,
    searchMeals,
    deleteMeal,
    updateMeal,
    type MealSnapshotGuard,
    snapshotGuardOf,
    SnapshotConflictError,
    updateSavedMealIfUnchanged,
    deleteAllUserData,
    upsertNutritionGoals,
    getNutritionGoals,
    getNutritionGoalsHistory,
    hasMealsBefore,
    insertWater,
    getWaterByDate,
    getWaterInRange,
    deleteWater,
    insertWeight,
    getWeightByDate,
    getWeightInRange,
    getAllWeight,
    getLatestWeight,
    updateWeight,
    deleteWeight,
    insertBodyMeasurement,
    getBodyMeasurementsInRange,
    getBodyMeasurement,
    getSupabase,
    updateBodyMeasurement,
    deleteBodyMeasurement,
    preferredLengthUnitFromProfile,
    getPreferredLengthUnit,
    getUserTimezone,
    getPreferredWeightUnit,
    getUserLocale,
    widgetsEnabledFromProfile,
    alcoholTrackingEnabledFromProfile,
    preferredDrinkUnitFromProfile,
    preferredWeightUnitFromProfile,
    timezoneFromProfile,
    localeFromProfile,
    upsertProfile,
    getProfile,
    countMeals,
    existingIdempotencyKeys,
    existingMealIds,
    isUuid,
    getMealItems,
    countMealItems,
    replaceMealItems,
    getMealById,
    getCachedFoodRecord,
    createSavedMeal,
    getSavedMeals,
    getSavedMeal,
    findSavedMealsByName,
    countSavedMeals,
    updateSavedMeal,
    deleteSavedMeal,
    searchSavedMeals,
    SavedMealNameTaken,
    type SavedMealInput,
    type SavedMealWithItems,
    type Meal,
    type MealInput,
    type NutritionGoals,
    type WaterEntry,
    type WeightEntry,
    type BodyMeasurementEntry,
} from "./supabase.js";
import {
    DELETED_ACCOUNT_ANALYTICS_ID,
    withAnalytics,
    categorizeError,
} from "./analytics.js";
import { ToolError, newErrorRef, toolErrorWithUserText } from "./errors.js";
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
import { SITE_LOCALES, LOCALE_NAMES, type SiteLocale } from "./routes.js";
import {
    buildDailyBuckets,
    computeTrends,
    computeMealPatterns,
    computeWeeklyDigest,
    computeWeightTrend,
    dayCarries,
    coveredDailyAverage,
    dateDiffDays,
    limitNotRecorded,
    type DailyBucket,
} from "./insights.js";
import { analyzeWeightHistory, defaultRangeFor } from "./weight-trend.js";
import {
    toGrams,
    formatWeight,
    fromGrams,
    isWeightUnit,
    pickWriteUnit,
    isPlausibleWeightGrams,
    type WeightUnit,
    BODY_MEASUREMENT_KINDS,
    type BodyMeasurementKind,
    type LengthUnit,
    isLengthUnit,
    fromMillimetres,
    assertPlausibleLength,
    pickLengthWriteUnit,
    measurementLabel,
} from "./units.js";
import { formatAlcohol, isDrinkUnit, type DrinkUnit } from "./alcohol.js";
import { exportAllData } from "./export.js";
import {
    createSupabaseHealthSyncStore,
    type HealthSyncLinkStatus,
} from "./health-sync-store.js";
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
import {
    getFoodRecord,
    searchUsda,
    sanitizeQuery,
    usdaUnavailableText,
    USDA_AUTH_FAILED_TEXT,
    USDA_BAD_QUERY_TEXT,
    USDA_NO_MATCH_TEXT,
    USDA_NO_RECORD_TEXT,
    type UsdaDeps,
} from "./usda.js";
import { formatUsdaRecord, formatUsdaSearch } from "./usda-text.js";
import { formatMealSearchResults, formatSavedMealMatches } from "./search.js";
import {
    MAX_ITEMS_PER_MEAL,
    MAX_ITEM_AMOUNT,
    MAX_SAVED_MEALS_PER_USER,
    MAX_SERVINGS,
    MEAL_NUTRIENT_KEYS,
    applyItemChanges,
    assertMealTotals,
    buildMealItemsMeta,
    compactSugarFigure,
    formatItemsBlock,
    normalizeNameRef,
    scaleItems,
    scaleTotals,
    sumItems,
    totalsSentWithItems,
    totalsWithItemsError,
    validateItems,
    validateSavedMealName,
    type MealItemValues,
    type MealItemsMeta,
    type MealNutrientKey,
    type NutrientValues,
} from "./meal-items.js";
import {
    ADDED_SUGAR_REQUIRED_FROM_ENV,
    addedSugarError,
    addedSugarExtra,
    addedSugarMissing,
    addedSugarMissingError,
    addedSugarMissingText,
    addedSugarRequiredAt,
    buildAddedSugarMeta,
    parseAddedSugarRequiredFrom,
} from "./added-sugar.js";
import {
    getWidgetHtml,
    MEAL_CONTRIBUTORS_META_KEY,
    WEIGHT_SERIES_META_KEY,
    PERIOD_AVERAGES_META_KEY,
    ADDED_SUGAR_META_KEY,
    SATURATED_FAT_META_KEY,
    MEAL_BREAKDOWN_TOP_N,
    MEAL_ITEMS_META_KEY,
    NUTRIENT_SOURCES_META_KEY,
} from "./widgets.js";
import {
    assertFoodRefPlacement,
    buildNutrientSourcesMeta,
    deriveMealProvenance,
    formatItemSourcesBlock,
    formatSourcesLine,
    type ItemSourcesInput,
    mergeProvenance,
    parseFoodRef,
    parseNutrientSources,
    parseSourceDetail,
    resolveNutrientSources,
    scaleSourceDetail,
    type LoggedValues,
    type NutrientSources,
    type NutrientSourcesMeta,
    type SourceDetail,
} from "./provenance.js";
import {
    buildSaturatedFatMeta,
    saturatedFatExtra,
    transFatExtra,
    saturatedAboveFatNote,
} from "./saturated-fat.js";
import {
    GRANULARITIES,
    buildPeriodAveragesMeta,
    dayTotalsFromMeals,
    formatPeriodContent,
    targetsRecordedFrom,
    yearSpanStart,
    type Granularity,
} from "./periods.js";
import {
    clipDescription,
    formatMg,
    formatMealFull,
    renderMealListing,
    MEAL_LISTING_MAX_CHARS,
    type AlcoholDisplay,
} from "./meal-listing.js";

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
// Fiber, sugar and added sugar are unconditional; caffeine deliberately is NOT. That
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
const NUTRIENT_COVERAGE = `Fiber, sugar, added sugar, saturated fat, trans fat and caffeine are tracked alongside the headline macros.
- saturated_fat_g and trans_fat_g are optional on every meal. saturated_fat_g is part of fat_g, never more than it; trans_fat_g is a separate fat type, stored as given and not checked against fat_g. A missing value is stored as "not measured" and leaves that day out of the saturated-fat average and limit; trans fat has no limit and is shown only where it was recorded. A figure comes from a nutrition label, the product's published nutrition or an estimate; 0 is the correct value for a food with none. On an itemized meal saturated_fat_g is all-or-none across the items, like fiber_g's sugar pair: a list that gives it on some items and not others is refused with nothing saved. trans_fat_g may be given on some items and not others; the meal's trans fat is the sum of the items that carry it.
- fiber_g and sugar_g are read on every meal, like protein, carbs and fat. A missing value is stored as "not measured", not as zero, and leaves that whole day out of the user's fiber and sugar averages, goal lines and charts; an estimate keeps the day in. In order of accuracy, a figure comes from a nutrition label, a barcode lookup, the chain's or product's published per-item nutrition, or an estimate from the ingredients and the portion — an exact figure is no more required here than it is for protein. 0 is the correct value for food that has none (a steak, eggs, oil, black coffee).
- added_sugar_g is read on every meal too, like sugar_g: the part of sugar_g added during processing or preparation, never more than sugar_g. It accompanies sugar_g: a call that gives sugar_g without added_sugar_g may be refused, with nothing saved. It is a classification more than a measurement — whole fruit, vegetables, plain milk, meat and rice are 0, and a soft drink's sugar is all added. A missing value is stored as "not recorded" and leaves that day out of the added-sugar average and limit.
- caffeine_mg applies only to caffeine sources: coffee of any kind (decaf included, about 2-5 mg), tea, matcha, yerba mate, cola and many other soft drinks, energy drinks, pre-workout, chocolate and cocoa, coffee ice cream, caffeine tablets. A label or a chain's published nutrition gives the figure where available; the field description lists typical amounts otherwise. For anything that is not a caffeine source the field is left out: an explicit 0 means "measured, and it was none", and it shows a caffeine row to a user who never consumes any.`;

// Sent to clients in the initialize response (SDK ServerOptions.instructions).
// Advisory — not every client surfaces it, so the photo-logging substance
// (resolve open questions and get the user's confirmation before logging, unless
// they ask to just log it) is repeated in log_meal's own description. Keep both
// in sync. Both describe what an accurate entry needs rather than scripting the
// conversation: the directory policy asks tool text to describe what the tool
// does, not how Claude should behave, and to name no external tool (so no "search
// the web") the user did not ask for.
const SERVER_INSTRUCTIONS = `Nutrition tracking: meals (with their ingredients and saved meals), water, weight, body measurements, goals, and trends, per-user with timezone support.

All nutrition figures are estimates and this server does not provide medical or dietary advice.

Body measurements are circumferences of nine sites (waist, hips, neck, chest, shoulders, upper arm, forearm, thigh, calf), stored with the number and unit (cm or in) they were given in; the server converts between units itself. They are recorded as given, with no targets or interpretation.

Current time — some hosts put the current date and time in context and some do not; this server always knows both the clock and the user's timezone, and get_current_time returns them.
- Entries that omit logged_at are stamped by the server with the current time, which is more accurate than a reconstructed one; something that just happened needs no time from the user.
- A relative time ("this morning", "an hour ago", "last Monday") or "today" resolves via get_current_time, passed on as the local time in logged_at.
- A time from the user is needed only for an entry at some other moment they have not mentioned.

Recording a complete meal — this applies to every write path (log_meal, update_meal, save_meal, log_saved_meal, a barcode lookup that is then logged, a meal copied from search_meals), not just to photos.
${NUTRIENT_COVERAGE}
USDA FoodData Central (search_foods, get_food_macros) holds generic, unbranded foods with values per 100 g from USDA's own records. A nutrient its record does not carry is reported as not recorded, never as zero.
Every nutrient value on a meal records its source: USDA FoodData Central, Open Food Facts, the user, or an estimate. The server labels a value with a USDA or Open Food Facts record only when it matches that record for the amount logged; any other value is labelled as the user's or an estimate.

A meal logged without its fiber, sugar or added sugar can be completed later: update_meal writes only the fields passed, so it fills in the missing figure once the user wants it filled in. For a meal logged with items the figure goes on the items: update_meal's full items list, with the value on each item.

Ingredients and saved meals:
- A meal can be logged with items: a list of its ingredients, each with its amount and nutrients. Its totals are then the sum of the items, so the totals are not sent alongside the items. update_meal changes such a meal's totals through items (the full new list), not through the totals.
- A saved meal is a named meal kept with its values per serving and, optionally, its ingredients. save_meal creates one, from a meal already logged (from_meal_id), from items, or from totals. get_saved_meals lists them, and search_meals also finds them by name or ingredient.
- log_saved_meal writes a saved meal as an ordinary meal entry carrying a copy of its values, optionally scaled by servings, or with single items' amounts changed or left out. The entry is then a meal like any other.
- Editing or deleting a saved meal (update_saved_meal, delete_saved_meal) leaves meals already logged from it unchanged.

Meals from photos:
- A packaged product with a visible barcode: the digits printed under the barcode go to lookup_barcode.
- For a plated or prepared meal, whether it came from a restaurant/takeout or was made at home changes the evidence available. When the user names the restaurant, the name matters: chains usually publish per-item nutrition, and an independent restaurant's menu or ingredient list — when the user shares it or it is otherwise available — reveals butter, cream, oil and sugar a photo hides. Restaurant cooking is usually richer than the same dish made at home. Where the user ate is not needed for an estimate; do not infer a location the user did not state.
- search_meals over past logs (for the dish, and for the restaurant name when the user gave one) reveals variations and hidden ingredients (raisins vs banana, milk vs water, added honey or oil). It matches short keywords, and past logs may be in the conversation language or in English.
- Portions are most reliable in household measures the user can verify at a glance (a glass, a handful, a tablespoon, half the plate) rather than grams, and for a restaurant serving, how much was actually eaten matters most.
- A photo alone leaves open questions — which variation or menu item each dish is, how much was eaten, and ingredients it cannot show (oil, butter, sugar, dressing, sauce, what a drink was made with). log_meal is for a meal whose summary the user has confirmed, or one they asked to log as is. A single obvious item may leave one question open; a full plate usually leaves several.
- A description that carries the confirmed portions (e.g. "Oatmeal (1 glass raw oats, 2 glasses milk) with banana and honey (1 tbsp)") and, for a restaurant meal the user named, the restaurant name as they gave it (e.g. "Pad thai with chicken (1 plate, finished) at Thai Basil") keeps future search_meals results self-describing. A neighbourhood or city belongs there only if the user stated it; do not infer a location the user did not state. Where each figure came from (a USDA FoodData Central record, an Open Food Facts product, the user, or an estimate) is recorded per nutrient by the server and shown with the meal, so the description does not need to name it; notes can hold a source those labels do not cover, such as a restaurant's published nutrition.

"Log my usual X" works the same way: search_meals finds the past entries and any matching saved meal. For a past entry, the variation and the amount are what remain to confirm before log_meal; a saved meal is logged with log_saved_meal.

Importing history from another app (MyFitnessPal, Cronometer, Lose It!, MacroFactor or a similar export):
1. start_meal_import is for a user who has a file. It opens an importer the user drives: it reads and maps the file in the browser, so the rows never pass through the conversation and cannot be mistranscribed, and it handles column mapping, batching and retries.
2. bulk_import_meals is the path when the importer is not an option: the data is already pasted into the conversation, the user cannot use the panel, or the importer reports that this client will not let it save. Its description covers parsing, the control totals (counted from the source text, not from the rows as written) and the dry run.
3. One bulk_import_meals call carries up to ${MAX_ROWS_PER_CALL} rows, validates and reports on every row, supports a dry run, and recognises rows it has already written, so a failed batch can be re-sent safely while the timezone is unchanged (see 5). A backfill done as a loop of log_meal calls has none of that, and each call counts separately against the per-account rate limit.
4. Times without an explicit UTC offset are placed using the saved timezone (get_profile shows it; an unset one means UTC), so correcting it after an import moves every imported meal — onto an adjacent day for anything logged near midnight.
5. The dry run echoes back the date, time and meal type for every row, so a misread date column shows up there rather than in the totals. Re-sending the same rows is safe as long as the timezone hasn't changed in between — the server recognises them and skips them, so a retry after a failure or a timeout doesn't duplicate anything. A timezone change between attempts re-reads the offset-less rows and inserts them again.`;

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
    // Part of fat_g; text only, like added_sugar_g below.
    saturated_fat_g: number;
    trans_fat_g: number;
    fiber_g: number;
    sugar_g: number;
    // Text only: totalsPayloadOf picks its fields by name and never emits this
    // one, because every structuredContent shape that carries totals is frozen
    // (see ADDED_SUGAR_META_KEY for where the widgets get it instead).
    added_sugar_g: number;
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
        saturated_fat_g: 0,
        trans_fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        added_sugar_g: 0,
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
        totals.saturated_fat_g += m.saturated_fat_g ?? 0;
        totals.trans_fat_g += m.trans_fat_g ?? 0;
        // Summed regardless of the alcohol opt-in: the flag gates display, and
        // gating here would make the total depend on when it was computed.
        // The `?? 0` here is a SUM, which is fine — a missing value adds
        // nothing. It is only the AVERAGE that needs to know a null from a
        // zero, and that is what nutrientPresence below is for.
        totals.fiber_g += m.fiber_g ?? 0;
        totals.sugar_g += m.sugar_g ?? 0;
        totals.added_sugar_g += m.added_sugar_g ?? 0;
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
    saturated_fat_g: boolean;
    trans_fat_g: boolean;
    fiber_g: boolean;
    sugar_g: boolean;
    added_sugar_g: boolean;
    alcohol_g: boolean;
    caffeine_mg: boolean;
}

export function nutrientPresence(meals: Meal[]): NutrientPresence {
    return {
        saturated_fat_g: dayCarries(meals, "saturated_fat_g"),
        trans_fat_g: dayCarries(meals, "trans_fat_g"),
        fiber_g: dayCarries(meals, "fiber_g"),
        sugar_g: dayCarries(meals, "sugar_g"),
        added_sugar_g: dayCarries(meals, "added_sugar_g"),
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
    // No trans fat average: nothing reads one (trans fat has no limit and is
    // shown per day only), so it is not zero-filled over every day here.
    averages: Omit<DailyTotals, "trans_fat_g">;
    recordedDays: {
        saturated_fat_g: number;
        fiber_g: number;
        sugar_g: number;
        added_sugar_g: number;
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
        sum.saturated_fat_g += totals.saturated_fat_g;
        sum.water_ml += totals.water_ml;
    }
    const mealsByDay = perDay.map((d) => d.meals);
    const fiber = coveredDailyAverage(mealsByDay, "fiber_g");
    const sugar = coveredDailyAverage(mealsByDay, "sugar_g");
    const addedSugar = coveredDailyAverage(mealsByDay, "added_sugar_g");
    const saturated = coveredDailyAverage(mealsByDay, "saturated_fat_g");
    const alcohol = coveredDailyAverage(mealsByDay, "alcohol_g");
    const caffeine = coveredDailyAverage(mealsByDay, "caffeine_mg");
    const n = perDay.length || 1;
    return {
        averages: {
            calories: sum.calories / n,
            protein_g: sum.protein_g / n,
            carbs_g: sum.carbs_g / n,
            fat_g: sum.fat_g / n,
            saturated_fat_g: saturated.avg ?? 0,
            fiber_g: fiber.avg ?? 0,
            sugar_g: sugar.avg ?? 0,
            added_sugar_g: addedSugar.avg ?? 0,
            alcohol_g: alcohol.avg ?? 0,
            caffeine_mg: caffeine.avg ?? 0,
            water_ml: Math.round(sum.water_ml / n),
        },
        recordedDays: {
            fiber_g: fiber.days,
            sugar_g: sugar.days,
            added_sugar_g: addedSugar.days,
            saturated_fat_g: saturated.days,
            alcohol_g: alcohol.days,
            caffeine_mg: caffeine.days,
        },
    };
}

// The summary's daily-average line for a limited partial nutrient (added sugar,
// saturated fat): the same rule for both, so only the label differs. Text,
// because no structuredContent shape may carry it (the summary's `averages`
// schema is frozen). Covered days only, like sugar (rangeAverages), against the
// limit when one is set. Empty for a single day, whose section already prints
// the figure. When no logged day recorded the nutrient it is empty without a
// limit, and "not recorded in this period" with one.
export function ceilingAverageLine(
    label: string,
    average: number,
    recordedDays: number,
    loggedDays: number,
    limit: number | null,
): string {
    if (loggedDays < 2) return "";
    if (recordedDays === 0) {
        // With a limit set, the gap is stated rather than dropped (see
        // limitNotRecorded); without one there is nothing to report.
        return hasActiveTarget(limit, "ceiling")
            ? `\n\n${label}, daily average: ${limitNotRecorded("period", limit)}`
            : "";
    }
    return `\n\n${formatGoalLine(
        `${label}, daily average`,
        "g",
        average,
        limit,
        "ceiling",
    )}`;
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
        description: clipDescription(m.description),
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

// MEAL_BREAKDOWN_TOP_N lives in src/widgets.ts (Supabase-free, so the widget
// harness can import it too); re-exported here for existing importers.
export { MEAL_BREAKDOWN_TOP_N };

// The metrics a summary's meal list can be opened on, in MEAL_BREAKDOWN_ITEM's
// field names.
const BREAKDOWN_METRICS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "alcohol_g",
    "caffeine_mg",
] as const;

type BreakdownRow = ReturnType<typeof mealBreakdown>[number];

// How many meals contributed to each metric over the whole window — the true
// "N more meals" denominator once `meals` is cut to the top N. Alcohol is null
// when tracking is off, like every other structured alcohol field.
export const MEAL_CONTRIBUTORS = z.object({
    calories: z.number(),
    protein_g: z.number(),
    carbs_g: z.number(),
    fat_g: z.number(),
    fiber_g: z.number(),
    sugar_g: z.number(),
    alcohol_g: z.number().nullable(),
    caffeine_mg: z.number(),
});

export type MealContributors = z.infer<typeof MEAL_CONTRIBUTORS>;

// Defined in src/widgets.ts (so the side-effect-free widget harness can import
// it too); re-exported here beside the MealContributors it carries.
export { MEAL_CONTRIBUTORS_META_KEY };
// Same arrangement for get_weight_trends' series (WeightSeriesMeta, built in
// src/weight-trend.ts).
export { WEIGHT_SERIES_META_KEY };
// And for get_trends' per-period averages (PeriodAveragesMeta, built in
// src/periods.ts), present only when `group_by` is set.
export { PERIOD_AVERAGES_META_KEY };
// And for the added-sugar figures (AddedSugarMeta) that five tools carry
// beside their frozen structuredContent.
export { ADDED_SUGAR_META_KEY, SATURATED_FAT_META_KEY };
// And for the ingredients behind the breakdown rows (MealItemsMeta, built in
// src/meal-items.ts), present only when some row has items.
export { MEAL_ITEMS_META_KEY };

/** Zero contributors, for a window with no meals at all. `.nullable()` is not
 *  optional: the alcohol key is always present, null when tracking is off. */
export function emptyMealContributors(
    alcohol: AlcoholDisplay,
): MealContributors {
    return {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        alcohol_g: alcohol ? 0 : null,
        caffeine_mg: 0,
    };
}

/**
 * Bound a multi-day breakdown to what the summary widget can show: the
 * order-preserving union of each metric's top MEAL_BREAKDOWN_TOP_N rows (by
 * value, ties to the earlier row — the widget's own stable sort), so at most
 * 8 metrics × N rows. A 186-meal month otherwise shipped ~47 KB of rows the
 * widget never drew. `contributors` counts every row with a positive value,
 * which is the widget's own `v > 0` filter.
 */
export function topMealBreakdown(
    rows: BreakdownRow[],
    alcohol: AlcoholDisplay,
): {
    meals: BreakdownRow[];
    contributors: MealContributors;
    /** Indices of the kept rows, in order — to pick the matching meals. */
    kept: number[];
} {
    const keep = new Set<number>();
    const contributors = emptyMealContributors(alcohol);
    const top = (values: number[]) =>
        values
            .map((v, i) => ({ i, v }))
            .filter((r) => r.v > 0)
            .sort((a, b) => b.v - a.v || a.i - b.i);
    for (const key of BREAKDOWN_METRICS) {
        const ranked = top(rows.map((row) => row[key] ?? 0));
        if (key !== "alcohol_g" || alcohol) contributors[key] = ranked.length;
        for (const r of ranked.slice(0, MEAL_BREAKDOWN_TOP_N)) keep.add(r.i);
    }
    const kept = rows.map((_, i) => i).filter((i) => keep.has(i));
    return {
        meals: kept.map((i) => rows[i]!),
        contributors,
        kept,
    };
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
const MEAL_PROGRESS_OUTPUT_SCHEMA = z.object({
    action: z.enum(["logged", "updated"]),
    date: z.string(),
    drink_unit: DRINK_UNIT_FIELD,
    // The widget's UI language — see the identical field on
    // get_nutrition_summary's outputSchema for why this is z.string() and
    // resolved server-side via getUserLocale.
    locale: z.string(),
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
});

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
    // Trans fat is optional here: no payload built from these totals emits it.
    totals: Omit<DailyTotals, "trans_fat_g"> &
        Partial<Pick<DailyTotals, "trans_fat_g">>,
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
            saturated_fat_g: bucket.saturated_fat_g,
            trans_fat_g: bucket.trans_fat_g,
            fiber_g: bucket.fiber_g,
            sugar_g: bucket.sugar_g,
            // Never emitted by totalsPayloadOf (the days schema is frozen);
            // the widget reads per-day added sugar from ADDED_SUGAR_META_KEY.
            added_sugar_g: bucket.added_sugar_g,
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
            "IANA timezone (e.g. 'Europe/Kyiv') this row's logged_at should be read in, when logged_at carries no offset. Map it from a 'timezone' column when the file is an export from THIS server (the meals.csv in an export_all_data archive carries one) — that column names the zone the meal was actually recorded in, which may no longer match the account's current timezone. Omit for files with no such column; the row then falls back to the account's configured timezone.",
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
            "TOTAL sugars in grams, including sugar naturally present in fruit and milk as well as added sugar — the figure an export's 'Sugars' column carries.",
        ),
    added_sugar_g: z.coerce
        .number()
        .optional()
        .describe(
            "Added sugars in grams — the figure an export's 'Added sugars' column carries. Part of sugar_g and never more than it; a row where it is more is reported as a per-row error.",
        ),
    saturated_fat_g: z.coerce
        .number()
        .optional()
        .describe(
            "Saturated fat in grams, the part of fat_g that is saturated. Stored as given and not checked against fat_g: a row where it is more imports with both figures as sent. Omit when the source has no such column; a missing value is not measured, not zero.",
        ),
    trans_fat_g: z.coerce
        .number()
        .optional()
        .describe(
            "Trans fat in grams, a separate fat type, stored as given and not checked against fat_g. Omit when the source has no such column; a missing value is not measured, not zero.",
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
            "The value of the 'id' column when the file is an export from THIS server (the meals.csv in an export_all_data archive carries it). Always pass it through: it is how a re-imported backup is recognized as the user's existing meals instead of being duplicated. Ignored for files from other apps.",
        ),
    provenance_version: z
        .union([z.string(), z.number()])
        .nullable()
        .optional()
        .describe(
            "The provenance_version column of an export from THIS server. Pass it through with nutrient_sources and source_detail; a file from another app leaves all three out. Without it the nutrient sources are ignored.",
        ),
    nutrient_sources: z
        .union([z.string(), z.record(z.string(), z.unknown())])
        .nullable()
        .optional()
        .describe(
            "The nutrient_sources column of an export from THIS server, as the JSON text it was written as (or the parsed object). Carries where each nutrient value came from; record-backed sources are re-checked against the stored food record and kept as estimate when they no longer match.",
        ),
    source_detail: z
        .union([z.string(), z.record(z.string(), z.unknown())])
        .nullable()
        .optional()
        .describe(
            "The source_detail column of an export from THIS server, as JSON text (or the parsed object). Names the food record each record-backed source points at.",
        ),
});

// ---------- start_meal_import ----------

// Real content: the import widget needs all of this. With no structuredContent
// the bridge never paints and the iframe sits on its loading state forever.
export const START_IMPORT_OUTPUT_SCHEMA = z.object({
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
    // The widget's UI language — see the identical field on
    // get_nutrition_summary's outputSchema for why this is z.string() and
    // resolved server-side via getUserLocale.
    locale: z.string(),
});

export function startImportPayload(opts: {
    tz: string;
    tzConfigured: boolean;
    widgetsEnabled: boolean;
    alcohol: AlcoholDisplay;
    locale: string;
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
        locale: opts.locale,
    };
}

// The `_meta` entry carrying the ingredients behind a tool's breakdown rows,
// for the widgets' expandable rows: `rowMeals` must be exactly the meals behind
// structuredContent.meals, in row order (the widget joins by position). `{}`
// when no row has items, so the key is absent and the result unchanged. A
// failed read never fails the tool — the rows are the product, the items only
// their detail — so it logs one ref line (no user id, no user text) and the
// widget simply shows no expanders.
//
// The same read carries each row's nutrient labels (NUTRIENT_SOURCES_META_KEY),
// with the same gate and the same drop-the-key behaviour.
async function mealItemsMetaEntry(
    userId: string,
    rowMeals: readonly Meal[],
    alcohol: AlcoholDisplay,
): Promise<{
    [MEAL_ITEMS_META_KEY]?: MealItemsMeta;
    [NUTRIENT_SOURCES_META_KEY]?: NutrientSourcesMeta;
}> {
    if (rowMeals.length === 0) return {};
    let items: Map<string, MealItemValues[]>;
    try {
        items = await getMealItems(
            userId,
            rowMeals.map((m) => m.id),
        );
    } catch (err) {
        const ref = newErrorRef();
        console.warn(
            `[widget] meal-items read error ref=${ref}: ${JSON.stringify(err instanceof Error ? err.message : String(err))}`,
        );
        return {};
    }
    const payload = buildMealItemsMeta(rowMeals, items, alcohol != null);
    const mealSources = new Map(
        rowMeals.map((m) => [
            m.id,
            {
                sources: parseNutrientSources(m.nutrient_sources ?? null),
                detail: parseSourceDetail(m.source_detail ?? null),
            },
        ]),
    );
    const sources = buildNutrientSourcesMeta(
        rowMeals,
        mealSources,
        items,
        alcohol != null,
    );
    return {
        ...(payload ? { [MEAL_ITEMS_META_KEY]: payload } : {}),
        ...(sources ? { [NUTRIENT_SOURCES_META_KEY]: sources } : {}),
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
    const profile = await getProfile(userId);
    const tz = timezoneFromProfile(profile) ?? "UTC";
    const locale = localeFromProfile(profile) ?? "en";
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
        locale,
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

    // The day's added sugar, for the widget only: structuredContent's schema
    // is frozen, so it rides in the result's _meta (ADDED_SUGAR_META_KEY).
    // `meals` is the same list, in the same order, as the rows above — the
    // widget joins the two by position.
    // The ingredients ride beside it, aligned with the same rows.
    const meta = {
        [ADDED_SUGAR_META_KEY]: buildAddedSugarMeta({
            goal: goals?.daily_added_sugar_g,
            days: { [mealDate]: meals },
            meals,
        }),
        [SATURATED_FAT_META_KEY]: buildSaturatedFatMeta({
            goal: goals?.daily_saturated_fat_g,
            days: { [mealDate]: meals },
            meals,
        }),
        ...(await mealItemsMetaEntry(userId, meals, alcohol)),
    };

    // tz goes back to the caller so its confirmation prints the meal's time
    // in the same zone this progress section bucketed it by.
    return { progressSection, structuredContent, meta, tz };
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
    saturated_fat_g: true,
    trans_fat_g: true,
    fiber_g: true,
    sugar_g: true,
    added_sugar_g: true,
    alcohol_g: true,
    caffeine_mg: true,
};

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
        // Saturated fat is part of the fat above and carries a ceiling, gated on
        // presence like sugar: a day that recorded none prints nothing unless a
        // limit is set, which then gets the shared not-recorded wording. Trans
        // fat has no goal, so it is a value only, shown when the day recorded it.
        present.saturated_fat_g
            ? formatGoalLine(
                  "Saturated fat",
                  "g",
                  totals.saturated_fat_g,
                  goals?.daily_saturated_fat_g ?? null,
                  "ceiling",
              )
            : hasActiveTarget(goals?.daily_saturated_fat_g, "ceiling")
              ? `Saturated fat: ${limitNotRecorded("day", goals.daily_saturated_fat_g)}`
              : null,
        present.trans_fat_g
            ? `Trans fat: ${Math.round(totals.trans_fat_g * 10) / 10}g`
            : null,
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
        // Its own ceiling, beside total sugar rather than instead of it: the
        // public guidance figures (WHO, AHA, DGA) limit added or free sugar,
        // and a 25 g total-sugar limit is spent by two bananas. Gated on
        // presence like sugar, so a pre-column day prints nothing without a
        // limit. With one, an unrecorded day gets the shared
        // limitNotRecorded wording rather than recordedGoalLine's terse
        // "not recorded / 29g limit", which a model read past to report total
        // sugar against the added-sugar limit.
        present.added_sugar_g
            ? formatGoalLine(
                  "Added sugar",
                  "g",
                  totals.added_sugar_g,
                  goals?.daily_added_sugar_g ?? null,
                  "ceiling",
              )
            : hasActiveTarget(goals?.daily_added_sugar_g, "ceiling")
              ? `Added sugar: ${limitNotRecorded("day", goals.daily_added_sugar_g)}`
              : null,
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
    parts.push(
        `- Saturated fat (max): ${ceiling(goals.daily_saturated_fat_g ?? null, (n) => `${n}g`)}`,
    );
    parts.push(`- Fiber: ${floor(goals.daily_fiber_g, (n) => `${n}g`)}`);
    // "total" leads so the two sugar limits read apart at a glance.
    parts.push(
        `- Sugar, total (max): ${ceiling(goals.daily_sugar_g, (n) => `${n}g`)}`,
    );
    parts.push(
        `- Added sugar (max): ${ceiling(goals.daily_added_sugar_g, (n) => `${n}g`)}`,
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

// Local wall-clock time of a stored instant: "HH:MM" inside a listing that
// already names its day and zone, "YYYY-MM-DD HH:MM" in a one-off confirmation.
// A raw UTC ISO string here put a Kyiv evening weigh-in on the wrong clock.
function localTimeOf(iso: string, tz: string, withDate: boolean): string {
    const local = formatLocalDateTime(iso, tz);
    return withDate ? local.slice(0, 16) : local.slice(11, 16);
}

function timesAreLocal(tz: string): string {
    return `Times are local (${tz}).`;
}

function formatWeightEntry(
    entry: WeightEntry,
    unit: WeightUnit,
    tz: string,
    withDate = false,
): string {
    return `- ${formatWeight(entry.weight_g, unit)} at ${localTimeOf(entry.logged_at, tz, withDate)}${entry.notes ? ` (${entry.notes})` : ""} [id: ${entry.id}]`;
}

// In its own unit the value prints as typed (84.5 cm stays 84.5, not a mm round
// trip); in the other unit it is converted from value_mm. value_entered is a
// `numeric` column PostgREST may hand back as a string, hence Number().
function formatMeasurementValue(
    e: BodyMeasurementEntry,
    unit: LengthUnit,
): string {
    return unit === e.entered_unit
        ? `${Number(e.value_entered)} ${unit}`
        : `${fromMillimetres(e.value_mm, unit)} ${unit}`;
}

// unit null = no saved preference: each row shows in the unit it was entered in.
function formatMeasurementEntry(
    e: BodyMeasurementEntry,
    unit: LengthUnit | null,
    tz: string,
    withDate = false,
): string {
    return `- ${measurementLabel(e.kind)} ${formatMeasurementValue(e, unit ?? e.entered_unit)} at ${localTimeOf(e.logged_at, tz, withDate)}${e.notes ? ` (${e.notes})` : ""} [id: ${e.id}]`;
}

// Shared `logged_at` description for every manual write tool. The three forms
// and the "don't convert to UTC yourself" rule are the whole point: a model
// knows the wall-clock time the user just said, but not the zone's historical
// offset for that date, and guessing it lands the entry on the wrong day.
const LOGGED_AT_FORMS =
    'Accepts a full ISO 8601 timestamp with an offset or Z ("2026-01-05T08:30:00+02:00"), an offset-less local time ("2026-01-05T08:30"), or a bare date ("2026-01-05", anchored at local noon). Offset-less values are resolved in the user\'s saved timezone, so pass the local time exactly as the user gives it and do NOT convert it to UTC yourself.';

// Descriptive variant for tools added after the directory review: same three
// forms, no imperative. The older tools move to it under #198.
const LOGGED_AT_FORMS_PLAIN =
    'Accepts a full ISO 8601 timestamp with an offset or Z ("2026-01-05T08:30:00+02:00"), an offset-less local time ("2026-01-05T08:30"), or a bare date ("2026-01-05", anchored at local noon). Offset-less values are read as wall-clock time in the user\'s saved timezone, and the server works out that date\'s UTC offset itself, so the local time as the user states it is the expected form.';

// Appended to `logged_at` on the three "log it now" tools. This used to say
// "ask the user" — which fired on every single log from any host that keeps the
// wall clock out of the model's context (Claude Desktop among them), turning
// "I just ate X" into an interrogation, or worse a guessed time on the wrong
// day (issue #102). Omitting the field is strictly better than guessing: the
// server stamps `new Date()` and it genuinely knows the time.
const LOGGED_AT_OMIT_IF_NOW =
    " The server knows the current time and the user's timezone, so there is no need to ask the user for it: for something that just happened, omit this field entirely and the server stamps the entry with the current time. Only supply it for an entry that happened at some other moment; get_current_time returns the user's local clock for working that moment out.";

// Descriptive counterpart of LOGGED_AT_OMIT_IF_NOW for tools added after the
// directory review: says what an omitted value means without telling the
// assistant what to do. The older tools move to it under #198.
const LOGGED_AT_OMITTED_PLAIN =
    " Omitted, the server stamps the entry with the current time in the user's timezone; get_current_time returns the user's local clock.";

// What the derived "auto:" key really guarantees: it hashes the RESOLVED
// logged_at, and an omitted logged_at resolves to the arrival instant (ms), so
// replaying a "just now" call is a NEW entry. Deliberately not fixed with a
// time bucket: that would silently merge two genuine identical entries (a
// duplicate is visible and deletable; a lost entry is not), and it would break
// the frozen auto: digest updatedMealIdempotencyKey recomputes.
function idempotencyKeyDescription(
    entry: string,
    sameTimeAdvice: string,
): string {
    return (
        `Optional key that makes a retry safe. Without one, the server derives a key from the ${entry}'s content and its resolved logged_at: replaying a call that carries an explicit logged_at returns the original ${entry} instead of adding another, but a call that omits logged_at is stamped with the moment it arrives, so replaying it adds a new ${entry}. ` +
        `If a call that omits logged_at may need to be retried (for example after a timeout), pass any unique string here, such as a UUID, and send the same value on the retry. ` +
        `Two genuinely separate ${entry}s with identical content and the same logged_at are also treated as one — ${sameTimeAdvice}. Never reuse a key for a different ${entry}.`
    );
}

// Descriptive variant of idempotencyKeyDescription for tools added after the
// directory review: the same guarantees, stated as behaviour rather than as
// instructions to the assistant. The older tools move to it under #198.
function idempotencyKeyDescriptionPlain(entry: string): string {
    return (
        `Optional key that makes a retry safe. Without one, the server derives a key from the ${entry}'s content and its resolved logged_at: replaying a call that carries an explicit logged_at returns the original ${entry} instead of adding another, but a call that omits logged_at is stamped with the moment it arrives, so replaying it adds a new ${entry}. ` +
        `A call that repeats an earlier key, such as a retry after a timeout, returns the ${entry} that key already recorded rather than adding another, so any unique string (a UUID, for example) serves. ` +
        `Two separate ${entry}s with identical content and the same logged_at are treated as one unless their logged_at values or keys differ, and a key repeated for a different ${entry} returns the earlier one instead of recording the new one.`
    );
}

// The one rendering of "what time is it for this user", shared by
// get_current_time and get_profile so the two can never disagree. The weekday
// is there to make "last Monday" resolvable without a second round trip, and
// the UTC instant so a caller can check its own clock against ours. Local time
// is the repo-standard "YYYY-MM-DD HH:mm:ss" wall clock — deliberately not an
// offset-less ISO string, which reads as a machine value a caller might echo
// straight back into logged_at without noticing it has gone stale.
function formatClockLine(tz: string): string {
    const now = new Date();
    return `Local time now: ${weekdayInTz(now, tz)} ${formatLocalDateTime(now, tz)} (${tz}). UTC now: ${now.toISOString()}.`;
}

// The human-readable gloss for a standard-drink unit, shared by
// set_alcohol_tracking and get_profile so the wording can't drift between
// the tool that sets it and the one that reports it back.
function drinkUnitLabel(unit: DrinkUnit): string {
    return unit === "us"
        ? "US standard drinks (14 g each)"
        : "UK units (7.9 g each)";
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
): Promise<{ iso: string | undefined; note: string; tz: string }> {
    const profile = await getProfile(userId);
    const tz = timezoneFromProfile(profile);
    // The zone a confirmation renders the stored instant in: the same one the
    // read paths bucket by, UTC when none is set.
    const displayTz = tz ?? "UTC";
    const unsetTzNote = (value: string) =>
        `${JSON.stringify(value)} carries no UTC offset and this account has no timezone set, so it was read as UTC. The user can set one with set_timezone.`;

    if (raw === undefined) {
        const note =
            tz === null
                ? "\n\nNote: this account has no timezone set, so today's date is being read in UTC — the user can set one with set_timezone."
                : "";
        return { iso: undefined, note, tz: displayTz };
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
            throw new ToolError(`${err.message} ${unsetTzNote(raw)}`);
        }
        throw err;
    }

    const note =
        resolved.usedProfileTimezone && tz === null
            ? `\n\nNote: ${unsetTzNote(raw)} If they do, this entry's time may need correcting.`
            : "";
    return { iso: resolved.instant.toISOString(), note, tz: displayTz };
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

// The same contract for a body measurement's length unit: explicit, then the
// saved length preference, then refuse. The weight unit is never consulted.
async function resolveWriteLengthUnit(
    userId: string,
    explicit: LengthUnit | undefined,
): Promise<LengthUnit> {
    if (explicit) return explicit; // no profile read
    return pickLengthWriteUnit(undefined, await getPreferredLengthUnit(userId));
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
    throw new ToolError(
        `${formatWeight(grams, unit)} is outside the plausible body-weight range (20–500 kg / 44–1102 lb). Double-check the number and unit.${hint}`,
    );
}

// The one knob on the three meal listings (see src/meal-listing.ts). Compact is
// the default because a listing is almost always read to find a meal or total
// a day, and it keeps the id update_meal / delete_meal need. Not added to the
// analytics args: it says nothing about how a tool is failing.
// ---------- Ingredients and saved meals (src/meal-items.ts) ----------

// The item-list shape every items field shares; each tool adds what leaving
// items out means for it, since that differs (log_meal logs from the totals,
// the update tools keep the current items, save_meal keeps the totals).
const ITEM_LIST_SHAPE = `1 to ${MAX_ITEMS_PER_MEAL} items. Each item carries its own amount and nutrients, and the totals are the sum of the items, so the totals fields are not sent alongside.`;
const LOG_MEAL_ITEMS_DESCRIPTION = `The ingredients of this meal, ${ITEM_LIST_SHAPE} Without items the meal is logged from its totals.`;
const UPDATE_MEAL_ITEMS_DESCRIPTION = `The meal's full ingredient list, replacing any items it has: ${ITEM_LIST_SHAPE} Without items the meal's current items stay as they are, and a meal that has items keeps totals equal to their sum.`;
const SAVE_MEAL_ITEMS_DESCRIPTION = `The ingredients of one serving: ${ITEM_LIST_SHAPE} Without items the saved meal is kept from its totals per serving.`;
const UPDATE_SAVED_MEAL_ITEMS_DESCRIPTION = `The saved meal's full ingredient list for one serving, replacing its items: ${ITEM_LIST_SHAPE} Without items the saved meal's current items stay as they are.`;

// Where the values came from (src/provenance.ts). A food_ref names the record a
// value was read from and the amount it is for; the server checks the stored
// record and labels each value itself. Only the shape is checked here: the
// bounds and the basis are checked in the handler (parseFoodRef), so a bad ref
// is a food_ref_invalid ToolError the caller can read, not a schema rejection.
const FOOD_REF_INPUT = z.discriminatedUnion("source", [
    z.object({
        source: z.literal("usda"),
        id: z
            .union([z.string(), z.number()])
            .describe("The FoodData Central fdcId of the food."),
        amount_g: z.coerce
            .number()
            .optional()
            .describe(
                "Grams of the food the values are for. Required for usda.",
            ),
    }),
    z.object({
        source: z.literal("openfoodfacts"),
        id: z
            .union([z.string(), z.number()])
            .describe("The product's barcode, as lookup_barcode returned it."),
        amount_g: z.coerce
            .number()
            .optional()
            .describe(
                "Grams the values are for, when the product's record is per 100 g.",
            ),
        servings: z.coerce
            .number()
            .optional()
            .describe(
                "Servings the values are for, when the product's record is per serving. Give one of servings or amount_g, as the record needs.",
            ),
    }),
]);

const FOOD_REF_DESCRIPTION =
    "The USDA or Open Food Facts record these values were read from, and the amount they are for. The server checks the values against the stored record: a value that matches it is labelled with that record, and any other value is labelled estimated.";

const USER_STATED_DESCRIPTION =
    "Nutrient keys whose values the user gave themselves, read off a label or corrected by them. They are labelled as the user's own figures unless a food_ref record matches them.";

const USER_STATED_INPUT = z
    .array(z.enum(MEAL_NUTRIENT_KEYS))
    .max(MEAL_NUTRIENT_KEYS.length)
    .optional()
    .describe(USER_STATED_DESCRIPTION);

// One ingredient. Every nutrient is optional in the schema; the handler names
// the item that lacks one (validateItems), so the caller sees which item to fix.
const MEAL_ITEM_INPUT = z.object({
    name: z
        .string()
        .describe(
            "The ingredient or food as the user named it, in their language.",
        ),
    amount: z.coerce
        .number()
        .positive()
        .max(MAX_ITEM_AMOUNT)
        .optional()
        .describe("How much of the item, in the unit below (e.g. 5, or 170)."),
    unit: z
        .string()
        .optional()
        .describe("The unit the amount is in (e.g. g, ml, pcs, tbsp)."),
    calories: z.coerce
        .number()
        .min(0)
        .max(MAX_CALORIES)
        .optional()
        .describe(
            "Calories of this item, with the same meaning as log_meal's calories.",
        ),
    protein_g: z.coerce
        .number()
        .min(0)
        .max(MAX_MACRO_G)
        .optional()
        .describe("Protein of this item in grams, as log_meal's protein_g."),
    carbs_g: z.coerce
        .number()
        .min(0)
        .max(MAX_MACRO_G)
        .optional()
        .describe(
            "Carbohydrates of this item in grams, as log_meal's carbs_g.",
        ),
    fat_g: z.coerce
        .number()
        .min(0)
        .max(MAX_MACRO_G)
        .optional()
        .describe("Fat of this item in grams, as log_meal's fat_g."),
    saturated_fat_g: z.coerce
        .number()
        .min(0)
        .max(MAX_MACRO_G)
        .optional()
        .describe(
            "Saturated fat of this item in grams, as log_meal's saturated_fat_g. Give it on every item or on none.",
        ),
    trans_fat_g: z.coerce
        .number()
        .min(0)
        .max(MAX_MACRO_G)
        .optional()
        .describe(
            "Trans fat of this item in grams, as log_meal's trans_fat_g. Optional per item; the meal's trans fat is the sum of the items that carry it.",
        ),
    fiber_g: z.coerce
        .number()
        .min(0)
        .max(MAX_MACRO_G)
        .optional()
        .describe(
            "Fiber of this item in grams, as log_meal's fiber_g. Give it on every item or on none.",
        ),
    sugar_g: z.coerce
        .number()
        .min(0)
        .max(MAX_MACRO_G)
        .optional()
        .describe(
            "Total sugars of this item in grams, as log_meal's sugar_g. Give it on every item or on none.",
        ),
    added_sugar_g: z.coerce
        .number()
        .min(0)
        .max(MAX_MACRO_G)
        .optional()
        .describe(
            "Added sugars of this item in grams, as log_meal's added_sugar_g. Give it on every item or on none.",
        ),
    alcohol_g: z.coerce
        .number()
        .min(0)
        .max(MAX_ALCOHOL_G)
        .optional()
        .describe(
            "Grams of pure ethanol in this item, as log_meal's alcohol_g.",
        ),
    caffeine_mg: z.coerce
        .number()
        .min(0)
        .max(MAX_CAFFEINE_MG)
        .optional()
        .describe(
            "Caffeine of this item in milligrams, as log_meal's caffeine_mg.",
        ),
    food_ref: FOOD_REF_INPUT.optional().describe(
        `${FOOD_REF_DESCRIPTION} Give it on the item it describes.`,
    ),
    user_stated: USER_STATED_INPUT,
});

type MealItemArg = z.infer<typeof MEAL_ITEM_INPUT>;
type FoodRefArg = z.infer<typeof FOOD_REF_INPUT>;

/** A row's nutrient values as the provenance module reads them: a key with no
 *  value is null, which labels nothing. */
function loggedValuesOf(
    values: Partial<Record<MealNutrientKey, number | null | undefined>>,
): LoggedValues {
    return Object.fromEntries(
        MEAL_NUTRIENT_KEYS.map((key) => [key, values[key] ?? null]),
    ) as LoggedValues;
}

/** The labels of one row: the food_ref checked against its stored record (a
 *  cache miss verifies nothing, so the values stay estimates and the write
 *  still succeeds), then user_stated, then estimate. */
async function labelRow(
    ref: FoodRefArg | undefined,
    values: LoggedValues,
    userStated: MealNutrientKey[] | undefined,
): Promise<{ sources: NutrientSources; detail: SourceDetail | null }> {
    if (ref === undefined)
        return resolveNutrientSources({ values, userStated });
    const parsed = parseFoodRef(ref);
    const record = await getCachedFoodRecord(parsed.source, parsed.id);
    return resolveNutrientSources({
        values,
        ref: { ref: parsed, record },
        userStated,
    });
}

/** The item-level labels, one per validated item, from its own food_ref and
 *  user_stated (items keep their order and positions). */
async function labelItems(
    rawItems: readonly MealItemArg[],
    items: MealItemValues[],
): Promise<MealItemValues[]> {
    return Promise.all(
        items.map(async (item, i) => {
            const labelled = await labelRow(
                rawItems[i]?.food_ref,
                loggedValuesOf(item),
                rawItems[i]?.user_stated,
            );
            return {
                ...item,
                nutrient_sources: labelled.sources,
                source_detail: labelled.detail,
            };
        }),
    );
}

/** validateItems, then each item labelled, then the meal-level labels derived
 *  from the items. The items are validated as they were before provenance. */
async function checkedItemsWithSources(rawItems: readonly MealItemArg[]) {
    const checked = validateItems(
        rawItems.map(
            ({ food_ref: _ref, user_stated: _stated, ...item }) => item,
        ),
        { addedSugarRequired: addedSugarRequiredNow() },
    );
    const items = await labelItems(rawItems, checked.items);
    const derived = deriveFromItems(items);
    return {
        items,
        totals: checked.totals,
        sources: derived.sources,
        detail: derived.detail,
    };
}

/** The meal-level labels of a set of validated items (deriveMealProvenance). */
function deriveFromItems(items: readonly MealItemValues[]) {
    return deriveMealProvenance(
        items.map((item) => ({
            values: item,
            sources: item.nutrient_sources ?? null,
            detail: item.source_detail ?? null,
        })),
    );
}

/** food_ref and user_stated label the nutrient values sent with them. A call
 *  that sends no values would drop them without a word, so it is refused. */
function refuseLabelsWithoutValues(
    foodRef: FoodRefArg | undefined,
    userStated: MealNutrientKey[] | undefined,
    hasValues: boolean,
): void {
    if (hasValues) return;
    if (foodRef !== undefined || (userStated?.length ?? 0) > 0)
        throw new ToolError(
            "food_ref and user_stated label nutrient values, so send the values they describe (calories, protein_g and so on) with them.",
            { category: "food_ref_invalid" },
        );
}

/** A meal's own food_ref and user_stated are refused beside items: each item
 *  carries its own, and the meal's labels come from them. */
function refuseMealLevelRefsWithItems(
    foodRef: FoodRefArg | undefined,
    userStated: MealNutrientKey[] | undefined,
): void {
    assertFoodRefPlacement(true, foodRef !== undefined);
    if (userStated && userStated.length > 0)
        throw new ToolError(
            "user_stated goes on each item when the meal has items, not on the meal.",
            { category: "food_ref_invalid" },
        );
}

/** The one model line for a row's sources, with its leading newline, or "". */
function sourcesNoteFor(
    row: { nutrient_sources?: unknown; source_detail?: unknown },
    refSent: boolean,
): string {
    const line = formatSourcesLine(
        parseNutrientSources(row.nutrient_sources ?? null),
        parseSourceDetail(row.source_detail ?? null),
        { refSent },
    );
    return line ? `\n${line}` : "";
}

/** The ingredient lines of an itemized write, with their leading newline, or "".
 *  Model text only: the item names are the caller's own, so nothing here is logged. */
function itemSourcesNoteFor(
    items: readonly ItemSourcesInput[] | undefined,
): string {
    const block = formatItemSourcesBlock(items ?? []);
    return block ? `\n${block}` : "";
}

/** How many times a meal or saved-meal write re-reads and redoes its checks and
 *  label merge when a concurrent edit moved the row under it, before it gives
 *  up with a ToolError asking for the edit to be sent again. */
const SNAPSHOT_WRITE_ATTEMPTS = 3;

function snapshotConflictError(noun: string): ToolError {
    return new ToolError(
        `The ${noun} changed while this edit was being saved, so nothing was written. Send the same edit again.`,
    );
}

/** The labels a plain-meal update gives the row, merged from the row as it was
 *  read (`old`): a nutrient whose value the call changes takes the fresh labels,
 *  the rest keep theirs (mergeProvenance). */
async function plainLabelsFor(
    old: Meal,
    fields: Partial<MealInput>,
    foodRef: FoodRefArg | undefined,
    userStated: MealNutrientKey[] | undefined,
): Promise<{ sources: NutrientSources; detail: SourceDetail | null }> {
    const sent = MEAL_NUTRIENT_KEYS.filter((k) => fields[k] !== undefined);
    const oldValues = loggedValuesOf(old);
    const newValues: LoggedValues = { ...oldValues };
    for (const key of sent) newValues[key] = fields[key] ?? null;
    const changed = await labelRow(foodRef, newValues, userStated);
    return mergeProvenance({
        oldValues,
        newValues,
        oldSources: parseNutrientSources(old.nutrient_sources ?? null),
        oldDetail: parseSourceDetail(old.source_detail ?? null),
        changed,
        restated: restatedKeys(userStated, sent),
    });
}

/** The nutrients a call both sends a value for and names user_stated. A
 *  user_stated key the call does not send is not here: its stored label stays. */
function restatedKeys(
    userStated: readonly MealNutrientKey[] | undefined,
    sent: readonly MealNutrientKey[],
): MealNutrientKey[] {
    return (userStated ?? []).filter((k) => sent.includes(k));
}

/** The plain-meal write of update_meal. The sugar checks, the label merge and
 *  the write all come from ONE read of the row, and the write is conditional on
 *  the row still holding that read (updateMeal's snapshot guard). A concurrent
 *  edit therefore makes this re-read and redo its checks and merge, so two edits
 *  to one meal can neither drop each other's labels nor leave a label that
 *  describes a value no longer stored. A call that sends no nutrient reads
 *  nothing and writes unguarded, since it changes no value or label. */
async function writePlainMealUpdate(
    userId: string,
    id: string,
    fields: Partial<MealInput>,
    foodRef: FoodRefArg | undefined,
    userStated: MealNutrientKey[] | undefined,
    checkSugar: (stored: Meal | null) => void,
): Promise<{ meal: Meal; note: string }> {
    const sent = MEAL_NUTRIENT_KEYS.filter((k) => fields[k] !== undefined);
    for (let attempt = 1; ; attempt++) {
        const old = sent.length > 0 ? await getMealById(userId, id) : null;
        if (sent.length > 0) checkSugar(old);
        const labels = old
            ? await plainLabelsFor(old, fields, foodRef, userStated)
            : null;
        const { iso, note } = await resolveWriteTimestamp(
            userId,
            fields.logged_at,
        );
        try {
            const meal = await updateMeal(
                userId,
                id,
                {
                    ...fields,
                    logged_at: iso,
                    ...(labels
                        ? {
                              nutrient_sources: labels.sources,
                              source_detail: labels.detail,
                          }
                        : {}),
                },
                old ? snapshotGuardOf(old) : undefined,
            );
            return { meal, note };
        } catch (err) {
            if (!(err instanceof SnapshotConflictError)) throw err;
            if (attempt >= SNAPSHOT_WRITE_ATTEMPTS)
                throw snapshotConflictError("meal");
        }
    }
}

/** The totals path of update_saved_meal (no items: an itemized saved meal's
 *  totals change through its items, which are refused here). Its checks, label
 *  merge and guarded row write come from one read, retried like
 *  writePlainMealUpdate. Null when this user has no saved meal with `id`. */
async function writeSavedMealTotals(
    userId: string,
    id: string,
    base: Partial<SavedMealInput>,
    sentTotals: MealNutrientKey[],
    totals: Partial<NutrientValues>,
    foodRef: FoodRefArg | undefined,
    userStated: MealNutrientKey[] | undefined,
): Promise<SavedMealWithItems | null> {
    for (let attempt = 1; ; attempt++) {
        const current = await getSavedMeal(userId, id);
        if (!current) return null;
        if (current.items.length > 0)
            throw new ToolError(
                `This saved meal's totals are the sum of its ${current.items.length} item${current.items.length === 1 ? "" : "s"}, so they change through items (the full new list) rather than directly.`,
                { category: "meal_items_invalid" },
            );
        // Checked against the stored partner of whichever sugar field is not
        // sent, as update_meal does.
        const addedNow =
            totals.added_sugar_g !== undefined
                ? totals.added_sugar_g
                : current.added_sugar_g;
        const sugarNow =
            totals.sugar_g !== undefined ? totals.sugar_g : current.sugar_g;
        const sugarError = addedSugarError(
            addedNow ?? undefined,
            sugarNow ?? undefined,
        );
        if (sugarError) throw new ToolError(sugarError);
        if (
            addedSugarRequiredNow() &&
            totals.sugar_g !== undefined &&
            totals.added_sugar_g === undefined &&
            current.added_sugar_g === null
        )
            throw savedMealAddedSugarMissingError(id);
        // The changed totals take the fresh labels; the rest keep theirs.
        const oldValues = loggedValuesOf(current);
        const newValues = loggedValuesOf({ ...current, ...totals });
        const labels = mergeProvenance({
            oldValues,
            newValues,
            oldSources: parseNutrientSources(current.nutrient_sources ?? null),
            oldDetail: parseSourceDetail(current.source_detail ?? null),
            changed: await labelRow(foodRef, newValues, userStated),
            restated: restatedKeys(userStated, sentTotals),
        });
        try {
            return await updateSavedMealIfUnchanged(
                userId,
                id,
                {
                    ...base,
                    ...totals,
                    nutrient_sources: labels.sources,
                    source_detail: labels.detail,
                },
                snapshotGuardOf(current),
            );
        } catch (err) {
            if (!(err instanceof SnapshotConflictError)) throw err;
            if (attempt >= SNAPSHOT_WRITE_ATTEMPTS)
                throw snapshotConflictError("saved meal");
        }
    }
}

const SAVED_MEAL_ID_SOURCES = "get_saved_meals or search_meals";

/** Totals as MealInput nutrient fields: a null total (no item carries that
 *  nutrient) is left unset rather than sent as a value. */
function totalsAsInput(
    t: NutrientValues,
): Partial<Record<MealNutrientKey, number>> {
    const out: Partial<Record<MealNutrientKey, number>> = {};
    for (const key of MEAL_NUTRIENT_KEYS) {
        const v = t[key];
        if (v !== null) out[key] = v;
    }
    return out;
}

/** One saved meal's per-serving figures on a line. The alcohol figure follows
 *  the opt-in, like every other listing. */
function perServingLine(t: NutrientValues, alcohol: AlcoholDisplay): string {
    const parts = [
        t.calories !== null ? `${t.calories} kcal` : null,
        t.protein_g !== null ? `P ${t.protein_g} g` : null,
        t.carbs_g !== null ? `C ${t.carbs_g} g` : null,
        t.fat_g !== null ? `F ${t.fat_g} g` : null,
        t.fiber_g !== null ? `fiber ${t.fiber_g} g` : null,
        // Added sugar rides on the sugar figure, as in every listing, so the
        // two never read as separate amounts.
        compactSugarFigure(t.sugar_g, t.added_sugar_g),
        alcohol !== null && t.alcohol_g !== null
            ? `alcohol ${formatAlcohol(t.alcohol_g, alcohol)}`
            : null,
        t.caffeine_mg !== null ? `caffeine ${formatMg(t.caffeine_mg)}` : null,
    ].filter((x): x is string => x !== null);
    return parts.length > 0
        ? `Per serving: ${parts.join(" · ")}`
        : "Per serving: no figures recorded";
}

/** The refusal for a name already in use, naming the saved meal that holds it.
 *  The name is the user's own text, so the runtime log gets the refusal
 *  without it (logText). */
function savedMealNameTakenError(
    name: string,
    existingId: string | null,
): ToolError {
    const holder = existingId ? ` [saved meal id: ${existingId}]` : "";
    return toolErrorWithUserText(
        `You already have a saved meal named "${name}"${holder}. update_saved_meal changes it; a different name saves another one.`,
        `The saved meal name given is already in use${holder}.`,
        "meal_items_invalid",
    );
}

/** What saved_meals.description holds: 1 to 2000 characters, the database's
 *  own check, counted in code points as char_length counts them. */
export const MAX_SAVED_MEAL_DESCRIPTION_CHARS = 2000;

/** A saved meal's description as it is stored: escape sequences decoded and
 *  trimmed. Refuses an empty one or one past
 *  MAX_SAVED_MEAL_DESCRIPTION_CHARS before the write, so the database check
 *  never turns it into an internal error. */
export function validateSavedMealDescription(raw: string): string {
    const text = normalizeNameRef(raw);
    const length = [...text].length;
    if (length === 0)
        throw new ToolError(
            "A saved meal's description holds 1 to 2000 characters; the one sent is empty. Without a description the saved meal takes its name as the description.",
            { category: "meal_items_invalid" },
        );
    if (length > MAX_SAVED_MEAL_DESCRIPTION_CHARS)
        throw new ToolError(
            `A saved meal's description holds 1 to ${MAX_SAVED_MEAL_DESCRIPTION_CHARS} characters; the one sent has ${length}.`,
            { category: "meal_items_invalid" },
        );
    return text;
}

/** The added-sugar refusal on update_saved_meal, naming the SAVED meal: the
 *  shared wording says "meal <id>", and a saved-meal id read as a logged
 *  meal's id leads to a not-found on update_meal. */
function savedMealAddedSugarMissingError(id: string): ToolError {
    const rule = addedSugarMissingText()
        .replace(/^Not saved: /, "")
        .replace(
            "whenever sugar_g is given.",
            "whenever sugar_g is given and the saved meal has no added sugar recorded.",
        );
    return new ToolError(`Not saved, saved meal ${id} is unchanged: ${rule}`, {
        category: "added_sugar_missing",
    });
}

/** The saved meal's own nutrient values as the NutrientValues shape: a value
 *  the source does not carry is null. */
function nutrientsFrom(
    src: Partial<Record<MealNutrientKey, number | null | undefined>>,
): NutrientValues {
    const out = {} as NutrientValues;
    for (const key of MEAL_NUTRIENT_KEYS) out[key] = src[key] ?? null;
    return out;
}

/** A saved meal's body text: its description, default meal type, the figures
 *  per serving and its ingredients. */
function savedMealBody(s: SavedMealWithItems, alcohol: AlcoholDisplay): string {
    const lines = [`Description: ${s.description}`];
    if (s.meal_type) lines.push(`Default meal type: ${s.meal_type}`);
    lines.push(perServingLine(s, alcohol));
    const block = formatItemsBlock(s.items, alcohol !== null);
    if (block) lines.push(block);
    return lines.join("\n");
}

/** One saved meal in get_saved_meals: a header with its name and id, its body
 *  indented beneath. */
function savedMealListing(
    s: SavedMealWithItems,
    alcohol: AlcoholDisplay,
): string {
    const body = savedMealBody(s, alcohol)
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n");
    return `- "${s.name}" [saved meal id: ${s.id}]\n${body}`;
}

/** Writes a new saved meal. A name already in use is refused with its own
 *  wording, naming the saved meal that holds it. */
async function savedMealWrite(
    userId: string,
    name: string,
    input: SavedMealInput,
    items: MealItemValues[],
): Promise<SavedMealWithItems> {
    try {
        return await createSavedMeal(userId, input, items);
    } catch (err) {
        if (err instanceof SavedMealNameTaken)
            throw savedMealNameTakenError(name, err.existingId);
        throw err;
    }
}

/** The saved meal a log_saved_meal call names: its id, or its exact name
 *  (case-insensitive). Throws a ToolError when none or several match. */
async function resolveSavedMeal(
    userId: string,
    ref: string,
): Promise<SavedMealWithItems> {
    // Decoded like the stored names (validateSavedMealName), so a name a
    // client escaped when saving it still matches when it is escaped again.
    const q = normalizeNameRef(ref);
    if (isUuid(q)) {
        const byId = await getSavedMeal(userId, q);
        if (byId) return byId;
        throw new ToolError(
            `No saved meal found with id ${JSON.stringify(q.slice(0, 64))}.`,
        );
    }
    const matches = await findSavedMealsByName(userId, q);
    if (matches.length === 1) return matches[0]!;
    if (matches.length === 0) {
        const names = (await getSavedMeals(userId))
            .slice(0, 10)
            .map((s) => `"${s.name}"`);
        const known =
            names.length > 0
                ? ` Saved meals: ${names.join(", ")}.`
                : " This account has no saved meals yet.";
        // No category: "No saved meal found" is categorizeError's
        // record_not_found wording. The names stay out of the runtime log.
        throw toolErrorWithUserText(
            `No saved meal found named ${JSON.stringify(q.slice(0, 100))}.${known}`,
            `No saved meal found by the name given (${names.length} saved meal name${names.length === 1 ? "" : "s"} listed).`,
        );
    }
    throw toolErrorWithUserText(
        `More than one saved meal is named "${q}"; each id identifies one: ${matches
            .map((m) => `${m.name} [saved meal id: ${m.id}]`)
            .join(", ")}.`,
        `More than one saved meal has the name given (${matches.length} matches).`,
        "meal_items_invalid",
    );
}

const MEAL_DETAIL_FIELD = z
    .enum(["compact", "full"])
    .optional()
    .describe(
        'How much to return per meal. "compact" (default): one line each — local time, type, description, calories and nutrients, and the id update_meal/delete_meal take. "full": every field on its own line, including notes. Use "full" only when you need the notes or the user asks for everything.',
    );

// Longest window, in calendar days inclusive, get_meals_by_date_range will
// list. Every meal comes back as a line of text, so an open range dumped the
// whole diary into one response — the cap keeps the response proportionate to
// the request, and renderMealListing's MEAL_LISTING_MAX_CHARS bounds what is
// left. Row truncation is not the reason: getMealsInRange pages through
// selectLoggedWindow and throws rather than return a partial window. A month
// covers any "what did I eat" review; longer periods belong to the
// aggregating tools the error names.
export const MEALS_RANGE_MAX_DAYS = 31;

// get_nutrition_summary: one text section per day plus each metric's top meals
// in structuredContent (topMealBreakdown), so a quarter is the most one call should carry; longer
// periods belong to get_trends (up to 365 days, pre-aggregated).
export const SUMMARY_RANGE_MAX_DAYS = 92;

// The same guard for get_weight_by_date_range. Weight rows are one short line
// each, so the bound is a year (366 so a leap year fits) rather than a month:
// it keeps the listing proportionate and matches get_weight_trends' own
// 365-day ceiling. Paging (selectLoggedWindow) handles the row count. No
// character budget like MEAL_LISTING_MAX_CHARS: at most 366 short lines (a
// weigh-in or two a day) stays proportionate on its own.
export const WEIGHT_RANGE_MAX_DAYS = 366;

// get_body_measurements: a year, like weight. Several sites a day, each
// possibly several times, can outrun a year of weigh-ins, so the listing also
// stops at MEAL_LISTING_MAX_CHARS on a whole-day boundary.
export const BODY_MEASUREMENT_RANGE_MAX_DAYS = 366;
const BODY_MEASUREMENT_DEFAULT_DAYS = 30;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

// A YYYY-MM-DD string naming a date that exists. The Date.UTC round trip is
// what rejects "2026-02-30": Date rolls it over to March 2nd instead of
// failing, so the parts are compared back rather than trusting the parse.
function isCalendarDate(value: string): boolean {
    const m = ISO_DATE.exec(value);
    if (!m) return false;
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const date = new Date(Date.UTC(y, mo - 1, d));
    return (
        date.getUTCFullYear() === y &&
        date.getUTCMonth() === mo - 1 &&
        date.getUTCDate() === d
    );
}

// Reject anything but a real YYYY-MM-DD date with the caller-facing message.
// Every date-taking read tool calls this (directly or via assertDateRange)
// before the value reaches shiftLocalDate/zonedDayStartUtc, which roll
// "2026-99-99" over to 2034 instead of failing. Matched in categorizeError
// by "not a real calendar date" → invalid_date_format.
function assertCalendarDate(name: string, value: string): void {
    if (!isCalendarDate(value)) {
        throw new ToolError(
            `Invalid ${name} "${value}": not a real calendar date. Use YYYY-MM-DD, e.g. "2026-01-31".`,
        );
    }
}

// Validate a start_date/end_date pair for a range tool (the *_by_date_range
// listings and get_nutrition_summary), throwing the caller-facing message. Throwing (rather than returning text) is what routes
// the rejection through withAnalytics as a failure with an error category,
// the same as every other bad-argument path here. The wording is matched in
// categorizeError (src/analytics.ts): the over-limit message deliberately
// avoids "limit", which tier 3 would otherwise read as rate_limited.
function assertDateRange(
    start: string,
    end: string,
    maxDays: number,
    longerHint: string,
): void {
    assertCalendarDate("start_date", start);
    assertCalendarDate("end_date", end);
    if (start > end) {
        throw new ToolError(
            `Invalid date range: start_date (${start}) is after end_date (${end}). Swap them.`,
        );
    }
    const days = dateDiffDays(start, end) + 1;
    if (days > maxDays) {
        throw new ToolError(
            `Date range too long: ${start} to ${end} spans ${days} days, and at most ${maxDays} days (inclusive) can be listed at once. ${longerHint}`,
        );
    }
}

// Where each kind of id can be read back from, named in the id params'
// describes and in the not-a-uuid reply. Every tool listed prints ids.
const MEAL_ID_SOURCES =
    "get_meals_today, get_meals_by_date, get_meals_by_date_range or search_meals";
const WATER_ID_SOURCES = "get_water_today or get_water_by_date";
const WEIGHT_ID_SOURCES =
    "get_weight_today, get_weight_by_date or get_weight_by_date_range";
const MEASUREMENT_ID_SOURCES = "get_body_measurements";

// A non-uuid id would otherwise reach Postgres and come back as a uuid cast
// error. Echoed JSON-quoted and clipped: it is caller text. Worded like the
// not-found messages so categorizeError files it as record_not_found.
function notUuidText(kind: string, id: string, sources: string): string {
    return `No ${kind} found with id ${JSON.stringify(id.slice(0, 64))}: ids are UUIDs like "3f2b9c1e-…". Get one from ${sources}.`;
}

// The full per-field rendering, kept under its old two-argument name for the
// unit tests that pin its suppression rules. tz "UTC" reproduces the old
// instant; every tool passes the user's timezone to formatMealFull instead.
export function formatMeal(meal: Meal, alcohol: AlcoholDisplay = null): string {
    return formatMealFull(meal, alcohol, "UTC");
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
    return `\n\n(${subject}, but alcohol tracking is off for this account so it is not shown. The user can turn it on with set_alcohol_tracking if they want it shown.)`;
}

// Tool descriptions and SERVER_INSTRUCTIONS are advisory and are read once, at
// the top of a session; this note lands in the model's context at the exact
// moment it left a nutrient out, which is the only feedback in the loop. Same
// report-only shape as alcoholHiddenNote above — it never writes anything, and
// it describes rather than directs: it names the gap, what a gap does to the
// totals, and that update_meal can fill it — never what the assistant should
// say or do (directory policy; see #190, #213).
//
// Deliberately limited to fiber_g, sugar_g and added_sugar_g. All three are
// estimable for every food that exists (added sugar is a classification more
// than a measurement: 0 for whole foods, all of it for a soft drink), so a
// NULL on a meal the model just wrote is an omission and not a fact, and the
// cost is not one imperfect number: a null excludes the whole DAY from that
// nutrient's averages, goal lines and charts (dayCarries in insights.ts), so a forgotten fiber figure deletes the day from the trend.
//
// Caffeine is NOT checked here, and adding it would undo the suppression the
// rest of this file is built around: most meals genuinely carry none, its
// display gate is `!= null` rather than `> 0` (limitShown, recordedGoalLine,
// totalsPayloadOf), so nagging until every sandwich carries a figure produces
// precisely the fabricated "0 mg / 400 mg limit" that null exists to prevent.
//
// A meal logged with items has totals that are the sum of its items, and
// update_meal refuses a direct total on such a meal, so for one the note names
// the path that works: the full items list with the value on each item.
function missingNutrients(meal: Meal): string[] {
    return [
        meal.fiber_g == null ? "fiber_g" : null,
        meal.sugar_g == null ? "sugar_g" : null,
        meal.added_sugar_g == null ? "added_sugar_g" : null,
    ].filter((f): f is string => f !== null);
}

export function missingNutrientNote(meal: Meal, itemCount = 0): string {
    const missing = missingNutrients(meal);
    if (missing.length === 0) return "";
    const fill =
        itemCount > 0
            ? `This meal's totals are the sum of its ${itemCount} item${itemCount === 1 ? "" : "s"}, so update_meal adds the value to id ${meal.id} through items: the full list again, with the value on each item`
            : `update_meal can add the value to id ${meal.id}`;
    return `\n\n(Not recorded on this meal: ${missing.join(", ")}. A missing value is not a zero — it leaves the whole day out of that nutrient's totals, averages and goal line. ${fill}; 0 records a food that genuinely has none.)`;
}

/** missingNutrientNote for a meal just written. `itemCount` is the number of
 *  items the call wrote when it knows it; otherwise (a deduplicated insert, an
 *  update without items) the stored count is read, and only when the note has
 *  something to say. */
async function missingNutrientNoteFor(
    userId: string,
    meal: Meal,
    itemCount?: number,
): Promise<string> {
    if (missingNutrients(meal).length === 0) return "";
    const count = itemCount ?? (await countMealItems(userId, meal.id));
    return missingNutrientNote(meal, count);
}

// Whether log_meal / update_meal refuse sugar_g without added_sugar_g right
// now. Read from the environment on every call, not once at import, so a test
// (or an operator restarting with a new value) controls it without
// mock.module; the clock is per call too, so the rule switches on by itself at
// the configured instant. Why it is gated at all: see
// ADDED_SUGAR_REQUIRED_FROM_ENV in added-sugar.ts — hosts cache tools/list
// for days, and a client on a list from before added_sugar_g existed cannot
// send the field.
let warnedAddedSugarGate: string | null = null;
export function addedSugarRequiredNow(nowMs: number = Date.now()): boolean {
    const raw = process.env[ADDED_SUGAR_REQUIRED_FROM_ENV];
    // One warning per bad value, carrying nothing but the variable's name: an
    // unparseable instant leaves the rule off, which is the safe direction.
    if (
        parseAddedSugarRequiredFrom(raw) === "invalid" &&
        warnedAddedSugarGate !== raw
    ) {
        warnedAddedSugarGate = raw ?? null;
        console.warn(
            `[config] ${ADDED_SUGAR_REQUIRED_FROM_ENV} is not an ISO-8601 date or offset date-time; the added-sugar requirement stays off.`,
        );
    }
    return addedSugarRequiredAt(raw, nowMs);
}
// At import, so a bad value is reported when the server starts rather than on
// the first sugared meal.
addedSugarRequiredNow();

// update_meal's half of the added ≤ total rule (addedSugarError). A field the
// call leaves out keeps its stored value, so the pair that ends up in the row
// is the passed value merged over the stored one — backfilling only
// added_sugar_g on a meal whose sugar_g is already stored has to be checked
// against that sugar_g. `stored` is null when both were passed (no read
// needed) or the meal does not exist (updateMeal reports that). Never clamps.
export function updatedAddedSugarError(
    fields: { sugar_g?: number; added_sugar_g?: number },
    stored: Pick<Meal, "sugar_g" | "added_sugar_g"> | null,
): string | null {
    return addedSugarError(
        fields.added_sugar_g !== undefined
            ? fields.added_sugar_g
            : stored?.added_sugar_g,
        fields.sugar_g !== undefined ? fields.sugar_g : stored?.sugar_g,
    );
}

// lookup_barcode's two Open Food Facts fallbacks. A lookup is often only a
// question about the product, so neither text presumes the meal gets logged:
// they say what evidence is left, not what to write (directory policy 2.D).
// No OFF error text is interpolated — it is third-party text the model can't
// act on, and it stays in the server log.
export function offUnreachableText(): string {
    return "Couldn't reach Open Food Facts right now. Nutrition for this product can come from the product description, or from a label the user shares.";
}

export function offNotFoundText(barcode: string): string {
    return `No product found in Open Food Facts for barcode ${barcode}. The user may be able to say what the product is or share its label; otherwise its nutrition is an estimate.`;
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
/**
 * get_profile's Apple Health sync line. `undefined` means the status could not
 * be read (the line says so rather than failing the whole profile), `null`
 * means no link. Dates and times are local to `tz`, like the rest of the
 * profile. Describes only: connecting happens from the iPhone shortcut, not
 * through any tool, so there is nothing here to offer.
 */
export function healthSyncProfileLine(
    status: HealthSyncLinkStatus | null | undefined,
    tz: string,
): string {
    if (status === undefined)
        return "Apple Health sync: status unavailable right now.";
    if (status === null) return "Apple Health sync: not connected.";
    const connected = dateInTz(status.created_at, tz);
    const sentThrough = status.sent_through ?? "nothing yet";
    const lastSync = status.last_sync_at
        ? formatLocalDateTime(status.last_sync_at, tz).slice(0, 16)
        : "never";
    return `Apple Health sync: connected ${connected}, sent through ${sentThrough}, last sync ${lastSync}.`;
}

// Exported for tests: the only way to exercise a tool handler end-to-end
// (schema coercion, handler, response text) is to register the tools on a real
// McpServer and call them through a client. Production still reaches this only
// via buildMcpServer.
export function registerTools(
    server: McpServer,
    userId: string,
    widgetsEnabled: boolean,
    alcohol: AlcoholDisplay,
    // Optional so the many direct callers in mcp.test.ts keep working: they
    // exercise tool behaviour, not analytics attribution, and a row with no era
    // is exactly what a non-HTTP embedding should record.
    protocolEra?: "legacy" | "modern",
    // The USDA client's seams (fetch, clock, env, cache, quota state, log).
    // Production passes nothing; the default cache store reads and writes
    // through the live supabase functions at call time. Tests inject a fetch
    // and a fresh quota state per case.
    usda: Partial<UsdaDeps> = {},
) {
    const usdaOverrides: Partial<UsdaDeps> = usda;
    // One context for all 48 tools. clientInfo is a getter, not a value: at
    // registration time the SDK has not yet resolved who is calling, and on the
    // modern leg it backfills the identity per request before dispatch.
    const analytics = {
        userId,
        protocolEra,
        clientInfo: () => server.server.getClientVersion(),
    };
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
                "Log a meal entry with nutritional information. A meal can also be logged with an items list, each ingredient with its amount and nutrients; its totals are then the sum of the items, and the totals fields are not sent alongside. Calories and macros are estimates unless they come from a label, a barcode lookup or published nutrition, and the quantity or portion eaten is the input those estimates are made from. For a barcode — typed, or the digits printed under it in a photo of the package — lookup_barcode returns the product's label data, which is scaled to the amount eaten; when no product is found, the result says so. For a branded product or chain item without a barcode, the label or the published per-item nutrition is used where available; otherwise the figures are estimated from the ingredients and portion. For a photo of a plated or prepared meal, whether it is from a restaurant (and which one, if the user says) or homemade determines the evidence: a chain's published nutrition, a menu or ingredient list if the user shares it or it is available to you, and past logs via search_meals, which surface variations and ingredients the photo cannot show. For a meal logged from a photo, call this tool only after the meal is confirmed: which variation each dish is, how much was eaten (in household measures such as a glass, a handful or a tablespoon rather than grams), and hidden ingredients like oil, sugar or sauce are resolved and the user has agreed to the summary — or has asked to just log it. Write the confirmed portions into the description (e.g. 'Oatmeal (1 glass raw oats, 2 glasses milk) with banana') so future searches are self-describing, and for a restaurant meal the user named, include the restaurant name as they gave it (e.g. 'Pad thai with chicken (1 plate, finished) at Thai Basil'). Include a neighbourhood or city only if the user stated it — do not infer a location the user did not state.\n\n" +
                NUTRIENT_COVERAGE +
                "\nPutting '180 mg caffeine' or '6 g fiber' in notes or in the description instead of in the field leaves it out of every total, goal and chart.",
            annotations: {
                title: "Log Meal",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: z.object({
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
                saturated_fat_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Saturated fat in grams: the part of fat_g that is saturated, never more than it. Optional. On an itemized meal it is all-or-none across the items: a list that gives it on some items and not others is refused. A missing value is stored as not measured and leaves that day out of the saturated-fat average and limit. 0 is the correct value for a food with none.",
                    ),
                trans_fat_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Trans fat in grams: a separate fat type, stored as given and not checked against fat_g. Optional, and it has no limit. On an itemized meal the meal's trans fat is the sum of the items that carry it, so it may be given on some items and not others. Not sent means not measured, not zero.",
                    ),
                fiber_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Dietary fiber in grams. Expected on every meal alongside protein, carbs and fat: a missing value is stored as not measured rather than as zero and leaves the whole day out of the user's fiber average and goal, while an estimate keeps the day in. Sources, most accurate first: a label, a barcode lookup, published per-item nutrition, an estimate. Reference values per 100 g: cooked lentils or beans 5-8 g, dry rolled oats 10 g, wholemeal bread 7 g, white bread 2.7 g, cooked wholewheat pasta 4 g (white 2 g), cooked brown rice 1.8 g (white 0.4 g), potato with skin 2 g, most vegetables 2-3 g, apple or pear with skin 2.4-3 g, banana 2.6 g, berries 5-7 g, almonds 12 g, chia 34 g. Meat, fish, eggs, dairy, oil and sugar contain none, so 0 is the correct value there rather than an omitted field.",
                    ),
                sugar_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "TOTAL sugars in grams — the figure a nutrition label or database gives for 'Sugars', which includes sugar naturally present in fruit, milk and juice as well as added sugar. Expected on every meal: a missing value is stored as not measured rather than as zero and leaves the whole day out of the sugar average and limit, while an estimate keeps the day in. Reference values per 100 g: milk 5 g, plain yogurt 4.7 g, fruit yogurt 12 g, apple 10 g, banana 12 g, orange 9 g, berries 5-10 g, dried dates 63 g, cola 10.6 g, orange juice 8.4 g, ketchup 22 g, milk chocolate 52 g, bread 3-5 g. Meat, fish, eggs, cheese, oil, rice, pasta and most vegetables are ~0, so 0 is the correct value there rather than an omitted field.",
                    ),
                added_sugar_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Added sugars in grams: sugars added during processing or preparation (table sugar, syrups, honey, sugar in sweetened drinks and foods). Part of sugar_g, never more than it. Sugar naturally present in whole fruit, vegetables and plain milk is not added, and neither is 100% fruit juice. Expected on every meal: a missing value is stored as not measured rather than as zero and leaves that day out of the added-sugar average and limit. Reference values: whole fruit, vegetables, plain milk, plain yogurt, meat, fish, eggs, rice, pasta and 100% fruit juice are 0; a soft drink's sugar is all added (cola 10.6 g per 100 g); fruit yogurt is about 7 g added per 100 g; milk chocolate about 47 g per 100 g; ketchup about 18 g per 100 g; sweetened cereal about 25 g per 100 g. A US label states it directly, in the line 'Includes Xg Added Sugars'. 0 is the correct value for a food with none rather than an omitted field. It accompanies sugar_g: a call that gives sugar_g without added_sugar_g may be refused, with nothing saved.",
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
                        "Caffeine in MILLIGRAMS (mg) — this field is the one that is not in grams, and a value under 1 almost certainly means grams were sent by mistake. Typical amounts: a 240 ml brewed coffee 95 mg, a single espresso 63 mg, instant coffee 62 mg, black tea 47 mg, green tea 28 mg, a 355 ml cola 34 mg, a 250 ml energy drink 80 mg, decaf 2 mg. Scale them to what was actually drunk (a double espresso is 126 mg), and for a branded drink prefer the figure on the label or the chain's published nutrition. Caffeine adds no calories, so it never changes the kcal figure. Unlike fiber_g, sugar_g and added_sugar_g, this field is conditional, so decide it on every entry rather than skipping it by default: if the item is a caffeine source at all — coffee including decaf, tea, matcha, yerba mate, cola and other soft drinks, energy drinks, pre-workout, chocolate and cocoa, coffee ice cream, caffeine tablets — send a figure, from the label or published nutrition where available and otherwise from the amounts above. Omit the field for anything that is not a caffeine source rather than sending 0 — a 0 records 'measured, and it was none', and one on a sandwich puts a caffeine row on the dashboard of a user who never drinks any.",
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
                        idempotencyKeyDescription(
                            "meal",
                            "give each its own time or its own key",
                        ),
                    ),
                items: z
                    .array(MEAL_ITEM_INPUT)
                    .optional()
                    .describe(LOG_MEAL_ITEMS_DESCRIPTION),
                food_ref: FOOD_REF_INPUT.optional().describe(
                    `${FOOD_REF_DESCRIPTION} For a meal without items; with items, give food_ref on each item.`,
                ),
                user_stated: USER_STATED_INPUT,
            }),
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
                    // Items replace the totals: each item is checked on its
                    // own (the added-sugar gate included), and the totals are
                    // their sum. Without items, the meal-level checks below.
                    const {
                        items: rawItems,
                        food_ref: foodRef,
                        user_stated: userStated,
                        ...fields
                    } = args;
                    let input: typeof fields = fields;
                    let items: MealItemValues[] | undefined;
                    let labels: {
                        sources: NutrientSources;
                        detail: SourceDetail | null;
                    };
                    if (rawItems !== undefined) {
                        const sent = totalsSentWithItems(fields);
                        if (sent.length > 0) throw totalsWithItemsError(sent);
                        refuseMealLevelRefsWithItems(foodRef, userStated);
                        const checked = await checkedItemsWithSources(rawItems);
                        items = checked.items;
                        labels = {
                            sources: checked.sources,
                            detail: checked.detail,
                        };
                        input = { ...fields, ...totalsAsInput(checked.totals) };
                    } else {
                        // Before anything is read or written. Sugar without
                        // added sugar first: the pair check below cannot fire
                        // when added_sugar_g is absent, so the two never
                        // compete.
                        if (addedSugarRequiredNow() && addedSugarMissing(args))
                            throw addedSugarMissingError();
                        // A mismatch is the caller's to resolve, never clamped
                        // (addedSugarError).
                        const sugarError = addedSugarError(
                            args.added_sugar_g,
                            args.sugar_g,
                        );
                        if (sugarError) throw new ToolError(sugarError);
                        labels = await labelRow(
                            foodRef,
                            loggedValuesOf(fields),
                            userStated,
                        );
                    }
                    const { iso, note } = await resolveWriteTimestamp(
                        userId,
                        args.logged_at,
                    );
                    const { meal, deduplicated } = await insertMeal(userId, {
                        ...input,
                        logged_at: iso,
                        ...(items ? { items } : {}),
                        nutrient_sources: labels.sources,
                        source_detail: labels.detail,
                    });
                    // No colon yet: the zone is appended once tz is known,
                    // because the Time line below is a local wall clock.
                    const header = deduplicated
                        ? "Meal already logged — this matched an existing meal, so nothing new was added"
                        : "Meal logged";

                    const { progressSection, structuredContent, meta, tz } =
                        await buildMealProgress(
                            userId,
                            meal,
                            "logged",
                            alcohol,
                        );
                    // A deduplicated insert returns the stored meal, whose
                    // items this call did not write, so its count is read.
                    const missingNote = await missingNutrientNoteFor(
                        userId,
                        meal,
                        deduplicated ? undefined : (items?.length ?? 0),
                    );

                    // Content only: the values are stored as sent (see
                    // saturatedAboveFatNote). A replay that matched an existing
                    // meal reports that meal's own values, so it is not
                    // re-checked here.
                    const satFatNote = deduplicated
                        ? ""
                        : (saturatedAboveFatNote(meal) ?? "");
                    // Model text only: where the values came from. A replay
                    // reports the stored meal's own labels, so it says nothing.
                    const sourcesNote = deduplicated
                        ? ""
                        : sourcesNoteFor(
                              meal,
                              foodRef !== undefined ||
                                  (rawItems ?? []).some(
                                      (i) => i.food_ref !== undefined,
                                  ),
                          );
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${header} (${tz} time):\n${formatMealFull(meal, alcohol, tz, deduplicated ? undefined : items)}${progressSection}${satFatNote}${sourcesNote}${deduplicated ? "" : itemSourcesNoteFor(items)}${alcoholHiddenNote(
                                    (meal.alcohol_g ?? 0) > 0,
                                    alcohol,
                                    "Alcohol saved with this meal",
                                )}${missingNote}${note}`,
                            },
                        ],
                        structuredContent,
                        _meta: meta,
                    };
                },
                analytics,
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
            inputSchema: z.object({}),
            outputSchema: START_IMPORT_OUTPUT_SCHEMA,
            annotations: {
                title: "Import Meals from a File",
                // Opening the importer writes nothing, but the flow it starts
                // saves meals (via bulk_import_meals), so it is not read-only.
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
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
                        locale: localeFromProfile(profile) ?? "en",
                    });
                    const text = widgetsEnabled
                        ? "Importer ready — pick your export file in the panel above. Nothing is saved until you confirm the preview." +
                          (tz === null
                              ? " Note: this account has no timezone set, so times will be read as UTC; set_timezone changes that, and it is best done before importing."
                              : "")
                        : "This account has widgets turned off, so the importer cannot be shown. The user can paste their export for bulk_import_meals instead, or turn widgets on with set_widget_display.";
                    return {
                        content: [{ type: "text" as const, text }],
                        structuredContent,
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "bulk_import_meals",
        {
            title: "Bulk Import Meals",
            description:
                "Import many past meals in one call, for backfilling history from a file the user exported from another app (MyFitnessPal, Cronometer, Lose It!, MacroFactor) or from a list they pasted. Parse the source yourself and map it to the row schema; the server validates every row and reports per-row results, so you can fix and re-send only the rows that failed. Prefer this over calling log_meal in a loop: one call writes up to " +
                MAX_ROWS_PER_CALL +
                " rows with per-row validation, a dry run and keys that make a replay a no-op while the saved timezone is unchanged, none of which a loop of log_meal calls has. Three rules matter for correctness. (1) Compute expected_row_count, and expected_total_kcal when every row has calories, FROM THE SOURCE FILE using deterministic tooling (a script, or counting the actual lines) — never by re-reading the JSON you just wrote, which would only compare your output against itself and catch nothing. (2) Call once with dry_run: true first whenever the rows came from parsing a CSV, a screenshot, or free text; check the resolved logged_at and meal_type echoed back for every row, show the user what will be imported, and only then call again with dry_run: false. Pass local times exactly as the file gives them and let the server apply the user's timezone; do not compute UTC offsets yourself, and do not guess a value you cannot find — omit the field and list the column in unmapped_columns instead. (3) Because those local times are placed using the user's saved timezone, check get_profile (which reports the saved timezone) before a large import: if it is unset the server falls back to UTC, and correcting it afterwards moves every imported meal — including onto adjacent days for anything logged near midnight — and re-sending rows that were already written after a timezone change inserts them a second time. Offer set_timezone before the first real call. Maximum " +
                MAX_ROWS_PER_CALL +
                " rows per call: split larger files by date range, keeping all rows for one calendar date in the same call. If a single calendar date alone has more than " +
                MAX_ROWS_PER_CALL +
                " rows, that date has to be split across more than one call — the row cap is a hard server-side limit and wins over the same-call grouping. Doing so loosens deduplication for that date only: two rows in it that are byte-identical (same description, meal_type, calories, protein_g, carbs_g, fat_g, notes and logged_at) may collapse into one if they land in different calls, so prefer keeping duplicate-looking rows together in one call when you have to split. If the file is an export from THIS server (its header starts with an id column), map that column to source_id on every row, and map its timezone column to timezone on every row too — source_id is what makes restoring a backup a no-op instead of doubling the user's history, and timezone is what makes a restored row resolve at the local time it was actually recorded rather than the account's current timezone.",
            inputSchema: z.object({
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
            }),
            outputSchema: BULK_IMPORT_OUTPUT_SCHEMA,
            annotations: {
                title: "Bulk Import Meals",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
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
                        foodRecord: getCachedFoodRecord,
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
                analytics,
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
                "Look up a packaged product's label nutrition by barcode via Open Food Facts. The figures are transcribed from the product's own label by the Open Food Facts community. This server does not verify them, and they can be wrong, stale, or missing entirely. Pass the barcode digits (EAN/UPC, 8–14 digits). The user can type them, or they can be read from a photo of the package: the human-readable digits printed beneath the barcode. Returns the product name, serving, and macros, which log_meal accepts once scaled to the amount eaten. When Open Food Facts has computed them, it also returns the Nutri-Score (A–E, a nutritional-quality grade) and NOVA group (1–4, how processed the product is); they are omitted, not \"n/a\", when no value has been computed for that product. A fiber, sugar, added-sugar or saturated-fat figure shown as n/a is missing data, not a zero: any value passed for it later is an estimate. A saturated-fat or trans-fat figure shown as n/a is left out rather than sent as 0. Open Food Facts carries no caffeine, so caffeine_mg for a coffee, tea, cola, energy drink or other caffeinated product comes from the label where available, otherwise from typical amounts. When no product is found, the result says so; the product description, or a label the user shares, can supply the figures instead.",
            annotations: {
                title: "Look Up Barcode",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: z.object({
                barcode: z
                    .string()
                    .describe(
                        "Product barcode digits (EAN-8/13, UPC-A/E, or GTIN-14). Spaces and separators are ignored.",
                    ),
            }),
        },
        async ({ barcode }) => {
            // lookupBarcode's own failures (OFF down, timeout, bad config) are
            // caught below and turned into a normal (non-isError) content
            // response so the model can fall back to estimating — but that
            // means withAnalytics never sees a thrown error. Without this flag
            // an OFF outage silently records as `success: true`, which is how
            // it stayed invisible to tool_analytics entirely.
            // Safe only because withAnalytics awaits the handler to
            // completion before reading this via `outcome` below — it is not
            // read concurrently with the handler running.
            let offFailure: string | null = null;
            return withAnalytics(
                "lookup_barcode",
                async () => {
                    const normalized = normalizeBarcode(barcode);
                    if (!normalized) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `"${barcode}" is not a valid barcode (expected 8–14 digits). Double-check the number. The macros can still come from the product description or a label the user shares.`,
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
                        // Route through the same categorizeError used for
                        // thrown errors elsewhere, so a config problem
                        // ("OFF_USER_AGENT is not configured") or an OFF rate
                        // limit lands in service_misconfigured/rate_limited
                        // instead of a generic bucket local to this tool.
                        const category = categorizeError(err);
                        offFailure =
                            category === "unknown"
                                ? "external_api_error"
                                : category;
                        // The OFF message stays server-side: it is
                        // third-party text, and the model can't act on it.
                        // JSON-escaped so it can't forge log lines.
                        console.warn(
                            `[lookup_barcode] off-failure=${offFailure}: ${JSON.stringify(msg)}`,
                        );
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: offUnreachableText(),
                                },
                            ],
                        };
                    }

                    if (!food) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: offNotFoundText(normalized),
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
                analytics,
                { barcode },
                {
                    outcome: () =>
                        offFailure
                            ? { success: false, errorCategory: offFailure }
                            : { success: true },
                },
            );
        },
    );

    // The USDA tools' shared pieces. A pause, reserve or per-user cap is a
    // normal result that names when USDA opens again (in the user's timezone
    // when it is cheap to read, UTC otherwise); only an upstream failure is an
    // error, and it carries the usda_unavailable category.
    const usdaText = (text: string) => ({
        content: [{ type: "text" as const, text }],
    });
    const usdaUnavailable = async (until: number | null): Promise<string> => {
        if (until === null) return usdaUnavailableText(null);
        const tz = await getUserTimezone(userId).catch(() => null);
        return usdaUnavailableText(until, tz);
    };

    server.registerTool(
        "search_foods",
        {
            title: "Search Generic Foods",
            description:
                "Searches USDA FoodData Central generic foods (Foundation, SR Legacy and Survey/FNDDS records) by English food name and returns up to 10 candidates, each with its FoodData Central id, USDA description, data type and energy and macros per 100 g. Matches use USDA's English wording (e.g. 'cooked, boiled'). Search results are not stored; get_food_macros returns the full record for one id.",
            annotations: {
                title: "Search Generic Foods",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: z.object({
                query: z
                    .string()
                    .describe(
                        "A food name in English, for example 'banana' or 'cooked oats'. 1 to 200 characters.",
                    ),
            }),
        },
        async ({ query }) => {
            // An upstream failure (a thrown UpstreamError) reaches withAnalytics
            // as an error; a pause or a refused key is a normal result, so it
            // is flagged here for the analytics row.
            let usdaFailure: string | null = null;
            return withAnalytics(
                "search_foods",
                async () => {
                    const q = query.trim();
                    if (q.length < 1 || q.length > 200) {
                        throw new ToolError(
                            "The food name must be 1 to 200 characters.",
                        );
                    }
                    if (sanitizeQuery(q) === "") {
                        throw new ToolError(
                            "The food name needs letters or digits, for example 'banana'.",
                        );
                    }
                    const outcome = await searchUsda(q, userId, usdaOverrides);
                    switch (outcome.status) {
                        case "ok":
                            return usdaText(
                                outcome.candidates.length > 0
                                    ? formatUsdaSearch(outcome.candidates)
                                    : USDA_NO_MATCH_TEXT,
                            );
                        case "no_match":
                            return usdaText(USDA_NO_MATCH_TEXT);
                        case "bad_query":
                            return usdaText(USDA_BAD_QUERY_TEXT);
                        case "auth_failed":
                            usdaFailure = "usda_unavailable";
                            return usdaText(USDA_AUTH_FAILED_TEXT);
                        case "unavailable":
                            return usdaText(
                                await usdaUnavailable(outcome.until),
                            );
                    }
                },
                analytics,
                undefined,
                {
                    outcome: () =>
                        usdaFailure
                            ? { success: false, errorCategory: usdaFailure }
                            : { success: true },
                },
            );
        },
    );

    server.registerTool(
        "get_food_macros",
        {
            title: "Get Food Macros",
            description:
                "Returns USDA FoodData Central values for one generic food by its FoodData Central id: per 100 g, and scaled to amount_g when given, with the portion sizes USDA lists. A nutrient USDA does not record for the food is reported as not recorded, never as zero. Includes the food_ref the meal tools accept for these values.",
            annotations: {
                title: "Get Food Macros",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: z.object({
                fdc_id: z.coerce
                    .number()
                    .describe(
                        "The FoodData Central id (fdcId) of the food, as search_foods returned it.",
                    ),
                amount_g: z.coerce
                    .number()
                    .optional()
                    .describe(
                        "Grams to scale the values to, above 0 and at most 5000. Omit for the values per 100 g only.",
                    ),
            }),
        },
        async ({ fdc_id, amount_g }) => {
            let usdaFailure: string | null = null;
            return withAnalytics(
                "get_food_macros",
                async () => {
                    if (!Number.isSafeInteger(fdc_id) || fdc_id <= 0) {
                        throw new ToolError(
                            "fdc_id must be a positive whole number: the FoodData Central id that search_foods returns.",
                        );
                    }
                    if (
                        amount_g !== undefined &&
                        !(amount_g > 0 && amount_g <= 5000)
                    ) {
                        throw new ToolError(
                            "amount_g must be more than 0 and at most 5000 grams.",
                        );
                    }
                    const outcome = await getFoodRecord(
                        fdc_id,
                        userId,
                        usdaOverrides,
                    );
                    switch (outcome.status) {
                        case "ok":
                        case "cache":
                            return usdaText(
                                formatUsdaRecord(
                                    outcome.record,
                                    amount_g ?? null,
                                ),
                            );
                        case "no_match":
                            return usdaText(USDA_NO_RECORD_TEXT);
                        case "auth_failed":
                            usdaFailure = "usda_unavailable";
                            return usdaText(USDA_AUTH_FAILED_TEXT);
                        case "unavailable":
                            return usdaText(
                                await usdaUnavailable(outcome.until),
                            );
                    }
                },
                analytics,
                undefined,
                {
                    outcome: () =>
                        usdaFailure
                            ? { success: false, errorCategory: usdaFailure }
                            : { success: true },
                },
            );
        },
    );

    server.registerTool(
        "get_meals_today",
        {
            title: "Get Today's Meals",
            description:
                'Get all meals logged today, one compact line each with ids (detail: "full" adds notes).',
            annotations: {
                title: "Get Today's Meals",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({ detail: MEAL_DETAIL_FIELD }),
        },
        async ({ detail }) => {
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
                    // The ingredients behind each meal: a count in compact
                    // mode, the list in full mode.
                    const items = await getMealItems(
                        userId,
                        meals.map((m) => m.id),
                    );
                    const { text } = renderMealListing({
                        meals,
                        tz,
                        alcohol,
                        detail: detail ?? "compact",
                        grouped: false,
                        items,
                    });
                    return { content: [{ type: "text", text }] };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "get_meals_by_date",
        {
            title: "Get Meals by Date",
            description:
                'Get all meals for a specific date, one compact line each with ids (detail: "full" adds notes).',
            annotations: {
                title: "Get Meals by Date",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                date: z.string().describe("Date in YYYY-MM-DD format"),
                detail: MEAL_DETAIL_FIELD,
            }),
        },
        async ({ date, detail }) => {
            return withAnalytics(
                "get_meals_by_date",
                async () => {
                    assertCalendarDate("date", date);
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
                    // The ingredients behind each meal: a count in compact
                    // mode, the list in full mode.
                    const items = await getMealItems(
                        userId,
                        meals.map((m) => m.id),
                    );
                    const { text } = renderMealListing({
                        meals,
                        tz,
                        alcohol,
                        detail: detail ?? "compact",
                        grouped: false,
                        items,
                    });
                    return { content: [{ type: "text", text }] };
                },
                analytics,
                { date },
            );
        },
    );

    server.registerTool(
        "get_meals_by_date_range",
        {
            title: "Get Meals by Date Range",
            description: `Get all meals between two dates (inclusive), grouped by day, one compact line each with ids (detail: "full" adds notes). Use this instead of multiple get_meals_by_date calls when you need meals for more than one day. The range can span at most ${MEALS_RANGE_MAX_DAYS} days; get_trends covers longer periods with daily totals instead of individual meals. A long result is truncated at a day boundary with a note naming the start_date to call again with for the rest.`,
            annotations: {
                title: "Get Meals by Date Range",
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
                        `End date (YYYY-MM-DD). The range spans at most ${MEALS_RANGE_MAX_DAYS} days, both ends included.`,
                    ),
                detail: MEAL_DETAIL_FIELD,
            }),
        },
        async ({ start_date, end_date, detail }) => {
            return withAnalytics(
                "get_meals_by_date_range",
                async () => {
                    assertDateRange(
                        start_date,
                        end_date,
                        MEALS_RANGE_MAX_DAYS,
                        "For a longer period use get_trends (daily totals rather than every meal), or split the range into monthly calls.",
                    );
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

                    // Grouped by local day, and cut at a day boundary if
                    // the month would outgrow MEAL_LISTING_MAX_CHARS.
                    // The ingredients behind each meal: a count in compact
                    // mode, the list in full mode.
                    const items = await getMealItems(
                        userId,
                        meals.map((m) => m.id),
                    );
                    const { text } = renderMealListing({
                        meals,
                        tz,
                        alcohol,
                        detail: detail ?? "compact",
                        grouped: true,
                        items,
                    });
                    return { content: [{ type: "text", text }] };
                },
                analytics,
                { start_date, end_date },
            );
        },
    );

    server.registerTool(
        "search_meals",
        {
            title: "Search Past Meals",
            description:
                "Search the user's past logged meals by keyword (case-insensitive match on description, notes and the names of a meal's ingredients), and the user's saved meals by name, description or ingredient name, newest meals first. Meals are grouped into recurring variations with counts, last-logged date, and typical macros. Useful before logging a meal from a photo: past variations reveal ingredients that aren't visible in the picture (raisins vs banana, milk vs water, added honey or oil), and each difference between variations is a question for the user rather than something to pick silently. Also serves requests like 'log my usual breakfast': a matching past meal is logged again with log_meal once the variation and the amount are confirmed with the user, and a matching saved meal is logged with log_saved_meal. When the user has named the restaurant, search its name as well as the dish — a past visit to the same venue is stronger evidence than a generic estimate. Pass short food keywords, not full sentences, and include the food name in every language the user may have logged in — always add an English alternative alongside the conversation language, e.g. [\"вівсянка\", \"oatmeal\"].",
            annotations: {
                title: "Search Past Meals",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
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
            }),
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
                    const [meals, savedMatches] = await Promise.all([
                        searchMeals(userId, queries, {
                            limit: limit ?? 50,
                            sinceIso,
                        }),
                        searchSavedMeals(userId, queries),
                    ]);
                    const savedText = formatSavedMealMatches(
                        savedMatches.saved,
                        tz,
                        savedMatches.total,
                    );
                    if (meals.length === 0) {
                        const label = queries.map((q) => `"${q}"`).join(" / ");
                        // Saved meals found: they are the answer, so the
                        // photo guidance for an empty history does not apply.
                        const text = savedText
                            ? `No past meals matching ${label} in the last ${windowDays} days.\n\n${savedText}`
                            : `No past meals matching ${label} in the last ${windowDays} days. If logging from a photo, there are no past variations to draw on, so the amount eaten and ingredients the photo cannot show (oil, butter, sugar, sauce, what a drink was made with) are still open questions to confirm with the user before log_meal.`;
                        return { content: [{ type: "text", text }] };
                    }
                    const mealText = formatMealSearchResults(
                        meals,
                        queries,
                        tz,
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: savedText
                                    ? `${mealText}\n\n${savedText}`
                                    : mealText,
                            },
                        ],
                    };
                },
                analytics,
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

    // UI resource for the log_meal / update_meal / log_saved_meal widget (day's running totals vs goals as
    // rings; renders nothing when no goals are set). Same contract as above.
    server.registerResource(
        "meal-logged-widget",
        MEAL_LOGGED_WIDGET_URI,
        {
            title: "Meal Logged",
            description:
                "Interactive UI shown after log_meal, update_meal and log_saved_meal: the day's running intake-vs-goal rings, with automatic light/dark theming. Shows nothing when no nutrition goals are set.",
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

    // UI resource for the get_weight_trends widget (weight-over-time chart with
    // a trend line, a range toggle and target line). Same contract as above.
    server.registerResource(
        "weight-trends-widget",
        WEIGHT_TRENDS_WIDGET_URI,
        {
            title: "Weight Trends",
            description:
                "Interactive UI for get_weight_trends: a range toggle (up to the whole history) over a weight-over-time chart (daily weigh-ins, smoothed trend line, data-scaled axis, target line) plus trend weight, weekly rate, change and target stats, with automatic light/dark theming.",
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
        async ({ start_date, end_date }) => {
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
                            ...itemsEntry,
                        },
                    };
                },
                analytics,
                { start_date, end_date },
            );
        },
    );

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
                "Get progress against daily nutrition goals for a specific date (defaults to today). Renders intake-vs-goal rings plus body-weight progress in clients that support MCP Apps UI, and returns the same data as text elsewhere. Figures are estimates, not medical or dietary advice.",
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
        async ({ date }) => {
            return withAnalytics(
                "get_goal_progress",
                async () => {
                    if (date !== undefined) assertCalendarDate("date", date);
                    const profile = await getProfile(userId);
                    const tz = timezoneFromProfile(profile) ?? "UTC";
                    const targetDate = date ?? todayInTz(tz);
                    const [meals, water, goals, latestWeight] =
                        await Promise.all([
                            getMealsByDate(userId, targetDate, tz),
                            getWaterByDate(userId, targetDate, tz),
                            getNutritionGoals(userId),
                            getLatestWeight(userId),
                        ]);
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
                            ...(await mealItemsMetaEntry(
                                userId,
                                meals,
                                alcohol,
                            )),
                        },
                    };
                },
                analytics,
                { date: date ?? "today" },
            );
        },
    );

    server.registerTool(
        "delete_meal",
        {
            title: "Delete Meal",
            description:
                "Delete a meal entry by ID (ids come from get_meals_today, get_meals_by_date, get_meals_by_date_range or search_meals).",
            annotations: {
                title: "Delete Meal",
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                id: z
                    .string()
                    .describe(
                        `UUID of the meal to delete, from ${MEAL_ID_SOURCES}.`,
                    ),
            }),
        },
        async ({ id }) => {
            return withAnalytics(
                "delete_meal",
                async () => {
                    // Answered, not thrown: nothing with that id exists, the
                    // same as a well-formed id that matches no row.
                    if (!isUuid(id)) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: notUuidText(
                                        "meal",
                                        id,
                                        MEAL_ID_SOURCES,
                                    ),
                                },
                            ],
                        };
                    }
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
                analytics,
            );
        },
    );

    server.registerTool(
        "update_meal",
        {
            title: "Update Meal",
            // Only the fields passed are written (see updateMeal), which is what
            // makes this the backfill path for a meal that went in without its
            // fiber or sugar — the path missingNutrientNote offers the user. The
            // backfill runs only once the user asks or agrees: an unrequested
            // write is what directory policy 2.D forbids.
            description:
                "Update fields of an existing meal entry. Only the fields you pass are changed, which also makes this the way to backfill nutrition a meal was logged without: when a past meal has no fiber_g, sugar_g, added_sugar_g or (where it applies) caffeine_mg and the user asks or agrees to fill it in, estimate the value and pass just that field (for a meal logged with items, the full items list carrying the value on each item). A meal logged with items has totals equal to the sum of those items, so its totals change through a full new items list (which replaces its previous items) rather than through the totals fields. Meal ids come from get_meals_today, get_meals_by_date, get_meals_by_date_range or search_meals.\n\n" +
                NUTRIENT_COVERAGE,
            annotations: {
                title: "Update Meal",
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
                        `UUID of the meal to update, from ${MEAL_ID_SOURCES}.`,
                    ),
                description: z.string().optional(),
                meal_type: z
                    .enum(["breakfast", "lunch", "dinner", "snack"])
                    .optional(),
                // Same bounds, and the same reasoning, as log_meal.
                calories: z.coerce.number().min(0).max(MAX_CALORIES).optional(),
                protein_g: z.coerce.number().min(0).max(MAX_MACRO_G).optional(),
                carbs_g: z.coerce.number().min(0).max(MAX_MACRO_G).optional(),
                fat_g: z.coerce.number().min(0).max(MAX_MACRO_G).optional(),
                saturated_fat_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Saturated fat in grams: the part of fat_g that is saturated, never more than it. Optional. On an itemized meal it is all-or-none across the items: a list that gives it on some items and not others is refused. A missing value is stored as not measured and leaves that day out of the saturated-fat average and limit. 0 is the correct value for a food with none.",
                    ),
                trans_fat_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Trans fat in grams: a separate fat type, stored as given and not checked against fat_g. Optional, and it has no limit. On an itemized meal the meal's trans fat is the sum of the items that carry it, so it may be given on some items and not others. Not sent means not measured, not zero.",
                    ),
                fiber_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Dietary fiber in grams. Only the fields passed are written, so this fills in the figure for a meal logged without one; 0 is the correct value for a food that has none (meat, fish, eggs, dairy, oil).",
                    ),
                sugar_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "TOTAL sugars in grams, including sugar naturally present in fruit and milk as well as added sugar. Only the fields passed are written, so this fills in the figure for a meal logged without one; 0 is the correct value for a food that has none.",
                    ),
                added_sugar_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Added sugars in grams: sugars added during processing or preparation (table sugar, syrups, honey, sugar in sweetened drinks and foods), part of sugar_g and never more than it. Sugar naturally present in whole fruit, vegetables and plain milk is not added, and neither is 100% fruit juice. Only the fields passed are written, so this fills in the figure for a meal logged without one, checked against the meal's stored sugar_g when sugar_g is not passed alongside it; 0 is the correct value for a food that has none (whole fruit, vegetables, plain milk, meat, rice), and a soft drink's sugar is all added. It accompanies sugar_g: a call that passes sugar_g without added_sugar_g, for a meal with no added sugar recorded, may be refused, leaving the meal unchanged.",
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
                items: z
                    .array(MEAL_ITEM_INPUT)
                    .optional()
                    .describe(UPDATE_MEAL_ITEMS_DESCRIPTION),
                food_ref: FOOD_REF_INPUT.optional().describe(
                    `${FOOD_REF_DESCRIPTION} For a meal without items. Changed nutrients take this record's label; unchanged ones keep theirs.`,
                ),
                user_stated: USER_STATED_INPUT,
            }),
            outputSchema: MEAL_PROGRESS_OUTPUT_SCHEMA,
            // Reuses the SAME meal-logged widget as log_meal (see
            // buildMealProgress / meal-logged.html); `action: "updated"` just
            // changes its header. Renders nothing when no goals are set.
            ...uiMeta(MEAL_LOGGED_WIDGET_URI),
        },
        async ({
            id,
            items: rawItems,
            food_ref: foodRef,
            user_stated: userStated,
            ...fields
        }) => {
            return withAnalytics(
                "update_meal",
                async () => {
                    // Before resolveWriteTimestamp, which reads the profile.
                    if (!isUuid(id))
                        throw new ToolError(
                            notUuidText("meal", id, MEAL_ID_SOURCES),
                        );
                    let itemsChecked: Awaited<
                        ReturnType<typeof checkedItemsWithSources>
                    > | null = null;
                    if (rawItems !== undefined) {
                        // Items replace the totals: the totals fields may not
                        // come alongside, and each item is checked on its own.
                        const sent = totalsSentWithItems(fields);
                        if (sent.length > 0) throw totalsWithItemsError(sent);
                        refuseMealLevelRefsWithItems(foodRef, userStated);
                        itemsChecked = await checkedItemsWithSources(rawItems);
                    } else if (totalsSentWithItems(fields).length > 0) {
                        // A meal logged with items has totals that are their
                        // sum, so a direct edit of a total would contradict
                        // its items.
                        const count = await countMealItems(userId, id);
                        if (count > 0)
                            throw new ToolError(
                                `This meal's totals are the sum of its ${count} item${count === 1 ? "" : "s"}, so they change through items (the full new list) rather than directly.`,
                                { category: "meal_items_invalid" },
                            );
                    }
                    // The sugar checks run on the row the plain write is computed
                    // from (writePlainMealUpdate). A pair sent together needs no
                    // stored partner, so it is checked from this call alone.
                    const passedSugar = fields.sugar_g !== undefined;
                    const passedAdded = fields.added_sugar_g !== undefined;
                    const checkPairedSugar = (stored: Meal | null): void => {
                        if (!passedSugar && !passedAdded) return;
                        const partner =
                            passedSugar && passedAdded ? null : stored;
                        if (
                            partner &&
                            addedSugarRequiredNow() &&
                            addedSugarMissing(fields, partner.added_sugar_g)
                        )
                            throw addedSugarMissingError(id);
                        const sugarError = updatedAddedSugarError(
                            fields,
                            partner,
                        );
                        if (sugarError) throw new ToolError(sugarError);
                    };
                    // A plain meal's changed nutrients take fresh labels and the
                    // rest keep theirs; an itemized meal's labels come from its
                    // items (already in itemsChecked).
                    if (!itemsChecked) {
                        refuseLabelsWithoutValues(
                            foodRef,
                            userStated,
                            totalsSentWithItems(fields).length > 0,
                        );
                        if (foodRef !== undefined) parseFoodRef(foodRef);
                    }
                    let written: { meal: Meal; note: string };
                    if (itemsChecked) {
                        const { iso, note } = await resolveWriteTimestamp(
                            userId,
                            fields.logged_at,
                        );
                        written = {
                            meal: await replaceMealItems(
                                userId,
                                id,
                                {
                                    ...fields,
                                    ...itemsChecked.totals,
                                    logged_at: iso,
                                    nutrient_sources: itemsChecked.sources,
                                    source_detail: itemsChecked.detail,
                                },
                                itemsChecked.items,
                            ),
                            note,
                        };
                    } else {
                        written = await writePlainMealUpdate(
                            userId,
                            id,
                            fields,
                            foodRef,
                            userStated,
                            checkPairedSugar,
                        );
                    }
                    const { meal, note } = written;
                    const { progressSection, structuredContent, meta, tz } =
                        await buildMealProgress(
                            userId,
                            meal,
                            "updated",
                            alcohol,
                        );
                    const missingNote = await missingNutrientNoteFor(
                        userId,
                        meal,
                        itemsChecked?.items.length,
                    );
                    const sourcesNote = sourcesNoteFor(
                        meal,
                        foodRef !== undefined ||
                            (rawItems ?? []).some(
                                (i) => i.food_ref !== undefined,
                            ),
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Meal updated (${tz} time):\n${formatMealFull(meal, alcohol, tz, itemsChecked?.items)}${progressSection}${saturatedAboveFatNote(meal) ?? ""}${sourcesNote}${itemSourcesNoteFor(itemsChecked?.items)}${alcoholHiddenNote(
                                    (meal.alcohol_g ?? 0) > 0,
                                    alcohol,
                                    "Alcohol saved with this meal",
                                )}${missingNote}${note}`,
                            },
                        ],
                        structuredContent,
                        _meta: meta,
                    };
                },
                analytics,
            );
        },
    );
    server.registerTool(
        "save_meal",
        {
            title: "Save Meal",
            description:
                "Save a named meal to log again later, kept per serving: its totals and, optionally, its ingredients. Give items, or the totals per serving (with calories), or from_meal_id to copy a meal already logged. Saving writes no meal entry; log_saved_meal logs a saved meal. A name already in use is refused, and update_saved_meal changes a saved meal.",
            annotations: {
                title: "Save Meal",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: z.object({
                name: z
                    .string()
                    .describe(
                        "The saved meal's name, 1 to 100 characters, unique among the user's saved meals (case-insensitive).",
                    ),
                from_meal_id: z
                    .string()
                    .optional()
                    .describe(
                        `UUID of a logged meal to copy, from ${MEAL_ID_SOURCES}. Its totals and ingredients are copied; description and meal_type may be sent to override them. Items and totals are not sent with it.`,
                    ),
                description: z
                    .string()
                    .optional()
                    .describe(
                        "What the saved meal is, written as a meal description would be, 1 to 2000 characters. Defaults to the name, or to the copied meal's description.",
                    ),
                meal_type: z
                    .enum(["breakfast", "lunch", "dinner", "snack"])
                    .optional()
                    .describe(
                        "Default meal type, used by log_saved_meal when its meal_type is not given.",
                    ),
                items: z
                    .array(MEAL_ITEM_INPUT)
                    .optional()
                    .describe(SAVE_MEAL_ITEMS_DESCRIPTION),
                food_ref: FOOD_REF_INPUT.optional().describe(
                    `${FOOD_REF_DESCRIPTION} Without items; with items, give food_ref on each item.`,
                ),
                user_stated: USER_STATED_INPUT,
                calories: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_CALORIES)
                    .optional()
                    .describe(
                        "Calories per serving. Sent with the other totals when there are no items; calories is the one that must come with them.",
                    ),
                protein_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe("Protein per serving, in grams."),
                carbs_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe("Carbohydrates per serving, in grams."),
                fat_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe("Fat per serving, in grams."),
                saturated_fat_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Saturated fat per serving, in grams: the part of fat_g that is saturated, never more than it. Optional; not measured when not sent.",
                    ),
                trans_fat_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Trans fat per serving, in grams, a separate fat type, stored as given and not checked against fat_g. Optional; not measured when not sent.",
                    ),
                fiber_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Fiber per serving, in grams, as log_meal's fiber_g.",
                    ),
                sugar_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Total sugars per serving, in grams, as log_meal's sugar_g.",
                    ),
                added_sugar_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Added sugars per serving, in grams, as log_meal's added_sugar_g. Never more than sugar_g.",
                    ),
                alcohol_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_ALCOHOL_G)
                    .optional()
                    .describe(
                        "Grams of pure ethanol per serving, as log_meal's alcohol_g.",
                    ),
                caffeine_mg: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_CAFFEINE_MG)
                    .optional()
                    .describe(
                        "Caffeine per serving, in milligrams, as log_meal's caffeine_mg.",
                    ),
            }),
        },
        async (args) => {
            return withAnalytics(
                "save_meal",
                async () => {
                    const name = validateSavedMealName(args.name);
                    if (
                        (await countSavedMeals(userId)) >=
                        MAX_SAVED_MEALS_PER_USER
                    )
                        throw new ToolError(
                            `This account already holds ${MAX_SAVED_MEALS_PER_USER} saved meals, the most it can keep. delete_saved_meal removes one.`,
                            { category: "meal_items_invalid" },
                        );
                    const description =
                        args.description !== undefined
                            ? validateSavedMealDescription(args.description)
                            : undefined;
                    const sentTotals = totalsSentWithItems(args);

                    let saved: SavedMealWithItems;
                    let labels: {
                        sources: NutrientSources;
                        detail: SourceDetail | null;
                    };
                    if (args.from_meal_id !== undefined) {
                        if (!isUuid(args.from_meal_id))
                            throw new ToolError(
                                notUuidText(
                                    "meal",
                                    args.from_meal_id,
                                    MEAL_ID_SOURCES,
                                ),
                            );
                        if (
                            args.food_ref !== undefined ||
                            (args.user_stated?.length ?? 0) > 0
                        )
                            throw new ToolError(
                                "from_meal_id copies the logged meal's labels for its values, so food_ref and user_stated cannot be sent with it.",
                                { category: "food_ref_invalid" },
                            );
                        if (args.items !== undefined || sentTotals.length > 0)
                            throw new ToolError(
                                "from_meal_id copies a logged meal's totals and ingredients, so items and totals cannot be sent with it. description and meal_type can still be sent.",
                                { category: "meal_items_invalid" },
                            );
                        const source = await getMealById(
                            userId,
                            args.from_meal_id,
                        );
                        if (!source)
                            throw new ToolError(
                                `No meal found with id ${args.from_meal_id}.`,
                            );
                        const sourceItems =
                            (await getMealItems(userId, [source.id])).get(
                                source.id,
                            ) ?? [];
                        // A logged meal's description has no length bound, so
                        // a long one is refused here rather than by the
                        // database; a description sent alongside replaces it.
                        const copied = source.description.trim();
                        const copiedLength = [...copied].length;
                        if (
                            description === undefined &&
                            copiedLength > MAX_SAVED_MEAL_DESCRIPTION_CHARS
                        )
                            throw new ToolError(
                                `The meal being copied has a description of ${copiedLength} characters, and a saved meal's description holds at most ${MAX_SAVED_MEAL_DESCRIPTION_CHARS}. A description sent with from_meal_id replaces the copied one.`,
                                { category: "meal_items_invalid" },
                            );
                        saved = await savedMealWrite(
                            userId,
                            name,
                            {
                                ...nutrientsFrom(source),
                                name,
                                description:
                                    description ??
                                    (copiedLength > 0 ? copied : name),
                                meal_type: args.meal_type ?? source.meal_type,
                                // A copy keeps the labels the logged meal has.
                                nutrient_sources: parseNutrientSources(
                                    source.nutrient_sources ?? null,
                                ),
                                source_detail: parseSourceDetail(
                                    source.source_detail ?? null,
                                ),
                            },
                            sourceItems,
                        );
                    } else {
                        let values: NutrientValues;
                        let items: MealItemValues[] = [];
                        if (args.items !== undefined) {
                            if (sentTotals.length > 0)
                                throw totalsWithItemsError(sentTotals);
                            refuseMealLevelRefsWithItems(
                                args.food_ref,
                                args.user_stated,
                            );
                            const checked = await checkedItemsWithSources(
                                args.items,
                            );
                            values = checked.totals;
                            items = checked.items;
                            labels = {
                                sources: checked.sources,
                                detail: checked.detail,
                            };
                        } else {
                            if (args.calories === undefined)
                                throw new ToolError(
                                    "A saved meal is kept from either items or its totals per serving, and the totals need calories at least.",
                                    { category: "meal_items_invalid" },
                                );
                            // The same two meal-level checks log_meal runs.
                            if (
                                addedSugarRequiredNow() &&
                                addedSugarMissing(args)
                            )
                                throw addedSugarMissingError();
                            const sugarError = addedSugarError(
                                args.added_sugar_g,
                                args.sugar_g,
                            );
                            if (sugarError) throw new ToolError(sugarError);
                            values = nutrientsFrom(args);
                            labels = await labelRow(
                                args.food_ref,
                                loggedValuesOf(values),
                                args.user_stated,
                            );
                        }
                        saved = await savedMealWrite(
                            userId,
                            name,
                            {
                                ...values,
                                name,
                                description: description ?? name,
                                meal_type: args.meal_type ?? null,
                                nutrient_sources: labels.sources,
                                source_detail: labels.detail,
                            },
                            items,
                        );
                    }
                    const alcoholNote = alcoholHiddenNote(
                        (saved.alcohol_g ?? 0) > 0,
                        alcohol,
                        "Alcohol saved with this saved meal",
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Saved meal "${saved.name}" [saved meal id: ${saved.id}]\n${savedMealBody(saved, alcohol)}${sourcesNoteFor(saved, args.food_ref !== undefined || (args.items ?? []).some((i) => i.food_ref !== undefined))}${itemSourcesNoteFor(saved.items)}${alcoholNote}`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "get_saved_meals",
        {
            title: "Get Saved Meals",
            description:
                "List the user's saved meals by name: each with its id, default meal type, figures per serving and ingredients. name_contains narrows the list to saved meals whose name contains the text, case-insensitively. The ids are what log_saved_meal, update_saved_meal and delete_saved_meal take.",
            annotations: {
                title: "Get Saved Meals",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                name_contains: z
                    .string()
                    .min(1)
                    .max(100)
                    .optional()
                    .describe(
                        "Text the saved meal's name contains, case-insensitively.",
                    ),
            }),
        },
        async ({ name_contains }) => {
            return withAnalytics(
                "get_saved_meals",
                async () => {
                    const needle = name_contains?.trim() || undefined;
                    const saved = await getSavedMeals(userId, {
                        nameContains: needle,
                    });
                    if (saved.length === 0) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: needle
                                        ? `No saved meals matching "${needle}".`
                                        : "No saved meals yet.",
                                },
                            ],
                        };
                    }
                    const total = saved.length;
                    const header = `${total} saved meal${total === 1 ? "" : "s"}${needle ? ` matching "${needle}"` : ""}.`;
                    // Whole saved meals, while they fit the listing budget;
                    // the first one always shows.
                    const entries: string[] = [];
                    let size = header.length;
                    for (const s of saved) {
                        const entry = savedMealListing(s, alcohol);
                        if (
                            entries.length > 0 &&
                            size + entry.length > MEAL_LISTING_MAX_CHARS
                        )
                            break;
                        entries.push(entry);
                        size += entry.length + 2;
                    }
                    const notice =
                        entries.length < total
                            ? `\n\nThe list stops at ${entries.length} of ${total} saved meals. name_contains narrows it to the names it contains.`
                            : "";
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${header}\n\n${entries.join("\n\n")}${notice}`,
                            },
                        ],
                    };
                },
                analytics,
                { name_contains },
            );
        },
    );

    server.registerTool(
        "log_saved_meal",
        {
            title: "Log Saved Meal",
            description:
                "Log a saved meal as a meal entry: a copy of its values and of its ingredients, scaled by servings, with single items' amounts changed or items left out. servings applies first, and item_amounts then sets an item to the amount actually eaten in this entry. saved_meal is the saved meal's name or id (ids come from get_saved_meals or search_meals). The entry is then an ordinary meal, and editing or deleting the saved meal later does not change it. meal_type defaults to the saved meal's default.",
            outputSchema: MEAL_PROGRESS_OUTPUT_SCHEMA,
            annotations: {
                title: "Log Saved Meal",
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: z.object({
                saved_meal: z
                    .string()
                    .min(1)
                    .max(200)
                    .describe(
                        "The saved meal's name, or its id from get_saved_meals or search_meals.",
                    ),
                servings: z.coerce
                    .number()
                    .positive()
                    .max(MAX_SERVINGS)
                    .optional()
                    .describe(
                        `How many servings this entry covers, 1 by default and at most ${MAX_SERVINGS}. Scales every total and every item's amount and nutrients; item_amounts is applied after it.`,
                    ),
                item_amounts: z
                    .array(
                        z.object({
                            item: z
                                .string()
                                .min(1)
                                .describe(
                                    "The item's position number or its exact name.",
                                ),
                            amount: z.coerce
                                .number()
                                .positive()
                                .max(MAX_ITEM_AMOUNT)
                                .describe(
                                    "The amount of the item eaten in this entry, in the item's own unit. servings does not scale it further.",
                                ),
                        }),
                    )
                    .optional()
                    .describe(
                        "Items whose amount in this entry differs from the saved amount times servings: each amount is what this entry holds of the item, and the item's nutrients scale to it. An item saved without an amount can only be left out, and a saved meal without items cannot take this.",
                    ),
                leave_out: z
                    .array(z.string().min(1))
                    .optional()
                    .describe(
                        "Items not eaten this time, by position number or exact name. At least one item stays in.",
                    ),
                meal_type: z
                    .enum(["breakfast", "lunch", "dinner", "snack"])
                    .optional()
                    .describe(
                        "Meal type of this entry. Defaults to the saved meal's default meal type.",
                    ),
                description: z
                    .string()
                    .optional()
                    .describe(
                        "Description of this entry. Defaults to the saved meal's description, with the servings noted when servings is not 1.",
                    ),
                logged_at: z
                    .string()
                    .optional()
                    .describe(
                        "When this actually happened (defaults to now). " +
                            LOGGED_AT_FORMS_PLAIN +
                            LOGGED_AT_OMITTED_PLAIN,
                    ),
                notes: z.string().optional().describe("Additional notes"),
                idempotency_key: z
                    .string()
                    .min(1)
                    .max(255)
                    .optional()
                    .describe(idempotencyKeyDescriptionPlain("meal")),
            }),
            ...uiMeta(MEAL_LOGGED_WIDGET_URI),
        },
        async (args) => {
            return withAnalytics(
                "log_saved_meal",
                async () => {
                    const saved = await resolveSavedMeal(
                        userId,
                        args.saved_meal,
                    );
                    const servings = args.servings ?? 1;
                    const mealType = args.meal_type ?? saved.meal_type;
                    if (!mealType)
                        throw new ToolError(
                            "This saved meal has no default meal type; meal_type gives one.",
                            { category: "meal_items_invalid" },
                        );
                    const changed =
                        (args.item_amounts?.length ?? 0) > 0 ||
                        (args.leave_out?.length ?? 0) > 0;
                    let items: MealItemValues[] | undefined;
                    let totals: NutrientValues;
                    let labels: {
                        sources: NutrientSources | null;
                        detail: SourceDetail | null;
                    };
                    if (saved.items.length > 0) {
                        // Servings first, then the item changes, so an
                        // item_amounts value is the amount in this entry
                        // rather than one servings multiplies again.
                        items = applyItemChanges(
                            scaleItems(saved.items, servings),
                            {
                                item_amounts: args.item_amounts,
                                leave_out: args.leave_out,
                            },
                        );
                        totals = sumItems(items);
                        // Item labels are kept per item; the meal's are
                        // re-derived from the items actually eaten.
                        const derived = deriveFromItems(items);
                        labels = {
                            sources: derived.sources,
                            detail: derived.detail,
                        };
                    } else {
                        if (changed)
                            throw new ToolError(
                                "This saved meal has no items, so item_amounts and leave_out do not apply; servings scales the whole meal.",
                                { category: "meal_items_invalid" },
                            );
                        totals = scaleTotals(nutrientsFrom(saved), servings);
                        // Servings scale the values, so a record-backed label
                        // stays true with its amount scaled too (scaleSourceDetail).
                        labels = {
                            sources: saved.nutrient_sources ?? null,
                            detail: scaleSourceDetail(
                                saved.source_detail ?? null,
                                servings,
                            ),
                        };
                    }
                    // A servings multiplier or a changed amount can take the
                    // meal past what log_meal accepts (and calories past the
                    // integer column); refused before anything is written.
                    assertMealTotals(totals);
                    const description =
                        args.description ??
                        saved.description +
                            (servings !== 1 ? ` (${servings} servings)` : "");
                    const { iso, note } = await resolveWriteTimestamp(
                        userId,
                        args.logged_at,
                    );
                    const { meal, deduplicated } = await insertMeal(userId, {
                        description,
                        meal_type: mealType as MealInput["meal_type"],
                        ...totalsAsInput(totals),
                        logged_at: iso,
                        notes: args.notes,
                        idempotency_key: args.idempotency_key,
                        saved_meal_id: saved.id,
                        ...(items ? { items } : {}),
                        nutrient_sources: labels.sources,
                        source_detail: labels.detail,
                    });
                    const header = deduplicated
                        ? "Meal already logged — this matched an existing meal, so nothing new was added"
                        : "Meal logged";
                    const { progressSection, structuredContent, meta, tz } =
                        await buildMealProgress(
                            userId,
                            meal,
                            "logged",
                            alcohol,
                        );
                    const block =
                        items && !deduplicated
                            ? `\n${formatItemsBlock(items, alcohol !== null)}`
                            : "";
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${header} (${tz} time):\n${formatMealFull(meal, alcohol, tz)}\n\nFrom saved meal "${saved.name}".${block}${progressSection}${sourcesNoteFor(meal, false)}${deduplicated ? "" : itemSourcesNoteFor(items)}${alcoholHiddenNote(
                                    (meal.alcohol_g ?? 0) > 0,
                                    alcohol,
                                    "Alcohol saved with this meal",
                                )}${await missingNutrientNoteFor(
                                    userId,
                                    meal,
                                    deduplicated
                                        ? undefined
                                        : (items?.length ?? 0),
                                )}${note}`,
                            },
                        ],
                        structuredContent,
                        _meta: meta,
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "update_saved_meal",
        {
            title: "Update Saved Meal",
            description:
                "Change a saved meal: its name, description, default meal type, its totals per serving or its ingredients (a full new list). Only the fields passed change. Meals already logged from it keep their values. A saved meal with items has totals equal to the sum of its items, so its totals change through items.",
            annotations: {
                title: "Update Saved Meal",
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                id: z
                    .string()
                    .describe(
                        `UUID of the saved meal to change, from ${SAVED_MEAL_ID_SOURCES}.`,
                    ),
                name: z
                    .string()
                    .optional()
                    .describe(
                        "A new name, unique among the user's saved meals.",
                    ),
                description: z
                    .string()
                    .optional()
                    .describe("A new description, 1 to 2000 characters."),
                meal_type: z
                    .enum(["breakfast", "lunch", "dinner", "snack"])
                    .optional()
                    .describe("A new default meal type."),
                items: z
                    .array(MEAL_ITEM_INPUT)
                    .optional()
                    .describe(UPDATE_SAVED_MEAL_ITEMS_DESCRIPTION),
                food_ref: FOOD_REF_INPUT.optional().describe(
                    `${FOOD_REF_DESCRIPTION} Without items, it describes the totals sent with it; the changed totals take its label and the rest keep theirs.`,
                ),
                user_stated: USER_STATED_INPUT,
                calories: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_CALORIES)
                    .optional()
                    .describe("Calories per serving."),
                protein_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe("Protein per serving, in grams."),
                carbs_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe("Carbohydrates per serving, in grams."),
                fat_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe("Fat per serving, in grams."),
                saturated_fat_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Saturated fat per serving, in grams: the part of fat_g that is saturated, never more than it. Optional; not measured when not sent.",
                    ),
                trans_fat_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Trans fat per serving, in grams, a separate fat type, stored as given and not checked against fat_g. Optional; not measured when not sent.",
                    ),
                fiber_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe("Fiber per serving, in grams."),
                sugar_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe("Total sugars per serving, in grams."),
                added_sugar_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_MACRO_G)
                    .optional()
                    .describe(
                        "Added sugars per serving, in grams. Never more than sugar_g.",
                    ),
                alcohol_g: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_ALCOHOL_G)
                    .optional()
                    .describe("Grams of pure ethanol per serving."),
                caffeine_mg: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_CAFFEINE_MG)
                    .optional()
                    .describe("Caffeine per serving, in milligrams."),
            }),
        },
        async ({
            id,
            items: rawItems,
            food_ref: foodRef,
            user_stated: userStated,
            ...fields
        }) => {
            return withAnalytics(
                "update_saved_meal",
                async () => {
                    if (!isUuid(id))
                        throw new ToolError(
                            notUuidText(
                                "saved meal",
                                id,
                                SAVED_MEAL_ID_SOURCES,
                            ),
                        );
                    const name =
                        fields.name !== undefined
                            ? validateSavedMealName(fields.name)
                            : undefined;
                    const description =
                        fields.description !== undefined
                            ? validateSavedMealDescription(fields.description)
                            : undefined;
                    const sentTotals = totalsSentWithItems(fields);
                    if (
                        name === undefined &&
                        fields.description === undefined &&
                        fields.meal_type === undefined &&
                        rawItems === undefined &&
                        sentTotals.length === 0
                    )
                        throw new ToolError(
                            "Nothing to change: pass a name, description, meal_type, items or totals.",
                        );
                    const notFound = () =>
                        new ToolError(`No saved meal found with id ${id}.`);

                    let items: MealItemValues[] | null = null;
                    let totals: Partial<NutrientValues> = {};
                    let labels: {
                        sources: NutrientSources;
                        detail: SourceDetail | null;
                    } | null = null;
                    // Bounds before anything is read.
                    refuseLabelsWithoutValues(
                        foodRef,
                        userStated,
                        sentTotals.length > 0 || rawItems !== undefined,
                    );
                    if (foodRef !== undefined) parseFoodRef(foodRef);
                    if (rawItems !== undefined) {
                        if (sentTotals.length > 0)
                            throw totalsWithItemsError(sentTotals);
                        refuseMealLevelRefsWithItems(foodRef, userStated);
                        const checked = await checkedItemsWithSources(rawItems);
                        items = checked.items;
                        totals = checked.totals;
                        labels = {
                            sources: checked.sources,
                            detail: checked.detail,
                        };
                    }
                    const base: Partial<SavedMealInput> = {
                        ...(name !== undefined ? { name } : {}),
                        ...(description !== undefined ? { description } : {}),
                        ...(fields.meal_type !== undefined
                            ? { meal_type: fields.meal_type }
                            : {}),
                    };
                    let updated: SavedMealWithItems | null;
                    try {
                        updated =
                            rawItems === undefined && sentTotals.length > 0
                                ? await writeSavedMealTotals(
                                      userId,
                                      id,
                                      base,
                                      sentTotals,
                                      Object.fromEntries(
                                          sentTotals.map((k) => [k, fields[k]]),
                                      ) as Partial<NutrientValues>,
                                      foodRef,
                                      userStated,
                                  )
                                : await updateSavedMeal(
                                      userId,
                                      id,
                                      {
                                          ...totals,
                                          ...base,
                                          ...(labels
                                              ? {
                                                    nutrient_sources:
                                                        labels.sources,
                                                    source_detail:
                                                        labels.detail,
                                                }
                                              : {}),
                                      },
                                      items,
                                  );
                    } catch (err) {
                        if (err instanceof SavedMealNameTaken)
                            throw savedMealNameTakenError(
                                name ?? "",
                                err.existingId,
                            );
                        throw err;
                    }
                    if (!updated) throw notFound();
                    const alcoholNote = alcoholHiddenNote(
                        (updated.alcohol_g ?? 0) > 0,
                        alcohol,
                        "Alcohol saved with this saved meal",
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Saved meal "${updated.name}" updated. Meals already logged from it keep their values.\n${savedMealBody(updated, alcohol)}${sourcesNoteFor(updated, foodRef !== undefined || (rawItems ?? []).some((i) => i.food_ref !== undefined))}${alcoholNote}`,
                            },
                        ],
                    };
                },
                analytics,
            );
        },
    );

    server.registerTool(
        "delete_saved_meal",
        {
            title: "Delete Saved Meal",
            description:
                "Delete a saved meal and its ingredients. Meals already logged from it keep their values; they only lose the link to it.",
            annotations: {
                title: "Delete Saved Meal",
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: z.object({
                id: z
                    .string()
                    .describe(
                        `UUID of the saved meal to delete, from ${SAVED_MEAL_ID_SOURCES}.`,
                    ),
            }),
        },
        async ({ id }) => {
            return withAnalytics(
                "delete_saved_meal",
                async () => {
                    if (!isUuid(id)) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: notUuidText(
                                        "saved meal",
                                        id,
                                        SAVED_MEAL_ID_SOURCES,
                                    ),
                                },
                            ],
                        };
                    }
                    const deleted = await deleteSavedMeal(userId, id);
                    return {
                        content: [
                            {
                                type: "text",
                                text: deleted
                                    ? `Saved meal "${deleted.name}" deleted. Meals already logged from it keep their values.`
                                    : `No saved meal found with id ${id}.`,
                            },
                        ],
                    };
                },
                analytics,
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
        async ({ days, end_date }) => {
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
                    const [entries, goals] = await Promise.all([
                        getAllWeight(userId),
                        getNutritionGoals(userId),
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
                        _meta: {
                            [WEIGHT_SERIES_META_KEY]: analysis.meta,
                        },
                    };
                },
                analytics,
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

    server.registerTool(
        "set_widget_display",
        {
            title: "Set Widget Display",
            description:
                "Enable or disable the in-chat visual widgets (nutrition dashboard, goal progress, meal-logged rings, trends, weight charts). When disabled, the same tools still return their full text and data — just no rendered widget. Widgets are enabled by default. Note: hosts read the widget list when a session connects, so the change takes effect in new conversations; an already-open chat may keep showing widgets until it reconnects.",
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
                    .describe(
                        "true to show widgets (default), false for text-only responses with no widget.",
                    ),
            }),
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
        async ({ days, end_date, group_by }) => {
            return withAnalytics(
                "get_trends",
                async () => {
                    if (end_date !== undefined)
                        assertCalendarDate("end_date", end_date);
                    const profile = await getProfile(userId);
                    const tz = timezoneFromProfile(profile) ?? "UTC";
                    const locale = localeFromProfile(profile) ?? "en";
                    const endDate = end_date ?? todayInTz(tz);
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
                    const [meals, water, goals, history, loggedBefore] =
                        await Promise.all([
                            getMealsInRange(userId, mealStart, endDate, tz),
                            getWaterInRange(userId, startDate, endDate, tz),
                            getNutritionGoals(userId),
                            group_by
                                ? getNutritionGoalsHistory(userId)
                                : Promise.resolve(null),
                            group_by
                                ? hasMealsBefore(
                                      userId,
                                      yearSpanStart(endDate),
                                      tz,
                                  )
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
        },
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

    server.registerTool(
        "export_all_data",
        {
            title: "Export All Data",
            description:
                "Export EVERYTHING this server stores about the user — meals with their ingredients and the source of each nutrient value (a food record, a value the user gave, or an estimate), saved meals with their ingredients, water, weight, body measurements, nutrition goals and every dated change to them, profile settings, the sign-in account (email, sign-in methods and dates), tool-usage telemetry, the AI-app connections (OAuth grants, without the tokens) and the Apple Health sync connection with its 8-day record of what was sent — as a single ZIP archive (meals.csv, meal_items.csv, saved_meals.csv, saved_meal_items.csv, water.csv, weight.csv, body_measurements.csv, goals.csv, goals_history.csv, profile.csv, account.csv, telemetry.csv, connections.csv, health_sync.csv, plus a README.txt describing the columns, the units they are in, and what is not included) and return a private, time-limited download link (valid 60 minutes). Timestamps use the user's timezone if set, otherwise UTC; health_sync.csv rows use the timezone each day was counted in. Only meals.csv can be read back in; every other file is export-only. This is the server's only export path: it covers a full backup, an account takeout, and a request for the meal history alone, which is meals.csv inside the archive. The link is for the user to download the archive.",
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

    server.registerResource(
        "weekly-summary",
        "nutrition://weekly-summary",
        {
            title: "Weekly Nutrition Summary",
            description:
                "Rolling 7-day digest: logged-day count, daily averages vs targets, and the best/roughest day of the week.",
            mimeType: "text/plain",
        },
        async (uri) => {
            // Resources don't go through withAnalytics, and the SDK forwards a
            // thrown message to the client verbatim, so this catch applies the
            // same rule: raw text is logged under a ref, never returned.
            try {
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
            } catch (err) {
                const ref = newErrorRef();
                console.warn(
                    `[resource] weekly-summary error ref=${ref}: ${JSON.stringify(err instanceof Error ? err.message : String(err))}`,
                );
                throw new Error(
                    `Couldn't build the weekly summary right now (ref ${ref}); try again shortly or call get_trends.`,
                );
            }
        },
    );

    server.registerTool(
        "get_profile",
        {
            title: "Get Profile",
            description:
                "Get the user's current settings in one call: timezone (plus local date and time), widget language, preferred weight unit, preferred length unit, whether in-chat widgets are shown, and whether alcohol tracking is on — everything set_timezone, set_language, set_weight_unit, set_length_unit, set_widget_display and set_alcohol_tracking each control. Prefer this over guessing a setting from context, and use it once instead of calling several separate settings tools when you need more than one.",
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
                    const [profile, healthSync] = await Promise.all([
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
                            ? "Widgets: enabled. Supported tools show a visual widget alongside their text."
                            : "Widgets: disabled. Supported tools return text and data only.",
                        alcoholEnabled
                            ? `Alcohol tracking: enabled, displayed in grams alongside ${drinkUnitLabel(drinkUnit)}${preferredDrinkUnitFromProfile(profile) ? "" : " (the default — no preference saved)"}.`
                            : "Alcohol tracking: disabled, so alcohol is hidden from meals, goals and progress. Alcohol already stored is kept, and anything logged with alcohol_g while it is off is still stored. The exception is the file importer, which skips a file's alcohol column while tracking is off and will not backfill it on a later re-import — so tracking has to be on before importing an export whose alcohol the user wants to keep. The user can enable it with set_alcohol_tracking.",
                        healthSyncProfileLine(healthSync, tz ?? "UTC"),
                    ];

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
                "Set the user's IANA timezone (e.g. 'America/Los_Angeles', 'Europe/Berlin', 'Asia/Tokyo'). It decides which calendar day meals, water, weight and body measurements are grouped into when they are read — a meal logged at 11pm in LA counts on that LA day, not the next UTC day — and how a logged_at with no UTC offset is turned into an exact moment when it is written. That second part is permanent: an entry keeps the moment it was resolved to, so correcting the timezone later regroups existing entries under the new zone's days but does not re-read their original local times (a meal entered as 21:00 while the account was on UTC shows as 00:00 the next day once Europe/Kyiv is set in summer). Until one is set, the account uses UTC.",
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
                "Permanently delete the user's Nutrition MCP account and all data this service stores about them (meals and their ingredients, saved meals and their ingredients, water, weight, body measurements, goals, settings, exports, usage records, sign-in tokens, and the Apple Health sync connection with its record of values sent). Totals already written to Apple Health stay on the user's iPhone. Irreversible. Always confirm with the user before calling this tool.",
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

// The bare server: identity, capabilities and instructions, no tools. Shared
// by both factory paths so the surface a `server/discover` probe is answered
// from cannot drift from the one a tools/call is served by — the two responses
// come from the same literal.
function newMcpServer(baseUrl: string): McpServer {
    return new McpServer(
        {
            name: "nutrition-mcp",
            version: "1.28.0",
            // The "Plugged Apple" tile (white mark on green), so it reads on
            // any host background. favicon.ico stays first: it is the URL
            // clients and the directory listing have always been given.
            icons: [
                {
                    src: `${baseUrl}/favicon.ico`,
                    mimeType: "image/x-icon",
                    sizes: ["16x16", "32x32", "48x48"],
                },
                {
                    src: `${baseUrl}/icon-192.png`,
                    mimeType: "image/png",
                    sizes: ["192x192"],
                },
                {
                    src: `${baseUrl}/icon-512.png`,
                    mimeType: "image/png",
                    sizes: ["512x512"],
                },
            ],
        },
        {
            // listChanged is explicitly false: v2 would advertise true by
            // default, but /mcp is stateless and refuses the SSE stream, so
            // there is never a channel to deliver a list_changed notification
            // on. Advertising it would invite hosts to wait for one (the
            // 2026-07-28 conformance suite warns on exactly this). A tool
            // surface change (set_widget_display) is picked up on reconnect.
            capabilities: {
                tools: { listChanged: false },
                resources: { listChanged: false },
            },
            instructions: SERVER_INSTRUCTIONS,
        },
    );
}

// The full server: the bare one plus this user's tools registered. `baseUrl` is
// the public origin the client reached us on (from the forwarding headers),
// used only to advertise the server icon.
async function buildMcpServer(
    baseUrl: string,
    userId: string,
    protocolEra?: "legacy" | "modern",
): Promise<McpServer> {
    const server = newMcpServer(baseUrl);

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
        protocolEra,
    );
    return server;
}

// The two modern-era methods the SDK answers from server identity and
// capabilities alone, without ever consulting a tool handler: `server/discover`
// (supportedVersions + capabilities + instructions) and `subscriptions/listen`
// (refused outright below, but the SDK still reads getCapabilities() and the
// serverInfo off the instance before refusing). Both are served from
// newMcpServer, skipping a Supabase profile read and ~38 tool registrations.
// server/discover is the FIRST request every negotiating client sends, so under
// Supabase pressure it was the probe that failed — for a response that contains
// nothing a registration produces.
//
// Safe only because a modern request cannot reach the factory with a header
// that disagrees with its body: classification rejects a Mcp-Method that names
// a different method than the body does, and validateStandardRequestHeaders
// rejects an absent one — both with -32020 / HTTP 400, both before the factory
// runs. Those checks exist on the modern leg only — the legacy fallback ignores
// the header entirely — hence the era guard.
const IDENTITY_ONLY_METHODS = new Set([
    "server/discover",
    "subscriptions/listen",
]);

// Dual-era /mcp entry. createMcpHandler serves the 2026-07-28 revision
// (per-request `_meta` envelope, `server/discover` instead of `initialize`, no
// protocol-level sessions) and, with the default `legacy: "stateless"`, still
// answers 2025-era traffic through exactly the idiom handleMcp used to hand-roll:
// a fresh transport with `sessionIdGenerator: undefined` plus a fresh McpServer
// from this same factory, torn down when the response completes. One factory
// backs both eras, so the tool surface cannot drift between them. Nothing is
// kept in-process between requests on either leg, which is what keeps deploys
// invisible to clients — there is no session to lose.
//
// The factory has no Hono context: the authenticated user arrives through the
// `authInfo` pass-through (`extra.userId`, set in handleMcp from the bearer
// middleware's verdict) and the public origin comes from the raw request.
// Observability only, and the instrument that makes retiring the legacy leg a
// measurable decision rather than a guess. The negotiated era is decided inside
// the SDK and surfaces in exactly one place — `ctx.era` on the factory context —
// so handleMcp passes a mutable holder down through the `authInfo` pass-through
// for the factory to stamp on the way through. When no request has logged
// era=legacy for a sustained window, flipping `legacy: "reject"` is safe.
//
// Requests refused before the factory runs (415, header/body mismatch,
// unsupported revision) never get stamped, and log without an era rather than a
// guessed one.
export type McpEraTrace = {
    era?: "legacy" | "modern";
    // The server built for this request, kept so handleMcp can read the client
    // identity the SDK resolved. Only readable AFTER the exchange: on the modern
    // leg the envelope backfills it per request, on the legacy leg only
    // `initialize` carries clientInfo at all.
    server?: McpServer;
};

const mcpHandler = createMcpHandler(
    async (ctx: McpRequestContext) => {
        const trace = ctx.authInfo?.extra?.trace as McpEraTrace | undefined;
        if (trace) trace.era = ctx.era;

        const userId = ctx.authInfo?.extra?.userId;
        if (typeof userId !== "string" || userId.length === 0) {
            // handleMcp always sets it; reaching here means the /mcp route was
            // wired without authenticateBearer, which must fail loudly rather
            // than serve an anonymous server.
            throw new Error(
                "mcp: request reached the handler without a userId",
            );
        }
        // requestInfo is set on both HTTP legs; the fallback only covers a
        // non-HTTP embedding of this factory (e.g. serveStdio), which never
        // reaches production.
        const baseUrl = ctx.requestInfo
            ? getBaseUrl(ctx.requestInfo)
            : "http://localhost";

        const mcpMethod = ctx.requestInfo?.headers.get("mcp-method") ?? "";
        if (ctx.era === "modern" && IDENTITY_ONLY_METHODS.has(mcpMethod)) {
            const bare = newMcpServer(baseUrl);
            if (trace) trace.server = bare;
            return bare;
        }

        const server = await buildMcpServer(baseUrl, userId, ctx.era);
        if (trace) trace.server = server;
        return server;
    },
    {
        legacy: "stateless",
        // The 2026-07-28 revision replaces the GET stream with POST
        // subscriptions/listen, which would otherwise be served as a long-lived
        // SSE stream — the same deploy-severed connection the 405 in handleMcp
        // exists to refuse, and one whose cap is per process, not per user.
        // Nothing here is subscribable anyway (listChanged is false), so the
        // limit is zero and the SDK answers every listen with -32603
        // "Subscription limit reached" without opening a stream. This is the
        // only refusal: a pre-check in handleMcp used to answer -32601 off the
        // Mcp-Method header alone, which pre-empted the SDK's 415 Content-Type
        // gate and its -32020 header/body cross-check (so a client that sent
        // the header on a tools/call POST was told the TOOL did not exist) and
        // disagreed with this code. IDENTITY_ONLY_METHODS keeps what that
        // pre-check was actually worth — the factory stays cheap for a listen.
        maxSubscriptions: 0,
        // A stack for anything that might be ours, one line for what is not.
        // The SDK routes server-factory throws — a Supabase outage inside
        // getProfile, a bad icon URL, a bug in registerTools — solely to
        // onerror on BOTH legs, so a message-only line here left on-call with
        // no idea what failed. A ProtocolError is by construction a rejection
        // the SDK is already answering on the wire with a typed JSON-RPC error
        // (unsupported revision, missing capability, header/body mismatch), and
        // the [req] access line already records its status, so those keep the
        // one-line form. Everything else logs its stack; the SDK also reports
        // some routine rejections as plain Errors, and their stacks are noise
        // we accept rather than risk swallowing a real fault.
        //
        // Never interpolated raw: the SDK's rejection messages embed
        // client-controlled header values verbatim (the Mcp-Name path decodes a
        // client-supplied base64 blob with a non-sanitizing TextDecoder), so a
        // raw message could carry newlines and forge fake "[req] 200 …" access
        // log lines. JSON.stringify escapes newlines and control characters,
        // and covers the stack too — which contains the same message.
        onerror: (err) =>
            console.error(
                `[mcp] ${JSON.stringify(
                    err instanceof ProtocolError
                        ? err.message
                        : (err.stack ?? err.message),
                )}`,
            ),
    },
);

// Stateless: /mcp holds no per-session state on either protocol era, so a
// restart/deploy can never strand a connected client.
//
// Only POST (JSON-RPC request/response) is served. We reject GET and DELETE
// ourselves with 405 so a GET never opens a long-lived standalone SSE stream,
// the one piece of state a deploy still severs. The handler's legacy fallback
// answers 405 too, with its own JSON-RPC error ("Method not allowed."), but
// without an `Allow` header — which is what this adds, alongside a message that
// tells the client why rather than just that. Since stateless mode never pushes
// server-initiated messages, that stream carries nothing; the only thing it does
// is die on every restart and leave some clients (observed: a Claude connector)
// wedged in a "connected but no tools" state. Refusing the stream (spec-allowed: a server
// MAY return 405 when it offers no SSE stream at this endpoint) means the client
// holds nothing that a deploy can break, so updates become truly invisible.
export const handleMcp = async (c: Context) => {
    if (c.req.method !== "POST") {
        return c.json(
            {
                jsonrpc: JSONRPC_VERSION,
                id: null,
                error: {
                    // The SDK's own 405 uses -32000 for exactly this; matching
                    // it keeps one wire code for "wrong HTTP method here"
                    // whichever leg answers. There is no exported constant for
                    // -32000 (the named ones are PARSE_ERROR, INVALID_REQUEST,
                    // METHOD_NOT_FOUND, INVALID_PARAMS, INTERNAL_ERROR) and
                    // none of them means this.
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

    // The handler never derives auth from headers: authInfo is pass-through,
    // and the only consumer is our own factory above. `extra.userId` is the
    // single authoritative carrier — the SDK-designated slot for application
    // data, which the factory reads behind a typeof guard because `extra` is
    // untyped. clientId is left blank on purpose: it is an OAuth field the SDK
    // documents as "the client ID associated with this token", not an
    // app-identity slot, and carrying the user id in both places left no way to
    // tell which one a future reader (or a future SDK feature) should trust.
    // Nothing on the serve path reads it. The real bearer token is deliberately
    // NOT forwarded either — nothing downstream needs it, and keeping it out of
    // the SDK's context means no handler or error path can echo it.
    const trace: McpEraTrace = {};
    const response = await mcpHandler.fetch(c.req.raw, {
        authInfo: {
            token: "",
            clientId: "",
            scopes: [],
            extra: { userId, trace },
        },
    });

    // Published for the access log in src/index.ts, which runs outermost and
    // reads this after next() resolves. Set after fetch resolves, which is
    // after the factory has run even when the response body is still streaming.
    if (trace.era) c.set("mcpEra", trace.era);
    const client = formatClientId(trace.server?.server.getClientVersion());
    if (client) c.set("mcpClient", client);
    return response;
};

// Aborts any in-flight 2026-era exchanges on shutdown. The legacy leg holds
// nothing between requests, so there is nothing of it to close.
export const closeMcpHandler = (): Promise<void> => mcpHandler.close();
