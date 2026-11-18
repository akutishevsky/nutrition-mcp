import { z } from "zod";
import {
    addedSugarError,
    addedSugarMissing,
    addedSugarMissingError,
} from "../../added-sugar.js";
import { withAnalytics } from "../../analytics.js";
import { ToolError } from "../../errors.js";
import {
    BULK_IMPORT_OUTPUT_SCHEMA,
    MAX_ROWS_PER_CALL,
    buildSummaryText,
    runImport,
    serializeImportResult,
    type BulkImportArgs,
} from "../../import.js";
import {
    totalsSentWithItems,
    totalsWithItemsError,
    type MealItemValues,
} from "../../meal-items.js";
import { formatMealFull, renderMealListing } from "../../meal-listing.js";
import { MEAL_TYPES } from "../../meal-types.js";
import {
    parseFoodRef,
    type NutrientSources,
    type SourceDetail,
} from "../../provenance.js";
import { saturatedAboveFatNote } from "../../saturated-fat.js";
import {
    formatMealSearchResults,
    formatSavedMealMatches,
} from "../../search.js";
import {
    countMealItems,
    countMeals,
    deleteMeal,
    existingIdempotencyKeys,
    existingMealIds,
    getCachedFoodRecord,
    getMealItems,
    getMealsByDate,
    getMealsInRange,
    getProfile,
    getUserTimezone,
    insertMeal,
    isUuid,
    localeFromProfile,
    replaceMealItems,
    searchMeals,
    searchSavedMeals,
    timezoneFromProfile,
    type Meal,
} from "../../supabase.js";
import { todayInTz } from "../../tz.js";
import {
    IMPORT_MEALS_WIDGET_URI,
    MAX_ALCOHOL_G,
    MAX_CAFFEINE_MG,
    MAX_CALORIES,
    MAX_MACRO_G,
    MAX_MEALS_PER_USER,
    MAX_SODIUM_MG,
    MEALS_RANGE_MAX_DAYS,
    MEAL_ID_SOURCES,
    MEAL_LOGGED_WIDGET_URI,
    NUTRIENT_COVERAGE,
} from "../constants.js";
import type { ToolContext } from "../context.js";
import {
    alcoholHiddenNote,
    itemSourcesNoteFor,
    notUuidText,
    sourcesNoteFor,
} from "../formatters.js";
import {
    addedSugarRequiredNow,
    assertCalendarDate,
    assertDateRange,
    buildMealProgress,
    checkedItemsWithSources,
    labelRow,
    loggedValuesOf,
    missingNutrientNoteFor,
    refuseLabelsWithoutValues,
    refuseMealLevelRefsWithItems,
    resolveWriteTimestamp,
    totalsAsInput,
    updatedAddedSugarError,
    writePlainMealUpdate,
} from "../helpers.js";
import {
    FOOD_REF_DESCRIPTION,
    FOOD_REF_INPUT,
    IMPORT_ROW_SCHEMA,
    LOGGED_AT_FORMS,
    LOGGED_AT_OMIT_IF_NOW,
    LOG_MEAL_ITEMS_DESCRIPTION,
    MEAL_DETAIL_FIELD,
    MEAL_ITEM_INPUT,
    MEAL_PROGRESS_OUTPUT_SCHEMA,
    START_IMPORT_OUTPUT_SCHEMA,
    UPDATE_MEAL_ITEMS_DESCRIPTION,
    USER_STATED_INPUT,
    idempotencyKeyDescription,
    startImportPayload,
} from "../schemas.js";

export function registerMealsTools(ctx: ToolContext): void {
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
                    .enum(MEAL_TYPES)
                    .describe(
                        "The meal's place in the user's own day, as the user names it: breakfast, second_breakfast (a mid-morning meal), lunch, afternoon_snack, dinner (the main evening meal), supper (a later, lighter meal after dinner, including late-night eating), pre_workout, post_workout, or snack. The same clock time is a different meal in different cultures.",
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
                sodium_mg: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_SODIUM_MG)
                    .optional()
                    .describe(
                        "Sodium in MILLIGRAMS: sodium, not salt (1 g of salt holds about 400 mg of sodium; a label giving salt in grams converts as salt g x 400). Optional, with a daily limit set in set_nutrition_goals. On an itemized meal it is all-or-none across the items: a list that gives it on some items and not others is refused. A missing value is stored as not measured and leaves that day out of the sodium average and limit. 0 is the correct value for a food with none.",
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
        withWidgetPrefs(async (args) => {
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
        }),
    );

    // UI resource for the import widget. Registered unconditionally, like every
    // other widget resource — only the tool's _meta.ui link is gated per user.

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
                    .enum(MEAL_TYPES)
                    .optional()
                    .describe(
                        "The meal's place in the user's own day, as the user names it: breakfast, second_breakfast (a mid-morning meal), lunch, afternoon_snack, dinner (the main evening meal), supper (a later, lighter meal after dinner, including late-night eating), pre_workout, post_workout, or snack. The same clock time is a different meal in different cultures. Omit to keep the stored type.",
                    ),
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
                sodium_mg: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_SODIUM_MG)
                    .optional()
                    .describe(
                        "Sodium in MILLIGRAMS: sodium, not salt (1 g of salt holds about 400 mg of sodium; a label giving salt in grams converts as salt g x 400). Optional, with a daily limit set in set_nutrition_goals. On an itemized meal it is all-or-none across the items: a list that gives it on some items and not others is refused. A missing value is stored as not measured and leaves that day out of the sodium average and limit. 0 is the correct value for a food with none.",
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
        withWidgetPrefs(
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
                            if (sent.length > 0)
                                throw totalsWithItemsError(sent);
                            refuseMealLevelRefsWithItems(foodRef, userStated);
                            itemsChecked =
                                await checkedItemsWithSources(rawItems);
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
                        const checkPairedSugar = (
                            stored: Meal | null,
                        ): void => {
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
        ),
    );
}
