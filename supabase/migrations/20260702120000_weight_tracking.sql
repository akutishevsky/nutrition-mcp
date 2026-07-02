-- Body weight tracking. One row per weigh-in (multiple entries per day are
-- allowed); trends aggregate by daily average. Weight is stored canonically as
-- integer grams so kg/lb conversion happens server-side without float drift.
create table if not exists public.weight_log (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    weight_g integer not null check (weight_g > 0),
    logged_at timestamptz not null default now(),
    notes text,
    created_at timestamptz not null default now(),
    idempotency_key text
);

create index if not exists idx_weight_log_user_id on public.weight_log (user_id);
create index if not exists idx_weight_log_logged_at on public.weight_log (logged_at);

create unique index if not exists uniq_weight_log_user_idem
    on public.weight_log (user_id, idempotency_key)
    where idempotency_key is not null;

alter table public.weight_log enable row level security;

create policy "Users manage their own weight_log"
    on public.weight_log
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Per-user preferred display unit for weight. Storage stays canonical grams;
-- this only controls how weights are formatted on output and how a bare number
-- is parsed on input. Deliberately nullable with NO default: NULL means "never
-- chosen", which lets write paths refuse to guess a unit (and mis-log kg as lb)
-- instead of silently assuming one. Display paths fall back to kg.
alter table public.profiles
    add column if not exists preferred_weight_unit text
        check (preferred_weight_unit is null or preferred_weight_unit in ('kg', 'lb'));

-- Optional target body weight, stored canonically in grams.
alter table public.nutrition_goals
    add column if not exists target_weight_g integer check (target_weight_g > 0);
