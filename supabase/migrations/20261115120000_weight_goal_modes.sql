-- Optional mode and inputs for weight-based calorie goals. NULL mode keeps
-- legacy goal rows distinguishable from an explicitly selected mode.
alter table public.nutrition_goals
    add column if not exists calorie_goal_mode text
        check (calorie_goal_mode in ('fixed', 'burn', 'rate', 'date')),
    add column if not exists weight_rate_g_per_day numeric(7,2),
    add column if not exists target_date date;

comment on column public.nutrition_goals.calorie_goal_mode is
    'Selected calorie goal mode; NULL means a legacy goal row.';
comment on column public.nutrition_goals.weight_rate_g_per_day is
    'Desired daily weight change in grams per day.';
comment on column public.nutrition_goals.target_date is
    'Target date for reaching the goal weight.';

-- Optional profile tuning; readers use defaults when either value is NULL.
alter table public.profiles
    add column if not exists energy_kcal_per_gram numeric(4,2)
        check (energy_kcal_per_gram between 3 and 9),
    add column if not exists trend_window_days integer
        check (trend_window_days between 21 and 56);

comment on column public.profiles.energy_kcal_per_gram is
    'Energy density for weight change; NULL uses the default 6.0 kcal/g.';
comment on column public.profiles.trend_window_days is
    'Weight trend window in days; NULL uses the default 42 days.';
