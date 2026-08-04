import { createHash, timingSafeEqual } from "node:crypto";

const PKCE_VALUE_PATTERN = /^[A-Za-z0-9._~-]{43,128}$/;

export function validateCodeChallenge(value: string): string {
    if (!PKCE_VALUE_PATTERN.test(value)) {
        throw new Error("invalid_code_challenge");
    }
    return value;
}

export function validateCodeVerifier(value: string): string {
    if (!PKCE_VALUE_PATTERN.test(value)) {
        throw new Error("invalid_code_verifier");
    }
    return value;
}

export function codeChallengeForVerifier(verifier: string): string {
    validateCodeVerifier(verifier);
    return createHash("sha256").update(verifier, "ascii").digest("base64url");
}

export function codeVerifierMatches(
    verifier: string,
    expectedChallenge: string,
): boolean {
    const actual = Buffer.from(codeChallengeForVerifier(verifier), "ascii");
    const expected = Buffer.from(
        validateCodeChallenge(expectedChallenge),
        "ascii",
    );
    return (
        actual.length === expected.length && timingSafeEqual(actual, expected)
    );
}
