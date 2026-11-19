import { z } from "zod";
import {
    MAX_ALCOHOL_G,
    MAX_CAFFEINE_MG,
    MAX_CALORIES,
    MAX_MACRO_G,
    MAX_ROWS_PER_CALL,
    MAX_SODIUM_MG,
} from "../import.js";
import { dayCarries, type DailyBucket } from "../insights.js";
import {
    MAX_ITEMS_PER_MEAL,
    MAX_ITEM_AMOUNT,
    MEAL_NUTRIENT_KEYS,
} from "../meal-items.js";
import { type AlcoholDisplay } from "../meal-listing.js";
import { type NutritionGoals } from "../supabase.js";
import { todayInTz } from "../tz.js";
import { MEAL_BREAKDOWN_ITEM, type DailyTotals } from "./totals.js";

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
export const DRINK_UNIT_FIELD = z.enum(["us", "uk"]).nullable();

export const DIGEST_NUTRIENTS_ITEM = z.object({
    calories: z.number().nullable(),
    protein_g: z.number().nullable(),
    carbs_g: z.number().nullable(),
    fat_g: z.number().nullable(),
    fiber_g: z.number().nullable(),
    sugar_g: z.number().nullable(),
    added_sugar_g: z.number().nullable(),
    saturated_fat_g: z.number().nullable(),
    trans_fat_g: z.number().nullable(),
    sodium_mg: z.number().nullable(),
    caffeine_mg: z.number().nullable(),
    alcohol_g: z.number().nullable(),
    water_ml: z.number().nullable(),
});

