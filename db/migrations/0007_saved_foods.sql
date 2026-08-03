create table munch.saved_foods (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references munch.users(id) on delete cascade,
    label text not null,
    normalized_label text not null,
    provider text,
    provider_food_id text,
    default_portion_id text,
    food_snapshot jsonb not null,
    use_count integer not null default 0,
    last_used_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint saved_foods_label_nonempty check (length(btrim(label)) > 0),
    constraint saved_foods_normalized_label_nonempty check (
        length(btrim(normalized_label)) > 0
    ),
    constraint saved_foods_use_count_nonnegative check (use_count >= 0),
    constraint saved_foods_snapshot_object check (
        jsonb_typeof(food_snapshot) = 'object'
    ),
    constraint saved_foods_user_label_unique unique (user_id, normalized_label)
);

create index saved_foods_user_recent_idx
    on munch.saved_foods (user_id, last_used_at desc nulls last, updated_at desc);
create index saved_foods_user_provider_idx
    on munch.saved_foods (user_id, provider, provider_food_id)
    where provider is not null and provider_food_id is not null;
create index saved_foods_label_search_idx
    on munch.saved_foods using gin (to_tsvector('simple', label));

alter table munch.saved_foods enable row level security;
alter table munch.saved_foods force row level security;

create policy saved_foods_app_self
    on munch.saved_foods
    for all
    to munch_app
    using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());

create policy saved_foods_auth_all
    on munch.saved_foods
    for all
    to munch_auth
    using (true)
    with check (true);

grant select, insert, update, delete on munch.saved_foods to munch_app;
grant select, insert, update, delete on munch.saved_foods to munch_auth;

comment on table munch.saved_foods is 'User-owned verified food snapshots for usual-food resolution';
comment on column munch.saved_foods.food_snapshot is 'Complete normalized food candidate captured when saved';
