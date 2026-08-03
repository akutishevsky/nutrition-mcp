export type SubscriptionStatus =
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "paused";

export interface SubscriptionSnapshot {
    status: SubscriptionStatus | null;
    currentPeriodEnd?: Date | null;
    graceExpiresAt?: Date | null;
}

export interface EntitlementDecision {
    allowMcp: boolean;
    canUseProtectedTools: boolean;
    canWriteNutritionData: boolean;
    canReadNutritionData: boolean;
    canExportData: boolean;
    canDeleteAccount: boolean;
    reason:
        | "active"
        | "trialing"
        | "past_due_grace"
        | "payment_required"
        | "subscription_ended";
}

const ACCOUNT_ACCESS_ONLY: Omit<EntitlementDecision, "reason"> = {
    allowMcp: false,
    canUseProtectedTools: false,
    canWriteNutritionData: false,
    canReadNutritionData: false,
    canExportData: true,
    canDeleteAccount: true,
};

function fullAccess(
    reason: "active" | "trialing" | "past_due_grace",
): EntitlementDecision {
    return {
        allowMcp: true,
        canUseProtectedTools: true,
        canWriteNutritionData: true,
        canReadNutritionData: true,
        canExportData: true,
        canDeleteAccount: true,
        reason,
    };
}

export function decideEntitlement(
    subscription: SubscriptionSnapshot,
    now = new Date(),
): EntitlementDecision {
    if (subscription.status === "active") return fullAccess("active");
    if (subscription.status === "trialing") return fullAccess("trialing");

    if (
        subscription.status === "past_due" &&
        subscription.graceExpiresAt &&
        subscription.graceExpiresAt.getTime() > now.getTime()
    ) {
        return fullAccess("past_due_grace");
    }

    if (
        subscription.status === null ||
        subscription.status === "incomplete" ||
        subscription.status === "past_due"
    ) {
        return {
            ...ACCOUNT_ACCESS_ONLY,
            reason: "payment_required",
        };
    }

    return {
        ...ACCOUNT_ACCESS_ONLY,
        reason: "subscription_ended",
    };
}
