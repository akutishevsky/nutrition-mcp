import { describe, expect, test } from "bun:test";
import {
    installedAppRoute,
    installedLoginHref,
    installedRouteFromUrl,
} from "./navigation.js";

describe("installed mobile navigation", () => {
    test("accepts only real /app routes", () => {
        expect(installedAppRoute("/app")).toBe("/app");
        expect(installedAppRoute("/app/recipes")).toBe("/app/recipes");
        expect(installedAppRoute(" /app/plan?ignored=1#hash ")).toBe(
            "/app/plan",
        );
        expect(installedAppRoute("/application")).toBeNull();
        expect(installedAppRoute("/app-store")).toBeNull();
        expect(installedAppRoute("https://evil.example/app")).toBeNull();
    });

    test("maps only Munch app deep links", () => {
        expect(installedRouteFromUrl("munch://app")).toBe("/app");
        expect(installedRouteFromUrl("munch://app/recipes")).toBe(
            "/app/recipes",
        );
        expect(installedRouteFromUrl("munch://app/plan?date=tomorrow")).toBe(
            "/app/plan",
        );
        expect(installedRouteFromUrl("munch://application")).toBeNull();
        expect(installedRouteFromUrl("garbage")).toBeNull();
    });

    test("maps verified https app links through the same allowlist", () => {
        expect(installedRouteFromUrl("https://munch.business/app")).toBe(
            "/app",
        );
        expect(
            installedRouteFromUrl("https://munch.business/app/recipes"),
        ).toBe("/app/recipes");
        // The auth callback is not an app route; the handoff branch in
        // the runtime owns it and this mapping must not claim it.
        expect(
            installedRouteFromUrl(
                "https://munch.business/mobile/auth/callback?code=x",
            ),
        ).toBeNull();
        expect(
            installedRouteFromUrl("https://munch.business/pricing"),
        ).toBeNull();
        expect(installedRouteFromUrl("https://evil.example/app")).toBeNull();
        expect(installedRouteFromUrl("http://munch.business/app")).toBeNull();
    });

    test("builds a safe installed login return URL", () => {
        expect(installedLoginHref("/app/recipes")).toBe(
            "/mobile-login.html?return_to=%2Fapp%2Frecipes",
        );
        expect(installedLoginHref("https://evil.example/app")).toBe(
            "/mobile-login.html?return_to=%2Fapp",
        );
    });
});
