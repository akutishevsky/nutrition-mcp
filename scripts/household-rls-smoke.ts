#!/usr/bin/env bun

import { createSmokeIdentity } from "./support/smoke-user.js";

const {
    acceptHouseholdInvitation,
    createHousehold,
    createHouseholdInvitation,
    getActiveHouseholdContext,
    getHouseholdSeatCounts,
    householdInvitationUsesAndroidFreeAccess,
    listHouseholdMembers,
    listPendingHouseholdInvitations,
    removeHouseholdMember,
    revokeHouseholdInvitation,
} = await import("../src/households/repository.js");
const { deleteAllUserData } =
    await import("../src/nutrition-platform/account.js");
const { closePlatformDatabase, withAuthDatabase } =
    await import("../src/platform/database.js");

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for household smoke tests");
}

async function inviteAndAccept(input: {
    ownerUserId: string;
    householdId: string;
    user: { userId: string; email: string };
    role: "member" | "viewer";
    displayName: string;
}) {
    const invitation = await createHouseholdInvitation({
        userId: input.ownerUserId,
        householdId: input.householdId,
        email: input.user.email,
        role: input.role,
    });
    return acceptHouseholdInvitation({
        userId: input.user.userId,
        token: invitation.rawToken,
        displayName: input.displayName,
    });
}

const owner = await createSmokeIdentity("household-owner");
const member = await createSmokeIdentity("household-member");
const departing = await createSmokeIdentity("household-departing");
const androidMember = await createSmokeIdentity(
    "household-android-free-member",
);
const outsider = await createSmokeIdentity("household-outsider");
const household = await createHousehold({
    userId: owner.userId,
    name: "Smoke Household",
    displayName: "Mom",
});
if (household.role !== "owner") throw new Error("Owner role was not created");

const invitation = await createHouseholdInvitation({
    userId: owner.userId,
    householdId: household.householdId,
    email: member.email,
    role: "member",
});
const accepted = await acceptHouseholdInvitation({
    userId: member.userId,
    token: invitation.rawToken,
    displayName: "Dad",
});
if (accepted.householdId !== household.householdId) {
    throw new Error("Invitation did not join the intended household");
}

const androidInvitation = await createHouseholdInvitation({
    userId: owner.userId,
    householdId: household.householdId,
    email: androidMember.email,
    role: "member",
    androidFreeAccess: true,
});
if (
    !(await householdInvitationUsesAndroidFreeAccess(
        androidInvitation.rawToken,
    ))
) {
    throw new Error("Android free invitation did not retain its access mode");
}
await acceptHouseholdInvitation({
    userId: androidMember.userId,
    token: androidInvitation.rawToken,
    displayName: "Android Member",
});
const androidSeatCounts = await getHouseholdSeatCounts(household.householdId);
if (
    androidSeatCounts.activeNonOwnerCount !== 1 ||
    androidSeatCounts.desiredSeatQuantity !== 1
) {
    throw new Error("Android free members changed billable Stripe seat counts");
}

let reused = false;
try {
    await acceptHouseholdInvitation({
        userId: member.userId,
        token: invitation.rawToken,
        displayName: "Dad",
    });
} catch {
    reused = true;
}
if (!reused) throw new Error("Household invitation was reusable");

