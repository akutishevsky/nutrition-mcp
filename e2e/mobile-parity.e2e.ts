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
/** S6 slice 1: a pending draft card on Today, removed by a cancel. */
let pendingDraftOnToday = false;
/** S6 slice 1: the ADS-FOUNDATION remote flag as the server sends it. */
let adsFlagOn = false;
/** S6 slice 4: the fixture salmon recipe, removed by an archive. */
let recipeArchived = false;
/** S6 slice 5: the fixture active cook, finished / deleted in tests. */
let cookFinished = false;
let cookDeleted = false;

const COOK_FIXTURES = [
    {
        id: "fixture-chicken-rice",
        title: "Weeknight Chicken & Rice",
        cook_date: "2026-11-09",
        status: "active",
        source_cook_id: null,
        notes: "",
        latest_photo_url: null,
        photo_count: 0,
    },
    {
        id: "fixture-salmon-cook",
        title: "Sheet-Pan Salmon & Broccoli",
        cook_date: "2026-11-08",
        status: "finished",
        source_cook_id: null,
        notes: "",
        latest_photo_url: null,
        photo_count: 2,
    },
    {
        id: "fixture-wings",
        title: "Smoked Lemon Pepper Wings",
        cook_date: "2026-11-07",
        status: "finished",
        source_cook_id: null,
        notes: "",
        latest_photo_url: null,
        photo_count: 3,
    },
    {
        id: "fixture-chili",
        title: "Turkey Chili",
        cook_date: "2026-11-04",
        status: "finished",
        source_cook_id: "fixture-earlier-chili",
        notes: "",
        latest_photo_url: null,
        photo_count: 1,
    },
];

function cookDetailFixture() {
    return {
        cook: {
            id: "fixture-chicken-rice",
            title: "Weeknight Chicken & Rice",
            status: cookFinished ? "finished" : "active",
            cook_date: "2026-11-09",
            timezone: "UTC",
            version: 1,
            notes: "",
            original_message:
                "I'm starting this chicken and rice. I heated the skillet a couple minutes ago.",
            source_cook_id: null,
        },
        dishes: [
            {
                id: "fixture-dish-1",
                name: "Chicken & Rice",
                method: "Stovetop",
                flavor: "Garlic & herb",
                equipment: "Skillet",
                ingredient_or_cut: "Chicken thighs",
                recipe_id: null,
                recipe_revision_id: null,
            },
        ],
        media: [],
        events: [
            {
                id: "fixture-event-1",
                event_type: "food_on",
                event_at: "2026-11-09T17:48:00.000Z",
                submitted_at: "2026-11-09T17:50:00.000Z",
                time_precision: "approximate",
                note: "Chicken went into the hot skillet.",
                original_message:
                    "I'm starting this chicken and rice. I heated the skillet a couple minutes ago.",
                relative_phrase: "a couple minutes ago",
                setpoint_temperature: null,
                setpoint_unit: null,
                ambient_temperature: null,
                ambient_unit: null,
                internal_temperature: null,
                internal_unit: null,
            },
        ],
        outcomes: [],
        updates: [
            {
                submitted_at: "2026-11-09T17:50:00.000Z",
                source: "web",
                raw_message:
                    "I'm starting this chicken and rice. I heated the skillet a couple minutes ago.",
                media_status: "saved",
            },
        ],
    };
}

