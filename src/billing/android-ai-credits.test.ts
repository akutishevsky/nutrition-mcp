import { afterEach, describe, expect, test } from "bun:test";
import type { Context } from "hono";
import {
    InMemoryAiCreditStore,
    _setAiCreditMeterDepsForTests,
} from "./ai-credits.js";
import { requireAiCredits } from "./android-ai-credits.js";

const USER_A = "11111111-1111-4111-8111-111111111111";

function requestContext(): Context {
    return {
        json: (body: unknown, status: number) =>
            new Response(JSON.stringify(body), {
                status,
                headers: { "Content-Type": "application/json" },
            }),
    } as unknown as Context;
}

function installStore(store: InMemoryAiCreditStore) {
    _setAiCreditMeterDepsForTests({
        store,
        resolvePool: async (userId: string) => ({
            poolUserId: userId,
            tier: "free" as const,
        }),
        log: () => {},
    });
}

afterEach(() => _setAiCreditMeterDepsForTests(null));

describe("AI task credit gate (one meter, web + app)", () => {
    test("allows the call when the reserve succeeds", async () => {
        installStore(new InMemoryAiCreditStore());
        const gate = await requireAiCredits(requestContext(), {
            userId: USER_A,
            task: "meal_ideas",
        });
        expect(gate.allowed).toBe(true);
        if (gate.allowed) {
            expect(gate.reservation.cost).toBe(3);
            expect(gate.reservation.balanceAfterReserve).toBe(7);
        }
    });

    test("exhausted balance returns 402 with the manual path, no charge", async () => {
        const store = new InMemoryAiCreditStore();
        installStore(store);
        // Free grant is 10: two recipe imports (5 each) drain it.
        await requireAiCredits(requestContext(), {
            userId: USER_A,
            task: "recipe_import",
            idempotencyKey: "drain-1",
        });
        await requireAiCredits(requestContext(), {
            userId: USER_A,
            task: "recipe_import",
            idempotencyKey: "drain-2",
        });
        const gate = await requireAiCredits(requestContext(), {
            userId: USER_A,
            task: "receipt_scan",
        });
        expect(gate.allowed).toBe(false);
        if (!gate.allowed) {
            expect(gate.response.status).toBe(402);
            const body = await gate.response.json();
            expect(body.error).toBe("ai_credits_exhausted");
            expect(body.manual_entry_available).toBe(true);
            expect(body.balance).toBe(0);
            expect(body.cost).toBe(2);
        }
        // The blocked attempt added no spend entry.
        expect(
            store.entries.filter((entry) => entry.kind === "spend"),
        ).toHaveLength(2);
    });

    test("ledger failure fails closed with 503 and the manual path", async () => {
        _setAiCreditMeterDepsForTests({
            store: {
                reserve: async () => {
                    throw new Error("ledger down");
                },
                refund: async () => false,
                usage: async () => {
                    throw new Error("ledger down");
                },
            },
            resolvePool: async (userId: string) => ({
                poolUserId: userId,
                tier: "free" as const,
            }),
            log: () => {},
        });
        const gate = await requireAiCredits(requestContext(), {
            userId: USER_A,
            task: "receipt_scan",
        });
        expect(gate.allowed).toBe(false);
        if (!gate.allowed) {
            expect(gate.response.status).toBe(503);
            const body = await gate.response.json();
            expect(body.error).toBe("ai_credits_unavailable");
            expect(body.manual_entry_available).toBe(true);
        }
    });
});
