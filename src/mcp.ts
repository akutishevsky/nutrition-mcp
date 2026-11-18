import {
    createMcpHandler,
    JSONRPC_VERSION,
    McpServer,
    ProtocolError,
    type McpRequestContext,
} from "@modelcontextprotocol/server";
import type { Context } from "hono";
import type { ToolSurface } from "./analytics.js";
import { formatClientId } from "./client-id.js";
import { newErrorRef } from "./errors.js";
import { buildDailyBuckets, computeWeeklyDigest } from "./insights.js";
import {
    APP_UI_MIME_TYPE,
    DIGEST_WIDGET_URI,
    GOAL_PROGRESS_WIDGET_URI,
    IMPORT_MEALS_WIDGET_URI,
    MEAL_LOGGED_WIDGET_URI,
    SERVER_INSTRUCTIONS,
    SUMMARY_WIDGET_URI,
    TRENDS_WIDGET_URI,
    WEIGHT_TRENDS_WIDGET_URI,
} from "./mcp/constants.js";
import {
    filteredRegistrations,
    makeWidgetPrefs,
    type RegistrationFilter,
    type RegistrationTarget,
    type ToolContext,
} from "./mcp/context.js";
import { registerFoodsTools } from "./mcp/tools/foods.js";
import { registerGoalsTools } from "./mcp/tools/goals.js";
import { registerInsightsTools } from "./mcp/tools/insights.js";
import { registerMealsTools } from "./mcp/tools/meals.js";
import { registerMetricsTools } from "./mcp/tools/metrics.js";
import { registerProfileTools } from "./mcp/tools/profile.js";
import { registerSavedMealsTools } from "./mcp/tools/saved-meals.js";
import { gateAlcohol } from "./mcp/totals.js";
import { type AlcoholDisplay } from "./meal-listing.js";
import {
    alcoholTrackingEnabledFromProfile,
    getMealsInRange,
    getNutritionGoals,
    getProfile,
    getUserTimezone,
    getWaterInRange,
    preferredDrinkUnitFromProfile,
    widgetsEnabledFromProfile,
    widgetsExpandedFromProfile,
} from "./supabase.js";
import { shiftLocalDate, todayInTz } from "./tz.js";
import { getBaseUrl } from "./url.js";
import type { UsdaDeps } from "./usda.js";
import { getWidgetHtml } from "./widgets.js";

export * from "./mcp/constants.js";
export type { RegistrationFilter } from "./mcp/context.js";
export * from "./mcp/formatters.js";
export * from "./mcp/helpers.js";
export * from "./mcp/schemas.js";
export * from "./mcp/totals.js";

