import { getFoodSearchService } from "../food-providers/service.js";
import type { FoodSearchService } from "../food-providers/service.js";
import {
    addMealDraftQuestion,
    createMealDraft,
    upsertMealDraftItem,
    type MealDraft,
} from "../meal-drafts/index.js";
import { groundMealPhotoItems } from "../meal-photo/grounding.js";
import type { MealPhotoVisionItem } from "../meal-photo/vision.js";
import {
    requestChatReply,
    type ChatAgentResult,
    type ChatProposedLog,
} from "./agent.js";
import { chatAiConfig, type ChatAiConfig } from "./config.js";
import { assembleChatContext, type ChatContextSummary } from "./context.js";
import {
    CHAT_PREMIUM_REQUIRED_MESSAGE,
    resolveChatEntitlement,
    type ChatEntitlement,
    type ChatEntitlementDependencies,
} from "./entitlement.js";
import {
    appendChatTurn,
    createChatConversation,
    getChatConversation,
    getLatestChatConversation,
    listChatMessages,
    type ChatConversation,
    type ChatGroundingTraceEntry,
    type ChatMessage,
} from "./repository.js";

/**
 * S8 chat service — the orchestration the routes call.
 *
 * Order of operations for a send, each step a hard gate for the next:
 * 1. Entitlement (server-enforced, rail-neutral, fail-closed). A
 *    Free account is refused before anything is persisted or any
 *    model call is made.
 * 2. Model config presence (no key / disabled → 503-shaped result).
 * 3. Deterministic context assembly (context.ts) — code gathers,
 *    the model never fetches.
 * 4. The model call (agent.ts) — strict JSON, no nutrition values.
 * 5. A proposed log is grounded item-by-item through the SAME
 *    deterministic grounding the photo pipeline uses
 *    (meal-photo/grounding.ts: local catalog → USDA + Open Food
 *    Facts, deterministic ranking) and landed in the EXISTING meal
 *    draft machinery as a draft — never a confirmed meal. Ungrounded
 *    items carry no values and a blocking draft question, exactly as
 *    in the photo pipeline; the shared confirm path refuses to
 *    confirm until the user resolves them.
 * 6. The turn is persisted atomically (user + assistant, with the
 *    draft link and the per-item grounding trace).
 */

export const CHAT_DRAFT_NOTES =
    "Proposed by the Munch chat agent — check items and portions before confirming. Nothing is logged until you confirm this draft.";

export type ChatGateResult =
    | { allowed: true; entitlement: ChatEntitlement }
    | {
          allowed: false;
          entitlement: ChatEntitlement;
          status: 403 | 503;
          body: Record<string, unknown>;
      };

export async function gateChat(
    userId: string,
    dependencies: ChatEntitlementDependencies = {},
): Promise<ChatGateResult> {
    const entitlement = await resolveChatEntitlement(userId, dependencies);
    if (entitlement.allowed) return { allowed: true, entitlement };
    if (entitlement.unavailable) {
        return {
            allowed: false,
            entitlement,
            status: 503,
            body: {
                error: "chat_entitlement_unavailable",
                message:
                    "Premium status could not be verified, so the chat agent is unavailable right now. Try again in a moment.",
                premium_required: true,
            },
        };
    }
    return {
        allowed: false,
        entitlement,
        status: 403,
        body: {
            error: "premium_required",
            message: CHAT_PREMIUM_REQUIRED_MESSAGE,
            premium_required: true,
            subscribe_url: "https://munch.business/app/settings/billing",
        },
    };
}

export interface ChatDraftProposalResult {
    draft: MealDraft;
    trace: ChatGroundingTraceEntry[];
    groundedCount: number;
    blockingCount: number;
}

/**
 * Ground a chat proposal and land it as a meal draft. Exported for
 * the DB smoke: the invariant under test is that this creates a
 * DRAFT (status open/awaiting_*) and never a meal.
 */
export async function createChatDraftFromProposal(input: {
    userId: string;
    proposal: ChatProposedLog;
    search?: Pick<FoodSearchService, "search">["search"];
}): Promise<ChatDraftProposalResult> {
    const visionItems: MealPhotoVisionItem[] = input.proposal.items.map(
        (item) => ({
            name: item.name,
            cooking_method: null,
            quantity: item.quantity,
            unit: item.unit,
            // Server-set: the chat flow has no portion evidence of
            // its own, so confidence sits above the photo pipeline's
            // low-confidence question threshold — grounded items do
            // not spawn portion questions, while ungrounded items
            // still block with no values (see grounding.ts).
            portion_confidence: 0.8,
            assumptions: item.assumptions,
        }),
    );
    const foodSearch = getFoodSearchService();
    const search =
        input.search ?? ((query, limit) => foodSearch.search(query, limit));
    const grounded = await groundMealPhotoItems(visionItems, { search });
    let draft = await createMealDraft({
        userId: input.userId,
        sourceMode: "chat",
        mealType: input.proposal.meal_type ?? undefined,
        description: input.proposal.description,
        notes: CHAT_DRAFT_NOTES,
    });
    for (const [index, entry] of grounded.entries()) {
        draft = await upsertMealDraftItem({
            userId: input.userId,
            draftId: draft.id,
            expectedVersion: draft.version,
            position: index,
            item: entry.draftItem,
        });
    }
    for (const [index, entry] of grounded.entries()) {
        if (!entry.question) continue;
        const record = draft.items.find((item) => item.position === index);
        draft = await addMealDraftQuestion({
            userId: input.userId,
            draftId: draft.id,
            expectedVersion: draft.version,
            questionKey: entry.question.questionKey,
            prompt: entry.question.prompt,
            impactScore: entry.question.impactScore,
            itemId: record?.id,
        });
    }
    return {
        draft,
        groundedCount: grounded.filter((entry) => entry.grounded).length,
        blockingCount: grounded.filter((entry) => entry.question?.blocking)
            .length,
        trace: grounded.map((entry) => ({
            name: entry.vision.name,
            grounded: entry.grounded,
            estimated: entry.estimated,
            groundingSource: entry.groundingSource,
            provider: entry.draftItem.provider ?? null,
            providerFoodId: entry.draftItem.providerFoodId ?? null,
            candidateId: entry.candidateId,
        })),
    };
}

