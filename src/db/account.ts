import { getSupabase, selectAllForUser } from "./client.js";

/** One tool_analytics row, as the export reads it back. */
export interface ToolAnalyticsRow {
    id: string;
    tool_name: string;
    success: boolean;
    duration_ms: number;
    error_category: string | null;
    date_range_days: number | null;
    mcp_session_id: string | null;
    protocol_era: string | null;
    client_name: string | null;
    invoked_at: string;
    created_at: string | null;
}

/**
 * Every tool-usage telemetry row recorded for the user, oldest first. A heavy
 * user has thousands, so this pages and reconciles like getAllMeals.
 * `tool_analytics.user_id` is varchar with no FK (it also holds the
 * "[deleted]" sentinel); the uuid string compares equal to it as text.
 */
export async function getAllToolAnalytics(
    userId: string,
): Promise<ToolAnalyticsRow[]> {
    return selectAllForUser<ToolAnalyticsRow>(
        "tool_analytics",
        "id, tool_name, success, duration_ms, error_category, date_range_days, mcp_session_id, protocol_era, client_name, invoked_at, created_at",
        "telemetry",
        userId,
        ["invoked_at", "id"],
        "id",
    );
}

/**
 * One OAuth grant held for the user: a live-or-not-yet-swept access token,
 * refresh token or pending authorization code. Deliberately carries no
 * `token` / `code` / `code_challenge`: those columns hold hashes of secrets
 * (or a PKCE challenge), and nothing a user does with an export needs them.
 */
export interface OAuthGrantRow {
    kind: "access_token" | "refresh_token" | "authorization_code";
    client_id: string | null;
    client_name: string | null;
    redirect_uri: string | null;
    created_at: string;
    expires_at: string;
}

/**
 * Every OAuth access token, refresh token and authorization code stored for
 * the user, each table read in full and reconciled, plus the registered
 * client_name for every client they name. Access tokens have no client_id
 * column, so theirs is always null. Rows past expiry that the hourly sweep
 * has not removed yet are included: they are still stored.
 *
 * Ordered by created_at then the secret's hash column. The hash is used only
 * as a unique tie-break in ORDER BY and is never selected.
 */
export async function getAllOAuthGrants(
    userId: string,
): Promise<OAuthGrantRow[]> {
    const [access, refresh, codes] = await Promise.all([
        selectAllForUser<{ created_at: string; expires_at: string }>(
            "oauth_tokens",
            "created_at, expires_at",
            "access tokens",
            userId,
            ["created_at", "token"],
        ),
        selectAllForUser<{
            client_id: string | null;
            created_at: string;
            expires_at: string;
        }>(
            "refresh_tokens",
            "client_id, created_at, expires_at",
            "refresh tokens",
            userId,
            ["created_at", "token"],
        ),
        selectAllForUser<{
            client_id: string | null;
            redirect_uri: string;
            created_at: string;
            expires_at: string;
        }>(
            "auth_codes",
            "client_id, redirect_uri, created_at, expires_at",
            "authorization codes",
            userId,
            ["created_at", "code"],
        ),
    ]);

    const clientIds = [
        ...new Set(
            [...refresh, ...codes]
                .map((r) => r.client_id)
                .filter((id): id is string => !!id),
        ),
    ];
    const names = new Map<string, string | null>();
    if (clientIds.length > 0) {
        const { data, error } = await getSupabase()
            .from("oauth_clients")
            .select("client_id, client_name")
            .in("client_id", clientIds);
        if (error)
            throw new Error(`Failed to get OAuth clients: ${error.message}`);
        for (const r of data ?? [])
            names.set(r.client_id as string, (r.client_name as string) ?? null);
    }
    const nameOf = (id: string | null) => (id ? (names.get(id) ?? null) : null);

    return [
        ...access.map((r): OAuthGrantRow => ({
            kind: "access_token",
            client_id: null,
            client_name: null,
            redirect_uri: null,
            created_at: r.created_at,
            expires_at: r.expires_at,
        })),
        ...refresh.map((r): OAuthGrantRow => ({
            kind: "refresh_token",
            client_id: r.client_id,
            client_name: nameOf(r.client_id),
            redirect_uri: null,
            created_at: r.created_at,
            expires_at: r.expires_at,
        })),
        ...codes.map((r): OAuthGrantRow => ({
            kind: "authorization_code",
            client_id: r.client_id,
            client_name: nameOf(r.client_id),
            redirect_uri: r.redirect_uri,
            created_at: r.created_at,
            expires_at: r.expires_at,
        })),
    ];
}

