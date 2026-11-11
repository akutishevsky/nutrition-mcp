import { expect, test, type Page } from "@playwright/test";

// Feature toggles (brief addendum 10, T1–T7) on the real server with
// the provisioned reviewer account. ONE sign-in drives the whole
// journey (the suite shares a sign-in rate-limit budget): the
// "Just logging" preset strips both navs to the spine, the More list
// drops its disabled module, disabled module URLs land on Today with
// the one-line notice, a recipe loses its cross-module buttons, and
// a pantry item seeded before the toggle is byte-for-byte present
// after the off→on round trip (T4). Captures go to the
// munch-feature-toggles-captures CI artifact.

const CAPTURE_DIR = "test-results/feature-toggles-captures";

const ALL_ON = {
    plan: true,
    recipes: true,
    groceries: true,
    pantry: true,
    cooks: true,
};

async function signIn(page: Page) {
    const email = process.env.MUNCH_REVIEWER_EMAIL;
    const password = process.env.MUNCH_REVIEWER_PASSWORD;
    if (!email || !password) {
        throw new Error(
            "MUNCH_REVIEWER_EMAIL and MUNCH_REVIEWER_PASSWORD are required",
        );
    }
    await page.goto("/account/password?return_to=%2Fapp");
    await page.getByLabel("Username or email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/app\/?$/);
    await expect(page).toHaveTitle(/^Today — Munch$/);
}

async function setFeatures(
    page: Page,
    features: Record<string, boolean>,
): Promise<void> {
    const response = await page.request.put("/api/app/features", {
        headers: { origin: new URL(page.url()).origin },
        data: { features },
    });
    expect(response.status(), "PUT /api/app/features").toBe(200);
}

// textContent concatenates the icon span and the label without a
// separating space ("◉Today"); strip the leading icon run.
function navName(raw: string): string {
    return raw.replace(/^[^A-Za-z]+/, "").trim();
}

async function bottomNavLabels(page: Page): Promise<string[]> {
    const labels = await page.locator(".mobile-bottom-nav a").allTextContents();
    return labels.map(navName);
}

async function sidebarLabels(page: Page): Promise<string[]> {
    const labels = await page
        .locator('.app-nav[aria-label="Application navigation"] a')
        .allTextContents();
    return labels.map(navName);
}

test("just logging strips the app to its spine; pantry data survives the round trip", async ({
    page,
}) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);

    try {
        // Start from the shipped default and seed the pantry item the
        // round trip must preserve (T4 fixture).
        await setFeatures(page, ALL_ON);
        const pantryOn = await page.request.patch("/api/app/pantry/settings", {
            headers: { origin: new URL(page.url()).origin },
            data: { enabled: true },
        });
        expect(pantryOn.status(), "enable pantry workspace").toBe(200);
        const seeded = await page.request.post("/api/app/pantry/reconcile", {
            headers: { origin: new URL(page.url()).origin },
            data: {
                source_type: "manual",
                idempotency_key: "feature-toggles-e2e-oats",
                operations: [
                    {
                        action: "acquire",
                        name: "Toggle Test Oats",
                        quantity: 2,
                        unit: "bag",
                        location: "pantry",
                    },
                ],
            },
        });
        expect(seeded.status(), "seed pantry item").toBe(200);

        // Seed a recipe for the cross-module button checks (T7).
        const recipe = await page.request.post("/api/app/recipes", {
            headers: { origin: new URL(page.url()).origin },
            data: {
                idempotency_key: "feature-toggles-e2e-recipe",
                recipe: {
                    name: "Toggle Test Soup",
                    servings: 2,
                    instructions: ["Simmer everything for 20 minutes."],
                    source_type: "user_entered",
                    ingredients: [
                        {
                            name: "Vegetable stock",
                            quantity: 4,
                            unit: "cups",
                            nutrients: {
                                calories: 60,
                                protein_g: 2,
                                carbs_g: 8,
                                fat_g: 2,
                            },
                            source_type: "user_supplied",
                            source_snapshot: { entered_by_user: true },
                        },
                    ],
                },
            },
        });
        expect(recipe.status(), "seed recipe").toBe(200);

        // All-on: the six-destination nav and the Features page with
        // every switch on.
        await page.goto("/app/settings/features");
        await expect(
            page.getByRole("heading", { name: "Features" }),
        ).toBeVisible();
        for (const module of Object.keys(ALL_ON)) {
            await expect(
                page.locator(`[data-feature-toggle="${module}"]`),
            ).toBeChecked();
        }
        expect(await bottomNavLabels(page)).toEqual([
            "Today",
            "Plan",
            "Recipes",
            "Groceries",
            "Pantry",
            "More",
        ]);
        await page.screenshot({
            path: `${CAPTURE_DIR}/features-all-on.png`,
        });

        // The preset: one tap, every optional module off (T1).
        await page.getByRole("button", { name: /Just logging/ }).click();
        await expect(
            page.locator(".toast", { hasText: "Just logging" }),
        ).toBeVisible();
        for (const module of Object.keys(ALL_ON)) {
            await expect(
                page.locator(`[data-feature-toggle="${module}"]`),
            ).not.toBeChecked();
        }
        // T6: the bottom nav is honestly Today / More, equal shares.
        expect(await bottomNavLabels(page)).toEqual(["Today", "More"]);
        const todayBox = await page
            .locator('.mobile-bottom-nav a[data-route="today"]')
            .boundingBox();
        const moreBox = await page
            .locator('.mobile-bottom-nav a[data-route="more"]')
            .boundingBox();
        expect(todayBox).not.toBeNull();
        expect(moreBox).not.toBeNull();
        expect(Math.abs(todayBox!.width - moreBox!.width)).toBeLessThan(2);
        expect(todayBox!.height).toBeGreaterThanOrEqual(44);
        // The sidebar renders from the same flags: core rows only.
        expect(await sidebarLabels(page)).toEqual([
            "Today",
            "History",
            "Trends",
            "Household",
        ]);
        await page.screenshot({
            path: `${CAPTURE_DIR}/features-just-logging.png`,
        });
        await page.screenshot({
            path: `${CAPTURE_DIR}/two-item-nav.png`,
        });

        // T3: the More list shows no disabled module.
        await page.goto("/app/more");
        await expect(
            page.locator(".more-card", { hasText: "Cooks" }),
        ).toHaveCount(0);
        await expect(
            page.locator(".more-card", { hasText: "History" }),
        ).toHaveCount(1);

        // T3: a bookmarked Pantry URL lands on Today with the notice,
        // never the pantry page or a 404.
        await page.goto("/app/pantry");
        await expect(page).toHaveURL(/\/app\/?$/);
        await expect(
            page.locator(".toast", {
                hasText: "Pantry is turned off — re-enable it in Settings",
            }),
        ).toBeVisible();

        // T3: an SPA module route lands on Today the same way.
        await page.goto("/app/plan");
        await expect(page).toHaveURL(/\/app\/?$/);
        await expect(
            page.locator(".toast", {
                hasText: "Meal Plan is turned off — re-enable it in Settings",
            }),
        ).toBeVisible();

        // T7: with Plan and Groceries off (Recipes still off here too
        // — turn it back on alone), the recipe library offers no
        // cross-module actions.
        await setFeatures(page, { recipes: true });
        await page.goto("/app/recipes");
        const card = page.locator(".recipe-panel", {
            hasText: "Toggle Test Soup",
        });
        await expect(card).toHaveCount(1);
        await expect(card.locator('[data-action="plan-recipe"]')).toHaveCount(
            0,
        );
        await expect(
            page.locator('[data-action="compose-recipe"]'),
        ).toHaveCount(0);
        await card.locator('[data-action="view-recipe"]').click();
        await expect(
            page.locator('#app-dialog [data-action="plan-recipe"]'),
        ).toHaveCount(0);
        await expect(
            page.locator('#app-dialog [data-action="log-recipe"]'),
        ).toHaveCount(1);

        // T4: re-enable Pantry from Settings — the seeded item is
        // exactly where it was left.
        await page.goto("/app/settings/features");
        await page
            .locator(".settings-toggle-row", {
                has: page.locator('[data-feature-toggle="pantry"]'),
            })
            .click();
        await expect(
            page.locator('[data-feature-toggle="pantry"]'),
        ).toBeChecked();
        await page.goto("/app/pantry");
        await expect(page.locator("#inventory")).toContainText(
            "Toggle Test Oats",
        );
    } finally {
        // Leave the shared suite account in the shipped default.
        await setFeatures(page, ALL_ON).catch(() => undefined);
    }
});
