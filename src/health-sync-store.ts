// Persistence for Apple Health sync: the pending connect rows, the one link
// per user the Shortcut syncs with, and the 8-day record of what was sent
// (supabase/migrations/20261003120000_health_sync.sql). The routes take a
// HealthSyncStore so their tests run against an in-memory fake; this file's
// Supabase implementation is tested against a stubbed global fetch in
// src/health-sync-store.test.ts.
//
// Every secret crosses this interface RAW and is hashed here, on write and on
// lookup alike — connect id, device secret, claim code and link token. Nothing
// above this layer ever sees or builds a hash, so a caller can't store a raw
// value by mistake, and a stored hash presented as the secret matches nothing.
// The PKCE verifier is the one value stored as-is (see the migration header).
import { getSupabase } from "./supabase.js";
import { hashSecret } from "./token-hash.js";
import { HEALTH_SYNC_LINK_MAX_DAYS } from "./health-sync.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A link is refused this long after it was created, however recently used. */
export const HEALTH_SYNC_LINK_MAX_AGE_MS = HEALTH_SYNC_LINK_MAX_DAYS * DAY_MS;

// ---------- Row shapes (DB-shaped, snake_case; no hash columns) ----------

/** health_sync_pending without its hash columns. */
export interface HealthSyncPendingRow {
    id: string;
    fields: string[];
    tz: string | null;
    backfill_days: number;
    /** Cleared once the claim code is minted. */
    pkce_verifier: string | null;
    /** Set, with claim_expires_at, once the browser finished sign-in. */
    user_id: string | null;
    claim_expires_at: string | null;
    created_at: string;
    expires_at: string;
}

/** health_sync_links without token_hash. */
export interface HealthSyncLinkRow {
    id: string;
    user_id: string;
    kind: "shortcut";
    fields: string[];
    fallback_tz: string | null;
    /** YYYY-MM-DD: days on or after it are eligible. */
    sync_start_date: string;
    lease_until: string | null;
    created_at: string;
    last_used_at: string | null;
    last_sync_at: string | null;
    expires_at: string;
}

/** One health_sync_days row. */
export interface HealthSyncDayRow {
    user_id: string;
    /** YYYY-MM-DD, local to `timezone`. */
    date: string;
    timezone: string;
    /** null until the day's initial entry is acknowledged. */
    sent_values: Record<string, number> | null;
    topup_seq: number;
    offer_count: number;
    notified: Record<string, unknown>;
    first_sent_at: string | null;
    last_sent_at: string | null;
}

/** The columns updateDay may write. */
export type HealthSyncDayPatch = Partial<
    Pick<
        HealthSyncDayRow,
        | "timezone"
        | "sent_values"
        | "topup_seq"
        | "offer_count"
        | "notified"
        | "first_sent_at"
        | "last_sent_at"
    >
>;

/** The state updateDay requires the row to still be in. */
export interface HealthSyncDayExpect {
    topup_seq: number;
    /** Whether `sent_values` was null when the caller read the row. */
    sentNull: boolean;
}

export interface NewPendingConnection {
    connectId: string;
    deviceSecret: string;
    pkceVerifier: string;
    fields: string[];
    tz: string | null;
    backfillDays: number;
    expiresAt: string;
}

export interface NewLink {
    fields: string[];
    fallbackTz: string | null;
    syncStartDate: string;
    expiresAt: string;
}

export type HealthSyncLinkLookup =
    | { status: "valid"; link: HealthSyncLinkRow }
    | { status: "invalid" }
    | { status: "unavailable" };

/** What get_profile and the export show about a link. Never a token hash. */
export interface HealthSyncLinkStatus {
    kind: "shortcut";
    fields: string[];
    fallback_tz: string | null;
    sync_start_date: string;
    created_at: string;
    last_used_at: string | null;
    last_sync_at: string | null;
    expires_at: string;
    /** Latest date whose initial entry was acknowledged, or null. */
    sent_through: string | null;
}