// ---------- Delete all user data ----------

/**
 * Storage key the whole-account export archive is written to — one per user,
 * so each export overwrites the last. Lives here rather than in src/export.ts
 * because deletion needs it too and src/export.ts already imports from this
 * module; the other direction would be a cycle.
 */
export function exportArchivePath(userId: string): string {
    return `${userId}/nutrition-mcp-export.zip`;
}

/**
 * EVERY key an export may have left in the bucket for this user, current and
 * historical. `deleteAllUserData` removes all of them, and that is the whole
 * reason this list exists rather than a single inlined path: the archive holds
 * the user's complete meal, water, weight, body-measurement, goals and profile history, so a key
 * missed here survives the account that asked to be erased — and keeps
 * resolving through the signed URL the user was already handed, for the rest
 * of its hour. Renaming the archive without adding its old name to this list
 * is exactly that bug, and `remove` reports a missing path as success, so
 * nothing would surface it. Add, do not replace.
 */
export function exportStoragePaths(userId: string): string[] {
    return [
        exportArchivePath(userId),
        // Written by the meals-only export that the archive replaced. Nothing
        // creates it any more; it stays here to clean up files left behind by
        // exports taken before that change.
        `${userId}/meals.csv`,
    ];
}

export async function deleteAllUserData(userId: string): Promise<void> {
    const sb = getSupabase();

    // Web dashboard sessions first: a browser still signed in must stop
    // reading data while the rest is being deleted.
    const { error: dashErr } = await sb
        .from("dashboard_sessions")
        .delete()
        .eq("user_id", userId);
    if (dashErr)
        throw new Error(
            `Failed to delete dashboard sessions: ${dashErr.message}`,
        );

    // Apple Health sync first: removing the link stops the Shortcut syncing
    // (and writing another sent-values row) while the rest is being deleted.
    // Pending connects are only attributable once claimed; unclaimed ones
    // carry no user and lapse within 30 minutes.
    const { error: haLinkErr } = await sb
        .from("health_activity_links")
        .delete()
        .eq("user_id", userId);
    if (haLinkErr)
        throw new Error(
            `Failed to delete Apple Health activity sync link: ${haLinkErr.message}`,
        );

    const { error: hsLinkErr } = await sb
        .from("health_sync_links")
        .delete()
        .eq("user_id", userId);
    if (hsLinkErr)
        throw new Error(
            `Failed to delete Apple Health sync link: ${hsLinkErr.message}`,
        );

    const { error: hsDaysErr } = await sb
        .from("health_sync_days")
        .delete()
        .eq("user_id", userId);
    if (hsDaysErr)
        throw new Error(
            `Failed to delete Apple Health sync record: ${hsDaysErr.message}`,
        );

    const { error: hsPendingErr } = await sb
        .from("health_sync_pending")
        .delete()
        .eq("user_id", userId);
    if (hsPendingErr)
        throw new Error(
            `Failed to delete pending Apple Health sync: ${hsPendingErr.message}`,
        );

    const { error: analyticsErr } = await sb
        .from("tool_analytics")
        .delete()
        .eq("user_id", userId);
    if (analyticsErr)
        throw new Error(`Failed to delete analytics: ${analyticsErr.message}`);

    const { error: waterErr } = await sb
        .from("water_log")
        .delete()
        .eq("user_id", userId);
    if (waterErr)
        throw new Error(`Failed to delete water log: ${waterErr.message}`);

    const { error: activeErr } = await sb
        .from("active_calories_log")
        .delete()
        .eq("user_id", userId);
    if (activeErr)
        throw new Error(
            `Failed to delete active calories: ${activeErr.message}`,
        );

    const { error: weightErr } = await sb
        .from("weight_log")
        .delete()
        .eq("user_id", userId);
    if (weightErr)
        throw new Error(`Failed to delete weight log: ${weightErr.message}`);

    const { error: measurementsErr } = await sb
        .from("body_measurement_log")
        .delete()
        .eq("user_id", userId);
    if (measurementsErr)
        throw new Error(
            `Failed to delete body measurements: ${measurementsErr.message}`,
        );

    // Goals history, just before the current goals row it records changes to.
    const { error: goalsHistoryErr } = await sb
        .from("nutrition_goals_history")
        .delete()
        .eq("user_id", userId);
    if (goalsHistoryErr)
        throw new Error(
            `Failed to delete goals history: ${goalsHistoryErr.message}`,
        );

    const { error: goalsErr } = await sb
        .from("nutrition_goals")
        .delete()
        .eq("user_id", userId);
    if (goalsErr)
        throw new Error(`Failed to delete goals: ${goalsErr.message}`);

    const { error: profileErr } = await sb
        .from("profiles")
        .delete()
        .eq("user_id", userId);
    if (profileErr)
        throw new Error(`Failed to delete profile: ${profileErr.message}`);

    // Remove any export file from the "exports" storage bucket. Missing paths
    // are not an error, so this is a no-op for users who never exported.
    const { error: exportErr } = await sb.storage
        .from("exports")
        .remove(exportStoragePaths(userId));
    if (exportErr)
        throw new Error(`Failed to delete exports: ${exportErr.message}`);

    // Ingredients and saved meals go before the logged meals. A logged meal's
    // saved_meal_id is set null by the database, so no other order is wrong,
    // but naming each table keeps every table's rows in the deletion record.
    const { error: mealItemsErr } = await sb
        .from("meal_items")
        .delete()
        .eq("user_id", userId);
    if (mealItemsErr)
        throw new Error(`Failed to delete meal items: ${mealItemsErr.message}`);

    const { error: savedItemsErr } = await sb
        .from("saved_meal_items")
        .delete()
        .eq("user_id", userId);
    if (savedItemsErr)
        throw new Error(
            `Failed to delete saved meal items: ${savedItemsErr.message}`,
        );

    const { error: savedMealsErr } = await sb
        .from("saved_meals")
        .delete()
        .eq("user_id", userId);
    if (savedMealsErr)
        throw new Error(
            `Failed to delete saved meals: ${savedMealsErr.message}`,
        );

    const { error: mealsErr } = await sb
        .from("meals")
        .delete()
        .eq("user_id", userId);
    if (mealsErr)
        throw new Error(`Failed to delete meals: ${mealsErr.message}`);

    const { error: tokensErr } = await sb
        .from("oauth_tokens")
        .delete()
        .eq("user_id", userId);
    if (tokensErr)
        throw new Error(`Failed to delete tokens: ${tokensErr.message}`);

    const { error: refreshErr } = await sb
        .from("refresh_tokens")
        .delete()
        .eq("user_id", userId);
    if (refreshErr)
        throw new Error(
            `Failed to delete refresh tokens: ${refreshErr.message}`,
        );

    const { error: authErr } = await sb
        .from("auth_codes")
        .delete()
        .eq("user_id", userId);
    if (authErr)
        throw new Error(`Failed to delete auth codes: ${authErr.message}`);

    const { error: userErr } = await sb.auth.admin.deleteUser(userId);
    if (userErr) throw new Error(`Failed to delete user: ${userErr.message}`);
}

