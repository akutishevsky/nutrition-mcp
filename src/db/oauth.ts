import type { PatreonTokens, PatreonTokenStore } from "../patreon.js";
import { hashSecret } from "../token-hash.js";
import { getSupabase, PGRST_NO_ROWS } from "./client.js";

// ---------- OAuth tokens ----------

// Access tokens, refresh tokens and auth codes are stored as hashSecret(raw)
// in their existing `token` / `code` columns; the raw value only ever exists
// in the response that hands it to the client. Every function here takes the
// raw value and hashes it itself, so no caller can store or look one up in the
// wrong form. Lookups match hashSecret(raw) exactly: every row is in hash form
// since the backfill (20260927120000_hash_oauth_secrets.sql), so a raw value —
// or a stored hash presented as if it were the token — matches nothing.

export async function storeToken(
    token: string,
    userId: string,
    ttlSeconds: number,
): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    const { error } = await getSupabase()
        .from("oauth_tokens")
        .upsert(
            {
                token: hashSecret(token),
                user_id: userId,
                expires_at: expiresAt,
            },
            { onConflict: "token" },
        );

    if (error) throw new Error(`Failed to store token: ${error.message}`);
}

// "invalid" means the token definitively isn't valid; "unavailable" means we
// could not find out. Callers must not treat the two alike: counting an
// unavailable lookup as a failed auth attempt would let a brief Supabase outage
// — during which *every* token looks invalid — trip the repeat-failure bans in
// rate-limit.ts and keep clients shed long after the database recovered.
export type TokenLookup =
    | { status: "valid"; userId: string }
    | { status: "invalid" }
    | { status: "unavailable" };

export async function getUserIdByToken(token: string): Promise<TokenLookup> {
    try {
        const { data, error } = await getSupabase()
            .from("oauth_tokens")
            .select("user_id")
            .eq("token", hashSecret(token))
            .gt("expires_at", new Date().toISOString())
            .maybeSingle();

        // maybeSingle reports no row as data: null, so any error is a real
        // failure to find out.
        if (error) return { status: "unavailable" };
        if (!data) return { status: "invalid" };
        return { status: "valid", userId: data.user_id as string };
    } catch {
        // Network-level failure never reaches the `error` field.
        return { status: "unavailable" };
    }
}

// ---------- Patreon tokens ----------

/**
 * Backed by the single `patreon_tokens` row (id = "default") — one campaign,
 * one token pair, server-only (RLS has no policy for anon/authenticated; see
 * the patreon_tokens migration). Simplified to a plain null return on any
 * lookup failure: unlike getUserIdByToken's valid/invalid/unavailable
 * TokenLookup, getRecentPosts already treats null as "nothing to show", so a
 * three-state return here would be unused precision for a landing-page
 * nicety with no auth/security stakes.
 */
export function getPatreonTokenStore(): PatreonTokenStore {
    return {
        async getTokens(): Promise<PatreonTokens | null> {
            const { data, error } = await getSupabase()
                .from("patreon_tokens")
                .select("access_token, refresh_token, expires_at")
                .eq("id", "default")
                .single();

            if (error && error.code !== PGRST_NO_ROWS) {
                console.error("getPatreonTokenStore.getTokens failed:", error);
            }
            if (error || !data) return null;
            return {
                accessToken: data.access_token as string,
                refreshToken: data.refresh_token as string,
                expiresAt: data.expires_at as string,
            };
        },

        async saveTokens(tokens: PatreonTokens): Promise<void> {
            const { error } = await getSupabase().from("patreon_tokens").upsert(
                {
                    id: "default",
                    access_token: tokens.accessToken,
                    refresh_token: tokens.refreshToken,
                    expires_at: tokens.expiresAt,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "id" },
            );

            if (error)
                throw new Error(
                    `Failed to save Patreon tokens: ${error.message}`,
                );
        },
    };
}

/**
 * One-time bootstrap. PATREON_ACCESS_TOKEN / PATREON_REFRESH_TOKEN are named
 * for exactly what Patreon's client-management page calls them ("Creator's
 * Access Token" / "Creator's Refresh Token") for a manually-registered OAuth
 * client — pasting them here lets a fresh deploy seed patreon_tokens without
 * a hand-run SQL insert. expires_at is seeded already-past (the epoch): these
 * env vars carry no expiry, so the very next call through getRecentPosts
 * refreshes immediately and replaces both with a freshly-minted pair. From
 * then on this is a permanent no-op (`ignoreDuplicates` = INSERT ... ON
 * CONFLICT DO NOTHING on the `id` row) — the env vars can be left in place
 * forever without ever clobbering a token pair that has since rotated past
 * them, and this can safely run on every boot of every replica.
 */
