import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { Context } from "hono";
import {
    resolveMunchCapabilitiesSafe,
    type MunchCapabilityResolution,
} from "./billing/capabilities.js";
import { mcpEntitlementRefusal } from "./mcp-entitlement.js";
import { withCanonicalFoodSearch } from "./canonical-food-search.js";
import { getAccountIdentity } from "./accounts/repository.js";
import { registerConnectionStatusTools } from "./connection-status-tools.js";
import { registerCookTools } from "./cook-tools.js";
import { registerFoodTools } from "./food-tools.js";
import { withFreshStructuredLogGuard } from "./fresh-log-guard.js";
import { registerInventoryTools } from "./inventory/tools.js";
import { registerMealDetailTools } from "./meal-detail-tools.js";
import { registerMealDraftTools } from "./meal-draft-tools.js";
import { registerMealReviewTools } from "./meal-review-tools.js";
import { registerMealToRecipeTool } from "./meal-to-recipe.js";
import {
    registerAdvancedToolGateway,
    withLatencyOptimizedToolCatalog,
} from "./mcp-latency.js";
import { registerRecipePlanningTools } from "./recipe-planning-tools.js";
import { registerRecipeImportTools } from "./recipe-import-tools.js";
import { withRecipeNutritionResolution } from "./recipe-nutrition-resolution.js";
import { registerSavedFoodTools } from "./saved-food-tools.js";
import { registerTools } from "./mcp.js";
import {
    alcoholTrackingEnabledFromProfile,
    getProfile,
    pantryEnabledFromProfile,
    preferredDrinkUnitFromProfile,
    widgetsEnabledFromProfile,
} from "./storage.js";
import { withCanonicalStructuredLogMeal } from "./structured-log-meal.js";
import { MUNCH_APP_VERSION } from "./widget-release.js";
import { withVersionedWidgetResources } from "./widget-resource-versioning.js";

const MUNCH_SERVER_INSTRUCTIONS = `Munch stores and retrieves factual meals, nutrition, hydration, weight, foods, recipes, meal plans, grocery lists, and—when the paid user explicitly enables it—Pantry inventory. Nutrition values are estimates; Munch does not provide medical or dietary advice.\n\nHost-model boundary: this MCP server does not invoke Munch's standalone website AI clients. The connected host model is responsible for vision, semantic interpretation, recipe ideation, and other generative reasoning. Use Munch tools for factual/provider lookup, deterministic matching and ranking, authorization, validation, idempotency, and persistence. Never route an MCP request through the standalone website AI layer.\n\nPrefer the direct read/write tool that exactly matches the user's request. Grocery-list requests go straight to get_grocery_list; adding groceries goes straight to add_grocery_items. Today's meals use get_meals_today; date ranges use the matching range tool. Meal plans use get_meal_plan. Saved recipes use search_recipes/get_recipe. When the user wants an already-known logged meal saved as a recipe, use save_meal_as_recipe with that meal ID instead of searching meals, foods, or ingredients again. Use personal scope by default unless the user explicitly asks for household data. If no direct tool covers a low-frequency correction, setting, export, deletion, or management request, call find_munch_actions and then run_munch_action with the returned parameter contract.\n\nFor nutrition resolution, use personal saved/history matches when relevant, then search_foods, then external web only when Munch has no adequate result, and model estimates last. Visible packaged barcodes use lookup_food_barcode. Recipe saves also have a server-side nutrition safety net: if ordinary ingredients reach save_recipe without nutrient facts, Munch resolves them through its existing food-provider pipeline, scales compatible portions, records provenance and assumptions, and only leaves material ingredients unresolved when a defensible estimate cannot be made.\n\nFor a fully resolved text meal, use log_meal with items[]. For photos or unresolved meals, use prepare_meal_review; infer homemade versus restaurant from the evidence instead of asking by default. Use visible scale references when estimating portions. Put low-impact uncertainty into explicit assumptions; resolve only material questions/edits, present the complete review, then use confirm_meal_draft only after explicit user approval. Prefer this atomic review flow over legacy granular draft tools. When answering an item-linked material review question, reconcile the affected canonical item in the same resolve_meal_review call; do not close the question while leaving stale assumptions or nutrition behind.\n\nRecipe URLs use parse_recipe_url before saving. Planning never means consumption. A grocery list is not pantry inventory. If Pantry tools are present, Pantry is enabled for this premium user: after a plausibly home-prepared meal is logged, use get_pantry with only the meal's candidate ingredient names to identify likely Pantry overlap, then ask a targeted clarification. Never silently subtract inferred consumption. If the user explicitly says what was used, finished, discarded, moved, or corrected, apply it with reconcile_pantry. Receipt or explicit shopping purchases are acquisition evidence: use reconcile_purchase to atomically match Grocery items and add purchased foods to Pantry; low-confidence lines are left for review. Do not ask Pantry questions for obvious restaurant/takeout meals or leftovers unless the user indicates Pantry ingredients were used. Use get_connection_status only for connection or feature-availability troubleshooting.`;
const COOK_SERVER_INSTRUCTIONS = `Cooks are persistent cooking occasions independent of recipes, nutrition logs, and pantry usage. Use start_cook before, during, or after cooking; update_cook for explicit observations, multiple timeline events, corrections, and durable photos; update_cook_dish when labels or actual ingredients need correction; get_cook/search_cooks for historical recall; repeat_cook for a fresh attempt; record_cook_result for user-authored outcomes; compare_cooks for selected attempts; and save_cook_as_recipe only after a reviewed recipe draft. Preserve original messages, actual ingredients, deviations, photos, and event time separately from submission time. Questions and hypotheticals must not become factual events. Completing a cook never logs food consumption or deducts pantry inventory. Use log_cook_portion only after the user explicitly says they ate a portion and the dish is linked to an exact saved recipe revision; use reconcile_pantry separately only for explicitly confirmed ingredient usage. The top-level files input follows the OpenAI file API contract: supported image bytes are downloaded, validated, stored durably, and failed transfers are reported separately so a retry cannot duplicate the saved update.`;

