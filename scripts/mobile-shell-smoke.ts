#!/usr/bin/env bun

import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const config = await readFile("capacitor.config.ts", "utf8");
const runtime = await readFile("mobile/runtime.js", "utf8");
const navigation = await readFile("mobile/navigation.js", "utf8");
const mobileEntry = await readFile("mobile/mobile-entry.js", "utf8");
const mobileLogin = await readFile("mobile/mobile-login.js", "utf8");
const pantryNative = await readFile("mobile/pantry-native.js", "utf8");
const captureNative = await readFile("mobile/capture-native.js", "utf8");
const appApi = await readFile("public/app-api.js", "utf8");
const appJs = await readFile("public/app.js", "utf8");
const appStyles = await readFile("public/styles.css", "utf8");
const appHtml = await readFile("public/app.html", "utf8");
const appPatches = await readFile("public/app-patches.js", "utf8");
const pantryHtml = await readFile("public/pantry.html", "utf8");
const pantryCss = await readFile("public/pantry.css", "utf8");
const mobileLoginHtml = await readFile("mobile/mobile-login.html", "utf8");
const androidManifest = await readFile(
    "android/app/src/main/AndroidManifest.xml",
    "utf8",
);
const buildMobileWeb = await readFile("scripts/build-mobile-web.ts", "utf8");
const androidBuildGradle = await readFile("android/app/build.gradle", "utf8");
const androidWorkflow = await readFile(
    ".github/workflows/mobile-android.yml",
    "utf8",
);
const playBundleWorkflow = await readFile(
    ".github/workflows/android-play-internal-bundle.yml",
    "utf8",
);
const plugin = await readFile(
    "mobile/android/MunchSecureSessionPlugin.java",
    "utf8",
);
const googleSignInPlugin = await readFile(
    "mobile/android/MunchGoogleSignInPlugin.java",
    "utf8",
);
const androidMainActivity = await readFile(
    "mobile/android/MainActivity.java",
    "utf8",
);
const playBillingPlugin = await readFile(
    "mobile/android/MunchPlayBillingPlugin.java",
    "utf8",
);
const billingRoutes = await readFile("src/billing/routes.ts", "utf8");
const googlePlayClient = await readFile(
    "src/billing/google-play-client.ts",
    "utf8",
);
const googlePlayVerifier = await readFile("src/billing/google-play.ts", "utf8");
const googlePlayRtdn = await readFile(
    "src/billing/google-play-rtdn.ts",
    "utf8",
);
const googlePubSubAuth = await readFile(
    "src/billing/google-pubsub-auth.ts",
    "utf8",
);
const storeRepository = await readFile(
    "src/billing/store-repository.ts",
    "utf8",
);
const adsPlugin = await readFile("mobile/android/MunchAdsPlugin.java", "utf8");
const adsConfig = await readFile("src/ads-config.ts", "utf8");
const appRepository = await readFile("src/app/repository.ts", "utf8");
const adsPolicy = await readFile("public/ads-policy.js", "utf8");
const configure = await readFile("scripts/configure-mobile-android.ts", "utf8");
const server = await readFile("src/index.ts", "utf8");
const mobileAuthRoutes = await readFile("src/auth/mobile-routes.ts", "utf8");
const inventoryRoutes = await readFile("src/inventory/routes.ts", "utf8");
const appRoutes = await readFile("src/app/routes.ts", "utf8");

function requireText(source: string, needle: string, label: string) {
    if (!source.includes(needle))
        throw new Error(`${label}: missing ${needle}`);
}

for (const [name, version] of Object.entries({
    "@capacitor/core": "8.5.0",
    "@capacitor/android": "8.5.0",
    "@capacitor/app": "8.1.1",
    "@capacitor/camera": "8.2.3",
    "@capacitor/barcode-scanner": "3.1.1",
})) {
    if (packageJson.dependencies?.[name] !== version) {
        throw new Error(`${name} must be pinned to ${version}`);
    }
}
if (packageJson.devDependencies?.["@capacitor/cli"] !== "8.5.0") {
    throw new Error("@capacitor/cli must be pinned to 8.5.0");
}

