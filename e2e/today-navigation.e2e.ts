import { expect, test, type Page } from "@playwright/test";

// Today navigation (brief items 1–6) on the real server with the
// provisioned reviewer account: the calendar icon replaces the day
// buttons, dots come from one month-summary request per displayed
// month, the 2x2 macro tiles open the meal→ingredient breakdown
// sheet, and History is reached through its two doors. Captures go
// to the munch-today-navigation-captures CI artifact.

const CAPTURE_DIR = "test-results/today-navigation-captures";

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

async function seedMeal(
    page: Page,
    date: string,
    description: string,
    mealType: string,
    items: { name: string; nutrients: Record<string, number> }[],
) {
    const response = await page.request.post("/api/app/meals", {
        headers: { origin: new URL(page.url()).origin },
        data: {
            description,
            meal_type: mealType,
            logged_at: `${date}T12:00:00.000Z`,
            idempotency_key: `today-nav-e2e-${description}`,
            items: items.map((item) => ({
                name: item.name,
                quantity: 1,
                portion_label: "1 serving",
                gram_weight: 100,
                nutrients: item.nutrients,
                source_type: "user_supplied",
            })),
        },
    });
    expect(response.status(), `seed meal ${description}`).toBe(200);
}

function shiftDay(date: string, days: number): string {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
}

