import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withAnalytics } from "./analytics.js";
import {
    addMealDraftQuestion,
    answerMealDraftQuestion,
    cancelMealDraft,
    confirmMealDraft,
    createMealDraft,
    getMealDraft,
    prepareMealDraftConfirmation,
    updateMealDraftMetadata,
    upsertMealDraftItem,
    type MealDraft,
} from "./meal-drafts/index.js";

const nutrientInput = z.object({
    calories: z.coerce.number().min(0).optional(),
    protein_g: z.coerce.number().min(0).optional(),
    carbs_g: z.coerce.number().min(0).optional(),
    fat_g: z.coerce.number().min(0).optional(),
    fiber_g: z.coerce.number().min(0).optional(),
    sugar_g: z.coerce.number().min(0).optional(),
    alcohol_g: z.coerce.number().min(0).optional(),
    sodium_mg: z.coerce.number().min(0).optional(),
    saturated_fat_g: z.coerce.number().min(0).optional(),
    cholesterol_mg: z.coerce.number().min(0).optional(),
    potassium_mg: z.coerce.number().min(0).optional(),
});

const draftItemInput = z.object({
    name: z.string().min(1).max(500),
    quantity: z.coerce.number().positive().optional(),
    portion_label: z.string().max(500).optional(),
    gram_weight: z.coerce.number().positive().optional(),
    nutrients: nutrientInput,
    source_type: z.enum([
        "usda",
        "open_food_facts",
        "published_restaurant",
        "saved_food",
        "past_meal",
        "user_supplied",
        "model_estimate",
        "legacy_aggregate",
    ]),
    provider: z.string().max(100).optional(),
    provider_food_id: z.string().max(255).optional(),
    provider_revision: z.string().max(255).optional(),
    source_url: z.string().url().max(2_000).optional(),
    source_updated_at: z.string().optional(),
    confidence: z.coerce.number().min(0).max(1).optional(),
    assumptions: z.array(z.string().min(1).max(500)).max(20).optional(),
    source_snapshot: z.record(z.string(), z.unknown()).optional(),
});

function serializeDraft(draft: MealDraft) {
    return {
        id: draft.id,
        status: draft.status,
        source_mode: draft.sourceMode,
        meal_type: draft.mealType,
        description: draft.description,
        logged_at: draft.loggedAt,
        notes: draft.notes,
        version: draft.version,
        expires_at: draft.expiresAt,
        confirmed_meal_id: draft.confirmedMealId,
        items: draft.items.map((record) => ({
            id: record.id,
            position: record.position,
            ...record.item,
        })),
        questions: draft.questions.map((question) => ({
            id: question.id,
            item_id: question.itemId,
            question_key: question.questionKey,
            prompt: question.prompt,
            impact_score: question.impactScore,
            status: question.status,
            answer: question.answer,
        })),
        next_question:
            draft.questions.find((question) => question.status === "open") ??
            null,
    };
}

function draftSummary(draft: MealDraft): string {
    const open = draft.questions.filter(
        (question) => question.status === "open",
    );
    const lines = [
        `Draft ${draft.id} · status ${draft.status} · version ${draft.version}`,
        draft.description
            ? `Meal: ${draft.description}`
            : "Meal description not set",
        draft.mealType ? `Type: ${draft.mealType}` : "Meal type not set",
        `Items: ${draft.items.length} · Open questions: ${open.length}`,
    ];
    if (open[0])
        lines.push(`Next question: ${open[0].prompt} [id: ${open[0].id}]`);
    if (draft.confirmedMealId) {
        lines.push(`Confirmed meal ID: ${draft.confirmedMealId}`);
    }
    return lines.join("\n");
}

const DRAFT_OUTPUT = {
    draft: z.record(z.string(), z.unknown()),
};

