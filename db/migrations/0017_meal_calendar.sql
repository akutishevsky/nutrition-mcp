create table munch.planned_meals (
    id uuid primary key default gen_random_uuid(),
    personal_owner_user_id uuid references munch.users(id) on delete cascade,
    household_id uuid references munch.households(id) on delete cascade,
    planned_date date not null,
    meal_slot text,
    recipe_id uuid not null references munch.recipes(id) on delete restrict,
    recipe_revision_id uuid not null references munch.recipe_revisions(id) on delete restrict,
    servings numeric(10, 3) not null,
    note text,
    idempotency_key text,
    created_by_user_id uuid not null references munch.users(id) on delete restrict,
    updated_by_user_id uuid not null references munch.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    version integer not null default 1,
    constraint planned_meals_exactly_one_owner check (
        (personal_owner_user_id is not null)::integer +
        (household_id is not null)::integer = 1
    ),
    constraint planned_meals_slot check (
        meal_slot is null or meal_slot in ('breakfast', 'lunch', 'dinner', 'snack')
    ),
    constraint planned_meals_servings_positive check (servings > 0),
    constraint planned_meals_version_positive check (version > 0)
);

create unique index planned_meals_personal_idempotency_unique
    on munch.planned_meals (personal_owner_user_id, idempotency_key)
    where personal_owner_user_id is not null and idempotency_key is not null;
create unique index planned_meals_household_idempotency_unique
    on munch.planned_meals (household_id, idempotency_key)
    where household_id is not null and idempotency_key is not null;
create index planned_meals_personal_date_idx
    on munch.planned_meals (personal_owner_user_id, planned_date, meal_slot)
    where deleted_at is null;
create index planned_meals_household_date_idx
    on munch.planned_meals (household_id, planned_date, meal_slot)
    where deleted_at is null;

alter table munch.planned_meals enable row level security;
alter table munch.planned_meals force row level security;

create policy planned_meals_app_read on munch.planned_meals for select to munch_app using (
    personal_owner_user_id = munch.current_user_id()
    or (household_id is not null and munch.household_role(household_id) is not null)
);
create policy planned_meals_app_insert on munch.planned_meals for insert to munch_app with check (
    created_by_user_id = munch.current_user_id()
    and updated_by_user_id = munch.current_user_id()
    and (
        (personal_owner_user_id = munch.current_user_id() and household_id is null)
        or (
            personal_owner_user_id is null
            and household_id is not null
            and munch.household_role(household_id) in ('owner', 'member')
        )
    )
);
create policy planned_meals_app_update on munch.planned_meals for update to munch_app using (
    personal_owner_user_id = munch.current_user_id()
    or (household_id is not null and munch.household_role(household_id) in ('owner', 'member'))
) with check (
    updated_by_user_id = munch.current_user_id()
    and (
        personal_owner_user_id = munch.current_user_id()
        or (household_id is not null and munch.household_role(household_id) in ('owner', 'member'))
    )
);
create policy planned_meals_app_delete on munch.planned_meals for delete to munch_app using (
    personal_owner_user_id = munch.current_user_id()
    or (household_id is not null and munch.household_role(household_id) in ('owner', 'member'))
);
create policy planned_meals_auth_all on munch.planned_meals
    for all to munch_auth using (true) with check (true);

grant select, insert, update, delete on munch.planned_meals to munch_app, munch_auth;

comment on table munch.planned_meals is 'Personal or household calendar entries pinned to immutable recipe revisions';
