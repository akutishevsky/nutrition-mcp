-- Global facilities that are not part of a user's nutrition row set: food cache,
-- operational tool events, short-lived export files, and privacy-minimized public
-- statistics. A dedicated role prevents these paths from inheriting broad auth
-- or database-owner privileges.

do $$
begin
    if not exists (select 1 from pg_roles where rolname = 'munch_service') then
        create role munch_service nologin nosuperuser nocreatedb nocreaterole noinherit;
    end if;
    execute format('grant munch_service to %I', current_user);
end
$$;

grant usage on schema munch to munch_service;

create table munch.food_cache (
    source text not null,
    source_id text not null,
    payload jsonb not null,
    fetched_at timestamptz not null default now(),
    primary key (source, source_id),
    constraint food_cache_source_nonempty check (length(btrim(source)) > 0),
    constraint food_cache_source_id_nonempty check (length(btrim(source_id)) > 0)
);

create index food_cache_fetched_at_idx on munch.food_cache (fetched_at);

create table munch.tool_events (
    id bigint generated always as identity primary key,
    user_id uuid references munch.users(id) on delete set null,
    tool_name text not null,
    success boolean not null,
    duration_ms integer not null,
    error_category text,
    date_range_days integer,
    session_hash text,
    invoked_at timestamptz not null default now(),
    constraint tool_events_duration_nonnegative check (duration_ms >= 0),
    constraint tool_events_date_range_positive check (
        date_range_days is null or date_range_days > 0
    ),
    constraint tool_events_name_nonempty check (length(btrim(tool_name)) > 0)
);

create index tool_events_tool_invoked_idx
    on munch.tool_events (tool_name, invoked_at desc);
create index tool_events_user_invoked_idx
    on munch.tool_events (user_id, invoked_at desc)
    where user_id is not null;

create table munch.export_files (
    token_hash bytea primary key,
    user_id uuid not null references munch.users(id) on delete cascade,
    file_name text not null,
    content_type text not null default 'text/csv; charset=utf-8',
    content text not null,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    downloaded_at timestamptz,
    constraint export_files_name_nonempty check (length(btrim(file_name)) > 0),
    constraint export_files_content_nonempty check (length(content) > 0)
);

create index export_files_expires_idx on munch.export_files (expires_at);

alter table munch.export_files enable row level security;
alter table munch.export_files force row level security;

create policy export_files_service_all
    on munch.export_files
    for all
    to munch_service
    using (true)
    with check (true);

grant select, insert, update, delete on munch.food_cache to munch_service;
grant insert on munch.tool_events to munch_service;
grant select, insert, update, delete on munch.export_files to munch_service;
grant usage, select on all sequences in schema munch to munch_service;

-- Public landing statistics expose only coarse totals. No emails, timezones,
-- countries, meal contents, weight values, or per-user breakdowns leave the
-- database. SECURITY DEFINER is limited to this fixed aggregate query.
create or replace function munch.public_landing_stats()
returns jsonb
language sql
stable
security definer
set search_path = munch, pg_temp
as $$
    select jsonb_build_object(
        'total_users', (select count(*)::integer from munch.users where status = 'active'),
        'total_meals', (select count(*)::integer from munch.meals),
        'active_users_30d', (
            select count(distinct user_id)::integer
            from munch.meals
            where logged_at >= now() - interval '30 days'
        ),
        'countries', '[]'::jsonb
    )
$$;

revoke all on function munch.public_landing_stats() from public;
grant execute on function munch.public_landing_stats() to munch_service;

comment on table munch.food_cache is 'Global provider response cache; no user data';
comment on table munch.tool_events is 'Operational metadata only; never store tool arguments or results';
comment on table munch.export_files is 'Short-lived capability-token CSV exports';
comment on function munch.public_landing_stats() is 'Privacy-minimized aggregate landing statistics';
