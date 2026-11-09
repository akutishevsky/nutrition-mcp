import { describe, expect, test } from "bun:test";
import {
    householdMonthlyTotalCents,
    paidHouseholdSeatCoverage,
} from "./household-seats.js";

describe("paid household seat policy", () => {
    test("prices the owner at $3.00 plus $2 for each additional member", () => {
        expect(householdMonthlyTotalCents(0)).toBe(300);
        expect(householdMonthlyTotalCents(1)).toBe(500);
        expect(householdMonthlyTotalCents(2)).toBe(700);
        expect(householdMonthlyTotalCents(5)).toBe(1300);
    });

    test("rejects household sizes outside the six-account cap", () => {
        expect(() => householdMonthlyTotalCents(-1)).toThrow();
        expect(() => householdMonthlyTotalCents(6)).toThrow();
    });

    test("fails closed when Stripe has fewer seats than active members", () => {
        expect(paidHouseholdSeatCoverage(0, 1)).toBe(false);
        expect(paidHouseholdSeatCoverage(1, 2)).toBe(false);
        expect(paidHouseholdSeatCoverage(2, 2)).toBe(true);
    });

    test("allows harmless overbilling without granting unjoined users access", () => {
        expect(paidHouseholdSeatCoverage(2, 1)).toBe(true);
        expect(paidHouseholdSeatCoverage(5, 0)).toBe(true);
    });
});
