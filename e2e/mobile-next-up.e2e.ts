import { createReadStream, existsSync, statSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, normalize } from "node:path";
import { expect, test, type Page } from "@playwright/test";

/**
 * Next up in the packaged bundle (guidance rework D2/D3/D7): the
 * section renders from the same payload inside the `.mobile-web`
 * bundle that ships in the Android shell, its actions POST the
 * candidate id to the action endpoints (Log it asks for a draft —
 * the confirm-before-save review — and never posts a meal), and
 * the quiet state still carries Ask about today at its foot.
 * Same stub-runtime pattern as mobile-bundle.e2e.ts: the real
 * app.js and transport run; only the native bridge is faked.
 */

const bundleDir = join(process.cwd(), ".mobile-web");
const CAPTURE_DIR = join(
    process.cwd(),
    "test-results",
    "mobile-next-up-captures",
);
mkdirSync(CAPTURE_DIR, { recursive: true });

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

const CANDIDATE_ID = "recipe:11111111-1111-4111-8111-111111111111";

const POPULATED = {
    date: "2026-11-10",
    day_part: "midday",
    is_today: true,
    state: "suggestion",
    objective_set: true,
    goal_prompt: { show: false },
    quiet_line: null,
    primary: {
        candidate_id: CANDIDATE_ID,
        kind: "recipe",
        name: "Chicken rice bowl",
        slot: "lunch",
        slot_label: "Lunch",
        servings: 1,
        reason: "Uses the chicken breast — your oldest pantry item.",
        nutrition: { calories: 520, protein_g: 42, carbs_g: 48, fat_g: 16 },
        landing: { calories: 1420, protein_g: 97, carbs_g: 148, fat_g: 46 },
        landing_text: "Day lands at 1,420 kcal · 23 g of protein still to go.",
        uses_pantry: ["Chicken breast"],
        missing_ingredients: ["Broccoli"],
        source_label: "from your recipes",
        actions: { plan: true, log: true, groceries: true, ask: true },
        composition_source: "deterministic",
    },
    secondary: [],
};

const QUIET = {
    date: "2026-11-10",
    day_part: "midday",
    is_today: true,
    state: "quiet",
    objective_set: true,
    goal_prompt: { show: false },
    quiet_line:
        "You're set for today — dinner is planned and nothing in the pantry needs using up.",
    primary: null,
    secondary: [],
};

