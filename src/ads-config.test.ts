import { describe, expect, test } from "bun:test";
import { adsEnabledFromEnv, getAdsConfig } from "./ads-config.js";

describe("MUNCH_ADS_ENABLED remote flag (ADS-FOUNDATION)", () => {
    test("defaults OFF when the env is unset", () => {
        expect(adsEnabledFromEnv({})).toBe(false);
        expect(adsEnabledFromEnv({ MUNCH_ADS_ENABLED: undefined })).toBe(false);
    });

    test("defaults OFF for empty and non-true values", () => {
        for (const value of ["", "false", "0", "no", "off", "yes", "1"]) {
            expect(adsEnabledFromEnv({ MUNCH_ADS_ENABLED: value })).toBe(false);
        }
    });

    test("only an explicit true enables ads", () => {
        expect(adsEnabledFromEnv({ MUNCH_ADS_ENABLED: "true" })).toBe(true);
        expect(adsEnabledFromEnv({ MUNCH_ADS_ENABLED: " TRUE " })).toBe(true);
    });

    test("getAdsConfig reflects the current process env", () => {
        const previous = process.env.MUNCH_ADS_ENABLED;
        try {
            delete process.env.MUNCH_ADS_ENABLED;
            expect(getAdsConfig()).toEqual({ enabled: false });
            process.env.MUNCH_ADS_ENABLED = "true";
            expect(getAdsConfig()).toEqual({ enabled: true });
        } finally {
            if (previous === undefined) delete process.env.MUNCH_ADS_ENABLED;
            else process.env.MUNCH_ADS_ENABLED = previous;
        }
    });
});