requireText(config, 'appId: "business.munch.app"', "Capacitor config");
requireText(config, 'webDir: ".mobile-web"', "Capacitor config");
requireText(config, 'androidScheme: "https"', "Capacitor config");
requireText(
    runtime,
    'const API_BASE_URL = "https://munch.business"',
    "Mobile runtime",
);
requireText(runtime, 'registerPlugin("MunchSecureSession")', "Mobile runtime");
requireText(
    runtime,
    'registerPlugin("MunchPlayBilling")',
    "Play Billing runtime",
);
requireText(runtime, 'credentials: "omit"', "Mobile runtime");
requireText(runtime, "Camera.takePhoto", "Native camera integration");
requireText(
    runtime,
    "Camera.chooseFromGallery",
    "Native photo picker integration",
);
requireText(
    runtime,
    "CapacitorBarcodeScanner.scanBarcode",
    "Native barcode integration",
);
requireText(runtime, '"appRestoredResult"', "Android capture restoration");
requireText(runtime, "App.getLaunchUrl", "Cold-start deep-link restoration");
requireText(runtime, '"appUrlOpen"', "Warm deep-link routing");
requireText(runtime, '"appStateChange"', "Foreground session lifecycle");
requireText(
    runtime,
    '"/api/auth/get-session"',
    "Foreground session validation",
);
requireText(
    runtime,
    "blocksNewPurchase === true",
    "Server-owned duplicate purchase decision",
);
// S4 supersedes the earlier "default back handling" posture: the
// runtime owns Android back explicitly — dialog first, then history,
// then root exit — per the shell-hardening brief.
requireText(runtime, '"backButton"', "Android back handling");
requireText(runtime, "window.history.back()", "Android back history");
requireText(runtime, "App.exitApp()", "Android back root exit");
requireText(runtime, 'querySelector("dialog[open]")', "Android back dialog");
if (/localStorage/.test(runtime)) {
    throw new Error("Installed bearer credentials must not use localStorage");
}

requireText(
    navigation,
    "^\\/app(?:\\/|$)",
    "Strict installed application route boundary",
);
requireText(
    mobileEntry,
    "restoreInstalledEntryRoute",
    "Installed cold-start bootstrap",
);
requireText(
    mobileEntry,
    "installedLoginUrl",
    "Installed signed-out route preservation",
);
requireText(
    mobileLogin,
    "installedReturnRoute",
    "Installed post-login return validation",
);
requireText(
    mobileLogin,
    "requestMobileMagicLink",
    "Passwordless Android email sign-in",
);
requireText(mobileLogin, "signInWithGoogle", "Android Google account sign-in");
requireText(
    runtime,
    'registerPlugin("MunchGoogleSignIn")',
    "Google sign-in bridge",
);
requireText(runtime, "/api/auth/sign-in/magic-link", "Munch magic-link API");
requireText(
    runtime,
    "/mobile/auth/handoff/exchange",
    "One-time mobile handoff",
);
requireText(
    runtime,
    "/api/auth/sign-in/social",
    "Better Auth Google token exchange",
);
requireText(plugin, "setPendingAuth", "Encrypted pending magic-link state");
requireText(plugin, "clearPendingAuth", "Encrypted pending magic-link state");
requireText(
    googleSignInPlugin,
    "CredentialManager",
    "Native Google Credential Manager",
);
requireText(
    googleSignInPlugin,
    "GoogleIdTokenCredential",
    "Native Google ID-token response",
);
requireText(
    androidMainActivity,
    "registerPlugin(MunchGoogleSignInPlugin.class)",
    "Native Google sign-in registration",
);
if (
    /signInWithPassword|name=["']password["']|type=["']password["']/.test(
        `${mobileLogin}\n${runtime}`,
    )
) {
    throw new Error("Android sign-in must not collect a Munch password");
}

