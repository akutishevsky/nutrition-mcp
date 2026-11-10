import { describe, expect, test } from "bun:test";
import {
    boundedOAuthQuery,
    oauthConsentContinuationPath,
    signInOAuthQuery,
    signInPageHtml,
    signedOAuthQuery,
} from "./connect-routes.js";

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

    test("sign-in arrival recovers the raw authorize detour query", () => {
        // The OAuth provider plugin redirects an unauthenticated
        // authorize request to the login page with the signed query as
        // the page's own query string — the shape a first-time connect
        // actually arrives in. Losing it was the 2026-11-10 defect: the
        // page rendered without a continuation, and the Google callback
        // fell back to the default landing instead of consent.
        const raw =
            "response_type=code&client_id=client-1&redirect_uri=https%3A%2F%2Fclient.example%2Fcallback&scope=openid+nutrition.read&state=state-1&code_challenge=abc&code_challenge_method=S256&exp=9999999999&sig=abc%2B123%3D";
        expect(
            signInOAuthQuery(`https://munch.test/connect/sign-in?${raw}`),
        ).toBe(raw);
    });

    test("sign-in arrival prefers an explicitly nested oauth_query", () => {
        const nested = "client_id=client-1&scope=nutrition.read&sig=a%2Bb%3D";
        const url = new URL("https://munch.test/connect/sign-in");
        url.searchParams.set("oauth_query", nested);
        expect(signInOAuthQuery(url.toString())).toBe(nested);
    });

    test("sign-in arrival does not invent a continuation for ordinary visits", () => {
        // /account/login redirects here with only a return target.
        expect(
            signInOAuthQuery(
                "https://munch.test/connect/sign-in?return_to=%2Fapp",
            ),
        ).toBeUndefined();
        expect(
            signInOAuthQuery("https://munch.test/connect/sign-in"),
        ).toBeUndefined();
        // An unsigned lookalike is not an authorize detour.
        expect(
            signInOAuthQuery(
                "https://munch.test/connect/sign-in?client_id=client-1&scope=nutrition.read",
            ),
        ).toBeUndefined();
    });

    test("magic-link continuation addresses the consent page", () => {
        const oauthQuery =
            "response_type=code&client_id=client-1&scope=openid+nutrition.read&sig=abc%2B123%3D";
        const path = oauthConsentContinuationPath(oauthQuery);
        expect(path).not.toBeNull();
        const url = new URL(path!, "https://munch.test");
        expect(url.pathname).toBe("/connect/consent");
        expect(url.searchParams.get("client_id")).toBe("client-1");
        expect(url.searchParams.get("scope")).toBe("openid nutrition.read");
        // The signed query survives the nesting byte-for-byte.
        expect(url.searchParams.get("oauth_query")).toBe(oauthQuery);
    });

    test("magic-link continuation refuses an unaddressable query", () => {
        expect(
            oauthConsentContinuationPath("scope=nutrition.read&sig=abc"),
        ).toBeNull();
        expect(
            oauthConsentContinuationPath("client_id=client-1&sig=abc"),
        ).toBeNull();
    });

    test("sign-in page hides Google until the web client is configured", () => {
        const html = signInPageHtml({
            returnTo: "/app",
            googleConfigured: false,
        });
        expect(html).toContain("Send sign-in link");
        expect(html).not.toContain("Continue with Google");
        expect(html).not.toContain("data-social-sign-in");
        expect(html).not.toContain("/api/auth/sign-in/social");
    });

    test("sign-in page renders the Google control once configured", () => {
        const html = signInPageHtml({
            returnTo: "/app",
            googleConfigured: true,
        });
        expect(html).toContain("Continue with Google");
        expect(html).toContain('data-social-path="/api/auth/sign-in/social"');
        expect(html).toContain("&quot;callbackURL&quot;:&quot;/app&quot;");
        expect(html).toContain(
            "&quot;errorCallbackURL&quot;:&quot;/connect/error&quot;",
        );
        // The magic-link flow stays exactly as it was beside it.
        expect(html).toContain("Send sign-in link");
    });

    test("sign-in page hides Apple until the provider is configured (S6 slice 10)", () => {
        const html = signInPageHtml({
            returnTo: "/app",
            googleConfigured: true,
            appleConfigured: false,
        });
        expect(html).toContain("Continue with Google");
        expect(html).not.toContain("Continue with Apple");
        expect(html).not.toContain("&quot;provider&quot;:&quot;apple&quot;");
    });

    test("sign-in page renders the Apple control beside Google once configured", () => {
        const html = signInPageHtml({
            returnTo: "/app",
            googleConfigured: true,
            appleConfigured: true,
        });
        expect(html).toContain("Continue with Apple");
        expect(html).toContain('class="button button-apple"');
        expect(html).toContain("&quot;provider&quot;:&quot;apple&quot;");
        // Exactly two social controls, served by the one wiring script.
        expect(
            html.match(/data-social-sign-in data-social-path/g),
        ).toHaveLength(2);
        expect(html).toContain("Send sign-in link");
    });

    test("sign-in page carries the MCP oauth_query into the Google request", () => {
        const oauthQuery = "client_id=client-1&scope=nutrition.read&sig=abc";
        const html = signInPageHtml({
            returnTo: "/app",
            oauthQuery,
            googleConfigured: true,
        });
        expect(html).toContain(
            "&quot;oauth_query&quot;:&quot;client_id=client-1&amp;scope=nutrition.read&amp;sig=abc&quot;",
        );
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