// Exported for tests: the only way to exercise a tool handler end-to-end
// (schema coercion, handler, response text) is to register the tools on a real
// McpServer and call them through a client. Production still reaches this only
// via buildMcpServer.
export function registerTools(
    mcpServer: McpServer,
    userId: string,
    widgetsEnabled: boolean,
    alcohol: AlcoholDisplay,
    protocolEra?: "legacy" | "modern",
    usda: Partial<UsdaDeps> = {},
    widgetsExpanded = false,
    surface?: ToolSurface,
    only?: RegistrationFilter,
) {
    const server: RegistrationTarget = only
        ? filteredRegistrations(mcpServer, only)
        : mcpServer;
    const analytics = {
        userId,
        protocolEra,
        clientInfo: () => server.server.getClientVersion(),
        surface,
    };
    const uiMeta = (resourceUri: string) =>
        widgetsEnabled
            ? {
                  _meta: {
                      ui: { resourceUri },
                      "openai/outputTemplate": resourceUri,
                  },
              }
            : {};
    const withWidgetPrefs = makeWidgetPrefs(widgetsEnabled, widgetsExpanded);

    const ctx: ToolContext = {
        server,
        userId,
        widgetsEnabled,
        alcohol,
        analytics,
        usdaOverrides: usda,
        uiMeta,
        withWidgetPrefs,
    };

    registerMealsTools(ctx);
    registerFoodsTools(ctx);
    registerGoalsTools(ctx);
    registerSavedMealsTools(ctx);
    registerMetricsTools(ctx);
    registerInsightsTools(ctx);
    registerProfileTools(ctx);

    server.registerResource(
        "import-meals-widget",
        IMPORT_MEALS_WIDGET_URI,
        {
            title: "Import Meals",
            description:
                "Interactive importer for a meal-history export: reads the file in the browser, maps its columns, previews the rows, then writes them via bulk_import_meals.",
            mimeType: APP_UI_MIME_TYPE,
        },
        async (uri: URL) => {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: APP_UI_MIME_TYPE,
                        text: await getWidgetHtml("import-meals"),
                        _meta: { ui: { prefersBorder: true } },
                    },
                ],
            };
        },
    );

    server.registerResource(
        "nutrition-summary-widget",
        SUMMARY_WIDGET_URI,
        {
            title: "Nutrition Summary Dashboard",
            description:
                "Interactive dashboard UI for get_nutrition_summary: macro tiles vs goals and a per-day breakdown, with automatic light/dark theming.",
            mimeType: APP_UI_MIME_TYPE,
        },
        async (uri: URL) => {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: APP_UI_MIME_TYPE,
                        text: await getWidgetHtml("nutrition-summary"),
                        // Prefer a bordered container in hosts that honor it.
                        _meta: { ui: { prefersBorder: true } },
                    },
                ],
            };
        },
    );

    // UI resource for the get_goal_progress widget (single-day intake vs goal
    // rings + a weight card). Same self-contained-HTML contract as above.

    server.registerResource(
        "goal-progress-widget",
        GOAL_PROGRESS_WIDGET_URI,
        {
            title: "Goal Progress",
            description:
                "Interactive UI for get_goal_progress: a single day's goals grouped by status (over, near the limit, still to go, on track) with per-meal sources and the latest weight, with automatic light/dark theming.",
            mimeType: APP_UI_MIME_TYPE,
        },
        async (uri: URL) => {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: APP_UI_MIME_TYPE,
                        text: await getWidgetHtml("goal-progress"),
                        _meta: { ui: { prefersBorder: true } },
                    },
                ],
            };
        },
    );

    // UI resource for the log_meal / update_meal / log_saved_meal widget (day's running totals vs goals as
    // rings; renders nothing when no goals are set). Same contract as above.

    server.registerResource(
        "meal-logged-widget",
        MEAL_LOGGED_WIDGET_URI,
        {
            title: "Meal Logged",
            description:
                "Interactive UI shown after log_meal, update_meal and log_saved_meal: the day's running intake-vs-goal rings, with automatic light/dark theming. Shows nothing when no nutrition goals are set.",
            mimeType: APP_UI_MIME_TYPE,
        },
        async (uri: URL) => {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: APP_UI_MIME_TYPE,
                        text: await getWidgetHtml("meal-logged"),
                        _meta: { ui: { prefersBorder: true } },
                    },
                ],
            };
        },
    );

    // UI resource for the get_trends widget (interactive 7/14/30-day toggle over
    // a daily calories chart + trailing-average rings). Same contract as above.

    server.registerResource(
        "trends-widget",
        TRENDS_WIDGET_URI,
        {
            title: "Trends",
            description:
                "Interactive UI for get_trends: a 7/14/30-day toggle and a nutrient switcher over a daily bar chart, with each nutrient's average against its goal or limit, with automatic light/dark theming.",
            mimeType: APP_UI_MIME_TYPE,
        },
        async (uri: URL) => {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: APP_UI_MIME_TYPE,
                        text: await getWidgetHtml("trends"),
                        _meta: { ui: { prefersBorder: true } },
                    },
                ],
            };
        },
    );

    // UI resource for the get_digest widget (one period: calories, goals,
    // trends, nutrients, water and weight, meals or habits, highlights).

    server.registerResource(
        "digest-widget",
        DIGEST_WIDGET_URI,
        {
            title: "Nutrition Digest",
            description:
                "Interactive UI for get_digest: a collapsible card for one period with a calorie gauge (day) or daily bars (range), goals at a glance, trend charts, a nutrient table, water and weight, meals or logging habits, and highlights, with automatic light/dark theming.",
            mimeType: APP_UI_MIME_TYPE,
        },
        async (uri: URL) => {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: APP_UI_MIME_TYPE,
                        text: await getWidgetHtml("digest"),
                        _meta: { ui: { prefersBorder: true } },
                    },
                ],
            };
        },
    );

    // UI resource for the get_weight_trends widget (weight-over-time chart with
    // a trend line, a range toggle and target line). Same contract as above.

    server.registerResource(
        "weight-trends-widget",
        WEIGHT_TRENDS_WIDGET_URI,
        {
            title: "Weight Trends",
            description:
                "Interactive UI for get_weight_trends: the latest weigh-in, its change over a selectable range (up to the whole history) and a weight-over-time chart (daily weigh-ins, smoothed trend line, data-scaled axis, target line), the weekly rate and goal projection, plus expandable lists of the weigh-ins by week and of body measurements by site, with automatic light/dark theming.",
            mimeType: APP_UI_MIME_TYPE,
        },
        async (uri: URL) => {
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: APP_UI_MIME_TYPE,
                        text: await getWidgetHtml("weight-trends"),
                        _meta: { ui: { prefersBorder: true } },
                    },
                ],
            };
        },
    );

    server.registerResource(
        "weekly-summary",
        "nutrition://weekly-summary",
        {
            title: "Weekly Nutrition Summary",
            description:
                "Rolling 7-day digest: logged-day count, daily averages vs targets, and the best/roughest day of the week.",
            mimeType: "text/plain",
        },
        async (uri: URL) => {
            // Resources don't go through withAnalytics, and the SDK forwards a
            // thrown message to the client verbatim, so this catch applies the
            // same rule: raw text is logged under a ref, never returned.
            try {
                const tz = await getUserTimezone(userId);
                const endDate = todayInTz(tz);
                const startDate = shiftLocalDate(endDate, -6);
                const [meals, water, goals] = await Promise.all([
                    getMealsInRange(userId, startDate, endDate, tz),
                    getWaterInRange(userId, startDate, endDate, tz),
                    getNutritionGoals(userId),
                ]);
                const buckets = buildDailyBuckets(
                    meals,
                    water,
                    startDate,
                    endDate,
                    tz,
                );
                return {
                    contents: [
                        {
                            uri: uri.href,
                            mimeType: "text/plain",
                            text: computeWeeklyDigest(
                                gateAlcohol(buckets, alcohol),
                                goals,
                            ),
                        },
                    ],
                };
            } catch (err) {
                const ref = newErrorRef();
                console.warn(
                    `[resource] weekly-summary error ref=${ref}: ${JSON.stringify(err instanceof Error ? err.message : String(err))}`,
                );
                throw new Error(
                    `Couldn't build the weekly summary right now (ref ${ref}); try again shortly or call get_trends.`,
                );
            }
        },
    );
}

