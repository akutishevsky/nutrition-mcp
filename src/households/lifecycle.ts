import { withAuthDatabase, withUserDatabase } from "../platform/database.js";
import { getActiveHouseholdContext } from "./repository.js";

export async function transferHouseholdOwnership(input: {
    userId: string;
    householdId: string;
    targetMembershipId: string;
}): Promise<boolean> {
    return withAuthDatabase(async (tx) => {
        const rows = await tx<
            Array<{
                owner_user_id: string;
                target_user_id: string | null;
                target_role: string;
                target_status: string;
            }>
        >`
            select
                household.owner_user_id,
                target.user_id as target_user_id,
                target.role as target_role,
                target.status as target_status
            from munch.households household
            join munch.household_memberships target
              on target.household_id = household.id
             and target.id = ${input.targetMembershipId}
            where household.id = ${input.householdId}
              and household.archived_at is null
            for update of household, target
        `;
        const row = rows[0];
        if (!row) throw new Error("Household member not found");
        if (row.owner_user_id !== input.userId) {
            throw new Error("Household owner required");
        }
        if (
            !row.target_user_id ||
            row.target_user_id === input.userId ||
            row.target_status !== "active" ||
            (row.target_role !== "member" && row.target_role !== "viewer")
        ) {
            throw new Error("Target must be another active household member");
        }

        await tx`
            update munch.households
            set owner_user_id = ${row.target_user_id},
                version = version + 1,
                updated_at = now()
            where id = ${input.householdId}
        `;
        await tx`
            update munch.household_memberships
            set role = 'member', updated_at = now()
            where household_id = ${input.householdId}
              and user_id = ${input.userId}
              and role = 'owner'
              and status = 'active'
        `;
        await tx`
            update munch.household_memberships
            set role = 'owner', updated_at = now()
            where id = ${input.targetMembershipId}
              and household_id = ${input.householdId}
              and user_id = ${row.target_user_id}
              and status = 'active'
        `;
        return true;
    });
}

export async function leaveHousehold(userId: string): Promise<boolean> {
    const household = await getActiveHouseholdContext(userId);
    if (!household) return false;
    if (household.role === "owner") {
        throw new Error(
            "Household owner must transfer or dissolve the household",
        );
    }

    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            update munch.household_memberships
            set status = 'left', updated_at = now()
            where household_id = ${household.householdId}
              and user_id = ${userId}
              and status = 'active'
              and role <> 'owner'
            returning id
        `;
        return rows.length > 0;
    });
}

export async function dissolveHousehold(input: {
    userId: string;
    householdId: string;
}): Promise<boolean> {
    return withAuthDatabase(async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            select id
            from munch.households
            where id = ${input.householdId}
              and owner_user_id = ${input.userId}
              and archived_at is null
            for update
        `;
        if (!rows[0]) throw new Error("Household owner required");

        const deleted = await tx<Array<{ id: string }>>`
            delete from munch.households
            where id = ${input.householdId}
              and owner_user_id = ${input.userId}
            returning id
        `;
        return deleted.length > 0;
    });
}
