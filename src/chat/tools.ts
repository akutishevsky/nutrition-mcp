import { getFoodSearchService } from "../food-providers/service.js";
import type { FoodSearchService } from "../food-providers/service.js";
import { groundMealPhotoItems } from "../meal-photo/grounding.js";
import type { MealPhotoVisionItem } from "../meal-photo/vision.js";
import type {
    ChatToolHost,
    McpToolCallResult,
    McpToolDefinition,
} from "./mcp-host.js";

/**
 * Chat v2 tool surface — derivation, exclusions, and execution policy.
 *
 * PARITY LAW (chat-v2 brief, item 0): the chat agent's tools are
 * DERIVED from the same tool definitions the MCP server publishes —
 * never a hand-maintained second list. `deriveChatToolDefinitions`
 * takes the built server's own tools/list output and subtracts only
 * CHAT_TOOL_EXCLUSIONS below. A CI parity check (scripts/
 * chat-v2-smoke.ts against a real database, plus the unit tests in
 * tools.test.ts) enumerates both lists and fails on any divergence
 * beyond this exclusion list, so a future MCP tool addition flows
 * into chat automatically and a rename cannot silently fork the
 * surfaces.
 *
 * SCOPE (brief decision 2): all READ tools + DRAFT-WRITE tools only.
 * Draft-class writes create or edit a draft, review, or proposal
 * that the user must explicitly confirm in the app before anything
 * commits; the agent never confirms a log, never deletes, and never
 * changes account state. The single scoped exception, recorded here
 * for review: `add_grocery_items` — the brief names "grocery-list
 * adds as proposals" in launch scope; a grocery add is fully
 * reversible, moves no value, and lands on a list the user sees, so
 * it is allowed while every other direct-commit write is excluded
 * (including `confirm_plan_groceries`, the commit half of the
 * plan-groceries flow, whose preview the agent may still run).
 */

export interface ChatModelTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}

export interface ChatToolExecution {
    /** Model-facing result text (capped). */
    text: string;
    isError: boolean;
    outcome: "ok" | "error" | "rejected";
    /** Meal draft created by this call, when the result carries one. */
    draftId?: string;
}

export type ChatToolExclusionCategory =
    "direct_commit" | "destructive" | "gateway_meta";

export interface ChatToolExclusion {
    name: string;
    category: ChatToolExclusionCategory;
    reason: string;
}

const COMMIT =
    "Direct-commit write: persists a real record in the same call. Chat v2 is draft-class only (brief decision 2); the user performs this step in the app.";
const DESTRUCTIVE =
    "Destructive: deletes data. Never available to the chat agent (brief decision 2).";

/**
 * THE EXCLUSION LIST — the only permitted divergence between the MCP
 * server's published tools and the chat agent's registry. Every entry
 * names a tool that exists in the published catalog (the parity check
 * fails if one does not), with the reason it stays out. Classification
 * per the wave-6 tool inventory (115 published tools: 51 read,
 * 14 draft-write, 42 commit-write, 7 destructive, 1 dispatcher plus
 * its discovery sibling).
 */
