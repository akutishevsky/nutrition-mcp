import { describe, expect, test } from "bun:test";
import { safeLocalRedirectPath } from "./redirect.js";

describe("safe local redirects", () => {
    test("keeps local paths and queries", () => {
        expect(safeLocalRedirectPath("/oauth/continue?session_id=abc")).toBe(
            "/oauth/continue?session_id=abc",
        );
    });

    test("rejects protocol-relative and remote URLs", () => {
        expect(safeLocalRedirectPath("//attacker.example/path")).toBe(
            "/account",
        );
        expect(safeLocalRedirectPath("https://attacker.example/path")).toBe(
            "/account",
        );
    });
});
