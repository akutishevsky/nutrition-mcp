alter table munch.meals
    add column source_recipe_id uuid references munch.recipes(id) on delete set null,
    add column source_recipe_revision_id uuid references munch.recipe_revisions(id) on delete set null,
    add column source_planned_meal_id uuid references munch.planned_meals(id) on delete set null;

create index meals_source_recipe_idx
    on munch.meals (user_id, source_recipe_id, logged_at desc)
    where source_recipe_id is not null;
create index meals_source_planned_meal_idx
    on munch.meals (user_id, source_planned_meal_id)
    where source_planned_meal_id is not null;

create view munch.recipe_usage_facts
with (security_invoker = true)
as
select
    recipe.id as recipe_id,
    recipe.personal_owner_user_id,
    recipe.household_id,
    count(distinct planned.id) filter (where planned.deleted_at is null) as times_scheduled,
    max(planned.planned_date) filter (where planned.deleted_at is null) as last_scheduled_date,
    count(distinct meal.id) as times_logged,
    max(meal.logged_at) as last_logged_at,
    max(recipe.updated_at) as recipe_updated_at
from munch.recipes recipe
left join munch.planned_meals planned on planned.recipe_id = recipe.id
left join munch.meals meal on meal.source_recipe_id = recipe.id
group by recipe.id, recipe.personal_owner_user_id, recipe.household_id;

grant select on munch.recipe_usage_facts to munch_app, munch_auth;

comment on view munch.recipe_usage_facts is
    'Security-invoker factual scheduling and logging counts for model inference; no favorite or recommendation score';
