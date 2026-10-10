-- Per-nutrient provenance: where each nutrient value came from (#usda-sources).
--
-- Why: a meal's calories or fiber may come from a USDA FoodData Central record,
-- an Open Food Facts product, the user's own figure, or the model's estimate.
-- The server verifies a claimed record against the stored food record before it
-- labels a value (src/provenance.ts); this migration only stores the labels.
--
-- Two nullable jsonb columns on each of the four nutrient tables:
--   nutrient_sources  nutrient key -> { "s": source, "ref"?: id }, or for an
--                     itemized meal's derived totals { "s": "mixed", "parts": [...] }
--   source_detail    "usda:<id>" / "openfoodfacts:<barcode>" -> the record's
--                     name, data type, grams or servings used, and fetch time,
--                     so every tag can be traced back to its record
--
-- NULL means "no provenance recorded". Rows written before this migration stay
-- NULL and are never back-labelled. No backfill, no default. Every statement is
-- additive, so this lands BEFORE the server that writes these columns.

alter table public.meals
    add column if not exists nutrient_sources jsonb null
        check (jsonb_typeof(nutrient_sources) = 'object'),
    add column if not exists source_detail jsonb null
        check (jsonb_typeof(source_detail) = 'object');

alter table public.meal_items
    add column if not exists nutrient_sources jsonb null
        check (jsonb_typeof(nutrient_sources) = 'object'),
    add column if not exists source_detail jsonb null
        check (jsonb_typeof(source_detail) = 'object');

alter table public.saved_meals
    add column if not exists nutrient_sources jsonb null
        check (jsonb_typeof(nutrient_sources) = 'object'),
    add column if not exists source_detail jsonb null
        check (jsonb_typeof(source_detail) = 'object');

alter table public.saved_meal_items
    add column if not exists nutrient_sources jsonb null
        check (jsonb_typeof(nutrient_sources) = 'object'),
    add column if not exists source_detail jsonb null
        check (jsonb_typeof(source_detail) = 'object');

-- Per-user data: exported (meals.csv, meal_items.csv, saved_meals.csv and
-- saved_meal_items.csv carry both columns), covered by the privacy policy's
-- "Access and portability" section, and deleted with the rows that carry them.

-- ---------- write functions ----------
--
-- The four functions from 20261010150000_saturated_trans_fat.sql (itself a
-- re-creation of 20261010120000_saved_meals.sql), re-created with the two new
-- keys. Signatures, return shapes, security definer, the empty search_path and
-- the grants are unchanged (create or replace keeps the grants). The provenance
-- keys are read with nullif(..., 'null') so a JSON null stores SQL null, which
-- the check constraints accept; anything that is not an object is refused by
-- the constraint. TypeScript computes and validates the maps; SQL only writes.

-- Logs a meal and its items. See 20261010150000_saturated_trans_fat.sql.
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
        carbs_g, fat_g, saturated_fat_g, trans_fat_g, fiber_g, sugar_g,
        added_sugar_g, alcohol_g, caffeine_mg, notes, idempotency_key,
        saved_meal_id, nutrient_sources, source_detail
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
        (p_meal->>'saturated_fat_g')::numeric,
        (p_meal->>'trans_fat_g')::numeric,
        (p_meal->>'fiber_g')::numeric,
        (p_meal->>'sugar_g')::numeric,
        (p_meal->>'added_sugar_g')::numeric,
        (p_meal->>'alcohol_g')::numeric,
        (p_meal->>'caffeine_mg')::numeric,
        p_meal->>'notes',
        p_meal->>'idempotency_key',
        (p_meal->>'saved_meal_id')::uuid,
        nullif(p_meal->'nutrient_sources', 'null'::jsonb),
        nullif(p_meal->'source_detail', 'null'::jsonb)
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
        carbs_g, fat_g, saturated_fat_g, trans_fat_g, fiber_g, sugar_g,
        added_sugar_g, alcohol_g, caffeine_mg, nutrient_sources, source_detail
    )
    select
        v_meal.id, p_user_id, i.position, i.name, i.amount, i.unit, i.calories,
        i.protein_g, i.carbs_g, i.fat_g, i.saturated_fat_g, i.trans_fat_g,
        i.fiber_g, i.sugar_g, i.added_sugar_g, i.alcohol_g, i.caffeine_mg,
        nullif(i.nutrient_sources, 'null'::jsonb),
        nullif(i.source_detail, 'null'::jsonb)
    from jsonb_to_recordset(p_items) as i(
        position smallint,
        name text,
        amount numeric,
        unit text,
        calories numeric,
        protein_g numeric,
        carbs_g numeric,
        fat_g numeric,
        saturated_fat_g numeric,
        trans_fat_g numeric,
        fiber_g numeric,
        sugar_g numeric,
        added_sugar_g numeric,
        alcohol_g numeric,
        caffeine_mg numeric,
        nutrient_sources jsonb,
        source_detail jsonb
    );

    return jsonb_build_object(
        'meal', to_jsonb(v_meal),
        'deduplicated', false
    );
