import { z } from "zod";
import { resolveMunchCapabilities } from "./billing/capabilities.js";
import { withAnalytics } from "./analytics.js";
import {
    addCookUpdate,
    compareCooks,
    correctCookEvent,
    createCook,
    deleteCook,
    finishCook,
    getCook,
    logCookPortion,
    parseNaturalCookUpdate,
    prepareCookRecipeDraft,
    recordCookOutcome,
    reopenCook,
    repeatCook,
    saveCookAsRecipe,
    searchCooks,
    setPreferredCook,
    type CookEventInput,
    type CookMediaInput,
    type CookScope,
    updateCookDish,
} from "./cooks/repository.js";
import {
    normalizeCookMediaMimeType,
    validateCookMediaUpload,
    type CookMediaFailure,
} from "./cooks/media.js";
import { getWidgetHtml } from "./widgets.js";

const COOK_WIDGET_URI = "ui://widget/cook-summary.html";
const APP_UI_MIME_TYPE = "text/html;profile=mcp-app";
const COOK_WIDGET_METADATA = {
    ui: {
        prefersBorder: false,
        domain: "https://munch.business",
        csp: {
            connectDomains: [] as string[],
            resourceDomains: ["https://munch.business"],
        },
    },
    "openai/widgetPrefersBorder": false,
};

const fileInput = z.object({
    download_url: z.string().url(),
    file_id: z.string().min(1).max(500),
    mime_type: z.string().max(100).optional(),
    file_name: z.string().max(255).optional(),
    dish_id: z.string().uuid().optional(),
    event_id: z.string().uuid().optional(),
});

const eventInput = z.object({
    event_type: z.string().min(1).max(50),
    event_at: z.string().optional(),
    event_timezone: z.string().max(100).optional(),
    time_precision: z.enum(["exact", "approximate", "unknown"]).optional(),
    relative_phrase: z.string().max(500).nullable().optional(),
    setpoint_temperature: z.coerce
        .number()
        .min(-100)
        .max(2_000)
        .nullable()
        .optional(),
    setpoint_unit: z.enum(["F", "C"]).nullable().optional(),
    ambient_temperature: z.coerce
        .number()
        .min(-100)
        .max(2_000)
        .nullable()
        .optional(),
    ambient_unit: z.enum(["F", "C"]).nullable().optional(),
    internal_temperature: z.coerce
        .number()
        .min(-100)
        .max(2_000)
        .nullable()
        .optional(),
    internal_unit: z.enum(["F", "C"]).nullable().optional(),
    note: z.string().max(20_000).nullable().optional(),
    original_message: z.string().max(20_000).nullable().optional(),
    dish_id: z.string().uuid().nullable().optional(),
    idempotency_key: z.string().max(500).optional(),
    correction_of_event_id: z.string().uuid().nullable().optional(),
});

const dishInput = z.object({
    name: z.string().min(1).max(200),
    ingredient_or_cut: z.string().max(500).nullable().optional(),
    method: z.string().max(500).nullable().optional(),
    flavor: z.string().max(500).nullable().optional(),
    equipment: z.string().max(500).nullable().optional(),
    notes: z.string().max(20_000).nullable().optional(),
    actual_ingredients: z.array(z.unknown()).max(300).optional(),
    recipe_id: z.string().uuid().nullable().optional(),
    recipe_revision_id: z.string().uuid().nullable().optional(),
});

const characteristicsInput = z.record(z.string(), z.unknown()).optional();

const recipeIngredientInput = z.object({
    name: z.string().min(1).max(300),
    quantity: z.coerce.number().positive().optional(),
    unit: z.string().max(100).optional(),
    preparation: z.string().max(500).optional(),
    optional: z.boolean().optional(),
    gram_weight: z.coerce.number().positive().optional(),
    nutrients: z.record(z.string(), z.number().nonnegative()).optional(),
    provider: z.string().max(100).optional(),
    provider_food_id: z.string().max(255).optional(),
    source_type: z.enum([
        "usda",
        "open_food_facts",
        "published_restaurant",
        "saved_food",
        "past_meal",
        "user_supplied",
        "model_estimate",
    ]),
    source_url: z.string().url().max(2_000).optional(),
    confidence: z.coerce.number().min(0).max(1).optional(),
    source_snapshot: z.record(z.string(), z.unknown()).optional(),
});