/**
 * Build the Munch MCP server for one user. This is the single construction
 * path for the published tool surface: the HTTP transport (createHandleMcp
 * below) and the in-process chat host (src/chat/mcp-host.ts) both build
 * through here, so the chat agent's callable tools are derived from exactly
 * the definitions external MCP clients receive — the chat parity law
 * (chat-v2 brief, item 0). Exported for the in-process host and for parity
 * verification; external MCP behavior is unchanged.
 */
export async function buildMunchMcpServerForUser(
    baseUrl: string,
    userId: string,
    preResolvedCapabilities?: MunchCapabilityResolution,
): Promise<McpServer> {
    const server = new McpServer(
        {
            name: "Munch",
            version: MUNCH_APP_VERSION,
            icons: [
                {
                    src: `${baseUrl}/favicon.ico`,
                    mimeType: "image/x-icon",
                },
            ],
        },
        {
            capabilities: { tools: {}, resources: {} },
            instructions: `${MUNCH_SERVER_INSTRUCTIONS}\n\n${COOK_SERVER_INSTRUCTIONS}`,
        },
    );
    const appServer = withVersionedWidgetResources(server);
    const optimizedServer = withLatencyOptimizedToolCatalog(appServer);

    const [profile, capabilityResolution, accountIdentity] = await Promise.all([
        getProfile(userId).catch((error) => {
            console.warn("Munch profile lookup failed during MCP setup", {
                userId,
                errorName: error instanceof Error ? error.name : "unknown",
            });
            return null;
        }),
        preResolvedCapabilities ?? resolveMunchCapabilitiesSafe(userId),
        getAccountIdentity(userId).catch((error) => {
            console.warn(
                "Munch account identity lookup failed during MCP setup",
                {
                    userId,
                    errorName: error instanceof Error ? error.name : "unknown",
                },
            );
            return null;
        }),
    ]);
    const capabilities = capabilityResolution.capabilities;
    const drinkUnit = preferredDrinkUnitFromProfile(profile);
    const widgetsEnabled = widgetsEnabledFromProfile(profile);
    const guardedLegacyServer = withFreshStructuredLogGuard(optimizedServer);
    const structuredLegacyServer = withCanonicalStructuredLogMeal(
        guardedLegacyServer,
        userId,
    );
    registerTools(
        structuredLegacyServer,
        userId,
        widgetsEnabled,
        alcoholTrackingEnabledFromProfile(profile) ? (drinkUnit ?? "us") : null,
        capabilities,
    );
    registerFoodTools(
        withCanonicalFoodSearch(optimizedServer),
        userId,
        widgetsEnabled,
    );
    registerSavedFoodTools(
        optimizedServer,
        userId,
        capabilities,
        widgetsEnabled,
    );
    registerMealDetailTools(optimizedServer, userId, widgetsEnabled);
    registerMealReviewTools(optimizedServer, userId, widgetsEnabled);
    registerMealDraftTools(optimizedServer, userId, widgetsEnabled);
    registerRecipeImportTools(
        optimizedServer,
        userId,
        capabilities,
        widgetsEnabled,
    );
    registerRecipePlanningTools(
        withRecipeNutritionResolution(optimizedServer),
        userId,
        capabilities,
        widgetsEnabled,
    );
    registerMealToRecipeTool(optimizedServer, userId, capabilities);
    registerCookTools(optimizedServer, userId, widgetsEnabled);
    if (capabilities.tier === "premium" && pantryEnabledFromProfile(profile)) {
        registerInventoryTools(
            optimizedServer,
            userId,
            capabilities,
            widgetsEnabled,
        );
    }
    registerConnectionStatusTools(optimizedServer, userId, {
        accountEmail: accountIdentity?.email,
        capabilities,
        capabilityResolution: capabilityResolution.status,
    });
    registerAdvancedToolGateway(optimizedServer, userId);
    return server;
}