// The bare server: identity, capabilities and instructions, no tools. Shared
// by both factory paths so the surface a `server/discover` probe is answered
// from cannot drift from the one a tools/call is served by — the two responses
// come from the same literal.
function newMcpServer(baseUrl: string): McpServer {
    return new McpServer(
        {
            name: "nutrition-mcp",
            version: "1.33.0",
            // The "Plugged Apple" tile (white mark on green), so it reads on
            // any host background. favicon.ico stays first: it is the URL
            // clients and the directory listing have always been given.
            icons: [
                {
                    src: `${baseUrl}/favicon.ico`,
                    mimeType: "image/x-icon",
                    sizes: ["16x16", "32x32", "48x48"],
                },
                {
                    src: `${baseUrl}/icon-192.png`,
                    mimeType: "image/png",
                    sizes: ["192x192"],
                },
                {
                    src: `${baseUrl}/icon-512.png`,
                    mimeType: "image/png",
                    sizes: ["512x512"],
                },
            ],
        },
        {
            // listChanged is explicitly false: v2 would advertise true by
            // default, but /mcp is stateless and refuses the SSE stream, so
            // there is never a channel to deliver a list_changed notification
            // on. Advertising it would invite hosts to wait for one (the
            // 2026-07-28 conformance suite warns on exactly this). A tool
            // surface change (set_widget_display) is picked up on reconnect.
            capabilities: {
                tools: { listChanged: false },
                resources: { listChanged: false },
            },
            instructions: SERVER_INSTRUCTIONS,
        },
    );
}

