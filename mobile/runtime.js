import { App } from "@capacitor/app";
import {
    CapacitorBarcodeScanner,
    CapacitorBarcodeScannerAndroidScanningLibrary,
    CapacitorBarcodeScannerCameraDirection,
    CapacitorBarcodeScannerTypeHintALLOption,
} from "@capacitor/barcode-scanner";
import { Camera } from "@capacitor/camera";
import { registerPlugin } from "@capacitor/core";
import {
    getMunchPlatformKind,
    installOfflineBanner,
    isConnectivityError,
    isOffline,
    requestJson,
    resolveMunchApiUrl,
    setMunchPlatformAdapter,
} from "../public/app-api.js";
import {
    installedAppRoute,
    installedLoginHref,
    installedRouteFromUrl,
} from "./navigation.js";

const API_BASE_URL = "https://munch.business";
const LOGIN_PATH = "/mobile-login.html";
const FOREGROUND_SESSION_RECHECK_MS = 5 * 60 * 1000;

const MunchSecureSession = registerPlugin("MunchSecureSession");
const MunchPlayBilling = registerPlugin("MunchPlayBilling");
const MunchGoogleSignIn = registerPlugin("MunchGoogleSignIn");
const MunchAds = registerPlugin("MunchAds");
window.MunchAds = Object.freeze({
    setBannerVisible(options) {
        return MunchAds.setBannerVisible(options);
    },
    showPrivacyOptions() {
        return MunchAds.showPrivacyOptions();
    },
});
let backgroundedAt = null;
let foregroundSessionCheck = null;
const mobileAuthCallbacks = new Map();

async function storedToken() {
    try {
        const result = await MunchSecureSession.getToken();
        return typeof result?.token === "string" && result.token.length > 0
            ? result.token
            : null;
    } catch {
        return null;
    }
}

async function clearStoredToken() {
    try {
        await MunchSecureSession.clearToken();
    } catch {
        // A missing native plugin is treated as a signed-out state. The Android
        // build registers this plugin before BridgeActivity starts.
    }
}

async function replaceStoredToken(token) {
    if (typeof token !== "string" || !token) return;
    try {
        await MunchSecureSession.setToken({ token });
    } catch {
        // Keep the existing session in memory/storage if token refresh storage
        // fails. A later authenticated API request will still validate it.
    }
}

export function installedReturnRoute(value) {
    return installedAppRoute(value) || "/app";
}

export function currentInstalledAppRoute() {
    return installedReturnRoute(location.pathname);
}

export function installedLoginUrl(returnTo = currentInstalledAppRoute()) {
    return installedLoginHref(returnTo);
}

function moveToLogin(returnTo = currentInstalledAppRoute()) {
    const href = installedLoginHref(returnTo);
    if (location.pathname === LOGIN_PATH) {
        history.replaceState({}, "", href);
        return;
    }
    location.replace(href);
}

function navigateInstalledRoute(route, replace = false) {
    const safeRoute = installedAppRoute(route);
    if (!safeRoute) return null;
    if (replace) history.replaceState({}, "", safeRoute);
    else history.pushState({}, "", safeRoute);
    window.dispatchEvent(new PopStateEvent("popstate"));
    return safeRoute;
}

setMunchPlatformAdapter({
    kind: "mobile",
    apiBaseUrl: API_BASE_URL,
    getAccessToken: storedToken,
    async onAuthenticationRequired() {
        const returnTo = currentInstalledAppRoute();
        await clearStoredToken();
        moveToLogin(returnTo);
    },
});

export {
    getMunchPlatformKind,
    installOfflineBanner,
    isConnectivityError,
    isOffline,
    requestJson,
    resolveMunchApiUrl,
};

export async function hasStoredSession() {
    return Boolean(await storedToken());
}

export async function restoreInstalledEntryRoute(explicitRoute) {
    try {
        const launch = await App.getLaunchUrl();
        const authenticatedRoute = await completeMobileMagicLink(launch?.url);
        if (authenticatedRoute) {
            return navigateInstalledRoute(authenticatedRoute, true);
        }
        const launchedRoute = installedRouteFromUrl(launch?.url);
        if (launchedRoute) return navigateInstalledRoute(launchedRoute, true);
    } catch {
        // A missing launch URL is a normal app start.
    }

    const requested = installedAppRoute(explicitRoute);
    if (requested) return navigateInstalledRoute(requested, true);

    return installedAppRoute(location.pathname);
}