requireText(
    plugin,
    'KeyStore.getInstance("AndroidKeyStore")',
    "Keystore plugin",
);
requireText(
    plugin,
    'Cipher.getInstance("AES/GCM/NoPadding")',
    "Keystore plugin",
);
requireText(configure, "minSdkVersion = 26", "Android configuration");
requireText(configure, "compileSdkVersion\\s*=\\s*36", "Android configuration");
requireText(configure, "targetSdkVersion\\s*=\\s*36", "Android configuration");
requireText(
    androidBuildGradle,
    "MUNCH_ANDROID_VERSION_CODE",
    "Android build version code",
);
requireText(
    androidWorkflow,
    "MUNCH_ANDROID_VERSION_CODE: ${{ github.run_number }}",
    "Main Android build versioning",
);
requireText(
    playBundleWorkflow,
    "MUNCH_ANDROID_VERSION_CODE: ${{ github.run_number }}",
    "Internal Play bundle versioning",
);
requireText(
    configure,
    'android:usesCleartextTraffic="false"',
    "Android manifest policy",
);
requireText(
    configure,
    'android:autoVerify="true"',
    "Verified Android sign-in links",
);
requireText(
    configure,
    'android:pathPrefix="/mobile/auth/callback"',
    "Verified Android sign-in callback path",
);
requireText(
    mobileAuthRoutes,
    "MUNCH_ANDROID_APP_LINK_SHA256_FINGERPRINTS",
    "Android App Link domain association",
);
requireText(server, '"set-auth-token"', "Installed auth CORS contract");
requireText(
    configure,
    "com.android.billingclient:billing:9.1.0",
    "Google Play Billing dependency",
);
requireText(
    configure,
    "androidx.credentials:credentials:1.6.0",
    "Android Credential Manager dependency",
);
requireText(
    configure,
    "com.google.android.libraries.identity.googleid:googleid:1.2.1",
    "Google ID token dependency",
);
requireText(
    configure,
    "MunchGoogleSignInPlugin.java",
    "Google Credential Manager native bridge",
);
requireText(
    playBillingPlugin,
    "setObfuscatedAccountId",
    "Google Play account binding",
);
requireText(
    playBillingPlugin,
    "queryPurchasesAsync",
    "Google Play purchase restore",
);
requireText(
    playBillingPlugin,
    "includeSuspendedSubscriptions(true)",
    "Google Play suspended subscription reconciliation",
);
if (/acknowledgePurchase/.test(playBillingPlugin)) {
    throw new Error("Google Play acknowledgement must remain server-owned");
}
requireText(
    billingRoutes,
    '"/billing/google-play/verify"',
    "Google Play verification endpoint",
);
requireText(
    billingRoutes,
    '"/webhooks/google-play"',
    "Google Play RTDN endpoint",
);
requireText(
    billingRoutes,
    "verifyGooglePubSubPushAuthorization",
    "Authenticated Google Pub/Sub webhook boundary",
);
requireText(
    billingRoutes,
    "upsertStoreAccountBinding",
    "First-purchase RTDN account binding",
);
requireText(
    billingRoutes,
    'munchAuthTransport") !== "bearer"',
    "Google Play installed bearer boundary",
);
requireText(
    googlePlayClient,
    "/purchases/subscriptionsv2/tokens/",
    "Google Play SubscriptionPurchaseV2 source of truth",
);
requireText(
    googlePlayVerifier,
    "googlePlayObfuscatedAccountId",
    "Google Play account hash",
);
requireText(
    googlePlayVerifier,
    "resolveGooglePlayPurchaseUser",
    "RTDN purchase ownership resolution",
);
requireText(
    googlePlayRtdn,
    "recordStoreBillingEvent",
    "RTDN idempotency ledger",
);
requireText(
    googlePlayRtdn,
    "getGooglePlaySubscription",
    "RTDN source-of-truth refresh",
);
requireText(
    googlePubSubAuth,
    "https://www.googleapis.com/oauth2/v3/certs",
    "Google Pub/Sub signing-key source",
);
requireText(
    googlePubSubAuth,
    "pushServiceAccountEmail",
    "Google Pub/Sub service-account validation",
);
requireText(
    googlePubSubAuth,
    "pushAudience",
    "Google Pub/Sub audience validation",
);
requireText(
    storeRepository,
    "store_account_bindings",
    "Opaque app-store account binding repository",
);
requireText(
    buildMobileWeb,
    "billing-native.js",
    "Installed Play Billing UI bundle",
);

