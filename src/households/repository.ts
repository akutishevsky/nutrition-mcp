import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
    withAuthDatabase,
    withUserDatabase,
    type DatabaseTransaction,
} from "../platform/database.js";
import { PRODUCT_CONFIG } from "../product-config.js";

export type HouseholdRole = "owner" | "member" | "viewer";

export interface HouseholdMembershipContext {
    householdId: string;
    householdName: string;
    ownerUserId: string;
    role: HouseholdRole;
    displayName: string;
    version: number;
    androidFreeAccess: boolean;
}

export interface HouseholdMember {
    membershipId: string;
    userId: string;
    displayName: string;
    role: HouseholdRole;
    joinedAt: string;
    androidFreeAccess: boolean;
}

export interface HouseholdInvitationResult {
    invitationId: string;
    rawToken: string;
    expiresAt: string;
}

export interface PendingHouseholdInvitation {
    invitationId: string;
    email: string;
    role: Exclude<HouseholdRole, "owner">;
    createdAt: string;
    expiresAt: string;
    androidFreeAccess: boolean;
}

export interface HouseholdSeatReservation {
    invitationId: string;
    householdId: string;
    ownerUserId: string;
    targetSeatQuantity: number;
}

export interface HouseholdSeatReleaseReservation {
    membershipId: string;
    householdId: string;
    ownerUserId: string;
    targetSeatQuantity: number;
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

async function desiredSeatQuantityTx(
    tx: DatabaseTransaction,
    householdId: string,
): Promise<number> {
    const [activeRows, inviteRows, releaseRows] = await Promise.all([
        tx<Array<{ count: number }>>`
            select count(*)::int as count
            from munch.household_memberships
            where household_id = ${householdId}
              and status = 'active'
              and role <> 'owner'
              and user_id is not null
              and android_free_access = false
        `,
        tx<Array<{ count: number }>>`
            select count(*)::int as count
            from munch.household_invitations
            where household_id = ${householdId}
              and seat_reserved_at is not null
              and android_free_access = false
              and accepted_at is null
              and revoked_at is null
              and expires_at > now()
        `,
        tx<Array<{ count: number }>>`
            select count(*)::int as count
            from munch.household_memberships
            where household_id = ${householdId}
              and status = 'active'
              and role <> 'owner'
              and user_id is not null
              and android_free_access = false
              and seat_release_reserved_at is not null
        `,
    ]);
    const desired =
        Number(activeRows[0]?.count ?? 0) +
        Number(inviteRows[0]?.count ?? 0) -
        Number(releaseRows[0]?.count ?? 0);
    if (!Number.isInteger(desired) || desired < 0 || desired > 5) {
        throw new Error("Household paid seat count is invalid");
    }
    return desired;
}

export async function getHouseholdSeatCounts(householdId: string): Promise<{
    activeNonOwnerCount: number;
    desiredSeatQuantity: number;
}> {
    return withAuthDatabase(async (tx) => {
        const activeRows = await tx<Array<{ count: number }>>`
            select count(*)::int as count
            from munch.household_memberships
            where household_id = ${householdId}
              and status = 'active'
              and role <> 'owner'
              and user_id is not null
              and android_free_access = false
        `;
        return {
            activeNonOwnerCount: Number(activeRows[0]?.count ?? 0),
            desiredSeatQuantity: await desiredSeatQuantityTx(tx, householdId),
        };
    });
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
            androidFreeAccess: false,
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
                android_free_access: boolean;
            }>
        >`
            select
                household.id as household_id,
                household.name as household_name,
                household.owner_user_id,
                membership.role,
                membership.display_name,
                household.version,
                membership.android_free_access
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
                  androidFreeAccess: row.android_free_access,
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
                android_free_access: boolean;
            }>
        >`
            select
                id as membership_id,
                user_id,
                display_name,
                role,
                joined_at,
                android_free_access
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
            androidFreeAccess: row.android_free_access,
        }));
    });
}

export async function listPendingHouseholdInvitations(
    userId: string,
    householdId: string,
): Promise<PendingHouseholdInvitation[]> {
    return withUserDatabase(userId, async (tx) => {
        const ownerRows = await tx<Array<{ id: string }>>`
            select id
            from munch.household_memberships
            where household_id = ${householdId}
              and user_id = ${userId}
              and status = 'active'
              and role = 'owner'
            limit 1
        `;
        if (!ownerRows[0]) throw new Error("Household owner required");

        const rows = await tx<
            Array<{
                invitation_id: string;
                email: string;
                role: Exclude<HouseholdRole, "owner">;
                created_at: Date;
                expires_at: Date;
                android_free_access: boolean;
            }>
        >`
            select
                id as invitation_id,
                email,
                role,
                created_at,
                expires_at,
                android_free_access
            from munch.household_invitations
            where household_id = ${householdId}
              and accepted_at is null
              and revoked_at is null
              and expires_at > now()
            order by created_at desc
        `;
        return rows.map((row) => ({
            invitationId: row.invitation_id,
            email: row.email,
            role: row.role,
            createdAt: new Date(row.created_at).toISOString(),
            expiresAt: new Date(row.expires_at).toISOString(),
            androidFreeAccess: row.android_free_access,
        }));
    });
}

