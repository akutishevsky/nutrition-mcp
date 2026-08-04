import type { SQL } from "bun";
import { withAuthDatabase } from "../platform/database.js";
import { hashOpaqueToken, issueOpaqueToken } from "../platform/tokens.js";
import { normalizeAccountEmail } from "./email.js";

export type LoginTokenPurpose = "sign_in" | "verify_email" | "change_email";

export interface LoginChallenge {
    userId: string;
    email: string;
    token: string;
    expiresAt: Date;
}

export interface AuthenticatedWebSession {
    userId: string;
    email: string;
    sessionToken: string;
    expiresAt: Date;
}

interface UserRow {
    id: string;
    email: string;
    status: string;
}

interface LoginTokenRow {
    user_id: string;
    email: string;
    purpose: LoginTokenPurpose;
}

function futureDate(seconds: number): Date {
    return new Date(Date.now() + seconds * 1000);
}

async function ensureUser(tx: SQL, email: string): Promise<UserRow> {
    const rows = await tx<Array<UserRow>>`
        insert into munch.users (email)
        values (${email})
        on conflict (email) do update
        set updated_at = now()
        returning id, email, status::text as status
    `;
    const user = rows[0];
    if (!user || user.status === "deleted") {
        throw new Error("Account is unavailable");
    }
    return user;
}

export async function createLoginChallenge(
    rawEmail: string,
    purpose: LoginTokenPurpose = "sign_in",
    ttlSeconds = 15 * 60,
): Promise<LoginChallenge> {
    if (!Number.isInteger(ttlSeconds) || ttlSeconds < 60 || ttlSeconds > 3600) {
        throw new Error("Login token TTL must be between 60 and 3600 seconds");
    }

    const email = normalizeAccountEmail(rawEmail);
    const issued = issueOpaqueToken();
    const expiresAt = futureDate(ttlSeconds);

    return withAuthDatabase(async (tx) => {
        const user = await ensureUser(tx, email);

        await tx`
            update munch.login_tokens
            set consumed_at = now()
            where email = ${email}
              and purpose = ${purpose}::munch.login_token_purpose
              and consumed_at is null
        `;

        await tx`
            insert into munch.login_tokens (
                email,
                user_id,
                purpose,
                token_hash,
                expires_at
            ) values (
                ${email},
                ${user.id},
                ${purpose}::munch.login_token_purpose,
                ${issued.hash},
                ${expiresAt}
            )
        `;

        return {
            userId: user.id,
            email,
            token: issued.token,
            expiresAt,
        };
    });
}

export async function consumeLoginChallenge(
    token: string,
    purpose: LoginTokenPurpose = "sign_in",
    sessionTtlSeconds = 30 * 24 * 60 * 60,
): Promise<AuthenticatedWebSession | null> {
    if (
        !Number.isInteger(sessionTtlSeconds) ||
        sessionTtlSeconds < 300 ||
        sessionTtlSeconds > 90 * 24 * 60 * 60
    ) {
        throw new Error("Session TTL must be between 5 minutes and 90 days");
    }

    const tokenHash = hashOpaqueToken(token);
    const session = issueOpaqueToken();
    const sessionExpiresAt = futureDate(sessionTtlSeconds);

    return withAuthDatabase(async (tx) => {
        const rows = await tx<Array<LoginTokenRow>>`
            select user_id, email, purpose::text as purpose
            from munch.login_tokens
            where token_hash = ${tokenHash}
              and purpose = ${purpose}::munch.login_token_purpose
              and consumed_at is null
              and expires_at > now()
            for update
        `;
        const challenge = rows[0];
        if (!challenge) return null;

        await tx`
            update munch.login_tokens
            set consumed_at = now()
            where token_hash = ${tokenHash}
        `;

        await tx`
            update munch.users
            set email_verified_at = coalesce(email_verified_at, now()),
                status = case
                    when status = 'pending' then 'active'::munch.account_status
                    else status
                end,
                updated_at = now()
            where id = ${challenge.user_id}
              and status not in ('deleted', 'deletion_pending')
        `;

        const inserted = await tx<Array<{ user_id: string }>>`
            insert into munch.web_sessions (
                user_id,
                token_hash,
                expires_at
            )
            select ${challenge.user_id}, ${session.hash}, ${sessionExpiresAt}
            from munch.users
            where id = ${challenge.user_id}
              and status = 'active'
            returning user_id
        `;
        if (!inserted[0]) return null;

        return {
            userId: challenge.user_id,
            email: challenge.email,
            sessionToken: session.token,
            expiresAt: sessionExpiresAt,
        };
    });
}

export async function resolveWebSession(
    token: string,
): Promise<{ userId: string; email: string } | null> {
    const tokenHash = hashOpaqueToken(token);

    return withAuthDatabase(async (tx) => {
        const rows = await tx<Array<{ user_id: string; email: string }>>`
            update munch.web_sessions session
            set last_seen_at = now()
            from munch.users users
            where session.token_hash = ${tokenHash}
              and session.user_id = users.id
              and session.revoked_at is null
              and session.expires_at > now()
              and users.status = 'active'
            returning session.user_id, users.email
        `;
        return rows[0]
            ? { userId: rows[0].user_id, email: rows[0].email }
            : null;
    });
}

export async function revokeWebSession(token: string): Promise<boolean> {
    const tokenHash = hashOpaqueToken(token);

    return withAuthDatabase(async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            update munch.web_sessions
            set revoked_at = now()
            where token_hash = ${tokenHash}
              and revoked_at is null
            returning id
        `;
        return Boolean(rows[0]);
    });
}
