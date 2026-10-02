import { test, expect } from "bun:test";
import {
    toGrams,
    fromGrams,
    formatWeight,
    isWeightUnit,
    pickWriteUnit,
    isPlausibleWeightGrams,
    toStoredInteger,
    WEIGHT_UNITS,
    toMillimetres,
    fromMillimetres,
    formatLength,
    pickLengthWriteUnit,
    isLengthUnit,
    isBodyMeasurementKind,
    isPlausibleLengthMm,
    assertPlausibleLength,
    measurementLabel,
    BODY_MEASUREMENT_KINDS,
    PLAUSIBLE_LENGTH_MM,
    LENGTH_UNITS,
} from "./units.js";
import { ToolError } from "./errors.js";

test("toGrams converts kg to integer grams", () => {
    expect(toGrams(75, "kg")).toBe(75000);
    expect(toGrams(75.5, "kg")).toBe(75500);
    expect(toGrams(0.1, "kg")).toBe(100);
});

test("toGrams converts lb to integer grams using the exact pound", () => {
    // 1 lb = 453.59237 g -> rounds to 454
    expect(toGrams(1, "lb")).toBe(454);
    // 165 lb = 74842.74 g
    expect(toGrams(165, "lb")).toBe(74843);
    expect(toGrams(200, "lb")).toBe(90718);
});

test("fromGrams converts grams back, rounded to 1 decimal", () => {
    expect(fromGrams(75000, "kg")).toBe(75);
    expect(fromGrams(75500, "kg")).toBe(75.5);
    expect(fromGrams(75540, "kg")).toBe(75.5);
    expect(fromGrams(454, "lb")).toBe(1);
});

test("kg round-trips through grams exactly at 1-decimal precision", () => {
    for (const kg of [50, 62.3, 75.5, 90.1, 120.9]) {
        expect(fromGrams(toGrams(kg, "kg"), "kg")).toBe(kg);
    }
});

test("lb round-trips through grams at 1-decimal precision", () => {
    for (const lb of [110, 154.3, 165, 200.7]) {
        expect(fromGrams(toGrams(lb, "lb"), "lb")).toBe(lb);
    }
});

test("lb->kg reference conversion is correct", () => {
    // 165 lb -> stored grams -> read as kg ~= 74.8
    const grams = toGrams(165, "lb");
    expect(fromGrams(grams, "kg")).toBe(74.8);
});

test("toGrams rejects non-finite values", () => {
    expect(() => toGrams(NaN, "kg")).toThrow();
    expect(() => toGrams(Infinity, "kg")).toThrow();
});

test("formatWeight renders unit-suffixed string", () => {
    expect(formatWeight(75500, "kg")).toBe("75.5 kg");
    expect(formatWeight(74843, "lb")).toBe("165 lb");
});

test("pickWriteUnit prefers the explicit unit over the saved preference", () => {
    expect(pickWriteUnit("lb", "kg")).toBe("lb");
    expect(pickWriteUnit("kg", "lb")).toBe("kg");
});

test("pickWriteUnit falls back to the saved preference when no explicit unit", () => {
    expect(pickWriteUnit(undefined, "lb")).toBe("lb");
    expect(pickWriteUnit(undefined, "kg")).toBe("kg");
});

test("pickWriteUnit throws when no explicit unit and no preference (never guesses)", () => {
    expect(() => pickWriteUnit(undefined, null)).toThrow(
        /No weight unit given and no preference set/,
    );
});

test("isPlausibleWeightGrams accepts human weights and rejects magnitude errors", () => {
    expect(isPlausibleWeightGrams(toGrams(75, "kg"))).toBe(true);
    expect(isPlausibleWeightGrams(toGrams(165, "lb"))).toBe(true);
    expect(isPlausibleWeightGrams(toGrams(20, "kg"))).toBe(true); // floor
    expect(isPlausibleWeightGrams(toGrams(500, "kg"))).toBe(true); // ceiling
    // value typed in grams (75000 "kg")
    expect(isPlausibleWeightGrams(toGrams(75000, "kg"))).toBe(false);
    // extra digit
    expect(isPlausibleWeightGrams(toGrams(750, "kg"))).toBe(false);
    // sub-unit typo rounding to 0 g (covers the >0 DB check case)
    expect(isPlausibleWeightGrams(toGrams(0.0001, "kg"))).toBe(false);
    expect(isPlausibleWeightGrams(NaN)).toBe(false);
});

test("isWeightUnit guards kg/lb only", () => {
    expect(isWeightUnit("kg")).toBe(true);
    expect(isWeightUnit("lb")).toBe(true);
    expect(isWeightUnit("st")).toBe(false);
    expect(isWeightUnit("")).toBe(false);
    expect(isWeightUnit(undefined)).toBe(false);
    for (const u of WEIGHT_UNITS) expect(isWeightUnit(u)).toBe(true);
});

test("toStoredInteger rounds fractional values for the integer columns", () => {
    // The shipped bug this guards: a Cronometer "Energy (kcal)" cell like
    // 388.54 reached an `integer` column and Postgres rejected the whole row
    // with 22P02, so most of a backfill failed. Rounding, not rejecting.
    expect(toStoredInteger(388.54)).toBe(389);
    expect(toStoredInteger(2363.25)).toBe(2363);
    expect(toStoredInteger(78.08)).toBe(78);
    expect(toStoredInteger(0.5)).toBe(1);
    // Whole numbers must pass through byte-identical: they are what every
    // already-stored row was hashed from, so a shifted value here would break
    // idempotency-key dedup for every past meal.
    expect(toStoredInteger(300)).toBe(300);
    expect(toStoredInteger(0)).toBe(0);
});

