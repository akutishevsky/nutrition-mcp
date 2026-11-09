import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MUNCH_WIDGET_RESOURCE_VERSION } from "./widget-release.js";

const WIDGET_PREFIX = "ui://widget/";
const VERSION_SUFFIX = `/${MUNCH_WIDGET_RESOURCE_VERSION}.html`;

const WIDGET_DESCRIPTIONS: Record<string, string> = {
    "ui://widget/meal-logged.html":
        "A compact Munch receipt showing the logged meal, serving, calories, macros, and optional food-source and daily-progress details.",
    "ui://widget/meal-review.html":
        "A Munch meal review showing foods, portions, calories, macros, assumptions, and the controls needed to confirm or adjust the pending meal.",
    "ui://widget/goal-progress.html":
        "A Munch daily progress snapshot showing logged intake against saved nutrition goals and the latest weight when available.",
    "ui://widget/nutrition-summary.html":
        "A Munch date-range nutrition summary with compact averages inline and a fuller day-by-day view when expanded.",
    "ui://widget/trends.html":
        "A Munch nutrition-trend view with a compact inline summary and an expanded history view for deeper inspection.",
    "ui://widget/weight-trends.html":
        "A Munch weight-trend view showing the latest reading, change over time, and optional target context.",
    "ui://widget/import-meals.html":
        "A Munch meal-history importer that lets the user map, preview, validate, and confirm an uploaded export before anything is saved.",
    "ui://widget/cook-summary.html":
        "A compact Munch cook-history card showing saved photos, dishes, timeline events, and user-authored results with expandable detail.",
    "ui://widget/food-label.html":
        "A Munch food label showing search and saved-food results built for comparison, or one food's full nutrition panel, with the source named on every row.",
    "ui://widget/recipe.html":
        "A Munch recipe card showing recipe search results, a full recipe with ingredients, steps, and per-serving nutrition, or a parsed recipe import laid out for review before saving.",
};

export function versionWidgetResourceUri(uri: string): string {
    if (!uri.startsWith(WIDGET_PREFIX)) return uri;
    if (uri.endsWith(VERSION_SUFFIX)) return uri;
    return uri.endsWith(".html")
        ? `${uri.slice(0, -".html".length)}${VERSION_SUFFIX}`
        : uri;
}

export function canonicalWidgetResourceUri(uri: string): string {
    if (!uri.startsWith(WIDGET_PREFIX)) return uri;
    return uri.endsWith(VERSION_SUFFIX)
        ? `${uri.slice(0, -VERSION_SUFFIX.length)}.html`
        : uri;
}

export function widgetDescriptionForUri(uri: string): string | undefined {
    return WIDGET_DESCRIPTIONS[canonicalWidgetResourceUri(uri)];
}

function versionToolConfig(config: Record<string, any>): Record<string, any> {
    const meta = config?._meta;
    if (!meta || typeof meta !== "object") return config;

    let changed = false;
    const nextMeta: Record<string, any> = { ...meta };

    if (
        meta.ui &&
        typeof meta.ui === "object" &&
        typeof meta.ui.resourceUri === "string"
    ) {
        const resourceUri = versionWidgetResourceUri(meta.ui.resourceUri);
        if (resourceUri !== meta.ui.resourceUri) {
            changed = true;
            nextMeta.ui = { ...meta.ui, resourceUri };
        }
    }

    if (typeof meta["openai/outputTemplate"] === "string") {
        const outputTemplate = versionWidgetResourceUri(
            meta["openai/outputTemplate"],
        );
        if (outputTemplate !== meta["openai/outputTemplate"]) {
            changed = true;
            nextMeta["openai/outputTemplate"] = outputTemplate;
        }
    }

    return changed ? { ...config, _meta: nextMeta } : config;
}

function decorateResourceResult(result: any, resourceUri: string): any {
    if (!result || !Array.isArray(result.contents)) return result;
    const description = widgetDescriptionForUri(resourceUri);
    return {
        ...result,
        contents: result.contents.map((content: any) => {
            if (!content || typeof content !== "object") return content;
            const meta =
                content._meta && typeof content._meta === "object"
                    ? content._meta
                    : {};
            const ui = meta.ui && typeof meta.ui === "object" ? meta.ui : {};
            return {
                ...content,
                uri: resourceUri,
                _meta: {
                    ...meta,
                    ui: {
                        ...ui,
                        // Munch owns the single visible card surface. Asking the
                        // host for another border creates a nested-card moat.
                        prefersBorder: false,
                    },
                    "openai/widgetPrefersBorder": false,
                    ...(description
                        ? { "openai/widgetDescription": description }
                        : {}),
                },
            };
        }),
    };
}

type ToolServer = {
    registerTool: (
        name: string,
        config: Record<string, any>,
        handler: (...args: any[]) => unknown,
    ) => unknown;
    registerResource: (
        name: string,
        uri: string,
        config: Record<string, any>,
        handler: (...args: any[]) => unknown,
    ) => unknown;
};

/**
 * Apply the ChatGPT/MCP UI release contract without forcing every feature module
 * to duplicate release identifiers. Tool descriptors and resource registrations
 * are rewritten together so a breaking widget release cannot leave stale links.
 */
export function withVersionedWidgetResources(server: McpServer): McpServer {
    const toolServer = server as unknown as ToolServer;
    const originalRegisterTool = toolServer.registerTool.bind(server);
    const originalRegisterResource = toolServer.registerResource.bind(server);

    return new Proxy(server, {
        get(target, property) {
            if (property === "registerTool") {
                return (
                    name: string,
                    config: Record<string, any>,
                    handler: (...args: any[]) => unknown,
                ) =>
                    originalRegisterTool(
                        name,
                        versionToolConfig(config),
                        handler,
                    );
            }
            if (property === "registerResource") {
                return (
                    name: string,
                    uri: string,
                    config: Record<string, any>,
                    handler: (...args: any[]) => unknown,
                ) => {
                    const versionedUri = versionWidgetResourceUri(uri);
                    const description = widgetDescriptionForUri(versionedUri);
                    const resourceConfig = description
                        ? { ...config, description }
                        : config;
                    return originalRegisterResource(
                        name,
                        versionedUri,
                        resourceConfig,
                        async (...args: any[]) =>
                            decorateResourceResult(
                                await handler(...args),
                                versionedUri,
                            ),
                    );
                };
            }
            const value = Reflect.get(target, property, target);
            return typeof value === "function" ? value.bind(target) : value;
        },
    }) as McpServer;
}