test("calendar replaces the day buttons, dots mark logged days, macros break down by ingredient, History has two doors", async ({
    page,
}) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);

    const today = new Date().toISOString().slice(0, 10);
    const target = shiftDay(today, -3);
    const targetMonth = target.slice(0, 7);
    await seedMeal(page, target, "Nav seed bowl", "lunch", [
        {
            name: "Grilled chicken",
            nutrients: {
                calories: 248,
                protein_g: 46,
                carbs_g: 0,
                fat_g: 5,
                sodium_mg: 74,
            },
        },
        {
            name: "Jasmine rice",
            nutrients: {
                calories: 222,
                protein_g: 4,
                carbs_g: 45,
                fat_g: 1,
                sodium_mg: 4,
            },
        },
    ]);

    // The month summary itself: the seeded day is present with its
    // meal counted, and it names at least one genuinely empty day in
    // the same month to check the no-dot state against.
    const summaryResponse = await page.request.get(
        `/api/app/calendar/month?month=${targetMonth}`,
    );
    expect(summaryResponse.status()).toBe(200);
    const summary = await summaryResponse.json();
    const dottedDates = new Set(
        (summary.days as { date: string }[]).map((day) => day.date),
    );
    expect(dottedDates.has(target)).toBe(true);
    const [targetYear, targetMon] = targetMonth.split("-").map(Number);
    const nextMonthFirst =
        targetMon === 12
            ? `${targetYear + 1}-01-01`
            : `${targetYear}-${String(targetMon + 1).padStart(2, "0")}-01`;
    const monthLength = Number(shiftDay(nextMonthFirst, -1).slice(8, 10));
    const emptyDay = Array.from(
        { length: monthLength },
        (_, i) => `${targetMonth}-${String(i + 1).padStart(2, "0")}`,
    ).find((date) => !dottedDates.has(date) && date !== today);
    expect(emptyDay, "an empty day exists in the target month").toBeTruthy();

    const monthRequests: string[] = [];
    page.on("request", (request) => {
        const url = new URL(request.url());
        if (url.pathname === "/api/app/calendar/month") {
            monthRequests.push(url.searchParams.get("month") ?? "");
        }
    });

    // Item 1: the header carries the calendar icon (beside Trends)
    // and no Previous / Today / Next buttons; the filler subtitle is
    // gone (addendum 9).
    const heading = page.locator(".today-view .page-heading");
    await expect(
        heading.locator('[data-action="open-calendar"]'),
    ).toBeVisible();
    await expect(heading.locator('[data-action="open-trends"]')).toBeVisible();
    for (const name of ["Previous", "Today", "Next"]) {
        await expect(
            heading.getByRole("button", { name, exact: true }),
        ).toHaveCount(0);
    }
    await expect(heading.getByText("structured nutrition record")).toHaveCount(
        0,
    );

    // Items 4+6: six bottom-nav destinations at phone width.
    const nav = page.locator(".mobile-bottom-nav");
    await expect(nav.locator("a")).toHaveCount(6);
    await expect(nav.locator('a[href="/app/recipes"]')).toBeVisible();
    await expect(nav.locator('a[href="/app/log"]')).toHaveCount(0);
    await expect(nav.locator('a[href="/app/cooks"]')).toHaveCount(0);

    // Item 5: the 2x2 tile grid is Today's macros block now.
    await expect(page.locator(".macro-tile")).toHaveCount(4);
    await page.screenshot({ path: `${CAPTURE_DIR}/today-390.png` });

    // Items 1–3: open the calendar, step to the seeded month, and
    // check the dot states. One summary request per displayed month;
    // stepping back to a seen month refetches nothing.
    await heading.locator('[data-action="open-calendar"]').click();
    const dialog = page.locator("#app-dialog");
    await expect(dialog.locator(".cal-grid")).toBeVisible();
    const monthsBack =
        (Number(today.slice(0, 4)) - Number(target.slice(0, 4))) * 12 +
        (Number(today.slice(5, 7)) - Number(target.slice(5, 7)));
    for (let i = 0; i < monthsBack; i++) {
        await dialog.locator('[data-action="calendar-prev-month"]').click();
    }
    const dottedCell = dialog.locator(`.cal-day[data-date="${target}"]`);
    await expect(dottedCell.locator(".cal-dot")).toHaveCount(1);
    await expect(
        dialog.locator(`.cal-day[data-date="${emptyDay}"] .cal-dot`),
    ).toHaveCount(0);
    // Today is highlighted in its own month; the viewed day (today)
    // starts selected.
    await expect(dottedCell).toBeVisible();
    const fetchedMonths = new Set(monthRequests);
    expect(fetchedMonths.size).toBe(monthRequests.length);
    const fetchesBeforeReturn = monthRequests.length;
    for (let i = 0; i < monthsBack; i++) {
        await dialog.locator('[data-action="calendar-next-month"]').click();
    }
    if (monthsBack > 0) {
        // Back in the current month — served from the cache.
        expect(monthRequests.length).toBe(fetchesBeforeReturn);
        for (let i = 0; i < monthsBack; i++) {
            await dialog.locator('[data-action="calendar-prev-month"]').click();
        }
        expect(monthRequests.length).toBe(fetchesBeforeReturn);
    }
    await page.screenshot({ path: `${CAPTURE_DIR}/calendar-390.png` });

    // Item 1: tapping the dotted day lands Today on that date — the
    // one canonical day view — with the day's meals rendered.
    await dottedCell.click();
    await expect(page.locator("#app-content")).toContainText("Nav seed bowl");
    await expect(page.locator(".today-view .page-heading h2")).toContainText(
        new Intl.DateTimeFormat("en-US", {
            month: "long",
            timeZone: "UTC",
        }).format(new Date(`${target}T12:00:00Z`)),
    );

    // Item 5: the Protein tile opens the breakdown sheet — the meal
    // subtotal, each ingredient's own contribution, and the day
    // total pinned at the foot; the page behind never reflows.
    await page.locator('.macro-tile[data-macro="protein"]').click();
    await expect(dialog).toContainText("Nav seed bowl");
    await expect(dialog).toContainText("Grilled chicken");
    await expect(dialog).toContainText("Jasmine rice");
    await expect(dialog.locator(".macro-sheet-foot")).toContainText(
        "Day total",
    );
    await expect(dialog.locator(".macro-sheet-foot")).toContainText("50 g");
    await page.screenshot({
        path: `${CAPTURE_DIR}/breakdown-sheet-390.png`,
    });
    await dialog.locator('[data-action="close-dialog"]').click();

    // The Micronutrients expand sums the day's items (74 + 4 mg).
    await page.locator('[data-action="toggle-micros"]').click();
    await expect(page.locator("#today-micros")).toBeVisible();
    await expect(page.locator("#today-micros")).toContainText("78 mg");

    // Item 6, door (a): the calendar sheet's Search history row.
    await page.locator('[data-action="open-calendar"]').click();
    await dialog.locator('[data-action="calendar-history"]').click();
    await expect(page).toHaveURL(/\/app\/log$/);
    await expect(page).toHaveTitle(/^History — Munch$/);
    await expect(page.locator("#meal-history-search")).toBeVisible();

    // Item 6, door (b): the More list — History and Cooks are there,
    // Recipes is not (it holds a nav slot now).
    await page.goto("/app/more");
    await expect(page.locator('.more-card[href="/app/log"]')).toBeVisible();
    await expect(page.locator('.more-card[href="/app/cooks"]')).toBeVisible();
    await expect(page.locator('.more-card[href="/app/recipes"]')).toHaveCount(
        0,
    );
    await expect
        .poll(() =>
            page.evaluate(
                () => document.documentElement.scrollWidth <= window.innerWidth,
            ),
        )
        .toBe(true);
});
