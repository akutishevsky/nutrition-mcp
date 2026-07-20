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
    upsertProfile,
    getProfile,
    type Meal,
    type NutritionGoals,
    type WaterEntry,
    type WeightEntry,
} from "./supabase.js";
import { withAnalytics } from "./analytics.js";
import {
    todayInTz,
    validateTz,
    shiftLocalDate,
    dateInTz,
    validateLoggedAt,
} from "./tz.js";
import {
    buildDailyBuckets,
    computeTrends,
    computeMealPatterns,
    computeWeeklyDigest,
    computeWeightTrend,
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
import { exportMeals } from "./export.js";
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

// Sent to clients in the initialize response (SDK ServerOptions.instructions).
// Advisory — not every client surfaces it, so the enforcement rule ("interview
// the user one question at a time; never log from a photo until every open
// question is resolved") is repeated in log_meal's own description. Keep both
// in sync. Note this is guidance only: the client model decides whether to
// follow it, so the loop cannot be strictly enforced from here.
const SERVER_INSTRUCTIONS = `Nutrition tracking: meals, water, weight, goals, and trends, per-user with timezone support.

Photo-based meal logging — when the user sends a photo of food, follow these steps in order:
1. Pick the flow. A packaged product with a visible barcode: transcribe the digits printed under the barcode and call lookup_barcode. A plate, bowl, or prepared meal: continue below.
2. Identify each distinct dish or food item in the photo.
3. Estimate portions in household measures the user can verify at a glance — "a glass of", "a handful of", "a tablespoon of", "half the plate" — never grams or ounces (nobody can weigh food from a photo).
4. Call search_meals with a short keyword per dish, passing alternatives in both the conversation language and English (past logs may be in either). Past variations reveal ingredients invisible in the photo (raisins vs banana, milk vs water, added honey or oil). Offer them as options: "Is this the oatmeal with raisins like Monday, or with banana, or something else?"
5. Interview the user — this is a multi-turn conversation, not a single confirmation step. Build a checklist of every open question across all dishes: which variation each dish is (from step 4), how much of each the user actually ate, and any ingredient the photo cannot show (oil, butter, sugar, dressing, sauce, what a drink was made with). Then work through that checklist ONE question per message. Ask the single most impactful open question, wait for the answer, let it update your assumptions, and ask the next. Do NOT batch the whole checklist into one message and do NOT stop after the first answer — a single round-trip is not an interview.
6. Keep going until every item on the checklist is resolved. Before each question it helps to note what is already settled and what is still open ("Got it — oatmeal with raisins. Two things left: how much you ate, and whether there was honey"). When the checklist is empty, summarize the full meal as you understand it and ask for a final yes before logging. Never log straight from a photo, and never log while any checklist item is still open.
7. When logging, write the confirmed household-measure portions into the meal description itself (e.g. "Oatmeal (1 glass raw oats, 2 glasses milk) with banana and honey (1 tbsp)") so future search_meals results are self-describing.

Keep the interview proportional: a single obvious item with one known past variation may need only one question, while a full plate with several dishes usually needs several. If the user says to just log it or otherwise signals impatience, stop asking, state your remaining assumptions plainly, and log.

For "log my usual X" requests, use search_meals the same way: search, then interview to confirm the variation and the amount before logging.`;

interface DailyTotals {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    water_ml: number;
}

function sumMeals(meals: Meal[]): DailyTotals {
    const totals: DailyTotals = {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        water_ml: 0,
    };
    for (const m of meals) {
        totals.calories += m.calories ?? 0;
        totals.protein_g += m.protein_g ?? 0;
        totals.carbs_g += m.carbs_g ?? 0;
        totals.fat_g += m.fat_g ?? 0;
    }
    return totals;
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
const MEAL_BREAKDOWN_ITEM = z.object({
    description: z.string(),
    meal_type: z.string().nullable(),
    date: z.string().nullable(),
    calories: z.number(),
    protein_g: z.number(),
    carbs_g: z.number(),
    fat_g: z.number(),
});

function mealBreakdown(meals: Meal[], dateTz: string | null) {
    return meals.map((m) => ({
        description: m.description,
        meal_type: m.meal_type ?? null,
        date: dateTz ? dateInTz(m.logged_at, dateTz) : null,
        calories: Math.round(m.calories ?? 0),
        protein_g: Math.round((m.protein_g ?? 0) * 10) / 10,
        carbs_g: Math.round((m.carbs_g ?? 0) * 10) / 10,
        fat_g: Math.round((m.fat_g ?? 0) * 10) / 10,
    }));
}

// log_meal and update_meal share the same MCP Apps widget
// (public/widgets/meal-logged.html). Both declare this identical output shape
// and both build their payload via buildMealProgress() below, so the widget can
// render either result; `action` only changes the header wording.
const MEAL_PROGRESS_OUTPUT_SCHEMA = {
    action: z.enum(["logged", "updated"]),
    date: z.string(),
    logged_meal: z.object({
        description: z.string(),
        meal_type: z.string().nullable(),
        calories: z.number().nullable(),
        protein_g: z.number().nullable(),
        carbs_g: z.number().nullable(),
        fat_g: z.number().nullable(),
    }),
    has_goals: z.boolean(),
    goals: z
        .object({
            calories: z.number().nullable(),
            protein_g: z.number().nullable(),
            carbs_g: z.number().nullable(),
            fat_g: z.number().nullable(),
            water_ml: z.number().nullable(),
        })
        .nullable(),
    totals: z.object({
        calories: z.number(),
        protein_g: z.number(),
        carbs_g: z.number(),
        fat_g: z.number(),
        water_ml: z.number(),
    }),
    meals: z.array(MEAL_BREAKDOWN_ITEM),
};

// Compute the day's running totals vs goals for a meal that was just logged or
// updated, packaging both the model-facing progress text and the meal-logged
// widget's structuredContent. Shared by log_meal and update_meal so the two
// tools stay in lockstep.
async function buildMealProgress(
    userId: string,
    meal: Meal,
    action: "logged" | "updated",
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

    const progressSection = goals
        ? `\n\nDaily progress (${mealDate}):\n${formatProgress(totals, goals)}`
        : "\n\nNo nutrition goals set — use the set_nutrition_goals tool to track progress against daily targets.";

    const structuredContent = {
        action,
        date: mealDate,
        logged_meal: {
            description: meal.description,
            meal_type: meal.meal_type ?? null,
            calories: meal.calories ?? null,
            protein_g: meal.protein_g ?? null,
            carbs_g: meal.carbs_g ?? null,
            fat_g: meal.fat_g ?? null,
        },
        has_goals: goals != null,
        goals: goals
            ? {
                  calories: goals.daily_calories ?? null,
                  protein_g: goals.daily_protein_g ?? null,
                  carbs_g: goals.daily_carbs_g ?? null,
                  fat_g: goals.daily_fat_g ?? null,
                  water_ml: goals.daily_water_ml ?? null,
              }
            : null,
        totals: {
            calories: Math.round(totals.calories),
            protein_g: Math.round(totals.protein_g * 10) / 10,
            carbs_g: Math.round(totals.carbs_g * 10) / 10,
            fat_g: Math.round(totals.fat_g * 10) / 10,
            water_ml: totals.water_ml,
        },
        // Single day → label rows by meal type in the widget, not by date.
        meals: mealBreakdown(meals, null),
    };

    return { progressSection, structuredContent };
}

function formatGoalLine(
    label: string,
    unit: string,
    actual: number,
    target: number | null,
): string {
    if (target == null || target <= 0) {
        return `${label}: ${Math.round(actual * 10) / 10}${unit}`;
    }
    const pct = Math.round((actual / target) * 100);
    const delta = Math.round((target - actual) * 10) / 10;
    const deltaStr =
        delta > 0 ? `${delta}${unit} to go` : `${Math.abs(delta)}${unit} over`;
    return `${label}: ${Math.round(actual * 10) / 10} / ${target}${unit} (${pct}%, ${deltaStr})`;
}

function formatProgress(
    totals: DailyTotals,
    goals: NutritionGoals | null,
): string {
    const lines = [
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
        formatGoalLine(
            "Water",
            " ml",
            totals.water_ml,
            goals?.daily_water_ml ?? null,
        ),
    ];
    return lines.join("\n");
}

function formatGoals(
    goals: NutritionGoals | null,
    weightUnit: WeightUnit = "kg",
): string {
    if (!goals) {
        return "No nutrition goals set. Use set_nutrition_goals to define daily targets.";
    }
    const parts: string[] = ["Current daily goals:"];
    parts.push(
        `- Calories: ${goals.daily_calories != null ? `${goals.daily_calories} kcal` : "not set"}`,
    );
    parts.push(
        `- Protein: ${goals.daily_protein_g != null ? `${goals.daily_protein_g}g` : "not set"}`,
    );
    parts.push(
        `- Carbs: ${goals.daily_carbs_g != null ? `${goals.daily_carbs_g}g` : "not set"}`,
    );
    parts.push(
        `- Fat: ${goals.daily_fat_g != null ? `${goals.daily_fat_g}g` : "not set"}`,
    );
    parts.push(
        `- Water: ${goals.daily_water_ml != null ? `${goals.daily_water_ml} ml` : "not set"}`,
    );
    parts.push(
        `- Target weight: ${goals.target_weight_g != null ? formatWeight(goals.target_weight_g, weightUnit) : "not set"}`,
    );
    return parts.join("\n");
}

function formatWeightEntry(entry: WeightEntry, unit: WeightUnit): string {
    return `- ${formatWeight(entry.weight_g, unit)} at ${entry.logged_at}${entry.notes ? ` (${entry.notes})` : ""} [id: ${entry.id}]`;
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

function formatMeal(meal: Meal): string {
    const parts = [
        `ID: ${meal.id}`,
        `Time: ${meal.logged_at}`,
        meal.meal_type ? `Type: ${meal.meal_type}` : null,
        `Description: ${meal.description}`,
        meal.calories != null ? `Calories: ${meal.calories}` : null,
        meal.protein_g != null ? `Protein: ${meal.protein_g}g` : null,
        meal.carbs_g != null ? `Carbs: ${meal.carbs_g}g` : null,
        meal.fat_g != null ? `Fat: ${meal.fat_g}g` : null,
        meal.notes ? `Notes: ${meal.notes}` : null,
    ];
    return parts.filter(Boolean).join("\n");
}

function registerTools(
    server: McpServer,
    userId: string,
    widgetsEnabled: boolean,
) {
    // Link a tool to its widget only when this user has widgets enabled. Because
    // buildMcpServer registers tools per request, this makes widget display a
    // per-user setting: with widgets off, tools/list advertises no UI link, so
    // hosts render no widget. Spreads to nothing when disabled.
    const uiMeta = (resourceUri: string) =>
        widgetsEnabled ? { _meta: { ui: { resourceUri } } } : {};

    server.registerTool(
        "log_meal",
        {
            title: "Log Meal",
            description:
                "Log a meal entry with nutritional information. If the user doesn't specify the quantity or portion size, ask how much they ate before estimating calories and macros. When the user gives a barcode — typed, or read from a photo of the package (transcribe the digits printed under the barcode) — call lookup_barcode first to get verified nutritional data, then scale it to the amount eaten. Fall back to web search or estimation only when no product is found. Use web search for branded products when no barcode is available. When logging from a photo of a plated or prepared meal (no package/barcode): first identify each dish, estimate portions in household measures the user can eyeball (a glass of, a handful of, a tablespoon of — NOT grams), call search_meals to see how similar meals were logged before and to surface ingredients that may be invisible in the photo, then interview the user across multiple turns — one question per message, covering which variation each dish is, how much they ate, and photo-invisible ingredients (oil, sugar, sauce, what a drink was made with) — until nothing is left open. Do NOT call this tool after a single question-and-answer round; a lone confirmation is not enough. Only call it once every open question is resolved and the user has approved a full summary of the meal (or has told you to stop asking and just log it). Write the confirmed household-measure portions into the description itself (e.g. 'Oatmeal (1 glass raw oats, 2 glasses milk) with banana') so future searches are self-describing.",
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
                calories: z.coerce
                    .number()
                    .optional()
                    .describe("Total calories"),
                protein_g: z.coerce
                    .number()
                    .optional()
                    .describe("Protein in grams"),
                carbs_g: z.coerce
                    .number()
                    .optional()
                    .describe("Carbohydrates in grams"),
                fat_g: z.coerce.number().optional().describe("Fat in grams"),
                logged_at: z
                    .string()
                    .optional()
                    .describe(
                        "ISO 8601 timestamp (defaults to now). If you don't know the current date or time, ask the user before calling this tool.",
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
                    const { meal, deduplicated } = await insertMeal(
                        userId,
                        args,
                    );
                    const header = deduplicated
                        ? "Meal already logged (idempotent retry):"
                        : "Meal logged:";

                    const { progressSection, structuredContent } =
                        await buildMealProgress(userId, meal, "logged");

                    return {
                        content: [
                            {
                                type: "text",
                                text: `${header}\n${formatMeal(meal)}${progressSection}`,
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
        "lookup_barcode",
        {
            title: "Look Up Barcode",
            description:
                "Look up a packaged product's verified nutrition by barcode via Open Food Facts. Pass the barcode digits (EAN/UPC, 8–14 digits). The user can type them, or you can read them from a photo of the package — transcribe the human-readable digits printed beneath the barcode. Returns the product name, serving, and macros, which you can then pass to log_meal scaled to the amount eaten. If no product is found, fall back to web search or estimation.",
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
                            { type: "text", text: formatFoodResult(food) },
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
                    const text = meals.map(formatMeal).join("\n\n---\n\n");
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
                    const text = meals.map(formatMeal).join("\n\n---\n\n");
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
                            .map(formatMeal)
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
                "Search the user's past logged meals by keyword (case-insensitive match on description and notes), newest first, grouped into recurring variations with counts, last-logged date, and typical macros. Use this BEFORE logging a meal from a photo: past variations reveal ingredients that aren't visible in the picture (raisins vs banana, milk vs water, added honey or oil) — turn each difference between variations into a question for the user rather than picking one silently, and ask those questions one at a time across several turns instead of batching them. Also use it for requests like 'log my usual breakfast': search, interview the user to pin down the variation and the amount, then log_meal. Pass short food keywords, not full sentences, and include the food name in every language the user may have logged in — always add an English alternative alongside the conversation language, e.g. [\"вівсянка\", \"oatmeal\"].",
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
                "Get daily nutrition totals for a date range. Renders an interactive dashboard (macro tiles vs. goals and a per-day breakdown) in clients that support MCP Apps UI, and returns the same data as text elsewhere.",
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
                goals: z
                    .object({
                        calories: z.number().nullable(),
                        protein_g: z.number().nullable(),
                        carbs_g: z.number().nullable(),
                        fat_g: z.number().nullable(),
                        water_ml: z.number().nullable(),
                    })
                    .nullable(),
                averages: z.object({
                    calories: z.number(),
                    protein_g: z.number(),
                    carbs_g: z.number(),
                    fat_g: z.number(),
                    water_ml: z.number(),
                }),
                days: z.array(
                    z.object({
                        date: z.string(),
                        meal_count: z.number(),
                        calories: z.number(),
                        protein_g: z.number(),
                        carbs_g: z.number(),
                        fat_g: z.number(),
                        water_ml: z.number(),
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
                    const tz = await getUserTimezone(userId);
                    const [meals, water, goals] = await Promise.all([
                        getMealsInRange(userId, start_date, end_date, tz),
                        getWaterInRange(userId, start_date, end_date, tz),
                        getNutritionGoals(userId),
                    ]);

                    const goalsPayload = goals
                        ? {
                              calories: goals.daily_calories ?? null,
                              protein_g: goals.daily_protein_g ?? null,
                              carbs_g: goals.daily_carbs_g ?? null,
                              fat_g: goals.daily_fat_g ?? null,
                              water_ml: goals.daily_water_ml ?? null,
                          }
                        : null;

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
                                goals: goalsPayload,
                                averages: {
                                    calories: 0,
                                    protein_g: 0,
                                    carbs_g: 0,
                                    fat_g: 0,
                                    water_ml: 0,
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
                    const days: Array<{
                        date: string;
                        meal_count: number;
                        calories: number;
                        protein_g: number;
                        carbs_g: number;
                        fat_g: number;
                        water_ml: number;
                    }> = [];
                    const sum: DailyTotals = {
                        calories: 0,
                        protein_g: 0,
                        carbs_g: 0,
                        fat_g: 0,
                        water_ml: 0,
                    };
                    for (const [date, dateMeals] of [
                        ...byDate.entries(),
                    ].sort()) {
                        const totals = sumMeals(dateMeals);
                        totals.water_ml = waterByDate.get(date) ?? 0;
                        const header = `## ${date} (${dateMeals.length} meal${dateMeals.length === 1 ? "" : "s"})`;
                        sections.push(
                            `${header}\n${formatProgress(totals, goals)}`,
                        );
                        days.push({
                            date,
                            meal_count: dateMeals.length,
                            calories: Math.round(totals.calories),
                            protein_g: Math.round(totals.protein_g * 10) / 10,
                            carbs_g: Math.round(totals.carbs_g * 10) / 10,
                            fat_g: Math.round(totals.fat_g * 10) / 10,
                            water_ml: totals.water_ml,
                        });
                        sum.calories += totals.calories;
                        sum.protein_g += totals.protein_g;
                        sum.carbs_g += totals.carbs_g;
                        sum.fat_g += totals.fat_g;
                        sum.water_ml += totals.water_ml;
                    }

                    const n = days.length || 1;
                    const averages = {
                        calories: Math.round(sum.calories / n),
                        protein_g: Math.round((sum.protein_g / n) * 10) / 10,
                        carbs_g: Math.round((sum.carbs_g / n) * 10) / 10,
                        fat_g: Math.round((sum.fat_g / n) * 10) / 10,
                        water_ml: Math.round(sum.water_ml / n),
                    };

                    const footer = goals
                        ? ""
                        : "\n\n(Tip: set daily targets with set_nutrition_goals to see progress percentages.)";

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
                            goals: goalsPayload,
                            averages,
                            days,
                            // Multi-day range → tag each meal with its date.
                            meals: mealBreakdown(meals, tz),
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
                "Set the user's daily calorie and macro targets, and optionally a target body weight. Pass only the fields you want to update — omitted fields keep their previous value. Pass null explicitly to clear a target.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                daily_calories: z.coerce
                    .number()
                    .nullable()
                    .optional()
                    .describe("Daily calorie target (kcal). Null to clear."),
                daily_protein_g: z.coerce
                    .number()
                    .nullable()
                    .optional()
                    .describe("Daily protein target (grams). Null to clear."),
                daily_carbs_g: z.coerce
                    .number()
                    .nullable()
                    .optional()
                    .describe("Daily carbs target (grams). Null to clear."),
                daily_fat_g: z.coerce
                    .number()
                    .nullable()
                    .optional()
                    .describe("Daily fat target (grams). Null to clear."),
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
                        daily_water_ml:
                            args.daily_water_ml === undefined
                                ? (existing?.daily_water_ml ?? null)
                                : args.daily_water_ml,
                        target_weight_g,
                    };
                    const goals = await upsertNutritionGoals(userId, merged);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Goals updated.\n\n${formatGoals(goals, displayUnit)}`,
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
                                text: formatGoals(goals, unit ?? "kg"),
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
                "Get progress against daily nutrition goals for a specific date (defaults to today). Renders intake-vs-goal rings plus body-weight progress in clients that support MCP Apps UI, and returns the same data as text elsewhere.",
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
                goals: z
                    .object({
                        calories: z.number().nullable(),
                        protein_g: z.number().nullable(),
                        carbs_g: z.number().nullable(),
                        fat_g: z.number().nullable(),
                        water_ml: z.number().nullable(),
                    })
                    .nullable(),
                totals: z.object({
                    calories: z.number(),
                    protein_g: z.number(),
                    carbs_g: z.number(),
                    fat_g: z.number(),
                    water_ml: z.number(),
                }),
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
                    const header = `Progress for ${targetDate} (${meals.length} meal${meals.length === 1 ? "" : "s"}, ${water.length} water entr${water.length === 1 ? "y" : "ies"})`;
                    const body = formatProgress(totals, goals);

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
                    const goalsPayload = goals
                        ? {
                              calories: goals.daily_calories ?? null,
                              protein_g: goals.daily_protein_g ?? null,
                              carbs_g: goals.daily_carbs_g ?? null,
                              fat_g: goals.daily_fat_g ?? null,
                              water_ml: goals.daily_water_ml ?? null,
                          }
                        : null;
                    const totalsPayload = {
                        calories: Math.round(totals.calories),
                        protein_g: Math.round(totals.protein_g * 10) / 10,
                        carbs_g: Math.round(totals.carbs_g * 10) / 10,
                        fat_g: Math.round(totals.fat_g * 10) / 10,
                        water_ml: totals.water_ml,
                    };
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
                            meal_count: meals.length,
                            water_entries: water.length,
                            goals: goalsPayload,
                            totals: totalsPayload,
                            weight: weightPayload,
                            // Single day → label rows by meal type in the widget.
                            meals: mealBreakdown(meals, null),
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
                    await deleteMeal(userId, id);
                    return {
                        content: [
                            { type: "text", text: `Meal ${id} deleted.` },
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
            description: "Update fields of an existing meal entry",
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
                calories: z.coerce.number().optional(),
                protein_g: z.coerce.number().optional(),
                carbs_g: z.coerce.number().optional(),
                fat_g: z.coerce.number().optional(),
                logged_at: z.string().optional(),
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
                    const meal = await updateMeal(userId, id, fields);
                    const { progressSection, structuredContent } =
                        await buildMealProgress(userId, meal, "updated");
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Meal updated:\n${formatMeal(meal)}${progressSection}`,
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
                        "ISO 8601 timestamp (defaults to now). If you don't know the current date or time, ask the user before calling this tool.",
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
                    const { entry, deduplicated } = await insertWater(
                        userId,
                        args,
                    );
                    const prefix = deduplicated
                        ? "Already logged (idempotent retry)"
                        : "Water logged";
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${prefix}: ${entry.amount_ml} ml at ${entry.logged_at}${entry.notes ? ` (${entry.notes})` : ""}. ID: ${entry.id}`,
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
                    await deleteWater(userId, id);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Water entry ${id} deleted.`,
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
                        "ISO 8601 timestamp (defaults to now). If you don't know the current date or time, ask the user before calling this tool.",
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
                    if (args.logged_at !== undefined)
                        validateLoggedAt(args.logged_at, Date.now());
                    const unit = await resolveWriteWeightUnit(
                        userId,
                        args.unit,
                    );
                    const weight_g = toGrams(args.weight, unit);
                    assertPlausibleWeight(weight_g, unit);
                    const { entry, deduplicated } = await insertWeight(userId, {
                        weight_g,
                        logged_at: args.logged_at,
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
                                text: `${prefix}: ${formatWeight(entry.weight_g, unit)} at ${entry.logged_at}${entry.notes ? ` (${entry.notes})` : ""}. ID: ${entry.id}`,
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
                logged_at: z.string().optional().describe("ISO 8601 timestamp"),
                notes: z.string().optional(),
            },
        },
        async ({ id, weight, unit, logged_at, notes }) => {
            return withAnalytics(
                "update_weight",
                async () => {
                    if (logged_at !== undefined)
                        validateLoggedAt(logged_at, Date.now());
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
                    if (logged_at !== undefined) patch.logged_at = logged_at;
                    if (notes !== undefined) patch.notes = notes;
                    const entry = await updateWeight(userId, id, patch);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Weight updated:\n${formatWeightEntry(entry, displayUnit)}`,
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
        "get_trends",
        {
            title: "Get Trends",
            description:
                "Rolling 7/14/30-day averages, standard deviation, coefficient of variation, logging streaks, day-of-week breakdowns, and best/worst day for calories and each macro. Pre-aggregated so you can narrate findings to the user without doing arithmetic. Defaults to the last 30 days ending today.",
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
                goals: z
                    .object({
                        calories: z.number().nullable(),
                        protein_g: z.number().nullable(),
                        carbs_g: z.number().nullable(),
                        fat_g: z.number().nullable(),
                        water_ml: z.number().nullable(),
                    })
                    .nullable(),
                // Up to 30 days of daily series; the widget slices to 7/14/30.
                days: z.array(
                    z.object({
                        date: z.string(),
                        calories: z.number(),
                        protein_g: z.number(),
                        carbs_g: z.number(),
                        fat_g: z.number(),
                        water_ml: z.number(),
                    }),
                ),
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

                    const goalsPayload = goals
                        ? {
                              calories: goals.daily_calories ?? null,
                              protein_g: goals.daily_protein_g ?? null,
                              carbs_g: goals.daily_carbs_g ?? null,
                              fat_g: goals.daily_fat_g ?? null,
                              water_ml: goals.daily_water_ml ?? null,
                          }
                        : null;

                    return {
                        content: [
                            {
                                type: "text",
                                text: computeTrends(textBuckets, goals),
                            },
                        ],
                        structuredContent: {
                            end_date: endDate,
                            default_range: [7, 14, 30].includes(windowDays)
                                ? windowDays
                                : 30,
                            goals: goalsPayload,
                            days: seriesBuckets.map((b) => ({
                                date: b.date,
                                calories: Math.round(b.calories),
                                protein_g: Math.round(b.protein_g * 10) / 10,
                                carbs_g: Math.round(b.carbs_g * 10) / 10,
                                fat_g: Math.round(b.fat_g * 10) / 10,
                                water_ml: b.waterMl,
                            })),
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
                "Pre-aggregated behavioural patterns across the logged window: meal-type presence rates, breakfast effect (days with vs without), high-calorie-lunch effect, late-dinner effect, weekday vs weekend, and outlier days. Narrate findings conversationally to the user. Defaults to the last 30 days.",
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
                        text: computeWeeklyDigest(buckets, goals),
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
                "Set the user's IANA timezone (e.g. 'America/Los_Angeles', 'Europe/Berlin', 'Asia/Tokyo'). This controls which calendar day meals and water are grouped into — e.g. a meal logged at 11pm in LA counts on that LA day, not the next UTC day. If the user hasn't set one yet and logs a meal or asks about 'today', offer to set it.",
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
                    const profile = await upsertProfile(userId, { timezone });
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Timezone set to ${profile.timezone}. Local today is ${todayInTz(profile.timezone)}.`,
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
                "Get the user's configured IANA timezone. Returns UTC if no profile has been set.",
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
                    const profile = await getProfile(userId);
                    if (!profile) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: "No timezone set yet (defaulting to UTC). Call set_timezone to configure one so 'today' matches the user's local calendar day.",
                                },
                            ],
                        };
                    }
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Timezone: ${profile.timezone}. Local today is ${todayInTz(profile.timezone)}.`,
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
                { userId },
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
            version: "1.19.1",
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

    registerTools(server, userId, await getWidgetsEnabled(userId));
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
