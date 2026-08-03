import { describe, expect, test } from "bun:test";
import { requestOriginMatches } from "./csrf.js";

describe("same-origin request protection", () => {
    test("accepts the configured application origin", () => {
        expect(
            requestOriginMatches(
                "https://munch.example",
                "https://munch.example/account",
            ),
        ).toBe(true);
    });

    test("rejects missing, malformed, and foreign origins", () => {
        expect(requestOriginMatches(undefined, "https://munch.example")).toBe(
            false,
        );
        expect(requestOriginMatches("not-a-url", "https://munch.example")).toBe(
            false,
        );
        expect(
            requestOriginMatches(
                "https://attacker.example",
                "https://munch.example",
            ),
        ).toBe(false);
    });
});
