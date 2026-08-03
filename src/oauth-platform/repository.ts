import type { SQL } from "bun";
import { createHash, randomUUID } from "node:crypto";
import { withAuthDatabase } from "../platform/database.js";
import {
    hashOpaqueToken,
    issueOpaqueToken,
    tokenHashMatches,
} from "../platform/tokens.js";
import {
    codeVerifierMatches,
    validateCodeChallenge,
    validateCodeVerifier,
} from "./pkce.js";
import {
    redirectUriRegistered,
    validateRedirectUri,
    validateRedirectUris,
} from "./redirect-uri.js";

export type TokenEndpointAuthMethod = "none" | "client_secret_post";

export interface RegisteredOAuthClient {
    clientId: string;
    clientSecret?: string;
    clientName?: string;
    redirectUris: string[];
    tokenEndpointAuthMethod: TokenEndpointAuthMethod;
}

export interface AuthorizationSession {
    id: string;
    clientId: string;
    clientName: string | null;
    redirectUri: string;
    state: string;
    codeChallenge: string;
    userId: string | null;
    expiresAt: Date;
    authorizedAt: Date | null;
}

export interface IssuedAuthorizationCode {
    code: string;
    state: string;
    redirectUri: string;
    expiresAt: Date;
}

export interface OAuthTokenPair {
    accessToken: string;
    accessTokenExpiresAt: Date;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
    tokenType: "Bearer";
}

export type AccessTokenLookup =
    | { status: "valid"; userId: string; clientId: string; expiresAt: Date }
    | { status: "invalid" };

interface ClientRow {
    client_id: string;
    client_secret_hash: Uint8Array | null;
    client_name: string | null;
    redirect_uris: string[];
    token_endpoint_auth_method: TokenEndpointAuthMethod;
}

interface AuthorizationCodeRow extends ClientRow {
    user_id: string;
    redirect_uri: string;
    code_challenge: string;
    expires_at: Date | string;
    consumed_at: Date | string | null;
}

interface RefreshTokenRow extends ClientRow {
    token_family_id: string;
    user_id: string;
    expires_at: Date | string;
    consumed_at: Date | string | null;
    revoked_at: Date | string | null;
}

interface InternalTokenPair {
    familyId: string;
    access: ReturnType<typeof issueOpaqueToken>;
    refresh: ReturnType<typeof issueOpaqueToken>;
    accessExpiresAt: Date;
    refreshExpiresAt: Date;
}

const AUTHORIZATION_SESSION_TTL_SECONDS = 10 * 60;
const AUTHORIZATION_CODE_TTL_SECONDS = 5 * 60;
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60;

function futureDate(seconds: number): Date {
    return new Date(Date.now() + seconds * 1000);
}

function toDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
}

function validateClientName(value: unknown): string | null {
    if (value == null) return null;
    if (typeof value !== "string") throw new Error("invalid_client_name");
    const normalized = value.trim();
    if (!normalized || normalized.length > 200) {
        throw new Error("invalid_client_name");
    }
    return normalized;
}

function validateAuthMethod(value: unknown): TokenEndpointAuthMethod {
    if (value == null || value === "none") return "none";
    if (value === "client_secret_post") return value;
    throw new Error("unsupported_token_endpoint_auth_method");
}

function validateState(value: string): string {
    if (value.length < 1 || value.length > 2048) {
        throw new Error("invalid_state");
    }
    return value;
}

function hashState(value: string): Buffer {
    return createHash("sha256").update(value, "utf8").digest();
}

function assertClientAuthentication(
    client: ClientRow,
    suppliedSecret: string | undefined,
): void {
    if (client.token_endpoint_auth_method === "none") return;
    if (
        !suppliedSecret ||
        !client.client_secret_hash ||
        !tokenHashMatches(suppliedSecret, client.client_secret_hash)
    ) {
        throw new Error("invalid_client");
    }
}

async function selectClient(tx: SQL, clientId: string): Promise<ClientRow> {
    const rows = await tx<Array<ClientRow>>`
        select
            client_id,
            client_secret_hash,
            client_name,
            redirect_uris,
            token_endpoint_auth_method::text as token_endpoint_auth_method
        from munch.oauth_clients
        where client_id = ${clientId}
    `;
    const client = rows[0];
    if (!client) throw new Error("invalid_client");
    return client;
}

