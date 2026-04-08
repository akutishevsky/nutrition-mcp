import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import type { Context } from "hono";
import {
    insertMeal,
    getMealsByDate,
    getMealsInRange,
    deleteMeal,
    updateMeal,
    deleteAllUserData,
    type Meal,
} from "./supabase.js";
import { withAnalytics } from "./analytics.js";

const SESSION_TTL_MS = 60 * 60 * 1000; // 60 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

const sessions = new Map<
    string,
    {
        transport: WebStandardStreamableHTTPServerTransport;
        mcpToken: string;
        lastActivity: number;
    }
>();

setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions) {
        if (now - session.lastActivity > SESSION_TTL_MS) {
            sessions.delete(id);
        }
    }
}, CLEANUP_INTERVAL_MS);

function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
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

function registerTools(server: McpServer, userId: string) {
    server.registerTool(
        "log_meal",
        {
            title: "Log Meal",
            description:
                "Log a meal entry with nutritional information. If the user doesn't specify the quantity or portion size, ask how much they ate before estimating calories and macros. Use web search to look up accurate nutritional data when appropriate, especially for branded products or barcode scans.",
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
                calories: z.coerce.number().optional().describe("Total calories"),
                protein_g: z.coerce.number().optional().describe("Protein in grams"),
                carbs_g: z
                    .coerce.number()
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
            },
        },
        async (args) => {
            return withAnalytics(
                "log_meal",
                async () => {
                    const meal = await insertMeal(userId, args);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Meal logged:\n${formatMeal(meal)}`,
                            },
                        ],
                    };
                },
                { userId },
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
                    const meals = await getMealsByDate(userId, todayDate());
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
                    const meals = await getMealsByDate(userId, date);
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
                    const meals = await getMealsInRange(
                        userId,
                        start_date,
                        end_date,
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

                    // Group by date for readability
                    const byDate = new Map<string, Meal[]>();
                    for (const meal of meals) {
                        const date = meal.logged_at.slice(0, 10);
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
        "get_nutrition_summary",
        {
            title: "Get Nutrition Summary",
            description: "Get daily nutrition totals for a date range",
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
                "get_nutrition_summary",
                async () => {
                    const meals = await getMealsInRange(
                        userId,
                        start_date,
                        end_date,
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

                    // Group by date
                    const byDate = new Map<string, Meal[]>();
                    for (const meal of meals) {
                        const date = meal.logged_at.slice(0, 10);
                        const existing = byDate.get(date) ?? [];
                        existing.push(meal);
                        byDate.set(date, existing);
                    }

                    const summaries: string[] = [];
                    for (const [date, dateMeals] of [
                        ...byDate.entries(),
                    ].sort()) {
                        const totals = {
                            calories: 0,
                            protein_g: 0,
                            carbs_g: 0,
                            fat_g: 0,
                            count: dateMeals.length,
                        };
                        for (const m of dateMeals) {
                            totals.calories += m.calories ?? 0;
                            totals.protein_g += m.protein_g ?? 0;
                            totals.carbs_g += m.carbs_g ?? 0;
                            totals.fat_g += m.fat_g ?? 0;
                        }
                        summaries.push(
                            `${date} (${totals.count} meals): ${totals.calories} kcal | P: ${totals.protein_g}g | C: ${totals.carbs_g}g | F: ${totals.fat_g}g`,
                        );
                    }

                    return {
                        content: [{ type: "text", text: summaries.join("\n") }],
                    };
                },
                { userId },
                { start_date, end_date },
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
        },
        async ({ id, ...fields }) => {
            return withAnalytics(
                "update_meal",
                async () => {
                    const meal = await updateMeal(userId, id, fields);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Meal updated:\n${formatMeal(meal)}`,
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

export const handleMcp = async (c: Context) => {
    const mcpToken = c.get("accessToken") as string;
    const userId = c.get("userId") as string;
    const sessionId = c.req.header("mcp-session-id");

    const session = sessionId ? sessions.get(sessionId) : undefined;

    if (sessionId && !session) {
        return c.json({ error: "invalid_session" }, 404);
    }

    if (session && session.mcpToken !== mcpToken) {
        return c.json({ error: "forbidden" }, 403);
    }

    if (session) {
        session.lastActivity = Date.now();
        return session.transport.handleRequest(c.req.raw);
    }

    if (c.req.method !== "POST") {
        return c.json({ error: "invalid_request" }, 400);
    }

    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => {
            sessions.set(id, {
                transport,
                mcpToken,
                lastActivity: Date.now(),
            });
        },
        onsessionclosed: (id) => {
            sessions.delete(id);
        },
    });

    const proto = c.req.header("x-forwarded-proto") || "http";
    const host =
        c.req.header("x-forwarded-host") || c.req.header("host") || "localhost";
    const baseUrl = `${proto}://${host}`;

    const server = new McpServer(
        {
            name: "nutrition-mcp",
            version: "1.6.1",
            icons: [
                {
                    src: `${baseUrl}/favicon.ico`,
                    mimeType: "image/x-icon",
                },
            ],
        },
        { capabilities: { tools: {} } },
    );

    registerTools(server, userId);
    await server.connect(transport);

    return transport.handleRequest(c.req.raw);
};
