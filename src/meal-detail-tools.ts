import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withAnalytics } from "./analytics.js";
import { getNutritionProvenanceAnalysis } from "./nutrition-provenance.js";
import { getStructuredMeal } from "./structured-meals/repository.js";
import { widgetToolMeta } from "./openai-submission.js";
import { getUserTimezone } from "./storage.js";

const MEAL_LOGGED_WIDGET_URI = "ui://widget/meal-logged.html";
import { shiftLocalDate, todayInTz } from "./tz.js";

type ToolServer = {
    registerTool: (
        name: string,
        config: Record<string, unknown>,
        handler: (args: Record<string, any>) => Promise<any> | any,
    ) => unknown;
};

function nullable(value: number | undefined): number | null {
    return value ?? null;
}

function serializeItem(
    item: NonNullable<
        Awaited<ReturnType<typeof getStructuredMeal>>
    >["items"][number],
) {
    return {
        id: item.id,
        position: item.position,
        name: item.name,
        quantity: item.quantity,
        portion_label: item.portionLabel,
        gram_weight: item.gramWeight,
        nutrients: {
            calories: nullable(item.nutrients.calories),
            protein_g: nullable(item.nutrients.protein_g),
            carbs_g: nullable(item.nutrients.carbs_g),
            fat_g: nullable(item.nutrients.fat_g),
            fiber_g: nullable(item.nutrients.fiber_g),
            sugar_g: nullable(item.nutrients.sugar_g),
            alcohol_g: nullable(item.nutrients.alcohol_g),
            sodium_mg: nullable(item.nutrients.sodium_mg),
            saturated_fat_g: nullable(item.nutrients.saturated_fat_g),
            cholesterol_mg: nullable(item.nutrients.cholesterol_mg),
            potassium_mg: nullable(item.nutrients.potassium_mg),
        },
        source_type: item.sourceType,
        provider: item.provider,
        provider_food_id: item.providerFoodId,
        provider_revision: item.providerRevision,
        source_url: item.sourceUrl,
        source_updated_at: item.sourceUpdatedAt,
        confidence: item.confidence,
        assumptions: item.assumptions,
        source_snapshot: item.sourceSnapshot,
    };
}

function validDate(value: string): boolean {
    return (
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        Number.isFinite(Date.parse(`${value}T00:00:00Z`))
    );
}

function rangeDays(startDate: string, endDate: string): number {
    return (
        Math.floor(
            (Date.parse(`${endDate}T00:00:00Z`) -
                Date.parse(`${startDate}T00:00:00Z`)) /
                86_400_000,
        ) + 1
    );
}

