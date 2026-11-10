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
        adsEnabled === true &&
        route === "more" &&
        pathname === "/app/more" &&
        dialogOpen !== true &&
        adFree === false
    );
}
