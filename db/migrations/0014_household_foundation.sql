-- Shared household identity boundary. Household resources are added in later
-- migrations and inherit access through these active memberships.

create table munch.households (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    owner_user_id uuid not null references munch.users(id) on delete restrict,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    archived_at timestamptz,
    constraint households_name_nonempty check (length(btrim(name)) between 1 and 120),
    constraint households_version_positive check (version > 0)
);

create table munch.household_memberships (
    id uuid primary key default gen_random_uuid(),
    household_id uuid not null references munch.households(id) on delete cascade,
    -- The membership row and display name remain after a non-owner deletes their
    -- account so shared-resource attribution is not silently erased.
    user_id uuid references munch.users(id) on delete set null,
    display_name text not null,
    role text not null,
    status text not null default 'active',
    joined_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint household_memberships_display_name_nonempty
        check (length(btrim(display_name)) between 1 and 80),
    constraint household_memberships_role
        check (role in ('owner', 'member', 'viewer')),
    constraint household_memberships_status
        check (status in ('active', 'removed', 'left')),
    constraint household_memberships_active_user_present
        check (status <> 'active' or user_id is not null)
);

create unique index household_memberships_active_user_unique
    on munch.household_memberships (user_id)
    where status = 'active' and user_id is not null;
create unique index household_memberships_active_household_user_unique
    on munch.household_memberships (household_id, user_id)
    where status = 'active' and user_id is not null;
create unique index household_memberships_active_owner_unique
    on munch.household_memberships (household_id)
    where status = 'active' and role = 'owner' and user_id is not null;
create index household_memberships_household_active_idx
    on munch.household_memberships (household_id, joined_at)
    where status = 'active' and user_id is not null;

create table munch.household_invitations (
    id uuid primary key default gen_random_uuid(),
    household_id uuid not null references munch.households(id) on delete cascade,
    email text not null,
    role text not null,
    token_hash bytea not null unique,
    expires_at timestamptz not null,
    accepted_at timestamptz,
    revoked_at timestamptz,
    invited_by_user_id uuid not null references munch.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint household_invitations_email_normalized
        check (email = lower(btrim(email))),
    constraint household_invitations_email_nonempty
        check (length(email) between 3 and 320),
    constraint household_invitations_role
        check (role in ('member', 'viewer')),
    constraint household_invitations_expiry_after_creation
        check (expires_at > created_at)
);

create unique index household_invitations_pending_email_unique
    on munch.household_invitations (household_id, email)
    where accepted_at is null and revoked_at is null;
create index household_invitations_pending_expiry_idx
    on munch.household_invitations (expires_at)
    where accepted_at is null and revoked_at is null;

create or replace function munch.household_role(target_household_id uuid)
returns text
language sql
stable
security definer
set search_path = munch, pg_temp
as $$
    select membership.role
    from munch.household_memberships membership
    where membership.household_id = target_household_id
      and membership.user_id = munch.current_user_id()
      and membership.status = 'active'
    limit 1
$$;

revoke all on function munch.household_role(uuid) from public;
grant execute on function munch.household_role(uuid) to munch_app, munch_auth;

create or replace function munch.enforce_household_member_limit()
returns trigger
language plpgsql
security definer
set search_path = munch, pg_temp
as $$
declare
    active_count integer;
begin
    if new.status <> 'active' or new.user_id is null then
        return new;
    end if;

    select count(*) into active_count
    from munch.household_memberships membership
    where membership.household_id = new.household_id
      and membership.status = 'active'
      and membership.user_id is not null
      and membership.id <> new.id;

    if active_count >= 6 then
        raise exception 'household_member_limit_reached' using errcode = '23514';
    end if;
    return new;
end
$$;

create trigger household_memberships_limit_trigger
before insert or update of status, user_id, household_id
on munch.household_memberships
for each row execute function munch.enforce_household_member_limit();

create or replace function munch.enforce_household_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = munch, pg_temp
as $$
declare
    expected_owner uuid;
