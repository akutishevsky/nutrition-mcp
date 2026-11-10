import { Hono, type Context } from "hono";
import {
    createMobileSignInHandoff,
    exchangeMobileSignInHandoff,
    getMunchBetterAuth,
} from "./auth.js";
import { getBetterAuthRuntimeConfig } from "./config.js";
import {
    googleAndroidSignInConfigured,
    googleIosSignInConfigured,
    googleWebSignInConfigured,
} from "./social-sign-in.js";

function privateResponse(c: Context) {
    c.header("Cache-Control", "no-store, private");
    c.header("Pragma", "no-cache");
    c.header("Referrer-Policy", "no-referrer");
    c.header("X-Robots-Tag", "noindex, nofollow");
}

function isMobileState(value: unknown): value is string {
    return typeof value === "string" && /^[A-Za-z0-9_-]{32,128}$/.test(value);
}

function isCodeChallenge(value: unknown): value is string {
    return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

/**
 * Apple Team ID for the apple-app-site-association appID. The in-repo
 * fallback is the team the iOS distribution leg already signs with —
 * `.github/workflows/mobile-ios.yml` refuses any provisioning profile
 * whose application-identifier is not `R42LWFBXBH.business.munch.app`
 * and exports with teamID R42LWFBXBH. `MUNCH_APPLE_TEAM_ID` overrides
 * it (e.g. a future team change lands by env first); a value that is
 * not a plausible team ID is never served — the route 404s instead of
 * publishing a wrong appID.
 */
const APPLE_TEAM_ID_PATTERN = /^[A-Z0-9]{10}$/;
const IN_REPO_APPLE_TEAM_ID = "R42LWFBXBH";
const MUNCH_IOS_BUNDLE_ID = "business.munch.app";

export function appleAppSiteAssociation() {
    const teamId = (
        process.env.MUNCH_APPLE_TEAM_ID || IN_REPO_APPLE_TEAM_ID
    ).trim();
    if (!APPLE_TEAM_ID_PATTERN.test(teamId)) return null;
    return {
        applinks: {
            apps: [],
            details: [
                {
                    appID: `${teamId}.${MUNCH_IOS_BUNDLE_ID}`,
                    // Mirrors the Android verified-link surface
                    // (AndroidManifest autoVerify filters): the /app
                    // allowlist plus the mobile auth callback.
                    paths: ["/mobile/auth/callback", "/app", "/app/*"],
                },
            ],
        },
    };
}

/**
 * The auth callback page (S6 slice 10): the browser stop mid-sign-in,
 * when the OS hands a verified app link to the browser instead of the
 * app. Until this slice it was bare browser-default HTML — the one
 * unthemed state left in the sign-in path (Amendment F: an unthemed
 * screen is a BLOCKER). It now renders in the connect shell's exact
 * grammar (src/auth/connect-routes.ts): the same Editorial Serif
 * stylesheet, auth-page/auth-card frame, brand mark and kicker, so the
 * whole sign-in path is one world. Pure so the theming is testable
 * without a database.
 */
export function mobileAuthCallbackHtml(): string {
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#f6f1e7"><title>Open Munch — Munch</title><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/editorial.css"></head>
<body class="auth-page"><main class="auth-main"><section class="auth-card"><span class="brand"><img class="brand-logo" src="/brand/munch-mark.svg" alt=""><span>Munch</span></span><p class="section-kicker spacer-top">Sign in</p><h1>Open Munch to finish signing in</h1><p>Return to the Munch app and request a new sign-in link on this device.</p></section></main></body></html>`;
}

export function createMobileAuthRouter(): Hono {
    const router = new Hono();

    router.get("/.well-known/apple-app-site-association", (c) => {
        const association = appleAppSiteAssociation();
        if (!association) return c.notFound();
        return c.json(association, 200, {
            "Cache-Control": "public, max-age=300",
        });
    });

    router.get("/.well-known/assetlinks.json", (c) => {
        const fingerprints = (
            process.env.MUNCH_ANDROID_APP_LINK_SHA256_FINGERPRINTS || ""
        )
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);
        if (
            fingerprints.length === 0 ||
            fingerprints.some(
                (value) =>
                    !/^(?:[0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2}$/.test(value),
            )
        ) {
            return c.notFound();
        }

        return c.json(
            [
                {
                    relation: ["delegate_permission/common.handle_all_urls"],
                    target: {
                        namespace: "android_app",
                        package_name: "business.munch.app",
                        sha256_cert_fingerprints: fingerprints,
                    },
                },
            ],
            200,
            { "Cache-Control": "public, max-age=300" },
        );
    });

    router.get("/mobile/auth/callback", (c) => {
        privateResponse(c);
        return c.html(mobileAuthCallbackHtml());
    });

    router.get("/mobile/auth/google-config", (c) => {
        const config = getBetterAuthRuntimeConfig();
        // Per-platform reporting (Amendment G): web sign-in needs only the
        // web OAuth client; the packaged Android flow additionally needs
        // the Android OAuth client. The historic top-level fields keep
        // their original meaning — `configured`/`webClientId` describe the
        // packaged Android flow, which is what the existing caller
        // (`mobile/runtime.js`) gates on — so a missing Android client no
        // longer makes the web platform report unconfigured, and the web
        // platform no longer reports configured just because Android is.
        const webConfigured = googleWebSignInConfigured(config);
        const androidConfigured = googleAndroidSignInConfigured(config);
        const iosConfigured = googleIosSignInConfigured(config);
        privateResponse(c);
        return c.json({
            configured: androidConfigured,
            webClientId: androidConfigured ? config.googleWebClientId : null,
            platforms: {
                web: {
                    configured: webConfigured,
                    webClientId: webConfigured
                        ? config.googleWebClientId
                        : null,
                },
                android: {
                    configured: androidConfigured,
                },
                ios: {
                    configured: iosConfigured,
                    // The iOS client ID is a public identifier the native
                    // plugin configures Google Sign-In with; the web
                    // client ID rides along as the serverClientID the
                    // SDK needs to mint server-audience ID tokens. Both
                    // are handed out only when the iOS flow is fully
                    // configured, matching the Android top-level rule.
                    clientId: iosConfigured ? config.googleIosClientId : null,
                    webClientId: iosConfigured
                        ? config.googleWebClientId
                        : null,
                },
            },
        });
    });

    router.get("/mobile/auth/handoff/complete", async (c) => {
        const state = c.req.query("state");
        const codeChallenge = c.req.query("code_challenge");
        if (!isMobileState(state) || !isCodeChallenge(codeChallenge)) {
            privateResponse(c);
            return c.redirect("/connect/error", 303);
        }

        try {
            const session = await getMunchBetterAuth().api.getSession({
                headers: c.req.raw.headers,
            });
            const sessionToken = session?.session?.token;
            if (!session?.user || typeof sessionToken !== "string") {
                privateResponse(c);
                return c.redirect("/connect/error", 303);
            }

            const code = await createMobileSignInHandoff({
                sessionToken,
                codeChallenge,
            });
            const callback = new URL(
                "/mobile/auth/callback",
                getBetterAuthRuntimeConfig().baseUrl,
            );
            callback.searchParams.set("code", code);
            callback.searchParams.set("state", state);
            privateResponse(c);
            return c.redirect(callback.toString(), 303);
        } catch (error) {
            console.error("Mobile sign-in handoff creation failed", {
                errorName: error instanceof Error ? error.name : "unknown",
            });
            privateResponse(c);
            return c.redirect("/connect/error", 303);
        }
    });

    router.post("/mobile/auth/handoff/exchange", async (c) => {
        const body = await c.req.json().catch(() => null);
        const code = body && typeof body.code === "string" ? body.code : "";
        const codeVerifier =
            body && typeof body.codeVerifier === "string"
                ? body.codeVerifier
                : "";
        if (code.length > 128 || codeVerifier.length > 128) {
            privateResponse(c);
            return c.json({ error: "mobile_sign_in_failed" }, 400);
        }

        try {
            const token = await exchangeMobileSignInHandoff({
                code,
                codeVerifier,
            });
            privateResponse(c);
            if (!token) return c.json({ error: "mobile_sign_in_failed" }, 401);
            return c.json({ token });
        } catch (error) {
            console.error("Mobile sign-in handoff exchange failed", {
                errorName: error instanceof Error ? error.name : "unknown",
            });
            privateResponse(c);
            return c.json({ error: "mobile_sign_in_unavailable" }, 503);
        }
    });

    return router;
}
