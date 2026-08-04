import { describe, expect, test } from "bun:test";
import { boundedOAuthQuery, signedOAuthQuery } from "./connect-routes.js";

describe("Better Auth consent continuation", () => {
    test("preserves the signed authorization query byte-for-byte", () => {
        const raw =
            "response_type=code&client_id=client-1&scope=nutrition.read+nutrition.write&ba_param=scope&ba_param=state&sig=abc%2B123%3D";
        expect(
            signedOAuthQuery(`https://munch.test/connect/consent?${raw}`),
        ).toBe(raw);
    });

    test("uses an explicitly nested oauth_query without reserializing it", () => {
        const nested =
            "client_id=client-1&ba_param=scope&ba_param=scope&sig=a%2Bb%3D";
        const url = new URL("https://munch.test/connect/consent");
        url.searchParams.set("client_id", "client-1");
        url.searchParams.set("scope", "nutrition.read");
        url.searchParams.set("oauth_query", nested);
        expect(signedOAuthQuery(url.toString())).toBe(nested);
    });

    test("rejects missing, non-string, and oversized continuations", () => {
        expect(boundedOAuthQuery(undefined)).toBeUndefined();
        expect(boundedOAuthQuery(123)).toBeUndefined();
        expect(boundedOAuthQuery("")).toBeUndefined();
        expect(boundedOAuthQuery("x".repeat(12_001))).toBeUndefined();
    });

    test("does not couple the consent route to Stripe or entitlements", async () => {
        const source = await Bun.file(
            new URL("./connect-routes.ts", import.meta.url),
        ).text();
        expect(source).not.toContain("checkout-service");
        expect(source).not.toContain("createCheckoutForUser");
        expect(source).not.toContain("decideEntitlement");
        expect(source).not.toContain("getSubscriptionSnapshot");
        expect(source).not.toContain("Premium");
    });
});
