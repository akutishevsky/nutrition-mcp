import {
    MAX_ALCOHOL_G,
    MAX_CAFFEINE_MG,
    MAX_CALORIES,
    MAX_MACRO_G,
    MAX_ROWS_PER_CALL,
    MAX_SODIUM_MG,
} from "../import.js";

export {
    MAX_ALCOHOL_G,
    MAX_CAFFEINE_MG,
    MAX_CALORIES,
    MAX_MACRO_G,
    MAX_SODIUM_MG,
};

export const SUMMARY_WIDGET_URI = "ui://widget/nutrition-summary.html";
export const APP_UI_MIME_TYPE = "text/html;profile=mcp-app";
export const GOAL_PROGRESS_WIDGET_URI = "ui://widget/goal-progress.html";
export const MEAL_LOGGED_WIDGET_URI = "ui://widget/meal-logged.html";
export const TRENDS_WIDGET_URI = "ui://widget/trends.html";
export const WEIGHT_TRENDS_WIDGET_URI = "ui://widget/weight-trends.html";
export const IMPORT_MEALS_WIDGET_URI = "ui://widget/import-meals.html";
export const DIGEST_WIDGET_URI = "ui://widget/digest.html";

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
export const NUTRIENT_COVERAGE = `Fiber, sugar, added sugar, saturated fat, trans fat, sodium and caffeine are tracked alongside the headline macros.
- saturated_fat_g and trans_fat_g are optional on every meal. saturated_fat_g is part of fat_g, never more than it; trans_fat_g is a separate fat type, stored as given and not checked against fat_g. A missing value is stored as "not measured" and leaves that day out of the saturated-fat average and limit; trans fat has no limit and is shown only where it was recorded. A figure comes from a nutrition label, the product's published nutrition or an estimate; 0 is the correct value for a food with none. On an itemized meal saturated_fat_g is all-or-none across the items, like fiber_g's sugar pair: a list that gives it on some items and not others is refused with nothing saved. trans_fat_g may be given on some items and not others; the meal's trans fat is the sum of the items that carry it.
- sodium_mg is optional on every meal: sodium in milligrams, not salt (1 g of salt holds about 400 mg of sodium). A missing value is stored as "not measured" and leaves that day out of the sodium average and limit. A figure comes from a nutrition label, the product's published nutrition or an estimate; 0 is the correct value for a food with none. On an itemized meal sodium_mg is all-or-none across the items, like saturated_fat_g: a list that gives it on some items and not others is refused with nothing saved.
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
export const SERVER_INSTRUCTIONS = `Nutrition tracking: meals (with their ingredients and saved meals), water, weight, body measurements, goals, and trends, per-user with timezone support.

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

// nutrition_goals stores every gram target as numeric(6,2), so anything from
// 10000 up is a Postgres "numeric field overflow" rather than a saved goal.
export const MAX_GOAL_G = 9_999.99;
// daily_caffeine_mg and daily_sodium_mg are the goal columns that are
// numeric(7,2) — milligram figures run three orders larger than the gram
// targets, so they get their own ceiling for the same overflow reason.
export const MAX_GOAL_MG = 99_999.99;

export const MAX_MEALS_PER_USER = 200_000;
export const SNAPSHOT_WRITE_ATTEMPTS = 3;
export const SAVED_MEAL_ID_SOURCES = "get_saved_meals or search_meals";
export const MAX_SAVED_MEAL_DESCRIPTION_CHARS = 2000;
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
export const BODY_MEASUREMENT_DEFAULT_DAYS = 30;

export const MEAL_ID_SOURCES =
    "get_meals_today, get_meals_by_date, get_meals_by_date_range or search_meals";
export const WATER_ID_SOURCES = "get_water_today or get_water_by_date";
export const ACTIVE_ID_SOURCES = "get_active_calories or log_active_calories";
export const WEIGHT_ID_SOURCES =
    "get_weight_today, get_weight_by_date or get_weight_by_date_range";
export const MEASUREMENT_ID_SOURCES = "get_body_measurements";
