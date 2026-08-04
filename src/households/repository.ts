import { createHash, randomBytes, randomUUID } from "node:crypto";
import { withAuthDatabase, withUserDatabase } from "../platform/database.js";

export type HouseholdRole = "owner" | "member" | "viewer";

export interface HouseholdMembershipContext {
    householdId: string;
    householdName: string;
    ownerUserId: string;
    role: HouseholdRole;
    displayName: string;
    version: number;
}

export interface HouseholdMember {
    membershipId: string;
    userId: string;
    displayName: string;
    role: HouseholdRole;
    joinedAt: string;
}

export interface HouseholdInvitationResult {
    invitationId: string;
    rawToken: string;
    expiresAt: string;
}

function tokenHash(token: string): Buffer {
    return createHash("sha256").update(token, "utf8").digest();
}

function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

function cleanDisplayName(value: string): string {
    const name = value.trim();
    if (!name || name.length > 80) {
        throw new Error("Household display name must be 1 to 80 characters");
    }
    return name;
}

export async function createHousehold(input: {
    userId: string;
    name: string;
    displayName: string;
}): Promise<HouseholdMembershipContext> {
    const name = input.name.trim();
    if (!name || name.length > 120) {
        throw new Error("Household name must be 1 to 120 characters");
    }
    const displayName = cleanDisplayName(input.displayName);
    const householdId = randomUUID();

    return withUserDatabase(input.userId, async (tx) => {
        const existing = await tx<Array<{ id: string }>>`
            select id from munch.household_memberships
            where user_id = ${input.userId} and status = 'active'
            limit 1
        `;
        if (existing[0]) throw new Error("User already belongs to a household");

        // Do not use INSERT ... RETURNING here. PostgreSQL also applies the
        // household SELECT policy to RETURNING, but owner visibility depends on
        // the membership inserted in the next statement. Generate the UUID
        // before the transaction so both rows can be created without a circular
        // RLS dependency.
        await tx`
            insert into munch.households (id, name, owner_user_id)
            values (${householdId}, ${name}, ${input.userId})
        `;
        await tx`
            insert into munch.household_memberships (
                household_id, user_id, display_name, role, status
            ) values (
                ${householdId}, ${input.userId}, ${displayName}, 'owner', 'active'
            )
        `;

        return {
            householdId,
            householdName: name,
            ownerUserId: input.userId,
            role: "owner",
            displayName,
            version: 1,
        };
    });
}

export async function getActiveHouseholdContext(
    userId: string,
): Promise<HouseholdMembershipContext | null> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<
            Array<{
                household_id: string;
                household_name: string;
                owner_user_id: string;
                role: HouseholdRole;
                display_name: string;
                version: number;
            }>
        >`
            select
                household.id as household_id,
                household.name as household_name,
                household.owner_user_id,
                membership.role,
                membership.display_name,
                household.version
            from munch.household_memberships membership
            join munch.households household on household.id = membership.household_id
            where membership.user_id = ${userId}
              and membership.status = 'active'
              and household.archived_at is null
            limit 1
        `;
        const row = rows[0];
        return row
            ? {
                  householdId: row.household_id,
                  householdName: row.household_name,
                  ownerUserId: row.owner_user_id,
                  role: row.role,
                  displayName: row.display_name,
                  version: Number(row.version),
              }
            : null;
    });
}

export async function listHouseholdMembers(
    userId: string,
    householdId: string,
): Promise<HouseholdMember[]> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<
            Array<{
                membership_id: string;
                user_id: string;
                display_name: string;
                role: HouseholdRole;
                joined_at: Date;
            }>
        >`
            select
                id as membership_id,
                user_id,
                display_name,
                role,
                joined_at
            from munch.household_memberships
            where household_id = ${householdId}
              and status = 'active'
            order by case role when 'owner' then 0 when 'member' then 1 else 2 end,
                     joined_at
        `;
        return rows.map((row) => ({
            membershipId: row.membership_id,
            userId: row.user_id,
            displayName: row.display_name,
            role: row.role,
            joinedAt: new Date(row.joined_at).toISOString(),
        }));
    });
}

