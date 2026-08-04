import { getSubscriptionSnapshot } from "./repository.js";
import type { SubscriptionSnapshot } from "./entitlements.js";

export const FREE_HISTORY_DAYS = 30;
export const FREE_SAVED_FOOD_LIMIT = 25;

export interface MunchCapabilities {
    tier: "free" | "premium";
    coreNutrition: true;
    historyDays: number | null;
    savedFoodLimit: number | null;
    personalRecipesRead: boolean;
    personalRecipesWrite: boolean;
    personalPlanningRead: boolean;
    personalPlanningWrite: boolean;
    householdRead: boolean;
    householdWrite: boolean;
    householdManage: boolean;
    entitlementSource: "free" | "direct_subscription";
}

function subscriptionProvidesPremium(
    subscription: SubscriptionSnapshot,
    now: Date,
): boolean {
    if (
        subscription.status === "active" ||
        subscription.status === "trialing"
    ) {
        return true;
    }
    return Boolean(
        subscription.status === "past_due" &&
        subscription.graceExpiresAt &&
        subscription.graceExpiresAt.getTime() > now.getTime(),
    );
}

export function capabilitiesFromSubscription(
    subscription: SubscriptionSnapshot,
    now = new Date(),
): MunchCapabilities {
    const premium = subscriptionProvidesPremium(subscription, now);
    return {
        tier: premium ? "premium" : "free",
        coreNutrition: true,
        historyDays: premium ? null : FREE_HISTORY_DAYS,
        savedFoodLimit: premium ? null : FREE_SAVED_FOOD_LIMIT,
        personalRecipesRead: premium,
        personalRecipesWrite: premium,
        personalPlanningRead: premium,
        personalPlanningWrite: premium,
        householdRead: false,
        householdWrite: false,
        householdManage: false,
        entitlementSource: premium ? "direct_subscription" : "free",
    };
}

export async function resolveMunchCapabilities(
    userId: string,
): Promise<MunchCapabilities> {
    return capabilitiesFromSubscription(await getSubscriptionSnapshot(userId));
}
