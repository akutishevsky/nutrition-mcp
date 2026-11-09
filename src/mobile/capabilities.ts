import { CAPABILITY_MANIFEST } from "../capability-manifest.js";
import { INVENTORY_CAPABILITY_CONTRACTS } from "../inventory/capabilities.js";

export type MobileCoverage =
    "complete" | "partial" | "planned" | "not_applicable";

export interface MobileCapabilityStatus {
    android: MobileCoverage;
    ios: MobileCoverage;
    note?: string;
}

/**
 * Mobile parity is intentionally explicit. Adding a new customer-outcome
 * capability anywhere in Munch requires adding its id here or CI fails.
 *
 * During the initial mobile build every applicable capability starts as
 * `planned`. Individual PRs promote Android/iOS coverage to `partial` or
 * `complete` only after the corresponding product flow is exercised by the
 * mobile certification suite.
 */
export const MOBILE_CAPABILITY_IDS = [
    "meal.create",
    "meal.read",
    "meal.update",
    "meal.delete",
    "meal.copy",
    "meal.search",
    "meal.details",
    "nutrition.provenance",
    "meal.import",
    "meal.photoLog",
    "mealDraft.create",
    "mealDraft.read",
    "mealDraft.review",
    "mealDraft.update",
    "mealDraft.confirm",
    "mealDraft.cancel",
    "food.search",
    "food.inspect",
    "food.barcode",
    "food.saved.read",
    "food.saved.write",
    "food.saved.reuse",
    "nutrition.summary",
    "nutrition.goals",
    "guidance.preferences",
    "guidance.goalPreview",
    "guidance.goalCommit",
    "guidance.goalHistory",
    "nutrition.progress",
    "nutrition.trends",
    "nutrition.patterns",
    "nutrition.weeklyCheckin",
    "nutrition.dailyGuidance",
    "water.create",
    "water.read",
    "water.update",
    "water.delete",
    "weight.create",
    "weight.read",
    "weight.update",
    "weight.delete",
    "weight.trends",
    "weight.units",
    "preference.widgets",
    "preference.alcohol",
    "preference.timezone",
    "recipe.create",
    "recipe.import",
    "recipe.read",
    "recipe.search",
    "recipe.update",
    "recipe.archive",
    "recipe.log",
    "mealPlan.read",
    "mealPlan.schedule",
    "mealPlan.compose",
    "mealPlan.draftCreate",
    "mealPlan.draftEdit",
    "mealPlan.draftCommit",
    "mealPlan.recipeGenerate",
    "mealPlan.recipeCustomize",
    "mealPlan.groceryPreview",
    "mealPlan.groceryCommit",
    "mealPlan.swapPreview",
    "mealPlan.swapCommit",
    "mealPlan.swapUndo",
    "grocery.read",
    "grocery.add",
    "grocery.purchase",
    "grocery.manage",
    "nutrition.export",
    "account.delete",
    "connection.status",
    "billing.checkout",
    "billing.portal",
    "mcp.connection.revoke",
    "household.manage",
    "account.export",
    "inventory.read",
    "inventory.reconcile",
    "purchase.reconcile",
    "cook.create",
    "cook.read",
    "cook.update",
    "cook.lifecycle",
    "cook.iterate",
    "cook.recipe",
    "cook.nutrition",
] as const;

export type MobileCapabilityId = (typeof MOBILE_CAPABILITY_IDS)[number];

const planned = (): MobileCapabilityStatus => ({
    android: "planned",
    ios: "planned",
});

export const MOBILE_CAPABILITY_STATUS: Readonly<
    Record<MobileCapabilityId, MobileCapabilityStatus>
> = Object.freeze(
    Object.fromEntries(
        MOBILE_CAPABILITY_IDS.map((id) => [id, planned()]),
    ) as Record<MobileCapabilityId, MobileCapabilityStatus>,
);

export function assertMobileCapabilityContracts(): string[] {
    const errors: string[] = [];
    const sourceIds = new Set<string>([
        ...CAPABILITY_MANIFEST.map((capability) => capability.id),
        ...INVENTORY_CAPABILITY_CONTRACTS.map((capability) => capability.id),
    ]);
    const mobileIds = new Set<string>();

    for (const id of MOBILE_CAPABILITY_IDS) {
        if (mobileIds.has(id)) {
            errors.push(`Duplicate mobile capability id: ${id}`);
        }
        mobileIds.add(id);
        if (!sourceIds.has(id)) {
            errors.push(
                `Mobile capability ${id} has no canonical product contract`,
            );
        }

        const status = MOBILE_CAPABILITY_STATUS[id];
        if (!status) {
            errors.push(`Mobile capability ${id} has no Android/iOS status`);
            continue;
        }
        for (const [platform, coverage] of [
            ["android", status.android],
            ["ios", status.ios],
        ] as const) {
            if (
                coverage !== "complete" &&
                coverage !== "partial" &&
                coverage !== "planned" &&
                coverage !== "not_applicable"
            ) {
                errors.push(`${id}: invalid ${platform} coverage ${coverage}`);
            }
        }
    }

    for (const id of sourceIds) {
        if (!mobileIds.has(id)) {
            errors.push(
                `${id}: canonical capability is missing Android/iOS parity declaration`,
            );
        }
    }

    return errors;
}
