import {
    withAuthDatabase,
    type DatabaseTransaction,
} from "../platform/database.js";
import type { BetterAuthRuntimeConfig } from "./config.js";
import {
    appleSignInConfigured,
    googleWebSignInConfigured,
} from "./social-sign-in.js";

/**
 * Account linking backend (Amendment I) — the "Sign-in methods" read model
 * and guardrails the Settings UI (S6 slice 9) consumes.
 *
 * Method inventory, defined from Better Auth's actual account model
 * (`munch.auth_accounts`, one row per linked provider identity, unique on
 * `(provider_id, account_id)`):
 *
 * - **Email link** — the passwordless magic-link method. It is NOT an
 *   `auth_accounts` row: Better Auth's magic-link plugin verifies a token
 *   against `munch.users.email` and creates a session (and, for a new
 *   address, the user) without ever writing an account row. The method is
 *   therefore represented as derived state: linked whenever the account
 *   has an email address (every Munch account does), its identity is the
 *   account email, and it is NOT removable — there is no provider row to
 *   delete, and removing the account's email is account management, not
 *   sign-in-method management.
 * - **Google / Apple** — one inventory entry per social provider. Linked
 *   iff an `auth_accounts` row exists with `provider_id` `"google"` /
 *   `"apple"` for the user (the row's `account_id` is the provider's
 *   stable subject id — linking keys on that provider identity, never on
 *   email matching, so an Apple private-relay address cannot break or
 *   misdirect a link). These are the removable methods.
 * - The `credential` provider row (email/password) is deliberately NOT in
 *   the inventory: username/password sign-in exists solely as the
 *   controlled reviewer login (Michael's auth rule — sign-in stays SSO /
 *   email link, no passwords are added or managed here). A credential row
 *   still counts as a remaining sign-in method in the unlink guard below,
 *   because the reviewer account does retain that path.
 *
 * MCP/OAuth consent identities (`munch."oauthConsent"` and friends) are a
 * different table family and are never read or written here — this is
 * first-party sign-in only.
 */

export type SignInProviderId = "google" | "apple";
export type SignInMethodId = "email" | SignInProviderId;
export type SignInMethodState = "linked" | "not_linked" | "not_configured";

export interface SignInMethod {
    id: SignInMethodId;
    label: string;
    state: SignInMethodState;
    /** Whether the provider itself is configured on this deployment. */
    configured: boolean;
    /** Masked linked identity (partial email / handle). Never a full
     * provider payload, token, or unmasked provider account id. */
    maskedIdentity: string | null;
    /** Whether the method can be unlinked through this backend. */
    removable: boolean;
    /** Whether a link flow can be started for this method right now. */
    canLink: boolean;
}

export const SIGN_IN_PROVIDERS: readonly SignInProviderId[] = [
    "google",
    "apple",
];

export function isSignInProviderId(value: string): value is SignInProviderId {
    return (SIGN_IN_PROVIDERS as readonly string[]).includes(value);
}

export type SignInMethodErrorCode =
    | "sign_in_method_not_removable"
    | "sign_in_method_not_linked"
    | "last_sign_in_method"
    | "sign_in_method_conflict"
    | "provider_not_configured";

export class SignInMethodError extends Error {
    readonly code: SignInMethodErrorCode;
    readonly status: 400 | 404 | 409;

    constructor(
        code: SignInMethodErrorCode,
        status: 400 | 404 | 409,
        message: string,
    ) {
        super(message);
        this.name = "SignInMethodError";
        this.code = code;
        this.status = status;
    }
}

const PROVIDER_LABELS: Record<SignInProviderId, string> = {
    google: "Google",
    apple: "Apple",
};

/**
 * Mask an email address for display: first character of the local part,
 * the domain in full (domains are not identifying on their own and the
 * user needs to recognise which mailbox a method points at).
 * `michaelhmiv@gmail.com` → `m•••@gmail.com`.
 */
export function maskEmailAddress(email: string): string {
    const normalized = email.trim().toLowerCase();
    const at = normalized.lastIndexOf("@");
    if (at <= 0 || at === normalized.length - 1) return "•••";
    return `${normalized.slice(0, 1)}•••@${normalized.slice(at + 1)}`;
}

/** Mask a provider account id (an opaque subject string): last 4 only. */
export function maskProviderAccountId(accountId: string): string {
    const trimmed = accountId.trim();
    if (trimmed.length <= 4) return "••••";
    return `••••${trimmed.slice(-4)}`;
}

