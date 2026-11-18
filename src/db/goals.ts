import { ToolError, newErrorRef } from "../errors.js";
import {
    GOAL_COLUMNS,
    pickGoals,
    sameGoals,
    withCurrentGoals,
    type NutritionGoalsHistoryRow,
} from "../goals-history.js";
import { toStoredInteger } from "../units.js";
import { assertWindowComplete, fetchAllPages, getSupabase } from "./client.js";

// ---------- Nutrition goals ----------

export interface NutritionGoals {
    user_id: string;
    daily_calories: number | null;
    daily_protein_g: number | null;
    daily_carbs_g: number | null;
    daily_fat_g: number | null;
    // Saturated fat is a ceiling like sugar (0 is a real limit, "none").
    // Trans fat has no goal.
    daily_saturated_fat_g?: number | null;
    daily_fiber_g: number | null;
    // Total sugars, and pure ethanol. Both are ceilings ("stay under"), unlike
    // every other goal here, which is a floor — see formatGoalLine in mcp.ts.
    daily_sugar_g: number | null;
    // Added sugars only (see Meal.added_sugar_g), a ceiling like sugar; 0 is a
    // real limit ("none").
    daily_added_sugar_g: number | null;
    daily_alcohol_g: number | null;
    // Milligrams, and a ceiling too — 0 means "none". numeric(7,2) in the DB,
    // since mg targets run three orders larger than the gram ones above.
    daily_caffeine_mg: number | null;
    // Milligrams, a ceiling like caffeine (0 is a real limit). numeric(7,2),
    // like daily_caffeine_mg.
    daily_sodium_mg?: number | null;
    daily_water_ml: number | null;
    target_weight_g: number | null;
    updated_at: string;
}

export interface NutritionGoalsInput {
    daily_calories?: number | null;
    daily_protein_g?: number | null;
    daily_carbs_g?: number | null;
    daily_fat_g?: number | null;
    daily_saturated_fat_g?: number | null;
    daily_fiber_g?: number | null;
    daily_sugar_g?: number | null;
    daily_added_sugar_g?: number | null;
    daily_alcohol_g?: number | null;
    daily_caffeine_mg?: number | null;
    daily_sodium_mg?: number | null;
    daily_water_ml?: number | null;
    target_weight_g?: number | null;
}