requireText(
    pantryNative,
    "/api/app/food-barcode?barcode=",
    "Native barcode canonical lookup",
);
requireText(
    pantryNative,
    '"/api/app/pantry/reconcile"',
    "Native Pantry write contract",
);
requireText(pantryNative, "food_provider:", "Native Pantry provider field");
requireText(
    pantryNative,
    "candidate.provider",
    "Native Pantry provider identity",
);
requireText(
    pantryNative,
    "provider_food_id:",
    "Native Pantry provider food field",
);
requireText(
    pantryNative,
    "candidate.provider_food_id",
    "Native Pantry provider food identity",
);
requireText(
    buildMobileWeb,
    'src="/pantry-native.js"',
    "Native Pantry bundle injection",
);
requireText(
    inventoryRoutes,
    "foodProvider:",
    "Pantry canonical identity parser",
);
requireText(inventoryRoutes, "providerFoodId:", "Pantry provider food parser");
requireText(inventoryRoutes, "barcode:", "Pantry barcode parser");
requireText(
    appRoutes,
    'app.get("/api/app/food-barcode"',
    "Canonical barcode API",
);

// S4 shell hardening: offline honesty, native meal-photo capture,
// verified app links, and safe areas.
requireText(
    runtime,
    "installOfflineBanner",
    "Mobile runtime connectivity re-export",
);
requireText(appApi, "isConnectivity", "Connectivity error tagging");
requireText(appApi, "Nothing was queued", "Offline write honesty");
requireText(appApi, "installOfflineBanner", "Offline banner");
requireText(appJs, 'data-testid="api-down-state"', "API-down view state");
requireText(appJs, "isConnectivityError", "API-down detection");
requireText(mobileEntry, 'data-testid="offline-state"', "Offline cold start");
requireText(mobileEntry, "./capture-native.js", "Native capture bundle wiring");
requireText(mobileLoginHtml, 'data-testid="offline-banner"', "Login offline");
requireText(captureNative, "munch.pendingCapture", "Capture pending restore");
requireText(captureNative, "meal-photo-file", "Meal-photo dialog handoff");
requireText(
    captureNative,
    "new DataTransfer()",
    "Capture image handoff to existing review flow",
);
requireText(captureNative, "8 * 1024 * 1024", "Capture 8 MB cap");
requireText(
    buildMobileWeb,
    "capture-native.js",
    "Native capture bundle injection",
);
requireText(navigation, "munch.business", "Verified app-link routing");
requireText(
    configure,
    'android:pathPrefix="/app"',
    "Verified Android app links",
);
requireText(
    androidManifest,
    'android:pathPrefix="/app"',
    "Verified Android app links in manifest",
);
requireText(appStyles, ".offline-banner", "Offline banner styles");
requireText(
    appStyles,
    "env(safe-area-inset-top)",
    "Safe-area aware sticky chrome",
);
// App-shell fix batch (2026-11-10): the header band, its Refresh
// button, and the "Use with your AI" quick action were removed at
// Michael's direction — the nav already names the page. The status-bar
// inset is consumed by .app-content's mobile padding-top (the band's
// old rule was wiped by a later shorthand, which was the bleed), and
// the standalone Pantry page carries the shell's bottom nav.
for (const retired of [
    "app-topbar",
    "quick-action",
    "refresh-button",
    "page-title",
    "page-kicker",
]) {
    if (appHtml.includes(retired) || appJs.includes(retired)) {
        throw new Error(
            `Retired shell chrome returned: ${retired} must stay removed`,
        );
    }
}
requireText(
    appStyles,
    "calc(22px + env(safe-area-inset-top))",
    "Content top clears the packaged status bar",
);
requireText(
    appJs,
    '"app:refresh"',
    "Refresh bridge for out-of-module re-renders",
);
requireText(
    appPatches,
    '"app:refresh"',
    "Meal-editor refresh rides the bridge, not the retired button",
);
requireText(pantryHtml, "mobile-bottom-nav", "Pantry bottom navigation");
requireText(pantryCss, ".mobile-bottom-nav", "Pantry bottom navigation styles");
requireText(
    buildMobileWeb,
    'href="/app/more"',
    "Pantry nav packaged-route rewrite",
);
// Amendment F: the S4 shell states (API-down, startup failure,
// offline cold start) carry the Editorial Serif house theme.
for (const testId of ["api-down-state", "startup-failure-state"]) {
    requireText(
        appStyles,
        `.error-state[data-testid="${testId}"]`,
        `Editorial Serif themed ${testId}`,
    );
}
requireText(
    appStyles,
    ".error-state.offline-state",
    "Editorial Serif themed offline state",
);
requireText(
    appStyles,
    'Georgia, "Times New Roman", Times, serif',
    "Editorial Serif display type in shell states",
);

