import { dateInTz } from "./tz.js";

/**
 * Goals history: one row per change to a user's nutrition goals, so a past
 * period can be compared with the goal that was in effect at the time rather
 * than today's. Pure — no Supabase; `getNutritionGoalsHistory` in
 * `supabase.ts` reads the rows (merged with the current goals row by
 * `withCurrentGoals`) and `upsertNutritionGoals` writes them.
 */

/** The twelve goal columns, shared by `nutrition_goals` and its history. */
export const GOAL_COLUMNS = [
    "daily_calories",
    "daily_protein_g",
    "daily_carbs_g",
    "daily_fat_g",
    "daily_saturated_fat_g",
    "daily_fiber_g",
    "daily_sugar_g",
    "daily_added_sugar_g",
    "daily_alcohol_g",
    "daily_caffeine_mg",
    "daily_water_ml",
    "target_weight_g",
] as const;

export type GoalColumn = (typeof GOAL_COLUMNS)[number];

/** Every goal column. daily_saturated_fat_g is optional in the type so a goal
 * set written before the column existed still type-checks; pickGoals always
 * sets it (null when absent). */
export type GoalValues = Record<
    Exclude<GoalColumn, "daily_saturated_fat_g">,
    number | null
> &
    Partial<Record<"daily_saturated_fat_g", number | null>>;

export interface NutritionGoalsHistoryRow extends GoalValues {
    /** ISO instant the values took effect. */
    effective_at: string;
}

export interface GoalsOnDate {
    goals: GoalValues;
    /** The date predates every history row, so the earliest recorded goal is
     * assumed: what was in effect before it is unknown. */
    assumed: boolean;
}

/**
 * The goals in effect on a local date: the latest row whose
 * `dateInTz(effective_at, tz) <= date`, so a change made during a day applies
 * to that whole day. Before the first row, the earliest row with
 * `assumed: true`. No history at all is `null` — no targets.
 *
 * `history` must be ordered by `effective_at` ascending, as
 * `getNutritionGoalsHistory` returns it.
 */
export function goalsOnDate(
    history: readonly NutritionGoalsHistoryRow[],
    date: string,
    tz: string,
): GoalsOnDate | null {
    if (history.length === 0) return null;
    let found: NutritionGoalsHistoryRow | null = null;
    for (const row of history) {
        if (dateInTz(row.effective_at, tz) <= date) found = row;
        else break;
    }
    if (found === null) return { goals: pickGoals(history[0]!), assumed: true };
    return { goals: pickGoals(found), assumed: false };
}

/** The goal columns of a row, with numeric strings (PostgREST returns
 * `numeric` columns as numbers, but be strict) coerced and anything else null. */
export function pickGoals(
    row: Partial<Record<GoalColumn, unknown>>,
): GoalValues {
    const out = {} as GoalValues;
    for (const col of GOAL_COLUMNS) {
        const v = row[col];
        const n = typeof v === "string" ? Number(v) : v;
        out[col] = typeof n === "number" && Number.isFinite(n) ? n : null;
    }
    return out;
}

/** Whether two goal sets hold the same values, column by column. */
export function sameGoals(a: GoalValues, b: GoalValues): boolean {
    return GOAL_COLUMNS.every((c) => a[c] === b[c]);
}

/**
 * History as the read side should see it: `history` (ascending, as stored)
 * plus, when the current `nutrition_goals` row holds a change history does
 * not, that change as one more entry at the row's `updated_at`.
 *
 * Why: the table is created and seeded by its migration before the code that
 * writes it is deployed, so a goal saved by the old code in between (a first
 * goal, or a change) is in `nutrition_goals` but not here until the user's
 * next save backfills it (`recordGoalsHistory`, src/supabase.ts). Without this
 * merge, reads in the meantime would show no targets, or the stale ones.
 *
 * The rule mirrors `recordGoalsHistory`'s backfill exactly, so a read shows
 * the history the next save will write and nothing it won't:
 * - no current row: history unchanged.
 * - empty history: the current row is the one entry.
 * - `updated_at` newer than the latest `effective_at` and values differ:
 *   appended. The next save records the same values at the same instant, after
 *   which `updated_at` equals the latest `effective_at` (or a later save has
 *   moved both on), so the entry is never shown twice.
 * - values equal (whatever the times): nothing — `updated_at` is bumped by
 *   every save, so a newer one with the same values is a no-op save, not a
 *   change.
 * - values differ but `updated_at` is not newer: nothing. After the deploy
 *   every save stamps `updated_at` and the history row's `effective_at` from
 *   one process clock, in that order, so this only arises when two saves race
 *   (the earlier-stamped upsert lands last). History's latest row is then the
 *   newer stamp; appending would break the ascending order, and splicing an
 *   older entry in would show a change the write path never records. Keeping
 *   history as is matches what the next save leaves behind.
 * - an unparseable `updated_at`: nothing, as the write path does.
 */
export function withCurrentGoals(
    history: readonly NutritionGoalsHistoryRow[],
    current:
        (Partial<Record<GoalColumn, unknown>> & { updated_at: string }) | null,
): NutritionGoalsHistoryRow[] {
    const rows = [...history];
    if (!current) return rows;
    const at = Date.parse(current.updated_at);
    if (!Number.isFinite(at)) return rows;
    const goals = pickGoals(current);
    const latest = rows[rows.length - 1];
    if (latest) {
        if (sameGoals(pickGoals(latest), goals)) return rows;
        if (!(at > Date.parse(latest.effective_at))) return rows;
    }
    rows.push({ effective_at: new Date(at).toISOString(), ...goals });
    return rows;
}
