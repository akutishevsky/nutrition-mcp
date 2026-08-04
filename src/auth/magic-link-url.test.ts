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
            "/account/portal",
        );
        expect(safeMagicLinkReturnPath("//evil.example/steal")).toBe(
            "/account/portal",
        );
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
