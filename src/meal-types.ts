/**
 * The meal types a meal or saved meal can carry, in the order of a day.
 *
 * A type is the meal's place in the user's own day, as the user names it, not
 * a clock window: 15:00 is obiad in Poland, comida in Spain and oyatsu in
 * Japan, so nothing maps a time to one of the added types. `logged_at`
 * already records when a meal was eaten.
 *
 * Must equal the `meals_meal_type_check` and `saved_meals_meal_type_check`
 * lists in `supabase/migrations/20261108120000_meal_types.sql`; adding a
 * value needs a migration that drops and re-adds both constraints.
 *
 * No runtime imports, so it stays safe to `@inlinets` into a widget.
 */
export const MEAL_TYPES = [
    "breakfast",
    "second_breakfast",
    "lunch",
    "afternoon_snack",
    "dinner",
    "supper",
    "pre_workout",
    "post_workout",
    "snack",
] as const;

export type MealType = (typeof MEAL_TYPES)[number];

/**
 * The four original types. The importer only ever infers one of these from a
 * timestamp (`inferMealType`), and `get_meal_patterns` always lists them,
 * adding any other type only when it appears in the window.
 */
export const BASE_MEAL_TYPES = [
    "breakfast",
    "lunch",
    "dinner",
    "snack",
] as const satisfies readonly MealType[];

export type BaseMealType = (typeof BASE_MEAL_TYPES)[number];

export function isBaseMealType(value: unknown): value is BaseMealType {
    return (
        typeof value === "string" &&
        (BASE_MEAL_TYPES as readonly string[]).includes(value)
    );
}

export function isMealType(value: unknown): value is MealType {
    return (
        typeof value === "string" &&
        (MEAL_TYPES as readonly string[]).includes(value)
    );
}
