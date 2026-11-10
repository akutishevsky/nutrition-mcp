import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, normalize } from "node:path";
import { expect, test } from "@playwright/test";
import { CAPABILITY_MANIFEST } from "../src/capability-manifest.ts";

/**
 * S5 (Full Parity App Program) — packaged-app parity verification.
 *
 * Where mobile-bundle.e2e.ts proves the shell boots and behaves offline,
 * this spec exercises the capability manifest's app channel against the
 * PACKAGED `.mobile-web` bundle (the exact artifact that ships inside
 * the Android APK), row family by row family:
 *
 * - a bundle-content sweep asserting every app-complete / app-partial
 *   row's declared entry points are physically present in the bundle;
 * - a route sweep rendering every Operate surface in the bundle;
 * - deep exercises for the rows S5 was dispatched to settle:
 *   meal.photoLog (partial since S3 — full photo → draft → add-text →
 *   confirm flow through the native capture wiring), the three
 *   missing-with-exception rows that were believed to live inside the
 *   packaged SPA (mcp.connection.revoke, household.manage,
 *   account.export), and the two legitimate website-only billing rows
 *   (billing.checkout / billing.portal — the packaged surface must
 *   route honestly, never run Stripe checkout in the app).
 *
 * Like the S4 stub in mobile-bundle.e2e.ts, the native-bridge surface
 * is faked (Keystore session, camera, Play Billing, ads) while the
 * transport, app.js, app-account.js and the native-enhancement modules
 * are the REAL packaged files. Two fidelity extensions over the S4
 * stub, both mirroring the real runtime (mobile/runtime.js): the stub
 * defines `window.MunchAds` (runtime.js:33 — its presence is what makes
 * the billing/household pages render their Android variants), and the
 * stub camera returns a real (1×1 PNG) photo so meal-photo-native.js's
 * DataTransfer handoff into the S3 dialog is exercised for real.
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

/** Every API request the packaged app made, in order. */
const observed: { method: string; path: string }[] = [];

type SettingsVariant = "android-free" | "android-free-stripe";
type HouseholdVariant = "none" | "owner";
let settingsVariant: SettingsVariant = "android-free";
let householdVariant: HouseholdVariant = "none";
let connectionsFixture: Record<string, unknown>[] = [];

const PRODUCT_POLICY = {
    premiumPriceMonthlyCents: 300,
    householdMemberPriceMonthlyCents: 200,
    householdMemberLimit: 6,
};

const PROFILE = { timezone: "UTC", preferred_weight_unit: "lb" };

function bootstrapFixture() {
    return {
        profile: PROFILE,
        productPolicy: PRODUCT_POLICY,
        capabilities: {
            entitlementSource: "android_free_baseline",
            tier: "free",
            recipeWrite: true,
            householdRecipeWrite: false,
        },
        household: null,
        user: { email: "parity-fixture@example.test" },
    };
}

function settingsFixture() {
    return {
        ...bootstrapFixture(),
        goals: {},
        subscription:
            settingsVariant === "android-free-stripe"
                ? { provider: "stripe", status: "active" }
                : null,
        androidEntitlements: { adFree: false },
        connections: connectionsFixture,
    };
}

function householdFixture() {
    if (householdVariant === "none") {
        return {
            household: null,
            entitlementSource: "android_free_baseline",
            tier: "free",
            canCreateHousehold: true,
        };
    }
    return {
        household: {
            role: "owner",
            householdName: "Fixture Household",
            displayName: "Fixture Owner",
        },
        entitlementSource: "android_free_baseline",
        tier: "free",
        canCreateHousehold: false,
        canInvite: true,
        canWrite: true,
        activeNonOwnerCount: 0,
        seatCoverage: true,
        pendingInvitations: [],
        members: [
            {
                membershipId: "fixture-membership-owner",
                displayName: "Fixture Owner",
                role: "owner",
                joinedAt: "2026-11-01T00:00:00.000Z",
            },
            {
                membershipId: "fixture-membership-member",
                displayName: "Fixture Member",
                role: "member",
                joinedAt: "2026-11-02T00:00:00.000Z",
            },
        ],
    };
}

