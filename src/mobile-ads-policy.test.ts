import { describe, expect, test } from "bun:test";
import {
    shouldRenderTodayAdSlot,
    shouldShowAndroidBanner,
} from "../public/ads-policy.js";

describe("Android banner placement", () => {
    const eligible = {
        route: "today",
        pathname: "/app",
        dialogOpen: false,
        adFree: false,
        adsEnabled: true,
    };

    test("shows only on Today (home) for a server-confirmed free account with the remote flag on", () => {
        expect(shouldShowAndroidBanner(eligible)).toBe(true);
        // The packaged bundle boots at its root before navigation
        // rewrites the path to /app; route is already "today" there.
        expect(shouldShowAndroidBanner({ ...eligible, pathname: "/" })).toBe(
            true,
        );
    });

    test("hides for an ad-free account or unknown entitlement state", () => {
        expect(shouldShowAndroidBanner({ ...eligible, adFree: true })).toBe(
            false,
        );
        expect(
            shouldShowAndroidBanner({ ...eligible, adFree: undefined }),
        ).toBe(false);
    });

    test("hides on every other surface and while a dialog is open", () => {
        // Amendment D final placement law: exactly ONE slot app-wide —
        // Today under Today's guidance. The retired More-screen
        // placement and every browse/logging surface stay ad-free.
        expect(shouldShowAndroidBanner({ ...eligible, route: "more" })).toBe(
            false,
        );
        expect(
            shouldShowAndroidBanner({ ...eligible, pathname: "/app/more" }),
        ).toBe(false);
        expect(shouldShowAndroidBanner({ ...eligible, route: "log" })).toBe(
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

describe("Today in-flow ad slot", () => {
    const eligible = {
        route: "today",
        adsEnabled: true,
        adFree: false,
        nativeAdsAvailable: true,
    };

    test("renders the reserve only for a flagged-on free packaged account on Today", () => {
        expect(shouldRenderTodayAdSlot(eligible)).toBe(true);
    });

    test("renders nothing while the flag is off, for Premium, on the website, or off Today", () => {
        expect(
            shouldRenderTodayAdSlot({ ...eligible, adsEnabled: false }),
        ).toBe(false);
        expect(
            shouldRenderTodayAdSlot({ ...eligible, adsEnabled: undefined }),
        ).toBe(false);
        expect(shouldRenderTodayAdSlot({ ...eligible, adFree: true })).toBe(
            false,
        );
        expect(
            shouldRenderTodayAdSlot({
                ...eligible,
                nativeAdsAvailable: false,
            }),
        ).toBe(false);
        expect(shouldRenderTodayAdSlot({ ...eligible, route: "log" })).toBe(
            false,
        );
    });
});