export const CHAT_TOOL_EXCLUSIONS: readonly ChatToolExclusion[] = [
    // — Direct-commit writes: meals and imports —
    { name: "log_meal", category: "direct_commit", reason: COMMIT },
    { name: "bulk_import_meals", category: "direct_commit", reason: COMMIT },
    { name: "update_meal", category: "direct_commit", reason: COMMIT },
    {
        name: "confirm_meal_draft",
        category: "direct_commit",
        reason: "THE commit step of the draft flow: turns a prepared draft into a logged meal. The agent prepares drafts; only the user confirms them.",
    },
    { name: "log_recipe", category: "direct_commit", reason: COMMIT },
    { name: "log_cook_portion", category: "direct_commit", reason: COMMIT },
    // — Direct-commit writes: water and weight (no draft flow exists) —
    { name: "log_water", category: "direct_commit", reason: COMMIT },
    { name: "update_water", category: "direct_commit", reason: COMMIT },
    { name: "log_weight", category: "direct_commit", reason: COMMIT },
    { name: "update_weight", category: "direct_commit", reason: COMMIT },
    // — Direct-commit writes: goals, guidance commits, settings —
    { name: "set_nutrition_goals", category: "direct_commit", reason: COMMIT },
    {
        name: "set_guidance_preferences",
        category: "direct_commit",
        reason: COMMIT,
    },
    {
        name: "commit_goal_change",
        category: "direct_commit",
        reason: "Commit step for preview_goal_change proposals. The agent may preview; the user commits.",
    },
    { name: "set_weight_unit", category: "direct_commit", reason: COMMIT },
    { name: "set_widget_display", category: "direct_commit", reason: COMMIT },
    { name: "set_alcohol_tracking", category: "direct_commit", reason: COMMIT },
    { name: "set_timezone", category: "direct_commit", reason: COMMIT },
    // — Direct-commit writes: saved foods —
    { name: "save_food", category: "direct_commit", reason: COMMIT },
    { name: "mark_saved_food_used", category: "direct_commit", reason: COMMIT },
    // — Direct-commit writes: recipes, planning, groceries —
    { name: "save_recipe", category: "direct_commit", reason: COMMIT },
    { name: "update_recipe", category: "direct_commit", reason: COMMIT },
    {
        name: "save_recipe_and_plan",
        category: "direct_commit",
        reason: COMMIT,
    },
    { name: "save_meal_as_recipe", category: "direct_commit", reason: COMMIT },
    { name: "save_cook_as_recipe", category: "direct_commit", reason: COMMIT },
    { name: "schedule_recipe", category: "direct_commit", reason: COMMIT },
    {
        name: "mark_grocery_item_purchased",
        category: "direct_commit",
        reason: COMMIT,
    },
    {
        name: "commit_meal_plan_draft",
        category: "direct_commit",
        reason: "Commit step for meal-plan drafts. The agent may build and edit plan drafts; the user commits them to the calendar.",
    },
    {
        name: "confirm_plan_groceries",
        category: "direct_commit",
        reason: "Commit step for previewed plan groceries. The agent may preview; the user confirms the add.",
    },
    { name: "commit_meal_swap", category: "direct_commit", reason: COMMIT },
    { name: "undo_meal_swap", category: "direct_commit", reason: COMMIT },
    // — Direct-commit writes: cooks (persistent records, no draft) —
    { name: "start_cook", category: "direct_commit", reason: COMMIT },
    { name: "update_cook", category: "direct_commit", reason: COMMIT },
    { name: "update_cook_dish", category: "direct_commit", reason: COMMIT },
    { name: "correct_cook_event", category: "direct_commit", reason: COMMIT },
    { name: "finish_cook", category: "direct_commit", reason: COMMIT },
    { name: "reopen_cook", category: "direct_commit", reason: COMMIT },
    { name: "repeat_cook", category: "direct_commit", reason: COMMIT },
    { name: "record_cook_result", category: "direct_commit", reason: COMMIT },
    { name: "set_preferred_cook", category: "direct_commit", reason: COMMIT },
    // — Direct-commit writes: pantry reconciliation —
    {
        name: "reconcile_pantry",
        category: "direct_commit",
        reason: "Applies pantry operations (including consume/discard) immediately. The agent reads the pantry and proposes; the user reconciles.",
    },
    { name: "reconcile_purchase", category: "direct_commit", reason: COMMIT },
    // — Destructive —
    { name: "delete_meal", category: "destructive", reason: DESTRUCTIVE },
    { name: "delete_water", category: "destructive", reason: DESTRUCTIVE },
    { name: "delete_weight", category: "destructive", reason: DESTRUCTIVE },
    { name: "delete_saved_food", category: "destructive", reason: DESTRUCTIVE },
    { name: "delete_recipe", category: "destructive", reason: DESTRUCTIVE },
    { name: "delete_cook", category: "destructive", reason: DESTRUCTIVE },
    {
        name: "delete_account",
        category: "destructive",
        reason: "Irreversibly deletes the whole account. Never available to any agent surface.",
    },
    // — Gateway meta-tools —
    {
        name: "find_munch_actions",
        category: "gateway_meta",
        reason: "Discovery front-end for run_munch_action. The chat registry offers every allowed tool directly, so the gateway indirection is unnecessary — and excluding the pair keeps the chat surface enumerable for the parity check.",
    },
    {
        name: "run_munch_action",
        category: "gateway_meta",
        reason: "Dispatcher that can invoke every model-private action, including direct-commit and destructive ones (up to delete_account). Allowing it would void the draft-class fence; allowed private tools are offered to the agent directly instead.",
    },
];

export const CHAT_EXCLUDED_TOOL_NAMES: ReadonlySet<string> = new Set(
    CHAT_TOOL_EXCLUSIONS.map((entry) => entry.name),
);

/**
 * Derive the chat agent's model-facing tools from the MCP server's
 * published definitions: everything published, minus the exclusion
 * list. Pure and synchronous so the parity check can exercise it
 * against any enumerated catalog.
 */
