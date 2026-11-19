import { hashSecret } from "../token-hash.js";
import { getSupabase, selectAllForUser } from "./client.js";

// ---------- Web dashboard sessions ----------
//
// dashboard_sessions (20261109120000_dashboard_sessions.sql). The raw `nmds_`
// cookie value crosses into these functions and only hashSecret(raw) is ever
// written or matched, like the OAuth token functions above; the store adapter
// is src/dashboard-session-store.ts.

export interface DashboardSessionRow {
    id: string;
    user_id: string;
    created_at: string;
    last_seen_at: string;
    // Idle expiry, slid on use, never past absolute_expires_at.
    expires_at: string;
    absolute_expires_at: string;
}

export type DashboardSessionLookup =
    | { status: "valid"; session: DashboardSessionRow }
    | { status: "invalid" }
    | { status: "unavailable" };

const DASHBOARD_SESSION_COLUMNS =
    "id, user_id, created_at, last_seen_at, expires_at, absolute_expires_at";

export async function insertDashboardSession(rec: {
    token: string;
    userId: string;
    createdAt: string;
    expiresAt: string;
    absoluteExpiresAt: string;
}): Promise<void> {
    const { error } = await getSupabase()
        .from("dashboard_sessions")
        .insert({
            token_hash: hashSecret(rec.token),
            user_id: rec.userId,
            created_at: rec.createdAt,
            last_seen_at: rec.createdAt,
            expires_at: rec.expiresAt,
            absolute_expires_at: rec.absoluteExpiresAt,
        });
    if (error)
        throw new Error(`Failed to store dashboard session: ${error.message}`);
}

// Three-state like getUserIdByToken: a failure to find out is "unavailable",
// never "invalid", so an outage does not read as a sign-out.
export async function lookupDashboardSession(
    token: string,
    nowIso: string,
): Promise<DashboardSessionLookup> {
    try {
        const { data, error } = await getSupabase()
            .from("dashboard_sessions")
            .select(DASHBOARD_SESSION_COLUMNS)
            .eq("token_hash", hashSecret(token))
            .gt("expires_at", nowIso)
            .gt("absolute_expires_at", nowIso)
            .maybeSingle();
        if (error) return { status: "unavailable" };
        if (!data) return { status: "invalid" };
        return { status: "valid", session: data as DashboardSessionRow };
    } catch {
        return { status: "unavailable" };
    }
}

// Slides the idle expiry. The caller throttles to once an hour.
export async function touchDashboardSession(
    id: string,
    lastSeenAt: string,
    expiresAt: string,
): Promise<void> {
    const { error } = await getSupabase()
        .from("dashboard_sessions")
        .update({ last_seen_at: lastSeenAt, expires_at: expiresAt })
        .eq("id", id);
    if (error)
        throw new Error(`Failed to touch dashboard session: ${error.message}`);
}

export async function deleteDashboardSession(token: string): Promise<void> {
    const { error } = await getSupabase()
        .from("dashboard_sessions")
        .delete()
        .eq("token_hash", hashSecret(token));
    if (error)
        throw new Error(`Failed to delete dashboard session: ${error.message}`);
}

// Rows past their idle expiry. expires_at never exceeds absolute_expires_at
// (a check constraint), so this also covers the absolute limit.
export async function deleteExpiredDashboardSessions(
    nowIso: string,
): Promise<number> {
    const { count, error } = await getSupabase()
        .from("dashboard_sessions")
        .delete({ count: "exact" })
        .lt("expires_at", nowIso);
    if (error)
        throw new Error(
            `Failed to delete expired dashboard_sessions: ${error.message}`,
        );
    return count ?? 0;
}

// For the export's connections.csv: every row the user has, oldest first.
// Never the hash. Rows past expiry but not yet swept are still stored, so
// they are listed too. Rides selectAllForUser like the other export readers:
// paged past PostgREST's row cap, ordered created_at then id (a total order),
// deduped by id and reconciled against the first page's exact count, so a
// short read throws ("export would be truncated") rather than quietly
// dropping sessions from the archive. The id is selected only for that and
// is not returned.
export async function getDashboardSessionsForExport(
    userId: string,
): Promise<
    { created_at: string; last_seen_at: string | null; expires_at: string }[]
> {
    const rows = await selectAllForUser<{
        id: string;
        created_at: string;
        last_seen_at: string | null;
        expires_at: string;
    }>(
        "dashboard_sessions",
        "id, created_at, last_seen_at, expires_at",
        "dashboard sessions",
        userId,
        ["created_at", "id"],
        "id",
    );
    return rows.map(({ created_at, last_seen_at, expires_at }) => ({
        created_at,
        last_seen_at,
        expires_at,
    }));
}
