import type { Context } from "hono";
import {
    reserveAiCredits,
    type AiCreditReservation,
    type AiTask,
} from "./ai-credits.js";

/**
 * Route gate for metered AI tasks (S1). One meter for every surface —
 * website and Android alike (brief §2, Decision 3): the old Android-only
 * 503 stub is gone. Reserve-before-call happens here; the handler refunds
 * through `refundAiCredits` when its model call fails or returns unusable
 * output.
 *
 * Outcomes:
 * - reserved → the handler runs its model call with the reservation.
 * - exhausted (402) → the action explains and offers the manual path.
 *   Never a surprise charge, never a dead end: manual entry always works.
 * - unavailable (503) → fail-closed when the ledger itself cannot be
 *   reached, mirroring failClosedMunchCapabilities; manual path offered.
 */
export type AiCreditGateResult =
    | { allowed: true; reservation: AiCreditReservation }
    | { allowed: false; response: Response };

export async function requireAiCredits(
    c: Context,
    input: { userId: string; task: AiTask; idempotencyKey?: string },
): Promise<AiCreditGateResult> {
    const result = await reserveAiCredits(input);
    if (result.status === "reserved") {
        return { allowed: true, reservation: result.reservation };
    }
    if (result.status === "exhausted") {
        return {
            allowed: false,
            response: c.json(
                {
                    error: "ai_credits_exhausted",
                    message:
                        "You are out of AI task credits for this month. You can keep going with manual entry — it always works and never uses credits.",
                    manual_entry_available: true,
                    balance: result.balance,
                    cost: result.cost,
                    task: input.task,
                },
                402,
            ),
        };
    }
    return {
        allowed: false,
        response: c.json(
            {
                error: "ai_credits_unavailable",
                message:
                    "AI task credits could not be checked right now, so this AI action is paused. Manual entry always works — please try the AI action again shortly.",
                manual_entry_available: true,
                task: input.task,
            },
            503,
        ),
    };
}

export { refundAiCredits } from "./ai-credits.js";
