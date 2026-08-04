import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { withAnalytics } from "./analytics.js";
import {
    getFoodSearchService,
    summarizeFoodCandidate,
} from "./food-providers/service.js";
import type { FoodProviderFailure } from "./food-providers/registry.js";
import type { FoodCandidate, NutrientValues } from "./food-providers/types.js";

const nutrientOutputSchema = z.object({
    calories: z.number().nullable(),
    protein_g: z.number().nullable(),
    carbs_g: z.number().nullable(),
    fat_g: z.number().nullable(),
    fiber_g: z.number().nullable(),
    sugar_g: z.number().nullable(),
    alcohol_g: z.number().nullable(),
    sodium_mg: z.number().nullable(),
    saturated_fat_g: z.number().nullable(),
    cholesterol_mg: z.number().nullable(),
    potassium_mg: z.number().nullable(),
});

const candidateSummarySchema = z.object({
    candidate_id: z.string(),
    name: z.string(),
    brand: z.string().nullable(),
    provider: z.enum(["usda", "open_food_facts"]),
    provider_label: z.string(),
    data_kind: z.enum([
        "generic",
        "branded",
        "packaged",
        "restaurant",
        "unknown",
    ]),
    barcode: z.string().nullable(),
    confidence: z.number(),
    default_portion: z
        .object({
            id: z.string(),
            label: z.string(),
            calories: z.number().nullable(),
            protein_g: z.number().nullable(),
            carbs_g: z.number().nullable(),
            fat_g: z.number().nullable(),
        })
        .nullable(),
});

const providerFailureSchema = z.object({
    provider: z.enum(["usda", "open_food_facts"]),
    code: z.enum([
        "invalid_request",
        "not_found",
        "rate_limited",
        "provider_unavailable",
        "invalid_provider_response",
        "configuration_missing",
    ]),
    message: z.string(),
    retry_after_seconds: z.number().nullable(),
});

const fullCandidateSchema = z.object({
    candidate_id: z.string(),
    name: z.string(),
    brand: z.string().nullable(),
    provider: z.enum(["usda", "open_food_facts"]),
    provider_food_id: z.string(),
    provider_label: z.string(),
    source_url: z.string().nullable(),
    source_license: z.string().nullable(),
    source_updated_at: z.string().nullable(),
    data_kind: z.enum([
        "generic",
        "branded",
        "packaged",
        "restaurant",
        "unknown",
    ]),
    barcode: z.string().nullable(),
    confidence: z.number(),
    nutrients_per_100g: nutrientOutputSchema.nullable(),
    portions: z.array(
        z.object({
            id: z.string(),
            amount: z.number(),
            unit: z.string(),
            label: z.string(),
            gram_weight: z.number().nullable(),
            nutrients: nutrientOutputSchema,
        }),
    ),
});

function serializeNutrients(nutrients: NutrientValues) {
    return {
        calories: nutrients.calories ?? null,
        protein_g: nutrients.protein_g ?? null,
        carbs_g: nutrients.carbs_g ?? null,
        fat_g: nutrients.fat_g ?? null,
        fiber_g: nutrients.fiber_g ?? null,
        sugar_g: nutrients.sugar_g ?? null,
        alcohol_g: nutrients.alcohol_g ?? null,
        sodium_mg: nutrients.sodium_mg ?? null,
        saturated_fat_g: nutrients.saturated_fat_g ?? null,
        cholesterol_mg: nutrients.cholesterol_mg ?? null,
        potassium_mg: nutrients.potassium_mg ?? null,
    };
}

export function serializeFoodCandidate(candidate: FoodCandidate) {
    return {
        candidate_id: `${candidate.provider}:${encodeURIComponent(candidate.providerFoodId)}`,
        name: candidate.name,
        brand: candidate.brand ?? null,
        provider: candidate.provider,
        provider_food_id: candidate.providerFoodId,
        provider_label: candidate.attribution.label,
        source_url: candidate.attribution.url ?? null,
        source_license: candidate.attribution.license ?? null,
        source_updated_at: candidate.sourceUpdatedAt ?? null,
        data_kind: candidate.dataKind,
        barcode: candidate.barcode ?? null,
        confidence: candidate.confidence,
        nutrients_per_100g: candidate.nutrientsPer100g
            ? serializeNutrients(candidate.nutrientsPer100g)
            : null,
        portions: candidate.portions.map((portion) => ({
            id: portion.id,
            amount: portion.amount,
            unit: portion.unit,
            label: portion.label,
            gram_weight: portion.gramWeight ?? null,
            nutrients: serializeNutrients(portion.nutrients),
        })),
    };
}

function formatCandidate(candidate: FoodCandidate, index?: number): string {
    const summary = summarizeFoodCandidate(candidate);
    const prefix = index === undefined ? "" : `${index + 1}. `;
    const title = summary.brand
        ? `${summary.brand} — ${summary.name}`
        : summary.name;
    const portion = summary.default_portion;
    const macros = portion
        ? [
              portion.calories == null ? null : `${portion.calories} kcal`,
              portion.protein_g == null
                  ? null
                  : `${portion.protein_g}g protein`,
              portion.carbs_g == null ? null : `${portion.carbs_g}g carbs`,
              portion.fat_g == null ? null : `${portion.fat_g}g fat`,
          ]
              .filter(Boolean)
              .join(" · ")
        : "nutrition details available after selection";
    return `${prefix}${title}\n   ${portion?.label ?? "No declared serving"}: ${macros}\n   Source: ${summary.provider_label} · candidate_id: ${summary.candidate_id}`;
}

