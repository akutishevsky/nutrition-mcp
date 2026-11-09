import { expect, test } from "@playwright/test";

test("protects private data and supports the core website journey", async ({
    page,
}) => {
    const email = process.env.MUNCH_REVIEWER_EMAIL;
    const password = process.env.MUNCH_REVIEWER_PASSWORD;
    if (!email || !password) {
        throw new Error(
            "MUNCH_REVIEWER_EMAIL and MUNCH_REVIEWER_PASSWORD are required",
        );
    }

    const anonymousResponse = await page.request.get("/api/app/bootstrap");
    expect(anonymousResponse.status()).toBe(401);

    await page.goto("/account/password?return_to=%2Fapp");
    await page.getByLabel("Username or email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);

    const bootstrapResponse = page.waitForResponse((response) => {
        return new URL(response.url()).pathname === "/api/app/bootstrap";
    });
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/app\/?$/);
    expect((await bootstrapResponse).status()).toBe(200);
    await expect(
        page.getByRole("heading", { level: 1, name: "Today" }),
    ).toBeVisible();
    await expect(
        page.getByText("Your structured nutrition record for this day."),
    ).toBeVisible();

    if ((page.viewportSize()?.width ?? 0) > 768) {
        await page
            .getByRole("navigation", { name: "Application navigation" })
            .getByRole("link", { name: /Meal Plan/ })
            .click();
    } else {
        await page
            .getByRole("navigation", { name: "Mobile navigation" })
            .getByRole("link", { name: /Plan/ })
            .click();
    }

    await expect(page).toHaveURL(/\/app\/plan$/);
    await expect(
        page.getByRole("heading", { level: 1, name: "Meal Plan" }),
    ).toBeVisible();

    await page.goto("/app/settings/billing");
    await expect(
        page.getByRole("heading", { level: 1, name: "Plan & billing" }),
    ).toBeVisible();
    // De-credit slice (Amendments C+D): no credits balance or price
    // list, and AI features are free — the billing page carries the
    // AI features group framed as included for every account.
    await expect(page.getByText("AI task credits")).toHaveCount(0);
    await expect(page.getByText("Balance this month")).toHaveCount(0);
    await expect(
        page.getByRole("heading", { name: "AI features" }),
    ).toBeVisible();
    await expect(page.getByText("Included for everyone")).toBeVisible();
    await page.screenshot({
        path: "test-results/settings-plan-billing.png",
        fullPage: true,
    });

    await page.goto("/app/insights");
    await expect(
        page.getByRole("heading", { level: 1, name: "Insights" }),
    ).toBeVisible();
    await expect
        .poll(() =>
            page.evaluate(
                () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
        )
        .toBe(true);
});
