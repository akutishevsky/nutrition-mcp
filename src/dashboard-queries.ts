// Reads the web dashboard needs that src/supabase.ts has no reader for. Same
// client (getSupabase) and the same conventions as the readers there: every
// query is scoped by user_id and throws "Failed to get <noun>: …" on error, so
// categorizeError files a failure as supabase_error and the dashboard API
// answers it as `unavailable`.
import { getSupabase } from "./supabase.js";

/** The tables whose newest row says when the user last logged anything. */
const LOGGED_TABLES = [
    ["meals", "meals"],
    ["water_log", "water"],
    ["weight_log", "weight"],
] as const;

/**
 * The newest `logged_at` across meals, water and weight, or null when the user
 * has logged none of them. One indexed row per table
 * (`(user_id, logged_at)`), read in parallel; no window, so no paging or
 * count reconciliation is involved — each read is a single `limit(1)` row.
 */
export async function getLastLoggedAt(userId: string): Promise<string | null> {
    const latest = await Promise.all(
        LOGGED_TABLES.map(async ([table, noun]) => {
            const { data, error } = await getSupabase()
                .from(table)
                .select("logged_at")
                .eq("user_id", userId)
                .order("logged_at", { ascending: false })
                .limit(1);
            if (error)
                throw new Error(`Failed to get ${noun}: ${error.message}`);
            const row = (data as { logged_at: string }[] | null)?.[0];
            return row ? new Date(row.logged_at).toISOString() : null;
        }),
    );
    let newest: string | null = null;
    for (const at of latest) {
        if (at !== null && (newest === null || at > newest)) newest = at;
    }
    return newest;
}
