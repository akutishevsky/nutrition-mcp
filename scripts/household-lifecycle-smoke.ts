#!/usr/bin/env bun

const { consumeLoginChallenge, createLoginChallenge } =
    await import("../src/accounts/repository.js");
const {
    acceptHouseholdInvitation,
    createHousehold,
    createHouseholdInvitation,
    getActiveHouseholdContext,
    listHouseholdMembers,
} = await import("../src/households/repository.js");
const { dissolveHousehold, leaveHousehold, transferHouseholdOwnership } =
    await import("../src/households/lifecycle.js");
const { closePlatformDatabase } = await import("../src/platform/database.js");

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL is required for household lifecycle smoke tests",
    );
}

async function createUser(prefix: string) {
    const email = `${prefix}-${crypto.randomUUID()}@example.test`;
    const challenge = await createLoginChallenge(email);
    if (!(await consumeLoginChallenge(challenge.token))) {
        throw new Error("Unable to activate household lifecycle smoke user");
    }
    return { userId: challenge.userId, email };
}

const originalOwner = await createUser("lifecycle-owner");
const successor = await createUser("lifecycle-successor");
const household = await createHousehold({
    userId: originalOwner.userId,
    name: "Lifecycle Household",
    displayName: "Mom",
});
const invitation = await createHouseholdInvitation({
    userId: originalOwner.userId,
    householdId: household.householdId,
    email: successor.email,
    role: "member",
});
await acceptHouseholdInvitation({
    userId: successor.userId,
    token: invitation.rawToken,
    displayName: "Dad",
});

const members = await listHouseholdMembers(
    originalOwner.userId,
    household.householdId,
);
const successorMembership = members.find(
    (member) => member.userId === successor.userId,
);
if (!successorMembership) throw new Error("Successor membership was not found");

await transferHouseholdOwnership({
    userId: originalOwner.userId,
    householdId: household.householdId,
    targetMembershipId: successorMembership.membershipId,
});

const oldOwnerContext = await getActiveHouseholdContext(originalOwner.userId);
const successorContext = await getActiveHouseholdContext(successor.userId);
if (oldOwnerContext?.role !== "member") {
    throw new Error("Original owner was not demoted to member");
}
if (
    successorContext?.role !== "owner" ||
    successorContext.ownerUserId !== successor.userId
) {
    throw new Error("Successor did not become household owner");
}

let formerOwnerDissolveDenied = false;
try {
    await dissolveHousehold({
        userId: originalOwner.userId,
        householdId: household.householdId,
    });
} catch {
    formerOwnerDissolveDenied = true;
}
if (!formerOwnerDissolveDenied) {
    throw new Error("Former owner was allowed to dissolve the household");
}

if (!(await leaveHousehold(originalOwner.userId))) {
    throw new Error(
        "Former owner could not leave after transferring ownership",
    );
}
if (await getActiveHouseholdContext(originalOwner.userId)) {
    throw new Error(
        "Former owner retained active household access after leaving",
    );
}

if (
    !(await dissolveHousehold({
        userId: successor.userId,
        householdId: household.householdId,
    }))
) {
    throw new Error("Current owner could not dissolve the household");
}
if (await getActiveHouseholdContext(successor.userId)) {
    throw new Error("Household context remained after dissolution");
}

await closePlatformDatabase();
console.log(
    "Munch household transfer, leave, and dissolution smoke test passed.",
);
