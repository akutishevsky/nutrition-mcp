import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withAnalytics } from "./analytics.js";
import type { MunchCapabilities } from "./billing/capabilities.js";
import { serializeFoodCandidate } from "./food-tools.js";
import { getFoodSearchService } from "./food-providers/service.js";
import {
    deleteSavedFood,
    listSavedFoods,
    markSavedFoodUsed,
    normalizeSavedFoodLabel,
    saveFood,
    searchRecentMealItems,
    searchSavedFoods,
    type RecentMealItemMemory,
    type SavedFoodRecord,
} from "./saved-foods/repository.js";

const savedFoodSchema = z.object({
    id: z.string(),
    label: z.string(),
    default_portion_id: z.string().nullable(),
    use_count: z.number(),
    last_used_at: z.string().nullable(),
    food: z.record(z.string(), z.unknown()),
});

const historySchema = z.object({
    meal_id: z.string(),
    item_id: z.string(),
    name: z.string(),
    portion_label: z.string().nullable(),
    nutrients: z.record(z.string(), z.number()),
    source_type: z.string(),
    provider: z.string().nullable(),
    provider_food_id: z.string().nullable(),
    confidence: z.number().nullable(),
    logged_at: z.string(),
});

function serializeSavedFood(record: SavedFoodRecord) {
    return {
        id: record.id,
        label: record.label,
        default_portion_id: record.defaultPortionId,
        use_count: record.useCount,
        last_used_at: record.lastUsedAt,
        food: serializeFoodCandidate(record.food),
    };
}

function serializeHistory(record: RecentMealItemMemory) {
    return {
        meal_id: record.mealId,
        item_id: record.itemId,
        name: record.name,
        portion_label: record.portionLabel,
        nutrients: record.nutrients,
        source_type: record.sourceType,
        provider: record.provider,
        provider_food_id: record.providerFoodId,
        confidence: record.confidence,
        logged_at: record.loggedAt,
    };
}

function formatSavedFood(record: SavedFoodRecord, index: number): string {
    const portion =
        record.food.portions.find(
            (candidate) => candidate.id === record.defaultPortionId,
        ) ?? record.food.portions[0];
    return `${index + 1}. ${record.label}\n   ${portion?.label ?? "No default portion"}${portion?.nutrients.calories == null ? "" : ` · ${portion.nutrients.calories} kcal`}\n   saved_food_id: ${record.id} · used ${record.useCount} times`;
}

async function assertSavedFoodCapacity(
    userId: string,
    label: string,
    capabilities: MunchCapabilities,
): Promise<void> {
    if (capabilities.savedFoodLimit === null) return;
    const existing = await listSavedFoods(
        userId,
        capabilities.savedFoodLimit + 1,
    );
    const normalized = normalizeSavedFoodLabel(label);
    const updatesExisting = existing.some(
        (record) => normalizeSavedFoodLabel(record.label) === normalized,
    );
    if (!updatesExisting && existing.length >= capabilities.savedFoodLimit) {
        throw new Error(
            `Saved food capacity reached (${capabilities.savedFoodLimit}). Existing foods can still be used, updated, or deleted.`,
        );
    }
}

