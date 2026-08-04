create table munch.grocery_lists (
    id uuid primary key default gen_random_uuid(),
    personal_owner_user_id uuid references munch.users(id) on delete cascade,
    household_id uuid references munch.households(id) on delete cascade,
    name text,
    status text not null default 'active',
    created_by_user_id uuid not null references munch.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    version integer not null default 1,
    constraint grocery_lists_exactly_one_owner check (
        (personal_owner_user_id is not null)::integer +
        (household_id is not null)::integer = 1
    ),
    constraint grocery_lists_name check (name is null or length(btrim(name)) between 1 and 120),
    constraint grocery_lists_status check (status in ('active', 'archived')),
    constraint grocery_lists_version_positive check (version > 0)
);

create unique index grocery_lists_personal_active_unique
    on munch.grocery_lists (personal_owner_user_id)
    where personal_owner_user_id is not null and status = 'active';
create unique index grocery_lists_household_active_unique
    on munch.grocery_lists (household_id)
    where household_id is not null and status = 'active';

create table munch.grocery_items (
    id uuid primary key default gen_random_uuid(),
    grocery_list_id uuid not null references munch.grocery_lists(id) on delete cascade,
    name text not null,
    normalized_name text not null,
    quantity numeric(12, 3),
    unit text,
    note text,
    food_provider text,
    provider_food_id text,
    source_recipe_id uuid references munch.recipes(id) on delete set null,
    source_recipe_revision_id uuid references munch.recipe_revisions(id) on delete set null,
    source_planned_meal_id uuid references munch.planned_meals(id) on delete set null,
    idempotency_key text,
    added_by_user_id uuid not null references munch.users(id) on delete restrict,
    updated_by_user_id uuid not null references munch.users(id) on delete restrict,
    purchased_at timestamptz,
    purchased_by_user_id uuid references munch.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    version integer not null default 1,
    constraint grocery_items_name_nonempty check (length(btrim(name)) between 1 and 300),
    constraint grocery_items_normalized_nonempty check (length(btrim(normalized_name)) between 1 and 300),
    constraint grocery_items_quantity_positive check (quantity is null or quantity > 0),
    constraint grocery_items_version_positive check (version > 0),
    constraint grocery_items_purchase_actor check (
        (purchased_at is null and purchased_by_user_id is null)
        or (purchased_at is not null and purchased_by_user_id is not null)
    )
);

create unique index grocery_items_idempotency_unique
    on munch.grocery_items (grocery_list_id, idempotency_key)
    where idempotency_key is not null;
create index grocery_items_active_idx
    on munch.grocery_items (grocery_list_id, purchased_at nulls first, created_at)
    where deleted_at is null;
create index grocery_items_normalized_idx
    on munch.grocery_items (grocery_list_id, normalized_name, unit)
    where deleted_at is null and purchased_at is null;

alter table munch.grocery_lists enable row level security;
alter table munch.grocery_lists force row level security;
alter table munch.grocery_items enable row level security;
alter table munch.grocery_items force row level security;

create policy grocery_lists_app_read on munch.grocery_lists for select to munch_app using (
    personal_owner_user_id = munch.current_user_id()
    or (household_id is not null and munch.household_role(household_id) is not null)
);
create policy grocery_lists_app_insert on munch.grocery_lists for insert to munch_app with check (
    created_by_user_id = munch.current_user_id()
    and (
        (personal_owner_user_id = munch.current_user_id() and household_id is null)
        or (
            personal_owner_user_id is null
            and household_id is not null
            and munch.household_role(household_id) in ('owner', 'member')
        )
    )
);
create policy grocery_lists_app_update on munch.grocery_lists for update to munch_app using (
    personal_owner_user_id = munch.current_user_id()
    or (household_id is not null and munch.household_role(household_id) in ('owner', 'member'))
) with check (
    personal_owner_user_id = munch.current_user_id()
    or (household_id is not null and munch.household_role(household_id) in ('owner', 'member'))
);

create policy grocery_items_app_read on munch.grocery_items for select to munch_app using (
    exists (
        select 1 from munch.grocery_lists list
        where list.id = grocery_list_id
          and (
              list.personal_owner_user_id = munch.current_user_id()
              or (list.household_id is not null and munch.household_role(list.household_id) is not null)
          )
    )
);
create policy grocery_items_app_insert on munch.grocery_items for insert to munch_app with check (
    added_by_user_id = munch.current_user_id()
    and updated_by_user_id = munch.current_user_id()
    and exists (
        select 1 from munch.grocery_lists list
        where list.id = grocery_list_id
          and (
              list.personal_owner_user_id = munch.current_user_id()
              or (list.household_id is not null and munch.household_role(list.household_id) in ('owner', 'member'))
          )
    )
);
create policy grocery_items_app_update on munch.grocery_items for update to munch_app using (
    exists (
        select 1 from munch.grocery_lists list
        where list.id = grocery_list_id
          and (
              list.personal_owner_user_id = munch.current_user_id()
              or (list.household_id is not null and munch.household_role(list.household_id) in ('owner', 'member'))
          )
    )
) with check (
    updated_by_user_id = munch.current_user_id()
    and exists (
        select 1 from munch.grocery_lists list
        where list.id = grocery_list_id
          and (
              list.personal_owner_user_id = munch.current_user_id()
              or (list.household_id is not null and munch.household_role(list.household_id) in ('owner', 'member'))
          )
    )
);

create policy grocery_lists_auth_all on munch.grocery_lists
    for all to munch_auth using (true) with check (true);
create policy grocery_items_auth_all on munch.grocery_items
    for all to munch_auth using (true) with check (true);

grant select, insert, update, delete on munch.grocery_lists, munch.grocery_items to munch_app, munch_auth;

comment on table munch.grocery_lists is 'One active personal or household list; not pantry inventory';
comment on table munch.grocery_items is 'Explicitly requested grocery needs with recipe and plan provenance';
