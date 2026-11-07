// The storage seam the web dashboard's sign-in depends on. src/dashboard-auth.ts
// defaults to the Supabase-backed store below; src/dashboard-auth.test.ts
// passes an in-memory fake instead (never mock.module).
//
// Like OAuthStore, the raw cookie value crosses this interface and the store
// owns its at-rest form: it writes only hashSecret(raw) and a lookup or delete
// matches that hash exactly.
import {
    deleteDashboardSession,
    deleteExpiredDashboardSessions,
    insertDashboardSession,
    lookupDashboardSession,
    touchDashboardSession,
    type DashboardSessionLookup,
    type DashboardSessionRow,
} from "./supabase.js";

export type { DashboardSessionLookup, DashboardSessionRow };

export interface NewDashboardSession {
    /** The raw `nmds_…` cookie value. */
    token: string;
    userId: string;
    createdAt: string;
    expiresAt: string;
    absoluteExpiresAt: string;
}

export interface DashboardSessionStore {
    create(rec: NewDashboardSession): Promise<void>;
    /** A row whose idle and absolute expiries are both after nowIso. */
    lookup(token: string, nowIso: string): Promise<DashboardSessionLookup>;
    /** Slide the idle expiry. The caller throttles to once an hour. */
    touch(id: string, lastSeenAt: string, expiresAt: string): Promise<void>;
    /** Sign-out: remove the row this cookie names, if any. */
    delete(token: string): Promise<void>;
}

export const supabaseDashboardSessionStore: DashboardSessionStore = {
    create: insertDashboardSession,
    lookup: lookupDashboardSession,
    touch: touchDashboardSession,
    delete: deleteDashboardSession,
};

/** The hourly sweep's view of the table (src/oauth-cleanup.ts). */
export interface DashboardSessionCleanupStore {
    deleteExpired(nowIso: string): Promise<number>;
}

export const supabaseDashboardSessionCleanupStore: DashboardSessionCleanupStore =
    {
        deleteExpired: deleteExpiredDashboardSessions,
    };
