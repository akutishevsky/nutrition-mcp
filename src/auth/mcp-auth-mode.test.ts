import { describe, expect, test } from "bun:test";
import { resolveMcpAuthMode } from "./mcp-auth-mode.js";

describe("MCP authentication mode selection", () => {
    test("prioritizes Better Auth when legacy Railway auth remains enabled", () => {
        expect(resolveMcpAuthMode(true, true)).toBe("better-auth");
    });

    test("uses Railway auth only when Better Auth is disabled", () => {
        expect(resolveMcpAuthMode(false, true)).toBe("railway");
    });

    test("falls back to inherited bearer validation when both are disabled", () => {
        expect(resolveMcpAuthMode(false, false)).toBe("inherited");
    });
});
