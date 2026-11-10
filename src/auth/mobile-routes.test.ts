import { describe, expect, test } from "bun:test";
import { createMobileAuthRouter } from "./mobile-routes.js";

const envKeys = [
    "MUNCH_APP_BASE_URL",
    "BETTER_AUTH_SECRET",
    "DATABASE_URL",
    "MUNCH_GOOGLE_WEB_CLIENT_ID",
    "MUNCH_GOOGLE_ANDROID_CLIENT_ID",
    "MUNCH_GOOGLE_CLIENT_SECRET",
    "MUNCH_ANDROID_APP_LINK_SHA256_FINGERPRINTS",
] as const;

async function withAuthEnvironment(run: () => Promise<void>) {
    const previous = new Map(
        envKeys.map((key) => [key, process.env[key]] as const),
    );
    Object.assign(process.env, {
        MUNCH_APP_BASE_URL: "https://munch.example",
        BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
        DATABASE_URL: "postgresql://unused:unused@localhost:5432/unused",
    });
    try {
        await run();
    } finally {
        for (const key of envKeys) {
            const value = previous.get(key);
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
}

describe("mobile auth routes", () => {
    test("keeps Google sign-in hidden until credentials exist", async () => {
        await withAuthEnvironment(async () => {
            delete process.env.MUNCH_GOOGLE_WEB_CLIENT_ID;
            delete process.env.MUNCH_GOOGLE_ANDROID_CLIENT_ID;
            delete process.env.MUNCH_GOOGLE_CLIENT_SECRET;

            const response = await createMobileAuthRouter().request(
                "/mobile/auth/google-config",
            );
            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({
                configured: false,
                webClientId: null,
                platforms: {
                    web: { configured: false, webClientId: null },
                    android: { configured: false },
                },
            });
            expect(response.headers.get("cache-control")).toBe(
                "no-store, private",
            );
        });
    });

    test("reports web configured without claiming the Android flow is ready", async () => {
        await withAuthEnvironment(async () => {
            // Production state after the Amendment G console pass: the web
            // OAuth client exists, the Android client does not yet.
            delete process.env.MUNCH_GOOGLE_ANDROID_CLIENT_ID;
            process.env.MUNCH_GOOGLE_WEB_CLIENT_ID =
                "web-client-id.apps.googleusercontent.com";
            process.env.MUNCH_GOOGLE_CLIENT_SECRET = "server-only-secret";

            const response = await createMobileAuthRouter().request(
                "/mobile/auth/google-config",
            );
            expect(response.status).toBe(200);
            const body = await response.text();
            // The packaged caller (mobile/runtime.js) gates on the top-level
            // fields, so they must keep describing the Android flow: not
            // configured, no client ID handed out for native sign-in.
            expect(JSON.parse(body)).toEqual({
                configured: false,
                webClientId: null,
                platforms: {
                    web: {
                        configured: true,
                        webClientId: "web-client-id.apps.googleusercontent.com",
                    },
                    android: { configured: false },
                },
            });
            expect(body).not.toContain("server-only-secret");
        });
    });

    test("returns only the public Google web client ID", async () => {
        await withAuthEnvironment(async () => {
            process.env.MUNCH_GOOGLE_WEB_CLIENT_ID =
                "web-client-id.apps.googleusercontent.com";
            process.env.MUNCH_GOOGLE_ANDROID_CLIENT_ID =
                "android-client-id.apps.googleusercontent.com";
            process.env.MUNCH_GOOGLE_CLIENT_SECRET = "server-only-secret";

            const response = await createMobileAuthRouter().request(
                "/mobile/auth/google-config",
            );
            expect(response.status).toBe(200);
            const body = await response.text();
            expect(JSON.parse(body)).toEqual({
                configured: true,
                webClientId: "web-client-id.apps.googleusercontent.com",
                platforms: {
                    web: {
                        configured: true,
                        webClientId: "web-client-id.apps.googleusercontent.com",
                    },
                    android: { configured: true },
                },
            });
            expect(body).not.toContain("server-only-secret");
        });
    });

    test("publishes Android App Links with a valid fingerprint", async () => {
        await withAuthEnvironment(async () => {
            delete process.env.MUNCH_ANDROID_APP_LINK_SHA256_FINGERPRINTS;
            const router = createMobileAuthRouter();
            const missing = await router.request(
                "/.well-known/assetlinks.json",
            );
            expect(missing.status).toBe(404);

            const fingerprint = Array(32).fill("A1").join(":");
            process.env.MUNCH_ANDROID_APP_LINK_SHA256_FINGERPRINTS =
                fingerprint;
            const response = await router.request(
                "/.well-known/assetlinks.json",
            );
            expect(response.status).toBe(200);
            expect(await response.json()).toEqual([
                {
                    relation: ["delegate_permission/common.handle_all_urls"],
                    target: {
                        namespace: "android_app",
                        package_name: "business.munch.app",
                        sha256_cert_fingerprints: [fingerprint],
                    },
                },
            ]);
        });
    });

    test("rejects malformed handoffs without a database lookup", async () => {
        const response = await createMobileAuthRouter().request(
            "/mobile/auth/handoff/exchange",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: "short", codeVerifier: "short" }),
            },
        );
        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({
            error: "mobile_sign_in_failed",
        });
    });
});
