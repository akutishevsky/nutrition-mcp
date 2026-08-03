import { withAuthDatabase } from "../platform/database.js";

export async function deleteAllUserData(userId: string): Promise<void> {
    await withAuthDatabase(async (tx) => {
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
