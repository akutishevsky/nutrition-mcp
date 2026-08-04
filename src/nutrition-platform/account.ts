import { withAuthDatabase } from "../platform/database.js";

export async function deleteAllUserData(userId: string): Promise<void> {
    await withAuthDatabase(async (tx) => {
        const householdMemberships = await tx<
            Array<{ household_id: string; role: string }>
        >`
            select household_id, role
            from munch.household_memberships
            where user_id = ${userId}
              and status = 'active'
            for update
        `;
        if (
            householdMemberships.some(
                (membership) => membership.role === "owner",
            )
        ) {
            throw new Error(
                "Transfer or dissolve the household before deleting its owner account",
            );
        }

        // A former member's display name remains on the membership row so
        // household-owned recipes, plans, and grocery actions retain factual
        // attribution. The user reference is nulled by the foreign key when the
        // account row is deleted.
        if (householdMemberships.length > 0) {
            await tx`
                update munch.household_memberships
                set status = 'left', updated_at = now()
                where user_id = ${userId}
                  and status = 'active'
            `;
        }

        // Audit records preserve the fact that an operational action occurred,
        // but permanent deletion severs both actor and subject identifiers.
        await tx`
            update munch.audit_events
            set actor_id = case when actor_id = ${userId} then null else actor_id end,
                subject_user_id = case
                    when subject_user_id = ${userId} then null
                    else subject_user_id
                end
            where actor_id = ${userId}
               or subject_user_id = ${userId}
        `;

        const deleted = await tx<Array<{ id: string }>>`
            delete from munch.users
            where id = ${userId}
            returning id
        `;
        if (!deleted[0]) {
            throw new Error("Account not found");
        }
    });
}
