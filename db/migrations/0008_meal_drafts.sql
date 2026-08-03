create table munch.meal_drafts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references munch.users(id) on delete cascade,
    status text not null default 'open',
    source_mode text not null,
    meal_type text,
    description text,
    logged_at timestamptz,
    notes text,
    version integer not null default 1,
    expires_at timestamptz not null default (now() + interval '24 hours'),
    confirmed_meal_id uuid references munch.meals(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint meal_drafts_status check (
        status in (
            'open',
            'awaiting_answers',
            'awaiting_confirmation',
            'confirmed',
            'cancelled',
            'expired'
        )
    ),
    constraint meal_drafts_source_mode check (
        source_mode in ('text', 'photo', 'barcode', 'restaurant', 'saved_food', 'history')
    ),
    constraint meal_drafts_meal_type check (
        meal_type is null or meal_type in ('breakfast', 'lunch', 'dinner', 'snack')
    ),
    constraint meal_drafts_version_positive check (version > 0),
    constraint meal_drafts_confirmation_consistency check (
        (status = 'confirmed' and confirmed_meal_id is not null)
        or (status <> 'confirmed' and confirmed_meal_id is null)
    )
);

create table munch.meal_draft_items (
    id uuid primary key default gen_random_uuid(),
    draft_id uuid not null references munch.meal_drafts(id) on delete cascade,
    user_id uuid not null references munch.users(id) on delete cascade,
    position integer not null,
    item_payload jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint meal_draft_items_position_nonnegative check (position >= 0),
    constraint meal_draft_items_payload_object check (
        jsonb_typeof(item_payload) = 'object'
    ),
    constraint meal_draft_items_unique_position unique (draft_id, position)
);

create table munch.meal_draft_questions (
    id uuid primary key default gen_random_uuid(),
    draft_id uuid not null references munch.meal_drafts(id) on delete cascade,
    user_id uuid not null references munch.users(id) on delete cascade,
    item_id uuid references munch.meal_draft_items(id) on delete cascade,
    question_key text not null,
    prompt text not null,
    impact_score integer not null default 50,
    status text not null default 'open',
    answer text,
    created_at timestamptz not null default now(),
    answered_at timestamptz,
    constraint meal_draft_questions_key_nonempty check (
        length(btrim(question_key)) > 0
    ),
    constraint meal_draft_questions_prompt_nonempty check (
        length(btrim(prompt)) > 0
    ),
    constraint meal_draft_questions_impact_range check (
        impact_score between 0 and 100
    ),
    constraint meal_draft_questions_status check (
        status in ('open', 'answered', 'accepted_assumption')
    ),
    constraint meal_draft_questions_answer_consistency check (
        (status = 'open' and answer is null and answered_at is null)
        or (status <> 'open' and answer is not null and answered_at is not null)
    ),
    constraint meal_draft_questions_unique_key unique (draft_id, question_key)
);

create index meal_drafts_user_updated_idx
    on munch.meal_drafts (user_id, updated_at desc);
create index meal_drafts_expiry_idx
    on munch.meal_drafts (expires_at)
    where status in ('open', 'awaiting_answers', 'awaiting_confirmation');
create index meal_draft_items_user_draft_idx
    on munch.meal_draft_items (user_id, draft_id, position);
create index meal_draft_questions_open_idx
    on munch.meal_draft_questions (user_id, draft_id, impact_score desc, created_at)
    where status = 'open';

alter table munch.meal_drafts enable row level security;
alter table munch.meal_drafts force row level security;
alter table munch.meal_draft_items enable row level security;
alter table munch.meal_draft_items force row level security;
alter table munch.meal_draft_questions enable row level security;
alter table munch.meal_draft_questions force row level security;

create policy meal_drafts_app_self
    on munch.meal_drafts
    for all
    to munch_app
    using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());
create policy meal_draft_items_app_self
    on munch.meal_draft_items
    for all
    to munch_app
    using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());
create policy meal_draft_questions_app_self
    on munch.meal_draft_questions
    for all
    to munch_app
    using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());

create policy meal_drafts_auth_all
    on munch.meal_drafts
    for all
    to munch_auth
    using (true)
    with check (true);
create policy meal_draft_items_auth_all
    on munch.meal_draft_items
    for all
    to munch_auth
    using (true)
    with check (true);
create policy meal_draft_questions_auth_all
    on munch.meal_draft_questions
    for all
    to munch_auth
    using (true)
    with check (true);

grant select, insert, update, delete on
    munch.meal_drafts,
    munch.meal_draft_items,
    munch.meal_draft_questions
    to munch_app;
grant select, insert, update, delete on
    munch.meal_drafts,
    munch.meal_draft_items,
    munch.meal_draft_questions
    to munch_auth;

comment on table munch.meal_drafts is 'Server-enforced multi-turn meal confirmation state';
comment on table munch.meal_draft_items is 'Validated structured meal item payloads pending confirmation';
comment on table munch.meal_draft_questions is 'Ordered unresolved questions and explicitly accepted assumptions';
