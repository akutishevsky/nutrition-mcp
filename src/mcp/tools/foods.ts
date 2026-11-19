import { z } from "zod";
import { categorizeError, withAnalytics } from "../../analytics.js";
import { ToolError } from "../../errors.js";
import {
    formatFoodResult,
    lookupBarcode,
    normalizeBarcode,
} from "../../foods.js";
import { getUserTimezone } from "../../supabase.js";
import { formatUsdaRecord, formatUsdaSearch } from "../../usda-text.js";
import {
    getFoodRecord,
    sanitizeQuery,
    searchUsda,
    USDA_AUTH_FAILED_TEXT,
    USDA_BAD_QUERY_TEXT,
    USDA_NO_MATCH_TEXT,
    USDA_NO_RECORD_TEXT,
    usdaUnavailableText,
} from "../../usda.js";
import type { ToolContext } from "../context.js";
import { offNotFoundText, offUnreachableText } from "../formatters.js";

export function registerFoodsTools(ctx: ToolContext): void {
    const {
        server,
        userId,
        widgetsEnabled,
        alcohol,
        analytics,
        usdaOverrides,
        uiMeta,
        withWidgetPrefs,
    } = ctx;
    server.registerTool(
        "lookup_barcode",
        {
            title: "Look Up Barcode",
            description:
                "Look up a packaged product's label nutrition by barcode via Open Food Facts. The figures are transcribed from the product's own label by the Open Food Facts community. This server does not verify them, and they can be wrong, stale, or missing entirely. Pass the barcode digits (EAN/UPC, 8–14 digits). The user can type them, or they can be read from a photo of the package: the human-readable digits printed beneath the barcode. Returns the product name, serving, and macros, which log_meal accepts once scaled to the amount eaten. When Open Food Facts has computed them, it also returns the Nutri-Score (A–E, a nutritional-quality grade) and NOVA group (1–4, how processed the product is); they are omitted, not \"n/a\", when no value has been computed for that product. A fiber, sugar, added-sugar or saturated-fat figure shown as n/a is missing data, not a zero: any value passed for it later is an estimate. A saturated-fat, trans-fat or sodium figure shown as n/a is left out rather than sent as 0. Sodium is shown in milligrams of sodium, not salt. Open Food Facts carries no caffeine, so caffeine_mg for a coffee, tea, cola, energy drink or other caffeinated product comes from the label where available, otherwise from typical amounts. When no product is found, the result says so; the product description, or a label the user shares, can supply the figures instead.",
            annotations: {
                title: "Look Up Barcode",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: z.object({
                barcode: z
                    .string()
                    .describe(
                        "Product barcode digits (EAN-8/13, UPC-A/E, or GTIN-14). Spaces and separators are ignored.",
                    ),
            }),
        },
        async ({ barcode }) => {
            // lookupBarcode's own failures (OFF down, timeout, bad config) are
            // caught below and turned into a normal (non-isError) content
            // response so the model can fall back to estimating — but that
            // means withAnalytics never sees a thrown error. Without this flag
            // an OFF outage silently records as `success: true`, which is how
            // it stayed invisible to tool_analytics entirely.
            // Safe only because withAnalytics awaits the handler to
            // completion before reading this via `outcome` below — it is not
            // read concurrently with the handler running.
            let offFailure: string | null = null;
            return withAnalytics(
                "lookup_barcode",
                async () => {
                    const normalized = normalizeBarcode(barcode);
                    if (!normalized) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `"${barcode}" is not a valid barcode (expected 8–14 digits). Double-check the number. The macros can still come from the product description or a label the user shares.`,
                                },
                            ],
                        };
                    }

                    let food;
                    try {
                        food = await lookupBarcode(normalized);
                    } catch (err) {
                        const msg =
                            err instanceof Error ? err.message : String(err);
                        // Route through the same categorizeError used for
                        // thrown errors elsewhere, so a config problem
                        // ("OFF_USER_AGENT is not configured") or an OFF rate
                        // limit lands in service_misconfigured/rate_limited
                        // instead of a generic bucket local to this tool.
                        const category = categorizeError(err);
                        offFailure =
                            category === "unknown"
                                ? "external_api_error"
                                : category;
                        // The OFF message stays server-side: it is
                        // third-party text, and the model can't act on it.
                        // JSON-escaped so it can't forge log lines.
                        console.warn(
                            `[lookup_barcode] off-failure=${offFailure}: ${JSON.stringify(msg)}`,
                        );
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: offUnreachableText(),
                                },
                            ],
                        };
                    }

                    if (!food) {
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: offNotFoundText(normalized),
                                },
                            ],
                        };
                    }

                    return {
                        content: [
                            {
                                type: "text",
                                text: formatFoodResult(food, alcohol),
                            },
                        ],
                    };
                },
                analytics,
                { barcode },
                {
                    outcome: () =>
                        offFailure
                            ? { success: false, errorCategory: offFailure }
                            : { success: true },
                },
            );
        },
    );

    // The USDA tools' shared pieces. A pause, reserve or per-user cap is a
    // normal result that names when USDA opens again (in the user's timezone
    // when it is cheap to read, UTC otherwise); only an upstream failure is an
    // error, and it carries the usda_unavailable category.
    const usdaText = (text: string) => ({
        content: [{ type: "text" as const, text }],
    });
    const usdaUnavailable = async (until: number | null): Promise<string> => {
        if (until === null) return usdaUnavailableText(null);
        const tz = await getUserTimezone(userId).catch(() => null);
        return usdaUnavailableText(until, tz);
    };

    server.registerTool(
        "search_foods",
        {
            title: "Search Generic Foods",
            description:
                "Searches USDA FoodData Central generic foods (Foundation, SR Legacy and Survey/FNDDS records) by English food name and returns up to 10 candidates, each with its FoodData Central id, USDA description, data type and energy and macros per 100 g. Matches use USDA's English wording (e.g. 'cooked, boiled'). Search results are not stored; get_food_macros returns the full record for one id.",
            annotations: {
                title: "Search Generic Foods",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: z.object({
                query: z
                    .string()
                    .describe(
                        "A food name in English, for example 'banana' or 'cooked oats'. 1 to 200 characters.",
                    ),
            }),
        },
        async ({ query }) => {
            // An upstream failure (a thrown UpstreamError) reaches withAnalytics
            // as an error; a pause or a refused key is a normal result, so it
            // is flagged here for the analytics row.
            let usdaFailure: string | null = null;
            return withAnalytics(
                "search_foods",
                async () => {
                    const q = query.trim();
                    if (q.length < 1 || q.length > 200) {
                        throw new ToolError(
                            "The food name must be 1 to 200 characters.",
                        );
                    }
                    if (sanitizeQuery(q) === "") {
                        throw new ToolError(
                            "The food name needs letters or digits, for example 'banana'.",
                        );
                    }
                    const outcome = await searchUsda(q, userId, usdaOverrides);
                    switch (outcome.status) {
                        case "ok":
                            return usdaText(
                                outcome.candidates.length > 0
                                    ? formatUsdaSearch(outcome.candidates)
                                    : USDA_NO_MATCH_TEXT,
                            );
                        case "no_match":
                            return usdaText(USDA_NO_MATCH_TEXT);
                        case "bad_query":
                            return usdaText(USDA_BAD_QUERY_TEXT);
                        case "auth_failed":
                            usdaFailure = "usda_unavailable";
                            return usdaText(USDA_AUTH_FAILED_TEXT);
                        case "unavailable":
                            return usdaText(
                                await usdaUnavailable(outcome.until),
                            );
                    }
                },
                analytics,
                undefined,
                {
                    outcome: () =>
                        usdaFailure
                            ? { success: false, errorCategory: usdaFailure }
                            : { success: true },
                },
            );
        },
    );

    server.registerTool(
        "get_food_macros",
        {
            title: "Get Food Macros",
            description:
                "Returns USDA FoodData Central values for one generic food by its FoodData Central id: per 100 g, and scaled to amount_g when given, with the portion sizes USDA lists. A nutrient USDA does not record for the food is reported as not recorded, never as zero. Includes the food_ref the meal tools accept for these values.",
            annotations: {
                title: "Get Food Macros",
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: z.object({
                fdc_id: z.coerce
                    .number()
                    .describe(
                        "The FoodData Central id (fdcId) of the food, as search_foods returned it.",
                    ),
                amount_g: z.coerce
                    .number()
                    .optional()
                    .describe(
                        "Grams to scale the values to, above 0 and at most 5000. Omit for the values per 100 g only.",
                    ),
            }),
        },
        async ({ fdc_id, amount_g }) => {
            let usdaFailure: string | null = null;
            return withAnalytics(
                "get_food_macros",
                async () => {
                    if (!Number.isSafeInteger(fdc_id) || fdc_id <= 0) {
                        throw new ToolError(
                            "fdc_id must be a positive whole number: the FoodData Central id that search_foods returns.",
                        );
                    }
                    if (
                        amount_g !== undefined &&
                        !(amount_g > 0 && amount_g <= 5000)
                    ) {
                        throw new ToolError(
                            "amount_g must be more than 0 and at most 5000 grams.",
                        );
                    }
                    const outcome = await getFoodRecord(
                        fdc_id,
                        userId,
                        usdaOverrides,
                    );
                    switch (outcome.status) {
                        case "ok":
                        case "cache":
                            return usdaText(
                                formatUsdaRecord(
                                    outcome.record,
                                    amount_g ?? null,
                                ),
                            );
                        case "no_match":
                            return usdaText(USDA_NO_RECORD_TEXT);
                        case "auth_failed":
                            usdaFailure = "usda_unavailable";
                            return usdaText(USDA_AUTH_FAILED_TEXT);
                        case "unavailable":
                            return usdaText(
                                await usdaUnavailable(outcome.until),
                            );
                    }
                },
                analytics,
                undefined,
                {
                    outcome: () =>
                        usdaFailure
                            ? { success: false, errorCategory: usdaFailure }
                            : { success: true },
                },
            );
        },
    );
}
