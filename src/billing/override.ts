import { withBillingDatabase } from "../platform/database.js";

export const PREMIUM_OVERRIDE_FEATURE = "premium_access";

export async function hasActivePremiumOverride(
    userId: string,
    now = new Date(),
): Promise<boolean> {
    return withBillingDatabase(async (tx) => {
        const rows = await tx<Array<{ active: boolean }>>`
            select active
            from munch.entitlements
            where user_id = ${userId}
              and feature_key = ${PREMIUM_OVERRIDE_FEATURE}
              and active = true
              and (expires_at is null or expires_at > ${now})
            limit 1
        `;
        return rows[0]?.active === true;
    });
}

export async function grantPremiumOverride(input: {
    userId: string;
    expiresAt: Date;
    source: "reviewer" | "support";
    reason: string;
}): Promise<void> {
    const reason = input.reason.trim();
    if (!reason || reason.length > 200) {
        throw new Error("Premium override reason must be 1 to 200 characters");
    }
    if (input.expiresAt.getTime() <= Date.now()) {
        throw new Error("Premium override must expire in the future");
    }

    await withBillingDatabase(async (tx) => {
        await tx`
            insert into munch.entitlements (
                user_id,
                feature_key,
                active,
                expires_at,
                source,
                updated_at
            ) values (
                ${input.userId},
                ${PREMIUM_OVERRIDE_FEATURE},
                true,
                ${input.expiresAt},
                ${input.source},
                now()
            )
            on conflict (user_id, feature_key) do update
            set active = true,
                expires_at = excluded.expires_at,
                source = excluded.source,
                updated_at = now()
        `;
        await tx`
            insert into munch.audit_events (
                actor_type,
                subject_user_id,
                action,
                outcome,
                metadata
            ) values (
                'system',
                ${input.userId},
                'premium_override_granted',
                'success',
                ${JSON.stringify({
                    source: input.source,
                    reason,
                    expiresAt: input.expiresAt.toISOString(),
                })}::jsonb
            )
        `;
    });
}

export async function revokePremiumOverride(input: {
    userId: string;
    reason: string;
}): Promise<boolean> {
    const reason = input.reason.trim();
    if (!reason || reason.length > 200) {
        throw new Error("Premium override reason must be 1 to 200 characters");
    }

    return withBillingDatabase(async (tx) => {
        const rows = await tx<Array<{ user_id: string }>>`
            update munch.entitlements
            set active = false,
                updated_at = now()
            where user_id = ${input.userId}
              and feature_key = ${PREMIUM_OVERRIDE_FEATURE}
              and active = true
            returning user_id
        `;
        if (!rows[0]) return false;
        await tx`
            insert into munch.audit_events (
                actor_type,
                subject_user_id,
                action,
                outcome,
                metadata
            ) values (
                'system',
                ${input.userId},
                'premium_override_revoked',
                'success',
                ${JSON.stringify({ reason })}::jsonb
            )
        `;
        return true;
    });
}
