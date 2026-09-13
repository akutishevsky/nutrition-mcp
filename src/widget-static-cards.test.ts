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
    IMPORT_STEPS,
    importFlowSummary,
    renderGoalProgressCard,
    renderImportFileStep,
    renderImportStep,
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
    DEMO_IMPORT_FIRST_DAY,
    DEMO_IMPORT_LAST_DAY,
    DEMO_SUMMARY_DATE,
    DEMO_TRENDS_END_DATE,
    demoExampleMealLogged,
    demoGoalProgressPayload,
    demoImportFile,
    demoMealLoggedPayload,
    demoStartImportPayload,
    demoWeightTrendsPayload,
    validateDemoPayload,
    type DemoExampleMealSlide,
} from "./copy/widget-demo.js";
import { SITE_LOCALES, type SiteLocale } from "./routes.js";

/** The MyFitnessPal export the import conversation picks. */
const IMPORT_FILE = demoImportFile();

// The meal descriptions are the page's copy; English stand-ins here.
const MEAL_TEXT: Record<DemoExampleMealSlide, string> = {
    "log-meal":
        "Oatmeal with milk and blueberries (1 bowl) and black coffee (1 cup)",
    "photo-meal":
        "Beef borscht (1 bowl, finished) with sour cream (2 tbsp) and rye bread (1 slice)",
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
    // The importer's four screens, as the import conversation shows them one
    // after another in one thread — so each under its own prefix.
    for (const step of IMPORT_STEPS) {
        cards.push({
            name: `import-history-${step}`,
            html: await renderImportStep(
                step,
                demoStartImportPayload(locale),
                locale,
                {
                    file: IMPORT_FILE,
                    idPrefix: `ex-import-history-${step}`,
                },
            ),
        });
    }
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
        expect(cards["scan-barcode"]).toContain("Caffeine 33 /400 mg");
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

describe("the importer's screens", () => {
    test("the demo export is shaped like a current MyFitnessPal file", () => {
        const { fileName, csv } = IMPORT_FILE;
        expect(demoImportFile()).toEqual(IMPORT_FILE);
        expect(fileName).toBe("Nutrition-Summary-2025-03-24-to-2025-09-21.csv");
        expect(DEMO_IMPORT_FIRST_DAY).toBe("2025-03-24");
        // Ends the day before the conversation, which is the importer's today.
        expect(DEMO_IMPORT_LAST_DAY).toBe("2025-09-21");
        expect(demoStartImportPayload("en").today).toBe(
            DEMO_EXAMPLE_DATES["import-history"],
        );
        // No BOM, CRLF, twenty columns with no Time and no food name, no
        // totals row at the end.
        expect(csv.charCodeAt(0)).toBe("D".charCodeAt(0));
        const lines = csv.split("\r\n");
        expect(lines.at(-1)).toBe("");
        expect(csv.replace(/\r\n/g, "")).not.toContain("\n");
        const header = lines[0]!.split(",");
        expect(header).toHaveLength(20);
        expect(header.slice(0, 3)).toEqual(["Date", "Meal", "Calories"]);
        expect(header).not.toContain("Time");
        const rows = lines.slice(1, -1).map((l) => l.split(","));
        expect(rows).toHaveLength(603);
        expect(rows.every((r) => r.length === 20)).toBe(true);
        expect(rows.some((r) => /total/i.test(r[0]!))).toBe(false);
        expect(new Set(rows.map((r) => r[0])).size).toBe(163);
        expect(rows[0]!.slice(0, 3)).toEqual([
            "2025-03-24",
            "Breakfast",
            "367.0",
        ]);
        expect(rows.at(-1)![0]).toBe(DEMO_IMPORT_LAST_DAY);
    });

    test("the importer's own run over it: every figure the conversation quotes", async () => {
        expect(
            await importFlowSummary(demoStartImportPayload("en"), IMPORT_FILE),
        ).toEqual({
            fileName: IMPORT_FILE.fileName,
            fileRows: 603,
            columns: 20,
            rows: 603,
            skipped: 0,
            kcal: 322343,
            batches: 13,
            // The first batch is dry-run first, then written.
            toolCalls: 14,
            created: 603,
            deduplicated: 0,
            failed: 0,
            warnings: [
                "603 row(s) had no food name in the source; a placeholder description was used.",
                "603 row(s) had a date but no time; they were logged at local noon.",
            ],
            modelContext:
                "Bulk meal import finished: 603 meals imported, 0 already logged, 0 failed. Source: Nutrition-Summary-2025-03-24-to-2025-09-21.csv.",
            sourceApp: "myfitnesspal",
        });
    });

    test("the English screens print what the conversation says", async () => {
        const payload = demoStartImportPayload("en");
        const screen = async (step: (typeof IMPORT_STEPS)[number]) => {
            const html = await renderImportStep(step, payload, "en", {
                file: IMPORT_FILE,
            });
            expect(
                html.startsWith('<div class="imp"><section class="card'),
            ).toBe(true);
            return html;
        };

        const map = await screen("map");
        expect(text(map)).toContain(
            "Map columns Step 2 of 4 603 rows 20 columns utf-8, delimiter ,",
        );
        // No BOM and no totals row, so the parser has nothing to warn about.
        expect(map).not.toContain('class="notice');
        expect(map).toContain(
            'data-field="description" aria-label="Food name"><option value="-1" selected>(not in this file)</option>',
        );
        expect(map).toContain('value="myfitnesspal"');
        expect(text(map)).toContain("2025-03-24 → 2025-03-24");
        expect(text(map)).toContain("367 kcal → 367 kcal (no conversion)");

        const preview = await screen("preview");
        const p = text(preview);
        expect(p).toContain(
            "603 meals to import 322,343 kcal total 13 batches Dates read as Year-Month-Day; energy read as kcal.",
        );
        expect(p).not.toContain("skipped");
        expect(p).toContain(
            "603 rows have a date but no time — they will be logged at midday.",
        );
        expect(p).toContain("(no name — will be labelled by meal)");
        expect(p).toContain("Showing 30 of 603 rows");
        expect(preview).toContain(">Import 603 meals</button>");
        expect(preview).not.toContain("disabled");
        expect(preview).not.toContain('class="diag"');

        const done = await screen("done");
        expect(text(done)).toBe(
            "Import complete Step 4 of 4 603 meals imported. " +
                "603 row(s) had no food name in the source; a placeholder description was used. " +
                "603 row(s) had a date but no time; they were logged at local noon. " +
                "Import another file",
        );
        expect(done).toContain("notice-ok");
    });

    // The site's pictures against the widget itself: the assembled
    // import-meals script, run over the same file with its bulk_import_meals
    // calls going to the real src/import.ts, printing its own mapStep /
    // previewStep / doneStep in each locale. Independent of the path
    // src/widget-static.ts takes to the same data, so a drift in either shows.
    test("every screen is what the widget itself prints for that file, in every locale", async () => {
        const { getWidgetHtml } = await import("./widgets.js");
        const { runImport, serializeImportResult } =
            await import("./import.js");
        const html = await getWidgetHtml("import-meals");
        const script = html.slice(
            html.lastIndexOf("<script>") + "<script>".length,
            html.lastIndexOf("</script>"),
        );
        const w = new Function(
            "document",
            "window",
            `${script.slice(0, script.indexOf("initWidget({"))}
             return {
                 S, setLocale, parseCsv, autoMap, guessSourceApp,
                 resniffDateFormat, resniffEnergyUnit, buildRows, runImport,
                 mapStep, previewStep, doneStep,
                 setCFG: (c) => { CFG = Object.assign({}, CFG, c); },
                 setAPI: (a) => { API = a; },
             };`,
        )(
            {
                getElementById: () => null,
                activeElement: null,
                hasFocus: () => false,
            },
            {},
        ) as Record<string, any>;
        const payload = demoStartImportPayload("en");
        const keys = new Set<string>();
        w.setCFG(payload);
        w.setAPI({
            canCallTools: true,
            hostContext: {},
            updateModelContext() {},
            callTool: async (_name: string, args: unknown) => {
                const result = await runImport(
                    JSON.parse(JSON.stringify(args)),
                    {
                        userId: "u",
                        tz: payload.tz,
                        tzConfigured: payload.tz_configured,
                        nowMs: Date.parse(`${payload.today}T12:00:00Z`),
                        insert: async (input) => {
                            const k = input.idempotency_key ?? "";
                            const deduplicated = keys.has(k);
                            keys.add(k);
                            return { meal: input as never, deduplicated };
                        },
                        existingKeys: async (ks) =>
                            new Set(ks.filter((k) => keys.has(k))),
                        existingMealIds: async () => new Set(),
                    },
                );
                return { structuredContent: serializeImportResult(result) };
            },
        });
        const widget: Record<string, Record<string, string>> = {
            map: {},
            preview: {},
            done: {},
        };
        const each = (step: string, fn: () => string) => {
            for (const locale of SITE_LOCALES) {
                w.setLocale(locale);
                widget[step]![locale] = fn();
            }
        };
        w.S.fileName = IMPORT_FILE.fileName;
        w.S.table = w.parseCsv(new TextEncoder().encode(IMPORT_FILE.csv));
        w.autoMap();
        w.guessSourceApp();
        w.resniffDateFormat();
        w.resniffEnergyUnit();
        w.S.step = "map";
        each("map", () => w.mapStep());
        w.buildRows();
        w.S.step = "preview";
        w.S.result = null;
        each("preview", () => w.previewStep());
        w.setLocale("en");
        await w.runImport();
        expect(w.S.step).toBe("done");
        each("done", () => w.doneStep());

        for (const locale of SITE_LOCALES) {
            for (const step of ["map", "preview", "done"] as const) {
                const site = await renderImportStep(
                    step,
                    demoStartImportPayload(locale),
                    locale,
                    { file: IMPORT_FILE },
                );
                expect(
                    site === `<div class="imp">${widget[step]![locale]}</div>`,
                    `${locale} ${step}: the site's picture is not what the widget prints`,
                ).toBe(true);
            }
        }
    });

    test("a later screen without a file is refused", async () => {
        await expect(
            renderImportStep("map", demoStartImportPayload("en"), "en"),
        ).rejects.toThrow(/needs a file/);
    });

    test("a file that would put the support diagnostics on the page is refused", async () => {
        const bad = {
            fileName: "bad.csv",
            csv: "Date,Food,Calories\r\n31/31/2026,Toast,100\r\n2026-07-18,Tea,5\r\n",
        };
        await expect(
            renderImportStep("preview", demoStartImportPayload("en"), "en", {
                file: bad,
            }),
        ).rejects.toThrow(/unreadable dates/);
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
