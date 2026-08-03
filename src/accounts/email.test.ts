import { describe, expect, test } from "bun:test";
import { normalizeAccountEmail } from "./email.js";

describe("account email normalization", () => {
    test("trims and lowercases addresses", () => {
        expect(normalizeAccountEmail("  User@Example.COM ")).toBe(
            "user@example.com",
        );
    });

    test("rejects malformed addresses", () => {
        expect(() => normalizeAccountEmail("not-an-email")).toThrow();
        expect(() => normalizeAccountEmail("a@b")).toThrow();
    });
});