export interface ChatServiceDependencies extends ChatEntitlementDependencies {
    config?: ChatAiConfig | null;
    assembleContext?: (userId: string) => Promise<ChatContextSummary>;
    requestReply?: (
        input: Parameters<typeof requestChatReply>[0],
    ) => Promise<ChatAgentResult>;
    createDraft?: typeof createChatDraftFromProposal;
}

export type SendChatMessageResult =
    | {
          status: "ok";
          conversation: ChatConversation;
          userMessage: ChatMessage;
          assistantMessage: ChatMessage;
          draft: MealDraft | null;
      }
    | {
          status: "premium_required" | "entitlement_unavailable";
          httpStatus: 403 | 503;
          body: Record<string, unknown>;
      }
    | {
          status: "ai_unavailable";
          httpStatus: 503 | 502;
          body: Record<string, unknown>;
      };

export async function sendChatMessage(
    input: { userId: string; conversationId?: string; message: string },
    dependencies: ChatServiceDependencies = {},
): Promise<SendChatMessageResult> {
    const gate = await gateChat(input.userId, dependencies);
    if (!gate.allowed) {
        return {
            status:
                gate.status === 403
                    ? "premium_required"
                    : "entitlement_unavailable",
            httpStatus: gate.status,
            body: gate.body,
        };
    }
    const config =
        dependencies.config !== undefined
            ? dependencies.config
            : chatAiConfig();
    if (!config) {
        return {
            status: "ai_unavailable",
            httpStatus: 503,
            body: {
                error: "chat_ai_unavailable",
                message:
                    "The chat agent is unavailable right now. Try again later.",
            },
        };
    }

    let conversation: ChatConversation | null = input.conversationId
        ? await getChatConversation(input.userId, input.conversationId)
        : await getLatestChatConversation(input.userId);
    if (input.conversationId && !conversation) {
        return {
            status: "ai_unavailable",
            httpStatus: 502,
            body: {
                error: "chat_conversation_not_found",
                message: "That conversation could not be found.",
            },
        };
    }
    if (!conversation) {
        conversation = await createChatConversation({ userId: input.userId });
    }

    const history = await listChatMessages({
        userId: input.userId,
        conversationId: conversation.id,
        limit: 40,
    });
    const context = await (dependencies.assembleContext ?? assembleChatContext)(
        input.userId,
    );
    const result = await (dependencies.requestReply ?? requestChatReply)({
        config,
        context,
        history: history.map((message) => ({
            role: message.role,
            content: message.content,
        })),
        message: input.message,
    });
    if (result.status !== "ok") {
        return {
            status: "ai_unavailable",
            httpStatus: 502,
            body: {
                error: result.code,
                message: result.message,
            },
        };
    }

    let draft: MealDraft | null = null;
    let trace: ChatGroundingTraceEntry[] = [];
    if (result.response.proposed_log) {
        try {
            const proposal = await (
                dependencies.createDraft ?? createChatDraftFromProposal
            )({
                userId: input.userId,
                proposal: result.response.proposed_log,
            });
            draft = proposal.draft;
            trace = proposal.trace;
        } catch (error) {
            // A grounding/draft failure must not lose the reply, but
            // it is recorded on the trace — never silently presented
            // as a created draft.
            console.warn(
                "Chat draft proposal failed; reply kept without draft",
                {
                    errorName: error instanceof Error ? error.name : "unknown",
                },
            );
            trace = [
                {
                    name: result.response.proposed_log.description,
                    grounded: false,
                    estimated: false,
                    groundingSource: "draft_creation_failed",
                    provider: null,
                    providerFoodId: null,
                    candidateId: null,
                },
            ];
        }
    }

    const turn = await appendChatTurn({
        userId: input.userId,
        conversationId: conversation.id,
        userContent: input.message,
        assistantContent: result.response.reply,
        model: result.model,
        draftId: draft?.id ?? null,
        groundingTrace: trace,
    });
    return {
        status: "ok",
        conversation,
        userMessage: turn.userMessage,
        assistantMessage: turn.assistantMessage,
        draft,
    };
}

export async function getChatState(
    userId: string,
    dependencies: ChatEntitlementDependencies = {},
): Promise<
    | {
          premium: true;
          conversation: ChatConversation | null;
          messages: ChatMessage[];
      }
    | { premium: false; status: 403 | 503; body: Record<string, unknown> }
> {
    const gate = await gateChat(userId, dependencies);
    if (!gate.allowed) {
        return { premium: false, status: gate.status, body: gate.body };
    }
    const conversation = await getLatestChatConversation(userId);
    const messages = conversation
        ? await listChatMessages({ userId, conversationId: conversation.id })
        : [];
    return { premium: true, conversation, messages };
}

export async function startChatConversation(
    userId: string,
    dependencies: ChatEntitlementDependencies = {},
): Promise<
    | { premium: true; conversation: ChatConversation }
    | { premium: false; status: 403 | 503; body: Record<string, unknown> }
> {
    const gate = await gateChat(userId, dependencies);
    if (!gate.allowed) {
        return { premium: false, status: gate.status, body: gate.body };
    }
    const conversation = await createChatConversation({ userId });
    return { premium: true, conversation };
}
