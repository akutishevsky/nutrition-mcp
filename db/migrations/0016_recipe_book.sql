-- Factual recipe storage. Interpretive labels such as favorite, healthy, quick,
-- high-protein, or meal-prep are intentionally not persisted; clients derive
-- them from nutrients, ingredients, timing, and observed use.

create table munch.recipes (
    id uuid primary key default gen_random_uuid(),
    personal_owner_user_id uuid references munch.users(id) on delete cascade,
    household_id uuid references munch.households(id) on delete cascade,
    name text not null,
    current_revision_number integer not null default 1,
    idempotency_key text,
    created_by_user_id uuid not null references munch.users(id) on delete restrict,
    updated_by_user_id uuid not null references munch.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    archived_at timestamptz,
    version integer not null default 1,
    constraint recipes_exactly_one_owner check (
        (personal_owner_user_id is not null)::integer +
        (household_id is not null)::integer = 1
    ),
    constraint recipes_name_nonempty check (length(btrim(name)) between 1 and 200),
    constraint recipes_revision_positive check (current_revision_number > 0),
    constraint recipes_version_positive check (version > 0)
);

create unique index recipes_personal_idempotency_unique
    on munch.recipes (personal_owner_user_id, idempotency_key)
    where personal_owner_user_id is not null and idempotency_key is not null;
create unique index recipes_household_idempotency_unique
    on munch.recipes (household_id, idempotency_key)
    where household_id is not null and idempotency_key is not null;
create index recipes_personal_recent_idx
    on munch.recipes (personal_owner_user_id, updated_at desc)
    where archived_at is null;
create index recipes_household_recent_idx
    on munch.recipes (household_id, updated_at desc)
    where archived_at is null;
create index recipes_name_search_idx
    on munch.recipes using gin (to_tsvector('simple', name));

create table munch.recipe_revisions (
    id uuid primary key default gen_random_uuid(),
    recipe_id uuid not null references munch.recipes(id) on delete cascade,
    revision_number integer not null,
    servings numeric(10, 3) not null,
    description text,
    instructions jsonb not null default '[]'::jsonb,
    preparation_minutes integer,
    cooking_minutes integer,
    source_type text not null,
    source_title text,
    source_url text,
    calories_total numeric(12, 2),
    protein_g_total numeric(12, 2),
    carbs_g_total numeric(12, 2),
    fat_g_total numeric(12, 2),
    fiber_g_total numeric(12, 2),
    sugar_g_total numeric(12, 2),
    sodium_mg_total numeric(14, 2),
    calories_per_serving numeric(12, 2),
    protein_g_per_serving numeric(12, 2),
    carbs_g_per_serving numeric(12, 2),
    fat_g_per_serving numeric(12, 2),
    fiber_g_per_serving numeric(12, 2),
    sugar_g_per_serving numeric(12, 2),
    sodium_mg_per_serving numeric(14, 2),
    nutrition_status text not null,
    calculated_at timestamptz,
    created_by_user_id uuid not null references munch.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    constraint recipe_revisions_number_positive check (revision_number > 0),
    constraint recipe_revisions_servings_positive check (servings > 0),
    constraint recipe_revisions_instructions_array check (jsonb_typeof(instructions) = 'array'),
    constraint recipe_revisions_source_type check (
        source_type in ('user_entered', 'chatgpt_generated', 'imported')
    ),
    constraint recipe_revisions_nutrition_status check (
        nutrition_status in ('complete', 'partial', 'unavailable')
    ),
    constraint recipe_revisions_times_nonnegative check (
        (preparation_minutes is null or preparation_minutes >= 0)
        and (cooking_minutes is null or cooking_minutes >= 0)
    ),
    constraint recipe_revisions_nutrients_nonnegative check (
        (calories_total is null or calories_total >= 0)
        and (protein_g_total is null or protein_g_total >= 0)
        and (carbs_g_total is null or carbs_g_total >= 0)
        and (fat_g_total is null or fat_g_total >= 0)
        and (fiber_g_total is null or fiber_g_total >= 0)
        and (sugar_g_total is null or sugar_g_total >= 0)
        and (sodium_mg_total is null or sodium_mg_total >= 0)
    ),
    constraint recipe_revisions_unique_number unique (recipe_id, revision_number)
);

