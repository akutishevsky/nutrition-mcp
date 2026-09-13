// The four card partials that four in-chat widgets now render through —
// shared/meal-logged-card.js, shared/goal-progress-card.js,
// shared/weight-trends-card.js and shared/import-card.js — held to the widgets
// that call them.
//
// They were extracted so the public site's landing page can render the same
// cards at build time (src/widget-static.ts), and every template edit ships to
// production chat clients on merge. So the first job of this file is to say,
// against the REAL assembled widget, that a template's render() writes exactly
// what its partial returns — which is what makes the site's card and the chat
// card the same bytes. The second is to pin what the partials add for the site
// (a per-card id prefix, a range passed in rather than read from state) and
// that it moves nothing else.
//
// Same evaluation technique as meal-logged.test.ts: the assembled widget
// script, run as one function with the `initWidget({…})` bootstrap cut off, and
// `document` / `window` handed in as PARAMETERS so nothing global is touched.
import { test, expect, describe } from "bun:test";
import { getWidgetHtml } from "../../src/widgets.js";
import { SITE_REGION_RE } from "../../src/widget-static.js";

const SRC = "./public/widgets/src";

async function scriptOf(key: string): Promise<string> {
    const html = await getWidgetHtml(key);
    const script = html.slice(
        html.lastIndexOf("<script>") + "<script>".length,
        html.lastIndexOf("</script>"),
    );
    const boot = script.indexOf("initWidget({");
    if (boot === -1) throw new Error(`${key}: bootstrap not found`);
    return script.slice(0, boot);
}

type Root = { innerHTML: string } & Record<string, unknown>;

/** Just enough DOM for a strip widget's render(): nothing is open and focus
 *  is nowhere, so macroSnapshot / macroRestore are no-ops. */
function stripDom(): { root: Root; document: unknown } {
    const root: Root = {
        innerHTML: "",
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener() {},
        contains: () => false,
    };
    const document = {
        getElementById: (id: string) => (id === "root" ? root : null),
        querySelector: () => null,
        querySelectorAll: () => [],
        documentElement: { lang: "", setAttribute() {} },
        activeElement: null,
        addEventListener() {},
        hasFocus: () => false,
    };
    return { root, document };
}

type Payload = Record<string, any>;
const THIS_YEAR = new Date().getFullYear();

// ---------------------------------------------------------------- meal-logged

describe("meal-logged renders through shared/meal-logged-card.js", async () => {
    const { root, document } = stripDom();
    const w = new Function(
        "document",
        "window",
        `${await scriptOf("meal-logged")}
         return { render, SAMPLE, mealLoggedCard };`,
    )(document, {}) as {
        render: (d: unknown) => void;
        SAMPLE: Payload;
        mealLoggedCard: (d: unknown, o?: { idPrefix?: string }) => string;
    };
    const S = w.SAMPLE;
    const variants: Record<string, Payload> = {
        sample: S,
        updated: { ...S, action: "updated" },
        pastYear: { ...S, date: `${THIS_YEAR - 1}-11-20` },
        noMeals: { ...S, meals: [] },
        alcohol: {
            ...S,
            drink_unit: "uk",
            goals: { ...S.goals, alcohol_g: 28 },
            totals: { ...S.totals, alcohol_g: 17.9 },
        },
        flOz: { ...S, water_unit: "us_fl_oz" },
        noLoggedMeal: { ...S, logged_meal: null },
    };

    test.each(["en", "de", "ja", "uk"])(
        "render() writes exactly mealLoggedCard() in %s",
        (locale) => {
            for (const [name, v] of Object.entries(variants)) {
                const data = { ...v, locale };
                w.render(data);
                // Same ambient locale and water unit render() just set.
                expect(`${name}: ${root.innerHTML}`).toBe(
                    `${name}: ${w.mealLoggedCard(data)}`,
                );
            }
        },
    );

    test("no goals is an empty card on both paths", () => {
        for (const v of [
            { ...S, has_goals: false },
            { ...S, goals: null },
            null,
        ]) {
            w.render(v);
            expect(root.innerHTML).toBe("");
            expect(w.mealLoggedCard(v)).toBe("");
        }
    });

    test("idPrefix moves the drawer ids and nothing else", () => {
        w.render(S);
        const plain = w.mealLoggedCard(S);
        const a = w.mealLoggedCard(S, { idPrefix: "card-a" });
        expect(a).toContain('id="card-a-drawer"');
        expect(a).toContain('aria-controls="card-a-drawer"');
        expect(a).toContain('aria-labelledby="card-a-drawer-name"');
        expect(a).not.toContain("macro-drawer");
        expect(a.split("card-a-drawer").join("macro-drawer")).toBe(plain);
    });
});

