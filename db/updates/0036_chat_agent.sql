-- S8 — in-app AI chat agent (Full Parity App Program, Amendment D).
--
-- Premium's third pillar is a conversational agent inside the app. Its
-- conversations and messages are ordinary per-user data: RLS forced,
-- app role limited to the caller's own rows (munch.current_user_id()),
-- auth role unrestricted like every other user-data table. Nothing in
-- this migration is applied automatically by the app — it runs through
-- scripts/migrate.ts (db:migrate) only, per the program's migration
-- discipline, and is rehearsed by the CI database lane.
--
-- The same update teaches meal drafts the 'chat' source mode: a chat
-- proposal lands in the EXISTING meal-draft machinery (draft →
-- questions → explicit user confirmation), never as a confirmed log.

create table munch.chat_conversations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references munch.users(id) on delete cascade,
    title text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint chat_conversations_title_length check (
        title is null or length(btrim(title)) between 1 and 200
    )
);

create table munch.chat_messages (
    id uuid primary key default gen_random_uuid(),
    -- Monotonic insertion order: a turn's two messages share one
    -- transaction timestamp, so created_at alone cannot order them.
    seq bigint generated always as identity,
    conversation_id uuid not null
        references munch.chat_conversations(id) on delete cascade,
    user_id uuid not null references munch.users(id) on delete cascade,
    role text not null,
    content text not null,
    model text,
    draft_id uuid references munch.meal_drafts(id) on delete set null,
    grounding_trace jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    constraint chat_messages_role check (role in ('user', 'assistant')),
    constraint chat_messages_content_length check (
        length(btrim(content)) between 1 and 8000
    ),
    constraint chat_messages_model_length check (
        model is null or length(model) between 1 and 200
    ),
    constraint chat_messages_grounding_trace_array check (
        jsonb_typeof(grounding_trace) = 'array'
    )
);

create index chat_conversations_user_updated_idx
    on munch.chat_conversations (user_id, updated_at desc);
create index chat_messages_conversation_idx
    on munch.chat_messages (user_id, conversation_id, seq);
create index chat_messages_user_created_idx
    on munch.chat_messages (user_id, created_at desc);

alter table munch.chat_conversations enable row level security;
alter table munch.chat_conversations force row level security;
alter table munch.chat_messages enable row level security;
alter table munch.chat_messages force row level security;

create policy chat_conversations_app_self
    on munch.chat_conversations
    for all
    to munch_app
    using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());
create policy chat_messages_app_self
    on munch.chat_messages
    for all
    to munch_app
    using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());

create policy chat_conversations_auth_all
    on munch.chat_conversations
    for all
    to munch_auth
    using (true)
    with check (true);
create policy chat_messages_auth_all
    on munch.chat_messages
    for all
    to munch_auth
    using (true)
    with check (true);

grant select, insert, update, delete on
    munch.chat_conversations,
    munch.chat_messages
    to munch_app;
grant select, insert, update, delete on
    munch.chat_conversations,
    munch.chat_messages
    to munch_auth;

comment on table munch.chat_conversations is
    'S8 chat agent conversations (Premium, per-user, RLS)';
comment on table munch.chat_messages is
    'S8 chat agent messages; assistant rows may link the meal draft a proposal created and carry its grounding trace';

-- Meal drafts gain the 'chat' source mode. The canonical schema's
-- check predates S8; replace it with the widened set (idempotent
-- shape: drop-if-exists then add, matching the repo pattern).
alter table munch.meal_drafts
    drop constraint if exists meal_drafts_source_mode;
alter table munch.meal_drafts
    add constraint meal_drafts_source_mode check (
        source_mode in (
            'text', 'photo', 'barcode', 'restaurant', 'saved_food',
            'history', 'chat'
        )
    );
