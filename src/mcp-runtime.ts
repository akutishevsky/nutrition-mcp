import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { Context } from "hono";
import { resolveMunchCapabilities } from "./billing/capabilities.js";
import { registerFoodTools } from "./food-tools.js";
import { registerMealDraftTools } from "./meal-draft-tools.js";
import { registerRecipePlanningTools } from "./recipe-planning-tools.js";
import { registerSavedFoodTools } from "./saved-food-tools.js";
import { registerTools } from "./mcp.js";
import {
    alcoholTrackingEnabledFromProfile,
    getProfile,
    preferredDrinkUnitFromProfile,
    widgetsEnabledFromProfile,
} from "./supabase.js";

const MUNCH_SERVER_INSTRUCTIONS = `Munch stores and retrieves factual food, serving, macro, meal, hydration, weight, recipe, planning, and grocery data. Nutrition values are estimates and Munch does not provide medical or dietary advice. Do not ask Munch to determine what a user should eat, set a calorie target, diagnose a condition, or judge whether a food is healthy. ChatGPT may reason from the factual data under its own policies.

Before estimating a generic or branded food, search personal foods first when the user says "my usual" or refers to something eaten before. Otherwise call search_foods. Confirm the selected candidate and serving with the user, then call get_food_details. For a visible packaged-food barcode, call lookup_food_barcode and use verified label values when available. Always identify the source and do not present model estimates as database facts.

For photos and any ambiguous meal, use start_meal_draft. Add structured items and every unresolved question to the draft, then answer one highest-impact question at a time. Call prepare_meal_confirmation only when no questions remain, unless the user explicitly directs you to accept the remaining stated assumptions. Present the complete prepared draft and call confirm_meal_draft only after an explicit yes. Do not use log_meal for photo or ambiguous flows.

When the user establishes a complete recipe in conversation, recipe tools persist the factual structure. Do not create tags such as favorite, healthy, high-protein, quick, or family meal. Derive those descriptions from nutrient values, ingredient facts, timing, and observed scheduling or logging frequency when the user's request calls for it.

A planned meal does not mean anyone ate it. A grocery list is not pantry inventory. If the user says they have everything except onions, add onions only. Do not store or infer that every other ingredient is currently owned.

Use search_meals and search_saved_foods for prior variations. Use the interactive importer for history files instead of repeatedly calling log_meal. Munch tool availability is account-specific; do not advertise, describe, or link to unavailable paid capabilities.`;

async function buildMunchMcpServer(
    c: Context,
    userId: string,
): Promise<McpServer> {
    const proto = c.req.header("x-forwarded-proto") || "http";
    const host =
        c.req.header("x-forwarded-host") || c.req.header("host") || "localhost";
    const baseUrl = `${proto}://${host}`;
    const server = new McpServer(
        {
            name: "Munch",
            version: "0.6.0",
            icons: [
                {
                    src: `${baseUrl}/favicon.ico`,
                    mimeType: "image/x-icon",
                },
            ],
        },
        {
            capabilities: { tools: {}, resources: {} },
            instructions: MUNCH_SERVER_INSTRUCTIONS,
        },
    );

    const [profile, capabilities] = await Promise.all([
        getProfile(userId),
        resolveMunchCapabilities(userId),
    ]);
    const drinkUnit = preferredDrinkUnitFromProfile(profile);
    registerTools(
        server,
        userId,
        widgetsEnabledFromProfile(profile),
        alcoholTrackingEnabledFromProfile(profile) ? (drinkUnit ?? "us") : null,
        capabilities,
    );
    registerFoodTools(server, userId);
    registerSavedFoodTools(server, userId, capabilities);
    registerMealDraftTools(server, userId);
    registerRecipePlanningTools(server, userId, capabilities);
    return server;
}

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
    const server = await buildMunchMcpServer(c, userId);
    await server.connect(transport);
    return transport.handleRequest(c.req.raw);
};
