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
    // App-shell fix batch: the standalone Pantry page carries the
    // shell's bottom nav (it stranded users without one), with its
    // links rewritten to packaged routes.
    expect(pantryBody).toContain("mobile-bottom-nav");
    expect(pantryBody).toContain('href="/index.html?route=%2Fapp%2Fgroceries"');

    // The retired header band (kicker/title, Refresh, "Use with your
    // AI") stays out of the packaged shell.
    const shell = await request.get(`${baseURL}/index.html`);
    expect(shell.ok()).toBe(true);
    const shellBody = await shell.text();
    expect(shellBody).not.toContain("app-topbar");
    expect(shellBody).not.toContain("quick-action");
    expect(shellBody).not.toContain("refresh-button");

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

// ---------------------------------------------------------------------------
// UX fix wave (F1/F4) — the packaged-bundle regression gate for the
// meal-editor transport defect class.
//
// On device the app origin is https://localhost and the API lives on
// a different origin entirely; the web e2e can never see that split
// (page origin == API origin), which is exactly why F1 shipped:
// app-patches.js's patchApi() used a raw RELATIVE fetch and every
// editor request 404'd against the local asset server. These tests
// reproduce the split inside the bundle harness: the bundle is
// served from one loopback origin while a stub mobile runtime points
// the shared transport at a SECOND loopback origin (the API server
// below, with an in-memory meal store). An explicit route 404s any
// same-origin /api/app/** request, so a regression to a relative
// fetch fails here the way it failed on the phone.
// ---------------------------------------------------------------------------

const FIXTURE_MEAL_ID = "b0000000-0000-4000-8000-000000000001";
const FIXTURE_COPY_ID = "b0000000-0000-4000-8000-000000000002";

let apiServer: Server;
let apiBaseUrl = "";
const apiRequests: { method: string; path: string }[] = [];
let mealStore = new Map<string, Record<string, unknown>>();

function fixtureListMeal(id: string, description: string) {
    return {
        id,
        description,
        meal_type: "lunch",
        logged_at: "2026-11-10T17:00:00.000Z",
        notes: null,
        calories: 700,
        protein_g: 40,
        carbs_g: 60,
        fat_g: 30,
        fiber_g: 5,
        sugar_g: 8,
        items: [
            {
                name: "Grilled chicken",
                portionLabel: "1 breast",
                quantity: 1,
                calories: 400,
                sourceType: "usda",
                confidence: "high",
                assumptions: [],
            },
            {
                name: "Rice bowl",
                portionLabel: "1 bowl",
                quantity: 1,
                calories: 300,
                sourceType: "usda",
                confidence: "high",
                assumptions: [],
            },
        ],
    };
}

function fixtureMealDetail(meal: Record<string, unknown>) {
    return {
        meal: {
            id: meal.id,
            description: meal.description,
            mealType: "lunch",
            loggedAt: "2026-11-10T17:00:00.000Z",
            notes: "",
            calories: 700,
            proteinG: 40,
            carbsG: 60,
            fatG: 30,
            items: [
                {
                    id: "b0000000-0000-4000-8000-000000000011",
                    name: "Grilled chicken",
                    portionLabel: "1 breast",
                    quantity: 1,
                    gramWeight: 180,
                    nutrients: {
                        calories: 400,
                        protein_g: 38,
                        carbs_g: 0,
                        fat_g: 9,
                    },
                    sourceType: "usda",
                    confidence: "high",
                    assumptions: [],
                    sourceSnapshot: null,
                },
                {
                    id: "b0000000-0000-4000-8000-000000000012",
                    name: "Rice bowl",
                    portionLabel: "1 bowl",
                    quantity: 1,
                    gramWeight: 250,
                    nutrients: {
                        calories: 300,
                        protein_g: 6,
                        carbs_g: 60,
                        fat_g: 3,
                    },
                    sourceType: "usda",
                    confidence: "high",
                    assumptions: [],
                    sourceSnapshot: null,
                },
            ],
        },
    };
}

function resetFixtureApi() {
    mealStore = new Map([
        [FIXTURE_MEAL_ID, fixtureListMeal(FIXTURE_MEAL_ID, "Bundle E2E Lunch")],
    ]);
    apiRequests.length = 0;
}

