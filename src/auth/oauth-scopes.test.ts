import { describe, expect, test } from "bun:test";
import {
    MUNCH_DEFAULT_OAUTH_SCOPES,
    MUNCH_OAUTH_SCOPES,
    describeOAuthScope,
} from "./oauth-scopes.js";

describe("Munch OAuth scopes", () => {
    test("provider accepts openid alongside the nutrition scopes", () => {
        expect([...MUNCH_OAUTH_SCOPES]).toEqual([
            "openid",
            "nutrition.read",
            "nutrition.write",
            "offline_access",
        ]);
    });

    test("default registration grant stays nutrition-only", () => {
        // openid is accepted when a client asks for it, but a scope-less
        // registration must not silently gain it.
        expect([...MUNCH_DEFAULT_OAUTH_SCOPES]).toEqual([
            "nutrition.read",
            "nutrition.write",
            "offline_access",
        ]);
    });

    test("consent page has a human-readable label for openid", () => {
        const label = describeOAuthScope("openid");
        expect(label).not.toBe("openid");
        expect(label.length).toBeGreaterThan(0);
    });
});
