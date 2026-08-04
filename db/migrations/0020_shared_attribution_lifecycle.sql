-- Household-owned records must survive deletion of a non-owner member account.
-- Keep nullable user references for audit correlation while storing the factual
-- household display name that was visible when the action occurred.

alter table munch.recipes
    drop constraint recipes_created_by_user_id_fkey,
    drop constraint recipes_updated_by_user_id_fkey,
    alter column created_by_user_id drop not null,
    alter column updated_by_user_id drop not null,
    add column created_by_display_name text,
    add constraint recipes_created_by_user_id_fkey
        foreign key (created_by_user_id) references munch.users(id) on delete set null,
    add constraint recipes_updated_by_user_id_fkey
        foreign key (updated_by_user_id) references munch.users(id) on delete set null,
    add constraint recipes_creator_display_name_check
        check (
            created_by_display_name is null
            or length(btrim(created_by_display_name)) between 1 and 80
        );

alter table munch.recipe_revisions
    drop constraint recipe_revisions_created_by_user_id_fkey,
    alter column created_by_user_id drop not null,
    add constraint recipe_revisions_created_by_user_id_fkey
        foreign key (created_by_user_id) references munch.users(id) on delete set null;

alter table munch.planned_meals
    drop constraint planned_meals_created_by_user_id_fkey,
    drop constraint planned_meals_updated_by_user_id_fkey,
    alter column created_by_user_id drop not null,
    alter column updated_by_user_id drop not null,
    add column created_by_display_name text,
    add constraint planned_meals_created_by_user_id_fkey
        foreign key (created_by_user_id) references munch.users(id) on delete set null,
    add constraint planned_meals_updated_by_user_id_fkey
        foreign key (updated_by_user_id) references munch.users(id) on delete set null,
    add constraint planned_meals_creator_display_name_check
        check (
            created_by_display_name is null
            or length(btrim(created_by_display_name)) between 1 and 80
        );

alter table munch.grocery_lists
    drop constraint grocery_lists_created_by_user_id_fkey,
    alter column created_by_user_id drop not null,
    add constraint grocery_lists_created_by_user_id_fkey
        foreign key (created_by_user_id) references munch.users(id) on delete set null;

alter table munch.grocery_items
    drop constraint grocery_items_added_by_user_id_fkey,
    drop constraint grocery_items_updated_by_user_id_fkey,
    alter column added_by_user_id drop not null,
    alter column updated_by_user_id drop not null,
    add column added_by_display_name text,
    add constraint grocery_items_added_by_user_id_fkey
        foreign key (added_by_user_id) references munch.users(id) on delete set null,
    add constraint grocery_items_updated_by_user_id_fkey
        foreign key (updated_by_user_id) references munch.users(id) on delete set null,
    add constraint grocery_items_adder_display_name_check
        check (
            added_by_display_name is null
            or length(btrim(added_by_display_name)) between 1 and 80
        );

comment on column munch.recipes.created_by_display_name is
    'Household display name captured when the recipe was created';
comment on column munch.planned_meals.created_by_display_name is
    'Household display name captured when the meal was scheduled';
comment on column munch.grocery_items.added_by_display_name is
    'Household display name captured when the grocery item was added';