function sendApiJson(
    response: import("node:http").ServerResponse,
    status: number,
    payload: unknown,
) {
    response.writeHead(status, {
        "content-type": "application/json",
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
    });
    response.end(JSON.stringify(payload));
}

test.beforeAll(async () => {
    apiServer = createServer((request, response) => {
        if (request.method === "OPTIONS") {
            response.writeHead(204, {
                "access-control-allow-origin": "*",
                "access-control-allow-methods": "*",
                "access-control-allow-headers": "*",
            });
            response.end();
            return;
        }
        const url = new URL(request.url ?? "/", "http://localhost");
        const path = url.pathname;
        apiRequests.push({ method: request.method ?? "", path });
        const mealMatch = path.match(/^\/api\/app\/meals\/([^/]+)$/);
        const copyMatch = path.match(/^\/api\/app\/meals\/([^/]+)\/copy$/);
        const readBody = (done: (body: Record<string, unknown>) => void) => {
            const chunks: Buffer[] = [];
            request.on("data", (chunk: Buffer) => chunks.push(chunk));
            request.on("end", () => {
                try {
                    done(JSON.parse(Buffer.concat(chunks).toString("utf8")));
                } catch {
                    done({});
                }
            });
        };
        if (path === "/api/app/bootstrap") {
            sendApiJson(response, 200, {
                profile: { timezone: "UTC", preferred_weight_unit: "lb" },
            });
            return;
        }
        if (path === "/api/app/today") {
            const meals = [...mealStore.values()];
            sendApiJson(response, 200, {
                totals: {
                    calories: meals.reduce(
                        (sum, meal) => sum + Number(meal.calories ?? 0),
                        0,
                    ),
                    proteinG: 40 * meals.length,
                    carbsG: 60 * meals.length,
                    fatG: 30 * meals.length,
                },
                meals,
                water: { entries: [], totalMl: 0 },
                weight: [],
                goals: {},
                drafts: [],
                plannedMeals: [],
            });
            return;
        }
        if (path === "/api/app/guidance/today") {
            sendApiJson(response, 200, {
                source_status: "sparse_data",
                objective: "Track only",
                actions: [],
            });
            return;
        }
        if (path === "/api/app/food-search") {
            sendApiJson(response, 200, {
                candidates: [],
                savedFoods: [],
                recentMealItems: [],
            });
            return;
        }
        if (copyMatch && request.method === "POST") {
            const original = mealStore.get(copyMatch[1]);
            if (original) {
                mealStore.set(
                    FIXTURE_COPY_ID,
                    fixtureListMeal(
                        FIXTURE_COPY_ID,
                        String(original.description),
                    ),
                );
            }
            sendApiJson(response, 200, {});
            return;
        }
        if (mealMatch && request.method === "GET") {
            const meal = mealStore.get(mealMatch[1]);
            if (!meal) {
                sendApiJson(response, 404, { error: "Meal not found." });
                return;
            }
            sendApiJson(response, 200, fixtureMealDetail(meal));
            return;
        }
        if (mealMatch && request.method === "PATCH") {
            readBody((body) => {
                const meal = mealStore.get(mealMatch[1]);
                if (meal && typeof body.description === "string") {
                    meal.description = body.description;
                }
                sendApiJson(response, 200, meal ? fixtureMealDetail(meal) : {});
            });
            return;
        }
        if (mealMatch && request.method === "DELETE") {
            mealStore.delete(mealMatch[1]);
            sendApiJson(response, 200, {});
            return;
        }
        sendApiJson(response, 200, {});
    });
    await new Promise<void>((resolve) => apiServer.listen(0, () => resolve()));
    const address = apiServer.address();
    if (!address || typeof address === "string") {
        throw new Error("Fixture API server did not bind a port");
    }
    // The shared transport only allows plain HTTP for the hostname
    // "localhost" — the packaged split this suite reproduces.
    apiBaseUrl = `http://localhost:${address.port}`;
});

test.afterAll(async () => {
    await new Promise<void>((resolve) => apiServer.close(() => resolve()));
});