export function registerSavedFoodTools(
    server: McpServer,
    userId: string,
    capabilities: MunchCapabilities,
): void {
    const toolServer = server as unknown as {
        registerTool: (
            name: string,
            config: unknown,
            handler: (...args: any[]) => unknown,
        ) => unknown;
    };
    toolServer.registerTool(
        "save_food",
        {
            title: "Save Food",
            description:
                "Save a verified candidate returned by search_foods as a personal reusable food. Confirm the label and default portion with the user first. The complete normalized source snapshot is retained so the saved food remains usable during provider outages.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: {
                candidate_id: z.string().min(3).max(300),
                label: z.string().min(1).max(200),
                default_portion_id: z.string().max(200).optional(),
            },
            outputSchema: {
                saved_food: savedFoodSchema,
            },
        },
        async ({ candidate_id, label, default_portion_id }) =>
            withAnalytics(
                "save_food",
                async () => {
                    await assertSavedFoodCapacity(userId, label, capabilities);
                    const candidate =
                        await getFoodSearchService().details(candidate_id);
                    if (!candidate) {
                        throw new Error(
                            "Food candidate is invalid or expired; run search_foods again",
                        );
                    }
                    const saved = await saveFood({
                        userId,
                        label,
                        food: candidate,
                        defaultPortionId: default_portion_id,
                    });
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Saved ${saved.label}. Use search_saved_foods when the user asks for this food or their usual version.`,
                            },
                        ],
                        structuredContent: {
                            saved_food: serializeSavedFood(saved),
                        },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "search_saved_foods",
        {
            title: "Search Personal Foods",
            description:
                "Search the user's saved foods and recent structured meal items. Use this before external search for phrases such as 'my usual', 'the yogurt I normally eat', or a food the user has logged before. Confirm the portion before logging.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                query: z.string().min(1).max(200),
                limit: z.coerce.number().int().min(1).max(25).optional(),
            },
            outputSchema: {
                query: z.string(),
                saved_foods: z.array(savedFoodSchema),
                recent_meal_items: z.array(historySchema),
            },
        },
        async ({ query, limit }) =>
            withAnalytics(
                "search_saved_foods",
                async () => {
                    const bounded = limit ?? 10;
                    const [saved, history] = await Promise.all([
                        searchSavedFoods(userId, query, bounded),
                        searchRecentMealItems(userId, query, bounded),
                    ]);
                    const sections: string[] = [];
                    if (saved.length > 0) {
                        sections.push(
                            `Saved foods:\n${saved.map(formatSavedFood).join("\n\n")}`,
                        );
                    }
                    if (history.length > 0) {
                        sections.push(
                            `Recent meal-item matches:\n${history
                                .map(
                                    (item, index) =>
                                        `${index + 1}. ${item.name}${item.portionLabel ? ` — ${item.portionLabel}` : ""}\n   logged ${item.loggedAt} · source ${item.sourceType}`,
                                )
                                .join("\n")}`,
                        );
                    }
                    return {
                        content: [
                            {
                                type: "text",
                                text:
                                    sections.join("\n\n") ||
                                    `No personal food matches found for "${query}".`,
                            },
                        ],
                        structuredContent: {
                            query,
                            saved_foods: saved.map(serializeSavedFood),
                            recent_meal_items: history.map(serializeHistory),
                        },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "list_saved_foods",
        {
            title: "List Saved Foods",
            description:
                "List the user's saved reusable foods, ordered by usage and recency.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                limit: z.coerce.number().int().min(1).max(200).optional(),
            },
            outputSchema: {
                saved_foods: z.array(savedFoodSchema),
            },
        },
        async ({ limit }) =>
            withAnalytics(
                "list_saved_foods",
                async () => {
                    const requestedLimit = limit ?? 50;
                    const effectiveLimit =
                        capabilities.savedFoodLimit === null
                            ? requestedLimit
                            : Math.min(
                                  requestedLimit,
                                  capabilities.savedFoodLimit,
                              );
                    const saved = await listSavedFoods(userId, effectiveLimit);
                    return {
                        content: [
                            {
                                type: "text",
                                text:
                                    saved.length === 0
                                        ? "No saved foods yet."
                                        : saved
                                              .map(formatSavedFood)
                                              .join("\n\n"),
                            },
                        ],
                        structuredContent: {
                            saved_foods: saved.map(serializeSavedFood),
                        },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "mark_saved_food_used",
        {
            title: "Mark Saved Food Used",
            description:
                "Record that a saved food was used after it has been selected for a confirmed meal. This improves future usual-food ranking. Do not call merely because the food appeared in search results.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: {
                saved_food_id: z.string().uuid(),
            },
            outputSchema: {
                updated: z.boolean(),
            },
        },
        async ({ saved_food_id }) =>
            withAnalytics(
                "mark_saved_food_used",
                async () => {
                    const updated = await markSavedFoodUsed(
                        userId,
                        saved_food_id,
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: updated
                                    ? "Saved food usage updated."
                                    : "Saved food was not found.",
                            },
                        ],
                        structuredContent: { updated },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "delete_saved_food",
        {
            title: "Delete Saved Food",
            description:
                "Delete one saved reusable food. This does not alter meals that already used its immutable snapshot.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                saved_food_id: z.string().uuid(),
                confirm: z.literal(true),
            },
            outputSchema: {
                deleted: z.boolean(),
            },
        },
        async ({ saved_food_id }) =>
            withAnalytics(
                "delete_saved_food",
                async () => {
                    const deleted = await deleteSavedFood(
                        userId,
                        saved_food_id,
                    );
                    return {
                        content: [
                            {
                                type: "text",
                                text: deleted
                                    ? "Saved food deleted. Existing meal history was unchanged."
                                    : "Saved food was not found.",
                            },
                        ],
                        structuredContent: { deleted },
                    };
                },
                { userId },
            ),
    );
}
