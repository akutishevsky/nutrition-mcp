import { describe, expect, test } from "bun:test";
import {
    codeChallengeForVerifier,
    codeVerifierMatches,
    validateCodeChallenge,
    validateCodeVerifier,
} from "./pkce.js";

describe("OAuth PKCE", () => {
    const verifier = "A".repeat(43);

    test("derives and verifies an S256 challenge", () => {
        const challenge = codeChallengeForVerifier(verifier);

        expect(validateCodeVerifier(verifier)).toBe(verifier);
        expect(validateCodeChallenge(challenge)).toBe(challenge);
        expect(codeVerifierMatches(verifier, challenge)).toBe(true);
        expect(codeVerifierMatches(`${verifier}B`, challenge)).toBe(false);
    });

    test("rejects short and non-url-safe values", () => {
        expect(() => validateCodeVerifier("short")).toThrow(
            "invalid_code_verifier",
        );
        expect(() => validateCodeChallenge("A".repeat(42))).toThrow(
            "invalid_code_challenge",
        );
        expect(() => validateCodeVerifier(`${"A".repeat(42)}+`)).toThrow();
    });
});
