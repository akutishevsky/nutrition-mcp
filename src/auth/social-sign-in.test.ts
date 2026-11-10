import { describe, expect, test } from "bun:test";
import type { BetterAuthRuntimeConfig } from "./config.js";
import {
    buildSocialProviderRequest,
    googleAndroidSignInConfigured,
    googleSignInButtonHtml,
    googleWebSignInConfigured,
    SOCIAL_LINK_PATH,
    SOCIAL_SIGN_IN_PATH,
    socialProviderScript,
} from "./social-sign-in.js";

function config(
    overrides: Partial<BetterAuthRuntimeConfig> = {},
): BetterAuthRuntimeConfig {
    return {
        baseUrl: "https://munch.example",
        databaseUrl: "postgresql://unused",
        secret: "unused",
        production: false,
        publicPasswordSignup: false,
        magicLinkExpiresIn: 600,
        databasePoolSize: 5,
        ...overrides,
    };
}

const WEB = {
    googleWebClientId: "web-id.apps.googleusercontent.com",
    googleClientSecret: "secret",
};
const ANDROID = {
    googleAndroidClientId: "android-id.apps.googleusercontent.com",
};

describe("social sign-in configuration predicates", () => {
    test("web requires the web client ID and the shared secret together", () => {
        expect(googleWebSignInConfigured(config())).toBe(false);
        expect(
            googleWebSignInConfigured(
                config({ googleWebClientId: WEB.googleWebClientId }),
            ),
        ).toBe(false);
        expect(
            googleWebSignInConfigured(
                config({ googleClientSecret: WEB.googleClientSecret }),
            ),
        ).toBe(false);
        expect(googleWebSignInConfigured(config(WEB))).toBe(true);
    });

    test("android additionally requires the Android client ID", () => {
        expect(googleAndroidSignInConfigured(config(WEB))).toBe(false);
        expect(
            googleAndroidSignInConfigured(config({ ...WEB, ...ANDROID })),
        ).toBe(true);
        expect(googleAndroidSignInConfigured(config(ANDROID))).toBe(false);
    });
});

describe("social provider initiation requests", () => {
    test("sign-in mode targets the POST-only Better Auth social endpoint", () => {
        const request = buildSocialProviderRequest({
            mode: "sign-in",
            callbackURL: "/app",
            errorCallbackURL: "/connect/error",
        });
        expect(request.path).toBe(SOCIAL_SIGN_IN_PATH);
        expect(request.path).toBe("/api/auth/sign-in/social");
        expect(request.body).toEqual({
            provider: "google",
            callbackURL: "/app",
            errorCallbackURL: "/connect/error",
        });
    });

    test("sign-in mode carries the signed MCP oauth_query continuation", () => {
        const request = buildSocialProviderRequest({
            mode: "sign-in",
            callbackURL: "/app",
            oauthQuery: "client_id=client-1&scope=nutrition.read&sig=abc",
        });
        expect(request.body.oauth_query).toBe(
            "client_id=client-1&scope=nutrition.read&sig=abc",
        );
    });

    test("link mode reuses the same body against the link-social endpoint", () => {
        const request = buildSocialProviderRequest({
            mode: "link",
            callbackURL: "/app/settings",
            errorCallbackURL: "/connect/error",
            oauthQuery: "client_id=ignored-for-link",
        });
        expect(request.path).toBe(SOCIAL_LINK_PATH);
        expect(request.path).toBe("/api/auth/link-social");
        expect(request.body).toEqual({
            provider: "google",
            callbackURL: "/app/settings",
            errorCallbackURL: "/connect/error",
        });
    });
});

describe("Google sign-in button markup", () => {
    test("renders Google's branded control with the initiation request attached", () => {
        const html = googleSignInButtonHtml({
            callbackURL: "/app",
            errorCallbackURL: "/connect/error",
        });
        expect(html).toContain("Continue with Google");
        expect(html).toContain('class="button button-google"');
        expect(html).toContain('data-social-path="/api/auth/sign-in/social"');
        // The multicolour G mark (Google's four brand colours).
        for (const colour of ["#FFC107", "#FF3D00", "#4CAF50", "#1976D2"]) {
            expect(html).toContain(colour);
        }
        expect(html).toContain("&quot;provider&quot;:&quot;google&quot;");
        expect(html).toContain("&quot;callbackURL&quot;:&quot;/app&quot;");
    });

    test("the wiring script POSTs the prepared body and follows the returned URL", () => {
        const script = socialProviderScript();
        expect(script).toContain("method:'POST'");
        expect(script).toContain("payload.url");
        expect(script).toContain("location.href=payload.url");
        // A button is never left disabled with no outcome: failures restore
        // the control and honour the configured error callback.
        expect(script).toContain("button.disabled=false");
        expect(script).toContain("body.errorCallbackURL");
    });
});
