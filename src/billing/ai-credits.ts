import { randomUUID } from "node:crypto";
import { getActiveHouseholdContext } from "../households/repository.js";
import {
    withBillingDatabase,
    type DatabaseTransaction,
} from "../platform/database.js";
import { subscriptionProvidesPremium } from "./capabilities.js";
import { hasActivePremiumOverride } from "./override.js";
import { getDirectSubscriptionSnapshot } from "./subscription-sources.js";

/**
 * AI task credits (S1, Full Parity App Program brief §2).
 *
 * One meter for the website and the Android app. The ledger is append-only:
 * a monthly `grant`, a `spend` reserved BEFORE the model call, and a
 * `refund` linked to that spend when the call fails or returns unusable
 * output — a user never pays for an outage. Balance is derived from the
 * entries; there is no mutable counter. When the balance cannot cover a
 * task the caller must offer the manual path: never a surprise charge,
 * never a dead end.
 */

export type AiTask =
    | "receipt_scan"
    | "pantry_photo_scan"
    | "meal_photo_log"
    | "meal_ideas"
    | "recipe_import"
    | "plan_generation"
    | "weekly_guidance"
    | "cook_nl_fallback";

/** Per-task credit costs from brief §2's table. */
export const AI_TASK_CREDIT_COSTS: Readonly<Record<AiTask, number>> =
    Object.freeze({
        receipt_scan: 2,
        pantry_photo_scan: 2,
        meal_photo_log: 4,
        meal_ideas: 3,
        recipe_import: 5,
        plan_generation: 4,
        weekly_guidance: 2,
        cook_nl_fallback: 1,
    });

/** Monthly grants from brief §2 / Decision 2. No rollover in v1. */
export const AI_CREDIT_MONTHLY_GRANTS = Object.freeze({
    free: 10,
    premium: 600,
});

export type AiCreditTier = keyof typeof AI_CREDIT_MONTHLY_GRANTS;

export function aiCreditPeriodMonth(now = new Date()): string {
    return now.toISOString().slice(0, 7);
}

export interface AiCreditLedgerEntry {
    id: string;
    poolUserId: string;
    actorUserId: string;
    kind: "grant" | "spend" | "refund";
    amount: number;
    task: AiTask | null;
    periodMonth: string;
    idempotencyKey: string | null;
    relatedEntryId: string | null;
    createdAt: string;
}

/** Signed contribution of one entry to the derived balance. */
export function aiCreditEntryDelta(entry: {
    kind: AiCreditLedgerEntry["kind"];
    amount: number;
}): number {
    return entry.kind === "spend" ? -entry.amount : entry.amount;
}

export function aiCreditBalanceFromEntries(
    entries: Array<{ kind: AiCreditLedgerEntry["kind"]; amount: number }>,
): number {
    return entries.reduce((sum, entry) => sum + aiCreditEntryDelta(entry), 0);
}

export interface AiCreditUsage {
    poolUserId: string;
    tier: AiCreditTier;
    periodMonth: string;
    granted: number;
    spent: number;
    refunded: number;
    balance: number;
    taskCosts: typeof AI_TASK_CREDIT_COSTS;
}

export interface AiCreditReservation {
    spendId: string;
    poolUserId: string;
    actorUserId: string;
    task: AiTask;
    cost: number;
    balanceAfterReserve: number;
    /** True when this call replayed an earlier reservation for the same
     * idempotency key instead of charging again. */
    replayed: boolean;
}

export type AiCreditReserveResult =
    | { status: "reserved"; reservation: AiCreditReservation }
    | {
          status: "exhausted";
          balance: number;
          cost: number;
          poolUserId: string;
      }
    | { status: "unavailable" };

/**
 * Storage seam. The production store is Postgres (RLS-protected ledger
 * table, billing role); unit tests drive the same service logic against
 * the in-memory store below.
 */