let nextUpPayload: unknown = POPULATED;
const actionPosts: { path: string; body: any }[] = [];

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
        if (url.pathname.startsWith("/api/app/")) {
            const json = (value: unknown) => {
                response.writeHead(200, {
                    "content-type": "application/json",
                    "cache-control": "no-store",
                });
                response.end(JSON.stringify(value));
            };
            if (request.method === "POST") {
                let raw = "";
                request.on("data", (chunk) => (raw += chunk));
                request.on("end", () => {
                    let body: any = null;
                    try {
                        body = JSON.parse(raw || "null");
                    } catch {
                        body = null;
                    }
                    actionPosts.push({ path: url.pathname, body });
                    if (url.pathname.endsWith("/next-up/log")) {
                        json({ draft_id: "draft-next-up-1" });
                    } else if (url.pathname.endsWith("/next-up/groceries")) {
                        json({ added: 1, merged: 0, names: ["Broccoli"] });
                    } else if (url.pathname.endsWith("/next-up/plan")) {
                        json({ planned_meal_id: "pm-1", slot: "lunch" });
                    } else {
                        json({});
                    }
                });
                return;
            }
            const fixtures: Record<string, unknown> = {
                "/api/app/bootstrap": {
                    profile: {
                        timezone: "UTC",
                        preferred_weight_unit: "lb",
                    },
                },
                "/api/app/today": {
                    totals: {
                        calories: 900,
                        proteinG: 55,
                        carbsG: 100,
                        fatG: 30,
                    },
                    meals: [
                        {
                            id: "m1",
                            description: "Oats and eggs",
                            meal_type: "breakfast",
                            logged_at: "2026-11-10T13:00:00.000Z",
                            calories: 900,
                            protein_g: 55,
                            carbs_g: 100,
                            fat_g: 30,
                            items: [],
                        },
                    ],
                    water: { entries: [], totalMl: 0 },
                    weight: [],
                    goals: {
                        daily_calories: 2000,
                        daily_protein_g: 120,
                        daily_carbs_g: 220,
                        daily_fat_g: 65,
                    },
                    drafts: [],
                    plannedMeals: [],
                },
                "/api/app/guidance/next-up": nextUpPayload,
            };
            json(fixtures[url.pathname] ?? {});
            return;
        }
        const relative = normalize(decodeURIComponent(url.pathname)).replace(
            /^(\\.\\.[/\\\\])+|^[/\\\\]+/,
            "",
        );
        // SPA routes (no file extension) serve the app shell.
        const filePath = join(
            bundleDir,
            relative === "" || !extname(relative) ? "index.html" : relative,
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
export async function chooseInstalledPhotos() {
    return [];
}
`;

async function openPackagedToday(page: Page) {
    await page.route(/\/mobile-runtime\.js$/, (route) =>
        route.fulfill({
            contentType: "text/javascript",
            body: STUB_RUNTIME,
        }),
    );
    await page.goto(`${baseURL}/app`);
    await expect(page.getByRole("heading", { name: "Next up" })).toBeVisible({
        timeout: 20_000,
    });
}

test.use({ viewport: { width: 390, height: 844 } });

test("packaged bundle: populated Next up card with wired actions", async ({
    page,
}) => {
    nextUpPayload = POPULATED;
    actionPosts.length = 0;
    await openPackagedToday(page);
    const card = page.getByTestId("next-up");
    await expect(card.getByText("Chicken rice bowl")).toBeVisible();
    await expect(card.getByText(/Day lands at/)).toBeVisible();
    await expect(
        card.getByRole("link", { name: /Ask about today/ }),
    ).toBeVisible();
    await page.screenshot({
        path: join(CAPTURE_DIR, "mobile-next-up-populated.png"),
    });

    // Height budget (D2): macros + this section must leave the
    // day's first meal starting on the first screen.
    const firstMeal = page.locator(".meal-card").first();
    await expect(firstMeal).toBeVisible();
    const mealBox = await firstMeal.boundingBox();
    expect(mealBox).not.toBeNull();
    expect(mealBox!.y).toBeLessThan(844);

    await card.getByRole("button", { name: "Plan it" }).click();
    await expect
        .poll(() =>
            actionPosts.some((post) => post.path.endsWith("/next-up/plan")),
        )
        .toBe(true);
    const planPost = actionPosts.find((post) =>
        post.path.endsWith("/next-up/plan"),
    );
    expect(planPost?.body?.candidate_id).toBe(CANDIDATE_ID);

    await card
        .getByRole("button", { name: "Add missing to groceries" })
        .click();
    await expect
        .poll(() =>
            actionPosts.some((post) =>
                post.path.endsWith("/next-up/groceries"),
            ),
        )
        .toBe(true);

    await card.getByRole("button", { name: "Log it" }).click();
    await expect
        .poll(() =>
            actionPosts.some((post) => post.path.endsWith("/next-up/log")),
        )
        .toBe(true);
    // Confirm-before-save: the review opens; no meal POST ever fires.
    await expect(
        page.getByRole("heading", { name: "Review meal draft" }),
    ).toBeVisible();
    expect(actionPosts.some((post) => post.path === "/api/app/meals")).toBe(
        false,
    );
});

test("packaged bundle: quiet state keeps the heading and the chat entry", async ({
    page,
}) => {
    nextUpPayload = QUIET;
    await openPackagedToday(page);
    const card = page.getByTestId("next-up");
    await expect(card.getByText(/You're set for today/)).toBeVisible();
    await expect(
        card.getByRole("link", { name: /Ask about today/ }),
    ).toBeVisible();
    await expect(card.getByText("Chicken rice bowl")).toHaveCount(0);
    await page.screenshot({
        path: join(CAPTURE_DIR, "mobile-next-up-collapsed.png"),
    });
});