export interface HealthSyncStore {
    createPending(input: NewPendingConnection): Promise<void>;
    /** An unexpired pending row, claimed or not; null when none. */
    getPendingByConnectId(
        connectId: string,
        now?: Date,
    ): Promise<HealthSyncPendingRow | null>;
    /**
     * Attach the signed-in user and a claim code to an unexpired, still
     * unclaimed pending row, clearing its PKCE verifier. False when no such
     * row (expired, unknown, or another callback claimed it first).
     */
    setPendingClaim(
        connectId: string,
        claimCode: string,
        userId: string,
        claimExpiresAt: string,
        now?: Date,
    ): Promise<boolean>;
    /**
     * Atomically delete and return the pending row matching BOTH the claim
     * code and the device secret, if its claim is unexpired. Single-use.
     */
    consumeClaim(
        claimCode: string,
        deviceSecret: string,
        now?: Date,
    ): Promise<HealthSyncPendingRow | null>;
    /** The user's link, replaced wholesale (one statement, keyed on user_id). */
    replaceLink(userId: string, link: NewLink, token: string): Promise<void>;
    lookupLink(token: string, now?: Date): Promise<HealthSyncLinkLookup>;
    /** Stamp last_used_at and the slid expiry. The caller throttles. */
    touchLink(
        userId: string,
        lastUsedAt: string,
        expiresAt: string,
    ): Promise<void>;
    setLastSync(userId: string, at: string): Promise<void>;
    /**
     * Take the sync lease when it is free or lapsed, in one conditional
     * update, so two concurrent syncs can't both win. True when taken.
     */
    acquireLease(userId: string, until: string, now?: Date): Promise<boolean>;
    /** Free the lease; with `heldUntil`, only if it is still that lease. */
    releaseLease(userId: string, heldUntil?: string): Promise<void>;
    /** Day rows with from <= date <= to (YYYY-MM-DD), by date. */
    getDays(
        userId: string,
        from: string,
        to: string,
    ): Promise<HealthSyncDayRow[]>;
    /**
     * Insert day rows that do not exist yet; a (user, date) that already has
     * a row is left exactly as it is. Returns the dates actually inserted.
     */
    insertDays(rows: HealthSyncDayRow[]): Promise<string[]>;
    /**
     * Write `patch` to one day row only if it is still in the state the
     * caller read: the same `topup_seq`, and `sent_values` still null or
     * still set. False when the row moved on (or is gone) in between — an
     * ack and a /pending of two runs never overwrite each other's work,
     * since neither writes a whole row it read earlier.
     */
    updateDay(
        userId: string,
        date: string,
        patch: HealthSyncDayPatch,
        expect: HealthSyncDayExpect,
    ): Promise<boolean>;
    /** Remove the user's link and every sent-values row. */
    deleteLink(userId: string): Promise<void>;
    /** The user's link while it still works — past its sliding expiry or its
     *  365-day cap it is reported as none, exactly as lookupLink refuses it,
     *  even before the hourly sweep deletes it. */
    getLinkStatus(
        userId: string,
        now?: Date,
    ): Promise<HealthSyncLinkStatus | null>;
    getDaysForExport(userId: string): Promise<HealthSyncDayRow[]>;
}

const PENDING_COLUMNS =
    "id, fields, tz, backfill_days, pkce_verifier, user_id, claim_expires_at, created_at, expires_at";
const LINK_COLUMNS =
    "id, user_id, kind, fields, fallback_tz, sync_start_date, lease_until, created_at, last_used_at, last_sync_at, expires_at";
const DAY_COLUMNS =
    "user_id, date, timezone, sent_values, topup_seq, offer_count, notified, first_sent_at, last_sent_at";

// More than the retention ever holds (8 days plus the one in progress), so a
// short read is a real truncation rather than a cap.
const MAX_DAY_ROWS = 64;

function iso(now: Date | undefined): string {
    return (now ?? new Date()).toISOString();
}

