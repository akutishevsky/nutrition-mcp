// Munch ad placement policy — the single source of truth for where the
// app's ONE ad may appear (Amendment D final placement law, Michael
// 2026-11-09 ~19:08 ET: "only that banner ad on home screen. Nowhere
// else.").
//
// The one slot lives on Today (the home screen), in-flow directly under
// the "Next up" panel (the guidance section, reworked 2026-11-10).
// Every other route is ad-free — browse,
// logging, account, billing, legal. Two independent gates must BOTH
// pass before anything renders or loads:
//
// 1. The server-driven remote flag (ADS-FOUNDATION contract: bootstrap
//    `ads.enabled`, env MUNCH_ADS_ENABLED, DEFAULT OFF — slots ship
//    dark while the AdMob publisher is deactivated). Anything but an
//    explicit `true` fails closed: a bootstrap that predates the flag
//    must never show an ad.
// 2. Premium is ad-free: the banner loads only for an account the
//    server has explicitly confirmed is NOT ad-free
//    (`androidEntitlements.adFree === false`). Unknown entitlement
//    state fails closed.

export function shouldShowAndroidBanner({
    route,
    pathname,
    dialogOpen,
    adFree,
    adsEnabled,
}) {
    return (
        // ADS-FOUNDATION: the server-driven remote flag (bootstrap
        // `ads.enabled`, env MUNCH_ADS_ENABLED, DEFAULT OFF) gates
        // every banner. Anything but an explicit true fails closed —
        // a bootstrap that predates the flag must never show an ad.
        // S6 slice 1 re-points the placement from the legacy "more"
        // route to its Amendment D home: Today.
        adsEnabled === true &&
        route === "today" &&
        // Today is /app in the portal, and the packaged bundle also
        // boots at its root ("/" is index.html, route already "today")
        // before any in-app navigation rewrites the path.
        (pathname === "/app" || pathname === "/app/" || pathname === "/") &&
        dialogOpen !== true &&
        adFree === false
    );
}

// The in-flow Today slot (the DOM reserve rendered between the guidance
// panel and the meals panel) follows the same flag + entitlement gates.
// It deliberately does NOT depend on dialog state or transient UI: the
// reserve either exists at its final slim height from first render or
// does not exist at all, so the Today layout never shifts when a dialog
// opens or the native banner loads. It renders only where a native ad
// surface exists (the packaged app) — the website carries no ads.
export function shouldRenderTodayAdSlot({
    route,
    adsEnabled,
    adFree,
    nativeAdsAvailable,
}) {
    return (
        adsEnabled === true &&
        route === "today" &&
        adFree === false &&
        nativeAdsAvailable === true
    );
}