export async function upsertNutritionGoals(
    userId: string,
    input: NutritionGoalsInput,
): Promise<NutritionGoals> {
    // The row as it was before this save, so recordGoalsHistory can date a
    // change history missed at the time it was actually made.
    const { data: priorData, error: priorErr } = await getSupabase()
        .from("nutrition_goals")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
    if (priorErr) throw new Error(`Failed to save goals: ${priorErr.message}`);
    const prior = (priorData as NutritionGoals | null) ?? null;

    const { data, error } = await getSupabase()
        .from("nutrition_goals")
        .upsert(
            {
                user_id: userId,
                // daily_calories and daily_water_ml are integer columns; the
                // gram targets are numeric(6,2) and daily_caffeine_mg is
                // numeric(7,2). See toStoredInteger — a water goal converted
                // from "half a gallon" arrives fractional.
                daily_calories:
                    input.daily_calories == null
                        ? null
                        : toStoredInteger(input.daily_calories),
                daily_protein_g: input.daily_protein_g ?? null,
                daily_carbs_g: input.daily_carbs_g ?? null,
                daily_fat_g: input.daily_fat_g ?? null,
                daily_saturated_fat_g: input.daily_saturated_fat_g ?? null,
                daily_fiber_g: input.daily_fiber_g ?? null,
                daily_sugar_g: input.daily_sugar_g ?? null,
                daily_added_sugar_g: input.daily_added_sugar_g ?? null,
                daily_alcohol_g: input.daily_alcohol_g ?? null,
                daily_caffeine_mg: input.daily_caffeine_mg ?? null,
                daily_sodium_mg: input.daily_sodium_mg ?? null,
                daily_water_ml:
                    input.daily_water_ml == null
                        ? null
                        : toStoredInteger(input.daily_water_ml),
                target_weight_g: input.target_weight_g ?? null,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
        )
        .select()
        .single();

    if (error) throw new Error(`Failed to save goals: ${error.message}`);
    const saved = data as NutritionGoals;
    await recordGoalsHistory(userId, prior, saved);
    return saved;
}

/**
 * Brings `nutrition_goals_history` up to date with this save. The comparison
 * is against the user's latest history row, not against the `nutrition_goals`
 * row alone, and it runs in two steps:
 *
 * 1. If the row as it was before this save (`prior`) differs from the latest
 *    history row, history missed that change, and it is recorded at the
 *    prior row's own `updated_at`, i.e. when it was actually made. Two cases
 *    reach this: a history insert that failed earlier (the retry then dates
 *    the change to the original save, not to the retry), and a goal set by
 *    code that predates this table, between the migration's seed and the
 *    deploy.
 * 2. If the goals just saved differ from what history now ends with, they
 *    are recorded at this save's `updated_at`.
 *
 * Values come from the rows as stored (integer and numeric rounding applied),
 * and history's columns are typed the same, so an unchanged goal compares
 * equal. One limit: `updated_at` is bumped on every save, so if a retry also
 * fails, the next one dates the change to that failed retry rather than to
 * the original save.
 *
 * A failure throws after the goal is saved: the tool reports an error, and
 * calling it again with the same values heals the history. The raw cause is
 * logged under a ref with no user id; the thrown ToolError says what happened
 * without it.
 */
async function recordGoalsHistory(
    userId: string,
    prior: NutritionGoals | null,
    saved: NutritionGoals,
): Promise<void> {
    const goals = pickGoals(saved as unknown as Record<string, unknown>);
    try {
        const { data: latestData, error: readErr } = await getSupabase()
            .from("nutrition_goals_history")
            .select(["effective_at", ...GOAL_COLUMNS].join(","))
            .eq("user_id", userId)
            .order("effective_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (readErr) throw new Error(readErr.message);
        const latest = latestData as unknown as Record<string, unknown> | null;
        let tail = latest ? pickGoals(latest) : null;

        if (prior) {
            const priorGoals = pickGoals(
                prior as unknown as Record<string, unknown>,
            );
            const priorAt = Date.parse(prior.updated_at);
            const latestAt = latest
                ? Date.parse(String(latest.effective_at))
                : Number.NEGATIVE_INFINITY;
            if (
                !(tail && sameGoals(tail, priorGoals)) &&
                Number.isFinite(priorAt) &&
                priorAt > latestAt
            ) {
                const { error: missedErr } = await getSupabase()
                    .from("nutrition_goals_history")
                    .insert({
                        user_id: userId,
                        effective_at: prior.updated_at,
                        ...priorGoals,
                    });
                if (missedErr) throw new Error(missedErr.message);
                tail = priorGoals;
            }
        }

        if (tail && sameGoals(tail, goals)) return;

        const { error: insertErr } = await getSupabase()
            .from("nutrition_goals_history")
            .insert({
                user_id: userId,
                effective_at: saved.updated_at,
                ...goals,
            });
        if (insertErr) throw new Error(insertErr.message);
    } catch (err) {
        const ref = newErrorRef();
        console.warn(
            `[goals-history] record failed ref=${ref}: ${JSON.stringify((err instanceof Error ? err.message : String(err)).slice(0, 500))}`,
        );
        throw new ToolError(
            `Failed to record this change in the goals history (ref ${ref}). The new goals themselves were saved. Calling set_nutrition_goals again with the same values records the change, dated to when it was saved; it does not save anything twice.`,
        );
    }
}

/**
 * Every change to the user's goals, oldest first, as `goalsOnDate`
 * (src/goals-history.ts) expects: the stored history plus, through
 * `withCurrentGoals`, a change the current `nutrition_goals` row holds that
 * history does not yet (one saved by pre-history code after the migration
 * ran, which the next save backfills at the same instant). Both reads run in
 * parallel. This is the read path only (get_trends group_by, the export):
 * `recordGoalsHistory` compares against the stored history on its own query
 * and must keep doing so, or it would treat the merged entry as recorded.
 */
export async function getNutritionGoalsHistory(
    userId: string,
): Promise<NutritionGoalsHistoryRow[]> {
    const [stored, current] = await Promise.all([
        getStoredGoalsHistory(userId),
        getNutritionGoals(userId),
    ]);
    return withCurrentGoals(stored, current);
}

/**
 * The stored `nutrition_goals_history` rows, oldest first (`effective_at`,
 * then `id`). Paged past PostgREST's row cap and reconciled against the first
 * page's exact count like the window readers, throwing `result would be
 * truncated` (category `read_truncated`) when short; repeats from an insert
 * landing between pages are dropped by id first. A user changes goals rarely,
 * so this is almost always one page.
 */
async function getStoredGoalsHistory(
    userId: string,
): Promise<NutritionGoalsHistoryRow[]> {
    let expected: number | null = null;
    const fetched = await fetchAllPages<Record<string, unknown>>(
        async (from, to) => {
            const { data, error, count } = await getSupabase()
                .from("nutrition_goals_history")
                .select(
                    ["id", "effective_at", ...GOAL_COLUMNS].join(","),
                    from === 0 ? { count: "exact" } : undefined,
                )
                .eq("user_id", userId)
                .order("effective_at", { ascending: true })
                .order("id", { ascending: true })
                .range(from, to);
            if (error)
                throw new Error(
                    `Failed to get goals history: ${error.message}`,
                );
            if (from === 0) expected = count ?? null;
            return (data as unknown as Record<string, unknown>[]) ?? [];
        },
    );
    const seen = new Set<unknown>();
    const rows = fetched.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
    });
    assertWindowComplete("goals history", rows.length, expected);
    return rows.map((r) => ({
        effective_at: new Date(String(r.effective_at)).toISOString(),
        ...pickGoals(r),
    }));
}

export async function getNutritionGoals(
    userId: string,
): Promise<NutritionGoals | null> {
    const { data, error } = await getSupabase()
        .from("nutrition_goals")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw new Error(`Failed to get goals: ${error.message}`);
    return (data as NutritionGoals | null) ?? null;
}
