import { getActiveHouseholdContext } from "../households/repository.js";
import { PRODUCT_CONFIG } from "../product-config.js";
import type { SubscriptionSnapshot } from "./entitlements.js";
import { getHouseholdSeatCoverage } from "./household-seats.js";
import { hasActivePremiumOverride } from "./override.js";
import { getDirectSubscriptionSnapshot } from "./subscription-sources.js";
import type { Context } from "hono";

// Backwards-compatible exports. Product policy lives in PRODUCT_CONFIG; these
// aliases prevent older imports from becoming a second source of truth.
export const FREE_HISTORY_DAYS = PRODUCT_CONFIG.freeHistoryDays;
export const FREE_SAVED_FOOD_LIMIT = PRODUCT_CONFIG.freeSavedFoodLimit;

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
        | "retained_read_access"
        | "android_free_baseline";
}

export type MunchCapabilitySurface = "web" | "android";

export type MunchCapabilityResolutionStatus = "resolved" | "unavailable";

export interface MunchCapabilityResolution {
    capabilities: MunchCapabilities;
    status: MunchCapabilityResolutionStatus;
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
    // Amendment D (Michael, 2026-11-09): Free is fully featured on the
    // website and in the app — personal recipes, planning, and full
    // history are free for every account, and every AI feature is free
    // and unmetered (there is no entitlement check at AI call sites).
    // The one remaining free-tier quantity limit is the saved-food cap
    // below; Premium's remaining differences are household ownership,
    // unlimited saved foods, ad-free, and subscription-gated MCP
    // protected tools.
    return {
        tier: premium ? "premium" : "free",
        coreNutrition: true,
        historyDays: null,
        savedFoodLimit: premium ? null : PRODUCT_CONFIG.freeSavedFoodLimit,
        personalRecipesRead: true,
        personalRecipesWrite: true,
        personalPlanningRead: true,
        personalPlanningWrite: true,
        householdRead: false,
        householdWrite: false,
        householdManage: false,
        household: null,
        entitlementSource: premium ? "direct_subscription" : "free",
    };
}

export function failClosedMunchCapabilities(): MunchCapabilities {
    return capabilitiesFromSubscription({ status: null });
}

export function androidFreeBaselineCapabilities(
    household: HouseholdCapabilityContext | null,
    userId: string,
): MunchCapabilities {
    const isOwner =
        household?.role === "owner" && household.ownerUserId === userId;
    const canEditRole =
        household?.role === "owner" || household?.role === "member";
    return {
        tier: "free",
        coreNutrition: true,
        historyDays: null,
        savedFoodLimit: null,
        personalRecipesRead: true,
        personalRecipesWrite: true,
        personalPlanningRead: true,
        personalPlanningWrite: true,
        householdRead: Boolean(household),
        householdWrite: Boolean(household && canEditRole),
        householdManage: Boolean(household && isOwner),
        household,
        entitlementSource: "android_free_baseline",
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

function applyHouseholdPremium(
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
        entitlementSource: "household_subscription",
    };
}

export async function resolveMunchCapabilities(
    userId: string,
    surface: MunchCapabilitySurface = "web",
): Promise<MunchCapabilities> {
    if (surface === "android") {
        const household = await getActiveHouseholdContext(userId);
        return androidFreeBaselineCapabilities(
            household
                ? {
                      householdId: household.householdId,
                      householdName: household.householdName,
                      ownerUserId: household.ownerUserId,
                      role: household.role,
                      displayName: household.displayName,
                  }
                : null,
            userId,
        );
    }

    const [directSubscription, household, explicitOverride] = await Promise.all(
        [
            getDirectSubscriptionSnapshot(userId),
            getActiveHouseholdContext(userId),
            hasActivePremiumOverride(userId),
        ],
    );
    const direct = capabilitiesFromSubscription(directSubscription);
    let result = explicitOverride ? applyPremiumOverride(direct) : direct;
    if (!household) return result;

    const coverage = await getHouseholdSeatCoverage({
        ownerUserId: household.ownerUserId,
        householdId: household.householdId,
    });
    const isOwner =
        household.role === "owner" && household.ownerUserId === userId;
    const inheritedPremium =
        !household.androidFreeAccess &&
        !isOwner &&
        result.tier !== "premium" &&
        coverage.covered;
    if (inheritedPremium) {
        result = applyHouseholdPremium(result);
    }

    const canEditRole =
        household.role === "owner" || household.role === "member";
    // Explicit overrides exist for trusted review/test accounts and preserve
    // their ability to exercise shared UI. Real paid households require both an
    // active owner subscription and sufficient paid seat quantity. App-store
    // Premium is intentionally personal-only until a store-native seat model
    // exists, so it does not satisfy this Stripe-specific shared billing gate.
    const sharedBillingActive =
        !household.androidFreeAccess &&
        (result.entitlementSource === "explicit_override" ||
            (coverage.ownerHasBillablePremium && coverage.covered));

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
        householdWrite: sharedBillingActive && canEditRole,
        householdManage: sharedBillingActive && isOwner,
        entitlementSource:
            result.entitlementSource === "household_subscription"
                ? "household_subscription"
                : result.tier === "premium"
                  ? result.entitlementSource
                  : "retained_read_access",
    };
}

/** Resolve capabilities for an authenticated app API request. The server
 * derives the surface from the session transport; callers cannot select it. */
export function resolveRequestMunchCapabilities(
    c: Context,
    userId: string,
): Promise<MunchCapabilities> {
    return resolveMunchCapabilities(userId, capabilitySurfaceFromRequest(c));
}

export function capabilitySurfaceFromRequest(
    c: Context,
): MunchCapabilitySurface {
    return c.get("munchAuthTransport") === "bearer" ? "android" : "web";
}

/**
 * Capability lookup is an authorization dependency, not a prerequisite for
 * discovering the MCP catalog. If billing or household storage is temporarily
 * unavailable, fail closed for gated actions while keeping core tools and the
 * connection alive.
 */
export async function resolveMunchCapabilitiesSafe(
    userId: string,
): Promise<MunchCapabilityResolution> {
    try {
        return {
            capabilities: await resolveMunchCapabilities(userId),
            status: "resolved",
        };
    } catch (error) {
        console.warn("Munch capability resolution failed", {
            userId,
            errorName: error instanceof Error ? error.name : "unknown",
        });
        return {
            capabilities: failClosedMunchCapabilities(),
            status: "unavailable",
        };
    }
}
