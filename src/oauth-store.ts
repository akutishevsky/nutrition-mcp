// The storage and identity seams the OAuth router depends on (D11 in the
// brief). createOAuthRouter() defaults to the Supabase-backed implementations
// below; src/oauth.test.ts passes in-memory fakes instead, which is why that
// test file never needs mock.module("./supabase.js") — a process-wide mock
// there is exactly what broke middleware.test.ts on Linux CI once already.
import crypto from "node:crypto";
import {
    consumeAuthCode,
    consumeRefreshToken,
    getOAuthClient,
    insertOAuthClient,
    isLegacyRedirectUri,
    signInUser,
    signInWithGoogleIdToken,
    signUpUser,
    storeAuthCode,
    storeRefreshToken,
    storeToken,
    type AuthCodeData,
    type AuthCodeRecord,
} from "./supabase.js";

export type { AuthCodeData, AuthCodeRecord };

export type TokenEndpointAuthMethod =
    "none" | "client_secret_post" | "client_secret_basic";

export interface OAuthClient {
    clientId: string;
    // sha256 hex of the client secret; null for a public ("none") client.
    secretHash: string | null;
    authMethod: TokenEndpointAuthMethod;
    // Exact strings as registered. Empty for the legacy env client, whose
    // redirects are checked against loopback + the legacy snapshot instead.
    redirectUris: string[];
    legacy: boolean;
}

export interface NewOAuthClient extends Omit<OAuthClient, "legacy"> {
    clientName: string | null;
    grantTypes: string[];
}

export interface OAuthStore {
    createClient(c: NewOAuthClient): Promise<void>;
    getClient(clientId: string): Promise<OAuthClient | null>;
    isLegacyRedirect(uri: string): Promise<boolean>;
    storeAuthCode(rec: AuthCodeRecord): Promise<void>;
    consumeAuthCode(code: string): Promise<AuthCodeData | null>;
    storeToken(
        token: string,
        userId: string,
        ttlSeconds: number,
    ): Promise<void>;
    storeRefreshToken(
        token: string,
        userId: string,
        clientId: string | null,
    ): Promise<void>;
    consumeRefreshToken(
        token: string,
    ): Promise<{ userId: string; clientId: string | null } | null>;
}

// Each resolves to the Supabase user id, or throws with a user-facing message.
export interface OAuthAuth {
    signIn(email: string, password: string): Promise<string>;
    signUp(email: string, password: string): Promise<string>;
    signInWithGoogleIdToken(idToken: string, rawNonce: string): Promise<string>;
}

// Lowercase sha256 hex — the at-rest form of a client secret (and, from Phase
// C, of tokens and codes). Must agree with Postgres
// encode(sha256(convert_to(x,'UTF8')),'hex') for the backfill to line up.
export function sha256Hex(raw: string): string {
    return crypto.createHash("sha256").update(raw).digest("hex");
}

// The static OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET client every caller used
// to be handed by /register (#148). Kept, restricted to loopback plus the
// hand-reviewed oauth_legacy_redirect_uris snapshot, until its sunset, so
// connections made before per-client registration keep working. Read at
// router construction; without both env vars there is simply no legacy
// client.
export function legacyClientFromEnv(): OAuthClient | null {
    const clientId = process.env.OAUTH_CLIENT_ID;
    const clientSecret = process.env.OAUTH_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
        clientId,
        secretHash: sha256Hex(clientSecret),
        authMethod: "client_secret_post",
        redirectUris: [],
        legacy: true,
    };
}

// Wraps any store so the legacy client resolves in memory and never reaches
// the oauth_clients table (it has no row there, and a lookup would only cost a
// round trip per /authorize). Applied by the router to whichever store it was
// given, so an injected fake store sees the same legacy behaviour as prod.
export function withLegacyClient(
    store: OAuthStore,
    legacy: OAuthClient | null,
): OAuthStore {
    if (!legacy) return store;
    return {
        ...store,
        getClient: (clientId) =>
            clientId === legacy.clientId
                ? Promise.resolve(legacy)
                : store.getClient(clientId),
    };
}

export function createSupabaseOAuthStore(): OAuthStore {
    return {
        async createClient(c) {
            await insertOAuthClient({
                client_id: c.clientId,
                client_secret_hash: c.secretHash,
                token_endpoint_auth_method: c.authMethod,
                redirect_uris: c.redirectUris,
                client_name: c.clientName,
                grant_types: c.grantTypes,
            });
        },
        async getClient(clientId) {
            const row = await getOAuthClient(clientId);
            if (!row) return null;
            return {
                clientId: row.client_id,
                secretHash: row.client_secret_hash,
                authMethod: row.token_endpoint_auth_method,
                redirectUris: row.redirect_uris,
                legacy: false,
            };
        },
        isLegacyRedirect: isLegacyRedirectUri,
        storeAuthCode,
        consumeAuthCode,
        storeToken,
        // refresh_tokens has no client_id column until Phase B's migration,
        // so the binding is accepted here and dropped; consumed tokens report
        // a null client, which Phase B treats as "any client".
        async storeRefreshToken(token, userId, _clientId) {
            await storeRefreshToken(token, userId);
        },
        async consumeRefreshToken(token) {
            const userId = await consumeRefreshToken(token);
            return userId ? { userId, clientId: null } : null;
        },
    };
}

export const supabaseOAuthAuth: OAuthAuth = {
    signIn: signInUser,
    signUp: signUpUser,
    signInWithGoogleIdToken,
};
