import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Next up (guidance rework D1–D7): the D1 restatement ban and the
 * raw-enum ban on the real home screen, the D6 one-time goal prompt
 * (shown once, dismissal persists), the D2 populated card with its
 * D3 actions wired end to end (Plan it lands on the plan, Log it
 * opens a pre-filled draft and logs NOTHING until confirmation,
 * Add missing merges into the grocery list), the D7 neighbours
 * (Ask about today at the foot in every state), the first-screen
 * height budget, and the NO FILLER sweep verdicts on the four
 * neighbouring surfaces. One reviewer sign-in for the whole file.
 */

test.use({ viewport: { width: 390, height: 844 } });

const CAPTURE_DIR = join(process.cwd(), "test-results", "next-up-captures");
mkdirSync(CAPTURE_DIR, { recursive: true });

const username = process.env.MUNCH_REVIEWER_EMAIL;
const password = process.env["MUNCH_REVIEWER_" + "PASSWORD"];

async function signIn(page: Page) {
    await page.goto("/account/password?return_to=%2Fapp");
    await page.getByLabel("Username or email").fill(username!);
    await page.getByLabel("Password", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/app\/?$/);
    await expect(page).toHaveTitle(/^Today — Munch$/);
}

function originOf(page: Page) {
    return { origin: new URL(page.url()).origin };
}

/**
 * The D6 prompt flow, run when the one-time prompt is up: capture
 * the objective-unset state, set a goal through the prompt (the
 * existing confirmed, versioned preferences write), reset to
 * unset, then dismiss and prove the dismissal persists.
 */
async function promptFlow(
    page: Page,
    section: ReturnType<Page["getByTestId"]>,
) {
    await expect(
        section.getByRole("button", { name: "Lose weight" }),
    ).toBeVisible();
    await page.screenshot({
        path: join(CAPTURE_DIR, "next-up-objective-unset.png"),
    });

    await section.getByRole("button", { name: "Maintain" }).click();
    await expect(page.getByText(/Goal set/)).toBeVisible();
    await expect(
        section.getByRole("button", { name: "Lose weight" }),
    ).toHaveCount(0);

    const prefsAgain = (
        await (await page.request.get("/api/app/guidance/preferences")).json()
    ).preferences;
    const { version: _v2, ...prefsAgainBody } = prefsAgain;
    const resetAgain = await page.request.put("/api/app/guidance/preferences", {
        headers: originOf(page),
        data: {
            preferences: {
                ...prefsAgainBody,
                objective: "track_only",
            },
            expected_version: prefsAgain.version,
            confirm: true,
        },
    });
    expect(resetAgain.status(), "reset objective again").toBe(200);
    await page.reload();
    await expect(
        page.getByTestId("next-up").getByRole("button", { name: "Dismiss" }),
    ).toBeVisible();

    // Dismissal persists across a reload (one-time means one-time).
    await section.getByRole("button", { name: "Dismiss" }).click();
    await expect(
        section.getByRole("button", { name: "Lose weight" }),
    ).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId("next-up")).toBeVisible();
    await expect(
        page
            .getByTestId("next-up")
            .getByRole("button", { name: "Lose weight" }),
    ).toHaveCount(0);
    await page.screenshot({
        path: join(CAPTURE_DIR, "next-up-collapsed.png"),
    });
}