// The full server: the bare one plus this user's tools registered. `baseUrl` is
// the public origin the client reached us on (from the forwarding headers),
// used only to advertise the server icon.
//
// Exported for the web dashboard (src/dashboard-api.ts), which runs the same
// registered read tools in-process with `surface: "dashboard"` and an `only`
// filter naming just those tools and their widgets; /mcp never passes either.
export async function buildMcpServer(
    baseUrl: string,
    userId: string,
    protocolEra?: "legacy" | "modern",
    surface?: ToolSurface,
    only?: RegistrationFilter,
): Promise<McpServer> {
    const server = newMcpServer(baseUrl);

    // ONE `select * from profiles` for all three display preferences. The
    // getWidgetsEnabled / getAlcoholTrackingEnabled / getPreferredDrinkUnit
    // wrappers each run that identical query themselves, so calling all three
    // tripled it on the hot path of every single tool call; the *FromProfile
    // derivations are the pure halves, exported for exactly this. Alcohol
    // resolves to a drink unit only when tracking is on — null is what every
    // display path treats as "this user does not track alcohol" (storage is
    // never affected).
    const profile = await getProfile(userId);
    const drinkUnit = preferredDrinkUnitFromProfile(profile);

    registerTools(
        server,
        userId,
        widgetsEnabledFromProfile(profile),
        alcoholTrackingEnabledFromProfile(profile) ? (drinkUnit ?? "us") : null,
        protocolEra,
        {},
        widgetsExpandedFromProfile(profile),
        surface,
        only,
    );
    return server;
}

// The two modern-era methods the SDK answers from server identity and
// capabilities alone, without ever consulting a tool handler: `server/discover`
// (supportedVersions + capabilities + instructions) and `subscriptions/listen`
// (refused outright below, but the SDK still reads getCapabilities() and the
// serverInfo off the instance before refusing). Both are served from
// newMcpServer, skipping a Supabase profile read and ~38 tool registrations.
// server/discover is the FIRST request every negotiating client sends, so under
// Supabase pressure it was the probe that failed — for a response that contains
// nothing a registration produces.
//
// Safe only because a modern request cannot reach the factory with a header
// that disagrees with its body: classification rejects a Mcp-Method that names
// a different method than the body does, and validateStandardRequestHeaders
// rejects an absent one — both with -32020 / HTTP 400, both before the factory
// runs. Those checks exist on the modern leg only — the legacy fallback ignores
// the header entirely — hence the era guard.
const IDENTITY_ONLY_METHODS = new Set([
    "server/discover",
    "subscriptions/listen",
]);

