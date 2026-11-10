import { describe, expect, test } from "bun:test";
import { fromGrams } from "../src/units.js";
import {
    GRAMS_PER_POUND,
    displayWeightUnit,
    savedWeightUnit,
    weightFromGrams,
} from "./weight-display.js";

describe("web weight display units", () => {
    test("preserves valid saved units and requires an explicit write unit when unset", () => {
        expect(savedWeightUnit("lb")).toBe("lb");
        expect(savedWeightUnit("kg")).toBe("kg");
        expect(savedWeightUnit(null)).toBeNull();
        expect(savedWeightUnit("oz")).toBeNull();
    });

    test("defaults display-only reads to kilograms when no preference exists", () => {
        expect(displayWeightUnit(null)).toBe("kg");
        expect(displayWeightUnit(undefined)).toBe("kg");
    });

    test("converts canonical grams to the selected display unit", () => {
        expect(weightFromGrams(100_000, "kg")).toBe(100);
        expect(weightFromGrams(100 * GRAMS_PER_POUND, "lb")).toBeCloseTo(
            100,
            8,
        );
    });

    test("web and server weight conversions stay in parity", () => {
        for (const grams of [50_000, 86_183, 100_000, 150_000]) {
            expect(weightFromGrams(grams, "kg")).toBeCloseTo(
                fromGrams(grams, "kg"),
                1,
            );
            expect(weightFromGrams(grams, "lb")).toBeCloseTo(
                fromGrams(grams, "lb"),
                1,
            );
        }
    });

    test("dashboard and patched dialog are wired to the shared preference contract", async () => {
        const app = await Bun.file("public/app.js").text();
        const patches = await Bun.file("public/app-patches.js").text();

        expect(app).toContain(
            "weightFromGrams(latestWeight.weight_g, weightUnit)",
        );
        expect(app).toContain(
            'metricCard("Weight", latestWeightValue, ` ${weightUnit}`, null, false, { key: "today-weight", body: weightMetricDetail(data.weight, weightUnit) })',
        );
        expect(app).not.toContain("latestWeight.weight_g / 1000");
        expect(patches).toContain("fetchPatchedPreferredWeightUnit");
        expect(patches).not.toContain('?.value || "lb"');
        expect(patches).toContain('name="unit" required');
    });
});
