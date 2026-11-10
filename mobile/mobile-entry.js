import {
    currentInstalledAppRoute,
    hasStoredSession,
    installedLoginUrl,
    restoreInstalledEntryRoute,
} from "./mobile-runtime.js";

const explicitRoute = new URLSearchParams(location.search).get("route");
await restoreInstalledEntryRoute(explicitRoute);

// S4 offline cold start: with no connectivity the packaged shell still
// renders — the real chrome plus a designed offline state — instead of
// bouncing to sign-in or sitting on the skeleton. The stored session
// is never touched here: a signed-in user stays signed in, and the
// state says their data loads when the connection returns. Nothing is
// queued while offline (Decision 6).
if (typeof navigator !== "undefined" && navigator.onLine === false) {
    const content = document.getElementById("app-content");
    if (content) {
        content.innerHTML = `<div class="error-state offline-state" data-testid="offline-state"><div><p class="section-kicker">Connection</p><h2>You're offline</h2><p>Munch needs a connection to load your data. If you're signed in, your session stays saved on this device and everything will load as soon as you're back online. Nothing is queued or saved while you're offline.</p><button class="button button-primary spacer-top" type="button" id="offline-retry">Try again</button></div></div>`;
        document
            .getElementById("offline-retry")
            ?.addEventListener("click", () => location.reload());
    }
} else if (!(await hasStoredSession())) {
    console.log(`S4DBG entry path=${location.pathname} target=${installedLoginUrl(currentInstalledAppRoute())}`);
    location.replace(installedLoginUrl(currentInstalledAppRoute()));
} else {
    await import("./app-integrity.js");
    await import("./app.js");
    await import("./app-patches.js");
    await import("./billing-native.js");
    await import("./meal-photo-native.js");
}
