/**
 * ADS-FOUNDATION (Amendment D / Amendment G item 3): the server-driven
 * ads flag.
 *
 * Contract:
 * - Server env `MUNCH_ADS_ENABLED` is the ONLY switch. It is DEFAULT
 *   OFF: unset, empty, or any value other than "true" (case-insensitive,
 *   trimmed) means ads are disabled. Slots ship dark until Michael
 *   flips the env in Railway (AdMob reactivation + per-app review are
 *   account-side gates, not code gates).
 * - The flag reaches the packaged app through the existing bootstrap:
 *   `GET /api/app/bootstrap` returns `ads: { enabled: boolean }`
 *   (see getAppBootstrap in src/app/repository.ts).
 * - Clients fail closed: the web/app policy (public/ads-policy.js) and
 *   the native MunchAdsPlugin both treat a missing flag as OFF, and the
 *   plugin makes no ad load attempt unless it receives
 *   `adsEnabled: true` together with `adFree: false` (Premium accounts
 *   never load ads).
 */
export interface MunchAdsConfig {
    enabled: boolean;
}

export function adsEnabledFromEnv(
    env: Record<string, string | undefined> = process.env,
): boolean {
    return env.MUNCH_ADS_ENABLED?.trim().toLowerCase() === "true";
}

export function getAdsConfig(): MunchAdsConfig {
    return { enabled: adsEnabledFromEnv() };
}
