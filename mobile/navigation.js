const APP_ROUTE_PATTERN = /^\/app(?:\/|$)/;

export function installedAppRoute(value) {
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

export function installedRouteFromUrl(value) {
    try {
        const parsed = new URL(value);
        // Verified app links: an https://munch.business URL routes into
        // the shell only when its path is inside the same /app allowlist
        // (the /mobile/auth/callback path is handled earlier by the
        // auth-handoff branch and never reaches this mapping).
        if (
            parsed.protocol === "https:" &&
            parsed.hostname === "munch.business"
        ) {
            return installedAppRoute(parsed.pathname);
        }
        if (parsed.protocol !== "munch:") return null;
        // Derive the route from the raw string, not from the parsed
        // hostname/pathname: some WebView URL engines treat
        // non-special schemes as opaque paths, leaving hostname empty
        // and the "//app" authority inside the pathname, which made
        // every munch://app/* link resolve to null on the emulator
        // boot lane (S4 deep-link evidence). The raw form is stable
        // across engines: munch://app/<route> (the leading "app"
        // segment is the link host, the rest is the in-app route).
        const raw = String(value);
        const afterScheme = raw.slice(raw.indexOf(":") + 1).replace(/^\/+/, "");
        const segments = afterScheme.split("/").filter(Boolean);
        if (segments[0] !== "app") return null;
        segments.shift();
        const route = `/${["app", ...segments].join("/")}`;
        return installedAppRoute(route);
    } catch {
        return null;
    }
}

export function installedLoginHref(returnTo = "/app") {
    const route = installedAppRoute(returnTo) || "/app";
    return `/mobile-login.html?return_to=${encodeURIComponent(route)}`;
}