const PHOTO_DRAFT = {
    id: "fixture-photo-draft",
    status: "awaiting_confirmation",
    description: "Fixture photo meal",
    version: 1,
    meal_type: "lunch",
    logged_at: "2026-11-09T12:00:00.000Z",
    notes: "",
    source_mode: "photo",
    expires_at: null,
    totals: { calories: 480, protein_g: 30, carbs_g: 50, fat_g: 18 },
    questions: [],
    items: [
        {
            name: "Fixture rice bowl",
            source_type: "usda",
            confidence: 0.9,
            portion_label: "1 bowl",
            quantity: 1,
            gram_weight: 300,
            nutrients: { calories: 480, protein_g: 30, carbs_g: 50, fat_g: 18 },
            provider: "USDA",
            assumptions: [],
        },
    ],
};

function fixtureJson(pathname: string, method: string): unknown | undefined {
    if (pathname === "/api/app/bootstrap") return bootstrapFixture();
    if (pathname === "/api/app/today") {
        return {
            totals: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
            meals: [],
            water: { entries: [], totalMl: 0 },
            weight: [],
            goals: {},
            drafts: [],
            plannedMeals: [],
        };
    }
    if (pathname === "/api/app/guidance/today") {
        return {
            source_status: "sparse_data",
            objective: "Track only",
            actions: [],
        };
    }
    if (pathname === "/api/app/settings") return settingsFixture();
    if (pathname === "/api/app/household/manage") return householdFixture();
    if (pathname === "/api/app/meals") return { meals: [], totals: {} };
    if (pathname === "/api/app/foods") {
        return { foods: [], savedFoods: [], total: 0 };
    }
    if (pathname === "/api/app/recipes") return { recipes: [] };
    if (pathname === "/api/app/planning") {
        return { plannedMeals: [], recipes: [] };
    }
    if (pathname === "/api/app/guidance/goals/review") {
        return {
            status: "no_revision",
            objective: "Track only",
            rationale: "Fixture review.",
            evidence: {
                logged_nutrition_days: 0,
                weight_measurements: 0,
                weight_measurement_span_days: 0,
            },
        };
    }
    if (pathname === "/api/app/guidance/goals/history") return [];
    if (pathname === "/api/app/groceries") {
        return { groceries: [], permissions: {} };
    }
    if (pathname === "/api/app/cooks") return { cooks: [] };
    if (pathname === "/api/app/insights") {
        return {
            vitals: { water: { entries: [] }, weight: { entries: [] } },
            trends: { days: [], narrative: "" },
            patterns: { narrative: "" },
            progress: { goals: {}, totals: {} },
            provenance: { coverage: {}, confidence: {}, sources: [] },
            averages: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
            loggedDays: 0,
            mealCount: 0,
        };
    }
    if (pathname === "/api/app/insights/checkin") {
        return {
            coverage_percent: 0,
            calendar_days: 7,
            nutrition_target_coverage_days: 0,
            averages_on_recorded_days: {
                calories: { value: null },
                protein_g: { average: null },
            },
            uncertain_nutrition_meals: 0,
            observations: [],
        };
    }
    if (pathname === "/api/app/food-search") {
        return { candidates: [], savedFoods: [], recentMealItems: [] };
    }
    if (pathname === "/api/app/meal-drafts/fixture-photo-draft") {
        return { draft: PHOTO_DRAFT };
    }
    if (pathname === "/api/app/export" && method === "POST") {
        return {
            recordCount: 42,
            url: `${baseURL}/exports/download?token=fixture-account`,
        };
    }
    if (pathname === "/api/app/export/meals" && method === "POST") {
        return {
            count: 3,
            url: `${baseURL}/exports/download?token=fixture-meals`,
        };
    }
    if (pathname === "/billing/portal" && method === "POST") {
        return { url: `${baseURL}/website-portal-fixture` };
    }
    if (pathname === "/api/app/meal-photo" && method === "POST") {
        return { draft: { id: "fixture-photo-draft" } };
    }
    if (
        pathname === "/api/app/meal-drafts/fixture-photo-draft/add-text" &&
        method === "POST"
    ) {
        return {
            draft: {
                ...PHOTO_DRAFT,
                version: 2,
                items: [
                    ...PHOTO_DRAFT.items,
                    {
                        name: "Butter",
                        source_type: "usda",
                        confidence: 0.8,
                        portion_label: "1 tbsp",
                        quantity: 1,
                        gram_weight: 14,
                        nutrients: {
                            calories: 100,
                            protein_g: 0,
                            carbs_g: 0,
                            fat_g: 12,
                        },
                        provider: "USDA",
                        assumptions: ["A good bit, taken as 1 tbsp"],
                    },
                ],
                totals: {
                    calories: 580,
                    protein_g: 30,
                    carbs_g: 50,
                    fat_g: 30,
                },
            },
            add: { status: "added", message: "Added butter to the draft." },
        };
    }
    if (
        pathname === "/api/app/meal-drafts/fixture-photo-draft/confirm" &&
        method === "POST"
    ) {
        return { meal: { id: "fixture-meal" } };
    }
    return undefined;
}