begin
    select owner_user_id into expected_owner
    from munch.households
    where id = new.household_id;

    -- Foreign-key ON DELETE SET NULL preserves a former member's attribution.
    -- Active owner rows are never allowed to become detached; ownership must be
    -- transferred or the household dissolved first.
    if new.user_id is null then
        if old.role = 'owner' and old.status = 'active' then
            raise exception 'household_owner_transfer_required' using errcode = '23514';
        end if;
        new.status := 'left';
        new.updated_at := now();
        return new;
    end if;

    if new.role = 'owner' and new.user_id <> expected_owner then
        raise exception 'household_owner_membership_mismatch' using errcode = '23514';
    end if;
    if new.user_id = expected_owner and (new.role <> 'owner' or new.status <> 'active') then
        raise exception 'household_owner_must_remain_active_owner' using errcode = '23514';
    end if;
    return new;
end
$$;

create trigger household_memberships_owner_trigger
before insert or update of role, status, user_id, household_id
on munch.household_memberships
for each row execute function munch.enforce_household_owner_membership();

alter table munch.households enable row level security;
alter table munch.households force row level security;
alter table munch.household_memberships enable row level security;
alter table munch.household_memberships force row level security;
alter table munch.household_invitations enable row level security;
alter table munch.household_invitations force row level security;

create policy households_app_member_select
    on munch.households for select to munch_app
    using (munch.household_role(id) is not null);
create policy households_app_owner_insert
    on munch.households for insert to munch_app
    with check (owner_user_id = munch.current_user_id());
create policy households_app_owner_update
    on munch.households for update to munch_app
    using (munch.household_role(id) = 'owner')
    with check (owner_user_id = munch.current_user_id());
create policy households_app_owner_delete
    on munch.households for delete to munch_app
    using (munch.household_role(id) = 'owner');

create policy household_memberships_app_member_select
    on munch.household_memberships for select to munch_app
    using (munch.household_role(household_id) is not null);
create policy household_memberships_app_owner_insert
    on munch.household_memberships for insert to munch_app
    with check (
        munch.household_role(household_id) = 'owner'
        or (
            user_id = munch.current_user_id()
            and role = 'owner'
            and exists (
                select 1 from munch.households household
                where household.id = household_id
                  and household.owner_user_id = munch.current_user_id()
            )
        )
    );
create policy household_memberships_app_owner_update
    on munch.household_memberships for update to munch_app
    using (munch.household_role(household_id) = 'owner' or user_id = munch.current_user_id())
    with check (
        munch.household_role(household_id) = 'owner'
        or (user_id = munch.current_user_id() and status = 'left')
    );

create policy household_invitations_app_member_select
    on munch.household_invitations for select to munch_app
    using (munch.household_role(household_id) is not null);
create policy household_invitations_app_owner_insert
    on munch.household_invitations for insert to munch_app
    with check (
        munch.household_role(household_id) = 'owner'
        and invited_by_user_id = munch.current_user_id()
    );
create policy household_invitations_app_owner_update
    on munch.household_invitations for update to munch_app
    using (munch.household_role(household_id) = 'owner')
    with check (munch.household_role(household_id) = 'owner');

create policy households_auth_all on munch.households
    for all to munch_auth using (true) with check (true);
create policy household_memberships_auth_all on munch.household_memberships
    for all to munch_auth using (true) with check (true);
create policy household_invitations_auth_all on munch.household_invitations
    for all to munch_auth using (true) with check (true);

grant select, insert, update, delete on
    munch.households,
    munch.household_memberships,
    munch.household_invitations
    to munch_app, munch_auth;

comment on table munch.households is 'Shared recipe, meal-plan, and grocery workspace';
comment on table munch.household_memberships is 'Connected or former Munch accounts with retained display-name attribution';
comment on table munch.household_invitations is 'Single-use hashed invitations; raw tokens are never stored';
