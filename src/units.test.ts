import { test, expect } from "bun:test";
import {
    toGrams,
    fromGrams,
    formatWeight,
    isWeightUnit,
    pickWriteUnit,
    isPlausibleWeightGrams,
    WEIGHT_UNITS,
} from "./units.js";

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
