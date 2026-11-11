import { expect, test, type Page } from "@playwright/test";

// Trends (brief T1-T14) on the real server with the provisioned
// reviewer account: sparse honesty on a fresh account, a seeded
// dashboard whose verdicts/drill sums are real, a catalog-built
// custom dashboard that persists server-side, hostile-data geometry
// assertions (T14), and the 390x844 captures uploaded as the
// munch-trends-captures CI artifact.

const CAPTURE_DIR = "test-results/trends-captures";

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

const DEFAULT_LAYOUT = {
    version: 1,
    cards: [
        { shape: "bar", data: "calories", size: "full" },
        { shape: "line", data: "weight", size: "full" },
        { shape: "bar", data: "protein_g", size: "full" },
        { shape: "consistency", data: "logging", size: "compact" },
        { shape: "bar", data: "water_ml", size: "compact" },
    ],
};

async function resetLayout(page: Page) {
    const response = await page.request.put("/api/app/trends/layout", {
        headers: { origin: new URL(page.url()).origin },
        data: { layout: DEFAULT_LAYOUT },
    });
    expect(response.status()).toBe(200);
}

function isoDay(offset: number): string {
    const date = new Date(Date.now() - offset * 86_400_000);
    return date.toISOString().slice(0, 10);
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
            idempotency_key: `trends-e2e-${description}`,
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

test("fresh account: sparse states are honest, Digest is pinned, first screen composes at 390x844", async ({
    page,
}) => {
    test.setTimeout(120_000);
    await signIn(page);
    await resetLayout(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/trends");
    await expect(page).toHaveTitle(/^Trends — Munch$/);
    // Empty states are asserted on the Week range: the seeded test
    // logs 20+ days back, so the last 7 days are empty on any account.
    await page.locator('[data-action="trends-range"][data-days="7"]').click();
    await expect(page.locator("#app-content")).toContainText("Last 7 days");

    const calories = page.locator('.trends-card[data-card-key="bar:calories"]');
    await expect(calories).toBeVisible();
    // T10: a fresh account gets the honest empty state, not a chart.
    await expect(calories.locator(".trends-empty")).toContainText(
        "Nothing logged",
    );
    await expect(
        page.locator('.trends-card[data-card-key="line:weight"] .trends-empty'),
    ).toContainText("3 or more days");
    // The Digest is pinned last and unremovable in edit mode.
    const digest = page.locator('.trends-card[data-card-key="digest"]');
    await expect(digest).toContainText("The week in words");
    await expect(digest).toContainText("Pinned");
    // Acceptance: the first card is on the first screen, no scrolling.
    const box = await calories.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeLessThan(844);

    await page.screenshot({
        path: `${CAPTURE_DIR}/default-week-sparse-390.png`,
    });
    await page.locator('[data-action="trends-range"][data-days="30"]').click();
    await expect(page.locator("#app-content")).toContainText("Last 30 days");
    await page.screenshot({
        path: `${CAPTURE_DIR}/default-month-390.png`,
    });

    // Edit mode + catalog captures.
    await page.locator('[data-action="trends-edit-toggle"]').click();
    await expect(digest.locator('[data-action="trends-remove"]')).toHaveCount(
        0,
    );
    await page.screenshot({
        path: `${CAPTURE_DIR}/edit-mode-390.png`,
    });
    await page.locator('[data-action="trends-edit-toggle"]').click();
    await page.locator('[data-action="trends-add"]').click();
    const dialog = page.locator("#app-dialog");
    await expect(dialog).toContainText("what kind of chart?");
    await page.screenshot({
        path: `${CAPTURE_DIR}/catalog-step1-390.png`,
    });
    await dialog
        .locator('[data-action="trends-catalog-shape"][data-shape="bar"]')
        .click();
    await expect(dialog).toContainText("showing what?");
    // T5 guardrail on the live catalog: bars never offer Weight.
    await expect(dialog.locator('[data-data="weight"]')).toHaveCount(0);
    await expect(dialog.locator('[data-data="sodium_mg"]')).toBeVisible();
    await page.screenshot({
        path: `${CAPTURE_DIR}/catalog-step2-390.png`,
    });
    await dialog.locator('[data-action="close-dialog"]').click();
});

test("seeded account: verdicts render, drill sums match the bar, custom dashboard persists", async ({
    page,
}) => {
    test.setTimeout(180_000);
    await signIn(page);
    await resetLayout(page);
    const d0 = isoDay(20);
    const d1 = isoDay(21);
    const d2 = isoDay(22);
    await seedMeal(page, d2, "Seed chicken bowl", "lunch", [
        {
            name: "Grilled chicken",
            nutrients: {
                calories: 620,
                protein_g: 52,
                carbs_g: 38,
                fat_g: 24,
                fiber_g: 6,
                sodium_mg: 640,
                saturated_fat_g: 5,
                cholesterol_mg: 130,
                potassium_mg: 720,
            },
        },
        {
            name: "Rice",
            nutrients: {
                calories: 410,
                protein_g: 8,
                carbs_g: 84,
                fat_g: 2,
                fiber_g: 2,
                sodium_mg: 10,
            },
        },
    ]);
    await seedMeal(page, d1, "Seed burger night", "dinner", [
        {
            name: "Burger",
            nutrients: {
                calories: 950,
                protein_g: 41,
                carbs_g: 44,
                fat_g: 58,
                fiber_g: 3,
                sodium_mg: 1420,
                saturated_fat_g: 21,
                cholesterol_mg: 105,
                potassium_mg: 610,
            },
        },
    ]);
    await seedMeal(page, d0, "Seed oats", "breakfast", [
        {
            name: "Rolled oats",
            nutrients: {
                calories: 380,
                protein_g: 13,
                carbs_g: 62,
                fat_g: 7,
                fiber_g: 9,
                sodium_mg: 12,
            },
        },
    ]);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app/trends");
    const calories = page.locator('.trends-card[data-card-key="bar:calories"]');
    await expect(calories).toBeVisible();
    await expect(calories.locator(".trends-empty")).toHaveCount(0);
    // T13: one day label per bar across the whole month, and the
    // seeded days carry real bars.
    await expect(calories.locator(".trends-daylabels span")).toHaveCount(30);
    await expect(calories.locator(`[data-bar-date="${d1}"]`)).toHaveCount(1);

    // T11 drill: the burger day's sheet totals equal the day's meals,
    // items ranked by contribution, then the day's log opens.
    await calories
        .locator(`[data-action="trends-drill-day"][data-date="${d1}"]`)
        .click();
    const dialog = page.locator("#app-dialog");
    await expect(dialog).toContainText("Seed burger night");
    await expect(dialog).toContainText("950");
    await dialog.getByRole("button", { name: "Open that day's log" }).click();
    await expect(page.locator(".operate-view.today-view")).toHaveCount(1);
    await expect(page.locator("#app-content")).toContainText(
        "Seed burger night",
    );

    // Build the custom dashboard: remove Protein, compact Calories,
    // add Sodium (its FDA reference label is goal-independent), a
    // Macro split donut and a Weekday pattern.
    await page.goto("/app/trends");
    await page.locator('[data-action="trends-edit-toggle"]').click();
    await page
        .locator(
            '.trends-card[data-card-key="bar:protein_g"] [data-action="trends-remove"]',
        )
        .click();
    await expect(
        page.locator('.trends-card[data-card-key="bar:protein_g"]'),
    ).toHaveCount(0);
    await page
        .locator(
            '.trends-card[data-card-key="bar:calories"] [data-action="trends-size"]',
        )
        .click();
    await expect(calories).toHaveClass(/is-compact/);
    await page.locator('[data-action="trends-edit-toggle"]').click();

    async function addChart(shape: string, data: string) {
        await page.locator('[data-action="trends-add"]').click();
        await dialog
            .locator(
                `[data-action="trends-catalog-shape"][data-shape="${shape}"]`,
            )
            .click();
        await dialog
            .locator(`[data-action="trends-catalog-add"][data-data="${data}"]`)
            .click();
    }
    await addChart("bar", "sodium_mg");
    const sodium = page.locator('.trends-card[data-card-key="bar:sodium_mg"]');
    await expect(sodium).toBeVisible();
    // T13/T6: the labeled FDA limit rides on the chart and the verdict.
    await expect(sodium.locator("[data-chart-label]")).toContainText(
        "limit 2,300 mg",
    );
    await expect(sodium).toContainText("FDA daily limit");

    await addChart("breakdown", "macro_split");
    const donut = page.locator(
        '.trends-card[data-card-key="breakdown:macro_split"]',
    );
    await expect(donut).toBeVisible();
    const shareSum = await donut.evaluate((el) => {
        const shares = [...el.querySelectorAll(".trends-legend-row b")].map(
            (b) => Number((b.textContent || "").replace("%", "")),
        );
        return shares.reduce((a, b) => a + b, 0);
    });
    expect(shareSum).toBe(100);

    await addChart("patterns", "weekday");
    const weekday = page.locator(
        '.trends-card[data-card-key="patterns:weekday"]',
    );
    await expect(weekday).toBeVisible();
    await expect(weekday.locator("[data-chart-label]")).toContainText("avg");

    // T9: the layout API agrees, and a reload renders the same picks.
    const layoutResponse = await page.request.get("/api/app/trends/layout");
    const layout = (await layoutResponse.json()).layout;
    const keys = layout.cards.map(
        (card: { shape: string; data: string }) => `${card.shape}:${card.data}`,
    );
    expect(keys).toContain("bar:sodium_mg");
    expect(keys).toContain("breakdown:macro_split");
    expect(keys).toContain("patterns:weekday");
    expect(keys).not.toContain("bar:protein_g");
    await page.reload();
    await expect(
        page.locator('.trends-card[data-card-key="bar:protein_g"]'),
    ).toHaveCount(0);
    await expect(sodium).toBeVisible();
    await expect(donut).toBeVisible();
    await page.screenshot({
        path: `${CAPTURE_DIR}/custom-dashboard-390.png`,
        fullPage: true,
    });
});

// ------------------------------------------------------- hostile data

type HostileCase = {
    name: string;
    card: Record<string, unknown>;
};

function hostileWorkspace(card: Record<string, unknown>) {
    return {
        startDate: "2026-11-03",
        endDate: "2026-11-09",
        rangeDays: 7,
        timezone: "UTC",
        weightUnit: "lb",
        alcoholTrackingEnabled: true,
        layout: {
            version: 1,
            cards: [
                {
                    shape: card.shape,
                    data: card.data,
                    size: card.size || "full",
                },
            ],
        },
        catalog: [],
        cards: [card],
        digest: { weekly: "Digest.", trends: "T.", patterns: "P." },
    };
}

function barDays(values: (number | null)[]) {
    return [
        "2026-11-03",
        "2026-11-04",
        "2026-11-05",
        "2026-11-06",
        "2026-11-07",
        "2026-11-08",
        "2026-11-09",
    ].map((date, i) => ({
        date,
        value: values[i] ?? null,
        hasLog: values[i] != null,
    }));
}

function barCard(
    data: string,
    title: string,
    unit: string,
    values: (number | null)[],
    reference: Record<string, unknown> | null,
): Record<string, unknown> {
    return {
        shape: "bar",
        data,
        size: "full",
        title,
        subtitle: "Daily total",
        headline: { value: "x", unit, note: "daily average" },
        verdict: null,
        coverage: null,
        empty: null,
        chart: {
            kind: "bars",
            metric: data,
            unit,
            days: barDays(values),
            reference,
            rolling: null,
        },
    };
}

const HOSTILE_CASES: HostileCase[] = [
    {
        name: "fat day at 2x the limit",
        card: barCard("fat_g", "Fat", "g", [40, 55, 120, 50, 45, 58, 52], {
            type: "line",
            value: 60,
            label: "limit 60 g",
        }),
    },
    {
        name: "sodium at 8,000 mg on a single day",
        card: barCard(
            "sodium_mg",
            "Sodium",
            "mg",
            [null, null, 8000, null, null, null, null],
            { type: "line", value: 2300, label: "limit 2,300 mg" },
        ),
    },
    {
        name: "water at 0 and 6 L",
        card: barCard(
            "water_ml",
            "Water",
            "ml",
            [0, 6000, 0, 1200, 0, 2400, 0],
            { type: "line", value: 2500, label: "target 2,500 ml" },
        ),
    },
    {
        name: "weekday averages with tall weekend bars",
        card: {
            shape: "patterns",
            data: "weekday",
            size: "full",
            title: "Weekday pattern",
            subtitle: "Average calories by weekday",
            headline: { value: "2,557", unit: "kcal", note: "daily average" },
            verdict: null,
            coverage: null,
            empty: null,
            chart: {
                kind: "weekday",
                metric: "calories",
                unit: "kcal",
                days: [2450, 2380, 2300, 2420, 2600, 2950, 2800].map(
                    (avg, i) => ({
                        dow: (i + 1) % 7,
                        label: [
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                            "Sun",
                        ][i],
                        avg,
                        count: 1,
                        weekend: i >= 5,
                        dates: [{ date: "2026-11-09", value: avg }],
                    }),
                ),
                reference: { value: 2557, label: "avg 2,557" },
            },
        },
    },
    {
        name: "weight outlier spike",
        card: {
            shape: "line",
            data: "weight",
            size: "full",
            title: "Weight",
            subtitle: "Trend weight · lb",
            headline: { value: "182.6", unit: "lb", note: "trend weight" },
            verdict: null,
            coverage: null,
            empty: null,
            chart: {
                kind: "line",
                metric: "weight",
                unit: "lb",
                points: [
                    { date: "2026-11-03", value: 180 },
                    { date: "2026-11-04", value: 180 },
                    { date: "2026-11-05", value: 210 },
                    { date: "2026-11-06", value: 179 },
                    { date: "2026-11-07", value: 179 },
                    { date: "2026-11-08", value: 179 },
                    { date: "2026-11-09", value: 179 },
                ],
                trend: [
                    { date: "2026-11-03", value: 180 },
                    { date: "2026-11-04", value: 180 },
                    { date: "2026-11-05", value: 187.5 },
                    { date: "2026-11-06", value: 185.4 },
                    { date: "2026-11-07", value: 183.8 },
                    { date: "2026-11-08", value: 182.6 },
                    { date: "2026-11-09", value: 181.7 },
                ],
                target: 175,
                startLabel: "2026-11-03",
                endLabel: "2026-11-09",
            },
        },
    },
];

test("hostile renders: no label overlap, no out-of-plot geometry (T14)", async ({
    page,
}) => {
    test.setTimeout(180_000);
    await signIn(page);
    await page.setViewportSize({ width: 390, height: 844 });
    let current: Record<string, unknown> = HOSTILE_CASES[0]!.card;
    await page.route(/\/api\/app\/trends\?/, async (route) => {
        await route.fulfill({
            contentType: "application/json",
            body: JSON.stringify(hostileWorkspace(current)),
        });
    });
    await page.route("**/api/app/insights/checkin*", async (route) => {
        await route.fulfill({
            contentType: "application/json",
            body: JSON.stringify({
                coverage_percent: 0,
                nutrition_target_coverage_days: 0,
                calendar_days: 7,
                uncertain_nutrition_meals: 0,
                observations: [],
            }),
        });
    });
    for (const hostile of HOSTILE_CASES) {
        current = hostile.card;
        await page.goto("/app/trends");
        const card = page.locator(".trends-card").first();
        await expect(card).toBeVisible();
        const violations = await card.evaluate((el) => {
            const problems: string[] = [];
            const svg = el.querySelector("svg");
            if (!svg) return ["no svg rendered"];
            const plot = svg.getBoundingClientRect();
            const boxes = (selector: string) =>
                [...el.querySelectorAll(selector)].map((node) => ({
                    key:
                        node.getAttribute("data-bar-date") ||
                        node.getAttribute("data-date") ||
                        (node.textContent || "").trim(),
                    box: node.getBoundingClientRect(),
                }));
            const labels = boxes("[data-chart-label]");
            const bars = boxes("[data-bar-date], [data-bar-dow]");
            const dots = boxes("[data-chart-dot]");
            const hit = (a: DOMRect, b: DOMRect) =>
                a.left < b.right &&
                b.left < a.right &&
                a.top < b.bottom &&
                b.top < a.bottom;
            for (const { key, box } of [...bars, ...dots]) {
                if (
                    box.left < plot.left - 0.5 ||
                    box.right > plot.right + 0.5 ||
                    box.top < plot.top - 0.5 ||
                    box.bottom > plot.bottom + 0.5
                ) {
                    problems.push(`${key} escapes the plot`);
                }
                if (box.height < 0 || box.width < 0)
                    problems.push(`${key} has negative geometry`);
            }
            for (const label of labels) {
                for (const other of [...bars, ...dots]) {
                    if (hit(label.box, other.box))
                        problems.push(
                            `label "${label.key}" intersects ${other.key}`,
                        );
                }
                for (const other of labels) {
                    if (other !== label && hit(label.box, other.box))
                        problems.push(
                            `label "${label.key}" hits another label`,
                        );
                }
            }
            return problems;
        });
        expect(violations, hostile.name).toEqual([]);
        await page.screenshot({
            path: `${CAPTURE_DIR}/hostile-${hostile.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-390.png`,
        });
    }
});
