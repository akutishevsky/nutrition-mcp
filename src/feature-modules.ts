/**
 * Feature toggles — the contract (brief addendum 10, T1–T7).
 *
 * Five modules are optional: Meal Plan, Recipes, Groceries, Pantry,
 * Cooks. Everything else — Today, meal logging, History, Trends,
 * Settings/More — is the product's spine and is never toggleable (T2).
 * A module's flag lives on the account row (T5), defaults to ON, and
 * turning it off only hides the module: no data is ever touched (T4).
 *
 * This file is the pure contract: the module list, normalization of
 * stored/transport values, and the route/surface → module mappings
 * the nav renderer, the route guards, the chat seeds, and the
 * guidance assembly all share, so the surfaces can never disagree
 * about what "off" means. Storage lives in
 * feature-modules-repository.ts (migration 0039).
 */

export const FEATURE_MODULES = [
    "plan",
    "recipes",
    "groceries",
    "pantry",
    "cooks",
] as const;

export type FeatureModule = (typeof FEATURE_MODULES)[number];

/** One boolean per optional module; `true` means the module shows. */
export type FeatureModules = Record<FeatureModule, boolean>;

export const DEFAULT_FEATURE_MODULES: FeatureModules = {
    plan: true,
    recipes: true,
    groceries: true,
    pantry: true,
    cooks: true,
};

export const FEATURE_MODULE_LABELS: Record<FeatureModule, string> = {
    plan: "Meal Plan",
    recipes: "Recipes",
    groceries: "Groceries",
    pantry: "Pantry",
    cooks: "Cooks",
};

export function isFeatureModule(value: unknown): value is FeatureModule {
    return (
        typeof value === "string" &&
        (FEATURE_MODULES as readonly string[]).includes(value)
    );
}

/**
 * Normalize anything stored or received into a complete flag set.
 * Only an explicit `false` turns a module off — a missing row, a
 * missing key, or a malformed value all read as ON, so a preference
 * that fails to load can never hide a module by accident.
 */
export function normalizeFeatureModules(value: unknown): FeatureModules {
    const source =
        value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {};
    const normalized = { ...DEFAULT_FEATURE_MODULES };
    for (const module of FEATURE_MODULES) {
        if (source[module] === false) normalized[module] = false;
    }
    return normalized;
}

/** Extract the recognized boolean fields of a partial update body. */
export function featureModulePatch(
    value: unknown,
): Partial<FeatureModules> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    const source = value as Record<string, unknown>;
    const patch: Partial<FeatureModules> = {};
    for (const module of FEATURE_MODULES) {
        if (typeof source[module] === "boolean") {
            patch[module] = source[module];
        }
    }
    return Object.keys(patch).length > 0 ? patch : null;
}

export function featureModuleEnabled(
    features: FeatureModules,
    module: FeatureModule,
): boolean {
    return features[module] !== false;
}

/** The one-line notice a disabled module's URL lands with (T3). */
export function featureModuleOffNotice(module: FeatureModule): string {
    return `${FEATURE_MODULE_LABELS[module]} is turned off — re-enable it in Settings`;
}

/**
 * SPA route name → the module that owns it, for the routes a toggle
 * can close. Routes absent here (today, log, trends, foods, chat,
 * more, household, settings*) are core and never gated (T2). Pantry
 * is absent because it is not an SPA route: it is its own page, and
 * its guard lives in pantry.js against the same flag set.
 */
export const ROUTE_FEATURE_MODULES: Readonly<
    Partial<Record<string, FeatureModule>>
> = {
    plan: "plan",
    recipes: "recipes",
    groceries: "groceries",
    cooks: "cooks",
};

/** Chat entry surface → the module that owns it (T3: seed gating). */
export const CHAT_SURFACE_FEATURE_MODULES: Readonly<
    Partial<Record<string, FeatureModule>>
> = {
    meal_plan: "plan",
    pantry: "pantry",
};
