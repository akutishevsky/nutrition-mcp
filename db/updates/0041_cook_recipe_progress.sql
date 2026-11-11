-- Recipe experience (2026-11-10 brief R2): "Start cook" on a recipe
-- creates a cook session whose single dish is linked to the exact
-- recipe revision. Cook mode — ingredient and step checklists with an
-- obvious current step — persists its progress ON that dish, so the
-- state lives on the cook session itself and is visible through every
-- cook read path (the app's GET /api/app/cooks/:id and the MCP
-- get_cook tool read the same serialized dish). No parallel model.
--
-- Shape: { "steps": string[], "checked_ingredients": number[],
--          "checked_steps": number[] }
-- `steps` is the pinned instruction list from the recipe revision the
-- session was started from; the checked arrays hold positions into the
-- dish's actual_ingredients / steps. NULL means the dish is not a
-- recipe cook session.
alter table munch.cook_dishes
    add column if not exists recipe_progress jsonb;

alter table munch.cook_dishes
    drop constraint if exists cook_dishes_recipe_progress_object;
alter table munch.cook_dishes
    add constraint cook_dishes_recipe_progress_object
    check (
        recipe_progress is null
        or jsonb_typeof(recipe_progress) = 'object'
    );
