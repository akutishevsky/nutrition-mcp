import { describe, expect, test } from "bun:test";
import {
    CHAT_SURFACE_FEATURE_MODULES,
    DEFAULT_FEATURE_MODULES,
    FEATURE_MODULES,
    ROUTE_FEATURE_MODULES,
    featureModuleEnabled,
    featureModuleOffNotice,
    featureModulePatch,
    isFeatureModule,
    normalizeFeatureModules,
} from "./feature-modules.js";

describe("feature module contract (brief addendum 10)", () => {
    test("the optional set is exactly the five named modules", () => {
        expect([...FEATURE_MODULES]).toEqual([
            "plan",
            "recipes",
            "groceries",
            "pantry",
            "cooks",
        ]);
        expect(DEFAULT_FEATURE_MODULES).toEqual({
            plan: true,
            recipes: true,
            groceries: true,
            pantry: true,
            cooks: true,
        });
    });

    test("normalization: only an explicit false turns a module off", () => {
        expect(normalizeFeatureModules(null)).toEqual(DEFAULT_FEATURE_MODULES);
        expect(normalizeFeatureModules(undefined)).toEqual(
            DEFAULT_FEATURE_MODULES,
        );
        expect(normalizeFeatureModules("junk")).toEqual(
            DEFAULT_FEATURE_MODULES,
        );
        expect(normalizeFeatureModules({ pantry: false })).toEqual({
            ...DEFAULT_FEATURE_MODULES,
            pantry: false,
        });
        // Truthy non-booleans never hide a module by accident.
        expect(normalizeFeatureModules({ plan: 0, cooks: "false" })).toEqual(
            DEFAULT_FEATURE_MODULES,
        );
    });

    test("patch extraction keeps only recognized boolean fields", () => {
        expect(
            featureModulePatch({ groceries: false, plan: true, other: 1 }),
        ).toEqual({ groceries: false, plan: true });
        expect(featureModulePatch({ other: 1 })).toBeNull();
        expect(featureModulePatch({ plan: "no" })).toBeNull();
        expect(featureModulePatch(null)).toBeNull();
        expect(featureModulePatch([true])).toBeNull();
    });

    test("route map gates only module routes — core is never gated (T2)", () => {
        expect(ROUTE_FEATURE_MODULES).toEqual({
            plan: "plan",
            recipes: "recipes",
            groceries: "groceries",
            cooks: "cooks",
        });
        for (const core of [
            "today",
            "log",
            "trends",
            "foods",
            "chat",
            "more",
            "household",
            "settings",
        ]) {
            expect(ROUTE_FEATURE_MODULES[core]).toBeUndefined();
        }
    });

    test("chat surface map: meal_plan and pantry are module-owned", () => {
        expect(CHAT_SURFACE_FEATURE_MODULES).toEqual({
            meal_plan: "plan",
            pantry: "pantry",
        });
        expect(CHAT_SURFACE_FEATURE_MODULES.today).toBeUndefined();
        expect(CHAT_SURFACE_FEATURE_MODULES.insights).toBeUndefined();
    });

    test("the off notice names the module and the way back (T3)", () => {
        expect(featureModuleOffNotice("pantry")).toBe(
            "Pantry is turned off — re-enable it in Settings",
        );
        expect(featureModuleOffNotice("plan")).toBe(
            "Meal Plan is turned off — re-enable it in Settings",
        );
    });

    test("helpers", () => {
        expect(isFeatureModule("cooks")).toBe(true);
        expect(isFeatureModule("today")).toBe(false);
        expect(isFeatureModule(null)).toBe(false);
        const features = { ...DEFAULT_FEATURE_MODULES, cooks: false };
        expect(featureModuleEnabled(features, "cooks")).toBe(false);
        expect(featureModuleEnabled(features, "plan")).toBe(true);
    });
});