export async function revokeHouseholdInvitation(input: {
    userId: string;
    householdId: string;
    invitationId: string;
}): Promise<boolean> {
    return withUserDatabase(input.userId, async (tx) => {
        const ownerRows = await tx<Array<{ id: string }>>`
            select id
            from munch.household_memberships
            where household_id = ${input.householdId}
              and user_id = ${input.userId}
              and status = 'active'
              and role = 'owner'
            limit 1
        `;
        if (!ownerRows[0]) throw new Error("Household owner required");

        const rows = await tx<Array<{ id: string }>>`
            update munch.household_invitations
            set revoked_at = now()
            where id = ${input.invitationId}
              and household_id = ${input.householdId}
              and accepted_at is null
              and revoked_at is null
            returning id
        `;
        return Boolean(rows[0]);
    });
}

export async function createHouseholdInvitation(input: {
    userId: string;
    householdId: string;
    email: string;
    role: Exclude<HouseholdRole, "owner">;
    androidFreeAccess?: boolean;
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
        const householdRows = await tx<Array<{ id: string }>>`
            select household.id
            from munch.households household
            join munch.household_memberships membership
              on membership.household_id = household.id
            where household.id = ${input.householdId}
              and household.archived_at is null
              and membership.user_id = ${input.userId}
              and membership.role = 'owner'
              and membership.status = 'active'
            for update of household
        `;
        if (!householdRows[0]) throw new Error("Household owner required");
        const capacityRows = await tx<Array<{ count: number }>>`
            select (
                (select count(*) from munch.household_memberships
                 where household_id = ${input.householdId}
                   and status = 'active'
                   and user_id is not null)
                +
                (select count(*) from munch.household_invitations
                 where household_id = ${input.householdId}
                   and email <> ${email}
                   and accepted_at is null
                   and revoked_at is null
                   and expires_at > now())
            )::int as count
        `;
        if (
            Number(capacityRows[0]?.count ?? 0) >=
            PRODUCT_CONFIG.householdMemberLimit
        ) {
            throw new Error("Household member limit reached");
        }
        const rows = await tx<Array<{ id: string }>>`
            insert into munch.household_invitations (
                household_id,
                email,
                role,
                token_hash,
                expires_at,
                invited_by_user_id,
                android_free_access
            ) values (
                ${input.householdId},
                ${email},
                ${input.role},
                ${tokenHash(rawToken)},
                ${expiresAt},
                ${input.userId},
                ${input.androidFreeAccess === true}
            )
            on conflict (household_id, email)
                where accepted_at is null and revoked_at is null
            do update set
                role = excluded.role,
                token_hash = excluded.token_hash,
                expires_at = excluded.expires_at,
                invited_by_user_id = excluded.invited_by_user_id,
                created_at = now(),
                seat_reserved_at = null,
                android_free_access = excluded.android_free_access
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

export async function reserveHouseholdInvitationSeat(input: {
    userId: string;
    token: string;
}): Promise<HouseholdSeatReservation> {
    const hash = tokenHash(input.token);
    return withAuthDatabase(async (tx) => {
        const rows = await tx<
            Array<{
                invitation_id: string;
                household_id: string;
                owner_user_id: string;
                user_email: string;
                invitation_email: string;
                seat_reserved_at: Date | null;
                android_free_access: boolean;
            }>
        >`
            select
                invitation.id as invitation_id,
                invitation.household_id,
                household.owner_user_id,
                users.email as user_email,
                invitation.email as invitation_email,
                invitation.seat_reserved_at,
                invitation.android_free_access
            from munch.household_invitations invitation
            join munch.households household on household.id = invitation.household_id
            join munch.users users on users.id = ${input.userId}
            where invitation.token_hash = ${hash}
              and invitation.accepted_at is null
              and invitation.revoked_at is null
              and invitation.expires_at > now()
              and household.archived_at is null
            for update of invitation, household
        `;
        const invitation = rows[0];
        if (!invitation) throw new Error("Invitation is invalid or expired");
        if (invitation.user_email !== invitation.invitation_email) {
            throw new Error("Invitation belongs to a different email address");
        }
        if (invitation.android_free_access) {
            throw new Error(
                "Free Android invitation does not reserve a paid seat",
            );
        }
        const existing = await tx<Array<{ id: string }>>`
            select id from munch.household_memberships
            where user_id = ${input.userId} and status = 'active'
            limit 1
        `;
        if (existing[0]) throw new Error("User already belongs to a household");

        if (!invitation.seat_reserved_at) {
            await tx`
                update munch.household_invitations
                set seat_reserved_at = now()
                where id = ${invitation.invitation_id}
            `;
        }
        return {
            invitationId: invitation.invitation_id,
            householdId: invitation.household_id,
            ownerUserId: invitation.owner_user_id,
            targetSeatQuantity: await desiredSeatQuantityTx(
                tx,
                invitation.household_id,
            ),
        };
    });
}

export async function householdInvitationUsesAndroidFreeAccess(
    token: string,
): Promise<boolean | null> {
    const hash = tokenHash(token);
    return withAuthDatabase(async (tx) => {
        const rows = await tx<Array<{ android_free_access: boolean }>>`
            select invitation.android_free_access
            from munch.household_invitations invitation
            join munch.households household
              on household.id = invitation.household_id
            where invitation.token_hash = ${hash}
              and invitation.accepted_at is null
              and invitation.revoked_at is null
              and invitation.expires_at > now()
              and household.archived_at is null
            limit 1
        `;
        return rows[0]?.android_free_access ?? null;
    });
}

export async function clearHouseholdInvitationSeatReservation(
    invitationId: string,
): Promise<void> {
    await withAuthDatabase(async (tx) => {
        await tx`
            update munch.household_invitations
            set seat_reserved_at = null
            where id = ${invitationId}
              and accepted_at is null
        `;
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
                android_free_access: boolean;
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
                invitation.android_free_access,
                household.version
            from munch.household_invitations invitation
            join munch.households household on household.id = invitation.household_id
            join munch.users users on users.id = ${input.userId}
            where invitation.token_hash = ${hash}
              and invitation.accepted_at is null
              and invitation.revoked_at is null
              and invitation.expires_at > now()
              and household.archived_at is null
            for update of invitation, household
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

        const capacityRows = await tx<Array<{ count: number }>>`
            select (
                (select count(*) from munch.household_memberships
                 where household_id = ${invitation.household_id}
                   and status = 'active'
                   and user_id is not null)
                +
                (select count(*) from munch.household_invitations
                 where household_id = ${invitation.household_id}
                   and accepted_at is null
                   and revoked_at is null
                   and expires_at > now())
            )::int as count
        `;
        if (
            Number(capacityRows[0]?.count ?? 0) >
            PRODUCT_CONFIG.householdMemberLimit
        ) {
            throw new Error("Household member limit reached");
        }

        await tx`
            insert into munch.household_memberships (
                household_id, user_id, display_name, role, status,
                android_free_access
            ) values (
                ${invitation.household_id},
                ${input.userId},
                ${displayName},
                ${invitation.role},
                'active',
                ${invitation.android_free_access}
            )
        `;
        await tx`
            update munch.household_invitations
            set accepted_at = now(), seat_reserved_at = null
            where id = ${invitation.invitation_id}
        `;

        return {
            householdId: invitation.household_id,
            householdName: invitation.household_name,
            ownerUserId: invitation.owner_user_id,
            role: invitation.role,
            displayName,
            version: Number(invitation.version),
            androidFreeAccess: invitation.android_free_access,
        };
    });
}

export async function reserveHouseholdSeatRelease(input: {
    requesterUserId: string;
    householdId: string;
    membershipId?: string;
    selfLeave?: boolean;
}): Promise<HouseholdSeatReleaseReservation> {
    return withAuthDatabase(async (tx) => {
        const householdRows = await tx<Array<{ owner_user_id: string }>>`
            select owner_user_id
            from munch.households
            where id = ${input.householdId}
              and archived_at is null
            for update
        `;
        const household = householdRows[0];
        if (!household) throw new Error("Household not found");

        const members = input.selfLeave
            ? await tx<
                  Array<{
                      id: string;
                      user_id: string;
                      role: HouseholdRole;
                  }>
              >`
                  select id, user_id, role
                  from munch.household_memberships
                  where household_id = ${input.householdId}
                    and user_id = ${input.requesterUserId}
                    and status = 'active'
                    and role <> 'owner'
                  for update
              `
            : await tx<
                  Array<{
                      id: string;
                      user_id: string;
                      role: HouseholdRole;
                  }>
              >`
                  select id, user_id, role
                  from munch.household_memberships
                  where household_id = ${input.householdId}
                    and id = ${input.membershipId ?? ""}
                    and status = 'active'
                    and role <> 'owner'
                  for update
              `;
        const member = members[0];
        if (!member) throw new Error("Household member not found");
        if (input.selfLeave) {
            if (member.user_id !== input.requesterUserId) {
                throw new Error("Household member required");
            }
        } else if (household.owner_user_id !== input.requesterUserId) {
            throw new Error("Household owner required");
        }

        await tx`
            update munch.household_memberships
            set seat_release_reserved_at = coalesce(seat_release_reserved_at, now())
            where id = ${member.id}
        `;
        return {
            membershipId: member.id,
            householdId: input.householdId,
            ownerUserId: household.owner_user_id,
            targetSeatQuantity: await desiredSeatQuantityTx(
                tx,
                input.householdId,
            ),
        };
    });
}

export async function clearHouseholdSeatReleaseReservation(
    membershipId: string,
): Promise<void> {
    await withAuthDatabase(async (tx) => {
        await tx`
            update munch.household_memberships
            set seat_release_reserved_at = null
            where id = ${membershipId}
              and status = 'active'
        `;
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
            set status = 'removed',
                seat_release_reserved_at = null,
                updated_at = now()
            where id = ${input.membershipId}
              and household_id = ${input.householdId}
              and role <> 'owner'
              and status = 'active'
            returning id
        `;
        return rows.length > 0;
    });
}