const RECIPE_FIXTURES = [
    {
        recipe_id: "fixture-lemon-chicken",
        revision_id: "fixture-lemon-chicken-r1",
        name: "Lemon Herb Chicken & Rice",
        version: 1,
        ownership: "personal",
        servings: 4,
        nutrition_status: "complete",
        nutrition_per_serving: {
            calories: 512,
            protein_g: 44,
            carbs_g: 48,
            fat_g: 15,
        },
        times_scheduled: 6,
        times_logged: 9,
    },
    {
        recipe_id: "fixture-overnight-oats",
        revision_id: "fixture-overnight-oats-r1",
        name: "Overnight Oats",
        version: 1,
        ownership: "personal",
        servings: 2,
        nutrition_status: "complete",
        nutrition_per_serving: {
            calories: 385,
            protein_g: 14,
            carbs_g: 52,
            fat_g: 13,
        },
        times_scheduled: 3,
        times_logged: 11,
    },
    {
        recipe_id: "fixture-turkey-chili",
        revision_id: "fixture-turkey-chili-r1",
        name: "Turkey Chili",
        version: 1,
        ownership: "household",
        servings: 6,
        nutrition_status: "complete",
        nutrition_per_serving: {
            calories: 428,
            protein_g: 32,
            carbs_g: 38,
            fat_g: 16,
        },
        times_scheduled: 2,
        times_logged: 4,
    },
    {
        recipe_id: "fixture-salmon",
        revision_id: "fixture-salmon-r3",
        name: "Sheet-Pan Salmon & Broccoli",
        version: 3,
        ownership: "personal",
        servings: 4,
        nutrition_status: "complete",
        nutrition_per_serving: {
            calories: 412,
            protein_g: 36,
            carbs_g: 9,
            fat_g: 25,
        },
        times_scheduled: 4,
        times_logged: 5,
    },
];