/** STUB_RUNTIME plus a mobile platform adapter aimed at the fixture API. */
async function stubMobileApiSession(page: import("@playwright/test").Page) {
    const body = `
import { setMunchPlatformAdapter } from "./app-api.js";
setMunchPlatformAdapter({
    kind: "mobile",
    apiBaseUrl: ${JSON.stringify(apiBaseUrl)},
    getAccessToken: async () => "bundle-e2e-token",
    onAuthenticationRequired: async () => {
        throw new Error("bundle e2e: unexpected sign-in redirect");
    },
});
${STUB_RUNTIME}`;
    await page.route(/\/mobile-runtime\.js$/, (route) =>
        route.fulfill({ contentType: "text/javascript", body }),
    );
    // The packaged app has no same-origin API: a raw relative fetch
    // (the pre-F1 patchApi shape) must fail here like it did on
    // device, never silently succeed against the static fixtures.
    await page.route(`${baseURL}/api/app/**`, (route) =>
        route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({
                error: "no same-origin API in the packaged app",
            }),
        }),
    );
}

test("UX wave F1: the meal editor opens and saves in the packaged bundle", async ({
    page,
}) => {
    resetFixtureApi();
    await stubMobileApiSession(page);
    await page.goto(`${baseURL}/`);
    const card = page.locator(
        `article.meal-card[data-meal-id="${FIXTURE_MEAL_ID}"]`,
    );
    await expect(card).toBeVisible();
    await expect(card.locator("h4")).toHaveText("Bundle E2E Lunch");

    await card.getByRole("button", { name: "Edit" }).click();
    const dialog = page.locator("#app-dialog");
    await expect(dialog).toBeVisible();
    const description = dialog.locator(
        '#edit-meal-form textarea[name="description"]',
    );
    await expect(description).toHaveValue("Bundle E2E Lunch");
    await description.fill("Bundle E2E Lunch — edited");
    await dialog.getByRole("button", { name: "Save meal details" }).click();

    await expect(page.locator("#toast-region")).toContainText("Meal updated.");
    expect(
        apiRequests.some(
            (entry) =>
                entry.method === "PATCH" &&
                entry.path === `/api/app/meals/${FIXTURE_MEAL_ID}`,
        ),
    ).toBe(true);
    await expect(card.locator("h4")).toHaveText("Bundle E2E Lunch — edited");
});

test("UX wave F1: Duplicate works in the packaged bundle", async ({ page }) => {
    resetFixtureApi();
    await stubMobileApiSession(page);
    await page.goto(`${baseURL}/`);
    const card = page.locator(
        `article.meal-card[data-meal-id="${FIXTURE_MEAL_ID}"]`,
    );
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: "Duplicate" }).click();

    await expect(page.locator("#toast-region")).toContainText(
        "Meal duplicated with its original food sources.",
    );
    expect(
        apiRequests.some(
            (entry) =>
                entry.method === "POST" &&
                entry.path === `/api/app/meals/${FIXTURE_MEAL_ID}/copy`,
        ),
    ).toBe(true);
    await expect(page.locator("article.meal-card")).toHaveCount(2);
});

test("UX wave F4: delete-meal completes through the inline confirm in the packaged bundle", async ({
    page,
}) => {
    resetFixtureApi();
    await stubMobileApiSession(page);
    const nativeDialogs: string[] = [];
    page.on("dialog", (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
    });
    await page.goto(`${baseURL}/`);
    const card = page.locator(
        `article.meal-card[data-meal-id="${FIXTURE_MEAL_ID}"]`,
    );
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: "Delete" }).click();
    const confirmBox = page.locator(".plan-inline-confirm");
    await expect(confirmBox).toBeVisible();
    await expect(confirmBox).toContainText(
        "Permanently delete Bundle E2E Lunch?",
    );
    await confirmBox.getByRole("button", { name: "Yes, delete meal" }).click();

    await expect(page.locator("article.meal-card")).toHaveCount(0);
    expect(
        apiRequests.some(
            (entry) =>
                entry.method === "DELETE" &&
                entry.path === `/api/app/meals/${FIXTURE_MEAL_ID}`,
        ),
    ).toBe(true);
    expect(nativeDialogs).toEqual([]);
});
