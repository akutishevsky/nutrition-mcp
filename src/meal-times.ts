import type { Meal } from "./supabase.js";
import { formatLocalDateTime } from "./tz.js";

/**
 * Meal clock times for the widgets: the payload under MEAL_TIMES_META_KEY
 * (src/widgets.ts). Pure — no Supabase, no Hono, never imports mcp.ts.
 *
 * The breakdown rows (MEAL_BREAKDOWN_ITEM in src/mcp.ts) carry a day at most,
 * never a time, and their schema is frozen, so the widgets' "08:10 · Breakfast"
 * meta line reads the local wall-clock time from the result's `_meta` instead.
 * `times` is aligned BY POSITION with structuredContent.meals, exactly like
 * MEAL_ITEMS_META_KEY's `meals`: the rows carry no id.
 *
 * The meal-logged, nutrition-summary and goal-progress widgets all read their
 * rows' times from this one payload (get_goal_progress sends it beside
 * GOAL_DAY_META_KEY, which no longer repeats a per-row time).
 *
 * `current` is set only by the meal-progress tools (log_meal, update_meal,
 * log_saved_meal): the position of the meal the call wrote among those rows,
 * so the meal-logged widget can mark it without guessing from its description
 * (a backdated or edited meal is not necessarily the last row). null when that
 * meal is not among the rows.
 */
export interface MealTimesMeta {
    v: 1;
    /** Local "HH:MM" per row, in the profile timezone the rows were bucketed in. */
    times: string[];
    /** Position of the meal just written, or null; absent on read-only tools. */
    current?: number | null;
}

/** Local "HH:MM" of an instant in `tz`, the same slice every meal listing
 * prints (renderMealListing in src/meal-listing.ts). The one clock helper the
 * widget `_meta` builders share: buildMealTimesMeta here, the goal-day water
 * entries and `now` (src/goal-day.ts) and the digest (src/digest.ts). */
export function localClock(instant: Date | string, tz: string): string {
    return formatLocalDateTime(instant, tz).slice(11, 16);
}

/**
 * Build MealTimesMeta for `rowMeals` — exactly the meals behind the tool's
 * structuredContent.meals, in row order. `currentId` (the meal-progress tools
 * only) adds `current`.
 */
export function buildMealTimesMeta(
    rowMeals: readonly Pick<Meal, "id" | "logged_at">[],
    tz: string,
    currentId?: string,
): MealTimesMeta {
    const meta: MealTimesMeta = {
        v: 1,
        times: rowMeals.map((m) => localClock(m.logged_at, tz)),
    };
    if (currentId !== undefined) {
        const i = rowMeals.findIndex((m) => m.id === currentId);
        meta.current = i === -1 ? null : i;
    }
    return meta;
}
