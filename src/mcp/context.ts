import type { McpServer } from "@modelcontextprotocol/server";
import type { ToolSurface } from "../analytics.js";
import type { AlcoholDisplay } from "../meal-listing.js";
import type { UsdaDeps } from "../usda.js";
import { WIDGET_PREFS_META_KEY } from "../widgets.js";

/**
 * Which tools and resources a server registers, by registration name. Absent
 * (every /mcp server) means all of them. The web dashboard passes one naming
 * only the read tools it can call and their widget resources, so each of its
 * in-process calls skips registering ~50 tools nobody on that surface can
 * reach. A name the filter lists that no registration carries simply registers
 * nothing, so a typo shows up as a missing tool, never as an extra one.
 */
export interface RegistrationFilter {
    tools: ReadonlySet<string>;
    resources: ReadonlySet<string>;
}

// The registration calls below stay literal registerTool calls on `server`
// (src/site-copy.test.ts scrapes them), so the filter sits in front of the
// server rather than around each call. Nothing reads a registration's return
// value, so a skipped one returns undefined.
export type RegistrationTarget = Pick<
    McpServer,
    "registerTool" | "registerResource" | "server"
>;

export function filteredRegistrations(
    target: McpServer,
    only: RegistrationFilter,
): RegistrationTarget {
    const registerTool = ((name: string, ...rest: unknown[]) =>
        only.tools.has(name)
            ? (target.registerTool as (...a: unknown[]) => unknown).call(
                  target,
                  name,
                  ...rest,
              )
            : undefined) as McpServer["registerTool"];
    const registerResource = ((name: string, ...rest: unknown[]) =>
        only.resources.has(name)
            ? (target.registerResource as (...a: unknown[]) => unknown).call(
                  target,
                  name,
                  ...rest,
              )
            : undefined) as McpServer["registerResource"];
    return { registerTool, registerResource, server: target.server };
}

export interface ToolContext {
    server: RegistrationTarget;
    userId: string;
    widgetsEnabled: boolean;
    alcohol: AlcoholDisplay;
    analytics: {
        userId: string;
        protocolEra?: "legacy" | "modern";
        clientInfo: () => ReturnType<McpServer["server"]["getClientVersion"]>;
        surface?: ToolSurface;
    };
    usdaOverrides: Partial<UsdaDeps>;
    uiMeta: (resourceUri: string) =>
        | {
              _meta: {
                  ui: { resourceUri: string };
                  "openai/outputTemplate": string;
              };
          }
        | { _meta?: undefined }
        | Record<string, never>;
    withWidgetPrefs: <A extends unknown[], R extends object>(
        handler: (...args: A) => Promise<R>,
    ) => (...args: A) => Promise<R>;
}

export function makeWidgetPrefs(
    widgetsEnabled: boolean,
    widgetsExpanded: boolean,
): ToolContext["withWidgetPrefs"] {
    return (handler) =>
        async (...args) => {
            const result = await handler(...args);
            if (!widgetsEnabled || !widgetsExpanded) return result;
            const meta = (result as { _meta?: Record<string, unknown> })._meta;
            return {
                ...result,
                _meta: {
                    ...meta,
                    [WIDGET_PREFS_META_KEY]: { v: 1, expanded: true },
                },
            };
        };
}