function randomBase64Url(byteLength = 32) {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    let binary = "";
    for (const value of bytes) binary += String.fromCharCode(value);
    return btoa(binary)
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");
}

async function sha256Base64Url(value) {
    const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(value),
    );
    let binary = "";
    for (const byte of new Uint8Array(digest)) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary)
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");
}

const CONNECTIVITY_MESSAGE =
    "Can't reach Munch right now. Check your connection and try again.";

async function jsonRequest(path, body) {
    let response;
    try {
        response = await fetch(new URL(path, API_BASE_URL), {
            method: "POST",
            credentials: "omit",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    } catch {
        throw new Error(CONNECTIVITY_MESSAGE);
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(
            payload?.message ||
                payload?.error ||
                `The sign-in request failed (${response.status})`,
        );
    }
    return payload;
}

export async function requestMobileMagicLink(email, returnTo = "/app") {
    const normalizedEmail = String(email || "")
        .trim()
        .toLowerCase();
    if (!normalizedEmail || normalizedEmail.length > 320) {
        throw new Error("Enter a valid email address");
    }

    const state = randomBase64Url();
    const codeVerifier = randomBase64Url();
    const codeChallenge = await sha256Base64Url(codeVerifier);
    const route = installedReturnRoute(returnTo);
    await MunchSecureSession.setPendingAuth({
        value: JSON.stringify({
            state,
            codeVerifier,
            returnTo: route,
        }),
    });

    const callbackURL = new URL("/mobile/auth/handoff/complete", API_BASE_URL);
    callbackURL.searchParams.set("state", state);
    callbackURL.searchParams.set("code_challenge", codeChallenge);

    try {
        await jsonRequest("/api/auth/sign-in/magic-link", {
            email: normalizedEmail,
            name: "Munch user",
            callbackURL: `${callbackURL.pathname}${callbackURL.search}`,
            newUserCallbackURL: `${callbackURL.pathname}${callbackURL.search}`,
            errorCallbackURL: "/connect/error",
        });
    } catch (error) {
        await MunchSecureSession.clearPendingAuth();
        throw error;
    }
}

async function googleSignInConfig() {
    let response;
    try {
        response = await fetch(
            new URL("/mobile/auth/google-config", API_BASE_URL),
            {
                method: "GET",
                credentials: "omit",
                headers: { Accept: "application/json" },
            },
        );
    } catch {
        throw new Error(CONNECTIVITY_MESSAGE);
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.configured || !payload.webClientId) {
        throw new Error("Google sign-in is not configured yet");
    }
    return payload;
}

export async function signInWithGoogle() {
    const config = await googleSignInConfig();
    const nonce = randomBase64Url();
    const credential = await MunchGoogleSignIn.signIn({
        webClientId: config.webClientId,
        nonce,
    });
    if (typeof credential?.idToken !== "string" || !credential.idToken) {
        throw new Error("Google did not return a sign-in token");
    }

    const response = await fetch(
        new URL("/api/auth/sign-in/social", API_BASE_URL),
        {
            method: "POST",
            credentials: "omit",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                provider: "google",
                idToken: { token: credential.idToken, nonce },
                callbackURL: "/app",
            }),
        },
    );
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(
            payload?.message || payload?.error || "Google sign-in failed",
        );
    }
    const token = response.headers.get("set-auth-token");
    if (!token) {
        throw new Error("Munch did not return an installed-app session token");
    }
    await MunchSecureSession.setToken({ token });
    await MunchSecureSession.clearPendingAuth();
    return payload;
}

export async function isGoogleSignInAvailable() {
    try {
        await googleSignInConfig();
        return true;
    } catch {
        return false;
    }
}

function mobileAuthCallback(value) {
    try {
        const parsed = new URL(value);
        return parsed.protocol === "https:" &&
            parsed.hostname === "munch.business" &&
            parsed.pathname === "/mobile/auth/callback"
            ? parsed
            : null;
    } catch {
        return null;
    }
}