// -------------------------------------------------------------- goal-progress

describe("goal-progress renders through shared/goal-progress-card.js", async () => {
    const { root, document } = stripDom();
    const w = new Function(
        "document",
        "window",
        `${await scriptOf("goal-progress")}
         return { render, SAMPLE, goalProgressCard, goalProgressShowsStrip, weightExtra };`,
    )(document, {}) as {
        render: (d: unknown) => void;
        SAMPLE: Payload;
        goalProgressCard: (
            d: unknown,
            o: { weightExtra?: unknown; idPrefix?: string },
        ) => string;
        goalProgressShowsStrip: (d: unknown) => boolean;
        weightExtra: unknown;
    };
    const S = w.SAMPLE;
    const wt = S.weight;
    const zero = {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        alcohol_g: 0,
        caffeine_mg: null,
        water_ml: 0,
    };
    const empty = { meal_count: 0, water_entries: 0, totals: zero, meals: [] };
    const variants: Record<string, unknown> = {
        sample: S,
        weightNull: { ...S, weight: null },
        noTarget: { ...S, weight: { ...wt, target: null } },
        noReading: { ...S, weight: { ...wt, current: null, logged_on: null } },
        atTarget: { ...S, weight: { ...wt, current: wt.target } },
        pastYear: { ...S, date: `${THIS_YEAR - 1}-11-20` },
        noMeals: { ...S, meals: [] },
        bare: { ...S, ...empty },
        nothing: { ...S, ...empty, weight: null },
        nothingBadDate: { ...S, ...empty, weight: null, date: "nope" },
        nul: null,
    };

    test.each(["en", "de", "ja", "uk"])(
        "render() writes exactly goalProgressCard() in %s",
        (locale) => {
            for (const [name, v] of Object.entries(variants)) {
                const data = v && typeof v === "object" ? { ...v, locale } : v;
                w.render(data);
                expect(`${name}: ${root.innerHTML}`).toBe(
                    `${name}: ${w.goalProgressCard(data, { weightExtra: w.weightExtra })}`,
                );
            }
        },
    );

    test("the strip rule is the one the empty states are chosen by", () => {
        expect(w.goalProgressShowsStrip(S)).toBe(true);
        expect(w.goalProgressShowsStrip(variants.bare)).toBe(true);
        expect(w.goalProgressShowsStrip(variants.nothing)).toBe(false);
        expect(w.goalProgressShowsStrip(null)).toBe(false);
    });

    test("the weight row and the tiles follow idPrefix", () => {
        const html = w.goalProgressCard(
            { ...S, meals: S.meals },
            { weightExtra: w.weightExtra, idPrefix: "card-b" },
        );
        expect(html).toContain(
            'data-macro-extra="weight" aria-expanded="false" aria-controls="card-b-drawer"',
        );
        expect(html).toContain('id="card-b-drawer"');
        expect(html).not.toContain("macro-drawer");
    });

    test("the weight row must be handed in", () => {
        expect(() => w.goalProgressCard(S, {})).toThrow(/weightExtra/);
    });

    // The weight row stays template code, by decision: its two scale glyphs are
    // not to move. The site reads it out of the marked region instead.
    test("weightExtra stays in the template, inside its site-card region", async () => {
        const template = await Bun.file(
            `${SRC}/templates/goal-progress.html`,
        ).text();
        const regions = [...template.matchAll(SITE_REGION_RE)].map(
            (m) => m[1] ?? "",
        );
        expect(regions).toHaveLength(1);
        const region = regions[0]!;
        for (const fn of ["weightNum", "weightFig", "weightExtra"]) {
            expect(region).toContain(`function ${fn}(`);
        }
        expect(region).toContain('glyph("scale", 20)');
        expect(region).toContain('glyph("scale", 18)');
        const partial = await Bun.file(
            `${SRC}/shared/goal-progress-card.js`,
        ).text();
        expect(partial).not.toContain('glyph("scale"');
    });
});