export interface AiCreditStore {
    /** Atomically ensure the monthly grant, check the derived balance and
     * append the spend. Replaying an idempotency key returns the original
     * spend without charging again. */
    reserve(input: {
        poolUserId: string;
        actorUserId: string;
        tier: AiCreditTier;
        task: AiTask;
        cost: number;
        periodMonth: string;
        idempotencyKey: string;
    }): Promise<
        | {
              outcome: "reserved";
              spendId: string;
              balance: number;
              replayed: boolean;
          }
        | { outcome: "exhausted"; balance: number }
    >;
    /** Append a refund for a spend, at most once per spend. */
    refund(input: {
        poolUserId: string;
        actorUserId: string;
        task: AiTask;
        amount: number;
        periodMonth: string;
        spendId: string;
    }): Promise<boolean>;
    usage(input: {
        poolUserId: string;
        tier: AiCreditTier;
        periodMonth: string;
    }): Promise<AiCreditUsage>;
}

function usageFromEntries(
    poolUserId: string,
    tier: AiCreditTier,
    periodMonth: string,
    entries: Array<{ kind: AiCreditLedgerEntry["kind"]; amount: number }>,
): AiCreditUsage {
    let granted = 0;
    let spent = 0;
    let refunded = 0;
    for (const entry of entries) {
        if (entry.kind === "grant") granted += entry.amount;
        else if (entry.kind === "spend") spent += entry.amount;
        else refunded += entry.amount;
    }
    return {
        poolUserId,
        tier,
        periodMonth,
        granted,
        spent,
        refunded,
        balance: granted - spent + refunded,
        taskCosts: AI_TASK_CREDIT_COSTS,
    };
}

export class InMemoryAiCreditStore implements AiCreditStore {
    entries: AiCreditLedgerEntry[] = [];

    async reserve(input: {
        poolUserId: string;
        actorUserId: string;
        tier: AiCreditTier;
        task: AiTask;
        cost: number;
        periodMonth: string;
        idempotencyKey: string;
    }) {
        const existing = this.entries.find(
            (entry) =>
                entry.kind === "spend" &&
                entry.poolUserId === input.poolUserId &&
                entry.idempotencyKey === input.idempotencyKey,
        );
        if (existing) {
            return {
                outcome: "reserved" as const,
                spendId: existing.id,
                balance: this.balance(input.poolUserId, input.periodMonth),
                replayed: true,
            };
        }
        this.ensureGrant(input.poolUserId, input.tier, input.periodMonth);
        const balance = this.balance(input.poolUserId, input.periodMonth);
        if (balance < input.cost)
            return { outcome: "exhausted" as const, balance };
        const spend: AiCreditLedgerEntry = {
            id: randomUUID(),
            poolUserId: input.poolUserId,
            actorUserId: input.actorUserId,
            kind: "spend",
            amount: input.cost,
            task: input.task,
            periodMonth: input.periodMonth,
            idempotencyKey: input.idempotencyKey,
            relatedEntryId: null,
            createdAt: new Date().toISOString(),
        };
        this.entries.push(spend);
        return {
            outcome: "reserved" as const,
            spendId: spend.id,
            balance: balance - input.cost,
            replayed: false,
        };
    }

    async refund(input: {
        poolUserId: string;
        actorUserId: string;
        task: AiTask;
        amount: number;
        periodMonth: string;
        spendId: string;
    }): Promise<boolean> {
        if (
            this.entries.some(
                (entry) =>
                    entry.kind === "refund" &&
                    entry.relatedEntryId === input.spendId,
            )
        ) {
            return false;
        }
        this.entries.push({
            id: randomUUID(),
            poolUserId: input.poolUserId,
            actorUserId: input.actorUserId,
            kind: "refund",
            amount: input.amount,
            task: input.task,
            periodMonth: input.periodMonth,
            idempotencyKey: null,
            relatedEntryId: input.spendId,
            createdAt: new Date().toISOString(),
        });
        return true;
    }

