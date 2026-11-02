-- Active calories: energy the user burned in exercise (typically a watch's
-- "active calories"), logged beside intake. They are shown next to intake and
-- never change the calorie goal.
--
-- One row per logged burn, shaped like water_log (20260417050150_hydration.sql
-- and 20260417052713_idempotency_keys.sql).
--
-- credit_pct is snapshotted on each row at write time, from the account's
-- profiles.activity_credit_pct (null there means 100). Changing the preference
-- later must not rewrite past days, so the row carries its own percentage.
-- credited_kcal is derived from kcal * credit_pct / 100 when read, never stored.
--
-- Every statement is additive and the new profile column is nullable, so this
-- is safe on populated tables and lands BEFORE the server that writes it.

create table if not exists public.active_calories_log (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    logged_at timestamptz not null default now(),
    kcal integer not null check (kcal between 1 and 10000),
    credit_pct smallint not null check (credit_pct between 0 and 100),
    notes text,
    idempotency_key text,
    created_at timestamptz not null default now()
);

create index if not exists idx_active_calories_log_user_id
    on public.active_calories_log (user_id);
create index if not exists idx_active_calories_log_logged_at
    on public.active_calories_log (logged_at);

create unique index if not exists uniq_active_calories_log_user_idem
    on public.active_calories_log (user_id, idempotency_key)
    where idempotency_key is not null;

alter table public.active_calories_log enable row level security;

create policy "Users manage their own active_calories_log"
    on public.active_calories_log
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Share of active calories that count against intake, in percent. Null means
-- the default, 100. Set with set_activity_credit; applies to entries logged
-- from then on.
alter table public.profiles
    add column if not exists activity_credit_pct smallint
    check (activity_credit_pct between 0 and 100);