// ---------- Public landing stats ----------

export interface LandingStats {
    food_logs: number;
    total_calories: number;
    total_protein_g: number;
    total_carbs_g: number;
    total_fat_g: number;
    // Every distinct timezone in use, counted once. A single site-wide number
    // that names no timezone, so it is not held to TZ_MIN_PROFILES; it can be
    // larger than timezone_list is long.
    timezones: number;
    // IANA names of the timezones at least TZ_MIN_PROFILES profiles use —
    // drives the landing-page world map. Aggregate-only; no per-user data.
    //
    // Expect this near-empty for a while after 2026-08-15: the
    // nullable_profile_timezone migration (#99) reset every profile's
    // timezone to NULL, and public_landing_stats() filters both this and
    // timezone_counts to `where timezone is not null`, so a nulled profile
    // drops out of the map entirely until its user calls set_timezone again.
    // The threshold empties it further. Not a map bug — see buildMap() in the
    // landing script (scripts/gen-index.ts) for the visible symptom.
    timezone_list: string[];
    // IANA name -> 1..5, that timezone's share of the profiles in published
    // timezones. Sizes each dot on the world map. Levels, never counts: see
    // timezoneLevels().
    timezone_levels: Record<string, number>;
}

// What the SQL function actually returns. `timezone_counts` is exact and stays
// inside the process — it is bucketed before anything is served.
export interface RawLandingStats extends Omit<LandingStats, "timezone_levels"> {
    timezone_counts?: Record<string, number>;
}

