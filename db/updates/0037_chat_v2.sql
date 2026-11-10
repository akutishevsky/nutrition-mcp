-- S8 chat v2 — MCP-tool agent + contextual placement (chat-v2 brief).
--
-- Two additive changes to the 0036 chat tables; no new tables, no data
-- movement, nothing destructive:
--
-- 1. chat_conversations.entry_surface records which app surface a
--    conversation was opened from when the user enters through one of the
--    four contextual entries (Contextual-only placement, brief Rulings
--    addendum 4): 'today', 'meal_plan', 'pantry', or 'insights'. Null for
--    conversations not started from an entry. The surface decides which
--    live context the agent is seeded with on each send.
--
-- 2. chat_messages.tool_trace records, on assistant rows, the names of
--    the MCP tools the agent called to produce that reply (names and
--    outcome only — never arguments, never another user's data), so the
--    trace law's "the user can see what the agent did" requirement holds
--    for chat-originated work alongside the meal drafts' own records.
--
-- Nothing in this migration is applied automatically by the app — it
-- runs through scripts/migrate.ts (db:migrate) only, per the program's
-- migration discipline, and is rehearsed by the CI database lane before
-- any production application.

alter table munch.chat_conversations
    add column entry_surface text;

alter table munch.chat_conversations
    add constraint chat_conversations_entry_surface check (
        entry_surface is null
        or entry_surface in ('today', 'meal_plan', 'pantry', 'insights')
    );

comment on column munch.chat_conversations.entry_surface is
    'Contextual entry surface this conversation was opened from (chat v2 placement); null for unseeded conversations';

alter table munch.chat_messages
    add column tool_trace jsonb not null default '[]'::jsonb;

alter table munch.chat_messages
    add constraint chat_messages_tool_trace_array check (
        jsonb_typeof(tool_trace) = 'array'
    );

comment on column munch.chat_messages.tool_trace is
    'Chat v2: MCP tool calls behind an assistant reply — [{name, outcome}] only, no arguments';