export function createSupabaseHealthSyncStore(): HealthSyncStore {
    return {
        async createPending(input) {
            const { error } = await getSupabase()
                .from("health_sync_pending")
                .insert({
                    connect_id_hash: hashSecret(input.connectId),
                    device_secret_hash: hashSecret(input.deviceSecret),
                    pkce_verifier: input.pkceVerifier,
                    fields: input.fields,
                    tz: input.tz,
                    backfill_days: input.backfillDays,
                    expires_at: input.expiresAt,
                });
            if (error)
                throw new Error(
                    `Failed to store pending health sync: ${error.message}`,
                );
        },

        async getPendingByConnectId(connectId, now) {
            const { data, error } = await getSupabase()
                .from("health_sync_pending")
                .select(PENDING_COLUMNS)
                .eq("connect_id_hash", hashSecret(connectId))
                .gt("expires_at", iso(now))
                .maybeSingle();
            if (error)
                throw new Error(
                    `Failed to read pending health sync: ${error.message}`,
                );
            return (data as HealthSyncPendingRow | null) ?? null;
        },

        async setPendingClaim(
            connectId,
            claimCode,
            userId,
            claimExpiresAt,
            now,
        ) {
            const { data, error } = await getSupabase()
                .from("health_sync_pending")
                .update({
                    claim_code_hash: hashSecret(claimCode),
                    user_id: userId,
                    claim_expires_at: claimExpiresAt,
                    pkce_verifier: null,
                })
                .eq("connect_id_hash", hashSecret(connectId))
                .is("claim_code_hash", null)
                .gt("expires_at", iso(now))
                .select("id");
            if (error)
                throw new Error(
                    `Failed to claim pending health sync: ${error.message}`,
                );
            return (data ?? []).length > 0;
        },

        async consumeClaim(claimCode, deviceSecret, now) {
            // delete … returning: of two concurrent redemptions, one gets
            // the row and the other nothing.
            const { data, error } = await getSupabase()
                .from("health_sync_pending")
                .delete()
                .eq("claim_code_hash", hashSecret(claimCode))
                .eq("device_secret_hash", hashSecret(deviceSecret))
                .gt("claim_expires_at", iso(now))
                .select(PENDING_COLUMNS);
            if (error)
                throw new Error(
                    `Failed to redeem health sync claim: ${error.message}`,
                );
            const rows = (data ?? []) as HealthSyncPendingRow[];
            return rows[0] ?? null;
        },

        async replaceLink(userId, link, token) {
            // One upsert on the unique user_id instead of delete + insert:
            // the old token stops working in the same statement the new one
            // starts, and a failure leaves the old link intact rather than
            // none at all. Every column is written, so nothing (a lease, the
            // last sync) carries over from the link it replaces. The sent
            // record in health_sync_days is kept: it is what stops a
            // reconnected phone re-sending days Apple Health already has.
            const nowIso = new Date().toISOString();
            const { error } = await getSupabase()
                .from("health_sync_links")
                .upsert(
                    {
                        user_id: userId,
                        token_hash: hashSecret(token),
                        kind: "shortcut",
                        fields: link.fields,
                        fallback_tz: link.fallbackTz,
                        sync_start_date: link.syncStartDate,
                        lease_until: null,
                        created_at: nowIso,
                        last_used_at: null,
                        last_sync_at: null,
                        expires_at: link.expiresAt,
                    },
                    { onConflict: "user_id" },
                );
            if (error)
                throw new Error(
                    `Failed to store health sync link: ${error.message}`,
                );
        },

        async lookupLink(token, now) {
            const at = now ?? new Date();
            try {
                const { data, error } = await getSupabase()
                    .from("health_sync_links")
                    .select(LINK_COLUMNS)
                    .eq("token_hash", hashSecret(token))
                    .gt("expires_at", at.toISOString())
                    .gt(
                        "created_at",
                        new Date(
                            at.getTime() - HEALTH_SYNC_LINK_MAX_AGE_MS,
                        ).toISOString(),
                    )
                    .maybeSingle();
                // maybeSingle reports no row as data: null, so any error is a
                // real failure to find out — never a reason to refuse.
                if (error) return { status: "unavailable" };
                if (!data) return { status: "invalid" };
                return { status: "valid", link: data as HealthSyncLinkRow };
            } catch {
                return { status: "unavailable" };
            }
        },

        async touchLink(userId, lastUsedAt, expiresAt) {
            const { error } = await getSupabase()
                .from("health_sync_links")
                .update({ last_used_at: lastUsedAt, expires_at: expiresAt })
                .eq("user_id", userId);
            if (error)
                throw new Error(
                    `Failed to touch health sync link: ${error.message}`,
                );
        },

        async setLastSync(userId, at) {
            const { error } = await getSupabase()
                .from("health_sync_links")
                .update({ last_sync_at: at })
                .eq("user_id", userId);
            if (error)
                throw new Error(
                    `Failed to stamp health sync: ${error.message}`,
                );
        },

        async acquireLease(userId, until, now) {
            const nowIso = iso(now);
            const { data, error } = await getSupabase()
                .from("health_sync_links")
                .update({ lease_until: until })
                .eq("user_id", userId)
                .or(`lease_until.is.null,lease_until.lt.${nowIso}`)
                .select("id");
            if (error)
                throw new Error(
                    `Failed to take health sync lease: ${error.message}`,
                );
            return (data ?? []).length > 0;
        },

        async releaseLease(userId, heldUntil) {
            let q = getSupabase()
                .from("health_sync_links")
                .update({ lease_until: null })
                .eq("user_id", userId);
            if (heldUntil !== undefined) q = q.eq("lease_until", heldUntil);
            const { error } = await q;
            if (error)
                throw new Error(
                    `Failed to release health sync lease: ${error.message}`,
                );
        },

        async getDays(userId, from, to) {
            const { data, error } = await getSupabase()
                .from("health_sync_days")
                .select(DAY_COLUMNS)
                .eq("user_id", userId)
                .gte("date", from)
                .lte("date", to)
                .order("date", { ascending: true });
            if (error)
                throw new Error(
                    `Failed to read health sync days: ${error.message}`,
                );
            return (data ?? []) as HealthSyncDayRow[];
        },

        async insertDays(rows) {
            if (rows.length === 0) return [];
            // on conflict do nothing … returning: only rows that were new
            // come back.
            const { data, error } = await getSupabase()
                .from("health_sync_days")
                .upsert(rows, {
                    onConflict: "user_id,date",
                    ignoreDuplicates: true,
                })
                .select("date");
            if (error)
                throw new Error(
                    `Failed to store health sync days: ${error.message}`,
                );
            return ((data ?? []) as { date: string }[]).map((r) => r.date);
        },

        async updateDay(userId, date, patch, expect) {
            let q = getSupabase()
                .from("health_sync_days")
                .update(patch)
                .eq("user_id", userId)
                .eq("date", date)
                .eq("topup_seq", expect.topup_seq);
            q = expect.sentNull
                ? q.is("sent_values", null)
                : q.not("sent_values", "is", null);
            const { data, error } = await q.select("date");
            if (error)
                throw new Error(
                    `Failed to store health sync day: ${error.message}`,
                );
            return (data ?? []).length > 0;
        },

        async deleteLink(userId) {
            const sb = getSupabase();
            // The link first: once it is gone no sync can write another day.
            const { error: linkErr } = await sb
                .from("health_sync_links")
                .delete()
                .eq("user_id", userId);
            if (linkErr)
                throw new Error(
                    `Failed to delete health sync link: ${linkErr.message}`,
                );
            const { error: daysErr } = await sb
                .from("health_sync_days")
                .delete()
                .eq("user_id", userId);
            if (daysErr)
                throw new Error(
                    `Failed to delete health sync days: ${daysErr.message}`,
                );
        },

        async getLinkStatus(userId, now) {
            const at = now ?? new Date();
            const sb = getSupabase();
            const { data: link, error } = await sb
                .from("health_sync_links")
                .select(
                    "kind, fields, fallback_tz, sync_start_date, created_at, last_used_at, last_sync_at, expires_at",
                )
                .eq("user_id", userId)
                // The same two bounds as lookupLink: a link the API already
                // refuses is not "connected", sweep or no sweep.
                .gt("expires_at", at.toISOString())
                .gt(
                    "created_at",
                    new Date(
                        at.getTime() - HEALTH_SYNC_LINK_MAX_AGE_MS,
                    ).toISOString(),
                )
                .maybeSingle();
            if (error)
                throw new Error(
                    `Failed to read health sync link: ${error.message}`,
                );
            if (!link) return null;
            const { data: latest, error: daysErr } = await sb
                .from("health_sync_days")
                .select("date")
                .eq("user_id", userId)
                .not("sent_values", "is", null)
                .order("date", { ascending: false })
                .limit(1);
            if (daysErr)
                throw new Error(
                    `Failed to read health sync days: ${daysErr.message}`,
                );
            const sentThrough =
                ((latest ?? []) as { date: string }[])[0]?.date ?? null;
            return {
                ...(link as Omit<HealthSyncLinkStatus, "sent_through">),
                sent_through: sentThrough,
            };
        },

        async getDaysForExport(userId) {
            const { data, error, count } = await getSupabase()
                .from("health_sync_days")
                .select(DAY_COLUMNS, { count: "exact" })
                .eq("user_id", userId)
                .order("date", { ascending: true })
                .limit(MAX_DAY_ROWS);
            if (error)
                throw new Error(
                    `Failed to read health sync days: ${error.message}`,
                );
            const rows = (data ?? []) as HealthSyncDayRow[];
            // Same rule as every other export reader: a short read throws
            // rather than quietly producing a partial archive.
            if (count !== null && count !== undefined && rows.length < count)
                throw new Error(
                    `health sync days: result would be truncated (${rows.length} of ${count})`,
                );
            return rows;
        },
    };
}

