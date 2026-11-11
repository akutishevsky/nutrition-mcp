import { withUserDatabase } from "../platform/database.js";
import type { NextUpComposition, NextUpDayPart } from "../guidance/next-up.js";

/**
 * Storage for Next up (guidance rework D4 + D6): the per-day-part
 * composition cache (migration 0040) and the one-time "Set a goal"
 * prompt dismissal on the account-preferences row. All reads and
 * writes run under the user's RLS context like every other per-user
 * table. The cache stores ONLY the validated composition pick — the
 * fingerprint decides whether it may be reused, and every number in
 * the response is recomputed from live context on each read.
 */

export interface NextUpCacheRow {
    fingerprint: string;
    composition: NextUpComposition;
}

export async function readNextUpCache(
    userId: string,
    date: string,
    dayPart: NextUpDayPart,
): Promise<NextUpCacheRow | null> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<
            Array<{ fingerprint: string; composition: unknown }>
        >`
            select fingerprint, composition
            from munch.next_up_cache
            where user_id = ${userId}
              and local_date = ${date}::date
              and day_part = ${dayPart}
        `;
        const row = rows[0];
        if (!row) return null;
        const composition = row.composition as NextUpComposition | null;
        if (
            !composition ||
            typeof composition !== "object" ||
            typeof composition.candidate_id !== "string"
        ) {
            return null;
        }
        return { fingerprint: row.fingerprint, composition };
    });
}

export async function writeNextUpCache(
    userId: string,
    date: string,
    dayPart: NextUpDayPart,
    fingerprint: string,
    composition: NextUpComposition,
): Promise<void> {
    await withUserDatabase(userId, async (tx) => {
        await tx`
            insert into munch.next_up_cache (
                user_id, local_date, day_part, fingerprint, composition
            ) values (
                ${userId}, ${date}::date, ${dayPart}, ${fingerprint},
                ${JSON.stringify(composition)}::jsonb
            )
            on conflict (user_id, local_date, day_part) do update
                set fingerprint = excluded.fingerprint,
                    composition = excluded.composition,
                    created_at = now()
        `;
    });
}

/** Any cached composition for the date (chat-seed read; never composes). */
export async function readNextUpCacheForDate(
    userId: string,
    date: string,
): Promise<NextUpComposition | null> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<{ composition: unknown }>>`
            select composition
            from munch.next_up_cache
            where user_id = ${userId} and local_date = ${date}::date
            order by created_at desc
            limit 1
        `;
        const composition = rows[0]?.composition as NextUpComposition | null;
        if (
            !composition ||
            typeof composition !== "object" ||
            typeof composition.candidate_id !== "string"
        ) {
            return null;
        }
        return composition;
    });
}

export async function getGoalPromptDismissed(userId: string): Promise<boolean> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<
            Array<{ next_up_goal_prompt_dismissed: boolean | null }>
        >`
            select next_up_goal_prompt_dismissed
            from munch.account_preferences
            where user_id = ${userId}
        `;
        return rows[0]?.next_up_goal_prompt_dismissed === true;
    });
}

export async function dismissGoalPrompt(userId: string): Promise<void> {
    await withUserDatabase(userId, async (tx) => {
        await tx`
            insert into munch.account_preferences (
                user_id, next_up_goal_prompt_dismissed
            ) values (${userId}, true)
            on conflict (user_id) do update
                set next_up_goal_prompt_dismissed = true
        `;
    });
}
