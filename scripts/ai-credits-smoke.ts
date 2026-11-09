#!/usr/bin/env bun

/**
 * DB smoke for the S1 AI credit ledger: grant/spend/refund/idempotency,
 * the exhausted cap, household pool spending, and RLS isolation of ledger
 * rows. Runs in the CI database job.
 */
import { createSmokeIdentity } from "./support/smoke-user.js";

const {
    reserveAiCredits,
    refundAiCredits,
    getAiCreditUsage,
    runWithAiCredits,
} = await import("../src/billing/ai-credits.js");
const {
    createHousehold,
    createHouseholdInvitation,
    acceptHouseholdInvitation,
} = await import("../src/households/repository.js");
const { deleteAllUserData } =
    await import("../src/nutrition-platform/account.js");
const { closePlatformDatabase, withUserDatabase } =
    await import("../src/platform/database.js");

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for AI credits smoke tests");
}

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(`ai-credits smoke: ${message}`);
}

const userA = await createSmokeIdentity("credits-user-a");
const userB = await createSmokeIdentity("credits-user-b");
const member = await createSmokeIdentity("credits-member");

try {
    // Grant + spend + derived balance (free pool = 10).
    const reserved = await reserveAiCredits({
        userId: userA.userId,
        task: "meal_ideas",
        idempotencyKey: "smoke-meal-ideas-1",
    });
    assert(reserved.status === "reserved", "first reserve succeeds");
    let usage = await getAiCreditUsage(userA.userId);
    assert(usage?.granted === 10, `free grant is 10, got ${usage?.granted}`);
    assert(usage?.spent === 3, `meal ideas spend is 3, got ${usage?.spent}`);
    assert(usage?.balance === 7, `balance is 7, got ${usage?.balance}`);

    // Idempotency: replaying the key does not charge again.
    const replay = await reserveAiCredits({
        userId: userA.userId,
        task: "meal_ideas",
        idempotencyKey: "smoke-meal-ideas-1",
    });
    assert(replay.status === "reserved", "replay reserves");
    assert(
        replay.status === "reserved" && replay.reservation.replayed,
        "replay is flagged replayed",
    );
    usage = await getAiCreditUsage(userA.userId);
    assert(usage?.balance === 7, "replay did not double-charge");

    // Refund on failure restores the balance exactly once.
    await refundAiCredits(
        reserved.status === "reserved"
            ? reserved.reservation
            : (() => {
                  throw new Error("unreachable");
              })(),
    );
    usage = await getAiCreditUsage(userA.userId);
    assert(usage?.balance === 10, `refund restores 10, got ${usage?.balance}`);
    assert(usage?.refunded === 3, "refund is recorded in the ledger");

    // runWithAiCredits refunds when the model call throws.
    await runWithAiCredits({
        userId: userA.userId,
        task: "recipe_import",
        idempotencyKey: "smoke-import-fail",
        run: async () => {
            throw new Error("simulated outage");
        },
    }).catch(() => {});
    usage = await getAiCreditUsage(userA.userId);
    assert(usage?.balance === 10, "failed import was refunded");

    // Cap: drain the pool, then the next reserve is exhausted, no charge.
    await reserveAiCredits({
        userId: userA.userId,
        task: "recipe_import",
        idempotencyKey: "smoke-drain-1",
    });
    await reserveAiCredits({
        userId: userA.userId,
        task: "recipe_import",
        idempotencyKey: "smoke-drain-2",
    });
    const blocked = await reserveAiCredits({
        userId: userA.userId,
        task: "receipt_scan",
        idempotencyKey: "smoke-blocked",
    });
    assert(blocked.status === "exhausted", "drained pool is exhausted");
    usage = await getAiCreditUsage(userA.userId);
    assert(usage?.balance === 0, "exhausted attempt charged nothing");

    // Household: a member spends from the owner's pool.
    const household = await createHousehold({
        userId: userB.userId,
        name: "Credits Smoke Household",
        displayName: "Owner",
    });
    const invitation = await createHouseholdInvitation({
        userId: userB.userId,
        householdId: household.householdId,
        email: member.email,
        role: "member",
    });
    await acceptHouseholdInvitation({
        userId: member.userId,
        token: invitation.rawToken,
        displayName: "Member",
    });
    const memberSpend = await reserveAiCredits({
        userId: member.userId,
        task: "receipt_scan",
        idempotencyKey: "smoke-member-scan",
    });
    assert(memberSpend.status === "reserved", "member reserve succeeds");
    assert(
        memberSpend.status === "reserved" &&
            memberSpend.reservation.poolUserId === userB.userId,
        "member spend draws the owner pool",
    );
    const ownerUsage = await getAiCreditUsage(userB.userId);
    assert(ownerUsage?.balance === 8, "owner pool reflects the member spend");

    // RLS isolation: user A cannot read user B's ledger rows as munch_app,
    // and user B's pool is visible to its owner.
    const aSeesB = await withUserDatabase(userA.userId, async (tx) => {
        const rows = await tx<Array<{ count: number }>>`
            select count(*)::int as count from munch.ai_credit_ledger
            where pool_user_id = ${userB.userId}
        `;
        return Number(rows[0]?.count ?? -1);
    });
    assert(aSeesB === 0, `RLS leaked pool rows across users (saw ${aSeesB})`);
    const bSeesOwn = await withUserDatabase(userB.userId, async (tx) => {
        const rows = await tx<Array<{ count: number }>>`
            select count(*)::int as count from munch.ai_credit_ledger
            where pool_user_id = ${userB.userId}
        `;
        return Number(rows[0]?.count ?? 0);
    });
    assert(bSeesOwn >= 2, "owner can read their own ledger rows under RLS");

    console.log(
        "ai-credits smoke: grant/spend/refund/idempotency/cap/household-pool/RLS all passed",
    );
} finally {
    for (const identity of [userA, userB, member]) {
        await deleteAllUserData(identity.userId).catch(() => {});
    }
    await closePlatformDatabase();
}
