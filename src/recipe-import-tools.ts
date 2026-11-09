import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withAnalytics } from "./analytics.js";
import type { MunchCapabilities } from "./billing/capabilities.js";
import { requireRecipeAccess } from "./mcp-capability-guard.js";
import { previewRecipeUrl } from "./recipe-import/service.js";
import { recipeImportDraftOutputSchema } from "./recipe-import/types.js";

export const RECIPE_WIDGET_URI = "ui://widget/recipe.html";

/**
 * URL import is deliberately preview-only. Saving stays behind the existing
 * save_recipe/save_recipe_and_plan tools so the MCP client must show the
 * parsed source and receive an explicit confirmation before persistence.
 */
export function registerRecipeImportTools(
    server: McpServer,
    userId: string,
    capabilities: MunchCapabilities,
    widgetsEnabled = true,
): void {
    const toolServer = server as unknown as {
        registerTool: (
            name: string,
            config: unknown,
            handler: (...args: any[]) => unknown,
        ) => unknown;
    };
    const uiMeta = widgetsEnabled
        ? { _meta: { ui: { resourceUri: RECIPE_WIDGET_URI } } }
        : {};

    toolServer.registerTool(
        "parse_recipe_url",
        {
            title: "Parse Recipe URL",
            description:
                "Preview a public HTTPS recipe URL by extracting its title, ingredients, servings, timing, instructions, nutrition matches, and source provenance. This MCP path intentionally does not call Munch's paid website AI resolver: use your own conversational/web understanding plus search_foods to interpret and resolve ambiguous ingredient language before saving. This tool never saves a recipe or adds groceries. Show the preview and ask for explicit confirmation before using save_recipe or save_recipe_and_plan with the returned recipe fields.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: {
                url: z
                    .string()
                    .url()
                    .max(2_000)
                    .refine((value) => value.startsWith("https://"), {
                        message: "Only HTTPS recipe URLs are supported.",
                    }),
            },
            outputSchema: z.object({
                draft: recipeImportDraftOutputSchema,
            }),
            ...uiMeta,
        },
        async ({ url }) =>
            withAnalytics(
                "parse_recipe_url",
                async () => {
                    requireRecipeAccess(capabilities, "all", false);
                    // MCP/ChatGPT already has a conversational model. Keep
                    // this path deterministic so Munch does not make a
                    // duplicate paid model call; the client can use the raw
                    // ingredient lines, instructions, and search_foods to do
                    // semantic interpretation before saving.
                    const draft = await previewRecipeUrl(url, {
                        rateLimitKey: userId,
                    });
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Parsed “${draft.recipe.name}” from ${draft.source.final_url}. ${draft.recipe.ingredients.length} ingredients are ready for review; nothing was saved. Ask for explicit confirmation before saving the returned recipe.`,
                            },
                        ],
                        structuredContent: { draft },
                    };
                },
                { userId },
            ),
    );
}