export function registerMealDraftTools(
    server: McpServer,
    userId: string,
): void {
    // Keep the expensive MCP SDK schema generic out of the native compiler's
    // hot path; runtime registration and MCP integration tests still validate
    // the complete schemas.
    const toolServer = server as unknown as {
        registerTool: (
            name: string,
            config: unknown,
            handler: (...args: any[]) => unknown,
        ) => unknown;
    };
    toolServer.registerTool(
        "start_meal_draft",
        {
            title: "Start Meal Draft",
            description:
                "Start a server-tracked draft for a photo, ambiguous description, barcode selection, restaurant meal, saved food, or prior-history meal. Use this instead of log_meal whenever questions or confirmation are still needed.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: {
                source_mode: z.enum([
                    "text",
                    "photo",
                    "barcode",
                    "restaurant",
                    "saved_food",
                    "history",
                ]),
                meal_type: z
                    .enum(["breakfast", "lunch", "dinner", "snack"])
                    .optional(),
                description: z.string().max(2_000).optional(),
                logged_at: z.string().optional(),
                notes: z.string().max(4_000).optional(),
            },
            outputSchema: DRAFT_OUTPUT,
        },
        async (args) =>
            withAnalytics(
                "start_meal_draft",
                async () => {
                    const draft = await createMealDraft({
                        userId,
                        sourceMode: args.source_mode,
                        mealType: args.meal_type,
                        description: args.description,
                        loggedAt: args.logged_at,
                        notes: args.notes,
                    });
                    return {
                        content: [{ type: "text", text: draftSummary(draft) }],
                        structuredContent: { draft: serializeDraft(draft) },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "get_meal_draft",
        {
            title: "Get Meal Draft",
            description:
                "Read a current meal draft, including its version, items, resolved questions, and the highest-impact open question.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: { draft_id: z.string().uuid() },
            outputSchema: {
                found: z.boolean(),
                draft: z.record(z.string(), z.unknown()).nullable(),
            },
        },
        async ({ draft_id }) =>
            withAnalytics(
                "get_meal_draft",
                async () => {
                    const draft = await getMealDraft(userId, draft_id);
                    return {
                        content: [
                            {
                                type: "text",
                                text: draft
                                    ? draftSummary(draft)
                                    : "Meal draft was not found.",
                            },
                        ],
                        structuredContent: {
                            found: draft !== null,
                            draft: draft ? serializeDraft(draft) : null,
                        },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "update_meal_draft",
        {
            title: "Update Meal Draft",
            description:
                "Update the meal-level description, type, time, or notes. Pass the current expected_version; stale updates are rejected instead of overwriting newer answers.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                draft_id: z.string().uuid(),
                expected_version: z.coerce.number().int().positive(),
                meal_type: z
                    .enum(["breakfast", "lunch", "dinner", "snack"])
                    .nullable()
                    .optional(),
                description: z.string().max(2_000).nullable().optional(),
                logged_at: z.string().nullable().optional(),
                notes: z.string().max(4_000).nullable().optional(),
            },
            outputSchema: DRAFT_OUTPUT,
        },
        async (args) =>
            withAnalytics(
                "update_meal_draft",
                async () => {
                    const draft = await updateMealDraftMetadata({
                        userId,
                        draftId: args.draft_id,
                        expectedVersion: args.expected_version,
                        mealType: args.meal_type,
                        description: args.description,
                        loggedAt: args.logged_at,
                        notes: args.notes,
                    });
                    return {
                        content: [{ type: "text", text: draftSummary(draft) }],
                        structuredContent: { draft: serializeDraft(draft) },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "upsert_meal_draft_item",
        {
            title: "Add or Update Draft Item",
            description:
                "Add or replace one structured food item in a draft. Provider nutrition must be snapshotted here; model estimates must be labelled model_estimate and carry explicit assumptions.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                draft_id: z.string().uuid(),
                expected_version: z.coerce.number().int().positive(),
                position: z.coerce.number().int().min(0).max(99),
                item: draftItemInput,
            },
            outputSchema: DRAFT_OUTPUT,
        },
        async ({ draft_id, expected_version, position, item }) =>
            withAnalytics(
                "upsert_meal_draft_item",
                async () => {
                    const draft = await upsertMealDraftItem({
                        userId,
                        draftId: draft_id,
                        expectedVersion: expected_version,
                        position,
                        item: {
                            name: item.name,
                            quantity: item.quantity,
                            portionLabel: item.portion_label,
                            gramWeight: item.gram_weight,
                            nutrients: item.nutrients,
                            sourceType: item.source_type,
                            provider: item.provider,
                            providerFoodId: item.provider_food_id,
                            providerRevision: item.provider_revision,
                            sourceUrl: item.source_url,
                            sourceUpdatedAt: item.source_updated_at,
                            confidence: item.confidence,
                            assumptions: item.assumptions,
                            sourceSnapshot: item.source_snapshot,
                        },
                    });
                    return {
                        content: [{ type: "text", text: draftSummary(draft) }],
                        structuredContent: { draft: serializeDraft(draft) },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "add_meal_draft_question",
        {
            title: "Add Draft Question",
            description:
                "Add or update one unresolved question. Give higher impact_score to questions that materially change calories or item identity. Questions are returned one at a time in descending impact order.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                draft_id: z.string().uuid(),
                expected_version: z.coerce.number().int().positive(),
                question_key: z.string().min(1).max(200),
                prompt: z.string().min(1).max(1_000),
                impact_score: z.coerce
                    .number()
                    .int()
                    .min(0)
                    .max(100)
                    .optional(),
                item_id: z.string().uuid().optional(),
            },
            outputSchema: DRAFT_OUTPUT,
        },
        async (args) =>
            withAnalytics(
                "add_meal_draft_question",
                async () => {
                    const draft = await addMealDraftQuestion({
                        userId,
                        draftId: args.draft_id,
                        expectedVersion: args.expected_version,
                        questionKey: args.question_key,
                        prompt: args.prompt,
                        impactScore: args.impact_score,
                        itemId: args.item_id,
                    });
                    return {
                        content: [{ type: "text", text: draftSummary(draft) }],
                        structuredContent: { draft: serializeDraft(draft) },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "answer_meal_draft_question",
        {
            title: "Answer Draft Question",
            description:
                "Record the user's answer to one open draft question. Then inspect next_question and continue until none remain.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: {
                draft_id: z.string().uuid(),
                expected_version: z.coerce.number().int().positive(),
                question_id: z.string().uuid(),
                answer: z.string().min(1).max(2_000),
            },
            outputSchema: DRAFT_OUTPUT,
        },
        async (args) =>
            withAnalytics(
                "answer_meal_draft_question",
                async () => {
                    const draft = await answerMealDraftQuestion({
                        userId,
                        draftId: args.draft_id,
                        expectedVersion: args.expected_version,
                        questionId: args.question_id,
                        answer: args.answer,
                    });
                    return {
                        content: [{ type: "text", text: draftSummary(draft) }],
                        structuredContent: { draft: serializeDraft(draft) },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "prepare_meal_confirmation",
        {
            title: "Prepare Meal Confirmation",
            description:
                "Move a complete draft to final confirmation. This fails while questions remain unless the user explicitly instructed you to stop asking and accept the remaining assumptions.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: {
                draft_id: z.string().uuid(),
                expected_version: z.coerce.number().int().positive(),
                accept_remaining_assumptions: z.boolean().optional(),
            },
            outputSchema: DRAFT_OUTPUT,
        },
        async (args) =>
            withAnalytics(
                "prepare_meal_confirmation",
                async () => {
                    const draft = await prepareMealDraftConfirmation({
                        userId,
                        draftId: args.draft_id,
                        expectedVersion: args.expected_version,
                        acceptRemainingAssumptions:
                            args.accept_remaining_assumptions,
                    });
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${draftSummary(draft)}\n\nPresent the complete meal and assumptions to the user and obtain an explicit yes before calling confirm_meal_draft.`,
                            },
                        ],
                        structuredContent: { draft: serializeDraft(draft) },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "confirm_meal_draft",
        {
            title: "Confirm Meal Draft",
            description:
                "Permanently log a prepared draft after the user explicitly confirms the complete summary. The server rejects stale versions, unresolved questions, and drafts that were not prepared for confirmation.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                draft_id: z.string().uuid(),
                expected_version: z.coerce.number().int().positive(),
                confirmed: z.literal(true),
            },
            outputSchema: DRAFT_OUTPUT,
        },
        async (args) =>
            withAnalytics(
                "confirm_meal_draft",
                async () => {
                    const draft = await confirmMealDraft({
                        userId,
                        draftId: args.draft_id,
                        expectedVersion: args.expected_version,
                        confirmed: true,
                    });
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Meal confirmed and logged.\n${draftSummary(draft)}`,
                            },
                        ],
                        structuredContent: { draft: serializeDraft(draft) },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "cancel_meal_draft",
        {
            title: "Cancel Meal Draft",
            description:
                "Cancel an active meal draft without creating a meal record.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: {
                draft_id: z.string().uuid(),
                expected_version: z.coerce.number().int().positive(),
                confirm: z.literal(true),
            },
            outputSchema: DRAFT_OUTPUT,
        },
        async (args) =>
            withAnalytics(
                "cancel_meal_draft",
                async () => {
                    const draft = await cancelMealDraft({
                        userId,
                        draftId: args.draft_id,
                        expectedVersion: args.expected_version,
                    });
                    return {
                        content: [{ type: "text", text: draftSummary(draft) }],
                        structuredContent: { draft: serializeDraft(draft) },
                    };
                },
                { userId },
            ),
    );
}