async function buildMunchMcpServer(
    c: Context,
    userId: string,
    preResolvedCapabilities?: MunchCapabilityResolution,
): Promise<McpServer> {
    const proto = c.req.header("x-forwarded-proto") || "http";
    const host =
        c.req.header("x-forwarded-host") || c.req.header("host") || "localhost";
    return buildMunchMcpServerForUser(
        `${proto}://${host}`,
        userId,
        preResolvedCapabilities,
    );
}

export interface McpRuntimeDeps {
    resolveCapabilities?: (
        userId: string,
    ) => Promise<MunchCapabilityResolution>;
}

export const createHandleMcp =
    (deps: McpRuntimeDeps = {}) =>
    async (c: Context) => {
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

        // MCP entitlement gate (Amendment D, 2026-11-09): MCP access is part of
        // Premium. Capabilities are resolved fresh on every request through the
        // same source of truth as the web side, so an already-connected client
        // whose entitlement lapses — or that connected before this gate — is
        // refused on its next gated request. Only the initialize handshake,
        // pings, and notifications pass without Premium, so a client can
        // negotiate and surface the refusal; every tools/list, tools/call,
        // resource, and prompt request requires an active Premium entitlement.
        // Capability lookup failures resolve fail-closed (Free), matching the
        // repo's existing capability doctrine.
        const capabilityResolution = await (
            deps.resolveCapabilities ?? resolveMunchCapabilitiesSafe
        )(userId);
        let payload: unknown;
        try {
            const rawBody = await c.req.raw.clone().text();
            payload = rawBody ? JSON.parse(rawBody) : undefined;
        } catch {
            payload = undefined;
        }
        if (payload !== undefined) {
            const refusal = mcpEntitlementRefusal(
                capabilityResolution.capabilities,
                payload,
            );
            if (refusal) return c.json(refusal.body, refusal.status);
        }

        const transport = new WebStandardStreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        });
        const server = await buildMunchMcpServer(
            c,
            userId,
            capabilityResolution,
        );
        await server.connect(transport);
        return transport.handleRequest(c.req.raw);
    };

export const handleMcp = createHandleMcp();