    async usage(input: {
        poolUserId: string;
        tier: AiCreditTier;
        periodMonth: string;
    }): Promise<AiCreditUsage> {
        this.ensureGrant(input.poolUserId, input.tier, input.periodMonth);
        return usageFromEntries(
            input.poolUserId,
            input.tier,
            input.periodMonth,
            this.entries.filter(
                (entry) =>
                    entry.poolUserId === input.poolUserId &&
                    entry.periodMonth === input.periodMonth,
            ),
        );
    }

    private ensureGrant(
        poolUserId: string,
        tier: AiCreditTier,
        periodMonth: string,
    ) {
        if (
            !this.entries.some(
                (entry) =>
                    entry.kind === "grant" &&
                    entry.poolUserId === poolUserId &&
                    entry.periodMonth === periodMonth,
            )
        ) {
            this.entries.push({
                id: randomUUID(),
                poolUserId,
                actorUserId: poolUserId,
                kind: "grant",
                amount: AI_CREDIT_MONTHLY_GRANTS[tier],
                task: null,
                periodMonth,
                idempotencyKey: null,
                relatedEntryId: null,
                createdAt: new Date().toISOString(),
            });
        }
    }

    private balance(poolUserId: string, periodMonth: string): number {
        return aiCreditBalanceFromEntries(
            this.entries.filter(
                (entry) =>
                    entry.poolUserId === poolUserId &&
                    entry.periodMonth === periodMonth,
            ),
        );
    }
}

interface LedgerRow {
    id: string;
    kind: AiCreditLedgerEntry["kind"];
    amount: number;
}

async function entriesForPeriod(
    tx: DatabaseTransaction,
    poolUserId: string,
    periodMonth: string,
): Promise<LedgerRow[]> {
    return tx<LedgerRow[]>`
        select id, kind, amount::int as amount
        from munch.ai_credit_ledger
        where pool_user_id = ${poolUserId}
          and period_month = ${periodMonth}
        order by created_at asc
    `;
}

async function ensureGrantTx(
    tx: DatabaseTransaction,
    poolUserId: string,
    tier: AiCreditTier,
    periodMonth: string,
): Promise<void> {
    await tx`
        insert into munch.ai_credit_ledger (
            pool_user_id, actor_user_id, kind, amount, period_month
        ) values (
            ${poolUserId}, ${poolUserId}, 'grant',
            ${AI_CREDIT_MONTHLY_GRANTS[tier]}, ${periodMonth}
        )
        on conflict do nothing
    `;
}

export const postgresAiCreditStore: AiCreditStore = {
    async reserve(input) {
        return withBillingDatabase(async (tx) => {
            // Serialize reservations per pool so the derived-balance check
            // and the spend insert cannot interleave into an overdraft.
            await tx`select pg_advisory_xact_lock(hashtextextended(${`ai-credits:${input.poolUserId}:${input.periodMonth}`}, 0))`;
            const replay = await tx<Array<{ id: string }>>`
                select id from munch.ai_credit_ledger
                where pool_user_id = ${input.poolUserId}
                  and kind = 'spend'
                  and idempotency_key = ${input.idempotencyKey}
                limit 1
            `;
            await ensureGrantTx(
                tx,
                input.poolUserId,
                input.tier,
                input.periodMonth,
            );
            const entries = await entriesForPeriod(
                tx,
                input.poolUserId,
                input.periodMonth,
            );
            const balance = aiCreditBalanceFromEntries(entries);
            if (replay[0]) {
                return {
                    outcome: "reserved" as const,
                    spendId: replay[0].id,
                    balance,
                    replayed: true,
                };
            }
            if (balance < input.cost) {
                return { outcome: "exhausted" as const, balance };
            }
            const rows = await tx<Array<{ id: string }>>`
                insert into munch.ai_credit_ledger (
                    pool_user_id, actor_user_id, kind, amount, task,
                    period_month, idempotency_key
                ) values (
                    ${input.poolUserId}, ${input.actorUserId}, 'spend',
                    ${input.cost}, ${input.task}, ${input.periodMonth},
                    ${input.idempotencyKey}
                )
                returning id
            `;
            return {
                outcome: "reserved" as const,
                spendId: rows[0]!.id,
                balance: balance - input.cost,
                replayed: false,
            };
        });
    },

    async refund(input) {
        return withBillingDatabase(async (tx) => {
            const rows = await tx<Array<{ id: string }>>`
                insert into munch.ai_credit_ledger (
                    pool_user_id, actor_user_id, kind, amount, task,
                    period_month, related_entry_id
                ) values (
                    ${input.poolUserId}, ${input.actorUserId}, 'refund',
                    ${input.amount}, ${input.task}, ${input.periodMonth},
                    ${input.spendId}
                )
                on conflict do nothing
                returning id
            `;
            return Boolean(rows[0]);
        });
    },

    async usage(input) {
        return withBillingDatabase(async (tx) => {
            await ensureGrantTx(
                tx,
                input.poolUserId,
                input.tier,
                input.periodMonth,
            );
            const entries = await entriesForPeriod(
                tx,
                input.poolUserId,
                input.periodMonth,
            );
            return usageFromEntries(
                input.poolUserId,
                input.tier,
                input.periodMonth,
                entries,
            );
        });
    },
};