function serializeFailures(failures: FoodProviderFailure[]) {
    return failures.map((failure) => ({
        provider: failure.provider,
        code: failure.code,
        message: failure.message,
        retry_after_seconds: failure.retryAfterSeconds ?? null,
    }));
}

export function registerFoodTools(server: McpServer, userId: string): void {
    // Keep the expensive MCP SDK schema generic out of the native compiler's
    // hot path; runtime registration and MCP integration tests still validate
    // the complete schemas.
    const toolServer = server as unknown as {
        registerTool: (
            name: string,
            config: unknown,
            handler: (...args: any[]) => unknown,
        ) => unknown;
    };
    const service = getFoodSearchService();

    toolServer.registerTool(
        "search_foods",
        {
            title: "Search Verified Foods",
            description:
                "Search USDA FoodData Central and Open Food Facts for generic or branded foods before estimating nutrition. Return several source-labelled candidates when the phrase is ambiguous; use get_food_details with the selected candidate_id to inspect all portions and nutrients. Prefer a user's explicit brand and package details, and do not silently treat a search result as confirmed.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: {
                query: z.string().min(1).max(200),
                limit: z.coerce.number().int().min(1).max(25).optional(),
            },
            outputSchema: {
                query: z.string(),
                candidates: z.array(candidateSummarySchema),
                provider_failures: z.array(providerFailureSchema),
            },
        },
        async ({ query, limit }) =>
            withAnalytics(
                "search_foods",
                async () => {
                    const result = await service.search(query, limit ?? 10);
                    const candidates = result.candidates.map(
                        summarizeFoodCandidate,
                    );
                    const failures = serializeFailures(result.failures);
                    const failureNote = failures.length
                        ? `\n\nSome sources were unavailable: ${failures
                              .map(
                                  (failure) =>
                                      `${failure.provider} (${failure.code})`,
                              )
                              .join(", ")}. The results above are still usable.`
                        : "";
                    return {
                        content: [
                            {
                                type: "text",
                                text:
                                    candidates.length === 0
                                        ? `No verified food records found for "${query}".${failureNote}`
                                        : `${result.candidates
                                              .map(formatCandidate)
                                              .join("\n\n")}${failureNote}`,
                            },
                        ],
                        structuredContent: {
                            query,
                            candidates,
                            provider_failures: failures,
                        },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "get_food_details",
        {
            title: "Get Food Details",
            description:
                "Resolve a candidate_id returned by search_foods and return all available household portions, per-100g nutrition, source attribution, and confidence. Use these values only after confirming the selected food and portion with the user.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: {
                candidate_id: z.string().min(3).max(300),
            },
            outputSchema: {
                found: z.boolean(),
                food: fullCandidateSchema.nullable(),
            },
        },
        async ({ candidate_id }) =>
            withAnalytics(
                "get_food_details",
                async () => {
                    const candidate = await service.details(candidate_id);
                    const food = candidate
                        ? serializeFoodCandidate(candidate)
                        : null;
                    return {
                        content: [
                            {
                                type: "text",
                                text: candidate
                                    ? formatCandidate(candidate)
                                    : "That food candidate is invalid or no longer available. Run search_foods again.",
                            },
                        ],
                        structuredContent: {
                            found: candidate !== null,
                            food,
                        },
                    };
                },
                { userId },
            ),
    );

    toolServer.registerTool(
        "lookup_food_barcode",
        {
            title: "Look Up Food Barcode",
            description:
                "Look up a packaged food barcode across Open Food Facts and USDA. Transcribe the digits printed below the barcode, then use this tool before estimating. If multiple verified records disagree, present the options and ask the user which label matches their package.",
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: true,
            },
            inputSchema: {
                barcode: z.string().min(8).max(40),
            },
            outputSchema: {
                barcode: z.string(),
                candidates: z.array(fullCandidateSchema),
                provider_failures: z.array(providerFailureSchema),
            },
        },
        async ({ barcode }) =>
            withAnalytics(
                "lookup_food_barcode",
                async () => {
                    const digits = barcode.replace(/\D/g, "");
                    const result = await service.barcode(digits);
                    const candidates = result.candidates.map(
                        serializeFoodCandidate,
                    );
                    const failures = serializeFailures(result.failures);
                    return {
                        content: [
                            {
                                type: "text",
                                text:
                                    result.candidates.length === 0
                                        ? `No verified product found for barcode ${digits}.`
                                        : result.candidates
                                              .map(formatCandidate)
                                              .join("\n\n"),
                            },
                        ],
                        structuredContent: {
                            barcode: digits,
                            candidates,
                            provider_failures: failures,
                        },
                    };
                },
                { userId },
            ),
    );
}