async function completeMobileMagicLink(value) {
    const callback = mobileAuthCallback(value);
    if (!callback) return null;
    const cached = mobileAuthCallbacks.get(value);
    if (cached) return cached;

    const completion = (async () => {
        const code = callback.searchParams.get("code") || "";
        const state = callback.searchParams.get("state") || "";
        const stored = await MunchSecureSession.getPendingAuth();
        let pending;
        try {
            pending = JSON.parse(stored?.value || "{}");
        } catch {
            pending = {};
        }
        if (
            !code ||
            !state ||
            state !== pending.state ||
            typeof pending.codeVerifier !== "string"
        ) {
            throw new Error("This sign-in link is not waiting on this device");
        }

        const result = await jsonRequest("/mobile/auth/handoff/exchange", {
            code,
            codeVerifier: pending.codeVerifier,
        });
        if (typeof result?.token !== "string" || !result.token) {
            throw new Error("Munch did not complete the installed-app sign-in");
        }
        await MunchSecureSession.setToken({ token: result.token });
        await MunchSecureSession.clearPendingAuth();
        return installedReturnRoute(pending.returnTo);
    })();
    mobileAuthCallbacks.set(value, completion);
    return completion;
}

function redirectAfterMobileAuth(route) {
    const safeRoute = installedReturnRoute(route);
    location.replace(`/index.html?route=${encodeURIComponent(safeRoute)}`);
}

export async function signOutInstalledSession() {
    const token = await storedToken();
    try {
        if (token) {
            await fetch(new URL("/api/auth/sign-out", API_BASE_URL), {
                method: "POST",
                credentials: "omit",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
        }
    } finally {
        await clearStoredToken();
    }
}

async function validateForegroundSession() {
    if (location.pathname === LOGIN_PATH) return;
    const token = await storedToken();
    if (!token) {
        moveToLogin(currentInstalledAppRoute());
        return;
    }

    try {
        const response = await fetch(
            new URL("/api/auth/get-session", API_BASE_URL),
            {
                method: "GET",
                credentials: "omit",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            },
        );
        if (
            !response.ok &&
            response.status !== 401 &&
            response.status !== 403
        ) {
            return;
        }
        const session = response.ok
            ? await response.json().catch(() => null)
            : null;
        if (!response.ok || !session?.session || !session?.user) {
            const returnTo = currentInstalledAppRoute();
            await clearStoredToken();
            moveToLogin(returnTo);
            return;
        }
        const refreshedToken = response.headers.get("set-auth-token");
        if (refreshedToken && refreshedToken !== token) {
            await replaceStoredToken(refreshedToken);
        }
    } catch {
        // Network transitions are normal when an app returns to foreground.
        // Existing credentials remain in place and the next API call can retry.
    }
}

export async function getInstalledPlayBillingConfig() {
    return requestJson("/billing/google-play/config");
}

function storeSubscriptionBlocksNewPurchase(subscription) {
    return subscription?.blocksNewPurchase === true;
}

async function verifyInstalledPlayPurchase(purchaseToken) {
    if (typeof purchaseToken !== "string" || !purchaseToken) {
        throw new Error(
            "Google Play did not return a completed purchase token",
        );
    }
    return requestJson("/billing/google-play/verify", {
        method: "POST",
        body: JSON.stringify({ purchase_token: purchaseToken }),
    });
}

export async function getInstalledPremiumProduct() {
    const config = await getInstalledPlayBillingConfig();
    if (!config.configured) {
        throw new Error("Google Play billing is not configured yet");
    }
    return MunchPlayBilling.getPremiumProduct({
        productId: config.productId,
        basePlanId: config.basePlanId,
    });
}

export async function purchaseInstalledPremium() {
    const config = await getInstalledPlayBillingConfig();
    if (!config.configured) {
        throw new Error("Google Play billing is not configured yet");
    }
    if (storeSubscriptionBlocksNewPurchase(config.currentSubscription)) {
        return {
            state: "already_subscribed",
            provider: config.currentSubscription.provider,
        };
    }
    const result = await MunchPlayBilling.purchasePremium({
        productId: config.productId,
        basePlanId: config.basePlanId,
        obfuscatedAccountId: config.obfuscatedAccountId,
    });
    if (result?.state !== "purchased") return result;
    const verified = await verifyInstalledPlayPurchase(result.purchaseToken);
    return { state: "verified", subscription: verified };
}

export async function restoreInstalledPremium() {
    const config = await getInstalledPlayBillingConfig();
    if (!config.configured) {
        return { state: "unavailable" };
    }
    const result = await MunchPlayBilling.restorePremium({
        productId: config.productId,
    });
    if (result?.state !== "purchased") return result;
    const verified = await verifyInstalledPlayPurchase(result.purchaseToken);
    return { state: "verified", subscription: verified };
}

export async function openInstalledSubscriptionManagement() {
    const config = await getInstalledPlayBillingConfig();
    return MunchPlayBilling.openSubscriptionManagement({
        productId: config.productId,
        packageName: config.packageName,
    });
}

export async function takeInstalledPhoto() {
    return Camera.takePhoto({
        quality: 88,
        correctOrientation: true,
        saveToGallery: false,
        includeMetadata: true,
        editable: "no",
    });
}

export async function chooseInstalledPhoto() {
    const result = await Camera.chooseFromGallery({
        quality: 88,
        correctOrientation: true,
        allowMultipleSelection: false,
        includeMetadata: true,
        editable: "no",
    });
    return result.results?.[0] ?? null;
}

/** Multi-select gallery pick for multi-photo surfaces (cook photos). */
export async function chooseInstalledPhotos() {
    const result = await Camera.chooseFromGallery({
        quality: 88,
        correctOrientation: true,
        allowMultipleSelection: true,
        includeMetadata: true,
        editable: "no",
    });
    return result.results ?? [];
}

export async function scanInstalledBarcode() {
    return CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHintALLOption.ALL,
        scanInstructions: "Center the food barcode in the frame",
        scanButton: false,
        cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
        cancelButtonAccessibilityLabel: "Cancel barcode scan",
        torchButtonOnAccessibilityLabel: "Turn flashlight off",
        torchButtonOffAccessibilityLabel: "Turn flashlight on",
        android: {
            scanningLibrary:
                CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT,
        },
    });
}

