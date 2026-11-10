import { withUserDatabase } from "../platform/database.js";

/**
 * S8 chat persistence. Conversations and messages are per-user data
 * behind the forced-RLS tables from db/updates/0036_chat_agent.sql;
 * every read and write runs inside `withUserDatabase`, so the app
 * role can only ever touch the caller's own rows — the same posture
 * as meal drafts and every other user-data repository.
 */

/** The four contextual entry surfaces (chat v2 placement, addendum 4). */
export type ChatEntrySurface = "today" | "meal_plan" | "pantry" | "insights";

export const CHAT_ENTRY_SURFACES: readonly ChatEntrySurface[] = [
    "today",
    "meal_plan",
    "pantry",
    "insights",
];

export function isChatEntrySurface(value: unknown): value is ChatEntrySurface {
    return (
        typeof value === "string" &&
        (CHAT_ENTRY_SURFACES as readonly string[]).includes(value)
    );
}

export interface ChatConversation {
    id: string;
    userId: string;
    title: string | null;
    /** Surface this conversation was opened from, when seeded (0037). */
    entrySurface: ChatEntrySurface | null;
    createdAt: string;
    updatedAt: string;
}

export interface ChatGroundingTraceEntry {
    name: string;
    grounded: boolean;
    estimated: boolean;
    groundingSource: string;
    provider: string | null;
    providerFoodId: string | null;
    candidateId: string | null;
}

export interface ChatToolTraceEntry {
    name: string;
    outcome: "ok" | "error" | "rejected";
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    role: "user" | "assistant";
    content: string;
    model: string | null;
    draftId: string | null;
    groundingTrace: ChatGroundingTraceEntry[];
    /** MCP tools the agent called behind an assistant reply (0037). */
    toolTrace: ChatToolTraceEntry[];
    createdAt: string;
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
    );
}

function rowDate(value: unknown): string {
    return new Date(String(value)).toISOString();
}

function conversationFromRow(row: Record<string, unknown>): ChatConversation {
    return {
        id: String(row.id),
        userId: String(row.user_id),
        title: row.title == null ? null : String(row.title),
        entrySurface: isChatEntrySurface(row.entry_surface)
            ? row.entry_surface
            : null,
        createdAt: rowDate(row.created_at),
        updatedAt: rowDate(row.updated_at),
    };
}

function messageFromRow(row: Record<string, unknown>): ChatMessage {
    const trace = row.grounding_trace;
    const toolTrace = row.tool_trace;
    return {
        id: String(row.id),
        conversationId: String(row.conversation_id),
        role: row.role as ChatMessage["role"],
        content: String(row.content),
        model: row.model == null ? null : String(row.model),
        draftId: row.draft_id == null ? null : String(row.draft_id),
        groundingTrace: Array.isArray(trace)
            ? (trace as ChatGroundingTraceEntry[])
            : [],
        toolTrace: Array.isArray(toolTrace)
            ? (toolTrace as ChatToolTraceEntry[])
            : [],
        createdAt: rowDate(row.created_at),
    };
}

export async function createChatConversation(input: {
    userId: string;
    title?: string;
    entrySurface?: ChatEntrySurface | null;
}): Promise<ChatConversation> {
    return withUserDatabase(input.userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            insert into munch.chat_conversations (user_id, title, entry_surface)
            values (
                ${input.userId},
                ${input.title?.trim().slice(0, 200) || null},
                ${input.entrySurface ?? null}
            )
            returning id, user_id, title, entry_surface, created_at, updated_at
        `;
        return conversationFromRow(rows[0]!);
    });
}

export async function getChatConversation(
    userId: string,
    conversationId: string,
): Promise<ChatConversation | null> {
    if (!isUuid(conversationId)) return null;
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select id, user_id, title, entry_surface, created_at, updated_at
            from munch.chat_conversations
            where id = ${conversationId}
        `;
        return rows[0] ? conversationFromRow(rows[0]) : null;
    });
}

export async function getLatestChatConversation(
    userId: string,
): Promise<ChatConversation | null> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select id, user_id, title, entry_surface, created_at, updated_at
            from munch.chat_conversations
            order by updated_at desc
            limit 1
        `;
        return rows[0] ? conversationFromRow(rows[0]) : null;
    });
}

/** The most recent conversation opened from one entry surface, if any. */
export async function getLatestChatConversationForSurface(
    userId: string,
    surface: ChatEntrySurface,
): Promise<ChatConversation | null> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select id, user_id, title, entry_surface, created_at, updated_at
            from munch.chat_conversations
            where entry_surface = ${surface}
            order by updated_at desc
            limit 1
        `;
        return rows[0] ? conversationFromRow(rows[0]) : null;
    });
}

export async function listChatMessages(input: {
    userId: string;
    conversationId: string;
    limit?: number;
}): Promise<ChatMessage[]> {
    if (!isUuid(input.conversationId)) return [];
    const limit = Math.max(1, Math.min(200, input.limit ?? 100));
    return withUserDatabase(input.userId, async (tx) => {
        const rows = await tx<Array<Record<string, unknown>>>`
            select id, conversation_id, role, content, model, draft_id,
                   grounding_trace, tool_trace, created_at
            from munch.chat_messages
            where conversation_id = ${input.conversationId}
            order by seq desc
            limit ${limit}
        `;
        return rows.map(messageFromRow).reverse();
    });
}

/**
 * Persist one full turn — the user's message and the assistant's
 * reply — in a single transaction, so a conversation never carries a
 * user message whose reply failed to save (and the service only calls
 * this after the model reply exists: a failed model call persists
 * nothing at all).
 */
export async function appendChatTurn(input: {
    userId: string;
    conversationId: string;
    userContent: string;
    assistantContent: string;
    model: string;
    draftId?: string | null;
    groundingTrace?: ChatGroundingTraceEntry[];
    toolTrace?: ChatToolTraceEntry[];
}): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    return withUserDatabase(input.userId, async (tx) => {
        const conversation = await tx<
            Array<{ id: string; title: string | null }>
        >`
            select id, title from munch.chat_conversations
            where id = ${input.conversationId}
            for update
        `;
        if (!conversation[0]) throw new Error("Chat conversation not found");
        const userRows = await tx<Array<Record<string, unknown>>>`
            insert into munch.chat_messages (
                conversation_id, user_id, role, content
            ) values (
                ${input.conversationId}, ${input.userId}, 'user',
                ${input.userContent}
            )
            returning id, conversation_id, role, content, model, draft_id,
                      grounding_trace, tool_trace, created_at
        `;
        const assistantRows = await tx<Array<Record<string, unknown>>>`
            insert into munch.chat_messages (
                conversation_id, user_id, role, content, model, draft_id,
                grounding_trace, tool_trace
            ) values (
                ${input.conversationId}, ${input.userId}, 'assistant',
                ${input.assistantContent}, ${input.model},
                ${input.draftId ?? null},
                ${(input.groundingTrace ?? []) as unknown as Record<string, unknown>}::jsonb,
                ${(input.toolTrace ?? []) as unknown as Record<string, unknown>}::jsonb
            )
            returning id, conversation_id, role, content, model, draft_id,
                      grounding_trace, tool_trace, created_at
        `;
        await tx`
            update munch.chat_conversations
            set title = case
                    when title is null
                    then ${input.userContent.trim().slice(0, 80)}
                    else title
                end,
                updated_at = now()
            where id = ${input.conversationId}
        `;
        return {
            userMessage: messageFromRow(userRows[0]!),
            assistantMessage: messageFromRow(assistantRows[0]!),
        };
    });
}
