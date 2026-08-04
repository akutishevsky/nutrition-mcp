import { getActiveHouseholdContext } from "../households/repository.js";
import type { SubscriptionSnapshot } from "./entitlements.js";
import { hasActivePremiumOverride } from "./override.js";
import { getSubscriptionSnapshot } from "./repository.js";

export const FREE_HISTORY_DAYS = 30;
export const FREE_SAVED_FOOD_LIMIT = 25;

export interface HouseholdCapabilityContext {
    householdId: string;
    householdName: string;
    ownerUserId: string;
    role: "owner" | "member" | "viewer";
    displayName: string;
}

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
    household: HouseholdCapabilityContext | null;
    entitlementSource:
        | "free"
        | "direct_subscription"
        | "explicit_override"
        | "household_subscription"
        | "retained_read_access";
}

export function subscriptionProvidesPremium(
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
        household: null,
        entitlementSource: premium ? "direct_subscription" : "free",
    };
}

function applyPremiumOverride(
    capabilities: MunchCapabilities,
): MunchCapabilities {
    return {
        ...capabilities,
        tier: "premium",
        historyDays: null,
        savedFoodLimit: null,
        personalRecipesRead: true,
        personalRecipesWrite: true,
        personalPlanningRead: true,
        personalPlanningWrite: true,
        entitlementSource: "explicit_override",
    };
}

export async function resolveMunchCapabilities(
    userId: string,
): Promise<MunchCapabilities> {
    const [directSubscription, household, explicitOverride] = await Promise.all(
        [
            getSubscriptionSnapshot(userId),
            getActiveHouseholdContext(userId),
            hasActivePremiumOverride(userId),
        ],
    );
    const direct = capabilitiesFromSubscription(directSubscription);
    const result = explicitOverride ? applyPremiumOverride(direct) : direct;
    if (!household) return result;

    const ownerPremium =
        household.ownerUserId === userId
            ? result.tier === "premium"
            : subscriptionProvidesPremium(
                  await getSubscriptionSnapshot(household.ownerUserId),
                  new Date(),
              ) || (await hasActivePremiumOverride(household.ownerUserId));
    const canEdit = household.role === "owner" || household.role === "member";

    return {
        ...result,
        household: {
            householdId: household.householdId,
            householdName: household.householdName,
            ownerUserId: household.ownerUserId,
            role: household.role,
            displayName: household.displayName,
        },
        householdRead: true,
        householdWrite: ownerPremium && canEdit,
        householdManage:
            ownerPremium &&
            household.role === "owner" &&
            household.ownerUserId === userId,
        entitlementSource:
            result.tier === "premium"
                ? result.entitlementSource
                : ownerPremium
                  ? "household_subscription"
                  : "retained_read_access",
    };
}