function looksLikeEmail(value: string): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}

/**
 * Extract ONLY a masked identity from a stored provider ID token: the
 * `email` claim, masked. The token is decoded, never verified, and never
 * returned — verification is Better Auth's job during the link flow; this
 * is display derivation over a row the server already holds. Any malformed
 * token yields null and the caller falls back to the masked account id.
 */
export function maskedIdentityFromIdToken(
    idToken: string | null,
): string | null {
    if (!idToken) return null;
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    try {
        const payload = JSON.parse(
            Buffer.from(parts[1]!, "base64url").toString("utf8"),
        ) as { email?: unknown };
        return typeof payload.email === "string" &&
            looksLikeEmail(payload.email)
            ? maskEmailAddress(payload.email)
            : null;
    } catch {
        return null;
    }
}

/** The provider subject (`sub` claim) of an ID token, or null. Used only
 * to name the conflicting identity in an error message AFTER Better Auth
 * has already verified the token and refused the link — never to make an
 * authorization decision. */
export function providerSubjectFromIdToken(idToken: string): string | null {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;
    try {
        const payload = JSON.parse(
            Buffer.from(parts[1]!, "base64url").toString("utf8"),
        ) as { sub?: unknown };
        return typeof payload.sub === "string" && payload.sub.length > 0
            ? payload.sub
            : null;
    } catch {
        return null;
    }
}

export interface SignInAccountRow {
    provider_id: string;
    account_id: string;
    id_token: string | null;
    created_at: Date | string;
}

function maskedIdentityForRow(row: SignInAccountRow): string {
    return (
        maskedIdentityFromIdToken(row.id_token) ??
        (looksLikeEmail(row.account_id)
            ? maskEmailAddress(row.account_id)
            : maskProviderAccountId(row.account_id))
    );
}

function providerConfigured(
    provider: SignInProviderId,
    config: BetterAuthRuntimeConfig,
): boolean {
    return provider === "google"
        ? googleWebSignInConfigured(config)
        : appleSignInConfigured(config);
}

/** Pure inventory builder — the read model's definition, unit-testable
 * without a database. */
export function buildSignInMethods(input: {
    userEmail: string;
    accounts: SignInAccountRow[];
    config: BetterAuthRuntimeConfig;
}): SignInMethod[] {
    const methods: SignInMethod[] = [
        {
            id: "email",
            label: "Email link",
            state: "linked",
            configured: true,
            maskedIdentity: maskEmailAddress(input.userEmail),
            removable: false,
            canLink: false,
        },
    ];

    for (const provider of SIGN_IN_PROVIDERS) {
        const configured = providerConfigured(provider, input.config);
        const rows = input.accounts
            .filter((row) => row.provider_id === provider)
            .sort(
                (a, b) =>
                    new Date(a.created_at).getTime() -
                    new Date(b.created_at).getTime(),
            );
        const row = rows[0];
        if (row) {
            methods.push({
                id: provider,
                label: PROVIDER_LABELS[provider],
                state: "linked",
                configured,
                maskedIdentity: maskedIdentityForRow(row),
                removable: true,
                canLink: false,
            });
        } else {
            methods.push({
                id: provider,
                label: PROVIDER_LABELS[provider],
                state: configured ? "not_linked" : "not_configured",
                configured,
                maskedIdentity: null,
                removable: false,
                canLink: configured,
            });
        }
    }

    return methods;
}

async function readUserEmail(
    tx: DatabaseTransaction,
    userId: string,
): Promise<string> {
    const rows = await tx<Array<{ email: string }>>`
        select email from munch.users where id = ${userId}
    `;
    const email = rows[0]?.email;
    if (!email) throw new Error("Sign-in methods user not found");
    return email;
}

async function readAccounts(
    tx: DatabaseTransaction,
    userId: string,
): Promise<SignInAccountRow[]> {
    return tx<SignInAccountRow[]>`
        select provider_id, account_id, id_token, created_at
        from munch.auth_accounts
        where user_id = ${userId}
        order by created_at asc
    `;
}

export async function listSignInMethods(
    userId: string,
    config: BetterAuthRuntimeConfig,
): Promise<SignInMethod[]> {
    return withAuthDatabase(async (tx) => {
        const [email, accounts] = await Promise.all([
            readUserEmail(tx, userId),
            readAccounts(tx, userId),
        ]);
        return buildSignInMethods({ userEmail: email, accounts, config });
    });
}

