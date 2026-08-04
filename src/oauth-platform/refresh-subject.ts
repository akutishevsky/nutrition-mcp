import { withAuthDatabase } from "../platform/database.js";
import { hashOpaqueToken, tokenHashMatches } from "../platform/tokens.js";
import type { TokenEndpointAuthMethod } from "./repository.js";

interface RefreshSubjectRow {
    user_id: string;
    expires_at: Date | string;
    revoked_at: Date | string | null;
    client_id: string;
    client_secret_hash: Uint8Array | null;
    token_endpoint_auth_method: TokenEndpointAuthMethod;
}

function timestamp(value: Date | string): number {
    return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export async function getRefreshTokenSubject(input: {
    refreshToken: string;
    clientId: string;
    clientSecret?: string;
}): Promise<string> {
    const tokenHash = hashOpaqueToken(input.refreshToken);

    return withAuthDatabase(async (tx) => {
        const rows = await tx<Array<RefreshSubjectRow>>`
            select
                refresh.user_id,
                refresh.expires_at,
                refresh.revoked_at,
                client.client_id,
                client.client_secret_hash,
                client.token_endpoint_auth_method::text as token_endpoint_auth_method
            from munch.oauth_refresh_tokens refresh
            join munch.oauth_clients client on client.client_id = refresh.client_id
            where refresh.token_hash = ${tokenHash}
        `;
        const row = rows[0];
        if (
            !row ||
            row.client_id !== input.clientId ||
            row.revoked_at ||
            timestamp(row.expires_at) <= Date.now()
        ) {
            throw new Error("invalid_grant");
        }

        if (row.token_endpoint_auth_method === "client_secret_post") {
            if (
                !input.clientSecret ||
                !row.client_secret_hash ||
                !tokenHashMatches(input.clientSecret, row.client_secret_hash)
            ) {
                throw new Error("invalid_client");
            }
        }

        // A consumed token still returns its subject here. rotateRefreshToken is
        // then called and performs family-wide reuse revocation atomically.
        return row.user_id;
    });
}
