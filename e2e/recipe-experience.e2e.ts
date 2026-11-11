import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

// Recipe experience (R1–R3) on the real server with the provisioned
// reviewer account. ONE sign-in drives the whole journey (the suite
// shares a sign-in rate-limit budget):
//  R1 — a recipe seeded with plain typed lines shows its unmatchable
//       ingredient flagged "Not resolved"; Calculate nutrition writes
//       a new revision (the meta line moves to revision 2) and the
//       unmatchable ingredient stays flagged — never zeroed.
//  R3 — Add to grocery list reports added counts with a jump to the
//       list; a second pass reports merges, not duplicates.
//  R2 — Start cook opens cook mode: ingredient + step checklists,
//       the current step marked "Up next"; checks persist across a
//       close/reopen; checking the last step offers Log recipe and
//       Finish cook.
// Captures go to the munch-recipe-experience-captures CI artifact.
// Provider-dependent values (which real ingredients resolve under the
// DEMO_KEY pool) are deliberately NOT asserted — revision movement,
// flags, counts, and persistence are.

const CAPTURE_DIR = "test-results/recipe-experience-captures";
mkdirSync(CAPTURE_DIR, { recursive: true });

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

test("recipe heals visibly, stocks groceries with merge counts, and cooks in checklist mode", async ({
    page,
}) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);

    const features = await page.request.put("/api/app/features", {
        headers: { origin: new URL(page.url()).origin },
        data: { features: ALL_ON },
    });
    expect(features.status(), "PUT /api/app/features").toBe(200);

    // Seed the pre-resolver shape: plain typed lines saved through
    // the app API, one deliberately unmatchable, one optional.
    const stamp = Date.now();
    const recipeName = `E2E Heal Stew ${stamp}`;
    // Ingredient names are stamped too: the desktop and mobile
    // projects share this reviewer account within a job, and grocery
    // merging is by name+unit — unstamped names would merge into the
    // sibling project's list on the first pass.
    const butterName = `Zebra butter ${stamp}`;
    const milkName = `Zebra milk ${stamp}`;
    const flakesName = `Unobtainium flakes ${stamp}`;
    const oilName = `Zebra truffle oil ${stamp}`;
    const seeded = await page.request.post("/api/app/recipes", {
        headers: { origin: new URL(page.url()).origin },
        data: {
            idempotency_key: `recipe-experience-e2e-${stamp}`,
            recipe: {
                name: recipeName,
                servings: 2,
                source_type: "user_entered",
                instructions: [
                    "Brown the butter.",
                    "Stir in the milk.",
                    "Serve warm.",
                ],
                ingredients: [
                    {
                        name: butterName,
                        quantity: 0.5,
                        unit: "cup",
                        source_type: "user_supplied",
                    },
                    {
                        name: milkName,
                        quantity: 1,
                        unit: "cup",
                        source_type: "user_supplied",
                    },
                    {
                        name: flakesName,
                        quantity: 3,
                        unit: "cups",
                        source_type: "user_supplied",
                    },
                    {
                        name: oilName,
                        quantity: 1,
                        unit: "tbsp",
                        optional: true,
                        source_type: "user_supplied",
                    },
                ],
            },
        },
    });
    expect(seeded.status(), "seed recipe").toBe(200);

    // ---- Recipe detail: the new actions + the unresolved flag (R1).
    await page.goto("/app/recipes");
    const card = page.locator(".recipe-panel", { hasText: recipeName });
    await expect(card).toBeVisible();
    // R3 also lives on the card (born flag-aware: Groceries is on).
    await expect(
        card.locator('[data-action="recipe-groceries"]'),
    ).toBeVisible();
    await card.getByRole("button", { name: "View recipe" }).click();
    const dialog = page.locator("#app-dialog");
    await expect(
        dialog.locator('[data-action="start-recipe-cook"]'),
    ).toBeVisible();
    await expect(
        dialog.locator('[data-action="recipe-groceries"]'),
    ).toBeVisible();
    const unobtainiumRow = dialog.locator(".recipe-ingredient-row", {
        hasText: flakesName,
    });
    await expect(unobtainiumRow.locator(".recipe-unresolved")).toHaveText(
        "Not resolved",
    );
    await expect(
        dialog.locator('[data-action="calculate-recipe-nutrition"]'),
    ).toBeVisible();
    await page.screenshot({
        path: `${CAPTURE_DIR}/recipe-detail-before-heal.png`,
    });

    // ---- R1: Calculate nutrition writes a NEW revision; the
    // unmatchable ingredient is still flagged afterwards.
    await dialog.locator('[data-action="calculate-recipe-nutrition"]').click();
    await expect(dialog.locator(".recipe-meta")).toContainText("revision 2");
    await expect(unobtainiumRow.locator(".recipe-unresolved")).toHaveText(
        "Not resolved",
    );
    await page.screenshot({
        path: `${CAPTURE_DIR}/recipe-detail-after-heal.png`,
    });

    // ---- R3: first pass adds, second pass merges.
    await dialog.locator('[data-action="recipe-groceries"]').click();
    const groceryForm = page.locator("#recipe-groceries-form");
    await expect(groceryForm).toBeVisible();
    await expect(groceryForm.locator('[name="servings"]')).toHaveValue("2");
    await groceryForm
        .getByRole("button", { name: "Add to grocery list" })
        .click();
    const firstToast = page.locator(".toast-action");
    await expect(firstToast).toContainText("3 items added");
    await firstToast.getByRole("button", { name: "View list" }).click();
    await expect(page).toHaveURL(/\/app\/groceries/);
    await expect(
        page.locator(".grocery-item-row", { hasText: butterName }),
    ).toHaveCount(1);

    await page.goto("/app/recipes");
    await page
        .locator(".recipe-panel", { hasText: recipeName })
        .getByRole("button", { name: "View recipe" })
        .click();
    await dialog.locator('[data-action="recipe-groceries"]').click();
    await page
        .locator("#recipe-groceries-form")
        .getByRole("button", { name: "Add to grocery list" })
        .click();
    await expect(page.locator(".toast-action")).toContainText(
        "3 merged with items already on the list",
    );

    // ---- R2: cook mode.
    await page
        .locator(".recipe-panel", { hasText: recipeName })
        .getByRole("button", { name: "View recipe" })
        .click();
    await dialog.locator('[data-action="start-recipe-cook"]').click();
    const cookMode = dialog.locator("[data-cook-mode]");
    await expect(cookMode).toBeVisible();
    await expect(cookMode.locator(".cook-mode-current-tag")).toHaveText(
        "Up next",
    );
    const ingredientBoxes = cookMode.locator(
        '.cook-mode-check[data-kind="ingredients"]',
    );
    const stepBoxes = cookMode.locator('.cook-mode-check[data-kind="steps"]');
    await expect(ingredientBoxes).toHaveCount(4);
    await expect(stepBoxes).toHaveCount(3);
    await ingredientBoxes.nth(0).check();
    await stepBoxes.nth(0).check();
    await expect(cookMode.locator("[data-cook-mode-progress]")).toContainText(
        "1 of 4 ingredients · 1 of 3 steps",
    );
    await page.screenshot({ path: `${CAPTURE_DIR}/cook-mode-mid.png` });

    // Persistence: close, reopen from the Cooks list, state survives.
    await page.locator(".dialog-close").click();
    await page.goto("/app/cooks");
    const cookCard = page.locator(".cook-card", { hasText: recipeName });
    await expect(cookCard).toBeVisible();
    await cookCard.locator('[data-action="open-cook"]').click();
    const reopened = dialog.locator("[data-cook-mode]");
    await expect(reopened).toBeVisible();
    await expect(
        reopened.locator('.cook-mode-check[data-kind="ingredients"]').nth(0),
    ).toBeChecked();
    await expect(
        reopened.locator('.cook-mode-check[data-kind="steps"]').nth(0),
    ).toBeChecked();
    await expect(reopened.locator("[data-cook-mode-progress]")).toContainText(
        "1 of 4 ingredients · 1 of 3 steps",
    );

    // Finishing the last step offers Log recipe + Finish cook.
    await reopened
        .locator('.cook-mode-check[data-kind="steps"]')
        .nth(1)
        .check();
    await reopened
        .locator('.cook-mode-check[data-kind="steps"]')
        .nth(2)
        .check();
    await expect(reopened.locator(".cook-mode-finish")).toContainText(
        "Every step is checked off.",
    );
    await expect(
        reopened
            .locator(".cook-mode-finish")
            .getByRole("button", { name: "Log recipe" }),
    ).toBeVisible();
    await expect(
        reopened
            .locator(".cook-mode-finish")
            .getByRole("button", { name: "Finish cook" }),
    ).toBeVisible();
    await page.screenshot({ path: `${CAPTURE_DIR}/cook-mode-finish.png` });
});
