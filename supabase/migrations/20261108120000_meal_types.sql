-- Meal types: widen the meal_type check on meals and saved_meals from the four
-- original types (breakfast, lunch, dinner, snack) to the nine in
-- src/meal-types.ts, in day order.
--
-- A type is the meal's place in the user's own day, not a clock window, so the
-- new values are plain labels with no time attached. The constraint lists here
-- must equal MEAL_TYPES; src/meal-types.test.ts pins that.
--
-- saved_meals declared its check inline (20261010120000_saved_meals.sql), so its
-- name is whatever Postgres generated. The DO block finds and drops any check
-- on saved_meals that mentions meal_type, then adds a named one. The rpc
-- functions pass meal_type through as text and need no change.
--
-- Additive in effect: every existing row already satisfies the wider list, so
-- this is safe on populated tables and lands before the server that writes the
-- new values.

alter table public.meals drop constraint if exists meals_meal_type_check;
alter table public.meals
    add constraint meals_meal_type_check
    check (meal_type = any (array[
        'breakfast'::text, 'second_breakfast'::text, 'lunch'::text,
        'afternoon_snack'::text, 'dinner'::text, 'supper'::text,
        'pre_workout'::text, 'post_workout'::text, 'snack'::text
    ]));

do $$
declare
    c record;
begin
    for c in
        select conname
        from pg_constraint
        where conrelid = 'public.saved_meals'::regclass
          and contype = 'c'
          and pg_get_constraintdef(oid) ilike '%meal_type%'
    loop
        execute format(
            'alter table public.saved_meals drop constraint %I', c.conname
        );
    end loop;
end
$$;

alter table public.saved_meals
    add constraint saved_meals_meal_type_check
    check (meal_type in (
        'breakfast', 'second_breakfast', 'lunch', 'afternoon_snack',
        'dinner', 'supper', 'pre_workout', 'post_workout', 'snack'
    ));
