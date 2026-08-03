import { describe, expect, test } from "bun:test";
import { normalizeSavedFoodLabel } from "./repository.js";

describe("saved food labels", () => {
    test("normalizes case, accents, punctuation, and whitespace", () => {
        expect(normalizeSavedFoodLabel("  Café-au-Lait  Yogurt! ")).toBe(
            "cafe au lait yogurt",
        );
    });

    test("keeps deterministic words for uniqueness and lookup", () => {
        expect(normalizeSavedFoodLabel("My Usual PB&J")).toBe("my usual pb j");
        expect(normalizeSavedFoodLabel("my-usual   pb j")).toBe("my usual pb j");
    });
});
