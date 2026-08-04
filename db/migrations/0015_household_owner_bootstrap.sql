-- Break the household-owner bootstrap cycle without weakening normal RLS.
-- The owner must insert their membership immediately after inserting the
-- household, before household_role() can return a value.

create or replace function munch.household_owner_id(target_household_id uuid)
returns uuid
language sql
stable
security definer
set search_path = munch, pg_temp
as $$
    select household.owner_user_id
    from munch.households household
    where household.id = target_household_id
    limit 1
$$;

revoke all on function munch.household_owner_id(uuid) from public;
grant execute on function munch.household_owner_id(uuid) to munch_app, munch_auth;

drop policy household_memberships_app_owner_insert
    on munch.household_memberships;

create policy household_memberships_app_owner_insert
    on munch.household_memberships for insert to munch_app
    with check (
        munch.household_role(household_id) = 'owner'
        or (
            user_id = munch.current_user_id()
            and role = 'owner'
            and status = 'active'
            and munch.household_owner_id(household_id) = munch.current_user_id()
        )
    );

comment on function munch.household_owner_id(uuid) is
    'Narrow RLS bootstrap helper returning only the owner UUID for one household';