// Dual-era /mcp entry. createMcpHandler serves the 2026-07-28 revision
// (per-request `_meta` envelope, `server/discover` instead of `initialize`, no
// protocol-level sessions) and, with the default `legacy: "stateless"`, still
// answers 2025-era traffic through exactly the idiom handleMcp used to hand-roll:
// a fresh transport with `sessionIdGenerator: undefined` plus a fresh McpServer
// from this same factory, torn down when the response completes. One factory
// backs both eras, so the tool surface cannot drift between them. Nothing is
// kept in-process between requests on either leg, which is what keeps deploys
// invisible to clients — there is no session to lose.
//
// The factory has no Hono context: the authenticated user arrives through the
// `authInfo` pass-through (`extra.userId`, set in handleMcp from the bearer
// middleware's verdict) and the public origin comes from the raw request.
// Observability only, and the instrument that makes retiring the legacy leg a
// measurable decision rather than a guess. The negotiated era is decided inside
// the SDK and surfaces in exactly one place — `ctx.era` on the factory context —
// so handleMcp passes a mutable holder down through the `authInfo` pass-through
// for the factory to stamp on the way through. When no request has logged
// era=legacy for a sustained window, flipping `legacy: "reject"` is safe.
//
// Requests refused before the factory runs (415, header/body mismatch,
// unsupported revision) never get stamped, and log without an era rather than a
// guessed one.
export type McpEraTrace = {
    era?: "legacy" | "modern";
    // The server built for this request, kept so handleMcp can read the client
    // identity the SDK resolved. Only readable AFTER the exchange: on the modern
    // leg the envelope backfills it per request, on the legacy leg only
    // `initialize` carries clientInfo at all.
    server?: McpServer;
};

const mcpHandler = createMcpHandler(
    async (ctx: McpRequestContext) => {
        const trace = ctx.authInfo?.extra?.trace as McpEraTrace | undefined;
        if (trace) trace.era = ctx.era;

        const userId = ctx.authInfo?.extra?.userId;
        if (typeof userId !== "string" || userId.length === 0) {
            // handleMcp always sets it; reaching here means the /mcp route was
            // wired without authenticateBearer, which must fail loudly rather
            // than serve an anonymous server.
            throw new Error(
                "mcp: request reached the handler without a userId",
            );
        }
        // requestInfo is set on both HTTP legs; the fallback only covers a
        // non-HTTP embedding of this factory (e.g. serveStdio), which never
        // reaches production.
        const baseUrl = ctx.requestInfo
            ? getBaseUrl(ctx.requestInfo)
            : "http://localhost";

        const mcpMethod = ctx.requestInfo?.headers.get("mcp-method") ?? "";
        if (ctx.era === "modern" && IDENTITY_ONLY_METHODS.has(mcpMethod)) {
            const bare = newMcpServer(baseUrl);
            if (trace) trace.server = bare;
            return bare;
        }

        const server = await buildMcpServer(baseUrl, userId, ctx.era);
        if (trace) trace.server = server;
        return server;
    },
    {
        legacy: "stateless",
        // The 2026-07-28 revision replaces the GET stream with POST
        // subscriptions/listen, which would otherwise be served as a long-lived
        // SSE stream — the same deploy-severed connection the 405 in handleMcp
        // exists to refuse, and one whose cap is per process, not per user.
        // Nothing here is subscribable anyway (listChanged is false), so the
        // limit is zero and the SDK answers every listen with -32603
        // "Subscription limit reached" without opening a stream. This is the
        // only refusal: a pre-check in handleMcp used to answer -32601 off the
        // Mcp-Method header alone, which pre-empted the SDK's 415 Content-Type
        // gate and its -32020 header/body cross-check (so a client that sent
        // the header on a tools/call POST was told the TOOL did not exist) and
        // disagreed with this code. IDENTITY_ONLY_METHODS keeps what that
        // pre-check was actually worth — the factory stays cheap for a listen.
        maxSubscriptions: 0,
        // A stack for anything that might be ours, one line for what is not.
        // The SDK routes server-factory throws — a Supabase outage inside
        // getProfile, a bad icon URL, a bug in registerTools — solely to
        // onerror on BOTH legs, so a message-only line here left on-call with
        // no idea what failed. A ProtocolError is by construction a rejection
        // the SDK is already answering on the wire with a typed JSON-RPC error
        // (unsupported revision, missing capability, header/body mismatch), and
        // the [req] access line already records its status, so those keep the
        // one-line form. Everything else logs its stack; the SDK also reports
        // some routine rejections as plain Errors, and their stacks are noise
        // we accept rather than risk swallowing a real fault.
        //
        // Never interpolated raw: the SDK's rejection messages embed
        // client-controlled header values verbatim (the Mcp-Name path decodes a
        // client-supplied base64 blob with a non-sanitizing TextDecoder), so a
        // raw message could carry newlines and forge fake "[req] 200 …" access
        // log lines. JSON.stringify escapes newlines and control characters,
        // and covers the stack too — which contains the same message.
        onerror: (err) =>
            console.error(
                `[mcp] ${JSON.stringify(
                    err instanceof ProtocolError
                        ? err.message
                        : (err.stack ?? err.message),
                )}`,
            ),
    },
);