// S4 Android back behaviour (standard pattern): an open dialog
// consumes back first; then WebView/SPA history while there is
// somewhere in-app to go; at the shell root (/app, the login page, or
// a top-level packaged page) back exits the app. It never strands the
// user on a dead view and never exits mid-dialog.
App.addListener("backButton", ({ canGoBack }) => {
    const openDialog = document.querySelector("dialog[open]");
    if (openDialog) {
        openDialog.close();
        return;
    }
    if (canGoBack) {
        window.history.back();
        return;
    }
    const route = installedAppRoute(location.pathname);
    if (route && route !== "/app") {
        navigateInstalledRoute("/app");
        return;
    }
    void App.exitApp();
});

App.addListener("appStateChange", ({ isActive }) => {
    if (!isActive) {
        backgroundedAt = Date.now();
        return;
    }
    const elapsed = backgroundedAt == null ? 0 : Date.now() - backgroundedAt;
    backgroundedAt = null;
    if (elapsed < FOREGROUND_SESSION_RECHECK_MS || foregroundSessionCheck)
        return;
    foregroundSessionCheck = validateForegroundSession().finally(() => {
        foregroundSessionCheck = null;
    });
});

App.addListener("appUrlOpen", ({ url }) => {
    if (mobileAuthCallback(url)) {
        void completeMobileMagicLink(url)
            .then((route) => {
                if (route) redirectAfterMobileAuth(route);
                else moveToLogin(currentInstalledAppRoute());
            })
            .catch(() => {
                void MunchSecureSession.clearPendingAuth();
                const returnTo = encodeURIComponent(currentInstalledAppRoute());
                location.replace(
                    `${LOGIN_PATH}?return_to=${returnTo}&auth_error=handoff`,
                );
            });
        return;
    }
    const route = installedRouteFromUrl(url);
    if (!route) return;
    if (location.pathname === LOGIN_PATH) {
        history.replaceState({}, "", installedLoginHref(route));
        return;
    }
    navigateInstalledRoute(route);
});

App.addListener("appRestoredResult", (event) => {
    if (
        event?.success !== true ||
        event.pluginId !== "Camera" ||
        !["takePhoto", "chooseFromGallery", "getPhoto"].includes(
            event.methodName,
        )
    ) {
        return;
    }
    const data =
        event.methodName === "chooseFromGallery"
            ? event.data?.results?.[0]
            : event.data;
    if (!data?.webPath) return;
    window.dispatchEvent(
        new CustomEvent("munch:camera-restored", { detail: data }),
    );
});
