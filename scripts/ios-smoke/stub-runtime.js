/**
 * IOS-SMOKE fixture runtime — TEST ONLY, never shipped.
 *
 * The iOS boot/flow smoke job (.github/workflows/mobile-ios.yml, job
 * `smoke`) builds the real .mobile-web bundle exactly like the validate
 * leg, then swaps this file in as .mobile-web/mobile-runtime.js before
 * `cap sync ios`. Only the native-bridge module is replaced; every other
 * byte the simulator runs — mobile-entry.js, app.js, app-patches.js,
 * pantry.js, the login page — is the production bundle.
 *
 * This mirrors the S4 web-bundle e2e stub (e2e/mobile-bundle.e2e.ts),
 * with two differences forced by the simulator:
 *
 *   1. There is no loopback fixture server inside the packaged app, so
 *      requestJson answers the bootstrap / Today / Log / Settings /
 *      Pantry reads from the in-file fixture table below instead of
 *      fetching. Shapes match the fixtures the web e2e lane already
 *      uses against the same renderers.
 *   2. The stub session is switchable, because one installed app has to
 *      prove both cold-start states: a fresh install has no session
 *      (the entry must bounce to the packaged sign-in page), and
 *      "opening the sign-in link on this device" is simulated by
 *      requestMobileMagicLink planting the fixture session flag, so the
 *      next launch boots the real shell. No real credential, account,
 *      or network call exists anywhere in this file.
 *
 * The session flag lives in localStorage, which WKWebView persists per
 * app install — the same lifetime the real Keychain-backed session has
 * for the flows exercised here.
 */

const SESSION_KEY = "munch.iosSmoke.session";

function hasFixtureSession() {
    try {
        return window.localStorage.getItem(SESSION_KEY) === "1";
    } catch {
        return false;
    }
}

function setFixtureSession(present) {
    try {
        if (present) window.localStorage.setItem(SESSION_KEY, "1");
        else window.localStorage.removeItem(SESSION_KEY);
    } catch {
        // Storage unavailable: hasStoredSession keeps reporting signed
        // out and the smoke fails on the sign-in assertions, loudly.
    }
}

// The platform helpers that do not depend on the native bridge are the
// real ones, re-exported exactly like the web e2e stub does. Only
// requestJson is fixture-backed (see header).
export {
    getMunchPlatformKind,
    installOfflineBanner,
    isConnectivityError,
    isOffline,
    resolveMunchApiUrl,
} from "./app-api.js";

const FIXTURES = {
    "/api/app/bootstrap": {
        profile: { timezone: "UTC", preferred_weight_unit: "lb" },
        productPolicy: {
            premiumPriceMonthlyCents: 299,
            householdMemberPriceMonthlyCents: 0,
            householdMemberLimit: 5,
        },
    },
    "/api/app/today": {
        totals: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
        meals: [],
        water: { entries: [], totalMl: 0 },
        weight: [],
        goals: {},
        drafts: [],
        plannedMeals: [],
    },
    "/api/app/guidance/next-up": {
        date: "2026-11-10",
        day_part: "midday",
        is_today: true,
        state: "quiet",
        objective_set: true,
        goal_prompt: { show: false },
        quiet_line:
            "Nothing needs deciding right now — log the next meal when you eat it.",
        primary: null,
        secondary: [],
    },
    "/api/app/meals": {
        meals: [],
        totals: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
        search: null,
    },
    "/api/app/food-search": {},
    "/api/app/foods": { foods: [], total: 0, limit: null },
    "/api/app/settings": {
        user: { email: "smoke@munch.test" },
        capabilities: { tier: "free" },
        connections: [],
        productPolicy: {
            premiumPriceMonthlyCents: 299,
            householdMemberPriceMonthlyCents: 0,
            householdMemberLimit: 5,
        },
    },
    "/api/app/pantry/settings": { enabled: true, household_available: false },
    "/api/app/pantry": { items: [] },
};

export async function requestJson(path, options = {}) {
    void options;
    const pathname = String(path).split("?")[0];
    const fixture = FIXTURES[pathname];
    // Unknown reads get an empty object, like the web e2e fixture
    // server's fallthrough; writes are acknowledged without effect.
    return fixture ? structuredClone(fixture) : {};
}

// --- Installed-app routing (mirrors mobile/navigation.js semantics) ---

const APP_ROUTE_PATTERN = /^\/app(?:\/|$)/;

function installedAppRoute(value) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!APP_ROUTE_PATTERN.test(trimmed)) return null;
    try {
        const parsed = new URL(trimmed, "https://installed.munch.invalid");
        if (parsed.origin !== "https://installed.munch.invalid") return null;
        if (!APP_ROUTE_PATTERN.test(parsed.pathname)) return null;
        return parsed.pathname;
    } catch {
        return null;
    }
}

export function installedReturnRoute(value) {
    return installedAppRoute(value) || "/app";
}

export function currentInstalledAppRoute() {
    return installedReturnRoute(location.pathname);
}

export function installedLoginUrl(returnTo = currentInstalledAppRoute()) {
    const route = installedAppRoute(returnTo) || "/app";
    return `/mobile-login.html?return_to=${encodeURIComponent(route)}`;
}

export async function restoreInstalledEntryRoute(explicitRoute) {
    const route = installedAppRoute(explicitRoute);
    if (route && route !== location.pathname) {
        history.replaceState({}, "", route);
    }
    return route || "/app";
}

// --- Session (fixture flag; see header) ---

export async function hasStoredSession() {
    return hasFixtureSession();
}

export async function signOutInstalledSession() {
    setFixtureSession(false);
}

export async function requestMobileMagicLink(email, returnTo = "/app") {
    void returnTo;
    if (typeof email !== "string" || !email.includes("@")) {
        throw new Error("Enter a valid email address");
    }
    // Fixture sign-in: requesting the link plants the session, so the
    // next app launch behaves as if the link was opened on this device.
    // The login page itself keeps showing its real "check your email"
    // state; nothing here navigates or touches a network.
    setFixtureSession(true);
}

export async function signInWithGoogle() {
    throw new Error("Google sign-in is unavailable in the iOS smoke fixture");
}

export async function isGoogleSignInAvailable() {
    return false;
}

// --- Native capability surfaces the shell probes (mirrors the web e2e stub) ---

export async function getInstalledPlayBillingConfig() {
    return { configured: false };
}

export async function getInstalledPremiumProduct() {
    throw new Error("Play Billing is not configured in the iOS smoke fixture");
}

export async function purchaseInstalledPremium() {
    throw new Error("Play Billing is not configured in the iOS smoke fixture");
}

export async function restoreInstalledPremium() {
    return { state: "unavailable" };
}

export async function openInstalledSubscriptionManagement() {
    return null;
}

export async function takeInstalledPhoto() {
    throw new Error("Camera is unavailable in the iOS smoke fixture");
}

export async function chooseInstalledPhoto() {
    return null;
}

export async function scanInstalledBarcode() {
    throw new Error("Barcode scanning is unavailable in the iOS smoke fixture");
}
