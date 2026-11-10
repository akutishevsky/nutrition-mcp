const webPlatform = Object.freeze({
    kind: "web",
    apiBaseUrl: null,
    async getAccessToken() {
        return null;
    },
    async onAuthenticationRequired() {
        const returnTo = `${location.pathname}${location.search}${location.hash}`;
        location.href = `/connect/sign-in?return_to=${encodeURIComponent(returnTo)}`;
    },
});

let platform = webPlatform;

function normalizedApiBaseUrl(value) {
    if (!value) return null;
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
        throw new Error("Munch API base URL must use HTTPS");
    }
    return parsed.origin;
}

export function setMunchPlatformAdapter(adapter) {
    if (!adapter || (adapter.kind !== "web" && adapter.kind !== "mobile")) {
        throw new Error("Invalid Munch platform adapter");
    }
    platform = Object.freeze({
        kind: adapter.kind,
        apiBaseUrl: normalizedApiBaseUrl(adapter.apiBaseUrl),
        getAccessToken:
            typeof adapter.getAccessToken === "function"
                ? adapter.getAccessToken
                : webPlatform.getAccessToken,
        onAuthenticationRequired:
            typeof adapter.onAuthenticationRequired === "function"
                ? adapter.onAuthenticationRequired
                : webPlatform.onAuthenticationRequired,
    });
}

export function resetMunchPlatformAdapter() {
    platform = webPlatform;
}

export function getMunchPlatformKind() {
    return platform.kind;
}

export function resolveMunchApiUrl(path) {
    if (typeof path !== "string" || !path.startsWith("/")) {
        throw new Error("Munch API path must be root-relative");
    }
    if (!platform.apiBaseUrl) return path;
    return new URL(path, platform.apiBaseUrl).toString();
}

function shouldSetJsonContentType(body) {
    if (body === undefined || body === null) return false;
    if (typeof FormData !== "undefined" && body instanceof FormData)
        return false;
    if (
        typeof URLSearchParams !== "undefined" &&
        body instanceof URLSearchParams
    )
        return false;
    if (typeof Blob !== "undefined" && body instanceof Blob) return false;
    return true;
}

/**
 * S4 (Full Parity App Program) — honest connectivity states.
 *
 * One vocabulary for "the API cannot be reached" (device offline OR the
 * Munch service down) shared by the web portal and the packaged app,
 * whose transport is this same module. A connectivity failure is never
 * a queued write and never a fake success: reads surface a designed
 * can't-reach state and writes fail with an explicit message.
 */
export const CONNECTIVITY_MESSAGE =
    "Can't reach Munch right now. Check your connection and try again.";
export const OFFLINE_WRITE_MESSAGE =
    "You're offline, so this can't be saved yet. Nothing was queued — try again when your connection is back.";

export function isOffline() {
    return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function isConnectivityError(error) {
    return Boolean(
        error && typeof error === "object" && error.isConnectivity === true,
    );
}

export function connectivityError(message = CONNECTIVITY_MESSAGE, cause) {
    const error = new Error(message);
    error.isConnectivity = true;
    error.code = "connectivity_unavailable";
    if (cause !== undefined) error.cause = cause;
    return error;
}

/**
 * Persistent offline banner (P7: empty/error/loading states are designed
 * states). Appended once, toggled by the browser's online/offline
 * events and the initial connectivity state. DOM access is lazy so the
 * transport smoke (Bun, no document) can import this module safely.
 */
export function installOfflineBanner() {
    if (typeof document === "undefined") return null;
    let banner = document.querySelector('[data-testid="offline-banner"]');
    if (!banner) {
        banner = document.createElement("div");
        banner.className = "offline-banner";
        banner.dataset.testid = "offline-banner";
        banner.setAttribute("role", "status");
        banner.textContent =
            "You're offline. Munch can't load or save changes until your connection is back — nothing is queued in the meantime.";
        document.body.append(banner);
    }
    const sync = () => {
        banner.hidden = !isOffline();
    };
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    sync();
    return banner;
}

function errorMessage(payload, status) {
    if (payload && typeof payload === "object") {
        if (typeof payload.message === "string" && payload.message) {
            return payload.message;
        }
        if (typeof payload.error === "string" && payload.error) {
            return payload.error;
        }
    }
    return `Request failed (${status})`;
}

export async function requestJson(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    if (
        !headers.has("Content-Type") &&
        shouldSetJsonContentType(options.body)
    ) {
        headers.set("Content-Type", "application/json");
    }

    const token = await platform.getAccessToken();
    if (platform.kind === "mobile") {
        if (!token) {
            await platform.onAuthenticationRequired({
                reason: "missing_token",
            });
            throw new Error("Authentication required");
        }
        headers.set("Authorization", `Bearer ${token}`);
    }

    const method = String(options.method || "GET").toUpperCase();
    const isWrite = !["GET", "HEAD", "OPTIONS"].includes(method);
    // Honest offline writes (Decision 6): a write attempted with no
    // connectivity fails here with an explicit message. It is never
    // queued, retried silently, or reported as saved.
    if (isOffline()) {
        throw connectivityError(
            isWrite ? OFFLINE_WRITE_MESSAGE : CONNECTIVITY_MESSAGE,
        );
    }

    let response;
    try {
        response = await fetch(resolveMunchApiUrl(path), {
            ...options,
            headers,
            credentials: platform.kind === "mobile" ? "omit" : "same-origin",
        });
    } catch (fetchError) {
        if (fetchError?.name === "AbortError") throw fetchError;
        throw connectivityError(
            isWrite && isOffline()
                ? OFFLINE_WRITE_MESSAGE
                : CONNECTIVITY_MESSAGE,
            fetchError,
        );
    }

    if (response.status === 401) {
        await platform.onAuthenticationRequired({ reason: "unauthorized" });
        const error = new Error("Authentication required");
        error.status = 401;
        throw error;
    }

    const text = await response.text();
    let payload = {};
    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            payload = { error: text };
        }
    }

    if (!response.ok) {
        const error = new Error(errorMessage(payload, response.status));
        error.status = response.status;
        error.payload = payload;
        // A gateway-level failure means the service itself is
        // unreachable; views render the same can't-reach state as a
        // device-offline failure instead of a raw error.
        if ([502, 503, 504].includes(response.status)) {
            error.isConnectivity = true;
            error.code = "connectivity_unavailable";
        }
        throw error;
    }

    return payload;
}