const RECIPE_DETAIL_FIXTURE = {
    recipe: {
        id: "fixture-salmon",
        revision_id: "fixture-salmon-r3",
        revision_number: 3,
        version: 3,
        name: "Sheet-Pan Salmon & Broccoli",
        servings: 4,
        nutrition_status: "complete",
        nutrition_per_serving: {
            calories: 412,
            protein_g: 36,
            carbs_g: 9,
            fat_g: 25,
        },
        ingredients: [
            {
                name: "Atlantic salmon fillets",
                quantity: 680,
                unit: "g",
                nutrients: { calories: 1416 },
                source_type: "usda",
            },
            {
                name: "Broccoli florets",
                quantity: 600,
                unit: "g",
                nutrients: { calories: 204 },
                source_type: "usda",
            },
            {
                name: "Olive oil",
                quantity: 2,
                unit: "tbsp",
                nutrients: { calories: 239 },
                source_type: "usda",
            },
        ],
        instructions: [
            "Heat the oven to 425°F and line a sheet pan.",
            "Toss broccoli with olive oil, garlic, and lemon juice; spread on the pan.",
            "Place salmon on top; roast 14–16 minutes, until it flakes.",
        ],
    },
};

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
        // ADS-FOUNDATION: bootstrap carries the remote ads flag,
        // DEFAULT OFF (MUNCH_ADS_ENABLED unset on the server).
        ads: { enabled: false },
        user: { email: "parity-fixture@example.test" },
        androidEntitlements: { adFree: false },
        // ADS-FOUNDATION contract: bootstrap.ads.enabled is the
        // server-driven remote flag (DEFAULT OFF — absent unless the
        // server explicitly enables it).
        ...(adsFlagOn ? { ads: { enabled: true } } : {}),
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
            drafts: pendingDraftOnToday
                ? [
                      {
                          id: "fixture-pending-draft",
                          description: "Fixture pending meal",
                          status: "awaiting_confirmation",
                          openQuestionCount: 0,
                          itemCount: 1,
                          sourceMode: "photo",
                      },
                  ]
                : [],
            plannedMeals: [],
        };
    }
    if (pathname === "/api/app/meal-drafts/fixture-pending-draft") {
        return {
            draft: { ...PHOTO_DRAFT, id: "fixture-pending-draft" },
        };
    }
    if (
        pathname === "/api/app/meal-drafts/fixture-pending-draft/cancel" &&
        method === "POST"
    ) {
        pendingDraftOnToday = false;
        return {
            draft: {
                ...PHOTO_DRAFT,
                id: "fixture-pending-draft",
                status: "cancelled",
                version: PHOTO_DRAFT.version + 1,
            },
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
    if (pathname === "/api/app/recipes/fixture-salmon") {
        return RECIPE_DETAIL_FIXTURE;
    }
    if (pathname === "/api/app/planning") {
        return {
            plannedMeals: [],
            recipes: recipeArchived
                ? RECIPE_FIXTURES.filter(
                      (recipe) => recipe.recipe_id !== "fixture-salmon",
                  )
                : RECIPE_FIXTURES,
        };
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
    if (pathname === "/api/app/cooks") {
        const cooks = COOK_FIXTURES.filter(
            (cook) => !(cookDeleted && cook.id === "fixture-chicken-rice"),
        ).map((cook) =>
            cookFinished && cook.id === "fixture-chicken-rice"
                ? { ...cook, status: "finished" }
                : cook,
        );
        return { cooks };
    }
    if (pathname === "/api/app/cooks/fixture-chicken-rice") {
        return cookDetailFixture();
    }
    if (
        pathname === "/api/app/cooks/fixture-chicken-rice/finish" &&
        method === "POST"
    ) {
        cookFinished = true;
        return {};
    }
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
                url.pathname.startsWith("/api/app/recipes/")
            ) {
                recipeArchived = true;
                response.writeHead(200, { "content-type": "application/json" });
                response.end("{}");
                return;
            }
            if (
                method === "DELETE" &&
                url.pathname.startsWith("/api/app/cooks/")
            ) {
                cookDeleted = true;
                response.writeHead(200, { "content-type": "application/json" });
                response.end("{}");
                return;
            }
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
    setBannerVisible: async (options) => {
        (window.__adCalls ??= []).push(options);
        return {};
    },
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
    pendingDraftOnToday = false;
    adsFlagOn = false;
    recipeArchived = false;
    cookFinished = false;
    cookDeleted = false;
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

test("S6 slice 1 regression: Abandon draft dismisses a pending draft with no native confirm", async ({
    page,
}) => {
    // The 2026-11-09 production defect: "Abandon draft" gated on the
    // native window.confirm() dialog. Any environment that dismisses
    // or never answers that dialog (automated browsers by default,
    // WebViews without a JS-dialog handler) turned the click into a
    // silent no-op — no request, no feedback, draft still pending —
    // while the in-page Close worked. This test records AND dismisses
    // every native dialog: the abandon flow must complete entirely
    // through in-dialog UI, so on the old code it fails twice over
    // (a native confirm fires, and no inline confirmation exists).
    const nativeDialogs: string[] = [];
    page.on("dialog", (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
    });
    pendingDraftOnToday = true;
    await bootPackagedApp(page);

    await page.getByRole("button", { name: "Review draft" }).click();
    const abandon = page.locator('[data-action="cancel-meal-draft"]');
    await expect(abandon).toBeVisible();
    await abandon.click();

    // In-dialog confirmation appears; nothing has been sent yet.
    const confirmAbandon = page.locator(
        '[data-action="confirm-cancel-meal-draft"]',
    );
    await expect(confirmAbandon).toBeVisible();
    await expect(
        page.getByText("Abandon this meal draft? No meal will be logged."),
    ).toBeVisible();
    expect(
        observedRequest(
            "POST",
            "/api/app/meal-drafts/fixture-pending-draft/cancel",
        ),
    ).toBe(false);
    expect(nativeDialogs).toEqual([]);

    // "Keep draft" restores the review actions without any request.
    await page.locator('[data-action="dismiss-abandon-draft"]').click();
    await expect(abandon).toBeVisible();
    expect(
        observedRequest(
            "POST",
            "/api/app/meal-drafts/fixture-pending-draft/cancel",
        ),
    ).toBe(false);

    // Confirming abandons: cancel posts, the dialog closes, the toast
    // lands, and Today re-renders without the pending draft.
    await abandon.click();
    await confirmAbandon.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Meal draft abandoned.",
    );
    expect(
        observedRequest(
            "POST",
            "/api/app/meal-drafts/fixture-pending-draft/cancel",
        ),
    ).toBe(true);
    await expect(page.locator("#app-dialog")).not.toHaveAttribute("open");
    await expect(
        page.getByRole("button", { name: "Review draft" }),
    ).toHaveCount(0);
    expect(nativeDialogs).toEqual([]);
});

test("S6 slice 1: the single ad slot lives on Today, flag-gated and Premium-hidden", async ({
    page,
}) => {
    // Flag OFF (the shipped default): no slot element at all on Today,
    // and the native banner is never asked to show.
    await bootPackagedApp(page);
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    let adCalls = await page.evaluate(
        () => (window as unknown as { __adCalls?: unknown[] }).__adCalls ?? [],
    );
    expect(adCalls.length).toBeGreaterThan(0);
    expect(
        adCalls.every(
            (call) =>
                (call as { visible?: boolean }).visible === false &&
                (call as { adsEnabled?: boolean }).adsEnabled === false,
        ),
    ).toBe(true);

    // Flag ON for a free packaged account: exactly one slot, in-flow
    // directly under Today's guidance and above Meals; the native
    // banner is requested visible with the flag forwarded.
    adsFlagOn = true;
    await page.reload();
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();
    const slot = page.locator('[data-testid="today-ad-slot"]');
    await expect(slot).toHaveCount(1);
    await expect(slot).toBeVisible();
    const slotBox = await slot.boundingBox();
    const guidanceBox = await page
        .getByRole("heading", { name: "Today’s guidance" })
        .boundingBox();
    const mealsBox = await page
        .getByRole("heading", { name: "Meals" })
        .boundingBox();
    expect(slotBox).not.toBeNull();
    expect(guidanceBox).not.toBeNull();
    expect(mealsBox).not.toBeNull();
    expect(slotBox!.y).toBeGreaterThanOrEqual(guidanceBox!.y);
    expect(slotBox!.y + slotBox!.height).toBeLessThanOrEqual(mealsBox!.y);
    // Slim and stable: the reserve is the mock's 54px grammar.
    expect(slotBox!.height).toBeGreaterThanOrEqual(54);
    expect(slotBox!.height).toBeLessThan(64);
    adCalls = await page.evaluate(
        () => (window as unknown as { __adCalls?: unknown[] }).__adCalls ?? [],
    );
    expect(
        adCalls.some(
            (call) =>
                (call as { visible?: boolean }).visible === true &&
                (call as { adsEnabled?: boolean }).adsEnabled === true,
        ),
    ).toBe(true);

    // Nowhere else: the Food Log carries no slot and the banner hides.
    await gotoRoute(page, "/app/log");
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    adCalls = await page.evaluate(
        () => (window as unknown as { __adCalls?: unknown[] }).__adCalls ?? [],
    );
    const lastCall = adCalls[adCalls.length - 1] as { visible?: boolean };
    expect(lastCall.visible).toBe(false);
});

test("S6 slice 4: Recipes library rows carry View / Log / Add-to-plan and no ad slot", async ({
    page,
}) => {
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/recipes");

    // The fused library: one themed panel per recipe in the fixture,
    // each with the mock's three row actions.
    const panels = page.locator(".recipe-panel");
    await expect(panels).toHaveCount(4);
    await expect(panels.first()).toContainText("Lemon Herb Chicken & Rice");
    await expect(panels.first()).toContainText("512 kcal");
    const firstPanel = panels.first();
    await expect(
        firstPanel.locator('[data-action="view-recipe"]'),
    ).toBeVisible();
    await expect(
        firstPanel.locator('[data-action="log-recipe"]'),
    ).toBeVisible();
    await expect(
        firstPanel.locator('[data-action="plan-recipe"]'),
    ).toBeVisible();

    // No ad slot on Recipes — not with the flag off, and not with it on
    // either (the app's only slot is on Today; the Recipes placements
    // are retired). The native banner is never asked to show here.
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    adsFlagOn = true;
    await page.goto(`${baseURL}/`);
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();
    await gotoRoute(page, "/app/recipes");
    await expect(panels).toHaveCount(4);
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    const adCalls = await page.evaluate(
        () => (window as unknown as { __adCalls?: unknown[] }).__adCalls ?? [],
    );
    const lastCall = adCalls[adCalls.length - 1] as { visible?: boolean };
    expect(lastCall.visible).toBe(false);

    // Log-recipe and schedule-recipe open from the row itself.
    await firstPanel.locator('[data-action="log-recipe"]').click();
    await expect(page.locator("#app-dialog")).toContainText("Log saved recipe");
    await page.locator(".dialog-close").click();
    await firstPanel.locator('[data-action="plan-recipe"]').click();
    await expect(page.locator("#app-dialog")).toContainText(
        "Add recipe to meal plan",
    );
});

test("S6 slice 4 regression: Archive recipe uses inline confirmation with no native confirm", async ({
    page,
}) => {
    // Same defect family as slice 1's Abandon fix: archiving gated on
    // the native window.confirm() silently no-ops wherever that dialog
    // is dismissed or never answered. This test records AND dismisses
    // every native dialog: the archive flow must complete entirely
    // through in-dialog UI, so on the old code it fails twice over.
    const nativeDialogs: string[] = [];
    page.on("dialog", (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
    });
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/recipes");

    const salmonPanel = page.locator(
        '[data-recipe-name="sheet-pan salmon & broccoli"]',
    );
    await salmonPanel.locator('[data-action="view-recipe"]').click();
    await expect(page.locator("#app-dialog")).toContainText(
        "Atlantic salmon fillets",
    );

    const archive = page.locator('[data-action="archive-recipe"]');
    await archive.click();

    // Inline confirmation appears; nothing has been sent yet.
    const confirmArchive = page.locator(
        '[data-action="confirm-archive-recipe"]',
    );
    await expect(confirmArchive).toBeVisible();
    await expect(
        page.getByText(
            "Archive this recipe? Historical meal logs will be preserved.",
        ),
    ).toBeVisible();
    expect(observedRequest("DELETE", "/api/app/recipes/fixture-salmon")).toBe(
        false,
    );
    expect(nativeDialogs).toEqual([]);

    // "Keep recipe" restores the detail actions without any request.
    await page.locator('[data-action="dismiss-archive-recipe"]').click();
    await expect(archive).toBeVisible();
    expect(observedRequest("DELETE", "/api/app/recipes/fixture-salmon")).toBe(
        false,
    );

    // Confirming archives: the DELETE posts, the dialog closes, the
    // toast lands, and the library re-renders without the recipe.
    await archive.click();
    await confirmArchive.click();
    await expect(page.locator("#toast-region")).toContainText(
        "Recipe archived.",
    );
    expect(observedRequest("DELETE", "/api/app/recipes/fixture-salmon")).toBe(
        true,
    );
    await expect(page.locator("#app-dialog")).not.toHaveAttribute("open");
    await expect(page.locator(".recipe-panel")).toHaveCount(3);
    await expect(salmonPanel).toHaveCount(0);
    expect(nativeDialogs).toEqual([]);
});

test("S6 slice 5: Cooks list renders themed panels with row actions and no ad slot", async ({
    page,
}) => {
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/cooks");

    // The fused list: one themed panel per fixture cook (the tightened
    // mock's four cooks), the active cook leading, each panel carrying
    // Open + Finish/Reopen + the Compare toggle on its action row.
    const panels = page.locator(".cook-panel");
    await expect(panels).toHaveCount(4);
    const activePanel = page.locator(
        '.cook-panel[data-cook-id="fixture-chicken-rice"]',
    );
    await expect(activePanel).toContainText("Weeknight Chicken & Rice");
    await expect(activePanel).toContainText("Active");
    await expect(
        activePanel.locator('[data-action="open-cook"]'),
    ).toBeVisible();
    await expect(
        activePanel.locator('[data-action="finish-cook"]'),
    ).toBeVisible();
    await expect(activePanel.locator("[data-cook-select]")).toBeVisible();
    const chiliPanel = page.locator(
        '.cook-panel[data-cook-id="fixture-chili"]',
    );
    await expect(chiliPanel).toContainText("based on an earlier attempt");
    await expect(
        chiliPanel.locator('[data-action="reopen-cook"]'),
    ).toBeVisible();

    // No ad slot on Cooks — not with the flag off, and not with it on
    // either (the app's only slot is on Today). The native banner is
    // never asked to show here.
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    adsFlagOn = true;
    await page.goto(`${baseURL}/`);
    await expect(page.getByRole("button", { name: "Add water" })).toBeVisible();
    await gotoRoute(page, "/app/cooks");
    await expect(panels).toHaveCount(4);
    await expect(page.locator('[data-testid="today-ad-slot"]')).toHaveCount(0);
    const adCalls = await page.evaluate(
        () => (window as unknown as { __adCalls?: unknown[] }).__adCalls ?? [],
    );
    const lastCall = adCalls[adCalls.length - 1] as { visible?: boolean };
    expect(lastCall.visible).toBe(false);

    // The active cook opens into the themed detail: dishes, timeline,
    // and the NL update form all render inside the shared frame.
    await activePanel.locator('[data-action="open-cook"]').click();
    await expect(page.locator("#app-dialog")).toContainText("Chicken & Rice");
    await expect(page.locator("#app-dialog")).toContainText(
        "Chicken went into the hot skillet.",
    );
    await expect(page.locator("#cook-update-form")).toBeVisible();
});

test("S6 slice 5 regression: Finish and Delete cooks use inline confirmation with no native confirm", async ({
    page,
}) => {
    // Same defect family as slice 1's Abandon fix: the native
    // window.confirm() silently no-ops wherever that dialog is
    // dismissed or never answered. Delete gated on it; Finish now
    // follows the same inline pattern. This test records AND dismisses
    // every native dialog: both flows must complete entirely through
    // in-page UI, so on the old code they fail twice over.
    const nativeDialogs: string[] = [];
    page.on("dialog", (dialog) => {
        nativeDialogs.push(`${dialog.type()}: ${dialog.message()}`);
        void dialog.dismiss();
    });
    await bootPackagedApp(page);
    await gotoRoute(page, "/app/cooks");

    // Finish, from the list card: first click only asks, in place.
    const activePanel = page.locator(
        '.cook-panel[data-cook-id="fixture-chicken-rice"]',
    );
    const finish = activePanel.locator('[data-action="finish-cook"]');
    await finish.click();
    const confirmFinish = activePanel.locator(
        '[data-action="confirm-finish-cook"]',
    );
    await expect(confirmFinish).toBeVisible();
    await expect(
        page.getByText("Finish this cook? You can reopen it later."),
    ).toBeVisible();
    expect(
        observedRequest("POST", "/api/app/cooks/fixture-chicken-rice/finish"),
    ).toBe(false);
    expect(nativeDialogs).toEqual([]);

    // "Keep cooking" restores the card actions without any request.
    await activePanel.locator('[data-action="dismiss-cook-confirm"]').click();
    await expect(finish).toBeVisible();
    expect(
        observedRequest("POST", "/api/app/cooks/fixture-chicken-rice/finish"),
    ).toBe(false);

    // Confirming finishes: the POST lands, the toast shows, and the
    // card re-renders as a finished cook.
    await finish.click();
    await confirmFinish.click();
    await expect(page.locator("#toast-region")).toContainText("Cook finished.");
    expect(
        observedRequest("POST", "/api/app/cooks/fixture-chicken-rice/finish"),
    ).toBe(true);
    await expect(
        activePanel.locator('[data-action="reopen-cook"]'),
    ).toBeVisible();

    // Delete, from the cook detail: first click only asks, in place.
    await activePanel.locator('[data-action="open-cook"]').click();
    await expect(page.locator("#app-dialog")).toContainText("Timeline");
    const deleteButton = page.locator('[data-action="delete-cook"]');
    await deleteButton.click();
    const confirmDelete = page.locator('[data-action="confirm-delete-cook"]');
    await expect(confirmDelete).toBeVisible();
    await expect(
        page.getByText(
            "Delete this cook, its timeline, results, and saved photos? This cannot be undone.",
        ),
    ).toBeVisible();
    expect(
        observedRequest("DELETE", "/api/app/cooks/fixture-chicken-rice"),
    ).toBe(false);
    expect(nativeDialogs).toEqual([]);

    // "Keep cook" restores the detail actions without any request.
    await page.locator('[data-action="dismiss-cook-confirm"]').click();
    await expect(deleteButton).toBeVisible();
    expect(
        observedRequest("DELETE", "/api/app/cooks/fixture-chicken-rice"),
    ).toBe(false);

    // Confirming deletes: the DELETE lands, the dialog closes, the
    // toast shows, and the list re-renders without the cook.
    await deleteButton.click();
    await confirmDelete.click();
    await expect(page.locator("#toast-region")).toContainText("Cook deleted.");
    expect(
        observedRequest("DELETE", "/api/app/cooks/fixture-chicken-rice"),
    ).toBe(true);
    await expect(page.locator("#app-dialog")).not.toHaveAttribute("open");
    await expect(page.locator(".cook-panel")).toHaveCount(3);
    await expect(activePanel).toHaveCount(0);
    expect(nativeDialogs).toEqual([]);
});
