import { afterEach, describe, expect, test } from "bun:test";
import {
    AI_CREDIT_MONTHLY_GRANTS,
    AI_TASK_CREDIT_COSTS,
    InMemoryAiCreditStore,
    _setAiCreditMeterDepsForTests,
    aiCreditBalanceFromEntries,
    getAiCreditUsage,
    reserveAiCredits,
    runWithAiCredits,
} from "./ai-credits.js";

const OWNER = "11111111-1111-4111-8111-111111111111";
const MEMBER = "22222222-2222-4222-8222-222222222222";

function install(
    store: InMemoryAiCreditStore,
    tier: "free" | "premium" = "free",
    poolUserId: string = OWNER,
) {
    _setAiCreditMeterDepsForTests({
        store,
        resolvePool: async () => ({ poolUserId, tier }),
        log: () => {},
    });
}

afterEach(() => _setAiCreditMeterDepsForTests(null));

describe("AI credit ledger", () => {
    test("cost table and grants match brief §2", () => {
        expect(AI_TASK_CREDIT_COSTS).toEqual({
            receipt_scan: 2,
            pantry_photo_scan: 2,
            meal_photo_log: 4,
            meal_ideas: 3,
            recipe_import: 5,
            plan_generation: 4,
            weekly_guidance: 2,
            cook_nl_fallback: 1,
        });
        expect(AI_CREDIT_MONTHLY_GRANTS).toEqual({ free: 10, premium: 600 });
    });

    test("balance is derived from append-only entries", () => {
        expect(
            aiCreditBalanceFromEntries([
                { kind: "grant", amount: 10 },
                { kind: "spend", amount: 3 },
                { kind: "refund", amount: 3 },
                { kind: "spend", amount: 2 },
            ]),
        ).toBe(8);
    });

    test("monthly grant is issued once and spend draws it down", async () => {
        const store = new InMemoryAiCreditStore();
        install(store);
        const first = await reserveAiCredits({
            userId: OWNER,
            task: "meal_ideas",
            idempotencyKey: "a",
        });
        expect(first.status).toBe("reserved");
        const usage = await getAiCreditUsage(OWNER);
        expect(usage?.granted).toBe(10);
        expect(usage?.spent).toBe(3);
        expect(usage?.balance).toBe(7);
        expect(
            store.entries.filter((entry) => entry.kind === "grant"),
        ).toHaveLength(1);
    });

    test("premium pool grants 600", async () => {
        const store = new InMemoryAiCreditStore();
        install(store, "premium");
        const usage = await getAiCreditUsage(OWNER);
        expect(usage?.granted).toBe(600);
        expect(usage?.balance).toBe(600);
    });

    test("household members spend from the owner's pool", async () => {
        const store = new InMemoryAiCreditStore();
        // Pool resolution maps the member to the owner's pool.
        install(store, "free", OWNER);
        const result = await runWithAiCredits({
            userId: MEMBER,
            task: "receipt_scan",
            idempotencyKey: "member-scan",
            run: async () => "ok",
        });
        expect(result.status).toBe("ok");
        const spend = store.entries.find((entry) => entry.kind === "spend");
        expect(spend?.poolUserId).toBe(OWNER);
        expect(spend?.actorUserId).toBe(MEMBER);
        expect((await getAiCreditUsage(OWNER))?.balance).toBe(8);
    });

    test("refund on failure: a failed model call costs nothing", async () => {
        const store = new InMemoryAiCreditStore();
        install(store);
        await expect(
            runWithAiCredits({
                userId: OWNER,
                task: "plan_generation",
                idempotencyKey: "fail-1",
                run: async () => {
                    throw new Error("model outage");
                },
            }),
        ).rejects.toThrow("model outage");
        const usage = await getAiCreditUsage(OWNER);
        expect(usage?.spent).toBe(4);
        expect(usage?.refunded).toBe(4);
        expect(usage?.balance).toBe(10);
    });

    test("refund on unusable output, kept on usable output", async () => {
        const store = new InMemoryAiCreditStore();
        install(store);
        const fallback = await runWithAiCredits({
            userId: OWNER,
            task: "weekly_guidance",
            idempotencyKey: "fb-1",
            isUsable: (result: string) => result !== "manual_fallback",
            run: async () => "manual_fallback",
        });
        expect(fallback.status).toBe("ok");
        expect((await getAiCreditUsage(OWNER))?.balance).toBe(10);
        const good = await runWithAiCredits({
            userId: OWNER,
            task: "weekly_guidance",
            idempotencyKey: "fb-2",
            isUsable: (result: string) => result !== "manual_fallback",
            run: async () => "narrative",
        });
        expect(good.status).toBe("ok");
        expect((await getAiCreditUsage(OWNER))?.balance).toBe(8);
    });

    test("idempotency: the same key reserves once, even across a retry", async () => {
        const store = new InMemoryAiCreditStore();
        install(store);
        const first = await reserveAiCredits({
            userId: OWNER,
            task: "recipe_import",
            idempotencyKey: "same-key",
        });
        const second = await reserveAiCredits({
            userId: OWNER,
            task: "recipe_import",
            idempotencyKey: "same-key",
        });
        expect(first.status).toBe("reserved");
        expect(second.status).toBe("reserved");
        if (first.status === "reserved" && second.status === "reserved") {
            expect(second.reservation.spendId).toBe(first.reservation.spendId);
            expect(second.reservation.replayed).toBe(true);
        }
        expect(
            store.entries.filter((entry) => entry.kind === "spend"),
        ).toHaveLength(1);
        expect((await getAiCreditUsage(OWNER))?.balance).toBe(5);
    });

    test("cap behaviour: exhausted returns no reservation and no charge", async () => {
        const store = new InMemoryAiCreditStore();
        install(store);
        await reserveAiCredits({
            userId: OWNER,
            task: "recipe_import",
            idempotencyKey: "x1",
        });
        await reserveAiCredits({
            userId: OWNER,
            task: "recipe_import",
            idempotencyKey: "x2",
        });
        const blocked = await reserveAiCredits({
            userId: OWNER,
            task: "cook_nl_fallback",
            idempotencyKey: "x3",
        });
        expect(blocked).toEqual({
            status: "exhausted",
            balance: 0,
            cost: 1,
            poolUserId: OWNER,
        });
        expect(
            store.entries.filter((entry) => entry.kind === "spend"),
        ).toHaveLength(2);
    });

    test("fail-closed: store errors resolve to unavailable, never a pass", async () => {
        _setAiCreditMeterDepsForTests({
            store: {
                reserve: async () => {
                    throw new Error("down");
                },
                refund: async () => false,
                usage: async () => {
                    throw new Error("down");
                },
            },
            resolvePool: async () => ({ poolUserId: OWNER, tier: "free" }),
            log: () => {},
        });
        expect(
            await reserveAiCredits({ userId: OWNER, task: "meal_ideas" }),
        ).toEqual({ status: "unavailable" });
        expect(await getAiCreditUsage(OWNER)).toBeNull();
    });

    test("double refund is prevented", async () => {
        const store = new InMemoryAiCreditStore();
        install(store);
        const reserved = await reserveAiCredits({
            userId: OWNER,
            task: "receipt_scan",
            idempotencyKey: "rr",
        });
        if (reserved.status !== "reserved") throw new Error("expected reserve");
        const { refundAiCredits } = await import("./ai-credits.js");
        await refundAiCredits(reserved.reservation);
        await refundAiCredits(reserved.reservation);
        expect(
            store.entries.filter((entry) => entry.kind === "refund"),
        ).toHaveLength(1);
        expect((await getAiCreditUsage(OWNER))?.balance).toBe(10);
    });
});
