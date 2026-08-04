import { describe, expect, test } from "bun:test";
import { requestHasSameOriginEvidence, requestOriginMatches } from "./csrf.js";

describe("same-origin request protection", () => {
    test("accepts the configured application origin", () => {
        expect(
            requestOriginMatches(
                "https://munch.example",
                "https://munch.example/account",
            ),
        ).toBe(true);
    });

    test("accepts the public origin derived through a reverse proxy", () => {
        expect(
            requestOriginMatches(
                "https://munch.business",
                "https://internal.example",
                "https://munch.business",
            ),
        ).toBe(true);
    });

    test("accepts duplicated identical origins combined by a proxy", () => {
        expect(
            requestOriginMatches(
                "https://munch.business, https://munch.business",
                "https://munch.business",
            ),
        ).toBe(true);
    });

    test("accepts opaque browser origin with verified same-origin metadata", () => {
        expect(
            requestHasSameOriginEvidence({
                requestOrigin: "null",
                configuredBaseUrl: "https://munch.business",
                requestBaseUrl: "https://munch.business",
                secFetchSite: "same-origin",
            }),
        ).toBe(true);
        expect(
            requestHasSameOriginEvidence({
                requestOrigin: undefined,
                configuredBaseUrl: "https://munch.business",
                requestBaseUrl: "https://munch.business",
                secFetchSite: "same-origin",
            }),
        ).toBe(true);
    });

    test("rejects foreign, conflicting, and cross-site evidence", () => {
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
        expect(
            requestOriginMatches(
                "https://munch.business, https://attacker.example",
                "https://munch.business",
            ),
        ).toBe(false);
        expect(
            requestHasSameOriginEvidence({
                requestOrigin: "https://attacker.example",
                configuredBaseUrl: "https://munch.business",
                requestBaseUrl: "https://munch.business",
                secFetchSite: "same-origin",
            }),
        ).toBe(false);
        expect(
            requestHasSameOriginEvidence({
                requestOrigin: "null",
                configuredBaseUrl: "https://munch.business",
                requestBaseUrl: "https://munch.business",
                secFetchSite: "cross-site",
            }),
        ).toBe(false);
        expect(
            requestHasSameOriginEvidence({
                requestOrigin: undefined,
                configuredBaseUrl: "https://munch.business",
                requestBaseUrl: "https://attacker.example",
                secFetchSite: "same-origin",
            }),
        ).toBe(false);
    });
});