create table munch.recipe_ingredients (
    id uuid primary key default gen_random_uuid(),
    recipe_revision_id uuid not null references munch.recipe_revisions(id) on delete cascade,
    position integer not null,
    name text not null,
    quantity numeric(12, 3),
    unit text,
    preparation text,
    optional boolean not null default false,
    gram_weight numeric(12, 3),
    calories numeric(12, 2),
    protein_g numeric(12, 2),
    carbs_g numeric(12, 2),
    fat_g numeric(12, 2),
    fiber_g numeric(12, 2),
    sugar_g numeric(12, 2),
    sodium_mg numeric(14, 2),
    provider text,
    provider_food_id text,
    source_type text not null,
    source_url text,
    confidence numeric(5, 4),
    source_snapshot jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint recipe_ingredients_position_nonnegative check (position >= 0),
    constraint recipe_ingredients_name_nonempty check (length(btrim(name)) between 1 and 300),
    constraint recipe_ingredients_quantity_positive check (quantity is null or quantity > 0),
    constraint recipe_ingredients_gram_weight_positive check (gram_weight is null or gram_weight > 0),
    constraint recipe_ingredients_confidence_range check (
        confidence is null or (confidence >= 0 and confidence <= 1)
    ),
    constraint recipe_ingredients_source_type check (
        source_type in (
            'usda', 'open_food_facts', 'published_restaurant', 'saved_food',
            'past_meal', 'user_supplied', 'model_estimate'
        )
    ),
    constraint recipe_ingredients_snapshot_object check (jsonb_typeof(source_snapshot) = 'object'),
    constraint recipe_ingredients_unique_position unique (recipe_revision_id, position)
);

create index recipe_revisions_recipe_recent_idx
    on munch.recipe_revisions (recipe_id, revision_number desc);
create index recipe_ingredients_revision_idx
    on munch.recipe_ingredients (recipe_revision_id, position);
create index recipe_ingredients_name_search_idx
    on munch.recipe_ingredients using gin (to_tsvector('simple', name));

alter table munch.recipes enable row level security;
alter table munch.recipes force row level security;
alter table munch.recipe_revisions enable row level security;
alter table munch.recipe_revisions force row level security;
alter table munch.recipe_ingredients enable row level security;
alter table munch.recipe_ingredients force row level security;

create policy recipes_app_read on munch.recipes for select to munch_app using (
    personal_owner_user_id = munch.current_user_id()
    or (household_id is not null and munch.household_role(household_id) is not null)
);
create policy recipes_app_insert on munch.recipes for insert to munch_app with check (
    (personal_owner_user_id = munch.current_user_id() and household_id is null)
    or (
        personal_owner_user_id is null
        and household_id is not null
        and munch.household_role(household_id) in ('owner', 'member')
    )
);
create policy recipes_app_update on munch.recipes for update to munch_app using (
    personal_owner_user_id = munch.current_user_id()
    or (household_id is not null and munch.household_role(household_id) in ('owner', 'member'))
) with check (
    personal_owner_user_id = munch.current_user_id()
    or (household_id is not null and munch.household_role(household_id) in ('owner', 'member'))
);
create policy recipes_app_delete on munch.recipes for delete to munch_app using (
    personal_owner_user_id = munch.current_user_id()
    or (household_id is not null and munch.household_role(household_id) in ('owner', 'member'))
);

create policy recipe_revisions_app_read on munch.recipe_revisions for select to munch_app using (
    exists (
        select 1 from munch.recipes recipe
        where recipe.id = recipe_id
          and (
              recipe.personal_owner_user_id = munch.current_user_id()
              or (recipe.household_id is not null and munch.household_role(recipe.household_id) is not null)
          )
    )
);
create policy recipe_revisions_app_insert on munch.recipe_revisions for insert to munch_app with check (
    created_by_user_id = munch.current_user_id()
    and exists (
        select 1 from munch.recipes recipe
        where recipe.id = recipe_id
          and (
              recipe.personal_owner_user_id = munch.current_user_id()
              or (recipe.household_id is not null and munch.household_role(recipe.household_id) in ('owner', 'member'))
          )
    )
);

create policy recipe_ingredients_app_read on munch.recipe_ingredients for select to munch_app using (
    exists (
        select 1
        from munch.recipe_revisions revision
        join munch.recipes recipe on recipe.id = revision.recipe_id
        where revision.id = recipe_revision_id
          and (
              recipe.personal_owner_user_id = munch.current_user_id()
              or (recipe.household_id is not null and munch.household_role(recipe.household_id) is not null)
          )
    )
);
create policy recipe_ingredients_app_insert on munch.recipe_ingredients for insert to munch_app with check (
    exists (
        select 1
        from munch.recipe_revisions revision
        join munch.recipes recipe on recipe.id = revision.recipe_id
        where revision.id = recipe_revision_id
          and (
              recipe.personal_owner_user_id = munch.current_user_id()
              or (recipe.household_id is not null and munch.household_role(recipe.household_id) in ('owner', 'member'))
          )
    )
);

create policy recipes_auth_all on munch.recipes for all to munch_auth using (true) with check (true);
create policy recipe_revisions_auth_all on munch.recipe_revisions for all to munch_auth using (true) with check (true);
create policy recipe_ingredients_auth_all on munch.recipe_ingredients for all to munch_auth using (true) with check (true);

grant select, insert, update, delete on munch.recipes to munch_app, munch_auth;
grant select, insert, delete on munch.recipe_revisions, munch.recipe_ingredients to munch_app, munch_auth;

comment on table munch.recipes is 'Personal or household recipe identity without interpretive tags';
comment on table munch.recipe_revisions is 'Immutable structured recipe versions and deterministic nutrition totals';
comment on table munch.recipe_ingredients is 'Ordered factual ingredients with source-at-save provenance';
