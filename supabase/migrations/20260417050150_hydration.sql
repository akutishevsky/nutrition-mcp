-- Hydration log. One row per drink; amount_ml is always positive.
create table if not exists public.water_log (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    amount_ml integer not null check (amount_ml > 0),
    logged_at timestamptz not null default now(),
    notes text,
    created_at timestamptz not null default now()
);

create index if not exists idx_water_log_user_id on public.water_log (user_id);
create index if not exists idx_water_log_logged_at on public.water_log (logged_at);

alter table public.water_log enable row level security;

create policy "Users manage their own water_log"
    on public.water_log
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Optional daily water target. Nullable so users can skip it.
alter table public.nutrition_goals
    add column if not exists daily_water_ml integer;
