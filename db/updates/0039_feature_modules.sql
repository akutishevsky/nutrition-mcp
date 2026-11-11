-- Feature toggles (2026-11-10, brief addendum 10): the five optional
-- modules — Meal Plan, Recipes, Groceries, Pantry, Cooks — each get an
-- opt-out flag on the account-preferences row, next to the existing
-- per-account preference columns (widgets_enabled, pantry_enabled).
-- Every flag defaults TRUE: modules are on until the user turns them
-- off, and turning one off only hides it — no module data is touched
-- (brief T4). The contract lives in src/feature-modules.ts; reads and
-- writes go through src/feature-modules-repository.ts.
alter table munch.account_preferences
    add column if not exists feature_plan_enabled boolean not null default true,
    add column if not exists feature_recipes_enabled boolean not null default true,
    add column if not exists feature_groceries_enabled boolean not null default true,
    add column if not exists feature_pantry_enabled boolean not null default true,
    add column if not exists feature_cooks_enabled boolean not null default true;