const mealDetailsOutputSchema = {
    meal: z
        .object({
            id: z.string(),
            logged_at: z.string(),
            meal_type: z.string().nullable(),
            description: z.string(),
            calories: z.number().nullable(),
            protein_g: z.number().nullable(),
            carbs_g: z.number().nullable(),
            fat_g: z.number().nullable(),
            fiber_g: z.number().nullable(),
            sugar_g: z.number().nullable(),
            alcohol_g: z.number().nullable(),
            notes: z.string().nullable(),
            source_recipe_id: z.string().uuid().nullable(),
            source_recipe_revision_id: z.string().uuid().nullable(),
            source_planned_meal_id: z.string().uuid().nullable(),
            item_count: z.number(),
            items: z.array(
                z
                    .object({
                        id: z.string(),
                        position: z.number(),
                        name: z.string(),
                        quantity: z.number().nullable().optional(),
                        portion_label: z.string().nullable().optional(),
                        gram_weight: z.number().nullable().optional(),
                        nutrients: z
                            .object({
                                calories: z.number().nullable(),
                                protein_g: z.number().nullable(),
                                carbs_g: z.number().nullable(),
                                fat_g: z.number().nullable(),
                                fiber_g: z.number().nullable(),
                                sugar_g: z.number().nullable(),
                                alcohol_g: z.number().nullable(),
                                sodium_mg: z.number().nullable(),
                                saturated_fat_g: z.number().nullable(),
                                cholesterol_mg: z.number().nullable(),
                                potassium_mg: z.number().nullable(),
                            })
                            .passthrough(),
                        source_type: z.string(),
                        provider: z.string().nullable().optional(),
                        provider_food_id: z.string().nullable().optional(),
                        provider_revision: z.string().nullable().optional(),
                        source_url: z.string().nullable().optional(),
                        source_updated_at: z.string().nullable().optional(),
                        confidence: z.number().nullable().optional(),
                        assumptions: z.array(z.string()).nullable().optional(),
                        source_snapshot: z.unknown(),
                    })
                    .passthrough(),
            ),
            legacy_aggregate: z.boolean(),
        })
        .passthrough(),
};
const nutritionProvenanceOutputSchema = {
    start_date: z.string(),
    end_date: z.string(),
    timezone: z.string(),
    coverage: z
        .object({
            meal_count: z.number(),
            structured_meal_count: z.number(),
            legacy_meal_count: z.number(),
            item_count: z.number(),
            total_calories: z.number(),
            itemized_calories: z.number(),
            itemized_calorie_percent: z.number(),
        })
        .passthrough(),
    sources: z.array(
        z
            .object({
                source: z.string(),
                item_count: z.number(),
                calories: z.number(),
                percent_of_items: z.number(),
            })
            .passthrough(),
    ),
    confidence: z
        .object({
            recorded_item_count: z.number(),
            average: z.number().nullable(),
            high_confidence_item_count: z.number(),
            estimated_item_count: z.number(),
        })
        .passthrough(),
    contributors: z.record(
        z.string(),
        z.array(
            z
                .object({
                    meal_id: z.string(),
                    item_id: z.string(),
                    name: z.string(),
                    value: z.number(),
                    source: z.string(),
                    provider: z.string().nullable().optional(),
                })
                .passthrough(),
        ),
    ),
};