const recipeInput = z.object({
    name: z.string().min(1).max(200),
    servings: z.coerce.number().positive(),
    description: z.string().max(20_000).optional(),
    instructions: z.array(z.string().max(4_000)).min(1).max(100),
    preparation_minutes: z.coerce.number().int().nonnegative().optional(),
    cooking_minutes: z.coerce.number().int().nonnegative().optional(),
    source_type: z.enum(["user_entered", "chatgpt_generated", "imported"]),
    source_title: z.string().max(500).optional(),
    source_url: z.string().url().max(2_000).optional(),
    ingredients: z.array(recipeIngredientInput).min(1).max(200),
});

const cookRecordSchema = z.record(z.string(), z.unknown());
const cookDetailSchema = z.object({
    cook: cookRecordSchema,
    dishes: z.array(cookRecordSchema),
    updates: z.array(cookRecordSchema),
    events: z.array(cookRecordSchema),
    outcomes: z.array(cookRecordSchema),
    media: z.array(cookRecordSchema),
});

type ToolServer = {
    registerTool: (
        name: string,
        config: Record<string, unknown>,
        handler: (args: Record<string, any>) => Promise<any> | any,
    ) => unknown;
    registerResource: (
        name: string,
        uri: string,
        config: Record<string, unknown>,
        handler: (uri: URL | string) => Promise<any> | any,
    ) => unknown;
};

function asScope(
    scope: "personal" | "household" | undefined,
    householdId?: string,
): CookScope {
    if (scope !== "household") return { type: "personal" };
    if (!householdId)
        throw new Error("Household cook requests need the connected household");
    return { type: "household", householdId };
}

function mapEvent(event: z.infer<typeof eventInput>): CookEventInput {
    return {
        eventType: event.event_type as CookEventInput["eventType"],
        eventAt: event.event_at,
        eventTimezone: event.event_timezone,
        timePrecision: event.time_precision,
        relativePhrase: event.relative_phrase,
        setpointTemperature: event.setpoint_temperature,
        setpointUnit: event.setpoint_unit,
        ambientTemperature: event.ambient_temperature,
        ambientUnit: event.ambient_unit,
        internalTemperature: event.internal_temperature,
        internalUnit: event.internal_unit,
        note: event.note,
        originalMessage: event.original_message,
        dishId: event.dish_id,
        idempotencyKey: event.idempotency_key,
        correctionOfEventId: event.correction_of_event_id,
    };
}

function mapDish(dish: z.infer<typeof dishInput>) {
    return {
        name: dish.name,
        ingredientOrCut: dish.ingredient_or_cut,
        method: dish.method,
        flavor: dish.flavor,
        equipment: dish.equipment,
        notes: dish.notes,
        actualIngredients: dish.actual_ingredients,
        recipeId: dish.recipe_id,
        recipeRevisionId: dish.recipe_revision_id,
    };
}

