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
    type Meal,
} from "./supabase.js";

const sessions = new Map<
    string,
    {
        transport: WebStandardStreamableHTTPServerTransport;
        mcpToken: string;
    }
>();

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
    server.tool(
        "log_meal",
        "Log a meal entry with nutritional information",
        {
            description: z.string().describe("What was eaten"),
            meal_type: z
                .enum(["breakfast", "lunch", "dinner", "snack"])
                .optional()
                .describe("Type of meal"),
            calories: z.number().optional().describe("Total calories"),
            protein_g: z.number().optional().describe("Protein in grams"),
            carbs_g: z.number().optional().describe("Carbohydrates in grams"),
            fat_g: z.number().optional().describe("Fat in grams"),
            logged_at: z
                .string()
                .optional()
                .describe("ISO 8601 timestamp (defaults to now)"),
            notes: z.string().optional().describe("Additional notes"),
        },
        async (args) => {
            const meal = await insertMeal(userId, args);
            return {
                content: [
                    { type: "text", text: `Meal logged:\n${formatMeal(meal)}` },
                ],
            };
        },
    );

    server.tool(
        "get_meals_today",
        "Get all meals logged today",
        {},
        async () => {
            const meals = await getMealsByDate(userId, todayDate());
            if (meals.length === 0) {
                return {
                    content: [{ type: "text", text: "No meals logged today." }],
                };
            }
            const text = meals.map(formatMeal).join("\n\n---\n\n");
            return { content: [{ type: "text", text }] };
        },
    );

    server.tool(
        "get_meals_by_date",
        "Get all meals for a specific date",
        {
            date: z.string().describe("Date in YYYY-MM-DD format"),
        },
        async ({ date }) => {
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
    );

    server.tool(
        "get_nutrition_summary",
        "Get daily nutrition totals for a date range",
        {
            start_date: z.string().describe("Start date (YYYY-MM-DD)"),
            end_date: z.string().describe("End date (YYYY-MM-DD)"),
        },
        async ({ start_date, end_date }) => {
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
            for (const [date, dateMeals] of [...byDate.entries()].sort()) {
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
    );

    server.tool(
        "delete_meal",
        "Delete a meal entry by ID",
        {
            id: z.string().describe("UUID of the meal to delete"),
        },
        async ({ id }) => {
            await deleteMeal(userId, id);
            return {
                content: [{ type: "text", text: `Meal ${id} deleted.` }],
            };
        },
    );

    server.tool(
        "update_meal",
        "Update fields of an existing meal entry",
        {
            id: z.string().describe("UUID of the meal to update"),
            description: z.string().optional(),
            meal_type: z
                .enum(["breakfast", "lunch", "dinner", "snack"])
                .optional(),
            calories: z.number().optional(),
            protein_g: z.number().optional(),
            carbs_g: z.number().optional(),
            fat_g: z.number().optional(),
            logged_at: z.string().optional(),
            notes: z.string().optional(),
        },
        async ({ id, ...fields }) => {
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
        return session.transport.handleRequest(c.req.raw);
    }

    if (c.req.method !== "POST") {
        return c.json({ error: "invalid_request" }, 400);
    }

    const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
        onsessioninitialized: (id) => {
            sessions.set(id, { transport, mcpToken });
        },
        onsessionclosed: (id) => {
            sessions.delete(id);
        },
    });

    const server = new McpServer(
        { name: "nutrition-mcp", version: "1.0.0" },
        { capabilities: { tools: {} } },
    );

    registerTools(server, userId);
    await server.connect(transport);

    return transport.handleRequest(c.req.raw);
};
