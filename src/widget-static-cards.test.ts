// The examples carousel's widget cards as src/widget-static.ts renders them:
// log_meal's card (four conversations), get_goal_progress', get_weight_trends'
// and the importer's first step — from the demo payloads in
// src/copy/widget-demo.ts, in every site locale.
//
// src/widget-static.test.ts covers the first two cards (summary and trends)
// and is left as it is. This file pins what the new renderers add: that the
// sandbox builds for templates with no shared/macros.js, that a template's
// site-card region reaches it, that several strip cards on one page never
// point at each other's drawers, and that every payload is the one the tool
// would send — with the figures the conversation beside it quotes.
import { test, expect, describe } from "bun:test";
import {
    renderGoalProgressCard,
    renderImportFileStep,
    renderMealLoggedCard,
    renderWeightTrendsCard,
    scriptPartialsOf,
    siteRegionsOf,
    type MealProgressPayload,
} from "./widget-static.js";
import {
    DEMO_EXAMPLE_DATES,
    DEMO_EXAMPLE_MEALS,
    DEMO_GOALS,
    DEMO_SUMMARY_DATE,
    DEMO_TRENDS_END_DATE,
    demoExampleMealLogged,
    demoGoalProgressPayload,
    demoMealLoggedPayload,
    demoStartImportPayload,
    demoWeightTrendsPayload,
    validateDemoPayload,
    type DemoExampleMealSlide,
} from "./copy/widget-demo.js";
import { SITE_LOCALES, type SiteLocale } from "./routes.js";

// The meal descriptions are the page's copy; English stand-ins here.
const MEAL_TEXT: Record<DemoExampleMealSlide, string> = {
    "log-meal": "Oatmeal with berries (1 bowl) and coffee (1 cup)",
    "photo-meal":
        "Beef borscht (1 bowl) with sour cream (2 tbsp) and rye bread (1 slice)",
    "scan-barcode": "Coca-Cola (330 ml can)",
    "track-drinks": "Lager, 4% (1 pint, 568 ml)",
};
const GOAL_MEALS = [
    "Greek yogurt with granola and berries",
    "Chicken wrap with salad",
    "Flat white",
    "Salmon, rice and broccoli",
];
const SLIDES = Object.keys(DEMO_EXAMPLE_MEALS) as DemoExampleMealSlide[];

/** Every card one locale's examples carousel would carry, each under the id
 *  prefix a page gives it. */
async function pageCards(locale: SiteLocale) {
    const cards: { name: string; html: string }[] = [];
    for (const slide of SLIDES) {
        cards.push({
            name: slide,
            html: await renderMealLoggedCard(
                demoExampleMealLogged(slide, MEAL_TEXT[slide], locale),
                locale,
                { idPrefix: `ex-${slide}` },
            ),
        });
    }
    cards.push({
        name: "goals-progress",
        html: await renderGoalProgressCard(
            demoGoalProgressPayload(GOAL_MEALS, locale),
            locale,
            { idPrefix: "ex-goals-progress" },
        ),
    });
    cards.push({
        name: "weight-trend",
        html: await renderWeightTrendsCard(
            demoWeightTrendsPayload(locale),
            locale,
            30,
        ),
    });
    cards.push({
        name: "import-history",
        html: await renderImportFileStep(
            demoStartImportPayload(locale),
            locale,
        ),
    });
    return cards;
}

const text = (html: string) =>
    html
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

describe("the build-time sandboxes", () => {
    test("read each template's partials, bridge excluded, card partial last", async () => {
        const expected: Record<string, string> = {
            "meal-logged": "shared/meal-logged-card.js",
            "goal-progress": "shared/goal-progress-card.js",
            "weight-trends": "shared/weight-trends-card.js",
            "import-meals": "shared/import-card.js",
        };
        for (const [key, card] of Object.entries(expected)) {
            const partials = await scriptPartialsOf(key);
            expect(partials).not.toContain("shared/bridge.js");
            expect(partials).toContain(card);
            expect(partials.indexOf("shared/i18n.js")).toBeLessThan(
                partials.indexOf(card),
            );
        }
        // No macros.js in these two, which is why the macro exports are
        // conditional — naming them would be a ReferenceError at `return`.
        expect(await scriptPartialsOf("weight-trends")).not.toContain(
            "shared/macros.js",
        );
        expect(await scriptPartialsOf("import-meals")).not.toContain(
            "shared/macros.js",
        );
    });

    test("goal-progress brings its weight row from its site-card region, and nobody else has one", async () => {
        const regions = await siteRegionsOf("goal-progress");
        expect(regions).toHaveLength(1);
        expect(regions[0]).toContain("function weightExtra(");
        for (const key of [
            "meal-logged",
            "weight-trends",
            "import-meals",
            "trends",
            "nutrition-summary",
        ]) {
            expect(await siteRegionsOf(key)).toEqual([]);
        }
    });
});