export async function seedPatreonTokensFromEnv(): Promise<void> {
    const accessToken = process.env.PATREON_ACCESS_TOKEN;
    const refreshToken = process.env.PATREON_REFRESH_TOKEN;
    if (!accessToken || !refreshToken) return;

    const { error } = await getSupabase()
        .from("patreon_tokens")
        .upsert(
            {
                id: "default",
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: new Date(0).toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: "id", ignoreDuplicates: true },
        );

    if (error) console.error("Failed to seed Patreon tokens:", error.message);
}

// ---------- Auth codes ----------

export interface AuthCodeRecord {
    code: string;
    redirectUri: string;
    userId: string;
    codeChallenge: string;
    // The client the code was issued to and the RFC 8707 resource it was
    // requested for (null when the client sent none). Both columns were added
    // with oauth_clients; /token refuses a code redeemed by any other client.
    clientId: string;
    resource: string | null;
}

export async function storeAuthCode(rec: AuthCodeRecord): Promise<void> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await getSupabase()
        .from("auth_codes")
        .insert({
            code: hashSecret(rec.code),
            redirect_uri: rec.redirectUri,
            user_id: rec.userId,
            code_challenge: rec.codeChallenge,
            client_id: rec.clientId,
            resource: rec.resource,
            expires_at: expiresAt,
        });

    if (error) throw new Error(`Failed to store auth code: ${error.message}`);
}

export interface AuthCodeData {
    // The at-rest form (hashSecret of the code), not the value the client
    // presented.
    code: string;
    redirect_uri: string;
    user_id: string;
    code_challenge: string | null;
    // Null on codes minted before the oauth_clients migration.
    client_id: string | null;
    resource: string | null;
}

export async function consumeAuthCode(
    code: string,
): Promise<AuthCodeData | null> {
    const now = new Date().toISOString();

    // delete … returning is what keeps a code single-use: two concurrent
    // redemptions can't both get the row back.
    const { data, error } = await getSupabase()
        .from("auth_codes")
        .delete()
        .eq("code", hashSecret(code))
        .gt("expires_at", now)
        .select();

    if (error || !data || data.length === 0) return null;
    return data[0] as AuthCodeData;
}

// ---------- Refresh tokens ----------

// clientId is the OAuth client the token was issued to (refresh_tokens.client_id);
// null only for a refresh that started from a pre-binding, null-client token
// presented without any client credentials.
// ttlSeconds is counted from now: each rotation gets a fresh lifetime
// (sliding), while the token itself stays strictly single-use.
export async function storeRefreshToken(
    token: string,
    userId: string,
    clientId: string | null,
    ttlSeconds: number,
): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    const { error } = await getSupabase()
        .from("refresh_tokens")
        .insert({
            token: hashSecret(token),
            user_id: userId,
            client_id: clientId,
            expires_at: expiresAt,
        });

    if (error)
        throw new Error(`Failed to store refresh token: ${error.message}`);
}

// Atomically deletes and returns the token's owner and client. clientId is null
// on rows written before refresh_tokens.client_id existed.
export async function consumeRefreshToken(
    token: string,
): Promise<{ userId: string; clientId: string | null } | null> {
    // Atomic single use, as in consumeAuthCode.
    const { data, error } = await getSupabase()
        .from("refresh_tokens")
        .delete()
        .eq("token", hashSecret(token))
        .gt("expires_at", new Date().toISOString())
        .select("user_id, client_id");

    const row = data?.[0];
    if (error || !row) return null;
    return {
        userId: row.user_id as string,
        clientId: (row.client_id as string | null) ?? null,
    };
}

// ---------- OAuth clients ----------

// One row per RFC 7591 registration (oauth_clients). The secret is stored only
// as its sha256 hex; the raw value is returned to the registrant once and never
// persisted. The legacy env client never has a row here — src/oauth-store.ts
// resolves it in memory.
export interface OAuthClientRow {
    client_id: string;
    client_secret_hash: string | null;
    token_endpoint_auth_method:
        "none" | "client_secret_post" | "client_secret_basic";
    redirect_uris: string[];
    client_name: string | null;
    grant_types: string[];
}

export async function insertOAuthClient(row: OAuthClientRow): Promise<void> {
    const { error } = await getSupabase().from("oauth_clients").insert(row);
    if (error)
        throw new Error(`Failed to register OAuth client: ${error.message}`);
}

// Null for an unknown client. A lookup failure throws rather than returning
// null: "the database is down" must not read as "this client doesn't exist",
// which /authorize would report to the user as invalid_client.
export async function getOAuthClient(
    clientId: string,
): Promise<OAuthClientRow | null> {
    const { data, error } = await getSupabase()
        .from("oauth_clients")
        .select(
            "client_id, client_secret_hash, token_endpoint_auth_method, redirect_uris, client_name, grant_types",
        )
        .eq("client_id", clientId)
        .maybeSingle();
    if (error)
        throw new Error(`Failed to look up OAuth client: ${error.message}`);
    return (data as OAuthClientRow | null) ?? null;
}