/** The pool that funds a user's AI work: the household owner's grant when
 * the user belongs to a household, otherwise their own. */
export async function resolveAiCreditPool(userId: string): Promise<{
    poolUserId: string;
    tier: AiCreditTier;
}> {
    const household = await getActiveHouseholdContext(userId);
    const poolUserId = household?.ownerUserId ?? userId;
    const [subscription, override] = await Promise.all([
        getDirectSubscriptionSnapshot(poolUserId),
        hasActivePremiumOverride(poolUserId),
    ]);
    const premium =
        override || subscriptionProvidesPremium(subscription, new Date());
    return { poolUserId, tier: premium ? "premium" : "free" };
}

export interface AiCreditMeterDeps {
    store: AiCreditStore;
    resolvePool: typeof resolveAiCreditPool;
    now: () => Date;
    log: (line: string) => void;
}

const defaultDeps: AiCreditMeterDeps = {
    store: postgresAiCreditStore,
    resolvePool: resolveAiCreditPool,
    now: () => new Date(),
    log: (line) => console.info(line),
};

let depsOverride: Partial<AiCreditMeterDeps> | null = null;

/** Test seam only; production always uses the Postgres store. */
export function _setAiCreditMeterDepsForTests(
    deps: Partial<AiCreditMeterDeps> | null,
): void {
    depsOverride = deps;
}

function meterDeps(): AiCreditMeterDeps {
    return { ...defaultDeps, ...(depsOverride ?? {}) };
}

function safeLogValue(value: string): string {
    return value.replace(/[^a-zA-Z0-9._/-]+/g, "_").slice(0, 80) || "unknown";
}

function logSpend(
    deps: AiCreditMeterDeps,
    phase: string,
    status: string,
    task: AiTask,
    model: string | undefined,
    startedAt: number,
    credits: number,
): void {
    deps.log(
        `[ai_credits] phase=${phase} status=${status} task=${task} model=${safeLogValue(model ?? "unknown")} duration_ms=${Math.max(0, Math.round(Date.now() - startedAt))} calls_used=1 credits=${credits}`,
    );
}

/** Reserve the task's cost before the model call. Fail-closed: any store
 * or pool-resolution failure resolves to `unavailable`, never to a free
 * pass (mirrors failClosedMunchCapabilities). */
