create or replace function munch.capture_recipe_creator_display_name()
returns trigger
language plpgsql
security definer
set search_path = munch, pg_temp
as $$
begin
    if new.household_id is not null
       and new.created_by_user_id is not null
       and new.created_by_display_name is null then
        select membership.display_name
        into new.created_by_display_name
        from munch.household_memberships membership
        where membership.household_id = new.household_id
          and membership.user_id = new.created_by_user_id
          and membership.status = 'active'
        limit 1;
    end if;
    return new;
end
$$;

create trigger recipes_capture_creator_display_name
before insert on munch.recipes
for each row execute function munch.capture_recipe_creator_display_name();

create or replace function munch.capture_planned_meal_creator_display_name()
returns trigger
language plpgsql
security definer
set search_path = munch, pg_temp
as $$
begin
    if new.household_id is not null
       and new.created_by_user_id is not null
       and new.created_by_display_name is null then
        select membership.display_name
        into new.created_by_display_name
        from munch.household_memberships membership
        where membership.household_id = new.household_id
          and membership.user_id = new.created_by_user_id
          and membership.status = 'active'
        limit 1;
    end if;
    return new;
end
$$;

create trigger planned_meals_capture_creator_display_name
before insert on munch.planned_meals
for each row execute function munch.capture_planned_meal_creator_display_name();

create or replace function munch.capture_grocery_item_adder_display_name()
returns trigger
language plpgsql
security definer
set search_path = munch, pg_temp
as $$
declare
    target_household_id uuid;
begin
    if new.added_by_user_id is null or new.added_by_display_name is not null then
        return new;
    end if;

    select list.household_id
    into target_household_id
    from munch.grocery_lists list
    where list.id = new.grocery_list_id;

    if target_household_id is not null then
        select membership.display_name
        into new.added_by_display_name
        from munch.household_memberships membership
        where membership.household_id = target_household_id
          and membership.user_id = new.added_by_user_id
          and membership.status = 'active'
        limit 1;
    end if;
    return new;
end
$$;

create trigger grocery_items_capture_adder_display_name
before insert on munch.grocery_items
for each row execute function munch.capture_grocery_item_adder_display_name();

revoke all on function munch.capture_recipe_creator_display_name() from public;
revoke all on function munch.capture_planned_meal_creator_display_name() from public;
revoke all on function munch.capture_grocery_item_adder_display_name() from public;