end;
$$;

-- Updates one meal and replaces its items with p_items. Only the keys present
-- in p_fields change; a key with a JSON null value sets the column to null.
-- Returns the updated meal, or SQL null when no meal of this user has p_meal_id.
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
        saturated_fat_g = case when p_fields ? 'saturated_fat_g'
            then (p_fields->>'saturated_fat_g')::numeric else saturated_fat_g end,
        trans_fat_g = case when p_fields ? 'trans_fat_g'
            then (p_fields->>'trans_fat_g')::numeric else trans_fat_g end,
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
            then p_fields->>'idempotency_key' else idempotency_key end,
        nutrient_sources = case when p_fields ? 'nutrient_sources'
            then nullif(p_fields->'nutrient_sources', 'null'::jsonb)
            else nutrient_sources end,
        source_detail = case when p_fields ? 'source_detail'
            then nullif(p_fields->'source_detail', 'null'::jsonb)
            else source_detail end
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
        carbs_g, fat_g, saturated_fat_g, trans_fat_g, fiber_g, sugar_g,
        added_sugar_g, alcohol_g, caffeine_mg, nutrient_sources, source_detail
    )
    select
        v_meal.id, p_user_id, i.position, i.name, i.amount, i.unit, i.calories,
        i.protein_g, i.carbs_g, i.fat_g, i.saturated_fat_g, i.trans_fat_g,
        i.fiber_g, i.sugar_g, i.added_sugar_g, i.alcohol_g, i.caffeine_mg,
        nullif(i.nutrient_sources, 'null'::jsonb),
        nullif(i.source_detail, 'null'::jsonb)
    from jsonb_to_recordset(p_items) as i(
        position smallint,
        name text,
        amount numeric,
        unit text,
        calories numeric,
        protein_g numeric,
        carbs_g numeric,
        fat_g numeric,
        saturated_fat_g numeric,
        trans_fat_g numeric,
        fiber_g numeric,
        sugar_g numeric,
        added_sugar_g numeric,
        alcohol_g numeric,
        caffeine_mg numeric,
        nutrient_sources jsonb,
        source_detail jsonb
    );

    return to_jsonb(v_meal);
end;
$$;