// Fewest profiles a timezone needs before /api/stats names it (brief 13). The
// privacy policy promises it: a timezone held by one or two profiles is a fact
// about one or two people. public_landing_stats() applies the same threshold
// (20260929130000_landing_stats_k_anonymity.sql); publicLandingStats() applies
// it again so a DB still on the older function can't leak through.
export const TZ_MIN_PROFILES = 3;

// Share of the profiles in published (>= TZ_MIN_PROFILES) timezones at which a
// timezone moves up a level. Geometric, not evenly spaced, because the real
// distribution is long-tailed: at 273 profiles, before the threshold existed,
// the largest timezone held 14% while 27 timezones held one profile each. Even
// cuts would drop most dots into level 1 and the map would show no gradient at
// all. Doubling at each step keeps every bucket populated.
export const TZ_LEVEL_THRESHOLDS = [0.01, 0.02, 0.04, 0.08] as const;

// Buckets exact per-timezone counts into 1..5 by share of the total.
//
// Half of the privacy boundary for the world map (TZ_MIN_PROFILES is the
// other). /api/stats is public and unauthenticated, so exact counts are never
// served: a level only narrows a timezone to a range. Pure over whatever it is
// given — publicLandingStats() decides which timezones reach it.
export function timezoneLevels(
    counts: Record<string, number>,
): Record<string, number> {
    const entries = Object.entries(counts).filter(
        ([, n]) => typeof n === "number" && n > 0,
    );
    const total = entries.reduce((sum, [, n]) => sum + n, 0);
    const levels: Record<string, number> = {};
    if (total <= 0) return levels;
    for (const [tz, n] of entries) {
        const share = n / total;
        let level = 1;
        for (const threshold of TZ_LEVEL_THRESHOLDS) {
            if (share >= threshold) level++;
        }
        levels[tz] = level;
    }
    return levels;
}

// Turns the SQL function's output into what /api/stats serves: drops the exact
// counts and every timezone with fewer than TZ_MIN_PROFILES profiles, from both
// the list and the levels.
//
// Levels are shares of the *published* timezones' profiles, not of all
// profiles. The newer SQL function no longer returns the suppressed counts, so
// this is the only total both it and the older function can produce — the map
// looks the same whichever side filtered.
//
// No counts at all (an empty object, or the key missing from a function older
// than 20260808120000_landing_stats_timezone_counts.sql, long since applied) serves an
// empty list: without counts nothing proves a timezone clears the threshold,
// and an unfiltered list is exactly the leak this exists to stop. The map then
// renders its land grid with no dots.
export function publicLandingStats(raw: RawLandingStats): LandingStats {
    const { timezone_counts, timezone_list, ...rest } = raw;
    const shared: Record<string, number> = {};
    for (const [tz, n] of Object.entries(timezone_counts ?? {})) {
        if (typeof n === "number" && n >= TZ_MIN_PROFILES) shared[tz] = n;
    }
    return {
        ...rest,
        timezone_list: (timezone_list ?? []).filter((tz) =>
            Object.hasOwn(shared, tz),
        ),
        timezone_levels: timezoneLevels(shared),
    };
}

// Aggregate-only totals for the public landing page. Backed by the
// `public_landing_stats` SQL function so the whole thing is one round trip and
// the database does the summing. Never returns per-user rows.
export async function getLandingStats(): Promise<LandingStats> {
    const { data, error } = await getSupabase().rpc("public_landing_stats");
    if (error) throw new Error(`Failed to get landing stats: ${error.message}`);
    return publicLandingStats(data as RawLandingStats);
}