export async function createHouseholdInvitation(input: {
    userId: string;
    householdId: string;
    email: string;
    role: Exclude<HouseholdRole, "owner">;
    ttlHours?: number;
}): Promise<HouseholdInvitationResult> {
    const email = normalizeEmail(input.email);
    if (email.length < 3 || email.length > 320 || !email.includes("@")) {
        throw new Error("Invitation email is invalid");
    }
    if (input.role !== "member" && input.role !== "viewer") {
        throw new Error("Invitation role is invalid");
    }
    const ttlHours = input.ttlHours ?? 72;
    if (!Number.isInteger(ttlHours) || ttlHours < 1 || ttlHours > 168) {
        throw new Error("Invitation expiry must be between 1 and 168 hours");
    }
    const rawToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    return withUserDatabase(input.userId, async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            insert into munch.household_invitations (
                household_id,
                email,
                role,
                token_hash,
                expires_at,
                invited_by_user_id
            ) values (
                ${input.householdId},
                ${email},
                ${input.role},
                ${tokenHash(rawToken)},
                ${expiresAt},
                ${input.userId}
            )
            on conflict (household_id, email)
                where accepted_at is null and revoked_at is null
            do update set
                role = excluded.role,
                token_hash = excluded.token_hash,
                expires_at = excluded.expires_at,
                invited_by_user_id = excluded.invited_by_user_id,
                created_at = now()
            returning id
        `;
        if (!rows[0]) throw new Error("Invitation creation returned no row");
        return {
            invitationId: rows[0].id,
            rawToken,
            expiresAt: expiresAt.toISOString(),
        };
    });
}

export async function acceptHouseholdInvitation(input: {
    userId: string;
    token: string;
    displayName: string;
}): Promise<HouseholdMembershipContext> {
    const displayName = cleanDisplayName(input.displayName);
    const hash = tokenHash(input.token);

    return withAuthDatabase(async (tx) => {
        const rows = await tx<
            Array<{
                invitation_id: string;
                household_id: string;
                household_name: string;
                owner_user_id: string;
                role: Exclude<HouseholdRole, "owner">;
                user_email: string;
                invitation_email: string;
                version: number;
            }>
        >`
            select
                invitation.id as invitation_id,
                invitation.household_id,
                household.name as household_name,
                household.owner_user_id,
                invitation.role,
                users.email as user_email,
                invitation.email as invitation_email,
                household.version
            from munch.household_invitations invitation
            join munch.households household on household.id = invitation.household_id
            join munch.users users on users.id = ${input.userId}
            where invitation.token_hash = ${hash}
              and invitation.accepted_at is null
              and invitation.revoked_at is null
              and invitation.expires_at > now()
              and household.archived_at is null
            for update of invitation
        `;
        const invitation = rows[0];
        if (!invitation) throw new Error("Invitation is invalid or expired");
        if (invitation.user_email !== invitation.invitation_email) {
            throw new Error("Invitation belongs to a different email address");
        }

        const existing = await tx<Array<{ id: string }>>`
            select id from munch.household_memberships
            where user_id = ${input.userId} and status = 'active'
            limit 1
        `;
        if (existing[0]) throw new Error("User already belongs to a household");

        await tx`
            insert into munch.household_memberships (
                household_id, user_id, display_name, role, status
            ) values (
                ${invitation.household_id},
                ${input.userId},
                ${displayName},
                ${invitation.role},
                'active'
            )
        `;
        await tx`
            update munch.household_invitations
            set accepted_at = now()
            where id = ${invitation.invitation_id}
        `;

        return {
            householdId: invitation.household_id,
            householdName: invitation.household_name,
            ownerUserId: invitation.owner_user_id,
            role: invitation.role,
            displayName,
            version: Number(invitation.version),
        };
    });
}

export async function updateHouseholdMemberRole(input: {
    userId: string;
    householdId: string;
    membershipId: string;
    role: Exclude<HouseholdRole, "owner">;
}): Promise<boolean> {
    return withUserDatabase(input.userId, async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            update munch.household_memberships
            set role = ${input.role}, updated_at = now()
            where id = ${input.membershipId}
              and household_id = ${input.householdId}
              and role <> 'owner'
              and status = 'active'
            returning id
        `;
        return rows.length > 0;
    });
}

export async function removeHouseholdMember(input: {
    userId: string;
    householdId: string;
    membershipId: string;
}): Promise<boolean> {
    return withUserDatabase(input.userId, async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            update munch.household_memberships
            set status = 'removed', updated_at = now()
            where id = ${input.membershipId}
              and household_id = ${input.householdId}
              and role <> 'owner'
              and status = 'active'
            returning id
        `;
        return rows.length > 0;
    });
}