export function registerMealDetailTools(
    server: McpServer,
    userId: string,
    widgetsEnabled = true,
): void {
    const toolServer = server as unknown as ToolServer;
    // Both tools ride the meal-logged receipt surface (audit Fix 4):
    // get_meal_details in read mode, get_nutrition_provenance as its
    // fullscreen provenance section. UI meta only.
    const uiMeta = widgetsEnabled ? widgetToolMeta(MEAL_LOGGED_WIDGET_URI) : {};

    toolServer.registerTool(
        "get_meal_details",
        {
            title: "Get Meal Details",
            description:
                "Get one logged meal by ID with its item-level nutrition, portions, source provenance, provider identifiers, confidence, assumptions, and immutable source snapshots. Use this when the user asks where a meal's calories or macros came from. Legacy aggregate meals are returned explicitly without fabricated item details.",
            inputSchema: {
                meal_id: z.string().uuid().describe("UUID of the logged meal"),
            },
            outputSchema: mealDetailsOutputSchema,
            ...uiMeta,
            annotations: {
                title: "Get Meal Details",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async ({ meal_id }) =>
            withAnalytics(
                "get_meal_details",
                async () => {
                    const meal = await getStructuredMeal(userId, meal_id);
                    if (!meal) throw new Error("Meal not found");
                    const items = meal.items.map(serializeItem);
                    const structuredContent = {
                        meal: {
                            id: meal.id,
                            logged_at: meal.loggedAt,
                            meal_type: meal.mealType,
                            description: meal.description,
                            calories: meal.calories,
                            protein_g: meal.proteinG,
                            carbs_g: meal.carbsG,
                            fat_g: meal.fatG,
                            fiber_g: meal.fiberG,
                            sugar_g: meal.sugarG,
                            alcohol_g: meal.alcoholG,
                            notes: meal.notes,
                            source_recipe_id: meal.sourceRecipeId,
                            source_recipe_revision_id:
                                meal.sourceRecipeRevisionId,
                            source_planned_meal_id: meal.sourcePlannedMealId,
                            item_count: items.length,
                            items,
                            legacy_aggregate: items.length === 0,
                        },
                    };
                    const itemLines = items.length
                        ? items
                              .map(
                                  (item) =>
                                      `- ${item.name}${item.portion_label ? ` (${item.portion_label})` : ""}: ${item.nutrients.calories ?? "?"} kcal · source=${item.source_type}${item.provider ? `/${item.provider}` : ""}${item.confidence == null ? "" : ` · confidence=${item.confidence.toFixed(2)}`}`,
                              )
                              .join("\n")
                        : "Item-level details were not recorded for this legacy aggregate meal.";
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: `${meal.description}\nMeal ID: ${meal.id}\n${itemLines}`,
                            },
                        ],
                        structuredContent,
                    };
                },
                { userId },
                { meal_id },
            ),
    );

    toolServer.registerTool(
        "get_nutrition_provenance",
        {
            title: "Get Nutrition Provenance",
            description:
                "Analyze how the user's logged nutrition was sourced over a date range. Returns itemized coverage, provider/source mix, confidence coverage, estimate count, and the foods contributing most calories, protein, carbs, fat, fiber, sugar, and sodium. This is factual audit data, not dietary advice.",
            inputSchema: {
                start_date: z
                    .string()
                    .optional()
                    .describe(
                        "Start date YYYY-MM-DD; defaults to 29 days before the end date",
                    ),
                end_date: z
                    .string()
                    .optional()
                    .describe(
                        "End date YYYY-MM-DD; defaults to today in the user's timezone",
                    ),
            },
            outputSchema: nutritionProvenanceOutputSchema,
            ...uiMeta,
            annotations: {
                title: "Get Nutrition Provenance",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async ({ start_date, end_date }) => {
            const timezone = await getUserTimezone(userId);
            const resolvedEnd = end_date ?? todayInTz(timezone);
            const resolvedStart =
                start_date ?? shiftLocalDate(resolvedEnd, -29);
            if (!validDate(resolvedStart) || !validDate(resolvedEnd)) {
                throw new Error("Dates must use YYYY-MM-DD");
            }
            const days = rangeDays(resolvedStart, resolvedEnd);
            if (days < 1 || days > 366) {
                throw new Error(
                    "Provenance range must contain between 1 and 366 days",
                );
            }
            const analysis = await getNutritionProvenanceAnalysis(
                userId,
                resolvedStart,
                resolvedEnd,
                timezone,
            );
            const structuredContent = {
                start_date: resolvedStart,
                end_date: resolvedEnd,
                timezone,
                coverage: {
                    meal_count: analysis.coverage.mealCount,
                    structured_meal_count:
                        analysis.coverage.structuredMealCount,
                    legacy_meal_count: analysis.coverage.legacyMealCount,
                    item_count: analysis.coverage.itemCount,
                    total_calories: analysis.coverage.totalCalories,
                    itemized_calories: analysis.coverage.itemizedCalories,
                    itemized_calorie_percent:
                        analysis.coverage.itemizedCaloriePercent,
                },
                sources: analysis.sources.map((source) => ({
                    source: source.source,
                    item_count: source.itemCount,
                    calories: source.calories,
                    percent_of_items: source.percentOfItems,
                })),
                confidence: {
                    recorded_item_count: analysis.confidence.recordedItemCount,
                    average: analysis.confidence.average,
                    high_confidence_item_count:
                        analysis.confidence.highConfidenceItemCount,
                    estimated_item_count:
                        analysis.confidence.estimatedItemCount,
                },
                contributors: Object.fromEntries(
                    Object.entries(analysis.contributors).map(
                        ([nutrient, values]) => [
                            nutrient,
                            values.map((value) => ({
                                meal_id: value.mealId,
                                item_id: value.itemId,
                                name: value.name,
                                value: value.value,
                                source: value.source,
                                provider: value.provider,
                            })),
                        ],
                    ),
                ),
            };
            const sources = analysis.sources.length
                ? analysis.sources
                      .map((source) => `${source.source}: ${source.itemCount}`)
                      .join(", ")
                : "no structured items";
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `Nutrition provenance ${resolvedStart} to ${resolvedEnd}: ${analysis.coverage.itemizedCaloriePercent}% of logged calories are itemized across ${analysis.coverage.itemCount} food items. Structured meals: ${analysis.coverage.structuredMealCount}; legacy aggregate meals: ${analysis.coverage.legacyMealCount}. Sources — ${sources}. Model-estimated items: ${analysis.confidence.estimatedItemCount}.`,
                    },
                ],
                structuredContent,
            };
        },
    );
}
