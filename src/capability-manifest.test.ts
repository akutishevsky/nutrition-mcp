import { describe, expect, test } from "bun:test";
import {
    assertCapabilityManifest,
    CAPABILITY_MANIFEST,
    MCP_TOOL_CAPABILITY_MAP,
} from "./capability-manifest.js";

describe("cross-surface capability manifest", () => {
    test("has no internally inconsistent contracts", () => {
        expect(assertCapabilityManifest()).toEqual([]);
    });

    test("documents every currently exposed MCP tool", () => {
        const registered = Object.keys(MCP_TOOL_CAPABILITY_MAP).sort();
        const documented = CAPABILITY_MANIFEST.flatMap(
            (capability) => capability.mcp.entryPoints,
        ).sort();
        expect(documented).toEqual(registered);
    });

    test("does not mistake channel-specific website capabilities for parity gaps", () => {
        for (const capability of CAPABILITY_MANIFEST.filter(
            (item) => item.intentionalChannelException,
        )) {
            expect(capability.gap).toBeNull();
            expect(capability.web.coverage).toBe("complete");
        }
    });

    test("every capability declares an explicit app channel", () => {
        for (const capability of CAPABILITY_MANIFEST) {
            expect(capability.app).toBeDefined();
            if (capability.app.available) {
                expect(capability.app.entryPoints.length).toBeGreaterThan(0);
            } else {
                // An unavailable app channel is only honest as a declared
                // website-only exception, never a silent omission.
                expect(capability.app.coverage).toBe("missing");
                expect(capability.intentionalChannelException).not.toBeNull();
            }
        }
    });

    test("app channel reuses the web entry points it claims parity with", () => {
        for (const capability of CAPABILITY_MANIFEST) {
            if (capability.app.coverage === "complete") {
                expect(capability.app.entryPoints).toEqual(
                    capability.web.entryPoints,
                );
            }
        }
    });
});