test.beforeAll(async () => {
    if (!existsSync(join(bundleDir, "index.html"))) {
        throw new Error(
            ".mobile-web bundle is missing — run `bun run mobile:web` before this spec",
        );
    }
    server = createServer((request, response) => {
        const url = new URL(request.url ?? "/", "http://127.0.0.1");
        const method = request.method ?? "GET";
        if (
            url.pathname.startsWith("/api/") ||
            url.pathname === "/billing/portal"
        ) {
            observed.push({ method, path: url.pathname });
            if (
                method === "DELETE" &&
                url.pathname.startsWith("/api/app/connections/")
            ) {
                connectionsFixture = [];
                response.writeHead(200, { "content-type": "application/json" });
                response.end("{}");
                return;
            }
            const fixture = fixtureJson(url.pathname, method);
            response.writeHead(200, {
                "content-type": "application/json",
                "cache-control": "no-store",
            });
            response.end(JSON.stringify(fixture ?? {}));
            return;
        }
        if (url.pathname === "/exports/download") {
            observed.push({ method, path: url.pathname });
            response.writeHead(200, {
                "content-type": "text/csv; charset=utf-8",
                "content-disposition":
                    'attachment; filename="fixture-export.csv"',
            });
            response.end("fixture,export\n1,2\n");
            return;
        }
        if (url.pathname === "/website-portal-fixture") {
            response.writeHead(200, { "content-type": "text/html" });
            response.end(
                "<!doctype html><title>Website billing</title><h1>Website subscription management (fixture)</h1>",
            );
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
        response.end(readFileSync(filePath));
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

/**
 * Test-only stand-in for the packaged mobile runtime — the S4 stub plus
 * S5 fidelity extensions (see the file header). The 1×1 PNG data URL is
 * what the stub camera "captures": meal-photo-native.js fetches it,
 * builds a real File, and hands it to the dialog's file input.
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
window.MunchAds = Object.freeze({
    setBannerVisible: async () => ({}),
    showPrivacyOptions: async () => ({ available: false }),
});
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
    return window.__fixturePlayBilling ?? { configured: false };
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
    window.__openedSubscriptionManagement = true;
    return null;
}
const FIXTURE_PHOTO =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
export async function takeInstalledPhoto() {
    return { webPath: FIXTURE_PHOTO, metadata: { format: "png" } };
}
export async function chooseInstalledPhoto() {
    return { webPath: FIXTURE_PHOTO, metadata: { format: "png" } };
}
`;

async function bootPackagedApp(page: import("@playwright/test").Page) {
    await page.route(/\/mobile-runtime\.js$/, (route) =>
        route.fulfill({ contentType: "text/javascript", body: STUB_RUNTIME }),
    );
    page.on("dialog", (dialog) => void dialog.accept());
    await page.goto(`${baseURL}/`);
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();
}

async function gotoRoute(page: import("@playwright/test").Page, href: string) {
    const link = page.locator(`a[href="${href}"]:visible`).first();
    if ((await link.count()) > 0) {
        await link.click();
        return;
    }
    await page.evaluate((target) => {
        history.pushState({}, "", target);
        window.dispatchEvent(new PopStateEvent("popstate"));
    }, href);
}

function observedRequest(method: string, path: string): boolean {
    return observed.some(
        (entry) => entry.method === method && entry.path === path,
    );
}

test.beforeEach(() => {
    observed.length = 0;
    settingsVariant = "android-free";
    householdVariant = "none";
    connectionsFixture = [
        {
            clientName: "Fixture MCP Client",
            clientId: "fixture-client",
            tokenFamilyId: "fixture-family-1",
            activeAccessTokens: 1,
            expiresAt: "2027-01-01T00:00:00.000Z",
        },
    ];
});

test("every app-channel entry point ships inside the packaged bundle", async () => {
    const bundleFiles = [
        "app.js",
        "app-account.js",
        "app-patches.js",
        "app-integrity.js",
        "pantry.js",
        "mobile-runtime.js",
        "mobile-entry.js",
        "billing-native.js",
        "meal-photo-native.js",
        "pantry-native.js",
        "index.html",
        "pantry.html",
    ];
    const bundleText = bundleFiles
        .map((file) => readFileSync(join(bundleDir, file), "utf8"))
        .join("\n");

    const problems: string[] = [];
    for (const capability of CAPABILITY_MANIFEST) {
        if (capability.app.coverage === "missing") continue;
        for (const entryPoint of capability.app.entryPoints) {
            // Entry points carry a method prefix (sometimes combined,
            // "GET/PUT …") and occasionally a trailing "(annotation)".
            const withoutMethod = entryPoint
                .replace(/\s*\([^)]*\)\s*$/, "")
                .replace(/^[A-Z]+(?:\/[A-Z]+)* /, "");
            if (withoutMethod.startsWith("[")) {
                // Selector entry point, e.g. [data-action="log-by-photo"],
                // [data-action=compose-recipe] (unquoted in the manifest)
                // or a bare attribute selector like [data-patch-food].
                const inner = withoutMethod.slice(1, -1);
                const value = inner.match(/=([^"'\]]+)$/)?.[1];
                if (!bundleText.includes(value ?? inner)) {
                    problems.push(`${capability.id}: ${entryPoint}`);
                }
                continue;
            }
            if (withoutMethod.startsWith("#")) {
                // DOM id entry point, e.g. #meal-history-search.
                if (!bundleText.includes(withoutMethod.slice(1))) {
                    problems.push(`${capability.id}: ${entryPoint}`);
                }
                continue;
            }
            // Path entry point: template-built URLs split on :params, so
            // assert each static segment around the params.
            const segments = withoutMethod
                .split(/:[A-Za-z]+/)
                .map((segment) => segment.replace(/\?.*$/, ""))
                .filter((segment) => segment.length >= 4);
            for (const segment of segments) {
                // A trailing segment may be built from a variable rather
                // than a literal (cook lifecycle posts to
                // `/api/app/cooks/${id}/${verb}` with verb "finish" /
                // "reopen"), so a quoted occurrence of the bare segment
                // word also proves the path is constructed in the bundle.
                const bareWord = segment.replace(/^\//, "");
                if (
                    !bundleText.includes(segment) &&
                    !bundleText.includes(`"${bareWord}"`)
                ) {
                    problems.push(
                        `${capability.id}: ${entryPoint} (segment ${segment})`,
                    );
                }
            }
        }
    }
    expect(problems).toEqual([]);
});

test("packaged route sweep renders every Operate surface", async ({ page }) => {
    await bootPackagedApp(page);

    const surfaces: { href: string; landmark: RegExp }[] = [
        { href: "/app/log", landmark: /Food log|Meals/i },
        { href: "/app/insights", landmark: /Last 30 days|Weekly check-in/i },
        { href: "/app/foods", landmark: /Saved foods|Foods/i },
        { href: "/app/recipes", landmark: /Recipes/i },
        { href: "/app/cooks", landmark: /Cooks/i },
        { href: "/app/plan", landmark: /Week of/i },
        { href: "/app/groceries", landmark: /Groceries/i },
        { href: "/app/more", landmark: /More|Settings/i },
        { href: "/app/settings", landmark: /Settings/i },
        { href: "/app/settings/profile", landmark: /Profile/i },
        { href: "/app/settings/goals", landmark: /Nutrition targets|Goals/i },
        { href: "/app/settings/account", landmark: /Account/i },
    ];
    for (const surface of surfaces) {
        await gotoRoute(page, surface.href);
        await expect(page.locator("#app-content")).toContainText(
            surface.landmark,
        );
        await expect(page.getByTestId("api-down-state")).toHaveCount(0);
        await expect(page.locator(".error-state")).toHaveCount(0);
    }

    // Pantry is the second packaged page (its own shell + script).
    await page.goto(`${baseURL}/pantry.html`);
    await expect(page).toHaveTitle(/Pantry/);
});

test("household.manage lives inside the packaged app", async ({ page }) => {
    householdVariant = "none";
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/household");
    // No-household state: the Android variant of the create form renders
    // in the packaged SPA (household sharing included, no charge copy).
    await expect(page.locator("#household-create-form")).toBeVisible();
    await expect(page.locator("#app-content")).toContainText(
        "Household sharing is included on Android",
    );
    expect(observedRequest("GET", "/api/app/household/manage")).toBe(true);

    householdVariant = "owner";
    await gotoRoute(page, "/app");
    await gotoRoute(page, "/app/household");
    await expect(page.locator("#app-content")).toContainText(
        "Fixture Household",
    );
    await expect(page.locator("#app-content")).toContainText("Fixture Member");
    await expect(page.locator("#household-invite-form")).toBeVisible();
});

test("mcp.connection.revoke works inside the packaged app", async ({
    page,
}) => {
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/settings/connections");
    await expect(page.locator("#app-content")).toContainText(
        "Fixture MCP Client",
    );
    await page.locator('[data-action="connection-revoke"]').click();
    await expect(page.locator("#app-content")).toContainText(
        "No active connections",
    );
    expect(
        observedRequest("DELETE", "/api/app/connections/fixture-family-1"),
    ).toBe(true);
    await expect(page.locator("#toast-region")).toContainText(
        "Connection revoked.",
    );
});

test("account.export and nutrition.export hand off from the packaged app", async ({
    page,
}) => {
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/settings/data");
    await expect(page.locator("#app-content")).toContainText(
        "Export complete account data",
    );

    const accountDownload = page
        .waitForEvent("download", {
            timeout: 10_000,
        })
        .catch(() => null);
    await page.locator('[data-action="export-account"]').click();
    await expect
        .poll(() => observedRequest("POST", "/api/app/export"))
        .toBe(true);
    // The app navigates to the short-lived download URL the API returned.
    // In Chromium that surfaces as a download; on Android, Capacitor's
    // Bridge.launchIntent opens any non-localhost navigation in the
    // system browser, which performs the same download there.
    await accountDownload;
    await expect
        .poll(() => observedRequest("GET", "/exports/download"))
        .toBe(true);

    const mealsDownload = page
        .waitForEvent("download", {
            timeout: 10_000,
        })
        .catch(() => null);
    await page.locator('[data-action="export-meals"]').click();
    await expect
        .poll(() => observedRequest("POST", "/api/app/export/meals"))
        .toBe(true);
    await mealsDownload;
});

test("billing rows route honestly from the packaged app", async ({ page }) => {
    // Android-free account: the packaged billing page offers NO Stripe
    // checkout and NO Stripe portal — there is nothing to misroute.
    // Premium on Android is a Play concern (billing-native), and the
    // website-only rows stay website-only.
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/settings/billing");
    await expect(page.locator("#app-content")).toContainText("Free on Android");
    await expect(page.locator('[data-action="billing-checkout"]')).toHaveCount(
        0,
    );
    await expect(page.locator('[data-action="billing-portal"]')).toHaveCount(0);

    // An account whose subscription lives on the website (Stripe): the
    // one billing action offered is honestly labelled as website
    // management, and using it posts to the website portal route and
    // navigates OUT to the URL it returns — no in-app Stripe surface.
    settingsVariant = "android-free-stripe";
    await gotoRoute(page, "/app");
    await gotoRoute(page, "/app/settings/billing");
    const portalButton = page.locator('[data-action="billing-portal"]');
    await expect(portalButton).toBeVisible();
    await expect(portalButton).toContainText(
        "Manage website and connected-client subscription",
    );
    await expect(page.locator('[data-action="billing-checkout"]')).toHaveCount(
        0,
    );
    await portalButton.click();
    await expect(page).toHaveURL(/\/website-portal-fixture/);
    expect(observedRequest("POST", "/billing/portal")).toBe(true);
});

test("meal.photoLog runs end to end in the packaged bundle", async ({
    page,
}) => {
    await bootPackagedApp(page);
    await page.locator('[data-action="log-by-photo"]:visible').first().click();

    // The S3 dialog renders in the bundle, and meal-photo-native.js has
    // enhanced it with the native capture actions (the packaged-only
    // wiring S4 added and S5 exists to exercise).
    await expect(page.locator("#meal-photo-file")).toBeAttached();
    const takePhoto = page.getByRole("button", { name: "Take photo" });
    await expect(takePhoto).toBeVisible();

    // Native capture: the stub camera returns a photo; the real native
    // module fetches it, builds a File and hands it to the dialog input.
    await takePhoto.click();
    await expect(page.locator("#meal-photo-status")).toContainText(
        "Photo added",
    );

    // Estimate: the packaged app posts the photo and lands in the draft
    // review — the full S3 pipeline surface, inside the bundle.
    await page.locator("#meal-photo-submit").click();
    await expect(page.locator("#meal-draft-review")).toContainText(
        "Fixture rice bowl",
    );
    expect(observedRequest("POST", "/api/app/meal-photo")).toBe(true);

    // Conversational add-to-draft (Amendment E) inside the same review.
    await expect(page.locator("#meal-draft-add-text-input")).toBeVisible();
    await page
        .locator("#meal-draft-add-text-input")
        .fill("I added a good bit of butter");
    await page.locator('[data-action="add-draft-text"]').click();
    await expect(page.locator("#meal-draft-review")).toContainText("Butter");
    expect(
        observedRequest(
            "POST",
            "/api/app/meal-drafts/fixture-photo-draft/add-text",
        ),
    ).toBe(true);

    // Confirm-before-save: nothing logged until this click.
    await page.locator('[data-action="confirm-meal-draft"]').click();
    await expect(page.locator("#toast-region")).toContainText(
        "Meal confirmed and logged.",
    );
    expect(
        observedRequest(
            "POST",
            "/api/app/meal-drafts/fixture-photo-draft/confirm",
        ),
    ).toBe(true);
});
