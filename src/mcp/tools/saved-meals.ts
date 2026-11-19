import { z } from "zod";
import {
    addedSugarError,
    addedSugarMissing,
    addedSugarMissingError,
} from "../../added-sugar.js";
import { withAnalytics } from "../../analytics.js";
import { ToolError } from "../../errors.js";
import {
    MAX_ITEM_AMOUNT,
    MAX_SAVED_MEALS_PER_USER,
    MAX_SERVINGS,
    applyItemChanges,
    assertMealTotals,
    formatItemsBlock,
    scaleItems,
    scaleTotals,
    sumItems,
    totalsSentWithItems,
    totalsWithItemsError,
    validateSavedMealName,
    type MealItemValues,
    type NutrientValues,
} from "../../meal-items.js";
import { MEAL_LISTING_MAX_CHARS, formatMealFull } from "../../meal-listing.js";
import { MEAL_TYPES } from "../../meal-types.js";
import {
    parseFoodRef,
    parseNutrientSources,
    parseSourceDetail,
    scaleSourceDetail,
    type NutrientSources,
    type SourceDetail,
} from "../../provenance.js";
import {
    SavedMealNameTaken,
    countSavedMeals,
    deleteSavedMeal,
    getMealById,
    getMealItems,
    getSavedMeals,
    insertMeal,
    isUuid,
    updateSavedMeal,
    type MealInput,
    type SavedMealInput,
    type SavedMealWithItems,
} from "../../supabase.js";
import {
    MAX_ALCOHOL_G,
    MAX_CAFFEINE_MG,
    MAX_CALORIES,
    MAX_MACRO_G,
    MAX_SAVED_MEAL_DESCRIPTION_CHARS,
    MAX_SODIUM_MG,
    MEAL_ID_SOURCES,
    MEAL_LOGGED_WIDGET_URI,
    SAVED_MEAL_ID_SOURCES,
} from "../constants.js";
import type { ToolContext } from "../context.js";
import {
    alcoholHiddenNote,
    itemSourcesNoteFor,
    notUuidText,
    savedMealBody,
    savedMealListing,
    savedMealNameTakenError,
    sourcesNoteFor,
    validateSavedMealDescription,
} from "../formatters.js";
import {
    addedSugarRequiredNow,
    buildMealProgress,
    checkedItemsWithSources,
    deriveFromItems,
    labelRow,
    loggedValuesOf,
    missingNutrientNoteFor,
    nutrientsFrom,
    refuseLabelsWithoutValues,
    refuseMealLevelRefsWithItems,
    resolveSavedMeal,
    resolveWriteTimestamp,
    savedMealWrite,
    totalsAsInput,
    writeSavedMealTotals,
} from "../helpers.js";
import {
    FOOD_REF_DESCRIPTION,
    FOOD_REF_INPUT,
    LOGGED_AT_FORMS_PLAIN,
    LOGGED_AT_OMITTED_PLAIN,
    MEAL_ITEM_INPUT,
    MEAL_PROGRESS_OUTPUT_SCHEMA,
    SAVE_MEAL_ITEMS_DESCRIPTION,
    UPDATE_SAVED_MEAL_ITEMS_DESCRIPTION,
    USER_STATED_INPUT,
    idempotencyKeyDescriptionPlain,
} from "../schemas.js";

export function registerSavedMealsTools(ctx: ToolContext): void {
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
                    .enum(MEAL_TYPES)
                    .optional()
                    .describe(
                        "The meal's place in the user's own day, as the user names it: breakfast, second_breakfast (a mid-morning meal), lunch, afternoon_snack, dinner (the main evening meal), supper (a later, lighter meal after dinner, including late-night eating), pre_workout, post_workout, or snack. The same clock time is a different meal in different cultures. This is the default log_saved_meal uses when it is not given a type.",
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
                sodium_mg: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_SODIUM_MG)
                    .optional()
                    .describe(
                        "Sodium per serving, in milligrams (sodium, not salt), as log_meal's sodium_mg. Optional; not measured when not sent.",
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
                    .enum(MEAL_TYPES)
                    .optional()
                    .describe(
                        "The meal's place in the user's own day, as the user names it: breakfast, second_breakfast (a mid-morning meal), lunch, afternoon_snack, dinner (the main evening meal), supper (a later, lighter meal after dinner, including late-night eating), pre_workout, post_workout, or snack. The same clock time is a different meal in different cultures. Omit to use the saved meal's default.",
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
        withWidgetPrefs(async (args) => {
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
        }),
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
                    .enum(MEAL_TYPES)
                    .optional()
                    .describe(
                        "The meal's place in the user's own day, as the user names it: breakfast, second_breakfast (a mid-morning meal), lunch, afternoon_snack, dinner (the main evening meal), supper (a later, lighter meal after dinner, including late-night eating), pre_workout, post_workout, or snack. The same clock time is a different meal in different cultures. Omit to keep the current default.",
                    ),
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
                sodium_mg: z.coerce
                    .number()
                    .min(0)
                    .max(MAX_SODIUM_MG)
                    .optional()
                    .describe(
                        "Sodium per serving, in milligrams (sodium, not salt). Optional; not measured when not sent.",
                    ),
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
}