// log_meal and update_meal share the same MCP Apps widget
// (public/widgets/meal-logged.html). Both declare this identical output shape
// and both build their payload via buildMealProgress() below, so the widget can
// render either result; `action` only changes the header wording.
export const MEAL_PROGRESS_OUTPUT_SCHEMA = z.object({
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
    // Trans fat and sodium are optional here: no payload built from these
    // totals emits them.
    totals: Omit<DailyTotals, "trans_fat_g" | "sodium_mg"> &
        Partial<Pick<DailyTotals, "trans_fat_g" | "sodium_mg">>,
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

export const IMPORT_ROW_SCHEMA = z.object({
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
            "One of breakfast, second_breakfast, lunch, afternoon_snack, dinner, supper, pre_workout, post_workout or snack. Case-insensitive; unrecognized values become snack. Omit when the source has no meal column and it will be inferred from the time.",
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
    sodium_mg: z.coerce
        .number()
        .optional()
        .describe(
            "Sodium in MILLIGRAMS — sodium, not salt. Cronometer's 'Sodium (mg)' and MyFitnessPal's 'Sodium' columns are both mg and map straight across. A column of salt in grams is a different figure (sodium mg = salt g x 400). Omit when the source has no sodium column; a missing value is not measured, not zero.",
        ),
    notes: z
        .string()
        .optional()
        .describe(
            "Anything from the source worth keeping that has no column here (other micronutrients, the original row text).",
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

// Shared `logged_at` description for every manual write tool. The three forms
// and the "don't convert to UTC yourself" rule are the whole point: a model
// knows the wall-clock time the user just said, but not the zone's historical
// offset for that date, and guessing it lands the entry on the wrong day.
export const LOGGED_AT_FORMS =
    'Accepts a full ISO 8601 timestamp with an offset or Z ("2026-01-05T08:30:00+02:00"), an offset-less local time ("2026-01-05T08:30"), or a bare date ("2026-01-05", anchored at local noon). Offset-less values are resolved in the user\'s saved timezone, so pass the local time exactly as the user gives it and do NOT convert it to UTC yourself.';

// Descriptive variant for tools added after the directory review: same three
// forms, no imperative. The older tools move to it under #198.
export const LOGGED_AT_FORMS_PLAIN =
    'Accepts a full ISO 8601 timestamp with an offset or Z ("2026-01-05T08:30:00+02:00"), an offset-less local time ("2026-01-05T08:30"), or a bare date ("2026-01-05", anchored at local noon). Offset-less values are read as wall-clock time in the user\'s saved timezone, and the server works out that date\'s UTC offset itself, so the local time as the user states it is the expected form.';

// Appended to `logged_at` on the three "log it now" tools. This used to say
// "ask the user" — which fired on every single log from any host that keeps the
// wall clock out of the model's context (Claude Desktop among them), turning
// "I just ate X" into an interrogation, or worse a guessed time on the wrong
// day (issue #102). Omitting the field is strictly better than guessing: the
// server stamps `new Date()` and it genuinely knows the time.
export const LOGGED_AT_OMIT_IF_NOW =
    " The server knows the current time and the user's timezone, so there is no need to ask the user for it: for something that just happened, omit this field entirely and the server stamps the entry with the current time. Only supply it for an entry that happened at some other moment; get_current_time returns the user's local clock for working that moment out.";

// Descriptive counterpart of LOGGED_AT_OMIT_IF_NOW for tools added after the
// directory review: says what an omitted value means without telling the
// assistant what to do. The older tools move to it under #198.
export const LOGGED_AT_OMITTED_PLAIN =
    " Omitted, the server stamps the entry with the current time in the user's timezone; get_current_time returns the user's local clock.";

// Plural of the noun the idempotency descriptions name: "entries" for "entry",
// "meals" for "meal", and so on.
export function pluralOf(entry: string): string {
    return entry === "entry" ? "entries" : `${entry}s`;
}

// What the derived "auto:" key really guarantees: it hashes the RESOLVED
// logged_at, and an omitted logged_at resolves to the arrival instant (ms), so
// replaying a "just now" call is a NEW entry. Deliberately not fixed with a
// time bucket: that would silently merge two genuine identical entries (a
// duplicate is visible and deletable; a lost entry is not), and it would break
// the frozen auto: digest updatedMealIdempotencyKey recomputes.
export function idempotencyKeyDescription(
    entry: string,
    sameTimeAdvice: string,
): string {
    return (
        `Optional key that makes a retry safe. Without one, the server derives a key from the ${entry}'s content and its resolved logged_at: replaying a call that carries an explicit logged_at returns the original ${entry} instead of adding another, but a call that omits logged_at is stamped with the moment it arrives, so replaying it adds a new ${entry}. ` +
        `If a call that omits logged_at may need to be retried (for example after a timeout), pass any unique string here, such as a UUID, and send the same value on the retry. ` +
        `Two genuinely separate ${pluralOf(entry)} with identical content and the same logged_at are also treated as one — ${sameTimeAdvice}. Never reuse a key for a different ${entry}.`
    );
}

// Descriptive variant of idempotencyKeyDescription for tools added after the
// directory review: the same guarantees, stated as behaviour rather than as
// instructions to the assistant. The older tools move to it under #198.
export function idempotencyKeyDescriptionPlain(entry: string): string {
    return (
        `Optional key that makes a retry safe. Without one, the server derives a key from the ${entry}'s content and its resolved logged_at: replaying a call that carries an explicit logged_at returns the original ${entry} instead of adding another, but a call that omits logged_at is stamped with the moment it arrives, so replaying it adds a new ${entry}. ` +
        `A call that repeats an earlier key, such as a retry after a timeout, returns the ${entry} that key already recorded rather than adding another, so any unique string (a UUID, for example) serves. ` +
        `Two separate ${pluralOf(entry)} with identical content and the same logged_at are treated as one unless their logged_at values or keys differ, and a key repeated for a different ${entry} returns the earlier one instead of recording the new one.`
    );
}

// ---------- Ingredients and saved meals (src/meal-items.ts) ----------

// The item-list shape every items field shares; each tool adds what leaving
// items out means for it, since that differs (log_meal logs from the totals,
// the update tools keep the current items, save_meal keeps the totals).
export const ITEM_LIST_SHAPE = `1 to ${MAX_ITEMS_PER_MEAL} items. Each item carries its own amount and nutrients, and the totals are the sum of the items, so the totals fields are not sent alongside.`;
export const LOG_MEAL_ITEMS_DESCRIPTION = `The ingredients of this meal, ${ITEM_LIST_SHAPE} Without items the meal is logged from its totals.`;
export const UPDATE_MEAL_ITEMS_DESCRIPTION = `The meal's full ingredient list, replacing any items it has: ${ITEM_LIST_SHAPE} Without items the meal's current items stay as they are, and a meal that has items keeps totals equal to their sum.`;
export const SAVE_MEAL_ITEMS_DESCRIPTION = `The ingredients of one serving: ${ITEM_LIST_SHAPE} Without items the saved meal is kept from its totals per serving.`;
export const UPDATE_SAVED_MEAL_ITEMS_DESCRIPTION = `The saved meal's full ingredient list for one serving, replacing its items: ${ITEM_LIST_SHAPE} Without items the saved meal's current items stay as they are.`;

// Where the values came from (src/provenance.ts). A food_ref names the record a
// value was read from and the amount it is for; the server checks the stored
// record and labels each value itself. Only the shape is checked here: the
// bounds and the basis are checked in the handler (parseFoodRef), so a bad ref
// is a food_ref_invalid ToolError the caller can read, not a schema rejection.
export const FOOD_REF_INPUT = z.discriminatedUnion("source", [
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

export const FOOD_REF_DESCRIPTION =
    "The USDA or Open Food Facts record these values were read from, and the amount they are for. The server checks the values against the stored record: a value that matches it is labelled with that record, and any other value is labelled estimated.";

export const USER_STATED_DESCRIPTION =
    "Nutrient keys whose values the user gave themselves, read off a label or corrected by them. They are labelled as the user's own figures unless a food_ref record matches them.";

export const USER_STATED_INPUT = z
    .array(z.enum(MEAL_NUTRIENT_KEYS))
    .max(MEAL_NUTRIENT_KEYS.length)
    .optional()
    .describe(USER_STATED_DESCRIPTION);

// One ingredient. Every nutrient is optional in the schema; the handler names
// the item that lacks one (validateItems), so the caller sees which item to fix.
export const MEAL_ITEM_INPUT = z.object({
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
    sodium_mg: z.coerce
        .number()
        .min(0)
        .max(MAX_SODIUM_MG)
        .optional()
        .describe(
            "Sodium of this item in milligrams, as log_meal's sodium_mg. Give it on every item or on none.",
        ),
    food_ref: FOOD_REF_INPUT.optional().describe(
        `${FOOD_REF_DESCRIPTION} Give it on the item it describes.`,
    ),
    user_stated: USER_STATED_INPUT,
});

export type MealItemArg = z.infer<typeof MEAL_ITEM_INPUT>;
export type FoodRefArg = z.infer<typeof FOOD_REF_INPUT>;

export const MEAL_DETAIL_FIELD = z
    .enum(["compact", "full"])
    .optional()
    .describe(
        'How much to return per meal. "compact" (default): one line each — local time, type, description, calories and nutrients, and the id update_meal/delete_meal take. "full": every field on its own line, including notes. Use "full" only when you need the notes or the user asks for everything.',
    );