// Stamps oauth_clients.last_used_at when a client authenticates at /token, so
// a later cleanup can tell registrations that were never used from ones that
// were. Best effort: the caller does not await it, and a failure is logged
// rather than thrown, since it must never fail a token request.
export async function touchOAuthClient(clientId: string): Promise<void> {
    const { error } = await getSupabase()
        .from("oauth_clients")
        .update({ last_used_at: new Date().toISOString() })
        .eq("client_id", clientId);
    if (error)
        console.error(
            `[oauth] failed to update client last_used_at: ${error.message}`,
        );
}

// ---------- OAuth cleanup (src/oauth-cleanup.ts drives these) ----------

// Deletes every row of an OAuth token/code table whose expires_at has passed,
// returning how many went. All three tables expire on the same column.
export async function deleteExpiredOAuthRows(
    table: "oauth_tokens" | "refresh_tokens" | "auth_codes",
    nowIso: string,
): Promise<number> {
    const { count, error } = await getSupabase()
        .from(table)
        .delete({ count: "exact" })
        .lt("expires_at", nowIso);
    if (error)
        throw new Error(`Failed to delete expired ${table}: ${error.message}`);
    return count ?? 0;
}

// One page of registrations that never authenticated at /token and were
// created inside the sweep window (see CLIENT_SWEEP_FLOOR_ISO in
// src/oauth-cleanup.ts for why it has a lower bound), ordered by client_id so
// the caller can page with afterId.
export async function listUnusedOAuthClientIds(
    window: { createdAtOrAfterIso: string; createdBeforeIso: string },
    afterId: string | null,
    limit: number,
): Promise<string[]> {
    let q = getSupabase()
        .from("oauth_clients")
        .select("client_id")
        .is("last_used_at", null)
        .gte("created_at", window.createdAtOrAfterIso)
        .lt("created_at", window.createdBeforeIso);
    if (afterId !== null) q = q.gt("client_id", afterId);
    const { data, error } = await q.order("client_id").limit(limit);
    if (error)
        throw new Error(
            `Failed to list unused OAuth clients: ${error.message}`,
        );
    return (data ?? []).map((r) => r.client_id as string);
}

// Which of these client ids a refresh token or an auth code still names. This
// cannot see a pre-Phase-B refresh token, whose client_id is NULL; the sweep
// window's floor keeps those clients out of the candidates instead.
//
// A short answer here would delete a client that holds a grant, so the rows
// are reconciled against an exact count and the call throws when PostgREST's
// row cap (1000 by default, #66) truncated them; the sweep then skips client
// deletion for that run rather than guess.
export async function oauthClientIdsWithGrants(
    ids: string[],
): Promise<Set<string>> {
    const held = new Set<string>();
    if (ids.length === 0) return held;
    for (const table of ["refresh_tokens", "auth_codes"] as const) {
        const { data, error, count } = await getSupabase()
            .from(table)
            .select("client_id", { count: "exact" })
            .in("client_id", ids);
        if (error)
            throw new Error(
                `Failed to check ${table} for OAuth clients: ${error.message}`,
            );
        const rows = data ?? [];
        if (count === null || rows.length < count)
            throw new Error(
                `Checking ${table} for OAuth clients returned ${rows.length} of ${count ?? "?"} rows`,
            );
        for (const r of rows) held.add(r.client_id as string);
    }
    return held;
}

// Deletes these registrations, re-checking in the same statement that each is
// still unused and inside the sweep window, so a client that authenticated
// since it was listed survives. Returns how many rows went.
export async function deleteUnusedOAuthClients(
    ids: string[],
    window: { createdAtOrAfterIso: string; createdBeforeIso: string },
): Promise<number> {
    if (ids.length === 0) return 0;
    const { count, error } = await getSupabase()
        .from("oauth_clients")
        .delete({ count: "exact" })
        .in("client_id", ids)
        .is("last_used_at", null)
        .gte("created_at", window.createdAtOrAfterIso)
        .lt("created_at", window.createdBeforeIso);
    if (error)
        throw new Error(
            `Failed to delete unused OAuth clients: ${error.message}`,
        );
    return count ?? 0;
}

// Is this exact string in the hand-reviewed snapshot of redirects the legacy
// env client may still use (oauth_legacy_redirect_uris)? Exact equality only —
// the snapshot is a list of strings Anton approved, not a pattern.
export async function isLegacyRedirectUri(uri: string): Promise<boolean> {
    const { data, error } = await getSupabase()
        .from("oauth_legacy_redirect_uris")
        .select("redirect_uri")
        .eq("redirect_uri", uri)
        .maybeSingle();
    if (error)
        throw new Error(
            `Failed to look up legacy redirect URI: ${error.message}`,
        );
    return data !== null;
}