export async function registerOAuthClient(input: {
    clientName?: unknown;
    redirectUris: unknown;
    tokenEndpointAuthMethod?: unknown;
}): Promise<RegisteredOAuthClient> {
    const clientName = validateClientName(input.clientName);
    const redirectUris = validateRedirectUris(input.redirectUris);
    const authMethod = validateAuthMethod(input.tokenEndpointAuthMethod);
    const clientId = `munch_${issueOpaqueToken(24).token}`;
    const secret =
        authMethod === "client_secret_post" ? issueOpaqueToken(32) : null;
    const redirectUrisJson = JSON.stringify(redirectUris);

    await withAuthDatabase(async (tx) => {
        await tx`
            insert into munch.oauth_clients (
                client_id,
                client_secret_hash,
                client_name,
                redirect_uris,
                token_endpoint_auth_method
            ) values (
                ${clientId},
                ${secret?.hash ?? null},
                ${clientName},
                (
                    select array_agg(value)
                    from jsonb_array_elements_text(${redirectUrisJson}::jsonb)
                ),
                ${authMethod}
            )
        `;
    });

    return {
        clientId,
        ...(secret ? { clientSecret: secret.token } : {}),
        ...(clientName ? { clientName } : {}),
        redirectUris,
        tokenEndpointAuthMethod: authMethod,
    };
}

export async function createAuthorizationSession(input: {
    clientId: string;
    redirectUri: string;
    state: string;
    codeChallenge: string;
}): Promise<AuthorizationSession> {
    const redirectUri = validateRedirectUri(input.redirectUri);
    const state = validateState(input.state);
    const codeChallenge = validateCodeChallenge(input.codeChallenge);
    const expiresAt = futureDate(AUTHORIZATION_SESSION_TTL_SECONDS);

    return withAuthDatabase(async (tx) => {
        const client = await selectClient(tx, input.clientId);
        if (!redirectUriRegistered(redirectUri, client.redirect_uris)) {
            throw new Error("invalid_redirect_uri");
        }

        const rows = await tx<Array<{ id: string; expires_at: Date | string }>>`
            insert into munch.oauth_authorization_sessions (
                client_id,
                redirect_uri,
                state_hash,
                state_value,
                code_challenge,
                code_challenge_method,
                expires_at
            ) values (
                ${client.client_id},
                ${redirectUri},
                ${hashState(state)},
                ${state},
                ${codeChallenge},
                'S256',
                ${expiresAt}
            )
            returning id, expires_at
        `;
        const created = rows[0];
        if (!created) throw new Error("authorization_session_create_failed");

        return {
            id: created.id,
            clientId: client.client_id,
            clientName: client.client_name,
            redirectUri,
            state,
            codeChallenge,
            userId: null,
            expiresAt: toDate(created.expires_at),
            authorizedAt: null,
        };
    });
}

export async function getAuthorizationSession(
    sessionId: string,
): Promise<AuthorizationSession | null> {
    return withAuthDatabase(async (tx) => {
        const rows = await tx<
            Array<{
                id: string;
                client_id: string;
                client_name: string | null;
                redirect_uri: string;
                state_value: string;
                code_challenge: string;
                user_id: string | null;
                expires_at: Date | string;
                authorized_at: Date | string | null;
            }>
        >`
            select
                session.id,
                session.client_id,
                client.client_name,
                session.redirect_uri,
                session.state_value,
                session.code_challenge,
                session.user_id,
                session.expires_at,
                session.authorized_at
            from munch.oauth_authorization_sessions session
            join munch.oauth_clients client on client.client_id = session.client_id
            where session.id = ${sessionId}
              and session.expires_at > now()
              and session.completed_at is null
              and session.denied_at is null
        `;
        const row = rows[0];
        return row
            ? {
                  id: row.id,
                  clientId: row.client_id,
                  clientName: row.client_name,
                  redirectUri: row.redirect_uri,
                  state: row.state_value,
                  codeChallenge: row.code_challenge,
                  userId: row.user_id,
                  expiresAt: toDate(row.expires_at),
                  authorizedAt: row.authorized_at
                      ? toDate(row.authorized_at)
                      : null,
              }
            : null;
    });
}