describe("the demo payloads", () => {
    test("are the ones the tools would send", async () => {
        for (const locale of ["en", "ja"] as const) {
            for (const slide of SLIDES) {
                await validateDemoPayload(
                    "log_meal",
                    demoExampleMealLogged(slide, MEAL_TEXT[slide], locale),
                );
            }
            await validateDemoPayload(
                "get_goal_progress",
                demoGoalProgressPayload(GOAL_MEALS, locale),
            );
            await validateDemoPayload(
                "get_weight_trends",
                demoWeightTrendsPayload(locale),
            );
            await validateDemoPayload(
                "start_meal_import",
                demoStartImportPayload(locale),
            );
        }
    });

    test("a key the tool does not send is caught", async () => {
        const p = demoExampleMealLogged("log-meal", "x", "en");
        await expect(
            validateDemoPayload("log_meal", { ...p, range_days: 7 }),
        ).rejects.toThrow(/range_days/);
        await expect(
            validateDemoPayload("get_weight_trends", {
                ...demoWeightTrendsPayload("en"),
                days: [
                    {
                        date: DEMO_EXAMPLE_DATES["weight-trend"],
                        weight: 78.4,
                        kg: 1,
                    },
                ],
            }),
        ).rejects.toThrow(/kg/);
    });

    test("the importer's server constants cannot drift", async () => {
        await expect(
            validateDemoPayload("start_meal_import", {
                ...demoStartImportPayload("en"),
                max_rows_per_call: 49,
            }),
        ).rejects.toThrow(/max_rows_per_call/);
    });

    test("every day's totals are its meals summed", () => {
        const payloads: {
            totals: MealProgressPayload["totals"];
            meals: MealProgressPayload["meals"];
        }[] = [
            ...SLIDES.map((s) => demoExampleMealLogged(s, "x", "en")),
            demoGoalProgressPayload(GOAL_MEALS, "en"),
        ];
        for (const p of payloads) {
            const sum = (
                k:
                    | "calories"
                    | "protein_g"
                    | "carbs_g"
                    | "fat_g"
                    | "fiber_g"
                    | "sugar_g",
            ) => Math.round(p.meals.reduce((t, m) => t + m[k], 0) * 10) / 10;
            for (const k of [
                "calories",
                "protein_g",
                "carbs_g",
                "fat_g",
                "fiber_g",
                "sugar_g",
            ] as const) {
                expect(`${k}: ${p.totals[k]}`).toBe(`${k}: ${sum(k)}`);
            }
            const caf = p.meals.filter((m) => m.caffeine_mg != null);
            expect(p.totals.caffeine_mg).toBe(
                caf.length ? caf.reduce((t, m) => t + m.caffeine_mg!, 0) : null,
            );
        }
    });

    test("alcohol exists only on the conversation that turns tracking on", () => {
        for (const slide of SLIDES) {
            const p = demoExampleMealLogged(slide, "x", "en");
            if (slide === "track-drinks") {
                expect(p.drink_unit).toBe("uk");
                expect(p.totals.alcohol_g).toBe(17.9);
                expect(p.logged_meal.alcohol_g).toBe(17.9);
                // goalsPayloadOf passes the account's (absent) alcohol goal.
                expect(p.goals?.alcohol_g).toBeNull();
            } else {
                expect(p.drink_unit).toBeNull();
                expect(p.totals.alcohol_g).toBeNull();
                expect(p.meals.every((m) => m.alcohol_g === null)).toBe(true);
            }
        }
    });

    test("a card's rows must include the meal it announces", () => {
        const logged = {
            description: "a",
            meal_type: "lunch" as const,
            add: { kcal: 1 },
        };
        expect(() =>
            demoMealLoggedPayload({
                date: "2025-09-15",
                logged,
                dayMeals: [{ ...logged }],
                locale: "en",
            }),
        ).toThrow(/dayMeals/);
    });

    test("no card claims a day another card on the page already describes", () => {
        const dates = Object.values(DEMO_EXAMPLE_DATES);
        expect(new Set(dates).size).toBe(dates.length);
        for (const d of dates) {
            expect(d).not.toBe(DEMO_SUMMARY_DATE);
            // The trends series covers the 30 days up to its end date.
            expect(d > DEMO_TRENDS_END_DATE).toBe(true);
        }
        // The goal card reports the weigh-in the weight conversation logged.
        const gp = demoGoalProgressPayload(GOAL_MEALS, "en");
        expect(gp.weight?.logged_on).toBe(DEMO_EXAMPLE_DATES["weight-trend"]);
        expect(gp.weight?.logged_on! <= gp.date).toBe(true);
        expect(gp.goals).toEqual(DEMO_GOALS);
    });

    test("the weigh-ins give the figures the weight conversation quotes", () => {
        const p = demoWeightTrendsPayload("en");
        expect(p.days).toHaveLength(12);
        expect(p.days[0]!.weight).toBe(80.2);
        expect(p.days.at(-1)).toEqual({ date: p.end_date, weight: 78.4 });
        const weekStart = new Date(
            Date.parse(`${p.end_date}T00:00:00Z`) - 6 * 864e5,
        )
            .toISOString()
            .slice(0, 10);
        const week = p.days.filter((d) => d.date >= weekStart);
        const avg = week.reduce((t, d) => t + d.weight, 0) / week.length;
        expect(Math.round(avg * 10) / 10).toBe(78.7);
    });
});

