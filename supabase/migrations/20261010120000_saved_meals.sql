-- Saved meals and meal ingredients ("items").
--
-- A saved meal is a named meal kept with its values for ONE serving and,
-- optionally, its ingredients. Logging it writes a normal `meals` row with a
-- copy of those values (and copies of the items) and `saved_meal_id` naming
-- the saved meal it came from. Editing or deleting a saved meal never changes
-- meals already logged from it (saved_meal_id goes null on delete, the copy
-- stays). A meal logged with items carries items in `meal_items`; its nutrient
-- totals are the sum of those items, validated and summed in TypeScript
-- (src/meal-items.ts) before any of these functions is called.
--
-- Tables: saved_meals (one row per saved meal), saved_meal_items (its
-- ingredients), meal_items (a logged meal's ingredients). Every statement is
-- additive and every new column on meals is nullable, so this lands BEFORE the
-- server that writes it, the same way as the other migrations.
--
-- Only the server (service role) reads or writes the new tables: RLS is enabled
-- with no policy, and anon/authenticated get no table privileges at all, the
-- same pattern as the Apple Health sync tables. The write functions at the end
-- are security definer, service-role only, and do their writes in one
-- transaction each: a meal and its items, or a saved meal and its items, are
-- never half-written.
--
-- Release order: apply to dev before the code reaches `dev`, and to production
-- before it reaches `main` (merging to main deploys). deleteAllUserData deletes
-- from these tables first, so account deletion fails until this is applied.

-- ---------- saved_meals ----------

create table if not exists public.saved_meals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null check (char_length(name) between 1 and 100),
    description text not null check (char_length(description) between 1 and 2000),
    meal_type text null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
    calories integer null check (calories >= 0),
    protein_g numeric null check (protein_g >= 0),
    carbs_g numeric null check (carbs_g >= 0),
    fat_g numeric null check (fat_g >= 0),
    fiber_g numeric null check (fiber_g >= 0),
    sugar_g numeric null check (sugar_g >= 0),
    added_sugar_g numeric null check (added_sugar_g >= 0),
    alcohol_g numeric null check (alcohol_g >= 0),
    caffeine_mg numeric null check (caffeine_mg >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Names are unique per user, ignoring case: "Porridge" and "porridge" are one
-- saved meal. The unique index is what makes the name a stable handle for
-- log_saved_meal.
create unique index if not exists uniq_saved_meals_user_name
    on public.saved_meals (user_id, lower(name));

create index if not exists idx_saved_meals_user
    on public.saved_meals (user_id);

-- ---------- saved_meal_items ----------

create table if not exists public.saved_meal_items (
    id uuid primary key default gen_random_uuid(),
    saved_meal_id uuid not null references public.saved_meals(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    position smallint not null check (position >= 1),
    name text not null check (char_length(name) between 1 and 200),
    amount numeric null check (amount > 0),
    unit text null check (char_length(unit) between 1 and 20),
    calories numeric not null check (calories >= 0),
    protein_g numeric not null check (protein_g >= 0),
    carbs_g numeric not null check (carbs_g >= 0),
    fat_g numeric not null check (fat_g >= 0),
    fiber_g numeric null check (fiber_g >= 0),
    sugar_g numeric null check (sugar_g >= 0),
    added_sugar_g numeric null check (added_sugar_g >= 0),
    alcohol_g numeric null check (alcohol_g >= 0),
    caffeine_mg numeric null check (caffeine_mg >= 0),
    unique (saved_meal_id, position)
);

create index if not exists idx_saved_meal_items_user
    on public.saved_meal_items (user_id);

-- ---------- meal_items ----------

create table if not exists public.meal_items (
    id uuid primary key default gen_random_uuid(),
    meal_id uuid not null references public.meals(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    position smallint not null check (position >= 1),
    name text not null check (char_length(name) between 1 and 200),
    amount numeric null check (amount > 0),
    unit text null check (char_length(unit) between 1 and 20),
    calories numeric not null check (calories >= 0),
    protein_g numeric not null check (protein_g >= 0),
    carbs_g numeric not null check (carbs_g >= 0),
    fat_g numeric not null check (fat_g >= 0),
    fiber_g numeric null check (fiber_g >= 0),
    sugar_g numeric null check (sugar_g >= 0),
    added_sugar_g numeric null check (added_sugar_g >= 0),
    alcohol_g numeric null check (alcohol_g >= 0),
    caffeine_mg numeric null check (caffeine_mg >= 0),
    unique (meal_id, position)
);

create index if not exists idx_meal_items_user
    on public.meal_items (user_id);

-- ---------- meals.saved_meal_id ----------

-- The saved meal a logged meal was copied from, when there was one. Set null
-- on delete: deleting a saved meal leaves every logged meal as it was.
alter table public.meals
    add column if not exists saved_meal_id uuid null
    references public.saved_meals(id) on delete set null;

create index if not exists idx_meals_saved_meal_id
    on public.meals (saved_meal_id)
    where saved_meal_id is not null;

-- ---------- row level security and grants ----------

alter table public.saved_meals enable row level security;
alter table public.saved_meal_items enable row level security;
alter table public.meal_items enable row level security;

revoke all on table public.saved_meals from anon, authenticated;
revoke all on table public.saved_meal_items from anon, authenticated;
revoke all on table public.meal_items from anon, authenticated;

grant all on table public.saved_meals to service_role;
grant all on table public.saved_meal_items to service_role;
grant all on table public.meal_items to service_role;

-- ---------- write functions ----------
--
-- All security definer with an empty search_path, so every object is named
-- with its schema. They trust their input: src/meal-items.ts validated and
-- summed the items, and src/supabase.ts built the jsonb. They only do the
-- writes, atomically. Items arrive as a jsonb array of objects whose keys are
-- the item columns (jsonb_to_recordset below). p_items must be an array.

-- Logs a meal and its items. The idempotency key makes a replay a no-op: on a
-- repeat the existing row comes back with deduplicated = true and its items are
-- left alone. The conflict target matches the partial unique index
-- uniq_meals_user_idem exactly, including its where clause.
create or replace function public.insert_meal_with_items(
    p_user_id uuid,
    p_meal jsonb,
    p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_meal public.meals%rowtype;
begin
    insert into public.meals (
        user_id, logged_at, meal_type, description, calories, protein_g,
        carbs_g, fat_g, fiber_g, sugar_g, added_sugar_g, alcohol_g,
        caffeine_mg, notes, idempotency_key, saved_meal_id
    )
    values (
        p_user_id,
        (p_meal->>'logged_at')::timestamptz,
        p_meal->>'meal_type',
        p_meal->>'description',
        (p_meal->>'calories')::integer,
        (p_meal->>'protein_g')::numeric,
        (p_meal->>'carbs_g')::numeric,
        (p_meal->>'fat_g')::numeric,
        (p_meal->>'fiber_g')::numeric,
        (p_meal->>'sugar_g')::numeric,
        (p_meal->>'added_sugar_g')::numeric,
        (p_meal->>'alcohol_g')::numeric,
        (p_meal->>'caffeine_mg')::numeric,
        p_meal->>'notes',
        p_meal->>'idempotency_key',
        (p_meal->>'saved_meal_id')::uuid
    )
    on conflict (user_id, idempotency_key) where idempotency_key is not null
    do nothing
    returning * into v_meal;

    -- No row back means the conflict fired: return the row that already exists.
    if v_meal.id is null then
        select * into v_meal
        from public.meals
        where user_id = p_user_id
          and idempotency_key = p_meal->>'idempotency_key';

        return jsonb_build_object(
            'meal', to_jsonb(v_meal),
            'deduplicated', true
        );
    end if;

    insert into public.meal_items (
        meal_id, user_id, position, name, amount, unit, calories, protein_g,
        carbs_g, fat_g, fiber_g, sugar_g, added_sugar_g, alcohol_g, caffeine_mg
    )
    select
        v_meal.id, p_user_id, i.position, i.name, i.amount, i.unit, i.calories,
        i.protein_g, i.carbs_g, i.fat_g, i.fiber_g, i.sugar_g, i.added_sugar_g,
        i.alcohol_g, i.caffeine_mg
    from jsonb_to_recordset(p_items) as i(
        position smallint,
        name text,
        amount numeric,
        unit text,
        calories numeric,
        protein_g numeric,
        carbs_g numeric,
        fat_g numeric,
        fiber_g numeric,
        sugar_g numeric,
        added_sugar_g numeric,
        alcohol_g numeric,
        caffeine_mg numeric
    );

    return jsonb_build_object(
        'meal', to_jsonb(v_meal),
        'deduplicated', false
    );
end;
$$;

-- Updates one meal and replaces its items with p_items. Only the keys present
-- in p_fields change; a key with a JSON null value sets the column to null.
-- Returns the updated meal, or SQL null when no meal of this user has p_meal_id
-- (nothing is touched then).
create or replace function public.update_meal_with_items(
    p_user_id uuid,
    p_meal_id uuid,
    p_fields jsonb,
    p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_meal public.meals%rowtype;
begin
    update public.meals
    set
        description = case when p_fields ? 'description'
            then p_fields->>'description' else description end,
        meal_type = case when p_fields ? 'meal_type'
            then p_fields->>'meal_type' else meal_type end,
        logged_at = case when p_fields ? 'logged_at'
            then (p_fields->>'logged_at')::timestamptz else logged_at end,
        calories = case when p_fields ? 'calories'
            then (p_fields->>'calories')::integer else calories end,
        protein_g = case when p_fields ? 'protein_g'
            then (p_fields->>'protein_g')::numeric else protein_g end,
        carbs_g = case when p_fields ? 'carbs_g'
            then (p_fields->>'carbs_g')::numeric else carbs_g end,
        fat_g = case when p_fields ? 'fat_g'
            then (p_fields->>'fat_g')::numeric else fat_g end,
        fiber_g = case when p_fields ? 'fiber_g'
            then (p_fields->>'fiber_g')::numeric else fiber_g end,
        sugar_g = case when p_fields ? 'sugar_g'
            then (p_fields->>'sugar_g')::numeric else sugar_g end,
        added_sugar_g = case when p_fields ? 'added_sugar_g'
            then (p_fields->>'added_sugar_g')::numeric else added_sugar_g end,
        alcohol_g = case when p_fields ? 'alcohol_g'
            then (p_fields->>'alcohol_g')::numeric else alcohol_g end,
        caffeine_mg = case when p_fields ? 'caffeine_mg'
            then (p_fields->>'caffeine_mg')::numeric else caffeine_mg end,
        notes = case when p_fields ? 'notes'
            then p_fields->>'notes' else notes end,
        idempotency_key = case when p_fields ? 'idempotency_key'
            then p_fields->>'idempotency_key' else idempotency_key end
    where id = p_meal_id
      and user_id = p_user_id
    returning * into v_meal;

    if v_meal.id is null then
        return null;
    end if;

    delete from public.meal_items
    where meal_id = v_meal.id
      and user_id = p_user_id;

    insert into public.meal_items (
        meal_id, user_id, position, name, amount, unit, calories, protein_g,
        carbs_g, fat_g, fiber_g, sugar_g, added_sugar_g, alcohol_g, caffeine_mg
    )
    select
        v_meal.id, p_user_id, i.position, i.name, i.amount, i.unit, i.calories,
        i.protein_g, i.carbs_g, i.fat_g, i.fiber_g, i.sugar_g, i.added_sugar_g,
        i.alcohol_g, i.caffeine_mg
    from jsonb_to_recordset(p_items) as i(
        position smallint,
        name text,
        amount numeric,
        unit text,
        calories numeric,
        protein_g numeric,
        carbs_g numeric,
        fat_g numeric,
        fiber_g numeric,
        sugar_g numeric,
        added_sugar_g numeric,
        alcohol_g numeric,
        caffeine_mg numeric
    );

    return to_jsonb(v_meal);
end;
$$;

-- Creates a saved meal and its ingredients. A name already used by this user
-- (ignoring case) raises unique_violation (23505), which propagates: the caller
-- maps it to a message naming the existing saved meal.
create or replace function public.insert_saved_meal(
    p_user_id uuid,
    p_saved jsonb,
    p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_saved public.saved_meals%rowtype;
begin
    insert into public.saved_meals (
        user_id, name, description, meal_type, calories, protein_g, carbs_g,
        fat_g, fiber_g, sugar_g, added_sugar_g, alcohol_g, caffeine_mg
    )
    values (
        p_user_id,
        p_saved->>'name',
        p_saved->>'description',
        p_saved->>'meal_type',
        (p_saved->>'calories')::integer,
        (p_saved->>'protein_g')::numeric,
        (p_saved->>'carbs_g')::numeric,
        (p_saved->>'fat_g')::numeric,
        (p_saved->>'fiber_g')::numeric,
        (p_saved->>'sugar_g')::numeric,
        (p_saved->>'added_sugar_g')::numeric,
        (p_saved->>'alcohol_g')::numeric,
        (p_saved->>'caffeine_mg')::numeric
    )
    returning * into v_saved;

    insert into public.saved_meal_items (
        saved_meal_id, user_id, position, name, amount, unit, calories,
        protein_g, carbs_g, fat_g, fiber_g, sugar_g, added_sugar_g, alcohol_g,
        caffeine_mg
    )
    select
        v_saved.id, p_user_id, i.position, i.name, i.amount, i.unit, i.calories,
        i.protein_g, i.carbs_g, i.fat_g, i.fiber_g, i.sugar_g, i.added_sugar_g,
        i.alcohol_g, i.caffeine_mg
    from jsonb_to_recordset(p_items) as i(
        position smallint,
        name text,
        amount numeric,
        unit text,
        calories numeric,
        protein_g numeric,
        carbs_g numeric,
        fat_g numeric,
        fiber_g numeric,
        sugar_g numeric,
        added_sugar_g numeric,
        alcohol_g numeric,
        caffeine_mg numeric
    );

    return to_jsonb(v_saved);
end;
$$;

-- Updates a saved meal: only the keys present in p_fields change (a JSON null
-- value sets the column to null), and updated_at is stamped. p_items replaces
-- the ingredients when it is a JSON array; SQL null or any other JSON value
-- keeps them. A name taken by another saved meal raises 23505, as on insert.
-- Returns the row, or SQL null when this user has no saved meal with p_id.
create or replace function public.update_saved_meal(
    p_user_id uuid,
    p_id uuid,
    p_fields jsonb,
    p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_saved public.saved_meals%rowtype;
begin
    update public.saved_meals
    set
        name = case when p_fields ? 'name'
            then p_fields->>'name' else name end,
        description = case when p_fields ? 'description'
            then p_fields->>'description' else description end,
        meal_type = case when p_fields ? 'meal_type'
            then p_fields->>'meal_type' else meal_type end,
        calories = case when p_fields ? 'calories'
            then (p_fields->>'calories')::integer else calories end,
        protein_g = case when p_fields ? 'protein_g'
            then (p_fields->>'protein_g')::numeric else protein_g end,
        carbs_g = case when p_fields ? 'carbs_g'
            then (p_fields->>'carbs_g')::numeric else carbs_g end,
        fat_g = case when p_fields ? 'fat_g'
            then (p_fields->>'fat_g')::numeric else fat_g end,
        fiber_g = case when p_fields ? 'fiber_g'
            then (p_fields->>'fiber_g')::numeric else fiber_g end,
        sugar_g = case when p_fields ? 'sugar_g'
            then (p_fields->>'sugar_g')::numeric else sugar_g end,
        added_sugar_g = case when p_fields ? 'added_sugar_g'
            then (p_fields->>'added_sugar_g')::numeric else added_sugar_g end,
        alcohol_g = case when p_fields ? 'alcohol_g'
            then (p_fields->>'alcohol_g')::numeric else alcohol_g end,
        caffeine_mg = case when p_fields ? 'caffeine_mg'
            then (p_fields->>'caffeine_mg')::numeric else caffeine_mg end,
        updated_at = now()
    where id = p_id
      and user_id = p_user_id
    returning * into v_saved;

    if v_saved.id is null then
        return null;
    end if;

    if p_items is not null and jsonb_typeof(p_items) = 'array' then
        delete from public.saved_meal_items
        where saved_meal_id = v_saved.id
          and user_id = p_user_id;

        insert into public.saved_meal_items (
            saved_meal_id, user_id, position, name, amount, unit, calories,
            protein_g, carbs_g, fat_g, fiber_g, sugar_g, added_sugar_g,
            alcohol_g, caffeine_mg
        )
        select
            v_saved.id, p_user_id, i.position, i.name, i.amount, i.unit,
            i.calories, i.protein_g, i.carbs_g, i.fat_g, i.fiber_g, i.sugar_g,
            i.added_sugar_g, i.alcohol_g, i.caffeine_mg
        from jsonb_to_recordset(p_items) as i(
            position smallint,
            name text,
            amount numeric,
            unit text,
            calories numeric,
            protein_g numeric,
            carbs_g numeric,
            fat_g numeric,
            fiber_g numeric,
            sugar_g numeric,
            added_sugar_g numeric,
            alcohol_g numeric,
            caffeine_mg numeric
        );
    end if;

    return to_jsonb(v_saved);
end;
$$;

revoke all on function public.insert_meal_with_items(uuid, jsonb, jsonb)
    from public, anon, authenticated;
grant execute on function public.insert_meal_with_items(uuid, jsonb, jsonb)
    to service_role;
comment on function public.insert_meal_with_items(uuid, jsonb, jsonb) is
    'Logs a meal and its ingredients atomically; a repeated idempotency key returns the existing meal. Service role only.';

revoke all on function public.update_meal_with_items(uuid, uuid, jsonb, jsonb)
    from public, anon, authenticated;
grant execute on function public.update_meal_with_items(uuid, uuid, jsonb, jsonb)
    to service_role;
comment on function public.update_meal_with_items(uuid, uuid, jsonb, jsonb) is
    'Updates a logged meal and replaces its ingredients atomically; null when the meal is not this user''s. Service role only.';

revoke all on function public.insert_saved_meal(uuid, jsonb, jsonb)
    from public, anon, authenticated;
grant execute on function public.insert_saved_meal(uuid, jsonb, jsonb)
    to service_role;
comment on function public.insert_saved_meal(uuid, jsonb, jsonb) is
    'Creates a saved meal and its ingredients atomically; a duplicate name raises unique_violation. Service role only.';

revoke all on function public.update_saved_meal(uuid, uuid, jsonb, jsonb)
    from public, anon, authenticated;
grant execute on function public.update_saved_meal(uuid, uuid, jsonb, jsonb)
    to service_role;
comment on function public.update_saved_meal(uuid, uuid, jsonb, jsonb) is
    'Updates a saved meal and, when given, replaces its ingredients atomically; null when not this user''s. Service role only.';

-- ---------- delete_user_account ----------
--
-- Re-created from 20260630094635_delete_user_account.sql with the same
-- signature, return shape (the existing per-table counts) and grants. It now
-- also deletes the saved-meal and ingredient tables, and the tables it was
-- already missing: the Apple Health sync tables, weight, body measurements and
-- goals history. The new counts are added to the returned object.
create or replace function public.delete_user_account(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_analytics   int;
    v_water       int;
    v_weight      int;
    v_measurements int;
    v_goals       int;
    v_goals_hist  int;
    v_profiles    int;
    v_meal_items  int;
    v_saved_items int;
    v_saved       int;
    v_meals       int;
    v_hs_links    int;
    v_hs_days     int;
    v_hs_pending  int;
    v_oauth       int;
    v_refresh     int;
    v_auth_codes  int;
    v_user        int;
begin
    -- tool_analytics.user_id is varchar, not a uuid FK -> cast to text
    with d as (
        delete from public.tool_analytics
        where user_id = p_user_id::text returning 1)
    select count(*) into v_analytics from d;

    -- Apple Health sync first, as deleteAllUserData does.
    with d as (
        delete from public.health_sync_links
        where user_id = p_user_id returning 1)
    select count(*) into v_hs_links from d;

    with d as (
        delete from public.health_sync_days
        where user_id = p_user_id returning 1)
    select count(*) into v_hs_days from d;

    with d as (
        delete from public.health_sync_pending
        where user_id = p_user_id returning 1)
    select count(*) into v_hs_pending from d;

    with d as (
        delete from public.water_log
        where user_id = p_user_id returning 1)
    select count(*) into v_water from d;

    with d as (
        delete from public.weight_log
        where user_id = p_user_id returning 1)
    select count(*) into v_weight from d;

    with d as (
        delete from public.body_measurement_log
        where user_id = p_user_id returning 1)
    select count(*) into v_measurements from d;

    with d as (
        delete from public.nutrition_goals_history
        where user_id = p_user_id returning 1)
    select count(*) into v_goals_hist from d;

    with d as (
        delete from public.nutrition_goals
        where user_id = p_user_id returning 1)
    select count(*) into v_goals from d;

    with d as (
        delete from public.profiles
        where user_id = p_user_id returning 1)
    select count(*) into v_profiles from d;

    -- Ingredients first, then saved meals, then meals: a meal's items and a
    -- saved meal's items go with their parent either way, but naming them keeps
    -- the counts exact.
    with d as (
        delete from public.meal_items
        where user_id = p_user_id returning 1)
    select count(*) into v_meal_items from d;

    with d as (
        delete from public.saved_meal_items
        where user_id = p_user_id returning 1)
    select count(*) into v_saved_items from d;

    with d as (
        delete from public.saved_meals
        where user_id = p_user_id returning 1)
    select count(*) into v_saved from d;

    with d as (
        delete from public.meals
        where user_id = p_user_id returning 1)
    select count(*) into v_meals from d;

    with d as (
        delete from public.oauth_tokens
        where user_id = p_user_id returning 1)
    select count(*) into v_oauth from d;

    with d as (
        delete from public.refresh_tokens
        where user_id = p_user_id returning 1)
    select count(*) into v_refresh from d;

    with d as (
        delete from public.auth_codes
        where user_id = p_user_id returning 1)
    select count(*) into v_auth_codes from d;

    -- Finally the auth user (cascades within the auth schema:
    -- identities, sessions, etc.)
    with d as (
        delete from auth.users
        where id = p_user_id returning 1)
    select count(*) into v_user from d;

    return jsonb_build_object(
        'user_id',        p_user_id,
        'tool_analytics', v_analytics,
        'water_log',      v_water,
        'weight_log',     v_weight,
        'body_measurement_log', v_measurements,
        'nutrition_goals',v_goals,
        'nutrition_goals_history', v_goals_hist,
        'profiles',       v_profiles,
        'meal_items',     v_meal_items,
        'saved_meal_items', v_saved_items,
        'saved_meals',    v_saved,
        'meals',          v_meals,
        'health_sync_links', v_hs_links,
        'health_sync_days', v_hs_days,
        'health_sync_pending', v_hs_pending,
        'oauth_tokens',   v_oauth,
        'refresh_tokens', v_refresh,
        'auth_codes',     v_auth_codes,
        'auth_user',      v_user,
        'exports_note',   'storage file <user_id>/meals.csv must be deleted via Storage API'
    );
end;
$$;

revoke all on function public.delete_user_account(uuid) from public, anon, authenticated;
grant execute on function public.delete_user_account(uuid) to service_role;
