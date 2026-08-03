import { describe, expect, test } from "bun:test";
import {
    hashOpaqueToken,
    issueOpaqueToken,
    tokenHashMatches,
} from "./tokens.js";

describe("opaque token utilities", () => {
    test("issues a token and stores only its deterministic hash", () => {
        const issued = issueOpaqueToken();

        expect(issued.token.length).toBeGreaterThan(32);
        expect(issued.hash).toEqual(hashOpaqueToken(issued.token));
        expect(tokenHashMatches(issued.token, issued.hash)).toBe(true);
        expect(tokenHashMatches(`${issued.token}x`, issued.hash)).toBe(false);
    });

    test("rejects weak token lengths", () => {
        expect(() => issueOpaqueToken(16)).toThrow();
    });
});
