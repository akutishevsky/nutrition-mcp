import { describe, expect, test } from "bun:test";
import { generateKeyPairSync } from "node:crypto";
import type { BetterAuthRuntimeConfig } from "./config.js";
import {
    appleProviderOptions,
    appleSignInButtonHtml,
    appleSignInConfigured,
    buildSocialProviderRequest,
    googleAndroidSignInConfigured,
    googleIosSignInConfigured,
    googleProviderClientIds,
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
const IOS = {
    googleIosClientId: "ios-id.apps.googleusercontent.com",
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

    test("ios additionally requires the iOS client ID", () => {
        expect(googleIosSignInConfigured(config(WEB))).toBe(false);
        expect(googleIosSignInConfigured(config({ ...WEB, ...IOS }))).toBe(
            true,
        );
        expect(googleIosSignInConfigured(config(IOS))).toBe(false);
    });

    test("the provider audience list carries every configured client ID", () => {
        expect(googleProviderClientIds(config())).toEqual([]);
        expect(googleProviderClientIds(config(WEB))).toEqual([
            WEB.googleWebClientId,
        ]);
        expect(
            googleProviderClientIds(config({ ...WEB, ...ANDROID, ...IOS })),
        ).toEqual([
            WEB.googleWebClientId,
            ANDROID.googleAndroidClientId,
            IOS.googleIosClientId,
        ]);
    });
});

describe("Apple provider registration (IOS-AUTH)", () => {
    const fixtureKey = generateKeyPairSync("ec", { namedCurve: "P-256" })
        .privateKey.export({ type: "pkcs8", format: "pem" })
        .toString();
    const APPLE = {
        appleServicesId: "business.munch.signin",
        appleKeyId: "FIXTUREKEY1",
        appleTeamId: "TEAMFIXTURE",
        applePrivateKey: fixtureKey,
    };

    test("inert without the full identifier set: no provider options at all", () => {
        expect(appleProviderOptions(config())).toBeNull();
        expect(
            appleProviderOptions(
                config({ appleServicesId: APPLE.appleServicesId }),
            ),
        ).toBeNull();
    });

    test("configured by fixture envs alone, with both ID-token audiences", () => {
        const options = appleProviderOptions(config(APPLE))!;
        // clientId is the Services ID — the web flow's client and the
        // client-secret JWT's subject.
        expect(options.clientId).toBe("business.munch.signin");
        expect(options.appBundleIdentifier).toBe("business.munch.app");
        // Web tokens carry aud = Services ID; the packaged iOS app's
        // native tokens carry aud = bundle ID. Both must verify.
        expect(options.audience).toEqual([
            "business.munch.signin",
            "business.munch.app",
        ]);
        // The secret is a generated JWT (three segments) whose claims are
        // Apple's, never a stored pre-generated value from the env.
        const segments = options.clientSecret.split(".");
        expect(segments).toHaveLength(3);
        const claims = JSON.parse(
            Buffer.from(segments[1]!, "base64url").toString("utf8"),
        ) as {
            iss: string;
            sub: string;
            aud: string;
            exp: number;
            iat: number;
        };
        expect(claims.iss).toBe("TEAMFIXTURE");
        expect(claims.sub).toBe("business.munch.signin");
        expect(claims.aud).toBe("https://appleid.apple.com");
        expect(claims.exp - claims.iat).toBeGreaterThan(0);
        expect(options.clientSecret).not.toContain("FIXTUREKEY1".toLowerCase());
        expect(options.clientSecret).not.toBe(fixtureKey);
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

    test("apple requires the full identifier set together", () => {
        const full = {
            appleServicesId: "business.munch.signin",
            appleKeyId: "KEY123",
            appleTeamId: "TEAM123",
            applePrivateKey: "unused",
        };
        expect(appleSignInConfigured(config(full))).toBe(true);
        expect(appleSignInConfigured(config())).toBe(false);
        expect(
            appleSignInConfigured(
                config({ appleServicesId: full.appleServicesId }),
            ),
        ).toBe(false);
    });

    test("link mode can name a different provider (Amendment I provider-generic shape)", () => {
        const request = buildSocialProviderRequest({
            mode: "link",
            provider: "apple",
            callbackURL: "/app/settings",
        });
        expect(request.path).toBe(SOCIAL_LINK_PATH);
        expect(request.body.provider).toBe("apple");
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

    test("the Apple control carries an apple-provider initiation request (S6 slice 10)", () => {
        const html = appleSignInButtonHtml({
            callbackURL: "/app",
            errorCallbackURL: "/connect/error",
            oauthQuery: "client_id=client-1&scope=nutrition.read&sig=abc",
        });
        expect(html).toContain("Continue with Apple");
        expect(html).toContain('class="button button-apple"');
        expect(html).toContain('data-social-path="/api/auth/sign-in/social"');
        expect(html).toContain("&quot;provider&quot;:&quot;apple&quot;");
        expect(html).toContain("&quot;callbackURL&quot;:&quot;/app&quot;");
        expect(html).toContain(
            "&quot;oauth_query&quot;:&quot;client_id=client-1&amp;scope=nutrition.read&amp;sig=abc&quot;",
        );
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