-- Creates a saved meal and its ingredients. A name already used by this user
-- (ignoring case) raises unique_violation (23505), which propagates.
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
        fat_g, saturated_fat_g, trans_fat_g, fiber_g, sugar_g, added_sugar_g,
        alcohol_g, caffeine_mg, nutrient_sources, source_detail
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
        (p_saved->>'saturated_fat_g')::numeric,
        (p_saved->>'trans_fat_g')::numeric,
        (p_saved->>'fiber_g')::numeric,
        (p_saved->>'sugar_g')::numeric,
        (p_saved->>'added_sugar_g')::numeric,
        (p_saved->>'alcohol_g')::numeric,
        (p_saved->>'caffeine_mg')::numeric,
        nullif(p_saved->'nutrient_sources', 'null'::jsonb),
        nullif(p_saved->'source_detail', 'null'::jsonb)
    )
    returning * into v_saved;

    insert into public.saved_meal_items (
        saved_meal_id, user_id, position, name, amount, unit, calories,
        protein_g, carbs_g, fat_g, saturated_fat_g, trans_fat_g, fiber_g,
        sugar_g, added_sugar_g, alcohol_g, caffeine_mg, nutrient_sources,
        source_detail
    )
    select
        v_saved.id, p_user_id, i.position, i.name, i.amount, i.unit, i.calories,
        i.protein_g, i.carbs_g, i.fat_g, i.saturated_fat_g, i.trans_fat_g,
        i.fiber_g, i.sugar_g, i.added_sugar_g, i.alcohol_g, i.caffeine_mg,
        nullif(i.nutrient_sources, 'null'::jsonb),
        nullif(i.source_detail, 'null'::jsonb)
    from jsonb_to_recordset(p_items) as i(
        position smallint,
        name text,
        amount numeric,
        unit text,
        calories numeric,
        protein_g numeric,
        carbs_g numeric,
        fat_g numeric,
        saturated_fat_g numeric,
        trans_fat_g numeric,
        fiber_g numeric,
        sugar_g numeric,
        added_sugar_g numeric,
        alcohol_g numeric,
        caffeine_mg numeric,
        nutrient_sources jsonb,
        source_detail jsonb
    );

    return to_jsonb(v_saved);
end;
$$;

-- Updates a saved meal: only the keys present in p_fields change (a JSON null
-- value sets the column to null), and updated_at is stamped. p_items replaces
-- the ingredients when it is a JSON array; SQL null or any other JSON value
-- keeps them. Returns the row, or SQL null when this user has no saved meal
-- with p_id.
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
        saturated_fat_g = case when p_fields ? 'saturated_fat_g'
            then (p_fields->>'saturated_fat_g')::numeric else saturated_fat_g end,
        trans_fat_g = case when p_fields ? 'trans_fat_g'
            then (p_fields->>'trans_fat_g')::numeric else trans_fat_g end,
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
        nutrient_sources = case when p_fields ? 'nutrient_sources'
            then nullif(p_fields->'nutrient_sources', 'null'::jsonb)
            else nutrient_sources end,
        source_detail = case when p_fields ? 'source_detail'
            then nullif(p_fields->'source_detail', 'null'::jsonb)
            else source_detail end,
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
            protein_g, carbs_g, fat_g, saturated_fat_g, trans_fat_g, fiber_g,
            sugar_g, added_sugar_g, alcohol_g, caffeine_mg, nutrient_sources,
            source_detail
        )
        select
            v_saved.id, p_user_id, i.position, i.name, i.amount, i.unit,
            i.calories, i.protein_g, i.carbs_g, i.fat_g, i.saturated_fat_g,
            i.trans_fat_g, i.fiber_g, i.sugar_g, i.added_sugar_g, i.alcohol_g,
            i.caffeine_mg,
            nullif(i.nutrient_sources, 'null'::jsonb),
            nullif(i.source_detail, 'null'::jsonb)
        from jsonb_to_recordset(p_items) as i(
            position smallint,
            name text,
            amount numeric,
            unit text,
            calories numeric,
            protein_g numeric,
            carbs_g numeric,
            fat_g numeric,
            saturated_fat_g numeric,
            trans_fat_g numeric,
            fiber_g numeric,
            sugar_g numeric,
            added_sugar_g numeric,
            alcohol_g numeric,
            caffeine_mg numeric,
            nutrient_sources jsonb,
            source_detail jsonb
        );
    end if;

    return to_jsonb(v_saved);
end;
$$;
