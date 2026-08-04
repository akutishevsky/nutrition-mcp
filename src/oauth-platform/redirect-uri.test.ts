import { describe, expect, test } from "bun:test";
import {
    redirectUriRegistered,
    validateRedirectUri,
    validateRedirectUris,
} from "./redirect-uri.js";

describe("OAuth redirect URI validation", () => {
    test("accepts HTTPS and loopback development callbacks", () => {
        expect(validateRedirectUri("https://chatgpt.com/callback")).toBe(
            "https://chatgpt.com/callback",
        );
        expect(validateRedirectUri("http://127.0.0.1:4567/callback")).toBe(
            "http://127.0.0.1:4567/callback",
        );
    });

    test("rejects insecure remote, credentialed, and fragment URIs", () => {
        expect(() =>
            validateRedirectUri("http://example.com/callback"),
        ).toThrow();
        expect(() =>
            validateRedirectUri("https://user:pass@example.com/callback"),
        ).toThrow();
        expect(() =>
            validateRedirectUri("https://example.com/callback#x"),
        ).toThrow();
    });

    test("uses exact registered URI matching", () => {
        const registered = validateRedirectUris([
            "https://example.com/oauth/callback",
        ]);

        expect(
            redirectUriRegistered(
                "https://example.com/oauth/callback",
                registered,
            ),
        ).toBe(true);
        expect(
            redirectUriRegistered(
                "https://example.com/oauth/callback/",
                registered,
            ),
        ).toBe(false);
    });
});
