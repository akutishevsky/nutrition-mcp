-- Daily nutrition targets per user. One row per user, upserted on set.
create table if not exists public.nutrition_goals (
    user_id uuid primary key references auth.users(id) on delete cascade,
    daily_calories integer,
    daily_protein_g numeric(6, 2),
    daily_carbs_g numeric(6, 2),
    daily_fat_g numeric(6, 2),
    updated_at timestamptz not null default now()
);

alter table public.nutrition_goals enable row level security;

create policy "Users manage their own goals"
    on public.nutrition_goals
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