export function deriveChatToolDefinitions(published: McpToolDefinition[]): {
    tools: ChatModelTool[];
    excludedPresent: string[];
} {
    const tools: ChatModelTool[] = [];
    const excludedPresent: string[] = [];
    for (const tool of published) {
        if (CHAT_EXCLUDED_TOOL_NAMES.has(tool.name)) {
            excludedPresent.push(tool.name);
            continue;
        }
        tools.push({
            name: tool.name,
            description: tool.description ?? tool.title ?? tool.name,
            inputSchema: tool.inputSchema,
        });
    }
    return { tools, excludedPresent };
}

// ---------------------------------------------------------------------------
// Grounding guard
//
// The meal draft/review tools accept caller-supplied nutrition and
// store it verbatim — that is the MCP trust model, where the caller
// is the user's own AI working from search results. The in-app chat
// model is held to the chat grounding law instead: it may not
// ORIGINATE nutrition values. The guard enforces that at execution:
//
// - An item citing provider nutrition must cite a (provider,
//   provider_food_id) reference HARVESTED from a tool result earlier
//   in the same turn (a search, a details call, a saved-food or meal
//   read). A fabricated or remembered reference is rejected before
//   the tool ever runs — no draft is created.
// - An item carrying nutrition values with no provider reference
//   (model_estimate / user_supplied / unlabelled) is rejected: in
//   chat, numbers come from Munch's catalogs, not from the model.
// - An item with NO nutrition and NO reference is grounded by the
//   server first, through the same deterministic path the photo
//   pipeline uses (groundMealPhotoItems: local catalog → USDA +
//   Open Food Facts). Grounded items are rewritten with the
//   provider's values and provenance; items that cannot be grounded
//   enter the draft valueless with the pipeline's blocking question,
//   exactly as chat v1 behaved — the shared confirm path then
//   refuses to confirm until the user resolves them.
// ---------------------------------------------------------------------------

export const CHAT_TOOL_CALL_TIMEOUT_MS = 20_000;
const MAX_TOOL_RESULT_CHARS = 16_000;

const GUARDED_ITEM_TOOLS: ReadonlySet<string> = new Set([
    "prepare_meal_review",
    "resolve_meal_review",
    "upsert_meal_draft_item",
]);

const PROVIDER_SOURCE_TYPES: ReadonlySet<string> = new Set([
    "usda",
    "open_food_facts",
    "published_restaurant",
    "saved_food",
    "past_meal",
    "legacy_aggregate",
]);

interface MealItemLike {
    record: Record<string, unknown>;
    name: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function itemHasValues(item: Record<string, unknown>): boolean {
    const nutrients = item.nutrients;
    if (!isRecord(nutrients)) return false;
    return Object.values(nutrients).some(
        (value) => typeof value === "number" && Number.isFinite(value),
    );
}

function itemReference(item: Record<string, unknown>): string | null {
    const provider = item.provider;
    const providerFoodId = item.provider_food_id ?? item.providerFoodId;
    if (
        typeof provider === "string" &&
        provider &&
        typeof providerFoodId === "string" &&
        providerFoodId
    ) {
        return `${provider}${providerFoodId}`;
    }
    return null;
}

/** Find every meal-item-shaped object anywhere in a tool call's args. */
function findMealItems(value: unknown, found: MealItemLike[]): void {
    if (Array.isArray(value)) {
        for (const entry of value) findMealItems(entry, found);
        return;
    }
    if (!isRecord(value)) return;
    if (
        typeof value.name === "string" &&
        (isRecord(value.nutrients) || typeof value.source_type === "string")
    ) {
        found.push({ record: value, name: value.name });
    }
    for (const entry of Object.values(value)) findMealItems(entry, found);
}

/** Harvest provider references + candidate ids from a tool result. */
export function harvestGroundedReferences(
    value: unknown,
    providerRefs: Set<string>,
    candidateIds: Set<string>,
): void {
    if (Array.isArray(value)) {
        for (const entry of value)
            harvestGroundedReferences(entry, providerRefs, candidateIds);
        return;
    }
    if (!isRecord(value)) return;
    const candidateId = value.candidate_id ?? value.candidateId;
    if (typeof candidateId === "string" && candidateId) {
        candidateIds.add(candidateId);
    }
    const reference = itemReference(value);
    if (reference) providerRefs.add(reference);
    for (const entry of Object.values(value))
        harvestGroundedReferences(entry, providerRefs, candidateIds);
}

function resultToText(result: McpToolCallResult): string {
    if (result.structuredContent) {
        return JSON.stringify(result.structuredContent);
    }
    const parts: string[] = [];
    for (const block of result.content ?? []) {
        if (typeof block.text === "string") parts.push(block.text);
    }
    return parts.join("\n");
}

function truncateText(text: string): string {
    if (text.length <= MAX_TOOL_RESULT_CHARS) return text;
    return `${text.slice(0, MAX_TOOL_RESULT_CHARS)}\n…[result truncated]`;
}

function extractDraftId(result: McpToolCallResult): string | undefined {
    const structured = result.structuredContent;
    if (!structured) return undefined;
    const review = structured.review;
    if (isRecord(review) && typeof review.id === "string") return review.id;
    const draft = structured.draft;
    if (isRecord(draft) && typeof draft.id === "string") return draft.id;
    if (typeof structured.draft_id === "string") return structured.draft_id;
    return undefined;
}

export interface ChatToolExecutorDependencies {
    host: ChatToolHost;
    search?: Pick<FoodSearchService, "search">["search"];
    toolCallTimeoutMs?: number;
}

/**
 * The executing half of the chat tool surface: wraps the in-process
 * MCP host with the exclusion fence (defense in depth — the model is
 * never offered excluded tools, and a hallucinated call to one is
 * rejected here), the grounding guard, per-call timeouts, result
 * capping, and grounded-reference tracking for the turn.
 */
export class ChatToolExecutor {
    private readonly host: ChatToolHost;
    private readonly search: Pick<FoodSearchService, "search">["search"];
    private readonly timeoutMs: number;
    private readonly providerRefs = new Set<string>();
    private readonly candidateIds = new Set<string>();