test.describe("next up guidance rework", () => {
    test.skip(
        !username || !password,
        "MUNCH_REVIEWER_EMAIL and MUNCH_REVIEWER_PASSWORD are required",
    );

    test("quiet states, the goal prompt, then a populated card with working actions", async ({
        page,
    }) => {
        test.setTimeout(240_000);
        await signIn(page);

        // Deterministic starting point: objective unset + known goals.
        const prefsResponse = await page.request.get(
            "/api/app/guidance/preferences",
        );
        const prefs = (await prefsResponse.json()).preferences;
        const { version: _readVersion, ...prefsBody } = prefs;
        const setObjective = await page.request.put(
            "/api/app/guidance/preferences",
            {
                headers: originOf(page),
                data: {
                    preferences: { ...prefsBody, objective: "track_only" },
                    expected_version: prefs.version,
                    confirm: true,
                },
            },
        );
        expect(setObjective.status(), "reset objective to unset").toBe(200);
        const goals = await page.request.put("/api/app/goals", {
            headers: originOf(page),
            data: {
                daily_calories: 2000,
                daily_protein_g: 120,
                daily_carbs_g: 220,
                daily_fat_g: 65,
                confirm: true,
                idempotency_key: "next-up-e2e-goals",
            },
        });
        expect(goals.status(), "seed goals").toBe(200);

        // --- Objective-unset quiet state (D5/D6) ---
        await page.goto("/app/today");
        const section = page.getByTestId("next-up");
        await expect(section).toBeVisible();
        await expect(
            section.getByRole("heading", { name: "Next up", exact: true }),
        ).toBeVisible();
        // D1/D6: the raw enum and the day's restatement never render.
        await expect(page.locator("body")).not.toContainText("track_only");
        await expect(page.locator("body")).not.toContainText(
            "Planned meals are not counted as eaten",
        );
        // D7: the chat entry sits at the section's foot in this state.
        await expect(
            section.getByRole("link", { name: /Ask about today/ }),
        ).toBeVisible();
        // The goal prompt is one-time by design, so a CI retry of
        // this spec may find it already consumed by the first
        // attempt; the full prompt flow below runs only when the
        // prompt is actually up (it always is on a fresh account).
        const promptUp = await section
            .getByRole("button", { name: "Dismiss" })
            .waitFor({ state: "visible", timeout: 3000 })
            .then(() => true)
            .catch(() => false);
        if (promptUp) {
            await promptFlow(page, section);
        } else {
            await expect(
                section.getByRole("button", { name: "Lose weight" }),
            ).toHaveCount(0);
        }

        // --- Seed the populated context (D2) ---
        const today = new Date().toISOString().slice(0, 10);
        const pantrySettings = await page.request.patch(
            "/api/app/pantry/settings",
            { headers: originOf(page), data: { enabled: true } },
        );
        expect(pantrySettings.status(), "enable pantry").toBe(200);
        const pantrySeed = await page.request.post(
            "/api/app/pantry/reconcile",
            {
                headers: originOf(page),
                data: {
                    source_type: "manual",
                    idempotency_key: "next-up-e2e-chicken",
                    operations: [
                        {
                            action: "acquire",
                            name: "Chicken breast",
                            quantity: 2,
                            unit: "piece",
                            location: "fridge",
                        },
                    ],
                },
            },
        );
        expect(pantrySeed.status(), "seed pantry chicken").toBe(200);
        const recipe = await page.request.post("/api/app/recipes", {
            headers: originOf(page),
            data: {
                idempotency_key: "next-up-e2e-recipe",
                recipe: {
                    name: "Next Up Chicken Bowl",
                    servings: 1,
                    source_type: "user_entered",
                    instructions: ["Cook the chicken.", "Serve over rice."],
                    ingredients: [
                        {
                            name: "Chicken breast",
                            quantity: 1,
                            unit: "piece",
                            nutrients: {
                                calories: 220,
                                protein_g: 40,
                                carbs_g: 0,
                                fat_g: 5,
                            },
                            source_type: "user_supplied",
                            source_snapshot: { entered_by_user: true },
                        },
                        {
                            name: "Rice",
                            quantity: 1,
                            unit: "cup",
                            nutrients: {
                                calories: 200,
                                protein_g: 4,
                                carbs_g: 44,
                                fat_g: 1,
                            },
                            source_type: "user_supplied",
                            source_snapshot: { entered_by_user: true },
                        },
                        {
                            name: "Broccoli",
                            quantity: 1,
                            unit: "cup",
                            nutrients: {
                                calories: 55,
                                protein_g: 4,
                                carbs_g: 11,
                                fat_g: 1,
                            },
                            source_type: "user_supplied",
                            source_snapshot: { entered_by_user: true },
                        },
                    ],
                },
            },
        });
        expect(recipe.status(), "seed recipe").toBe(200);
        const breakfast = await page.request.post("/api/app/meals", {
            headers: originOf(page),
            data: {
                description: "Next up e2e breakfast",
                meal_type: "breakfast",
                logged_at: `${today}T12:00:00.000Z`,
                idempotency_key: "next-up-e2e-breakfast",
                items: [
                    {
                        name: "Oats and eggs",
                        quantity: 1,
                        portion_label: "1 serving",
                        gram_weight: 100,
                        nutrients: {
                            calories: 900,
                            protein_g: 55,
                            carbs_g: 100,
                            fat_g: 30,
                        },
                        source_type: "user_supplied",
                    },
                ],
            },
        });
        expect(breakfast.status(), "seed breakfast").toBe(200);

        // --- Populated card (D2/D3) ---
        await page.goto("/app/today");
        const card = page.getByTestId("next-up");
        await expect(
            card.getByRole("heading", { name: "Next up", exact: true }),
        ).toBeVisible();
        await expect(card.getByText("Next Up Chicken Bowl")).toBeVisible();
        await expect(card.locator(".next-up-nutrition")).toBeVisible();
        await expect(card.locator(".next-up-landing")).toContainText(
            "Day lands at",
        );
        await expect(
            card.getByRole("button", { name: "Plan it" }),
        ).toBeVisible();
        await expect(
            card.getByRole("button", { name: "Log it" }),
        ).toBeVisible();
        await expect(
            card.getByRole("button", { name: "Add missing to groceries" }),
        ).toBeVisible();
        await expect(
            card.getByRole("link", { name: /Ask about today/ }),
        ).toBeVisible();
        await expect(page.locator("body")).not.toContainText("track_only");
        await page.screenshot({
            path: join(CAPTURE_DIR, "next-up-populated.png"),
        });

        // Height budget: the day's first meal still starts on the
        // first screen under the macros + this section.
        const firstMeal = page.locator(".meal-card").first();
        await expect(firstMeal).toBeVisible();
        const mealBox = await firstMeal.boundingBox();
        expect(mealBox).not.toBeNull();
        expect(mealBox!.y).toBeLessThan(844);

        // Plan it lands the suggestion on today's plan. (Guarded:
        // a CI retry may find the first attempt's plan entry.)
        const planBefore = await page.request.get(
            `/api/app/planning?start=${today}&end=${today}`,
        );
        if (!(await planBefore.text()).includes("Next Up Chicken Bowl")) {
            await card.getByRole("button", { name: "Plan it" }).click();
            await expect(page.getByText(/Planned for/)).toBeVisible();
        }
        const planResponse = await page.request.get(
            `/api/app/planning?start=${today}&end=${today}`,
        );
        expect(await planResponse.text()).toContain("Next Up Chicken Bowl");

        // Log it opens the pre-filled draft — and logs nothing.
        await card.getByRole("button", { name: "Log it" }).click();
        await expect(
            page.getByRole("heading", { name: "Review meal draft" }),
        ).toBeVisible();
        await expect(page.getByText("Chicken breast")).toBeVisible();
        await page.getByRole("button", { name: "Close" }).first().click();
        await expect(
            page.getByRole("heading", { name: "Review meal draft" }),
        ).toHaveCount(0);
        const todayResponse = await page.request.get(
            `/api/app/today?date=${today}`,
        );
        const todayJson = await todayResponse.json();
        // Confirm-before-save: opening the draft logged nothing —
        // no logged meal carries the recipe's name. (Checked on the
        // meals array itself: the shared suite account legitimately
        // holds other lunches by now.)
        expect(
            (todayJson.meals ?? []).some(
                (meal: { description?: string }) =>
                    meal.description === "Next Up Chicken Bowl",
            ),
        ).toBe(false);

        // Add missing puts the broccoli on the grocery list.
        await card
            .getByRole("button", { name: "Add missing to groceries" })
            .click();
        await expect(page.getByText(/Groceries updated/)).toBeVisible();
        const groceriesResponse = await page.request.get("/api/app/groceries");
        expect(await groceriesResponse.text()).toContain("Broccoli");
    });

    test("NO FILLER sweep: neighbouring subtitles carry facts only", async ({
        page,
    }) => {
        await signIn(page);
        await page.goto("/app/recipes");
        await expect(
            page.getByRole("heading", { name: "Recipe library" }),
        ).toBeVisible();
        await expect(page.locator("body")).not.toContainText(
            "Import from a website for review",
        );
        await page.goto("/app/cooks");
        await expect(page.locator("body")).not.toContainText(
            "Persistent cooking sessions",
        );
        await page.goto("/app/plan");
        await expect(
            page.getByText("Planned meals stay separate from logged meals."),
        ).toBeVisible();
        await page.goto("/app/groceries");
        await expect(page.getByText(/Explicit lists only/)).toBeVisible();
    });
});