describe("what the English cards print", async () => {
    const cards = Object.fromEntries(
        (await pageCards("en")).map((c) => [c.name, text(c.html)]),
    );

    test("each meal card announces its own meal and calories", () => {
        expect(cards["log-meal"]).toContain("+320 kcal");
        expect(cards["log-meal"]).toContain("Caffeine 95 /400 mg");
        expect(cards["photo-meal"]).toContain("+470 kcal");
        expect(cards["photo-meal"]).not.toContain("Caffeine");
        expect(cards["scan-barcode"]).toContain("+139 kcal");
        expect(cards["scan-barcode"]).toContain("Caffeine 32 /400 mg");
        expect(cards["track-drinks"]).toContain("+180 kcal");
        expect(cards["track-drinks"]).toContain("2.3 UK units");
        for (const slide of ["log-meal", "photo-meal", "scan-barcode"]) {
            expect(cards[slide]).not.toContain("Alcohol");
        }
    });

    test("the goal card prints what the reply quotes", () => {
        expect(cards["goals-progress"]).toContain("1,540 /2,000 kcal");
        expect(cards["goals-progress"]).toContain("460 kcal left");
        expect(cards["goals-progress"]).toContain("56 g left");
        expect(cards["goals-progress"]).toContain("78.4 → 75.0 kg");
    });

    test("the weight card prints what the reply quotes", () => {
        expect(cards["weight-trend"]).toContain("78.4 kg");
        expect(cards["weight-trend"]).toContain("−1.8 kg");
        expect(cards["weight-trend"]).toContain("3.4 kg to lose");
        expect(cards["weight-trend"]).toContain("12 weigh-ins");
    });

    test("the importer is its first step, with no timezone warning", async () => {
        const html = await renderImportFileStep(
            demoStartImportPayload("en"),
            "en",
        );
        expect(
            html.startsWith('<div class="imp"><section class="card c-acc">'),
        ).toBe(true);
        expect(html).toContain('type="file"');
        expect(html).toContain("Step 1 of 4");
        expect(html).not.toContain('class="notice');
        const unset = await renderImportFileStep(
            { ...demoStartImportPayload("en"), tz_configured: false },
            "en",
        );
        expect(unset).toContain("notice-warn");
    });
});

describe.each([...SITE_LOCALES])("the example cards in %s", (locale) => {
    test("render with nothing unfilled", async () => {
        for (const { name, html } of await pageCards(locale)) {
            expect(`${name}: ${html.length > 200}`).toBe(`${name}: true`);
            for (const bad of ["undefined", "NaN", "{", "[object"]) {
                expect(`${name} has ${bad}: ${text(html).includes(bad)}`).toBe(
                    `${name} has ${bad}: false`,
                );
            }
        }
    });

    test("share no ids, and every control points inside its own card", async () => {
        const cards = await pageCards(locale);
        const all: string[] = [];
        for (const { name, html } of cards) {
            const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
            all.push(...ids);
            for (const m of html.matchAll(/aria-controls="([^"]+)"/g)) {
                expect(`${name} -> ${m[1]}: ${ids.includes(m[1]!)}`).toBe(
                    `${name} -> ${m[1]}: true`,
                );
            }
            // The drawer's name element is written when it opens; it is
            // always this drawer's own id plus "-name".
            for (const m of html.matchAll(
                /id="([^"]+)" role="region" aria-labelledby="([^"]+)"/g,
            )) {
                expect(m[2]).toBe(`${m[1]}-name`);
            }
            expect(html).not.toContain('"macro-drawer');
        }
        expect(all.filter((id, i) => all.indexOf(id) !== i)).toEqual([]);
    });

    test("are deterministic, whatever rendered in between", async () => {
        const first = (await pageCards(locale)).map((c) => c.html);
        await pageCards(locale === "en" ? "de" : "en");
        const second = (await pageCards(locale)).map((c) => c.html);
        expect(second).toEqual(first);
    });
});

describe("the renderers refuse what the widget would not draw", () => {
    test("a weight range the toggle does not offer", async () => {
        await expect(
            renderWeightTrendsCard(demoWeightTrendsPayload("en"), "en", 10),
        ).rejects.toThrow(/not one of/);
    });

    test("a meal card with no goals", async () => {
        const p = demoExampleMealLogged("log-meal", "x", "en");
        await expect(
            renderMealLoggedCard({ ...p, has_goals: false, goals: null }, "en"),
        ).rejects.toThrow(/without goals/);
    });
});
