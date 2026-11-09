import { describe, expect, test } from "bun:test";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerRecipeImportTools } from "./recipe-import-tools.js";
import type { MunchCapabilities } from "./billing/capabilities.js";

function captureTool() {
    let captured: Record<string, any> | null = null;
    const server = {
        registerTool(
            _name: string,
            config: Record<string, any>,
            _handler: (...args: any[]) => unknown,
        ) {
            captured = config;
            return {};
        },
    } as unknown as McpServer;
    registerRecipeImportTools(server, "11111111-1111-4111-8111-111111111111", {
        personalRecipesRead: true,
        personalRecipesWrite: true,
        householdRead: false,
        householdWrite: false,
    } as MunchCapabilities);
    return captured;
}

describe("recipe URL import MCP surface", () => {
    test("registers a read-only preview tool with structured output", () => {
        const tool = captureTool();
        expect(tool?.title).toBe("Parse Recipe URL");
        expect(tool?.annotations).toEqual({
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        });
        expect(tool?.inputSchema).toBeDefined();
        expect(tool?.outputSchema).toBeDefined();
        expect(tool?.description).toContain("never saves a recipe");
    });
});
