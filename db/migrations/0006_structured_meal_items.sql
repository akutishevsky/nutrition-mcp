-- Structured meal components and immutable source snapshots. The parent meals
-- row remains the aggregate reporting surface used by all inherited summaries.

create table munch.meal_items (
    id uuid primary key default gen_random_uuid(),
    meal_id uuid not null references munch.meals(id) on delete cascade,
    user_id uuid not null references munch.users(id) on delete cascade,
    position integer not null,
    name text not null,
    quantity numeric(10, 3),
    portion_label text,
    gram_weight numeric(10, 3),
    calories numeric(10, 2),
    protein_g numeric(10, 2),
    carbs_g numeric(10, 2),
    fat_g numeric(10, 2),
    fiber_g numeric(10, 2),
    sugar_g numeric(10, 2),
    alcohol_g numeric(10, 2),
    sodium_mg numeric(12, 2),
    saturated_fat_g numeric(10, 2),
    cholesterol_mg numeric(12, 2),
    potassium_mg numeric(12, 2),
    source_type text not null,
    provider text,
    provider_food_id text,
    provider_revision text,
    source_url text,
    source_updated_at timestamptz,
    confidence numeric(5, 4),
    assumptions jsonb not null default '[]'::jsonb,
    source_snapshot jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint meal_items_position_nonnegative check (position >= 0),
    constraint meal_items_name_nonempty check (length(btrim(name)) > 0),
    constraint meal_items_quantity_positive check (quantity is null or quantity > 0),
    constraint meal_items_gram_weight_positive check (gram_weight is null or gram_weight > 0),
    constraint meal_items_calories_nonnegative check (calories is null or calories >= 0),
    constraint meal_items_protein_nonnegative check (protein_g is null or protein_g >= 0),
    constraint meal_items_carbs_nonnegative check (carbs_g is null or carbs_g >= 0),
    constraint meal_items_fat_nonnegative check (fat_g is null or fat_g >= 0),
    constraint meal_items_fiber_nonnegative check (fiber_g is null or fiber_g >= 0),
    constraint meal_items_sugar_nonnegative check (sugar_g is null or sugar_g >= 0),
    constraint meal_items_alcohol_nonnegative check (alcohol_g is null or alcohol_g >= 0),
    constraint meal_items_sodium_nonnegative check (sodium_mg is null or sodium_mg >= 0),
    constraint meal_items_saturated_fat_nonnegative check (
        saturated_fat_g is null or saturated_fat_g >= 0
    ),
    constraint meal_items_cholesterol_nonnegative check (
        cholesterol_mg is null or cholesterol_mg >= 0
    ),
    constraint meal_items_potassium_nonnegative check (potassium_mg is null or potassium_mg >= 0),
    constraint meal_items_confidence_range check (
        confidence is null or (confidence >= 0 and confidence <= 1)
    ),
    constraint meal_items_source_type check (
        source_type in (
            'usda',
            'open_food_facts',
            'published_restaurant',
            'saved_food',
            'past_meal',
            'user_supplied',
            'model_estimate',
            'legacy_aggregate'
        )
    ),
    constraint meal_items_assumptions_array check (jsonb_typeof(assumptions) = 'array'),
    constraint meal_items_unique_position unique (meal_id, position)
);

create index meal_items_user_meal_idx on munch.meal_items (user_id, meal_id, position);
create index meal_items_user_provider_idx
    on munch.meal_items (user_id, provider, provider_food_id)
    where provider is not null and provider_food_id is not null;
create index meal_items_user_name_search_idx
    on munch.meal_items using gin (to_tsvector('simple', name));

alter table munch.meal_items enable row level security;
alter table munch.meal_items force row level security;

create policy meal_items_app_self
    on munch.meal_items
    for all
    to munch_app
    using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());

create policy meal_items_auth_all
    on munch.meal_items
    for all
    to munch_auth
    using (true)
    with check (true);

grant select, insert, update, delete on munch.meal_items to munch_app;
grant select, insert, update, delete on munch.meal_items to munch_auth;

comment on table munch.meal_items is 'Structured meal components with source-at-time snapshots';
comment on column munch.meal_items.source_snapshot is 'Provider or user data captured when the meal was confirmed; historical meals are never silently recalculated';
comment on column munch.meal_items.assumptions is 'Explicit unresolved assumptions accepted by the user at confirmation';