async function downloadFiles(
    files: z.infer<typeof fileInput>[] | undefined,
): Promise<{ photos: CookMediaInput[]; failures: CookMediaFailure[] }> {
    const photos: CookMediaInput[] = [];
    const failures: CookMediaFailure[] = [];
    for (const file of files ?? []) {
        try {
            const response = await fetch(file.download_url, {
                signal: AbortSignal.timeout(15_000),
            });
            if (!response.ok)
                throw new Error(`File download returned ${response.status}`);
            const contentLength = Number(
                response.headers.get("content-length") ?? 0,
            );
            if (contentLength > 8 * 1024 * 1024)
                throw new Error("Cook photo is too large (maximum 8 MB)");
            const bytes = new Uint8Array(await response.arrayBuffer());
            const mimeType = normalizeCookMediaMimeType(
                file.mime_type ||
                    response.headers.get("content-type") ||
                    undefined,
            );
            photos.push({
                ...validateCookMediaUpload({
                    bytes,
                    mimeType,
                    fileName: file.file_name,
                    openaiFileId: file.file_id,
                }),
                dishId: file.dish_id,
                eventId: file.event_id,
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Photo download failed";
            failures.push({
                fileName: file.file_name,
                code: /too large/i.test(message)
                    ? "too_large"
                    : /unsupported|must be/i.test(message)
                      ? "unsupported"
                      : "download_failed",
                message: `The photo was not saved: ${message}`,
            });
        }
    }
    return { photos, failures };
}

function detailText(detail: Awaited<ReturnType<typeof getCook>>): string {
    if (!detail) return "Cook not found.";
    const cook = detail.cook;
    return `${cook.title} · ${cook.cook_date} · ${cook.status}\n${detail.events.length} timeline event${detail.events.length === 1 ? "" : "s"} · ${detail.media.length} saved photo${detail.media.length === 1 ? "" : "s"}.`;
}

function widgetMeta(enabled: boolean) {
    return enabled
        ? {
              _meta: {
                  ui: {
                      resourceUri: COOK_WIDGET_URI,
                      visibility: ["model", "app"],
                  },
                  "openai/widgetAccessible": true,
              },
          }
        : {};
}

export function registerCookTools(
    server: unknown,
    userId: string,
    widgetsEnabled = true,
): void {
    const toolServer = server as ToolServer;
    toolServer.registerResource(
        "cook-summary-widget",
        COOK_WIDGET_URI,
        {
            title: "Cook History",
            description:
                "Compact cook history, timeline, result, and photo card.",
            mimeType: APP_UI_MIME_TYPE,
        },
        async (uri) => ({
            contents: [
                {
                    uri: typeof uri === "string" ? uri : uri.href,
                    mimeType: APP_UI_MIME_TYPE,
                    text: await getWidgetHtml("cook-summary"),
                    _meta: COOK_WIDGET_METADATA,
                },
            ],
        }),
    );

    toolServer.registerTool(
        "start_cook",
        {
            title: "Start Cook",
            description:
                "Create a persistent cooking occasion before, during, or after cooking. Use for explicit start/record instructions. Preserve the original message and submitted photos; do not log nutrition or deduct pantry inventory. A cook can contain multiple dishes. Questions or hypotheticals must not be converted into factual timeline events.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: {
                title: z.string().max(200).optional(),
                cook_date: z.string().optional(),
                timezone: z.string().max(100).optional(),
                started_at: z.string().optional(),
                scope: z.enum(["personal", "household"]).optional(),
                dishes: z.array(dishInput).max(20).optional(),
                message: z.string().max(20_000).optional(),
                events: z.array(eventInput).max(100).optional(),
                files: z.array(fileInput).max(8).optional(),
                request_id: z.string().max(500).optional(),
            },
            outputSchema: z.object({
                cook_id: z.string().uuid(),
                recorded: z.boolean(),
                media_failures: z.array(z.record(z.string(), z.unknown())),
                cook: cookDetailSchema,
            }),
            ...widgetMeta(widgetsEnabled),
            _meta: {
                ...(widgetMeta(widgetsEnabled)._meta ?? {}),
                "openai/fileParams": ["files"],
            },
        },
        async (args) =>
            withAnalytics(
                "start_cook",
                async () => {
                    const capabilities = await resolveMunchCapabilities(userId);
                    const householdId = capabilities.household?.householdId;
                    const timezone = args.timezone ?? "UTC";
                    const message =
                        typeof args.message === "string"
                            ? args.message
                            : undefined;
                    const parsed = message
                        ? parseNaturalCookUpdate(
                              message,
                              args.started_at ?? new Date().toISOString(),
                              timezone,
                          )
                        : null;
                    const files = await downloadFiles(args.files);
                    const dishes =
                        args.dishes?.map(mapDish) ??
                        (parsed?.suggestions.dish
                            ? [
                                  {
                                      name: parsed.suggestions.dish,
                                      method: parsed.suggestions.method,
                                      flavor: parsed.suggestions.flavor,
                                      equipment: parsed.suggestions.equipment,
                                      ingredientOrCut:
                                          parsed.suggestions.ingredientOrCut,
                                  },
                              ]
                            : undefined);
                    const result = await createCook(userId, {
                        title: args.title ?? parsed?.suggestions.dish,
                        cookDate: args.cook_date,
                        timezone,
                        startedAt: args.started_at,
                        scope: asScope(args.scope, householdId),
                        dishes,
                        message,
                        originalMessage: message,
                        events: args.events?.map(mapEvent) ?? parsed?.events,
                        photos: files.photos,
                        mediaFailures: files.failures,
                        idempotencyKey: args.request_id,
                        source: "mcp",
                    });
                    const detail = await getCook(userId, result.cookId);
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text:
                                    detailText(detail) +
                                    (files.failures.length
                                        ? `\n${files.failures.length} photo upload${files.failures.length === 1 ? "" : "s"} need retry.`
                                        : ""),
                            },
                        ],
                        structuredContent: {
                            cook_id: result.cookId,
                            recorded: true,
                            media_failures: files.failures,
                            cook: detail,
                        },
                    };
                },
                { userId },
                args,
            ),
    );

    toolServer.registerTool(
        "update_cook",
        {
            title: "Update Cook",
            description:
                "Append an original message, supported timeline events, and durable photos to an existing cook. Use the active cook context or an explicit cook_id. Record explicit observations without an extra confirmation cycle; advisory questions and hypotheticals are saved as context without factual events. Retries with the same request_id are safe.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: {
                cook_id: z.string().uuid(),
                message: z.string().max(20_000).optional(),
                dish_id: z.string().uuid().nullable().optional(),
                timezone: z.string().max(100).optional(),
                submitted_at: z.string().optional(),
                events: z.array(eventInput).max(100).optional(),
                files: z.array(fileInput).max(8).optional(),
                request_id: z.string().max(500).optional(),
            },
            outputSchema: z.object({
                update_id: z.string().uuid().nullable(),
                recorded: z.boolean(),
                media_failures: z.array(z.record(z.string(), z.unknown())),
                cook: cookDetailSchema,
            }),
            ...widgetMeta(widgetsEnabled),
            _meta: {
                ...(widgetMeta(widgetsEnabled)._meta ?? {}),
                "openai/fileParams": ["files"],
            },
        },
        async (args) =>
            withAnalytics(
                "update_cook",
                async () => {
                    const message =
                        typeof args.message === "string"
                            ? args.message
                            : undefined;
                    const timezone = args.timezone ?? "UTC";
                    const parsed =
                        message && !args.events
                            ? parseNaturalCookUpdate(
                                  message,
                                  args.submitted_at ?? new Date().toISOString(),
                                  timezone,
                              )
                            : null;
                    const files = await downloadFiles(args.files);
                    const update = await addCookUpdate(userId, args.cook_id, {
                        source: "mcp",
                        message,
                        dishId: args.dish_id,
                        timezone,
                        submittedAt: args.submitted_at,
                        events: args.events?.map(mapEvent) ?? parsed?.events,
                        photos: files.photos,
                        mediaFailures: files.failures,
                        idempotencyKey: args.request_id,
                    });
                    const detail = await getCook(userId, args.cook_id);
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: `${update.summary}\n${detailText(detail)}${files.failures.length ? `\n${files.failures.length} photo upload${files.failures.length === 1 ? "" : "s"} need retry.` : ""}`,
                            },
                        ],
                        structuredContent: {
                            update_id: update.updateId,
                            recorded: update.recorded,
                            media_failures: files.failures,
                            cook: detail,
                        },
                    };
                },
                { userId },
                args,
            ),
    );

    toolServer.registerTool(
        "update_cook_dish",
        {
            title: "Edit Cook Dish",
            description:
                "Edit one cook's suggested or user-entered dish labels, actual ingredients, and notes with optimistic cook versioning. This changes the cook record only; it does not change recipe history or log nutrition.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: {
                cook_id: z.string().uuid(),
                dish_id: z.string().uuid(),
                name: z.string().min(1).max(200).optional(),
                ingredient_or_cut: z.string().max(500).nullable().optional(),
                method: z.string().max(500).nullable().optional(),
                flavor: z.string().max(500).nullable().optional(),
                equipment: z.string().max(500).nullable().optional(),
                notes: z.string().max(20_000).nullable().optional(),
                actual_ingredients: z.array(z.unknown()).max(300).optional(),
                expected_version: z.coerce.number().int().positive().optional(),
            },
            outputSchema: z.object({
                dish: cookRecordSchema,
                cook: cookDetailSchema,
            }),
            ...widgetMeta(widgetsEnabled),
        },
        async (args) =>
            withAnalytics(
                "update_cook_dish",
                async () => {
                    const result = await updateCookDish(
                        userId,
                        args.cook_id,
                        args.dish_id,
                        {
                            name: args.name,
                            ingredientOrCut: args.ingredient_or_cut,
                            method: args.method,
                            flavor: args.flavor,
                            equipment: args.equipment,
                            notes: args.notes,
                            actualIngredients: args.actual_ingredients,
                            expectedVersion: args.expected_version,
                        },
                    );
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: "Cook dish details updated; recipe and nutrition history were unchanged.",
                            },
                        ],
                        structuredContent: {
                            dish: result.dish,
                            cook: await getCook(userId, args.cook_id),
                        },
                    };
                },
                { userId },
                args,
            ),
    );

    toolServer.registerTool(
        "get_cook",
        {
            title: "Get Cook",
            description:
                "Return one persistent cook with its actual dishes, original updates, editable timeline, user-authored outcomes, and durable photo URLs. Works independently of recipes and nutrition logs.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: { cook_id: z.string().uuid() },
            outputSchema: cookDetailSchema,
            ...widgetMeta(widgetsEnabled),
        },
        async ({ cook_id }) =>
            withAnalytics(
                "get_cook",
                async () => {
                    const detail = await getCook(userId, cook_id);
                    if (!detail) throw new Error("Cook not found");
                    return {
                        content: [
                            { type: "text" as const, text: detailText(detail) },
                        ],
                        structuredContent: detail,
                    };
                },
                { userId },
                { cook_id },
            ),
    );

    toolServer.registerTool(
        "correct_cook_event",
        {
            title: "Correct Cook Event",
            description:
                "Correct one existing cook-timeline event using its current version. Preserve the correction relationship and event time; this changes the timeline only and never logs nutrition or pantry usage.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: {
                cook_id: z.string().uuid(),
                event_id: z.string().uuid(),
                expected_version: z.coerce.number().int().positive(),
                event: eventInput,
            },
            outputSchema: z.object({
                event: cookRecordSchema,
                cook: cookDetailSchema,
            }),
            ...widgetMeta(widgetsEnabled),
        },
        async (args) =>
            withAnalytics(
                "correct_cook_event",
                async () => {
                    const event = await correctCookEvent(
                        userId,
                        args.cook_id,
                        args.event_id,
                        mapEvent(args.event),
                        args.expected_version,
                    );
                    const detail = await getCook(userId, args.cook_id);
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: "Cook timeline event corrected.",
                            },
                        ],
                        structuredContent: { event, cook: detail },
                    };
                },
                { userId },
                args,
            ),
    );

    toolServer.registerTool(
        "search_cooks",
        {
            title: "Search Cooks",
            description:
                "Search cook history directly by dish, method, flavor, date, original messages, timeline notes, and results. Use this for historical recall even when no recipe exists.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                query: z.string().max(500).optional(),
                dish: z.string().max(200).optional(),
                method: z.string().max(200).optional(),
                flavor: z.string().max(200).optional(),
                date_from: z.string().optional(),
                date_to: z.string().optional(),
                status: z.enum(["active", "finished", "all"]).optional(),
                limit: z.coerce.number().int().min(1).max(50).optional(),
            },
            outputSchema: z.object({ cooks: z.array(cookRecordSchema) }),
            ...widgetMeta(widgetsEnabled),
        },
        async (args) =>
            withAnalytics(
                "search_cooks",
                async () => {
                    const cooks = await searchCooks(userId, {
                        query: args.query,
                        dish: args.dish,
                        method: args.method,
                        flavor: args.flavor,
                        dateFrom: args.date_from,
                        dateTo: args.date_to,
                        status: args.status,
                        limit: args.limit,
                    });
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: cooks.length
                                    ? cooks
                                          .map(
                                              (cook) =>
                                                  `${cook.title} · ${cook.cook_date} · ${cook.status}`,
                                          )
                                          .join("\n")
                                    : "No matching cooks found.",
                            },
                        ],
                        structuredContent: { cooks },
                    };
                },
                { userId },
                args,
            ),
    );

    toolServer.registerTool(
        "finish_cook",
        {
            title: "Finish Cook",
            description:
                "Mark a cook finished without logging consumption or changing pantry inventory.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                cook_id: z.string().uuid(),
                expected_version: z.coerce.number().int().positive().optional(),
            },
            outputSchema: z.object({ cook: cookRecordSchema }),
            ...widgetMeta(widgetsEnabled),
        },
        async (args) =>
            withAnalytics(
                "finish_cook",
                async () => ({
                    content: [
                        { type: "text" as const, text: "Cook finished." },
                    ],
                    structuredContent: {
                        cook: await finishCook(
                            userId,
                            args.cook_id,
                            args.expected_version,
                        ),
                    },
                }),
                { userId },
                args,
            ),
    );

    toolServer.registerTool(
        "reopen_cook",
        {
            title: "Reopen Cook",
            description:
                "Reopen a finished cook for correction or additional updates.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                cook_id: z.string().uuid(),
                expected_version: z.coerce.number().int().positive().optional(),
            },
            outputSchema: z.object({ cook: cookRecordSchema }),
        },
        async (args) =>
            withAnalytics(
                "reopen_cook",
                async () => ({
                    content: [
                        { type: "text" as const, text: "Cook reopened." },
                    ],
                    structuredContent: {
                        cook: await reopenCook(
                            userId,
                            args.cook_id,
                            args.expected_version,
                        ),
                    },
                }),
                { userId },
                args,
            ),
    );

    toolServer.registerTool(
        "delete_cook",
        {
            title: "Delete Cook",
            description:
                "Permanently delete one cook, its timeline, outcomes, and retained photos after explicit user confirmation.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                cook_id: z.string().uuid(),
                confirm: z.literal(true),
            },
            outputSchema: z.object({ deleted: z.boolean() }),
        },
        async (args) =>
            withAnalytics(
                "delete_cook",
                async () => {
                    const deleted = await deleteCook(userId, args.cook_id);
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: deleted
                                    ? "Cook deleted."
                                    : "Cook was already deleted.",
                            },
                        ],
                        structuredContent: { deleted },
                    };
                },
                { userId },
                args,
            ),
    );

    toolServer.registerTool(
        "repeat_cook",
        {
            title: "Cook Again",
            description:
                "Create a fresh cook based explicitly on a prior attempt. Carry forward setup labels and next-time notes, but never copy prior actual events, results, or photos as if they happened again.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                cook_id: z.string().uuid(),
                request_id: z.string().max(500).optional(),
            },
            outputSchema: z.object({
                cook_id: z.string().uuid(),
                source_cook_id: z.string().uuid(),
                cook: cookDetailSchema,
            }),
            ...widgetMeta(widgetsEnabled),
        },
        async (args) =>
            withAnalytics(
                "repeat_cook",
                async () => {
                    const result = await repeatCook(
                        userId,
                        args.cook_id,
                        args.request_id,
                    );
                    const detail = await getCook(userId, result.cookId);
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: `Fresh cook created from ${args.cook_id}.`,
                            },
                        ],
                        structuredContent: {
                            cook_id: result.cookId,
                            source_cook_id: args.cook_id,
                            cook: detail,
                        },
                    };
                },
                { userId },
                args,
            ),
    );

    toolServer.registerTool(
        "record_cook_result",
        {
            title: "Record Cook Result",
            description:
                "Save the user's written feedback, assessment, flavor/smoke/tenderness/juiciness/crispness/browning/bark characteristics, what worked, disappointments, and next-time notes. Stronger intensity is a preference, not an automatic better score. Keep AI suggestions separate from user observations.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: false,
                openWorldHint: false,
            },
            inputSchema: {
                cook_id: z.string().uuid(),
                dish_id: z.string().uuid().nullable().optional(),
                written_feedback: z.string().max(20_000).nullable().optional(),
                overall_assessment: z.coerce
                    .number()
                    .min(1)
                    .max(5)
                    .nullable()
                    .optional(),
                characteristics: characteristicsInput,
                worked: z.string().max(10_000).nullable().optional(),
                disappointed: z.string().max(10_000).nullable().optional(),
                next_time_notes: z.string().max(10_000).nullable().optional(),
                ai_suggestions: z.array(z.unknown()).max(50).optional(),
                is_preferred: z.boolean().optional(),
                expected_version: z.coerce.number().int().positive().optional(),
            },
            outputSchema: z.object({
                outcome: cookRecordSchema,
                cook: cookDetailSchema,
            }),
            ...widgetMeta(widgetsEnabled),
        },
        async (args) =>
            withAnalytics(
                "record_cook_result",
                async () => {
                    const outcome = await recordCookOutcome(
                        userId,
                        args.cook_id,
                        {
                            dishId: args.dish_id,
                            writtenFeedback: args.written_feedback,
                            overallAssessment: args.overall_assessment,
                            characteristics: args.characteristics,
                            worked: args.worked,
                            disappointed: args.disappointed,
                            nextTimeNotes: args.next_time_notes,
                            aiSuggestions: args.ai_suggestions,
                            isPreferred: args.is_preferred,
                            expectedVersion: args.expected_version,
                        },
                    );
                    const detail = await getCook(userId, args.cook_id);
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: "Cook result saved.",
                            },
                        ],
                        structuredContent: { outcome, cook: detail },
                    };
                },
                { userId },
                args,
            ),
    );

    toolServer.registerTool(
        "compare_cooks",
        {
            title: "Compare Cooks",
            description:
                "Compare selected attempts side by side by setup, timeline, photos, and outcomes; use set_preferred_cook when the user chooses a preferred attempt.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: { cook_ids: z.array(z.string().uuid()).min(2).max(5) },
            outputSchema: z.object({
                comparison: z.record(z.string(), z.unknown()),
            }),
            ...widgetMeta(widgetsEnabled),
        },
        async (args) =>
            withAnalytics(
                "compare_cooks",
                async () => {
                    const comparison = await compareCooks(
                        userId,
                        args.cook_ids,
                    );
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: `Compared ${args.cook_ids.length} cooks.`,
                            },
                        ],
                        structuredContent: { comparison },
                    };
                },
                { userId },
                args,
            ),
    );

    toolServer.registerTool(
        "set_preferred_cook",
        {
            title: "Choose Preferred Cook",
            description:
                "Mark one completed attempt as preferred after the user explicitly chooses it.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: { cook_id: z.string().uuid() },
            outputSchema: z.object({
                cook_id: z.string().uuid(),
                preferred: z.boolean(),
            }),
        },
        async (args) =>
            withAnalytics(
                "set_preferred_cook",
                async () => ({
                    content: [
                        {
                            type: "text" as const,
                            text: "Preferred attempt updated.",
                        },
                    ],
                    structuredContent: await setPreferredCook(
                        userId,
                        args.cook_id,
                    ),
                }),
                { userId },
                args,
            ),
    );

    toolServer.registerTool(
        "prepare_cook_recipe_draft",
        {
            title: "Prepare Cook Recipe Draft",
            description:
                "Build a reviewable recipe draft from a selected cook or dish without changing the source cook. Resolve missing actual ingredients or instructions before saving.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                cook_id: z.string().uuid(),
                dish_id: z.string().uuid().optional(),
            },
            outputSchema: z.object({
                draft: z.record(z.string(), z.unknown()),
            }),
            ...widgetMeta(widgetsEnabled),
        },
        async (args) =>
            withAnalytics(
                "prepare_cook_recipe_draft",
                async () => ({
                    content: [
                        {
                            type: "text" as const,
                            text: "Recipe draft prepared for review; the cook history is unchanged.",
                        },
                    ],
                    structuredContent: {
                        draft: await prepareCookRecipeDraft(
                            userId,
                            args.cook_id,
                            args.dish_id,
                        ),
                    },
                }),
                { userId },
                args,
            ),
    );

    toolServer.registerTool(
        "save_cook_as_recipe",
        {
            title: "Save Cook as Recipe",
            description:
                "Save a reviewed cook or dish as a new recipe using the existing immutable recipe revision and nutrition-resolution pipeline. Preserve the source cook and link the exact saved revision back to its dish. This does not log a meal or deduct pantry inventory.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                cook_id: z.string().uuid(),
                dish_id: z.string().uuid().optional(),
                scope: z.enum(["personal", "household"]).optional(),
                recipe: recipeInput,
                request_id: z.string().max(500).optional(),
            },
            outputSchema: z.object({
                result: z.record(z.string(), z.unknown()),
                source_cook_id: z.string().uuid(),
                source_dish_id: z.string().uuid(),
            }),
            ...widgetMeta(widgetsEnabled),
        },
        async (args) =>
            withAnalytics(
                "save_cook_as_recipe",
                async () => {
                    const capabilities = await resolveMunchCapabilities(userId);
                    const scope = asScope(
                        args.scope,
                        capabilities.household?.householdId,
                    );
                    const result = await saveCookAsRecipe({
                        userId,
                        cookId: args.cook_id,
                        dishId: args.dish_id,
                        scope:
                            scope.type === "personal"
                                ? { type: "personal" }
                                : {
                                      type: "household",
                                      householdId: scope.householdId,
                                  },
                        recipe: {
                            name: args.recipe.name,
                            servings: args.recipe.servings,
                            description: args.recipe.description,
                            instructions: args.recipe.instructions,
                            preparationMinutes: args.recipe.preparation_minutes,
                            cookingMinutes: args.recipe.cooking_minutes,
                            sourceType: args.recipe.source_type,
                            sourceTitle: args.recipe.source_title,
                            sourceUrl: args.recipe.source_url,
                            ingredients: args.recipe.ingredients.map(
                                (
                                    ingredient: z.infer<
                                        typeof recipeIngredientInput
                                    >,
                                ) => ({
                                    name: ingredient.name,
                                    quantity: ingredient.quantity,
                                    unit: ingredient.unit,
                                    preparation: ingredient.preparation,
                                    optional: ingredient.optional,
                                    gramWeight: ingredient.gram_weight,
                                    nutrients: ingredient.nutrients,
                                    provider: ingredient.provider,
                                    providerFoodId: ingredient.provider_food_id,
                                    sourceType: ingredient.source_type,
                                    sourceUrl: ingredient.source_url,
                                    confidence: ingredient.confidence,
                                    sourceSnapshot: ingredient.source_snapshot,
                                }),
                            ),
                        },
                        idempotencyKey: args.request_id,
                    });
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: `Recipe saved at revision ${result.result.revisionId}; the source cook remains available.`,
                            },
                        ],
                        structuredContent: result,
                    };
                },
                { userId },
                args,
            ),
    );

    toolServer.registerTool(
        "log_cook_portion",
        {
            title: "Log Cook Portion",
            description:
                "Log an explicitly eaten portion from a cook only when its dish is linked to an exact saved recipe revision. This is optional and never happens when a cook is created or finished; it uses the saved revision's resolved ingredients and prevents duplicate retries.",
            annotations: {
                readOnlyHint: false,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
            inputSchema: {
                cook_id: z.string().uuid(),
                dish_id: z.string().uuid().optional(),
                servings_consumed: z.coerce.number().positive(),
                meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
                notes: z.string().max(4_000).optional(),
                request_id: z.string().max(500).optional(),
            },
            outputSchema: z.object({
                result: z.record(z.string(), z.unknown()),
                source_cook_id: z.string().uuid(),
                source_dish_id: z.string().uuid(),
                recipe_id: z.string().uuid(),
                recipe_revision_id: z.string().uuid(),
            }),
        },
        async (args) =>
            withAnalytics(
                "log_cook_portion",
                async () => {
                    const result = await logCookPortion({
                        userId,
                        cookId: args.cook_id,
                        dishId: args.dish_id,
                        servingsConsumed: args.servings_consumed,
                        mealType: args.meal_type,
                        notes: args.notes,
                        idempotencyKey: args.request_id ?? crypto.randomUUID(),
                    });
                    return {
                        content: [
                            {
                                type: "text" as const,
                                text: "Explicit eaten portion logged from the cook's exact recipe revision; pantry inventory was unchanged.",
                            },
                        ],
                        structuredContent: result,
                    };
                },
                { userId },
                args,
            ),
    );
}