/**
 * Who owns a provider identity, if anyone. Provider identity is the
 * `(provider_id, account_id)` pair — the storage layer's unique
 * constraint on that pair is the backstop that makes a silent merge
 * impossible; this lookup is what turns a collision into a clear,
 * named refusal before any write is attempted.
 */
export async function findProviderIdentityOwner(
    providerId: SignInProviderId,
    accountId: string,
): Promise<string | null> {
    return withAuthDatabase(async (tx) => {
        const rows = await tx<Array<{ user_id: string }>>`
            select user_id from munch.auth_accounts
            where provider_id = ${providerId} and account_id = ${accountId}
        `;
        return rows[0]?.user_id ?? null;
    });
}

export const SIGN_IN_METHOD_CONFLICT_MESSAGE =
    "That sign-in is already linked to a different Munch account. " +
    "It can't be moved or merged here — sign in to that other account if it is yours, " +
    "or use a different sign-in for this account.";

export function lastSignInMethodMessage(label: string): string {
    return (
        `You can't unlink ${label} — it's the only sign-in method left on this account, ` +
        "so removing it would leave you with no way to sign in. " +
        "Link another sign-in method first, then you can remove this one."
    );
}

/**
 * Guardrail (b) — NO SILENT MERGES. Asserts that a provider identity may
 * be linked to `userId`: already theirs is fine (idempotent), unclaimed
 * is fine, and owned by a DIFFERENT account refuses with a clear conflict
 * message. Nothing is written by this check.
 */
export async function assertProviderIdentityLinkable(input: {
    userId: string;
    providerId: SignInProviderId;
    accountId: string;
}): Promise<"available" | "already_linked"> {
    const owner = await findProviderIdentityOwner(
        input.providerId,
        input.accountId,
    );
    if (owner === input.userId) return "already_linked";
    if (owner !== null) {
        throw new SignInMethodError(
            "sign_in_method_conflict",
            409,
            SIGN_IN_METHOD_CONFLICT_MESSAGE,
        );
    }
    return "available";
}

/**
 * Guardrail (a) + unlink. Removes a social provider's account row(s) for
 * the user, server-side, with the last-method refusal enforced in the
 * same transaction as the delete:
 *
 * - Only social providers are removable. `email` (derived, no row) and
 *   `credential` (the reviewer login) refuse as not removable.
 * - The method total counts DISTINCT account-backed providers on the
 *   account (social rows + a credential row if present). Unlinking when
 *   the total is 1 refuses with a plain explanation and changes nothing.
 *   This deliberately follows Better Auth's `allowUnlinkingAll: false`
 *   posture over its account model rather than assuming the account
 *   email is an independently usable fallback mailbox — for a
 *   provider-created account that mailbox may be a private relay or an
 *   address the user does not read as mail.
 */
export async function unlinkSignInMethod(
    userId: string,
    providerId: string,
    config: BetterAuthRuntimeConfig,
): Promise<SignInMethod[]> {
    if (!isSignInProviderId(providerId)) {
        throw new SignInMethodError(
            "sign_in_method_not_removable",
            400,
            providerId === "email"
                ? "Email link sign-in can't be unlinked — it is tied to your account email address."
                : "That sign-in method can't be unlinked from here.",
        );
    }

    return withAuthDatabase(async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            select id from munch.auth_accounts
            where user_id = ${userId} and provider_id = ${providerId}
            for update
        `;
        if (rows.length === 0) {
            throw new SignInMethodError(
                "sign_in_method_not_linked",
                404,
                `${PROVIDER_LABELS[providerId]} is not linked to this account.`,
            );
        }

        const totals = await tx<Array<{ provider_id: string }>>`
            select distinct provider_id from munch.auth_accounts
            where user_id = ${userId}
        `;
        if (totals.length <= 1) {
            throw new SignInMethodError(
                "last_sign_in_method",
                409,
                lastSignInMethodMessage(PROVIDER_LABELS[providerId]),
            );
        }

        await tx`
            delete from munch.auth_accounts
            where user_id = ${userId} and provider_id = ${providerId}
        `;

        const [email, accounts] = await Promise.all([
            readUserEmail(tx, userId),
            readAccounts(tx, userId),
        ]);
        return buildSignInMethods({ userEmail: email, accounts, config });
    });
}
