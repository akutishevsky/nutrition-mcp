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

    test("consent carries the Premium entitlement gate without coupling to Stripe checkout", async () => {
        // Amendment D (2026-11-09) supersedes the old no-entitlement stance
        // for this route: MCP access is part of Premium, so consent must
        // state that plainly and refuse approval for a Free account. What
        // still must never happen here is a purchase: no checkout coupling.
        const source = await Bun.file(
            new URL("./connect-routes.ts", import.meta.url),
        ).text();
        expect(source).not.toContain("checkout-service");
        expect(source).not.toContain("createCheckoutForUser");
        expect(source).not.toContain("decideEntitlement");
        expect(source).not.toContain("getSubscriptionSnapshot");
        expect(source).toContain("resolveMunchCapabilitiesSafe");
        expect(source).toContain("MCP access is part of Premium");
        expect(source).toContain("Connected Munch account");
    });
});
