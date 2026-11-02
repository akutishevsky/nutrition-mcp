-- Apple Health activity sync: a second, opt-in iOS Shortcut ("Nutrition MCP
-- Activity") that READS the day's Active Energy total from Apple Health and
-- sends it here, the one direction the original Apple Health sync
-- (20261003120000_health_sync.sql) never goes.
--
-- health_sync_pending.kind — which shortcut started a connect. Pairing is the
--   same flow for both (start, sign-in, callback, claim); the kind decides
--   which shortcut the callback page reopens and which link the claim makes.
--   Existing rows are Apple Health connects, hence the default.
-- health_activity_links — at most one per user, separate from
--   health_sync_links so the two shortcuts connect, expire and disconnect
--   independently and neither token works on the other's routes. Same rules
--   as health_sync_links: the `nmhs_` token stored only as hashSecret(raw),
--   sliding 90-day expiry capped at 365 days from created_at.
-- active_calories_log.source / source_date — a row written by the activity
--   sync is the whole day's Health total: source 'apple_health', source_date
--   the local date it totals. One such row per user and date, replaced on each
--   sync (never added to), so syncing is safe to repeat. Manual entries keep
--   both columns null and are untouched by the sync.
--
-- Every statement is additive (the new columns are nullable or defaulted), so
-- this is safe on populated tables and lands BEFORE the server that uses it:
-- apply to dev before the code reaches `dev`, and to production before it
-- reaches `main` (merging to main deploys).

alter table public.health_sync_pending
    add column if not exists kind text not null default 'health'
    check (kind in ('health', 'activity'));

create table if not exists public.health_activity_links (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    token_hash text not null unique,
    fallback_tz text,
    created_at timestamptz not null default now(),
    last_used_at timestamptz,
    last_sync_at timestamptz,
    expires_at timestamptz not null
);

alter table public.health_activity_links enable row level security;
revoke all on table public.health_activity_links from anon, authenticated;
grant all on table public.health_activity_links to service_role;

alter table public.active_calories_log
    add column if not exists source text
    check (source in ('apple_health'));
alter table public.active_calories_log
    add column if not exists source_date date;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'active_calories_log_source_date_check'
    ) then
        alter table public.active_calories_log
            add constraint active_calories_log_source_date_check
            check ((source is null) = (source_date is null));
    end if;
end;
$$;

create unique index if not exists uniq_active_calories_log_health_day
    on public.active_calories_log (user_id, source_date)
    where source = 'apple_health';

-- Write a batch of Health day totals in one statement per day. The server
-- validates and builds p_days (TypeScript, where the tests are); this trusts
-- its input, exactly like the saved-meal functions. Each element:
--   { "date": "YYYY-MM-DD", "kcal": 1..10000, "logged_at": timestamptz,
--     "credit_pct": 0..100 }
-- A new day is inserted with its credit_pct snapshot; an existing day keeps
-- its credit_pct (the snapshot is taken when the day is first written) and
-- gets the new kcal and logged_at. Returns how many rows were inserted or
-- actually changed.
create or replace function public.sync_health_active_calories(
    p_user_id uuid,
    p_days jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_changed integer := 0;
    v_n integer;
    d record;
begin
    for d in
        select *
        from jsonb_to_recordset(p_days) as x(
            date date,
            kcal integer,
            logged_at timestamptz,
            credit_pct smallint
        )
    loop
        insert into public.active_calories_log (
            user_id, logged_at, kcal, credit_pct, source, source_date
        )
        values (
            p_user_id, d.logged_at, d.kcal, d.credit_pct, 'apple_health', d.date
        )
        on conflict (user_id, source_date) where source = 'apple_health'
        do update set
            kcal = excluded.kcal,
            logged_at = excluded.logged_at
        where public.active_calories_log.kcal is distinct from excluded.kcal
           or public.active_calories_log.logged_at
              is distinct from excluded.logged_at;
        get diagnostics v_n = row_count;
        v_changed := v_changed + v_n;
    end loop;
    return v_changed;
end;
$$;

revoke all on function public.sync_health_active_calories(uuid, jsonb)
    from public, anon, authenticated;
grant execute on function public.sync_health_active_calories(uuid, jsonb)
    to service_role;