// Stateless: /mcp holds no per-session state on either protocol era, so a
// restart/deploy can never strand a connected client.
//
// Only POST (JSON-RPC request/response) is served. We reject GET and DELETE
// ourselves with 405 so a GET never opens a long-lived standalone SSE stream,
// the one piece of state a deploy still severs. The handler's legacy fallback
// answers 405 too, with its own JSON-RPC error ("Method not allowed."), but
// without an `Allow` header — which is what this adds, alongside a message that
// tells the client why rather than just that. Since stateless mode never pushes
// server-initiated messages, that stream carries nothing; the only thing it does
// is die on every restart and leave some clients (observed: a Claude connector)
// wedged in a "connected but no tools" state. Refusing the stream (spec-allowed: a server
// MAY return 405 when it offers no SSE stream at this endpoint) means the client
// holds nothing that a deploy can break, so updates become truly invisible.
export const handleMcp = async (c: Context) => {
    if (c.req.method !== "POST") {
        return c.json(
            {
                jsonrpc: JSONRPC_VERSION,
                id: null,
                error: {
                    // The SDK's own 405 uses -32000 for exactly this; matching
                    // it keeps one wire code for "wrong HTTP method here"
                    // whichever leg answers. There is no exported constant for
                    // -32000 (the named ones are PARSE_ERROR, INVALID_REQUEST,
                    // METHOD_NOT_FOUND, INVALID_PARAMS, INTERNAL_ERROR) and
                    // none of them means this.
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

    // The handler never derives auth from headers: authInfo is pass-through,
    // and the only consumer is our own factory above. `extra.userId` is the
    // single authoritative carrier — the SDK-designated slot for application
    // data, which the factory reads behind a typeof guard because `extra` is
    // untyped. clientId is left blank on purpose: it is an OAuth field the SDK
    // documents as "the client ID associated with this token", not an
    // app-identity slot, and carrying the user id in both places left no way to
    // tell which one a future reader (or a future SDK feature) should trust.
    // Nothing on the serve path reads it. The real bearer token is deliberately
    // NOT forwarded either — nothing downstream needs it, and keeping it out of
    // the SDK's context means no handler or error path can echo it.
    const trace: McpEraTrace = {};
    const response = await mcpHandler.fetch(c.req.raw, {
        authInfo: {
            token: "",
            clientId: "",
            scopes: [],
            extra: { userId, trace },
        },
    });

    // Published for the access log in src/index.ts, which runs outermost and
    // reads this after next() resolves. Set after fetch resolves, which is
    // after the factory has run even when the response body is still streaming.
    if (trace.era) c.set("mcpEra", trace.era);
    const client = formatClientId(trace.server?.server.getClientVersion());
    if (client) c.set("mcpClient", client);
    return response;
};

// Aborts any in-flight 2026-era exchanges on shutdown. The legacy leg holds
// nothing between requests, so there is nothing of it to close.
export const closeMcpHandler = (): Promise<void> => mcpHandler.close();