// S6 slice 8: invitation revocation (the route + UI are new; the
// revoked_at column always existed). A pending invitation can be
// revoked by the owner only; once revoked it leaves the pending list
// and its token no longer accepts.
const revokedInvitation = await createHouseholdInvitation({
    userId: owner.userId,
    householdId: household.householdId,
    email: outsider.email,
    role: "viewer",
});
const pendingBefore = await listPendingHouseholdInvitations(
    owner.userId,
    household.householdId,
);
if (
    !pendingBefore.some(
        (entry) => entry.invitationId === revokedInvitation.invitationId,
    )
) {
    throw new Error("Pending invitation was not listed before revocation");
}
let nonOwnerRevokeBlocked = false;
try {
    await revokeHouseholdInvitation({
        userId: member.userId,
        householdId: household.householdId,
        invitationId: revokedInvitation.invitationId,
    });
} catch {
    nonOwnerRevokeBlocked = true;
}
if (!nonOwnerRevokeBlocked) {
    throw new Error("Non-owner was able to revoke a household invitation");
}
if (
    !(await revokeHouseholdInvitation({
        userId: owner.userId,
        householdId: household.householdId,
        invitationId: revokedInvitation.invitationId,
    }))
) {
    throw new Error("Owner could not revoke a pending household invitation");
}
if (
    (await revokeHouseholdInvitation({
        userId: owner.userId,
        householdId: household.householdId,
        invitationId: revokedInvitation.invitationId,
    })) !== false
) {
    throw new Error(
        "Revoking an already-revoked invitation did not report false",
    );
}
const pendingAfter = await listPendingHouseholdInvitations(
    owner.userId,
    household.householdId,
);
if (
    pendingAfter.some(
        (entry) => entry.invitationId === revokedInvitation.invitationId,
    )
) {
    throw new Error("Revoked invitation remained in the pending list");
}
let revokedAcceptBlocked = false;
try {
    await acceptHouseholdInvitation({
        userId: outsider.userId,
        token: revokedInvitation.rawToken,
        displayName: "Outsider",
    });
} catch {
    revokedAcceptBlocked = true;
}
if (!revokedAcceptBlocked) {
    throw new Error("Revoked invitation token still accepted");
}

await inviteAndAccept({
    ownerUserId: owner.userId,
    householdId: household.householdId,
    user: departing,
    role: "viewer",
    displayName: "Former Member",
});

const members = await listHouseholdMembers(owner.userId, household.householdId);
if (members.length !== 4 || members[0]?.displayName !== "Mom") {
    throw new Error("Household member listing was incorrect");
}
const finalSeatCounts = await getHouseholdSeatCounts(household.householdId);
if (
    finalSeatCounts.activeNonOwnerCount !== 2 ||
    finalSeatCounts.desiredSeatQuantity !== 2
) {
    throw new Error("Paid household members were not counted as Stripe seats");
}
if (
    (await listHouseholdMembers(outsider.userId, household.householdId))
        .length !== 0
) {
    throw new Error("Cross-household member enumeration was allowed");
}
if ((await getActiveHouseholdContext(member.userId))?.displayName !== "Dad") {
    throw new Error("Joined member could not resolve shared context");
}

let ownerDeletionBlocked = false;
try {
    await deleteAllUserData(owner.userId);
} catch (error) {
    ownerDeletionBlocked =
        error instanceof Error &&
        error.message.includes("Transfer or dissolve");
}
if (!ownerDeletionBlocked) {
    throw new Error("Household owner deletion was not explicitly blocked");
}

await deleteAllUserData(departing.userId);
const retained = await withAuthDatabase(
    async (tx) =>
        tx<
            Array<{
                user_id: string | null;
                display_name: string;
                status: string;
            }>
        >`
        select user_id, display_name, status
        from munch.household_memberships
        where household_id = ${household.householdId}
          and display_name = 'Former Member'
        limit 1
    `,
);
if (
    retained[0]?.user_id !== null ||
    retained[0]?.status !== "left" ||
    retained[0]?.display_name !== "Former Member"
) {
    throw new Error("Deleted member attribution was not retained safely");
}

const activeMembers = await listHouseholdMembers(
    owner.userId,
    household.householdId,
);
if (
    activeMembers.length !== 3 ||
    activeMembers.some((entry) => entry.displayName === "Former Member")
) {
    throw new Error("Deleted member remained in active household reads");
}
const memberRow = activeMembers.find((entry) => entry.userId === member.userId);
if (!memberRow) throw new Error("Joined member row was missing");
if (
    !(await removeHouseholdMember({
        userId: owner.userId,
        householdId: household.householdId,
        membershipId: memberRow.membershipId,
    }))
) {
    throw new Error("Owner could not remove household member");
}
if (await getActiveHouseholdContext(member.userId)) {
    throw new Error("Removed member retained household access");
}

await closePlatformDatabase();
console.log(
    "Munch household membership, invitation, deletion lifecycle, and RLS smoke test passed.",
);
