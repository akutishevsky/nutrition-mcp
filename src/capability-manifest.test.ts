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

    test("every capability declares an explicit ios channel with a basis", () => {
        for (const capability of CAPABILITY_MANIFEST) {
            expect(capability.ios).toBeDefined();
            // IOS-PLATFORM: no verdict without a stated basis — a
            // silently copied Android verdict is exactly what the
            // channel exists to prevent.
            expect(capability.iosBasis.trim().length).toBeGreaterThan(0);
            if (capability.ios.available) {
                expect(capability.ios.entryPoints.length).toBeGreaterThan(0);
            } else {
                expect(capability.ios.coverage).toBe("missing");
                expect(capability.intentionalChannelException).not.toBeNull();
            }
            if (capability.ios.coverage === "partial") {
                expect(capability.iosGap).not.toBeNull();
                expect(capability.iosTargetPr).not.toBeNull();
            }
            if (capability.ios.coverage === "complete") {
                expect(capability.iosGap).toBeNull();
            }
        }
    });

    test("ios channel reuses the app entry points it claims parity with", () => {
        for (const capability of CAPABILITY_MANIFEST) {
            if (capability.ios.coverage === "complete") {
                expect(capability.ios.entryPoints).toEqual(
                    capability.app.entryPoints,
                );
            }
        }
    });
});