    constructor(dependencies: ChatToolExecutorDependencies) {
        this.host = dependencies.host;
        const foodSearch = getFoodSearchService();
        this.search =
            dependencies.search ??
            ((query, limit) => foodSearch.search(query, limit));
        this.timeoutMs =
            dependencies.toolCallTimeoutMs ?? CHAT_TOOL_CALL_TIMEOUT_MS;
    }

    private rejected(text: string): ChatToolExecution {
        return { text, isError: true, outcome: "rejected" };
    }

    async execute(
        name: string,
        args: Record<string, unknown>,
    ): Promise<ChatToolExecution> {
        if (CHAT_EXCLUDED_TOOL_NAMES.has(name)) {
            return this.rejected(
                `Tool "${name}" is not available to the Munch chat agent. The agent can read data and prepare drafts, but it cannot commit changes, delete data, or change account settings. Offer the user the closest draft or read instead.`,
            );
        }

        let effectiveArgs = args;
        if (GUARDED_ITEM_TOOLS.has(name)) {
            const guarded = await this.guardMealItems(name, args);
            if ("rejection" in guarded) return this.rejected(guarded.rejection);
            effectiveArgs = guarded.args;
        }

        let result: McpToolCallResult;
        try {
            result = await Promise.race([
                this.host.callTool(name, effectiveArgs),
                new Promise<never>((_, reject) =>
                    setTimeout(
                        () =>
                            reject(
                                new Error(
                                    `Tool "${name}" timed out after ${this.timeoutMs}ms`,
                                ),
                            ),
                        this.timeoutMs,
                    ),
                ),
            ]);
        } catch (error) {
            return {
                text: `Error: ${error instanceof Error ? error.message : "The tool call failed."}`,
                isError: true,
                outcome: "error",
            };
        }

        if (result.structuredContent) {
            harvestGroundedReferences(
                result.structuredContent,
                this.providerRefs,
                this.candidateIds,
            );
        }
        for (const block of result.content ?? []) {
            if (typeof block.text !== "string") continue;
            try {
                harvestGroundedReferences(
                    JSON.parse(block.text),
                    this.providerRefs,
                    this.candidateIds,
                );
            } catch {
                // Plain-text results carry no structured references.
            }
        }

        const text = truncateText(resultToText(result));
        return {
            text,
            isError: Boolean(result.isError),
            outcome: result.isError ? "error" : "ok",
            draftId: result.isError ? undefined : extractDraftId(result),
        };
    }