// S6 slice 10 (Auth fusion): the packaged sign-in page and the auth
// callback are Editorial Serif like the connect shell — the login page
// loads the shared stylesheet and carries no world of its own, and the
// callback renders the auth-card frame instead of bare HTML.
requireText(
    mobileLoginHtml,
    'href="/editorial.css"',
    "Packaged sign-in Editorial Serif stylesheet",
);
if (mobileLoginHtml.includes("<style") || mobileLoginHtml.includes("Inter,")) {
    throw new Error(
        "Packaged sign-in page must not carry its own inline styles or the retired Inter world",
    );
}
requireText(
    mobileAuthRoutes,
    "mobileAuthCallbackHtml",
    "Themed auth callback page",
);
requireText(
    mobileAuthRoutes,
    '<link rel="stylesheet" href="/editorial.css">',
    "Auth callback Editorial Serif stylesheet",
);
requireText(
    mobileAuthRoutes,
    'class="auth-card"',
    "Auth callback Editorial Serif frame",
);

// ADS-FOUNDATION (Amendment D / Amendment G item 3):
// 1. Real AdMob IDs are wired as env values in BOTH Android workflows.
//    These IDs are public (app-ads.txt publishes the publisher ID).
//    Google's sample IDs must never appear in a workflow — a release CI
//    build must never silently ship them.
const REAL_ADMOB_APP_ID = "ca-app-pub-2708638041809482~4540309917";
const REAL_ADMOB_BANNER_AD_UNIT_ID = "ca-app-pub-2708638041809482/4316948636";
const SAMPLE_ADMOB_PUBLISHER_ID = "3940256099942544";
for (const [label, workflow] of [
    ["Android workflow", androidWorkflow],
    ["Play bundle workflow", playBundleWorkflow],
] as const) {
    requireText(
        workflow,
        `MUNCH_ADMOB_APP_ID: ${REAL_ADMOB_APP_ID}`,
        `${label} real AdMob app ID`,
    );
    requireText(
        workflow,
        `MUNCH_ADMOB_BANNER_AD_UNIT_ID: ${REAL_ADMOB_BANNER_AD_UNIT_ID}`,
        `${label} real AdMob banner ad unit ID`,
    );
    if (workflow.includes(SAMPLE_ADMOB_PUBLISHER_ID)) {
        throw new Error(
            `${label} still pins Google sample AdMob IDs (publisher ${SAMPLE_ADMOB_PUBLISHER_ID})`,
        );
    }
}
// 2. build.gradle reads the IDs from the env, keeps the sample IDs only
//    as a local-dev fallback, and hard-fails a release build that would
//    otherwise ship them.
requireText(
    androidBuildGradle,
    "System.getenv('MUNCH_ADMOB_APP_ID')",
    "AdMob app ID env wiring",
);
requireText(
    androidBuildGradle,
    "System.getenv('MUNCH_ADMOB_BANNER_AD_UNIT_ID')",
    "AdMob banner ad unit ID env wiring",
);
requireText(
    androidBuildGradle,
    "never ships Google sample AdMob IDs",
    "Release sample-ID guard",
);
requireText(
    androidBuildGradle,
    "configuredAdMobAppId ?: sampleAdMobAppId",
    "Sample AdMob IDs are a fallback only",
);
// 3. The remote flag contract: server env MUNCH_ADS_ENABLED, DEFAULT
//    OFF, surfaced on the bootstrap as ads.enabled, and fail-closed at
//    every client layer (policy, app shell, native plugin).
requireText(adsConfig, "MUNCH_ADS_ENABLED", "Ads remote flag env");
requireText(appRepository, "ads: getAdsConfig()", "Bootstrap ads flag");
requireText(adsPolicy, "adsEnabled === true", "Ads policy flag gate");
requireText(appJs, "bootstrap?.ads?.enabled", "App shell ads flag read");
requireText(appJs, "adsEnabled: adsEnabled === true", "App shell ads flag");
requireText(
    adsPlugin,
    'call.getBoolean("adsEnabled", false)',
    "Native ads plugin flag gate (missing flag fails closed)",
);
requireText(
    adsPlugin,
    "visible && adsEnabled && !adFree",
    "Native ads plugin: no ad load when the flag is off or the account is Premium/ad-free",
);

console.log("Installed Android architecture smoke checks passed.");
