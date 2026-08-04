import { describe, expect, test } from "bun:test";
import { applyHistoryDateRange } from "./mcp.js";

describe("conversational history window", () => {
    test("leaves Premium date ranges unchanged", () => {
        expect(
            applyHistoryDateRange(
                "2025-01-01",
                "2026-08-04",
                "2026-08-04",
                null,
            ),
        ).toEqual({
            requestedStart: "2025-01-01",
            requestedEnd: "2026-08-04",
            effectiveStart: "2025-01-01",
            effectiveEnd: "2026-08-04",
            cutoff: null,
            applied: false,
            empty: false,
        });
    });

    test("uses an inclusive 30-day Free window", () => {
        const result = applyHistoryDateRange(
            "2026-06-01",
            "2026-08-04",
            "2026-08-04",
            30,
        );
        expect(result.cutoff).toBe("2026-07-06");
        expect(result.effectiveStart).toBe("2026-07-06");
        expect(result.effectiveEnd).toBe("2026-08-04");
        expect(result.applied).toBe(true);
        expect(result.empty).toBe(false);
    });

    test("reports a range that ends before the cutoff as empty", () => {
        const result = applyHistoryDateRange(
            "2026-01-01",
            "2026-07-05",
            "2026-08-04",
            30,
        );
        expect(result.cutoff).toBe("2026-07-06");
        expect(result.empty).toBe(true);
    });

    test("does not alter a date on the cutoff", () => {
        const result = applyHistoryDateRange(
            "2026-07-06",
            "2026-07-06",
            "2026-08-04",
            30,
        );
        expect(result.applied).toBe(false);
        expect(result.empty).toBe(false);
    });
});