export async function authorizeSession(
    sessionId: string,
    userId: string,
): Promise<boolean> {
    return withAuthDatabase(async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            update munch.oauth_authorization_sessions session
            set user_id = ${userId},
                authorized_at = coalesce(session.authorized_at, now())
            from munch.users users
            where session.id = ${sessionId}
              and users.id = ${userId}
              and users.status = 'active'
              and (session.user_id is null or session.user_id = ${userId})
              and session.expires_at > now()
              and session.completed_at is null
              and session.denied_at is null
            returning session.id
        `;
        return Boolean(rows[0]);
    });
}

export async function denyAuthorizationSession(
    sessionId: string,
    userId: string,
): Promise<{ redirectUri: string; state: string } | null> {
    return withAuthDatabase(async (tx) => {
        const rows = await tx<
            Array<{ redirect_uri: string; state_value: string }>
        >`
            update munch.oauth_authorization_sessions
            set denied_at = now()
            where id = ${sessionId}
              and user_id = ${userId}
              and expires_at > now()
              and completed_at is null
              and denied_at is null
            returning redirect_uri, state_value
        `;
        const row = rows[0];
        return row
            ? { redirectUri: row.redirect_uri, state: row.state_value }
            : null;
    });
}

export async function issueAuthorizationCode(
    sessionId: string,
    userId: string,
): Promise<IssuedAuthorizationCode> {
    const code = issueOpaqueToken(32);
    const expiresAt = futureDate(AUTHORIZATION_CODE_TTL_SECONDS);

    return withAuthDatabase(async (tx) => {
        const sessions = await tx<
            Array<{
                client_id: string;
                redirect_uri: string;
                state_value: string;
                code_challenge: string;
            }>
        >`
            select client_id, redirect_uri, state_value, code_challenge
            from munch.oauth_authorization_sessions
            where id = ${sessionId}
              and user_id = ${userId}
              and authorized_at is not null
              and expires_at > now()
              and completed_at is null
              and denied_at is null
            for update
        `;
        const session = sessions[0];
        if (!session) throw new Error("invalid_authorization_session");

        await tx`
            insert into munch.oauth_authorization_codes (
                code_hash,
                user_id,
                client_id,
                redirect_uri,
                code_challenge,
                expires_at,
                issued_from_session_id
            ) values (
                ${code.hash},
                ${userId},
                ${session.client_id},
                ${session.redirect_uri},
                ${session.code_challenge},
                ${expiresAt},
                ${sessionId}
            )
        `;
        await tx`
            update munch.oauth_authorization_sessions
            set completed_at = now()
            where id = ${sessionId}
        `;

        return {
            code: code.token,
            state: session.state_value,
            redirectUri: session.redirect_uri,
            expiresAt,
        };
    });
}

function createTokenPair(familyId = randomUUID()): InternalTokenPair {
    return {
        familyId,
        access: issueOpaqueToken(32),
        refresh: issueOpaqueToken(48),
        accessExpiresAt: futureDate(ACCESS_TOKEN_TTL_SECONDS),
        refreshExpiresAt: futureDate(REFRESH_TOKEN_TTL_SECONDS),
    };
}

async function insertTokenPair(
    tx: SQL,
    userId: string,
    clientId: string,
    pair: InternalTokenPair,
): Promise<void> {
    await tx`
        insert into munch.oauth_access_tokens (
            token_hash,
            token_family_id,
            user_id,
            client_id,
            expires_at
        ) values (
            ${pair.access.hash},
            ${pair.familyId},
            ${userId},
            ${clientId},
            ${pair.accessExpiresAt}
        )
    `;
    await tx`
        insert into munch.oauth_refresh_tokens (
            token_hash,
            token_family_id,
            user_id,
            client_id,
            expires_at
        ) values (
            ${pair.refresh.hash},
            ${pair.familyId},
            ${userId},
            ${clientId},
            ${pair.refreshExpiresAt}
        )
    `;
}

function exposeTokenPair(pair: InternalTokenPair): OAuthTokenPair {
    return {
        accessToken: pair.access.token,
        accessTokenExpiresAt: pair.accessExpiresAt,
        refreshToken: pair.refresh.token,
        refreshTokenExpiresAt: pair.refreshExpiresAt,
        tokenType: "Bearer",
    };
}

export async function exchangeAuthorizationCode(input: {
    code: string;
    clientId: string;
    redirectUri: string;
    codeVerifier: string;
    clientSecret?: string;
}): Promise<OAuthTokenPair> {
    const codeHash = hashOpaqueToken(input.code);
    const redirectUri = validateRedirectUri(input.redirectUri);
    validateCodeVerifier(input.codeVerifier);
    const pair = createTokenPair();

    return withAuthDatabase(async (tx) => {
        const rows = await tx<Array<AuthorizationCodeRow>>`
            select
                code.user_id,
                code.redirect_uri,
                code.code_challenge,
                code.expires_at,
                code.consumed_at,
                client.client_id,
                client.client_secret_hash,
                client.client_name,
                client.redirect_uris,
                client.token_endpoint_auth_method::text as token_endpoint_auth_method
            from munch.oauth_authorization_codes code
            join munch.oauth_clients client on client.client_id = code.client_id
            where code.code_hash = ${codeHash}
            for update
        `;
        const authorizationCode = rows[0];
        if (
            !authorizationCode ||
            authorizationCode.consumed_at ||
            toDate(authorizationCode.expires_at).getTime() <= Date.now() ||
            authorizationCode.client_id !== input.clientId ||
            authorizationCode.redirect_uri !== redirectUri
        ) {
            throw new Error("invalid_grant");
        }

        assertClientAuthentication(authorizationCode, input.clientSecret);
        if (
            !codeVerifierMatches(
                input.codeVerifier,
                authorizationCode.code_challenge,
            )
        ) {
            throw new Error("invalid_grant");
        }

        await tx`
            update munch.oauth_authorization_codes
            set consumed_at = now()
            where code_hash = ${codeHash}
        `;
        await insertTokenPair(
            tx,
            authorizationCode.user_id,
            authorizationCode.client_id,
            pair,
        );
        return exposeTokenPair(pair);
    });
}

async function revokeTokenFamily(tx: SQL, familyId: string): Promise<void> {
    await tx`
        update munch.oauth_access_tokens
        set revoked_at = coalesce(revoked_at, now())
        where token_family_id = ${familyId}
    `;
    await tx`
        update munch.oauth_refresh_tokens
        set revoked_at = coalesce(revoked_at, now())
        where token_family_id = ${familyId}
    `;
}

export async function rotateRefreshToken(input: {
    refreshToken: string;
    clientId: string;
    clientSecret?: string;
}): Promise<OAuthTokenPair> {
    const refreshHash = hashOpaqueToken(input.refreshToken);

    const result = await withAuthDatabase(async (tx) => {
        const rows = await tx<Array<RefreshTokenRow>>`
            select
                refresh.token_family_id,
                refresh.user_id,
                refresh.expires_at,
                refresh.consumed_at,
                refresh.revoked_at,
                client.client_id,
                client.client_secret_hash,
                client.client_name,
                client.redirect_uris,
                client.token_endpoint_auth_method::text as token_endpoint_auth_method
            from munch.oauth_refresh_tokens refresh
            join munch.oauth_clients client on client.client_id = refresh.client_id
            where refresh.token_hash = ${refreshHash}
            for update
        `;
        const current = rows[0];
        if (!current || current.client_id !== input.clientId) {
            throw new Error("invalid_grant");
        }
        assertClientAuthentication(current, input.clientSecret);

        if (current.consumed_at) {
            await revokeTokenFamily(tx, current.token_family_id);
            return { kind: "reuse" as const };
        }
        if (
            current.revoked_at ||
            toDate(current.expires_at).getTime() <= Date.now()
        ) {
            throw new Error("invalid_grant");
        }

        const pair = createTokenPair(current.token_family_id);
        await tx`
            update munch.oauth_refresh_tokens
            set consumed_at = now(),
                replaced_by_hash = ${pair.refresh.hash}
            where token_hash = ${refreshHash}
        `;
        await insertTokenPair(tx, current.user_id, current.client_id, pair);
        return { kind: "ok" as const, pair };
    });

    if (result.kind === "reuse") {
        throw new Error("refresh_token_reuse_detected");
    }
    return exposeTokenPair(result.pair);
}

export async function resolveAccessToken(
    accessToken: string,
): Promise<AccessTokenLookup> {
    const tokenHash = hashOpaqueToken(accessToken);

    return withAuthDatabase(async (tx) => {
        const rows = await tx<
            Array<{
                user_id: string;
                client_id: string;
                expires_at: Date | string;
            }>
        >`
            select token.user_id, token.client_id, token.expires_at
            from munch.oauth_access_tokens token
            join munch.users users on users.id = token.user_id
            where token.token_hash = ${tokenHash}
              and token.revoked_at is null
              and token.expires_at > now()
              and users.status = 'active'
        `;
        const row = rows[0];
        return row
            ? {
                  status: "valid",
                  userId: row.user_id,
                  clientId: row.client_id,
                  expiresAt: toDate(row.expires_at),
              }
            : { status: "invalid" };
    });
}

export async function revokeOAuthConnection(
    userId: string,
    clientId: string,
): Promise<void> {
    await withAuthDatabase(async (tx) => {
        await tx`
            update munch.oauth_access_tokens
            set revoked_at = coalesce(revoked_at, now())
            where user_id = ${userId}
              and client_id = ${clientId}
        `;
        await tx`
            update munch.oauth_refresh_tokens
            set revoked_at = coalesce(revoked_at, now())
            where user_id = ${userId}
              and client_id = ${clientId}
        `;
    });
}
