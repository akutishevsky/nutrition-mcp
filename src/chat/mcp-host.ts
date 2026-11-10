import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MunchCapabilityResolution } from "../billing/capabilities.js";
import { buildMunchMcpServerForUser } from "../mcp-runtime.js";
import { MUNCH_APP_VERSION } from "../widget-release.js";

/**
 * Chat v2 in-process MCP host (chat-v2 brief, item 0 + decision 1).
 *
 * The chat agent does NOT speak to Munch over the network and holds no
 * OAuth token. It builds the very same per-user MCP server the HTTP
 * transport builds (src/mcp-runtime.ts — one construction path, one
 * source of truth for the published tool definitions) and connects an
 * MCP client to it over the SDK's in-memory transport. Tool handlers
 * therefore execute under the signed-in user's identity with the same
 * capability resolution, the same validation, and the same RLS posture
 * as an external MCP call; the external Premium gate in
 * createHandleMcp is untouched and unweakened (the chat service applies
 * its own fail-closed entitlement gate before a host is ever opened).
 *
 * A host is opened per chat send and closed when the send completes —
 * capability or profile changes between sends are picked up exactly
 * the way a fresh external request picks them up.
 */

export interface McpToolDefinition {
    name: string;
    title?: string;
    description?: string;
    inputSchema: Record<string, unknown>;
    annotations?: {
        readOnlyHint?: boolean;
        destructiveHint?: boolean;
        idempotentHint?: boolean;
        openWorldHint?: boolean;
    };
}

export interface McpToolCallResult {
    content: Array<Record<string, unknown>>;
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
}

export interface ChatToolHost {
    listTools(): Promise<McpToolDefinition[]>;
    callTool(
        name: string,
        args: Record<string, unknown>,
    ): Promise<McpToolCallResult>;
    close(): Promise<void>;
}

function inProcessBaseUrl(): string {
    // The builder uses the base URL only for the server icon; the
    // canonical public origin is the honest value in-process.
    return process.env.MUNCH_PUBLIC_BASE_URL ?? "https://munch.business";
}

export async function openChatToolHost(input: {
    userId: string;
    preResolvedCapabilities?: MunchCapabilityResolution;
    /** Test seam: build a server without the production registrations. */
    buildServer?: (
        baseUrl: string,
        userId: string,
        preResolvedCapabilities?: MunchCapabilityResolution,
    ) => Promise<McpServer>;
}): Promise<ChatToolHost> {
    const build =
        input.buildServer ??
        ((baseUrl, userId, preResolved) =>
            buildMunchMcpServerForUser(baseUrl, userId, preResolved));
    const server = await build(
        inProcessBaseUrl(),
        input.userId,
        input.preResolvedCapabilities,
    );
    const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
    const client = new Client({
        name: "munch-chat-agent",
        version: MUNCH_APP_VERSION,
    });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    let closed = false;
    return {
        async listTools() {
            const result = await client.listTools();
            return result.tools.map((tool) => ({
                name: tool.name,
                title: tool.title,
                description: tool.description,
                inputSchema: (tool.inputSchema ?? {
                    type: "object",
                    properties: {},
                }) as Record<string, unknown>,
                annotations: tool.annotations,
            }));
        },
        async callTool(name, args) {
            const result = await client.callTool({
                name,
                arguments: args,
            });
            return result as unknown as McpToolCallResult;
        },
        async close() {
            if (closed) return;
            closed = true;
            await client.close().catch(() => undefined);
            await server.close().catch(() => undefined);
        },
    };
}
