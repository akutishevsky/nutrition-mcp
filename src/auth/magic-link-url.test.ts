import { describe, expect, test } from "bun:test";
import {
    buildScannerSafeMagicLink,
    safeMagicLinkReturnPath,
} from "./magic-link-url.js";

describe("scanner-safe magic links", () => {
    test("preserves a local OAuth continuation without consuming the token", () => {
        const result = new URL(
            buildScannerSafeMagicLink({
                generatedUrl:
                    "https://munch.example/api/auth/magic-link/verify?token=secret-token&callbackURL=%2Foauth%2Fcontinue%3Fsession_id%3Dabc",
                baseUrl: "https://munch.example",
            }),
        );

        expect(result.pathname).toBe("/connect/confirm");
        expect(result.searchParams.get("token")).toBe("secret-token");
        expect(result.searchParams.get("return_to")).toBe(
            "/oauth/continue?session_id=abc",
        );
    });

    test("rejects external and protocol-relative return targets", () => {
        expect(safeMagicLinkReturnPath("https://evil.example/steal")).toBe(
            "/app",
        );
        expect(safeMagicLinkReturnPath("//evil.example/steal")).toBe("/app");
    });

    test("defaults a missing return target to the signed-in home", () => {
        // The default post-sign-in landing must resolve: the retired
        // "/account/portal" landing answers 404 in production, so the
        // fallback is the app shell's home and nothing else.
        expect(safeMagicLinkReturnPath(undefined)).toBe("/app");
        expect(safeMagicLinkReturnPath("")).toBe("/app");

        const result = new URL(
            buildScannerSafeMagicLink({
                generatedUrl:
                    "https://munch.example/api/auth/magic-link/verify?token=secret-token",
                baseUrl: "https://munch.example",
            }),
        );
        expect(result.searchParams.get("return_to")).toBe("/app");
    });

    test("requires the Better Auth token", () => {
        expect(() =>
            buildScannerSafeMagicLink({
                generatedUrl:
                    "https://munch.example/api/auth/magic-link/verify",
                baseUrl: "https://munch.example",
            }),
        ).toThrow("missing token");
    });
});
