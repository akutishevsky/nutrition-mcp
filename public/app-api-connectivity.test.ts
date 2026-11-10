import { afterEach, describe, expect, test } from "bun:test";
import {
    isConnectivityError,
    isOffline,
    requestJson,
    resetMunchPlatformAdapter,
} from "./app-api.js";

/**
 * S4 (Full Parity App Program): the shared transport is where honest
 * connectivity behaviour lives — the web portal and the packaged app
 * both ride it. These tests pin the contract: unreachable API =
 * connectivity error; an offline write fails honestly, is never
 * queued, and never reaches the network.
 */

const originalFetch = globalThis.fetch;
const originalNavigator = globalThis.navigator;

function setOnLine(value: boolean) {
    Object.defineProperty(globalThis, "navigator", {
        value: { onLine: value },
        configurable: true,
    });
}

afterEach(() => {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        configurable: true,
    });
    resetMunchPlatformAdapter();
});

describe("shared transport connectivity honesty (S4)", () => {
    test("isOffline reflects navigator.onLine", () => {
        setOnLine(false);
        expect(isOffline()).toBe(true);
        setOnLine(true);
        expect(isOffline()).toBe(false);
    });

    test("a network failure becomes a connectivity error", async () => {
        setOnLine(true);
        globalThis.fetch = (async () => {
            throw new TypeError("fetch failed");
        }) as typeof fetch;
        const error = await requestJson("/api/app/bootstrap").catch(
            (caught) => caught,
        );
        expect(isConnectivityError(error)).toBe(true);
        expect(error.message).toContain("Can't reach Munch");
    });

    test("an offline write fails honestly and never reaches the network", async () => {
        setOnLine(false);
        let fetched = false;
        globalThis.fetch = (async () => {
            fetched = true;
            return Response.json({ ok: true });
        }) as typeof fetch;
        const error = await requestJson("/api/app/water", {
            method: "POST",
            body: JSON.stringify({ amount_ml: 350 }),
        }).catch((caught) => caught);
        expect(isConnectivityError(error)).toBe(true);
        expect(error.message).toContain("Nothing was queued");
        expect(fetched).toBe(false);
    });

    test("an offline read fails as a connectivity error without fetching", async () => {
        setOnLine(false);
        let fetched = false;
        globalThis.fetch = (async () => {
            fetched = true;
            return Response.json({ ok: true });
        }) as typeof fetch;
        const error = await requestJson("/api/app/today").catch(
            (caught) => caught,
        );
        expect(isConnectivityError(error)).toBe(true);
        expect(fetched).toBe(false);
    });

    test("a gateway 503 is tagged as connectivity, keeping its status", async () => {
        setOnLine(true);
        globalThis.fetch = (async () =>
            Response.json(
                { error: "unavailable" },
                { status: 503 },
            )) as typeof fetch;
        const error = await requestJson("/api/app/bootstrap").catch(
            (caught) => caught,
        );
        expect(isConnectivityError(error)).toBe(true);
        expect(error.status).toBe(503);
    });

    test("aborts stay aborts, not connectivity errors", async () => {
        setOnLine(true);
        globalThis.fetch = (async () => {
            const abort = new Error("The operation was aborted");
            abort.name = "AbortError";
            throw abort;
        }) as typeof fetch;
        const error = await requestJson("/api/app/bootstrap").catch(
            (caught) => caught,
        );
        expect(error.name).toBe("AbortError");
        expect(isConnectivityError(error)).toBe(false);
    });

    test("ordinary HTTP errors are not connectivity errors", async () => {
        setOnLine(true);
        globalThis.fetch = (async () =>
            Response.json(
                { error: "bad request" },
                { status: 400 },
            )) as typeof fetch;
        const error = await requestJson("/api/app/today").catch(
            (caught) => caught,
        );
        expect(isConnectivityError(error)).toBe(false);
        expect(error.status).toBe(400);
    });
});
