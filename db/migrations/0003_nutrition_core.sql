-- Railway-native nutrition data plane.
--
-- Tables deliberately preserve the field names and value semantics used by the
-- inherited Nutrition MCP tool layer so repository cutover can be verified
-- without rewriting nutrition calculations at the same time.

create table munch.meals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references munch.users(id) on delete cascade,
    logged_at timestamptz not null default now(),
    meal_type text,
    description text not null,
    calories integer,
    protein_g numeric,
    carbs_g numeric,
    fat_g numeric,
    fiber_g numeric,
    sugar_g numeric,
    alcohol_g numeric,
    notes text,
    idempotency_key text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint meals_meal_type_check check (
        meal_type is null or meal_type in ('breakfast', 'lunch', 'dinner', 'snack')
    ),
    constraint meals_calories_nonnegative check (calories is null or calories >= 0),
    constraint meals_protein_nonnegative check (protein_g is null or protein_g >= 0),
    constraint meals_carbs_nonnegative check (carbs_g is null or carbs_g >= 0),
    constraint meals_fat_nonnegative check (fat_g is null or fat_g >= 0),
    constraint meals_fiber_nonnegative check (fiber_g is null or fiber_g >= 0),
    constraint meals_sugar_nonnegative check (sugar_g is null or sugar_g >= 0),
    constraint meals_alcohol_nonnegative check (alcohol_g is null or alcohol_g >= 0),
    constraint meals_description_nonempty check (length(btrim(description)) > 0)
);

create unique index meals_user_idempotency_unique
    on munch.meals (user_id, idempotency_key)
    where idempotency_key is not null;
create index meals_user_logged_at_idx
    on munch.meals (user_id, logged_at desc);
create index meals_user_description_search_idx
    on munch.meals using gin (to_tsvector('simple', description));

create table munch.nutrition_goals (
    user_id uuid primary key references munch.users(id) on delete cascade,
    daily_calories integer,
    daily_protein_g numeric(8, 2),
    daily_carbs_g numeric(8, 2),
    daily_fat_g numeric(8, 2),
    daily_fiber_g numeric(8, 2),
    daily_sugar_g numeric(8, 2),
    daily_alcohol_g numeric(8, 2),
    daily_water_ml integer,
    target_weight_g integer,
    updated_at timestamptz not null default now(),
    constraint nutrition_goals_calories_nonnegative check (
        daily_calories is null or daily_calories >= 0
    ),
    constraint nutrition_goals_protein_nonnegative check (
        daily_protein_g is null or daily_protein_g >= 0
    ),
    constraint nutrition_goals_carbs_nonnegative check (
        daily_carbs_g is null or daily_carbs_g >= 0
    ),
    constraint nutrition_goals_fat_nonnegative check (
        daily_fat_g is null or daily_fat_g >= 0
    ),
    constraint nutrition_goals_fiber_nonnegative check (
        daily_fiber_g is null or daily_fiber_g >= 0
    ),
    constraint nutrition_goals_sugar_nonnegative check (
        daily_sugar_g is null or daily_sugar_g >= 0
    ),
    constraint nutrition_goals_alcohol_nonnegative check (
        daily_alcohol_g is null or daily_alcohol_g >= 0
    ),
    constraint nutrition_goals_water_nonnegative check (
        daily_water_ml is null or daily_water_ml >= 0
    ),
    constraint nutrition_goals_weight_positive check (
        target_weight_g is null or target_weight_g > 0
    )
);

create table munch.water_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references munch.users(id) on delete cascade,
    amount_ml integer not null,
    logged_at timestamptz not null default now(),
    notes text,
    idempotency_key text,
    created_at timestamptz not null default now(),
    constraint water_logs_amount_positive check (amount_ml > 0)
);

create unique index water_logs_user_idempotency_unique
    on munch.water_logs (user_id, idempotency_key)
    where idempotency_key is not null;
create index water_logs_user_logged_at_idx
    on munch.water_logs (user_id, logged_at desc);

create table munch.weight_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references munch.users(id) on delete cascade,
    weight_g integer not null,
    logged_at timestamptz not null default now(),
    notes text,
    idempotency_key text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint weight_logs_weight_positive check (weight_g > 0)
);

create unique index weight_logs_user_idempotency_unique
    on munch.weight_logs (user_id, idempotency_key)
    where idempotency_key is not null;
create index weight_logs_user_logged_at_idx
    on munch.weight_logs (user_id, logged_at desc);

alter table munch.meals enable row level security;
alter table munch.meals force row level security;
alter table munch.nutrition_goals enable row level security;
alter table munch.nutrition_goals force row level security;
alter table munch.water_logs enable row level security;
alter table munch.water_logs force row level security;
alter table munch.weight_logs enable row level security;
alter table munch.weight_logs force row level security;

create policy meals_app_self
    on munch.meals
    for all
    to munch_app
    using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());

create policy nutrition_goals_app_self
    on munch.nutrition_goals
    for all
    to munch_app
    using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());

create policy water_logs_app_self
    on munch.water_logs
    for all
    to munch_app
    using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());

create policy weight_logs_app_self
    on munch.weight_logs
    for all
    to munch_app
    using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());

-- The authentication role needs delete access for permanent account deletion.
create policy meals_auth_all
    on munch.meals
    for all
    to munch_auth
    using (true)
    with check (true);
create policy nutrition_goals_auth_all
    on munch.nutrition_goals
    for all
    to munch_auth
    using (true)
    with check (true);
create policy water_logs_auth_all
    on munch.water_logs
    for all
    to munch_auth
    using (true)
    with check (true);
create policy weight_logs_auth_all
    on munch.weight_logs
    for all
    to munch_auth
    using (true)
    with check (true);

grant select, insert, update, delete on
    munch.meals,
    munch.nutrition_goals,
    munch.water_logs,
    munch.weight_logs
    to munch_app;

grant select, insert, update, delete on
    munch.meals,
    munch.nutrition_goals,
    munch.water_logs,
    munch.weight_logs
    to munch_auth;

comment on table munch.meals is 'User-owned meal history with source-stable idempotency keys';
comment on column munch.meals.sugar_g is 'Total sugar, not added sugar';
comment on column munch.meals.alcohol_g is 'Pure ethanol in grams; display is opt-in';
comment on table munch.water_logs is 'User-owned hydration entries in milliliters';
comment on table munch.weight_logs is 'User-owned body-weight entries stored as integer grams';