// ---------- Retention sweeps (run hourly from src/oauth-cleanup.ts) ----------

export interface HealthSyncCleanupStore {
    /**
     * Pending rows whose connect window lapsed unclaimed, or whose claim code
     * lapsed unredeemed. A claimed row lives by claim_expires_at alone, since
     * a claim minted late in the 30 minutes may outlast expires_at.
     */
    deleteExpiredPending(nowIso: string): Promise<number>;
    /** Links past their sliding expiry or created before `createdBeforeIso`. */
    deleteExpiredLinks(
        nowIso: string,
        createdBeforeIso: string,
    ): Promise<number>;
    /** Sent-values rows dated strictly before `beforeDate` (YYYY-MM-DD). */
    deleteDaysBefore(beforeDate: string): Promise<number>;
}

export const supabaseHealthSyncCleanupStore: HealthSyncCleanupStore = {
    async deleteExpiredPending(nowIso) {
        const { count, error } = await getSupabase()
            .from("health_sync_pending")
            .delete({ count: "exact" })
            .or(
                `and(claim_expires_at.is.null,expires_at.lt.${nowIso}),claim_expires_at.lt.${nowIso}`,
            );
        if (error)
            throw new Error(
                `Failed to delete expired health_sync_pending: ${error.message}`,
            );
        return count ?? 0;
    },

    async deleteExpiredLinks(nowIso, createdBeforeIso) {
        const { count, error } = await getSupabase()
            .from("health_sync_links")
            .delete({ count: "exact" })
            .or(`expires_at.lt.${nowIso},created_at.lt.${createdBeforeIso}`);
        if (error)
            throw new Error(
                `Failed to delete expired health_sync_links: ${error.message}`,
            );
        return count ?? 0;
    },

    async deleteDaysBefore(beforeDate) {
        const { count, error } = await getSupabase()
            .from("health_sync_days")
            .delete({ count: "exact" })
            .lt("date", beforeDate);
        if (error)
            throw new Error(
                `Failed to delete old health_sync_days: ${error.message}`,
            );
        return count ?? 0;
    },
};
