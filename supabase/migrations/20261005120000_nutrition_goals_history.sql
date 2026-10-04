-- Goals history: one row per change to a user's nutrition goals, so a past
-- period (get_trends group_by) is compared with the goal that was in effect at
-- the time rather than today's. nutrition_goals stays the single current row;
-- upsertNutritionGoals (src/supabase.ts) appends here after each successful
-- upsert, only when the stored values differ from the user's latest history
-- row. The read side (goalsOnDate, src/goals-history.ts) takes the latest row
-- whose local date is on or before the day asked about, and before the first
-- row assumes the earliest one, flagged as assumed.
--
-- The ten goal columns are typed exactly like nutrition_goals' (built up by
-- 20260417044800_nutrition_goals.sql, 20260417050150_hydration.sql,
-- 20260702120000_weight_tracking.sql, 20260726120000_fiber_sugar_alcohol.sql
-- and 20260809133215_caffeine.sql), checks included, so a value the current
-- row accepts is always accepted here and rounds the same way.
--
-- Per-user data: exported as goals_history.csv, deleted by deleteAllUserData
-- (and by the auth.users cascade), and named in the privacy policy.
--
-- Release order: apply to an environment's database before the code reaches
-- the branch that environment deploys from. Without the table, set_nutrition_goals
-- saves the goal and then reports an error, and account deletion fails.
-- A goal set or changed by the old code between this migration and the deploy
-- is not lost: reads (getNutritionGoalsHistory, via withCurrentGoals) already
-- see it, as an entry at nutrition_goals.updated_at whenever that row is newer
-- than the latest history row and differs from it, and the next save records
-- it in this table at that same updated_at, before its own change.
create table if not exists public.nutrition_goals_history (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    effective_at timestamptz not null default now(),
    daily_calories integer,
    daily_protein_g numeric(6, 2),
    daily_carbs_g numeric(6, 2),
    daily_fat_g numeric(6, 2),
    daily_fiber_g numeric(6, 2) check (daily_fiber_g >= 0),
    daily_sugar_g numeric(6, 2) check (daily_sugar_g >= 0),
    daily_alcohol_g numeric(6, 2) check (daily_alcohol_g >= 0),
    daily_caffeine_mg numeric(7, 2) check (daily_caffeine_mg >= 0),
    daily_water_ml integer,
    target_weight_g integer check (target_weight_g > 0)
);

create index if not exists idx_nutrition_goals_history_user_effective_at
    on public.nutrition_goals_history (user_id, effective_at);

alter table public.nutrition_goals_history enable row level security;

create policy "Users manage their own goals history"
    on public.nutrition_goals_history
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Seed: the current goals have been in effect since they were last saved.
-- What was in effect before that is unknown; the read side treats days before
-- the first row as assumed rather than inventing an earlier goal. Guarded so
-- re-running the migration does not seed twice.
insert into public.nutrition_goals_history (
    user_id,
    effective_at,
    daily_calories,
    daily_protein_g,
    daily_carbs_g,
    daily_fat_g,
    daily_fiber_g,
    daily_sugar_g,
    daily_alcohol_g,
    daily_caffeine_mg,
    daily_water_ml,
    target_weight_g
)
select
    g.user_id,
    g.updated_at,
    g.daily_calories,
    g.daily_protein_g,
    g.daily_carbs_g,
    g.daily_fat_g,
    g.daily_fiber_g,
    g.daily_sugar_g,
    g.daily_alcohol_g,
    g.daily_caffeine_mg,
    g.daily_water_ml,
    g.target_weight_g
from public.nutrition_goals g
where not exists (
    select 1
    from public.nutrition_goals_history h
    where h.user_id = g.user_id
);
