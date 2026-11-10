import { describe, expect, test } from "bun:test";
import { shouldShowAndroidBanner } from "../public/ads-policy.js";

describe("Android banner placement", () => {
    const eligible = {
        route: "more",
        pathname: "/app/more",
        dialogOpen: false,
        adFree: false,
        adsEnabled: true,
    };

    test("shows only on the More screen for a server-confirmed free account", () => {
        expect(shouldShowAndroidBanner(eligible)).toBe(true);
    });

    test("hides for an ad-free account or unknown entitlement state", () => {
        expect(shouldShowAndroidBanner({ ...eligible, adFree: true })).toBe(
            false,
        );
        expect(
            shouldShowAndroidBanner({ ...eligible, adFree: undefined }),
        ).toBe(false);
    });

    test("hides on nutrition screens, other platforms, and open dialogs", () => {
        expect(shouldShowAndroidBanner({ ...eligible, route: "today" })).toBe(
            false,
        );
        expect(shouldShowAndroidBanner({ ...eligible, pathname: "/app" })).toBe(
            false,
        );
        expect(shouldShowAndroidBanner({ ...eligible, dialogOpen: true })).toBe(
            false,
        );
    });

    test("ADS-FOUNDATION: the remote flag defaults OFF and fails closed", () => {
        // Flag explicitly off (the shipped default: MUNCH_ADS_ENABLED
        // unset on the server) — no banner even for an eligible account.
        expect(
            shouldShowAndroidBanner({ ...eligible, adsEnabled: false }),
        ).toBe(false);
        // Flag missing entirely (a bootstrap that predates ADS-FOUNDATION,
        // or a failed bootstrap) — still no banner.
        const { adsEnabled: _omitted, ...withoutFlag } = eligible;
        expect(shouldShowAndroidBanner(withoutFlag)).toBe(false);
        expect(
            shouldShowAndroidBanner({ ...eligible, adsEnabled: undefined }),
        ).toBe(false);
    });
});
