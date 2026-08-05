import { describe, expect, test } from "bun:test";
import { resolveMcpAuthMode } from "./mcp-auth-mode.js";

describe("MCP authentication mode selection", () => {
    test("prioritizes Better Auth", () => {
        expect(resolveMcpAuthMode(true, true)).toBe("better-auth");
    });
    test("uses Railway OAuth when Better Auth is disabled", () => {
        expect(resolveMcpAuthMode(false, true)).toBe("railway");
    });
    test("rejects no supported auth backend", () => {
        expect(() => resolveMcpAuthMode(false, false)).toThrow();
    });
});
