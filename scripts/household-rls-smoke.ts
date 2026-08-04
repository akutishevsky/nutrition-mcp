#!/usr/bin/env bun

const { consumeLoginChallenge, createLoginChallenge } =
    await import("../src/accounts/repository.js");
const {
    acceptHouseholdInvitation,
    createHousehold,
    createHouseholdInvitation,
    getActiveHouseholdContext,
    listHouseholdMembers,
    removeHouseholdMember,
} = await import("../src/households/repository.js");
const { deleteAllUserData } =
    await import("../src/nutrition-platform/account.js");
const { closePlatformDatabase, withAuthDatabase } =
    await import("../src/platform/database.js");

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for household smoke tests");
}

async function createUser(prefix: string) {
    const email = `${prefix}-${crypto.randomUUID()}@example.test`;
    const challenge = await createLoginChallenge(email);
    if (!(await consumeLoginChallenge(challenge.token))) {
        throw new Error("Unable to activate household smoke user");
    }
    return { userId: challenge.userId, email };
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

const owner = await createUser("household-owner");
const member = await createUser("household-member");
const departing = await createUser("household-departing");
const outsider = await createUser("household-outsider");
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

await inviteAndAccept({
    ownerUserId: owner.userId,
    householdId: household.householdId,
    user: departing,
    role: "viewer",
    displayName: "Former Member",
});

const members = await listHouseholdMembers(owner.userId, household.householdId);
if (members.length !== 3 || members[0]?.displayName !== "Mom") {
    throw new Error("Household member listing was incorrect");
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
    activeMembers.length !== 2 ||
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