// -------------------------------------------------------------- weight-trends

describe("weight-trends renders through shared/weight-trends-card.js", async () => {
    let metaText = "";
    const meta = {
        style: {} as Record<string, string>,
        getBoundingClientRect: () => ({ height: 10 }),
        get textContent() {
            return metaText;
        },
        set textContent(v: string) {
            metaText = v;
        },
    };
    const body = { innerHTML: "" };
    const root: Root = {
        innerHTML: "",
        addEventListener() {},
        contains: () => false,
        querySelector: (sel: string) =>
            sel === "#wt-body .cwrap"
                ? root.innerHTML.includes('class="cwrap')
                    ? {}
                    : null
                : sel === "#wt-meta" && root.innerHTML.includes('id="wt-meta"')
                  ? meta
                  : null,
        querySelectorAll: () => [],
    };
    const document = {
        getElementById: (id: string) =>
            id === "root"
                ? root
                : id === "wt-body"
                  ? body
                  : id === "wt-meta"
                    ? meta
                    : null,
        documentElement: { lang: "", setAttribute() {} },
        activeElement: null,
        addEventListener() {},
        hasFocus: () => false,
    };
    const w = new Function(
        "document",
        "window",
        `${await scriptOf("weight-trends")}
         return { render, setRange, SAMPLE, STATE, weightTrendsCard, weightTrendsBody, weightTrendsMeta, WEIGHT_RANGES };`,
    )(document, {}) as {
        render: (d: unknown) => void;
        setRange: (n: number) => void;
        SAMPLE: Payload;
        STATE: Payload;
        weightTrendsCard: (d: unknown, r: number, o?: object) => string;
        weightTrendsBody: (d: unknown, r: number, still: boolean) => string;
        weightTrendsMeta: (d: unknown, r: number) => string;
        WEIGHT_RANGES: number[];
    };
    const S = w.SAMPLE;

    test.each(["en", "de", "ja"])(
        "render() and every range change write the partial's output in %s",
        (locale) => {
            for (const def of [30, 14, 7]) {
                const data = { ...S, locale, default_range: def };
                w.render(data);
                expect(root.innerHTML).toBe(
                    w.weightTrendsCard(data, def, { still: false }),
                );
                for (const r of [7, 14, 30]) {
                    if (r === w.STATE.range) continue;
                    w.setRange(r);
                    expect(body.innerHTML).toBe(
                        w.weightTrendsBody(data, r, true),
                    );
                    expect(metaText).toBe(w.weightTrendsMeta(data, r));
                }
            }
        },
    );

    test("the toggle offers WEIGHT_RANGES and presses the range it was given", () => {
        expect(w.WEIGHT_RANGES).toEqual([7, 14, 30]);
        const html = w.weightTrendsCard({ ...S, locale: "en" }, 14);
        const buttons = [
            ...html.matchAll(/data-range="(\d+)" aria-pressed="(true|false)"/g),
        ].map((m) => [Number(m[1]), m[2]]);
        expect(buttons).toEqual([
            [7, "false"],
            [14, "true"],
            [30, "false"],
        ]);
    });

    test("the empty series names its window only when it has an end date", () => {
        const dated = w.weightTrendsCard({ ...S, days: [] }, 7);
        expect(dated).toContain('class="ctitle"');
        expect(dated).not.toContain("data-range");
        const bare = w.weightTrendsCard({ ...S, days: [], end_date: null }, 7);
        expect(bare).not.toContain('class="ctitle"');
        expect(bare).toContain('class="empty"');
    });

    test("a range with no readings keeps the panel shell", () => {
        // Readings only in the first half of the month.
        const early = { ...S, days: S.days.slice(0, 4) };
        const html = w.weightTrendsBody(early, 7, true);
        expect(html).toContain('<span class="v" aria-hidden="true">—</span>');
        expect(html).toContain('class="fspark"');
    });

    test("still is the only thing the flag changes", () => {
        const a = w.weightTrendsBody(S, 30, false);
        const b = w.weightTrendsBody(S, 30, true);
        expect(b).toBe(
            a.replace('class="cwrap c-acc"', 'class="cwrap c-acc still"'),
        );
    });

    test("the template keeps no second escaper and no RANGES of its own", async () => {
        const template = await Bun.file(
            `${SRC}/templates/weight-trends.html`,
        ).text();
        expect(template).toContain("/*@include shared/fmt.js@*/");
        expect(template).toContain(
            "/*@include shared/weight-trends-card.js@*/",
        );
        expect(template).not.toMatch(/function esc\(/);
        expect(template).not.toMatch(/const RANGES\b/);
    });
});

// --------------------------------------------------------------- import-meals

describe("import-meals' first step is shared/import-card.js's", async () => {
    const document = {
        getElementById: () => null,
        activeElement: null,
        hasFocus: () => false,
        addEventListener() {},
    };
    const w = new Function(
        "document",
        "window",
        `${await scriptOf("import-meals")}
         return {
             S,
             setAPI: (a) => { API = a; },
             setCFG: (c) => { CFG = Object.assign({}, CFG, c); },
             setLocale, fileStep, importFileStep, cardHead, esc, SUPPORT_EMAIL,
         };`,
    )(document, {}) as {
        S: Payload;
        setAPI: (a: unknown) => void;
        setCFG: (c: object) => void;
        setLocale: (l: string) => Payload;
        fileStep: () => string;
        importFileStep: (o: object) => string;
        cardHead: (t: string) => string;
        esc: (s: unknown) => string;
        SUPPORT_EMAIL: string;
    };

    test("fileStep() is importFileStep() over the widget's own state", () => {
        const T = w.setLocale("en").importMeals as Record<string, string>;
        for (const tz of [true, false]) {
            for (const api of [
                null,
                { canCallTools: false },
                { canCallTools: true },
            ]) {
                for (const errors of [[], ["Bad <file> & 'x'"]]) {
                    w.setCFG({ tz_configured: tz });
                    w.setAPI(api);
                    w.S.errors = errors;
                    w.S.step = "file";
                    const html = w.fileStep();
                    expect(html).toBe(
                        w.importFileStep({
                            noTools: !!(api && !api.canCallTools),
                            supportEmail: w.SUPPORT_EMAIL,
                            tzConfigured: tz,
                            errors,
                            step: "file",
                        }),
                    );
                    expect(html.includes(w.esc(T.tzWarning))).toBe(!tz);
                    expect(html.includes(w.esc(T.noToolsWarning))).toBe(
                        !!(api && !api.canCallTools),
                    );
                    expect(
                        html.includes("Bad &lt;file&gt; &amp; &#39;x&#39;"),
                    ).toBe(errors.length > 0);
                }
            }
        }
    });

    test("the static picture's step is the file step, controls and all", () => {
        w.setLocale("en");
        const html = w.importFileStep({
            noTools: false,
            supportEmail: null,
            tzConfigured: true,
            errors: [],
            step: "file",
        });
        expect(html).toContain('<section class="card c-acc">');
        expect(html).toContain('<span style="width:25%">');
        expect(html).toContain('type="file"');
        expect(html).toContain(
            '<div class="foot" data-widget-foot></div></section>',
        );
        expect(html).not.toContain('class="notice');
    });

    test("the wrappers keep the importer's escaper and step count", () => {
        expect(w.esc(null)).toBe("");
        expect(w.esc(`<&"'>`)).toBe("&lt;&amp;&quot;&#39;&gt;");
        w.setLocale("en");
        w.S.step = "map";
        expect(w.cardHead("Map")).toContain('<span style="width:50%">');
        w.S.step = "file";
    });
});

// The later steps moved the same way: the site draws still pictures of the map,
// preview and done screens (src/widget-static.ts), so their markup is
// shared/import-card.js's and the template supplies only the data. What these
// pin is that the template's steps ARE those emitters over its own data — no
// inline fork left behind — and that a page's id prefix renames ids and
// nothing else. (The extraction itself was checked byte for byte against the
// pre-extraction template over 102 states in six locales.)
describe("import-meals' later steps are shared/import-card.js's", async () => {
    const document = {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
        activeElement: null,
        hasFocus: () => false,
        addEventListener() {},
    };
    const w = new Function(
        "document",
        "window",
        `${await scriptOf("import-meals")}
         return {
             S,
             setAPI: (a) => { API = a; },
             setCFG: (c) => { CFG = Object.assign({}, CFG, c); },
             setLocale, parseCsv, autoMap, guessSourceApp, resniffDateFormat,
             resniffEnergyUnit, buildRows, diagnosticsBlock,
             fileStep, mapStep, previewStep, doneStep, progressText,
             mapStepData, previewStepData, doneStepData,
             importFileStep, importMapStep, importPreviewStep, importDoneStep,
             impProgressText, impDoneOk,
         };`,
    )(document, {}) as Record<string, any>;

    // A MyFitnessPal-shaped file, and one that trips every notice the map and
    // preview steps have: a BOM, tabs, a totals row, an added-sugar and a
    // grams-caffeine column, an alcohol column, kJ, an unreadable date.
    const FILES: Record<string, string> = {
        mfp:
            "Date,Meal,Calories,Fat (g),Carbohydrates (g),Fiber,Sugar,Protein (g),Note\r\n" +
            Array.from(
                { length: 36 },
                (_, i) =>
                    `2025-03-${String(10 + Math.floor(i / 4)).padStart(2, "0")},${["Breakfast", "Dinner", "Lunch", "Snacks"][i % 4]},${(300 + i * 1.5).toFixed(1)},12.5,40.2,5,9.1,22.3,${i === 2 ? "Pizza & <b>" : ""}`,
            ).join("\r\n") +
            "\r\n",
        odd:
            "﻿Day\tFood Name\tMeal\tEnergy (kJ)\tProtein\tAdded Sugar (g)\tCaffeine (g)\tAlcohol (g)\n" +
            "05/06/2026\tPorridge\tBreakfast\t1300\t9\t4\t0.1\t0\n" +
            "31/31/2026\tToast\tLunch\t900\t5\t2\t0\t14\n" +
            "Totals\t\t\t2200\t14\t6\t0.1\t14\n",
    };

    function load(csv: string, drinkUnit: string | null) {
        w.setCFG({ drink_unit: drinkUnit, max_rows_per_call: 50 });
        w.S.table = w.parseCsv(new TextEncoder().encode(csv));
        w.autoMap();
        w.guessSourceApp();
        w.resniffDateFormat();
        w.resniffEnergyUnit();
        w.S.step = "map";
    }

    test("mapStep / previewStep / doneStep are the emitters over the widget's own data", () => {
        for (const locale of ["en", "ja", "pl"]) {
            w.setLocale(locale);
            for (const [name, csv] of Object.entries(FILES)) {
                for (const drinkUnit of [null, "uk"]) {
                    const at = `${locale} ${name} ${drinkUnit}`;
                    load(csv, drinkUnit);
                    expect(`${at}: ${w.mapStep()}`).toBe(
                        `${at}: ${w.importMapStep(w.mapStepData())}`,
                    );

                    w.buildRows();
                    w.S.step = "preview";
                    for (const api of [
                        null,
                        { canCallTools: false },
                        { canCallTools: true },
                    ]) {
                        for (const busy of [false, true]) {
                            w.setAPI(api);
                            w.S.busy = busy;
                            w.S.progress = busy
                                ? { done: 1, total: 3, label: "x" }
                                : null;
                            w.S.result = busy
                                ? {
                                      created: 0,
                                      deduplicated: 0,
                                      failed: 0,
                                      chunkErrors: ["Rows 2–3: <no>"],
                                      rowErrors: [{ line: 2, message: "m" }],
                                      warnings: [],
                                  }
                                : null;
                            const diag =
                                w.S.badDates > 0 ? w.diagnosticsBlock() : "";
                            expect(w.previewStep()).toBe(
                                w.importPreviewStep({
                                    ...w.previewStepData(),
                                    diagHtml: diag,
                                }),
                            );
                            expect(w.progressText()).toBe(
                                w.impProgressText(w.S.progress),
                            );
                        }
                    }
                    // The support dump is the preview's only on bad dates.
                    expect(w.previewStep().includes('class="diag"')).toBe(
                        w.S.badDates > 0,
                    );

                    w.S.step = "done";
                    w.S.busy = false;
                    w.S.progress = null;
                    for (const result of [
                        null,
                        {
                            created: 3,
                            deduplicated: 0,
                            failed: 0,
                            chunkErrors: [],
                            rowErrors: [],
                            warnings: ["3 row(s) had a date but no time."],
                        },
                        {
                            created: 1,
                            deduplicated: 2,
                            failed: 1,
                            chunkErrors: ["Rows 2–3: rig"],
                            rowErrors: [{ line: 3, message: "bad <x>" }],
                            warnings: [],
                        },
                    ]) {
                        w.S.result = result;
                        const ok = w.impDoneOk(result);
                        expect(w.doneStep()).toBe(
                            w.importDoneStep({
                                ...w.doneStepData(),
                                diagHtml: ok ? "" : w.diagnosticsBlock(),
                            }),
                        );
                        expect(w.doneStep().includes('class="diag"')).toBe(!ok);
                    }
                }
            }
        }
    });

    test("an id prefix renames every id and every reference to one, and nothing else", () => {
        w.setLocale("en");
        load(FILES.odd!, null);
        w.S.errors = ["e"];
        w.setAPI({ canCallTools: false });
        const PRE = "ex-imp-7";
        const screens: [string, (p?: string) => string][] = [
            [
                "file",
                (p) =>
                    w.importFileStep({
                        noTools: true,
                        supportEmail: "",
                        tzConfigured: false,
                        errors: ["e"],
                        step: "file",
                        idPrefix: p,
                    }),
            ],
            [
                "map",
                (p) => w.importMapStep({ ...w.mapStepData(), idPrefix: p }),
            ],
            [
                "preview",
                (p) => {
                    w.buildRows();
                    w.S.step = "preview";
                    return w.importPreviewStep({
                        ...w.previewStepData(),
                        diagHtml: "",
                        idPrefix: p,
                    });
                },
            ],
            [
                "done",
                (p) =>
                    w.importDoneStep({
                        result: {
                            created: 1,
                            deduplicated: 0,
                            failed: 0,
                            chunkErrors: [],
                            rowErrors: [],
                            warnings: [],
                        },
                        skipped: 0,
                        step: "done",
                        diagHtml: "",
                        idPrefix: p,
                    }),
            ],
        ];
        for (const [step, render] of screens) {
            const plain = render();
            const prefixed = render(PRE);
            const ids = [...prefixed.matchAll(/\sid="([^"]+)"/g)].map(
                (m) => m[1]!,
            );
            expect(ids.length).toBeGreaterThan(0);
            for (const id of ids) {
                expect(`${step}: ${id}`).toStartWith(`${step}: ${PRE}-`);
            }
            // Every label and description points at an id on the same screen.
            for (const m of prefixed.matchAll(
                /\s(?:for|aria-describedby)="([^"]+)"/g,
            )) {
                expect(`${step} -> ${m[1]}: ${ids.includes(m[1]!)}`).toBe(
                    `${step} -> ${m[1]}: true`,
                );
            }
            // Strip the prefix back off and it is the chat card, byte for byte.
            expect(
                prefixed.replace(
                    new RegExp(`\\s(id|for|aria-describedby)="${PRE}-`, "g"),
                    (m) => m.replace(`${PRE}-`, ""),
                ),
            ).toBe(plain);
        }
        // The preview with no tools is the one screen with aria-describedby.
        expect(screens[2]![1](PRE)).toContain(
            `aria-describedby="${PRE}-no-tools-why"`,
        );
    });

    test("the template writes no step markup of its own any more", async () => {
        const template = await Bun.file(
            `${SRC}/templates/import-meals.html`,
        ).text();
        const script = template.slice(template.indexOf("<script>"));
        expect(script).toContain("/*@include shared/import-card.js@*/");
        for (const markup of [
            '<div class="stat-row">',
            '<div class="map-grid">',
            'id="doImport"',
            'id="restart"',
            "function formatFieldsHtml(",
        ]) {
            expect(`${markup}: ${script.includes(markup)}`).toBe(
                `${markup}: false`,
            );
        }
    });
});