// ---------- Length (body measurements) ----------

test("toMillimetres converts cm and in to integer millimetres", () => {
    expect(toMillimetres(80, "cm")).toBe(800);
    expect(toMillimetres(32, "in")).toBe(813); // 812.8 rounds up
    expect(toMillimetres(0.1, "cm")).toBe(1);
});

test("toMillimetres rejects non-finite values with a ToolError", () => {
    for (const bad of [NaN, Infinity, -Infinity]) {
        expect(() => toMillimetres(bad, "cm")).toThrow(ToolError);
        expect(() => toMillimetres(bad, "in")).toThrow(/Invalid length value/);
    }
});

test("fromMillimetres / formatLength render at 1 decimal", () => {
    expect(formatLength(800, "cm")).toBe("80 cm");
    expect(formatLength(813, "in")).toBe("32 in");
    for (const cm of [35.5, 80, 102.3]) {
        expect(fromMillimetres(toMillimetres(cm, "cm"), "cm")).toBe(cm);
    }
    for (const inches of [12.5, 31.5, 40.2]) {
        expect(fromMillimetres(toMillimetres(inches, "in"), "in")).toBe(inches);
    }
});

test("pickLengthWriteUnit: explicit > preference > refuse", () => {
    expect(pickLengthWriteUnit("in", "cm")).toBe("in");
    expect(pickLengthWriteUnit("cm", null)).toBe("cm");
    expect(pickLengthWriteUnit(undefined, "in")).toBe("in");
    expect(() => pickLengthWriteUnit(undefined, null)).toThrow(ToolError);
    expect(() => pickLengthWriteUnit(undefined, null)).toThrow(
        /No length unit given and no preference set/,
    );
});

test("isLengthUnit guards cm/in only; isBodyMeasurementKind the nine sites", () => {
    expect(isLengthUnit("cm")).toBe(true);
    expect(isLengthUnit("in")).toBe(true);
    expect(isLengthUnit("mm")).toBe(false);
    expect(isLengthUnit("")).toBe(false);
    expect(isLengthUnit(undefined)).toBe(false);
    for (const u of LENGTH_UNITS) expect(isLengthUnit(u)).toBe(true);
    expect(BODY_MEASUREMENT_KINDS).toHaveLength(9);
    for (const k of BODY_MEASUREMENT_KINDS) {
        expect(isBodyMeasurementKind(k)).toBe(true);
    }
    expect(isBodyMeasurementKind("bicep")).toBe(false);
});

test("isPlausibleLengthMm accepts each site's bounds and rejects just outside", () => {
    for (const k of BODY_MEASUREMENT_KINDS) {
        const { min, max } = PLAUSIBLE_LENGTH_MM[k];
        expect(isPlausibleLengthMm(k, min)).toBe(true);
        expect(isPlausibleLengthMm(k, max)).toBe(true);
        expect(isPlausibleLengthMm(k, min - 1)).toBe(false);
        expect(isPlausibleLengthMm(k, max + 1)).toBe(false);
        expect(isPlausibleLengthMm(k, NaN)).toBe(false);
    }
    expect(isPlausibleLengthMm("waist", 8000)).toBe(false);
});

test("assertPlausibleLength returns mm in range and explains out-of-range values", () => {
    expect(assertPlausibleLength("waist", 80, "cm")).toBe(800);
    expect(assertPlausibleLength("neck", 15, "in")).toBe(381);

    // Out of range in both units: no other-unit hint.
    let msg = "";
    try {
        assertPlausibleLength("upper_arm", 250, "cm");
    } catch (e) {
        expect(e).toBeInstanceOf(ToolError);
        msg = (e as Error).message;
    }
    expect(msg).toContain(
        "Upper arm 250 cm is outside the plausible range for this site",
    );
    expect(msg).not.toContain("As 250");

    // 45 in is out of range for a neck, 45 cm is in: hint at cm.
    expect(() => assertPlausibleLength("neck", 45, "in")).toThrow(
        /As 45 cm it would be in range/,
    );
    // 10 cm is out of range for a calf, 10 in is in: hint at in.
    expect(() => assertPlausibleLength("calf", 10, "cm")).toThrow(
        /As 10 in it would be in range/,
    );
});

test("assertPlausibleLength messages carry no article before the site", () => {
    // Regression: an earlier draft read "for a upper arm".
    for (const k of BODY_MEASUREMENT_KINDS) {
        for (const unit of LENGTH_UNITS) {
            try {
                assertPlausibleLength(k, 9999, unit);
                throw new Error("expected a throw");
            } catch (e) {
                expect((e as Error).message).not.toContain("for a ");
            }
        }
    }
});

test("measurementLabel turns a kind into a capitalised label", () => {
    expect(measurementLabel("upper_arm")).toBe("Upper arm");
    expect(measurementLabel("waist")).toBe("Waist");
});

test("BODY_MEASUREMENT_KINDS matches the migration's kind check", async () => {
    const sql = await Bun.file(
        new URL(
            "../supabase/migrations/20261002120000_body_measurements.sql",
            import.meta.url,
        ),
    ).text();
    const m = sql.match(/kind in \(([^)]*)\)/);
    expect(m).not.toBeNull();
    const fromSql = [...m![1]!.matchAll(/'([a-z_]+)'/g)].map((x) => x[1]!);
    expect([...fromSql].sort()).toEqual([...BODY_MEASUREMENT_KINDS].sort());
});
