import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, normalize } from "node:path";
import { expect, test } from "@playwright/test";

/**
 * S0 e2e scaffolding: the packaged `.mobile-web` bundle (what actually
 * ships inside the Android shell) is served statically and driven at
 * Pixel 7 size. This is the web-level half of the boot evidence — the
 * Android emulator lane in mobile-android.yml boots the same bundle
 * inside the packaged APK.
 *
 * Requires `bun run mobile:web` first (CI does this in the website-e2e
 * job before running this config).
 */

const bundleDir = join(process.cwd(), ".mobile-web");

const MIME: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
};

let server: Server;
let baseURL: string;

test.beforeAll(async () => {
    if (!existsSync(join(bundleDir, "index.html"))) {
        throw new Error(
            ".mobile-web bundle is missing — run `bun run mobile:web` before this spec",
        );
    }
    server = createServer((request, response) => {
        const url = new URL(request.url ?? "/", "http://127.0.0.1");
        // S4 stub-session fixtures: when a test replaces the packaged
        // runtime with the session stub below, the app shell talks to
        // this static origin with the web transport, so the bootstrap /
        // Today / guidance reads are answered with minimal fixtures.
        // The real packaged runtime calls https://munch.business and
        // never touches these paths.
        if (url.pathname.startsWith("/api/app/")) {
            const fixtures: Record<string, unknown> = {
                "/api/app/bootstrap": {
                    profile: {
                        timezone: "UTC",
                        preferred_weight_unit: "lb",
                    },
                },
                "/api/app/today": {
                    totals: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
                    meals: [],
                    water: { entries: [], totalMl: 0 },
                    weight: [],
                    goals: {},
                    drafts: [],
                    plannedMeals: [],
                },
                "/api/app/guidance/today": {
                    source_status: "sparse_data",
                    objective: "Track only",
                    actions: [],
                },
            };
            response.writeHead(200, {
                "content-type": "application/json",
                "cache-control": "no-store",
            });
            response.end(JSON.stringify(fixtures[url.pathname] ?? {}));
            return;
        }
        const relative = normalize(decodeURIComponent(url.pathname)).replace(
            /^(\.\.[/\\])+|^[/\\]+/,
            "",
        );
        const filePath = join(
            bundleDir,
            relative === "" ? "index.html" : relative,
        );
        if (
            !filePath.startsWith(bundleDir) ||
            !existsSync(filePath) ||
            !statSync(filePath).isFile()
        ) {
            response.writeHead(404, { "content-type": "text/plain" });
            response.end("not found");
            return;
        }
        response.writeHead(200, {
            "content-type":
                MIME[extname(filePath)] ?? "application/octet-stream",
            "cache-control": "no-store",
        });
        createReadStream(filePath).pipe(response);
    });
    await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address();
    if (!address || typeof address === "string") {
        throw new Error("Static bundle server did not bind a port");
    }
    baseURL = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("packaged mobile bundle cold-starts to the sign-in shell", async ({
    page,
}) => {
    const failedRequests: string[] = [];
    page.on("requestfailed", (request) => {
        if (request.resourceType() === "document") {
            failedRequests.push(request.url());
        }
    });

    await page.goto(`${baseURL}/`);
    // The packaged entry restores the installed-app route and, with no
    // stored session, replaces to the packaged sign-in page.
    await expect(page).toHaveURL(/\/mobile-login\.html/);
    await expect(page).toHaveTitle("Sign in · Munch");
    await expect(
        page.getByRole("heading", { level: 1, name: "Welcome back." }),
    ).toBeVisible();
    await expect(
        page.getByRole("button", { name: "Email me a sign-in link" }),
    ).toBeVisible();
    // S6 slice 10: the packaged sign-in page is Editorial Serif — the
    // shared stylesheet's paper ground and Georgia display type, the
    // multicolour-G Google control, and no password field anywhere
    // (Michael's auth rule: user sign-in is SSO / emailed link only).
    const signInTheme = await page.evaluate(() => {
        const heading = document.querySelector("h1");
        return {
            background: getComputedStyle(document.body).backgroundColor,
            headingFont: heading ? getComputedStyle(heading).fontFamily : "",
            passwordFields: document.querySelectorAll('input[type="password"]')
                .length,
            googleMark: Boolean(document.querySelector("#google-sign-in svg")),
        };
    });
    expect(signInTheme.background).toBe("rgb(246, 241, 231)");
    expect(signInTheme.headingFont).toContain("Georgia");
    expect(signInTheme.passwordFields).toBe(0);
    expect(signInTheme.googleMark).toBe(true);
    expect(failedRequests).toEqual([]);
    await expect
        .poll(() =>
            page.evaluate(
                () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
        )
        .toBe(true);
});

/**
 * S4: a test-only stand-in for the packaged mobile runtime. The real
 * runtime's session lives in an Android Keystore plugin that a desktop
 * browser cannot provide, so the in-shell tests swap the module for
 * this stub: a stored session that is always present, on top of the
 * REAL shared transport (public/app-api.js) and the REAL app.js. Only
 * the native-bridge surface is faked; every behaviour asserted below
 * (connectivity states, write honesty) is production code.
 */
const STUB_RUNTIME = `
export {
    getMunchPlatformKind,
    installOfflineBanner,
    isConnectivityError,
    isOffline,
    requestJson,
    resolveMunchApiUrl,
} from "./app-api.js";
export function installedReturnRoute() {
    return "/app";
}
export function currentInstalledAppRoute() {
    return "/app";
}
export function installedLoginUrl() {
    return "/mobile-login.html";
}
export async function restoreInstalledEntryRoute() {
    return "/app";
}
export async function hasStoredSession() {
    return true;
}
export async function getInstalledPlayBillingConfig() {
    return { configured: false };
}
export async function getInstalledPremiumProduct() {
    throw new Error("Play Billing is not configured in the bundle e2e");
}
export async function purchaseInstalledPremium() {
    throw new Error("Play Billing is not configured in the bundle e2e");
}
export async function restoreInstalledPremium() {
    return { state: "unavailable" };
}
export async function openInstalledSubscriptionManagement() {
    return null;
}
export async function takeInstalledPhoto() {
    throw new Error("Camera is unavailable in the bundle e2e");
}
export async function chooseInstalledPhoto() {
    return null;
}
`;

/**
 * Playwright's offline mode blocks ALL network traffic, including the
 * loopback document load — but the packaged app never loads its bundle
 * over the network (it ships inside the APK). For offline tests this
 * fulfils bundle assets from disk, mirroring the on-device packaging,
 * while real API traffic still hits the (offline) network and fails.
 */
async function serveBundleFromDisk(page: import("@playwright/test").Page) {
    await page.route(`${baseURL}/**`, async (route) => {
        const url = new URL(route.request().url());
        if (url.pathname.startsWith("/api/")) return route.fallback();
        const relative = normalize(decodeURIComponent(url.pathname)).replace(
            /^(\.\.[/\\])+|^[/\\]+/,
            "",
        );
        const filePath = join(
            bundleDir,
            relative === "" ? "index.html" : relative,
        );
        if (
            !filePath.startsWith(bundleDir) ||
            !existsSync(filePath) ||
            !statSync(filePath).isFile()
        ) {
            return route.fallback();
        }
        await route.fulfill({
            contentType: MIME[extname(filePath)] ?? "application/octet-stream",
            body: readFileSync(filePath),
        });
    });
}

async function stubPackagedSession(page: import("@playwright/test").Page) {
    await page.route(/\/mobile-runtime\.js$/, (route) =>
        route.fulfill({ contentType: "text/javascript", body: STUB_RUNTIME }),
    );
}

test("packaged bundle offline cold start renders the designed offline state", async ({
    page,
    context,
}) => {
    await serveBundleFromDisk(page);
    await context.setOffline(true);
    await page.goto(`${baseURL}/`);
    // The real shell renders (chrome + bottom nav), with the designed
    // offline state in place of the data view — never a blank screen
    // or an indefinite skeleton.
    await expect(page.getByTestId("offline-state")).toBeVisible();
    await expect(page.getByTestId("offline-state")).toContainText(
        "You're offline",
    );
    await expect(page.getByTestId("offline-state")).toContainText(
        "session stays saved on this device",
    );
    await expect(page.locator(".app-shell")).toBeVisible();
    // This spec also runs under the default config's desktop project,
    // where the bottom nav is desktop-hidden by design; assert it only
    // at phone widths (the Pixel 7 lane is the canonical one).
    if ((page.viewportSize()?.width ?? 0) <= 900) {
        await expect(page.locator(".mobile-bottom-nav")).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(page.locator(".loading-state")).toHaveCount(0);
    await context.setOffline(false);
});

test("packaged sign-in shows its offline banner while offline", async ({
    page,
    context,
}) => {
    await serveBundleFromDisk(page);
    await context.setOffline(true);
    await page.goto(`${baseURL}/mobile-login.html`);
    await expect(page).toHaveTitle("Sign in · Munch");
    await expect(page.getByTestId("offline-banner")).toBeVisible();
    await expect(page.getByTestId("offline-banner")).toContainText(
        "You're offline",
    );
    await context.setOffline(false);
    await expect(page.getByTestId("offline-banner")).toBeHidden();
});

test("packaged shell renders the can't-reach state when the API dies mid-session", async ({
    page,
}) => {
    await stubPackagedSession(page);
    await page.goto(`${baseURL}/`);
    // The stub session boots the real app shell onto Today.
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();

    // The API becomes unreachable (server down / connection dropped):
    // the next view must render the designed can't-reach state with a
    // retry action — not a hanging spinner or a raw error.
    await page.route("**/api/app/**", (route) => route.abort());
    // :visible picks the bottom nav at phone widths and the sidebar
    // under the default config's desktop project.
    await page.locator('a[data-route="log"]:visible').first().click();
    await expect(page.getByTestId("api-down-state")).toBeVisible();
    await expect(page.getByTestId("api-down-state")).toContainText(
        "Can't reach Munch",
    );
    await expect(
        page
            .getByTestId("api-down-state")
            .getByRole("button", { name: "Try again" }),
    ).toBeVisible();

    // When the API returns, navigating loads real content again and
    // the can't-reach state is gone (the session was never signed out).
    await page.unroute("**/api/app/**");
    await page.locator('a[data-route="today"]:visible').first().click();
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();
    await expect(page.getByTestId("api-down-state")).toHaveCount(0);
});

test("a write attempted offline gets the honest message, never a queue or a success", async ({
    page,
    context,
}) => {
    await stubPackagedSession(page);
    await page.goto(`${baseURL}/`);
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();

    await context.setOffline(true);
    await expect(page.getByTestId("offline-banner")).toBeVisible();
    await page.getByRole("button", { name: "Add water" }).click();
    await page.locator('#water-form button[type="submit"]').click();
    // Decision 6: no offline write queueing. The attempt surfaces the
    // honest message; no success is reported and nothing claims to be
    // saved or queued for later.
    const toastRegion = page.locator("#toast-region");
    await expect(toastRegion).toContainText("You're offline");
    await expect(toastRegion).toContainText("Nothing was queued");
    await expect(toastRegion).not.toContainText("Water added.");
    await context.setOffline(false);
});

test("packaged bundle ships the mobile runtime and the Pantry page", async ({
    request,
}) => {
    const runtime = await request.get(`${baseURL}/mobile-runtime.js`);
    expect(runtime.ok()).toBe(true);
    const runtimeBody = await runtime.text();
    expect(runtimeBody).toContain("https://munch.business");
    expect(runtimeBody).toContain("MunchSecureSession");

    const pantry = await request.get(`${baseURL}/pantry.html`);
    expect(pantry.ok()).toBe(true);
    const pantryBody = await pantry.text();
    expect(pantryBody).toContain("/pantry-native.js");

    // S4: the native meal-photo capture module ships in the bundle and
    // carries the Pantry-pattern markers (pending-capture restore key,
    // 8 MB cap, DataTransfer handoff into the existing dialog input).
    const mealPhotoNative = await request.get(
        `${baseURL}/meal-photo-native.js`,
    );
    expect(mealPhotoNative.ok()).toBe(true);
    const mealPhotoBody = await mealPhotoNative.text();
    expect(mealPhotoBody).toContain("munch.pendingMealPhotoCapture");
    expect(mealPhotoBody).toContain("#meal-photo-file");
    expect(mealPhotoBody).toContain("new DataTransfer()");
});
