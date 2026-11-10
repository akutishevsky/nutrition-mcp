import { getMealDraft } from "../meal-drafts/repository.js";
import type { MealDraft } from "../meal-drafts/types.js";
import { requestChatReply, type ChatAgentResult } from "./agent.js";
import { chatAiConfig, type ChatAiConfig } from "./config.js";
import { assembleChatContext, type ChatContextSummary } from "./context.js";
import {
    CHAT_PREMIUM_REQUIRED_MESSAGE,
    resolveChatEntitlement,
    type ChatEntitlement,
    type ChatEntitlementDependencies,
} from "./entitlement.js";
import { openChatToolHost } from "./mcp-host.js";
import {
    appendChatTurn,
    createChatConversation,
    getChatConversation,
    getLatestChatConversation,
    getLatestChatConversationForSurface,
    listChatMessages,
    type ChatConversation,
    type ChatEntrySurface,
    type ChatGroundingTraceEntry,
    type ChatMessage,
} from "./repository.js";
import { assembleEntrySeed, type ChatEntrySeed } from "./seeds.js";
import {
    ChatToolExecutor,
    deriveChatToolDefinitions,
    type ChatModelTool,
    type ChatToolExecution,
} from "./tools.js";

/**
 * S8 chat service v2 — the orchestration the routes call.
 *
 * Order of operations for a send, each step a hard gate for the next:
 * 1. Entitlement (server-enforced, rail-neutral, fail-closed). A
 *    Free account is refused before anything is persisted, any tool
 *    host is opened, or any model call is made.
 * 2. Model config presence (no key / disabled → 503-shaped result).
 * 3. Conversation resolution: the addressed conversation, else the
 *    latest conversation for the entry surface the user came from,
 *    else the latest conversation, else a new one.
 * 4. Slim static context (goals + today's totals — context.ts) and,
 *    for a seeded conversation, the entry surface's live seed
 *    (seeds.ts).
 * 5. A per-send tool session: an in-process MCP host built for THIS
 *    user through the same construction path as external MCP
 *    (mcp-host.ts), the parity-derived tool registry, and the
 *    guarded executor (tools.ts). The session closes when the send
 *    completes, success or failure.
 * 6. The agent loop (agent.ts): Ember via OpenRouter, at most 8
 *    tool calls, values only from tool results, writes draft-class
 *    only. A failed loop persists nothing (v1's posture).
 * 7. The turn is persisted atomically (user + assistant, with the
 *    created meal draft's link, its per-item grounding trace read
 *    back from the draft itself, and the tool-call trace).
 */

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

export interface ChatToolSession {
    tools: ChatModelTool[];
    executeTool: (
        name: string,
        args: Record<string, unknown>,
    ) => Promise<ChatToolExecution>;
    close: () => Promise<void>;
}

async function openDefaultToolSession(
    userId: string,
): Promise<ChatToolSession> {
    const host = await openChatToolHost({ userId });
    try {
        const published = await host.listTools();
        const { tools } = deriveChatToolDefinitions(published);
        const executor = new ChatToolExecutor({ host });
        return {
            tools,
            executeTool: (name, args) => executor.execute(name, args),
            close: () => host.close(),
        };
    } catch (error) {
        await host.close().catch(() => undefined);
        throw error;
    }
}

/**
 * The grounding trace for a turn is read back from the created draft
 * itself — the items as they actually landed, with the provenance
 * the draft stored — never from the model's claims about them.
 */
function draftGroundingTrace(draft: MealDraft): ChatGroundingTraceEntry[] {
    return draft.items.map((record) => {
        const item = record.item;
        const estimated = item.sourceType === "model_estimate";
        return {
            name: item.name,
            grounded: !estimated && item.sourceType !== "user_supplied",
            estimated,
            groundingSource: item.sourceType,
            provider: item.provider ?? null,
            providerFoodId: item.providerFoodId ?? null,
            candidateId: null,
        };
    });
}

export interface ChatServiceDependencies extends ChatEntitlementDependencies {
    config?: ChatAiConfig | null;
    assembleContext?: (userId: string) => Promise<ChatContextSummary>;
    assembleSeed?: (
        userId: string,
        surface: ChatEntrySurface,
    ) => Promise<ChatEntrySeed>;
    openToolSession?: (userId: string) => Promise<ChatToolSession>;
    requestReply?: (
        input: Parameters<typeof requestChatReply>[0],
        deps: Parameters<typeof requestChatReply>[1],
    ) => Promise<ChatAgentResult>;
    fetcher?: (
        input: RequestInfo | URL,
        init?: RequestInit,
    ) => Promise<Response>;
    loadDraft?: (userId: string, draftId: string) => Promise<MealDraft | null>;
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
    input: {
        userId: string;
        conversationId?: string;
        surface?: ChatEntrySurface;
        message: string;
    },
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