export async function reserveAiCredits(input: {
    userId: string;
    task: AiTask;
    idempotencyKey?: string;
    model?: string;
}): Promise<AiCreditReserveResult> {
    const deps = meterDeps();
    const startedAt = Date.now();
    const cost = AI_TASK_CREDIT_COSTS[input.task];
    try {
        const pool = await deps.resolvePool(input.userId);
        const result = await deps.store.reserve({
            poolUserId: pool.poolUserId,
            actorUserId: input.userId,
            tier: pool.tier,
            task: input.task,
            cost,
            periodMonth: aiCreditPeriodMonth(deps.now()),
            idempotencyKey: input.idempotencyKey?.trim()
                ? input.idempotencyKey.trim().slice(0, 200)
                : randomUUID(),
        });
        if (result.outcome === "exhausted") {
            logSpend(
                deps,
                "reserve",
                "exhausted",
                input.task,
                input.model,
                startedAt,
                0,
            );
            return {
                status: "exhausted",
                balance: result.balance,
                cost,
                poolUserId: pool.poolUserId,
            };
        }
        logSpend(
            deps,
            "reserve",
            result.replayed ? "replayed" : "reserved",
            input.task,
            input.model,
            startedAt,
            result.replayed ? 0 : cost,
        );
        return {
            status: "reserved",
            reservation: {
                spendId: result.spendId,
                poolUserId: pool.poolUserId,
                actorUserId: input.userId,
                task: input.task,
                cost,
                balanceAfterReserve: result.balance,
                replayed: result.replayed,
            },
        };
    } catch {
        logSpend(
            deps,
            "reserve",
            "unavailable",
            input.task,
            input.model,
            startedAt,
            0,
        );
        return { status: "unavailable" };
    }
}

/** Refund a reservation whose model call failed or returned unusable
 * output. Idempotent: a spend is refunded at most once. Replayed
 * reservations are not refunded (the original call owns the outcome). */
export async function refundAiCredits(
    reservation: AiCreditReservation,
    model?: string,
): Promise<void> {
    if (reservation.replayed) return;
    const deps = meterDeps();
    const startedAt = Date.now();
    try {
        const refunded = await deps.store.refund({
            poolUserId: reservation.poolUserId,
            actorUserId: reservation.actorUserId,
            task: reservation.task,
            amount: reservation.cost,
            periodMonth: aiCreditPeriodMonth(deps.now()),
            spendId: reservation.spendId,
        });
        logSpend(
            deps,
            "refund",
            refunded ? "refunded" : "already_refunded",
            reservation.task,
            model,
            startedAt,
            refunded ? reservation.cost : 0,
        );
    } catch {
        logSpend(
            deps,
            "refund",
            "failed",
            reservation.task,
            model,
            startedAt,
            0,
        );
    }
}

/** Settings read-model: the caller's real pool balance and this month's
 * usage. Returns null when the ledger is unavailable (fail-closed display:
 * the UI shows "unavailable", never an invented balance). */
export async function getAiCreditUsage(
    userId: string,
): Promise<AiCreditUsage | null> {
    const deps = meterDeps();
    try {
        const pool = await deps.resolvePool(userId);
        return await deps.store.usage({
            poolUserId: pool.poolUserId,
            tier: pool.tier,
            periodMonth: aiCreditPeriodMonth(deps.now()),
        });
    } catch {
        return null;
    }
}

/**
 * Run a model call under the meter: reserve first, refund on throw or on
 * an `isUsable` verdict of false, keep the spend on success.
 */
export async function runWithAiCredits<T>(input: {
    userId: string;
    task: AiTask;
    idempotencyKey?: string;
    model?: string;
    isUsable?: (result: T) => boolean;
    run: () => Promise<T>;
}): Promise<
    | { status: "ok"; result: T; reservation: AiCreditReservation }
    | { status: "exhausted"; balance: number; cost: number }
    | { status: "unavailable" }
> {
    const reserved = await reserveAiCredits(input);
    if (reserved.status !== "reserved") return reserved;
    const { reservation } = reserved;
    try {
        const result = await input.run();
        if (input.isUsable && !input.isUsable(result)) {
            await refundAiCredits(reservation, input.model);
            return { status: "ok", result, reservation };
        }
        return { status: "ok", result, reservation };
    } catch (error) {
        await refundAiCredits(reservation, input.model);
        throw error;
    }
}