    /**
     * Apply the grounding guard to a draft/review tool call. Returns
     * the (possibly rewritten) args, or a rejection the model must
     * recover from. Name-only items are grounded server-side here.
     */
    private async guardMealItems(
        toolName: string,
        args: Record<string, unknown>,
    ): Promise<{ args: Record<string, unknown> } | { rejection: string }> {
        const items: MealItemLike[] = [];
        findMealItems(args, items);
        if (items.length === 0) return { args };

        const nameOnly: MealItemLike[] = [];
        for (const item of items) {
            const sourceType =
                typeof item.record.source_type === "string"
                    ? item.record.source_type
                    : null;
            const reference = itemReference(item.record);
            if (
                (sourceType && PROVIDER_SOURCE_TYPES.has(sourceType)) ||
                reference
            ) {
                if (!reference || !this.providerRefs.has(reference)) {
                    return {
                        rejection: `Rejected: the item "${item.name}" cites provider nutrition that did not come from a tool result in this conversation. In Munch chat, nutrition values must trace to a catalog/provider result: call search_foods, get_food_details, search_saved_foods, or a meal read first, then cite the provider reference it returned. No draft was created.`,
                    };
                }
                continue;
            }
            if (itemHasValues(item.record)) {
                return {
                    rejection: `Rejected: the item "${item.name}" carries nutrition values with no provider source. The chat agent may not originate nutrition values. Either cite a provider reference returned by a search/read tool in this conversation, or pass the item with an empty nutrients object and let Munch ground it. No draft was created.`,
                };
            }
            nameOnly.push(item);
        }
        if (nameOnly.length === 0) return { args };

        const visionItems: MealPhotoVisionItem[] = nameOnly.map((item) => ({
            name: item.name,
            cooking_method: null,
            quantity:
                typeof item.record.quantity === "number"
                    ? item.record.quantity
                    : 1,
            unit:
                typeof item.record.portion_label === "string" &&
                item.record.portion_label
                    ? item.record.portion_label
                    : "serving",
            // Same posture as chat v1's proposal grounding: the chat
            // flow has no portion evidence of its own, so confidence
            // sits above the pipeline's low-confidence question
            // threshold; ungrounded items still block valueless.
            portion_confidence: 0.8,
            assumptions: Array.isArray(item.record.assumptions)
                ? item.record.assumptions.filter(
                      (entry): entry is string => typeof entry === "string",
                  )
                : [],
        }));
        const grounded = await groundMealPhotoItems(visionItems, {
            search: this.search,
        });
        const extraQuestions: Array<Record<string, unknown>> = [];
        nameOnly.forEach((item, index) => {
            const entry = grounded[index];
            if (!entry) return;
            const draftItem = entry.draftItem;
            if (entry.grounded || entry.estimated) {
                item.record.nutrients = { ...draftItem.nutrients };
                item.record.source_type = draftItem.sourceType;
                if (draftItem.provider)
                    item.record.provider = draftItem.provider;
                if (draftItem.providerFoodId)
                    item.record.provider_food_id = draftItem.providerFoodId;
                if (draftItem.providerRevision)
                    item.record.provider_revision = draftItem.providerRevision;
                if (draftItem.sourceUrl)
                    item.record.source_url = draftItem.sourceUrl;
                if (draftItem.sourceUpdatedAt)
                    item.record.source_updated_at = draftItem.sourceUpdatedAt;
                if (typeof draftItem.confidence === "number")
                    item.record.confidence = draftItem.confidence;
                if (draftItem.portionLabel)
                    item.record.portion_label = draftItem.portionLabel;
                if (typeof draftItem.gramWeight === "number")
                    item.record.gram_weight = draftItem.gramWeight;
                if (draftItem.sourceSnapshot)
                    item.record.source_snapshot = draftItem.sourceSnapshot;
                const assumptions = new Set<string>([
                    ...(Array.isArray(item.record.assumptions)
                        ? item.record.assumptions.filter(
                              (value): value is string =>
                                  typeof value === "string",
                          )
                        : []),
                    ...(draftItem.assumptions ?? []),
                ]);
                item.record.assumptions = [...assumptions];
            } else {
                // Ungrounded: the item enters the draft with NO values
                // and the pipeline's blocking question — the shared
                // confirm path refuses confirmation until the user
                // resolves it (meal-drafts/blocking.ts).
                item.record.nutrients = {};
                item.record.source_type = "model_estimate";
                if (entry.question) {
                    extraQuestions.push({
                        question_key: entry.question.questionKey,
                        prompt: entry.question.prompt,
                        impact_score: entry.question.impactScore,
                        item_position: items.indexOf(item),
                    });
                }
            }
        });
        // Only the atomic review tools accept a questions array in
        // the same call; the granular upsert flow has its own
        // add-question tool the agent can use afterwards.
        if (
            extraQuestions.length > 0 &&
            (toolName === "prepare_meal_review" ||
                toolName === "resolve_meal_review")
        ) {
            const existing = Array.isArray(args.questions)
                ? args.questions
                : [];
            args.questions = [...existing, ...extraQuestions];
        }
        return { args };
    }
}
