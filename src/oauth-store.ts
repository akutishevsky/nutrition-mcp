// The storage and identity seams the OAuth router depends on (D11 in the
// brief). createOAuthRouter() defaults to the Supabase-backed implementations
// below; src/oauth.test.ts passes in-memory fakes instead, which is why that
// test file never needs mock.module("./supabase.js") — a process-wide mock
// there is exactly what broke middleware.test.ts on Linux CI once already.
import { hashSecret } from "./token-hash.js";
import { HEALTH_SYNC_CLIENT_ID } from "./health-sync.js";
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
    touchOAuthClient,
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
    // Set only on a built-in client this server runs itself (see
    // HEALTH_SYNC_CLIENT). Never read from oauth_clients, so absent on every
    // registered client and on the legacy one.
    firstParty?: "health-sync";
}

export interface NewOAuthClient extends Omit<OAuthClient, "legacy"> {
    clientName: string | null;
    grantTypes: string[];
}

export interface OAuthStore {
    createClient(c: NewOAuthClient): Promise<void>;
    getClient(clientId: string): Promise<OAuthClient | null>;
    // Records that a registered client just authenticated at /token
    // (oauth_clients.last_used_at). The router never awaits it for the
    // response, and it must not throw.
    touchClient(clientId: string): Promise<void>;
    isLegacyRedirect(uri: string): Promise<boolean>;
    // Tokens and codes cross this interface raw. The store owns their at-rest
    // form: it writes only hashSecret(raw) (src/token-hash.ts), and a consume
    // or lookup matches that hash exactly. Both the Supabase store and the
    // test fake keep this contract.
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
        ttlSeconds: number,
    ): Promise<void>;
    consumeRefreshToken(
        token: string,
    ): Promise<{ userId: string; clientId: string | null } | null>;
}

// Each resolves to the Supabase user id. signIn throws a SignInError and
// signUp a SignUpError (src/auth-errors.ts), whose `code` picks the login
// page's translated message; signInWithGoogleIdToken throws a plain Error.
export interface OAuthAuth {
    signIn(email: string, password: string): Promise<string>;
    signUp(email: string, password: string): Promise<string>;
    signInWithGoogleIdToken(idToken: string, rawNonce: string): Promise<string>;
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
        secretHash: hashSecret(clientSecret),
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
        // No oauth_clients row to stamp.
        touchClient: (clientId) =>
            clientId === legacy.clientId
                ? Promise.resolve()
                : store.touchClient(clientId),
    };
}

// The Apple Health sync pairing flow's own client: the server signs a phone
// in by acting as an OAuth client of itself (src/health-sync-routes.ts), so
// the whole sign-in — password, Google, the browser-binding cookie, the
// consent notice — is the same hardened flow every MCP client goes through.
// Resolved in memory like the legacy client (withFirstPartyClients): it has
// no oauth_clients row, so the hourly client sweep can never delete it and
// nothing can register over it (/register mints its own ids). It is public
// ("none"), and its only accepted redirect is this server's own
// HEALTH_SYNC_CALLBACK_PATH on the request's own base URL, exact match — see
// redirectAllowed in src/oauth.ts. Its codes are redeemed by that callback
// straight from the store, never at /token, which refuses this client.
//
// The id itself lives in the pure src/health-sync.ts (which imports nothing
// from here) and is re-exported so OAuth code keeps one import site.
export { HEALTH_SYNC_CLIENT_ID };
export const HEALTH_SYNC_CALLBACK_PATH = "/health-sync/callback";

// The one redirect the health-sync client may use, for a request whose
// getBaseUrl() is baseUrl.
export function healthSyncCallbackUrl(baseUrl: string): string {
    return `${baseUrl}${HEALTH_SYNC_CALLBACK_PATH}`;
}

export const HEALTH_SYNC_CLIENT: OAuthClient = Object.freeze({
    clientId: HEALTH_SYNC_CLIENT_ID,
    secretHash: null,
    authMethod: "none",
    // Empty on purpose: its redirect depends on the request's base URL, so
    // redirectAllowed checks it against healthSyncCallbackUrl instead.
    redirectUris: [],
    legacy: false,
    firstParty: "health-sync",
}) as OAuthClient;

// Wraps any store so the built-in clients resolve in memory, ahead of the
// table, exactly as withLegacyClient does for the env client. Applied by the
// router to whichever store it was given, fake or Supabase.
export function withFirstPartyClients(store: OAuthStore): OAuthStore {
    return {
        ...store,
        getClient: (clientId) =>
            clientId === HEALTH_SYNC_CLIENT_ID
                ? Promise.resolve(HEALTH_SYNC_CLIENT)
                : store.getClient(clientId),
        // No oauth_clients row to stamp.
        touchClient: (clientId) =>
            clientId === HEALTH_SYNC_CLIENT_ID
                ? Promise.resolve()
                : store.touchClient(clientId),
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
        touchClient: touchOAuthClient,
        isLegacyRedirect: isLegacyRedirectUri,
        storeAuthCode,
        consumeAuthCode,
        storeToken,
        storeRefreshToken,
        consumeRefreshToken,
    };
}

export const supabaseOAuthAuth: OAuthAuth = {
    signIn: signInUser,
    signUp: signUpUser,
    signInWithGoogleIdToken,
};
