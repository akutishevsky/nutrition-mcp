import { withAuthDatabase } from "../platform/database.js";

export interface OAuthConnectionSummary {
    tokenFamilyId: string;
    clientId: string;
    clientName: string | null;
    expiresAt: string;
    activeAccessTokens: number;
    activeRefreshTokens: number;
}

export async function listOAuthConnections(
    userId: string,
): Promise<OAuthConnectionSummary[]> {
    return withAuthDatabase(async (tx) => {
        const rows = await tx<
            Array<{
                token_family_id: string;
                client_id: string;
                client_name: string | null;
                expires_at: Date | string;
                active_access_tokens: number;
                active_refresh_tokens: number;
            }>
        >`
            select
                families.token_family_id,
                families.client_id,
                clients.client_name,
                families.expires_at,
                (
                    select count(*)::integer
                    from munch.oauth_access_tokens access
                    where access.token_family_id = families.token_family_id
                      and access.user_id = ${userId}
                      and access.revoked_at is null
                      and access.expires_at > now()
                ) as active_access_tokens,
                (
                    select count(*)::integer
                    from munch.oauth_refresh_tokens refresh
                    where refresh.token_family_id = families.token_family_id
                      and refresh.user_id = ${userId}
                      and refresh.revoked_at is null
                      and refresh.expires_at > now()
                ) as active_refresh_tokens
            from (
                select
                    token_family_id,
                    client_id,
                    max(expires_at) as expires_at
                from munch.oauth_refresh_tokens
                where user_id = ${userId}
                  and revoked_at is null
                  and expires_at > now()
                group by token_family_id, client_id
            ) families
            join munch.oauth_clients clients on clients.client_id = families.client_id
            order by families.expires_at desc
        `;
        return rows.map((row) => ({
            tokenFamilyId: row.token_family_id,
            clientId: row.client_id,
            clientName: row.client_name,
            expiresAt: new Date(row.expires_at).toISOString(),
            activeAccessTokens: Number(row.active_access_tokens),
            activeRefreshTokens: Number(row.active_refresh_tokens),
        }));
    });
}

export async function revokeOAuthConnection(
    userId: string,
    tokenFamilyId: string,
): Promise<boolean> {
    if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            tokenFamilyId,
        )
    ) {
        return false;
    }
    return withAuthDatabase(async (tx) => {
        const refreshRows = await tx<Array<{ token_family_id: string }>>`
            update munch.oauth_refresh_tokens
            set revoked_at = coalesce(revoked_at, now())
            where user_id = ${userId}
              and token_family_id = ${tokenFamilyId}
            returning token_family_id
        `;
        await tx`
            update munch.oauth_access_tokens
            set revoked_at = coalesce(revoked_at, now())
            where user_id = ${userId}
              and token_family_id = ${tokenFamilyId}
        `;
        return refreshRows.length > 0;
    });
}