    let conversation: ChatConversation | null = null;
    if (input.conversationId) {
        conversation = await getChatConversation(
            input.userId,
            input.conversationId,
        );
        if (!conversation) {
            return {
                status: "ai_unavailable",
                httpStatus: 502,
                body: {
                    error: "chat_conversation_not_found",
                    message: "That conversation could not be found.",
                },
            };
        }
    } else if (input.surface) {
        conversation =
            (await getLatestChatConversationForSurface(
                input.userId,
                input.surface,
            )) ??
            (await createChatConversation({
                userId: input.userId,
                entrySurface: input.surface,
            }));
    } else {
        conversation =
            (await getLatestChatConversation(input.userId)) ??
            (await createChatConversation({ userId: input.userId }));
    }

    const history = await listChatMessages({
        userId: input.userId,
        conversationId: conversation.id,
        limit: 40,
    });
    const context = await (dependencies.assembleContext ?? assembleChatContext)(
        input.userId,
    );
    const entrySeed = conversation.entrySurface
        ? await (dependencies.assembleSeed ?? assembleEntrySeed)(
              input.userId,
              conversation.entrySurface,
          )
        : null;

    let session: ChatToolSession;
    try {
        session = await (
            dependencies.openToolSession ?? openDefaultToolSession
        )(input.userId);
    } catch (error) {
        console.warn("Chat tool session failed to open", {
            errorName: error instanceof Error ? error.name : "unknown",
        });
        return {
            status: "ai_unavailable",
            httpStatus: 503,
            body: {
                error: "chat_tools_unavailable",
                message:
                    "The chat agent is unavailable right now. Try again later.",
            },
        };
    }

    let result: ChatAgentResult;
    try {
        result = await (dependencies.requestReply ?? requestChatReply)(
            {
                config,
                context,
                entrySeed,
                history: history.map((message) => ({
                    role: message.role,
                    content: message.content,
                })),
                message: input.message,
                tools: session.tools,
            },
            {
                fetcher: dependencies.fetcher,
                executeTool: session.executeTool,
            },
        );
    } finally {
        await session.close().catch(() => undefined);
    }
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
    const primaryDraftId = result.draftIds[0] ?? null;
    if (primaryDraftId) {
        try {
            draft = await (dependencies.loadDraft ?? getMealDraft)(
                input.userId,
                primaryDraftId,
            );
            if (draft) trace = draftGroundingTrace(draft);
        } catch (error) {
            // The draft exists (the tool created it); a trace read
            // failure must not lose the reply or the draft link.
            console.warn("Chat draft trace read failed; reply kept", {
                errorName: error instanceof Error ? error.name : "unknown",
            });
        }
    }

    const turn = await appendChatTurn({
        userId: input.userId,
        conversationId: conversation.id,
        userContent: input.message,
        assistantContent: result.reply,
        model: result.model,
        draftId: draft?.id ?? primaryDraftId,
        groundingTrace: trace,
        toolTrace: result.toolCalls,
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
    options: { conversationId?: string } = {},
    dependencies: ChatServiceDependencies = {},
): Promise<
    | {
          premium: true;
          conversation: ChatConversation | null;
          messages: ChatMessage[];
          seed: ChatEntrySeed | null;
      }
    | { premium: false; status: 403 | 503; body: Record<string, unknown> }
> {
    const gate = await gateChat(userId, dependencies);
    if (!gate.allowed) {
        return { premium: false, status: gate.status, body: gate.body };
    }
    const conversation = options.conversationId
        ? await getChatConversation(userId, options.conversationId)
        : await getLatestChatConversation(userId);
    const messages = conversation
        ? await listChatMessages({ userId, conversationId: conversation.id })
        : [];
    const seed =
        conversation?.entrySurface != null
            ? await (dependencies.assembleSeed ?? assembleEntrySeed)(
                  userId,
                  conversation.entrySurface,
              )
            : null;
    return { premium: true, conversation, messages, seed };
}

export async function startChatConversation(
    userId: string,
    options: { surface?: ChatEntrySurface } = {},
    dependencies: ChatServiceDependencies = {},
): Promise<
    | {
          premium: true;
          conversation: ChatConversation;
          seed: ChatEntrySeed | null;
      }
    | { premium: false; status: 403 | 503; body: Record<string, unknown> }
> {
    const gate = await gateChat(userId, dependencies);
    if (!gate.allowed) {
        return { premium: false, status: gate.status, body: gate.body };
    }
    const conversation = options.surface
        ? ((await getLatestChatConversationForSurface(
              userId,
              options.surface,
          )) ??
          (await createChatConversation({
              userId,
              entrySurface: options.surface,
          })))
        : await createChatConversation({ userId });
    const seed =
        conversation.entrySurface != null
            ? await (dependencies.assembleSeed ?? assembleEntrySeed)(
                  userId,
                  conversation.entrySurface,
              )
            : null;
    return { premium: true, conversation, seed };
}
